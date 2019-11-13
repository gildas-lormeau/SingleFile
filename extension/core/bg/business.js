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
		"extension/lib/single-file/index.js",
		"extension/core/index.js",
		"extension/ui/index.js",
		"extension/core/content/content-main.js",
		"extension/core/content/content-download.js",
		"extension/ui/content/content-ui-main.js"
	];

	const pendingSaves = new Map();
	const currentSaves = new Map();
	let maxParallelWorkers;

	return {
		isSavingTab: tab => currentSaves.has(tab.id),
		saveTabs,
		saveLink,
		cancelTab,
		getTabsInfo: () => ({ pending: Array.from(pendingSaves).map(mapSaveInfo), processing: Array.from(currentSaves).map(mapSaveInfo) }),
		getTabInfo: tabId => currentSaves.get(tabId) || pendingSaves.get(tabId),
		setCancelCallback: (tabId, cancelCallback) => {
			const tabInfo = currentSaves.get(tabId);
			if (tabInfo) {
				tabInfo.cancel = cancelCallback;
			}
		}
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
						await requestSaveTab(tab, "content.autosave", tabOptions);
					}
				} else {
					ui.onStart(tabId, INJECT_SCRIPTS_STEP);
					const tabOptions = await config.getOptions(tab.url);
					Object.keys(options).forEach(key => tabOptions[key] = options[key]);
					tabOptions.extensionScriptFiles = extensionScriptFiles;
					const scriptsInjected = await singlefile.extension.injectScript(tabId, tabOptions);
					let promiseSaveTab;
					if (scriptsInjected) {
						ui.onStart(tabId, EXECUTE_SCRIPTS_STEP);
						promiseSaveTab = requestSaveTab(tab, "content.save", tabOptions);
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

	async function saveLink(url, options = {}) {
		const tabs = singlefile.extension.core.bg.tabs;
		const tab = await tabs.create({ url, active: false });
		options.autoClose = true;
		await saveTabs([tab], options);
	}

	async function cancelTab(tabId) {
		try {
			if (currentSaves.has(tabId)) {
				const saveInfo = currentSaves.get(tabId);
				saveInfo.cancelled = true;
				singlefile.extension.core.bg.tabs.sendMessage(tabId, { method: "content.cancelSave" });
				if (saveInfo.cancel) {
					saveInfo.cancel();
				}
			}
			if (pendingSaves.has(tabId)) {
				const saveInfo = pendingSaves.get(tabId);
				pendingSaves.delete(tabId);
				singlefile.extension.ui.bg.main.onCancelled(saveInfo.tab);
			}
		} catch (error) {
			// ignored
		}
	}

	function requestSaveTab(tab, method, options) {
		return new Promise((resolve, reject) => requestSaveTab(tab, method, options, resolve, reject));

		async function requestSaveTab(tab, method, options, resolve, reject) {
			if (currentSaves.size < maxParallelWorkers) {
				currentSaves.set(tab.id, { tab, options, resolve, reject });
				try {
					await singlefile.extension.core.bg.tabs.sendMessage(tab.id, { method, options });
					resolve();
				} catch (error) {
					reject(error);
				} finally {
					currentSaves.delete(tab.id);
					next();
				}
			} else {
				pendingSaves.set(tab.id, { tab, options, resolve, reject });
			}
		}

		function next() {
			if (pendingSaves.size) {
				const [tabId, { tab, resolve, reject, options }] = Array.from(pendingSaves)[0];
				pendingSaves.delete(tabId);
				requestSaveTab(tab, method, options, resolve, reject);
			}
		}
	}

	function mapSaveInfo([tabId, saveInfo]) {
		return [tabId, { index: saveInfo.tab.index, url: saveInfo.tab.url, cancelled: saveInfo.cancelled }];
	}

})();
