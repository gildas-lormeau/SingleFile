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

singlefile.tabsData = (() => {

	let persistentData, temporaryData;
	getPersistent().then(tabsData => persistentData = tabsData);
	return {
		onMessage,
		onTabRemoved,
		getTemporary,
		get: getPersistent,
		set: setPersistent
	};

	async function onMessage(message) {
		if (message.getTabsData) {
			return getPersistent();
		}
		if (message.setTabsData) {
			return setPersistent(message.tabsData);
		}
	}

	async function onTabRemoved(tabId) {
		const tabsData = await getPersistent();
		delete tabsData[tabId];
		setPersistent(tabsData);
	}

	function getTemporary(tabId) {
		if (!temporaryData) {
			temporaryData = {};
		}
		if (tabId !== undefined && !temporaryData[tabId]) {
			temporaryData[tabId] = {};
		}
		return temporaryData;
	}

	async function getPersistent(tabId) {
		if (!persistentData) {
			const config = await browser.storage.local.get();
			persistentData = config.tabsData || {};
			cleanup();
		}
		if (tabId !== undefined && !persistentData[tabId]) {
			persistentData[tabId] = {};
		}
		return persistentData;
	}

	async function setPersistent(tabsData) {
		persistentData = tabsData;
		await browser.storage.local.set({ tabsData });
	}

	async function cleanup() {
		if (persistentData) {
			const tabs = await browser.tabs.query({});
			Object.keys(persistentData).filter(key => {
				if (key != "autoSaveAll" && key != "autoSaveUnpinned" && key != "profileName") {
					return !tabs.find(tab => tab.id == key);
				}
			}).forEach(tabId => delete persistentData[tabId]);
			await browser.storage.local.set({ tabsData: persistentData });
		}
	}

})();