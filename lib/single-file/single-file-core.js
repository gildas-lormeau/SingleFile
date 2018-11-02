/*
 * Copyright 2018 Gildas Lormeau
 * contact : gildas.lormeau <at> gmail.com
 * 
 * This file is part of SingleFile.
 *
 *   SingleFile is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU Lesser General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   SingleFile is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU Lesser General Public License for more details.
 *
 *   You should have received a copy of the GNU Lesser General Public License
 *   along with SingleFile.  If not, see <http://www.gnu.org/licenses/>.
 */

/* global CSSRule */

this.SingleFileCore = this.SingleFileCore || (() => {

	const SELECTED_CONTENT_ATTRIBUTE_NAME = "data-single-file-selected-content";
	const SELECTED_CONTENT_ROOT_ATTRIBUTE_NAME = "data-single-file-selected-content-root";
	const DEBUG = false;

	let Download, DOM, URL, sessionId = 0;

	function getClass(...args) {
		[Download, DOM, URL] = args;
		return SingleFileClass;
	}

	class SingleFileClass {
		constructor(options) {
			this.options = options;
			if (options.sessionId === undefined) {
				options.sessionId = sessionId;
				sessionId++;
			}
		}
		async initialize() {
			this.processor = new PageProcessor(this.options);
			await this.processor.loadPage();
			await this.processor.initialize();
		}
		async run() {
			await this.processor.run();
		}
		async getPageData() {
			return this.processor.getPageData();
		}
	}

	SingleFileClass.SELECTED_CONTENT_ATTRIBUTE_NAME = SELECTED_CONTENT_ATTRIBUTE_NAME;
	SingleFileClass.SELECTED_CONTENT_ROOT_ATTRIBUTE_NAME = SELECTED_CONTENT_ROOT_ATTRIBUTE_NAME;

	// -------------
	// ProgressEvent
	// -------------
	const PAGE_LOADING = "page-loading";
	const PAGE_LOADED = "page-loaded";
	const RESOURCES_INITIALIZING = "resource-initializing";
	const RESOURCES_INITIALIZED = "resources-initialized";
	const RESOURCE_LOADED = "resource-loaded";
	const PAGE_ENDED = "page-ended";

	class ProgressEvent {
		constructor(type, details) {
			return { type, details, PAGE_LOADING, PAGE_LOADED, RESOURCES_INITIALIZING, RESOURCES_INITIALIZED, RESOURCE_LOADED, PAGE_ENDED };
		}
	}

	// -------------
	// PageProcessor
	// -------------
	const RESOLVE_URLS_STAGE = 0;
	const REPLACE_DATA_STAGE = 1;
	const REPLACE_DOCS_STAGE = 2;
	const CLEANUP_STAGE = 3;
	const STAGES = [{
		sequential: [
			{ action: "preProcessPage" },
			{ action: "replaceStyleContents" },
			{ option: "selected", action: "removeUnselectedElements" },
			{ option: "removeVideoSrc", action: "insertVideoPosters" },
			{ option: "removeFrames", action: "removeFrames" },
			{ option: "removeImports", action: "removeImports" },
			{ option: "removeScripts", action: "removeScripts" },
			{ action: "removeDiscardedResources" },
			{ action: "resetCharsetMeta" },
			{ action: "setInputValues" },
			{ option: "insertFaviconLink", action: "insertFaviconLink" },
			{ action: "resolveHrefs" },
			{ action: "replaceCanvasElements" },
			{ action: "insertFonts" },
			{ option: "removeHiddenElements", action: "removeHiddenElements" },
			{ action: "resolveStyleAttributeURLs" }
		],
		parallel: [
			{ action: "resolveStylesheetURLs" },
			{ action: "resolveLinkedStylesheetURLs" },
			{ option: "!removeFrames", action: "resolveFrameURLs" },
			{ option: "!removeImports", action: "resolveHtmlImportURLs" }
		]
	}, {
		sequential: [
			{ option: "removeUnusedStyles", action: "removeUnusedStyles" },
			{ option: "removeAlternativeMedias", action: "removeAlternativeMedias" },
			{ option: "removeUnusedStyles", action: "removeUnusedFonts" }
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
			{ option: "removeAlternativeFonts", action: "removeAlternativeFonts" },
			{ option: "compressCSS", action: "compressCSS" }
		],
		parallel: [
			{ option: "!removeFrames", action: "processFrames" },
			{ option: "!removeImports", action: "processHtmlImports" },
		]
	}, {
		sequential: [
			{ option: "compressHTML", action: "compressHTML" },
			{ option: "insertSingleFileComment", action: "insertSingleFileComment" },
			{ action: "cleanup" }
		]
	}];

	class PageProcessor {
		constructor(options) {
			this.options = options;
			this.options.url = this.options.url || this.options.doc.location.href;
			this.options.baseURI = this.options.doc && this.options.doc.baseURI;
			this.batchRequest = new BatchRequest();
			this.processor = new DOMProcessor(options, this.batchRequest);
			if (this.options.doc) {
				const docData = DOM.preProcessDoc(this.options.doc, this.options.win, this.options);
				this.options.canvasData = docData.canvasData;
				this.options.fontsData = docData.fontsData;
				this.options.stylesheetContents = docData.stylesheetContents;
				this.options.imageData = docData.imageData;
				this.options.postersData = docData.postersData;
				this.options.usedFonts = docData.usedFonts;
			}
			this.options.content = this.options.content || (this.options.doc ? DOM.serialize(this.options.doc, false) : null);
			this.onprogress = options.onprogress || (() => { });
		}

		async loadPage() {
			this.onprogress(new ProgressEvent(PAGE_LOADING, { pageURL: this.options.url }));
			await this.processor.loadPage(this.options.content);
			this.onprogress(new ProgressEvent(PAGE_LOADED, { pageURL: this.options.url }));
		}

		async initialize() {
			this.onprogress(new ProgressEvent(RESOURCES_INITIALIZING, { pageURL: this.options.url }));
			await this.executeStage(RESOLVE_URLS_STAGE);
			this.pendingPromises = this.executeStage(REPLACE_DATA_STAGE);
			if (this.options.doc) {
				DOM.postProcessDoc(this.options.doc, this.options);
				this.options.doc = null;
				this.options.win = null;
			}
		}

		async run() {
			if (!this.options.windowId) {
				this.processor.initialize(this.batchRequest);
				this.onprogress(new ProgressEvent(RESOURCES_INITIALIZED, { pageURL: this.options.url, index: 0, max: this.processor.maxResources }));
			}
			await this.batchRequest.run(details => {
				details.pageURL = this.options.url;
				this.onprogress(new ProgressEvent(RESOURCE_LOADED, details));
			}, this.options);
			await this.pendingPromises;
			await this.executeStage(REPLACE_DOCS_STAGE);
			await this.executeStage(CLEANUP_STAGE);
		}

		async getPageData() {
			if (!this.options.windowId) {
				this.onprogress(new ProgressEvent(PAGE_ENDED, { pageURL: this.options.url }));
			}
			return this.processor.getPageData();
		}

		async executeStage(step) {
			if (DEBUG) {
				log("**** STARTED STAGE", step, "****");
			}
			STAGES[step].sequential.forEach(task => {
				let startTime;
				if (DEBUG) {
					startTime = Date.now();
					log("  -- STARTED task =", task.action);
				}
				this.executeTask(task);
				if (DEBUG) {
					log("  -- ENDED   task =", task.action, "delay =", Date.now() - startTime);
				}
			});
			if (STAGES[step].parallel) {
				return await Promise.all(STAGES[step].parallel.map(task => {
					let startTime;
					if (DEBUG) {
						startTime = Date.now();
						log("  // STARTED task =", task.action);
					}
					const promise = this.executeTask(task);
					if (DEBUG) {
						promise.then(() => log("  // ENDED task =", task.action, "delay =", Date.now() - startTime));
					}
					return promise;
				}));
			}
			if (DEBUG) {
				log("**** ENDED   STAGE", step, "****");
			}
		}

		executeTask(task) {
			if (!task.option || ((task.option.startsWith("!") && !this.options[task.option]) || this.options[task.option])) {
				return this.processor[task.action]();
			}
		}
	}

	// --------
	// BatchRequest
	// --------
	class BatchRequest {
		constructor() {
			this.requests = new Map();
		}

		async addURL(resourceURL, asDataURI = true) {
			return new Promise((resolve, reject) => {
				const requestKey = JSON.stringify([resourceURL, asDataURI]);
				const resourceRequests = this.requests.get(requestKey);
				if (resourceRequests) {
					resourceRequests.push({ resolve, reject });
				} else {
					this.requests.set(requestKey, [{ resolve, reject }]);
				}
			});
		}

		getMaxResources() {
			return Array.from(this.requests.keys()).length;
		}

		async run(onloadListener, options) {
			const resourceURLs = Array.from(this.requests.keys());
			let indexResource = 0;
			return Promise.all(resourceURLs.map(async requestKey => {
				const [resourceURL, asDataURI] = JSON.parse(requestKey);
				const resourceRequests = this.requests.get(requestKey);
				try {
					const resourceContent = await Download.getContent(resourceURL, { asDataURI, maxResourceSize: options.maxResourceSize, maxResourceSizeEnabled: options.maxResourceSizeEnabled });
					indexResource = indexResource + 1;
					onloadListener({ index: indexResource, url: resourceURL });
					resourceRequests.forEach(resourceRequest => resourceRequest.resolve({ content: resourceContent, indexResource, duplicate: Boolean(resourceRequests.length > 1) }));
				} catch (error) {
					indexResource = indexResource + 1;
					onloadListener({ index: indexResource, url: resourceURL });
					resourceRequests.forEach(resourceRequest => resourceRequest.reject(error));
				}
				this.requests.delete(requestKey);
			}));
		}
	}

	// ------------
	// DOMProcessor
	// ------------
	const EMPTY_DATA_URI = "data:base64,";
	const EMPTY_IMAGE = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
	const SCRIPT_TAG_FOUND = /<script/gi;
	const NOSCRIPT_TAG_FOUND = /<noscript/gi;

	class DOMProcessor {
		constructor(options, batchRequest) {
			this.options = options;
			this.stats = new Stats(options);
			this.baseURI = DomUtil.normalizeURL(options.baseURI || options.url);
			this.batchRequest = batchRequest;
		}

		initialize() {
			this.maxResources = this.batchRequest.getMaxResources();
			if (!this.options.removeFrames) {
				this.options.framesData.forEach(frameData => this.maxResources += frameData.maxResources || 0);
			}
			this.stats.set("processed", "resources", this.maxResources);
		}

		async loadPage(pageContent) {
			if (!pageContent || this.options.saveRawPage) {
				pageContent = await Download.getContent(this.baseURI, { asDataURI: false, maxResourceSize: this.options.maxResourceSize, maxResourceSizeEnabled: this.options.maxResourceSizeEnabled });
			}
			this.doc = DOM.createDoc(pageContent, this.baseURI);
			this.onEventAttributeNames = DOM.getOnEventAttributeNames(this.doc);
		}

		async getPageData() {
			DOM.postProcessDoc(this.doc, this.options);
			const titleElement = this.doc.querySelector("title");
			this.options.title = titleElement ? titleElement.textContent.trim() : "";
			this.options.info = {};
			const descriptionElement = this.doc.querySelector("meta[name=description]");
			this.options.info.description = descriptionElement ? descriptionElement.content.trim() : "";
			this.options.info.lang = this.doc.documentElement.lang;
			const authorElement = this.doc.querySelector("meta[name=author]");
			this.options.info.author = authorElement ? authorElement.content.trim() : "";
			const creatorElement = this.doc.querySelector("meta[name=creator]");
			this.options.info.creator = creatorElement ? creatorElement.content.trim() : "";
			const publisherElement = this.doc.querySelector("meta[name=publisher]");
			this.options.info.publisher = publisherElement ? publisherElement.content.trim() : "";
			const url = new URL(this.baseURI);
			let size;
			if (this.options.displayStats) {
				size = DOM.getContentSize(this.doc.documentElement.outerHTML);
			}
			const content = DOM.serialize(this.doc, this.options.compressHTML);
			if (this.options.displayStats) {
				const contentSize = DOM.getContentSize(content);
				this.stats.set("processed", "HTML bytes", contentSize);
				this.stats.add("discarded", "HTML bytes", size - contentSize);
			}
			const filename = await DomProcessorHelper.getFilename(this.options, content);
			const matchTitle = this.baseURI.match(/([^/]*)\/?(\.html?.*)$/) || this.baseURI.match(/\/\/([^/]*)\/?$/);
			return {
				stats: this.stats.data,
				title: this.options.title || (this.baseURI && matchTitle ? matchTitle[1] : (url.hostname ? url.hostname : "")),
				filename,
				content
			};
		}

		removeUnselectedElements() {
			const rootElement = this.doc.querySelector("[" + SELECTED_CONTENT_ROOT_ATTRIBUTE_NAME + "]");
			if (rootElement) {
				DomProcessorHelper.isolateElements(rootElement);
				rootElement.removeAttribute(SELECTED_CONTENT_ROOT_ATTRIBUTE_NAME);
				rootElement.removeAttribute(SELECTED_CONTENT_ATTRIBUTE_NAME);
			}
		}

		setInputValues() {
			this.doc.querySelectorAll("input").forEach(input => {
				const value = input.getAttribute(DOM.inputValueAttributeName(this.options.sessionId));
				input.setAttribute("value", value || "");
			});
			this.doc.querySelectorAll("textarea").forEach(textarea => {
				const value = textarea.getAttribute(DOM.inputValueAttributeName(this.options.sessionId));
				textarea.textContent = value || "";
			});
			this.doc.querySelectorAll("select").forEach(select => {
				select.querySelectorAll("option").forEach(option => {
					const selected = option.getAttribute(DOM.inputValueAttributeName(this.options.sessionId)) != null;
					if (selected) {
						option.setAttribute("selected", "");
					}
				});
			});
		}

		removeDiscardedResources() {
			const objectElements = this.doc.querySelectorAll("applet, meta[http-equiv=refresh], object[data]:not([type=\"image/svg+xml\"]):not([type=\"image/svg-xml\"]):not([type=\"text/html\"]), embed[src]:not([src*=\".svg\"])");
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
			this.doc.querySelectorAll("meta[http-equiv=\"content-security-policy\"]").forEach(element => element.remove());
			if (this.options.compressHTML) {
				this.doc.querySelectorAll("input[type=hidden]").forEach(element => element.remove());
			}
			this.doc.querySelectorAll("a[ping]").forEach(element => element.removeAttribute("ping"));
			if (this.options.removeScripts) {
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
			}
			const audioSourceElements = this.doc.querySelectorAll("audio[src], audio > source[src]");
			this.stats.set("processed", "audio sources", audioSourceElements.length);
			if (this.options.removeAudioSrc) {
				this.stats.set("discarded", "audio sources", audioSourceElements.length);
				audioSourceElements.forEach(element => element.removeAttribute("src"));
			}
			const videoSourceElements = this.doc.querySelectorAll("video[src], video > source[src]");
			this.stats.set("processed", "video sources", videoSourceElements.length);
			if (this.options.removeVideoSrc) {
				this.stats.set("discarded", "video sources", videoSourceElements.length);
				videoSourceElements.forEach(element => element.removeAttribute("src"));
			}
		}

		cleanup() {
			const metaCharset = this.doc.head.querySelector("meta[charset]");
			if (metaCharset) {
				this.doc.head.insertBefore(metaCharset, this.doc.head.firstChild);
			}
			this.doc.querySelectorAll("style[data-single-file-sheet]").forEach(element => element.removeAttribute("data-single-file-sheet"));
			this.doc.querySelectorAll("base").forEach(element => element.remove());
			if (this.doc.head.querySelectorAll("*").length == 1 && metaCharset && this.doc.body.childNodes.length == 0) {
				this.doc.head.querySelector("meta[charset]").remove();
			}
		}

		preProcessPage() {
			this.doc.querySelectorAll("singlefile-infobar, singlefile-mask").forEach(element => element.remove());
			if (this.options.win) {
				this.doc.body.querySelectorAll(":not(svg) title, meta").forEach(element => element instanceof this.options.win.HTMLElement && this.doc.head.appendChild(element));
			}
			if (this.options.imageData) {
				const dataAttributeName = DOM.imagesAttributeName(this.options.sessionId);
				this.doc.querySelectorAll("img").forEach(imgElement => {
					const imgData = this.options.imageData[Number(imgElement.getAttribute(dataAttributeName))];
					if (imgData.currentSrc) {
						imgElement.setAttribute("src", imgData.currentSrc);
					}
				});
				if (this.options.lazyLoadImages) {
					this.doc.querySelectorAll("img[data-src]").forEach(imgElement => {
						const imgData = this.options.imageData[Number(imgElement.getAttribute(dataAttributeName))];
						if ((!imgElement.getAttribute("src") || imgElement.getAttribute("src") == EMPTY_IMAGE) && imgElement.getAttribute("data-src")) {
							imgData.src = imgElement.dataset.src;
							imgElement.setAttribute("src", imgElement.dataset.src);
							imgElement.removeAttribute("data-src");
						}
					});
					this.doc.querySelectorAll("img[data-srcset]").forEach(imgElement => {
						if (!imgElement.getAttribute("srcset") && imgElement.getAttribute("data-srcset")) {
							imgElement.setAttribute("srcset", imgElement.dataset.srcset);
							imgElement.removeAttribute("data-srcset");
						}
					});
				}
			}
		}

		removeScripts() {
			const scriptElements = this.doc.querySelectorAll("script:not([type=\"application/ld+json\"])");
			this.stats.set("discarded", "scripts", scriptElements.length);
			this.stats.set("processed", "scripts", scriptElements.length);
			scriptElements.forEach(element => element.remove());
		}

		removeFrames() {
			const frameElements = this.doc.querySelectorAll("iframe, frame, object[type=\"text/html\"][data]");
			this.stats.set("discarded", "frames", frameElements.length);
			this.stats.set("processed", "frames", frameElements.length);
			this.doc.querySelectorAll("iframe, frame, object[type=\"text/html\"][data]").forEach(element => element.remove());
		}

		removeImports() {
			const importElements = this.doc.querySelectorAll("link[rel=import]");
			this.stats.set("discarded", "HTML imports", importElements.length);
			this.stats.set("processed", "HTML imports", importElements.length);
			importElements.forEach(element => element.remove());
		}

		resetCharsetMeta() {
			let charSet;
			this.doc.querySelectorAll("meta[charset], meta[http-equiv=\"content-type\"]").forEach(element => {
				const charSetDeclaration = element.content.split(";")[1];
				if (charSetDeclaration && !charSet) {
					charSet = charSetDeclaration.split("=")[1];
					if (charSet) {
						this.charSet = charSet.trim().toLowerCase();
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

		resolveHrefs() {
			this.doc.querySelectorAll("[href]").forEach(element => {
				if (element.href) {
					const href = element.href.baseVal ? element.href.baseVal : element.href;
					const normalizedHref = DomUtil.normalizeURL(href);
					if (normalizedHref == href && href) {
						element.setAttribute("href", href);
					}
				}
			});
		}

		removeUnusedStyles() {
			if (!this.mediaAllInfo) {
				this.mediaAllInfo = DOM.getMediaAllInfo(this.doc);
			}
			const stats = DOM.minifyCSS(this.doc, this.mediaAllInfo);
			this.stats.set("processed", "CSS rules", stats.processed);
			this.stats.set("discarded", "CSS rules", stats.discarded);
		}

		removeUnusedFonts() {
			DOM.removeUnusedFonts(this.doc, this.options);
		}

		removeAlternativeFonts() {
			DOM.removeAlternativeFonts(this.doc);
		}

		removeAlternativeImages() {
			DOM.removeAlternativeImages(this.doc);
		}

		removeHiddenElements() {
			const hiddenElements = this.doc.querySelectorAll("[" + DOM.removedContentAttributeName(this.options.sessionId) + "]");
			this.stats.set("discarded", "hidden elements", hiddenElements.length);
			this.stats.set("processed", "hidden elements", hiddenElements.length);
			hiddenElements.forEach(element => element.remove());
		}

		compressHTML() {
			let size;
			if (this.options.displayStats) {
				size = DOM.getContentSize(this.doc.documentElement.outerHTML);
			}
			DOM.minifyHTML(this.doc, { preservedSpaceAttributeName: DOM.preservedSpaceAttributeName(this.options.sessionId) });
			if (this.options.displayStats) {
				this.stats.add("discarded", "HTML bytes", size - DOM.getContentSize(this.doc.documentElement.outerHTML));
			}
		}

		removeAlternativeMedias() {
			const stats = DOM.minifyMedias(this.doc);
			this.stats.set("processed", "medias", stats.processed);
			this.stats.set("discarded", "medias", stats.discarded);
		}

		compressCSS() {
			this.doc.querySelectorAll("style").forEach(styleElement => {
				if (styleElement) {
					styleElement.textContent = DOM.compressCSS(styleElement.textContent);
				}
			});
			this.doc.querySelectorAll("[style]").forEach(element => {
				element.setAttribute("style", DOM.compressCSS(element.getAttribute("style")));
			});
		}

		insertSingleFileComment() {
			const commentNode = this.doc.createComment("\n Archive processed by SingleFile \n url: " + this.options.url + " \n saved date: " + new Date() + " \n");
			this.doc.documentElement.insertBefore(commentNode, this.doc.documentElement.firstChild);
		}

		replaceCanvasElements() {
			if (this.options.canvasData) {
				this.doc.querySelectorAll("canvas").forEach((canvasElement, indexCanvasElement) => {
					const canvasData = this.options.canvasData[indexCanvasElement];
					if (canvasData) {
						DomProcessorHelper.setBackgroundImage(canvasElement, "url(" + canvasData.dataURI + ")");
						this.stats.add("processed", "canvas", 1);
					}
				});
			}
		}

		insertFonts() {
			if (this.options.fontsData && this.options.fontsData.length) {
				let stylesheetContent = "";
				this.options.fontsData.forEach(fontStyles => {
					if (fontStyles["font-family"] && fontStyles.src) {
						stylesheetContent += "@font-face{";
						let stylesContent = "";
						Object.keys(fontStyles).forEach(fontStyle => {
							if (stylesContent) {
								stylesContent += ";";
							}
							stylesContent += fontStyle + ":" + fontStyles[fontStyle];
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

		replaceStyleContents() {
			if (this.options.stylesheetContents) {
				this.doc.querySelectorAll("style").forEach((styleElement, styleIndex) => {
					if (this.options.stylesheetContents[styleIndex]) {
						styleElement.textContent = this.options.stylesheetContents[styleIndex];
					}
				});
			}
		}

		insertVideoPosters() {
			if (this.options.postersData) {
				this.doc.querySelectorAll("video[src], video > source[src]").forEach((element, videoIndex) => {
					let videoElement;
					if (element.tagName == "VIDEO") {
						videoElement = element;
					} else {
						videoElement = element.parentElement;
					}
					if (!videoElement.poster && this.options.postersData[videoIndex]) {
						videoElement.setAttribute("poster", this.options.postersData[videoIndex]);
					}
				});
			}
		}

		async processPageResources() {
			const resourcePromises = [
				DomProcessorHelper.processAttribute(this.doc, this.doc.querySelectorAll("link[href][rel*=\"icon\"]"), "href", "data:", this.baseURI, this.options, this.batchRequest, false, true),
				DomProcessorHelper.processAttribute(this.doc, this.doc.querySelectorAll("object[type=\"image/svg+xml\"], object[type=\"image/svg-xml\"]"), "data", PREFIX_DATA_URI_IMAGE_SVG, this.baseURI, this.options, this.batchRequest),
				DomProcessorHelper.processAttribute(this.doc, this.doc.querySelectorAll("img[src], input[src][type=image]"), "src", PREFIX_DATA_URI_IMAGE, this.baseURI, this.options, this.batchRequest, true),
				DomProcessorHelper.processAttribute(this.doc, this.doc.querySelectorAll("embed[src*=\".svg\"]"), "src", PREFIX_DATA_URI_IMAGE_SVG, this.baseURI, this.options, this.batchRequest),
				DomProcessorHelper.processAttribute(this.doc, this.doc.querySelectorAll("video[poster]"), "poster", PREFIX_DATA_URI_IMAGE, this.baseURI, this.options, this.batchRequest),
				DomProcessorHelper.processAttribute(this.doc, this.doc.querySelectorAll("*[background]"), "background", PREFIX_DATA_URI_IMAGE, this.baseURI, this.options, this.batchRequest),
				DomProcessorHelper.processAttribute(this.doc, this.doc.querySelectorAll("image"), "xlink:href", PREFIX_DATA_URI_IMAGE, this.baseURI, this.options, this.batchRequest),
				DomProcessorHelper.processXLinks(this.doc.querySelectorAll("use"), this.baseURI, this.options, this.batchRequest),
				DomProcessorHelper.processSrcset(this.doc.querySelectorAll("img[srcset], source[srcset]"), "srcset", PREFIX_DATA_URI_IMAGE, this.baseURI, this.options, this.batchRequest)
			];
			if (!this.options.removeAudioSrc) {
				resourcePromises.push(DomProcessorHelper.processAttribute(this.doc, this.doc.querySelectorAll("audio[src], audio > source[src]"), "src", PREFIX_DATA_URI_AUDIO, this.baseURI, this.options, this.batchRequest));
			}
			if (!this.options.removeVideoSrc) {
				resourcePromises.push(DomProcessorHelper.processAttribute(this.doc, this.doc.querySelectorAll("video[src], video > source[src]"), "src", PREFIX_DATA_URI_VIDEO, this.baseURI, this.options, this.batchRequest));
			}
			await Promise.all(resourcePromises);
			if (this.options.removeAlternativeImages) {
				let shortcutIcon = findShortcutIcon(Array.from(this.doc.querySelectorAll("link[href][rel=\"icon\"], link[href][rel=\"shortcut icon\"]")));
				if (!shortcutIcon) {
					shortcutIcon = findShortcutIcon(Array.from(this.doc.querySelectorAll("link[href][rel*=\"icon\"]")));
					if (shortcutIcon) {
						shortcutIcon.rel = "icon";
					}
				}
				if (shortcutIcon) {
					this.doc.querySelectorAll("link[href][rel*=\"icon\"]").forEach(linkElement => {
						if (linkElement != shortcutIcon) {
							linkElement.remove();
						}
					});
				}
			}

			function findShortcutIcon(shortcutIcons) {
				shortcutIcons = shortcutIcons.filter(linkElement => linkElement.href != EMPTY_IMAGE);
				shortcutIcons.sort((linkElement1, linkElement2) => (parseInt(linkElement2.sizes, 10) || 16) - (parseInt(linkElement1.sizes, 10) || 16));
				return shortcutIcons[0];
			}
		}

		async resolveStylesheetURLs() {
			await Promise.all(Array.from(this.doc.querySelectorAll("style"))
				.map(async styleElement => {
					const options = { url: this.options.url, maxResourceSize: this.options.maxResourceSize, maxResourceSizeEnabled: this.options.maxResourceSizeEnabled };
					const textContent = await DomProcessorHelper.resolveImportURLs(styleElement.textContent, this.baseURI, options);
					styleElement.textContent = textContent;
				}));
		}

		async processStylesheets() {
			await Promise.all(Array.from(this.doc.querySelectorAll("style")).map(async styleElement => {
				this.stats.add("processed", "stylesheets", 1);
				if (styleElement.sheet) {
					styleElement.textContent = await DomProcessorHelper.processStylesheet(this.doc, styleElement.textContent, styleElement.sheet.cssRules, this.baseURI, this.options, this.batchRequest);
				} else {
					styleElement.remove();
				}
			}));
		}

		async processScripts() {
			await Promise.all(Array.from(this.doc.querySelectorAll("script[src]")).map(async scriptElement => {
				if (scriptElement.src) {
					this.stats.add("processed", "scripts", 1);
					const scriptContent = await Download.getContent(scriptElement.src, { asDataURI: false, maxResourceSize: this.options.maxResourceSize, maxResourceSizeEnabled: this.options.maxResourceSizeEnabled });
					scriptElement.textContent = scriptContent.replace(/<\/script>/gi, "<\\/script>");
				}
				scriptElement.removeAttribute("src");
			}));
		}

		async resolveFrameURLs() {
			if (this.options.framesData) {
				const frameElements = Array.from(this.doc.querySelectorAll("iframe, frame, object[type=\"text/html\"][data]"));
				await Promise.all(frameElements.map(async frameElement => {
					DomProcessorHelper.setFrameEmptySrc(frameElement);
					const frameWindowId = frameElement.getAttribute(DOM.windowIdAttributeName(this.options.sessionId));
					if (frameWindowId) {
						const frameData = this.options.framesData.find(frame => frame.windowId == frameWindowId);
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
					options.canvasData = frameData.canvasData;
					options.stylesheetContents = frameData.stylesheetContents;
					options.fontsData = frameData.fontsData;
					options.imageData = frameData.imageData;
					options.usedFonts = frameData.usedFonts;
					frameData.processor = new PageProcessor(options);
					frameData.frameElement = frameElement;
					await frameData.processor.loadPage();
					await frameData.processor.initialize();
					frameData.maxResources = batchRequest.getMaxResources();
				}
			}
		}

		async processFrames() {
			if (this.options.framesData) {
				const frameElements = Array.from(this.doc.querySelectorAll("iframe, frame, object[type=\"text/html\"][data]"));
				await Promise.all(frameElements.map(async frameElement => {
					const frameWindowId = frameElement.getAttribute(DOM.windowIdAttributeName(this.options.sessionId));
					if (frameWindowId) {
						const frameData = this.options.framesData.find(frame => frame.windowId == frameWindowId);
						if (frameData) {
							if (frameData.processor) {
								this.stats.add("processed", "frames", 1);
								await frameData.processor.run();
								const pageData = await frameData.processor.getPageData();
								frameElement.removeAttribute(DOM.windowIdAttributeName(this.options.sessionId));
								if (pageData.content.match(NOSCRIPT_TAG_FOUND) || pageData.content.match(SCRIPT_TAG_FOUND)) {
									frameElement.setAttribute("sandbox", "allow-scripts allow-same-origin");
								} else {
									frameElement.setAttribute("sandbox", "");
								}
								DomProcessorHelper.setFrameContent(frameElement, pageData.content);
								this.stats.addAll(pageData);
							} else {
								this.stats.add("discarded", "frames", 1);
							}
						}
					}
				}));
			}
		}

		async resolveHtmlImportURLs() {
			const linkElements = Array.from(this.doc.querySelectorAll("link[rel=import][href]"));
			if (!this.relImportProcessors) {
				this.relImportProcessors = new Map();
			}
			await Promise.all(linkElements.map(async linkElement => {
				const resourceURL = linkElement.href;
				linkElement.removeAttribute("href");
				const options = Object.create(this.options);
				options.insertSingleFileComment = false;
				options.insertFaviconLink = false;
				options.doc = null;
				options.win = null;
				options.url = resourceURL;
				if (!DomUtil.testIgnoredPath(resourceURL) && DomUtil.testValidPath(resourceURL, this.baseURI, this.options.url)) {
					const processor = new PageProcessor(options);
					this.relImportProcessors.set(linkElement, processor);
					await processor.loadPage();
					return processor.initialize();
				}
			}));
		}

		async processHtmlImports() {
			const linkElements = Array.from(this.doc.querySelectorAll("link[rel=import][href]"));
			await Promise.all(linkElements.map(async linkElement => {
				const processor = this.relImportProcessors.get(linkElement);
				if (processor) {
					this.stats.add("processed", "HTML imports", 1);
					this.relImportProcessors.delete(linkElement);
					const pageData = await processor.getPageData();
					linkElement.setAttribute("href", "data:text/html," + pageData.content);
					this.stats.addAll(pageData);
				} else {
					this.stats.add("discarded", "HTML imports", 1);
				}
			}));
		}

		resolveStyleAttributeURLs() {
			Array.from(this.doc.querySelectorAll("[style]"))
				.map(element => element.setAttribute("style", DomProcessorHelper.resolveStylesheetURLs(element.getAttribute("style"), this.baseURI, this.options)));
		}

		async processStyleAttributes() {
			await Promise.all(Array.from(this.doc.querySelectorAll("[style]"))
				.map(async element => {
					const rules = [{ type: CSSRule.STYLE_RULE, cssText: element.getAttribute("style") }];
					const textContent = await DomProcessorHelper.processStylesheet(this.doc, element.getAttribute("style"), rules, this.baseURI, this.options, this.batchRequest);
					element.setAttribute("style", textContent);
				}));
		}

		async resolveLinkedStylesheetURLs() {
			await Promise.all(Array.from(this.doc.querySelectorAll("link[rel*=stylesheet]")).map(async linkElement => {
				const options = { maxResourceSize: this.options.maxResourceSize, maxResourceSizeEnabled: this.options.maxResourceSizeEnabled, charSet: this.charSet };
				const stylesheetContent = await DomProcessorHelper.resolveLinkStylesheetURLs(linkElement.href, this.baseURI, options);
				if (stylesheetContent) {
					const styleElement = this.doc.createElement("style");
					if (linkElement.media) {
						styleElement.media = linkElement.media;
					}
					if (linkElement.rel) {
						styleElement.rel = linkElement.rel;
					}
					if (linkElement.title) {
						styleElement.title = linkElement.title;
					}
					styleElement.textContent = stylesheetContent;
					linkElement.parentElement.replaceChild(styleElement, linkElement);
				} else {
					linkElement.remove();
				}
			}));
		}
	}

	// ---------
	// DomHelper
	// ---------
	const REGEXP_AMP = /&/g;
	const REGEXP_NBSP = /\u00a0/g;
	const REGEXP_START_TAG = /</g;
	const REGEXP_END_TAG = />/g;
	const REGEXP_URL_HASH = /(#.+?)$/;
	const PREFIX_DATA_URI_IMAGE = "data:image/";
	const PREFIX_DATA_URI_AUDIO = "data:audio/";
	const PREFIX_DATA_URI_VIDEO = "data:video/";
	const PREFIX_DATA_URI_IMAGE_SVG = "data:image/svg+xml";
	const PREFIX_DATA_URI_NO_MIMETYPE = "data:;";
	const PREFIX_DATA_URI_OCTET_STREAM = /^data:(application|binary)\/octet-stream/;
	const PREFIX_DATA_URI_VND = "data:application/vnd.";
	const SINGLE_FILE_VARIABLE_NAME_PREFIX = "--sf-img-";

	class DomProcessorHelper {
		static async getFilename(options, content) {
			let filename = options.filenameTemplate;
			const date = new Date();
			const url = new URL(options.url);
			filename = await DomUtil.evalTemplateVariable(filename, "page-title", () => options.title || "No title");
			filename = await DomUtil.evalTemplateVariable(filename, "page-language", () => options.info.lang || "No language");
			filename = await DomUtil.evalTemplateVariable(filename, "page-description", () => options.info.description || "No description");
			filename = await DomUtil.evalTemplateVariable(filename, "page-author", () => options.info.author || "No author");
			filename = await DomUtil.evalTemplateVariable(filename, "page-creator", () => options.info.creator || "No creator");
			filename = await DomUtil.evalTemplateVariable(filename, "page-publisher", () => options.info.publisher || "No publisher");
			filename = await DomUtil.evalTemplateVariable(filename, "datetime-iso", () => date.toISOString());
			filename = await DomUtil.evalTemplateVariable(filename, "date-iso", () => date.toISOString().split("T")[0]);
			filename = await DomUtil.evalTemplateVariable(filename, "time-iso", () => date.toISOString().split("T")[1].split("Z")[0]);
			filename = await DomUtil.evalTemplateVariable(filename, "date-locale", () => date.toLocaleDateString());
			filename = await DomUtil.evalTemplateVariable(filename, "time-locale", () => date.toLocaleTimeString());
			filename = await DomUtil.evalTemplateVariable(filename, "day-locale", () => String(date.getDate()).padStart(2, "0"));
			filename = await DomUtil.evalTemplateVariable(filename, "month-locale", () => String(date.getMonth() + 1).padStart(2, "0"));
			filename = await DomUtil.evalTemplateVariable(filename, "year-locale", () => String(date.getFullYear()));
			filename = await DomUtil.evalTemplateVariable(filename, "datetime-locale", () => date.toLocaleString());
			filename = await DomUtil.evalTemplateVariable(filename, "datetime-utc", () => date.toUTCString());
			filename = await DomUtil.evalTemplateVariable(filename, "day-utc", () => String(date.getUTCDate()).padStart(2, "0"));
			filename = await DomUtil.evalTemplateVariable(filename, "month-utc", () => String(date.getUTCMonth() + 1).padStart(2, "0"));
			filename = await DomUtil.evalTemplateVariable(filename, "year-utc", () => String(date.getUTCFullYear()));
			filename = await DomUtil.evalTemplateVariable(filename, "hours-locale", () => String(date.getHours()).padStart(2, "0"));
			filename = await DomUtil.evalTemplateVariable(filename, "minutes-locale", () => String(date.getMinutes()).padStart(2, "0"));
			filename = await DomUtil.evalTemplateVariable(filename, "seconds-locale", () => String(date.getSeconds()).padStart(2, "0"));
			filename = await DomUtil.evalTemplateVariable(filename, "hours-utc", () => String(date.getUTCHours()).padStart(2, "0"));
			filename = await DomUtil.evalTemplateVariable(filename, "minutes-utc", () => String(date.getUTCMinutes()).padStart(2, "0"));
			filename = await DomUtil.evalTemplateVariable(filename, "seconds-utc", () => String(date.getUTCSeconds()).padStart(2, "0"));
			filename = await DomUtil.evalTemplateVariable(filename, "url-hash", () => url.hash.substring(1));
			filename = await DomUtil.evalTemplateVariable(filename, "url-host", () => url.host.replace(/\/$/, ""));
			filename = await DomUtil.evalTemplateVariable(filename, "url-hostname", () => url.hostname.replace(/\/$/, ""));
			filename = await DomUtil.evalTemplateVariable(filename, "url-href", () => url.href);
			filename = await DomUtil.evalTemplateVariable(filename, "url-password", () => url.password);
			filename = await DomUtil.evalTemplateVariable(filename, "url-pathname", () => url.pathname.replace(/^\//, "").replace(/\/$/, ""), true);
			filename = await DomUtil.evalTemplateVariable(filename, "url-port", () => url.port);
			filename = await DomUtil.evalTemplateVariable(filename, "url-protocol", () => url.protocol);
			filename = await DomUtil.evalTemplateVariable(filename, "url-search", () => url.search.substring(1));
			filename = await DomUtil.evalTemplateVariable(filename, "url-username", () => url.username);
			filename = await DomUtil.evalTemplateVariable(filename, "tab-id", () => String(options.tabId || "No tab id"));
			filename = await DomUtil.evalTemplateVariable(filename, "url-last-segment", () => DomUtil.getLastSegment(url));
			filename = await DomUtil.evalTemplateVariable(filename, "digest-sha-256", async () => DOM.digest("SHA-256", content));
			filename = await DomUtil.evalTemplateVariable(filename, "digest-sha-384", async () => DOM.digest("SHA-384", content));
			filename = await DomUtil.evalTemplateVariable(filename, "digest-sha-512", async () => DOM.digest("SHA-512", content));
			filename = filename.replace(/[~\\?%*:|"<>\x00-\x1f\x7F]+/g, "_"); // eslint-disable-line no-control-regex
			filename = filename.replace(/\.\.\//g, "").replace(/^\/+/, "").replace(/\/+/g, "/").replace(/\/$/, "");
			if (!options.backgroundSave) {
				filename = filename.replace(/\//g, "_");
			}
			if (filename.length > 192) {
				const extensionMatch = filename.match(/(\.[^.]{3,4})$/);
				const extension = extensionMatch && extensionMatch[0] && extensionMatch[0].length > 1 ? extensionMatch[0] : "";
				filename = filename.substring(0, 192 - extension.length) + "…" + extension;
			}
			if (!filename) {
				filename = "Unnamed page";
			}
			return filename;
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

		static setFrameEmptySrc(frameElement) {
			if (frameElement.tagName == "OBJECT") {
				frameElement.setAttribute("data", "data:text/html,");
			} else {
				frameElement.setAttribute("srcdoc", "");
				frameElement.removeAttribute("src");
			}
		}

		static setFrameContent(frameElement, content) {
			if (frameElement.tagName == "OBJECT") {
				frameElement.setAttribute("data", "data:text/html," + content);
			} else {
				frameElement.setAttribute("srcdoc", content);
				frameElement.removeAttribute("src");
			}
		}

		static isolateElements(rootElement) {
			rootElement.querySelectorAll("*:not(style)").forEach(element => {
				if (element.getAttribute(SELECTED_CONTENT_ATTRIBUTE_NAME) == "") {
					element.removeAttribute(SELECTED_CONTENT_ATTRIBUTE_NAME);
				} else if (!element.querySelector("[" + SELECTED_CONTENT_ATTRIBUTE_NAME + "]")) {
					element.remove();
				}
			});
			isolateParentElements(rootElement.parentElement, rootElement);

			function isolateParentElements(parentElement, element) {
				let elementFound = false;
				Array.from(parentElement.childNodes).forEach(node => {
					elementFound = elementFound || (node == element);
					const tagName = node.tagName && node.tagName.toLowerCase();
					if (node != element && tagName != "svg" && tagName != "style" && tagName != "link") {
						if (elementFound) {
							node.remove();
						} else {
							node.hidden = true;
							if (node.childNodes && node.childNodes.length) {
								Array.from(node.childNodes).forEach(node => node.remove());
							}
						}
					}
				});
				element = element.parentElement;
				if (element && element.parentElement && element.parentElement.tagName != "HTML") {
					isolateParentElements(element.parentElement, element);
				}
			}
		}

		static async resolveImportURLs(stylesheetContent, baseURI, options) {
			stylesheetContent = DomProcessorHelper.resolveStylesheetURLs(stylesheetContent, baseURI, options);
			stylesheetContent = DomUtil.removeCssComments(stylesheetContent);
			const imports = DomUtil.getImportFunctions(stylesheetContent);
			await Promise.all(imports.map(async cssImport => {
				const match = DomUtil.matchImport(cssImport);
				if (match) {
					let resourceURL = DomUtil.normalizeURL(match.resourceURL);
					if (!DomUtil.testIgnoredPath(resourceURL) && DomUtil.testValidPath(resourceURL, baseURI, options.url)) {
						resourceURL = new URL(match.resourceURL, baseURI).href;
						if (DomUtil.testValidURL(resourceURL, baseURI, options.url)) {
							const downloadOptions = { asDataURI: false, maxResourceSize: options.maxResourceSize, maxResourceSizeEnabled: options.maxResourceSizeEnabled, validateTextContentType: true };
							let importedStylesheetContent = await Download.getContent(resourceURL, downloadOptions);
							importedStylesheetContent = DomUtil.wrapMediaQuery(importedStylesheetContent, match.media);
							if (stylesheetContent.includes(cssImport)) {
								importedStylesheetContent = await DomProcessorHelper.resolveImportURLs(importedStylesheetContent, resourceURL, options);
								stylesheetContent = stylesheetContent.replace(DomUtil.getRegExp(cssImport), importedStylesheetContent);
							}
						}
					}
				}
			}));
			return stylesheetContent;
		}

		static resolveStylesheetURLs(stylesheetContent, baseURI, options) {
			const urlFunctions = DomUtil.getUrlFunctions(stylesheetContent);
			urlFunctions.map(urlFunction => {
				const originalResourceURL = DomUtil.matchURL(urlFunction);
				const resourceURL = DomUtil.normalizeURL(originalResourceURL);
				if (!DomUtil.testIgnoredPath(resourceURL)) {
					if (DomUtil.testValidPath(resourceURL, baseURI, options.url)) {
						const resolvedURL = new URL(resourceURL, baseURI).href;
						if (DomUtil.testValidURL(resolvedURL, baseURI, options.url) && resourceURL != resolvedURL && stylesheetContent.includes(urlFunction)) {
							stylesheetContent = stylesheetContent.replace(DomUtil.getRegExp(urlFunction), urlFunction.replace(originalResourceURL, resolvedURL));
						}
					}
				} else {
					if (resourceURL.startsWith(DATA_URI_PREFIX)) {
						const escapedResourceURL = resourceURL.replace(REGEXP_AMP, "&amp;").replace(REGEXP_NBSP, "&nbsp;").replace(REGEXP_START_TAG, "&lt;").replace(REGEXP_END_TAG, "&gt;");
						if (escapedResourceURL != resourceURL && stylesheetContent.includes(urlFunction)) {
							stylesheetContent = stylesheetContent.replace(DomUtil.getRegExp(urlFunction), urlFunction.replace(originalResourceURL, escapedResourceURL));
						}
					}
				}
			});
			return stylesheetContent;
		}

		static async resolveLinkStylesheetURLs(resourceURL, baseURI, options) {
			resourceURL = DomUtil.normalizeURL(resourceURL);
			if (resourceURL && resourceURL != baseURI && resourceURL != ABOUT_BLANK_URI) {
				const downloadOptions = { asDataURI: false, maxResourceSize: options.maxResourceSize, maxResourceSizeEnabled: options.maxResourceSizeEnabled, charSet: options.charSet };
				let stylesheetContent = await Download.getContent(resourceURL, downloadOptions);
				stylesheetContent = await DomProcessorHelper.resolveImportURLs(stylesheetContent, resourceURL, options);
				return stylesheetContent;
			}
		}

		static async processStylesheet(doc, stylesheetContent, cssRules, baseURI, options, batchRequest) {
			const urlFunctions = getURLFunctions(cssRules);
			await Promise.all([
				Promise.all(urlFunctions.style.map(urlFunction => processURLFunction(urlFunction))),
				Promise.all(urlFunctions.font.map(urlFunction => processURLFunction(urlFunction, true)))]);
			return stylesheetContent;

			async function processURLFunction(urlFunction, isFont) {
				const originalResourceURL = DomUtil.matchURL(urlFunction);
				const resourceURL = DomUtil.normalizeURL(originalResourceURL);
				if (!DomUtil.testIgnoredPath(resourceURL)) {
					if (DomUtil.testValidURL(resourceURL, baseURI, options.url)) {
						let { content, indexResource, duplicate } = await batchRequest.addURL(resourceURL);
						const validResource = !isFont || content == EMPTY_DATA_URI || content.startsWith(PREFIX_DATA_URI_VND) || content.startsWith(PREFIX_DATA_URI_IMAGE_SVG) || await DOM.validFont(urlFunction);
						if (!validResource) {
							content = EMPTY_DATA_URI;
						}
						let regExpUrlFunction = DomUtil.getRegExp(urlFunction);
						if (!stylesheetContent.match(regExpUrlFunction)) {
							urlFunction = "url(" + originalResourceURL + ")";
							regExpUrlFunction = DomUtil.getRegExp(urlFunction);
						}
						if (!stylesheetContent.match(regExpUrlFunction)) {
							urlFunction = "url('" + originalResourceURL + "')";
							regExpUrlFunction = DomUtil.getRegExp(urlFunction);
						}
						if (stylesheetContent.match(regExpUrlFunction)) {
							if (duplicate && options.groupDuplicateImages && !isFont) {
								stylesheetContent = stylesheetContent.replace(regExpUrlFunction, "var(" + SINGLE_FILE_VARIABLE_NAME_PREFIX + indexResource + ")");
								DomUtil.insertVariable(doc, indexResource, content, options);
							} else {
								stylesheetContent = stylesheetContent.replace(regExpUrlFunction, urlFunction.replace(originalResourceURL, content));
							}
						}
					}
				}
			}

			function getURLFunctions(cssRules, urlFunctions = { style: [], font: [] }) {
				Array.from(cssRules).forEach(cssRule => {
					if (cssRule.type == CSSRule.MEDIA_RULE) {
						getURLFunctions(cssRule.cssRules, urlFunctions);
					} else if (cssRule.type == CSSRule.FONT_FACE_RULE) {
						getURLFunctionsRule(cssRule.cssText, urlFunctions.font);
					} else {
						getURLFunctionsRule(cssRule.cssText, urlFunctions.style);
					}
				});
				return { style: Array.from(urlFunctions.style), font: Array.from(urlFunctions.font) };
			}

			function getURLFunctionsRule(cssText, urlFunctions) {
				const urlFunctionsRule = DomUtil.getUrlFunctions(cssText);
				urlFunctionsRule.forEach(urlFunction => {
					const originalResourceURL = DomUtil.matchURL(urlFunction);
					const resourceURL = DomUtil.normalizeURL(originalResourceURL);
					if (!DomUtil.testIgnoredPath(resourceURL)) {
						if (DomUtil.testValidURL(resourceURL, baseURI, options.url) && cssText.includes(urlFunction)) {
							urlFunctions.push(urlFunction);
						}
					}
				});
				return urlFunctions;
			}
		}

		static async processAttribute(doc, resourceElements, attributeName, prefixDataURI, baseURI, options, batchRequest, processDuplicates, removeElementIfMissing) {
			await Promise.all(Array.from(resourceElements).map(async resourceElement => {
				let resourceURL = resourceElement.getAttribute(attributeName);
				resourceURL = DomUtil.normalizeURL(resourceURL);
				if (!DomUtil.testIgnoredPath(resourceURL)) {
					resourceElement.setAttribute(attributeName, EMPTY_IMAGE);
					if (DomUtil.testValidPath(resourceURL, baseURI, options.url)) {
						resourceURL = new URL(resourceURL, baseURI).href;
						if (DomUtil.testValidURL(resourceURL, baseURI, options.url)) {
							const { content, indexResource, duplicate } = await batchRequest.addURL(resourceURL);
							if (removeElementIfMissing && content == EMPTY_DATA_URI) {
								resourceElement.remove();
							} else {
								if (content.startsWith(prefixDataURI) || content.startsWith(PREFIX_DATA_URI_NO_MIMETYPE) || content.match(PREFIX_DATA_URI_OCTET_STREAM)) {
									const isSVG = content.startsWith(PREFIX_DATA_URI_IMAGE_SVG);
									if (processDuplicates && duplicate && options.groupDuplicateImages && !isSVG) {
										if (DomUtil.replaceImageSource(resourceElement, SINGLE_FILE_VARIABLE_NAME_PREFIX + indexResource, options)) {
											DomUtil.insertVariable(doc, indexResource, content, options);
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
			await Promise.all(Array.from(resourceElements).map(async resourceElement => {
				const originalResourceURL = resourceElement.getAttribute(attributeName);
				let resourceURL = DomUtil.normalizeURL(originalResourceURL);
				if (DomUtil.testValidPath(resourceURL, baseURI, options.url) && !DomUtil.testIgnoredPath(resourceURL)) {
					resourceElement.setAttribute(attributeName, EMPTY_IMAGE);
					resourceURL = new URL(resourceURL, baseURI).href;
					if (DomUtil.testValidURL(resourceURL, baseURI, options.url)) {
						try {
							const { content } = await batchRequest.addURL(resourceURL, false);
							const DOMParser = DOM.getParser();
							if (DOMParser) {
								let svgDoc = new DOMParser().parseFromString(content, "image/svg+xml");
								const hashMatch = originalResourceURL.match(REGEXP_URL_HASH);
								if (hashMatch && hashMatch[0]) {
									const symbolElement = svgDoc.querySelector(hashMatch[0]);
									if (symbolElement) {
										resourceElement.setAttribute(attributeName, hashMatch[0]);
										resourceElement.parentElement.insertBefore(symbolElement, resourceElement.parentElement.firstChild);
									}
								} else {
									resourceElement.setAttribute(attributeName, "data:image/svg+xml," + content);
								}
							} else {
								resourceElement.setAttribute(attributeName, "data:image/svg+xml," + content);
							}
						} catch (error) {
							/* ignored */
						}
					}
				} else if (resourceURL == options.url) {
					resourceElement.setAttribute(attributeName, originalResourceURL.substring(resourceURL.length));
				}
			}));
		}

		static async processSrcset(resourceElements, attributeName, prefixDataURI, baseURI, options, batchRequest) {
			await Promise.all(Array.from(resourceElements).map(async resourceElement => {
				const srcset = DOM.parseSrcset(resourceElement.getAttribute(attributeName));
				const srcsetValues = await Promise.all(srcset.map(async srcsetValue => {
					let resourceURL = DomUtil.normalizeURL(srcsetValue.url);
					if (!DomUtil.testIgnoredPath(resourceURL)) {
						if (DomUtil.testValidPath(resourceURL, baseURI, options.url)) {
							resourceURL = new URL(resourceURL, baseURI).href;
							if (DomUtil.testValidURL(resourceURL, baseURI, options.url)) {
								const { content } = await batchRequest.addURL(resourceURL);
								if (!content.startsWith(prefixDataURI) && !content.startsWith(PREFIX_DATA_URI_NO_MIMETYPE) && !content.match(PREFIX_DATA_URI_OCTET_STREAM)) {
									resourceElement.setAttribute(attributeName, EMPTY_IMAGE);
								}
								return content + (srcsetValue.w ? " " + srcsetValue.w + "w" : srcsetValue.d ? " " + srcsetValue.d + "x" : "");
							} else {
								return "";
							}
						} else {
							return "";
						}
					}
				}));
				resourceElement.setAttribute(attributeName, srcsetValues.join(", "));
			}));
		}

	}

	// -------
	// DomUtil
	// -------
	const DATA_URI_PREFIX = "data:";
	const BLOB_URI_PREFIX = "blob:";
	const HTTP_URI_PREFIX = /^https?:\/\//;
	const FILE_URI_PREFIX = /^file:\/\//;
	const EMPTY_URL = /^https?:\/\/+\s*$/;
	const ABOUT_BLANK_URI = "about:blank";
	const NOT_EMPTY_URL = /^(https?|file):\/\/.+/;
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

	class DomUtil {
		static normalizeURL(url) {
			if (!url || url.startsWith(DATA_URI_PREFIX)) {
				return url;
			} else {
				return url.split("#")[0];
			}
		}

		static async evalTemplateVariable(template, variableName, valueGetter, dontReplaceSlash) {
			const replaceRegExp = new RegExp("{\\s*" + variableName + "\\s*}", "g");
			if (template.match(replaceRegExp)) {
				let value = await valueGetter();
				if (!dontReplaceSlash) {
					value = value.replace(/\/+/g, "_");
				}
				return template.replace(replaceRegExp, value);
			}
			return template;
		}

		static getLastSegment(url) {
			let lastSegmentMatch = url.pathname.match(/\/([^/]+)$/), lastSegment = lastSegmentMatch && lastSegmentMatch[0];
			if (!lastSegment) {
				lastSegmentMatch = url.href.match(/([^/]+)\/?$/);
				lastSegment = lastSegmentMatch && lastSegmentMatch[0];
			}
			if (!lastSegment) {
				lastSegmentMatch = lastSegment.match(/(.*)<\.[^.]+$/);
				lastSegment = lastSegmentMatch && lastSegmentMatch[0];
			}
			if (!lastSegment) {
				lastSegment = url.hostname.replace(/\/+/g, "_").replace(/\/$/, "");
			}
			lastSegment.replace(/\/$/, "").replace(/^\//, "");
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

		static matchURL(stylesheetContent) {
			const match = stylesheetContent.match(REGEXP_URL_SIMPLE_QUOTES_FN) ||
				stylesheetContent.match(REGEXP_URL_DOUBLE_QUOTES_FN) ||
				stylesheetContent.match(REGEXP_URL_NO_QUOTES_FN);
			return match && match[1];
		}

		static testIgnoredPath(resourceURL) {
			return resourceURL && (resourceURL.startsWith(DATA_URI_PREFIX) || resourceURL.startsWith(BLOB_URI_PREFIX) || resourceURL == ABOUT_BLANK_URI);
		}

		static testValidPath(resourceURL, baseURI, docURL) {
			return resourceURL && resourceURL != baseURI && resourceURL != docURL && !resourceURL.match(EMPTY_URL);
		}

		static testValidURL(resourceURL, baseURI, docURL) {
			return DomUtil.testValidPath(resourceURL, baseURI, docURL) && (resourceURL.match(HTTP_URI_PREFIX) || resourceURL.match(FILE_URI_PREFIX)) && resourceURL.match(NOT_EMPTY_URL);
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

		static insertVariable(doc, indexResource, content, options) {
			const sheetAttributeName = DOM.sheetAttributeName(options.sessionId);
			let styleElement = doc.querySelector("style[" + sheetAttributeName + "]"), insertedVariables;
			if (!styleElement) {
				styleElement = doc.createElement("style");
				if (doc.head.firstChild) {
					doc.head.insertBefore(styleElement, doc.head.firstChild);
				} else {
					doc.head.appendChild(styleElement);
				}
				styleElement.setAttribute(sheetAttributeName, "[]");
				insertedVariables = [];
			} else {
				insertedVariables = JSON.parse(styleElement.getAttribute(sheetAttributeName));
			}
			if (!insertedVariables.includes(indexResource)) {
				insertedVariables.push(indexResource);
				styleElement.textContent = styleElement.textContent + `:root{${SINGLE_FILE_VARIABLE_NAME_PREFIX + indexResource}:url("${content}")}`;
				styleElement.setAttribute(sheetAttributeName, JSON.stringify(insertedVariables));
			}
		}

		static replaceImageSource(imgElement, variableName, options) {
			const dataAttributeName = DOM.imagesAttributeName(options.sessionId);
			if (imgElement.getAttribute(dataAttributeName) != null) {
				const imgData = options.imageData[Number(imgElement.getAttribute(dataAttributeName))];
				if (imgData.replaceable) {
					imgElement.setAttribute("src", `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${imgData.size.pxWidth}" height="${imgData.size.pxHeight}"><rect fill-opacity="0"/></svg>`);
					const backgroundStyle = {};
					const backgroundSize = (imgData.objectFit == "content" || imgData.objectFit == "cover") && imgData.objectFit;
					if (backgroundSize) {
						backgroundStyle["background-size"] = imgData.objectFit;
					}
					if (imgData.objectPosition) {
						backgroundStyle["background-position"] = imgData.objectPosition;
					}
					if (imgData.backgroundColor) {
						backgroundStyle["background-color"] = imgData.backgroundColor;
					}
					DomProcessorHelper.setBackgroundImage(imgElement, "var(" + variableName + ")", backgroundStyle);
					imgElement.removeAttribute(dataAttributeName);
					return true;
				}
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