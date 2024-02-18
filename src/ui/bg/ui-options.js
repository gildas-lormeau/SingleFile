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

/* global browser, window, document, localStorage, FileReader, location, fetch, TextDecoder, DOMParser, HTMLElement, MouseEvent */

const HELP_ICON_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAABIUlEQVQ4y+2TsarCMBSGvxTBRdqiUZAWOrhJB9EXcPKFfCvfQYfulUKHDqXg4CYUJSioYO4mSDX3ttzt3n87fMlHTpIjlsulxpDZbEYYhgghSNOUOI5Ny2mZYBAELBYLer0eAJ7ncTweKYri4x7LJJRS0u12n7XrukgpjSc0CpVSXK/XZ32/31FKNW85z3PW6zXT6RSAJEnIsqy5UGvNZrNhu90CcDqd+C6tT6J+v//2Th+PB2VZ1hN2Oh3G4zGTyQTbtl/YbrdjtVpxu91+Ljyfz0RRhG3bzOfzF+Y4TvNXvlwuaK2pE4tfzr/wzwsty0IIURlL0998KxRCMBqN8H2/wlzXJQxD2u12vVkeDoeUZUkURRU+GAw4HA7s9/sK+wK6CWHasQ/S/wAAAABJRU5ErkJggg==";
const HELP_PAGE_PATH = "/src/ui/pages/help.html";
let DEFAULT_PROFILE_NAME,
	DISABLED_PROFILE_NAME,
	CURRENT_PROFILE_NAME,
	BACKGROUND_SAVE_SUPPORTED,
	AUTO_SAVE_SUPPORTED,
	AUTO_OPEN_EDITOR_SUPPORTED,
	INFOBAR_SUPPORTED,
	BOOKMARKS_API_SUPPORTED,
	IDENTITY_API_SUPPORTED,
	CLIPBOARD_API_SUPPORTED,
	NATIVE_API_API_SUPPORTED,
	WEB_BLOCKING_API_SUPPORTED,
	SHARE_API_SUPPORTED;
