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

/* global fontFaceProxy */

this.docHelper = this.docHelper || (() => {

	const REMOVED_CONTENT_ATTRIBUTE_NAME = "data-single-file-removed-content";
	const PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME = "data-single-file-preserved-space-element";
	const WIN_ID_ATTRIBUTE_NAME = "data-frame-tree-win-id";
	const IMAGE_ATTRIBUTE_NAME = "data-single-file-image";
	const INPUT_VALUE_ATTRIBUTE_NAME = "data-single-file-value";
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
		let canvasData, imageData, usedFonts;
		if (win) {
			canvasData = getCanvasData(doc, win);
			imageData = getImageData(doc, win, options);
			if (options.removeHiddenElements || options.removeUnusedStyles || options.compressHTML) {
				let styles = getStyles(win, doc.body);
				if (options.removeHiddenElements) {
					const markerRemovedContent = removedContentAttributeName(options.sessionId);
					let ignoredTags = JSON.parse(JSON.stringify(IGNORED_REMOVED_TAG_NAMES));
					if (!options.removeScripts) {
						ignoredTags = ignoredTags.concat("SCRIPT");
					}
					markHiddenCandidates(win, doc.body, styles, false, markerRemovedContent, new Set(), ignoredTags);
					markHiddenElements(win, doc.body, markerRemovedContent);
					doc.querySelectorAll("iframe").forEach(element => {
						const boundingRect = element.getBoundingClientRect();
						if (element.hidden || element.style.display == "none" || boundingRect.width <= 1 && boundingRect.height <= 1) {
							element.setAttribute(markerRemovedContent, "");
						}
					});
					styles = new Map(Array.from(styles).filter(([element]) => element.getAttribute(markerRemovedContent) != ""));
				}
				if (options.removeUnusedStyles) {
					usedFonts = getUsedFonts(styles);
				}
				if (options.compressHTML) {
					styles.forEach((style, element) => {
						if (style.whiteSpace.startsWith("pre")) {
							element.setAttribute(preservedSpaceAttributeName(options.sessionId), "");
						}
					});
				}
			}
		}
		retrieveInputValues(doc, options);
		return {
			canvasData,
			fontsData: getFontsData(doc),
			stylesheetContents: getStylesheetContents(doc),
			imageData,
			postersData: getPostersData(doc),
			usedFonts
		};
	}

	function getUsedFonts(styles) {
		const usedFonts = new Set();
		styles.forEach(style => {
			const fontFamilyNames = style.fontFamily.split(",");
			fontFamilyNames.forEach(fontFamilyName => {
				style.fontFamily = removeQuotes(fontFamilyName).toLowerCase().trim();
				usedFonts.add(getFontKey(style));
			});
		});
		return Array.from(usedFonts).map(key => {
			const [fontFamily, fontWeight, fontStyle, fontVariant] = JSON.parse(key);
			return { fontFamily, fontWeight, fontStyle, fontVariant };
		});
	}

	function getStyles(win, element, styles = new Map()) {
		const elements = Array.from(element.childNodes).filter(node => node instanceof win.HTMLElement);
		elements.forEach(element => {
			getStyles(win, element, styles);
			const computedStyle = win.getComputedStyle(element);
			styles.set(element, {
				display: computedStyle.getPropertyValue("display"),
				opacity: computedStyle.getPropertyValue("opacity"),
				visibility: computedStyle.getPropertyValue("visibility"),
				fontFamily: computedStyle.getPropertyValue("font-family"),
				fontWeight: getFontWeight(computedStyle.getPropertyValue("font-weight")),
				fontStyle: computedStyle.getPropertyValue("font-style") || "normal",
				fontVariant: computedStyle.getPropertyValue("font-variant") || "normal",
				whiteSpace: computedStyle.getPropertyValue("white-space")
			});
		});
		return styles;
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
	}

	function imagesAttributeName(sessionId) {
		return IMAGE_ATTRIBUTE_NAME + (sessionId || "");
	}

	function preservedSpaceAttributeName(sessionId) {
		return PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME + (sessionId || "");
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
						contents[styleIndex] = Array.from(styleElement.sheet.cssRules).map(rule => rule.cssText).join("\n");
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
					currentSrc: (options.lazyLoadImages && imageElement.getAttribute("data-lazy-loaded-src")) || imageElement.currentSrc
				};
				imageElement.removeAttribute("data-lazy-loaded-src");
				const computedStyle = win.getComputedStyle(imageElement);
				if (computedStyle) {
					imageData.size = getSize(win, imageElement);
					if ((!computedStyle.getPropertyValue("background-image") || computedStyle.getPropertyValue("background-image") == "none") && (imageData.size.pxWidth > 1 || imageData.size.pxHeight > 1)) {
						imageData.replaceable = true;
						imageData.backgroundColor = computedStyle.getPropertyValue("background-color");
						imageData.objectFit = computedStyle.getPropertyValue("object-fit");
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
		let paddingLeft, paddingRight, paddingTop, paddingBottom, borderLeft, borderRight, borderTop, borderBottom;
		paddingLeft = getWidth("padding-left", computedStyle);
		paddingRight = getWidth("padding-right", computedStyle);
		paddingTop = getWidth("padding-top", computedStyle);
		paddingBottom = getWidth("padding-bottom", computedStyle);
		if (computedStyle.getPropertyValue("box-sizing") == "content-box") {
			borderLeft = getWidth("border-left-width", computedStyle);
			borderRight = getWidth("border-right-width", computedStyle);
			borderTop = getWidth("border-top-width", computedStyle);
			borderBottom = getWidth("border-bottom-width", computedStyle);
		} else {
			borderLeft = borderRight = borderTop = borderBottom = 0;
		}
		const width = imageElement.clientWidth;
		const height = imageElement.clientHeight;
		if (width >= 0 && height >= 0 && paddingLeft >= 0 && paddingRight >= 0 && paddingTop >= 0 && paddingBottom >= 0 && borderLeft >= 0 && borderRight >= 0 && borderTop >= 0 && borderBottom >= 0) {
			return {
				width: (paddingLeft || paddingRight || borderLeft || borderRight) && (width - paddingLeft - paddingRight - borderLeft - borderRight) + "px",
				pxWidth: width - paddingLeft - paddingRight - borderLeft - borderRight,
				height: (paddingTop || paddingBottom || borderTop || borderBottom) && (height - paddingTop - paddingBottom - borderTop - borderBottom) + "px",
				pxHeight: height - paddingTop - paddingBottom - borderTop - borderBottom,
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
		if (typeof fontFaceProxy != "undefined") {
			return fontFaceProxy.getFontsData();
		}
	}

	function retrieveInputValues(doc, options) {
		doc.querySelectorAll("input").forEach(input => input.setAttribute(inputValueAttributeName(options.sessionId), input.value));
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

	function getFontKey(style) {
		return JSON.stringify([
			style.fontFamily,
			style.fontWeight,
			style.fontStyle,
			style.fontVariant
		]);
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