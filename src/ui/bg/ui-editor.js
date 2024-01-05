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

/* global browser, document, matchMedia, addEventListener, navigator, prompt, URL, MouseEvent, Blob, setInterval, DOMParser */

import * as download from "../../core/common/download.js";
import { onError } from "./../common/common-content-ui.js";
import * as zip from "./../../../lib/single-file-zip.js";
import * as yabson from "./../../lib/yabson/yabson.js";

const FOREGROUND_SAVE = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent) && !/Vivaldi/.test(navigator.userAgent) && !/OPR/.test(navigator.userAgent);
const SHADOWROOT_ATTRIBUTE_NAME = "shadowrootmode";
const INFOBAR_TAGNAME = "single-file-infobar";

const editorElement = document.querySelector(".editor");
const toolbarElement = document.querySelector(".toolbar");
const highlightYellowButton = document.querySelector(".highlight-yellow-button");
const highlightPinkButton = document.querySelector(".highlight-pink-button");
const highlightBlueButton = document.querySelector(".highlight-blue-button");
const highlightGreenButton = document.querySelector(".highlight-green-button");
const highlightButtons = Array.from(document.querySelectorAll(".highlight-button"));
const toggleNotesButton = document.querySelector(".toggle-notes-button");
const toggleHighlightsButton = document.querySelector(".toggle-highlights-button");
const removeHighlightButton = document.querySelector(".remove-highlight-button");
const addYellowNoteButton = document.querySelector(".add-note-yellow-button");
const addPinkNoteButton = document.querySelector(".add-note-pink-button");
const addBlueNoteButton = document.querySelector(".add-note-blue-button");
const addGreenNoteButton = document.querySelector(".add-note-green-button");
const editPageButton = document.querySelector(".edit-page-button");
const formatPageButton = document.querySelector(".format-page-button");
const cutInnerPageButton = document.querySelector(".cut-inner-page-button");
const cutOuterPageButton = document.querySelector(".cut-outer-page-button");
const undoCutPageButton = document.querySelector(".undo-cut-page-button");
const undoAllCutPageButton = document.querySelector(".undo-all-cut-page-button");
const redoCutPageButton = document.querySelector(".redo-cut-page-button");
const savePageButton = document.querySelector(".save-page-button");
const printPageButton = document.querySelector(".print-page-button");
const lastButton = toolbarElement.querySelector(".buttons:last-of-type [type=button]:last-of-type");

let tabData, tabDataContents = [], downloadParser;

addYellowNoteButton.title = browser.i18n.getMessage("editorAddYellowNote");
addPinkNoteButton.title = browser.i18n.getMessage("editorAddPinkNote");
addBlueNoteButton.title = browser.i18n.getMessage("editorAddBlueNote");
addGreenNoteButton.title = browser.i18n.getMessage("editorAddGreenNote");
highlightYellowButton.title = browser.i18n.getMessage("editorHighlightYellow");
highlightPinkButton.title = browser.i18n.getMessage("editorHighlightPink");
highlightBlueButton.title = browser.i18n.getMessage("editorHighlightBlue");
highlightGreenButton.title = browser.i18n.getMessage("editorHighlightGreen");
toggleNotesButton.title = browser.i18n.getMessage("editorToggleNotes");
toggleHighlightsButton.title = browser.i18n.getMessage("editorToggleHighlights");
removeHighlightButton.title = browser.i18n.getMessage("editorRemoveHighlight");
editPageButton.title = browser.i18n.getMessage("editorEditPage");
formatPageButton.title = browser.i18n.getMessage("editorFormatPage");
cutInnerPageButton.title = browser.i18n.getMessage("editorCutInnerPage");
cutOuterPageButton.title = browser.i18n.getMessage("editorCutOuterPage");
undoCutPageButton.title = browser.i18n.getMessage("editorUndoCutPage");
undoAllCutPageButton.title = browser.i18n.getMessage("editorUndoAllCutPage");
redoCutPageButton.title = browser.i18n.getMessage("editorRedoCutPage");
savePageButton.title = browser.i18n.getMessage("editorSavePage");
printPageButton.title = browser.i18n.getMessage("editorPrintPage");

