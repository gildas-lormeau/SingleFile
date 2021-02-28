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

/* global browser, globalThis, window, addEventListener, removeEventListener, document, location, setTimeout, prompt, Node */

const singlefile = globalThis.singlefileBootstrap;

const MAX_CONTENT_SIZE = 32 * (1024 * 1024);

let unloadListenerAdded, options, autoSaveEnabled, autoSaveTimeout, autoSavingPage, pageAutoSaved, previousLocationHref;
singlefile.pageInfo = {
	updatedResources: {},
	visitDate: new Date()
};
browser.runtime.sendMessage({ method: "autosave.init" }).then(message => {
	options = message.options;
	autoSaveEnabled = message.autoSaveEnabled;
	if (options && options.autoOpenEditor && detectSavedPage(document)) {
		if (document.readyState == "loading") {
			document.addEventListener("DOMContentLoaded", () => openEditor(document));
		} else {
			openEditor(document);
		}
	} else {
		refresh();
	}
});
browser.runtime.onMessage.addListener(message => {
	if ((autoSaveEnabled && message.method == "content.autosave") ||
		message.method == "content.maybeInit" ||
		message.method == "content.init" ||
		message.method == "content.openEditor" ||
		message.method == "devtools.resourceCommitted" ||
		message.method == "common.promptValueRequest") {
		return onMessage(message);
	}
});
document.addEventListener("DOMContentLoaded", init, false);

async function onMessage(message) {
	if (autoSaveEnabled && message.method == "content.autosave") {
		initAutoSavePage(message);
		return {};
	}
	if (message.method == "content.maybeInit") {
		init();
		return {};
	}
	if (message.method == "content.init") {
		options = message.options;
		autoSaveEnabled = message.autoSaveEnabled;
		refresh();
		return {};
	}
	if (message.method == "content.openEditor") {
		if (detectSavedPage(document)) {
			openEditor(document);
		} else {
			refresh();
		}
		return {};
	}
	if (message.method == "devtools.resourceCommitted") {
		singlefile.pageInfo.updatedResources[message.url] = { content: message.content, type: message.type, encoding: message.encoding };
		return {};
	}
	if (message.method == "common.promptValueRequest") {
		browser.runtime.sendMessage({ method: "tabs.promptValueResponse", value: prompt("SingleFile: " + message.promptMessage) });
		return {};
	}
}

function init() {
	if (previousLocationHref != location.href && !singlefile.pageInfo.processing) {
		pageAutoSaved = false;
		previousLocationHref = location.href;
		browser.runtime.sendMessage({ method: "tabs.init", savedPageDetected: detectSavedPage(document) });
		browser.runtime.sendMessage({ method: "ui.processInit" });
	}
}

async function initAutoSavePage(message) {
	options = message.options;
	if (document.readyState != "complete") {
		await new Promise(resolve => window.addEventListener("load", resolve));
	}
	await autoSavePage();
	if (options.autoSaveRepeat) {
		setTimeout(() => {
			if (autoSaveEnabled && !autoSavingPage) {
				pageAutoSaved = false;
				options.autoSaveDelay = 0;
				onMessage(message);
			}
		}, options.autoSaveRepeatDelay * 1000);
	}
}

async function autoSavePage() {
	const helper = singlefile.helper;
	if ((!autoSavingPage || autoSaveTimeout) && !pageAutoSaved) {
		autoSavingPage = true;
		if (options.autoSaveDelay && !autoSaveTimeout) {
			await new Promise(resolve => autoSaveTimeout = setTimeout(resolve, options.autoSaveDelay * 1000));
			await autoSavePage();
		} else {
			const waitForUserScript = window._singleFile_waitForUserScript;
			let frames = [];
			let framesSessionId;
			autoSaveTimeout = null;
			if (!options.removeFrames && window.frames && window.frames.length) {
				frames = await singlefile.processors.frameTree.getAsync(options);
			}
			framesSessionId = frames && frames.sessionId;
			if (options.userScriptEnabled && waitForUserScript) {
				await waitForUserScript(helper.ON_BEFORE_CAPTURE_EVENT_NAME);
			}
			const docData = helper.preProcessDoc(document, window, options);
			savePage(docData, frames);
			if (framesSessionId) {
				singlefile.processors.frameTree.cleanup(framesSessionId);
			}
			helper.postProcessDoc(document, docData.markedElements);
			if (options.userScriptEnabled && waitForUserScript) {
				await waitForUserScript(helper.ON_AFTER_CAPTURE_EVENT_NAME);
			}
			pageAutoSaved = true;
			autoSavingPage = false;
		}
	}
}

