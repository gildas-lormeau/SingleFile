/*
 * Copyright 2010-2020 Gildas Lormeau
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

const removedHeaders = ["access-control-allow-methods", "access-control-allow-headers"];
const updatedHeaders = { "access-control-allow-origin": "*", "access-control-allow-credentials": "true" };

const browserAPI = this.browser || this.chrome;

browserAPI.webRequest.onHeadersReceived.addListener(
	function (details) {
		let responseHeaders = details.responseHeaders;
		let processedHeaders = [];
		responseHeaders = responseHeaders.filter(responseHeader => !removedHeaders.includes(responseHeader.name.toLowerCase()));
		responseHeaders.forEach(responseHeader => {
			const name = responseHeader.name.toLowerCase();
			const value = updatedHeaders[name];
			if (value) {
				responseHeader.value = value;
				processedHeaders.push(name);
			}
		});
		Object.keys(updatedHeaders).forEach(name => {
			if (!processedHeaders.includes(name)) {
				const value = updatedHeaders[name.toLowerCase()];
				if (value) {
					responseHeaders.push({ name, value });
				}
			}
		});
		return { responseHeaders };
	},
	{ urls: ["<all_urls>"] },
	["blocking", "responseHeaders"]
);