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

/* global window, top, document, addEventListener, docHelper, timeout */

this.FrameTree = this.FrameTree || (() => {

	const MESSAGE_PREFIX = "__FrameTree__";
	const TIMEOUT_INIT_REQUEST_MESSAGE = 500;

	let sessionId = 0;

	const FrameTree = {
		getFramesData
	};

	let sessions = new Map();
	addEventListener("message", onFrameWindowMessage, false);
	return FrameTree;

	async function getFramesData(options) {
		options = JSON.parse(JSON.stringify(options));
		options.sessionId = sessionId;
		sessionId++;
		return new Promise(resolve => {
			sessions.set(options.sessionId, {
				frames: [],
				dataRequestCallbacks: new Map(),
				resolve
			});
			initRequest({ windowId: "0", sessionId: options.sessionId, options });
		});
	}

	function onFrameWindowMessage(event) {
		if (typeof event.data == "string" && event.data.startsWith(MESSAGE_PREFIX + "::")) {
			const message = JSON.parse(event.data.substring(MESSAGE_PREFIX.length + 2));
			if (message.method == "initRequest") {
				initRequest(message);
			} else if (message.method == "initResponse") {
				initResponse(message);
			}
		}
	}

	function initRequest(message) {
		const windowId = message.windowId;
		const sessionId = message.sessionId;
		FrameTree.windowId = windowId;
		const frameElements = document.querySelectorAll("iframe, frame, object[type=\"text/html\"][data]");
		if (window != top) {
			sessions.set(message.sessionId, {
				frames: [],
				dataRequestCallbacks: new Map()
			});
			const docData = docHelper.preProcessDoc(document, window, message.options);
			const content = docHelper.serialize(document);
			docHelper.postProcessDoc(document, window, message.options);
			top.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: "initResponse", framesData: [{ windowId, content, baseURI: document.baseURI, title: document.title, emptyStyleRulesText: docData.emptyStyleRulesText, canvasData: docData.canvasData, processed: true }], sessionId }), "*");
		}
		processFrames(frameElements, message.options, windowId, sessionId, window);
	}

	function initResponse(message) {
		if (window == top) {
			const sessionFramesData = sessions.get(message.sessionId);
			if (sessionFramesData) {
				message.framesData.forEach(messageFrameData => {
					let frameData = sessionFramesData.frames.find(frameData => messageFrameData.windowId == frameData.windowId);
					if (!frameData) {
						frameData = { windowId: messageFrameData.windowId };
						sessionFramesData.frames.push(frameData);
					}
					frameData.content = messageFrameData.content;
					frameData.baseURI = messageFrameData.baseURI;
					frameData.title = messageFrameData.title;
					frameData.emptyStyleRulesText = messageFrameData.emptyStyleRulesText;
					frameData.canvasData = messageFrameData.canvasData;
					frameData.processed = messageFrameData.processed;
				});
				const pendingCount = sessionFramesData.frames.filter(frameData => !frameData.processed).length;
				if (!pendingCount) {
					sessions.delete(message.sessionId);
					sessionFramesData.resolve(sessionFramesData.frames.sort((frame1, frame2) => frame2.windowId.split(".").length - frame1.windowId.split(".").length));
				}
			}
		} else {
			FrameTree.windowId = message.windowId;
		}
	}

	function processFrames(frameElements, options, windowId, sessionId, win) {
		if (win != top) {
			win.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: "initResponse", windowId, sessionId }), "*");
		}
		let framesData = [];
		frameElements.forEach((frameElement, frameIndex) => {
			const frameWinId = windowId + "." + frameIndex;
			frameElement.setAttribute(docHelper.WIN_ID_ATTRIBUTE_NAME, frameWinId);
			framesData.push({ windowId: frameWinId });
			try {
				if (!frameElement.contentDocument) {
					options.win = null;
					frameElement.contentWindow.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: "initRequest", windowId: frameWinId, sessionId, options }), "*");
					timeout.set(() => top.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: "initResponse", framesData: [{ windowId: frameWinId, processed: true }], windowId: frameWinId, sessionId }), "*"), TIMEOUT_INIT_REQUEST_MESSAGE);
				}
			} catch (error) {
				/* ignored */
			}
		});
		top.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: "initResponse", framesData, windowId, sessionId }), "*");
		framesData = [];
		frameElements.forEach((frameElement, frameIndex) => {
			const frameWinId = windowId + "." + frameIndex;
			const frameWindow = frameElement.contentWindow;
			try {
				const frameDoc = frameElement.contentDocument;
				if (frameDoc) {
					processFrames(frameDoc.querySelectorAll("iframe, frame, object[type=\"text/html\"][data]"), options, frameWinId, sessionId, frameWindow);
					const docData = docHelper.preProcessDoc(frameDoc, frameWindow, options);
					framesData.push({ windowId: frameWinId, content: docHelper.serialize(frameDoc), baseURI: frameDoc.baseURI, title: frameDoc.title, emptyStyleRulesText: docData.emptyStyleRulesText, canvasData: docData.canvasData, processed: true });
					docHelper.postProcessDoc(frameDoc, frameWindow, options);
				}
			} catch (error) {
				/* ignored */
			}
		});
		top.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: "initResponse", framesData, windowId, sessionId }), "*");
	}

})();