addYellowNoteButton.onmouseup = () => editorElement.contentWindow.postMessage(JSON.stringify({ method: "addNote", color: "note-yellow" }), "*");
addPinkNoteButton.onmouseup = () => editorElement.contentWindow.postMessage(JSON.stringify({ method: "addNote", color: "note-pink" }), "*");
addBlueNoteButton.onmouseup = () => editorElement.contentWindow.postMessage(JSON.stringify({ method: "addNote", color: "note-blue" }), "*");
addGreenNoteButton.onmouseup = () => editorElement.contentWindow.postMessage(JSON.stringify({ method: "addNote", color: "note-green" }), "*");
document.addEventListener("mouseup", event => {
	if (event.target.tagName.toLowerCase() != INFOBAR_TAGNAME) {
		editorElement.contentWindow.focus();
		toolbarOnTouchEnd(event);
	}
}, true);
document.onmousemove = toolbarOnTouchMove;
highlightButtons.forEach(highlightButton => {
	highlightButton.onmouseup = () => {
		if (toolbarElement.classList.contains("cut-inner-mode")) {
			disableCutInnerPage();
		}
		if (toolbarElement.classList.contains("cut-outer-mode")) {
			disableCutOuterPage();
		}
		if (toolbarElement.classList.contains("remove-highlight-mode")) {
			disableRemoveHighlights();
		}
		const disabled = highlightButton.classList.contains("highlight-disabled");
		resetHighlightButtons();
		if (disabled) {
			highlightButton.classList.remove("highlight-disabled");
			editorElement.contentWindow.postMessage(JSON.stringify({ method: "enableHighlight", color: "single-file-highlight-" + highlightButton.dataset.color }), "*");
		} else {
			highlightButton.classList.add("highlight-disabled");
		}
	};
});
toggleNotesButton.onmouseup = () => {
	if (toggleNotesButton.getAttribute("src") == "/src/ui/resources/button_note_visible.png") {
		toggleNotesButton.src = "/src/ui/resources/button_note_hidden.png";
		editorElement.contentWindow.postMessage(JSON.stringify({ method: "hideNotes" }), "*");
	} else {
		toggleNotesButton.src = "/src/ui/resources/button_note_visible.png";
		editorElement.contentWindow.postMessage(JSON.stringify({ method: "displayNotes" }), "*");
	}
};
toggleHighlightsButton.onmouseup = () => {
	if (toggleHighlightsButton.getAttribute("src") == "/src/ui/resources/button_highlighter_visible.png") {
		toggleHighlightsButton.src = "/src/ui/resources/button_highlighter_hidden.png";
		editorElement.contentWindow.postMessage(JSON.stringify({ method: "hideHighlights" }), "*");
	} else {
		displayHighlights();
	}
};
removeHighlightButton.onmouseup = () => {
	if (toolbarElement.classList.contains("cut-inner-mode")) {
		disableCutInnerPage();
	}
	if (toolbarElement.classList.contains("cut-outer-mode")) {
		disableCutOuterPage();
	}
	if (removeHighlightButton.classList.contains("remove-highlight-disabled")) {
		removeHighlightButton.classList.remove("remove-highlight-disabled");
		toolbarElement.classList.add("remove-highlight-mode");
		resetHighlightButtons();
		displayHighlights();
		editorElement.contentWindow.postMessage(JSON.stringify({ method: "enableRemoveHighlights" }), "*");
		editorElement.contentWindow.postMessage(JSON.stringify({ method: "displayHighlights" }), "*");
	} else {
		disableRemoveHighlights();
	}
};
editPageButton.onmouseup = () => {
	if (toolbarElement.classList.contains("cut-inner-mode")) {
		disableCutInnerPage();
	}
	if (toolbarElement.classList.contains("cut-outer-mode")) {
		disableCutOuterPage();
	}
	if (editPageButton.classList.contains("edit-disabled")) {
		enableEditPage();
	} else {
		disableEditPage();
	}
};
formatPageButton.onmouseup = () => {
	if (formatPageButton.classList.contains("format-disabled")) {
		formatPage();
	} else {
		cancelFormatPage();
	}
};
cutInnerPageButton.onmouseup = () => {
	if (toolbarElement.classList.contains("edit-mode")) {
		disableEditPage();
	}
	if (toolbarElement.classList.contains("cut-outer-mode")) {
		disableCutOuterPage();
	}
	if (cutInnerPageButton.classList.contains("cut-disabled")) {
		enableCutInnerPage();

	} else {
		disableCutInnerPage();
	}
};
cutOuterPageButton.onmouseup = () => {
	if (toolbarElement.classList.contains("edit-mode")) {
		disableEditPage();
	}
	if (toolbarElement.classList.contains("cut-inner-mode")) {
		disableCutInnerPage();
	}
	if (cutOuterPageButton.classList.contains("cut-disabled")) {
		enableCutOuterPage();
	} else {
		disableCutOuterPage();
	}
};
undoCutPageButton.onmouseup = () => {
	editorElement.contentWindow.postMessage(JSON.stringify({ method: "undoCutPage" }), "*");
};
undoAllCutPageButton.onmouseup = () => {
	editorElement.contentWindow.postMessage(JSON.stringify({ method: "undoAllCutPage" }), "*");
};
redoCutPageButton.onmouseup = () => {
	editorElement.contentWindow.postMessage(JSON.stringify({ method: "redoCutPage" }), "*");
};
savePageButton.onmouseup = () => {
	savePage();
};
if (typeof print == "function") {
	printPageButton.onmouseup = () => {
		editorElement.contentWindow.postMessage(JSON.stringify({ method: "printPage" }), "*");
	};
} else {
	printPageButton.remove();
}

