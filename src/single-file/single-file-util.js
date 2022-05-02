/*
 * Copyright 2010-2020 Gildas Lormeau
 * contact : gildas.lormeau <at> gmail.com
 * 
 * This file is part of SingleFile.
 *
 *   The code in this file is free software: you can redistribute it and/or 
 *   modify it under the terms of the GNU Affero General Public License 
 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
 *   of the License, or (at your option) any later version.
 * 
 *   The code in this file is distributed in the hope that it will be useful, 
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
 *   General Public License for more details.
 *
 *   As additional permission under GNU AGPL version 3 section 7, you may 
 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
 *   AGPL normally required by section 4, provided you include this license 
 *   notice and a URL through which recipients can access the Corresponding 
 *   Source.
 */

/* global globalThis */

import * as vendor from "./vendor/index.js";
import * as modules from "./modules/index.js";
import * as helper from "./single-file-helper.js";

const DEBUG = false;
const ONE_MB = 1024 * 1024;
const PREFIX_CONTENT_TYPE_TEXT = "text/";
const DEFAULT_REPLACED_CHARACTERS = ["~", "+", "\\\\", "?", "%", "*", ":", "|", "\"", "<", ">", "\x00-\x1f", "\x7F"];
const DEFAULT_REPLACEMENT_CHARACTER = "_";

const URL = globalThis.URL;
const DOMParser = globalThis.DOMParser;
const Blob = globalThis.Blob;
const FileReader = globalThis.FileReader;
const fetch = (url, options) => globalThis.fetch(url, options);
const crypto = globalThis.crypto;
const TextDecoder = globalThis.TextDecoder;
const TextEncoder = globalThis.TextEncoder;

export {
	getInstance
};

