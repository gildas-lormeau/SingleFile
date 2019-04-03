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

/* global hooksFrame */

this.docHelper = this.docHelper || (() => {

	const REMOVED_CONTENT_ATTRIBUTE_NAME = "data-single-file-removed-content";
	const PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME = "data-single-file-preserved-space-element";
	const SHADOW_ROOT_ATTRIBUTE_NAME = "data-single-file-shadow-root-element";
	const WIN_ID_ATTRIBUTE_NAME = "data-frame-tree-win-id";
	const IMAGE_ATTRIBUTE_NAME = "data-single-file-image";
	const INPUT_VALUE_ATTRIBUTE_NAME = "data-single-file-value";
	const LAZY_SRC_ATTRIBUTE_NAME = "data-lazy-loaded-src";
	const IGNORED_REMOVED_TAG_NAMES = ["NOSCRIPT", "DISABLED-NOSCRIPT", "META", "LINK", "STYLE", "TITLE", "TEMPLATE", "SOURCE", "OBJECT"];
	const REGEXP_SIMPLE_QUOTES_STRING = /^'(.*?)'$/;
	const REGEXP_DOUBLE_QUOTES_STRING = /^"(.*?)"$/;
	const FONT_WEIGHTS = {
		normal: "400",
		bold: "700"
	};

	return {
		initDoc,
		preProcessDoc,
		postProcessDoc,
		serialize,
		removeQuotes,
		WIN_ID_ATTRIBUTE_NAME,
		PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME,
		REMOVED_CONTENT_ATTRIBUTE_NAME,
		IMAGE_ATTRIBUTE_NAME,
		INPUT_VALUE_ATTRIBUTE_NAME,
		SHADOW_ROOT_ATTRIBUTE_NAME
	};

	function initDoc(doc) {
		doc.querySelectorAll("meta[http-equiv=refresh]").forEach(element => {
			element.removeAttribute("http-equiv");
			element.setAttribute("disabled-http-equiv", "refresh");
		});
	}

	function preProcessDoc(doc, win, options) {
		doc.querySelectorAll("script").forEach(element => element.textContent = element.textContent.replace(/<\/script>/gi, "<\\/script>"));
		doc.querySelectorAll("noscript").forEach(element => {
			const disabledNoscriptElement = doc.createElement("disabled-noscript");
			Array.from(element.childNodes).forEach(node => disabledNoscriptElement.appendChild(node));
			disabledNoscriptElement.hidden = true;
			element.parentElement.replaceChild(disabledNoscriptElement, element);
		});
		initDoc(doc);
		if (doc.head) {
			doc.head.querySelectorAll("*:not(base):not(link):not(meta):not(noscript):not(script):not(style):not(template):not(title)").forEach(element => element.hidden = true);
		}
		let canvasData, imageData, usedFonts, shadowRootContents;
		if (win) {
			canvasData = getCanvasData(doc, win);
			imageData = getImageData(doc, win, options);
			if (doc.body && (options.removeHiddenElements || options.removeUnusedFonts || options.compressHTML)) {
				let elementsInfo = getElementsInfo(win, doc.body);
				if (options.removeHiddenElements) {
					let ignoredTags = JSON.parse(JSON.stringify(IGNORED_REMOVED_TAG_NAMES));
					if (!options.removeScripts) {
						ignoredTags = ignoredTags.concat("SCRIPT");
					}
					markHiddenCandidates(win, doc.body, elementsInfo, false, new Set(), ignoredTags);
					markHiddenElements(win, doc.body, elementsInfo, imageData);
					doc.querySelectorAll("iframe").forEach(element => {
						if (element.getBoundingClientRect) {
							const boundingRect = element.getBoundingClientRect();
							if (element.hidden || element.style.display == "none" || boundingRect.width <= 1 && boundingRect.height <= 1) {
								element.setAttribute(REMOVED_CONTENT_ATTRIBUTE_NAME, "");
							}
						}
					});
					elementsInfo = new Map(Array.from(elementsInfo).filter(([element]) => !element.attributes || element.getAttribute(REMOVED_CONTENT_ATTRIBUTE_NAME) != ""));
				}
				if (options.removeUnusedFonts) {
					let loadedFonts;
					if (doc.fonts) {
						loadedFonts = Array.from(doc.fonts).filter(font => font.status == "loaded" || font.status == "loading");
					}
					usedFonts = getUsedFonts(elementsInfo, loadedFonts);
				}
				if (options.compressHTML) {
					elementsInfo.forEach((elementInfo, element) => {
						if (element.attributes && elementInfo.whiteSpace.startsWith("pre")) {
							element.setAttribute(PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME, "");
						}
					});
				}
				elementsInfo.forEach((elementInfo, element) => {
					let elementIndex = 0;
					if (element.attributes && elementInfo.shadowRoot) {
						element.setAttribute(SHADOW_ROOT_ATTRIBUTE_NAME, elementIndex);
						elementIndex++;
						if (!shadowRootContents) {
							shadowRootContents = [];
						}
						shadowRootContents.push({ content: element.shadowRoot.innerHTML, height: element.clientHeight });
					}
				});
			}
		}
		retrieveInputValues(doc);
		return {
			canvasData,
			fontsData: getFontsData(doc),
			stylesheetContents: getStylesheetContents(doc),
			imageData,
			postersData: getPostersData(doc),
			usedFonts,
			shadowRootContents,
			referrer: doc.referrer
		};
	}

	function getUsedFonts(styles, loadedFonts) {
		const usedFonts = new Set();
		styles.forEach(style => {
			const fontFamilyNames = style.fontFamily.split(",");
			fontFamilyNames.forEach(fontFamilyName => {
				fontFamilyName = normalizeFontFamily(fontFamilyName);
				if (!loadedFonts || loadedFonts.find(font => normalizeFontFamily(font.family) == fontFamilyName && font.style == style.fontStyle)) {
					const { fontWeight, fontStyle, fontVariant } = style;
					usedFonts.add([fontFamilyName, fontWeight, fontStyle, fontVariant]);
				}
			});
		});
		return Array.from(usedFonts);
	}

	function normalizeFontFamily(fontFamilyName) {
		return removeQuotes(fontFamilyName.trim()).toLowerCase();
	}

	function getElementsInfo(win, element, elementsInfo = new Map()) {
		const elements = Array.from(element.childNodes).filter(node => !win || node instanceof win.Element);
		elements.forEach(element => {
			getElementsInfo(win, element, elementsInfo);
			setInfo(win, element, elementsInfo);
			setInfo(win, element, elementsInfo, ":first-letter");
			setInfo(win, element, elementsInfo, ":before");
			setInfo(win, element, elementsInfo, ":after");
		});
		return elementsInfo;
	}

	function setInfo(win, element, elementsInfo, pseudoElement) {
		const computedStyle = win.getComputedStyle(element, pseudoElement);
		const key = pseudoElement ? { element, pseudoElement } : element;
		elementsInfo.set(key, {
			display: computedStyle.getPropertyValue("display"),
			opacity: computedStyle.getPropertyValue("opacity"),
			visibility: computedStyle.getPropertyValue("visibility"),
			fontFamily: computedStyle.getPropertyValue("font-family"),
			fontWeight: getFontWeight(computedStyle.getPropertyValue("font-weight")),
			fontStyle: computedStyle.getPropertyValue("font-style") || "normal",
			fontVariant: computedStyle.getPropertyValue("font-variant") || "normal",
			whiteSpace: computedStyle.getPropertyValue("white-space"),
			shadowRoot: element.shadowRoot
		});
	}

	function markHiddenCandidates(win, element, styles, elementHidden, removedCandidates, ignoredTags) {
		const elements = Array.from(element.childNodes).filter(node => node instanceof win.HTMLElement);
		elements.forEach(element => markHiddenCandidates(win, element, styles, elementHidden || testHiddenElement(element, styles.get(element)), removedCandidates, ignoredTags));
		if (elementHidden && !ignoredTags.includes(element.tagName)) {
			if (elements.length) {
				if (!elements.find(element => !removedCandidates.has(element))) {
					removedCandidates.add(element);
					elements.forEach(element => element.setAttribute(REMOVED_CONTENT_ATTRIBUTE_NAME, ""));
				}
			} else {
				removedCandidates.add(element);
			}
		}
	}

	function markHiddenElements(win, element, styles, imageData) {
		const elements = Array.from(element.childNodes).filter(node => node.nodeType == win.Node.ELEMENT_NODE);
		if (element.getAttribute(REMOVED_CONTENT_ATTRIBUTE_NAME) == "") {
			element.removeAttribute(REMOVED_CONTENT_ATTRIBUTE_NAME);
			if (element.tagName == "IMG") {
				const imgData = imageData[Number(element.getAttribute(IMAGE_ATTRIBUTE_NAME))];
				if (imgData) {
					imgData.currentSrc = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
				}
			}
		} else {
			elements.forEach(element => markHiddenElements(win, element, styles, imageData));
		}
	}

	function testHiddenElement(element, style) {
		let hidden = false;
		if (style) {
			hidden = style.display == "none";
			if (!hidden && (style.opacity == "0" || style.visibility == "hidden") && element.getBoundingClientRect) {
				const boundingRect = element.getBoundingClientRect();
				hidden = !boundingRect.width && !boundingRect.height;
			}
		}
		return Boolean(hidden);
	}

	function postProcessDoc(doc, options) {
		doc.querySelectorAll("disabled-noscript").forEach(element => {
			const noscriptElement = doc.createElement("noscript");
			Array.from(element.childNodes).forEach(node => noscriptElement.appendChild(node));
			element.parentElement.replaceChild(noscriptElement, element);
		});
		doc.querySelectorAll("meta[disabled-http-equiv]").forEach(element => {
			element.setAttribute("http-equiv", element.getAttribute("disabled-http-equiv"));
			element.removeAttribute("disabled-http-equiv");
		});
		if (doc.head) {
			doc.head.querySelectorAll("*:not(base):not(link):not(meta):not(noscript):not(script):not(style):not(template):not(title)").forEach(element => element.removeAttribute("hidden"));
		}
		if (options.removeHiddenElements) {
			doc.querySelectorAll("[" + REMOVED_CONTENT_ATTRIBUTE_NAME + "]").forEach(element => element.removeAttribute(REMOVED_CONTENT_ATTRIBUTE_NAME));
		}
		if (options.compressHTML) {
			doc.querySelectorAll("[" + PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME + "]").forEach(element => element.removeAttribute(PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME));
		}
		doc.querySelectorAll("[" + IMAGE_ATTRIBUTE_NAME + "]").forEach(element => element.removeAttribute(IMAGE_ATTRIBUTE_NAME));
		doc.querySelectorAll("[" + INPUT_VALUE_ATTRIBUTE_NAME + "]").forEach(element => element.removeAttribute(INPUT_VALUE_ATTRIBUTE_NAME));
		doc.querySelectorAll("[" + SHADOW_ROOT_ATTRIBUTE_NAME + "]").forEach(element => element.removeAttribute(SHADOW_ROOT_ATTRIBUTE_NAME));
	}

	function getCanvasData(doc, win) {
		if (doc) {
			const canvasData = [];
			doc.querySelectorAll("canvas").forEach(canvasElement => {
				try {
					const size = getSize(win, canvasElement);
					canvasData.push({ dataURI: canvasElement.toDataURL("image/png", ""), width: size.width, height: size.height });
				} catch (error) {
					canvasData.push(null);
				}
			});
			return canvasData;
		}
	}

	function getStylesheetContents(doc) {
		if (doc) {
			const contents = [];
			doc.querySelectorAll("style").forEach((styleElement, styleIndex) => {
				let stylesheet;
				try {
					const tempStyleElement = doc.createElement("style");
					tempStyleElement.textContent = styleElement.textContent;
					doc.body.appendChild(tempStyleElement);
					stylesheet = tempStyleElement.sheet;
					tempStyleElement.remove();
					if (!stylesheet || stylesheet.cssRules.length != styleElement.sheet.cssRules.length) {
						contents[styleIndex] = Array.from(styleElement.sheet.cssRules).map(cssRule => cssRule.cssText).join("\n");
					}
				} catch (error) {
					/* ignored */
				}
			});
			return contents;
		}
	}

	function getImageData(doc, win, options) {
		if (doc) {
			const data = [];
			doc.querySelectorAll("img").forEach((imageElement, imageElementIndex) => {
				imageElement.setAttribute(IMAGE_ATTRIBUTE_NAME, imageElementIndex);
				const imageData = {
					currentSrc: (options.loadDeferredImages && imageElement.getAttribute(LAZY_SRC_ATTRIBUTE_NAME)) || imageElement.currentSrc
				};
				imageElement.removeAttribute(LAZY_SRC_ATTRIBUTE_NAME);
				const computedStyle = win.getComputedStyle(imageElement);
				if (computedStyle) {
					imageData.size = getSize(win, imageElement);
					if ((!computedStyle.getPropertyValue("box-shadow") || computedStyle.getPropertyValue("box-shadow") == "none") &&
						(!computedStyle.getPropertyValue("background-image") || computedStyle.getPropertyValue("background-image") == "none") &&
						(imageData.size.pxWidth > 1 || imageData.size.pxHeight > 1)) {
						imageData.replaceable = true;
						imageData.backgroundColor = computedStyle.getPropertyValue("background-color");
						imageData.objectFit = computedStyle.getPropertyValue("object-fit");
						imageData.boxSizing = computedStyle.getPropertyValue("box-sizing");
						imageData.objectPosition = computedStyle.getPropertyValue("object-position");
					}
				}
				data.push(imageData);
			});
			return data;
		}
	}

	function getSize(win, imageElement) {
		let pxWidth = imageElement.naturalWidth;
		let pxHeight = imageElement.naturalHeight;
		if (!pxWidth && !pxHeight) {
			const computedStyle = win.getComputedStyle(imageElement);
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
		}
		return { pxWidth, pxHeight };
	}

	function getWidth(styleName, computedStyle) {
		if (computedStyle.getPropertyValue(styleName).endsWith("px")) {
			return parseFloat(computedStyle.getPropertyValue(styleName));
		}
	}

	function getPostersData(doc) {
		if (doc) {
			const postersData = [];
			doc.querySelectorAll("video").forEach(videoElement => {
				if (videoElement.poster) {
					postersData.push(null);
				} else {
					const canvasElement = doc.createElement("canvas");
					const context = canvasElement.getContext("2d");
					canvasElement.width = videoElement.clientWidth;
					canvasElement.height = videoElement.clientHeight;
					try {
						context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
						postersData.push(canvasElement.toDataURL("image/png", ""));
					} catch (error) {
						postersData.push(null);
					}
				}
			});
			return postersData;
		}
	}

	function getFontsData() {
		if (typeof hooksFrame != "undefined") {
			return hooksFrame.getFontsData();
		}
	}

	function retrieveInputValues(doc) {
		doc.querySelectorAll("input").forEach(input => input.setAttribute(INPUT_VALUE_ATTRIBUTE_NAME, input.value));
		doc.querySelectorAll("input[type=radio], input[type=checkbox]").forEach(input => input.setAttribute(INPUT_VALUE_ATTRIBUTE_NAME, input.checked));
		doc.querySelectorAll("textarea").forEach(textarea => textarea.setAttribute(INPUT_VALUE_ATTRIBUTE_NAME, textarea.value));
		doc.querySelectorAll("select").forEach(select => {
			select.querySelectorAll("option").forEach(option => {
				if (option.selected) {
					option.setAttribute(INPUT_VALUE_ATTRIBUTE_NAME, "");
				}
			});
		});
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
		return FONT_WEIGHTS[weight] || weight;
	}

})();