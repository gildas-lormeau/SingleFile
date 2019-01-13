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

/* global window, addEventListener, dispatchEvent, CustomEvent, document, HTMLDocument, FileReader, Blob */

this.hooksFrame = this.hooksFrame || (() => {

	const NEW_FONT_FACE_EVENT = "single-file-new-font-face";
	const fontFaces = [];

	if (document instanceof HTMLDocument) {
		const scriptElement = document.createElement("script");
		scriptElement.textContent = `(${hook.toString()})()`;
		document.appendChild(scriptElement);
		scriptElement.remove();
		addEventListener(NEW_FONT_FACE_EVENT, event => fontFaces.push(event.detail));
	}

	return {
		getFontsData: () => fontFaces
	};

	function hook() {
		const NEW_FONT_FACE_EVENT = "single-file-new-font-face";
		const LOAD_OBSERVED_ELEMENTS_EVENT = "single-file-load-observed-elements";
		const FONT_STYLE_PROPERTIES = {
			family: "font-family",
			style: "font-style",
			weight: "font-weight",
			stretch: "font-stretch",
			unicodeRange: "unicode-range",
			variant: "font-variant",
			featureSettings: "font-feature-settings"
		};

		const FontFace = window.FontFace;
		let warningFontFaceDisplayed;
		window.__defineGetter__("FontFace", () => new Proxy(FontFace, {
			construct(FontFace, argumentsList) {
				if (!warningFontFaceDisplayed) {
					console.warn("SingleFile is hooking the FontFace constructor to get font URLs."); // eslint-disable-line no-console
				}
				const detail = {};
				detail["font-family"] = argumentsList[0];
				detail.src = argumentsList[1];
				const descriptors = argumentsList[2];
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
				return new FontFace(...argumentsList);
			}
		}));

		if (window.IntersectionObserver) {
			const IntersectionObserver = window.IntersectionObserver;
			const observeIntersection = IntersectionObserver.prototype.observe;
			const unobserveIntersection = IntersectionObserver.prototype.unobserve;
			const observedElements = new Map();
			const observers = new Map();
			let warningIntersectionObserverDisplayed;
			window.__defineGetter__("IntersectionObserver", () => new Proxy(IntersectionObserver, {
				construct(IntersectionObserver, argumentsList) {
					if (!warningIntersectionObserverDisplayed) {
						console.warn("SingleFile is hooking the IntersectionObserver API to detect and load deferred images."); // eslint-disable-line no-console
					}
					const intersectionObserver = new IntersectionObserver(...argumentsList);
					const callback = argumentsList[0];
					const options = argumentsList[1];
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
				}
			}));
			window.__defineSetter__("IntersectionObserver", () => { });
			addEventListener(LOAD_OBSERVED_ELEMENTS_EVENT, () => {
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
			}, false);
		}
	}

})();