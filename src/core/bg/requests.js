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

/* global browser */

import {
	REQUEST_ID_HEADER_NAME,
	referrers
} from "../../lib/single-file/fetch/bg/fetch.js";

let referrerOnErrorEnabled = false;

export {
	onMessage,
	enableReferrerOnError
};

function onMessage(message) {
	if (message.method.endsWith(".enableReferrerOnError")) {
		enableReferrerOnError();
		return {};
	}
	if (message.method.endsWith(".disableReferrerOnError")) {
		disableReferrerOnError();
		return {};
	}
}

function injectRefererHeader(details) {
	if (referrerOnErrorEnabled) {
		let requestIdHeader = details.requestHeaders.find(header => header.name === REQUEST_ID_HEADER_NAME);
		if (requestIdHeader) {
			details.requestHeaders = details.requestHeaders.filter(header => header.name !== REQUEST_ID_HEADER_NAME);
			const referrer = referrers.get(requestIdHeader.value);
			if (referrer) {
				referrers.delete(requestIdHeader.value);
				const header = details.requestHeaders.find(header => header.name.toLowerCase() === "referer");
				if (!header) {
					details.requestHeaders.push({ name: "Referer", value: referrer });
					return { requestHeaders: details.requestHeaders };
				}
			}
		}
	}
}

function enableReferrerOnError() {
	if (!referrerOnErrorEnabled) {
		try {
			browser.webRequest.onBeforeSendHeaders.addListener(injectRefererHeader, { urls: ["<all_urls>"] }, ["blocking", "requestHeaders", "extraHeaders"]);
			// eslint-disable-next-line no-unused-vars
		} catch (error) {
			browser.webRequest.onBeforeSendHeaders.addListener(injectRefererHeader, { urls: ["<all_urls>"] }, ["blocking", "requestHeaders"]);
		}
		referrerOnErrorEnabled = true;
	}
}

function disableReferrerOnError() {
	try {
		browser.webRequest.onBeforeSendHeaders.removeListener(injectRefererHeader);
		// eslint-disable-next-line no-unused-vars
	} catch (error) {
		// ignored
	}
	referrerOnErrorEnabled = false;
}