let toolbarPositionPointer, toolbarMoving, toolbarTranslateMax;
let orientationPortrait = matchMedia("(orientation: portrait)").matches;
let toolbarTranslate = 0;
toolbarElement.ondragstart = event => event.preventDefault();
toolbarElement.ontouchstart = toolbarOnTouchStart;
toolbarElement.onmousedown = toolbarOnTouchStart;
toolbarElement.ontouchmove = toolbarOnTouchMove;
toolbarElement.ontouchend = toolbarOnTouchEnd;

function viewportSizeChange() {
	orientationPortrait = matchMedia("(orientation: portrait)").matches;
	toolbarElement.style.setProperty("transform", orientationPortrait ? `translate(0, ${toolbarTranslate}px)` : `translate(${toolbarTranslate}px, 0)`);
}

function toolbarOnTouchStart(event) {
	const position = getPosition(event);
	toolbarPositionPointer = (orientationPortrait ? position.pageY : position.pageX) - toolbarTranslate;
	toolbarTranslateMax = (orientationPortrait ? -lastButton.getBoundingClientRect().top : -lastButton.getBoundingClientRect().left) + toolbarTranslate;
}

function toolbarOnTouchMove(event) {
	if (toolbarPositionPointer != null && (event.buttons === undefined || event.buttons == 1)) {
		const position = getPosition(event);
		const lastToolbarTranslate = toolbarTranslate;
		let newToolbarTranslate = (orientationPortrait ? position.pageY : position.pageX) - toolbarPositionPointer;
		if (newToolbarTranslate > 0) {
			newToolbarTranslate = 0;
		}
		if (newToolbarTranslate < toolbarTranslateMax) {
			newToolbarTranslate = toolbarTranslateMax;
		}
		if (Math.abs(lastToolbarTranslate - newToolbarTranslate) > (toolbarMoving ? 1 : 8)) {
			toolbarTranslate = newToolbarTranslate;
			const newTransform = orientationPortrait ? `translate(0px, ${toolbarTranslate}px)` : `translate(${toolbarTranslate}px, 0px)`;
			toolbarMoving = true;
			toolbarElement.style.setProperty("transform", newTransform);
			editorElement.style.setProperty("pointer-events", "none");
			event.preventDefault();
		}
	}
}

function toolbarOnTouchEnd(event) {
	if (toolbarMoving) {
		editorElement.style.removeProperty("pointer-events");
		event.preventDefault();
		event.stopPropagation();
	}
	toolbarPositionPointer = null;
	toolbarMoving = false;
}

let updatedResources = {};

