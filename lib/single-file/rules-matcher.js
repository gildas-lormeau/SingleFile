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

/* global CSSRule, cssWhat, parseCss */

this.RulesMatcher = this.RulesMatcher || (() => {

	const MEDIA_ALL = "all";
	const PRIORITY_IMPORTANT = "important";

	return class {
		constructor(doc) {
			this.doc = doc;
			this.mediaAllInfo = createMediaInfo(MEDIA_ALL);
			doc.querySelectorAll("style").forEach((styleElement, styleIndex) => {
				if (styleElement.sheet) {
					if (styleElement.media && styleElement.media != MEDIA_ALL) {
						const mediaInfo = createMediaInfo(styleElement.media);
						this.mediaAllInfo.medias.set(styleElement.media, mediaInfo);
						getMatchedElementsRules(doc, styleElement.sheet.cssRules, mediaInfo, styleIndex);
					} else {
						getMatchedElementsRules(doc, styleElement.sheet.cssRules, this.mediaAllInfo, styleIndex);
					}
				}
			});
			sortRules(this.mediaAllInfo);
			computeCascade(this.mediaAllInfo);
		}

		getAllMatchedRules() {
			return this.mediaAllInfo;
		}

		getMatchedRules(element) {
			this.mediaAllInfo.elements.get(element);
		}
	};

	function getMatchedElementsRules(doc, cssRules, mediaInfo, sheetIndex) {
		Array.from(cssRules).forEach((cssRule, ruleIndex) => {
			if (cssRule.type == CSSRule.MEDIA_RULE) {
				const ruleMediaInfo = createMediaInfo(cssRule.media);
				mediaInfo.medias.set(cssRule.media, ruleMediaInfo);
				getMatchedElementsRules(doc, cssRule.cssRules, ruleMediaInfo, sheetIndex);
			} else if (cssRule.type == CSSRule.STYLE_RULE) {
				if (cssRule.selectorText) {
					let selectors = cssWhat.parse(cssRule.selectorText);
					const selectorsText = selectors.map(selector => cssWhat.stringify([selector]));
					selectors.forEach(selector => getMatchedElementsSelector(doc, cssRule, selector, selectorsText, mediaInfo, ruleIndex, sheetIndex));
				}
			}
		});
	}

	function getMatchedElementsSelector(doc, cssRule, selector, selectorsText, mediaInfo, ruleIndex, sheetIndex) {
		const selectorText = cssWhat.stringify([selector]);
		const matchedElements = doc.querySelectorAll(selectorText);
		if (matchedElements.length) {
			matchedElements.forEach(element => {
				let elementInfo;
				if (mediaInfo.elements.has(element)) {
					elementInfo = mediaInfo.elements.get(element);
				} else {
					elementInfo = [];
					const elementStyle = element.getAttribute("style");
					if (elementStyle) {
						elementInfo.push({ cssStyle: element.style });
					}
					mediaInfo.elements.set(element, elementInfo);
				}
				const specificity = computeSpecificity(selector);
				specificity.ruleIndex = ruleIndex;
				specificity.sheetIndex = sheetIndex;
				let ruleInfo = elementInfo.find(ruleInfo => ruleInfo.cssRule == cssRule);
				if (ruleInfo) {
					if (compareSpecificity(ruleInfo.specificity, specificity)) {
						ruleInfo.specificity = specificity;
						ruleInfo.selectorText = selectorText;
					}
				} else {
					ruleInfo = { cssRule, specificity, selectorText, selectorsText };
					elementInfo.push(ruleInfo);
				}
			});
		}
	}

	function computeCascade(mediaInfo, parentMediaInfos = []) {
		mediaInfo.elements.forEach(elementInfo => {
			getStylesInfo(elementInfo).forEach((elementStyleInfo, styleName) => {
				let ruleInfo, ascendantMedia, allMedia;
				if (elementStyleInfo.cssRule) {
					ascendantMedia = [mediaInfo, ...parentMediaInfos].find(media => media.rules.get(elementStyleInfo.cssRule)) || mediaInfo;
					ruleInfo = ascendantMedia.rules.get(elementStyleInfo.cssRule);
				}
				if (elementStyleInfo.cssStyle) {
					allMedia = parentMediaInfos[parentMediaInfos.length - 1] || mediaInfo;
					ruleInfo = allMedia.styles.get(elementStyleInfo.cssStyle);
				}
				if (!ruleInfo) {
					ruleInfo = { style: new Map(), matchedSelectors: new Set(), selectorsText: elementStyleInfo.selectorsText };
					if (elementStyleInfo.cssRule) {
						ascendantMedia.rules.set(elementStyleInfo.cssRule, ruleInfo);
					} else {
						allMedia.styles.set(elementStyleInfo.cssStyle, ruleInfo);
					}
				}
				ruleInfo.matchedSelectors.add(elementStyleInfo.selectorText);
				const styleValue = ruleInfo.style.get(styleName);
				if (!styleValue) {
					ruleInfo.style.set(styleName, elementStyleInfo.styleValue);
				}
			});
		});
		mediaInfo.medias.forEach(childMediaInfo => computeCascade(childMediaInfo, [mediaInfo, ...parentMediaInfos]));
	}

	function getStylesInfo(elementInfo) {
		const elementStylesInfo = new Map();
		elementInfo.forEach(ruleInfo => {
			if (ruleInfo.cssStyle) {
				const cssStyle = ruleInfo.cssStyle;
				const stylesInfo = parseCss.parseAListOfDeclarations(cssStyle.cssText);
				stylesInfo.forEach(styleInfo => {
					const important = cssStyle.getPropertyPriority(styleInfo.name) == PRIORITY_IMPORTANT;
					const styleValue = cssStyle.getPropertyValue(styleInfo.name) + (important ? "!" + PRIORITY_IMPORTANT : "");
					elementStylesInfo.set(styleInfo.name, { styleValue, cssStyle: ruleInfo.cssStyle, important });
				});
			} else {
				const cssStyle = ruleInfo.cssRule.style;
				const stylesInfo = parseCss.parseAListOfDeclarations(cssStyle.cssText);
				stylesInfo.forEach(styleInfo => {
					const important = cssStyle.getPropertyPriority(styleInfo.name) == PRIORITY_IMPORTANT;
					const styleValue = cssStyle.getPropertyValue(styleInfo.name) + (important ? "!" + PRIORITY_IMPORTANT : "");
					let elementStyleInfo = elementStylesInfo.get(styleInfo.name);
					if (!elementStyleInfo || (important && !elementStyleInfo.important)) {
						elementStylesInfo.set(styleInfo.name, { styleValue, cssRule: ruleInfo.cssRule, selectorText: ruleInfo.selectorText, selectorsText: ruleInfo.selectorsText, important });
					}
				});
			}
		});
		return elementStylesInfo;
	}

	function createMediaInfo(media) {
		const mediaInfo = { media: media, elements: new Map(), medias: new Map(), rules: new Map() };
		if (media == MEDIA_ALL) {
			mediaInfo.styles = new Map();
		}
		return mediaInfo;
	}

	function sortRules(media) {
		media.elements.forEach(elementRules => elementRules.sort((ruleInfo1, ruleInfo2) =>
			ruleInfo1.cssStyle && !ruleInfo2.cssStyle ? -1 :
				!ruleInfo1.cssStyle && ruleInfo2.cssStyle ? 1 :
					compareSpecificity(ruleInfo1.specificity, ruleInfo2.specificity)));
		media.medias.forEach(sortRules);
	}

	function computeSpecificity(selector, specificity = { a: 0, b: 0, c: 0 }) {
		selector.forEach(token => {
			if (token.expandedSelector && token.type == "attribute" && token.name === "id" && token.action === "equals") {
				specificity.a++;
			}
			if ((!token.expandedSelector && token.type == "attribute") ||
				(token.expandedSelector && token.type == "attribute" && token.name === "class" && token.action === "element") ||
				(token.type == "pseudo" && token.name != "not")) {
				specificity.b++;
			}
			if ((token.type == "tag" && token.value != "*") || (token.type == "pseudo-element")) {
				specificity.c++;
			}
			if (token.data) {
				if (Array.isArray(token.data)) {
					token.data.forEach(selector => computeSpecificity(selector, specificity));
				}
			}
		});
		return specificity;
	}

	function compareSpecificity(specificity1, specificity2) {
		if (specificity1.a > specificity2.a) {
			return -1;
		} else if (specificity1.a < specificity2.a) {
			return 1;
		} else if (specificity1.b > specificity2.b) {
			return -1;
		} else if (specificity1.b < specificity2.b) {
			return 1;
		} else if (specificity1.c > specificity2.c) {
			return -1;
		} else if (specificity1.c < specificity2.c) {
			return 1;
		} else if (specificity1.sheetIndex > specificity2.sheetIndex) {
			return -1;
		} else if (specificity1.sheetIndex < specificity2.sheetIndex) {
			return 1;
		} else if (specificity1.ruleIndex > specificity2.ruleIndex) {
			return -1;
		} else if (specificity1.ruleIndex < specificity2.ruleIndex) {
			return 1;
		} else {
			return -1;
		}
	}

})();