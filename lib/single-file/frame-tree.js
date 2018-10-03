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

/* global window, top, document, addEventListener, docHelper, timeout, MessageChannel, superFetch, fetch, TextDecoder, DOMParser */

this.frameTree = this.frameTree || (() => {

	const MESSAGE_PREFIX = "__frameTree__::";
	const FRAMES_CSS_SELECTOR = "iframe, frame, object[type=\"text/html\"][data]";
	const INIT_REQUEST_MESSAGE = "initRequest";
	const INIT_RESPONSE_MESSAGE = "initResponse";
	const TARGET_ORIGIN = "*";
	const TIMEOUT_INIT_REQUEST_MESSAGE = 500;
	const REGEXP_SIMPLE_QUOTES_STRING = /^'(.*?)'$/;
	const REGEXP_DOUBLE_QUOTES_STRING = /^"(.*?)"$/;
	const PREFIX_VALID_FRAME_URL = /^https?:\/\//;
	const TOP_WINDOW_ID = "0";
	const WINDOW_ID_SEPARATOR = ".";
	const TOP_WINDOW = window == top;

	const sessions = new Map();
	let windowId;

	if (TOP_WINDOW) {
		windowId = TOP_WINDOW_ID;
	}
	addEventListener("message", event => {
		if (typeof event.data == "string" && event.data.startsWith(MESSAGE_PREFIX)) {
			const message = JSON.parse(event.data.substring(MESSAGE_PREFIX.length));
			if (message.method == INIT_REQUEST_MESSAGE) {
				window.stop();
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
			sendInitResponse({ framesData: [getFrameData(document, window, windowId, message.options)], sessionId });
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
				if (!frameData.processed) {
					frameData.content = messageFrameData.content;
					frameData.baseURI = messageFrameData.baseURI;
					frameData.title = messageFrameData.title;
					frameData.stylesheetContents = messageFrameData.stylesheetContents;
					frameData.responsiveImageData = messageFrameData.responsiveImageData;
					frameData.imageData = messageFrameData.imageData;
					frameData.postersData = messageFrameData.postersData;
					frameData.canvasData = messageFrameData.canvasData;
					frameData.fontsData = messageFrameData.fontsData;
					frameData.processed = messageFrameData.processed;
					frameData.timeout = messageFrameData.timeout;
				}
			});
			const remainingFrames = windowData.frames.filter(frameData => !frameData.processed).length;
			if (!remainingFrames) {
				sessions.delete(message.sessionId);
				windowData.frames = windowData.frames.sort((frame1, frame2) => frame2.windowId.split(WINDOW_ID_SEPARATOR).length - frame1.windowId.split(WINDOW_ID_SEPARATOR).length);
				if (windowData.resolve) {
					windowData.resolve(windowData.frames);
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
			frameElement.setAttribute(docHelper.windowIdAttributeName(options.sessionId), windowId);
			framesData.push({ windowId });
			if (!frameElement.contentDocument) {
				try {
					sendMessage(frameElement.contentWindow, { method: INIT_REQUEST_MESSAGE, windowId, sessionId, options });
				} catch (error) {
					/* ignored */
				}
				timeout.set(async () => {
					let frameDoc;
					if (frameElement.src && frameElement.src.match(PREFIX_VALID_FRAME_URL)) {
						frameDoc = await getFrameDoc(frameElement.src, parentWindowId, options);
					}
					if (frameDoc) {
						sendInitResponse({ framesData: [getFrameData(frameDoc, null, windowId, options)] });
						timeout.set(() => sendInitResponse({ framesData: [{ windowId, processed: true, timeout: true }], sessionId }));
					} else {
						sendInitResponse({ framesData: [{ windowId, processed: true, timeout: true }], sessionId });
					}
				}, TIMEOUT_INIT_REQUEST_MESSAGE);
			}
		});
		sendInitResponse({ framesData, sessionId });
	}

	function processFramesSync(frameElements, options, parentWindowId, sessionId) {
		const framesData = [];
		frameElements.forEach((frameElement, frameIndex) => {
			const windowId = parentWindowId + WINDOW_ID_SEPARATOR + frameIndex;
			const frameDoc = frameElement.contentDocument;
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

	function sendInitResponse(message) {
		message.method = INIT_RESPONSE_MESSAGE;
		try {
			top.frameTree.initResponse(message);
		} catch (error) {
			sendMessage(top, message, true);
		}
	}

	function sendMessage(targetWindow, message, useChannel) {
		if (useChannel) {
			const channel = new MessageChannel();
			targetWindow.postMessage(MESSAGE_PREFIX + JSON.stringify({ method: message.method }), TARGET_ORIGIN, [channel.port2]);
			channel.port1.postMessage(message);
		} else {
			targetWindow.postMessage(MESSAGE_PREFIX + JSON.stringify(message), TARGET_ORIGIN);
		}
	}

	async function getFrameDoc(frameUrl, parentWindowId, options) {
		let frameContent;
		try {
			frameContent = await ((typeof superFetch !== "undefined" && superFetch.fetch) || fetch)(frameUrl);
		} catch (error) {
			/* ignored */
		}
		if (frameContent && frameContent.status >= 400 && superFetch.hostFetch) {
			try {
				frameContent = await superFetch.hostFetch(frameUrl);
			} catch (error) {
				/* ignored */
			}
		}
		if (frameContent) {
			const contentType = frameContent.headers && frameContent.headers.get("content-type");
			let charSet, mimeType;
			if (contentType) {
				const matchContentType = contentType.toLowerCase().split(";");
				mimeType = matchContentType[0].trim();
				if (mimeType.indexOf("/") <= 0) {
					mimeType = "text/html";
				}
				const charSetValue = matchContentType[1] && matchContentType[1].trim();
				if (charSetValue) {
					const matchCharSet = charSetValue.match(/^charset=(.*)/);
					if (matchCharSet) {
						charSet = removeQuotes(matchCharSet[1]);
					}
				}
			}
			let doc;
			try {
				const buffer = await frameContent.arrayBuffer();
				const content = (new TextDecoder(charSet)).decode(buffer);
				const domParser = new DOMParser();
				doc = domParser.parseFromString(content, mimeType);
			} catch (error) {
				/* ignored */
			}
			if (doc) {
				const frameElements = doc.documentElement.querySelectorAll(FRAMES_CSS_SELECTOR);
				frameElements.forEach((frameElement, frameIndex) => {
					const windowId = parentWindowId + WINDOW_ID_SEPARATOR + frameIndex;
					frameElement.setAttribute(docHelper.windowIdAttributeName(options.sessionId), windowId);
				});
				return doc;
			}
		}
	}

	function removeQuotes(string) {
		string = string.toLowerCase().trim();
		if (string.match(REGEXP_SIMPLE_QUOTES_STRING)) {
			string = string.replace(REGEXP_SIMPLE_QUOTES_STRING, "$1");
		} else {
			string = string.replace(REGEXP_DOUBLE_QUOTES_STRING, "$1");
		}
		return string.trim();
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
			responsiveImageData: docData.responsiveImageData,
			imageData: docData.imageData,
			postersData: docData.postersData,
			canvasData: docData.canvasData,
			fontsData: docData.fontsData,
			processed: true
		};
	}

})();