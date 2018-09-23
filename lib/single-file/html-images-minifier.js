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

/* global CSSRule, docHelper, cssWhat, lazyLoader */

this.imagesMinifier = this.imagesMinifier || (() => {

	const DEBUG = false;
	const SVG_NS = "http://www.w3.org/2000/svg";

	return {
		process: (doc, mediaAllInfo, options) => {
			const imageGroups = getImageGroups(doc);
			let duplicates = new Set();
			const duplicateURLs = [];
			imageGroups.forEach((elements, src) => {
				if (elements.length > 1) {
					elements.forEach(element => duplicates.add(element));
					duplicateURLs.push(src);
				}
			});
			if (duplicateURLs.length) {
				processStyleSheets(doc, duplicates, mediaAllInfo);
				processImages(doc, duplicates, duplicateURLs, options);
			}
		}
	};

	function getImageGroups(doc) {
		const imageGroups = new Map();
		doc.querySelectorAll("img[src]:not([srcset])").forEach(imageElement => {
			if (imageElement.src) {
				let imageInfo = imageGroups.get(imageElement.src);
				if (!imageInfo) {
					imageInfo = [];
					imageGroups.set(imageElement.src, imageInfo);
				}
				imageInfo.push(imageElement);
			}
		});
		return imageGroups;
	}

	function processStyleSheets(doc, duplicates, mediaAllInfo) {
		const matchedSelectors = getMatchedSelectors(duplicates, mediaAllInfo);
		doc.querySelectorAll("style").forEach((styleElement, sheetIndex) => {
			if (styleElement.sheet) {
				const cssRules = styleElement.sheet.cssRules;
				let mediaInfo;
				if (styleElement.media && styleElement.media != "all") {
					mediaInfo = mediaAllInfo.medias.get(sheetIndex + "-" + styleElement.media);
				} else {
					mediaInfo = mediaAllInfo;
				}
				styleElement.textContent = processRules(doc, cssRules, sheetIndex, mediaInfo, matchedSelectors);
			}
		});
	}

	function processImages(doc, duplicates, duplicateURLs, options) {
		const svgElement = doc.createElementNS(SVG_NS, "svg");
		const defsElement = doc.createElementNS(SVG_NS, "defs");
		svgElement.setAttributeNS(SVG_NS, "width", 0);
		svgElement.setAttributeNS(SVG_NS, "height", 0);
		svgElement.setAttributeNS(SVG_NS, "style", "display:none!important");
		svgElement.appendChild(defsElement);
		duplicateURLs.forEach((src, srcIndex) => {
			const imageElement = doc.createElementNS(SVG_NS, "image");
			imageElement.setAttribute("xlink:href", src);
			imageElement.id = "single-file-" + srcIndex;
			defsElement.appendChild(imageElement);
		});
		doc.body.appendChild(svgElement);
		const ignoredAttributeNames = [];
		if (options.lazyLoadImages) {
			const imageSelectors = lazyLoader.imageSelectors;
			Object.keys(imageSelectors.src).forEach(selector => ignoredAttributeNames.push(imageSelectors.src[selector]));
			Object.keys(imageSelectors.srcset).forEach(selector => ignoredAttributeNames.push(imageSelectors.srcset[selector]));
		}
		doc.querySelectorAll("img").forEach(imgElement => {
			let replaceImage = !options.lazyLoadImages;
			if (!replaceImage) {
				replaceImage = !Object.keys(ignoredAttributeNames).map(key => ignoredAttributeNames[key]).find(attributeName => imgElement.getAttribute(attributeName));
			}
			if (replaceImage && duplicates.has(imgElement)) {
				const dataAttributeName = docHelper.imagesAttributeName(options.sessionId);
				const imageData = options.imageData[Number(imgElement.getAttribute(dataAttributeName))];
				const svgElement = doc.createElementNS(SVG_NS, "svg");
				const useElement = doc.createElementNS(SVG_NS, "use");
				svgElement.appendChild(useElement);
				imgElement.getAttributeNames().forEach(attributeName => attributeName != "src" && svgElement.setAttribute(attributeName, imgElement.getAttribute(attributeName)));
				svgElement.setAttributeNS(SVG_NS, "viewBox", "0 0 " + imageData.naturalWidth + " " + imageData.naturalHeight);
				svgElement.setAttributeNS(SVG_NS, "width", imageData.clientWidth);
				svgElement.setAttributeNS(SVG_NS, "height", imageData.clientHeight);
				svgElement.setAttributeNS(SVG_NS, "preserveAspectRatio", "none");
				const urlIndex = duplicateURLs.indexOf(imgElement.src);
				useElement.setAttributeNS(SVG_NS, "xlink:href", "#single-file-" + urlIndex);
				const imageElement = doc.getElementById("single-file-" + urlIndex);
				if (!imageElement.getAttributeNS(SVG_NS, "width") && !imageElement.getAttributeNS(SVG_NS, "height") && imageData.naturalWidth && imageData.naturalHeight) {
					imageElement.setAttributeNS(SVG_NS, "viewBox", "0 0 " + imageData.naturalWidth + " " + imageData.naturalHeight);
				}
				svgElement.style.border = "1px solid red";
				imgElement.parentElement.replaceChild(svgElement, imgElement);
			}
		});
	}

	function getMatchedSelectors(duplicates, parentMediaInfo, matchedRules = new Map()) {
		duplicates.forEach(imageElement => {
			let elementInfos = parentMediaInfo.elements.get(imageElement);
			if (!elementInfos) {
				elementInfos = parentMediaInfo.pseudos.get(imageElement);
			}
			if (elementInfos) {
				elementInfos.forEach(elementInfo => {
					if (elementInfo.cssRule) {
						let selectorInfo = matchedRules.get(elementInfo.cssRule.selectorText);
						if (!selectorInfo) {
							matchedRules.set(elementInfo.cssRule.selectorText, elementInfo.selectors);
						}
					}
				});
			}
		});
		parentMediaInfo.medias.forEach(mediaInfo => getMatchedSelectors(duplicates, mediaInfo, matchedRules));
		return matchedRules;
	}

	function processRules(doc, cssRules, sheetIndex, mediaInfo, matchedSelectors) {
		let sheetContent = "", mediaRuleIndex = 0;
		let startTime;
		if (DEBUG && cssRules.length > 1) {
			startTime = Date.now();
			log("  -- STARTED processRules", "rules.length =", cssRules.length);
		}
		Array.from(cssRules).forEach(cssRule => {
			if (cssRule.type == CSSRule.MEDIA_RULE) {
				sheetContent += "@media " + Array.from(cssRule.media).join(",") + "{";
				sheetContent += processRules(doc, cssRule.cssRules, sheetIndex, mediaInfo.medias.get("rule-" + sheetIndex + "-" + mediaRuleIndex + "-" + cssRule.media.mediaText), matchedSelectors);
				mediaRuleIndex++;
				sheetContent += "}";
			} else if (cssRule.type == CSSRule.STYLE_RULE) {
				const selectors = matchedSelectors.get(cssRule.selectorText);
				if (selectors) {
					selectors.forEach(selector => {
						const newSelector = transformSelector(selector);
						if (newSelector) {
							selectors.push(newSelector);
						}
					});
					const selectorText = selectors.map(selector => cssWhat.stringify([selector])).join(",");
					cssRule.selectorText = selectorText;
				}
				sheetContent += cssRule.cssText;
			} else {
				sheetContent += cssRule.cssText;
			}
		});
		if (DEBUG && cssRules.length > 1) {
			log("  -- ENDED   processRules delay =", Date.now() - startTime);
		}
		return sheetContent;
	}

	function transformSelector(selector) {
		selector = JSON.parse(JSON.stringify(selector));
		let simpleSelector, selectorIndex = selector.length - 1, imageTagFound;
		while (selectorIndex >= 0 && !imageTagFound) {
			simpleSelector = selector[selectorIndex];
			imageTagFound = simpleSelector.type == "tag" && simpleSelector.name == "img";
			if (!imageTagFound) {
				selectorIndex--;
			}
		}
		if (imageTagFound) {
			simpleSelector.name = "svg";
			return selector;
		}
	}

	function log(...args) {
		console.log("S-File <img-min>", ...args); // eslint-disable-line no-console
	}

})();