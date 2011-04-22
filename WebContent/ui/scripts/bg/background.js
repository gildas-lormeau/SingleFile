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
		return !url.indexOf("https://chrome.google.com") == 0 && (url.indexOf("http://") == 0 || url.indexOf("https://") == 0);
	}

	function process(tabId, url, processSelection) {
		var SINGLE_FILE_CORE_EXT_ID = dev ? /* "oabofdibacblkhpogjinmdbcekfkikjc" */"onlinihoegnbbcmeeocfeplgbkmoidla" : "jemlklgaibiijojffihnhieihhagocma";
		detectExtension(SINGLE_FILE_CORE_EXT_ID, function(detected) {
			if (detected) {
				if (processable(url)) {
					singlefile.ui.notifyProcessInit(tabId);
					chrome.extension.sendRequest(SINGLE_FILE_CORE_EXT_ID, {
						processSelection : processSelection,
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

	function notifyScrapbook(request) {
		var SCRAPBOOK_EXT_ID = dev ? "imfajgkkpglkdjkjejkefllgajgmhmfp" : "ihkkeoeinpbomhnpkmmkpggkaefincbn";
		if (request.content)
			detectExtension(SCRAPBOOK_EXT_ID, function(detected) {
				if (detected)
					chrome.extension.sendRequest(SCRAPBOOK_EXT_ID, request);
			});
	}

	chrome.tabs.onSelectionChanged.addListener(function() {
		chrome.tabs.getSelected(null, function(tab) {
			notifyProcessable(tab.id, tab.url);
		});
	});
	chrome.tabs.onCreated.addListener(function(tab) {
		notifyProcessable(tab.id, tab.url);
	});
	chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
		notifyProcessable(tab.id, tab.url, true);
	});
	chrome.tabs.onRemoved.addListener(function(tabId) {
		singlefile.ui.notifyTabRemoved(tabId);
	});

	chrome.extension.onRequestExternal.addListener(function(request, sender, sendResponse) {
		if (request.processStart) {
			singlefile.ui.notifyProcessStart(request.tabId, request.processingPagesCount);
			if (request.blockingProcess)
				chrome.tabs.sendRequest(request.tabId, {
					processStart : true
				});
			notifyScrapbook(request);
		}
		if (request.processProgress) {
			singlefile.ui.notifyProcessProgress(request.index, request.maxIndex);
			notifyScrapbook(request);
		}
		if (request.pageSaved)
			singlefile.ui.notifySavedPage(request.processed, request.filename);
		if (request.processEnd) {
			if (request.blockingProcess)
				chrome.tabs.sendRequest(request.tabId, {
					processEnd : true
				});
			singlefile.ui.notifyProcessEnd(request.tabId, request.processingPagesCount);
			notifyScrapbook(request);
		}
		if (request.processError)
			singlefile.ui.notifyProcessError(request.tabId);
	});
	chrome.extension.onRequest.addListener(function(request, sender) {
		process(sender.tab.id, sender.tab.url);
	});
	chrome.browserAction.onClicked.addListener(function(tab) {
		process(tab.id, tab.url);
	});

	singlefile.refreshMenu = function() {
		if (singlefile.config.get().displayInContextMenu) {
			chrome.contextMenus.create({
				title : "Process page with SingleFile",
				onclick : function(info, tab) {
					process(tab.id, tab.url);
				}
			});
			chrome.contextMenus.create({
				contexts : [ "selection" ],
				title : "Process selection with SingleFile",
				onclick : function(info, tab) {
					process(tab.id, tab.url, true);
				}
			});
		} else
			chrome.contextMenus.removeAll();
	};
	
	singlefile.refreshMenu();

})();
