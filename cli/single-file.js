#!/usr/bin/env node

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

/* global require */

const args = require("yargs")
	.wrap(null)
	.command("$0 <url> [output]", "Save a page into a single HTML file.", yargs => {
		yargs.positional("url", { description: "URL of the page to save", type: "string" });
		yargs.positional("output", { description: "Output filename", type: "string" });
	})
	.default({
		"back-end": "puppeteer",
		"browser-headless": true,
		"browser-executable-path": "",
		"browser-width": 1280,
		"browser-height": 720,
		"browser-wait-until": "networkidle0",
		"compress-CSS": true,
		"compress-HTML": true,
		"enable-MAFF": false,
		"group-duplicate-images": true,
		"load-deferred-images": true,
		"load-deferred-images-max-idle-time": 1500,
		"max-resource-size-enabled": false,
		"max-resource-size": 10,
		"remove-hidden-elements": true,
		"remove-unused-styles": true,
		"remove-unused-fonts": true,
		"remove-frames": false,
		"remove-imports": true,
		"remove-scripts": true,
		"remove-audio-src": true,
		"remove-video-src": true,
		"remove-alternative-fonts": true,
		"remove-alternative-medias": true,
		"remove-alternative-images": true,
		"save-raw-page": false
	})
	.options("back-end", { description: "Back-end to use" })
	.choices("back-end", ["jsdom", "puppeteer", "webdriver-chrome", "webdriver-firefox"])
	.options("browser-headless", { description: "Run the browser in headless mode (puppeteer, webdriver-firefox, webdriver-chrome)" })
	.boolean("browser-headless")
	.options("browser-executable-path", { description: "Path to chrome/chromium executable (puppeteer, webdriver-firefox, webdriver-chrome)" })
	.string("browser-executable-path")
	.options("browser-width", { description: "Width of the browser viewport in pixels" })
	.number("browser-width")
	.options("browser-height", { description: "Height of the browser viewport in pixels" })
	.number("browser-height")
	.options("browser-wait-until", { description: "When to consider the page is loaded (puppeteer, webdriver-firefox, webdriver-chrome)" })
	.choices("browser-wait-until", ["networkidle0", "networkidle2", "load", "domcontentloaded"])
	.options("enable-MAFF", { description: "Enables support of MAFF pages with Firefox < 57 (webdriver-firefox)" })
	.boolean("enable-MAFF")
	.options("compress-CSS", { description: "Compress CSS stylesheets" })
	.boolean("compress-CSS")
	.options("compress-HTML", { description: "Compress HTML content" })
	.boolean("compress-HTML")
	.options("group-duplicate-images", { description: "Group duplicate images into CSS custom properties" })
	.boolean("compress-HTML")
	.options("load-deferred-images", { description: "Load deferred (a.k.a. lazy-loaded) images (puppeteer, webdriver-firefox, webdriver-chrome)" })
	.boolean("load-deferred-images")
	.options("load-deferred-images-max-idle-time", { description: "Maximum delay of time to wait for deferred images (puppeteer, webdriver-firefox, webdriver-chrome)" })
	.number("load-deferred-images")
	.options("max-resource-size-enabled", { description: "Enable removal of embedded resources exceeding a given size" })
	.boolean("max-resource-size-enabled")
	.options("max-resource-size", { description: "Maximum size of embedded resources (i.e. images, stylesheets, scripts and iframes)" })
	.number("max-resource-size")
	.options("remove-hidden-elements", { description: "Remove HTML elements which are not displayed" })
	.number("remove-hidden-elements")
	.options("remove-unused-styles", { description: "Remove unused CSS rules and unneeded declarations" })
	.number("remove-unused-styles")
	.options("remove-unused-fonts", { description: "Remove unused CSS font rules" })
	.number("remove-unused-fonts")
	.options("remove-frames", { description: "Remove frames (puppeteer, webdriver-firefox, webdriver-chrome)" })
	.number("remove-frames")
	.options("remove-imports", { description: "Remove HTML imports" })
	.number("remove-imports")
	.options("remove-scripts", { description: "Remove JavaScript scripts" })
	.number("remove-scripts")
	.options("remove-audio-src", { description: "Remove source of audio elements" })
	.number("remove-audio-src")
	.options("remove-video-src", { description: "Remove source of video elements" })
	.number("remove-video-src")
	.options("remove-alternative-fonts", { description: "Remove alternative fonts to the ones displayed" })
	.number("remove-alternative-fonts")
	.options("remove-alternative-medias", { description: "Remove alternative CSS stylesheets" })
	.number("remove-alternative-medias")
	.options("remove-alternative-images", { description: "Remove images for alternative sizes of screen" })
	.number("remove-alternative-images")
	.options("save-raw-page", { description: "Save the original page without interpreting it into the browser (puppeteer, webdriver-firefox, webdriver-chrome)" })
	.number("save-raw-page")
	.argv;

const backEnds = {
	jsdom: "./back-ends/jsdom.js",
	puppeteer: "./back-ends/puppeteer.js",
	"webdriver-chrome": "./back-ends/webdriver-chrome.js",
	"webdriver-firefox": "./back-ends/webdriver-firefox.js"
};
require(backEnds[args.backEnd]).getPageData(args).then(pageData => {
	if (args.output) {
		require("fs").writeFileSync(args.output, pageData.content);
	} else {
		console.log(pageData.content); // eslint-disable-line no-console
	}
});