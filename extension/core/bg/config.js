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

/* global singlefile, localStorage */

singlefile.config = (() => {

	const DEFAULT_CONFIG = {
		removeHiddenElements: false,
		removeUnusedCSSRules: true,
		removeFrames: true,
		removeImports: true,
		removeScripts: true,
		rawDocument: false,
		compress: true,
		lazyLoadImages: true,
		appendSaveDate: true,
		confirmFilename: false,
		contextMenuEnabled: true,
		shadowEnabled: true,
		maxResourceSizeEnabled: false,
		maxResourceSize: 10
	};

	const browser = this.browser || this.chrome;

	let pendingUpgradePromise;
	upgrade();

	function upgrade() {
		if (localStorage.config) {
			const config = JSON.parse(localStorage.config);
			upgradeConfig(config);
			delete localStorage.config;
			pendingUpgradePromise = new Promise(resolve => browser.storage.local.set(config, resolve));
		} else {
			pendingUpgradePromise = new Promise(resolve => browser.storage.local.get(config => {
				upgradeConfig(config);
				browser.storage.local.set(config, resolve);
			}));
		}
	}

	function upgradeConfig(config) {
		if (config.removeScripts === undefined) {
			config.removeScripts = true;
		}
		if (config.compress === undefined) {
			config.compress = true;
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
	}

	return {
		async set(config) {
			await pendingUpgradePromise;
			return new Promise(resolve => browser.storage.local.set(config, resolve));
		},
		async get() {
			await pendingUpgradePromise;
			return new Promise(resolve => browser.storage.local.get(config => resolve(Object.keys(config).length ? config : DEFAULT_CONFIG)));
		},
		async reset() {
			await pendingUpgradePromise;
			return new Promise(resolve => browser.storage.local.clear(resolve));
		}
	};

})();
