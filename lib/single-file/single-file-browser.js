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

/* global 
	crypto, 
	cssMinifier, 
	cssRulesMinifier, 
	cssTree,
	docHelper, 
	fetch, 
	fontsAltMinifier, 
	fontsMinifier, 
	htmlMinifier, 
	imagesAltMinifier, 
	matchedRules, 
	mediasMinifier, 
	serializer, 
	setTimeout, 
	srcsetParser, 
	superFetch, 
	Blob, 
	DOMParser, 
	FileReader, 
	FontFace
	SingleFileCore, 
	TextDecoder, 
	TextEncoder, 
	URL */

this.SingleFileBrowser = this.SingleFileBrowser || (() => {

	const ONE_MB = 1024 * 1024;
	const DEBUG = false;
	const PREFIX_CONTENT_TYPE_TEXT = "text/";
	const FONT_FACE_TEST_MAX_DELAY = 1000;

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


	async function getContent(resourceURL, options) {
		let resourceContent, startTime;
		if (DEBUG) {
			startTime = Date.now();
			log("  // STARTED download url =", resourceURL, "asDataURI =", options.asDataURI);
		}
		if (!fetchResource) {
			fetchResource = typeof superFetch == "undefined" ? fetch : superFetch.fetch;
		}
		try {
			resourceContent = await fetchResource(resourceURL);
			if (resourceContent.url) {
				resourceURL = resourceContent.url;
			}
		} catch (error) {
			return { data: options && options.asDataURI ? "data:base64," : "", resourceURL };
		}
		let contentType = resourceContent.headers && resourceContent.headers.get("content-type");
		let charset;
		if (contentType) {
			const matchContentType = contentType.toLowerCase().split(";");
			contentType = matchContentType[0].trim();
			if (!contentType.includes("/")) {
				contentType = null;
			}
			const charsetValue = matchContentType[1] && matchContentType[1].trim().toLowerCase();
			if (charsetValue) {
				const matchCharset = charsetValue.match(/^charset=(.*)/);
				if (matchCharset && matchCharset[1]) {
					charset = docHelper.removeQuotes(matchCharset[1].trim());
				}
				if (!charset && options.charset) {
					charset = options.charset.trim();
				}
			}
		}
		if (options && options.asDataURI) {
			try {
				if (DEBUG) {
					log("  // ENDED   download url =", resourceURL, "delay =", Date.now() - startTime);
				}
				const buffer = await resourceContent.arrayBuffer();
				if (options.maxResourceSizeEnabled && buffer.byteLength > options.maxResourceSize * ONE_MB) {
					return { data: "data:base64,", resourceURL };
				} else {
					const reader = new FileReader();
					reader.readAsDataURL(new Blob([buffer], { type: contentType }));
					const dataURI = await new Promise((resolve, reject) => {
						reader.addEventListener("load", () => resolve(reader.result), false);
						reader.addEventListener("error", reject, false);
					});
					return { data: dataURI, resourceURL };
				}
			} catch (error) {
				return { data: "data:base64,", resourceURL };
			}
		} else {
			if (resourceContent.status >= 400 || (options.validateTextContentType && contentType && !contentType.startsWith(PREFIX_CONTENT_TYPE_TEXT))) {
				return { data: "", resourceURL };
			}
			if (!charset) {
				charset = "utf-8";
			}
			let buffer;
			try {
				buffer = await resourceContent.arrayBuffer();
			} catch (error) {
				return { data: "", resourceURL, charset };
			}
			if (DEBUG) {
				log("  // ENDED   download url =", resourceURL, "delay =", Date.now() - startTime);
			}
			if (options.maxResourceSizeEnabled && buffer.byteLength > options.maxResourceSize * ONE_MB) {
				return { data: "", resourceURL, charset };
			} else {
				try {
					return { data: new TextDecoder(charset).decode(buffer), resourceURL, charset };
				} catch (error) {
					try {
						charset = "utf-8";
						return { data: new TextDecoder(charset).decode(buffer), resourceURL, charset };
					} catch (error) {
						return { data: "", resourceURL, charset };
					}
				}
			}
		}
	}

	// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
	function hex(buffer) {
		const hexCodes = [];
		const view = new DataView(buffer);
		for (let i = 0; i < view.byteLength; i += 4) {
			const value = view.getUint32(i);
			const stringValue = value.toString(16);
			const padding = "00000000";
			const paddedValue = (padding + stringValue).slice(-padding.length);
			hexCodes.push(paddedValue);
		}
		return hexCodes.join("");
	}

	// ---
	// DocUtil
	// ---
	class DocUtil {
		static async getContent(resourceURL, options) {
			return getContent(resourceURL, options);
		}

		static parseURL(resourceURL, baseURI) {
			return new URL(resourceURL, baseURI);
		}

		static resolveURL(resourceURL, baseURI) {
			return this.parseURL(resourceURL, baseURI).href;
		}

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

		static getParser() {
			return DOMParser;
		}

		static async digest(algo, text) {
			const hash = await crypto.subtle.digest(algo, new TextEncoder("utf-8").encode(text));
			return (hex(hash));
		}

		static getContentSize(content) {
			return new Blob([content]).size;
		}

		static async validFont(urlFunction) {
			try {
				const font = new FontFace("font-test", urlFunction);
				await Promise.race([font.load(), new Promise(resolve => setTimeout(() => resolve(true), FONT_FACE_TEST_MAX_DELAY))]);
				return true;
			} catch (error) {
				return false;
			}
		}

		static minifyHTML(doc, options) {
			return htmlMinifier.process(doc, options);
		}

		static postMinifyHTML(doc) {
			return htmlMinifier.postProcess(doc);
		}

		static minifyCSSRules(stylesheets, styles, mediaAllInfo) {
			return cssRulesMinifier.process(stylesheets, styles, mediaAllInfo);
		}

		static removeUnusedFonts(doc, stylesheets, styles, options) {
			return fontsMinifier.process(doc, stylesheets, styles, options);
		}

		static removeAlternativeFonts(doc, stylesheets) {
			return fontsAltMinifier.process(doc, stylesheets);
		}

		static getMediaAllInfo(doc, stylesheets, styles) {
			return matchedRules.getMediaAllInfo(doc, stylesheets, styles);
		}

		static compressCSS(content, options) {
			return cssMinifier.processString(content, options);
		}

		static minifyMedias(stylesheets) {
			return mediasMinifier.process(stylesheets);
		}

		static removeAlternativeImages(doc, options) {
			return imagesAltMinifier.process(doc, options);
		}

		static parseSrcset(srcset) {
			return srcsetParser.process(srcset);
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

		static removeQuotes(string) {
			return docHelper.removeQuotes(string);
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

		static imagesAttributeName(sessionId) {
			return docHelper.imagesAttributeName(sessionId);
		}

		static inputValueAttributeName(sessionId) {
			return docHelper.inputValueAttributeName(sessionId);
		}

		static shadowRootAttributeName(sessionId) {
			return docHelper.shadowRootAttributeName(sessionId);
		}
	}

	function log(...args) {
		console.log("S-File <browser>", ...args); // eslint-disable-line no-console
	}

	return { getClass: () => SingleFileCore.getClass(DocUtil, cssTree) };

})();