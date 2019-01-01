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

/* global browser, singlefile */

singlefile.ui.button = (() => {

	const DEFAULT_ICON_PATH = "/extension/ui/resources/icon_16.png";
	const WAIT_ICON_PATH_PREFIX = "/extension/ui/resources/icon_16_wait";
	const DEFAULT_TITLE = browser.i18n.getMessage("buttonDefaultTooltip");
	const DEFAULT_COLOR = [2, 147, 20, 255];

	browser.browserAction.onClicked.addListener(async tab => {
		if (singlefile.ui.isAllowedURL(tab.url)) {
			const tabs = await browser.tabs.query({ currentWindow: true, highlighted: true });
			if (!tabs.length) {
				singlefile.ui.saveTab(tab);
			} else {
				tabs.forEach(tab => (tab.active || tab.highlighted) && singlefile.ui.isAllowedURL(tab.url) && singlefile.ui.saveTab(tab));
			}
		}
	});
	browser.tabs.onActivated.addListener(async activeInfo => {
		const tab = await browser.tabs.get(activeInfo.tabId);
		await onTabActivated(tab);
	});
	browser.tabs.onCreated.addListener(async tab => {
		await refreshProperty(tab.id, "setBadgeBackgroundColor", { color: DEFAULT_COLOR });
		await onTabActivated(tab);
	});
	browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => onTabActivated(tab));
	browser.runtime.onMessage.addListener((request, sender) => {
		if (request.processReset) {
			onReset(sender.tab.id);
		}
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
		if (request.processCancelled) {
			onCancelled(sender.tab.id, request.options);
		}
	});

	return {
		onInitialize,
		onProgress,
		onEnd,
		onError,
		refresh: async tabId => {
			if (tabId) {
				const tabsData = await singlefile.tabsData.get();
				await refresh(tabId, getProperties({ autoSave: tabsData.autoSaveAll || tabsData.autoSaveUnpinned || (tabsData[tabId] && tabsData[tabId].autoSave) }));
			}
		}
	};

	function onReset(tabId) {
		refresh(tabId, getProperties({}, "", DEFAULT_COLOR, DEFAULT_TITLE));
	}

	function onInitialize(tabId, options, step) {
		if (step == 1) {
			onReset(tabId);
		}
		refresh(tabId, getProperties(options, browser.i18n.getMessage("buttonInitializingBadge"), step == 1 ? DEFAULT_COLOR : [4, 229, 36, 255], browser.i18n.getMessage("buttonInitializingTooltip") + " (" + step + "/2)", WAIT_ICON_PATH_PREFIX + "0.png"));
	}

	function onError(tabId, options) {
		refresh(tabId, getProperties(options, browser.i18n.getMessage("buttonErrorBadge"), [229, 4, 12, 255]));
	}

	function onCancelled(tabId, options) {
		refresh(tabId, getProperties(options, "", DEFAULT_COLOR, DEFAULT_TITLE));
	}

	function onEnd(tabId, options) {
		refresh(tabId, getProperties(options, browser.i18n.getMessage("buttonOKBadge"), [4, 229, 36, 255]));
	}

	function onProgress(tabId, index, maxIndex, options) {
		const progress = Math.max(Math.min(20, Math.floor((index / maxIndex) * 20)), 0);
		const barProgress = Math.min(Math.floor((index / maxIndex) * 8), 8);
		const path = WAIT_ICON_PATH_PREFIX + barProgress + ".png";
		refresh(tabId, getProperties(options, "", [4, 229, 36, 255], browser.i18n.getMessage("buttonSaveProgressTooltip") + (progress * 5) + "%", path, [128, 128, 128, 255]));
	}

	async function onTabActivated(tab) {
		const autoSave = await singlefile.autosave.enabled(tab.id);
		const properties = getCurrentProperties(tab.id, { autoSave });
		await refresh(tab.id, properties, true);
		if (browser.browserAction && browser.browserAction.enable && browser.browserAction.disable) {
			if (singlefile.ui.isAllowedURL(tab.url)) {
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

	function getCurrentProperties(tabId, options) {
		if (options.autoSave) {
			return getProperties(options);
		} else {
			const tabsData = singlefile.tabsData.getTemporary();
			const tabData = tabsData[tabId] && tabsData[tabId].button;
			if (tabData) {
				return tabData;
			} else {
				return getProperties(options);
			}
		}
	}

	function getProperties(options, text, color, title = DEFAULT_TITLE, path = DEFAULT_ICON_PATH, autoColor = [208, 208, 208, 255]) {
		return {
			setBadgeText: { text: options.autoSave ? browser.i18n.getMessage("buttonAutoSaveActiveBadge") : (text || "") },
			setBadgeBackgroundColor: { color: options.autoSave ? autoColor : color || DEFAULT_COLOR },
			setTitle: { title: options.autoSave ? browser.i18n.getMessage("buttonAutoSaveActiveTooltip") : title },
			setIcon: { path: options.autoSave ? DEFAULT_ICON_PATH : path }
		};
	}

	async function refresh(tabId, tabData) {
		const tabsData = singlefile.tabsData.getTemporary();
		if (!tabsData[tabId]) {
			tabsData[tabId] = {};
		}
		const oldTabData = tabsData[tabId].button || {};
		tabsData[tabId].button = tabData;
		if (!tabData.pendingRefresh) {
			tabData.pendingRefresh = Promise.resolve();
		}
		try {
			await tabData.pendingRefresh;
		} catch (error) {
			/* ignored */
		}
		tabData.pendingRefresh = refreshAsync(tabId, tabData, oldTabData);
	}

	async function refreshAsync(tabId, tabData, oldTabData) {
		for (const browserActionMethod of Object.keys(tabData)) {
			if (browserActionMethod == "setBadgeBackgroundColor" || !oldTabData[browserActionMethod] || JSON.stringify(oldTabData[browserActionMethod]) != JSON.stringify(tabData[browserActionMethod])) {
				await refreshProperty(tabId, browserActionMethod, tabData[browserActionMethod]);
			}
		}
	}

	async function refreshProperty(tabId, browserActionMethod, browserActionParameter) {
		if (browser.browserAction[browserActionMethod]) {
			const parameter = JSON.parse(JSON.stringify(browserActionParameter));
			parameter.tabId = tabId;
			await browser.browserAction[browserActionMethod](parameter);
		}
	}

})();