/*
 * Copyright 2018 Gildas Lormeau
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

/* global browser, window, top, document, HTMLHtmlElement, addEventListener */

this.FrameTree = this.FrameTree || (() => {

	const MESSAGE_PREFIX = "__FrameTree__";
	const TIMEOUT_INIT_REQUEST_MESSAGE = 1000;
	const TIMEOUT_DATA_RESPONSE_MESSAGE = 1000;
	const REMOVED_CONTENT_ATTRIBUTE_NAME = "data-single-file-removed-content";
	const PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME = "data-single-file-preserved-space-element";

	const FrameTree = { getFramesData };

	let framesData, dataRequestCallbacks;

	if (window == top) {
		browser.runtime.onMessage.addListener(message => {
			if (message.method == "FrameTree.initRequest" && document.documentElement instanceof HTMLHtmlElement) {
				dataRequestCallbacks = new Map();
				framesData = [];
				initRequest(message);
			}
			if (message.method == "FrameTree.getDataResponse") {
				getDataResponse(message);
			}
		});
	}
	browser.runtime.onMessage.addListener(message => {
		if (message.method == "FrameTree.getDataRequest" && FrameTree.windowId == message.windowId) {
			preProcessDoc(document, window, message.options);
			browser.runtime.sendMessage({
				method: "FrameTree.getDataResponse",
				windowId: message.windowId,
				tabId: message.tabId,
				content: getDoctype(document) + document.documentElement.outerHTML,
				emptyStyleRulesText: getEmptyStyleRulesText(document),
				canvasData: getCanvasData(document),
				baseURI: document.baseURI,
				title: document.title
			}).catch(() => {/* ignored */ });
			postProcessDoc(document, message.options);
		}
	});
	addEventListener("message", event => {
		if (typeof event.data == "string" && event.data.startsWith(MESSAGE_PREFIX + "::")) {
			const message = JSON.parse(event.data.substring(MESSAGE_PREFIX.length + 2));
			if (message.method == "initRequest") {
				initRequest(message);
			} else if (message.method == "initResponse") {
				initResponse(message);
			} else if (message.method == "getDataResponse") {
				getDataResponse(message);
			}
		}
	}, false);
	return FrameTree;

	async function getFramesData(options) {
		await Promise.all(framesData.map(async frameData => {
			return new Promise(resolve => {
				dataRequestCallbacks.set(frameData.windowId, resolve);
				if (frameData.sameDomain) {
					top.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: "getDataRequest", windowId: frameData.windowId, options: { removeHiddenElements: options.removeHiddenElements, compressHTML: options.compressHTML } }), "*");
				} else {
					browser.runtime.sendMessage({
						method: "FrameTree.getDataRequest",
						windowId: frameData.windowId,
						options: { removeHiddenElements: options.removeHiddenElements, compressHTML: options.compressHTML }
					}).catch(() => { /* ignored */ });
				}
				frameData.getDataResponseTimeout = setTimeout(() => top.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: "getDataResponse", windowId: frameData.windowId }), "*"), TIMEOUT_DATA_RESPONSE_MESSAGE);
			});
		}));
		return framesData.sort((frame1, frame2) => frame2.windowId.split(".").length - frame1.windowId.split(".").length);
	}

	function initRequest(message) {
		FrameTree.windowId = message.windowId;
		FrameTree.index = message.index;
		const frameElements = document.querySelectorAll("iframe, frame, object[type=\"text/html\"][data]");
		if (frameElements.length) {
			setFramesWinId(MESSAGE_PREFIX, frameElements, FrameTree.index, FrameTree.windowId, window);
		} else {
			top.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: "initResponse", framesData: [], windowId: FrameTree.windowId, index: FrameTree.index }), "*");
		}
	}

	function initResponse(message) {
		if (window == top) {
			if (message.framesData) {
				message.framesData = message.framesData instanceof Array ? message.framesData : JSON.parse(message.framesData);
				framesData = framesData.concat(message.framesData);
				const frameData = framesData.find(frameData => frameData.windowId == message.windowId);
				const pendingCount = framesData.filter(frameData => !frameData.processed).length;
				if (message.windowId != "0") {
					frameData.processed = true;
				}
				if (!pendingCount || pendingCount == 1) {
					browser.runtime.sendMessage({ method: "FrameTree.initResponse" })
						.catch(() => { /* ignored */ });
				}
			}
		} else {
			FrameTree.windowId = message.windowId;
			FrameTree.index = message.index;
		}
	}

	function setFramesWinId(MESSAGE_PREFIX, frameElements, index, windowId, win) {
		const framesData = [];
		if (win != top) {
			win.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: "initResponse", windowId, index }), "*");
		}
		frameElements.forEach((frameElement, index) => {
			let src, sameDomain;
			try {
				sameDomain = Boolean(frameElement.contentDocument && frameElement.contentWindow && top.addEventListener && top);
				src = frameElement.src;
			} catch (error) {
				/* ignored */
			}
			framesData.push({ sameDomain, src, index, windowId: windowId + "." + index });
		});
		top.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: "initResponse", framesData, windowId, index }), "*");
		frameElements.forEach((frameElement, index) => {
			const frameWinId = windowId + "." + index;
			frameElement.setAttribute("data-frame-tree-win-id", frameWinId);
			let frameDoc, frameWindow, topWindow;
			try {
				frameDoc = frameElement.contentDocument;
				frameWindow = frameElement.contentWindow;
				topWindow = top.addEventListener && top;
			} catch (error) {
				/* ignored */
			}
			if (frameWindow && frameDoc && topWindow) {
				setFramesWinId(MESSAGE_PREFIX, frameDoc.querySelectorAll("iframe, frame, object[type=\"text/html\"][data]"), index, frameWinId, frameWindow);
				topWindow.addEventListener("message", onMessage, false);
			} else if (frameWindow) {
				frameWindow.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: "initRequest", windowId: frameWinId, index }), "*");
				setTimeout(() => top.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: "initResponse", framesData: [], windowId: frameWinId, index }), "*"), TIMEOUT_INIT_REQUEST_MESSAGE);
			}

			function onMessage(event) {
				if (typeof event.data == "string" && event.data.startsWith(MESSAGE_PREFIX + "::")) {
					const message = JSON.parse(event.data.substring(MESSAGE_PREFIX.length + 2));
					if (message.method == "getDataRequest" && message.windowId == frameWinId) {
						topWindow.removeEventListener("message", onMessage, false);
						preProcessDoc(frameDoc, frameWindow, message.options);
						const content = getDoctype(frameDoc) + frameDoc.documentElement.outerHTML;
						const emptyStyleRulesText = getEmptyStyleRulesText(frameDoc);
						const canvasData = getCanvasData(frameDoc);
						top.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: "getDataResponse", windowId: message.windowId, content, baseURI: frameDoc.baseURI, title: document.title, emptyStyleRulesText, canvasData }), "*");
						postProcessDoc(frameDoc, frameWindow, message.options);
					}
				}
			}
		});
	}

	function getDataResponse(message) {
		delete message.tabId;
		delete message.method;
		const frameData = framesData.find(frameData => frameData.windowId == message.windowId);
		clearTimeout(frameData.getDataResponseTimeout);
		frameData.content = message.content;
		frameData.baseURI = message.baseURI;
		frameData.title = message.title;
		frameData.emptyStyleRulesText = message.emptyStyleRulesText;
		frameData.canvasData = message.canvasData;
		dataRequestCallbacks.get(message.windowId)(message);
	}

	function getDoctype(doc) {
		const docType = doc.doctype;
		let docTypeStr;
		if (docType) {
			docTypeStr = "<!DOCTYPE " + docType.nodeName;
			if (docType.publicId) {
				docTypeStr += " PUBLIC \"" + docType.publicId + "\"";
				if (docType.systemId) {
					docTypeStr += " \"" + docType.systemId + "\"";
				}
			} else if (docType.systemId) {
				docTypeStr += " SYSTEM \"" + docType.systemId + "\"";
			} if (docType.internalSubset) {
				docTypeStr += " [" + docType.internalSubset + "]";
			}
			return docTypeStr + ">\n";
		}
		return "";
	}

	function getEmptyStyleRulesText(doc) {
		if (doc) {
			const textData = [];
			doc.querySelectorAll("style").forEach(styleElement => {
				if (!styleElement.textContent) {
					textData.push(Array.from(styleElement.sheet.cssRules).map(rule => rule.cssText).join("\n"));
				}
			});
			return textData;
		}
	}

	function getCanvasData(doc) {
		if (doc) {
			const canvasData = [];
			doc.querySelectorAll("canvas").forEach(canvasElement => {
				try {
					canvasData.push({ dataURI: canvasElement.toDataURL("image/png", ""), width: canvasElement.clientWidth, height: canvasElement.clientHeight });
				} catch (error) {
					canvasData.push(null);
				}
			});
			return canvasData;
		}
	}

	function preProcessDoc(doc, win, options) {
		doc.querySelectorAll("script").forEach(element => element.textContent = element.textContent.replace(/<\/script>/gi, "<\\/script>"));
		doc.head.querySelectorAll("noscript").forEach(element => {
			const disabledNoscriptElement = doc.createElement("disabled-noscript");
			Array.from(element.childNodes).forEach(node => disabledNoscriptElement.appendChild(node));
			disabledNoscriptElement.hidden = true;
			element.parentElement.replaceChild(disabledNoscriptElement, element);
		});
		doc.head.querySelectorAll("*:not(base):not(link):not(meta):not(noscript):not(script):not(style):not(template):not(title)").forEach(element => element.hidden = true);
		if (options.removeHiddenElements) {
			doc.querySelectorAll("html > body *:not(style):not(script):not(link):not(frame):not(iframe):not(object)").forEach(element => {
				const style = win.getComputedStyle(element);
				if (element instanceof win.HTMLElement && (element.hidden || style.display == "none" || ((style.opacity === 0 || style.visibility == "hidden") && !element.clientWidth && !element.clientHeight)) && !element.querySelector("iframe, frame, object[type=\"text/html\"][data]")) {
					element.setAttribute(REMOVED_CONTENT_ATTRIBUTE_NAME, "");
				}
			});
		}
		if (options.compressHTML) {
			doc.querySelectorAll("*").forEach(element => {
				const style = win.getComputedStyle(element);
				if (style.whiteSpace.startsWith("pre")) {
					element.setAttribute(PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME, "");
				}
			});
		}
	}

	function postProcessDoc(doc, options) {
		doc.head.querySelectorAll("disabled-noscript").forEach(element => {
			const noscriptElement = doc.createElement("noscript");
			Array.from(element.childNodes).forEach(node => noscriptElement.appendChild(node));
			element.parentElement.replaceChild(noscriptElement, element);
		});
		doc.head.querySelectorAll("*:not(base):not(link):not(meta):not(noscript):not(script):not(style):not(template):not(title)").forEach(element => element.removeAttribute("hidden"));
		if (options.removeHiddenElements) {
			doc.querySelectorAll("[" + REMOVED_CONTENT_ATTRIBUTE_NAME + "]").forEach(element => element.removeAttribute(REMOVED_CONTENT_ATTRIBUTE_NAME));
		}
		if (options.compressHTML) {
			doc.querySelectorAll("[" + PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME + "]").forEach(element => element.removeAttribute(PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME));
		}
	}

})();