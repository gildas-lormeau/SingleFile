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

/* global browser, singlefile */

singlefile.config = (() => {

	const DEFAULT_PROFILE_NAME = "Default settings";

	const DEFAULT_CONFIG = {
		removeHiddenElements: true,
		removeUnusedStyles: true,
		removeFrames: false,
		removeImports: true,
		removeScripts: true,
		rawDocument: false,
		compressHTML: true,
		compressCSS: true,
		lazyLoadImages: true,
		maxLazyLoadImagesIdleTime: 1500,
		filenameTemplate: "{page-title} ({date-iso} {time-locale}).html",
		infobarTemplate: "",
		confirmInfobar: false,
		confirmFilename: false,
		conflictAction: "uniquify",
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
		removeAlternativeFonts: true,
		removeAlternativeMedias: true,
		removeAlternativeImages: true,
		groupDuplicateImages: true,
		saveRawPage: false
	};

	let pendingUpgradePromise = upgrade();
	browser.runtime.onMessage.addListener(request => {
		if (request.getConfig) {
			return getConfig();
		}
	});

	async function upgrade() {
		const config = await browser.storage.local.get();
		const defaultConfig = config;
		if (!config.profiles) {
			delete defaultConfig.tabsData;
			applyUpgrade(defaultConfig);
			const config = { profiles: {}, defaultProfile: DEFAULT_PROFILE_NAME };
			config.profiles[config.defaultProfile] = defaultConfig;
			browser.storage.local.remove(Object.keys(DEFAULT_CONFIG));
			return browser.storage.local.set(config);
		} else {
			Object.keys(config.profiles).forEach(profileName => applyUpgrade(config.profiles[profileName]));
			return browser.storage.local.set({ profiles: config.profiles });
		}
	}

	function applyUpgrade(config) {
		if (config.removeScripts === undefined) {
			config.removeScripts = true;
		}
		config.compressHTML = config.compressCSS = config.compress;
		if (config.compressCSS === undefined) {
			config.compressCSS = true;
		}
		if (config.compressHTML === undefined) {
			config.compressHTML = true;
		}
		if (config.lazyLoadImages === undefined) {
			config.lazyLoadImages = true;
		}
		if (config.contextMenuEnabled === undefined) {
			config.contextMenuEnabled = true;
		}
		if (config.filenameTemplate === undefined) {
			if (config.appendSaveDate || config.appendSaveDate === undefined) {
				config.filenameTemplate = DEFAULT_CONFIG.filenameTemplate;
			} else {
				config.filenameTemplate = "{page-title}.html";
			}
			delete config.appendSaveDate;
		}
		if (config.infobarTemplate === undefined) {
			config.infobarTemplate = "";
		}
		if (config.removeImports === undefined) {
			config.removeImports = true;
		}
		if (config.shadowEnabled === undefined) {
			config.shadowEnabled = true;
		}
		if (config.maxResourceSize === undefined) {
			config.maxResourceSize = DEFAULT_CONFIG.maxResourceSize;
		}
		if (config.maxResourceSize === 0) {
			config.maxResourceSize = 1;
		}
		if (config.removeUnusedStyles === undefined || config.removeUnusedCSSRules) {
			delete config.removeUnusedCSSRules;
			config.removeUnusedStyles = true;
		}
		if (config.removeAudioSrc === undefined) {
			config.removeAudioSrc = true;
		}
		if (config.removeVideoSrc === undefined) {
			config.removeVideoSrc = true;
		}
		if (config.displayInfobar === undefined) {
			config.displayInfobar = true;
		}
		if (config.backgroundSave === undefined) {
			config.backgroundSave = true;
		}
		if (config.autoSaveDelay === undefined) {
			config.autoSaveDelay = DEFAULT_CONFIG.autoSaveDelay;
		}
		if (config.removeAlternativeFonts === undefined) {
			config.removeAlternativeFonts = true;
		}
		if (config.removeAlternativeMedias === undefined) {
			config.removeAlternativeMedias = true;
		}
		if (config.removeAlternativeImages === undefined) {
			if (config.removeAlternativeImages === undefined) {
				config.removeAlternativeImages = true;
			} else {
				config.removeAlternativeImages = config.removeSrcSet;
			}
		}
		if (config.groupDuplicateImages === undefined) {
			config.groupDuplicateImages = true;
		}
		if (config.removeHiddenElements === undefined) {
			config.removeHiddenElements = true;
		}
		if (config.autoSaveLoadOrUnload === undefined && !config.autoSaveUnload) {
			config.autoSaveLoadOrUnload = true;
			config.autoSaveLoad = false;
			config.autoSaveUnload = false;
		}
		if (config.maxLazyLoadImagesIdleTime === undefined) {
			config.maxLazyLoadImagesIdleTime = DEFAULT_CONFIG.maxLazyLoadImagesIdleTime;
		}
		if (config.confirmFilename === undefined) {
			config.confirmFilename = false;
		}
		if (config.conflictAction === undefined) {
			config.conflictAction = DEFAULT_CONFIG.conflictAction;
		}
	}

	async function getConfig() {
		await pendingUpgradePromise;
		return await browser.storage.local.get(["profiles", "defaultProfile"]);
	}

	return {
		DEFAULT_PROFILE_NAME,
		async create(profileName) {
			const config = await getConfig();
			if (Object.keys(config.profiles).includes(profileName)) {
				throw new Error("Duplicate profile name");
			}
			config.profiles[profileName] = DEFAULT_CONFIG;
			await browser.storage.local.set({ profiles: config.profiles, defaultProfile: DEFAULT_PROFILE_NAME });
		},
		async get() {
			return getConfig();
		},
		async update(profileName, data) {
			const config = await getConfig();
			if (!Object.keys(config.profiles).includes(profileName)) {
				throw new Error("Profile not found");
			}
			config.profiles[profileName] = data;
			await browser.storage.local.set({ profiles: config.profiles });
		},
		async rename(oldProfileName, profileName) {
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
			delete config.profiles[oldProfileName];
			await browser.storage.local.set({ profiles: config.profiles });
		},
		async delete(profileName) {
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
			delete config.profiles[profileName];
			await browser.storage.local.set({ profiles: config.profiles });
		},
		async reset() {
			await pendingUpgradePromise;
			const tabsData = await singlefile.tabsData.get();
			delete tabsData.profileName;
			await singlefile.tabsData.set(tabsData);
			await browser.storage.local.remove(["profiles", "defaultProfile"]);
			await browser.storage.local.set({ profiles: { [DEFAULT_PROFILE_NAME]: DEFAULT_CONFIG }, defaultProfile: DEFAULT_PROFILE_NAME });
		}
	};

})();
