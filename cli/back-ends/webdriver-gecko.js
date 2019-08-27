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

/* global __dirname, require, exports, process, setTimeout, clearTimeout */

const path = require("path");

const firefox = require("selenium-webdriver/firefox");
const { Builder, By, Key } = require("selenium-webdriver");

exports.getPageData = async options => {
	let driver;
	try {
		const builder = new Builder().withCapabilities({ "pageLoadStrategy": "none" });
		const firefoxOptions = new firefox.Options();
		if ((options.browserHeadless === undefined || options.browserHeadless) && !options.browserDebug) {
			firefoxOptions.headless();
		}
		if (options.browserExecutablePath) {
			firefoxOptions.setBinary(options.browserExecutablePath);
		}
		if (options.webDriverExecutablePath) {
			process.env["webdriver.gecko.driver"] = options.webDriverExecutablePath;
		}
		const extensions = [];
		if (options.browserDisableWebSecurity === undefined || options.browserDisableWebSecurity) {
			extensions.push(require.resolve("./extensions/signed/disable_web_security-0.0.3-an+fx.xpi"));
		}
		if (options.browserBypassCSP === undefined || options.browserBypassCSP) {
			extensions.push(require.resolve("./extensions/signed/bypass_csp-0.0.3-an+fx.xpi"));
		}
		if (options.browserWaitUntil === undefined || options.browserWaitUntil == "networkidle0" || options.browserWaitUntil == "networkidle2") {
			extensions.push(require.resolve("./extensions/signed/network_idle-0.0.2-an+fx.xpi"));
		}
		if (options.browserExtensions && options.browserExtensions.length) {
			options.browserExtensions.forEach(extensionPath => extensions.push(path.resolve(__dirname, "..", extensionPath)));
		}
		if (options.browserArgs) {
			const args = JSON.parse(options.browserArgs);
			args.forEach(argument => firefoxOptions.addArguments(argument));
		}
		if (extensions.length) {
			firefoxOptions.addExtensions(extensions);
		}
		if (options.userAgent) {
			firefoxOptions.setPreference("general.useragent.override", options.userAgent);
		}
		builder.setFirefoxOptions(firefoxOptions);
		driver = await builder.forBrowser("firefox").build();
		driver.manage().setTimeouts({ script: options.browserLoadMaxTime, pageLoad: options.browserLoadMaxTime, implicit: options.browserLoadMaxTime });
		if (options.browserWidth && options.browserHeight) {
			const window = driver.manage().window();
			if (window.setRect) {
				window.setRect(options.browserHeight, options.browserWidth);
			} else if (window.setSize) {
				window.setSize(options.browserWidth, options.browserHeight);
			}
		}
		const scripts = await require("./common/scripts.js").get(options);
		if (options.browserDebug) {
			await driver.findElement(By.css("html")).sendKeys(Key.SHIFT + Key.F5);
			await driver.sleep(3000);
		}
		await driver.get(options.url);
		await driver.executeScript(scripts);
		if (options.browserWaitUntil != "domcontentloaded") {
			let scriptPromise;
			if (options.browserWaitUntil === undefined || options.browserWaitUntil == "networkidle0") {
				scriptPromise = driver.executeAsyncScript("addEventListener(\"single-file-network-idle-0\", () => arguments[0](), true)");
			} else if (options.browserWaitUntil == "networkidle2") {
				scriptPromise = driver.executeAsyncScript("addEventListener(\"single-file-network-idle-2\", () => arguments[0](), true)");
			} else if (options.browserWaitUntil == "load") {
				scriptPromise = driver.executeAsyncScript("if (document.readyState == \"loading\" || document.readyState == \"interactive\") { document.addEventListener(\"load\", () => arguments[0]()) } else { arguments[0](); }");
			}
			let cancelTimeout;
			const timeoutPromise = new Promise(resolve => {
				const timeoutId = setTimeout(resolve, Math.max(0, options.browserLoadMaxTime - 5000));
				cancelTimeout = () => {
					clearTimeout(timeoutId);
					resolve();
				};
			});
			await Promise.race([scriptPromise, timeoutPromise]);
			cancelTimeout();
		}
		if (!options.removeFrames) {
			await executeScriptInFrames(driver, scripts);
		}
		const result = await driver.executeAsyncScript(getPageDataScript(), options);
		if (result.error) {
			throw result.error;
		} else {
			return result.pageData;
		}
	} finally {
		if (driver && !options.browserDebug) {
			driver.quit();
		}
	}
};

async function executeScriptInFrames(driver, scripts) {
	let finished = false, indexFrame = 0;
	while (!finished) {
		try {
			await driver.switchTo().frame(indexFrame);
		} catch (error) {
			finished = true;
		}
		if (!finished) {
			await driver.executeScript(scripts);
			await executeScriptInFrames(driver, scripts);
			indexFrame++;
			await driver.switchTo().parentFrame();
		}
	}
}

function getPageDataScript() {
	return `
	const [options, callback] = arguments;
	getPageData()
		.then(pageData => callback({ pageData }))
		.catch(error => callback({ error: error.toString() }));

	async function getPageData() {
		await singlefile.lib.initializeOptions(options, document, window);
		const pageData = await singlefile.lib.getPageData(options);
		if (options.includeInfobar) {
			await singlefile.common.ui.content.infobar.includeScript(pageData);
		}
		return pageData;
	}
	`;
}