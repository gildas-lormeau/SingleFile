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

async function externalSave(options) {
	options.autoSaveExternalSave = false;
	const port = browser.runtime.connectNative("singlefile_companion");
	port.postMessage({
		method: "externalSave",
		pageData: options
	});
	await new Promise((resolve, reject) => {
		port.onDisconnect.addListener(() => {
			if (port.error) {
				reject(new Error(port.error.message + " (Companion)"));
			} else if (!browser.runtime.lastError || browser.runtime.lastError.message.includes("Native host has exited")) {
				resolve();
			}
		});
	});
}

async function save(pageData) {
	const port = browser.runtime.connectNative("singlefile_companion");
	port.postMessage({
		method: "save",
		pageData
	});
	await new Promise((resolve, reject) => {
		port.onDisconnect.addListener(() => {
			if (port.error) {
				reject(new Error(port.error.message + " (Companion)"));
			} else if (!browser.runtime.lastError || browser.runtime.lastError.message.includes("Native host has exited")) {
				resolve();
			}
		});
	});
}