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

/* global globalThis */

const DEBUG = false;

const Set = globalThis.Set;
const Map = globalThis.Map;

let util, cssTree;

function getClass(...args) {
	[util, cssTree] = args;
	return SingleFileClass;
}

class SingleFileClass {
	constructor(options) {
		this.options = options;
	}
	async run() {
		const waitForUserScript = globalThis._singleFile_waitForUserScript;
		if (this.options.userScriptEnabled && waitForUserScript) {
			await waitForUserScript(util.ON_BEFORE_CAPTURE_EVENT_NAME);
		}
		this.runner = new Runner(this.options, true);
		await this.runner.loadPage();
		await this.runner.initialize();
		if (this.options.userScriptEnabled && waitForUserScript) {
			await waitForUserScript(util.ON_AFTER_CAPTURE_EVENT_NAME);
		}
		await this.runner.run();
	}
	cancel() {
		this.cancelled = true;
		if (this.runner) {
			this.runner.cancel();
		}
	}
	getPageData() {
		return this.runner.getPageData();
	}
}

// -------------
// ProgressEvent
// -------------
const PAGE_LOADING = "page-loading";
const PAGE_LOADED = "page-loaded";
const RESOURCES_INITIALIZING = "resource-initializing";
const RESOURCES_INITIALIZED = "resources-initialized";
const RESOURCE_LOADED = "resource-loaded";
const PAGE_ENDED = "page-ended";
const STAGE_STARTED = "stage-started";
const STAGE_ENDED = "stage-ended";
const STAGE_TASK_STARTED = "stage-task-started";
const STAGE_TASK_ENDED = "stage-task-ended";

class ProgressEvent {
	constructor(type, detail) {
		return { type, detail, PAGE_LOADING, PAGE_LOADED, RESOURCES_INITIALIZING, RESOURCES_INITIALIZED, RESOURCE_LOADED, PAGE_ENDED, STAGE_STARTED, STAGE_ENDED, STAGE_TASK_STARTED, STAGE_TASK_ENDED };
	}
}

// ------
// Runner
// ------
const RESOLVE_URLS_STAGE = 0;
const REPLACE_DATA_STAGE = 1;
const REPLACE_DOCS_STAGE = 2;
const POST_PROCESS_STAGE = 3;
const STAGES = [{
	sequential: [
		{ action: "preProcessPage" },
		{ option: "loadDeferredImagesKeepZoomLevel", action: "resetZoomLevel" },
		{ action: "replaceStyleContents" },
		{ action: "resetCharsetMeta" },
		{ option: "saveFavicon", action: "saveFavicon" },
		{ action: "replaceCanvasElements" },
		{ action: "insertFonts" },
		{ action: "insertShadowRootContents" },
		{ action: "setInputValues" },
		{ option: "moveStylesInHead", action: "moveStylesInHead" },
		{ option: "removeScripts", action: "removeScripts" },
		{ option: "selected", action: "removeUnselectedElements" },
		{ option: "removeVideoSrc", action: "insertVideoPosters" },
		{ option: "removeVideoSrc", action: "insertVideoLinks" },
		{ option: "removeFrames", action: "removeFrames" },
		{ option: "removeVideoSrc", action: "removeVideoSources" },
		{ option: "removeAudioSrc", action: "removeAudioSources" },
		{ action: "removeDiscardedResources" },
		{ option: "removeHiddenElements", action: "removeHiddenElements" },
		{ action: "resolveHrefs" },
		{ action: "resolveStyleAttributeURLs" }
	],
	parallel: [
		{ action: "resolveStylesheetURLs" },
		{ option: "!removeFrames", action: "resolveFrameURLs" },
		{ action: "resolveHtmlImportURLs" }
	]
}, {
	sequential: [
		{ option: "removeUnusedStyles", action: "removeUnusedStyles" },
		{ option: "removeAlternativeMedias", action: "removeAlternativeMedias" },
		{ option: "removeUnusedFonts", action: "removeUnusedFonts" }
	],
	parallel: [
		{ action: "processStylesheets" },
		{ action: "processStyleAttributes" },
		{ action: "processPageResources" },
		{ option: "!removeScripts", action: "processScripts" }
	]
}, {
	sequential: [
		{ option: "removeAlternativeImages", action: "removeAlternativeImages" }
	],
	parallel: [
		{ option: "removeAlternativeFonts", action: "removeAlternativeFonts" },
		{ option: "!removeFrames", action: "processFrames" },
		{ option: "!removeImports", action: "processHtmlImports" },
	]
}, {
	sequential: [
		{ action: "replaceStylesheets" },
		{ action: "replaceStyleAttributes" },
		{ action: "insertVariables" },
		{ option: "compressHTML", action: "compressHTML" },
		{ action: "cleanupPage" }
	],
	parallel: [
		{ option: "enableMaff", action: "insertMAFFMetaData" },
		{ action: "setDocInfo" }
	]
}];

class Runner {
	constructor(options, root) {
		const rootDocDefined = root && options.doc;
		this.root = root;
		this.options = options;
		this.options.url = this.options.url || (rootDocDefined && this.options.doc.location.href);
		const matchResourceReferrer = this.options.url.match(/^.*\//);
		this.options.resourceReferrer = this.options.passReferrerOnError && matchResourceReferrer && matchResourceReferrer[0];
		this.options.baseURI = rootDocDefined && this.options.doc.baseURI;
		this.options.rootDocument = root;
		this.options.updatedResources = this.options.updatedResources || {};
		this.options.fontTests = new Map();
		this.batchRequest = new BatchRequest();
		this.processor = new Processor(options, this.batchRequest);
		if (rootDocDefined) {
			const docData = util.preProcessDoc(this.options.doc, this.options.win, this.options);
			this.options.canvases = docData.canvases;
			this.options.fonts = docData.fonts;
			this.options.stylesheets = docData.stylesheets;
			this.options.images = docData.images;
			this.options.posters = docData.posters;
			this.options.videos = docData.videos;
			this.options.usedFonts = docData.usedFonts;
			this.options.shadowRoots = docData.shadowRoots;
			this.options.imports = docData.imports;
			this.options.referrer = docData.referrer;
			this.markedElements = docData.markedElements;
			this.invalidElements = docData.invalidElements;
		}
		if (this.options.saveRawPage) {
			this.options.removeFrames = true;
		}
		this.options.content = this.options.content || (rootDocDefined ? util.serialize(this.options.doc) : null);
		this.onprogress = options.onprogress || (() => { });
	}

	async loadPage() {
		this.onprogress(new ProgressEvent(PAGE_LOADING, { pageURL: this.options.url, frame: !this.root }));
		await this.processor.loadPage(this.options.content);
		this.onprogress(new ProgressEvent(PAGE_LOADED, { pageURL: this.options.url, frame: !this.root }));
	}

	async initialize() {
		this.onprogress(new ProgressEvent(RESOURCES_INITIALIZING, { pageURL: this.options.url }));
		await this.executeStage(RESOLVE_URLS_STAGE);
		this.pendingPromises = this.executeStage(REPLACE_DATA_STAGE);
		if (this.root && this.options.doc) {
			util.postProcessDoc(this.options.doc, this.markedElements, this.invalidElements);
		}
	}

	cancel() {
		this.cancelled = true;
		this.batchRequest.cancel();
		if (this.root) {
			if (this.options.frames) {
				this.options.frames.forEach(cancelRunner);
			}
			if (this.options.imports) {
				this.options.imports.forEach(cancelRunner);
			}
		}

		function cancelRunner(resourceData) {
			if (resourceData.runner) {
				resourceData.runner.cancel();
			}
		}
	}

	async run() {
		if (this.root) {
			this.processor.initialize(this.batchRequest);
			this.onprogress(new ProgressEvent(RESOURCES_INITIALIZED, { pageURL: this.options.url, max: this.processor.maxResources }));
		}
		await this.batchRequest.run(detail => {
			detail.pageURL = this.options.url;
			this.onprogress(new ProgressEvent(RESOURCE_LOADED, detail));
		}, this.options);
		await this.pendingPromises;
		this.options.doc = null;
		this.options.win = null;
		await this.executeStage(REPLACE_DOCS_STAGE);
		await this.executeStage(POST_PROCESS_STAGE);
		this.processor.finalize();
	}

	getDocument() {
		return this.processor.doc;
	}

	getStyleSheets() {
		return this.processor.stylesheets;
	}

	getPageData() {
		if (this.root) {
			this.onprogress(new ProgressEvent(PAGE_ENDED, { pageURL: this.options.url }));
		}
		return this.processor.getPageData();
	}

	async executeStage(step) {
		if (DEBUG) {
			log("**** STARTED STAGE", step, "****");
		}
		const frame = !this.root;
		this.onprogress(new ProgressEvent(STAGE_STARTED, { pageURL: this.options.url, step, frame }));
		STAGES[step].sequential.forEach(task => {
			let startTime;
			if (DEBUG) {
				startTime = Date.now();
				log("  -- STARTED task =", task.action);
			}
			this.onprogress(new ProgressEvent(STAGE_TASK_STARTED, { pageURL: this.options.url, step, task: task.action, frame }));
			if (!this.cancelled) {
				this.executeTask(task);
			}
			this.onprogress(new ProgressEvent(STAGE_TASK_ENDED, { pageURL: this.options.url, step, task: task.action, frame }));
			if (DEBUG) {
				log("  -- ENDED   task =", task.action, "delay =", Date.now() - startTime);
			}
		});
		let parallelTasksPromise;
		if (STAGES[step].parallel) {
			parallelTasksPromise = await Promise.all(STAGES[step].parallel.map(async task => {
				let startTime;
				if (DEBUG) {
					startTime = Date.now();
					log("  // STARTED task =", task.action);
				}
				this.onprogress(new ProgressEvent(STAGE_TASK_STARTED, { pageURL: this.options.url, step, task: task.action, frame }));
				if (!this.cancelled) {
					await this.executeTask(task);
				}
				this.onprogress(new ProgressEvent(STAGE_TASK_ENDED, { pageURL: this.options.url, step, task: task.action, frame }));
				if (DEBUG) {
					log("  // ENDED task =", task.action, "delay =", Date.now() - startTime);
				}
			}));
		} else {
			parallelTasksPromise = Promise.resolve();
		}
		this.onprogress(new ProgressEvent(STAGE_ENDED, { pageURL: this.options.url, step, frame }));
		if (DEBUG) {
			log("**** ENDED   STAGE", step, "****");
		}
		return parallelTasksPromise;
	}

	executeTask(task) {
		if (!task.option || ((task.option.startsWith("!") && !this.options[task.option]) || this.options[task.option])) {
			return this.processor[task.action]();
		}
	}
}

// ------------
// BatchRequest
// ------------
class BatchRequest {
	constructor() {
		this.requests = new Map();
		this.duplicates = new Map();
	}

	addURL(resourceURL, { asBinary, expectedType, groupDuplicates, baseURI, blockMixedContent } = {}) {
		return new Promise((resolve, reject) => {
			const requestKey = JSON.stringify([resourceURL, asBinary, expectedType, baseURI, blockMixedContent]);
			let resourceRequests = this.requests.get(requestKey);
			if (!resourceRequests) {
				resourceRequests = [];
				this.requests.set(requestKey, resourceRequests);
			}
			const callbacks = { resolve, reject };
			resourceRequests.push(callbacks);
			if (groupDuplicates) {
				let duplicateRequests = this.duplicates.get(requestKey);
				if (!duplicateRequests) {
					duplicateRequests = [];
					this.duplicates.set(requestKey, duplicateRequests);
				}
				duplicateRequests.push(callbacks);
			}
		});
	}

	getMaxResources() {
		return this.requests.size;
	}

	run(onloadListener, options) {
		const resourceURLs = [...this.requests.keys()];
		let indexResource = 0;
		return Promise.all(resourceURLs.map(async requestKey => {
			const [resourceURL, asBinary, expectedType, baseURI, blockMixedContent] = JSON.parse(requestKey);
			const resourceRequests = this.requests.get(requestKey);
			try {
				const currentIndexResource = indexResource;
				indexResource = indexResource + 1;
				const content = await util.getContent(resourceURL, {
					asBinary,
					expectedType,
					maxResourceSize: options.maxResourceSize,
					maxResourceSizeEnabled: options.maxResourceSizeEnabled,
					frameId: options.windowId,
					resourceReferrer: options.resourceReferrer,
					baseURI,
					blockMixedContent,
					acceptHeaders: options.acceptHeaders,
					networkTimeout: options.networkTimeout
				});
				onloadListener({ url: resourceURL });
				if (!this.cancelled) {
					resourceRequests.forEach(callbacks => {
						const duplicateCallbacks = this.duplicates.get(requestKey);
						const duplicate = duplicateCallbacks && duplicateCallbacks.length > 1 && duplicateCallbacks.includes(callbacks);
						callbacks.resolve({ content: content.data, indexResource: currentIndexResource, duplicate });
					});
				}
			} catch (error) {
				indexResource = indexResource + 1;
				onloadListener({ url: resourceURL });
				resourceRequests.forEach(resourceRequest => resourceRequest.reject(error));
			}
			this.requests.delete(requestKey);
		}));
	}

