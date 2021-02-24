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

/* global extension, browser */

extension.core.bg.messages = (() => {

	browser.runtime.onMessage.addListener((message, sender) => {
		if (message.method.startsWith("tabs.")) {
			return extension.core.bg.tabs.onMessage(message, sender);
		}
		if (message.method.startsWith("downloads.")) {
			return extension.core.bg.downloads.onMessage(message, sender);
		}
		if (message.method.startsWith("autosave.")) {
			return extension.core.bg.autosave.onMessage(message, sender);
		}
		if (message.method.startsWith("ui.")) {
			return extension.ui.bg.main.onMessage(message, sender);
		}
		if (message.method.startsWith("config.")) {
			return extension.core.bg.config.onMessage(message, sender);
		}
		if (message.method.startsWith("tabsData.")) {
			return extension.core.bg.tabsData.onMessage(message, sender);
		}
		if (message.method.startsWith("devtools.")) {
			return extension.core.bg.devtools.onMessage(message, sender);
		}
		if (message.method.startsWith("editor.")) {
			return extension.core.bg.editor.onMessage(message, sender);
		}
		if (message.method.startsWith("bookmarks.")) {
			return extension.core.bg.bookmarks.onMessage(message, sender);
		}
		if (message.method.startsWith("companion.")) {
			return extension.core.bg.companion.onMessage(message, sender);
		}
		if (message.method.startsWith("requests.")) {
			return extension.core.bg.requests.onMessage(message, sender);
		}
	});
	if (browser.runtime.onMessageExternal) {
		browser.runtime.onMessageExternal.addListener(async (message, sender) => {
			const allTabs = await extension.core.bg.tabs.get({ currentWindow: true, active: true });
			const currentTab = allTabs[0];
			if (currentTab) {
				return extension.core.bg.autosave.onMessageExternal(message, currentTab, sender);
			} else {
				return false;
			}
		});
	}
	return {};

})();