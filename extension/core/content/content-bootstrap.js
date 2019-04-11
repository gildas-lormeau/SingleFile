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

/* global singlefile, frameTree, browser, window, addEventListener, removeEventListener, document, location, docHelper, setTimeout */

this.singlefile.bootstrap = this.singlefile.bootstrap || (async () => {

	let unloadListenerAdded, options, autoSaveEnabled, autoSaveTimeout, autoSavingPage;
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
			autoSavingPage = false;
			singlefile.pageAutoSaved = false;
			options = message.options;
			await autoSavePage();
			if (options.autoSaveRepeat) {
				setTimeout(() => onMessage(message), options.autoSaveRepeatDelay * 1000);
			}
		}
		if (message.method == "content.init") {
			options = message.options;
			autoSaveEnabled = message.autoSaveEnabled;
			refresh();
		}
	}

	async function autoSavePage() {
		if ((!autoSavingPage || autoSaveTimeout) && !singlefile.pageAutoSaved) {
			autoSavingPage = true;
			if (options.autoSaveDelay && !autoSaveTimeout) {
				autoSaveTimeout = setTimeout(() => {
					autoSavePage();
				}, options.autoSaveDelay * 1000);
			} else {
				const docData = docHelper.preProcessDoc(document, window, options);
				let framesData = [];
				autoSaveTimeout = null;
				if (!options.removeFrames && this.frameTree) {
					framesData = await frameTree.getAsync(options);
				}
				browser.runtime.sendMessage({
					method: "autosave.save",
					content: docHelper.serialize(document, false),
					canvasData: docData.canvasData,
					fontsData: docData.fontsData,
					stylesheetContents: docData.stylesheetContents,
					imageData: docData.imageData,
					postersData: docData.postersData,
					usedFonts: docData.usedFonts,
					shadowRootContents: docData.shadowRootContents,
					referrer: docData.referrer,
					framesData,
					url: location.href
				});
				docHelper.postProcessDoc(document, options);
				singlefile.pageAutoSaved = true;
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
		if (!singlefile.pageAutoSaved || options.autoSaveUnload) {
			const docData = docHelper.preProcessDoc(document, window, options);
			let framesData = [];
			if (this.frameTree && !options.removeFrames) {
				framesData = frameTree.getSync(options);
			}
			browser.runtime.sendMessage({
				method: "autosave.save",
				content: docHelper.serialize(document),
				canvasData: docData.canvasData,
				fontsData: docData.fontsData,
				stylesheetContents: docData.stylesheetContents,
				imageData: docData.imageData,
				postersData: docData.postersData,
				usedFonts: docData.usedFonts,
				shadowRootContents: docData.shadowRootContents,
				referrer: docData.referrer,
				framesData,
				url: location.href
			});
		}
	}
})();