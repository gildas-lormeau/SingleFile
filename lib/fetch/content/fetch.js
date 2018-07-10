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

/* global window, Blob */

window.superFetch = (() => {

	const browser = this.browser || this.chrome;

	return async (url, options) => {
		const responseFetch = await sendMessage({ method: "fetch", url, options });
		return {
			headers: { get: headerName => responseFetch.headers[headerName] },
			arrayBuffer: async () => {
				const response = await sendMessage({ method: "fetch.array", requestId: responseFetch.responseId });
				return new Uint8Array(response.array).buffer;
			},
			blob: async () => {
				const response = await sendMessage({ method: "fetch.array", requestId: responseFetch.responseId });
				return new Blob([new Uint8Array(response.array)]);
			},
			text: async () => {
				const response = await sendMessage({ method: "fetch.text", requestId: responseFetch.responseId });
				return response.text;
			}
		};
	};

	function sendMessage(message) {
		return new Promise((resolve, reject) => {
			browser.runtime.sendMessage(message, response => {
				if (!response || response.error) {
					reject(response && response.error);
				} else {
					resolve(response);
				}
			});
		});
	}

})();