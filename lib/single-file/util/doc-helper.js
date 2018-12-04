/*
 * Copyright 2018 Gildas Lormeau
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
		preProcessDoc,
		postProcessDoc,
		serialize,
		windowIdAttributeName,
		preservedSpaceAttributeName,
		removedContentAttributeName,
		imagesAttributeName,
		inputValueAttributeName,
		shadowRootAttributeName,
		removeQuotes
	};

	function preProcessDoc(doc, win, options) {
		doc.querySelectorAll("script").forEach(element => element.textContent = element.textContent.replace(/<\/script>/gi, "<\\/script>"));
		doc.querySelectorAll("noscript").forEach(element => {
			const disabledNoscriptElement = doc.createElement("disabled-noscript");
			Array.from(element.childNodes).forEach(node => disabledNoscriptElement.appendChild(node));
			disabledNoscriptElement.hidden = true;
			element.parentElement.replaceChild(disabledNoscriptElement, element);
		});
		doc.head.querySelectorAll("*:not(base):not(link):not(meta):not(noscript):not(script):not(style):not(template):not(title)").forEach(element => element.hidden = true);
		let canvasData, imageData, usedFonts, shadowRootContents;
		if (win) {
			canvasData = getCanvasData(doc, win);
			imageData = getImageData(doc, win, options);
			if (doc.body && (options.removeHiddenElements || options.removeUnusedStyles || options.compressHTML)) {
				let elementsInfo = getElementsInfo(win, doc.body);
				if (options.removeHiddenElements) {
					const markerRemovedContent = removedContentAttributeName(options.sessionId);
					let ignoredTags = JSON.parse(JSON.stringify(IGNORED_REMOVED_TAG_NAMES));
					if (!options.removeScripts) {
						ignoredTags = ignoredTags.concat("SCRIPT");
					}
					markHiddenCandidates(win, doc.body, elementsInfo, false, markerRemovedContent, new Set(), ignoredTags);
					markHiddenElements(win, doc.body, markerRemovedContent);
					doc.querySelectorAll("iframe").forEach(element => {
						const boundingRect = element.getBoundingClientRect();
						if (element.hidden || element.style.display == "none" || boundingRect.width <= 1 && boundingRect.height <= 1) {
							element.setAttribute(markerRemovedContent, "");
						}
					});
					elementsInfo = new Map(Array.from(elementsInfo).filter(([element]) => element.getAttribute(markerRemovedContent) != ""));
				}
				if (options.removeUnusedStyles) {
					let loadedFonts;
					if (doc.fonts) {
						loadedFonts = Array.from(doc.fonts).filter(font => font.status == "loaded" || font.status == "loading");
					}
					usedFonts = getUsedFonts(elementsInfo, loadedFonts);
				}
				if (options.compressHTML) {
					elementsInfo.forEach((elementInfo, element) => {
						if (elementInfo.whiteSpace.startsWith("pre")) {
							element.setAttribute(preservedSpaceAttributeName(options.sessionId), "");
						}
					});
				}
				elementsInfo.forEach((elementInfo, element) => {
					let elementIndex = 0;
					if (elementInfo.shadowRoot) {
						const attributeName = shadowRootAttributeName(options.sessionId);
						element.setAttribute(attributeName, elementIndex);
						elementIndex++;
						if (!shadowRootContents) {
							shadowRootContents = [];
						}
						shadowRootContents.push({ content: element.shadowRoot.innerHTML, height: element.clientHeight });
					}
				});
			}
		}
		retrieveInputValues(doc, options);
		return {
			canvasData,
			fontsData: getFontsData(doc),
			stylesheetContents: getStylesheetContents(doc),
			imageData,
			postersData: getPostersData(doc),
			usedFonts,
			shadowRootContents
		};
	}

	function getUsedFonts(styles, loadedFonts) {
		const usedFonts = new Set();
		styles.forEach(style => {
			const fontFamilyNames = style.fontFamily.split(",");
			fontFamilyNames.forEach(fontFamilyName => {
				fontFamilyName = normalizeFontFamily(fontFamilyName);
				if (!loadedFonts || loadedFonts.find(font => normalizeFontFamily(font.family) == fontFamilyName && font.style == style.fontStyle && font.variant == style.fontVariant)) {
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
			const computedStyle = win.getComputedStyle(element);
			elementsInfo.set(element, {
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
		});
		return elementsInfo;
	}

	function markHiddenCandidates(win, element, styles, elementHidden, markerRemovedContent, removedCandidates, ignoredTags) {
		const elements = Array.from(element.childNodes).filter(node => node instanceof win.HTMLElement);
		elements.forEach(element => markHiddenCandidates(win, element, styles, elementHidden || testHiddenElement(element, styles.get(element)), markerRemovedContent, removedCandidates, ignoredTags));
		if (elementHidden && !ignoredTags.includes(element.tagName)) {
			if (elements.length) {
				if (!elements.find(element => !removedCandidates.has(element))) {
					removedCandidates.add(element);
					elements.forEach(element => element.setAttribute(markerRemovedContent, ""));
				}
			} else {
				removedCandidates.add(element);
			}
		}
	}

	function markHiddenElements(win, element, markerRemovedContent) {
		const elements = Array.from(element.childNodes).filter(node => node.nodeType == win.Node.ELEMENT_NODE);
		if (element.getAttribute(markerRemovedContent) == "") {
			element.removeAttribute(markerRemovedContent);
		} else {
			elements.forEach(element => markHiddenElements(win, element, markerRemovedContent));
		}
	}

	function testHiddenElement(element, style) {
		let hidden = false;
		if (style) {
			hidden = style.display == "none";
			if (!hidden && (style.opacity == "0" || style.visibility == "hidden")) {
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
		doc.head.querySelectorAll("*:not(base):not(link):not(meta):not(noscript):not(script):not(style):not(template):not(title)").forEach(element => element.removeAttribute("hidden"));
		if (options.removeHiddenElements) {
			doc.querySelectorAll("[" + removedContentAttributeName(options.sessionId) + "]").forEach(element => element.removeAttribute(removedContentAttributeName(options.sessionId)));
		}
		if (options.compressHTML) {
			doc.querySelectorAll("[" + preservedSpaceAttributeName(options.sessionId) + "]").forEach(element => element.removeAttribute(preservedSpaceAttributeName(options.sessionId)));
		}
		doc.querySelectorAll("[" + imagesAttributeName(options.sessionId) + "]").forEach(element => element.removeAttribute(imagesAttributeName(options.sessionId)));
		doc.querySelectorAll("[" + inputValueAttributeName(options.sessionId) + "]").forEach(element => element.removeAttribute(inputValueAttributeName(options.sessionId)));
		doc.querySelectorAll("[" + shadowRootAttributeName(options.sessionId) + "]").forEach(element => element.removeAttribute(shadowRootAttributeName(options.sessionId)));
	}

	function imagesAttributeName(sessionId) {
		return IMAGE_ATTRIBUTE_NAME + (sessionId || "");
	}

	function preservedSpaceAttributeName(sessionId) {
		return PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME + (sessionId || "");
	}

	function shadowRootAttributeName(sessionId) {
		return SHADOW_ROOT_ATTRIBUTE_NAME + (sessionId || "");
	}

	function removedContentAttributeName(sessionId) {
		return REMOVED_CONTENT_ATTRIBUTE_NAME + (sessionId || "");
	}

	function windowIdAttributeName(sessionId) {
		return WIN_ID_ATTRIBUTE_NAME + (sessionId || "");
	}

	function inputValueAttributeName(sessionId) {
		return INPUT_VALUE_ATTRIBUTE_NAME + (sessionId || "");
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
				imageElement.setAttribute(imagesAttributeName(options.sessionId), imageElementIndex);
				const imageData = {
					currentSrc: (options.lazyLoadImages && imageElement.getAttribute(LAZY_SRC_ATTRIBUTE_NAME)) || imageElement.currentSrc
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
		const computedStyle = win.getComputedStyle(imageElement);
		let boxSizingEffective = false;
		const boxSizingValue = imageElement.style.getPropertyValue("box-sizing");
		const boxSizingPriority = imageElement.style.getPropertyPriority("box-sizing");
		const clientWidth = imageElement.clientWidth;
		if (computedStyle.getPropertyValue("box-sizing") == "content-box") {
			imageElement.style.setProperty("box-sizing", "border-box", "important");
		} else {
			imageElement.style.setProperty("box-sizing", "content-box", "important");
		}
		boxSizingEffective = imageElement.clientWidth != clientWidth;
		if (boxSizingValue) {
			imageElement.style.setProperty("box-sizing", boxSizingValue, boxSizingPriority);
		} else {
			imageElement.style.removeProperty("box-sizing");
		}
		let paddingLeft, paddingRight, paddingTop, paddingBottom, borderLeft, borderRight, borderTop, borderBottom;
		paddingLeft = getWidth("padding-left", computedStyle);
		paddingRight = getWidth("padding-right", computedStyle);
		paddingTop = getWidth("padding-top", computedStyle);
		paddingBottom = getWidth("padding-bottom", computedStyle);
		if (boxSizingEffective && computedStyle.getPropertyValue("box-sizing") == "content-box") {
			borderLeft = getWidth("border-left-width", computedStyle);
			borderRight = getWidth("border-right-width", computedStyle);
			borderTop = getWidth("border-top-width", computedStyle);
			borderBottom = getWidth("border-bottom-width", computedStyle);
		} else {
			borderLeft = borderRight = borderTop = borderBottom = 0;
		}
		const width = imageElement.clientWidth;
		const height = imageElement.clientHeight;
		const pxWidth = imageElement.naturalWidth || (width - paddingLeft - paddingRight - borderLeft - borderRight);
		const pxHeight = imageElement.naturalHeight || (height - paddingTop - paddingBottom - borderTop - borderBottom);
		if (width >= 0 && height >= 0 && paddingLeft >= 0 && paddingRight >= 0 && paddingTop >= 0 && paddingBottom >= 0 && borderLeft >= 0 && borderRight >= 0 && borderTop >= 0 && borderBottom >= 0) {
			return {
				width: (paddingLeft || paddingRight || borderLeft || borderRight) && (width - paddingLeft - paddingRight - borderLeft - borderRight) + "px",
				pxWidth: pxWidth,
				height: (paddingTop || paddingBottom || borderTop || borderBottom) && (height - paddingTop - paddingBottom - borderTop - borderBottom) + "px",
				pxHeight: pxHeight,
			};
		}
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

	function retrieveInputValues(doc, options) {
		doc.querySelectorAll("input").forEach(input => input.setAttribute(inputValueAttributeName(options.sessionId), input.value));
		doc.querySelectorAll("input[type=radio], input[type=checkbox]").forEach(input => input.setAttribute(inputValueAttributeName(options.sessionId), input.checked));
		doc.querySelectorAll("textarea").forEach(textarea => textarea.setAttribute(inputValueAttributeName(options.sessionId), textarea.value));
		doc.querySelectorAll("select").forEach(select => {
			select.querySelectorAll("option").forEach(option => {
				if (option.selected) {
					option.setAttribute(inputValueAttributeName(options.sessionId), "");
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