browser.runtime.sendMessage({ method: "config.getConstants" }).then(data => {
	({
		DEFAULT_PROFILE_NAME,
		DISABLED_PROFILE_NAME,
		CURRENT_PROFILE_NAME,
		BACKGROUND_SAVE_SUPPORTED,
		AUTO_SAVE_SUPPORTED,
		AUTO_OPEN_EDITOR_SUPPORTED,
		INFOBAR_SUPPORTED,
		BOOKMARKS_API_SUPPORTED,
		IDENTITY_API_SUPPORTED,
		CLIPBOARD_API_SUPPORTED,
		NATIVE_API_API_SUPPORTED,
		WEB_BLOCKING_API_SUPPORTED,
		SHARE_API_SUPPORTED
	} = data);
	init();
});
const removeHiddenElementsLabel = document.getElementById("removeHiddenElementsLabel");
const removeUnusedStylesLabel = document.getElementById("removeUnusedStylesLabel");
const removeUnusedFontsLabel = document.getElementById("removeUnusedFontsLabel");
const removeFramesLabel = document.getElementById("removeFramesLabel");
const blockScriptsLabel = document.getElementById("blockScriptsLabel");
const blockAudiosLabel = document.getElementById("blockAudiosLabel");
const blockVideosLabel = document.getElementById("blockVideosLabel");
const blockFontsLabel = document.getElementById("blockFontsLabel");
const blockStylesheetsLabel = document.getElementById("blockStylesheetsLabel");
const blockImagesLabel = document.getElementById("blockImagesLabel");
const acceptHeaderDocumentLabel = document.getElementById("acceptHeaderDocumentLabel");
const acceptHeaderScriptLabel = document.getElementById("acceptHeaderScriptLabel");
const acceptHeaderAudioLabel = document.getElementById("acceptHeaderAudioLabel");
const acceptHeaderVideoLabel = document.getElementById("acceptHeaderVideoLabel");
const acceptHeaderFontLabel = document.getElementById("acceptHeaderFontLabel");
const acceptHeaderStylesheetLabel = document.getElementById("acceptHeaderStylesheetLabel");
const acceptHeaderImageLabel = document.getElementById("acceptHeaderImageLabel");
const saveRawPageLabel = document.getElementById("saveRawPageLabel");
const insertMetaCSPLabel = document.getElementById("insertMetaCSPLabel");
const saveToClipboardLabel = document.getElementById("saveToClipboardLabel");
const saveToFilesystemLabel = document.getElementById("saveToFilesystemLabel");
const sharePageLabel = document.getElementById("sharePageLabel");
const addProofLabel = document.getElementById("addProofLabel");
const woleetKeyLabel = document.getElementById("woleetKeyLabel");
const saveToGDriveLabel = document.getElementById("saveToGDriveLabel");
const saveToDropboxLabel = document.getElementById("saveToDropboxLabel");
const saveWithWebDAVLabel = document.getElementById("saveWithWebDAVLabel");
const webDAVURLLabel = document.getElementById("webDAVURLLabel");
const webDAVUserLabel = document.getElementById("webDAVUserLabel");
const webDAVPasswordLabel = document.getElementById("webDAVPasswordLabel");
const saveToGitHubLabel = document.getElementById("saveToGitHubLabel");
const githubTokenLabel = document.getElementById("githubTokenLabel");
const githubUserLabel = document.getElementById("githubUserLabel");
const githubRepositoryLabel = document.getElementById("githubRepositoryLabel");
const githubBranchLabel = document.getElementById("githubBranchLabel");
const saveWithCompanionLabel = document.getElementById("saveWithCompanionLabel");
const compressHTMLLabel = document.getElementById("compressHTMLLabel");
const insertTextBodyLabel = document.getElementById("insertTextBodyLabel");
const insertEmbeddedImageLabel = document.getElementById("insertEmbeddedImageLabel");
const compressCSSLabel = document.getElementById("compressCSSLabel");
const moveStylesInHeadLabel = document.getElementById("moveStylesInHeadLabel");
const loadDeferredImagesLabel = document.getElementById("loadDeferredImagesLabel");
const loadDeferredImagesMaxIdleTimeLabel = document.getElementById("loadDeferredImagesMaxIdleTimeLabel");
const loadDeferredImagesKeepZoomLevelLabel = document.getElementById("loadDeferredImagesKeepZoomLevelLabel");
const loadDeferredImagesDispatchScrollEventLabel = document.getElementById("loadDeferredImagesDispatchScrollEventLabel");
const loadDeferredImagesBeforeFramesLabel = document.getElementById("loadDeferredImagesBeforeFramesLabel");
const addMenuEntryLabel = document.getElementById("addMenuEntryLabel");
const filenameTemplateLabel = document.getElementById("filenameTemplateLabel");
const filenameMaxLengthLabel = document.getElementById("filenameMaxLengthLabel");
const filenameMaxLengthBytesUnitLabel = document.getElementById("filenameMaxLengthBytesUnitLabel");
const filenameMaxLengthCharsUnitLabel = document.getElementById("filenameMaxLengthCharsUnitLabel");
const filenameReplacementCharacterLabel = document.getElementById("filenameReplacementCharacterLabel");
const replaceEmojisInFilenameLabel = document.getElementById("replaceEmojisInFilenameLabel");
const saveFilenameTemplateDataLabel = document.getElementById("saveFilenameTemplateDataLabel");
const shadowEnabledLabel = document.getElementById("shadowEnabledLabel");
const setMaxResourceSizeLabel = document.getElementById("setMaxResourceSizeLabel");
const maxResourceSizeLabel = document.getElementById("maxResourceSizeLabel");
const setMaxResourceDelayLabel = document.getElementById("setMaxResourceDelayLabel");
const maxResourceDelayLabel = document.getElementById("maxResourceDelayLabel");
const confirmFilenameLabel = document.getElementById("confirmFilenameLabel");
const filenameConflictActionLabel = document.getElementById("filenameConflictActionLabel");
const filenameConflictActionUniquifyLabel = document.getElementById("filenameConflictActionUniquifyLabel");
const filenameConflictActionOverwriteLabel = document.getElementById("filenameConflictActionOverwriteLabel");
const filenameConflictActionPromptLabel = document.getElementById("filenameConflictActionPromptLabel");
const filenameConflictActionSkipLabel = document.getElementById("filenameConflictActionSkipLabel");
const displayInfobarLabel = document.getElementById("displayInfobarLabel");
const displayStatsLabel = document.getElementById("displayStatsLabel");
const backgroundSaveLabel = document.getElementById("backgroundSaveLabel");
const autoSaveDelayLabel = document.getElementById("autoSaveDelayLabel");
const autoSaveLoadLabel = document.getElementById("autoSaveLoadLabel");
const autoSaveUnloadLabel = document.getElementById("autoSaveUnloadLabel");
const autoSaveLoadOrUnloadLabel = document.getElementById("autoSaveLoadOrUnloadLabel");
const autoSaveDiscardLabel = document.getElementById("autoSaveDiscardLabel");
const autoSaveRemoveLabel = document.getElementById("autoSaveRemoveLabel");
const autoSaveRepeatLabel = document.getElementById("autoSaveRepeatLabel");
const autoSaveRepeatDelayLabel = document.getElementById("autoSaveRepeatDelayLabel");
const autoSaveExternalSaveLabel = document.getElementById("autoSaveExternalSaveLabel");
const removeAlternativeFontsLabel = document.getElementById("removeAlternativeFontsLabel");
const removeAlternativeImagesLabel = document.getElementById("removeAlternativeImagesLabel");
const removeAlternativeMediasLabel = document.getElementById("removeAlternativeMediasLabel");
const saveCreatedBookmarksLabel = document.getElementById("saveCreatedBookmarksLabel");
const passReferrerOnErrorLabel = document.getElementById("passReferrerOnErrorLabel");
const replaceBookmarkURLLabel = document.getElementById("replaceBookmarkURLLabel");
const allowedBookmarkFoldersLabel = document.getElementById("allowedBookmarkFoldersLabel");
const ignoredBookmarkFoldersLabel = document.getElementById("ignoredBookmarkFoldersLabel");
const createRootDirectoryLabel = document.getElementById("createRootDirectoryLabel");
const preventAppendedDataLabel = document.getElementById("preventAppendedDataLabel");
const passwordLabel = document.getElementById("passwordLabel");
const titleLabel = document.getElementById("titleLabel");
const userInterfaceLabel = document.getElementById("userInterfaceLabel");
const filenameLabel = document.getElementById("filenameLabel");
const htmlContentLabel = document.getElementById("htmlContentLabel");
const fileFormatLabel = document.getElementById("fileFormatLabel");
const fileFormatSelectHTMLLabel = document.getElementById("fileFormatSelectHTMLLabel");
const fileFormatSelectSelfExtractingUniversalLabel = document.getElementById("fileFormatSelectSelfExtractingUniversalLabel");
const fileFormatSelectSelfExtractingLabel = document.getElementById("fileFormatSelectSelfExtractingLabel");
const fileFormatSelectZIPLabel = document.getElementById("fileFormatSelectZIPLabel");
const fileFormatSelectLabel = document.getElementById("fileFormatSelectLabel");
const infobarLabel = document.getElementById("infobarLabel");
const imagesLabel = document.getElementById("imagesLabel");
const stylesheetsLabel = document.getElementById("stylesheetsLabel");
const fontsLabel = document.getElementById("fontsLabel");
const networkLabel = document.getElementById("networkLabel");
const blockResourcesLabel = document.getElementById("blockResourcesLabel");
const acceptHeadersLabel = document.getElementById("acceptHeadersLabel");
const destinationLabel = document.getElementById("destinationLabel");
const bookmarksLabel = document.getElementById("bookmarksLabel");
const autoSaveLabel = document.getElementById("autoSaveLabel");
const autoSettingsLabel = document.getElementById("autoSettingsLabel");
const autoSettingsUrlLabel = document.getElementById("autoSettingsUrlLabel");
const autoSettingsProfileLabel = document.getElementById("autoSettingsProfileLabel");
const autoSettingsAutoSaveProfileLabel = document.getElementById("autoSettingsAutoSaveProfileLabel");
const showAllProfilesLabel = document.getElementById("showAllProfilesLabel");
const showAutoSaveProfileLabel = document.getElementById("showAutoSaveProfileLabel");
const groupDuplicateImagesLabel = document.getElementById("groupDuplicateImagesLabel");
const confirmInfobarLabel = document.getElementById("confirmInfobarLabel");
const autoCloseLabel = document.getElementById("autoCloseLabel");
const editorLabel = document.getElementById("editorLabel");
const openEditorLabel = document.getElementById("openEditorLabel");
const openSavedPageLabel = document.getElementById("openSavedPageLabel");
const autoOpenEditorLabel = document.getElementById("autoOpenEditorLabel");
const defaultEditorModeLabel = document.getElementById("defaultEditorModeLabel");
const applySystemThemeLabel = document.getElementById("applySystemThemeLabel");
const warnUnsavedPageLabel = document.getElementById("warnUnsavedPageLabel");
const displayInfobarInEditorLabel = document.getElementById("displayInfobarInEditorLabel");
const infobarTemplateLabel = document.getElementById("infobarTemplateLabel");
const blockMixedContentLabel = document.getElementById("blockMixedContentLabel");
const saveOriginalURLsLabel = document.getElementById("saveOriginalURLsLabel");
const includeInfobarLabel = document.getElementById("includeInfobarLabel");
const removeInfobarSavedDateLabel = document.getElementById("removeInfobarSavedDateLabel");
const miscLabel = document.getElementById("miscLabel");
const helpLabel = document.getElementById("helpLabel");
const synchronizeLabel = document.getElementById("synchronizeLabel");
const addProfileButton = document.getElementById("addProfileButton");
const deleteProfileButton = document.getElementById("deleteProfileButton");
const renameProfileButton = document.getElementById("renameProfileButton");
const resetButton = document.getElementById("resetButton");
const exportButton = document.getElementById("exportButton");
const importButton = document.getElementById("importButton");
const fileInput = document.getElementById("fileInput");
const profileNamesInput = document.getElementById("profileNamesInput");
const removeHiddenElementsInput = document.getElementById("removeHiddenElementsInput");
const removeUnusedStylesInput = document.getElementById("removeUnusedStylesInput");
const removeUnusedFontsInput = document.getElementById("removeUnusedFontsInput");
const removeFramesInput = document.getElementById("removeFramesInput");
const blockScriptsInput = document.getElementById("blockScriptsInput");
const blockVideosInput = document.getElementById("blockVideosInput");
const blockAudiosInput = document.getElementById("blockAudiosInput");
const blockFontsInput = document.getElementById("blockFontsInput");
const blockStylesheetsInput = document.getElementById("blockStylesheetsInput");
const blockImagesInput = document.getElementById("blockImagesInput");
const acceptHeaderDocumentInput = document.getElementById("acceptHeaderDocumentInput");
const acceptHeaderScriptInput = document.getElementById("acceptHeaderScriptInput");
const acceptHeaderAudioInput = document.getElementById("acceptHeaderAudioInput");
const acceptHeaderVideoInput = document.getElementById("acceptHeaderVideoInput");
const acceptHeaderFontInput = document.getElementById("acceptHeaderFontInput");
const acceptHeaderStylesheetInput = document.getElementById("acceptHeaderStylesheetInput");
const acceptHeaderImageInput = document.getElementById("acceptHeaderImageInput");
const saveRawPageInput = document.getElementById("saveRawPageInput");
const insertMetaCSPInput = document.getElementById("insertMetaCSPInput");
const saveToClipboardInput = document.getElementById("saveToClipboardInput");
const addProofInput = document.getElementById("addProofInput");
const woleetKeyInput = document.getElementById("woleetKeyInput");
const saveToGDriveInput = document.getElementById("saveToGDriveInput");
const saveToDropboxInput = document.getElementById("saveToDropboxInput");
const saveWithWebDAVInput = document.getElementById("saveWithWebDAVInput");
const webDAVURLInput = document.getElementById("webDAVURLInput");
const webDAVUserInput = document.getElementById("webDAVUserInput");
const webDAVPasswordInput = document.getElementById("webDAVPasswordInput");
const saveToGitHubInput = document.getElementById("saveToGitHubInput");
const githubTokenInput = document.getElementById("githubTokenInput");
const githubUserInput = document.getElementById("githubUserInput");
const githubRepositoryInput = document.getElementById("githubRepositoryInput");
const githubBranchInput = document.getElementById("githubBranchInput");
const saveWithCompanionInput = document.getElementById("saveWithCompanionInput");
const sharePageInput = document.getElementById("sharePageInput");
const saveToFilesystemInput = document.getElementById("saveToFilesystemInput");
const compressHTMLInput = document.getElementById("compressHTMLInput");
const insertTextBodyInput = document.getElementById("insertTextBodyInput");
const insertEmbeddedImageInput = document.getElementById("insertEmbeddedImageInput");
const compressCSSInput = document.getElementById("compressCSSInput");
const moveStylesInHeadInput = document.getElementById("moveStylesInHeadInput");
const loadDeferredImagesInput = document.getElementById("loadDeferredImagesInput");
const loadDeferredImagesMaxIdleTimeInput = document.getElementById("loadDeferredImagesMaxIdleTimeInput");
const loadDeferredImagesKeepZoomLevelInput = document.getElementById("loadDeferredImagesKeepZoomLevelInput");
const loadDeferredImagesDispatchScrollEventInput = document.getElementById("loadDeferredImagesDispatchScrollEventInput");
const loadDeferredImagesBeforeFramesInput = document.getElementById("loadDeferredImagesBeforeFramesInput");
const contextMenuEnabledInput = document.getElementById("contextMenuEnabledInput");
const filenameTemplateInput = document.getElementById("filenameTemplateInput");
const filenameMaxLengthInput = document.getElementById("filenameMaxLengthInput");
const filenameMaxLengthUnitInput = document.getElementById("filenameMaxLengthUnitInput");
const filenameReplacementCharacterInput = document.getElementById("filenameReplacementCharacterInput");
const replaceEmojisInFilenameInput = document.getElementById("replaceEmojisInFilenameInput");
const saveFilenameTemplateDataInput = document.getElementById("saveFilenameTemplateDataInput");
const shadowEnabledInput = document.getElementById("shadowEnabledInput");
const maxResourceSizeInput = document.getElementById("maxResourceSizeInput");
const maxResourceSizeEnabledInput = document.getElementById("maxResourceSizeEnabledInput");
const maxResourceDelayInput = document.getElementById("maxResourceDelayInput");
const maxResourceDelayEnabledInput = document.getElementById("maxResourceDelayEnabledInput");
const confirmFilenameInput = document.getElementById("confirmFilenameInput");
const filenameConflictActionInput = document.getElementById("filenameConflictActionInput");
const displayInfobarInput = document.getElementById("displayInfobarInput");
const displayStatsInput = document.getElementById("displayStatsInput");
const backgroundSaveInput = document.getElementById("backgroundSaveInput");
const autoSaveDelayInput = document.getElementById("autoSaveDelayInput");
const autoSaveLoadInput = document.getElementById("autoSaveLoadInput");
const autoSaveUnloadInput = document.getElementById("autoSaveUnloadInput");
const autoSaveDiscardInput = document.getElementById("autoSaveDiscardInput");
const autoSaveRemoveInput = document.getElementById("autoSaveRemoveInput");
const autoSaveLoadOrUnloadInput = document.getElementById("autoSaveLoadOrUnloadInput");
const autoSaveRepeatInput = document.getElementById("autoSaveRepeatInput");
const autoSaveRepeatDelayInput = document.getElementById("autoSaveRepeatDelayInput");
const autoSaveExternalSaveInput = document.getElementById("autoSaveExternalSaveInput");
const removeAlternativeFontsInput = document.getElementById("removeAlternativeFontsInput");
const removeAlternativeImagesInput = document.getElementById("removeAlternativeImagesInput");
const removeAlternativeMediasInput = document.getElementById("removeAlternativeMediasInput");
const saveCreatedBookmarksInput = document.getElementById("saveCreatedBookmarksInput");
const passReferrerOnErrorInput = document.getElementById("passReferrerOnErrorInput");
const replaceBookmarkURLInput = document.getElementById("replaceBookmarkURLInput");
const allowedBookmarkFoldersInput = document.getElementById("allowedBookmarkFoldersInput");
const ignoredBookmarkFoldersInput = document.getElementById("ignoredBookmarkFoldersInput");
const fileFormatSelectInput = document.getElementById("fileFormatSelectInput");
const createRootDirectoryInput = document.getElementById("createRootDirectoryInput");
const preventAppendedDataInput = document.getElementById("preventAppendedDataInput");
const passwordInput = document.getElementById("passwordInput");
const groupDuplicateImagesInput = document.getElementById("groupDuplicateImagesInput");
const infobarTemplateInput = document.getElementById("infobarTemplateInput");
const blockMixedContentInput = document.getElementById("blockMixedContentInput");
const saveOriginalURLsInput = document.getElementById("saveOriginalURLsInput");
const includeInfobarInput = document.getElementById("includeInfobarInput");
const removeInfobarSavedDateInput = document.getElementById("removeInfobarSavedDateInput");
const confirmInfobarInput = document.getElementById("confirmInfobarInput");
const autoCloseInput = document.getElementById("autoCloseInput");
const openEditorInput = document.getElementById("openEditorInput");
const openSavedPageInput = document.getElementById("openSavedPageInput");
const autoOpenEditorInput = document.getElementById("autoOpenEditorInput");
const defaultEditorModeInput = document.getElementById("defaultEditorModeInput");
const defaultEditorModeNormalLabel = document.getElementById("defaultEditorModeNormalLabel");
const defaultEditorModeEditLabel = document.getElementById("defaultEditorModeEditLabel");
const defaultEditorModeFormatLabel = document.getElementById("defaultEditorModeFormatLabel");
const defaultEditorModeCutLabel = document.getElementById("defaultEditorModeCutLabel");
const defaultEditorModeCutExternalLabel = document.getElementById("defaultEditorModeCutExternalLabel");
const applySystemThemeInput = document.getElementById("applySystemThemeInput");
const warnUnsavedPageInput = document.getElementById("warnUnsavedPageInput");
const displayInfobarInEditorInput = document.getElementById("displayInfobarInEditorInput");
const expandAllButton = document.getElementById("expandAllButton");
const rulesDeleteAllButton = document.getElementById("rulesDeleteAllButton");
const ruleUrlInput = document.getElementById("ruleUrlInput");
const ruleProfileInput = document.getElementById("ruleProfileInput");
const ruleAutoSaveProfileInput = document.getElementById("ruleAutoSaveProfileInput");
const ruleEditProfileInput = document.getElementById("ruleEditProfileInput");
const ruleEditAutoSaveProfileInput = document.getElementById("ruleEditAutoSaveProfileInput");
const ruleAddButton = document.getElementById("ruleAddButton");
const rulesElement = document.querySelector(".rules-table");
const rulesContainerElement = document.querySelector(".rules-table-container");
const ruleEditUrlInput = document.getElementById("ruleEditUrlInput");
const ruleEditButton = document.getElementById("ruleEditButton");
const createURLElement = rulesElement.querySelector(".rule-create");
const showAllProfilesInput = document.getElementById("showAllProfilesInput");
const showAutoSaveProfileInput = document.getElementById("showAutoSaveProfileInput");
const synchronizeInput = document.getElementById("synchronizeInput");
const resetAllButton = document.getElementById("resetAllButton");
const resetCurrentButton = document.getElementById("resetCurrentButton");
const resetCancelButton = document.getElementById("resetCancelButton");
const confirmButton = document.getElementById("confirmButton");
const cancelButton = document.getElementById("cancelButton");
const promptInput = document.getElementById("promptInput");
const promptCancelButton = document.getElementById("promptCancelButton");
const promptConfirmButton = document.getElementById("promptConfirmButton");
const manifest = browser.runtime.getManifest();
const requestPermissionIdentity = manifest.optional_permissions && manifest.optional_permissions.includes("identity");

