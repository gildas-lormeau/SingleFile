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
		const removeHiddenElementsInput = document.getElementById("removeHiddenElementsInput");
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
		const maxResourceSizeEnabledInput = document.getElementById("maxResourceSizeEnabledInput");
		const confirmFilenameInput = document.getElementById("confirmFilenameInput");
		let pendingSave = Promise.resolve();
		document.getElementById("resetButton").addEventListener("click", async () => {
			await bgPage.singlefile.config.reset();
			await refresh();
			await update();
		}, false);
		maxResourceSizeEnabledInput.addEventListener("click", () => maxResourceSizeInput.disabled = !maxResourceSizeEnabledInput.checked, false);
		document.getElementById("popupContent").onchange = update;
		refresh();

		async function refresh() {
			const config = await bgPage.singlefile.config.get();
			removeHiddenElementsInput.checked = config.removeHiddenElements;
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
			maxResourceSizeEnabledInput.checked = config.maxResourceSizeEnabled;
			maxResourceSizeInput.value = config.maxResourceSize;
			maxResourceSizeInput.disabled = !config.maxResourceSizeEnabled;
			confirmFilenameInput.checked = config.confirmFilename;
		}

		async function update() {
			await pendingSave;
			pendingSave = bgPage.singlefile.config.set({
				removeHiddenElements: removeHiddenElementsInput.checked,
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
				maxResourceSizeEnabled: maxResourceSizeEnabledInput.checked,
				maxResourceSize: maxResourceSizeInput.value,
				confirmFilename: confirmFilenameInput.checked
			});
			await pendingSave;
			await bgPage.singlefile.ui.update();
		}
	});

})();
