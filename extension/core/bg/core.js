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

singlefile.core = (() => {

	const FORBIDDEN_URLS = ["https://chrome.google.com", "https://addons.mozilla.org"];

	return { saveTab, autoSaveTab, isAllowedURL };

	async function saveTab(tab, options) {
		const [config, tabsData] = await Promise.all([singlefile.config.get(), singlefile.tabsData.get()]);
		const mergedOptions = config.profiles[tabsData.profileName || singlefile.config.DEFAULT_PROFILE_NAME];
		Object.keys(options).forEach(key => mergedOptions[key] = options[key]);
		return singlefile.runner.saveTab(tab, mergedOptions);
	}

	async function autoSaveTab(tab) {
		const [config, tabsData] = await Promise.all([singlefile.config.get(), singlefile.tabsData.get()]);
		const options = config.profiles[tabsData.profileName || singlefile.config.DEFAULT_PROFILE_NAME];
		if (singlefile.autosave.enabled(tab.id)) {
			await browser.tabs.sendMessage(tab.id, { autoSavePage: true, options });
		}
	}

	function isAllowedURL(url) {
		return url && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("file://")) && !FORBIDDEN_URLS.find(storeUrl => url.startsWith(storeUrl));
	}

})();
