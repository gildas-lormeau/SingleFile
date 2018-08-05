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
	const REMOVED_CONTENT_ATTRIBUTE_NAME = "data-single-file-removed-content";
	const PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME = "data-single-file-preserved-space-element";
	const WIN_ID_ATTRIBUTE_NAME = "data-frame-tree-win-id";

	let Download, DOM, URL;

	function getClass(...args) {
		[Download, DOM, URL] = args;
		return class {
			constructor(options) {
				this.options = options;
				this.SELECTED_CONTENT_ATTRIBUTE_NAME = SELECTED_CONTENT_ATTRIBUTE_NAME;
				this.REMOVED_CONTENT_ATTRIBUTE_NAME = REMOVED_CONTENT_ATTRIBUTE_NAME;
				this.SELECTED_CONTENT_ROOT_ATTRIBUTE_NAME = SELECTED_CONTENT_ROOT_ATTRIBUTE_NAME;
				this.PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME = PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME;
				this.WIN_ID_ATTRIBUTE_NAME = WIN_ID_ATTRIBUTE_NAME;
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
			if (this.options.compressHTML) {
				this.processor.compressHTML(true);
			}
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

		async run(onloadListener, options) {
			const resourceURLs = Array.from(this.requests.keys());
			let indexResource = 0;
			return Promise.all(resourceURLs.map(async resourceURL => {
				const resourceRequests = this.requests.get(resourceURL);
				try {
					const dataURI = await Download.getContent(resourceURL, { asDataURI: true, maxResourceSize: options.maxResourceSize, maxResourceSizeEnabled: options.maxResourceSizeEnabled });
					resourceRequests.forEach(resourceRequest => resourceRequest.resolve(dataURI));
				} catch (error) {
					resourceRequests.forEach(resourceRequest => resourceRequest.reject(error));
				}
				this.requests.delete(resourceURL);
				indexResource = indexResource + 1;
				onloadListener({ index: indexResource, max: resourceURLs.length, url: resourceURL });
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

		async retrieveResources(onloadListener) {
			await batchRequest.run(onloadListener, this.options);
		}

		getPageData() {
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
			return {
				title: title || (this.baseURI && matchTitle ? matchTitle[1] : ""),
				content: this.dom.serialize(this.options)
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
			this.dom.lazyLoader.process(this.doc);
		}

		removeDiscardedResources() {
			this.doc.querySelectorAll("applet, meta[http-equiv=refresh], object:not([type=\"image/svg+xml\"]):not([type=\"image/svg-xml\"]):not([type=\"text/html\"]), embed:not([src*=\".svg\"]), link[rel*=preload], link[rel*=prefetch]").forEach(element => element.remove());
			this.doc.querySelectorAll("[onload]").forEach(element => element.removeAttribute("onload"));
			this.doc.querySelectorAll("[onerror]").forEach(element => element.removeAttribute("onerror"));
			if (this.options.removeAudioSrc) {
				this.doc.querySelectorAll("audio[src], audio > source[src]").forEach(element => element.removeAttribute("src"));
			}
			if (this.options.removeVideoSrc) {
				this.doc.querySelectorAll("video[src], video > source[src]").forEach(element => element.removeAttribute("src"));
			}
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
			this.dom.rulesMinifier(this.doc);
		}

		removeHiddenElements() {
			this.doc.querySelectorAll("[" + REMOVED_CONTENT_ATTRIBUTE_NAME + "]").forEach(element => element.remove());
		}

		compressHTML(postProcess) {
			if (postProcess) {
				this.dom.htmlmini.postProcess(this.doc);
			} else {
				this.dom.htmlmini.process(this.doc, { preservedSpaceAttributeName: PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME });
				this.doc.querySelectorAll("[" + PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME + "]").forEach(element => element.removeAttribute(PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME));
			}
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
			if (!this.options.removeAudioSrc) {
				resourcePromises.push(DomProcessorHelper.processAttribute(this.doc.querySelectorAll("audio[src], audio > source[src]"), "src", this.baseURI));
			}
			if (!this.options.removeVideoSrc) {
				resourcePromises.push(DomProcessorHelper.processAttribute(this.doc.querySelectorAll("video[src], video > source[src]"), "src", this.baseURI));
			}
			if (this.options.lazyLoadImages) {
				const imageSelectors = this.dom.lazyLoader.imageSelectors;
				Object.keys(imageSelectors.src).forEach(selector => resourcePromises.push(DomProcessorHelper.processAttribute(this.doc.querySelectorAll(selector), imageSelectors.src[selector], this.baseURI)));
				Object.keys(imageSelectors.srcset).forEach(selector => resourcePromises.push(DomProcessorHelper.processSrcset(this.doc.querySelectorAll(selector), imageSelectors.srcset[selector], this.baseURI, this.dom.parseSrcset)));
			}
			await resourcePromises;
		}

		async inlineStylesheets(initialization) {
			await Promise.all(Array.from(this.doc.querySelectorAll("style")).map(async styleElement => {
				const stylesheetContent = initialization ? await DomProcessorHelper.resolveImportURLs(styleElement.textContent, this.baseURI, { maxResourceSize: this.options.maxResourceSize, maxResourceSizeEnabled: this.options.maxResourceSizeEnabled }) : await DomProcessorHelper.processStylesheet(styleElement.textContent, this.baseURI);
				styleElement.textContent = !initialization && this.options.compressCSS ? this.dom.uglifycss(stylesheetContent) : stylesheetContent;
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
			const frameElements = Array.from(this.doc.querySelectorAll("iframe, frame, object[type=\"text/html\"][data]"));
			await Promise.all(frameElements.map(async (frameElement) => {
				const frameWindowId = frameElement.getAttribute(WIN_ID_ATTRIBUTE_NAME);
				if (frameWindowId) {
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
								await frameData.processor.preparePageData();
								const pageData = await frameData.processor.getPageData();
								frameElement.removeAttribute(WIN_ID_ATTRIBUTE_NAME);
								DomProcessorHelper.setFrameContent(frameElement, pageData.content);
							}
						}
					}
				}
			}));
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
				if (element.getAttribute(SELECTED_CONTENT_ATTRIBUTE_NAME) === "") {
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

	}

	return { getClass };

})();