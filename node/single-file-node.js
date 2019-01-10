/* global require, exports, Buffer */

const fs = require("fs");

const jsdom = require("jsdom");
const dataUri = require("strong-data-uri");
const iconv = require("iconv-lite");
const request = require("request-promise-native");
const { JSDOM } = jsdom;

const SCRIPTS = [
	"./lib/single-file/util/doc-util-core.js",
	"./lib/single-file/single-file-core.js",
	"./lib/single-file/vendor/css-tree.js",
	"./lib/single-file/util/doc-helper.js",
	"./lib/single-file/vendor/html-srcset-parser.js",
	"./lib/single-file/vendor/css-minifier.js",
	"./lib/single-file/modules/html-minifier.js",
	"./lib/single-file/modules/css-fonts-minifier.js",
	"./lib/single-file/modules/css-fonts-alt-minifier.js",
	"./lib/single-file/modules/css-matched-rules.js",
	"./lib/single-file/modules/css-medias-alt-minifier.js",
	"./lib/single-file/modules/css-rules-minifier.js",
	"./lib/single-file/modules/html-images-alt-minifier.js",
	"./lib/single-file/modules/html-serializer.js",
	"./lib/single-file/vendor/css-font-property-parser.js",
	"./lib/single-file/vendor/css-media-query-parser.js"
];

SCRIPTS.forEach(scriptPath => eval(fs.readFileSync(scriptPath).toString()));
const modules = {
	docHelper: this.docHelper,
	srcsetParser: this.srcsetParser,
	cssMinifier: this.cssMinifier,
	htmlMinifier: this.htmlMinifier,
	fontsMinifier: this.fontsMinifier,
	fontsAltMinifier: this.fontsAltMinifier,
	cssRulesMinifier: this.cssRulesMinifier,
	matchedRules: this.matchedRules,
	mediasMinifier: this.mediasMinifier,
	imagesAltMinifier: this.imagesAltMinifier,
	serializer: this.serializer
};
modules.fontsAltMinifier.cssTree = this.cssTree;
modules.fontsMinifier.cssTree = this.cssTree;
modules.fontsMinifier.fontPropertyParser = this.fontPropertyParser;
modules.fontsMinifier.docHelper = this.docHelper;
modules.matchedRules.cssTree = this.cssTree;
modules.mediasMinifier.cssTree = this.cssTree;
modules.mediasMinifier.mediaQueryParser = this.mediaQueryParser;
modules.cssRulesMinifier.cssTree = this.cssTree;
modules.imagesAltMinifier.srcsetParser = this.srcsetParser;

const domUtil = {
	getContent, parseDocContent, parseSVGContent, isValidFontUrl, getContentSize, digestText
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

async function digestText(/* algo, text */) {
	// TODO
	return 0;
}

function getContentSize(content) {
	// TODO: check
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
	const contentType = resourceContent.headers["content-type"];
	if (options && options.asDataURI) {
		try {
			return { data: dataUri.encode(resourceContent.body, contentType), resourceURL };
		} catch (e) {
			return { data: "data:base64,", resourceURL };
		}
	} else {
		const matchCharset = contentType && contentType.match(/\s*;\s*charset\s*=\s*(.*)(;|$)/i);
		let charset = "utf-8";
		if (matchCharset && matchCharset[1]) {
			charset = matchCharset[1];
			try {
				return { data: iconv.decode(resourceContent.body, charset), charset };
			} catch (e) {
				return { data: resourceContent.body.toString("utf8"), charset: "utf8" };
			}
		} else {
			return { data: resourceContent.body.toString("utf8"), charset };
		}
	}
}