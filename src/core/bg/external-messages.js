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

import * as autosave from "./autosave.js";
import * as business from "./business.js";
import "./../../lib/single-file/background.js";

const ACTION_SAVE_PAGE = "save-page";
const ACTION_EDIT_AND_SAVE_PAGE = "edit-and-save-page";
const ACTION_SAVE_SELECTED_LINKS = "save-selected-links";
const ACTION_SAVE_SELECTED = "save-selected-content";
const ACTION_SAVE_SELECTED_TABS = "save-selected-tabs";
const ACTION_SAVE_UNPINNED_TABS = "save-unpinned-tabs";
const ACTION_SAVE_ALL_TABS = "save-all-tabs";

export { onMessage };

async function onMessage(message, sender) {
	if (message == ACTION_SAVE_PAGE) {
		const tabs = await browser.tabs.query({ currentWindow: true, active: true });
		tabs.length = 1;
		await business.saveTabs(tabs);
	} else if (message == ACTION_EDIT_AND_SAVE_PAGE) {
		const tabs = await browser.tabs.query({ currentWindow: true, active: true });
		tabs.length = 1;
		await business.saveTabs(tabs, { openEditor: true });
	} else if (message == ACTION_SAVE_SELECTED_LINKS) {
		const tabs = await browser.tabs.query({ currentWindow: true, active: true });
		await business.saveSelectedLinks(tabs[0]);
	} else if (message == ACTION_SAVE_SELECTED) {
		const tabs = await browser.tabs.query({ currentWindow: true, active: true });
		await business.saveTabs(tabs, { selected: true });
	} else if (message == ACTION_SAVE_SELECTED_TABS) {
		const tabs = await queryTabs({ currentWindow: true, highlighted: true });
		await business.saveTabs(tabs);
	} else if (message == ACTION_SAVE_UNPINNED_TABS) {
		const tabs = await queryTabs({ currentWindow: true, pinned: false });
		await business.saveTabs(tabs);
	} else if (message == ACTION_SAVE_ALL_TABS) {
		const tabs = await queryTabs({ currentWindow: true });
		await business.saveTabs(tabs);
	} else if (message.method) {
		const tabs = await browser.tabs.query({ currentWindow: true, active: true });
		const currentTab = tabs[0];
		if (currentTab) {
			return autosave.onMessageExternal(message, currentTab, sender);
		} else {
			return false;
		}
	}
}

async function queryTabs(options) {
	const tabs = await browser.tabs.query(options);
	return tabs.sort((tab1, tab2) => tab1.index - tab2.index);
}
