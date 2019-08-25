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

/* global window */

this.singlefile.extension.lib.fetch.content.resources = this.singlefile.extension.lib.fetch.content.resources || (() => {

	const FETCH_REQUEST_EVENT = "single-file-request-fetch";
	const FETCH_RESPONSE_EVENT = "single-file-response-fetch";

	const browser = this.browser;
	const addEventListener = window.addEventListener;
	const fetch = window.fetch;
	const CustomEvent = window.CustomEvent;
	const dispatchEvent = window.dispatchEvent;
	const removeEventListener = window.removeEventListener;

	return {
		fetch: async url => {
			try {
				let response = await fetch(url, { cache: "force-cache" });
				if (response.status == 403) {
					response = hostFetch(url);
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

	function hostFetch(url) {
		return new Promise((resolve, reject) => {
			dispatchEvent.call(window, new CustomEvent(FETCH_REQUEST_EVENT, { detail: url }));
			addEventListener.call(window, FETCH_RESPONSE_EVENT, onResponseFetch, false);

			function onResponseFetch(event) {
				if (event.detail) {
					if (event.detail.url == url) {
						removeEventListener.call(window, FETCH_RESPONSE_EVENT, onResponseFetch, false);
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