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

/* global singlefile, browser */

singlefile.extension.core.bg.bookmarks = (() => {

	enable();
	return {
		onMessage,
		saveCreatedBookmarks: enable,
		disable,
		update: (id, changes) => browser.bookmarks.update(id, changes)
	};

	function onMessage(message) {
		if (message.method.endsWith(".saveCreatedBookmarks")) {
			enable();
			return {};
		}
		if (message.method.endsWith(".disable")) {
			disable();
			return {};
		}
	}

	async function enable() {
		try {
			browser.bookmarks.onCreated.removeListener(onCreated);
		} catch (error) {
			// ignored
		}
		let enabled;
		const profiles = await singlefile.extension.core.bg.config.getProfiles();
		Object.keys(profiles).forEach(profileName => {
			if (profiles[profileName].saveCreatedBookmarks) {
				enabled = true;
			}
		});
		if (enabled) {
			browser.bookmarks.onCreated.addListener(onCreated);
		}
	}

	async function disable() {
		let disabled;
		const profiles = await singlefile.extension.core.bg.config.getProfiles();
		Object.keys(profiles).forEach(profileName => disabled = disabled || !profiles[profileName].saveCreatedBookmarks);
		if (disabled) {
			browser.bookmarks.onCreated.removeListener(onCreated);
		}
	}

	async function onCreated(bookmarkId, bookmarkInfo) {
		const tabs = await singlefile.extension.core.bg.tabs.get({ lastFocusedWindow: true, active: true });
		const options = await singlefile.extension.core.bg.config.getOptions(bookmarkInfo.url);
		if (options.saveCreatedBookmarks) {
			const bookmarkFolders = await getParentFolders(bookmarkInfo.parentId);
			const ignoredBookmark = bookmarkFolders.find(folder => options.ignoredBookmarkFolders.includes(folder));
			if (!ignoredBookmark) {
				if (tabs.length && tabs[0].url == bookmarkInfo.url) {
					singlefile.extension.core.bg.business.saveTabs(tabs, { bookmarkId });
				} else {
					const tabs = await singlefile.extension.core.bg.tabs.get({});
					if (tabs.length) {
						const tab = tabs.find(tab => tab.url == bookmarkInfo.url);
						if (tab) {
							singlefile.extension.core.bg.business.saveTabs([tab], { bookmarkId });
						} else {
							if (bookmarkInfo.url) {
								if (bookmarkInfo.url == "about:blank") {
									browser.bookmarks.onChanged.addListener(onChanged);
								} else {
									saveUrl(bookmarkInfo.url);
								}
							}
						}
					}
				}
			}
		}

		async function getParentFolders(id, folderNames = []) {
			if (id) {
				const bookmarkNode = (await browser.bookmarks.get(id))[0];
				if (bookmarkNode && bookmarkNode.title) {
					folderNames.unshift(bookmarkNode.title);
					await getParentFolders(bookmarkNode.parentId, folderNames);
				}
			}
			return folderNames;
		}

		function onChanged(id, changeInfo) {
			if (id == bookmarkId && changeInfo.url) {
				browser.bookmarks.onChanged.removeListener(onChanged);
				saveUrl(changeInfo.url);
			}
		}

		function saveUrl(url) {
			singlefile.extension.core.bg.business.saveUrls([url], { bookmarkId });
		}
	}

})();