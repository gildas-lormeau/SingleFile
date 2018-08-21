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

singlefile.ui.autosave = (() => {

	browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
		const [config, tabsData] = await Promise.all([singlefile.config.get(), singlefile.ui.getPersistentTabsData()]);
		if ((config.autoSaveLoad || config.autoSaveLoadOrUnload) && (tabsData.autoSaveAll || (tabsData.autoSaveUnpinned && !tab.pinned) || (tabsData[tab.id] && tabsData[tab.id].autoSave))) {
			if (changeInfo.status == "complete") {
				singlefile.ui.processTab(tab, { autoSave: true });
			}
		}
	});
	browser.runtime.onMessage.addListener((request, sender) => {
		if (request.isAutoSaveEnabled) {
			return isEnabled(sender.tab.id);
		}
	});
	return {
		isEnabled,
		refresh
	};

	async function refresh() {
		const tabs = await browser.tabs.query({});
		return Promise.all(tabs.map(async tab => {
			try {
				await browser.tabs.sendMessage(tab.id, { autoSaveUnloadEnabled: true });
			} catch (error) {
				/* ignored */
			}
		}));
	}

	async function isEnabled(tabId) {
		const tabsData = await singlefile.ui.getPersistentTabsData();
		return tabsData.autoSaveAll || tabsData.autoSaveUnpinned || (tabsData[tabId] && tabsData[tabId].autoSave);
	}

})();