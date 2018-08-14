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
		removeUnusedCSSRules: true,
		removeFrames: true,
		removeImports: true,
		removeScripts: true,
		rawDocument: false,
		compressHTML: true,
		compressCSS: true,
		lazyLoadImages: true,
		appendSaveDate: true,
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
		autoSaveDelay: 1
	};

	let pendingUpgradePromise;
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
		if (config.appendSaveDate === undefined) {
			config.appendSaveDate = true;
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
		if (config.removeUnusedCSSRules === undefined) {
			config.removeUnusedCSSRules = true;
		}
		if (config.removeFrames === undefined) {
			config.removeFrames = true;
		}
		if (config.removeAudioSrc === undefined) {
			config.removeAudioSrc = true;
		}
		if (config.removeVideoSrc === undefined) {
			config.removeVideoSrc = true;
		}
		if (config.removeHiddenElements === undefined) {
			config.removeHiddenElements = true;
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
		const platformInfo = await browser.runtime.getPlatformInfo();
		if (platformInfo.os == "android") {
			config.backgroundSave = false;
			config.backgroundSaveDisabled = true;
			config.autoSaveDelay = 0;
			config.autoSaveDelayDisabled = true;
		}
	}

	return {
		async set(config) {
			await pendingUpgradePromise;
			await browser.storage.local.set(config);
		},
		async get() {
			await pendingUpgradePromise;
			const config = await browser.storage.local.get();
			return Object.keys(config).length ? config : DEFAULT_CONFIG;
		},
		async reset() {
			await pendingUpgradePromise;
			await browser.storage.local.clear();
			await upgradeConfig({});
		}
	};

})();
