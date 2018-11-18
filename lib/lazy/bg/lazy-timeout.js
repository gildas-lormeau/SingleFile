/* global browser, setTimeout, clearTimeout */

this.lazyTimeout = (() => {

	"use strict";

	browser.runtime.onMessage.addListener((request, sender) => {
		if (request.setTimeoutRequest) {
			const timeoutId = setTimeout(() => {
				browser.tabs.sendMessage(sender.tab.id, { onTimeout: true, id: timeoutId });
			}, request.delay);
			return Promise.resolve(timeoutId);
		}
		if (request.clearTimeout) {
			clearTimeout(request.id);
		}
	});

})();