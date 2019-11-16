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

(() => {

	const FEATURE_TESTS = {};

	if (!this.browser && this.chrome) {
		const nativeAPI = this.chrome;
		this.__defineGetter__("browser", () => ({
			browserAction: {
				onClicked: {
					addListener: listener => nativeAPI.browserAction.onClicked.addListener(listener)
				},
				setBadgeText: options => new Promise((resolve, reject) => {
					if (!FEATURE_TESTS["browserAction.setBadgeText"] || !FEATURE_TESTS["browserAction.setBadgeText"].callbackNotSupported) {
						try {
							nativeAPI.browserAction.setBadgeText(options, () => {
								if (nativeAPI.runtime.lastError) {
									reject(nativeAPI.runtime.lastError);
								} else {
									resolve();
								}
							});
						} catch (error) {
							FEATURE_TESTS["browserAction.setBadgeText"] = { callbackNotSupported: true };
						}
					}
					if (FEATURE_TESTS["browserAction.setBadgeText"] && FEATURE_TESTS["browserAction.setBadgeText"].callbackNotSupported) {
						nativeAPI.browserAction.setBadgeText(options);
						if (nativeAPI.runtime.lastError) {
							reject(nativeAPI.runtime.lastError);
						} else {
							resolve();
						}
					}
				}),
				setBadgeBackgroundColor: options => new Promise((resolve, reject) => {
					if (!FEATURE_TESTS["browserAction.setBadgeBackgroundColor"] || !FEATURE_TESTS["browserAction.setBadgeBackgroundColor"].callbackNotSupported) {
						try {
							nativeAPI.browserAction.setBadgeBackgroundColor(options, () => {
								if (nativeAPI.runtime.lastError) {
									reject(nativeAPI.runtime.lastError);
								} else {
									resolve();
								}
							});
						} catch (error) {
							FEATURE_TESTS["browserAction.setBadgeBackgroundColor"] = { callbackNotSupported: true };
						}
					}
					if (FEATURE_TESTS["browserAction.setBadgeBackgroundColor"] && FEATURE_TESTS["browserAction.setBadgeBackgroundColor"].callbackNotSupported) {
						nativeAPI.browserAction.setBadgeBackgroundColor(options);
						if (nativeAPI.runtime.lastError) {
							reject(nativeAPI.runtime.lastError);
						} else {
							resolve();
						}
					}
				}),
				setTitle: options => new Promise((resolve, reject) => {
					if (!FEATURE_TESTS["browserAction.setTitle"] || !FEATURE_TESTS["browserAction.setTitle"].callbackNotSupported) {
						try {
							nativeAPI.browserAction.setTitle(options, () => {
								if (nativeAPI.runtime.lastError) {
									reject(nativeAPI.runtime.lastError);
								} else {
									resolve();
								}
							});
						} catch (error) {
							FEATURE_TESTS["browserAction.setTitle"] = { callbackNotSupported: true };
						}
					}
					if (FEATURE_TESTS["browserAction.setTitle"] && FEATURE_TESTS["browserAction.setTitle"].callbackNotSupported) {
						nativeAPI.browserAction.setTitle(options);
						if (nativeAPI.runtime.lastError) {
							reject(nativeAPI.runtime.lastError);
						} else {
							resolve();
						}
					}
				}),
				setIcon: options => new Promise((resolve, reject) => {
					if (!FEATURE_TESTS["browserAction.setIcon"] || !FEATURE_TESTS["browserAction.setIcon"].callbackNotSupported) {
						try {
							nativeAPI.browserAction.setIcon(options, () => {
								if (nativeAPI.runtime.lastError) {
									reject(nativeAPI.runtime.lastError);
								} else {
									resolve();
								}
							});
						} catch (error) {
							FEATURE_TESTS["browserAction.setIcon"] = { callbackNotSupported: true };
						}
					}
					if (FEATURE_TESTS["browserAction.setIcon"] && FEATURE_TESTS["browserAction.setIcon"].callbackNotSupported) {
						nativeAPI.browserAction.setIcon(options);
						if (nativeAPI.runtime.lastError) {
							reject(nativeAPI.runtime.lastError);
						} else {
							resolve();
						}
					}
				})
			},
			commands: {
				onCommand: {
					addListener: listener => nativeAPI.commands.onCommand.addListener(listener)
				}
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
			identity: {
				get getAuthToken() {
					return nativeAPI.identity && nativeAPI.identity.getAuthToken && (details => new Promise((resolve, reject) =>
						nativeAPI.identity.getAuthToken(details, token => {
							if (nativeAPI.runtime.lastError) {
								reject(nativeAPI.runtime.lastError);
							} else {
								resolve(token);
							}
						})
					));
				},
				get launchWebAuthFlow() {
					return nativeAPI.identity && nativeAPI.identity.launchWebAuthFlow && (options => new Promise((resolve, reject) => {
						nativeAPI.identity.launchWebAuthFlow(options, responseUrl => {
							if (nativeAPI.runtime.lastError) {
								reject(nativeAPI.runtime.lastError);
							} else {
								resolve(responseUrl);
							}
						});
					}));
				},
				get removeCachedAuthToken() {
					return nativeAPI.identity && nativeAPI.identity.removeCachedAuthToken && (details => new Promise((resolve, reject) =>
						nativeAPI.identity.removeCachedAuthToken(details, () => {
							if (nativeAPI.runtime.lastError) {
								reject(nativeAPI.runtime.lastError);
							} else {
								resolve();
							}
						})
					));
				}
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
			permissions: {
				request: permissions => new Promise((resolve, reject) => {
					nativeAPI.permissions.request(permissions, () => {
						if (nativeAPI.runtime.lastError) {
							reject(nativeAPI.runtime.lastError);
						} else {
							resolve();
						}
					});
				})
			},
			runtime: {
				getManifest: () => nativeAPI.runtime.getManifest(),
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
											// ignored
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
											// ignored
										}
									}
								});
							return true;
						}
					})
				},
				sendMessage: message => new Promise((resolve, reject) => {
					nativeAPI.runtime.sendMessage(message, response => {
						if (nativeAPI.runtime.lastError) {
							reject(nativeAPI.runtime.lastError);
						} else {
							resolve(response);
						}
					});
					if (nativeAPI.runtime.lastError) {
						reject(nativeAPI.runtime.lastError);
					}
				}),
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
					}),
					remove: keys => new Promise((resolve, reject) => {
						nativeAPI.storage.local.remove(keys, () => {
							if (nativeAPI.runtime.lastError) {
								reject(nativeAPI.runtime.lastError);
							} else {
								resolve();
							}
						});
					})
				},
				sync: {
					set: value => new Promise((resolve, reject) => {
						nativeAPI.storage.sync.set(value, () => {
							if (nativeAPI.runtime.lastError) {
								reject(nativeAPI.runtime.lastError);
							} else {
								resolve();
							}
						});
					}),
					get: () => new Promise((resolve, reject) => {
						nativeAPI.storage.sync.get(null, value => {
							if (nativeAPI.runtime.lastError) {
								reject(nativeAPI.runtime.lastError);
							} else {
								resolve(value);
							}
						});
					}),
					clear: () => new Promise((resolve, reject) => {
						nativeAPI.storage.sync.clear(() => {
							if (nativeAPI.runtime.lastError) {
								reject(nativeAPI.runtime.lastError);
							} else {
								resolve();
							}
						});
					}),
					remove: keys => new Promise((resolve, reject) => {
						nativeAPI.storage.sync.remove(keys, () => {
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
					addListener: listener => nativeAPI.tabs.onUpdated.addListener(listener),
					removeListener: listener => nativeAPI.tabs.onUpdated.removeListener(listener)
				},
				onRemoved: {
					addListener: listener => nativeAPI.tabs.onRemoved.addListener(listener),
					removeListener: listener => nativeAPI.tabs.onRemoved.removeListener(listener)
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
				sendMessage: (tabId, message, options = {}) => new Promise((resolve, reject) => {
					nativeAPI.tabs.sendMessage(tabId, message, options, response => {
						if (nativeAPI.runtime.lastError) {
							reject(nativeAPI.runtime.lastError);
						} else {
							resolve(response);
						}
					});
					if (nativeAPI.runtime.lastError) {
						reject(nativeAPI.runtime.lastError);
					}
				}),
				query: options => new Promise((resolve, reject) => {
					nativeAPI.tabs.query(options, tabs => {
						if (nativeAPI.runtime.lastError) {
							reject(nativeAPI.runtime.lastError);
						} else {
							resolve(tabs);
						}
					});
				}),
				create: createProperties => new Promise((resolve, reject) => {
					nativeAPI.tabs.create(createProperties, tab => {
						if (nativeAPI.runtime.lastError) {
							reject(nativeAPI.runtime.lastError);
						} else {
							resolve(tab);
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
				}),
				remove: tabId => new Promise((resolve, reject) => {
					nativeAPI.tabs.remove(tabId, () => {
						if (nativeAPI.runtime.lastError) {
							reject(nativeAPI.runtime.lastError);
						} else {
							resolve();
						}
					});
				}),
				update: (tabId, updateProperties) => new Promise((resolve, reject) => {
					nativeAPI.tabs.update(tabId, updateProperties, tab => {
						if (nativeAPI.runtime.lastError) {
							reject(nativeAPI.runtime.lastError);
						} else {
							resolve(tab);
						}
					});
				})
			},
			devtools: nativeAPI.devtools && {
				inspectedWindow: nativeAPI.devtools.inspectedWindow && {
					onResourceContentCommitted: nativeAPI.devtools.inspectedWindow.onResourceContentCommitted && {
						addListener: listener => nativeAPI.devtools.inspectedWindow.onResourceContentCommitted.addListener(listener)
					},
					get tabId() {
						return nativeAPI.devtools.inspectedWindow.tabId;
					}
				}
			}
		}));
	}

})();