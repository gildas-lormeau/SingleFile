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
import * as business from "./business.js";

Promise.resolve().then(enable);

export {
	onMessage,
	enable as saveCreatedBookmarks,
	disable,
	update
};

async function onMessage(message) {
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
	const profiles = await config.getProfiles();
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
	const profiles = await config.getProfiles();
	Object.keys(profiles).forEach(profileName => disabled = disabled || !profiles[profileName].saveCreatedBookmarks);
	if (disabled) {
		browser.bookmarks.onCreated.removeListener(onCreated);
	}
}

async function update(id, changes) {
	try {
		await browser.bookmarks.update(id, changes);
	} catch (error) {
		// ignored
	}
}

async function onCreated(bookmarkId, bookmarkInfo) {
	const activeTabs = await browser.tabs.query({ lastFocusedWindow: true, active: true });
	const options = await config.getOptions(bookmarkInfo.url);
	if (options.saveCreatedBookmarks) {
		const bookmarkFolders = await getParentFolders(bookmarkInfo.parentId);
		const allowedBookmarkSet = options.allowedBookmarkFolders.toString();
		const allowedBookmark = bookmarkFolders.find(folder => options.allowedBookmarkFolders.includes(folder));
		const ignoredBookmarkSet = options.ignoredBookmarkFolders.toString();
		const ignoredBookmark = bookmarkFolders.find(folder => options.ignoredBookmarkFolders.includes(folder));
		if (
			((allowedBookmarkSet && allowedBookmark) || !allowedBookmarkSet) &&
			((ignoredBookmarkSet && !ignoredBookmark) || !ignoredBookmarkSet)
		) {
			if (activeTabs.length && activeTabs[0].url == bookmarkInfo.url) {
				business.saveTabs(activeTabs, { bookmarkId, bookmarkFolders });
			} else {
				const tabs = await browser.tabs.query({});
				if (tabs.length) {
					const tab = tabs.find(tab => tab.url == bookmarkInfo.url);
					if (tab) {
						business.saveTabs([tab], { bookmarkId, bookmarkFolders });
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
		business.saveUrls([url], { bookmarkId });
	}
}