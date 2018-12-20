/*
 * Copyright 2018 Gildas Lormeau
 * contact : gildas.lormeau <at> gmail.com
 * 
 * This file is part of SingleFile.
 *
 *   SingleFile is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU Lesser General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   SingleFile is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU Lesser General Public License for more details.
 *
 *   You should have received a copy of the GNU Lesser General Public License
 *   along with SingleFile.  If not, see <http://www.gnu.org/licenses/>.
 */

/* global browser, window, document */

(async () => {

	const CHROME_BROWSER_NAME = "Chrome";

	const [bgPage, browserInfo] = await Promise.all([browser.runtime.getBackgroundPage(), browser.runtime.getBrowserInfo()]);
	const singlefile = bgPage.singlefile;
	const prompt = browserInfo.name == CHROME_BROWSER_NAME ? (message, defaultMessage) => bgPage.prompt(message, defaultMessage) : (message, defaultMessage) => { document.body.style.opacity = 0; const value = window.prompt(message, defaultMessage); document.body.style.opacity = 1; return value; };
	const confirm = browserInfo.name == CHROME_BROWSER_NAME ? message => bgPage.confirm(message) : message => { document.body.style.opacity = 0; const value = window.confirm(message); document.body.style.opacity = 1; return value; };
	const removeHiddenElementsLabel = document.getElementById("removeHiddenElementsLabel");
	const removeUnusedStylesLabel = document.getElementById("removeUnusedStylesLabel");
	const removeFramesLabel = document.getElementById("removeFramesLabel");
	const removeImportsLabel = document.getElementById("removeImportsLabel");
	const removeScriptsLabel = document.getElementById("removeScriptsLabel");
	const saveRawPageLabel = document.getElementById("saveRawPageLabel");
	const compressHTMLLabel = document.getElementById("compressHTMLLabel");
	const compressCSSLabel = document.getElementById("compressCSSLabel");
	const lazyLoadImagesLabel = document.getElementById("lazyLoadImagesLabel");
	const maxLazyLoadImagesIdleTimeLabel = document.getElementById("maxLazyLoadImagesIdleTimeLabel");
	const addMenuEntryLabel = document.getElementById("addMenuEntryLabel");
	const filenameTemplateLabel = document.getElementById("filenameTemplateLabel");
	const shadowEnabledLabel = document.getElementById("shadowEnabledLabel");
	const setMaxResourceSizeLabel = document.getElementById("setMaxResourceSizeLabel");
	const maxResourceSizeLabel = document.getElementById("maxResourceSizeLabel");
	const confirmFilenameLabel = document.getElementById("confirmFilenameLabel");
	const conflictActionLabel = document.getElementById("conflictActionLabel");
	const conflictActionUniquifyLabel = document.getElementById("conflictActionUniquifyLabel");
	const conflictActionOverwriteLabel = document.getElementById("conflictActionOverwriteLabel");
	const conflictActionPromptLabel = document.getElementById("conflictActionPromptLabel");
	const removeAudioLabel = document.getElementById("removeAudioLabel");
	const removeVideoLabel = document.getElementById("removeVideoLabel");
	const displayInfobarLabel = document.getElementById("displayInfobarLabel");
	const displayStatsLabel = document.getElementById("displayStatsLabel");
	const backgroundSaveLabel = document.getElementById("backgroundSaveLabel");
	const autoSaveDelayLabel = document.getElementById("autoSaveDelayLabel");
	const autoSaveLoadLabel = document.getElementById("autoSaveLoadLabel");
	const autoSaveUnloadLabel = document.getElementById("autoSaveUnloadLabel");
	const autoSaveLoadOrUnloadLabel = document.getElementById("autoSaveLoadOrUnloadLabel");
	const removeAlternativeFontsLabel = document.getElementById("removeAlternativeFontsLabel");
	const removeAlternativeImagesLabel = document.getElementById("removeAlternativeImagesLabel");
	const removeAlternativeMediasLabel = document.getElementById("removeAlternativeMediasLabel");
	const titleLabel = document.getElementById("titleLabel");
	const userInterfaceLabel = document.getElementById("userInterfaceLabel");
	const filenameLabel = document.getElementById("filenameLabel");
	const htmlContentLabel = document.getElementById("htmlContentLabel");
	const imagesLabel = document.getElementById("imagesLabel");
	const stylesheetsLabel = document.getElementById("stylesheetsLabel");
	const otherResourcesLabel = document.getElementById("otherResourcesLabel");
	const autoSaveLabel = document.getElementById("autoSaveLabel");
	const autoSettingsLabel = document.getElementById("autoSettingsLabel");
	const autoSettingsUrlLabel = document.getElementById("autoSettingsUrlLabel");
	const autoSettingsProfileLabel = document.getElementById("autoSettingsProfileLabel");
	const autoSettingsAutoSaveProfileLabel = document.getElementById("autoSettingsAutoSaveProfileLabel");
	const showAllProfilesLabel = document.getElementById("showAllProfilesLabel");
	const showAutoSaveProfileLabel = document.getElementById("showAutoSaveProfileLabel");
	const groupDuplicateImagesLabel = document.getElementById("groupDuplicateImagesLabel");
	const confirmInfobarLabel = document.getElementById("confirmInfobarLabel");
	const infobarTemplateLabel = document.getElementById("infobarTemplateLabel");
	const miscLabel = document.getElementById("miscLabel");
	const helpLabel = document.getElementById("helpLabel");
	const addProfileButton = document.getElementById("addProfileButton");
	const deleteProfileButton = document.getElementById("deleteProfileButton");
	const renameProfileButton = document.getElementById("renameProfileButton");
	const resetButton = document.getElementById("resetButton");
	const profileNamesInput = document.getElementById("profileNamesInput");
	const removeHiddenElementsInput = document.getElementById("removeHiddenElementsInput");
	const removeUnusedStylesInput = document.getElementById("removeUnusedStylesInput");
	const removeFramesInput = document.getElementById("removeFramesInput");
	const removeImportsInput = document.getElementById("removeImportsInput");
	const removeScriptsInput = document.getElementById("removeScriptsInput");
	const saveRawPageInput = document.getElementById("saveRawPageInput");
	const compressHTMLInput = document.getElementById("compressHTMLInput");
	const compressCSSInput = document.getElementById("compressCSSInput");
	const lazyLoadImagesInput = document.getElementById("lazyLoadImagesInput");
	const maxLazyLoadImagesIdleTimeInput = document.getElementById("maxLazyLoadImagesIdleTimeInput");
	const contextMenuEnabledInput = document.getElementById("contextMenuEnabledInput");
	const filenameTemplateInput = document.getElementById("filenameTemplateInput");
	const shadowEnabledInput = document.getElementById("shadowEnabledInput");
	const maxResourceSizeInput = document.getElementById("maxResourceSizeInput");
	const maxResourceSizeEnabledInput = document.getElementById("maxResourceSizeEnabledInput");
	const confirmFilenameInput = document.getElementById("confirmFilenameInput");
	const conflictActionInput = document.getElementById("conflictActionInput");
	const removeAudioSrcInput = document.getElementById("removeAudioSrcInput");
	const removeVideoSrcInput = document.getElementById("removeVideoSrcInput");
	const displayInfobarInput = document.getElementById("displayInfobarInput");
	const displayStatsInput = document.getElementById("displayStatsInput");
	const backgroundSaveInput = document.getElementById("backgroundSaveInput");
	const autoSaveDelayInput = document.getElementById("autoSaveDelayInput");
	const autoSaveLoadInput = document.getElementById("autoSaveLoadInput");
	const autoSaveUnloadInput = document.getElementById("autoSaveUnloadInput");
	const autoSaveLoadOrUnloadInput = document.getElementById("autoSaveLoadOrUnloadInput");
	const removeAlternativeFontsInput = document.getElementById("removeAlternativeFontsInput");
	const removeAlternativeImagesInput = document.getElementById("removeAlternativeImagesInput");
	const removeAlternativeMediasInput = document.getElementById("removeAlternativeMediasInput");
	const groupDuplicateImagesInput = document.getElementById("groupDuplicateImagesInput");
	const infobarTemplateInput = document.getElementById("infobarTemplateInput");
	const confirmInfobarInput = document.getElementById("confirmInfobarInput");
	const expandAllButton = document.getElementById("expandAllButton");
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
	const showAllProfilesInput = document.getElementById("showAllProfilesInput");
	const showAutoSaveProfileInput = document.getElementById("showAutoSaveProfileInput");
	let pendingSave = Promise.resolve();
	ruleAddButton.addEventListener("click", async () => {
		try {
			await singlefile.config.addRule(ruleUrlInput.value, ruleProfileInput.value, ruleAutoSaveProfileInput.value);
			ruleUrlInput.value = "";
			ruleProfileInput.value = ruleAutoSaveProfileInput.value = singlefile.config.DEFAULT_PROFILE_NAME;
			await refresh();
			ruleUrlInput.focus();
		} catch (error) {
			// ignored
		}
	}, false);
	ruleUrlInput.onclick = ruleUrlInput.onkeyup = ruleUrlInput.onchange = async () => {
		ruleAddButton.disabled = !ruleUrlInput.value;
		const rules = await singlefile.config.getRules();
		if (rules.find(rule => rule.url == ruleUrlInput.value)) {
			ruleAddButton.disabled = true;
		}
	};
	ruleEditUrlInput.onclick = ruleEditUrlInput.onkeyup = ruleEditUrlInput.onchange = async () => {
		ruleEditButton.disabled = !ruleEditUrlInput.value;
		const rules = await singlefile.config.getRules();
		if (rules.find(rule => rule.url == ruleEditUrlInput.value)) {
			ruleEditButton.disabled = true;
		}
	};
	showAutoSaveProfileInput.addEventListener("click", () => {
		if (showAutoSaveProfileInput.checked) {
			rulesContainerElement.classList.remove("compact");
		} else {
			rulesContainerElement.classList.add("compact");
		}
	}, false);
	addProfileButton.addEventListener("click", async () => {
		const profileName = prompt(browser.i18n.getMessage("profileAddPrompt"));
		if (profileName) {
			try {
				await singlefile.config.createProfile(profileName);
				await Promise.all([refresh(profileName), singlefile.ui.menu.refresh()]);
			} catch (error) {
				// ignored
			}
		}
	}, false);
	deleteProfileButton.addEventListener("click", async () => {
		if (confirm(browser.i18n.getMessage("profileDeleteConfirm"))) {
			try {
				await singlefile.config.deleteProfile(profileNamesInput.value);
				profileNamesInput.value = null;
				await Promise.all([refresh(), singlefile.ui.menu.refresh()]);
			} catch (error) {
				// ignored
			}
		}
	}, false);
	renameProfileButton.addEventListener("click", async () => {
		const profileName = prompt(browser.i18n.getMessage("profileRenamePrompt"), profileNamesInput.value);
		if (profileName) {
			try {
				await singlefile.config.renameProfile(profileNamesInput.value, profileName);
				await Promise.all([refresh(profileName), singlefile.ui.menu.refresh()]);
			} catch (error) {
				// ignored
			}
		}
	}, false);
	resetButton.addEventListener("click", async () => {
		if (confirm(browser.i18n.getMessage("optionsResetConfirm"))) {
			await singlefile.config.reset();
			await Promise.all([refresh(singlefile.config.DEFAULT_PROFILE_NAME), singlefile.ui.menu.refresh()]);
			await update();
		}
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
			autoSaveLoadInput.checked = true;
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
	document.body.onchange = async event => {
		let target = event.target;
		if (target != ruleUrlInput && target != ruleProfileInput && target != ruleAutoSaveProfileInput && target != ruleEditUrlInput && target != ruleEditProfileInput && target != ruleEditAutoSaveProfileInput && target != showAutoSaveProfileInput) {
			if (target != profileNamesInput && target != showAllProfilesInput) {
				await update();
			}
			if (target == profileNamesInput) {
				await refresh(profileNamesInput.value);
			} else {
				await refresh();
			}
		}
	};
	addProfileButton.title = browser.i18n.getMessage("profileAddButtonTooltip");
	deleteProfileButton.title = browser.i18n.getMessage("profileDeleteButtonTooltip");
	renameProfileButton.title = browser.i18n.getMessage("profileRenameButtonTooltip");
	removeHiddenElementsLabel.textContent = browser.i18n.getMessage("optionRemoveHiddenElements");
	removeUnusedStylesLabel.textContent = browser.i18n.getMessage("optionRemoveUnusedStyles");
	removeFramesLabel.textContent = browser.i18n.getMessage("optionRemoveFrames");
	removeImportsLabel.textContent = browser.i18n.getMessage("optionRemoveImports");
	removeScriptsLabel.textContent = browser.i18n.getMessage("optionRemoveScripts");
	saveRawPageLabel.textContent = browser.i18n.getMessage("optionSaveRawPage");
	compressHTMLLabel.textContent = browser.i18n.getMessage("optionCompressHTML");
	compressCSSLabel.textContent = browser.i18n.getMessage("optionCompressCSS");
	lazyLoadImagesLabel.textContent = browser.i18n.getMessage("optionLazyLoadImages");
	maxLazyLoadImagesIdleTimeLabel.textContent = browser.i18n.getMessage("optionMaxLazyLoadImagesIdleTime");
	addMenuEntryLabel.textContent = browser.i18n.getMessage("optionAddMenuEntry");
	filenameTemplateLabel.textContent = browser.i18n.getMessage("optionFilenameTemplate");
	shadowEnabledLabel.textContent = browser.i18n.getMessage("optionDisplayShadow");
	setMaxResourceSizeLabel.textContent = browser.i18n.getMessage("optionSetMaxResourceSize");
	maxResourceSizeLabel.textContent = browser.i18n.getMessage("optionMaxResourceSize");
	confirmFilenameLabel.textContent = browser.i18n.getMessage("optionConfirmFilename");
	conflictActionLabel.textContent = browser.i18n.getMessage("optionConflictAction");
	conflictActionUniquifyLabel.textContent = browser.i18n.getMessage("optionConflictActionUniquify");
	conflictActionOverwriteLabel.textContent = browser.i18n.getMessage("optionConflictActionOverwrite");
	conflictActionPromptLabel.textContent = browser.i18n.getMessage("optionConflictActionPrompt");
	removeAudioLabel.textContent = browser.i18n.getMessage("optionRemoveAudio");
	removeVideoLabel.textContent = browser.i18n.getMessage("optionRemoveVideo");
	displayInfobarLabel.textContent = browser.i18n.getMessage("optionDisplayInfobar");
	displayStatsLabel.textContent = browser.i18n.getMessage("optionDisplayStats");
	backgroundSaveLabel.textContent = browser.i18n.getMessage("optionBackgroundSave");
	autoSaveDelayLabel.textContent = browser.i18n.getMessage("optionAutoSaveDelay");
	autoSaveLoadLabel.textContent = browser.i18n.getMessage("optionAutoSaveLoad");
	autoSaveUnloadLabel.textContent = browser.i18n.getMessage("optionAutoSaveUnload");
	autoSaveLoadOrUnloadLabel.textContent = browser.i18n.getMessage("optionAutoSaveLoadOrUnload");
	removeAlternativeFontsLabel.textContent = browser.i18n.getMessage("optionRemoveAlternativeFonts");
	removeAlternativeImagesLabel.textContent = browser.i18n.getMessage("optionRemoveAlternativeImages");
	removeAlternativeMediasLabel.textContent = browser.i18n.getMessage("optionRemoveAlternativeMedias");
	groupDuplicateImagesLabel.textContent = browser.i18n.getMessage("optionGroupDuplicateImages");
	titleLabel.textContent = browser.i18n.getMessage("optionsTitle");
	userInterfaceLabel.textContent = browser.i18n.getMessage("optionsUserInterfaceSubTitle");
	filenameLabel.textContent = browser.i18n.getMessage("optionsFileNameSubTitle");
	htmlContentLabel.textContent = browser.i18n.getMessage("optionsHTMLContentSubTitle");
	imagesLabel.textContent = browser.i18n.getMessage("optionsImagesSubTitle");
	stylesheetsLabel.textContent = browser.i18n.getMessage("optionsStylesheetsSubTitle");
	otherResourcesLabel.textContent = browser.i18n.getMessage("optionsOtherResourcesSubTitle");
	autoSaveLabel.textContent = browser.i18n.getMessage("optionsAutoSaveSubTitle");
	miscLabel.textContent = browser.i18n.getMessage("optionsMiscSubTitle");
	helpLabel.textContent = browser.i18n.getMessage("optionsHelpLink");
	infobarTemplateLabel.textContent = browser.i18n.getMessage("optionInfobarTemplate");
	confirmInfobarLabel.textContent = browser.i18n.getMessage("optionConfirmInfobar");
	resetButton.textContent = browser.i18n.getMessage("optionsResetButton");
	resetButton.title = browser.i18n.getMessage("optionsResetTooltip");
	autoSettingsLabel.textContent = browser.i18n.getMessage("optionsAutoSettingsSubTitle");
	autoSettingsUrlLabel.textContent = browser.i18n.getMessage("optionsAutoSettingsUrl");
	autoSettingsProfileLabel.textContent = browser.i18n.getMessage("optionsAutoSettingsProfile");
	autoSettingsAutoSaveProfileLabel.textContent = browser.i18n.getMessage("optionsAutoSettingsAutoSaveProfile");
	ruleAddButton.title = browser.i18n.getMessage("optionsAddRuleTooltip");
	ruleEditButton.title = browser.i18n.getMessage("optionsValidateChangesTooltip");
	showAllProfilesLabel.textContent = browser.i18n.getMessage("optionsAutoSettingsShowAllProfiles");
	showAutoSaveProfileLabel.textContent = browser.i18n.getMessage("optionsAutoSettingsShowAutoSaveProfile");
	ruleUrlInput.placeholder = ruleEditUrlInput.placeholder = browser.i18n.getMessage("optionsAutoSettingsUrlPlaceholder");

	refresh();

	async function refresh(profileName) {
		const [profiles, rules] = await Promise.all([singlefile.config.getProfiles(), singlefile.config.getRules()]);
		const selectedProfileName = profileName || profileNamesInput.value || singlefile.config.DEFAULT_PROFILE_NAME;
		Array.from(profileNamesInput.childNodes).forEach(node => node.remove());
		const profileNames = Object.keys(profiles);
		profileNamesInput.options.length = 0;
		ruleProfileInput.options.length = 0;
		ruleAutoSaveProfileInput.options.length = 0;
		ruleEditProfileInput.options.length = 0;
		ruleEditAutoSaveProfileInput.options.length = 0;
		let optionElement = document.createElement("option");
		optionElement.value = singlefile.config.DEFAULT_PROFILE_NAME;
		optionElement.textContent = browser.i18n.getMessage("profileDefaultSettings");
		profileNamesInput.appendChild(optionElement);
		ruleProfileInput.appendChild(optionElement.cloneNode(true));
		ruleAutoSaveProfileInput.appendChild(optionElement.cloneNode(true));
		ruleEditProfileInput.appendChild(optionElement.cloneNode(true));
		ruleEditAutoSaveProfileInput.appendChild(optionElement.cloneNode(true));
		profileNames.forEach(profileName => {
			if (profileName != singlefile.config.DEFAULT_PROFILE_NAME) {
				const optionElement = document.createElement("option");
				optionElement.value = optionElement.textContent = profileName;
				profileNamesInput.appendChild(optionElement);
				ruleProfileInput.appendChild(optionElement.cloneNode(true));
				ruleAutoSaveProfileInput.appendChild(optionElement.cloneNode(true));
				ruleEditProfileInput.appendChild(optionElement.cloneNode(true));
				ruleEditAutoSaveProfileInput.appendChild(optionElement.cloneNode(true));
			}
		});
		optionElement = document.createElement("option");
		optionElement.value = singlefile.config.DISABLED_PROFILE_NAME;
		optionElement.textContent = browser.i18n.getMessage("profileDisabled");
		ruleAutoSaveProfileInput.appendChild(optionElement);
		ruleEditAutoSaveProfileInput.appendChild(optionElement.cloneNode(true));
		const rulesDataElement = rulesElement.querySelector(".rules-data");
		Array.from(rulesDataElement.childNodes).forEach(node => node.remove());
		const editURLElement = rulesElement.querySelector(".rule-edit");
		const createURLElement = rulesElement.querySelector(".rule-create");
		createURLElement.hidden = false;
		editURLElement.hidden = true;
		rules.forEach(rule => {
			if (showAllProfilesInput.checked || selectedProfileName == rule.profile || selectedProfileName == rule.autoSaveProfile) {
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
				ruleDeleteButton.addEventListener("click", async () => {
					if (confirm(browser.i18n.getMessage("optionsDeleteRuleConfirm"))) {
						await singlefile.config.deleteRule(rule.url);
						await refresh();
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
						ruleEditButton.onclick = async () => {
							rulesElement.appendChild(editURLElement);
							await singlefile.config.updateRule(rule.url, ruleEditUrlInput.value, ruleEditProfileInput.value, ruleEditAutoSaveProfileInput.value);
							await refresh();
						};
					}
				}, false);
			}
		});
		rulesElement.appendChild(createURLElement);
		profileNamesInput.value = selectedProfileName;
		renameProfileButton.disabled = deleteProfileButton.disabled = profileNamesInput.value == singlefile.config.DEFAULT_PROFILE_NAME;
		const profileOptions = profiles[selectedProfileName];
		removeHiddenElementsInput.checked = profileOptions.removeHiddenElements;
		removeUnusedStylesInput.checked = profileOptions.removeUnusedStyles;
		removeFramesInput.checked = profileOptions.removeFrames;
		removeImportsInput.checked = profileOptions.removeImports;
		removeScriptsInput.checked = profileOptions.removeScripts;
		saveRawPageInput.checked = profileOptions.saveRawPage;
		compressHTMLInput.checked = profileOptions.compressHTML;
		compressCSSInput.checked = profileOptions.compressCSS;
		lazyLoadImagesInput.checked = profileOptions.lazyLoadImages;
		maxLazyLoadImagesIdleTimeInput.value = profileOptions.maxLazyLoadImagesIdleTime;
		maxLazyLoadImagesIdleTimeInput.disabled = !profileOptions.lazyLoadImages;
		contextMenuEnabledInput.checked = profileOptions.contextMenuEnabled;
		filenameTemplateInput.value = profileOptions.filenameTemplate;
		shadowEnabledInput.checked = profileOptions.shadowEnabled;
		maxResourceSizeEnabledInput.checked = profileOptions.maxResourceSizeEnabled;
		maxResourceSizeInput.value = profileOptions.maxResourceSize;
		maxResourceSizeInput.disabled = !profileOptions.maxResourceSizeEnabled;
		confirmFilenameInput.checked = profileOptions.confirmFilename;
		conflictActionInput.value = profileOptions.conflictAction;
		removeAudioSrcInput.checked = profileOptions.removeAudioSrc;
		removeVideoSrcInput.checked = profileOptions.removeVideoSrc;
		displayInfobarInput.checked = profileOptions.displayInfobar;
		displayStatsInput.checked = profileOptions.displayStats;
		backgroundSaveInput.checked = profileOptions.backgroundSave;
		autoSaveDelayInput.value = profileOptions.autoSaveDelay;
		autoSaveDelayInput.disabled = !profileOptions.autoSaveLoadOrUnload && !profileOptions.autoSaveLoad;
		autoSaveLoadInput.checked = !profileOptions.autoSaveLoadOrUnload && profileOptions.autoSaveLoad;
		autoSaveLoadOrUnloadInput.checked = profileOptions.autoSaveLoadOrUnload;
		autoSaveUnloadInput.checked = !profileOptions.autoSaveLoadOrUnload && profileOptions.autoSaveUnload;
		autoSaveLoadInput.disabled = profileOptions.autoSaveLoadOrUnload;
		autoSaveUnloadInput.disabled = profileOptions.autoSaveLoadOrUnload;
		removeAlternativeFontsInput.checked = profileOptions.removeAlternativeFonts;
		removeAlternativeImagesInput.checked = profileOptions.removeAlternativeImages;
		groupDuplicateImagesInput.checked = profileOptions.groupDuplicateImages;
		removeAlternativeMediasInput.checked = profileOptions.removeAlternativeMedias;
		infobarTemplateInput.value = profileOptions.infobarTemplate;
		confirmInfobarInput.checked = profileOptions.confirmInfobar;
	}

	function getProfileText(profileName) {
		return profileName == singlefile.config.DEFAULT_PROFILE_NAME ? browser.i18n.getMessage("profileDefaultSettings") : profileName == singlefile.config.DISABLED_PROFILE_NAME ? browser.i18n.getMessage("profileDisabled") : profileName;
	}

	async function update() {
		await pendingSave;
		pendingSave = singlefile.config.updateProfile(profileNamesInput.value, {
			removeHiddenElements: removeHiddenElementsInput.checked,
			removeUnusedStyles: removeUnusedStylesInput.checked,
			removeFrames: removeFramesInput.checked,
			removeImports: removeImportsInput.checked,
			removeScripts: removeScriptsInput.checked,
			saveRawPage: saveRawPageInput.checked,
			compressHTML: compressHTMLInput.checked,
			compressCSS: compressCSSInput.checked,
			lazyLoadImages: lazyLoadImagesInput.checked,
			maxLazyLoadImagesIdleTime: Math.max(maxLazyLoadImagesIdleTimeInput.value, 0),
			contextMenuEnabled: contextMenuEnabledInput.checked,
			filenameTemplate: filenameTemplateInput.value,
			shadowEnabled: shadowEnabledInput.checked,
			maxResourceSizeEnabled: maxResourceSizeEnabledInput.checked,
			maxResourceSize: Math.max(maxResourceSizeInput.value, 0),
			confirmFilename: confirmFilenameInput.checked,
			conflictAction: conflictActionInput.value,
			removeAudioSrc: removeAudioSrcInput.checked,
			removeVideoSrc: removeVideoSrcInput.checked,
			displayInfobar: displayInfobarInput.checked,
			displayStats: displayStatsInput.checked,
			backgroundSave: backgroundSaveInput.checked,
			autoSaveDelay: Math.max(autoSaveDelayInput.value, 0),
			autoSaveLoad: autoSaveLoadInput.checked,
			autoSaveUnload: autoSaveUnloadInput.checked,
			autoSaveLoadOrUnload: autoSaveLoadOrUnloadInput.checked,
			removeAlternativeFonts: removeAlternativeFontsInput.checked,
			removeAlternativeImages: removeAlternativeImagesInput.checked,
			removeAlternativeMedias: removeAlternativeMediasInput.checked,
			groupDuplicateImages: groupDuplicateImagesInput.checked,
			infobarTemplate: infobarTemplateInput.value,
			confirmInfobar: confirmInfobarInput.checked
		});
		await pendingSave;
		await singlefile.ui.menu.refresh();
	}

})();
