/*
 * Copyright 2010-2019 Gildas Lormeau
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

/* global window, top, document, addEventListener, docHelper, MessageChannel, lazyLoader, browser, setTimeout */

this.frameTree = this.frameTree || (() => {

	const MESSAGE_PREFIX = "__frameTree__::";
	const FRAMES_CSS_SELECTOR = "iframe, frame, object[type=\"text/html\"][data]";
	const INIT_REQUEST_MESSAGE = "initRequest";
	const CLEANUP_REQUEST_MESSAGE = "cleanupRequest";
	const INIT_RESPONSE_MESSAGE = "initResponse";
	const TARGET_ORIGIN = "*";
	const TIMEOUT_INIT_REQUEST_MESSAGE = 750;
	const TOP_WINDOW_ID = "0";
	const WINDOW_ID_SEPARATOR = ".";
	const TOP_WINDOW = window == top;

	const sessions = new Map();
	let windowId;

	if (TOP_WINDOW) {
		windowId = TOP_WINDOW_ID;
		if (this.browser && browser.runtime && browser.runtime.onMessage && browser.runtime.onMessage.addListener) {
			browser.runtime.onMessage.addListener(message => {
				if (message.method == INIT_RESPONSE_MESSAGE) {
					initResponse(message);
				}
			});
		}
	}
	addEventListener("message", event => {
		if (typeof event.data == "string" && event.data.startsWith(MESSAGE_PREFIX)) {
			const message = JSON.parse(event.data.substring(MESSAGE_PREFIX.length));
			if (!TOP_WINDOW && message.method == INIT_REQUEST_MESSAGE) {
				window.stop();
				initRequest(message);
				if (message.options.loadDeferredImages && window.lazyLoader) {
					lazyLoader.process(message.options);
				}
			} else if (message.method == CLEANUP_REQUEST_MESSAGE) {
				cleanupRequest(message);
			} else if (message.method == INIT_RESPONSE_MESSAGE) {
				const port = event.ports[0];
				port.onmessage = event => initResponse(event.data);
			}
			event.preventDefault();
			event.stopPropagation();
		}
	}, true);
	return {
		getAsync: async options => {
			const sessionId = options.sessionId || 0;
			options = JSON.parse(JSON.stringify(options));
			return new Promise(resolve => {
				sessions.set(sessionId, { frames: [], resolve });
				initRequest({ windowId, sessionId, options });
			});
		},
		getSync: options => {
			const sessionId = options.sessionId || 0;
			options = JSON.parse(JSON.stringify(options));
			sessions.set(sessionId, { frames: [] });
			initRequest({ windowId, sessionId, options });
			return sessions.get(sessionId).frames;
		},
		cleanup: options => {
			const sessionId = options.sessionId || 0;
			options = JSON.parse(JSON.stringify(options));
			cleanupRequest({ windowId, sessionId, options });
		},
		initResponse,
		TIMEOUT_INIT_REQUEST_MESSAGE
	};

	function initRequest(message) {
		const sessionId = message.sessionId;
		if (!TOP_WINDOW) {
			windowId = message.windowId;
		}
		processFrames(document.querySelectorAll(FRAMES_CSS_SELECTOR), message.options, windowId, sessionId);
		if (!TOP_WINDOW) {
			sendInitResponse({ framesData: [getFrameData(document, window, windowId, message.options)], sessionId });
		}
	}

	function cleanupRequest(message) {
		const sessionId = message.sessionId;
		const frameElements = document.querySelectorAll(FRAMES_CSS_SELECTOR);
		if (!TOP_WINDOW) {
			windowId = message.windowId;
		}
		cleanupFrames(frameElements, message.options, windowId, sessionId);
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
				if (!frameData.processed) {
					frameData.content = messageFrameData.content;
					frameData.baseURI = messageFrameData.baseURI;
					frameData.title = messageFrameData.title;
					frameData.stylesheetContents = messageFrameData.stylesheetContents;
					frameData.imageData = messageFrameData.imageData;
					frameData.postersData = messageFrameData.postersData;
					frameData.canvasData = messageFrameData.canvasData;
					frameData.fontsData = messageFrameData.fontsData;
					frameData.usedFonts = messageFrameData.usedFonts;
					frameData.shadowRootContents = messageFrameData.shadowRootContents;
					frameData.processed = messageFrameData.processed;
				}
			});
			const remainingFrames = windowData.frames.filter(frameData => !frameData.processed).length;
			if (!remainingFrames) {
				windowData.frames = windowData.frames.sort((frame1, frame2) => frame2.windowId.split(WINDOW_ID_SEPARATOR).length - frame1.windowId.split(WINDOW_ID_SEPARATOR).length);
				if (windowData.resolve) {
					windowData.resolve(windowData.frames);
					sessions.delete(message.sessionId);
				}
			}
		}
	}

	function processFrames(frameElements, options, parentWindowId, sessionId) {
		processFramesAsync(frameElements, options, parentWindowId, sessionId);
		if (frameElements.length) {
			processFramesSync(frameElements, options, parentWindowId, sessionId);
		}
	}

	function processFramesAsync(frameElements, options, parentWindowId, sessionId) {
		const framesData = [];
		frameElements.forEach((frameElement, frameIndex) => {
			const windowId = parentWindowId + WINDOW_ID_SEPARATOR + frameIndex;
			frameElement.setAttribute(docHelper.WIN_ID_ATTRIBUTE_NAME, windowId);
			framesData.push({ windowId });
			try {
				sendMessage(frameElement.contentWindow, { method: INIT_REQUEST_MESSAGE, windowId, sessionId, options });
			} catch (error) {
				/* ignored */
			}
			setTimeout(() => sendInitResponse({ framesData: [{ windowId, processed: true }], sessionId }), TIMEOUT_INIT_REQUEST_MESSAGE);
		});
		sendInitResponse({ framesData, sessionId });
	}

	function processFramesSync(frameElements, options, parentWindowId, sessionId) {
		const framesData = [];
		frameElements.forEach((frameElement, frameIndex) => {
			const windowId = parentWindowId + WINDOW_ID_SEPARATOR + frameIndex;
			let frameDoc;
			try {
				frameDoc = frameElement.contentDocument;
			} catch (error) {
				// ignored
			}
			if (frameDoc) {
				try {
					frameElement.contentWindow.stop();
					processFrames(frameDoc.querySelectorAll(FRAMES_CSS_SELECTOR), options, windowId, sessionId);
					framesData.push(getFrameData(frameDoc, frameElement.contentWindow, windowId, options));
				} catch (error) {
					framesData.push({ windowId, processed: true });
				}
			}
		});
		sendInitResponse({ framesData, sessionId });
	}

	function cleanupFrames(frameElements, options, parentWindowId, sessionId) {
		frameElements.forEach((frameElement, frameIndex) => {
			const windowId = parentWindowId + WINDOW_ID_SEPARATOR + frameIndex;
			frameElement.removeAttribute(docHelper.WIN_ID_ATTRIBUTE_NAME);
			try {
				sendMessage(frameElement.contentWindow, { method: CLEANUP_REQUEST_MESSAGE, windowId, sessionId, options });
			} catch (error) {
				/* ignored */
			}
		});
		frameElements.forEach((frameElement, frameIndex) => {
			const windowId = parentWindowId + WINDOW_ID_SEPARATOR + frameIndex;
			let frameDoc;
			try {
				frameDoc = frameElement.contentDocument;
			} catch (error) {
				// ignored
			}
			if (frameDoc) {
				try {
					cleanupFrames(frameDoc.querySelectorAll(FRAMES_CSS_SELECTOR), options, windowId, sessionId);
				} catch (error) {
					// ignored
				}
			}
		});
	}

	function sendInitResponse(message) {
		message.method = INIT_RESPONSE_MESSAGE;
		try {
			top.frameTree.initResponse(message);
		} catch (error) {
			sendMessage(top, message, true);
		}
	}

	function sendMessage(targetWindow, message, useChannel) {
		if (targetWindow == top && this.browser && browser.runtime && browser.runtime.sendMessage) {
			browser.runtime.sendMessage(message);
		} else {
			if (useChannel) {
				const channel = new MessageChannel();
				targetWindow.postMessage(MESSAGE_PREFIX + JSON.stringify({ method: message.method }), TARGET_ORIGIN, [channel.port2]);
				channel.port1.postMessage(message);
			} else {
				targetWindow.postMessage(MESSAGE_PREFIX + JSON.stringify(message), TARGET_ORIGIN);
			}
		}
	}

	function getFrameData(document, window, windowId, options) {
		const docData = docHelper.preProcessDoc(document, window, options);
		const content = docHelper.serialize(document);
		docHelper.postProcessDoc(document, options);
		const baseURI = document.baseURI.split("#")[0];
		return {
			windowId,
			content,
			baseURI,
			title: document.title,
			stylesheetContents: docData.stylesheetContents,
			imageData: docData.imageData,
			postersData: docData.postersData,
			canvasData: docData.canvasData,
			fontsData: docData.fontsData,
			usedFonts: docData.usedFonts,
			shadowRootContents: docData.shadowRootContents,
			processed: true
		};
	}

})();