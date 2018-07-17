/* global navigator, chrome */

(() => {

	const isChrome = navigator.userAgent.includes("Chrome");

	if (isChrome) {
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
						chrome.browserAction.setBadgeText(options, resolve);
					}
				}),
				setBadgeBackgroundColor: options => new Promise((resolve, reject) => {
					if (chrome.runtime.lastError) {
						reject(chrome.runtime.lastError);
					} else {
						chrome.browserAction.setBadgeBackgroundColor(options, resolve);
					}
				}),
				setTitle: options => new Promise((resolve, reject) => {
					if (chrome.runtime.lastError) {
						reject(chrome.runtime.lastError);
					} else {
						chrome.browserAction.setTitle(options, resolve);
					}
				}),
				setIcon: options => new Promise((resolve, reject) => {
					if (chrome.runtime.lastError) {
						reject(chrome.runtime.lastError);
					} else {
						chrome.browserAction.setIcon(options, resolve);
					}
				})
			},
			menus: {
				onClicked: {
					addListener: listener => chrome.contextMenus.onClicked.addListener(listener)
				},
				create: options => chrome.contextMenus.create(options),
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
							response.then(sendResponse);
							return true;
						}
					}),
					removeListener: () => { }
				},
				sendMessage: message => new Promise((resolve, reject) =>
					chrome.runtime.sendMessage(message, response => {
						if (chrome.runtime.lastError) {
							reject(chrome.runtime.lastError);
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
				sendMessage: (tabId, message) => new Promise((resolve, reject) =>
					chrome.tabs.sendMessage(tabId, message, response => {
						if (chrome.runtime.lastError) {
							reject(chrome.runtime.lastError);
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