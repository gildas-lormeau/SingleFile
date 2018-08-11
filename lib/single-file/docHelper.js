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

	return {
		preProcessDoc,
		postProcessDoc,
		getCanvasData,
		getEmptyStyleRulesText,
		getDoctype
	};

	function preProcessDoc(doc, win, options) {
		doc.querySelectorAll("script").forEach(element => element.textContent = element.textContent.replace(/<\/script>/gi, "<\\/script>"));
		doc.head.querySelectorAll("noscript").forEach(element => {
			const disabledNoscriptElement = doc.createElement("disabled-noscript");
			Array.from(element.childNodes).forEach(node => disabledNoscriptElement.appendChild(node));
			disabledNoscriptElement.hidden = true;
			element.parentElement.replaceChild(disabledNoscriptElement, element);
		});
		doc.head.querySelectorAll("*:not(base):not(link):not(meta):not(noscript):not(script):not(style):not(template):not(title)").forEach(element => element.hidden = true);
		if (options.removeHiddenElements) {
			doc.querySelectorAll("html > body *:not(style):not(script):not(link):not(frame):not(iframe):not(object)").forEach(element => {
				const style = win.getComputedStyle(element);
				if (element instanceof win.HTMLElement && (element.hidden || style.display == "none" || ((style.opacity === 0 || style.visibility == "hidden") && !element.clientWidth && !element.clientHeight)) && !element.querySelector("iframe, frame, object[type=\"text/html\"][data]")) {
					element.setAttribute(REMOVED_CONTENT_ATTRIBUTE_NAME, "");
				}
			});
		}
		if (options.compressHTML) {
			doc.querySelectorAll("*").forEach(element => {
				const style = win.getComputedStyle(element);
				if (style.whiteSpace.startsWith("pre")) {
					element.setAttribute(PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME, "");
				}
			});
		}
	}

	function postProcessDoc(doc, options) {
		doc.head.querySelectorAll("disabled-noscript").forEach(element => {
			const noscriptElement = doc.createElement("noscript");
			Array.from(element.childNodes).forEach(node => noscriptElement.appendChild(node));
			element.parentElement.replaceChild(noscriptElement, element);
		});
		doc.head.querySelectorAll("*:not(base):not(link):not(meta):not(noscript):not(script):not(style):not(template):not(title)").forEach(element => element.removeAttribute("hidden"));
		if (options.removeHiddenElements) {
			doc.querySelectorAll("[" + REMOVED_CONTENT_ATTRIBUTE_NAME + "]").forEach(element => element.removeAttribute(REMOVED_CONTENT_ATTRIBUTE_NAME));
		}
		if (options.compressHTML) {
			doc.querySelectorAll("[" + PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME + "]").forEach(element => element.removeAttribute(PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME));
		}
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

	function getEmptyStyleRulesText(doc) {
		if (doc) {
			const textData = [];
			doc.querySelectorAll("style").forEach(styleElement => {
				if (!styleElement.textContent) {
					textData.push(Array.from(styleElement.sheet.cssRules).map(rule => rule.cssText).join("\n"));
				}
			});
			return textData;
		}
	}

	function getDoctype(doc) {
		const docType = doc.doctype;
		let docTypeStr;
		if (docType) {
			docTypeStr = "<!DOCTYPE " + docType.nodeName;
			if (docType.publicId) {
				docTypeStr += " PUBLIC \"" + docType.publicId + "\"";
				if (docType.systemId) {
					docTypeStr += " \"" + docType.systemId + "\"";
				}
			} else if (docType.systemId) {
				docTypeStr += " SYSTEM \"" + docType.systemId + "\"";
			} if (docType.internalSubset) {
				docTypeStr += " [" + docType.internalSubset + "]";
			}
			return docTypeStr + ">\n";
		}
		return "";
	}

})();