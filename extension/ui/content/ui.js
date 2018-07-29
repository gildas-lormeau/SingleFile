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

/* global document */

this.singlefile.ui = this.singlefile.ui || (() => {

	const MASK_TAGNAME = "singlefile-mask";

	return {
		init() {
			let maskElement = document.querySelector(MASK_TAGNAME);
			if (!maskElement) {
				maskElement = document.createElement(MASK_TAGNAME);
				maskElement.style.all = "unset";
				maskElement.style.position = "fixed";
				maskElement.style.top = "0px";
				maskElement.style.left = "0px";
				maskElement.style.height = "100%";
				maskElement.style.width = "100%";
				maskElement.style.backgroundColor = "black";
				maskElement.style.zIndex = 2147483647;
				maskElement.style.opacity = 0;
				maskElement.style.transition = "opacity 250ms";
				document.body.appendChild(maskElement);
				maskElement.offsetWidth;
				maskElement.style.opacity = .3;
			}
		},
		end() {
			const maskElement = document.querySelector(MASK_TAGNAME);
			if (maskElement) {
				maskElement.remove();
			}
		}
	};

})();
