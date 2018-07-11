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

/* global document, addEventListener */

(() => {

	const browser = this.browser || this.chrome;

	browser.runtime.getBackgroundPage(bgPage => {
		const removeHiddenInput = document.getElementById("removeHiddenInput");
		const removeUnusedCSSRulesInput = document.getElementById("removeUnusedCSSRulesInput");
		const removeFramesInput = document.getElementById("removeFramesInput");
		const removeScriptsInput = document.getElementById("removeScriptsInput");
		const saveRawPageInput = document.getElementById("saveRawPageInput");
		const compressHTMLInput = document.getElementById("compressHTMLInput");
		document.getElementById("resetButton").addEventListener("click", () => {
			bgPage.singlefile.config.reset();
			refresh();
			update();
		}, false);
		addEventListener("click", event => {
			if (event.target.className == "question-mark") {
				const tooltip = event.target.parentElement.parentElement.children[2];
				tooltip.style.display = tooltip.style.display == "block" ? "none" : "block";
				event.preventDefault();
			}
		}, false);
		document.getElementById("popupContent").onchange = update;
		refresh();

		function refresh() {
			const config = bgPage.singlefile.config.get();
			removeHiddenInput.checked = config.removeHidden;
			removeUnusedCSSRulesInput.checked = config.removeUnusedCSSRules;
			removeFramesInput.checked = config.removeFrames;
			removeScriptsInput.checked = config.removeScripts;
			saveRawPageInput.checked = config.saveRawPage;
			compressHTMLInput.checked = config.compressHTML;
		}

		function update() {
			bgPage.singlefile.config.set({
				removeHidden: removeHiddenInput.checked,
				removeUnusedCSSRules: removeUnusedCSSRulesInput.checked,
				removeFrames: removeFramesInput.checked,
				removeScripts: removeScriptsInput.checked,
				saveRawPage: saveRawPageInput.checked,
				compressHTML: compressHTMLInput.checked
			});
		}
	});

})();
