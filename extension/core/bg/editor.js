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

/* global browser, singlefile */

singlefile.extension.core.bg.editor = (() => {

	const MAX_CONTENT_SIZE = 32 * (1024 * 1024);
	const tabsData = new Map();
	const partialContents = new Map();
	const EDITOR_URL = browser.runtime.getURL("/extension/ui/editor/editor.html");

	return {
		onMessage,
		onTabRemoved,
		onTabUpdated,
		open
	};

	async function open({ tabIndex, content, filename }, options) {
		const createTabProperties = { active: true, url: "/extension/ui/editor/editor.html" };
		if (tabIndex != null) {
			createTabProperties.index = tabIndex;
		}
		const tab = await browser.tabs.create(createTabProperties);
		tabsData.set(tab.id, { content, filename, options });
	}

	async function onTabRemoved(tabId) {
		tabsData.delete(tabId);
	}

	async function onTabUpdated(tabId, changeInfo, tab) {
		if (tab.url != EDITOR_URL) {
			tabsData.delete(tabId);
		}
	}

	async function onMessage(message, sender) {
		if (message.method.endsWith(".getTabData")) {
			const tab = sender.tab;
			const tabData = tabsData.get(tab.id);
			if (tabData) {
				const content = JSON.stringify(tabData);
				for (let blockIndex = 0; blockIndex * MAX_CONTENT_SIZE < content.length; blockIndex++) {
					const message = {
						method: "editor.setTabData"
					};
					message.truncated = content.length > MAX_CONTENT_SIZE;
					if (message.truncated) {
						message.finished = (blockIndex + 1) * MAX_CONTENT_SIZE > content.length;
						message.content = content.substring(blockIndex * MAX_CONTENT_SIZE, (blockIndex + 1) * MAX_CONTENT_SIZE);
					} else {
						message.content = content;
					}
					await singlefile.extension.core.bg.tabs.sendMessage(tab.id, message);
				}
			}
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
				const options = await singlefile.extension.core.bg.config.getOptions(tab && tab.url);
				await singlefile.extension.core.bg.tabs.remove(tab.id);
				await open({ tabIndex: tab.index, filename: message.filename, content: contents.join("") }, options);
			}
		}
	}

})();