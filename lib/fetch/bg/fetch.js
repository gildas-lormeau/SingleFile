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

/* global browser, fetch */

(() => {

	const fetchResponses = new Map();

	let requestId = 1;

	browser.runtime.onMessage.addListener(async request => {
		if (request.method) {
			try {
				return await onRequest(request);
			} catch (error) {
				return { error: error.toString() };
			}
		}
	});

	async function onRequest(request) {
		if (request.method == "fetch") {
			const responseId = requestId;
			requestId = requestId + 1;
			const response = await fetch(request.url, request.options);
			if (response.status >= 400) {
				throw new Error(response.statusText || response.status);
			} else {
				fetchResponses.set(responseId, response);
				const headers = {};
				for (let headerName of response.headers.keys()) {
					headers[headerName] = response.headers.get(headerName);
				}
				return { responseId, headers };
			}
		} else {
			const content = fetchResponses.get(request.requestId);
			fetchResponses.delete(request.requestId);
			if (request.method == "fetch.array") {
				const buffer = await content.arrayBuffer();
				return { array: Array.from(new Uint8Array(buffer)) };
			}
			if (request.method == "fetch.text") {
				const text = await content.text();
				return { text };
			}
		}
	}

})();