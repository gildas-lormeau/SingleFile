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

singlefile.ui.button = (() => {

	const DEFAULT_ICON_PATH = "/extension/ui/resources/icon_16.png";
	const WAIT_ICON_PATH_PREFIX = "/extension/ui/resources/icon_16_wait";
	const DEFAULT_TITLE = "Save page with SingleFile";
	const DEFAULT_COLOR = [2, 147, 20, 255];
	const BUTTON_PROPERTIES = [{ name: "color", browserActionMethod: "setBadgeBackgroundColor" }, { name: "path", browserActionMethod: "setIcon" }, { name: "text", browserActionMethod: "setBadgeText" }, { name: "title", browserActionMethod: "setTitle" }];

	browser.browserAction.onClicked.addListener(async tab => {
		if (singlefile.core.isAllowedURL(tab.url)) {
			const tabs = await browser.tabs.query({ currentWindow: true, highlighted: true });
			if (!tabs.length) {
				singlefile.ui.processTab(tab);
			} else {
				tabs.forEach(tab => singlefile.core.isAllowedURL(tab.url) && singlefile.ui.processTab(tab));
			}
		}
	});
	browser.tabs.onActivated.addListener(async activeInfo => {
		const tab = await browser.tabs.get(activeInfo.tabId);
		await onTabActivated(tab);
	});
	browser.tabs.onCreated.addListener(onTabActivated);
	browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => onTabActivated(tab));
	browser.runtime.onMessage.addListener((request, sender) => {
		if (request.processProgress) {
			if (request.maxIndex) {
				onProgress(sender.tab.id, request.index, request.maxIndex, request.options);
			}
		}
		if (request.processEnd) {
			onEnd(sender.tab.id, request.options);
		}
		if (request.processError) {
			if (request.error) {
				console.error("Initialization error", request.error); // eslint-disable-line no-console
			}
			onError(sender.tab.id, request.options);
		}
	});
	return {
		onInitialize,
		onProgress,
		onEnd,
		onError,
		refresh: (tabId, options) => refresh(tabId, getProperties(tabId, options))
	};

	function onInitialize(tabId, options, step) {
		refresh(tabId, getProperties(tabId, options, "•••", step == 1 ? DEFAULT_COLOR : [4, 229, 36, 255], "Initializing SingleFile (" + step + "/2)"));
	}

	function onError(tabId, options) {
		refresh(tabId, getProperties(tabId, options, "ERR", [229, 4, 12, 255]));
	}

	async function onEnd(tabId, options) {
		refresh(tabId, getProperties(tabId, options, "OK", [4, 229, 36, 255]));
	}

	function onProgress(tabId, index, maxIndex, options) {
		const progress = Math.max(Math.min(20, Math.floor((index / maxIndex) * 20)), 0);
		const barProgress = Math.floor((index / maxIndex) * 8);
		refresh(tabId, getProperties(tabId, options, "", [4, 229, 36, 255], "Save progress: " + (progress * 5) + "%", WAIT_ICON_PATH_PREFIX + barProgress + ".png", progress, barProgress, [128, 128, 128, 255]));
	}

	async function onTabActivated(tab) {
		const autoSave = await singlefile.ui.autosave.isEnabled(tab.id);
		await refresh(tab.id, getProperties(tab.id, { autoSave }));
		if (singlefile.core.isAllowedURL(tab.url) && browser.browserAction && browser.browserAction.enable && browser.browserAction.disable) {
			if (singlefile.core.isAllowedURL(tab.url)) {
				try {
					await browser.browserAction.enable(tab.id);
				} catch (error) {
					/* ignored */
				}
			} else {
				try {
					await browser.browserAction.disable(tab.id);
				} catch (error) {
					/* ignored */
				}
			}
		}
	}

	function getProperties(tabId, options, text, color, title = DEFAULT_TITLE, path = DEFAULT_ICON_PATH, progress = -1, barProgress = -1, autoColor = [208, 208, 208, 255]) {
		return {
			text: options.autoSave ? "[A]" : (text || ""),
			color: options.autoSave ? autoColor : color || DEFAULT_COLOR,
			title: options.autoSave ? "Autosave active" : title,
			path: options.autoSave ? DEFAULT_ICON_PATH : path,
			progress: options.autoSave ? - 1 : progress,
			barProgress: options.autoSave ? - 1 : barProgress
		};
	}

	async function refresh(tabId, tabData) {
		const tabsData = await singlefile.storage.getTemporary();
		if (!tabsData[tabId]) {
			tabsData[tabId] = {};
		}
		if (!tabsData[tabId].pendingRefresh) {
			tabsData[tabId].pendingRefresh = Promise.resolve();
		}
		tabsData[tabId].pendingRefresh = tabsData[tabId].pendingRefresh.then(() => refreshAsync(tabId, tabsData, tabData));
		try {
			await tabsData[tabId].pendingRefresh;
		} catch (error) {
			/* ignored */
		}
	}

	async function refreshAsync(tabId, tabsData, tabData) {
		for (let property of BUTTON_PROPERTIES) {
			await refreshProperty(tabId, tabsData, property.name, property.browserActionMethod, tabData);
		}
	}

	async function refreshProperty(tabId, tabsData, property, browserActionMethod, tabData) {
		const value = tabData[property];
		const browserActionParameter = { tabId };
		if (browser.browserAction[browserActionMethod]) {
			browserActionParameter[property] = value;
			if (!tabsData[tabId]) {
				tabsData[tabId] = {};
			}
			if (!tabsData[tabId].button) {
				tabsData[tabId].button = {};
			}
			if (JSON.stringify(tabsData[tabId].button[browserActionMethod]) != JSON.stringify(value)) {
				tabsData[tabId].button[browserActionMethod] = value;
				await browser.browserAction[browserActionMethod](browserActionParameter);
			}
		}
	}

})();