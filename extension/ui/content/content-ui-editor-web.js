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

/* global singlefile, window, document, fetch, DOMParser, getComputedStyle, setTimeout, clearTimeout */

(async () => {

	const FORBIDDEN_TAG_NAMES = ["a", "area", "audio", "base", "br", "col", "command", "embed", "hr", "img", "iframe", "input", "keygen", "link", "meta", "param", "source", "track", "video", "wbr"];
	const BUTTON_ANCHOR_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAAmJLR0QA/4ePzL8AAAAJcEhZcwAADsQAAA7EAZUrDhsAAAAHdElNRQfjCh0VAjZTpsLvAAAA1klEQVQoz3XQMS8EURQF4O9txN9QSCjoNYRiy01EomDb3UbnR+j8BpSKrbaaQvwAyTZ2Qyg0WiwJiZjmKmasmWTnvObe8849971DFSe+/TjVgL6wpyMczxcMXYIzV/9kqyIY27Vsyb5J05KREMa1sQoS3r2W1Vxkcrms6Tph6q3usFARBJJUVjPBgZ6Je49u5ELCog0r1qy7YFMI4RxMfZRZFOxOa/bn28oi8rK7K6hrITw48uVT37MQBn9vOcS2l9K0OE9W0atHsqWtIwxlRk1ZdHXrxC+ueUcydrdI6QAAAABJRU5ErkJggg==";
	const BUTTON_CLOSE_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4wodFQUaLj84ywAAANxJREFUOMuN08tKAzEUgOGPSrU6fTL3PpuuperCSr22OFX0hQSXYkfHzRkIcW4Hskg4/5/kJAf2cIZ77BuOORa4aBZOUcfYDEjmuIncXSO5SwQ11h2SIoFrVHgRyU8Dkjb4GdMmoU9SYJnBZQqnknUmKXE1Bu6T1EnRtn1wKikz+AfvbfCkRTDFR7ZW47Mj/99TLbOdq2T+iNlYeBfHvs2u89AmKXCdVbsp2EHsnEsO0+/ZBTcx65OcD8Bdkl+sJtGNVRTsDcdx/zy+cBL/BL5DBC7xOrKdj6L1V/AHRf5yO+i79cQAAAAASUVORK5CYII=";
	const SHADOW_MODE_ATTRIBUTE_NAME = "shadowmode";
	const SHADOW_DELEGATE_FOCUS_ATTRIBUTE_NAME = "delegatesfocus";
	const SCRIPT_TEMPLATE_SHADOW_ROOT = "data-template-shadow-root";
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
	const HIGHLIGHT_HIDDEN_CLASS = "single-file-highlight-hidden";
	const PAGE_MASK_ACTIVE_CLASS = "page-mask-active";
	const NOTE_INITIAL_POSITION_X = 20;
	const NOTE_INITIAL_POSITION_Y = 20;
	const NOTE_INITIAL_WIDTH = 150;
	const NOTE_INITIAL_HEIGHT = 150;
	const NOTE_HEADER_HEIGHT = 25;
	const DISABLED_NOSCRIPT_ATTRIBUTE_NAME = "data-single-file-disabled-noscript";

	let NOTES_WEB_STYLESHEET, MASK_WEB_STYLESHEET, HIGHLIGHTS_WEB_STYLESHEET;
	let selectedNote, anchorElement, maskNoteElement, maskPageElement, highlightSelectionMode, removeHighlightMode, resizingNoteMode, movingNoteMode, highlightColor, collapseNoteTimeout, cuttingMode;

	window.onmessage = async event => {
		const message = JSON.parse(event.data);
		if (message.method == "init") {
			await initConstants();
			const contentDocument = (new DOMParser()).parseFromString(message.content, "text/html");
			if (contentDocument.doctype) {
				if (document.doctype) {
					document.replaceChild(contentDocument.doctype, document.doctype);
				} else {
					document.insertBefore(contentDocument.doctype, document.documentElement);
				}
			} else {
				document.doctype.remove();
			}
			contentDocument.querySelectorAll("noscript").forEach(element => {
				element.setAttribute(DISABLED_NOSCRIPT_ATTRIBUTE_NAME, element.innerHTML);
				element.textContent = "";
			});
			document.replaceChild(contentDocument.documentElement, document.documentElement);
			deserializeShadowRoots(document);
			window.parent.postMessage(JSON.stringify({ "method": "setMetadata", title: document.title, icon: document.querySelector("link[rel*=icon]").href }), "*");
			document.querySelectorAll(NOTE_TAGNAME).forEach(containerElement => attachNoteListeners(containerElement, true));
			document.documentElement.appendChild(getStyleElement(HIGHLIGHTS_WEB_STYLESHEET));
			maskPageElement = getMaskElement(PAGE_MASK_CLASS, PAGE_MASK_CONTAINER_CLASS);
			maskNoteElement = getMaskElement(NOTE_MASK_CLASS);
			document.documentElement.onmouseup = document.documentElement.ontouchend = onMouseUp;
			window.onclick = event => event.preventDefault();
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
			highlightColor = message.color;
			highlightSelectionMode = true;
		}
		if (message.method == "disableHighlight") {
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
		}
		if (message.method == "disableRemoveHighlights") {
			removeHighlightMode = false;
		}
		if (message.method == "enableEditPage") {
			document.body.contentEditable = true;
		}
		if (message.method == "disableEditPage") {
			document.body.contentEditable = false;
		}
		if (message.method == "enableCutPage") {
			cuttingMode = true;
			document.body.addEventListener ("mouseover", cutter);
			document.body.addEventListener ("mouseout", cutter);
		}
		if (message.method == "disableCutPage" ) {
			cuttingMode = false;
			document.body.removeEventListener ("mouseover", cutter);
			document.body.removeEventListener ("mouseout", cutter);
		}
		if (message.method == "getContent") {
			serializeShadowRoots(document);
			const doc = document.cloneNode(true);
			deserializeShadowRoots(document);
			doc.querySelectorAll("[" + DISABLED_NOSCRIPT_ATTRIBUTE_NAME + "]").forEach(element => {
				element.textContent = element.getAttribute(DISABLED_NOSCRIPT_ATTRIBUTE_NAME);
				element.removeAttribute(DISABLED_NOSCRIPT_ATTRIBUTE_NAME);
			});
			doc.querySelectorAll("." + MASK_CLASS).forEach(maskElement => maskElement.remove());
			doc.querySelectorAll("." + HIGHLIGHT_CLASS).forEach(noteElement => noteElement.classList.remove(HIGHLIGHT_HIDDEN_CLASS));
			doc.querySelectorAll(`template[${SHADOW_MODE_ATTRIBUTE_NAME}]`).forEach(templateElement => {
				const noteElement = templateElement.querySelector("." + NOTE_CLASS);
				if (noteElement) {
					noteElement.classList.remove(NOTE_HIDDEN_CLASS);
				}
				const mainElement = templateElement.querySelector("textarea");
				if (mainElement) {
					mainElement.textContent = mainElement.value;
				}
			});
			delete doc.body.contentEditable;
			const scriptElement = doc.createElement("script");
			scriptElement.setAttribute(SCRIPT_TEMPLATE_SHADOW_ROOT, "");
			scriptElement.textContent = getEmbedScript();
			doc.body.appendChild(scriptElement);
			window.parent.postMessage(JSON.stringify({ "method": "setContent", content: singlefile.lib.modules.serializer.process(doc, message.compressHTML) }), "*");
		}
	};
	window.onresize = reflowNotes;

	async function initConstants() {
		[NOTES_WEB_STYLESHEET, MASK_WEB_STYLESHEET, HIGHLIGHTS_WEB_STYLESHEET] = await Promise.all([
			minifyText(await ((await fetch("editor-note-web.css")).text())),
			minifyText(await ((await fetch("editor-mask-web.css")).text())),
			minifyText(await ((await fetch("editor-frame-web.css")).text()))
		]);
	}

	function addNote({ color }) {
		const containerElement = document.createElement(NOTE_TAGNAME);
		const noteElement = document.createElement("div");
		const headerElement = document.createElement("header");
		const mainElement = document.createElement("textarea");
		const resizeElement = document.createElement("div");
		const removeNoteElement = document.createElement("img");
		const anchorIconElement = document.createElement("img");
		const noteShadow = containerElement.attachShadow({ mode: "open" });
		headerElement.appendChild(anchorIconElement);
		headerElement.appendChild(removeNoteElement);
		noteElement.appendChild(headerElement);
		noteElement.appendChild(mainElement);
		noteElement.appendChild(resizeElement);
		noteShadow.appendChild(getStyleElement(NOTES_WEB_STYLESHEET));
		noteShadow.appendChild(noteElement);
		const notesElements = Array.from(document.querySelectorAll(NOTE_TAGNAME));
		const noteId = Math.max.call(Math, 0, ...notesElements.map(noteElement => Number(noteElement.dataset.noteId))) + 1;
		noteElement.classList.add(NOTE_CLASS);
		noteElement.classList.add(NOTE_ANCHORED_CLASS);
		noteElement.classList.add(color);
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
	}

	function cutter (e) {
		if (e.type === 'mouseover' || e.type === 'mouseout') {
			e.target.classList.toggle ("single-file-hover");
		}
		e.stopPropagation();
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
				collapseNoteTimeout = setTimeout(() => noteElement.classList.toggle("note-collapsed"), COLLAPSING_NOTE_DELAY);
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
				maskNoteElement.classList.remove(NOTE_MASK_MOVING_CLASS);
			} else {
				const boundingRectAnchor = anchorElement.getBoundingClientRect();
				maskNoteElement.classList.add(NOTE_MASK_MOVING_CLASS);
				maskNoteElement.style.setProperty("top", boundingRectAnchor.y + "px");
				maskNoteElement.style.setProperty("left", boundingRectAnchor.x + "px");
				maskNoteElement.style.setProperty("width", boundingRectAnchor.width + "px");
				maskNoteElement.style.setProperty("height", boundingRectAnchor.height + "px");
			}
		}

		function selectNote(noteElement) {
			if (selectedNote) {
				selectedNote.classList.remove(NOTE_SELECTED_CLASS);
			}
			noteElement.classList.add(NOTE_SELECTED_CLASS);
			selectedNote = noteElement;
		}

		function getTarget(clientX, clientY) {
			const targets = Array.from(document.elementsFromPoint(clientX, clientY)).filter(element => element.tagName.toLowerCase() != NOTE_TAGNAME && !element.classList.contains(MASK_CLASS));
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

	function onMouseUp(event) {
		if (highlightSelectionMode) {
			highlightSelection();
		}
		if (removeHighlightMode) {
			let element = event.target, done;
			while (element && !done) {
				if (element.classList.contains(HIGHLIGHT_CLASS)) {
					document.querySelectorAll("." + HIGHLIGHT_CLASS + "[data-singlefile-highlight-id=" + JSON.stringify(element.dataset.singlefileHighlightId) + "]").forEach(highlightedElement => {
						resetHighlightedElement(highlightedElement);
					});
					done = true;
				}
				element = element.parentElement;
			}
		}
		if (resizingNoteMode) {
			resizingNoteMode = false;
			document.documentElement.style.removeProperty("user-select");
			maskPageElement.classList.remove(PAGE_MASK_ACTIVE_CLASS);
			document.documentElement.ontouchmove = document.documentElement.onmousemove = null;
		}
		if (movingNoteMode) {
			anchorNote(movingNoteMode.event || event, selectedNote, movingNoteMode.deltaX, movingNoteMode.deltaY);
			movingNoteMode = null;
			document.documentElement.ontouchmove = document.documentElement.onmousemove = null;
		}
		if (collapseNoteTimeout) {
			clearTimeout(collapseNoteTimeout);
			collapseNoteTimeout = null;
		}
		if (cuttingMode) {
			let element = event.target;
			element.classList.add ("single-file-removed");
		}
	}

	function anchorNote(event, noteElement, deltaX, deltaY) {
		event.preventDefault();
		const { clientX, clientY } = getPosition(event);
		document.documentElement.style.removeProperty("user-select");
		noteElement.classList.remove(NOTE_MOVING_CLASS);
		maskNoteElement.classList.remove(NOTE_MASK_MOVING_CLASS);
		maskPageElement.classList.remove(PAGE_MASK_ACTIVE_CLASS);
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
			document.documentElement.insertBefore(containerElement, firstMaskElement);
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
		for (let indexRange = 0; indexRange < selection.rangeCount; indexRange++) {
			const range = selection.getRangeAt(indexRange);
			if (!range.collapsed) {
				const contents = range.extractContents();
				highlightChildNodes(contents);
				range.insertNode(contents);
				range.collapse();
			}
		}

		function highlightChildNodes(node) {
			if (node.childNodes.length) {
				node.childNodes.forEach(childNode => {
					if (childNode.classList) {
						resetHighlightedElement(childNode);
						if (Array.from(childNode.childNodes).find(childNode => childNode.classList)) {
							highlightChildNodes(childNode);
						} else {
							childNode.classList.add(HIGHLIGHT_CLASS);
							childNode.classList.add(highlightColor);
							childNode.dataset.singlefileHighlightId = highlightId;
						}
					} else {
						highlightChildNodes(childNode);
					}
				});
			} else if (node.textContent) {
				const spanElement = document.createElement("span");
				spanElement.classList.add(HIGHLIGHT_CLASS);
				spanElement.classList.add(highlightColor);
				spanElement.textContent = node.textContent;
				spanElement.dataset.singlefileHighlightId = highlightId;
				node.parentNode.replaceChild(spanElement, node);
			}
		}
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
			if (element.shadowRoot) {
				serializeShadowRoots(element.shadowRoot);
				const templateElement = document.createElement("template");
				templateElement.setAttribute(SHADOW_MODE_ATTRIBUTE_NAME, "open");
				templateElement.appendChild(element.shadowRoot);
				element.appendChild(templateElement);
			}
		});
	}

	function deserializeShadowRoots(node) {
		node.querySelectorAll(`template[${SHADOW_MODE_ATTRIBUTE_NAME}]`).forEach(element => {
			let shadowRoot = element.parentElement.shadowRoot;
			if (shadowRoot) {
				Array.from(element.childNodes).forEach(node => shadowRoot.appendChild(node));
				element.remove();
			} else {
				shadowRoot = element.parentElement.attachShadow({ mode: "open" });
				const contentDocument = (new DOMParser()).parseFromString(element.innerHTML, "text/html");
				Array.from(contentDocument.head.childNodes).forEach(node => shadowRoot.appendChild(node));
				Array.from(contentDocument.body.childNodes).forEach(node => shadowRoot.appendChild(node));
			}
			deserializeShadowRoots(shadowRoot);
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

	function getEmbedScript() {
		return minifyText(`(() => {
			document.currentScript.remove();
			const processNode = node => {
				node.querySelectorAll("template[${SHADOW_MODE_ATTRIBUTE_NAME}]").forEach(element=>{
					if (!element.parentElement.shadowRoot) {
						const shadowRoot = element.parentElement.attachShadow({mode:element.getAttribute("${SHADOW_MODE_ATTRIBUTE_NAME}"),delegatesFocus:Boolean(element.getAttribute("${SHADOW_DELEGATE_FOCUS_ATTRIBUTE_NAME}"))});
						shadowRoot.innerHTML = element.innerHTML;
						element.remove();
						processNode(shadowRoot);
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
			const maskNoteElement = getMaskElement(${JSON.stringify(NOTE_MASK_CLASS)});
			const maskPageElement = getMaskElement(${JSON.stringify(PAGE_MASK_CLASS)}, ${JSON.stringify(PAGE_MASK_CONTAINER_CLASS)});
			let selectedNote, highlightSelectionMode, removeHighlightMode, resizingNoteMode, movingNoteMode, collapseNoteTimeout;
			window.onresize = reflowNotes;
			document.documentElement.onmouseup = document.documentElement.ontouchend = onMouseUp;
			window.addEventListener("DOMContentLoaded", () => {
				processNode(document);
				reflowNotes();
				document.querySelectorAll(${JSON.stringify(NOTE_TAGNAME)}).forEach(noteElement => attachNoteListeners(noteElement));
			});
		})()`);
	}

	function getStyleElement(stylesheet) {
		const linkElement = document.createElement("style");
		linkElement.textContent = stylesheet;
		return linkElement;
	}

	function getAnchorElement(containerElement) {
		return document.querySelector("[data-single-file-note-refs^=" + JSON.stringify(containerElement.dataset.noteId) + "], [data-single-file-note-refs$=" + JSON.stringify(containerElement.dataset.noteId) + "], [data-single-file-note-refs*=" + JSON.stringify("," + containerElement.dataset.noteId + ",") + "]");
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
		return JSON.parse("[" + (anchorElement.dataset.singleFileNoteRefs || "") + "]");
	}

	function setNoteRefs(anchorElement, noteRefs) {
		anchorElement.dataset.singleFileNoteRefs = noteRefs.toString();
	}

	function minifyText(text) {
		return text.replace(/[\n\t\s]+/g, " ");
	}

})();