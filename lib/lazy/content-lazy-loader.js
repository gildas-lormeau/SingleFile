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

/* global browser, document, timeout, MutationObserver */

this.lazyLoader = this.lazyLoader || (() => {

	const LAZY_LOADING_TIMEOUT = 1000;
	const IDLE_LAZY_LOADING_TIMEOUT = 3000;
	const MAX_LAZY_LOADING_TIMEOUT = 30000;
	const SCRIPT_TAG_NAME = "script";
	const MONITORED_ATTRIBUTES = ["src", "srcset"];
	const ATTRIBUTES_MUTATION_TYPE = "attributes";
	const SCRIPT_BEFORE_PATH = "lib/lazy/web-lazy-loader-before.js";
	const SCRIPT_AFTER_PATH = "lib/lazy/web-lazy-loader-after.js";

	return { process };

	function process() {
		return new Promise(resolve => {
			let timeoutId, srcAttributeChanged;
			const idleTimeoutId = timeout.set(() => {
				if (!srcAttributeChanged) {
					timeout.clear(timeoutId);
					lazyLoadEnd(maxTimeoutId, idleTimeoutId, observer, resolve);
				}
			}, IDLE_LAZY_LOADING_TIMEOUT);
			const maxTimeoutId = timeout.set(() => {
				timeout.clear(timeoutId);
				lazyLoadEnd(maxTimeoutId, idleTimeoutId, observer, resolve);
			}, MAX_LAZY_LOADING_TIMEOUT);
			const observer = new MutationObserver(mutations => {
				if (mutations.find(mutation => mutation.type == ATTRIBUTES_MUTATION_TYPE)) {
					srcAttributeChanged = true;
					timeoutId = deferLazyLoadEnd(timeoutId, maxTimeoutId, idleTimeoutId, observer, resolve);
				}
			});
			observer.observe(document, { attributeFilter: MONITORED_ATTRIBUTES, subtree: true, childList: true });
			injectScript(SCRIPT_BEFORE_PATH);
		});
	}

	function deferLazyLoadEnd(timeoutId, maxTimeoutId, idleTimeoutId, observer, resolve) {
		timeout.clear(timeoutId);
		return timeout.set(() => lazyLoadEnd(maxTimeoutId, idleTimeoutId, observer, resolve), LAZY_LOADING_TIMEOUT);
	}

	function lazyLoadEnd(maxTimeoutId, idleTimeoutId, observer, resolve) {
		timeout.clear(maxTimeoutId);
		timeout.clear(idleTimeoutId);
		timeout.set(resolve, LAZY_LOADING_TIMEOUT);
		injectScript(SCRIPT_AFTER_PATH);
		observer.disconnect();
	}

	function injectScript(path) {
		const scriptElement = document.createElement(SCRIPT_TAG_NAME);
		scriptElement.src = browser.runtime.getURL(path);
		document.body.appendChild(scriptElement);
		scriptElement.onload = () => scriptElement.remove();
	}

})();