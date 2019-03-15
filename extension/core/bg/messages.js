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

/* global browser, singlefile, */

singlefile.messages = (() => {

	browser.runtime.onMessage.addListener((message, sender) => {
		if (message.loadFileURI || message.savePage) {
			return singlefile.tabs.onMessage(message, sender);
		}
		if (message.download) {
			return singlefile.download.onMessage(message, sender);
		}
		if (message.initAutoSave || message.autoSaveContent) {
			return singlefile.autosave.onMessage(message, sender);
		}
		if (message.loadURL || message.processProgress || message.processEnd || message.processError || message.processCancelled || message.refreshMenu) {
			return singlefile.ui.onMessage(message, sender);
		}
		if (message.getConfigConstants || message.deleteRules || message.deleteRule || message.addRule || message.getRules ||
			message.createProfile || message.renameProfile || message.deleteProfile || message.resetProfiles || message.getProfiles ||
			message.resetProfile || message.exportConfig || message.importConfig || message.updateProfile || message.updateRule) {
			return singlefile.config.onMessage(message, sender);
		}
		if (message.getTabsData || message.setTabsData) {
			return singlefile.tabsData.onMessage(message, sender);
		}
	});
	if (browser.runtime.onMessageExternal) {
		browser.runtime.onMessageExternal.addListener(async (message, sender) => {
			const tabs = await singlefile.tabs.get({ currentWindow: true, active: true });
			const currentTab = tabs[0];
			if (currentTab && singlefile.util.isAllowedURL(currentTab.url)) {
				return singlefile.autosave.onMessageExternal(message, currentTab, sender);
			} else {
				return false;
			}
		});
	}
	return {};

})();