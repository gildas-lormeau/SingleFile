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

/* global browser, XMLHttpRequest */

(() => {

	const responses = new Map();

	let requestId = 1;

	browser.runtime.onMessage.addListener(request => {
		if (request.method && request.method.startsWith("fetch")) {
			return new Promise(resolve => {
				onRequest(request)
					.then(resolve)
					.catch(error => resolve({ error: error.toString() }));
			});
		}
	});

	async function onRequest(request) {
		if (request.method == "fetch") {
			const responseId = requestId;
			requestId = requestId + 1;
			const response = await superFetch(request.url);
			responses.set(responseId, response);
			response.responseId = responseId;
			return { responseId, headers: response.headers };
		} else if (request.method == "fetch.array") {
			const response = responses.get(request.requestId);
			responses.delete(response.requestId);
			return new Promise((resolve, reject) => {
				response.xhrRequest.onerror = event => reject(new Error(event.details));
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

	async function superFetch(url) {
		return new Promise((resolve, reject) => {
			const xhrRequest = new XMLHttpRequest();
			xhrRequest.withCredentials = true;
			xhrRequest.responseType = "arraybuffer";
			xhrRequest.onerror = event => reject(new Error(event.details));
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