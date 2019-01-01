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

/* global screen, window, document, dispatchEvent, UIEvent, CustomEvent, Element */

(() => {

	const LOAD_OBSERVED_ELEMENTS_EVENT = "single-file-load-observed-elements";
	const clientHeight = document.documentElement.clientHeight;
	const clientWidth = document.documentElement.clientWidth;
	const scrollHeight = Math.max(document.documentElement.scrollHeight - (clientHeight * .5), clientHeight);
	const scrollWidth = Math.max(document.documentElement.scrollWidth - (clientWidth * .5), clientWidth);
	window._singleFile_innerHeight = window.innerHeight;
	window._singleFile_innerWidth = window.innerWidth;
	window.__defineGetter__("innerHeight", () => scrollHeight);
	window.__defineGetter__("innerWidth", () => scrollWidth);
	document.documentElement.__defineGetter__("clientHeight", () => scrollHeight);
	document.documentElement.__defineGetter__("clientWidth", () => scrollWidth);
	screen.__defineGetter__("height", () => scrollHeight);
	screen.__defineGetter__("width", () => scrollWidth);
	window._singleFile_getBoundingClientRect = Element.prototype.getBoundingClientRect;
	Element.prototype.getBoundingClientRect = function () {
		const boundingRect = window._singleFile_getBoundingClientRect.call(this);
		if (this == document.documentElement) {
			boundingRect.__defineGetter__("height", () => scrollHeight);
			boundingRect.__defineGetter__("bottom", () => scrollHeight + boundingRect.top);
			boundingRect.__defineGetter__("width", () => scrollWidth);
			boundingRect.__defineGetter__("right", () => scrollWidth + boundingRect.left);
		}
		return boundingRect;
	};
	window._singleFile_localStorage = window.localStorage;
	window.__defineGetter__("localStorage", () => { throw new Error("localStorage temporary blocked by SingleFile"); });
	document.__defineGetter__("cookie", () => { throw new Error("document.cookie temporary blocked by SingleFile"); });
	dispatchEvent(new UIEvent("resize"));
	dispatchEvent(new UIEvent("scroll"));
	dispatchEvent(new CustomEvent(LOAD_OBSERVED_ELEMENTS_EVENT));

})();