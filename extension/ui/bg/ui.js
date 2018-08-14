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
	const MENU_ID_SAVE_PAGE = "save-page";
	const MENU_ID_SAVE_SELECTED = "save-selected";
	const MENU_ID_SAVE_FRAME = "save-frame";
	const MENU_ID_SAVE_TABS = "save-tabs";
	const MENU_ID_SAVE_SELECTED_TABS = "save-selected-tabs";

	const tabs = {};

	browser.runtime.onInstalled.addListener(refreshContextMenu);
	if (browser.menus && browser.menus.onClicked) {
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
			if (event.menuItemId == MENU_ID_SAVE_TABS) {
				const tabs = await browser.tabs.query({ currentWindow: true });
				tabs.forEach(tab => isAllowedURL(tab.url) && processTab(tab));
			}
			if (event.menuItemId == MENU_ID_SAVE_SELECTED_TABS) {
				const tabs = await browser.tabs.query({ currentWindow: true, highlighted: true });
				tabs.forEach(tab => isAllowedURL(tab.url) && processTab(tab));
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
		const tab = browser.tabs.get(activeInfo.tabId);
		onTabActivated(tab.id, isAllowedURL(tab.url));
	});
	browser.tabs.onCreated.addListener(tab => onTabActivated(tab.id, isAllowedURL(tab.url)));
	browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => onTabActivated(tab.id, isAllowedURL(tab.url)));
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
		if (browser.menus && browser.menus.removeAll && browser.menus.create) {
			if (config.contextMenuEnabled) {
				await browser.menus.removeAll();
				browser.menus.create({
					id: MENU_ID_SAVE_PAGE,
					contexts: ["page"],
					title: DEFAULT_TITLE
				});
				browser.menus.create({
					id: MENU_ID_SAVE_TABS,
					contexts: ["page"],
					title: "Save all tabs"
				});
				browser.menus.create({
					id: MENU_ID_SAVE_SELECTED_TABS,
					contexts: ["page"],
					title: "Save selected tabs"
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
			} else {
				await browser.menus.removeAll();
			}
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

	function onTabEnd(tabId) {
		refreshBadge(tabId, {
			text: "OK",
			color: [4, 229, 36, 255],
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

	function onTabRemoved(tabId) {
		delete tabs[tabId];
	}

	function onTabActivated(tabId, isActive) {
		if (browser.browserAction && browser.browserAction.enable && browser.browserAction.disable) {
			if (isActive) {
				browser.browserAction.enable(tabId);
				if (browser.runtime.lastError) {
					/* ignored */
				}
			} else {
				browser.browserAction.disable(tabId);
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
		if (!tabs[tabId]) {
			tabs[tabId] = {};
		}
		if (!tabs[tabId].pendingRefresh) {
			tabs[tabId].pendingRefresh = Promise.resolve();
		}
		tabs[tabId].pendingRefresh = tabs[tabId].pendingRefresh.then(() => refreshBadgeAsync(tabId, tabData));
		await tabs[tabId].pendingRefresh;
	}

	async function refreshBadgeAsync(tabId, tabData, lastTabData) {
		for (let property of BADGE_PROPERTIES) {
			await refreshBadgeProperty(tabId, property.name, property.browserActionMethod, tabData, lastTabData);
		}
	}

	async function refreshBadgeProperty(tabId, property, browserActionMethod, tabData) {
		const value = tabData[property];
		const browserActionParameter = { tabId };
		if (browser.browserAction && browser.browserAction[browserActionMethod]) {
			browserActionParameter[property] = value;
			if (!tabs[tabId]) {
				tabs[tabId] = {};
			}
			if (!tabs[tabId].badge) {
				tabs[tabId].badge = {};
			}
			if (JSON.stringify(tabs[tabId].badge[browserActionMethod]) != JSON.stringify(value)) {
				tabs[tabId].badge[browserActionMethod] = value;
				await browser.browserAction[browserActionMethod](browserActionParameter);
			}
		}
	}

})();