	cancel() {
		this.cancelled = true;
		const resourceURLs = [...this.requests.keys()];
		resourceURLs.forEach(requestKey => {
			const resourceRequests = this.requests.get(requestKey);
			resourceRequests.forEach(callbacks => callbacks.reject());
			this.requests.delete(requestKey);
		});
	}
}

// ---------
// Processor
// ---------
const PREFIXES_FORBIDDEN_DATA_URI = ["data:text/"];
const PREFIX_DATA_URI_IMAGE_SVG = "data:image/svg+xml";
const EMPTY_IMAGE = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
const SCRIPT_TAG_FOUND = /<script/gi;
const NOSCRIPT_TAG_FOUND = /<noscript/gi;
const CANVAS_TAG_FOUND = /<canvas/gi;
const SHADOW_MODE_ATTRIBUTE_NAME = "shadowmode";
const SHADOW_DELEGATE_FOCUS_ATTRIBUTE_NAME = "delegatesfocus";
const SCRIPT_TEMPLATE_SHADOW_ROOT = "data-template-shadow-root";
const UTF8_CHARSET = "utf-8";

class Processor {
	constructor(options, batchRequest) {
		this.options = options;
		this.stats = new Stats(options);
		this.baseURI = normalizeURL(options.baseURI || options.url);
		this.batchRequest = batchRequest;
		this.stylesheets = new Map();
		this.styles = new Map();
		this.cssVariables = new Map();
		this.fontTests = options.fontTests;
	}

	initialize() {
		this.options.saveDate = new Date();
		this.options.saveUrl = this.options.url;
		if (this.options.enableMaff) {
			this.maffMetaDataPromise = this.batchRequest.addURL(util.resolveURL("index.rdf", this.options.baseURI || this.options.url), { expectedType: "document" });
		}
		this.maxResources = this.batchRequest.getMaxResources();
		if (!this.options.saveRawPage && !this.options.removeFrames && this.options.frames) {
			this.options.frames.forEach(frameData => this.maxResources += frameData.maxResources || 0);
		}
		if (!this.options.removeImports && this.options.imports) {
			this.options.imports.forEach(importData => this.maxResources += importData.maxResources || 0);
		}
		this.stats.set("processed", "resources", this.maxResources);
	}

	async loadPage(pageContent, charset) {
		let content;
		if (!pageContent || this.options.saveRawPage) {
			content = await util.getContent(this.baseURI, {
				maxResourceSize: this.options.maxResourceSize,
				maxResourceSizeEnabled: this.options.maxResourceSizeEnabled,
				charset,
				frameId: this.options.windowId,
				resourceReferrer: this.options.resourceReferrer,
				expectedType: "document",
				acceptHeaders: this.options.acceptHeaders,
				networkTimeout: this.options.networkTimeout
			});
			pageContent = content.data;
		}
		this.doc = util.parseDocContent(pageContent, this.baseURI);
		if (this.options.saveRawPage) {
			let charset;
			this.doc.querySelectorAll("meta[charset], meta[http-equiv=\"content-type\"]").forEach(element => {
				const charsetDeclaration = element.content.split(";")[1];
				if (charsetDeclaration && !charset) {
					charset = charsetDeclaration.split("=")[1].trim().toLowerCase();
				}
			});
			if (charset && content.charset && charset.toLowerCase() != content.charset.toLowerCase()) {
				return this.loadPage(pageContent, charset);
			}
		}
		this.workStyleElement = this.doc.createElement("style");
		this.doc.body.appendChild(this.workStyleElement);
		this.onEventAttributeNames = getOnEventAttributeNames(this.doc);
	}

	finalize() {
		if (this.workStyleElement.parentNode) {
			this.workStyleElement.remove();
		}
	}

