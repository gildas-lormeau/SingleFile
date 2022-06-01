/*
 * Copyright 2010-2020 Gildas Lormeau
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

/* global browser, setTimeout */

let persistentData, temporaryData, cleanedUp;
setTimeout(() => getPersistent().then(tabsData => persistentData = tabsData), 0);
export {
	onMessage,
	getTemporary,
	getPersistent as get,
	setPersistent as set,
	onTabReplaced,
	remove
};

function onMessage(message) {
	if (message.method.endsWith(".get")) {
		return getPersistent();
	}
	if (message.method.endsWith(".set")) {
		return setPersistent(message.tabsData);
	}
}

async function onTabReplaced(addedTabId, removedTabId) {
	let tabsData = await getPersistent();
	await updateTabsData(tabsData, addedTabId, removedTabId);
	setPersistent(tabsData);
	await updateTabsData(temporaryData, addedTabId, removedTabId);
}

async function updateTabsData(tabsData, addedTabId, removedTabId) {
	if (tabsData[removedTabId] && !tabsData[addedTabId]) {
		tabsData[addedTabId] = tabsData[removedTabId];
		delete tabsData[removedTabId];
	}
}

async function remove(tabId) {
	if (temporaryData) {
		delete temporaryData[tabId];
	}
	const tabsData = await getPersistent();
	if (tabsData[tabId]) {
		const autoSave = tabsData[tabId].autoSave;
		tabsData[tabId] = { autoSave };
		await setPersistent(tabsData);
	}
}

function getTemporary(desiredTabId) {
	if (!temporaryData) {
		temporaryData = {};
	}
	if (desiredTabId !== undefined && !temporaryData[desiredTabId]) {
		temporaryData[desiredTabId] = {};
	}
	return temporaryData;
}

async function getPersistent(desiredTabId) {
	if (!persistentData) {
		const config = await browser.storage.local.get();
		persistentData = config.tabsData || {};
	}
	cleanup();
	if (desiredTabId !== undefined && !persistentData[desiredTabId]) {
		persistentData[desiredTabId] = {};
	}
	return persistentData;
}

async function setPersistent(tabsData) {
	persistentData = tabsData;
	await browser.storage.local.set({ tabsData });
}

async function cleanup() {
	if (!cleanedUp) {
		cleanedUp = true;
		const tabs = await browser.tabs.query({ currentWindow: true, highlighted: true });
		Object.keys(persistentData).filter(key => {
			if (key != "autoSaveAll" && key != "autoSaveUnpinned" && key != "profileName") {
				return !tabs.find(tab => tab.id == key);
			}
		}).forEach(tabId => delete persistentData[tabId]);
		await browser.storage.local.set({ tabsData: persistentData });
	}
}