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

/* global browser, XMLHttpRequest */

const referrers = new Map();
const REQUEST_ID_HEADER_NAME = "x-single-file-request-id";
const MAX_CONTENT_SIZE = 8 * (1024 * 1024);

export {
	REQUEST_ID_HEADER_NAME,
	referrers,
	fetchResource
};

browser.runtime.onMessage.addListener((message, sender) => {
	if (message.method && message.method.startsWith("singlefile.fetch")) {
		return new Promise(resolve => {
			onRequest(message, sender)
				.then(resolve)
				.catch(error => resolve({ error: error && error.toString() }));
		});
	}
});

async function onRequest(message, sender) {
	if (message.method == "singlefile.fetch") {
		try {
			const response = await fetchResource(message.url, { referrer: message.referrer, headers: message.headers });
			return sendResponse(sender.tab.id, message.requestId, response);
		} catch (error) {
			return sendResponse(sender.tab.id, message.requestId, { error: error.message, array: [] });
		}
	} else if (message.method == "singlefile.fetchFrame") {
		return browser.tabs.sendMessage(sender.tab.id, message);
	}
}

async function sendResponse(tabId, requestId, response) {
	for (let blockIndex = 0; blockIndex * MAX_CONTENT_SIZE <= response.array.length; blockIndex++) {
		const message = {
			method: "singlefile.fetchResponse",
			requestId,
			headers: response.headers,
			status: response.status,
			error: response.error
		};
		message.truncated = response.array.length > MAX_CONTENT_SIZE;
		if (message.truncated) {
			message.finished = (blockIndex + 1) * MAX_CONTENT_SIZE > response.array.length;
			message.array = response.array.slice(blockIndex * MAX_CONTENT_SIZE, (blockIndex + 1) * MAX_CONTENT_SIZE);
		} else {
			message.array = response.array;
		}
		await browser.tabs.sendMessage(tabId, message);
	}
	return {};
}

function fetchResource(url, options = {}, includeRequestId) {
	return new Promise((resolve, reject) => {
		const xhrRequest = new XMLHttpRequest();
		xhrRequest.withCredentials = true;
		xhrRequest.responseType = "arraybuffer";
		xhrRequest.onerror = event => reject(new Error(event.detail));
		xhrRequest.onreadystatechange = () => {
			if (xhrRequest.readyState == XMLHttpRequest.DONE) {
				if (xhrRequest.status || xhrRequest.response.byteLength) {
					if ((xhrRequest.status == 401 || xhrRequest.status == 403 || xhrRequest.status == 404) && !includeRequestId) {
						fetchResource(url, options, true)
							.then(resolve)
							.catch(reject);
					} else {
						resolve({
							arrayBuffer: xhrRequest.response,
							array: Array.from(new Uint8Array(xhrRequest.response)),
							headers: { "content-type": xhrRequest.getResponseHeader("Content-Type") },
							status: xhrRequest.status
						});
					}
				} else {
					reject(new Error("Empty response"));
				}
			}
		};
		xhrRequest.open("GET", url, true);
		if (options.headers) {
			for (const entry of Object.entries(options.headers)) {
				xhrRequest.setRequestHeader(entry[0], entry[1]);
			}
		}
		if (includeRequestId) {
			const randomId = String(Math.random()).substring(2);
			setReferrer(randomId, options.referrer);
			xhrRequest.setRequestHeader(REQUEST_ID_HEADER_NAME, randomId);
		}
		xhrRequest.send();
	});
}

function setReferrer(requestId, referrer) {
	referrers.set(requestId, referrer);
}