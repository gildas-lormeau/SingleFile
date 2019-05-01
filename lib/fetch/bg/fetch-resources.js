/*
 * Copyright 2010-2019 Gildas Lormeau
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

/* global singlefile, browser, XMLHttpRequest */

singlefile.lib.fetch.bg.resources = (() => {

	const responses = new Map();

	let requestId = 1;

	browser.runtime.onMessage.addListener(message => {
		if (message.method.startsWith("fetch")) {
			return new Promise(resolve => {
				onRequest(message)
					.then(resolve)
					.catch(error => resolve({ error: error.toString() }));
			});
		}
	});
	return {};

	async function onRequest(message) {
		if (message.method == "fetch") {
			const responseId = requestId;
			requestId = requestId + 1;
			const response = await fetchResource(message.url);
			responses.set(responseId, response);
			response.responseId = responseId;
			return { responseId, headers: response.headers };
		} else if (message.method == "fetch.array") {
			const response = responses.get(message.requestId);
			responses.delete(response.requestId);
			return new Promise((resolve, reject) => {
				response.xhrRequest.onerror = event => reject(new Error(event.detail));
				if (response.xhrRequest.readyState == XMLHttpRequest.DONE) {
					resolve(getResponse(response.xhrRequest));
				} else {
					response.xhrRequest.onload = () => resolve(getResponse(response.xhrRequest));
				}
			});
		}
	}

	function getResponse(xhrRequest) {
		return { array: Array.from(new Uint8Array(xhrRequest.response)) };
	}

	async function fetchResource(url) {
		return new Promise((resolve, reject) => {
			const xhrRequest = new XMLHttpRequest();
			xhrRequest.withCredentials = true;
			xhrRequest.responseType = "arraybuffer";
			xhrRequest.onerror = event => reject(new Error(event.detail));
			xhrRequest.onreadystatechange = () => {
				if (xhrRequest.readyState == XMLHttpRequest.HEADERS_RECEIVED) {
					const headers = {};
					headers["content-type"] = xhrRequest.getResponseHeader("Content-Type");
					resolve({ xhrRequest, headers, status: xhrRequest.status });
				}
			};
			xhrRequest.open("GET", url, true);
			xhrRequest.send();
		});
	}

})();