addEventListener("resize", viewportSizeChange);
addEventListener("message", event => {
	const message = JSON.parse(event.data);
	if (message.method == "setContent") {
		tabData.options.openEditor = false;
		tabData.options.openSavedPage = false;
		if (message.compressContent) {
			tabData.options.compressContent = true;
			if (tabData.selfExtractingArchive !== undefined) {
				tabData.options.selfExtractingArchive = tabData.selfExtractingArchive;
			}
			if (tabData.extractDataFromPageTags !== undefined) {
				tabData.options.extractDataFromPage = tabData.extractDataFromPageTags;
			}
			if (tabData.insertTextBody !== undefined) {
				tabData.options.insertTextBody = tabData.insertTextBody;
			}
			if (tabData.embeddedImage !== undefined) {
				tabData.options.embeddedImage = tabData.embeddedImage;
			}
			getContentPageData(tabData.content, message.content, { password: tabData.options.password })
				.then(pageData => {
					pageData.content = message.content;
					pageData.title = message.title;
					pageData.doctype = message.doctype;
					pageData.viewport = message.viewport;
					pageData.url = message.url;
					pageData.filename = message.filename || tabData.filename;
					if (message.foregroundSave) {
						tabData.options.backgroundSave = false;
						tabData.options.foregroundSave = true;
					}
					return download.downloadPage(pageData, tabData.options);
				});
		} else {
			const pageData = {
				content: message.content,
				filename: message.filename || tabData.filename
			};
			tabData.options.compressContent = false;
			download.downloadPage(pageData, tabData.options);
		}
	}
	if (message.method == "onUpdate") {
		tabData.docSaved = message.saved;
	}
	if (message.method == "onInit") {
		tabData.options.disableFormatPage = !message.formatPageEnabled;
		formatPageButton.hidden = !message.formatPageEnabled;
		document.title = "[SingleFile] " + message.title;
		if (message.filename) {
			tabData.filename = message.filename;
		}
		if (message.icon) {
			document.querySelectorAll("head > link[rel=icon]").forEach(element => element.remove());
			const linkElement = document.createElement("link");
			linkElement.rel = "icon";
			linkElement.href = message.icon;
			document.head.appendChild(linkElement);
		}
		if (tabData.options.displayInfobarInEditor) {
			displayInfobar();
		}
		tabData.docSaved = true;
		if (!message.reset) {
			const defaultEditorMode = tabData.options.defaultEditorMode;
			if (defaultEditorMode == "edit") {
				enableEditPage();
			} else if (defaultEditorMode == "format" && !tabData.options.disableFormatPage) {
				formatPage();
			} else if (defaultEditorMode == "cut") {
				enableCutInnerPage();
			} else if (defaultEditorMode == "cut-external") {
				enableCutOuterPage();
			}
		}
	}
	if (message.method == "savePage") {
		savePage();
	}
	if (message.method == "displayInfobar") {
		const doc = new DOMParser().parseFromString(message.content, "text/html");
		deserializeShadowRoots(doc.body);
		const infobarElement = doc.querySelector(INFOBAR_TAGNAME);
		infobarElement.shadowRoot.querySelector("style").textContent += ".infobar { position: absolute; }";
		document.querySelector(".editor-container").appendChild(infobarElement);
	}
});

browser.runtime.onMessage.addListener(message => {
	if (message.method == "devtools.resourceCommitted") {
		updatedResources[message.url] = { content: message.content, type: message.type, encoding: message.encoding };
		return Promise.resolve({});
	}
	if (message.method == "content.save") {
		tabData.options = message.options;
		savePage();
		browser.runtime.sendMessage({ method: "ui.processInit" });
		return Promise.resolve({});
	}
	if (message.method == "editor.setTabData") {
		if (message.truncated) {
			tabDataContents.push(message.content);
		} else {
			tabDataContents = [message.content];
		}
		if (!message.truncated || message.finished) {
			tabData = JSON.parse(tabDataContents.join(""));
			tabData.options = message.options;
			tabDataContents = [];
			editorElement.contentWindow.postMessage(JSON.stringify({ method: "init", content: tabData.content, password: tabData.options.password, compressContent: message.compressContent }), "*");
			editorElement.contentWindow.focus();
			setInterval(() => browser.runtime.sendMessage({ method: "editor.ping" }), 15000);
		}
		return Promise.resolve({});
	}
	if (message.method == "options.refresh") {
		return refreshOptions(message.profileName);
	}
	if (message.method == "content.error") {
		onError(message.error, message.link);
	}
	if (message.method == "content.download") {
		return downloadContent(message);
	}
});

addEventListener("load", () => {
	browser.runtime.sendMessage({ method: "editor.getTabData" });
});

