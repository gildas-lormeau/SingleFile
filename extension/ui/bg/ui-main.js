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
				return singlefile.extension.ui.bg.menus.onMessage(message, sender);
			} else {
				return singlefile.extension.ui.bg.button.onMessage(message, sender);
			}
		},
		async refreshTab(tab) {
			return Promise.all([singlefile.extension.ui.bg.menus.refreshTab(tab), singlefile.extension.ui.bg.button.refreshTab(tab)]);
		},
		onForbiddenDomain(tab) {
			singlefile.extension.ui.bg.button.onForbiddenDomain(tab);
		},
		onStart(tabId, step, autoSave) {
			singlefile.extension.ui.bg.button.onStart(tabId, step, autoSave);
		},
		onError(tabId) {
			singlefile.extension.ui.bg.button.onError(tabId);
		},
		onEdit(tabId) {
			singlefile.extension.ui.bg.button.onEdit(tabId);
		},
		onEnd(tabId, autoSave) {
			singlefile.extension.ui.bg.button.onEnd(tabId, autoSave);
		},
		onCancelled(tabId) {
			singlefile.extension.ui.bg.button.onCancelled(tabId);
		},
		onUploadProgress(tabId, index, maxIndex) {
			singlefile.extension.ui.bg.button.onUploadProgress(tabId, index, maxIndex);
		},
		onTabCreated(tab) {
			singlefile.extension.ui.bg.menus.onTabCreated(tab);
		},
		onTabActivated(tab, activeInfo) {
			singlefile.extension.ui.bg.menus.onTabActivated(tab, activeInfo);
		},
		onTabUpdated(tabId, changeInfo, tab) {
			singlefile.extension.ui.bg.menus.onTabUpdated(tabId, changeInfo, tab);
		}
	};

})();