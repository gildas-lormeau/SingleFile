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

/* global window, top, document, addEventListener, docHelper, timeout, MessageChannel */

this.frameTree = this.frameTree || (() => {

	const MESSAGE_PREFIX = "__frameTree__";
	const FRAMES_CSS_SELECTOR = "iframe, frame, object[type=\"text/html\"][data]";
	const INIT_REQUEST_MESSAGE = "initRequest";
	const INIT_RESPONSE_MESSAGE = "initResponse";
	const TIMEOUT_INIT_REQUEST_MESSAGE = 500;
	const TOP_WINDOW_ID = "0";
	const TOP_WINDOW = window == top;

	let sessions = new Map(), windowId;

	if (TOP_WINDOW) {
		windowId = TOP_WINDOW_ID;
	}
	addEventListener("message", event => {
		if (typeof event.data == "string" && event.data.startsWith(MESSAGE_PREFIX + "::")) {
			const message = JSON.parse(event.data.substring(MESSAGE_PREFIX.length + 2));
			if (message.method == INIT_REQUEST_MESSAGE) {
				initRequest(message);
			} else if (message.method == INIT_RESPONSE_MESSAGE) {
				const port = event.ports[0];
				port.onmessage = event => initResponse(event.data);
			}
		}
	}, false);
	return {
		getAsync: async options => {
			const sessionId = options.sessionId;
			options = JSON.parse(JSON.stringify(options));
			return new Promise(resolve => {
				sessions.set(sessionId, { frames: [], resolve });
				initRequest({ windowId, sessionId, options });
			});
		},
		getSync: options => {
			const sessionId = options.sessionId;
			options = JSON.parse(JSON.stringify(options));
			sessions.set(sessionId, { frames: [] });
			initRequest({ windowId, sessionId, options });
			return sessions.get(sessionId).frames;
		},
		initResponse
	};

	function initRequest(message) {
		const sessionId = message.sessionId;
		const frameElements = document.querySelectorAll(FRAMES_CSS_SELECTOR);
		if (!TOP_WINDOW) {
			windowId = message.windowId;
			const docData = docHelper.preProcessDoc(document, window, message.options);
			const content = docHelper.serialize(document);
			docHelper.postProcessDoc(document, window, message.options);
			const framesData = [{
				windowId,
				content,
				baseURI: document.baseURI.split("#")[0],
				title: document.title,
				stylesheetContents: docData.stylesheetContents,
				canvasData: docData.canvasData,
				processed: true,
			}];
			sendInitResponse({ framesData, sessionId });
		}
		processFrames(frameElements, message.options, windowId, sessionId);
	}

	function initResponse(message) {
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
				frameData.stylesheetContents = messageFrameData.stylesheetContents;
				frameData.canvasData = messageFrameData.canvasData;
				frameData.processed = messageFrameData.processed;
				frameData.timeout = messageFrameData.timeout;
			});
			const remainingFrames = windowData.frames.filter(frameData => !frameData.processed).length;
			if (!remainingFrames) {
				sessions.delete(message.sessionId);
				windowData.frames = windowData.frames.sort((frame1, frame2) => frame2.windowId.split(".").length - frame1.windowId.split(".").length);
				if (windowData.resolve) {
					windowData.resolve(windowData.frames);
				}
			}
		}
	}

	function processFrames(frameElements, options, parentWindowId, sessionId) {
		processFramesSync(frameElements, options, parentWindowId, sessionId);
		if (frameElements.length) {
			processFramesAsync(frameElements, options, parentWindowId, sessionId);
		}
	}

	function processFramesSync(frameElements, options, parentWindowId, sessionId) {
		let framesData = [];
		frameElements.forEach((frameElement, frameIndex) => {
			const windowId = parentWindowId + "." + frameIndex;
			frameElement.setAttribute(docHelper.windowIdAttributeName(options.sessionId), windowId);
			framesData.push({ windowId });
			if (!frameElement.contentDocument) {
				try {
					frameElement.contentWindow.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: INIT_REQUEST_MESSAGE, windowId, sessionId, options }), "*");
				} catch (error) {
					/* ignored */
				}
			}
			timeout.set(() => sendInitResponse({ framesData: [{ windowId, processed: true, timeout: true }], windowId, sessionId }, "*"), TIMEOUT_INIT_REQUEST_MESSAGE);
		});
		sendInitResponse({ framesData, parentWindowId, sessionId });
	}

	function processFramesAsync(frameElements, options, parentWindowId, sessionId) {
		let framesData = [];
		frameElements.forEach((frameElement, frameIndex) => {
			const windowId = parentWindowId + "." + frameIndex;
			const frameWindow = frameElement.contentWindow;
			const frameDoc = frameElement.contentDocument;
			if (frameDoc) {
				try {
					processFrames(frameDoc.querySelectorAll(FRAMES_CSS_SELECTOR), options, windowId, sessionId);
					const docData = docHelper.preProcessDoc(frameDoc, frameWindow, options);
					const content = docHelper.serialize(frameDoc);
					const baseURI = frameDoc.baseURI.split("#")[0];
					framesData.push({ windowId, content, baseURI, title: frameDoc.title, stylesheetContents: docData.stylesheetContents, canvasData: docData.canvasData, processed: true });
					docHelper.postProcessDoc(frameDoc, frameWindow, options);
				} catch (error) {
					framesData.push({ windowId, processed: true });
				}
			}
		});
		sendInitResponse({ framesData, parentWindowId, sessionId });
	}

	function sendInitResponse(message) {
		message.method = INIT_RESPONSE_MESSAGE;
		try {
			top.frameTree.initResponse(message);
		} catch (error) {
			const channel = new MessageChannel();
			const port = channel.port1;
			top.postMessage(MESSAGE_PREFIX + "::" + JSON.stringify({ method: INIT_RESPONSE_MESSAGE }), "*", [channel.port2]);
			port.postMessage(message);
		}
	}

})();