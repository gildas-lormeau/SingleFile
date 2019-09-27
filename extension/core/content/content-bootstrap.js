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

/* global browser, window, addEventListener, removeEventListener, document, location, setTimeout, CustomEvent, dispatchEvent */

this.singlefile.extension.core.content.bootstrap = this.singlefile.extension.core.content.bootstrap || (async () => {

	const singlefile = this.singlefile;

	let unloadListenerAdded, options, autoSaveEnabled, autoSaveTimeout, autoSavingPage, pageAutoSaved;
	singlefile.extension.core.content.updatedResources = {};
	browser.runtime.sendMessage({ method: "autosave.init" }).then(message => {
		options = message.options;
		autoSaveEnabled = message.autoSaveEnabled;
		refresh();
	});
	browser.runtime.onMessage.addListener(message => { onMessage(message); });
	browser.runtime.sendMessage({ method: "ui.processInit" });
	addEventListener("single-file-push-state", () => browser.runtime.sendMessage({ method: "ui.processInit" }));
	addEventListener("single-file-user-script-init", () => singlefile.waitForUserScript = async () => {
		const event = new CustomEvent("single-file-on-capture-request", { cancelable: true });
		const promiseResponse = new Promise(resolve => addEventListener("single-file-on-capture-response", resolve));
		dispatchEvent(event);
		if (event.defaultPrevented) {
			await promiseResponse;
		}
	});
	return {};

	async function onMessage(message) {
		if (autoSaveEnabled && message.method == "content.autosave") {
			options = message.options;
			await autoSavePage();
			if (options.autoSaveRepeat) {
				setTimeout(() => {
					if (autoSaveEnabled && !autoSavingPage) {
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
		if (message.method == "devtools.resourceCommitted") {
			singlefile.extension.core.content.updatedResources[message.url] = { content: message.content, type: message.type, encoding: message.encoding };
		}
	}

	async function autoSavePage() {
		const helper = singlefile.lib.helper;
		if ((!autoSavingPage || autoSaveTimeout) && !pageAutoSaved) {
			autoSavingPage = true;
			if (options.autoSaveDelay && !autoSaveTimeout) {
				await new Promise(resolve => autoSaveTimeout = setTimeout(resolve, options.autoSaveDelay * 1000));
				await autoSavePage();
			} else {
				let frames = [];
				autoSaveTimeout = null;
				if (!options.removeFrames && singlefile.lib.frameTree.content.frames && window.frames && window.frames.length) {
					frames = await singlefile.lib.frameTree.content.frames.getAsync(options);
				}
				if (options.userScriptEnabled && singlefile.waitForUserScript) {
					await singlefile.waitForUserScript();
				}
				const docData = helper.preProcessDoc(document, window, options);
				savePage(docData, frames);
				helper.postProcessDoc(document, docData.markedElements);
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
			let frames = [];
			if (!options.removeFrames && singlefile.lib.frameTree.content.frames && window.frames && window.frames.length) {
				frames = singlefile.lib.frameTree.content.frames.getSync(options);
			}
			if (options.userScriptEnabled && singlefile.waitForUserScript) {
				singlefile.waitForUserScript();
			}
			const docData = helper.preProcessDoc(document, window, options);
			savePage(docData, frames);
		}
	}

	function savePage(docData, frames) {
		const helper = singlefile.lib.helper;
		const updatedResources = singlefile.extension.core.content.updatedResources;
		Object.keys(updatedResources).forEach(url => updatedResources[url].retrieved = false);
		browser.runtime.sendMessage({
			method: "autosave.save",
			content: helper.serialize(document),
			canvases: docData.canvases,
			fonts: docData.fonts,
			stylesheets: docData.stylesheets,
			images: docData.images,
			posters: docData.posters,
			usedFonts: docData.usedFonts,
			shadowRoots: docData.shadowRoots,
			imports: docData.imports,
			referrer: docData.referrer,
			frames: frames,
			url: location.href,
			updatedResources
		});
	}

})();