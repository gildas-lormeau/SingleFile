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

/* global SingleFileCore, DOMParser, TextDecoder, Blob, fetch, base64, superFetch, parseSrcset, uglifycss, htmlmini, cssMinifier, fontsMinifier, serializer, docHelper, mediasMinifier, TextEncoder, crypto, RulesMatcher, altImages, FontFace */

this.SingleFile = this.SingleFile || (() => {

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

	class Download {
		static async getContent(resourceURL, options) {
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
			} catch (error) {
				return options && options.asDataURI ? "data:base64," : "";
			}
			if (resourceContent.status >= 400) {
				return options && options.asDataURI ? "data:base64," : "";
			}
			let contentType = resourceContent.headers && resourceContent.headers.get("content-type");
			let charSet;
			if (contentType) {
				const matchContentType = contentType.toLowerCase().split(";");
				contentType = matchContentType[0].trim();
				if (contentType.indexOf("/") <= 0) {
					contentType = null;
				}
				const charSetValue = matchContentType[1] && matchContentType[1].trim();
				if (charSetValue) {
					const matchCharSet = charSetValue.match(/^charset=(.*)/);
					if (matchCharSet) {
						charSet = removeQuotes(matchCharSet[1]);
					}
				}
			}
			if (options && options.asDataURI) {
				try {
					const buffer = await resourceContent.arrayBuffer();
					if (DEBUG) {
						log("  // ENDED   download url =", resourceURL, "delay =", Date.now() - startTime);
					}
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
				if (options.validateTextContentType && contentType && !contentType.startsWith(PREFIX_CONTENT_TYPE_TEXT)) {
					return "";
				}
				if (!charSet) {
					const matchCharset = contentType && contentType.match(/\s*;\s*charset\s*=\s*"?([^";]*)"?(;|$)/i);
					if (matchCharset && matchCharset[1] || options.charSet) {
						charSet = (matchCharset && matchCharset[1].toLowerCase()) || options.charSet;
					}
				}
				if (!charSet) {
					charSet = "utf-8";
				}
				const arrayBuffer = await resourceContent.arrayBuffer();
				if (DEBUG) {
					log("  // ENDED   download url =", resourceURL, "delay =", Date.now() - startTime);
				}
				try {
					return getTextContent(charSet, arrayBuffer, options);
				} catch (error) {
					try {
						return getTextContent("utf-8", arrayBuffer, options);
					} catch (error) {
						return "";
					}
				}
			}
		}
	}

	function getTextContent(charSet, arrayBuffer, options) {
		const textContent = (new TextDecoder(charSet)).decode(arrayBuffer);
		if (options.maxResourceSizeEnabled && textContent.length > options.maxResourceSize * ONE_MB) {
			return "";
		} else {
			return textContent;
		}
	}

	const REGEXP_SIMPLE_QUOTES_STRING = /^'(.*?)'$/;
	const REGEXP_DOUBLE_QUOTES_STRING = /^"(.*?)"$/;

	function removeQuotes(string) {
		string = string.toLowerCase().trim();
		if (string.match(REGEXP_SIMPLE_QUOTES_STRING)) {
			string = string.replace(REGEXP_SIMPLE_QUOTES_STRING, "$1");
		} else {
			string = string.replace(REGEXP_DOUBLE_QUOTES_STRING, "$1");
		}
		return string.trim();
	}

	// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
	function hex(buffer) {
		var hexCodes = [];
		var view = new DataView(buffer);
		for (var i = 0; i < view.byteLength; i += 4) {
			var value = view.getUint32(i);
			var stringValue = value.toString(16);
			var padding = "00000000";
			var paddedValue = (padding + stringValue).slice(-padding.length);
			hexCodes.push(paddedValue);
		}
		return hexCodes.join("");
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
			for (const propertyName in element) {
				if (propertyName.startsWith("on")) {
					attributeNames.push(propertyName);
				}
			}
			return attributeNames;
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
			return htmlmini.process(doc, options);
		}

		static postMinifyHTML(doc) {
			return htmlmini.postProcess(doc);
		}

		static minifyCSS(doc, mediaAllInfo) {
			return cssMinifier.process(doc, mediaAllInfo);
		}

		static removeUnusedFonts(doc, options) {
			return fontsMinifier.removeUnusedFonts(doc, options);
		}

		static removeAlternativeFonts(doc) {
			return fontsMinifier.removeAlternativeFonts(doc);
		}

		static getMediaAllInfo(doc) {
			const rulesMatcher = RulesMatcher.create(doc);
			return rulesMatcher.getMediaAllInfo();
		}

		static compressCSS(content, options) {
			return uglifycss.processString(content, options);
		}

		static minifyMedias(doc) {
			return mediasMinifier.process(doc);
		}

		static removeAlternativeImages(doc, options) {
			return altImages.process(doc, options);
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

		static sheetAttributeName(sessionId) {
			return docHelper.sheetAttributeName(sessionId);
		}
	}

	function log(...args) {
		console.log("S-File <browser>", ...args); // eslint-disable-line no-console
	}

	return { getClass: () => SingleFileCore.getClass(Download, DOM, URL) };

})();