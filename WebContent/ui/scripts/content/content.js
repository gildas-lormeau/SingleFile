/*
 * Copyright 2011 Gildas Lormeau
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

(function() {

	var MASK_ID = "__SingleFile_mask__", topWindow = window == top;

	function processStart() {
		var div = document.getElementById(MASK_ID);
		if (!div) {
			div = document.createElement("div");
			div.id = "__SingleFile_mask__";
			div.style.position = "fixed";
			div.style.top = "0px";
			div.style.left = "0px";
			div.style.height = "100%";
			div.style.width = "100%";
			div.style.backgroundColor = "black";
			div.style.zIndex = 2147483647;
			div.style.opacity = 0;
			div.style["-webkit-transition"] = "opacity 250ms";
			document.body.appendChild(div);
			div.offsetWidth;
			div.style.opacity = .3;
		}
	}

	function processEnd() {
		var div = document.getElementById(MASK_ID);
		if (div)
			document.body.removeChild(div);
	}

	window.addEventListener("keyup", function(event) {
		if (event.ctrlKey && event.shiftKey && event.keyCode == 83)
			chrome.extension.sendRequest({});
	}, true);

	if (topWindow)
		chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
			if (request.processStart)
				processStart();
			if (request.processEnd)
				processEnd();
		});

})();