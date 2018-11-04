/*
 * Copyright (c) Felix Böhm
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * 
 * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * 
 * THIS IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS,
 * EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

// Modified by Gildas Lormeau

/* global CSS */

this.cssWhat = this.cssWhat || (() => {
	"use strict";


	/*! https://mths.be/cssescape v1.5.1 by @mathias | MIT license */
	(function (root) {

		if (root.CSS && root.CSS.escape) {
			return root.CSS.escape;
		}

		// https://drafts.csswg.org/cssom/#serialize-an-identifier
		var cssEscape = function (value) {
			if (arguments.length == 0) {
				throw new TypeError("`CSS.escape` requires an argument.");
			}
			var string = String(value);
			var length = string.length;
			var index = -1;
			var codeUnit;
			var result = "";
			var firstCodeUnit = string.charCodeAt(0);
			while (++index < length) {
				codeUnit = string.charCodeAt(index);
				// Note: there’s no need to special-case astral symbols, surrogate
				// pairs, or lone surrogates.

				// If the character is NULL (U+0000), then the REPLACEMENT CHARACTER
				// (U+FFFD).
				if (codeUnit == 0x0000) {
					result += "\uFFFD";
					continue;
				}

				if (
					// If the character is in the range [\1-\1F] (U+0001 to U+001F) or is
					// U+007F, […]
					(codeUnit >= 0x0001 && codeUnit <= 0x001F) || codeUnit == 0x007F ||
					// If the character is the first character and is in the range [0-9]
					// (U+0030 to U+0039), […]
					(index == 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
					// If the character is the second character and is in the range [0-9]
					// (U+0030 to U+0039) and the first character is a `-` (U+002D), […]
					(
						index == 1 &&
						codeUnit >= 0x0030 && codeUnit <= 0x0039 &&
						firstCodeUnit == 0x002D
					)
				) {
					// https://drafts.csswg.org/cssom/#escape-a-character-as-code-point
					result += "\\" + codeUnit.toString(16) + " ";
					continue;
				}

				if (
					// If the character is the first character and is a `-` (U+002D), and
					// there is no second character, […]
					index == 0 &&
					length == 1 &&
					codeUnit == 0x002D
				) {
					result += "\\" + string.charAt(index);
					continue;
				}

				// If the character is not handled by one of the above rules and is
				// greater than or equal to U+0080, is `-` (U+002D) or `_` (U+005F), or
				// is in one of the ranges [0-9] (U+0030 to U+0039), [A-Z] (U+0041 to
				// U+005A), or [a-z] (U+0061 to U+007A), […]
				if (
					codeUnit >= 0x0080 ||
					codeUnit == 0x002D ||
					codeUnit == 0x005F ||
					codeUnit >= 0x0030 && codeUnit <= 0x0039 ||
					codeUnit >= 0x0041 && codeUnit <= 0x005A ||
					codeUnit >= 0x0061 && codeUnit <= 0x007A
				) {
					// the character itself
					result += string.charAt(index);
					continue;
				}

				// Otherwise, the escaped character.
				// https://drafts.csswg.org/cssom/#escape-a-character
				result += "\\" + string.charAt(index);

			}
			return result;
		};

		if (!root.CSS) {
			root.CSS = {};
		}

		root.CSS.escape = cssEscape;
		return cssEscape;

	})(this);

	const re_name = /^(?:\\.|[\w\-\u00c0-\uFFFF])+/,
		re_escape = /\\([\da-f]{1,6}\s?|(\s)|.)/ig,
		//modified version of https://github.com/jquery/sizzle/blob/master/src/sizzle.js#L87
		re_attr = /^\s*((?:\\.|[\w\u00c0-\uFFFF-])+)\s*(?:(\S?)=\s*(?:(['"])([^]*?)\3|(#?(?:\\.|[\w\u00c0-\uFFFF-])*)|)|)\s*(i)?\]/;
	const actionTypes = {
		__proto__: null,
		"undefined": "exists",
		"": "equals",
		"~": "element",
		"^": "start",
		"$": "end",
		"*": "any",
		"!": "not",
		"|": "hyphen"
	};
	const simpleSelectors = {
		__proto__: null,
		">": "child",
		"~": "sibling",
		"+": "adjacent"
	};
	const attribSelectors = {
		__proto__: null,
		"#": ["id", "equals"],
		".": ["class", "element"]
	};
	//pseudos, whose data-property is parsed as well
	const unpackPseudos = {
		__proto__: null,
		"has": true,
		"not": true,
		"matches": true
	};
	const stripQuotesFromPseudos = {
		__proto__: null,
		"contains": true,
		"icontains": true
	};
	const quotes = {
		__proto__: null,
		"\"": true,
		"'": true
	};
	const pseudoElements = [
		"after", "before", "cue", "first-letter", "first-line", "selection", "slotted"
	];
	const stringify = (() => {
		const actionTypes = {
			"equals": "",
			"element": "~",
			"start": "^",
			"end": "$",
			"any": "*",
			"not": "!",
			"hyphen": "|"
		};
		const simpleSelectors = {
			__proto__: null,
			child: " > ",
			sibling: " ~ ",
			adjacent: " + ",
			descendant: " ",
			universal: "*"
		};
		function stringify(token) {
			let value = "";
			token.forEach(token => value += stringifySubselector(token) + ",");
			return value.substring(0, value.length - 1);
		}
		function stringifySubselector(token) {
			let value = "";
			token.forEach(token => value += stringifyToken(token));
			return value;
		}
		function stringifyToken(token) {
			if (token.type in simpleSelectors) return simpleSelectors[token.type];
			if (token.type == "tag") return escapeName(token.name);
			if (token.type == "attribute") {
				if (token.action == "exists") return "[" + escapeName(token.name) + "]";
				if (token.expandedSelector && token.name == "id" && token.action == "equals" && !token.ignoreCase) return "#" + escapeName(token.value);
				if (token.expandedSelector && token.name == "class" && token.action == "element" && !token.ignoreCase) return "." + escapeName(token.value);
				return "[" +
					escapeName(token.name) + actionTypes[token.action] + "=\"" +
					escapeName(token.value) + "\"" + (token.ignoreCase ? "i" : "") + "]";
			}
			if (token.type == "pseudo") {
				if (token.data == null) return ":" + escapeName(token.name);
				if (typeof token.data == "string") return ":" + escapeName(token.name) + "(" + token.data + ")";
				return ":" + escapeName(token.name) + "(" + stringify(token.data) + ")";
			}
			if (token.type == "pseudo-element") {
				return "::" + escapeName(token.name);
			}
		}
		function escapeName(str) {
			return CSS.escape(str);
		}
		return stringify;
	})();

	return {
		parse,
		stringify
	};

	// unescape function taken from https://github.com/jquery/sizzle/blob/master/src/sizzle.js#L139
	function funescape(_, escaped, escapedWhitespace) {
		const high = "0x" + escaped - 0x10000;
		// NaN means non-codepoint
		// Support: Firefox
		// Workaround erroneous numeric interpretation of +"0x"
		return high != high || escapedWhitespace ?
			escaped :
			// BMP codepoint
			high < 0 ?
				String.fromCharCode(high + 0x10000) :
				// Supplemental Plane codepoint (surrogate pair)
				String.fromCharCode(high >> 10 | 0xD800, high & 0x3FF | 0xDC00);
	}

	function unescapeCSS(str) {
		return str.replace(re_escape, funescape);
	}

	function isWhitespace(c) {
		return c == " " || c == "\n" || c == "\t" || c == "\f" || c == "\r";
	}

	function parse(selector, options) {
		const subselects = [];
		selector = parseSelector(subselects, selector + "", options);
		if (selector != "") {
			throw new SyntaxError("Unmatched selector: " + selector);
		}
		return subselects;
	}

	function parseSelector(subselects, selector, options) {
		let tokens = [], sawWS = false, data, firstChar, name, quot;
		stripWhitespace(0);
		while (selector != "") {
			firstChar = selector.charAt(0);
			if (isWhitespace(firstChar)) {
				sawWS = true;
				stripWhitespace(1);
			} else if (firstChar in simpleSelectors) {
				tokens.push({ type: simpleSelectors[firstChar] });
				sawWS = false;
				stripWhitespace(1);
			} else if (firstChar == ",") {
				if (tokens.length == 0) {
					throw new SyntaxError("empty sub-selector");
				}
				subselects.push(tokens);
				tokens = [];
				sawWS = false;
				stripWhitespace(1);
			} else {
				if (sawWS) {
					if (tokens.length > 0) {
						tokens.push({ type: "descendant" });
					}
					sawWS = false;
				}
				if (firstChar == "*") {
					selector = selector.substr(1);
					tokens.push({ type: "universal" });
				} else if (firstChar in attribSelectors) {
					selector = selector.substr(1);
					tokens.push({
						expandedSelector: true,
						type: "attribute",
						name: attribSelectors[firstChar][0],
						action: attribSelectors[firstChar][1],
						value: getName(),
						ignoreCase: false
					});
				} else if (firstChar == "[") {
					selector = selector.substr(1);
					data = selector.match(re_attr);
					if (!data) {
						throw new SyntaxError("Malformed attribute selector: " + selector);
					}
					selector = selector.substr(data[0].length);
					name = unescapeCSS(data[1]);
					if (
						!options || (
							"lowerCaseAttributeNames" in options ?
								options.lowerCaseAttributeNames :
								!options.xmlMode
						)
					) {
						name = name.toLowerCase();
					}
					tokens.push({
						type: "attribute",
						name: name,
						action: actionTypes[data[2]],
						value: unescapeCSS(data[4] || data[5] || ""),
						ignoreCase: !!data[6]
					});
				} else if (firstChar == ":") {
					if (selector.charAt(1) == ":") {
						selector = selector.substr(2);
						tokens.push({ type: "pseudo-element", name: getName().toLowerCase() });
						continue;
					}
					selector = selector.substr(1);
					name = getName().toLowerCase();
					data = null;
					if (selector.charAt(0) == "(") {
						if (name in unpackPseudos) {
							quot = selector.charAt(1);
							const quoted = quot in quotes;
							selector = selector.substr(quoted + 1);
							data = [];
							selector = parseSelector(data, selector, options);
							if (quoted) {
								if (selector.charAt(0) != quot) {
									throw new SyntaxError("unmatched quotes in :" + name);
								} else {
									selector = selector.substr(1);
								}
							}
							if (selector.charAt(0) != ")") {
								throw new SyntaxError("missing closing parenthesis in :" + name + " " + selector);
							}
							selector = selector.substr(1);
						} else {
							let pos = 1, counter = 1;
							for (; counter > 0 && pos < selector.length; pos++) {
								if (selector.charAt(pos) == "(" && !isEscaped(pos)) counter++;
								else if (selector.charAt(pos) == ")" && !isEscaped(pos)) counter--;
							}
							if (counter) {
								throw new SyntaxError("parenthesis not matched");
							}
							data = selector.substr(1, pos - 2);
							selector = selector.substr(pos);
							if (name in stripQuotesFromPseudos) {
								quot = data.charAt(0);
								if (quot == data.slice(-1) && quot in quotes) {
									data = data.slice(1, -1);
								}
								data = unescapeCSS(data);
							}
						}
					}
					tokens.push({ type: pseudoElements.indexOf(name) == -1 ? "pseudo" : "pseudo-element", name: name, data: data });
				} else if (re_name.test(selector)) {
					name = getName();
					if (!options || ("lowerCaseTags" in options ? options.lowerCaseTags : !options.xmlMode)) {
						name = name.toLowerCase();
					}
					tokens.push({ type: "tag", name: name });
				} else {
					if (tokens.length && tokens[tokens.length - 1].type == "descendant") {
						tokens.pop();
					}
					addToken(subselects, tokens);
					return selector;
				}
			}
		}
		addToken(subselects, tokens);
		return selector;

		function getName() {
			const sub = selector.match(re_name)[0];
			selector = selector.substr(sub.length);
			return unescapeCSS(sub);
		}

		function stripWhitespace(start) {
			while (isWhitespace(selector.charAt(start))) start++;
			selector = selector.substr(start);
		}

		function isEscaped(pos) {
			let slashCount = 0;
			while (selector.charAt(--pos) == "\\") slashCount++;
			return (slashCount & 1) == 1;
		}
	}

	function addToken(subselects, tokens) {
		if (subselects.length > 0 && tokens.length == 0) {
			throw new SyntaxError("empty sub-selector");
		}
		subselects.push(tokens);
	}

})();