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

/* global window, addEventListener, dispatchEvent, CustomEvent, document, screen, Element, UIEvent, FileReader, Blob */

(() => {

	// debugger

	const LOAD_DEFERRED_IMAGES_START_EVENT = "single-file-load-deferred-images-start";
	const LOAD_DEFERRED_IMAGES_END_EVENT = "single-file-load-deferred-images-end";
	const LOAD_IMAGE_EVENT = "single-file-load-image";
	const IMAGE_LOADED_EVENT = "single-file-image-loaded";
	const NEW_FONT_FACE_EVENT = "single-file-new-font-face";
	const FONT_STYLE_PROPERTIES = {
		family: "font-family",
		style: "font-style",
		weight: "font-weight",
		stretch: "font-stretch",
		unicodeRange: "unicode-range",
		variant: "font-variant",
		featureSettings: "font-feature-settings"
	};

	const requestAnimationFrame = window.requestAnimationFrame;
	const cancelAnimationFrame = window.cancelAnimationFrame;
	const observers = new Map();
	const observedElements = new Map();
	let loadDeferredImages;

	addEventListener(LOAD_DEFERRED_IMAGES_START_EVENT, () => {
		const clientHeight = document.documentElement.clientHeight;
		const clientWidth = document.documentElement.clientWidth;
		const scrollHeight = Math.max(document.documentElement.scrollHeight - (clientHeight * .5), clientHeight);
		const scrollWidth = Math.max(document.documentElement.scrollWidth - (clientWidth * .5), clientWidth);
		document.documentElement.__defineGetter__("clientHeight", () => scrollHeight);
		document.documentElement.__defineGetter__("clientWidth", () => scrollWidth);
		screen.__defineGetter__("height", () => scrollHeight);
		screen.__defineGetter__("width", () => scrollWidth);
		try {
			document.__defineGetter__("cookie", () => { throw new Error("document.cookie temporary blocked by SingleFile"); });
		} catch (error) {
			// ignored
		}
		if (!window._singleFile_getBoundingClientRect) {
			window._singleFile_getBoundingClientRect = Element.prototype.getBoundingClientRect;
			Element.prototype.getBoundingClientRect = function () {
				const boundingRect = window._singleFile_getBoundingClientRect.call(this);
				if (this == document.documentElement) {
					boundingRect.__defineGetter__("height", () => scrollHeight);
					boundingRect.__defineGetter__("bottom", () => scrollHeight + boundingRect.top);
					boundingRect.__defineGetter__("width", () => scrollWidth);
					boundingRect.__defineGetter__("right", () => scrollWidth + boundingRect.left);
				}
				return boundingRect;
			};
			window._singleFile_innerHeight = window.innerHeight;
			window._singleFile_innerWidth = window.innerWidth;
			window.__defineGetter__("innerHeight", () => scrollHeight);
			window.__defineGetter__("innerWidth", () => scrollWidth);
		}
		if (!window._singleFile_localStorage) {
			window._singleFile_localStorage = window.localStorage;
			window.__defineGetter__("localStorage", () => { throw new Error("localStorage temporary blocked by SingleFile"); });
		}
		if (!window._singleFile_indexedDB) {
			window._singleFile_indexedDB = window.indexedDB;
			window.__defineGetter__("indexedDB", () => { throw new Error("indexedDB temporary blocked by SingleFile"); });
		}
		if (!window._singleFileImage) {
			const Image = window.Image;
			window._singleFileImage = window.Image;
			window.__defineGetter__("Image", function () {
				return function () {
					const image = new Image(...arguments);
					const result = new Image(...arguments);
					result.__defineSetter__("src", function (value) {
						image.src = value;
						dispatchEvent(new CustomEvent(LOAD_IMAGE_EVENT, { detail: image.src }));
					});
					result.__defineGetter__("src", function () {
						return image.src;
					});
					result.__defineSetter__("srcset", function (value) {
						dispatchEvent(new CustomEvent(LOAD_IMAGE_EVENT));
						image.srcset = value;
					});
					result.__defineGetter__("srcset", function () {
						return image.srcset;
					});
					image.onload = image.onloadend = image.onerror = event => {
						dispatchEvent(new CustomEvent(IMAGE_LOADED_EVENT, { detail: image.src }));
						result.dispatchEvent(new UIEvent(event.type, event));
					};
					return result;
				};
			});
		}
		const zoomFactorX = (clientHeight + window.scrollY) / scrollHeight;
		const zoomFactorY = (clientWidth + window.scrollX) / scrollWidth;
		const zoomFactor = Math.min(zoomFactorX, zoomFactorY);
		if (zoomFactor < 1) {
			const transform = document.documentElement.style.getPropertyValue("transform");
			const transformPriority = document.documentElement.style.getPropertyPriority("transform");
			const transformOrigin = document.documentElement.style.getPropertyValue("transform-origin");
			const transformOriginPriority = document.documentElement.style.getPropertyPriority("transform-origin");
			document.documentElement.style.setProperty("transform-origin", (zoomFactorX < 1 ? "50%" : "0") + " " + (zoomFactorY < 1 ? "50%" : "0") + " 0", "important");
			document.documentElement.style.setProperty("transform", "scale3d(" + zoomFactor + ", " + zoomFactor + ", 1)", "important");
			dispatchEvent(new UIEvent("resize"));
			dispatchEvent(new UIEvent("scroll"));
			document.documentElement.style.setProperty("transform", transform, transformPriority);
			document.documentElement.style.setProperty("transform-origin", transformOrigin, transformOriginPriority);
		}
		dispatchEvent(new UIEvent("resize"));
		dispatchEvent(new UIEvent("scroll"));
	});

	addEventListener(LOAD_DEFERRED_IMAGES_END_EVENT, () => {
		delete document.documentElement.clientHeight;
		delete document.documentElement.clientWidth;
		delete screen.height;
		delete screen.width;
		delete document.cookie;
		if (window._singleFile_getBoundingClientRect) {
			Element.prototype.getBoundingClientRect = window._singleFile_getBoundingClientRect;
			window.innerHeight = window._singleFile_innerHeight;
			window.innerWidth = window._singleFile_innerWidth;
			delete window._singleFile_getBoundingClientRect;
			delete window._singleFile_innerHeight;
			delete window._singleFile_innerWidth;
		}
		if (window._singleFile_localStorage) {
			delete window.localStorage;
			window.localStorage = window._singleFile_localStorage;
			delete window._singleFile_localStorage;
		}
		if (!window._singleFile_indexedDB) {
			delete window.indexedDB;
			window.indexedDB = window._singleFile_indexedDB;
			delete window._singleFile_indexedDB;
		}
		if (window._singleFileImage) {
			delete window.Image;
			window.Image = window._singleFileImage;
			delete window._singleFileImage;
		}
		dispatchEvent(new UIEvent("resize"));
		dispatchEvent(new UIEvent("scroll"));
	});

	addEventListener(LOAD_DEFERRED_IMAGES_START_EVENT, () => {
		loadDeferredImages = true;
		const docBoundingRect = document.documentElement.getBoundingClientRect();
		Array.from(observers).forEach(([intersectionObserver, observer]) => {
			const rootBoundingRect = observer.options.root && observer.options.root.getBoundingClientRect();
			observer.callback(observedElements.get(intersectionObserver).map(target => {
				const boundingClientRect = target.getBoundingClientRect();
				const isIntersecting = true;
				const intersectionRatio = 1;
				const rootBounds = observer.options && observer.options.root ? rootBoundingRect : docBoundingRect;
				const time = 0;
				return { target, intersectionRatio, boundingClientRect, intersectionRect: boundingClientRect, isIntersecting, rootBounds, time };
			}), intersectionObserver);
		});
		if (pendingRequestAnimationFrameCalls.size) {
			Array.from(pendingRequestAnimationFrameCalls).forEach(([id, callback]) => {
				cancelAnimationFrame(id);
				callback();
			});
		}
	});

	addEventListener(LOAD_DEFERRED_IMAGES_END_EVENT, () => {
		loadDeferredImages = false;
	});

	let warningRequestAnimationFrameDisplayed;
	const pendingRequestAnimationFrameCalls = new Map();
	let lastTimestamp = 0;
	let errorDetected;
	window.requestAnimationFrame = function (callback) {
		if (!warningRequestAnimationFrameDisplayed) {
			console.warn("SingleFile is hooking the requestAnimationFrame and cancelAnimationFrame functions to load deferred images."); // eslint-disable-line no-console
			warningRequestAnimationFrameDisplayed = true;
		}
		let requestId;
		if (loadDeferredImages && !errorDetected) {
			try {
				requestId = 0;
				callback(lastTimestamp);
			} catch (error) {
				errorDetected = true;
				requestId = requestAnimationFrame(timestamp => {
					lastTimestamp = timestamp;
					callback(timestamp);
				});
			}
		} else {
			if (!loadDeferredImages) {
				errorDetected = false;
			}
			requestId = requestAnimationFrame(timestamp => {
				pendingRequestAnimationFrameCalls.delete(requestId);
				lastTimestamp = timestamp;
				callback(timestamp);
			});
			pendingRequestAnimationFrameCalls.set(requestId, callback);
		}
		return requestId;
	};
	window.requestAnimationFrame.toString = function () { return "requestAnimationFrame() { [native code] }"; };

	window.cancelAnimationFrame = function (requestId) {
		pendingRequestAnimationFrameCalls.delete(requestId);
		return cancelAnimationFrame(requestId);
	};
	window.cancelAnimationFrame.toString = function () { return "cancelAnimationFrame() { [native code] }"; };

	if (window.FontFace) {
		const FontFace = window.FontFace;
		let warningFontFaceDisplayed;
		window.FontFace = function () {
			if (!warningFontFaceDisplayed) {
				console.warn("SingleFile is hooking the FontFace constructor to get font URLs."); // eslint-disable-line no-console
				warningFontFaceDisplayed = true;
			}
			const detail = {};
			detail["font-family"] = arguments[0];
			detail.src = arguments[1];
			const descriptors = arguments[2];
			if (descriptors) {
				Object.keys(descriptors).forEach(descriptor => {
					if (FONT_STYLE_PROPERTIES[descriptor]) {
						detail[FONT_STYLE_PROPERTIES[descriptor]] = descriptors[descriptor];
					}
				});
			}
			if (detail.src instanceof ArrayBuffer) {
				const reader = new FileReader();
				reader.readAsDataURL(new Blob([detail.src]));
				reader.addEventListener("load", () => {
					detail.src = "url(" + reader.result + ")";
					dispatchEvent(new CustomEvent(NEW_FONT_FACE_EVENT, { detail }));
				});
			} else {
				dispatchEvent(new CustomEvent(NEW_FONT_FACE_EVENT, { detail }));
			}
			return new FontFace(...arguments);
		};
		window.FontFace.toString = function () { return "function FontFace() { [native code]"; };
	}

	if (window.IntersectionObserver) {
		const IntersectionObserver = window.IntersectionObserver;
		const observeIntersection = IntersectionObserver.prototype.observe;
		const unobserveIntersection = IntersectionObserver.prototype.unobserve;
		let warningIntersectionObserverDisplayed;
		window.IntersectionObserver = function () {
			if (!warningIntersectionObserverDisplayed) {
				console.warn("SingleFile is hooking the IntersectionObserver API to detect and load deferred images."); // eslint-disable-line no-console
				warningIntersectionObserverDisplayed = true;
			}
			const intersectionObserver = new IntersectionObserver(...arguments);
			const callback = arguments[0];
			const options = arguments[1];
			intersectionObserver.observe = function (targetElement) {
				let targetElements = observedElements.get(intersectionObserver);
				if (!targetElements) {
					targetElements = [];
					observedElements.set(intersectionObserver, targetElements);
				}
				targetElements.push(targetElement);
				return observeIntersection.call(intersectionObserver, targetElement);
			};
			intersectionObserver.unobserve = function (targetElement) {
				let targetElements = observedElements.get(intersectionObserver);
				if (targetElements) {
					targetElements = targetElements.filter(element => element <= targetElement);
					if (targetElements.length) {
						observedElements.set(intersectionObserver, targetElements);
					} else {
						observedElements.delete(intersectionObserver);
					}
				}
				return unobserveIntersection.call(intersectionObserver, targetElement);
			};
			observers.set(intersectionObserver, { callback, options });
			return intersectionObserver;
		};
		window.IntersectionObserver.toString = function () { return "function IntersectionObserver() { [native code]"; };
	}

})();