	async getPageData() {
		util.postProcessDoc(this.doc);
		const url = util.parseURL(this.baseURI);
		if (this.options.insertSingleFileComment) {
			const firstComment = this.doc.documentElement.firstChild;
			let infobarURL = this.options.saveUrl, infobarSaveDate = this.options.saveDate;
			if (firstComment.nodeType == 8 && (firstComment.textContent.includes(util.COMMENT_HEADER_LEGACY) || firstComment.textContent.includes(util.COMMENT_HEADER))) {
				const info = this.doc.documentElement.firstChild.textContent.split("\n");
				try {
					const [, , url, saveDate] = info;
					infobarURL = url.split("url: ")[1];
					infobarSaveDate = saveDate.split("saved date: ")[1];
					firstComment.remove();
				} catch (error) {
					// ignored
				}
			}
			const infobarContent = (this.options.infobarContent || "").replace(/\\n/g, "\n").replace(/\\t/g, "\t");
			const commentNode = this.doc.createComment("\n " + (this.options.useLegacyCommentHeader ? util.COMMENT_HEADER_LEGACY : util.COMMENT_HEADER) +
				" \n url: " + infobarURL +
				" \n saved date: " + infobarSaveDate +
				(infobarContent ? " \n info: " + infobarContent : "") + "\n");
			this.doc.documentElement.insertBefore(commentNode, this.doc.documentElement.firstChild);
		}
		if (this.options.insertCanonicalLink && this.options.saveUrl.match(HTTP_URI_PREFIX)) {
			let canonicalLink = this.doc.querySelector("link[rel=canonical]");
			if (!canonicalLink) {
				canonicalLink = this.doc.createElement("link");
				canonicalLink.setAttribute("rel", "canonical");
				this.doc.head.appendChild(canonicalLink);
			}
			if (canonicalLink && !canonicalLink.href) {
				canonicalLink.href = this.options.saveUrl;
			}
		}
		if (this.options.insertMetaCSP) {
			const metaTag = this.doc.createElement("meta");
			metaTag.httpEquiv = "content-security-policy";
			metaTag.content = "default-src 'none'; font-src 'self' data:; img-src 'self' data:; style-src 'unsafe-inline'; media-src 'self' data:; script-src 'unsafe-inline' data:;";
			this.doc.head.appendChild(metaTag);
		}
		if (this.options.insertMetaNoIndex) {
			let metaElement = this.doc.querySelector("meta[name=robots][content*=noindex]");
			if (!metaElement) {
				metaElement = this.doc.createElement("meta");
				metaElement.setAttribute("name", "robots");
				metaElement.setAttribute("content", "noindex");
				this.doc.head.appendChild(metaElement);
			}
		}
		let size;
		if (this.options.displayStats) {
			size = util.getContentSize(this.doc.documentElement.outerHTML);
		}
		const content = util.serialize(this.doc, this.options.compressHTML);
		if (this.options.displayStats) {
			const contentSize = util.getContentSize(content);
			this.stats.set("processed", "HTML bytes", contentSize);
			this.stats.add("discarded", "HTML bytes", size - contentSize);
		}
		let filename = await ProcessorHelper.evalTemplate(this.options.filenameTemplate, this.options, content) || "";
		const replacementCharacter = this.options.filenameReplacementCharacter;
		filename = util.getValidFilename(filename, this.options.filenameReplacedCharacters, replacementCharacter);
		if (!this.options.backgroundSave) {
			filename = filename.replace(/\//g, replacementCharacter);
		}
		if (!this.options.saveToGDrive && !this.options.saveToGitHub && !this.options.saveWithCompanion &&
			((this.options.filenameMaxLengthUnit == "bytes" && util.getContentSize(filename) > this.options.filenameMaxLength) || (filename.length > this.options.filenameMaxLength))) {
			const extensionMatch = filename.match(/(\.[^.]{3,4})$/);
			const extension = extensionMatch && extensionMatch[0] && extensionMatch[0].length > 1 ? extensionMatch[0] : "";
			filename = this.options.filenameMaxLengthUnit == "bytes" ?
				await util.truncateText(filename, this.options.filenameMaxLength - extension.length) :
				filename.substring(0, this.options.filenameMaxLength - extension.length);
			filename = filename + "…" + extension;
		}
		if (!filename) {
			filename = "Unnamed page";
		}
		const matchTitle = this.baseURI.match(/([^/]*)\/?(\.html?.*)$/) || this.baseURI.match(/\/\/([^/]*)\/?$/);
		const pageData = {
			stats: this.stats.data,
			title: this.options.title || (this.baseURI && matchTitle ? matchTitle[1] : (url.hostname ? url.hostname : "")),
			filename,
			content
		};
		if (this.options.addProof) {
			pageData.hash = await util.digest("SHA-256", content);
		}
		if (this.options.retrieveLinks) {
			pageData.links = Array.from(new Set(Array.from(this.doc.links).map(linkElement => linkElement.href)));
		}
		return pageData;
	}

	preProcessPage() {
		if (this.options.win) {
			this.doc.body.querySelectorAll(":not(svg) title, meta, link[href][rel*=\"icon\"]").forEach(element => element instanceof this.options.win.HTMLElement && this.doc.head.appendChild(element));
		}
		if (this.options.images && !this.options.saveRawPage) {
			this.doc.querySelectorAll("img[" + util.IMAGE_ATTRIBUTE_NAME + "]").forEach(imgElement => {
				const attributeValue = imgElement.getAttribute(util.IMAGE_ATTRIBUTE_NAME);
				if (attributeValue) {
					const imageData = this.options.images[Number(attributeValue)];
					if (imageData) {
						if (this.options.removeHiddenElements && (
							(imageData.size && !imageData.size.pxWidth && !imageData.size.pxHeight) ||
							(imgElement.getAttribute(util.HIDDEN_CONTENT_ATTRIBUTE_NAME) == "")
						)) {
							imgElement.setAttribute("src", EMPTY_IMAGE);
						} else {
							if (imageData.currentSrc) {
								imgElement.dataset.singleFileOriginURL = imgElement.getAttribute("src");
								imgElement.setAttribute("src", imageData.currentSrc);
							}
							if (this.options.loadDeferredImages) {
								if ((!imgElement.getAttribute("src") || imgElement.getAttribute("src") == EMPTY_IMAGE) && imgElement.getAttribute("data-src")) {
									imageData.src = imgElement.dataset.src;
									imgElement.setAttribute("src", imgElement.dataset.src);
									imgElement.removeAttribute("data-src");
								}
							}
						}
					}
				}
			});
			if (this.options.loadDeferredImages) {
				this.doc.querySelectorAll("img[data-srcset]").forEach(imgElement => {
					if (!imgElement.getAttribute("srcset") && imgElement.getAttribute("data-srcset")) {
						imgElement.setAttribute("srcset", imgElement.dataset.srcset);
						imgElement.removeAttribute("data-srcset");
					}
				});
			}
		}
	}

	replaceStyleContents() {
		if (this.options.stylesheets) {
			this.doc.querySelectorAll("style").forEach((styleElement, styleIndex) => {
				const attributeValue = styleElement.getAttribute(util.STYLESHEET_ATTRIBUTE_NAME);
				if (attributeValue) {
					const stylesheetContent = this.options.stylesheets[Number(styleIndex)];
					if (stylesheetContent) {
						styleElement.textContent = stylesheetContent;
					}
				}
			});
		}
	}

	removeUnselectedElements() {
		removeUnmarkedElements(this.doc.body);
		this.doc.body.removeAttribute(util.SELECTED_CONTENT_ATTRIBUTE_NAME);

		function removeUnmarkedElements(element) {
			let selectedElementFound = false;
			Array.from(element.childNodes).forEach(node => {
				if (node.nodeType == 1) {
					const isSelectedElement = node.getAttribute(util.SELECTED_CONTENT_ATTRIBUTE_NAME) == "";
					selectedElementFound = selectedElementFound || isSelectedElement;
					if (isSelectedElement) {
						node.removeAttribute(util.SELECTED_CONTENT_ATTRIBUTE_NAME);
						removeUnmarkedElements(node);
					} else if (selectedElementFound) {
						removeNode(node);
					} else {
						hideNode(node);
					}
				}
			});
		}

		function removeNode(node) {
			if ((node.nodeType != 1 || !node.querySelector("svg,style,link")) && canHideNode(node)) {
				node.remove();
			} else {
				hideNode(node);
			}
		}

		function hideNode(node) {
			if (canHideNode(node)) {
				node.style.setProperty("display", "none", "important");
				Array.from(node.childNodes).forEach(removeNode);
			}
		}

		function canHideNode(node) {
			if (node.nodeType == 1) {
				const tagName = node.tagName && node.tagName.toLowerCase();
				return (tagName != "svg" && tagName != "style" && tagName != "link");
			}
		}
	}

	insertVideoPosters() {
		if (this.options.posters) {
			this.doc.querySelectorAll("video[src], video > source[src]").forEach(element => {
				let videoElement;
				if (element.tagName == "VIDEO") {
					videoElement = element;
				} else {
					videoElement = element.parentElement;
				}
				const attributeValue = element.getAttribute(util.POSTER_ATTRIBUTE_NAME);
				if (attributeValue) {
					const posterURL = this.options.posters[Number(attributeValue)];
					if (!videoElement.poster && posterURL) {
						videoElement.setAttribute("poster", posterURL);
					}
				}
			});
		}
	}

	insertVideoLinks() {
		const LINK_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABAAgMAAADXB5lNAAABhmlDQ1BJQ0MgcHJvZmlsZQAAKJF9kj1Iw0AYht+mSkUrDnYQcchQnSyIijqWKhbBQmkrtOpgcukfNGlIUlwcBdeCgz+LVQcXZ10dXAVB8AfEydFJ0UVK/C4ptIjx4LiH9+59+e67A4RGhalm1wSgapaRisfEbG5VDLyiDwEAvZiVmKkn0osZeI6ve/j4ehfhWd7n/hz9St5kgE8kjjLdsIg3iGc2LZ3zPnGIlSSF+Jx43KACiR+5Lrv8xrnosMAzQ0YmNU8cIhaLHSx3MCsZKvE0cVhRNcoXsi4rnLc4q5Uaa9XJbxjMaytprtMcQRxLSCAJETJqKKMCCxFaNVJMpGg/5uEfdvxJcsnkKoORYwFVqJAcP/gb/O6tWZiadJOCMaD7xbY/RoHALtCs2/b3sW03TwD/M3Cltf3VBjD3SXq9rYWPgIFt4OK6rcl7wOUOMPSkS4bkSH6aQqEAvJ/RM+WAwVv6EGtu31r7OH0AMtSr5Rvg4BAYK1L2use9ezr79u+ZVv9+AFlNcp0UUpiqAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAB3RJTUUH5AsHAB8H+DhhoQAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAJUExURQAAAICHi4qKioTuJAkAAAABdFJOUwBA5thmAAAAAWJLR0QCZgt8ZAAAAJJJREFUOI3t070NRCEMA2CnYAOyDyPwpHj/Va7hJ3FzV7zy3ET5JIwoAF6Jk4wzAJAkzxAYG9YRTgB+24wBgKmfrGAKTcEfAY4KRlRoIeBTgKOCERVaCPgU4Khge2GqKOBTgKOCERVaAEC/4PNcnyoSWHpjqkhwKxbcig0Q6AorXYF/+A6eIYD1lVbwG/jdA6/kA2THRAURVubcAAAAAElFTkSuQmCC";
		const ICON_SIZE = "16px";
		this.doc.querySelectorAll("video").forEach(videoElement => {
			const attributeValue = videoElement.getAttribute(util.VIDEO_ATTRIBUTE_NAME);
			if (attributeValue) {
				const videoData = this.options.videos[Number(attributeValue)];
				const src = videoData.src || videoElement.src;
				if (videoElement && src) {
					const linkElement = this.doc.createElement("a");
					const imgElement = this.doc.createElement("img");
					linkElement.href = src;
					linkElement.target = "_blank";
					linkElement.style.setProperty("z-index", 2147483647, "important");
					linkElement.style.setProperty("position", "absolute", "important");
					linkElement.style.setProperty("top", "8px", "important");
					linkElement.style.setProperty("left", "8px", "important");
					linkElement.style.setProperty("width", ICON_SIZE, "important");
					linkElement.style.setProperty("height", ICON_SIZE, "important");
					linkElement.style.setProperty("min-width", ICON_SIZE, "important");
					linkElement.style.setProperty("min-height", ICON_SIZE, "important");
					linkElement.style.setProperty("max-width", ICON_SIZE, "important");
					linkElement.style.setProperty("max-height", ICON_SIZE, "important");
					imgElement.src = LINK_ICON;
					imgElement.style.setProperty("width", ICON_SIZE, "important");
					imgElement.style.setProperty("height", ICON_SIZE, "important");
					imgElement.style.setProperty("min-width", ICON_SIZE, "important");
					imgElement.style.setProperty("min-height", ICON_SIZE, "important");
					imgElement.style.setProperty("max-width", ICON_SIZE, "important");
					imgElement.style.setProperty("max-height", ICON_SIZE, "important");
					linkElement.appendChild(imgElement);
					videoElement.insertAdjacentElement("afterend", linkElement);
					const positionInlineParent = videoElement.parentNode.style.getPropertyValue("position");
					if ((!videoData.positionParent && (!positionInlineParent || positionInlineParent != "static")) || videoData.positionParent == "static") {
						videoElement.parentNode.style.setProperty("position", "relative", "important");
					}
				}
			}
		});
	}

	removeFrames() {
		const frameElements = this.doc.querySelectorAll("iframe, frame, object[type=\"text/html\"][data]");
		this.stats.set("discarded", "frames", frameElements.length);
		this.stats.set("processed", "frames", frameElements.length);
		this.doc.querySelectorAll("iframe, frame, object[type=\"text/html\"][data]").forEach(element => element.remove());
	}

	removeScripts() {
		this.onEventAttributeNames.forEach(attributeName => this.doc.querySelectorAll("[" + attributeName + "]").forEach(element => element.removeAttribute(attributeName)));
		this.doc.querySelectorAll("[href]").forEach(element => {
			if (element.href && element.href.match && element.href.match(/^\s*javascript:/)) {
				element.setAttribute("href", "");
			}
		});
		this.doc.querySelectorAll("[src]").forEach(element => {
			if (element.src && element.src.match(/^\s*javascript:/)) {
				element.removeAttribute("src");
			}
		});
		const scriptElements = this.doc.querySelectorAll("script:not([type=\"application/ld+json\"]):not([" + SCRIPT_TEMPLATE_SHADOW_ROOT + "])");
		this.stats.set("discarded", "scripts", scriptElements.length);
		this.stats.set("processed", "scripts", scriptElements.length);
		scriptElements.forEach(element => element.remove());
	}

	removeVideoSources() {
		const videoSourceElements = this.doc.querySelectorAll("video[src], video > source");
		this.stats.set("discarded", "video sources", videoSourceElements.length);
		this.stats.set("processed", "video sources", videoSourceElements.length);
		videoSourceElements.forEach(element => {
			if (element.tagName == "SOURCE") {
				element.remove();
			} else {
				videoSourceElements.forEach(element => element.removeAttribute("src"));
			}
		});
	}

	removeAudioSources() {
		const audioSourceElements = this.doc.querySelectorAll("audio[src], audio > source[src]");
		this.stats.set("discarded", "audio sources", audioSourceElements.length);
		this.stats.set("processed", "audio sources", audioSourceElements.length);
		audioSourceElements.forEach(element => {
			if (element.tagName == "SOURCE") {
				element.remove();
			} else {
				audioSourceElements.forEach(element => element.removeAttribute("src"));
			}
		});
	}

	removeDiscardedResources() {
		this.doc.querySelectorAll("." + util.SINGLE_FILE_UI_ELEMENT_CLASS).forEach(element => element.remove());
		const noscriptPlaceholders = new Map();
		this.doc.querySelectorAll("noscript").forEach(noscriptElement => {
			const placeholderElement = this.doc.createElement("div");
			placeholderElement.innerHTML = noscriptElement.dataset.singleFileDisabledNoscript;
			noscriptElement.replaceWith(placeholderElement);
			noscriptPlaceholders.set(placeholderElement, noscriptElement);
		});
		this.doc.querySelectorAll("meta[http-equiv=refresh], meta[disabled-http-equiv]").forEach(element => element.remove());
		Array.from(noscriptPlaceholders).forEach(([placeholderElement, noscriptElement]) => {
			noscriptElement.dataset.singleFileDisabledNoscript = placeholderElement.innerHTML;
			placeholderElement.replaceWith(noscriptElement);
		});
		this.doc.querySelectorAll("meta[http-equiv=\"content-security-policy\"]").forEach(element => element.remove());
		const objectElements = this.doc.querySelectorAll("applet, object[data]:not([type=\"image/svg+xml\"]):not([type=\"image/svg-xml\"]):not([type=\"text/html\"]), embed[src]:not([src*=\".svg\"]):not([src*=\".pdf\"])");
		this.stats.set("discarded", "objects", objectElements.length);
		this.stats.set("processed", "objects", objectElements.length);
		objectElements.forEach(element => element.remove());
		const replacedAttributeValue = this.doc.querySelectorAll("link[rel~=preconnect], link[rel~=prerender], link[rel~=dns-prefetch], link[rel~=preload], link[rel~=manifest], link[rel~=prefetch]");
		replacedAttributeValue.forEach(element => {
			let regExp;
			if (this.options.removeScripts) {
				regExp = /(preconnect|prerender|dns-prefetch|preload|prefetch|manifest)/g;
			} else {
				regExp = /(preconnect|prerender|dns-prefetch|prefetch|manifest)/g;
			}
			const relValue = element.getAttribute("rel").replace(regExp, "").trim();
			if (relValue.length) {
				element.setAttribute("rel", relValue);
			} else {
				element.remove();
			}
		});
		this.doc.querySelectorAll("link[rel*=stylesheet][rel*=alternate][title],link[rel*=stylesheet]:not([href]),link[rel*=stylesheet][href=\"\"]").forEach(element => element.remove());
		if (this.options.removeHiddenElements) {
			this.doc.querySelectorAll("input[type=hidden]").forEach(element => element.remove());
		}
		if (!this.options.saveFavicon) {
			this.doc.querySelectorAll("link[rel*=\"icon\"]").forEach(element => element.remove());
		}
		this.doc.querySelectorAll("a[ping]").forEach(element => element.removeAttribute("ping"));
	}

	resetCharsetMeta() {
		let charset;
		this.doc.querySelectorAll("meta[charset], meta[http-equiv=\"content-type\"]").forEach(element => {
			const charsetDeclaration = element.content.split(";")[1];
			if (charsetDeclaration && !charset) {
				charset = charsetDeclaration.split("=")[1];
				if (charset) {
					this.charset = charset.trim().toLowerCase();
				}
			}
			element.remove();
		});
		const metaElement = this.doc.createElement("meta");
		metaElement.setAttribute("charset", UTF8_CHARSET);
		if (this.doc.head.firstChild) {
			this.doc.head.insertBefore(metaElement, this.doc.head.firstChild);
		} else {
			this.doc.head.appendChild(metaElement);
		}
	}

	setInputValues() {
		this.doc.querySelectorAll("input:not([type=radio]):not([type=checkbox])").forEach(input => {
			const value = input.getAttribute(util.INPUT_VALUE_ATTRIBUTE_NAME);
			input.setAttribute("value", value || "");
		});
		this.doc.querySelectorAll("input[type=radio], input[type=checkbox]").forEach(input => {
			const value = input.getAttribute(util.INPUT_VALUE_ATTRIBUTE_NAME);
			if (value == "true") {
				input.setAttribute("checked", "");
			}
		});
		this.doc.querySelectorAll("textarea").forEach(textarea => {
			const value = textarea.getAttribute(util.INPUT_VALUE_ATTRIBUTE_NAME);
			textarea.textContent = value || "";
		});
		this.doc.querySelectorAll("select").forEach(select => {
			select.querySelectorAll("option").forEach(option => {
				const selected = option.getAttribute(util.INPUT_VALUE_ATTRIBUTE_NAME) != null;
				if (selected) {
					option.setAttribute("selected", "");
				}
			});
		});
	}

	moveStylesInHead() {
		this.doc.querySelectorAll("style").forEach(stylesheet => {
			if (stylesheet.getAttribute(util.STYLE_ATTRIBUTE_NAME) == "") {
				this.doc.head.appendChild(stylesheet);
			}
		});
	}

	saveFavicon() {
		let faviconElement = this.doc.querySelector("link[href][rel=\"icon\"]");
		if (!faviconElement) {
			faviconElement = this.doc.querySelector("link[href][rel=\"shortcut icon\"]");
		}
		if (!faviconElement) {
			faviconElement = this.doc.createElement("link");
			faviconElement.setAttribute("type", "image/x-icon");
			faviconElement.setAttribute("rel", "shortcut icon");
			faviconElement.setAttribute("href", "/favicon.ico");
		}
		this.doc.head.appendChild(faviconElement);
	}

	replaceCanvasElements() {
		if (this.options.canvases) {
			this.doc.querySelectorAll("canvas").forEach(canvasElement => {
				const attributeValue = canvasElement.getAttribute(util.CANVAS_ATTRIBUTE_NAME);
				if (attributeValue) {
					const canvasData = this.options.canvases[Number(attributeValue)];
					if (canvasData) {
						ProcessorHelper.setBackgroundImage(canvasElement, "url(" + canvasData.dataURI + ")");
						this.stats.add("processed", "canvas", 1);
					}
				}
			});
		}
	}

	insertFonts() {
		if (this.options.fonts && this.options.fonts.length) {
			let stylesheetContent = "";
			this.options.fonts.forEach(fontData => {
				if (fontData["font-family"] && fontData.src) {
					stylesheetContent += "@font-face{";
					let stylesContent = "";
					Object.keys(fontData).forEach(fontStyle => {
						if (stylesContent) {
							stylesContent += ";";
						}
						stylesContent += fontStyle + ":" + fontData[fontStyle];
					});
					stylesheetContent += stylesContent + "}";
				}
			});
			if (stylesheetContent) {
				const styleElement = this.doc.createElement("style");
				styleElement.textContent = stylesheetContent;
				const existingStyleElement = this.doc.querySelector("style");
				if (existingStyleElement) {
					existingStyleElement.parentElement.insertBefore(styleElement, existingStyleElement);
				} else {
					this.doc.head.insertBefore(styleElement, this.doc.head.firstChild);
				}
			}
		}
	}

	removeHiddenElements() {
		const hiddenElements = this.doc.querySelectorAll("[" + util.HIDDEN_CONTENT_ATTRIBUTE_NAME + "]");
		const removedElements = this.doc.querySelectorAll("[" + util.REMOVED_CONTENT_ATTRIBUTE_NAME + "]");
		this.stats.set("discarded", "hidden elements", removedElements.length);
		this.stats.set("processed", "hidden elements", removedElements.length);
		if (hiddenElements.length) {
			const styleElement = this.doc.createElement("style");
			styleElement.textContent = ".sf-hidden{display:none!important;}";
			this.doc.head.appendChild(styleElement);
			hiddenElements.forEach(element => {
				if (element.style.getPropertyValue("display") != "none") {
					if (element.style.getPropertyPriority("display") == "important") {
						element.style.setProperty("display", "none", "important");
					} else {
						element.classList.add("sf-hidden");
					}
				}
			});
		}
		removedElements.forEach(element => element.remove());
	}

	resolveHrefs() {
		this.doc.querySelectorAll("a[href], area[href], link[href]").forEach(element => {
			const href = element.getAttribute("href").trim();
			if (element.tagName == "LINK" && element.rel.includes("stylesheet")) {
				if (this.options.saveOriginalURLs && !isDataURL(href)) {
					element.setAttribute("data-sf-original-href", href);
				}
			}
			if (!testIgnoredPath(href)) {
				let resolvedURL;
				try {
					resolvedURL = util.resolveURL(href, this.options.baseURI || this.options.url);
				} catch (error) {
					// ignored
				}
				if (resolvedURL) {
					const url = normalizeURL(this.options.url);
					if (resolvedURL.startsWith(url + "#") && !resolvedURL.startsWith(url + "#!") && !this.options.resolveFragmentIdentifierURLs) {
						resolvedURL = resolvedURL.substring(url.length);
					}
					try {
						element.setAttribute("href", resolvedURL);
					} catch (error) {
						// ignored
					}
				}
			}
		});
	}

	resolveStyleAttributeURLs() {
		this.doc.querySelectorAll("[style]").forEach(element => {
			let styleContent = element.getAttribute("style");
			if (this.options.compressCSS) {
				styleContent = util.compressCSS(styleContent);
			}
			styleContent = ProcessorHelper.resolveStylesheetURLs(styleContent, this.baseURI, this.workStyleElement, this.options.saveOriginalURLs);
			const declarationList = cssTree.parse(styleContent, { context: "declarationList" });
			this.styles.set(element, declarationList);
		});
	}

	async resolveStylesheetURLs() {
		await Promise.all(Array.from(this.doc.querySelectorAll("style, link[rel*=stylesheet]")).map(async element => {
			const options = {
				maxResourceSize: this.options.maxResourceSize,
				maxResourceSizeEnabled: this.options.maxResourceSizeEnabled,
				url: this.options.url,
				charset: this.charset,
				compressCSS: this.options.compressCSS,
				updatedResources: this.options.updatedResources,
				rootDocument: this.options.rootDocument,
				frameId: this.options.windowId,
				resourceReferrer: this.options.resourceReferrer,
				blockMixedContent: this.options.blockMixedContent,
				saveOriginalURLs: this.options.saveOriginalURLs,
				acceptHeaders: this.options.acceptHeaders,
				networkTimeout: this.options.networkTimeout
			};
			let mediaText;
			if (element.media) {
				mediaText = element.media.toLowerCase();
			}
			const stylesheetInfo = { mediaText };
			if (element.closest("[" + SHADOW_MODE_ATTRIBUTE_NAME + "]")) {
				stylesheetInfo.scoped = true;
			}
			if (element.tagName == "LINK" && element.charset) {
				options.charset = element.charset;
			}
			await processElement(element, stylesheetInfo, this.stylesheets, this.baseURI, options, this.workStyleElement);
		}));
		if (this.options.rootDocument) {
			const newResources = Object.keys(this.options.updatedResources).filter(url => this.options.updatedResources[url].type == "stylesheet" && !this.options.updatedResources[url].retrieved).map(url => this.options.updatedResources[url]);
			await Promise.all(newResources.map(async resource => {
				resource.retrieved = true;
				const stylesheetInfo = {};
				const element = this.doc.createElement("style");
				this.doc.body.appendChild(element);
				element.textContent = resource.content;
				await processElement(element, stylesheetInfo, this.stylesheets, this.baseURI, this.options, this.workStyleElement);
			}));
		}

		async function processElement(element, stylesheetInfo, stylesheets, baseURI, options, workStyleElement) {
			stylesheets.set(element, stylesheetInfo);
			let stylesheetContent = await getStylesheetContent(element, baseURI, options, workStyleElement);
			if (!matchCharsetEquals(stylesheetContent, options.charset)) {
				options = Object.assign({}, options, { charset: getCharset(stylesheetContent) });
				stylesheetContent = await getStylesheetContent(element, baseURI, options, workStyleElement);
			}
			let stylesheet;
			try {
				stylesheet = cssTree.parse(removeCssComments(stylesheetContent));
			} catch (error) {
				// ignored
			}
			if (stylesheet && stylesheet.children) {
				if (options.compressCSS) {
					ProcessorHelper.removeSingleLineCssComments(stylesheet);
				}
				stylesheetInfo.stylesheet = stylesheet;
			} else {
				stylesheets.delete(element);
			}
		}

		async function getStylesheetContent(element, baseURI, options, workStyleElement) {
			let content;
			if (element.tagName == "LINK") {
				content = await ProcessorHelper.resolveLinkStylesheetURLs(element.href, baseURI, options, workStyleElement);
			} else {
				content = await ProcessorHelper.resolveImportURLs(element.textContent, baseURI, options, workStyleElement);
			}
			return content || "";
		}
	}

	async resolveFrameURLs() {
		if (!this.options.saveRawPage) {
			const frameElements = Array.from(this.doc.querySelectorAll("iframe, frame, object[type=\"text/html\"][data]"));
			await Promise.all(frameElements.map(async frameElement => {
				if (frameElement.tagName == "OBJECT") {
					frameElement.setAttribute("data", "data:text/html,");
				} else {
					const src = frameElement.getAttribute("src");
					if (this.options.saveOriginalURLs && !isDataURL(src)) {
						frameElement.setAttribute("data-sf-original-src", src);
					}
					frameElement.removeAttribute("src");
					frameElement.removeAttribute("srcdoc");
				}
				Array.from(frameElement.childNodes).forEach(node => node.remove());
				const frameWindowId = frameElement.getAttribute(util.WIN_ID_ATTRIBUTE_NAME);
				if (this.options.frames && frameWindowId) {
					const frameData = this.options.frames.find(frame => frame.windowId == frameWindowId);
					if (frameData) {
						await initializeProcessor(frameData, frameElement, frameWindowId, this.batchRequest, Object.create(this.options));
					}
				}
			}));
		}

		async function initializeProcessor(frameData, frameElement, frameWindowId, batchRequest, options) {
			options.insertSingleFileComment = false;
			options.insertCanonicalLink = false;
			options.insertMetaNoIndex = false;
			options.saveFavicon = false;
			options.url = frameData.baseURI;
			options.windowId = frameWindowId;
			if (frameData.content) {
				options.content = frameData.content;
				options.canvases = frameData.canvases;
				options.fonts = frameData.fonts;
				options.stylesheets = frameData.stylesheets;
				options.images = frameData.images;
				options.posters = frameData.posters;
				options.videos = frameData.videos;
				options.usedFonts = frameData.usedFonts;
				options.shadowRoots = frameData.shadowRoots;
				options.imports = frameData.imports;
				frameData.runner = new Runner(options);
				frameData.frameElement = frameElement;
				await frameData.runner.loadPage();
				await frameData.runner.initialize();
				frameData.maxResources = batchRequest.getMaxResources();
			}
		}
	}

	insertShadowRootContents() {
		const doc = this.doc;
		const options = this.options;
		if (this.options.shadowRoots && this.options.shadowRoots.length) {
			processElement(this.doc);
			if (this.options.removeScripts) {
				this.doc.querySelectorAll("script[" + SCRIPT_TEMPLATE_SHADOW_ROOT + "]").forEach(element => element.remove());
			}
			const scriptElement = doc.createElement("script");
			scriptElement.setAttribute(SCRIPT_TEMPLATE_SHADOW_ROOT, "");
			scriptElement.textContent = `(()=>{document.currentScript.remove();processNode(document);function processNode(node){node.querySelectorAll("template[${SHADOW_MODE_ATTRIBUTE_NAME}]").forEach(element=>{let shadowRoot = element.parentElement.shadowRoot;if (!shadowRoot) {try {shadowRoot=element.parentElement.attachShadow({mode:element.getAttribute("${SHADOW_MODE_ATTRIBUTE_NAME}"),delegatesFocus:Boolean(element.getAttribute("${SHADOW_DELEGATE_FOCUS_ATTRIBUTE_NAME}"))});shadowRoot.innerHTML=element.innerHTML;element.remove()} catch (error) {} if (shadowRoot) {processNode(shadowRoot)}}})}})()`;
			doc.body.appendChild(scriptElement);
		}

		function processElement(element) {
			const shadowRootElements = Array.from((element.querySelectorAll("[" + util.SHADOW_ROOT_ATTRIBUTE_NAME + "]")));
			shadowRootElements.forEach(element => {
				const attributeValue = element.getAttribute(util.SHADOW_ROOT_ATTRIBUTE_NAME);
				if (attributeValue) {
					const shadowRootData = options.shadowRoots[Number(attributeValue)];
					if (shadowRootData) {
						const templateElement = doc.createElement("template");
						templateElement.setAttribute(SHADOW_MODE_ATTRIBUTE_NAME, shadowRootData.mode);
						if (shadowRootData.delegatesFocus) {
							templateElement.setAttribute(SHADOW_DELEGATE_FOCUS_ATTRIBUTE_NAME, "");
						}
						if (shadowRootData.adoptedStyleSheets) {
							shadowRootData.adoptedStyleSheets.forEach(stylesheetContent => {
								const styleElement = doc.createElement("style");
								styleElement.textContent = stylesheetContent;
								templateElement.appendChild(styleElement);
							});
						}
						const shadowDoc = util.parseDocContent(shadowRootData.content);
						if (shadowDoc.head) {
							const metaCharset = shadowDoc.head.querySelector("meta[charset]");
							if (metaCharset) {
								metaCharset.remove();
							}
							shadowDoc.head.childNodes.forEach(node => templateElement.appendChild(shadowDoc.importNode(node, true)));
						}
						if (shadowDoc.body) {
							shadowDoc.body.childNodes.forEach(node => templateElement.appendChild(shadowDoc.importNode(node, true)));
						}
						processElement(templateElement);
						if (element.firstChild) {
							element.insertBefore(templateElement, element.firstChild);
						} else {
							element.appendChild(templateElement);
						}
					}
				}
			});
		}
	}

	async resolveHtmlImportURLs() {
		const linkElements = Array.from(this.doc.querySelectorAll("link[rel=import][href]"));
		await Promise.all(linkElements.map(async linkElement => {
			const resourceURL = linkElement.href;
			if (this.options.saveOriginalURLs && !isDataURL(resourceURL)) {
				linkElement.setAttribute("data-sf-original-href", resourceURL);
			}
			linkElement.removeAttribute("href");
			const options = Object.create(this.options);
			options.insertSingleFileComment = false;
			options.insertCanonicalLink = false;
			options.insertMetaNoIndex = false;
			options.saveFavicon = false;
			options.removeUnusedStyles = false;
			options.removeAlternativeMedias = false;
			options.removeUnusedFonts = false;
			options.removeHiddenElements = false;
			options.url = resourceURL;
			const attributeValue = linkElement.getAttribute(util.HTML_IMPORT_ATTRIBUTE_NAME);
			if (attributeValue) {
				const importData = options.imports[Number(attributeValue)];
				if (importData) {
					options.content = importData.content;
					importData.runner = new Runner(options);
					await importData.runner.loadPage();
					await importData.runner.initialize();
					if (!options.removeImports) {
						importData.maxResources = importData.runner.batchRequest.getMaxResources();
					}
					importData.runner.getStyleSheets().forEach(stylesheet => {
						const importedStyleElement = this.doc.createElement("style");
						linkElement.insertAdjacentElement("afterEnd", importedStyleElement);
						this.stylesheets.set(importedStyleElement, stylesheet);
					});
				}
			}
			if (options.removeImports) {
				linkElement.remove();
				this.stats.add("discarded", "HTML imports", 1);
			}
		}));
	}

	removeUnusedStyles() {
		if (!this.mediaAllInfo) {
			this.mediaAllInfo = util.getMediaAllInfo(this.doc, this.stylesheets, this.styles);
		}
		const stats = util.minifyCSSRules(this.stylesheets, this.styles, this.mediaAllInfo);
		this.stats.set("processed", "CSS rules", stats.processed);
		this.stats.set("discarded", "CSS rules", stats.discarded);
	}

	removeUnusedFonts() {
		util.removeUnusedFonts(this.doc, this.stylesheets, this.styles, this.options);
	}

	removeAlternativeMedias() {
		const stats = util.minifyMedias(this.stylesheets);
		this.stats.set("processed", "medias", stats.processed);
		this.stats.set("discarded", "medias", stats.discarded);
	}

	async processStylesheets() {
		this.options.fontDeclarations = new Map();
		await Promise.all([...this.stylesheets].map(([, stylesheetInfo]) =>
			ProcessorHelper.processStylesheet(stylesheetInfo.stylesheet.children, this.baseURI, this.options, this.cssVariables, this.batchRequest)
		));
	}

	async processStyleAttributes() {
		return Promise.all([...this.styles].map(([, declarationList]) =>
			ProcessorHelper.processStyle(declarationList.children.toArray(), this.baseURI, this.options, this.cssVariables, this.batchRequest)
		));
	}

	async processPageResources() {
		const processAttributeArgs = [
			["link[href][rel*=\"icon\"]", "href", false, true],
			["object[type=\"image/svg+xml\"], object[type=\"image/svg-xml\"]", "data"],
			["img[src], input[src][type=image]", "src", true],
			["embed[src*=\".svg\"], embed[src*=\".pdf\"]", "src"],
			["video[poster]", "poster"],
			["*[background]", "background"],
			["image", "xlink:href"],
			["image", "href"]
		];
		let resourcePromises = processAttributeArgs.map(([selector, attributeName, processDuplicates, removeElementIfMissing]) =>
			ProcessorHelper.processAttribute(this.doc.querySelectorAll(selector), attributeName, this.baseURI, this.options, "image", this.cssVariables, this.styles, this.batchRequest, processDuplicates, removeElementIfMissing)
		);
		resourcePromises = resourcePromises.concat([
			ProcessorHelper.processXLinks(this.doc.querySelectorAll("use"), this.doc, this.baseURI, this.options, this.batchRequest),
			ProcessorHelper.processSrcset(this.doc.querySelectorAll("img[srcset], source[srcset]"), "srcset", this.baseURI, this.batchRequest)
		]);
		if (!this.options.removeAudioSrc) {
			resourcePromises.push(ProcessorHelper.processAttribute(this.doc.querySelectorAll("audio[src], audio > source[src]"), "src", this.baseURI, this.options, "audio", this.cssVariables, this.styles, this.batchRequest));
		}
		if (!this.options.removeVideoSrc) {
			resourcePromises.push(ProcessorHelper.processAttribute(this.doc.querySelectorAll("video[src], video > source[src]"), "src", this.baseURI, this.options, "video", this.cssVariables, this.styles, this.batchRequest));
		}
		await Promise.all(resourcePromises);
		if (this.options.saveFavicon) {
			ProcessorHelper.processShortcutIcons(this.doc);
		}
	}

	async processScripts() {
		await Promise.all(Array.from(this.doc.querySelectorAll("script[src], link[rel=preload][as=script][href]")).map(async element => {
			let resourceURL;
			let scriptSrc;
			if (element.tagName == "SCRIPT") {
				scriptSrc = element.getAttribute("src");
				if (this.options.saveOriginalURLs && !isDataURL(scriptSrc)) {
					element.setAttribute("data-sf-original-src", scriptSrc);
				}
			} else {
				scriptSrc = element.getAttribute("href");
				if (this.options.saveOriginalURLs && !isDataURL(scriptSrc)) {
					element.setAttribute("data-sf-original-href", scriptSrc);
				}
			}
			element.removeAttribute("integrity");
			element.textContent = "";
			try {
				resourceURL = util.resolveURL(scriptSrc, this.baseURI);
			} catch (error) {
				// ignored
			}
			if (testValidURL(resourceURL)) {
				if (element.tagName == "SCRIPT") {
					element.removeAttribute("src");
				} else {
					element.removeAttribute("href");
				}
				this.stats.add("processed", "scripts", 1);
				const content = await util.getContent(resourceURL, {
					asBinary: true,
					charset: this.charset != UTF8_CHARSET && this.charset,
					maxResourceSize: this.options.maxResourceSize,
					maxResourceSizeEnabled: this.options.maxResourceSizeEnabled,
					frameId: this.options.windowId,
					resourceReferrer: this.options.resourceReferrer,
					baseURI: this.options.baseURI,
					blockMixedContent: this.options.blockMixedContent,
					expectedType: "script",
					acceptHeaders: this.options.acceptHeaders,
					networkTimeout: this.options.networkTimeout
				});
				content.data = getUpdatedResourceContent(resourceURL, content, this.options);
				if (element.tagName == "SCRIPT") {
					element.setAttribute("src", content.data);
					if (element.getAttribute("async") == "" || element.getAttribute("async") == "async" || element.getAttribute(util.ASYNC_SCRIPT_ATTRIBUTE_NAME) == "") {
						element.setAttribute("async", "");
					}
				} else {
					const scriptElement = this.doc.createElement("script");
					scriptElement.setAttribute("src", content.data);
					scriptElement.setAttribute("async", "");
					element.parentElement.replaceChild(scriptElement, element);
				}
			}
		}));
	}

	removeAlternativeImages() {
		util.removeAlternativeImages(this.doc);
	}

	async removeAlternativeFonts() {
		await util.removeAlternativeFonts(this.doc, this.stylesheets, this.options.fontDeclarations, this.options.fontTests);
	}

	async processFrames() {
		if (this.options.frames) {
			const frameElements = Array.from(this.doc.querySelectorAll("iframe, frame, object[type=\"text/html\"][data]"));
			await Promise.all(frameElements.map(async frameElement => {
				const frameWindowId = frameElement.getAttribute(util.WIN_ID_ATTRIBUTE_NAME);
				if (frameWindowId) {
					const frameData = this.options.frames.find(frame => frame.windowId == frameWindowId);
					if (frameData) {
						this.options.frames = this.options.frames.filter(frame => frame.windowId != frameWindowId);
						if (frameData.runner && frameElement.getAttribute(util.HIDDEN_FRAME_ATTRIBUTE_NAME) != "") {
							this.stats.add("processed", "frames", 1);
							await frameData.runner.run();
							const pageData = await frameData.runner.getPageData();
							frameElement.removeAttribute(util.WIN_ID_ATTRIBUTE_NAME);
							let sandbox = "allow-popups allow-top-navigation allow-top-navigation-by-user-activation";
							if (pageData.content.match(NOSCRIPT_TAG_FOUND) || pageData.content.match(CANVAS_TAG_FOUND) || pageData.content.match(SCRIPT_TAG_FOUND)) {
								sandbox += " allow-scripts allow-same-origin";
							}
							frameElement.setAttribute("sandbox", sandbox);
							if (frameElement.tagName == "OBJECT") {
								frameElement.setAttribute("data", "data:text/html," + pageData.content);
							} else {
								if (frameElement.tagName == "FRAME") {
									frameElement.setAttribute("src", "data:text/html," + pageData.content.replace(/%/g, "%25").replace(/#/g, "%23"));
								} else {
									frameElement.setAttribute("srcdoc", pageData.content);
									frameElement.removeAttribute("src");
								}
							}
							this.stats.addAll(pageData);
						} else {
							frameElement.removeAttribute(util.WIN_ID_ATTRIBUTE_NAME);
							this.stats.add("discarded", "frames", 1);
						}
					}
				}
			}));
		}
	}

	async processHtmlImports() {
		const linkElements = Array.from(this.doc.querySelectorAll("link[rel=import]"));
		await Promise.all(linkElements.map(async linkElement => {
			const attributeValue = linkElement.getAttribute(util.HTML_IMPORT_ATTRIBUTE_NAME);
			if (attributeValue) {
				const importData = this.options.imports[Number(attributeValue)];
				if (importData.runner) {
					this.stats.add("processed", "HTML imports", 1);
					await importData.runner.run();
					const pageData = await importData.runner.getPageData();
					linkElement.removeAttribute(util.HTML_IMPORT_ATTRIBUTE_NAME);
					linkElement.setAttribute("href", "data:text/html," + pageData.content);
					this.stats.addAll(pageData);
				} else {
					this.stats.add("discarded", "HTML imports", 1);
				}
			}
		}));
	}

	replaceStylesheets() {
		this.doc.querySelectorAll("style").forEach(styleElement => {
			const stylesheetInfo = this.stylesheets.get(styleElement);
			if (stylesheetInfo) {
				this.stylesheets.delete(styleElement);
				let stylesheetContent = cssTree.generate(stylesheetInfo.stylesheet);
				if (this.options.saveOriginalURLs) {
					stylesheetContent = replaceOriginalURLs(stylesheetContent);
				}
				styleElement.textContent = stylesheetContent;
				if (stylesheetInfo.mediaText) {
					styleElement.media = stylesheetInfo.mediaText;
				}
			} else {
				styleElement.remove();
			}
		});
		this.doc.querySelectorAll("link[rel*=stylesheet]").forEach(linkElement => {
			const stylesheetInfo = this.stylesheets.get(linkElement);
			if (stylesheetInfo) {
				this.stylesheets.delete(linkElement);
				const styleElement = this.doc.createElement("style");
				if (stylesheetInfo.mediaText) {
					styleElement.media = stylesheetInfo.mediaText;
				}
				let stylesheetContent = cssTree.generate(stylesheetInfo.stylesheet);
				if (this.options.saveOriginalURLs) {
					stylesheetContent = replaceOriginalURLs(stylesheetContent);
					styleElement.setAttribute("data-sf-original-href", linkElement.getAttribute("data-sf-original-href"));
				}
				styleElement.textContent = stylesheetContent;
				linkElement.parentElement.replaceChild(styleElement, linkElement);
			} else {
				linkElement.remove();
			}
		});
	}

	replaceStyleAttributes() {
		this.doc.querySelectorAll("[style]").forEach(element => {
			const declarations = this.styles.get(element);
			if (declarations) {
				this.styles.delete(element);
				let styleContent = cssTree.generate(declarations);
				if (this.options.saveOriginalURLs) {
					styleContent = replaceOriginalURLs(styleContent);
				}
				element.setAttribute("style", styleContent);
			} else {
				element.setAttribute("style", "");
			}
		});
	}

	insertVariables() {
		if (this.cssVariables.size) {
			const styleElement = this.doc.createElement("style");
			const firstStyleElement = this.doc.head.querySelector("style");
			if (firstStyleElement) {
				this.doc.head.insertBefore(styleElement, firstStyleElement);
			} else {
				this.doc.head.appendChild(styleElement);
			}
			let stylesheetContent = "";
			this.cssVariables.forEach(({ content, url }, indexResource) => {
				this.cssVariables.delete(indexResource);
				if (stylesheetContent) {
					stylesheetContent += ";";
				}
				stylesheetContent += `${SINGLE_FILE_VARIABLE_NAME_PREFIX + indexResource}: `;
				if (this.options.saveOriginalURLs) {
					stylesheetContent += `/* original URL: ${url} */ `;
				}
				stylesheetContent += `url("${content}")`;
			});
			styleElement.textContent = ":root{" + stylesheetContent + "}";
		}
	}

	compressHTML() {
		let size;
		if (this.options.displayStats) {
			size = util.getContentSize(this.doc.documentElement.outerHTML);
		}
		util.minifyHTML(this.doc, { PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME: util.PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME });
		if (this.options.displayStats) {
			this.stats.add("discarded", "HTML bytes", size - util.getContentSize(this.doc.documentElement.outerHTML));
		}
	}

	cleanupPage() {
		this.doc.querySelectorAll("base").forEach(element => element.remove());
		const metaCharset = this.doc.head.querySelector("meta[charset]");
		if (metaCharset) {
			this.doc.head.insertBefore(metaCharset, this.doc.head.firstChild);
			if (this.doc.head.querySelectorAll("*").length == 1 && this.doc.body.childNodes.length == 0) {
				this.doc.head.querySelector("meta[charset]").remove();
			}
		}
	}

	resetZoomLevel() {
		const transform = this.doc.documentElement.style.getPropertyValue("-sf-transform");
		const transformPriority = this.doc.documentElement.style.getPropertyPriority("-sf-transform");
		const transformOrigin = this.doc.documentElement.style.getPropertyValue("-sf-transform-origin");
		const transformOriginPriority = this.doc.documentElement.style.getPropertyPriority("-sf-transform-origin");
		const minHeight = this.doc.documentElement.style.getPropertyValue("-sf-min-height");
		const minHeightPriority = this.doc.documentElement.style.getPropertyPriority("-sf-min-height");
		this.doc.documentElement.style.setProperty("transform", transform, transformPriority);
		this.doc.documentElement.style.setProperty("transform-origin", transformOrigin, transformOriginPriority);
		this.doc.documentElement.style.setProperty("min-height", minHeight, minHeightPriority);
		this.doc.documentElement.style.removeProperty("-sf-transform");
		this.doc.documentElement.style.removeProperty("-sf-transform-origin");
		this.doc.documentElement.style.removeProperty("-sf-min-height");
	}

	async insertMAFFMetaData() {
		const maffMetaData = await this.maffMetaDataPromise;
		if (maffMetaData && maffMetaData.content) {
			const NAMESPACE_RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
			const maffDoc = util.parseXMLContent(maffMetaData.content);
			const originalURLElement = maffDoc.querySelector("RDF > Description > originalurl");
			const archiveTimeElement = maffDoc.querySelector("RDF > Description > archivetime");
			if (originalURLElement) {
				this.options.saveUrl = originalURLElement.getAttributeNS(NAMESPACE_RDF, "resource");
			}
			if (archiveTimeElement) {
				const value = archiveTimeElement.getAttributeNS(NAMESPACE_RDF, "resource");
				if (value) {
					const date = new Date(value);
					if (!isNaN(date.getTime())) {
						this.options.saveDate = new Date(value);
					}
				}
			}
		}
	}

	async setDocInfo() {
		const titleElement = this.doc.querySelector("title");
		const descriptionElement = this.doc.querySelector("meta[name=description]");
		const authorElement = this.doc.querySelector("meta[name=author]");
		const creatorElement = this.doc.querySelector("meta[name=creator]");
		const publisherElement = this.doc.querySelector("meta[name=publisher]");
		const headingElement = this.doc.querySelector("h1");
		this.options.title = titleElement ? titleElement.textContent.trim() : "";
		this.options.info = {
			description: descriptionElement && descriptionElement.content ? descriptionElement.content.trim() : "",
			lang: this.doc.documentElement.lang,
			author: authorElement && authorElement.content ? authorElement.content.trim() : "",
			creator: creatorElement && creatorElement.content ? creatorElement.content.trim() : "",
			publisher: publisherElement && publisherElement.content ? publisherElement.content.trim() : "",
			heading: headingElement && headingElement.textContent ? headingElement.textContent.trim() : ""
		};
		this.options.infobarContent = await ProcessorHelper.evalTemplate(this.options.infobarTemplate, this.options, null, true);
	}
}

// ---------------
// ProcessorHelper
// ---------------
const DATA_URI_PREFIX = "data:";
const ABOUT_BLANK_URI = "about:blank";
const EMPTY_DATA_URI = "data:null;base64,";
const REGEXP_URL_HASH = /(#.+?)$/;
const SINGLE_FILE_VARIABLE_NAME_PREFIX = "--sf-img-";
const SINGLE_FILE_VARIABLE_MAX_SIZE = 512 * 1024;

class ProcessorHelper {
	static async evalTemplate(template = "", options, content, dontReplaceSlash) {
		const url = util.parseURL(options.saveUrl);
		template = await evalTemplateVariable(template, "page-title", () => options.title || "No title", dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "page-heading", () => options.info.heading || "No heading", dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "page-language", () => options.info.lang || "No language", dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "page-description", () => options.info.description || "No description", dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "page-author", () => options.info.author || "No author", dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "page-creator", () => options.info.creator || "No creator", dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "page-publisher", () => options.info.publisher || "No publisher", dontReplaceSlash, options.filenameReplacementCharacter);
		await evalDate(options.saveDate);
		await evalDate(options.visitDate, "visit-");
		template = await evalTemplateVariable(template, "url-hash", () => url.hash.substring(1) || "No hash", dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "url-host", () => url.host.replace(/\/$/, "") || "No host", dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "url-hostname", () => url.hostname.replace(/\/$/, "") || "No hostname", dontReplaceSlash, options.filenameReplacementCharacter);
		const urlHref = decode(url.href);
		template = await evalTemplateVariable(template, "url-href", () => urlHref || "No href", dontReplaceSlash === undefined ? true : dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "url-href-digest-sha-1", urlHref ? async () => util.digest("SHA-1", urlHref) : "No href", dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "url-href-flat", () => decode(url.href) || "No href", false, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "url-referrer", () => decode(options.referrer) || "No referrer", dontReplaceSlash === undefined ? true : dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "url-referrer-flat", () => decode(options.referrer) || "No referrer", false, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "url-password", () => url.password || "No password", dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "url-pathname", () => decode(url.pathname).replace(/^\//, "").replace(/\/$/, "") || "No pathname", dontReplaceSlash === undefined ? true : dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "url-pathname-flat", () => decode(url.pathname) || "No pathname", false, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "url-port", () => url.port || "No port", dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "url-protocol", () => url.protocol || "No protocol", dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "url-search", () => url.search.substring(1) || "No search", dontReplaceSlash, options.filenameReplacementCharacter);
		const params = url.search.substring(1).split("&").map(parameter => parameter.split("="));
		for (const [name, value] of params) {
			template = await evalTemplateVariable(template, "url-search-" + name, () => value || "", dontReplaceSlash, options.filenameReplacementCharacter);
		}
		template = template.replace(/{\s*url-search-[^}\s]*\s*}/gi, "");
		template = await evalTemplateVariable(template, "url-username", () => url.username || "No username", dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "tab-id", () => String(options.tabId || "No tab id"), dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "tab-index", () => String(options.tabIndex || "No tab index"), dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "url-last-segment", () => decode(getLastSegment(url, options.filenameReplacementCharacter)) || "No last segment", dontReplaceSlash, options.filenameReplacementCharacter);
		if (content) {
			template = await evalTemplateVariable(template, "digest-sha-256", async () => util.digest("SHA-256", content), dontReplaceSlash, options.filenameReplacementCharacter);
			template = await evalTemplateVariable(template, "digest-sha-384", async () => util.digest("SHA-384", content), dontReplaceSlash, options.filenameReplacementCharacter);
			template = await evalTemplateVariable(template, "digest-sha-512", async () => util.digest("SHA-512", content), dontReplaceSlash, options.filenameReplacementCharacter);
		}
		const bookmarkFolder = (options.bookmarkFolders && options.bookmarkFolders.join("/")) || "";
		template = await evalTemplateVariable(template, "bookmark-pathname", () => bookmarkFolder, dontReplaceSlash === undefined ? true : dontReplaceSlash, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "bookmark-pathname-flat", () => bookmarkFolder, false, options.filenameReplacementCharacter);
		template = await evalTemplateVariable(template, "profile-name", () => options.profileName, dontReplaceSlash, options.filenameReplacementCharacter);
		return template.trim();

		function decode(value) {
			try {
				return decodeURI(value);
			} catch (error) {
				return value;
			}
		}

		async function evalDate(date, prefix = "") {
			if (date) {
				template = await evalTemplateVariable(template, prefix + "datetime-iso", () => date.toISOString(), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "date-iso", () => date.toISOString().split("T")[0], dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "time-iso", () => date.toISOString().split("T")[1].split("Z")[0], dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "date-locale", () => date.toLocaleDateString(), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "time-locale", () => date.toLocaleTimeString(), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "day-locale", () => String(date.getDate()).padStart(2, "0"), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "month-locale", () => String(date.getMonth() + 1).padStart(2, "0"), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "year-locale", () => String(date.getFullYear()), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "datetime-locale", () => date.toLocaleString(), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "datetime-utc", () => date.toUTCString(), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "day-utc", () => String(date.getUTCDate()).padStart(2, "0"), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "month-utc", () => String(date.getUTCMonth() + 1).padStart(2, "0"), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "year-utc", () => String(date.getUTCFullYear()), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "hours-locale", () => String(date.getHours()).padStart(2, "0"), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "minutes-locale", () => String(date.getMinutes()).padStart(2, "0"), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "seconds-locale", () => String(date.getSeconds()).padStart(2, "0"), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "hours-utc", () => String(date.getUTCHours()).padStart(2, "0"), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "minutes-utc", () => String(date.getUTCMinutes()).padStart(2, "0"), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "seconds-utc", () => String(date.getUTCSeconds()).padStart(2, "0"), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await evalTemplateVariable(template, prefix + "time-ms", () => String(date.getTime()), dontReplaceSlash, options.filenameReplacementCharacter);
			}
		}
	}

	static setBackgroundImage(element, url, style) {
		element.style.setProperty("background-blend-mode", "normal", "important");
		element.style.setProperty("background-clip", "content-box", "important");
		element.style.setProperty("background-position", style && style["background-position"] ? style["background-position"] : "center", "important");
		element.style.setProperty("background-color", style && style["background-color"] ? style["background-color"] : "transparent", "important");
		element.style.setProperty("background-image", url, "important");
		element.style.setProperty("background-size", style && style["background-size"] ? style["background-size"] : "100% 100%", "important");
		element.style.setProperty("background-origin", "content-box", "important");
		element.style.setProperty("background-repeat", "no-repeat", "important");
	}

	static processShortcutIcons(doc) {
		let shortcutIcon = findShortcutIcon(Array.from(doc.querySelectorAll("link[href][rel=\"icon\"], link[href][rel=\"shortcut icon\"]")));
		if (!shortcutIcon) {
			shortcutIcon = findShortcutIcon(Array.from(doc.querySelectorAll("link[href][rel*=\"icon\"]")));
			if (shortcutIcon) {
				shortcutIcon.rel = "icon";
			}
		}
		if (shortcutIcon) {
			doc.querySelectorAll("link[href][rel*=\"icon\"]").forEach(linkElement => {
				if (linkElement != shortcutIcon) {
					linkElement.remove();
				}
			});
		}
	}

	static removeSingleLineCssComments(stylesheet) {
		const removedRules = [];
		for (let cssRule = stylesheet.children.head; cssRule; cssRule = cssRule.next) {
			const ruleData = cssRule.data;
			if (ruleData.type == "Raw" && ruleData.value && ruleData.value.trim().startsWith("//")) {
				removedRules.push(cssRule);
			}
		}
		removedRules.forEach(cssRule => stylesheet.children.remove(cssRule));
	}

	static async resolveImportURLs(stylesheetContent, baseURI, options, workStylesheet, importedStyleSheets = new Set()) {
		stylesheetContent = ProcessorHelper.resolveStylesheetURLs(stylesheetContent, baseURI, workStylesheet, options.saveOriginalURLs);
		const imports = getImportFunctions(stylesheetContent);
		await Promise.all(imports.map(async cssImport => {
			const match = matchImport(cssImport);
			if (match) {
				const regExpCssImport = getRegExp(cssImport);
				let resourceURL = normalizeURL(match.resourceURL);
				if (!testIgnoredPath(resourceURL) && testValidPath(resourceURL)) {
					try {
						resourceURL = util.resolveURL(match.resourceURL, baseURI);
					} catch (error) {
						// ignored
					}
					if (testValidURL(resourceURL) && !importedStyleSheets.has(resourceURL)) {
						const content = await getStylesheetContent(resourceURL);
						resourceURL = content.resourceURL;
						content.data = getUpdatedResourceContent(resourceURL, content, options);
						if (content.data && content.data.match(/^<!doctype /i)) {
							content.data = "";
						}
						let importedStylesheetContent = removeCssComments(content.data);
						if (options.compressCSS) {
							importedStylesheetContent = util.compressCSS(importedStylesheetContent);
						}
						importedStylesheetContent = wrapMediaQuery(importedStylesheetContent, match.media);
						if (stylesheetContent.includes(cssImport)) {
							const ancestorStyleSheets = new Set(importedStyleSheets);
							ancestorStyleSheets.add(resourceURL);
							importedStylesheetContent = await ProcessorHelper.resolveImportURLs(importedStylesheetContent, resourceURL, options, workStylesheet, ancestorStyleSheets);
							workStylesheet.textContent = importedStylesheetContent;
							if ((workStylesheet.sheet && workStylesheet.sheet.cssRules.length) || (!workStylesheet.sheet && importedStylesheetContent)) {
								stylesheetContent = stylesheetContent.replace(regExpCssImport, importedStylesheetContent);
							} else {
								stylesheetContent = stylesheetContent.replace(regExpCssImport, "");
							}
						}
					} else {
						stylesheetContent = stylesheetContent.replace(regExpCssImport, "");
					}
				} else {
					stylesheetContent = stylesheetContent.replace(regExpCssImport, "");
				}
			}
		}));
		return stylesheetContent;

		async function getStylesheetContent(resourceURL) {
			const content = await util.getContent(resourceURL, {
				maxResourceSize: options.maxResourceSize,
				maxResourceSizeEnabled: options.maxResourceSizeEnabled,
				validateTextContentType: true,
				frameId: options.frameId,
				charset: options.charset,
				resourceReferrer: options.resourceReferrer,
				baseURI: options.baseURI,
				blockMixedContent: options.blockMixedContent,
				expectedType: "stylesheet",
				acceptHeaders: options.acceptHeaders,
				networkTimeout: options.networkTimeout
			});
			if (!(matchCharsetEquals(content.data, content.charset) || matchCharsetEquals(content.data, options.charset))) {
				options = Object.assign({}, options, { charset: getCharset(content.data) });
				return util.getContent(resourceURL, {
					maxResourceSize: options.maxResourceSize,
					maxResourceSizeEnabled: options.maxResourceSizeEnabled,
					validateTextContentType: true,
					frameId: options.frameId,
					charset: options.charset,
					resourceReferrer: options.resourceReferrer,
					baseURI: options.baseURI,
					blockMixedContent: options.blockMixedContent,
					expectedType: "stylesheet",
					acceptHeaders: options.acceptHeaders,
					networkTimeout: options.networkTimeout
				});
			} else {
				return content;
			}
		}
	}

	static resolveStylesheetURLs(stylesheetContent, baseURI, workStylesheet, saveOriginalURLs) {
		const urlFunctions = getUrlFunctions(stylesheetContent, true);
		if (saveOriginalURLs) {
			stylesheetContent = addOriginalURLs(stylesheetContent);
		}
		urlFunctions.map(urlFunction => {
			const originalResourceURL = matchURL(urlFunction);
			let resourceURL = normalizeURL(originalResourceURL);
			workStylesheet.textContent = "tmp { content:\"" + resourceURL + "\"}";
			if (workStylesheet.sheet && workStylesheet.sheet.cssRules) {
				resourceURL = util.removeQuotes(workStylesheet.sheet.cssRules[0].style.getPropertyValue("content"));
			}
			if (!testIgnoredPath(resourceURL)) {
				if (!resourceURL || testValidPath(resourceURL)) {
					let resolvedURL;
					if (!originalResourceURL.startsWith("#")) {
						try {
							resolvedURL = util.resolveURL(resourceURL, baseURI);
						} catch (error) {
							// ignored
						}
					}
					if (testValidURL(resolvedURL) && originalResourceURL != resolvedURL && stylesheetContent.includes(urlFunction)) {
						try {
							stylesheetContent = stylesheetContent.replace(getRegExp(urlFunction), originalResourceURL ? urlFunction.replace(originalResourceURL, resolvedURL) : "url(" + resolvedURL + ")");
						} catch (error) {
							// ignored
						}
					}
				} else {
					let newUrlFunction;
					if (originalResourceURL) {
						newUrlFunction = urlFunction.replace(originalResourceURL, EMPTY_DATA_URI);
					} else {
						newUrlFunction = "url(" + EMPTY_DATA_URI + ")";
					}
					stylesheetContent = stylesheetContent.replace(getRegExp(urlFunction), newUrlFunction);
				}
			}
		});
		return stylesheetContent;
	}

	static async resolveLinkStylesheetURLs(resourceURL, baseURI, options, workStylesheet) {
		resourceURL = normalizeURL(resourceURL);
		if (resourceURL && resourceURL != baseURI && resourceURL != ABOUT_BLANK_URI) {
			const content = await util.getContent(resourceURL, {
				maxResourceSize: options.maxResourceSize,
				maxResourceSizeEnabled: options.maxResourceSizeEnabled,
				charset: options.charset,
				frameId: options.frameId,
				resourceReferrer: options.resourceReferrer,
				validateTextContentType: true,
				baseURI: baseURI,
				blockMixedContent: options.blockMixedContent,
				expectedType: "stylesheet",
				acceptHeaders: options.acceptHeaders,
				networkTimeout: options.networkTimeout
			});
			if (!(matchCharsetEquals(content.data, content.charset) || matchCharsetEquals(content.data, options.charset))) {
				options = Object.assign({}, options, { charset: getCharset(content.data) });
				return ProcessorHelper.resolveLinkStylesheetURLs(resourceURL, baseURI, options, workStylesheet);
			}
			resourceURL = content.resourceURL;
			content.data = getUpdatedResourceContent(content.resourceURL, content, options);
			if (content.data && content.data.match(/^<!doctype /i)) {
				content.data = "";
			}
			let stylesheetContent = removeCssComments(content.data);
			if (options.compressCSS) {
				stylesheetContent = util.compressCSS(stylesheetContent);
			}
			stylesheetContent = await ProcessorHelper.resolveImportURLs(stylesheetContent, resourceURL, options, workStylesheet);
			return stylesheetContent;
		}
	}

	static async processStylesheet(cssRules, baseURI, options, cssVariables, batchRequest) {
		const promises = [];
		const removedRules = [];
		for (let cssRule = cssRules.head; cssRule; cssRule = cssRule.next) {
			const ruleData = cssRule.data;
			if (ruleData.type == "Atrule" && ruleData.name == "charset") {
				removedRules.push(cssRule);
			} else if (ruleData.block && ruleData.block.children) {
				if (ruleData.type == "Rule") {
					promises.push(this.processStyle(ruleData.block.children.toArray(), baseURI, options, cssVariables, batchRequest));
				} else if (ruleData.type == "Atrule" && (ruleData.name == "media" || ruleData.name == "supports")) {
					promises.push(this.processStylesheet(ruleData.block.children, baseURI, options, cssVariables, batchRequest));
				} else if (ruleData.type == "Atrule" && ruleData.name == "font-face") {
					promises.push(processFontFaceRule(ruleData));
				}
			}
		}
		removedRules.forEach(cssRule => cssRules.remove(cssRule));
		await Promise.all(promises);

		async function processFontFaceRule(ruleData) {
			await Promise.all(ruleData.block.children.toArray().map(async declaration => {
				if (declaration.type == "Declaration" && declaration.value.children) {
					const urlFunctions = getUrlFunctions(getCSSValue(declaration.value), true);
					await Promise.all(urlFunctions.map(async urlFunction => {
						const originalResourceURL = matchURL(urlFunction);
						const resourceURL = normalizeURL(originalResourceURL);
						if (!testIgnoredPath(resourceURL)) {
							if (testValidURL(resourceURL)) {
								let { content } = await batchRequest.addURL(resourceURL,
									{ asBinary: true, expectedType: "font", baseURI, blockMixedContent: options.blockMixedContent });
								let resourceURLs = options.fontDeclarations.get(declaration);
								if (!resourceURLs) {
									resourceURLs = [];
									options.fontDeclarations.set(declaration, resourceURLs);
								}
								resourceURLs.push(resourceURL);
								replaceURLs(declaration, originalResourceURL, content);
							}
						}
					}));
				}
			}));

			function replaceURLs(declaration, oldURL, newURL) {
				declaration.value.children.forEach(token => {
					if (token.type == "Url" && util.removeQuotes(getCSSValue(token.value)) == oldURL) {
						token.value.value = newURL;
					}
				});
			}
		}
	}

	static async processStyle(declarations, baseURI, options, cssVariables, batchRequest) {
		await Promise.all(declarations.map(async declaration => {
			if (declaration.value && !declaration.value.children && declaration.value.type == "Raw") {
				try {
					declaration.value = cssTree.parse(declaration.value.value, { context: "value" });
				} catch (error) {
					// ignored
				}
			}
			if (declaration.type == "Declaration" && declaration.value.children) {
				const urlFunctions = getUrlFunctions(getCSSValue(declaration.value));
				await Promise.all(urlFunctions.map(async urlFunction => {
					const originalResourceURL = matchURL(urlFunction);
					const resourceURL = normalizeURL(originalResourceURL);
					if (!testIgnoredPath(resourceURL)) {
						if (testValidURL(resourceURL)) {
							let { content, indexResource, duplicate } = await batchRequest.addURL(resourceURL,
								{ asBinary: true, expectedType: "image", groupDuplicates: options.groupDuplicateImages });
							let variableDefined;
							const tokens = [];
							findURLToken(originalResourceURL, declaration.value.children, (token, parent, rootFunction) => {
								if (!originalResourceURL.startsWith("#")) {
									if (duplicate && options.groupDuplicateImages && rootFunction && util.getContentSize(content) < SINGLE_FILE_VARIABLE_MAX_SIZE) {
										const value = cssTree.parse("var(" + SINGLE_FILE_VARIABLE_NAME_PREFIX + indexResource + ")", { context: "value" }).children.head;
										tokens.push({ parent, token, value });
										variableDefined = true;
									} else {
										token.data.value.value = content;
									}
								}
							});
							if (variableDefined) {
								cssVariables.set(indexResource, { content, url: originalResourceURL });
								tokens.forEach(({ parent, token, value }) => parent.replace(token, value));
							}
						}
					}
				}));
			}
		}));

		function findURLToken(url, children, callback, depth = 0) {
			for (let token = children.head; token; token = token.next) {
				if (token.data.children) {
					findURLToken(url, token.data.children, callback, depth + 1);
				}
				if (token.data.type == "Url" && util.removeQuotes(getCSSValue(token.data.value)) == url) {
					callback(token, children, depth == 0);
				}
			}
		}
	}

	static async processAttribute(resourceElements, attributeName, baseURI, options, expectedType, cssVariables, styles, batchRequest, processDuplicates, removeElementIfMissing) {
		await Promise.all(Array.from(resourceElements).map(async resourceElement => {
			let resourceURL = resourceElement.getAttribute(attributeName);
			if (resourceURL != null) {
				resourceURL = normalizeURL(resourceURL);
				let originURL = resourceElement.dataset.singleFileOriginURL;
				if (options.saveOriginalURLs && !isDataURL(resourceURL)) {
					resourceElement.setAttribute("data-sf-original-" + attributeName, resourceURL);
				}
				delete resourceElement.dataset.singleFileOriginURL;
				if (!testIgnoredPath(resourceURL)) {
					resourceElement.setAttribute(attributeName, EMPTY_IMAGE);
					if (testValidPath(resourceURL)) {
						try {
							resourceURL = util.resolveURL(resourceURL, baseURI);
						} catch (error) {
							// ignored
						}
						if (testValidURL(resourceURL)) {
							let { content, indexResource, duplicate } = await batchRequest.addURL(resourceURL,
								{ asBinary: true, expectedType, groupDuplicates: options.groupDuplicateImages && resourceElement.tagName == "IMG" && attributeName == "src" });
							if (originURL) {
								if (content == EMPTY_DATA_URI) {
									try {
										originURL = util.resolveURL(originURL, baseURI);
									} catch (error) {
										// ignored
									}
									try {
										resourceURL = originURL;
										content = (await util.getContent(resourceURL, {
											asBinary: true,
											expectedType: "image",
											maxResourceSize: options.maxResourceSize,
											maxResourceSizeEnabled: options.maxResourceSizeEnabled,
											frameId: options.windowId,
											resourceReferrer: options.resourceReferrer,
											acceptHeaders: options.acceptHeaders,
											networkTimeout: options.networkTimeout
										})).data;
									} catch (error) {
										// ignored
									}
								}
							}
							if (removeElementIfMissing && content == EMPTY_DATA_URI) {
								resourceElement.remove();
							} else if (content !== EMPTY_DATA_URI) {
								const forbiddenPrefixFound = PREFIXES_FORBIDDEN_DATA_URI.filter(prefixDataURI => content.startsWith(prefixDataURI)).length;
								if (!forbiddenPrefixFound) {
									const isSVG = content.startsWith(PREFIX_DATA_URI_IMAGE_SVG);
									if (processDuplicates && duplicate && options.groupDuplicateImages && !isSVG && util.getContentSize(content) < SINGLE_FILE_VARIABLE_MAX_SIZE) {
										if (ProcessorHelper.replaceImageSource(resourceElement, SINGLE_FILE_VARIABLE_NAME_PREFIX + indexResource, options)) {
											cssVariables.set(indexResource, { content, url: originURL });
											const declarationList = cssTree.parse(resourceElement.getAttribute("style"), { context: "declarationList" });
											styles.set(resourceElement, declarationList);
										} else {
											resourceElement.setAttribute(attributeName, content);
										}
									} else {
										resourceElement.setAttribute(attributeName, content);
									}
								}
							}
						}
					}
				}
			}
		}));
	}

	static async processXLinks(resourceElements, doc, baseURI, options, batchRequest) {
		let attributeName = "xlink:href";
		await Promise.all(Array.from(resourceElements).map(async resourceElement => {
			let originalResourceURL = resourceElement.getAttribute(attributeName);
			if (originalResourceURL == null) {
				attributeName = "href";
				originalResourceURL = resourceElement.getAttribute(attributeName);
			}
			if (options.saveOriginalURLs && !isDataURL(originalResourceURL)) {
				resourceElement.setAttribute("data-sf-original-href", originalResourceURL);
			}
			let resourceURL = normalizeURL(originalResourceURL);
			if (testValidPath(resourceURL) && !testIgnoredPath(resourceURL)) {
				resourceElement.setAttribute(attributeName, EMPTY_IMAGE);
				try {
					resourceURL = util.resolveURL(resourceURL, baseURI);
				} catch (error) {
					// ignored
				}
				if (testValidURL(resourceURL)) {
					const hashMatch = originalResourceURL.match(REGEXP_URL_HASH);
					if (originalResourceURL.startsWith(baseURI + "#")) {
						resourceElement.setAttribute(attributeName, hashMatch[0]);
					} else {
						const response = await batchRequest.addURL(resourceURL, { expectedType: "image" });
						const svgDoc = util.parseSVGContent(response.content);
						if (hashMatch && hashMatch[0]) {
							let symbolElement;
							try {
								symbolElement = svgDoc.querySelector(hashMatch[0]);
							} catch (error) {
								// ignored
							}
							if (symbolElement) {
								resourceElement.setAttribute(attributeName, hashMatch[0]);
								resourceElement.parentElement.insertBefore(symbolElement, resourceElement.parentElement.firstChild);
							}
						} else {
							const content = await batchRequest.addURL(resourceURL, { expectedType: "image" });
							resourceElement.setAttribute(attributeName, PREFIX_DATA_URI_IMAGE_SVG + "," + content);
						}
					}
				}
			} else if (resourceURL == options.url) {
				resourceElement.setAttribute(attributeName, originalResourceURL.substring(resourceURL.length));
			}
		}));
	}

	static async processSrcset(resourceElements, attributeName, baseURI, batchRequest) {
		await Promise.all(Array.from(resourceElements).map(async resourceElement => {
			const originSrcset = resourceElement.getAttribute(attributeName);
			const srcset = util.parseSrcset(originSrcset);
			resourceElement.setAttribute("data-sf-original-srcset", originSrcset);
			const srcsetValues = await Promise.all(srcset.map(async srcsetValue => {
				let resourceURL = normalizeURL(srcsetValue.url);
				if (!testIgnoredPath(resourceURL)) {
					if (testValidPath(resourceURL)) {
						try {
							resourceURL = util.resolveURL(resourceURL, baseURI);
						} catch (error) {
							// ignored
						}
						if (testValidURL(resourceURL)) {
							const { content } = await batchRequest.addURL(resourceURL, { asBinary: true, expectedType: "image" });
							const forbiddenPrefixFound = PREFIXES_FORBIDDEN_DATA_URI.filter(prefixDataURI => content.startsWith(prefixDataURI)).length;
							if (forbiddenPrefixFound) {
								return "";
							}
							return content + (srcsetValue.w ? " " + srcsetValue.w + "w" : srcsetValue.d ? " " + srcsetValue.d + "x" : "");
						} else {
							return "";
						}
					} else {
						return "";
					}
				} else {
					return resourceURL + (srcsetValue.w ? " " + srcsetValue.w + "w" : srcsetValue.d ? " " + srcsetValue.d + "x" : "");
				}
			}));
			resourceElement.setAttribute(attributeName, srcsetValues.join(", "));
		}));
	}

	static replaceImageSource(imgElement, variableName, options) {
		const attributeValue = imgElement.getAttribute(util.IMAGE_ATTRIBUTE_NAME);
		if (attributeValue) {
			const imageData = options.images[Number(imgElement.getAttribute(util.IMAGE_ATTRIBUTE_NAME))];
			if (imageData && imageData.replaceable) {
				imgElement.setAttribute("src", `${PREFIX_DATA_URI_IMAGE_SVG},<svg xmlns="http://www.w3.org/2000/svg" width="${imageData.size.pxWidth}" height="${imageData.size.pxHeight}"><rect fill-opacity="0"/></svg>`);
				const backgroundStyle = {};
				const backgroundSize = (imageData.objectFit == "content" || imageData.objectFit == "cover") && imageData.objectFit;
				if (backgroundSize) {
					backgroundStyle["background-size"] = imageData.objectFit;
				}
				if (imageData.objectPosition) {
					backgroundStyle["background-position"] = imageData.objectPosition;
				}
				if (imageData.backgroundColor) {
					backgroundStyle["background-color"] = imageData.backgroundColor;
				}
				ProcessorHelper.setBackgroundImage(imgElement, "var(" + variableName + ")", backgroundStyle);
				imgElement.removeAttribute(util.IMAGE_ATTRIBUTE_NAME);
				return true;
			}
		}
	}
}

// ----
// Util
// ----
const BLOB_URI_PREFIX = "blob:";
const HTTP_URI_PREFIX = /^https?:\/\//;
const FILE_URI_PREFIX = /^file:\/\//;
const EMPTY_URL = /^https?:\/\/+\s*$/;
const NOT_EMPTY_URL = /^(https?:\/\/|file:\/\/|blob:).+/;
const REGEXP_URL_FN = /(url\s*\(\s*'(.*?)'\s*\))|(url\s*\(\s*"(.*?)"\s*\))|(url\s*\(\s*(.*?)\s*\))/gi;
const REGEXP_URL_SIMPLE_QUOTES_FN = /^url\s*\(\s*'(.*?)'\s*\)$/i;
const REGEXP_URL_DOUBLE_QUOTES_FN = /^url\s*\(\s*"(.*?)"\s*\)$/i;
const REGEXP_URL_NO_QUOTES_FN = /^url\s*\(\s*(.*?)\s*\)$/i;
const REGEXP_IMPORT_FN = /(@import\s*url\s*\(\s*'(.*?)'\s*\)\s*(.*?)(;|$|}))|(@import\s*url\s*\(\s*"(.*?)"\s*\)\s*(.*?)(;|$|}))|(@import\s*url\s*\(\s*(.*?)\s*\)\s*(.*?)(;|$|}))|(@import\s*'(.*?)'\s*(.*?)(;|$|}))|(@import\s*"(.*?)"\s*(.*?)(;|$|}))|(@import\s*(.*?)\s*(.*?)(;|$|}))/gi;
const REGEXP_IMPORT_URL_SIMPLE_QUOTES_FN = /@import\s*url\s*\(\s*'(.*?)'\s*\)\s*(.*?)(;|$|})/i;
const REGEXP_IMPORT_URL_DOUBLE_QUOTES_FN = /@import\s*url\s*\(\s*"(.*?)"\s*\)\s*(.*?)(;|$|})/i;
const REGEXP_IMPORT_URL_NO_QUOTES_FN = /@import\s*url\s*\(\s*(.*?)\s*\)\s*(.*?)(;|$|})/i;
const REGEXP_IMPORT_SIMPLE_QUOTES_FN = /@import\s*'(.*?)'\s*(.*?)(;|$|})/i;
const REGEXP_IMPORT_DOUBLE_QUOTES_FN = /@import\s*"(.*?)"\s*(.*?)(;|$|})/i;
const REGEXP_IMPORT_NO_QUOTES_FN = /@import\s*(.*?)\s*(.*?)(;|$|})/i;
const REGEXP_ESCAPE = /([{}()^$&.*?/+|[\\\\]|\]|-)/g;