addEventListener("beforeunload", event => {
	if (tabData.options.warnUnsavedPage && !tabData.docSaved) {
		event.preventDefault();
		event.returnValue = "";
	}
});

async function downloadContent(message) {
	if (!downloadParser) {
		downloadParser = yabson.getParser();
	}
	const result = await downloadParser.next(message.data);
	if (result.done) {
		downloadParser = null;
		if (result.value.foregroundSave) {
			editorElement.contentWindow.postMessage(JSON.stringify({
				method: "download",
				filename: result.value.filename,
				content: Array.from(new Uint8Array(result.value.content))
			}), "*");
		} else {
			const link = document.createElement("a");
			link.download = result.value.filename;
			link.href = URL.createObjectURL(new Blob([result.value.content]), "text/html");
			link.dispatchEvent(new MouseEvent("click"));
			URL.revokeObjectURL(link.href);
		}
		return browser.runtime.sendMessage({ method: "downloads.end", taskId: result.value.taskId }).then(() => ({}));
	} else {
		return Promise.resolve({});
	}
}

async function refreshOptions(profileName) {
	const profiles = await browser.runtime.sendMessage({ method: "config.getProfiles" });
	tabData.options = profiles[profileName];
}

function disableEditPage() {
	editPageButton.classList.add("edit-disabled");
	toolbarElement.classList.remove("edit-mode");
	editorElement.contentWindow.postMessage(JSON.stringify({ method: "disableEditPage" }), "*");
}

function disableCutInnerPage() {
	cutInnerPageButton.classList.add("cut-disabled");
	toolbarElement.classList.remove("cut-inner-mode");
	editorElement.contentWindow.postMessage(JSON.stringify({ method: "disableCutInnerPage" }), "*");
}

function disableCutOuterPage() {
	cutOuterPageButton.classList.add("cut-disabled");
	toolbarElement.classList.remove("cut-outer-mode");
	editorElement.contentWindow.postMessage(JSON.stringify({ method: "disableCutOuterPage" }), "*");
}

function resetHighlightButtons() {
	highlightButtons.forEach(highlightButton => highlightButton.classList.add("highlight-disabled"));
	editorElement.contentWindow.postMessage(JSON.stringify({ method: "disableHighlight" }), "*");
}

function disableRemoveHighlights() {
	toolbarElement.classList.remove("remove-highlight-mode");
	removeHighlightButton.classList.add("remove-highlight-disabled");
	editorElement.contentWindow.postMessage(JSON.stringify({ method: "disableRemoveHighlights" }), "*");
}

function displayHighlights() {
	toggleHighlightsButton.src = "/src/ui/resources/button_highlighter_visible.png";
	editorElement.contentWindow.postMessage(JSON.stringify({ method: "displayHighlights" }), "*");
}

function enableEditPage() {
	editPageButton.classList.remove("edit-disabled");
	toolbarElement.classList.add("edit-mode");
	editorElement.contentWindow.postMessage(JSON.stringify({ method: "enableEditPage" }), "*");
}

function formatPage() {
	formatPageButton.classList.remove("format-disabled");
	updatedResources = {};
	editorElement.contentWindow.postMessage(JSON.stringify({
		method: "formatPage",
		applySystemTheme: tabData.options.applySystemTheme
	}), "*");
}

function cancelFormatPage() {
	formatPageButton.classList.add("format-disabled");
	updatedResources = {};
	editorElement.contentWindow.postMessage(JSON.stringify({ method: "cancelFormatPage" }), "*");
}

function enableCutInnerPage() {
	cutInnerPageButton.classList.remove("cut-disabled");
	toolbarElement.classList.add("cut-inner-mode");
	resetHighlightButtons();
	disableRemoveHighlights();
	editorElement.contentWindow.postMessage(JSON.stringify({ method: "enableCutInnerPage" }), "*");
}

function enableCutOuterPage() {
	cutOuterPageButton.classList.remove("cut-disabled");
	toolbarElement.classList.add("cut-outer-mode");
	resetHighlightButtons();
	disableRemoveHighlights();
	editorElement.contentWindow.postMessage(JSON.stringify({ method: "enableCutOuterPage" }), "*");
}

