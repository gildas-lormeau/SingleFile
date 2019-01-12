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

/* global require, exports, Buffer */

const { URL } = require("url");
const fs = require("fs");
const crypto = require("crypto");

const { JSDOM, VirtualConsole } = require("jsdom");
const dataUri = require("strong-data-uri");
const iconv = require("iconv-lite");
const request = require("request-promise-native");

const SCRIPTS = [
	"./lib/single-file/util/doc-util.js",
	"./lib/single-file/util/doc-helper.js",
	"./lib/single-file/vendor/css-tree.js",
	"./lib/single-file/vendor/html-srcset-parser.js",
	"./lib/single-file/vendor/css-minifier.js",
	"./lib/single-file/vendor/css-font-property-parser.js",
	"./lib/single-file/vendor/css-media-query-parser.js",
	"./lib/single-file/modules/html-minifier.js",
	"./lib/single-file/modules/css-fonts-minifier.js",
	"./lib/single-file/modules/css-fonts-alt-minifier.js",
	"./lib/single-file/modules/css-matched-rules.js",
	"./lib/single-file/modules/css-medias-alt-minifier.js",
	"./lib/single-file/modules/css-rules-minifier.js",
	"./lib/single-file/modules/html-images-alt-minifier.js",
	"./lib/single-file/modules/html-serializer.js",
	"./lib/single-file/single-file-core.js"
];

SCRIPTS.forEach(scriptPath => eval(fs.readFileSync(scriptPath).toString()));
const docHelper = this.docHelper;
const modules = {
	docHelper: docHelper,
	srcsetParser: this.srcsetParser,
	cssMinifier: this.cssMinifier,
	htmlMinifier: this.htmlMinifier,
	serializer: this.serializer,
	fontsMinifier: this.fontsMinifier.getInstance(this.cssTree, this.fontPropertyParser, docHelper),
	fontsAltMinifier: this.fontsAltMinifier.getInstance(this.cssTree),
	cssRulesMinifier: this.cssRulesMinifier.getInstance(this.cssTree),
	matchedRules: this.matchedRules.getInstance(this.cssTree),
	mediasAltMinifier: this.mediasAltMinifier.getInstance(this.cssTree, this.mediaQueryParser),
	imagesAltMinifier: this.imagesAltMinifier.getInstance(this.srcsetParser)
};
const domUtil = {
	getResourceContent,
	parseDocContent,
	parseSVGContent,
	isValidFontUrl,
	getContentSize,
	digestText,
	parseURL
};
const SingleFile = this.SingleFileCore.getClass(this.docUtil.getInstance(modules, domUtil), this.cssTree);
exports.getClass = () => SingleFile;
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
	const dom = new JSDOM(pageContent, { url: options.url, virtualConsole: new VirtualConsole(), userAgent: options.userAgent });
	options.win = dom.window;
	options.doc = dom.window.document;
	options.saveRawPage = true;
	options.removeFrames = true;
	const singleFile = new SingleFile(options);
	await singleFile.initialize();
	await singleFile.run();
	return singleFile.getPageData();
};

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

function getContentSize(content) {
	return Buffer.byteLength(content, "utf-8");
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