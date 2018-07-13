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

(() => {

	const browser = this.browser || this.chrome;

	browser.runtime.getBackgroundPage(bgPage => {
		const removeHiddenInput = document.getElementById("removeHiddenInput");
		const removeUnusedCSSRulesInput = document.getElementById("removeUnusedCSSRulesInput");
		const removeFramesInput = document.getElementById("removeFramesInput");
		const removeImportsInput = document.getElementById("removeImportsInput");
		const removeScriptsInput = document.getElementById("removeScriptsInput");
		const saveRawPageInput = document.getElementById("saveRawPageInput");
		const compressHTMLInput = document.getElementById("compressHTMLInput");
		const compressCSSInput = document.getElementById("compressCSSInput");
		const lazyLoadImagesInput = document.getElementById("lazyLoadImagesInput");
		const contextMenuEnabledInput = document.getElementById("contextMenuEnabledInput");
		const appendSaveDateInput = document.getElementById("appendSaveDateInput");
		const shadowEnabledInput = document.getElementById("shadowEnabledInput");
		const maxResourceSizeInput = document.getElementById("maxResourceSizeInput");
		document.getElementById("resetButton").addEventListener("click", () => {
			bgPage.singlefile.config.reset()
				.then(refresh)
				.then(update);
		}, false);
		document.getElementById("popupContent").onchange = update;
		refresh();

		async function refresh() {
			const config = await bgPage.singlefile.config.get();
			removeHiddenInput.checked = config.removeHidden;
			removeUnusedCSSRulesInput.checked = config.removeUnusedCSSRules;
			removeFramesInput.checked = config.removeFrames;
			removeImportsInput.checked = config.removeImports;
			removeScriptsInput.checked = config.removeScripts;
			saveRawPageInput.checked = config.saveRawPage;
			compressHTMLInput.checked = config.compressHTML;
			compressCSSInput.checked = config.compressCSS;
			lazyLoadImagesInput.checked = config.lazyLoadImages;
			contextMenuEnabledInput.checked = config.contextMenuEnabled;
			appendSaveDateInput.checked = config.appendSaveDate;
			shadowEnabledInput.checked = config.shadowEnabled;
			maxResourceSizeInput.value = config.maxResourceSize;
		}

		async function update() {
			await bgPage.singlefile.config.set({
				removeHidden: removeHiddenInput.checked,
				removeUnusedCSSRules: removeUnusedCSSRulesInput.checked,
				removeFrames: removeFramesInput.checked,
				removeImports: removeImportsInput.checked,
				removeScripts: removeScriptsInput.checked,
				saveRawPage: saveRawPageInput.checked,
				compressHTML: compressHTMLInput.checked,
				compressCSS: compressCSSInput.checked,
				lazyLoadImages: lazyLoadImagesInput.checked,
				contextMenuEnabled: contextMenuEnabledInput.checked,
				appendSaveDate: appendSaveDateInput.checked,
				shadowEnabled: shadowEnabledInput.checked,
				maxResourceSize: maxResourceSizeInput.value
			});
			await bgPage.singlefile.ui.update();
		}
	});

})();
