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

this.frameTree = this.frameTree || (() => {

	const MESSAGE_PREFIX = "__frameTree__";
	const FRAMES_CSS_SELECTOR = "iframe, frame, object[type=\"text/html\"][data]";
	const INIT_REQUEST_MESSAGE = "initRequest";
	const INIT_RESPONSE_MESSAGE = "initResponse";
	const TIMEOUT_INIT_REQUEST_MESSAGE = 500;
	const TOP_WINDOW = window == top;

	let sessionId, sessions, windowId;

	if (TOP_WINDOW) {
		sessions = new Map();
		sessionId = 0;
	}
	addEventListener("message", event => {
		if (typeof event.data == "string" && event.data.startsWith(MESSAGE_PREFIX + "::")) {
			const message = JSON.parse(event.data.substring(MESSAGE_PREFIX.length + 2));
			if (message.method == INIT_REQUEST_MESSAGE) {
				initRequest(message);
			} else if (message.method == INIT_RESPONSE_MESSAGE) {
				initResponse(message);
			}
		}
	}, false);
	return {
		get: async options => {
			options = JSON.parse(JSON.stringify(options));
			options.sessionId = sessionId;
			options.win = null;
			sessionId++;
			return new Promise(resolve => {
				sessions.set(options.sessionId, { frames: [], resolve });
				initRequest({ windowId: "0", sessionId: options.sessionId, options });
			});
		}
	};

	function initRequest(message) {
		const sessionId = message.sessionId;
		windowId = message.windowId;
		const frameElements = document.querySelectorAll(FRAMES_CSS_SELECTOR);
		if (window != top) {
			const docData = docHelper.preProcessDoc(document, window, message.options);
			const content = docHelper.serialize(document);
			docHelper.postProcessDoc(document, window, message.options);
			top.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({
				method: INIT_RESPONSE_MESSAGE, framesData: [{
					windowId,
					content,
					baseURI: document.baseURI,
					title: document.title,
					emptyStyleRulesText: docData.emptyStyleRulesText,
					canvasData: docData.canvasData,
					processed: true
				}], sessionId
			}), "*");
		}
		processFrames(frameElements, message.options, windowId, sessionId, window);
	}

	function initResponse(message) {
		if (TOP_WINDOW) {
			const windowData = sessions.get(message.sessionId);
			if (windowData) {
				message.framesData.forEach(messageFrameData => {
					let frameData = windowData.frames.find(frameData => messageFrameData.windowId == frameData.windowId);
					if (!frameData) {
						frameData = { windowId: messageFrameData.windowId };
						windowData.frames.push(frameData);
					}
					frameData.content = messageFrameData.content;
					frameData.baseURI = messageFrameData.baseURI;
					frameData.title = messageFrameData.title;
					frameData.emptyStyleRulesText = messageFrameData.emptyStyleRulesText;
					frameData.canvasData = messageFrameData.canvasData;
					frameData.processed = messageFrameData.processed;
				});
				const remainingFrames = windowData.frames.filter(frameData => !frameData.processed).length;
				if (!remainingFrames) {
					sessions.delete(message.sessionId);
					windowData.resolve(windowData.frames.sort((frame1, frame2) => frame2.windowId.split(".").length - frame1.windowId.split(".").length));
				}
			}
		} else {
			windowId = message.windowId;
		}
	}

	function processFrames(frameElements, options, windowId, sessionId, win) {
		if (win != top) {
			win.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: INIT_RESPONSE_MESSAGE, windowId, sessionId }), "*");
		}
		let framesData = [];
		frameElements.forEach((frameElement, frameIndex) => {
			const frameWindowId = windowId + "." + frameIndex;
			frameElement.setAttribute(docHelper.WIN_ID_ATTRIBUTE_NAME, frameWindowId);
			framesData.push({ windowId: frameWindowId });
			if (!frameElement.contentDocument) {
				try {
					frameElement.contentWindow.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: INIT_REQUEST_MESSAGE, windowId: frameWindowId, sessionId, options }), "*");
				} catch (error) {
					/* ignored */
				}
			}
			timeout.set(() => top.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({
				method: INIT_RESPONSE_MESSAGE,
				framesData: [{ windowId: frameWindowId, processed: true }],
				windowId: frameWindowId, sessionId
			}), "*"), TIMEOUT_INIT_REQUEST_MESSAGE);
		});
		top.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: INIT_RESPONSE_MESSAGE, framesData, windowId, sessionId }), "*");
		if (frameElements.length) {
			framesData = [];
			frameElements.forEach((frameElement, frameIndex) => {
				const frameWindowId = windowId + "." + frameIndex;
				const frameWindow = frameElement.contentWindow;
				const frameDoc = frameElement.contentDocument;
				if (frameDoc) {
					try {
						processFrames(frameDoc.querySelectorAll(FRAMES_CSS_SELECTOR), options, frameWindowId, sessionId, frameWindow);
						const docData = docHelper.preProcessDoc(frameDoc, frameWindow, options);
						framesData.push({
							windowId: frameWindowId,
							content: docHelper.serialize(frameDoc),
							baseURI: frameDoc.baseURI,
							title: frameDoc.title,
							emptyStyleRulesText: docData.emptyStyleRulesText,
							canvasData: docData.canvasData,
							processed: true
						});
						docHelper.postProcessDoc(frameDoc, frameWindow, options);
					} catch (error) {
						/* ignored */
					}
				}

			});
			top.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: INIT_RESPONSE_MESSAGE, framesData, windowId, sessionId }), "*");
		}
	}

})();