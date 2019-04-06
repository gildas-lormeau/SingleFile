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

/* global singlefile, SingleFileBrowser, URL, Blob */

singlefile.autosave = (() => {

	return {
		onMessage,
		onMessageExternal,
		onTabUpdated,
		isEnabled,
		refreshTabs
	};

	async function onMessage(message, sender) {
		if (message.method.endsWith(".init")) {
			const [options, autoSaveEnabled] = await Promise.all([singlefile.config.getOptions(sender.tab.url, true), isEnabled(sender.tab)]);
			return { options, autoSaveEnabled };
		}
		if (message.method.endsWith(".save")) {
			return saveContent(message, sender.tab);
		}
	}

	async function onMessageExternal(message, currentTab) {
		if (message.method == "enableAutoSave") {
			const tabsData = await singlefile.tabsData.get(currentTab.id);
			tabsData[currentTab.id].autoSave = message.enabled;
			await singlefile.tabsData.set(tabsData);
			singlefile.ui.refresh(currentTab);
		}
		if (message.method == "isAutoSaveEnabled") {
			return await isEnabled(currentTab);
		}
	}

	async function onTabUpdated(tabId, changeInfo, tab) {
		const [options, autoSaveEnabled] = await Promise.all([singlefile.config.getOptions(tab.url, true), isEnabled(tab)]);
		if (options && ((options.autoSaveLoad || options.autoSaveLoadOrUnload) && autoSaveEnabled)) {
			if (changeInfo.status == "complete") {
				singlefile.core.saveTab(tab, { autoSave: true });
			}
		}
	}

	async function isEnabled(tab) {
		if (tab) {
			const [tabsData, rule] = await Promise.all([singlefile.tabsData.get(), singlefile.config.getRule(tab.url)]);
			return singlefile.util.isAllowedURL(tab.url) &&
				Boolean(tabsData.autoSaveAll ||
					(tabsData.autoSaveUnpinned && !tab.pinned) ||
					(tabsData[tab.id] && tabsData[tab.id].autoSave)) &&
				(!rule || rule.autoSaveProfile != singlefile.config.DISABLED_PROFILE_NAME);
		}
	}

	async function refreshTabs() {
		const tabs = (await singlefile.tabs.get({})).filter(tab => singlefile.util.isAllowedURL(tab.url));
		return Promise.all(tabs.map(async tab => {
			const [options, autoSaveEnabled] = await Promise.all([singlefile.config.getOptions(tab.url, true), isEnabled(tab)]);
			singlefile.tabs.sendMessage(tab.id, { method: "content.init", autoSaveEnabled, options }).catch(() => { /* ignored */ });
		}));
	}

	async function saveContent(message, tab) {
		const options = await singlefile.config.getOptions(tab.url, true);
		const tabId = tab.id;
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
		options.referrer = message.referrer;
		options.insertSingleFileComment = true;
		options.insertFaviconLink = true;
		options.backgroundTab = true;
		options.autoSave = true;
		options.incognito = tab.incognito;
		options.tabId = tabId;
		options.tabIndex = tab.index;
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
		await processor.run();
		const page = await processor.getPageData();
		page.url = URL.createObjectURL(new Blob([page.content], { type: "text/html" }));
		return singlefile.download.downloadPage(page, options);
	}

})();