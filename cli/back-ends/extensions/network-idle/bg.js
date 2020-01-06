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

/* global setTimeout, clearTimeout */

const browserAPI = this.browser || this.chrome;

const IDLE_DELAY = 1000;
const watchDogs = [];
let pendingRequests = new Set();

browserAPI.webRequest.onSendHeaders.addListener(onRequest, { urls: ["<all_urls>"] }, []);
browserAPI.webRequest.onResponseStarted.addListener(onResponse, { urls: ["<all_urls>"] }, []);
browserAPI.webRequest.onErrorOccurred.addListener(onResponse, { urls: ["<all_urls>"] });

function onRequest(details) {
	if (details.tabId != -1) {
		pendingRequests.add(details.requestId);
		if (pendingRequests.size > 2) {
			clearTimeout(watchDogs[2]);
		}
		clearTimeout(watchDogs[0]);
	}
}

function onResponse(details) {
	if (details.tabId != -1) {
		pendingRequests.delete(details.requestId);
		if (pendingRequests.size == 2) {
			maybeIdle(2, details.tabId);
		}
		if (pendingRequests.size == 0) {
			maybeIdle(0, details.tabId);
		}
	}
}

function maybeIdle(idleLevel, tabId) {
	clearTimeout(watchDogs[idleLevel]);
	watchDogs[idleLevel] = setTimeout(() => browserAPI.tabs.sendMessage(tabId, "network-idle-" + idleLevel), IDLE_DELAY);
}