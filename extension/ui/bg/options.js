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

/* global browser, document */

(async () => {

	const bgPage = await browser.runtime.getBackgroundPage();
	const removeHiddenElementsInput = document.getElementById("removeHiddenElementsInput");
	const removeUnusedStylesInput = document.getElementById("removeUnusedStylesInput");
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
	const removeAudioSrcInput = document.getElementById("removeAudioSrcInput");
	const removeVideoSrcInput = document.getElementById("removeVideoSrcInput");
	const displayInfobarInput = document.getElementById("displayInfobarInput");
	const displayStatsInput = document.getElementById("displayStatsInput");
	const backgroundSaveInput = document.getElementById("backgroundSaveInput");
	const autoSaveDelayInput = document.getElementById("autoSaveDelayInput");
	const autoSaveLoadInput = document.getElementById("autoSaveLoadInput");
	const autoSaveUnloadInput = document.getElementById("autoSaveUnloadInput");
	const autoSaveLoadOrUnloadInput = document.getElementById("autoSaveLoadOrUnloadInput");
	const removeAlternativeFontsInput = document.getElementById("removeAlternativeFontsInput");
	const removeSrcSetInput = document.getElementById("removeSrcSetInput");
	let pendingSave = Promise.resolve();
	document.getElementById("resetButton").addEventListener("click", async () => {
		await bgPage.singlefile.config.reset();
		await refresh();
		await update();
	}, false);
	maxResourceSizeEnabledInput.addEventListener("click", () => maxResourceSizeInput.disabled = !maxResourceSizeEnabledInput.checked, false);
	autoSaveUnloadInput.addEventListener("click", async () => {
		autoSaveDelayInput.disabled = autoSaveUnloadInput.checked;
		await bgPage.singlefile.ui.autosave.refresh();
	}, false);
	autoSaveLoadOrUnloadInput.addEventListener("click", async () => {
		autoSaveUnloadInput.disabled = autoSaveLoadInput.disabled = autoSaveLoadOrUnloadInput.checked;
		if (autoSaveLoadOrUnloadInput.checked) {
			autoSaveUnloadInput.checked = autoSaveLoadInput.checked = false;
		} else {
			autoSaveUnloadInput.checked = false;
			autoSaveLoadInput.checked = true;
		}
		await bgPage.singlefile.ui.autosave.refresh();
	}, false);
	document.body.onchange = update;
	refresh();

	async function refresh() {
		const config = await bgPage.singlefile.config.get();
		removeHiddenElementsInput.checked = config.removeHiddenElements;
		removeUnusedStylesInput.checked = config.removeUnusedStyles;
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
		removeAudioSrcInput.checked = config.removeAudioSrc;
		removeVideoSrcInput.checked = config.removeVideoSrc;
		displayInfobarInput.checked = config.displayInfobar;
		displayStatsInput.checked = config.displayStats;
		backgroundSaveInput.checked = config.backgroundSave;
		autoSaveDelayInput.value = config.autoSaveDelay;
		autoSaveDelayInput.disabled = config.autoSaveUnload;
		autoSaveLoadInput.checked = !config.autoSaveLoadOrUnload && config.autoSaveLoad;
		autoSaveLoadOrUnloadInput.checked = config.autoSaveLoadOrUnload;
		autoSaveUnloadInput.checked = !config.autoSaveLoadOrUnload && config.autoSaveUnload;
		autoSaveLoadInput.disabled = config.autoSaveLoadOrUnload;
		autoSaveUnloadInput.disabled = config.autoSaveLoadOrUnload;
		removeAlternativeFontsInput.checked = config.removeAlternativeFonts;
		removeSrcSetInput.checked = config.removeSrcSet;
	}

	async function update() {
		await pendingSave;
		pendingSave = bgPage.singlefile.config.set({
			removeHiddenElements: removeHiddenElementsInput.checked,
			removeUnusedStyles: removeUnusedStylesInput.checked,
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
			confirmFilename: confirmFilenameInput.checked,
			removeAudioSrc: removeAudioSrcInput.checked,
			removeVideoSrc: removeVideoSrcInput.checked,
			displayInfobar: displayInfobarInput.checked,
			displayStats: displayStatsInput.checked,
			backgroundSave: backgroundSaveInput.checked,
			autoSaveDelay: autoSaveDelayInput.value,
			autoSaveLoad: autoSaveLoadInput.checked,
			autoSaveUnload: autoSaveUnloadInput.checked,
			autoSaveLoadOrUnload: autoSaveLoadOrUnloadInput.checked,
			removeAlternativeFonts: removeAlternativeFontsInput.checked,
			removeSrcSet: removeSrcSetInput.checked
		});
		await pendingSave;
		await bgPage.singlefile.ui.menu.refresh();
	}

})();
