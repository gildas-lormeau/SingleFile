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

/* global window */

this.singlefile.lib.SingleFile = this.singlefile.lib.SingleFile || (() => {

	const singlefile = this.singlefile;
	const crypto = window.crypto;
	const fetch = window.fetch;
	const Blob = window.Blob;
	const FileReader = window.FileReader;
	const TextDecoder = window.TextDecoder;
	const TextEncoder = window.TextEncoder;

	const modules = {
		helper: singlefile.lib.helper,
		srcsetParser: singlefile.lib.vendor.srcsetParser,
		cssMinifier: singlefile.lib.vendor.cssMinifier,
		htmlMinifier: singlefile.lib.modules.htmlMinifier,
		serializer: singlefile.lib.modules.serializer,
		fontsMinifier: singlefile.lib.modules.fontsMinifier,
		fontsAltMinifier: singlefile.lib.modules.fontsAltMinifier,
		cssRulesMinifier: singlefile.lib.modules.cssRulesMinifier,
		matchedRules: singlefile.lib.modules.matchedRules,
		mediasAltMinifier: singlefile.lib.modules.mediasAltMinifier,
		imagesAltMinifier: singlefile.lib.modules.imagesAltMinifier
	};
	const util = {
		getResourceContent,
		digestText
	};
	const SingleFile = singlefile.lib.core.getClass(singlefile.lib.util.getInstance(modules, util), singlefile.lib.vendor.cssTree);
	const fetchResource = (singlefile.lib.fetch.content.resources && singlefile.lib.fetch.content.resources.fetch) || fetch;
	return {
		getClass: () => SingleFile
	};

	async function getResourceContent(resourceURL) {
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
				return new Promise((resolve, reject) => {
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

})();