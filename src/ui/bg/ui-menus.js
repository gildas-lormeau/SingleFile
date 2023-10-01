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

/* global browser, URL */

import * as config from "./../../core/bg/config.js";
import { queryTabs } from "./../../core/bg/tabs-util.js";
import * as tabsData from "./../../core/bg/tabs-data.js";

import { refreshAutoSaveTabs } from "./../../core/bg/autosave-util.js";
import * as button from "./ui-button.js";

const menus = browser.menus;
const BROWSER_MENUS_API_SUPPORTED = menus && menus.onClicked && menus.create && menus.update && menus.removeAll;
const MENU_ID_SAVE_PAGE = "save-page";
const MENU_ID_EDIT_AND_SAVE_PAGE = "edit-and-save-page";
const MENU_ID_SAVE_WITH_PROFILE = "save-with-profile";
const MENU_ID_SAVE_SELECTED_LINKS = "save-selected-links";
const MENU_ID_VIEW_PENDINGS = "view-pendings";
const MENU_ID_SELECT_PROFILE = "select-profile";
const MENU_ID_SAVE_WITH_PROFILE_PREFIX = "wasve-with-profile-";
const MENU_ID_SELECT_PROFILE_PREFIX = "select-profile-";
const MENU_ID_ASSOCIATE_WITH_PROFILE = "associate-with-profile";
const MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX = "associate-with-profile-";
const MENU_ID_SAVE_SELECTED = "save-selected";
const MENU_ID_SAVE_FRAME = "save-frame";
const MENU_ID_SAVE_TABS = "save-tabs";
const MENU_ID_SAVE_SELECTED_TABS = "save-selected-tabs";
const MENU_ID_SAVE_UNPINNED_TABS = "save-unpinned-tabs";
const MENU_ID_SAVE_ALL_TABS = "save-all-tabs";
const MENU_ID_BATCH_SAVE_URLS = "batch-save-urls";
const MENU_ID_BUTTON_SAVE_SELECTED_TABS = "button-" + MENU_ID_SAVE_SELECTED_TABS;
const MENU_ID_BUTTON_SAVE_UNPINNED_TABS = "button-" + MENU_ID_SAVE_UNPINNED_TABS;
const MENU_ID_BUTTON_SAVE_ALL_TABS = "button-" + MENU_ID_SAVE_ALL_TABS;
const MENU_ID_AUTO_SAVE = "auto-save";
const MENU_ID_AUTO_SAVE_DISABLED = "auto-save-disabled";
const MENU_ID_AUTO_SAVE_TAB = "auto-save-tab";
const MENU_ID_AUTO_SAVE_UNPINNED = "auto-save-unpinned";
const MENU_ID_AUTO_SAVE_ALL = "auto-save-all";
const MENU_CREATE_DOMAIN_RULE_MESSAGE = browser.i18n.getMessage("menuCreateDomainRule");
const MENU_UPDATE_RULE_MESSAGE = browser.i18n.getMessage("menuUpdateRule");
const MENU_SAVE_PAGE_MESSAGE = browser.i18n.getMessage("menuSavePage");
const MENU_SAVE_WITH_PROFILE = browser.i18n.getMessage("menuSaveWithProfile");
const MENU_SAVE_SELECTED_LINKS = browser.i18n.getMessage("menuSaveSelectedLinks");
const MENU_EDIT_PAGE_MESSAGE = browser.i18n.getMessage("menuEditPage");
const MENU_EDIT_AND_SAVE_PAGE_MESSAGE = browser.i18n.getMessage("menuEditAndSavePage");
const MENU_VIEW_PENDINGS_MESSAGE = browser.i18n.getMessage("menuViewPendingSaves");
const MENU_SAVE_SELECTION_MESSAGE = browser.i18n.getMessage("menuSaveSelection");
const MENU_SAVE_FRAME_MESSAGE = browser.i18n.getMessage("menuSaveFrame");
const MENU_SAVE_TABS_MESSAGE = browser.i18n.getMessage("menuSaveTabs");
const MENU_SAVE_SELECTED_TABS_MESSAGE = browser.i18n.getMessage("menuSaveSelectedTabs");
const MENU_SAVE_UNPINNED_TABS_MESSAGE = browser.i18n.getMessage("menuSaveUnpinnedTabs");
const MENU_SAVE_ALL_TABS_MESSAGE = browser.i18n.getMessage("menuSaveAllTabs");
const MENU_BATCH_SAVE_URLS_MESSAGE = browser.i18n.getMessage("menuBatchSaveUrls");
const MENU_SELECT_PROFILE_MESSAGE = browser.i18n.getMessage("menuSelectProfile");
const PROFILE_DEFAULT_SETTINGS_MESSAGE = browser.i18n.getMessage("profileDefaultSettings");
const MENU_AUTOSAVE_MESSAGE = browser.i18n.getMessage("menuAutoSave");
const MENU_AUTOSAVE_DISABLED_MESSAGE = browser.i18n.getMessage("menuAutoSaveDisabled");
const MENU_AUTOSAVE_TAB_MESSAGE = browser.i18n.getMessage("menuAutoSaveTab");
const MENU_AUTOSAVE_UNPINNED_TABS_MESSAGE = browser.i18n.getMessage("menuAutoSaveUnpinnedTabs");
const MENU_AUTOSAVE_ALL_TABS_MESSAGE = browser.i18n.getMessage("menuAutoSaveAllTabs");
const MENU_TOP_VISIBLE_ENTRIES = [
	MENU_ID_EDIT_AND_SAVE_PAGE,
	MENU_ID_SAVE_SELECTED_LINKS,
	MENU_ID_SAVE_SELECTED,
	MENU_ID_SAVE_FRAME,
	MENU_ID_AUTO_SAVE,
	MENU_ID_ASSOCIATE_WITH_PROFILE
];

