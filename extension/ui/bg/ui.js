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

singlefile.ui = (() => {

	const FORBIDDEN_URLS = ["https://chrome.google.com", "https://addons.mozilla.org"];

	let persistentTabsData;
	let temporaryTabsData;

	getPersistentTabsData().then(tabsData => persistentTabsData = tabsData);

	browser.tabs.onRemoved.addListener(async tabId => {
		const tabsData = await getPersistentTabsData();
		delete tabsData[tabId];
		await browser.storage.local.set({ tabsData });
	});
	return {
		processTab,
		isAllowedURL,
		getTemporaryTabsData,
		getPersistentTabsData,
		setPersistentData
	};

	async function processTab(tab, options = {}) {
		const tabId = tab.id;
		try {
			singlefile.ui.button.onInitialize(tabId, options, 1);
			await singlefile.core.processTab(tab, options);
			singlefile.ui.button.onInitialize(tabId, options, 2);
		} catch (error) {
			console.log(error); // eslint-disable-line no-console
			singlefile.ui.button.onError(tabId, options);
		}
	}

	function isAllowedURL(url) {
		return url && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("file://")) && !FORBIDDEN_URLS.find(storeUrl => url.startsWith(storeUrl));
	}

	function getTemporaryTabsData() {
		if (temporaryTabsData) {
			return temporaryTabsData;
		} else {
			return {};
		}
	}

	async function setPersistentData(tabsData) {
		await browser.storage.local.set({ tabsData });
	}

	async function getPersistentTabsData() {
		if (persistentTabsData) {
			return persistentTabsData;
		} else {
			const config = await browser.storage.local.get();
			persistentTabsData = config.tabsData || {};
			await cleanupPersistentTabsData();
			return persistentTabsData;
		}
	}

	async function cleanupPersistentTabsData() {
		if (persistentTabsData) {
			const tabs = await browser.tabs.query({});
			Object.keys(persistentTabsData).filter(tabId => !tabs.find(tab => tab.id == tabId)).forEach(tabId => delete persistentTabsData[tabId]);
			await browser.storage.local.set({ tabsData: persistentTabsData });
		}
	}

})();