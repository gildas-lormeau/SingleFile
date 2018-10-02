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

/* global browser, singlefile, localStorage */

singlefile.config = (() => {

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
		filenameTemplate: "{page-title} ({date-iso} {time-locale}).html",
		confirmFilename: false,
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
		groupDuplicateImages: true
	};

	let pendingUpgradePromise;
	browser.runtime.onMessage.addListener(request => {
		if (request.getConfig) {
			return getConfig();
		}
	});
	upgrade();

	async function upgrade() {
		if (localStorage.config) {
			const config = JSON.parse(localStorage.config);
			await upgradeConfig(config);
			delete localStorage.config;
			pendingUpgradePromise = browser.storage.local.set(config);
		} else {
			const config = await browser.storage.local.get();
			await upgradeConfig(config);
			pendingUpgradePromise = browser.storage.local.set(config);
		}
	}

	async function upgradeConfig(config) {
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
				config.filenameTemplate = "{page-title} ({date-iso} {time-locale}).html";
			} else {
				config.filenameTemplate = "{page-title}.html";
			}
			delete config.appendSaveDate;
		}
		if (config.removeImports === undefined) {
			config.removeImports = true;
		}
		if (config.shadowEnabled === undefined) {
			config.shadowEnabled = true;
		}
		if (config.maxResourceSize === undefined) {
			config.maxResourceSize = 10;
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
			config.autoSaveDelay = 1;
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
				config.removeAlternativeImages = config.removeAlternativeImages;
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
	}

	async function getConfig() {
		await pendingUpgradePromise;
		const config = await browser.storage.local.get();
		config.tabsData = undefined;
		return Object.keys(config).length ? config : DEFAULT_CONFIG;
	}

	return {
		async set(config) {
			await pendingUpgradePromise;
			await browser.storage.local.set(config);
		},
		async get() {
			return getConfig();
		},
		async reset() {
			await pendingUpgradePromise;
			const { tabsData } = await browser.storage.local.get();
			await browser.storage.local.clear();
			const config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
			config.tabsData = tabsData;
			await browser.storage.local.set(config);
		}
	};

})();
