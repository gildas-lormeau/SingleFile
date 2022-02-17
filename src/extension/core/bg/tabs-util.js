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

/* global browser */

const pendingPrompts = new Map();

export {
	onPromptValueResponse,
	queryTabs,
	promptValue,
	extractAuthCode,
	launchWebAuthFlow
};

async function onPromptValueResponse(message, sender) {
	const promptPromise = pendingPrompts.get(sender.tab.id);
	if (promptPromise) {
		promptPromise.resolve(message.value);
		pendingPrompts.delete(sender.tab.id);
	}
}

async function queryTabs(options) {
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