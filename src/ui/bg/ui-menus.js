/*
 * Copyright 2010-2020 Gildas Lormeau
 * contact : gildas.lormeau <at> gmail.com
 *
 * This file is part of SingleFile.
 *
 *   The code in this file is free software: you can redistribute it and/or
 *   modify it under the terms of the GNU Affero General Public License
 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
 *   of the License, or (at your option) any later version.
 *
 *   The code in this file is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero
 *   General Public License for more details.
 *
 *   As additional permission under GNU AGPL version 3 section 7, you may
 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU
 *   AGPL normally required by section 4, provided you include this license
 *   notice and a URL through which recipients can access the Corresponding
 *   Source.
 */

/* global browser, URL, setTimeout, clearTimeout */

import * as config from "./../../core/bg/config.js";
import { queryTabs } from "./../../core/bg/tabs-util.js";
import * as tabsData from "./../../core/bg/tabs-data.js";

import { refreshAutoSaveTabs } from "./../../core/bg/autosave-util.js";
import * as button from "./ui-button.js";
import { ACTIONS, CONTEXTS, getDefaultLayout } from "./../common/menu-layout.js";

const menus = browser.menus;
const BROWSER_MENUS_API_SUPPORTED = config.BROWSER_MENUS_API_SUPPORTED;
const PAGE_CONTEXTS = {
	page: ["page", "image", "video", "audio"],
	selection: ["selection"],
	frame: ["frame"],
	link: ["link"]
};
const SURFACE_CONTEXTS = {
	button: ["browser_action"],
	tab: ["tab"]
};
const EDITOR_HIDDEN_ACTIONS = ["edit-and-save-page", "save-selected-links", "save-selection", "save-frame", "auto-save", "domain-rule"];
const AUTO_SAVE_MODES = [
	{ mode: "disabled", labelKey: "menuAutoSaveDisabled" },
	{ mode: "tab", labelKey: "menuAutoSaveTab" },
	{ mode: "unpinned", labelKey: "menuAutoSaveUnpinnedTabs" },
	{ mode: "all", labelKey: "menuAutoSaveAllTabs" }
];
const MENU_CREATE_DOMAIN_RULE_MESSAGE = browser.i18n.getMessage("menuCreateDomainRule");
const MENU_UPDATE_RULE_MESSAGE = browser.i18n.getMessage("menuUpdateRule");
const PROFILE_DEFAULT_SETTINGS_MESSAGE = browser.i18n.getMessage("profileDefaultSettings");
const REFRESH_MENUS_DELAY = 1000;

const menusCheckedState = new Map();
const menusTitleState = new Map();
let menuItems = new Map();
let contextMenuVisibleState = true;
let allMenuVisibleState = true;
let menusCreated, pendingRefresh, business, refreshMenusTimeout;
Promise.resolve().then(initialize);
if (BROWSER_MENUS_API_SUPPORTED) {
	browser.storage.onChanged.addListener(onStorageChanged);
}
export {
	onMessage,
	refreshTab as onTabCreated,
	refreshTab as onTabActivated,
	refreshTab as onInit,
	createMenus as refreshTab,
	init
};

function init(businessApi) {
	business = businessApi;
}

function onMessage(message) {
	if (message.method.endsWith("refreshMenu")) {
		createMenus();
		return Promise.resolve({});
	}
}

