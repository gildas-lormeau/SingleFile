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

/* global browser, document, setInterval, localStorage, prompt, URL, Blob, MouseEvent, crypto, location */

import * as yabson from "./../../lib/yabson/yabson.js";

const PROFILE_STORAGE_KEY = "archiveProfileName";
const PAGE_MESSAGE_METHOD = "page.message";
const REFRESH_DELAY = 1000;
const SIZE_UNITS = ["B", "KB", "MB", "GB"];
const SIZE_UNIT_FACTOR = 1024;

const pagesTable = document.getElementById("pagesTable");
const totalSizeLabel = document.getElementById("totalSizeLabel");
const removeAllButton = document.getElementById("removeAllButton");
const saveButton = document.getElementById("saveButton");
const filenameInput = document.getElementById("filenameInput");
const profileSelect = document.getElementById("profileSelect");
const errorLabel = document.getElementById("errorLabel");
const noPagesText = browser.i18n.getMessage("archiveNoPages");
const moveUpText = browser.i18n.getMessage("archiveMoveUpButton");
const moveDownText = browser.i18n.getMessage("archiveMoveDownButton");
const removeText = browser.i18n.getMessage("archiveRemoveButton");
document.title = browser.i18n.getMessage("archiveTitle");
document.getElementById("pagesLabel").textContent = browser.i18n.getMessage("archiveTitle");
document.getElementById("filenameLabel").textContent = browser.i18n.getMessage("archiveFilenameLabel");
document.getElementById("profileLabel").textContent = browser.i18n.getMessage("archiveProfileLabel");
removeAllButton.textContent = browser.i18n.getMessage("archiveRemoveAllButton");
saveButton.textContent = browser.i18n.getMessage("archiveSaveButton");

const pageId = crypto.randomUUID();
let pages = [], previousState, filenameEdited, saving, downloadParser;

if (location.href.endsWith("#side-panel")) {
	document.documentElement.classList.add("side-panel");
}

removeAllButton.onclick = async () => {
	await browser.runtime.sendMessage({ method: "archive.clear" });
	await refresh();
};
saveButton.onclick = save;
filenameInput.oninput = () => filenameEdited = Boolean(filenameInput.value);
profileSelect.onchange = () => {
	try {
		localStorage.setItem(PROFILE_STORAGE_KEY, profileSelect.value);
		// eslint-disable-next-line no-unused-vars
	} catch (error) {
		// ignored
	}
};
browser.runtime.onMessage.addListener(({ method, pageId: targetPageId, message }) => {
	if (method == PAGE_MESSAGE_METHOD && targetPageId == pageId) {
		return onPageMessage(message);
	}
});
init();

function onPageMessage(message) {
	if (message.method == "content.error") {
		displayError(message.error);
		return Promise.resolve({});
	}
	if (message.method == "content.prompt") {
		return Promise.resolve(prompt(message.message, message.value));
	}
	if (message.method == "content.download") {
		return downloadContent(message);
	}
}

async function init() {
	const [constants, profiles] = await Promise.all([
		browser.runtime.sendMessage({ method: "config.getConstants" }),
		browser.runtime.sendMessage({ method: "config.getProfiles" })
	]);
	const { DEFAULT_PROFILE_NAME, DISABLED_PROFILE_NAME } = constants;
	Object.keys(profiles)
		.filter(profileName => profileName != DISABLED_PROFILE_NAME)
		.sort((name, otherName) => name == DEFAULT_PROFILE_NAME ? -1 : otherName == DEFAULT_PROFILE_NAME ? 1 : name.localeCompare(otherName))
		.forEach(profileName => {
			const optionElement = document.createElement("option");
			optionElement.value = profileName;
			optionElement.textContent = profileName == DEFAULT_PROFILE_NAME ? browser.i18n.getMessage("profileDefaultSettings") : profileName;
			profileSelect.appendChild(optionElement);
		});
	let storedProfileName;
	try {
		storedProfileName = localStorage.getItem(PROFILE_STORAGE_KEY);
		// eslint-disable-next-line no-unused-vars
	} catch (error) {
		// ignored
	}
	if (storedProfileName && Array.from(profileSelect.options).some(option => option.value == storedProfileName)) {
		profileSelect.value = storedProfileName;
	}
	setInterval(refresh, REFRESH_DELAY);
	await refresh();
}

async function refresh() {
	const results = await browser.runtime.sendMessage({ method: "archive.getPages" });
	const currentState = JSON.stringify(results);
	if (previousState != currentState) {
		previousState = currentState;
		pages = results;
		updateTable();
	}
	removeAllButton.disabled = !pages.length;
	saveButton.disabled = !pages.length || saving;
}

