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

/* global browser, fetch, XMLHttpRequest, XPCNativeWrapper, wrappedJSObject */

this.superFetch = this.superFetch || (() => {

	const superFetch = {
		fetch: async url => {
			try {
				return await fetch(url, { mode: "cors", credentials: "include" });
			} catch (error) {
				const responseFetch = await sendMessage({ method: "fetch", url });
				return {
					headers: { get: headerName => responseFetch.headers[headerName] },
					arrayBuffer: async () => {
						const response = await sendMessage({ method: "fetch.array", requestId: responseFetch.responseId });
						return new Uint8Array(response.array).buffer;
					}
				};
			}
		}
	};
	superFetch.hostFetch = async url => {
		const xhrPromise = new Promise((resolve, reject) => {
			const xhrRequest = new XMLHttpRequest();
			let resolveResponse, rejectResponse;
			xhrRequest.withCredentials = true;
			xhrRequest.responseType = "arraybuffer";
			xhrRequest.onerror = event => reject(new Error(event.details));
			xhrRequest.onreadystatechange = () => {
				if (xhrRequest.readyState == XMLHttpRequest.HEADERS_RECEIVED) {
					const headers = new Map();
					headers.set("content-type", xhrRequest.getResponseHeader("Content-Type"));
					resolve({ headers, status: xhrRequest.status, arrayBuffer: () => new Promise((resolve, reject) => [resolveResponse, rejectResponse] = [resolve, reject]) });
				}
				if (xhrRequest.readyState == XMLHttpRequest.DONE) {
					setTimeout(() => resolveResponse(xhrRequest.response), 1);
				}
			};
			xhrRequest.onerror = error => {
				reject(error);
				rejectResponse(error);
			};
			xhrRequest.open("GET", url, true);
			xhrRequest.send();
		});
		if (typeof XPCNativeWrapper != "undefined" && typeof wrappedJSObject != "undefined") {
			return xhrPromise.catch(() => XPCNativeWrapper(wrappedJSObject.fetch)(url, { mode: "cors", credentials: "include" }));
		} else {
			return xhrPromise;
		}
	};
	return superFetch;

	async function sendMessage(message) {
		const response = await browser.runtime.sendMessage(message);
		if (!response || response.error) {
			throw new Error(response && response.error.toString());
		} else {
			return response;
		}
	}

})();