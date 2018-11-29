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

	async function saveTab(tab, processOptions) {
		const options = await singlefile.config.get();
		Object.keys(processOptions).forEach(key => options[key] = processOptions[key]);
		return singlefile.scriptLoader.executeScripts(tab, options);
	}

	async function autoSaveTab(tab) {
		const options = await singlefile.config.get();
		await browser.tabs.sendMessage(tab.id, { autoSavePage: true, options });
	}

	function isAllowedURL(url) {
		return url && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("file://")) && !FORBIDDEN_URLS.find(storeUrl => url.startsWith(storeUrl));
	}

})();
