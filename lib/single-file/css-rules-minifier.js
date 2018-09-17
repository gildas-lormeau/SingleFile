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

/* global CSSRule, parseCss, RulesMatcher */

this.cssMinifier = this.cssMinifier || (() => {

	const REMOVED_PSEUDO_CLASSES = [":focus", ":focus-within", ":hover", ":link", ":visited", ":active"];
	const REMOVED_PSEUDO_ELEMENTS = ["::after", "::before", "::first-line", "::first-letter", "::placeholder", "::-webkit-input-placeholder", "::selection", "::marker", "::cue", "::-webkit-progress-bar", "::-webkit-progress-value", "::-webkit-inner-spin-button", "::-webkit-outer-spin-button", "::-webkit-search-cancel-button", "::-webkit-search-cancel-button"];
	const IGNORED_SELECTORS = ["::-webkit-scrollbar", "::-webkit-scrollbar-button", "::-webkit-scrollbar-thumb", "::-webkit-scrollbar-track", "::-webkit-scrollbar-track-piece", "::-webkit-scrollbar-corner", "::-webkit-resizer"];

	return {
		process: doc => {
			const rulesMatcher = RulesMatcher.create(doc);
			const mediaAllInfo = rulesMatcher.getAllMatchedRules();
			const stats = { processed: 0, discarded: 0 };
			doc.querySelectorAll("style").forEach((styleElement, styleIndex) => {
				if (styleElement.sheet) {
					let mediaInfo;
					if (styleElement.media && styleElement.media != "all") {
						mediaInfo = mediaAllInfo.medias.get(styleIndex + "-" + styleElement.media);
					} else {
						mediaInfo = mediaAllInfo;
					}
					processRules(doc, styleElement.sheet.cssRules, mediaInfo, stats);
					styleElement.textContent = serializeRules(styleElement.sheet.cssRules);
				}
			});
			doc.querySelectorAll("[style]").forEach(element => {
				processStyle(doc, element.style, mediaAllInfo);
			});
			return stats;
		}
	};

	function processRules(doc, cssRules, mediaInfo, stats) {
		stats.processed += cssRules.length;
		stats.discarded += cssRules.length;
		Array.from(cssRules).forEach(cssRule => {
			if (cssRule.type == CSSRule.MEDIA_RULE) {
				processRules(doc, cssRule.cssRules, mediaInfo.medias.get(cssRule.media), stats);
			} else if (cssRule.type == CSSRule.STYLE_RULE) {
				const ruleInfo = mediaInfo.rules.get(cssRule);
				if (ruleInfo) {
					const stylesInfo = parseCss.parseAListOfDeclarations(cssRule.style.cssText);
					const unusedStyles = stylesInfo.filter(style => !ruleInfo.style.get(style.name));
					if (unusedStyles.length) {
						unusedStyles.forEach(style => cssRule.style.removeProperty(style.name));
					}
					if (ruleInfo.matchedSelectors.size < ruleInfo.selectorsText.length) {
						cssRule.selectorText = ruleInfo.selectorsText.filter(selectorText => ruleInfo.matchedSelectors.has(selectorText) || testIgnoredSelector(selectorText)).join(",");
					}
				} else {
					if (!testIgnoredSelector(cssRule.selectorText)) {
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
		stats.discarded -= cssRules.length;
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

	function testIgnoredSelector(selectorText) {
		let indexSelector = 0, found;
		selectorText = selectorText.toLowerCase();
		while (indexSelector < IGNORED_SELECTORS.length && !found) {
			found = selectorText.includes(IGNORED_SELECTORS[indexSelector]);
			if (!found) {
				indexSelector++;
			}
		}
		if (!found) {
			indexSelector = 0;
			while (indexSelector < IGNORED_SELECTORS.length && !found) {
				found = testFilterSelector(selectorText);
				if (!found) {
					indexSelector++;
				}
			}
		}
		return found;
	}

	function testFilterSelector(selector) {
		let indexPseudoClass = 0, found;
		while (indexPseudoClass < REMOVED_PSEUDO_CLASSES.length && !found) {
			found = selector.includes(REMOVED_PSEUDO_CLASSES[indexPseudoClass]);
			if (!found) {
				indexPseudoClass++;
			}
		}
		if (!found) {
			let indexPseudoElement = 0;
			while (indexPseudoElement < REMOVED_PSEUDO_ELEMENTS.length && !found) {
				found = selector.includes(REMOVED_PSEUDO_ELEMENTS[indexPseudoElement]);
				if (!found) {
					indexPseudoElement++;
				}
			}
		}
		return found;
	}

})();