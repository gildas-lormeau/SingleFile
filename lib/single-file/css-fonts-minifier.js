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

this.fontsMinifier = this.fontsMinifier || (() => {

	const REGEXP_URL_SIMPLE_QUOTES_FN = /url\s*\(\s*'(.*?)'\s*\)/i;
	const REGEXP_URL_DOUBLE_QUOTES_FN = /url\s*\(\s*"(.*?)"\s*\)/i;
	const REGEXP_URL_NO_QUOTES_FN = /url\s*\(\s*(.*?)\s*\)/i;
	const REGEXP_URL_FUNCTION = /(url|local)\(.*?\)\s*(,|$)/g;
	const REGEXP_COMMA = /\s*,\s*/;
	const REGEXP_DASH = /-/;
	const REGEXP_QUESTION_MARK = /\?/g;
	const REGEXP_STARTS_U_PLUS = /^U\+/i;
	const REGEXP_SIMPLE_QUOTES_STRING = /^'(.*?)'$/;
	const REGEXP_DOUBLE_QUOTES_STRING = /^"(.*?)"$/;
	const REGEXP_URL_FUNCTION_WOFF = /^url\(\s*["']?data:font\/(woff2?)/;
	const REGEXP_URL_FUNCTION_WOFF_ALT = /^url\(\s*["']?data:application\/x-font-(woff)/;
	const REGEXP_FONT_FORMAT = /\.([^.?#]+)((\?|#).*?)?$/;
	const REGEXP_FONT_FORMAT_VALUE = /format\((.*?)\)\s*,?$/;
	const REGEXP_FONT_SRC = /(.*?)\s*,?$/;
	const EMPTY_URL_SOURCE = "url(\"data:base64,\")";
	const PSEUDO_ELEMENTS = ["::after", "::before", "::first-line", "::first-letter", ":before", ":after", ":first-line", ":first-letter", "::placeholder", "::selection", "::marker", "::cue", "::slotted", "::spelling-error", "::grammar-error"];
	const FONT_WEIGHTS = {
		normal: "400",
		bold: "700"
	};
	const FONT_STRETCHES = {
		"ultra-condensed": "50%",
		"extra-condensed": "62.5%",
		"condensed": "75%",
		"semi-condensed": "87.5%",
		"normal": "100%",
		"semi-expanded": "112.5%",
		"expanded": "125%",
		"extra-expanded": "150%",
		"ultra-expanded": "200%"
	};

	return {
		removeUnusedFonts: (doc, stylesheets, styles, options) => {
			const stats = { rules: { processed: 0, discarded: 0 }, fonts: { processed: 0, discarded: 0 } };
			const fontsInfo = { declared: [], used: [] };
			let pseudoElementsContent = "";
			stylesheets.forEach(stylesheetInfo => {
				const cssRules = stylesheetInfo.stylesheet.children;
				stats.processed += cssRules.getSize();
				stats.discarded += cssRules.getSize();
				getFontsInfo(cssRules, fontsInfo);
				pseudoElementsContent += getPseudoElementsContent(cssRules);
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
						const optionalData = options.usedFonts && options.usedFonts.filter(fontInfo => fontInfo.fontFamily == familyName);
						filteredUsedFonts.set(familyName, optionalData);
					}
				}));
				unusedFonts = fontsInfo.declared.filter(fontInfo => !filteredUsedFonts.has(fontInfo.fontFamily));
			}
			const docContent = doc.body.innerText + pseudoElementsContent;
			stylesheets.forEach(stylesheetInfo => {
				const cssRules = stylesheetInfo.stylesheet.children;
				filterUnusedFonts(cssRules, fontsInfo.declared, unusedFonts, filteredUsedFonts, docContent);
				stats.rules.discarded -= cssRules.getSize();
			});
			return stats;
		},
		removeAlternativeFonts: (doc, stylesheets) => {
			const fontsDetails = new Map();
			const stats = { rules: { processed: 0, discarded: 0 }, fonts: { processed: 0, discarded: 0 } };
			stylesheets.forEach(stylesheetInfo => {
				const cssRules = stylesheetInfo.stylesheet.children;
				stats.rules.processed += cssRules.getSize();
				stats.rules.discarded += cssRules.getSize();
				getFontsDetails(doc, cssRules, fontsDetails);
			});
			processFontDetails(fontsDetails);
			stylesheets.forEach(stylesheetInfo => {
				const cssRules = stylesheetInfo.stylesheet.children;
				processFontFaceRules(cssRules, fontsDetails, "all", stats);
				stats.rules.discarded -= cssRules.getSize();
			});
			return stats;
		}
	};

	function processFontDetails(fontsDetails) {
		fontsDetails.forEach((fontInfo, fontKey) => {
			fontsDetails.set(fontKey, fontInfo.map(fontSource => {
				const fontFormatMatch = fontSource.match(REGEXP_FONT_FORMAT_VALUE);
				let fontFormat;
				const urlMatch = fontSource.match(REGEXP_URL_SIMPLE_QUOTES_FN) ||
					fontSource.match(REGEXP_URL_DOUBLE_QUOTES_FN) ||
					fontSource.match(REGEXP_URL_NO_QUOTES_FN);
				const fontUrl = urlMatch && urlMatch[1];
				if (fontFormatMatch && fontFormatMatch[1]) {
					fontFormat = fontFormatMatch[1].replace(REGEXP_SIMPLE_QUOTES_STRING, "$1").replace(REGEXP_DOUBLE_QUOTES_STRING, "$1").toLowerCase();
				}
				if (!fontFormat) {
					const fontFormatMatch = fontSource.match(REGEXP_URL_FUNCTION_WOFF);
					if (fontFormatMatch && fontFormatMatch[1]) {
						fontFormat = fontFormatMatch[1];
					} else {
						const fontFormatMatch = fontSource.match(REGEXP_URL_FUNCTION_WOFF_ALT);
						if (fontFormatMatch && fontFormatMatch[1]) {
							fontFormat = fontFormatMatch[1];
						}
					}
				}
				if (!fontFormat && fontUrl) {
					const fontFormatMatch = fontUrl.match(REGEXP_FONT_FORMAT);
					if (fontFormatMatch && fontFormatMatch[1]) {
						fontFormat = fontFormatMatch[1];
					}
				}
				return { src: fontSource.match(REGEXP_FONT_SRC)[1], fontUrl, format: fontFormat };
			}));
		});
	}

	function getFontsInfo(cssRules, fontsInfo) {
		cssRules.forEach(cssRule => {
			if (cssRule.type == "Atrule" && cssRule.name == "media") {
				getFontsInfo(cssRule.block.children, fontsInfo);
			} else if (cssRule.type == "Rule") {
				const fontFamilyNames = getFontFamilyNames(cssRule.block);
				if (fontFamilyNames.length) {
					fontsInfo.used.push(fontFamilyNames);
				}
			} else {
				if (cssRule.type == "Atrule" && cssRule.name == "font-face") {
					const fontFamily = getFontFamily(getPropertyValue(cssRule, "font-family"));
					if (fontFamily) {
						const fontWeight = getFontWeight(getPropertyValue(cssRule, "font-weight") || "400");
						const fontStyle = getPropertyValue(cssRule, "font-style") || "normal";
						const fontVariant = getPropertyValue(cssRule, "font-variant") || "normal";
						fontsInfo.declared.push({ fontFamily, fontWeight, fontStyle, fontVariant });
					}
				}
			}
		});
	}

	function getPropertyValue(cssRule, propertyName) {
		const property = cssRule.block.children.filter(node => node.property == propertyName).tail;
		if (property) {
			return cssTree.generate(property.data.value);
		}
	}

	function getFontFamilyNames(declarations) {
		let fontFamilyName = declarations.children.filter(node => node.property == "font-family").tail;
		let fontFamilyNames = [];
		if (fontFamilyName) {
			fontFamilyNames = fontFamilyName.data.value.children.filter(node => node.type == "String" || node.type == "Identifier").toArray().map(property => getFontFamily(cssTree.generate(property)));
		}
		const font = declarations.children.filter(node => node.property == "font").tail;
		if (font) {
			for (let node = font.data.value.children.tail; node && node.type != "WhiteSpace"; node = node.prev) {
				if (node.data.type == "String" || node.data.type == "Identifier") {
					fontFamilyNames.push(getFontFamily(cssTree.generate(node.data)));
				}
			}
		}
		return fontFamilyNames;
	}

	function getFontsDetails(doc, cssRules, fontsDetails) {
		cssRules.forEach(cssRule => {
			if (cssRule.type == "Atrule" && cssRule.name == "media") {
				getFontsDetails(doc, cssRule.block.children, fontsDetails);
			} else {
				if (cssRule.type == "Atrule" && cssRule.name == "font-face") {
					const fontKey = getFontKey(cssRule);
					let fontInfo = fontsDetails.get(fontKey);
					if (!fontInfo) {
						fontInfo = [];
						fontsDetails.set(fontKey, fontInfo);
					}
					const src = getPropertyValue(cssRule, "src");
					if (src) {
						const fontSources = src.match(REGEXP_URL_FUNCTION);
						if (fontSources) {
							fontSources.forEach(source => fontInfo.unshift(source));
						}
					}
				}
			}
		});
	}

	function processFontFaceRules(cssRules, fontsDetails, media, stats) {
		cssRules.forEach(cssRule => {
			if (cssRule.type == "Atrule" && cssRule.name == "media") {
				const mediaText = cssTree.generate(cssRule.prelude);
				processFontFaceRules(cssRule.block.children, fontsDetails, mediaText, stats);
			} else if (cssRule.type == "Atrule" && cssRule.name == "font-face" && (media.includes("all") || media.includes("screen"))) {
				const fontInfo = fontsDetails.get(getFontKey(cssRule));
				if (fontInfo) {
					fontsDetails.delete(getFontKey(cssRule));
					processFontFaceRule(cssRule, fontInfo, stats);
				}
			}
		});
	}

	function processFontFaceRule(cssRule, fontInfo, stats) {
		const fontTest = (fontSource, format) => !fontSource.src.startsWith(EMPTY_URL_SOURCE) && fontSource.format == format;
		let woffFontFound = fontInfo.find(fontSource => fontTest(fontSource, "woff2-variations"));
		if (!woffFontFound) {
			woffFontFound = fontInfo.find(fontSource => fontTest(fontSource, "woff2"));
		}
		if (!woffFontFound) {
			woffFontFound = fontInfo.find(fontSource => fontTest(fontSource, "woff"));
		}
		stats.fonts.processed += fontInfo.length;
		stats.fonts.discarded += fontInfo.length;
		if (woffFontFound) {
			fontInfo = [woffFontFound];
		} else {
			let ttfFontFound = fontInfo.find(fontSource => fontTest(fontSource, "truetype-variations"));
			if (!ttfFontFound) {
				ttfFontFound = fontInfo.find(fontSource => fontTest(fontSource, "truetype"));
			}
			if (ttfFontFound) {
				fontInfo = [ttfFontFound];
			} else {
				let otfFontFound = fontInfo.find(fontSource => fontTest(fontSource, "opentype"));
				if (!otfFontFound) {
					otfFontFound = fontInfo.find(fontSource => fontTest(fontSource, "embedded-opentype"));
				}
				if (otfFontFound) {
					fontInfo = [otfFontFound];
				}
			}
		}
		stats.fonts.discarded -= fontInfo.length;
		const removedNodes = [];
		for (let node = cssRule.block.children.head; node; node = node.next) {
			if (node.data.property == "src") {
				removedNodes.push(node);
			}
		}
		removedNodes.pop();
		removedNodes.forEach(node => cssRule.block.children.remove(node));
		const srcDeclaration = cssRule.block.children.filter(node => node.property == "src").tail;
		if (srcDeclaration) {
			srcDeclaration.data.value = cssTree.parse(fontInfo.map(fontSource => fontSource.src).join(","), { context: "value" });
		}
	}

	function filterUnusedFonts(rules, declaredFonts, unusedFonts, filteredUsedFonts, docContent) {
		const removedRules = [];
		for (let rule = rules.head; rule; rule = rule.next) {
			const ruleData = rule.data;
			if (ruleData.type == "Atrule" && ruleData.name == "media") {
				filterUnusedFonts(ruleData.block.children, declaredFonts, unusedFonts, filteredUsedFonts, docContent);
			} else if (ruleData.type == "Atrule" && ruleData.name == "font-face") {
				const fontFamily = getFontFamily(getPropertyValue(ruleData, "font-family"));
				if (fontFamily) {
					const unicodeRange = getPropertyValue(ruleData, "unicode-range");
					if (unusedFonts.find(fontInfo => fontInfo.fontFamily == fontFamily) || !testUnicodeRange(docContent, unicodeRange) || !testUsedFont(ruleData, fontFamily, declaredFonts, filteredUsedFonts)) {
						removedRules.push(rule);
					}
				}
			}
		}
		removedRules.forEach(rule => rules.remove(rule));
	}

	function testUsedFont(rule, familyName, declaredFonts, filteredUsedFonts) {
		let test;
		const optionalUsedFonts = filteredUsedFonts && filteredUsedFonts.get(familyName);
		if (optionalUsedFonts && optionalUsedFonts.length) {
			const fontStyle = getPropertyValue(rule, "font-style") || "normal";
			const fontWeight = getFontWeight(getPropertyValue(rule, "font-weight") || "400");
			const fontVariant = getPropertyValue(rule, "font-variant") || "normal";
			const declaredFontsWeights = declaredFonts
				.filter(fontInfo => fontInfo.fontFamily == familyName && fontInfo.fontStyle == fontStyle && testFontVariant(fontInfo, fontVariant))
				.map(fontInfo => fontInfo.fontWeight)
				.sort((weight1, weight2) => weight1 - weight2);
			const usedFontWeights = optionalUsedFonts.map(fontInfo => findFontWeight(fontInfo.fontWeight, declaredFontsWeights));
			test = usedFontWeights.includes(fontWeight);
		} else {
			test = true;
		}
		return test;
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

	function getPseudoElementsContent(cssRules) {
		return cssRules.toArray().map(cssRule => {
			if (cssRule.type == "Atrule" && cssRule.name == "media") {
				return getPseudoElementsContent(cssRule.block.children);
			} else if (cssRule.type == "Rule") {
				const selector = cssTree.generate(cssRule.prelude); // TODO use OM
				if (testPseudoElements(selector)) {
					return getPropertyValue(cssRule, "content");
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

	function getFontKey(cssRule) {
		return JSON.stringify([
			getFontFamily(getPropertyValue(cssRule, "font-family")),
			getFontWeight(getPropertyValue(cssRule, "font-weight") || "400"),
			getPropertyValue(cssRule, "font-style") || "normal",
			getPropertyValue(cssRule, "unicode-range"),
			getFontStretch(getPropertyValue(cssRule, "font-stretch")),
			getPropertyValue(cssRule, "font-variant") || "normal",
			getPropertyValue(cssRule, "font-feature-settings"),
			getPropertyValue(cssRule, "font-variation-settings")
		]);
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

	function getFontStretch(stretch) {
		return FONT_STRETCHES[stretch] || stretch;
	}

})();