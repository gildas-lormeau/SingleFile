/*
 * Copyright 2018 Gildas Lormeau
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

/* global browser, singlefile */

singlefile.ui = (() => {

	const DEFAULT_ICON_PATH = "/extension/ui/resources/icon_16.png";
	const WAIT_ICON_PATH_PREFIX = "/extension/ui/resources/icon_16_wait";
	const DEFAULT_TITLE = "Save page with SingleFile";
	const DEFAULT_COLOR = [2, 147, 20, 255];
	const BADGE_PROPERTIES = [{ name: "text", browserActionMethod: "setBadgeText" }, { name: "color", browserActionMethod: "setBadgeBackgroundColor" }, { name: "title", browserActionMethod: "setTitle" }, { name: "path", browserActionMethod: "setIcon" }];
	const FORBIDDEN_URLS = ["https://chrome.google.com", "https://addons.mozilla.org"];
	const BROWSER_MENUS_API_SUPPORTED = browser.menus && browser.menus.onClicked && browser.menus.create && browser.menus.update && browser.menus.removeAll;
	const MENU_ID_SAVE_PAGE = "save-page";
	const MENU_ID_SAVE_SELECTED = "save-selected";
	const MENU_ID_SAVE_FRAME = "save-frame";
	const MENU_ID_SAVE_SELECTED_TABS = "save-selected-tabs";
	const MENU_ID_SAVE_UNPINNED_TABS = "save-unpinned-tabs";
	const MENU_ID_SAVE_ALL_TABS = "save-tabs";
	const MENU_ID_AUTO_SAVE_DISABLED = "auto-save-disabled";
	const MENU_ID_AUTO_SAVE_TAB = "auto-save-tab";
	const MENU_ID_AUTO_SAVE_UNPINNED = "auto-save-unpinned";
	const MENU_ID_AUTO_SAVE_ALL = "auto-save-all";

	let persistentTabsData;
	let temporaryTabsData;

	getPersistentTabsData().then(tabsData => persistentTabsData = tabsData);

	browser.runtime.onInstalled.addListener(refreshContextMenu);
	if (BROWSER_MENUS_API_SUPPORTED) {
		browser.menus.onClicked.addListener(async (event, tab) => {
			if (event.menuItemId == MENU_ID_SAVE_PAGE) {
				processTab(tab);
			}
			if (event.menuItemId == MENU_ID_SAVE_SELECTED) {
				processTab(tab, { selected: true });
			}
			if (event.menuItemId == MENU_ID_SAVE_FRAME) {
				processTab(tab, { frameId: event.frameId });
			}
			if (event.menuItemId == MENU_ID_SAVE_SELECTED_TABS) {
				const tabs = await browser.tabs.query({ currentWindow: true, highlighted: true });
				tabs.forEach(tab => isAllowedURL(tab.url) && processTab(tab));
			}
			if (event.menuItemId == MENU_ID_SAVE_UNPINNED_TABS) {
				const tabs = await browser.tabs.query({ currentWindow: true, pinned: false });
				tabs.forEach(tab => isAllowedURL(tab.url) && processTab(tab));
			}
			if (event.menuItemId == MENU_ID_SAVE_ALL_TABS) {
				const tabs = await browser.tabs.query({ currentWindow: true });
				tabs.forEach(tab => isAllowedURL(tab.url) && processTab(tab));
			}
			if (event.menuItemId == MENU_ID_AUTO_SAVE_TAB) {
				const tabsData = await getPersistentTabsData();
				if (!tabsData[tab.id]) {
					tabsData[tab.id] = {};
				}
				tabsData[tab.id].autoSave = event.checked;
				await browser.storage.local.set({ tabsData });
			}
			if (event.menuItemId == MENU_ID_AUTO_SAVE_DISABLED) {
				const tabsData = await getPersistentTabsData();
				Object.keys(tabsData).forEach(tabId => tabsData[tabId].autoSave = false);
				tabsData.autoSaveUnpinned = tabsData.autoSaveAll = false;
				await browser.storage.local.set({ tabsData });
			}
			if (event.menuItemId == MENU_ID_AUTO_SAVE_ALL) {
				const tabsData = await getPersistentTabsData();
				tabsData.autoSaveAll = event.checked;
				await browser.storage.local.set({ tabsData });
			}
			if (event.menuItemId == MENU_ID_AUTO_SAVE_UNPINNED) {
				const tabsData = await getPersistentTabsData();
				tabsData.autoSaveUnpinned = event.checked;
				await browser.storage.local.set({ tabsData });
			}
		});
	}
	browser.browserAction.onClicked.addListener(async tab => {
		if (isAllowedURL(tab.url)) {
			const tabs = await browser.tabs.query({ currentWindow: true, highlighted: true });
			if (!tabs.length) {
				processTab(tab);
			} else {
				tabs.forEach(tab => isAllowedURL(tab.url) && processTab(tab));
			}
		}
	});
	browser.tabs.onActivated.addListener(async activeInfo => {
		const tab = await browser.tabs.get(activeInfo.tabId);
		await refreshContextMenuState(tab);
		onTabActivated(tab);
	});
	browser.tabs.onCreated.addListener(async tab => {
		await refreshContextMenuState(tab);
		onTabActivated(tab);
	});
	browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
		const tabsData = await getPersistentTabsData();
		if (tabsData.autoSaveAll || (tabsData.autoSaveUnpinned && !tab.pinned) || (tabsData[tab.id] && tabsData[tab.id].autoSave)) {
			if (changeInfo.status == "complete") {
				processTab(tab, { autoSave: true });
			}
		}
		onTabActivated(tab);
	});
	browser.tabs.onRemoved.addListener(tabId => onTabRemoved(tabId));
	browser.runtime.onMessage.addListener((request, sender) => {
		if (request.processProgress && request.maxIndex) {
			onTabProgress(sender.tab.id, request.index, request.maxIndex);
		}
		if (request.processEnd) {
			onTabEnd(sender.tab.id);
		}
		if (request.processError) {
			if (request.error) {
				console.error("Initialization error", request.error); // eslint-disable-line no-console
			}
			onTabError(sender.tab.id);
		}
	});
	return { update: refreshContextMenu };

	async function refreshContextMenu() {
		const config = await singlefile.config.get();
		if (BROWSER_MENUS_API_SUPPORTED) {
			if (config.contextMenuEnabled) {
				await browser.menus.removeAll();
				browser.menus.create({
					id: MENU_ID_SAVE_PAGE,
					contexts: ["page"],
					title: DEFAULT_TITLE
				});
				browser.menus.create({
					id: "separator-1",
					contexts: ["all"],
					type: "separator"
				});
				browser.menus.create({
					id: MENU_ID_SAVE_SELECTED,
					contexts: ["selection"],
					title: "Save selection"
				});
				browser.menus.create({
					id: MENU_ID_SAVE_FRAME,
					contexts: ["frame"],
					title: "Save frame"
				});
				browser.menus.create({
					id: MENU_ID_SAVE_SELECTED_TABS,
					contexts: ["page"],
					title: "Save selected tabs"
				});
				browser.menus.create({
					id: MENU_ID_SAVE_UNPINNED_TABS,
					contexts: ["page"],
					title: "Save unpinned tabs"
				});
				browser.menus.create({
					id: MENU_ID_SAVE_ALL_TABS,
					contexts: ["page"],
					title: "Save all tabs"
				});
				browser.menus.create({
					id: "separator-2",
					contexts: ["all"],
					type: "separator"
				});
				browser.menus.create({
					id: MENU_ID_AUTO_SAVE_DISABLED,
					type: "radio",
					title: "Disable Auto-save",
					contexts: ["all"],
					checked: true
				});
				browser.menus.create({
					id: MENU_ID_AUTO_SAVE_TAB,
					type: "radio",
					title: "Auto-save this tab",
					contexts: ["all"],
					checked: false
				});
				browser.menus.create({
					id: MENU_ID_AUTO_SAVE_UNPINNED,
					type: "radio",
					title: "Auto-save unpinned tabs",
					contexts: ["all"],
					checked: false
				});
				browser.menus.create({
					id: MENU_ID_AUTO_SAVE_ALL,
					type: "radio",
					title: "Auto-save all tabs",
					contexts: ["all"],
					checked: false
				});
			} else {
				await browser.menus.removeAll();
			}
		}
	}

	async function refreshContextMenuState(tab) {
		const tabsData = await getPersistentTabsData();
		if (BROWSER_MENUS_API_SUPPORTED) {
			await browser.menus.update(MENU_ID_AUTO_SAVE_DISABLED, { checked: Boolean(!tabsData[tab.id] || !tabsData[tab.id].autoSave) });
			await browser.menus.update(MENU_ID_AUTO_SAVE_TAB, { checked: Boolean(tabsData[tab.id] && tabsData[tab.id].autoSave) });
			await browser.menus.update(MENU_ID_AUTO_SAVE_UNPINNED, { checked: Boolean(tabsData.autoSaveUnpinned) });
			await browser.menus.update(MENU_ID_AUTO_SAVE_ALL, { checked: Boolean(tabsData.autoSaveAll) });
		}
	}

	async function processTab(tab, options) {
		const tabId = tab.id;
		try {
			refreshBadge(tabId, {
				id: tabId,
				text: "...",
				color: DEFAULT_COLOR,
				title: "Initializing SingleFile (1/2)",
				path: DEFAULT_ICON_PATH,
				progress: -1,
				barProgress: -1
			});
			await singlefile.core.processTab(tab, options);
			refreshBadge(tabId, {
				id: tabId,
				text: "...",
				color: [4, 229, 36, 255],
				title: "Initializing SingleFile (2/2)",
				path: DEFAULT_ICON_PATH,
				progress: -1,
				barProgress: -1
			});
		} catch (error) {
			if (error) {
				onTabError(tabId);
			} else {
				refreshBadge(tabId, {
					id: tabId,
					text: "↻",
					color: [255, 141, 1, 255],
					title: "Reload the page",
					path: DEFAULT_ICON_PATH,
					progress: -1,
					barProgress: -1
				});
			}
		}
	}

	function onTabError(tabId) {
		refreshBadge(tabId, {
			text: "ERR",
			color: [229, 4, 12, 255],
			title: DEFAULT_TITLE,
			path: DEFAULT_ICON_PATH,
			progress: -1,
			barProgress: -1
		});
	}

	async function onTabEnd(tabId) {
		const tabsData = await getPersistentTabsData();
		refreshBadge(tabId, {
			text: "OK",
			color: tabsData.autoSaveAll || tabsData.autoSaveUnpinned || (tabsData[tabId] && tabsData[tabId].autoSave) ? [255, 141, 1, 255] : [4, 229, 36, 255],
			title: DEFAULT_TITLE,
			path: DEFAULT_ICON_PATH,
			progress: -1,
			barProgress: -1
		});
	}

	function onTabProgress(tabId, index, maxIndex) {
		const progress = Math.max(Math.min(20, Math.floor((index / maxIndex) * 20)), 0);
		const barProgress = Math.floor((index / maxIndex) * 8);
		refreshBadge(tabId, {
			progress,
			text: "",
			title: "Save progress: " + (progress * 5) + "%",
			color: [4, 229, 36, 255],
			barProgress,
			path: WAIT_ICON_PATH_PREFIX + barProgress + ".png"
		});
	}

	async function onTabRemoved(tabId) {
		const tabsData = await getPersistentTabsData();
		delete tabsData[tabId];
		await browser.storage.local.set({ tabsData });
	}

	function onTabActivated(tab) {
		if (isAllowedURL(tab.url) && browser.browserAction && browser.browserAction.enable && browser.browserAction.disable) {
			if (isAllowedURL(tab.url)) {
				browser.browserAction.enable(tab.id);
				if (browser.runtime.lastError) {
					/* ignored */
				}
			} else {
				browser.browserAction.disable(tab.id);
				if (browser.runtime.lastError) {
					/* ignored */
				}
			}
		}
	}

	function isAllowedURL(url) {
		return url && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("file://")) && !FORBIDDEN_URLS.find(storeUrl => url.startsWith(storeUrl));
	}

	async function refreshBadge(tabId, tabData) {
		const tabsData = await getTemporaryTabsData();
		if (!tabsData[tabId]) {
			tabsData[tabId] = {};
		}
		if (!tabsData[tabId].pendingRefresh) {
			tabsData[tabId].pendingRefresh = Promise.resolve();
		}
		tabsData[tabId].pendingRefresh = tabsData[tabId].pendingRefresh.then(() => refreshBadgeAsync(tabId, tabsData, tabData));
		await tabsData[tabId].pendingRefresh;
	}

	async function refreshBadgeAsync(tabId, tabsData, tabData) {
		for (let property of BADGE_PROPERTIES) {
			await refreshBadgeProperty(tabId, tabsData, property.name, property.browserActionMethod, tabData);
		}
	}

	async function refreshBadgeProperty(tabId, tabsData, property, browserActionMethod, tabData) {
		const value = tabData[property];
		const browserActionParameter = { tabId };
		if (browser.browserAction[browserActionMethod]) {
			browserActionParameter[property] = value;
			if (!tabsData[tabId]) {
				tabsData[tabId] = {};
			}
			if (!tabsData[tabId].badge) {
				tabsData[tabId].badge = {};
			}
			if (JSON.stringify(tabsData[tabId].badge[browserActionMethod]) != JSON.stringify(value)) {
				tabsData[tabId].badge[browserActionMethod] = value;
				await browser.browserAction[browserActionMethod](browserActionParameter);
			}
		}
	}

	function getTemporaryTabsData() {
		if (temporaryTabsData) {
			return temporaryTabsData;
		} else {
			return {};
		}
	}

	async function getPersistentTabsData() {
		if (persistentTabsData) {
			return persistentTabsData;
		} else {
			const config = await browser.storage.local.get();
			persistentTabsData = config.tabsData || {};
			await cleanupPersistentTabsData();
			return persistentTabsData;
		}
	}

	async function cleanupPersistentTabsData() {
		if (persistentTabsData) {
			const tabs = await browser.tabs.query({});
			Object.keys(persistentTabsData).filter(tabId => !tabs.find(tab => tab.id == tabId)).forEach(tabId => delete persistentTabsData[tabId]);
			await browser.storage.local.set({ tabsData: persistentTabsData });
		}
	}

})();