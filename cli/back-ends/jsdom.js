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

const { URL } = require("url");
const fs = require("fs");
const crypto = require("crypto");

const { JSDOM, VirtualConsole } = require("jsdom");
const dataUri = require("strong-data-uri");
const iconv = require("iconv-lite");
const request = require("request-promise-native");

const SCRIPTS = [
	"../../lib/frame-tree/frame-tree.js",
	"../../lib/single-file/util/doc-util.js",
	"../../lib/single-file/util/doc-helper.js",
	"../../lib/single-file/util/timeout.js",
	"../../lib/single-file/vendor/css-tree.js",
	"../../lib/single-file/vendor/html-srcset-parser.js",
	"../../lib/single-file/vendor/css-minifier.js",
	"../../lib/single-file/vendor/css-font-property-parser.js",
	"../../lib/single-file/vendor/css-media-query-parser.js",
	"../../lib/single-file/modules/html-minifier.js",
	"../../lib/single-file/modules/css-fonts-minifier.js",
	"../../lib/single-file/modules/css-fonts-alt-minifier.js",
	"../../lib/single-file/modules/css-matched-rules.js",
	"../../lib/single-file/modules/css-medias-alt-minifier.js",
	"../../lib/single-file/modules/css-rules-minifier.js",
	"../../lib/single-file/modules/html-images-alt-minifier.js",
	"../../lib/single-file/modules/html-serializer.js",
	"../../lib/single-file/single-file-core.js"
];

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
		const win = dom.window;
		const doc = win.document;
		const scripts = (await Promise.all(SCRIPTS.map(scriptPath => fs.readFileSync(require.resolve(scriptPath)).toString()))).join("\n");
		dom.window.eval(scripts);
		if (dom.window.document.readyState == "loading") {
			await new Promise(resolve => win.document.onload = resolve);
		}
		win.Element.prototype.getBoundingClientRect = undefined;
		executeFrameScripts(doc, scripts);
		if (!options.saveRawPage && !options.removeFrames) {
			options.framesData = await win.frameTree.getAsync(options);
		}
		options.win = win;
		options.doc = doc;
		const SingleFile = getSingleFileClass(win);
		const singleFile = new SingleFile(options);
		await singleFile.run();
		return singleFile.getPageData();
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

function getSingleFileClass(win) {
	const docHelper = win.docHelper;
	const modules = {
		docHelper: docHelper,
		srcsetParser: win.srcsetParser,
		cssMinifier: win.cssMinifier,
		htmlMinifier: win.htmlMinifier,
		serializer: win.serializer,
		fontsMinifier: win.fontsMinifier.getInstance(win.cssTree, win.fontPropertyParser, docHelper),
		fontsAltMinifier: win.fontsAltMinifier.getInstance(win.cssTree),
		cssRulesMinifier: win.cssRulesMinifier.getInstance(win.cssTree),
		matchedRules: win.matchedRules.getInstance(win.cssTree),
		mediasAltMinifier: win.mediasAltMinifier.getInstance(win.cssTree, win.mediaQueryParser),
		imagesAltMinifier: win.imagesAltMinifier.getInstance(win.srcsetParser)
	};
	const domUtil = {
		getResourceContent,
		parseDocContent,
		parseSVGContent,
		isValidFontUrl,
		digestText,
		parseURL
	};
	return win.SingleFileCore.getClass(win.docUtil.getInstance(modules, domUtil), win.cssTree);
}

function parseDocContent(content) {
	return (new JSDOM(content, {
		contentType: "text/html"
	})).window.document;
}

function parseSVGContent(content) {
	return (new JSDOM(content, {
		contentType: "image/svg+xml"
	})).window.document;
}

async function digestText(algo, text) {
	const hash = crypto.createHash(algo.replace("-", "").toLowerCase());
	hash.update(text, "utf-8");
	return hash.digest("hex");
}

function isValidFontUrl(/* urlFunction */) {
	// TODO?
	return true;
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

function parseURL(resourceURL, baseURI) {
	return new URL(resourceURL, baseURI);
}