const menusCheckedState = new Map();
const menusTitleState = new Map();
let contextMenuVisibleState = true;
let allMenuVisibleState = true;
let profileIndexes = new Map();
let menusCreated, pendingRefresh, business;
Promise.resolve().then(initialize);
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
	const [profiles, allTabsData] = await Promise.all([config.getProfiles(), tabsData.get()]);
	const options = await config.getOptions(tab && tab.url);
	if (BROWSER_MENUS_API_SUPPORTED && options) {
		const pageContextsEnabled = ["page", "frame", "image", "link", "video", "audio", "selection"];
		const defaultContextsDisabled = [];
		if (options.browserActionMenuEnabled) {
			defaultContextsDisabled.push("browser_action");
		}
		if (options.tabMenuEnabled) {
			try {
				await menus.create({
					id: "temporary-id",
					contexts: ["tab"],
					title: "title"
				});
				defaultContextsDisabled.push("tab");
			} catch (error) {
				options.tabMenuEnabled = false;
			}
		}
		await menus.removeAll();
		const defaultContextsEnabled = defaultContextsDisabled.concat(...pageContextsEnabled);
		const defaultContexts = options.contextMenuEnabled ? defaultContextsEnabled : defaultContextsDisabled;
		menus.create({
			id: MENU_ID_SAVE_PAGE,
			contexts: defaultContexts,
			title: MENU_SAVE_PAGE_MESSAGE
		});
		menus.create({
			id: MENU_ID_EDIT_AND_SAVE_PAGE,
			contexts: defaultContexts,
			title: MENU_EDIT_AND_SAVE_PAGE_MESSAGE
		});
		menus.create({
			id: MENU_ID_SAVE_SELECTED_LINKS,
			contexts: options.contextMenuEnabled ? defaultContextsDisabled.concat(["selection"]) : defaultContextsDisabled,
			title: MENU_SAVE_SELECTED_LINKS
		});
		if (Object.keys(profiles).length > 1) {
			menus.create({
				id: MENU_ID_SAVE_WITH_PROFILE,
				contexts: defaultContexts,
				title: MENU_SAVE_WITH_PROFILE
			});
		}
		if (options.contextMenuEnabled) {
			menus.create({
				id: "separator-1",
				contexts: pageContextsEnabled,
				type: "separator"
			});
		}
		menus.create({
			id: MENU_ID_SAVE_SELECTED,
			contexts: defaultContexts,
			title: MENU_SAVE_SELECTION_MESSAGE
		});
		if (options.contextMenuEnabled) {
			menus.create({
				id: MENU_ID_SAVE_FRAME,
				contexts: ["frame"],
				title: MENU_SAVE_FRAME_MESSAGE
			});
		}
		menus.create({
			id: MENU_ID_SAVE_TABS,
			contexts: defaultContextsDisabled,
			title: MENU_SAVE_TABS_MESSAGE
		});
		menus.create({
			id: MENU_ID_BUTTON_SAVE_SELECTED_TABS,
			contexts: defaultContextsDisabled,
			title: MENU_SAVE_SELECTED_TABS_MESSAGE,
			parentId: MENU_ID_SAVE_TABS
		});
		menus.create({
			id: MENU_ID_BUTTON_SAVE_UNPINNED_TABS,
			contexts: defaultContextsDisabled,
			title: MENU_SAVE_UNPINNED_TABS_MESSAGE,
			parentId: MENU_ID_SAVE_TABS
		});
		menus.create({
			id: MENU_ID_BUTTON_SAVE_ALL_TABS,
			contexts: defaultContextsDisabled,
			title: MENU_SAVE_ALL_TABS_MESSAGE,
			parentId: MENU_ID_SAVE_TABS
		});
		if (options.contextMenuEnabled) {
			if (config.SELECTABLE_TABS_SUPPORTED) {
				menus.create({
					id: MENU_ID_SAVE_SELECTED_TABS,
					contexts: pageContextsEnabled,
					title: MENU_SAVE_SELECTED_TABS_MESSAGE
				});
			}
			menus.create({
				id: MENU_ID_SAVE_UNPINNED_TABS,
				contexts: pageContextsEnabled,
				title: MENU_SAVE_UNPINNED_TABS_MESSAGE
			});
			menus.create({
				id: MENU_ID_SAVE_ALL_TABS,
				contexts: pageContextsEnabled,
				title: MENU_SAVE_ALL_TABS_MESSAGE
			});
			menus.create({
				id: "separator-2",
				contexts: pageContextsEnabled,
				type: "separator"
			});
		}
		if (Object.keys(profiles).length > 1) {
			menus.create({
				id: MENU_ID_SELECT_PROFILE,
				title: MENU_SELECT_PROFILE_MESSAGE,
				contexts: defaultContexts,
			});
			menus.create({
				id: MENU_ID_SAVE_WITH_PROFILE_PREFIX + "default",
				contexts: defaultContexts,
				title: PROFILE_DEFAULT_SETTINGS_MESSAGE,
				parentId: MENU_ID_SAVE_WITH_PROFILE
			});
			const defaultProfileId = MENU_ID_SELECT_PROFILE_PREFIX + "default";
			const defaultProfileChecked = !allTabsData.profileName || allTabsData.profileName == config.DEFAULT_PROFILE_NAME;
			menus.create({
				id: defaultProfileId,
				type: "radio",
				contexts: defaultContexts,
				title: PROFILE_DEFAULT_SETTINGS_MESSAGE,
				checked: defaultProfileChecked,
				parentId: MENU_ID_SELECT_PROFILE
			});
			menusCheckedState.set(defaultProfileId, defaultProfileChecked);
			menus.create({
				id: MENU_ID_ASSOCIATE_WITH_PROFILE,
				title: MENU_CREATE_DOMAIN_RULE_MESSAGE,
				contexts: defaultContexts,
			});
			menusTitleState.set(MENU_ID_ASSOCIATE_WITH_PROFILE, MENU_CREATE_DOMAIN_RULE_MESSAGE);
			let rule;
			if (tab && tab.url) {
				rule = await config.getRule(tab.url, true);
			}
			const currentProfileId = MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX + "current";
			const currentProfileChecked = !rule || (rule.profile == config.CURRENT_PROFILE_NAME);
			menus.create({
				id: currentProfileId,
				type: "radio",
				contexts: defaultContexts,
				title: config.CURRENT_PROFILE_NAME,
				checked: currentProfileChecked,
				parentId: MENU_ID_ASSOCIATE_WITH_PROFILE
			});
			menusCheckedState.set(currentProfileId, currentProfileChecked);

			const associatedDefaultProfileId = MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX + "default";
			const associatedDefaultProfileChecked = Boolean(rule) && (rule.profile == config.DEFAULT_PROFILE_NAME);
			menus.create({
				id: associatedDefaultProfileId,
				type: "radio",
				contexts: defaultContexts,
				title: PROFILE_DEFAULT_SETTINGS_MESSAGE,
				checked: associatedDefaultProfileChecked,
				parentId: MENU_ID_ASSOCIATE_WITH_PROFILE
			});
			menusCheckedState.set(associatedDefaultProfileId, associatedDefaultProfileChecked);
			profileIndexes = new Map();
			Object.keys(profiles).forEach((profileName, profileIndex) => {
				if (profileName != config.DEFAULT_PROFILE_NAME) {
					let profileId = MENU_ID_SAVE_WITH_PROFILE_PREFIX + profileIndex;
					menus.create({
						id: profileId,
						contexts: defaultContexts,
						title: profileName,
						parentId: MENU_ID_SAVE_WITH_PROFILE
					});
					profileId = MENU_ID_SELECT_PROFILE_PREFIX + profileIndex;
					let profileChecked = allTabsData.profileName == profileName;
					menus.create({
						id: profileId,
						type: "radio",
						contexts: defaultContexts,
						title: profileName,
						checked: profileChecked,
						parentId: MENU_ID_SELECT_PROFILE
					});
					menusCheckedState.set(profileId, profileChecked);
					profileId = MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX + profileIndex;
					profileChecked = Boolean(rule) && rule.profile == profileName;
					menus.create({
						id: profileId,
						type: "radio",
						contexts: defaultContexts,
						title: profileName,
						checked: profileChecked,
						parentId: MENU_ID_ASSOCIATE_WITH_PROFILE
					});
					menusCheckedState.set(profileId, profileChecked);
					profileIndexes.set(profileName, profileIndex);
				}
			});
			if (options.contextMenuEnabled) {
				menus.create({
					id: "separator-3",
					contexts: pageContextsEnabled,
					type: "separator"
				});
			}
		}
		if (config.AUTO_SAVE_SUPPORTED) {
			menus.create({
				id: MENU_ID_AUTO_SAVE,
				contexts: defaultContexts,
				title: MENU_AUTOSAVE_MESSAGE
			});
			menus.create({
				id: MENU_ID_AUTO_SAVE_DISABLED,
				type: "radio",
				title: MENU_AUTOSAVE_DISABLED_MESSAGE,
				contexts: defaultContexts,
				checked: true,
				parentId: MENU_ID_AUTO_SAVE
			});
			menusCheckedState.set(MENU_ID_AUTO_SAVE_DISABLED, true);
			menus.create({
				id: MENU_ID_AUTO_SAVE_TAB,
				type: "radio",
				title: MENU_AUTOSAVE_TAB_MESSAGE,
				contexts: defaultContexts,
				checked: false,
				parentId: MENU_ID_AUTO_SAVE
			});
			menusCheckedState.set(MENU_ID_AUTO_SAVE_TAB, false);
			menus.create({
				id: MENU_ID_AUTO_SAVE_UNPINNED,
				type: "radio",
				title: MENU_AUTOSAVE_UNPINNED_TABS_MESSAGE,
				contexts: defaultContexts,
				checked: false,
				parentId: MENU_ID_AUTO_SAVE
			});
			menusCheckedState.set(MENU_ID_AUTO_SAVE_UNPINNED, false);
			menus.create({
				id: MENU_ID_AUTO_SAVE_ALL,
				type: "radio",
				title: MENU_AUTOSAVE_ALL_TABS_MESSAGE,
				contexts: defaultContexts,
				checked: false,
				parentId: MENU_ID_AUTO_SAVE
			});
			menusCheckedState.set(MENU_ID_AUTO_SAVE_ALL, false);
			menus.create({
				id: "separator-4",
				contexts: defaultContexts,
				type: "separator"
			});
		}
		menus.create({
			id: MENU_ID_BATCH_SAVE_URLS,
			contexts: defaultContexts,
			title: MENU_BATCH_SAVE_URLS_MESSAGE
		});
		menus.create({
			id: MENU_ID_VIEW_PENDINGS,
			contexts: defaultContexts,
			title: MENU_VIEW_PENDINGS_MESSAGE
		});
	}
	menusCreated = true;
	if (pendingRefresh) {
		pendingRefresh = false;
		(await browser.tabs.query({})).forEach(async tab => await refreshTab(tab));
	}
}