function getUpdatedResourceContent(resourceURL, content, options) {
	if (options.rootDocument && options.updatedResources[resourceURL]) {
		options.updatedResources[resourceURL].retrieved = true;
		return options.updatedResources[resourceURL].content;
	} else {
		return content.data || "";
	}
}

function normalizeURL(url) {
	if (!url || url.startsWith(DATA_URI_PREFIX)) {
		return url;
	} else {
		return url.split("#")[0];
	}
}

function getCSSValue(value) {
	let result = "";
	try {
		result = cssTree.generate(value);
	} catch (error) {
		// ignored
	}
	return result;
}

function matchCharsetEquals(stylesheetContent, charset = UTF8_CHARSET) {
	const stylesheetCharset = getCharset(stylesheetContent);
	if (stylesheetCharset) {
		return stylesheetCharset == charset.toLowerCase();
	} else {
		return true;
	}
}

function getCharset(stylesheetContent) {
	const match = stylesheetContent.match(/^@charset\s+"([^"]*)";/i);
	if (match && match[1]) {
		return match[1].toLowerCase().trim();
	}
}

function getOnEventAttributeNames(doc) {
	const element = doc.createElement("div");
	const attributeNames = [];
	for (const propertyName in element) {
		if (propertyName.startsWith("on")) {
			attributeNames.push(propertyName);
		}
	}
	attributeNames.push("onunload");
	return attributeNames;
}

