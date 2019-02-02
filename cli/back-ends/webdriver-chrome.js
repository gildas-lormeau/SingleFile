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
const fs = require("fs");

const chrome = require("selenium-webdriver/chrome");
const { Builder } = require("selenium-webdriver");

const SCRIPTS = [
	"../../lib/hooks/hooks-frame.js",
	"../../lib/frame-tree/frame-tree.js",
	"../../lib/lazy/content/content-lazy-loader.js",
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
	"../../lib/single-file/single-file-core.js",
	"../../lib/single-file/single-file-browser.js"
];

exports.getPageData = async options => {
	const RESOLVED_CONTENTS = {
		"lib/lazy/web/web-lazy-loader-before.js": fs.readFileSync(require.resolve("../../lib/lazy/web/web-lazy-loader-before.js")).toString(),
		"lib/lazy/web/web-lazy-loader-after.js": fs.readFileSync(require.resolve("../../lib/lazy/web/web-lazy-loader-after.js")).toString()
	};
	let driver;
	try {
		const builder = new Builder();
		const chromeOptions = new chrome.Options();
		const optionHeadless = options.browserHeadless === undefined || options.browserHeadless;
		if (optionHeadless) {
			chromeOptions.headless();
		}
		if (options.browserExecutablePath) {
			chromeOptions.setChromeBinaryPath(options.browserExecutablePath);
		}
		if (options.browserDisableWebSecurity === undefined || options.browserDisableWebSecurity) {
			chromeOptions.addArguments("--disable-web-security");
		}
		if (!optionHeadless) {
			const extensions = [];
			if (options.browserBypassCSP === undefined || options.browserBypassCSP) {
				extensions.push(require.resolve("./extensions/signed/bypass_csp-0.0.3-an+fx.xpi"));
			}
			if (options.browserWaitUntil === undefined || options.browserWaitUntil == "networkidle0" || options.browserWaitUntil == "networkidle2") {
				extensions.push(require.resolve("./extensions/signed/network_idle-0.0.2-an+fx.xpi"));
			}
			chromeOptions.addExtensions(extensions);
		}
		if (options.userAgent) {
			await chromeOptions.addArguments("--user-agent=" + JSON.stringify(options.userAgent));
		}
		builder.setChromeOptions(chromeOptions);
		driver = await builder.forBrowser("chrome").build();
		driver.manage().setTimeouts({ script: null, pageLoad: null, implicit: null });
		if (options.browserWidth && options.browserHeight) {
			const window = driver.manage().window();
			if (window.setRect) {
				window.setRect(options.browserHeight, options.browserWidth);
			} else if (window.setSize) {
				window.setSize(options.browserWidth, options.browserHeight);
			}
		}
		let scripts = SCRIPTS.map(scriptPath => fs.readFileSync(require.resolve(scriptPath)).toString()).join("\n");
		scripts += "\nlazyLoader.getScriptContent = " + (function (path) { return (RESOLVED_CONTENTS)[path]; }).toString().replace("RESOLVED_CONTENTS", JSON.stringify(RESOLVED_CONTENTS)) + ";";
		await driver.get(options.url);
		if (!optionHeadless && (options.browserWaitUntil === undefined || options.browserWaitUntil == "networkidle0")) {
			await driver.executeAsyncScript(scripts + "\naddEventListener(\"single-file-network-idle-0\", () => arguments[0](), true)");
		} else if (!optionHeadless && options.browserWaitUntil == "networkidle2") {
			await driver.executeAsyncScript(scripts + "\naddEventListener(\"single-file-network-idle-2\", () => arguments[0](), true)");
		} else if (optionHeadless || options.browserWaitUntil == "load") {
			await driver.executeAsyncScript(scripts + "\nif (document.readyState == \"loading\") { document.addEventListener(\"load\", () => arguments[0]()) } else { arguments[0](); }");
		} else {
			await driver.executeScript(scripts);
		}
		if (!options.removeFrames) {
			const windowHandles = await driver.getAllWindowHandles();
			await Promise.all(windowHandles.map(async windowHandle => {
				await driver.switchTo().window(windowHandle);
				driver.executeScript(scripts);
			}));
			await driver.switchTo().window(driver.getWindowHandle());
		}
		const result = await driver.executeAsyncScript(getPageDataScript(), options);
		if (result.error) {
			throw result.error;
		} else {
			return result.pageData;
		}
	} finally {
		if (driver) {
			driver.quit();
		}
	}
};

function getPageDataScript() {
	return `
	const [options, callback] = arguments;
	getPageData()
		.then(pageData => callback({ pageData }))
		.catch(error => callback({ error: error.toString() }));

	async function getPageData() {
		options.insertSingleFileComment = true;
		const preInitializationPromises = [];
		if (!options.saveRawPage) {
			if (!options.removeFrames) {
				preInitializationPromises.push(frameTree.getAsync(options));
			}
			if (options.loadDeferredImages) {
				preInitializationPromises.push(lazyLoader.process(options));
			}
		}
		[options.framesData] = await Promise.all(preInitializationPromises);
		options.doc = document;
		options.win = window;
		const SingleFile = SingleFileBrowser.getClass();
		const singleFile = new SingleFile(options);
		await singleFile.run();
		return await singleFile.getPageData();
	}
	`;
}