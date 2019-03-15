/*
 * Copyright 2010-2019 Gildas Lormeau
 * contact : gildas.lormeau <at> gmail.com
 * 
 * This file is part of SingleFile.
 *
 *   SingleFile is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU Lesser General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   SingleFile is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU Lesser General Public License for more details.
 *
 *   You should have received a copy of the GNU Lesser General Public License
 *   along with SingleFile.  If not, see <http://www.gnu.org/licenses/>.
 */

/* global browser, singlefile, URL */

singlefile.ui.menu = (() => {

	const menus = browser.menus || browser.contextMenus;
	const BROWSER_MENUS_API_SUPPORTED = menus && menus.onClicked && menus.create && menus.update && menus.removeAll;
	const MENU_ID_SAVE_PAGE = "save-page";
	const MENU_ID_SELECT_PROFILE = "select-profile";
	const MENU_ID_SELECT_PROFILE_PREFIX = "select-profile-";
	const MENU_ID_ASSOCIATE_WITH_PROFILE = "associate-with-profile";
	const MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX = "associate-with-profile-";
	const MENU_ID_SAVE_SELECTED = "save-selected";
	const MENU_ID_SAVE_FRAME = "save-frame";
	const MENU_ID_SAVE_TABS = "save-tabs";
	const MENU_ID_SAVE_SELECTED_TABS = "save-selected-tabs";
	const MENU_ID_SAVE_UNPINNED_TABS = "save-unpinned-tabs";
	const MENU_ID_SAVE_ALL_TABS = "save-all-tabs";
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
	const MENU_SAVE_SELECTION_MESSAGE = browser.i18n.getMessage("menuSaveSelection");
	const MENU_SAVE_FRAME_MESSAGE = browser.i18n.getMessage("menuSaveFrame");
	const MENU_SAVE_TABS_MESSAGE = browser.i18n.getMessage("menuSaveTabs");
	const MENU_SAVE_SELECTED_TABS_MESSAGE = browser.i18n.getMessage("menuSaveSelectedTabs");
	const MENU_SAVE_UNPINNED_TABS_MESSAGE = browser.i18n.getMessage("menuSaveUnpinnedTabs");
	const MENU_SAVE_ALL_TABS_MESSAGE = browser.i18n.getMessage("menuSaveAllTabs");
	const MENU_SELECT_PROFILE_MESSAGE = browser.i18n.getMessage("menuSelectProfile");
	const PROFILE_DEFAULT_SETTINGS_MESSAGE = browser.i18n.getMessage("profileDefaultSettings");
	const MENU_AUTOSAVE_MESSAGE = browser.i18n.getMessage("menuAutoSave");
	const MENU_AUTOSAVE_DISABLED_MESSAGE = browser.i18n.getMessage("menuAutoSaveDisabled");
	const MENU_AUTOSAVE_TAB_MESSAGE = browser.i18n.getMessage("menuAutoSaveTab");
	const MENU_AUTOSAVE_UNPINNED_TABS_MESSAGE = browser.i18n.getMessage("menuAutoSaveUnpinnedTabs");
	const MENU_AUTOSAVE_ALL_TABS_MESSAGE = browser.i18n.getMessage("menuAutoSaveAllTabs");

	const menusCheckedState = new Map();
	const menusTitleState = new Map();
	let profileIndexes = new Map();
	initialize();
	return {
		onMessage,
		onTabCreated: refreshTab,
		onTabActivated: refreshTab,
		onTabUpdated: onTabUpdated,
		refresh: createMenus
	};

	function onMessage() {
		createMenus();
	}

	function onTabUpdated(tabId, changeInfo, tab) {
		refreshTab(tab);
	}

	async function createMenus(tab) {
		const [profiles, tabsData] = await Promise.all([singlefile.config.getProfiles(), singlefile.tabsData.get()]);
		const options = await singlefile.config.getOptions(tab && tab.url, true);
		if (BROWSER_MENUS_API_SUPPORTED && options) {
			const pageContextsEnabled = ["page", "frame", "image", "link", "video", "audio"];
			const defaultContextsDisabled = ["browser_action"];
			const defaultContextsEnabled = defaultContextsDisabled.concat(...pageContextsEnabled);
			const defaultContexts = options.contextMenuEnabled ? defaultContextsEnabled : defaultContextsDisabled;
			await menus.removeAll();
			if (options.contextMenuEnabled) {
				menus.create({
					id: MENU_ID_SAVE_PAGE,
					contexts: pageContextsEnabled,
					title: MENU_SAVE_PAGE_MESSAGE
				});
				menus.create({
					id: "separator-1",
					contexts: pageContextsEnabled,
					type: "separator"
				});
				menus.create({
					id: MENU_ID_SAVE_SELECTED,
					contexts: defaultContexts.concat("selection"),
					title: MENU_SAVE_SELECTION_MESSAGE
				});
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
				menus.create({
					id: MENU_ID_SAVE_SELECTED_TABS,
					contexts: pageContextsEnabled,
					title: MENU_SAVE_SELECTED_TABS_MESSAGE
				});
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
				let defaultProfileId = MENU_ID_SELECT_PROFILE_PREFIX + "default";
				let defaultProfileChecked = !tabsData.profileName || tabsData.profileName == singlefile.config.DEFAULT_PROFILE_NAME;
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
					rule = await singlefile.config.getRule(tab.url);
				}
				defaultProfileId = MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX + "default";
				defaultProfileChecked = !rule || rule.profile == singlefile.config.DEFAULT_PROFILE_NAME;
				menus.create({
					id: defaultProfileId,
					type: "radio",
					contexts: defaultContexts,
					title: PROFILE_DEFAULT_SETTINGS_MESSAGE,
					checked: defaultProfileChecked,
					parentId: MENU_ID_ASSOCIATE_WITH_PROFILE
				});
				menusCheckedState.set(defaultProfileId, defaultProfileChecked);
				profileIndexes = new Map();
				Object.keys(profiles).forEach((profileName, profileIndex) => {
					if (profileName != singlefile.config.DEFAULT_PROFILE_NAME) {
						let profileId = MENU_ID_SELECT_PROFILE_PREFIX + profileIndex;
						let profileChecked = tabsData.profileName == profileName;
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
						profileChecked = rule && rule.profile == profileName;
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
		}
	}

	async function initialize() {
		if (BROWSER_MENUS_API_SUPPORTED) {
			createMenus();
			menus.onClicked.addListener(async (event, tab) => {
				if (event.menuItemId == MENU_ID_SAVE_PAGE) {
					singlefile.core.saveTab(tab);
				}
				if (event.menuItemId == MENU_ID_SAVE_SELECTED) {
					singlefile.core.saveTab(tab, { selected: true });
				}
				if (event.menuItemId == MENU_ID_SAVE_FRAME) {
					singlefile.core.saveTab(tab, { frameId: event.frameId });
				}
				if (event.menuItemId == MENU_ID_SAVE_SELECTED_TABS || event.menuItemId == MENU_ID_BUTTON_SAVE_SELECTED_TABS) {
					const tabs = await singlefile.tabs.get({ currentWindow: true, highlighted: true });
					tabs.forEach(tab => singlefile.core.saveTab(tab));
				}
				if (event.menuItemId == MENU_ID_SAVE_UNPINNED_TABS || event.menuItemId == MENU_ID_BUTTON_SAVE_UNPINNED_TABS) {
					const tabs = await singlefile.tabs.get({ currentWindow: true, pinned: false });
					tabs.forEach(tab => singlefile.core.saveTab(tab));
				}
				if (event.menuItemId == MENU_ID_SAVE_ALL_TABS || event.menuItemId == MENU_ID_BUTTON_SAVE_ALL_TABS) {
					const tabs = await singlefile.tabs.get({ currentWindow: true });
					tabs.forEach(tab => singlefile.core.saveTab(tab));
				}
				if (event.menuItemId == MENU_ID_AUTO_SAVE_TAB) {
					const tabsData = await singlefile.tabsData.get(tab.id);
					tabsData[tab.id].autoSave = event.checked;
					await singlefile.tabsData.set(tabsData);
					refreshExternalComponents(tab, { autoSave: true });
				}
				if (event.menuItemId == MENU_ID_AUTO_SAVE_DISABLED) {
					const tabsData = await singlefile.tabsData.get();
					Object.keys(tabsData).forEach(tabId => tabsData[tabId].autoSave = false);
					tabsData.autoSaveUnpinned = tabsData.autoSaveAll = false;
					await singlefile.tabsData.set(tabsData);
					refreshExternalComponents(tab, {});
				}
				if (event.menuItemId == MENU_ID_AUTO_SAVE_ALL) {
					const tabsData = await singlefile.tabsData.get();
					tabsData.autoSaveAll = event.checked;
					await singlefile.tabsData.set(tabsData);
					refreshExternalComponents(tab, { autoSave: true });
				}
				if (event.menuItemId == MENU_ID_AUTO_SAVE_UNPINNED) {
					const tabsData = await singlefile.tabsData.get();
					tabsData.autoSaveUnpinned = event.checked;
					await singlefile.tabsData.set(tabsData);
					refreshExternalComponents(tab, { autoSave: true });
				}
				if (event.menuItemId.startsWith(MENU_ID_SELECT_PROFILE_PREFIX)) {
					const [profiles, tabsData] = await Promise.all([singlefile.config.getProfiles(), singlefile.tabsData.get()]);
					const profileId = event.menuItemId.split(MENU_ID_SELECT_PROFILE_PREFIX)[1];
					if (profileId == "default") {
						tabsData.profileName = singlefile.config.DEFAULT_PROFILE_NAME;
					} else {
						const profileIndex = Number(profileId);
						tabsData.profileName = Object.keys(profiles)[profileIndex];
					}
					await singlefile.tabsData.set(tabsData);
					refreshExternalComponents(tab, { autoSave: await singlefile.autosave.isEnabled() });
				}
				if (event.menuItemId.startsWith(MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX)) {
					const [profiles, rule] = await Promise.all([singlefile.config.getProfiles(), singlefile.config.getRule(tab.url)]);
					const profileId = event.menuItemId.split(MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX)[1];
					let profileName;
					if (profileId == "default") {
						profileName = singlefile.config.DEFAULT_PROFILE_NAME;
					} else {
						const profileIndex = Number(profileId);
						profileName = Object.keys(profiles)[profileIndex];
					}
					if (rule) {
						await singlefile.config.updateRule(rule.url, rule.url, profileName, profileName);
					} else {
						await updateTitleValue(MENU_ID_ASSOCIATE_WITH_PROFILE, MENU_UPDATE_RULE_MESSAGE);
						await singlefile.config.addRule(new URL(tab.url).hostname, profileName, profileName);
					}
				}
			});
			(await singlefile.tabs.get({})).forEach(tab => refreshTab(tab));
		}
	}

	async function refreshExternalComponents(tab) {
		await singlefile.autosave.refreshTabs();
		singlefile.ui.button.refresh(tab);
	}

	async function refreshTab(tab) {
		if (BROWSER_MENUS_API_SUPPORTED) {
			const tabsData = await singlefile.tabsData.get(tab.id);
			const promises = [];
			try {
				promises.push(updateCheckedValue(MENU_ID_AUTO_SAVE_DISABLED, !tabsData[tab.id].autoSave));
				promises.push(updateCheckedValue(MENU_ID_AUTO_SAVE_TAB, tabsData[tab.id].autoSave));
				promises.push(updateCheckedValue(MENU_ID_AUTO_SAVE_UNPINNED, Boolean(tabsData.autoSaveUnpinned)));
				promises.push(updateCheckedValue(MENU_ID_AUTO_SAVE_ALL, Boolean(tabsData.autoSaveAll)));
				if (tab && tab.url) {
					let selectedEntryId = MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX + "default";
					let title = MENU_CREATE_DOMAIN_RULE_MESSAGE;
					const [profiles, rule] = await Promise.all([singlefile.config.getProfiles(), singlefile.config.getRule(tab.url)]);
					if (rule) {
						const profileIndex = profileIndexes.get(rule.profile);
						if (profileIndex) {
							selectedEntryId = MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX + profileIndex;
							title = MENU_UPDATE_RULE_MESSAGE;
						}
					}
					Object.keys(profiles).forEach((profileName, profileIndex) => {
						if (profileName == singlefile.config.DEFAULT_PROFILE_NAME) {
							promises.push(updateCheckedValue(MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX + "default", selectedEntryId == MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX + "default"));
						} else {
							promises.push(updateCheckedValue(MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX + profileIndex, selectedEntryId == MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX + profileIndex));
						}
					});
					promises.push(updateTitleValue(MENU_ID_ASSOCIATE_WITH_PROFILE, title));
				}
				await Promise.all(promises);
			} catch (error) {
				/* ignored */
			}
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

	function updateCheckedValue(id, checked) {
		const lastCheckedValue = menusCheckedState.get(id);
		menusCheckedState.set(id, checked);
		if (lastCheckedValue === undefined) {
			return menus.update(id, { checked });
		} else if (lastCheckedValue != checked) {
			return menus.update(id, { checked });
		}
	}

})();