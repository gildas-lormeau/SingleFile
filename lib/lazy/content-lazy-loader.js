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

/* global browser, document, timeout, MutationObserver, setTimeout, clearTimeout */

this.lazyLoader = this.lazyLoader || (() => {

	const SCRIPT_TAG_NAME = "script";
	const MONITORED_ATTRIBUTES = ["src", "srcset"];
	const ATTRIBUTES_MUTATION_TYPE = "attributes";
	const SCRIPT_BEFORE_PATH = "lib/lazy/web-lazy-loader-before.js";
	const SCRIPT_AFTER_PATH = "lib/lazy/web-lazy-loader-after.js";

	return { process };

	function process(options) {
		return new Promise(resolve => {
			let timeoutId, srcAttributeChanged;
			const idleTimeoutId = timeout.set(() => {
				if (!srcAttributeChanged) {
					timeout.clear(timeoutId);
					lazyLoadEnd(maxTimeoutId, idleTimeoutId, observer, options, resolve);
				}
			}, options.maxLazyLoadImagesIdleTime * 1.2);
			const maxTimeoutId = setTimeout(() => {
				timeout.clear(timeoutId);
				lazyLoadEnd(maxTimeoutId, idleTimeoutId, observer, options, resolve);
			}, options.maxLazyLoadImagesIdleTime * 3);
			const observer = new MutationObserver(mutations => {
				mutations = mutations.filter(mutation => mutation.type == ATTRIBUTES_MUTATION_TYPE);
				if (mutations.length) {
					mutations.forEach(mutation => {
						if (mutation.target.src) {
							mutation.target.setAttribute("data-lazy-loaded-src", mutation.target.src);
						}
					});
					srcAttributeChanged = true;
					timeoutId = deferLazyLoadEnd(timeoutId, maxTimeoutId, idleTimeoutId, observer, options, resolve);
				}
			});
			observer.observe(document, { attributeFilter: MONITORED_ATTRIBUTES, subtree: true, childList: true, attributes: true });
			injectScript(SCRIPT_BEFORE_PATH);
		});
	}

	function deferLazyLoadEnd(timeoutId, maxTimeoutId, idleTimeoutId, observer, options, resolve) {
		timeout.clear(timeoutId);
		return timeout.set(() => lazyLoadEnd(maxTimeoutId, idleTimeoutId, observer, options, resolve), options.maxLazyLoadImagesIdleTime);
	}

	function lazyLoadEnd(maxTimeoutId, idleTimeoutId, observer, options, resolve) {
		clearTimeout(maxTimeoutId);
		timeout.clear(idleTimeoutId);
		injectScript(SCRIPT_AFTER_PATH);
		setTimeout(resolve, 100);
		observer.disconnect();
	}

	function injectScript(path) {
		const scriptElement = document.createElement(SCRIPT_TAG_NAME);
		scriptElement.src = browser.runtime.getURL(path);
		document.body.appendChild(scriptElement);
		scriptElement.onload = () => scriptElement.remove();
	}

})();