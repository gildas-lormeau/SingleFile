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

/* global singlefile, frameTree, browser, window, addEventListener, removeEventListener, document, location, docHelper, setTimeout */

this.singlefile.bootstrap = this.singlefile.bootstrap || (async () => {

	let listenerAdded, options, autoSaveEnabled, autoSaveTimeout, autoSavingPage;
	browser.runtime.sendMessage({ isAutoSaveEnabled: true }).then(message => {
		options = message.options;
		autoSaveEnabled = message.autoSaveEnabled;
		refresh();
	});
	browser.runtime.onMessage.addListener(message => {
		if (message.autoSavePage) {
			autoSavingPage = false;
			singlefile.pageAutoSaved = false;
			options = message.options;
			autoSavePage();
		}
		if (message.autoSaveUnloadEnabled) {
			options = message.options;
			autoSaveEnabled = message.autoSaveEnabled;
			refresh();
		}
	});
	browser.runtime.sendMessage({ processReset: true });
	return {};

	async function autoSavePage() {
		if ((!autoSavingPage || autoSaveTimeout) && !singlefile.pageAutoSaved) {
			autoSavingPage = true;
			options.sessionId = 0;
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
					autoSaveContent: true,
					content: docHelper.serialize(document, false),
					canvasData: docData.canvasData,
					fontsData: docData.fontsData,
					stylesheetContents: docData.stylesheetContents,
					imageData: docData.imageData,
					postersData: docData.postersData,
					usedFonts: docData.usedFonts,
					shadowRootContents: docData.shadowRootContents,
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
			if (!listenerAdded) {
				addEventListener("unload", onUnload);
				addEventListener("single-file-push-state", onUnload);
				listenerAdded = true;
			}
		} else {
			removeEventListener("unload", onUnload);
			removeEventListener("single-file-push-state", onUnload);
			listenerAdded = false;
		}
	}

	function onUnload() {
		if (!singlefile.pageAutoSaved || options.autoSaveUnload) {
			options.sessionId = 0;
			const docData = docHelper.preProcessDoc(document, window, options);
			const framesData = (typeof frameTree != "undefined") && !options.removeFrames && frameTree.getSync(options);
			browser.runtime.sendMessage({
				autoSaveContent: true,
				content: docHelper.serialize(document),
				canvasData: docData.canvasData,
				fontsData: docData.fontsData,
				stylesheetContents: docData.stylesheetContents,
				imageData: docData.imageData,
				postersData: docData.postersData,
				usedFonts: docData.usedFonts,
				shadowRootContents: docData.shadowRootContents,
				framesData,
				url: location.href
			});
		}
	}

})();