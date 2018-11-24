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

/* global cssTree */

this.cssRulesMinifier = this.cssRulesMinifier || (() => {

	const DEBUG = false;

	return {
		process: (stylesheets, styles, mediaAllInfo) => {
			const stats = { processed: 0, discarded: 0 };
			let sheetIndex = 0;
			stylesheets.forEach(stylesheetInfo => {
				let mediaInfo;
				if (stylesheetInfo.mediaText && stylesheetInfo.mediaText != "all") {
					mediaInfo = mediaAllInfo.medias.get("style-" + sheetIndex + "-" + stylesheetInfo.mediaText);
				} else {
					mediaInfo = mediaAllInfo;
				}
				const cssRules = stylesheetInfo.stylesheet.children;
				if (cssRules) {
					stats.processed += cssRules.getSize();
					stats.discarded += cssRules.getSize();
					processRules(cssRules, sheetIndex, mediaInfo);
					stats.discarded -= cssRules.getSize();
				}
				sheetIndex++;
			});
			let startTime;
			if (DEBUG) {
				startTime = Date.now();
				log("  -- STARTED processStyleAttribute");
			}
			styles.forEach(style => processStyleAttribute(style, mediaAllInfo));
			if (DEBUG) {
				log("  -- ENDED   processStyleAttribute delay =", Date.now() - startTime);
			}
			return stats;
		}
	};

	function processRules(cssRules, sheetIndex, mediaInfo) {
		let mediaRuleIndex = 0, startTime;
		if (DEBUG && cssRules.getSize() > 1) {
			startTime = Date.now();
			log("  -- STARTED processRules", "rules.length =", cssRules.getSize());
		}
		const removedCssRules = [];
		for (let cssRule = cssRules.head; cssRule; cssRule = cssRule.next) {
			const cssRuleData = cssRule.data;
			if (cssRuleData.block && cssRuleData.block.children && cssRuleData.prelude && cssRuleData.prelude.children) {
				if (cssRuleData.type == "Atrule" && cssRuleData.name == "media") {
					const mediaText = cssTree.generate(cssRuleData.prelude);
					processRules(cssRuleData.block.children, sheetIndex, mediaInfo.medias.get("rule-" + sheetIndex + "-" + mediaRuleIndex + "-" + mediaText));
					if (!cssRuleData.prelude.children.getSize() || !cssRuleData.block.children.getSize()) {
						removedCssRules.push(cssRule);
					}
					mediaRuleIndex++;
				} else if (cssRuleData.type == "Rule") {
					const ruleInfo = mediaInfo.rules.get(cssRuleData);
					const pseudoSelectors = mediaInfo.pseudoRules.get(cssRuleData);
					if ((!ruleInfo && !pseudoSelectors)) {
						removedCssRules.push(cssRule);
					} else if (ruleInfo) {
						processRuleInfo(cssRuleData, ruleInfo, pseudoSelectors);
						if (!cssRuleData.prelude.children.getSize() || !cssRuleData.block.children.getSize()) {
							removedCssRules.push(cssRule);
						}
					}
				}
			} else {
				if (!cssRuleData || cssRuleData.type == "Raw" || (cssRuleData.type == "Rule" && (!cssRuleData.prelude || cssRuleData.prelude.type == "Raw"))) {
					removedCssRules.push(cssRule);
				}
			}
		}
		removedCssRules.forEach(cssRule => cssRules.remove(cssRule));
		if (DEBUG && cssRules.getSize() > 1) {
			log("  -- ENDED   processRules delay =", Date.now() - startTime);
		}
	}

	function processRuleInfo(cssRule, ruleInfo, pseudoSelectors) {
		const removedDeclarations = [];
		const removedSelectors = [];
		for (let declaration = cssRule.block.children.tail; declaration; declaration = declaration.prev) {
			if (!ruleInfo.declarations.has(declaration.data)) {
				removedDeclarations.push(declaration);
			}
		}
		for (let selector = cssRule.prelude.children.head; selector; selector = selector.next) {
			const selectorText = cssTree.generate(selector.data);
			if (!ruleInfo.matchedSelectors.has(selectorText) && (!pseudoSelectors || !pseudoSelectors.has(selectorText))) {
				removedSelectors.push(selector);
			}
		}
		removedDeclarations.forEach(declaration => cssRule.block.children.remove(declaration));
		removedSelectors.forEach(selector => cssRule.prelude.children.remove(selector));
	}

	function processStyleAttribute(cssStyle, mediaAllInfo) {
		const removedDeclarations = [];
		const styleInfo = mediaAllInfo.matchedStyles.get(cssStyle);
		if (styleInfo) {
			let propertyFound;
			for (let declaration = cssStyle.children.head; declaration && !propertyFound; declaration = declaration.next) {
				if (!styleInfo.declarations.has(declaration.data)) {
					removedDeclarations.push(declaration);
				}
			}
			removedDeclarations.forEach(declaration => cssStyle.children.remove(declaration));
		}
	}

	function log(...args) {
		console.log("S-File <css-min>", ...args); // eslint-disable-line no-console
	}

})();