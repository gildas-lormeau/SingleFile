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
	URL,
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

	const FONT_FACE_TEST_MAX_DELAY = 1000;

	const modules = {
		srcsetParser: this.srcsetParser,
		cssMinifier: this.cssMinifier,
		docHelper: docHelper,
		htmlMinifier: this.htmlMinifier,
		serializer: this.serializer,
		fontsMinifier: this.fontsMinifier && this.fontsMinifier.getInstance(cssTree, this.fontPropertyParser, docHelper),
		fontsAltMinifier: this.fontsAltMinifier && this.fontsAltMinifier.getInstance(cssTree),
		cssRulesMinifier: this.cssRulesMinifier && this.cssRulesMinifier.getInstance(cssTree),
		matchedRules: this.matchedRules && this.matchedRules.getInstance(cssTree),
		mediasMinifier: this.mediasMinifier && this.mediasMinifier.getInstance(cssTree, this.mediaQueryParser),
		imagesAltMinifier: this.imagesAltMinifier && this.imagesAltMinifier.getInstance(this.srcsetParser)
	};
	const domUtil = {
		getResourceContent,
		parseDocContent,
		parseSVGContent,
		isValidFontUrl,
		getContentSize,
		digestText,
		parseURL
	};
	const DocUtil = DocUtilCore.getClass(modules, domUtil);
	const SingleFile = SingleFileCore.getClass(DocUtil, cssTree);
	let fetchResource;
	return {
		getClass: () => SingleFile
	};

	async function getResourceContent(resourceURL) {
		if (!fetchResource) {
			fetchResource = typeof superFetch == "undefined" ? fetch : superFetch.fetch;
		}
		const resourceContent = await fetchResource(resourceURL);
		const buffer = await resourceContent.arrayBuffer();
		return {
			getUrl() {
				return resourceContent.url || resourceURL;
			},
			getContentType() {
				return resourceContent.headers && resourceContent.headers.get("content-type");
			},
			getStatusCode() {
				return resourceContent.status;
			},
			getSize() {
				return buffer.byteLength;
			},
			getText(charset) {
				return new TextDecoder(charset).decode(buffer);
			},
			async getDataUri(contentType) {
				const reader = new FileReader();
				reader.readAsDataURL(new Blob([buffer], { type: contentType || this.getContentType() }));
				return await new Promise((resolve, reject) => {
					reader.addEventListener("load", () => resolve(reader.result), false);
					reader.addEventListener("error", reject, false);
				});
			}
		};
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

	function parseDocContent(content) {
		return (new DOMParser()).parseFromString(content, "text/html");
	}

	function parseSVGContent(content) {
		return (new DOMParser()).parseFromString(content, "image/svg+xml");
	}

	async function digestText(algo, text) {
		const hash = await crypto.subtle.digest(algo, new TextEncoder("utf-8").encode(text));
		return hex(hash);
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

	function parseURL(resourceURL, baseURI) {
		return new URL(resourceURL, baseURI);
	}

})();