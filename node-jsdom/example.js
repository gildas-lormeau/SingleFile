/* global require */

const fs = require("fs");

const jsdom = require("jsdom");
const request = require("request-promise-native");

const SingleFileNode = require("./single-file-jsdom.js");

run({
	url: "https://github.com/gildas-lormeau/SingleFile",
	userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:65.0) Gecko Firefox AppleWebKit (KHTML, like Gecko) Chrome Safari",
	removeHiddenElements: true,
	removeUnusedStyles: true,
	removeUnusedFonts: true,
	removeFrames: true,
	removeImports: true,
	removeScripts: true,
	compressHTML: true,
	compressCSS: true,
	loadDeferredImages: false,
	filenameTemplate: "{page-title} ({date-iso} {time-locale}).html",
	removeAudioSrc: true,
	removeVideoSrc: true,
	displayInfobar: true,
	removeAlternativeFonts: true,
	removeAlternativeMedias: true,
	removeAlternativeImages: true,
	groupDuplicateImages: true
});

async function run(options) {
	const pageContent = (await request({
		method: "GET",
		uri: options.url,
		resolveWithFullResponse: true,
		encoding: null,
		headers: {
			"User-Agent": options.userAgent
		}
	})).body.toString();
	const dom = new jsdom.JSDOM(pageContent, { url: options.url, virtualConsole: new jsdom.VirtualConsole(), userAgent: options.userAgent });
	options.win = dom.window;
	options.doc = dom.window.document;
	options.saveRawPage = true;
	const processor = new (SingleFileNode.getClass())(options);
	await processor.initialize();
	await processor.run();
	const page = await processor.getPageData();
	fs.writeFileSync(page.filename, page.content);
}