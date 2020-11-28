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
	const timeouts = new Map();

	if (browser && browser.runtime) {
		browser.runtime.onMessage.addListener(message => {
			if (message.method == "singlefile.lazyTimeout.onTimeout") {
				const timeoutData = timeouts.get(message.type);
				if (timeoutData) {
					timeouts.delete(message.type);
					timeoutData.callback();
				}
			}
		});
	}

	return {
		process: async options => {
			if (document.documentElement) {
				timeouts.clear();
				const maxScrollY = Math.max(document.documentElement.scrollHeight - (document.documentElement.clientHeight * 1.5), 0);
				const maxScrollX = Math.max(document.documentElement.scrollWidth - (document.documentElement.clientWidth * 1.5), 0);
				if (window.scrollY <= maxScrollY && window.scrollX <= maxScrollX) {
					return process(options);
				}
			}
		},
		resetZoomLevel: options => {
			const frames = singlefile.lib.processors.hooks.content.frames;
			if (frames) {
				frames.loadDeferredImagesResetZoomLevel(options);
			}
		}
	};

	function process(options) {
		const frames = singlefile.lib.processors.hooks.content.frames;
		return new Promise(async resolve => { // eslint-disable-line  no-async-promise-executor
			let loadingImages;
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
						await deferForceLazyLoadEnd(observer, options, cleanupAndResolve);
						if (!pendingImages.size) {
							await deferLazyLoadEnd(observer, options, cleanupAndResolve);
						}
					}
				}
			});
			await setAsyncTimeout("idleTimeout", () => {
				if (!loadingImages) {
					clearAsyncTimeout("loadTimeout");
					clearAsyncTimeout("maxTimeout");
					lazyLoadEnd(observer, options, cleanupAndResolve);
				}
			}, options.loadDeferredImagesMaxIdleTime * 2);
			await deferForceLazyLoadEnd(observer, options, cleanupAndResolve);
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
				await deferForceLazyLoadEnd(observer, options, cleanupAndResolve);
				await deferLazyLoadEnd(observer, options, cleanupAndResolve);
				if (event.detail) {
					pendingImages.add(event.detail);
				}
			}

			async function onImageLoadedEvent(event) {
				await deferForceLazyLoadEnd(observer, options, cleanupAndResolve);
				await deferLazyLoadEnd(observer, options, cleanupAndResolve);
				pendingImages.delete(event.detail);
				if (!pendingImages.size) {
					await deferLazyLoadEnd(observer, options, cleanupAndResolve);
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

	async function deferLazyLoadEnd(observer, options, resolve) {
		await setAsyncTimeout("loadTimeout", () => lazyLoadEnd(observer, options, resolve), options.loadDeferredImagesMaxIdleTime);
	}

	async function deferForceLazyLoadEnd(observer, options, resolve) {
		await setAsyncTimeout("maxTimeout", async () => {
			await clearAsyncTimeout("loadTimeout");
			await lazyLoadEnd(observer, options, resolve);
		}, options.loadDeferredImagesMaxIdleTime * 10);
	}

	async function lazyLoadEnd(observer, options, resolve) {
		await clearAsyncTimeout("idleTimeout");
		if (singlefile.lib.processors.hooks.content.frames) {
			singlefile.lib.processors.hooks.content.frames.loadDeferredImagesEnd(options);
		}
		await setAsyncTimeout("endTimeout", async () => {
			await clearAsyncTimeout("maxTimeout");
			resolve();
		}, options.loadDeferredImagesMaxIdleTime / 2);
		observer.disconnect();
	}

	async function setAsyncTimeout(type, callback, delay) {
		if (browser && browser.runtime && browser.runtime.sendMessage) {
			if (!timeouts.get(type) || !timeouts.get(type).pending) {
				const timeoutData = { callback, pending: true };
				timeouts.set(type, timeoutData);
				await browser.runtime.sendMessage({ method: "singlefile.lazyTimeout.setTimeout", type, delay });
				timeoutData.pending = false;
			}
		} else {
			const timeoutId = timeouts.get(type);
			if (timeoutId) {
				window.clearTimeout(timeoutId);
			}
			timeouts.set(type, callback);
			window.setTimeout(callback, delay);
		}
	}

	async function clearAsyncTimeout(type) {
		if (browser && browser.runtime && browser.runtime.sendMessage) {
			await browser.runtime.sendMessage({ method: "singlefile.lazyTimeout.clearTimeout", type });
		} else {
			const previousTimeoutId = timeouts.get(type);
			timeouts.delete(type);
			if (previousTimeoutId) {
				window.clearTimeout(previousTimeoutId);
			}
		}
	}

})();