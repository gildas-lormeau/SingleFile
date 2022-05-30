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

/* global require, exports, URL */

const fs = require("fs");
const path = require("path");
const scripts = require("./back-ends/common/scripts.js");
const VALID_URL_TEST = /^(https?|file):\/\//;

const DEFAULT_OPTIONS = {
	removeHiddenElements: true,
	removeUnusedStyles: true,
	removeUnusedFonts: true,
	removeFrames: false,
	removeImports: true,
	compressHTML: true,
	compressCSS: false,
	loadDeferredImages: true,
	loadDeferredImagesMaxIdleTime: 1500,
	loadDeferredImagesBlockCookies: false,
	loadDeferredImagesBlockStorage: false,
	loadDeferredImagesKeepZoomLevel: false,
	loadDeferredImagesDispatchScrollEvent: false,
	filenameTemplate: "{page-title} ({date-locale} {time-locale}).html",
	infobarTemplate: "",
	includeInfobar: false,
	filenameMaxLength: 192,
	filenameMaxLengthUnit: "bytes",
	filenameReplacedCharacters: ["~", "+", "\\\\", "?", "%", "*", ":", "|", "\"", "<", ">", "\x00-\x1f", "\x7F"],
	filenameReplacementCharacter: "_",
	maxResourceSizeEnabled: false,
	maxResourceSize: 10,
	backgroundSave: true,
	removeAlternativeFonts: true,
	removeAlternativeMedias: true,
	removeAlternativeImages: true,
	groupDuplicateImages: true,
	saveRawPage: false,
	resolveFragmentIdentifierURLs: false,
	userScriptEnabled: false,
	saveFavicon: true,
	includeBOM: false,
	insertMetaCSP: true,
	insertMetaNoIndex: false,
	insertSingleFileComment: true,
	blockImages: false,
	blockStylesheets: false,
	blockFont: false,
	blockScripts: true,
	blockVideos: true,
	blockAudios: true
};
const STATE_PROCESSING = "processing";
const STATE_PROCESSED = "processed";

const backEnds = {
	jsdom: "./back-ends/jsdom.js",
	puppeteer: "./back-ends/puppeteer.js",
	"puppeteer-firefox": "./back-ends/puppeteer-firefox.js",
	"webdriver-chromium": "./back-ends/webdriver-chromium.js",
	"webdriver-gecko": "./back-ends/webdriver-gecko.js",
	"playwright-firefox": "./back-ends/playwright-firefox.js",
	"playwright-chromium": "./back-ends/playwright-chromium.js"
};

let backend, tasks = [], maxParallelWorkers = 8, sessionFilename;

exports.getBackEnd = backEndName => require(backEnds[backEndName]);
exports.DEFAULT_OPTIONS = DEFAULT_OPTIONS;
exports.VALID_URL_TEST = VALID_URL_TEST;
exports.initialize = initialize;

async function initialize(options) {
	options = Object.assign({}, DEFAULT_OPTIONS, options);
	maxParallelWorkers = options.maxParallelWorkers;
	backend = require(backEnds[options.backEnd]);
	await backend.initialize(options);
	if (options.crawlSyncSession || options.crawlLoadSession) {
		try {
			tasks = JSON.parse(fs.readFileSync(options.crawlSyncSession || options.crawlLoadSession).toString());
		} catch (error) {
			if (options.crawlLoadSession) {
				throw error;
			}
		}
	}
	if (options.crawlSyncSession || options.crawlSaveSession) {
		sessionFilename = options.crawlSyncSession || options.crawlSaveSession;
	}
	return {
		capture: urls => capture(urls, options),
		finish: () => finish(options),
	};
}

async function capture(urls, options) {
	let newTasks;
	const taskUrls = tasks.map(task => task.url);
	newTasks = urls.map(url => createTask(url, options));
	newTasks = newTasks.filter(task => task && !taskUrls.includes(task.url));
	if (newTasks.length) {
		tasks = tasks.concat(newTasks);
		saveTasks();
	}
	await runTasks();
}

async function finish(options) {
	const promiseTasks = tasks.map(task => task.promise);
	await Promise.all(promiseTasks);
	if (options.crawlReplaceURLs) {
		tasks.forEach(task => {
			try {
				let pageContent = fs.readFileSync(task.filename).toString();
				tasks.forEach(otherTask => {
					if (otherTask.filename) {
						pageContent = pageContent.replace(new RegExp(escapeRegExp("\"" + otherTask.originalUrl + "\""), "gi"), "\"" + otherTask.filename + "\"");
						pageContent = pageContent.replace(new RegExp(escapeRegExp("'" + otherTask.originalUrl + "'"), "gi"), "'" + otherTask.filename + "'");
						const filename = otherTask.filename.replace(/ /g, "%20");
						pageContent = pageContent.replace(new RegExp(escapeRegExp("=" + otherTask.originalUrl + " "), "gi"), "=" + filename + " ");
						pageContent = pageContent.replace(new RegExp(escapeRegExp("=" + otherTask.originalUrl + ">"), "gi"), "=" + filename + ">");
					}
				});
				fs.writeFileSync(task.filename, pageContent);
			} catch (error) {
				// ignored
			}
		});
	}
	if (!options.browserDebug) {
		return backend.closeBrowser();
	}
}

async function runTasks() {
	const availableTasks = tasks.filter(task => !task.status).length;
	const processingTasks = tasks.filter(task => task.status == STATE_PROCESSING).length;
	const promisesTasks = [];
	for (let workerIndex = 0; workerIndex < Math.min(availableTasks, maxParallelWorkers - processingTasks); workerIndex++) {
		promisesTasks.push(runNextTask());
	}
	return Promise.all(promisesTasks);
}

