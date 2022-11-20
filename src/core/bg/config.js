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

/* global browser, navigator, URL, Blob */

import { download } from "./download-util.js";
import * as tabsData from "./tabs-data.js";

const CURRENT_PROFILE_NAME = "-";
const DEFAULT_PROFILE_NAME = "__Default_Settings__";
const DISABLED_PROFILE_NAME = "__Disabled_Settings__";
const REGEXP_RULE_PREFIX = "regexp:";

const IS_NOT_SAFARI = !/Safari/.test(navigator.userAgent) || /Chrome/.test(navigator.userAgent);
const BACKGROUND_SAVE_SUPPORTED = !(/Mobile.*Firefox/.test(navigator.userAgent) || /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent));
const BADGE_COLOR_SUPPORTED = IS_NOT_SAFARI;
const AUTO_SAVE_SUPPORTED = IS_NOT_SAFARI;
const SELECTABLE_TABS_SUPPORTED = IS_NOT_SAFARI;
const AUTO_OPEN_EDITOR_SUPPORTED = IS_NOT_SAFARI;
const OPEN_SAVED_PAGE_SUPPORTED = IS_NOT_SAFARI;
const INFOBAR_SUPPORTED = IS_NOT_SAFARI;
const BOOKMARKS_API_SUPPORTED = IS_NOT_SAFARI;
const IDENTITY_API_SUPPORTED = IS_NOT_SAFARI;
const CLIPBOARD_API_SUPPORTED = IS_NOT_SAFARI;
const NATIVE_API_API_SUPPORTED = IS_NOT_SAFARI;
const WEB_BLOCKING_API_SUPPORTED = IS_NOT_SAFARI;

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
	filenameTemplate: "{page-title} ({date-locale} {time-locale}).html",
	infobarTemplate: "",
	includeInfobar: !INFOBAR_SUPPORTED,
	confirmInfobarContent: false,
	autoClose: false,
	confirmFilename: false,
	filenameConflictAction: "uniquify",
	filenameMaxLength: 192,
	filenameMaxLengthUnit: "bytes",
	filenameReplacedCharacters: ["~", "+", "\\\\", "?", "%", "*", ":", "|", "\"", "<", ">", "\x00-\x1f", "\x7F"],
	filenameReplacementCharacter: "_",
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
	saveWithWebDAV: false,
	webDAVURL: "",
	webDAVUser: "",
	webDAVPassword: "",
	saveToGitHub: false,
	githubToken: "",
	githubUser: "",
	githubRepository: "SingleFile-Archives",
	githubBranch: "main",
	saveWithCompanion: false,
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
	autoSaveExternalSave: false,
	insertMetaNoIndex: false,
	insertMetaCSP: true,
	passReferrerOnError: false,
	insertSingleFileComment: true,
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
	blockAudios: true
};

const DEFAULT_RULES = [{
	"url": "file:",
	"profile": "__Default_Settings__",
	"autoSaveProfile": "__Disabled_Settings__"
}];

let configStorage;
let pendingUpgradePromise = upgrade();
export {
	DEFAULT_PROFILE_NAME,
	DISABLED_PROFILE_NAME,
	CURRENT_PROFILE_NAME,
	BACKGROUND_SAVE_SUPPORTED,
	BADGE_COLOR_SUPPORTED,
	AUTO_SAVE_SUPPORTED,
	SELECTABLE_TABS_SUPPORTED,
	OPEN_SAVED_PAGE_SUPPORTED,
	AUTO_OPEN_EDITOR_SUPPORTED,
	INFOBAR_SUPPORTED,
	BOOKMARKS_API_SUPPORTED,
	IDENTITY_API_SUPPORTED,
	CLIPBOARD_API_SUPPORTED,
	NATIVE_API_API_SUPPORTED,
	WEB_BLOCKING_API_SUPPORTED,
	getConfig as get,
	getRule,
	getOptions,
	getProfiles,
	onMessage,
	updateRule,
	addRule,
	getAuthInfo,
	setAuthInfo,
	removeAuthInfo
};

async function upgrade() {
	const { sync } = await browser.storage.local.get();
	if (sync) {
		configStorage = browser.storage.sync;
	} else {
		configStorage = browser.storage.local;
	}
	const config = await configStorage.get();
	if (!config.profiles) {
		const defaultConfig = config;
		delete defaultConfig.tabsData;
		applyUpgrade(defaultConfig);
		const newConfig = { profiles: {}, rules: DEFAULT_RULES };
		newConfig.profiles[DEFAULT_PROFILE_NAME] = defaultConfig;
		configStorage.remove(Object.keys(DEFAULT_CONFIG));
		await configStorage.set(newConfig);
	} else {
		if (!config.rules) {
			config.rules = DEFAULT_RULES;
		}
		Object.keys(config.profiles).forEach(profileName => applyUpgrade(config.profiles[profileName]));
		await configStorage.remove(["profiles", "rules"]);
		await configStorage.set({ profiles: config.profiles, rules: config.rules });
	}
	if (!config.maxParallelWorkers) {
		await configStorage.set({ maxParallelWorkers: navigator.hardwareConcurrency || 4 });
	}
}

