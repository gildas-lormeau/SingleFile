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

singlefile.tabs = (() => {

	browser.tabs.onCreated.addListener(tab => onTabCreated(tab));
	browser.tabs.onActivated.addListener(activeInfo => onTabActivated(activeInfo));
	browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => onTabUpdated(tabId, changeInfo, tab));
	browser.tabs.onRemoved.addListener(tabId => onTabRemoved(tabId));
	return {
		onMessage,
		get: options => browser.tabs.query(options),
		sendMessage: (tabId, message) => browser.tabs.sendMessage(tabId, message)
	};

	async function onMessage(message) {
		return singlefile.config.getOptions(message.url);
	}

	function onTabCreated(tab) {
		singlefile.ui.onTabCreated(tab);
	}

	async function onTabActivated(activeInfo) {
		const tab = await browser.tabs.get(activeInfo.tabId);
		singlefile.ui.onTabActivated(tab, activeInfo);
	}

	function onTabUpdated(tabId, changeInfo, tab) {
		singlefile.autosave.onTabUpdated(tabId, changeInfo, tab);
		singlefile.ui.onTabUpdated(tabId, changeInfo, tab);
	}

	function onTabRemoved(tabId) {
		singlefile.tabsData.onTabRemoved(tabId);
	}

})();