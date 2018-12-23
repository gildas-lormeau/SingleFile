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
			const ruleData = cssRule.data;
			if (ruleData.block && ruleData.block.children && ruleData.prelude && ruleData.prelude.children) {
				if (ruleData.type == "Atrule" && ruleData.name == "media") {
					const mediaText = cssTree.generate(ruleData.prelude);
					processRules(ruleData.block.children, sheetIndex, mediaInfo.medias.get("rule-" + sheetIndex + "-" + mediaRuleIndex + "-" + mediaText));
					if (!ruleData.prelude.children.getSize() || !ruleData.block.children.getSize()) {
						removedCssRules.push(cssRule);
					}
					mediaRuleIndex++;
				} else if (ruleData.type == "Rule") {
					const ruleInfo = mediaInfo.rules.get(ruleData);
					const pseudoSelectors = mediaInfo.pseudoRules.get(ruleData);
					if (!ruleInfo && !pseudoSelectors) {
						removedCssRules.push(cssRule);
					} else if (ruleInfo) {
						processRuleInfo(ruleData, ruleInfo, pseudoSelectors);
						if (!ruleData.prelude.children.getSize() || !ruleData.block.children.getSize()) {
							removedCssRules.push(cssRule);
						}
					}
				}
			} else {
				if (!ruleData || ruleData.type == "Raw" || (ruleData.type == "Rule" && (!ruleData.prelude || ruleData.prelude.type == "Raw"))) {
					removedCssRules.push(cssRule);
				}
			}
		}
		removedCssRules.forEach(cssRule => cssRules.remove(cssRule));
		if (DEBUG && cssRules.getSize() > 1) {
			log("  -- ENDED   processRules delay =", Date.now() - startTime);
		}
	}

	function processRuleInfo(ruleData, ruleInfo, pseudoSelectors) {
		const removedDeclarations = [];
		const removedSelectors = [];
		let pseudoSelectorFound;
		for (let selector = ruleData.prelude.children.head; selector; selector = selector.next) {
			const selectorText = cssTree.generate(selector.data);
			if (pseudoSelectors && pseudoSelectors.has(selectorText)) {
				pseudoSelectorFound = true;
			}
			if (!ruleInfo.matchedSelectors.has(selectorText) && (!pseudoSelectors || !pseudoSelectors.has(selectorText))) {
				removedSelectors.push(selector);
			}
		}
		if (!pseudoSelectorFound) {
			for (let declaration = ruleData.block.children.tail; declaration; declaration = declaration.prev) {
				if (!ruleInfo.declarations.has(declaration.data)) {
					removedDeclarations.push(declaration);
				}
			}
		}
		removedDeclarations.forEach(declaration => ruleData.block.children.remove(declaration));
		removedSelectors.forEach(selector => ruleData.prelude.children.remove(selector));
	}

	function processStyleAttribute(styleData, mediaAllInfo) {
		const removedDeclarations = [];
		const styleInfo = mediaAllInfo.matchedStyles.get(styleData);
		if (styleInfo) {
			let propertyFound;
			for (let declaration = styleData.children.head; declaration && !propertyFound; declaration = declaration.next) {
				if (!styleInfo.declarations.has(declaration.data)) {
					removedDeclarations.push(declaration);
				}
			}
			removedDeclarations.forEach(declaration => styleData.children.remove(declaration));
		}
	}

	function log(...args) {
		console.log("S-File <css-min>", ...args); // eslint-disable-line no-console
	}

})();