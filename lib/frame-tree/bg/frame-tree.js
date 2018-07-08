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

/* global chrome */

this.FrameTree = (() => {
	chrome.runtime.onMessage.addListener((message, sender) => {
		if (message.method == "FrameTree.getDataRequest") {
			chrome.tabs.sendMessage(sender.tab.id, { method: "FrameTree.getDataRequest", windowId: message.windowId, tabId: sender.tab.id });
		}
		if (message.method == "FrameTree.getDataResponse") {
			chrome.tabs.sendMessage(message.tabId, { method: "FrameTree.getDataResponse", windowId: message.windowId, content: message.content, baseURI: message.baseURI });
		}
	});

	return {
		async initialize(tabId) {
			return new Promise(resolve => {
				chrome.runtime.onMessage.addListener(message => {
					if (message.method == "FrameTree.initResponse") {
						resolve();
					}
				});
				chrome.tabs.sendMessage(tabId, { method: "FrameTree.initRequest", windowId: "0", index: 0 });
			});
		}
	};
})();