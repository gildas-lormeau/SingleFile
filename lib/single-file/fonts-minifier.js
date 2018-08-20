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

	return {
		process: (doc, removeUnusedCSSRules, secondPass) => {
			const declaredFonts = new Set();
			const usedFonts = new Set();
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
					style.textContent = processRules(doc, style.sheet.cssRules, declaredFonts, usedFonts, removeUnusedCSSRules, stats, secondPass);
					stats.rules.discarded += processedRules - style.sheet.cssRules.length;
				}
			});
			if (removeUnusedCSSRules) {
				doc.querySelectorAll("[style]").forEach(element => {
					if (element.style.fontFamily) {
						element.style.fontFamily.split(",").forEach(fontFamilyName => usedFonts.add(getFontFamilyName(fontFamilyName)));
					}
				});
				const unusedFonts = Array.from(declaredFonts).filter(fontFamilyName => !usedFonts.has(fontFamilyName));
				doc.querySelectorAll("style").forEach(style => {
					if (style.sheet) {
						const processedRules = style.sheet.cssRules.length;
						style.textContent = deleteUnusedFonts(doc, style.sheet.cssRules, unusedFonts);
						stats.rules.discarded += processedRules - style.sheet.cssRules.length;
					}
				});
			}
			return stats;
		}
	};

	function processRules(doc, rules, declaredFonts, usedFonts, removeUnusedCSSRules, stats, secondPass) {
		let stylesheetContent = "";
		if (rules) {
			Array.from(rules).forEach(rule => {
				if (rule.type == CSSRule.MEDIA_RULE) {
					stylesheetContent += "@media " + Array.prototype.join.call(rule.media, ",") + " {";
					stylesheetContent += processRules(doc, rule.cssRules, declaredFonts, usedFonts, removeUnusedCSSRules, stats, secondPass);
					stylesheetContent += "}";
				} else if (removeUnusedCSSRules && rule.type == CSSRule.STYLE_RULE) {
					if (rule.style && rule.style.fontFamily) {
						rule.style.fontFamily.split(",").forEach(fontFamilyName => usedFonts.add(getFontFamilyName(fontFamilyName)));
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
							const fontSources = src.match(/url\(.*?\)\s*(,|$)/g);
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
			const unicodeRanges = unicodeRange.split(/\s*,\s*/);
			const result = unicodeRanges.filter(rangeValue => {
				const range = rangeValue.split(/-/);
				if (range.length == 2) {
					range[0] = transformRange(range[0]);
					const regExpString = "[" + range[0] + "-\\u" + range[1] + "]";
					return (new RegExp(regExpString)).test(docContent);
				}
				if (range.length == 1) {
					if (range[0].includes("?")) {
						const firstRange = transformRange(range[0]);
						const secondRange = firstRange;
						const regExpString = "[" + firstRange.replace(/\?/g, "0") + "-" + secondRange.replace(/\?/g, "F") + "]";
						return (new RegExp(regExpString)).test(docContent);

					} else {
						const regExpString = "[" + transformRange(range[0]) + "]";
						return (new RegExp(regExpString)).test(docContent);
					}
				}
				return true;
			});
			return result.length;
		}
		return true;
	}

	function transformRange(range) {
		return range.replace(/^U\+/i, "\\u");
	}

	function processFontFaceRule(rule, fontSources, stats) {
		fontSources = fontSources.map(fontSrc => {
			const fontFormatMatch = fontSrc.match(/format\((.*?)\)\s*,?$/);
			let fontFormat;
			if (fontFormatMatch && fontFormatMatch[1]) {
				fontFormat = fontFormatMatch[1].replace(/^'(.*?)'$/, "$1").replace(/^"(.*?)"$/, "$1").toLowerCase();
			}
			if (!fontFormat) {
				const fontFormatMatch = fontSrc.match(/^url\(\s*["']?data:font\/(woff2?)/);
				if (fontFormatMatch && fontFormatMatch[1]) {
					fontFormat = fontFormatMatch[1];
				} else {
					const fontFormatMatch = fontSrc.match(/^url\(\s*["']?data:application\/x-font-(woff)/);
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
					const fontFormatMatch = fontUrl.match(/\.([^.?#]+)((\?|#).*?)?$/);
					if (fontFormatMatch && fontFormatMatch[1]) {
						fontFormat = fontFormatMatch[1];
					}
				}
			}
			return { src: fontSrc.match(/(.*?)\s*,?$/)[1], format: fontFormat };
		});
		const fontTest = (fontSource, format) => fontSource.format == format;
		const woff2FontFound = fontSources.find(fontSource => fontTest(fontSource, "woff2"));
		const woffFontFound = fontSources.find(fontSource => fontTest(fontSource, "woff"));
		stats.fonts.processed += fontSources.length;
		if (woffFontFound || woff2FontFound) {
			fontSources = fontSources.filter(fontSource => woff2FontFound ? fontTest(fontSource, "woff2") : fontTest(fontSource, "woff"));
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
		return "@font-face {" + cssStyles.join(";") + "}";
	}

	function deleteUnusedFonts(doc, rules, unusedFonts) {
		let stylesheetContent = "";
		if (rules) {
			Array.from(rules).forEach(rule => {
				const fontFamilyName = rule.style && rule.style.getPropertyValue("font-family");
				if (rule.media) {
					stylesheetContent += "@media " + Array.prototype.join.call(rule.media, ",") + " {";
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
		if (fontFamilyName.match(/^'(.*)'$/)) {
			fontFamilyName = fontFamilyName.replace(/^'(.*)'$/, "$1");
		} else {
			fontFamilyName = fontFamilyName.replace(/^"(.*)"$/, "$1");
		}
		return fontFamilyName.trim();
	}

})();