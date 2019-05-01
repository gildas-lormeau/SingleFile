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

/* global browser, fetch, XMLHttpRequest */

this.singlefile.lib.fetch.content.resources = this.singlefile.lib.fetch.content.resources || (() => {

	return {
		fetch: async url => {
			try {
				let response = await fetch(url, { cache: "force-cache" });
				if (response.status == 403) {
					response = await fetch(url, { credentials: "same-origin", cache: "force-cache" });
				}
				if (response.status == 403) {
					response = await xhrFetch(url);
				}
				if (response.status == 403) {
					response = await fetch(url, { credentials: "include", cache: "force-cache" });
				}
				if (response.status == 403) {
					response = await fetch(url, { mode: "cors", credentials: "omit", cache: "force-cache" });
				}
				if (response.status == 403) {
					response = await fetch(url, { mode: "cors", credentials: "same-origin", cache: "force-cache" });
				}
				if (response.status == 403) {
					response = await fetch(url, { mode: "cors", credentials: "include", cache: "force-cache" });
				}
				return response;
			}
			catch (error) {
				const responseFetch = await sendMessage({ method: "fetch", url });
				return {
					status: responseFetch.status,
					headers: { get: headerName => responseFetch.headers[headerName] },
					arrayBuffer: async () => {
						const response = await sendMessage({ method: "fetch.array", requestId: responseFetch.responseId });
						return new Uint8Array(response.array).buffer;
					}
				};
			}
		}
	};

	async function sendMessage(message) {
		const response = await browser.runtime.sendMessage(message);
		if (!response || response.error) {
			throw new Error(response && response.error.toString());
		} else {
			return response;
		}
	}

	function xhrFetch(url) {
		return new Promise((resolve, reject) => {
			const xhrRequest = new XMLHttpRequest();
			xhrRequest.responseType = "arraybuffer";
			xhrRequest.onerror = event => reject(new Error(event.detail));
			xhrRequest.onreadystatechange = () => {
				if (xhrRequest.readyState == XMLHttpRequest.HEADERS_RECEIVED || xhrRequest.readyState == XMLHttpRequest.DONE) {
					const headers = new Map();
					headers.set("content-type", xhrRequest.getResponseHeader("Content-Type"));
					resolve({
						status: xhrRequest.status,
						headers,
						arrayBuffer: () => new Promise((resolve, reject) => {
							xhrRequest.onerror = event => reject(new Error(event.detail));
							if (xhrRequest.readyState == XMLHttpRequest.DONE) {
								resolve(xhrRequest.response);
							} else {
								xhrRequest.onload = () => resolve(xhrRequest.response);
							}
						})
					});
				}
			};
			xhrRequest.open("GET", url, true);
			xhrRequest.send();
		});
	}

})();