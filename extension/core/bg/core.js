/*
 * Copyright 2010-2019 Gildas Lormeau
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

/* global browser, singlefile, fetch, TextDecoder */

singlefile.core = (() => {

	let contentScript, frameScript, optionalContentScript;

	const contentScriptFiles = [
		"/lib/hooks/hooks.js",
		"/lib/browser-polyfill/chrome-browser-polyfill.js",
		"/lib/single-file/vendor/css-tree.js",
		"/lib/single-file/vendor/html-srcset-parser.js",
		"/lib/single-file/util/timeout.js",
		"/lib/single-file/util/doc-helper.js",
		"/lib/single-file/util/doc-util.js",
		"/lib/fetch/content/fetch.js",
		"/lib/single-file/single-file-core.js",
		"/lib/single-file/single-file-browser.js",
		"/extension/index.js",
		"/extension/ui/content/content-ui.js",
		"/extension/core/content/content.js"
	];

	const frameScriptFiles = [
		"/lib/hooks/hooks-frame.js",
		"/lib/browser-polyfill/chrome-browser-polyfill.js",
		"/extension/index.js",
		"/lib/single-file/util/doc-helper.js",
		"/lib/single-file/util/timeout.js",
		"/lib/fetch/content/fetch.js",
		"/lib/frame-tree/frame-tree.js",
		"/extension/core/content/content-frame.js"
	];

	const optionalContentScriptFiles = {
		compressHTML: [
			"/lib/single-file/modules/html-minifier.js",
			"/lib/single-file/modules/html-serializer.js"
		],
		compressCSS: [
			"/lib/single-file/vendor/css-minifier.js"
		],
		loadDeferredImages: [
			"/lib/lazy/content/content-lazy-loader.js",
			function () { this.lazyLoader.getScriptPath = path => browser.runtime.getURL(path); }
		],
		removeAlternativeImages: [
			"/lib/single-file/modules/html-images-alt-minifier.js"
		],
		removeUnusedFonts: [
			"/lib/single-file/vendor/css-font-property-parser.js",
			"/lib/single-file/modules/css-fonts-minifier.js"
		],
		removeAlternativeFonts: [
			"/lib/single-file/modules/css-fonts-alt-minifier.js"
		],
		removeUnusedStyles: [
			"/lib/single-file/modules/css-matched-rules.js",
			"/lib/single-file/modules/css-rules-minifier.js"
		],
		removeAlternativeMedias: [
			"/lib/single-file/vendor/css-media-query-parser.js",
			"/lib/single-file/modules/css-medias-alt-minifier.js"
		]
	};
	initScripts();

	return { saveTab };

	async function saveTab(tab, options = {}) {
		if (singlefile.util.isAllowedURL(tab.url)) {
			await initScripts();
			const tabId = tab.id;
			options.tabId = tabId;
			try {
				singlefile.ui.button.onInitialize(tabId, options, 1);
				if (options.autoSave) {
					const options = await singlefile.config.getOptions(tab.url, true);
					if (singlefile.autosave.isEnabled(tab)) {
						await singlefile.tabs.sendMessage(tab.id, { autoSavePage: true, options });
					}
				} else {
					const mergedOptions = await singlefile.config.getOptions(tab.url);
					Object.keys(options).forEach(key => mergedOptions[key] = options[key]);
					if (!mergedOptions.removeFrames) {
						await browser.tabs.executeScript(tab.id, { code: frameScript, allFrames: true, runAt: "document_start" });
					}
					const code = await getContentScript(mergedOptions);
					await browser.tabs.executeScript(tab.id, { code, allFrames: false, runAt: "document_idle" });
					if (mergedOptions.frameId) {
						await singlefile.tabs.sendMessage(tab.id, { saveFrame: true, options: mergedOptions }, { frameId: mergedOptions.frameId });
					} else {
						await singlefile.tabs.sendMessage(tab.id, { savePage: true, options: mergedOptions });
					}
				}
				singlefile.ui.button.onInitialize(tabId, options, 2);
			} catch (error) {
				console.log(error); // eslint-disable-line no-console
				singlefile.ui.button.onError(tabId, options);
			}
		}
	}

	async function initScripts() {
		if (!contentScript) {
			contentScript = await getScript(contentScriptFiles);
		}
		if (!frameScript) {
			frameScript = await getScript(frameScriptFiles);
		}
		if (!optionalContentScript) {
			optionalContentScript = {};
			await Promise.all(Object.keys(optionalContentScriptFiles).map(async option => {
				optionalContentScript[option] = await getScript(optionalContentScriptFiles[option]);
			}));
		}
	}

	async function getContentScript(options) {
		await initScripts();
		let script = "";
		Object.keys(optionalContentScriptFiles).forEach(option => {
			if (options[option]) {
				script += optionalContentScript[option] + "\n";
			}
		});
		return script + "\n" + contentScript;
	}

	async function getScript(scriptFiles) {
		const scriptsPromises = scriptFiles.map(async scriptFile => {
			if (typeof scriptFile == "function") {
				return "(" + scriptFile.toString() + ")();";
			} else {
				const scriptResource = await fetch(browser.runtime.getURL(scriptFile));
				return new TextDecoder().decode(await scriptResource.arrayBuffer());
			}
		});
		let content = "";
		for (const scriptPromise of scriptsPromises) {
			content += await scriptPromise;
		}
		return content;
	}

})();