async function createMenus(tab) {
	const [profiles, allTabsData, menuLayout] = await Promise.all([config.getProfiles(), tabsData.get(), config.getMenuLayout()]);
	let options = await config.getOptions(tab && tab.url);
	if (BROWSER_MENUS_API_SUPPORTED && options) {
		if (options.profileName == config.DISABLED_PROFILE_NAME) {
			options = await config.getOptions();
			options.profileName = config.DISABLED_PROFILE_NAME;
		}
		if (options.tabMenuEnabled) {
			try {
				await menus.create({
					id: "temporary-id",
					contexts: ["tab"],
					title: "title"
				});
				// eslint-disable-next-line no-unused-vars
			} catch (error) {
				options.tabMenuEnabled = false;
			}
		}
		await menus.removeAll();
		menuItems = new Map();
		menusCheckedState.clear();
		menusTitleState.clear();
		const layout = menuLayout || getDefaultLayout();
		const state = {
			profiles,
			profileNames: Object.keys(profiles),
			allTabsData,
			rule: tab && tab.url ? await config.getRule(tab.url, true) : undefined
		};
		if (options.contextMenuEnabled) {
			createEntries("page", layout.page, state);
		}
		if (options.browserActionMenuEnabled) {
			createEntries("button", layout.button, state);
		}
		if (options.tabMenuEnabled) {
			createEntries("tab", layout.tab, state);
		}
	}
	menusCreated = true;
	if (pendingRefresh) {
		pendingRefresh = false;
		(await browser.tabs.query({})).forEach(async tab => await refreshTab(tab));
	}
}

function createEntries(surface, entries, state, parentId) {
	entries.forEach((entry, index) => createEntry(surface, entry, (parentId || surface) + "-" + index, state, parentId));
}

function isActionSupported(action) {
	if (action == "auto-save") {
		return config.AUTO_SAVE_SUPPORTED;
	}
	if (action == "save-selected-tabs") {
		return config.SELECTABLE_TABS_SUPPORTED;
	}
	return true;
}

function isRenderable(surface, entry, state) {
	const definition = ACTIONS[entry.action];
	if (!definition || (definition.surfaces && !definition.surfaces.includes(surface)) || !isActionSupported(entry.action) || !getContexts(surface, entry).length) {
		return false;
	}
	if (definition.dynamic && definition.dynamic != "radio-autosave") {
		return state.profileNames.length > 1;
	}
	if (definition.container) {
		return entry.children.some(child => isRenderable(surface, child, state));
	}
	return true;
}

function createEntry(surface, entry, id, state, parentId) {
	const definition = ACTIONS[entry.action];
	if (!isRenderable(surface, entry, state)) {
		return;
	}
	const contexts = getContexts(surface, entry);
	const properties = { id, contexts };
	if (parentId) {
		properties.parentId = parentId;
	}
	if (definition.separator) {
		menus.create(Object.assign(properties, { type: "separator" }));
	} else if (definition.dynamic) {
		createDynamicEntry(surface, entry, properties, state);
	} else {
		const profileName = entry.profile && state.profiles[entry.profile] ? entry.profile : undefined;
		const title = getTitle(entry, profileName);
		menus.create(Object.assign(properties, { title }));
		registerItem(id, { action: entry.action, entry, surface, profileName, title });
		if (definition.container) {
			createEntries(surface, entry.children, state, id);
		}
	}
}

