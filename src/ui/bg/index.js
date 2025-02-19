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

import * as button from "./ui-button.js";
import * as menus from "./ui-menus.js";
import * as command from "./ui-commands.js";

export {
	onMessage,
	refreshTab,
	onForbiddenDomain,
	onStart,
	onError,
	onEdit,
	onEnd,
	onCancelled,
	onUploadProgress,
	onTabCreated,
	onTabActivated,
	onInit,
	init
};

function init(businessApi) {
	menus.init(businessApi);
	button.init(businessApi);
	command.init(businessApi);
}

function onMessage(message, sender) {
	if (message.method.endsWith(".refreshMenu")) {
		return menus.onMessage(message, sender);
	} else {
		return button.onMessage(message, sender);
	}
}

async function refreshTab(tab) {
	return Promise.all([menus.refreshTab(tab), button.refreshTab(tab)]);
}

function onForbiddenDomain(tab) {
	button.onForbiddenDomain(tab);
}

function onStart(tabId, step, autoSave) {
	button.onStart(tabId, step, autoSave);
}

async function onError(tabId, message, link) {
	button.onError(tabId);
	try {
		if (message) {
			await browser.tabs.sendMessage(tabId, { method: "content.error", error: message.toString(), link });
		}
		// eslint-disable-next-line no-unused-vars
	} catch (error) {
		// ignored
	}
}

function onEdit(tabId) {
	button.onEdit(tabId);
}

function onEnd(tabId, autoSave) {
	button.onEnd(tabId, autoSave);
}

function onCancelled(tabId) {
	button.onCancelled(tabId);
}

function onUploadProgress(tabId, index, maxIndex) {
	button.onUploadProgress(tabId, index, maxIndex);
}

function onTabCreated(tab) {
	menus.onTabCreated(tab);
}

function onTabActivated(tab) {
	menus.onTabActivated(tab);
}

function onInit(tab) {
	menus.onInit(tab);
}