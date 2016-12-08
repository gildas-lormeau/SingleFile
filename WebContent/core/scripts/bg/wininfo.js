var wininfo = {
	init : function(tabId, callback) {
		chrome.extension.onMessage.addListener(function(message) {
			// console.log("wininfo.onMessage", tabId, message);
			if (message.initResponse)
				callback(message.processableDocs);
		});
		chrome.tabs.sendMessage(tabId, {
			initRequest : true,
			winId : "0",
			index : 0
		});
	}
};
