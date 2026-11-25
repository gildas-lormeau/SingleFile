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

import * as config from "./config.js";
import * as business from "./business.js";
import * as downloads from "./downloads.js";
import * as archiveStore from "./archive-store.js";

const ARCHIVE_PASSWORD_ERROR = "Saving tabs in one archive is not supported with a password yet.";
const FILENAME_EXTENSION_REGEXP = /\.(u\.zip\.html|zip\.html|zip|html?)$/i;
const SELF_EXTRACTING_UNIVERSAL_EXTENSION = ".u.zip.html";
const SELF_EXTRACTING_EXTENSION = ".zip.html";
const ARCHIVE_EXTENSION = ".zip";

export {
	onMessage
};

async function onMessage(message, sender) {
	if (message.method.endsWith(".getPages")) {
		return archiveStore.getPages();
	}
	if (message.method.endsWith(".remove")) {
		await archiveStore.remove(message.id);
		return {};
	}
	if (message.method.endsWith(".clear")) {
		await archiveStore.clear();
		return {};
	}
	if (message.method.endsWith(".setTitle")) {
		await archiveStore.setTitle(message.id, message.title);
		return {};
	}
	if (message.method.endsWith(".setPositions")) {
		await archiveStore.setPositions(message.ids);
		return {};
	}
	if (message.method.endsWith(".addUrls")) {
		return business.addUrlsToArchive(message.urls, message.profileName);
	}
	if (message.method.endsWith(".save")) {
		return save(message, sender.tab || {});
	}
}

async function save({ profileName, filename, pageId }, { windowId, index }) {
	const pages = await archiveStore.getPages();
	if (pages.length) {
		const options = await config.getProfileOptions(profileName);
		if (options.password) {
			return { error: ARCHIVE_PASSWORD_ERROR };
		}
		if (!options.compressContent) {
			options.selfExtractingArchive = true;
			options.extractDataFromPage = true;
		}
		options.compressContent = true;
		options.openEditor = false;
		options.filename = getFilename(filename || pages[0].filename, options);
		await downloads.saveArchive(pages, options, { id: String(pageId), windowId, index });
	}
	return {};
}

function getFilename(filename, options) {
	let extension = ARCHIVE_EXTENSION;
	if (options.selfExtractingArchive) {
		extension = options.extractDataFromPage ? SELF_EXTRACTING_UNIVERSAL_EXTENSION : SELF_EXTRACTING_EXTENSION;
	}
	return filename.replace(FILENAME_EXTENSION_REGEXP, "") + extension;
}
