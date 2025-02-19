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
import * as tabsData from "./tabs-data.js";

export {
	autoSaveIsEnabled,
	refreshAutoSaveTabs
};

async function autoSaveIsEnabled(tab) {
	if (tab) {
		const [allTabsData, rule] = await Promise.all([tabsData.get(), config.getRule(tab.url)]);
		return Boolean(allTabsData.autoSaveAll ||
			(allTabsData.autoSaveUnpinned && !tab.pinned) ||
			(allTabsData[tab.id] && allTabsData[tab.id].autoSave)) &&
			(!rule || rule.autoSaveProfile != config.DISABLED_PROFILE_NAME);
	}
}

async function refreshAutoSaveTabs() {
	const tabs = (await browser.tabs.query({}));
	return Promise.all(tabs.map(async tab => {
		const [options, autoSaveEnabled] = await Promise.all([config.getOptions(tab.url, true), autoSaveIsEnabled(tab)]);
		try {
			await browser.tabs.sendMessage(tab.id, { method: "content.init", autoSaveEnabled, options });
			// eslint-disable-next-line no-unused-vars
		} catch (error) {
			// ignored
		}
	}));
}