function createDynamicEntry(surface, entry, properties, state) {
	const definition = ACTIONS[entry.action];
	const { id, contexts, parentId } = properties;
	const item = { action: entry.action, entry, surface };
	if (definition.dynamic == "profiles") {
		if (state.profileNames.length > 1) {
			let profilesParentId = parentId;
			if (!entry.inline) {
				menus.create(Object.assign(properties, { title: getTitle(entry) }));
				registerItem(id, item);
				profilesParentId = id;
			}
			state.profileNames.forEach((profileName, index) => {
				const profileItemId = id + "-p" + index;
				menus.create({
					id: profileItemId,
					contexts,
					parentId: profilesParentId,
					title: getProfileTitle(profileName)
				});
				registerItem(profileItemId, { action: "save-page", entry, surface, profileName });
			});
		}
	} else if (definition.dynamic == "radio-profiles") {
		if (state.profileNames.length > 1) {
			menus.create(Object.assign(properties, { title: getTitle(entry) }));
			registerItem(id, item);
			const selectedProfileName = state.allTabsData.profileName || config.DEFAULT_PROFILE_NAME;
			state.profileNames.forEach((profileName, index) => {
				createRadioItem(id + "-p" + index, contexts, id, getProfileTitle(profileName), selectedProfileName == profileName, { action: "select-profile", entry, surface, profileName });
			});
		}
	} else if (definition.dynamic == "radio-rule") {
		if (state.profileNames.length > 1) {
			const title = entry.label || MENU_CREATE_DOMAIN_RULE_MESSAGE;
			menus.create(Object.assign(properties, { title }));
			registerItem(id, Object.assign(item, { title }));
			menusTitleState.set(id, title);
			const rule = state.rule;
			createRadioItem(id + "-current", contexts, id, config.CURRENT_PROFILE_NAME, !rule || rule.profile == config.CURRENT_PROFILE_NAME, { action: "domain-rule", entry, surface, profileName: config.CURRENT_PROFILE_NAME });
			state.profileNames.forEach((profileName, index) => {
				createRadioItem(id + "-p" + index, contexts, id, getProfileTitle(profileName), Boolean(rule) && rule.profile == profileName, { action: "domain-rule", entry, surface, profileName });
			});
		}
	} else if (definition.dynamic == "radio-autosave") {
		menus.create(Object.assign(properties, { title: getTitle(entry) }));
		registerItem(id, item);
		AUTO_SAVE_MODES.forEach(({ mode, labelKey }) => {
			createRadioItem(id + "-" + mode, contexts, id, browser.i18n.getMessage(labelKey), mode == "disabled", { action: "auto-save", entry, surface, mode });
		});
	}
}

function createRadioItem(id, contexts, parentId, title, checked, item) {
	menus.create({
		id,
		type: "radio",
		contexts,
		parentId,
		title,
		checked
	});
	menusCheckedState.set(id, checked);
	registerItem(id, item);
}

function registerItem(id, item) {
	menuItems.set(id, item);
}

function getContexts(surface, entry) {
	if (surface == "page") {
		const contexts = entry.contexts || ACTIONS[entry.action].contexts || CONTEXTS;
		return contexts.flatMap(context => PAGE_CONTEXTS[context] || []);
	}
	return SURFACE_CONTEXTS[surface] || [];
}

function getTitle(entry, profileName) {
	if (entry.label) {
		return entry.label;
	}
	const title = browser.i18n.getMessage(ACTIONS[entry.action].labelKey);
	return profileName ? title + " (" + getProfileTitle(profileName) + ")" : title;
}

function getProfileTitle(profileName) {
	return profileName == config.DEFAULT_PROFILE_NAME ? PROFILE_DEFAULT_SETTINGS_MESSAGE : profileName;
}

function getItems(action) {
	return Array.from(menuItems.entries()).filter(([, item]) => item.action == action);
}

async function getProfileOptions(profileName) {
	if (profileName) {
		const profiles = await config.getProfiles();
		if (profiles[profileName]) {
			return Object.assign({}, profiles[profileName], { profileName });
		}
	}
	return {};
}

