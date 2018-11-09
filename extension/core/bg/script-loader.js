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
		"/lib/single-file/util/timeout.js",
		"/lib/single-file/util/base64.js",
		"/lib/single-file/css-tree.js",
		"/lib/single-file/html-srcset-parser.js",
		"/lib/fetch/content/fetch.js",
		"/lib/single-file/single-file-core.js",
		"/lib/single-file/single-file-browser.js",
		"/extension/index.js",
		"/extension/ui/content/content-ui.js",
		"/extension/core/content/content.js"
	];

	const frameScriptFiles = [
		"/lib/browser-polyfill/custom-browser-polyfill.js",
		"/lib/single-file/font-face-proxy.js",
		"/extension/index.js",
		"/lib/single-file/doc-helper.js",
		"/lib/single-file/util/timeout.js",
		"/lib/fetch/content/fetch.js",
		"/lib/single-file/frame-tree.js",
		"/extension/core/content/content-frame.js"
	];

	const optionalContentScriptFiles = {
		compressHTML: [
			"/lib/single-file/html-minifier.js",
			"/lib/single-file/html-serializer.js"
		],
		compressCSS: [
			"/lib/single-file/css-minifier.js"
		],
		removeAlternativeFonts: [
			"/lib/single-file/css-fonts-minifier.js"
		],
		removeAlternativeMedias: [
			"/lib/single-file/css-media-query-parser.js",
			"/lib/single-file/css-medias-minifier.js"
		],
		removeAlternativeImages: [
			"/lib/single-file/html-images-minifier.js"
		],
		removeUnusedStyles: [
			"/lib/single-file/css-medias-minifier.js",
			"/lib/single-file/css-matched-rules.js",
			"/lib/single-file/css-rules-minifier.js",
			"/lib/single-file/css-fonts-minifier.js"
		],
		lazyLoadImages: [
			"/lib/lazy/content-lazy-loader.js"
		]
	};

	return { executeScripts };

	async function executeScripts(tab, options) {
		if (!options.removeFrames) {
			await executeContentScripts(tab.id, frameScriptFiles, true, "document_start");
		}
		await executeContentScripts(tab.id, getContentScriptFiles(options), false, "document_idle");
		if (options.frameId) {
			await browser.tabs.sendMessage(tab.id, { saveFrame: true, options }, { frameId: options.frameId });
		} else {
			await browser.tabs.sendMessage(tab.id, { savePage: true, options });
		}
	}

	async function executeContentScripts(tabId, scriptFiles, allFrames, runAt) {
		for (const file of scriptFiles) {
			await browser.tabs.executeScript(tabId, { file, allFrames, runAt });
		}
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
