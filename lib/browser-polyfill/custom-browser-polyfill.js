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

/* global navigator, chrome */

(() => {

	const isChrome = navigator.userAgent.includes("Chrome");

	const FEATURE_TESTS = {};

	if (isChrome && !this.browser) {
		this.browser = {
			browserAction: {
				onClicked: {
					addListener: listener => chrome.browserAction.onClicked.addListener(listener)
				},
				enable: tabId => chrome.browserAction.enable(tabId),
				disable: tabId => chrome.browserAction.disable(tabId),
				setBadgeText: options => new Promise((resolve, reject) => {
					if (chrome.runtime.lastError) {
						reject(chrome.runtime.lastError);
					} else {
						try {
							if (!FEATURE_TESTS["browserAction.setBadgeText"] || !FEATURE_TESTS["browserAction.setBadgeText"].callbackNotSupported) {
								chrome.browserAction.setBadgeText(options, resolve);
							} else {
								chrome.browserAction.setBadgeText(options);
								resolve();
							}
						} catch (error) {
							FEATURE_TESTS["browserAction.setBadgeText"] = { callbackNotSupported: false };
							chrome.browserAction.setBadgeText(options);
							resolve();
						}
					}
				}),
				setBadgeBackgroundColor: options => new Promise((resolve, reject) => {
					if (chrome.runtime.lastError) {
						reject(chrome.runtime.lastError);
					} else {
						try {
							if (!FEATURE_TESTS["browserAction.setBadgeBackgroundColor"] || !FEATURE_TESTS["browserAction.setBadgeBackgroundColor"].callbackNotSupported) {
								chrome.browserAction.setBadgeBackgroundColor(options, resolve);
							} else {
								chrome.browserAction.setBadgeBackgroundColor(options);
								resolve();
							}
						} catch (error) {
							FEATURE_TESTS["browserAction.setBadgeBackgroundColor"] = { callbackNotSupported: false };
							chrome.browserAction.setBadgeBackgroundColor(options);
							resolve();
						}
					}
				}),
				setTitle: options => new Promise((resolve, reject) => {
					if (chrome.runtime.lastError) {
						reject(chrome.runtime.lastError);
					} else {
						try {
							if (!FEATURE_TESTS["browserAction.setTitle"] || !FEATURE_TESTS["browserAction.setTitle"].callbackNotSupported) {
								chrome.browserAction.setTitle(options, resolve);
							} else {
								chrome.browserAction.setTitle(options);
								resolve();
							}
						} catch (error) {
							FEATURE_TESTS["browserAction.setTitle"] = { callbackNotSupported: false };
							chrome.browserAction.setTitle(options);
							resolve();
						}
					}
				}),
				setIcon: options => new Promise((resolve, reject) => {
					if (chrome.runtime.lastError) {
						reject(chrome.runtime.lastError);
					} else {
						try {
							if (!FEATURE_TESTS["browserAction.setIcon"] || !FEATURE_TESTS["browserAction.setIcon"].callbackNotSupported) {
								chrome.browserAction.setIcon(options, resolve);
							} else {
								chrome.browserAction.setIcon(options);
								resolve();
							}
						} catch (error) {
							FEATURE_TESTS["browserAction.setIcon"] = { callbackNotSupported: false };
							chrome.browserAction.setIcon(options);
							resolve();
						}
					}
				})
			},
			downloads: {
				download: options => new Promise((resolve, reject) => {
					chrome.downloads.download(options, downloadId => {
						if (chrome.runtime.lastError) {
							reject(chrome.runtime.lastError);
						} else {
							resolve(downloadId);
						}
					});
				}),
				onChanged: {
					addListener: listener => chrome.downloads.onChanged.addListener(listener),
					removeListener: listener => chrome.downloads.onChanged.removeListener(listener)
				}
			},
			menus: {
				onClicked: {
					addListener: listener => chrome.contextMenus.onClicked.addListener(listener)
				},
				create: options => chrome.contextMenus.create(options),
				update: (menuItemId, options) => new Promise((resolve, reject) => {
					chrome.contextMenus.update(menuItemId, options, () => {
						if (chrome.runtime.lastError) {
							reject(chrome.runtime.lastError);
						} else {
							resolve();
						}
					});
				}),
				removeAll: () => new Promise((resolve, reject) => {
					chrome.contextMenus.removeAll(() => {
						if (chrome.runtime.lastError) {
							reject(chrome.runtime.lastError);
						} else {
							resolve();
						}
					});
				})
			},
			runtime: {
				onMessage: {
					addListener: listener => chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
						const response = listener(message, sender);
						if (response && typeof response.then == "function") {
							response
								.then(response => {
									if (response !== undefined) {
										try {
											sendResponse(response);
										} catch (error) {
											/* ignored */
										}
									}
								});
							return true;
						}
					})
				},
				onMessageExternal: {
					addListener: listener => chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
						const response = listener(message, sender);
						if (response && typeof response.then == "function") {
							response
								.then(response => {
									if (response !== undefined) {
										try {
											sendResponse(response);
										} catch (error) {
											/* ignored */
										}
									}
								});
							return true;
						}
					})
				},
				sendMessage: message => new Promise((resolve, reject) =>
					chrome.runtime.sendMessage(message, response => {
						if (chrome.runtime.lastError) {
							if (chrome.runtime.lastError.message == "The message port closed before a response was received.") {
								resolve();
							} else {
								reject(chrome.runtime.lastError);
							}
						} else {
							resolve(response);
						}
					})
				),
				getBackgroundPage: () => new Promise((resolve, reject) =>
					chrome.runtime.getBackgroundPage(bgPage => {
						if (chrome.runtime.lastError) {
							reject(chrome.runtime.lastError);
						} else {
							resolve(bgPage);
						}
					})
				),
				getPlatformInfo: () => new Promise((resolve, reject) =>
					chrome.runtime.getPlatformInfo(info => {
						if (chrome.runtime.lastError) {
							reject(chrome.runtime.lastError);
						} else {
							resolve(info);
						}
					})
				),
				getURL: (path) => chrome.runtime.getURL(path),
				onInstalled: {
					addListener: listener => chrome.runtime.onInstalled.addListener(listener)
				},
				get lastError() {
					return chrome.runtime.lastError;
				}
			},
			storage: {
				local: {
					set: value => new Promise((resolve, reject) => {
						chrome.storage.local.set(value, () => {
							if (chrome.runtime.lastError) {
								reject(chrome.runtime.lastError);
							} else {
								resolve();
							}
						});
					}),
					get: () => new Promise((resolve, reject) => {
						chrome.storage.local.get(value => {
							if (chrome.runtime.lastError) {
								reject(chrome.runtime.lastError);
							} else {
								resolve(value);
							}
						});
					}),
					clear: () => new Promise((resolve, reject) => {
						chrome.storage.local.clear(() => {
							if (chrome.runtime.lastError) {
								reject(chrome.runtime.lastError);
							} else {
								resolve();
							}
						});
					})
				}
			},
			tabs: {
				onCreated: {
					addListener: listener => chrome.tabs.onCreated.addListener(listener)
				},
				onActivated: {
					addListener: listener => chrome.tabs.onActivated.addListener(listener)
				},
				onUpdated: {
					addListener: listener => chrome.tabs.onUpdated.addListener(listener)
				},
				onRemoved: {
					addListener: listener => chrome.tabs.onRemoved.addListener(listener)
				},
				executeScript: (tabId, details) => new Promise((resolve, reject) => {
					chrome.tabs.executeScript(tabId, details, () => {
						if (chrome.runtime.lastError) {
							reject(chrome.runtime.lastError);
						} else {
							resolve();
						}
					});
				}),
				sendMessage: (tabId, message, options = {}) => new Promise((resolve, reject) =>
					chrome.tabs.sendMessage(tabId, message, options, response => {
						if (chrome.runtime.lastError) {
							if (chrome.runtime.lastError.message == "The message port closed before a response was received.") {
								resolve();
							} else {
								reject(chrome.runtime.lastError);
							}
						} else {
							resolve(response);
						}
					})
				),
				query: options => new Promise((resolve, reject) => {
					chrome.tabs.query(options, tabs => {
						if (chrome.runtime.lastError) {
							reject(chrome.runtime.lastError);
						} else {
							resolve(tabs);
						}
					});
				}),
				get: options => new Promise((resolve, reject) => {
					chrome.tabs.get(options, tab => {
						if (chrome.runtime.lastError) {
							reject(chrome.runtime.lastError);
						} else {
							resolve(tab);
						}
					});
				})
			}
		};
	}

})();