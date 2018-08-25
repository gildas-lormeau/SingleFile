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

this.cssMinifier = this.stylesMinifier || (() => {

	const SEPARATOR_TYPES = ["descendant", "child", "sibling", "adjacent"];
	const REMOVED_PSEUDO_CLASSES = ["focus", "focus-within", "hover", "link", "visited", "active"];
	const REMOVED_PSEUDO_ELEMENTS = ["after", "before", "first-line", "first-letter"];
	const MEDIA_ALL = "all";
	const PRIORITY_IMPORTANT = "important";

	return {
		process: doc => {
			const mediaAllInfo = createMediaInfo(MEDIA_ALL);
			const stats = { processed: 0, discarded: 0 };
			doc.querySelectorAll("style").forEach((styleElement, styleIndex) => {
				if (styleElement.sheet) {
					stats.processed += styleElement.sheet.cssRules.length;
					stats.discarded += styleElement.sheet.cssRules.length;
					if (styleElement.media && styleElement.media != MEDIA_ALL) {
						const mediaInfo = createMediaInfo(styleElement.media);
						mediaAllInfo.medias.set(styleElement.media, mediaInfo);
						getMatchedElements(doc, styleElement.sheet.cssRules, mediaInfo, styleIndex);
					} else {
						getMatchedElements(doc, styleElement.sheet.cssRules, mediaAllInfo, styleIndex);
					}
				}
			});
			sortRules(mediaAllInfo);
			computeCascade(mediaAllInfo);
			doc.querySelectorAll("style").forEach(styleElement => {
				if (styleElement.sheet) {
					replaceRules(doc, styleElement.sheet.cssRules, mediaAllInfo);
					styleElement.textContent = serializeRules(styleElement.sheet.cssRules);
					stats.discarded -= styleElement.sheet.cssRules.length;
				}
			});
			doc.querySelectorAll("[style]").forEach(element => {
				replaceStyle(doc, element.style, mediaAllInfo);
			});
			return stats;
		}
	};

	function getMatchedElements(doc, cssRules, mediaInfo, sheetIndex) {
		Array.from(cssRules).forEach((cssRule, ruleIndex) => {
			if (cssRule.type == CSSRule.MEDIA_RULE) {
				const ruleMediaInfo = createMediaInfo(cssRule.media);
				mediaInfo.medias.set(cssRule.media, ruleMediaInfo);
				getMatchedElements(doc, cssRule.cssRules, ruleMediaInfo, sheetIndex);
			} else if (cssRule.type == CSSRule.STYLE_RULE) {
				if (cssRule.selectorText) {
					const selectors = cssWhat.parse(cssRule.selectorText);
					selectors.forEach((selector, selectorIndex) => {
						doc.querySelectorAll(cssWhat.stringify([selector])).forEach(element => {
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
							elementInfo.push({ cssRule, specificity: computeSpecificity(selector), selectorIndex, ruleIndex, sheetIndex });
						});
					});
				}
			}
		});
	}

	function createMediaInfo(media) {
		const mediaInfo = { media: media, elements: new Map(), medias: new Map(), rules: new Map() };
		if (media == MEDIA_ALL) {
			mediaInfo.styles = new Map();
		}
		return mediaInfo;
	}

	function sortRules(media) {
		media.elements.forEach(elementRules => elementRules.sort(compareRules));
		media.medias.forEach(sortRules);
	}

	function computeCascade(mediaInfo, parentMediaInfos = []) {
		mediaInfo.elements.forEach((elementInfo) => {
			const elementStylesInfo = new Map();
			elementInfo.forEach(ruleInfo => {
				if (ruleInfo.cssStyle) {
					const cssStyle = ruleInfo.cssStyle;
					const stylesInfo = parseCss.parseAListOfDeclarations(cssStyle.cssText);
					stylesInfo.forEach(styleInfo => {
						const important = cssStyle.getPropertyPriority(styleInfo.name) == PRIORITY_IMPORTANT;
						const styleValue = cssStyle.getPropertyValue(styleInfo.name) + (important ? " !" + PRIORITY_IMPORTANT : "");
						elementStylesInfo.set(styleInfo.name, { styleValue, cssStyle: ruleInfo.cssStyle, important });
					});
				} else {
					const cssStyle = ruleInfo.cssRule.style;
					const stylesInfo = parseCss.parseAListOfDeclarations(cssStyle.cssText);
					stylesInfo.forEach(styleInfo => {
						const important = cssStyle.getPropertyPriority(styleInfo.name) == PRIORITY_IMPORTANT;
						const styleValue = cssStyle.getPropertyValue(styleInfo.name) + (important ? " !" + PRIORITY_IMPORTANT : "");
						let elementStyleInfo = elementStylesInfo.get(styleInfo.name);
						if (!elementStyleInfo || (important && !elementStyleInfo.important)) {
							elementStylesInfo.set(styleInfo.name, { styleValue, cssRule: ruleInfo.cssRule, important });
						}
					});
				}
			});
			elementStylesInfo.forEach((styleInfo, styleName) => {
				let ruleInfo, ascendantMedia, allMedia;
				if (styleInfo.cssRule) {
					ascendantMedia = [mediaInfo, ...parentMediaInfos].find(media => media.rules.get(styleInfo.cssRule)) || mediaInfo;
					ruleInfo = ascendantMedia.rules.get(styleInfo.cssRule);
				}
				if (styleInfo.cssStyle) {
					allMedia = parentMediaInfos[parentMediaInfos.length - 1] || mediaInfo;
					ruleInfo = allMedia.styles.get(styleInfo.cssStyle);
				}
				if (!ruleInfo) {
					ruleInfo = new Map();
					if (styleInfo.cssRule) {
						ascendantMedia.rules.set(styleInfo.cssRule, ruleInfo);
					} else {
						allMedia.styles.set(styleInfo.cssStyle, ruleInfo);
					}
				}
				ruleInfo.set(styleName, styleInfo.styleValue);
			});
		});
		mediaInfo.medias.forEach(childMediaInfo => computeCascade(childMediaInfo, [mediaInfo, ...parentMediaInfos]));
	}

	function replaceRules(doc, cssRules, ruleMedia) {
		Array.from(cssRules).forEach(cssRule => {
			if (cssRule.type == CSSRule.MEDIA_RULE) {
				replaceRules(doc, cssRule.cssRules, ruleMedia.medias.get(cssRule.media));
			} else if (cssRule.type == CSSRule.STYLE_RULE) {
				const ruleInfo = ruleMedia.rules.get(cssRule);
				if (ruleInfo) {
					const stylesInfo = parseCss.parseAListOfDeclarations(cssRule.style.cssText);
					const unusedStyles = stylesInfo.filter(style => !ruleInfo.get(style.name));
					if (unusedStyles.length) {
						unusedStyles.forEach(style => cssRule.style.removeProperty(style.name));
					}
				} else {
					if (!testFilterSelector(cssRule.selectorText) || !doc.querySelector(getFilteredSelector(cssRule.selectorText))) {
						const parent = cssRule.parentRule || cssRule.parentStyleSheet;
						let indexRule = 0;
						while (cssRule != parent.cssRules[indexRule] && indexRule < parent.cssRules.length) {
							indexRule++;
						}
						if (cssRule == parent.cssRules[indexRule]) {
							parent.deleteRule(indexRule);
						}
					}
				}
			}
		});
	}

	function replaceStyle(doc, cssStyle, ruleMedia) {
		const styleInfo = ruleMedia.styles.get(cssStyle);
		if (styleInfo) {
			const stylesInfo = parseCss.parseAListOfDeclarations(cssStyle.cssText);
			const unusedStyles = stylesInfo.filter(style => !styleInfo.get(style.name));
			if (unusedStyles.length) {
				unusedStyles.forEach(style => cssStyle.removeProperty(style.name));
			}
		}
	}

	function serializeRules(rules) {
		let sheetContent = "";
		Array.from(rules).forEach(rule => {
			if (rule.media) {
				sheetContent += "@media " + Array.from(rule.media).join(",") + "{";
				sheetContent += serializeRules(rule.cssRules);
				sheetContent += "}";
			} else {
				sheetContent += rule.cssText;
			}
		});
		return sheetContent;
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

	function compareRules(ruleInfo1, ruleInfo2) {
		if (ruleInfo1.cssStyle && !ruleInfo2.cssStyle) {
			return -1;
		} else if (!ruleInfo1.cssStyle && ruleInfo2.cssStyle) {
			return 1;
		} else if (ruleInfo1.specificity.a > ruleInfo2.specificity.a) {
			return -1;
		} else if (ruleInfo1.specificity.a < ruleInfo2.specificity.a) {
			return 1;
		} else if (ruleInfo1.specificity.b > ruleInfo2.specificity.b) {
			return -1;
		} else if (ruleInfo1.specificity.b < ruleInfo2.specificity.b) {
			return 1;
		} else if (ruleInfo1.specificity.c > ruleInfo2.specificity.c) {
			return -1;
		} else if (ruleInfo1.specificity.c < ruleInfo2.specificity.c) {
			return 1;
		} else if (ruleInfo1.sheetIndex > ruleInfo2.sheetIndex) {
			return -1;
		} else if (ruleInfo1.sheetIndex < ruleInfo2.sheetIndex) {
			return 1;
		} else if (ruleInfo1.ruleIndex > ruleInfo2.ruleIndex) {
			return -1;
		} else if (ruleInfo1.ruleIndex < ruleInfo2.ruleIndex) {
			return 1;
		} else if (ruleInfo1.selectorIndex > ruleInfo2.selectorIndex) {
			return -1;
		} else if (ruleInfo1.selectorIndex < ruleInfo2.selectorIndex) {
			return 1;
		} else {
			return -1;
		}
	}

	function testFilterSelector(selector) {
		return REMOVED_PSEUDO_CLASSES.find(pseudoClass => selector.includes(":" + pseudoClass)) || REMOVED_PSEUDO_ELEMENTS.find(pseudoElement => selector.includes("::" + pseudoElement));
	}

	function getFilteredSelector(selector) {
		const selectors = cssWhat.parse(selector);
		return cssWhat.stringify(selectors.map(selector => filterPseudoClasses(selector)));

		function filterPseudoClasses(selector) {
			const tokens = selector.filter(token => {
				if (token.data) {
					if (Array.isArray(token.data)) {
						token.data = token.data.map(selector => filterPseudoClasses(selector));
					}
				}
				const test = ((token.type != "pseudo" || !REMOVED_PSEUDO_CLASSES.includes(token.name))
					&& (token.type != "pseudo-element" || !REMOVED_PSEUDO_ELEMENTS.includes(token.name)));
				return test;
			});
			let insertedTokens = 0;
			tokens.forEach((token, index) => {
				if (SEPARATOR_TYPES.includes(token.type)) {
					if (!tokens[index - 1] || SEPARATOR_TYPES.includes(tokens[index - 1].type)) {
						tokens.splice(index + insertedTokens, 0, { type: "universal" });
						insertedTokens++;
					}
				}
			});
			if (!tokens.length || SEPARATOR_TYPES.includes(tokens[tokens.length - 1].type)) {
				tokens.push({ type: "universal" });
			}
			return tokens;
		}
	}

})();