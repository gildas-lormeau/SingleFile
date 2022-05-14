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
		"accept-headers": {
			"font": "application/font-woff2;q=1.0,application/font-woff;q=0.9,*/*;q=0.8",
			"image": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
			"stylesheet": "text/css,*/*;q=0.1",
			"script": "*/*",
			"document": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
		},
		"back-end": "puppeteer",
		"block-mixed-content": false,
		"browser-server": "",
		"browser-headless": true,
		"browser-executable-path": "",
		"browser-width": 1280,
		"browser-height": 720,
		"browser-load-max-time": 60000,
		"browser-wait-delay": 0,
		"browser-wait-until": "networkidle0",
		"browser-wait-until-fallback": true,
		"browser-debug": false,
		"browser-script": [],
		"browser-stylesheet": [],
		"browser-args": "",
		"browser-start-minimized": false,
		"browser-cookie": [],
		"browser-cookies-file": "",
		"compress-CSS": false,
		"compress-HTML": true,
		"dump-content": false,
		"emulateMediaFeature": [],
		"filename-template": "{page-title} ({date-iso} {time-locale}).html",
		"filename-conflict-action": "uniquify",
		"filename-replacement-character": "_",
		"filename-max-length": 192,
		"filename-max-length-unit": "bytes",
		"group-duplicate-images": true,
		"http-header": [],
		"include-infobar": false,
		"insert-meta-csp": true,
		"load-deferred-images": true,
		"load-deferred-images-dispatch-scroll-event": false,
		"load-deferred-images-max-idle-time": 1500,
		"load-deferred-images-keep-zoom-level": false,
		"max-parallel-workers": 8,
		"max-resource-size-enabled": false,
		"max-resource-size": 10,
		"move-styles-in-head": false,
		"output-directory": "",
		"remove-hidden-elements": true,
		"remove-unused-styles": true,
		"remove-unused-fonts": true,
		"remove-frames": false,
		"remove-imports": true,
		"block-scripts": true,
		"block-audios": true,
		"block-videos": true,
		"remove-alternative-fonts": true,
		"remove-alternative-medias": true,
		"remove-alternative-images": true,
		"save-original-urls": false,
		"save-raw-page": false,
		"web-driver-executable-path": "",
		"user-script-enabled": true,
		"include-BOM": false,
		"crawl-links": false,
		"crawl-inner-links-only": true,
		"crawl-remove-url-fragment": true,
		"crawl-max-depth": 1,
		"crawl-external-links-max-depth": 1,
		"crawl-replace-urls": false,
		"crawl-rewrite-rule": []
	})
	.options("back-end", { description: "Back-end to use" })
	.choices("back-end", ["jsdom", "puppeteer", "webdriver-chromium", "webdriver-gecko", "puppeteer-firefox", "playwright-firefox", "playwright-chromium"])
	.options("block-mixed-content", { description: "Block mixed contents" })
	.boolean("block-mixed-content")
	.options("browser-server", { description: "Server to connect to (puppeteer only for now)" })
	.string("browser-server")
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
	.options("browser-wait-delay", { description: "Time to wait before capturing the page in ms" })
	.number("browser-wait-delay")
	.options("browser-wait-until", { description: "When to consider the page is loaded (puppeteer, webdriver-gecko, webdriver-chromium)" })
	.choices("browser-wait-until", ["networkidle0", "networkidle2", "load", "domcontentloaded"])
	.options("browser-wait-until-fallback", { description: "Retry with the next value of --browser-wait-until when a timeout error is thrown" })
	.boolean("browser-wait-until-fallback")
	.options("browser-debug", { description: "Enable debug mode (puppeteer, webdriver-gecko, webdriver-chromium)" })
	.boolean("browser-debug")
	.options("browser-script", { description: "Path of a script executed in the page (and all the frames) before it is loaded" })
	.array("browser-script")
	.options("browser-stylesheet", { description: "Path of a stylesheet file inserted into the page (and all the frames) after it is loaded" })
	.array("browser-stylesheet")
	.options("browser-args", { description: "Arguments provided as a JSON array and passed to the browser (puppeteer, webdriver-gecko, webdriver-chromium)" })
	.string("browser-args")
	.options("browser-start-minimized", { description: "Minimize the browser (puppeteer)" })
	.boolean("browser-start-minimized")
	.options("browser-cookie", { description: "Ordered list of cookie parameters separated by a comma: name,value,domain,path,expires,httpOnly,secure,sameSite,url (puppeteer, webdriver-gecko, webdriver-chromium, jsdom)" })
	.array("browser-cookie")
	.options("browser-cookies-file", { description: "Path of the cookies file formatted as a JSON file or a Netscape text file (puppeteer, webdriver-gecko, webdriver-chromium, jsdom)" })
	.string("browser-cookies-file")
	.options("compress-CSS", { description: "Compress CSS stylesheets" })
	.boolean("compress-CSS")
	.options("compress-HTML", { description: "Compress HTML content" })
	.boolean("compress-HTML")
	.options("crawl-links", { description: "Crawl and save pages found via inner links" })
	.boolean("crawl-links")
	.options("crawl-inner-links-only", { description: "Crawl pages found via inner links only if they are hosted on the same domain" })
	.boolean("crawl-inner-links-only")
	.options("crawl-no-parent", { description: "Crawl pages found via inner links only if their URLs are not parent of the URL to crawl" })
	.boolean("crawl-no-parent")
	.options("crawl-load-session", { description: "Name of the file of the session to load (previously saved with --crawl-save-session or --crawl-sync-session)" })
	.string("crawl-load-session")
	.options("crawl-remove-url-fragment", { description: "Remove URL fragments found in links" })
	.boolean("crawl-remove-url-fragment")
	.options("crawl-save-session", { description: "Name of the file where to save the state of the session" })
	.string("crawl-save-session")
	.options("crawl-sync-session", { description: "Name of the file where to load and save the state of the session" })
	.string("crawl-sync-session")
	.options("crawl-max-depth", { description: "Max depth when crawling pages found in internal and external links (0: infinite)" })
	.number("crawl-max-depth")
	.options("crawl-external-links-max-depth", { description: "Max depth when crawling pages found in external links (0: infinite)" })
	.number("crawl-external-links-max-depth")
	.options("crawl-replace-urls", { description: "Replace URLs of saved pages with relative paths of saved pages on the filesystem" })
	.boolean("crawl-replace-urls")
	.options("crawl-rewrite-rule", { description: "Rewrite rule used to rewrite URLs of crawled pages" })
	.array("crawl-rewrite-rule")
	.options("dump-content", { description: "Dump the content of the processed page in the console ('true' when running in Docker)" })
	.boolean("dump-content")
	.options("emulate-media-feature", { description: "Emulate a media feature. The syntax is <name>:<value>, e.g. \"prefers-color-scheme:dark\" (puppeteer)" })
	.array("emulate-media-feature")
	.options("error-file")
	.string("error-file")
	.options("filename-template", { description: "Template used to generate the output filename (see help page of the extension for more info)" })
	.string("filename-template")
	.options("filename-conflict-action", { description: "Action when the filename is conflicting with existing one on the filesystem. The possible values are \"uniquify\" (default), \"overwrite\" and \"skip\"" })
	.string("filename-conflict-action")
	.options("filename-replacement-character", { description: "The character used for replacing invalid characters in filenames" })
	.string("filename-replacement-character")
	.options("filename-max-length", { description: "Specify the maximum length of the filename" })
	.number("filename-max-length")
	.options("filename-max-length-unit", { description: "Specify the unit of the maximum length of the filename ('bytes' or 'chars')" })
	.string("filename-max-length-unit")
	.options("group-duplicate-images", { description: "Group duplicate images into CSS custom properties" })
	.boolean("group-duplicate-images")
	.options("http-header", { description: "Extra HTTP header (puppeteer, jsdom)" })
	.array("http-header")
	.options("include-BOM", { description: "Include the UTF-8 BOM into the HTML page" })
	.boolean("include-BOM")
	.options("include-infobar", { description: "Include the infobar" })
	.boolean("include-infobar")
	.options("insert-meta-csp", { description: "Include a <meta> tag with a CSP to avoid potential requests to internet when viewing a page" })
	.boolean("insert-meta-csp")
	.options("load-deferred-images", { description: "Load deferred (a.k.a. lazy-loaded) images (puppeteer, webdriver-gecko, webdriver-chromium)" })
	.boolean("load-deferred-images")
	.options("load-deferred-images-dispatch-scroll-event", { description: "Dispatch 'scroll' event when loading deferred images" })
	.boolean("load-deferred-images-dispatch-scroll-event")
	.options("load-deferred-images-max-idle-time", { description: "Maximum delay of time to wait for deferred images in ms (puppeteer, webdriver-gecko, webdriver-chromium)" })
	.number("load-deferred-images-max-idle-time")
	.options("load-deferred-images-keep-zoom-level", { description: "Load deferred images by keeping zoomed out the page" })
	.boolean("load-deferred-images-keep-zoom-level")
	.options("max-parallel-workers", { description: "Maximum number of browsers launched in parallel when processing a list of URLs (cf --urls-file)" })
	.number("max-parallel-workers")
	.options("max-resource-size-enabled", { description: "Enable removal of embedded resources exceeding a given size" })
	.boolean("max-resource-size-enabled")
	.options("max-resource-size", { description: "Maximum size of embedded resources in MB (i.e. images, stylesheets, scripts and iframes)" })
	.number("max-resource-size")
	.options("move-styles-in-head", { description: "Move style elements outside the head element into the head element" })
	.boolean("move-styles-in-head")
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
	.options("block-scripts", { description: "Block scripts" })
	.boolean("block-scripts")
	.options("block-audios", { description: "Block audio elements" })
	.boolean("block-audios")
	.options("block-videos", { description: "Block video elements" })
	.boolean("block-videos")
	.options("remove-alternative-fonts", { description: "Remove alternative fonts to the ones displayed" })
	.boolean("remove-alternative-fonts")
	.options("remove-alternative-medias", { description: "Remove alternative CSS stylesheets" })
	.boolean("remove-alternative-medias")
	.options("remove-alternative-images", { description: "Remove images for alternative sizes of screen" })
	.boolean("remove-alternative-images")
	.options("save-original-urls", { description: "Save the original URLS in the embedded contents" })
	.boolean("save-original-urls")
	.options("save-raw-page", { description: "Save the original page without interpreting it into the browser (puppeteer, webdriver-gecko, webdriver-chromium)" })
	.boolean("save-raw-page")
	.options("urls-file", { description: "Path to a text file containing a list of URLs (separated by a newline) to save" })
	.string("urls-file")
	.options("user-agent", { description: "User-agent of the browser (puppeteer, webdriver-gecko, webdriver-chromium)" })
	.string("user-agent")
	.options("user-script-enabled", { description: "Enable the event API allowing to execute scripts before the page is saved" })
	.boolean("user-script-enabled")
	.options("web-driver-executable-path", { description: "Path to Selenium WebDriver executable (webdriver-gecko, webdriver-chromium)" })
	.string("web-driver-executable-path")
	.options("output-directory", { description: "Path to where to save files, this path must exist." })
	.string("output-directory")
	.argv;
