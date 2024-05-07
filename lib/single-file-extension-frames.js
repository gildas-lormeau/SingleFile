(function () {
	'use strict';

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

	/* global globalThis, window */

	const document$1 = globalThis.document;
	const Document$1 = globalThis.Document;

	if (document$1 instanceof Document$1) {
		let scriptElement = document$1.createElement("script");
		scriptElement.src = "data:," + "(" + injectedScript.toString() + ")()";
		(document$1.documentElement || document$1).appendChild(scriptElement);
		scriptElement.remove();
		scriptElement = document$1.createElement("script");
		scriptElement.textContent = "(" + injectedScript.toString() + ")()";
		(document$1.documentElement || document$1).appendChild(scriptElement);
		scriptElement.remove();
	}

	function injectedScript() {
		if (typeof globalThis == "undefined") {
			window.globalThis = window;
		}
		const document = globalThis.document;
		const CustomEvent = globalThis.CustomEvent;
		const FileReader = globalThis.FileReader;
		const Blob = globalThis.Blob;
		const NEW_FONT_FACE_EVENT = "single-file-new-font-face";
		const DELETE_FONT_EVENT = "single-file-delete-font";
		const CLEAR_FONTS_EVENT = "single-file-clear-fonts";
		const FONT_STYLE_PROPERTIES = {
			family: "font-family",
			style: "font-style",
			weight: "font-weight",
			stretch: "font-stretch",
			unicodeRange: "unicode-range",
			variant: "font-variant",
			featureSettings: "font-feature-settings"
		};

		if (globalThis.FontFace) {
			const FontFace = globalThis.FontFace;
			globalThis.FontFace = function () {
				getDetailObject(...arguments).then(detail => document.dispatchEvent(new CustomEvent(NEW_FONT_FACE_EVENT, { detail })));
				return new FontFace(...arguments);
			};
			globalThis.FontFace.prototype = FontFace.prototype;
			globalThis.FontFace.toString = function () { return "function FontFace() { [native code] }"; };
			const deleteFont = document.fonts.delete;
			document.fonts.delete = function (fontFace) {
				getDetailObject(fontFace.family).then(detail => document.dispatchEvent(new CustomEvent(DELETE_FONT_EVENT, { detail })));
				return deleteFont.call(document.fonts, fontFace);
			};
			document.fonts.delete.toString = function () { return "function delete() { [native code] }"; };
			const clearFonts = document.fonts.clear;
			document.fonts.clear = function () {
				document.dispatchEvent(new CustomEvent(CLEAR_FONTS_EVENT));
				return clearFonts.call(document.fonts);
			};
			document.fonts.clear.toString = function () { return "function clear() { [native code] }"; };
		}

		async function getDetailObject(fontFamily, src, descriptors) {
			const detail = {};
			detail["font-family"] = fontFamily;
			detail.src = src;
			if (descriptors) {
				Object.keys(descriptors).forEach(descriptor => {
					if (FONT_STYLE_PROPERTIES[descriptor]) {
						detail[FONT_STYLE_PROPERTIES[descriptor]] = descriptors[descriptor];
					}
				});
			}
			return new Promise(resolve => {
				if (detail.src instanceof ArrayBuffer) {
					const reader = new FileReader();
					reader.readAsDataURL(new Blob([detail.src]));
					reader.addEventListener("load", () => {
						detail.src = "url(" + reader.result + ")";
						resolve(detail);
					});
				} else {
					resolve(detail);
				}
			});
		}
	}

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

	const browser$1 = globalThis.browser;
	const document = globalThis.document;
	const Document = globalThis.Document;

	if (document instanceof Document && browser$1 && browser$1.runtime && browser$1.runtime.getURL) {
		const scriptElement = document.createElement("script");
		scriptElement.src = browser$1.runtime.getURL("/lib/single-file-hooks-frames.js");
		scriptElement.async = false;
		(document.documentElement || document).appendChild(scriptElement);
		scriptElement.remove();
	}

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

	const fetch = (url, options) => window.fetch(url, options);

	let pendingResponses = new Map();

	browser.runtime.onMessage.addListener(message => {
		if (message.method == "singlefile.fetchFrame" && window.frameId && window.frameId == message.frameId) {
			return onFetchFrame(message);
		}
		if (message.method == "singlefile.fetchResponse") {
			return onFetchResponse(message);
		}
	});

	async function onFetchFrame(message) {
		try {
			const response = await fetch(message.url, { cache: "force-cache", headers: message.headers });
			return {
				status: response.status,
				headers: [...response.headers],
				array: Array.from(new Uint8Array(await response.arrayBuffer()))
			};
		} catch (error) {
			return {
				error: error && error.toString()
			};
		}
	}

	async function onFetchResponse(message) {
		const pendingResponse = pendingResponses.get(message.requestId);
		if (pendingResponse) {
			if (message.error) {
				pendingResponse.reject(new Error(message.error));
				pendingResponses.delete(message.requestId);
			} else {
				if (message.truncated) {
					if (pendingResponse.array) {
						pendingResponse.array = pendingResponse.array.concat(message.array);
					} else {
						pendingResponse.array = message.array;
						pendingResponses.set(message.requestId, pendingResponse);
					}
					if (message.finished) {
						message.array = pendingResponse.array;
					}
				}
				if (!message.truncated || message.finished) {
					pendingResponse.resolve({
						status: message.status,
						headers: { get: headerName => message.headers && message.headers[headerName] },
						arrayBuffer: async () => new Uint8Array(message.array).buffer
					});
					pendingResponses.delete(message.requestId);
				}
			}
		}
		return {};
	}

})();