function applyUpgrade(config) {
	upgradeOldConfig(config, "blockScripts", "removeScripts");
	upgradeOldConfig(config, "blockVideos", "removeVideoSrc");
	upgradeOldConfig(config, "blockAudios", "removeAudioSrc");
	Object.keys(DEFAULT_CONFIG).forEach(configKey => upgradeConfig(config, configKey));
}

function upgradeOldConfig(config, newKey, oldKey) { // eslint-disable-line no-unused-vars
	if (config[newKey] === undefined && config[oldKey] !== undefined) {
		config[newKey] = config[oldKey];
		delete config[oldKey];
	}
}

function upgradeConfig(config, key) {
	if (config[key] === undefined) {
		config[key] = DEFAULT_CONFIG[key];
	}
}

async function getRule(url, ignoreWildcard) {
	const config = await getConfig();
	const regExpRules = config.rules.filter(rule => testRegExpRule(rule));
	let rule = regExpRules.sort(sortRules).find(rule => url && url.match(new RegExp(rule.url.split(REGEXP_RULE_PREFIX)[1])));
	if (!rule) {
		const normalRules = config.rules.filter(rule => !testRegExpRule(rule));
		rule = normalRules.sort(sortRules).find(rule => (!ignoreWildcard && rule.url == "*") || (url && url.includes(rule.url)));
	}
	return rule;
}

async function getConfig() {
	await pendingUpgradePromise;
	return configStorage.get(["profiles", "rules", "maxParallelWorkers"]);
}

function sortRules(ruleLeft, ruleRight) {
	return ruleRight.url.length - ruleLeft.url.length;
}

function testRegExpRule(rule) {
	return rule.url.toLowerCase().startsWith(REGEXP_RULE_PREFIX);
}

async function onMessage(message) {
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
			OPEN_SAVED_PAGE_SUPPORTED,
			AUTO_OPEN_EDITOR_SUPPORTED,
			INFOBAR_SUPPORTED,
			BOOKMARKS_API_SUPPORTED,
			IDENTITY_API_SUPPORTED,
			CLIPBOARD_API_SUPPORTED,
			NATIVE_API_API_SUPPORTED,
			WEB_BLOCKING_API_SUPPORTED
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
		if (!syncConfig || !syncConfig.profiles) {
			const localConfig = await browser.storage.local.get();
			await browser.storage.sync.set({ profiles: localConfig.profiles, rules: localConfig.rules, maxParallelWorkers: localConfig.maxParallelWorkers });
		}
		configStorage = browser.storage.sync;
		return {};
	}
	if (message.method.endsWith(".disableSync")) {
		await browser.storage.local.set({ sync: false });
		const syncConfig = await browser.storage.sync.get();
		if (syncConfig && syncConfig.profiles) {
			await browser.storage.local.set({ profiles: syncConfig.profiles, rules: syncConfig.rules, maxParallelWorkers: syncConfig.maxParallelWorkers });
		}
		configStorage = browser.storage.local;
	}
	if (message.method.endsWith(".isSync")) {
		return { sync: (await browser.storage.local.get()).sync };
	}
	return {};
}

async function createProfile(profileName, fromProfileName) {
	const config = await getConfig();
	if (Object.keys(config.profiles).includes(profileName)) {
		throw new Error("Duplicate profile name");
	}
	config.profiles[profileName] = JSON.parse(JSON.stringify(config.profiles[fromProfileName]));
	await configStorage.set({ profiles: config.profiles });
}

async function getProfiles() {
	const config = await getConfig();
	return config.profiles;
}

async function getOptions(url, autoSave) {
	const [config, rule, allTabsData] = await Promise.all([getConfig(), getRule(url), tabsData.get()]);
	const tabProfileName = allTabsData.profileName || DEFAULT_PROFILE_NAME;
	let selectedProfileName;
	if (rule) {
		const profileName = rule[autoSave ? "autoSaveProfile" : "profile"];
		selectedProfileName = profileName == CURRENT_PROFILE_NAME ? tabProfileName : profileName;
	} else {
		selectedProfileName = tabProfileName;
	}
	return Object.assign({ profileName: selectedProfileName }, config.profiles[selectedProfileName]);
}

async function updateProfile(profileName, profile) {
	const config = await getConfig();
	if (!Object.keys(config.profiles).includes(profileName)) {
		throw new Error("Profile not found");
	}
	Object.keys(profile).forEach(key => config.profiles[profileName][key] = profile[key]);
	await configStorage.set({ profiles: config.profiles });
}