async function runNextTask() {
	const task = tasks.find(task => !task.status);
	if (task) {
		const options = task.options;
		let taskOptions = JSON.parse(JSON.stringify(options));
		taskOptions.url = task.url;
		task.status = STATE_PROCESSING;
		saveTasks();
		task.promise = capturePage(taskOptions);
		const pageData = await task.promise;
		task.status = STATE_PROCESSED;
		if (pageData) {
			task.filename = pageData.filename;
			if (options.crawlLinks && testMaxDepth(task)) {
				let newTasks = pageData.links
					.map(urlLink => createTask(urlLink, options, task, tasks[0]))
					.filter(task => task &&
						testMaxDepth(task) &&
						!tasks.find(otherTask => otherTask.url == task.url) &&
						(!options.crawlInnerLinksOnly || task.isInnerLink) &&
						(!options.crawlNoParent || (task.isChild || !task.isInnerLink)));
				tasks.splice(tasks.length, 0, ...newTasks);
			}
		}
		saveTasks();
		await runTasks();
	}
}

function testMaxDepth(task) {
	const options = task.options;
	return (options.crawlMaxDepth == 0 || task.depth <= options.crawlMaxDepth) &&
		(options.crawlExternalLinksMaxDepth == 0 || task.externalLinkDepth < options.crawlExternalLinksMaxDepth);
}

function createTask(url, options, parentTask, rootTask) {
	url = parentTask ? rewriteURL(url, options.crawlRemoveURLFragment, options.crawlRewriteRules) : url;
	if (VALID_URL_TEST.test(url)) {
		const isInnerLink = rootTask && url.startsWith(getHostURL(rootTask.url));
		const rootBaseURIMatch = rootTask && rootTask.url.match(/(.*?)[^/]*$/);
		const isChild = isInnerLink && rootBaseURIMatch && rootBaseURIMatch[1] && url.startsWith(rootBaseURIMatch[1]);
		return {
			url,
			isInnerLink,
			isChild,
			originalUrl: url,
			rootBaseURI: rootBaseURIMatch && rootBaseURIMatch[1],
			depth: parentTask ? parentTask.depth + 1 : 0,
			externalLinkDepth: isInnerLink ? -1 : parentTask ? parentTask.externalLinkDepth + 1 : -1,
			options
		};
	}
}

function saveTasks() {
	if (sessionFilename) {
		fs.writeFileSync(sessionFilename, JSON.stringify(
			tasks.map(task => Object.assign({}, task, {
				status: task.status == STATE_PROCESSING ? undefined : task.status,
				promise: undefined,
				options: task.status && task.status == STATE_PROCESSED ? undefined : task.options
			}))
		));
	}
}

function rewriteURL(url, crawlRemoveURLFragment, crawlRewriteRules) {
	url = url.trim();
	if (crawlRemoveURLFragment) {
		url = url.replace(/^(.*?)#.*$/, "$1");
	}
	crawlRewriteRules.forEach(rewriteRule => {
		const parts = rewriteRule.trim().split(/ +/);
		if (parts.length) {
			url = url.replace(new RegExp(parts[0]), parts[1] || "").trim();
		}
	});
	return url;
}

function getHostURL(url) {
	url = new URL(url);
	return url.protocol + "//" + (url.username ? url.username + (url.password || "") + "@" : "") + url.hostname;
}

async function capturePage(options) {
	try {
		let filename;
		const pageData = await backend.getPageData(options);
		if (options.includeInfobar) {
			await includeInfobarScript(pageData);
		}
		if (options.output) {
			filename = getFilename(options.output, options);
		} else if (options.dumpContent) {
			console.log(pageData.content); // eslint-disable-line no-console
		} else {
			filename = getFilename(pageData.filename, options);
		}
		if (filename) {
			const dirname = path.dirname(filename);
			if (dirname) {
				fs.mkdirSync(dirname, { recursive: true });
			}
			fs.writeFileSync(filename, pageData.content);
		}
		return pageData;
	} catch (error) {
		const message = "URL: " + options.url + "\nStack: " + error.stack + "\n";
		if (options.errorFile) {
			fs.writeFileSync(options.errorFile, message, { flag: "a" });
		} else {
			console.error(error.message || error, message); // eslint-disable-line no-console
		}
	}
}

function getFilename(filename, options, index = 1) {
	if (Array.isArray(options.outputDirectory)) {
		const outputDirectory = options.outputDirectory.pop();
		if (outputDirectory.startsWith("/")) {
			options.outputDirectory = outputDirectory;
		} else {
			options.outputDirectory = options.outputDirectory[0] + outputDirectory;
		}
	}
	let outputDirectory = options.outputDirectory || "";
	if (outputDirectory && !outputDirectory.endsWith("/")) {
		outputDirectory += "/";
	}
	let newFilename = outputDirectory + filename;
	if (options.filenameConflictAction == "overwrite") {
		return filename;
	} else if (options.filenameConflictAction == "uniquify" && index > 1) {
		const regExpMatchExtension = /(\.[^.]+)$/;
		const matchExtension = newFilename.match(regExpMatchExtension);
		if (matchExtension && matchExtension[1]) {
			newFilename = newFilename.replace(regExpMatchExtension, " (" + index + ")" + matchExtension[1]);
		} else {
			newFilename += " (" + index + ")";
		}
	}
	if (fs.existsSync(newFilename)) {
		if (options.filenameConflictAction != "skip") {
			return getFilename(filename, options, index + 1);
		}
	} else {
		return newFilename;
	}
}

function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function includeInfobarScript(pageData) {
	const infobarContent = await scripts.getInfobarScript();
	pageData.content += "<script>document.currentScript.remove();" + infobarContent + "</script>";
}
