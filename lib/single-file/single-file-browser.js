/*
 * Copyright 2010-2019 Gildas Lormeau
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
	DocUtilCore,
	cssTree,
	docHelper,
	crypto, 
	fetch, 
	setTimeout, 
	superFetch, 
	Blob, 
	DOMParser, 
	FileReader, 
	FontFace
	SingleFileCore, 
	TextDecoder, 
	TextEncoder */

this.SingleFileBrowser = this.SingleFileBrowser || (() => {

	const ONE_MB = 1024 * 1024;
	const DEBUG = false;
	const PREFIX_CONTENT_TYPE_TEXT = "text/";
	const FONT_FACE_TEST_MAX_DELAY = 1000;

	const modules = {
		srcsetParser: this.srcsetParser,
		cssMinifier: this.cssMinifier,
		docHelper: docHelper,
		htmlMinifier: this.htmlMinifier,
		fontsMinifier: this.fontsMinifier,
		fontsAltMinifier: this.fontsAltMinifier,
		cssRulesMinifier: this.cssRulesMinifier,
		matchedRules: this.matchedRules,
		mediasMinifier: this.mediasMinifier,
		imagesAltMinifier: this.imagesAltMinifier,
		serializer: this.serializer
	};
	modules.fontsAltMinifier.cssTree = cssTree;
	modules.fontsMinifier.cssTree = cssTree;
	modules.fontsMinifier.fontPropertyParser = this.fontPropertyParser;
	modules.fontsMinifier.docHelper = docHelper;
	modules.matchedRules.cssTree = cssTree;
	modules.mediasMinifier.cssTree = cssTree;
	modules.mediasMinifier.mediaQueryParser = this.mediaQueryParser;
	modules.cssRulesMinifier.cssTree = cssTree;
	modules.imagesAltMinifier.srcsetParser = this.srcsetParser;
	const domUtil = {
		getContent, parseDocContent, parseSVGContent, isValidFontUrl, getContentSize, digestText
	};
	let fetchResource;
	return {
		getClass: () => {
			const DocUtil = DocUtilCore.getClass(modules, domUtil);
			return SingleFileCore.getClass(DocUtil, cssTree);
		}
	};

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
			return { data: options.asDataURI ? "data:base64," : "", resourceURL };
		}
		let contentType = resourceContent.headers && resourceContent.headers.get("content-type");
		let charset;
		if (contentType) {
			const matchContentType = contentType.toLowerCase().split(";");
			contentType = matchContentType[0].trim();
			if (!contentType.includes("/")) {
				contentType = null;
			}
			const charsetValue = matchContentType[1] && matchContentType[1].trim();
			if (charsetValue) {
				const matchCharset = charsetValue.match(/^charset=(.*)/);
				if (matchCharset && matchCharset[1]) {
					charset = docHelper.removeQuotes(matchCharset[1].trim());
				}
			}
		}
		if (!charset && options.charset) {
			charset = options.charset;
		}
		if (options.asDataURI) {
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

	function parseDocContent(content, baseURI) {
		const doc = (new DOMParser()).parseFromString(content, "text/html");
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

	function parseSVGContent(content) {
		return (new DOMParser()).parseFromString(content, "image/svg+xml");
	}

	async function digestText(algo, text) {
		const hash = await crypto.subtle.digest(algo, new TextEncoder("utf-8").encode(text));
		return (hex(hash));
	}

	function getContentSize(content) {
		return new Blob([content]).size;
	}

	async function isValidFontUrl(urlFunction) {
		try {
			const font = new FontFace("font-test", urlFunction);
			await Promise.race([font.load(), new Promise(resolve => setTimeout(() => resolve(true), FONT_FACE_TEST_MAX_DELAY))]);
			return true;
		} catch (error) {
			return false;
		}
	}

	function log(...args) {
		console.log("S-File <browser>", ...args); // eslint-disable-line no-console
	}

})();