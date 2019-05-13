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

/* global singlefile, URL, Blob */

singlefile.extension.core.bg.autosave = (() => {

	return {
		onMessage,
		onMessageExternal,
		onTabUpdated,
		isEnabled,
		refreshTabs
	};

	async function onMessage(message, sender) {
		if (message.method.endsWith(".init")) {
			const [options, autoSaveEnabled] = await Promise.all([singlefile.extension.core.bg.config.getOptions(sender.tab.url, true), isEnabled(sender.tab)]);
			return { options, autoSaveEnabled };
		}
		if (message.method.endsWith(".save")) {
			await saveContent(message, sender.tab);
			return {};
		}
	}

	async function onMessageExternal(message, currentTab) {
		const tabsData = singlefile.extension.core.bg.tabsData;
		if (message.method == "enableAutoSave") {
			const allTabsData = await tabsData.get(currentTab.id);
			allTabsData[currentTab.id].autoSave = message.enabled;
			await tabsData.set(allTabsData);
			singlefile.extension.ui.bg.main.refreshTab(currentTab);
		}
		if (message.method == "isAutoSaveEnabled") {
			return isEnabled(currentTab);
		}
	}

	async function onTabUpdated(tabId, changeInfo, tab) {
		const [options, autoSaveEnabled] = await Promise.all([singlefile.extension.core.bg.config.getOptions(tab.url, true), isEnabled(tab)]);
		if (options && ((options.autoSaveLoad || options.autoSaveLoadOrUnload) && autoSaveEnabled)) {
			if (changeInfo.status == "complete") {
				singlefile.extension.core.bg.business.saveTab(tab, { autoSave: true });
			}
		}
	}

	async function isEnabled(tab) {
		const config = singlefile.extension.core.bg.config;
		if (tab) {
			const [tabsData, rule] = await Promise.all([singlefile.extension.core.bg.tabsData.get(), config.getRule(tab.url)]);
			return Boolean(tabsData.autoSaveAll ||
				(tabsData.autoSaveUnpinned && !tab.pinned) ||
				(tabsData[tab.id] && tabsData[tab.id].autoSave)) &&
				(!rule || rule.autoSaveProfile != config.DISABLED_PROFILE_NAME);
		}
	}

	async function refreshTabs() {
		const tabs = singlefile.extension.core.bg.tabs;
		const allTabs = (await tabs.get({})).filter(tab => singlefile.extension.core.bg.util.isAllowedURL(tab.url));
		return Promise.all(allTabs.map(async tab => {
			const [options, autoSaveEnabled] = await Promise.all([singlefile.extension.core.bg.config.getOptions(tab.url, true), isEnabled(tab)]);
			tabs.sendMessage(tab.id, { method: "content.init", autoSaveEnabled, options }).catch(() => { /* ignored */ });
		}));
	}

	async function saveContent(message, tab) {
		const options = await singlefile.extension.core.bg.config.getOptions(tab.url, true);
		const tabId = tab.id;
		options.content = message.content;
		options.url = message.url;
		options.frames = message.frames;
		options.canvases = message.canvases;
		options.fonts = message.fonts;
		options.stylesheets = message.stylesheets;
		options.images = message.images;
		options.posters = message.posters;
		options.usedFonts = message.usedFonts;
		options.shadowRoots = message.shadowRoots;
		options.imports = message.imports;
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
				singlefile.extension.ui.bg.main.onProgress(tabId, index, maxIndex, { autoSave: true });
			}
			if (event.type == event.RESOURCE_LOADED) {
				index++;
				singlefile.extension.ui.bg.main.onProgress(tabId, index, maxIndex, { autoSave: true });
			} else if (event.type == event.PAGE_ENDED) {
				singlefile.extension.ui.bg.main.onEnd(tabId, { autoSave: true });
			}
		};
		const processor = new (singlefile.lib.SingleFile.getClass())(options);
		await processor.run();
		const page = await processor.getPageData();
		page.url = URL.createObjectURL(new Blob([page.content], { type: "text/html" }));
		try {
			await singlefile.extension.core.bg.downloads.downloadPage(page, options);
		} finally {
			URL.revokeObjectURL(page.url);
		}
	}

})();