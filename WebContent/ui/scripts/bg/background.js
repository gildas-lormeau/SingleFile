/*
 * Copyright 2011 Gildas Lormeau
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

(function() {

	var dev = false;
	
	var isChrome = navigator.vendor.indexOf("Google") != -1;
	var isOpera = navigator.vendor.indexOf("Opera") != -1;

	var extensionDetected = [];

	function detectExtension(extensionId, callback) {
		var img;
		if (extensionDetected[extensionId])
			callback(true);
		else {
			img = new Image();
			img.src = "chrome-extension://" + extensionId + "/resources/icon_16.png";
			img.onload = function() {
				extensionDetected[extensionId] = true;
				callback(true);
			};
			img.onerror = function() {
				extensionDetected[extensionId] = false;
				callback(false);
			};
		}
	}

	function processable(url) {
		return ((isOpera && url.indexOf("https://addons.opera.com") != 0) || (isChrome && url.indexOf("https://chrome.google.com") != 0)) && (url.indexOf("http://") == 0 || url.indexOf("https://") == 0);
	}

	function process(tabId, url, processSelection, processFrame) {
		var SINGLE_FILE_CORE_EXT_ID = dev ? "onlinihoegnbbcmeeocfeplgbkmoidla" : isChrome ? "jemlklgaibiijojffihnhieihhagocma" : "ejmpikefailopkdnglnenfhpepfoghnn";

		detectExtension(SINGLE_FILE_CORE_EXT_ID, function(detected) {
			if (detected) {
				if (processable(url)) {
					singlefile.ui.notifyProcessInit(tabId);
					chrome.extension.sendMessage(SINGLE_FILE_CORE_EXT_ID, {
						processSelection : processSelection,
						processFrame : processFrame,
						id : tabId,
						config : singlefile.config.get()
					});
				}
			} else
				chrome.tabs.create({
					url : "pages/missingcore.html"
				});
		});
	}

	function notifyProcessable(tabId, url, reset) {
		singlefile.ui.notifyProcessable(tabId, processable(url), reset);
	}

	function notifyPageArchiver(request) {
		var PAGEARCHIVER_EXT_ID = dev ? "gneihhijimfbdmoieljdpjldkfbfijaa" : "ihkkeoeinpbomhnpkmmkpggkaefincbn";
		if (singlefile.config.get().sendToPageArchiver && request.content)
			detectExtension(PAGEARCHIVER_EXT_ID, function(detected) {
				if (detected)
					chrome.extension.sendMessage(PAGEARCHIVER_EXT_ID, request);
			});
	}

	chrome.tabs.onActivated.addListener(function(activeInfo) {
		chrome.tabs.get(activeInfo.tabId, function(tab) {
			notifyProcessable(tab.id, tab.url);
		});
	});
	chrome.tabs.onCreated.addListener(function(tab) {
		notifyProcessable(tab.id, tab.url);
	});
	chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
		if (changeInfo.status = "loading" && tab.url)
			notifyProcessable(tab.id, tab.url, true);
	});
	chrome.tabs.onRemoved.addListener(function(tabId) {
		singlefile.ui.notifyTabRemoved(tabId);
	});

	chrome.extension.onMessageExternal.addListener(function(request, sender, sendResponse) {
		var blob, url;
		if (request.processStart) {
			singlefile.ui.notifyProcessStart(request.tabId, request.processingPagesCount);
			if (request.blockingProcess)
				chrome.tabs.sendMessage(request.tabId, {
					processStart : true
				});
			notifyPageArchiver(request);
		}
		if (request.processProgress) {
			singlefile.ui.notifyProcessProgress(request.index, request.maxIndex);
			notifyPageArchiver(request);
		}
		if (request.processEnd) {
			if (request.blockingProcess)
				chrome.tabs.sendMessage(request.tabId, {
					processEnd : true
				});
			blob = new Blob([ (new Uint8Array([ 0xEF, 0xBB, 0xBF ])), request.content ], {
				type : "text/html"
			});
			url = webkitURL.createObjectURL(blob);
			singlefile.ui.notifyProcessEnd(request.tabId, request.processingPagesCount, singlefile.config.get().displayBanner, url, request.title);
			notifyPageArchiver(request);
		}
		if (request.processError)
			singlefile.ui.notifyProcessError(request.tabId);
	});
	chrome.extension.onMessage.addListener(function(message, sender) {
		if (message.closeBanner)
			chrome.tabs.sendMessage(sender.tab.id, {
				closeBanner : true
			});
		else
			process(sender.tab.id, sender.tab.url, false, false);
	});
	chrome.browserAction.onClicked.addListener(function(tab) {
		process(tab.id, tab.url, false, false);
	});

	singlefile.refreshMenu = function() {
		if (singlefile.config.get().displayInContextMenu) {
			chrome.contextMenus.create({
				contexts : [ "page" ],
				title : "process page",
				onclick : function(info, tab) {
					process(tab.id, tab.url, false, false);
				}
			});
			chrome.contextMenus.create({
				contexts : [ "frame" ],
				title : "process frame",
				onclick : function(info, tab) {
					process(tab.id, tab.url, false, true);
				}
			});
			chrome.contextMenus.create({
				contexts : [ "selection" ],
				title : "process selection",
				onclick : function(info, tab) {
					process(tab.id, tab.url, true, false);
				}
			});
		} else
			chrome.contextMenus.removeAll();
	};

	singlefile.refreshMenu();

})();
