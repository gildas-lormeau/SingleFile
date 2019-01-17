/*
 * Copyright 2010-2019 Gildas Lormeau
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

/* global browser, document, MutationObserver, setTimeout, clearTimeout, lazyLoader */

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
			setAsyncTimeout(() => {
				clearAsyncTimeout(timeoutId);
				lazyLoadEnd(idleTimeoutId, observer, resolve);
			}, options.loadDeferredImagesMaxIdleTime * 5);
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
			const idleTimeoutId = await setAsyncTimeout(() => {
				if (!srcAttributeChanged) {
					clearAsyncTimeout(timeoutId);
					lazyLoadEnd(idleTimeoutId, observer, resolve);
				}
			}, options.loadDeferredImagesMaxIdleTime * 1.2);
			injectScript(SCRIPT_BEFORE_PATH);
		});
	}

	async function deferLazyLoadEnd(timeoutId, idleTimeoutId, observer, options, resolve) {
		await clearAsyncTimeout(timeoutId);
		return setAsyncTimeout(async () => await lazyLoadEnd(idleTimeoutId, observer, resolve), options.loadDeferredImagesMaxIdleTime);
	}

	function lazyLoadEnd(idleTimeoutId, observer, resolve) {
		clearAsyncTimeout(idleTimeoutId);
		injectScript(SCRIPT_AFTER_PATH);
		setAsyncTimeout(resolve, 100);
		observer.disconnect();
	}

	function injectScript(path) {
		const scriptElement = document.createElement(SCRIPT_TAG_NAME);
		if (lazyLoader.getScriptPath) {
			scriptElement.src = lazyLoader.getScriptPath(path);
		} else {
			debugger
			scriptElement.textContent = lazyLoader.getScriptContent(path);
		}
		(document.documentElement || document).appendChild(scriptElement);
		scriptElement.onload = () => scriptElement.remove();
	}

	async function setAsyncTimeout(callback, delay) {
		if (this.browser && browser.runtime && browser.runtime.sendMessage) {
			const timeoutId = await browser.runtime.sendMessage({ setTimeoutRequest: true, delay });
			const timeoutCallback = message => {
				if (message.onTimeout && message.id == timeoutId) {
					browser.runtime.onMessage.removeListener(timeoutCallback);
					callback();
				}
			};
			browser.runtime.onMessage.addListener(timeoutCallback);
			return timeoutId;
		} else {
			return setTimeout(callback, delay);
		}
	}

	async function clearAsyncTimeout(timeoutId) {
		if (this.browser && browser && browser.runtime && browser.runtime.sendMessage) {
			await browser.runtime.sendMessage({ clearTimeout: true, id: timeoutId });
		} else {
			return clearTimeout(timeoutId);
		}
	}

})();