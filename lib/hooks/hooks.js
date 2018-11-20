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

/* global window, addEventListener, dispatchEvent, CustomEvent, document, HTMLDocument */

this.hooks = this.hooks || (() => {

	const NEW_FONT_FACE_EVENT = "single-file-new-font-face";
	const fontFaces = [];

	if (document instanceof HTMLDocument) {
		const scriptElement = document.createElement("script");
		scriptElement.textContent = `(${hook.toString()})()`;
		document.documentElement.appendChild(scriptElement);
		scriptElement.remove();
		addEventListener(NEW_FONT_FACE_EVENT, event => fontFaces.push(event.detail));
	}

	return {
		getFontsData: () => fontFaces
	};

	function hook() {
		const NEW_FONT_FACE_EVENT = "single-file-new-font-face";
		const FONT_STYLE_PROPERTIES = {
			family: "font-family",
			style: "font-style",
			weight: "font-weight",
			stretch: "font-stretch",
			unicodeRange: "unicode-range",
			variant: "font-variant",
			featureSettings: "font-feature-settings"
		};

		const FontFace = window.FontFace;
		window.__defineGetter__("FontFace", () => new Proxy(FontFace, {
			construct(FontFace, argumentsList) {
				console.warn("SingleFile is hooking the FontFace constructor to get font URLs."); // eslint-disable-line no-console
				const detail = {};
				detail["font-family"] = argumentsList[0];
				detail.src = argumentsList[1];
				const descriptors = argumentsList[2];
				if (descriptors) {
					Object.keys(descriptors).forEach(descriptor => detail[FONT_STYLE_PROPERTIES[descriptor]] = descriptors[descriptor]);
				}
				dispatchEvent(new CustomEvent(NEW_FONT_FACE_EVENT, { detail }));
				return new FontFace(...argumentsList);
			}
		}));
	}

})();