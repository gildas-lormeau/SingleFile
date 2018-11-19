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

/* global browser, document, MutationObserver */

this.lazyLoader = this.lazyLoader || (() => {

	const SCRIPT_TAG_NAME = "script";
	const ATTRIBUTES_MUTATION_TYPE = "attributes";
	const SCRIPT_BEFORE_PATH = "lib/lazy/web/web-lazy-loader-before.js";
	const SCRIPT_AFTER_PATH = "lib/lazy/web/web-lazy-loader-after.js";

	return { process };

	function process(options) {
		return new Promise(async resolve => {
			let timeoutId, srcAttributeChanged;
			const maxTimeoutId = await setTimeout(() => {
				clearTimeout(timeoutId);
				lazyLoadEnd(maxTimeoutId, idleTimeoutId, observer, options, resolve);
			}, options.maxLazyLoadImagesIdleTime * 5);
			const observer = new MutationObserver(async mutations => {
				mutations = mutations.filter(mutation => mutation.type == ATTRIBUTES_MUTATION_TYPE);
				if (mutations.length) {
					const updated = mutations.filter(mutation => {
						if (mutation.attributeName == "src") {
							mutation.target.setAttribute("data-lazy-loaded-src", mutation.target.src);
						}
						return mutation.attributeName != "data-lazy-loaded-src";
					});
					if (updated.length) {
						srcAttributeChanged = true;
						timeoutId = await deferLazyLoadEnd(timeoutId, maxTimeoutId, idleTimeoutId, observer, options, resolve);
					}
				}
			});
			observer.observe(document, { subtree: true, childList: true, attributes: true });
			const idleTimeoutId = await setTimeout(() => {
				if (!srcAttributeChanged) {
					clearTimeout(timeoutId);
					lazyLoadEnd(maxTimeoutId, idleTimeoutId, observer, options, resolve);
				}
			}, options.maxLazyLoadImagesIdleTime * 1.2);
			injectScript(SCRIPT_BEFORE_PATH);
		});
	}

	async function deferLazyLoadEnd(timeoutId, maxTimeoutId, idleTimeoutId, observer, options, resolve) {
		await clearTimeout(timeoutId);
		return await setTimeout(async () => await lazyLoadEnd(maxTimeoutId, idleTimeoutId, observer, options, resolve), options.maxLazyLoadImagesIdleTime);
	}

	async function lazyLoadEnd(maxTimeoutId, idleTimeoutId, observer, options, resolve) {
		await clearTimeout(idleTimeoutId);
		injectScript(SCRIPT_AFTER_PATH);
		await setTimeout(resolve, 100);
		observer.disconnect();
	}

	function injectScript(path) {
		const scriptElement = document.createElement(SCRIPT_TAG_NAME);
		scriptElement.src = browser.runtime.getURL(path);
		document.body.appendChild(scriptElement);
		scriptElement.onload = () => scriptElement.remove();
	}

	async function setTimeout(callback, delay) {
		const timeoutId = await browser.runtime.sendMessage({ setTimeoutRequest: true, delay });
		const timeoutCallback = message => {
			if (message.onTimeout && message.id == timeoutId) {
				browser.runtime.onMessage.removeListener(timeoutCallback);
				callback();
			}
		};
		browser.runtime.onMessage.addListener(timeoutCallback);
		return timeoutId;
	}

	async function clearTimeout(timeoutId) {
		await browser.runtime.sendMessage({ clearTimeout: true, id: timeoutId });
	}

})();