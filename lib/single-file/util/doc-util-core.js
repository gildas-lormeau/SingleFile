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

/* global 
	cssMinifier, 
	cssRulesMinifier, 
	docHelper, 
	fontsAltMinifier, 
	fontsMinifier, 
	htmlMinifier, 
	imagesAltMinifier, 
	matchedRules, 
	mediasMinifier, 
	serializer, 
	srcsetParser, 
	URL */

this.DocUtilCore = this.DocUtilCore || (() => {

	if (this.serializer === undefined) {
		this.serializer = {
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
		getClass: (getContent, parseDocContent, parseSVGContent, isValidFontUrl, getContentSize, digestText) => {
			return class DocUtl {
				static async getContent(resourceURL, options) {
					return getContent(resourceURL, options);
				}

				static parseURL(resourceURL, baseURI) {
					return new URL(resourceURL, baseURI);
				}

				static resolveURL(resourceURL, baseURI) {
					return this.parseURL(resourceURL, baseURI).href;
				}

				static parseDocContent(content, baseURI) {
					return parseDocContent(content, baseURI);
				}

				static parseSVGContent(content) {
					return parseSVGContent(content);
				}

				static async digest(algo, text) {
					return digestText(algo, text);
				}

				static getContentSize(content) {
					return getContentSize(content);
				}

				static async validFont(urlFunction) {
					return isValidFontUrl(urlFunction);
				}

				static minifyHTML(doc, options) {
					return htmlMinifier.process(doc, options);
				}

				static postMinifyHTML(doc) {
					return htmlMinifier.postProcess(doc);
				}

				static minifyCSSRules(stylesheets, styles, mediaAllInfo) {
					return cssRulesMinifier.process(stylesheets, styles, mediaAllInfo);
				}

				static removeUnusedFonts(doc, stylesheets, styles, options) {
					return fontsMinifier.process(doc, stylesheets, styles, options);
				}

				static removeAlternativeFonts(doc, stylesheets) {
					return fontsAltMinifier.process(doc, stylesheets);
				}

				static getMediaAllInfo(doc, stylesheets, styles) {
					return matchedRules.getMediaAllInfo(doc, stylesheets, styles);
				}

				static compressCSS(content, options) {
					return cssMinifier.processString(content, options);
				}

				static minifyMedias(stylesheets) {
					return mediasMinifier.process(stylesheets);
				}

				static removeAlternativeImages(doc, options) {
					return imagesAltMinifier.process(doc, options);
				}

				static parseSrcset(srcset) {
					return srcsetParser.process(srcset);
				}

				static preProcessDoc(doc, win, options) {
					return docHelper.preProcessDoc(doc, win, options);
				}

				static postProcessDoc(doc, options) {
					docHelper.postProcessDoc(doc, options);
				}

				static serialize(doc, compressHTML) {
					return serializer.process(doc, compressHTML);
				}

				static removeQuotes(string) {
					return docHelper.removeQuotes(string);
				}

				static windowIdAttributeName(sessionId) {
					return docHelper.windowIdAttributeName(sessionId);
				}

				static preservedSpaceAttributeName(sessionId) {
					return docHelper.preservedSpaceAttributeName(sessionId);
				}

				static removedContentAttributeName(sessionId) {
					return docHelper.removedContentAttributeName(sessionId);
				}

				static imagesAttributeName(sessionId) {
					return docHelper.imagesAttributeName(sessionId);
				}

				static inputValueAttributeName(sessionId) {
					return docHelper.inputValueAttributeName(sessionId);
				}

				static shadowRootAttributeName(sessionId) {
					return docHelper.shadowRootAttributeName(sessionId);
				}
			};
		}
	};

})();