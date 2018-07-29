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

/* global browser */

this.superFetch = this.superFetch || (() => {

	return {
		fetch: async url => {
			const responseFetch = await sendMessage({ method: "fetch", url });
			return {
				headers: { get: headerName => responseFetch.headers[headerName] },
				arrayBuffer: async () => {
					const response = await sendMessage({ method: "fetch.array", requestId: responseFetch.responseId });
					return new Uint8Array(response.array).buffer;
				}
			};
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

})();