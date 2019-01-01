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

/* global browser, singlefile */

singlefile.runner = (() => {

	const contentScriptFiles = [
		"/lib/hooks/hooks.js",
		"/lib/browser-polyfill/chrome-browser-polyfill.js",
		"/lib/single-file/vendor/css-tree.js",
		"/lib/single-file/vendor/html-srcset-parser.js",
		"/lib/single-file/util/timeout.js",
		"/lib/single-file/util/doc-helper.js",
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
			"/lib/lazy/content/content-lazy-loader.js"
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

	return { saveTab };

	async function saveTab(tab, options) {
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
