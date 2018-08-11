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

/* global SingleFileCore, base64, DOMParser, TextDecoder, fetch, superFetch, parseSrcset, uglifycss, htmlmini, rulesMinifier, lazyLoader, serializer, common */

this.SingleFile = this.SingleFile || (() => {

	const ONE_MB = 1024 * 1024;

	// --------
	// Download
	// --------	
	let fetchResource;

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
			let contentType = resourceContent.headers.get("content-type");
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

		static getParser() {
			return DOMParser;
		}

		static htmlminiProcess(doc, options) {
			return htmlmini.process(doc, options);
		}

		static htmlminiPostProcess(doc) {
			return htmlmini.postProcess(doc);
		}

		static lazyLoader(doc) {
			return lazyLoader.process(doc);
		}

		static lazyLoaderImageSelectors() {
			return lazyLoader.imageSelectors;
		}

		static rulesMinifier(doc) {
			return rulesMinifier.process(doc);
		}

		static uglifycss(content, options) {
			return uglifycss.processString(content, options);
		}

		static parseSrcset(srcset) {
			return parseSrcset.process(srcset);
		}

		static serialize(doc, compressHTML) {
			return serializer.process(doc, compressHTML);
		}

		static preProcessDoc(doc, win, options) {
			common.preProcessDoc(doc, win, options);
		}

		static postProcessDoc(doc, options) {
			common.postProcessDoc(doc, options);
		}
	}

	return { getClass: () => SingleFileCore.getClass(Download, DOM, URL) };

})();
