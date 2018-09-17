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

	const FILTERED_PSEUDO_CLASSES = [":focus", ":focus-within", ":hover", ":link", ":visited", ":active"];
	const FILTERED_PSEUDO_ELEMENTS = ["::after", "::before", "::first-line", "::first-letter", "::placeholder", "::-webkit-input-placeholder", "::selection", "::marker", "::cue", "::-webkit-progress-bar", "::-webkit-progress-value", "::-webkit-inner-spin-button", "::-webkit-outer-spin-button", "::-webkit-search-cancel-button", "::-webkit-search-cancel-button"];
	const FILTERED_SELECTORS = ["::-webkit-scrollbar", "::-webkit-scrollbar-button", "::-webkit-scrollbar-thumb", "::-webkit-scrollbar-track", "::-webkit-scrollbar-track-piece", "::-webkit-scrollbar-corner", "::-webkit-resizer"];
	const IGNORED_SELECTORS = FILTERED_SELECTORS.concat(FILTERED_PSEUDO_CLASSES).concat(FILTERED_PSEUDO_ELEMENTS);

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
					const cssRules = styleElement.sheet.cssRules;
					stats.processed += cssRules.length;
					stats.discarded += cssRules.length;
					styleElement.textContent = processRules(doc, cssRules, mediaInfo);
					stats.discarded -= cssRules.length;
				}
			});
			doc.querySelectorAll("[style]").forEach(element => {
				let textContent = processStyleAttribute(element.style, mediaAllInfo);
				if (textContent) {
					element.setAttribute("style", textContent);
				} else {
					element.removeAttribute("style");
				}
			});
			return stats;
		}
	};

	function processRules(doc, cssRules, mediaInfo) {
		let sheetContent = "";
		Array.from(cssRules).forEach(cssRule => {
			if (cssRule.type == CSSRule.MEDIA_RULE) {
				sheetContent += "@media " + Array.from(cssRule.media).join(",") + "{";
				sheetContent += processRules(doc, cssRule.cssRules, mediaInfo.medias.get(cssRule.media));
				sheetContent += "}";
			} else if (cssRule.type == CSSRule.STYLE_RULE) {
				const ruleInfo = mediaInfo.rules.get(cssRule);
				if (ruleInfo || testIgnoredSelector(cssRule.selectorText)) {
					sheetContent += processRuleInfo(cssRule, ruleInfo);
				}
			} else {
				sheetContent += cssRule.cssText;
			}
		});
		return sheetContent;
	}

	function processRuleInfo(cssRule, ruleInfo) {
		let selectorText = "", styleCssText = "";
		if (ruleInfo) {
			const stylesInfo = parseCss.parseAListOfDeclarations(cssRule.style.cssText);
			for (let styleIndex = 0; styleIndex < stylesInfo.length; styleIndex++) {
				const style = stylesInfo[styleIndex];
				if (ruleInfo.style.get(style.name)) {
					if (styleCssText) {
						styleCssText += ";";
					}
					const priority = cssRule.style.getPropertyPriority(style.name);
					styleCssText += style.name + ":" + cssRule.style.getPropertyValue(style.name) + (priority && ("!" + priority));
				}
			}
			if (ruleInfo.matchedSelectors.size < ruleInfo.selectorsText.length) {
				for (let selectorTextIndex = 0; selectorTextIndex < ruleInfo.selectorsText.length; selectorTextIndex++) {
					const ruleSelectorText = ruleInfo.selectorsText[selectorTextIndex];
					if (ruleInfo.matchedSelectors.has(ruleSelectorText) || testIgnoredSelector(ruleSelectorText)) {
						if (selectorText) {
							selectorText += ",";
						}
						selectorText += ruleSelectorText;
					}
				}
			}
		}
		return (selectorText || cssRule.selectorText) + "{" + (styleCssText || cssRule.style.cssText) + "}";
	}

	function processStyleAttribute(cssStyle, mediaInfo) {
		let styleCssText = "";
		const styleInfo = mediaInfo.styles.get(cssStyle);
		if (styleInfo) {
			const stylesInfo = parseCss.parseAListOfDeclarations(cssStyle.cssText);
			for (let styleIndex = 0; styleIndex < stylesInfo.length; styleIndex++) {
				const style = stylesInfo[styleIndex];
				if (styleInfo.style.get(style.name)) {
					if (styleCssText) {
						styleCssText += ";";
					}
					const priority = cssStyle.getPropertyPriority(style.name);
					styleCssText += style.name + ":" + cssStyle.getPropertyValue(style.name) + (priority && ("!" + priority));
				}
			}
		}
		return (styleCssText || cssStyle.cssText);
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
		return found;
	}

})();