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

/* global browser, document, setInterval */

(async () => {

	const URLLabel = document.getElementById("URLLabel");
	const statusLabel = document.getElementById("statusLabel");
	const resultsTable = document.getElementById("resultsTable");
	const cancelAllButton = document.getElementById("cancelAllButton");
	document.title = browser.i18n.getMessage("pendingsTitle");
	cancelAllButton.textContent = browser.i18n.getMessage("pendingsCancelAllButton");
	URLLabel.textContent = browser.i18n.getMessage("pendingsURLTitle");
	statusLabel.textContent = browser.i18n.getMessage("pendingsStatusTitle");
	const statusText = {
		pending: browser.i18n.getMessage("pendingsPendingStatus"),
		processing: browser.i18n.getMessage("pendingsProcessingStatus"),
		cancelling: browser.i18n.getMessage("pendingsCancellingStatus")
	};
	const noPendingsText = browser.i18n.getMessage("pendingsNoPendings");
	cancelAllButton.onclick = async () => {
		const results = await browser.runtime.sendMessage({ method: "downloads.getInfo" });
		await Promise.all(results.pending.concat(results.processing).map(([tabId]) => browser.runtime.sendMessage({ method: "downloads.cancel", tabId })));
		await refresh();
	};
	let previousState;
	setInterval(refresh, 1000);
	await refresh();

	function resetTable() {
		resultsTable.innerHTML = "";
	}

	function updateTable(results, type) {
		const data = results[type];
		if (data.length) {
			data.sort(([, tabInfo1], [, tabInfo2]) => tabInfo1.index - tabInfo2.index);
			data.forEach(([tabId, tabInfo]) => {
				const row = document.createElement("div");
				const cellURL = document.createElement("span");
				const cellStatus = document.createElement("span");
				const cellCancel = document.createElement("span");
				const buttonCancel = document.createElement("button");
				row.dataset.tabId = tabId;
				row.className = "result-row result-type-" + type;
				cellURL.textContent = tabInfo.url;
				cellURL.className = "result-url";
				cellURL.onclick = () => selectTab(type, tabId);
				if (tabInfo.cancelled) {
					cellStatus.textContent = statusText.cancelling;
				} else {
					cellStatus.textContent = statusText[type];
					buttonCancel.textContent = "×";
					buttonCancel.onclick = () => cancel(type, tabId);
					cellCancel.appendChild(buttonCancel);
				}
				cellStatus.className = "result-status";
				cellCancel.className = "result-cancel";
				row.appendChild(cellURL);
				row.appendChild(cellStatus);
				row.appendChild(cellCancel);
				resultsTable.appendChild(row);
			});
		}
	}

	async function cancel(type, tabId) {
		await browser.runtime.sendMessage({ method: "downloads.cancel", tabId });
		await refresh();
	}

	async function selectTab(type, tabId) {
		await browser.runtime.sendMessage({ method: "tabs.activate", tabId });
		await refresh();
	}

	async function refresh() {
		const results = await browser.runtime.sendMessage({ method: "downloads.getInfo" });
		const currentState = JSON.stringify(results);
		if (previousState != currentState) {
			previousState = currentState;
			resetTable();
			updateTable(results, "processing");
			updateTable(results, "pending");
			if (!results.pending.length && !results.processing.length) {
				const row = document.createElement("div");
				row.className = "result-row";
				const cell = document.createElement("span");
				cell.colSpan = 3;
				cell.className = "no-result";
				cell.textContent = noPendingsText;
				row.appendChild(cell);
				resultsTable.appendChild(row);
			}
		}
	}

})();