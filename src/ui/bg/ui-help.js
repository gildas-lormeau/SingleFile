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

/* global browser, document */

let BACKGROUND_SAVE_SUPPORTED,
	AUTO_SAVE_SUPPORTED,
	AUTO_OPEN_EDITOR_SUPPORTED,
	INFOBAR_SUPPORTED,
	BOOKMARKS_API_SUPPORTED,
	IDENTITY_API_SUPPORTED,
	CLIPBOARD_API_SUPPORTED,
	NATIVE_API_API_SUPPORTED,
	WEB_BLOCKING_API_SUPPORTED,
	SELECTABLE_TABS_SUPPORTED;
browser.runtime.sendMessage({ method: "config.getConstants" }).then(data => {
	({
		BACKGROUND_SAVE_SUPPORTED,
		AUTO_SAVE_SUPPORTED,
		AUTO_OPEN_EDITOR_SUPPORTED,
		INFOBAR_SUPPORTED,
		BOOKMARKS_API_SUPPORTED,
		IDENTITY_API_SUPPORTED,
		CLIPBOARD_API_SUPPORTED,
		NATIVE_API_API_SUPPORTED,
		WEB_BLOCKING_API_SUPPORTED,
		SELECTABLE_TABS_SUPPORTED
	} = data);
	init();
});

function init() {
	if (!AUTO_SAVE_SUPPORTED) {
		document.getElementById("autoSaveSection").hidden = true;
		document.getElementById("autoSaveOptions").hidden = true;
		document.getElementById("autoSaveMenu").hidden = true;
		document.getElementById("autoSaveHint").hidden = true;
	}
	if (!BACKGROUND_SAVE_SUPPORTED) {
		document.getElementById("backgroundSaveOption").hidden = true;
		document.getElementById("confirmFilenameOption").hidden = true;
		document.getElementById("filenameConflictActionOption").hidden = true;
	}
	if (!BOOKMARKS_API_SUPPORTED) {
		document.getElementById("bookmarksSection").hidden = true;
		document.getElementById("bookmarksOptions").hidden = true;
	}
	if (!AUTO_OPEN_EDITOR_SUPPORTED) {
		document.getElementById("autoOpenEditorOption").hidden = true;
	}
	if (!INFOBAR_SUPPORTED) {
		document.getElementById("displayInfobarOption").hidden = true;
	}
	if (!IDENTITY_API_SUPPORTED) {
		document.getElementById("saveToGDriveOption").hidden = true;
		document.getElementById("saveToGDriveHint").hidden = true;
		document.getElementById("saveToDropboxOption").hidden = true;
	}
	if (!CLIPBOARD_API_SUPPORTED) {
		document.getElementById("saveToClipboardOption").hidden = true;
	}
	if (!NATIVE_API_API_SUPPORTED) {
		document.getElementById("saveWithCompanionOption").hidden = true;
	}
	if (!WEB_BLOCKING_API_SUPPORTED) {
		document.getElementById("passReferrerOnErrorOption").hidden = true;
	}
	if (!SELECTABLE_TABS_SUPPORTED) {
		document.getElementById("selectableTabsMenu").hidden = true;
		document.getElementById("shortcutsSection").hidden = true;
	}
}