function refresh() {
	if (autoSaveEnabled && options && (options.autoSaveUnload || options.autoSaveLoadOrUnload)) {
		if (!unloadListenerAdded) {
			addEventListener("unload", onUnload);
			unloadListenerAdded = true;
		}
	} else {
		removeEventListener("unload", onUnload);
		unloadListenerAdded = false;
	}
}

function onUnload() {
	const helper = singlefile.helper;
	if (!pageAutoSaved || options.autoSaveUnload) {
		const waitForUserScript = window._singleFile_waitForUserScript;
		let frames = [];
		if (!options.removeFrames && window.frames && window.frames.length) {
			frames = singlefile.processors.frameTree.getSync(options);
		}
		if (options.userScriptEnabled && waitForUserScript) {
			waitForUserScript(helper.ON_BEFORE_CAPTURE_EVENT_NAME);
		}
		const docData = helper.preProcessDoc(document, window, options);
		savePage(docData, frames);
	}
}

function savePage(docData, frames) {
	const helper = singlefile.helper;
	const updatedResources = singlefile.pageInfo.updatedResources;
	const visitDate = singlefile.pageInfo.visitDate.getTime();
	Object.keys(updatedResources).forEach(url => updatedResources[url].retrieved = false);
	browser.runtime.sendMessage({
		method: "autosave.save",
		taskId: options.taskId,
		content: helper.serialize(document),
		canvases: docData.canvases,
		fonts: docData.fonts,
		stylesheets: docData.stylesheets,
		images: docData.images,
		posters: docData.posters,
		usedFonts: docData.usedFonts,
		shadowRoots: docData.shadowRoots,
		imports: docData.imports,
		referrer: docData.referrer,
		frames: frames,
		url: location.href,
		updatedResources,
		visitDate
	});
}

async function openEditor(document) {
	const infobarElement = document.querySelector("singlefile-infobar");
	if (infobarElement) {
		infobarElement.remove();
	}
	serializeShadowRoots(document);
	const content = singlefile.helper.serialize(document);
	for (let blockIndex = 0; blockIndex * MAX_CONTENT_SIZE < content.length; blockIndex++) {
		const message = {
			method: "editor.open",
			filename: decodeURIComponent(location.href.match(/^.*\/(.*)$/)[1])
		};
		message.truncated = content.length > MAX_CONTENT_SIZE;
		if (message.truncated) {
			message.finished = (blockIndex + 1) * MAX_CONTENT_SIZE > content.length;
			message.content = content.substring(blockIndex * MAX_CONTENT_SIZE, (blockIndex + 1) * MAX_CONTENT_SIZE);
		} else {
			message.content = content;
		}
		await browser.runtime.sendMessage(message);
	}
}

function detectSavedPage(document) {
	const helper = singlefile.helper;
	const firstDocumentChild = document.documentElement.firstChild;
	return firstDocumentChild.nodeType == Node.COMMENT_NODE &&
		(firstDocumentChild.textContent.includes(helper.COMMENT_HEADER) || firstDocumentChild.textContent.includes(helper.COMMENT_HEADER_LEGACY));
}

function serializeShadowRoots(node) {
	const SHADOW_MODE_ATTRIBUTE_NAME = "shadowmode";
	node.querySelectorAll("*").forEach(element => {
		const shadowRoot = singlefile.helper.getShadowRoot(element);
		if (shadowRoot) {
			serializeShadowRoots(shadowRoot);
			const templateElement = document.createElement("template");
			templateElement.setAttribute(SHADOW_MODE_ATTRIBUTE_NAME, "open");
			templateElement.appendChild(shadowRoot);
			element.appendChild(templateElement);
		}
	});
}