args.backgroundSave = true;
args.compressCSS = args.compressCss;
args.compressHTML = args.compressHtml;
args.includeBOM = args.includeBom;
args.crawlReplaceURLs = args.crawlReplaceUrls;
args.crawlRemoveURLFragment = args.crawlRemoveUrlFragment;
args.insertMetaCSP = args.insertMetaCsp;
if (args.removeScripts) {
	args.blockScripts = true;
}
if (args.removeAudioSrc) {
	args.blockAudios = true;
}
if (args.removeVideoSrc) {
	args.blockVideos = true;
}
const headers = args.httpHeader;
delete args.httpHeader;
args.httpHeaders = {};
headers.forEach(header => {
	const matchedHeader = header.match(/^(.*?):(.*)$/);
	if (matchedHeader.length == 3) {
		args.httpHeaders[matchedHeader[1].trim()] = matchedHeader[2].trimLeft();
	}
});
const cookies = args.browserCookie;
delete args.browserCookie;
args.browserCookies = cookies.map(cookieValue => {
	const value = cookieValue.split(/(?<!\\),/);
	return {
		name: value[0],
		value: value[1],
		domain: value[2] || undefined,
		path: value[3] || undefined,
		expires: value[4] && Number(value[4]) || undefined,
		httpOnly: value[5] && value[5] == "true" || undefined,
		secure: value[6] && value[5] == "true" || undefined,
		sameSite: value[7] || undefined,
		url: value[8] || undefined
	};
});
args.browserScripts = args.browserScript;
delete args.browserScript;
args.browserStylesheets = args.browserStylesheet;
delete args.browserStylesheet;
args.crawlRewriteRules = args.crawlRewriteRule;
delete args.crawlRewriteRule;
args.emulateMediaFeatures = args.emulateMediaFeature
	.map(value => {
		const splitValue = value.match(/^([^:]+):(.*)$/);
		if (splitValue.length >= 3) {
			return { name: splitValue[1].trim(), value: splitValue[2].trim() };
		}
	})
	.filter(identity => identity);
delete args.emulateMediaFeature;
Object.keys(args).filter(optionName => optionName.includes("-"))
	.forEach(optionName => delete args[optionName]);
delete args["$0"];
delete args["_"];
module.exports = args;