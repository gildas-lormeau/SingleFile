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

/* global require, exports, SingleFileBrowser, frameTree, document, window */

const fs = require("fs");

const puppeteer = require("puppeteer-core");

const SCRIPTS = [
	"../lib/hooks/hooks-frame.js",
	"../lib/frame-tree/frame-tree.js",
	"../lib/single-file/util/doc-util.js",
	"../lib/single-file/util/doc-helper.js",
	"../lib/single-file/util/timeout.js",
	"../lib/single-file/vendor/css-tree.js",
	"../lib/single-file/vendor/html-srcset-parser.js",
	"../lib/single-file/vendor/css-minifier.js",
	"../lib/single-file/vendor/css-font-property-parser.js",
	"../lib/single-file/vendor/css-media-query-parser.js",
	"../lib/single-file/modules/html-minifier.js",
	"../lib/single-file/modules/css-fonts-minifier.js",
	"../lib/single-file/modules/css-fonts-alt-minifier.js",
	"../lib/single-file/modules/css-matched-rules.js",
	"../lib/single-file/modules/css-medias-alt-minifier.js",
	"../lib/single-file/modules/css-rules-minifier.js",
	"../lib/single-file/modules/html-images-alt-minifier.js",
	"../lib/single-file/modules/html-serializer.js",
	"../lib/single-file/single-file-core.js",
	"../lib/single-file/single-file-browser.js"
];

exports.getPageData = async options => {
	const browserOptions = {};
	if (options.browserHeadless !== undefined) {
		browserOptions.headless = options.browserHeadless;
	}
	if (options.browserDisableWebSecurity === undefined || options.browserDisableWebSecurity) {
		browserOptions.args = ["--disable-web-security"];
	}
	if (options.browserExecutablePath) {
		browserOptions.executablePath = options.browserExecutablePath;
	}
	const browser = await puppeteer.launch(browserOptions);
	let page;
	try {
		page = await browser.newPage();
		if (options.userAgent) {
			await page.setUserAgent(options.userAgent);
		}
		if (options.browserBypassCSP === undefined || options.browserBypassCSP) {
			await page.setBypassCSP(true);
		}
		if (options.loadDeferredImages) {
			SCRIPTS.unshift("../lib/lazy/web/web-lazy-loader-before");
		}
		await Promise.all(SCRIPTS.map(scriptPath => page.evaluateOnNewDocument(fs.readFileSync(require.resolve(scriptPath)).toString())));
		await page.goto(options.url, {
			waitUntil: "networkidle0"
		});
		return await page.evaluate(async options => {
			options.insertSingleFileComment = true;
			options.insertFaviconLink = true;
			if (!options.saveRawPage && !options.removeFrames) {
				options.framesData = await frameTree.getAsync(options);
			}
			options.doc = document;
			options.win = window;
			const SingleFile = SingleFileBrowser.getClass();
			const singleFile = new SingleFile(options);
			await singleFile.initialize();
			await singleFile.run();
			return singleFile.getPageData();
		}, options);
	} finally {
		if (page) {
			await page.close();
			await browser.close();
		}
	}
};