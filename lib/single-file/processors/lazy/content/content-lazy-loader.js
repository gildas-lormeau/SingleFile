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

/* global window, scrollY, scrollX */

this.singlefile.lib.processors.lazy.content.loader = this.singlefile.lib.processors.lazy.content.loader || (() => {

	const ATTRIBUTES_MUTATION_TYPE = "attributes";
	const SINGLE_FILE_UI_ELEMENT_CLASS = "single-file-ui-element";

	const singlefile = this.singlefile;
	const browser = this.browser;
	const document = window.document;
	const MutationObserver = window.MutationObserver;
	const setTimeout = window.setTimeout;
	const clearTimeout = window.clearTimeout;
	const addEventListener = window.addEventListener;
	const removeEventListener = window.removeEventListener;

	return {
		process: async options => {
			const maxScrollY = Math.max(document.documentElement.scrollHeight - (document.documentElement.clientHeight * 1.5), 0);
			const maxScrollX = Math.max(document.documentElement.scrollWidth - (document.documentElement.clientWidth * 1.5), 0);
			if (scrollY <= maxScrollY && scrollX <= maxScrollX) {
				return process(options);
			}
		}
	};

	function process(options) {
		const frames = singlefile.lib.processors.hooks.content.frames;
		return new Promise(async resolve => {
			let timeoutId, idleTimeoutId, maxTimeoutId, loadingImages;
			const pendingImages = new Set();
			const observer = new MutationObserver(async mutations => {
				mutations = mutations.filter(mutation => mutation.type == ATTRIBUTES_MUTATION_TYPE);
				if (mutations.length) {
					const updated = mutations.filter(mutation => {
						if (mutation.attributeName == "src") {
							mutation.target.setAttribute(singlefile.lib.helper.LAZY_SRC_ATTRIBUTE_NAME, mutation.target.src);
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
					lazyLoadEnd(idleTimeoutId, observer, options, cleanupAndResolve);
				}
			}, options.loadDeferredImagesMaxIdleTime * 1.2);
			maxTimeoutId = await deferForceLazyLoadEnd(timeoutId, idleTimeoutId, maxTimeoutId, observer, options, cleanupAndResolve);
			observer.observe(document, { subtree: true, childList: true, attributes: true });
			addEventListener.call(window, frames.LOAD_IMAGE_EVENT, onImageLoadEvent);
			addEventListener.call(window, frames.IMAGE_LOADED_EVENT, onImageLoadedEvent);
			if (frames) {
				frames.loadDeferredImagesStart(options);
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
				removeEventListener.call(window, frames.LOAD_IMAGE_EVENT, onImageLoadEvent);
				removeEventListener.call(window, frames.IMAGE_LOADED_EVENT, onImageLoadedEvent);
				resolve(value);
			}
		});
	}

	async function deferLazyLoadEnd(timeoutId, idleTimeoutId, observer, options, resolve) {
		await clearAsyncTimeout(timeoutId);
		return setAsyncTimeout(async () => await lazyLoadEnd(idleTimeoutId, observer, options, resolve), options.loadDeferredImagesMaxIdleTime);
	}

	async function deferForceLazyLoadEnd(timeoutId, idleTimeoutId, maxTimeoutId, observer, options, resolve) {
		clearAsyncTimeout(maxTimeoutId);
		return setAsyncTimeout(() => {
			clearAsyncTimeout(timeoutId);
			lazyLoadEnd(idleTimeoutId, observer, options, resolve);
		}, options.loadDeferredImagesMaxIdleTime * 10);
	}

	function lazyLoadEnd(idleTimeoutId, observer, options, resolve) {
		clearAsyncTimeout(idleTimeoutId);
		if (singlefile.lib.processors.hooks.content.frames) {
			singlefile.lib.processors.hooks.content.frames.loadDeferredImagesEnd(options);
		}
		setAsyncTimeout(resolve, 100);
		observer.disconnect();
	}

	async function setAsyncTimeout(callback, delay) {
		if (browser && browser.runtime && browser.runtime.sendMessage) {
			const timeoutId = await browser.runtime.sendMessage({ method: "singlefile.lazyTimeout.setTimeout", delay });
			const timeoutCallback = message => {
				if (message.method == "singlefile.lazyTimeout.onTimeout" && message.id == timeoutId) {
					browser.runtime.onMessage.removeListener(timeoutCallback);
					callback();
					return Promise.resolve({});
				}
			};
			browser.runtime.onMessage.addListener(timeoutCallback);
			return timeoutId;
		} else {
			return setTimeout.call(window, callback, delay);
		}
	}

	async function clearAsyncTimeout(timeoutId) {
		if (browser && browser.runtime && browser.runtime.sendMessage) {
			await browser.runtime.sendMessage({ method: "singlefile.lazyTimeout.clearTimeout", id: timeoutId });
		} else {
			return clearTimeout.call(window, timeoutId);
		}
	}

})();