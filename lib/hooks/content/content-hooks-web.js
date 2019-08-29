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

(() => {

	const FETCH_REQUEST_EVENT = "single-file-request-fetch";
	const FETCH_RESPONSE_EVENT = "single-file-response-fetch";

	const history = window.history;
	const dispatchEvent = window.dispatchEvent;
	const CustomEvent = window.CustomEvent;
	const fetch = window.fetch;
	const addEventListener = window.addEventListener;
	const pushState = history.pushState;

	let warningDisplayed;
	history.pushState = function (state, title, url) {
		if (!warningDisplayed) {
			warningDisplayed = true;
			safeWarn("SingleFile is hooking the history.pushState API to detect navigation."); // eslint-disable-line no-console
		}
		try {
			dispatchEvent.call(window, new CustomEvent("single-file-push-state", { detail: { state, title, url } }));
		} catch (error) {
			// ignored
		}
		pushState.call(history, state, title, url);
	};
	history.pushState.toString = function () { return "function pushState() { [native code] }"; };

	addEventListener.call(window, FETCH_REQUEST_EVENT, async event => {
		const url = event.detail;
		let detail;
		try {
			const response = await fetch(url, { cache: "force-cache" });
			detail = { url, response: await response.arrayBuffer(), headers: Array.from(response.headers), status: response.status };
		} catch (error) {
			detail = { url, error: error.toString() };
		}
		dispatchEvent.call(window, new CustomEvent(FETCH_RESPONSE_EVENT, { detail }));
	});

	function safeWarn(arg) {
		try {
			console.warn(arg); // eslint-disable-line no-console
		} catch (error) {
			try {
				console.log("Warning: " + String(arg)); // eslint-disable-line no-console
			} catch (error) {
				// ignored
			}
		}
	}

})();