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

/* global browser, singlefile, fetch, TextDecoder */

singlefile.extension.lib.core.bg.scripts = (() => {

	let contentScript, frameScript;

	const contentScriptFiles = [
		"/lib/index.js",
		"/lib/single-file/vendor/css-font-property-parser.js",
		"/lib/single-file/vendor/css-media-query-parser.js",
		"/lib/single-file/vendor/css-tree.js",
		"/lib/single-file/vendor/html-srcset-parser.js",
		"/lib/single-file/vendor/css-minifier.js",
		"/lib/single-file/modules/html-minifier.js",
		"/lib/single-file/modules/html-serializer.js",
		"/lib/single-file/modules/html-images-alt-minifier.js",
		"/lib/single-file/modules/css-fonts-minifier.js",
		"/lib/single-file/modules/css-fonts-alt-minifier.js",
		"/lib/single-file/modules/css-matched-rules.js",
		"/lib/single-file/modules/css-rules-minifier.js",
		"/lib/single-file/modules/css-medias-alt-minifier.js",
		"/lib/single-file/single-file-util.js",
		"/lib/single-file/single-file-helper.js",
		"/lib/single-file/single-file-core.js",
		"/lib/single-file/single-file.js",
		"/lib/lazy/content/content-lazy-loader.js",
		"/lib/hooks/content/content-hooks.js",
		"/extension/index.js",
		"/extension/lib/browser-polyfill/chrome-browser-polyfill.js",
		"/extension/lib/fetch/content/content-fetch.js",
	];

	const frameScriptFiles = [
		"/lib/index.js",
		"/lib/hooks/content/content-hooks-frames.js",
		"/lib/single-file/single-file-helper.js",
		"/lib/frame-tree/content/content-frame-tree.js",
		"/extension/index.js",
		"/extension/lib/browser-polyfill/chrome-browser-polyfill.js",
		"/extension/lib/fetch/content/content-fetch.js"
	];

	return {
		async inject(tabId, options, extensionScriptFiles) {
			await initScripts(extensionScriptFiles);
			let scriptsInjected;
			if (!options.removeFrames) {
				try {
					await browser.tabs.executeScript(tabId, { code: frameScript, allFrames: true, matchAboutBlank: true, runAt: "document_start" });
				} catch (error) {
					// ignored
				}
			}
			try {
				await browser.tabs.executeScript(tabId, { code: contentScript, allFrames: false, runAt: "document_idle" });
				scriptsInjected = true;
			} catch (error) {
				// ignored
			}
			if (scriptsInjected) {
				if (options.frameId) {
					await browser.tabs.executeScript(tabId, { code: "document.documentElement.dataset.requestedFrameId = true", frameId: options.frameId, matchAboutBlank: true, runAt: "document_start" });
				}
			}
			return scriptsInjected;
		}
	};

	async function initScripts(extensionScriptFiles = []) {
		if (!contentScript && !frameScript) {
			[contentScript, frameScript] = await Promise.all([
				getScript(contentScriptFiles.concat(extensionScriptFiles)),
				getScript(frameScriptFiles)
			]);
		}
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
