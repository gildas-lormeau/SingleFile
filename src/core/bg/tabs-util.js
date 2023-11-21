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

/* global browser, URLSearchParams, URL */

export {
	queryTabs,
	extractAuthCode,
	launchWebAuthFlow
};

async function queryTabs(options) {
	const tabs = await browser.tabs.query(options);
	return tabs.sort((tab1, tab2) => tab1.index - tab2.index);
}

function extractAuthCode(authURL) {
	return new Promise((resolve, reject) => {
		browser.tabs.onUpdated.addListener(onTabUpdated);

		function onTabUpdated(tabId, changeInfo) {
			if (changeInfo && changeInfo.url && changeInfo.url.startsWith(authURL)) {
				browser.tabs.onUpdated.removeListener(onTabUpdated);
				const code = new URLSearchParams(new URL(changeInfo.url).search).get("code");
				if (code) {
					browser.tabs.remove(tabId);
					resolve(code);
				} else {
					reject();
				}
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