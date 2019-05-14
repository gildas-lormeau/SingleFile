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
	const BUTTON_DEFAULT_BADGE_MESSAGE = "";
	const BUTTON_INITIALIZING_BADGE_MESSAGE = browser.i18n.getMessage("buttonInitializingBadge");
	const BUTTON_INITIALIZING_TOOLTIP_MESSAGE = browser.i18n.getMessage("buttonInitializingTooltip");
	const BUTTON_ERROR_BADGE_MESSAGE = browser.i18n.getMessage("buttonErrorBadge");
	const BUTTON_BLOCKED_BADGE_MESSAGE = browser.i18n.getMessage("buttonBlockedBadge");
	const BUTTON_OK_BADGE_MESSAGE = browser.i18n.getMessage("buttonOKBadge");
	const BUTTON_SAVE_PROGRESS_TOOLTIP_MESSAGE = browser.i18n.getMessage("buttonSaveProgressTooltip");
	const BUTTON_AUTOSAVE_ACTIVE_BADGE_MESSAGE = browser.i18n.getMessage("buttonAutoSaveActiveBadge");
	const BUTTON_AUTOSAVE_ACTIVE_TOOLTIP_MESSAGE = browser.i18n.getMessage("buttonAutoSaveActiveTooltip");
	const DEFAULT_COLOR = [2, 147, 20, 192];
	const ACTIVE_COLOR = [4, 229, 36, 192];
	const FORBIDDEN_COLOR = [255, 255, 255, 1];
	const ERROR_COLOR = [229, 4, 12, 192];
	const AUTOSAVE_DEFAULT_COLOR = [208, 208, 208, 192];
	const AUTOSAVE_INITIALIZING_COLOR = [64, 64, 64, 192];
	const INJECT_SCRIPTS_STEP = 1;

	const BUTTON_STATES = {
		default: {
			setBadgeBackgroundColor: { color: DEFAULT_COLOR },
			setBadgeText: { text: BUTTON_DEFAULT_BADGE_MESSAGE },
			setTitle: { title: BUTTON_DEFAULT_TOOLTIP_MESSAGE },
			setIcon: { path: DEFAULT_ICON_PATH }
		},
		inject: {
			setBadgeBackgroundColor: { color: DEFAULT_COLOR },
			setBadgeText: { text: BUTTON_INITIALIZING_BADGE_MESSAGE },
			setTitle: { title: BUTTON_INITIALIZING_TOOLTIP_MESSAGE },
		},
		execute: {
			setBadgeBackgroundColor: { color: ACTIVE_COLOR },
			setBadgeText: { text: BUTTON_INITIALIZING_BADGE_MESSAGE },
		},
		progress: {
			setBadgeBackgroundColor: { color: ACTIVE_COLOR },
			setBadgeText: { text: BUTTON_DEFAULT_BADGE_MESSAGE }
		},
		end: {
			setBadgeBackgroundColor: { color: ACTIVE_COLOR },
			setBadgeText: { text: BUTTON_OK_BADGE_MESSAGE },
			setTitle: { title: BUTTON_DEFAULT_TOOLTIP_MESSAGE },
			setIcon: { path: DEFAULT_ICON_PATH }
		},
		error: {
			setBadgeBackgroundColor: { color: ERROR_COLOR },
			setBadgeText: { text: BUTTON_ERROR_BADGE_MESSAGE },
			setTitle: { title: BUTTON_DEFAULT_BADGE_MESSAGE },
			setIcon: { path: DEFAULT_ICON_PATH }
		},
		forbidden: {
			setBadgeBackgroundColor: { color: FORBIDDEN_COLOR },
			setBadgeText: { text: BUTTON_BLOCKED_BADGE_MESSAGE },
			setTitle: { title: BUTTON_BLOCKED_TOOLTIP_MESSAGE },
			setIcon: { path: DEFAULT_ICON_PATH }
		},
		autosave: {
			inject: {
				setBadgeBackgroundColor: { color: AUTOSAVE_INITIALIZING_COLOR },
				setBadgeText: { text: BUTTON_AUTOSAVE_ACTIVE_BADGE_MESSAGE },
				setTitle: { title: BUTTON_AUTOSAVE_ACTIVE_TOOLTIP_MESSAGE },
				setIcon: { path: DEFAULT_ICON_PATH }
			},
			default: {
				setBadgeBackgroundColor: { color: AUTOSAVE_DEFAULT_COLOR },
				setBadgeText: { text: BUTTON_AUTOSAVE_ACTIVE_BADGE_MESSAGE },
				setTitle: { title: BUTTON_AUTOSAVE_ACTIVE_TOOLTIP_MESSAGE },
				setIcon: { path: DEFAULT_ICON_PATH }
			}
		}
	};

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
		onStart,
		onForbiddenDomain,
		onError,
		onEnd,
		refreshTab
	};

	function onMessage(message, sender) {
		if (message.method.endsWith(".processInit")) {
			const tabsData = singlefile.extension.core.bg.tabsData.getTemporary(sender.tab.id);
			delete tabsData[sender.tab.id].button;
			refreshTab(sender.tab);
		}
		if (message.method.endsWith(".processProgress")) {
			if (message.maxIndex) {
				onProgress(sender.tab.id, message.index, message.maxIndex);
			}
		}
		if (message.method.endsWith(".processEnd")) {
			onEnd(sender.tab.id);
		}
		if (message.method.endsWith(".processError")) {
			if (message.error) {
				console.error("Initialization error", message.error); // eslint-disable-line no-console
			}
			onError(sender.tab.id);
		}
		if (message.method.endsWith(".processCancelled")) {
			onCancelled(sender.tab);
		}
		return Promise.resolve({});
	}

	function onStart(tabId, step, autoSave) {
		let state;
		if (autoSave) {
			state = getButtonState("inject", true);
		} else {
			state = step == INJECT_SCRIPTS_STEP ? getButtonState("inject") : getButtonState("execute");
			state.setTitle = { title: BUTTON_INITIALIZING_TOOLTIP_MESSAGE + " (" + step + "/2)" };
			state.setIcon = { path: WAIT_ICON_PATH_PREFIX + "0.png" };
		}
		refresh(tabId, state);
	}

	function onError(tabId) {
		refresh(tabId, getButtonState("error"));
	}

	function onEnd(tabId, autoSave) {
		refresh(tabId, autoSave ? getButtonState("default", true) : getButtonState("end"));
	}

	function onForbiddenDomain(tab) {
		refresh(tab.id, getButtonState("forbidden"));
	}

	function onCancelled(tab) {
		refreshTab(tab);
	}

	function onProgress(tabId, index, maxIndex) {
		const progress = Math.max(Math.min(20, Math.floor((index / maxIndex) * 20)), 0);
		const barProgress = Math.min(Math.floor((index / maxIndex) * 8), 8);
		const path = WAIT_ICON_PATH_PREFIX + barProgress + ".png";
		const state = getButtonState("progress");
		state.setTitle = { title: BUTTON_SAVE_PROGRESS_TOOLTIP_MESSAGE + (progress * 5) + "%" };
		state.setIcon = { path };
		refresh(tabId, state);
	}

	async function refreshTab(tab) {
		const autoSave = await singlefile.extension.core.bg.autosave.isEnabled(tab);
		const state = getButtonState("default", autoSave);
		await refresh(tab.id, state);
	}

	async function refresh(tabId, state) {
		const tabsData = singlefile.extension.core.bg.tabsData.getTemporary(tabId);
		if (state) {
			if (!tabsData[tabId].button) {
				tabsData[tabId].button = { lastState: null };
			}
			const lastState = tabsData[tabId].button.lastState || {};
			const newState = {};
			Object.keys(state).forEach(property => {
				if (state[property] !== undefined && (JSON.stringify(lastState[property]) != JSON.stringify(state[property]))) {
					newState[property] = state[property];
				}
			});
			if (Object.keys(newState).length) {
				tabsData[tabId].button.lastState = state;
				await refreshAsync(tabId, newState);
			}
		}
	}

	async function refreshAsync(tabId, state) {
		for (const browserActionMethod of Object.keys(state)) {
			await refreshProperty(tabId, browserActionMethod, state[browserActionMethod]);
		}
	}

	async function refreshProperty(tabId, browserActionMethod, browserActionParameter) {
		if (browser.browserAction[browserActionMethod]) {
			const parameter = JSON.parse(JSON.stringify(browserActionParameter));
			parameter.tabId = tabId;
			await browser.browserAction[browserActionMethod](parameter);
		}
	}

	function getButtonState(name, autoSave) {
		return JSON.parse(JSON.stringify(autoSave ? BUTTON_STATES.autosave[name] : BUTTON_STATES[name]));
	}

})();