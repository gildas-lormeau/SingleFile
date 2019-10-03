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

/* global singlefile */

singlefile.extension.core.bg.business = (() => {

	const ERROR_CONNECTION_ERROR_CHROMIUM = "Could not establish connection. Receiving end does not exist.";
	const ERROR_CONNECTION_LOST_CHROMIUM = "The message port closed before a response was received.";
	const ERROR_CONNECTION_LOST_GECKO = "Message manager disconnected";
	const INJECT_SCRIPTS_STEP = 1;
	const EXECUTE_SCRIPTS_STEP = 2;

	const extensionScriptFiles = [
		"common/index.js",
		"common/ui/content/content-infobar.js",
		"extension/index.js",
		"extension/core/index.js",
		"extension/ui/index.js",
		"extension/core/content/content-main.js",
		"extension/ui/content/content-ui-main.js"
	];

	const pendingSaves = new Map();
	const currentSaves = new Map();
	let maxParallelWorkers;

	return {
		isSavingTab: tab => currentSaves.has(tab.id),
		saveTabs,
		saveLink,
		cancelTab
	};

	async function saveTabs(tabs, options = {}) {
		if (tabs.length) {
			const config = singlefile.extension.core.bg.config;
			const autosave = singlefile.extension.core.bg.autosave;
			const ui = singlefile.extension.ui.bg.main;
			maxParallelWorkers = (await config.get()).maxParallelWorkers;
			const tab = tabs.shift();
			const tabId = tab.id;
			options.tabId = tabId;
			options.tabIndex = tab.index;
			try {
				if (options.autoSave) {
					const tabOptions = await config.getOptions(tab.url, true);
					if (autosave.isEnabled(tab)) {
						await requestSaveTab(tabId, "content.autosave", tabOptions);
					}
				} else {
					ui.onStart(tabId, INJECT_SCRIPTS_STEP);
					const tabOptions = await config.getOptions(tab.url);
					Object.keys(options).forEach(key => tabOptions[key] = options[key]);
					tabOptions.extensionScriptFiles = extensionScriptFiles;
					const scriptsInjected = await singlefile.extension.lib.core.bg.scripts.inject(tabId, tabOptions);
					let promiseSaveTab;
					if (scriptsInjected) {
						ui.onStart(tabId, EXECUTE_SCRIPTS_STEP);
						promiseSaveTab = requestSaveTab(tabId, "content.save", tabOptions);
					} else {
						ui.onForbiddenDomain(tab);
						promiseSaveTab = Promise.resolve();
					}
					saveTabs(tabs, options);
					await promiseSaveTab;
				}
			} catch (error) {
				if (error && (!error.message || (error.message != ERROR_CONNECTION_LOST_CHROMIUM && error.message != ERROR_CONNECTION_ERROR_CHROMIUM && error.message != ERROR_CONNECTION_LOST_GECKO))) {
					console.log(error); // eslint-disable-line no-console
					ui.onError(tabId);
				}
			}
		}
	}

	async function saveLink(url) {
		const tabs = singlefile.extension.core.bg.tabs;
		const tab = await tabs.create({ url, active: false });
		await saveTabs([tab], { autoClose: true });
	}

	async function cancelTab(tab) {
		try {
			singlefile.extension.core.bg.tabs.sendMessage(tab.id, { method: "content.cancelSave" });
		} catch (error) {
			// ignored;
		}
	}

	function requestSaveTab(tabId, method, options) {
		return new Promise((resolve, reject) => requestSaveTab(tabId, method, options, resolve, reject));

		async function requestSaveTab(tabId, method, options, resolve, reject) {
			if (currentSaves.size < maxParallelWorkers) {
				currentSaves.set(tabId, { options, resolve, reject });
				try {
					await singlefile.extension.core.bg.tabs.sendMessage(tabId, { method, options });
					resolve();
				} catch (error) {
					reject(error);
				} finally {
					currentSaves.delete(tabId);
					next();
				}
			} else {
				pendingSaves.set(tabId, { options, resolve, reject });
			}
		}

		function next() {
			if (pendingSaves.size) {
				const [tabId, { resolve, reject, options }] = Array.from(pendingSaves)[0];
				pendingSaves.delete(tabId);
				requestSaveTab(tabId, method, options, resolve, reject);
			}
		}
	}

})();
