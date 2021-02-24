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
/* global extension, browser, setTimeout */

extension.core.bg.tabs = (() => {

	const DELAY_MAYBE_INIT = 1500;
	const pendingPrompts = new Map();

	browser.tabs.onCreated.addListener(tab => onTabCreated(tab));
	browser.tabs.onActivated.addListener(activeInfo => onTabActivated(activeInfo));
	browser.tabs.onRemoved.addListener(tabId => onTabRemoved(tabId));
	browser.tabs.onUpdated.addListener((tabId, changeInfo) => onTabUpdated(tabId, changeInfo));
	return {
		onMessage,
		get,
		create,
		createAndWait,
		sendMessage,
		update,
		remove,
		promptValue,
		extractAuthCode,
		launchWebAuthFlow
	};

	async function onMessage(message, sender) {
		if (message.method.endsWith(".init")) {
			await onInit(sender.tab, message);
			extension.ui.bg.main.onInit(sender.tab);
			extension.core.bg.business.onInit(sender.tab);
			extension.core.bg.autosave.onInit(sender.tab);
		}
		if (message.method.endsWith(".promptValueResponse")) {
			const promptPromise = pendingPrompts.get(sender.tab.id);
			if (promptPromise) {
				promptPromise.resolve(message.value);
				pendingPrompts.delete(sender.tab.id);
			}
		}
		if (message.method.endsWith(".getOptions")) {
			return extension.core.bg.config.getOptions(message.url);
		}
		if (message.method.endsWith(".activate")) {
			await browser.tabs.update(message.tabId, { active: true });
		}
	}

	function sendMessage(tabId, message, options) {
		return browser.tabs.sendMessage(tabId, message, options);
	}

	function update(tabId, updateProperties) {
		return browser.tabs.update(tabId, updateProperties);
	}

	function remove(tabId) {
		return browser.tabs.remove(tabId);
	}

	function create(createProperties) {
		return browser.tabs.create(createProperties);
	}

	async function createAndWait(createProperties) {
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
					reject(tabId);
					browser.tabs.onRemoved.removeListener(onTabRemoved);
				}
			}
		});
	}

	async function get(options) {
		const tabs = await browser.tabs.query(options);
		return tabs.sort((tab1, tab2) => tab1.index - tab2.index);
	}

	async function promptValue(promptMessage) {
		const tabs = await browser.tabs.query({ currentWindow: true, active: true });
		return new Promise((resolve, reject) => {
			const selectedTabId = tabs[0].id;
			browser.tabs.onRemoved.addListener(onTabRemoved);
			pendingPrompts.set(selectedTabId, { resolve, reject });
			browser.tabs.sendMessage(selectedTabId, { method: "common.promptValueRequest", promptMessage });

			function onTabRemoved(tabId) {
				if (tabId == selectedTabId) {
					pendingPrompts.delete(tabId);
					browser.tabs.onUpdated.removeListener(onTabRemoved);
					reject();
				}
			}
		});
	}

	function extractAuthCode(authURL) {
		return new Promise((resolve, reject) => {
			let authTabId;
			browser.tabs.onUpdated.addListener(onTabUpdated);
			browser.tabs.onRemoved.addListener(onTabRemoved);

			function onTabUpdated(tabId, changeInfo) {
				if (changeInfo && changeInfo.url == authURL) {
					authTabId = tabId;
				}
				if (authTabId == tabId && changeInfo && changeInfo.title && changeInfo.title.startsWith("Success code=")) {
					browser.tabs.onUpdated.removeListener(onTabUpdated);
					browser.tabs.onUpdated.removeListener(onTabRemoved);
					resolve(changeInfo.title.substring(13, changeInfo.title.length - 49));
				}
			}

			function onTabRemoved(tabId) {
				if (tabId == authTabId) {
					browser.tabs.onUpdated.removeListener(onTabUpdated);
					browser.tabs.onUpdated.removeListener(onTabRemoved);
					reject();
				}
			}
		});
	}

	async function launchWebAuthFlow(options) {
		const tab = await browser.tabs.create({ url: options.url, active: true });
		return new Promise((resolve, reject) => {
			browser.tabs.onRemoved.addListener(onTabRemoved);
			function onTabRemoved(tabId) {
				if (tabId == tab.id) {
					browser.tabs.onRemoved.removeListener(onTabRemoved);
					reject(new Error("code_required"));
				}
			}
		});
	}

	async function onInit(tab, options) {
		await extension.core.bg.tabsData.remove(tab.id);
		const tabsData = await extension.core.bg.tabsData.get(tab.id);
		tabsData[tab.id].savedPageDetected = options.savedPageDetected;
		await extension.core.bg.tabsData.set(tabsData);
	}

	async function onTabUpdated(tabId, changeInfo) {
		if (changeInfo.status == "complete") {
			setTimeout(async () => {
				try {
					await browser.tabs.sendMessage(tabId, { method: "content.maybeInit" });
				}
				catch (error) {
					// ignored
				}
			}, DELAY_MAYBE_INIT);
			const tab = await browser.tabs.get(tabId);
			if (extension.core.bg.editor.isEditor(tab)) {
				const tabsData = await extension.core.bg.tabsData.get(tab.id);
				tabsData[tab.id].editorDetected = true;
				await extension.core.bg.tabsData.set(tabsData);
				extension.ui.bg.main.onTabActivated(tab);
			}
		}
	}

	function onTabCreated(tab) {
		extension.ui.bg.main.onTabCreated(tab);
	}

	async function onTabActivated(activeInfo) {
		const tab = await browser.tabs.get(activeInfo.tabId);
		extension.ui.bg.main.onTabActivated(tab);
	}

	function onTabRemoved(tabId) {
		extension.core.bg.tabsData.remove(tabId);
		extension.core.bg.editor.onTabRemoved(tabId);
		extension.core.bg.business.onTabRemoved(tabId);
	}

})();