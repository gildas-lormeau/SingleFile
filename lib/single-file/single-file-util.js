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

/* global DOMParser, URL, Blob, FileReader */

this.singlefile.lib.util = this.singlefile.lib.util || (() => {

	const DEBUG = false;
	const ONE_MB = 1024 * 1024;
	const PREFIX_CONTENT_TYPE_TEXT = "text/";

	return {
		getInstance: (modules, util) => {
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

			return {
				getContent,
				parseURL(resourceURL, baseURI) {
					return new URL(resourceURL, baseURI);
				},
				resolveURL(resourceURL, baseURI) {
					return this.parseURL(resourceURL, baseURI).href;
				},
				parseDocContent(content, baseURI) {
					const doc = (new DOMParser()).parseFromString(content, "text/html");
					if (!doc.head) {
						doc.documentElement.insertBefore(doc.createElement("HEAD"), doc.body);
					}
					let baseElement = doc.querySelector("base");
					if (!baseElement || !baseElement.getAttribute("href")) {
						if (baseElement) {
							baseElement.remove();
						}
						baseElement = doc.createElement("base");
						baseElement.setAttribute("href", baseURI);
						doc.head.insertBefore(baseElement, doc.head.firstChild);
					}
					return doc;
				},
				parseXMLContent(content) {
					return (new DOMParser()).parseFromString(content, "text/xml");
				},
				parseSVGContent(content) {
					return (new DOMParser()).parseFromString(content, "image/svg+xml");
				},
				async digest(algo, text) {
					return util.digestText(algo, text);
				},
				async validFont(urlFunction) {
					return util.isValidFontUrl(urlFunction);
				},
				getContentSize(content) {
					return new Blob([content]).size;
				},
				async truncateText(content, maxSize) {
					const blob = new Blob([content]);
					const reader = new FileReader();
					reader.readAsText(blob.slice(0, maxSize));
					return new Promise((resolve, reject) => {
						reader.addEventListener("load", () => {
							if (content.startsWith(reader.result)) {
								resolve(reader.result);
							} else {
								this.truncateText(content, maxSize - 1).then(resolve).catch(reject);
							}
						}, false);
						reader.addEventListener("error", reject, false);
					});
				},
				minifyHTML(doc, options) {
					return modules.htmlMinifier.process(doc, options);
				},
				postMinifyHTML(doc) {
					return modules.htmlMinifier.postProcess(doc);
				},
				minifyCSSRules(stylesheets, styles, mediaAllInfo) {
					return modules.cssRulesMinifier.process(stylesheets, styles, mediaAllInfo);
				},
				removeUnusedFonts(doc, stylesheets, styles, options) {
					return modules.fontsMinifier.process(doc, stylesheets, styles, options);
				},
				removeAlternativeFonts(doc, stylesheets) {
					return modules.fontsAltMinifier.process(doc, stylesheets);
				},
				getMediaAllInfo(doc, stylesheets, styles) {
					return modules.matchedRules.getMediaAllInfo(doc, stylesheets, styles);
				},
				compressCSS(content, options) {
					return modules.cssMinifier.processString(content, options);
				},
				minifyMedias(stylesheets) {
					return modules.mediasAltMinifier.process(stylesheets);
				},
				removeAlternativeImages(doc) {
					return modules.imagesAltMinifier.process(doc);
				},
				parseSrcset(srcset) {
					return modules.srcsetParser.process(srcset);
				},
				preProcessDoc(doc, win, options) {
					return modules.helper.preProcessDoc(doc, win, options);
				},
				postProcessDoc(doc, markedElements) {
					modules.helper.postProcessDoc(doc, markedElements);
				},
				serialize(doc, compressHTML) {
					return modules.serializer.process(doc, compressHTML);
				},
				removeQuotes(string) {
					return modules.helper.removeQuotes(string);
				},
				WIN_ID_ATTRIBUTE_NAME: modules.helper.WIN_ID_ATTRIBUTE_NAME,
				REMOVED_CONTENT_ATTRIBUTE_NAME: modules.helper.REMOVED_CONTENT_ATTRIBUTE_NAME,
				IMAGE_ATTRIBUTE_NAME: modules.helper.IMAGE_ATTRIBUTE_NAME,
				POSTER_ATTRIBUTE_NAME: modules.helper.POSTER_ATTRIBUTE_NAME,
				CANVAS_ATTRIBUTE_NAME: modules.helper.CANVAS_ATTRIBUTE_NAME,
				HTML_IMPORT_ATTRIBUTE_NAME: modules.helper.HTML_IMPORT_ATTRIBUTE_NAME,
				INPUT_VALUE_ATTRIBUTE_NAME: modules.helper.INPUT_VALUE_ATTRIBUTE_NAME,
				SHADOW_ROOT_ATTRIBUTE_NAME: modules.helper.SHADOW_ROOT_ATTRIBUTE_NAME,
				PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME: modules.helper.PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME,
				STYLESHEET_ATTRIBUTE_NAME: modules.helper.STYLESHEET_ATTRIBUTE_NAME
			};

			async function getContent(resourceURL, options) {
				let resourceContent, startTime;
				if (DEBUG) {
					startTime = Date.now();
					log("  // STARTED download url =", resourceURL, "asBinary =", options.asBinary);
				}
				try {
					resourceContent = await util.getResourceContent(resourceURL, {
						referrerPolicy: options.referrerPolicy,
						credentials: options.credentials
					});
				} catch (error) {
					return { data: options.asBinary ? "data:base64," : "", resourceURL };
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
							charset = modules.helper.removeQuotes(matchCharset[1].trim());
						}
					}
				}
				if (!charset && options.charset) {
					charset = options.charset;
				}
				if (options.asBinary) {
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

		}
	};

	function log(...args) {
		console.log("S-File <browser>", ...args); // eslint-disable-line no-console
	}

})();