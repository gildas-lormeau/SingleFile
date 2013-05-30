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

	var bgPort, docs = {}, pageId = singlefile.pageId, doc = document, docElement, canvasData = [], config = singlefile.config;

	function RequestManager(pageId, winId) {
		var requestId = 0, callbacks = [];

		this.send = function(url, responseHandler, characterSet, mediaTypeParam) {
			callbacks[requestId] = responseHandler;
			bgPort.postMessage({
				getResourceContentRequest : true,
				pageId : pageId,
				winId : winId,
				requestId : requestId,
				url : url,
				characterSet : characterSet,
				mediaTypeParam : mediaTypeParam
			});
			requestId++;
		};

		this.onResponse = function(id, content) {
			callbacks[id](content);
			callbacks[id] = null;
		};
	}

	function removeUnusedCSSRules() {
		Array.prototype.forEach.call(document.querySelectorAll("style"), function(style) {
			var cssRules = [];

			function process(rules) {
				Array.prototype.forEach.call(rules, function(rule) {
					var selector;
					if (rule.media) {
						cssRules.push("@media " + Array.prototype.join.call(rule.media, ",") + " {");
						process(rule.cssRules);
						cssRules.push("}");
					} else if (rule.selectorText) {
						selector = rule.selectorText.replace(/::after|::before|::first-line|::first-letter|:focus|:hover/gi, '').trim();
						if (selector)
							try {
								if (document.querySelector(selector))
									cssRules.push(rule.cssText);
							} catch (e) {
								cssRules.push(rule.cssText);
							}
					}
				});
			}
			if (style.sheet) {
				process(style.sheet.rules);
				style.innerText = cssRules.join("");
			}
		});
	}

	function removeHiddenElements() {
		Array.prototype.forEach.call(doc.querySelectorAll("html > body *:not(style):not(script):not(link):not(area)"), function(element) {
			var style = getComputedStyle(element), tagName = element.tagName.toLowerCase();
			if (tagName != "iframe" && !element.querySelector("iframe") && ((style.visibility == "hidden" || style.display == "none" || style.opacity == 0)))
				element.parentElement.removeChild(element);
		});
	}

	function getSelectedContent() {
		var node, wrapper, clonedNode, selection = getSelection(), range = selection.rangeCount ? selection.getRangeAt(0) : null;
		function addStyle(node) {
			var rules, cssText;
			Array.prototype.forEach.call(node.children, function(child) {
				addStyle(child);
			});
			rules = getMatchedCSSRules(node, '', false);
			if (rules) {
				cssText = "";
				Array.prototype.forEach.call(rules, function(rule) {
					cssText += rule.style.cssText;
				});
				node.setAttribute("style", cssText);
			}
		}

		if (range && range.startOffset != range.endOffset) {
			node = range.commonAncestorContainer;
			if (node.nodeType != node.ELEMENT_NODE)
				node = node.parentElement;
			clonedNode = node.cloneNode(true);
			addStyle(node);
			node.parentElement.replaceChild(clonedNode, node);
		}
		return node;
	}

	function getCanvasData(doc) {
		var canvasData = [];
		Array.prototype.forEach.call(doc.querySelectorAll("canvas"), function(node) {
			var data = null;
			try {
				data = node.toDataURL("image/png", "");
			} catch (e) {
			}
			canvasData.push(data);
		});
		return canvasData;
	}

	function initProcess(doc, docElement, winId, topWindow, canvasData) {
		var requestManager = new RequestManager(pageId, winId);
		docs[winId] = {
			doc : doc,
			docElement : docElement,
			frames : docElement.querySelectorAll("iframe, frame"),
			requestManager : requestManager,
			processDoc : singlefile.initProcess(doc, docElement, topWindow, doc.baseURI, doc.characterSet, config, canvasData, requestManager, function(
					maxIndex) {
				bgPort.postMessage({
					docInit : true,
					pageId : pageId,
					winId : winId,
					maxIndex : maxIndex
				});
			}, function(index) {
				bgPort.postMessage({
					docProgress : true,
					pageId : pageId,
					winId : winId,
					index : index
				});
			}, function() {
				bgPort.postMessage({
					docEnd : true,
					pageId : pageId,
					winId : winId,
					content : topWindow ? null : singlefile.util.getDocContent(doc, docElement)
				});
			})
		};
	}

	function sendFgProcessInit(title, url, baseURI, winId, winIndex) {
		var contextmenuTime = window.contextmenuTime;
		window.contextmenuTime = null;
		bgPort.postMessage({
			processInit : true,
			pageId : pageId,
			topWindow : winId ? false : window == top,
			url : url || location.href,
			title : title || doc.title,
			baseURI : baseURI || doc.baseURI,
			winId : winId || wininfo.winId,
			contextmenuTime : contextmenuTime,
			index : winIndex || wininfo.index
		});
	}

	function sendBgProcessInit(content, title, url, baseURI, characterSet, winId, winIndex) {
		var contextmenuTime = window.contextmenuTime;
		if (!this.wininfo)
			return;
		window.contextmenuTime = null;
		bgPort.postMessage({
			processInit : true,
			pageId : pageId,
			topWindow : winId ? false : window == top,
			url : url || location.href,
			title : title || doc.title,
			content : content,
			baseURI : baseURI || doc.baseURI,
			characterSet : characterSet || doc.characterSet,
			canvasData : canvasData,
			winId : winId || wininfo.winId,
			contextmenuTime : contextmenuTime,
			index : winIndex || wininfo.index
		});
	}

	// ----------------------------------------------------------------------------------------------

	function init() {
		var selectedContent = getSelectedContent(), topWindow = window == top;

		function doFgProcessInit() {
			sendFgProcessInit();
			if (docElement && (!singlefile.processSelection || selectedContent)) {
				initProcess(doc, docElement, wininfo.winId, topWindow, canvasData);
				if (topWindow && !config.removeFrames && !config.getRawDoc)
					wininfo.frames.forEach(function(frame) {
						if (frame.sameDomain)
							wininfo.getContent(frame, function(message) {
								var frameDoc = document.implementation.createHTMLDocument();
								frameDoc.open();
								frameDoc.write(message.content);
								frameDoc.close();
								sendFgProcessInit(message.title, message.url, message.baseURI, frame.winId, frame.index);
								initProcess(frameDoc, frameDoc.documentElement, frame.winId, false, getCanvasData(frameDoc));
							});
					});
			}
		}

		function bgProcessInit() {
			var xhr;
			if (singlefile.processSelection) {
				if (selectedContent || !topWindow)
					sendBgProcessInit(topWindow ? singlefile.util.getDocContent(doc, selectedContent) : null);
			} else {
				if (config.getRawDoc && topWindow) {
					xhr = new XMLHttpRequest();
					xhr.onreadystatechange = function() {
						if (xhr.readyState == 4)
							sendBgProcessInit(xhr.responseText);
					};
					xhr.open("GET", doc.location.href, true);
					xhr.overrideMimeType('text/plain; charset=' + doc.characterSet);
					xhr.send(null);
				} else {
					sendBgProcessInit(singlefile.util.getDocContent(doc));
					if (topWindow && !config.removeFrames)
						wininfo.frames.forEach(function(frame) {
							if (frame.sameDomain)
								wininfo.getContent(frame, function(message) {
									sendBgProcessInit(message.content, message.title, message.url, message.baseURI, message.characterSet, frame.winId,
											frame.index);
								});
						});
				}
			}
		}

		function fgProcessInit() {
			var xhr, tmpDoc;
			if (singlefile.processSelection) {
				if (selectedContent || topWindow) {
					docElement = selectedContent;
					doFgProcessInit();
				}
			} else if (config.getRawDoc && topWindow) {
				xhr = new XMLHttpRequest();
				xhr.onreadystatechange = function() {
					if (xhr.readyState == 4) {
						tmpDoc = document.implementation.createHTMLDocument();
						tmpDoc.open();
						tmpDoc.write(xhr.responseText);
						tmpDoc.close();
						docElement = doc.importNode(tmpDoc.documentElement, true);
						doFgProcessInit();
					}
				};
				xhr.open("GET", doc.location.href, true);
				xhr.overrideMimeType('text/plain; charset=' + doc.characterSet);
				xhr.send(null);
			} else {
				docElement = doc.documentElement.cloneNode(true);
				doFgProcessInit();
			}
		}

		if (!selectedContent) {
			Array.prototype.forEach.call(doc.querySelectorAll("noscript"), function(node) {
				node.textContent = "";
			});
			canvasData = getCanvasData(doc);
			if (config.removeHidden)
				removeHiddenElements();
			if (topWindow)
				document.documentElement.insertBefore(document.createComment("\n Archive processed by SingleFile \n url: " + location.href + " \n saved date: "
						+ new Date() + " \n"), document.documentElement.firstChild);
		}
		if ((!config.removeFrames && !config.getRawDoc) || topWindow)
			if (config.processInBackground)
				bgProcessInit();
			else
				fgProcessInit();
	}

	function setContentRequest(message) {
		var mutationEventId = 0, winId = wininfo.winId, timeoutSetContent;

		function resetWindowProperties(winPropertiesStr) {
			var property, winProp, customEvent, parse = JSON.parse || JSON.decode;
			try {
				winProp = parse(winPropertiesStr);
				for (property in window)
					if (!winProp[property])
						window[property] = null;
			} catch (e) {
				console.log(e);
			}
			customEvent = document.createEvent("CustomEvent");
			customEvent.initCustomEvent("WindowPropertiesCleaned", true, true);
			document.dispatchEvent(customEvent);
		}

		function onDOMSubtreeModified(event) {
			var id = mutationEventId, element = event.target, processDocFn;

			function onSetDocFragment(message) {
				if (message.setDocFragment && message.mutationEventId == id) {
					doc.removeEventListener("DOMSubtreeModified", onDOMSubtreeModified, true);
					element.innerHTML = message.content;
					doc.addEventListener("DOMSubtreeModified", onDOMSubtreeModified, true);
					bgPort.onMessage.removeListener(onSetDocFragment);
				}
			}

			if (element.innerHTML) {
				if (config.processInBackground) {
					bgPort.postMessage({
						processDocFragment : true,
						pageId : pageId,
						winId : winId,
						content : element.innerHTML,
						mutationEventId : id
					});
					bgPort.onMessage.addListener(onSetDocFragment);
					mutationEventId++;
				} else
					processDocFn = singlefile.initProcess(doc, element, false, doc.baseURI, doc.characterSet, config, canvasData, docs[winId].requestManager,
							function(maxIndex) {
								doc.removeEventListener("DOMSubtreeModified", onDOMSubtreeModified, true);
								processDocFn();
								doc.addEventListener("DOMSubtreeModified", onDOMSubtreeModified, true);
							});
			}
			event.preventDefault();
		}

		function onWindowPropertiesCleaned() {
			var tmpDoc;

			function replaceDoc() {
				doc.replaceChild(docElement, doc.documentElement);
				doc.addEventListener("DOMSubtreeModified", onDOMSubtreeModified, true);
			}

			if (timeoutSetContent) {
				clearTimeout(timeoutSetContent);
				timeoutSetContent = null;
			}
			doc.removeEventListener('WindowPropertiesCleaned', onWindowPropertiesCleaned, true);
			if (config.processInBackground || singlefile.processSelection || (!config.processInBackground && !config.removeScripts))
				if (location.pathname.indexOf(".txt") + 4 == location.pathname.length) {
					tmpDoc = document.implementation.createHTMLDocument();
					tmpDoc.open();
					tmpDoc.write(message.content);
					tmpDoc.close();
					docElement = doc.importNode(tmpDoc.documentElement, true);
					replaceDoc();
				} else {
					doc.open();
					doc.write(message.content || singlefile.util.getDocContent(doc, docElement));
					doc.addEventListener("DOMSubtreeModified", onDOMSubtreeModified, true);
					doc.close();
				}
			else
				replaceDoc();
			if (config.removeUnusedCSSRules)
				removeUnusedCSSRules();
			setContentResponse();
		}

		function sendSetContentResponse(content) {
			bgPort.postMessage({
				setContentResponse : true,
				winId : "0",
				pageId : pageId,
				content : config.getContent ? content : null
			});
		}

		function setContentResponse() {
			if (singlefile.processSelection)
				sendSetContentResponse(message.content);
			else {
				if (config.processInBackground)
					sendSetContentResponse(singlefile.util.getDocContent(doc, doc.documentElement));
				else
					sendSetContentResponse(config.removeUnusedCSSRules ? singlefile.util.getDocContent(doc, doc.documentElement) : singlefile.util
							.getDocContent(doc, docElement));
			}
		}

		if (config.displayProcessedPage) {
			window.location.href = "javascript:(" + resetWindowProperties.toString() + ")('" + JSON.stringify(message.winProperties) + "'); void 0;";
			timeoutSetContent = setTimeout(onWindowPropertiesCleaned, 3000);
			doc.addEventListener('WindowPropertiesCleaned', onWindowPropertiesCleaned, true);
		} else
			setContentResponse();
	}

	function getResourceContentResponse(message) {
		docs[message.winId].requestManager.onResponse(message.requestId, message.content);
	}

	function setFrameContentRequest(message) {
		docs[message.winId].frames[message.index].setAttribute("src", "data:text/html;charset=utf-8," + encodeURI(message.content));
		bgPort.postMessage({
			setFrameContentResponse : true,
			pageId : pageId,
			winId : message.winId,
			index : message.index
		});
	}

	function getContentRequest(message) {
		if (docs[message.winId].doc)
			bgPort.postMessage({
				getContentResponse : true,
				winId : message.winId,
				pageId : pageId,
				content : singlefile.util.getDocContent(docs[message.winId].doc, docs[message.winId].docElement)
			});
		else
			bgPort.postMessage({
				getContentResponse : true,
				pageId : pageId,
				winId : message.winId,
				content : singlefile.util.getDocContent(doc, docElement)
			});
	}

	function processDoc(message) {
		if (docs[message.winId])
			docs[message.winId].processDoc();
	}

	bgPort = chrome.extension.connect({
		name : "singlefile"
	});
	bgPort.onMessage.addListener(function(message) {
		// if (!message.getResourceContentResponse)
		//	console.log(message);
		if (message.getResourceContentResponse)
			getResourceContentResponse(message);
		if (message.setFrameContentRequest)
			setFrameContentRequest(message);
		if (message.getContentRequest)
			getContentRequest(message);
		if (message.setContentRequest)
			setContentRequest(message);
		if (message.processDoc)
			processDoc(message);
	});
	if (doc.documentElement instanceof HTMLHtmlElement)
		init();

})();