let sidePanelDisplay;
if (location.href.endsWith("#side-panel")) {
	sidePanelDisplay = true;
	document.querySelector(".options-title").remove();
	document.documentElement.classList.add("side-panel");
}
browser.runtime.onMessage.addListener(message => {
	if (message.method == "options.refresh" || (message.method == "options.refreshPanel" && sidePanelDisplay)) {
		refresh(message.profileName);
	}
});
let pendingSave = Promise.resolve();
let autoSaveProfileChanged;
ruleProfileInput.onchange = () => {
	if (!autoSaveProfileChanged && ruleProfileInput.value != CURRENT_PROFILE_NAME) {
		ruleAutoSaveProfileInput.value = ruleProfileInput.value;
	}
};
ruleAutoSaveProfileInput.onchange = () => {
	autoSaveProfileChanged = true;
};
rulesDeleteAllButton.addEventListener("click", async event => {
	if (await confirm(browser.i18n.getMessage("optionsDeleteDisplayedRulesConfirm"), event.clientY - 100)) {
		await browser.runtime.sendMessage({ method: "config.deleteRules", profileName: !showAllProfilesInput.checked && profileNamesInput.value });
		await refresh();
		await refreshExternalComponents();
	}
}, false);
createURLElement.onsubmit = async event => {
	event.preventDefault();
	try {
		await browser.runtime.sendMessage({ method: "config.addRule", url: ruleUrlInput.value, profileName: ruleProfileInput.value, autoSaveProfileName: ruleAutoSaveProfileInput.value });
	} catch (error) {
		// ignored
	}
	ruleUrlInput.value = "";
	ruleProfileInput.value = ruleAutoSaveProfileInput.value = DEFAULT_PROFILE_NAME;
	autoSaveProfileChanged = false;
	await refresh();
	await refreshExternalComponents();
	ruleUrlInput.focus();
};
ruleUrlInput.onclick = ruleUrlInput.onkeyup = ruleUrlInput.onchange = async () => {
	ruleAddButton.disabled = !ruleUrlInput.value;
	const rules = await browser.runtime.sendMessage({ method: "config.getRules" });
	if (rules.find(rule => rule.url == ruleUrlInput.value)) {
		ruleAddButton.disabled = true;
	}
};
ruleEditUrlInput.onclick = ruleEditUrlInput.onkeyup = ruleEditUrlInput.onchange = async () => {
	ruleEditButton.disabled = !ruleEditUrlInput.value;
	const rules = await browser.runtime.sendMessage({ method: "config.getRules" });
	if (rules.find(rule => rule.url == ruleEditUrlInput.value)) {
		ruleEditButton.disabled = true;
	}
};
if (getLocalStorageItem("optionShowAutoSaveProfile")) {
	showAutoSaveProfileInput.checked = true;
	rulesContainerElement.classList.remove("compact");
}
showAutoSaveProfileInput.addEventListener("click", () => {
	if (showAutoSaveProfileInput.checked) {
		setLocalStorageItem("optionShowAutoSaveProfile", 1);
		rulesContainerElement.classList.remove("compact");
	} else {
		removeLocalStorageItem("optionShowAutoSaveProfile");
		rulesContainerElement.classList.add("compact");
	}
}, false);
if (getLocalStorageItem("optionShowAllProfiles")) {
	showAllProfilesInput.checked = true;
}
showAllProfilesInput.addEventListener("click", () => {
	if (showAllProfilesInput.checked) {
		setLocalStorageItem("optionShowAllProfiles", 1);
	} else {
		removeLocalStorageItem("optionShowAllProfiles");
	}
}, false);
addProfileButton.addEventListener("click", async event => {
	const profileName = await prompt(browser.i18n.getMessage("profileAddPrompt"), event.clientY + 50);
	if (profileName) {
		try {
			await browser.runtime.sendMessage({ method: "config.createProfile", profileName, fromProfileName: profileNamesInput.value });
		} catch (error) {
			// ignored
		}
		if (sidePanelDisplay) {
			await refresh();
		} else {
			await refresh(profileName);
		}
		await refreshExternalComponents();
	}
}, false);
deleteProfileButton.addEventListener("click", async event => {
	if (await confirm(browser.i18n.getMessage("profileDeleteConfirm"), event.clientY + 50)) {
		try {
			await browser.runtime.sendMessage({ method: "config.deleteProfile", profileName: profileNamesInput.value });
		} catch (error) {
			// ignored
		}
		profileNamesInput.value = null;
		await refresh();
		await refreshExternalComponents();
	}
}, false);
renameProfileButton.addEventListener("click", async event => {
	const profileName = await prompt(browser.i18n.getMessage("profileRenamePrompt"), event.clientY + 50, profileNamesInput.value);
	if (profileName) {
		try {
			await browser.runtime.sendMessage({ method: "config.renameProfile", profileName: profileNamesInput.value, newProfileName: profileName });
		} catch (error) {
			// ignored
		}
		await refresh(profileName);
		await refreshExternalComponents();
	}
}, false);
resetButton.addEventListener("click", async event => {
	const choice = await reset(event.clientY - 250);
	if (choice) {
		if (choice == "all") {
			await browser.runtime.sendMessage({ method: "config.resetProfiles" });
			await refresh(DEFAULT_PROFILE_NAME);
			await refreshExternalComponents();
		}
		if (choice == "current") {
			await browser.runtime.sendMessage({ method: "config.resetProfile", profileName: profileNamesInput.value });
			await refresh();
			await refreshExternalComponents();
		}
		await update();
	}
}, false);
exportButton.addEventListener("click", async () => {
	const response = await browser.runtime.sendMessage({ method: "config.exportConfig" });
	if (response.filename && response.textContent) {
		const link = document.createElement("a");
		link.download = response.filename;
		link.href = "data:application/octet-stream," + response.textContent;
		link.target = "_blank";
		link.dispatchEvent(new MouseEvent("click"));
	}
}, false);
importButton.addEventListener("click", () => {
	fileInput.onchange = async () => {
		if (fileInput.files.length) {
			const reader = new FileReader();
			reader.readAsText(fileInput.files[0]);
			const serializedConfig = await new Promise((resolve, reject) => {
				reader.addEventListener("load", () => resolve(reader.result), false);
				reader.addEventListener("error", reject, false);
			});
			const config = JSON.parse(serializedConfig);
			Object.keys(config.profiles).forEach(profileName => {
				const profile = config.profiles[profileName];
				if (profile.saveToGDrive && !profile.forceWebAuthFlow) {
					profile.saveToGDrive = false;
				}
				profile.saveToClipboard = false;
				profile.saveWithCompanion = false;
				profile.saveCreatedBookmarks = false;
				profile.passReferrerOnError = false;
			});
			await browser.runtime.sendMessage({ method: "config.importConfig", config });
			await refresh(DEFAULT_PROFILE_NAME);
			await refreshExternalComponents();
			fileInput.value = "";
		}
	};
	fileInput.click();
}, false);
autoSaveUnloadInput.addEventListener("click", async () => {
	if (!autoSaveLoadInput.checked && !autoSaveUnloadInput.checked) {
		autoSaveLoadOrUnloadInput.checked = true;
	}
}, false);
autoSaveLoadInput.addEventListener("click", async () => {
	if (!autoSaveLoadInput.checked && !autoSaveUnloadInput.checked) {
		autoSaveLoadOrUnloadInput.checked = true;
	}
}, false);
autoSaveLoadOrUnloadInput.addEventListener("click", async () => {
	if (autoSaveLoadOrUnloadInput.checked) {
		autoSaveUnloadInput.checked = autoSaveLoadInput.checked = false;
	} else {
		autoSaveUnloadInput.checked = false;
	}
}, false);
expandAllButton.addEventListener("click", () => {
	if (expandAllButton.className) {
		expandAllButton.className = "";
	} else {
		expandAllButton.className = "opened";
	}
	document.querySelectorAll("details").forEach(detailElement => detailElement.open = Boolean(expandAllButton.className));
}, false);
saveToFilesystemInput.addEventListener("click", () => disableDestinationPermissions(["clipboardWrite", "nativeMessaging"]), false);
saveToClipboardInput.addEventListener("click", () => disableDestinationPermissions(["nativeMessaging"]), false);
saveWithCompanionInput.addEventListener("click", () => disableDestinationPermissions(["clipboardWrite"]), false);
saveToGDriveInput.addEventListener("click", () => disableDestinationPermissions(["clipboardWrite", "nativeMessaging"], false), false);
saveToDropboxInput.addEventListener("click", () => disableDestinationPermissions(["clipboardWrite", "nativeMessaging"], true, false), false);
saveWithWebDAVInput.addEventListener("click", () => disableDestinationPermissions(["clipboardWrite", "nativeMessaging"]), false);
sharePageInput.addEventListener("click", () => disableDestinationPermissions(["clipboardWrite", "nativeMessaging"]), false);
saveCreatedBookmarksInput.addEventListener("click", saveCreatedBookmarks, false);
passReferrerOnErrorInput.addEventListener("click", passReferrerOnError, false);
autoSaveExternalSaveInput.addEventListener("click", () => enableExternalSave(autoSaveExternalSaveInput), false);
saveWithCompanionInput.addEventListener("click", () => enableExternalSave(saveWithCompanionInput), false);
saveToClipboardInput.addEventListener("click", onClickSaveToClipboard, false);
saveToGDriveInput.addEventListener("click", onClickSaveToGDrive, false);
addProofInput.addEventListener("click", async event => {
	if (addProofInput.checked) {
		addProofInput.checked = false;
		if (await confirm(browser.i18n.getMessage("optionsAddProofConfirm"), event.clientY - 100)) {
			addProofInput.checked = true;
			woleetKeyInput.disabled = false;
		}
		await update();
	}
});
browser.runtime.sendMessage({ method: "config.isSync" }).then(data => synchronizeInput.checked = data.sync);
synchronizeInput.addEventListener("click", async () => {
	if (synchronizeInput.checked) {
		await browser.runtime.sendMessage({ method: "config.enableSync" });
		await refresh(DEFAULT_PROFILE_NAME);
	} else {
		await browser.runtime.sendMessage({ method: "config.disableSync" });
		await refresh();
	}
}, false);
document.body.onchange = async event => {
	let target = event.target;
	if (target != ruleUrlInput &&
		target != ruleProfileInput &&
		target != ruleAutoSaveProfileInput &&
		target != ruleEditUrlInput &&
		target != ruleEditProfileInput &&
		target != ruleEditAutoSaveProfileInput &&
		target != showAutoSaveProfileInput &&
		target != saveCreatedBookmarksInput &&
		target != passReferrerOnErrorInput) {
		if (target != profileNamesInput && target != showAllProfilesInput) {
			await update();
		}
		if (target == profileNamesInput) {
			await refresh(profileNamesInput.value);
			if (sidePanelDisplay) {
				const tabsData = await browser.runtime.sendMessage({ method: "tabsData.get" });
				tabsData.profileName = profileNamesInput.value;
				await browser.runtime.sendMessage({ method: "tabsData.set", tabsData: tabsData });
				await browser.runtime.sendMessage({ method: "ui.refreshMenu" });
			}
		} else {
			if (target == contextMenuEnabledInput) {
				await browser.runtime.sendMessage({ method: "ui.refreshMenu" });
			}
			if (target == openEditorInput) {
				await browser.runtime.sendMessage({ method: "ui.refreshMenu" });
			}
			await refresh();
		}
	}
};

