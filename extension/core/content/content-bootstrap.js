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

/* global singlefile, frameTree, browser, window, history, HTMLDocument, dispatchEvent, CustomEvent, addEventListener, removeEventListener, document, location, docHelper, setTimeout */

this.singlefile.autosave = this.singlefile.autosave || (async () => {

	let listenerAdded, options, autoSaveTimeout, autoSavingPage;
	refresh();
	browser.runtime.onMessage.addListener(message => {
		if (message.autoSavePage) {
			autoSavingPage = false;
			singlefile.pageAutoSaved = false;
			autoSavePage();
		}
		if (message.autoSaveUnloadEnabled) {
			refresh();
		}
	});
	if (location.href.startsWith("http") && document instanceof HTMLDocument) {
		const scriptElement = document.createElement("script");
		scriptElement.textContent = `(${hookPushState.toString()})()`;
		document.documentElement.appendChild(scriptElement);
		scriptElement.remove();
	}
	browser.runtime.sendMessage({ processReset: true });
	return {};

	async function autoSavePage() {
		if ((!autoSavingPage || autoSaveTimeout) && !singlefile.pageAutoSaved) {
			autoSavingPage = true;
			const [autoSaveEnabled, options] = await Promise.all([browser.runtime.sendMessage({ isAutoSaveEnabled: true }), browser.runtime.sendMessage({ getConfig: true })]);
			if (autoSaveEnabled) {
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
						saveContent: true,
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
			} else {
				autoSavingPage = false;
			}
		}
	}

	async function refresh() {
		const [autoSaveEnabled, config] = await Promise.all([browser.runtime.sendMessage({ isAutoSaveEnabled: true }), browser.runtime.sendMessage({ getConfig: true })]);
		options = config;
		enableAutoSaveUnload(autoSaveEnabled && (config.autoSaveUnload || config.autoSaveLoadOrUnload));
	}

	function enableAutoSaveUnload(enabled) {
		if (enabled) {
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
				saveContent: true,
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

	function hookPushState() {
		console.warn("SingleFile is hooking the history.pushState API to detect navigation."); // eslint-disable-line no-console
		const pushState = history.pushState;
		history.pushState = function (state, title, url) {
			dispatchEvent(new CustomEvent("single-file-push-state", { detail: { state, title, url } }));
			pushState.call(history, state, title, url);
		};
	}

})();