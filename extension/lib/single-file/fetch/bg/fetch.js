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

(() => {

	const MAX_CONTENT_SIZE = 8 * (1024 * 1024);

	browser.runtime.onMessage.addListener((message, sender) => {
		if (message.method == "singlefile.fetchRequest"
			|| message.method == "singlefile.fetchFrameRequest"
			|| message.method == "singlefile.bgFetchFrameResponse") {
			return onRequest(message, sender);
		}
	});

	async function onRequest(message, sender) {
		if (message.method == "singlefile.fetchRequest") {
			sendFetchResponse(message, sender);
			return {};
		} else if (message.method == "singlefile.fetchFrameRequest") {
			return sendFrameMessage(message, sender);
		} else if (message.method == "singlefile.bgFetchFrameResponse") {
			sendFetchFrameResponse(message);
			return {};
		}
	}

	async function sendFrameMessage(message, sender) {
		message.tabId = sender.tab.id;
		try {
			return await browser.tabs.sendMessage(sender.tab.id, message);
		} catch (error) {
			return null;
		}
	}

	async function sendFetchResponse(message, sender) {
		try {
			const response = await fetchResource(message.url);
			const id = message.id;
			for (let blockIndex = 0; blockIndex * MAX_CONTENT_SIZE < response.array.length; blockIndex++) {
				const message = {
					method: "singlefile.fetchResponse",
					id
				};
				message.truncated = response.array.length > MAX_CONTENT_SIZE;
				if (message.truncated) {
					message.finished = (blockIndex + 1) * MAX_CONTENT_SIZE > response.array.length;
					message.array = response.array.slice(blockIndex * MAX_CONTENT_SIZE, (blockIndex + 1) * MAX_CONTENT_SIZE);
				} else {
					message.array = response.array;
				}
				if (!message.truncated || message.finished) {
					message.headers = response.headers;
					message.status = response.status;
				}
				browser.tabs.sendMessage(sender.tab.id, message);
			}
		} catch (error) {
			await browser.tabs.sendMessage(sender.tab.id, {
				method: "singlefile.fetchResponse",
				id: message.id,
				error: error.toString()
			});
		}
	}

	function sendFetchFrameResponse(message) {
		if (message.error) {
			browser.tabs.sendMessage(message.tabId, message);
		} else {
			message.method = "singlefile.fetchFrameResponse";
			browser.tabs.sendMessage(message.tabId, message);
		}
	}

	function fetchResource(url) {
		return new Promise((resolve, reject) => {
			const xhrRequest = new XMLHttpRequest();
			xhrRequest.withCredentials = true;
			xhrRequest.responseType = "arraybuffer";
			xhrRequest.onerror = event => reject(new Error(event.detail));
			xhrRequest.onreadystatechange = () => {
				if (xhrRequest.readyState == XMLHttpRequest.DONE) {
					if (xhrRequest.status || xhrRequest.response.byteLength) {
						resolve({
							array: Array.from(new Uint8Array(xhrRequest.response)),
							headers: { "content-type": xhrRequest.getResponseHeader("Content-Type") },
							status: xhrRequest.status
						});
					} else {
						reject();
					}
				}
			};
			xhrRequest.open("GET", url, true);
			xhrRequest.send();
		});
	}

})();