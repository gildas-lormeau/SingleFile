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

/* global document, getComputedStyle, requestAnimationFrame */

this.singlefile.ui = this.singlefile.ui || (() => {

	const MASK_TAGNAME = "singlefile-mask";
	const PROGRESS_BAR_TAGNAME = "singlefile-progress-var";

	return {
		init() {
			let maskElement = document.querySelector(MASK_TAGNAME);
			if (!maskElement) {
				requestAnimationFrame(() => {
					maskElement = createElement(MASK_TAGNAME, document.body);
					maskElement.style.setProperty("opacity", 0, "important");
					maskElement.style.setProperty("background-color", "transparent", "important");
					maskElement.offsetWidth;
					maskElement.style.setProperty("position", "fixed", "important");
					maskElement.style.setProperty("top", "0", "important");
					maskElement.style.setProperty("left", "0", "important");
					maskElement.style.setProperty("width", "100%", "important");
					maskElement.style.setProperty("height", "100%", "important");
					maskElement.style.setProperty("z-index", 2147483647, "important");
					maskElement.style.setProperty("transition", "opacity 250ms", "important");
					maskElement.style.setProperty("will-change", "opacity, background-color", "important");
					const progressBarElement = createElement(PROGRESS_BAR_TAGNAME, maskElement);
					progressBarElement.style.setProperty("background-color", "white", "important");
					progressBarElement.style.setProperty("position", "fixed", "important");
					progressBarElement.style.setProperty("top", "0", "important");
					progressBarElement.style.setProperty("left", "0", "important");
					progressBarElement.style.setProperty("width", "0", "important");
					progressBarElement.style.setProperty("height", "8px", "important");
					progressBarElement.style.setProperty("transition", "width 100ms", "important");
					progressBarElement.style.setProperty("will-change", "width", "important");
					maskElement.offsetWidth;
					maskElement.style.setProperty("background-color", "black", "important");
					maskElement.style.setProperty("opacity", .3, "important");
					document.body.offsetWidth;
				});
			}
		},
		onprogress(index, maxIndex) {
			const progressBarElement = document.querySelector(PROGRESS_BAR_TAGNAME);
			if (progressBarElement && maxIndex) {
				const width = Math.floor((index / maxIndex) * 100) + "%";
				if (progressBarElement.style.width != width) {
					requestAnimationFrame(() => progressBarElement.style.setProperty("width", Math.floor((index / maxIndex) * 100) + "%", "important"));
				}
			}
		},
		end() {
			const maskElement = document.querySelector(MASK_TAGNAME);
			if (maskElement) {
				requestAnimationFrame(() => maskElement.remove());
			}
		}
	};

	function createElement(tagName, parentElement) {
		const element = document.createElement(tagName);
		parentElement.appendChild(element);
		Array.from(getComputedStyle(element)).forEach(property => element.style.setProperty(property, "initial", "important"));
		return element;
	}

})();
