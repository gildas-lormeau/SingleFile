/*
 * Copyright 2010-2020 Gildas Lormeau
 * contact : gildas.lormeau <at> gmail.com
 *
 * This file is part of SingleFile.
 *
 *   The code in this file is free software: you can redistribute it and/or
 *   modify it under the terms of the GNU Affero General Public License
 *   as published by the Free Software Foundation, either version 3 of the
 *   License, or (at your option) any later version.
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

/* global browser, URLSearchParams, setTimeout, clearTimeout */

import * as config from "./config.js";

const OPTIONS_PAGE_PATH = "/src/ui/pages/options.html";
// must be kept in sync with EXTERNAL_CAPTURE_PENDING_REQUEST_TIMEOUT in ui-options.js
const PENDING_REQUEST_TIMEOUT = 300000;
const pendingRequests = new Map();
let requestId = 0;

export {
	onMessage,
	requestPermission
};

if (browser.tabs.onRemoved) {
	browser.tabs.onRemoved.addListener(tabId => {
		Array.from(pendingRequests.values())
			.filter(request => request.tabId == tabId)
			.forEach(request => resolveRequest(request, false));
	});
}

async function requestPermission(sender, message = {}) {
	const extensionId = sender && sender.id;
	if (!extensionId) {
		throw new Error("Cannot identify the extension requesting SingleFile capture");
	}
	const permissions = await config.getExternalCapturePermissions();
	if (permissions.allowedExtensionIds.includes(extensionId)) {
		return true;
	}
	if (permissions.deniedExtensionIds.includes(extensionId)) {
		return false;
	}
	const { request, created } = getOrCreatePendingRequest(extensionId, sender, message);
	if (created) {
		await openOptionsPage(request);
	}
	return request.promise;
}

async function onMessage(message, sender) {
	if (!isOptionsPageSender(sender)) {
		throw new Error("Unauthorized sender");
	}
	if (message.method.endsWith(".getPermissions")) {
		return config.getExternalCapturePermissions();
	}
	if (message.method.endsWith(".setPermissions")) {
		await config.setExternalCapturePermissions(message.permissions);
		return {};
	}
	if (message.method.endsWith(".getPendingRequest")) {
		return getPendingRequest(message.requestId);
	}
	if (message.method.endsWith(".respondPendingRequest")) {
		return respondPendingRequest(message.requestId, message.approved);
	}
}

function isOptionsPageSender(sender) {
	return Boolean(sender) && sender.id == browser.runtime.id &&
		Boolean(sender.url) && sender.url.startsWith(browser.runtime.getURL(OPTIONS_PAGE_PATH));
}

function getOrCreatePendingRequest(extensionId, sender, message = {}) {
	const existingRequest = Array.from(pendingRequests.values()).find(request => request.extensionId == extensionId);
	if (existingRequest) {
		return { request: existingRequest, created: false };
	}
	const id = String(++requestId);
	let resolvePermission;
	const promise = new Promise(resolve => resolvePermission = resolve);
	const request = {
		id,
		extensionId,
		displayName: sanitizeDisplayName(message.displayName),
		url: sender.url,
		origin: sender.origin,
		resolvePermission,
		promise
	};
	request.timeoutId = setTimeout(() => resolveRequest(request, false), PENDING_REQUEST_TIMEOUT);
	pendingRequests.set(id, request);
	return { request, created: true };
}

function resolveRequest(request, approved) {
	if (pendingRequests.has(request.id)) {
		pendingRequests.delete(request.id);
		clearTimeout(request.timeoutId);
		request.resolvePermission(Boolean(approved));
	}
}

function getPendingRequest(id) {
	const request = pendingRequests.get(id);
	if (request) {
		return {
			id: request.id,
			extensionId: request.extensionId,
			displayName: request.displayName,
			url: request.url,
			origin: request.origin
		};
	}
}

async function respondPendingRequest(id, approved) {
	const request = pendingRequests.get(id);
	if (!request) {
		return { found: false };
	}
	const permissions = await config.getExternalCapturePermissions();
	const allowedExtensions = permissions.allowedExtensions.filter(extension => extension.id != request.extensionId);
	const deniedExtensions = permissions.deniedExtensions.filter(extension => extension.id != request.extensionId);
	const extension = {
		id: request.extensionId,
		name: request.displayName
	};
	if (approved) {
		allowedExtensions.push(extension);
	} else {
		deniedExtensions.push(extension);
	}
	await config.setExternalCapturePermissions({ allowedExtensions, deniedExtensions });
	resolveRequest(request, approved);
	return { found: true, approved: Boolean(approved) };
}

async function openOptionsPage(request) {
	const searchParams = new URLSearchParams({ externalCaptureRequestId: request.id });
	const url = browser.runtime.getURL(`${OPTIONS_PAGE_PATH}?${searchParams.toString()}`);
	const tab = await browser.tabs.create({ active: true, url });
	request.tabId = tab.id;
}

function sanitizeDisplayName(value) {
	if (typeof value != "string") {
		return "";
	}
	return value.trim().replace(/\s+/g, " ").slice(0, 80);
}
