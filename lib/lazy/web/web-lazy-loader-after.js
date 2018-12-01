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

	delete document.documentElement.clientHeight;
	delete document.documentElement.clientWidth;
	delete screen.height;
	delete screen.width;
	if (window._singleFile_getBoundingClientRect) {
		Element.prototype.getBoundingClientRect = window._singleFile_getBoundingClientRect;
		window.innerHeight = window._singleFile_innerHeight;
		window.innerWidth = window._singleFile_innerWidth;
		delete window._singleFile_getBoundingClientRect;
		delete window._singleFile_innerHeight;
		delete window._singleFile_innerWidth;
		delete document.cookie;
		delete window.localStorage;
		window.localStorage = window._singleFile_localStorage;
		delete window._singleFile_localStorage;
	}
	dispatchEvent(new UIEvent("resize"));
	dispatchEvent(new UIEvent("scroll"));

})();