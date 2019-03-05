/*
 * Copyright 2010-2019 Gildas Lormeau
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

/* global browser, singlefile, URL, Blob */

singlefile.config = (() => {

	const DEFAULT_PROFILE_NAME = "__Default_Settings__";
	const DISABLED_PROFILE_NAME = "__Disabled_Settings__";
	const REGEXP_RULE_PREFIX = "regexp:";

	const DEFAULT_CONFIG = {
		removeHiddenElements: true,
		removeUnusedStyles: true,
		removeUnusedFonts: true,
		removeFrames: false,
		removeImports: true,
		removeScripts: true,
		compressHTML: true,
		compressCSS: true,
		loadDeferredImages: true,
		loadDeferredImagesMaxIdleTime: 1500,
		filenameTemplate: "{page-title} ({date-iso} {time-locale}).html",
		infobarTemplate: "",
		confirmInfobarContent: false,
		confirmFilename: false,
		filenameConflictAction: "uniquify",
		contextMenuEnabled: true,
		shadowEnabled: true,
		maxResourceSizeEnabled: false,
		maxResourceSize: 10,
		removeAudioSrc: true,
		removeVideoSrc: true,
		displayInfobar: true,
		displayStats: false,
		backgroundSave: true,
		autoSaveDelay: 1,
		autoSaveLoad: false,
		autoSaveUnload: false,
		autoSaveLoadOrUnload: true,
		autoSaveRepeat: false,
		autoSaveRepeatDelay: 10,
		removeAlternativeFonts: true,
		removeAlternativeMedias: true,
		removeAlternativeImages: true,
		groupDuplicateImages: true,
		saveRawPage: false
	};

	let pendingUpgradePromise = upgrade();
	return {
		DEFAULT_PROFILE_NAME,
		DISABLED_PROFILE_NAME,
		getRule,
		getOptions,
		getProfiles,
		onMessage,
		updateRule,
		addRule
	};

	async function upgrade() {
		const config = await browser.storage.local.get();
		if (!config.profiles) {
			const defaultConfig = config;
			delete defaultConfig.tabsData;
			applyUpgrade(defaultConfig);
			const newConfig = { profiles: {}, rules: [] };
			newConfig.profiles[DEFAULT_PROFILE_NAME] = defaultConfig;
			browser.storage.local.remove(Object.keys(DEFAULT_CONFIG));
			await browser.storage.local.set(newConfig);
		} else {
			if (!config.rules) {
				config.rules = [];
			}
			Object.keys(config.profiles).forEach(profileName => applyUpgrade(config.profiles[profileName]));
			await browser.storage.local.remove(["profiles", "defaultProfile", "rules"]);
			await browser.storage.local.set({ profiles: config.profiles, rules: config.rules });
		}
	}

	function applyUpgrade(config) {
		if (config.autoSaveLoadOrUnload === undefined && !config.autoSaveUnload && !config.autoSaveLoad) {
			config.autoSaveLoadOrUnload = true;
			config.autoSaveLoad = false;
			config.autoSaveUnload = false;
		}
		if (!config.maxResourceSize) {
			config.maxResourceSize = DEFAULT_CONFIG.maxResourceSize;
		}
		if (config.appendSaveDate !== undefined) {
			delete config.appendSaveDate;
		}
		if ((config.compressHTML === undefined || config.compressCSS === undefined) && config.compress !== undefined) {
			config.compressHTML = config.compressCSS = config.compress;
			delete config.compress;
		}
		upgradeOldConfig(config, "removeUnusedFonts", "removeUnusedStyles");
		upgradeOldConfig(config, "removeUnusedStyles", "removeUnusedCSSRules");
		upgradeOldConfig(config, "removeAlternativeImages", "removeSrcSet");
		upgradeOldConfig(config, "confirmInfobarContent", "confirmInfobar");
		upgradeOldConfig(config, "filenameConflictAction", "conflictAction");
		upgradeOldConfig(config, "loadDeferredImages", "lazyLoadImages");
		upgradeOldConfig(config, "loadDeferredImagesMaxIdleTime", "maxLazyLoadImagesIdleTime");
		Object.keys(DEFAULT_CONFIG).forEach(configKey => upgradeConfig(config, configKey));
	}

	function upgradeOldConfig(config, newKey, oldKey) {
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

	async function getRule(url) {
		const config = await getConfig();
		const regExpRules = config.rules.filter(rule => testRegExpRule(rule));
		let rule = regExpRules.sort(sortRules).find(rule => url && url.match(new RegExp(rule.url.split(REGEXP_RULE_PREFIX)[1])));
		if (!rule) {
			const normalRules = config.rules.filter(rule => !testRegExpRule(rule));
			rule = normalRules.sort(sortRules).find(rule => url && url.includes(rule.url));
		}
		return rule;
	}

	async function getConfig() {
		await pendingUpgradePromise;
		return browser.storage.local.get(["profiles", "rules"]);
	}

	function sortRules(ruleLeft, ruleRight) {
		ruleRight.url.length - ruleLeft.url.length;
	}

	function testRegExpRule(rule) {
		return rule.url.toLowerCase().startsWith(REGEXP_RULE_PREFIX);
	}

	async function onMessage(message) {
		if (message.deleteRules) {
			await deleteRules(message.profileName);
		}
		if (message.deleteRule) {
			await deleteRule(message.url);
		}
		if (message.addRule) {
			await addRule(message.url, message.profileName, message.autoSaveProfileName);
		}
		if (message.createProfile) {
			await createProfile(message.profileName);
		}
		if (message.renameProfile) {
			await renameProfile(message.profileName, message.newProfileName);
		}
		if (message.deleteProfile) {
			await deleteProfile(message.profileName);
		}
		if (message.resetProfiles) {
			await resetProfiles();
		}
		if (message.resetProfile) {
			await resetProfile(message.profileName);
		}
		if (message.importConfig) {
			await importConfig(message.config);
		}
		if (message.updateProfile) {
			await updateProfile(message.profileName, message.profile);
		}
		if (message.updateRule) {
			await updateRule(message.url, message.newUrl, message.profileName, message.autoSaveProfileName);
		}
		if (message.getConfigConstants) {
			return {
				DISABLED_PROFILE_NAME,
				DEFAULT_PROFILE_NAME
			};
		}
		if (message.getRules) {
			return getRules();
		}
		if (message.getProfiles) {
			return getProfiles();
		}
		if (message.exportConfig) {
			return exportConfig();
		}
		return {};
	}

	async function createProfile(profileName) {
		const config = await getConfig();
		if (Object.keys(config.profiles).includes(profileName)) {
			throw new Error("Duplicate profile name");
		}
		config.profiles[profileName] = DEFAULT_CONFIG;
		await browser.storage.local.set({ profiles: config.profiles });
	}

	async function getProfiles() {
		const config = await getConfig();
		return config.profiles;
	}

	async function getOptions(url, autoSave) {
		const [config, rule, tabsData] = await Promise.all([getConfig(), getRule(url), singlefile.tabsData.get()]);
		const profileName = tabsData.profileName;
		return rule ? config.profiles[rule[autoSave ? "autoSaveProfile" : "profile"]] : config.profiles[profileName || singlefile.config.DEFAULT_PROFILE_NAME];
	}

	async function updateProfile(profileName, profile) {
		const config = await getConfig();
		if (!Object.keys(config.profiles).includes(profileName)) {
			throw new Error("Profile not found");
		}
		config.profiles[profileName] = profile;
		await browser.storage.local.set({ profiles: config.profiles });
	}

	async function renameProfile(oldProfileName, profileName) {
		const [config, tabsData] = await Promise.all([getConfig(), singlefile.tabsData.get()]);
		if (!Object.keys(config.profiles).includes(oldProfileName)) {
			throw new Error("Profile not found");
		}
		if (Object.keys(config.profiles).includes(profileName)) {
			throw new Error("Duplicate profile name");
		}
		if (oldProfileName == DEFAULT_PROFILE_NAME) {
			throw new Error("Default settings cannot be renamed");
		}
		if (tabsData.profileName == oldProfileName) {
			tabsData.profileName = profileName;
			await singlefile.tabsData.set(tabsData);
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
		await browser.storage.local.set({ profiles: config.profiles, rules: config.rules });
	}

	async function deleteProfile(profileName) {
		const [config, tabsData] = await Promise.all([getConfig(), singlefile.tabsData.get()]);
		if (!Object.keys(config.profiles).includes(profileName)) {
			throw new Error("Profile not found");
		}
		if (profileName == DEFAULT_PROFILE_NAME) {
			throw new Error("Default settings cannot be deleted");
		}
		if (tabsData.profileName == profileName) {
			delete tabsData.profileName;
			await singlefile.tabsData.set(tabsData);
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
		await browser.storage.local.set({ profiles: config.profiles, rules: config.rules });
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
		await browser.storage.local.set({ rules: config.rules });
	}

	async function deleteRule(url) {
		if (!url) {
			throw new Error("URL is empty");
		}
		const config = await getConfig();
		config.rules = config.rules.filter(rule => rule.url != url);
		await browser.storage.local.set({ rules: config.rules });
	}

	async function deleteRules(profileName) {
		const config = await getConfig();
		config.rules = config.rules = profileName ? config.rules.filter(rule => rule.autoSaveProfile != profileName && rule.profile != profileName) : [];
		await browser.storage.local.set({ rules: config.rules });
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
		await browser.storage.local.set({ rules: config.rules });
	}

	async function resetProfiles() {
		await pendingUpgradePromise;
		const tabsData = await singlefile.tabsData.get();
		delete tabsData.profileName;
		await singlefile.tabsData.set(tabsData);
		await browser.storage.local.remove(["profiles", "rules"]);
		await browser.storage.local.set({ profiles: { [DEFAULT_PROFILE_NAME]: DEFAULT_CONFIG }, rules: [] });
	}

	async function resetProfile(profileName) {
		const config = await getConfig();
		if (!Object.keys(config.profiles).includes(profileName)) {
			throw new Error("Profile not found");
		}
		config.profiles[profileName] = DEFAULT_CONFIG;
		await browser.storage.local.set({ profiles: config.profiles });
	}

	async function exportConfig() {
		const config = await getConfig();
		const url = URL.createObjectURL(new Blob([JSON.stringify({ profiles: config.profiles, rules: config.rules }, null, 2)], { type: "text/json" }));
		const downloadInfo = {
			url,
			filename: "singlefile-settings.json",
			saveAs: true
		};
		const downloadId = await browser.downloads.download(downloadInfo);
		return new Promise((resolve, reject) => {
			browser.downloads.onChanged.addListener(onChanged);

			function onChanged(event) {
				if (event.id == downloadId && event.state) {
					if (event.state.current == "complete") {
						URL.revokeObjectURL(url);
						resolve({});
						browser.downloads.onChanged.removeListener(onChanged);
					}
					if (event.state.current == "interrupted" && (!event.error || event.error.current != "USER_CANCELED")) {
						URL.revokeObjectURL(url);
						reject(new Error(event.state.current));
						browser.downloads.onChanged.removeListener(onChanged);
					}
				}
			}
		});
	}

	async function importConfig(config) {
		await browser.storage.local.remove(["profiles", "rules"]);
		await browser.storage.local.set({ profiles: config.profiles, rules: config.rules });
		await upgrade();
	}

})();
