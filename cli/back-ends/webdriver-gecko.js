/*
 * Copyright 2010-2020 Gildas Lormeau
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

/* global require, exports, process, setTimeout, clearTimeout */

const firefox = require("selenium-webdriver/firefox");
const { Builder, By, Key } = require("selenium-webdriver");

exports.initialize = async () => { };

exports.getPageData = async options => {
	let driver;
	try {
		const builder = new Builder().withCapabilities({ "pageLoadStrategy": "none" });
		builder.setFirefoxOptions(getBrowserOptions(options));
		driver = builder.forBrowser("firefox").build();
		return await getPageData(driver, options);
	} finally {
		if (driver) {
			driver.quit();
		}
	}
};

exports.closeBrowser = () => { };

function getBrowserOptions(options) {
	const firefoxOptions = new firefox.Options().setBinary(firefox.Channel.NIGHTLY);
	if ((options.browserHeadless === undefined || options.browserHeadless) && !options.browserDebug) {
		process.env["MOZ_HEADLESS"] = "1";
	}
	if (options.browserExecutablePath) {
		firefoxOptions.setBinary(options.browserExecutablePath);
	}
	if (options.webDriverExecutablePath) {
		process.env["PATH"] += ";" + options.webDriverExecutablePath.replace(/geckodriver(\.exe)?$/, "");
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
	if (extensions.length) {
		firefoxOptions.addExtensions(extensions);
	}
	if (options.browserArgs) {
		const args = JSON.parse(options.browserArgs);
		args.forEach(argument => firefoxOptions.addArguments(argument));
	}
	if (options.userAgent) {
		firefoxOptions.setPreference("general.useragent.override", options.userAgent);
	}
}

async function getPageData(driver, options) {
	driver.manage().setTimeouts({ script: options.browserLoadMaxTime || 0, pageLoad: options.browserLoadMaxTime || 0, implicit: options.browserLoadMaxTime || 0 });
	if (options.browserWidth && options.browserHeight) {
		const window = driver.manage().window();
		if (window.setRect) {
			window.setRect(options.browserHeight, options.browserWidth);
		} else if (window.setSize) {
			window.setSize(options.browserWidth, options.browserHeight);
		}
	}
	let scripts = await require("./common/scripts.js").get(options);
	if (options.browserDebug) {
		await driver.findElement(By.css("html")).sendKeys(Key.SHIFT + Key.F5);
		await driver.sleep(3000);
	}
	scripts = scripts.replace(/globalThis/g, "window");
	await driver.get(options.url);
	if (options.browserCookies) {
		await Promise.all(options.browserCookies.map(cookie => {
			if (cookie.expires) {
				cookie.expiry = cookie.expires;
			}
			return driver.manage().addCookie(cookie);
		}));
		await driver.get("about:blank");
		await driver.get(options.url);
		while (await driver.getCurrentUrl() == "about:blank") {
			// do nothing
		}
	}
	await driver.executeScript(scripts);
	if (options.browserWaitUntil != "domcontentloaded") {
		let scriptPromise;
		/*
		if (options.browserWaitUntil == "networkidle0") {
			scriptPromise = driver.executeAsyncScript("addEventListener(\"single-file-network-idle-0\", () => arguments[0](), true)");
		} else if (options.browserWaitUntil == "networkidle2") {
			scriptPromise = driver.executeAsyncScript("addEventListener(\"single-file-network-idle-2\", () => arguments[0](), true)");
		} else if (options.browserWaitUntil === undefined || options.browserWaitUntil == "load") {
		*/
		scriptPromise = driver.executeAsyncScript("if (document.readyState == \"loading\" || document.readyState == \"interactive\") { addEventListener(\"load\", () => arguments[0]()) } else { arguments[0](); }");
		/*
		}
		*/
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
	if (options.browserWaitDelay) {
		await driver.sleep(options.browserWaitDelay);
	}
	const result = await driver.executeAsyncScript(getPageDataScript(), options);
	if (result.error) {
		throw result.error;
	} else {
		return result.pageData;
	}
}

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
	let [options, callback] = arguments;
	getPageData()
		.then(pageData => callback({ pageData }))
		.catch(error => callback({ error: error && error.toString() }));

	async function getPageData() {
		const pageData = await window.singlefile.getPageData(options);
		if (options.includeInfobar) {
			await infobar.includeScript(pageData);
		}
		return pageData;
	}
	`;
}