async function initialize() {
	if (BROWSER_MENUS_API_SUPPORTED) {
		createMenus();
		menus.onClicked.addListener(async (event, tab) => {
			if (event.menuItemId == MENU_ID_SAVE_PAGE) {
				if (event.linkUrl) {
					business.saveUrls([event.linkUrl]);
				} else {
					business.saveTabs([tab]);
				}
			}
			if (event.menuItemId == MENU_ID_EDIT_AND_SAVE_PAGE) {
				const allTabsData = await tabsData.get(tab.id);
				if (allTabsData[tab.id].savedPageDetected) {
					business.openEditor(tab);
				} else {
					if (event.linkUrl) {
						business.saveUrls([event.linkUrl], { openEditor: true });
					} else {
						business.saveTabs([tab], { openEditor: true });
					}
				}
			}
			if (event.menuItemId == MENU_ID_SAVE_SELECTED_LINKS) {
				business.saveSelectedLinks(tab);
			}
			if (event.menuItemId == MENU_ID_VIEW_PENDINGS) {
				await browser.tabs.create({ active: true, url: "/src/ui/pages/pendings.html" });
			}
			if (event.menuItemId == MENU_ID_SAVE_SELECTED) {
				business.saveTabs([tab], { selected: true });
			}
			if (event.menuItemId == MENU_ID_SAVE_FRAME) {
				business.saveTabs([tab], { frameId: event.frameId });
			}
			if (event.menuItemId == MENU_ID_SAVE_SELECTED_TABS || event.menuItemId == MENU_ID_BUTTON_SAVE_SELECTED_TABS) {
				const tabs = await queryTabs({ currentWindow: true, highlighted: true });
				business.saveTabs(tabs);
			}
			if (event.menuItemId == MENU_ID_SAVE_UNPINNED_TABS || event.menuItemId == MENU_ID_BUTTON_SAVE_UNPINNED_TABS) {
				const tabs = await queryTabs({ currentWindow: true, pinned: false });
				business.saveTabs(tabs);
			}
			if (event.menuItemId == MENU_ID_SAVE_ALL_TABS || event.menuItemId == MENU_ID_BUTTON_SAVE_ALL_TABS) {
				const tabs = await queryTabs({ currentWindow: true });
				business.saveTabs(tabs);
			}
			if (event.menuItemId == MENU_ID_BATCH_SAVE_URLS) {
				business.batchSaveUrls();
			}
			if (event.menuItemId == MENU_ID_AUTO_SAVE_TAB) {
				const allTabsData = await tabsData.get(tab.id);
				allTabsData[tab.id].autoSave = true;
				await tabsData.set(allTabsData);
				refreshExternalComponents(tab);
			}
			if (event.menuItemId == MENU_ID_AUTO_SAVE_DISABLED) {
				const allTabsData = await tabsData.get();
				Object.keys(allTabsData).forEach(tabId => {
					if (typeof allTabsData[tabId] == "object" && allTabsData[tabId].autoSave) {
						allTabsData[tabId].autoSave = false;
					}
				});
				allTabsData.autoSaveUnpinned = allTabsData.autoSaveAll = false;
				await tabsData.set(allTabsData);
				refreshExternalComponents(tab);
			}
			if (event.menuItemId == MENU_ID_AUTO_SAVE_ALL) {
				const allTabsData = await tabsData.get();
				allTabsData.autoSaveAll = event.checked;
				await tabsData.set(allTabsData);
				refreshExternalComponents(tab);
			}
			if (event.menuItemId == MENU_ID_AUTO_SAVE_UNPINNED) {
				const allTabsData = await tabsData.get();
				allTabsData.autoSaveUnpinned = event.checked;
				await tabsData.set(allTabsData);
				refreshExternalComponents(tab);
			}
			if (event.menuItemId.startsWith(MENU_ID_SAVE_WITH_PROFILE_PREFIX)) {
				const profiles = await config.getProfiles();
				const profileId = event.menuItemId.split(MENU_ID_SAVE_WITH_PROFILE_PREFIX)[1];
				let profileName;
				if (profileId == "default") {
					profileName = config.DEFAULT_PROFILE_NAME;
				} else {
					const profileIndex = Number(profileId);
					profileName = Object.keys(profiles)[profileIndex];
				}
				profiles[profileName].profileName = profileName;
				business.saveTabs([tab], profiles[profileName]);
			}
			if (event.menuItemId.startsWith(MENU_ID_SELECT_PROFILE_PREFIX)) {
				const [profiles, allTabsData] = await Promise.all([config.getProfiles(), tabsData.get()]);
				const profileId = event.menuItemId.split(MENU_ID_SELECT_PROFILE_PREFIX)[1];
				if (profileId == "default") {
					allTabsData.profileName = config.DEFAULT_PROFILE_NAME;
				} else {
					const profileIndex = Number(profileId);
					allTabsData.profileName = Object.keys(profiles)[profileIndex];
				}
				await tabsData.set(allTabsData);
				refreshExternalComponents(tab);
			}
			if (event.menuItemId.startsWith(MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX)) {
				const [profiles, rule] = await Promise.all([config.getProfiles(), config.getRule(tab.url, true)]);
				const profileId = event.menuItemId.split(MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX)[1];
				let profileName;
				if (profileId == "default") {
					profileName = config.DEFAULT_PROFILE_NAME;
				} else if (profileId == "current") {
					profileName = config.CURRENT_PROFILE_NAME;
				} else {
					const profileIndex = Number(profileId);
					profileName = Object.keys(profiles)[profileIndex];
				}
				if (rule) {
					await config.updateRule(rule.url, rule.url, profileName, profileName);
				} else {
					await updateTitleValue(MENU_ID_ASSOCIATE_WITH_PROFILE, MENU_UPDATE_RULE_MESSAGE);
					await config.addRule(new URL(tab.url).hostname, profileName, profileName);
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

async function refreshExternalComponents(tab) {
	const allTabsData = await tabsData.get(tab.id);
	await refreshAutoSaveTabs();
	await button.refreshTab(tab);
	try {
		await browser.runtime.sendMessage({ method: "options.refresh", profileName: allTabsData.profileName });
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
			if (config.AUTO_SAVE_SUPPORTED) {
				promises.push(updateCheckedValue(MENU_ID_AUTO_SAVE_DISABLED, !allTabsData[tab.id].autoSave));
				promises.push(updateCheckedValue(MENU_ID_AUTO_SAVE_TAB, allTabsData[tab.id].autoSave));
				promises.push(updateCheckedValue(MENU_ID_AUTO_SAVE_UNPINNED, Boolean(allTabsData.autoSaveUnpinned)));
				promises.push(updateCheckedValue(MENU_ID_AUTO_SAVE_ALL, Boolean(allTabsData.autoSaveAll)));
			}
			if (tab && tab.url) {
				const options = await config.getOptions(tab.url);
				promises.push(updateVisibleValue(tab, options.contextMenuEnabled));
				promises.push(updateTitleValue(MENU_ID_EDIT_AND_SAVE_PAGE, allTabsData[tab.id].savedPageDetected ? MENU_EDIT_PAGE_MESSAGE : MENU_EDIT_AND_SAVE_PAGE_MESSAGE));
				if (config.SELECTABLE_TABS_SUPPORTED) {
					promises.push(menus.update(MENU_ID_SAVE_SELECTED, { visible: !options.saveRawPage }));
				}
				promises.push(menus.update(MENU_ID_EDIT_AND_SAVE_PAGE, { visible: !options.openEditor || allTabsData[tab.id].savedPageDetected }));
				let selectedEntryId = MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX + "default";
				let title = MENU_CREATE_DOMAIN_RULE_MESSAGE;
				const [profiles, rule] = await Promise.all([config.getProfiles(), config.getRule(tab.url)]);
				if (rule) {
					const profileIndex = profileIndexes.get(rule.profile);
					if (profileIndex) {
						selectedEntryId = MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX + profileIndex;
						title = MENU_UPDATE_RULE_MESSAGE;
					}
				}
				if (Object.keys(profiles).length > 1) {
					Object.keys(profiles).forEach((profileName, profileIndex) => {
						if (profileName == config.DEFAULT_PROFILE_NAME) {
							promises.push(updateCheckedValue(MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX + "default", selectedEntryId == MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX + "default"));
						} else {
							promises.push(updateCheckedValue(MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX + profileIndex, selectedEntryId == MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX + profileIndex));
						}
					});
					promises.push(updateTitleValue(MENU_ID_ASSOCIATE_WITH_PROFILE, title));
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
			MENU_TOP_VISIBLE_ENTRIES.forEach(id => promises.push(menus.update(id, { visible })));
			await Promise.all(promises);
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

function updateTitleValue(id, title) {
	const lastTitleValue = menusTitleState.get(id);
	menusTitleState.set(id, title);
	if (lastTitleValue === undefined) {
		return menus.update(id, { title });
	} else if (lastTitleValue != title) {
		return menus.update(id, { title });
	}
}

async function updateCheckedValue(id, checked) {
	checked = Boolean(checked);
	menusCheckedState.set(id, checked);
	await menus.update(id, { checked });
}