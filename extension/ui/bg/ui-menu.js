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
	const createDomainRuleTitle = browser.i18n.getMessage("menuCreateDomainRule");
	const updateRuleTitle = browser.i18n.getMessage("menuUpdateRule");

	const menusCheckedState = new Map();
	const menusTitleState = new Map();
	let profileIndexes = new Map();
	initialize();
	return {
		onTabCreated: refreshTab,
		onTabActivated: refreshTab,
		onTabUpdated: onTabUpdated,
		refresh
	};

	function onTabUpdated(tabId, changeInfo, tab) {
		refreshTab(tab);
	}

	async function refresh(tab) {
		const [profiles, tabsData] = await Promise.all([singlefile.config.getProfiles(), singlefile.tabsData.get()]);
		const options = await singlefile.config.getOptions(tabsData.profileName, tab && tab.url, true);
		if (BROWSER_MENUS_API_SUPPORTED) {
			const pageContextsEnabled = ["page", "frame", "image", "link", "video", "audio"];
			const defaultContextsDisabled = ["browser_action"];
			const defaultContextsEnabled = defaultContextsDisabled.concat(...pageContextsEnabled);
			const defaultContexts = options.contextMenuEnabled ? defaultContextsEnabled : defaultContextsDisabled;
			await menus.removeAll();
			if (options.contextMenuEnabled) {
				menus.create({
					id: MENU_ID_SAVE_PAGE,
					contexts: pageContextsEnabled,
					title: browser.i18n.getMessage("menuSavePage")
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
				title: browser.i18n.getMessage("menuSaveSelection")
			});
			if (options.contextMenuEnabled) {
				menus.create({
					id: MENU_ID_SAVE_FRAME,
					contexts: ["frame"],
					title: browser.i18n.getMessage("menuSaveFrame")
				});
			}
			menus.create({
				id: MENU_ID_SAVE_TABS,
				contexts: defaultContextsDisabled,
				title: browser.i18n.getMessage("menuSaveTabs")
			});
			menus.create({
				id: MENU_ID_BUTTON_SAVE_SELECTED_TABS,
				contexts: defaultContextsDisabled,
				title: browser.i18n.getMessage("menuSaveSelectedTabs"),
				parentId: MENU_ID_SAVE_TABS
			});
			menus.create({
				id: MENU_ID_BUTTON_SAVE_UNPINNED_TABS,
				contexts: defaultContextsDisabled,
				title: browser.i18n.getMessage("menuSaveUnpinnedTabs"),
				parentId: MENU_ID_SAVE_TABS
			});
			menus.create({
				id: MENU_ID_BUTTON_SAVE_ALL_TABS,
				contexts: defaultContextsDisabled,
				title: browser.i18n.getMessage("menuSaveAllTabs"),
				parentId: MENU_ID_SAVE_TABS
			});
			if (options.contextMenuEnabled) {
				menus.create({
					id: MENU_ID_SAVE_SELECTED_TABS,
					contexts: pageContextsEnabled,
					title: browser.i18n.getMessage("menuSaveSelectedTabs")
				});
				menus.create({
					id: MENU_ID_SAVE_UNPINNED_TABS,
					contexts: pageContextsEnabled,
					title: browser.i18n.getMessage("menuSaveUnpinnedTabs")
				});
				menus.create({
					id: MENU_ID_SAVE_ALL_TABS,
					contexts: pageContextsEnabled,
					title: browser.i18n.getMessage("menuSaveAllTabs")
				});
			}
			if (options.contextMenuEnabled) {
				menus.create({
					id: "separator-2",
					contexts: pageContextsEnabled,
					type: "separator"
				});
			}
			if (Object.keys(profiles).length > 1) {
				menus.create({
					id: MENU_ID_SELECT_PROFILE,
					title: browser.i18n.getMessage("menuSelectProfile"),
					contexts: defaultContexts,
				});
				let defaultProfileId = MENU_ID_SELECT_PROFILE_PREFIX + "default";
				let defaultProfileChecked = !tabsData.profileName || tabsData.profileName == singlefile.config.DEFAULT_PROFILE_NAME;
				menus.create({
					id: defaultProfileId,
					type: "radio",
					contexts: defaultContexts,
					title: browser.i18n.getMessage("profileDefaultSettings"),
					checked: defaultProfileChecked,
					parentId: MENU_ID_SELECT_PROFILE
				});
				menusCheckedState.set(defaultProfileId, defaultProfileChecked);
				menus.create({
					id: MENU_ID_ASSOCIATE_WITH_PROFILE,
					title: createDomainRuleTitle,
					contexts: defaultContexts,
				});
				menusTitleState.set(MENU_ID_ASSOCIATE_WITH_PROFILE, createDomainRuleTitle);
				let rule;
				if (tab && tab.url) {
					rule = await singlefile.config.getRule(tab.url);
				}
				defaultProfileId = MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX + "default";
				defaultProfileChecked = !rule || rule.profile == singlefile.config.DEFAULT_PROFILE_NAME;
				menus.create({
					id: MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX + "default",
					type: "radio",
					contexts: defaultContexts,
					title: browser.i18n.getMessage("profileDefaultSettings"),
					checked: defaultProfileChecked,
					parentId: MENU_ID_ASSOCIATE_WITH_PROFILE
				});
				menusCheckedState.set(defaultProfileId, defaultProfileChecked);
				profileIndexes = new Map();
				Object.keys(profiles).forEach((profileName, profileIndex) => {
					if (profileName != singlefile.config.DEFAULT_PROFILE_NAME) {
						menus.create({
							id: MENU_ID_SELECT_PROFILE_PREFIX + profileIndex,
							type: "radio",
							contexts: defaultContexts,
							title: profileName,
							checked: options.profileName == profileName,
							parentId: MENU_ID_SELECT_PROFILE
						});
						const profileId = MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX + profileIndex;
						const profileChecked = rule && rule.profile == profileName;
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
				title: browser.i18n.getMessage("menuAutoSave")
			});
			menus.create({
				id: MENU_ID_AUTO_SAVE_DISABLED,
				type: "radio",
				title: browser.i18n.getMessage("menuAutoSaveDisabled"),
				contexts: defaultContexts,
				checked: true,
				parentId: MENU_ID_AUTO_SAVE
			});
			menusCheckedState.set(MENU_ID_AUTO_SAVE_DISABLED, true);
			menus.create({
				id: MENU_ID_AUTO_SAVE_TAB,
				type: "radio",
				title: browser.i18n.getMessage("menuAutoSaveTab"),
				contexts: defaultContexts,
				checked: false,
				parentId: MENU_ID_AUTO_SAVE
			});
			menusCheckedState.set(MENU_ID_AUTO_SAVE_TAB, false);
			menus.create({
				id: MENU_ID_AUTO_SAVE_UNPINNED,
				type: "radio",
				title: browser.i18n.getMessage("menuAutoSaveUnpinnedTabs"),
				contexts: defaultContexts,
				checked: false,
				parentId: MENU_ID_AUTO_SAVE
			});
			menusCheckedState.set(MENU_ID_AUTO_SAVE_UNPINNED, false);
			menus.create({
				id: MENU_ID_AUTO_SAVE_ALL,
				type: "radio",
				title: browser.i18n.getMessage("menuAutoSaveAllTabs"),
				contexts: defaultContexts,
				checked: false,
				parentId: MENU_ID_AUTO_SAVE
			});
			menusCheckedState.set(MENU_ID_AUTO_SAVE_ALL, false);
		}
	}

	async function initialize() {
		if (BROWSER_MENUS_API_SUPPORTED) {
			refresh();
			menus.onClicked.addListener(async (event, tab) => {
				if (event.menuItemId == MENU_ID_SAVE_PAGE) {
					singlefile.ui.saveTab(tab);
				}
				if (event.menuItemId == MENU_ID_SAVE_SELECTED) {
					singlefile.ui.saveTab(tab, { selected: true });
				}
				if (event.menuItemId == MENU_ID_SAVE_FRAME) {
					singlefile.ui.saveTab(tab, { frameId: event.frameId });
				}
				if (event.menuItemId == MENU_ID_SAVE_SELECTED_TABS || event.menuItemId == MENU_ID_BUTTON_SAVE_SELECTED_TABS) {
					const tabs = await browser.tabs.query({ currentWindow: true, highlighted: true });
					tabs.forEach(tab => singlefile.ui.isAllowedURL(tab.url) && singlefile.ui.saveTab(tab));
				}
				if (event.menuItemId == MENU_ID_SAVE_UNPINNED_TABS || event.menuItemId == MENU_ID_BUTTON_SAVE_UNPINNED_TABS) {
					const tabs = await browser.tabs.query({ currentWindow: true, pinned: false });
					tabs.forEach(tab => singlefile.ui.isAllowedURL(tab.url) && singlefile.ui.saveTab(tab));
				}
				if (event.menuItemId == MENU_ID_SAVE_ALL_TABS || event.menuItemId == MENU_ID_BUTTON_SAVE_ALL_TABS) {
					const tabs = await browser.tabs.query({ currentWindow: true });
					tabs.forEach(tab => singlefile.ui.isAllowedURL(tab.url) && singlefile.ui.saveTab(tab));
				}
				if (event.menuItemId == MENU_ID_AUTO_SAVE_TAB) {
					const tabsData = await singlefile.tabsData.get();
					if (!tabsData[tab.id]) {
						tabsData[tab.id] = {};
					}
					tabsData[tab.id].autoSave = event.checked;
					await singlefile.tabsData.set(tabsData);
					refreshExternalComponents(tab.id, { autoSave: true });
				}
				if (event.menuItemId == MENU_ID_AUTO_SAVE_DISABLED) {
					const tabsData = await singlefile.tabsData.get();
					Object.keys(tabsData).forEach(tabId => tabsData[tabId].autoSave = false);
					tabsData.autoSaveUnpinned = tabsData.autoSaveAll = false;
					await singlefile.tabsData.set(tabsData);
					refreshExternalComponents(tab.id, { autoSave: false });
				}
				if (event.menuItemId == MENU_ID_AUTO_SAVE_ALL) {
					const tabsData = await singlefile.tabsData.get();
					tabsData.autoSaveAll = event.checked;
					await singlefile.tabsData.set(tabsData);
					refreshExternalComponents(tab.id, { autoSave: true });
				}
				if (event.menuItemId == MENU_ID_AUTO_SAVE_UNPINNED) {
					const tabsData = await singlefile.tabsData.get();
					tabsData.autoSaveUnpinned = event.checked;
					await singlefile.tabsData.set(tabsData);
					refreshExternalComponents(tab.id, { autoSave: true });
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
					refresh();
					refreshExternalComponents(tab.id, { autoSave: tabsData.autoSaveAll || tabsData.autoSaveUnpinned || (tabsData[tab.id] && tabsData[tab.id].autoSave) });
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
						await updateTitleValue(MENU_ID_ASSOCIATE_WITH_PROFILE, updateRuleTitle);
						await singlefile.config.addRule(new URL(tab.url).hostname, profileName, profileName);
					}
				}
			});
			const tabs = await browser.tabs.query({});
			tabs.forEach(tab => refreshTab(tab));
		}
	}

	async function refreshExternalComponents(tabId) {
		await singlefile.autosave.refresh();
		singlefile.ui.button.refresh(tabId);
	}

	async function refreshTab(tab) {
		if (BROWSER_MENUS_API_SUPPORTED) {
			const tabsData = await singlefile.tabsData.get();
			const promises = [];
			try {
				const disabled = Boolean(!tabsData[tab.id] || !tabsData[tab.id].autoSave);
				promises.push(updateCheckedValue(MENU_ID_AUTO_SAVE_DISABLED, disabled));
				promises.push(updateCheckedValue(MENU_ID_AUTO_SAVE_TAB, !disabled));
				promises.push(updateCheckedValue(MENU_ID_AUTO_SAVE_UNPINNED, Boolean(tabsData.autoSaveUnpinned)));
				promises.push(updateCheckedValue(MENU_ID_AUTO_SAVE_ALL, Boolean(tabsData.autoSaveAll)));
				if (tab && tab.url) {
					let selectedEntryId = MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX + "default";
					let title = createDomainRuleTitle;
					const [profiles, rule] = await Promise.all([singlefile.config.getProfiles(), singlefile.config.getRule(tab.url)]);
					if (rule) {
						const profileIndex = profileIndexes.get(rule.profile);
						if (profileIndex) {
							selectedEntryId = MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX + profileIndex;
							title = updateRuleTitle;
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