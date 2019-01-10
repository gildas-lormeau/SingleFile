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

const fs = require("fs");
const crypto = require("crypto");

const jsdom = require("jsdom");
const dataUri = require("strong-data-uri");
const iconv = require("iconv-lite");
const request = require("request-promise-native");
const { JSDOM } = jsdom;

const ONE_MB = 1024 * 1024;
const PREFIX_CONTENT_TYPE_TEXT = "text/";
const SCRIPTS = [
	"./lib/single-file/util/doc-util-core.js",
	"./lib/single-file/util/doc-helper.js",
	"./lib/single-file/vendor/css-tree.js",
	"./lib/single-file/vendor/html-srcset-parser.js",
	"./lib/single-file/vendor/css-minifier.js",
	"./lib/single-file/vendor/css-font-property-parser.js",
	"./lib/single-file/vendor/css-media-query-parser.js",
	"./lib/single-file/single-file-core.js",
	"./lib/single-file/modules/html-minifier.js",
	"./lib/single-file/modules/css-fonts-minifier.js",
	"./lib/single-file/modules/css-fonts-alt-minifier.js",
	"./lib/single-file/modules/css-matched-rules.js",
	"./lib/single-file/modules/css-medias-alt-minifier.js",
	"./lib/single-file/modules/css-rules-minifier.js",
	"./lib/single-file/modules/html-images-alt-minifier.js",
	"./lib/single-file/modules/html-serializer.js",
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
	mediasMinifier: this.mediasMinifier.getInstance(this.cssTree, this.mediaQueryParser),
	imagesAltMinifier: this.imagesAltMinifier.getInstance(this.srcsetParser)
};
const domUtil = {
	getContent,
	parseDocContent,
	parseSVGContent,
	isValidFontUrl,
	getContentSize,
	digestText
};

exports.getClass = () => {
	const DocUtil = this.DocUtilCore.getClass(modules, domUtil);
	return this.SingleFileCore.getClass(DocUtil, this.cssTree);
};

function parseDocContent(content, baseURI) {
	const doc = (new JSDOM(content, {
		contentType: "text/html"
	})).window.document;
	let baseElement = doc.querySelector("base");
	if (!baseElement || !baseElement.getAttribute("href")) {
		if (baseElement) {
			baseElement.remove();
		}
		baseElement = doc.createElement("base");
		baseElement.setAttribute("href", baseURI);
		doc.head.insertBefore(baseElement, doc.head.firstChild);
	}
	return doc;
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

async function getContent(resourceURL, options) {
	const requestOptions = {
		method: "GET",
		uri: resourceURL,
		resolveWithFullResponse: true,
		encoding: null,
		headers: {
			"User-Agent": options.userAgent
		}
	};
	let resourceContent;
	try {
		resourceContent = await request(requestOptions);
	} catch (e) {
		return options.asDataURI ? "data:base64," : "";
	}
	let contentType = resourceContent.headers["content-type"];
	let charset;
	if (contentType) {
		const matchContentType = contentType.toLowerCase().split(";");
		contentType = matchContentType[0].trim();
		if (!contentType.includes("/")) {
			contentType = null;
		}
		const charsetValue = matchContentType[1] && matchContentType[1].trim();
		if (charsetValue) {
			const matchCharset = charsetValue.match(/^charset=(.*)/);
			if (matchCharset && matchCharset[1]) {
				charset = docHelper.removeQuotes(matchCharset[1].trim());
			}
		}
	}
	if (!charset && options.charset) {
		charset = options.charset;
	}
	if (options && options.asDataURI) {
		try {
			const buffer = resourceContent.body;
			if (options.maxResourceSizeEnabled && buffer.byteLength > options.maxResourceSize * ONE_MB) {
				return { data: "data:base64,", resourceURL };
			} else {
				return { data: dataUri.encode(buffer, contentType), resourceURL };
			}
		} catch (e) {
			return { data: "data:base64,", resourceURL };
		}
	} else {
		if (resourceContent.statusCode >= 400 || (options.validateTextContentType && contentType && !contentType.startsWith(PREFIX_CONTENT_TYPE_TEXT))) {
			return { data: "", resourceURL };
		}
		if (!charset) {
			charset = "utf-8";
		}
		try {
			return { data: iconv.decode(resourceContent.body, charset), charset };
		} catch (e) {
			return { data: resourceContent.body.toString("utf8"), charset: "utf8" };
		}
	}
}