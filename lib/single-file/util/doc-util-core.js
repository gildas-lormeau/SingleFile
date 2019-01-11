/*
 * Copyright 2010-2019 Gildas Lormeau
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

this.DocUtilCore = this.DocUtilCore || (() => {

	const DEBUG = false;
	const ONE_MB = 1024 * 1024;
	const PREFIX_CONTENT_TYPE_TEXT = "text/";

	return {
		getClass: (modules, domUtil) => {
			if (modules.serializer === undefined) {
				modules.serializer = {
					process(doc) {
						const docType = doc.doctype;
						let docTypeString = "";
						if (docType) {
							docTypeString = "<!DOCTYPE " + docType.nodeName;
							if (docType.publicId) {
								docTypeString += " PUBLIC \"" + docType.publicId + "\"";
								if (docType.systemId)
									docTypeString += " \"" + docType.systemId + "\"";
							} else if (docType.systemId)
								docTypeString += " SYSTEM \"" + docType.systemId + "\"";
							if (docType.internalSubset)
								docTypeString += " [" + docType.internalSubset + "]";
							docTypeString += "> ";
						}
						return docTypeString + doc.documentElement.outerHTML;
					}
				};
			}

			return class DocUtil {
				static async getContent(resourceURL, options) {
					let resourceContent, startTime;
					if (DEBUG) {
						startTime = Date.now();
						log("  // STARTED download url =", resourceURL, "asDataURI =", options.asDataURI);
					}
					try {
						resourceContent = await domUtil.getResourceContent(resourceURL, options);
					} catch (error) {
						return { data: options.asDataURI ? "data:base64," : "", resourceURL };
					}
					resourceURL = resourceContent.getUrl();
					let contentType = resourceContent.getContentType();
					let charset;
					if (contentType) {
						const matchContentType = contentType.toLowerCase().split(";");
						contentType = matchContentType[0].trim();
						if (!contentType.includes("/")) {
							contentType = null;
						}
						const charsetValue = matchContentType[1] && matchContentType[1].trim();
						if (charsetValue) {
							const matchCharset = charsetValue.match(/^charset=(.*)/);
							if (matchCharset && matchCharset[1]) {
								charset = modules.docHelper.removeQuotes(matchCharset[1].trim());
							}
						}
					}
					if (!charset && options.charset) {
						charset = options.charset;
					}
					if (options.asDataURI) {
						try {
							if (DEBUG) {
								log("  // ENDED   download url =", resourceURL, "delay =", Date.now() - startTime);
							}
							if (options.maxResourceSizeEnabled && resourceContent.getSize() > options.maxResourceSize * ONE_MB) {
								return { data: "data:base64,", resourceURL };
							} else {
								const dataUri = await resourceContent.getDataUri(contentType);
								return { data: dataUri, resourceURL };
							}
						} catch (error) {
							return { data: "data:base64,", resourceURL };
						}
					} else {
						if (resourceContent.getStatusCode() >= 400 || (options.validateTextContentType && contentType && !contentType.startsWith(PREFIX_CONTENT_TYPE_TEXT))) {
							return { data: "", resourceURL };
						}
						if (!charset) {
							charset = "utf-8";
						}
						if (DEBUG) {
							log("  // ENDED   download url =", resourceURL, "delay =", Date.now() - startTime);
						}
						if (options.maxResourceSizeEnabled && resourceContent.getSize() > options.maxResourceSize * ONE_MB) {
							return { data: "", resourceURL, charset };
						} else {
							try {
								return { data: resourceContent.getText(charset), resourceURL, charset };
							} catch (error) {
								try {
									charset = "utf-8";
									return { data: resourceContent.getText(charset), resourceURL, charset };
								} catch (error) {
									return { data: "", resourceURL, charset };
								}
							}
						}
					}
				}

				static parseURL(resourceURL, baseURI) {
					return domUtil.parseURL(resourceURL, baseURI);
				}

				static resolveURL(resourceURL, baseURI) {
					return this.parseURL(resourceURL, baseURI).href;
				}

				static parseDocContent(content, baseURI) {
					return domUtil.parseDocContent(content, baseURI);
				}

				static parseSVGContent(content) {
					return domUtil.parseSVGContent(content);
				}

				static async digest(algo, text) {
					return domUtil.digestText(algo, text);
				}

				static getContentSize(content) {
					return domUtil.getContentSize(content);
				}

				static async validFont(urlFunction) {
					return domUtil.isValidFontUrl(urlFunction);
				}

				static minifyHTML(doc, options) {
					return modules.htmlMinifier.process(doc, options);
				}

				static postMinifyHTML(doc) {
					return modules.htmlMinifier.postProcess(doc);
				}

				static minifyCSSRules(stylesheets, styles, mediaAllInfo) {
					return modules.cssRulesMinifier.process(stylesheets, styles, mediaAllInfo);
				}

				static removeUnusedFonts(doc, stylesheets, styles, options) {
					return modules.fontsMinifier.process(doc, stylesheets, styles, options);
				}

				static removeAlternativeFonts(doc, stylesheets) {
					return modules.fontsAltMinifier.process(doc, stylesheets);
				}

				static getMediaAllInfo(doc, stylesheets, styles) {
					return modules.matchedRules.getMediaAllInfo(doc, stylesheets, styles);
				}

				static compressCSS(content, options) {
					return modules.cssMinifier.processString(content, options);
				}

				static minifyMedias(stylesheets) {
					return modules.mediasMinifier.process(stylesheets);
				}

				static removeAlternativeImages(doc, options) {
					return modules.imagesAltMinifier.process(doc, options);
				}

				static parseSrcset(srcset) {
					return modules.srcsetParser.process(srcset);
				}

				static preProcessDoc(doc, win, options) {
					return modules.docHelper.preProcessDoc(doc, win, options);
				}

				static postProcessDoc(doc, options) {
					modules.docHelper.postProcessDoc(doc, options);
				}

				static serialize(doc, compressHTML) {
					return modules.serializer.process(doc, compressHTML);
				}

				static removeQuotes(string) {
					return modules.docHelper.removeQuotes(string);
				}

				static windowIdAttributeName(sessionId) {
					return modules.docHelper.windowIdAttributeName(sessionId);
				}

				static preservedSpaceAttributeName(sessionId) {
					return modules.docHelper.preservedSpaceAttributeName(sessionId);
				}

				static removedContentAttributeName(sessionId) {
					return modules.docHelper.removedContentAttributeName(sessionId);
				}

				static imagesAttributeName(sessionId) {
					return modules.docHelper.imagesAttributeName(sessionId);
				}

				static inputValueAttributeName(sessionId) {
					return modules.docHelper.inputValueAttributeName(sessionId);
				}

				static shadowRootAttributeName(sessionId) {
					return modules.docHelper.shadowRootAttributeName(sessionId);
				}
			};
		}
	};

	function log(...args) {
		console.log("S-File <browser>", ...args); // eslint-disable-line no-console
	}

})();