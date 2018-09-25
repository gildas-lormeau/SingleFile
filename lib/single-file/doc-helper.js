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

/* global fontFaceProxy, getComputedStyle */

this.docHelper = this.docHelper || (() => {

	const REMOVED_CONTENT_ATTRIBUTE_NAME = "data-single-file-removed-content";
	const PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME = "data-single-file-preserved-space-element";
	const WIN_ID_ATTRIBUTE_NAME = "data-frame-tree-win-id";
	const RESPONSIVE_IMAGE_ATTRIBUTE_NAME = "data-single-file-responsive-image";
	const IMAGE_ATTRIBUTE_NAME = "data-single-file-image";
	const INPUT_VALUE_ATTRIBUTE_NAME = "data-single-file-value";

	return {
		preProcessDoc,
		postProcessDoc,
		serialize,
		windowIdAttributeName,
		preservedSpaceAttributeName,
		removedContentAttributeName,
		responsiveImagesAttributeName,
		imagesAttributeName,
		inputValueAttributeName
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
			doc.querySelectorAll("html > body *:not(style):not(script):not(link):not(frame):not(iframe):not(object):not(meta):not(title):not(meta):not(noscript):not(template)").forEach(element => {
				const style = win.getComputedStyle(element);
				if (element instanceof win.HTMLElement && style && (element.hidden || style.display == "none" || ((style.opacity === 0 || style.visibility == "hidden") && !element.clientWidth && !element.clientHeight)) && !element.querySelector("iframe, frame, object[type=\"text/html\"][data]")) {
					element.setAttribute(removedContentAttributeName(options.sessionId), "");
				}
			});
		}
		if (options.compressHTML) {
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
		return IMAGE_ATTRIBUTE_NAME + (sessionId ? "-" + sessionId : "");
	}

	function preservedSpaceAttributeName(sessionId) {
		return PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME + (sessionId ? "-" + sessionId : "");
	}

	function removedContentAttributeName(sessionId) {
		return REMOVED_CONTENT_ATTRIBUTE_NAME + (sessionId ? "-" + sessionId : "");
	}

	function windowIdAttributeName(sessionId) {
		return WIN_ID_ATTRIBUTE_NAME + (sessionId ? "-" + sessionId : "");
	}

	function inputValueAttributeName(sessionId) {
		return INPUT_VALUE_ATTRIBUTE_NAME + (sessionId ? "-" + sessionId : "");
	}

	function getCanvasData(doc) {
		if (doc) {
			const canvasData = [];
			doc.querySelectorAll("canvas").forEach(canvasElement => {
				try {
					canvasData.push({ dataURI: canvasElement.toDataURL("image/png", ""), width: canvasElement.clientWidth, height: canvasElement.clientHeight });
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
				imageElement.setAttribute(imagesAttributeName(options.sessionId), imageElementIndex);
				let imageData = {}, size = getSize(imageElement);
				if (imageElement.src && size) {
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
					const clientWidth = size.width;
					const clientHeight = size.height;
					if (clientHeight && clientWidth) {
						imageData = {
							width: imageElement.width,
							height: imageElement.height,
							clientWidth,
							clientHeight,
							naturalWidth,
							naturalHeight
						};
					}
				}
				data.push(imageData);
			});
			return data;
		}
	}

	function getSize(imageElement) {
		const computedStyle = getComputedStyle(imageElement);
		let width, height, paddingLeft, paddingRight, paddingTop, paddingBottom, borderLeftWidth, borderRightWidth, borderTopWidth, borderBottomWidth;
		if (computedStyle.getPropertyValue("box-sizing") == "border-box") {
			paddingLeft = paddingRight = paddingTop = paddingBottom = 0;
			borderLeftWidth = borderRightWidth = borderTopWidth = borderBottomWidth = 0;
		} else {
			paddingLeft = getWidth("padding-left", computedStyle);
			paddingRight = getWidth("padding-right", computedStyle);
			paddingTop = getWidth("padding-top", computedStyle);
			paddingBottom = getWidth("padding-bottom", computedStyle);
			borderLeftWidth = getWidth("border-left-width", computedStyle);
			borderRightWidth = getWidth("border-right-width", computedStyle);
			borderTopWidth = getWidth("border-top-width", computedStyle);
			borderBottomWidth = getWidth("border-bottom-width", computedStyle);
		}
		width = imageElement.clientWidth;
		height = imageElement.clientHeight;
		if (width >= 0 && height >= 0 && paddingLeft >= 0 && paddingRight >= 0 && paddingTop >= 0 && paddingBottom >= 0 && borderLeftWidth >= 0 && borderRightWidth >= 0 && borderTopWidth >= 0 && borderBottomWidth >= 0) {
			return {
				width: width - paddingLeft - paddingRight - borderLeftWidth - borderRightWidth,
				height: height - paddingTop - paddingBottom - borderTopWidth - borderBottomWidth
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
						src: (!imageElement.src.startsWith("data:") && imageElement.src) || (!imageElement.currentSrc.startsWith("data:") && imageElement.currentSrc)
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