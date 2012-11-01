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

	function displayBanner(url) {
		var frame = document.createElement("iframe");
		frame.style.width = "100%";
		frame.style.position = "fixed";
		frame.style.top = "0px";
		frame.style.left = "0px";
		frame.style.borderWidth = "0px";
		frame.style.borderBottomWidth = "1px";
		frame.style.borderBottomStyle = "solid";
		frame.style.borderBottomColor = "#b6bac0";
		frame.style.zIndex = 2147483647;
		frame.style["-webkit-transition"] = "height .5s ease-out";
		frame.src = url;
		frame.id = "singlefile-save-banner";
		document.documentElement.style["-webkit-transition"] = "top .5s ease-out";
		document.documentElement.style.position = "relative";
		document.body.appendChild(frame);
		frame.style.height = "0px";
		frame.offsetLeft;
		document.documentElement.style.top = "36px";
		frame.style.height = "35px";
	}

	function closeBanner() {
		document.documentElement.style["-webkit-transition-duration"] = "0s";
		document.documentElement.style.top = "0px";
		document.body.removeChild(document.getElementById("singlefile-save-banner"));
	}

	window.addEventListener("keyup", function(event) {
		if (event.ctrlKey && event.shiftKey && event.keyCode == 83)
			chrome.extension.sendMessage({});
	}, true);

	if (topWindow) {
		chrome.extension.onMessage.addListener(function(request) {
			if (request.processStart)
				processStart();
			if (request.processEnd)
				processEnd();
			if (request.displayBanner)
				displayBanner(request.url);
			if (request.closeBanner)
				closeBanner();
		});
	}

})();
