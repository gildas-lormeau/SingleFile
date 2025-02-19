/*
 * Copyright 2010-2020 Gildas Lormeau
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

/* global browser, setTimeout, clearTimeout */

const timeouts = new Map();

browser.runtime.onMessage.addListener((message, sender) => {
	if (message.method == "singlefile.lazyTimeout.setTimeout") {
		let tabTimeouts = timeouts.get(sender.tab.id);
		let frameTimeouts;
		if (tabTimeouts) {
			frameTimeouts = tabTimeouts.get(sender.frameId);
			if (frameTimeouts) {
				const previousTimeoutId = frameTimeouts.get(message.type);
				if (previousTimeoutId) {
					clearTimeout(previousTimeoutId);
				}
			} else {
				frameTimeouts = new Map();
			}
		}
		const timeoutId = setTimeout(async () => {
			try {
				const tabTimeouts = timeouts.get(sender.tab.id);
				const frameTimeouts = tabTimeouts.get(sender.frameId);
				if (tabTimeouts && frameTimeouts) {
					deleteTimeout(frameTimeouts, message.type);
				}
				await browser.tabs.sendMessage(sender.tab.id, { method: "singlefile.lazyTimeout.onTimeout", type: message.type });
				// eslint-disable-next-line no-unused-vars
			} catch (error) {
				// ignored
			}
		}, message.delay);
		if (!tabTimeouts) {
			tabTimeouts = new Map();
			frameTimeouts = new Map();
			tabTimeouts.set(sender.frameId, frameTimeouts);
			timeouts.set(sender.tab.id, tabTimeouts);
		}
		frameTimeouts.set(message.type, timeoutId);
		return Promise.resolve({});
	}
	if (message.method == "singlefile.lazyTimeout.clearTimeout") {
		let tabTimeouts = timeouts.get(sender.tab.id);
		if (tabTimeouts) {
			const frameTimeouts = tabTimeouts.get(sender.frameId);
			if (frameTimeouts) {
				const timeoutId = frameTimeouts.get(message.type);
				if (timeoutId) {
					clearTimeout(timeoutId);
				}
				deleteTimeout(frameTimeouts, message.type);
			}
		}
		return Promise.resolve({});
	}
});

browser.tabs.onRemoved.addListener(tabId => timeouts.delete(tabId));

function deleteTimeout(framesTimeouts, type) {
	framesTimeouts.delete(type);
}