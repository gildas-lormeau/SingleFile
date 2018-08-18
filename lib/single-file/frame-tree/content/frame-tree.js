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

/* global browser, window, top, document, HTMLHtmlElement, addEventListener, docHelper, timeout */

this.FrameTree = this.FrameTree || (() => {

	const MESSAGE_PREFIX = "__FrameTree__";
	const TIMEOUT_INIT_REQUEST_MESSAGE = 500;
	const TIMEOUT_DATA_RESPONSE_MESSAGE = 500;

	const FrameTree = {
		getFramesData
	};

	let sessions = new Map();
	if (window == top) {
		browser.runtime.onMessage.addListener(onTopBackgroundMessage);
	}
	browser.runtime.onMessage.addListener(onBackgroundMessage);
	addEventListener("message", onFrameWindowMessage, false);
	return FrameTree;

	async function getFramesData(options) {
		const sessionId = options.sessionId;
		const sessionFramesData = sessions.get(sessionId);
		await Promise.all(sessionFramesData.frames.map(async frameData => {
			return new Promise(resolve => {
				sessionFramesData.dataRequestCallbacks.set(frameData.windowId, resolve);
				if (frameData.sameDomain) {
					top.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: "getDataRequest", windowId: frameData.windowId, sessionId, options: { removeHiddenElements: options.removeHiddenElements, compressHTML: options.compressHTML } }), "*");
				} else {
					browser.runtime.sendMessage({
						method: "FrameTree.getDataRequest",
						windowId: frameData.windowId,
						sessionId,
						options: { removeHiddenElements: options.removeHiddenElements, compressHTML: options.compressHTML }
					});
				}
				frameData.getDataResponseTimeout = timeout.set(() => top.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: "getDataResponse", windowId: frameData.windowId, sessionId }), "*"), TIMEOUT_DATA_RESPONSE_MESSAGE);
			});
		}));
		sessions.delete(sessionId);
		return sessionFramesData.frames.sort((frame1, frame2) => frame2.windowId.split(".").length - frame1.windowId.split(".").length);
	}

	function onTopBackgroundMessage(message) {
		if (message.method == "FrameTree.initRequest" && document.documentElement instanceof HTMLHtmlElement) {
			initRequest(message);
		}
		if (message.method == "FrameTree.getDataResponse") {
			getDataResponse(message);
		}
	}

	function onBackgroundMessage(message) {
		if (message.method == "FrameTree.getDataRequest" && FrameTree.windowId == message.windowId) {
			const docData = docHelper.preProcessDoc(document, window, message.options);
			browser.runtime.sendMessage({
				method: "FrameTree.getDataResponse",
				windowId: message.windowId,
				sessionId: message.sessionId,
				tabId: message.tabId,
				content: docHelper.serialize(document),
				emptyStyleRulesText: docData.emptyStyleRulesText,
				canvasData: docData.canvasData,
				baseURI: document.baseURI,
				title: document.title
			});
			docHelper.postProcessDoc(document, message.options);
		}
	}

	function onFrameWindowMessage(event) {
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
	}

	function initRequest(message) {
		FrameTree.windowId = message.windowId;
		const frameElements = document.querySelectorAll("iframe, frame, object[type=\"text/html\"][data]");
		sessions.set(message.sessionId, {
			frames: [],
			dataRequestCallbacks: new Map()
		});
		if (frameElements.length) {
			setFramesWinId(MESSAGE_PREFIX, frameElements, message.options, message.windowId, message.sessionId, window);
		} else {
			top.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: "initResponse", framesData: [], windowId: message.windowId, sessionId: message.sessionId }), "*");
		}
	}

	function initResponse(message) {
		if (window == top) {
			if (message.framesData) {
				message.framesData = message.framesData instanceof Array ? message.framesData : JSON.parse(message.framesData);
				const sessionFramesData = sessions.get(message.sessionId);
				if (sessionFramesData) {
					sessionFramesData.frames = sessionFramesData.frames.concat(...message.framesData);
					const frameData = sessionFramesData.frames.find(frameData => frameData.windowId == message.windowId);
					if (message.windowId != "0") {
						frameData.processed = true;
					}
					const pendingCount = sessionFramesData.frames.filter(frameData => !frameData.processed).length;
					if (!pendingCount && !sessionFramesData.initResponseSent) {
						sessionFramesData.initResponseSent = true;
						browser.runtime.sendMessage({ method: "FrameTree.initResponse", sessionId: message.sessionId });
					}
				}
			}
		} else {
			FrameTree.windowId = message.windowId;
		}
	}

	function getDataResponse(message) {
		delete message.tabId;
		delete message.method;
		const sessionFramesData = sessions.get(message.sessionId);
		const frameData = sessionFramesData.frames.find(frameData => frameData.windowId == message.windowId);
		timeout.clear(frameData.getDataResponseTimeout);
		frameData.content = message.content;
		frameData.baseURI = message.baseURI;
		frameData.title = message.title;
		frameData.emptyStyleRulesText = message.emptyStyleRulesText;
		frameData.canvasData = message.canvasData;
		sessionFramesData.dataRequestCallbacks.get(message.windowId)(message);
	}

	function setFramesWinId(MESSAGE_PREFIX, frameElements, options, windowId, sessionId, win) {
		const framesData = [];
		if (win != top) {
			win.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: "initResponse", windowId, sessionId }), "*");
		}
		frameElements.forEach((frameElement, frameIndex) => {
			let src, sameDomain;
			try {
				sameDomain = Boolean(frameElement.contentDocument && frameElement.contentWindow && top.addEventListener && top);
				src = frameElement.src;
			} catch (error) {
				/* ignored */
			}
			framesData.push({ sameDomain, src, windowId: windowId + "." + frameIndex });
		});
		top.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: "initResponse", framesData, windowId, sessionId }), "*");
		frameElements.forEach((frameElement, frameIndex) => {
			const frameWinId = windowId + "." + frameIndex;
			frameElement.setAttribute(docHelper.WIN_ID_ATTRIBUTE_NAME, frameWinId);
			let frameDoc, frameWindow, topWindow;
			let content, emptyStyleRulesText, canvasData;
			try {
				frameDoc = frameElement.contentDocument;
				frameWindow = frameElement.contentWindow;
				topWindow = top.addEventListener && top;
			} catch (error) {
				/* ignored */
			}
			if (frameWindow && frameDoc && topWindow) {
				setFramesWinId(MESSAGE_PREFIX, frameDoc.querySelectorAll("iframe, frame, object[type=\"text/html\"][data]"), options, frameWinId, sessionId, frameWindow);
				topWindow.addEventListener("message", onMessage, false);
				const docData = docHelper.preProcessDoc(frameDoc, frameWindow, options);
				content = docHelper.serialize(frameDoc);
				emptyStyleRulesText = docData.emptyStyleRulesText;
				canvasData = docData.canvasData;
				docHelper.postProcessDoc(frameDoc, options);
			} else if (frameWindow) {
				frameWindow.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: "initRequest", windowId: frameWinId, sessionId, frameIndex, options }), "*");
				timeout.set(() => top.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: "initResponse", framesData: [], windowId: frameWinId, sessionId, frameIndex }), "*"), TIMEOUT_INIT_REQUEST_MESSAGE);
			}

			function onMessage(event) {
				if (typeof event.data == "string" && event.data.startsWith(MESSAGE_PREFIX + "::")) {
					const message = JSON.parse(event.data.substring(MESSAGE_PREFIX.length + 2));
					if (message.method == "getDataRequest" && message.windowId == frameWinId) {
						topWindow.removeEventListener("message", onMessage, false);
						top.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: "getDataResponse", windowId: message.windowId, sessionId, content, baseURI: frameDoc.baseURI, title: document.title, emptyStyleRulesText, canvasData }), "*");
					}
				}
			}
		});
	}

})();