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

/* global browser, singlefile, FrameTree */

singlefile.core = (() => {

	const TIMEOUT_PROCESS_START_MESSAGE = 10000;

	const contentScriptFiles = [
		"/lib/browser-polyfill/custom-browser-polyfill.js",
		"/extension/index.js",
		"/extension/ui/content/ui.js",
		"/lib/single-file/base64.js",
		"/lib/single-file/uglifycss.js",
		"/lib/single-file/rules-minifier.js",
		"/lib/single-file/htmlmini.js",
		"/lib/single-file/parse-srcset.js",
		"/lib/single-file/lazy-loader.js",
		"/lib/single-file/single-file-core.js",
		"/lib/single-file/single-file-browser.js",
		"/lib/fetch/content/fetch.js",
		"/extension/core/content/content.js"
	];

	browser.runtime.onMessage.addListener(request => {
		if (request.getConfig) {
			return singlefile.config.get();
		}
	});

	return {
		async processTab(tab, processOptions = {}) {
			const options = await singlefile.config.get();
			Object.keys(processOptions).forEach(key => options[key] = processOptions[key]);
			options.insertSingleFileComment = true;
			options.insertFaviconLink = true;
			return new Promise(async (resolve, reject) => {
				const processPromise = processStart(tab, options);
				const errorTimeout = setTimeout(reject, TIMEOUT_PROCESS_START_MESSAGE);
				try {
					await processPromise;
				} catch (error) {
					reject(error);
				}
				clearTimeout(errorTimeout);
				resolve();
			});
		}
	};

	async function processStart(tab, options) {
		if (!options.removeFrames) {
			await FrameTree.initialize(tab.id);
		}
		await executeScripts(tab.id, contentScriptFiles, { allFrames: false });
		if (options.frameId) {
			await browser.tabs.sendMessage(tab.id, { processStart: true, options }, { frameId: options.frameId });
		} else {
			await browser.tabs.sendMessage(tab.id, { processStart: true, options });
		}
	}

	async function executeScripts(tabId, scriptFiles, details) {
		for (let file of scriptFiles) {
			details.file = file;
			await browser.tabs.executeScript(tabId, details);
		}
	}

})();
