/*
 * Copyright 2011 Gildas Lormeau
 * contact : gildas.lormeau <at> gmail.com
 * 
 * This file is part of SingleFile Core.
 *
 *   SingleFile Core is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU Lesser General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   SingleFile Core is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU Lesser General Public License for more details.
 *
 *   You should have received a copy of the GNU Lesser General Public License
 *   along with SingleFile Core.  If not, see <http://www.gnu.org/licenses/>.
 */

(function() {

	var DEFAULT_CONFIG = {
		removeFrames : false,
		removeScripts : true,
		removeObjects : true,
		removeHidden : false,
		removeUnusedCSSRules : false,
		displayProcessedPage : false,
		processInBackground : true,
		maxFrameSize : 2,
		getContent : true,
		getRawDoc : false
	};

	var tabs = singlefile.tabs = [], processingPagesCount = 0, pageId = 0;

	function executeScripts(tabId, scripts, callback, index) {
		if (!index)
			index = 0;
		if (index < scripts.length)
			chrome.tabs.executeScript(tabId, {
				file : scripts[index].file,
				code : scripts[index].code,
				allFrames : true
			}, function() {
				executeScripts(tabId, scripts, callback, index + 1);
			});
		else if (callback)
			callback();
	}

	function processInit(tabId, port, message) {
		var pageData = tabs[tabId][message.pageId];
		pageData.portsId.push(port.portId_);
		if (!pageData.getDocData(message.winId))
			pageData.processDoc(port, message.topWindow, message.winId, message.index, message.content, message.title, message.url, message.baseURI,
					message.characterSet, message.canvasData, message.contextmenuTime, {
						init : docInit,
						progress : docProgress,
						end : docEnd
					});
	}

	function setContentResponse(tabId, pageId, docData, content) {
		var pageData = tabs[tabId][pageId];
		processingPagesCount--;
		chrome.extension.sendMessage(pageData.senderId, {
			processEnd : true,
			tabId : tabId,
			pageId : pageId,
			blockingProcess : !pageData.config.processInBackground || pageData.config.displayProcessedPage,
			processingPagesCount : processingPagesCount,
			content : pageData.config.getContent ? content : null,
			url : pageData.url,
			title : pageData.title
		});
		if (!pageData.config.processInBackground || pageData.config.displayProcessedPage) {
			pageData.processing = false;
			tabs[tabId].processing = false;
		}
		if (pageData.pendingDelete)
			deletePageData(pageData);
	}

	function docInit(pageData, docData, maxIndex) {
		function pageInit() {
			delete pageData.timeoutPageInit;
			pageData.processableDocs = pageData.initializedDocs;
			pageData.initProcess();
			processingPagesCount++;
			chrome.extension.sendMessage(pageData.senderId, {
				processStart : true,
				tabId : pageData.tabId,
				pageId : pageData.pageId,
				blockingProcess : !pageData.config.processInBackground || pageData.config.displayProcessedPage,
				processingPagesCount : processingPagesCount
			});
			if (pageData.config.processInBackground && !pageData.config.displayProcessedPage) {
				tabs[pageData.tabId].processing = false;
				pageData.processing = false;
			}
		}

		if (!docData.initialized) {
			docData.initialized = true;
			if (pageData.initializedDocs != pageData.processableDocs) {
				docData.progressMax = maxIndex;
				pageData.initializedDocs++;
				if (pageData.timeoutPageInit)
					clearTimeout(pageData.timeoutPageInit);
				pageData.timeoutPageInit = setTimeout(pageInit, 5000);
				if (pageData.initializedDocs == pageData.processableDocs || pageData.processSelection || pageData.config.removeFrames
						|| pageData.config.getRawDoc) {
					clearTimeout(pageData.timeoutPageInit);
					pageInit();
				}
			}
		}
	}

	function docProgress(pageData, docData, index) {
		var progressIndex = 0, progressMax = 0;
		docData.progressIndex = index;
		tabs.forEach(function(tabData) {
			if (tabData) {
				tabData.progressIndex = 0;
				tabData.progressMax = 0;
				tabData.forEach(function(pageData) {
					if (pageData) {
						pageData.computeProgress();
						tabData.progressIndex += pageData.progressIndex;
						tabData.progressMax += pageData.progressMax;
					}
				});
				progressIndex += tabData.progressIndex;
				progressMax += tabData.progressMax;
			}
		});
		chrome.extension.sendMessage(pageData.senderId, {
			processProgress : true,
			tabId : pageData.tabId,
			pageId : pageData.pageId,
			pageIndex : pageData.progressIndex,
			pageMaxIndex : pageData.progressMax,
			tabIndex : tabs[pageData.tabId].progressIndex,
			tabMaxIndex : tabs[pageData.tabId].progressMax,
			index : progressIndex,
			maxIndex : progressMax
		});
	}

	function docEnd(pageData, docData, content) {
		pageData.setDocContent(docData, content, setContentResponse);
	}

	function process(tabId, senderId, config, processSelection, processFrame) {
		var pageData, configScript;
		if (processFrame) {
			config.processInBackground = true;
			config.removeFrames = false;
		}
		configScript = "singlefile.config = " + JSON.stringify(config) + "; singlefile.pageId = " + pageId + ";"
				+ (processSelection ? "singlefile.processSelection = " + processSelection : "");
		if (tabs[tabId] && tabs[tabId].processing)
			return;
		tabs[tabId] = tabs[tabId] || [];
		tabs[tabId].processing = true;
		pageData = new singlefile.PageData(tabId, pageId, senderId, config, processSelection, processFrame, function() {
			executeScripts(tabId, [ {
				code : "var singlefile = {};"
			}, {
				file : "scripts/common/util.js"
			}, {
				file : "scripts/common/docprocessor.js"
			}, {
				code : configScript
			}, {
				file : "scripts/content/content.js"
			} ]);
		});
		tabs[tabId][pageId] = pageData;
		pageId++;
	}

	function deletePageData(pageData) {
		delete tabs[pageData.tabId][pageData.pageId];
		tabs[pageData.tabId] = tabs[pageData.tabId].filter(function(pageData) {
			return pageData;
		});
		if (!tabs[pageData.tabId].length)
			delete tabs[pageData.tabId];
	}

	function onConnect(port) {
		var tabId = port.sender.tab.id, portPageId = [];

		function onDisconnect() {
			var pageData = tabs[tabId][portPageId[port.portId_]];
			if (!pageData)
				return;
			pageData.portsId = pageData.portsId.filter(function(id) {
				return id != port.portId_;
			});
			if (!pageData.portsId.length)
				if (pageData.processing)
					pageData.pendingDelete = true;
				else
					deletePageData(pageData);
		}

		function onMessage(message) {
			var pageData, docData;
			// if (!message.getResourceContentRequest && !message.docProgress)
			//	console.log("onMessage", message, port.portId_);
			if (message.winId) {
				portPageId[port.portId_] = message.pageId;
				if (message.processInit)
					processInit(tabId, port, message);
				else {
					pageData = tabs[tabId][message.pageId];
					docData = pageData.getDocData(message.winId);
					if (message.processDocFragment)
						pageData.processDocFragment(docData, message.mutationEventId, message.content);
					if (message.getResourceContentRequest)
						pageData
								.getResourceContentRequest(message.url, message.requestId, message.winId, message.characterSet, message.mediaTypeParam, docData);
					if (message.docInit)
						docInit(pageData, docData, message.maxIndex);
					if (message.docProgress)
						docProgress(pageData, docData, message.index);
					if (message.docEnd)
						docEnd(pageData, docData, message.content);
					if (message.setFrameContentResponse)
						docData.children[message.index].setFrameContentCallback();
					if (message.getContentResponse) {
						docData.content = message.content;
						docData.getContentCallback();
					}
					if (message.setContentResponse)
						setContentResponse(tabId, message.pageId, docData, message.content);
				}
			}
		}
		if (port.name == "singlefile") {
			port.onMessage.addListener(onMessage);
			port.onDisconnect.addListener(onDisconnect);
		}
	}

	function onMessageExternal(request, sender, sendResponse) {
		// console.log("onMessageExternal", request);
		var property, config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
		if (request.config)
			for (property in request.config)
				config[property] = request.config[property];
		if (request.processSelection)
			process(request.id, sender.id, config, true, false);
		else if (request.processFrame)
			process(request.id, sender.id, config, false, true);
		else if (request.tabIds)
			request.tabIds.forEach(function(tabId) {
				process(tabId, sender.id, config, false, false);
			});
		else
			process(request.id, sender.id, config, false, false);
		sendResponse({});
	}

	chrome.extension.onConnect.addListener(onConnect);
	chrome.extension.onMessageExternal.addListener(onMessageExternal);

})();
