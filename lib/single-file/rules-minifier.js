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

this.rulesMinifier = this.rulesMinifier || (() => {

	const REGEXP_PSEUDO_CLASSES = /::after|::before|::first-line|::first-letter|:focus|:focus-within|:hover|:link|:visited|:active/gi;

	return {
		process: doc => {
			const rulesCache = {};
			const stats = {
				processed: 0,
				discarded: 0
			};
			doc.querySelectorAll("style").forEach(style => {
				const cssRules = [];
				if (style.sheet) {
					const processed = style.sheet.cssRules.length;
					stats.processed += processed;
					processRules(doc, style.sheet.cssRules, cssRules, rulesCache);
					const stylesheetContent = cssRules.join("");
					style.textContent = stylesheetContent;
					stats.discarded += processed - style.sheet.cssRules.length;
				}
			});
			return stats;
		}
	};

	function processRules(doc, rules, cssRules, cache) {
		if (rules) {
			Array.from(rules).forEach(rule => {
				if (rule.media) {
					cssRules.push("@media " + Array.prototype.join.call(rule.media, ",") + " {");
					processRules(doc, rule.cssRules, cssRules, cache);
					cssRules.push("}");
				} else if (rule.selectorText) {
					const selector = getFilteredSelector(rule.selectorText);
					if (selector) {
						try {
							if (cache[selector] || doc.querySelector(selector)) {
								cssRules.push(rule.cssText);
								cache[selector] = true;
							}
						} catch (error) {
							cssRules.push(rule.cssText);
						}
					}
				} else {
					cssRules.push(rule.cssText);
				}
			});
		}
	}

	function getFilteredSelector(selector) {
		if (selector.match(REGEXP_PSEUDO_CLASSES)) {
			let selectors = selector.split(/\s*,\s*/g);
			selector = selectors.map(selector => {
				const simpleSelectors = selector.split(/\s*[ >~+]\s*/g);
				const separators = selector.match(/\s*[ >~+]\s*/g);
				return simpleSelectors.map((selector, selectorIndex) => {
					while (selector.match(REGEXP_PSEUDO_CLASSES)) {
						selector = selector.replace(REGEXP_PSEUDO_CLASSES, "").trim();
					}
					selector = selector.replace(/:?:[^(]+\(\)/g, "");
					if (selector == "") {
						selector = "*";
					}
					return selector + (separators && separators[selectorIndex] ? separators[selectorIndex] : "");
				}).join("");
			}).join(",");
		}
		return selector;
	}

})();