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

	var removeScriptsInput, removeFramesInput, removeObjectsInput, removeHiddenInput, removeUnusedCSSRulesInput,
		processInBackgroundInput, maxFrameSizeInput, getRawDocInput, sendToPageArchiverInput, displayBannerInput,
		displayInContextMenuInput, bgPage = chrome.extension
			.getBackgroundPage(), config, scaleImagesInput, removeBackgroundImagesInput;

	function refresh() {
		config = bgPage.singlefile.config.get();
		removeFramesInput.checked = config.removeFrames;
		removeScriptsInput.checked = config.removeScripts;
		removeObjectsInput.checked = config.removeObjects;
		removeHiddenInput.checked = config.removeHidden;
		removeUnusedCSSRulesInput.checked = config.removeUnusedCSSRules;
		displayInContextMenuInput.checked = config.displayInContextMenu;
		displayBannerInput.checked = config.displayBanner;
		processInBackgroundInput.checked = config.processInBackground;
		maxFrameSizeInput.value = config.maxFrameSize;
		getRawDocInput.checked = config.getRawDoc;
		sendToPageArchiverInput.checked = config.sendToPageArchiver;
		scaleImagesInput.value = config.scaleImages;
		removeBackgroundImagesInput.checked = config.removeBackgroundImages;
		if (displayBannerInput.checked)
			processInBackgroundInput.checked = processInBackgroundInput.disabled = true;
	}

	function update() {
		bgPage.singlefile.config.set({
			removeFrames : removeFramesInput.checked,
			removeScripts : removeScriptsInput.checked,
			removeObjects : removeObjectsInput.checked,
			removeHidden : removeHiddenInput.checked,
			removeUnusedCSSRules : removeUnusedCSSRulesInput.checked,
			displayInContextMenu : displayInContextMenuInput.checked,
			displayBanner : displayBannerInput.checked,
			displayProcessedPage : !displayBannerInput.checked,
			processInBackground : processInBackgroundInput.checked,
			maxFrameSize: maxFrameSizeInput.valueAsNumber || 0,
			getRawDoc : getRawDocInput.checked,
			sendToPageArchiver : sendToPageArchiverInput.checked,
			scaleImages : scaleImagesInput.valueAsNumber < 0 || scaleImagesInput.valueAsNumber > 1 ? 0.2 :
				scaleImagesInput.valueAsNumber,
			removeBackgroundImages : removeBackgroundImagesInput.checked
		});
	}

	function updateProcessInBackground() {
		processInBackgroundInput.checked = processInBackgroundInput.disabled = displayBannerInput.checked;
		update();
	}

	removeFramesInput = document.getElementById("removeFramesInput");
	removeScriptsInput = document.getElementById("removeScriptsInput");
	removeObjectsInput = document.getElementById("removeObjectsInput");
	removeHiddenInput = document.getElementById("removeHiddenInput");
	removeUnusedCSSRulesInput = document.getElementById("removeUnusedCSSRulesInput");
	displayInContextMenuInput = document.getElementById("displayInContextMenuInput");
	displayBannerInput = document.getElementById("displayBannerInput");
	processInBackgroundInput = document.getElementById("processInBackgroundInput");
	maxFrameSizeInput = document.getElementById("maxFrameSizeInput");
	getRawDocInput = document.getElementById("getRawDocInput");
	sendToPageArchiverInput = document.getElementById("sendToPageArchiverInput");
	scaleImagesInput = document.getElementById("scaleImages");
	removeBackgroundImagesInput = document.getElementById("removeBackgroundImages");
	displayInContextMenuInput.addEventListener("click", bgPage.singlefile.refreshMenu);
	displayBannerInput.addEventListener("click", updateProcessInBackground, false);
	document.getElementById("resetButton").addEventListener("click", function() {
		bgPage.singlefile.config.reset();
		refresh();
		update();
	}, false);
	addEventListener("click", function(event) {
		var tooltip;
		if (event.target.className == "question-mark") {
			tooltip = event.target.parentElement.parentElement.children[2];
			tooltip.style.display = tooltip.style.display == "block" ? "none" : "block";
			event.preventDefault();
		}
	}, false);
	document.getElementById("popupContent").onchange = update;
	refresh();

})();
