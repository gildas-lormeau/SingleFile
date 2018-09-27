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

/* global browser, singlefile */

singlefile.storage = (() => {

	let persistentData;
	let temporaryData;
	browser.tabs.onRemoved.addListener(async tabId => {
		const tabsData = await singlefile.storage.get();
		delete tabsData[tabId];
		await singlefile.storage.set(tabsData);
	});
	getPersistent().then(tabsData => persistentData = tabsData);
	return {
		getTemporary,
		get: getPersistent,
		set: setPersistent
	};

	function getTemporary() {
		if (temporaryData) {
			return temporaryData;
		} else {
			temporaryData = {};
			return {};
		}
	}

	async function getPersistent() {
		if (persistentData) {
			return persistentData;
		} else {
			const config = await browser.storage.local.get();
			persistentData = config.tabsData || {};
			await cleanup();
			return persistentData;
		}
	}

	async function setPersistent(tabsData) {
		await browser.storage.local.set({ tabsData });
	}

	async function cleanup() {
		if (persistentData) {
			const tabs = await browser.tabs.query({});
			Object.keys(persistentData).filter(tabId => !tabs.find(tab => tab.id == tabId)).forEach(tabId => delete persistentData[tabId]);
			await browser.storage.local.set({ tabsData: persistentData });
		}
	}

})();