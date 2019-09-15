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

singlefile.extension.core.bg.tabs = (() => {

	browser.tabs.onCreated.addListener(tab => onTabCreated(tab));
	browser.tabs.onActivated.addListener(activeInfo => onTabActivated(activeInfo));
	browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => onTabUpdated(tabId, changeInfo, tab));
	browser.tabs.onRemoved.addListener(tabId => onTabRemoved(tabId));
	return {
		onMessage,
		get: options => browser.tabs.query(options),
		create: async createProperties => {
			const tab = await browser.tabs.create(createProperties);
			return new Promise((resolve, reject) => {
				browser.tabs.onUpdated.addListener(onTabUpdated);
				browser.tabs.onRemoved.addListener(onTabRemoved);
				function onTabUpdated(tabId, changeInfo) {
					if (tabId == tab.id && changeInfo.status == "complete") {
						resolve(tab);
						browser.tabs.onUpdated.removeListener(onTabUpdated);
						browser.tabs.onRemoved.removeListener(onTabRemoved);
					}
				}
				function onTabRemoved(tabId) {
					if (tabId == tab.id) {
						reject();
						browser.tabs.onRemoved.removeListener(onTabRemoved);
					}
				}
			});
		},
		sendMessage: (tabId, message, options) => browser.tabs.sendMessage(tabId, message, options),
		remove: tabId => browser.tabs.remove(tabId)
	};

	async function onMessage(message) {
		if (message.method.endsWith(".getOptions")) {
			return singlefile.extension.core.bg.config.getOptions(message.url);
		}
	}

	function onTabCreated(tab) {
		singlefile.extension.ui.bg.main.onTabCreated(tab);
	}

	async function onTabActivated(activeInfo) {
		const tab = await browser.tabs.get(activeInfo.tabId);
		singlefile.extension.ui.bg.main.onTabActivated(tab, activeInfo);
	}

	function onTabUpdated(tabId, changeInfo, tab) {
		if (changeInfo.status == "loading") {
			singlefile.extension.ui.bg.main.onTabUpdated(tabId, changeInfo, tab);
		}
		if (changeInfo.status == "complete") {
			singlefile.extension.core.bg.autosave.onTabUpdated(tabId, changeInfo, tab);
		}
	}

	function onTabRemoved(tabId) {
		singlefile.extension.core.bg.tabsData.onTabRemoved(tabId);
	}

})();