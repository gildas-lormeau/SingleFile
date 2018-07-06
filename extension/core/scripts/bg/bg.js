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

	const CHROME_STORE_URL = "https://chrome.google.com";
	const MENU_ID_SAVE_PAGE = "save-page";
	const MENU_ID_SAVE_SELECTED = "save-selected";

	chrome.tabs.onActivated.addListener(activeInfo => chrome.tabs.get(activeInfo.tabId, tab => {
		if (!chrome.runtime.lastError) {
			singlefile.ui.active(tab.id, isAllowedURL(tab.url));
		}
	}));
	chrome.tabs.onCreated.addListener(tab => singlefile.ui.active(tab.id, isAllowedURL(tab.url)));
	chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => singlefile.ui.active(tab.id, isAllowedURL(tab.url)));
	chrome.tabs.onRemoved.addListener(tabId => singlefile.ui.removed(tabId));

	chrome.runtime.onMessage.addListener((request, sender) => {
		if (request.processStart || request.processProgress) {
			singlefile.ui.progress(sender.tab.id, request.index, request.maxIndex);
		}
		if (request.processEnd) {
			singlefile.ui.end(sender.tab.id);
		}
		if (request.processError) {
			singlefile.ui.error(sender.tab.id);
		}
		return false;
	});

	chrome.browserAction.onClicked.addListener(tab => {
		if (isAllowedURL(tab.url)) {
			chrome.tabs.query({ currentWindow: true, highlighted: true }, tabs => tabs.forEach(processTab));
		}
	});

	chrome.runtime.onInstalled.addListener(function () {
		chrome.contextMenus.create({
			id: MENU_ID_SAVE_PAGE,
			contexts: ["page"],
			title: "Save page with SingleFile"
		});
		chrome.contextMenus.create({
			id: MENU_ID_SAVE_SELECTED,
			contexts: ["selection"],
			title: "Save selection with SingleFile"
		});
	});

	chrome.contextMenus.onClicked.addListener((event, tab) => {
		if (event.menuItemId == MENU_ID_SAVE_PAGE) {
			processTab(tab);
		}
		if (event.menuItemId == MENU_ID_SAVE_SELECTED) {
			processTab(tab, { selected: true });
		}
	});

	function processTab(tab, processOptions = {}) {
		const options = singlefile.config.get();
		Object.keys(processOptions).forEach(key => options[key] = processOptions[key]);
		singlefile.ui.init(tab.id);
		chrome.tabs.sendMessage(tab.id, { processStart: true, options });
	}

	function isAllowedURL(url) {
		return (url.startsWith("http://") || url.startsWith("https://")) && !url.startsWith(CHROME_STORE_URL);
	}

})();
