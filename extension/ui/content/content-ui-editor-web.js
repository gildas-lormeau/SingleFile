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

/* global singlefile, window, document, fetch, DOMParser, getComputedStyle, setTimeout, clearTimeout, NodeFilter, Readability, isProbablyReaderable, matchMedia */

(() => {

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
	const REMOVED_CONTENT_CLASS = "single-file-removed";
	const HIGHLIGHT_HIDDEN_CLASS = "single-file-highlight-hidden";
	const PAGE_MASK_ACTIVE_CLASS = "page-mask-active";
	const CUT_HOVER_CLASS = "single-file-cut-hover";
	const CUT_OUTER_HOVER_CLASS = "single-file-cut-outer-hover";
	const CUT_SELECTED_CLASS = "single-file-cut-selected";
	const CUT_OUTER_SELECTED_CLASS = "single-file-cut-outer-selected";
	const NOTE_INITIAL_POSITION_X = 20;
	const NOTE_INITIAL_POSITION_Y = 20;
	const NOTE_INITIAL_WIDTH = 150;
	const NOTE_INITIAL_HEIGHT = 150;
	const NOTE_HEADER_HEIGHT = 25;
	const DISABLED_NOSCRIPT_ATTRIBUTE_NAME = "data-single-file-disabled-noscript";

	const STYLE_FORMATTED_PAGE = `
	/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* Avoid adding ID selector rules in this style sheet, since they could
 * inadvertently match elements in the article content. */
:root {
   --close-button-hover: #d94141;
}
body {
  --toolbar-bgcolor: #fbfbfb;
  --toolbar-border: #b5b5b5;
  --toolbar-hover: #ebebeb;
  --popup-bgcolor: #fbfbfb;
  --popup-border: #b5b5b5;
  --font-color: #4c4c4c;
  --icon-fill: #808080;
  /* light colours */
}

body.dark {
  --toolbar-bgcolor: #2a2a2d;
  --toolbar-border: #4B4A50;
  --toolbar-hover: #737373;
  --popup-bgcolor: #4b4a50;
  --popup-border: #65646a;
  --font-color: #fff;
  --icon-fill: #fff;
  /* dark colours */
}

body {
  padding: 64px 51px;
}

body.loaded {
  transition: color 0.4s, background-color 0.4s;
}

body.light {
  color: #333333;
  background-color: #ffffff;
}

body.dark {
  color: #eeeeee;
  background-color: #333333;
}

body.dark *::-moz-selection {
  background-color: #FFFFFF;
  color: #0095DD;
}
body.dark a::-moz-selection {
  color: #DD4800;
}

body.sepia {
  color: #5b4636;
  background-color: #f4ecd8;
}

body.sans-serif,
body.sans-serif .remove-button {
  font-family: Helvetica, Arial, sans-serif;
}

body.serif,
body.serif .remove-button  {
  font-family: Georgia, "Times New Roman", serif;
}

.container {
  --font-size: 12;
  max-width: 30em;
  margin: 0 auto;
  font-size: var(--font-size);
}

.container.content-width1 {
  max-width: 20em;
}

.container.content-width2 {
  max-width: 25em;
}

.container.content-width3 {
  max-width: 30em;
}

.container.content-width4  {
  max-width: 35em;
}

.container.content-width5 {
  max-width: 40em;
}

.container.content-width6 {
  max-width: 45em;
}

.container.content-width7 {
  max-width: 50em;
}

.container.content-width8 {
  max-width: 55em;
}

.container.content-width9 {
  max-width: 60em;
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

body.sepia > .container > .footer {
  background-color: #dedad4 !important;
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

/* Add toolbar transition base on loaded class  */

body.loaded .toolbar {
  transition: transform 0.3s ease-out;
}

body:not(.loaded) .toolbar:-moz-locale-dir(ltr) {
  transform: translateX(-100%);
}

body:not(.loaded) .toolbar:-moz-locale-dir(rtl) {
  transform: translateX(100%);
}

.light-button {
  color: #333333;
  background-color: #ffffff;
}

.dark-button {
  color: #eeeeee;
  background-color: #333333;
}

.sepia-button {
  color: #5b4636;
  background-color: #f4ecd8;
}

.sans-serif-button {
  font-family: Helvetica, Arial, sans-serif;
}

.serif-button {
  font-family: Georgia, "Times New Roman", serif;
}

/* Loading/error message */

.reader-message {
  margin-top: 40px;
  display: none;
  text-align: center;
  width: 100%;
  font-size: 0.9em;
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
  color: #0095dd;
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
  margin: 0 0 10px 0;
  padding: 0;
  font-style: italic;
}

.header > .meta-data {
  font-size: 0.65em;
  margin: 0 0 15px 0;
}

/*======= Controls toolbar =======*/

.toolbar {
  font-family: Helvetica, Arial, sans-serif;
  position: fixed;
  height: 100%;
  top: 0;
  left: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  background-color:  var(--toolbar-bgcolor);
  -moz-user-select: none;
  border-right: 1px solid  var(--toolbar-border);
  z-index: 1;
}

.button {
  display: block;
  background-size: 24px 24px;
  background-repeat: no-repeat;
  color: #333;
  background-color: var(--toolbar-bgcolor);
  height: 40px;
  padding: 0;
}

button {
  -moz-context-properties: fill;
  color: var(--font-color);
  fill: var(--icon-fill);
}

.toolbar .button {
  width: 40px;
  background-position: center;
  margin-right: -1px;
  border-top: 0;
  border-left: 0;
  border-right: 1px solid var(--toolbar-border);
  border-bottom: 1px solid var(--toolbar-border);
  background-color:  var(--toolbar-bgcolor);
}

.button[hidden] {
  display: none;
}

.dropdown {
  text-align: center;
  list-style: none;
  margin: 0;
  padding: 0;
}

.dropdown li {
  margin: 0;
  padding: 0;
}

/*======= Popup =======*/

.dropdown-popup {
  min-width: 300px;
  text-align: start;
  position: absolute;
  left: 48px; /* offset to account for toolbar width */
  z-index: 1000;
  background-color: var(--popup-bgcolor);
  visibility: hidden;
  border-radius: 4px;
  border: 1px solid var(--popup-border);
  border-bottom-width: 0;
  box-shadow: 0 1px 3px #c1c1c1;
}

.keep-open .dropdown-popup {
  z-index: initial;
}

.dropdown-popup > hr {
  display: none;
}

.open > .dropdown-popup {
  visibility: visible;
}

.dropdown-arrow {
  position: absolute;
  top: 30px; /* offset arrow from top of popup */
  left: -16px;
  width: 16px;
  height: 24px;
  background-image: url("chrome://global/skin/reader/RM-Type-Controls-Arrow.svg");
  display: block;
  -moz-context-properties:  fill, stroke;
  fill: var(--popup-bgcolor);
  stroke: var(--popup-border);
}


/*======= Font style popup =======*/

.font-type-buttons,
.font-size-buttons,
.color-scheme-buttons,
.content-width-buttons,
.line-height-buttons {
  display: flex;
  flex-direction: row;
}

.font-type-buttons > button:first-child {
  border-top-left-radius: 3px;
}
.font-type-buttons > button:last-child {
  border-top-right-radius: 3px;
}
.color-scheme-buttons > button:first-child {
  border-bottom-left-radius: 3px;
}
.color-scheme-buttons > button:last-child {
  border-bottom-right-radius: 3px;
}

.font-type-buttons > button,
.font-size-buttons > button,
.color-scheme-buttons > button,
.content-width-buttons > button,
.line-height-buttons > button {
  text-align: center;
  border: 0;
}

.font-type-buttons > button,
.font-size-buttons > button,
.content-width-buttons > button,
.line-height-buttons > button {
  width: 50%;
  background-color: transparent;
  border-left: 1px solid var(--popup-border);
  border-bottom: 1px solid var(--popup-border);
}

.color-scheme-buttons > button {
  width: 33.33%;
  font-size: 14px;
}

.color-scheme-buttons > .dark-button {
  margin-top: -1px;
  height: 61px;
}

.font-type-buttons > button:first-child,
.font-size-buttons > button:first-child,
.content-width-buttons > button:first-child,
.line-height-buttons > button:first-child {
  border-left: 0;
}

.font-type-buttons > button {
  display: inline-block;
  font-size: 62px;
  height: 100px;
}

.font-size-buttons > button,
.color-scheme-buttons > button,
.content-width-buttons > button,
.line-height-buttons > button {
  height: 60px;
}

.font-type-buttons > button:active:hover,
.font-type-buttons > button.selected,
.color-scheme-buttons > button:active:hover,
.color-scheme-buttons > button.selected {
  box-shadow: inset 0 -3px 0 0 #fc6420;
}

.font-type-buttons > button:active:hover,
.font-type-buttons > button.selected {
  border-bottom: 1px solid #FC6420;
}

/* Make the serif button content the same size as the sans-serif button content. */
.font-type-buttons > button > .description {
  font-size: 12px;
  margin-top: -5px;
}

/* Font sizes are different per-platform, so we need custom CSS to line them up. */
.font-type-buttons > .sans-serif-button > .name {
  margin-top: 2px;
}

.font-type-buttons > .sans-serif-button > .description {
  margin-top: -4px;
}

.font-type-buttons > .serif-button > .name {
  font-size: 63px;
}

.button:hover,
.font-size-buttons > button:hover,
.font-type-buttons > button:hover,
.content-width-buttons > button:hover,
.line-height-buttons > button:hover {
  background-color: var(--toolbar-hover);
}

.dropdown.open,
.button:active,
.font-size-buttons > button:active,
.font-size-buttons > button.selected,
.content-width-buttons > button:active,
.content-width-buttons > button.selected,
.line-height-buttons > button:active,
.line-height-buttons > button.selected {
  background-color: #dadada;
}

/* Only used on Android */
.font-size-sample {
  display: none;
}

.minus-button,
.plus-button,
.content-width-minus-button,
.content-width-plus-button,
.line-height-minus-button,
.line-height-plus-button {
  background-color: transparent;
  border: 0;
  background-size: 18px 18px;
  background-repeat: no-repeat;
  background-position: center;
}

/*======= Toolbar icons =======*/

.close-button {
  background-image: url("chrome://global/skin/reader/RM-Close-24x24.svg");
  height: 68px;
  background-position: center 8px;
}

.close-button:hover {
  fill: #fff;
  background-color: var(--close-button-hover);
  border-bottom: 1px solid var(--close-button-hover);
  border-right: 1px solid var(--close-button-hover);
}

.close-button:hover:active {
  background-color: #AE2325;
  border-bottom: 1px solid #AE2325;
  border-right: 1px solid #AE2325;
}

.style-button {
  background-image: url("chrome://global/skin/reader/RM-Type-Controls-24x24.svg");
}

.minus-button {
  background-image: url("chrome://global/skin/reader/RM-Minus-24x24.svg");
}

.plus-button {
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

@media print {
  .toolbar {
    display: none !important;
  }
}

/*======= Article content =======*/

/* Note that any class names from the original article that we want to match on
 * must be added to CLASSES_TO_PRESERVE in ReaderMode.jsm, so that
 * Readability.js doesn't strip them out */

.moz-reader-content {
  display: none;
  font-size: 1em;
  line-height: 1.6em;
}

.moz-reader-content.line-height1 {
  line-height: 1em;
}

.moz-reader-content.line-height2 {
  line-height: 1.2em;
}

.moz-reader-content.line-height3 {
  line-height: 1.4em;
}

.moz-reader-content.line-height4 {
  line-height: 1.6em;
}

.moz-reader-content.line-height5 {
  line-height: 1.8em;
}

.moz-reader-content.line-height6 {
  line-height: 2.0em;
}

.moz-reader-content.line-height7 {
  line-height: 2.2em;
}

.moz-reader-content.line-height8 {
  line-height: 2.4em;
}

.moz-reader-content.line-height9 {
  line-height: 2.6em;
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
    margin: 0 0 10px 0 !important;
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
  color: #0095dd;
}

.moz-reader-content a:visited {
  color: #c2e;
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
  margin: -10px -10px 20px -10px;
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
  margin-left: auto;
  margin-right: auto;
}

.moz-reader-content .caption,
.moz-reader-content .wp-caption-text
.moz-reader-content figcaption {
  font-size: 0.9em;
  line-height: 1.48em;
  font-style: italic;
}

.moz-reader-content code,
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
  list-style: decimal;
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
  /* height: auto is implied from .moz-reader-content * rule. */
  width: 1em;
  margin: 0 .07em;
  padding: 0;
}

.reader-show-element {
  display: initial;
}`;

	let NOTES_WEB_STYLESHEET, MASK_WEB_STYLESHEET, HIGHLIGHTS_WEB_STYLESHEET;
	let selectedNote, anchorElement, maskNoteElement, maskPageElement, highlightSelectionMode, removeHighlightMode, resizingNoteMode, movingNoteMode, highlightColor, collapseNoteTimeout, cuttingOuterMode, cuttingMode, cuttingPath, cuttingPathIndex, previousContent;
	let removedElements = [], removedElementIndex = 0;

	window.onmessage = async event => {
		const message = JSON.parse(event.data);
		if (message.method == "init") {
			await init(message.content);
			window.parent.postMessage(JSON.stringify({ "method": "onInit" }), "*");
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
			formatPage(true);
		}
		if (message.method == "formatPageNoTheme") {
			formatPage(false);
		}
		if (message.method == "cancelFormatPage") {
			cancelFormatPage();
		}
		if (message.method == "disableEditPage") {
			document.body.contentEditable = false;
		}
		if (message.method == "enableCutInnerPage") {
			cuttingMode = true;
			document.documentElement.classList.add("single-file-cut-mode");
		}
		if (message.method == "enableCutOuterPage") {
			cuttingOuterMode = true;
			document.documentElement.classList.add("single-file-cut-mode");
		}
		if (message.method == "disableCutInnerPage") {
			cuttingMode = false;
			document.documentElement.classList.remove("single-file-cut-mode");
			resetSelectedElements();
			if (cuttingPath) {
				unhighlightCutElement();
				cuttingPath = null;
			}
		}
		if (message.method == "disableCutOuterPage") {
			cuttingOuterMode = false;
			document.documentElement.classList.remove("single-file-cut-mode");
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
			window.parent.postMessage(JSON.stringify({ "method": "setContent", content: getContent(message.compressHTML, message.updatedResources) }), "*");
		}
		if (message.method == "printPage") {
			printPage();
		}
	};
	window.onresize = reflowNotes;

	async function init(content) {
		await initConstants();
		const contentDocument = (new DOMParser()).parseFromString(content, "text/html");
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
		contentDocument.querySelectorAll("iframe").forEach(element => {
			const pointerEvents = "pointer-events";
			element.style.setProperty("-sf-" + pointerEvents, element.style.getPropertyValue(pointerEvents), element.style.getPropertyPriority(pointerEvents));
			element.style.setProperty(pointerEvents, "none", "important");
		});
		document.replaceChild(contentDocument.documentElement, document.documentElement);
		deserializeShadowRoots(document);
		const iconElement = document.querySelector("link[rel*=icon]");
		window.parent.postMessage(JSON.stringify({ "method": "setMetadata", title: document.title, icon: iconElement && iconElement.href }), "*");
		if (!isProbablyReaderable(document)) {
			window.parent.postMessage(JSON.stringify({ "method": "disableFormatPage" }), "*");
		}
		document.querySelectorAll(NOTE_TAGNAME).forEach(containerElement => attachNoteListeners(containerElement, true));
		document.documentElement.appendChild(getStyleElement(HIGHLIGHTS_WEB_STYLESHEET));
		maskPageElement = getMaskElement(PAGE_MASK_CLASS, PAGE_MASK_CONTAINER_CLASS);
		maskNoteElement = getMaskElement(NOTE_MASK_CLASS);
		document.documentElement.onmousedown = document.documentElement.ontouchstart = onMouseDown;
		document.documentElement.onmouseup = document.documentElement.ontouchend = onMouseUp;
		document.documentElement.onmouseover = onMouseOver;
		document.documentElement.onmouseout = onMouseOut;
		document.documentElement.onkeydown = onKeyDown;
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
			highlightSelection();
			onUpdate(false);
		}
		if (removeHighlightMode) {
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
			resizingNoteMode = false;
			document.documentElement.style.removeProperty("user-select");
			maskPageElement.classList.remove(PAGE_MASK_ACTIVE_CLASS);
			document.documentElement.ontouchmove = document.documentElement.onmousemove = null;
			onUpdate(false);
		}
		if (movingNoteMode) {
			anchorNote(movingNoteMode.event || event, selectedNote, movingNoteMode.deltaX, movingNoteMode.deltaY);
			movingNoteMode = null;
			document.documentElement.ontouchmove = document.documentElement.onmousemove = null;
			onUpdate(false);
		}
		if (collapseNoteTimeout) {
			clearTimeout(collapseNoteTimeout);
			collapseNoteTimeout = null;
		}
		if ((cuttingMode || cuttingOuterMode) && cuttingPath) {
			if (event.ctrlKey) {
				const element = cuttingPath[cuttingPathIndex];
				element.classList.toggle(cuttingMode ? CUT_SELECTED_CLASS : CUT_OUTER_SELECTED_CLASS);
			} else {
				validateCutElement(event.shiftKey);
			}
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

	function formatPage(applySystemTheme) {
		previousContent = getContent(false, []);
		const shadowRoots = {};
		const classesToPreserve = ["single-file-highlight", "single-file-highlight-yellow", "single-file-highlight-green", "single-file-highlight-pink", "single-file-highlight-blue"];
		document.querySelectorAll(NOTE_TAGNAME).forEach(containerElement => {
			shadowRoots[containerElement.dataset.noteId] = containerElement.shadowRoot;
			const className = "singlefile-note-id-" + containerElement.dataset.noteId;
			containerElement.classList.add(className);
			classesToPreserve.push(className);
		});
		const article = new Readability(document, { classesToPreserve }).parse();
		removedElements = [];
		removedElementIndex = 0;
		document.body.innerHTML = "";
		const domParser = new DOMParser();
		const doc = domParser.parseFromString(article.content, "text/html");
		const contentEditable = document.body.contentEditable;
		document.documentElement.replaceChild(doc.body, document.body);
		document.querySelectorAll(NOTE_TAGNAME).forEach(containerElement => {
			const noteId = (Array.from(containerElement.classList).find(className => /singlefile-note-id-\d+/.test(className))).split("singlefile-note-id-")[1];
			containerElement.classList.remove("singlefile-note-id-" + noteId);
			containerElement.dataset.noteId = noteId;
			if (!containerElement.shadowRoot) {
				containerElement.attachShadow({ mode: "open" });
				containerElement.shadowRoot.appendChild(shadowRoots[noteId]);
			}
		});
		document.querySelectorAll(NOTE_TAGNAME).forEach(containerElement => containerElement.shadowRoot = shadowRoots[containerElement.dataset.noteId]);
		document.body.contentEditable = contentEditable;
		document.head.querySelectorAll("style").forEach(styleElement => styleElement.remove());
		const styleElement = document.createElement("style");
		styleElement.textContent = STYLE_FORMATTED_PAGE;
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
		document.documentElement.appendChild(getStyleElement(HIGHLIGHTS_WEB_STYLESHEET));
		maskPageElement = getMaskElement(PAGE_MASK_CLASS, PAGE_MASK_CONTAINER_CLASS);
		maskNoteElement = getMaskElement(NOTE_MASK_CLASS);
		reflowNotes();
		onUpdate(false);
	}

	async function cancelFormatPage() {
		if (previousContent) {
			const contentEditable = document.body.contentEditable;
			await init(previousContent);
			document.body.contentEditable = contentEditable;
			onUpdate(false);
			previousContent = null;
		}
	}

	function getContent(compressHTML, updatedResources) {
		unhighlightCutElement();
		serializeShadowRoots(document);
		const doc = document.cloneNode(true);
		resetSelectedElements(doc);
		deserializeShadowRoots(doc);
		deserializeShadowRoots(document);
		doc.querySelectorAll("[" + DISABLED_NOSCRIPT_ATTRIBUTE_NAME + "]").forEach(element => {
			element.textContent = element.getAttribute(DISABLED_NOSCRIPT_ATTRIBUTE_NAME);
			element.removeAttribute(DISABLED_NOSCRIPT_ATTRIBUTE_NAME);
		});
		doc.querySelectorAll("." + MASK_CLASS + ", ." + REMOVED_CONTENT_CLASS).forEach(maskElement => maskElement.remove());
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
		doc.querySelectorAll("iframe").forEach(element => {
			const pointerEvents = "pointer-events";
			element.style.setProperty(pointerEvents, element.style.getPropertyValue("-sf-" + pointerEvents), element.style.getPropertyPriority("-sf-" + pointerEvents));
			element.style.removeProperty("-sf-" + pointerEvents);
		});
		doc.body.removeAttribute("contentEditable");
		const scriptElement = doc.createElement("script");
		scriptElement.setAttribute(SCRIPT_TEMPLATE_SHADOW_ROOT, "");
		scriptElement.textContent = getEmbedScript();
		doc.body.appendChild(scriptElement);
		const newResources = Object.keys(updatedResources).filter(url => updatedResources[url].type == "stylesheet").map(url => updatedResources[url]);
		newResources.forEach(resource => {
			const element = doc.createElement("style");
			doc.body.appendChild(element);
			element.textContent = resource.content;
		});
		return singlefile.lib.modules.serializer.process(doc, compressHTML);
	}

	function onUpdate(saved) {
		window.parent.postMessage(JSON.stringify({ "method": "onUpdate", saved }), "*");
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
				templateElement.setAttribute(SHADOW_MODE_ATTRIBUTE_NAME, "open");
				templateElement.appendChild(shadowRoot);
				element.appendChild(templateElement);
			}
		});
	}

	function deserializeShadowRoots(node) {
		node.querySelectorAll(`template[${SHADOW_MODE_ATTRIBUTE_NAME}]`).forEach(element => {
			if (element.parentElement) {
				let shadowRoot = getShadowRoot(element.parentElement);
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

	function getEmbedScript() {
		return minifyText(`(() => {
			document.currentScript.remove();
			const processNode = node => {
				node.querySelectorAll("template[${SHADOW_MODE_ATTRIBUTE_NAME}]").forEach(element=>{
					let shadowRoot = getShadowRoot(element.parentElement);
					if (!shadowRoot) {
						shadowRoot = element.parentElement.attachShadow({mode:element.getAttribute("${SHADOW_MODE_ATTRIBUTE_NAME}"),delegatesFocus:Boolean(element.getAttribute("${SHADOW_DELEGATE_FOCUS_ATTRIBUTE_NAME}"))});
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
			const maskNoteElement = getMaskElement(${JSON.stringify(NOTE_MASK_CLASS)});
			const maskPageElement = getMaskElement(${JSON.stringify(PAGE_MASK_CLASS)}, ${JSON.stringify(PAGE_MASK_CONTAINER_CLASS)});
			let selectedNote, highlightSelectionMode, removeHighlightMode, resizingNoteMode, movingNoteMode, collapseNoteTimeout, cuttingMode, cuttingOuterMode;
			window.onresize = reflowNotes;
			window.onUpdate = () => {};
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
		return document.querySelector("[data-single-file-note-refs^=" + JSON.stringify(containerElement.dataset.noteId) + "], [data-single-file-note-refs$=" + JSON.stringify(containerElement.dataset.noteId) + "], [data-single-file-note-refs*=" + JSON.stringify("," + containerElement.dataset.noteId + ",") + "]")
			|| document.documentElement;
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
			} catch (error) {
				return element.shadowRoot;
			}
		} else {
			return element.shadowRoot;
		}
	}

})();