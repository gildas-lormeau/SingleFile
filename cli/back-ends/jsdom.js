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

/* global require, exports */

const crypto = require("crypto");

const { JSDOM, VirtualConsole } = require("jsdom");
const dataUri = require("strong-data-uri");
const iconv = require("iconv-lite");
const request = require("request-promise-native");

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
	let dom;
	try {
		dom = new JSDOM(pageContent, jsdomOptions);
		options.insertSingleFileComment = true;
		options.insertFaviconLink = true;
		const win = dom.window;
		const doc = win.document;
		const scripts = await require("./common/scripts.js").get(options);
		dom.window.eval(scripts);
		if (dom.window.document.readyState == "loading") {
			await new Promise(resolve => win.document.onload = resolve);
		}
		win.Element.prototype.getBoundingClientRect = undefined;
		executeFrameScripts(doc, scripts);
		if (!options.saveRawPage && !options.removeFrames) {
			options.frames = await win.singlefile.lib.frameTree.content.frames.getAsync(options);
		}
		options.win = win;
		options.doc = doc;
		options.removeHiddenElements = false;
		const SingleFile = getSingleFileClass(win, options);
		const singleFile = new SingleFile(options);
		await singleFile.run();
		const pageData = await singleFile.getPageData();
		if (options.includeInfobar) {
			await win.singlefile.common.ui.content.infobar.includeScript(pageData);
		}
		return pageData;
	} finally {
		if (dom && dom.window) {
			dom.window.close();
		}
	}
};

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

function getSingleFileClass(win, options) {
	const helper = win.singlefile.lib.helper;
	const modules = {
		helper: helper,
		srcsetParser: win.singlefile.lib.vendor.srcsetParser,
		cssMinifier: win.singlefile.lib.vendor.cssMinifier,
		htmlMinifier: win.singlefile.lib.modules.htmlMinifier,
		serializer: win.singlefile.lib.modules.serializer,
		fontsMinifier: win.singlefile.lib.modules.fontsMinifier,
		fontsAltMinifier: win.singlefile.lib.modules.fontsAltMinifier,
		cssRulesMinifier: win.singlefile.lib.modules.cssRulesMinifier,
		matchedRules: win.singlefile.lib.modules.matchedRules,
		mediasAltMinifier: win.singlefile.lib.modules.mediasAltMinifier,
		imagesAltMinifier: win.singlefile.lib.modules.imagesAltMinifier
	};
	const domUtil = {
		getResourceContent: resourceURL => getResourceContent(resourceURL, options),
		digestText
	};
	return win.singlefile.lib.core.getClass(win.singlefile.lib.util.getInstance(modules, domUtil), win.singlefile.lib.vendor.cssTree);
}

async function digestText(algo, text) {
	const hash = crypto.createHash(algo.replace("-", "").toLowerCase());
	hash.update(text, "utf-8");
	return hash.digest("hex");
}

async function getResourceContent(resourceURL, options) {
	const resourceContent = await request({
		method: "GET",
		uri: resourceURL,
		resolveWithFullResponse: true,
		encoding: null,
		headers: {
			"User-Agent": options.userAgent
		}
	});
	return {
		getUrl() {
			return resourceContent.request.href;
		},
		getContentType() {
			return resourceContent.headers["content-type"];
		},
		getStatusCode() {
			return resourceContent.statusCode;
		},
		getSize() {
			return resourceContent.body.byteLength;
		},
		getText(charset) {
			return iconv.decode(resourceContent.body, charset);
		},
		async getDataUri(contentType) {
			return dataUri.encode(resourceContent.body, contentType || this.getContentType());
		}
	};
}