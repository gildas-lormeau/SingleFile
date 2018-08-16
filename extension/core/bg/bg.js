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

/* global browser, SingleFile, singlefile, FrameTree, Blob */

singlefile.core = (() => {

	const TIMEOUT_PROCESS_START_MESSAGE = 10000;

	const contentScriptFiles = [
		"/extension/ui/content/ui.js",
		"/lib/single-file/base64.js",
		"/lib/single-file/uglifycss.js",
		"/lib/single-file/rules-minifier.js",
		"/lib/single-file/htmlmini.js",
		"/lib/single-file/parse-srcset.js",
		"/lib/single-file/lazy-loader.js",
		"/lib/single-file/serializer.js",
		"/lib/single-file/single-file-core.js",
		"/lib/single-file/single-file-browser.js",
		"/lib/fetch/content/fetch.js",
		"/extension/core/content/content.js"
	];

	browser.runtime.onMessage.addListener(request => {
		if (request.getConfig) {
			return singlefile.config.get();
		}
		if (request.download) {
			try {
				if (request.content) {
					request.url = URL.createObjectURL(new Blob([request.content], { type: "text/html" }));
				}
				return downloadPage(request, { confirmFilename: request.confirmFilename })
					.catch(() => ({ notSupported: true }));
			} catch (error) {
				return Promise.resolve({ notSupported: true });
			}
		}
		if (request.processContent) {
			processBackgroundTab(request.content, request.url);
		}
	});

	return {
		async processTab(tab, processOptions = {}) {
			const options = await singlefile.config.get();
			Object.keys(processOptions).forEach(key => options[key] = processOptions[key]);
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

	async function processBackgroundTab(content, url) {
		const options = await singlefile.config.get();
		options.content = content;
		options.url = url;
		options.insertSingleFileComment = true;
		options.insertFaviconLink = true;
		options.removeFrames = true;
		options.backgroundTab = true;
		const processor = new (SingleFile.getClass())(options);
		await processor.initialize();
		await processor.preparePageData();
		const page = processor.getPageData();
		const date = new Date();
		page.filename = page.title + (options.appendSaveDate ? " (" + date.toISOString().split("T")[0] + " " + date.toLocaleTimeString() + ")" : "") + ".html";
		page.url = URL.createObjectURL(new Blob([page.content], { type: "text/html" }));
		return downloadPage(page, options);
	}

	async function downloadPage(page, options) {
		return browser.downloads.download({ url: page.url, saveAs: options.confirmFilename, filename: page.filename.replace(/[/\\?%*:|"<>]+/g, "_") })
			.then(downloadId => new Promise(resolve => {
				URL.revokeObjectURL(page.url);
				browser.downloads.onChanged.addListener(onChanged);

				function onChanged(event) {
					if (event.id == downloadId && event.state && event.state.current == "complete") {
						resolve({});
						browser.downloads.onChanged.removeListener(onChanged);
					}
				}
			}));
	}

	async function processStart(tab, options) {
		if (!options.removeFrames) {
			await FrameTree.initialize(tab.id, options);
		}
		await executeScripts(tab.id, contentScriptFiles, { allFrames: false });
		if (options.frameId) {
			await browser.tabs.sendMessage(tab.id, { processStartFrame: true, options }, { frameId: options.frameId });
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
