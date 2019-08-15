/* global browser */

if (browser.devtools.inspectedWindow && browser.devtools.inspectedWindow.onResourceContentCommitted) {
	browser.devtools.inspectedWindow.onResourceContentCommitted.addListener(resource => {
		resource.getContent((content, encoding) => {
			browser.runtime.sendMessage({
				method: "devtools.resourceCommitted",
				tabId: browser.devtools.inspectedWindow.tabId,
				url: resource.url,
				content,
				encoding,
				type: resource.type
			});
		});
	});
}
