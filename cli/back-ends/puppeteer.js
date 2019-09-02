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

/* global singlefile, require, exports */

const puppeteer = require("puppeteer-core");

exports.getPageData = async options => {
	const browserOptions = {};
	if (options.browserHeadless !== undefined) {
		browserOptions.headless = options.browserHeadless && !options.browserDebug;
	}
	browserOptions.args = options.browserArgs ? JSON.parse(options.browserArgs) : [];
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
		const scripts = await require("./common/scripts.js").get(options);
		await page.evaluateOnNewDocument(scripts);
		if (options.browserDebug) {
			await page.waitFor(3000);
		}
		await page.goto(options.url, {
			timeout: 0,
			waitUntil: options.browserWaitUntil || "networkidle0"
		});
		try {
			return await page.evaluate(async options => {
				const pageData = await singlefile.lib.getPageData(options);
				if (options.includeInfobar) {
					await singlefile.common.ui.content.infobar.includeScript(pageData);
				}
				return pageData;
			}, options);
		} catch (error) {
			if (error.message.includes("Execution context was destroyed")) {
				const pages = await browser.pages();
				const page = pages[1] || pages[0];
				await page.waitForNavigation(options.url, {
					timeout: 0,
					waitUntil: options.browserWaitUntil || "networkidle0"
				});
				const url = page.url();
				if (url != options.url) {
					options.url = url;
					await browser.close();
					return exports.getPageData(options);
				} else {
					throw error;
				}
			} else {
				throw error;
			}
		}
	} finally {
		if (browser && !options.browserDebug) {
			await browser.close();
		}
	}
};