function updateTable() {
	const editedElement = document.activeElement && document.activeElement.dataset.pageId ? document.activeElement : null;
	const editedPageId = editedElement && editedElement.dataset.pageId;
	const editedValue = editedElement && editedElement.value;
	pagesTable.innerHTML = "";
	pages.forEach((page, indexPage) => pagesTable.appendChild(getRow(page, indexPage)));
	if (!pages.length) {
		const row = document.createElement("div");
		row.className = "page-row no-page";
		row.textContent = noPagesText;
		pagesTable.appendChild(row);
	}
	if (editedPageId) {
		const inputElement = pagesTable.querySelector("input[data-page-id=\"" + editedPageId + "\"]");
		if (inputElement) {
			inputElement.value = editedValue;
			inputElement.focus();
		}
	}
	totalSizeLabel.textContent = pages.length ? formatSize(pages.reduce((total, page) => total + page.size, 0)) : "";
	if (!filenameEdited) {
		filenameInput.value = pages.length ? pages[0].filename : "";
	}
}

function getRow(page, indexPage) {
	const row = document.createElement("div");
	const cellMove = document.createElement("span");
	const cellTitle = document.createElement("span");
	const cellSize = document.createElement("span");
	const cellRemove = document.createElement("span");
	const buttonUp = document.createElement("button");
	const buttonDown = document.createElement("button");
	const buttonRemove = document.createElement("button");
	const inputTitle = document.createElement("input");
	const labelURL = document.createElement("span");
	row.className = "page-row";
	cellMove.className = "page-move";
	cellTitle.className = "page-title";
	cellSize.className = "page-size";
	cellRemove.className = "page-remove";
	labelURL.className = "page-url";
	buttonUp.textContent = "↑";
	buttonUp.title = moveUpText;
	buttonUp.disabled = !indexPage;
	buttonUp.onclick = () => move(indexPage, indexPage - 1);
	buttonDown.textContent = "↓";
	buttonDown.title = moveDownText;
	buttonDown.disabled = indexPage == pages.length - 1;
	buttonDown.onclick = () => move(indexPage, indexPage + 1);
	buttonRemove.textContent = "×";
	buttonRemove.title = removeText;
	buttonRemove.onclick = () => remove(page.id);
	inputTitle.type = "text";
	inputTitle.value = page.title || "";
	inputTitle.dataset.pageId = page.id;
	inputTitle.onchange = () => setTitle(page.id, inputTitle.value);
	labelURL.textContent = labelURL.title = page.url;
	cellSize.textContent = formatSize(page.size);
	cellMove.appendChild(buttonUp);
	cellMove.appendChild(buttonDown);
	cellTitle.appendChild(inputTitle);
	cellTitle.appendChild(labelURL);
	cellRemove.appendChild(buttonRemove);
	row.appendChild(cellMove);
	row.appendChild(cellTitle);
	row.appendChild(cellSize);
	row.appendChild(cellRemove);
	return row;
}

async function move(indexPage, newIndexPage) {
	const ids = pages.map(page => page.id);
	const [id] = ids.splice(indexPage, 1);
	ids.splice(newIndexPage, 0, id);
	await browser.runtime.sendMessage({ method: "archive.setPositions", ids });
	await refresh();
}

async function remove(id) {
	await browser.runtime.sendMessage({ method: "archive.remove", id });
	await refresh();
}

async function setTitle(id, title) {
	await browser.runtime.sendMessage({ method: "archive.setTitle", id, title });
	await refresh();
}

async function save() {
	saving = true;
	saveButton.disabled = true;
	displayError();
	try {
		const response = await browser.runtime.sendMessage({ method: "archive.save", pageId, profileName: profileSelect.value, filename: filenameInput.value });
		if (response && response.error) {
			displayError(response.error);
		}
	} catch (error) {
		displayError(error.message);
	} finally {
		saving = false;
		await refresh();
	}
}

async function downloadContent(message) {
	if (!downloadParser) {
		downloadParser = yabson.getParser();
	}
	const result = await downloadParser.next(message.data);
	if (result.done) {
		downloadParser = null;
		const link = document.createElement("a");
		link.download = result.value.filename;
		link.href = URL.createObjectURL(new Blob([result.value.content], { type: result.value.mimeType }));
		link.dispatchEvent(new MouseEvent("click"));
		URL.revokeObjectURL(link.href);
	}
	return {};
}

function displayError(message) {
	errorLabel.hidden = !message;
	errorLabel.textContent = message || "";
}

function formatSize(size) {
	let indexUnit = 0;
	while (size >= SIZE_UNIT_FACTOR && indexUnit < SIZE_UNITS.length - 1) {
		size /= SIZE_UNIT_FACTOR;
		indexUnit++;
	}
	return (indexUnit ? size.toFixed(1) : size) + " " + SIZE_UNITS[indexUnit];
}
