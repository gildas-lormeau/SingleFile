/*
 * Copyright 2010-2019 Gildas Lormeau
 * contact : gildas.lormeau <at> gmail.com
 * 
 * This file is part of SingleFile.
 *
 *   The code in this file is free software: you can redistribute it and/or 
 *   modify it under the terms of the GNU Affero General Public License 
 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
 *   of the License, or (at your option) any later version.
 * 
 *   The code in this file is distributed in the hope that it will be useful, 
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
 *   General Public License for more details.
 *
 *   As additional permission under GNU AGPL version 3 section 7, you may 
 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
 *   AGPL normally required by section 4, provided you include this license 
 *   notice and a URL through which recipients can access the Corresponding 
 *   Source.
 */

/* global window, top, document, addEventListener, docHelper, MessageChannel, lazyLoader, browser, setTimeout */

this.frameTree = this.frameTree || (() => {

	const MESSAGE_PREFIX = "__frameTree__::";
	const FRAMES_CSS_SELECTOR = "iframe, frame, object[type=\"text/html\"][data]";
	const INIT_REQUEST_MESSAGE = "initRequest";
	const CLEANUP_REQUEST_MESSAGE = "cleanupRequest";
	const INIT_RESPONSE_MESSAGE = "frameTree.initResponse";
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
			} else if (!browser.runtime && message.method == INIT_RESPONSE_MESSAGE) {
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
			cleanupRequest({ windowId, sessionId, options: { sessionId } });
		},
		initResponse,
		TIMEOUT_INIT_REQUEST_MESSAGE
	};

	function initRequest(message) {
		const sessionId = message.sessionId;
		if (!TOP_WINDOW) {
			windowId = message.windowId;
		}
		processFrames(document, document.querySelectorAll(FRAMES_CSS_SELECTOR), message.options, windowId, sessionId);
		if (!TOP_WINDOW) {
			sendInitResponse({ framesData: [getFrameData(document, window, windowId, message.options)], sessionId, requestedFrameId: document.documentElement.dataset.requestedFrameId && windowId });
			delete document.documentElement.dataset.requestedFrameId;
		}
	}

	function cleanupRequest(message) {
		const sessionId = message.sessionId;
		const frameElements = document.querySelectorAll(FRAMES_CSS_SELECTOR);
		cleanupFrames(frameElements, message.windowId, sessionId);
	}

	function initResponse(message) {
		const windowData = sessions.get(message.sessionId);
		if (windowData) {
			if (message.requestedFrameId) {
				windowData.requestedFrameId = message.requestedFrameId;
			}
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
					frameData.stylesheetsData = messageFrameData.stylesheetsData;
					frameData.imagesData = messageFrameData.imagesData;
					frameData.postersData = messageFrameData.postersData;
					frameData.canvasData = messageFrameData.canvasData;
					frameData.fontsData = messageFrameData.fontsData;
					frameData.usedFonts = messageFrameData.usedFonts;
					frameData.shadowRootsData = messageFrameData.shadowRootsData;
					frameData.processed = messageFrameData.processed;
				}
			});
			const remainingFrames = windowData.frames.filter(frameData => !frameData.processed).length;
			if (!remainingFrames) {
				windowData.frames = windowData.frames.sort((frame1, frame2) => frame2.windowId.split(WINDOW_ID_SEPARATOR).length - frame1.windowId.split(WINDOW_ID_SEPARATOR).length);
				if (windowData.resolve) {
					if (windowData.requestedFrameId) {
						windowData.frames.forEach(frameData => {
							if (frameData.windowId == windowData.requestedFrameId) {
								frameData.requestedFrame = true;
							}
						});
					}
					windowData.resolve(windowData.frames);
				}
			}
		}
	}
	function processFrames(doc, frameElements, options, parentWindowId, sessionId) {
		processFramesAsync(doc, frameElements, options, parentWindowId, sessionId);
		if (frameElements.length) {
			processFramesSync(doc, frameElements, options, parentWindowId, sessionId);
		}
	}

	function processFramesAsync(doc, frameElements, options, parentWindowId, sessionId) {
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
		sendInitResponse({ framesData, sessionId, requestedFrameId: doc.documentElement.dataset.requestedFrameId && parentWindowId });
		delete doc.documentElement.dataset.requestedFrameId;
	}

	function processFramesSync(doc, frameElements, options, parentWindowId, sessionId) {
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
					const frameWindow = frameElement.contentWindow;
					frameWindow.stop();
					processFrames(frameDoc, frameDoc.querySelectorAll(FRAMES_CSS_SELECTOR), options, windowId, sessionId);
					framesData.push(getFrameData(frameDoc, frameWindow, windowId, options));
				} catch (error) {
					framesData.push({ windowId, processed: true });
				}
			}
		});
		sendInitResponse({ framesData, sessionId, requestedFrameId: doc.documentElement.dataset.requestedFrameId && parentWindowId });
		delete doc.documentElement.dataset.requestedFrameId;
	}

	function cleanupFrames(frameElements, parentWindowId, sessionId) {
		frameElements.forEach((frameElement, frameIndex) => {
			const windowId = parentWindowId + WINDOW_ID_SEPARATOR + frameIndex;
			frameElement.removeAttribute(docHelper.WIN_ID_ATTRIBUTE_NAME);
			try {
				sendMessage(frameElement.contentWindow, { method: CLEANUP_REQUEST_MESSAGE, windowId, sessionId });
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
					cleanupFrames(frameDoc.querySelectorAll(FRAMES_CSS_SELECTOR), windowId, sessionId);
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
			stylesheetsData: docData.stylesheetsData,
			imagesData: docData.imagesData,
			postersData: docData.postersData,
			canvasData: docData.canvasData,
			fontsData: docData.fontsData,
			usedFonts: docData.usedFonts,
			shadowRootsData: docData.shadowRootsData,
			processed: true
		};
	}

})();