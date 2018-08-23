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

/* global CSSRule, cssWhat */

this.rulesMinifier = this.rulesMinifier || (() => {

	return {
		process: doc => {
			const selectorsData = new Set();
			const stats = {
				processed: 0,
				discarded: 0
			};
			doc.querySelectorAll("style").forEach(style => {
				if (style.sheet) {
					const processed = style.sheet.cssRules.length;
					stats.processed += processed;
					style.textContent = processRules(doc, style.sheet.cssRules, selectorsData);
					stats.discarded += processed - style.sheet.cssRules.length;
				}
			});
			return stats;
		}
	};

	function processRules(doc, rules, selectorsData) {
		let stylesheetContent = "";
		if (rules) {
			Array.from(rules).forEach(rule => {
				if (rule.type == CSSRule.MEDIA_RULE) {
					stylesheetContent += "@media " + Array.prototype.join.call(rule.media, ",") + " {";
					stylesheetContent += processRules(doc, rule.cssRules, selectorsData);
					stylesheetContent += "}";
				} else if (rule.type == CSSRule.STYLE_RULE) {
					const selector = getFilteredSelector(rule.selectorText);
					if (selector) {
						try {
							if (selectorsData.has(selector) || doc.querySelector(selector)) {
								stylesheetContent += rule.cssText;
								selectorsData.add(selector);
							}
						} catch (error) {
							stylesheetContent += rule.cssText;
						}
					}
				} else {
					stylesheetContent += rule.cssText;
				}
			});
		}
		return stylesheetContent;
	}

	function getFilteredSelector(selector) {
		const SEPARATOR_TYPES = ["descendant", "child", "sibling", "adjacent"];
		const REMOVED_PSEUDO_CLASSES = ["focus", "focus-within", "hover", "link", "visited", "active"];
		const REMOVED_PSEUDO_ELEMENTS = ["after", "before", "first-line", "first-letter"];

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