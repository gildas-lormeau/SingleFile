/* global require, exports, Buffer */

const fs = require("fs");

const jsdom = require("jsdom");
const dataUri = require("strong-data-uri");
const iconv = require("iconv-lite");
const request = require("request-promise-native");
const { JSDOM } = jsdom;

const USER_AGENT = "";

const DocUtilCore = eval(fs.readFileSync("./lib/single-file/util/doc-util-core.js").toString());
const SingleFileCore = eval(fs.readFileSync("./lib/single-file/single-file-core.js").toString());
const cssTree = eval(fs.readFileSync("./lib/single-file/vendor/css-tree.js").toString());
const docHelper = eval(fs.readFileSync("./lib/single-file/util/doc-helper.js").toString());
const srcsetParser = eval(fs.readFileSync("./lib/single-file/vendor/html-srcset-parser.js").toString());

const modules = {
	docHelper: docHelper,
	srcsetParser: srcsetParser,
	cssMinifier: eval(fs.readFileSync("./lib/single-file/vendor/css-minifier.js").toString()),
	htmlMinifier: eval(fs.readFileSync("./lib/single-file/modules/html-minifier.js").toString()),
	fontsMinifier: eval(fs.readFileSync("./lib/single-file/modules/css-fonts-minifier.js").toString()),
	fontsAltMinifier: eval(fs.readFileSync("./lib/single-file/modules/css-fonts-alt-minifier.js").toString()),
	cssRulesMinifier: eval(fs.readFileSync("./lib/single-file/modules/css-rules-minifier.js").toString()),
	matchedRules: eval(fs.readFileSync("./lib/single-file/modules/css-matched-rules.js").toString()),
	mediasMinifier: eval(fs.readFileSync("./lib/single-file/modules/css-medias-alt-minifier.js").toString()),
	imagesAltMinifier: eval(fs.readFileSync("./lib/single-file/modules/html-images-alt-minifier.js").toString()),
	serializer: eval(fs.readFileSync("./lib/single-file/modules/html-serializer.js").toString())
};
modules.fontsAltMinifier.cssTree = cssTree;
modules.fontsMinifier.cssTree = cssTree;
modules.fontsMinifier.fontPropertyParser = eval(fs.readFileSync("./lib/single-file/vendor/css-font-property-parser.js").toString());
modules.fontsMinifier.docHelper = docHelper;
modules.matchedRules.cssTree = cssTree;
modules.mediasMinifier.cssTree = cssTree;
modules.mediasMinifier.mediaQueryParser = eval(fs.readFileSync("./lib/single-file/vendor/css-media-query-parser.js").toString());
modules.cssRulesMinifier.cssTree = cssTree;
modules.imagesAltMinifier.srcsetParser = srcsetParser;

const domUtil = {
	getContent, parseDocContent, parseSVGContent, isValidFontUrl, getContentSize, digestText
};

exports.getClass = () => {
	const DocUtil = DocUtilCore.getClass(modules, domUtil);
	return SingleFileCore.getClass(DocUtil, cssTree);
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
			"User-Agent": USER_AGENT
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