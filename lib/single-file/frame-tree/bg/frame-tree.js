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

/* global browser */

this.FrameTree = (() => {

	const tabsData = {};
	let sessionId = 0;

	browser.runtime.onMessage.addListener((message, sender) => {
		if (message.method == "FrameTree.initResponse") {
			if (tabsData[sender.tab.id]) {
				tabsData[sender.tab.id].forEach(resolve => resolve());
				tabsData[sender.tab.id] = null;
			}
		}
	});

	return {
		async initialize(tabId, options) {
			return new Promise(resolve => {
				if (tabsData[tabId]) {
					tabsData[tabId].push(resolve);
				} else {
					tabsData[tabId] = [resolve];
				}
				options.sessionId = sessionId;
				sessionId++;
				browser.tabs.sendMessage(tabId, { method: "FrameTree.initRequest", windowId: "0", sessionId: options.sessionId, options });
			});
		}
	};
})();