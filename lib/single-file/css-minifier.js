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

/* global CSSRule, cssWhat, parseCss, RulesMatcher */

this.cssMinifier = this.stylesMinifier || (() => {

	const SEPARATOR_TYPES = ["descendant", "child", "sibling", "adjacent"];
	const REMOVED_PSEUDO_CLASSES = ["focus", "focus-within", "hover", "link", "visited", "active"];
	const REMOVED_PSEUDO_ELEMENTS = ["after", "before", "first-line", "first-letter"];

	return {
		process: doc => {
			const rulesMatcher = RulesMatcher.create(doc);
			const mediaAllInfo = rulesMatcher.getAllMatchedRules();
			const stats = { processed: 0, discarded: 0 };
			doc.querySelectorAll("style").forEach(styleElement => {
				if (styleElement.sheet) {
					let mediaInfo;
					if (styleElement.media && styleElement.media != "all") {
						mediaInfo = mediaAllInfo.medias.get(styleElement.media);
					} else {
						mediaInfo = mediaAllInfo;
					}
					processRules(doc, styleElement.sheet.cssRules, mediaInfo);
					styleElement.textContent = serializeRules(styleElement.sheet.cssRules);
					stats.discarded -= styleElement.sheet.cssRules.length;
				}
			});
			doc.querySelectorAll("[style]").forEach(element => {
				processStyle(doc, element.style, mediaAllInfo);
			});
			return stats;
		}
	};

	function processRules(doc, cssRules, mediaInfo) {
		Array.from(cssRules).forEach(cssRule => {
			if (cssRule.type == CSSRule.MEDIA_RULE) {
				processRules(doc, cssRule.cssRules, mediaInfo.medias.get(cssRule.media));
			} else if (cssRule.type == CSSRule.STYLE_RULE) {
				const ruleInfo = mediaInfo.rules.get(cssRule);
				if (ruleInfo) {
					const stylesInfo = parseCss.parseAListOfDeclarations(cssRule.style.cssText);
					const unusedStyles = stylesInfo.filter(style => !ruleInfo.style.get(style.name));
					if (unusedStyles.length) {
						unusedStyles.forEach(style => cssRule.style.removeProperty(style.name));
					}
					if (ruleInfo.matchedSelectors.size < ruleInfo.selectorsText.length) {
						cssRule.selectorText = ruleInfo.selectorsText.filter(selector => ruleInfo.matchedSelectors.has(selector) || (testFilterSelector(selector) && doc.querySelector(getFilteredSelector(selector)))).join(",");
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

	function processStyle(doc, cssStyle, mediaInfo) {
		const styleInfo = mediaInfo.styles.get(cssStyle);
		if (styleInfo) {
			const stylesInfo = parseCss.parseAListOfDeclarations(cssStyle.cssText);
			const unusedStyles = stylesInfo.filter(style => !styleInfo.style.get(style.name));
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