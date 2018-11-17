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

/* global window, Element, document, dispatchEvent, UIEvent, clearTimeout */

(() => {

	if (window._singleFile_getBoundingClientRect) {
		Element.prototype.getBoundingClientRect = window._singleFile_getBoundingClientRect;
		delete window._singleFile_getBoundingClientRect;
		dispatchEvent(new UIEvent("scroll"));
	}
	if (window._singleFile_timeoutScroll) {
		clearTimeout(window._singleFile_timeoutScroll);
		delete window._singleFile_timeoutScroll;
		delete document.documentElement.scrollTop;
		window.__defineGetter__("pageYOffset", () => document.documentElement.scrollTop);
		document.documentElement.__defineGetter__("scrollY", () => document.documentElement.scrollTop);
		dispatchEvent(new UIEvent("scroll"));
	}

})();