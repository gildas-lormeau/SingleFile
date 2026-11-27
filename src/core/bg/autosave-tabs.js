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

import * as config from "./config.js";
import { refreshAutoSaveTabs } from "./autosave-util.js";
import * as button from "./../../ui/bg/ui-button.js";

const TAB_GROUPS_PERMISSION = "tabGroups";

let groupListenerAdded;

addGroupListener();

export {
	onMessage,
	onTabGroupChanged
};

async function onMessage(message) {
	if (message.method.endsWith(".get")) {
		addGroupListener();
		return getInfo();
	}
	if (message.method.endsWith(".set")) {
		await config.setAutoSaveTabs(message.autoSaveTabs);
		await refreshTabs();
		return {};
	}
}

async function onTabGroupChanged() {
	const { groups } = await config.getAutoSaveTabs();
	if (groups.length) {
		await refreshTabs();
	}
}

async function getInfo() {
	const [autoSaveTabs, tabs] = await Promise.all([config.getAutoSaveTabs(), browser.tabs.query({})]);
	const groups = { supported: tabs.some(tab => tab.groupId !== undefined), granted: false, names: [], selected: autoSaveTabs.groups };
	const containers = { supported: false, items: [], selected: autoSaveTabs.containers };
	if (groups.supported) {
		try {
			groups.granted = await browser.permissions.contains({ permissions: [TAB_GROUPS_PERMISSION] });
			// eslint-disable-next-line no-unused-vars
		} catch (error) {
			groups.supported = false;
		}
	}
	if (groups.granted) {
		try {
			const tabGroups = await browser.tabGroups.query({});
			groups.names = [...new Set(tabGroups.map(group => group.title).filter(title => title))];
			// eslint-disable-next-line no-unused-vars
		} catch (error) {
			// ignored
		}
	}
	if (browser.contextualIdentities) {
		try {
			const identities = await browser.contextualIdentities.query({});
			containers.items = identities.map(identity => ({ id: identity.cookieStoreId, name: identity.name }));
			containers.supported = true;
			// eslint-disable-next-line no-unused-vars
		} catch (error) {
			// ignored
		}
	}
	return { groups, containers };
}

function addGroupListener() {
	if (!groupListenerAdded) {
		try {
			browser.tabGroups.onUpdated.addListener(() => onTabGroupChanged());
			groupListenerAdded = true;
			// eslint-disable-next-line no-unused-vars
		} catch (error) {
			// ignored
		}
	}
}

async function refreshTabs() {
	await refreshAutoSaveTabs();
	const tabs = await browser.tabs.query({});
	await Promise.all(tabs.map(tab => button.refreshTab(tab)));
}