async function renameProfile(oldProfileName, profileName) {
	const [config, allTabsData] = await Promise.all([getConfig(), tabsData.get()]);
	if (!Object.keys(config.profiles).includes(oldProfileName)) {
		throw new Error("Profile not found");
	}
	if (Object.keys(config.profiles).includes(profileName)) {
		throw new Error("Duplicate profile name");
	}
	if (oldProfileName == DEFAULT_PROFILE_NAME) {
		throw new Error("Default settings cannot be renamed");
	}
	if (allTabsData.profileName == oldProfileName) {
		allTabsData.profileName = profileName;
		await tabsData.set(allTabsData);
	}
	config.profiles[profileName] = config.profiles[oldProfileName];
	config.rules.forEach(rule => {
		if (rule.profile == oldProfileName) {
			rule.profile = profileName;
		}
		if (rule.autoSaveProfile == oldProfileName) {
			rule.autoSaveProfile = profileName;
		}
	});
	delete config.profiles[oldProfileName];
	await configStorage.set({ profiles: config.profiles, rules: config.rules });
}

async function deleteProfile(profileName) {
	const [config, allTabsData] = await Promise.all([getConfig(), tabsData.get()]);
	if (!Object.keys(config.profiles).includes(profileName)) {
		throw new Error("Profile not found");
	}
	if (profileName == DEFAULT_PROFILE_NAME) {
		throw new Error("Default settings cannot be deleted");
	}
	if (allTabsData.profileName == profileName) {
		delete allTabsData.profileName;
		await tabsData.set(allTabsData);
	}
	config.rules.forEach(rule => {
		if (rule.profile == profileName) {
			rule.profile = DEFAULT_PROFILE_NAME;
		}
		if (rule.autoSaveProfile == profileName) {
			rule.autoSaveProfile = DEFAULT_PROFILE_NAME;
		}
	});
	delete config.profiles[profileName];
	await configStorage.set({ profiles: config.profiles, rules: config.rules });
}

async function getRules() {
	const config = await getConfig();
	return config.rules;
}

async function addRule(url, profile, autoSaveProfile) {
	if (!url) {
		throw new Error("URL is empty");
	}
	const config = await getConfig();
	if (config.rules.find(rule => rule.url == url)) {
		throw new Error("URL already exists");
	}
	config.rules.push({
		url,
		profile,
		autoSaveProfile
	});
	await configStorage.set({ rules: config.rules });
}

async function deleteRule(url) {
	if (!url) {
		throw new Error("URL is empty");
	}
	const config = await getConfig();
	config.rules = config.rules.filter(rule => rule.url != url);
	await configStorage.set({ rules: config.rules });
}

async function deleteRules(profileName) {
	const config = await getConfig();
	config.rules = config.rules = profileName ? config.rules.filter(rule => rule.autoSaveProfile != profileName && rule.profile != profileName) : [];
	await configStorage.set({ rules: config.rules });
}

async function updateRule(url, newURL, profile, autoSaveProfile) {
	if (!url || !newURL) {
		throw new Error("URL is empty");
	}
	const config = await getConfig();
	const urlConfig = config.rules.find(rule => rule.url == url);
	if (!urlConfig) {
		throw new Error("URL not found");
	}
	if (config.rules.find(rule => rule.url == newURL && rule.url != url)) {
		throw new Error("New URL already exists");
	}
	urlConfig.url = newURL;
	urlConfig.profile = profile;
	urlConfig.autoSaveProfile = autoSaveProfile;
	await configStorage.set({ rules: config.rules });
}

async function getAuthInfo() {
	return (await configStorage.get()).authInfo;
}

async function setAuthInfo(authInfo) {
	await configStorage.set({ authInfo });
}

async function removeAuthInfo() {
	let authInfo = getAuthInfo();
	if (authInfo.revokableAccessToken) {
		setAuthInfo({ revokableAccessToken: authInfo.revokableAccessToken });
	} else {
		await configStorage.remove(["authInfo"]);
	}
}

async function resetProfiles() {
	await pendingUpgradePromise;
	const allTabsData = await tabsData.get();
	delete allTabsData.profileName;
	await tabsData.set(allTabsData);
	await configStorage.remove(["profiles", "rules", "maxParallelWorkers"]);
	await browser.storage.local.set({ sync: false });
	configStorage = browser.storage.local;
	await upgrade();
}

async function resetProfile(profileName) {
	const config = await getConfig();
	if (!Object.keys(config.profiles).includes(profileName)) {
		throw new Error("Profile not found");
	}
	config.profiles[profileName] = DEFAULT_CONFIG;
	await configStorage.set({ profiles: config.profiles });
}

async function exportConfig() {
	const config = await getConfig();
	const url = URL.createObjectURL(new Blob([JSON.stringify({ profiles: config.profiles, rules: config.rules, maxParallelWorkers: config.maxParallelWorkers }, null, 2)], { type: "text/json" }));
	const downloadInfo = {
		url,
		filename: `singlefile-settings-${(new Date()).toISOString().replace(/:/g, "_")}.json`,
		saveAs: true
	};
	try {
		await download(downloadInfo, "_");
	} finally {
		URL.revokeObjectURL(url);
	}
}

async function importConfig(config) {
	await configStorage.remove(["profiles", "rules", "maxParallelWorkers"]);
	await configStorage.set({ profiles: config.profiles, rules: config.rules, maxParallelWorkers: config.maxParallelWorkers });
	await upgrade();
}