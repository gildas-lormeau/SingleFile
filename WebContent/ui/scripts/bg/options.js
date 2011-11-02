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

	var removeScriptsInput, removeFramesInput, removeObjectsInput, removeHiddenInput, removeUnusedCSSRulesInput, processInBackgroundInput, getRawDocInput, getContentInput, displayInContextMenu, bgPage = chrome.extension
			.getBackgroundPage(), config = bgPage.singlefile.config.get();
	removeFramesInput = document.getElementById("removeFramesInput");
	removeScriptsInput = document.getElementById("removeScriptsInput");
	removeObjectsInput = document.getElementById("removeObjectsInput");
	removeHiddenInput = document.getElementById("removeHiddenInput");
	removeUnusedCSSRulesInput = document.getElementById("removeUnusedCSSRulesInput");
	displayInContextMenuInput = document.getElementById("displayInContextMenuInput");
	processInBackgroundInput = document.getElementById("processInBackgroundInput");
	getRawDocInput = document.getElementById("getRawDocInput");
	getContentInput = document.getElementById("getContentInput");
	document.getElementById("popupContent").onchange = function() {
		bgPage.singlefile.config.set({
			removeFrames : removeFramesInput.checked,
			removeScripts : removeScriptsInput.checked,
			removeObjects : removeObjectsInput.checked,
			removeHidden : removeHiddenInput.checked,
			removeUnusedCSSRules : removeUnusedCSSRulesInput.checked,
			displayInContextMenu : displayInContextMenuInput.checked,
			processInBackground : processInBackgroundInput.checked,
			getRawDoc : getRawDocInput.checked,
			getContent : getContentInput.checked
		});
	};
	removeFramesInput.checked = config.removeFrames;
	removeScriptsInput.checked = config.removeScripts;
	removeObjectsInput.checked = config.removeObjects;
	removeHiddenInput.checked = config.removeHidden;
	removeUnusedCSSRulesInput.checked = config.removeUnusedCSSRules;
	displayInContextMenuInput.checked = config.displayInContextMenu;
	processInBackgroundInput.checked = config.processInBackground;
	getRawDocInput.checked = config.getRawDoc;
	getContentInput.checked = config.getContent;
	displayInContextMenuInput.addEventListener("click", bgPage.singlefile.refreshMenu);
	document.getElementById("resetButton").addEventListener("click", function() {
		bgPage.singlefile.config.reset();
		load();
	});
	addEventListener("click", function(event) {
		var tooltip;
		if (event.target.className == "question-mark") {
			tooltip = event.target.parentElement.parentElement.children[2];
			tooltip.style.display = tooltip.style.display == "block" ? "none" : "block";
			event.preventDefault();
		}
	});

})();
