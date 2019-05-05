/*
 * Copyright 2010-2019 Gildas Lormeau
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

/* global browser, singlefile */

singlefile.extension.ui.bg.button = (() => {

	const DEFAULT_ICON_PATH = "/extension/ui/resources/icon_128.png";
	const WAIT_ICON_PATH_PREFIX = "/extension/ui/resources/icon_128_wait";
	const BUTTON_DEFAULT_TOOLTIP_MESSAGE = browser.i18n.getMessage("buttonDefaultTooltip");
	const BUTTON_BLOCKED_TOOLTIP_MESSAGE = browser.i18n.getMessage("buttonBlockedTooltip");
	const BUTTON_INITIALIZING_BADGE_MESSAGE = browser.i18n.getMessage("buttonInitializingBadge");
	const BUTTON_INITIALIZING_TOOLTIP_MESSAGE = browser.i18n.getMessage("buttonInitializingTooltip");
	const BUTTON_ERROR_BADGE_MESSAGE = browser.i18n.getMessage("buttonErrorBadge");
	const BUTTON_BLOCKED_BADGE_MESSAGE = browser.i18n.getMessage("buttonBlockedBadge");
	const BUTTON_OK_BADGE_MESSAGE = browser.i18n.getMessage("buttonOKBadge");
	const BUTTON_SAVE_PROGRESS_TOOLTIP_MESSAGE = browser.i18n.getMessage("buttonSaveProgressTooltip");
	const BUTTON_AUTOSAVE_ACTIVE_BADGE_MESSAGE = browser.i18n.getMessage("buttonAutoSaveActiveBadge");
	const BUTTON_AUTOSAVE_ACTIVE_TOOLTIP_MESSAGE = browser.i18n.getMessage("buttonAutoSaveActiveTooltip");
	const DEFAULT_COLOR = [2, 147, 20, 192];

	browser.browserAction.onClicked.addListener(async tab => {
		const business = singlefile.extension.core.bg.business;
		const allTabs = await singlefile.extension.core.bg.tabs.get({ currentWindow: true, highlighted: true });
		if (!allTabs.length) {
			business.saveTab(tab);
		} else {
			allTabs.forEach(tab => (tab.active || tab.highlighted) && business.saveTab(tab));
		}
	});

	return {
		onMessage,
		onTabCreated,
		onTabActivated,
		onTabUpdated,
		onInitialize,
		onProgress,
		onEnd,
		onForbiddenDomain,
		onError,
		refreshTab,
		refresh: async (tab, options) => {
			if (tab.id) {
				await refresh(tab.id, getProperties(options));
			}
		}
	};

	function onMessage(message, sender) {
		if (message.method.endsWith(".loadURL")) {
			onLoad(sender.tab.id);
		}
		if (message.method.endsWith(".processProgress")) {
			if (message.maxIndex) {
				onProgress(sender.tab.id, message.index, message.maxIndex, message.options);
			}
		}
		if (message.method.endsWith(".processEnd")) {
			onEnd(sender.tab.id, message.options);
		}
		if (message.method.endsWith(".processError")) {
			if (message.error) {
				console.error("Initialization error", message.error); // eslint-disable-line no-console
			}
			onError(sender.tab.id, message.options);
		}
		if (message.method.endsWith(".processCancelled")) {
			onCancelled(sender.tab.id, message.options);
		}
		return Promise.resolve({});
	}

	function onTabUpdated(tabId, changeInfo, tab) {
		refreshTab(tab);
	}

	async function onTabCreated(tab) {
		refreshTab(tab);
	}

	async function onTabActivated(tab) {
		refreshTab(tab);
	}

	function onLoad(tabId) {
		refresh(tabId, getProperties({}, "", DEFAULT_COLOR, BUTTON_DEFAULT_TOOLTIP_MESSAGE));
	}

	function onInitialize(tabId, options, step) {
		refresh(tabId, getProperties(options, BUTTON_INITIALIZING_BADGE_MESSAGE, step == 1 ? DEFAULT_COLOR : [4, 229, 36, 192], BUTTON_INITIALIZING_TOOLTIP_MESSAGE + " (" + step + "/2)", WAIT_ICON_PATH_PREFIX + "0.png"));
	}

	function onError(tabId, options) {
		refresh(tabId, getProperties(options, BUTTON_ERROR_BADGE_MESSAGE, [229, 4, 12, 192]));
	}

	function onForbiddenDomain(tab, options) {
		if (singlefile.extension.core.bg.util.isAllowedProtocol(tab.url)) {
			refresh(tab.id, getProperties(options, BUTTON_BLOCKED_BADGE_MESSAGE, [255, 255, 255, 1], BUTTON_BLOCKED_TOOLTIP_MESSAGE));
		}
	}

	function onCancelled(tabId, options) {
		refresh(tabId, getProperties(options, "", DEFAULT_COLOR, BUTTON_DEFAULT_TOOLTIP_MESSAGE));
	}

	function onEnd(tabId, options) {
		refresh(tabId, getProperties(options, BUTTON_OK_BADGE_MESSAGE, [4, 229, 36, 192]));
	}

	function onProgress(tabId, index, maxIndex, options) {
		const progress = Math.max(Math.min(20, Math.floor((index / maxIndex) * 20)), 0);
		const barProgress = Math.min(Math.floor((index / maxIndex) * 8), 8);
		const path = WAIT_ICON_PATH_PREFIX + barProgress + ".png";
		refresh(tabId, getProperties(options, "", [4, 229, 36, 192], BUTTON_SAVE_PROGRESS_TOOLTIP_MESSAGE + (progress * 5) + "%", path, [128, 128, 128, 192]));
	}

	async function refreshTab(tab) {
		const options = { autoSave: await singlefile.extension.core.bg.autosave.isEnabled(tab) };
		const properties = getCurrentProperties(tab.id, options);
		if (singlefile.extension.core.bg.util.isAllowedURL(tab.url)) {
			await refresh(tab.id, properties);
		} else {
			try {
				await onForbiddenDomain(tab, options);
			} catch (error) {
				/* ignored */
			}
		}
	}

	function getCurrentProperties(tabId, options) {
		if (options.autoSave) {
			return getProperties(options);
		} else {
			const allTabsData = singlefile.extension.core.bg.tabsData.getTemporary(tabId);
			delete allTabsData[tabId].button;
			return getProperties(options);
		}
	}

	function getProperties(options, text, color, title = BUTTON_DEFAULT_TOOLTIP_MESSAGE, path = DEFAULT_ICON_PATH, autoColor = [208, 208, 208, 192]) {
		return {
			setBadgeBackgroundColor: { color: options.autoSave ? autoColor : color || DEFAULT_COLOR },
			setBadgeText: { text: options.autoSave ? BUTTON_AUTOSAVE_ACTIVE_BADGE_MESSAGE : (text || "") },
			setTitle: { title: options.autoSave ? BUTTON_AUTOSAVE_ACTIVE_TOOLTIP_MESSAGE : title },
			setIcon: { path: options.autoSave ? DEFAULT_ICON_PATH : path }
		};
	}

	async function refresh(tabId, tabData) {
		const allTabsData = singlefile.extension.core.bg.tabsData.getTemporary(tabId);
		const oldTabData = allTabsData[tabId].button || {};
		allTabsData[tabId].button = tabData;
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
			if (browserActionMethod != "pendingRefresh" && (!oldTabData[browserActionMethod] || JSON.stringify(oldTabData[browserActionMethod]) != JSON.stringify(tabData[browserActionMethod]))) {
				try {
					await refreshProperty(tabId, browserActionMethod, tabData[browserActionMethod]);
				} catch (error) {
					/* ignored */
				}
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