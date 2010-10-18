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

(function(holder) {
	var targetDoc, doc, options, winID, processedFrames = 0, initPageCallback, timeoutCallback, bgPort, winPort, requests = {}, requestCount = 0, responseCount = 0, sendContent;

	function storeRequest(url, callback, base64, encodedText, characterSet) {
		if (!requests[url]) {
			requests[url] = {
				base64 : base64,
				encodedText : encodedText,
				characterSet : characterSet,
				callbacks : []
			};
			requestCount++;
		}
		requests[url].callbacks.push(callback);
	}

	function sendRequests(methodName) {
		var url, data, msg;
		for (url in requests) {
			data = requests[url];
			msg = {
				data : {
					url : url,
					base64 : data.base64,
					encodedText : data.encodedText,
					characterSet : data.base64 ? "x-user-defined" : data.characterSet
				}
			};
			msg[methodName] = true;
			bgPort.postMessage(msg);
		}
	}

	function getDocument() {
		var clone, mask;
		if (options.removeScripts) {
			clone = targetDoc.documentElement.cloneNode(true);
			mask = clone.querySelector("#__SingleFile_mask__");
			if (mask) {
				mask.parentElement.removeChild(mask);
				return clone;
			}
		}
		return targetDoc.documentElement;
	}

	function setDocument() {
		if (options.removeScripts)
			targetDoc.replaceChild(doc, targetDoc.documentElement);
	}

	function initProcess(opt) {
		options = opt;
		if (options.removeHidden)
			holder.filters.element.removeHidden();
		if (options.removeScripts)
			holder.filters.canvas.replace();
		doc = getDocument();
		holder.filters.element.clean(doc);
		if (options.removeFrames)
			holder.filters.frame.remove(doc);
		if (options.removeScripts)
			holder.filters.script.remove(doc);
		if (options.removeObjects)
			holder.filters.object.remove(doc);
	}

	function getStylesheets() {
		holder.filters.document.getStylesheets(doc, storeRequest);
		sendRequests("setStylesheets");
		if (requestCount == 0) {
			holder.filters.document.get(doc, storeRequest, window == top);
			bgPort.postMessage({
				setTotalResources : true,
				totalResources : requestCount
			});
		}
	}

	function getData() {
		sendRequests("setData");
		if (requestCount == 0)
			bgPort.postMessage({
				setDataDone : true,
				data : window == top && options.removeFrames && sendContent ? holder.filters.document.getDoctype() + doc.outerHTML : null,
				favicoData : window == top && options.removeFrames && sendContent ? holder.filters.image.getFavicoData(doc) : null,
				frameCount : holder.filters.frame.count(doc),
				winID : winID
			});
	}

	function setData(data, callback, isStylesheet) {
		var callbacks = requests[data.url].callbacks;
		responseCount++;
		callbacks.forEach(function(cb) {
			cb(data);
		});
		if (!isStylesheet)
			bgPort.postMessage({
				incProcessedResources : true
			});
		if (responseCount == requestCount) {
			responseCount = 0;
			requestCount = 0;
			requests = {};
			if (callback)
				callback();
		}
	}

	function getDocData(data) {
		if (options.removeUnused) {
			setDocument();
			holder.filters.style.removeUnused();
			doc = getDocument();
		}
		holder.filters.frame.set(doc, data);
		bgPort.postMessage({
			setDocData : true,
			data : window != top || sendContent ? holder.filters.document.getDoctype() + doc.outerHTML : null,
			favicoData : window == top && sendContent ? holder.filters.image.getFavicoData(doc) : null,
			mimeType : "text/html"
		});
	}

	function done(winProperties) {
		var callbackId;
		setDocument();
		targetDoc.addEventListener("DOMNodeInsertedIntoDocument", function(event) {
			if (!callbackId)
				if (event.target.querySelectorAll)
					holder.filters.document.get(event.target, storeRequest, false);
			if (callbackId)
				clearTimeout(callbackId);
			callbackId = setTimeout(function() {
				if (requestCount)
					sendRequests("setDynamicData");
				callbackId = null;
			}, 20);
		}, true);
		bgPort.postMessage({
			done : true
		});
		if (options.removeScripts) {
			function resetWindowProperties(winPropertiesStr) {
				var property, winProp = JSON.parse(winPropertiesStr);
				for (property in window)
					if (!winProp[property])
						window[property] = null;
			}
			window.location.href = "javascript:(" + resetWindowProperties.toString() + ")('" + JSON.stringify(winProperties) + "')";
		}
	}

	function start(msg) {
		sendContent = msg.sendContent;
		timeoutCallback = setTimeout(initPageCallback, 1000);
		setWinId("0");
	}

	function setWinId(id) {
		winID = id;
		holder.filters.frame.clean();
		if (holder.filters.frame.count())
			winPort.postMessageToFrames('iframe[src], frame[src]', function(index, params) {
				return {
					setID : true,
					winID : params.winID + "." + index
				};
			}, {
				winID : id
			});
		else
			setWinIdDone();
	}

	function setWinIdDone() {
		processedFrames++;
		if (processedFrames == holder.filters.frame.count()) {
			if (top != window)
				winPort.postMessageToParent({
					done : true
				});
			else {
				clearTimeout(timeoutCallback);
				initPageCallback();
			}
		}
	}

	holder.core = {
		init : function(srcDoc, backgroundPort, windowPort) {
			windowPort.addListener(function(message) {
				if (message.setID)
					setWinId(message.winID);
				else if (message.done)
					setWinIdDone();
			});
			bgPort = backgroundPort;
			winPort = windowPort;
			initPageCallback = function() {
				bgPort.postMessage({
					startDone : true
				});
			};
			bgPort.addListener(function(message) {
				if (message.start)
					start(message);
				else if (message.getStylesheets) {
					initProcess(message.options);
					getStylesheets();
				} else if (message.setStylesheets)
					setData(message.data, getStylesheets, true);
				else if (message.getData)
					getData();
				else if (message.setData)
					setData(message.data, function() {
						bgPort.postMessage({
							setDataDone : true,
							data : window == top && sendContent ? holder.filters.document.getDoctype() + doc.outerHTML : null,
							favicoData : window == top && options.removeFrames && sendContent ? holder.filters.image.getFavicoData(doc) : null,
							frameCount : holder.filters.frame.count(doc),
							winID : winID
						});
					});
				else if (message.setDynamicData)
					setData(message.data, null, true);
				else if (message.getDocData)
					getDocData(message.data);
				else if (message.done)
					done(message.winProperties);
			});
			targetDoc = srcDoc;
			doc = targetDoc.documentElement;
			if (doc instanceof HTMLHtmlElement)
				bgPort.postMessage({
					init : true,
					topWindow : window == top,
					url : location.href,
					title : document.title
				});
		}
	};

	holder.init = function(currDoc, backgroundPort, windowPort) {
		holder.filters.init(currDoc);
		holder.ui.init(backgroundPort);
		holder.core.init(currDoc, backgroundPort, windowPort);
	};
})(singlefile);