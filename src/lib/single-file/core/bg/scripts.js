/*
 * Copyright 2010-2020 Gildas Lormeau
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

/* global browser, fetch, TextDecoder */

let contentScript, frameScript;

const contentScriptFiles = [
	"lib/web-stream.js",
	"lib/chrome-browser-polyfill.js",
	"lib/single-file.js"
];

const frameScriptFiles = [
	"lib/chrome-browser-polyfill.js",
	"lib/single-file-frames.js"
];

const basePath = "../../../";

export {
	inject
};

async function inject(tabId, options) {
	await initScripts(options);
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

async function initScripts(options) {
	const extensionScriptFiles = options.extensionScriptFiles || [];
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
			const scriptResource = await fetch(browser.runtime.getURL(basePath + scriptFile));
			return new TextDecoder().decode(await scriptResource.arrayBuffer());
		}
	});
	let content = "";
	for (const scriptPromise of scriptsPromises) {
		content += await scriptPromise;
	}
	return content;
}