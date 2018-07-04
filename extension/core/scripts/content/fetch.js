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

/* global window, chrome, Blob */

window.fetch = (() => {

	let requestId = 1;

	return async (url, options) => {
		const responseFetch = await chromeRuntimeSendMessage({ method: "fetch", url, options });
		return {
			headers: { get: headerName => responseFetch.headers[headerName] },
			arrayBuffer: async () => {
				const response = await chromeRuntimeSendMessage({ method: "fetch.uint8array", requestId: responseFetch.requestId });
				return new Uint8Array(response.uint8array).buffer;
			},
			blob: async () => {
				const response = await chromeRuntimeSendMessage({ method: "fetch.uint8array", requestId: responseFetch.requestId });
				return new Blob([new Uint8Array(response.uint8array)]);
			},
			text: async () => {
				const response = await chromeRuntimeSendMessage({ method: "fetch.text", requestId: responseFetch.requestId });
				return response.text;
			}
		};
	};

	function chromeRuntimeSendMessage(message) {
		return new Promise((resolve, reject) => {
			if (!message.requestId) {
				message.requestId = requestId;
				requestId = requestId + 1;
			}
			chrome.runtime.sendMessage(message, response => {
				if (response.error) {
					reject(response.error);
				} else {
					resolve(response);
				}
			});
		});
	}

})();