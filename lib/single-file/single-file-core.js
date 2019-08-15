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

this.singlefile.lib.core = this.singlefile.lib.core || (() => {

	const SELECTED_CONTENT_ATTRIBUTE_NAME = "data-single-file-selected-content";
	const DEBUG = false;

	let util, cssTree, sessionId = 0;

	function getClass(...args) {
		[util, cssTree] = args;
		return SingleFileClass;
	}

	class SingleFileClass {
		constructor(options) {
			this.options = options;
			options.insertFaviconLink = true;
			if (options.sessionId === undefined) {
				options.sessionId = sessionId;
				sessionId++;
			}
		}
		async run() {
			this.runner = new Runner(this.options, true);
			await this.runner.loadPage();
			await this.runner.initialize();
			await this.runner.run();
		}
		cancel() {
			this.cancelled = true;
			if (this.runner) {
				this.runner.cancel();
			}
		}
		async getPageData() {
			return this.runner.getPageData();
		}
	}

	SingleFileClass.SELECTED_CONTENT_ATTRIBUTE_NAME = SELECTED_CONTENT_ATTRIBUTE_NAME;

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
			{ action: "replaceStyleContents" },
			{ action: "resetCharsetMeta" },
			{ option: "insertFaviconLink", action: "insertFaviconLink" },
			{ action: "replaceCanvasElements" },
			{ action: "insertFonts" },
			{ action: "insertShadowRootContents" },
			{ action: "setInputValues" },
			{ option: "removeScripts", action: "removeScripts" },
			{ option: "selected", action: "removeUnselectedElements" },
			{ option: "removeVideoSrc", action: "insertVideoPosters" },
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
			{ option: "removeAlternativeImages", action: "removeAlternativeImages" },
			{ option: "removeAlternativeFonts", action: "removeAlternativeFonts" }
		],
		parallel: [
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
			this.root = root;
			this.options = options;
			this.options.url = this.options.url || (this.options.doc && this.options.doc.location.href);
			this.options.baseURI = this.options.doc && this.options.doc.baseURI;
			this.options.rootDocument = root;
			this.options.updatedResources = this.options.updatedResources || {};
			this.batchRequest = new BatchRequest();
			this.processor = new Processor(options, this.batchRequest);
			if (this.options.doc) {
				const docData = util.preProcessDoc(this.options.doc, this.options.win, this.options);
				this.options.canvases = docData.canvases;
				this.options.fonts = docData.fonts;
				this.options.stylesheets = docData.stylesheets;
				this.options.images = docData.images;
				this.options.posters = docData.posters;
				this.options.usedFonts = docData.usedFonts;
				this.options.shadowRoots = docData.shadowRoots;
				this.options.imports = docData.imports;
				this.options.referrer = docData.referrer;
			}
			if (this.options.saveRawPage) {
				this.options.removeFrames = true;
			}
			this.options.content = this.options.content || (this.options.doc ? util.serialize(this.options.doc, false) : null);
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
			if (this.options.doc) {
				util.postProcessDoc(this.options.doc, this.markedElements);
			}
			this.options.doc = null;
			this.options.win = null;
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

		async getPageData() {
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

		async addURL(resourceURL, asBinary, groupDuplicates) {
			return new Promise((resolve, reject) => {
				const requestKey = JSON.stringify([resourceURL, asBinary]);
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

		async run(onloadListener, options) {
			const resourceURLs = Array.from(this.requests.keys());
			let indexResource = 0;
			return Promise.all(resourceURLs.map(async requestKey => {
				const [resourceURL, asBinary] = JSON.parse(requestKey);
				const resourceRequests = this.requests.get(requestKey);
				try {
					const content = await util.getContent(resourceURL, {
						asBinary,
						maxResourceSize: options.maxResourceSize,
						maxResourceSizeEnabled: options.maxResourceSizeEnabled
					});
					indexResource = indexResource + 1;
					onloadListener({ url: resourceURL });
					if (!this.cancelled) {
						resourceRequests.forEach(callbacks => {
							const duplicateCallbacks = this.duplicates.get(requestKey);
							const duplicate = duplicateCallbacks && duplicateCallbacks.length > 1 && duplicateCallbacks.includes(callbacks);
							callbacks.resolve({ content: content.data, indexResource, duplicate });
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
			const resourceURLs = Array.from(this.requests.keys());
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
	const SHADOW_MODE_ATTRIBUTE_NAME = "shadowmode";
	const SHADOW_DELEGATE_FOCUS_ATTRIBUTE_NAME = "delegatesfocus";
	const SCRIPT_TEMPLATE_SHADOW_ROOT = "data-template-shadow-root";

	class Processor {
		constructor(options, batchRequest) {
			this.options = options;
			this.stats = new Stats(options);
			this.baseURI = Util.normalizeURL(options.baseURI || options.url);
			this.batchRequest = batchRequest;
			this.stylesheets = new Map();
			this.styles = new Map();
			this.cssVariables = new Map();
		}

		initialize() {
			this.options.saveDate = new Date();
			this.options.saveUrl = this.options.url;
			if (this.options.enableMaff) {
				this.maffMetaDataPromise = this.batchRequest.addURL(util.resolveURL("index.rdf", this.options.baseURI || this.options.url), false);
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
					charset
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
				if (charset && charset != content.charset) {
					return this.loadPage(pageContent, charset);
				}
			}
			this.workStyleElement = this.doc.createElement("style");
			this.doc.body.appendChild(this.workStyleElement);
			this.onEventAttributeNames = Util.getOnEventAttributeNames(this.doc);
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
				const infobarContent = (this.options.infobarContent || "").replace(/\\n/g, "\n").replace(/\\t/g, "\t");
				const commentNode = this.doc.createComment("\n Page saved with SingleFile" +
					" \n url: " + this.options.saveUrl +
					" \n saved date: " + this.options.saveDate +
					(infobarContent ? " \n info: " + infobarContent : "") + "\n");
				this.doc.documentElement.insertBefore(commentNode, this.doc.documentElement.firstChild);
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
			filename = filename
				.replace(/[~\\?%*:|"<>\x00-\x1f\x7F]+/g, replacementCharacter); // eslint-disable-line no-control-regex
			filename = filename
				.replace(/\.\.\//g, "")
				.replace(/^\/+/, "")
				.replace(/\/+/g, "/")
				.replace(/\/$/, "")
				.replace(/\.$/, "")
				.replace(/\.\//g, "." + replacementCharacter)
				.replace(/\/\./g, "/" + replacementCharacter);
			if (!this.options.backgroundSave) {
				filename = filename.replace(/\//g, replacementCharacter);
			}
			if (util.getContentSize(filename) > this.options.filenameMaxLength) {
				const extensionMatch = filename.match(/(\.[^.]{3,4})$/);
				const extension = extensionMatch && extensionMatch[0] && extensionMatch[0].length > 1 ? extensionMatch[0] : "";
				filename = await util.truncateText(filename, this.options.filenameMaxLength - extension.length);
				filename = filename + "…" + extension;
			}
			if (!filename) {
				filename = "Unnamed page";
			}
			const matchTitle = this.baseURI.match(/([^/]*)\/?(\.html?.*)$/) || this.baseURI.match(/\/\/([^/]*)\/?$/);
			return {
				stats: this.stats.data,
				title: this.options.title || (this.baseURI && matchTitle ? matchTitle[1] : (url.hostname ? url.hostname : "")),
				filename,
				content
			};
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
							if (this.options.removeHiddenElements && imageData.size && !imageData.size.pxWidth && !imageData.size.pxHeight) {
								imgElement.setAttribute("src", EMPTY_IMAGE);
							} else if (imageData.currentSrc) {
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
			this.doc.body.removeAttribute(SELECTED_CONTENT_ATTRIBUTE_NAME);

			function removeUnmarkedElements(element) {
				let selectedElementFound = false;
				Array.from(element.childNodes).forEach(node => {
					if (node.nodeType == 1) {
						const isSelectedElement = node.getAttribute(SELECTED_CONTENT_ATTRIBUTE_NAME) == "";
						selectedElementFound = selectedElementFound || isSelectedElement;
						if (isSelectedElement) {
							node.removeAttribute(SELECTED_CONTENT_ATTRIBUTE_NAME);
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
			this.doc.querySelectorAll("singlefile-infobar, singlefile-mask, singlefile-logs-window").forEach(element => element.remove());
			this.doc.querySelectorAll("meta[http-equiv=refresh], meta[disabled-http-equiv], meta[http-equiv=\"content-security-policy\"]").forEach(element => element.remove());
			const objectElements = this.doc.querySelectorAll("applet, object[data]:not([type=\"image/svg+xml\"]):not([type=\"image/svg-xml\"]):not([type=\"text/html\"]), embed[src]:not([src*=\".svg\"]):not([src*=\".pdf\"])");
			this.stats.set("discarded", "objects", objectElements.length);
			this.stats.set("processed", "objects", objectElements.length);
			objectElements.forEach(element => element.remove());
			const replacedAttributeValue = this.doc.querySelectorAll("link[rel~=preconnect], link[rel~=prerender], link[rel~=dns-prefetch], link[rel~=preload], link[rel~=prefetch]");
			replacedAttributeValue.forEach(element => {
				const relValue = element.getAttribute("rel").replace(/(preconnect|prerender|dns-prefetch|preload|prefetch)/g, "").trim();
				if (relValue.length) {
					element.setAttribute("rel", relValue);
				} else {
					element.remove();
				}
			});
			this.doc.querySelectorAll("link[rel*=stylesheet][rel*=alternate][title],link[rel*=stylesheet]:not([href]),link[rel*=stylesheet][href=\"\"]").forEach(element => element.remove());
			if (this.options.compressHTML) {
				this.doc.querySelectorAll("input[type=hidden]").forEach(element => element.remove());
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
			metaElement.setAttribute("charset", "utf-8");
			if (this.doc.head.firstChild) {
				this.doc.head.insertBefore(metaElement, this.doc.head.firstChild);
			} else {
				this.doc.head.appendChild(metaElement);
			}
		}

		setInputValues() {
			this.doc.querySelectorAll("input").forEach(input => {
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

		insertFaviconLink() {
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
			const hiddenElements = this.doc.querySelectorAll("[" + util.REMOVED_CONTENT_ATTRIBUTE_NAME + "]");
			this.stats.set("discarded", "hidden elements", hiddenElements.length);
			this.stats.set("processed", "hidden elements", hiddenElements.length);
			hiddenElements.forEach(element => element.remove());
		}

		resolveHrefs() {
			this.doc.querySelectorAll("a[href], area[href], link[href]").forEach(element => {
				const href = element.getAttribute("href").trim();
				if (!Util.testIgnoredPath(href)) {
					let resolvedURL;
					try {
						resolvedURL = util.resolveURL(href, this.options.baseURI || this.options.url);
					} catch (error) {
						// ignored
					}
					if (resolvedURL) {
						const url = Util.normalizeURL(this.options.url);
						if (resolvedURL.startsWith(url + "#")) {
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
				styleContent = ProcessorHelper.resolveStylesheetURLs(styleContent, this.baseURI);
				const declarationList = cssTree.parse(styleContent, { context: "declarationList" });
				this.styles.set(element, declarationList);
			});
		}

		async resolveStylesheetURLs() {
			const options = {
				maxResourceSize: this.options.maxResourceSize,
				maxResourceSizeEnabled: this.options.maxResourceSizeEnabled,
				url: this.options.url,
				charset: this.charset,
				compressCSS: this.options.compressCSS,
				updatedResources: this.options.updatedResources,
				rootDocument: this.options.rootDocument
			};
			await Promise.all(Array.from(this.doc.querySelectorAll("style, link[rel*=stylesheet]"))
				.map(async element => {
					let mediaText;
					if (element.media) {
						mediaText = element.media.toLowerCase();
					}
					const stylesheetInfo = { mediaText };
					if (element.closest("[" + SHADOW_MODE_ATTRIBUTE_NAME + "]")) {
						stylesheetInfo.scoped = true;
					}
					if (element.tagName.toLowerCase() == "link") {
						if (element.charset) {
							options.charset = element.charset;
						}
					}
					await processElement(element, stylesheetInfo, this.stylesheets, this.baseURI, options, this.workStyleElement);
				}));
			if (options.rootDocument) {
				const newResources = Object.keys(options.updatedResources).filter(url => options.updatedResources[url].type == "stylesheet" && !options.updatedResources[url].retrieved).map(url => options.updatedResources[url]);
				await Promise.all(newResources.map(async resource => {
					resource.retrieved = true;
					const stylesheetInfo = {};
					const element = this.doc.createElement("style");
					this.doc.body.appendChild(element);
					element.textContent = resource.content;
					await processElement(element, stylesheetInfo, this.stylesheets, this.baseURI, options, this.workStyleElement);
				}));
			}

			async function processElement(element, stylesheetInfo, stylesheets, baseURI, options, workStyleElement) {
				stylesheets.set(element, stylesheetInfo);
				let stylesheetContent = await getStylesheetContent(element, baseURI, options, workStyleElement);
				const match = stylesheetContent.match(/^@charset\s+"([^"]*)";/i);
				if (match && match[1] && match[1] != options.charset) {
					options.charset = match[1];
					stylesheetContent = await getStylesheetContent(element, baseURI, options, workStyleElement);
				}
				let stylesheet;
				try {
					stylesheet = cssTree.parse(Util.removeCssComments(stylesheetContent));
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
				if (element.tagName.toLowerCase() == "link") {
					content = await ProcessorHelper.resolveLinkStylesheetURLs(element.href, baseURI, options, workStyleElement);
				} else {
					content = await ProcessorHelper.resolveImportURLs(element.textContent, baseURI, options, workStyleElement);
				}
				return content || "";
			}
		}

		async resolveFrameURLs() {
			if (!this.options.saveRawPage && this.options.frames) {
				const frameElements = Array.from(this.doc.querySelectorAll("iframe, frame, object[type=\"text/html\"][data]"));
				await Promise.all(frameElements.map(async frameElement => {
					if (frameElement.tagName == "OBJECT") {
						frameElement.setAttribute("data", "data:text/html,");
					} else {
						frameElement.removeAttribute("src");
						frameElement.removeAttribute("srcdoc");
					}
					Array.from(frameElement.childNodes).forEach(node => node.remove());
					const frameWindowId = frameElement.getAttribute(util.WIN_ID_ATTRIBUTE_NAME);
					if (frameWindowId) {
						const frameData = this.options.frames.find(frame => frame.windowId == frameWindowId);
						if (frameData) {
							await initializeProcessor(frameData, frameElement, frameWindowId, this.batchRequest, Object.create(this.options));
						}
					}
				}));
			}

			async function initializeProcessor(frameData, frameElement, frameWindowId, batchRequest, options) {
				options.insertSingleFileComment = false;
				options.insertFaviconLink = false;
				options.doc = null;
				options.win = null;
				options.url = frameData.baseURI;
				options.windowId = frameWindowId;
				if (frameData.content) {
					options.content = frameData.content;
					options.canvases = frameData.canvases;
					options.fonts = frameData.fonts;
					options.stylesheets = frameData.stylesheets;
					options.images = frameData.images;
					options.posters = frameData.posters;
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
				scriptElement.textContent = `(()=>{document.currentScript.remove();processNode(document);function processNode(node){node.querySelectorAll("template[${SHADOW_MODE_ATTRIBUTE_NAME}]").forEach(element=>{if (!element.parentElement.shadowRoot) {const shadowRoot=element.parentElement.attachShadow({mode:element.getAttribute("${SHADOW_MODE_ATTRIBUTE_NAME}"),delegatesFocus:Boolean(element.getAttribute("${SHADOW_DELEGATE_FOCUS_ATTRIBUTE_NAME}"))});shadowRoot.innerHTML=element.innerHTML;element.remove();processNode(shadowRoot)}})}})()`;
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
								templateElement.setAttribute(SHADOW_DELEGATE_FOCUS_ATTRIBUTE_NAME);
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
				linkElement.removeAttribute("href");
				const options = Object.create(this.options);
				options.insertSingleFileComment = false;
				options.insertFaviconLink = false;
				options.removeUnusedStyles = false;
				options.removeAlternativeMedias = false;
				options.removeUnusedFonts = false;
				options.removeHiddenElements = false;
				options.doc = null;
				options.win = null;
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
			await Promise.all(Array.from(this.stylesheets, ([, stylesheetInfo]) =>
				ProcessorHelper.processStylesheet(stylesheetInfo.stylesheet.children, this.baseURI, this.options, this.cssVariables, this.batchRequest)
			));
		}

		async processStyleAttributes() {
			return Promise.all(Array.from(this.styles, ([, declarationList]) =>
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
				["image", "xlink:href"]
			];
			let resourcePromises = processAttributeArgs.map(([selector, attributeName, processDuplicates, removeElementIfMissing]) =>
				ProcessorHelper.processAttribute(this.doc.querySelectorAll(selector), attributeName, this.baseURI, this.options, this.cssVariables, this.styles, this.batchRequest, processDuplicates, removeElementIfMissing)
			);
			resourcePromises = resourcePromises.concat([
				ProcessorHelper.processXLinks(this.doc.querySelectorAll("use"), this.baseURI, this.options, this.batchRequest),
				ProcessorHelper.processSrcset(this.doc.querySelectorAll("img[srcset], source[srcset]"), "srcset", this.baseURI, this.batchRequest)
			]);
			if (!this.options.removeAudioSrc) {
				resourcePromises.push(ProcessorHelper.processAttribute(this.doc.querySelectorAll("audio[src], audio > source[src]"), "src", this.baseURI, this.options, this.cssVariables, this.styles, this.batchRequest));
			}
			if (!this.options.removeVideoSrc) {
				resourcePromises.push(ProcessorHelper.processAttribute(this.doc.querySelectorAll("video[src], video > source[src]"), "src", this.baseURI, this.options, this.cssVariables, this.styles, this.batchRequest));
			}
			await Promise.all(resourcePromises);
			ProcessorHelper.processShortcutIcons(this.doc);
		}

		async processScripts() {
			await Promise.all(Array.from(this.doc.querySelectorAll("script[src]"), async scriptElement => {
				let resourceURL;
				const scriptSrc = scriptElement.getAttribute("src");
				scriptElement.removeAttribute("src");
				scriptElement.removeAttribute("integrity");
				scriptElement.textContent = "";
				try {
					resourceURL = util.resolveURL(scriptSrc, this.baseURI);
				} catch (error) {
					// ignored
				}
				if (Util.testValidURL(resourceURL)) {
					this.stats.add("processed", "scripts", 1);
					const content = await util.getContent(resourceURL, {
						asBinary: true,
						maxResourceSize: this.options.maxResourceSize,
						maxResourceSizeEnabled: this.options.maxResourceSizeEnabled
					});
					content.data = Util.getUpdatedResourceContent(resourceURL, content, this.options);
					scriptElement.setAttribute("src", content.data);
				}
			}));
		}

		removeAlternativeImages() {
			util.removeAlternativeImages(this.doc);
		}

		removeAlternativeFonts() {
			util.removeAlternativeFonts(this.doc, this.stylesheets);
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
							if (frameData.runner) {
								this.stats.add("processed", "frames", 1);
								await frameData.runner.run();
								const pageData = await frameData.runner.getPageData();
								frameElement.removeAttribute(util.WIN_ID_ATTRIBUTE_NAME);
								let sandbox = "allow-popups allow-top-navigation allow-top-navigation-by-user-activation";
								if (pageData.content.match(NOSCRIPT_TAG_FOUND) || pageData.content.match(SCRIPT_TAG_FOUND)) {
									sandbox += " allow-scripts allow-same-origin";
								}
								frameElement.setAttribute("sandbox", sandbox);
								if (frameElement.tagName == "OBJECT") {
									frameElement.setAttribute("data", "data:text/html," + pageData.content);
								} else {
									if (frameElement.tagName == "FRAME") {
										frameElement.setAttribute("src", "data:text/html," + pageData.content.replace(/#/g, "%23"));
									} else {
										frameElement.setAttribute("srcdoc", pageData.content);
										frameElement.removeAttribute("src");
									}
								}
								this.stats.addAll(pageData);
							} else {
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
					styleElement.textContent = stylesheetContent;
					linkElement.parentElement.replaceChild(styleElement, linkElement);
				} else {
					linkElement.remove();
				}
			});
		}

		replaceStyleAttributes() {
			this.doc.querySelectorAll("[style]").forEach(async element => {
				const declarations = this.styles.get(element);
				if (declarations) {
					this.styles.delete(element);
					let styleContent = cssTree.generate(declarations);
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
				this.cssVariables.forEach((content, indexResource) => {
					this.cssVariables.delete(indexResource);
					if (stylesheetContent) {
						stylesheetContent += ";";
					}
					stylesheetContent += `${SINGLE_FILE_VARIABLE_NAME_PREFIX + indexResource}:url("${content}")`;
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
			this.options.title = titleElement ? titleElement.textContent.trim() : "";
			this.options.infobarContent = await ProcessorHelper.evalTemplate(this.options.infobarTemplate, this.options, null, true);
			this.options.info = {
				description: descriptionElement && descriptionElement.content ? descriptionElement.content.trim() : "",
				lang: this.doc.documentElement.lang,
				author: authorElement && authorElement.content ? authorElement.content.trim() : "",
				creator: creatorElement && creatorElement.content ? creatorElement.content.trim() : "",
				publisher: publisherElement && publisherElement.content ? publisherElement.content.trim() : ""
			};
		}
	}

	// ---------------
	// ProcessorHelper
	// ---------------
	const DATA_URI_PREFIX = "data:";
	const ABOUT_BLANK_URI = "about:blank";
	const EMPTY_DATA_URI = "data:base64,";
	const REGEXP_URL_HASH = /(#.+?)$/;
	const SINGLE_FILE_VARIABLE_NAME_PREFIX = "--sf-img-";

	class ProcessorHelper {
		static async evalTemplate(template = "", options, content, dontReplaceSlash) {
			const date = options.saveDate;
			const url = util.parseURL(options.saveUrl);
			template = await Util.evalTemplateVariable(template, "page-title", () => options.title || "No title", dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "page-language", () => options.info.lang || "No language", dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "page-description", () => options.info.description || "No description", dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "page-author", () => options.info.author || "No author", dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "page-creator", () => options.info.creator || "No creator", dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "page-publisher", () => options.info.publisher || "No publisher", dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "datetime-iso", () => date.toISOString(), dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "date-iso", () => date.toISOString().split("T")[0], dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "time-iso", () => date.toISOString().split("T")[1].split("Z")[0], dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "date-locale", () => date.toLocaleDateString(), dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "time-locale", () => date.toLocaleTimeString(), dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "day-locale", () => String(date.getDate()).padStart(2, "0"), dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "month-locale", () => String(date.getMonth() + 1).padStart(2, "0"), dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "year-locale", () => String(date.getFullYear()), dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "datetime-locale", () => date.toLocaleString(), dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "datetime-utc", () => date.toUTCString(), dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "day-utc", () => String(date.getUTCDate()).padStart(2, "0"), dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "month-utc", () => String(date.getUTCMonth() + 1).padStart(2, "0"), dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "year-utc", () => String(date.getUTCFullYear()), dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "hours-locale", () => String(date.getHours()).padStart(2, "0"), dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "minutes-locale", () => String(date.getMinutes()).padStart(2, "0"), dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "seconds-locale", () => String(date.getSeconds()).padStart(2, "0"), dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "hours-utc", () => String(date.getUTCHours()).padStart(2, "0"), dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "minutes-utc", () => String(date.getUTCMinutes()).padStart(2, "0"), dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "seconds-utc", () => String(date.getUTCSeconds()).padStart(2, "0"), dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "url-hash", () => url.hash.substring(1) || "No hash", dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "url-host", () => url.host.replace(/\/$/, "") || "No host", dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "url-hostname", () => url.hostname.replace(/\/$/, "") || "No hostname", dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "url-href", () => decodeURI(url.href) || "No href", dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "url-referrer", () => decodeURI(options.referrer) || "No referrer", dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "url-password", () => url.password || "No password", dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "url-pathname", () => decodeURI(url.pathname).replace(/^\//, "").replace(/\/$/, "") || "No pathname", dontReplaceSlash === undefined ? true : dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "url-port", () => url.port || "No port", dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "url-protocol", () => url.protocol || "No protocol", dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "url-search", () => url.search.substring(1) || "No search", dontReplaceSlash, options.filenameReplacementCharacter);
			const params = url.search.substring(1).split("&").map(parameter => parameter.split("="));
			for (const [name, value] of params) {
				template = await Util.evalTemplateVariable(template, "url-search-" + name, () => value || "", dontReplaceSlash, options.filenameReplacementCharacter);
			}
			template = template.replace(/{\s*url-search-[^}\s]*\s*}/gi, "");
			template = await Util.evalTemplateVariable(template, "url-username", () => url.username || "No username", dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "tab-id", () => String(options.tabId || "No tab id"), dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "tab-index", () => String(options.tabIndex || "No tab index"), dontReplaceSlash, options.filenameReplacementCharacter);
			template = await Util.evalTemplateVariable(template, "url-last-segment", () => decodeURI(Util.getLastSegment(url, options.filenameReplacementCharacter)) || "No last segment", dontReplaceSlash, options.filenameReplacementCharacter);
			if (content) {
				template = await Util.evalTemplateVariable(template, "digest-sha-256", async () => util.digest("SHA-256", content), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await Util.evalTemplateVariable(template, "digest-sha-384", async () => util.digest("SHA-384", content), dontReplaceSlash, options.filenameReplacementCharacter);
				template = await Util.evalTemplateVariable(template, "digest-sha-512", async () => util.digest("SHA-512", content), dontReplaceSlash, options.filenameReplacementCharacter);
			}
			return template.trim();
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
			let shortcutIcon = Util.findShortcutIcon(Array.from(doc.querySelectorAll("link[href][rel=\"icon\"], link[href][rel=\"shortcut icon\"]")));
			if (!shortcutIcon) {
				shortcutIcon = Util.findShortcutIcon(Array.from(doc.querySelectorAll("link[href][rel*=\"icon\"]")));
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
			stylesheetContent = ProcessorHelper.resolveStylesheetURLs(stylesheetContent, baseURI);
			const imports = Util.getImportFunctions(stylesheetContent);
			await Promise.all(imports.map(async cssImport => {
				const match = Util.matchImport(cssImport);
				if (match) {
					const regExpCssImport = Util.getRegExp(cssImport);
					let resourceURL = Util.normalizeURL(match.resourceURL);
					if (!Util.testIgnoredPath(resourceURL) && Util.testValidPath(resourceURL)) {
						try {
							resourceURL = util.resolveURL(match.resourceURL, baseURI);
						} catch (error) {
							// ignored
						}
						if (Util.testValidURL(resourceURL) && !importedStyleSheets.has(resourceURL)) {
							const content = await util.getContent(resourceURL, {
								maxResourceSize: options.maxResourceSize,
								maxResourceSizeEnabled: options.maxResourceSizeEnabled,
								validateTextContentType: true
							});
							resourceURL = content.resourceURL;
							content.data = Util.getUpdatedResourceContent(resourceURL, content, options);
							let importedStylesheetContent = Util.removeCssComments(content.data);
							if (options.compressCSS) {
								importedStylesheetContent = util.compressCSS(importedStylesheetContent);
							}
							importedStylesheetContent = Util.wrapMediaQuery(importedStylesheetContent, match.media);
							if (stylesheetContent.includes(cssImport)) {
								const ancestorStyleSheets = new Set(importedStyleSheets);
								ancestorStyleSheets.add(resourceURL);
								importedStylesheetContent = await ProcessorHelper.resolveImportURLs(importedStylesheetContent, resourceURL, options, workStylesheet, ancestorStyleSheets);
								workStylesheet.textContent = importedStylesheetContent;
								if (workStylesheet.sheet.cssRules.length) {
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
		}

		static resolveStylesheetURLs(stylesheetContent, baseURI) {
			const urlFunctions = Util.getUrlFunctions(stylesheetContent);
			urlFunctions.map(urlFunction => {
				const originalResourceURL = Util.matchURL(urlFunction);
				const resourceURL = Util.normalizeURL(originalResourceURL);
				if (!Util.testIgnoredPath(resourceURL)) {
					if (!resourceURL || Util.testValidPath(resourceURL)) {
						let resolvedURL;
						if (!originalResourceURL.startsWith("#")) {
							try {
								resolvedURL = util.resolveURL(resourceURL, baseURI);
							} catch (error) {
								// ignored
							}
						}
						if (Util.testValidURL(resolvedURL) && resourceURL != resolvedURL && stylesheetContent.includes(urlFunction)) {
							stylesheetContent = stylesheetContent.replace(Util.getRegExp(urlFunction), originalResourceURL ? urlFunction.replace(originalResourceURL, resolvedURL) : "url(" + resolvedURL + ")");
						}
					} else {
						let newUrlFunction;
						if (originalResourceURL) {
							newUrlFunction = urlFunction.replace(originalResourceURL, EMPTY_DATA_URI);
						} else {
							newUrlFunction = "url(" + EMPTY_DATA_URI + ")";
						}
						stylesheetContent = stylesheetContent.replace(Util.getRegExp(urlFunction), newUrlFunction);
					}
				}
			});
			return stylesheetContent;
		}

		static async resolveLinkStylesheetURLs(resourceURL, baseURI, options, workStylesheet) {
			resourceURL = Util.normalizeURL(resourceURL);
			if (resourceURL && resourceURL != baseURI && resourceURL != ABOUT_BLANK_URI) {
				const content = await util.getContent(resourceURL, {
					maxResourceSize: options.maxResourceSize,
					maxResourceSizeEnabled: options.maxResourceSizeEnabled,
					charset: options.charset
				});
				resourceURL = content.resourceURL;
				content.data = Util.getUpdatedResourceContent(content.resourceURL, content, options);
				let stylesheetContent = Util.removeCssComments(content.data);
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
						const urlFunctions = Util.getUrlFunctions(Util.getCSSValue(declaration.value));
						await Promise.all(urlFunctions.map(async urlFunction => {
							const originalResourceURL = Util.matchURL(urlFunction);
							const resourceURL = Util.normalizeURL(originalResourceURL);
							if (!Util.testIgnoredPath(resourceURL)) {
								if (Util.testValidURL(resourceURL)) {
									let { content } = await batchRequest.addURL(resourceURL, true);
									replaceURLs(declaration, originalResourceURL, content);
								}
							}
						}));
					}
				}));

				function replaceURLs(declaration, oldURL, newURL) {
					declaration.value.children.forEach(token => {
						if (token.type == "Url" && util.removeQuotes(Util.getCSSValue(token.value)) == oldURL) {
							token.value.value = newURL;
						}
					});
				}
			}
		}

		static async processStyle(declarations, baseURI, options, cssVariables, batchRequest) {
			await Promise.all(declarations.map(async declaration => {
				if (declaration.type == "Declaration" && declaration.value.children) {
					const urlFunctions = Util.getUrlFunctions(Util.getCSSValue(declaration.value));
					await Promise.all(urlFunctions.map(async urlFunction => {
						const originalResourceURL = Util.matchURL(urlFunction);
						const resourceURL = Util.normalizeURL(originalResourceURL);
						if (!Util.testIgnoredPath(resourceURL)) {
							if (Util.testValidURL(resourceURL)) {
								let { content, indexResource, duplicate } = await batchRequest.addURL(resourceURL, true, true);
								let variableDefined;
								const tokens = [];
								findURLToken(originalResourceURL, declaration.value.children, (token, parent, rootFunction) => {
									if (!originalResourceURL.startsWith("#")) {
										if (duplicate && options.groupDuplicateImages && rootFunction) {
											const value = cssTree.parse("var(" + SINGLE_FILE_VARIABLE_NAME_PREFIX + indexResource + ")", { context: "value" }).children.head;
											tokens.push({ parent, token, value });
											variableDefined = true;
										} else {
											token.data.value.value = content;
										}
									}
								});
								if (variableDefined) {
									cssVariables.set(indexResource, content);
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
					if (token.data.type == "Url" && util.removeQuotes(Util.getCSSValue(token.data.value)) == url) {
						callback(token, children, depth == 0);
					}
				}
			}
		}

		static async processAttribute(resourceElements, attributeName, baseURI, options, cssVariables, styles, batchRequest, processDuplicates, removeElementIfMissing) {
			await Promise.all(Array.from(resourceElements, async resourceElement => {
				let resourceURL = resourceElement.getAttribute(attributeName);
				resourceURL = Util.normalizeURL(resourceURL);
				if (!Util.testIgnoredPath(resourceURL)) {
					resourceElement.setAttribute(attributeName, EMPTY_IMAGE);
					if (Util.testValidPath(resourceURL)) {
						try {
							resourceURL = util.resolveURL(resourceURL, baseURI);
						} catch (error) {
							// ignored
						}
						if (Util.testValidURL(resourceURL)) {
							const { content, indexResource, duplicate } = await batchRequest.addURL(resourceURL, true, resourceElement.tagName == "IMG" && attributeName == "src");
							if (removeElementIfMissing && content == EMPTY_DATA_URI) {
								resourceElement.remove();
							} else {
								const forbiddenPrefixFound = PREFIXES_FORBIDDEN_DATA_URI.filter(prefixDataURI => content.startsWith(prefixDataURI)).length;
								if (!forbiddenPrefixFound) {
									const isSVG = content.startsWith(PREFIX_DATA_URI_IMAGE_SVG);
									if (processDuplicates && duplicate && options.groupDuplicateImages && !isSVG) {
										if (ProcessorHelper.replaceImageSource(resourceElement, SINGLE_FILE_VARIABLE_NAME_PREFIX + indexResource, options)) {
											cssVariables.set(indexResource, content);
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
			}));
		}

		static async processXLinks(resourceElements, baseURI, options, batchRequest) {
			const attributeName = "xlink:href";
			await Promise.all(Array.from(resourceElements, async resourceElement => {
				const originalResourceURL = resourceElement.getAttribute(attributeName);
				let resourceURL = Util.normalizeURL(originalResourceURL);
				if (Util.testValidPath(resourceURL) && !Util.testIgnoredPath(resourceURL)) {
					resourceElement.setAttribute(attributeName, EMPTY_IMAGE);
					try {
						resourceURL = util.resolveURL(resourceURL, baseURI);
					} catch (error) {
						// ignored
					}
					if (Util.testValidURL(resourceURL)) {
						const { content } = await batchRequest.addURL(resourceURL);
						const hashMatch = originalResourceURL.match(REGEXP_URL_HASH);
						if (hashMatch && hashMatch[0]) {
							let symbolElement;
							try {
								symbolElement = util.parseSVGContent(content).querySelector(hashMatch[0]);
							} catch (error) {
								// ignored
							}
							if (symbolElement) {
								resourceElement.setAttribute(attributeName, hashMatch[0]);
								resourceElement.parentElement.insertBefore(symbolElement, resourceElement.parentElement.firstChild);
							}
						} else {
							resourceElement.setAttribute(attributeName, PREFIX_DATA_URI_IMAGE_SVG + "," + content);
						}
					}
				} else if (resourceURL == options.url) {
					resourceElement.setAttribute(attributeName, originalResourceURL.substring(resourceURL.length));
				}
			}));
		}

		static async processSrcset(resourceElements, attributeName, baseURI, batchRequest) {
			await Promise.all(Array.from(resourceElements, async resourceElement => {
				const srcset = util.parseSrcset(resourceElement.getAttribute(attributeName));
				const srcsetValues = await Promise.all(srcset.map(async srcsetValue => {
					let resourceURL = Util.normalizeURL(srcsetValue.url);
					if (!Util.testIgnoredPath(resourceURL)) {
						if (Util.testValidPath(resourceURL)) {
							try {
								resourceURL = util.resolveURL(resourceURL, baseURI);
							} catch (error) {
								// ignored
							}
							if (Util.testValidURL(resourceURL)) {
								const { content } = await batchRequest.addURL(resourceURL, true);
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

	class Util {
		static getUpdatedResourceContent(resourceURL, content, options) {
			if (options.rootDocument && options.updatedResources[resourceURL]) {
				options.updatedResources[resourceURL].retrieved = true;
				return options.updatedResources[resourceURL].content;
			} else {
				return content.data || "";
			}
		}

		static normalizeURL(url) {
			if (!url || url.startsWith(DATA_URI_PREFIX)) {
				return url;
			} else {
				return url.split("#")[0];
			}
		}

		static getCSSValue(value) {
			let result = "";
			try {
				result = cssTree.generate(value);
			} catch (error) {
				// ignored
			}
			return result;
		}

		static getOnEventAttributeNames(doc) {
			const element = doc.createElement("div");
			const attributeNames = [];
			for (const propertyName in element) {
				if (propertyName.startsWith("on")) {
					attributeNames.push(propertyName);
				}
			}
			return attributeNames;
		}

		static async evalTemplateVariable(template, variableName, valueGetter, dontReplaceSlash, replacementCharacter) {
			const replaceRegExp = new RegExp("{\\s*" + variableName.replace(/\W|_/g, "[$&]") + "\\s*}", "g");
			if (template && template.match(replaceRegExp)) {
				let value = await valueGetter();
				if (!dontReplaceSlash) {
					value = value.replace(/\/+/g, replacementCharacter);
				}
				return template.replace(replaceRegExp, value);
			}
			return template;
		}

		static getLastSegment(url, replacementCharacter) {
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

		static getRegExp(string) {
			return new RegExp(string.replace(REGEXP_ESCAPE, "\\$1"), "gi");
		}

		static getUrlFunctions(stylesheetContent) {
			return Array.from(new Set(stylesheetContent.match(REGEXP_URL_FN) || []));
		}

		static getImportFunctions(stylesheetContent) {
			return stylesheetContent.match(REGEXP_IMPORT_FN) || [];
		}

		static findShortcutIcon(shortcutIcons) {
			shortcutIcons = shortcutIcons.filter(linkElement => linkElement.href != EMPTY_IMAGE);
			shortcutIcons.sort((linkElement1, linkElement2) => (parseInt(linkElement2.sizes, 10) || 16) - (parseInt(linkElement1.sizes, 10) || 16));
			return shortcutIcons[0];
		}

		static matchURL(stylesheetContent) {
			const match = stylesheetContent.match(REGEXP_URL_SIMPLE_QUOTES_FN) ||
				stylesheetContent.match(REGEXP_URL_DOUBLE_QUOTES_FN) ||
				stylesheetContent.match(REGEXP_URL_NO_QUOTES_FN);
			return match && match[1];
		}

		static testIgnoredPath(resourceURL) {
			return resourceURL && (resourceURL.startsWith(DATA_URI_PREFIX) || resourceURL == ABOUT_BLANK_URI);
		}

		static testValidPath(resourceURL) {
			return resourceURL && !resourceURL.match(EMPTY_URL);
		}

		static testValidURL(resourceURL) {
			return Util.testValidPath(resourceURL) && (resourceURL.match(HTTP_URI_PREFIX) || resourceURL.match(FILE_URI_PREFIX) || resourceURL.startsWith(BLOB_URI_PREFIX)) && resourceURL.match(NOT_EMPTY_URL);
		}

		static matchImport(stylesheetContent) {
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

		static removeCssComments(stylesheetContent) {
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

		static wrapMediaQuery(stylesheetContent, mediaQuery) {
			if (mediaQuery) {
				return "@media " + mediaQuery + "{ " + stylesheetContent + " }";
			} else {
				return stylesheetContent;
			}
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

	return { getClass };

})();