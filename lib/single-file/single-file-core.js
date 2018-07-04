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

const SingleFileCore = (() => {

	let Download, DOM, URL;

	function SingleFileCore(...args) {
		[Download, DOM, URL] = args;
		return class {
			static async process(options) {
				const processor = new PageProcessor(options);
				processor.onprogress = options.onprogress;
				await processor.loadPage(options.content);
				await processor.initialize();
				return await processor.getContent();
			}
		};
	}

	// -------------
	// PageProcessor
	// -------------
	class PageProcessor {
		constructor(options) {
			this.options = options;
			this.processor = new DOMProcessor(options.url);
		}

		async loadPage(pageContent) {
			if (this.onprogress) {
				this.onprogress({ type: "page-loading", details: { pageURL: this.options.url } });
			}
			await this.processor.loadPage(pageContent);
			if (this.onprogress) {
				this.onprogress({ type: "page-loaded", details: { pageURL: this.options.url } });
			}
		}

		async initialize() {
			if (this.onprogress) {
				this.onprogress({ type: "resources-initializing", details: { pageURL: this.options.url } });
			}
			if (!this.options.jsEnabled) {
				this.processor.insertNoscriptContents();
			}
			this.processor.removeDiscardedResources();
			this.processor.resetCharsetMeta();
			this.processor.insertFaviconLink();
			this.processor.resolveHrefs();
			this.processor.insertSingleFileCommentNode();
			await Promise.all([this.processor.inlineStylesheets(true), this.processor.linkStylesheets()], this.processor.attributeStyles(true));
			this.pendingPromises = Promise.all([this.processor.inlineStylesheets(), this.processor.attributeStyles(), this.processor.pageResources()]);
			if (this.onprogress) {
				this.onprogress({ type: "resources-initialized", details: { pageURL: this.options.url, index: 0, max: batchRequest.getMaxResources() } });
			}
		}

		async getContent() {
			await this.processor.retrieveResources(
				details => {
					if (this.onprogress) {
						details.pageURL = this.options.url;
						this.onprogress({ type: "resource-loading", details });
					}
				},
				details => {
					if (this.onprogress) {
						details.pageURL = this.options.url;
						this.onprogress({ type: "resource-loaded", details });
					}
				});
			await this.pendingPromises;
			if (this.options.removeUnusedCSSRules) {
				this.processor.removeUnusedCSSRules();
			}
			if (this.options.removeHiddenElements) {
				this.processor.removeHiddenElements();
			}
			if (this.onprogress) {
				this.onprogress({ type: "page-ended", details: { pageURL: this.options.url } });
			}
			return this.processor.getContent();
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

		async run(beforeListener, afterListener) {
			const resourceURLs = Array.from(this.requests.keys());
			let indexResource = 1, indexAfterResource = 1;
			return Promise.all(resourceURLs.map(async resourceURL => {
				let error;
				const resourceRequests = this.requests.get(resourceURL);
				beforeListener({ index: indexResource, max: resourceURLs.length, url: resourceURL, error });
				indexResource = indexResource + 1;
				try {
					const dataURI = await Download.getContent(resourceURL, true);
					resourceRequests.map(resourceRequest => resourceRequest.resolve(dataURI));
				} catch (responseError) {
					error = responseError;
					resourceRequests.map(resourceRequest => resourceRequest.reject(error));
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

	const batchRequest = new BatchRequest();

	class DOMProcessor {
		constructor(url) {
			this.baseURI = url;
		}

		async loadPage(pageContent) {
			if (!pageContent) {
				pageContent = await Download.getContent(this.baseURI);
			}
			this.dom = DOM.create(pageContent, this.baseURI);
			this.DOMParser = this.dom.DOMParser;
			this.getComputedStyle = this.dom.getComputedStyle;
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
			await batchRequest.run(beforeListener, afterListener);
		}

		getContent() {
			const titleElement = this.doc.head.querySelector("title");
			let title;
			if (titleElement) {
				title = titleElement.textContent.trim();
			}
			return {
				title: title || this.baseURI.match(/([^/]*)\/?$/),
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

		removeDiscardedResources() {
			this.doc.querySelectorAll("script, iframe, frame, applet, meta[http-equiv=refresh], object:not([type=\"image/svg+xml\"]):not([type=\"image/svg-xml\"]), embed:not([src*=\".svg\"]), link[rel*=preload], link[rel*=prefetch]").forEach(element => element.remove());
			this.doc.querySelectorAll("[onload]").forEach(element => element.removeAttribute("onload"));
			this.doc.querySelectorAll("audio[src], video[src]").forEach(element => element.removeAttribute("src"));
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
			this.doc.querySelectorAll("[href]").forEach(element => element.setAttribute("href", element.href));
		}

		removeUnusedCSSRules() {
			const doc = this.doc;
			doc.querySelectorAll("style").forEach(style => {
				const cssRules = [];
				if (style.sheet) {
					processRules(style.sheet.rules, cssRules);
					style.innerText = cssRules.join("");
				}
			});

			function processRules(rules, cssRules) {
				Array.from(rules).forEach(rule => {
					if (rule.media) {
						cssRules.push("@media " + Array.prototype.join.call(rule.media, ",") + " {");
						processRules(rule.cssRules, cssRules);
						cssRules.push("}");
					} else if (rule.selectorText) {
						const selector = rule.selectorText.replace(/::after|::before|::first-line|::first-letter|:focus|:hover/gi, "").trim();
						if (selector) {
							try {
								if (doc.querySelector(selector)) {
									cssRules.push(rule.cssText);
								}
							} catch (e) {
								cssRules.push(rule.cssText);
							}
						}
					} else {
						cssRules.push(rule.cssText);
					}
				});
			}
		}

		removeHiddenElements() {
			this.doc.querySelectorAll("html > body *:not(style):not(script):not(link)").forEach(element => {
				if (this.getComputedStyle) {
					const style = this.getComputedStyle(element);
					if ((style.visibility == "hidden" || style.display == "none" || style.opacity == 0)) {
						element.remove();
					}
				}
			});
		}

		insertSingleFileCommentNode() {
			const commentNode = this.doc.createComment("\n Archive processed by SingleFile \n url: " + this.baseURI + " \n saved date: " + new Date() + " \n");
			this.doc.documentElement.insertBefore(commentNode, this.doc.documentElement.firstChild);
		}

		async pageResources() {
			await Promise.all([
				DomProcessorHelper.processAttribute(this.doc.querySelectorAll("link[href][rel*=\"icon\"]"), "href", this.baseURI),
				DomProcessorHelper.processAttribute(this.doc.querySelectorAll("img[src], input[src][type=image], object[type=\"image/svg+xml\"], object[type=\"image/svg-xml\"], embed[src*=\".svg\"]"), "src", this.baseURI),
				DomProcessorHelper.processAttribute(this.doc.querySelectorAll("video[poster]"), "poster", this.baseURI),
				DomProcessorHelper.processAttribute(this.doc.querySelectorAll("*[background]"), "background", this.baseURI),
				DomProcessorHelper.processAttribute(this.doc.querySelectorAll("image, use"), "xlink:href", this.baseURI),
				DomProcessorHelper.processSrcSet(this.doc.querySelectorAll("[srcset]"), this.baseURI)
			]);
		}

		async inlineStylesheets(initialization) {
			await Promise.all(Array.from(this.doc.querySelectorAll("style")).map(async styleElement => {
				let stylesheetContent = initialization ? await DomProcessorHelper.resolveImportURLs(styleElement.textContent, this.baseURI) : await DomProcessorHelper.processStylesheet(styleElement.textContent, this.baseURI);
				// stylesheetContent = DomUtil.wrapMediaQuery(stylesheetContent, styleElement.media);
				styleElement.textContent = stylesheetContent;
			}));
		}

		async attributeStyles(initialization) {
			await Promise.all(Array.from(this.doc.querySelectorAll("[style]")).map(async element => {
				const stylesheetContent = initialization ? await DomProcessorHelper.resolveImportURLs(element.getAttribute("style"), this.baseURI) : await DomProcessorHelper.processStylesheet(element.getAttribute("style"), this.baseURI);
				element.setAttribute("style", stylesheetContent);
			}));
		}

		async linkStylesheets() {
			await Promise.all(Array.from(this.doc.querySelectorAll("link[rel*=stylesheet]")).map(async linkElement => {
				const stylesheetContent = await DomProcessorHelper.resolveLinkStylesheetURLs(linkElement.href, this.baseURI, linkElement.media);
				if (stylesheetContent) {
					const styleElement = this.doc.createElement("style");
					styleElement.textContent = stylesheetContent;
					linkElement.parentElement.replaceChild(styleElement, linkElement);
				}
			}));
		}
	}

	// ---------
	// DomHelper
	// ---------
	const DATA_URI_PREFIX = "data:";

	class DomProcessorHelper {
		static async resolveImportURLs(stylesheetContent, baseURI) {
			stylesheetContent = DomUtil.removeCssComments(stylesheetContent);
			const imports = DomUtil.getImportFunctions(stylesheetContent);
			await Promise.all(imports.map(async cssImport => {
				const match = DomUtil.matchImport(cssImport);
				if (match) {
					const resourceURL = DomUtil.normalizeURL(match.resourceURL);
					if (resourceURL != baseURI && !match.resourceURL.startsWith(DATA_URI_PREFIX)) {
						let importedStylesheetContent = await Download.getContent(new URL(match.resourceURL, baseURI).href);
						importedStylesheetContent = DomUtil.wrapMediaQuery(importedStylesheetContent, match.media);
						if (stylesheetContent.indexOf(cssImport) != -1) {
							stylesheetContent = stylesheetContent.replace(cssImport, importedStylesheetContent);
						}
					}
				}
			}));
			stylesheetContent = DomProcessorHelper.resolveStylesheetURLs(stylesheetContent, baseURI);
			if (imports.length) {
				return await DomProcessorHelper.resolveImportURLs(stylesheetContent, baseURI);
			} else {
				return stylesheetContent;
			}
		}

		static resolveStylesheetURLs(stylesheetContent, baseURI) {
			const urlFunctions = DomUtil.getUrlFunctions(stylesheetContent);
			urlFunctions.map(urlFunction => {
				let resourceURL = DomUtil.matchURL(urlFunction);
				resourceURL = DomUtil.normalizeURL(resourceURL);
				if (resourceURL && resourceURL != baseURI && !resourceURL.startsWith(DATA_URI_PREFIX)) {
					stylesheetContent = stylesheetContent.replace(urlFunction, urlFunction.replace(resourceURL, new URL(resourceURL, baseURI).href));
				}
			});
			return stylesheetContent;
		}

		static async resolveLinkStylesheetURLs(resourceURL, baseURI, media) {
			resourceURL = DomUtil.normalizeURL(resourceURL);
			if (resourceURL && resourceURL != baseURI && !resourceURL.startsWith(DATA_URI_PREFIX)) {
				let stylesheetContent = await Download.getContent(resourceURL);
				stylesheetContent = await DomProcessorHelper.resolveImportURLs(stylesheetContent, resourceURL);
				stylesheetContent = DomUtil.wrapMediaQuery(stylesheetContent, media);
				return stylesheetContent;
			}
		}

		static async processStylesheet(stylesheetContent, baseURI) {
			const urlFunctions = DomUtil.getUrlFunctions(stylesheetContent);
			await Promise.all(urlFunctions.map(async urlFunction => {
				let resourceURL = DomUtil.matchURL(urlFunction);
				resourceURL = DomUtil.normalizeURL(resourceURL);
				if (resourceURL && resourceURL != baseURI && !resourceURL.startsWith(DATA_URI_PREFIX)) {
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
					if (resourceURL && resourceURL != baseURI && !resourceURL.startsWith(DATA_URI_PREFIX)) {
						try {
							const dataURI = await batchRequest.addURL(new URL(resourceURL, baseURI).href);
							resourceElement.setAttribute(attributeName, dataURI);
						} catch (e) {
							// ignored
						}
					}
				}
			}));
		}

		static async processSrcSet(resourceElements, baseURI) {
			await Promise.all(Array.from(resourceElements).map(async resourceElement => {
				const attributeValue = resourceElement.getAttribute("srcset");
				const srcSet = await Promise.all(attributeValue.split(",").map(async src => {
					let [resourceURL, descriptor] = src.trim().split(/\s+/);
					resourceURL = DomUtil.normalizeURL(resourceURL);
					if (resourceURL && resourceURL != baseURI && !resourceURL.startsWith(DATA_URI_PREFIX)) {
						try {
							const dataURI = await batchRequest.addURL(new URL(resourceURL, baseURI).href);
							return dataURI + (descriptor ? " " + descriptor : "");
						} catch (e) {
							// ignored
						}
					}
				}));
				resourceElement.setAttribute("srcset", srcSet.join(","));
			}));
		}
	}

	// -------
	// DomUtil
	// -------
	const REGEXP_URL_FN = /(url\s*\(\s*'([^']*)'\s*\))|(url\s*\(\s*"([^"]*)"\s*\))|(url\s*\(\s*([^)]*)\s*\))/gi;
	const REGEXP_URL_SIMPLE_QUOTES_FN = /^url\s*\(\s*'([^']*)'\s*\)$/i;
	const REGEXP_URL_DOUBLE_QUOTES_FN = /^url\s*\(\s*"([^"]*)"\s*\)$/i;
	const REGEXP_URL_NO_QUOTES_FN = /^url\s*\(\s*([^)]*)\s*\)$/i;
	const REGEXP_IMPORT_FN = /(@import\s*url\s*\(\s*'([^']*)'\s*\)\s*([^;]*);?)|(@import\s*url\s*\(\s*"([^"]*)"\s*\)\s*([^;]*);?)|(@import\s*url\s*\(\s*([^)]*)\s*\)\s*([^;]*);?)|(@import\s*\(\s*'([^']*)'\s*\)\s*([^;]*);?)|(@import\s*\(\s*"([^"]*)"\s*\)\s*([^;]*);?)|(@import\s*\(\s*([^)]*)\s*\)\s*([^;]*);?)/gi;
	const REGEXP_IMPORT_URL_SIMPLE_QUOTES_FN = /@import\s*url\s*\(\s*'([^']*)'\s*\)\s*([^;]*)/i;
	const REGEXP_IMPORT_URL_DOUBLE_QUOTES_FN = /@import\s*url\s*\(\s*"([^"]*)"\s*\)\s*([^;]*)/i;
	const REGEXP_IMPORT_URL_NO_QUOTES_FN = /@import\s*url\s*\(\s*([^)]*)\s*\)\s*([^;]*)/i;
	const REGEXP_IMPORT_SIMPLE_QUOTES_FN = /@import\s*\(\s*'([^']*)'\s*\)\s*([^;]*)/i;
	const REGEXP_IMPORT_DOUBLE_QUOTES_FN = /@import\s*\(\s*"([^"]*)"\s*\)\s*([^;]*)/i;
	const REGEXP_IMPORT_NO_QUOTES_FN = /@import\s*\(\s*([^)]*)\s*\)\s*([^;]*)/i;

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

	return SingleFileCore;

})();

if (typeof module != "undefined") {
	module.exports = SingleFileCore;
}