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

this.SingleFileCore = (() => {

	const SELECTED_CONTENT_ATTRIBUTE_NAME = "data-single-file-selected-content";
	const REMOVED_CONTENT_ATTRIBUTE_NAME = "data-single-file-removed-content";

	let Download, DOM, URL;

	function SingleFileCore(...args) {
		[Download, DOM, URL] = args;
		return class {
			constructor(options) {
				this.options = options;
				this.SELECTED_CONTENT_ATTRIBUTE_NAME = SELECTED_CONTENT_ATTRIBUTE_NAME;
				this.REMOVED_CONTENT_ATTRIBUTE_NAME = REMOVED_CONTENT_ATTRIBUTE_NAME;
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
	const RESOURCE_LOADING = "resource-loading";
	const RESOURCE_LOADED = "resource-loaded";
	const PAGE_ENDED = "page-ended";

	class ProgressEvent {
		constructor(type, details) {
			return { type, details, PAGE_LOADING, PAGE_LOADED, RESOURCES_INITIALIZING, RESOURCES_INITIALIZED, RESOURCE_LOADING, RESOURCE_LOADED, PAGE_ENDED };
		}
	}

	// -------------
	// PageProcessor
	// -------------
	class PageProcessor {
		constructor(options) {
			this.options = options;
			this.processor = new DOMProcessor(options);
			this.onprogress = options.onprogress || (() => { });
		}

		async loadPage() {
			this.onprogress(new ProgressEvent(PAGE_LOADING, { pageURL: this.options.url }));
			await this.processor.loadPage(this.options.content);
			this.onprogress(new ProgressEvent(PAGE_LOADED, { pageURL: this.options.url }));
		}

		async initialize() {
			this.onprogress(new ProgressEvent(RESOURCES_INITIALIZING, { pageURL: this.options.url }));
			if (!this.options.jsEnabled || (this.options.saveRawPage && this.options.removeScripts)) {
				this.processor.insertNoscriptContents();
			}
			if (this.options.removeFrames) {
				this.processor.removeFrames();
			}
			if (this.options.removeImports) {
				this.processor.removeImports();
			}
			if (this.options.removeScripts) {
				this.processor.removeScripts();
			}
			this.processor.removeDiscardedResources();
			this.processor.resetCharsetMeta();
			if (this.options.compressHTML) {
				this.processor.compressHTML();
			}
			if (this.options.insertFaviconLink) {
				this.processor.insertFaviconLink();
			}
			this.processor.resolveHrefs();
			if (this.options.insertSingleFileComment) {
				this.processor.insertSingleFileCommentNode();
			}
			this.processor.replaceCanvasElements();
			if (this.options.removeHiddenElements) {
				this.processor.removeHiddenElements();
			}
			const initializationPromises = [this.processor.inlineStylesheets(true), this.processor.linkStylesheets(), this.processor.attributeStyles(true)];
			if (!this.options.removeFrames) {
				initializationPromises.push(this.processor.frames(true));
			}
			if (!this.options.removeImports) {
				initializationPromises.push(this.processor.htmlImports(true));
			}
			await Promise.all(initializationPromises);
			if (this.options.removeUnusedCSSRules) {
				this.processor.removeUnusedCSSRules();
			}
			this.pendingPromises = [this.processor.inlineStylesheets(), this.processor.attributeStyles(), this.processor.pageResources()];
			if (!this.options.removeScripts) {
				this.pendingPromises.push(this.processor.scripts());
			}
			this.onprogress(new ProgressEvent(RESOURCES_INITIALIZED, { pageURL: this.options.url, index: 0, max: batchRequest.getMaxResources() }));
		}

		async preparePageData() {
			await this.processor.retrieveResources(
				details => {
					details.pageURL = this.options.url;
					this.onprogress(new ProgressEvent(RESOURCE_LOADING, details));
				},
				details => {
					details.pageURL = this.options.url;
					this.onprogress(new ProgressEvent(RESOURCE_LOADED, details));
				});
			await this.pendingPromises;
			if (this.options.lazyLoadImages) {
				this.processor.lazyLoadImages();
			}
			if (!this.options.removeFrames) {
				await this.processor.frames();
			}
			if (!this.options.removeImports) {
				await this.processor.htmlImports();
			}
			this.processor.removeEmptyInlineElements();
			this.processor.removeBase();
		}

		getPageData() {
			this.onprogress(new ProgressEvent(PAGE_ENDED, { pageURL: this.options.url }));
			return this.processor.getPageData();
		}
	}

	// --------
	// BatchRequest
	// --------
	class BatchRequest {
		constructor() {
			this.requests = new Map();
		}

		async addURL(resourceURL) {
			return new Promise((resolve, reject) => {
				const resourceRequests = this.requests.get(resourceURL);
				if (resourceRequests) {
					resourceRequests.push({ resolve, reject });
				} else {
					this.requests.set(resourceURL, [{ resolve, reject }]);
				}
			});
		}

		getMaxResources() {
			return Array.from(this.requests.keys()).length;
		}

		async run(beforeListener, afterListener, options) {
			const resourceURLs = Array.from(this.requests.keys());
			let indexResource = 1, indexAfterResource = 1;
			return Promise.all(resourceURLs.map(async resourceURL => {
				let error;
				const resourceRequests = this.requests.get(resourceURL);
				beforeListener({ index: indexResource, max: resourceURLs.length, url: resourceURL, error });
				indexResource = indexResource + 1;
				try {
					const dataURI = await Download.getContent(resourceURL, { asDataURI: true, maxResourceSize: options.maxResourceSize, maxResourceSizeEnabled: options.maxResourceSizeEnabled });
					resourceRequests.forEach(resourceRequest => resourceRequest.resolve(dataURI));
				} catch (responseError) {
					error = responseError;
					resourceRequests.forEach(resourceRequest => resourceRequest.reject(error));
				}
				afterListener({ index: indexAfterResource, max: resourceURLs.length, url: resourceURL, error });
				indexAfterResource = indexAfterResource + 1;
				this.requests.delete(resourceURL);
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
			this.baseURI = options.url;
		}

		async loadPage(pageContent) {
			if (!pageContent || this.options.saveRawPage) {
				pageContent = await Download.getContent(this.baseURI, { asDataURI: false, maxResourceSize: this.options.maxResourceSize, maxResourceSizeEnabled: this.options.maxResourceSizeEnabled });
			}
			this.dom = DOM.create(pageContent, this.baseURI);
			this.DOMParser = this.dom.DOMParser;
			this.doc = this.dom.document;
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

		async retrieveResources(beforeListener, afterListener) {
			await batchRequest.run(beforeListener, afterListener, this.options);
		}

		getPageData() {
			if (this.options.selected) {
				const selectedElement = this.doc.querySelector("[" + SELECTED_CONTENT_ATTRIBUTE_NAME + "]");
				if (selectedElement) {
					DomProcessorHelper.isolateElement(selectedElement.parentElement, selectedElement);
					selectedElement.removeAttribute(SELECTED_CONTENT_ATTRIBUTE_NAME);
				}
			}
			const titleElement = this.doc.querySelector("title");
			let title;
			if (titleElement) {
				title = titleElement.textContent.trim();
			}
			return {
				title: title || (this.baseURI ? this.baseURI.match(/([^/]*)\/?$/) : ""),
				content: this.dom.serialize()
			};
		}

		insertNoscriptContents() {
			if (this.DOMParser) {
				this.doc.querySelectorAll("noscript").forEach(element => {
					const fragment = this.doc.createDocumentFragment();
					Array.from(element.childNodes).forEach(node => {
						const parsedNode = new this.DOMParser().parseFromString(node.nodeValue, "text/html");
						Array.from(parsedNode.head.childNodes).concat(Array.from(parsedNode.body.childNodes)).forEach(node => {
							this.doc.importNode(node);
							fragment.appendChild(node);
						});
					});
					element.parentElement.replaceChild(fragment, element);
				});
			}
		}

		lazyLoadImages() {
			DomProcessorHelper.replaceSrc(this.doc.querySelectorAll("img[data-src]"), "src");
			DomProcessorHelper.replaceSrc(this.doc.querySelectorAll("img[data-original]"), "original");
			this.doc.querySelectorAll("[data-bg]").forEach(element => {
				const dataBg = element.dataset.bg;
				if (dataBg && dataBg.startsWith(DATA_URI_PREFIX) && dataBg != EMPTY_DATA_URI && !element.style.backgroundImage.includes(dataBg)) {
					element.style.backgroundImage = "url(" + element.dataset.bg + ")";
					element.removeAttribute("data-bg");
					element.removeAttribute("data-lazyload");
				}
			});
			this.doc.querySelectorAll("[data-srcset]").forEach(imgElement => {
				const srcset = imgElement.dataset.srcset;
				if (srcset && imgElement.srcset != srcset) {
					imgElement.srcset = srcset;
					imgElement.removeAttribute("data-srcset");
					imgElement.removeAttribute("data-lazyload");
				}
			});
		}

		removeDiscardedResources() {
			this.doc.querySelectorAll("applet, meta[http-equiv=refresh], object:not([type=\"image/svg+xml\"]):not([type=\"image/svg-xml\"]):not([type=\"text/html\"]), embed:not([src*=\".svg\"]), link[rel*=preload], link[rel*=prefetch]").forEach(element => element.remove());
			this.doc.querySelectorAll("[onload]").forEach(element => element.removeAttribute("onload"));
			this.doc.querySelectorAll("[onerror]").forEach(element => element.removeAttribute("onerror"));
			this.doc.querySelectorAll("audio[src], audio > source[src], video[src], video > source[src]").forEach(element => element.removeAttribute("src"));
		}

		removeEmptyInlineElements() {
			this.doc.querySelectorAll("style, script").forEach(element => {
				if (element.textContent.trim() == "") {
					element.remove();
				}
			});
		}

		removeBase() {
			this.doc.querySelectorAll("base").forEach(element => element.remove());
		}

		removeScripts() {
			this.doc.querySelectorAll("script:not([type=\"application/ld+json\"])").forEach(element => element.remove());
		}

		removeFrames() {
			this.doc.querySelectorAll("iframe, frame, object[type=\"text/html\"][data]").forEach(element => element.remove());
		}

		removeImports() {
			this.doc.querySelectorAll("link[rel=import]").forEach(element => element.remove());
		}

		resetCharsetMeta() {
			this.doc.querySelectorAll("meta[charset]").forEach(element => element.remove());
			const metaElement = this.doc.createElement("meta");
			metaElement.setAttribute("charset", "utf-8");
			this.doc.head.insertBefore(metaElement, this.doc.head.firstElementChild);
		}

		insertFaviconLink() {
			let faviconElement = this.doc.querySelectorAll("link[href][rel*=\"icon\"]")[0];
			if (!faviconElement) {
				faviconElement = this.doc.createElement("link");
				faviconElement.setAttribute("type", "image/x-icon");
				faviconElement.setAttribute("rel", "shortcut icon");
				faviconElement.setAttribute("href", "/favicon.ico");
				this.doc.head.appendChild(faviconElement);
			}
		}

		resolveHrefs() {
			this.doc.querySelectorAll("[href]").forEach(element => {
				const match = element.href && element.href.match(/(.*)#.*$/);
				if (!match || match[1] != this.baseURI) {
					element.setAttribute("href", element.href);
				}
			});
		}

		removeUnusedCSSRules() {
			const doc = this.doc;
			doc.querySelectorAll("style").forEach(style => {
				const cssRules = [];
				if (style.sheet) {
					DomProcessorHelper.processRules(this.doc, style.sheet.cssRules, cssRules);
					const stylesheetContent = cssRules.join("");
					style.textContent = this.options.compressCSS ? this.dom.uglifycss(stylesheetContent) : stylesheetContent;
				}
			});
		}

		removeHiddenElements() {
			this.doc.querySelectorAll("[" + REMOVED_CONTENT_ATTRIBUTE_NAME + "]").forEach(element => element.remove());
		}

		compressHTML() {
			const textNodesWalker = this.doc.createTreeWalker(this.doc.documentElement, 4, null, false);
			let node = textNodesWalker.nextNode();
			while (node) {
				let element = node.parentElement;
				while (element && element.tagName != "PRE") {
					element = element.parentElement;
				}
				if (!element) {
					node.textContent = node.textContent.replace(/ +/g, " ");
					node.textContent = node.textContent.replace(/\n+/g, " ");
				}
				node = textNodesWalker.nextNode();
			}
			const commentNodesWalker = this.doc.createTreeWalker(this.doc.documentElement, 128, null, false);
			node = commentNodesWalker.nextNode();
			let removedNodes = [];
			while (node) {
				removedNodes.push(node);
				node = commentNodesWalker.nextNode();
			}
			removedNodes.forEach(node => node.remove());
		}

		insertSingleFileCommentNode() {
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
					}
				});
			}
		}

		async pageResources() {
			const resourcePromises = [
				DomProcessorHelper.processAttribute(this.doc.querySelectorAll("link[href][rel*=\"icon\"]"), "href", this.baseURI),
				DomProcessorHelper.processAttribute(this.doc.querySelectorAll("img[src], input[src][type=image], object[type=\"image/svg+xml\"], object[type=\"image/svg-xml\"], embed[src*=\".svg\"]"), "src", this.baseURI),
				DomProcessorHelper.processAttribute(this.doc.querySelectorAll("video[poster]"), "poster", this.baseURI),
				DomProcessorHelper.processAttribute(this.doc.querySelectorAll("*[background]"), "background", this.baseURI),
				DomProcessorHelper.processAttribute(this.doc.querySelectorAll("image, use"), "xlink:href", this.baseURI),
				DomProcessorHelper.processSrcset(this.doc.querySelectorAll("[srcset]"), "srcset", this.baseURI, this.dom.parseSrcset)
			];
			if (this.options.lazyLoadImages) {
				resourcePromises.push(DomProcessorHelper.processAttribute(this.doc.querySelectorAll("img[data-src]"), "data-src", this.baseURI));
				resourcePromises.push(DomProcessorHelper.processAttribute(this.doc.querySelectorAll("img[data-original]"), "data-original", this.baseURI));
				resourcePromises.push(DomProcessorHelper.processAttribute(this.doc.querySelectorAll("img[data-bg]"), "data-bg", this.baseURI));
				resourcePromises.push(DomProcessorHelper.processSrcset(this.doc.querySelectorAll("[data-srcset]"), "data-srcset", this.baseURI, this.dom.parseSrcset));
			}
			await resourcePromises;
		}

		async inlineStylesheets(initialization) {
			await Promise.all(Array.from(this.doc.querySelectorAll("style")).map(async styleElement => {
				const stylesheetContent = initialization ? await DomProcessorHelper.resolveImportURLs(styleElement.textContent, this.baseURI, { maxResourceSize: this.options.maxResourceSize, maxResourceSizeEnabled: this.options.maxResourceSizeEnabled }) : await DomProcessorHelper.processStylesheet(styleElement.textContent, this.baseURI);
				styleElement.textContent = this.options.compressCSS && !this.options.removeUnusedCSSRules ? this.dom.uglifycss(stylesheetContent) : stylesheetContent;
			}));
		}

		async scripts() {
			await Promise.all(Array.from(this.doc.querySelectorAll("script[src]")).map(async scriptElement => {
				if (scriptElement.src) {
					const scriptContent = await Download.getContent(scriptElement.src, { asDataURI: false, maxResourceSize: this.options.maxResourceSize, maxResourceSizeEnabled: this.options.maxResourceSizeEnabled });
					scriptElement.textContent = scriptContent.replace(/<\/script>/gi, "<\\/script>");
				}
				scriptElement.removeAttribute("src");
			}));
		}

		async frames(initialization) {
			let frameElements = this.doc.querySelectorAll("iframe, frame, object[type=\"text/html\"][data]");
			frameElements = DomUtil.removeNoScriptFrames(frameElements);
			await Promise.all(frameElements.map(async (frameElement, frameIndex) => {
				const frameWindowId = (this.options.windowId || "0") + "." + frameIndex;
				const frameData = this.options.framesData.find(frame => frame.windowId == frameWindowId);
				DomProcessorHelper.setFrameEmptySrc(frameElement);
				frameElement.setAttribute("sandbox", "");
				if (frameData) {
					if (initialization) {
						const options = Object.create(this.options);
						options.insertSingleFileComment = false;
						options.insertFaviconLink = false;
						options.url = frameData.baseURI;
						options.windowId = frameWindowId;
						if (frameData.content) {
							options.content = frameData.content;
							frameData.processor = new PageProcessor(options);
							frameData.frameElement = frameElement;
							await frameData.processor.loadPage();
							return frameData.processor.initialize();
						}
					} else {
						if (frameData.processor) {
							const pageData = await frameData.processor.getPageData();
							DomProcessorHelper.setFrameContent(frameElement, pageData.content);
						}
					}
				}
			}));
		}

		async htmlImports(initialization) {
			let linkElements = this.doc.querySelectorAll("link[rel=import][href]");
			linkElements = DomUtil.removeNoScriptFrames(linkElements);
			if (!this.relImportProcessors) {
				this.relImportProcessors = new Map();
			}
			await Promise.all(linkElements.map(async linkElement => {
				if (initialization) {
					const resourceURL = linkElement.href;
					const options = Object.create(this.options);
					options.insertSingleFileComment = false;
					options.insertFaviconLink = false;
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
					const processor = this.relImportProcessors.get(linkElement);
					if (processor) {
						this.relImportProcessors.delete(linkElement);
						const pageData = await processor.getPageData();
						linkElement.setAttribute("href", "data:text/html," + pageData.content);
					} else {
						linkElement.setAttribute("href", EMPTY_DATA_URI);
					}
				}
			}));
		}

		async attributeStyles(initialization) {
			await Promise.all(Array.from(this.doc.querySelectorAll("[style]")).map(async element => {
				const stylesheetContent = initialization ? await DomProcessorHelper.resolveImportURLs(element.getAttribute("style"), this.baseURI, { maxResourceSize: this.options.maxResourceSize, maxResourceSizeEnabled: this.options.maxResourceSizeEnabled }) : await DomProcessorHelper.processStylesheet(element.getAttribute("style"), this.baseURI);
				element.setAttribute("style", stylesheetContent);
			}));
		}

		async linkStylesheets() {
			await Promise.all(Array.from(this.doc.querySelectorAll("link[rel*=stylesheet]")).map(async linkElement => {
				const stylesheetContent = await DomProcessorHelper.resolveLinkStylesheetURLs(linkElement.href, this.baseURI, linkElement.media, { maxResourceSize: this.options.maxResourceSize, maxResourceSizeEnabled: this.options.maxResourceSizeEnabled });
				const styleElement = this.doc.createElement("style");
				styleElement.textContent = this.options.compressCSS && !this.options.removeUnusedCSSRules ? this.dom.uglifycss(stylesheetContent) : stylesheetContent;
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

		static isolateElement(parentElement, element) {
			Array.from(parentElement.childNodes).forEach(node => {
				if (node == element) {
					node.removeAttribute("style");
					node.style.all = "unset";
				} else {
					if (node.tagName != "HEAD" && node.tagName != "STYLE") {
						node.remove();
					}
				}
			});
			element = element.parentElement;
			if (element.parentElement) {
				DomProcessorHelper.isolateElement(element.parentElement, element);
			}
		}

		static async resolveImportURLs(stylesheetContent, baseURI, options) {
			stylesheetContent = DomUtil.removeCssComments(stylesheetContent);
			const imports = DomUtil.getImportFunctions(stylesheetContent);
			await Promise.all(imports.map(async cssImport => {
				const match = DomUtil.matchImport(cssImport);
				if (match) {
					const resourceURL = DomUtil.normalizeURL(match.resourceURL);
					if (resourceURL != baseURI && resourceURL != ABOUT_BLANK_URI) {
						let importedStylesheetContent = await Download.getContent(new URL(match.resourceURL, baseURI).href, { asDataURI: false, maxResourceSize: options.maxResourceSize, maxResourceSizeEnabled: options.maxResourceSizeEnabled });
						importedStylesheetContent = DomUtil.wrapMediaQuery(importedStylesheetContent, match.media);
						if (stylesheetContent.indexOf(cssImport) != -1) {
							stylesheetContent = stylesheetContent.replace(cssImport, importedStylesheetContent);
						}
					}
				}
			}));
			stylesheetContent = DomProcessorHelper.resolveStylesheetURLs(stylesheetContent, baseURI);
			if (imports.length) {
				return await DomProcessorHelper.resolveImportURLs(stylesheetContent, baseURI, options);
			} else {
				return stylesheetContent;
			}
		}

		static resolveStylesheetURLs(stylesheetContent, baseURI) {
			const urlFunctions = DomUtil.getUrlFunctions(stylesheetContent);
			urlFunctions.map(urlFunction => {
				let resourceURL = DomUtil.matchURL(urlFunction);
				resourceURL = DomUtil.normalizeURL(resourceURL);
				if (resourceURL && resourceURL != baseURI && DomUtil.testValidPath(resourceURL)) {
					stylesheetContent = stylesheetContent.replace(urlFunction, urlFunction.replace(resourceURL, new URL(resourceURL, baseURI).href));
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
			const urlFunctions = DomUtil.getUrlFunctions(stylesheetContent);
			await Promise.all(urlFunctions.map(async urlFunction => {
				let resourceURL = DomUtil.matchURL(urlFunction);
				resourceURL = DomUtil.normalizeURL(resourceURL);
				if (resourceURL && resourceURL != baseURI && DomUtil.testValidPath(resourceURL)) {
					const dataURI = await batchRequest.addURL(resourceURL);
					stylesheetContent = stylesheetContent.replace(urlFunction, urlFunction.replace(resourceURL, dataURI));
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
							// ignored
						}
					}
				}
			}));
		}

		static replaceSrc(elements, attributeName) {
			elements.forEach(element => {
				const dataSrc = element.dataset[attributeName];
				if (dataSrc && dataSrc.startsWith(DATA_URI_PREFIX) && dataSrc != EMPTY_DATA_URI && element.src != dataSrc) {
					element.src = element.dataset[attributeName];
					element.removeAttribute("data-" + attributeName);
					element.removeAttribute("data-lazyload");
				}
			});
		}

		static async processSrcset(resourceElements, attributeName, baseURI, parseSrcset) {
			await Promise.all(Array.from(resourceElements).map(async resourceElement => {
				const srcset = parseSrcset(resourceElement.getAttribute(attributeName));
				const srcsetValues = await Promise.all(srcset.map(async srcsetValue => {
					const resourceURL = DomUtil.normalizeURL(srcsetValue.url);
					if (resourceURL && resourceURL != baseURI && DomUtil.testValidPath(resourceURL)) {
						try {
							const dataURI = await batchRequest.addURL(new URL(resourceURL, baseURI).href);
							return dataURI + (srcsetValue.w ? " " + srcsetValue.w + "w" : srcsetValue.d ? " " + srcsetValue.d + "x" : "");
						} catch (error) {
							// ignored
						}
					}
				}));
				resourceElement.setAttribute(attributeName, srcsetValues.join(","));
			}));
		}

		static processRules(doc, rules, cssRules, cache = {}) {
			if (rules) {
				Array.from(rules).forEach(rule => {
					if (rule.media) {
						cssRules.push("@media " + Array.prototype.join.call(rule.media, ",") + " {");
						DomProcessorHelper.processRules(doc, rule.cssRules, cssRules, cache);
						cssRules.push("}");
					} else if (rule.selectorText) {
						const selector = DomUtil.getFilteredSelector(rule.selectorText);
						if (selector) {
							try {
								if (cache[selector] || doc.querySelector(selector)) {
									cssRules.push(rule.cssText);
									cache[selector] = true;
								}
							} catch (error) {
								cssRules.push(rule.cssText);
							}
						}
					} else {
						cssRules.push(rule.cssText);
					}
				});
			}
		}
	}

	// -------
	// DomUtil
	// -------
	const DATA_URI_PREFIX = "data:";
	const BLOB_URI_PREFIX = "blob:";
	const ABOUT_BLANK_URI = "about:blank";
	const REGEXP_URL_FN = /(url\s*\(\s*'([^']*)'\s*\))|(url\s*\(\s*"([^"]*)"\s*\))|(url\s*\(\s*([^)]*)\s*\))/gi;
	const REGEXP_URL_SIMPLE_QUOTES_FN = /^url\s*\(\s*'([^']*)'\s*\)$/i;
	const REGEXP_URL_DOUBLE_QUOTES_FN = /^url\s*\(\s*"([^"]*)"\s*\)$/i;
	const REGEXP_URL_NO_QUOTES_FN = /^url\s*\(\s*([^)]*)\s*\)$/i;
	const REGEXP_IMPORT_FN = /(@import\s*url\s*\(\s*'([^']*)'\s*\)\s*([^;]*);?)|(@import\s*url\s*\(\s*"([^"]*)"\s*\)\s*([^;]*);?)|(@import\s*url\s*\(\s*([^)]*)\s*\)\s*([^;]*);?)|(@import\s*'([^']*)'\s*([^;]*);?)|(@import\s*"([^"]*)"\s*([^;]*);?)|(@import\s*([^;]*)\s*([^;]*);?)/gi;
	const REGEXP_IMPORT_URL_SIMPLE_QUOTES_FN = /@import\s*url\s*\(\s*'([^']*)'\s*\)\s*([^;]*)/i;
	const REGEXP_IMPORT_URL_DOUBLE_QUOTES_FN = /@import\s*url\s*\(\s*"([^"]*)"\s*\)\s*([^;]*)/i;
	const REGEXP_IMPORT_URL_NO_QUOTES_FN = /@import\s*url\s*\(\s*([^)]*)\s*\)\s*([^;]*)/i;
	const REGEXP_IMPORT_SIMPLE_QUOTES_FN = /@import\s*'([^']*)'\s*([^;]*)/i;
	const REGEXP_IMPORT_DOUBLE_QUOTES_FN = /@import\s*"([^"]*)"\s*([^;]*)/i;
	const REGEXP_IMPORT_NO_QUOTES_FN = /@import\s*([^;]*)\s*([^;]*)/i;
	const REGEXP_PSEUDO_CLASSES = /::after|::before|::first-line|::first-letter|:focus|:focus-within|:hover|:link|:visited|:active/gi;

	class DomUtil {
		static normalizeURL(url) {
			return url.split("#")[0];
		}

		static getUrlFunctions(stylesheetContent) {
			return stylesheetContent.match(REGEXP_URL_FN) || [];
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
			return !resourceURL.startsWith(DATA_URI_PREFIX) && !resourceURL.startsWith(BLOB_URI_PREFIX) && resourceURL != ABOUT_BLANK_URI;
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

		static removeNoScriptFrames(frameElements) {
			return Array.from(frameElements).filter(element => {
				element = element.parentElement;
				while (element && element.tagName != "NOSCRIPT") {
					element = element.parentElement;
				}
				return !element;
			});
		}

		static getFilteredSelector(selector) {
			if (selector.match(REGEXP_PSEUDO_CLASSES)) {
				let selectors = selector.split(/\s*,\s*/g);
				selector = selectors.map(selector => {
					const simpleSelectors = selector.split(/\s*[ >~+]\s*/g);
					const separators = selector.match(/\s*[ >~+]\s*/g);
					return simpleSelectors.map((selector, selectorIndex) => {
						while (selector.match(REGEXP_PSEUDO_CLASSES)) {
							selector = selector.replace(REGEXP_PSEUDO_CLASSES, "").trim();
						}
						selector = selector.replace(/:?:[^(]+\(\)/g, "");
						if (selector == "") {
							selector = "*";
						}
						return selector + (separators && separators[selectorIndex] ? separators[selectorIndex] : "");
					}).join("");
				}).join(",");
			}
			return selector;
		}
	}

	return SingleFileCore;

})();