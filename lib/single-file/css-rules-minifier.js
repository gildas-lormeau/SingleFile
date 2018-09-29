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

/* global CSSRule, parseCss */

this.cssMinifier = this.cssMinifier || (() => {

	const DEBUG = false;

	return {
		process: (doc, mediaAllInfo) => {
			const stats = { processed: 0, discarded: 0 };
			doc.querySelectorAll("style").forEach((styleElement, sheetIndex) => {
				if (styleElement.sheet) {
					const cssRules = styleElement.sheet.cssRules;
					let mediaInfo;
					if (styleElement.media && styleElement.media != "all") {
						mediaInfo = mediaAllInfo.medias.get("style-" + sheetIndex + "-" + styleElement.media);
					} else {
						mediaInfo = mediaAllInfo;
					}
					stats.processed += cssRules.length;
					stats.discarded += cssRules.length;
					styleElement.textContent = processRules(doc, cssRules, sheetIndex, mediaInfo);
					stats.discarded -= cssRules.length;
				}
			});
			let startTime;
			if (DEBUG) {
				startTime = Date.now();
				log("  -- STARTED processStyleAttribute");
			}
			doc.querySelectorAll("[style]").forEach(element => {
				let textContent = processStyleAttribute(element.style, mediaAllInfo);
				if (textContent) {
					element.setAttribute("style", textContent);
				} else {
					element.removeAttribute("style");
				}
			});
			if (DEBUG) {
				log("  -- ENDED   processStyleAttribute delay =", Date.now() - startTime);
			}
			return stats;
		}
	};

	function processRules(doc, cssRules, sheetIndex, mediaInfo) {
		let sheetContent = "", mediaRuleIndex = 0;
		let startTime;
		if (DEBUG && cssRules.length > 1) {
			startTime = Date.now();
			log("  -- STARTED processRules", "rules.length =", cssRules.length);
		}
		Array.from(cssRules).forEach(cssRule => {
			if (cssRule.type == CSSRule.MEDIA_RULE) {
				sheetContent += "@media " + Array.from(cssRule.media).join(",") + "{";
				sheetContent += processRules(doc, cssRule.cssRules, sheetIndex, mediaInfo.medias.get("rule-" + sheetIndex + "-" + mediaRuleIndex + "-" + cssRule.media.mediaText));
				mediaRuleIndex++;
				sheetContent += "}";
			} else if (cssRule.type == CSSRule.STYLE_RULE) {
				const ruleInfo = mediaInfo.rules.get(cssRule);
				if (mediaInfo.pseudoSelectors.has(cssRule.selectorText)) {
					sheetContent += cssRule.cssText;
				} else if (ruleInfo) {
					sheetContent += processRuleInfo(cssRule, ruleInfo);
				}
			} else {
				sheetContent += cssRule.cssText;
			}
		});
		if (DEBUG && cssRules.length > 1) {
			log("  -- ENDED   processRules delay =", Date.now() - startTime);
		}
		return sheetContent;
	}

	function processRuleInfo(cssRule, ruleInfo) {
		let selectorText = "", styleCssText = "";
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
			const newSelectors = [];
			const newSelectorsText = [];
			for (let selectorTextIndex = 0; selectorTextIndex < ruleInfo.selectorsText.length; selectorTextIndex++) {
				const ruleSelectorText = ruleInfo.selectorsText[selectorTextIndex];
				if (ruleInfo.matchedSelectors.has(ruleSelectorText)) {
					if (selectorText) {
						selectorText += ",";
					}
					newSelectors.push(ruleInfo.selectors[selectorTextIndex]);
					newSelectorsText.push(ruleSelectorText);
					selectorText += ruleSelectorText;
				}
			}
		}
		return (selectorText || cssRule.selectorText) + "{" + (styleCssText || cssRule.style.cssText) + "}";
	}

	function processStyleAttribute(cssStyle, mediaAllInfo) {
		let styleCssText = "";
		const styleInfos = mediaAllInfo.matchedStyles.get(cssStyle);
		if (styleInfos) {
			styleInfos.style.forEach((styleValue, styleName) => {
				const stylesInfo = parseCss.parseAListOfDeclarations(cssStyle.cssText);
				for (let styleIndex = 0; styleIndex < stylesInfo.length; styleIndex++) {
					const style = stylesInfo[styleIndex];
					if (styleName == style.name) {
						if (styleCssText) {
							styleCssText += ";";
						}
						const priority = cssStyle.getPropertyPriority(style.name);
						styleCssText += style.name + ":" + cssStyle.getPropertyValue(style.name) + (priority && ("!" + priority));
					}
				}
			});
		}
		return (styleCssText || cssStyle.cssText);
	}

	function log(...args) {
		console.log("S-File <css-min>", ...args); // eslint-disable-line no-console
	}

})();