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

/* global cssTree, fontPropertyParser, docHelper */

this.fontsMinifier = this.fontsMinifier || (() => {

	const REGEXP_COMMA = /\s*,\s*/;
	const REGEXP_DASH = /-/;
	const REGEXP_QUESTION_MARK = /\?/g;
	const REGEXP_STARTS_U_PLUS = /^U\+/i;
	const REGEXP_SIMPLE_QUOTES_STRING = /^'(.*?)'$/;
	const REGEXP_DOUBLE_QUOTES_STRING = /^"(.*?)"$/;
	const PSEUDO_ELEMENTS = ["::after", "::before", "::first-line", "::first-letter", ":before", ":after", ":first-line", ":first-letter", "::placeholder", "::selection", "::marker", "::cue", "::slotted", "::spelling-error", "::grammar-error"];
	const FONT_WEIGHTS = {
		normal: "400",
		bold: "700"
	};

	return {
		process: (doc, stylesheets, styles, options) => {
			const stats = { rules: { processed: 0, discarded: 0 }, fonts: { processed: 0, discarded: 0 } };
			const fontsInfo = { declared: [], used: [] };
			let pseudoElementsContent = "";
			stylesheets.forEach(stylesheetInfo => {
				const cssRules = stylesheetInfo.stylesheet.children;
				if (cssRules) {
					stats.processed += cssRules.getSize();
					stats.discarded += cssRules.getSize();
					getFontsInfo(cssRules, fontsInfo);
					pseudoElementsContent += getPseudoElementsContent(doc, cssRules);
				}
			});
			styles.forEach(style => {
				const fontFamilyNames = getFontFamilyNames(style);
				if (fontFamilyNames.length) {
					fontsInfo.used.push(fontFamilyNames);
				}
			});
			const variableFound = fontsInfo.used.find(fontNames => fontNames.find(fontName => fontName.startsWith("var(--")));
			let unusedFonts, filteredUsedFonts;
			if (variableFound) {
				unusedFonts = [];
			} else {
				filteredUsedFonts = new Map();
				fontsInfo.used.forEach(fontNames => fontNames.forEach(familyName => {
					if (fontsInfo.declared.find(fontInfo => fontInfo.fontFamily == familyName)) {
						const optionalData = options.usedFonts && options.usedFonts.filter(fontInfo => fontInfo[0] == familyName);
						filteredUsedFonts.set(familyName, optionalData);
					}
				}));
				unusedFonts = fontsInfo.declared.filter(fontInfo => !filteredUsedFonts.has(fontInfo.fontFamily));
			}
			const docContent = doc.body.innerText + pseudoElementsContent;
			stylesheets.forEach(stylesheetInfo => {
				const cssRules = stylesheetInfo.stylesheet.children;
				if (cssRules) {
					filterUnusedFonts(cssRules, fontsInfo.declared, unusedFonts, filteredUsedFonts, docContent);
					stats.rules.discarded -= cssRules.getSize();
				}
			});
			return stats;
		}
	};

	function getFontsInfo(cssRules, fontsInfo) {
		cssRules.forEach(ruleData => {
			if (ruleData.type == "Atrule" && ruleData.name == "media" && ruleData.block && ruleData.block.children) {
				getFontsInfo(ruleData.block.children, fontsInfo);
			} else if (ruleData.type == "Rule") {
				const fontFamilyNames = getFontFamilyNames(ruleData.block);
				if (fontFamilyNames.length) {
					fontsInfo.used.push(fontFamilyNames);
				}
			} else {
				if (ruleData.type == "Atrule" && ruleData.name == "font-face") {
					const fontFamily = getFontFamily(getPropertyValue(ruleData, "font-family"));
					if (fontFamily) {
						const fontWeight = getFontWeight(getPropertyValue(ruleData, "font-weight") || "400");
						const fontStyle = getPropertyValue(ruleData, "font-style") || "normal";
						const fontVariant = getPropertyValue(ruleData, "font-variant") || "normal";
						fontsInfo.declared.push({ fontFamily, fontWeight, fontStyle, fontVariant });
					}
				}
			}
		});
	}

	function filterUnusedFonts(cssRules, declaredFonts, unusedFonts, filteredUsedFonts, docContent) {
		const removedRules = [];
		for (let cssRule = cssRules.head; cssRule; cssRule = cssRule.next) {
			const ruleData = cssRule.data;
			if (ruleData.type == "Atrule" && ruleData.name == "media" && ruleData.block && ruleData.block.children) {
				filterUnusedFonts(ruleData.block.children, declaredFonts, unusedFonts, filteredUsedFonts, docContent);
			} else if (ruleData.type == "Atrule" && ruleData.name == "font-face") {
				const fontFamily = getFontFamily(getPropertyValue(ruleData, "font-family"));
				if (fontFamily) {
					const unicodeRange = getPropertyValue(ruleData, "unicode-range");
					if (unusedFonts.find(fontInfo => fontInfo.fontFamily == fontFamily) || !testUnicodeRange(docContent, unicodeRange) || !testUsedFont(ruleData, fontFamily, declaredFonts, filteredUsedFonts)) {
						removedRules.push(cssRule);
					}
				}
				const removedDeclarations = [];
				for (let declaration = ruleData.block.children.head; declaration; declaration = declaration.next) {
					if (declaration.data.property == "font-display") {
						removedDeclarations.push(declaration);
					}
				}
				if (removedDeclarations.length) {
					removedDeclarations.forEach(removedDeclaration => ruleData.block.children.remove(removedDeclaration));
				}
			}
		}
		removedRules.forEach(cssRule => cssRules.remove(cssRule));
	}

	function testUsedFont(ruleData, familyName, declaredFonts, filteredUsedFonts) {
		let test;
		const optionalUsedFonts = filteredUsedFonts && filteredUsedFonts.get(familyName);
		if (optionalUsedFonts && optionalUsedFonts.length) {
			const fontStyle = getPropertyValue(ruleData, "font-style") || "normal";
			const fontWeight = getFontWeight(getPropertyValue(ruleData, "font-weight") || "400");
			const fontVariant = getPropertyValue(ruleData, "font-variant") || "normal";
			const declaredFontsWeights = declaredFonts
				.filter(fontInfo => fontInfo.fontFamily == familyName && fontInfo.fontStyle == fontStyle && testFontVariant(fontInfo, fontVariant))
				.map(fontInfo => fontInfo.fontWeight)
				.sort((weight1, weight2) => weight1 - weight2);
			const usedFontWeights = optionalUsedFonts.map(fontInfo => findFontWeight(fontInfo[1], declaredFontsWeights));
			test = usedFontWeights.includes(fontWeight);
		} else {
			test = true;
		}
		return test;
	}

	function getPropertyValue(ruleData, propertyName) {
		let property;
		if (ruleData.block.children) {
			property = ruleData.block.children.filter(node => node.property == propertyName).tail;
		}
		if (property) {
			try {
				return cssTree.generate(property.data.value);
			} catch (error) {
				// ignored
			}
		}
	}

	function getFontFamilyNames(declarations) {
		let fontFamilyName = declarations.children.filter(node => node.property == "font-family").tail;
		let fontFamilyNames = [];
		if (fontFamilyName) {
			let familyName = "";
			if (fontFamilyName.data.value.children) {
				fontFamilyName.data.value.children.forEach(node => {
					if (node.type == "Operator" && node.value == "," && familyName) {
						fontFamilyNames.push(getFontFamily(familyName));
						familyName = "";
					} else {
						familyName += cssTree.generate(node);
					}
				});
			} else {
				fontFamilyName = cssTree.generate(fontFamilyName.data.value);
			}
			if (familyName) {
				fontFamilyNames.push(getFontFamily(familyName));
			}
		}
		const font = declarations.children.filter(node => node.property == "font").tail;
		if (font && font.data && font.data.value) {
			try {
				const parsedFont = fontPropertyParser.parse(cssTree.generate(font.data.value));
				parsedFont.family.forEach(familyName => fontFamilyNames.push(getFontFamily(familyName)));
			} catch (error) {
				// ignored				
			}
		}
		return fontFamilyNames;
	}

	function findFontWeight(fontWeight, fontWeights) {
		let foundWeight;
		if (fontWeight >= 400 && fontWeight <= 500) {
			foundWeight = fontWeights.find(weight => weight >= fontWeight && weight <= 500);
			if (!foundWeight) {
				foundWeight = findDescendingFontWeight(fontWeight, fontWeights);
			}
			if (!foundWeight) {
				foundWeight = findAscendingFontWeight(fontWeight, fontWeights);
			}
		}
		if (fontWeight < 400) {
			foundWeight = fontWeights.slice().reverse().find(weight => weight <= fontWeight);
			if (!foundWeight) {
				foundWeight = findAscendingFontWeight(fontWeight, fontWeights);
			}
		}
		if (fontWeight > 500) {
			foundWeight = fontWeights.find(weight => weight >= fontWeight);
			if (!foundWeight) {
				foundWeight = findDescendingFontWeight(fontWeight, fontWeights);
			}
		}
		return foundWeight;
	}

	function findDescendingFontWeight(fontWeight, fontWeights) {
		return fontWeights.slice().reverse().find(weight => weight < fontWeight);
	}

	function findAscendingFontWeight(fontWeight, fontWeights) {
		return fontWeights.find(weight => weight > fontWeight);
	}

	function getPseudoElementsContent(doc, cssRules) {
		return cssRules.toArray().map(ruleData => {
			if (ruleData.block && ruleData.block.children && ruleData.prelude && ruleData.prelude.children) {
				if (ruleData.type == "Atrule" && ruleData.name == "media") {
					return getPseudoElementsContent(doc, ruleData.block.children);
				} else if (ruleData.type == "Rule") {
					const selector = cssTree.generate(ruleData.prelude); // TODO use OM
					if (testPseudoElements(selector)) {
						const value = docHelper.removeQuotes(getPropertyValue(ruleData, "content") || "");
						if (value) {
							const styleElement = doc.createElement("style");
							styleElement.textContent = "tmp { content:\"" + value + "\"}";
							doc.documentElement.appendChild(styleElement);
							let content = docHelper.removeQuotes(styleElement.sheet.cssRules[0].style.getPropertyValue("content"));
							styleElement.remove();
							return content;
						}
					}
				}
			}
		}).join("");
	}

	function testFontVariant(fontInfo, fontVariant) {
		return fontInfo.fontVariant == fontVariant || "normal" || fontInfo.fontVariant == fontVariant || "common-ligatures";
	}

	function testUnicodeRange(docContent, unicodeRange) {
		if (unicodeRange) {
			const unicodeRanges = unicodeRange.split(REGEXP_COMMA);
			let invalid;
			const result = unicodeRanges.filter(rangeValue => {
				const range = rangeValue.split(REGEXP_DASH);
				let regExpString;
				if (range.length == 2) {
					range[0] = transformRange(range[0]);
					regExpString = "[" + range[0] + "-" + transformRange("U+" + range[1]) + "]";
				}
				if (range.length == 1) {
					if (range[0].includes("?")) {
						const firstRange = transformRange(range[0]);
						const secondRange = firstRange;
						regExpString = "[" + firstRange.replace(REGEXP_QUESTION_MARK, "0") + "-" + secondRange.replace(REGEXP_QUESTION_MARK, "F") + "]";

					} else {
						regExpString = "[" + transformRange(range[0]) + "]";
					}
				}
				if (regExpString) {
					try {
						return (new RegExp(regExpString, "u")).test(docContent);
					} catch (error) {
						invalid = true;
						return false;
					}
				}
				return true;
			});
			return !invalid && (!unicodeRanges.length || result.length);
		}
		return true;
	}

	function testPseudoElements(selectorText) {
		let indexSelector = 0, found;
		selectorText = selectorText.toLowerCase();
		while (indexSelector < PSEUDO_ELEMENTS.length && !found) {
			found = selectorText.includes(PSEUDO_ELEMENTS[indexSelector]);
			if (!found) {
				indexSelector++;
			}
		}
		return found;
	}

	function transformRange(range) {
		range = range.replace(REGEXP_STARTS_U_PLUS, "");
		while (range.length < 6) {
			range = "0" + range;
		}
		return "\\u{" + range + "}";
	}

	function getFontFamily(string = "") {
		string = string.toLowerCase().trim();
		if (string.match(REGEXP_SIMPLE_QUOTES_STRING)) {
			string = string.replace(REGEXP_SIMPLE_QUOTES_STRING, "$1");
		} else {
			string = string.replace(REGEXP_DOUBLE_QUOTES_STRING, "$1");
		}
		return string.trim();
	}

	function getFontWeight(weight) {
		return FONT_WEIGHTS[weight] || weight;
	}

})();