async function evalTemplateVariable(template, variableName, valueGetter, dontReplaceSlash, replacementCharacter) {
	let maxLength, maxCharLength;
	if (template) {
		const regExpVariable = "{\\s*" + variableName.replace(/\W|_/g, "[$&]") + "\\s*}";
		let replaceRegExp = new RegExp(regExpVariable + "\\[\\d+(ch)?\\]", "g");
		if (template.match(replaceRegExp)) {
			const matchedLength = template.match(replaceRegExp)[0];
			if (matchedLength.match(/\[(\d+)\]$/)) {
				maxLength = Number(matchedLength.match(/\[(\d+)\]$/)[1]);
				if (isNaN(maxLength) || maxLength <= 0) {
					maxLength = null;
				}
			} else {
				maxCharLength = Number(matchedLength.match(/\[(\d+)ch\]$/)[1]);
				if (isNaN(maxCharLength) || maxCharLength <= 0) {
					maxCharLength = null;
				}
			}
		} else {
			replaceRegExp = new RegExp(regExpVariable, "g");
		}
		if (template.match(replaceRegExp)) {
			let value = await valueGetter();
			if (!dontReplaceSlash) {
				value = value.replace(/\/+/g, replacementCharacter);
			}
			if (maxLength) {
				value = await util.truncateText(value, maxLength);
			} else if (maxCharLength) {
				value = value.substring(0, maxCharLength);
			}
			return template.replace(replaceRegExp, value);
		}
	}
	return template;
}