function savePage() {
	editorElement.contentWindow.postMessage(JSON.stringify({
		method: "getContent",
		compressHTML: tabData.options.compressHTML,
		includeInfobar: tabData.options.includeInfobar,
		backgroundSave: tabData.options.backgroundSave,
		updatedResources,
		filename: tabData.filename,
		foregroundSave: FOREGROUND_SAVE
	}), "*");
}

function displayInfobar() {
	editorElement.contentWindow.postMessage(JSON.stringify({
		method: "displayInfobar"
	}), "*");
}

function getPosition(event) {
	if (event.touches && event.touches.length) {
		const touch = event.touches[0];
		return touch;
	} else {
		return event;
	}
}

async function getContentPageData(zipContent, page, options) {
	zip.configure({ workerScripts: { inflate: ["/lib/single-file-z-worker.js"] } });
	const zipReader = new zip.ZipReader(new zip.Uint8ArrayReader(new Uint8Array(zipContent)));
	const entries = await zipReader.getEntries();
	const resources = [];
	await Promise.all(entries.map(async entry => {
		let data;
		if (!options.password && entry.bitFlag.encrypted) {
			options.password = prompt("Please enter the password to view the page");
		}
		if (entry.filename.match(/^([0-9_]+\/)?index.html$/)) {
			data = page;
		} else {
			if (entry.filename.endsWith(".html")) {
				data = await entry.getData(new zip.TextWriter(), options);
			} else {
				data = await entry.getData(new zip.Uint8ArrayWriter(), options);
			}
		}
		const extensionMatch = entry.filename.match(/\.([^.]+)/);
		resources.push({
			filename: entry.filename.match(/^([0-9_]+\/)?(.*)$/)[2],
			extension: extensionMatch && extensionMatch[1],
			content: data,
			url: entry.comment
		});
	}));
	return getPageData(resources);
}

function getPageData(resources) {
	const pageData = JSON.parse(JSON.stringify(EMPTY_PAGE_DATA));
	for (const resource of resources) {
		const resourcePageData = getPageDataResource(resource, "", pageData);
		const filename = resource.filename.substring(resourcePageData.prefixPath.length);
		resource.name = filename;
		if (filename.startsWith("images/")) {
			resourcePageData.resources.images.push(resource);
		}
		if (filename.startsWith("fonts/")) {
			resourcePageData.resources.fonts.push(resource);
		}
		if (filename.startsWith("scripts/")) {
			resourcePageData.resources.scripts.push(resource);
		}
		if (filename.endsWith(".css")) {
			resourcePageData.resources.stylesheets.push(resource);
		}
		if (filename.endsWith(".html")) {
			resourcePageData.content = resource.content;
		}
	}
	return pageData;
}

const EMPTY_PAGE_DATA = {
	name: "",
	prefixPath: "",
	resources: {
		stylesheets: [],
		images: [],
		fonts: [],
		scripts: [],
		frames: []
	}
};

function getPageDataResource(resource, prefixPath = "", pageData) {
	const filename = resource.filename.substring(prefixPath.length);
	resource.name = filename;
	if (filename.startsWith("frames/")) {
		const framesIndex = Number(filename.match(/^frames\/(\d+)\//)[1]);
		const framePath = "frames/" + framesIndex + "/";
		if (!pageData.resources.frames[framesIndex]) {
			pageData.resources.frames[framesIndex] = Object.assign(JSON.parse(JSON.stringify(EMPTY_PAGE_DATA)), {
				name: framePath,
				prefixPath: prefixPath + framePath
			});
		}
		return getPageDataResource(resource, prefixPath + framePath, pageData.resources.frames[framesIndex]);
	} else {
		return pageData;
	}
}

function deserializeShadowRoots(node) {
	node.querySelectorAll(`template[${SHADOWROOT_ATTRIBUTE_NAME}]`).forEach(element => {
		if (element.parentElement) {
			let shadowRoot;
			try {
				shadowRoot = element.parentElement.attachShadow({ mode: "open" });
				const contentDocument = (new DOMParser()).parseFromString(element.innerHTML, "text/html");
				Array.from(contentDocument.head.childNodes).forEach(node => shadowRoot.appendChild(node));
				Array.from(contentDocument.body.childNodes).forEach(node => shadowRoot.appendChild(node));
			} catch (error) {
				// ignored
			}
			if (shadowRoot) {
				deserializeShadowRoots(shadowRoot);
				element.remove();
			}
		}
	});
}