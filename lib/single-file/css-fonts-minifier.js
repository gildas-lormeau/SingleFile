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

/* global cssTree, docHelper */

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
	const LOCAL_SOURCE = "local(";
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
				pseudoElementsContent += getPseudoElementsContent(doc, cssRules);
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
			if (cssRule.type == "Atrule" && cssRule.name == "media" && cssRule.block) {
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

	function filterUnusedFonts(cssRules, declaredFonts, unusedFonts, filteredUsedFonts, docContent) {
		const removedRules = [];
		for (let cssRule = cssRules.head; cssRule; cssRule = cssRule.next) {
			const ruleData = cssRule.data;
			if (ruleData.type == "Atrule" && ruleData.name == "media" && ruleData.block) {
				filterUnusedFonts(ruleData.block.children, declaredFonts, unusedFonts, filteredUsedFonts, docContent);
			} else if (ruleData.type == "Atrule" && ruleData.name == "font-face") {
				const fontFamily = getFontFamily(getPropertyValue(ruleData, "font-family"));
				if (fontFamily) {
					const unicodeRange = getPropertyValue(ruleData, "unicode-range");
					if (unusedFonts.find(fontInfo => fontInfo.fontFamily == fontFamily) || !testUnicodeRange(docContent, unicodeRange) || !testUsedFont(ruleData, fontFamily, declaredFonts, filteredUsedFonts)) {
						removedRules.push(cssRule);
					}
				}
			}
		}
		removedRules.forEach(cssRule => cssRules.remove(cssRule));
	}

	function testUsedFont(cssRule, familyName, declaredFonts, filteredUsedFonts) {
		let test;
		const optionalUsedFonts = filteredUsedFonts && filteredUsedFonts.get(familyName);
		if (optionalUsedFonts && optionalUsedFonts.length) {
			const fontStyle = getPropertyValue(cssRule, "font-style") || "normal";
			const fontWeight = getFontWeight(getPropertyValue(cssRule, "font-weight") || "400");
			const fontVariant = getPropertyValue(cssRule, "font-variant") || "normal";
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

	function processFontFaceRules(cssRules, fontsDetails, media, stats) {
		const removedRules = [];
		for (let cssRule = cssRules.head; cssRule; cssRule = cssRule.next) {
			const ruleData = cssRule.data;
			if (ruleData.type == "Atrule" && ruleData.name == "media" && ruleData.block && ruleData.prelude) {
				const mediaText = cssTree.generate(ruleData.prelude);
				processFontFaceRules(ruleData.block.children, fontsDetails, mediaText, stats);
			} else if (ruleData.type == "Atrule" && ruleData.name == "font-face" && (media.includes("all") || media.includes("screen"))) {
				const fontInfo = fontsDetails.get(getFontKey(ruleData));
				if (fontInfo) {
					fontsDetails.delete(getFontKey(ruleData));
					processFontFaceRule(ruleData, fontInfo, stats);
				} else {
					removedRules.push(cssRule);
				}
			}
		}
		removedRules.forEach(cssRule => cssRules.remove(cssRule));
	}

	function processFontFaceRule(cssRule, fontInfo, stats) {
		const findSource = fontFormat => fontInfo.find(source => source.src != EMPTY_URL_SOURCE && source.format == fontFormat);
		const filterSource = fontSource => fontInfo.filter(source => source == fontSource || source.src.startsWith(LOCAL_SOURCE));
		stats.fonts.processed += fontInfo.length;
		stats.fonts.discarded += fontInfo.length;
		const woffFontFound = findSource("woff2-variations") || findSource("woff2") || findSource("woff");
		if (woffFontFound) {
			fontInfo = filterSource(woffFontFound);
		} else {
			const ttfFontFound = findSource("truetype-variations") || findSource("truetype");
			if (ttfFontFound) {
				fontInfo = filterSource(ttfFontFound);
			} else {
				const otfFontFound = findSource("opentype") || findSource("embedded-opentype");
				if (otfFontFound) {
					fontInfo = filterSource(otfFontFound);
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
			fontInfo.reverse();
			srcDeclaration.data.value = cssTree.parse(fontInfo.map(fontSource => fontSource.src).join(","), { context: "value" });
		}
	}

	function getPropertyValue(cssRule, propertyName) {
		const property = cssRule.block.children.filter(node => node.property == propertyName).tail;
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
		if (font) {
			let familyName = "";
			const findPreviousComma = node => {
				for (; node && !(node.data.type == "Operator" && node.data.value == ","); node = node.prev);
				return node;
			};
			for (let node = font.data.value.children.tail; node && (node.data.type != "WhiteSpace" || findPreviousComma(node)); node = node.prev) {
				if (node.data.type == "Operator" && node.data.value == "," && familyName) {
					fontFamilyNames.push(getFontFamily(familyName));
					familyName = "";
				} else {
					familyName = cssTree.generate(node.data) + familyName;
				}
			}
			if (familyName) {
				fontFamilyNames.push(getFontFamily(familyName));
			}
		}
		return fontFamilyNames;
	}

	function getFontsDetails(doc, cssRules, fontsDetails) {
		cssRules.forEach(cssRule => {
			if (cssRule.type == "Atrule" && cssRule.name == "media" && cssRule.block) {
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
		return cssRules.toArray().map(cssRule => {
			if (cssRule.type == "Atrule" && cssRule.name == "media" && cssRule.block) {
				return getPseudoElementsContent(doc, cssRule.block.children);
			} else if (cssRule.type == "Rule") {
				const selector = cssTree.generate(cssRule.prelude); // TODO use OM
				if (testPseudoElements(selector)) {
					const value = docHelper.removeQuotes(getPropertyValue(cssRule, "content") || "");
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