function getLastSegment(url, replacementCharacter) {
	let lastSegmentMatch = url.pathname.match(/\/([^/]+)$/), lastSegment = lastSegmentMatch && lastSegmentMatch[0];
	if (!lastSegment) {
		lastSegmentMatch = url.href.match(/([^/]+)\/?$/);
		lastSegment = lastSegmentMatch && lastSegmentMatch[0];
	}
	if (!lastSegment) {
		lastSegmentMatch = lastSegment.match(/(.*)\.[^.]+$/);
		lastSegment = lastSegmentMatch && lastSegmentMatch[0];
	}
	if (!lastSegment) {
		lastSegment = url.hostname.replace(/\/+/g, replacementCharacter).replace(/\/$/, "");
	}
	lastSegmentMatch = lastSegment.match(/(.*)\.[^.]+$/);
	if (lastSegmentMatch && lastSegmentMatch[1]) {
		lastSegment = lastSegmentMatch[1];
	}
	lastSegment = lastSegment.replace(/\/$/, "").replace(/^\//, "");
	return lastSegment;
}

function getRegExp(string) {
	return new RegExp(string.replace(REGEXP_ESCAPE, "\\$1"), "gi");
}

function getUrlFunctions(stylesheetContent, unique) {
	const result = stylesheetContent.match(REGEXP_URL_FN) || [];
	if (unique) {
		return [...new Set(result)];
	} else {
		return result;
	}
}

function getImportFunctions(stylesheetContent) {
	return stylesheetContent.match(REGEXP_IMPORT_FN) || [];
}

function findShortcutIcon(shortcutIcons) {
	shortcutIcons = shortcutIcons.filter(linkElement => linkElement.href != EMPTY_IMAGE);
	shortcutIcons.sort((linkElement1, linkElement2) => (parseInt(linkElement2.sizes, 10) || 16) - (parseInt(linkElement1.sizes, 10) || 16));
	return shortcutIcons[0];
}

function matchURL(stylesheetContent) {
	const match = stylesheetContent.match(REGEXP_URL_SIMPLE_QUOTES_FN) ||
		stylesheetContent.match(REGEXP_URL_DOUBLE_QUOTES_FN) ||
		stylesheetContent.match(REGEXP_URL_NO_QUOTES_FN);
	return match && match[1];
}

function addOriginalURLs(stylesheetContent) {
	return stylesheetContent.replace(REGEXP_URL_FN, function (match, _0, url, _1, url2, _2, url3) {
		url = url || url2 || url3;
		if (isDataURL(url)) {
			return match;
		} else {
			return "-sf-url-original(" + JSON.stringify(url) + ") " + match;
		}
	});
}

function isDataURL(url) {
	return url && (url.startsWith(DATA_URI_PREFIX) || url.startsWith(BLOB_URI_PREFIX));
}

function replaceOriginalURLs(stylesheetContent) {
	return stylesheetContent.replace(/-sf-url-original\("(.*?)"\)/g, "/* original URL: $1 */");
}

function testIgnoredPath(resourceURL) {
	return resourceURL && (resourceURL.startsWith(DATA_URI_PREFIX) || resourceURL == ABOUT_BLANK_URI);
}

function testValidPath(resourceURL) {
	return resourceURL && !resourceURL.match(EMPTY_URL);
}

function testValidURL(resourceURL) {
	return testValidPath(resourceURL) && (resourceURL.match(HTTP_URI_PREFIX) || resourceURL.match(FILE_URI_PREFIX) || resourceURL.startsWith(BLOB_URI_PREFIX)) && resourceURL.match(NOT_EMPTY_URL);
}

function matchImport(stylesheetContent) {
	const match = stylesheetContent.match(REGEXP_IMPORT_URL_SIMPLE_QUOTES_FN) ||
		stylesheetContent.match(REGEXP_IMPORT_URL_DOUBLE_QUOTES_FN) ||
		stylesheetContent.match(REGEXP_IMPORT_URL_NO_QUOTES_FN) ||
		stylesheetContent.match(REGEXP_IMPORT_SIMPLE_QUOTES_FN) ||
		stylesheetContent.match(REGEXP_IMPORT_DOUBLE_QUOTES_FN) ||
		stylesheetContent.match(REGEXP_IMPORT_NO_QUOTES_FN);
	if (match) {
		const [, resourceURL, media] = match;
		return { resourceURL, media };
	}
}

function removeCssComments(stylesheetContent) {
	try {
		return stylesheetContent.replace(/\/\*(.|[\r\n])*?\*\//g, "");
	} catch (error) {
		let start, end;
		do {
			start = stylesheetContent.indexOf("/*");
			end = stylesheetContent.indexOf("*/", start + 2);
			if (start != -1 && end != -1) {
				stylesheetContent = stylesheetContent.substring(0, start) + stylesheetContent.substr(end + 2);
			}
		} while (start != -1 && end != -1);
		return stylesheetContent;
	}
}

function wrapMediaQuery(stylesheetContent, mediaQuery) {
	if (mediaQuery) {
		return "@media " + mediaQuery + "{ " + stylesheetContent + " }";
	} else {
		return stylesheetContent;
	}
}

function log(...args) {
	console.log("S-File <core>   ", ...args); // eslint-disable-line no-console
}

// -----
// Stats
// -----
const STATS_DEFAULT_VALUES = {
	discarded: {
		"HTML bytes": 0,
		"hidden elements": 0,
		"HTML imports": 0,
		scripts: 0,
		objects: 0,
		"audio sources": 0,
		"video sources": 0,
		frames: 0,
		"CSS rules": 0,
		canvas: 0,
		stylesheets: 0,
		resources: 0,
		medias: 0
	},
	processed: {
		"HTML bytes": 0,
		"hidden elements": 0,
		"HTML imports": 0,
		scripts: 0,
		objects: 0,
		"audio sources": 0,
		"video sources": 0,
		frames: 0,
		"CSS rules": 0,
		canvas: 0,
		stylesheets: 0,
		resources: 0,
		medias: 0
	}
};

class Stats {
	constructor(options) {
		this.options = options;
		if (options.displayStats) {
			this.data = JSON.parse(JSON.stringify(STATS_DEFAULT_VALUES));
		}
	}
	set(type, subType, value) {
		if (this.options.displayStats) {
			this.data[type][subType] = value;
		}
	}
	add(type, subType, value) {
		if (this.options.displayStats) {
			this.data[type][subType] += value;
		}
	}
	addAll(pageData) {
		if (this.options.displayStats) {
			Object.keys(this.data.discarded).forEach(key => this.add("discarded", key, pageData.stats.discarded[key] || 0));
			Object.keys(this.data.processed).forEach(key => this.add("processed", key, pageData.stats.processed[key] || 0));
		}
	}
}

export {
	getClass
};
