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

/* global globalThis, CustomEvent */

import * as cssUnescape from "./vendor/css-unescape.js";
import * as hooksFrames from "./processors/hooks/content/content-hooks-frames";

const ON_BEFORE_CAPTURE_EVENT_NAME = "single-file-on-before-capture";
const ON_AFTER_CAPTURE_EVENT_NAME = "single-file-on-after-capture";
const REMOVED_CONTENT_ATTRIBUTE_NAME = "data-single-file-removed-content";
const HIDDEN_CONTENT_ATTRIBUTE_NAME = "data-single-file-hidden-content";
const KEPT_CONTENT_ATTRIBUTE_NAME = "data-single-file-kept-content";
const HIDDEN_FRAME_ATTRIBUTE_NAME = "data-single-file-hidden-frame";
const PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME = "data-single-file-preserved-space-element";
const SHADOW_ROOT_ATTRIBUTE_NAME = "data-single-file-shadow-root-element";
const WIN_ID_ATTRIBUTE_NAME = "data-single-file-win-id";
const IMAGE_ATTRIBUTE_NAME = "data-single-file-image";
const POSTER_ATTRIBUTE_NAME = "data-single-file-poster";
const CANVAS_ATTRIBUTE_NAME = "data-single-file-canvas";
const HTML_IMPORT_ATTRIBUTE_NAME = "data-single-file-import";
const STYLE_ATTRIBUTE_NAME = "data-single-file-movable-style";
const INPUT_VALUE_ATTRIBUTE_NAME = "data-single-file-input-value";
const LAZY_SRC_ATTRIBUTE_NAME = "data-single-file-lazy-loaded-src";
const STYLESHEET_ATTRIBUTE_NAME = "data-single-file-stylesheet";
const DISABLED_NOSCRIPT_ATTRIBUTE_NAME = "data-single-file-disabled-noscript";
const SELECTED_CONTENT_ATTRIBUTE_NAME = "data-single-file-selected-content";
const ASYNC_SCRIPT_ATTRIBUTE_NAME = "data-single-file-async-script";
const FLOW_ELEMENTS_SELECTOR = "*:not(base):not(link):not(meta):not(noscript):not(script):not(style):not(template):not(title)";
const KEPT_TAG_NAMES = ["NOSCRIPT", "DISABLED-NOSCRIPT", "META", "LINK", "STYLE", "TITLE", "TEMPLATE", "SOURCE", "OBJECT", "SCRIPT", "HEAD"];
const REGEXP_SIMPLE_QUOTES_STRING = /^'(.*?)'$/;
const REGEXP_DOUBLE_QUOTES_STRING = /^"(.*?)"$/;
const FONT_WEIGHTS = {
	regular: "400",
	normal: "400",
	bold: "700",
	bolder: "700",
	lighter: "100"
};
const COMMENT_HEADER = "Page saved with SingleFile";
const COMMENT_HEADER_LEGACY = "Archive processed by SingleFile";
const SINGLE_FILE_UI_ELEMENT_CLASS = "single-file-ui-element";
const addEventListener = (type, listener, options) => globalThis.addEventListener(type, listener, options);
const dispatchEvent = event => globalThis.dispatchEvent(event);

export {
	initUserScriptHandler,
	initDoc,
	preProcessDoc,
	postProcessDoc,
	serialize,
	removeQuotes,
	flatten,
	getFontWeight,
	normalizeFontFamily,
	getShadowRoot,
	ON_BEFORE_CAPTURE_EVENT_NAME,
	ON_AFTER_CAPTURE_EVENT_NAME,
	WIN_ID_ATTRIBUTE_NAME,
	PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME,
	REMOVED_CONTENT_ATTRIBUTE_NAME,
	HIDDEN_CONTENT_ATTRIBUTE_NAME,
	HIDDEN_FRAME_ATTRIBUTE_NAME,
	IMAGE_ATTRIBUTE_NAME,
	POSTER_ATTRIBUTE_NAME,
	CANVAS_ATTRIBUTE_NAME,
	INPUT_VALUE_ATTRIBUTE_NAME,
	SHADOW_ROOT_ATTRIBUTE_NAME,
	HTML_IMPORT_ATTRIBUTE_NAME,
	STYLE_ATTRIBUTE_NAME,
	LAZY_SRC_ATTRIBUTE_NAME,
	STYLESHEET_ATTRIBUTE_NAME,
	SELECTED_CONTENT_ATTRIBUTE_NAME,
	ASYNC_SCRIPT_ATTRIBUTE_NAME,
	COMMENT_HEADER,
	COMMENT_HEADER_LEGACY,
	SINGLE_FILE_UI_ELEMENT_CLASS
};

