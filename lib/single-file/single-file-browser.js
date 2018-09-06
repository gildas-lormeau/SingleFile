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

/* global SingleFileCore, DOMParser, TextDecoder, Blob, fetch, base64, superFetch, parseSrcset, uglifycss, htmlmini, cssMinifier, fontsMinifier, lazyLoader, serializer, docHelper */

this.SingleFile = this.SingleFile || (() => {

	const ONE_MB = 1024 * 1024;

	// --------
	// Download
	// --------	
	let fetchResource;

	if (this.serializer === undefined) {
		this.serializer = {
			process(doc) {
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
				return docTypeString + doc.documentElement.outerHTML;
			}
		};
	}

	class Download {
		static async getContent(resourceURL, options) {
			let resourceContent;
			if (!fetchResource) {
				fetchResource = typeof superFetch == "undefined" ? fetch : superFetch.fetch;
			}
			try {
				resourceContent = await fetchResource(resourceURL);
			} catch (error) {
				return options && options.asDataURI ? "data:base64," : "";
			}
			if (resourceContent.status >= 400) {
				resourceContent = options && options.asDataURI ? "data:base64," : "";
			}
			let contentType = resourceContent.headers && resourceContent.headers.get("content-type");
			if (contentType) {
				contentType = contentType.match(/^([^;]*)/)[0];
			}
			if (options && options.asDataURI) {
				try {
					const buffer = await resourceContent.arrayBuffer();
					const dataURI = "data:" + (contentType || "") + ";" + "base64," + base64.fromByteArray(new Uint8Array(buffer));
					if (options.maxResourceSizeEnabled && buffer.byteLength > options.maxResourceSize * ONE_MB) {
						return "data:base64,";
					} else {
						return dataURI;
					}
				} catch (error) {
					return "data:base64,";
				}
			} else {
				const matchCharset = contentType && contentType.match(/\s*;\s*charset\s*=\s*"?([^";]*)"?(;|$)/i);
				let charSet;
				if (matchCharset && matchCharset[1]) {
					charSet = matchCharset[1].toLowerCase();
				}
				if (!charSet) {
					charSet = "utf-8";
				}
				try {
					const arrayBuffer = await resourceContent.arrayBuffer();
					const textContent = (new TextDecoder(charSet)).decode(arrayBuffer);
					if (options.maxResourceSizeEnabled && textContent.length > options.maxResourceSize * ONE_MB) {
						return "";
					} else {
						return textContent;
					}
				} catch (error) {
					return "";
				}
			}
		}
	}

	// ---
	// DOM
	// ---
	class DOM {
		static createDoc(pageContent, baseURI) {
			const doc = (new DOMParser()).parseFromString(pageContent, "text/html");
			let baseElement = doc.querySelector("base");
			if (!baseElement || !baseElement.getAttribute("href")) {
				if (baseElement) {
					baseElement.remove();
				}
				baseElement = doc.createElement("base");
				baseElement.setAttribute("href", baseURI);
				doc.head.insertBefore(baseElement, doc.head.firstChild);
			}
			return doc;
		}

		static getOnEventAttributeNames(doc) {
			const element = doc.createElement("div");
			const attributeNames = [];
			for (let propertyName in element) {
				if (propertyName.startsWith("on")) {
					attributeNames.push(propertyName);
				}
			}
			return attributeNames;
		}

		static getParser() {
			return DOMParser;
		}

		static getContentSize(content) {
			return new Blob([content]).size;
		}

		static minifyHTML(doc, options) {
			return htmlmini.process(doc, options);
		}

		static postMinifyHTML(doc) {
			return htmlmini.postProcess(doc);
		}

		static lazyLoad(doc) {
			return lazyLoader.process(doc);
		}

		static minifyCSS(doc) {
			return cssMinifier.process(doc);
		}

		static minifyFonts(doc, secondPass) {
			return fontsMinifier.process(doc, secondPass);
		}

		static compressCSS(content, options) {
			return uglifycss.processString(content, options);
		}

		static parseSrcset(srcset) {
			return parseSrcset.process(srcset);
		}

		static preProcessDoc(doc, win, options) {
			return docHelper.preProcessDoc(doc, win, options);
		}

		static postProcessDoc(doc, options) {
			docHelper.postProcessDoc(doc, options);
		}

		static serialize(doc, compressHTML) {
			return serializer.process(doc, compressHTML);
		}

		static lazyLoaderImageSelectors() {
			return lazyLoader.imageSelectors;
		}

		static windowIdAttributeName(sessionId) {
			return docHelper.windowIdAttributeName(sessionId);
		}

		static preservedSpaceAttributeName(sessionId) {
			return docHelper.preservedSpaceAttributeName(sessionId);
		}

		static removedContentAttributeName(sessionId) {
			return docHelper.removedContentAttributeName(sessionId);
		}

		static responsiveImagesAttributeName(sessionId) {
			return docHelper.responsiveImagesAttributeName(sessionId);
		}
	}

	return { getClass: () => SingleFileCore.getClass(Download, DOM, URL) };

})();