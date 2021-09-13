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

/* global singlefile, infobar, require, exports */

const puppeteer = require("puppeteer-core");
const scripts = require("./common/scripts.js");

const EXECUTION_CONTEXT_DESTROYED_ERROR = "Execution context was destroyed";
const NETWORK_IDLE_STATE = "networkidle0";

let browser;

exports.initialize = async options => {
	browser = await puppeteer.launch(getBrowserOptions(options));
};

exports.getPageData = async options => {
	let page;
	try {
		page = await browser.newPage();
		await setPageOptions(page, options);
		return await getPageData(browser, page, options);
	} finally {
		if (page) {
			await page.close();
		}
	}
};

exports.closeBrowser = () => {
	if (browser) {
		return browser.close();
	}
};

function getBrowserOptions(options) {
	const browserOptions = {};
	if (options.browserHeadless !== undefined) {
		browserOptions.headless = options.browserHeadless && !options.browserDebug;
	}
	browserOptions.args = options.browserArgs ? JSON.parse(options.browserArgs) : [];
	if (options.browserExecutablePath) {
		browserOptions.executablePath = options.browserExecutablePath || "firefox";
	}
	browserOptions.product = "firefox";
	return browserOptions;
}

async function setPageOptions(page, options) {
	if (options.browserWidth && options.browserHeight) {
		await page.setViewport({
			width: options.browserWidth,
			height: options.browserHeight
		});
	}
	if ((options.browserBypassCSP === undefined || options.browserBypassCSP) && page.setBypassCSP) {
		try {
			await page.setBypassCSP(true);
		} catch (error) {
			// ignored
		}
	}
	if (options.httpHeaders) {
		try {
			await page.setExtraHTTPHeaders(options.httpHeaders);
		} catch (error) {
			// ignored
		}
	}
	if (options.browserCookies && options.browserCookies.length) {
		await page.setCookie(...options.browserCookies);
	}
	if (options.emulateMediaFeatures) {
		try {
			await page.emulateMediaFeatures(options.emulateMediaFeatures);
		} catch (error) {
			// ignored
		}
	}
}

async function getPageData(browser, page, options) {
	const injectedScript = await scripts.get(options);
	await page.evaluateOnNewDocument(injectedScript);
	if (options.browserDebug) {
		await page.waitForTimeout(3000);
	}
	await pageGoto(page, options);
	try {
		await page.evaluate(injectedScript);
		if (options.browserWaitDelay) {
			await page.waitForTimeout(options.browserWaitDelay);
		}
		return await page.evaluate(async options => {
			const pageData = await singlefile.getPageData(options);
			if (options.includeInfobar) {
				await infobar.includeScript(pageData);
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
		} else if (error.name != "TimeoutError") {
			throw error;
		}
	}
}

async function handleJSRedirect(browser, options) {
	const pages = await browser.pages();
	const page = pages[1] || pages[0];
	try {
		await pageGoto(page, options);
	} catch (error) {
		if (error.name != "TimeoutError") {
			throw error;
		}
	}
	const url = page.url();
	if (url != options.url) {
		options.url = url;
		await browser.close();
		return exports.getPageData(options);
	}
}

async function pageGoto(page, options) {
	try {
		await page.goto(options.url, {
			timeout: options.browserLoadMaxTime || 0,
			waitUntil: options.browserWaitUntil || NETWORK_IDLE_STATE
		});
	} catch (error) {
		if (error.message.includes("Unknown waitUntil condition")) {
			await page.goto(options.url, {
				timeout: options.browserLoadMaxTime || 0,
				waitUntil: "load"
			});
		} else {
			throw error;
		}
	}
}