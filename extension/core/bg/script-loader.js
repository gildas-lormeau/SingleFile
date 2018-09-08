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

/* global browser, singlefile */

singlefile.scriptLoader = (() => {

	const contentScriptFiles = [
		"/lib/browser-polyfill/custom-browser-polyfill.js",
		"/lib/single-file/doc-helper.js",
		"/lib/single-file/base64.js",
		"/lib/single-file/css-srcset-parser.js",
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
			"/lib/single-file/html-minifier.js",
			"/lib/single-file/html-serializer.js"
		],
		compressCSS: [
			"/lib/single-file/css-uglifycss.js"
		],
		removeAlternativeFonts: [
			"/lib/single-file/css-fonts-minifier.js"
		],
		removeUnusedStyles: [
			"/lib/single-file/css-what.js",
			"/lib/single-file/css-declarations-parser.js",
			"/lib/single-file/css-rules-matcher.js",
			"/lib/single-file/css-media-query-parser.js",
			"/lib/single-file/css-medias-minifier.js",
			"/lib/single-file/css-minifier.js"
		],
		lazyLoadImages: [
			"/lib/single-file/lazy-loader.js",
		]
	};

	return { executeScripts };

	async function executeScripts(tab, options) {
		if (!options.removeFrames) {
			await executeContentScripts(tab.id, frameScriptFiles, true);
		}
		await executeContentScripts(tab.id, getContentScriptFiles(options), false);
		if (options.frameId) {
			await browser.tabs.sendMessage(tab.id, { saveFrame: true, options }, { frameId: options.frameId });
		} else {
			await browser.tabs.sendMessage(tab.id, { savePage: true, options });
		}
	}

	async function executeContentScripts(tabId, scriptFiles, allFrames) {
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
