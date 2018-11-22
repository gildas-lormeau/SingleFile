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
	const SINGLE_FILE_UI_ELEMENT_CLASS = "single-file-ui-element";
	const LAZY_SRC_ATTRIBUTE_NAME = "data-lazy-loaded-src";

	return { process };

	function process(options) {
		return new Promise(async resolve => {
			let timeoutId, srcAttributeChanged;
			setTimeout(() => {
				clearTimeout(timeoutId);
				lazyLoadEnd(idleTimeoutId, observer, resolve);
			}, options.maxLazyLoadImagesIdleTime * 5);
			const observer = new MutationObserver(async mutations => {
				mutations = mutations.filter(mutation => mutation.type == ATTRIBUTES_MUTATION_TYPE);
				if (mutations.length) {
					const updated = mutations.filter(mutation => {
						if (mutation.attributeName == "src") {
							mutation.target.setAttribute(LAZY_SRC_ATTRIBUTE_NAME, mutation.target.src);
						}
						if (mutation.attributeName == "src" || mutation.attributeName == "srcset" || mutation.target.tagName == "SOURCE") {
							return mutation.target.className != SINGLE_FILE_UI_ELEMENT_CLASS;
						}
					});
					if (updated.length) {
						srcAttributeChanged = true;
						timeoutId = await deferLazyLoadEnd(timeoutId, idleTimeoutId, observer, options, resolve);
					}
				}
			});
			observer.observe(document, { subtree: true, childList: true, attributes: true });
			const idleTimeoutId = await setTimeout(() => {
				if (!srcAttributeChanged) {
					clearTimeout(timeoutId);
					lazyLoadEnd(idleTimeoutId, observer, resolve);
				}
			}, options.maxLazyLoadImagesIdleTime * 1.2);
			injectScript(SCRIPT_BEFORE_PATH);
		});
	}

	async function deferLazyLoadEnd(timeoutId, idleTimeoutId, observer, options, resolve) {
		await clearTimeout(timeoutId);
		return await setTimeout(async () => await lazyLoadEnd(idleTimeoutId, observer, resolve), options.maxLazyLoadImagesIdleTime);
	}

	function lazyLoadEnd(idleTimeoutId, observer, resolve) {
		clearTimeout(idleTimeoutId);
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