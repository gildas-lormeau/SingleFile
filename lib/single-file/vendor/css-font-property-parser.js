/*
 * The MIT License (MIT)
 * 
 * Copyright (c) 2015 Jed Mao
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// derived from https://github.com/jedmao/parse-css-font/

this.fontPropertyParser = (() => {

	const REGEXP_SIMPLE_QUOTES_STRING = /^'(.*?)'$/;
	const REGEXP_DOUBLE_QUOTES_STRING = /^"(.*?)"$/;

	const globalKeywords = [
		"inherit",
		"initial",
		"unset"
	];

	const systemFontKeywords = [
		"caption",
		"icon",
		"menu",
		"message-box",
		"small-caption",
		"status-bar"
	];

	const fontWeightKeywords = [
		"normal",
		"bold",
		"bolder",
		"lighter",
		"100",
		"200",
		"300",
		"400",
		"500",
		"600",
		"700",
		"800",
		"900"
	];

	const fontStyleKeywords = [
		"normal",
		"italic",
		"oblique"
	];

	const fontStretchKeywords = [
		"normal",
		"condensed",
		"semi-condensed",
		"extra-condensed",
		"ultra-condensed",
		"expanded",
		"semi-expanded",
		"extra-expanded",
		"ultra-expanded"
	];

	const cssFontSizeKeywords = [
		"xx-small",
		"x-small",
		"small",
		"medium",
		"large",
		"x-large",
		"xx-large",
		"larger",
		"smaller"
	];

	const cssListHelpers = {
		splitBySpaces,
		split,
		splitByCommas
	};

	const helpers = {
		isSize
	};

	const errorPrefix = "[parse-css-font] ";

	return {
		parse(value) {
			if (typeof value !== "string") {
				throw new TypeError(errorPrefix + "Expected a string.");
			}
			if (value === "") {
				throw error("Cannot parse an empty string.");
			}
			if (systemFontKeywords.indexOf(value) !== -1) {
				return { system: value };
			}

			const font = {
				lineHeight: "normal",
				stretch: "normal",
				style: "normal",
				variant: "normal",
				weight: "normal",
			};

			let isLocked = false;
			const tokens = cssListHelpers.splitBySpaces(value);
			let token = tokens.shift();
			for (; token; token = tokens.shift()) {

				if (token === "normal" || globalKeywords.indexOf(token) !== -1) {
					["style", "variant", "weight", "stretch"].forEach((prop) => {
						font[prop] = token;
					});
					isLocked = true;
					continue;
				}

				if (fontWeightKeywords.indexOf(token) !== -1) {
					if (isLocked) {
						continue;
					}
					font.weight = token;
					continue;
				}

				if (fontStyleKeywords.indexOf(token) !== -1) {
					if (isLocked) {
						continue;
					}
					font.style = token;
					continue;
				}

				if (fontStretchKeywords.indexOf(token) !== -1) {
					if (isLocked) {
						continue;
					}
					font.stretch = token;
					continue;
				}

				if (helpers.isSize(token)) {
					const parts = cssListHelpers.split(token, ["/"]);
					font.size = parts[0];
					if (parts[1]) {
						font.lineHeight = parseLineHeight(parts[1]);
					} else if (tokens[0] === "/") {
						tokens.shift();
						font.lineHeight = parseLineHeight(tokens.shift());
					}
					if (!tokens.length) {
						throw error("Missing required font-family.");
					}
					font.family = cssListHelpers.splitByCommas(tokens.join(" ")).map(removeQuotes);
					return font;
				}

				if (font.variant !== "normal") {
					throw error("Unknown or unsupported font token: " + font.variant);
				}

				if (isLocked) {
					continue;
				}
				font.variant = token;
			}

			throw error("Missing required font-size.");
		}
	};

	function error(message) {
		return new Error(errorPrefix + message);
	}

	function parseLineHeight(value) {
		const parsed = parseFloat(value);
		if (parsed.toString() === value) {
			return parsed;
		}
		return value;
	}

	/**
	 * Splits a CSS declaration value (shorthand) using provided separators
	 * as the delimiters.
	 */
	function split(
		/**
		 * A CSS declaration value (shorthand).
		 */
		value,
		/**
		 * Any number of separator characters used for splitting.
		 */
		separators,
		{
			last = false,
		} = {},
	) {
		if (typeof value !== "string") {
			throw new TypeError("expected a string");
		}
		if (!Array.isArray(separators)) {
			throw new TypeError("expected a string array of separators");
		}
		if (typeof last !== "boolean") {
			throw new TypeError("expected a Boolean value for options.last");
		}
		const array = [];
		let current = "";
		let splitMe = false;

		let func = 0;
		let quote = false;
		let escape = false;

		for (const char of value) {

			if (quote) {
				if (escape) {
					escape = false;
				} else if (char === "\\") {
					escape = true;
				} else if (char === quote) {
					quote = false;
				}
			} else if (char === "\"" || char === "'") {
				quote = char;
			} else if (char === "(") {
				func += 1;
			} else if (char === ")") {
				if (func > 0) {
					func -= 1;
				}
			} else if (func === 0) {
				if (separators.indexOf(char) !== -1) {
					splitMe = true;
				}
			}

			if (splitMe) {
				if (current !== "") {
					array.push(current.trim());
				}
				current = "";
				splitMe = false;
			} else {
				current += char;
			}
		}

		if (last || current !== "") {
			array.push(current.trim());
		}
		return array;
	}

	/**
	 * Splits a CSS declaration value (shorthand) using whitespace characters
	 * as the delimiters.
	 */
	function splitBySpaces(
		/**
		 * A CSS declaration value (shorthand).
		 */
		value,
	) {
		const spaces = [" ", "\n", "\t"];
		return split(value, spaces);
	}

	/**
	 * Splits a CSS declaration value (shorthand) using commas as the delimiters.
	 */
	function splitByCommas(
		/**
		 * A CSS declaration value (shorthand).
		 */
		value,
	) {
		const comma = ",";
		return split(value, [comma], { last: true });
	}

	function isSize(value) {
		return !isNaN(parseFloat(value))
			|| value.indexOf("/") !== -1
			|| cssFontSizeKeywords.indexOf(value) !== -1;
	}

	function removeQuotes(string) {
		if (string.match(REGEXP_SIMPLE_QUOTES_STRING)) {
			string = string.replace(REGEXP_SIMPLE_QUOTES_STRING, "$1");
		} else {
			string = string.replace(REGEXP_DOUBLE_QUOTES_STRING, "$1");
		}
		return string.trim();
	}

})();