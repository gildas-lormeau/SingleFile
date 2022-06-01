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

browser.tabs.onCreated.addListener(tab => onTabCreated(tab));
browser.tabs.onActivated.addListener(activeInfo => onTabActivated(activeInfo));
browser.tabs.onRemoved.addListener(tabId => onTabRemoved(tabId));
browser.tabs.onUpdated.addListener((tabId, changeInfo) => onTabUpdated(tabId, changeInfo));
browser.tabs.onReplaced.addListener((addedTabId, removedTabId) => onTabReplaced(addedTabId, removedTabId));
export {
	onMessage
};

async function onMessage(message, sender) {
	if (message.method.endsWith(".init")) {
		await onInit(sender.tab, message);
		ui.onInit(sender.tab);
		business.onInit(sender.tab);
		autosave.onInit(sender.tab);
	}
	if (message.method.endsWith(".getOptions")) {
		return config.getOptions(message.url);
	}
	if (message.method.endsWith(".activate")) {
		await browser.tabs.update(message.tabId, { active: true });
	}
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
		autosave.onTabUpdated(tabId);
		const tab = await browser.tabs.get(tabId);
		if (editor.isEditor(tab)) {
			const allTabsData = await tabsData.get(tab.id);
			allTabsData[tab.id].editorDetected = true;
			await tabsData.set(allTabsData);
			ui.onTabActivated(tab);
		}
	}
	if (changeInfo.discarded) {
		autosave.onTabDiscarded(tabId);
	}
}

function onTabReplaced(addedTabId, removedTabId) {
	tabsData.onTabReplaced(addedTabId, removedTabId);
	autosave.onTabReplaced(addedTabId, removedTabId);
	business.onTabReplaced(addedTabId, removedTabId);
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