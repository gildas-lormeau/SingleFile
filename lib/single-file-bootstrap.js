(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.singlefileBootstrap = {}));
})(this, (function (exports) { 'use strict';

	/*
	 * Copyright 2010-2022 Gildas Lormeau
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

	/* global globalThis, window */

	const LOAD_DEFERRED_IMAGES_START_EVENT = "single-file-load-deferred-images-start";
	const LOAD_DEFERRED_IMAGES_END_EVENT = "single-file-load-deferred-images-end";
	const LOAD_DEFERRED_IMAGES_KEEP_ZOOM_LEVEL_START_EVENT = "single-file-load-deferred-images-keep-zoom-level-start";
	const LOAD_DEFERRED_IMAGES_KEEP_ZOOM_LEVEL_END_EVENT = "single-file-load-deferred-images-keep-zoom-level-end";
	const BLOCK_COOKIES_START_EVENT = "single-file-block-cookies-start";
	const BLOCK_COOKIES_END_EVENT = "single-file-block-cookies-end";
	const DISPATCH_SCROLL_START_EVENT = "single-file-dispatch-scroll-event-start";
	const DISPATCH_SCROLL_END_EVENT = "single-file-dispatch-scroll-event-end";
	const BLOCK_STORAGE_START_EVENT = "single-file-block-storage-start";
	const BLOCK_STORAGE_END_EVENT = "single-file-block-storage-end";
	const LOAD_IMAGE_EVENT = "single-file-load-image";
	const IMAGE_LOADED_EVENT = "single-file-image-loaded";
	const NEW_FONT_FACE_EVENT = "single-file-new-font-face";
	const DELETE_FONT_EVENT = "single-file-delete-font";
	const CLEAR_FONTS_EVENT = "single-file-clear-fonts";
	const FONT_FACE_PROPERTY_NAME = "_singleFile_fontFaces";

	const CustomEvent$1 = globalThis.CustomEvent;
	const document$2 = globalThis.document;
	const Document = globalThis.Document;
	const JSON$2 = globalThis.JSON;
	const MutationObserver$3 = globalThis.MutationObserver;

	let fontFaces;
	if (window[FONT_FACE_PROPERTY_NAME]) {
		fontFaces = window[FONT_FACE_PROPERTY_NAME];
	} else {
		fontFaces = window[FONT_FACE_PROPERTY_NAME] = new Map();
	}

	init$1();
	new MutationObserver$3(init$1).observe(document$2, { childList: true });

	function init$1() {
		if (document$2 instanceof Document) {
			document$2.addEventListener(NEW_FONT_FACE_EVENT, event => {
				const detail = event.detail;
				const key = Object.assign({}, detail);
				delete key.src;
				fontFaces.set(JSON$2.stringify(key), detail);
			});
			document$2.addEventListener(DELETE_FONT_EVENT, event => {
				const detail = event.detail;
				const key = Object.assign({}, detail);
				delete key.src;
				fontFaces.delete(JSON$2.stringify(key));
			});
			document$2.addEventListener(CLEAR_FONTS_EVENT, () => fontFaces = new Map());
		}
	}

	function getFontsData$1() {
		return Array.from(fontFaces.values());
	}

	function loadDeferredImagesStart(options) {
		if (options.loadDeferredImagesBlockCookies) {
			document$2.dispatchEvent(new CustomEvent$1(BLOCK_COOKIES_START_EVENT));
		}
		if (options.loadDeferredImagesBlockStorage) {
			document$2.dispatchEvent(new CustomEvent$1(BLOCK_STORAGE_START_EVENT));
		}
		if (options.loadDeferredImagesDispatchScrollEvent) {
			document$2.dispatchEvent(new CustomEvent$1(DISPATCH_SCROLL_START_EVENT));
		}
		if (options.loadDeferredImagesKeepZoomLevel) {
			document$2.dispatchEvent(new CustomEvent$1(LOAD_DEFERRED_IMAGES_KEEP_ZOOM_LEVEL_START_EVENT));
		} else {
			document$2.dispatchEvent(new CustomEvent$1(LOAD_DEFERRED_IMAGES_START_EVENT));
		}
	}

	function loadDeferredImagesEnd(options) {
		if (options.loadDeferredImagesBlockCookies) {
			document$2.dispatchEvent(new CustomEvent$1(BLOCK_COOKIES_END_EVENT));
		}
		if (options.loadDeferredImagesBlockStorage) {
			document$2.dispatchEvent(new CustomEvent$1(BLOCK_STORAGE_END_EVENT));
		}
		if (options.loadDeferredImagesDispatchScrollEvent) {
			document$2.dispatchEvent(new CustomEvent$1(DISPATCH_SCROLL_END_EVENT));
		}
		if (options.loadDeferredImagesKeepZoomLevel) {
			document$2.dispatchEvent(new CustomEvent$1(LOAD_DEFERRED_IMAGES_KEEP_ZOOM_LEVEL_END_EVENT));
		} else {
			document$2.dispatchEvent(new CustomEvent$1(LOAD_DEFERRED_IMAGES_END_EVENT));
		}
	}

	/*
	 * The MIT License (MIT)
	 *
	 * Author: Gildas Lormeau
	 *
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in all
	 * copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	 * SOFTWARE.
	 */

	// derived from https://github.com/postcss/postcss-selector-parser/blob/master/src/util/unesc.js

	/*
	 * The MIT License (MIT)
	 * Copyright (c) Ben Briggs <beneb.info@gmail.com> (http://beneb.info)
	 *
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in
	 * all copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	 * THE SOFTWARE.
	 */

	const whitespace = "[\\x20\\t\\r\\n\\f]";
	const unescapeRegExp = new RegExp("\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig");

	function process$2(str) {
		return str.replace(unescapeRegExp, (_, escaped, escapedWhitespace) => {
			const high = "0x" + escaped - 0x10000;

			// NaN means non-codepoint
			// Workaround erroneous numeric interpretation of +"0x"
			// eslint-disable-next-line no-self-compare
			return high !== high || escapedWhitespace
				? escaped
				: high < 0
					? // BMP codepoint
					String.fromCharCode(high + 0x10000)
					: // Supplemental Plane codepoint (surrogate pair)
					String.fromCharCode((high >> 10) | 0xd800, (high & 0x3ff) | 0xdc00);
		});
	}

	const SINGLE_FILE_PREFIX = "single-file-";
	const COMMENT_HEADER = "Page saved with SingleFile";
	const WAIT_FOR_USERSCRIPT_PROPERTY_NAME = "_singleFile_waitForUserScript";
	const MESSAGE_PREFIX = "__frameTree__::";

	/*
	 * Copyright 2010-2022 Gildas Lormeau
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

	const INFOBAR_TAGNAME$1 = "single-file-infobar";

	/*
	 * Copyright 2010-2022 Gildas Lormeau
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

	const ON_BEFORE_CAPTURE_EVENT_NAME = SINGLE_FILE_PREFIX + "on-before-capture";
	const ON_AFTER_CAPTURE_EVENT_NAME = SINGLE_FILE_PREFIX + "on-after-capture";
	const GET_ADOPTED_STYLESHEETS_REQUEST_EVENT = SINGLE_FILE_PREFIX + "request-get-adopted-stylesheets";
	const GET_ADOPTED_STYLESHEETS_RESPONSE_EVENT = SINGLE_FILE_PREFIX + "response-get-adopted-stylesheets";
	const UNREGISTER_GET_ADOPTED_STYLESHEETS_REQUEST_EVENT = SINGLE_FILE_PREFIX + "unregister-request-get-adopted-stylesheets";
	const ON_INIT_USERSCRIPT_EVENT = SINGLE_FILE_PREFIX + "user-script-init";
	const REMOVED_CONTENT_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "removed-content";
	const HIDDEN_CONTENT_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "hidden-content";
	const KEPT_CONTENT_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "kept-content";
	const HIDDEN_FRAME_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "hidden-frame";
	const PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "preserved-space-element";
	const SHADOW_ROOT_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "shadow-root-element";
	const WIN_ID_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "win-id";
	const IMAGE_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "image";
	const POSTER_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "poster";
	const VIDEO_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "video";
	const CANVAS_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "canvas";
	const STYLE_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "movable-style";
	const INPUT_VALUE_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "input-value";
	const LAZY_SRC_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "lazy-loaded-src";
	const STYLESHEET_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "stylesheet";
	const DISABLED_NOSCRIPT_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "disabled-noscript";
	const INVALID_ELEMENT_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "invalid-element";
	const ASYNC_SCRIPT_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "async-script";
	const FLOW_ELEMENTS_SELECTOR = "*:not(base):not(link):not(meta):not(noscript):not(script):not(style):not(template):not(title)";
	const KEPT_TAG_NAMES = ["NOSCRIPT", "DISABLED-NOSCRIPT", "META", "LINK", "STYLE", "TITLE", "TEMPLATE", "SOURCE", "OBJECT", "SCRIPT", "HEAD", "BODY"];
	const IGNORED_TAG_NAMES = ["SCRIPT", "NOSCRIPT", "META", "LINK", "TEMPLATE"];
	const REGEXP_SIMPLE_QUOTES_STRING = /^'(.*?)'$/;
	const REGEXP_DOUBLE_QUOTES_STRING = /^"(.*?)"$/;
	const FONT_WEIGHTS = {
		regular: "400",
		normal: "400",
		bold: "700",
		bolder: "700",
		lighter: "100"
	};
	const COMMENT_HEADER_LEGACY = "Archive processed by SingleFile";
	const SINGLE_FILE_UI_ELEMENT_CLASS = "single-file-ui-element";
	const INFOBAR_TAGNAME = INFOBAR_TAGNAME$1;
	const EMPTY_RESOURCE = "data:,";
	const addEventListener = (type, listener, options) => globalThis.addEventListener(type, listener, options);
	const dispatchEvent = event => { try { globalThis.dispatchEvent(event); } catch (error) {  /* ignored */ } };
	const JSON$1 = globalThis.JSON;
	const CustomEvent = globalThis.CustomEvent;
	const MutationObserver$2 = globalThis.MutationObserver;

	function initUserScriptHandler() {
		addEventListener(ON_INIT_USERSCRIPT_EVENT, () => globalThis[WAIT_FOR_USERSCRIPT_PROPERTY_NAME] = async eventPrefixName => {
			const event = new CustomEvent(eventPrefixName + "-request", { cancelable: true });
			const promiseResponse = new Promise(resolve => addEventListener(eventPrefixName + "-response", resolve));
			dispatchEvent(event);
			if (event.defaultPrevented) {
				await promiseResponse;
			}
		});
		new MutationObserver$2(initUserScriptHandler).observe(globalThis.document, { childList: true });
	}

	function initDoc(doc) {
		doc.querySelectorAll("meta[http-equiv=refresh]").forEach(element => {
			element.removeAttribute("http-equiv");
			element.setAttribute("disabled-http-equiv", "refresh");
		});
	}

	function preProcessDoc(doc, win, options) {
		doc.querySelectorAll("noscript:not([" + DISABLED_NOSCRIPT_ATTRIBUTE_NAME + "])").forEach(element => {
			element.setAttribute(DISABLED_NOSCRIPT_ATTRIBUTE_NAME, element.textContent);
			element.textContent = "";
		});
		initDoc(doc);
		if (doc.head) {
			doc.head.querySelectorAll(FLOW_ELEMENTS_SELECTOR).forEach(element => element.hidden = true);
		}
		doc.querySelectorAll("svg foreignObject").forEach(element => {
			const flowElements = element.querySelectorAll("html > head > " + FLOW_ELEMENTS_SELECTOR + ", html > body > " + FLOW_ELEMENTS_SELECTOR);
			if (flowElements.length) {
				Array.from(element.childNodes).forEach(node => node.remove());
				flowElements.forEach(flowElement => element.appendChild(flowElement));
			}
		});
		const invalidElements = new Map();
		let elementsInfo;
		if (win && doc.documentElement) {
			doc.querySelectorAll("button button, a a").forEach(element => {
				const placeHolderElement = doc.createElement("template");
				placeHolderElement.setAttribute(INVALID_ELEMENT_ATTRIBUTE_NAME, "");
				placeHolderElement.content.appendChild(element.cloneNode(true));
				invalidElements.set(element, placeHolderElement);
				element.replaceWith(placeHolderElement);
			});
			elementsInfo = getElementsInfo(win, doc, doc.documentElement, options);
			if (options.moveStylesInHead) {
				doc.querySelectorAll("body style, body ~ style").forEach(element => {
					const computedStyle = getComputedStyle(win, element);
					if (computedStyle && testHiddenElement(element, computedStyle)) {
						element.setAttribute(STYLE_ATTRIBUTE_NAME, "");
						elementsInfo.markedElements.push(element);
					}
				});
			}
		} else {
			elementsInfo = {
				canvases: [],
				images: [],
				posters: [],
				videos: [],
				usedFonts: [],
				shadowRoots: [],
				markedElements: []
			};
		}
		return {
			canvases: elementsInfo.canvases,
			fonts: getFontsData(),
			stylesheets: getStylesheetsData(doc),
			images: elementsInfo.images,
			posters: elementsInfo.posters,
			videos: elementsInfo.videos,
			usedFonts: Array.from(elementsInfo.usedFonts.values()),
			shadowRoots: elementsInfo.shadowRoots,
			referrer: doc.referrer,
			markedElements: elementsInfo.markedElements,
			invalidElements,
			scrollPosition: { x: win.scrollX, y: win.scrollY },
			adoptedStyleSheets: getStylesheetsContent(doc.adoptedStyleSheets)
		};
	}

	function getElementsInfo(win, doc, element, options, data = { usedFonts: new Map(), canvases: [], images: [], posters: [], videos: [], shadowRoots: [], markedElements: [] }, ascendantHidden) {
		if (element.childNodes) {
			const elements = Array.from(element.childNodes).filter(node => (node instanceof win.HTMLElement) || (node instanceof win.SVGElement) || (node instanceof globalThis.HTMLElement) || (node instanceof globalThis.SVGElement));
			elements.forEach(element => {
				let elementHidden, elementKept, computedStyle;
				if (!options.autoSaveExternalSave && (options.removeHiddenElements || options.removeUnusedFonts || options.compressHTML)) {
					computedStyle = getComputedStyle(win, element);
					if ((element instanceof win.HTMLElement) || (element instanceof globalThis.HTMLElement)) {
						if (options.removeHiddenElements) {
							elementKept = ((ascendantHidden || element.closest("html > head")) && KEPT_TAG_NAMES.includes(element.tagName.toUpperCase())) || element.closest("details");
							if (!elementKept) {
								elementHidden = ascendantHidden || testHiddenElement(element, computedStyle);
								if (elementHidden && !IGNORED_TAG_NAMES.includes(element.tagName.toUpperCase())) {
									element.setAttribute(HIDDEN_CONTENT_ATTRIBUTE_NAME, "");
									data.markedElements.push(element);
								}
							}
						}
					}
					if (!elementHidden) {
						if (options.compressHTML && computedStyle) {
							const whiteSpace = computedStyle.getPropertyValue("white-space");
							if (whiteSpace && whiteSpace.startsWith("pre")) {
								element.setAttribute(PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME, "");
								data.markedElements.push(element);
							}
						}
						if (options.removeUnusedFonts) {
							getUsedFont(computedStyle, options, data.usedFonts);
							getUsedFont(getComputedStyle(win, element, ":first-letter"), options, data.usedFonts);
							getUsedFont(getComputedStyle(win, element, ":before"), options, data.usedFonts);
							getUsedFont(getComputedStyle(win, element, ":after"), options, data.usedFonts);
						}
					}
				}
				getResourcesInfo(win, doc, element, options, data, elementHidden, computedStyle);
				const shadowRoot = !((element instanceof win.SVGElement) || (element instanceof globalThis.SVGElement)) && getShadowRoot(element);
				if (shadowRoot && !element.classList.contains(SINGLE_FILE_UI_ELEMENT_CLASS) && element.tagName.toLowerCase() != INFOBAR_TAGNAME) {
					const shadowRootInfo = {};
					element.setAttribute(SHADOW_ROOT_ATTRIBUTE_NAME, data.shadowRoots.length);
					data.markedElements.push(element);
					data.shadowRoots.push(shadowRootInfo);
					try {
						if (shadowRoot.adoptedStyleSheets) {
							if (shadowRoot.adoptedStyleSheets.length) {
								shadowRootInfo.adoptedStyleSheets = getStylesheetsContent(shadowRoot.adoptedStyleSheets);
							} else if (shadowRoot.adoptedStyleSheets.length === undefined) {
								const listener = event => shadowRootInfo.adoptedStyleSheets = event.detail.adoptedStyleSheets;
								shadowRoot.addEventListener(GET_ADOPTED_STYLESHEETS_RESPONSE_EVENT, listener);
								shadowRoot.dispatchEvent(new CustomEvent(GET_ADOPTED_STYLESHEETS_REQUEST_EVENT, { bubbles: true }));
								if (!shadowRootInfo.adoptedStyleSheets) {
									element.dispatchEvent(new CustomEvent(GET_ADOPTED_STYLESHEETS_REQUEST_EVENT, { bubbles: true }));
								}
								shadowRoot.removeEventListener(GET_ADOPTED_STYLESHEETS_RESPONSE_EVENT, listener);
							}
						}
					} catch (error) {
						// ignored
					}
					getElementsInfo(win, doc, shadowRoot, options, data, elementHidden);
					shadowRootInfo.content = shadowRoot.innerHTML;
					shadowRootInfo.mode = shadowRoot.mode;
					try {
						if (shadowRoot.adoptedStyleSheets && shadowRoot.adoptedStyleSheets.length === undefined) {
							shadowRoot.dispatchEvent(new CustomEvent(UNREGISTER_GET_ADOPTED_STYLESHEETS_REQUEST_EVENT, { bubbles: true }));
						}
					} catch (error) {
						// ignored
					}
				}
				getElementsInfo(win, doc, element, options, data, elementHidden);
				if (!options.autoSaveExternalSave && options.removeHiddenElements && ascendantHidden) {
					if (elementKept || element.getAttribute(KEPT_CONTENT_ATTRIBUTE_NAME) == "") {
						if (element.parentElement) {
							element.parentElement.setAttribute(KEPT_CONTENT_ATTRIBUTE_NAME, "");
							data.markedElements.push(element.parentElement);
						}
					} else if (elementHidden) {
						element.setAttribute(REMOVED_CONTENT_ATTRIBUTE_NAME, "");
						data.markedElements.push(element);
					}
				}
			});
		}
		return data;
	}

	function getStylesheetsContent(styleSheets) {
		return styleSheets ? Array.from(styleSheets).map(stylesheet => Array.from(stylesheet.cssRules).map(cssRule => cssRule.cssText).join("\n")) : [];
	}

	function getResourcesInfo(win, doc, element, options, data, elementHidden, computedStyle) {
		const tagName = element.tagName && element.tagName.toUpperCase();
		if (tagName == "CANVAS") {
			try {
				data.canvases.push({
					dataURI: element.toDataURL("image/png", ""),
					backgroundColor: computedStyle.getPropertyValue("background-color")
				});
				element.setAttribute(CANVAS_ATTRIBUTE_NAME, data.canvases.length - 1);
				data.markedElements.push(element);
			} catch (error) {
				// ignored
			}
		}
		if (tagName == "IMG") {
			const imageData = {
				currentSrc: elementHidden ?
					EMPTY_RESOURCE :
					(options.loadDeferredImages && element.getAttribute(LAZY_SRC_ATTRIBUTE_NAME)) || element.currentSrc
			};
			data.images.push(imageData);
			element.setAttribute(IMAGE_ATTRIBUTE_NAME, data.images.length - 1);
			data.markedElements.push(element);
			element.removeAttribute(LAZY_SRC_ATTRIBUTE_NAME);
			computedStyle = computedStyle || getComputedStyle(win, element);
			if (computedStyle) {
				imageData.size = getSize(win, element, computedStyle);
				const boxShadow = computedStyle.getPropertyValue("box-shadow");
				const backgroundImage = computedStyle.getPropertyValue("background-image");
				if ((!boxShadow || boxShadow == "none") &&
					(!backgroundImage || backgroundImage == "none") &&
					(imageData.size.pxWidth > 1 || imageData.size.pxHeight > 1)) {
					imageData.replaceable = true;
					imageData.backgroundColor = computedStyle.getPropertyValue("background-color");
					imageData.objectFit = computedStyle.getPropertyValue("object-fit");
					imageData.boxSizing = computedStyle.getPropertyValue("box-sizing");
					imageData.objectPosition = computedStyle.getPropertyValue("object-position");
				}
			}
		}
		if (tagName == "VIDEO") {
			const src = element.currentSrc;
			if (src && !src.startsWith("blob:") && !src.startsWith("data:")) {
				const computedStyle = getComputedStyle(win, element.parentNode);
				data.videos.push({
					positionParent: computedStyle && computedStyle.getPropertyValue("position"),
					src,
					size: {
						pxWidth: element.clientWidth,
						pxHeight: element.clientHeight
					},
					currentTime: element.currentTime
				});
				element.setAttribute(VIDEO_ATTRIBUTE_NAME, data.videos.length - 1);
			}
			if (!element.getAttribute("poster")) {
				const canvasElement = doc.createElement("canvas");
				const context = canvasElement.getContext("2d");
				canvasElement.width = element.clientWidth;
				canvasElement.height = element.clientHeight;
				try {
					context.drawImage(element, 0, 0, canvasElement.width, canvasElement.height);
					data.posters.push(canvasElement.toDataURL("image/png", ""));
					element.setAttribute(POSTER_ATTRIBUTE_NAME, data.posters.length - 1);
					data.markedElements.push(element);
				} catch (error) {
					// ignored
				}
			}
		}
		if (tagName == "IFRAME") {
			if (elementHidden && options.removeHiddenElements) {
				element.setAttribute(HIDDEN_FRAME_ATTRIBUTE_NAME, "");
				data.markedElements.push(element);
			}
		}
		if (tagName == "INPUT") {
			if (element.type != "password") {
				element.setAttribute(INPUT_VALUE_ATTRIBUTE_NAME, element.value);
				data.markedElements.push(element);
			}
			if (element.type == "radio" || element.type == "checkbox") {
				element.setAttribute(INPUT_VALUE_ATTRIBUTE_NAME, element.checked);
				data.markedElements.push(element);
			}
		}
		if (tagName == "TEXTAREA") {
			element.setAttribute(INPUT_VALUE_ATTRIBUTE_NAME, element.value);
			data.markedElements.push(element);
		}
		if (tagName == "SELECT") {
			element.querySelectorAll("option").forEach(option => {
				if (option.selected) {
					option.setAttribute(INPUT_VALUE_ATTRIBUTE_NAME, "");
					data.markedElements.push(option);
				}
			});
		}
		if (tagName == "SCRIPT") {
			if (element.async && element.getAttribute("async") != "" && element.getAttribute("async") != "async") {
				element.setAttribute(ASYNC_SCRIPT_ATTRIBUTE_NAME, "");
				data.markedElements.push(element);
			}
			element.textContent = element.textContent.replace(/<\/script>/gi, "<\\/script>");
		}
	}

	function getUsedFont(computedStyle, options, usedFonts) {
		if (computedStyle) {
			const fontStyle = computedStyle.getPropertyValue("font-style") || "normal";
			computedStyle.getPropertyValue("font-family").split(",").forEach(fontFamilyName => {
				fontFamilyName = normalizeFontFamily(fontFamilyName);
				if (!options.loadedFonts || options.loadedFonts.find(font => normalizeFontFamily(font.family) == fontFamilyName && font.style == fontStyle)) {
					const fontWeight = getFontWeight(computedStyle.getPropertyValue("font-weight"));
					const fontVariant = computedStyle.getPropertyValue("font-variant") || "normal";
					const value = [fontFamilyName, fontWeight, fontStyle, fontVariant];
					usedFonts.set(JSON$1.stringify(value), [fontFamilyName, fontWeight, fontStyle, fontVariant]);
				}
			});
		}
	}

	function getShadowRoot(element) {
		const chrome = globalThis.chrome;
		if (element.openOrClosedShadowRoot) {
			return element.openOrClosedShadowRoot;
		} else if (chrome && chrome.dom && chrome.dom.openOrClosedShadowRoot) {
			try {
				return chrome.dom.openOrClosedShadowRoot(element);
			} catch (error) {
				return element.shadowRoot;
			}
		} else {
			return element.shadowRoot;
		}
	}

	function normalizeFontFamily(fontFamilyName = "") {
		return removeQuotes(process$2(fontFamilyName.trim())).toLowerCase();
	}

	function testHiddenElement(element, computedStyle) {
		let hidden = false;
		if (computedStyle) {
			const display = computedStyle.getPropertyValue("display");
			const opacity = computedStyle.getPropertyValue("opacity");
			const visibility = computedStyle.getPropertyValue("visibility");
			hidden = display == "none";
			if (!hidden && (opacity == "0" || visibility == "hidden") && element.getBoundingClientRect) {
				const boundingRect = element.getBoundingClientRect();
				hidden = !boundingRect.width && !boundingRect.height;
			}
		}
		return Boolean(hidden);
	}

	function postProcessDoc(doc, markedElements, invalidElements) {
		doc.querySelectorAll("[" + DISABLED_NOSCRIPT_ATTRIBUTE_NAME + "]").forEach(element => {
			element.textContent = element.getAttribute(DISABLED_NOSCRIPT_ATTRIBUTE_NAME);
			element.removeAttribute(DISABLED_NOSCRIPT_ATTRIBUTE_NAME);
		});
		doc.querySelectorAll("meta[disabled-http-equiv]").forEach(element => {
			element.setAttribute("http-equiv", element.getAttribute("disabled-http-equiv"));
			element.removeAttribute("disabled-http-equiv");
		});
		if (doc.head) {
			doc.head.querySelectorAll("*:not(base):not(link):not(meta):not(noscript):not(script):not(style):not(template):not(title)").forEach(element => element.removeAttribute("hidden"));
		}
		if (!markedElements) {
			const singleFileAttributes = [REMOVED_CONTENT_ATTRIBUTE_NAME, HIDDEN_FRAME_ATTRIBUTE_NAME, HIDDEN_CONTENT_ATTRIBUTE_NAME, PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME, IMAGE_ATTRIBUTE_NAME, POSTER_ATTRIBUTE_NAME, VIDEO_ATTRIBUTE_NAME, CANVAS_ATTRIBUTE_NAME, INPUT_VALUE_ATTRIBUTE_NAME, SHADOW_ROOT_ATTRIBUTE_NAME, STYLESHEET_ATTRIBUTE_NAME, ASYNC_SCRIPT_ATTRIBUTE_NAME];
			markedElements = doc.querySelectorAll(singleFileAttributes.map(name => "[" + name + "]").join(","));
		}
		markedElements.forEach(element => {
			element.removeAttribute(REMOVED_CONTENT_ATTRIBUTE_NAME);
			element.removeAttribute(HIDDEN_CONTENT_ATTRIBUTE_NAME);
			element.removeAttribute(KEPT_CONTENT_ATTRIBUTE_NAME);
			element.removeAttribute(HIDDEN_FRAME_ATTRIBUTE_NAME);
			element.removeAttribute(PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME);
			element.removeAttribute(IMAGE_ATTRIBUTE_NAME);
			element.removeAttribute(POSTER_ATTRIBUTE_NAME);
			element.removeAttribute(VIDEO_ATTRIBUTE_NAME);
			element.removeAttribute(CANVAS_ATTRIBUTE_NAME);
			element.removeAttribute(INPUT_VALUE_ATTRIBUTE_NAME);
			element.removeAttribute(SHADOW_ROOT_ATTRIBUTE_NAME);
			element.removeAttribute(STYLESHEET_ATTRIBUTE_NAME);
			element.removeAttribute(ASYNC_SCRIPT_ATTRIBUTE_NAME);
			element.removeAttribute(STYLE_ATTRIBUTE_NAME);
		});
		if (invalidElements) {
			invalidElements.forEach((placeholderElement, element) => placeholderElement.replaceWith(element));
		}
	}

	function getStylesheetsData(doc) {
		if (doc) {
			const contents = [];
			doc.querySelectorAll("style").forEach((styleElement, styleIndex) => {
				try {
					if (!styleElement.sheet.disabled) {
						const tempStyleElement = doc.createElement("style");
						tempStyleElement.textContent = styleElement.textContent;
						doc.body.appendChild(tempStyleElement);
						const stylesheet = tempStyleElement.sheet;
						tempStyleElement.remove();
						const textContentStylesheet = Array.from(stylesheet.cssRules).map(cssRule => cssRule.cssText).join("\n");
						const sheetStylesheet = Array.from(styleElement.sheet.cssRules).map(cssRule => cssRule.cssText).join("\n");
						if (!stylesheet || textContentStylesheet != sheetStylesheet) {
							styleElement.setAttribute(STYLESHEET_ATTRIBUTE_NAME, styleIndex);
							contents[styleIndex] = Array.from(styleElement.sheet.cssRules).map(cssRule => cssRule.cssText).join("\n");
						}
					}
				} catch (error) {
					// ignored
				}
			});
			return contents;
		}
	}

	function getSize(win, imageElement, computedStyle) {
		let pxWidth = imageElement.naturalWidth;
		let pxHeight = imageElement.naturalHeight;
		if (!pxWidth && !pxHeight) {
			const noStyleAttribute = imageElement.getAttribute("style") == null;
			computedStyle = computedStyle || getComputedStyle(win, imageElement);
			if (computedStyle) {
				let removeBorderWidth = false;
				if (computedStyle.getPropertyValue("box-sizing") == "content-box") {
					const boxSizingValue = imageElement.style.getPropertyValue("box-sizing");
					const boxSizingPriority = imageElement.style.getPropertyPriority("box-sizing");
					const clientWidth = imageElement.clientWidth;
					imageElement.style.setProperty("box-sizing", "border-box", "important");
					removeBorderWidth = imageElement.clientWidth != clientWidth;
					if (boxSizingValue) {
						imageElement.style.setProperty("box-sizing", boxSizingValue, boxSizingPriority);
					} else {
						imageElement.style.removeProperty("box-sizing");
					}
				}
				let paddingLeft, paddingRight, paddingTop, paddingBottom, borderLeft, borderRight, borderTop, borderBottom;
				paddingLeft = getWidth("padding-left", computedStyle);
				paddingRight = getWidth("padding-right", computedStyle);
				paddingTop = getWidth("padding-top", computedStyle);
				paddingBottom = getWidth("padding-bottom", computedStyle);
				if (removeBorderWidth) {
					borderLeft = getWidth("border-left-width", computedStyle);
					borderRight = getWidth("border-right-width", computedStyle);
					borderTop = getWidth("border-top-width", computedStyle);
					borderBottom = getWidth("border-bottom-width", computedStyle);
				} else {
					borderLeft = borderRight = borderTop = borderBottom = 0;
				}
				pxWidth = Math.max(0, imageElement.clientWidth - paddingLeft - paddingRight - borderLeft - borderRight);
				pxHeight = Math.max(0, imageElement.clientHeight - paddingTop - paddingBottom - borderTop - borderBottom);
				if (noStyleAttribute) {
					imageElement.removeAttribute("style");
				}
			}
		}
		return { pxWidth, pxHeight };
	}

	function getWidth(styleName, computedStyle) {
		if (computedStyle.getPropertyValue(styleName).endsWith("px")) {
			return parseFloat(computedStyle.getPropertyValue(styleName));
		}
	}

	function getFontsData() {
		return getFontsData$1();
	}

	function serialize$1(doc) {
		const docType = doc.doctype;
		let docTypeString = "";
		if (docType) {
			docTypeString = "<!DOCTYPE " + docType.nodeName;
			if (docType.publicId) {
				docTypeString += " PUBLIC \"" + docType.publicId + "\"";
				if (docType.systemId) {
					docTypeString += " \"" + docType.systemId + "\"";
				}
			} else if (docType.systemId) {
				docTypeString += " SYSTEM \"" + docType.systemId + "\"";
			} if (docType.internalSubset) {
				docTypeString += " [" + docType.internalSubset + "]";
			}
			docTypeString += "> ";
		}
		return docTypeString + doc.documentElement.outerHTML;
	}

	function removeQuotes(string) {
		if (string.match(REGEXP_SIMPLE_QUOTES_STRING)) {
			string = string.replace(REGEXP_SIMPLE_QUOTES_STRING, "$1");
		} else {
			string = string.replace(REGEXP_DOUBLE_QUOTES_STRING, "$1");
		}
		return string.trim();
	}

	function getFontWeight(weight) {
		return FONT_WEIGHTS[weight.toLowerCase().trim()] || weight;
	}

	function getComputedStyle(win, element, pseudoElement) {
		try {
			return win.getComputedStyle(element, pseudoElement);
		} catch (error) {
			// ignored
		}
	}

	/*
	 * Copyright 2010-2022 Gildas Lormeau
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
	const helper$2 = {
		LAZY_SRC_ATTRIBUTE_NAME,
		SINGLE_FILE_UI_ELEMENT_CLASS
	};

	const MAX_IDLE_TIMEOUT_CALLS = 10;
	const ATTRIBUTES_MUTATION_TYPE = "attributes";

	const browser$1 = globalThis.browser;
	const document$1 = globalThis.document;
	const MutationObserver$1 = globalThis.MutationObserver;
	const timeouts = new Map();

	let idleTimeoutCalls;

	if (browser$1 && browser$1.runtime && browser$1.runtime.onMessage && browser$1.runtime.onMessage.addListener) {
		browser$1.runtime.onMessage.addListener(message => {
			if (message.method == "singlefile.lazyTimeout.onTimeout") {
				const timeoutData = timeouts.get(message.type);
				if (timeoutData) {
					timeouts.delete(message.type);
					try {
						timeoutData.callback();
					} catch (error) {
						clearRegularTimeout(message.type);
					}
				}
			}
		});
	}

	async function process$1(options) {
		if (document$1.documentElement) {
			timeouts.clear();
			const bodyHeight = document$1.body ? Math.max(document$1.body.scrollHeight, document$1.documentElement.scrollHeight) : document$1.documentElement.scrollHeight;
			const bodyWidth = document$1.body ? Math.max(document$1.body.scrollWidth, document$1.documentElement.scrollWidth) : document$1.documentElement.scrollWidth;
			if (bodyHeight > globalThis.innerHeight || bodyWidth > globalThis.innerWidth) {
				const maxScrollY = Math.max(bodyHeight - (globalThis.innerHeight * 1.5), 0);
				const maxScrollX = Math.max(bodyWidth - (globalThis.innerWidth * 1.5), 0);
				if (globalThis.scrollY < maxScrollY || globalThis.scrollX < maxScrollX) {
					return triggerLazyLoading(options);
				}
			}
		}
	}

	function triggerLazyLoading(options) {
		idleTimeoutCalls = 0;
		return new Promise(async resolve => { // eslint-disable-line  no-async-promise-executor
			let loadingImages;
			const pendingImages = new Set();
			const observer = new MutationObserver$1(async mutations => {
				mutations = mutations.filter(mutation => mutation.type == ATTRIBUTES_MUTATION_TYPE);
				if (mutations.length) {
					const updated = mutations.filter(mutation => {
						if (mutation.attributeName == "src") {
							mutation.target.setAttribute(helper$2.LAZY_SRC_ATTRIBUTE_NAME, mutation.target.src);
							mutation.target.addEventListener("load", onResourceLoad);
						}
						if (mutation.attributeName == "src" || mutation.attributeName == "srcset" ||
							(mutation.target.tagName && mutation.target.tagName.toUpperCase() == "SOURCE")) {
							return !mutation.target.classList || !mutation.target.classList.contains(helper$2.SINGLE_FILE_UI_ELEMENT_CLASS);
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
			await setIdleTimeout(options.loadDeferredImagesMaxIdleTime * 2);
			await deferForceLazyLoadEnd(observer, options, cleanupAndResolve);
			observer.observe(document$1, { subtree: true, childList: true, attributes: true });
			document$1.addEventListener(LOAD_IMAGE_EVENT, onImageLoadEvent);
			document$1.addEventListener(IMAGE_LOADED_EVENT, onImageLoadedEvent);
			loadDeferredImagesStart(options);

			async function setIdleTimeout(delay) {
				await setAsyncTimeout("idleTimeout", async () => {
					if (!loadingImages) {
						clearAsyncTimeout("loadTimeout");
						clearAsyncTimeout("maxTimeout");
						lazyLoadEnd(observer, options, cleanupAndResolve);
					} else if (idleTimeoutCalls < MAX_IDLE_TIMEOUT_CALLS) {
						idleTimeoutCalls++;
						clearAsyncTimeout("idleTimeout");
						await setIdleTimeout(Math.max(500, delay / 2));
					}
				}, delay, options.loadDeferredImagesNativeTimeout);
			}

			function onResourceLoad(event) {
				const element = event.target;
				element.removeAttribute(helper$2.LAZY_SRC_ATTRIBUTE_NAME);
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
				document$1.removeEventListener(LOAD_IMAGE_EVENT, onImageLoadEvent);
				document$1.removeEventListener(IMAGE_LOADED_EVENT, onImageLoadedEvent);
				resolve(value);
			}
		});
	}

	async function deferLazyLoadEnd(observer, options, resolve) {
		await setAsyncTimeout("loadTimeout", () => lazyLoadEnd(observer, options, resolve), options.loadDeferredImagesMaxIdleTime, options.loadDeferredImagesNativeTimeout);
	}

	async function deferForceLazyLoadEnd(observer, options, resolve) {
		await setAsyncTimeout("maxTimeout", async () => {
			await clearAsyncTimeout("loadTimeout");
			await lazyLoadEnd(observer, options, resolve);
		}, options.loadDeferredImagesMaxIdleTime * 10, options.loadDeferredImagesNativeTimeout);
	}

	async function lazyLoadEnd(observer, options, resolve) {
		await clearAsyncTimeout("idleTimeout");
		loadDeferredImagesEnd(options);
		await setAsyncTimeout("endTimeout", async () => {
			await clearAsyncTimeout("maxTimeout");
			resolve();
		}, options.loadDeferredImagesMaxIdleTime / 2, options.loadDeferredImagesNativeTimeout);
		observer.disconnect();
	}

	async function setAsyncTimeout(type, callback, delay, forceNativeTimeout) {
		if (browser$1 && browser$1.runtime && browser$1.runtime.sendMessage && !forceNativeTimeout) {
			if (!timeouts.get(type) || !timeouts.get(type).pending) {
				const timeoutData = { callback, pending: true };
				timeouts.set(type, timeoutData);
				try {
					await browser$1.runtime.sendMessage({ method: "singlefile.lazyTimeout.setTimeout", type, delay });
				} catch (error) {
					setRegularTimeout(type, callback, delay);
				}
				timeoutData.pending = false;
			}
		} else {
			setRegularTimeout(type, callback, delay);
		}
	}

	function setRegularTimeout(type, callback, delay) {
		const timeoutId = timeouts.get(type);
		if (timeoutId) {
			globalThis.clearTimeout(timeoutId);
		}
		timeouts.set(type, callback);
		globalThis.setTimeout(callback, delay);
	}

	async function clearAsyncTimeout(type) {
		if (browser$1 && browser$1.runtime && browser$1.runtime.sendMessage) {
			try {
				await browser$1.runtime.sendMessage({ method: "singlefile.lazyTimeout.clearTimeout", type });
			} catch (error) {
				clearRegularTimeout(type);
			}
		} else {
			clearRegularTimeout(type);
		}
	}

	function clearRegularTimeout(type) {
		const previousTimeoutId = timeouts.get(type);
		timeouts.delete(type);
		if (previousTimeoutId) {
			globalThis.clearTimeout(previousTimeoutId);
		}
	}

	/*
	 * Copyright 2010-2022 Gildas Lormeau
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

	const helper$1 = {
		ON_BEFORE_CAPTURE_EVENT_NAME,
		ON_AFTER_CAPTURE_EVENT_NAME,
		WIN_ID_ATTRIBUTE_NAME,
		WAIT_FOR_USERSCRIPT_PROPERTY_NAME,
		preProcessDoc,
		serialize: serialize$1,
		postProcessDoc,
		getShadowRoot
	};

	const FRAMES_CSS_SELECTOR = "iframe, frame, object[type=\"text/html\"][data]";
	const ALL_ELEMENTS_CSS_SELECTOR = "*";
	const INIT_REQUEST_MESSAGE = "singlefile.frameTree.initRequest";
	const ACK_INIT_REQUEST_MESSAGE = "singlefile.frameTree.ackInitRequest";
	const CLEANUP_REQUEST_MESSAGE = "singlefile.frameTree.cleanupRequest";
	const INIT_RESPONSE_MESSAGE = "singlefile.frameTree.initResponse";
	const TARGET_ORIGIN = "*";
	const TIMEOUT_INIT_REQUEST_MESSAGE = 5000;
	const TIMEOUT_INIT_RESPONSE_MESSAGE = 10000;
	const TOP_WINDOW_ID = "0";
	const WINDOW_ID_SEPARATOR = ".";
	const TOP_WINDOW = globalThis.window == globalThis.top;

	const browser = globalThis.browser;
	const top = globalThis.top;
	const MessageChannel = globalThis.MessageChannel;
	const document = globalThis.document;
	const JSON = globalThis.JSON;
	const MutationObserver = globalThis.MutationObserver;

	let sessions = globalThis.sessions;
	if (!sessions) {
		sessions = globalThis.sessions = new Map();
	}
	let windowId;
	if (TOP_WINDOW) {
		windowId = TOP_WINDOW_ID;
		if (browser && browser.runtime && browser.runtime.onMessage && browser.runtime.onMessage.addListener) {
			browser.runtime.onMessage.addListener(message => {
				if (message.method == INIT_RESPONSE_MESSAGE) {
					initResponse(message);
					return Promise.resolve({});
				} else if (message.method == ACK_INIT_REQUEST_MESSAGE) {
					clearFrameTimeout("requestTimeouts", message.sessionId, message.windowId);
					createFrameResponseTimeout(message.sessionId, message.windowId);
					return Promise.resolve({});
				}
			});
		}
	}
	init();
	new MutationObserver(init).observe(document, { childList: true });

	function init() {
		globalThis.addEventListener("message", async event => {
			if (typeof event.data == "string" && event.data.startsWith(MESSAGE_PREFIX)) {
				event.preventDefault();
				event.stopPropagation();
				const message = JSON.parse(event.data.substring(MESSAGE_PREFIX.length));
				if (message.method == INIT_REQUEST_MESSAGE) {
					if (event.source) {
						sendMessage(event.source, { method: ACK_INIT_REQUEST_MESSAGE, windowId: message.windowId, sessionId: message.sessionId });
					}
					if (!TOP_WINDOW) {
						globalThis.stop();
						if (message.options.loadDeferredImages) {
							process$1(message.options);
						}
						await initRequestAsync(message);
					}
				} else if (message.method == ACK_INIT_REQUEST_MESSAGE) {
					clearFrameTimeout("requestTimeouts", message.sessionId, message.windowId);
					createFrameResponseTimeout(message.sessionId, message.windowId);
				} else if (message.method == CLEANUP_REQUEST_MESSAGE) {
					cleanupRequest(message);
				} else if (message.method == INIT_RESPONSE_MESSAGE && sessions.get(message.sessionId)) {
					const port = event.ports[0];
					port.onmessage = event => initResponse(event.data);
				}
			}
		}, true);
	}

	function getAsync(options) {
		const sessionId = getNewSessionId();
		options = JSON.parse(JSON.stringify(options));
		return new Promise(resolve => {
			sessions.set(sessionId, {
				frames: [],
				requestTimeouts: {},
				responseTimeouts: {},
				resolve: frames => {
					frames.sessionId = sessionId;
					resolve(frames);
				}
			});
			initRequestAsync({ windowId, sessionId, options });
		});
	}

	function getSync(options) {
		const sessionId = getNewSessionId();
		options = JSON.parse(JSON.stringify(options));
		sessions.set(sessionId, {
			frames: [],
			requestTimeouts: {},
			responseTimeouts: {}
		});
		initRequestSync({ windowId, sessionId, options });
		const frames = sessions.get(sessionId).frames;
		frames.sessionId = sessionId;
		return frames;
	}

	function cleanup(sessionId) {
		sessions.delete(sessionId);
		cleanupRequest({ windowId, sessionId, options: { sessionId } });
	}

	function getNewSessionId() {
		return globalThis.crypto.getRandomValues(new Uint32Array(32)).join("");
	}

	function initRequestSync(message) {
		const sessionId = message.sessionId;
		const waitForUserScript = globalThis[helper$1.WAIT_FOR_USERSCRIPT_PROPERTY_NAME];
		delete globalThis._singleFile_cleaningUp;
		if (!TOP_WINDOW) {
			windowId = globalThis.frameId = message.windowId;
		}
		processFrames(document, message.options, windowId, sessionId);
		if (!TOP_WINDOW) {
			if (message.options.userScriptEnabled && waitForUserScript) {
				waitForUserScript(helper$1.ON_BEFORE_CAPTURE_EVENT_NAME);
			}
			sendInitResponse({ frames: [getFrameData(document, globalThis, windowId, message.options, message.scrolling)], sessionId, requestedFrameId: document.documentElement.dataset.requestedFrameId && windowId });
			if (message.options.userScriptEnabled && waitForUserScript) {
				waitForUserScript(helper$1.ON_AFTER_CAPTURE_EVENT_NAME);
			}
			delete document.documentElement.dataset.requestedFrameId;
		}
	}

	async function initRequestAsync(message) {
		const sessionId = message.sessionId;
		const waitForUserScript = globalThis[helper$1.WAIT_FOR_USERSCRIPT_PROPERTY_NAME];
		delete globalThis._singleFile_cleaningUp;
		if (!TOP_WINDOW) {
			windowId = globalThis.frameId = message.windowId;
		}
		processFrames(document, message.options, windowId, sessionId);
		if (!TOP_WINDOW) {
			if (message.options.userScriptEnabled && waitForUserScript) {
				await waitForUserScript(helper$1.ON_BEFORE_CAPTURE_EVENT_NAME);
			}
			sendInitResponse({ frames: [getFrameData(document, globalThis, windowId, message.options, message.scrolling)], sessionId, requestedFrameId: document.documentElement.dataset.requestedFrameId && windowId });
			if (message.options.userScriptEnabled && waitForUserScript) {
				await waitForUserScript(helper$1.ON_AFTER_CAPTURE_EVENT_NAME);
			}
			delete document.documentElement.dataset.requestedFrameId;
		}
	}

	function cleanupRequest(message) {
		if (!globalThis._singleFile_cleaningUp) {
			globalThis._singleFile_cleaningUp = true;
			const sessionId = message.sessionId;
			cleanupFrames(getFrames(document), message.windowId, sessionId);
		}
	}

	function initResponse(message) {
		message.frames.forEach(frameData => clearFrameTimeout("responseTimeouts", message.sessionId, frameData.windowId));
		const windowData = sessions.get(message.sessionId);
		if (windowData) {
			if (message.requestedFrameId) {
				windowData.requestedFrameId = message.requestedFrameId;
			}
			message.frames.forEach(messageFrameData => {
				let frameData = windowData.frames.find(frameData => messageFrameData.windowId == frameData.windowId);
				if (!frameData) {
					frameData = { windowId: messageFrameData.windowId };
					windowData.frames.push(frameData);
				}
				if (!frameData.processed) {
					frameData.content = messageFrameData.content;
					frameData.baseURI = messageFrameData.baseURI;
					frameData.title = messageFrameData.title;
					frameData.url = messageFrameData.url;
					frameData.canvases = messageFrameData.canvases;
					frameData.fonts = messageFrameData.fonts;
					frameData.stylesheets = messageFrameData.stylesheets;
					frameData.images = messageFrameData.images;
					frameData.posters = messageFrameData.posters;
					frameData.videos = messageFrameData.videos;
					frameData.usedFonts = messageFrameData.usedFonts;
					frameData.shadowRoots = messageFrameData.shadowRoots;
					frameData.processed = messageFrameData.processed;
					frameData.scrollPosition = messageFrameData.scrollPosition;
					frameData.scrolling = messageFrameData.scrolling;
					frameData.adoptedStyleSheets = messageFrameData.adoptedStyleSheets;
				}
			});
			const remainingFrames = windowData.frames.filter(frameData => !frameData.processed).length;
			if (!remainingFrames) {
				windowData.frames = windowData.frames.sort((frame1, frame2) => frame2.windowId.split(WINDOW_ID_SEPARATOR).length - frame1.windowId.split(WINDOW_ID_SEPARATOR).length);
				if (windowData.resolve) {
					if (windowData.requestedFrameId) {
						windowData.frames.forEach(frameData => {
							if (frameData.windowId == windowData.requestedFrameId) {
								frameData.requestedFrame = true;
							}
						});
					}
					windowData.resolve(windowData.frames);
				}
			}
		}
	}
	function processFrames(doc, options, parentWindowId, sessionId) {
		const frameElements = getFrames(doc);
		processFramesAsync(doc, frameElements, options, parentWindowId, sessionId);
		if (frameElements.length) {
			processFramesSync(doc, frameElements, options, parentWindowId, sessionId);
		}
	}

	function processFramesAsync(doc, frameElements, options, parentWindowId, sessionId) {
		const frames = [];
		let requestTimeouts;
		if (sessions.get(sessionId)) {
			requestTimeouts = sessions.get(sessionId).requestTimeouts;
		} else {
			requestTimeouts = {};
			sessions.set(sessionId, { requestTimeouts });
		}
		frameElements.forEach((frameElement, frameIndex) => {
			const windowId = parentWindowId + WINDOW_ID_SEPARATOR + frameIndex;
			frameElement.setAttribute(helper$1.WIN_ID_ATTRIBUTE_NAME, windowId);
			frames.push({ windowId });
		});
		sendInitResponse({ frames, sessionId, requestedFrameId: doc.documentElement.dataset.requestedFrameId && parentWindowId });
		frameElements.forEach((frameElement, frameIndex) => {
			const windowId = parentWindowId + WINDOW_ID_SEPARATOR + frameIndex;
			try {
				sendMessage(frameElement.contentWindow, { method: INIT_REQUEST_MESSAGE, windowId, sessionId, options, scrolling: frameElement.scrolling });
			} catch (error) {
				// ignored
			}
			requestTimeouts[windowId] = globalThis.setTimeout(() => sendInitResponse({ frames: [{ windowId, processed: true }], sessionId }), TIMEOUT_INIT_REQUEST_MESSAGE);
		});
		delete doc.documentElement.dataset.requestedFrameId;
	}

	function processFramesSync(doc, frameElements, options, parentWindowId, sessionId) {
		const frames = [];
		frameElements.forEach((frameElement, frameIndex) => {
			const windowId = parentWindowId + WINDOW_ID_SEPARATOR + frameIndex;
			let frameDoc;
			try {
				frameDoc = frameElement.contentDocument;
			} catch (error) {
				// ignored
			}
			if (frameDoc) {
				try {
					const frameWindow = frameElement.contentWindow;
					frameWindow.stop();
					clearFrameTimeout("requestTimeouts", sessionId, windowId);
					processFrames(frameDoc, options, windowId, sessionId);
					frames.push(getFrameData(frameDoc, frameWindow, windowId, options, frameElement.scrolling));
				} catch (error) {
					frames.push({ windowId, processed: true });
				}
			}
		});
		sendInitResponse({ frames, sessionId, requestedFrameId: doc.documentElement.dataset.requestedFrameId && parentWindowId });
		delete doc.documentElement.dataset.requestedFrameId;
	}

	function clearFrameTimeout(type, sessionId, windowId) {
		const session = sessions.get(sessionId);
		if (session && session[type]) {
			const timeout = session[type][windowId];
			if (timeout) {
				globalThis.clearTimeout(timeout);
				delete session[type][windowId];
			}
		}
	}

	function createFrameResponseTimeout(sessionId, windowId) {
		const session = sessions.get(sessionId);
		if (session && session.responseTimeouts) {
			session.responseTimeouts[windowId] = globalThis.setTimeout(() => sendInitResponse({ frames: [{ windowId: windowId, processed: true }], sessionId: sessionId }), TIMEOUT_INIT_RESPONSE_MESSAGE);
		}
	}

	function cleanupFrames(frameElements, parentWindowId, sessionId) {
		frameElements.forEach((frameElement, frameIndex) => {
			const windowId = parentWindowId + WINDOW_ID_SEPARATOR + frameIndex;
			frameElement.removeAttribute(helper$1.WIN_ID_ATTRIBUTE_NAME);
			try {
				sendMessage(frameElement.contentWindow, { method: CLEANUP_REQUEST_MESSAGE, windowId, sessionId });
			} catch (error) {
				// ignored
			}
		});
		frameElements.forEach((frameElement, frameIndex) => {
			const windowId = parentWindowId + WINDOW_ID_SEPARATOR + frameIndex;
			let frameDoc;
			try {
				frameDoc = frameElement.contentDocument;
			} catch (error) {
				// ignored
			}
			if (frameDoc) {
				try {
					cleanupFrames(getFrames(frameDoc), windowId, sessionId);
				} catch (error) {
					// ignored
				}
			}
		});
	}

	function sendInitResponse(message) {
		message.method = INIT_RESPONSE_MESSAGE;
		try {
			top.singlefile.processors.frameTree.initResponse(message);
		} catch (error) {
			sendMessage(top, message, true);
		}
	}

	function sendMessage(targetWindow, message, useChannel) {
		if (targetWindow == top && browser && browser.runtime && browser.runtime.sendMessage) {
			browser.runtime.sendMessage(message);
		} else {
			if (useChannel) {
				const channel = new MessageChannel();
				targetWindow.postMessage(MESSAGE_PREFIX + JSON.stringify({ method: message.method, sessionId: message.sessionId }), TARGET_ORIGIN, [channel.port2]);
				channel.port1.postMessage(message);
			} else {
				targetWindow.postMessage(MESSAGE_PREFIX + JSON.stringify(message), TARGET_ORIGIN);
			}
		}
	}

	function getFrameData(document, globalThis, windowId, options, scrolling) {
		const docData = helper$1.preProcessDoc(document, globalThis, options);
		const content = helper$1.serialize(document);
		helper$1.postProcessDoc(document, docData.markedElements, docData.invalidElements);
		const baseURI = document.baseURI.split("#")[0];
		return {
			windowId,
			content,
			baseURI,
			url: document.documentURI,
			title: document.title,
			canvases: docData.canvases,
			fonts: docData.fonts,
			stylesheets: docData.stylesheets,
			images: docData.images,
			posters: docData.posters,
			videos: docData.videos,
			usedFonts: docData.usedFonts,
			shadowRoots: docData.shadowRoots,
			scrollPosition: docData.scrollPosition,
			scrolling,
			adoptedStyleSheets: docData.adoptedStyleSheets,
			processed: true
		};
	}

	function getFrames(document) {
		let frames = Array.from(document.querySelectorAll(FRAMES_CSS_SELECTOR));
		document.querySelectorAll(ALL_ELEMENTS_CSS_SELECTOR).forEach(element => {
			const shadowRoot = helper$1.getShadowRoot(element);
			if (shadowRoot) {
				frames = frames.concat(...shadowRoot.querySelectorAll(FRAMES_CSS_SELECTOR));
			}
		});
		return frames;
	}

	var frameTree = /*#__PURE__*/Object.freeze({
		__proto__: null,
		getAsync: getAsync,
		getSync: getSync,
		cleanup: cleanup,
		initResponse: initResponse,
		TIMEOUT_INIT_REQUEST_MESSAGE: TIMEOUT_INIT_REQUEST_MESSAGE
	});

	/*
	 * Copyright 2010-2022 Gildas Lormeau
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

	const SELF_CLOSED_TAG_NAMES = ["AREA", "BASE", "BR", "COL", "COMMAND", "EMBED", "HR", "IMG", "INPUT", "KEYGEN", "LINK", "META", "PARAM", "SOURCE", "TRACK", "WBR"];

	const Node_ELEMENT_NODE = 1;
	const Node_TEXT_NODE = 3;
	const Node_COMMENT_NODE = 8;

	// see https://www.w3.org/TR/html5/syntax.html#optional-tags
	const OMITTED_START_TAGS = [
		{ tagName: "HEAD", accept: element => !element.childNodes.length || element.childNodes[0].nodeType == Node_ELEMENT_NODE },
		{ tagName: "BODY", accept: element => !element.childNodes.length }
	];
	const OMITTED_END_TAGS = [
		{ tagName: "HTML", accept: next => !next || next.nodeType != Node_COMMENT_NODE },
		{ tagName: "HEAD", accept: next => !next || (next.nodeType != Node_COMMENT_NODE && (next.nodeType != Node_TEXT_NODE || !startsWithSpaceChar(next.textContent))) },
		{ tagName: "BODY", accept: next => !next || next.nodeType != Node_COMMENT_NODE },
		{ tagName: "LI", accept: (next, element) => (!next && element.parentElement && (getTagName(element.parentElement) == "UL" || getTagName(element.parentElement) == "OL")) || (next && ["LI"].includes(getTagName(next))) },
		{ tagName: "DT", accept: next => !next || ["DT", "DD"].includes(getTagName(next)) },
		{ tagName: "P", accept: next => next && ["ADDRESS", "ARTICLE", "ASIDE", "BLOCKQUOTE", "DETAILS", "DIV", "DL", "FIELDSET", "FIGCAPTION", "FIGURE", "FOOTER", "FORM", "H1", "H2", "H3", "H4", "H5", "H6", "HEADER", "HR", "MAIN", "NAV", "OL", "P", "PRE", "SECTION", "TABLE", "UL"].includes(getTagName(next)) },
		{ tagName: "DD", accept: next => !next || ["DT", "DD"].includes(getTagName(next)) },
		{ tagName: "RT", accept: next => !next || ["RT", "RP"].includes(getTagName(next)) },
		{ tagName: "RP", accept: next => !next || ["RT", "RP"].includes(getTagName(next)) },
		{ tagName: "OPTGROUP", accept: next => !next || ["OPTGROUP"].includes(getTagName(next)) },
		{ tagName: "OPTION", accept: next => !next || ["OPTION", "OPTGROUP"].includes(getTagName(next)) },
		{ tagName: "COLGROUP", accept: next => !next || (next.nodeType != Node_COMMENT_NODE && (next.nodeType != Node_TEXT_NODE || !startsWithSpaceChar(next.textContent))) },
		{ tagName: "CAPTION", accept: next => !next || (next.nodeType != Node_COMMENT_NODE && (next.nodeType != Node_TEXT_NODE || !startsWithSpaceChar(next.textContent))) },
		{ tagName: "THEAD", accept: next => !next || ["TBODY", "TFOOT"].includes(getTagName(next)) },
		{ tagName: "TBODY", accept: next => !next || ["TBODY", "TFOOT"].includes(getTagName(next)) },
		{ tagName: "TFOOT", accept: next => !next },
		{ tagName: "TR", accept: next => !next || ["TR"].includes(getTagName(next)) },
		{ tagName: "TD", accept: next => !next || ["TD", "TH"].includes(getTagName(next)) },
		{ tagName: "TH", accept: next => !next || ["TD", "TH"].includes(getTagName(next)) }
	];
	const TEXT_NODE_TAGS = ["STYLE", "SCRIPT", "XMP", "IFRAME", "NOEMBED", "NOFRAMES", "PLAINTEXT", "NOSCRIPT"];

	function process(doc, compressHTML) {
		const docType = doc.doctype;
		let docTypeString = "";
		if (docType) {
			docTypeString = "<!DOCTYPE " + docType.nodeName;
			if (docType.publicId) {
				docTypeString += " PUBLIC \"" + docType.publicId + "\"";
				if (docType.systemId)
					docTypeString += " \"" + docType.systemId + "\"";
			} else if (docType.systemId)
				docTypeString += " SYSTEM \"" + docType.systemId + "\"";
			if (docType.internalSubset)
				docTypeString += " [" + docType.internalSubset + "]";
			docTypeString += "> ";
		}
		return docTypeString + serialize(doc.documentElement, compressHTML);
	}

	function serialize(node, compressHTML, isSVG) {
		if (node.nodeType == Node_TEXT_NODE) {
			return serializeTextNode(node);
		} else if (node.nodeType == Node_COMMENT_NODE) {
			return serializeCommentNode(node);
		} else if (node.nodeType == Node_ELEMENT_NODE) {
			return serializeElement(node, compressHTML, isSVG);
		}
	}

	function serializeTextNode(textNode) {
		const parentNode = textNode.parentNode;
		let parentTagName;
		if (parentNode && parentNode.nodeType == Node_ELEMENT_NODE) {
			parentTagName = getTagName(parentNode);
		}
		if (!parentTagName || TEXT_NODE_TAGS.includes(parentTagName)) {
			if (parentTagName == "SCRIPT" || parentTagName == "STYLE") {
				return textNode.textContent.replace(/<\//gi, "<\\/").replace(/\/>/gi, "\\/>");
			}
			return textNode.textContent;
		} else {
			return textNode.textContent.replace(/&/g, "&amp;").replace(/\u00a0/g, "&nbsp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
		}
	}

	function serializeCommentNode(commentNode) {
		return "<!--" + commentNode.textContent + "-->";
	}

	function serializeElement(element, compressHTML, isSVG) {
		const tagName = getTagName(element);
		const omittedStartTag = compressHTML && OMITTED_START_TAGS.find(omittedStartTag => tagName == getTagName(omittedStartTag) && omittedStartTag.accept(element));
		let content = "";
		if (!omittedStartTag || element.attributes.length) {
			content = "<" + tagName.toLowerCase();
			Array.from(element.attributes).forEach(attribute => content += serializeAttribute(attribute, element, compressHTML));
			content += ">";
		}
		if (tagName == "TEMPLATE" && !element.childNodes.length) {
			content += element.innerHTML;
		} else {
			Array.from(element.childNodes).forEach(childNode => content += serialize(childNode, compressHTML, isSVG || tagName == "svg"));
		}
		const omittedEndTag = compressHTML && OMITTED_END_TAGS.find(omittedEndTag => tagName == getTagName(omittedEndTag) && omittedEndTag.accept(element.nextSibling, element));
		if (isSVG || (!omittedEndTag && !SELF_CLOSED_TAG_NAMES.includes(tagName))) {
			content += "</" + tagName.toLowerCase() + ">";
		}
		return content;
	}

	function serializeAttribute(attribute, element, compressHTML) {
		const name = attribute.name;
		let content = "";
		if (!name.match(/["'>/=]/)) {
			let value = attribute.value;
			if (compressHTML && name == "class") {
				value = Array.from(element.classList).map(className => className.trim()).join(" ");
			}
			let simpleQuotesValue;
			value = value.replace(/&/g, "&amp;").replace(/\u00a0/g, "&nbsp;");
			if (value.includes("\"")) {
				if (value.includes("'") || !compressHTML) {
					value = value.replace(/"/g, "&quot;");
				} else {
					simpleQuotesValue = true;
				}
			}
			const invalidUnquotedValue = !compressHTML || value.match(/[ \t\n\f\r'"`=<>]/);
			content += " ";
			if (!attribute.namespace) {
				content += name;
			} else if (attribute.namespaceURI == "http://www.w3.org/XML/1998/namespace") {
				content += "xml:" + name;
			} else if (attribute.namespaceURI == "http://www.w3.org/2000/xmlns/") {
				if (name !== "xmlns") {
					content += "xmlns:";
				}
				content += name;
			} else if (attribute.namespaceURI == "http://www.w3.org/1999/xlink") {
				content += "xlink:" + name;
			} else {
				content += name;
			}
			if (value != "") {
				content += "=";
				if (invalidUnquotedValue) {
					content += simpleQuotesValue ? "'" : "\"";
				}
				content += value;
				if (invalidUnquotedValue) {
					content += simpleQuotesValue ? "'" : "\"";
				}
			}
		}
		return content;
	}

	function startsWithSpaceChar(textContent) {
		return Boolean(textContent.match(/^[ \t\n\f\r]/));
	}

	function getTagName(element) {
		return  element.tagName && element.tagName.toUpperCase();
	}

	/*
	 * Copyright 2010-2022 Gildas Lormeau
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

	const processors = { frameTree };
	const helper = {
		COMMENT_HEADER,
		COMMENT_HEADER_LEGACY,
		ON_BEFORE_CAPTURE_EVENT_NAME,
		ON_AFTER_CAPTURE_EVENT_NAME,
		WAIT_FOR_USERSCRIPT_PROPERTY_NAME,
		preProcessDoc,
		postProcessDoc,
		serialize(doc, compressHTML) {
			return process(doc, compressHTML);
		},
		getShadowRoot
	};

	initUserScriptHandler();

	exports.helper = helper;
	exports.processors = processors;

	Object.defineProperty(exports, '__esModule', { value: true });

}));
