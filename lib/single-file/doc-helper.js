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

this.docHelper = this.docHelper || (() => {

	const REMOVED_CONTENT_ATTRIBUTE_NAME = "data-single-file-removed-content";
	const PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME = "data-single-file-preserved-space-element";
	const WIN_ID_ATTRIBUTE_NAME = "data-frame-tree-win-id";
	const RESPONSIVE_IMAGE_ATTRIBUTE_NAME = "data-single-file-responsive-image";

	return {
		preProcessDoc,
		postProcessDoc,
		serialize,
		windowIdAttributeName,
		preservedSpaceAttributeName,
		removedContentAttributeName,
		responsiveImagesAttributeName
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
		return {
			canvasData: getCanvasData(doc),
			stylesheetContents: getStylesheetContents(doc),
			imageData: getImageData(doc, options)
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
	}

	function responsiveImagesAttributeName(sessionId) {
		return RESPONSIVE_IMAGE_ATTRIBUTE_NAME + (sessionId ? "-" + sessionId : "");
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
				imageData.source = {
					clientWidth: imageElement.clientWidth,
					clientHeight: imageElement.clientHeight,
					naturalWidth: imageElement.naturalWidth,
					naturalHeight: imageElement.naturalHeight,
					width: imageElement.width,
					height: imageElement.height,
					src: (!imageElement.currentSrc.startsWith("data:") && imageElement.currentSrc) || (!imageElement.src.startsWith("data:") && imageElement.src)
				};
				data.push(imageData);
			});
			return data;
		}
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