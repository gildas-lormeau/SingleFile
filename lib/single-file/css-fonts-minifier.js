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
		removeUnusedFonts: (doc, options) => {
			const stats = {
				rules: {
					processed: 0,
					discarded: 0
				},
				fonts: {
					processed: 0,
					discarded: 0
				}
			};
			const fontsInfo = { declared: [], used: [] };
			let pseudoElementsContent = "";
			doc.querySelectorAll("style").forEach(style => {
				if (style.sheet) {
					stats.rules.processed += style.sheet.cssRules.length;
					stats.rules.discarded += style.sheet.cssRules.length;
					getFontsInfo(doc, style.sheet.cssRules, fontsInfo);
					pseudoElementsContent += getPseudoElementsContent(doc, style.sheet.cssRules);
				}
			});
			doc.querySelectorAll("[style]").forEach(element => {
				if (element.style.fontFamily) {
					const fontFamilyNames = element.style.fontFamily.split(",").map(fontFamilyName => removeQuotes(fontFamilyName));
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
					if (fontsInfo.declared.find(fontInfo => fontInfo.familyName == familyName)) {
						const optionalData = options.usedFonts && options.usedFonts.filter(fontInfo => fontInfo.fontFamily == familyName);
						filteredUsedFonts.set(familyName, optionalData);
					}
				}));
				unusedFonts = fontsInfo.declared.filter(fontInfo => !filteredUsedFonts.has(fontInfo.familyName));
			}
			const docContent = doc.body.innerText + pseudoElementsContent;
			doc.querySelectorAll("style").forEach(style => {
				if (style.sheet) {
					style.textContent = filterUnusedFonts(doc, style.sheet.cssRules, fontsInfo.declared, unusedFonts, filteredUsedFonts, docContent);
					stats.rules.discarded -= style.sheet.cssRules.length;
				}
			});
			return stats;
		},
		removeAlternativeFonts: doc => {
			const fontsDetails = new Map();
			const stats = {
				rules: {
					processed: 0,
					discarded: 0
				},
				fonts: {
					processed: 0,
					discarded: 0
				}
			};
			doc.querySelectorAll("style").forEach(style => {
				if (style.sheet) {
					stats.rules.processed += style.sheet.cssRules.length;
					stats.rules.discarded += style.sheet.cssRules.length;
					getFontsDetails(doc, style.sheet.cssRules, fontsDetails);
				}
			});
			doc.querySelectorAll("style").forEach(style => {
				if (style.sheet) {
					style.textContent = processFontFaceRules(style.sheet.cssRules, fontsDetails, "all", stats);
					stats.rules.discarded -= style.sheet.cssRules.length;
				}
			});
			return stats;
		}
	};

	function getFontsInfo(doc, rules, fontsInfo) {
		if (rules) {
			Array.from(rules).forEach(rule => {
				if (rule.type == CSSRule.MEDIA_RULE) {
					getFontsInfo(doc, rule.cssRules, fontsInfo);
				} else if (rule.type == CSSRule.STYLE_RULE) {
					if (rule.style && rule.style.fontFamily) {
						const fontFamilyNames = rule.style.fontFamily.split(",").map(fontFamilyName => removeQuotes(fontFamilyName));
						fontsInfo.used.push(fontFamilyNames);
					}
				} else {
					if (rule.type == CSSRule.FONT_FACE_RULE && rule.style) {
						const familyName = removeQuotes(rule.style.getPropertyValue("font-family"));
						const fontWeight = getFontWeight(rule.style.getPropertyValue("font-weight")) || "400";
						const fontStyle = rule.style.getPropertyValue("font-style") || "normal";
						const fontVariant = rule.style.getPropertyValue("font-variant") || "normal";
						if (familyName) {
							fontsInfo.declared.push({ familyName, fontWeight, fontStyle, fontVariant });
						}
					}
				}
			});
		}
	}

	function getFontsDetails(doc, rules, fontsDetails) {
		if (rules) {
			Array.from(rules).forEach(rule => {
				if (rule.type == CSSRule.MEDIA_RULE) {
					getFontsDetails(doc, rule.cssRules, fontsDetails);
				} else {
					if (rule.type == CSSRule.FONT_FACE_RULE && rule.style) {
						const fontKey = getFontKey(rule.style);
						let fontInfo = fontsDetails.get(fontKey);
						if (!fontInfo) {
							fontInfo = [];
							fontsDetails.set(fontKey, fontInfo);
						}
						const src = rule.style.getPropertyValue("src");
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
	}

	function processFontFaceRules(rules, fontsDetails, media, stats) {
		let stylesheetContent = "";
		Array.from(rules).forEach(rule => {
			if (rule.type == CSSRule.MEDIA_RULE) {
				stylesheetContent += "@media " + Array.prototype.join.call(rule.media, ",") + "{";
				stylesheetContent += processFontFaceRules(rule.cssRules, fontsDetails, rule.media.mediaText, stats);
				stylesheetContent += "}";
			} else if (rule.type == CSSRule.FONT_FACE_RULE && (media.includes("all") || media.includes("screen"))) {
				const fontInfo = fontsDetails.get(getFontKey(rule.style));
				if (fontInfo) {
					fontsDetails.delete(getFontKey(rule.style));
					stylesheetContent += "@font-face {" + processFontFaceRule(rule, fontInfo, stats) + "}";
				}
			} else {
				stylesheetContent += rule.cssText;
			}
		});
		return stylesheetContent;
	}

	function processFontFaceRule(rule, fontInfo, stats) {
		let fontSources = fontInfo.map(fontSource => {
			const fontFormatMatch = fontSource.match(REGEXP_FONT_FORMAT_VALUE);
			let fontFormat;
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
			if (!fontFormat) {
				const urlMatch = fontSource.match(REGEXP_URL_SIMPLE_QUOTES_FN) ||
					fontSource.match(REGEXP_URL_DOUBLE_QUOTES_FN) ||
					fontSource.match(REGEXP_URL_NO_QUOTES_FN);
				const fontUrl = urlMatch && urlMatch[1];
				if (fontUrl) {
					const fontFormatMatch = fontUrl.match(REGEXP_FONT_FORMAT);
					if (fontFormatMatch && fontFormatMatch[1]) {
						fontFormat = fontFormatMatch[1];
					}
				}
			}
			return { src: fontSource.match(REGEXP_FONT_SRC)[1], format: fontFormat };
		});
		const fontTest = (fontSource, format) => !fontSource.src.startsWith(EMPTY_URL_SOURCE) && fontSource.format == format;
		let woffFontFound = fontSources.find(fontSource => fontTest(fontSource, "woff2-variations"));
		if (!woffFontFound) {
			woffFontFound = fontSources.find(fontSource => fontTest(fontSource, "woff2"));
		}
		if (!woffFontFound) {
			woffFontFound = fontSources.find(fontSource => fontTest(fontSource, "woff"));
		}
		stats.fonts.processed += fontSources.length;
		stats.fonts.discarded += fontSources.length;
		if (woffFontFound) {
			fontSources = [woffFontFound];
		} else {
			let ttfFontFound = fontSources.find(fontSource => fontTest(fontSource, "truetype-variations"));
			if (!ttfFontFound) {
				ttfFontFound = fontSources.find(fontSource => fontTest(fontSource, "truetype"));
			}
			if (ttfFontFound) {
				fontSources = [ttfFontFound];
			} else {
				let otfFontFound = fontSources.find(fontSource => fontTest(fontSource, "opentype"));
				if (!otfFontFound) {
					otfFontFound = fontSources.find(fontSource => fontTest(fontSource, "embedded-opentype"));
				}
				if (otfFontFound) {
					fontSources = [otfFontFound];
				}
			}
		}
		stats.fonts.discarded -= fontSources.length;
		let cssText = "";
		Array.from(rule.style).forEach(propertyName => {
			cssText += propertyName + ":";
			if (propertyName == "src") {
				cssText += fontSources.map(fontSource => fontSource.src).join(",");
			} else {
				cssText += rule.style.getPropertyValue(propertyName);
			}
			cssText += ";";
		});
		return cssText;
	}

	function filterUnusedFonts(doc, rules, declaredFonts, unusedFonts, filteredUsedFonts, docContent) {
		let stylesheetContent = "";
		if (rules) {
			Array.from(rules).forEach(rule => {
				if (rule.media) {
					stylesheetContent += "@media " + Array.prototype.join.call(rule.media, ",") + "{";
					stylesheetContent += filterUnusedFonts(doc, rule.cssRules, declaredFonts, unusedFonts, filteredUsedFonts, docContent);
					stylesheetContent += "}";
				} else if (rule.type == CSSRule.FONT_FACE_RULE) {
					if (rule.style) {
						const fontFamily = removeQuotes(rule.style.getPropertyValue("font-family"));
						if (fontFamily && !unusedFonts.find(fontInfo => fontInfo.familyName == fontFamily)) {
							let optionalTest;
							const optionalUsedFonts = filteredUsedFonts && filteredUsedFonts.get(fontFamily);
							if (optionalUsedFonts && optionalUsedFonts.length) {
								const fontStyle = rule.style.getPropertyValue("font-style") || "normal";
								const fontWeight = getFontWeight(rule.style.getPropertyValue("font-weight")) || "400";
								const fontVariant = rule.style.getPropertyValue("font-variant");
								optionalTest = optionalUsedFonts.find(fontInfo => fontInfo.fontStyle == fontStyle);
								if (optionalTest) {
									optionalTest = optionalUsedFonts.find(fontInfo => fontInfo.fontVariant == fontVariant || "normal" || fontInfo.fontVariant == fontVariant || "common-ligatures");
								}
								if (optionalTest) {
									if (isNaN(fontWeight)) {
										optionalTest = true;
									} else {
										const usedFontWeights = optionalUsedFonts.map(fontInfo => fontInfo.fontWeight);
										const declaredFontsWeights = declaredFonts
											.filter(fontInfo => fontInfo.familyName == fontFamily && fontInfo.fontStyle == fontStyle && (fontInfo.fontVariant == fontVariant || "normal" || fontInfo.fontVariant == fontVariant || "common-ligatures"))
											.map(fontInfo => fontInfo.fontWeight)
											.sort((w1, w2) => w1 - w2);
										const usedComputedFontWeights = usedFontWeights.map(fontWeight => findFontWeight(fontWeight, declaredFontsWeights));
										optionalTest = usedComputedFontWeights.includes(fontWeight);
									}
								}
							} else {
								optionalTest = true;
							}
							if (testUnicodeRange(docContent, rule.style.getPropertyValue("unicode-range")) && optionalTest) {
								stylesheetContent += rule.cssText;
							}
						}
					}
				} else {
					stylesheetContent += rule.cssText;
				}
			});
		}
		return stylesheetContent;
	}

	function findFontWeight(fontWeight, fontWeights) {
		let foundWeight;
		if (fontWeight >= 400 && fontWeight <= 500) {
			foundWeight = fontWeights.find(weight => weight >= fontWeight && weight <= 500);
			if (!foundWeight) {
				foundWeight = fontWeights.slice().reverse().find(weight => weight < fontWeight);
			}
			if (!foundWeight) {
				foundWeight = fontWeights.find(weight => weight > fontWeight);
			}
		}
		if (fontWeight < 400) {
			foundWeight = fontWeights.slice().reverse().find(weight => weight <= fontWeight);
			if (!foundWeight) {
				foundWeight = fontWeights.find(weight => weight > fontWeight);
			}
		}
		if (fontWeight > 500) {
			foundWeight = fontWeights.find(weight => weight >= fontWeight);
			if (!foundWeight) {
				foundWeight = fontWeights.slice().reverse().find(weight => weight < fontWeight);
			}
		}
		return foundWeight;
	}

	function getPseudoElementsContent(doc, rules) {
		if (rules) {
			return Array.from(rules).map(rule => {
				if (rule.type == CSSRule.MEDIA_RULE) {
					return getPseudoElementsContent(doc, rule.cssRules);
				} else if (rule.type == CSSRule.STYLE_RULE && testPseudoElements(rule.selectorText)) {
					let content = rule.style.getPropertyValue("content");
					content = content && removeQuotes(content);
					return content;
				}
			}).join("");
		} else {
			return "";
		}
	}

	function testUnicodeRange(docContent, unicodeRange) {
		if (unicodeRange) {
			const unicodeRanges = unicodeRange.split(REGEXP_COMMA);
			const result = unicodeRanges.filter(rangeValue => {
				const range = rangeValue.split(REGEXP_DASH);
				if (range.length == 2) {
					range[0] = transformRange(range[0]);
					const regExpString = "[" + range[0] + "-" + transformRange("U+" + range[1]) + "]";
					return (new RegExp(regExpString, "u")).test(docContent);
				}
				if (range.length == 1) {
					if (range[0].includes("?")) {
						const firstRange = transformRange(range[0]);
						const secondRange = firstRange;
						const regExpString = "[" + firstRange.replace(REGEXP_QUESTION_MARK, "0") + "-" + secondRange.replace(REGEXP_QUESTION_MARK, "F") + "]";
						return (new RegExp(regExpString, "u")).test(docContent);

					} else {
						const regExpString = "[" + transformRange(range[0]) + "]";
						return (new RegExp(regExpString, "u")).test(docContent);
					}
				}
				return true;
			});
			return result.length;
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

	function getFontKey(style) {
		return JSON.stringify([
			removeQuotes(style.getPropertyValue("font-family")),
			getFontWeight(style.getPropertyValue("font-weight")),
			style.getPropertyValue("font-style"),
			style.getPropertyValue("unicode-range"),
			getFontStretch(style.getPropertyValue("font-stretch")),
			style.getPropertyValue("font-variant"),
			style.getPropertyValue("font-feature-settings"),
			style.getPropertyValue("font-variation-settings")
		]);
	}

	function removeQuotes(string) {
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