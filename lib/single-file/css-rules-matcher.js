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
	const SEPARATOR_TYPES = ["descendant", "child", "sibling", "adjacent"];
	const PSEUDOS_CLASSES = [":focus", ":focus-within", ":hover", ":link", ":visited", ":active"];
	const SELECTOR_TOKEN_TYPE_TAG = "tag";
	const SELECTOR_TOKEN_TYPE_ATTRIBUTE = "attribute";
	const SELECTOR_TOKEN_TYPE_PSEUDO = "pseudo";
	const SELECTOR_TOKEN_TYPE_PSEUDO_ELEMENT = "pseudo-element";
	const SELECTOR_TOKEN_NAME_ID = "id";
	const SELECTOR_TOKEN_NAME_CLASS = "class";
	const SELECTOR_TOKEN_NAME_NOT = "not";
	const SELECTOR_TOKEN_ACTION_EQUALS = "equals";
	const SELECTOR_TOKEN_ACTION_ELEMENT = "element";
	const SELECTOR_TOKEN_VALUE_STAR = "*";
	const DEBUG = false;

	class RulesMatcher {
		constructor(doc) {
			this.doc = doc;
			this.mediaAllInfo = createMediaInfo(MEDIA_ALL);
			const matchedElementsCache = new Map();
			doc.querySelectorAll("style").forEach((styleElement, sheetIndex) => {
				if (styleElement.sheet) {
					const cssRules = styleElement.sheet.cssRules;
					if (styleElement.media && styleElement.media != MEDIA_ALL) {
						const mediaInfo = createMediaInfo(styleElement.media);
						this.mediaAllInfo.medias.set("style-" + sheetIndex + "-" + styleElement.media, mediaInfo);
						getMatchedElementsRules(doc, cssRules, mediaInfo, sheetIndex, matchedElementsCache);
					} else {
						getMatchedElementsRules(doc, cssRules, this.mediaAllInfo, sheetIndex, matchedElementsCache);
					}
				}
			});
			let startTime;
			if (DEBUG) {
				startTime = Date.now();
				log("  -- STARTED sortRules");
			}
			sortRules(this.mediaAllInfo);
			if (DEBUG) {
				log("  -- ENDED sortRules", Date.now() - startTime);
				startTime = Date.now();
				log("  -- STARTED computeCascade");
			}
			computeCascade(this.mediaAllInfo, [], this.mediaAllInfo);
			if (DEBUG) {
				log("  -- ENDED computeCascade", Date.now() - startTime);
			}
		}

		getMediaAllInfo() {
			return this.mediaAllInfo;
		}

		getMatchedRules(element) {
			this.mediaAllInfo.elements.get(element);
		}
	}

	return {
		create(doc) {
			return new RulesMatcher(doc);
		}
	};

	function getMatchedElementsRules(doc, cssRules, mediaInfo, sheetIndex, matchedElementsCache) {
		let mediaIndex = 0;
		let startTime;
		if (DEBUG && cssRules.length > 1) {
			startTime = Date.now();
			log("  -- STARTED getMatchedElementsRules", " index =", sheetIndex, "rules.length =", cssRules.length);
		}
		Array.from(cssRules).forEach((cssRule, ruleIndex) => {
			const cssRuleType = cssRule.type;
			if (cssRuleType == CSSRule.MEDIA_RULE) {
				const cssRuleMedia = cssRule.media;
				const ruleMediaInfo = createMediaInfo(cssRuleMedia);
				mediaInfo.medias.set("rule-" + sheetIndex + "-" + mediaIndex + "-" + cssRuleMedia.mediaText, ruleMediaInfo);
				mediaIndex++;
				getMatchedElementsRules(doc, cssRule.cssRules, ruleMediaInfo, sheetIndex, matchedElementsCache);
			} else if (cssRuleType == CSSRule.STYLE_RULE) {
				const selectorText = cssRule.selectorText;
				if (selectorText) {
					let selectors;
					try {
						selectors = cssWhat.parse(selectorText.trim());
					} catch (error) {
						/* ignored */
					}
					if (selectors) {
						const selectorsText = selectors.map(selector => cssWhat.stringify([selector]));
						const ruleInfo = { cssRule, mediaInfo, ruleIndex, sheetIndex, matchedSelectors: new Set(), style: new Map(), selectors, selectorsText };
						selectors.forEach((selector, selectorIndex) => {
							const selectorText = selectorsText[selectorIndex];
							const selectorInfo = { selector, selectorText, ruleInfo };
							getMatchedElementsSelector(doc, selectorInfo, matchedElementsCache);
						});
					}
				}
			}
		});
		if (DEBUG && cssRules.length > 1) {
			log("  -- ENDED   getMatchedElementsRules", "delay =", Date.now() - startTime);
		}
	}

	function getMatchedElementsSelector(doc, selectorInfo, matchedElementsCache) {
		let selectorText;
		const filteredSelectorText = getFilteredSelector(selectorInfo.selectorText);
		if (filteredSelectorText != selectorInfo.selectorText) {
			selectorText = filteredSelectorText;
		} else {
			selectorText = selectorInfo.selectorText;
		}
		const cachedMatchedElements = matchedElementsCache.get(selectorText);
		const matchedElements = cachedMatchedElements || doc.querySelectorAll(selectorText);
		if (!cachedMatchedElements) {
			matchedElementsCache.set(selectorText, matchedElements);
		}
		if (matchedElements.length) {
			if (filteredSelectorText != selectorInfo.selectorText) {
				selectorInfo.ruleInfo.mediaInfo.pseudoSelectors.add(selectorInfo.ruleInfo.cssRule.selectorText);
				matchedElements.forEach(element => addPseudoRule(element, selectorInfo));
			} else {
				matchedElements.forEach(element => addRule(element, selectorInfo));
			}
		}
	}

	function addRule(element, selectorInfo) {
		const mediaInfo = selectorInfo.ruleInfo.mediaInfo;
		let elementInfo = mediaInfo.elements.get(element);
		if (!elementInfo) {
			elementInfo = [];
			const elementStyle = element.style;
			if (elementStyle && elementStyle.length) {
				elementInfo.push({ styleInfo: { cssStyle: elementStyle, style: new Map() } });
			}
			mediaInfo.elements.set(element, elementInfo);
		}
		const specificity = computeSpecificity(selectorInfo.selector);
		specificity.ruleIndex = selectorInfo.ruleInfo.ruleIndex;
		specificity.sheetIndex = selectorInfo.ruleInfo.sheetIndex;
		selectorInfo.specificity = specificity;
		elementInfo.push(selectorInfo);
	}

	function addPseudoRule(element, selectorInfo) {
		let elementInfo = selectorInfo.ruleInfo.mediaInfo.pseudos.get(element);
		if (!elementInfo) {
			elementInfo = [];
			selectorInfo.ruleInfo.mediaInfo.pseudos.set(element, elementInfo);
		}
		elementInfo.push(selectorInfo);
	}

	function computeCascade(mediaInfo, parentMediaInfos, mediaAllInfo) {
		mediaInfo.elements.forEach(elementInfo => getStylesInfo(elementInfo).forEach((elementStyleInfo, styleName) => {
			if (elementStyleInfo.selectorInfo.ruleInfo) {
				const ruleInfo = elementStyleInfo.selectorInfo.ruleInfo;
				const cssRule = ruleInfo.cssRule;
				const ascendantMedia = [mediaInfo, ...parentMediaInfos].find(media => media.rules.get(cssRule)) || mediaInfo;
				ascendantMedia.rules.set(cssRule, ruleInfo);
				if (cssRule) {
					ruleInfo.matchedSelectors.add(elementStyleInfo.selectorInfo.selectorText);
				}
				const styleValue = ruleInfo.style.get(styleName);
				if (!styleValue) {
					ruleInfo.style.set(styleName, elementStyleInfo.styleValue);
				}
			} else if (mediaInfo == mediaAllInfo) {
				const styleInfo = elementStyleInfo.selectorInfo.styleInfo;
				const cssStyle = styleInfo.cssStyle;
				const matchedStyleInfo = mediaAllInfo.matchedStyles.get(cssStyle);
				if (!matchedStyleInfo) {
					mediaAllInfo.matchedStyles.set(cssStyle, styleInfo);
				}
				const styleValue = styleInfo.style.get(styleName);
				if (!styleValue) {
					styleInfo.style.set(styleName, elementStyleInfo.styleValue);
				}
			}
		}));
		mediaInfo.medias.forEach(childMediaInfo => computeCascade(childMediaInfo, [mediaInfo, ...parentMediaInfos], mediaAllInfo));
	}

	function getStylesInfo(elementInfo) {
		const elementStylesInfo = new Map();
		elementInfo.forEach(selectorInfo => {
			if (selectorInfo.styleInfo) {
				const cssStyle = selectorInfo.styleInfo.cssStyle;
				const stylesInfo = parseCss.parseAListOfDeclarations(cssStyle.cssText);
				stylesInfo.forEach(styleInfo => {
					const important = cssStyle.getPropertyPriority(styleInfo.name);
					const styleValue = cssStyle.getPropertyValue(styleInfo.name) + (important && "!" + important);
					elementStylesInfo.set(styleInfo.name, { selectorInfo, styleValue, important });
				});
			} else {
				const cssStyle = selectorInfo.ruleInfo.cssRule.style;
				const stylesInfo = parseCss.parseAListOfDeclarations(cssStyle.cssText);
				stylesInfo.forEach(styleInfo => {
					const important = cssStyle.getPropertyPriority(styleInfo.name);
					const styleValue = cssStyle.getPropertyValue(styleInfo.name) + (important && "!" + important);
					const elementStyleInfo = elementStylesInfo.get(styleInfo.name);
					if (!elementStyleInfo || (important && !elementStyleInfo.important)) {
						elementStylesInfo.set(styleInfo.name, { selectorInfo, styleValue, important });
					}
				});
			}
		});
		return elementStylesInfo;
	}

	function createMediaInfo(media) {
		const mediaInfo = { media: media, elements: new Map(), pseudos: new Map(), medias: new Map(), rules: new Map(), pseudoSelectors: new Set() };
		if (media == MEDIA_ALL) {
			mediaInfo.matchedStyles = new Map();
		}
		return mediaInfo;
	}

	function sortRules(media) {
		media.elements.forEach(elementRules => elementRules.sort((ruleInfo1, ruleInfo2) =>
			ruleInfo1.styleInfo && !ruleInfo2.styleInfo ? -1 :
				!ruleInfo1.styleInfo && ruleInfo2.styleInfo ? 1 :
					compareSpecificity(ruleInfo1.specificity, ruleInfo2.specificity)));
		media.medias.forEach(sortRules);
	}

	function computeSpecificity(selector, specificity = { a: 0, b: 0, c: 0 }) {
		selector.forEach(token => {
			if (token.expandedSelector && token.type == SELECTOR_TOKEN_TYPE_ATTRIBUTE && token.name == SELECTOR_TOKEN_NAME_ID && token.action == SELECTOR_TOKEN_ACTION_EQUALS) {
				specificity.a++;
			}
			if ((!token.expandedSelector && token.type == SELECTOR_TOKEN_TYPE_ATTRIBUTE) ||
				(token.expandedSelector && token.type == SELECTOR_TOKEN_TYPE_ATTRIBUTE && token.name == SELECTOR_TOKEN_NAME_CLASS && token.action == SELECTOR_TOKEN_ACTION_ELEMENT) ||
				(token.type == SELECTOR_TOKEN_TYPE_PSEUDO && token.name != SELECTOR_TOKEN_NAME_NOT)) {
				specificity.b++;
			}
			if ((token.type == SELECTOR_TOKEN_TYPE_TAG && token.value != SELECTOR_TOKEN_VALUE_STAR) || (token.type == SELECTOR_TOKEN_TYPE_PSEUDO_ELEMENT)) {
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

	function getFilteredSelector(selector) {
		let selectors;
		try {
			selectors = cssWhat.parse(selector.trim());
		} catch (error) {
			return selector;
		}
		return cssWhat.stringify(selectors.map(selector => filterPseudoClasses(selector)));

		function filterPseudoClasses(selector, negatedData) {
			const tokens = selector.filter(token => {
				if (token.data) {
					if (Array.isArray(token.data)) {
						token.data = token.data.map(selector => filterPseudoClasses(selector, token.name == "not" && token.type == "pseudo"));
					}
				}
				return negatedData || ((token.type != "pseudo" || !PSEUDOS_CLASSES.includes(":" + token.name))
					&& (token.type != "pseudo-element"));
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

	function log(...args) {
		console.log("S-File <css-mat>", ...args); // eslint-disable-line no-console
	}

})();