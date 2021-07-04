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

import * as config from "./config.js";
import * as autosave from "./autosave.js";
import * as business from "./business.js";
import * as editor from "./editor.js";
import * as tabsData from "./tabs-data.js";
import * as ui from "./../../ui/bg/index.js";

const DELAY_MAYBE_INIT = 1500;
const pendingPrompts = new Map();

browser.tabs.onCreated.addListener(tab => onTabCreated(tab));
browser.tabs.onActivated.addListener(activeInfo => onTabActivated(activeInfo));
browser.tabs.onRemoved.addListener(tabId => onTabRemoved(tabId));
browser.tabs.onUpdated.addListener((tabId, changeInfo) => onTabUpdated(tabId, changeInfo));
export {
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
		ui.onInit(sender.tab);
		business.onInit(sender.tab);
		autosave.onInit(sender.tab);
	}
	if (message.method.endsWith(".promptValueResponse")) {
		const promptPromise = pendingPrompts.get(sender.tab.id);
		if (promptPromise) {
			promptPromise.resolve(message.value);
			pendingPrompts.delete(sender.tab.id);
		}
	}
	if (message.method.endsWith(".getOptions")) {
		return config.getOptions(message.url);
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
	if (options.id) {
		return browser.tabs.get(options.id);
	} else {
		const tabs = await browser.tabs.query(options);
		return tabs.sort((tab1, tab2) => tab1.index - tab2.index);
	}
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
	await tabsData.remove(tab.id);
	const allTabsData = await tabsData.get(tab.id);
	allTabsData[tab.id].savedPageDetected = options.savedPageDetected;
	await tabsData.set(allTabsData);
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
		if (editor.isEditor(tab)) {
			const allTabsData = await tabsData.get(tab.id);
			allTabsData[tab.id].editorDetected = true;
			await tabsData.set(allTabsData);
			ui.onTabActivated(tab);
		}
	}
	if (changeInfo.discarded) {
		autosave.onTabRemoved(tabId);
	}
}

function onTabCreated(tab) {
	ui.onTabCreated(tab);
}

async function onTabActivated(activeInfo) {
	const tab = await browser.tabs.get(activeInfo.tabId);
	ui.onTabActivated(tab);
}

function onTabRemoved(tabId) {
	tabsData.remove(tabId);
	editor.onTabRemoved(tabId);
	business.onTabRemoved(tabId);
	autosave.onTabRemoved(tabId);
}