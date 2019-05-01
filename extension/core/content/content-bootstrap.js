/*
 * Copyright 2010-2019 Gildas Lormeau
 * contact : gildas.lormeau <at> gmail.com
 * 
 * This file is part of SingleFile.
 *
 *   The code in this file is free software: you can redistribute it and/or 
 *   modify it under the terms of the GNU Affero General Public License 
 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
 *   of the License, or (at your option) any later version.
 * 
 *   The code in this file is distributed in the hope that it will be useful, 
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
 *   General Public License for more details.
 *
 *   As additional permission under GNU AGPL version 3 section 7, you may 
 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
 *   AGPL normally required by section 4, provided you include this license 
 *   notice and a URL through which recipients can access the Corresponding 
 *   Source.
 */

/* global browser, window, addEventListener, removeEventListener, document, location, setTimeout */

this.singlefile.extension.core.content.bootstrap = this.singlefile.extension.core.content.bootstrap || (async () => {

	const singlefile = this.singlefile;

	let unloadListenerAdded, options, autoSaveEnabled, autoSaveTimeout, autoSavingPage, pageAutoSaved;
	browser.runtime.sendMessage({ method: "autosave.init" }).then(message => {
		options = message.options;
		autoSaveEnabled = message.autoSaveEnabled;
		refresh();
	});
	browser.runtime.onMessage.addListener(message => onMessage(message));
	browser.runtime.sendMessage({ method: "ui.loadURL" });
	return {};

	async function onMessage(message) {
		if (message.method == "content.autosave") {
			options = message.options;
			await autoSavePage();
			if (options.autoSaveRepeat) {
				setTimeout(() => {
					if (!autoSavingPage) {
						pageAutoSaved = false;
						options.autoSaveDelay = 0;
						onMessage(message);
					}
				}, options.autoSaveRepeatDelay * 1000);
			}
		}
		if (message.method == "content.init") {
			options = message.options;
			autoSaveEnabled = message.autoSaveEnabled;
			refresh();
		}
	}

	async function autoSavePage() {
		const helper = singlefile.lib.helper;
		const frames = singlefile.lib.frameTree.content.frames;
		if ((!autoSavingPage || autoSaveTimeout) && !pageAutoSaved) {
			autoSavingPage = true;
			if (options.autoSaveDelay && !autoSaveTimeout) {
				autoSaveTimeout = setTimeout(() => {
					autoSavePage();
				}, options.autoSaveDelay * 1000);
			} else {
				const docData = helper.preProcessDoc(document, window, options);
				let framesData = [];
				autoSaveTimeout = null;
				if (!options.removeFrames && frames) {
					framesData = await frames.getAsync(options);
				}
				browser.runtime.sendMessage({
					method: "autosave.save",
					content: helper.serialize(document, false),
					canvasData: docData.canvasData,
					fontsData: docData.fontsData,
					stylesheetsData: docData.stylesheetsData,
					imagesData: docData.imagesData,
					postersData: docData.postersData,
					usedFonts: docData.usedFonts,
					shadowRootsData: docData.shadowRootsData,
					referrer: docData.referrer,
					framesData,
					url: location.href
				});
				helper.postProcessDoc(document, options);
				pageAutoSaved = true;
				autoSavingPage = false;
			}
		}
	}

	async function refresh() {
		if (autoSaveEnabled && options && (options.autoSaveUnload || options.autoSaveLoadOrUnload)) {
			if (!unloadListenerAdded) {
				addEventListener("unload", onUnload);
				addEventListener("single-file-push-state", onUnload);
				unloadListenerAdded = true;
			}
		} else {
			removeEventListener("unload", onUnload);
			removeEventListener("single-file-push-state", onUnload);
			unloadListenerAdded = false;
		}
	}

	function onUnload() {
		const helper = singlefile.lib.helper;
		if (!pageAutoSaved || options.autoSaveUnload) {
			const docData = helper.preProcessDoc(document, window, options);
			let framesData = [];
			if (!options.removeFrames && singlefile.lib.frameTree.content.frames) {
				framesData = singlefile.lib.frameTree.content.frames.getSync(options);
			}
			browser.runtime.sendMessage({
				method: "autosave.save",
				content: helper.serialize(document),
				canvasData: docData.canvasData,
				fontsData: docData.fontsData,
				stylesheetsData: docData.stylesheetsData,
				imagesData: docData.imagesData,
				postersData: docData.postersData,
				usedFonts: docData.usedFonts,
				shadowRootsData: docData.shadowRootsData,
				referrer: docData.referrer,
				framesData,
				url: location.href
			});
		}
	}

})();