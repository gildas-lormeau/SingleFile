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

/* global window, document, fetch, DOMParser, getComputedStyle, setTimeout, clearTimeout, NodeFilter, Readability, isProbablyReaderable, matchMedia, TextDecoder, Node, URL, prompt, MutationObserver, FileReader, Worker, navigator */

import { setLabels } from "./../../ui/common/common-content-ui.js";
import { downloadPageForeground } from "../../core/common/download.js";

(globalThis => {

	const IS_NOT_SAFARI = !/Safari/.test(navigator.userAgent) || /Chrome/.test(navigator.userAgent) || /Vivaldi/.test(navigator.userAgent) || /OPR/.test(navigator.userAgent);

	const singlefile = globalThis.singlefile;

	const FORBIDDEN_TAG_NAMES = ["a", "area", "audio", "base", "br", "col", "command", "embed", "hr", "img", "iframe", "input", "keygen", "link", "meta", "param", "source", "track", "video", "wbr"];
	const BUTTON_ANCHOR_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgAgMAAAAOFJJnAAABhGlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV9TtaIVETuIOASsThZERRylikWwUNoKrTqYXPohNGlIUlwcBdeCgx+LVQcXZ10dXAVB8APEydFJ0UVK/F9SaBHjwXE/3t173L0DhFqJqWbbOKBqlpGMRcVMdkUMvKIbfQCG0SExU4+nFtLwHF/38PH1LsKzvM/9OXqUnMkAn0g8y3TDIl4nnt60dM77xCFWlBTic+Ixgy5I/Mh12eU3zgWHBZ4ZMtLJOeIQsVhoYbmFWdFQiaeIw4qqUb6QcVnhvMVZLVVY4578hcGctpziOs0hxLCIOBIQIaOCDZRgIUKrRoqJJO1HPfyDjj9BLplcG2DkmEcZKiTHD/4Hv7s185MTblIwCrS/2PbHCBDYBepV2/4+tu36CeB/Bq60pr9cA2Y+Sa82tfAR0LsNXFw3NXkPuNwBBp50yZAcyU9TyOeB9zP6pizQfwt0rbq9NfZx+gCkqaulG+DgEBgtUPaax7s7W3v790yjvx825XKP2aKCdAAAAAlwSFlzAAAuIwAALiMBeKU/dgAAAAd0SU1FB+QLEQA4M3Y7LzIAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAACVBMVEUAAAAAAACKioqjwG1pAAAAAXRSTlMAQObYZgAAAAFiS0dEAmYLfGQAAABkSURBVBjThc47CsNADIThWfD0bnSfbdIroP/+V0mhsN5gTNToK0YPaSvnF9B9wGykG54j/2GF1/hauE4E1AOuNxrBdA5KUXIqdiCnqC1zIZ2mFJQzKJ3wesOhcwDM4+fo7cOuD9C4HTQ9HAAQAAAAAElFTkSuQmCC";
	const BUTTON_CLOSE_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgAgMAAAAOFJJnAAABhGlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV9TtaIVETuIOASsThZERRylikWwUNoKrTqYXPohNGlIUlwcBdeCgx+LVQcXZ10dXAVB8APEydFJ0UVK/F9SaBHjwXE/3t173L0DhFqJqWbbOKBqlpGMRcVMdkUMvKIbfQCG0SExU4+nFtLwHF/38PH1LsKzvM/9OXqUnMkAn0g8y3TDIl4nnt60dM77xCFWlBTic+Ixgy5I/Mh12eU3zgWHBZ4ZMtLJOeIQsVhoYbmFWdFQiaeIw4qqUb6QcVnhvMVZLVVY4578hcGctpziOs0hxLCIOBIQIaOCDZRgIUKrRoqJJO1HPfyDjj9BLplcG2DkmEcZKiTHD/4Hv7s185MTblIwCrS/2PbHCBDYBepV2/4+tu36CeB/Bq60pr9cA2Y+Sa82tfAR0LsNXFw3NXkPuNwBBp50yZAcyU9TyOeB9zP6pizQfwt0rbq9NfZx+gCkqaulG+DgEBgtUPaax7s7W3v790yjvx825XKP2aKCdAAAAAlwSFlzAAAuIwAALiMBeKU/dgAAAAd0SU1FB+QLEQA6Na1u6IUAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAACVBMVEUAAAAAAACKioqjwG1pAAAAAXRSTlMAQObYZgAAAAFiS0dEAmYLfGQAAABlSURBVBhXTc/BEUQhCAPQ58ES6McSPED/rfwDI7vOMCoJIeGd6CvFgZXiwk47Ia5VUKdrVXcb39kfqxqmTg+I2xJ2tqhVTaGaQjTl7/GgIc/4CL4Vs3RsjLFndcxPnAn4iww8A3yQjRZjti1t6AAAAABJRU5ErkJggg==";
	const SHADOWROOT_ATTRIBUTE_NAME = "shadowrootmode";
	const SCRIPT_TEMPLATE_SHADOW_ROOT = "data-template-shadow-root";
	const SCRIPT_OPTIONS = "data-single-file-options";
	const NOTE_TAGNAME = "single-file-note";
	const NOTE_CLASS = "note";
	const NOTE_MASK_CLASS = "note-mask";
	const NOTE_HIDDEN_CLASS = "note-hidden";
	const NOTE_ANCHORED_CLASS = "note-anchored";
	const NOTE_SELECTED_CLASS = "note-selected";
	const NOTE_MOVING_CLASS = "note-moving";
	const NOTE_MASK_MOVING_CLASS = "note-mask-moving";
	const PAGE_MASK_CLASS = "page-mask";
	const MASK_CLASS = "single-file-mask";
	const PAGE_MASK_CONTAINER_CLASS = "single-file-page-mask";
	const HIGHLIGHT_CLASS = "single-file-highlight";
	const HIGHLIGHTS_STYLESHEET_CLASS = "single-file-highlights-stylesheet";
	const REMOVED_CONTENT_CLASS = "single-file-removed";
	const HIGHLIGHT_HIDDEN_CLASS = "single-file-highlight-hidden";
	const PAGE_MASK_ACTIVE_CLASS = "page-mask-active";
	const CUT_HOVER_CLASS = "single-file-cut-hover";
	const CUT_OUTER_HOVER_CLASS = "single-file-cut-outer-hover";
	const CUT_SELECTED_CLASS = "single-file-cut-selected";
	const CUT_OUTER_SELECTED_CLASS = "single-file-cut-outer-selected";
	const CUT_MODE_CLASS = "single-file-cut-mode";
	const NOTE_INITIAL_POSITION_X = 20;
	const NOTE_INITIAL_POSITION_Y = 20;
	const NOTE_INITIAL_WIDTH = 150;
	const NOTE_INITIAL_HEIGHT = 150;
	const NOTE_HEADER_HEIGHT = 25;
	const DISABLED_NOSCRIPT_ATTRIBUTE_NAME = "data-single-file-disabled-noscript";
	const COMMENT_HEADER = "Page saved with SingleFile";
	const COMMENT_HEADER_LEGACY = "Archive processed by SingleFile";

	let NOTES_WEB_STYLESHEET, MASK_WEB_STYLESHEET, HIGHLIGHTS_WEB_STYLESHEET;
	let selectedNote, anchorElement, maskNoteElement, maskPageElement, highlightSelectionMode, removeHighlightMode, resizingNoteMode, movingNoteMode, highlightColor, collapseNoteTimeout, cuttingOuterMode, cuttingMode, cuttingTouchTarget, cuttingPath, cuttingPathIndex, previousContent;
	let removedElements = [], removedElementIndex = 0, initScriptContent, pageResources, pageUrl, pageCompressContent, includeInfobar, openInfobar, infobarPositionAbsolute, infobarPositionTop, infobarPositionBottom, infobarPositionLeft, infobarPositionRight;

	globalThis.zip = singlefile.helper.zip;
	initEventListeners();
	new MutationObserver(initEventListeners).observe(document, { childList: true });

	function initEventListeners() {
		window.onmessage = async event => {
			const message = JSON.parse(event.data);
			if (message.method == "init") {
				await init(message);
			}
			if (message.method == "addNote") {
				addNote(message);
			}
			if (message.method == "displayNotes") {
				document.querySelectorAll(NOTE_TAGNAME).forEach(noteElement => noteElement.shadowRoot.querySelector("." + NOTE_CLASS).classList.remove(NOTE_HIDDEN_CLASS));
			}
			if (message.method == "hideNotes") {
				document.querySelectorAll(NOTE_TAGNAME).forEach(noteElement => noteElement.shadowRoot.querySelector("." + NOTE_CLASS).classList.add(NOTE_HIDDEN_CLASS));
			}
			if (message.method == "enableHighlight") {
				if (highlightColor) {
					document.documentElement.classList.remove(highlightColor + "-mode");
				}
				highlightColor = message.color;
				highlightSelectionMode = true;
				document.documentElement.classList.add(message.color + "-mode");
			}
			if (message.method == "disableHighlight") {
				disableHighlight();
				highlightSelectionMode = false;
			}
			if (message.method == "displayHighlights") {
				document.querySelectorAll("." + HIGHLIGHT_CLASS).forEach(noteElement => noteElement.classList.remove(HIGHLIGHT_HIDDEN_CLASS));
			}
			if (message.method == "hideHighlights") {
				document.querySelectorAll("." + HIGHLIGHT_CLASS).forEach(noteElement => noteElement.classList.add(HIGHLIGHT_HIDDEN_CLASS));
			}
			if (message.method == "enableRemoveHighlights") {
				removeHighlightMode = true;
				document.documentElement.classList.add("single-file-remove-highlights-mode");
			}
			if (message.method == "disableRemoveHighlights") {
				removeHighlightMode = false;
				document.documentElement.classList.remove("single-file-remove-highlights-mode");
			}
			if (message.method == "enableEditPage") {
				document.body.contentEditable = true;
				onUpdate(false);
			}
			if (message.method == "formatPage") {
				formatPage(!message.applySystemTheme, message.contentWidth);
			}
			if (message.method == "cancelFormatPage") {
				cancelFormatPage();
			}
			if (message.method == "disableEditPage") {
				document.body.contentEditable = false;
			}
			if (message.method == "enableCutInnerPage") {
				cuttingMode = true;
				document.documentElement.classList.add(CUT_MODE_CLASS);
			}
			if (message.method == "enableCutOuterPage") {
				cuttingOuterMode = true;
				document.documentElement.classList.add(CUT_MODE_CLASS);
			}
			if (message.method == "disableCutInnerPage" || message.method == "disableCutOuterPage") {
				if (message.method == "disableCutInnerPage") {
					cuttingMode = false;
				} else {
					cuttingOuterMode = false;
				}
				document.documentElement.classList.remove(CUT_MODE_CLASS);
				resetSelectedElements();
				if (cuttingPath) {
					unhighlightCutElement();
					cuttingPath = null;
				}
			}
			if (message.method == "undoCutPage") {
				undoCutPage();
			}
			if (message.method == "undoAllCutPage") {
				while (removedElementIndex) {
					removedElements[removedElementIndex - 1].forEach(element => element.classList.remove(REMOVED_CONTENT_CLASS));
					removedElementIndex--;
				}
			}
			if (message.method == "redoCutPage") {
				redoCutPage();
			}
			if (message.method == "getContent") {
				onUpdate(true);
				includeInfobar = message.includeInfobar;
				openInfobar = message.openInfobar;
				infobarPositionAbsolute = message.infobarPositionAbsolute;
				infobarPositionTop = message.infobarPositionTop;
				infobarPositionBottom = message.infobarPositionBottom;
				infobarPositionLeft = message.infobarPositionLeft;
				infobarPositionRight = message.infobarPositionRight;
				let content = getContent(message.compressHTML);
				if (initScriptContent) {
					content = content.replace(/<script data-template-shadow-root src.*?<\/script>/g, initScriptContent);
				}
				let filename;
				const pageOptions = loadOptionsFromPage(document);
				if (pageOptions) {
					pageOptions.backgroundSave = message.backgroundSave;
					pageOptions.saveDate = new Date(pageOptions.saveDate);
					pageOptions.visitDate = new Date(pageOptions.visitDate);
					filename = await singlefile.helper.formatFilename(content, document, pageOptions);
				}
				if (message.sharePage) {
					setLabels(message.labels);
				}
				if (pageCompressContent) {
					const viewport = document.head.querySelector("meta[name=viewport]");
					window.parent.postMessage(JSON.stringify({
						method: "setContent",
						content,
						filename,
						title: document.title,
						doctype: singlefile.helper.getDoctypeString(document),
						url: pageUrl,
						viewport: viewport ? viewport.content : null,
						compressContent: true,
						foregroundSave: message.foregroundSave,
						sharePage: message.sharePage,
						documentHeight: document.documentElement.offsetHeight
					}), "*");
				} else {
					if (message.foregroundSave || message.sharePage) {
						try {
							await downloadPageForeground({
								content,
								filename: filename || message.filename,
								mimeType: "text/html"
							}, { sharePage: message.sharePage });
						} catch (error) {
							console.log(error); // eslint-disable-line no-console
							window.parent.postMessage(JSON.stringify({ method: "onError", error: error.message }), "*");
						}
					} else {
						window.parent.postMessage(JSON.stringify({
							method: "setContent",
							content,
							filename
						}), "*");
					}
				}
			}
			if (message.method == "printPage") {
				printPage();
			}
			if (message.method == "displayInfobar") {
				singlefile.helper.displayIcon(document, true, {
					openInfobar: message.openInfobar,
					infobarPositionAbsolute: message.infobarPositionAbsolute,
					infobarPositionTop: message.infobarPositionTop,
					infobarPositionBottom: message.infobarPositionBottom,
					infobarPositionLeft: message.infobarPositionLeft,
					infobarPositionRight: message.infobarPositionRight
				});
				const infobarDoc = document.implementation.createHTMLDocument();
				infobarDoc.body.appendChild(document.querySelector(singlefile.helper.INFOBAR_TAGNAME));
				serializeShadowRoots(infobarDoc.body);
				const content = singlefile.helper.serialize(infobarDoc, true);
				window.parent.postMessage(JSON.stringify({
					method: "displayInfobar",
					content
				}), "*");
			}
			if (message.method == "download") {
				try {
					await downloadPageForeground({
						content: message.content,
						filename: message.filename,
						mimeType: message.mimeType
					}, { sharePage: message.sharePage });
				} catch (error) {
					console.log(error); // eslint-disable-line no-console
					window.parent.postMessage(JSON.stringify({ method: "onError", error: error.message }), "*");
				}
			}
		};
		window.onresize = reflowNotes;
		document.ondragover = event => event.preventDefault();
		document.ondrop = async event => {
			if (event.dataTransfer.files && event.dataTransfer.files[0]) {
				const file = event.dataTransfer.files[0];
				event.preventDefault();
				const content = new TextDecoder().decode(await file.arrayBuffer());
				const compressContent = /<html[^>]* data-sfz[^>]*>/i.test(content);
				if (compressContent) {
					await init({ content: file, compressContent }, { filename: file.name });
				} else {
					await init({ content }, { filename: file.name });
				}
			}
		};
	}

	async function init({ content, password, compressContent }, { filename, reset } = {}) {
		await initConstants();
		if (compressContent) {
			const zipOptions = {
				workerScripts: { inflate: ["/lib/single-file-z-worker.js"] }
			};
			try {
				const worker = new Worker(zipOptions.workerScripts.inflate[0]);
				worker.terminate();
				// eslint-disable-next-line no-unused-vars
			} catch (error) {
				delete zipOptions.workerScripts;
			}
			zipOptions.useWebWorkers = IS_NOT_SAFARI;
			const { docContent, origDocContent, resources, url } = await singlefile.helper.extract(content, {
				password,
				prompt,
				shadowRootScriptURL: new URL("/lib/single-file-extension-editor-init.js", document.baseURI).href,
				zipOptions
			});
			pageResources = resources;
			pageUrl = url;
			pageCompressContent = true;
			const contentDocument = (new DOMParser()).parseFromString(docContent, "text/html");
			if (detectSavedPage(contentDocument)) {
				await singlefile.helper.display(document, docContent, { disableFramePointerEvents: true });
				const infobarElement = document.querySelector(singlefile.helper.INFOBAR_TAGNAME);
				if (infobarElement) {
					infobarElement.remove();
				}
				await initPage();
				let icon;
				const origContentDocument = (new DOMParser()).parseFromString(origDocContent, "text/html");
				const iconElement = origContentDocument.querySelector("link[rel*=icon]");
				if (iconElement) {
					const iconResource = resources.find(resource => resource.filename == iconElement.getAttribute("href"));
					if (iconResource && iconResource.content) {
						const reader = new FileReader();
						reader.readAsDataURL(await (await fetch(iconResource.content)).blob());
						icon = await new Promise((resolve, reject) => {
							reader.addEventListener("load", () => resolve(reader.result), false);
							reader.addEventListener("error", reject, false);
						});
					} else {
						icon = iconElement.href;
					}
				}
				window.parent.postMessage(JSON.stringify({
					method: "onInit",
					title: document.title,
					icon,
					filename,
					reset,
					formatPageEnabled: isProbablyReaderable(document)
				}), "*");
			}
		} else {
			const initScriptContentMatch = content.match(/<script data-template-shadow-root.*<\/script>/);
			if (initScriptContentMatch && initScriptContentMatch[0]) {
				initScriptContent = initScriptContentMatch[0];
			}
			content = content.replace(/<script data-template-shadow-root.*<\/script>/g, "<script data-template-shadow-root src=/lib/single-file-extension-editor-init.js></script>");
			const contentDocument = (new DOMParser()).parseFromString(content, "text/html");
			if (detectSavedPage(contentDocument)) {
				if (contentDocument.doctype) {
					if (document.doctype) {
						document.replaceChild(contentDocument.doctype, document.doctype);
					} else {
						document.insertBefore(contentDocument.doctype, document.documentElement);
					}
				} else if (document.doctype) {
					document.doctype.remove();
				}
				const infobarElement = contentDocument.querySelector(singlefile.helper.INFOBAR_TAGNAME);
				if (infobarElement) {
					infobarElement.remove();
				}
				contentDocument.querySelectorAll("noscript").forEach(element => {
					element.setAttribute(DISABLED_NOSCRIPT_ATTRIBUTE_NAME, element.innerHTML);
					element.textContent = "";
				});
				contentDocument.querySelectorAll("iframe").forEach(element => {
					const pointerEvents = "pointer-events";
					element.style.setProperty("-sf-" + pointerEvents, element.style.getPropertyValue(pointerEvents), element.style.getPropertyPriority(pointerEvents));
					element.style.setProperty(pointerEvents, "none", "important");
				});
				document.replaceChild(contentDocument.documentElement, document.documentElement);
				document.querySelectorAll("[data-single-file-note-refs]").forEach(noteRefElement => noteRefElement.dataset.singleFileNoteRefs = noteRefElement.dataset.singleFileNoteRefs.replace(/,/g, " "));
				deserializeShadowRoots(document);
				document.querySelectorAll(NOTE_TAGNAME).forEach(containerElement => attachNoteListeners(containerElement, true));
				insertHighlightStylesheet(document);
				maskPageElement = getMaskElement(PAGE_MASK_CLASS, PAGE_MASK_CONTAINER_CLASS);
				maskNoteElement = getMaskElement(NOTE_MASK_CLASS);
				document.documentElement.onmousedown = onMouseDown;
				document.documentElement.onmouseup = document.documentElement.ontouchend = onMouseUp;
				document.documentElement.onmouseover = onMouseOver;
				document.documentElement.onmouseout = onMouseOut;
				document.documentElement.onkeydown = onKeyDown;
				document.documentElement.ontouchstart = document.documentElement.ontouchmove = onTouchMove;
				window.onclick = event => event.preventDefault();
				const iconElement = document.querySelector("link[rel*=icon]");
				window.parent.postMessage(JSON.stringify({
					method: "onInit",
					title: document.title,
					icon: iconElement && iconElement.href,
					filename,
					reset,
					formatPageEnabled: isProbablyReaderable(document)
				}), "*");
			}
		}
	}

	function loadOptionsFromPage(doc) {
		const optionsElement = doc.body.querySelector("script[type=\"application/json\"][" + SCRIPT_OPTIONS + "]");
		if (optionsElement) {
			return JSON.parse(optionsElement.textContent);
		}
	}

	async function initPage() {
		document.querySelectorAll("iframe").forEach(element => {
			const pointerEvents = "pointer-events";
			element.style.setProperty("-sf-" + pointerEvents, element.style.getPropertyValue(pointerEvents), element.style.getPropertyPriority(pointerEvents));
			element.style.setProperty(pointerEvents, "none", "important");
		});
		document.querySelectorAll("[data-single-file-note-refs]").forEach(noteRefElement => noteRefElement.dataset.singleFileNoteRefs = noteRefElement.dataset.singleFileNoteRefs.replace(/,/g, " "));
		deserializeShadowRoots(document);
		reflowNotes();
		await waitResourcesLoad();
		reflowNotes();
		document.querySelectorAll(NOTE_TAGNAME).forEach(containerElement => attachNoteListeners(containerElement, true));
		insertHighlightStylesheet(document);
		maskPageElement = getMaskElement(PAGE_MASK_CLASS, PAGE_MASK_CONTAINER_CLASS);
		maskNoteElement = getMaskElement(NOTE_MASK_CLASS);
		document.documentElement.onmousedown = onMouseDown;
		document.documentElement.onmouseup = document.documentElement.ontouchend = onMouseUp;
		document.documentElement.onmouseover = onMouseOver;
		document.documentElement.onmouseout = onMouseOut;
		document.documentElement.onkeydown = onKeyDown;
		document.documentElement.ontouchstart = document.documentElement.ontouchmove = onTouchMove;
		window.onclick = event => event.preventDefault();
	}

	async function initConstants() {
		[NOTES_WEB_STYLESHEET, MASK_WEB_STYLESHEET, HIGHLIGHTS_WEB_STYLESHEET] = await Promise.all([
			minifyText(await ((await fetch("../pages/editor-note-web.css")).text())),
			minifyText(await ((await fetch("../pages/editor-mask-web.css")).text())),
			minifyText(await ((await fetch("../pages/editor-frame-web.css")).text()))
		]);
	}

	function addNote({ color }) {
		const containerElement = document.createElement(NOTE_TAGNAME);
		const noteElement = document.createElement("div");
		const headerElement = document.createElement("header");
		const blockquoteElement = document.createElement("blockquote");
		const mainElement = document.createElement("textarea");
		const resizeElement = document.createElement("div");
		const removeNoteElement = document.createElement("img");
		const anchorIconElement = document.createElement("img");
		const noteShadow = containerElement.attachShadow({ mode: "open" });
		headerElement.appendChild(anchorIconElement);
		headerElement.appendChild(removeNoteElement);
		blockquoteElement.appendChild(mainElement);
		noteElement.appendChild(headerElement);
		noteElement.appendChild(blockquoteElement);
		noteElement.appendChild(resizeElement);
		noteShadow.appendChild(getStyleElement(NOTES_WEB_STYLESHEET));
		noteShadow.appendChild(noteElement);
		const notesElements = Array.from(document.querySelectorAll(NOTE_TAGNAME));
		const noteId = Math.max.call(Math, 0, ...notesElements.map(noteElement => Number(noteElement.dataset.noteId))) + 1;
		blockquoteElement.cite = "https://www.w3.org/TR/annotation-model/#selector(type=CssSelector,value=[data-single-file-note-refs~=\"" + noteId + "\"])";
		noteElement.classList.add(NOTE_CLASS);
		noteElement.classList.add(NOTE_ANCHORED_CLASS);
		noteElement.classList.add(color);
		noteElement.dataset.color = color;
		mainElement.dir = "auto";
		const boundingRectDocument = document.documentElement.getBoundingClientRect();
		let positionX = NOTE_INITIAL_WIDTH + NOTE_INITIAL_POSITION_X - 1 - boundingRectDocument.x;
		let positionY = NOTE_INITIAL_HEIGHT + NOTE_INITIAL_POSITION_Y - 1 - boundingRectDocument.y;
		while (Array.from(document.elementsFromPoint(positionX - window.scrollX, positionY - window.scrollY)).find(element => element.tagName.toLowerCase() == NOTE_TAGNAME)) {
			positionX += NOTE_INITIAL_POSITION_X;
			positionY += NOTE_INITIAL_POSITION_Y;
		}
		noteElement.style.setProperty("left", (positionX - NOTE_INITIAL_WIDTH - 1) + "px");
		noteElement.style.setProperty("top", (positionY - NOTE_INITIAL_HEIGHT - 1) + "px");
		resizeElement.className = "note-resize";
		resizeElement.ondragstart = event => event.preventDefault();
		removeNoteElement.className = "note-remove";
		removeNoteElement.src = BUTTON_CLOSE_URL;
		removeNoteElement.ondragstart = event => event.preventDefault();
		anchorIconElement.className = "note-anchor";
		anchorIconElement.src = BUTTON_ANCHOR_URL;
		anchorIconElement.ondragstart = event => event.preventDefault();
		containerElement.dataset.noteId = noteId;
		addNoteRef(document.documentElement, noteId);
		attachNoteListeners(containerElement, true);
		document.documentElement.insertBefore(containerElement, maskPageElement.getRootNode().host);
		noteElement.classList.add(NOTE_SELECTED_CLASS);
		selectedNote = noteElement;
		onUpdate(false);
	}

	function attachNoteListeners(containerElement, editable = false) {
		const SELECT_PX_THRESHOLD = 4;
		const COLLAPSING_NOTE_DELAY = 750;
		const noteShadow = containerElement.shadowRoot;
		const noteElement = noteShadow.childNodes[1];
		const headerElement = noteShadow.querySelector("header");
		const mainElement = noteShadow.querySelector("textarea");
		const noteId = containerElement.dataset.noteId;
		const resizeElement = noteShadow.querySelector(".note-resize");
		const anchorIconElement = noteShadow.querySelector(".note-anchor");
		const removeNoteElement = noteShadow.querySelector(".note-remove");
		mainElement.readOnly = !editable;
		if (!editable) {
			anchorIconElement.style.setProperty("display", "none", "important");
		} else {
			anchorIconElement.style.removeProperty("display");
		}
		headerElement.ontouchstart = headerElement.onmousedown = event => {
			if (event.target == headerElement) {
				collapseNoteTimeout = setTimeout(() => {
					noteElement.classList.toggle("note-collapsed");
					hideMaskNote();
				}, COLLAPSING_NOTE_DELAY);
				event.preventDefault();
				const position = getPosition(event);
				const clientX = position.clientX;
				const clientY = position.clientY;
				const boundingRect = noteElement.getBoundingClientRect();
				const deltaX = clientX - boundingRect.left;
				const deltaY = clientY - boundingRect.top;
				maskPageElement.classList.add(PAGE_MASK_ACTIVE_CLASS);
				document.documentElement.style.setProperty("user-select", "none", "important");
				anchorElement = getAnchorElement(containerElement);
				displayMaskNote();
				selectNote(noteElement);
				moveNote(event, deltaX, deltaY);
				movingNoteMode = { event, deltaX, deltaY };
				document.documentElement.ontouchmove = document.documentElement.onmousemove = event => {
					clearTimeout(collapseNoteTimeout);
					if (!movingNoteMode) {
						movingNoteMode = { deltaX, deltaY };
					}
					movingNoteMode.event = event;
					moveNote(event, deltaX, deltaY);
				};
			}
		};
		resizeElement.ontouchstart = resizeElement.onmousedown = event => {
			event.preventDefault();
			resizingNoteMode = true;
			selectNote(noteElement);
			maskPageElement.classList.add(PAGE_MASK_ACTIVE_CLASS);
			document.documentElement.style.setProperty("user-select", "none", "important");
			document.documentElement.ontouchmove = document.documentElement.onmousemove = event => {
				event.preventDefault();
				const { clientX, clientY } = getPosition(event);
				const boundingRectNote = noteElement.getBoundingClientRect();
				noteElement.style.width = clientX - boundingRectNote.left + "px";
				noteElement.style.height = clientY - boundingRectNote.top + "px";
			};
		};
		anchorIconElement.ontouchend = anchorIconElement.onclick = event => {
			event.preventDefault();
			noteElement.classList.toggle(NOTE_ANCHORED_CLASS);
			if (!noteElement.classList.contains(NOTE_ANCHORED_CLASS)) {
				deleteNoteRef(containerElement, noteId);
				addNoteRef(document.documentElement, noteId);
			}
			onUpdate(false);
		};
		removeNoteElement.ontouchend = removeNoteElement.onclick = event => {
			event.preventDefault();
			deleteNoteRef(containerElement, noteId);
			containerElement.remove();
		};
		noteElement.onmousedown = () => {
			selectNote(noteElement);
		};

		function moveNote(event, deltaX, deltaY) {
			event.preventDefault();
			const { clientX, clientY } = getPosition(event);
			noteElement.classList.add(NOTE_MOVING_CLASS);
			if (editable) {
				if (noteElement.classList.contains(NOTE_ANCHORED_CLASS)) {
					deleteNoteRef(containerElement, noteId);
					anchorElement = getTarget(clientX, clientY) || document.documentElement;
					addNoteRef(anchorElement, noteId);
				} else {
					anchorElement = document.documentElement;
				}
			}
			document.documentElement.insertBefore(containerElement, maskPageElement.getRootNode().host);
			noteElement.style.setProperty("left", (clientX - deltaX) + "px");
			noteElement.style.setProperty("top", (clientY - deltaY) + "px");
			noteElement.style.setProperty("position", "fixed");
			displayMaskNote();
		}

		function displayMaskNote() {
			if (anchorElement == document.documentElement || anchorElement == document.documentElement) {
				hideMaskNote();
			} else {
				const boundingRectAnchor = anchorElement.getBoundingClientRect();
				maskNoteElement.classList.add(NOTE_MASK_MOVING_CLASS);
				if (selectedNote) {
					maskNoteElement.classList.add(selectedNote.dataset.color);
				}
				maskNoteElement.style.setProperty("top", (boundingRectAnchor.y - 3) + "px");
				maskNoteElement.style.setProperty("left", (boundingRectAnchor.x - 3) + "px");
				maskNoteElement.style.setProperty("width", (boundingRectAnchor.width + 3) + "px");
				maskNoteElement.style.setProperty("height", (boundingRectAnchor.height + 3) + "px");
			}
		}

		function hideMaskNote() {
			maskNoteElement.classList.remove(NOTE_MASK_MOVING_CLASS);
			if (selectedNote) {
				maskNoteElement.classList.remove(selectedNote.dataset.color);
			}
		}

		function selectNote(noteElement) {
			if (selectedNote) {
				selectedNote.classList.remove(NOTE_SELECTED_CLASS);
				maskNoteElement.classList.remove(selectedNote.dataset.color);
			}
			noteElement.classList.add(NOTE_SELECTED_CLASS);
			noteElement.classList.add(noteElement.dataset.color);
			selectedNote = noteElement;
		}

		function getTarget(clientX, clientY) {
			const targets = Array.from(document.elementsFromPoint(clientX, clientY)).filter(element => element.matches("html *:not(" + NOTE_TAGNAME + "):not(." + MASK_CLASS + ")"));
			if (!targets.includes(document.documentElement)) {
				targets.push(document.documentElement);
			}
			let newTarget, target = targets[0], boundingRect = target.getBoundingClientRect();
			newTarget = determineTargetElement("floor", target, clientX - boundingRect.left, getMatchedParents(target, "left"));
			if (newTarget == target) {
				newTarget = determineTargetElement("ceil", target, boundingRect.left + boundingRect.width - clientX, getMatchedParents(target, "right"));
			}
			if (newTarget == target) {
				newTarget = determineTargetElement("floor", target, clientY - boundingRect.top, getMatchedParents(target, "top"));
			}
			if (newTarget == target) {
				newTarget = determineTargetElement("ceil", target, boundingRect.top + boundingRect.height - clientY, getMatchedParents(target, "bottom"));
			}
			target = newTarget;
			while (boundingRect = target && target.getBoundingClientRect(), boundingRect && boundingRect.width <= SELECT_PX_THRESHOLD && boundingRect.height <= SELECT_PX_THRESHOLD) {
				target = target.parentElement;
			}
			return target;
		}

		function getMatchedParents(target, property) {
			let element = target, matchedParent, parents = [];
			do {
				const boundingRect = element.getBoundingClientRect();
				if (element.parentElement && !element.parentElement.tagName.toLowerCase() != NOTE_TAGNAME && !element.classList.contains(MASK_CLASS)) {
					const parentBoundingRect = element.parentElement.getBoundingClientRect();
					matchedParent = Math.abs(parentBoundingRect[property] - boundingRect[property]) <= SELECT_PX_THRESHOLD;
					if (matchedParent) {
						if (element.parentElement.clientWidth > SELECT_PX_THRESHOLD && element.parentElement.clientHeight > SELECT_PX_THRESHOLD &&
							((element.parentElement.clientWidth - element.clientWidth > SELECT_PX_THRESHOLD) || (element.parentElement.clientHeight - element.clientHeight > SELECT_PX_THRESHOLD))) {
							parents.push(element.parentElement);
						}
						element = element.parentElement;
					}
				} else {
					matchedParent = false;
				}
			} while (matchedParent && element);
			return parents;
		}

		function determineTargetElement(roundingMethod, target, widthDistance, parents) {
			if (Math[roundingMethod](widthDistance / SELECT_PX_THRESHOLD) <= parents.length) {
				target = parents[parents.length - Math[roundingMethod](widthDistance / SELECT_PX_THRESHOLD) - 1];
			}
			return target;
		}
	}

	function onMouseDown(event) {
		if ((cuttingMode || cuttingOuterMode) && cuttingPath) {
			event.preventDefault();
		}
	}

	function onMouseUp(event) {
		if (highlightSelectionMode) {
			event.preventDefault();
			highlightSelection();
			onUpdate(false);
		}
		if (removeHighlightMode) {
			event.preventDefault();
			let element = event.target, done;
			while (element && !done) {
				if (element.classList.contains(HIGHLIGHT_CLASS)) {
					document.querySelectorAll("." + HIGHLIGHT_CLASS + "[data-singlefile-highlight-id=" + JSON.stringify(element.dataset.singlefileHighlightId) + "]").forEach(highlightedElement => {
						resetHighlightedElement(highlightedElement);
						onUpdate(false);
					});
					done = true;
				}
				element = element.parentElement;
			}
		}
		if (resizingNoteMode) {
			event.preventDefault();
			resizingNoteMode = false;
			document.documentElement.style.removeProperty("user-select");
			maskPageElement.classList.remove(PAGE_MASK_ACTIVE_CLASS);
			document.documentElement.ontouchmove = onTouchMove;
			document.documentElement.onmousemove = null;
			onUpdate(false);
		}
		if (movingNoteMode) {
			event.preventDefault();
			anchorNote(movingNoteMode.event || event, selectedNote, movingNoteMode.deltaX, movingNoteMode.deltaY);
			movingNoteMode = null;
			document.documentElement.ontouchmove = onTouchMove;
			document.documentElement.onmousemove = null;
			onUpdate(false);
		}
		if ((cuttingMode || cuttingOuterMode) && cuttingPath) {
			event.preventDefault();
			if (event.ctrlKey) {
				const element = cuttingPath[cuttingPathIndex];
				element.classList.toggle(cuttingMode ? CUT_SELECTED_CLASS : CUT_OUTER_SELECTED_CLASS);
			} else {
				validateCutElement(event.shiftKey);
			}
		}
		if (collapseNoteTimeout) {
			clearTimeout(collapseNoteTimeout);
			collapseNoteTimeout = null;
		}
	}

	function onMouseOver(event) {
		if (cuttingMode || cuttingOuterMode) {
			const target = event.target;
			if (target.classList) {
				let ancestorFound;
				document.querySelectorAll("." + (cuttingMode ? CUT_SELECTED_CLASS : CUT_OUTER_SELECTED_CLASS)).forEach(element => {
					if (element == target || isAncestor(element, target) || isAncestor(target, element)) {
						ancestorFound = element;
					}
				});
				if (ancestorFound) {
					cuttingPath = [ancestorFound];
				} else {
					cuttingPath = getParents(event.target);
				}
				cuttingPathIndex = 0;
				highlightCutElement();
			}
		}
	}

	function onMouseOut() {
		if (cuttingMode || cuttingOuterMode) {
			if (cuttingPath) {
				unhighlightCutElement();
				cuttingPath = null;
			}
		}
	}

	function onTouchMove(event) {
		if (cuttingMode || cuttingOuterMode) {
			event.preventDefault();
			const { clientX, clientY } = getPosition(event);
			const target = document.elementFromPoint(clientX, clientY);
			if (cuttingTouchTarget != target) {
				onMouseOut();
				if (target) {
					cuttingTouchTarget = target;
					onMouseOver({ target });
				}
			}
		}
	}

	function onKeyDown(event) {
		if (cuttingMode || cuttingOuterMode) {
			if (event.code == "Tab") {
				if (cuttingPath) {
					const delta = event.shiftKey ? -1 : 1;
					let element = cuttingPath[cuttingPathIndex];
					let nextElement = cuttingPath[cuttingPathIndex + delta];
					if (nextElement) {
						let pathIndex = cuttingPathIndex + delta;
						while (
							nextElement &&
							(
								(delta == 1 &&
									element.getBoundingClientRect().width >= nextElement.getBoundingClientRect().width &&
									element.getBoundingClientRect().height >= nextElement.getBoundingClientRect().height) ||
								(delta == -1 &&
									element.getBoundingClientRect().width <= nextElement.getBoundingClientRect().width &&
									element.getBoundingClientRect().height <= nextElement.getBoundingClientRect().height))) {
							pathIndex += delta;
							nextElement = cuttingPath[pathIndex];
						}
						if (nextElement && nextElement.classList && nextElement != document.body && nextElement != document.documentElement) {
							unhighlightCutElement();
							cuttingPathIndex = pathIndex;
							highlightCutElement();
						}
					}
				}
				event.preventDefault();
			}
			if (event.code == "Space") {
				if (cuttingPath) {
					if (event.ctrlKey) {
						const element = cuttingPath[cuttingPathIndex];
						element.classList.add(cuttingMode ? CUT_SELECTED_CLASS : CUT_OUTER_SELECTED_CLASS);
					} else {
						validateCutElement(event.shiftKey);
					}
					event.preventDefault();
				}
			}
			if (event.code == "Escape") {
				resetSelectedElements();
				event.preventDefault();
			}
			if (event.key.toLowerCase() == "z" && event.ctrlKey) {
				if (event.shiftKey) {
					redoCutPage();
				} else {
					undoCutPage();
				}
				event.preventDefault();
			}
		}
		if (event.key.toLowerCase() == "s" && event.ctrlKey) {
			window.parent.postMessage(JSON.stringify({ "method": "savePage" }), "*");
			event.preventDefault();
		}
		if (event.key.toLowerCase() == "p" && event.ctrlKey) {
			printPage();
			event.preventDefault();
		}
	}

	function printPage() {
		unhighlightCutElement();
		resetSelectedElements();
		window.print();
	}

	function highlightCutElement() {
		const element = cuttingPath[cuttingPathIndex];
		element.classList.add(cuttingMode ? CUT_HOVER_CLASS : CUT_OUTER_HOVER_CLASS);
	}

	function unhighlightCutElement() {
		if (cuttingPath) {
			const element = cuttingPath[cuttingPathIndex];
			element.classList.remove(CUT_HOVER_CLASS);
			element.classList.remove(CUT_OUTER_HOVER_CLASS);
		}
	}

	function disableHighlight(doc = document) {
		if (highlightColor) {
			doc.documentElement.classList.remove(highlightColor + "-mode");
		}
	}

	function undoCutPage() {
		if (removedElementIndex) {
			removedElements[removedElementIndex - 1].forEach(element => element.classList.remove(REMOVED_CONTENT_CLASS));
			removedElementIndex--;
		}
	}

	function redoCutPage() {
		if (removedElementIndex < removedElements.length) {
			removedElements[removedElementIndex].forEach(element => element.classList.add(REMOVED_CONTENT_CLASS));
			removedElementIndex++;
		}
	}

	function validateCutElement(invert) {
		const selectedElement = cuttingPath[cuttingPathIndex];
		if ((cuttingMode && !invert) || (cuttingOuterMode && invert)) {
			if (document.documentElement != selectedElement && selectedElement.tagName.toLowerCase() != NOTE_TAGNAME) {
				const elementsRemoved = [selectedElement].concat(...document.querySelectorAll("." + CUT_SELECTED_CLASS + ",." + CUT_SELECTED_CLASS + " *,." + CUT_HOVER_CLASS + " *"));
				resetSelectedElements();
				if (elementsRemoved.length) {
					elementsRemoved.forEach(element => {
						unhighlightCutElement(element);
						if (element.tagName.toLowerCase() == NOTE_TAGNAME) {
							resetAnchorNote(element);
						} else {
							element.classList.add(REMOVED_CONTENT_CLASS);
						}
					});
					removedElements[removedElementIndex] = elementsRemoved;
					removedElementIndex++;
					removedElements.length = removedElementIndex;
					onUpdate(false);
				}
			}
		} else {
			if (document.documentElement != selectedElement && selectedElement.tagName.toLowerCase() != NOTE_TAGNAME) {
				const elements = [];
				const searchSelector = "*:not(style):not(meta):not(." + REMOVED_CONTENT_CLASS + ")";
				const elementsKept = [selectedElement].concat(...document.querySelectorAll("." + CUT_OUTER_SELECTED_CLASS));
				document.body.querySelectorAll(searchSelector).forEach(element => {
					let removed = true;
					elementsKept.forEach(elementKept => removed = removed && (elementKept != element && !isAncestor(elementKept, element) && !isAncestor(element, elementKept)));
					if (removed) {
						if (element.tagName.toLowerCase() == NOTE_TAGNAME) {
							resetAnchorNote(element);
						} else {
							elements.push(element);
						}
					}
				});
				elementsKept.forEach(elementKept => {
					unhighlightCutElement(elementKept);
					const elementKeptRect = elementKept.getBoundingClientRect();
					elementKept.querySelectorAll(searchSelector).forEach(descendant => {
						const descendantRect = descendant.getBoundingClientRect();
						if (descendantRect.width && descendantRect.height && (
							descendantRect.left + descendantRect.width < elementKeptRect.left ||
							descendantRect.right > elementKeptRect.right + elementKeptRect.width ||
							descendantRect.top + descendantRect.height < elementKeptRect.top ||
							descendantRect.bottom > elementKeptRect.bottom + elementKeptRect.height
						)) {
							elements.push(descendant);
						}
					});
				});
				resetSelectedElements();
				if (elements.length) {
					elements.forEach(element => element.classList.add(REMOVED_CONTENT_CLASS));
					removedElements[removedElementIndex] = elements;
					removedElementIndex++;
					removedElements.length = removedElementIndex;
					onUpdate(false);
				}
			}
		}
	}

	function resetSelectedElements(doc = document) {
		doc.querySelectorAll("." + CUT_OUTER_SELECTED_CLASS + ",." + CUT_SELECTED_CLASS).forEach(element => {
			element.classList.remove(CUT_OUTER_SELECTED_CLASS);
			element.classList.remove(CUT_SELECTED_CLASS);
		});
	}

	function anchorNote(event, noteElement, deltaX, deltaY) {
		event.preventDefault();
		const { clientX, clientY } = getPosition(event);
		document.documentElement.style.removeProperty("user-select");
		noteElement.classList.remove(NOTE_MOVING_CLASS);
		maskNoteElement.classList.remove(NOTE_MASK_MOVING_CLASS);
		maskPageElement.classList.remove(PAGE_MASK_ACTIVE_CLASS);
		maskNoteElement.classList.remove(noteElement.dataset.color);
		const headerElement = noteElement.querySelector("header");
		headerElement.ontouchmove = document.documentElement.onmousemove = null;
		let currentElement = anchorElement;
		let positionedElement;
		while (currentElement.parentElement && !positionedElement) {
			if (!FORBIDDEN_TAG_NAMES.includes(currentElement.tagName.toLowerCase())) {
				const currentElementStyle = getComputedStyle(currentElement);
				if (currentElementStyle.position != "static") {
					positionedElement = currentElement;
				}
			}
			currentElement = currentElement.parentElement;
		}
		if (!positionedElement) {
			positionedElement = document.documentElement;
		}
		const containerElement = noteElement.getRootNode().host;
		if (positionedElement == document.documentElement) {
			const firstMaskElement = document.querySelector("." + MASK_CLASS);
			firstMaskElement.parentElement.insertBefore(containerElement, firstMaskElement);
		} else {
			positionedElement.appendChild(containerElement);
		}
		const boundingRectPositionedElement = positionedElement.getBoundingClientRect();
		const stylePositionedElement = window.getComputedStyle(positionedElement);
		const borderX = parseInt(stylePositionedElement.getPropertyValue("border-left-width"));
		const borderY = parseInt(stylePositionedElement.getPropertyValue("border-top-width"));
		noteElement.style.setProperty("position", "absolute");
		noteElement.style.setProperty("left", (clientX - boundingRectPositionedElement.x - deltaX - borderX) + "px");
		noteElement.style.setProperty("top", (clientY - boundingRectPositionedElement.y - deltaY - borderY) + "px");
	}

	function resetAnchorNote(containerElement) {
		const noteId = containerElement.dataset.noteId;
		const noteElement = containerElement.shadowRoot.childNodes[1];
		noteElement.classList.remove(NOTE_ANCHORED_CLASS);
		deleteNoteRef(containerElement, noteId);
		addNoteRef(document.documentElement, noteId);
		document.documentElement.insertBefore(containerElement, maskPageElement.getRootNode().host);
	}

	function getPosition(event) {
		if (event.touches && event.touches.length) {
			const touch = event.touches[0];
			return touch;
		} else {
			return event;
		}
	}

	function highlightSelection() {
		let highlightId = 0;
		document.querySelectorAll("." + HIGHLIGHT_CLASS).forEach(highlightedElement => highlightId = Math.max(highlightId, highlightedElement.dataset.singlefileHighlightId));
		highlightId++;
		const selection = window.getSelection();
		const highlightedNodes = new Set();
		for (let indexRange = 0; indexRange < selection.rangeCount; indexRange++) {
			const range = selection.getRangeAt(indexRange);
			if (!range.collapsed) {
				if (range.commonAncestorContainer.nodeType == range.commonAncestorContainer.TEXT_NODE) {
					let contentText = range.startContainer.splitText(range.startOffset);
					contentText = contentText.splitText(range.endOffset);
					addHighLightedNode(contentText.previousSibling);
				} else {
					const treeWalker = document.createTreeWalker(range.commonAncestorContainer, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
					let highlightNodes;
					while (treeWalker.nextNode()) {
						if (highlightNodes && !treeWalker.currentNode.contains(range.endContainer)) {
							addHighLightedNode(treeWalker.currentNode);
						}
						if (treeWalker.currentNode == range.startContainer) {
							if (range.startContainer.nodeType == range.startContainer.TEXT_NODE) {
								const contentText = range.startContainer.splitText(range.startOffset);
								treeWalker.nextNode();
								addHighLightedNode(contentText);
							} else {
								addHighLightedNode(range.startContainer.childNodes[range.startOffset]);
							}
							highlightNodes = true;
						}
						if (treeWalker.currentNode == range.endContainer) {
							if (range.endContainer.nodeType == range.endContainer.TEXT_NODE) {
								const contentText = range.endContainer.splitText(range.endOffset);
								treeWalker.nextNode();
								addHighLightedNode(contentText.previousSibling);
							} else {
								addHighLightedNode(range.endContainer.childNodes[range.endOffset]);
							}
							highlightNodes = false;
						}
					}
					range.collapse();
				}
			}
		}
		highlightedNodes.forEach(node => highlightNode(node));

		function addHighLightedNode(node) {
			if (node && node.textContent.trim()) {
				if (node.nodeType == node.TEXT_NODE && node.parentElement.childNodes.length == 1 && node.parentElement.classList.contains(HIGHLIGHT_CLASS)) {
					highlightedNodes.add(node.parentElement);
				} else {
					highlightedNodes.add(node);
				}
			}
		}

		function highlightNode(node) {
			if (node.nodeType == node.ELEMENT_NODE) {
				resetHighlightedElement(node);
				node.classList.add(HIGHLIGHT_CLASS);
				node.classList.add(highlightColor);
				node.dataset.singlefileHighlightId = highlightId;
			} else if (node.parentElement) {
				highlightTextNode(node);
			}
		}

		function highlightTextNode(node) {
			const spanElement = document.createElement("span");
			spanElement.classList.add(HIGHLIGHT_CLASS);
			spanElement.classList.add(highlightColor);
			spanElement.textContent = node.textContent;
			spanElement.dataset.singlefileHighlightId = highlightId;
			node.parentNode.replaceChild(spanElement, node);
			return spanElement;
		}
	}

	function getParents(element) {
		const path = [];
		while (element) {
			path.push(element);
			element = element.parentElement;
		}
		return path;
	}

	function formatPage(applySystemTheme, contentWidth) {
		if (pageCompressContent) {
			serializeShadowRoots(document);
			previousContent = document.documentElement.cloneNode(true);
			deserializeShadowRoots(document);
		} else {
			previousContent = getContent(false);
		}
		const shadowRoots = {};
		const classesToPreserve = ["single-file-highlight", "single-file-highlight-yellow", "single-file-highlight-green", "single-file-highlight-pink", "single-file-highlight-blue"];
		document.querySelectorAll(NOTE_TAGNAME).forEach(containerElement => {
			shadowRoots[containerElement.dataset.noteId] = containerElement.shadowRoot;
			const className = "singlefile-note-id-" + containerElement.dataset.noteId;
			containerElement.classList.add(className);
			classesToPreserve.push(className);
		});
		const optionsElement = document.querySelector("script[type=\"application/json\"][" + SCRIPT_OPTIONS + "]");
		const article = new Readability(document, { classesToPreserve }).parse();
		const articleMetadata = Object.assign({}, article);
		delete articleMetadata.content;
		delete articleMetadata.textContent;
		for (const key in articleMetadata) {
			if (articleMetadata[key] == null) {
				delete articleMetadata[key];
			}
		}
		removedElements = [];
		removedElementIndex = 0;
		document.body.innerHTML = "";
		const domParser = new DOMParser();
		const doc = domParser.parseFromString(article.content, "text/html");
		const contentEditable = document.body.contentEditable;
		document.documentElement.replaceChild(doc.body, document.body);
		if (optionsElement) {
			document.body.appendChild(optionsElement);
		}
		document.querySelectorAll(NOTE_TAGNAME).forEach(containerElement => {
			const noteId = (Array.from(containerElement.classList).find(className => /singlefile-note-id-\d+/.test(className))).split("singlefile-note-id-")[1];
			containerElement.classList.remove("singlefile-note-id-" + noteId);
			containerElement.dataset.noteId = noteId;
			if (!containerElement.shadowRoot) {
				containerElement.attachShadow({ mode: "open" });
				containerElement.shadowRoot.appendChild(shadowRoots[noteId]);
			}
		});
		document.querySelectorAll(NOTE_TAGNAME).forEach(containerElement => shadowRoots[containerElement.dataset.noteId].childNodes.forEach(node => containerElement.shadowRoot.appendChild(node)));
		document.body.contentEditable = contentEditable;
		document.head.querySelectorAll("style").forEach(styleElement => styleElement.remove());
		const styleElement = document.createElement("style");
		styleElement.textContent = getStyleFormattedPage(contentWidth);
		document.head.appendChild(styleElement);
		document.body.classList.add("moz-reader-content");
		document.body.classList.add("content-width6");
		document.body.classList.add("reader-show-element");
		document.body.classList.add("sans-serif");
		document.body.classList.add("container");
		document.body.classList.add("line-height4");
		const prefersColorSchemeDark = matchMedia("(prefers-color-scheme: dark)");
		if (applySystemTheme && prefersColorSchemeDark && prefersColorSchemeDark.matches) {
			document.body.classList.add("dark");
		}
		document.body.style.setProperty("display", "block");
		document.body.style.setProperty("padding", "24px");
		const titleElement = document.createElement("h1");
		titleElement.classList.add("reader-title");
		titleElement.textContent = article.title;
		document.body.insertBefore(titleElement, document.body.firstChild);
		const existingMetaDataElement = document.querySelector("script[id=singlefile-readability-metadata]");
		if (existingMetaDataElement) {
			existingMetaDataElement.remove();
		}
		const metaDataElement = document.createElement("script");
		metaDataElement.type = "application/json";
		metaDataElement.id = "singlefile-readability-metadata";
		metaDataElement.textContent = JSON.stringify(articleMetadata, null, 2);
		document.head.appendChild(metaDataElement);
		document.querySelectorAll("a[href]").forEach(element => {
			const href = element.getAttribute("href").trim();
			if (href.startsWith(document.baseURI + "#")) {
				element.setAttribute("href", href.substring(document.baseURI.length));
			}
		});
		insertHighlightStylesheet(document);
		maskPageElement = getMaskElement(PAGE_MASK_CLASS, PAGE_MASK_CONTAINER_CLASS);
		maskNoteElement = getMaskElement(NOTE_MASK_CLASS);
		reflowNotes();
		onUpdate(false);
	}

	async function cancelFormatPage() {
		if (previousContent) {
			const contentEditable = document.body.contentEditable;
			if (pageCompressContent) {
				document.replaceChild(previousContent, document.documentElement);
				deserializeShadowRoots(document);
				await initPage();
			} else {
				await init({ content: previousContent }, { reset: true });
			}
			document.body.contentEditable = contentEditable;
			onUpdate(false);
			previousContent = null;
		}
	}

	function insertHighlightStylesheet(doc) {
		if (!doc.querySelector("." + HIGHLIGHTS_STYLESHEET_CLASS)) {
			const styleheetHighlights = getStyleElement(HIGHLIGHTS_WEB_STYLESHEET);
			styleheetHighlights.classList.add(HIGHLIGHTS_STYLESHEET_CLASS);
			doc.documentElement.appendChild(styleheetHighlights);
		}
	}

	function getContent(compressHTML) {
		unhighlightCutElement();
		serializeShadowRoots(document);
		const doc = document.cloneNode(true);
		disableHighlight(doc);
		resetSelectedElements(doc);
		deserializeShadowRoots(doc);
		deserializeShadowRoots(document);
		doc.documentElement.classList.remove(CUT_MODE_CLASS);
		doc.querySelectorAll("[" + DISABLED_NOSCRIPT_ATTRIBUTE_NAME + "]").forEach(element => {
			element.textContent = element.getAttribute(DISABLED_NOSCRIPT_ATTRIBUTE_NAME);
			element.removeAttribute(DISABLED_NOSCRIPT_ATTRIBUTE_NAME);
		});
		doc.querySelectorAll("." + MASK_CLASS + ", " + singlefile.helper.INFOBAR_TAGNAME + ", ." + REMOVED_CONTENT_CLASS).forEach(element => element.remove());
		if (includeInfobar) {
			const options = singlefile.helper.extractInfobarData(doc);
			options.openInfobar = openInfobar;
			options.infobarPositionAbsolute = infobarPositionAbsolute;
			options.infobarPositionTop = infobarPositionTop;
			options.infobarPositionRight = infobarPositionRight;
			options.infobarPositionBottom = infobarPositionBottom;
			options.infobarPositionLeft = infobarPositionLeft;
			singlefile.helper.appendInfobar(doc, options);
		}
		doc.querySelectorAll("." + HIGHLIGHT_CLASS).forEach(noteElement => noteElement.classList.remove(HIGHLIGHT_HIDDEN_CLASS));
		doc.querySelectorAll(`template[${SHADOWROOT_ATTRIBUTE_NAME}]`).forEach(templateElement => {
			const noteElement = templateElement.querySelector("." + NOTE_CLASS);
			if (noteElement) {
				noteElement.classList.remove(NOTE_HIDDEN_CLASS);
			}
			const mainElement = templateElement.querySelector("textarea");
			if (mainElement) {
				mainElement.textContent = mainElement.value;
			}
		});
		doc.querySelectorAll("iframe").forEach(element => {
			const pointerEvents = "pointer-events";
			element.style.setProperty(pointerEvents, element.style.getPropertyValue("-sf-" + pointerEvents), element.style.getPropertyPriority("-sf-" + pointerEvents));
			element.style.removeProperty("-sf-" + pointerEvents);
		});
		doc.body.removeAttribute("contentEditable");
		if (pageCompressContent) {
			const pageFilename = pageResources
				.filter(resource => resource.filename.endsWith("index.html"))
				.sort((resourceLeft, resourceRight) => resourceLeft.filename.length - resourceRight.filename.length)[0].filename;
			const resources = pageResources.filter(resource => resource.parentResources.includes(pageFilename));
			doc.querySelectorAll("[src]").forEach(element => resources.forEach(resource => {
				if (element.src == resource.content) {
					element.src = resource.name;
				}
			}));
			let content = singlefile.helper.serialize(doc, compressHTML);
			resources.sort((resourceLeft, resourceRight) => resourceRight.content.length - resourceLeft.content.length);
			resources.forEach(resource => content = content.replaceAll(resource.content, resource.name));
			return content + "<script " + SCRIPT_TEMPLATE_SHADOW_ROOT + ">" + getEmbedScript() + "</script>";
		} else {
			return singlefile.helper.serialize(doc, compressHTML) + "<script " + SCRIPT_TEMPLATE_SHADOW_ROOT + ">" + getEmbedScript() + "</script>";
		}
	}

	function onUpdate(saved) {
		window.parent.postMessage(JSON.stringify({ "method": "onUpdate", saved }), "*");
	}

	function waitResourcesLoad() {
		return new Promise(resolve => {
			let counterMutations = 0;
			const done = () => {
				observer.disconnect();
				resolve();
			};
			let timeoutInit = setTimeout(done, 100);
			const observer = new MutationObserver(() => {
				if (counterMutations < 20) {
					counterMutations++;
					clearTimeout(timeoutInit);
					timeoutInit = setTimeout(done, 100);
				} else {
					done();
				}
			});
			observer.observe(document, { subtree: true, childList: true, attributes: true });
		});
	}

	function reflowNotes() {
		document.querySelectorAll(NOTE_TAGNAME).forEach(containerElement => {
			const noteElement = containerElement.shadowRoot.querySelector("." + NOTE_CLASS);
			const noteBoundingRect = noteElement.getBoundingClientRect();
			const anchorElement = getAnchorElement(containerElement);
			const anchorBoundingRect = anchorElement.getBoundingClientRect();
			const maxX = anchorBoundingRect.x + Math.max(0, anchorBoundingRect.width - noteBoundingRect.width);
			const minX = anchorBoundingRect.x;
			const maxY = anchorBoundingRect.y + Math.max(0, anchorBoundingRect.height - NOTE_HEADER_HEIGHT);
			const minY = anchorBoundingRect.y;
			let left = parseInt(noteElement.style.getPropertyValue("left"));
			let top = parseInt(noteElement.style.getPropertyValue("top"));
			if (noteBoundingRect.x > maxX) {
				left -= noteBoundingRect.x - maxX;
			}
			if (noteBoundingRect.x < minX) {
				left += minX - noteBoundingRect.x;
			}
			if (noteBoundingRect.y > maxY) {
				top -= noteBoundingRect.y - maxY;
			}
			if (noteBoundingRect.y < minY) {
				top += minY - noteBoundingRect.y;
			}
			noteElement.style.setProperty("position", "absolute");
			noteElement.style.setProperty("left", left + "px");
			noteElement.style.setProperty("top", top + "px");
		});
	}

	function resetHighlightedElement(element) {
		element.classList.remove(HIGHLIGHT_CLASS);
		element.classList.remove("single-file-highlight-yellow");
		element.classList.remove("single-file-highlight-pink");
		element.classList.remove("single-file-highlight-blue");
		element.classList.remove("single-file-highlight-green");
		delete element.dataset.singlefileHighlightId;
	}

	function serializeShadowRoots(node) {
		node.querySelectorAll("*").forEach(element => {
			const shadowRoot = getShadowRoot(element);
			if (shadowRoot) {
				serializeShadowRoots(shadowRoot);
				const templateElement = document.createElement("template");
				templateElement.setAttribute(SHADOWROOT_ATTRIBUTE_NAME, "open");
				Array.from(shadowRoot.childNodes).forEach(childNode => templateElement.appendChild(childNode));
				element.appendChild(templateElement);
			}
		});
	}

	function deserializeShadowRoots(node) {
		node.querySelectorAll(`template[${SHADOWROOT_ATTRIBUTE_NAME}]`).forEach(element => {
			if (element.parentElement) {
				let shadowRoot = getShadowRoot(element.parentElement);
				if (shadowRoot) {
					Array.from(element.childNodes).forEach(node => shadowRoot.appendChild(node));
					element.remove();
				} else {
					try {
						shadowRoot = element.parentElement.attachShadow({ mode: "open" });
						const contentDocument = (new DOMParser()).parseFromString(element.innerHTML, "text/html");
						Array.from(contentDocument.head.childNodes).forEach(node => shadowRoot.appendChild(node));
						Array.from(contentDocument.body.childNodes).forEach(node => shadowRoot.appendChild(node));
						// eslint-disable-next-line no-unused-vars
					} catch (error) {
						// ignored
					}
				}
				if (shadowRoot) {
					deserializeShadowRoots(shadowRoot);
				}
			}
		});
	}

	function getMaskElement(className, containerClassName) {
		let maskElement = document.documentElement.querySelector("." + className);
		if (!maskElement) {
			maskElement = document.createElement("div");
			const maskContainerElement = document.createElement("div");
			if (containerClassName) {
				maskContainerElement.classList.add(containerClassName);
			}
			maskContainerElement.classList.add(MASK_CLASS);
			const firstNote = document.querySelector(NOTE_TAGNAME);
			if (firstNote && firstNote.parentElement == document.documentElement) {
				document.documentElement.insertBefore(maskContainerElement, firstNote);
			} else {
				document.documentElement.appendChild(maskContainerElement);
			}
			maskElement.classList.add(className);
			const maskShadow = maskContainerElement.attachShadow({ mode: "open" });
			maskShadow.appendChild(getStyleElement(MASK_WEB_STYLESHEET));
			maskShadow.appendChild(maskElement);
			return maskElement;
		}
	}

	function getStyleFormattedPage(contentWidth) {
		return `
	/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* Avoid adding ID selector rules in this style sheet, since they could
 * inadvertently match elements in the article content. */

:root {
  --grey-90-a10: rgba(12, 12, 13, 0.1);
  --grey-90-a20: rgba(12, 12, 13, 0.2);
  --grey-90-a30: rgba(12, 12, 13, 0.3);
  --grey-90-a80: rgba(12, 12, 13, 0.8);
  --grey-30: #d7d7db;
  --blue-40: #45a1ff;
  --blue-40-a30: rgba(69, 161, 255, 0.3);
  --blue-60: #0060df;
  --body-padding: 64px;
  --font-size: 12;
  --content-width: ${contentWidth}em;
  --line-height: 1.6em;
}

body {
  --main-background: #fff;
  --main-foreground: #333;
  --font-color: #000000;
  --primary-color: #0B83FF;
  --toolbar-border: var(--grey-90-a20);
  --toolbar-transparent-border: transparent;
  --toolbar-box-shadow: var(--grey-90-a10);
  --toolbar-button-background: transparent;
  --toolbar-button-background-hover: var(--grey-90-a10);
  --toolbar-button-foreground-hover: var(--font-color);
  --toolbar-button-background-active: var(--grey-90-a20);
  --toolbar-button-foreground-active: var(--primary-color);
  --toolbar-button-border: transparent;
  --toolbar-button-border-hover: transparent;
  --toolbar-button-border-active: transparent;
  --tooltip-background: var(--grey-90-a80);
  --tooltip-foreground: white;
  --tooltip-border: transparent;
  --popup-background: white;
  --popup-border: rgba(0, 0, 0, 0.12);
  --opaque-popup-border: #e0e0e0;
  --popup-line: var(--grey-30);
  --popup-shadow: rgba(49, 49, 49, 0.3);
  --popup-button-background: #edecf0;
  --popup-button-background-hover: hsla(0,0%,70%,.4);
  --popup-button-foreground-hover: var(--font-color);
  --popup-button-background-active: hsla(240,5%,5%,.15);
  --selected-background: var(--blue-40-a30);
  --selected-border: var(--blue-40);
  --font-value-border: var(--grey-30);
  --icon-fill: #3b3b3c;
  --icon-disabled-fill: #8080807F;
  --link-foreground: var(--blue-60);
  --link-selected-foreground: #333;
  --visited-link-foreground: #b5007f;
  /* light colours */
}

body.sepia {
  --main-background: #f4ecd8;
  --main-foreground: #5b4636;
  --toolbar-border: #5b4636;
}

body.dark {
  --main-background: rgb(28, 27, 34);
  --main-foreground: #eee;
  --font-color: #fff;
  --toolbar-border: #4a4a4b;
  --toolbar-box-shadow: black;
  --toolbar-button-background-hover: var(--grey-90-a30);
  --toolbar-button-background-active: var(--grey-90-a80);
  --tooltip-background: black;
  --tooltip-foreground: white;
  --popup-background: rgb(66,65,77);
  --opaque-popup-border: #434146;
  --popup-line: rgb(82, 82, 94);
  --popup-button-background: #5c5c61;
  --popup-button-background-active: hsla(0,0%,70%,.6);
  --selected-background: #3E6D9A;
  --font-value-border: #656468;
  --icon-fill: #fff;
  --icon-disabled-fill: #ffffff66;
  --link-foreground: #45a1ff;
  --link-selected-foreground: #fff;
  --visited-link-foreground: #e675fd;
  /* dark colours */
}

body.hcm {
  --main-background: Canvas;
  --main-foreground: CanvasText;
  --font-color: CanvasText;
  --primary-color: SelectedItem;
  --toolbar-border: CanvasText;
   /* We need a true transparent but in HCM this would compute to an actual color,
      so select the page's background color instead: */
  --toolbar-transparent-border: Canvas;
  --toolbar-box-shadow: Canvas;
  --toolbar-button-background: ButtonFace;
  --toolbar-button-background-hover: ButtonText;
  --toolbar-button-foreground-hover: ButtonFace;
  --toolbar-button-background-active: SelectedItem;
  --toolbar-button-foreground-active: SelectedItemText;
  --toolbar-button-border: ButtonText;
  --toolbar-button-border-hover: ButtonText;
  --toolbar-button-border-active: ButtonText;
  --tooltip-background: Canvas;
  --tooltip-foreground: CanvasText;
  --tooltip-border: CanvasText;
  --popup-background: Canvas;
  --popup-border: CanvasText;
  --opaque-popup-border: CanvasText;
  --popup-line: CanvasText;
  --popup-button-background: ButtonFace;
  --popup-button-background-hover: ButtonText;
  --popup-button-foreground-hover: ButtonFace;
  --popup-button-background-active: ButtonText;
  --selected-background: Canvas;
  --selected-border: SelectedItem;
  --font-value-border: CanvasText;
  --icon-fill: ButtonText;
  --icon-disabled-fill: GrayText;
  --link-foreground: LinkText;
  --link-selected-foreground: ActiveText;
  --visited-link-foreground: VisitedText;
}

body {
  margin: 0;
  padding: var(--body-padding);
  background-color: var(--main-background);
  color: var(--main-foreground);
}

body.loaded {
  transition: color 0.4s, background-color 0.4s;
}

body.dark *::-moz-selection {
  background-color: var(--selected-background);
}

a::-moz-selection {
  color: var(--link-selected-foreground);
}

body.sans-serif,
body.sans-serif .remove-button {
  font-family: Helvetica, Arial, sans-serif;
}

body.serif,
body.serif .remove-button {
  font-family: Georgia, "Times New Roman", serif;
}

/* Override some controls and content styles based on color scheme */

body.light > .container > .header > .domain {
  border-bottom-color: #333333 !important;
}

body.sepia > .container > .header > .domain {
  border-bottom-color: #5b4636 !important;
}

body.dark > .container > .header > .domain {
  border-bottom-color: #eeeeee !important;
}

body.light blockquote {
  border-inline-start: 2px solid #333333 !important;
}

body.sepia blockquote {
  border-inline-start: 2px solid #5b4636 !important;
}

body.dark blockquote {
  border-inline-start: 2px solid #eeeeee !important;
}

.light-button {
  color: #333333;
  background-color: #ffffff;
}

.dark-button {
  color: #eeeeee;
  background-color: #1c1b22;
}

.sepia-button {
  color: #5b4636;
  background-color: #f4ecd8;
}

.auto-button {
  text-align: center;
}

@media (prefers-color-scheme: dark) {
  .auto-button {
    background-color: #1c1b22;
    color: #eeeeee;
  }
}

@media not (prefers-color-scheme: dark) {
  .auto-button {
    background-color: #ffffff;
    color: #333333;
  }
}

/* Loading/error message */

.reader-message {
  margin-top: 40px;
  display: none;
  text-align: center;
  width: 100%;
  font-size: 0.9em;
}

/* Detector element to see if we're at the top of the doc or not. */
.top-anchor {
  position: absolute;
  top: 0;
  width: 0;
  height: 5px;
  pointer-events: none;
}

/* Header */

.header {
  text-align: start;
  display: none;
}

.domain {
  font-size: 0.9em;
  line-height: 1.48em;
  padding-bottom: 4px;
  font-family: Helvetica, Arial, sans-serif;
  text-decoration: none;
  border-bottom: 1px solid;
  color: var(--link-foreground);
}

.header > h1 {
  font-size: 1.6em;
  line-height: 1.25em;
  width: 100%;
  margin: 30px 0;
  padding: 0;
}

.header > .credits {
  font-size: 0.9em;
  line-height: 1.48em;
  margin: 0 0 10px;
  padding: 0;
  font-style: italic;
}

.header > .meta-data {
  font-size: 0.65em;
  margin: 0 0 15px;
}

.reader-estimated-time {
  text-align: match-parent;
}

/* Controls toolbar */

.toolbar-container {
  position: sticky;
  z-index: 2;
  top: 32px;
  height: 0; /* take up no space, so body is at the top. */

  /* As a stick container, we're positioned relative to the body. Move us to
   * the edge of the viewport using margins, and take the width of
   * the body padding into account for calculating our width.
   */
  margin-inline-start: calc(-1 * var(--body-padding));
  width: max(var(--body-padding), calc((100% - var(--content-width)) / 2 + var(--body-padding)));
  font-size: var(--font-size); /* Needed to ensure 'em' units match, is reset for .reader-controls */
}

.toolbar {
  padding-block: 16px;
  border: 1px solid var(--toolbar-border);
  border-radius: 6px;
  box-shadow: 0 2px 8px var(--toolbar-box-shadow);

  width: 32px; /* basic width, without padding/border */

  /* padding should be 16px, except if there's not enough space for that, in
   * which case use half the available space for padding (=25% on each side).
   * The 34px here is the width + borders. We use a variable because we need
   * to know this size for the margin calculation.
   */
  --inline-padding: min(16px, calc(25% - 0.25 * 34px));
  padding-inline: var(--inline-padding);

  /* Keep a maximum of 96px distance to the body, but center once the margin
   * gets too small. We need to set the start margin, however...
   * To center, we'd want 50% of the container, but we'd subtract half our
   * own width (16px) and half the border (1px) and the inline padding.
   * When the other margin would be 96px, we want 100% - 96px - the complete
   * width of the actual toolbar (34px + 2 * padding)
   */
  margin-inline-start: max(calc(50% - 17px - var(--inline-padding)), calc(100% - 96px - 34px - 2 * var(--inline-padding)));

  font-family: Helvetica, Arial, sans-serif;
  list-style: none;
  user-select: none;
}

@media (prefers-reduced-motion: no-preference) {
  .toolbar {
    transition-property: border-color, box-shadow;
    transition-duration: 250ms;
  }

  .toolbar .toolbar-button {
    transition-property: opacity;
    transition-duration: 250ms;
  }

  .toolbar-container.scrolled .toolbar:not(:hover, :focus-within) {
    border-color: var(--toolbar-transparent-border);
    box-shadow: 0 2px 8px transparent;
  }

  .toolbar-container.scrolled .toolbar:not(:hover, :focus-within) .toolbar-button {
    opacity: 0.6;
  }

  .toolbar-container.transition-location {
    transition-duration: 250ms;
    transition-property: width;
  }
}

.toolbar-container.overlaps .toolbar-button {
  opacity: 0.1;
}

.dropdown-open .toolbar {
  border-color: var(--toolbar-transparent-border);
  box-shadow: 0 2px 8px transparent;
}

.reader-controls {
  /* We use 'em's above this node to get it to the right size. However,
   * the UI inside the toolbar should use a fixed, smaller size. */
  font-size: 11px;
}

button {
  -moz-context-properties: fill;
  color: var(--font-color);
  fill: var(--icon-fill);
}

button:disabled {
  fill: var(--icon-disabled-fill);
}

.toolbar button::-moz-focus-inner {
  border: 0;
}

.toolbar-button {
  position: relative;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--toolbar-button-border);
  border-radius: 4px;
  margin: 4px 0;
  background-color: var(--toolbar-button-background);
  background-size: 16px 16px;
  background-position: center;
  background-repeat: no-repeat;
}

.toolbar-button:hover,
.toolbar-button:focus-visible {
  background-color: var(--toolbar-button-background-hover);
  border-color: var(--toolbar-button-border-hover);
  fill: var(--toolbar-button-foreground-hover);
}

.open .toolbar-button,
.toolbar-button:hover:active {
  background-color: var(--toolbar-button-background-active);
  border-color: var(--toolbar-button-border-active);
  color: var(--toolbar-button-foreground-active);
  fill: var(--toolbar-button-foreground-active);
}

.hover-label {
  position: absolute;
  top: 4px;
  inset-inline-start: 36px;
  line-height: 16px;
  white-space: pre; /* make sure we don't wrap */
  background-color: var(--tooltip-background);
  color: var(--tooltip-foreground);
  padding: 4px 8px;
  border: 1px solid var(--tooltip-border);
  border-radius: 2px;
  visibility: hidden;
  pointer-events: none;
  /* Put above .dropdown .dropdown-popup, which has z-index: 1000. */
  z-index: 1001;
}

/* Show the hover tooltip on non-dropdown buttons. */
.toolbar-button:not(.dropdown-toggle):hover > .hover-label,
.toolbar-button:not(.dropdown-toggle):focus-visible > .hover-label,
/* Show the hover tooltip for dropdown buttons unless its dropdown is open. */
:not(.open) > li > .dropdown-toggle:hover > .hover-label,
:not(.open) > li > .dropdown-toggle:focus-visible > .hover-label {
  visibility: visible;
}

.dropdown {
  text-align: center;
  list-style: none;
  margin: 0;
  padding: 0;
  position: relative;
}

.dropdown li {
  margin: 0;
  padding: 0;
}

/* Popup */

.dropdown .dropdown-popup {
  text-align: start;
  position: absolute;
  inset-inline-start: 40px;
  z-index: 1000;
  background-color: var(--popup-background);
  visibility: hidden;
  border-radius: 4px;
  border: 1px solid var(--popup-border);
  box-shadow: 0 0 10px 0 var(--popup-shadow);
  top: 0;
}

.open > .dropdown-popup {
  visibility: visible;
}

.dropdown-arrow {
  position: absolute;
  height: 24px;
  width: 16px;
  inset-inline-start: -16px;
  background-image: url("chrome://global/skin/reader/RM-Type-Controls-Arrow.svg");
  display: block;
  -moz-context-properties: fill, stroke;
  fill: var(--popup-background);
  stroke: var(--opaque-popup-border);
  pointer-events: none;
}

.dropdown-arrow:dir(rtl) {
  transform: scaleX(-1);
}

/* Align the style dropdown arrow (narrate does its own) */
.style-dropdown .dropdown-arrow {
  top: 7px;
}

/* Font style popup */

.radio-button {
  /* We visually hide these, but we keep them around so they can be focused
   * and changed by interacting with them via the label, or the keyboard, or
   * assistive technology.
   */
  opacity: 0;
  pointer-events: none;
  position: absolute;
}

.radiorow,
.buttonrow {
  display: flex;
  align-content: center;
  justify-content: center;
}

.content-width-value,
.font-size-value,
.line-height-value {
  box-sizing: border-box;
  width: 36px;
  height: 20px;
  line-height: 20px;
  display: flex;
  justify-content: center;
  align-content: center;
  margin: auto;
  border-radius: 10px;
  border: 1px solid var(--font-value-border);
  background-color: var(--popup-button-background);
}

.buttonrow > button {
  border: 0;
  height: 60px;
  width: 90px;
  background-color: transparent;
  background-repeat: no-repeat;
  background-position: center;
}

.buttonrow > button:enabled:hover,
.buttonrow > button:enabled:focus-visible {
  background-color: var(--popup-button-background-hover);
  color: var(--popup-button-foreground-hover);
  fill: var(--popup-button-foreground-hover);
}

.buttonrow > button:enabled:hover:active {
  background-color: var(--popup-button-background-active);
}

.radiorow:not(:last-child),
.buttonrow:not(:last-child) {
  border-bottom: 1px solid var(--popup-line);
}

body.hcm .buttonrow.line-height-buttons {
  /* On HCM the .color-scheme-buttons row is hidden, so remove the border from the row above it */
  border-bottom: none;
}

.radiorow > label {
  position: relative;
  box-sizing: border-box;
  border-radius: 2px;
  border: 2px solid var(--popup-border);
}

.radiorow > label[checked] {
  border-color: var(--selected-border);
}

/* For the hover style, we draw a line under the item by means of a
 * pseudo-element. Because these items are variable height, and
 * because their contents are variable height, position it absolutely,
 * and give it a width of 100% (the content width) + 4px for the 2 * 2px
 * border width.
 */
.radiorow > input[type=radio]:focus-visible + label::after,
.radiorow > label:hover::after {
  content: "";
  display: block;
  border-bottom: 2px solid var(--selected-border);
  width: calc(100% + 4px);
  position: absolute;
  /* to skip the 2 * 2px border + 2px spacing. */
  bottom: -6px;
  /* Match the start of the 2px border of the element: */
  inset-inline-start: -2px;
}

.font-type-buttons > label {
  height: 64px;
  width: 105px;
  /* Slightly more space between these items. */
  margin: 10px;
  /* Center the Sans-serif / Serif labels */
  text-align: center;
  background-size: 63px 39px;
  background-repeat: no-repeat;
  background-position: center 18px;
  background-color: var(--popup-button-background);
  fill: currentColor;
  -moz-context-properties: fill;
  /* This mostly matches baselines, but because of differences in font
   * baselines between serif and sans-serif, this isn't always enough. */
  line-height: 1;
  padding-top: 2px;
}

.font-type-buttons > label[checked] {
  background-color: var(--selected-background);
}

.sans-serif-button {
  font-family: Helvetica, Arial, sans-serif;
  background-image: url("chrome://global/skin/reader/RM-Sans-Serif.svg");
}

/* Tweak padding to match the baseline on mac */
:root[platform=macosx] .sans-serif-button {
  padding-top: 3px;
}

.serif-button {
  font-family: Georgia, "Times New Roman", serif;
  background-image: url("chrome://global/skin/reader/RM-Serif.svg");
}

body.hcm .color-scheme-buttons {
  /* Disallow selecting themes when HCM is on. */
  display: none;
}

.color-scheme-buttons > label {
  padding: 12px;
  height: 34px;
  font-size: 12px;
  /* Center the labels horizontally as well as vertically */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* We want 10px between items, but there's no margin collapsing in flexbox. */
  margin: 10px 5px;
}

.color-scheme-buttons > input:first-child + label {
  margin-inline-start: 10px;
}

.color-scheme-buttons > label:last-child {
  margin-inline-end: 10px;
}

/* Toolbar icons */

.close-button {
  background-image: url("chrome://global/skin/icons/close.svg");
}

.style-button {
  background-image: url("chrome://global/skin/reader/RM-Type-Controls-24x24.svg");
}

.minus-button {
  background-size: 18px 18px;
  background-image: url("chrome://global/skin/reader/RM-Minus-24x24.svg");
}

.plus-button {
  background-size: 18px 18px;
  background-image: url("chrome://global/skin/reader/RM-Plus-24x24.svg");
}

.content-width-minus-button {
  background-size: 42px 16px;
  background-image: url("chrome://global/skin/reader/RM-Content-Width-Minus-42x16.svg");
}

.content-width-plus-button {
  background-size: 44px 16px;
  background-image: url("chrome://global/skin/reader/RM-Content-Width-Plus-44x16.svg");
}

.line-height-minus-button {
  background-size: 34px 14px;
  background-image: url("chrome://global/skin/reader/RM-Line-Height-Minus-38x14.svg");
}

.line-height-plus-button {
  background-size: 34px 24px;
  background-image: url("chrome://global/skin/reader/RM-Line-Height-Plus-38x24.svg");
}

/* Mirror the line height buttons if the article is RTL. */
.reader-controls[articledir="rtl"] .line-height-minus-button,
.reader-controls[articledir="rtl"] .line-height-plus-button {
  transform: scaleX(-1);
}

@media print {
  .toolbar {
    display: none !important;
  }
}

/* Article content */

/* Note that any class names from the original article that we want to match on
 * must be added to CLASSES_TO_PRESERVE in ReaderMode.jsm, so that
 * Readability.js doesn't strip them out */

.container {
  margin: 0 auto;
  font-size: var(--font-size);
  max-width: var(--content-width);
  line-height: var(--line-height);
}

pre {
  font-family: inherit;
}

.moz-reader-content {
  display: none;
  font-size: 1em;
}

@media print {
  .moz-reader-content p,
  .moz-reader-content code,
  .moz-reader-content pre,
  .moz-reader-content blockquote,
  .moz-reader-content ul,
  .moz-reader-content ol,
  .moz-reader-content li,
  .moz-reader-content figure,
  .moz-reader-content .wp-caption {
    margin: 0 0 10px !important;
    padding: 0 !important;
  }
}

.moz-reader-content h1,
.moz-reader-content h2,
.moz-reader-content h3 {
  font-weight: bold;
}

.moz-reader-content h1 {
  font-size: 1.6em;
  line-height: 1.25em;
}

.moz-reader-content h2 {
  font-size: 1.2em;
  line-height: 1.51em;
}

.moz-reader-content h3 {
  font-size: 1em;
  line-height: 1.66em;
}

.moz-reader-content a:link {
  text-decoration: underline;
  font-weight: normal;
}

.moz-reader-content a:link,
.moz-reader-content a:link:hover,
.moz-reader-content a:link:active {
  color: var(--link-foreground);
}

.moz-reader-content a:visited {
  color: var(--visited-link-foreground);
}

.moz-reader-content * {
  max-width: 100%;
  height: auto;
}

.moz-reader-content p,
.moz-reader-content p,
.moz-reader-content code,
.moz-reader-content pre,
.moz-reader-content blockquote,
.moz-reader-content ul,
.moz-reader-content ol,
.moz-reader-content li,
.moz-reader-content figure,
.moz-reader-content .wp-caption {
  margin: -10px -10px 20px;
  padding: 10px;
  border-radius: 5px;
}

.moz-reader-content li {
  margin-bottom: 0;
}

.moz-reader-content li > ul,
.moz-reader-content li > ol {
  margin-bottom: -10px;
}

.moz-reader-content p > img:only-child,
.moz-reader-content p > a:only-child > img:only-child,
.moz-reader-content .wp-caption img,
.moz-reader-content figure img {
  display: block;
}

.moz-reader-content img[moz-reader-center] {
  margin-inline: auto;
}

.moz-reader-content .caption,
.moz-reader-content .wp-caption-text
.moz-reader-content figcaption {
  font-size: 0.9em;
  line-height: 1.48em;
  font-style: italic;
}

.moz-reader-content pre {
  white-space: pre-wrap;
}

.moz-reader-content blockquote {
  padding: 0;
  padding-inline-start: 16px;
}

.moz-reader-content ul,
.moz-reader-content ol {
  padding: 0;
}

.moz-reader-content ul {
  padding-inline-start: 30px;
  list-style: disc;
}

.moz-reader-content ol {
  padding-inline-start: 30px;
}

table,
th,
td {
  border: 1px solid currentColor;
  border-collapse: collapse;
  padding: 6px;
  vertical-align: top;
}

table {
  margin: 5px;
}

/* Visually hide (but don't display: none) screen reader elements */
.moz-reader-content .visually-hidden,
.moz-reader-content .visuallyhidden,
.moz-reader-content .sr-only {
  display: inline-block;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  border-width: 0;
}

/* Hide elements with common "hidden" class names */
.moz-reader-content .hidden,
.moz-reader-content .invisible {
  display: none;
}

/* Enforce wordpress and similar emoji/smileys aren't sized to be full-width,
 * see bug 1399616 for context. */
.moz-reader-content img.wp-smiley,
.moz-reader-content img.emoji {
  display: inline-block;
  border-width: 0;
  /* height: auto is implied from '.moz-reader-content *' rule. */
  width: 1em;
  margin: 0 .07em;
  padding: 0;
}

.reader-show-element {
  display: initial;
}

/* Provide extra spacing for images that may be aided with accompanying element such as <figcaption> */
.moz-reader-block-img:not(:last-child) {
  margin-block-end: 12px;
}

.moz-reader-wide-table {
  overflow-x: auto;
  display: block;
}

pre code {
  background-color: var(--main-background);
  border: 1px solid var(--font-color);
  display: block;
  overflow: auto;
}`;
	}

	function getEmbedScript() {
		return minifyText(`(() => {
			document.currentScript.remove();
			const processNode = node => {
				node.querySelectorAll("template[${SHADOWROOT_ATTRIBUTE_NAME}]").forEach(element=>{
					let shadowRoot = getShadowRoot(element.parentElement);
					if (!shadowRoot) {
						try {
							shadowRoot = element.parentElement.attachShadow({mode:element.getAttribute("${SHADOWROOT_ATTRIBUTE_NAME}")});
							shadowRoot.innerHTML = element.innerHTML;
							element.remove();
						} catch (error) {}						
						if (shadowRoot) {
							processNode(shadowRoot);
						}
					}					
				})
			};
			const FORBIDDEN_TAG_NAMES = ${JSON.stringify(FORBIDDEN_TAG_NAMES)};
			const NOTE_TAGNAME = ${JSON.stringify(NOTE_TAGNAME)};
			const NOTE_CLASS = ${JSON.stringify(NOTE_CLASS)};
			const NOTE_ANCHORED_CLASS = ${JSON.stringify(NOTE_ANCHORED_CLASS)};
			const NOTE_SELECTED_CLASS = ${JSON.stringify(NOTE_SELECTED_CLASS)};
			const NOTE_MOVING_CLASS = ${JSON.stringify(NOTE_MOVING_CLASS)};
			const NOTE_MASK_MOVING_CLASS = ${JSON.stringify(NOTE_MASK_MOVING_CLASS)};
			const MASK_CLASS = ${JSON.stringify(MASK_CLASS)};
			const HIGHLIGHT_CLASS = ${JSON.stringify(HIGHLIGHT_CLASS)};
			const NOTES_WEB_STYLESHEET = ${JSON.stringify(NOTES_WEB_STYLESHEET)};
			const MASK_WEB_STYLESHEET = ${JSON.stringify(MASK_WEB_STYLESHEET)};
			const NOTE_HEADER_HEIGHT = ${JSON.stringify(NOTE_HEADER_HEIGHT)};
			const PAGE_MASK_ACTIVE_CLASS = ${JSON.stringify(PAGE_MASK_ACTIVE_CLASS)};
			const REMOVED_CONTENT_CLASS = ${JSON.stringify(REMOVED_CONTENT_CLASS)};
			const reflowNotes = ${minifyText(reflowNotes.toString())};			
			const addNoteRef = ${minifyText(addNoteRef.toString())};
			const deleteNoteRef = ${minifyText(deleteNoteRef.toString())};
			const getNoteRefs = ${minifyText(getNoteRefs.toString())};
			const setNoteRefs = ${minifyText(setNoteRefs.toString())};
			const getAnchorElement = ${minifyText(getAnchorElement.toString())};
			const getMaskElement = ${minifyText(getMaskElement.toString())};
			const getStyleElement = ${minifyText(getStyleElement.toString())};
			const attachNoteListeners = ${minifyText(attachNoteListeners.toString())};
			const anchorNote = ${minifyText(anchorNote.toString())};
			const getPosition = ${minifyText(getPosition.toString())};
			const onMouseUp = ${minifyText(onMouseUp.toString())};
			const getShadowRoot = ${minifyText(getShadowRoot.toString())};
			const waitResourcesLoad = ${minifyText(waitResourcesLoad.toString())};
			const maskNoteElement = getMaskElement(${JSON.stringify(NOTE_MASK_CLASS)});
			const maskPageElement = getMaskElement(${JSON.stringify(PAGE_MASK_CLASS)}, ${JSON.stringify(PAGE_MASK_CONTAINER_CLASS)});
			let selectedNote, highlightSelectionMode, removeHighlightMode, resizingNoteMode, movingNoteMode, collapseNoteTimeout, cuttingMode, cuttingOuterMode;
			window.onresize = reflowNotes;
			window.onUpdate = () => {};
			document.documentElement.onmouseup = document.documentElement.ontouchend = onMouseUp;
			processNode(document);
			reflowNotes();
			document.querySelectorAll(${JSON.stringify(NOTE_TAGNAME)}).forEach(noteElement => attachNoteListeners(noteElement));
			if (document.documentElement.dataset && document.documentElement.dataset.sfz !== undefined) {
				waitResourcesLoad().then(reflowNotes);
			}
		})()`);
	}

	function getStyleElement(stylesheet) {
		const linkElement = document.createElement("style");
		linkElement.textContent = stylesheet;
		return linkElement;
	}

	function getAnchorElement(containerElement) {
		return document.querySelector("[data-single-file-note-refs~=\"" + containerElement.dataset.noteId + "\"]") || document.documentElement;
	}

	function addNoteRef(anchorElement, noteId) {
		const noteRefs = getNoteRefs(anchorElement);
		noteRefs.push(noteId);
		setNoteRefs(anchorElement, noteRefs);
	}

	function deleteNoteRef(containerElement, noteId) {
		const anchorElement = getAnchorElement(containerElement);
		const noteRefs = getNoteRefs(anchorElement).filter(noteRefs => noteRefs != noteId);
		if (noteRefs.length) {
			setNoteRefs(anchorElement, noteRefs);
		} else {
			delete anchorElement.dataset.singleFileNoteRefs;
		}
	}

	function getNoteRefs(anchorElement) {
		return anchorElement.dataset.singleFileNoteRefs ? anchorElement.dataset.singleFileNoteRefs.split(" ") : [];
	}

	function setNoteRefs(anchorElement, noteRefs) {
		anchorElement.dataset.singleFileNoteRefs = noteRefs.join(" ");
	}

	function minifyText(text) {
		return text.replace(/[\n\t\s]+/g, " ");
	}

	function isAncestor(element, otherElement) {
		return otherElement.parentElement && (element == otherElement.parentElement || isAncestor(element, otherElement.parentElement));
	}

	function getShadowRoot(element) {
		const chrome = window.chrome;
		if (element.openOrClosedShadowRoot) {
			return element.openOrClosedShadowRoot;
		} else if (chrome && chrome.dom && chrome.dom.openOrClosedShadowRoot) {
			try {
				return chrome.dom.openOrClosedShadowRoot(element);
				/* eslint-disable-next-line no-unused-vars */
			} catch (error) {
				return element.shadowRoot;
			}
		} else {
			return element.shadowRoot;
		}
	}

	function detectSavedPage(document) {
		const firstDocumentChild = document.documentElement.firstChild;
		return firstDocumentChild.nodeType == Node.COMMENT_NODE &&
			(firstDocumentChild.textContent.includes(COMMENT_HEADER) || firstDocumentChild.textContent.includes(COMMENT_HEADER_LEGACY));
	}

})(typeof globalThis == "object" ? globalThis : window);