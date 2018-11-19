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

/* global screen, window, document, dispatchEvent, UIEvent */

(() => {

	window.__defineGetter__("innerHeight", () => document.documentElement.scrollHeight);
	window.__defineGetter__("innerWidth", () => document.documentElement.scrollWidth);
	document.documentElement.__defineGetter__("clientHeight", () => document.documentElement.scrollHeight);
	document.documentElement.__defineGetter__("clientWidth", () => document.documentElement.scrollWidth);
	screen.__defineGetter__("height", () => document.documentElement.scrollHeight);
	screen.__defineGetter__("width", () => document.documentElement.scrollWidth);
	dispatchEvent(new UIEvent("resize"));

})();