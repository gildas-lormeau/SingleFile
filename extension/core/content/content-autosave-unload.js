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

/* global singlefile, browser, window, addEventListener, removeEventListener, document, location, docHelper */

this.singlefile.autoSaveUnload = this.singlefile.autoSaveUnload || (async () => {

	let listenerAdded, saveConfig;
	refreshAutoSaveUnload();
	browser.runtime.onMessage.addListener(message => {
		if (message.autoSaveUnloadEnabled) {
			refreshAutoSaveUnload();
		}
	});
	return true;

	async function refreshAutoSaveUnload() {
		const [autoSaveEnabled, config] = await Promise.all([browser.runtime.sendMessage({ isAutoSaveEnabled: true }), browser.runtime.sendMessage({ getConfig: true })]);
		saveConfig = config;
		enableAutoSaveUnload(autoSaveEnabled && (config.autoSaveUnload || config.autoSaveLoadOrUnload));
	}

	function enableAutoSaveUnload(enabled) {
		if (enabled) {
			if (!listenerAdded) {
				addEventListener("unload", onUnload);
				listenerAdded = true;
			}
		} else {
			removeEventListener("unload", onUnload);
			listenerAdded = false;
		}
	}

	function onUnload() {
		if (!singlefile.pageAutoSaved) {
			const docData = docHelper.preProcessDoc(document, window, saveConfig);
			browser.runtime.sendMessage({ processContent: true, content: docHelper.serialize(document), canvasData: docData.canvasData, emptyStyleRulesText: docData.emptyStyleRulesText, url: location.href });
		}
	}

})();