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

/* global fontFaceProxy, getComputedStyle, Node */

this.docHelper = this.docHelper || (() => {

	const REMOVED_CONTENT_ATTRIBUTE_NAME = "data-single-file-removed-content";
	const REMOVED_CANDIDATE_ATTRIBUTE_NAME = "data-single-file-removed-candidate";
	const PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME = "data-single-file-preserved-space-element";
	const WIN_ID_ATTRIBUTE_NAME = "data-frame-tree-win-id";
	const RESPONSIVE_IMAGE_ATTRIBUTE_NAME = "data-single-file-responsive-image";
	const IMAGE_ATTRIBUTE_NAME = "data-single-file-image";
	const INPUT_VALUE_ATTRIBUTE_NAME = "data-single-file-value";
	const SHEET_ATTRIBUTE_NAME = "data-single-file-sheet";
	const IGNORED_REMOVED_TAG_NAMES = ["NOSCRIPT", "DISABLED-NOSCRIPT", "META", "LINK", "STYLE", "TITLE", "TEMPLATE", "SOURCE", "OBJECT"];

	return {
		preProcessDoc,
		postProcessDoc,
		serialize,
		windowIdAttributeName,
		preservedSpaceAttributeName,
		removedContentAttributeName,
		responsiveImagesAttributeName,
		imagesAttributeName,
		inputValueAttributeName,
		sheetAttributeName
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
		if (options.removeHiddenElements) {
			const markerRemovedContent = removedContentAttributeName(options.sessionId);
			const markerRemovedCandidate = removedCandidateAttributeName(options.sessionId);
			let ignoredTags = JSON.parse(JSON.stringify(IGNORED_REMOVED_TAG_NAMES));
			if (!options.removeFrame) {
				ignoredTags = ignoredTags.concat(...["IFRAME", "FRAME"]);
			}
			if (!options.removeScripts) {
				ignoredTags = ignoredTags.concat("SCRIPT");
			}
			if (win) {
				markHiddenCandidates(win, doc.body, markerRemovedContent, markerRemovedCandidate, ignoredTags);
				markHiddenElements(win, doc.body, markerRemovedContent);
			}
			doc.querySelectorAll(("[" + markerRemovedCandidate + "]")).forEach(element => element.removeAttribute(markerRemovedCandidate));
		}
		if (win && options.compressHTML) {
			doc.querySelectorAll("*").forEach(element => {
				const style = win.getComputedStyle(element);
				if (style && style.whiteSpace.startsWith("pre")) {
					element.setAttribute(preservedSpaceAttributeName(options.sessionId), "");
				}
			});
		}
		retrieveInputValues(doc, options);
		return {
			canvasData: getCanvasData(doc),
			fontsData: getFontsData(doc),
			stylesheetContents: getStylesheetContents(doc),
			responsiveImageData: getResponsiveImageData(doc, options),
			imageData: getImageData(doc, options),
			postersData: getPostersData(doc)
		};
	}

	function markHiddenCandidates(win, element, markerRemovedContent, markerRemovedCandidateStage, ignoredTags) {
		const elements = Array.from(element.childNodes).filter(node => node.nodeType == Node.ELEMENT_NODE);
		elements.forEach(element => markHiddenCandidates(win, element, markerRemovedContent, markerRemovedCandidateStage, ignoredTags));
		if (elements.length) {
			const hiddenCandidate = !elements.find(element => element.getAttribute(markerRemovedCandidateStage) !== "");
			if (hiddenCandidate) {
				if (hiddenElement(element, ignoredTags) && element instanceof win.HTMLElement) {
					element.setAttribute(markerRemovedCandidateStage, "");
					elements.forEach(element => {
						if (element instanceof win.HTMLElement) {
							element.setAttribute(markerRemovedContent, "");
						}
					});
				}
			}
		} else if (hiddenElement(element, ignoredTags)) {
			element.setAttribute(markerRemovedCandidateStage, "");
		}
	}

	function markHiddenElements(win, element, markerRemovedContent) {
		const elements = Array.from(element.childNodes).filter(node => node.nodeType == Node.ELEMENT_NODE);
		elements.forEach(element => markHiddenElements(win, element, markerRemovedContent));
		if (element.parentElement.getAttribute(REMOVED_CONTENT_ATTRIBUTE_NAME) != "") {
			element.removeAttribute(REMOVED_CONTENT_ATTRIBUTE_NAME);
		}
	}

	function hiddenElement(element, ignoredTags) {
		if (ignoredTags.includes(element.tagName)) {
			return false;
		} else {
			let hidden = element.hidden || (element.style && (element.style.display == "none" || element.style.opacity == "0" || element.style.visibility == "hidden"));
			if (!hidden) {
				const boundingRect = element.getBoundingClientRect();
				hidden = !boundingRect.width && !boundingRect.height;
			}
			return hidden;
		}
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
		doc.querySelectorAll("[" + responsiveImagesAttributeName(options.sessionId) + "]").forEach(element => element.removeAttribute(responsiveImagesAttributeName(options.sessionId)));
		doc.querySelectorAll("[" + imagesAttributeName(options.sessionId) + "]").forEach(element => element.removeAttribute(imagesAttributeName(options.sessionId)));
		doc.querySelectorAll("[" + inputValueAttributeName(options.sessionId) + "]").forEach(element => element.removeAttribute(inputValueAttributeName(options.sessionId)));
	}

	function responsiveImagesAttributeName(sessionId) {
		return RESPONSIVE_IMAGE_ATTRIBUTE_NAME + (sessionId ? "-" + sessionId : "");
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

	function removedCandidateAttributeName(sessionId) {
		return REMOVED_CANDIDATE_ATTRIBUTE_NAME + (sessionId || "");
	}

	function windowIdAttributeName(sessionId) {
		return WIN_ID_ATTRIBUTE_NAME + (sessionId || "");
	}

	function inputValueAttributeName(sessionId) {
		return INPUT_VALUE_ATTRIBUTE_NAME + (sessionId || "");
	}

	function sheetAttributeName(sessionId) {
		return SHEET_ATTRIBUTE_NAME + (sessionId || "");
	}

	function getCanvasData(doc) {
		if (doc) {
			const canvasData = [];
			doc.querySelectorAll("canvas").forEach(canvasElement => {
				try {
					const size = getSize(canvasElement);
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

	function getImageData(doc, options) {
		if (doc) {
			const data = [];
			doc.querySelectorAll("img[src]").forEach((imageElement, imageElementIndex) => {
				const computedStyle = getComputedStyle(imageElement);
				let imageData = {}, size = getSize(imageElement);
				if (imageElement.src && size && (!computedStyle.getPropertyValue("background-image") || computedStyle.getPropertyValue("background-image") == "none")) {
					imageElement.setAttribute(imagesAttributeName(options.sessionId), imageElementIndex);
					imageData = size;
				}
				data.push(imageData);
			});
			return data;
		}
	}

	function getSize(imageElement) {
		const computedStyle = getComputedStyle(imageElement);
		const paddingLeft = getWidth("padding-left", computedStyle);
		const paddingRight = getWidth("padding-right", computedStyle);
		const paddingTop = getWidth("padding-top", computedStyle);
		const paddingBottom = getWidth("padding-bottom", computedStyle);
		const width = imageElement.clientWidth;
		const height = imageElement.clientHeight;
		if (width >= 0 && height >= 0 && paddingLeft >= 0 && paddingRight >= 0 && paddingTop >= 0 && paddingBottom >= 0) {
			return {
				width: (paddingLeft || paddingRight) && (width - paddingLeft - paddingRight) + "px",
				pxWidth: Math.round(width - paddingLeft - paddingRight),
				height: (paddingLeft || paddingRight) && (height - paddingTop - paddingBottom) + "px",
				pxHeight: Math.round(height - paddingTop - paddingBottom),
			};
		}
	}

	function getWidth(styleName, computedStyle) {
		if (computedStyle.getPropertyValue(styleName).endsWith("px")) {
			return parseFloat(computedStyle.getPropertyValue(styleName));
		}
	}

	function getResponsiveImageData(doc, options) {
		if (doc) {
			const data = [];
			doc.querySelectorAll("picture, img[srcset]").forEach((element, elementIndex) => {
				const tagName = element.tagName.toLowerCase();
				let imageData = {}, imageElement;
				element.setAttribute(responsiveImagesAttributeName(options.sessionId), elementIndex);
				if (tagName == "picture") {
					const sources = Array.from(element.querySelectorAll("source")).map(sourceElement => (
						{ src: sourceElement.src, srcset: sourceElement.srcset }
					));
					imageElement = element.querySelector("img");
					imageData.sources = sources;
				}
				if (tagName == "img") {
					imageElement = element;
				}
				if (imageElement) {
					let naturalWidth = imageElement.naturalWidth;
					let naturalHeight = imageElement.naturalHeight;
					if (naturalWidth <= 1 && naturalHeight <= 1) {
						const imgElement = doc.createElement("img");
						imgElement.src = imageElement.src;
						doc.body.appendChild(imgElement);
						naturalWidth = imgElement.width;
						naturalHeight = imgElement.height;
						imgElement.remove();
					}
					imageData.source = {
						clientWidth: imageElement.clientWidth,
						clientHeight: imageElement.clientHeight,
						naturalWidth: naturalWidth,
						naturalHeight: naturalHeight,
						width: imageElement.width,
						height: imageElement.height,
						src: (!imageElement.currentSrc.startsWith("data:") && imageElement.currentSrc) || (!imageElement.src.startsWith("data:") && imageElement.src)
					};
				}
				data.push(imageData);
			});
			return data;
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

})();