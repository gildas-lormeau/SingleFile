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

/* global screen, window, document, dispatchEvent, UIEvent, CustomEvent, Element */

(() => {

	const LOAD_OBSERVED_ELEMENTS_EVENT = "single-file-load-observed-elements";

	window.__defineGetter__("innerHeight", () => document.documentElement.scrollHeight);
	window.__defineGetter__("innerWidth", () => document.documentElement.scrollWidth);
	document.documentElement.__defineGetter__("clientHeight", () => document.documentElement.scrollHeight);
	document.documentElement.__defineGetter__("clientWidth", () => document.documentElement.scrollWidth);
	screen.__defineGetter__("height", () => document.documentElement.scrollHeight);
	screen.__defineGetter__("width", () => document.documentElement.scrollWidth);
	window._singleFile_getBoundingClientRect = Element.prototype.getBoundingClientRect;
	Element.prototype.getBoundingClientRect = function () {
		const boundingRect = window._singleFile_getBoundingClientRect.call(this);
		if (this == document.documentElement) {
			boundingRect.__defineGetter__("height", () => document.documentElement.scrollHeight);
			boundingRect.__defineGetter__("bottom", () => document.documentElement.scrollHeight + boundingRect.top);
			boundingRect.__defineGetter__("width", () => document.documentElement.scrollWidth);
			boundingRect.__defineGetter__("right", () => document.documentElement.scrollWidth + boundingRect.left);
		}
		return boundingRect;
	};
	dispatchEvent(new UIEvent("scroll"));
	dispatchEvent(new UIEvent("resize"));
	dispatchEvent(new UIEvent("scroll"));
	dispatchEvent(new CustomEvent(LOAD_OBSERVED_ELEMENTS_EVENT));

})();