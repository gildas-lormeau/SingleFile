/*
 * Copyright 2010 Gildas Lormeau
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

var singlefile = {};

(function() {

	var dev = false;

	var tabs = [], SCRAPBOOK_EXT_ID = dev ? "imfajgkkpglkdjkjejkefllgajgmhmfp" : "ihkkeoeinpbomhnpkmmkpggkaefincbn";

	function detectScrapbook(callback) {
		var img = new Image();
		img.src = "chrome-extension://" + SCRAPBOOK_EXT_ID + "/resources/icon_16.png";
		img.onload = function() {
			callback(true);
		};
		img.onerror = function() {
			callback(false);
		};
	}

	singlefile.getOptions = function() {
		return localStorage["options"] ? JSON.parse(localStorage["options"]) : {
			removeFrames : false,
			removeScripts : true,
			removeObjects : true,
			removeHidden : false,
			removeUnused : false
		};
	};

	singlefile.setOptions = function(options) {
		localStorage["options"] = JSON.stringify(options);
	};

	singlefile.resetOptions = function() {
		delete localStorage["options"];
	};

	function getWinProperties() {
		var winProperties = {}, property;
		for (property in window)
			winProperties[property] = true;
		return winProperties;
	}

	function throwAwayHighOrderBytes(str) {
		var i, ret = [];
		for (i = 0; i < str.length; i++)
			ret[i] = String.fromCharCode(str.charCodeAt(i) & 0xff);
		return ret.join("");
	}

	function sendXHR(tabId, url, responseHandler, errorHandler, charset) {
		var xhr;
		if (!tabs[tabId].responses[url]) {
			if (!tabs[tabId].callbacks[url]) {
				tabs[tabId].callbacks[url] = [];
				xhr = new XMLHttpRequest();
				xhr.onreadystatechange = function() {
					if (xhr.readyState == 4) {
						tabs[tabId].callbacks[url].forEach(function(callback) {
							callback.responseHandler(xhr.status, xhr.getResponseHeader("Content-Type"), xhr.responseText);
						});
						tabs[tabId].responses[url] = {
							status : xhr.status,
							header : xhr.getResponseHeader("Content-Type"),
							text : xhr.responseText
						};
					}
				};
				xhr.onerror = function() {
					tabs[tabId].callbacks[url].forEach(function(callback) {
						callback.errorHandler();
					});
				};
				xhr.open("GET", url, true);
				if (charset)
					xhr.overrideMimeType('text/plain; charset=' + charset);
				try {
					xhr.send(null);
				} catch (e) {
					xhr.onerror();
				}
			}
			tabs[tabId].callbacks[url].push({
				responseHandler : responseHandler,
				errorHandler : errorHandler
			});
		} else
			responseHandler(tabs[tabId].responses[url].status, tabs[tabId].responses[url].header, tabs[tabId].responses[url].text);
	}

	function setData(tabId, data, callback) {
		if (data.url.indexOf('http:') == 0 || data.url.indexOf('https:') == 0)
			sendXHR(tabId, data.url, function(status, contentType, responseText) {
				if (status < 400) {
					data.mediaType = contentType ? contentType.split(";")[0] : null;
					data.mediaTypeParam = data.base64 ? "base64" : (contentType ? contentType.split(";")[1] : null);
					data.content = data.base64 ? btoa(throwAwayHighOrderBytes(responseText)) : data.encodedText ? encodeURI(responseText) : responseText;
				}
				callback(data);
			}, function() {
				callback(data);
			}, data.characterSet);
		else
			callback(data);
	}

	function startDone(tabId) {
		var msg, options = singlefile.getOptions();
		msg = {
			getStylesheets : true,
			options : singlefile.getOptions()
		};
		tabs[tabId].ports.forEach(function(portData) {
			portData.port.postMessage(msg);
		});
	}

	function getPortData(tabId, port) {
		var portData;
		tabs[tabId].ports.forEach(function(aPortData) {
			if (!portData && aPortData.port == port)
				portData = aPortData;
		});
		return portData;
	}

	function buildTree(tabId) {
		var tabData = tabs[tabId];

		function findParent(port) {
			var parentPort, parts, parentWinID;
			if (port.winID) {
				parts = port.winID.split('.');
				parts.pop();
				parentWinID = parts.join('.');
				tabData.ports.forEach(function(portData) {
					if (portData.winID == parentWinID)
						parentPort = portData;
				});
			}
			return parentPort;
		}

		function walk(portData, level) {
			if (portData.children)
				portData.children.forEach(function(pData) {
					walk(pData, level + 1);
				});
			if (!tabData.levels[level])
				tabData.levels[level] = [];
			tabData.levels[level].push(portData);
		}

		tabData.ports.forEach(function(portData) {
			portData.parent = findParent(portData);
			if (portData.parent) {
				portData.parent.children = portData.parent.children || [];
				portData.parent.children.push(portData);
			}
		});
		tabData.levels = [];
		walk(tabData.top, 0);
		tabData.levelIndex = tabData.levels.length - 1;
	}

	function processFrames(tabId) {
		function postGetDocData(pData) {
			var data = {};
			if (pData.children)
				pData.children.forEach(function(pChildData) {
					var index = pChildData.winID.split('.').pop();
					data[index] = pChildData.data;
				});
			pData.port.postMessage({
				getDocData : true,
				data : data
			});
		}

		tabs[tabId].processedFrameCount = 0;
		tabs[tabId].processedFrameMax = tabs[tabId].levels[tabs[tabId].levelIndex].length;
		tabs[tabId].levels[tabs[tabId].levelIndex].forEach(postGetDocData);
	}

	function done(tabId) {
		tabs[tabId].processing = false;
		tabs[tabId].processed = true;
		tabs[tabId].top.port.postMessage({
			done : true,
			winProperties : getWinProperties()
		});
	}

	function refreshBadge(tabId) {
		var processedResources = 0, totalResources = 0;
		tabs[tabId].ports.forEach(function(portData) {
			processedResources += portData.processedResources;
			totalResources += portData.totalResources;
		});
		chrome.browserAction.setIcon({
			tabId : tabId,
			path : '../resources/icon_48_wait' + Math.floor((processedResources / totalResources) * 9) + '.png'
		});
		chrome.browserAction.setTitle({
			tabId : tabId,
			title : "Progress: " + Math.min(100, Math.floor((processedResources / totalResources) * 100)) + "%"
		});
	}

	function processTab(tabId) {
		function executeScripts(scripts, callback, index) {
			if (!index)
				index = 0;
			if (index < scripts.length) {
				chrome.tabs.executeScript(tabId, {
					file : scripts[index].file,
					code : scripts[index].code,
					allFrames : true
				}, function() {
					executeScripts(scripts, callback, index + 1);
				});
			} else if (callback)
				callback();
		}

		if (!tabs[tabId] || (!tabs[tabId].processing && !tabs[tabId].processed)) {
			executeScripts([ {
				code : "var singlefile = {};"
			}, {
				file : "scripts/filters.js"
			}, {
				file : "scripts/core.js"
			}, {
				file : "scripts/ui.js"
			}, {
				file : "scripts/main.js"
			} ], function() {
				if (!tabs[tabId])
					return;
				tabs[tabId].processing = true;
				chrome.browserAction.setBadgeBackgroundColor({
					color : [ 200, 200, 200, 192 ]
				});
				chrome.browserAction.setIcon({
					tabId : tabId,
					path : '../resources/icon_48_wait0.png'
				});
				chrome.browserAction.setTitle({
					tabId : tabId,
					title : "Progress: 0%"
				});
				detectScrapbook(function(sendContent) {
					tabs[tabId].top.port.postMessage({
						start : true,
						sendContent : sendContent
					});
				});
			});
		}
	}

	chrome.browserAction.onClicked.addListener(function(tab) {
		processTab(tab.id);
	});

	chrome.extension.onConnect.addListener(function(port) {
		var tabId = port.sender.tab.id, tabData;

		port.onDisconnect.addListener(function() {
			tabData.ports = tabData.ports.filter(function(portData) {
				return portData.port != port;
			});

			tabData.processedDocMax--;
			if (tabData.processedDocCount && tabData.processedDocMax == tabData.processedDocCount) {
				tabData.processedDocCount = 0;
				buildTree(tabId);
				processFrames(tabId);
			}

			if (!tabData.ports.length)
				tabs[tabId] = null;
		});

		port.onMessage.addListener(function(msg) {
			var portData;
			if (msg.init) {
				tabs[tabId] = tabs[tabId] || {
					id : tabId,
					ports : [],
					processedDocCount : 0,
					processedDocMax : 0,
					processedPortCount : 0,
					processedFrameCount : 0,
					processedFrameMax : 0,
					processed : false,
					callbacks : {},
					responses : {}
				};
				tabData = tabs[tabId];
				portData = {
					port : port,
					url : msg.url,
					totalResources : 0,
					processedResources : 0
				};
				if (msg.topWindow) {
					tabData.top = portData;
					tabData.title = msg.title;
				}
				if (!singlefile.getOptions().removeFrames || msg.topWindow) {
					tabData.ports.push(portData);
					tabData.processedDocMax++;
				}
			} else
				portData = getPortData(tabId, port);
			if (msg.startDone)
				startDone(tabId);
			if (msg.setStylesheets || msg.setData || msg.setDynamicData)
				setData(tabId, msg.data, function(data) {
					msg.data = data;
					port.postMessage(msg);
				});
			if (msg.setTotalResources) {
				portData.totalResources = msg.totalResources;
				tabData.processedPortCount++;
				if (tabData.processedPortCount == tabData.ports.length) {
					tabData.ports.forEach(function(pData) {
						pData.port.postMessage({
							getData : true
						});
					});
				}
			}
			if (msg.incProcessedResources) {
				portData.processedResources++;
				refreshBadge(tabId);
			}
			if (msg.setDataDone) {
				portData.frameCount = msg.frameCount;
				portData.winID = msg.winID;
				if (singlefile.getOptions().removeFrames) {
					done(tabId);
					detectScrapbook(function(sendContent) {
						if (sendContent)
							chrome.extension.sendRequest(SCRAPBOOK_EXT_ID, {
								tabId : tabId,
								title : tabData.title,
								content : msg.data,
								favicoData : msg.favicoData,
								url : tabData.top.url
							});
					});
				} else {
					tabData.processedDocCount++;
					if (tabData.processedDocMax == tabData.processedDocCount) {
						tabData.processedDocCount = 0;
						buildTree(tabId);
						processFrames(tabId);
					}
				}
			}
			if (msg.setDocData) {
				portData.data = "data:" + msg.mimeType + ";charset=utf-8," + encodeURI(msg.data);
				if (portData.parent) {
					tabData.processedFrameCount++;
					if (tabData.processedFrameMax == tabData.processedFrameCount) {
						tabData.levelIndex--;
						processFrames(tabId);
					}
				} else {
					done(tabId);
					detectScrapbook(function(sendContent) {
						if (sendContent)
							chrome.extension.sendRequest(SCRAPBOOK_EXT_ID, {
								tabId : tabId,
								title : tabData.title,
								content : msg.data,
								favicoData : msg.favicoData,
								url : tabData.top.url
							});
					});
				}
			}
			if (msg.done) {
				chrome.browserAction.setIcon({
					tabId : tabId,
					path : '../resources/icon_48.png'
				});
				chrome.browserAction.setBadgeBackgroundColor({
					color : [ 10, 200, 10, 192 ]
				});
				chrome.browserAction.setBadgeText({
					tabId : tabId,
					text : "OK"
				});
				chrome.browserAction.setTitle({
					tabId : tabId,
					title : "Save the page with Ctrl-S"
				});
			}
		});
	});

	chrome.extension.onRequestExternal.addListener(function(request, sender, sendResponse) {
		var tabId = request.id;
		if (sender.id != SCRAPBOOK_EXT_ID)
			return;
		if (tabs[tabId] && tabs[tabId].processing) {
			sendResponse({
				processing : true
			});
			return;
		}
		if (tabs[tabId] && tabs[tabId].processed) {
			sendResponse({
				processed : true
			});
			return;
		}
		processTab(tabId);
		sendResponse({});
	});

})();