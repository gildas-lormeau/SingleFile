/*
 * Copyright 2010-2019 Gildas Lormeau
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

/* global singlefile */

singlefile.extension.ui.bg.main = (() => {

	return {
		onMessage(message, sender) {
			if (message.method.endsWith(".refreshMenu")) {
				return singlefile.extension.ui.bg.menu.onMessage(message, sender);
			} else {
				return singlefile.extension.ui.bg.button.onMessage(message, sender);
			}
		},
		async refreshTab(tab) {
			return Promise.all([singlefile.extension.ui.bg.menu.refreshTab(tab), singlefile.extension.ui.bg.button.refreshTab(tab)]);
		},
		onForbiddenDomain(tab) {
			singlefile.extension.ui.bg.button.onForbiddenDomain(tab);
		},
		onInitialize(tabId, step, autoSave) {
			singlefile.extension.ui.bg.button.onInitialize(tabId, step, autoSave);
		},
		onProgress(tabId, index, maxIndex) {
			singlefile.extension.ui.bg.button.onProgress(tabId, index, maxIndex);
		},
		onError(tabId) {
			singlefile.extension.ui.bg.button.onError(tabId);
		},
		onEnd(tabId, autoSave) {
			singlefile.extension.ui.bg.button.onEnd(tabId, autoSave);
		},
		onTabCreated(tab) {
			singlefile.extension.ui.bg.menu.onTabCreated(tab);
		},
		onTabActivated(tab, activeInfo) {
			singlefile.extension.ui.bg.menu.onTabActivated(tab, activeInfo);
		},
		onTabUpdated(tabId, changeInfo, tab) {
			singlefile.extension.ui.bg.menu.onTabUpdated(tabId, changeInfo, tab);
		}
	};

})();