addProfileButton.title = browser.i18n.getMessage("profileAddButtonTooltip");
deleteProfileButton.title = browser.i18n.getMessage("profileDeleteButtonTooltip");
renameProfileButton.title = browser.i18n.getMessage("profileRenameButtonTooltip");
removeHiddenElementsLabel.textContent = browser.i18n.getMessage("optionRemoveHiddenElements");
removeUnusedStylesLabel.textContent = browser.i18n.getMessage("optionRemoveUnusedStyles");
removeUnusedFontsLabel.textContent = browser.i18n.getMessage("optionRemoveUnusedFonts");
removeFramesLabel.textContent = browser.i18n.getMessage("optionRemoveFrames");
blockScriptsLabel.textContent = browser.i18n.getMessage("optionResourceScript");
blockAudiosLabel.textContent = browser.i18n.getMessage("optionResourceAudio");
blockVideosLabel.textContent = browser.i18n.getMessage("optionResourceVideo");
blockFontsLabel.textContent = browser.i18n.getMessage("optionResourceFont");
blockStylesheetsLabel.textContent = browser.i18n.getMessage("optionResourceStylesheet");
blockImagesLabel.textContent = browser.i18n.getMessage("optionResourceImage");
acceptHeaderDocumentLabel.textContent = browser.i18n.getMessage("optionResourceDocument");
acceptHeaderScriptLabel.textContent = browser.i18n.getMessage("optionResourceScript");
acceptHeaderAudioLabel.textContent = browser.i18n.getMessage("optionResourceAudio");
acceptHeaderVideoLabel.textContent = browser.i18n.getMessage("optionResourceVideo");
acceptHeaderFontLabel.textContent = browser.i18n.getMessage("optionResourceFont");
acceptHeaderStylesheetLabel.textContent = browser.i18n.getMessage("optionResourceStylesheet");
acceptHeaderImageLabel.textContent = browser.i18n.getMessage("optionResourceImage");
saveRawPageLabel.textContent = browser.i18n.getMessage("optionSaveRawPage");
insertMetaCSPLabel.textContent = browser.i18n.getMessage("optionInsertMetaCSP");
saveToClipboardLabel.textContent = browser.i18n.getMessage("optionSaveToClipboard");
saveToFilesystemLabel.textContent = browser.i18n.getMessage("optionSaveToFilesystem");
sharePageLabel.textContent = browser.i18n.getMessage("optionSharePage");
addProofLabel.textContent = browser.i18n.getMessage("optionAddProof");
woleetKeyLabel.textContent = browser.i18n.getMessage("optionWoleetKey");
saveToGDriveLabel.textContent = browser.i18n.getMessage("optionSaveToGDrive");
saveToDropboxLabel.textContent = browser.i18n.getMessage("optionSaveToDropbox");
saveWithWebDAVLabel.textContent = browser.i18n.getMessage("optionSaveWithWebDAV");
webDAVURLLabel.textContent = browser.i18n.getMessage("optionWebDAVURL");
webDAVUserLabel.textContent = browser.i18n.getMessage("optionWebDAVUser");
webDAVPasswordLabel.textContent = browser.i18n.getMessage("optionWebDAVPassword");
saveToGitHubLabel.textContent = browser.i18n.getMessage("optionSaveToGitHub");
githubTokenLabel.textContent = browser.i18n.getMessage("optionGitHubToken");
githubUserLabel.textContent = browser.i18n.getMessage("optionGitHubUser");
githubRepositoryLabel.textContent = browser.i18n.getMessage("optionGitHubRepository");
githubBranchLabel.textContent = browser.i18n.getMessage("optionGitHubBranch");
saveWithCompanionLabel.textContent = browser.i18n.getMessage("optionSaveWithCompanion");
compressHTMLLabel.textContent = browser.i18n.getMessage("optionCompressHTML");
insertTextBodyLabel.textContent = browser.i18n.getMessage("optionInsertTextBody");
insertEmbeddedImageLabel.textContent = browser.i18n.getMessage("optionInsertEmbeddedImage");
compressCSSLabel.textContent = browser.i18n.getMessage("optionCompressCSS");
moveStylesInHeadLabel.textContent = browser.i18n.getMessage("optionMoveStylesInHead");
loadDeferredImagesLabel.textContent = browser.i18n.getMessage("optionLoadDeferredImages");
loadDeferredImagesMaxIdleTimeLabel.textContent = browser.i18n.getMessage("optionLoadDeferredImagesMaxIdleTime");
loadDeferredImagesKeepZoomLevelLabel.textContent = browser.i18n.getMessage("optionLoadDeferredImagesKeepZoomLevel");
loadDeferredImagesDispatchScrollEventLabel.textContent = browser.i18n.getMessage("optionLoadDeferredImagesDispatchScrollEvent");
loadDeferredImagesBeforeFramesLabel.textContent = browser.i18n.getMessage("optionLoadDeferredImagesBeforeFrames");
addMenuEntryLabel.textContent = browser.i18n.getMessage("optionAddMenuEntry");
filenameTemplateLabel.textContent = browser.i18n.getMessage("optionFilenameTemplate");
filenameMaxLengthLabel.textContent = browser.i18n.getMessage("optionFilenameMaxLength");
filenameMaxLengthBytesUnitLabel.textContent = browser.i18n.getMessage("optionFilenameMaxLengthBytesUnit");
filenameMaxLengthCharsUnitLabel.textContent = browser.i18n.getMessage("optionFilenameMaxLengthCharsUnit");
filenameReplacementCharacterLabel.textContent = browser.i18n.getMessage("optionFilenameReplacementCharacter");
replaceEmojisInFilenameLabel.textContent = browser.i18n.getMessage("optionReplaceEmojisInFilename");
saveFilenameTemplateDataLabel.textContent = browser.i18n.getMessage("optionSaveFilenameTemplateData");
shadowEnabledLabel.textContent = browser.i18n.getMessage("optionDisplayShadow");
setMaxResourceSizeLabel.textContent = browser.i18n.getMessage("optionSetMaxResourceSize");
maxResourceSizeLabel.textContent = browser.i18n.getMessage("optionMaxResourceSize");
setMaxResourceDelayLabel.textContent = browser.i18n.getMessage("optionSetMaxResourceDelay");
maxResourceDelayLabel.textContent = browser.i18n.getMessage("optionMaxResourceDelay");
confirmFilenameLabel.textContent = browser.i18n.getMessage("optionConfirmFilename");
filenameConflictActionLabel.textContent = browser.i18n.getMessage("optionFilenameConflictAction");
filenameConflictActionUniquifyLabel.textContent = browser.i18n.getMessage("optionFilenameConflictActionUniquify");
filenameConflictActionOverwriteLabel.textContent = browser.i18n.getMessage("optionFilenameConflictActionOverwrite");
filenameConflictActionPromptLabel.textContent = browser.i18n.getMessage("optionFilenameConflictActionPrompt");
filenameConflictActionSkipLabel.textContent = browser.i18n.getMessage("optionFilenameConflictActionSkip");
displayInfobarLabel.textContent = browser.i18n.getMessage("optionDisplayInfobar");
displayStatsLabel.textContent = browser.i18n.getMessage("optionDisplayStats");
backgroundSaveLabel.textContent = browser.i18n.getMessage("optionBackgroundSave");
autoSaveDelayLabel.textContent = browser.i18n.getMessage("optionAutoSaveDelay");
autoSaveLoadLabel.textContent = browser.i18n.getMessage("optionAutoSaveLoad");
autoSaveUnloadLabel.textContent = browser.i18n.getMessage("optionAutoSaveUnload");
autoSaveLoadOrUnloadLabel.textContent = browser.i18n.getMessage("optionAutoSaveLoadOrUnload");
autoSaveDiscardLabel.textContent = browser.i18n.getMessage("optionAutoSaveDiscard");
autoSaveRemoveLabel.textContent = browser.i18n.getMessage("optionAutoSaveRemove");
autoSaveRepeatLabel.textContent = browser.i18n.getMessage("optionAutoSaveRepeat");
autoSaveRepeatDelayLabel.textContent = browser.i18n.getMessage("optionAutoSaveRepeatDelay");
autoSaveExternalSaveLabel.textContent = browser.i18n.getMessage("optionAutoSaveExternalSave");
removeAlternativeFontsLabel.textContent = browser.i18n.getMessage("optionRemoveAlternativeFonts");
removeAlternativeImagesLabel.textContent = browser.i18n.getMessage("optionRemoveAlternativeImages");
removeAlternativeMediasLabel.textContent = browser.i18n.getMessage("optionRemoveAlternativeMedias");
saveCreatedBookmarksLabel.textContent = browser.i18n.getMessage("optionSaveCreatedBookmarks");
passReferrerOnErrorLabel.textContent = browser.i18n.getMessage("optionPassReferrerOnError");
replaceBookmarkURLLabel.textContent = browser.i18n.getMessage("optionReplaceBookmarkURL");
allowedBookmarkFoldersLabel.textContent = browser.i18n.getMessage("optionAllowedBookmarkFolders");
ignoredBookmarkFoldersLabel.textContent = browser.i18n.getMessage("optionIgnoredBookmarkFolders");
createRootDirectoryLabel.textContent = browser.i18n.getMessage("optionCreateRootDirectory");
preventAppendedDataLabel.textContent = browser.i18n.getMessage("optionPreventAppendedData");
passwordLabel.textContent = browser.i18n.getMessage("optionPassword");
groupDuplicateImagesLabel.textContent = browser.i18n.getMessage("optionGroupDuplicateImages");
titleLabel.textContent = browser.i18n.getMessage("optionsTitle");
userInterfaceLabel.textContent = browser.i18n.getMessage("optionsUserInterfaceSubTitle");
filenameLabel.textContent = browser.i18n.getMessage("optionsFileNameSubTitle");
htmlContentLabel.textContent = browser.i18n.getMessage("optionsHTMLContentSubTitle");
fileFormatLabel.textContent = browser.i18n.getMessage("optionsFileFormatSubTitle");
fileFormatSelectHTMLLabel.textContent = browser.i18n.getMessage("optionFileFormatSelectHTML");
fileFormatSelectSelfExtractingUniversalLabel.textContent = browser.i18n.getMessage("optionFileFormatSelectSelfExtractingUniversal");
fileFormatSelectSelfExtractingLabel.textContent = browser.i18n.getMessage("optionFileFormatSelectSelfExtracting");
fileFormatSelectZIPLabel.textContent = browser.i18n.getMessage("optionFileFormatSelectZIP");
fileFormatSelectLabel.textContent = browser.i18n.getMessage("optionFileFormat");
infobarLabel.textContent = browser.i18n.getMessage("optionsInfobarSubTitle");
imagesLabel.textContent = browser.i18n.getMessage("optionsImagesSubTitle");
stylesheetsLabel.textContent = browser.i18n.getMessage("optionsStylesheetsSubTitle");
fontsLabel.textContent = browser.i18n.getMessage("optionsFontsSubTitle");
networkLabel.textContent = browser.i18n.getMessage("optionsNetworkSubTitle");
blockResourcesLabel.textContent = browser.i18n.getMessage("optionsBlockedResources");
acceptHeadersLabel.textContent = browser.i18n.getMessage("optionsAcceptHeaders");
destinationLabel.textContent = browser.i18n.getMessage("optionsDestinationSubTitle");
bookmarksLabel.textContent = browser.i18n.getMessage("optionsBookmarkSubTitle");
autoSaveLabel.textContent = browser.i18n.getMessage("optionsAutoSaveSubTitle");
miscLabel.textContent = browser.i18n.getMessage("optionsMiscSubTitle");
helpLabel.textContent = browser.i18n.getMessage("optionsHelpLink");
infobarTemplateLabel.textContent = browser.i18n.getMessage("optionInfobarTemplate");
blockMixedContentLabel.textContent = browser.i18n.getMessage("optionBlockMixedContent");
saveOriginalURLsLabel.textContent = browser.i18n.getMessage("optionSaveOriginalURLs");
includeInfobarLabel.textContent = browser.i18n.getMessage("optionIncludeInfobar");
removeInfobarSavedDateLabel.textContent = browser.i18n.getMessage("optionRemoveInfobarSavedDate");
confirmInfobarLabel.textContent = browser.i18n.getMessage("optionConfirmInfobar");
autoCloseLabel.textContent = browser.i18n.getMessage("optionAutoClose");
editorLabel.textContent = browser.i18n.getMessage("optionsEditorSubTitle");
openEditorLabel.textContent = browser.i18n.getMessage("optionOpenEditor");
openSavedPageLabel.textContent = browser.i18n.getMessage("optionOpenSavedPage");
autoOpenEditorLabel.textContent = browser.i18n.getMessage("optionAutoOpenEditor");
defaultEditorModeLabel.textContent = browser.i18n.getMessage("optionDefaultEditorMode");
defaultEditorModeNormalLabel.textContent = browser.i18n.getMessage("optionDefaultEditorModeNormal");
defaultEditorModeEditLabel.textContent = browser.i18n.getMessage("optionDefaultEditorModeEdit");
defaultEditorModeFormatLabel.textContent = browser.i18n.getMessage("optionDefaultEditorModeFormat");
defaultEditorModeCutLabel.textContent = browser.i18n.getMessage("optionDefaultEditorModeCut");
defaultEditorModeCutExternalLabel.textContent = browser.i18n.getMessage("optionDefaultEditorModeCutExternal");
applySystemThemeLabel.textContent = browser.i18n.getMessage("optionApplySystemTheme");
warnUnsavedPageLabel.textContent = browser.i18n.getMessage("optionWarnUnsavedPage");
displayInfobarInEditorLabel.textContent = browser.i18n.getMessage("optiondisplayInfobarInEditor");
resetButton.textContent = browser.i18n.getMessage("optionsResetButton");
exportButton.textContent = browser.i18n.getMessage("optionsExportButton");
importButton.textContent = browser.i18n.getMessage("optionsImportButton");
resetButton.title = browser.i18n.getMessage("optionsResetTooltip");
autoSettingsLabel.textContent = browser.i18n.getMessage("optionsAutoSettingsSubTitle");
autoSettingsUrlLabel.textContent = browser.i18n.getMessage("optionsAutoSettingsUrl");
autoSettingsProfileLabel.textContent = browser.i18n.getMessage("optionsAutoSettingsProfile");
autoSettingsAutoSaveProfileLabel.textContent = browser.i18n.getMessage("optionsAutoSettingsAutoSaveProfile");
ruleAddButton.title = browser.i18n.getMessage("optionsAddRuleTooltip");
ruleEditButton.title = browser.i18n.getMessage("optionsValidateChangesTooltip");
rulesDeleteAllButton.title = browser.i18n.getMessage("optionsDeleteRulesTooltip");
showAllProfilesLabel.textContent = browser.i18n.getMessage("optionsAutoSettingsShowAllProfiles");
showAutoSaveProfileLabel.textContent = browser.i18n.getMessage("optionsAutoSettingsShowAutoSaveProfile");
ruleUrlInput.placeholder = ruleEditUrlInput.placeholder = browser.i18n.getMessage("optionsAutoSettingsUrlPlaceholder");
synchronizeLabel.textContent = browser.i18n.getMessage("optionSynchronize");
resetAllButton.textContent = browser.i18n.getMessage("optionsResetAllButton");
resetCurrentButton.textContent = browser.i18n.getMessage("optionsResetCurrentButton");
resetCancelButton.textContent = promptCancelButton.textContent = cancelButton.textContent = browser.i18n.getMessage("optionsCancelButton");
confirmButton.textContent = promptConfirmButton.textContent = browser.i18n.getMessage("optionsOKButton");
document.getElementById("resetConfirmLabel").textContent = browser.i18n.getMessage("optionsResetConfirm");
if (location.href.endsWith("#")) {
	document.querySelector(".new-window-link").remove();
	document.documentElement.classList.add("maximized");
}
let tabsData;
browser.runtime.sendMessage({ method: "tabsData.get" }).then(allTabsData => {
	tabsData = allTabsData;
	return refresh(tabsData.profileName);
});
getHelpContents();

