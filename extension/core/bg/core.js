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

/* global browser, SingleFile, singlefile, Blob */

singlefile.core = (() => {

	const FORBIDDEN_URLS = ["https://chrome.google.com", "https://addons.mozilla.org"];

	const contentScriptFiles = [
		"/lib/browser-polyfill/custom-browser-polyfill.js",
		"/lib/single-file/doc-helper.js",
		"/lib/single-file/base64.js",
		"/lib/single-file/parse-srcset.js",
		"/lib/fetch/content/fetch.js",
		"/lib/single-file/single-file-core.js",
		"/lib/single-file/single-file-browser.js",
		"/extension/index.js",
		"/extension/ui/content/content-ui.js",
		"/extension/core/content/content.js"
	];
	const frameScriptFiles = [
		"/lib/browser-polyfill/custom-browser-polyfill.js",
		"/extension/index.js",
		"/lib/single-file/doc-helper.js",
		"/lib/single-file/timeout.js",
		"/lib/single-file/frame-tree.js",
		"/extension/core/content/content-frame.js"
	];

	const optionalContentScriptFiles = {
		compressHTML: [
			"/lib/single-file/htmlmini.js",
			"/lib/single-file/serializer.js"
		],
		compressCSS: [
			"/lib/single-file/uglifycss.js"
		],
		removeAlternativeFonts: [
			"/lib/single-file/fonts-minifier.js"
		],
		removeUnusedStyles: [
			"/lib/single-file/css-what.js",
			"/lib/single-file/parse-css.js",
			"/lib/single-file/rules-matcher.js",
			"/lib/single-file/css-minifier.js"
		],
		lazyLoadImages: [
			"/lib/single-file/lazy-loader.js",
		]
	};

	browser.runtime.onMessage.addListener((request, sender) => {
		if (request.getConfig) {
			return singlefile.config.get();
		}
		if (request.download) {
			try {
				if (request.content) {
					request.url = URL.createObjectURL(new Blob([request.content], { type: "text/html" }));
				}
				return downloadPage(request, { confirmFilename: request.confirmFilename, incognito: sender.tab.incognito })
					.catch(error => {
						if (error.message && error.message.includes("'incognito'")) {
							return downloadPage(request, { confirmFilename: request.confirmFilename });
						} else {
							return { notSupported: true };
						}
					});
			} catch (error) {
				return Promise.resolve({ notSupported: true });
			}
		}
		if (request.processContent) {
			processBackgroundTab(sender.tab, request);
		}
	});
	browser.tabs.onRemoved.addListener(async tabId => {
		const tabsData = await singlefile.storage.get();
		delete tabsData[tabId];
		await singlefile.storage.set(tabsData);
	});

	return { saveTab, autoSaveTab, isAllowedURL };

	async function saveTab(tab, processOptions) {
		const options = await singlefile.config.get();
		Object.keys(processOptions).forEach(key => options[key] = processOptions[key]);
		return new Promise(async (resolve, reject) => {
			const processPromise = saveStart(tab, options);
			try {
				await processPromise;
			} catch (error) {
				reject(error);
			}
			resolve();
		});
	}

	async function autoSaveTab(tab) {
		const options = await singlefile.config.get();
		return new Promise(async (resolve, reject) => {
			const processPromise = autoSaveStart(tab, options);
			try {
				await processPromise;
			} catch (error) {
				reject(error);
			}
			resolve();
		});
	}

	function isAllowedURL(url) {
		return url && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("file://")) && !FORBIDDEN_URLS.find(storeUrl => url.startsWith(storeUrl));
	}

	async function processBackgroundTab(tab, message) {
		const options = await singlefile.config.get();
		options.content = message.content;
		options.url = message.url;
		options.framesData = message.framesData;
		options.canvasData = message.canvasData;
		options.stylesheetContents = message.stylesheetContents;
		options.insertSingleFileComment = true;
		options.insertFaviconLink = true;
		options.backgroundTab = true;
		options.autoSave = true;
		options.incognito = tab.incognito;
		options.onprogress = async event => {
			if (event.type == event.RESOURCES_INITIALIZED || event.type == event.RESOURCE_LOADED) {
				singlefile.ui.button.onProgress(tab.id, event.details.index, event.details.max, { autoSave: true });
			} else if (event.type == event.PAGE_ENDED) {
				singlefile.ui.button.onEnd(tab.id, { autoSave: true });
			}
		};
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
		const downloadInfo = {
			url: page.url,
			saveAs: options.confirmFilename,
			filename: page.filename.replace(/[/\\?%*:|"<>\x7F]+/g, "_")
		};
		if (options.incognito) {
			downloadInfo.incognito = true;
		}
		const downloadId = await browser.downloads.download(downloadInfo);
		return new Promise((resolve, reject) => {
			browser.downloads.onChanged.addListener(onChanged);

			function onChanged(event) {
				if (event.id == downloadId && event.state) {
					if (event.state.current == "complete") {
						URL.revokeObjectURL(page.url);
						resolve({});
						browser.downloads.onChanged.removeListener(onChanged);
					}
					if (event.state.current == "interrupted") {
						URL.revokeObjectURL(page.url);
						reject(new Error(event.state.current));
						browser.downloads.onChanged.removeListener(onChanged);
					}
				}
			}
		});
	}

	async function saveStart(tab, options) {
		if (!options.removeFrames) {
			await executeScripts(tab.id, frameScriptFiles, true);
		}
		await executeScripts(tab.id, getContentScriptFiles(options), false);
		if (options.frameId) {
			await browser.tabs.sendMessage(tab.id, { saveFrame: true, options }, { frameId: options.frameId });
		} else {
			await browser.tabs.sendMessage(tab.id, { savePage: true, options });
		}
	}

	async function autoSaveStart(tab, options) {
		await executeScripts(tab.id, getContentScriptFiles(options), false);
		await browser.tabs.sendMessage(tab.id, { autoSavePage: true, options });
	}

	async function executeScripts(tabId, scriptFiles, allFrames) {
		return Promise.all(scriptFiles.map(file => browser.tabs.executeScript(tabId, { file, allFrames })));
	}

	function getContentScriptFiles(options) {
		let files = contentScriptFiles;
		Object.keys(optionalContentScriptFiles).forEach(option => {
			if (options[option]) {
				files = optionalContentScriptFiles[option].concat(files);
			}
		});
		return files;
	}

})();