async function initialize() {
	if (BROWSER_MENUS_API_SUPPORTED) {
		createMenus();
		menus.onClicked.addListener(async (event, tab) => {
			const item = menuItems.get(event.menuItemId);
			if (!item) {
				return;
			}
			const profileOptions = await getProfileOptions(item.profileName);
			if (item.action == "save-page") {
				if (event.linkUrl) {
					business.saveUrls([event.linkUrl], profileOptions);
				} else {
					business.saveTabs([tab], profileOptions);
				}
			}
			if (item.action == "edit-and-save-page") {
				const allTabsData = await tabsData.get(tab.id);
				if (allTabsData[tab.id].savedPageDetected) {
					business.openEditor(tab);
				} else {
					const options = Object.assign(profileOptions, { openEditor: true });
					if (event.linkUrl) {
						business.saveUrls([event.linkUrl], options);
					} else {
						business.saveTabs([tab], options);
					}
				}
			}
			if (item.action == "save-selected-links") {
				business.saveSelectedLinks(tab);
			}
			if (item.action == "view-pendings") {
				await browser.tabs.create({ active: true, url: "/src/ui/pages/pendings.html" });
			}
			if (item.action == "save-selection") {
				business.saveTabs([tab], Object.assign(profileOptions, { selected: true }));
			}
			if (item.action == "save-frame") {
				business.saveTabs([tab], { frameId: event.frameId });
			}
			if (item.action == "save-selected-tabs") {
				const tabs = await queryTabs({ currentWindow: true, highlighted: true });
				business.saveTabs(tabs, profileOptions);
			}
			if (item.action == "save-unpinned-tabs") {
				const tabs = await queryTabs({ currentWindow: true, pinned: false });
				business.saveTabs(tabs, profileOptions);
			}
			if (item.action == "save-all-tabs") {
				const tabs = await queryTabs({ currentWindow: true });
				business.saveTabs(tabs, profileOptions);
			}
			if (item.action == "batch-save-urls") {
				business.batchSaveUrls();
			}
			if (item.action == "auto-save") {
				const allTabsData = await tabsData.get(tab.id);
				if (item.mode == "tab") {
					allTabsData[tab.id].autoSave = true;
				}
				if (item.mode == "disabled") {
					Object.keys(allTabsData).forEach(tabId => {
						if (typeof allTabsData[tabId] == "object" && allTabsData[tabId].autoSave) {
							allTabsData[tabId].autoSave = false;
						}
					});
					allTabsData.autoSaveUnpinned = allTabsData.autoSaveAll = false;
				}
				if (item.mode == "all") {
					allTabsData.autoSaveAll = event.checked;
				}
				if (item.mode == "unpinned") {
					allTabsData.autoSaveUnpinned = event.checked;
				}
				await tabsData.set(allTabsData);
				refreshExternalComponents(tab);
			}
			if (item.action == "select-profile") {
				const allTabsData = await tabsData.get();
				allTabsData.profileName = item.profileName;
				await tabsData.set(allTabsData);
				refreshExternalComponents(tab);
			}
			if (item.action == "domain-rule") {
				const rule = await config.getRule(tab.url, true);
				if (rule) {
					await config.updateRule(rule.url, rule.url, item.profileName, item.profileName);
				} else {
					await Promise.all(getItems("domain-rule").map(([id, ruleItem]) => updateTitleValue(id, ruleItem.entry.label || MENU_UPDATE_RULE_MESSAGE)));
					await config.addRule(new URL(tab.url).hostname, item.profileName, item.profileName);
				}
			}
		});
		if (menusCreated) {
			pendingRefresh = true;
		} else {
			(await browser.tabs.query({})).forEach(async tab => await refreshTab(tab));
		}
	}
}

async function onStorageChanged(changes, areaName) {
	const changedKeys = Object.keys(changes);
	let menusStale = areaName == "local" && changedKeys.includes("sync");
	if (!menusStale && (changedKeys.includes("rules") || changedKeys.includes(config.MENU_LAYOUT_KEY) || changedKeys.some(key => key.startsWith(config.PROFILE_NAME_PREFIX)))) {
		const { sync } = await browser.storage.local.get(["sync"]);
		menusStale = areaName == (sync ? "sync" : "local");
	}
	if (menusStale) {
		if (refreshMenusTimeout) {
			clearTimeout(refreshMenusTimeout);
		}
		refreshMenusTimeout = setTimeout(refreshMenus, REFRESH_MENUS_DELAY);
	}
}

async function refreshMenus() {
	refreshMenusTimeout = null;
	const [tab] = await queryTabs({ currentWindow: true, active: true });
	await createMenus(tab);
	if (tab) {
		await refreshTab(tab);
	}
}

async function refreshExternalComponents(tab) {
	const allTabsData = await tabsData.get(tab.id);
	await refreshAutoSaveTabs();
	await button.refreshTab(tab);
	try {
		await browser.runtime.sendMessage({ method: "options.refresh", profileName: allTabsData.profileName });
		// eslint-disable-next-line no-unused-vars
	} catch (error) {
		// ignored
	}
}

