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

this.fontsAltMinifier = this.fontsAltMinifier || (() => {

	const REGEXP_URL_SIMPLE_QUOTES_FN = /url\s*\(\s*'(.*?)'\s*\)/i;
	const REGEXP_URL_DOUBLE_QUOTES_FN = /url\s*\(\s*"(.*?)"\s*\)/i;
	const REGEXP_URL_NO_QUOTES_FN = /url\s*\(\s*(.*?)\s*\)/i;
	const REGEXP_URL_FUNCTION = /(url|local)\(.*?\)\s*(,|$)/g;
	const REGEXP_SIMPLE_QUOTES_STRING = /^'(.*?)'$/;
	const REGEXP_DOUBLE_QUOTES_STRING = /^"(.*?)"$/;
	const REGEXP_URL_FUNCTION_WOFF = /^url\(\s*["']?data:font\/(woff2?)/;
	const REGEXP_URL_FUNCTION_WOFF_ALT = /^url\(\s*["']?data:application\/x-font-(woff)/;
	const REGEXP_FONT_FORMAT = /\.([^.?#]+)((\?|#).*?)?$/;
	const REGEXP_FONT_FORMAT_VALUE = /format\((.*?)\)\s*,?$/;
	const REGEXP_FONT_SRC = /(.*?)\s*,?$/;
	const EMPTY_URL_SOURCE = "url(\"data:base64,\")";
	const LOCAL_SOURCE = "local(";
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
		process: (doc, stylesheets) => {
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

	function processFontFaceRules(cssRules, fontsDetails, media, stats) {
		const removedRules = [];
		for (let cssRule = cssRules.head; cssRule; cssRule = cssRule.next) {
			const ruleData = cssRule.data;
			if (ruleData.type == "Atrule" && ruleData.name == "media" && ruleData.block && ruleData.prelude && ruleData.prelude.children) {
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