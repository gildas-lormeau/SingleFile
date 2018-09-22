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
			doc.querySelectorAll("style").forEach((styleElement, styleIndex) => {
				if (styleElement.sheet) {
					let cssRules = styleElement.sheet.cssRules;
					if (styleElement.media && styleElement.media != MEDIA_ALL) {
						const mediaInfo = createMediaInfo(styleElement.media);
						this.mediaAllInfo.medias.set(styleIndex + "-" + styleElement.media, mediaInfo);
						getMatchedElementsRules(doc, cssRules, mediaInfo, styleIndex, matchedElementsCache);
					} else {
						getMatchedElementsRules(doc, cssRules, this.mediaAllInfo, styleIndex, matchedElementsCache);
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

		getAllMatchedRules() {
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
				mediaInfo.medias.set(cssRuleMedia, ruleMediaInfo);
				getMatchedElementsRules(doc, cssRule.cssRules, ruleMediaInfo, sheetIndex, matchedElementsCache);
			} else if (cssRuleType == CSSRule.STYLE_RULE) {
				const selectorText = cssRule.selectorText;
				if (selectorText) {
					let selectors;
					try {
						selectors = cssWhat.parse(selectorText);
					} catch (error) {
						/* ignored */
					}
					if (selectors) {
						const selectorsText = selectors.map(selector => cssWhat.stringify([selector]));
						selectors.forEach((selector, selectorIndex) => {
							const selectorText = selectorsText[selectorIndex];
							getMatchedElementsSelector(doc,
								{ cssRule, mediaInfo, ruleIndex, sheetIndex, selectors, selectorsText, selector, selectorText },
								matchedElementsCache);
						});
					}
				}
			}
		});
		if (DEBUG && cssRules.length > 1) {
			log("  -- ENDED   getMatchedElementsRules", "delay =", Date.now() - startTime);
		}
	}

	function getMatchedElementsSelector(doc, ruleData, matchedElementsCache) {
		let selectorText;
		const selectorContainsPseudo = containsPseudo(ruleData.selectorText);
		if (selectorContainsPseudo) {
			selectorText = getFilteredSelector(ruleData.selectorText);
		} else {
			selectorText = ruleData.selectorText;
		}
		const cachedMatchedElements = matchedElementsCache.get(selectorText);
		const matchedElements = cachedMatchedElements || doc.querySelectorAll(selectorText);
		if (!cachedMatchedElements) {
			matchedElementsCache.set(selectorText, matchedElements);
		}
		if (matchedElements.length) {
			if (selectorContainsPseudo) {
				ruleData.mediaInfo.pseudoSelectors.add(ruleData.cssRule.selectorText);
				matchedElements.forEach(element => addPseudoRule(element, ruleData));
			} else {
				matchedElements.forEach(element => addRule(element, ruleData));
			}
		}
	}

	function addRule(element, ruleData) {
		let elementInfo = ruleData.mediaInfo.elements.get(element);
		if (!elementInfo) {
			elementInfo = [];
			const elementStyle = element.style;
			if (elementStyle && elementStyle.length) {
				elementInfo.push({ cssStyle: elementStyle });
			}
			ruleData.mediaInfo.elements.set(element, elementInfo);
		}
		const specificity = computeSpecificity(ruleData.selector);
		specificity.ruleIndex = ruleData.ruleIndex;
		specificity.sheetIndex = ruleData.sheetIndex;
		ruleData.specificity = specificity;
		elementInfo.push(ruleData);
	}

	function addPseudoRule(element, ruleData) {
		let elementInfo = ruleData.mediaInfo.pseudos.get(element);
		if (!elementInfo) {
			elementInfo = [];
			ruleData.mediaInfo.pseudos.set(element, elementInfo);
		}
		elementInfo.push(ruleData);
	}

	function computeCascade(mediaInfo, parentMediaInfos, mediaAllInfo) {
		mediaInfo.elements.forEach(elementInfo => getStylesInfo(elementInfo).forEach((elementStyleInfo, styleName) => {
			let ruleInfo, ascendantMedia;
			if (elementStyleInfo.cssRule) {
				ascendantMedia = [mediaInfo, ...parentMediaInfos].find(media => media.rules.get(elementStyleInfo.cssRule)) || mediaInfo;
				ruleInfo = ascendantMedia.rules.get(elementStyleInfo.cssRule);
			} else if (mediaInfo == mediaAllInfo) {
				ruleInfo = mediaAllInfo.styles.get(elementStyleInfo.cssStyle);
			}
			if (!ruleInfo) {
				ruleInfo = { style: new Map(), matchedSelectors: new Set(), selectorsText: elementStyleInfo.selectorsText };
			}
			if (elementStyleInfo.cssRule) {
				ascendantMedia.rules.set(elementStyleInfo.cssRule, ruleInfo);
			} else if (mediaInfo == mediaAllInfo) {
				mediaAllInfo.styles.set(elementStyleInfo.cssStyle, ruleInfo);
			}
			if (elementStyleInfo.selectorText) {
				ruleInfo.matchedSelectors.add(elementStyleInfo.selectorText);
			}
			const styleValue = ruleInfo.style.get(styleName);
			if (!styleValue) {
				ruleInfo.style.set(styleName, elementStyleInfo.styleValue);
			}
		}));
		mediaInfo.medias.forEach(childMediaInfo => computeCascade(childMediaInfo, [mediaInfo, ...parentMediaInfos]));
	}

	function getStylesInfo(elementInfo) {
		const elementStylesInfo = new Map();
		elementInfo.forEach(ruleInfo => {
			if (ruleInfo.cssStyle) {
				const cssStyle = ruleInfo.cssStyle;
				const stylesInfo = parseCss.parseAListOfDeclarations(cssStyle.cssText);
				stylesInfo.forEach(styleInfo => {
					const important = cssStyle.getPropertyPriority(styleInfo.name);
					const styleValue = cssStyle.getPropertyValue(styleInfo.name) + (important && "!" + important);
					elementStylesInfo.set(styleInfo.name, { styleValue, cssStyle, important });
				});
			} else {
				const cssRule = ruleInfo.cssRule;
				const cssStyle = cssRule.style;
				const stylesInfo = parseCss.parseAListOfDeclarations(cssStyle.cssText);
				stylesInfo.forEach(styleInfo => {
					const important = cssStyle.getPropertyPriority(styleInfo.name);
					const styleValue = cssStyle.getPropertyValue(styleInfo.name) + (important && "!" + important);
					let elementStyleInfo = elementStylesInfo.get(styleInfo.name);
					if (!elementStyleInfo || (important && !elementStyleInfo.important)) {
						elementStylesInfo.set(styleInfo.name, { styleValue, cssRule, selectorText: ruleInfo.selectorText, selectorsText: ruleInfo.selectorsText, important });
					}
				});
			}
		});
		return elementStylesInfo;
	}

	function createMediaInfo(media) {
		const mediaInfo = { media: media, elements: new Map(), pseudos: new Map(), medias: new Map(), rules: new Map(), pseudoSelectors: new Set() };
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
		const selectors = cssWhat.parse(selector);
		return cssWhat.stringify(selectors.map(selector => filterPseudoClasses(selector)));

		function filterPseudoClasses(selector) {
			const tokens = selector.filter(token => {
				if (token.data) {
					if (Array.isArray(token.data)) {
						token.data = token.data.map(selector => filterPseudoClasses(selector));
					}
				}
				const test = ((token.type != "pseudo" || !PSEUDOS_CLASSES.includes(":" + token.name))
					&& (token.type != "pseudo-element"));
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

	function containsPseudo(selectorText) {
		let ignoredPseudo;
		if (selectorText.includes("::")) {
			ignoredPseudo = true;
		} else {
			let pseudoIndex = 0;
			while (pseudoIndex < PSEUDOS_CLASSES.length && !ignoredPseudo) {
				ignoredPseudo = selectorText.includes(PSEUDOS_CLASSES[pseudoIndex]);
				if (!ignoredPseudo) {
					pseudoIndex++;
				}
			}
		}
		return ignoredPseudo;
	}

	function log(...args) {
		console.log("S-File <css-mat>", ...args); // eslint-disable-line no-console
	}

})();