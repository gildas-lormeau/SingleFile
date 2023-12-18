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

/* global browser, window, document, location */

const URLLabel = document.getElementById("URLLabel");
const addUrlsLabel = document.getElementById("addUrlsLabel");
const filterButton = document.getElementById("filterButton");
const filterPanel = document.getElementById("filterPanel");
const filterInput = document.getElementById("filterInput");
const urlsTable = document.getElementById("urlsTable");
const removeAllButton = document.getElementById("removeAllButton");
const addUrlForm = document.getElementById("addUrlForm");
const addUrlInput = document.getElementById("addUrlInput");
const addUrlButton = document.getElementById("addUrlButton");
const addUrlsButton = document.getElementById("addUrlsButton");
const addUrlsInput = document.getElementById("addUrlsInput");
const addUrlsCancelButton = document.getElementById("addUrlsCancelButton");
const addUrlsOKButton = document.getElementById("addUrlsOKButton");
const saveUrlsButton = document.getElementById("saveUrlsButton");
document.title = browser.i18n.getMessage("batchSaveUrlsTitle");
const noPendingsText = browser.i18n.getMessage("batchSaveUrlsNoURLs");
addUrlButton.textContent = browser.i18n.getMessage("batchSaveUrlsAddUrlButton");
addUrlsButton.textContent = browser.i18n.getMessage("batchSaveUrlsAddUrlsButton");
removeAllButton.textContent = browser.i18n.getMessage("batchSaveUrlsRemoveAllButton");
saveUrlsButton.textContent = browser.i18n.getMessage("batchSaveUrlsSavePagesButton");
addUrlsCancelButton.textContent = browser.i18n.getMessage("pendingsAddUrlsCancelButton");
addUrlsOKButton.textContent = browser.i18n.getMessage("pendingsAddUrlsOKButton");
addUrlsLabel.textContent = browser.i18n.getMessage("pendingsAddUrls");
URLLabel.textContent = browser.i18n.getMessage("batchSaveUrlsURLTitle");
addUrlForm.onsubmit = () => {
	const value = addUrlInput.value.trim();
	if (!urls.includes(value)) {
		urls.push(value);
		addUrlInput.value = "";
		refresh();
	}
	return false;
};
removeAllButton.onclick = async () => {
	const displayedUrls = getDisplayedUrls();
	urls = urls.filter(url => !displayedUrls.includes(url));
	await refresh();
};
addUrlsButton.onclick = displayAddUrlsPopup;
if (location.href.endsWith("#side-panel")) {
	document.documentElement.classList.add("side-panel");
}
saveUrlsButton.onclick = async () => {
	const displayedUrls = getDisplayedUrls();
	if (displayedUrls.length) {
		await browser.runtime.sendMessage({ method: "downloads.saveUrls", urls: displayedUrls });
		urls = urls.filter(url => !displayedUrls.includes(url));
		refresh();
	}
};

let previousState;
let urls = [];

filterButton.onclick = () => {
	filterPanel.hidden = !filterPanel.hidden;
	if (!filterPanel.hidden) {
		filterButton.classList.add("filter-displayed");
		filterInput.focus();
	} else {
		filterButton.classList.remove("filter-displayed");
	}
	refresh(true);
};
filterButton.onkeyup = event => {
	if (event.key == "Enter") {
		filterButton.onclick();
	}
};
filterInput.oninput = () => {
	refresh();
};
filterInput.onkeyup = event => {
	if (event.key == "Escape") {
		filterPanel.hidden = true;
		filterButton.classList.remove("filter-displayed");
		filterButton.focus();
		refresh(true);
	}
};
browser.runtime.onMessage.addListener(message => {
	if (message.method == "newUrls.addURLs") {
		urls = message.urls;
		refresh();
	}
});
refresh();

function resetTable() {
	urlsTable.innerHTML = "";
}

function updateTable(urls) {
	if (urls.length) {
		urls.forEach((url, indexUrl) => {
			const row = document.createElement("div");
			const cellURL = document.createElement("span");
			const cellCancel = document.createElement("span");
			const buttonCancel = document.createElement("button");
			row.className = "urls-row";
			cellURL.textContent = url;
			cellURL.className = "result-url-title";
			buttonCancel.textContent = "×";
			buttonCancel.onclick = () => cancel(indexUrl);
			cellCancel.appendChild(buttonCancel);
			cellCancel.className = "result-cancel";
			row.appendChild(cellURL);
			row.appendChild(cellCancel);
			urlsTable.appendChild(row);
		});
	}
}

async function cancel(index) {
	urls.splice(index, 1);
	await refresh();
}

async function displayAddUrlsPopup() {
	document.getElementById("formAddUrls").style.setProperty("display", "flex");
	document.querySelector("#formAddUrls .popup-content").style.setProperty("align-self", "center");
	addUrlsInput.value = "";
	addUrlsInput.focus();
	document.body.style.setProperty("overflow-y", "hidden");
	const newUrls = await new Promise(resolve => {
		addUrlsOKButton.onclick = event => hideAndResolve(event, addUrlsInput.value);
		addUrlsCancelButton.onclick = event => hideAndResolve(event);
		window.onkeyup = event => {
			if (event.key == "Escape") {
				hideAndResolve(event);
			}
		};

		function hideAndResolve(event, value = "") {
			event.preventDefault();
			document.getElementById("formAddUrls").style.setProperty("display", "none");
			document.body.style.setProperty("overflow-y", "");
			resolve(value.split("\n").map(url => url.trim()).filter(url => url));
		}
	});
	urls = Array.from(new Set(urls.concat(newUrls)));
	refresh();
}

async function refresh(force) {
	const displayedUrls = getDisplayedUrls();
	const currentState = JSON.stringify(displayedUrls);
	if (previousState != currentState || force) {
		previousState = currentState;
		resetTable();
		updateTable(displayedUrls);
		if (!displayedUrls.length) {
			const row = document.createElement("div");
			row.className = "urls-row";
			const cell = document.createElement("span");
			cell.className = "no-result";
			if (filterPanel.hidden) {
				cell.textContent = noPendingsText;
			}
			row.appendChild(cell);
			urlsTable.appendChild(row);
		}
	}
	saveUrlsButton.disabled = removeAllButton.disabled = !displayedUrls.length;
}

function getDisplayedUrls() {
	let displayedUrls = urls;
	if (!filterPanel.hidden) {
		displayedUrls = urls.filter(url => url.includes(filterInput.value));
	}
	return displayedUrls;
}