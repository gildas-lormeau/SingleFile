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

import * as autosave from "./autosave.js";
import * as business from "./business.js";
import * as externalCapturePermissions from "./external-capture-permissions.js";
import "./../../lib/single-file/background.js";

const ACTION_SAVE_PAGE = "save-page";
const ACTION_EDIT_AND_SAVE_PAGE = "edit-and-save-page";
const ACTION_SAVE_SELECTED_LINKS = "save-selected-links";
const ACTION_SAVE_SELECTED = "save-selected-content";
const ACTION_SAVE_SELECTED_TABS = "save-selected-tabs";
const ACTION_SAVE_UNPINNED_TABS = "save-unpinned-tabs";
const ACTION_SAVE_ALL_TABS = "save-all-tabs";
const METHOD_CAPTURE_PAGE = "capture-page";
// options an external extension is allowed to set: they define the content of the
// captured page, they cannot select a destination, display anything in the tab, or
// delay the capture
const CAPTURE_OPTION_NAMES = [
	"removeHiddenElements",
	"removedElementsSelector",
	"removeUnusedStyles",
	"removeUnusedFonts",
	"removeFrames",
	"removeNoScriptTags",
	"removeSavedDate",
	"removeAlternativeFonts",
	"removeAlternativeMedias",
	"removeAlternativeImages",
	"compressHTML",
	"compressCSS",
	"groupDuplicateImages",
	"maxSizeDuplicateImages",
	"groupDuplicateStylesheets",
	"moveStylesInHead",
	"imageReductionFactor",
	"loadDeferredImages",
	"loadDeferredImagesBlockCookies",
	"loadDeferredImagesBlockStorage",
	"loadDeferredImagesKeepZoomLevel",
	"loadDeferredImagesDispatchScrollEvent",
	"loadDeferredImagesBeforeFrames",
	"blockImages",
	"blockAlternativeImages",
	"blockStylesheets",
	"blockFonts",
	"blockScripts",
	"blockVideos",
	"blockAudios",
	"blockMixedContent",
	"maxResourceSizeEnabled",
	"maxResourceSize",
	"saveRawPage",
	"saveFavicon",
	"saveOriginalURLs",
	"resolveLinks",
	"resolveFragmentIdentifierURLs",
	"includeBOM",
	"insertMetaNoIndex",
	"insertMetaCSP",
	"insertSingleFileComment",
	"includeInfobar",
	"infobarTemplate",
	"openInfobar",
	"displayStats",
	"filenameTemplate",
	"selected",
	"optionallySelected"
];

export { onMessage };

async function onMessage(message, sender) {
	if (message == ACTION_SAVE_PAGE) {
		const tabs = await browser.tabs.query({ currentWindow: true, active: true });
		tabs.length = 1;
		await business.saveTabs(tabs);
	} else if (message == ACTION_EDIT_AND_SAVE_PAGE) {
		const tabs = await browser.tabs.query({ currentWindow: true, active: true });
		tabs.length = 1;
		await business.saveTabs(tabs, { openEditor: true });
	} else if (message == ACTION_SAVE_SELECTED_LINKS) {
		const tabs = await browser.tabs.query({ currentWindow: true, active: true });
		await business.saveSelectedLinks(tabs[0]);
	} else if (message == ACTION_SAVE_SELECTED) {
		const tabs = await browser.tabs.query({ currentWindow: true, active: true });
		await business.saveTabs(tabs, { selected: true });
	} else if (message == ACTION_SAVE_SELECTED_TABS) {
		const tabs = await queryTabs({ currentWindow: true, highlighted: true });
		await business.saveTabs(tabs);
	} else if (message == ACTION_SAVE_UNPINNED_TABS) {
		const tabs = await queryTabs({ currentWindow: true, pinned: false });
		await business.saveTabs(tabs);
	} else if (message == ACTION_SAVE_ALL_TABS) {
		const tabs = await queryTabs({ currentWindow: true });
		await business.saveTabs(tabs);
	} else if (message && message.method == METHOD_CAPTURE_PAGE) {
		const captureConfig = getCaptureConfig(message);
		const permissionGranted = await externalCapturePermissions.requestPermission(sender, message);
		if (!permissionGranted) {
			throw new Error("SingleFile capture was not approved for this extension");
		}
		const currentTab = message.tabId
			? await browser.tabs.get(message.tabId)
			: (await browser.tabs.query({ currentWindow: true, active: true }))[0];
		if (!currentTab) {
			return false;
		}
		return business.captureTab(currentTab, captureConfig);
	} else if (message && message.method) {
		const tabs = await browser.tabs.query({ currentWindow: true, active: true });
		const currentTab = tabs[0];
		if (currentTab) {
			return autosave.onMessageExternal(message, currentTab, sender);
		} else {
			return false;
		}
	}
}

function getCaptureConfig(message) {
	const { config } = message;
	if (config == null) {
		return {};
	}
	if (typeof config != "object" || Array.isArray(config)) {
		throw new Error("SingleFile capture config must be an object");
	}
	const captureConfig = {};
	CAPTURE_OPTION_NAMES.forEach(optionName => {
		if (config[optionName] !== undefined) {
			captureConfig[optionName] = config[optionName];
		}
	});
	return captureConfig;
}

async function queryTabs(options) {
	const tabs = await browser.tabs.query(options);
	return tabs.sort((tab1, tab2) => tab1.index - tab2.index);
}
