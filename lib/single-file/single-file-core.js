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
	const DEBUG = false;

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
			async getPageData() {
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
		sequential: [
			{ action: "removeUIElements" },
			{ action: "replaceStyleContents" },
			{ option: "removeSrcSet", action: "removeSrcSet" },
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
			{ option: "removeHiddenElements", action: "removeHiddenElements" }
		],
		parallel: [
			{ action: "inlineStylesheets" },
			{ action: "linkStylesheets" },
			{ action: "attributeStyles" },
			{ option: "!removeFrames", action: "frames" },
			{ option: "!removeImports", action: "htmlImports" }
		]
	}, {
		sequential: [
			{ option: "removeUnusedStyles", action: "removeUnusedStyles" },
			{ option: "removeAlternativeFonts", action: "removeAlternativeFonts" },
			{ option: "removeAlternativeMedias", action: "removeAlternativeMedias" }
		],
		parallel: [
			{ action: "inlineStylesheets" },
			{ action: "attributeStyles" },
			{ action: "pageResources" },
			{ option: "!removeScripts", action: "scripts" }
		]
	}, {
		sequential: [
			{ option: "lazyLoadImages", action: "lazyLoadImages" },
			{ option: "removeAlternativeFonts", action: "postRemoveAlternativeFonts" },
			{ option: "compressCSS", action: "compressCSS" }
		],
		parallel: [
			{ option: "!removeFrames", action: "frames" },
			{ option: "!removeImports", action: "htmlImports" },
		]
	}, {
		sequential: [
			{ option: "compressHTML", action: "compressHTML" },
			{ option: "insertSingleFileComment", action: "insertSingleFileComment" },
			{ action: "removeDefaultHeadTags" }
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
		}

		async preparePageData() {
			if (!this.options.windowId) {
				this.processor.initialize(this.batchRequest);
				this.onprogress(new ProgressEvent(RESOURCES_INITIALIZED, { pageURL: this.options.url, index: 0, max: this.processor.maxResources }));
			}
			await this.batchRequest.run(details => {
				details.pageURL = this.options.url;
				this.onprogress(new ProgressEvent(RESOURCE_LOADED, details));
			}, this.options);
			await this.pendingPromises;
			await this.executeStage(2);
			await this.executeStage(3);
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
				this.executeTask(task, !step);
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
					const promise = this.executeTask(task, !step);
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
					onloadListener({ index: indexResource, url: resourceURL });
					resourceRequests.forEach(resourceRequest => resourceRequest.resolve(dataURI));
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
	const ESCAPED_FRAGMENT = "_escaped_fragment_=";
	const EMPTY_DATA_URI = "data:base64,";

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

		async getPageData() {
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
			this.options.info.publisher = creatorElement ? publisherElement.content.trim() : "";
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

		setInputValues() {
			this.doc.querySelectorAll("input").forEach(input => {
				const value = input.getAttribute(DOM.inputValueAttributeName(this.options.sessionId));
				if (value) {
					input.setAttribute("value", value);
				}
			});
			this.doc.querySelectorAll("textarea").forEach(textarea => {
				const value = textarea.getAttribute(DOM.inputValueAttributeName(this.options.sessionId));
				if (value) {
					textarea.textContent = value;
				}
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

		lazyLoadImages() {
			DOM.lazyLoad(this.doc);
		}

		removeDiscardedResources() {
			const objectElements = this.doc.querySelectorAll("applet, meta[http-equiv=refresh], object:not([type=\"image/svg+xml\"]):not([type=\"image/svg-xml\"]):not([type=\"text/html\"]), embed:not([src*=\".svg\"])");
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
						element.removeAttribute("href");
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
			this.doc.querySelectorAll("meta[charset], meta[http-equiv=\"content-type\"]").forEach(element => element.remove());
			const metaElement = this.doc.createElement("meta");
			metaElement.setAttribute("charset", "utf-8");
			this.doc.head.insertBefore(metaElement, this.doc.head.firstElementChild);
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
					if (!normalizedHref || normalizedHref != this.baseURI) {
						element.setAttribute("href", href);
					}
				}
			});
		}

		removeUnusedStyles() {
			const stats = DOM.minifyCSS(this.doc);
			this.stats.set("processed", "CSS rules", stats.processed);
			this.stats.set("discarded", "CSS rules", stats.discarded);
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
						if (imageData.source && imageData.source.src && imageData.source.naturalWidth > 1 && imageData.source.naturalHeight > 1) {
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
									if (imageElement) {
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
				}
			});
		}

		postRemoveAlternativeFonts() {
			DOM.minifyFonts(this.doc, true);
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

		async pageResources() {
			const resourcePromises = [
				DomProcessorHelper.processAttribute(this.doc.querySelectorAll("link[href][rel*=\"icon\"]"), "href", this.baseURI, this.batchRequest),
				DomProcessorHelper.processAttribute(this.doc.querySelectorAll("object[type=\"image/svg+xml\"], object[type=\"image/svg-xml\"]"), "data", this.baseURI, this.batchRequest),
				DomProcessorHelper.processAttribute(this.doc.querySelectorAll("img[src], input[src][type=image], embed[src*=\".svg\"]"), "src", this.baseURI, this.batchRequest),
				DomProcessorHelper.processAttribute(this.doc.querySelectorAll("video[poster]"), "poster", this.baseURI, this.batchRequest),
				DomProcessorHelper.processAttribute(this.doc.querySelectorAll("*[background]"), "background", this.baseURI, this.batchRequest),
				DomProcessorHelper.processAttribute(this.doc.querySelectorAll("image"), "xlink:href", this.baseURI, this.batchRequest),
				DomProcessorHelper.processXLinks(this.doc.querySelectorAll("use"), this.baseURI, this.batchRequest),
				DomProcessorHelper.processSrcset(this.doc.querySelectorAll("[srcset]"), "srcset", this.baseURI, this.batchRequest)
			];
			if (!this.options.removeAudioSrc) {
				resourcePromises.push(DomProcessorHelper.processAttribute(this.doc.querySelectorAll("audio[src], audio > source[src]"), "src", this.baseURI, this.batchRequest));
			}
			if (!this.options.removeVideoSrc) {
				resourcePromises.push(DomProcessorHelper.processAttribute(this.doc.querySelectorAll("video[src], video > source[src]"), "src", this.baseURI, this.batchRequest));
			}
			if (this.options.lazyLoadImages) {
				const imageSelectors = DOM.lazyLoaderImageSelectors();
				Object.keys(imageSelectors.src).forEach(selector => resourcePromises.push(DomProcessorHelper.processAttribute(this.doc.querySelectorAll(selector), imageSelectors.src[selector], this.baseURI, this.batchRequest)));
				Object.keys(imageSelectors.srcset).forEach(selector => resourcePromises.push(DomProcessorHelper.processSrcset(this.doc.querySelectorAll(selector), imageSelectors.srcset[selector], this.baseURI, this.batchRequest)));
			}
			await resourcePromises;
		}

		async inlineStylesheets(initialization) {
			await Promise.all(Array.from(this.doc.querySelectorAll("style")).map(async (styleElement, indexStyle) => {
				if (!initialization) {
					this.stats.add("processed", "stylesheets", 1);
				}
				let stylesheetContent = styleElement.textContent;
				if (initialization) {
					stylesheetContent = await DomProcessorHelper.resolveImportURLs(styleElement.textContent, this.baseURI, { maxResourceSize: this.options.maxResourceSize, maxResourceSizeEnabled: this.options.maxResourceSizeEnabled });
				} else {
					stylesheetContent = await DomProcessorHelper.processStylesheet(styleElement.textContent, this.baseURI, this.options, false, indexStyle, this.batchRequest);
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
									await frameData.processor.initialize();
									frameData.maxResources = this.batchRequest.getMaxResources();
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
						this.stats.add("processed", "HTML imports", 1);
						this.relImportProcessors.delete(linkElement);
						const pageData = await processor.getPageData();
						linkElement.setAttribute("href", "data:text/html," + pageData.content);
						this.stats.addAll(pageData);
					} else {
						this.stats.add("discarded", "HTML imports", 1);
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
					stylesheetContent = await DomProcessorHelper.processStylesheet(element.getAttribute("style"), this.baseURI, this.options, true, 0, this.batchRequest);
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
	const REGEXP_AMP = /&/g;
	const REGEXP_NBSP = /\u00a0/g;
	const REGEXP_START_TAG = /</g;
	const REGEXP_END_TAG = />/g;
	const REGEXP_URL_HASH = /(#.+?)$/;
	const PREFIX_DATA_URI_IMAGE = "data:image/";
	const PREFIX_DATA_URI_IMAGE_SVG = "data:image/svg+xml";

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
			filename = await DomUtil.evalTemplateVariable(filename, "day-locale", () => String(date.getDate()));
			filename = await DomUtil.evalTemplateVariable(filename, "month-locale", () => String(date.getMonth()));
			filename = await DomUtil.evalTemplateVariable(filename, "year-locale", () => String(date.getFullYear()));
			filename = await DomUtil.evalTemplateVariable(filename, "datetime-locale", () => date.toLocaleString());
			filename = await DomUtil.evalTemplateVariable(filename, "datetime-utc", () => date.toUTCString());
			filename = await DomUtil.evalTemplateVariable(filename, "day-utc", () => String(date.getUTCDate()));
			filename = await DomUtil.evalTemplateVariable(filename, "month-utc", () => String(date.getUTCMonth()));
			filename = await DomUtil.evalTemplateVariable(filename, "year-utc", () => String(date.getUTCFullYear()));
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
						const escapedResourceURL = resourceURL.replace(REGEXP_AMP, "&amp;").replace(REGEXP_NBSP, "&nbsp;").replace(REGEXP_START_TAG, "&lt;").replace(REGEXP_END_TAG, "&gt;");
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

		static async processStylesheet(stylesheetContent, baseURI, options, inline, indexStyle, batchRequest) {
			stylesheetContent = DomProcessorHelper.resolveStylesheetURLs(stylesheetContent, baseURI);
			const urlFunctions = DomUtil.getUrlFunctions(stylesheetContent);
			let indexVariable = 0;
			await Promise.all(urlFunctions.map(async urlFunction => {
				const originalResourceURL = DomUtil.matchURL(urlFunction);
				const resourceURL = DomUtil.normalizeURL(originalResourceURL);
				if (resourceURL && resourceURL != baseURI && DomUtil.testValidPath(resourceURL) && stylesheetContent.includes(urlFunction)) {
					const dataURI = await batchRequest.addURL(resourceURL);
					const regExpUrlFunction = DomUtil.getRegExp(urlFunction);
					if (!inline && options.compressCSS && dataURI.startsWith(PREFIX_DATA_URI_IMAGE) && !dataURI.startsWith(PREFIX_DATA_URI_IMAGE_SVG)) {
						const functions = stylesheetContent.match(regExpUrlFunction);
						if (functions && functions.length > 1) {
							const variableName = "--single-file-" + indexStyle + "-" + indexVariable;
							stylesheetContent = variableName + ":url(\"" + dataURI + "\")" + (indexVariable ? ";" : "}") + stylesheetContent;
							stylesheetContent = stylesheetContent.replace(regExpUrlFunction, "var(" + variableName + ")");
							indexVariable++;
						} else {
							stylesheetContent = stylesheetContent.replace(regExpUrlFunction, urlFunction.replace(originalResourceURL, dataURI));
						}
					} else {
						stylesheetContent = stylesheetContent.replace(regExpUrlFunction, urlFunction.replace(originalResourceURL, dataURI));
					}
				}
			}));
			if (indexVariable) {
				stylesheetContent = ":root{" + stylesheetContent;
			}
			return stylesheetContent;
		}

		static async processAttribute(resourceElements, attributeName, baseURI, batchRequest) {
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

		static async processXLinks(resourceElements, baseURI, batchRequest) {
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
								const hashMatch = originalResourceURL.match(REGEXP_URL_HASH);
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

		static async processSrcset(resourceElements, attributeName, baseURI, batchRequest) {
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
			if (url.startsWith(DATA_URI_PREFIX)) {
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
			let lastSegmentMatch = url.pathname.match(/\/([^/]+)$/);
			let lastSegment = lastSegmentMatch && lastSegmentMatch[0];
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