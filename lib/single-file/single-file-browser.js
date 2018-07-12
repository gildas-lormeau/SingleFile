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

/* global SingleFileCore, base64, DOMParser, getComputedStyle, TextDecoder, fetch, parseSrcset, uglifycss */

this.SingleFile = (() => {

	// --------
	// Download
	// --------
	const USER_AGENT = "Mozilla/5.0 (compatible; SingleFile Bot/1.0)";

	class Download {
		static async getContent(resourceURL, asDataURI) {
			const requestOptions = {
				method: "GET",
				headers: {
					"User-Agent": USER_AGENT
				}
			};
			let resourceContent;
			try {
				resourceContent = await (this.superFetch || fetch)(resourceURL, requestOptions);
			} catch (e) {
				return asDataURI ? "data:base64," : "";
			}
			const contentType = resourceContent.headers.get("content-type");
			if (asDataURI) {
				try {
					const buffer = await resourceContent.arrayBuffer();
					return "data:" + (contentType || "") + ";" + "base64," + base64.fromByteArray(new Uint8Array(buffer));
				} catch (e) {
					return "data:base64,";
				}
			} else {
				const matchCharset = contentType && contentType.match(/\s*;\s*charset\s*=\s*"?([^";]*)"?(;|$)/i);
				if (matchCharset && matchCharset[1]) {
					const charSet = matchCharset[1].toLowerCase();
					if (charSet != "utf-8") {
						const arrayBuffer = await resourceContent.arrayBuffer();
						return (new TextDecoder(charSet)).decode(arrayBuffer);
					} else {
						return resourceContent.text();
					}
				} else {
					return resourceContent.text();
				}
			}
		}
	}

	// ---
	// DOM
	// ---
	class DOM {
		static create(pageContent, baseURI) {
			const doc = (new DOMParser()).parseFromString(pageContent, "text/html");
			let baseElement = doc.querySelector("base");
			if (!baseElement) {
				baseElement = doc.createElement("base");
				baseElement.href = encodeURIComponent(baseURI);
				doc.head.insertBefore(baseElement, doc.head.firstChild);
			}
			return {
				DOMParser,
				getComputedStyle,
				document: doc,
				serialize: () => getDoctype(doc) + doc.documentElement.outerHTML,
				parseSrcset: srcset => parseSrcset(srcset),
				uglifycss: (content, options) => uglifycss.processString(content, options)
			};
		}
	}

	function getDoctype(doc) {
		const docType = doc.doctype;
		let docTypeString;
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
			return docTypeString + ">\n";
		}
		return "";
	}

	return SingleFileCore(Download, DOM, URL);

})();
