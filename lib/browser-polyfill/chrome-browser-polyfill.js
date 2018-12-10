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

/* global navigator */

(() => {

	const isChrome = navigator.userAgent.includes("Chrome");

	const FEATURE_TESTS = {};

	if (isChrome && !this.browser) {
		const nativeAPI = this.chrome;
		this.__defineGetter__("browser", () => ({
			browserAction: {
				onClicked: {
					addListener: listener => nativeAPI.browserAction.onClicked.addListener(listener)
				},
				enable: tabId => nativeAPI.browserAction.enable(tabId),
				disable: tabId => nativeAPI.browserAction.disable(tabId),
				setBadgeText: options => new Promise((resolve, reject) => {
					if (nativeAPI.runtime.lastError) {
						reject(nativeAPI.runtime.lastError);
					} else {
						if (!FEATURE_TESTS["browserAction.setBadgeText"] || !FEATURE_TESTS["browserAction.setBadgeText"].callbackNotSupported) {
							try {
								nativeAPI.browserAction.setBadgeText(options, resolve);
							} catch (error) {
								FEATURE_TESTS["browserAction.setBadgeText"] = { callbackNotSupported: true };
								nativeAPI.browserAction.setBadgeText(options);
								resolve();
							}
						} else {
							nativeAPI.browserAction.setBadgeText(options);
							resolve();
						}
					}
				}),
				setBadgeBackgroundColor: options => new Promise((resolve, reject) => {
					if (nativeAPI.runtime.lastError) {
						reject(nativeAPI.runtime.lastError);
					} else {
						if (!FEATURE_TESTS["browserAction.setBadgeBackgroundColor"] || !FEATURE_TESTS["browserAction.setBadgeBackgroundColor"].callbackNotSupported) {
							try {
								nativeAPI.browserAction.setBadgeBackgroundColor(options, resolve);
							} catch (error) {
								FEATURE_TESTS["browserAction.setBadgeBackgroundColor"] = { callbackNotSupported: true };
								nativeAPI.browserAction.setBadgeBackgroundColor(options);
								resolve();
							}
						} else {
							nativeAPI.browserAction.setBadgeBackgroundColor(options);
							resolve();
						}
					}
				}),
				setTitle: options => new Promise((resolve, reject) => {
					if (nativeAPI.runtime.lastError) {
						reject(nativeAPI.runtime.lastError);
					} else {
						if (!FEATURE_TESTS["browserAction.setTitle"] || !FEATURE_TESTS["browserAction.setTitle"].callbackNotSupported) {
							try {
								nativeAPI.browserAction.setTitle(options, resolve);
							} catch (error) {
								FEATURE_TESTS["browserAction.setTitle"] = { callbackNotSupported: true };
								nativeAPI.browserAction.setTitle(options);
								resolve();
							}
						} else {
							nativeAPI.browserAction.setTitle(options);
							resolve();
						}

					}
				}),
				setIcon: options => new Promise((resolve, reject) => {
					if (nativeAPI.runtime.lastError) {
						reject(nativeAPI.runtime.lastError);
					} else {
						if (!FEATURE_TESTS["browserAction.setIcon"] || !FEATURE_TESTS["browserAction.setIcon"].callbackNotSupported) {
							try {
								nativeAPI.browserAction.setIcon(options, resolve);
							} catch (error) {
								FEATURE_TESTS["browserAction.setIcon"] = { callbackNotSupported: true };
								nativeAPI.browserAction.setIcon(options);
								resolve();
							}
						} else {
							nativeAPI.browserAction.setIcon(options);
							resolve();
						}
					}
				})
			},
			downloads: {
				download: options => new Promise((resolve, reject) => {
					nativeAPI.downloads.download(options, downloadId => {
						if (nativeAPI.runtime.lastError) {
							reject(nativeAPI.runtime.lastError);
						} else {
							resolve(downloadId);
						}
					});
				}),
				onChanged: {
					addListener: listener => nativeAPI.downloads.onChanged.addListener(listener),
					removeListener: listener => nativeAPI.downloads.onChanged.removeListener(listener)
				}
			},
			i18n: {
				getMessage: (messageName, substitutions) => nativeAPI.i18n.getMessage(messageName, substitutions)
			},
			menus: {
				onClicked: {
					addListener: listener => nativeAPI.contextMenus.onClicked.addListener(listener)
				},
				create: options => nativeAPI.contextMenus.create(options),
				update: (menuItemId, options) => new Promise((resolve, reject) => {
					nativeAPI.contextMenus.update(menuItemId, options, () => {
						if (nativeAPI.runtime.lastError) {
							reject(nativeAPI.runtime.lastError);
						} else {
							resolve();
						}
					});
				}),
				removeAll: () => new Promise((resolve, reject) => {
					nativeAPI.contextMenus.removeAll(() => {
						if (nativeAPI.runtime.lastError) {
							reject(nativeAPI.runtime.lastError);
						} else {
							resolve();
						}
					});
				})
			},
			runtime: {
				onMessage: {
					addListener: listener => nativeAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
					}),
					removeListener: listener => nativeAPI.runtime.onMessage.removeListener(listener)
				},
				onMessageExternal: {
					addListener: listener => nativeAPI.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
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
					nativeAPI.runtime.sendMessage(message, response => {
						if (nativeAPI.runtime.lastError) {
							if (nativeAPI.runtime.lastError.message == "The message port closed before a response was received.") {
								resolve();
							} else {
								reject(nativeAPI.runtime.lastError);
							}
						} else {
							resolve(response);
						}
					})
				),
				getBackgroundPage: () => new Promise((resolve, reject) =>
					nativeAPI.runtime.getBackgroundPage(bgPage => {
						if (nativeAPI.runtime.lastError) {
							reject(nativeAPI.runtime.lastError);
						} else {
							resolve(bgPage);
						}
					})
				),
				getURL: (path) => nativeAPI.runtime.getURL(path),
				get lastError() {
					return nativeAPI.runtime.lastError;
				}
			},
			storage: {
				local: {
					set: value => new Promise((resolve, reject) => {
						nativeAPI.storage.local.set(value, () => {
							if (nativeAPI.runtime.lastError) {
								reject(nativeAPI.runtime.lastError);
							} else {
								resolve();
							}
						});
					}),
					get: () => new Promise((resolve, reject) => {
						nativeAPI.storage.local.get(null, value => {
							if (nativeAPI.runtime.lastError) {
								reject(nativeAPI.runtime.lastError);
							} else {
								resolve(value);
							}
						});
					}),
					clear: () => new Promise((resolve, reject) => {
						nativeAPI.storage.local.clear(() => {
							if (nativeAPI.runtime.lastError) {
								reject(nativeAPI.runtime.lastError);
							} else {
								resolve();
							}
						});
					})
				}
			},
			tabs: {
				onCreated: {
					addListener: listener => nativeAPI.tabs.onCreated.addListener(listener)
				},
				onActivated: {
					addListener: listener => nativeAPI.tabs.onActivated.addListener(listener)
				},
				onUpdated: {
					addListener: listener => nativeAPI.tabs.onUpdated.addListener(listener)
				},
				onRemoved: {
					addListener: listener => nativeAPI.tabs.onRemoved.addListener(listener)
				},
				executeScript: (tabId, details) => new Promise((resolve, reject) => {
					nativeAPI.tabs.executeScript(tabId, details, () => {
						if (nativeAPI.runtime.lastError) {
							reject(nativeAPI.runtime.lastError);
						} else {
							resolve();
						}
					});
				}),
				sendMessage: (tabId, message, options = {}) => new Promise((resolve, reject) =>
					nativeAPI.tabs.sendMessage(tabId, message, options, response => {
						if (nativeAPI.runtime.lastError) {
							if (nativeAPI.runtime.lastError.message == "The message port closed before a response was received.") {
								resolve();
							} else {
								reject(nativeAPI.runtime.lastError);
							}
						} else {
							resolve(response);
						}
					})
				),
				query: options => new Promise((resolve, reject) => {
					nativeAPI.tabs.query(options, tabs => {
						if (nativeAPI.runtime.lastError) {
							reject(nativeAPI.runtime.lastError);
						} else {
							resolve(tabs);
						}
					});
				}),
				get: options => new Promise((resolve, reject) => {
					nativeAPI.tabs.get(options, tab => {
						if (nativeAPI.runtime.lastError) {
							reject(nativeAPI.runtime.lastError);
						} else {
							resolve(tab);
						}
					});
				})
			}
		}));
	}

})();