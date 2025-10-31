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
import * as bootstrap from "./bootstrap.js";
import * as autosave from "./autosave.js";
import * as bookmarks from "./bookmarks.js";
import * as companion from "./companion.js";
import * as downloads from "./downloads.js";
import * as editor from "./editor.js";
import * as requests from "./requests.js";
import * as tabsData from "./tabs-data.js";
import * as tabs from "./tabs.js";
import * as externalMesssages from "./external-messages.js";
import * as ui from "./../../ui/bg/index.js";
import "./../../lib/single-file/background.js";

browser.runtime.onMessage.addListener((message, sender) => {
	if (message.method.startsWith("tabs.")) {
		return tabs.onMessage(message, sender);
	}
	if (message.method.startsWith("downloads.")) {
		return downloads.onMessage(message, sender);
	}
	if (message.method.startsWith("autosave.")) {
		return autosave.onMessage(message, sender);
	}
	if (message.method.startsWith("ui.")) {
		return ui.onMessage(message, sender);
	}
	if (message.method.startsWith("config.")) {
		return config.onMessage(message, sender);
	}
	if (message.method.startsWith("tabsData.")) {
		return tabsData.onMessage(message, sender);
	}
	if (message.method.startsWith("editor.")) {
		return editor.onMessage(message, sender);
	}
	if (message.method.startsWith("bookmarks.")) {
		return bookmarks.onMessage(message, sender);
	}
	if (message.method.startsWith("companion.")) {
		return companion.onMessage(message, sender);
	}
	if (message.method.startsWith("requests.")) {
		return requests.onMessage(message, sender);
	}
	if (message.method.startsWith("bootstrap.")) {
		return bootstrap.onMessage(message, sender);
	}
	if (message.method == "ping") {
		return Promise.resolve({});
	}
});

if (browser.runtime.onMessageExternal) {
	browser.runtime.onMessageExternal.addListener(externalMesssages.onMessage);
}