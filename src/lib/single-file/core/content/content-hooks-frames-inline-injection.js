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

/* global window */

const document = globalThis.document;
const Document = globalThis.Document;

if (document instanceof Document) {
	let scriptElement = document.createElement("script");
	scriptElement.src = "data:," + "(" + injectedScript.toString() + ")()";
	(document.documentElement || document).appendChild(scriptElement);
	scriptElement.remove();
	scriptElement = document.createElement("script");
	scriptElement.textContent = "(" + injectedScript.toString() + ")()";
	(document.documentElement || document).appendChild(scriptElement);
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