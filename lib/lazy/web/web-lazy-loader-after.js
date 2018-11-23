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

/* global screen, window, document, dispatchEvent, UIEvent, Element */

(() => {

	window.__defineGetter__("innerHeight", () => document.documentElement.clientHeight);
	window.__defineGetter__("innerWidth", () => document.documentElement.clientWidth);
	delete document.documentElement.clientHeight;
	delete document.documentElement.clientWidth;
	delete screen.height;
	delete screen.width;
	if (window._singleFile_getBoundingClientRect) {
		Element.prototype.getBoundingClientRect = window._singleFile_getBoundingClientRect;
		delete window._singleFile_getBoundingClientRect;
	}
	dispatchEvent(new UIEvent("resize"));

})();