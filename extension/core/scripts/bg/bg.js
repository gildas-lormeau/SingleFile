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

(() => {

	chrome.tabs.onActivated.addListener(activeInfo => chrome.tabs.get(activeInfo.tabId, tab => notifyActive(tab.id, tab.url)));
	chrome.tabs.onCreated.addListener(tab => notifyActive(tab.id, tab.url));
	chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
		if (changeInfo.status == "loading" && tab.url) {
			notifyActive(tab.id, tab.url, true);
		}
	});
	chrome.tabs.onRemoved.addListener(tabId => singlefile.ui.notifyTabRemoved(tabId));

	chrome.runtime.onMessage.addListener((request, sender) => {
		if (request.processStart) {
			singlefile.ui.notifyProcessStart(sender.tab.id);
			singlefile.ui.notifyProcessProgress(sender.tab.id, request.index, request.maxIndex);
		}
		if (request.processProgress) {
			singlefile.ui.notifyProcessProgress(sender.tab.id, request.index, request.maxIndex);
		}
		if (request.processEnd) {
			singlefile.ui.notifyProcessEnd(sender.tab.id);
		}
		if (request.processError) {
			singlefile.ui.notifyProcessError(sender.tab.id);
		}
		return false;
	});

	chrome.browserAction.onClicked.addListener(tab => {
		if (isActive(tab.url)) {
			chrome.tabs.sendMessage(tab.id, { processStart: true, options: singlefile.config.get() });
			singlefile.ui.notifyProcessInit(tab.id);
		}
	});

	function isActive(url) {
		return url.indexOf("https://chrome.google.com") != 0 && (url.indexOf("http://") == 0 || url.indexOf("https://") == 0);
	}

	function notifyActive(tabId, url, reset) {
		singlefile.ui.notifyActive(tabId, isActive(url), reset);
	}

})();
