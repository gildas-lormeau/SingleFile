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

/* global window, top, document, HTMLHtmlElement, addEventListener */

this.FrameTree = (() => {

	const browser = this.browser || this.chrome;

	const MESSAGE_PREFIX = "__FrameTree__";
	const TIMEOUT_INIT_REQUEST_MESSAGE = 1000;
	const TIMEOUT_DATA_RESPONSE_MESSAGE = 1000;

	const FrameTree = {
		getFramesData
	};

	let framesData;
	let dataRequestCallbacks;

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
			browser.runtime.sendMessage({
				method: "FrameTree.getDataResponse",
				windowId: message.windowId,
				tabId: message.tabId,
				content: getDoctype(document) + document.documentElement.outerHTML,
				baseURI: document.baseURI,
				title: document.title
			});
		}
	});
	addEventListener("message", event => {
		if (typeof event.data === "string" && event.data.startsWith(MESSAGE_PREFIX + "::")) {
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

	async function getFramesData() {
		await Promise.all(framesData.map(async frameData => {
			return new Promise(resolve => {
				dataRequestCallbacks.set(frameData.windowId, resolve);
				if (frameData.sameDomain) {
					top.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: "getDataRequest", windowId: frameData.windowId }), "*");
				} else {
					browser.runtime.sendMessage({
						method: "FrameTree.getDataRequest",
						windowId: frameData.windowId
					});
				}
				frameData.getDataResponseTimeout = setTimeout(() => top.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: "getDataResponse", windowId: frameData.windowId }), "*"), TIMEOUT_DATA_RESPONSE_MESSAGE);
			});
		}));
		return framesData.sort((frame1, frame2) => frame2.windowId.split(".").length - frame1.windowId.split(".").length);
	}

	function initRequest(message) {
		FrameTree.windowId = message.windowId;
		FrameTree.index = message.index;
		const frameElements = document.querySelectorAll("iframe, frame");
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
					browser.runtime.sendMessage({ method: "FrameTree.initResponse" });
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
			} catch (e) {
				/* ignored */
			}
			framesData.push({ sameDomain, src, index, windowId: windowId + "." + index });
		});
		top.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: "initResponse", framesData, windowId, index }), "*");
		frameElements.forEach((frameElement, index) => {
			const frameWinId = windowId + "." + index;
			let frameDoc, frameWindow, topWindow;
			try {
				frameDoc = frameElement.contentDocument;
				frameWindow = frameElement.contentWindow;
				topWindow = top.addEventListener && top;
			} catch (e) {
				/* ignored */
			}
			if (frameWindow && frameDoc && topWindow) {
				setFramesWinId(MESSAGE_PREFIX, frameDoc.querySelectorAll("iframe, frame"), index, frameWinId, frameWindow);
				topWindow.addEventListener("message", onMessage, false);
			} else if (frameWindow) {
				frameWindow.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: "initRequest", windowId: frameWinId, index }), "*");
				setTimeout(() => top.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: "initResponse", framesData: [], windowId: frameWinId, index }), "*"), TIMEOUT_INIT_REQUEST_MESSAGE);
			}

			function onMessage(event) {
				if (typeof event.data === "string" && event.data.startsWith(MESSAGE_PREFIX + "::")) {
					const message = JSON.parse(event.data.substring(MESSAGE_PREFIX.length + 2));
					if (message.method == "getDataRequest" && message.windowId == frameWinId) {
						topWindow.removeEventListener("message", onMessage, false);
						const content = getDoctype(frameDoc) + frameDoc.documentElement.outerHTML;
						top.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: "getDataResponse", windowId: message.windowId, content, baseURI: frameDoc.baseURI, title: document.title }), "*");
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

})();