function initUserScriptHandler() {
	addEventListener("single-file-user-script-init", () => globalThis._singleFile_waitForUserScript = async eventPrefixName => {
		const event = new CustomEvent(eventPrefixName + "-request", { cancelable: true });
		const promiseResponse = new Promise(resolve => addEventListener(eventPrefixName + "-response", resolve));
		dispatchEvent(event);
		if (event.defaultPrevented) {
			await promiseResponse;
		}
	});
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
	let elementsInfo;
	if (win && doc.documentElement) {
		elementsInfo = getElementsInfo(win, doc, doc.documentElement, options);
		if (options.moveStylesInHead) {
			doc.querySelectorAll("body style, body ~ style").forEach(element => {
				const computedStyle = win.getComputedStyle(element);
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
			usedFonts: [],
			shadowRoots: [],
			imports: [],
			markedElements: []
		};
	}
	return {
		canvases: elementsInfo.canvases,
		fonts: getFontsData(doc),
		stylesheets: getStylesheetsData(doc),
		images: elementsInfo.images,
		posters: elementsInfo.posters,
		usedFonts: Array.from(elementsInfo.usedFonts.values()),
		shadowRoots: elementsInfo.shadowRoots,
		imports: elementsInfo.imports,
		referrer: doc.referrer,
		markedElements: elementsInfo.markedElements
	};
}

function getElementsInfo(win, doc, element, options, data = { usedFonts: new Map(), canvases: [], images: [], posters: [], shadowRoots: [], imports: [], markedElements: [] }, ascendantHidden) {
	const elements = Array.from(element.childNodes).filter(node => (node instanceof win.HTMLElement) || (node instanceof win.SVGElement));
	elements.forEach(element => {
		let elementHidden, elementKept, computedStyle;
		if (!options.autoSaveExternalSave && (options.removeHiddenElements || options.removeUnusedFonts || options.compressHTML)) {
			computedStyle = win.getComputedStyle(element);
			if (element instanceof win.HTMLElement) {
				if (options.removeHiddenElements) {
					elementKept = ((ascendantHidden || element.closest("html > head")) && KEPT_TAG_NAMES.includes(element.tagName)) || element.closest("details");
					if (!elementKept) {
						elementHidden = ascendantHidden || testHiddenElement(element, computedStyle);
						if (elementHidden) {
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
					getUsedFont(win.getComputedStyle(element, ":first-letter"), options, data.usedFonts);
					getUsedFont(win.getComputedStyle(element, ":before"), options, data.usedFonts);
					getUsedFont(win.getComputedStyle(element, ":after"), options, data.usedFonts);
				}
			}
		}
		getResourcesInfo(win, doc, element, options, data, elementHidden, computedStyle);
		const shadowRoot = !(element instanceof win.SVGElement) && getShadowRoot(element);
		if (shadowRoot && !element.classList.contains(SINGLE_FILE_UI_ELEMENT_CLASS)) {
			const shadowRootInfo = {};
			element.setAttribute(SHADOW_ROOT_ATTRIBUTE_NAME, data.shadowRoots.length);
			data.markedElements.push(element);
			data.shadowRoots.push(shadowRootInfo);
			getElementsInfo(win, doc, shadowRoot, options, data, elementHidden);
			shadowRootInfo.content = shadowRoot.innerHTML;
			shadowRootInfo.delegatesFocus = shadowRoot.delegatesFocus;
			shadowRootInfo.mode = shadowRoot.mode;
			if (shadowRoot.adoptedStyleSheets && shadowRoot.adoptedStyleSheets.length) {
				shadowRootInfo.adoptedStyleSheets = Array.from(shadowRoot.adoptedStyleSheets).map(stylesheet => Array.from(stylesheet.cssRules).map(cssRule => cssRule.cssText).join("\n"));
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
	return data;
}

function getResourcesInfo(win, doc, element, options, data, elementHidden, computedStyle) {
	if (element.tagName == "CANVAS") {
		try {
			data.canvases.push({ dataURI: element.toDataURL("image/png", "") });
			element.setAttribute(CANVAS_ATTRIBUTE_NAME, data.canvases.length - 1);
			data.markedElements.push(element);
		} catch (error) {
			// ignored
		}
	}
	if (element.tagName == "IMG") {
		const imageData = {
			currentSrc: elementHidden ?
				"data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" :
				(options.loadDeferredImages && element.getAttribute(LAZY_SRC_ATTRIBUTE_NAME)) || element.currentSrc
		};
		data.images.push(imageData);
		element.setAttribute(IMAGE_ATTRIBUTE_NAME, data.images.length - 1);
		data.markedElements.push(element);
		element.removeAttribute(LAZY_SRC_ATTRIBUTE_NAME);
		computedStyle = computedStyle || win.getComputedStyle(element);
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
	if (element.tagName == "VIDEO") {
		if (!element.poster) {
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
	if (element.tagName == "IFRAME") {
		if (elementHidden && options.removeHiddenElements) {
			element.setAttribute(HIDDEN_FRAME_ATTRIBUTE_NAME, "");
			data.markedElements.push(element);
		}
	}
	if (element.tagName == "LINK") {
		if (element.import && element.import.documentElement) {
			data.imports.push({ content: serialize(element.import) });
			element.setAttribute(HTML_IMPORT_ATTRIBUTE_NAME, data.imports.length - 1);
			data.markedElements.push(element);
		}
	}
	if (element.tagName == "INPUT") {
		if (element.type != "password") {
			element.setAttribute(INPUT_VALUE_ATTRIBUTE_NAME, element.value);
			data.markedElements.push(element);
		}
		if (element.type == "radio" || element.type == "checkbox") {
			element.setAttribute(INPUT_VALUE_ATTRIBUTE_NAME, element.checked);
			data.markedElements.push(element);
		}
	}
	if (element.tagName == "TEXTAREA") {
		element.setAttribute(INPUT_VALUE_ATTRIBUTE_NAME, element.value);
		data.markedElements.push(element);
	}
	if (element.tagName == "SELECT") {
		element.querySelectorAll("option").forEach(option => {
			if (option.selected) {
				option.setAttribute(INPUT_VALUE_ATTRIBUTE_NAME, "");
				data.markedElements.push(option);
			}
		});
	}
	if (element.tagName == "SCRIPT") {
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
				usedFonts.set(JSON.stringify(value), [fontFamilyName, fontWeight, fontStyle, fontVariant]);
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
	return removeQuotes(cssUnescape.process(fontFamilyName.trim())).toLowerCase();
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

function postProcessDoc(doc, markedElements) {
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
		const singleFileAttributes = [REMOVED_CONTENT_ATTRIBUTE_NAME, HIDDEN_FRAME_ATTRIBUTE_NAME, HIDDEN_CONTENT_ATTRIBUTE_NAME, PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME, IMAGE_ATTRIBUTE_NAME, POSTER_ATTRIBUTE_NAME, CANVAS_ATTRIBUTE_NAME, INPUT_VALUE_ATTRIBUTE_NAME, SHADOW_ROOT_ATTRIBUTE_NAME, HTML_IMPORT_ATTRIBUTE_NAME, STYLESHEET_ATTRIBUTE_NAME, ASYNC_SCRIPT_ATTRIBUTE_NAME];
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
		element.removeAttribute(CANVAS_ATTRIBUTE_NAME);
		element.removeAttribute(INPUT_VALUE_ATTRIBUTE_NAME);
		element.removeAttribute(SHADOW_ROOT_ATTRIBUTE_NAME);
		element.removeAttribute(HTML_IMPORT_ATTRIBUTE_NAME);
		element.removeAttribute(STYLESHEET_ATTRIBUTE_NAME);
		element.removeAttribute(ASYNC_SCRIPT_ATTRIBUTE_NAME);
		element.removeAttribute(STYLE_ATTRIBUTE_NAME);
	});
}

function getStylesheetsData(doc) {
	if (doc) {
		const contents = [];
		doc.querySelectorAll("style").forEach((styleElement, styleIndex) => {
			try {
				const tempStyleElement = doc.createElement("style");
				tempStyleElement.textContent = styleElement.textContent;
				doc.body.appendChild(tempStyleElement);
				const stylesheet = tempStyleElement.sheet;
				tempStyleElement.remove();
				if (!stylesheet || stylesheet.cssRules.length != styleElement.sheet.cssRules.length) {
					styleElement.setAttribute(STYLESHEET_ATTRIBUTE_NAME, styleIndex);
					contents[styleIndex] = Array.from(styleElement.sheet.cssRules).map(cssRule => cssRule.cssText).join("\n");
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
		computedStyle = computedStyle || win.getComputedStyle(imageElement);
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
	return { pxWidth, pxHeight };
}

function getWidth(styleName, computedStyle) {
	if (computedStyle.getPropertyValue(styleName).endsWith("px")) {
		return parseFloat(computedStyle.getPropertyValue(styleName));
	}
}

function getFontsData() {
	return hooksFrames.getFontsData();
}

function serialize(doc) {
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

function flatten(array) {
	return array.flat ? array.flat() : array.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []);
}