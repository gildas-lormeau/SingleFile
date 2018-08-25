/*
 * The code in this file is licensed under the CC0 license.
 *
 * http://creativecommons.org/publicdomain/zero/1.0/
 *
 * It is free to use for any purpose. No attribution, permission, or reproduction of this license is require
 */

// Modified by Gildas Lormeau (ES5 -> ES6)

// https://github.com/tabatkins/parse-css
this.parseCss = this.parseCss || (() => {

	function between(num, first, last) { return num >= first && num <= last; }
	function digit(code) { return between(code, 0x30, 0x39); }
	function hexdigit(code) { return digit(code) || between(code, 0x41, 0x46) || between(code, 0x61, 0x66); }
	function uppercaseletter(code) { return between(code, 0x41, 0x5a); }
	function lowercaseletter(code) { return between(code, 0x61, 0x7a); }
	function letter(code) { return uppercaseletter(code) || lowercaseletter(code); }
	function nonascii(code) { return code >= 0x80; }
	function namestartchar(code) { return letter(code) || nonascii(code) || code == 0x5f; }
	function namechar(code) { return namestartchar(code) || digit(code) || code == 0x2d; }
	function nonprintable(code) { return between(code, 0, 8) || code == 0xb || between(code, 0xe, 0x1f) || code == 0x7f; }
	function newline(code) { return code == 0xa; }
	function whitespace(code) { return newline(code) || code == 9 || code == 0x20; }
	// function badescape(code) { return newline(code) || isNaN(code); }

	const maximumallowedcodepoint = 0x10ffff;

	const InvalidCharacterError = function (message) {
		this.message = message;
	};
	InvalidCharacterError.prototype = new Error;
	InvalidCharacterError.prototype.name = "InvalidCharacterError";

	function preprocess(str) {
		// Turn a string into an array of code points,
		// following the preprocessing cleanup rules.
		const codepoints = [];
		for (let i = 0; i < str.length; i++) {
			let code = str.charCodeAt(i);
			if (code == 0xd && str.charCodeAt(i + 1) == 0xa) {
				code = 0xa; i++;
			}
			if (code == 0xd || code == 0xc) code = 0xa;
			if (code == 0x0) code = 0xfffd;
			if (between(code, 0xd800, 0xdbff) && between(str.charCodeAt(i + 1), 0xdc00, 0xdfff)) {
				// Decode a surrogate pair into an astral codepoint.
				const lead = code - 0xd800;
				const trail = str.charCodeAt(i + 1) - 0xdc00;
				code = Math.pow(2, 20) + lead * Math.pow(2, 10) + trail;
				i++;
			}
			codepoints.push(code);
		}
		return codepoints;
	}

	function stringFromCode(code) {
		if (code <= 0xffff) return String.fromCharCode(code);
		// Otherwise, encode astral char as surrogate pair.
		code -= Math.pow(2, 20);
		const lead = Math.floor(code / Math.pow(2, 10)) + 0xd800;
		const trail = code % Math.pow(2, 10) + 0xdc00;
		return String.fromCharCode(lead) + String.fromCharCode(trail);
	}

	function tokenize(str) {
		str = preprocess(str);
		let i = -1;
		const tokens = [];
		let code;

		// Line number information.
		let line = 0;
		let column = 0;
		// The only use of lastLineLength is in reconsume().
		let lastLineLength = 0;
		const incrLineno = function () {
			line += 1;
			lastLineLength = column;
			column = 0;
		};
		const locStart = { line: line, column: column };

		const codepoint = function (i) {
			if (i >= str.length) {
				return -1;
			}
			return str[i];
		};
		const next = function (num) {
			if (num === undefined)
				num = 1;
			if (num > 3)
				throw "Spec Error: no more than three codepoints of lookahead.";
			return codepoint(i + num);
		};
		const consume = function (num) {
			if (num === undefined)
				num = 1;
			i += num;
			code = codepoint(i);
			if (newline(code)) incrLineno();
			else column += num;
			//console.log('Consume '+i+' '+String.fromCharCode(code) + ' 0x' + code.toString(16));
			return true;
		};
		const reconsume = function () {
			i -= 1;
			if (newline(code)) {
				line -= 1;
				column = lastLineLength;
			} else {
				column -= 1;
			}
			locStart.line = line;
			locStart.column = column;
			return true;
		};
		const eof = function (codepoint) {
			if (codepoint === undefined) codepoint = code;
			return codepoint == -1;
		};
		const donothing = function () { };
		const parseerror = function () { throw new Error("Parse error at index " + i + ", processing codepoint 0x" + code.toString(16) + "."); };

		const consumeAToken = function () {
			consumeComments();
			consume();
			if (whitespace(code)) {
				while (whitespace(next())) consume();
				return new WhitespaceToken;
			}
			else if (code == 0x22) return consumeAStringToken();
			else if (code == 0x23) {
				if (namechar(next()) || areAValidEscape(next(1), next(2))) {
					const token = new HashToken();
					if (wouldStartAnIdentifier(next(1), next(2), next(3))) token.type = "id";
					token.value = consumeAName();
					return token;
				} else {
					return new DelimToken(code);
				}
			}
			else if (code == 0x24) {
				if (next() == 0x3d) {
					consume();
					return new SuffixMatchToken();
				} else {
					return new DelimToken(code);
				}
			}
			else if (code == 0x27) return consumeAStringToken();
			else if (code == 0x28) return new OpenParenToken();
			else if (code == 0x29) return new CloseParenToken();
			else if (code == 0x2a) {
				if (next() == 0x3d) {
					consume();
					return new SubstringMatchToken();
				} else {
					return new DelimToken(code);
				}
			}
			else if (code == 0x2b) {
				if (startsWithANumber()) {
					reconsume();
					return consumeANumericToken();
				} else {
					return new DelimToken(code);
				}
			}
			else if (code == 0x2c) return new CommaToken();
			else if (code == 0x2d) {
				if (startsWithANumber()) {
					reconsume();
					return consumeANumericToken();
				} else if (next(1) == 0x2d && next(2) == 0x3e) {
					consume(2);
					return new CDCToken();
				} else if (startsWithAnIdentifier()) {
					reconsume();
					return consumeAnIdentlikeToken();
				} else {
					return new DelimToken(code);
				}
			}
			else if (code == 0x2e) {
				if (startsWithANumber()) {
					reconsume();
					return consumeANumericToken();
				} else {
					return new DelimToken(code);
				}
			}
			else if (code == 0x3a) return new ColonToken;
			else if (code == 0x3b) return new SemicolonToken;
			else if (code == 0x3c) {
				if (next(1) == 0x21 && next(2) == 0x2d && next(3) == 0x2d) {
					consume(3);
					return new CDOToken();
				} else {
					return new DelimToken(code);
				}
			}
			else if (code == 0x40) {
				if (wouldStartAnIdentifier(next(1), next(2), next(3))) {
					return new AtKeywordToken(consumeAName());
				} else {
					return new DelimToken(code);
				}
			}
			else if (code == 0x5b) return new OpenSquareToken();
			else if (code == 0x5c) {
				if (startsWithAValidEscape()) {
					reconsume();
					return consumeAnIdentlikeToken();
				} else {
					parseerror();
					return new DelimToken(code);
				}
			}
			else if (code == 0x5d) return new CloseSquareToken();
			else if (code == 0x5e) {
				if (next() == 0x3d) {
					consume();
					return new PrefixMatchToken();
				} else {
					return new DelimToken(code);
				}
			}
			else if (code == 0x7b) return new OpenCurlyToken();
			else if (code == 0x7c) {
				if (next() == 0x3d) {
					consume();
					return new DashMatchToken();
				} else if (next() == 0x7c) {
					consume();
					return new ColumnToken();
				} else {
					return new DelimToken(code);
				}
			}
			else if (code == 0x7d) return new CloseCurlyToken();
			else if (code == 0x7e) {
				if (next() == 0x3d) {
					consume();
					return new IncludeMatchToken();
				} else {
					return new DelimToken(code);
				}
			}
			else if (digit(code)) {
				reconsume();
				return consumeANumericToken();
			}
			else if (namestartchar(code)) {
				reconsume();
				return consumeAnIdentlikeToken();
			}
			else if (eof()) return new EOFToken();
			else return new DelimToken(code);
		};

		const consumeComments = function () {
			while (next(1) == 0x2f && next(2) == 0x2a) {
				consume(2);
				while (true) {
					consume();
					if (code == 0x2a && next() == 0x2f) {
						consume();
						break;
					} else if (eof()) {
						parseerror();
						return;
					}
				}
			}
		};

		const consumeANumericToken = function () {
			const num = consumeANumber();
			if (wouldStartAnIdentifier(next(1), next(2), next(3))) {
				const token = new DimensionToken();
				token.value = num.value;
				token.repr = num.repr;
				token.type = num.type;
				token.unit = consumeAName();
				return token;
			} else if (next() == 0x25) {
				consume();
				const token = new PercentageToken();
				token.value = num.value;
				token.repr = num.repr;
				return token;
			} else {
				const token = new NumberToken();
				token.value = num.value;
				token.repr = num.repr;
				token.type = num.type;
				return token;
			}
		};

		const consumeAnIdentlikeToken = function () {
			const str = consumeAName();
			if (str.toLowerCase() == "url" && next() == 0x28) {
				consume();
				while (whitespace(next(1)) && whitespace(next(2))) consume();
				if (next() == 0x22 || next() == 0x27) {
					return new FunctionToken(str);
				} else if (whitespace(next()) && (next(2) == 0x22 || next(2) == 0x27)) {
					return new FunctionToken(str);
				} else {
					return consumeAURLToken();
				}
			} else if (next() == 0x28) {
				consume();
				return new FunctionToken(str);
			} else {
				return new IdentToken(str);
			}
		};

		const consumeAStringToken = function (endingCodePoint) {
			if (endingCodePoint === undefined) endingCodePoint = code;
			let string = "";
			while (consume()) {
				if (code == endingCodePoint || eof()) {
					return new StringToken(string);
				} else if (newline(code)) {
					parseerror();
					reconsume();
					return new BadStringToken();
				} else if (code == 0x5c) {
					if (eof(next())) {
						donothing();
					} else if (newline(next())) {
						consume();
					} else {
						string += stringFromCode(consumeEscape());
					}
				} else {
					string += stringFromCode(code);
				}
			}
		};

		const consumeAURLToken = function () {
			const token = new URLToken("");
			while (whitespace(next())) consume();
			if (eof(next())) return token;
			while (consume()) {
				if (code == 0x29 || eof()) {
					return token;
				} else if (whitespace(code)) {
					while (whitespace(next())) consume();
					if (next() == 0x29 || eof(next())) {
						consume();
						return token;
					} else {
						consumeTheRemnantsOfABadURL();
						return new BadURLToken();
					}
				} else if (code == 0x22 || code == 0x27 || code == 0x28 || nonprintable(code)) {
					parseerror();
					consumeTheRemnantsOfABadURL();
					return new BadURLToken();
				} else if (code == 0x5c) {
					if (startsWithAValidEscape()) {
						token.value += stringFromCode(consumeEscape());
					} else {
						parseerror();
						consumeTheRemnantsOfABadURL();
						return new BadURLToken();
					}
				} else {
					token.value += stringFromCode(code);
				}
			}
		};

		const consumeEscape = function () {
			// Assume the the current character is the \
			// and the next code point is not a newline.
			consume();
			if (hexdigit(code)) {
				// Consume 1-6 hex digits
				const digits = [code];
				for (let total = 0; total < 5; total++) {
					if (hexdigit(next())) {
						consume();
						digits.push(code);
					} else {
						break;
					}
				}
				if (whitespace(next())) consume();
				let value = parseInt(digits.map(function (x) { return String.fromCharCode(x); }).join(""), 16);
				if (value > maximumallowedcodepoint) value = 0xfffd;
				return value;
			} else if (eof()) {
				return 0xfffd;
			} else {
				return code;
			}
		};

		const areAValidEscape = function (c1, c2) {
			if (c1 != 0x5c) return false;
			if (newline(c2)) return false;
			return true;
		};
		const startsWithAValidEscape = function () {
			return areAValidEscape(code, next());
		};

		const wouldStartAnIdentifier = function (c1, c2, c3) {
			if (c1 == 0x2d) {
				return namestartchar(c2) || c2 == 0x2d || areAValidEscape(c2, c3);
			} else if (namestartchar(c1)) {
				return true;
			} else if (c1 == 0x5c) {
				return areAValidEscape(c1, c2);
			} else {
				return false;
			}
		};
		const startsWithAnIdentifier = function () {
			return wouldStartAnIdentifier(code, next(1), next(2));
		};

		const wouldStartANumber = function (c1, c2, c3) {
			if (c1 == 0x2b || c1 == 0x2d) {
				if (digit(c2)) return true;
				if (c2 == 0x2e && digit(c3)) return true;
				return false;
			} else if (c1 == 0x2e) {
				if (digit(c2)) return true;
				return false;
			} else if (digit(c1)) {
				return true;
			} else {
				return false;
			}
		};
		const startsWithANumber = function () {
			return wouldStartANumber(code, next(1), next(2));
		};

		const consumeAName = function () {
			let result = "";
			while (consume()) {
				if (namechar(code)) {
					result += stringFromCode(code);
				} else if (startsWithAValidEscape()) {
					result += stringFromCode(consumeEscape());
				} else {
					reconsume();
					return result;
				}
			}
		};

		const consumeANumber = function () {
			let repr = [];
			let type = "integer";
			if (next() == 0x2b || next() == 0x2d) {
				consume();
				repr += stringFromCode(code);
			}
			while (digit(next())) {
				consume();
				repr += stringFromCode(code);
			}
			if (next(1) == 0x2e && digit(next(2))) {
				consume();
				repr += stringFromCode(code);
				consume();
				repr += stringFromCode(code);
				type = "number";
				while (digit(next())) {
					consume();
					repr += stringFromCode(code);
				}
			}
			const c1 = next(1), c2 = next(2), c3 = next(3);
			if ((c1 == 0x45 || c1 == 0x65) && digit(c2)) {
				consume();
				repr += stringFromCode(code);
				consume();
				repr += stringFromCode(code);
				type = "number";
				while (digit(next())) {
					consume();
					repr += stringFromCode(code);
				}
			} else if ((c1 == 0x45 || c1 == 0x65) && (c2 == 0x2b || c2 == 0x2d) && digit(c3)) {
				consume();
				repr += stringFromCode(code);
				consume();
				repr += stringFromCode(code);
				consume();
				repr += stringFromCode(code);
				type = "number";
				while (digit(next())) {
					consume();
					repr += stringFromCode(code);
				}
			}
			const value = convertAStringToANumber(repr);
			return { type: type, value: value, repr: repr };
		};

		const convertAStringToANumber = function (string) {
			// CSS's number rules are identical to JS, afaik.
			return +string;
		};

		const consumeTheRemnantsOfABadURL = function () {
			while (consume()) {
				if (code == 0x29 || eof()) {
					return;
				} else if (startsWithAValidEscape()) {
					consumeEscape();
					donothing();
				} else {
					donothing();
				}
			}
		};



		let iterationCount = 0;
		while (!eof(next())) {
			tokens.push(consumeAToken());
			iterationCount++;
			if (iterationCount > str.length * 2) return "I'm infinite-looping!";
		}
		return tokens;
	}

	function CSSParserToken() { throw "Abstract Base Class"; }
	CSSParserToken.prototype.toJSON = function () {
		return { token: this.tokenType };
	};
	CSSParserToken.prototype.toString = function () { return this.tokenType; };
	CSSParserToken.prototype.toSource = function () { return "" + this; };

	function BadStringToken() { return this; }
	BadStringToken.prototype = Object.create(CSSParserToken.prototype);
	BadStringToken.prototype.tokenType = "BADSTRING";

	function BadURLToken() { return this; }
	BadURLToken.prototype = Object.create(CSSParserToken.prototype);
	BadURLToken.prototype.tokenType = "BADURL";

	function WhitespaceToken() { return this; }
	WhitespaceToken.prototype = Object.create(CSSParserToken.prototype);
	WhitespaceToken.prototype.tokenType = "WHITESPACE";
	WhitespaceToken.prototype.toString = function () { return "WS"; };
	WhitespaceToken.prototype.toSource = function () { return " "; };

	function CDOToken() { return this; }
	CDOToken.prototype = Object.create(CSSParserToken.prototype);
	CDOToken.prototype.tokenType = "CDO";
	CDOToken.prototype.toSource = function () { return "<!--"; };

	function CDCToken() { return this; }
	CDCToken.prototype = Object.create(CSSParserToken.prototype);
	CDCToken.prototype.tokenType = "CDC";
	CDCToken.prototype.toSource = function () { return "-->"; };

	function ColonToken() { return this; }
	ColonToken.prototype = Object.create(CSSParserToken.prototype);
	ColonToken.prototype.tokenType = ":";

	function SemicolonToken() { return this; }
	SemicolonToken.prototype = Object.create(CSSParserToken.prototype);
	SemicolonToken.prototype.tokenType = ";";

	function CommaToken() { return this; }
	CommaToken.prototype = Object.create(CSSParserToken.prototype);
	CommaToken.prototype.tokenType = ",";

	function GroupingToken() { throw "Abstract Base Class"; }
	GroupingToken.prototype = Object.create(CSSParserToken.prototype);

	function OpenCurlyToken() { this.value = "{"; this.mirror = "}"; return this; }
	OpenCurlyToken.prototype = Object.create(GroupingToken.prototype);
	OpenCurlyToken.prototype.tokenType = "{";

	function CloseCurlyToken() { this.value = "}"; this.mirror = "{"; return this; }
	CloseCurlyToken.prototype = Object.create(GroupingToken.prototype);
	CloseCurlyToken.prototype.tokenType = "}";

	function OpenSquareToken() { this.value = "["; this.mirror = "]"; return this; }
	OpenSquareToken.prototype = Object.create(GroupingToken.prototype);
	OpenSquareToken.prototype.tokenType = "[";

	function CloseSquareToken() { this.value = "]"; this.mirror = "["; return this; }
	CloseSquareToken.prototype = Object.create(GroupingToken.prototype);
	CloseSquareToken.prototype.tokenType = "]";

	function OpenParenToken() { this.value = "("; this.mirror = ")"; return this; }
	OpenParenToken.prototype = Object.create(GroupingToken.prototype);
	OpenParenToken.prototype.tokenType = "(";

	function CloseParenToken() { this.value = ")"; this.mirror = "("; return this; }
	CloseParenToken.prototype = Object.create(GroupingToken.prototype);
	CloseParenToken.prototype.tokenType = ")";

	function IncludeMatchToken() { return this; }
	IncludeMatchToken.prototype = Object.create(CSSParserToken.prototype);
	IncludeMatchToken.prototype.tokenType = "~=";

	function DashMatchToken() { return this; }
	DashMatchToken.prototype = Object.create(CSSParserToken.prototype);
	DashMatchToken.prototype.tokenType = "|=";

	function PrefixMatchToken() { return this; }
	PrefixMatchToken.prototype = Object.create(CSSParserToken.prototype);
	PrefixMatchToken.prototype.tokenType = "^=";

	function SuffixMatchToken() { return this; }
	SuffixMatchToken.prototype = Object.create(CSSParserToken.prototype);
	SuffixMatchToken.prototype.tokenType = "$=";

	function SubstringMatchToken() { return this; }
	SubstringMatchToken.prototype = Object.create(CSSParserToken.prototype);
	SubstringMatchToken.prototype.tokenType = "*=";

	function ColumnToken() { return this; }
	ColumnToken.prototype = Object.create(CSSParserToken.prototype);
	ColumnToken.prototype.tokenType = "||";

	function EOFToken() { return this; }
	EOFToken.prototype = Object.create(CSSParserToken.prototype);
	EOFToken.prototype.tokenType = "EOF";
	EOFToken.prototype.toSource = function () { return ""; };

	function DelimToken(code) {
		this.value = stringFromCode(code);
		return this;
	}
	DelimToken.prototype = Object.create(CSSParserToken.prototype);
	DelimToken.prototype.tokenType = "DELIM";
	DelimToken.prototype.toString = function () { return "DELIM(" + this.value + ")"; };
	DelimToken.prototype.toJSON = function () {
		const json = this.constructor.prototype.constructor.prototype.toJSON.call(this);
		json.value = this.value;
		return json;
	};
	DelimToken.prototype.toSource = function () {
		if (this.value == "\\")
			return "\\\n";
		else
			return this.value;
	};

	function StringValuedToken() { throw "Abstract Base Class"; }
	StringValuedToken.prototype = Object.create(CSSParserToken.prototype);
	StringValuedToken.prototype.ASCIIMatch = function (str) {
		return this.value.toLowerCase() == str.toLowerCase();
	};
	StringValuedToken.prototype.toJSON = function () {
		const json = this.constructor.prototype.constructor.prototype.toJSON.call(this);
		json.value = this.value;
		return json;
	};

	function IdentToken(val) {
		this.value = val;
	}
	IdentToken.prototype = Object.create(StringValuedToken.prototype);
	IdentToken.prototype.tokenType = "IDENT";
	IdentToken.prototype.toString = function () { return "IDENT(" + this.value + ")"; };
	IdentToken.prototype.toSource = function () {
		return escapeIdent(this.value);
	};

	function FunctionToken(val) {
		this.value = val;
		this.mirror = ")";
	}
	FunctionToken.prototype = Object.create(StringValuedToken.prototype);
	FunctionToken.prototype.tokenType = "FUNCTION";
	FunctionToken.prototype.toString = function () { return "FUNCTION(" + this.value + ")"; };
	FunctionToken.prototype.toSource = function () {
		return escapeIdent(this.value) + "(";
	};

	function AtKeywordToken(val) {
		this.value = val;
	}
	AtKeywordToken.prototype = Object.create(StringValuedToken.prototype);
	AtKeywordToken.prototype.tokenType = "AT-KEYWORD";
	AtKeywordToken.prototype.toString = function () { return "AT(" + this.value + ")"; };
	AtKeywordToken.prototype.toSource = function () {
		return "@" + escapeIdent(this.value);
	};

	function HashToken(val) {
		this.value = val;
		this.type = "unrestricted";
	}
	HashToken.prototype = Object.create(StringValuedToken.prototype);
	HashToken.prototype.tokenType = "HASH";
	HashToken.prototype.toString = function () { return "HASH(" + this.value + ")"; };
	HashToken.prototype.toJSON = function () {
		const json = this.constructor.prototype.constructor.prototype.toJSON.call(this);
		json.value = this.value;
		json.type = this.type;
		return json;
	};
	HashToken.prototype.toSource = function () {
		if (this.type == "id") {
			return "#" + escapeIdent(this.value);
		} else {
			return "#" + escapeHash(this.value);
		}
	};

	function StringToken(val) {
		this.value = val;
	}
	StringToken.prototype = Object.create(StringValuedToken.prototype);
	StringToken.prototype.tokenType = "STRING";
	StringToken.prototype.toString = function () {
		return "\"" + escapeString(this.value) + "\"";
	};

	function URLToken(val) {
		this.value = val;
	}
	URLToken.prototype = Object.create(StringValuedToken.prototype);
	URLToken.prototype.tokenType = "URL";
	URLToken.prototype.toString = function () { return "URL(" + this.value + ")"; };
	URLToken.prototype.toSource = function () {
		return "url(\"" + escapeString(this.value) + "\")";
	};

	function NumberToken() {
		this.value = null;
		this.type = "integer";
		this.repr = "";
	}
	NumberToken.prototype = Object.create(CSSParserToken.prototype);
	NumberToken.prototype.tokenType = "NUMBER";
	NumberToken.prototype.toString = function () {
		if (this.type == "integer")
			return "INT(" + this.value + ")";
		return "NUMBER(" + this.value + ")";
	};
	NumberToken.prototype.toJSON = function () {
		const json = this.constructor.prototype.constructor.prototype.toJSON.call(this);
		json.value = this.value;
		json.type = this.type;
		json.repr = this.repr;
		return json;
	};
	NumberToken.prototype.toSource = function () { return this.repr; };

	function PercentageToken() {
		this.value = null;
		this.repr = "";
	}
	PercentageToken.prototype = Object.create(CSSParserToken.prototype);
	PercentageToken.prototype.tokenType = "PERCENTAGE";
	PercentageToken.prototype.toString = function () { return "PERCENTAGE(" + this.value + ")"; };
	PercentageToken.prototype.toJSON = function () {
		const json = this.constructor.prototype.constructor.prototype.toJSON.call(this);
		json.value = this.value;
		json.repr = this.repr;
		return json;
	};
	PercentageToken.prototype.toSource = function () { return this.repr + "%"; };

	function DimensionToken() {
		this.value = null;
		this.type = "integer";
		this.repr = "";
		this.unit = "";
	}
	DimensionToken.prototype = Object.create(CSSParserToken.prototype);
	DimensionToken.prototype.tokenType = "DIMENSION";
	DimensionToken.prototype.toString = function () { return "DIM(" + this.value + "," + this.unit + ")"; };
	DimensionToken.prototype.toJSON = function () {
		const json = this.constructor.prototype.constructor.prototype.toJSON.call(this);
		json.value = this.value;
		json.type = this.type;
		json.repr = this.repr;
		json.unit = this.unit;
		return json;
	};
	DimensionToken.prototype.toSource = function () {
		const source = this.repr;
		let unit = escapeIdent(this.unit);
		if (unit[0].toLowerCase() == "e" && (unit[1] == "-" || between(unit.charCodeAt(1), 0x30, 0x39))) {
			// Unit is ambiguous with scinot
			// Remove the leading "e", replace with escape.
			unit = "\\65 " + unit.slice(1, unit.length);
		}
		return source + unit;
	};

	function escapeIdent(string) {
		string = "" + string;
		let result = "";
		const firstcode = string.charCodeAt(0);
		for (let i = 0; i < string.length; i++) {
			const code = string.charCodeAt(i);
			if (code == 0x0) {
				throw new InvalidCharacterError("Invalid character: the input contains U+0000.");
			}

			if (
				between(code, 0x1, 0x1f) || code == 0x7f ||
				(i == 0 && between(code, 0x30, 0x39)) ||
				(i == 1 && between(code, 0x30, 0x39) && firstcode == 0x2d)
			) {
				result += "\\" + code.toString(16) + " ";
			} else if (
				code >= 0x80 ||
				code == 0x2d ||
				code == 0x5f ||
				between(code, 0x30, 0x39) ||
				between(code, 0x41, 0x5a) ||
				between(code, 0x61, 0x7a)
			) {
				result += string[i];
			} else {
				result += "\\" + string[i];
			}
		}
		return result;
	}

	function escapeHash(string) {
		// Escapes the contents of "unrestricted"-type hash tokens.
		// Won't preserve the ID-ness of "id"-type hash tokens;
		// use escapeIdent() for that.
		string = "" + string;
		let result = "";
		// let firstcode = string.charCodeAt(0);
		for (let i = 0; i < string.length; i++) {
			const code = string.charCodeAt(i);
			if (code == 0x0) {
				throw new InvalidCharacterError("Invalid character: the input contains U+0000.");
			}

			if (
				code >= 0x80 ||
				code == 0x2d ||
				code == 0x5f ||
				between(code, 0x30, 0x39) ||
				between(code, 0x41, 0x5a) ||
				between(code, 0x61, 0x7a)
			) {
				result += string[i];
			} else {
				result += "\\" + code.toString(16) + " ";
			}
		}
		return result;
	}

	function escapeString(string) {
		string = "" + string;
		let result = "";
		for (let i = 0; i < string.length; i++) {
			const code = string.charCodeAt(i);

			if (code == 0x0) {
				throw new InvalidCharacterError("Invalid character: the input contains U+0000.");
			}

			if (between(code, 0x1, 0x1f) || code == 0x7f) {
				result += "\\" + code.toString(16) + " ";
			} else if (code == 0x22 || code == 0x5c) {
				result += "\\" + string[i];
			} else {
				result += string[i];
			}
		}
		return result;
	}

	// ---
	function TokenStream(tokens) {
		// Assume that tokens is an array.
		this.tokens = tokens;
		this.i = -1;
	}
	TokenStream.prototype.tokenAt = function (i) {
		if (i < this.tokens.length)
			return this.tokens[i];
		return new EOFToken();
	};
	TokenStream.prototype.consume = function (num) {
		if (num === undefined) num = 1;
		this.i += num;
		this.token = this.tokenAt(this.i);
		//console.log(this.i, this.token);
		return true;
	};
	TokenStream.prototype.next = function () {
		return this.tokenAt(this.i + 1);
	};
	TokenStream.prototype.reconsume = function () {
		this.i--;
	};

	function parseerror(s, msg) {
		throw new Error("Parse error at token " + s.i + ": " + s.token + ".\n" + msg);
	}
	function donothing() { return true; }

	function consumeAListOfRules(s, topLevel) {
		const rules = [];
		let rule;
		while (s.consume()) {
			if (s.token instanceof WhitespaceToken) {
				continue;
			} else if (s.token instanceof EOFToken) {
				return rules;
			} else if (s.token instanceof CDOToken || s.token instanceof CDCToken) {
				if (topLevel == "top-level") continue;
				s.reconsume();
				if (rule = consumeAQualifiedRule(s)) rules.push(rule);
			} else if (s.token instanceof AtKeywordToken) {
				s.reconsume();
				if (rule = consumeAnAtRule(s)) rules.push(rule);
			} else {
				s.reconsume();
				if (rule = consumeAQualifiedRule(s)) rules.push(rule);
			}
		}
	}

	function consumeAnAtRule(s) {
		s.consume();
		const rule = new AtRule(s.token.value);
		while (s.consume()) {
			if (s.token instanceof SemicolonToken || s.token instanceof EOFToken) {
				return rule;
			} else if (s.token instanceof OpenCurlyToken) {
				rule.value = consumeASimpleBlock(s);
				return rule;
			} else if (s.token instanceof SimpleBlock && s.token.name == "{") {
				rule.value = s.token;
				return rule;
			} else {
				s.reconsume();
				rule.prelude.push(consumeAComponentValue(s));
			}
		}
	}

	function consumeAQualifiedRule(s) {
		const rule = new QualifiedRule();
		while (s.consume()) {
			if (s.token instanceof EOFToken) {
				parseerror(s, "Hit EOF when trying to parse the prelude of a qualified rule.");
				return;
			} else if (s.token instanceof OpenCurlyToken) {
				rule.value = consumeASimpleBlock(s);
				return rule;
			} else if (s.token instanceof SimpleBlock && s.token.name == "{") {
				rule.value = s.token;
				return rule;
			} else {
				s.reconsume();
				rule.prelude.push(consumeAComponentValue(s));
			}
		}
	}

	function consumeAListOfDeclarations(s) {
		const decls = [];
		while (s.consume()) {
			if (s.token instanceof WhitespaceToken || s.token instanceof SemicolonToken) {
				donothing();
			} else if (s.token instanceof EOFToken) {
				return decls;
			} else if (s.token instanceof AtKeywordToken) {
				s.reconsume();
				decls.push(consumeAnAtRule(s));
			} else if (s.token instanceof IdentToken) {
				const temp = [s.token];
				while (!(s.next() instanceof SemicolonToken || s.next() instanceof EOFToken))
					temp.push(consumeAComponentValue(s));
				let decl;
				if (decl = consumeADeclaration(new TokenStream(temp))) decls.push(decl);
			} else {
				parseerror(s);
				s.reconsume();
				while (!(s.next() instanceof SemicolonToken || s.next() instanceof EOFToken))
					consumeAComponentValue(s);
			}
		}
	}

	function consumeADeclaration(s) {
		// Assumes that the next input token will be an ident token.
		s.consume();
		const decl = new Declaration(s.token.value);
		while (s.next() instanceof WhitespaceToken) s.consume();
		if (!(s.next() instanceof ColonToken)) {
			parseerror(s);
			return;
		} else {
			s.consume();
		}
		while (!(s.next() instanceof EOFToken)) {
			decl.value.push(consumeAComponentValue(s));
		}
		let foundImportant = false;
		for (let i = decl.value.length - 1; i >= 0; i--) {
			if (decl.value[i] instanceof WhitespaceToken) {
				continue;
			} else if (decl.value[i] instanceof IdentToken && decl.value[i].ASCIIMatch("important")) {
				foundImportant = true;
			} else if (foundImportant && decl.value[i] instanceof DelimToken && decl.value[i].value == "!") {
				decl.value.splice(i, decl.value.length);
				decl.important = true;
				break;
			} else {
				break;
			}
		}
		return decl;
	}

	function consumeAComponentValue(s) {
		s.consume();
		if (s.token instanceof OpenCurlyToken || s.token instanceof OpenSquareToken || s.token instanceof OpenParenToken)
			return consumeASimpleBlock(s);
		if (s.token instanceof FunctionToken)
			return consumeAFunction(s);
		return s.token;
	}

	function consumeASimpleBlock(s) {
		const mirror = s.token.mirror;
		const block = new SimpleBlock(s.token.value);
		while (s.consume()) {
			if (s.token instanceof EOFToken || (s.token instanceof GroupingToken && s.token.value == mirror))
				return block;
			else {
				s.reconsume();
				block.value.push(consumeAComponentValue(s));
			}
		}
	}

	function consumeAFunction(s) {
		const func = new Func(s.token.value);
		while (s.consume()) {
			if (s.token instanceof EOFToken || s.token instanceof CloseParenToken)
				return func;
			else {
				s.reconsume();
				func.value.push(consumeAComponentValue(s));
			}
		}
	}

	function normalizeInput(input) {
		if (typeof input == "string")
			return new TokenStream(tokenize(input));
		if (input instanceof TokenStream)
			return input;
		if (input.length !== undefined)
			return new TokenStream(input);
		else throw SyntaxError(input);
	}

	function parseAStylesheet(s) {
		s = normalizeInput(s);
		const sheet = new Stylesheet();
		sheet.value = consumeAListOfRules(s, "top-level");
		return sheet;
	}

	function parseAListOfRules(s) {
		s = normalizeInput(s);
		return consumeAListOfRules(s);
	}

	function parseARule(s) {
		s = normalizeInput(s);
		while (s.next() instanceof WhitespaceToken) s.consume();
		if (s.next() instanceof EOFToken) throw SyntaxError();
		let rule;
		if (s.next() instanceof AtKeywordToken) {
			rule = consumeAnAtRule(s);
		} else {
			rule = consumeAQualifiedRule(s);
			if (!rule) throw SyntaxError();
		}
		while (s.next() instanceof WhitespaceToken) s.consume();
		if (s.next() instanceof EOFToken)
			return rule;
		throw SyntaxError();
	}

	function parseADeclaration(s) {
		s = normalizeInput(s);
		while (s.next() instanceof WhitespaceToken) s.consume();
		if (!(s.next() instanceof IdentToken)) throw SyntaxError();
		const decl = consumeADeclaration(s);
		if (decl)
			return decl;
		else
			throw SyntaxError();
	}

	function parseAListOfDeclarations(s) {
		s = normalizeInput(s);
		return consumeAListOfDeclarations(s);
	}

	function parseAComponentValue(s) {
		s = normalizeInput(s);
		while (s.next() instanceof WhitespaceToken) s.consume();
		if (s.next() instanceof EOFToken) throw SyntaxError();
		const val = consumeAComponentValue(s);
		if (!val) throw SyntaxError();
		while (s.next() instanceof WhitespaceToken) s.consume();
		if (s.next() instanceof EOFToken)
			return val;
		throw SyntaxError();
	}

	function parseAListOfComponentValues(s) {
		s = normalizeInput(s);
		const vals = [];
		while (true) {
			const val = consumeAComponentValue(s);
			if (val instanceof EOFToken)
				return vals;
			else
				vals.push(val);
		}
	}

	function parseACommaSeparatedListOfComponentValues(s) {
		s = normalizeInput(s);
		const listOfCVLs = [];
		while (true) {
			const vals = [];
			while (true) {
				const val = consumeAComponentValue(s);
				if (val instanceof EOFToken) {
					listOfCVLs.push(vals);
					return listOfCVLs;
				} else if (val instanceof CommaToken) {
					listOfCVLs.push(vals);
					break;
				} else {
					vals.push(val);
				}
			}
		}
	}


	function CSSParserRule() { throw "Abstract Base Class"; }
	CSSParserRule.prototype.toString = function (indent) {
		return JSON.stringify(this, null, indent);
	};
	CSSParserRule.prototype.toJSON = function () {
		return { type: this.type, value: this.value };
	};

	function Stylesheet() {
		this.value = [];
		return this;
	}
	Stylesheet.prototype = Object.create(CSSParserRule.prototype);
	Stylesheet.prototype.type = "STYLESHEET";

	function AtRule(name) {
		this.name = name;
		this.prelude = [];
		this.value = null;
		return this;
	}
	AtRule.prototype = Object.create(CSSParserRule.prototype);
	AtRule.prototype.type = "AT-RULE";
	AtRule.prototype.toJSON = function () {
		const json = this.constructor.prototype.constructor.prototype.toJSON.call(this);
		json.name = this.name;
		json.prelude = this.prelude;
		return json;
	};

	function QualifiedRule() {
		this.prelude = [];
		this.value = [];
		return this;
	}
	QualifiedRule.prototype = Object.create(CSSParserRule.prototype);
	QualifiedRule.prototype.type = "QUALIFIED-RULE";
	QualifiedRule.prototype.toJSON = function () {
		const json = this.constructor.prototype.constructor.prototype.toJSON.call(this);
		json.prelude = this.prelude;
		return json;
	};

	function Declaration(name) {
		this.name = name;
		this.value = [];
		this.important = false;
		return this;
	}
	Declaration.prototype = Object.create(CSSParserRule.prototype);
	Declaration.prototype.type = "DECLARATION";
	Declaration.prototype.toJSON = function () {
		const json = this.constructor.prototype.constructor.prototype.toJSON.call(this);
		json.name = this.name;
		json.important = this.important;
		return json;
	};

	function SimpleBlock(type) {
		this.name = type;
		this.value = [];
		return this;
	}
	SimpleBlock.prototype = Object.create(CSSParserRule.prototype);
	SimpleBlock.prototype.type = "BLOCK";
	SimpleBlock.prototype.toJSON = function () {
		const json = this.constructor.prototype.constructor.prototype.toJSON.call(this);
		json.name = this.name;
		return json;
	};

	function Func(name) {
		this.name = name;
		this.value = [];
		return this;
	}
	Func.prototype = Object.create(CSSParserRule.prototype);
	Func.prototype.type = "FUNCTION";
	Func.prototype.toJSON = function () {
		const json = this.constructor.prototype.constructor.prototype.toJSON.call(this);
		json.name = this.name;
		return json;
	};


	/* Grammar Application */

	function canonicalize(rule, grammar, topGrammar) {
		if (grammar === undefined) grammar = CSSGrammar;
		if (topGrammar === undefined) topGrammar = grammar;
		let unknownTransformer;
		if (grammar) {
			if (grammar.stylesheet) grammar = topGrammar;
			unknownTransformer = grammar.unknown || function () { return; };
		}
		const ret = { "type": rule.type.toLowerCase() };
		let contents, unparsedContents;
		if (rule.type == "STYLESHEET") {
			contents = rule.value;
		} else if (rule.type == "BLOCK") {
			unparsedContents = rule.value;
			ret.name = rule.name;
		} else if (rule.type == "QUALIFIED-RULE") {
			unparsedContents = rule.value.value;
			ret.prelude = rule.prelude;
		} else if (rule.type == "AT-RULE") {
			unparsedContents = rule.value.value;
			ret.name = rule.name;
			ret.prelude = rule.prelude;
		} else if (rule.type == "DECLARATION") {
			// I don't do grammar-checking of declarations yet.
			ret.name = rule.name;
			ret.value = rule.value;
			ret.important = rule.important;
			return ret;
		}
		if (unparsedContents) {
			if (grammar.declarations) {
				contents = parseAListOfDeclarations(unparsedContents);
			} else if (grammar.qualified) {
				contents = parseAListOfRules(unparsedContents);
			}
		}

		if (!grammar) {
			return ret;
		} else if (grammar.declarations) {
			ret.declarations = {}; // simple key/value map of declarations
			ret.rules = []; // in-order list of both decls and at-rules
			ret.errors = [];
			for (let i = 0; i < contents.length; i++) {
				const rule = contents[i];
				if (rule instanceof Declaration) {
					const decl = canonicalize(rule, {}, topGrammar);
					ret.declarations[rule.name] = decl;
					ret.rules.push(decl);
				} else { // rule is instanceof AtRule
					const subGrammar = grammar["@" + rule.name];
					if (subGrammar) { // Rule is valid in this context
						ret.rules.push(canonicalize(rule, subGrammar, topGrammar));
					} else {
						const result = unknownTransformer(rule);
						if (result) {
							ret.rules.push(result);
						} else {
							ret.errors.push(result);
						}
					}
				}
			}
		} else {
			ret.rules = [];
			ret.errors = [];
			for (let i = 0; i < contents.length; i++) {
				const rule = contents[i];
				if (rule instanceof QualifiedRule) {
					ret.rules.push(canonicalize(rule, grammar.qualified, topGrammar));
				} else {
					const subGrammar = grammar["@" + rule.name];
					if (subGrammar) { // Rule is valid in this context
						ret.rules.push(canonicalize(rule, subGrammar, topGrammar));
					} else {
						const result = unknownTransformer(rule);
						if (result) {
							ret.rules.push(result);
						} else {
							ret.errors.push(result);
						}
					}
				}
			}
		}
		return ret;
	}

	const CSSGrammar = {
		qualified: { declarations: true },
		"@media": { stylesheet: true },
		"@keyframes": { qualified: { declarations: true } },
		"@font-face": { declarations: true },
		"@supports": { stylesheet: true },
		"@scope": { stylesheet: true },
		"@counter-style": { declarations: true },
		"@import": null,
		"@font-feature-values": {
			// No qualified rules actually allowed,
			// but have to declare it one way or the other.
			qualified: true,
			"@stylistic": { declarations: true },
			"@styleset": { declarations: true },
			"@character-variants": { declarations: true },
			"@swash": { declarations: true },
			"@ornaments": { declarations: true },
			"@annotation": { declarations: true },
		},
		"@viewport": { declarations: true },
		"@page": {
			declarations: true,
			"@top-left-corner": { declarations: true },
			"@top-left": { declarations: true },
			"@top-center": { declarations: true },
			"@top-right": { declarations: true },
			"@top-right-corner": { declarations: true },
			"@right-top": { declarations: true },
			"@right-middle": { declarations: true },
			"@right-bottom": { declarations: true },
			"@right-bottom-corner": { declarations: true },
			"@bottom-right": { declarations: true },
			"@bottom-center": { declarations: true },
			"@bottom-left": { declarations: true },
			"@bottom-left-corner": { declarations: true },
			"@left-bottom": { declarations: true },
			"@left-center": { declarations: true },
			"@left-top": { declarations: true },
		},
		"@custom-selector": null,
		"@custom-media": null
	};



	// Exportation.

	return {
		CSSParserRule: CSSParserRule,
		Stylesheet: Stylesheet,
		AtRule: AtRule,
		QualifiedRule: QualifiedRule,
		Declaration: Declaration,
		SimpleBlock: SimpleBlock,
		Func: Func,
		parseAStylesheet: parseAStylesheet,
		parseAListOfRules: parseAListOfRules,
		parseARule: parseARule,
		parseADeclaration: parseADeclaration,
		parseAListOfDeclarations: parseAListOfDeclarations,
		parseAComponentValue: parseAComponentValue,
		parseAListOfComponentValues: parseAListOfComponentValues,
		parseACommaSeparatedListOfComponentValues: parseACommaSeparatedListOfComponentValues,
		canonicalizeRule: canonicalize,
		CSSGrammar: CSSGrammar
	};

})();