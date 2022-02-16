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

/* global browser, window, CustomEvent, setTimeout */

const FETCH_REQUEST_EVENT = "single-file-request-fetch";
const FETCH_RESPONSE_EVENT = "single-file-response-fetch";
const HOST_FETCH_MAX_DELAY = 5000;
const addEventListener = (type, listener, options) => window.addEventListener(type, listener, options);
const dispatchEvent = event => window.dispatchEvent(event);
const removeEventListener = (type, listener, options) => window.removeEventListener(type, listener, options);
const fetch = (url, options) => window.fetch(url, options);

let requestId = 0, pendingResponses = new Map();

browser.runtime.onMessage.addListener(message => {
	if (message.method == "singlefile.fetchFrame" && window.frameId && window.frameId == message.frameId) {
		return onFetchFrame(message);
	}
	if (message.method == "singlefile.fetchResponse") {
		return onFetchResponse(message);
	}
});

async function onFetchFrame(message) {
	try {
		let response = await fetch(message.url, { cache: "force-cache", headers: message.headers });
		if (response.status == 401 || response.status == 403 || response.status == 404) {
			response = await Promise.race(
				[
					hostFetch(message.url),
					new Promise((resolve, reject) => setTimeout(() => reject(), HOST_FETCH_MAX_DELAY))
				]);
		}
		return {
			status: response.status,
			headers: [...response.headers],
			array: Array.from(new Uint8Array(await response.arrayBuffer()))
		};
	} catch (error) {
		return {
			error: error && error.toString()
		};
	}
}

async function onFetchResponse(message) {
	const pendingResponse = pendingResponses.get(message.requestId);
	if (pendingResponse) {
		if (message.error) {
			pendingResponse.reject(new Error(message.error));
			pendingResponses.delete(message.requestId);
		} else {
			if (message.truncated) {
				if (pendingResponse.array) {
					pendingResponse.array = pendingResponse.array.concat(message.array);
				} else {
					pendingResponse.array = message.array;
					pendingResponses.set(message.requestId, pendingResponse);
				}
				if (message.finished) {
					message.array = pendingResponse.array;
				}
			}
			if (!message.truncated || message.finished) {
				pendingResponse.resolve({
					status: message.status,
					headers: { get: headerName => message.headers && message.headers[headerName] },
					arrayBuffer: async () => new Uint8Array(message.array).buffer
				});
				pendingResponses.delete(message.requestId);
			}
		}
	}
	return {};
}

export {
	fetchResource as fetch,
	frameFetch
};

async function fetchResource(url, options = {}) {
	try {
		let response = await fetch(url, { cache: "force-cache", headers: options.headers });
		if (response.status == 401 || response.status == 403 || response.status == 404) {
			response = await hostFetch(url);
		}
		return response;
	}
	catch (error) {
		requestId++;
		const promise = new Promise((resolve, reject) => pendingResponses.set(requestId, { resolve, reject }));
		await sendMessage({ method: "singlefile.fetch", url, requestId, referrer: options.referrer, headers: options.headers });
		return promise;
	}
}

async function frameFetch(url, options) {
	const response = await sendMessage({ method: "singlefile.fetchFrame", url, frameId: options.frameId, referrer: options.referrer, headers: options.headers });
	return {
		status: response.status,
		headers: new Map(response.headers),
		arrayBuffer: async () => new Uint8Array(response.array).buffer
	};
}

async function sendMessage(message) {
	const response = await browser.runtime.sendMessage(message);
	if (!response || response.error) {
		throw new Error(response && response.error && response.error.toString());
	} else {
		return response;
	}
}

function hostFetch(url) {
	return new Promise((resolve, reject) => {
		dispatchEvent(new CustomEvent(FETCH_REQUEST_EVENT, { detail: url }));
		addEventListener(FETCH_RESPONSE_EVENT, onResponseFetch, false);

		function onResponseFetch(event) {
			if (event.detail) {
				if (event.detail.url == url) {
					removeEventListener(FETCH_RESPONSE_EVENT, onResponseFetch, false);
					if (event.detail.response) {
						resolve({
							status: event.detail.status,
							headers: new Map(event.detail.headers),
							arrayBuffer: async () => event.detail.response
						});
					} else {
						reject(event.detail.error);
					}
				}
			} else {
				reject();
			}
		}
	});
}