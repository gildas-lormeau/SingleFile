/*
 * Copyright 2010 Gildas Lormeau
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

function load() {
	var bgPage = chrome.extension.getBackgroundPage(), options = bgPage.singlefile.getOptions(), removeScriptsInput, removeFramesInput, removeObjectsInput, removeHiddenInput, removeUnusedInput;
	removeFramesInput = document.getElementById("removeFramesInput");
	removeScriptsInput = document.getElementById("removeScriptsInput");
	removeObjectsInput = document.getElementById("removeObjectsInput");
	removeHiddenInput = document.getElementById("removeHiddenInput");
	removeUnusedInput = document.getElementById("removeUnusedInput");
	document.getElementById("popupContent").onchange = function() {
		setTimeout(function() {
			bgPage.singlefile.setOptions( {
				removeFrames : removeFramesInput.checked,
				removeScripts : removeScriptsInput.checked,
				removeObjects : removeObjectsInput.checked,
				removeHidden : removeHiddenInput.checked,
				removeUnused : removeUnusedInput.checked
			});
		}, 500);		
	};
	removeFramesInput.checked = options.removeFrames;
	removeScriptsInput.checked = options.removeScripts;
	removeObjectsInput.checked = options.removeObjects;
	removeHiddenInput.checked = options.removeHidden;
	removeUnusedInput.checked = options.removeUnused;
	removeScriptsInput.addEventListener("click", function() {
		removeHiddenInput.checked = false;
		removeUnusedInput.checked = false;		
	});
	document.getElementById("resetButton").addEventListener("click", function() {
		bgPage.singlefile.resetOptions();
		load();
	});
}