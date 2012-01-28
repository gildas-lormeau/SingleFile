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
	var link = document.getElementById("link");
	var filenameInput = document.getElementById("filename");
	var closeButton = document.getElementById("close");
	var editButton = document.getElementById("edit");
	var params = location.search.substring(1).split("&");
	var date = new Date();
	var time = date.toISOString().split("T")[0] + " " + date.toLocaleTimeString();
	var filename = decodeURIComponent(params[1]) + " (" + time + ")" + ".htm";

	function close() {
		chrome.extension.sendRequest({
			closeBanner : true
		});
	}

	function resetFilename() {
		filenameInput.style.textOverflow = "ellipsis";
		filenameInput.blur();
		filenameInput.contentEditable = false;
		filenameInput.removeEventListener("keydown", onkeydown, false);
	}

	function onkeydown(event) {
		if (event.keyIdentifier == "U+001B") {
			resetFilename();
			filenameInput.textContent = filenameInput.title = filename;
		}
		if (event.keyIdentifier == "Enter") {
			resetFilename();
			filename = link.download = filenameInput.title = filenameInput.textContent;
			event.preventDefault();
		}
	}

	function editName() {
		filenameInput.style["text-overflow"] = "clip";
		filenameInput.contentEditable = true;
		filenameInput.focus();
		filenameInput.addEventListener("keydown", onkeydown, false);
	}

	link.href = decodeURIComponent(params[0]);
	link.download = filenameInput.textContent = filenameInput.title = filename;
	link.addEventListener("click", close, false);
	closeButton.addEventListener("click", close, false);
	editButton.addEventListener("click", editName, false);
})();
