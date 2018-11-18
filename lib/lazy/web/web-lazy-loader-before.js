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

/* global window, Element, document, dispatchEvent, UIEvent, setTimeout */

(() => {

	const SCROLL_LENGTH = 200;
	const SCROLL_DELAY = 100;

	window._singleFile_getBoundingClientRect = Element.prototype.getBoundingClientRect;
	Element.prototype.getBoundingClientRect = function () {
		const boundingRect = window._singleFile_getBoundingClientRect.call(this);
		const quarterLeft = Math.floor(window.innerWidth / 4);
		const quarterTop = Math.floor(window.innerHeight / 4);
		const top = (boundingRect.top > 0 && boundingRect.top < window.innerHeight) ? boundingRect.top : boundingRect.top > window.innerHeight ? window.innerHeight - quarterTop : quarterTop;
		const left = (boundingRect.left > 0 && boundingRect.left < window.innerHeight) ? boundingRect.left : boundingRect.left > window.innerHeight ? window.innerHeight - quarterLeft : quarterLeft;
		const bottom = top + boundingRect.height;
		const right = left + boundingRect.width;
		return { x: boundingRect.x, y: boundingRect.y, top, bottom, left, right, width: boundingRect.width, height: boundingRect.height };
	};
	dispatchEvent(new UIEvent("scroll"));
	const scrollTop = document.documentElement.scrollTop;
	scroll(SCROLL_LENGTH, document.documentElement.scrollHeight - window.innerHeight);

	function scroll(offsetY, maxOffsetY) {
		document.documentElement.__defineGetter__("scrollTop", () => offsetY);
		window.__defineGetter__("scrollY", () => offsetY);
		window.__defineGetter__("pageYOffset", () => offsetY);
		processScroll();

		function processScroll() {
			if (offsetY < maxOffsetY) {
				offsetY += SCROLL_LENGTH;
			} else {
				offsetY = scrollTop;
			}
			dispatchEvent(new UIEvent("scroll"));
			window._singleFile_timeoutScroll = setTimeout(processScroll, SCROLL_DELAY);
		}
	}

})();