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

/* global browser, singlefile, SingleFileBrowser, URL, Blob */

singlefile.autosave = (() => {

	browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
		const [options, tabsData] = await Promise.all([singlefile.config.getDefaultConfig(), singlefile.tabsData.get()]);
		if ((options.autoSaveLoad || options.autoSaveLoadOrUnload) && (tabsData.autoSaveAll || (tabsData.autoSaveUnpinned && !tab.pinned) || (tabsData[tab.id] && tabsData[tab.id].autoSave))) {
			if (changeInfo.status == "complete") {
				singlefile.ui.saveTab(tab, { autoSave: true });
			}
		}
	});
	browser.runtime.onMessage.addListener((message, sender) => {
		if (message.isAutoSaveEnabled) {
			return isAutoSaveEnabled(sender.tab.id);
		}
		if (message.autoSaveContent) {
			saveContent(message, sender.tab.id, sender.tab.incognito);
		}
	});

	if (browser.runtime.onMessageExternal) {
		browser.runtime.onMessageExternal.addListener(async message => {
			if (message.method == "enableAutoSave") {
				enableActiveTab(message.enabled);
			}
			if (message.method == "isAutoSaveEnabled") {
				const tabs = await browser.tabs.query({ currentWindow: true, active: true });
				const tab = tabs[0];
				if (tab && singlefile.core.isAllowedURL(tab.url)) {
					const tabId = tab.id;
					const tabsData = await singlefile.tabsData.get();
					return tabsData.autoSaveAll || (tabsData.autoSaveUnpinned && !tab.pinned) || (tabsData[tabId] && tabsData[tabId].autoSave);
				}
				return false;
			}
		});
	}

	return {
		enabled,
		refresh
	};

	async function saveContent(message, tabId, incognito) {
		const options = await singlefile.config.getDefaultConfig();
		options.content = message.content;
		options.url = message.url;
		options.framesData = message.framesData;
		options.canvasData = message.canvasData;
		options.fontsData = message.fontsData;
		options.stylesheetContents = message.stylesheetContents;
		options.imageData = message.imageData;
		options.postersData = message.postersData;
		options.usedFonts = message.usedFonts;
		options.shadowRootContents = message.shadowRootContents;
		options.insertSingleFileComment = true;
		options.insertFaviconLink = true;
		options.backgroundTab = true;
		options.autoSave = true;
		options.incognito = incognito;
		options.tabId = tabId;
		options.sessionId = 0;
		let index = 0, maxIndex = 0;
		options.onprogress = async event => {
			if (event.type == event.RESOURCES_INITIALIZED) {
				maxIndex = event.detail.max;
				singlefile.ui.onProgress(tabId, index, maxIndex, { autoSave: true });
			}
			if (event.type == event.RESOURCE_LOADED) {
				index++;
				singlefile.ui.onProgress(tabId, index, maxIndex, { autoSave: true });
			} else if (event.type == event.PAGE_ENDED) {
				singlefile.ui.onEnd(tabId, { autoSave: true });
			}
		};
		const processor = new (SingleFileBrowser.getClass())(options);
		await processor.initialize();
		await processor.run();
		const page = await processor.getPageData();
		page.url = URL.createObjectURL(new Blob([page.content], { type: "text/html" }));
		return singlefile.download.downloadPage(page, options);
	}

	async function enableActiveTab(enabled) {
		const tabs = await browser.tabs.query({ currentWindow: true, active: true });
		const tab = tabs[0];
		if (tab) {
			const tabId = tab.id;
			const tabsData = await singlefile.tabsData.get();
			if (!tabsData[tabId]) {
				tabsData[tabId] = {};
			}
			tabsData[tabId].autoSave = enabled;
			await singlefile.tabsData.set(tabsData);
			singlefile.ui.refresh(tabId, { autoSave: enabled });
		}
	}

	async function isAutoSaveEnabled(tabId) {
		const [options, autoSaveEnabled] = await Promise.all([singlefile.config.getDefaultConfig(), enabled(tabId)]);
		return { autoSaveEnabled, options };
	}

	async function enabled(tabId) {
		const tabsData = await singlefile.tabsData.get();
		return Boolean(tabsData.autoSaveAll || tabsData.autoSaveUnpinned || (tabsData[tabId] && tabsData[tabId].autoSave));
	}

	async function refresh() {
		const tabs = await browser.tabs.query({});
		return Promise.all(tabs.map(async tab => {
			try {
				const [autoSaveEnabled, options] = await Promise.all([enabled(tab.id), singlefile.config.getDefaultConfig()]);
				await browser.tabs.sendMessage(tab.id, { autoSaveUnloadEnabled: true, autoSaveEnabled, options });
			} catch (error) {
				/* ignored */
			}
		}));
	}

})();