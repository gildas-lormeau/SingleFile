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
		bgColor : [ 64, 64, 64, 255 ],
		title : "Process this page with SingleFile",
		iconPath : DEFAULT_ICON_PATH
	};

	var currentBarProgress = -1, currentProgress = -1, tabsData = {}, badgeConfig = JSON.parse(JSON.stringify(DEFAULT_BADGE_CONFIG));

	function refreshBadge(tabId) {
		function refreshTabBadge(tabId) {
			chrome.browserAction.setBadgeText({
				tabId : tabId,
				text : tabsData[tabId] && tabsData[tabId].text || badgeConfig.text
			});
			chrome.browserAction.setBadgeBackgroundColor({
				tabId : tabId,
				color : tabsData[tabId] && tabsData[tabId].bgColor || badgeConfig.bgColor
			});
			chrome.browserAction.setTitle({
				tabId : tabId,
				title : tabsData[tabId] && tabsData[tabId].title || badgeConfig.title
			});
			chrome.browserAction.setIcon({
				tabId : tabId,
				path : tabsData[tabId] && tabsData[tabId].iconPath || badgeConfig.iconPath
			});
		}

		if (tabId)
			refreshTabBadge(tabId);
		else
			chrome.tabs.getAllInWindow(null, function(tabs) {
				tabs.forEach(function(tab) {
					refreshTabBadge(tab.id);
				});
			});
	}

	singlefile.ui.notifySavedPage = function(processed, filename) {
		var notificationArchiving = webkitNotifications.createNotification(DEFAULT_ICON_PATH, "SingleFile", processed ? (filename + " is saved") : ("Error: "
				+ filename + " cannot be saved"));
		notificationArchiving.show();
		if (processed)
			setTimeout(function() {
				notificationArchiving.cancel();
			}, 3000);
	};

	singlefile.ui.notifyProcessInit = function(tabId) {
		var tabData = {
			id : tabId,
			text : "...",
			bgColor : [ 2, 147, 20, 255 ],
			title : "Initialize process...",
			iconPath : DEFAULT_ICON_PATH,
			processing : true
		};
		tabsData[tabId] = tabData;
		refreshBadge(tabId);
	};

	singlefile.ui.notifyProcessStart = function(tabId, processingPagesCount) {
		delete tabsData[tabId].text;
		delete tabsData[tabId].title;
		delete tabsData[tabId].iconPath;
		tabsData[tabId].bgColor = [ 4, 229, 36, 255 ];
		badgeConfig.text = "" + processingPagesCount;
		refreshBadge();
	};

	singlefile.ui.notifyProcessError = function(tabId) {
		delete tabsData[tabId].processing;
		tabsData[tabId].bgColor = [ 229, 4, 12, 255 ];
		tabsData[tabId].text = "ERR";
		refreshBadge(tabId);
	};

	singlefile.ui.notifyProcessEnd = function(tabId, processingPagesCount) {
		tabsData[tabId].text = "OK";
		delete tabsData[tabId].processing;
		badgeConfig.text = "" + (processingPagesCount || "");
		if (!processingPagesCount) {
			currentBarProgress = -1;
			currentProgress = -1;
			delete tabsData[tabId].title;
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
					badgeConfig.iconPath = "../resources/icon_19_wait" + barProgress + ".png";
				}
				refreshBadge();
			}
		}
	};

	singlefile.ui.notifyTabRemoved = function(tabId) {
		delete tabsData[tabId];
	};

	singlefile.ui.notifyProcessable = function(tabId, processable, reset) {
		if (!processable) {
			tabsData[tabId] = {
				iconPath : DEFAULT_PASSIVE_ICON_PATH,
				title : "SingleFile cannot process this page"
			};
		} else if (reset && tabsData[tabId] && !tabsData[tabId].processing)
			delete tabsData[tabId];
		refreshBadge(tabId);
	};

})();