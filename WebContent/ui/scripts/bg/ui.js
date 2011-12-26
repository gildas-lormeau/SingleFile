/*
 * Copyright 2011 Gildas Lormeau
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

(function() {

	singlefile.ui = {};

	var DEFAULT_ICON_PATH = "../resources/icon_19.png";
	var DEFAULT_PASSIVE_ICON_PATH = "../resources/icon_19_forbidden.png";
	var DEFAULT_BADGE_CONFIG = {
		text : "",
		color : [ 64, 64, 64, 255 ],
		title : "Process this page with SingleFile",
		path : DEFAULT_ICON_PATH
	};

	var badgeStates = [], currentBarProgress = -1, currentProgress = -1, tabs = {}, badgeConfig = JSON.parse(JSON.stringify(DEFAULT_BADGE_CONFIG));

	function refreshBadge(tabId) {
		function refreshTabBadge(tabId) {
			function refreshBadgeProperty(property, fn) {
				var badgeState;
				var tabData = tabs[tabId], confObject = {
					tabId : tabId
				};
				if (!badgeStates[tabId])
					badgeStates[tabId] = [];
				badgeState = badgeStates[tabId];
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

			refreshBadgeProperty("text", chrome.browserAction.setBadgeText);
			refreshBadgeProperty("color", chrome.browserAction.setBadgeBackgroundColor);
			refreshBadgeProperty("title", chrome.browserAction.setTitle);
			refreshBadgeProperty("path", chrome.browserAction.setIcon);
		}

		// TODO : getAllInWindow is deprecated
		if (tabId)
			refreshTabBadge(tabId);
		else
			chrome.tabs.getAllInWindow(null, function(tabs) {
				tabs.forEach(function(tab) {
					refreshTabBadge(tab.id);
				});
			});
	}

	singlefile.ui.notifyProcessInit = function(tabId) {
		var tabData = {
			id : tabId,
			text : "...",
			color : [ 2, 147, 20, 255 ],
			title : "Initialize process...",
			path : DEFAULT_ICON_PATH,
			processing : true
		};
		tabs[tabId] = tabData;
		refreshBadge(tabId);
	};

	singlefile.ui.notifyProcessStart = function(tabId, processingPagesCount) {
		delete tabs[tabId].text;
		delete tabs[tabId].title;
		delete tabs[tabId].path;
		tabs[tabId].color = [ 4, 229, 36, 255 ];
		badgeConfig.text = "" + processingPagesCount;
		refreshBadge();
	};

	singlefile.ui.notifyProcessError = function(tabId) {
		delete tabs[tabId].processing;
		tabs[tabId].color = [ 229, 4, 12, 255 ];
		tabs[tabId].text = "ERR";
		refreshBadge(tabId);
	};

	singlefile.ui.notifyProcessEnd = function(tabId, processingPagesCount, displayNotification, displayBanner, url, title) {
		var params = encodeURIComponent(url) + "&" + encodeURIComponent(title);
		if (displayNotification)
			webkitNotifications.createHTMLNotification("notification.html?" + params).show();
		if (displayBanner)
			chrome.tabs.sendRequest(tabId, {
				displayBanner : true,
				url : chrome.extension.getURL("/pages/banner.html") + "?" + params
			});
		tabs[tabId].text = "OK";
		delete tabs[tabId].processing;
		badgeConfig.text = ("" + processingPagesCount || "");
		if (!processingPagesCount) {
			currentBarProgress = -1;
			currentProgress = -1;
			delete tabs[tabId].title;
			badgeConfig = JSON.parse(JSON.stringify(DEFAULT_BADGE_CONFIG));
		}
		refreshBadge();
	};

	singlefile.ui.notifyProcessProgress = function(index, maxIndex) {
		var barProgress, progress;
		if (maxIndex) {
			progress = Math.min(100, Math.floor((index / maxIndex) * 100));
			if (currentProgress != progress) {
				currentProgress = progress;
				badgeConfig.title = "progress: " + Math.min(100, Math.floor((index / maxIndex) * 100)) + "%";
				barProgress = Math.floor((index / maxIndex) * 15);
				if (currentBarProgress != barProgress) {
					currentBarProgress = barProgress;
					badgeConfig.path = "../resources/icon_19_wait" + barProgress + ".png";
				}
				refreshBadge();
			}
		}
	};

	singlefile.ui.notifyTabRemoved = function(tabId) {
		delete tabs[tabId];
		delete badgeStates[tabId];
	};

	singlefile.ui.notifyProcessable = function(tabId, processable, reset) {
		if (!processable) {
			tabs[tabId] = {
				path : DEFAULT_PASSIVE_ICON_PATH,
				title : "SingleFile cannot process this page"
			};
		} else if (reset && tabs[tabId] && !tabs[tabId].processing)
			delete tabs[tabId];
		refreshBadge(tabId);
	};

})();
