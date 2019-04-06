/*
 * Copyright 2010-2019 Gildas Lormeau
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

/* global
	docUtil,
	cssTree,
	crypto,
	docHelper,
	fetch, 
	setTimeout, 
	superFetch, 
	Blob, 
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
		mediasAltMinifier: this.mediasAltMinifier && this.mediasAltMinifier.getInstance(cssTree, this.mediaQueryParser),
		imagesAltMinifier: this.imagesAltMinifier && this.imagesAltMinifier.getInstance(this.srcsetParser)
	};
	const domUtil = {
		getResourceContent,
		isValidFontUrl,
		digestText
	};
	const SingleFile = SingleFileCore.getClass(docUtil.getInstance(modules, domUtil), cssTree);
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

	async function digestText(algo, text) {
		const hash = await crypto.subtle.digest(algo, new TextEncoder("utf-8").encode(text));
		return hex(hash);
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

	async function isValidFontUrl(urlFunction) {
		try {
			const font = new FontFace("font-test", urlFunction);
			await Promise.race([font.load(), new Promise(resolve => setTimeout(() => resolve(true), FONT_FACE_TEST_MAX_DELAY))]);
			return true;
		} catch (error) {
			return false;
		}
	}

})();