function getInstance(utilOptions) {
	utilOptions = utilOptions || {};
	utilOptions.fetch = utilOptions.fetch || fetch;
	utilOptions.frameFetch = utilOptions.frameFetch || utilOptions.fetch || fetch;
	return {
		getContent,
		parseURL(resourceURL, baseURI) {
			if (baseURI === undefined) {
				return new URL(resourceURL);
			} else {
				return new URL(resourceURL, baseURI);
			}
		},
		resolveURL(resourceURL, baseURI) {
			return this.parseURL(resourceURL, baseURI).href;
		},
		getValidFilename(filename, replacedCharacters = DEFAULT_REPLACED_CHARACTERS, replacementCharacter = DEFAULT_REPLACEMENT_CHARACTER) {
			replacedCharacters.forEach(replacedCharacter => filename = filename.replace(new RegExp("[" + replacedCharacter + "]+", "g"), replacementCharacter));
			filename = filename
				.replace(/\.\.\//g, "")
				.replace(/^\/+/, "")
				.replace(/\/+/g, "/")
				.replace(/\/$/, "")
				.replace(/\.$/, "")
				.replace(/\.\//g, "." + replacementCharacter)
				.replace(/\/\./g, "/" + replacementCharacter);
			return filename;
		},
		parseDocContent(content, baseURI) {
			const doc = (new DOMParser()).parseFromString(content, "text/html");
			if (!doc.head) {
				doc.documentElement.insertBefore(doc.createElement("HEAD"), doc.body);
			}
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
		},
		parseXMLContent(content) {
			return (new DOMParser()).parseFromString(content, "text/xml");
		},
		parseSVGContent(content) {
			const doc = (new DOMParser()).parseFromString(content, "image/svg+xml");
			if (doc.querySelector("parsererror")) {
				return (new DOMParser()).parseFromString(content, "text/html");
			} else {
				return doc;
			}
		},
		async digest(algo, text) {
			try {
				const hash = await crypto.subtle.digest(algo, new TextEncoder("utf-8").encode(text));
				return hex(hash);
			} catch (error) {
				return "";
			}
		},
		getContentSize(content) {
			return new Blob([content]).size;
		},
		truncateText(content, maxSize) {
			const blob = new Blob([content]);
			const reader = new FileReader();
			reader.readAsText(blob.slice(0, maxSize));
			return new Promise((resolve, reject) => {
				reader.addEventListener("load", () => {
					if (content.startsWith(reader.result)) {
						resolve(reader.result);
					} else {
						this.truncateText(content, maxSize - 1).then(resolve).catch(reject);
					}
				}, false);
				reader.addEventListener("error", reject, false);
			});
		},
		minifyHTML(doc, options) {
			return modules.htmlMinifier.process(doc, options);
		},
		minifyCSSRules(stylesheets, styles, mediaAllInfo) {
			return modules.cssRulesMinifier.process(stylesheets, styles, mediaAllInfo);
		},
		removeUnusedFonts(doc, stylesheets, styles, options) {
			return modules.fontsMinifier.process(doc, stylesheets, styles, options);
		},
		removeAlternativeFonts(doc, stylesheets, fontDeclarations, fontTests) {
			return modules.fontsAltMinifier.process(doc, stylesheets, fontDeclarations, fontTests);
		},
		getMediaAllInfo(doc, stylesheets, styles) {
			return modules.matchedRules.getMediaAllInfo(doc, stylesheets, styles);
		},
		compressCSS(content, options) {
			return vendor.cssMinifier.processString(content, options);
		},
		minifyMedias(stylesheets) {
			return modules.mediasAltMinifier.process(stylesheets);
		},
		removeAlternativeImages(doc) {
			return modules.imagesAltMinifier.process(doc);
		},
		parseSrcset(srcset) {
			return vendor.srcsetParser.process(srcset);
		},
		preProcessDoc(doc, win, options) {
			return helper.preProcessDoc(doc, win, options);
		},
		postProcessDoc(doc, markedElements, invalidElements) {
			helper.postProcessDoc(doc, markedElements, invalidElements);
		},
		serialize(doc, compressHTML) {
			return modules.serializer.process(doc, compressHTML);
		},
		removeQuotes(string) {
			return helper.removeQuotes(string);
		},
		ON_BEFORE_CAPTURE_EVENT_NAME: helper.ON_BEFORE_CAPTURE_EVENT_NAME,
		ON_AFTER_CAPTURE_EVENT_NAME: helper.ON_AFTER_CAPTURE_EVENT_NAME,
		WIN_ID_ATTRIBUTE_NAME: helper.WIN_ID_ATTRIBUTE_NAME,
		REMOVED_CONTENT_ATTRIBUTE_NAME: helper.REMOVED_CONTENT_ATTRIBUTE_NAME,
		HIDDEN_CONTENT_ATTRIBUTE_NAME: helper.HIDDEN_CONTENT_ATTRIBUTE_NAME,
		HIDDEN_FRAME_ATTRIBUTE_NAME: helper.HIDDEN_FRAME_ATTRIBUTE_NAME,
		IMAGE_ATTRIBUTE_NAME: helper.IMAGE_ATTRIBUTE_NAME,
		POSTER_ATTRIBUTE_NAME: helper.POSTER_ATTRIBUTE_NAME,
		VIDEO_ATTRIBUTE_NAME: helper.VIDEO_ATTRIBUTE_NAME,
		CANVAS_ATTRIBUTE_NAME: helper.CANVAS_ATTRIBUTE_NAME,
		HTML_IMPORT_ATTRIBUTE_NAME: helper.HTML_IMPORT_ATTRIBUTE_NAME,
		STYLE_ATTRIBUTE_NAME: helper.STYLE_ATTRIBUTE_NAME,
		INPUT_VALUE_ATTRIBUTE_NAME: helper.INPUT_VALUE_ATTRIBUTE_NAME,
		SHADOW_ROOT_ATTRIBUTE_NAME: helper.SHADOW_ROOT_ATTRIBUTE_NAME,
		PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME: helper.PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME,
		STYLESHEET_ATTRIBUTE_NAME: helper.STYLESHEET_ATTRIBUTE_NAME,
		SELECTED_CONTENT_ATTRIBUTE_NAME: helper.SELECTED_CONTENT_ATTRIBUTE_NAME,
		COMMENT_HEADER: helper.COMMENT_HEADER,
		COMMENT_HEADER_LEGACY: helper.COMMENT_HEADER_LEGACY,
		SINGLE_FILE_UI_ELEMENT_CLASS: helper.SINGLE_FILE_UI_ELEMENT_CLASS
	};

	async function getContent(resourceURL, options) {
		let response, startTime, networkTimeoutId, networkTimeoutPromise, resolveNetworkTimeoutPromise;
		const fetchResource = utilOptions.fetch;
		const fetchFrameResource = utilOptions.frameFetch;
		if (DEBUG) {
			startTime = Date.now();
			log("  // STARTED download url =", resourceURL, "asBinary =", options.asBinary);
		}
		if (options.blockMixedContent && /^https:/i.test(options.baseURI) && !/^https:/i.test(resourceURL)) {
			return getFetchResponse(resourceURL, options);
		}
		if (options.networkTimeout) {
			networkTimeoutPromise = new Promise((resolve, reject) => {
				resolveNetworkTimeoutPromise = resolve;
				networkTimeoutId = globalThis.setTimeout(() => reject(new Error("network timeout")), options.networkTimeout);
			});
		} else {
			networkTimeoutPromise = new Promise(resolve => {
				resolveNetworkTimeoutPromise = resolve;
			});
		}
		try {
			const accept = options.acceptHeaders ? options.acceptHeaders[options.expectedType] : "*/*";
			if (options.frameId) {
				try {
					response = await Promise.race([
						fetchFrameResource(resourceURL, { frameId: options.frameId, referrer: options.resourceReferrer, headers: { accept } }),
						networkTimeoutPromise
					]);
				} catch (error) {
					response = await Promise.race([
						fetchResource(resourceURL, { headers: { accept } }),
						networkTimeoutPromise
					]);
				}
			} else {
				response = await Promise.race([
					fetchResource(resourceURL, { referrer: options.resourceReferrer, headers: { accept } }),
					networkTimeoutPromise
				]);
			}
		} catch (error) {
			return getFetchResponse(resourceURL, options);
		} finally {
			resolveNetworkTimeoutPromise();
			if (options.networkTimeout) {
				globalThis.clearTimeout(networkTimeoutId);
			}
		}
		let buffer;
		try {
			buffer = await response.arrayBuffer();
		} catch (error) {
			return { data: options.asBinary ? "data:null;base64," : "", resourceURL };
		}
		resourceURL = response.url || resourceURL;
		let contentType = "", charset;
		try {
			const mimeType = new vendor.MIMEType(response.headers.get("content-type"));
			contentType = mimeType.type + "/" + mimeType.subtype;
			charset = mimeType.parameters.get("charset");
		} catch (error) {
			// ignored
		}
		if (!contentType) {
			contentType = guessMIMEType(options.expectedType, buffer);
		}
		if (!charset && options.charset) {
			charset = options.charset;
		}
		if (options.asBinary) {
			if (response.status >= 400) {
				return getFetchResponse(resourceURL, options);
			}
			try {
				if (DEBUG) {
					log("  // ENDED   download url =", resourceURL, "delay =", Date.now() - startTime);
				}
				if (options.maxResourceSizeEnabled && buffer.byteLength > options.maxResourceSize * ONE_MB) {
					return getFetchResponse(resourceURL, options);
				} else {
					return getFetchResponse(resourceURL, options, buffer, null, contentType);
				}
			} catch (error) {
				return getFetchResponse(resourceURL, options);
			}
		} else {
			if (response.status >= 400 || (options.validateTextContentType && contentType && !contentType.startsWith(PREFIX_CONTENT_TYPE_TEXT))) {
				return getFetchResponse(resourceURL, options);
			}
			if (!charset) {
				charset = "utf-8";
			}
			if (DEBUG) {
				log("  // ENDED   download url =", resourceURL, "delay =", Date.now() - startTime);
			}
			if (options.maxResourceSizeEnabled && buffer.byteLength > options.maxResourceSize * ONE_MB) {
				return getFetchResponse(resourceURL, options, null, charset);
			} else {
				try {
					return getFetchResponse(resourceURL, options, buffer, charset, contentType);
				} catch (error) {
					return getFetchResponse(resourceURL, options, null, charset);
				}
			}
		}
	}
}

async function getFetchResponse(resourceURL, options, data, charset, contentType) {
	if (data) {
		if (options.asBinary) {
			const reader = new FileReader();
			reader.readAsDataURL(new Blob([data], { type: contentType + (options.charset ? ";charset=" + options.charset : "") }));
			data = await new Promise((resolve, reject) => {
				reader.addEventListener("load", () => resolve(reader.result), false);
				reader.addEventListener("error", reject, false);
			});
		} else {
			const firstBytes = new Uint8Array(data.slice(0, 4));
			if (firstBytes[0] == 132 && firstBytes[1] == 49 && firstBytes[2] == 149 && firstBytes[3] == 51) {
				charset = "gb18030";
			} else if (firstBytes[0] == 255 && firstBytes[1] == 254) {
				charset = "utf-16le";
			} else if (firstBytes[0] == 254 && firstBytes[1] == 255) {
				charset = "utf-16be";
			}
			try {
				data = new TextDecoder(charset).decode(data);
			} catch (error) {
				charset = "utf-8";
				data = new TextDecoder(charset).decode(data);
			}
		}
	} else {
		data = options.asBinary ? "data:null;base64" : "";
	}
	return { data, resourceURL, charset };
}

function guessMIMEType(expectedType, buffer) {
	if (expectedType == "image") {
		if (compareBytes([255, 255, 255, 255], [0, 0, 1, 0])) {
			return "image/x-icon";
		}
		if (compareBytes([255, 255, 255, 255], [0, 0, 2, 0])) {
			return "image/x-icon";
		}
		if (compareBytes([255, 255], [78, 77])) {
			return "image/bmp";
		}
		if (compareBytes([255, 255, 255, 255, 255, 255], [71, 73, 70, 56, 57, 97])) {
			return "image/gif";
		}
		if (compareBytes([255, 255, 255, 255, 255, 255], [71, 73, 70, 56, 59, 97])) {
			return "image/gif";
		}
		if (compareBytes([255, 255, 255, 255, 0, 0, 0, 0, 255, 255, 255, 255, 255, 255], [82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80, 86, 80])) {
			return "image/webp";
		}
		if (compareBytes([255, 255, 255, 255, 255, 255, 255, 255], [137, 80, 78, 71, 13, 10, 26, 10])) {
			return "image/png";
		}
		if (compareBytes([255, 255, 255], [255, 216, 255])) {
			return "image/jpeg";
		}
	}
	if (expectedType == "font") {
		if (compareBytes([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255],
			[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 76, 80])) {
			return "application/vnd.ms-fontobject";
		}
		if (compareBytes([255, 255, 255, 255], [0, 1, 0, 0])) {
			return "font/ttf";
		}
		if (compareBytes([255, 255, 255, 255], [79, 84, 84, 79])) {
			return "font/otf";
		}
		if (compareBytes([255, 255, 255, 255], [116, 116, 99, 102])) {
			return "font/collection";
		}
		if (compareBytes([255, 255, 255, 255], [119, 79, 70, 70])) {
			return "font/woff";
		}
		if (compareBytes([255, 255, 255, 255], [119, 79, 70, 50])) {
			return "font/woff2";
		}
	}

	function compareBytes(mask, pattern) {
		let patternMatch = true, index = 0;
		if (buffer.byteLength >= pattern.length) {
			const value = new Uint8Array(buffer, 0, mask.length);
			for (index = 0; index < mask.length && patternMatch; index++) {
				patternMatch = patternMatch && ((value[index] & mask[index]) == pattern[index]);
			}
			return patternMatch;
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

function log(...args) {
	console.log("S-File <browser>", ...args); // eslint-disable-line no-console
}