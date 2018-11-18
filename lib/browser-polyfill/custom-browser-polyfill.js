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
	const isEdge = navigator.userAgent.includes("Edge");

	const FEATURE_TESTS = {};

	let browserAPI;
	if ((isChrome && !this.browser) || isEdge) {
		if (isEdge) {
			browserAPI = this.browser;
		} else {
			browserAPI = this.chrome;
		}
		this.__defineGetter__("browser", () => ({
			browserAction: {
				onClicked: {
					addListener: listener => browserAPI.browserAction.onClicked.addListener(listener)
				},
				enable: tabId => browserAPI.browserAction.enable(tabId),
				disable: tabId => browserAPI.browserAction.disable(tabId),
				setBadgeText: options => new Promise((resolve, reject) => {
					if (browserAPI.runtime.lastError) {
						reject(browserAPI.runtime.lastError);
					} else {
						if (!FEATURE_TESTS["browserAction.setBadgeText"] || !FEATURE_TESTS["browserAction.setBadgeText"].callbackNotSupported) {
							try {
								browserAPI.browserAction.setBadgeText(options, resolve);
							} catch (error) {
								FEATURE_TESTS["browserAction.setBadgeText"] = { callbackNotSupported: true };
								browserAPI.browserAction.setBadgeText(options);
								resolve();
							}
						} else {
							browserAPI.browserAction.setBadgeText(options);
							resolve();
						}
					}
				}),
				setBadgeBackgroundColor: options => new Promise((resolve, reject) => {
					if (browserAPI.runtime.lastError) {
						reject(browserAPI.runtime.lastError);
					} else {
						if (!FEATURE_TESTS["browserAction.setBadgeBackgroundColor"] || !FEATURE_TESTS["browserAction.setBadgeBackgroundColor"].callbackNotSupported) {
							try {
								browserAPI.browserAction.setBadgeBackgroundColor(options, resolve);
							} catch (error) {
								FEATURE_TESTS["browserAction.setBadgeBackgroundColor"] = { callbackNotSupported: true };
								browserAPI.browserAction.setBadgeBackgroundColor(options);
								resolve();
							}
						} else {
							browserAPI.browserAction.setBadgeBackgroundColor(options);
							resolve();
						}
					}
				}),
				setTitle: options => new Promise((resolve, reject) => {
					if (browserAPI.runtime.lastError) {
						reject(browserAPI.runtime.lastError);
					} else {
						if (!FEATURE_TESTS["browserAction.setTitle"] || !FEATURE_TESTS["browserAction.setTitle"].callbackNotSupported) {
							try {
								browserAPI.browserAction.setTitle(options, resolve);
							} catch (error) {
								FEATURE_TESTS["browserAction.setTitle"] = { callbackNotSupported: true };
								browserAPI.browserAction.setTitle(options);
								resolve();
							}
						} else {
							browserAPI.browserAction.setTitle(options);
							resolve();
						}

					}
				}),
				setIcon: options => new Promise((resolve, reject) => {
					if (browserAPI.runtime.lastError) {
						reject(browserAPI.runtime.lastError);
					} else {
						if (!FEATURE_TESTS["browserAction.setIcon"] || !FEATURE_TESTS["browserAction.setIcon"].callbackNotSupported) {
							try {
								browserAPI.browserAction.setIcon(options, resolve);
							} catch (error) {
								FEATURE_TESTS["browserAction.setIcon"] = { callbackNotSupported: true };
								browserAPI.browserAction.setIcon(options);
								resolve();
							}
						} else {
							browserAPI.browserAction.setIcon(options);
							resolve();
						}
					}
				})
			},
			downloads: {
				download: options => new Promise((resolve, reject) => {
					browserAPI.downloads.download(options, downloadId => {
						if (browserAPI.runtime.lastError) {
							reject(browserAPI.runtime.lastError);
						} else {
							resolve(downloadId);
						}
					});
				}),
				onChanged: {
					addListener: listener => browserAPI.downloads.onChanged.addListener(listener),
					removeListener: listener => browserAPI.downloads.onChanged.removeListener(listener)
				}
			},
			i18n: {
				getMessage: (messageName, substitutions) => browserAPI.i18n.getMessage(messageName, substitutions)
			},
			menus: {
				onClicked: {
					addListener: listener => browserAPI.contextMenus.onClicked.addListener(listener)
				},
				create: options => browserAPI.contextMenus.create(options),
				update: (menuItemId, options) => new Promise((resolve, reject) => {
					browserAPI.contextMenus.update(menuItemId, options, () => {
						if (browserAPI.runtime.lastError) {
							reject(browserAPI.runtime.lastError);
						} else {
							resolve();
						}
					});
				}),
				removeAll: () => new Promise((resolve, reject) => {
					browserAPI.contextMenus.removeAll(() => {
						if (browserAPI.runtime.lastError) {
							reject(browserAPI.runtime.lastError);
						} else {
							resolve();
						}
					});
				})
			},
			runtime: {
				onMessage: {
					addListener: listener => browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
					removeListener: listener => browserAPI.runtime.onMessage.removeListener(listener)
				},
				onMessageExternal: {
					addListener: listener => browserAPI.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
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
					browserAPI.runtime.sendMessage(message, response => {
						if (browserAPI.runtime.lastError) {
							if (browserAPI.runtime.lastError.message == "The message port closed before a response was received.") {
								resolve();
							} else {
								reject(browserAPI.runtime.lastError);
							}
						} else {
							resolve(response);
						}
					})
				),
				getBackgroundPage: () => new Promise((resolve, reject) =>
					browserAPI.runtime.getBackgroundPage(bgPage => {
						if (browserAPI.runtime.lastError) {
							reject(browserAPI.runtime.lastError);
						} else {
							resolve(bgPage);
						}
					})
				),
				getURL: (path) => browserAPI.runtime.getURL(path),
				get lastError() {
					return browserAPI.runtime.lastError;
				}
			},
			storage: {
				local: {
					set: value => new Promise((resolve, reject) => {
						browserAPI.storage.local.set(value, () => {
							if (browserAPI.runtime.lastError) {
								reject(browserAPI.runtime.lastError);
							} else {
								resolve();
							}
						});
					}),
					get: () => new Promise((resolve, reject) => {
						browserAPI.storage.local.get(null, value => {
							if (browserAPI.runtime.lastError) {
								reject(browserAPI.runtime.lastError);
							} else {
								resolve(value);
							}
						});
					}),
					clear: () => new Promise((resolve, reject) => {
						browserAPI.storage.local.clear(() => {
							if (browserAPI.runtime.lastError) {
								reject(browserAPI.runtime.lastError);
							} else {
								resolve();
							}
						});
					})
				}
			},
			tabs: {
				onCreated: {
					addListener: listener => browserAPI.tabs.onCreated.addListener(listener)
				},
				onActivated: {
					addListener: listener => browserAPI.tabs.onActivated.addListener(listener)
				},
				onUpdated: {
					addListener: listener => browserAPI.tabs.onUpdated.addListener(listener)
				},
				onRemoved: {
					addListener: listener => browserAPI.tabs.onRemoved.addListener(listener)
				},
				executeScript: (tabId, details) => new Promise((resolve, reject) => {
					browserAPI.tabs.executeScript(tabId, details, () => {
						if (browserAPI.runtime.lastError) {
							reject(browserAPI.runtime.lastError);
						} else {
							resolve();
						}
					});
				}),
				sendMessage: (tabId, message, options = {}) => new Promise((resolve, reject) =>
					browserAPI.tabs.sendMessage(tabId, message, options, response => {
						if (browserAPI.runtime.lastError) {
							if (browserAPI.runtime.lastError.message == "The message port closed before a response was received.") {
								resolve();
							} else {
								reject(browserAPI.runtime.lastError);
							}
						} else {
							resolve(response);
						}
					})
				),
				query: options => new Promise((resolve, reject) => {
					browserAPI.tabs.query(options, tabs => {
						if (browserAPI.runtime.lastError) {
							reject(browserAPI.runtime.lastError);
						} else {
							resolve(tabs);
						}
					});
				}),
				get: options => new Promise((resolve, reject) => {
					browserAPI.tabs.get(options, tab => {
						if (browserAPI.runtime.lastError) {
							reject(browserAPI.runtime.lastError);
						} else {
							resolve(tab);
						}
					});
				})
			}
		}));
	}

})();