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

var wininfo = {};

(function() {

	var EXT_ID = "wininfo";

	var contentRequestCallbacks, executeSetFramesWinIdString = executeSetFramesWinId.toString(), processLength, processIndex, timeoutProcess, timeoutInit;

	function addListener(onMessage) {
		function windowMessageListener(event) {
			var data = event.data;
			if (typeof data === 'string' && data.indexOf(EXT_ID + '::') == 0)
				onMessage(JSON.parse(data.substr(EXT_ID.length + 2)));
		}
		this.addEventListener("message", windowMessageListener, false);
	}

	function executeSetFramesWinId(extensionId, selector, index, winId) {
		function execute(extensionId, elements, index, winId, win) {
			var i, framesInfo = [], stringify = JSON.stringify || JSON.encode, parse = JSON.parse || JSON.decode;

			function getDoctype(doc) {
				var docType = doc.doctype, docTypeStr;
				if (docType) {
					docTypeStr = "<!DOCTYPE " + docType.nodeName;
					if (docType.publicId) {
						docTypeStr += " PUBLIC \"" + docType.publicId + "\"";
						if (docType.systemId)
							docTypeStr += " \"" + docType.systemId + "\"";
					} else if (docType.systemId)
						docTypeStr += " SYSTEM \"" + docType.systemId + "\"";
					if (docType.internalSubset)
						docTypeStr += " [" + docType.internalSubset + "]";
					return docTypeStr + ">\n";
				}
				return "";
			}

			function addListener(onMessage) {
				function windowMessageListener(event) {
					var data = event.data;
					if (typeof data === 'string' && data.indexOf(extensionId + '::') == 0)
						onMessage(parse(data.substr(extensionId.length + 2)));
				}
				top.addEventListener("message", windowMessageListener, false);
			}

			for (i = 0; i < elements.length; i++) {
				framesInfo.push({
					sameDomain : elements[i].contentDocument != null,
					src : elements[i].src,
					winId : winId + "." + i,
					index : i
				});
			}
			if (win != top)
				win.postMessage(extensionId + "::" + stringify({
					initResponse : true,
					winId : winId,
					index : index
				}), "*");
			top.postMessage(extensionId + "::" + stringify({
				initResponse : true,
				frames : framesInfo,
				winId : winId,
				index : index
			}), "*");
			for (i = 0; i < elements.length; i++)
				(function(index) {
					var frameElement = elements[i], frameWinId = winId + "." + index, frameDoc = frameElement.contentDocument;

					function onMessage(message) {
						if (message.getContentRequest) {
							var customEvent, doctype;
							if (message.winId == frameWinId) {
								doctype = getDoctype(frameDoc);
								top.postMessage(extensionId + "::" + stringify({
									getContentResponse : true,
									contentRequestId : message.contentRequestId,
									winId : frameWinId,
									content : doctype + frameDoc.documentElement.outerHTML,
									title : frameDoc.title,
									baseURI : frameDoc.baseURI,
									url : frameDoc.location.href,
									characterSet : "UTF-8"
								}), "*");
							}
						}
					}

					if (frameDoc && top.addEventListener) {
						execute(extensionId, frameDoc.querySelectorAll(selector), index, frameWinId, frameElement.contentWindow);
						addListener(onMessage);
					} else {
						frameElement.contentWindow.postMessage(extensionId + "::" + stringify({
							initRequest : true,
							winId : frameWinId,
							index : index
						}), "*");
					}
				})(i);
		}
		execute(extensionId, document.querySelectorAll(selector), index, winId, window);
	}

	function getContent(frame, callback) {
		if (frame.sameDomain) {
			top.postMessage(EXT_ID + "::" + JSON.stringify({
				getContentRequest : true,
				winId : frame.winId,
				contentRequestId : contentRequestCallbacks.length
			}), "*");
			contentRequestCallbacks.push(callback);
		} else
			callback();
	}

	function getContentResponse(message) {
		var id = message.contentRequestId;
		delete message.contentRequestId;
		delete message.getContentResponse;
		contentRequestCallbacks[id](message);
	}

	function initRequest(message) {
		wininfo.winId = message.winId;
		wininfo.index = message.index;
		timeoutInit = setTimeout(function() {
			initResponse({
				initResponse : true,
				frames : [],
				winId : message.winId,
				index : message.index
			});
		}, 3000);
		location.href = "javascript:(" + executeSetFramesWinIdString + ")('" + EXT_ID + "','iframe, frame'," + wininfo.index + ",'" + wininfo.winId
				+ "'); void 0;";
	}

	function initResponse(message) {
		function process() {
			bgPort = chrome.extension.connect({
				name : "wininfo"
			});
			wininfo.frames = wininfo.frames.filter(function(frame) {
				return frame.winId;
			});
			bgPort.postMessage({
				initResponse : true,
				processableDocs : wininfo.frames.length + 1
			});
		}

		if (timeoutInit) {
			clearTimeout(timeoutInit);
			timeoutInit = null;
		}
		if (window == top) {
			message.frames = message.frames instanceof Array ? message.frames : JSON.parse(message.frames);
			if (message.winId != "0")
				processIndex++;
			wininfo.frames = wininfo.frames.concat(message.frames);
			processLength += message.frames.length;
			if (timeoutProcess)
				clearTimeout(timeoutProcess);
			if (processIndex == processLength)
				process();
			else
				timeoutProcess = setTimeout(function() {
					process();
				}, 200);
		} else {
			wininfo.winId = message.winId;
			wininfo.index = message.index;
		}
	}

	function onRequest(request) {
		// console.log("onRequest", request);
		if (request.initRequest && this == top && document.documentElement instanceof HTMLHtmlElement) {
			contentRequestCallbacks = [];
			processLength = 0;
			processIndex = 0;
			timeoutProcess = null;
			wininfo.frames = [];
			initRequest(request);
		}
	}

	function onMessage(message) {
		// console.log("wininfo", "onMessage", message, window.location.href);
		if (message.initRequest)
			initRequest(message);
		if (message.initResponse)
			initResponse(message);
		if (message.getContentResponse)
			getContentResponse(message);
	}

	if (window == top)
		wininfo.getContent = getContent;
	chrome.extension.onRequest.addListener(onRequest);
	addEventListener("contextmenu", function() {
		window.contextmenuTime = (new Date()).getTime();
	}, false);

	addListener(onMessage);

})();
