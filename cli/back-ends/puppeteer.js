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
const scripts = require("./common/scripts.js");

const EXECUTION_CONTEXT_DESTROYED_ERROR = "Execution context was destroyed";
const NETWORK_IDLE_STATE = "networkidle0";

exports.getPageData = async options => {
	let browser;
	try {
		browser = await puppeteer.launch(getBrowserOptions(options));
		const page = await browser.newPage();
		await setPageOptions(page, options);
		return await getPageData(browser, page, options);
	} finally {
		if (browser && !options.browserDebug) {
			await browser.close();
		}
	}
};

function getBrowserOptions(options) {
	const browserOptions = {};
	if (options.browserHeadless !== undefined) {
		browserOptions.headless = options.browserHeadless && !options.browserDebug;
	}
	browserOptions.args = options.browserArgs ? JSON.parse(options.browserArgs) : [];
	if (options.browserDisableWebSecurity === undefined || options.browserDisableWebSecurity) {
		browserOptions.args.push("--disable-web-security");
	}
	browserOptions.args.push("--no-pings");
	if (options.browserDebug) {
		browserOptions.args.push("--auto-open-devtools-for-tabs");
	}
	if (options.browserWidth && options.browserHeight) {
		browserOptions.args.push("--window-size=" + options.browserWidth + "," + options.browserHeight);
	}
	if (options.browserExecutablePath) {
		browserOptions.executablePath = options.browserExecutablePath || "chrome";
	}
	if (options.userAgent) {
		browserOptions.args.push("--user-agent=" + options.userAgent);
	}
	return browserOptions;
}

async function setPageOptions(page, options) {
	if (options.browserWidth && options.browserHeight) {
		await page.setViewport({
			width: options.browserWidth,
			height: options.browserHeight
		});
	}
	if (options.browserBypassCSP === undefined || options.browserBypassCSP) {
		await page.setBypassCSP(true);
	}
}

async function getPageData(browser, page, options) {
	const injectedScript = await scripts.get(options);
	await page.evaluateOnNewDocument(injectedScript);
	if (options.browserDebug) {
		await page.waitFor(3000);
	}
	await page.goto(options.url, {
		timeout: 0,
		waitUntil: options.browserWaitUntil || NETWORK_IDLE_STATE
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
		if (error.message && error.message.includes(EXECUTION_CONTEXT_DESTROYED_ERROR)) {
			const pageData = await handleJSRedirect(browser, options);
			if (pageData) {
				return pageData;
			} else {
				throw error;
			}
		} else {
			throw error;
		}
	}
}

async function handleJSRedirect(browser, options) {
	const pages = await browser.pages();
	const page = pages[1] || pages[0];
	await page.waitForNavigation(options.url, {
		timeout: 0,
		waitUntil: options.browserWaitUntil || NETWORK_IDLE_STATE
	});
	const url = page.url();
	if (url != options.url) {
		options.url = url;
		await browser.close();
		return exports.getPageData(options);
	}
}