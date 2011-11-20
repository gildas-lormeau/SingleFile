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

	var removeScriptsInput, removeFramesInput, removeObjectsInput, removeHiddenInput, removeUnusedCSSRulesInput, processInBackgroundInput, getRawDocInput, sendToPageArchiverInput, displayNotificationInput, displayBannerInput, displayInContextMenuInput, bgPage = chrome.extension
			.getBackgroundPage(), config;

	function refresh() {
		config = bgPage.singlefile.config.get();
		removeFramesInput.checked = config.removeFrames;
		removeScriptsInput.checked = config.removeScripts;
		removeObjectsInput.checked = config.removeObjects;
		removeHiddenInput.checked = config.removeHidden;
		removeUnusedCSSRulesInput.checked = config.removeUnusedCSSRules;
		displayInContextMenuInput.checked = config.displayInContextMenu;
		displayNotificationInput.checked = config.displayNotification;
		displayBannerInput.checked = config.displayBanner;
		processInBackgroundInput.checked = config.processInBackground;
		getRawDocInput.checked = config.getRawDoc;
		sendToPageArchiverInput.checked = config.sendToPageArchiver;
		if (displayNotificationInput.checked || displayBannerInput.checked)
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
			displayNotification : displayNotificationInput.checked,
			displayBanner : displayBannerInput.checked,
			displayProcessedPage : !displayNotificationInput.checked && !displayBannerInput.checked,
			processInBackground : processInBackgroundInput.checked,
			getRawDoc : getRawDocInput.checked,
			sendToPageArchiver : sendToPageArchiverInput.checked
		});
	}

	function updateProcessInBackground() {
		processInBackgroundInput.checked = processInBackgroundInput.disabled = displayNotificationInput.checked || displayBannerInput.checked;
	}

	removeFramesInput = document.getElementById("removeFramesInput");
	removeScriptsInput = document.getElementById("removeScriptsInput");
	removeObjectsInput = document.getElementById("removeObjectsInput");
	removeHiddenInput = document.getElementById("removeHiddenInput");
	removeUnusedCSSRulesInput = document.getElementById("removeUnusedCSSRulesInput");
	displayInContextMenuInput = document.getElementById("displayInContextMenuInput");
	displayNotificationInput = document.getElementById("displayNotificationInput");
	displayBannerInput = document.getElementById("displayBannerInput");
	processInBackgroundInput = document.getElementById("processInBackgroundInput");
	getRawDocInput = document.getElementById("getRawDocInput");
	sendToPageArchiverInput = document.getElementById("sendToPageArchiverInput");
	displayInContextMenuInput.addEventListener("click", bgPage.singlefile.refreshMenu);
	displayNotificationInput.addEventListener("click", updateProcessInBackground, false);
	displayBannerInput.addEventListener("click", updateProcessInBackground, false);
	document.getElementById("resetButton").addEventListener("click", function() {
		bgPage.singlefile.config.reset();
		refresh();
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
