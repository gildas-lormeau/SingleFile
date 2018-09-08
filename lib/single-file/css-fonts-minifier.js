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
	const REGEXP_URL_FUNCTION = /url\(.*?\)\s*(,|$)/g;
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

	return {
		process: (doc, secondPass) => {
			const declaredFonts = new Set();
			const usedFonts = [];
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
					const processedRules = style.sheet.cssRules.length;
					stats.rules.processed += processedRules;
					style.textContent = processRules(doc, style.sheet.cssRules, declaredFonts, usedFonts, stats, secondPass);
					stats.rules.discarded += processedRules - style.sheet.cssRules.length;
				}
			});
			doc.querySelectorAll("[style]").forEach(element => {
				if (element.style.fontFamily) {
					const fontFamilyNames = element.style.fontFamily.split(",").map(fontFamilyName => getFontFamilyName(fontFamilyName));
					usedFonts.push(fontFamilyNames);
				}
			});
			const filteredUsedFonts = new Set(usedFonts.map(fontNames => fontNames.find(fontName => declaredFonts.has(fontName))).filter(fontName => fontName));
			const unusedFonts = Array.from(declaredFonts).filter(fontFamilyName => !filteredUsedFonts.has(fontFamilyName));
			doc.querySelectorAll("style").forEach(style => {
				if (style.sheet) {
					const processedRules = style.sheet.cssRules.length;
					style.textContent = deleteUnusedFonts(doc, style.sheet.cssRules, unusedFonts);
					stats.rules.discarded += processedRules - style.sheet.cssRules.length;
				}
			});
			return stats;
		}
	};

	function processRules(doc, rules, declaredFonts, usedFonts, stats, secondPass) {
		let stylesheetContent = "";
		if (rules) {
			Array.from(rules).forEach(rule => {
				if (rule.type == CSSRule.MEDIA_RULE) {
					stylesheetContent += "@media " + Array.prototype.join.call(rule.media, ",") + " {";
					stylesheetContent += processRules(doc, rule.cssRules, declaredFonts, usedFonts, stats, secondPass);
					stylesheetContent += "}";
				} else if (rule.type == CSSRule.STYLE_RULE) {
					if (rule.style && rule.style.fontFamily) {
						const fontFamilyNames = rule.style.fontFamily.split(",").map(fontFamilyName => getFontFamilyName(fontFamilyName));
						usedFonts.push(fontFamilyNames);
					}
					stylesheetContent += rule.cssText;
				} else {
					let cssText = rule.cssText;
					if (rule.type == CSSRule.FONT_FACE_RULE && rule.style) {
						const fontFamilyName = rule.style.getPropertyValue("font-family");
						if (fontFamilyName) {
							declaredFonts.add(getFontFamilyName(fontFamilyName));
						}
						const src = rule.style.getPropertyValue("src");
						if (src) {
							const fontSources = src.match(REGEXP_URL_FUNCTION);
							if (fontSources) {
								if (secondPass || testUnicodeRange(doc, rule)) {
									cssText = processFontFaceRule(rule, fontSources, stats);
								} else {
									cssText = "";
								}
							}
						}
					}
					stylesheetContent += cssText;
				}
			});
		}
		return stylesheetContent;
	}

	function testUnicodeRange(doc, rule) {
		const unicodeRange = rule.style.getPropertyValue("unicode-range");
		const docContent = doc.body.outerText;
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

	function transformRange(range) {
		range = range.replace(REGEXP_STARTS_U_PLUS, "");
		while (range.length < 6) {
			range = "0" + range;
		}
		return "\\u{" + range + "}";
	}

	function processFontFaceRule(rule, fontSources, stats) {
		fontSources = fontSources.map(fontSrc => {
			const fontFormatMatch = fontSrc.match(REGEXP_FONT_FORMAT_VALUE);
			let fontFormat;
			if (fontFormatMatch && fontFormatMatch[1]) {
				fontFormat = fontFormatMatch[1].replace(REGEXP_SIMPLE_QUOTES_STRING, "$1").replace(REGEXP_DOUBLE_QUOTES_STRING, "$1").toLowerCase();
			}
			if (!fontFormat) {
				const fontFormatMatch = fontSrc.match(REGEXP_URL_FUNCTION_WOFF);
				if (fontFormatMatch && fontFormatMatch[1]) {
					fontFormat = fontFormatMatch[1];
				} else {
					const fontFormatMatch = fontSrc.match(REGEXP_URL_FUNCTION_WOFF_ALT);
					if (fontFormatMatch && fontFormatMatch[1]) {
						fontFormat = fontFormatMatch[1];
					}
				}
			}
			if (!fontFormat) {
				const urlMatch = fontSrc.match(REGEXP_URL_SIMPLE_QUOTES_FN) ||
					fontSrc.match(REGEXP_URL_DOUBLE_QUOTES_FN) ||
					fontSrc.match(REGEXP_URL_NO_QUOTES_FN);
				const fontUrl = urlMatch && urlMatch[1];
				if (fontUrl) {
					const fontFormatMatch = fontUrl.match(REGEXP_FONT_FORMAT);
					if (fontFormatMatch && fontFormatMatch[1]) {
						fontFormat = fontFormatMatch[1];
					}
				}
			}
			return { src: fontSrc.match(REGEXP_FONT_SRC)[1], format: fontFormat };
		});
		const fontTest = (fontSource, format) => fontSource.format == format;
		const woff2FontFound = fontSources.find(fontSource => fontTest(fontSource, "woff2"));
		const woffFontFound = fontSources.find(fontSource => fontTest(fontSource, "woff"));
		stats.fonts.processed += fontSources.length;
		if (woffFontFound || woff2FontFound) {
			fontSources = fontSources.filter(fontSource => woff2FontFound ? fontTest(fontSource, "woff2") : fontTest(fontSource, "woff"));
		} else {
			const otfFontFound = fontSources.find(fontSource => fontTest(fontSource, "otf"));
			const ttfFontFound = fontSources.find(fontSource => fontTest(fontSource, "ttf"));
			if (otfFontFound || ttfFontFound) {
				fontSources = fontSources.filter(fontSource => otfFontFound ? fontTest(fontSource, "otf") : fontTest(fontSource, "ttf"));
			}
		}
		stats.fonts.processed += stats.fonts.processed - fontSources.length;
		const cssStyles = [];
		Array.from(rule.style).forEach(propertyName => {
			if (propertyName == "src") {
				cssStyles.push("src:" + fontSources.map(fontSource => fontSource.src).join(","));
			} else {
				cssStyles.push(propertyName + ":" + rule.style.getPropertyValue(propertyName));
			}
		});
		return "@font-face{" + cssStyles.join(";") + "}";
	}

	function deleteUnusedFonts(doc, rules, unusedFonts) {
		let stylesheetContent = "";
		if (rules) {
			Array.from(rules).forEach(rule => {
				const fontFamilyName = rule.style && rule.style.getPropertyValue("font-family");
				if (rule.media) {
					stylesheetContent += "@media " + Array.prototype.join.call(rule.media, ",") + "{";
					stylesheetContent += deleteUnusedFonts(doc, rule.cssRules, unusedFonts);
					stylesheetContent += "}";
				} else if (rule.type != CSSRule.FONT_FACE_RULE || (rule.type == CSSRule.FONT_FACE_RULE && rule.style && fontFamilyName && !unusedFonts.includes(getFontFamilyName(fontFamilyName)))) {
					stylesheetContent += rule.cssText;
				}
			});
		}
		return stylesheetContent;
	}

	function getFontFamilyName(fontFamilyName) {
		fontFamilyName = fontFamilyName.toLowerCase().trim();
		if (fontFamilyName.match(REGEXP_SIMPLE_QUOTES_STRING)) {
			fontFamilyName = fontFamilyName.replace(REGEXP_SIMPLE_QUOTES_STRING, "$1");
		} else {
			fontFamilyName = fontFamilyName.replace(REGEXP_DOUBLE_QUOTES_STRING, "$1");
		}
		return fontFamilyName.trim();
	}

})();