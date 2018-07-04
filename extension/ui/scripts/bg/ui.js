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

/* global singlefile, chrome */

singlefile.ui = (() => {

	const DEFAULT_ICON_PATH = "/extension/ui/resources/icon_19.png";
	const WAIT_ICON_PATH_PREFIX = "/extension/ui/resources/icon_19_wait";
	const DEFAULT_BADGE_CONFIG = {
		text: "",
		color: [64, 64, 64, 255],
		title: "Process this page with SingleFile",
		path: DEFAULT_ICON_PATH
	};
	const badgeStates = [];
	const tabs = {};

	let badgeConfig = JSON.parse(JSON.stringify(DEFAULT_BADGE_CONFIG));

	return {
		notifyProcessInit(tabId) {
			tabs[tabId] = {
				id: tabId,
				text: "...",
				color: [2, 147, 20, 255],
				title: "initializing...",
				path: DEFAULT_ICON_PATH,
				processing: true,
				currentBarProgress: -1,
				currentProgress: -1
			};
			refreshBadge(tabId);
		},
		notifyProcessStart(tabId) {
			const tabData = tabs[tabId];
			delete tabData.text;
			delete tabData.title;
			delete tabData.path;
			tabData.color = [4, 229, 36, 255];
			badgeConfig.text = "";
			refreshBadge();
		},
		notifyProcessError(tabId) {
			const tabData = tabs[tabId];
			delete tabData.processing;
			tabData.color = [229, 4, 12, 255];
			tabData.text = "ERR";
			refreshBadge(tabId);
		},
		notifyProcessEnd(tabId) {
			const tabData = tabs[tabId];
			tabData.text = "OK";
			delete tabData.processing;
			badgeConfig.text = "";
			tabData.currentBarProgress = -1;
			tabData.currentProgress = -1;
			delete tabData.title;
			badgeConfig = JSON.parse(JSON.stringify(DEFAULT_BADGE_CONFIG));
			refreshBadge();
		},
		notifyProcessProgress(tabId, index, maxIndex) {
			if (maxIndex) {
				const tabData = tabs[tabId];
				const progress = Math.max(Math.min(100, Math.floor((index / maxIndex) * 100)), 0);
				if (tabData.currentProgress != progress) {
					tabData.currentProgress = progress;
					badgeConfig.title = "progress: " + Math.min(100, Math.floor((index / maxIndex) * 100)) + "%";
					const barProgress = Math.floor((index / maxIndex) * 15);
					if (tabData.currentBarProgress != barProgress) {
						tabData.currentBarProgress = barProgress;
						badgeConfig.path = WAIT_ICON_PATH_PREFIX + barProgress + ".png";
					}
					refreshBadge();
				}
			}
		},
		notifyTabRemoved(tabId) {
			delete tabs[tabId];
			delete badgeStates[tabId];
		},
		notifyActive(tabId, isActive, reset) {
			if (isActive) {
				chrome.browserAction.enable(tabId);
				if (reset && tabs[tabId] && !tabs[tabId].processing) {
					delete tabs[tabId];
					refreshBadge(tabId);
				}
			}
			if (!isActive) {
				chrome.browserAction.disable(tabId);
			}
		}
	};

	function refreshBadge(tabId) {
		if (tabId) {
			refreshTabBadge(tabId);
		} else {
			chrome.tabs.query({ currentWindow: true }, tabs => tabs.forEach(tab => refreshTabBadge(tab.id)));
		}
	}

	function refreshTabBadge(tabId) {
		refreshBadgeProperty("text", chrome.browserAction.setBadgeText);
		refreshBadgeProperty("color", chrome.browserAction.setBadgeBackgroundColor);
		refreshBadgeProperty("title", chrome.browserAction.setTitle);
		refreshBadgeProperty("path", chrome.browserAction.setIcon);

		function refreshBadgeProperty(property, fn) {
			const tabData = tabs[tabId];
			const confObject = { tabId };
			if (!badgeStates[tabId]) {
				badgeStates[tabId] = [];
			}
			const badgeState = badgeStates[tabId];
			if (tabData && tabData[property]) {
				if (badgeState[property] != tabData[property]) {
					badgeState[property] = tabData[property];
					confObject[property] = tabData[property];
					fn(confObject);
				}
			} else {
				if (badgeState[property] != badgeConfig[property]) {
					badgeState[property] = badgeConfig[property];
					confObject[property] = badgeConfig[property];
					fn(confObject);
				}
			}
		}
	}

})();
