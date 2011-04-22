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

function load() {
	var removeScriptsInput, removeFramesInput, removeObjectsInput, removeHiddenInput, removeUnusedCSSRulesInput, processInBackgroundInput, getRawDocInput, displayProcessedPageInput, savePageInput, getContentInput;
	var bgPage = chrome.extension.getBackgroundPage(), config = bgPage.singlefile.config.get(), filenameMaxLengthInput, storageIsEnabled = (typeof window.requestFileSystem != "undefined" || typeof window.webkitRequestFileSystem != "undefined")
			&& typeof ArrayBuffer != "undefined";

	function refresh() {
		savePageInput.disabled = !storageIsEnabled;
		if (savePageInput.disabled)
			savePageInput.checked = false;
		displayProcessedPageInput.disabled = !savePageInput.checked || removeUnusedCSSRulesInput.checked;
		if (displayProcessedPageInput.disabled) {
			document.querySelector("label[for=displayProcessedPageInput]").style.opacity = ".5";
			displayProcessedPageInput.checked = true;
		} else
			document.querySelector("label[for=displayProcessedPageInput]").style.opacity = "1";
	}

	removeFramesInput = document.getElementById("removeFramesInput");
	removeScriptsInput = document.getElementById("removeScriptsInput");
	removeObjectsInput = document.getElementById("removeObjectsInput");
	removeHiddenInput = document.getElementById("removeHiddenInput");
	removeUnusedCSSRulesInput = document.getElementById("removeUnusedCSSRulesInput");
	processInBackgroundInput = document.getElementById("processInBackgroundInput");
	getRawDocInput = document.getElementById("getRawDocInput");
	displayProcessedPageInput = document.getElementById("displayProcessedPageInput");
	savePageInput = document.getElementById("savePageInput");
	filenameMaxLengthInput = document.getElementById("filenameMaxLengthInput");
	getContentInput = document.getElementById("getContentInput");
	document.getElementById("popupContent").onchange = function() {
		refresh();
		bgPage.singlefile.config.set({
			removeFrames : removeFramesInput.checked,
			removeScripts : removeScriptsInput.checked,
			removeObjects : removeObjectsInput.checked,
			removeHidden : removeHiddenInput.checked,
			removeUnusedCSSRules : removeUnusedCSSRulesInput.checked,
			processInBackground : processInBackgroundInput.checked,
			getRawDoc : getRawDocInput.checked,
			displayProcessedPage : displayProcessedPageInput.checked,
			savePage : savePageInput.checked,
			filenameMaxLength : parseInt(filenameMaxLengthInput.value, 10),
			getContent : getContentInput.checked
		});
	};
	removeFramesInput.checked = config.removeFrames;
	removeScriptsInput.checked = config.removeScripts;
	removeObjectsInput.checked = config.removeObjects;
	removeHiddenInput.checked = config.removeHidden;
	removeUnusedCSSRulesInput.checked = config.removeUnusedCSSRules;
	processInBackgroundInput.checked = config.processInBackground;
	getRawDocInput.checked = config.getRawDoc;
	displayProcessedPageInput.checked = config.displayProcessedPage;
	savePageInput.checked = config.savePage;
	filenameMaxLengthInput.value = config.filenameMaxLength;
	getContentInput.checked = config.getContent;
	refresh();
	document.getElementById("resetButton").addEventListener("click", function() {
		bgPage.singlefile.config.reset();
		load();
	});
	document.getElementById("storageOptions").style.display = storageIsEnabled ? "" : "none";
}

addEventListener("load", load);
addEventListener("click", function(event) {
	var tooltip;
	if (event.target.className == "question-mark") {
		tooltip = event.target.parentElement.parentElement.children[2];
		tooltip.style.display = tooltip.style.display == "block" ? "none" : "block";
		event.preventDefault();
	}
});