async function refreshTab(tab) {
	if (BROWSER_MENUS_API_SUPPORTED && menusCreated) {
		const promises = [];
		const allTabsData = await tabsData.get(tab.id);
		if (allTabsData[tab.id].editorDetected) {
			updateAllVisibleValues(false);
		} else {
			updateAllVisibleValues(true);
			getItems("auto-save").forEach(([id, item]) => {
				if (item.mode == "disabled") {
					promises.push(updateCheckedValue(id, !allTabsData[tab.id].autoSave));
				} else if (item.mode == "tab") {
					promises.push(updateCheckedValue(id, allTabsData[tab.id].autoSave));
				} else if (item.mode == "unpinned") {
					promises.push(updateCheckedValue(id, Boolean(allTabsData.autoSaveUnpinned)));
				} else if (item.mode == "all") {
					promises.push(updateCheckedValue(id, Boolean(allTabsData.autoSaveAll)));
				}
			});
			if (tab && tab.url) {
				const options = await config.getOptions(tab.url);
				promises.push(updateVisibleValue(tab, options.contextMenuEnabled));
				const savedPageDetected = allTabsData[tab.id].savedPageDetected;
				getItems("edit-and-save-page").forEach(([id, item]) => {
					const title = savedPageDetected && !item.entry.label ? browser.i18n.getMessage(ACTIONS[item.action].altLabelKey) : item.title;
					promises.push(updateTitleValue(id, title));
					promises.push(menus.update(id, { visible: !options.openEditor || savedPageDetected }));
				});
				if (config.SELECTABLE_TABS_SUPPORTED) {
					getItems("save-selection").forEach(([id]) => promises.push(menus.update(id, { visible: !options.saveRawPage })));
				}
				const [profiles, rule] = await Promise.all([config.getProfiles(), config.getRule(tab.url)]);
				const profileNames = Object.keys(profiles);
				if (profileNames.length > 1) {
					let selectedProfileName = config.DEFAULT_PROFILE_NAME;
					let ruleTitle = MENU_CREATE_DOMAIN_RULE_MESSAGE;
					if (rule && rule.profile != config.DEFAULT_PROFILE_NAME && profiles[rule.profile]) {
						selectedProfileName = rule.profile;
						ruleTitle = MENU_UPDATE_RULE_MESSAGE;
					}
					getItems("domain-rule").forEach(([id, item]) => {
						if (item.profileName) {
							promises.push(updateCheckedValue(id, item.profileName == selectedProfileName));
						} else {
							promises.push(updateTitleValue(id, item.entry.label || ruleTitle));
						}
					});
				}
			}
		}
		await Promise.all(promises);
	}
}

async function updateAllVisibleValues(visible) {
	const lastVisibleState = allMenuVisibleState;
	allMenuVisibleState = visible;
	if (lastVisibleState === undefined || lastVisibleState != visible) {
		const promises = [];
		try {
			menuItems.forEach((item, id) => {
				if (EDITOR_HIDDEN_ACTIONS.includes(item.action)) {
					promises.push(menus.update(id, { visible }));
				}
			});
			await Promise.all(promises);
			// eslint-disable-next-line no-unused-vars
		} catch (error) {
			// ignored
		}
	}
}

async function updateVisibleValue(tab, visible) {
	const lastVisibleState = contextMenuVisibleState;
	contextMenuVisibleState = visible;
	if (lastVisibleState === undefined || lastVisibleState != visible) {
		await createMenus(tab);
	}
}

async function updateTitleValue(id, title) {
	const lastTitleValue = menusTitleState.get(id);
	try {
		if (lastTitleValue === undefined) {
			await menus.update(id, { title });
		} else if (lastTitleValue != title) {
			await menus.update(id, { title });
		}
		menusTitleState.set(id, title);
		// eslint-disable-next-line no-unused-vars
	} catch (error) {
		// ignored
	}
}

async function updateCheckedValue(id, checked) {
	checked = Boolean(checked);
	try {
		await menus.update(id, { checked });
		menusCheckedState.set(id, checked);
		// eslint-disable-next-line no-unused-vars
	} catch (error) {
		// ignored
	}
}
