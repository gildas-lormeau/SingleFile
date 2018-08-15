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

/* global CSSRule */

this.rulesMinifier = this.rulesMinifier || (() => {

	const REGEXP_PSEUDO_CLASSES = /::after|::before|::first-line|::first-letter|:focus|:focus-within|:hover|:link|:visited|:active/gi;

	return {
		process: doc => {
			const rulesCache = {
				selectors: {},
				fonts: {
					declared: {},
					used: {}
				}
			};
			const stats = {
				processed: 0,
				discarded: 0
			};
			doc.querySelectorAll("style").forEach(style => {
				if (style.sheet) {
					const processed = style.sheet.cssRules.length;
					stats.processed += processed;
					style.textContent = processRules(doc, style.sheet.cssRules, rulesCache);
					stats.discarded += processed - style.sheet.cssRules.length;
				}
			});
			const unusedFonts = Object.keys(rulesCache.fonts.declared).filter(fontFamily => !Object.keys(rulesCache.fonts.used).includes(fontFamily));
			doc.querySelectorAll("style").forEach(style => {
				if (style.sheet) {
					const processed = style.sheet.cssRules.length;
					style.textContent = deleteUnusedFonts(doc, style.sheet.cssRules, unusedFonts);
					stats.discarded += processed - style.sheet.cssRules.length;
				}
			});
			return stats;
		}
	};

	function processRules(doc, rules, cache) {
		let stylesheetContent = "";
		if (rules) {
			Array.from(rules).forEach(rule => {
				if (rule.media) {
					stylesheetContent += "@media " + Array.prototype.join.call(rule.media, ",") + " {";
					stylesheetContent += processRules(doc, rule.cssRules, cache);
					stylesheetContent += "}";
				} else if (rule.selectorText) {
					const selector = getFilteredSelector(rule.selectorText);
					if (selector) {
						try {
							if (cache.selectors[selector] || doc.querySelector(selector)) {
								stylesheetContent += rule.cssText;
								cache.selectors[selector] = true;
								if (rule.style.fontFamily) {
									rule.style.fontFamily.split(",").forEach(fontFamily => cache.fonts.used[fontFamily.trim()] = true);
								}
							}
						} catch (error) {
							stylesheetContent += rule.cssText;
						}
					}
				} else {
					if (rule.type == CSSRule.FONT_FACE_RULE) {
						cache.fonts.declared[rule.style.fontFamily.trim()] = true;
					}
					stylesheetContent += rule.cssText;
				}
			});
		}
		return stylesheetContent;
	}

	function deleteUnusedFonts(doc, rules, unusedFonts) {
		let stylesheetContent = "";
		if (rules) {
			Array.from(rules).forEach(rule => {
				if (rule.media) {
					stylesheetContent += "@media " + Array.prototype.join.call(rule.media, ",") + " {";
					stylesheetContent += deleteUnusedFonts(doc, rule.cssRules, unusedFonts);
					stylesheetContent += "}";
				} else if (rule.selectorText) {
					stylesheetContent += rule.cssText;
				} else if (rule.type == CSSRule.FONT_FACE_RULE && !unusedFonts.includes(rule.style.fontFamily.trim())) {
					stylesheetContent += rule.cssText;
				} else {
					stylesheetContent += rule.cssText;
				}
			});
		}
		return stylesheetContent;
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