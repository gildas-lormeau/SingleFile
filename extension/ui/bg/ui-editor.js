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

/* global browser, singlefile, window, document, prompt */

singlefile.extension.ui.bg.editor = (() => {

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
	const cutPageButton = document.querySelector(".cut-page-button");
	const undoCutPageButton = document.querySelector(".undo-cut-page-button");
	const undoAllCutPageButton = document.querySelector(".undo-all-cut-page-button");
	const redoCutPageButton = document.querySelector(".redo-cut-page-button");
	const savePageButton = document.querySelector(".save-page-button");

	let tabData, tabDataContents = [];

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
	cutPageButton.title = browser.i18n.getMessage("editorCutPage");
	undoCutPageButton.title = browser.i18n.getMessage("editorUndoCutPage");
	undoAllCutPageButton.title = browser.i18n.getMessage("editorUndoAllCutPage");
	redoCutPageButton.title = browser.i18n.getMessage("editorRedoCutPage");
	savePageButton.title = browser.i18n.getMessage("editorSavePage");

	addYellowNoteButton.onclick = () => editorElement.contentWindow.postMessage(JSON.stringify({ method: "addNote", color: "note-yellow" }), "*");
	addPinkNoteButton.onclick = () => editorElement.contentWindow.postMessage(JSON.stringify({ method: "addNote", color: "note-pink" }), "*");
	addBlueNoteButton.onclick = () => editorElement.contentWindow.postMessage(JSON.stringify({ method: "addNote", color: "note-blue" }), "*");
	addGreenNoteButton.onclick = () => editorElement.contentWindow.postMessage(JSON.stringify({ method: "addNote", color: "note-green" }), "*");
	highlightButtons.forEach(highlightButton => {
		highlightButton.onclick = () => {
			if (!toolbarElement.classList.contains("cut-mode") && !toolbarElement.classList.contains("remove-highlight-mode")) {
				const disabled = highlightButton.classList.contains("highlight-disabled");
				resetHighlightButtons();
				if (disabled) {
					highlightButton.classList.remove("highlight-disabled");
					editorElement.contentWindow.postMessage(JSON.stringify({ method: "enableHighlight", color: "single-file-highlight-" + highlightButton.dataset.color }), "*");
				} else {
					highlightButton.classList.add("highlight-disabled");
				}
			}
		};
	});
	toggleNotesButton.onclick = () => {
		if (toggleNotesButton.getAttribute("src") == "/extension/ui/resources/button_note_visible.png") {
			toggleNotesButton.src = "/extension/ui/resources/button_note_hidden.png";
			editorElement.contentWindow.postMessage(JSON.stringify({ method: "hideNotes" }), "*");
		} else {
			toggleNotesButton.src = "/extension/ui/resources/button_note_visible.png";
			editorElement.contentWindow.postMessage(JSON.stringify({ method: "displayNotes" }), "*");
		}
	};
	toggleHighlightsButton.onclick = () => {
		if (toggleHighlightsButton.getAttribute("src") == "/extension/ui/resources/button_highlighter_visible.png") {
			toggleHighlightsButton.src = "/extension/ui/resources/button_highlighter_hidden.png";
			editorElement.contentWindow.postMessage(JSON.stringify({ method: "hideHighlights" }), "*");
		} else {
			displayHighlights();
		}
	};
	removeHighlightButton.onclick = () => {
		if (!toolbarElement.classList.contains("cut-mode")) {
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
		}
	};
	editPageButton.onclick = () => {
		if (editPageButton.classList.contains("edit-disabled")) {
			editPageButton.classList.remove("edit-disabled");
			editorElement.contentWindow.postMessage(JSON.stringify({ method: "enableEditPage" }), "*");
		} else {
			editPageButton.classList.add("edit-disabled");
			editorElement.contentWindow.postMessage(JSON.stringify({ method: "disableEditPage" }), "*");
		}
	};
	formatPageButton.onclick = () => {
		if (formatPageButton.classList.contains("format-disabled")) {
			formatPageButton.classList.remove("format-disabled");
			updatedResources = {};
			editorElement.contentWindow.postMessage(JSON.stringify({ method: tabData.options.applySystemTheme ? "formatPage" : "formatPageNoTheme" }), "*");
		}
	};
	cutPageButton.onclick = () => {
		if (cutPageButton.classList.contains("cut-disabled")) {
			cutPageButton.classList.remove("cut-disabled");
			toolbarElement.classList.add("cut-mode");
			resetHighlightButtons();
			disableRemoveHighlights();
			editorElement.contentWindow.postMessage(JSON.stringify({ method: "enableCutPage" }), "*");
			editorElement.contentWindow.focus();
		} else {
			cutPageButton.classList.add("cut-disabled");
			toolbarElement.classList.remove("cut-mode");
			editorElement.contentWindow.postMessage(JSON.stringify({ method: "disableCutPage" }), "*");
		}
	};
	undoCutPageButton.onclick = () => {
		editorElement.contentWindow.postMessage(JSON.stringify({ method: "undoCutPage" }), "*");
		editorElement.contentWindow.focus();
	};
	undoAllCutPageButton.onclick = () => {
		editorElement.contentWindow.postMessage(JSON.stringify({ method: "undoAllCutPage" }), "*");
		editorElement.contentWindow.focus();
	};
	redoCutPageButton.onclick = () => {
		editorElement.contentWindow.postMessage(JSON.stringify({ method: "redoCutPage" }), "*");
		editorElement.contentWindow.focus();
	};
	savePageButton.onclick = () => {
		savePage();
	};
	let updatedResources = {};

	window.onmessage = event => {
		const message = JSON.parse(event.data);
		if (message.method == "setMetadata") {
			document.title = "[SingleFile] " + message.title;
			if (message.icon) {
				const linkElement = document.createElement("link");
				linkElement.rel = "icon";
				linkElement.href = message.icon;
				document.head.appendChild(linkElement);
			}
		}
		if (message.method == "setContent") {
			const pageData = {
				content: message.content,
				filename: tabData.filename
			};
			tabData.options.openEditor = false;
			singlefile.extension.core.content.download.downloadPage(pageData, tabData.options);
		}
		if (message.method == "disableFormatPage") {
			formatPageButton.remove();
		}
		if (message.method == "onUpdate") {
			tabData.docSaved = message.saved;
		}
	};

	window.onload = () => {
		browser.runtime.sendMessage({ method: "editor.getTabData" });
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
			if (message.method == "common.promptValueRequest") {
				browser.runtime.sendMessage({ method: "tabs.promptValueResponse", value: prompt(message.promptMessage) });
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
					tabData.docSaved = true;
					tabDataContents = [];
					editorElement.contentWindow.postMessage(JSON.stringify({ method: "init", content: tabData.content }), "*");
					delete tabData.content;
				}
				return Promise.resolve({});
			}
		});
	};

	window.onbeforeunload = event => {
		if (tabData.options.warnUnsavedPage && !tabData.docSaved) {
			event.preventDefault();
			event.returnValue = "";
		}
	};

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
		toggleHighlightsButton.src = "/extension/ui/resources/button_highlighter_visible.png";
		editorElement.contentWindow.postMessage(JSON.stringify({ method: "displayHighlights" }), "*");
	}

	function savePage() {
		editorElement.contentWindow.postMessage(JSON.stringify({ method: "getContent", compressHTML: tabData.options.compressHTML, updatedResources }), "*");
	}

	return {};

})();
