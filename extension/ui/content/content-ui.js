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

/* global document, getComputedStyle */

this.singlefile.ui = this.singlefile.ui || (() => {

	const MASK_TAGNAME = "singlefile-mask";
	const PROGRESS_BAR_TAGNAME = "singlefile-progress-var";

	return {
		init() {
			let maskElement = document.querySelector(MASK_TAGNAME);
			if (!maskElement) {
				maskElement = createElement(MASK_TAGNAME, document.body);
				maskElement.style.opacity = 0;
				maskElement.style.backgroundColor = "transparent";
				maskElement.offsetWidth;
				maskElement.style.position = "fixed";
				maskElement.style.top = "0px";
				maskElement.style.left = "0px";
				maskElement.style.height = "100%";
				maskElement.style.width = "100%";
				maskElement.style.zIndex = 2147483647;
				maskElement.style.transition = "opacity 250ms";
				maskElement.style.willChange = "opacity background-color";
				const progressBarElement = createElement(PROGRESS_BAR_TAGNAME, maskElement);
				progressBarElement.style.position = "fixed";
				progressBarElement.style.top = "0px";
				progressBarElement.style.left = "0px";
				progressBarElement.style.height = "8px";
				progressBarElement.style.width = "0%";
				progressBarElement.style.backgroundColor = "white";
				progressBarElement.style.transition = "width 50ms";
				progressBarElement.style.willChange = "width";
				maskElement.offsetWidth;
				maskElement.style.backgroundColor = "black";
				maskElement.style.opacity = .3;
				document.body.offsetWidth;
			}
		},
		onprogress(event) {
			const progressBarElement = document.querySelector(PROGRESS_BAR_TAGNAME);
			if (progressBarElement && event.details.max) {
				const width = Math.floor((event.details.index / event.details.max) * 100) + "%";
				if (progressBarElement.style.width != width) {
					progressBarElement.style.width = Math.floor((event.details.index / event.details.max) * 100) + "%";
					progressBarElement.offsetWidth;
				}
			}
		},
		end() {
			const maskElement = document.querySelector(MASK_TAGNAME);
			if (maskElement) {
				maskElement.remove();
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
