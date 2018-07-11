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

/* global singlefile, navigator */

singlefile.ui = (() => {

	const browser = this.browser || this.chrome;

	const DEFAULT_ICON_PATH = "/extension/ui/resources/icon_19.png";
	const WAIT_ICON_PATH_PREFIX = "/extension/ui/resources/icon_19_wait";
	const DEFAULT_TITLE = "Process this page with SingleFile";
	const DEFAULT_COLOR = [2, 147, 20, 255];
	const BADGE_PROPERTIES = [{ name: "text", browserActionMethod: "setBadgeText" }, { name: "color", browserActionMethod: "setBadgeBackgroundColor" }, { name: "title", browserActionMethod: "setTitle" }, { name: "path", browserActionMethod: "setIcon" }];
	const RUNNING_IN_EDGE = navigator.userAgent.includes("Edge");
	const STORE_URLS = ["https://chrome.google.com", "https://addons.mozilla.org"];
	const MENU_ID_SAVE_PAGE = "save-page";
	const MENU_ID_SAVE_SELECTED = "save-selected";

	const tabs = {};
	const badgeTabs = {};
	let badgeRefreshPending = [];

	browser.runtime.onInstalled.addListener(refreshContextMenu);
	browser.contextMenus.onClicked.addListener((event, tab) => {
		if (event.menuItemId == MENU_ID_SAVE_PAGE) {
			processTab(tab);
		}
		if (event.menuItemId == MENU_ID_SAVE_SELECTED) {
			processTab(tab, { selected: true });
		}
	});
	browser.browserAction.onClicked.addListener(tab => {
		if (isAllowedURL(tab.url)) {
			browser.tabs.query({ currentWindow: true, highlighted: true }, tabs => {
				tabs = tabs.filter(tab => tab.highlighted);
				if (!tabs.length) {
					processTab(tab);
				} else {
					tabs.forEach(processTab);
				}
			});
		}
	});
	browser.tabs.onActivated.addListener(activeInfo => browser.tabs.get(activeInfo.tabId, tab => onActive(tab.id, isAllowedURL(tab.url))));
	browser.tabs.onCreated.addListener(tab => onActive(tab.id, isAllowedURL(tab.url)));
	browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => onActive(tab.id, isAllowedURL(tab.url)));
	browser.tabs.onRemoved.addListener(tabId => onRemoved(tabId));
	browser.runtime.onMessage.addListener((request, sender) => {
		if (request.processStart || request.processProgress) {
			onProgress(sender.tab.id, request.index, request.maxIndex);
		}
		if (request.processEnd) {
			onEnd(sender.tab.id);
		}
		if (request.processError) {
			onError(sender.tab.id);
		}
		return false;
	});
	return { update: refreshContextMenu };

	function refreshContextMenu() {
		const contextMenuEnabled = singlefile.config.get().contextMenuEnabled;
		if (contextMenuEnabled) {
			browser.contextMenus.create({
				id: MENU_ID_SAVE_PAGE,
				contexts: ["page"],
				title: "Save page with SingleFile"
			});
			browser.contextMenus.create({
				id: MENU_ID_SAVE_SELECTED,
				contexts: ["selection"],
				title: "Save selection with SingleFile"
			});
		} else {
			browser.contextMenus.removeAll();
		}
	}

	function processTab(tab) {
		const tabId = tab.id;
		singlefile.core.processTab(tab);
		tabs[tabId] = {
			id: tabId,
			text: "...",
			color: DEFAULT_COLOR,
			title: "initializing...",
			path: DEFAULT_ICON_PATH,
			progress: -1,
			barProgress: -1
		};
		refreshBadge(tabId);
	}

	function onError(tabId) {
		const tabData = tabs[tabId];
		tabData.text = "ERR";
		tabData.color = [229, 4, 12, 255];
		tabData.title = DEFAULT_TITLE;
		tabData.path = DEFAULT_ICON_PATH;
		tabData.progress = -1;
		tabData.barProgress = -1;
		refreshBadge(tabId);
	}

	function onEnd(tabId) {
		const tabData = tabs[tabId];
		tabData.text = "OK";
		tabData.color = [4, 229, 36, 255];
		tabData.title = DEFAULT_TITLE;
		tabData.path = DEFAULT_ICON_PATH;
		tabData.progress = -1;
		tabData.barProgress = -1;
		refreshBadge(tabId);
	}

	function onProgress(tabId, index, maxIndex) {
		const tabData = tabs[tabId];
		const progress = Math.max(Math.min(100, Math.floor((index / maxIndex) * 100)), 0);
		if (tabData.progress != progress) {
			tabData.progress = progress;
			tabData.text = "";
			tabData.title = "progress: " + Math.min(100, Math.floor((index / maxIndex) * 100)) + "%";
			tabData.color = [4, 229, 36, 255];
			const barProgress = Math.floor((index / maxIndex) * 15);
			if (tabData.barProgress != barProgress) {
				tabData.barProgress = barProgress;
				tabData.path = WAIT_ICON_PATH_PREFIX + barProgress + ".png";
			}
			refreshBadge(tabId);
		}
	}

	function onRemoved(tabId) {
		delete tabs[tabId];
	}

	function onActive(tabId, isActive) {
		if (isActive) {
			browser.browserAction.enable(tabId);
		} else {
			browser.browserAction.disable(tabId);
		}
	}

	function isAllowedURL(url) {
		return url && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("file://")) && !STORE_URLS.find(storeUrl => url.startsWith(storeUrl));
	}

	async function refreshBadge(tabId) {
		await Promise.all(badgeRefreshPending);
		const promise = refreshBadgeAsync(tabId);
		badgeRefreshPending.push(promise);
		await promise;
		badgeRefreshPending = badgeRefreshPending.filter(pending => pending != promise);
	}

	async function refreshBadgeAsync(tabId) {
		for (let property of BADGE_PROPERTIES) {
			await refreshBadgeProperty(tabId, property.name, property.browserActionMethod);
		}
	}

	async function refreshBadgeProperty(tabId, property, browserActionMethod) {
		const tabData = tabs[tabId];
		const value = tabData[property];
		if (!badgeTabs[tabId]) {
			badgeTabs[tabId] = {};
		}
		if (JSON.stringify(badgeTabs[tabId][property]) != JSON.stringify(value)) {
			const browserActionParameter = { tabId };
			badgeTabs[tabId][property] = browserActionParameter[property] = value;
			return new Promise(resolve => {
				if (RUNNING_IN_EDGE) {
					browser.browserAction[browserActionMethod](browserActionParameter);
					resolve();
				} else {
					browser.browserAction[browserActionMethod](browserActionParameter, resolve);
				}
			});
		}
	}

})();