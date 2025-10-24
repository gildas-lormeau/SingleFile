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

import * as config from "./config.js";

const MAX_CONTENT_SIZE = 32 * (1024 * 1024);
const EDITOR_PAGE_URL = "/src/ui/pages/editor.html";
const tabsData = new Map();
const partialContents = new Map();
const EDITOR_URL = browser.runtime.getURL(EDITOR_PAGE_URL);

export {
	onMessage,
	onTabRemoved,
	isEditor,
	open,
	EDITOR_URL
};

async function open({ tabIndex, content, filename, compressContent, selfExtractingArchive, extractDataFromPage, insertTextBody, insertMetaCSP, embeddedImage, url }) {
	const createTabProperties = { active: true, url: EDITOR_PAGE_URL };
	if (tabIndex != null) {
		createTabProperties.index = tabIndex;
	}
	const tab = await browser.tabs.create(createTabProperties);
	tabsData.set(tab.id, {
		url,
		content,
		filename,
		compressContent,
		selfExtractingArchive,
		extractDataFromPage,
		insertTextBody,
		insertMetaCSP,
		embeddedImage
	});
}

function onTabRemoved(tabId) {
	tabsData.delete(tabId);
}

function isEditor(tab) {
	return tab.url == EDITOR_URL;
}

async function onMessage(message, sender) {
	if (message.method.endsWith(".getTabData")) {
		const tab = sender.tab;
		const tabData = tabsData.get(tab.id);
		if (tabData) {
			const options = await config.getOptions(tabData.url);
			const content = JSON.stringify(tabData);
			for (let blockIndex = 0; blockIndex * MAX_CONTENT_SIZE < content.length; blockIndex++) {
				const message = {
					method: "editor.setTabData",
					compressContent: tabData.compressContent
				};
				message.truncated = content.length > MAX_CONTENT_SIZE;
				if (message.truncated) {
					message.finished = (blockIndex + 1) * MAX_CONTENT_SIZE > content.length;
					message.content = content.substring(blockIndex * MAX_CONTENT_SIZE, (blockIndex + 1) * MAX_CONTENT_SIZE);
					if (message.finished) {
						message.options = options;
					}
				} else {
					message.content = content;
					options.embeddedImage = tabData.embeddedImage;
					message.options = options;
				}
				await browser.tabs.sendMessage(tab.id, message);
			}
		}
		return {};
	}
	if (message.method.endsWith(".open")) {
		let contents;
		const tab = sender.tab;
		if (message.truncated) {
			contents = partialContents.get(tab.id);
			if (!contents) {
				contents = [];
				partialContents.set(tab.id, contents);
			}
			contents.push(message.content);
			if (message.finished) {
				partialContents.delete(tab.id);
			}
		} else if (message.content) {
			contents = [message.content];
		}
		if (!message.truncated || message.finished) {
			const updateTabProperties = { url: EDITOR_PAGE_URL };
			await browser.tabs.update(tab.id, updateTabProperties);
			const content = message.compressContent ? contents.flat() : contents.join("");
			tabsData.set(tab.id, {
				url: tab.url,
				content,
				filename: message.filename,
				compressContent: message.compressContent,
				selfExtractingArchive: message.selfExtractingArchive,
				extractDataFromPageTags: message.extractDataFromPageTags,
				insertTextBody: message.insertTextBody,
				insertMetaCSP: message.insertMetaCSP,
				embeddedImage: message.embeddedImage
			});
		}
		return {};
	}
}