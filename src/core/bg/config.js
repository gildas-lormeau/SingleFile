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

/* global browser, navigator, URL, Blob, File */

import { download } from "./download-util.js";
import * as tabsData from "./tabs-data.js";

const CURRENT_PROFILE_NAME = "-";
const DEFAULT_PROFILE_NAME = "__Default_Settings__";
const DISABLED_PROFILE_NAME = "__Disabled_Settings__";
const REGEXP_RULE_PREFIX = "regexp:";
const PROFILE_NAME_PREFIX = "profile_";

const IS_NOT_SAFARI = !/Safari/.test(navigator.userAgent) || /Chrome/.test(navigator.userAgent) || /Vivaldi/.test(navigator.userAgent) || /OPR/.test(navigator.userAgent);
const IS_MOBILE_FIREFOX = /Mobile.*Firefox/.test(navigator.userAgent);
const BACKGROUND_SAVE_SUPPORTED = !(IS_MOBILE_FIREFOX || /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent) && !/Vivaldi/.test(navigator.userAgent) && !/OPR/.test(navigator.userAgent));
const AUTOCLOSE_SUPPORTED = !IS_MOBILE_FIREFOX;
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
const LEGACY_FILENAME_REPLACED_CHARACTERS = ["~", "+", "\\\\", "?", "%", "*", ":", "|", "\"", "<", ">", "\u0000-\u001f", "\u007f"];
const DEFAULT_FILENAME_REPLACED_CHARACTERS = ["~", "+", "?", "%", "*", ":", "|", "\"", "<", ">", "\\\\", "\x00-\x1f", "\x7F"];
const DEFAULT_FILENAME_REPLACEMENT_CHARACTERS = ["～", "＋", "？", "％", "＊", "：", "｜", "＂", "＜", "＞", "＼"];

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
	openInfobar: false,
	confirmInfobarContent: false,
	autoClose: false,
	confirmFilename: false,
	filenameConflictAction: "uniquify",
	filenameMaxLength: 192,
	filenameMaxLengthUnit: "bytes",
	filenameReplacedCharacters: DEFAULT_FILENAME_REPLACED_CHARACTERS,
	filenameReplacementCharacter: "_",
	filenameReplacementCharacters: DEFAULT_FILENAME_REPLACEMENT_CHARACTERS,
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
	contentWidth: 70,
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
	saveToS3: false,
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
	blockAlternativeImages: true,
	blockStylesheets: false,
	blockFonts: false,
	blockScripts: true,
	blockVideos: true,
	blockAudios: true,
	delayBeforeProcessing: 0,
	delayAfterProcessing: 0,
	_migratedTemplateFormat: true,
	saveToRestFormApiUrl: "",
	saveToRestFormApiFileFieldName: "",
	saveToRestFormApiUrlFieldName: "",
	saveToRestFormApiToken: "",
	S3Domain: "s3.amazonaws.com",
	S3Region: "",
	S3Bucket: "",
	S3AccessKey: "",
	S3SecretKey: "",
	resolveLinks: true,
	groupDuplicateStylesheets: false,
	infobarPositionAbsolute: false,
	infobarPositionTop: "16px",
	infobarPositionRight: "16px",
	infobarPositionBottom: "",
	infobarPositionLeft: "",
	removeNoScriptTags: true
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
export {
	DEFAULT_PROFILE_NAME,
	DISABLED_PROFILE_NAME,
	CURRENT_PROFILE_NAME,
	BACKGROUND_SAVE_SUPPORTED,
	AUTOCLOSE_SUPPORTED,
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
	SHARE_API_SUPPORTED,
	getConfig as get,
	getRule,
	getOptions,
	getProfiles,
	onMessage,
	updateRule,
	addRule,
	getAuthInfo,
	getDropboxAuthInfo,
	setAuthInfo,
	setDropboxAuthInfo,
	removeAuthInfo,
	removeDropboxAuthInfo
};

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
		if (isSameArray(profile.filenameReplacedCharacters, LEGACY_FILENAME_REPLACED_CHARACTERS)
			&& isSameArray(profile.filenameReplacementCharacters, DEFAULT_FILENAME_REPLACEMENT_CHARACTERS)) {
			profile.filenameReplacedCharacters = DEFAULT_FILENAME_REPLACED_CHARACTERS;
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
		// eslint-disable-next-line no-unused-vars
	} catch (error) {
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

async function onMessage(message) {
	if (message.method.endsWith(".get")) {
		return await getConfig();
	}
	if (message.method.endsWith(".set")) {
		const { config } = message;
		const profiles = config.profiles;
		const rules = config.rules;
		const maxParallelWorkers = config.maxParallelWorkers;
		const processInForeground = config.processInForeground;
		const profileKeyNames = await getProfileKeyNames();
		await configStorage.remove([...profileKeyNames, "rules", "maxParallelWorkers", "processInForeground"]);
		await configStorage.set({ rules, maxParallelWorkers, processInForeground });
		Object.keys(profiles).forEach(profileName => setProfile(profileName, profiles[profileName]));
	}
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
			AUTOCLOSE_SUPPORTED,
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
	const [rule, allTabsData] = await Promise.all([getRule(url), tabsData.get()]);
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
	const allTabsData = await tabsData.get();
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
		await tabsData.set(allTabsData);
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
	const allTabsData = await tabsData.get();
	const rules = await getRules();
	if (!profileNames.includes(profileName)) {
		throw new Error("Profile not found");
	}
	if (profileName == DEFAULT_PROFILE_NAME) {
		throw new Error("Default settings cannot be deleted");
	}
	if (allTabsData.profileName == profileName) {
		delete allTabsData.profileName;
		await tabsData.set(allTabsData);
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

async function getAuthInfo() {
	return (await configStorage.get()).authInfo;
}

async function getDropboxAuthInfo() {
	return (await configStorage.get()).dropboxAuthInfo;
}

async function setAuthInfo(authInfo) {
	await configStorage.set({ authInfo });
}

async function setDropboxAuthInfo(authInfo) {
	await configStorage.set({ dropboxAuthInfo: authInfo });
}

async function removeAuthInfo() {
	let authInfo = getAuthInfo();
	if (authInfo.revokableAccessToken) {
		setAuthInfo({ revokableAccessToken: authInfo.revokableAccessToken });
	} else {
		await configStorage.remove(["authInfo"]);
	}
}

async function removeDropboxAuthInfo() {
	let authInfo = getDropboxAuthInfo();
	if (authInfo.revokableAccessToken) {
		setDropboxAuthInfo({ revokableAccessToken: authInfo.revokableAccessToken });
	} else {
		await configStorage.remove(["dropboxAuthInfo"]);
	}
}

async function resetProfiles() {
	await pendingUpgradePromise;
	const allTabsData = await tabsData.get();
	delete allTabsData.profileName;
	await tabsData.set(allTabsData);
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
	const allTabsData = await tabsData.get();
	if (profileNames.includes(allTabsData.profileName)) {
		delete allTabsData.profileName;
		await tabsData.set(allTabsData);
	}
	await configStorage.remove([...profileKeyNames, "rules", "maxParallelWorkers", "processInForeground"]);
	const newConfig = { rules: config.rules, maxParallelWorkers: config.maxParallelWorkers, processInForeground: config.processInForeground };
	Object.keys(config.profiles).forEach(profileName => newConfig[PROFILE_NAME_PREFIX + profileName] = config.profiles[profileName]);
	await configStorage.set(newConfig);
	await upgrade();
}

function isSameArray(arrayLeft, arrayRight) {
	return arrayLeft.length == arrayRight.length && arrayLeft.every((value, index) => value == arrayRight[index]);
}