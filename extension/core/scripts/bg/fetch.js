/*
 * Copyright 2018 Gildas Lormeau
 * contact : gildas.lormeau <at> gmail.com
 * 
 * This file is part of SingleFile.
 *
 *   SingleFile is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU Lesser General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   SingleFile is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU Lesser General Public License for more details.
 *
 *   You should have received a copy of the GNU Lesser General Public License
 *   along with SingleFile.  If not, see <http://www.gnu.org/licenses/>.
 */

/* global chrome, fetch */

(() => {

	const fetchResponses = new Map();

	let requestId = 1;

	chrome.runtime.onMessage.addListener((request, sender, send) => {

		function sendResponse(response) {
			if (request.method.startsWith("fetch.")) {
				fetchResponses.delete(request.requestId);
			}
			send(response);
		}

		function sendFetchResponse(responseId, response) {
			fetchResponses.set(responseId, response);
			const headers = {};
			for (let headerName of response.headers.keys()) {
				headers[headerName] = response.headers.get(headerName);
			}
			sendResponse({ responseId, headers });
		}

		if (request.method) {
			if (request.method == "fetch") {
				const responseId = requestId;
				fetch(request.url, request.options)
					.then(response => {
						if (response.status >= 400) {
							sendResponse({ error: response.statusText || response.status });
						} else {
							sendFetchResponse(responseId, response);
						}
					})
					.catch(error => sendResponse({ error: error.toString() }));
				requestId = requestId + 1;
			}
			if (request.method == "fetch.uint8array") {
				const content = fetchResponses.get(request.requestId);
				content.arrayBuffer()
					.then(buffer => sendResponse({ uint8array: Array.from(new Uint8Array(buffer)) }))
					.catch(error => sendResponse({ error: error.toString() }));
			}
			if (request.method == "fetch.text") {
				const content = fetchResponses.get(request.requestId);
				content.text()
					.then(text => sendResponse({ text }))
					.catch(error => sendResponse({ error: error.toString() }));
			}
			return true;
		}
	});

})();