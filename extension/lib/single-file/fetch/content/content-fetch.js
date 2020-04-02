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

/* global browser, window, addEventListener, fetch, CustomEvent, dispatchEvent, removeEventListener */

this.singlefile.extension.lib.fetch.content.resources = this.singlefile.extension.lib.fetch.content.resources || (() => {

	const MAX_CONTENT_SIZE = 8 * (1024 * 1024);
	const FETCH_REQUEST_EVENT = "single-file-request-fetch";
	const FETCH_RESPONSE_EVENT = "single-file-response-fetch";

	const pendingRequests = [];

	browser.runtime.onMessage.addListener(message => {
		if ((message.method == "singlefile.fetchFrameRequest" && window.frameId && window.frameId == message.frameId)
			|| message.method == "singlefile.fetchResponse"
			|| message.method == "singlefile.fetchFrameResponse") {
			return onMessage(message);
		}
	});
	return {
		fetch: async url => {
			try {
				let response = await fetch(url, { cache: "force-cache" });
				if (response.status == 403 || response.status == 404) {
					response = hostFetch(url);
				}
				return response;
			}
			catch (error) {
				return sendRequest("singlefile.fetchRequest", url);
			}
		},
		frameFetch: (url, frameId) => sendRequest("singlefile.fetchFrameRequest", url, frameId)
	};

	async function onMessage(message) {
		if (message.method == "singlefile.fetchFrameRequest") {
			sendFetchFrameResponse(message);
			return {};
		} else if (message.method == "singlefile.fetchResponse" || message.method == "singlefile.fetchFrameResponse") {
			resolveRequest(message);
			return {};
		}
	}

	async function sendFetchFrameResponse(message) {
		const { id, tabId } = message;
		try {
			let response = await fetch(message.url, { cache: "force-cache" });
			if (response.status == 403 || response.status == 404) {
				response = hostFetch(message.url);
			}
			const array = new Uint8Array(await response.arrayBuffer());
			for (let blockIndex = 0; blockIndex * MAX_CONTENT_SIZE < array.length; blockIndex++) {
				const message = {
					method: "singlefile.bgFetchFrameResponse",
					id,
					tabId
				};
				message.truncated = array.length > MAX_CONTENT_SIZE;
				if (message.truncated) {
					message.finished = (blockIndex + 1) * MAX_CONTENT_SIZE > array.length;
					message.array = array.slice(blockIndex * MAX_CONTENT_SIZE, (blockIndex + 1) * MAX_CONTENT_SIZE);
				} else {
					message.array = array;
				}
				message.array = Array.from(message.array);
				const headers = {};
				response.headers.forEach((value, key) => headers[key] = value);
				if (!message.truncated || message.finished) {
					message.headers = headers;
					message.status = response.status;
				}
				browser.runtime.sendMessage(message);
			}
		} catch (error) {
			await browser.runtime.sendMessage({
				method: "singlefile.bgFetchFrameResponse",
				id: message.id,
				tabId,
				error: error.toString()
			});
		}
	}

	function resolveRequest(message) {
		const pendingRequest = pendingRequests[message.id];
		if (pendingRequest) {
			if (message.error) {
				pendingRequest.reject(new Error(message.error.toString()));
				pendingRequests[message.id] = null;
			} else {
				if (message.truncated) {
					if (!pendingRequest.responseArray) {
						pendingRequest.responseArray = [];
					}
					pendingRequest.responseArray = pendingRequest.responseArray.concat(message.array);
				} else {
					pendingRequest.responseArray = message.array;
				}
				if (!message.truncated || message.finished) {
					pendingRequest.resolve({
						status: message.status,
						headers: {
							get: headerName => message.headers[headerName]
						},
						arrayBuffer: async () => new Uint8Array(pendingRequest.responseArray).buffer
					});
					pendingRequests[message.id] = null;
				}
			}
		}
	}

	function sendRequest(method, url, frameId) {
		return new Promise((resolve, reject) => {
			const responsePromise = browser.runtime.sendMessage({ method, url, frameId, id: pendingRequests.length });
			responsePromise
				.then(response => {
					if (!response) {
						reject();
					}
				})
				.catch(reject);
			pendingRequests.push({ resolve, reject });
		});
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
								headers: {
									get: name => {
										const header = event.detail.headers.find(header => header[0] == name);
										return header && header[1];
									}
								},
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

})();