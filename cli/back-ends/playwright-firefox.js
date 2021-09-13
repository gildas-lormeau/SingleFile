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

const playwright = require("playwright").firefox;
const scripts = require("./common/scripts.js");

const NETWORK_IDLE_STATE = "networkidle";

let browser;

exports.initialize = async options => {
	browser = await playwright.launch(getBrowserOptions(options));
};

exports.getPageData = async options => {
	let page, context;
	try {
		context = await browser.newContext({
			bypassCSP: options.browserBypassCSP === undefined || options.browserBypassCSP
		});
		await setContextOptions(context, options);
		page = await context.newPage();
		await setPageOptions(page, options);
		return await getPageData(page, options);
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
	return browserOptions;
}

async function setContextOptions(context, options) {
	if (options.browserCookies && options.browserCookies.length) {
		await context.addCookies(options.browserCookies);
	}
}

async function setPageOptions(page, options) {
	if (options.browserWidth && options.browserHeight) {
		await page.setViewportSize({
			width: options.browserWidth,
			height: options.browserHeight
		});
	}
	if (options.httpHeaders) {
		page.setExtraHTTPHeaders(options.httpHeaders);
	}
	if (options.emulateMediaFeatures) {
		await page.emulateMediaFeatures(options.emulateMediaFeatures);
	}
}

async function getPageData(page, options) {
	const injectedScript = await scripts.get(options);
	await page.addInitScript(injectedScript);
	if (options.browserDebug) {
		await page.waitForTimeout(3000);
	}
	await page.goto(options.url, {
		timeout: options.browserLoadMaxTime || 0,
		waitUntil: options.browserWaitUntil && options.browserWaitUntil.startsWith("networkidle") ? NETWORK_IDLE_STATE : options.browserWaitUntil || NETWORK_IDLE_STATE
	});
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
}