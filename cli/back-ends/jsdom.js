/*
 * Copyright 2010-2020 Gildas Lormeau
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

/* global require, exports */

const crypto = require("crypto");

const { JSDOM, VirtualConsole } = require("jsdom");
const iconv = require("iconv-lite");
const request = require("request-promise-native");

exports.initialize = async () => { };

exports.getPageData = async options => {
	const pageContent = (await request({
		method: "GET",
		uri: options.url,
		resolveWithFullResponse: true,
		encoding: null,
		headers: {
			"User-Agent": options.userAgent
		}
	})).body.toString();
	let win;
	try {
		const dom = new JSDOM(pageContent, getBrowserOptions(options));
		win = dom.window;
		return await getPageData(win, options);
	} finally {
		if (win) {
			win.close();
		}
	}
};

exports.closeBrowser = () => { };

async function getPageData(win, options) {
	const doc = win.document;
	const scripts = await require("./common/scripts.js").get(options);
	win.TextDecoder = class {
		constructor(utfLabel) {
			this.utfLabel = utfLabel;
		}
		decode(buffer) {
			return iconv.decode(buffer, this.utfLabel);
		}
	};
	win.crypto = {
		subtle: {
			digest: async function digestText(algo, text) {
				const hash = crypto.createHash(algo.replace("-", "").toLowerCase());
				hash.update(text, "utf-8");
				return hash.digest();
			}
		}
	};
	win.Element.prototype.getBoundingClientRect = undefined;
	win.getComputedStyle = () => { };
	win.eval(scripts);
	if (win.document.readyState == "loading" || win.document.readyState == "interactive") {
		await new Promise(resolve => win.onload = resolve);
	}
	executeFrameScripts(doc, scripts);
	options.removeHiddenElements = false;
	const pageData = await win.singlefile.lib.getPageData(options, { fetch: url => fetchResource(url, options) }, doc, win);
	if (options.includeInfobar) {
		await win.singlefile.common.ui.content.infobar.includeScript(pageData);
	}
	return pageData;
}

function getBrowserOptions(options) {
	const jsdomOptions = {
		url: options.url,
		virtualConsole: new VirtualConsole(),
		userAgent: options.userAgent,
		pretendToBeVisual: true,
		runScripts: "outside-only",
		resources: "usable"
	};
	if (options.browserWidth && options.browserHeight) {
		jsdomOptions.beforeParse = function (window) {
			window.outerWidth = window.innerWidth = options.browserWidth;
			window.outerHeight = window.innerHeight = options.browserHeight;
		};
	}
	return jsdomOptions;
}

function executeFrameScripts(doc, scripts) {
	const frameElements = doc.querySelectorAll("iframe, frame");
	frameElements.forEach(frameElement => {
		try {
			frameElement.contentWindow.Element.prototype.getBoundingClientRect = undefined;
			frameElement.contentWindow.eval(scripts);
			executeFrameScripts(frameElement.contentDocument, scripts);
		} catch (error) {
			// ignored
		}
	});
}

async function fetchResource(resourceURL, options) {
	const response = await request({
		method: "GET",
		uri: resourceURL,
		resolveWithFullResponse: true,
		encoding: null,
		headers: {
			"User-Agent": options.userAgent
		}
	});
	return {
		status: response.statusCode,
		headers: {
			get: name => response.headers[name]
		},
		arrayBuffer: async () => response.body
	};
}