function init() {
	if (!AUTO_SAVE_SUPPORTED) {
		document.getElementById("autoSaveSection").hidden = true;
		document.getElementById("showAutoSaveProfileOption").hidden = true;
		rulesContainerElement.classList.add("compact");
	}
	if (!BACKGROUND_SAVE_SUPPORTED) {
		document.getElementById("backgroundSaveOptions").hidden = true;
		document.getElementById("confirmFilenameOption").hidden = true;
		document.getElementById("filenameConflictAction").hidden = true;
	}
	if (!BOOKMARKS_API_SUPPORTED) {
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
	if (!SHARE_API_SUPPORTED) {
		document.getElementById("sharePageOption").hidden = true;
	}
}

async function refresh(profileName) {
	const [profiles, rules, companionState] = await Promise.all([
		browser.runtime.sendMessage({ method: "config.getProfiles" }),
		browser.runtime.sendMessage({ method: "config.getRules" }),
		browser.runtime.sendMessage({ method: "companion.state" })]);
	const selectedProfileName = profileName || profileNamesInput.value || DEFAULT_PROFILE_NAME;
	Array.from(profileNamesInput.childNodes).forEach(node => node.remove());
	profileNamesInput.options.length = 0;
	ruleProfileInput.options.length = 0;
	ruleAutoSaveProfileInput.options.length = 0;
	ruleEditProfileInput.options.length = 0;
	ruleEditAutoSaveProfileInput.options.length = 0;
	let optionElement = document.createElement("option");
	optionElement.value = DEFAULT_PROFILE_NAME;
	optionElement.textContent = browser.i18n.getMessage("profileDefaultSettings");
	[CURRENT_PROFILE_NAME].concat(...Object.keys(profiles)).forEach(profileName => {
		const optionElement = document.createElement("option");
		optionElement.value = optionElement.textContent = profileName;
		if (profileName == DEFAULT_PROFILE_NAME) {
			optionElement.textContent = browser.i18n.getMessage("profileDefaultSettings");
		}
		if (profileName != CURRENT_PROFILE_NAME) {
			profileNamesInput.appendChild(optionElement);
		}
		ruleProfileInput.appendChild(optionElement.cloneNode(true));
		ruleAutoSaveProfileInput.appendChild(optionElement.cloneNode(true));
		ruleEditProfileInput.appendChild(optionElement.cloneNode(true));
		ruleEditAutoSaveProfileInput.appendChild(optionElement.cloneNode(true));
	});
	profileNamesInput.disabled = profileNamesInput.options.length == 1;
	optionElement = document.createElement("option");
	optionElement.value = DISABLED_PROFILE_NAME;
	optionElement.textContent = browser.i18n.getMessage("profileDisabled");
	ruleAutoSaveProfileInput.appendChild(optionElement);
	ruleEditAutoSaveProfileInput.appendChild(optionElement.cloneNode(true));
	const rulesDataElement = rulesElement.querySelector(".rules-data");
	Array.from(rulesDataElement.childNodes).forEach(node => (!node.className || !node.className.includes("rule-edit")) && node.remove());
	const editURLElement = rulesElement.querySelector(".rule-edit");
	createURLElement.hidden = false;
	editURLElement.hidden = true;
	ruleProfileInput.value = ruleAutoSaveProfileInput.value = selectedProfileName;
	let rulesDisplayed;
	rules.forEach(rule => {
		if (showAllProfilesInput.checked || selectedProfileName == rule.profile || selectedProfileName == rule.autoSaveProfile) {
			rulesDisplayed = true;
			const ruleElement = rulesElement.querySelector(".rule-view").cloneNode(true);
			const ruleUrlElement = ruleElement.querySelector(".rule-url");
			const ruleProfileElement = ruleElement.querySelector(".rule-profile");
			const ruleAutoSaveProfileElement = ruleElement.querySelector(".rule-autosave-profile");
			ruleUrlElement.textContent = ruleUrlElement.title = rule.url;
			ruleProfileElement.textContent = ruleProfileElement.title = getProfileText(rule.profile);
			ruleAutoSaveProfileElement.textContent = ruleAutoSaveProfileElement.title = getProfileText(rule.autoSaveProfile);
			ruleElement.hidden = false;
			ruleElement.className = "tr data";
			rulesDataElement.appendChild(ruleElement);
			const ruleDeleteButton = ruleElement.querySelector(".rule-delete-button");
			const ruleUpdateButton = ruleElement.querySelector(".rule-update-button");
			ruleDeleteButton.title = browser.i18n.getMessage("optionsDeleteRuleTooltip");
			ruleDeleteButton.addEventListener("click", async event => {
				if (await confirm(browser.i18n.getMessage("optionsDeleteRuleConfirm"), event.clientY - 100)) {
					await browser.runtime.sendMessage({ method: "config.deleteRule", url: rule.url });
					await refresh();
					await refreshExternalComponents();
				}
			}, false);
			ruleUpdateButton.title = browser.i18n.getMessage("optionsUpdateRuleTooltip");
			ruleUpdateButton.addEventListener("click", async () => {
				if (editURLElement.hidden) {
					createURLElement.hidden = true;
					editURLElement.hidden = false;
					rulesDataElement.replaceChild(editURLElement, ruleElement);
					ruleEditUrlInput.value = rule.url;
					ruleEditProfileInput.value = rule.profile;
					ruleEditAutoSaveProfileInput.value = rule.autoSaveProfile;
					ruleEditUrlInput.focus();
					editURLElement.onsubmit = async event => {
						event.preventDefault();
						rulesElement.appendChild(editURLElement);
						await browser.runtime.sendMessage({ method: "config.updateRule", url: rule.url, newUrl: ruleEditUrlInput.value, profileName: ruleEditProfileInput.value, autoSaveProfileName: ruleEditAutoSaveProfileInput.value });
						await refresh();
						await refreshExternalComponents();
						ruleUrlInput.focus();
					};
				}
			}, false);
		}
	});
	rulesDeleteAllButton.disabled = !rulesDisplayed;
	rulesElement.appendChild(createURLElement);
	profileNamesInput.value = selectedProfileName;
	renameProfileButton.disabled = deleteProfileButton.disabled = profileNamesInput.value == DEFAULT_PROFILE_NAME;
	const profileOptions = profiles[selectedProfileName];
	removeHiddenElementsInput.checked = profileOptions.removeHiddenElements;
	removeUnusedStylesInput.checked = profileOptions.removeUnusedStyles;
	removeUnusedFontsInput.checked = profileOptions.removeUnusedFonts;
	removeFramesInput.checked = profileOptions.removeFrames;
	blockScriptsInput.checked = profileOptions.blockScripts;
	blockVideosInput.checked = profileOptions.blockVideos;
	blockAudiosInput.checked = profileOptions.blockAudios;
	blockFontsInput.checked = profileOptions.blockFonts;
	blockStylesheetsInput.checked = profileOptions.blockStylesheets;
	blockImagesInput.checked = profileOptions.blockImages;
	acceptHeaderDocumentInput.value = profileOptions.acceptHeaders.document;
	acceptHeaderScriptInput.value = profileOptions.acceptHeaders.script;
	acceptHeaderAudioInput.value = profileOptions.acceptHeaders.audio;
	acceptHeaderVideoInput.value = profileOptions.acceptHeaders.video;
	acceptHeaderFontInput.value = profileOptions.acceptHeaders.font;
	acceptHeaderStylesheetInput.value = profileOptions.acceptHeaders.stylesheet;
	acceptHeaderImageInput.value = profileOptions.acceptHeaders.image;
	saveRawPageInput.checked = profileOptions.saveRawPage;
	insertMetaCSPInput.checked = profileOptions.insertMetaCSP;
	saveToClipboardInput.checked = profileOptions.saveToClipboard;
	addProofInput.checked = profileOptions.addProof;
	woleetKeyInput.value = profileOptions.woleetKey;
	woleetKeyInput.disabled = !profileOptions.addProof;
	saveToGDriveInput.checked = profileOptions.saveToGDrive;
	saveToDropboxInput.checked = profileOptions.saveToDropbox;
	saveWithWebDAVInput.checked = profileOptions.saveWithWebDAV;
	webDAVURLInput.value = profileOptions.webDAVURL;
	webDAVURLInput.disabled = !profileOptions.saveWithWebDAV;
	webDAVUserInput.value = profileOptions.webDAVUser;
	webDAVUserInput.disabled = !profileOptions.saveWithWebDAV;
	webDAVPasswordInput.value = profileOptions.webDAVPassword;
	webDAVPasswordInput.disabled = !profileOptions.saveWithWebDAV;
	saveToGitHubInput.checked = profileOptions.saveToGitHub;
	githubTokenInput.value = profileOptions.githubToken;
	githubTokenInput.disabled = !profileOptions.saveToGitHub;
	githubUserInput.value = profileOptions.githubUser;
	githubUserInput.disabled = !profileOptions.saveToGitHub;
	githubRepositoryInput.value = profileOptions.githubRepository;
	githubRepositoryInput.disabled = !profileOptions.saveToGitHub;
	githubBranchInput.value = profileOptions.githubBranch;
	githubBranchInput.disabled = !profileOptions.saveToGitHub;
	saveWithCompanionInput.checked = profileOptions.saveWithCompanion;
	sharePageInput.checked = profileOptions.sharePage;
	saveToFilesystemInput.checked = !profileOptions.saveToGDrive && !profileOptions.saveToGitHub && !profileOptions.saveWithCompanion && !profileOptions.saveToClipboard && !profileOptions.saveWithWebDAV && !profileOptions.saveToDropbox && !profileOptions.sharePage;
	compressHTMLInput.checked = profileOptions.compressHTML;
	compressCSSInput.checked = profileOptions.compressCSS;
	moveStylesInHeadInput.checked = profileOptions.moveStylesInHead;
	loadDeferredImagesInput.checked = profileOptions.loadDeferredImages;
	loadDeferredImagesMaxIdleTimeInput.value = profileOptions.loadDeferredImagesMaxIdleTime;
	loadDeferredImagesKeepZoomLevelInput.checked = profileOptions.loadDeferredImagesKeepZoomLevel;
	loadDeferredImagesKeepZoomLevelInput.disabled = !profileOptions.loadDeferredImages;
	loadDeferredImagesMaxIdleTimeInput.disabled = !profileOptions.loadDeferredImages;
	loadDeferredImagesDispatchScrollEventInput.checked = profileOptions.loadDeferredImagesDispatchScrollEvent;
	loadDeferredImagesDispatchScrollEventInput.disabled = !profileOptions.loadDeferredImages;
	loadDeferredImagesBeforeFramesInput.checked = profileOptions.loadDeferredImagesBeforeFrames;
	loadDeferredImagesBeforeFramesInput.disabled = !profileOptions.loadDeferredImages;
	contextMenuEnabledInput.checked = profileOptions.contextMenuEnabled;
	filenameTemplateInput.value = profileOptions.filenameTemplate;
	filenameMaxLengthInput.value = profileOptions.filenameMaxLength;
	filenameMaxLengthUnitInput.value = profileOptions.filenameMaxLengthUnit;
	filenameReplacementCharacterInput.value = profileOptions.filenameReplacementCharacter;
	replaceEmojisInFilenameInput.checked = profileOptions.replaceEmojisInFilename;
	saveFilenameTemplateDataInput.checked = profileOptions.saveFilenameTemplateData;
	shadowEnabledInput.checked = profileOptions.shadowEnabled;
	maxResourceSizeEnabledInput.checked = profileOptions.maxResourceSizeEnabled;
	maxResourceSizeInput.value = profileOptions.maxResourceSizeEnabled ? profileOptions.maxResourceSize : 10;
	maxResourceSizeInput.disabled = !profileOptions.maxResourceSizeEnabled;
	maxResourceDelayEnabledInput.checked = Boolean(profileOptions.networkTimeout);
	maxResourceDelayInput.value = profileOptions.networkTimeout ? profileOptions.networkTimeout / 1000 : 60;
	maxResourceDelayInput.disabled = !profileOptions.networkTimeout;
	confirmFilenameInput.checked = profileOptions.confirmFilename;
	filenameConflictActionInput.value = profileOptions.filenameConflictAction;
	displayInfobarInput.checked = profileOptions.displayInfobar;
	displayStatsInput.checked = profileOptions.displayStats;
	backgroundSaveInput.checked = profileOptions.backgroundSave;
	autoSaveDelayInput.value = profileOptions.autoSaveDelay;
	autoSaveLoadInput.checked = !profileOptions.autoSaveLoadOrUnload && profileOptions.autoSaveLoad;
	autoSaveLoadOrUnloadInput.checked = profileOptions.autoSaveLoadOrUnload;
	autoSaveUnloadInput.checked = !profileOptions.autoSaveLoadOrUnload && profileOptions.autoSaveUnload;
	autoSaveLoadInput.disabled = profileOptions.autoSaveLoadOrUnload;
	autoSaveUnloadInput.disabled = profileOptions.autoSaveLoadOrUnload;
	autoSaveDiscardInput.checked = profileOptions.autoSaveDiscard;
	autoSaveRemoveInput.checked = profileOptions.autoSaveRemove;
	autoSaveRepeatInput.checked = profileOptions.autoSaveRepeat;
	autoSaveRepeatDelayInput.value = profileOptions.autoSaveRepeatDelay;
	autoSaveRepeatDelayInput.disabled = !profileOptions.autoSaveRepeat;
	autoSaveExternalSaveInput.checked = profileOptions.autoSaveExternalSave;
	autoSaveExternalSaveInput.parentElement.hidden = !companionState.enabled;
	removeAlternativeFontsInput.checked = profileOptions.removeAlternativeFonts;
	removeAlternativeImagesInput.checked = profileOptions.removeAlternativeImages;
	groupDuplicateImagesInput.checked = profileOptions.groupDuplicateImages;
	removeAlternativeMediasInput.checked = profileOptions.removeAlternativeMedias;
	saveCreatedBookmarksInput.checked = profileOptions.saveCreatedBookmarks;
	passReferrerOnErrorInput.checked = profileOptions.passReferrerOnError;
	replaceBookmarkURLInput.checked = profileOptions.replaceBookmarkURL;
	replaceBookmarkURLInput.disabled = !profileOptions.saveCreatedBookmarks;
	allowedBookmarkFoldersInput.value = profileOptions.allowedBookmarkFolders.map(folder => folder.replace(/,/g, "\\,")).join(",");
	allowedBookmarkFoldersInput.disabled = !profileOptions.saveCreatedBookmarks;
	ignoredBookmarkFoldersInput.value = profileOptions.ignoredBookmarkFolders.map(folder => folder.replace(/,/g, "\\,")).join(",");
	ignoredBookmarkFoldersInput.disabled = !profileOptions.saveCreatedBookmarks;
	fileFormatSelectInput.value = profileOptions.compressContent ? profileOptions.selfExtractingArchive ? profileOptions.extractDataFromPage ?
		"self-extracting-zip-universal" : "self-extracting-zip" : "zip" : "html";
	createRootDirectoryInput.checked = profileOptions.createRootDirectory;
	createRootDirectoryInput.disabled = !profileOptions.compressContent;
	preventAppendedDataInput.checked = profileOptions.preventAppendedData;
	preventAppendedDataInput.disabled = !profileOptions.compressContent && !profileOptions.selfExtractingArchive;
	passwordInput.value = profileOptions.password;
	passwordInput.disabled = !profileOptions.compressContent;
	insertTextBodyInput.checked = profileOptions.insertTextBody;
	insertTextBodyInput.disabled = !profileOptions.compressContent || (!profileOptions.selfExtractingArchive && !profileOptions.extractDataFromPage);
	insertEmbeddedImageInput.checked = profileOptions.insertEmbeddedImage;
	insertEmbeddedImageInput.disabled = !profileOptions.compressContent;
	infobarTemplateInput.value = profileOptions.infobarTemplate;
	blockMixedContentInput.checked = profileOptions.blockMixedContent;
	saveOriginalURLsInput.checked = profileOptions.saveOriginalURLs;
	includeInfobarInput.checked = profileOptions.includeInfobar;
	removeInfobarSavedDateInput.checked = profileOptions.removeSavedDate;
	confirmInfobarInput.checked = profileOptions.confirmInfobarContent;
	autoCloseInput.checked = profileOptions.autoClose;
	openEditorInput.checked = profileOptions.openEditor;
	openSavedPageInput.checked = profileOptions.openSavedPage;
	autoOpenEditorInput.checked = profileOptions.autoOpenEditor;
	defaultEditorModeInput.value = profileOptions.defaultEditorMode;
	applySystemThemeInput.checked = profileOptions.applySystemTheme;
	warnUnsavedPageInput.checked = profileOptions.warnUnsavedPage;
	displayInfobarInEditorInput.checked = profileOptions.displayInfobarInEditor;
}

function getProfileText(profileName) {
	return profileName == DEFAULT_PROFILE_NAME ? browser.i18n.getMessage("profileDefaultSettings") : profileName == DISABLED_PROFILE_NAME ? browser.i18n.getMessage("profileDisabled") : profileName;
}

async function update() {
	try {
		await pendingSave;
	} catch (error) {
		// ignored
	}
	pendingSave = browser.runtime.sendMessage({
		method: "config.updateProfile",
		profileName: profileNamesInput.value,
		profile: {
			removeHiddenElements: removeHiddenElementsInput.checked,
			removeUnusedStyles: removeUnusedStylesInput.checked,
			removeUnusedFonts: removeUnusedFontsInput.checked,
			removeFrames: removeFramesInput.checked,
			blockScripts: blockScriptsInput.checked,
			blockVideos: blockVideosInput.checked,
			blockAudios: blockAudiosInput.checked,
			blockFonts: blockFontsInput.checked,
			blockStylesheets: blockStylesheetsInput.checked,
			blockImages: blockImagesInput.checked,
			acceptHeaders: {
				document: acceptHeaderDocumentInput.value,
				script: acceptHeaderScriptInput.value,
				audio: acceptHeaderAudioInput.value,
				video: acceptHeaderVideoInput.value,
				font: acceptHeaderFontInput.value,
				stylesheet: acceptHeaderStylesheetInput.value,
				image: acceptHeaderImageInput.value
			},
			saveRawPage: saveRawPageInput.checked,
			insertMetaCSP: insertMetaCSPInput.checked,
			saveToClipboard: saveToClipboardInput.checked,
			addProof: addProofInput.checked,
			woleetKey: woleetKeyInput.value,
			saveToGDrive: saveToGDriveInput.checked,
			saveToDropbox: saveToDropboxInput.checked,
			saveWithWebDAV: saveWithWebDAVInput.checked,
			webDAVURL: webDAVURLInput.value,
			webDAVUser: webDAVUserInput.value,
			webDAVPassword: webDAVPasswordInput.value,
			saveToGitHub: saveToGitHubInput.checked,
			githubToken: githubTokenInput.value,
			githubUser: githubUserInput.value,
			githubRepository: githubRepositoryInput.value,
			githubBranch: githubBranchInput.value,
			saveWithCompanion: saveWithCompanionInput.checked,
			sharePage: sharePageInput.checked,
			compressHTML: compressHTMLInput.checked,
			insertTextBody: insertTextBodyInput.checked,
			insertEmbeddedImage: insertEmbeddedImageInput.checked,
			compressCSS: compressCSSInput.checked,
			moveStylesInHead: moveStylesInHeadInput.checked,
			loadDeferredImages: loadDeferredImagesInput.checked,
			loadDeferredImagesMaxIdleTime: Math.max(loadDeferredImagesMaxIdleTimeInput.value, 0),
			loadDeferredImagesKeepZoomLevel: loadDeferredImagesKeepZoomLevelInput.checked,
			loadDeferredImagesDispatchScrollEvent: loadDeferredImagesDispatchScrollEventInput.checked,
			loadDeferredImagesBeforeFrames: loadDeferredImagesBeforeFramesInput.checked,
			contextMenuEnabled: contextMenuEnabledInput.checked,
			filenameTemplate: filenameTemplateInput.value,
			filenameMaxLength: filenameMaxLengthInput.value,
			filenameMaxLengthUnit: filenameMaxLengthUnitInput.value,
			filenameReplacementCharacter: filenameReplacementCharacterInput.value,
			replaceEmojisInFilename: replaceEmojisInFilenameInput.checked,
			saveFilenameTemplateData: saveFilenameTemplateDataInput.checked,
			shadowEnabled: shadowEnabledInput.checked,
			maxResourceSizeEnabled: maxResourceSizeEnabledInput.checked,
			maxResourceSize: maxResourceSizeEnabledInput.checked ? Math.max(maxResourceSizeInput.value, 0) : 10,
			networkTimeout: maxResourceDelayEnabledInput.checked ? Math.max(maxResourceDelayInput.value * 1000, 60) : 0,
			confirmFilename: confirmFilenameInput.checked,
			filenameConflictAction: filenameConflictActionInput.value,
			displayInfobar: displayInfobarInput.checked,
			displayStats: displayStatsInput.checked,
			backgroundSave: backgroundSaveInput.checked,
			autoSaveDelay: Math.max(autoSaveDelayInput.value, 0),
			autoSaveLoad: autoSaveLoadInput.checked,
			autoSaveUnload: autoSaveUnloadInput.checked,
			autoSaveDiscard: autoSaveDiscardInput.checked,
			autoSaveRemove: autoSaveRemoveInput.checked,
			autoSaveLoadOrUnload: autoSaveLoadOrUnloadInput.checked,
			autoSaveRepeat: autoSaveRepeatInput.checked,
			autoSaveRepeatDelay: Math.max(autoSaveRepeatDelayInput.value, 1),
			autoSaveExternalSave: autoSaveExternalSaveInput.checked,
			removeAlternativeFonts: removeAlternativeFontsInput.checked,
			removeAlternativeImages: removeAlternativeImagesInput.checked,
			removeAlternativeMedias: removeAlternativeMediasInput.checked,
			saveCreatedBookmarks: saveCreatedBookmarksInput.checked,
			passReferrerOnError: passReferrerOnErrorInput.checked,
			replaceBookmarkURL: replaceBookmarkURLInput.checked,
			allowedBookmarkFolders: allowedBookmarkFoldersInput.value.replace(/([^\\]),/g, "$1 ,").split(/[^\\],/).map(folder => folder.replace(/\\,/g, ",")),
			ignoredBookmarkFolders: ignoredBookmarkFoldersInput.value.replace(/([^\\]),/g, "$1 ,").split(/[^\\],/).map(folder => folder.replace(/\\,/g, ",")),
			compressContent: fileFormatSelectInput.value.includes("zip"),
			createRootDirectory: createRootDirectoryInput.checked,
			preventAppendedData: preventAppendedDataInput.checked,
			selfExtractingArchive: fileFormatSelectInput.value.includes("self-extracting"),
			extractDataFromPage: fileFormatSelectInput.value == "self-extracting-zip-universal",
			password: passwordInput.value,
			groupDuplicateImages: groupDuplicateImagesInput.checked,
			infobarTemplate: infobarTemplateInput.value,
			blockMixedContent: blockMixedContentInput.checked,
			saveOriginalURLs: saveOriginalURLsInput.checked,
			includeInfobar: includeInfobarInput.checked,
			removeSavedDate: removeInfobarSavedDateInput.checked,
			confirmInfobarContent: confirmInfobarInput.checked,
			autoClose: autoCloseInput.checked,
			openEditor: openEditorInput.checked,
			openSavedPage: openSavedPageInput.checked,
			autoOpenEditor: autoOpenEditorInput.checked,
			defaultEditorMode: defaultEditorModeInput.value,
			applySystemTheme: applySystemThemeInput.checked,
			warnUnsavedPage: warnUnsavedPageInput.checked,
			displayInfobarInEditor: displayInfobarInEditorInput.checked
		}
	});
	try {
		await pendingSave;
	} catch (error) {
		// ignored
	}
}

async function refreshExternalComponents() {
	try {
		await browser.runtime.sendMessage({ method: "ui.refreshMenu" });
		if (sidePanelDisplay) {
			await browser.runtime.sendMessage({ method: "options.refresh", profileName: profileNamesInput.value });
		} else {
			await browser.runtime.sendMessage({ method: "options.refreshPanel", profileName: profileNamesInput.value });
		}
	} catch (error) {
		// ignored
	}
}

async function saveCreatedBookmarks() {
	if (saveCreatedBookmarksInput.checked) {
		saveCreatedBookmarksInput.checked = false;
		try {
			const permissionGranted = await browser.permissions.request({ permissions: ["bookmarks"] });
			if (permissionGranted) {
				saveCreatedBookmarksInput.checked = true;
				await update();
				await refresh();
				await browser.runtime.sendMessage({ method: "bookmarks.saveCreatedBookmarks" });
			} else {
				await disableOption();
			}
		} catch (error) {
			saveCreatedBookmarksInput.checked = false;
			await disableOption();
		}
	} else {
		try {
			await browser.permissions.remove({ permissions: ["bookmarks"] });
		} catch (error) {
			// ignored
		}
		await disableOption();
	}

	async function disableOption() {
		await update();
		await refresh();
		await browser.runtime.sendMessage({ method: "bookmarks.disable" });
	}
}

async function onClickSaveToClipboard() {
	if (saveToClipboardInput.checked) {
		saveToClipboardInput.checked = false;
		try {
			const permissionGranted = await browser.permissions.request({ permissions: ["clipboardWrite"] });
			if (permissionGranted) {
				saveToClipboardInput.checked = true;
				await browser.runtime.sendMessage({ method: "downloads.disableGDrive" });
			}
		} catch (error) {
			saveToClipboardInput.checked = false;
		}
	}
	await update();
	await refresh();
}

async function onClickSaveToGDrive() {
	if (saveToGDriveInput.checked) {
		saveToGDriveInput.checked = false;
		try {
			if (requestPermissionIdentity) {
				const permissionGranted = await browser.permissions.request({ permissions: ["identity"] });
				if (permissionGranted) {
					saveToGDriveInput.checked = true;
				}
			} else {
				saveToGDriveInput.checked = true;
			}
		} catch (error) {
			saveToGDriveInput.checked = false;
			await browser.runtime.sendMessage({ method: "downloads.disableGDrive" });
		}
	}
	await update();
	await refresh();
}

async function disableDestinationPermissions(permissions, disableGDrive = true, disableDropbox = true) {
	if (disableGDrive) {
		await browser.runtime.sendMessage({ method: "downloads.disableGDrive" });
	}
	if (disableDropbox) {
		await browser.runtime.sendMessage({ method: "downloads.disableDropbox" });
	}
	try {
		await browser.permissions.remove({ permissions });
	} catch (error) {
		//ignored
	}
}

async function passReferrerOnError() {
	if (passReferrerOnErrorInput.checked) {
		passReferrerOnErrorInput.checked = false;
		try {
			const permissionGranted = await browser.permissions.request({ permissions: ["webRequest", "webRequestBlocking"] });
			if (permissionGranted) {
				passReferrerOnErrorInput.checked = true;
				await update();
				await refresh();
				await browser.runtime.sendMessage({ method: "requests.enableReferrerOnError" });
			} else {
				await disableOption();
			}
		} catch (error) {
			await disableOption();
		}
	} else {
		await disableOption();
	}

	async function disableOption() {
		await update();
		await refresh();
		await browser.runtime.sendMessage({ method: "requests.disableReferrerOnError" });
		await browser.permissions.remove({ permissions: ["webRequest", "webRequestBlocking"] });
	}
}

async function enableExternalSave(input) {
	if (input.checked) {
		input.checked = false;
		try {
			const permissionGranted = await browser.permissions.request({ permissions: ["nativeMessaging"] });
			if (permissionGranted) {
				input.checked = true;
				await refreshOption();
				if (window.chrome) {
					window.chrome.runtime.reload();
				}
			} else {
				await refreshOption();
			}
		} catch (error) {
			input.checked = true;
			await refreshOption();
		}
	} else {
		await refreshOption();
	}

	async function refreshOption() {
		await update();
		await refresh();
	}
}

async function confirm(message, positionY) {
	document.getElementById("confirmLabel").textContent = message;
	document.getElementById("formConfirmContainer").style.setProperty("display", "flex");
	document.querySelector("#formConfirmContainer .popup-content").style.setProperty("margin-top", positionY + "px");
	confirmButton.focus();
	document.body.style.setProperty("overflow-y", "hidden");
	return new Promise(resolve => {
		confirmButton.onclick = event => hideAndResolve(event, true);
		cancelButton.onclick = event => hideAndResolve(event);
		window.onkeyup = event => {
			if (event.key == "Escape") {
				hideAndResolve(event);
			}
		};

		function hideAndResolve(event, value) {
			event.preventDefault();
			document.getElementById("formConfirmContainer").style.setProperty("display", "none");
			document.body.style.setProperty("overflow-y", "");
			resolve(value);
		}
	});
}

async function reset(positionY) {
	document.getElementById("formResetContainer").style.setProperty("display", "flex");
	document.querySelector("#formResetContainer .popup-content").style.setProperty("margin-top", positionY + "px");
	resetCancelButton.focus();
	document.body.style.setProperty("overflow-y", "hidden");
	return new Promise(resolve => {
		resetAllButton.onclick = event => hideAndResolve(event, "all");
		resetCurrentButton.onclick = event => hideAndResolve(event, "current");
		resetCancelButton.onclick = event => hideAndResolve(event);
		window.onkeyup = event => {
			if (event.key == "Escape") {
				hideAndResolve(event);
			}
		};

		function hideAndResolve(event, value) {
			event.preventDefault();
			document.getElementById("formResetContainer").style.setProperty("display", "none");
			document.body.style.setProperty("overflow-y", "");
			resolve(value);
		}
	});
}

async function prompt(message, positionY, defaultValue = "") {
	document.getElementById("promptLabel").textContent = message;
	document.getElementById("formPromptContainer").style.setProperty("display", "flex");
	document.querySelector("#formPromptContainer .popup-content").style.setProperty("margin-top", positionY + "px");
	promptInput.value = defaultValue;
	promptInput.focus();
	document.body.style.setProperty("overflow-y", "hidden");
	return new Promise(resolve => {
		promptConfirmButton.onclick = event => hideAndResolve(event, promptInput.value);
		promptCancelButton.onclick = event => hideAndResolve(event);
		window.onkeyup = event => {
			if (event.key == "Escape") {
				hideAndResolve(event);
			}
		};

		function hideAndResolve(event, value) {
			event.preventDefault();
			document.getElementById("formPromptContainer").style.setProperty("display", "none");
			document.body.style.setProperty("overflow-y", "");
			resolve(value);
		}
	});
}

async function getHelpContents() {
	const helpPage = await fetch(browser.runtime.getURL(HELP_PAGE_PATH));
	const content = new TextDecoder().decode(await helpPage.arrayBuffer());
	const doc = (new DOMParser()).parseFromString(content, "text/html");
	const items = doc.querySelectorAll("[data-options-label]");
	items.forEach(itemElement => {
		const optionLabel = document.getElementById(itemElement.dataset.optionsLabel);
		if (optionLabel) {
			const helpIconWrapper = document.createElement("span");
			const helpIconContainer = document.createElement("span");
			const helpIcon = document.createElement("img");
			helpIcon.src = HELP_ICON_URL;
			helpIconWrapper.className = "help-icon-wrapper";
			const labelWords = optionLabel.textContent.split(/\s+/);
			if (labelWords.length > 1) {
				helpIconWrapper.textContent = labelWords.pop();
				optionLabel.textContent = labelWords.join(" ") + " ";
			}
			helpIconContainer.className = "help-icon";
			helpIconContainer.onclick = () => {
				helpContent.hidden = !helpContent.hidden;
				return false;
			};
			helpIcon.tabIndex = 0;
			helpIconContainer.onkeyup = event => {
				if (event.code == "Enter") {
					helpContent.hidden = !helpContent.hidden;
					return false;
				}
			};
			helpIconContainer.appendChild(helpIcon);
			helpIconWrapper.appendChild(helpIconContainer);
			optionLabel.appendChild(helpIconWrapper);
			const helpContent = document.createElement("div");
			helpContent.hidden = true;
			helpContent.className = "help-content";
			itemElement.childNodes.forEach(node => {
				if (node instanceof HTMLElement && node.className != "option") {
					helpContent.appendChild(document.importNode(node, true));
				}
			});
			helpContent.querySelectorAll("a[href]").forEach(linkElement => {
				const hrefValue = linkElement.getAttribute("href");
				if (hrefValue.startsWith("#")) {
					linkElement.href = browser.runtime.getURL(HELP_PAGE_PATH + linkElement.getAttribute("href"));
					linkElement.target = "_blank";
				}
			});
			optionLabel.parentElement.insertAdjacentElement("afterEnd", helpContent);
		}
	});
}

function getLocalStorageItem(key) {
	try {
		return localStorage.getItem(key);
	} catch (error) {
		// ignored
	}
}

function setLocalStorageItem(key, value) {
	try {
		return localStorage.setItem(key, value);
	} catch (error) {
		// ignored
	}
}

function removeLocalStorageItem(key) {
	try {
		return localStorage.removeItem(key);
	} catch (error) {
		// ignored
	}
}
