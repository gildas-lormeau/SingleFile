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

this.matchedRules = this.matchedRules || (() => {

	const MEDIA_ALL = "all";
	const IGNORED_PSEUDO_ELEMENTS = ["after", "before", "first-letter", "first-line", "selection"];
	const REGEXP_VENDOR_IDENTIFIER = /-(ms|webkit|moz|o)-/;
	const DEBUG = false;

	class MatchedRules {
		constructor(doc, stylesheets, styles) {
			this.doc = doc;
			this.mediaAllInfo = createMediaInfo(MEDIA_ALL);
			const matchedElementsCache = new Map();
			let sheetIndex = 0;
			const workStyleElement = doc.createElement("style");
			doc.body.appendChild(workStyleElement);
			stylesheets.forEach(stylesheetInfo => {
				const cssRules = stylesheetInfo.stylesheet.children;
				if (cssRules) {
					if (stylesheetInfo.mediaText && stylesheetInfo.mediaText != MEDIA_ALL) {
						const mediaInfo = createMediaInfo(stylesheetInfo.mediaText);
						this.mediaAllInfo.medias.set("style-" + sheetIndex + "-" + stylesheetInfo.mediaText, mediaInfo);
						getMatchedElementsRules(doc, cssRules, mediaInfo, sheetIndex, styles, matchedElementsCache, workStyleElement.sheet);
					} else {
						getMatchedElementsRules(doc, cssRules, this.mediaAllInfo, sheetIndex, styles, matchedElementsCache, workStyleElement.sheet);
					}
				}
				sheetIndex++;
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
			computeCascade(this.mediaAllInfo, [], this.mediaAllInfo, workStyleElement.sheet);
			workStyleElement.remove();
			if (DEBUG) {
				log("  -- ENDED computeCascade", Date.now() - startTime);
			}
		}

		getMediaAllInfo() {
			return this.mediaAllInfo;
		}
	}

	return {
		getMediaAllInfo(doc, stylesheets, styles) {
			return new MatchedRules(doc, stylesheets, styles).getMediaAllInfo();
		}
	};

	function createMediaInfo(media) {
		const mediaInfo = { media: media, elements: new Map(), pseudos: new Map(), medias: new Map(), rules: new Map(), pseudoRules: new Map() };
		if (media == MEDIA_ALL) {
			mediaInfo.matchedStyles = new Map();
		}
		return mediaInfo;
	}

	function getMatchedElementsRules(doc, cssRules, mediaInfo, sheetIndex, styles, matchedElementsCache, workStylesheet) {
		let mediaIndex = 0;
		let ruleIndex = 0;
		let startTime;
		if (DEBUG && cssRules.length > 1) {
			startTime = Date.now();
			log("  -- STARTED getMatchedElementsRules", " index =", sheetIndex, "rules.length =", cssRules.length);
		}
		cssRules.forEach(cssRule => {
			if (cssRule.block && cssRule.block.children && cssRule.prelude && cssRule.prelude.children) {
				if (cssRule.type == "Atrule" && cssRule.name == "media") {
					const mediaText = cssTree.generate(cssRule.prelude);
					const ruleMediaInfo = createMediaInfo(mediaText);
					mediaInfo.medias.set("rule-" + sheetIndex + "-" + mediaIndex + "-" + mediaText, ruleMediaInfo);
					mediaIndex++;
					getMatchedElementsRules(doc, cssRule.block.children, ruleMediaInfo, sheetIndex, styles, matchedElementsCache, workStylesheet);
				} else if (cssRule.type == "Rule") {
					const selectors = cssRule.prelude.children.toArray();
					const selectorsText = cssRule.prelude.children.toArray().map(selector => cssTree.generate(selector));
					const ruleInfo = { cssRule, mediaInfo, ruleIndex, sheetIndex, matchedSelectors: new Set(), declarations: new Set(), selectors, selectorsText };
					if (!invalidSelector(selectorsText.join(","), workStylesheet)) {
						for (let selector = cssRule.prelude.children.head, selectorIndex = 0; selector; selector = selector.next, selectorIndex++) {
							const selectorText = selectorsText[selectorIndex];
							const selectorInfo = { selector, selectorText, ruleInfo };
							getMatchedElementsSelector(doc, selectorInfo, styles, matchedElementsCache);
						}
					}
					ruleIndex++;
				}
			}
		});
		if (DEBUG && cssRules.length > 1) {
			log("  -- ENDED   getMatchedElementsRules", "delay =", Date.now() - startTime);
		}
	}

	function invalidSelector(selectorText, workStylesheet) {
		let invalidSelector;
		try {
			workStylesheet.insertRule(selectorText + "{}");
			workStylesheet.deleteRule(0);
		} catch (error) {
			if (!selectorText.match(REGEXP_VENDOR_IDENTIFIER)) {
				invalidSelector = true;
			}
		}
		return invalidSelector;
	}

	function getMatchedElementsSelector(doc, selectorInfo, styles, matchedElementsCache) {
		let selectorText;
		const selectorData = cssTree.parse(cssTree.generate(selectorInfo.selector.data), { context: "selector" });
		const filteredSelectorText = getFilteredSelector({ data: selectorData });
		if (filteredSelectorText != selectorInfo.selectorText) {
			selectorText = filteredSelectorText;
		} else {
			selectorText = selectorInfo.selectorText;
		}
		const cachedMatchedElements = matchedElementsCache.get(selectorText);
		let matchedElements = cachedMatchedElements;
		if (!matchedElements) {
			try {
				matchedElements = doc.querySelectorAll(selectorText);
			} catch (error) {
				// ignored
				console.warn("(SingleFile) Invalid selector", selectorText); // eslint-disable-line no-console
			}
		}
		if (matchedElements) {
			if (!cachedMatchedElements) {
				matchedElementsCache.set(selectorText, matchedElements);
			}
			if (matchedElements.length) {
				if (filteredSelectorText == selectorInfo.selectorText) {
					matchedElements.forEach(element => addRule(element, selectorInfo, styles));
				} else {
					let pseudoSelectors = selectorInfo.ruleInfo.mediaInfo.pseudoRules.get(selectorInfo.ruleInfo.cssRule);
					if (!pseudoSelectors) {
						pseudoSelectors = new Set();
						selectorInfo.ruleInfo.mediaInfo.pseudoRules.set(selectorInfo.ruleInfo.cssRule, pseudoSelectors);
					}
					pseudoSelectors.add(selectorInfo.selectorText);
					matchedElements.forEach(element => addPseudoRule(element, selectorInfo));
				}
			}
		}
	}

	function getFilteredSelector(selector) {
		const removedSelectors = [];
		selector = { data: cssTree.parse(cssTree.generate(selector.data), { context: "selector" }) };
		filterPseudoClasses(selector);
		if (removedSelectors.length) {
			removedSelectors.forEach(({ parentSelector, selector }) => {
				if (parentSelector.data.children.getSize() == 0 || !selector.prev || selector.prev.data.type == "Combinator") {
					parentSelector.data.children.replace(selector, cssTree.parse("*", { context: "selector" }).children.head);
				} else {
					parentSelector.data.children.remove(selector);
				}
			});
		}
		const selectorText = cssTree.generate(selector.data).trim();
		return selectorText;

		function filterPseudoClasses(selector, parentSelector) {
			if (selector.data.children) {
				for (let childSelector = selector.data.children.head; childSelector; childSelector = childSelector.next) {
					filterPseudoClasses(childSelector, selector);
				}
			}
			if ((selector.data.type == "PseudoClassSelector") ||
				(selector.data.type == "PseudoElementSelector" && (testVendorPseudo(selector) || IGNORED_PSEUDO_ELEMENTS.includes(selector.data.name)))) {
				removedSelectors.push({ parentSelector, selector });
			}
		}

		function testVendorPseudo(selector) {
			const name = selector.data.name;
			return name.startsWith("-") || name.startsWith("\\-");
		}
	}

	function addRule(element, selectorInfo, styles) {
		const mediaInfo = selectorInfo.ruleInfo.mediaInfo;
		const elementStyle = styles.get(element);
		let elementInfo = mediaInfo.elements.get(element);
		if (!elementInfo) {
			elementInfo = [];
			if (elementStyle) {
				elementInfo.push({ styleInfo: { cssStyle: elementStyle, declarations: new Set() } });
			}
			mediaInfo.elements.set(element, elementInfo);
		}
		const specificity = computeSpecificity(selectorInfo.selector.data);
		specificity.ruleIndex = selectorInfo.ruleInfo.ruleIndex;
		specificity.sheetIndex = selectorInfo.ruleInfo.sheetIndex;
		selectorInfo.specificity = specificity;
		elementInfo.push(selectorInfo);
	}

	function addPseudoRule(element, selectorInfo) {
		let elementInfo = selectorInfo.ruleInfo.mediaInfo.pseudos.get(element);
		if (!elementInfo) {
			elementInfo = [];
			selectorInfo.ruleInfo.mediaInfo.pseudos.set(element, elementInfo);
		}
		elementInfo.push(selectorInfo);
	}

	function computeCascade(mediaInfo, parentMediaInfo, mediaAllInfo, workStylesheet) {
		mediaInfo.elements.forEach((elementInfo/*, element*/) =>
			getDeclarationsInfo(elementInfo, workStylesheet/*, element*/).forEach((declarationsInfo, property) => {
				if (declarationsInfo.selectorInfo.ruleInfo || mediaInfo == mediaAllInfo) {
					let info;
					if (declarationsInfo.selectorInfo.ruleInfo) {
						info = declarationsInfo.selectorInfo.ruleInfo;
						const cssRule = info.cssRule;
						const ascendantMedia = [mediaInfo, ...parentMediaInfo].find(media => media.rules.get(cssRule)) || mediaInfo;
						ascendantMedia.rules.set(cssRule, info);
						if (cssRule) {
							info.matchedSelectors.add(declarationsInfo.selectorInfo.selectorText);
						}
					} else {
						info = declarationsInfo.selectorInfo.styleInfo;
						const cssStyle = info.cssStyle;
						const matchedStyleInfo = mediaAllInfo.matchedStyles.get(cssStyle);
						if (!matchedStyleInfo) {
							mediaAllInfo.matchedStyles.set(cssStyle, info);
						}
					}
					if (!info.declarations.has(property)) {
						info.declarations.add(property);
					}
				}
			}));
		delete mediaInfo.elements;
		mediaInfo.medias.forEach(childMediaInfo => computeCascade(childMediaInfo, [mediaInfo, ...parentMediaInfo], mediaAllInfo, workStylesheet));
	}

	function getDeclarationsInfo(elementInfo, workStylesheet/*, element */) {
		const declarationsInfo = new Map();
		elementInfo.forEach(selectorInfo => {
			let declarations;
			if (selectorInfo.styleInfo) {
				declarations = selectorInfo.styleInfo.cssStyle.children;
			} else {
				declarations = selectorInfo.ruleInfo.cssRule.block.children;
			}
			processDeclarations(declarationsInfo, declarations, selectorInfo, workStylesheet);
		});
		return declarationsInfo;
	}

	function processDeclarations(declarationsInfo, declarations, selectorInfo, workStylesheet) {
		const processedProperties = new Set();
		for (let declaration = declarations.tail; declaration; declaration = declaration.prev) {
			const declarationData = declaration.data;
			const declarationText = cssTree.generate(declarationData);
			if (declarationData.type == "Declaration" && (declarationText.match(REGEXP_VENDOR_IDENTIFIER) || !processedProperties.has(declarationData.property)) && !invalidDeclaration(declarationText, workStylesheet)) {
				const declarationInfo = declarationsInfo.get(declarationData);
				if (!declarationInfo || (declarationData.important && !declarationInfo.important)) {
					declarationsInfo.set(declarationData, { selectorInfo, important: declarationData.important });
					processedProperties.add(declarationData.property);
				}
			}
		}
	}

	function invalidDeclaration(declarationText, workStylesheet) {
		let invalidDeclaration;
		workStylesheet.insertRule("single-file-declaration { " + declarationText + "}");
		if (!workStylesheet.cssRules[0].style.length) {
			if (!declarationText.match(REGEXP_VENDOR_IDENTIFIER)) {
				invalidDeclaration = true;
			}
		}
		workStylesheet.deleteRule(0);
		return invalidDeclaration;
	}

	function sortRules(media) {
		media.elements.forEach(elementRules => elementRules.sort((ruleInfo1, ruleInfo2) =>
			ruleInfo1.styleInfo && !ruleInfo2.styleInfo ? -1 :
				!ruleInfo1.styleInfo && ruleInfo2.styleInfo ? 1 :
					compareSpecificity(ruleInfo1.specificity, ruleInfo2.specificity)));
		media.medias.forEach(sortRules);
	}

	function computeSpecificity(selector, specificity = { a: 0, b: 0, c: 0 }) {
		if (selector.type == "IdSelector") {
			specificity.a++;
		}
		if (selector.type == "ClassSelector" || selector.type == "AttributeSelector" || (selector.type == "PseudoClassSelector" && selector.name != "not")) {
			specificity.b++;
		}
		if ((selector.type == "TypeSelector" && selector.name != "*") || selector.type == "PseudoElementSelector") {
			specificity.c++;
		}
		if (selector.children) {
			selector.children.forEach(selector => computeSpecificity(selector, specificity));
		}
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

	function log(...args) {
		console.log("S-File <css-mat>", ...args); // eslint-disable-line no-console
	}

})();