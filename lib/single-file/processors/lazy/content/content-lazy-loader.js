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

/* global window */

this.singlefile.lib.processors.lazy.content.loader = this.singlefile.lib.processors.lazy.content.loader || (() => {

	const ATTRIBUTES_MUTATION_TYPE = "attributes";

	const singlefile = this.singlefile;
	const browser = this.browser;
	const document = window.document;
	const MutationObserver = window.MutationObserver;
	const addEventListener = (type, listener, options) => window.addEventListener(type, listener, options);
	const removeEventListener = (type, listener, options) => window.removeEventListener(type, listener, options);

	return {
		process: async options => {
			if (document.documentElement) {
				const maxScrollY = Math.max(document.documentElement.scrollHeight - (document.documentElement.clientHeight * 1.5), 0);
				const maxScrollX = Math.max(document.documentElement.scrollWidth - (document.documentElement.clientWidth * 1.5), 0);
				if (window.scrollY <= maxScrollY && window.scrollX <= maxScrollX) {
					return process(options);
				}
			}
		},
		resetZoomLevel: () => {
			const frames = singlefile.lib.processors.hooks.content.frames;
			if (frames) {
				frames.loadDeferredImagesResetZoomLevel();
			}
		}
	};

	function process(options) {
		const frames = singlefile.lib.processors.hooks.content.frames;
		return new Promise(async resolve => { // eslint-disable-line  no-async-promise-executor
			let timeoutId, idleTimeoutId, maxTimeoutId, loadingImages;
			const pendingImages = new Set();
			const observer = new MutationObserver(async mutations => {
				mutations = mutations.filter(mutation => mutation.type == ATTRIBUTES_MUTATION_TYPE);
				if (mutations.length) {
					const updated = mutations.filter(mutation => {
						if (mutation.attributeName == "src") {
							mutation.target.setAttribute(singlefile.lib.helper.LAZY_SRC_ATTRIBUTE_NAME, mutation.target.src);
							mutation.target.addEventListener("load", onResourceLoad);
						}
						if (mutation.attributeName == "src" || mutation.attributeName == "srcset" || mutation.target.tagName == "SOURCE") {
							return !mutation.target.classList || !mutation.target.classList.contains(singlefile.lib.helper.SINGLE_FILE_UI_ELEMENT_CLASS);
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
			if (frames) {
				addEventListener(frames.LOAD_IMAGE_EVENT, onImageLoadEvent);
				addEventListener(frames.IMAGE_LOADED_EVENT, onImageLoadedEvent);
				frames.loadDeferredImagesStart(options);
			}

			function onResourceLoad(event) {
				const element = event.target;
				element.removeAttribute(singlefile.lib.helper.LAZY_SRC_ATTRIBUTE_NAME);
				element.removeEventListener("load", onResourceLoad);
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
				if (frames) {
					removeEventListener(frames.LOAD_IMAGE_EVENT, onImageLoadEvent);
					removeEventListener(frames.IMAGE_LOADED_EVENT, onImageLoadedEvent);
				}
				resolve(value);
			}
		});
	}

	async function deferLazyLoadEnd(timeoutId, idleTimeoutId, observer, options, resolve) {
		await clearAsyncTimeout(timeoutId);
		return setAsyncTimeout(() => lazyLoadEnd(idleTimeoutId, observer, options, resolve), options.loadDeferredImagesMaxIdleTime);
	}

	function deferForceLazyLoadEnd(timeoutId, idleTimeoutId, maxTimeoutId, observer, options, resolve) {
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
		setAsyncTimeout(resolve, options.loadDeferredImagesMaxIdleTime / 2);
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
			return window.setTimeout(callback, delay);
		}
	}

	async function clearAsyncTimeout(timeoutId) {
		if (browser && browser.runtime && browser.runtime.sendMessage) {
			await browser.runtime.sendMessage({ method: "singlefile.lazyTimeout.clearTimeout", id: timeoutId });
		} else {
			return window.clearTimeout(timeoutId);
		}
	}

})();