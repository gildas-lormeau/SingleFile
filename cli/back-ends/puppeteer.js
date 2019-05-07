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

/* global singlefile, require, exports, document, window */

const fs = require("fs");

const puppeteer = require("puppeteer-core");

const SCRIPTS = [
	"../../index.js",
	"../../lib/hooks/content/content-hooks-frames.js",
	"../../lib/frame-tree/content/content-frame-tree.js",
	"../../lib/lazy/content/content-lazy-loader.js",
	"../../lib/single-file/single-file-util.js",
	"../../lib/single-file/single-file-helper.js",
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
	"../../lib/single-file/single-file-core.js",
	"../../lib/single-file/single-file.js"
];

exports.getPageData = async options => {
	const browserOptions = {};
	if (options.browserHeadless !== undefined) {
		browserOptions.headless = options.browserHeadless && !options.browserDebug;
	}
	browserOptions.args = [];
	if (options.browserDisableWebSecurity === undefined || options.browserDisableWebSecurity) {
		browserOptions.args.push("--disable-web-security");
	}
	browserOptions.args.push("--no-pings");
	if (!options.browserHeadless && options.browserDebug) {
		browserOptions.args.push("--auto-open-devtools-for-tabs");
	}
	if (options.browserWidth && options.browserHeight) {
		browserOptions.args.push("--window-size=" + options.browserWidth + "," + options.browserHeight);
	}
	if (options.browserExecutablePath) {
		browserOptions.executablePath = options.browserExecutablePath || "chrome";
	}
	let browser;
	try {
		browser = await puppeteer.launch(browserOptions);
		const page = await browser.newPage();
		if (options.userAgent) {
			await page.setUserAgent(options.userAgent);
		}
		if (options.browserWidth && options.browserHeight) {
			await page.setViewport({
				width: options.browserWidth,
				height: options.browserHeight
			});
		}
		if (options.browserBypassCSP === undefined || options.browserBypassCSP) {
			await page.setBypassCSP(true);
		}
		let scripts = SCRIPTS.concat(options.browserScripts).map(scriptPath => fs.readFileSync(require.resolve(scriptPath)).toString()).join("\n");
		const fileContents = {
			"/lib/hooks/content/content-hooks-web.js": fs.readFileSync(require.resolve("../../lib/hooks/content/content-hooks-web.js")).toString(),
			"/lib/hooks/content/content-hooks-frames-web.js": fs.readFileSync(require.resolve("../../lib/hooks/content/content-hooks-frames-web.js")).toString(),
		};
		scripts = scripts + ";this.singlefile.lib.getFileContent = filename => (" + JSON.stringify(fileContents) + ")[filename];";
		await page.evaluateOnNewDocument(scripts);
		if (options.browserDebug) {
			await page.waitFor(3000);
		}
		await page.goto(options.url, {
			timeout: 0,
			waitUntil: options.browserWaitUntil || "networkidle0"
		});
		return await page.evaluate(async options => {
			singlefile.lib.helper.initDoc(document);
			options.insertSingleFileComment = true;
			options.insertFaviconLink = true;
			const preInitializationPromises = [];
			if (!options.saveRawPage) {
				if (!options.removeFrames) {
					preInitializationPromises.push(singlefile.lib.frameTree.content.frames.getAsync(options));
				}
				if (options.loadDeferredImages) {
					preInitializationPromises.push(singlefile.lib.lazy.content.loader.process(options));
				}
			}
			[options.frames] = await Promise.all(preInitializationPromises);
			options.doc = document;
			options.win = window;
			const SingleFile = singlefile.lib.SingleFile.getClass();
			const singleFile = new SingleFile(options);
			await singleFile.run();
			return await singleFile.getPageData();
		}, options);
	} finally {
		if (browser && !options.browserDebug) {
			await browser.close();
		}
	}
};