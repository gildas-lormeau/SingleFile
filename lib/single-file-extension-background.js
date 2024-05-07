(function () {
	'use strict';

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

	const STATE_DOWNLOAD_COMPLETE = "complete";
	const STATE_DOWNLOAD_INTERRUPTED = "interrupted";
	const STATE_ERROR_CANCELED_CHROMIUM = "USER_CANCELED";
	const ERROR_DOWNLOAD_CANCELED_GECKO = "canceled";
	const ERROR_CONFLICT_ACTION_GECKO = "conflictaction prompt not yet implemented";
	const ERROR_INCOGNITO_GECKO = "'incognito'";
	const ERROR_INCOGNITO_GECKO_ALT = "\"incognito\"";
	const ERROR_INVALID_FILENAME_GECKO = "illegal characters";
	const ERROR_INVALID_FILENAME_CHROMIUM = "invalid filename";

	async function download(downloadInfo, replacementCharacter) {
		let downloadId;
		try {
			downloadId = await browser.downloads.download(downloadInfo);
		} catch (error) {
			if (error.message) {
				const errorMessage = error.message.toLowerCase();
				const invalidFilename = errorMessage.includes(ERROR_INVALID_FILENAME_GECKO) || errorMessage.includes(ERROR_INVALID_FILENAME_CHROMIUM);
				if (invalidFilename && downloadInfo.filename.startsWith(".")) {
					downloadInfo.filename = replacementCharacter + downloadInfo.filename;
					return download(downloadInfo, replacementCharacter);
				} else if (invalidFilename && downloadInfo.filename.includes(",")) {
					downloadInfo.filename = downloadInfo.filename.replace(/,/g, replacementCharacter);
					return download(downloadInfo, replacementCharacter);
				} else if (invalidFilename && downloadInfo.filename.match(/\u200C|\u200D|\u200E|\u200F/)) {
					downloadInfo.filename = downloadInfo.filename.replace(/\u200C|\u200D|\u200E|\u200F/g, replacementCharacter);
					return download(downloadInfo, replacementCharacter);
				} else if (invalidFilename && !downloadInfo.filename.match(/^[\x00-\x7F]+$/)) { // eslint-disable-line  no-control-regex
					downloadInfo.filename = downloadInfo.filename.replace(/[^\x00-\x7F]+/g, replacementCharacter); // eslint-disable-line  no-control-regex
					return download(downloadInfo, replacementCharacter);
				} else if ((errorMessage.includes(ERROR_INCOGNITO_GECKO) || errorMessage.includes(ERROR_INCOGNITO_GECKO_ALT)) && downloadInfo.incognito) {
					delete downloadInfo.incognito;
					return download(downloadInfo, replacementCharacter);
				} else if (errorMessage == ERROR_CONFLICT_ACTION_GECKO && downloadInfo.conflictAction) {
					delete downloadInfo.conflictAction;
					return download(downloadInfo, replacementCharacter);
				} else if (errorMessage.includes(ERROR_DOWNLOAD_CANCELED_GECKO)) {
					return {};
				} else {
					throw error;
				}
			} else {
				throw error;
			}
		}
		return new Promise((resolve, reject) => {
			browser.downloads.onChanged.addListener(onChanged);

			function onChanged(event) {
				if (event.id == downloadId && event.state) {
					if (event.state.current == STATE_DOWNLOAD_COMPLETE) {
						browser.downloads.search({ id: downloadId })
							.then(downloadItems => resolve({ filename: downloadItems[0] && downloadItems[0].filename }))
							.catch(() => resolve({}));
						browser.downloads.onChanged.removeListener(onChanged);
					}
					if (event.state.current == STATE_DOWNLOAD_INTERRUPTED) {
						if (event.error && event.error.current == STATE_ERROR_CANCELED_CHROMIUM) {
							resolve({});
						} else {
							reject(new Error(event.state.current));
						}
						browser.downloads.onChanged.removeListener(onChanged);
					}
				}
			}
		});
	}

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

	/* global browser, setTimeout */

	let persistentData, temporaryData, cleanedUp;
	setTimeout(() => getPersistent().then(tabsData => persistentData = tabsData), 0);

	function onMessage$e(message) {
		if (message.method.endsWith(".get")) {
			return getPersistent();
		}
		if (message.method.endsWith(".set")) {
			return setPersistent(message.tabsData);
		}
	}

	async function onTabReplaced$3(addedTabId, removedTabId) {
		let tabsData = await getPersistent();
		await updateTabsData(tabsData, addedTabId, removedTabId);
		setPersistent(tabsData);
		await updateTabsData(temporaryData, addedTabId, removedTabId);
	}

	async function updateTabsData(tabsData, addedTabId, removedTabId) {
		if (tabsData[removedTabId] && !tabsData[addedTabId]) {
			tabsData[addedTabId] = tabsData[removedTabId];
			delete tabsData[removedTabId];
		}
	}

	async function remove(tabId) {
		if (temporaryData) {
			delete temporaryData[tabId];
		}
		const tabsData = await getPersistent();
		if (tabsData[tabId]) {
			const autoSave = tabsData[tabId].autoSave;
			tabsData[tabId] = { autoSave };
			await setPersistent(tabsData);
		}
	}

	function getTemporary(desiredTabId) {
		if (!temporaryData) {
			temporaryData = {};
		}
		if (desiredTabId !== undefined && !temporaryData[desiredTabId]) {
			temporaryData[desiredTabId] = {};
		}
		return temporaryData;
	}

	async function getPersistent(desiredTabId) {
		if (!persistentData) {
			const config = await browser.storage.local.get();
			persistentData = config.tabsData || {};
		}
		cleanup();
		if (desiredTabId !== undefined && !persistentData[desiredTabId]) {
			persistentData[desiredTabId] = {};
		}
		return persistentData;
	}

	async function setPersistent(tabsData) {
		persistentData = tabsData;
		await browser.storage.local.set({ tabsData });
	}

	async function cleanup() {
		if (!cleanedUp) {
			cleanedUp = true;
			const tabs = await browser.tabs.query({ currentWindow: true, highlighted: true });
			Object.keys(persistentData).filter(key => {
				if (key != "autoSaveAll" && key != "autoSaveUnpinned" && key != "profileName") {
					return !tabs.find(tab => tab.id == key);
				}
			}).forEach(tabId => delete persistentData[tabId]);
			await browser.storage.local.set({ tabsData: persistentData });
		}
	}

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

	const CURRENT_PROFILE_NAME = "-";
	const DEFAULT_PROFILE_NAME = "__Default_Settings__";
	const DISABLED_PROFILE_NAME = "__Disabled_Settings__";
	const REGEXP_RULE_PREFIX = "regexp:";
	const PROFILE_NAME_PREFIX = "profile_";

	const IS_NOT_SAFARI = !/Safari/.test(navigator.userAgent) || /Chrome/.test(navigator.userAgent) || /Vivaldi/.test(navigator.userAgent) || /OPR/.test(navigator.userAgent);
	const BACKGROUND_SAVE_SUPPORTED = !(/Mobile.*Firefox/.test(navigator.userAgent) || /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent) && !/Vivaldi/.test(navigator.userAgent) && !/OPR/.test(navigator.userAgent));
	const BADGE_COLOR_SUPPORTED = IS_NOT_SAFARI;
	const AUTO_SAVE_SUPPORTED = IS_NOT_SAFARI;
	const SELECTABLE_TABS_SUPPORTED = IS_NOT_SAFARI;
	const AUTO_OPEN_EDITOR_SUPPORTED = IS_NOT_SAFARI;
	const INFOBAR_SUPPORTED = IS_NOT_SAFARI;
	const BOOKMARKS_API_SUPPORTED = IS_NOT_SAFARI;
	const IDENTITY_API_SUPPORTED = IS_NOT_SAFARI;
	const CLIPBOARD_API_SUPPORTED = IS_NOT_SAFARI;
	const NATIVE_API_API_SUPPORTED = IS_NOT_SAFARI;
	const WEB_BLOCKING_API_SUPPORTED = IS_NOT_SAFARI;
	const SHARE_API_SUPPORTED = navigator.canShare && navigator.canShare({ files: [new File([new Blob([""], { type: "text/html" })], "test.html")] });

	const DEFAULT_CONFIG = {
		removeHiddenElements: true,
		removeUnusedStyles: true,
		removeUnusedFonts: true,
		removeFrames: false,
		compressHTML: true,
		compressCSS: false,
		loadDeferredImages: true,
		loadDeferredImagesMaxIdleTime: 1500,
		loadDeferredImagesBlockCookies: false,
		loadDeferredImagesBlockStorage: false,
		loadDeferredImagesKeepZoomLevel: false,
		loadDeferredImagesDispatchScrollEvent: false,
		loadDeferredImagesBeforeFrames: false,
		filenameTemplate: "%if-empty<{page-title}|No title> ({date-locale} {time-locale}).{filename-extension}",
		infobarTemplate: "",
		includeInfobar: !IS_NOT_SAFARI,
		confirmInfobarContent: false,
		autoClose: false,
		confirmFilename: false,
		filenameConflictAction: "uniquify",
		filenameMaxLength: 192,
		filenameMaxLengthUnit: "bytes",
		filenameReplacedCharacters: ["~", "+", "\\\\", "?", "%", "*", ":", "|", "\"", "<", ">", "\x00-\x1f", "\x7F"],
		filenameReplacementCharacter: "_",
		replaceEmojisInFilename: false,
		saveFilenameTemplateData: false,
		contextMenuEnabled: true,
		tabMenuEnabled: true,
		browserActionMenuEnabled: true,
		shadowEnabled: true,
		logsEnabled: true,
		progressBarEnabled: true,
		maxResourceSizeEnabled: false,
		maxResourceSize: 10,
		displayInfobar: true,
		displayStats: false,
		backgroundSave: BACKGROUND_SAVE_SUPPORTED,
		defaultEditorMode: "normal",
		applySystemTheme: true,
		autoSaveDelay: 1,
		autoSaveLoad: false,
		autoSaveUnload: false,
		autoSaveLoadOrUnload: true,
		autoSaveDiscard: false,
		autoSaveRemove: false,
		autoSaveRepeat: false,
		autoSaveRepeatDelay: 10,
		removeAlternativeFonts: true,
		removeAlternativeMedias: true,
		removeAlternativeImages: true,
		groupDuplicateImages: true,
		maxSizeDuplicateImages: 512 * 1024,
		saveRawPage: false,
		saveToClipboard: false,
		addProof: false,
		saveToGDrive: false,
		saveToDropbox: false,
		saveWithWebDAV: false,
		webDAVURL: "",
		webDAVUser: "",
		webDAVPassword: "",
		saveToGitHub: false,
		saveToRestFormApi: false,
		githubToken: "",
		githubUser: "",
		githubRepository: "SingleFile-Archives",
		githubBranch: "main",
		saveWithCompanion: false,
		sharePage: false,
		forceWebAuthFlow: false,
		resolveFragmentIdentifierURLs: false,
		userScriptEnabled: false,
		openEditor: false,
		openSavedPage: false,
		autoOpenEditor: false,
		saveCreatedBookmarks: false,
		allowedBookmarkFolders: [],
		ignoredBookmarkFolders: [],
		replaceBookmarkURL: true,
		saveFavicon: true,
		includeBOM: false,
		warnUnsavedPage: true,
		displayInfobarInEditor: false,
		compressContent: false,
		createRootDirectory: false,
		selfExtractingArchive: true,
		extractDataFromPage: true,
		preventAppendedData: false,
		insertEmbeddedImage: false,
		insertEmbeddedScreenshotImage: false,
		insertTextBody: false,
		autoSaveExternalSave: false,
		insertMetaNoIndex: false,
		insertMetaCSP: true,
		passReferrerOnError: false,
		password: "",
		insertSingleFileComment: true,
		removeSavedDate: false,
		blockMixedContent: false,
		saveOriginalURLs: false,
		acceptHeaders: {
			font: "application/font-woff2;q=1.0,application/font-woff;q=0.9,*/*;q=0.8",
			image: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
			stylesheet: "text/css,*/*;q=0.1",
			script: "*/*",
			document: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
			video: "video/webm,video/ogg,video/*;q=0.9,application/ogg;q=0.7,audio/*;q=0.6,*/*;q=0.5",
			audio: "audio/webm,audio/ogg,audio/wav,audio/*;q=0.9,application/ogg;q=0.7,video/*;q=0.6,*/*;q=0.5"
		},
		moveStylesInHead: false,
		networkTimeout: 0,
		woleetKey: "",
		blockImages: false,
		blockStylesheets: false,
		blockFonts: false,
		blockScripts: true,
		blockVideos: true,
		blockAudios: true,
		delayBeforeProcessing: 0,
		_migratedTemplateFormat: true,
		saveToRestFormApiUrl: "",
		saveToRestFormApiFileFieldName: "",
		saveToRestFormApiUrlFieldName: "",
		saveToRestFormApiToken: "",
	};

	const DEFAULT_RULES = [{
		"url": "file:",
		"profile": "__Default_Settings__",
		"autoSaveProfile": "__Disabled_Settings__"
	}];

	const MIGRATION_DEFAULT_VARIABLES_VALUES = {
		"page-title": "No title",
		"page-heading": "No heading",
		"page-language": "No language",
		"page-description": "No description",
		"page-author": "No author",
		"page-creator": "No creator",
		"page-publisher": "No publisher",
		"url-hash": "No hash",
		"url-host": "No host",
		"url-hostname": "No hostname",
		"url-href": "No href",
		"url-href-digest-sha-1": "No hash",
		"url-href-flat": "No href",
		"url-referrer": "No referrer",
		"url-referrer-flat": "No referrer",
		"url-password": "No password",
		"url-pathname": "No pathname",
		"url-pathname-flat": "No pathname",
		"url-port": "No port",
		"url-protocol": "No protocol",
		"url-search": "No search",
		"url-username": "No username",
		"tab-id": "No tab id",
		"tab-index": "No tab index",
		"url-last-segment": "No last segment"
	};

	let configStorage;
	let pendingUpgradePromise = upgrade();

	async function upgrade() {
		const { sync } = await browser.storage.local.get();
		if (sync) {
			configStorage = browser.storage.sync;
		} else {
			configStorage = browser.storage.local;
		}
		const config = await configStorage.get();
		if (!config[PROFILE_NAME_PREFIX + DEFAULT_PROFILE_NAME]) {
			if (config.profiles) {
				const profileNames = Object.keys(config.profiles);
				for (const profileName of profileNames) {
					await setProfile(profileName, config.profiles[profileName]);
				}
			} else {
				await setProfile(DEFAULT_PROFILE_NAME, DEFAULT_CONFIG);
			}
		} else if (config.profiles) {
			await configStorage.remove(["profiles"]);
		}
		if (!config.rules) {
			await configStorage.set({ rules: DEFAULT_RULES });
		}
		if (!config.maxParallelWorkers) {
			await configStorage.set({ maxParallelWorkers: navigator.hardwareConcurrency || 4 });
		}
		if (!config.processInForeground) {
			await configStorage.set({ processInForeground: false });
		}
		const profileNames = await getProfileNames();
		profileNames.map(async profileName => {
			const profile = await getProfile(profileName);
			if (!profile._migratedTemplateFormat) {
				profile.filenameTemplate = updateFilenameTemplate(profile.filenameTemplate);
				profile._migratedTemplateFormat = true;
			}
			for (const key of Object.keys(DEFAULT_CONFIG)) {
				if (profile[key] === undefined) {
					profile[key] = DEFAULT_CONFIG[key];
				}
			}
			await setProfile(profileName, profile);
		});
	}

	function updateFilenameTemplate(template) {
		try {
			Object.keys(MIGRATION_DEFAULT_VARIABLES_VALUES).forEach(variable => {
				const value = MIGRATION_DEFAULT_VARIABLES_VALUES[variable];
				template = template.replaceAll(`{${variable}}`, `%if-empty<{${variable}}|${value}>`);
			});
			return template;
		} catch (_error) {
			// ignored
		}
	}

	async function getRule(url, ignoreWildcard) {
		const { rules } = await configStorage.get(["rules"]);
		const regExpRules = rules.filter(rule => testRegExpRule(rule));
		let rule = regExpRules.sort(sortRules).find(rule => url && url.match(new RegExp(rule.url.split(REGEXP_RULE_PREFIX)[1])));
		if (!rule) {
			const normalRules = rules.filter(rule => !testRegExpRule(rule));
			rule = normalRules.sort(sortRules).find(rule => (!ignoreWildcard && rule.url == "*") || (url && url.includes(rule.url)));
		}
		return rule;
	}

	async function getConfig() {
		await pendingUpgradePromise;
		const { maxParallelWorkers, processInForeground } = await configStorage.get(["maxParallelWorkers", "processInForeground"]);
		const rules = await getRules();
		const profiles = await getProfiles();
		return { profiles, rules, maxParallelWorkers, processInForeground };
	}

	function sortRules(ruleLeft, ruleRight) {
		return ruleRight.url.length - ruleLeft.url.length;
	}

	function testRegExpRule(rule) {
		return rule.url.toLowerCase().startsWith(REGEXP_RULE_PREFIX);
	}

	async function onMessage$d(message) {
		if (message.method.endsWith(".deleteRules")) {
			await deleteRules(message.profileName);
		}
		if (message.method.endsWith(".deleteRule")) {
			await deleteRule(message.url);
		}
		if (message.method.endsWith(".addRule")) {
			await addRule(message.url, message.profileName, message.autoSaveProfileName);
		}
		if (message.method.endsWith(".createProfile")) {
			await createProfile(message.profileName, message.fromProfileName || DEFAULT_PROFILE_NAME);
		}
		if (message.method.endsWith(".renameProfile")) {
			await renameProfile(message.profileName, message.newProfileName);
		}
		if (message.method.endsWith(".deleteProfile")) {
			await deleteProfile(message.profileName);
		}
		if (message.method.endsWith(".resetProfiles")) {
			await resetProfiles();
		}
		if (message.method.endsWith(".resetProfile")) {
			await resetProfile(message.profileName);
		}
		if (message.method.endsWith(".importConfig")) {
			await importConfig(message.config);
		}
		if (message.method.endsWith(".updateProfile")) {
			await updateProfile(message.profileName, message.profile);
		}
		if (message.method.endsWith(".updateRule")) {
			await updateRule(message.url, message.newUrl, message.profileName, message.autoSaveProfileName);
		}
		if (message.method.endsWith(".getConstants")) {
			return {
				DISABLED_PROFILE_NAME,
				DEFAULT_PROFILE_NAME,
				CURRENT_PROFILE_NAME,
				BACKGROUND_SAVE_SUPPORTED,
				BADGE_COLOR_SUPPORTED,
				AUTO_SAVE_SUPPORTED,
				SELECTABLE_TABS_SUPPORTED,
				AUTO_OPEN_EDITOR_SUPPORTED,
				INFOBAR_SUPPORTED,
				BOOKMARKS_API_SUPPORTED,
				IDENTITY_API_SUPPORTED,
				CLIPBOARD_API_SUPPORTED,
				NATIVE_API_API_SUPPORTED,
				WEB_BLOCKING_API_SUPPORTED,
				SHARE_API_SUPPORTED
			};
		}
		if (message.method.endsWith(".getRules")) {
			return getRules();
		}
		if (message.method.endsWith(".getProfiles")) {
			return getProfiles();
		}
		if (message.method.endsWith(".exportConfig")) {
			return exportConfig();
		}
		if (message.method.endsWith(".enableSync")) {
			await browser.storage.local.set({ sync: true });
			const syncConfig = await browser.storage.sync.get();
			if (!syncConfig || !syncConfig.rules) {
				const profileKeyNames = await getProfileKeyNames();
				const localConfig = await browser.storage.local.get(["rules", "maxParallelWorkers", "processInForeground", ...profileKeyNames]);
				await browser.storage.sync.set(localConfig);
			}
			configStorage = browser.storage.sync;
			await upgrade();
			return {};
		}
		if (message.method.endsWith(".disableSync")) {
			await browser.storage.local.set({ sync: false });
			const syncConfig = await browser.storage.sync.get();
			const localConfig = await browser.storage.local.get();
			if (syncConfig && syncConfig.rules && (!localConfig || !localConfig.rules)) {
				await browser.storage.local.set({ rules: syncConfig.rules, maxParallelWorkers: syncConfig.maxParallelWorkers, processInForeground: syncConfig.processInForeground });
				const profiles = {};
				// syncConfig.profileNames.forEach(profileKeyName => profiles[PROFILE_NAME_PREFIX + profileKeyName] = syncConfig[profileKeyName]);
				await browser.storage.local.set(profiles);
			}
			configStorage = browser.storage.local;
			await upgrade();
			return {};
		}
		if (message.method.endsWith(".isSync")) {
			return { sync: (await browser.storage.local.get()).sync };
		}
		return {};
	}

	async function createProfile(profileName, fromProfileName) {
		const profileNames = await getProfileNames();
		if (profileNames.includes(profileName)) {
			throw new Error("Duplicate profile name");
		}
		const profileFrom = await getProfile(fromProfileName);
		const profile = JSON.parse(JSON.stringify(profileFrom));
		await setProfile(profileName, profile);
	}

	async function getProfiles() {
		await pendingUpgradePromise;
		const profileKeyNames = await getProfileKeyNames();
		const profiles = await configStorage.get(profileKeyNames);
		const result = {};
		Object.keys(profiles).forEach(profileName => result[profileName.substring(PROFILE_NAME_PREFIX.length)] = profiles[profileName]);
		return result;
	}

	async function getOptions(url, autoSave) {
		await pendingUpgradePromise;
		const [rule, allTabsData] = await Promise.all([getRule(url), getPersistent()]);
		const tabProfileName = allTabsData.profileName || DEFAULT_PROFILE_NAME;
		let selectedProfileName;
		if (rule) {
			const profileName = rule[autoSave ? "autoSaveProfile" : "profile"];
			selectedProfileName = profileName == CURRENT_PROFILE_NAME ? tabProfileName : profileName;
		} else {
			selectedProfileName = tabProfileName;
		}
		const profile = await getProfile(selectedProfileName);
		return Object.assign({ profileName: selectedProfileName }, profile);
	}

	async function updateProfile(profileName, profile) {
		const profileNames = await getProfileNames();
		if (!profileNames.includes(profileName)) {
			throw new Error("Profile not found");
		}
		const previousProfile = await getProfile(profileName);
		Object.keys(previousProfile).forEach(key => {
			profile[key] = profile[key] === undefined ? previousProfile[key] : profile[key];
		});
		await setProfile(profileName, profile);
	}

	async function renameProfile(oldProfileName, profileName) {
		const profileNames = await getProfileNames();
		const allTabsData = await getPersistent();
		const rules = await getRules();
		if (!profileNames.includes(oldProfileName)) {
			throw new Error("Profile not found");
		}
		if (profileNames.includes(profileName)) {
			throw new Error("Duplicate profile name");
		}
		if (oldProfileName == DEFAULT_PROFILE_NAME) {
			throw new Error("Default settings cannot be renamed");
		}
		if (allTabsData.profileName == oldProfileName) {
			allTabsData.profileName = profileName;
			await setPersistent(allTabsData);
		}
		rules.forEach(rule => {
			if (rule.profile == oldProfileName) {
				rule.profile = profileName;
			}
			if (rule.autoSaveProfile == oldProfileName) {
				rule.autoSaveProfile = profileName;
			}
		});
		const profile = await getProfile(oldProfileName);
		await configStorage.remove([PROFILE_NAME_PREFIX + oldProfileName]);
		await configStorage.set({ [PROFILE_NAME_PREFIX + profileName]: profile, rules });
	}

	async function deleteProfile(profileName) {
		const profileNames = await getProfileNames();
		const allTabsData = await getPersistent();
		const rules = await getRules();
		if (!profileNames.includes(profileName)) {
			throw new Error("Profile not found");
		}
		if (profileName == DEFAULT_PROFILE_NAME) {
			throw new Error("Default settings cannot be deleted");
		}
		if (allTabsData.profileName == profileName) {
			delete allTabsData.profileName;
			await setPersistent(allTabsData);
		}
		rules.forEach(rule => {
			if (rule.profile == profileName) {
				rule.profile = DEFAULT_PROFILE_NAME;
			}
			if (rule.autoSaveProfile == profileName) {
				rule.autoSaveProfile = DEFAULT_PROFILE_NAME;
			}
		});
		configStorage.remove([PROFILE_NAME_PREFIX + profileName]);
		await configStorage.set({ rules });
	}

	async function getRules() {
		return (await configStorage.get(["rules"])).rules;
	}

	async function getProfileNames() {
		return Object.keys(await configStorage.get()).filter(key => key.startsWith(PROFILE_NAME_PREFIX)).map(key => key.substring(PROFILE_NAME_PREFIX.length));
	}

	async function getProfileKeyNames() {
		return Object.keys(await configStorage.get()).filter(key => key.startsWith(PROFILE_NAME_PREFIX));
	}

	async function getProfile(profileName) {
		const profileKey = PROFILE_NAME_PREFIX + profileName;
		const data = await configStorage.get([profileKey]);
		return data[profileKey];
	}

	async function setProfile(profileName, profileData) {
		const profileKey = PROFILE_NAME_PREFIX + profileName;
		await configStorage.set({ [profileKey]: profileData });
	}

	async function addRule(url, profile, autoSaveProfile) {
		if (!url) {
			throw new Error("URL is empty");
		}
		const rules = await getRules();
		if (rules.find(rule => rule.url == url)) {
			throw new Error("URL already exists");
		}
		rules.push({
			url,
			profile,
			autoSaveProfile
		});
		await configStorage.set({ rules });
	}

	async function deleteRule(url) {
		if (!url) {
			throw new Error("URL is empty");
		}
		const rules = await getRules();
		await configStorage.set({ rules: rules.filter(rule => rule.url != url) });
	}

	async function deleteRules(profileName) {
		const rules = await getRules();
		await configStorage.set({ rules: profileName ? rules.filter(rule => rule.autoSaveProfile != profileName && rule.profile != profileName) : [] });
	}

	async function updateRule(url, newURL, profile, autoSaveProfile) {
		if (!url || !newURL) {
			throw new Error("URL is empty");
		}
		const rules = await getRules();
		const urlConfig = rules.find(rule => rule.url == url);
		if (!urlConfig) {
			throw new Error("URL not found");
		}
		if (rules.find(rule => rule.url == newURL && rule.url != url)) {
			throw new Error("New URL already exists");
		}
		urlConfig.url = newURL;
		urlConfig.profile = profile;
		urlConfig.autoSaveProfile = autoSaveProfile;
		await configStorage.set({ rules });
	}

	async function getAuthInfo$1() {
		return (await configStorage.get()).authInfo;
	}

	async function getDropboxAuthInfo$1() {
		return (await configStorage.get()).dropboxAuthInfo;
	}

	async function setAuthInfo(authInfo) {
		await configStorage.set({ authInfo });
	}

	async function setDropboxAuthInfo(authInfo) {
		await configStorage.set({ dropboxAuthInfo: authInfo });
	}

	async function removeAuthInfo() {
		let authInfo = getAuthInfo$1();
		if (authInfo.revokableAccessToken) {
			setAuthInfo({ revokableAccessToken: authInfo.revokableAccessToken });
		} else {
			await configStorage.remove(["authInfo"]);
		}
	}

	async function removeDropboxAuthInfo() {
		let authInfo = getDropboxAuthInfo$1();
		if (authInfo.revokableAccessToken) {
			setDropboxAuthInfo({ revokableAccessToken: authInfo.revokableAccessToken });
		} else {
			await configStorage.remove(["dropboxAuthInfo"]);
		}
	}

	async function resetProfiles() {
		await pendingUpgradePromise;
		const allTabsData = await getPersistent();
		delete allTabsData.profileName;
		await setPersistent(allTabsData);
		let profileKeyNames = await getProfileKeyNames();
		await configStorage.remove([...profileKeyNames, "rules", "maxParallelWorkers", "processInForeground"]);
		await upgrade();
	}

	async function resetProfile(profileName) {
		const profileNames = await getProfileNames();
		if (!profileNames.includes(profileName)) {
			throw new Error("Profile not found");
		}
		await setProfile(profileName, DEFAULT_CONFIG);
	}

	async function exportConfig() {
		const config = await getConfig();
		const textContent = JSON.stringify({ profiles: config.profiles, rules: config.rules, maxParallelWorkers: config.maxParallelWorkers, processInForeground: config.processInForeground }, null, 2);
		const filename = `singlefile-settings-${(new Date()).toISOString().replace(/:/g, "_")}.json`;
		if (BACKGROUND_SAVE_SUPPORTED) {
			const url = URL.createObjectURL(new Blob([textContent], { type: "text/json" }));
			try {
				await download({
					url,
					filename,
					saveAs: true
				}, "_");
			} finally {
				URL.revokeObjectURL(url);
			}
			return {};
		} else {
			return {
				filename,
				textContent
			};
		}
	}

	async function importConfig(config) {
		const profileNames = await getProfileNames();
		const profileKeyNames = await getProfileKeyNames();
		const allTabsData = await getPersistent();
		if (profileNames.includes(allTabsData.profileName)) {
			delete allTabsData.profileName;
			await setPersistent(allTabsData);
		}
		await configStorage.remove([...profileKeyNames, "rules", "maxParallelWorkers", "processInForeground"]);
		const newConfig = { rules: config.rules, maxParallelWorkers: config.maxParallelWorkers, processInForeground: config.processInForeground };
		Object.keys(config.profiles).forEach(profileName => newConfig[PROFILE_NAME_PREFIX + profileName] = config.profiles[profileName]);
		await configStorage.set(newConfig);
		await upgrade();
	}

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

	async function autoSaveIsEnabled(tab) {
		if (tab) {
			const [allTabsData, rule] = await Promise.all([getPersistent(), getRule(tab.url)]);
			return Boolean(allTabsData.autoSaveAll ||
				(allTabsData.autoSaveUnpinned && !tab.pinned) ||
				(allTabsData[tab.id] && allTabsData[tab.id].autoSave)) &&
				(!rule || rule.autoSaveProfile != DISABLED_PROFILE_NAME);
		}
	}

	async function refreshAutoSaveTabs() {
		const tabs = (await browser.tabs.query({}));
		return Promise.all(tabs.map(async tab => {
			const [options, autoSaveEnabled] = await Promise.all([getOptions(tab.url, true), autoSaveIsEnabled(tab)]);
			try {
				await browser.tabs.sendMessage(tab.id, { method: "content.init", autoSaveEnabled, options });
			} catch (error) {
				// ignored
			}
		}));
	}

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

	async function onMessage$c(message, sender) {
		if (message.method.endsWith(".init")) {
			const [optionsAutoSave, options, autoSaveEnabled] = await Promise.all([getOptions(sender.tab.url, true), getOptions(sender.tab.url), autoSaveIsEnabled(sender.tab)]);
			return { optionsAutoSave, options, autoSaveEnabled, tabId: sender.tab.id, tabIndex: sender.tab.index };
		}
	}

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

	const MAX_CONTENT_SIZE$1 = 32 * (1024 * 1024);
	const EDITOR_PAGE_URL = "/src/ui/pages/editor.html";
	const tabsData = new Map();
	const partialContents$1 = new Map();
	const EDITOR_URL = browser.runtime.getURL(EDITOR_PAGE_URL);

	async function open({ tabIndex, content, filename, compressContent, selfExtractingArchive, extractDataFromPage, insertTextBody, insertMetaCSP, embeddedImage }) {
		const createTabProperties = { active: true, url: EDITOR_PAGE_URL };
		if (tabIndex != null) {
			createTabProperties.index = tabIndex;
		}
		const tab = await browser.tabs.create(createTabProperties);
		tabsData.set(tab.id, {
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

	function onTabRemoved$2(tabId) {
		tabsData.delete(tabId);
	}

	function isEditor(tab) {
		return tab.url == EDITOR_URL;
	}

	async function onMessage$b(message, sender) {
		if (message.method.endsWith(".getTabData")) {
			const tab = sender.tab;
			const tabData = tabsData.get(tab.id);
			if (tabData) {
				const options = await getOptions(tabData.url);
				const content = JSON.stringify(tabData);
				for (let blockIndex = 0; blockIndex * MAX_CONTENT_SIZE$1 < content.length; blockIndex++) {
					const message = {
						method: "editor.setTabData",
						compressContent: tabData.compressContent
					};
					message.truncated = content.length > MAX_CONTENT_SIZE$1;
					if (message.truncated) {
						message.finished = (blockIndex + 1) * MAX_CONTENT_SIZE$1 > content.length;
						message.content = content.substring(blockIndex * MAX_CONTENT_SIZE$1, (blockIndex + 1) * MAX_CONTENT_SIZE$1);
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
				contents = partialContents$1.get(tab.id);
				if (!contents) {
					contents = [];
					partialContents$1.set(tab.id, contents);
				}
				contents.push(message.content);
				if (message.finished) {
					partialContents$1.delete(tab.id);
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
		if (message.method.endsWith(".ping")) {
			return {};
		}
	}

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

	/* global browser, XMLHttpRequest */

	const referrers = new Map();
	const REQUEST_ID_HEADER_NAME = "x-single-file-request-id";
	const MAX_CONTENT_SIZE = 8 * (1024 * 1024);

	browser.runtime.onMessage.addListener((message, sender) => {
		if (message.method && message.method.startsWith("singlefile.fetch")) {
			return new Promise(resolve => {
				onRequest(message, sender)
					.then(resolve)
					.catch(error => resolve({ error: error && error.toString() }));
			});
		}
	});

	async function onRequest(message, sender) {
		if (message.method == "singlefile.fetch") {
			try {
				const response = await fetchResource$1(message.url, { referrer: message.referrer, headers: message.headers });
				return sendResponse(sender.tab.id, message.requestId, response);
			} catch (error) {
				return sendResponse(sender.tab.id, message.requestId, { error: error.message, array: [] });
			}
		} else if (message.method == "singlefile.fetchFrame") {
			return browser.tabs.sendMessage(sender.tab.id, message);
		}
	}

	async function sendResponse(tabId, requestId, response) {
		for (let blockIndex = 0; blockIndex * MAX_CONTENT_SIZE <= response.array.length; blockIndex++) {
			const message = {
				method: "singlefile.fetchResponse",
				requestId,
				headers: response.headers,
				status: response.status,
				error: response.error
			};
			message.truncated = response.array.length > MAX_CONTENT_SIZE;
			if (message.truncated) {
				message.finished = (blockIndex + 1) * MAX_CONTENT_SIZE > response.array.length;
				message.array = response.array.slice(blockIndex * MAX_CONTENT_SIZE, (blockIndex + 1) * MAX_CONTENT_SIZE);
			} else {
				message.array = response.array;
			}
			await browser.tabs.sendMessage(tabId, message);
		}
		return {};
	}

	function fetchResource$1(url, options = {}, includeRequestId) {
		return new Promise((resolve, reject) => {
			const xhrRequest = new XMLHttpRequest();
			xhrRequest.withCredentials = true;
			xhrRequest.responseType = "arraybuffer";
			xhrRequest.onerror = event => reject(new Error(event.detail));
			xhrRequest.onreadystatechange = () => {
				if (xhrRequest.readyState == XMLHttpRequest.DONE) {
					if (xhrRequest.status || xhrRequest.response.byteLength) {
						if ((xhrRequest.status == 401 || xhrRequest.status == 403 || xhrRequest.status == 404) && !includeRequestId) {
							fetchResource$1(url, options, true)
								.then(resolve)
								.catch(reject);
						} else {
							resolve({
								arrayBuffer: xhrRequest.response,
								array: Array.from(new Uint8Array(xhrRequest.response)),
								headers: { "content-type": xhrRequest.getResponseHeader("Content-Type") },
								status: xhrRequest.status
							});
						}
					} else {
						reject(new Error("Empty response"));
					}
				}
			};
			xhrRequest.open("GET", url, true);
			if (options.headers) {
				for (const entry of Object.entries(options.headers)) {
					xhrRequest.setRequestHeader(entry[0], entry[1]);
				}
			}
			if (includeRequestId) {
				const randomId = String(Math.random()).substring(2);
				setReferrer(randomId, options.referrer);
				xhrRequest.setRequestHeader(REQUEST_ID_HEADER_NAME, randomId);
			}
			xhrRequest.send();
		});
	}

	function setReferrer(requestId, referrer) {
		referrers.set(requestId, referrer);
	}

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

	let referrerOnErrorEnabled = false;

	function onMessage$a(message) {
		if (message.method.endsWith(".enableReferrerOnError")) {
			enableReferrerOnError();
			return {};
		}
		if (message.method.endsWith(".disableReferrerOnError")) {
			disableReferrerOnError();
			return {};
		}
	}

	function injectRefererHeader(details) {
		if (referrerOnErrorEnabled) {
			let requestIdHeader = details.requestHeaders.find(header => header.name === REQUEST_ID_HEADER_NAME);
			if (requestIdHeader) {
				details.requestHeaders = details.requestHeaders.filter(header => header.name !== REQUEST_ID_HEADER_NAME);
				const referrer = referrers.get(requestIdHeader.value);
				if (referrer) {
					referrers.delete(requestIdHeader.value);
					const header = details.requestHeaders.find(header => header.name.toLowerCase() === "referer");
					if (!header) {
						details.requestHeaders.push({ name: "Referer", value: referrer });
						return { requestHeaders: details.requestHeaders };
					}
				}
			}
		}
	}

	function enableReferrerOnError() {
		if (!referrerOnErrorEnabled) {
			try {
				browser.webRequest.onBeforeSendHeaders.addListener(injectRefererHeader, { urls: ["<all_urls>"] }, ["blocking", "requestHeaders", "extraHeaders"]);
			} catch (error) {
				browser.webRequest.onBeforeSendHeaders.addListener(injectRefererHeader, { urls: ["<all_urls>"] }, ["blocking", "requestHeaders"]);
			}
			referrerOnErrorEnabled = true;
		}
	}

	function disableReferrerOnError() {
		try {
			browser.webRequest.onBeforeSendHeaders.removeListener(injectRefererHeader);
		} catch (error) {
			// ignored
		}
		referrerOnErrorEnabled = false;
	}

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

	async function queryTabs$1(options) {
		const tabs = await browser.tabs.query(options);
		return tabs.sort((tab1, tab2) => tab1.index - tab2.index);
	}

	function extractAuthCode(authURL) {
		return new Promise((resolve, reject) => {
			browser.tabs.onUpdated.addListener(onTabUpdated);

			function onTabUpdated(tabId, changeInfo) {
				if (changeInfo && changeInfo.url && changeInfo.url.startsWith(authURL)) {
					browser.tabs.onUpdated.removeListener(onTabUpdated);
					const code = new URLSearchParams(new URL(changeInfo.url).search).get("code");
					if (code) {
						browser.tabs.remove(tabId);
						resolve(code);
					} else {
						reject();
					}
				}
			}
		});
	}

	async function launchWebAuthFlow(options) {
		const tab = await browser.tabs.create({ url: options.url, active: true });
		return new Promise((resolve, reject) => {
			browser.tabs.onRemoved.addListener(onTabRemoved);
			function onTabRemoved(tabId) {
				if (tabId == tab.id) {
					browser.tabs.onRemoved.removeListener(onTabRemoved);
					reject(new Error("code_required"));
				}
			}
		});
	}

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

	const DEFAULT_ICON_PATH = "/src/ui/resources/icon_128.png";
	const WAIT_ICON_PATH_PREFIX = "/src/ui/resources/icon_128_wait";
	const BUTTON_DEFAULT_TOOLTIP_MESSAGE = browser.i18n.getMessage("buttonDefaultTooltip");
	const BUTTON_BLOCKED_TOOLTIP_MESSAGE = browser.i18n.getMessage("buttonBlockedTooltip");
	const BUTTON_DEFAULT_BADGE_MESSAGE = "";
	const BUTTON_INITIALIZING_BADGE_MESSAGE = browser.i18n.getMessage("buttonInitializingBadge");
	const BUTTON_INITIALIZING_TOOLTIP_MESSAGE = browser.i18n.getMessage("buttonInitializingTooltip");
	const BUTTON_ERROR_BADGE_MESSAGE = browser.i18n.getMessage("buttonErrorBadge");
	const BUTTON_BLOCKED_BADGE_MESSAGE = browser.i18n.getMessage("buttonBlockedBadge");
	const BUTTON_OK_BADGE_MESSAGE = browser.i18n.getMessage("buttonOKBadge");
	const BUTTON_SAVE_PROGRESS_TOOLTIP_MESSAGE = browser.i18n.getMessage("buttonSaveProgressTooltip");
	const BUTTON_UPLOAD_PROGRESS_TOOLTIP_MESSAGE = browser.i18n.getMessage("buttonUploadProgressTooltip");
	const BUTTON_AUTOSAVE_ACTIVE_BADGE_MESSAGE = browser.i18n.getMessage("buttonAutoSaveActiveBadge");
	const BUTTON_AUTOSAVE_ACTIVE_TOOLTIP_MESSAGE = browser.i18n.getMessage("buttonAutoSaveActiveTooltip");
	const DEFAULT_COLOR = [2, 147, 20, 192];
	const ACTIVE_COLOR = [4, 229, 36, 192];
	const FORBIDDEN_COLOR = [255, 255, 255, 1];
	const ERROR_COLOR = [229, 4, 12, 192];
	const AUTOSAVE_DEFAULT_COLOR = [208, 208, 208, 192];
	const AUTOSAVE_INITIALIZING_COLOR = [64, 64, 64, 192];
	const INJECT_SCRIPTS_STEP$1 = 1;

	const BUTTON_STATES = {
		default: {
			setBadgeBackgroundColor: { color: DEFAULT_COLOR },
			setBadgeText: { text: BUTTON_DEFAULT_BADGE_MESSAGE },
			setTitle: { title: BUTTON_DEFAULT_TOOLTIP_MESSAGE },
			setIcon: { path: DEFAULT_ICON_PATH }
		},
		inject: {
			setBadgeBackgroundColor: { color: DEFAULT_COLOR },
			setBadgeText: { text: BUTTON_INITIALIZING_BADGE_MESSAGE },
			setTitle: { title: BUTTON_INITIALIZING_TOOLTIP_MESSAGE },
		},
		execute: {
			setBadgeBackgroundColor: { color: ACTIVE_COLOR },
			setBadgeText: { text: BUTTON_INITIALIZING_BADGE_MESSAGE },
		},
		progress: {
			setBadgeBackgroundColor: { color: ACTIVE_COLOR },
			setBadgeText: { text: BUTTON_DEFAULT_BADGE_MESSAGE }
		},
		edit: {
			setBadgeBackgroundColor: { color: DEFAULT_COLOR },
			setBadgeText: { text: BUTTON_DEFAULT_BADGE_MESSAGE },
			setTitle: { title: BUTTON_DEFAULT_TOOLTIP_MESSAGE },
			setIcon: { path: DEFAULT_ICON_PATH }
		},
		end: {
			setBadgeBackgroundColor: { color: ACTIVE_COLOR },
			setBadgeText: { text: BUTTON_OK_BADGE_MESSAGE },
			setTitle: { title: BUTTON_DEFAULT_TOOLTIP_MESSAGE },
			setIcon: { path: DEFAULT_ICON_PATH }
		},
		error: {
			setBadgeBackgroundColor: { color: ERROR_COLOR },
			setBadgeText: { text: BUTTON_ERROR_BADGE_MESSAGE },
			setTitle: { title: BUTTON_DEFAULT_BADGE_MESSAGE },
			setIcon: { path: DEFAULT_ICON_PATH }
		},
		forbidden: {
			setBadgeBackgroundColor: { color: FORBIDDEN_COLOR },
			setBadgeText: { text: BUTTON_BLOCKED_BADGE_MESSAGE },
			setTitle: { title: BUTTON_BLOCKED_TOOLTIP_MESSAGE },
			setIcon: { path: DEFAULT_ICON_PATH }
		},
		autosave: {
			inject: {
				setBadgeBackgroundColor: { color: AUTOSAVE_INITIALIZING_COLOR },
				setBadgeText: { text: BUTTON_AUTOSAVE_ACTIVE_BADGE_MESSAGE },
				setTitle: { title: BUTTON_AUTOSAVE_ACTIVE_TOOLTIP_MESSAGE },
				setIcon: { path: DEFAULT_ICON_PATH }
			},
			default: {
				setBadgeBackgroundColor: { color: AUTOSAVE_DEFAULT_COLOR },
				setBadgeText: { text: BUTTON_AUTOSAVE_ACTIVE_BADGE_MESSAGE },
				setTitle: { title: BUTTON_AUTOSAVE_ACTIVE_TOOLTIP_MESSAGE },
				setIcon: { path: DEFAULT_ICON_PATH }
			}
		}
	};

	let business$2;

	browser.browserAction.onClicked.addListener(async tab => {
		const highlightedTabs = await queryTabs$1({ currentWindow: true, highlighted: true });
		if (highlightedTabs.length <= 1) {
			toggleSaveTab(tab);
		} else {
			business$2.saveTabs(highlightedTabs);
		}

		function toggleSaveTab(tab) {
			if (business$2.isSavingTab(tab)) {
				business$2.cancelTab(tab.id);
			} else {
				business$2.saveTabs([tab]);
			}
		}
	});

	function init$3(businessApi) {
		business$2 = businessApi;
	}

	function onMessage$9(message, sender) {
		if (message.method.endsWith(".processInit")) {
			const allTabsData = getTemporary(sender.tab.id);
			delete allTabsData[sender.tab.id].button;
			refreshTab$2(sender.tab);
		}
		if (message.method.endsWith(".processProgress")) {
			if (message.maxIndex) {
				onSaveProgress(sender.tab.id, message.index, message.maxIndex);
			}
		}
		if (message.method.endsWith(".processEnd")) {
			onEnd$1(sender.tab.id);
		}
		if (message.method.endsWith(".processError")) {
			if (message.error) {
				console.error("Initialization error", message.error); // eslint-disable-line no-console
			}
			onError$1(sender.tab.id);
		}
		if (message.method.endsWith(".processCancelled")) {
			onCancelled$1(sender.tab);
		}
		return Promise.resolve({});
	}

	function onStart$1(tabId, step, autoSave) {
		let state;
		if (autoSave) {
			state = getButtonState("inject", true);
		} else {
			state = step == INJECT_SCRIPTS_STEP$1 ? getButtonState("inject") : getButtonState("execute");
			state.setTitle = { title: BUTTON_INITIALIZING_TOOLTIP_MESSAGE + " (" + step + "/2)" };
			state.setIcon = { path: WAIT_ICON_PATH_PREFIX + "0.png" };
		}
		refresh(tabId, state);
	}

	function onError$1(tabId) {
		refresh(tabId, getButtonState("error"));
	}

	function onEdit$1(tabId) {
		refresh(tabId, getButtonState("edit"));
	}

	function onEnd$1(tabId, autoSave) {
		refresh(tabId, autoSave ? getButtonState("default", true) : getButtonState("end"));
	}

	function onForbiddenDomain$1(tab) {
		refresh(tab.id, getButtonState("forbidden"));
	}

	function onCancelled$1(tab) {
		refreshTab$2(tab);
	}

	function onSaveProgress(tabId, index, maxIndex) {
		onProgress(tabId, index, maxIndex, BUTTON_SAVE_PROGRESS_TOOLTIP_MESSAGE);
	}

	function onUploadProgress$1(tabId, index, maxIndex) {
		onProgress(tabId, index, maxIndex, BUTTON_UPLOAD_PROGRESS_TOOLTIP_MESSAGE);
	}

	function onProgress(tabId, index, maxIndex, tooltipMessage) {
		const progress = Math.max(Math.min(20, Math.floor((index / maxIndex) * 20)), 0);
		const barProgress = Math.min(Math.floor((index / maxIndex) * 8), 8);
		const path = WAIT_ICON_PATH_PREFIX + barProgress + ".png";
		const state = getButtonState("progress");
		state.setTitle = { title: tooltipMessage + (progress * 5) + "%" };
		state.setIcon = { path };
		refresh(tabId, state);
	}

	async function refreshTab$2(tab) {
		const autoSave = await autoSaveIsEnabled(tab);
		const state = getButtonState("default", autoSave);
		await refresh(tab.id, state);
	}

	async function refresh(tabId, state) {
		try {
			const allTabsData = getTemporary(tabId);
			if (state) {
				if (!allTabsData[tabId].button) {
					allTabsData[tabId].button = { lastState: null };
				}
				const lastState = allTabsData[tabId].button.lastState || {};
				const newState = {};
				Object.keys(state).forEach(property => {
					if (state[property] !== undefined && (JSON.stringify(lastState[property]) != JSON.stringify(state[property]))) {
						newState[property] = state[property];
					}
				});
				if (Object.keys(newState).length) {
					allTabsData[tabId].button.lastState = state;
					await refreshAsync(tabId, newState);
				}
			}
		} catch (error) {
			// ignored
		}
	}

	async function refreshAsync(tabId, state) {
		for (const browserActionMethod of Object.keys(state)) {
			await refreshProperty(tabId, browserActionMethod, state[browserActionMethod]);
		}
	}

	async function refreshProperty(tabId, browserActionMethod, browserActionParameter) {
		const actionMethodSupported = browserActionMethod != "setBadgeBackgroundColor" || BADGE_COLOR_SUPPORTED;
		if (browser.browserAction[browserActionMethod] && actionMethodSupported) {
			const parameter = JSON.parse(JSON.stringify(browserActionParameter));
			parameter.tabId = tabId;
			await browser.browserAction[browserActionMethod](parameter);
		}
	}

	function getButtonState(name, autoSave) {
		return JSON.parse(JSON.stringify(autoSave ? BUTTON_STATES.autosave[name] : BUTTON_STATES[name]));
	}

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

	const menus = browser.menus;
	const BROWSER_MENUS_API_SUPPORTED = menus && menus.onClicked && menus.create && menus.update && menus.removeAll;
	const MENU_ID_SAVE_PAGE = "save-page";
	const MENU_ID_EDIT_AND_SAVE_PAGE = "edit-and-save-page";
	const MENU_ID_SAVE_WITH_PROFILE = "save-with-profile";
	const MENU_ID_SAVE_SELECTED_LINKS = "save-selected-links";
	const MENU_ID_VIEW_PENDINGS = "view-pendings";
	const MENU_ID_SELECT_PROFILE = "select-profile";
	const MENU_ID_SAVE_WITH_PROFILE_PREFIX = "wasve-with-profile-";
	const MENU_ID_SELECT_PROFILE_PREFIX = "select-profile-";
	const MENU_ID_ASSOCIATE_WITH_PROFILE = "associate-with-profile";
	const MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX = "associate-with-profile-";
	const MENU_ID_SAVE_SELECTED = "save-selected";
	const MENU_ID_SAVE_FRAME = "save-frame";
	const MENU_ID_SAVE_TABS = "save-tabs";
	const MENU_ID_SAVE_SELECTED_TABS = "save-selected-tabs";
	const MENU_ID_SAVE_UNPINNED_TABS = "save-unpinned-tabs";
	const MENU_ID_SAVE_ALL_TABS = "save-all-tabs";
	const MENU_ID_BATCH_SAVE_URLS = "batch-save-urls";
	const MENU_ID_BUTTON_SAVE_SELECTED_TABS = "button-" + MENU_ID_SAVE_SELECTED_TABS;
	const MENU_ID_BUTTON_SAVE_UNPINNED_TABS = "button-" + MENU_ID_SAVE_UNPINNED_TABS;
	const MENU_ID_BUTTON_SAVE_ALL_TABS = "button-" + MENU_ID_SAVE_ALL_TABS;
	const MENU_ID_AUTO_SAVE = "auto-save";
	const MENU_ID_AUTO_SAVE_DISABLED = "auto-save-disabled";
	const MENU_ID_AUTO_SAVE_TAB = "auto-save-tab";
	const MENU_ID_AUTO_SAVE_UNPINNED = "auto-save-unpinned";
	const MENU_ID_AUTO_SAVE_ALL = "auto-save-all";
	const MENU_CREATE_DOMAIN_RULE_MESSAGE = browser.i18n.getMessage("menuCreateDomainRule");
	const MENU_UPDATE_RULE_MESSAGE = browser.i18n.getMessage("menuUpdateRule");
	const MENU_SAVE_PAGE_MESSAGE = browser.i18n.getMessage("menuSavePage");
	const MENU_SAVE_WITH_PROFILE = browser.i18n.getMessage("menuSaveWithProfile");
	const MENU_SAVE_SELECTED_LINKS = browser.i18n.getMessage("menuSaveSelectedLinks");
	const MENU_EDIT_PAGE_MESSAGE = browser.i18n.getMessage("menuEditPage");
	const MENU_EDIT_AND_SAVE_PAGE_MESSAGE = browser.i18n.getMessage("menuEditAndSavePage");
	const MENU_VIEW_PENDINGS_MESSAGE = browser.i18n.getMessage("menuViewPendingSaves");
	const MENU_SAVE_SELECTION_MESSAGE = browser.i18n.getMessage("menuSaveSelection");
	const MENU_SAVE_FRAME_MESSAGE = browser.i18n.getMessage("menuSaveFrame");
	const MENU_SAVE_TABS_MESSAGE = browser.i18n.getMessage("menuSaveTabs");
	const MENU_SAVE_SELECTED_TABS_MESSAGE = browser.i18n.getMessage("menuSaveSelectedTabs");
	const MENU_SAVE_UNPINNED_TABS_MESSAGE = browser.i18n.getMessage("menuSaveUnpinnedTabs");
	const MENU_SAVE_ALL_TABS_MESSAGE = browser.i18n.getMessage("menuSaveAllTabs");
	const MENU_BATCH_SAVE_URLS_MESSAGE = browser.i18n.getMessage("menuBatchSaveUrls");
	const MENU_SELECT_PROFILE_MESSAGE = browser.i18n.getMessage("menuSelectProfile");
	const PROFILE_DEFAULT_SETTINGS_MESSAGE = browser.i18n.getMessage("profileDefaultSettings");
	const MENU_AUTOSAVE_MESSAGE = browser.i18n.getMessage("menuAutoSave");
	const MENU_AUTOSAVE_DISABLED_MESSAGE = browser.i18n.getMessage("menuAutoSaveDisabled");
	const MENU_AUTOSAVE_TAB_MESSAGE = browser.i18n.getMessage("menuAutoSaveTab");
	const MENU_AUTOSAVE_UNPINNED_TABS_MESSAGE = browser.i18n.getMessage("menuAutoSaveUnpinnedTabs");
	const MENU_AUTOSAVE_ALL_TABS_MESSAGE = browser.i18n.getMessage("menuAutoSaveAllTabs");
	const MENU_TOP_VISIBLE_ENTRIES = [
		MENU_ID_EDIT_AND_SAVE_PAGE,
		MENU_ID_SAVE_SELECTED_LINKS,
		MENU_ID_SAVE_SELECTED,
		MENU_ID_SAVE_FRAME,
		MENU_ID_AUTO_SAVE,
		MENU_ID_ASSOCIATE_WITH_PROFILE
	];

	const menusCheckedState = new Map();
	const menusTitleState = new Map();
	let contextMenuVisibleState = true;
	let allMenuVisibleState = true;
	let profileIndexes = new Map();
	let menusCreated, pendingRefresh, business$1;
	Promise.resolve().then(initialize);

	function init$2(businessApi) {
		business$1 = businessApi;
	}

	function onMessage$8(message) {
		if (message.method.endsWith("refreshMenu")) {
			createMenus();
			return Promise.resolve({});
		}
	}

	async function createMenus(tab) {
		const [profiles, allTabsData] = await Promise.all([getProfiles(), getPersistent()]);
		const options = await getOptions(tab && tab.url);
		if (BROWSER_MENUS_API_SUPPORTED && options) {
			const pageContextsEnabled = ["page", "frame", "image", "link", "video", "audio", "selection"];
			const defaultContextsDisabled = [];
			if (options.browserActionMenuEnabled) {
				defaultContextsDisabled.push("browser_action");
			}
			if (options.tabMenuEnabled) {
				try {
					await menus.create({
						id: "temporary-id",
						contexts: ["tab"],
						title: "title"
					});
					defaultContextsDisabled.push("tab");
				} catch (error) {
					options.tabMenuEnabled = false;
				}
			}
			await menus.removeAll();
			const defaultContextsEnabled = defaultContextsDisabled.concat(...pageContextsEnabled);
			const defaultContexts = options.contextMenuEnabled ? defaultContextsEnabled : defaultContextsDisabled;
			menus.create({
				id: MENU_ID_SAVE_PAGE,
				contexts: defaultContexts,
				title: MENU_SAVE_PAGE_MESSAGE
			});
			menus.create({
				id: MENU_ID_EDIT_AND_SAVE_PAGE,
				contexts: defaultContexts,
				title: MENU_EDIT_AND_SAVE_PAGE_MESSAGE
			});
			menus.create({
				id: MENU_ID_SAVE_SELECTED_LINKS,
				contexts: options.contextMenuEnabled ? defaultContextsDisabled.concat(["selection"]) : defaultContextsDisabled,
				title: MENU_SAVE_SELECTED_LINKS
			});
			if (Object.keys(profiles).length > 1) {
				menus.create({
					id: MENU_ID_SAVE_WITH_PROFILE,
					contexts: defaultContexts,
					title: MENU_SAVE_WITH_PROFILE
				});
			}
			if (options.contextMenuEnabled) {
				menus.create({
					id: "separator-1",
					contexts: pageContextsEnabled,
					type: "separator"
				});
			}
			menus.create({
				id: MENU_ID_SAVE_SELECTED,
				contexts: defaultContexts,
				title: MENU_SAVE_SELECTION_MESSAGE
			});
			if (options.contextMenuEnabled) {
				menus.create({
					id: MENU_ID_SAVE_FRAME,
					contexts: ["frame"],
					title: MENU_SAVE_FRAME_MESSAGE
				});
			}
			menus.create({
				id: MENU_ID_SAVE_TABS,
				contexts: defaultContextsDisabled,
				title: MENU_SAVE_TABS_MESSAGE
			});
			menus.create({
				id: MENU_ID_BUTTON_SAVE_SELECTED_TABS,
				contexts: defaultContextsDisabled,
				title: MENU_SAVE_SELECTED_TABS_MESSAGE,
				parentId: MENU_ID_SAVE_TABS
			});
			menus.create({
				id: MENU_ID_BUTTON_SAVE_UNPINNED_TABS,
				contexts: defaultContextsDisabled,
				title: MENU_SAVE_UNPINNED_TABS_MESSAGE,
				parentId: MENU_ID_SAVE_TABS
			});
			menus.create({
				id: MENU_ID_BUTTON_SAVE_ALL_TABS,
				contexts: defaultContextsDisabled,
				title: MENU_SAVE_ALL_TABS_MESSAGE,
				parentId: MENU_ID_SAVE_TABS
			});
			if (options.contextMenuEnabled) {
				if (SELECTABLE_TABS_SUPPORTED) {
					menus.create({
						id: MENU_ID_SAVE_SELECTED_TABS,
						contexts: pageContextsEnabled,
						title: MENU_SAVE_SELECTED_TABS_MESSAGE
					});
				}
				menus.create({
					id: MENU_ID_SAVE_UNPINNED_TABS,
					contexts: pageContextsEnabled,
					title: MENU_SAVE_UNPINNED_TABS_MESSAGE
				});
				menus.create({
					id: MENU_ID_SAVE_ALL_TABS,
					contexts: pageContextsEnabled,
					title: MENU_SAVE_ALL_TABS_MESSAGE
				});
				menus.create({
					id: "separator-2",
					contexts: pageContextsEnabled,
					type: "separator"
				});
			}
			if (Object.keys(profiles).length > 1) {
				menus.create({
					id: MENU_ID_SELECT_PROFILE,
					title: MENU_SELECT_PROFILE_MESSAGE,
					contexts: defaultContexts,
				});
				menus.create({
					id: MENU_ID_SAVE_WITH_PROFILE_PREFIX + "default",
					contexts: defaultContexts,
					title: PROFILE_DEFAULT_SETTINGS_MESSAGE,
					parentId: MENU_ID_SAVE_WITH_PROFILE
				});
				const defaultProfileId = MENU_ID_SELECT_PROFILE_PREFIX + "default";
				const defaultProfileChecked = !allTabsData.profileName || allTabsData.profileName == DEFAULT_PROFILE_NAME;
				menus.create({
					id: defaultProfileId,
					type: "radio",
					contexts: defaultContexts,
					title: PROFILE_DEFAULT_SETTINGS_MESSAGE,
					checked: defaultProfileChecked,
					parentId: MENU_ID_SELECT_PROFILE
				});
				menusCheckedState.set(defaultProfileId, defaultProfileChecked);
				menus.create({
					id: MENU_ID_ASSOCIATE_WITH_PROFILE,
					title: MENU_CREATE_DOMAIN_RULE_MESSAGE,
					contexts: defaultContexts,
				});
				menusTitleState.set(MENU_ID_ASSOCIATE_WITH_PROFILE, MENU_CREATE_DOMAIN_RULE_MESSAGE);
				let rule;
				if (tab && tab.url) {
					rule = await getRule(tab.url, true);
				}
				const currentProfileId = MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX + "current";
				const currentProfileChecked = !rule || (rule.profile == CURRENT_PROFILE_NAME);
				menus.create({
					id: currentProfileId,
					type: "radio",
					contexts: defaultContexts,
					title: CURRENT_PROFILE_NAME,
					checked: currentProfileChecked,
					parentId: MENU_ID_ASSOCIATE_WITH_PROFILE
				});
				menusCheckedState.set(currentProfileId, currentProfileChecked);

				const associatedDefaultProfileId = MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX + "default";
				const associatedDefaultProfileChecked = Boolean(rule) && (rule.profile == DEFAULT_PROFILE_NAME);
				menus.create({
					id: associatedDefaultProfileId,
					type: "radio",
					contexts: defaultContexts,
					title: PROFILE_DEFAULT_SETTINGS_MESSAGE,
					checked: associatedDefaultProfileChecked,
					parentId: MENU_ID_ASSOCIATE_WITH_PROFILE
				});
				menusCheckedState.set(associatedDefaultProfileId, associatedDefaultProfileChecked);
				profileIndexes = new Map();
				Object.keys(profiles).forEach((profileName, profileIndex) => {
					if (profileName != DEFAULT_PROFILE_NAME) {
						let profileId = MENU_ID_SAVE_WITH_PROFILE_PREFIX + profileIndex;
						menus.create({
							id: profileId,
							contexts: defaultContexts,
							title: profileName,
							parentId: MENU_ID_SAVE_WITH_PROFILE
						});
						profileId = MENU_ID_SELECT_PROFILE_PREFIX + profileIndex;
						let profileChecked = allTabsData.profileName == profileName;
						menus.create({
							id: profileId,
							type: "radio",
							contexts: defaultContexts,
							title: profileName,
							checked: profileChecked,
							parentId: MENU_ID_SELECT_PROFILE
						});
						menusCheckedState.set(profileId, profileChecked);
						profileId = MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX + profileIndex;
						profileChecked = Boolean(rule) && rule.profile == profileName;
						menus.create({
							id: profileId,
							type: "radio",
							contexts: defaultContexts,
							title: profileName,
							checked: profileChecked,
							parentId: MENU_ID_ASSOCIATE_WITH_PROFILE
						});
						menusCheckedState.set(profileId, profileChecked);
						profileIndexes.set(profileName, profileIndex);
					}
				});
				if (options.contextMenuEnabled) {
					menus.create({
						id: "separator-3",
						contexts: pageContextsEnabled,
						type: "separator"
					});
				}
			}
			if (AUTO_SAVE_SUPPORTED) {
				menus.create({
					id: MENU_ID_AUTO_SAVE,
					contexts: defaultContexts,
					title: MENU_AUTOSAVE_MESSAGE
				});
				menus.create({
					id: MENU_ID_AUTO_SAVE_DISABLED,
					type: "radio",
					title: MENU_AUTOSAVE_DISABLED_MESSAGE,
					contexts: defaultContexts,
					checked: true,
					parentId: MENU_ID_AUTO_SAVE
				});
				menusCheckedState.set(MENU_ID_AUTO_SAVE_DISABLED, true);
				menus.create({
					id: MENU_ID_AUTO_SAVE_TAB,
					type: "radio",
					title: MENU_AUTOSAVE_TAB_MESSAGE,
					contexts: defaultContexts,
					checked: false,
					parentId: MENU_ID_AUTO_SAVE
				});
				menusCheckedState.set(MENU_ID_AUTO_SAVE_TAB, false);
				menus.create({
					id: MENU_ID_AUTO_SAVE_UNPINNED,
					type: "radio",
					title: MENU_AUTOSAVE_UNPINNED_TABS_MESSAGE,
					contexts: defaultContexts,
					checked: false,
					parentId: MENU_ID_AUTO_SAVE
				});
				menusCheckedState.set(MENU_ID_AUTO_SAVE_UNPINNED, false);
				menus.create({
					id: MENU_ID_AUTO_SAVE_ALL,
					type: "radio",
					title: MENU_AUTOSAVE_ALL_TABS_MESSAGE,
					contexts: defaultContexts,
					checked: false,
					parentId: MENU_ID_AUTO_SAVE
				});
				menusCheckedState.set(MENU_ID_AUTO_SAVE_ALL, false);
				menus.create({
					id: "separator-4",
					contexts: defaultContexts,
					type: "separator"
				});
			}
			menus.create({
				id: MENU_ID_BATCH_SAVE_URLS,
				contexts: defaultContexts,
				title: MENU_BATCH_SAVE_URLS_MESSAGE
			});
			menus.create({
				id: MENU_ID_VIEW_PENDINGS,
				contexts: defaultContexts,
				title: MENU_VIEW_PENDINGS_MESSAGE
			});
		}
		menusCreated = true;
		if (pendingRefresh) {
			pendingRefresh = false;
			(await browser.tabs.query({})).forEach(async tab => await refreshTab$1(tab));
		}
	}

	async function initialize() {
		if (BROWSER_MENUS_API_SUPPORTED) {
			createMenus();
			menus.onClicked.addListener(async (event, tab) => {
				if (event.menuItemId == MENU_ID_SAVE_PAGE) {
					if (event.linkUrl) {
						business$1.saveUrls([event.linkUrl]);
					} else {
						business$1.saveTabs([tab]);
					}
				}
				if (event.menuItemId == MENU_ID_EDIT_AND_SAVE_PAGE) {
					const allTabsData = await getPersistent(tab.id);
					if (allTabsData[tab.id].savedPageDetected) {
						business$1.openEditor(tab);
					} else {
						if (event.linkUrl) {
							business$1.saveUrls([event.linkUrl], { openEditor: true });
						} else {
							business$1.saveTabs([tab], { openEditor: true });
						}
					}
				}
				if (event.menuItemId == MENU_ID_SAVE_SELECTED_LINKS) {
					business$1.saveSelectedLinks(tab);
				}
				if (event.menuItemId == MENU_ID_VIEW_PENDINGS) {
					await browser.tabs.create({ active: true, url: "/src/ui/pages/pendings.html" });
				}
				if (event.menuItemId == MENU_ID_SAVE_SELECTED) {
					business$1.saveTabs([tab], { selected: true });
				}
				if (event.menuItemId == MENU_ID_SAVE_FRAME) {
					business$1.saveTabs([tab], { frameId: event.frameId });
				}
				if (event.menuItemId == MENU_ID_SAVE_SELECTED_TABS || event.menuItemId == MENU_ID_BUTTON_SAVE_SELECTED_TABS) {
					const tabs = await queryTabs$1({ currentWindow: true, highlighted: true });
					business$1.saveTabs(tabs);
				}
				if (event.menuItemId == MENU_ID_SAVE_UNPINNED_TABS || event.menuItemId == MENU_ID_BUTTON_SAVE_UNPINNED_TABS) {
					const tabs = await queryTabs$1({ currentWindow: true, pinned: false });
					business$1.saveTabs(tabs);
				}
				if (event.menuItemId == MENU_ID_SAVE_ALL_TABS || event.menuItemId == MENU_ID_BUTTON_SAVE_ALL_TABS) {
					const tabs = await queryTabs$1({ currentWindow: true });
					business$1.saveTabs(tabs);
				}
				if (event.menuItemId == MENU_ID_BATCH_SAVE_URLS) {
					business$1.batchSaveUrls();
				}
				if (event.menuItemId == MENU_ID_AUTO_SAVE_TAB) {
					const allTabsData = await getPersistent(tab.id);
					allTabsData[tab.id].autoSave = true;
					await setPersistent(allTabsData);
					refreshExternalComponents(tab);
				}
				if (event.menuItemId == MENU_ID_AUTO_SAVE_DISABLED) {
					const allTabsData = await getPersistent();
					Object.keys(allTabsData).forEach(tabId => {
						if (typeof allTabsData[tabId] == "object" && allTabsData[tabId].autoSave) {
							allTabsData[tabId].autoSave = false;
						}
					});
					allTabsData.autoSaveUnpinned = allTabsData.autoSaveAll = false;
					await setPersistent(allTabsData);
					refreshExternalComponents(tab);
				}
				if (event.menuItemId == MENU_ID_AUTO_SAVE_ALL) {
					const allTabsData = await getPersistent();
					allTabsData.autoSaveAll = event.checked;
					await setPersistent(allTabsData);
					refreshExternalComponents(tab);
				}
				if (event.menuItemId == MENU_ID_AUTO_SAVE_UNPINNED) {
					const allTabsData = await getPersistent();
					allTabsData.autoSaveUnpinned = event.checked;
					await setPersistent(allTabsData);
					refreshExternalComponents(tab);
				}
				if (event.menuItemId.startsWith(MENU_ID_SAVE_WITH_PROFILE_PREFIX)) {
					const profiles = await getProfiles();
					const profileId = event.menuItemId.split(MENU_ID_SAVE_WITH_PROFILE_PREFIX)[1];
					let profileName;
					if (profileId == "default") {
						profileName = DEFAULT_PROFILE_NAME;
					} else {
						const profileIndex = Number(profileId);
						profileName = Object.keys(profiles)[profileIndex];
					}
					profiles[profileName].profileName = profileName;
					business$1.saveTabs([tab], profiles[profileName]);
				}
				if (event.menuItemId.startsWith(MENU_ID_SELECT_PROFILE_PREFIX)) {
					const [profiles, allTabsData] = await Promise.all([getProfiles(), getPersistent()]);
					const profileId = event.menuItemId.split(MENU_ID_SELECT_PROFILE_PREFIX)[1];
					if (profileId == "default") {
						allTabsData.profileName = DEFAULT_PROFILE_NAME;
					} else {
						const profileIndex = Number(profileId);
						allTabsData.profileName = Object.keys(profiles)[profileIndex];
					}
					await setPersistent(allTabsData);
					refreshExternalComponents(tab);
				}
				if (event.menuItemId.startsWith(MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX)) {
					const [profiles, rule] = await Promise.all([getProfiles(), getRule(tab.url, true)]);
					const profileId = event.menuItemId.split(MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX)[1];
					let profileName;
					if (profileId == "default") {
						profileName = DEFAULT_PROFILE_NAME;
					} else if (profileId == "current") {
						profileName = CURRENT_PROFILE_NAME;
					} else {
						const profileIndex = Number(profileId);
						profileName = Object.keys(profiles)[profileIndex];
					}
					if (rule) {
						await updateRule(rule.url, rule.url, profileName, profileName);
					} else {
						await updateTitleValue(MENU_ID_ASSOCIATE_WITH_PROFILE, MENU_UPDATE_RULE_MESSAGE);
						await addRule(new URL(tab.url).hostname, profileName, profileName);
					}
				}
			});
			if (menusCreated) {
				pendingRefresh = true;
			} else {
				(await browser.tabs.query({})).forEach(async tab => await refreshTab$1(tab));
			}
		}
	}

	async function refreshExternalComponents(tab) {
		const allTabsData = await getPersistent(tab.id);
		await refreshAutoSaveTabs();
		await refreshTab$2(tab);
		try {
			await browser.runtime.sendMessage({ method: "options.refresh", profileName: allTabsData.profileName });
		} catch (error) {
			// ignored
		}
	}

	async function refreshTab$1(tab) {
		if (BROWSER_MENUS_API_SUPPORTED && menusCreated) {
			const promises = [];
			const allTabsData = await getPersistent(tab.id);
			if (allTabsData[tab.id].editorDetected) {
				updateAllVisibleValues(false);
			} else {
				updateAllVisibleValues(true);
				if (AUTO_SAVE_SUPPORTED) {
					promises.push(updateCheckedValue(MENU_ID_AUTO_SAVE_DISABLED, !allTabsData[tab.id].autoSave));
					promises.push(updateCheckedValue(MENU_ID_AUTO_SAVE_TAB, allTabsData[tab.id].autoSave));
					promises.push(updateCheckedValue(MENU_ID_AUTO_SAVE_UNPINNED, Boolean(allTabsData.autoSaveUnpinned)));
					promises.push(updateCheckedValue(MENU_ID_AUTO_SAVE_ALL, Boolean(allTabsData.autoSaveAll)));
				}
				if (tab && tab.url) {
					const options = await getOptions(tab.url);
					promises.push(updateVisibleValue(tab, options.contextMenuEnabled));
					promises.push(updateTitleValue(MENU_ID_EDIT_AND_SAVE_PAGE, allTabsData[tab.id].savedPageDetected ? MENU_EDIT_PAGE_MESSAGE : MENU_EDIT_AND_SAVE_PAGE_MESSAGE));
					if (SELECTABLE_TABS_SUPPORTED) {
						promises.push(menus.update(MENU_ID_SAVE_SELECTED, { visible: !options.saveRawPage }));
					}
					promises.push(menus.update(MENU_ID_EDIT_AND_SAVE_PAGE, { visible: !options.openEditor || allTabsData[tab.id].savedPageDetected }));
					let selectedEntryId = MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX + "default";
					let title = MENU_CREATE_DOMAIN_RULE_MESSAGE;
					const [profiles, rule] = await Promise.all([getProfiles(), getRule(tab.url)]);
					if (rule) {
						const profileIndex = profileIndexes.get(rule.profile);
						if (profileIndex) {
							selectedEntryId = MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX + profileIndex;
							title = MENU_UPDATE_RULE_MESSAGE;
						}
					}
					if (Object.keys(profiles).length > 1) {
						Object.keys(profiles).forEach((profileName, profileIndex) => {
							if (profileName == DEFAULT_PROFILE_NAME) {
								promises.push(updateCheckedValue(MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX + "default", selectedEntryId == MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX + "default"));
							} else {
								promises.push(updateCheckedValue(MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX + profileIndex, selectedEntryId == MENU_ID_ASSOCIATE_WITH_PROFILE_PREFIX + profileIndex));
							}
						});
						promises.push(updateTitleValue(MENU_ID_ASSOCIATE_WITH_PROFILE, title));
					}
				}
			}
			await Promise.all(promises);
		}
	}

	async function updateAllVisibleValues(visible) {
		const lastVisibleState = allMenuVisibleState;
		allMenuVisibleState = visible;
		if (lastVisibleState === undefined || lastVisibleState != visible) {
			const promises = [];
			try {
				MENU_TOP_VISIBLE_ENTRIES.forEach(id => promises.push(menus.update(id, { visible })));
				await Promise.all(promises);
			} catch (error) {
				// ignored
			}
		}
	}

	async function updateVisibleValue(tab, visible) {
		const lastVisibleState = contextMenuVisibleState;
		contextMenuVisibleState = visible;
		if (lastVisibleState === undefined || lastVisibleState != visible) {
			await createMenus(tab);
		}
	}

	function updateTitleValue(id, title) {
		const lastTitleValue = menusTitleState.get(id);
		menusTitleState.set(id, title);
		if (lastTitleValue === undefined) {
			return menus.update(id, { title });
		} else if (lastTitleValue != title) {
			return menus.update(id, { title });
		}
	}

	async function updateCheckedValue(id, checked) {
		checked = Boolean(checked);
		menusCheckedState.set(id, checked);
		await menus.update(id, { checked });
	}

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

	const commands = browser.commands;
	const BROWSER_COMMANDS_API_SUPPORTED = commands && commands.onCommand && commands.onCommand.addListener;

	let business;

	function init$1(businessApi) {
		business = businessApi;
	}

	if (BROWSER_COMMANDS_API_SUPPORTED) {
		commands.onCommand.addListener(async command => {
			if (command == "save-selected-tabs") {
				const highlightedTabs = await queryTabs$1({ currentWindow: true, highlighted: true });
				business.saveTabs(highlightedTabs, { optionallySelected: true });
			}
			if (command == "save-all-tabs") {
				const tabs = await queryTabs$1({ currentWindow: true });
				business.saveTabs(tabs);
			}
		});
	}

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

	function init(businessApi) {
		init$2(businessApi);
		init$3(businessApi);
		init$1(businessApi);
	}

	function onMessage$7(message, sender) {
		if (message.method.endsWith(".refreshMenu")) {
			return onMessage$8(message);
		} else {
			return onMessage$9(message, sender);
		}
	}

	async function refreshTab(tab) {
		return Promise.all([createMenus(tab), refreshTab$2(tab)]);
	}

	function onForbiddenDomain(tab) {
		onForbiddenDomain$1(tab);
	}

	function onStart(tabId, step, autoSave) {
		onStart$1(tabId, step, autoSave);
	}

	async function onError(tabId, message, link) {
		onError$1(tabId);
		try {
			if (message) {
				await browser.tabs.sendMessage(tabId, { method: "content.error", error: message.toString(), link });
			}
		} catch (error) {
			// ignored
		}
	}

	function onEdit(tabId) {
		onEdit$1(tabId);
	}

	function onEnd(tabId, autoSave) {
		onEnd$1(tabId, autoSave);
	}

	function onCancelled(tabId) {
		onCancelled$1(tabId);
	}

	function onUploadProgress(tabId, index, maxIndex) {
		onUploadProgress$1(tabId, index, maxIndex);
	}

	function onTabCreated$1(tab) {
		refreshTab$1(tab);
	}

	function onTabActivated$1(tab) {
		refreshTab$1(tab);
	}

	function onInit$3(tab) {
		refreshTab$1(tab);
	}

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

	/* global browser, fetch, TextDecoder */

	let contentScript, frameScript;

	const contentScriptFiles = [
		"lib/web-stream.js",
		"lib/chrome-browser-polyfill.js",
		"lib/single-file.js"
	];

	const frameScriptFiles = [
		"lib/chrome-browser-polyfill.js",
		"lib/single-file-frames.js"
	];

	const basePath = "../../../";

	async function inject(tabId, options) {
		await initScripts(options);
		let scriptsInjected;
		if (!options.removeFrames) {
			try {
				await browser.tabs.executeScript(tabId, { code: frameScript, allFrames: true, matchAboutBlank: true, runAt: "document_start" });
			} catch (error) {
				// ignored
			}
		}
		try {
			await browser.tabs.executeScript(tabId, { code: contentScript, allFrames: false, runAt: "document_idle" });
			scriptsInjected = true;
		} catch (error) {
			// ignored
		}
		if (scriptsInjected) {
			if (options.frameId) {
				await browser.tabs.executeScript(tabId, { code: "document.documentElement.dataset.requestedFrameId = true", frameId: options.frameId, matchAboutBlank: true, runAt: "document_start" });
			}
		}
		return scriptsInjected;
	}

	async function initScripts(options) {
		const extensionScriptFiles = options.extensionScriptFiles || [];
		if (!contentScript && !frameScript) {
			[contentScript, frameScript] = await Promise.all([
				getScript(contentScriptFiles.concat(extensionScriptFiles)),
				getScript(frameScriptFiles)
			]);
		}
	}

	async function getScript(scriptFiles) {
		const scriptsPromises = scriptFiles.map(async scriptFile => {
			if (typeof scriptFile == "function") {
				return "(" + scriptFile.toString() + ")();";
			} else {
				const scriptResource = await fetch(browser.runtime.getURL(basePath + scriptFile));
				return new TextDecoder().decode(await scriptResource.arrayBuffer());
			}
		});
		let content = "";
		for (const scriptPromise of scriptsPromises) {
			content += await scriptPromise;
		}
		return content;
	}

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

	/* global browser, window, document, CustomEvent, setTimeout, clearTimeout */

	const FETCH_REQUEST_EVENT = "single-file-request-fetch";
	const FETCH_ACK_EVENT = "single-file-ack-fetch";
	const FETCH_RESPONSE_EVENT = "single-file-response-fetch";
	const ERR_HOST_FETCH = "Host fetch error (SingleFile)";
	const HOST_FETCH_MAX_DELAY = 2500;
	const USE_HOST_FETCH = Boolean(window.wrappedJSObject);

	const fetch$2 = (url, options) => window.fetch(url, options);

	let requestId = 0, pendingResponses = new Map();

	browser.runtime.onMessage.addListener(message => {
		if (message.method == "singlefile.fetchFrame" && window.frameId && window.frameId == message.frameId) {
			return onFetchFrame(message);
		}
		if (message.method == "singlefile.fetchResponse") {
			return onFetchResponse(message);
		}
	});

	async function onFetchFrame(message) {
		try {
			const response = await fetch$2(message.url, { cache: "force-cache", headers: message.headers });
			return {
				status: response.status,
				headers: [...response.headers],
				array: Array.from(new Uint8Array(await response.arrayBuffer()))
			};
		} catch (error) {
			return {
				error: error && error.toString()
			};
		}
	}

	async function onFetchResponse(message) {
		const pendingResponse = pendingResponses.get(message.requestId);
		if (pendingResponse) {
			if (message.error) {
				pendingResponse.reject(new Error(message.error));
				pendingResponses.delete(message.requestId);
			} else {
				if (message.truncated) {
					if (pendingResponse.array) {
						pendingResponse.array = pendingResponse.array.concat(message.array);
					} else {
						pendingResponse.array = message.array;
						pendingResponses.set(message.requestId, pendingResponse);
					}
					if (message.finished) {
						message.array = pendingResponse.array;
					}
				}
				if (!message.truncated || message.finished) {
					pendingResponse.resolve({
						status: message.status,
						headers: { get: headerName => message.headers && message.headers[headerName] },
						arrayBuffer: async () => new Uint8Array(message.array).buffer
					});
					pendingResponses.delete(message.requestId);
				}
			}
		}
		return {};
	}

	async function hostFetch(url, options) {
		const result = new Promise((resolve, reject) => {
			document.dispatchEvent(new CustomEvent(FETCH_REQUEST_EVENT, { detail: JSON.stringify({ url, options }) }));
			document.addEventListener(FETCH_ACK_EVENT, onAckFetch, false);
			document.addEventListener(FETCH_RESPONSE_EVENT, onResponseFetch, false);
			const timeout = setTimeout(() => {
				removeListeners();
				reject(new Error(ERR_HOST_FETCH));
			}, HOST_FETCH_MAX_DELAY);

			function onResponseFetch(event) {
				if (event.detail) {
					if (event.detail.url == url) {
						removeListeners();
						if (event.detail.response) {
							resolve({
								status: event.detail.status,
								headers: new Map(event.detail.headers),
								arrayBuffer: async () => event.detail.response
							});
						} else {
							reject(event.detail.error);
						}
					}
				} else {
					reject();
				}
			}

			function onAckFetch() {
				clearTimeout(timeout);
			}

			function removeListeners() {
				document.removeEventListener(FETCH_RESPONSE_EVENT, onResponseFetch, false);
				document.removeEventListener(FETCH_ACK_EVENT, onAckFetch, false);
			}
		});
		try {
			return await result;
		} catch (error) {
			if (error && error.message == ERR_HOST_FETCH) {
				return fetch$2(url, options);
			} else {
				throw error;
			}
		}
	}

	async function fetchResource(url, options = {}) {
		try {
			const fetchOptions = { cache: "force-cache", headers: options.headers };
			return await (options.referrer && USE_HOST_FETCH ? hostFetch(url, fetchOptions) : fetch$2(url, fetchOptions));
		}
		catch (error) {
			requestId++;
			const promise = new Promise((resolve, reject) => pendingResponses.set(requestId, { resolve, reject }));
			await sendMessage({ method: "singlefile.fetch", url, requestId, referrer: options.referrer, headers: options.headers });
			return promise;
		}
	}

	async function frameFetch(url, options) {
		const response = await sendMessage({ method: "singlefile.fetchFrame", url, frameId: options.frameId, referrer: options.referrer, headers: options.headers });
		return {
			status: response.status,
			headers: new Map(response.headers),
			arrayBuffer: async () => new Uint8Array(response.array).buffer
		};
	}

	async function sendMessage(message) {
		const response = await browser.runtime.sendMessage(message);
		if (!response || response.error) {
			throw new Error(response && response.error && response.error.toString());
		} else {
			return response;
		}
	}

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

	function injectScript(tabId, options) {
		return inject(tabId, options);
	}

	function getPageData(options, doc, win, initOptions = { fetch: fetchResource, frameFetch }) {
		return globalThis.singlefile.getPageData(options, initOptions, doc, win);
	}

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

	const ERROR_CONNECTION_ERROR_CHROMIUM = "Could not establish connection. Receiving end does not exist.";
	const ERROR_CONNECTION_LOST_CHROMIUM = "The message port closed before a response was received.";
	const ERROR_CONNECTION_LOST_GECKO = "Message manager disconnected";
	const ERROR_EDITOR_PAGE_CHROMIUM = "Cannot access contents of url ";
	const ERROR_CHANNEL_CLOSED_CHROMIUM = "A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received";
	const INJECT_SCRIPTS_STEP = 1;
	const EXECUTE_SCRIPTS_STEP = 2;
	const TASK_PENDING_STATE = "pending";
	const TASK_PROCESSING_STATE = "processing";

	const extensionScriptFiles = [
		"lib/single-file-extension.js"
	];

	const tasks = [];
	let currentTaskId = 0, maxParallelWorkers, processInForeground;
	init({ isSavingTab, saveTabs, saveUrls, cancelTab, openEditor, saveSelectedLinks, batchSaveUrls });

	async function saveSelectedLinks(tab) {
		const tabOptions = { extensionScriptFiles, tabId: tab.id, tabIndex: tab.index };
		const scriptsInjected = await injectScript(tab.id, tabOptions);
		if (scriptsInjected) {
			const response = await browser.tabs.sendMessage(tab.id, { method: "content.getSelectedLinks" });
			if (response.urls && response.urls.length) {
				const tab = await batchSaveUrls();
				const onTabUpdated = (tabId, changeInfo) => {
					if (changeInfo.status == "complete" && tabId == tab.id) {
						browser.tabs.onUpdated.removeListener(onTabUpdated);
						browser.tabs.sendMessage(tab.id, { method: "newUrls.addURLs", urls: response.urls });
					}
				};
				browser.tabs.onUpdated.addListener(onTabUpdated);
			}
		} else {
			onForbiddenDomain(tab);
		}
	}

	async function batchSaveUrls() {
		return browser.tabs.create({ active: true, url: "/src/ui/pages/batch-save-urls.html" });
	}

	async function saveUrls(urls, options = {}) {
		await initMaxParallelWorkers();
		await Promise.all(urls.map(async url => {
			const tabOptions = await getOptions(url);
			Object.keys(options).forEach(key => tabOptions[key] = options[key]);
			tabOptions.autoClose = true;
			tabOptions.extensionScriptFiles = extensionScriptFiles;
			if (tabOptions.passReferrerOnError) {
				enableReferrerOnError();
			}
			addTask({
				tab: { url },
				status: TASK_PENDING_STATE,
				options: tabOptions,
				method: "content.save"
			});
		}));
		runTasks();
	}

	async function saveTabs(tabs, options = {}) {
		await initMaxParallelWorkers();
		await Promise.all(tabs.map(async tab => {
			const tabId = tab.id;
			const tabOptions = await getOptions(tab.url);
			Object.keys(options).forEach(key => tabOptions[key] = options[key]);
			tabOptions.tabId = tabId;
			tabOptions.tabIndex = tab.index;
			tabOptions.extensionScriptFiles = extensionScriptFiles;
			if (tabOptions.passReferrerOnError) {
				enableReferrerOnError();
			}
			const tabData = {
				id: tab.id,
				index: tab.index,
				url: tab.url,
				title: tab.title
			};
			if (options.autoSave) {
				if (autoSaveIsEnabled(tab)) {
					const taskInfo = addTask({
						status: TASK_PROCESSING_STATE,
						tab: tabData,
						options: tabOptions,
						method: "content.autosave"
					});
					runTask(taskInfo);
				}
			} else {
				onStart(tabId, INJECT_SCRIPTS_STEP);
				const scriptsInjected = await injectScript(tabId, tabOptions);
				if (scriptsInjected || isEditor(tab)) {
					onStart(tabId, EXECUTE_SCRIPTS_STEP);
					addTask({
						status: TASK_PENDING_STATE,
						tab: tabData,
						options: tabOptions,
						method: "content.save"
					});
				} else {
					onForbiddenDomain(tab);
				}
			}
		}));
		runTasks();
	}

	function addTask(info) {
		const taskInfo = {
			id: currentTaskId,
			status: info.status,
			tab: info.tab,
			options: info.options,
			method: info.method,
			done: function (runNextTasks = true) {
				const index = tasks.findIndex(taskInfo => taskInfo.id == this.id);
				if (index > -1) {
					tasks.splice(index, 1);
					if (runNextTasks) {
						runTasks();
					}
				}
			}
		};
		tasks.push(taskInfo);
		currentTaskId++;
		return taskInfo;
	}

	function openEditor(tab) {
		browser.tabs.sendMessage(tab.id, { method: "content.openEditor" });
	}

	async function initMaxParallelWorkers() {
		if (!maxParallelWorkers) {
			const configData = await getConfig();
			processInForeground = configData.processInForeground;
			maxParallelWorkers = processInForeground ? 1 : configData.maxParallelWorkers;
		}
	}

	function runTasks() {
		const processingCount = tasks.filter(taskInfo => taskInfo.status == TASK_PROCESSING_STATE).length;
		for (let index = 0; index < Math.min(tasks.length - processingCount, (maxParallelWorkers - processingCount)); index++) {
			const taskInfo = tasks.find(taskInfo => taskInfo.status == TASK_PENDING_STATE);
			if (taskInfo) {
				runTask(taskInfo);
			}
		}
	}

	async function runTask(taskInfo) {
		const taskId = taskInfo.id;
		taskInfo.status = TASK_PROCESSING_STATE;
		if (!taskInfo.tab.id) {
			let scriptsInjected;
			try {
				const tab = await createTabAndWaitUntilComplete({ url: taskInfo.tab.url, active: false });
				taskInfo.tab.id = taskInfo.options.tabId = tab.id;
				taskInfo.tab.index = taskInfo.options.tabIndex = tab.index;
				onStart(taskInfo.tab.id, INJECT_SCRIPTS_STEP);
				scriptsInjected = await injectScript(taskInfo.tab.id, taskInfo.options);
			} catch (tabId) {
				taskInfo.tab.id = tabId;
			}
			if (scriptsInjected) {
				onStart(taskInfo.tab.id, EXECUTE_SCRIPTS_STEP);
			} else {
				taskInfo.done();
				return;
			}
		}
		taskInfo.options.taskId = taskId;
		try {
			if (processInForeground) {
				await browser.tabs.update(taskInfo.tab.id, { active: true });
			}
			await browser.tabs.sendMessage(taskInfo.tab.id, { method: taskInfo.method, options: taskInfo.options });
		} catch (error) {
			if (error && (!error.message || !isIgnoredError(error))) {
				console.log(error.message ? error.message : error); // eslint-disable-line no-console
				onError(taskInfo.tab.id, error.message, error.link);
				taskInfo.done();
			}
		}
	}

	function isIgnoredError(error) {
		return error.message == ERROR_CONNECTION_LOST_CHROMIUM ||
			error.message == ERROR_CONNECTION_ERROR_CHROMIUM ||
			error.message == ERROR_CONNECTION_LOST_GECKO ||
			error.message == ERROR_CHANNEL_CLOSED_CHROMIUM ||
			error.message.startsWith(ERROR_EDITOR_PAGE_CHROMIUM + JSON.stringify(EDITOR_URL));
	}

	function isSavingTab(tab) {
		return Boolean(tasks.find(taskInfo => taskInfo.tab.id == tab.id));
	}

	function onInit$2(tab) {
		cancelTab(tab.id, false);
	}

	function onTabReplaced$2(addedTabId, removedTabId) {
		tasks.forEach(taskInfo => {
			if (taskInfo.tab.id == removedTabId) {
				taskInfo.tab.id = addedTabId;
			}
		});
	}

	function onSaveEnd(taskId) {
		const taskInfo = tasks.find(taskInfo => taskInfo.id == taskId);
		if (taskInfo) {
			if (taskInfo.options.autoClose && !taskInfo.cancelled) {
				browser.tabs.remove(taskInfo.tab.id);
			}
			taskInfo.done();
		}
	}

	async function createTabAndWaitUntilComplete(createProperties) {
		const tab = await browser.tabs.create(createProperties);
		return new Promise((resolve, reject) => {
			browser.tabs.onUpdated.addListener(onTabUpdated);
			browser.tabs.onRemoved.addListener(onTabRemoved);
			function onTabUpdated(tabId, changeInfo) {
				if (tabId == tab.id && changeInfo.status == "complete") {
					resolve(tab);
					browser.tabs.onUpdated.removeListener(onTabUpdated);
					browser.tabs.onRemoved.removeListener(onTabRemoved);
				}
			}
			function onTabRemoved(tabId) {
				if (tabId == tab.id) {
					reject(tabId);
					browser.tabs.onRemoved.removeListener(onTabRemoved);
				}
			}
		});
	}

	function setCancelCallback(taskId, cancelCallback) {
		const taskInfo = tasks.find(taskInfo => taskInfo.id == taskId);
		if (taskInfo) {
			taskInfo.cancel = cancelCallback;
		}
	}

	function cancelTab(tabId, stopProcessing = true) {
		Array.from(tasks).filter(taskInfo =>
			taskInfo.tab.id == tabId &&
			!taskInfo.options.autoSave &&
			(stopProcessing || taskInfo.status != TASK_PROCESSING_STATE)
		).forEach(cancel);
	}

	function cancelTask(taskId) {
		cancel(tasks.find(taskInfo => taskInfo.id == taskId));
	}

	function cancelAllTasks() {
		Array.from(tasks).forEach(taskInfo => cancel(taskInfo, false));
	}

	function getTasksInfo() {
		return tasks.map(mapTaskInfo);
	}

	function getTaskInfo(taskId) {
		return tasks.find(taskInfo => taskInfo.id == taskId);
	}

	function cancel(taskInfo, runNextTasks) {
		const tabId = taskInfo.tab.id;
		taskInfo.cancelled = true;
		if (tabId) {
			browser.tabs.sendMessage(tabId, {
				method: "content.cancelSave",
				options: {
					loadDeferredImages: taskInfo.options.loadDeferredImages,
					loadDeferredImagesKeepZoomLevel: taskInfo.options.loadDeferredImagesKeepZoomLevel
				}
			}).catch(() => {
				// ignored
			});
			if (taskInfo.method == "content.autosave") {
				onEnd(tabId, true);
			}
			onCancelled(taskInfo.tab);
		}
		if (taskInfo.cancel) {
			taskInfo.cancel();
		}
		taskInfo.done(runNextTasks);
	}

	function mapTaskInfo(taskInfo) {
		return { id: taskInfo.id, tabId: taskInfo.tab.id, index: taskInfo.tab.index, url: taskInfo.tab.url, title: taskInfo.tab.title, cancelled: taskInfo.cancelled, status: taskInfo.status };
	}

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

	let enabled = true;

	async function onMessage$6(message) {
		if (message.method.endsWith(".state")) {
			return { enabled };
		}
	}

	async function externalSave(pageData) {
		pageData.autoSaveExternalSave = false;
		let response;
		try {
			response = await browser.runtime.sendNativeMessage("singlefile_companion", {
				method: "externalSave",
				pageData
			});
		} catch (error) {
			if (!error.message || !error.message.includes("Native host has exited")) {
				throw error;
			}
		}
		if (response && response.error) {
			throw new Error(response.error + " (Companion)");
		}
	}

	async function save(pageData) {
		let response;
		try {
			response = await browser.runtime.sendNativeMessage("singlefile_companion", {
				method: "save",
				pageData
			});
		} catch (error) {
			if (!error.message || !error.message.includes("Native host has exited")) {
				throw error;
			}
		}
		if (response && response.error) {
			throw new Error(response.error + " (Companion)");
		}
	}

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

	const pendingSaves = new Set();

	Promise.resolve().then(enable);

	async function onMessage$5(message) {
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
			browser.bookmarks.onMoved.removeListener(onMoved);
		} catch (error) {
			// ignored
		}
		let enabled;
		const profiles = await getProfiles();
		Object.keys(profiles).forEach(profileName => {
			if (profiles[profileName].saveCreatedBookmarks) {
				enabled = true;
			}
		});
		if (enabled) {
			browser.bookmarks.onCreated.addListener(onCreated);
			browser.bookmarks.onMoved.addListener(onMoved);
		}
	}

	async function disable() {
		let disabled;
		const profiles = await getProfiles();
		Object.keys(profiles).forEach(profileName => disabled = disabled || !profiles[profileName].saveCreatedBookmarks);
		if (disabled) {
			browser.bookmarks.onCreated.removeListener(onCreated);
			browser.bookmarks.onMoved.removeListener(onMoved);
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
		pendingSaves.add(bookmarkId);
		await saveBookmark(bookmarkId, bookmarkInfo.url, bookmarkInfo);
	}

	async function onMoved(bookmarkId, bookmarkInfo) {
		if (pendingSaves.has(bookmarkId)) {
			const bookmarks = await browser.bookmarks.get(bookmarkId);
			if (bookmarks[0]) {
				await saveBookmark(bookmarkId, bookmarks[0].url, bookmarkInfo);
			}
		}
	}

	async function saveBookmark(bookmarkId, url, bookmarkInfo) {
		const activeTabs = await browser.tabs.query({ lastFocusedWindow: true, active: true });
		const options = await getOptions(url);
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
				if (activeTabs.length && activeTabs[0].url == url) {
					pendingSaves.delete(bookmarkId);
					saveTabs(activeTabs, { bookmarkId, bookmarkFolders });
				} else {
					const tabs = await browser.tabs.query({});
					if (tabs.length) {
						const tab = tabs.find(tab => tab.url == url);
						if (tab) {
							pendingSaves.delete(bookmarkId);
							saveTabs([tab], { bookmarkId, bookmarkFolders });
						} else {
							if (url) {
								if (url == "about:blank") {
									browser.bookmarks.onChanged.addListener(onChanged);
								} else {
									saveUrl(url);
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
			pendingSaves.delete(bookmarkId);
			saveUrls([url], { bookmarkId });
		}
	}

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
	/* global fetch */
	const urlService = "https://api.woleet.io/v1/anchor";
	const apiKey = "";
	async function anchor(hash, userKey) {
		let bearer = userKey || apiKey;
		const response = await fetch(urlService, {
			method: "POST",
			headers: {
				"Accept": "application/json",
				"Content-Type": "application/json",
				"Authorization": "Bearer " + bearer
			},
			body: JSON.stringify({
				"name": hash,
				"hash": hash,
				"public": true
			})
		});
		if (response.status == 401) {
			const error = new Error("Your access token on Woleet is invalid. Go to __DOC_LINK__ to create your account.");
			error.link = "https://app.woleet.io/";
			throw error;
		} else if (response.status == 402) {
			const error = new Error("You have no more credits on Woleet. Go to __DOC_LINK__ to recharge them.");
			error.link = "https://app.woleet.io/";
			throw error;
		} else if (response.status >= 400) {
			throw new Error((response.statusText || ("Error " + response.status)) + " (Woleet)");
		}
		return response.json();
	}

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

	/* global browser, fetch, setInterval, URLSearchParams, URL */

	const TOKEN_URL$1 = "https://oauth2.googleapis.com/token";
	const AUTH_URL$1 = "https://accounts.google.com/o/oauth2/v2/auth";
	const REVOKE_ACCESS_URL$1 = "https://accounts.google.com/o/oauth2/revoke";
	const GDRIVE_URL = "https://www.googleapis.com/drive/v3/files";
	const GDRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files";
	const CONFLICT_ACTION_UNIQUIFY$4 = "uniquify";
	const CONFLICT_ACTION_OVERWRITE$3 = "overwrite";
	const CONFLICT_ACTION_SKIP$4 = "skip";
	const CONFLICT_ACTION_PROMPT$3 = "prompt";

	class GDrive {
		constructor(clientId, clientKey, scopes) {
			this.clientId = clientId;
			this.clientKey = clientKey;
			this.scopes = scopes;
			this.folderIds = new Map();
			setInterval(() => this.folderIds.clear(), 60 * 1000);
		}
		async auth(options = { interactive: true }) {
			if (nativeAuth(options)) {
				this.accessToken = await browser.identity.getAuthToken({ interactive: options.interactive });
				return { revokableAccessToken: this.accessToken };
			} else {
				this.authURL = AUTH_URL$1 +
					"?client_id=" + this.clientId +
					"&response_type=code" +
					"&access_type=offline" +
					"&redirect_uri=" + browser.identity.getRedirectURL() +
					"&scope=" + this.scopes.join(" ");
				return options.code ? authFromCode$1(this, options) : initAuth$1(this, options);
			}
		}
		setAuthInfo(authInfo, options) {
			if (!nativeAuth(options)) {
				if (authInfo) {
					this.accessToken = authInfo.accessToken;
					this.refreshToken = authInfo.refreshToken;
					this.expirationDate = authInfo.expirationDate;
				} else {
					delete this.accessToken;
					delete this.refreshToken;
					delete this.expirationDate;
				}
			}
		}
		async refreshAuthToken() {
			if (this.refreshToken) {
				const httpResponse = await fetch(TOKEN_URL$1, {
					method: "POST",
					headers: { "Content-Type": "application/x-www-form-urlencoded" },
					body: "client_id=" + this.clientId +
						"&refresh_token=" + this.refreshToken +
						"&grant_type=refresh_token" +
						"&client_secret=" + this.clientKey
				});
				if (httpResponse.status == 400) {
					throw new Error("unknown_token");
				}
				const response = await getJSON$1(httpResponse);
				this.accessToken = response.access_token;
				if (response.refresh_token) {
					this.refreshToken = response.refresh_token;
				}
				if (response.expires_in) {
					this.expirationDate = Date.now() + (response.expires_in * 1000);
				}
				return { accessToken: this.accessToken, refreshToken: this.refreshToken, expirationDate: this.expirationDate };
			} else {
				try {
					if (browser.identity && browser.identity.removeCachedAuthToken && this.accessToken) {
						await browser.identity.removeCachedAuthToken({ token: this.accessToken });
					}
					this.accessToken = await browser.identity.getAuthToken({ interactive: false });
					return { revokableAccessToken: this.accessToken };
				} catch (error) {
					delete this.accessToken;
				}
			}
		}
		async revokeAuthToken(accessToken) {
			if (accessToken) {
				if (browser.identity && browser.identity.removeCachedAuthToken) {
					try {
						await browser.identity.removeCachedAuthToken({ token: accessToken });
					} catch (error) {
						// ignored
					}
				}
				const httpResponse = await fetch(REVOKE_ACCESS_URL$1, {
					method: "POST",
					headers: { "Content-Type": "application/x-www-form-urlencoded" },
					body: "token=" + accessToken
				});
				try {
					await getJSON$1(httpResponse);
				}
				catch (error) {
					if (error.message != "invalid_token") {
						throw error;
					}
				}
				finally {
					delete this.accessToken;
					delete this.refreshToken;
					delete this.expirationDate;
				}
			}
		}
		async upload(fullFilename, blob, options, setCancelCallback, retry = true) {
			const parentFolderId = await getParentFolderId(this, fullFilename);
			const fileParts = fullFilename.split("/");
			const filename = fileParts.pop();
			const uploader = new MediaUploader$1({
				token: this.accessToken,
				file: blob,
				parents: [parentFolderId],
				filename,
				onProgress: options.onProgress,
				filenameConflictAction: options.filenameConflictAction,
				prompt: options.prompt
			});
			try {
				if (setCancelCallback) {
					setCancelCallback(() => uploader.cancelled = true);
				}
				await uploader.upload();
			}
			catch (error) {
				if (error.message == "path_not_found" && retry) {
					this.folderIds.clear();
					return this.upload(fullFilename, blob, options, setCancelCallback);
				} else {
					throw error;
				}
			}
		}
	}

	class MediaUploader$1 {
		constructor(options) {
			this.file = options.file;
			this.onProgress = options.onProgress;
			this.contentType = this.file.type || "application/octet-stream";
			this.metadata = {
				name: options.filename,
				mimeType: this.contentType,
				parents: options.parents || ["root"]
			};
			this.token = options.token;
			this.offset = 0;
			this.chunkSize = options.chunkSize || 512 * 1024;
			this.filenameConflictAction = options.filenameConflictAction;
			this.prompt = options.prompt;
		}
		async upload(indexFilename = 1) {
			let method = "POST";
			let fileId;
			const httpListResponse = getResponse$1(await fetch(GDRIVE_URL + `?q=name = '${this.metadata.name}' and trashed != true and '${this.metadata.parents[0]}' in parents`, {
				headers: {
					"Authorization": "Bearer " + this.token,
					"Content-Type": "application/json"
				}
			}));
			const response = await httpListResponse.json();
			if (response.files.length) {
				if (this.filenameConflictAction == CONFLICT_ACTION_OVERWRITE$3) {
					method = "PATCH";
					fileId = response.files[0].id;
					this.metadata.parents = null;
				} else if (this.filenameConflictAction == CONFLICT_ACTION_UNIQUIFY$4) {
					let nameWithoutExtension = this.metadata.name;
					let extension = "";
					const dotIndex = this.metadata.name.lastIndexOf(".");
					if (dotIndex > -1) {
						nameWithoutExtension = this.metadata.name.substring(0, dotIndex);
						extension = this.metadata.name.substring(dotIndex + 1);
					}
					const name = nameWithoutExtension + " (" + indexFilename + ")." + extension;
					const httpResponse = getResponse$1(await fetch(GDRIVE_URL + `?q=name = '${name}' and trashed != true and '${this.metadata.parents[0]}' in parents`, {
						headers: {
							"Authorization": "Bearer " + this.token,
							"Content-Type": "application/json"
						}
					}));
					const response = await httpResponse.json();
					if (response.files.length) {
						return this.upload(indexFilename + 1);
					} else {
						this.metadata.name = name;
					}
				} else if (this.filenameConflictAction == CONFLICT_ACTION_PROMPT$3) {
					if (this.prompt) {
						const name = await this.prompt(this.metadata.name);
						if (name) {
							this.metadata.name = name;
							return this.upload(indexFilename);
						} else {
							return response;
						}
					} else {
						this.filenameConflictAction = CONFLICT_ACTION_UNIQUIFY$4;
						return this.upload(indexFilename);
					}
				} else if (this.filenameConflictAction == CONFLICT_ACTION_SKIP$4) {
					return response;
				}
			}
			const httpResponse = getResponse$1(await fetch(GDRIVE_UPLOAD_URL + (fileId ? "/" + fileId : "") + "?uploadType=resumable", {
				method,
				headers: {
					"Authorization": "Bearer " + this.token,
					"Content-Type": "application/json",
					"X-Upload-Content-Length": this.file.size,
					"X-Upload-Content-Type": this.contentType
				},
				body: JSON.stringify(this.metadata)
			}));
			const location = httpResponse.headers.get("Location");
			this.url = location;
			if (!this.cancelled) {
				if (this.onProgress) {
					this.onProgress(0, this.file.size);
				}
				return sendFile$1(this);
			}
		}
	}

	async function authFromCode$1(gdrive, options) {
		const httpResponse = await fetch(TOKEN_URL$1, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: "client_id=" + gdrive.clientId +
				"&client_secret=" + gdrive.clientKey +
				"&grant_type=authorization_code" +
				"&code=" + options.code +
				"&redirect_uri=" + browser.identity.getRedirectURL()
		});
		const response = await getJSON$1(httpResponse);
		gdrive.accessToken = response.access_token;
		gdrive.refreshToken = response.refresh_token;
		gdrive.expirationDate = Date.now() + (response.expires_in * 1000);
		return { accessToken: gdrive.accessToken, refreshToken: gdrive.refreshToken, expirationDate: gdrive.expirationDate };
	}

	async function initAuth$1(gdrive, options) {
		let code;
		try {
			if (browser.identity && browser.identity.launchWebAuthFlow && !options.forceWebAuthFlow) {
				const authURL = await browser.identity.launchWebAuthFlow({
					interactive: options.interactive,
					url: gdrive.authURL
				});
				options.code = new URLSearchParams(new URL(authURL).search).get("code");
				return await authFromCode$1(gdrive, options);
			} else if (options.launchWebAuthFlow) {
				options.extractAuthCode(browser.identity.getRedirectURL())
					.then(authCode => code = authCode)
					.catch(() => { /* ignored */ });
				return await options.launchWebAuthFlow({ url: gdrive.authURL });
			} else {
				throw new Error("auth_not_supported");
			}
		}
		catch (error) {
			if (error.message && (error.message == "code_required" || error.message.includes("access"))) {
				if (code) {
					options.code = code;
					return await authFromCode$1(gdrive, options);
				} else {
					throw new Error("code_required");
				}
			} else {
				throw error;
			}
		}
	}

	function nativeAuth(options = {}) {
		return Boolean(browser.identity && browser.identity.getAuthToken) && !options.forceWebAuthFlow;
	}

	async function getParentFolderId(gdrive, filename, retry = true) {
		const fileParts = filename.split("/");
		fileParts.pop();
		const folderId = gdrive.folderIds.get(fileParts.join("/"));
		if (folderId) {
			return folderId;
		}
		let parentFolderId = "root";
		if (fileParts.length) {
			let fullFolderName = "";
			for (const folderName of fileParts) {
				if (fullFolderName) {
					fullFolderName += "/";
				}
				fullFolderName += folderName;
				const folderId = gdrive.folderIds.get(fullFolderName);
				if (folderId) {
					parentFolderId = folderId;
				} else {
					try {
						parentFolderId = await getOrCreateFolder(gdrive, folderName, parentFolderId);
						gdrive.folderIds.set(fullFolderName, parentFolderId);
					} catch (error) {
						if (error.message == "path_not_found" && retry) {
							gdrive.folderIds.clear();
							return getParentFolderId(gdrive, filename, false);
						} else {
							throw error;
						}
					}
				}
			}
		}
		return parentFolderId;
	}

	async function getOrCreateFolder(gdrive, folderName, parentFolderId) {
		const response = await getFolder(gdrive, folderName, parentFolderId);
		if (response.files.length) {
			return response.files[0].id;
		} else {
			const response = await createFolder(gdrive, folderName, parentFolderId);
			return response.id;
		}
	}

	async function getFolder(gdrive, folderName, parentFolderId) {
		const httpResponse = await fetch(GDRIVE_URL + "?q=mimeType = 'application/vnd.google-apps.folder' and name = '" + folderName + "' and trashed != true and '" + parentFolderId + "' in parents", {
			headers: {
				"Authorization": "Bearer " + gdrive.accessToken
			}
		});
		return getJSON$1(httpResponse);
	}

	async function createFolder(gdrive, folderName, parentFolderId) {
		const httpResponse = await fetch(GDRIVE_URL, {
			method: "POST",
			headers: {
				"Authorization": "Bearer " + gdrive.accessToken,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				name: folderName,
				parents: [parentFolderId],
				mimeType: "application/vnd.google-apps.folder"
			})
		});
		return getJSON$1(httpResponse);
	}

	async function sendFile$1(mediaUploader) {
		let content = mediaUploader.file, end = mediaUploader.file.size;
		if (mediaUploader.offset || mediaUploader.chunkSize) {
			if (mediaUploader.chunkSize) {
				end = Math.min(mediaUploader.offset + mediaUploader.chunkSize, mediaUploader.file.size);
			}
			content = content.slice(mediaUploader.offset, end);
		}
		const httpResponse = await fetch(mediaUploader.url, {
			method: "PUT",
			headers: {
				"Authorization": "Bearer " + mediaUploader.token,
				"Content-Type": mediaUploader.contentType,
				"Content-Range": "bytes " + mediaUploader.offset + "-" + (end - 1) + "/" + mediaUploader.file.size,
				"X-Upload-Content-Type": mediaUploader.contentType
			},
			body: content
		});
		if (mediaUploader.onProgress && !mediaUploader.cancelled) {
			mediaUploader.onProgress(mediaUploader.offset + mediaUploader.chunkSize, mediaUploader.file.size);
		}
		if (httpResponse.status == 200 || httpResponse.status == 201) {
			return httpResponse.json();
		} else if (httpResponse.status == 308) {
			const range = httpResponse.headers.get("Range");
			if (range) {
				mediaUploader.offset = parseInt(range.match(/\d+/g).pop(), 10) + 1;
			}
			if (mediaUploader.cancelled) {
				throw new Error("upload_cancelled");
			} else {
				return sendFile$1(mediaUploader);
			}
		} else {
			getResponse$1(httpResponse);
		}
	}

	async function getJSON$1(httpResponse) {
		httpResponse = getResponse$1(httpResponse);
		const response = await httpResponse.json();
		if (response.error) {
			throw new Error(response.error);
		} else {
			return response;
		}
	}

	function getResponse$1(httpResponse) {
		if (httpResponse.status == 200) {
			return httpResponse;
		} else if (httpResponse.status == 404) {
			throw new Error("path_not_found");
		} else if (httpResponse.status == 401) {
			throw new Error("invalid_token");
		} else {
			throw new Error("unknown_error (" + httpResponse.status + ")");
		}
	}

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

	/* global browser, fetch */

	const TOKEN_URL = "https://api.dropboxapi.com/oauth2/token";
	const AUTH_URL = "https://www.dropbox.com/oauth2/authorize";
	const REVOKE_ACCESS_URL = "https://api.dropboxapi.com/2/auth/token/revoke";
	const DROPBOX_SEARCH_URL = "https://api.dropboxapi.com/2/files/search_v2";
	const DROPBOX_UPLOAD_URL = "https://content.dropboxapi.com/2/files/upload_session/start";
	const DROPBOX_APPEND_URL = "https://content.dropboxapi.com/2/files/upload_session/append_v2";
	const DROPBOX_FINISH_URL = "https://content.dropboxapi.com/2/files/upload_session/finish";
	const CONFLICT_ACTION_UNIQUIFY$3 = "uniquify";
	const CONFLICT_ACTION_OVERWRITE$2 = "overwrite";
	const CONFLICT_ACTION_SKIP$3 = "skip";
	const CONFLICT_ACTION_PROMPT$2 = "prompt";
	const ENCODED_CHARS = /[\u007f-\uffff]/g;

	class Dropbox {
		constructor(clientId, clientKey) {
			this.clientId = clientId;
			this.clientKey = clientKey;
		}
		async auth(options = { interactive: true }) {
			this.authURL = AUTH_URL +
				"?client_id=" + this.clientId +
				"&response_type=code" +
				"&token_access_type=offline" +
				"&redirect_uri=" + browser.identity.getRedirectURL();
			return options.code ? authFromCode(this, options) : initAuth(this, options);
		}
		setAuthInfo(authInfo) {
			if (authInfo) {
				this.accessToken = authInfo.accessToken;
				this.refreshToken = authInfo.refreshToken;
				this.expirationDate = authInfo.expirationDate;
			} else {
				delete this.accessToken;
				delete this.refreshToken;
				delete this.expirationDate;
			}
		}
		async refreshAuthToken() {
			if (this.refreshToken) {
				const httpResponse = await fetch(TOKEN_URL, {
					method: "POST",
					headers: { "Content-Type": "application/x-www-form-urlencoded" },
					body: "client_id=" + this.clientId +
						"&refresh_token=" + this.refreshToken +
						"&grant_type=refresh_token" +
						"&client_secret=" + this.clientKey
				});
				if (httpResponse.status == 400) {
					throw new Error("unknown_token");
				}
				const response = await getJSON(httpResponse);
				this.accessToken = response.access_token;
				if (response.refresh_token) {
					this.refreshToken = response.refresh_token;
				}
				if (response.expires_in) {
					this.expirationDate = Date.now() + (response.expires_in * 1000);
				}
				return { accessToken: this.accessToken, refreshToken: this.refreshToken, expirationDate: this.expirationDate };
			} else {
				delete this.accessToken;
			}
		}
		async revokeAuthToken(accessToken) {
			if (accessToken) {
				const httpResponse = await fetch(REVOKE_ACCESS_URL, {
					method: "POST",
					headers: {
						"Authorization": "Bearer " + accessToken
					}
				});
				try {
					await httpResponse.text();
				}
				catch (error) {
					if (error.message != "invalid_token") {
						throw error;
					}
				}
				finally {
					delete this.accessToken;
					delete this.refreshToken;
					delete this.expirationDate;
				}
			}
		}
		async upload(filename, blob, options, setCancelCallback) {
			const uploader = new MediaUploader({
				token: this.accessToken,
				file: blob,
				filename,
				onProgress: options.onProgress,
				filenameConflictAction: options.filenameConflictAction,
				prompt: options.prompt
			});
			if (setCancelCallback) {
				setCancelCallback(() => uploader.cancelled = true);
			}
			await uploader.upload();
		}
	}

	class MediaUploader {
		constructor(options) {
			this.file = options.file;
			this.onProgress = options.onProgress;
			this.contentType = this.file.type || "application/octet-stream";
			this.metadata = {
				name: options.filename,
				mimeType: this.contentType
			};
			this.token = options.token;
			this.offset = 0;
			this.chunkSize = options.chunkSize || 8 * 1024 * 1024;
			this.filenameConflictAction = options.filenameConflictAction;
			this.prompt = options.prompt;
		}
		async upload() {
			const httpListResponse = getResponse(await fetch(DROPBOX_SEARCH_URL, {
				method: "POST",
				headers: {
					"Authorization": "Bearer " + this.token,
					"Content-Type": "application/json"
				},
				body: stringify({
					query: this.metadata.name,
					options: {
						filename: true
					}
				})
			}));
			const response = await getJSON(httpListResponse);
			if (response.matches.length) {
				if (this.filenameConflictAction == CONFLICT_ACTION_PROMPT$2) {
					if (this.prompt) {
						const name = await this.prompt(this.metadata.name);
						if (name) {
							this.metadata.name = name;
						} else {
							return response;
						}
					} else {
						this.filenameConflictAction = CONFLICT_ACTION_UNIQUIFY$3;
					}
				} else if (this.filenameConflictAction == CONFLICT_ACTION_SKIP$3) {
					return response;
				}
			}
			const httpResponse = getResponse(await fetch(DROPBOX_UPLOAD_URL, {
				method: "POST",
				headers: {
					"Authorization": "Bearer " + this.token,
					"Dropbox-API-Arg": stringify({
						close: false
					}),
					"Content-Type": "application/octet-stream"
				}
			}));
			const sessionId = (await getJSON(httpResponse)).session_id;
			this.sessionId = sessionId;
			if (!this.cancelled) {
				if (this.onProgress) {
					this.onProgress(0, this.file.size);
				}
				return sendFile(this);
			}
		}
	}

	async function authFromCode(dropbox, options) {
		const httpResponse = await fetch(TOKEN_URL, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: "client_id=" + dropbox.clientId +
				"&client_secret=" + dropbox.clientKey +
				"&grant_type=authorization_code" +
				"&code=" + options.code +
				"&redirect_uri=" + browser.identity.getRedirectURL()
		});
		const response = await getJSON(httpResponse);
		dropbox.accessToken = response.access_token;
		dropbox.refreshToken = response.refresh_token;
		dropbox.expirationDate = Date.now() + (response.expires_in * 1000);
		return { accessToken: dropbox.accessToken, refreshToken: dropbox.refreshToken, expirationDate: dropbox.expirationDate };
	}

	async function initAuth(dropbox, options) {
		let code;
		try {
			options.extractAuthCode(browser.identity.getRedirectURL())
				.then(authCode => code = authCode)
				.catch(() => { /* ignored */ });
			return await options.launchWebAuthFlow({ url: dropbox.authURL });
		}
		catch (error) {
			if (error.message && (error.message == "code_required" || error.message.includes("access"))) {
				if (code) {
					options.code = code;
					return await authFromCode(dropbox, options);
				} else {
					throw new Error("code_required");
				}
			} else {
				throw error;
			}
		}
	}

	async function sendFile(mediaUploader) {
		let content = mediaUploader.file, end = mediaUploader.file.size;
		if (mediaUploader.offset || mediaUploader.chunkSize) {
			if (mediaUploader.chunkSize) {
				end = Math.min(mediaUploader.offset + mediaUploader.chunkSize, mediaUploader.file.size);
			}
			content = content.slice(mediaUploader.offset, end);
		}
		const httpAppendResponse = getResponse(await fetch(DROPBOX_APPEND_URL, {
			method: "POST",
			headers: {
				"Authorization": "Bearer " + mediaUploader.token,
				"Content-Type": "application/octet-stream",
				"Dropbox-API-Arg": stringify({
					cursor: {
						session_id: mediaUploader.sessionId,
						offset: mediaUploader.offset
					},
					close: end == mediaUploader.file.size
				})
			},
			body: content
		}));
		if (mediaUploader.onProgress && !mediaUploader.cancelled) {
			mediaUploader.onProgress(mediaUploader.offset + mediaUploader.chunkSize, mediaUploader.file.size);
		}
		if (httpAppendResponse.status == 200) {
			mediaUploader.offset = end;
			if (mediaUploader.offset < mediaUploader.file.size) {
				return sendFile(mediaUploader);
			}
		}
		let path = mediaUploader.metadata.name;
		if (!path.startsWith("/")) {
			path = "/" + path;
		}
		const httpFinishResponse = await fetch(DROPBOX_FINISH_URL, {
			method: "POST",
			headers: {
				"Authorization": "Bearer " + mediaUploader.token,
				"Content-Type": "application/octet-stream",
				"Dropbox-API-Arg": stringify({
					cursor: {
						session_id: mediaUploader.sessionId,
						offset: mediaUploader.offset
					},
					commit: {
						path,
						mode: mediaUploader.filenameConflictAction == CONFLICT_ACTION_OVERWRITE$2 ? "overwrite" : "add",
						autorename: mediaUploader.filenameConflictAction == CONFLICT_ACTION_UNIQUIFY$3
					}
				})
			}
		});
		if (httpFinishResponse.status == 200) {
			return getJSON(httpFinishResponse);
		} else if (httpFinishResponse.status == 409 && mediaUploader.filenameConflictAction == CONFLICT_ACTION_PROMPT$2) {
			mediaUploader.offset = 0;
			return mediaUploader.upload();
		} else {
			throw new Error("unknown_error (" + httpFinishResponse.status + ")");
		}
	}

	async function getJSON(httpResponse) {
		httpResponse = getResponse(httpResponse);
		const response = await httpResponse.json();
		if (response.error) {
			throw new Error(response.error);
		} else {
			return response;
		}
	}

	function getResponse(httpResponse) {
		if (httpResponse.status == 200) {
			return httpResponse;
		} else if (httpResponse.status == 401) {
			throw new Error("invalid_token");
		} else {
			throw new Error("unknown_error (" + httpResponse.status + ")");
		}
	}

	function stringify(value) {
		return JSON.stringify(value).replace(ENCODED_CHARS,
			function (c) {
				return "\\u" + ("000" + c.charCodeAt(0).toString(16)).slice(-4);
			}
		);
	}

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

	/* global fetch, btoa, AbortController */

	const EMPTY_STRING$1 = "";
	const CONFLICT_ACTION_SKIP$2 = "skip";
	const CONFLICT_ACTION_UNIQUIFY$2 = "uniquify";
	const CONFLICT_ACTION_OVERWRITE$1 = "overwrite";
	const CONFLICT_ACTION_PROMPT$1 = "prompt";
	const BASIC_PREFIX_AUTHORIZATION = "Basic ";
	const AUTHORIZATION_HEADER$2 = "Authorization";
	const AUTHORIZATION_SEPARATOR = ":";
	const DIRECTORY_SEPARATOR = "/";
	const EXTENSION_SEPARATOR$1 = ".";
	const ERROR_PREFIX_MESSAGE = "Error ";
	const INDEX_FILENAME_PREFIX$1 = " (";
	const INDEX_FILENAME_SUFFIX$1 = ")";
	const INDEX_FILENAME_REGEXP$1 = /\s\((\d+)\)$/;
	const ABORT_ERROR_NAME$1 = "AbortError";
	const HEAD_METHOD = "HEAD";
	const PUT_METHOD$1 = "PUT";
	const DELETE_METHOD = "DELETE";
	const PROPFIND_METHOD = "PROPFIND";
	const MKCOL_METHOD = "MKCOL";
	const CONTENT_TYPE_HEADER = "Content-Type";
	const HTML_CONTENT_TYPE = "text/html";
	const CREDENTIALS_PARAMETER = "omit";
	const FOUND_STATUS = 200;
	const CREATED_STATUS = 201;
	const NOT_FOUND_STATUS = 404;
	const MIN_ERROR_STATUS = 400;

	class WebDAV {
		constructor(url, username, password) {
			if (!url.endsWith(DIRECTORY_SEPARATOR)) {
				url += DIRECTORY_SEPARATOR;
			}
			this.url = url;
			this.authorization = BASIC_PREFIX_AUTHORIZATION + btoa(username + AUTHORIZATION_SEPARATOR + password);
		}

		upload(filename, content, options) {
			this.controller = new AbortController();
			options.signal = this.controller.signal;
			options.authorization = this.authorization;
			options.url = this.url;
			return upload$1(filename, content, options);
		}

		abort() {
			if (this.controller) {
				this.controller.abort();
			}
		}
	}

	async function upload$1(filename, content, options) {
		const { authorization, filenameConflictAction, prompt, signal, preventRetry } = options;
		let { url } = options;
		try {
			if (filenameConflictAction == CONFLICT_ACTION_OVERWRITE$1) {
				let response = await sendRequest(filename, PUT_METHOD$1, content);
				if (response.status == CREATED_STATUS) {
					return response;
				} else if (response.status >= MIN_ERROR_STATUS) {
					response = await sendRequest(filename, DELETE_METHOD);
					if (response.status >= MIN_ERROR_STATUS) {
						throw new Error(ERROR_PREFIX_MESSAGE + response.status);
					}
					return await upload$1(filename, content, options);
				}
			} else {
				let response = await sendRequest(filename, HEAD_METHOD);
				if (response.status == FOUND_STATUS) {
					if (filenameConflictAction == CONFLICT_ACTION_UNIQUIFY$2 || (filenameConflictAction == CONFLICT_ACTION_PROMPT$1 && !prompt)) {
						const { filenameWithoutExtension, extension, indexFilename } = splitFilename(filename);
						options.indexFilename = indexFilename + 1;
						return await upload$1(getFilename(filenameWithoutExtension, extension), content, options);
					} else if (filenameConflictAction == CONFLICT_ACTION_PROMPT$1) {
						filename = await prompt(filename);
						return filename ? upload$1(filename, content, options) : response;
					} else if (filenameConflictAction == CONFLICT_ACTION_SKIP$2) {
						return response;
					}
				} else if (response.status == NOT_FOUND_STATUS) {
					response = await sendRequest(filename, PUT_METHOD$1, content);
					if (response.status >= MIN_ERROR_STATUS && !preventRetry) {
						if (filename.includes(DIRECTORY_SEPARATOR)) {
							await createDirectories();
							options.preventRetry = true;
							return await upload$1(filename, content, options);
						} else {
							throw new Error(ERROR_PREFIX_MESSAGE + response.status);
						}
					} else {
						return response;
					}
				} else if (response.status >= MIN_ERROR_STATUS) {
					throw new Error(ERROR_PREFIX_MESSAGE + response.status);
				}
			}
		} catch (error) {
			if (error.name != ABORT_ERROR_NAME$1) {
				throw error;
			}
		}

		function sendRequest(path, method, body) {
			const headers = {
				[AUTHORIZATION_HEADER$2]: authorization
			};
			if (body) {
				headers[CONTENT_TYPE_HEADER] = HTML_CONTENT_TYPE;
			}
			return fetch(url + path, { method, headers, signal, body, credentials: CREDENTIALS_PARAMETER });
		}

		function splitFilename(filename) {
			let filenameWithoutExtension = filename;
			let extension = EMPTY_STRING$1;
			const indexExtensionSeparator = filename.lastIndexOf(EXTENSION_SEPARATOR$1);
			if (indexExtensionSeparator > -1) {
				filenameWithoutExtension = filename.substring(0, indexExtensionSeparator);
				extension = filename.substring(indexExtensionSeparator + 1);
			}
			let indexFilename;
			({ filenameWithoutExtension, indexFilename } = extractIndexFilename(filenameWithoutExtension));
			return { filenameWithoutExtension, extension, indexFilename };
		}

		function extractIndexFilename(filenameWithoutExtension) {
			const indexFilenameMatch = filenameWithoutExtension.match(INDEX_FILENAME_REGEXP$1);
			let indexFilename = 0;
			if (indexFilenameMatch && indexFilenameMatch.length > 1) {
				const parsedIndexFilename = Number(indexFilenameMatch[indexFilenameMatch.length - 1]);
				if (!Number.isNaN(parsedIndexFilename)) {
					indexFilename = parsedIndexFilename;
					filenameWithoutExtension = filenameWithoutExtension.replace(INDEX_FILENAME_REGEXP$1, EMPTY_STRING$1);
				}
			}
			return { filenameWithoutExtension, indexFilename };
		}

		function getFilename(filenameWithoutExtension, extension) {
			return filenameWithoutExtension +
				INDEX_FILENAME_PREFIX$1 + options.indexFilename + INDEX_FILENAME_SUFFIX$1 +
				(extension ? EXTENSION_SEPARATOR$1 + extension : EMPTY_STRING$1);
		}

		async function createDirectories() {
			const filenameParts = filename.split(DIRECTORY_SEPARATOR);
			filenameParts.pop();
			let path = EMPTY_STRING$1;
			for (const filenamePart of filenameParts) {
				if (filenamePart) {
					path += filenamePart;
					const response = await sendRequest(path, PROPFIND_METHOD);
					if (response.status == NOT_FOUND_STATUS) {
						const response = await sendRequest(path, MKCOL_METHOD);
						if (response.status >= MIN_ERROR_STATUS) {
							throw new Error(ERROR_PREFIX_MESSAGE + response.status);
						}
					}
					path += DIRECTORY_SEPARATOR;
				}
			}
		}
	}

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

	/* global fetch, btoa, Blob, FileReader, AbortController */

	const EMPTY_STRING = "";
	const CONFLICT_ACTION_SKIP$1 = "skip";
	const CONFLICT_ACTION_UNIQUIFY$1 = "uniquify";
	const CONFLICT_ACTION_OVERWRITE = "overwrite";
	const CONFLICT_ACTION_PROMPT = "prompt";
	const AUTHORIZATION_HEADER$1 = "Authorization";
	const BEARER_PREFIX_AUTHORIZATION$1 = "Bearer ";
	const ACCEPT_HEADER$1 = "Accept";
	const GITHUB_API_CONTENT_TYPE = "application/vnd.github+json";
	const GITHUB_API_VERSION_HEADER = "X-GitHub-Api-Version";
	const GITHUB_API_VERSION = "2022-11-28";
	const EXTENSION_SEPARATOR = ".";
	const INDEX_FILENAME_PREFIX = " (";
	const INDEX_FILENAME_SUFFIX = ")";
	const INDEX_FILENAME_REGEXP = /\s\((\d+)\)$/;
	const ABORT_ERROR_NAME = "AbortError";
	const GET_METHOD = "GET";
	const PUT_METHOD = "PUT";
	const GITHUB_URL = "https://github.com";
	const GITHUB_API_URL = "https://api.github.com";
	const BLOB_PATH = "blob";
	const REPOS_PATH = "repos";
	const CONTENTS_PATH = "contents";

	let pendingPush;

	class GitHub {
		constructor(token, userName, repositoryName, branch) {
			this.headers = new Map([
				[AUTHORIZATION_HEADER$1, BEARER_PREFIX_AUTHORIZATION$1 + token],
				[ACCEPT_HEADER$1, GITHUB_API_CONTENT_TYPE],
				[GITHUB_API_VERSION_HEADER, GITHUB_API_VERSION]
			]);
			this.userName = userName;
			this.repositoryName = repositoryName;
			this.branch = branch;
		}

		async upload(path, content, options) {
			this.controller = new AbortController();
			options.signal = this.controller.signal;
			options.headers = this.headers;
			const base64Content = content instanceof Blob ? await blobToBase64(content) : btoa(unescape(encodeURIComponent(content)));
			return upload(this.userName, this.repositoryName, this.branch, path, base64Content, options);
		}

		abort() {
			if (this.controller) {
				this.controller.abort();
			}
		}
	}

	async function upload(userName, repositoryName, branch, path, content, options) {
		const { filenameConflictAction, prompt, signal, headers } = options;
		while (pendingPush) {
			await pendingPush;
		}
		try {
			pendingPush = await createContent({ path, content });
		} finally {
			pendingPush = null;
		}
		return {
			url: `${GITHUB_URL}/${userName}/${repositoryName}/${BLOB_PATH}/${branch}/${path}`
		};

		async function createContent({ path, content, message = EMPTY_STRING, sha }) {
			try {
				const response = await fetchContentData(PUT_METHOD, JSON.stringify({
					content,
					message,
					branch,
					sha
				}));
				const responseData = await response.json();
				if (response.status == 422) {
					if (filenameConflictAction == CONFLICT_ACTION_OVERWRITE) {
						const response = await fetchContentData(GET_METHOD);
						const responseData = await response.json();
						const sha = responseData.sha;
						return await createContent({ path, content, message, sha });
					} else if (filenameConflictAction == CONFLICT_ACTION_UNIQUIFY$1) {
						const { filenameWithoutExtension, extension, indexFilename } = splitFilename(path);
						options.indexFilename = indexFilename + 1;
						path = getFilename(filenameWithoutExtension, extension);
						return await createContent({ path, content, message });
					} else if (filenameConflictAction == CONFLICT_ACTION_SKIP$1) {
						return responseData;
					} else if (filenameConflictAction == CONFLICT_ACTION_PROMPT) {
						if (prompt) {
							path = await prompt(path);
							if (path) {
								return await createContent({ path, content, message });
							} else {
								return responseData;
							}
						} else {
							options.filenameConflictAction = CONFLICT_ACTION_UNIQUIFY$1;
							return await createContent({ path, content, message });
						}
					}
				}
				if (response.status < 400) {
					return responseData;
				} else {
					throw new Error(responseData.message);
				}
			} catch (error) {
				if (error.name != ABORT_ERROR_NAME) {
					throw error;
				}
			}

			function fetchContentData(method, body) {
				return fetch(`${GITHUB_API_URL}/${REPOS_PATH}/${userName}/${repositoryName}/${CONTENTS_PATH}/${path}`, {
					method,
					headers,
					body,
					signal
				});
			}
		}

		function splitFilename(filename) {
			let filenameWithoutExtension = filename;
			let extension = EMPTY_STRING;
			const indexExtensionSeparator = filename.lastIndexOf(EXTENSION_SEPARATOR);
			if (indexExtensionSeparator > -1) {
				filenameWithoutExtension = filename.substring(0, indexExtensionSeparator);
				extension = filename.substring(indexExtensionSeparator + 1);
			}
			let indexFilename;
			({ filenameWithoutExtension, indexFilename } = extractIndexFilename(filenameWithoutExtension));
			return { filenameWithoutExtension, extension, indexFilename };
		}

		function extractIndexFilename(filenameWithoutExtension) {
			const indexFilenameMatch = filenameWithoutExtension.match(INDEX_FILENAME_REGEXP);
			let indexFilename = 0;
			if (indexFilenameMatch && indexFilenameMatch.length > 1) {
				const parsedIndexFilename = Number(indexFilenameMatch[indexFilenameMatch.length - 1]);
				if (!Number.isNaN(parsedIndexFilename)) {
					indexFilename = parsedIndexFilename;
					filenameWithoutExtension = filenameWithoutExtension.replace(INDEX_FILENAME_REGEXP, EMPTY_STRING);
				}
			}
			return { filenameWithoutExtension, indexFilename };
		}

		function getFilename(filenameWithoutExtension, extension) {
			return filenameWithoutExtension +
				INDEX_FILENAME_PREFIX + options.indexFilename + INDEX_FILENAME_SUFFIX +
				(extension ? EXTENSION_SEPARATOR + extension : EMPTY_STRING);
		}
	}

	function blobToBase64(blob) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onloadend = () => resolve(reader.result.match(/^data:[^,]+,(.*)$/)[1]);
			reader.onerror = event => reject(event.detail);
			reader.readAsDataURL(blob);
		});
	}

	/* global TextEncoder, TextDecoder */

	const DEFAULT_CHUNK_SIZE = 8 * 1024 * 1024;
	const TYPE_REFERENCE = 0;
	const SPECIAL_TYPES = [TYPE_REFERENCE];
	const EMPTY_SLOT_VALUE = Symbol();

	const textEncoder = new TextEncoder();
	const textDecoder = new TextDecoder();
	const types = new Array(256);
	let typeIndex = 0;

	registerType(serializeCircularReference, parseCircularReference, testCircularReference, TYPE_REFERENCE);
	registerType(null, parseObject, testObject);
	registerType(serializeArray, parseArray, testArray);
	registerType(serializeString, parseString, testString);
	registerType(serializeTypedArray, parseFloat64Array, testFloat64Array);
	registerType(serializeTypedArray, parseFloat32Array, testFloat32Array);
	registerType(serializeTypedArray, parseUint32Array, testUint32Array);
	registerType(serializeTypedArray, parseInt32Array, testInt32Array);
	registerType(serializeTypedArray, parseUint16Array, testUint16Array);
	registerType(serializeTypedArray, parseInt16Array, testInt16Array);
	registerType(serializeTypedArray, parseUint8ClampedArray, testUint8ClampedArray);
	registerType(serializeTypedArray, parseUint8Array, testUint8Array);
	registerType(serializeTypedArray, parseInt8Array, testInt8Array);
	registerType(serializeArrayBuffer, parseArrayBuffer, testArrayBuffer);
	registerType(serializeNumber, parseNumber, testNumber);
	registerType(serializeUint32, parseUint32, testUint32);
	registerType(serializeInt32, parseInt32, testInt32);
	registerType(serializeUint16, parseUint16, testUint16);
	registerType(serializeInt16, parseInt16, testInt16);
	registerType(serializeUint8, parseUint8, testUint8);
	registerType(serializeInt8, parseInt8, testInt8);
	registerType(null, parseUndefined, testUndefined);
	registerType(null, parseNull, testNull);
	registerType(null, parseNaN, testNaN);
	registerType(serializeBoolean, parseBoolean, testBoolean);
	registerType(serializeSymbol, parseSymbol, testSymbol);
	registerType(null, parseEmptySlot, testEmptySlot);
	registerType(serializeMap, parseMap, testMap);
	registerType(serializeSet, parseSet, testSet);
	registerType(serializeDate, parseDate, testDate);
	registerType(serializeError, parseError, testError);
	registerType(serializeRegExp, parseRegExp, testRegExp);
	registerType(serializeStringObject, parseStringObject, testStringObject);
	registerType(serializeNumberObject, parseNumberObject, testNumberObject);
	registerType(serializeBooleanObject, parseBooleanObject, testBooleanObject);

	function registerType(serialize, parse, test, type) {
		if (type === undefined) {
			typeIndex++;
			if (types.length - typeIndex >= SPECIAL_TYPES.length) {
				types[types.length - typeIndex] = { serialize, parse, test };
			} else {
				throw new Error("Reached maximum number of custom types");
			}
		} else {
			types[type] = { serialize, parse, test };
		}
	}

	async function parse(array) {
		const parser = getParser();
		await parser.next(array);
		const result = await parser.next();
		return result.value;
	}

	class SerializerData {
		constructor(appendData, chunkSize) {
			this.stream = new WriteStream(appendData, chunkSize);
			this.objects = [];
		}

		append(array) {
			return this.stream.append(array);
		}

		flush() {
			return this.stream.flush();
		}

		addObject(value) {
			this.objects.push(testReferenceable(value) && !testCircularReference(value, this) ? value : undefined);
		}
	}

	class WriteStream {
		constructor(appendData, chunkSize) {
			this.offset = 0;
			this.appendData = appendData;
			this.value = new Uint8Array(chunkSize);
		}

		async append(array) {
			if (this.offset + array.length > this.value.length) {
				const offset = this.value.length - this.offset;
				await this.append(array.subarray(0, offset));
				await this.appendData({ value: this.value });
				this.offset = 0;
				await this.append(array.subarray(offset));
			} else {
				this.value.set(array, this.offset);
				this.offset += array.length;
			}
		}

		async flush() {
			if (this.offset) {
				await this.appendData({ value: this.value.subarray(0, this.offset), done: true });
			}
		}
	}

	function getSerializer(value, { chunkSize = DEFAULT_CHUNK_SIZE } = {}) {
		let serializerData, result, setResult, iterationDone, previousResult, resolvePreviousResult;
		return {
			[Symbol.asyncIterator]() {
				return {
					next() {
						return iterationDone ? { done: iterationDone } : getResult();
					},
					return() {
						return { done: true };
					}
				};
			}
		};

		async function getResult() {
			if (resolvePreviousResult) {
				resolvePreviousResult();
			} else {
				initSerializerData().catch(() => { /* ignored */ });
			}
			initPreviousData();
			const value = await getValue();
			return { value };
		}

		async function initSerializerData() {
			initResult();
			serializerData = new SerializerData(appendData, chunkSize);
			await serializeValue(serializerData, value);
			await serializerData.flush();
		}

		function initResult() {
			result = new Promise(resolve => setResult = resolve);
		}

		function initPreviousData() {
			previousResult = new Promise(resolve => resolvePreviousResult = resolve);
		}

		async function appendData(result) {
			setResult(result);
			await previousResult;
		}

		async function getValue() {
			const { value, done } = await result;
			iterationDone = done;
			if (!done) {
				initResult();
			}
			return value;
		}
	}

	async function serializeValue(data, value) {
		const type = types.findIndex(({ test } = {}) => test && test(value, data));
		data.addObject(value);
		await data.append(new Uint8Array([type]));
		const serialize = types[type].serialize;
		if (serialize) {
			await serialize(data, value);
		}
		if (type != TYPE_REFERENCE && testObject(value)) {
			await serializeSymbols(data, value);
			await serializeOwnProperties(data, value);
		}
	}

	async function serializeSymbols(data, value) {
		const ownPropertySymbols = Object.getOwnPropertySymbols(value);
		const symbols = ownPropertySymbols.map(propertySymbol => [propertySymbol, value[propertySymbol]]);
		await serializeArray(data, symbols);
	}

	async function serializeOwnProperties(data, value) {
		if (!ArrayBuffer.isView(value)) {
			let entries = Object.entries(value);
			if (testArray(value)) {
				entries = entries.filter(([key]) => !testInteger(Number(key)));
			}
			await serializeValue(data, entries.length);
			for (const [key, value] of entries) {
				await serializeString(data, key);
				await serializeValue(data, value);
			}
		} else {
			await serializeValue(data, 0);
		}
	}

	async function serializeCircularReference(data, value) {
		const index = data.objects.indexOf(value);
		await serializeValue(data, index);
	}

	async function serializeArray(data, array) {
		await serializeValue(data, array.length);
		const notEmptyIndexes = Object.keys(array).filter(key => testInteger(Number(key))).map(key => Number(key));
		let indexNotEmptyIndexes = 0, currentNotEmptyIndex = notEmptyIndexes[indexNotEmptyIndexes];
		for (const [indexArray, value] of array.entries()) {
			if (currentNotEmptyIndex == indexArray) {
				currentNotEmptyIndex = notEmptyIndexes[++indexNotEmptyIndexes];
				await serializeValue(data, value);
			} else {
				await serializeValue(data, EMPTY_SLOT_VALUE);
			}
		}
	}

	async function serializeString(data, string) {
		const encodedString = textEncoder.encode(string);
		await serializeValue(data, encodedString.length);
		await data.append(encodedString);
	}

	async function serializeTypedArray(data, array) {
		await serializeValue(data, array.length);
		await data.append(array.constructor.name == "Uint8Array" ? array : new Uint8Array(array.buffer));
	}

	async function serializeArrayBuffer(data, arrayBuffer) {
		await serializeValue(data, arrayBuffer.byteLength);
		await data.append(new Uint8Array(arrayBuffer));
	}

	async function serializeNumber(data, number) {
		const serializedNumber = new Uint8Array(new Float64Array([number]).buffer);
		await data.append(serializedNumber);
	}

	async function serializeUint32(data, number) {
		const serializedNumber = new Uint8Array(new Uint32Array([number]).buffer);
		await data.append(serializedNumber);
	}

	async function serializeInt32(data, number) {
		const serializedNumber = new Uint8Array(new Int32Array([number]).buffer);
		await data.append(serializedNumber);
	}

	async function serializeUint16(data, number) {
		const serializedNumber = new Uint8Array(new Uint16Array([number]).buffer);
		await data.append(serializedNumber);
	}

	async function serializeInt16(data, number) {
		const serializedNumber = new Uint8Array(new Int16Array([number]).buffer);
		await data.append(serializedNumber);
	}

	async function serializeUint8(data, number) {
		const serializedNumber = new Uint8Array([number]);
		await data.append(serializedNumber);
	}

	async function serializeInt8(data, number) {
		const serializedNumber = new Uint8Array(new Int8Array([number]).buffer);
		await data.append(serializedNumber);
	}

	async function serializeBoolean(data, boolean) {
		const serializedBoolean = new Uint8Array([Number(boolean)]);
		await data.append(serializedBoolean);
	}

	async function serializeMap(data, map) {
		const entries = map.entries();
		await serializeValue(data, map.size);
		for (const [key, value] of entries) {
			await serializeValue(data, key);
			await serializeValue(data, value);
		}
	}

	async function serializeSet(data, set) {
		await serializeValue(data, set.size);
		for (const value of set) {
			await serializeValue(data, value);
		}
	}

	async function serializeDate(data, date) {
		await serializeNumber(data, date.getTime());
	}

	async function serializeError(data, error) {
		await serializeString(data, error.message);
		await serializeString(data, error.stack);
	}

	async function serializeRegExp(data, regExp) {
		await serializeString(data, regExp.source);
		await serializeString(data, regExp.flags);
	}

	async function serializeStringObject(data, string) {
		await serializeString(data, string.valueOf());
	}

	async function serializeNumberObject(data, number) {
		await serializeNumber(data, number.valueOf());
	}

	async function serializeBooleanObject(data, boolean) {
		await serializeBoolean(data, boolean.valueOf());
	}

	async function serializeSymbol(data, symbol) {
		await serializeString(data, symbol.description);
	}

	class Reference {
		constructor(index, data) {
			this.index = index;
			this.data = data;
		}

		getObject() {
			return this.data.objects[this.index];
		}
	}

	class ParserData {
		constructor(consumeData) {
			this.stream = new ReadStream(consumeData);
			this.objects = [];
			this.setters = [];
		}

		consume(size) {
			return this.stream.consume(size);
		}

		getObjectId() {
			const objectIndex = this.objects.length;
			this.objects.push(undefined);
			return objectIndex;
		}

		resolveObject(objectId, value) {
			if (testReferenceable(value) && !testReference(value)) {
				this.objects[objectId] = value;
			}
		}

		setObject(functionArguments, setterFunction) {
			this.setters.push({ functionArguments, setterFunction });
		}

		executeSetters() {
			this.setters.forEach(({ functionArguments, setterFunction }) => {
				const resolvedArguments = functionArguments.map(argument => testReference(argument) ? argument.getObject() : argument);
				setterFunction(...resolvedArguments);
			});
		}
	}

	class ReadStream {
		constructor(consumeData) {
			this.offset = 0;
			this.value = new Uint8Array(0);
			this.consumeData = consumeData;
		}

		async consume(size) {
			if (this.offset + size > this.value.length) {
				const pending = this.value.subarray(this.offset, this.value.length);
				const value = await this.consumeData();
				if (pending.length + value.length != this.value.length) {
					this.value = new Uint8Array(pending.length + value.length);
				}
				this.value.set(pending);
				this.value.set(value, pending.length);
				this.offset = 0;
				return this.consume(size);
			} else {
				const result = this.value.slice(this.offset, this.offset + size);
				this.offset += result.length;
				return result;
			}
		}
	}

	function getParser() {
		let parserData, input, setInput, value, previousData, resolvePreviousData;
		return {
			async next(input) {
				return input ? getResult(input) : { value: await value, done: true };
			},
			return() {
				return { done: true };
			}
		};

		async function getResult(input) {
			if (previousData) {
				await previousData;
			} else {
				initParserData().catch(() => { /* ignored */ });
			}
			initPreviousData();
			setInput(input);
			return { done: false };
		}

		async function initParserData() {
			let setValue;
			value = new Promise(resolve => setValue = resolve);
			parserData = new ParserData(consumeData);
			initChunk();
			const data = await parseValue(parserData);
			parserData.executeSetters();
			setValue(data);
		}

		function initChunk() {
			input = new Promise(resolve => setInput = resolve);
		}

		function initPreviousData() {
			previousData = new Promise(resolve => resolvePreviousData = resolve);
		}

		async function consumeData() {
			const data = await input;
			initChunk();
			if (resolvePreviousData) {
				resolvePreviousData();
			}
			return data;
		}
	}

	async function parseValue(data) {
		const array = await data.consume(1);
		const parserType = array[0];
		const parse = types[parserType].parse;
		const valueId = data.getObjectId();
		const result = await parse(data);
		if (parserType != TYPE_REFERENCE && testObject(result)) {
			await parseSymbols(data, result);
			await parseOwnProperties(data, result);
		}
		data.resolveObject(valueId, result);
		return result;
	}

	async function parseSymbols(data, value) {
		const symbols = await parseArray(data);
		data.setObject([symbols], symbols => symbols.forEach(([symbol, propertyValue]) => value[symbol] = propertyValue));
	}

	async function parseOwnProperties(data, object) {
		const size = await parseValue(data);
		if (size) {
			await parseNextProperty();
		}

		async function parseNextProperty(indexKey = 0) {
			const key = await parseString(data);
			const value = await parseValue(data);
			data.setObject([value], value => object[key] = value);
			if (indexKey < size - 1) {
				await parseNextProperty(indexKey + 1);
			}
		}
	}

	async function parseCircularReference(data) {
		const index = await parseValue(data);
		const result = new Reference(index, data);
		return result;
	}

	function parseObject() {
		return {};
	}

	async function parseArray(data) {
		const length = await parseValue(data);
		const array = new Array(length);
		if (length) {
			await parseNextSlot();
		}
		return array;

		async function parseNextSlot(indexArray = 0) {
			const value = await parseValue(data);
			if (!testEmptySlot(value)) {
				data.setObject([value], value => array[indexArray] = value);
			}
			if (indexArray < length - 1) {
				await parseNextSlot(indexArray + 1);
			}
		}
	}

	function parseEmptySlot() {
		return EMPTY_SLOT_VALUE;
	}

	async function parseString(data) {
		const size = await parseValue(data);
		const array = await data.consume(size);
		return textDecoder.decode(array);
	}

	async function parseFloat64Array(data) {
		const length = await parseValue(data);
		const array = await data.consume(length * 8);
		return new Float64Array(array.buffer);
	}

	async function parseFloat32Array(data) {
		const length = await parseValue(data);
		const array = await data.consume(length * 4);
		return new Float32Array(array.buffer);
	}

	async function parseUint32Array(data) {
		const length = await parseValue(data);
		const array = await data.consume(length * 4);
		return new Uint32Array(array.buffer);
	}

	async function parseInt32Array(data) {
		const length = await parseValue(data);
		const array = await data.consume(length * 4);
		return new Int32Array(array.buffer);
	}

	async function parseUint16Array(data) {
		const length = await parseValue(data);
		const array = await data.consume(length * 2);
		return new Uint16Array(array.buffer);
	}

	async function parseInt16Array(data) {
		const length = await parseValue(data);
		const array = await data.consume(length * 2);
		return new Int16Array(array.buffer);
	}

	async function parseUint8ClampedArray(data) {
		const length = await parseValue(data);
		const array = await data.consume(length);
		return new Uint8ClampedArray(array.buffer);
	}

	async function parseUint8Array(data) {
		const length = await parseValue(data);
		const array = await data.consume(length);
		return array;
	}

	async function parseInt8Array(data) {
		const length = await parseValue(data);
		const array = await data.consume(length);
		return new Int8Array(array.buffer);
	}

	async function parseArrayBuffer(data) {
		const length = await parseValue(data);
		const array = await data.consume(length);
		return array.buffer;
	}

	async function parseNumber(data) {
		const array = await data.consume(8);
		return new Float64Array(array.buffer)[0];
	}

	async function parseUint32(data) {
		const array = await data.consume(4);
		return new Uint32Array(array.buffer)[0];
	}

	async function parseInt32(data) {
		const array = await data.consume(4);
		return new Int32Array(array.buffer)[0];
	}

	async function parseUint16(data) {
		const array = await data.consume(2);
		return new Uint16Array(array.buffer)[0];
	}

	async function parseInt16(data) {
		const array = await data.consume(2);
		return new Int16Array(array.buffer)[0];
	}

	async function parseUint8(data) {
		const array = await data.consume(1);
		return new Uint8Array(array.buffer)[0];
	}

	async function parseInt8(data) {
		const array = await data.consume(1);
		return new Int8Array(array.buffer)[0];
	}

	function parseUndefined() {
		return undefined;
	}

	function parseNull() {
		return null;
	}

	function parseNaN() {
		return NaN;
	}

	async function parseBoolean(data) {
		const array = await data.consume(1);
		return Boolean(array[0]);
	}

	async function parseMap(data) {
		const size = await parseValue(data);
		const map = new Map();
		if (size) {
			await parseNextEntry();
		}
		return map;

		async function parseNextEntry(indexKey = 0) {
			const key = await parseValue(data);
			const value = await parseValue(data);
			data.setObject([key, value], (key, value) => map.set(key, value));
			if (indexKey < size - 1) {
				await parseNextEntry(indexKey + 1);
			}
		}
	}

	async function parseSet(data) {
		const size = await parseValue(data);
		const set = new Set();
		if (size) {
			await parseNextEntry();
		}
		return set;

		async function parseNextEntry(indexKey = 0) {
			const value = await parseValue(data);
			data.setObject([value], value => set.add(value));
			if (indexKey < size - 1) {
				await parseNextEntry(indexKey + 1);
			}
		}
	}

	async function parseDate(data) {
		const milliseconds = await parseNumber(data);
		return new Date(milliseconds);
	}

	async function parseError(data) {
		const message = await parseString(data);
		const stack = await parseString(data);
		const error = new Error(message);
		error.stack = stack;
		return error;
	}

	async function parseRegExp(data) {
		const source = await parseString(data);
		const flags = await parseString(data);
		return new RegExp(source, flags);
	}

	async function parseStringObject(data) {
		return new String(await parseString(data));
	}

	async function parseNumberObject(data) {
		return new Number(await parseNumber(data));
	}

	async function parseBooleanObject(data) {
		return new Boolean(await parseBoolean(data));
	}

	async function parseSymbol(data) {
		const description = await parseString(data);
		return Symbol(description);
	}

	function testCircularReference(value, data) {
		return testObject(value) && data.objects.includes(value);
	}

	function testReference(value) {
		return value instanceof Reference;
	}

	function testObject(value) {
		return value === Object(value);
	}

	function testArray(value) {
		return typeof value.length == "number";
	}

	function testEmptySlot(value) {
		return value === EMPTY_SLOT_VALUE;
	}

	function testString(value) {
		return typeof value == "string";
	}

	function testFloat64Array(value) {
		return value.constructor.name == "Float64Array";
	}

	function testUint32Array(value) {
		return value.constructor.name == "Uint32Array";
	}

	function testInt32Array(value) {
		return value.constructor.name == "Int32Array";
	}

	function testUint16Array(value) {
		return value.constructor.name == "Uint16Array";
	}

	function testFloat32Array(value) {
		return value.constructor.name == "Float32Array";
	}

	function testInt16Array(value) {
		return value.constructor.name == "Int16Array";
	}

	function testUint8ClampedArray(value) {
		return value.constructor.name == "Uint8ClampedArray";
	}

	function testUint8Array(value) {
		return value.constructor.name == "Uint8Array";
	}

	function testInt8Array(value) {
		return value.constructor.name == "Int8Array";
	}

	function testArrayBuffer(value) {
		return value.constructor.name == "ArrayBuffer";
	}

	function testNumber(value) {
		return typeof value == "number";
	}

	function testUint32(value) {
		return testInteger(value) && value >= 0 && value <= 4294967295;
	}

	function testInt32(value) {
		return testInteger(value) && value >= -2147483648 && value <= 2147483647;
	}

	function testUint16(value) {
		return testInteger(value) && value >= 0 && value <= 65535;
	}

	function testInt16(value) {
		return testInteger(value) && value >= -32768 && value <= 32767;
	}

	function testUint8(value) {
		return testInteger(value) && value >= 0 && value <= 255;
	}

	function testInt8(value) {
		return testInteger(value) && value >= -128 && value <= 127;
	}

	function testInteger(value) {
		return testNumber(value) && Number.isInteger(value);
	}

	function testUndefined(value) {
		return value === undefined;
	}

	function testNull(value) {
		return value === null;
	}

	function testNaN(value) {
		return Number.isNaN(value);
	}

	function testBoolean(value) {
		return typeof value == "boolean";
	}

	function testMap(value) {
		return value instanceof Map;
	}

	function testSet(value) {
		return value instanceof Set;
	}

	function testDate(value) {
		return value instanceof Date;
	}

	function testError(value) {
		return value instanceof Error;
	}

	function testRegExp(value) {
		return value instanceof RegExp;
	}

	function testStringObject(value) {
		return value instanceof String;
	}

	function testNumberObject(value) {
		return value instanceof Number;
	}

	function testBooleanObject(value) {
		return value instanceof Boolean;
	}

	function testSymbol(value) {
		return typeof value == "symbol";
	}

	function testReferenceable(value) {
		return testObject(value) || testSymbol(value);
	}

	/*
	 * Copyright 2010-2024 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * author: gildas.lormeau <at> gmail.com
	 * author: dcardin2007 <at> gmail.com
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

	/* global fetch, btoa, Blob, FileReader, AbortController */

	const AUTHORIZATION_HEADER = "Authorization";
	const BEARER_PREFIX_AUTHORIZATION = "Bearer ";
	const ACCEPT_HEADER = "Accept";
	const CONTENT_TYPE = "multipart/form-data";

	class RestFormApi {
		constructor(token, restApiUrl, fileFieldName, urlFieldName) {
			this.headers = new Map([
				[AUTHORIZATION_HEADER, BEARER_PREFIX_AUTHORIZATION + token],
				[ACCEPT_HEADER, CONTENT_TYPE]
			]);
			this.restApiUrl = restApiUrl;
			this.fileFieldName = fileFieldName;
			this.urlFieldName = urlFieldName;
		}

		async upload(content, url) {

			this.controller = new AbortController();
			try{
				const blob = new Blob([content], { type: 'text/html'});
				const file = new File([blob], "SingleFile.html", { type: 'text/html' });
				let formData = new FormData();
				if(this.fileFieldName){
					formData.append(this.fileFieldName, file);
				}
				if(this.urlFieldName){
					formData.append(this.urlFieldName, url);
				}
				const response = await fetch(this.restApiUrl, {
					method: 'POST',
					body: formData,
					headers: this.headers,
					signal: this.controller.signal
				});
				if ([200,201].includes(response.status)) {
					// do something with the data?
					const data = await response.json();
				} else {
					throw new Error(await response.text());
				}
			}
			catch(e){
				throw new Error(e);
			}
		}

		abort() {
			if (this.controller) {
				this.controller.abort();
			}
		}
	}

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

	const partialContents = new Map();
	const tabData = new Map();
	const SCOPES = ["https://www.googleapis.com/auth/drive.file"];
	const CONFLICT_ACTION_SKIP = "skip";
	const CONFLICT_ACTION_UNIQUIFY = "uniquify";
	const REGEXP_ESCAPE = /([{}()^$&.*?/+|[\\\\]|\]|-)/g;
	let GDRIVE_CLIENT_ID = "207618107333-h1220p1oasj3050kr5r416661adm091a.apps.googleusercontent.com";
	let GDRIVE_CLIENT_KEY = "VQJ8Gq8Vxx72QyxPyeLtWvUt";
	const DROPBOX_CLIENT_ID = "s50p6litdvuzrtb";
	const DROPBOX_CLIENT_KEY = "i1vzwllesr14fzd";

	const gDriveOauth2 = browser.runtime.getManifest().oauth2;
	if (gDriveOauth2) {
		GDRIVE_CLIENT_ID = gDriveOauth2.client_id;
		GDRIVE_CLIENT_KEY = gDriveOauth2.client_secret;
	}
	const gDrive = new GDrive(GDRIVE_CLIENT_ID, GDRIVE_CLIENT_KEY, SCOPES);
	const dropbox = new Dropbox(DROPBOX_CLIENT_ID, DROPBOX_CLIENT_KEY);

	async function onMessage$4(message, sender) {
		if (message.method.endsWith(".download")) {
			return downloadTabPage(message, sender.tab);
		}
		if (message.method.endsWith(".disableGDrive")) {
			const authInfo = await getAuthInfo$1();
			removeAuthInfo();
			await gDrive.revokeAuthToken(authInfo && (authInfo.accessToken || authInfo.revokableAccessToken));
			return {};
		}
		if (message.method.endsWith(".disableDropbox")) {
			const authInfo = await getDropboxAuthInfo$1();
			removeDropboxAuthInfo();
			await dropbox.revokeAuthToken(authInfo && (authInfo.accessToken || authInfo.revokableAccessToken));
			return {};
		}
		if (message.method.endsWith(".end")) {
			if (message.hash) {
				try {
					await anchor(message.hash, message.woleetKey);
				} catch (error) {
					onError(sender.tab.id, error.message, error.link);
				}
			}
			onSaveEnd(message.taskId);
			return {};
		}
		if (message.method.endsWith(".getInfo")) {
			return getTasksInfo();
		}
		if (message.method.endsWith(".cancel")) {
			cancelTask(message.taskId);
			return {};
		}
		if (message.method.endsWith(".cancelAll")) {
			cancelAllTasks();
			return {};
		}
		if (message.method.endsWith(".saveUrls")) {
			saveUrls(message.urls);
			return {};
		}
	}

	async function downloadTabPage(message, tab) {
		const tabId = tab.id;
		let contents;
		if (message.blobURL) {
			try {
				if (message.compressContent) {
					message.pageData = await parse(new Uint8Array(await (await fetch(message.blobURL)).arrayBuffer()));
					await downloadCompressedContent(message, tab);
				} else {
					message.content = await (await fetch(message.blobURL)).text();
					await downloadContent([message.content], tab, tab.incognito, message);
				}
			} catch (error) {
				return { error: true };
			}
		} else if (message.compressContent) {
			let blobParts = tabData.get(tabId);
			const type = message.mimeType;
			if (!blobParts) {
				blobParts = [];
				tabData.set(tabId, blobParts);
			}
			if (message.data) {
				blobParts.push(new Uint8Array(message.data));
			} else {
				tabData.delete(tabId);
				const message = await parse(new Uint8Array((await new Blob(blobParts, { type }).arrayBuffer())));
				await downloadCompressedContent(message, tab);
			}
		} else {
			if (message.truncated) {
				contents = partialContents.get(tabId);
				if (!contents) {
					contents = [];
					partialContents.set(tabId, contents);
				}
				contents.push(message.content);
				if (message.finished) {
					partialContents.delete(tabId);
				}
			} else if (message.content) {
				contents = [message.content];
			}
			if (!message.truncated || message.finished) {
				await downloadContent(contents, tab, tab.incognito, message);
			}
		}
		return {};
	}

	async function downloadContent(contents, tab, incognito, message) {
		const tabId = tab.id;
		try {
			let skipped;
			if (message.backgroundSave && !message.saveToGDrive && !message.saveToDropbox && !message.saveWithWebDAV && !message.saveToGitHub && !message.saveToRestFormApi) {
				const testSkip = await testSkipSave(message.filename, message);
				message.filenameConflictAction = testSkip.filenameConflictAction;
				skipped = testSkip.skipped;
			}
			if (skipped) {
				onEnd(tabId);
			} else {
				const prompt = filename => promptFilename(tabId, filename);
				let response;
				if (message.openEditor) {
					onEdit(tabId);
					await open({ tabIndex: tab.index + 1, filename: message.filename, content: contents.join("") });
				} else if (message.saveToClipboard) {
					message.content = contents.join("");
					saveToClipboard(message);
				} else if (message.saveWithWebDAV) {
					response = await saveWithWebDAV(message.taskId, encodeSharpCharacter(message.filename), contents.join(""), message.webDAVURL, message.webDAVUser, message.webDAVPassword, { filenameConflictAction: message.filenameConflictAction, prompt });
				} else if (message.saveToGDrive) {
					await saveToGDrive(message.taskId, encodeSharpCharacter(message.filename), new Blob(contents, { type: message.mimeType }), {
						forceWebAuthFlow: message.forceWebAuthFlow
					}, {
						onProgress: (offset, size) => onUploadProgress(tabId, offset, size),
						filenameConflictAction: message.filenameConflictAction,
						prompt
					});
				} else if (message.saveToDropbox) {
					await saveToDropbox(message.taskId, encodeSharpCharacter(message.filename), new Blob(contents, { type: message.mimeType }), {
						onProgress: (offset, size) => onUploadProgress(tabId, offset, size),
						filenameConflictAction: message.filenameConflictAction,
						prompt
					});
				} else if (message.saveToGitHub) {
					response = await saveToGitHub(message.taskId, encodeSharpCharacter(message.filename), contents.join(""), message.githubToken, message.githubUser, message.githubRepository, message.githubBranch, {
						filenameConflictAction: message.filenameConflictAction,
						prompt
					});
					await response.pushPromise;
				} else if (message.saveWithCompanion) {
					await save({
						filename: message.filename,
						content: message.content,
						filenameConflictAction: message.filenameConflictAction
					});
				} else if (message.saveToRestFormApi) {
					response = await saveToRestFormApi(
						message.taskId,
						contents.join(""),
						tab.url,
						message.saveToRestFormApiToken,
						message.saveToRestFormApiUrl,
						message.saveToRestFormApiFileFieldName,
						message.saveToRestFormApiUrlFieldName
					);
				} else {
					message.url = URL.createObjectURL(new Blob(contents, { type: message.mimeType }));
					response = await downloadPage(message, {
						confirmFilename: message.confirmFilename,
						incognito,
						filenameConflictAction: message.filenameConflictAction,
						filenameReplacementCharacter: message.filenameReplacementCharacter,
						bookmarkId: message.bookmarkId,
						replaceBookmarkURL: message.replaceBookmarkURL,
						includeInfobar: message.includeInfobar
					});
				}
				if (message.bookmarkId && message.replaceBookmarkURL && response && response.url) {
					await update(message.bookmarkId, { url: response.url });
				}
				onEnd(tabId);
				if (message.openSavedPage && !message.openEditor) {
					const createTabProperties = { active: true, url: "/src/ui/pages/viewer.html?blobURI=" + URL.createObjectURL(new Blob(contents, { type: message.mimeType })), windowId: tab.windowId };
					if (tab.index != null) {
						createTabProperties.index = tab.index + 1;
					}
					browser.tabs.create(createTabProperties);
				}
			}
		} catch (error) {
			if (!error.message || error.message != "upload_cancelled") {
				console.error(error); // eslint-disable-line no-console
				onError(tabId, error.message, error.link);
			}
		} finally {
			if (message.url) {
				URL.revokeObjectURL(message.url);
			}
		}
	}

	async function downloadCompressedContent(message, tab) {
		const tabId = tab.id;
		try {
			let skipped;
			if (message.backgroundSave && !message.saveToGDrive && !message.saveToDropbox && !message.saveWithWebDAV && !message.saveToGitHub && !message.sharePage) {
				const testSkip = await testSkipSave(message.filename, message);
				message.filenameConflictAction = testSkip.filenameConflictAction;
				skipped = testSkip.skipped;
			}
			if (skipped) {
				onEnd(tabId);
			} else {
				const pageData = message.pageData;
				const prompt = filename => promptFilename(tabId, filename);
				const blob = await singlefile.processors.compression.process(pageData, {
					insertTextBody: message.insertTextBody,
					url: pageData.url || tab.url,
					createRootDirectory: message.createRootDirectory,
					tabId,
					selfExtractingArchive: message.selfExtractingArchive,
					extractDataFromPage: message.extractDataFromPage,
					preventAppendedData: message.preventAppendedData,
					insertCanonicalLink: message.insertCanonicalLink,
					insertMetaNoIndex: message.insertMetaNoIndex,
					insertMetaCSP: message.insertMetaCSP,
					password: message.password,
					embeddedImage: message.embeddedImage
				});
				let response;
				if (message.openEditor) {
					onEdit(tabId);
					await open({
						tabIndex: tab.index + 1,
						filename: message.filename,
						content: Array.from(new Uint8Array(await blob.arrayBuffer())),
						compressContent: message.compressContent,
						selfExtractingArchive: message.selfExtractingArchive,
						extractDataFromPage: message.extractDataFromPage,
						insertTextBody: message.insertTextBody,
						insertMetaCSP: message.insertMetaCSP,
						embeddedImage: message.embeddedImage
					});
				} else if (message.foregroundSave || !message.backgroundSave || message.sharePage) {
					const response = await downloadPageForeground(message.taskId, message.filename, blob, pageData.mimeType, tabId, {
						foregroundSave: true,
						sharePage: message.sharePage
					});
					if (response.error) {
						throw new Error(response.error);
					}
				} else if (message.saveWithWebDAV) {
					response = await saveWithWebDAV(message.taskId, encodeSharpCharacter(message.filename), blob, message.webDAVURL, message.webDAVUser, message.webDAVPassword, { filenameConflictAction: message.filenameConflictAction, prompt });
				} else if (message.saveToGDrive) {
					await saveToGDrive(message.taskId, encodeSharpCharacter(message.filename), blob, {
						forceWebAuthFlow: message.forceWebAuthFlow
					}, {
						onProgress: (offset, size) => onUploadProgress(tabId, offset, size),
						filenameConflictAction: message.filenameConflictAction,
						prompt
					});
				} else if (message.saveToDropbox) {
					await saveToDropbox(message.taskId, encodeSharpCharacter(message.filename), blob, {
						onProgress: (offset, size) => onUploadProgress(tabId, offset, size),
						filenameConflictAction: message.filenameConflictAction,
						prompt
					});
				} else if (message.saveToGitHub) {
					response = await saveToGitHub(message.taskId, encodeSharpCharacter(message.filename), blob, message.githubToken, message.githubUser, message.githubRepository, message.githubBranch, {
						filenameConflictAction: message.filenameConflictAction,
						prompt
					});
					await response.pushPromise;
				} else {
					message.url = URL.createObjectURL(blob);
					response = await downloadPage(message, {
						confirmFilename: message.confirmFilename,
						incognito: tab.incognito,
						filenameConflictAction: message.filenameConflictAction,
						filenameReplacementCharacter: message.filenameReplacementCharacter,
						bookmarkId: message.bookmarkId,
						replaceBookmarkURL: message.replaceBookmarkURL,
						includeInfobar: message.includeInfobar
					});
				}
				if (message.bookmarkId && message.replaceBookmarkURL && response && response.url) {
					await update(message.bookmarkId, { url: response.url });
				}
				onEnd(tabId);
				if (message.openSavedPage && !message.openEditor) {
					const createTabProperties = { active: true, url: "/src/ui/pages/viewer.html?compressed&blobURI=" + URL.createObjectURL(blob), windowId: tab.windowId };
					if (tab.index != null) {
						createTabProperties.index = tab.index + 1;
					}
					browser.tabs.create(createTabProperties);
				}
			}
		} catch (error) {
			if (!error.message || error.message != "upload_cancelled") {
				console.error(error); // eslint-disable-line no-console
				onError(tabId, error.message, error.link);
			}
		} finally {
			if (message.url) {
				URL.revokeObjectURL(message.url);
			}
		}
	}

	function encodeSharpCharacter(path) {
		return path.replace(/#/g, "%23");
	}

	function getRegExp(string) {
		return string.replace(REGEXP_ESCAPE, "\\$1");
	}

	async function getAuthInfo(authOptions, force) {
		let authInfo = await getAuthInfo$1();
		const options = {
			interactive: true,
			forceWebAuthFlow: authOptions.forceWebAuthFlow,
			launchWebAuthFlow: options => launchWebAuthFlow(options),
			extractAuthCode: authURL => extractAuthCode(authURL)
		};
		gDrive.setAuthInfo(authInfo, options);
		if (!authInfo || !authInfo.accessToken || force) {
			authInfo = await gDrive.auth(options);
			if (authInfo) {
				await setAuthInfo(authInfo);
			} else {
				await removeAuthInfo();
			}
		}
		return authInfo;
	}

	async function getDropboxAuthInfo(force) {
		let authInfo = await getDropboxAuthInfo$1();
		const options = {
			launchWebAuthFlow: options => launchWebAuthFlow(options),
			extractAuthCode: authURL => extractAuthCode(authURL)
		};
		dropbox.setAuthInfo(authInfo);
		if (!authInfo || !authInfo.accessToken || force) {
			authInfo = await dropbox.auth(options);
			if (authInfo) {
				await setDropboxAuthInfo(authInfo);
			} else {
				await removeDropboxAuthInfo();
			}
		}
		return authInfo;
	}

	async function saveToGitHub(taskId, filename, content, githubToken, githubUser, githubRepository, githubBranch, { filenameConflictAction, prompt }) {
		try {
			const taskInfo = getTaskInfo(taskId);
			if (!taskInfo || !taskInfo.cancelled) {
				const client = new GitHub(githubToken, githubUser, githubRepository, githubBranch);
				setCancelCallback(taskId, () => client.abort());
				return await client.upload(filename, content, { filenameConflictAction, prompt });
			}
		} catch (error) {
			throw new Error(error.message + " (GitHub)");
		}
	}

	async function saveWithWebDAV(taskId, filename, content, url, username, password, { filenameConflictAction, prompt }) {
		try {
			const taskInfo = getTaskInfo(taskId);
			if (!taskInfo || !taskInfo.cancelled) {
				const client = new WebDAV(url, username, password);
				setCancelCallback(taskId, () => client.abort());
				return await client.upload(filename, content, { filenameConflictAction, prompt });
			}
		} catch (error) {
			throw new Error(error.message + " (WebDAV)");
		}
	}

	async function saveToGDrive(taskId, filename, blob, authOptions, uploadOptions) {
		try {
			await getAuthInfo(authOptions);
			const taskInfo = getTaskInfo(taskId);
			if (!taskInfo || !taskInfo.cancelled) {
				return await gDrive.upload(filename, blob, uploadOptions, callback => setCancelCallback(taskId, callback));
			}
		}
		catch (error) {
			if (error.message == "invalid_token") {
				let authInfo;
				try {
					authInfo = await gDrive.refreshAuthToken();
				} catch (error) {
					if (error.message == "unknown_token") {
						authInfo = await getAuthInfo(authOptions, true);
					} else {
						throw new Error(error.message + " (Google Drive)");
					}
				}
				if (authInfo) {
					await setAuthInfo(authInfo);
				} else {
					await removeAuthInfo();
				}
				return await saveToGDrive(taskId, filename, blob, authOptions, uploadOptions);
			} else {
				throw new Error(error.message + " (Google Drive)");
			}
		}
	}

	async function saveToDropbox(taskId, filename, blob, uploadOptions) {
		try {
			await getDropboxAuthInfo();
			const taskInfo = getTaskInfo(taskId);
			if (!taskInfo || !taskInfo.cancelled) {
				return await dropbox.upload(filename, blob, uploadOptions, callback => setCancelCallback(taskId, callback));
			}
		}
		catch (error) {
			if (error.message == "invalid_token") {
				let authInfo;
				try {
					authInfo = await dropbox.refreshAuthToken();
				} catch (error) {
					if (error.message == "unknown_token") {
						authInfo = await getDropboxAuthInfo(true);
					} else {
						throw new Error(error.message + " (Dropbox)");
					}
				}
				if (authInfo) {
					await setDropboxAuthInfo(authInfo);
				} else {
					await removeDropboxAuthInfo();
				}
				return await saveToDropbox(taskId, filename, blob, uploadOptions);
			} else {
				throw new Error(error.message + " (Dropbox)");
			}
		}
	}

	async function testSkipSave(filename, options) {
		let skipped, filenameConflictAction = options.filenameConflictAction;
		if (filenameConflictAction == CONFLICT_ACTION_SKIP) {
			const downloadItems = await browser.downloads.search({
				filenameRegex: "(\\\\|/)" + getRegExp(filename) + "$",
				exists: true
			});
			if (downloadItems.length) {
				skipped = true;
			} else {
				filenameConflictAction = CONFLICT_ACTION_UNIQUIFY;
			}
		}
		return { skipped, filenameConflictAction };
	}

	function promptFilename(tabId, filename) {
		return browser.tabs.sendMessage(tabId, { method: "content.prompt", message: "Filename conflict, please enter a new filename", value: filename });
	}

	async function downloadPage(pageData, options) {
		const downloadInfo = {
			url: pageData.url,
			saveAs: options.confirmFilename,
			filename: pageData.filename,
			conflictAction: options.filenameConflictAction
		};
		if (options.incognito) {
			downloadInfo.incognito = true;
		}
		const downloadData = await download(downloadInfo, options.filenameReplacementCharacter);
		if (downloadData.filename) {
			let url = downloadData.filename;
			if (!url.startsWith("file:")) {
				if (url.startsWith("/")) {
					url = url.substring(1);
				}
				url = "file:///" + encodeSharpCharacter(url);
			}
			return { url };
		}
	}

	function saveToClipboard(pageData) {
		const command = "copy";
		document.addEventListener(command, listener);
		document.execCommand(command);
		document.removeEventListener(command, listener);

		function listener(event) {
			event.clipboardData.setData(pageData.mimeType, pageData.content);
			event.clipboardData.setData("text/plain", pageData.content);
			event.preventDefault();
		}
	}

	async function saveToRestFormApi(taskId, content, url, token, restApiUrl, fileFieldName, urlFieldName) {
		try {
			const taskInfo = getTaskInfo(taskId);
			if (!taskInfo || !taskInfo.cancelled) {
				const client = new RestFormApi(token, restApiUrl, fileFieldName, urlFieldName);
				setCancelCallback(taskId, () => client.abort());
				return await client.upload(content, url);
			}
		} catch (error) {
			throw new Error(error.message + " (RestFormApi)");
		}
	}

	async function downloadPageForeground(taskId, filename, content, mimeType, tabId, { foregroundSave, sharePage }) {
		const serializer = getSerializer({
			filename,
			taskId,
			foregroundSave,
			sharePage,
			content: await content.arrayBuffer(),
			mimeType
		});
		for await (const data of serializer) {
			await browser.tabs.sendMessage(tabId, {
				method: "content.download",
				data: Array.from(data)
			});
		}
		return browser.tabs.sendMessage(tabId, { method: "content.download" });
	}

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

	const pendingMessages = {};
	const replacedTabIds = {};

	async function onMessage$3(message, sender) {
		if (message.method.endsWith(".save")) {
			if (message.autoSaveDiscard || message.autoSaveRemove) {
				if (sender.tab) {
					message.tab = sender.tab;
					pendingMessages[sender.tab.id] = message;
				} else if (pendingMessages[message.tabId] &&
					((pendingMessages[message.tabId].removed && message.autoSaveRemove) ||
						(pendingMessages[message.tabId].discarded && message.autoSaveDiscard))
				) {
					delete pendingMessages[message.tabId];
					await saveContent(message, { id: message.tabId, index: message.tabIndex, url: sender.url });
				}
				if (message.autoSaveUnload) {
					delete pendingMessages[message.tabId];
					await saveContent(message, sender.tab);
				}
			} else {
				delete pendingMessages[message.tabId];
				await saveContent(message, sender.tab);
			}
			return {};
		}
	}

	function onTabUpdated$1(tabId) {
		delete pendingMessages[tabId];
	}

	async function onTabRemoved$1(tabId) {
		const message = pendingMessages[tabId];
		if (message) {
			if (message.autoSaveRemove) {
				delete pendingMessages[tabId];
				await saveContent(message, message.tab);
			}
		} else {
			pendingMessages[tabId] = { removed: true };
		}
	}

	async function onTabDiscarded(tabId) {
		const message = pendingMessages[tabId];
		if (message) {
			delete pendingMessages[tabId];
			await saveContent(message, message.tab);
		} else {
			pendingMessages[tabId] = { discarded: true };
		}
	}

	async function onTabReplaced$1(addedTabId, removedTabId) {
		if (pendingMessages[removedTabId] && !pendingMessages[addedTabId]) {
			pendingMessages[addedTabId] = pendingMessages[removedTabId];
			delete pendingMessages[removedTabId];
			replacedTabIds[removedTabId] = addedTabId;
		}
	}

	async function onMessageExternal(message, currentTab) {
		if (message.method == "enableAutoSave") {
			const allTabsData = await getPersistent(currentTab.id);
			allTabsData[currentTab.id].autoSave = message.enabled;
			await setPersistent(allTabsData);
			refreshTab(currentTab);
		}
		if (message.method == "isAutoSaveEnabled") {
			return autoSaveIsEnabled(currentTab);
		}
	}

	async function onInit$1(tab) {
		const [options, autoSaveEnabled] = await Promise.all([getOptions(tab.url, true), autoSaveIsEnabled(tab)]);
		if (options && ((options.autoSaveLoad || options.autoSaveLoadOrUnload) && autoSaveEnabled)) {
			saveTabs([tab], { autoSave: true });
		}
	}

	async function saveContent(message, tab) {
		const tabId = tab.id;
		const options = await getOptions(tab.url, true);
		if (options) {
			onStart(tabId, 1, true);
			options.content = message.content;
			options.url = message.url;
			options.frames = message.frames;
			options.canvases = message.canvases;
			options.fonts = message.fonts;
			options.stylesheets = message.stylesheets;
			options.images = message.images;
			options.posters = message.posters;
			options.videos = message.videos;
			options.usedFonts = message.usedFonts;
			options.shadowRoots = message.shadowRoots;
			options.referrer = message.referrer;
			options.updatedResources = message.updatedResources;
			options.adoptedStyleSheets = message.adoptedStyleSheets;
			options.visitDate = new Date(message.visitDate);
			options.backgroundTab = true;
			options.autoSave = true;
			options.incognito = tab.incognito;
			options.tabId = tabId;
			options.tabIndex = tab.index;
			options.keepFilename = options.saveToGDrive || options.saveToGitHub || options.saveWithWebDAV || options.saveToDropbox || options.saveToRestFormApi;
			let pageData;
			try {
				if (options.autoSaveExternalSave) {
					await externalSave(options);
				} else {
					if (options.passReferrerOnError) {
						enableReferrerOnError();
					}
					options.tabId = tabId;
					pageData = await getPageData(options, null, null, { fetch: fetch$1 });
					let skipped;
					if (!options.saveToGDrive && !options.saveWithWebDAV && !options.saveToGitHub && !options.saveToDropbox && !options.saveWithCompanion && !options.saveToRestFormApi) {
						const testSkip = await testSkipSave(pageData.filename, options);
						skipped = testSkip.skipped;
						options.filenameConflictAction = testSkip.filenameConflictAction;
					}
					if (!skipped) {
						let { content, mimeType: type } = pageData;
						if (options.compressContent) {
							content = new Blob([new Uint8Array(content)], { type });
						}
						if (options.saveToGDrive) {
							if (!(content instanceof Blob)) {
								content = new Blob([content], { type });
							}
							await saveToGDrive(message.taskId, encodeSharpCharacter(pageData.filename), content, options, {
								forceWebAuthFlow: options.forceWebAuthFlow
							}, {
								filenameConflictAction: options.filenameConflictAction
							});
						} if (options.saveToDropbox) {
							if (!(content instanceof Blob)) {
								content = new Blob([content], { type });
							}
							await saveToDropbox(message.taskId, encodeSharpCharacter(pageData.filename), content, {
								filenameConflictAction: options.filenameConflictAction
							});
						} else if (options.saveWithWebDAV) {
							await saveWithWebDAV(message.taskId, encodeSharpCharacter(pageData.filename), content, options.webDAVURL, options.webDAVUser, options.webDAVPassword, {
								filenameConflictAction: options.filenameConflictAction
							});
						} else if (options.saveToGitHub) {
							await (await saveToGitHub(message.taskId, encodeSharpCharacter(pageData.filename), content, options.githubToken, options.githubUser, options.githubRepository, options.githubBranch, {
								filenameConflictAction: options.filenameConflictAction
							})).pushPromise;
						} else if (options.saveWithCompanion && !options.compressContent) {
							await save({
								filename: pageData.filename,
								content: pageData.content,
								filenameConflictAction: options.filenameConflictAction
							});
						} else if (options.saveToRestFormApi) {
							await saveToRestFormApi(
								message.taskId,
								content,
								pageData.url,
								options.restFormApiToken,
								options.restFormApiUrl,
								options.restFormApiFileFieldName,
								options.restFormApiUrlFieldName
							);
						} else {
							if (!(content instanceof Blob)) {
								content = new Blob([content], { type });
							}
							pageData.url = URL.createObjectURL(content);
							await downloadPage(pageData, options);
						}
						if (options.openSavedPage) {
							const createTabProperties = { active: true, url: "/src/ui/pages/viewer.html?compressed=true&blobURI=" + URL.createObjectURL(content), windowId: tab.windowId };
							const index = tab.index;
							try {
								await browser.tabs.get(tabId);
								createTabProperties.index = index + 1;
							} catch (error) {
								createTabProperties.index = index;
							}
							browser.tabs.create(createTabProperties);
						}
						if (pageData.hash) {
							await anchor(pageData.hash, options.woleetKey);
						}
					}
				}
			} finally {
				if (message.taskId) {
					onSaveEnd(message.taskId);
				} else if (options.autoClose) {
					browser.tabs.remove(replacedTabIds[tabId] || tabId);
					delete replacedTabIds[tabId];
				}
				if (pageData && pageData.url) {
					URL.revokeObjectURL(pageData.url);
				}
				onEnd(tabId, true);
			}
		}
	}

	async function fetch$1(url, options = {}) {
		const response = await fetchResource$1(url, options);
		return {
			status: response.status,
			headers: {
				get: name => response.headers.get(name)
			},
			arrayBuffer: () => response.arrayBuffer
		};
	}

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

	async function onMessage$2(message) {
		if (message.method.endsWith(".resourceCommitted")) {
			if (message.tabId && message.url && (message.type == "stylesheet" || message.type == "script")) {
				await browser.tabs.sendMessage(message.tabId, message);
			}
		}
	}

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

	const DELAY_MAYBE_INIT = 1500;

	browser.tabs.onCreated.addListener(tab => onTabCreated(tab));
	browser.tabs.onActivated.addListener(activeInfo => onTabActivated(activeInfo));
	browser.tabs.onRemoved.addListener(tabId => onTabRemoved(tabId));
	browser.tabs.onUpdated.addListener((tabId, changeInfo) => onTabUpdated(tabId, changeInfo));
	browser.tabs.onReplaced.addListener((addedTabId, removedTabId) => onTabReplaced(addedTabId, removedTabId));

	async function onMessage$1(message, sender) {
		if (message.method.endsWith(".init")) {
			await onInit(sender.tab, message);
			onInit$3(sender.tab);
			onInit$2(sender.tab);
			onInit$1(sender.tab);
		}
		if (message.method.endsWith(".getOptions")) {
			return getOptions(message.url);
		}
		if (message.method.endsWith(".activate")) {
			await browser.tabs.update(message.tabId, { active: true });
		}
		if (message.method.endsWith(".getScreenshot")) {
			return captureTab(sender.tab.id, message);
		}
	}

	async function onInit(tab, options) {
		await remove(tab.id);
		const allTabsData = await getPersistent(tab.id);
		allTabsData[tab.id].savedPageDetected = options.savedPageDetected;
		await setPersistent(allTabsData);
	}

	async function onTabUpdated(tabId, changeInfo) {
		if (changeInfo.status == "complete") {
			setTimeout(async () => {
				try {
					await browser.tabs.sendMessage(tabId, { method: "content.maybeInit" });
				}
				catch (error) {
					// ignored
				}
			}, DELAY_MAYBE_INIT);
			onTabUpdated$1(tabId);
			const tab = await browser.tabs.get(tabId);
			if (isEditor(tab)) {
				const allTabsData = await getPersistent(tab.id);
				allTabsData[tab.id].editorDetected = true;
				await setPersistent(allTabsData);
				onTabActivated$1(tab);
			}
		}
		if (changeInfo.discarded) {
			onTabDiscarded(tabId);
		}
	}

	function onTabReplaced(addedTabId, removedTabId) {
		onTabReplaced$3(addedTabId, removedTabId);
		onTabReplaced$1(addedTabId, removedTabId);
		onTabReplaced$2(addedTabId, removedTabId);
	}

	function onTabCreated(tab) {
		onTabCreated$1(tab);
	}

	async function onTabActivated(activeInfo) {
		const tab = await browser.tabs.get(activeInfo.tabId);
		onTabActivated$1(tab);
	}

	function onTabRemoved(tabId) {
		remove(tabId);
		onTabRemoved$2(tabId);
		cancelTab(tabId);
		onTabRemoved$1(tabId);
	}

	async function captureTab(tabId, options) {
		const { width, height } = options;
		const canvas = new OffscreenCanvas(width, height);
		const context = canvas.getContext("2d");
		const image = new Image();
		let y = 0, scrollYStep, activeTabId;
		if (browser.tabs.captureTab) {
			scrollYStep = 4 * 1024;
		} else {
			scrollYStep = options.innerHeight;
			activeTabId = (await browser.tabs.query({ active: true, currentWindow: true }))[0].id;
			await browser.tabs.sendMessage(tabId, { method: "content.beginScrollTo" });
		}
		while (y < height) {
			let imageSrc;
			if (browser.tabs.captureTab) {
				imageSrc = await browser.tabs.captureTab(tabId, {
					format: "png",
					rect: { x: 0, y, width, height: Math.min(height - y, scrollYStep) }
				});
			} else {
				await browser.tabs.sendMessage(tabId, { method: "content.scrollTo", y });
				await browser.tabs.update(tabId, { active: true });
				imageSrc = await browser.tabs.captureVisibleTab(null, {
					format: "png"
				});
			}
			await new Promise((resolve, reject) => {
				image.onload = resolve;
				image.onerror = event => reject(new Error(event.detail));
				image.src = imageSrc;
			});
			context.drawImage(image, 0, y, width, Math.min(height - y, scrollYStep));
			y += scrollYStep;
		}
		if (!browser.tabs.captureTab) {
			await browser.tabs.update(activeTabId, { active: true });
			await browser.tabs.sendMessage(tabId, { method: "content.endScrollTo" });
		}
		const blob = await canvas.convertToBlob({ type: "image/png" });
		return URL.createObjectURL(blob);
	}

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

	browser.runtime.onMessage.addListener((message, sender) => {
		if (message.method == "singlefile.frameTree.initResponse" || message.method == "singlefile.frameTree.ackInitRequest") {
			browser.tabs.sendMessage(sender.tab.id, message, { frameId: 0 });
			return Promise.resolve({});
		}
	});

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

	/* global browser, setTimeout, clearTimeout */

	const timeouts = new Map();

	browser.runtime.onMessage.addListener((message, sender) => {
		if (message.method == "singlefile.lazyTimeout.setTimeout") {
			let tabTimeouts = timeouts.get(sender.tab.id);
			let frameTimeouts;
			if (tabTimeouts) {
				frameTimeouts = tabTimeouts.get(sender.frameId);
				if (frameTimeouts) {
					const previousTimeoutId = frameTimeouts.get(message.type);
					if (previousTimeoutId) {
						clearTimeout(previousTimeoutId);
					}
				} else {
					frameTimeouts = new Map();
				}
			}
			const timeoutId = setTimeout(async () => {
				try {
					const tabTimeouts = timeouts.get(sender.tab.id);
					const frameTimeouts = tabTimeouts.get(sender.frameId);
					if (tabTimeouts && frameTimeouts) {
						deleteTimeout(frameTimeouts, message.type);
					}
					await browser.tabs.sendMessage(sender.tab.id, { method: "singlefile.lazyTimeout.onTimeout", type: message.type });
				} catch (error) {
					// ignored
				}
			}, message.delay);
			if (!tabTimeouts) {
				tabTimeouts = new Map();
				frameTimeouts = new Map();
				tabTimeouts.set(sender.frameId, frameTimeouts);
				timeouts.set(sender.tab.id, tabTimeouts);
			}
			frameTimeouts.set(message.type, timeoutId);
			return Promise.resolve({});
		}
		if (message.method == "singlefile.lazyTimeout.clearTimeout") {
			let tabTimeouts = timeouts.get(sender.tab.id);
			if (tabTimeouts) {
				const frameTimeouts = tabTimeouts.get(sender.frameId);
				if (frameTimeouts) {
					const timeoutId = frameTimeouts.get(message.type);
					if (timeoutId) {
						clearTimeout(timeoutId);
					}
					deleteTimeout(frameTimeouts, message.type);
				}
			}
			return Promise.resolve({});
		}
	});

	browser.tabs.onRemoved.addListener(tabId => timeouts.delete(tabId));

	function deleteTimeout(framesTimeouts, type) {
		framesTimeouts.delete(type);
	}

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

	const ACTION_SAVE_PAGE = "save-page";
	const ACTION_EDIT_AND_SAVE_PAGE = "edit-and-save-page";
	const ACTION_SAVE_SELECTED_LINKS = "save-selected-links";
	const ACTION_SAVE_SELECTED = "save-selected-content";
	const ACTION_SAVE_SELECTED_TABS = "save-selected-tabs";
	const ACTION_SAVE_UNPINNED_TABS = "save-unpinned-tabs";
	const ACTION_SAVE_ALL_TABS = "save-all-tabs";

	async function onMessage(message, sender) {
		if (message == ACTION_SAVE_PAGE) {
			const tabs = await browser.tabs.query({ currentWindow: true, active: true });
			tabs.length = 1;
			await saveTabs(tabs);
		} else if (message == ACTION_EDIT_AND_SAVE_PAGE) {
			const tabs = await browser.tabs.query({ currentWindow: true, active: true });
			tabs.length = 1;
			await saveTabs(tabs, { openEditor: true });
		} else if (message == ACTION_SAVE_SELECTED_LINKS) {
			const tabs = await browser.tabs.query({ currentWindow: true, active: true });
			await saveSelectedLinks(tabs[0]);
		} else if (message == ACTION_SAVE_SELECTED) {
			const tabs = await browser.tabs.query({ currentWindow: true, active: true });
			await saveTabs(tabs, { selected: true });
		} else if (message == ACTION_SAVE_SELECTED_TABS) {
			const tabs = await queryTabs({ currentWindow: true, highlighted: true });
			await saveTabs(tabs);
		} else if (message == ACTION_SAVE_UNPINNED_TABS) {
			const tabs = await queryTabs({ currentWindow: true, pinned: false });
			await saveTabs(tabs);
		} else if (message == ACTION_SAVE_ALL_TABS) {
			const tabs = await queryTabs({ currentWindow: true });
			await saveTabs(tabs);
		} else if (message.method) {
			const tabs = await browser.tabs.query({ currentWindow: true, active: true });
			const currentTab = tabs[0];
			if (currentTab) {
				return onMessageExternal(message, currentTab);
			} else {
				return false;
			}
		}
	}

	async function queryTabs(options) {
		const tabs = await browser.tabs.query(options);
		return tabs.sort((tab1, tab2) => tab1.index - tab2.index);
	}

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

	browser.runtime.onMessage.addListener((message, sender) => {
		if (message.method.startsWith("tabs.")) {
			return onMessage$1(message, sender);
		}
		if (message.method.startsWith("downloads.")) {
			return onMessage$4(message, sender);
		}
		if (message.method.startsWith("autosave.")) {
			return onMessage$3(message, sender);
		}
		if (message.method.startsWith("ui.")) {
			return onMessage$7(message, sender);
		}
		if (message.method.startsWith("config.")) {
			return onMessage$d(message);
		}
		if (message.method.startsWith("tabsData.")) {
			return onMessage$e(message);
		}
		if (message.method.startsWith("devtools.")) {
			return onMessage$2(message);
		}
		if (message.method.startsWith("editor.")) {
			return onMessage$b(message, sender);
		}
		if (message.method.startsWith("bookmarks.")) {
			return onMessage$5(message);
		}
		if (message.method.startsWith("companion.")) {
			return onMessage$6(message);
		}
		if (message.method.startsWith("requests.")) {
			return onMessage$a(message);
		}
		if (message.method.startsWith("bootstrap.")) {
			return onMessage$c(message, sender);
		}
	});

	if (browser.runtime.onMessageExternal) {
		browser.runtime.onMessageExternal.addListener(onMessage);
	}

})();
