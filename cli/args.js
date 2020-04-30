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

/* global require, module */

const args = require("yargs")
	.wrap(null)
	.command("$0 [url] [output]", "Save a page into a single HTML file.", yargs => {
		yargs.positional("url", { description: "URL or path on the filesystem of the page to save", type: "string" });
		yargs.positional("output", { description: "Output filename", type: "string" });
	})
	.default({
		"back-end": "puppeteer",
		"browser-headless": true,
		"browser-executable-path": "",
		"browser-width": 1280,
		"browser-height": 720,
		"browser-load-max-time": 60000,
		"browser-wait-until": "networkidle0",
		"browser-wait-until-fallback": true,
		"browser-debug": false,
		"browser-extensions": [],
		"browser-scripts": [],
		"browser-args": "",
		"compress-CSS": false,
		"compress-HTML": true,
		"filename-template": "{page-title} ({date-iso} {time-locale}).html",
		"filename-replacement-character": "_",
		"group-duplicate-images": true,
		"include-infobar": false,
		"load-deferred-images": true,
		"load-deferred-images-max-idle-time": 1500,
		"maxParallelWorkers": 8,
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
		"save-raw-page": false,
		"web-driver-executable-path": "",
		"user-script-enabled": true,
		"include-BOM": false,
		"crawl-links": false,
		"crawl-inner-links-only": true,
		"crawl-max-depth": 1,
		"crawl-replace-urls": false,
		"url-rewrite-rules": []
	})
	.options("back-end", { description: "Back-end to use" })
	.choices("back-end", ["jsdom", "puppeteer", "webdriver-chromium", "webdriver-gecko"])
	.options("browser-headless", { description: "Run the browser in headless mode (puppeteer, webdriver-gecko, webdriver-chromium)" })
	.boolean("browser-headless")
	.options("browser-executable-path", { description: "Path to chrome/chromium executable (puppeteer, webdriver-gecko, webdriver-chromium)" })
	.string("browser-executable-path")
	.options("browser-width", { description: "Width of the browser viewport in pixels" })
	.number("browser-width")
	.options("browser-height", { description: "Height of the browser viewport in pixels" })
	.number("browser-height")
	.options("browser-load-max-time", { description: "Maximum delay of time to wait for page loading in ms (puppeteer, webdriver-gecko, webdriver-chromium)" })
	.number("browser-load-max-time")
	.options("browser-wait-until", { description: "When to consider the page is loaded (puppeteer, webdriver-gecko, webdriver-chromium)" })
	.choices("browser-wait-until", ["networkidle0", "networkidle2", "load", "domcontentloaded"])
	.options("browser-wait-until-fallback", { description: "Retry with the next value of --browser-wait-until when a timeout error is thrown" })
	.boolean("browser-wait-until-fallback")
	.options("browser-debug", { description: "Enable debug mode (puppeteer, webdriver-gecko, webdriver-chromium)" })
	.boolean("browser-debug")
	.options("browser-extensions", { description: "List of extension paths separated by a space and relative to the 'cli' folder (webdriver-gecko, webdriver-chromium)" })
	.array("browser-extensions")
	.options("browser-scripts", { description: "List of script paths separated by a space and relative to the 'cli' folder. They will be executed in all the frames." })
	.array("browser-scripts")
	.options("browser-args", { description: "Arguments provided as a JSON array and passed to the browser (puppeteer, webdriver-gecko, webdriver-chromium)" })
	.string("browser-args")
	.options("compress-CSS", { description: "Compress CSS stylesheets" })
	.boolean("compress-CSS")
	.options("compress-HTML", { description: "Compress HTML content" })
	.boolean("compress-HTML")
	.options("crawl-links", { description: "Crawl and save pages found via inner links" })
	.boolean("crawl-links")
	.options("crawl-inner-links-only", { description: "Crawl pages found via inner links only if they are hosted on the same domain" })
	.boolean("crawl-inner-links-only")
	.options("crawl-max-depth", { description: "Max depth when crawl pages found via inner links" })
	.number("crawl-max-depth")
	.options("crawl-replace-urls", { description: "Replace URLs of saved pages with relative paths of saved pages on the filesystem" })
	.boolean("crawl-replace-urls")
	.options("error-file")
	.string("error-file")
	.options("filename-template", { description: "Template used to generate the output filename (see help page of the extension for more info)" })
	.string("filename-template")
	.options("filename-replacement-character", { description: "The character used for replacing invalid characters in filenames" })
	.string("filename-replacement-character")
	.string("filename-template")
	.options("group-duplicate-images", { description: "Group duplicate images into CSS custom properties" })
	.boolean("group-duplicate-images")
	.options("include-BOM", { description: "Include the UTF-8 BOM into the HTML page" })
	.boolean("include-BOM")
	.options("include-infobar", { description: "Include the infobar" })
	.boolean("include-infobar")
	.options("load-deferred-images", { description: "Load deferred (a.k.a. lazy-loaded) images (puppeteer, webdriver-gecko, webdriver-chromium)" })
	.boolean("load-deferred-images")
	.options("load-deferred-images-max-idle-time", { description: "Maximum delay of time to wait for deferred images in ms (puppeteer, webdriver-gecko, webdriver-chromium)" })
	.number("load-deferred-images-max-idle-time")
	.options("max-parallel-workers", { description: "Maximum number of browsers launched in parallel when processing a list of URLs (cf --urls-file)" })
	.number("max-parallel-workers")
	.options("max-resource-size-enabled", { description: "Enable removal of embedded resources exceeding a given size" })
	.boolean("max-resource-size-enabled")
	.options("max-resource-size", { description: "Maximum size of embedded resources in MB (i.e. images, stylesheets, scripts and iframes)" })
	.number("max-resource-size")
	.options("remove-frames", { description: "Remove frames (puppeteer, webdriver-gecko, webdriver-chromium)" })
	.boolean("remove-frames")
	.options("remove-hidden-elements", { description: "Remove HTML elements which are not displayed" })
	.boolean("remove-hidden-elements")
	.options("remove-unused-styles", { description: "Remove unused CSS rules and unneeded declarations" })
	.boolean("remove-unused-styles")
	.options("remove-unused-fonts", { description: "Remove unused CSS font rules" })
	.boolean("remove-unused-fonts")
	.options("remove-imports", { description: "Remove HTML imports" })
	.boolean("remove-imports")
	.options("remove-scripts", { description: "Remove JavaScript scripts" })
	.boolean("remove-scripts")
	.options("remove-audio-src", { description: "Remove source of audio elements" })
	.boolean("remove-audio-src")
	.options("remove-video-src", { description: "Remove source of video elements" })
	.boolean("remove-video-src")
	.options("remove-alternative-fonts", { description: "Remove alternative fonts to the ones displayed" })
	.boolean("remove-alternative-fonts")
	.options("remove-alternative-medias", { description: "Remove alternative CSS stylesheets" })
	.boolean("remove-alternative-medias")
	.options("remove-alternative-images", { description: "Remove images for alternative sizes of screen" })
	.boolean("remove-alternative-images")
	.options("save-raw-page", { description: "Save the original page without interpreting it into the browser (puppeteer, webdriver-gecko, webdriver-chromium)" })
	.boolean("save-raw-page")
	.options("url-rewrite-rules", { description: "List of rewrite rules used to rewrite URLs" })
	.array("url-rewrite-rules")
	.options("urls-file", { description: "Path to a text file containing a list of URLs (separated by a newline) to save" })
	.string("urls-file")
	.options("user-agent", { description: "User-agent of the browser (puppeteer, webdriver-gecko, webdriver-chromium)" })
	.string("user-agent")
	.options("user-script-enabled", { description: "Enable the event API allowing to execute scripts before the page is saved" })
	.boolean("user-script-enabled")
	.options("web-driver-executable-path", { description: "Path to Selenium WebDriver executable (webdriver-gecko, webdriver-chromium)" })
	.string("web-driver-executable-path")
	.argv;
args.compressCSS = args.compressCss;
args.compressHTML = args.compressHtml;
args.includeBOM = args.includeBom;
args.crawlReplaceURLs = args.crawlReplaceUrls;
module.exports = args;