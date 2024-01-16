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

/* global browser, document, URL, Blob, MouseEvent, setTimeout, open */

import * as yabson from "./../../lib/yabson/yabson.js";

const MAX_CONTENT_SIZE = 16 * (1024 * 1024);

export {
	downloadPage
};

async function downloadPage(pageData, options) {
	if (options.includeBOM) {
		pageData.content = "\ufeff" + pageData.content;
	}
	const embeddedImage = options.embeddedImage;
	const message = {
		method: "downloads.download",
		taskId: options.taskId,
		insertTextBody: options.insertTextBody,
		confirmFilename: options.confirmFilename,
		filenameConflictAction: options.filenameConflictAction,
		filename: pageData.filename,
		saveToClipboard: options.saveToClipboard,
		saveToGDrive: options.saveToGDrive,
		saveToDropbox: options.saveToDropbox,
		saveWithWebDAV: options.saveWithWebDAV,
		webDAVURL: options.webDAVURL,
		webDAVUser: options.webDAVUser,
		webDAVPassword: options.webDAVPassword,
		saveToGitHub: options.saveToGitHub,
		githubToken: options.githubToken,
		githubUser: options.githubUser,
		githubRepository: options.githubRepository,
		githubBranch: options.githubBranch,
		saveWithCompanion: options.saveWithCompanion,
		forceWebAuthFlow: options.forceWebAuthFlow,
		filenameReplacementCharacter: options.filenameReplacementCharacter,
		openEditor: options.openEditor,
		openSavedPage: options.openSavedPage,
		compressHTML: options.compressHTML,
		backgroundSave: options.backgroundSave,
		bookmarkId: options.bookmarkId,
		replaceBookmarkURL: options.replaceBookmarkURL,
		applySystemTheme: options.applySystemTheme,
		defaultEditorMode: options.defaultEditorMode,
		includeInfobar: options.includeInfobar,
		warnUnsavedPage: options.warnUnsavedPage,
		createRootDirectory: options.createRootDirectory,
		selfExtractingArchive: options.selfExtractingArchive,
		embeddedImage: embeddedImage ? Array.from(embeddedImage) : null,
		preventAppendedData: options.preventAppendedData,
		extractDataFromPage: options.extractDataFromPage,
		insertCanonicalLink: options.insertCanonicalLink,
		insertMetaNoIndex: options.insertMetaNoIndex,
		password: options.password,
		compressContent: options.compressContent,
		foregroundSave: options.foregroundSave
	};
	if (options.compressContent) {
		const blob = new Blob([await yabson.serialize(pageData)], { type: "application/octet-stream" });
		const blobURL = URL.createObjectURL(blob);
		message.blobURL = blobURL;
		const result = await browser.runtime.sendMessage(message);
		URL.revokeObjectURL(blobURL);
		if (result.error) {
			message.embeddedImage = embeddedImage;
			message.blobURL = null;
			message.pageData = pageData;
			let data, indexData = 0;
			const dataArray = await yabson.serialize(message);
			do {
				data = Array.from(dataArray.slice(indexData, indexData + MAX_CONTENT_SIZE));
				indexData += MAX_CONTENT_SIZE;
				await browser.runtime.sendMessage({
					method: "downloads.download",
					compressContent: true,
					data
				});
			} while (data.length);
			await browser.runtime.sendMessage({
				method: "downloads.download",
				compressContent: true
			});
		}
		if (options.backgroundSave) {
			await browser.runtime.sendMessage({ method: "downloads.end", taskId: options.taskId });
		}
	} else {
		if (options.backgroundSave || options.openEditor || options.saveToGDrive || options.saveToGitHub || options.saveWithCompanion || options.saveWithWebDAV || options.saveToDropbox) {
			const blobURL = URL.createObjectURL(new Blob([pageData.content], { type: "text/html" }));
			message.blobURL = blobURL;
			const result = await browser.runtime.sendMessage(message);
			URL.revokeObjectURL(blobURL);
			if (result.error) {
				message.blobURL = null;
				for (let blockIndex = 0; blockIndex * MAX_CONTENT_SIZE < pageData.content.length; blockIndex++) {
					message.truncated = pageData.content.length > MAX_CONTENT_SIZE;
					if (message.truncated) {
						message.finished = (blockIndex + 1) * MAX_CONTENT_SIZE > pageData.content.length;
						message.content = pageData.content.substring(blockIndex * MAX_CONTENT_SIZE, (blockIndex + 1) * MAX_CONTENT_SIZE);
					} else {
						message.content = pageData.content;
					}
					await browser.runtime.sendMessage(message);
				}
			}
		} else {
			if (options.saveToClipboard) {
				saveToClipboard(pageData);
			} else {
				await downloadPageForeground(pageData);
			}
			if (options.openSavedPage) {
				open(URL.createObjectURL(new Blob([pageData.content], { type: "text/html" })));
			}
			browser.runtime.sendMessage({ method: "ui.processEnd" });
		}
		await browser.runtime.sendMessage({ method: "downloads.end", taskId: options.taskId, hash: pageData.hash, woleetKey: options.woleetKey });
	}
}

async function downloadPageForeground(pageData) {
	if (pageData.filename && pageData.filename.length) {
		const link = document.createElement("a");
		link.download = pageData.filename;
		link.href = URL.createObjectURL(new Blob([pageData.content], { type: "text/html" }));
		link.dispatchEvent(new MouseEvent("click"));
		setTimeout(() => URL.revokeObjectURL(link.href), 1000);
	}
	return new Promise(resolve => setTimeout(resolve, 1));
}

function saveToClipboard(page) {
	const command = "copy";
	document.addEventListener(command, listener);
	document.execCommand(command);
	document.removeEventListener(command, listener);

	function listener(event) {
		event.clipboardData.setData("text/html", page.content);
		event.clipboardData.setData("text/plain", page.content);
		event.preventDefault();
	}
}