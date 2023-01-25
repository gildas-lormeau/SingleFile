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

/* global browser */

let enabled = true;

export {
	enabled,
	onMessage,
	externalSave,
	save
};

async function onMessage(message) {
	if (message.method.endsWith(".state")) {
		return { enabled };
	}
}

async function externalSave(pageData) {
	pageData.autoSaveExternalSave = false;
	let response;
	try {
		response = await browser.runtime.sendNativeMessage("singlefile_companion", {
			method: "externalSave",
			pageData
		});
	} catch (error) {
		if (!error.message || !error.message.includes("Native host has exited")) {
			throw error;
		}
	}
	if (response && response.error) {
		throw new Error(response.error + " (Companion)");
	}
}

async function save(pageData) {
	let response;
	try {
		response = await browser.runtime.sendNativeMessage("singlefile_companion", {
			method: "save",
			pageData
		});
	} catch (error) {
		if (!error.message || !error.message.includes("Native host has exited")) {
			throw error;
		}
	}
	if (response && response.error) {
		throw new Error(response.error + " (Companion)");
	}
}