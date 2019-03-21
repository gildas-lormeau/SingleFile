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

/* global browser, document, MutationObserver, setTimeout, clearTimeout, hooksFrame, addEventListener, removeEventListener, scrollY, scrollX */

this.lazyLoader = this.lazyLoader || (() => {

	const ATTRIBUTES_MUTATION_TYPE = "attributes";
	const SINGLE_FILE_UI_ELEMENT_CLASS = "single-file-ui-element";
	const LAZY_SRC_ATTRIBUTE_NAME = "data-lazy-loaded-src";

	return {
		process: options => {
			const clientHeight = document.documentElement.clientHeight;
			const clientWidth = document.documentElement.clientWidth;
			const scrollHeight = Math.max(document.documentElement.scrollHeight - (clientHeight * 1.5), 0);
			const scrollWidth = Math.max(document.documentElement.scrollWidth - (clientWidth * 1.5), 0);
			if (scrollY <= scrollHeight && scrollX <= scrollWidth) {
				return process(options);
			} else {
				return Promise.resolve();
			}
		}
	};

	function process(options) {
		return new Promise(async resolve => {
			let timeoutId, idleTimeoutId, maxTimeoutId, loadingImages;
			const pendingImages = new Set();
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
						loadingImages = true;
						maxTimeoutId = await deferForceLazyLoadEnd(timeoutId, idleTimeoutId, maxTimeoutId, observer, options, cleanupAndResolve);
						if (!pendingImages.size) {
							timeoutId = await deferLazyLoadEnd(timeoutId, idleTimeoutId, observer, options, cleanupAndResolve);
						}
					}
				}
			});
			idleTimeoutId = await setAsyncTimeout(() => {
				if (!loadingImages) {
					clearAsyncTimeout(timeoutId);
					lazyLoadEnd(idleTimeoutId, observer, cleanupAndResolve);
				}
			}, options.loadDeferredImagesMaxIdleTime * 1.2);
			maxTimeoutId = await deferForceLazyLoadEnd(timeoutId, idleTimeoutId, maxTimeoutId, observer, options, cleanupAndResolve);
			observer.observe(document, { subtree: true, childList: true, attributes: true });
			addEventListener(hooksFrame.LOAD_IMAGE_EVENT, onImageLoadEvent);
			addEventListener(hooksFrame.IMAGE_LOADED_EVENT, onImageLoadedEvent);
			if (typeof hooksFrame != "undefined") {
				hooksFrame.loadDeferredImagesStart();
			}

			async function onImageLoadEvent(event) {
				loadingImages = true;
				maxTimeoutId = await deferForceLazyLoadEnd(timeoutId, idleTimeoutId, maxTimeoutId, observer, options, cleanupAndResolve);
				if (event.detail) {
					pendingImages.add(event.detail);
				}
			}

			async function onImageLoadedEvent(event) {
				maxTimeoutId = await deferForceLazyLoadEnd(timeoutId, idleTimeoutId, maxTimeoutId, observer, options, cleanupAndResolve);
				pendingImages.delete(event.detail);
				if (!pendingImages.size) {
					timeoutId = await deferLazyLoadEnd(timeoutId, idleTimeoutId, observer, options, cleanupAndResolve);
				}
			}

			function cleanupAndResolve(value) {
				observer.disconnect();
				removeEventListener(hooksFrame.LOAD_IMAGE_EVENT, onImageLoadEvent);
				removeEventListener(hooksFrame.IMAGE_LOADED_EVENT, onImageLoadedEvent);
				resolve(value);
			}
		});
	}

	async function deferLazyLoadEnd(timeoutId, idleTimeoutId, observer, options, resolve) {
		await clearAsyncTimeout(timeoutId);
		return setAsyncTimeout(async () => await lazyLoadEnd(idleTimeoutId, observer, resolve), options.loadDeferredImagesMaxIdleTime);
	}

	async function deferForceLazyLoadEnd(timeoutId, idleTimeoutId, maxTimeoutId, observer, options, resolve) {
		clearAsyncTimeout(maxTimeoutId);
		return setAsyncTimeout(() => {
			clearAsyncTimeout(timeoutId);
			lazyLoadEnd(idleTimeoutId, observer, resolve);
		}, options.loadDeferredImagesMaxIdleTime * 10);
	}

	function lazyLoadEnd(idleTimeoutId, observer, resolve) {
		clearAsyncTimeout(idleTimeoutId);
		if (typeof hooksFrame != "undefined") {
			hooksFrame.loadDeferredImagesEnd();
		}
		setAsyncTimeout(resolve, 100);
		observer.disconnect();
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