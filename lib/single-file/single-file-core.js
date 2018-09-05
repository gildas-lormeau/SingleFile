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

this.SingleFileCore = this.SingleFileCore || (() => {

	const SELECTED_CONTENT_ATTRIBUTE_NAME = "data-single-file-selected-content";
	const SELECTED_CONTENT_ROOT_ATTRIBUTE_NAME = "data-single-file-selected-content-root";

	let Download, DOM, URL, sessionId = 0;

	function getClass(...args) {
		[Download, DOM, URL] = args;
		return class {
			constructor(options) {
				this.options = options;
				options.sessionId = sessionId;
				sessionId++;
				this.SELECTED_CONTENT_ATTRIBUTE_NAME = SELECTED_CONTENT_ATTRIBUTE_NAME;
				this.SELECTED_CONTENT_ROOT_ATTRIBUTE_NAME = SELECTED_CONTENT_ROOT_ATTRIBUTE_NAME;
			}
			async initialize() {
				this.processor = new PageProcessor(this.options);
				await this.processor.loadPage();
				await this.processor.initialize();
			}
			async preparePageData() {
				await this.processor.preparePageData();
			}
			getPageData() {
				return this.processor.getPageData();
			}
		};
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

	class ProgressEvent {
		constructor(type, details) {
			return { type, details, PAGE_LOADING, PAGE_LOADED, RESOURCES_INITIALIZING, RESOURCES_INITIALIZED, RESOURCE_LOADED, PAGE_ENDED };
		}
	}

	// -------------
	// PageProcessor
	// -------------
	const STAGES = [{
		sync: [
			{ action: "removeUIElements" },
			{ action: "replaceStyleContents" },
			{ option: "removeSrcSet", action: "removeSrcSet" },
			{ option: "removeFrames", action: "removeFrames" },
			{ option: "removeImports", action: "removeImports" },
			{ option: "removeScripts", action: "removeScripts" },
			{ action: "removeDiscardedResources" },
			{ action: "resetCharsetMeta" },
			{ option: "compressHTML", action: "compressHTML" },
			{ option: "insertFaviconLink", action: "insertFaviconLink" },
			{ action: "resolveHrefs" },
			{ action: "replaceCanvasElements" },
			{ option: "removeHiddenElements", action: "removeHiddenElements" }
		],
		async: [
			{ action: "inlineStylesheets" },
			{ action: "linkStylesheets" },
			{ action: "attributeStyles" },
			{ option: "!removeFrames", action: "frames" },
			{ option: "!removeImports", action: "htmlImports" }
		]
	}, {
		sync: [
			{ option: "removeUnusedStyles", action: "removeUnusedStyles" },
			{ option: "compressHTML", action: "compressHTML" },
			{ option: "removeAlternativeFonts", action: "removeAlternativeFonts" },
			{ option: "compressCSS", action: "compressCSS" },
		],
		async: [
			{ action: "inlineStylesheets" },
			{ action: "attributeStyles" },
			{ action: "pageResources" },
			{ option: "!removeScripts", action: "scripts" }
		]
	}, {
		sync: [
			{ option: "lazyLoadImages", action: "lazyLoadImages" },
			{ option: "removeAlternativeFonts", action: "postRemoveAlternativeFonts" }
		],
		async: [
			{ option: "!removeFrames", action: "frames" },
			{ option: "!removeImports", action: "htmlImports" },
		]
	}, {
		sync: [
			{ option: "compressHTML", action: "postCompressHTML" },
			{ option: "insertSingleFileComment", action: "insertSingleFileComment" },
			{ action: "removeDefaultHeadTags" }
		]
	}];

	class PageProcessor {
		constructor(options) {
			this.options = options;
			this.options.url = this.options.url || this.options.doc.location.href;
			this.processor = new DOMProcessor(options);
			if (this.options.doc) {
				const docData = DOM.preProcessDoc(this.options.doc, this.options.win, this.options);
				this.options.canvasData = docData.canvasData;
				this.options.stylesheetContents = docData.stylesheetContents;
				this.options.imageData = docData.imageData;
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
			await this.executeStage(0);
			this.pendingPromises = this.executeStage(1);
			if (this.options.doc) {
				DOM.postProcessDoc(this.options.doc, this.options);
				this.options.doc = null;
				this.options.win = null;
			}
			this.onprogress(new ProgressEvent(RESOURCES_INITIALIZED, { pageURL: this.options.url, index: 0, max: batchRequest.getMaxResources() }));
		}

		async preparePageData() {
			if (!this.options.windowId) {
				await this.processor.retrieveResources(
					details => {
						details.pageURL = this.options.url;
						this.onprogress(new ProgressEvent(RESOURCE_LOADED, details));
					});
			}
			await this.pendingPromises;
			await this.executeStage(2);
			await this.executeStage(3);
		}

		getPageData() {
			this.onprogress(new ProgressEvent(PAGE_ENDED, { pageURL: this.options.url }));
			return this.processor.getPageData();
		}

		async executeStage(step) {
			STAGES[step].sync.forEach(task => this.executeTask(task, !step));
			if (STAGES[step].async) {
				return Promise.all(STAGES[step].async.map(task => this.executeTask(task, !step)));
			}
		}

		executeTask(task, initialization) {
			if (!task.option || ((task.option.startsWith("!") && !this.options[task.option]) || this.options[task.option])) {
				return this.processor[task.action](initialization);
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
					const dataURI = await Download.getContent(resourceURL, { asDataURI, maxResourceSize: options.maxResourceSize, maxResourceSizeEnabled: options.maxResourceSizeEnabled });
					indexResource = indexResource + 1;
					onloadListener({ index: indexResource, max: resourceURLs.length, url: resourceURL });
					resourceRequests.forEach(resourceRequest => resourceRequest.resolve(dataURI));
				} catch (error) {
					indexResource = indexResource + 1;
					onloadListener({ index: indexResource, max: resourceURLs.length, url: resourceURL });
					resourceRequests.forEach(resourceRequest => resourceRequest.reject(error));
				}
				this.requests.delete(requestKey);
			}));
		}
	}

	// ------------
	// DOMProcessor
	// ------------
	const ESCAPED_FRAGMENT = "_escaped_fragment_=";
	const EMPTY_DATA_URI = "data:base64,";

	const batchRequest = new BatchRequest();

	class DOMProcessor {
		constructor(options) {
			this.options = options;
			this.stats = new Stats(options);
			this.baseURI = DomUtil.normalizeURL(options.url);
		}

		async loadPage(pageContent) {
			if (!pageContent || this.options.saveRawPage) {
				pageContent = await Download.getContent(this.baseURI, { asDataURI: false, maxResourceSize: this.options.maxResourceSize, maxResourceSizeEnabled: this.options.maxResourceSizeEnabled });
			}
			this.doc = DOM.createDoc(pageContent, this.baseURI);
			if (!pageContent && this.doc.querySelector("meta[name=fragment][content=\"!\"]") && !this.baseURI.endsWith("?" + ESCAPED_FRAGMENT) && !this.baseURI.endsWith("&" + ESCAPED_FRAGMENT)) {
				await DOMProcessor.loadEscapedFragmentPage();
			}
		}

		async loadEscapedFragmentPage() {
			if (this.baseURI.includes("?")) {
				this.baseURI += "&";
			} else {
				this.baseURI += "?";
			}
			this.baseURI += ESCAPED_FRAGMENT;
			await this.loadPage();
		}

		async retrieveResources(onloadListener) {
			this.stats.set("processed", "resources", batchRequest.getMaxResources());
			await batchRequest.run(onloadListener, this.options);
		}

		getPageData() {
			DOM.postProcessDoc(this.doc, this.options);
			if (this.options.selected) {
				const rootElement = this.doc.querySelector("[" + SELECTED_CONTENT_ROOT_ATTRIBUTE_NAME + "]");
				if (rootElement) {
					DomProcessorHelper.isolateElements(rootElement);
					rootElement.removeAttribute(SELECTED_CONTENT_ROOT_ATTRIBUTE_NAME);
					rootElement.removeAttribute(SELECTED_CONTENT_ATTRIBUTE_NAME);
				}
			}
			const titleElement = this.doc.querySelector("title");
			let title;
			if (titleElement) {
				title = titleElement.textContent.trim();
			}
			const matchTitle = this.baseURI.match(/([^/]*)\/?(\.html?.*)$/) || this.baseURI.match(/\/\/([^/]*)\/?$/);
			const url = new URL(this.baseURI);
			let size;
			if (this.options.displayStats) {
				size = DOM.getContentSize(this.doc.documentElement.outerHTML);
			}
			const content = DOM.serialize(this.doc, this.options.compressHTML);
			if (this.options.displayStats) {
				const contentSize = DOM.getContentSize(content);
				this.stats.set("processed", "htmlBytes", contentSize);
				this.stats.add("discarded", "htmlBytes", size - contentSize);
			}
			return {
				stats: this.stats.data,
				title: title || (this.baseURI && matchTitle ? matchTitle[1] : (url.hostname ? url.hostname : "Untitled page")),
				content
			};
		}

		lazyLoadImages() {
			DOM.lazyLoad(this.doc);
		}

		removeDiscardedResources() {
			const objectElements = this.doc.querySelectorAll("applet, meta[http-equiv=refresh], object:not([type=\"image/svg+xml\"]):not([type=\"image/svg-xml\"]):not([type=\"text/html\"]), embed:not([src*=\".svg\"])");
			this.stats.set("discarded", "objects", objectElements.length);
			objectElements.forEach(element => element.remove());
			const replacedAttributeValue = this.doc.querySelectorAll("link[rel~=preconnect], link[rel~=prerender], link[rel~=dns-prefetch], link[rel~=preload], link[rel~=prefetch]");
			replacedAttributeValue.forEach(element => element.setAttribute("rel", element.getAttribute("rel").replace(/(preconnect|prerender|dns-prefetch|preload|prefetch)/g, "")));
			this.doc.querySelectorAll("[onload]").forEach(element => element.removeAttribute("onload"));
			this.doc.querySelectorAll("[onerror]").forEach(element => element.removeAttribute("onerror"));
			if (this.options.removeAudioSrc) {
				const audioSourceElements = this.doc.querySelectorAll("audio[src], audio > source[src]");
				this.stats.set("discarded", "audioSource", audioSourceElements.length);
				audioSourceElements.forEach(element => element.removeAttribute("src"));
			}
			if (this.options.removeVideoSrc) {
				const videoSourceElements = this.doc.querySelectorAll("video[src], video > source[src]");
				this.stats.set("discarded", "videoSource", videoSourceElements.length);
				videoSourceElements.forEach(element => element.removeAttribute("src"));
			}
		}

		removeDefaultHeadTags() {
			this.doc.querySelectorAll("base").forEach(element => element.remove());
			if (this.doc.head.querySelectorAll("*").length == 1 && this.doc.head.querySelector("meta[charset]") && this.doc.body.childNodes.length == 0) {
				this.doc.head.querySelector("meta[charset]").remove();
			}
		}

		removeUIElements() {
			this.doc.querySelectorAll("singlefile-infobar, singlefile-mask").forEach(element => element.remove());
		}

		removeScripts() {
			const scriptElements = this.doc.querySelectorAll("script:not([type=\"application/ld+json\"])");
			this.stats.set("discarded", "scripts", scriptElements.length);
			scriptElements.forEach(element => element.remove());
		}

		removeFrames() {
			const frameElements = this.doc.querySelectorAll("iframe, frame, object[type=\"text/html\"][data]");
			this.stats.set("discarded", "frames", frameElements.length);
			this.doc.querySelectorAll("iframe, frame, object[type=\"text/html\"][data]").forEach(element => element.remove());
		}

		removeImports() {
			const importElements = this.doc.querySelectorAll("link[rel=import]");
			this.stats.set("discarded", "imports", importElements.length);
			importElements.forEach(element => element.remove());
		}

		resetCharsetMeta() {
			this.doc.querySelectorAll("meta[charset], meta[http-equiv=\"content-type\"]").forEach(element => element.remove());
			const metaElement = this.doc.createElement("meta");
			metaElement.setAttribute("charset", "utf-8");
			this.doc.head.insertBefore(metaElement, this.doc.head.firstElementChild);
		}

		insertFaviconLink() {
			let faviconElement = this.doc.querySelector("link[href][rel*=\"icon\"]");
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
					const match = href.match(/(.*)#.*$/);
					if (!match || match[1] != this.baseURI) {
						element.setAttribute("href", href);
					}
				}
			});
		}

		removeUnusedStyles() {
			const stats = DOM.minifyCSS(this.doc);
			this.stats.set("processed", "cssRules", stats.processed);
			this.stats.set("discarded", "cssRules", stats.discarded);
		}

		removeAlternativeFonts() {
			DOM.minifyFonts(this.doc);
		}

		removeSrcSet() {
			this.doc.querySelectorAll("picture, img[srcset]").forEach(element => {
				const tagName = element.tagName.toLowerCase();
				const dataAttributeName = DOM.responsiveImagesAttributeName(this.options.sessionId);
				const imageData = this.options.imageData[Number(element.getAttribute(dataAttributeName))];
				element.removeAttribute(dataAttributeName);
				if (imageData) {
					if (tagName == "img") {
						if (imageData.source.src && imageData.source.naturalWidth > 1 && imageData.source.naturalHeight > 1) {
							element.removeAttribute("srcset");
							element.removeAttribute("sizes");
							element.src = imageData.source.src;
						}
					}
					if (tagName == "picture") {
						const imageElement = element.querySelector("img");
						if (imageData.source.src && imageData.source.naturalWidth > 1 && imageData.source.naturalHeight > 1) {
							imageElement.removeAttribute("srcset");
							imageElement.removeAttribute("sizes");
							imageElement.src = imageData.source.src;
							element.querySelectorAll("source").forEach(sourceElement => sourceElement.remove());
						} else {
							if (imageData.sources) {
								element.querySelectorAll("source").forEach(sourceElement => {
									if (!sourceElement.srcset && !sourceElement.dataset.srcset && !sourceElement.src) {
										sourceElement.remove();
									}
								});
								const sourceElements = element.querySelectorAll("source");
								if (sourceElements.length) {
									const lastSourceElement = sourceElements[sourceElements.length - 1];
									if (lastSourceElement.src) {
										imageElement.src = lastSourceElement.src;
									} else {
										imageElement.removeAttribute("src");
									}
									if (lastSourceElement.srcset || lastSourceElement.dataset.srcset) {
										imageElement.srcset = lastSourceElement.srcset || lastSourceElement.dataset.srcset;
									} else {
										imageElement.removeAttribute("srcset");
									}
									element.querySelectorAll("source").forEach(sourceElement => sourceElement.remove());
								}
							}
						}
					}
				}
			});
		}

		postRemoveAlternativeFonts() {
			DOM.minifyFonts(this.doc, true);
			if (this.options.compressCSS) {
				this.compressCSS();
			}
		}

		removeHiddenElements() {
			const hiddenElements = this.doc.querySelectorAll("[" + DOM.removedContentAttributeName(this.options.sessionId) + "]");
			this.stats.set("discarded", "hiddenElements", hiddenElements.length);
			hiddenElements.forEach(element => element.remove());
		}

		compressHTML() {
			let size;
			if (this.options.displayStats) {
				size = DOM.getContentSize(this.doc.documentElement.outerHTML);
			}
			DOM.minifyHTML(this.doc, { preservedSpaceAttributeName: DOM.preservedSpaceAttributeName(this.options.sessionId) });
			if (this.options.displayStats) {
				this.stats.add("discarded", "htmlBytes", size - DOM.getContentSize(this.doc.documentElement.outerHTML));
			}
		}

		postCompressHTML() {
			let size;
			if (this.options.displayStats) {
				size = DOM.getContentSize(this.doc.documentElement.outerHTML);
			}
			DOM.postMinifyHTML(this.doc);
			if (this.options.displayStats) {
				this.stats.add("discarded", "htmlBytes", size - DOM.getContentSize(this.doc.documentElement.outerHTML));
			}
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
			const commentNode = this.doc.createComment("\n Archive processed by SingleFile \n url: " + this.baseURI + " \n saved date: " + new Date() + " \n");
			this.doc.documentElement.insertBefore(commentNode, this.doc.documentElement.firstChild);
		}

		replaceCanvasElements() {
			if (this.options.canvasData) {
				this.doc.querySelectorAll("canvas").forEach((canvasElement, indexCanvasElement) => {
					const canvasData = this.options.canvasData[indexCanvasElement];
					if (canvasData) {
						const imgElement = this.doc.createElement("img");
						imgElement.setAttribute("src", canvasData.dataURI);
						Array.from(canvasElement.attributes).forEach(attribute => {
							if (attribute.value) {
								imgElement.setAttribute(attribute.name, attribute.value);
							}
						});
						if (!imgElement.width && canvasData.width) {
							imgElement.style.pixelWidth = canvasData.width;
						}
						if (!imgElement.height && canvasData.height) {
							imgElement.style.pixelHeight = canvasData.height;
						}
						canvasElement.parentElement.replaceChild(imgElement, canvasElement);
						this.stats.add("processed", "canvas", 1);
					}
				});
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

		async pageResources() {
			const resourcePromises = [
				DomProcessorHelper.processAttribute(this.doc.querySelectorAll("link[href][rel*=\"icon\"]"), "href", this.baseURI),
				DomProcessorHelper.processAttribute(this.doc.querySelectorAll("object[type=\"image/svg+xml\"], object[type=\"image/svg-xml\"]"), "data", this.baseURI),
				DomProcessorHelper.processAttribute(this.doc.querySelectorAll("img[src], input[src][type=image], embed[src*=\".svg\"]"), "src", this.baseURI),
				DomProcessorHelper.processAttribute(this.doc.querySelectorAll("video[poster]"), "poster", this.baseURI),
				DomProcessorHelper.processAttribute(this.doc.querySelectorAll("*[background]"), "background", this.baseURI),
				DomProcessorHelper.processAttribute(this.doc.querySelectorAll("image"), "xlink:href", this.baseURI),
				DomProcessorHelper.processXLinks(this.doc.querySelectorAll("use"), this.baseURI),
				DomProcessorHelper.processSrcset(this.doc.querySelectorAll("[srcset]"), "srcset", this.baseURI)
			];
			if (!this.options.removeAudioSrc) {
				resourcePromises.push(DomProcessorHelper.processAttribute(this.doc.querySelectorAll("audio[src], audio > source[src]"), "src", this.baseURI));
			}
			if (!this.options.removeVideoSrc) {
				resourcePromises.push(DomProcessorHelper.processAttribute(this.doc.querySelectorAll("video[src], video > source[src]"), "src", this.baseURI));
			}
			if (this.options.lazyLoadImages) {
				const imageSelectors = DOM.lazyLoaderImageSelectors();
				Object.keys(imageSelectors.src).forEach(selector => resourcePromises.push(DomProcessorHelper.processAttribute(this.doc.querySelectorAll(selector), imageSelectors.src[selector], this.baseURI)));
				Object.keys(imageSelectors.srcset).forEach(selector => resourcePromises.push(DomProcessorHelper.processSrcset(this.doc.querySelectorAll(selector), imageSelectors.srcset[selector], this.baseURI)));
			}
			await resourcePromises;
		}

		async inlineStylesheets(initialization) {
			await Promise.all(Array.from(this.doc.querySelectorAll("style")).map(async styleElement => {
				if (!initialization) {
					this.stats.add("processed", "styleSheets", 1);
				}
				let stylesheetContent = styleElement.textContent;
				if (initialization) {
					stylesheetContent = await DomProcessorHelper.resolveImportURLs(styleElement.textContent, this.baseURI, { maxResourceSize: this.options.maxResourceSize, maxResourceSizeEnabled: this.options.maxResourceSizeEnabled });
				} else {
					stylesheetContent = await DomProcessorHelper.processStylesheet(styleElement.textContent, this.baseURI);
				}
				styleElement.textContent = stylesheetContent;
			}));
		}

		async scripts() {
			await Promise.all(Array.from(this.doc.querySelectorAll("script[src]")).map(async scriptElement => {
				if (scriptElement.src) {
					this.stats.add("processed", "scripts", 1);
					const scriptContent = await Download.getContent(scriptElement.src, { asDataURI: false, maxResourceSize: this.options.maxResourceSize, maxResourceSizeEnabled: this.options.maxResourceSizeEnabled });
					scriptElement.textContent = scriptContent.replace(/<\/script>/gi, "<\\/script>");
				}
				scriptElement.removeAttribute("src");
			}));
		}

		async frames(initialization) {
			if (this.options.framesData) {
				const frameElements = Array.from(this.doc.querySelectorAll("iframe, frame, object[type=\"text/html\"][data]"));
				await Promise.all(frameElements.map(async frameElement => {
					DomProcessorHelper.setFrameEmptySrc(frameElement);
					frameElement.setAttribute("sandbox", "allow-scripts allow-same-origin");
					const frameWindowId = frameElement.getAttribute(DOM.windowIdAttributeName(this.options.sessionId));
					if (frameWindowId) {
						const frameData = this.options.framesData.find(frame => frame.windowId == frameWindowId);
						if (frameData) {
							if (initialization) {
								const options = Object.create(this.options);
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
									options.currentSrcImages = frameData.currentSrcImages;
									frameData.processor = new PageProcessor(options);
									frameData.frameElement = frameElement;
									await frameData.processor.loadPage();
									return frameData.processor.initialize();
								}
							} else {
								if (frameData.processor) {
									this.stats.add("processed", "frames", 1);
									await frameData.processor.preparePageData();
									const pageData = await frameData.processor.getPageData();
									frameElement.removeAttribute(DOM.windowIdAttributeName(this.options.sessionId));
									DomProcessorHelper.setFrameContent(frameElement, pageData.content);
									this.stats.addAll(pageData);
								} else {
									this.stats.add("discarded", "frames", 1);
								}
							}
						}
					}
				}));
			}
		}

		async htmlImports(initialization) {
			const linkElements = Array.from(this.doc.querySelectorAll("link[rel=import][href]"));
			if (!this.relImportProcessors) {
				this.relImportProcessors = new Map();
			}
			await Promise.all(linkElements.map(async linkElement => {
				if (initialization) {
					const resourceURL = linkElement.href;
					const options = Object.create(this.options);
					options.insertSingleFileComment = false;
					options.insertFaviconLink = false;
					options.doc = null;
					options.win = null;
					options.url = resourceURL;
					if (resourceURL) {
						if (resourceURL && resourceURL != this.baseURI && DomUtil.testValidPath(resourceURL)) {
							const processor = new PageProcessor(options);
							this.relImportProcessors.set(linkElement, processor);
							await processor.loadPage();
							return processor.initialize();
						}
					}
				} else {
					linkElement.setAttribute("href", EMPTY_DATA_URI);
					const processor = this.relImportProcessors.get(linkElement);
					if (processor) {
						this.stats.add("processed", "imports", 1);
						this.relImportProcessors.delete(linkElement);
						const pageData = await processor.getPageData();
						linkElement.setAttribute("href", "data:text/html," + pageData.content);
						this.stats.addAll(pageData);
					} else {
						this.stats.add("discarded", "imports", 1);
					}
				}
			}));
		}

		async attributeStyles(initialization) {
			await Promise.all(Array.from(this.doc.querySelectorAll("[style]")).map(async element => {
				let stylesheetContent = element.getAttribute("style");
				if (initialization) {
					stylesheetContent = DomProcessorHelper.resolveStylesheetURLs(stylesheetContent, this.baseURI);
				} else {
					stylesheetContent = await DomProcessorHelper.processStylesheet(element.getAttribute("style"), this.baseURI);
				}
				element.setAttribute("style", stylesheetContent);
			}));
		}

		async linkStylesheets() {
			await Promise.all(Array.from(this.doc.querySelectorAll("link[rel*=stylesheet]")).map(async linkElement => {
				const stylesheetContent = await DomProcessorHelper.resolveLinkStylesheetURLs(linkElement.href, this.baseURI, linkElement.media, { maxResourceSize: this.options.maxResourceSize, maxResourceSizeEnabled: this.options.maxResourceSizeEnabled });
				const styleElement = this.doc.createElement("style");
				styleElement.textContent = stylesheetContent;
				linkElement.parentElement.replaceChild(styleElement, linkElement);
			}));
		}
	}

	// ---------
	// DomHelper
	// ---------
	class DomProcessorHelper {
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
			rootElement.querySelectorAll("*").forEach(element => {
				if (element.getAttribute(SELECTED_CONTENT_ATTRIBUTE_NAME) == "") {
					element.removeAttribute(SELECTED_CONTENT_ATTRIBUTE_NAME);
				} else if (!element.querySelector("[" + SELECTED_CONTENT_ATTRIBUTE_NAME + "]")) {
					element.remove();
				}
			});
			isolateParentElements(rootElement.parentElement, rootElement);

			function isolateParentElements(parentElement, element) {
				if (parentElement) {
					Array.from(parentElement.childNodes).forEach(node => {
						if (node != element && node.tagName != "HEAD" && node.tagName != "STYLE") {
							node.remove();
						}
					});
				}
				element = element.parentElement;
				if (element && element.parentElement) {
					isolateParentElements(element.parentElement, element);
				}
			}
		}

		static async resolveImportURLs(stylesheetContent, baseURI, options) {
			stylesheetContent = DomProcessorHelper.resolveStylesheetURLs(stylesheetContent, baseURI);
			stylesheetContent = DomUtil.removeCssComments(stylesheetContent);
			const imports = DomUtil.getImportFunctions(stylesheetContent);
			await Promise.all(imports.map(async cssImport => {
				const match = DomUtil.matchImport(cssImport);
				if (match) {
					const resourceURL = DomUtil.normalizeURL(match.resourceURL);
					if (resourceURL != baseURI && resourceURL != ABOUT_BLANK_URI) {
						const styleSheetUrl = new URL(match.resourceURL, baseURI).href;
						let importedStylesheetContent = await Download.getContent(styleSheetUrl, { asDataURI: false, maxResourceSize: options.maxResourceSize, maxResourceSizeEnabled: options.maxResourceSizeEnabled });
						importedStylesheetContent = DomUtil.wrapMediaQuery(importedStylesheetContent, match.media);
						if (stylesheetContent.includes(cssImport)) {
							importedStylesheetContent = await DomProcessorHelper.resolveImportURLs(importedStylesheetContent, styleSheetUrl, options);
							stylesheetContent = stylesheetContent.replace(DomUtil.getRegExp(cssImport), importedStylesheetContent);
						}
					}
				}
			}));
			return stylesheetContent;
		}

		static resolveStylesheetURLs(stylesheetContent, baseURI) {
			const urlFunctions = DomUtil.getUrlFunctions(stylesheetContent);
			urlFunctions.map(urlFunction => {
				const originalResourceURL = DomUtil.matchURL(urlFunction);
				const resourceURL = DomUtil.normalizeURL(originalResourceURL);
				if (resourceURL && resourceURL != baseURI && DomUtil.testValidPath(resourceURL)) {
					const resolvedURL = new URL(resourceURL, baseURI).href;
					if (resourceURL != resolvedURL && stylesheetContent.includes(urlFunction)) {
						stylesheetContent = stylesheetContent.replace(DomUtil.getRegExp(urlFunction), urlFunction.replace(originalResourceURL, resolvedURL));
					}
				} else {
					if (resourceURL.startsWith(DATA_URI_PREFIX)) {
						const escapedResourceURL = resourceURL.replace(/&/g, "&amp;").replace(/\u00a0/g, "&nbsp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
						if (escapedResourceURL != resourceURL && stylesheetContent.includes(urlFunction)) {
							stylesheetContent = stylesheetContent.replace(DomUtil.getRegExp(urlFunction), urlFunction.replace(originalResourceURL, escapedResourceURL));
						}
					}
				}
			});
			return stylesheetContent;
		}

		static async resolveLinkStylesheetURLs(resourceURL, baseURI, media, options) {
			resourceURL = DomUtil.normalizeURL(resourceURL);
			if (resourceURL && resourceURL != baseURI && resourceURL != ABOUT_BLANK_URI) {
				let stylesheetContent = await Download.getContent(resourceURL, { asDataURI: false, maxResourceSize: options.maxResourceSize, maxResourceSizeEnabled: options.maxResourceSizeEnabled });
				stylesheetContent = await DomProcessorHelper.resolveImportURLs(stylesheetContent, resourceURL, options);
				stylesheetContent = DomUtil.wrapMediaQuery(stylesheetContent, media);
				return stylesheetContent;
			}
		}

		static async processStylesheet(stylesheetContent, baseURI) {
			stylesheetContent = DomProcessorHelper.resolveStylesheetURLs(stylesheetContent, baseURI);
			const urlFunctions = DomUtil.getUrlFunctions(stylesheetContent);
			await Promise.all(urlFunctions.map(async urlFunction => {
				const originalResourceURL = DomUtil.matchURL(urlFunction);
				const resourceURL = DomUtil.normalizeURL(originalResourceURL);
				if (resourceURL && resourceURL != baseURI && DomUtil.testValidPath(resourceURL) && stylesheetContent.includes(urlFunction)) {
					const dataURI = await batchRequest.addURL(resourceURL);
					stylesheetContent = stylesheetContent.replace(DomUtil.getRegExp(urlFunction), urlFunction.replace(originalResourceURL, dataURI));
				}
			}));
			return stylesheetContent;
		}

		static async processAttribute(resourceElements, attributeName, baseURI) {
			await Promise.all(Array.from(resourceElements).map(async resourceElement => {
				let resourceURL = resourceElement.getAttribute(attributeName);
				if (resourceURL) {
					resourceURL = DomUtil.normalizeURL(resourceURL);
					if (resourceURL && resourceURL != baseURI && DomUtil.testValidPath(resourceURL)) {
						try {
							const dataURI = await batchRequest.addURL(new URL(resourceURL, baseURI).href);
							resourceElement.setAttribute(attributeName, dataURI);
						} catch (error) {
							/* ignored */
						}
					}
				}
			}));
		}

		static async processXLinks(resourceElements, baseURI) {
			await Promise.all(Array.from(resourceElements).map(async resourceElement => {
				const originalResourceURL = resourceElement.getAttribute("xlink:href");
				if (originalResourceURL) {
					const resourceURL = DomUtil.normalizeURL(originalResourceURL);
					if (resourceURL && resourceURL != baseURI && DomUtil.testValidPath(resourceURL)) {
						try {
							const content = await batchRequest.addURL(new URL(resourceURL, baseURI).href, false);
							const DOMParser = DOM.getParser();
							if (DOMParser) {
								const svgDoc = new DOMParser().parseFromString(content, "image/svg+xml");
								const hashMatch = originalResourceURL.match(/(#.+?)$/);
								if (hashMatch && hashMatch[0]) {
									const symbolElement = svgDoc.querySelector(hashMatch[0]);
									if (symbolElement) {
										resourceElement.setAttribute("xlink:href", hashMatch[0]);
										resourceElement.parentElement.appendChild(symbolElement);
									}
								} else {
									resourceElement.setAttribute("xlink:href", "data:image/svg+xml," + content);
								}
							} else {
								resourceElement.setAttribute("xlink:href", "data:image/svg+xml," + content);
							}
						} catch (error) {
							/* ignored */
						}
					}
				}
			}));
		}

		static async processSrcset(resourceElements, attributeName, baseURI) {
			await Promise.all(Array.from(resourceElements).map(async resourceElement => {
				const srcset = DOM.parseSrcset(resourceElement.getAttribute(attributeName));
				const srcsetValues = await Promise.all(srcset.map(async srcsetValue => {
					const resourceURL = DomUtil.normalizeURL(srcsetValue.url);
					if (resourceURL && resourceURL != baseURI && DomUtil.testValidPath(resourceURL)) {
						try {
							const dataURI = await batchRequest.addURL(new URL(resourceURL, baseURI).href);
							return dataURI + (srcsetValue.w ? " " + srcsetValue.w + "w" : srcsetValue.d ? " " + srcsetValue.d + "x" : "");
						} catch (error) {
							/* ignored */
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
	const ABOUT_BLANK_URI = "about:blank";
	const NOT_EMPTY_URL = /^https?:\/\/.+/;
	const REGEXP_URL_FN = /(url\s*\(\s*'(.*?)'\s*\))|(url\s*\(\s*"(.*?)"\s*\))|(url\s*\(\s*(.*?)\s*\))/gi;
	const REGEXP_URL_SIMPLE_QUOTES_FN = /^url\s*\(\s*'(.*?)'\s*\)$/i;
	const REGEXP_URL_DOUBLE_QUOTES_FN = /^url\s*\(\s*"(.*?)"\s*\)$/i;
	const REGEXP_URL_NO_QUOTES_FN = /^url\s*\(\s*(.*?)\s*\)$/i;
	const REGEXP_IMPORT_FN = /(@import\s*url\s*\(\s*'(.*?)'\s*\)\s*(.*?);?)|(@import\s*url\s*\(\s*"(.*?)"\s*\)\s*(.*?);?)|(@import\s*url\s*\(\s*(.*?)\s*\)\s*(.*?);?)|(@import\s*'(.*?)'\s*(.*?);?)|(@import\s*"(.*?)"\s*(.*?);?)|(@import\s*(.*?)\s*(.*?);?)/gi;
	const REGEXP_IMPORT_URL_SIMPLE_QUOTES_FN = /@import\s*url\s*\(\s*'(.*?)'\s*\)\s*(.*?)/i;
	const REGEXP_IMPORT_URL_DOUBLE_QUOTES_FN = /@import\s*url\s*\(\s*"(.*?)"\s*\)\s*(.*?)/i;
	const REGEXP_IMPORT_URL_NO_QUOTES_FN = /@import\s*url\s*\(\s*(.*?)\s*\)\s*(.*?)/i;
	const REGEXP_IMPORT_SIMPLE_QUOTES_FN = /@import\s*'(.*?)'\s*(.*?)/i;
	const REGEXP_IMPORT_DOUBLE_QUOTES_FN = /@import\s*"(.*?)"\s*(.*?)/i;
	const REGEXP_IMPORT_NO_QUOTES_FN = /@import\s*(.*?)\s*(.*?)/i;

	class DomUtil {
		static normalizeURL(url) {
			if (url.startsWith(DATA_URI_PREFIX)) {
				return url;
			} else {
				return url.split("#")[0];
			}
		}

		static getRegExp(string) {
			return new RegExp(string.replace(/([{}()^$&.*?/+|[\\\\]|\]|-)/g, "\\$1"), "gi");
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

		static testValidPath(resourceURL) {
			return !resourceURL.startsWith(DATA_URI_PREFIX) && !resourceURL.startsWith(BLOB_URI_PREFIX) && resourceURL != ABOUT_BLANK_URI && (!resourceURL.match(HTTP_URI_PREFIX) || resourceURL.match(NOT_EMPTY_URL));
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
				end = stylesheetContent.indexOf("*/", start);
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

	// -----
	// Stats
	// -----
	const STATS_DEFAULT_VALUES = {
		discarded: {
			htmlBytes: 0,
			hiddenElements: 0,
			imports: 0,
			scripts: 0,
			objects: 0,
			audioSource: 0,
			videoSource: 0,
			frames: 0,
			cssRules: 0
		},
		processed: {
			htmlBytes: 0,
			imports: 0,
			scripts: 0,
			frames: 0,
			cssRules: 0,
			canvas: 0,
			styleSheets: 0,
			resources: 0
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