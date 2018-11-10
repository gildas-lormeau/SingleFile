/*
 * Copyright (C) 2016 by Roman Dvornov
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

// derived from https://github.com/csstree/csstree

this.cssTree = this.cssTree || (() => {

	function createItem(data) {
		return {
			prev: null,
			next: null,
			data: data
		};
	}

	function allocateCursor(node, prev, next) {
		let cursor;

		if (cursors !== null) {
			cursor = cursors;
			cursors = cursors.cursor;
			cursor.prev = prev;
			cursor.next = next;
			cursor.cursor = node.cursor;
		} else {
			cursor = {
				prev: prev,
				next: next,
				cursor: node.cursor
			};
		}

		node.cursor = cursor;

		return cursor;
	}

	function releaseCursor(node) {
		const cursor = node.cursor;

		node.cursor = cursor.cursor;
		cursor.prev = null;
		cursor.next = null;
		cursor.cursor = cursors;
		cursors = cursor;
	}

	let cursors = null;

	function List() {
		this.cursor = null;
		this.head = null;
		this.tail = null;
	}

	List.createItem = createItem;
	List.prototype.createItem = createItem;

	List.prototype.updateCursors = function (prevOld, prevNew, nextOld, nextNew) {
		let cursor = this.cursor;

		while (cursor !== null) {
			if (cursor.prev === prevOld) {
				cursor.prev = prevNew;
			}

			if (cursor.next === nextOld) {
				cursor.next = nextNew;
			}

			cursor = cursor.cursor;
		}
	};

	List.prototype.getSize = function () {
		let size = 0;
		let cursor = this.head;

		while (cursor) {
			size++;
			cursor = cursor.next;
		}

		return size;
	};

	List.prototype.fromArray = function (array) {
		let cursor = null;

		this.head = null;

		for (let i = 0; i < array.length; i++) {
			const item = createItem(array[i]);

			if (cursor !== null) {
				cursor.next = item;
			} else {
				this.head = item;
			}

			item.prev = cursor;
			cursor = item;
		}

		this.tail = cursor;

		return this;
	};

	List.prototype.toArray = function () {
		let cursor = this.head;
		const result = [];

		while (cursor) {
			result.push(cursor.data);
			cursor = cursor.next;
		}

		return result;
	};

	List.prototype.toJSON = List.prototype.toArray;

	List.prototype.isEmpty = function () {
		return this.head === null;
	};

	List.prototype.first = function () {
		return this.head && this.head.data;
	};

	List.prototype.last = function () {
		return this.tail && this.tail.data;
	};

	List.prototype.each = function (fn, context) {
		let item;

		if (context === undefined) {
			context = this;
		}

		// push cursor
		const cursor = allocateCursor(this, null, this.head);

		while (cursor.next !== null) {
			item = cursor.next;
			cursor.next = item.next;

			fn.call(context, item.data, item, this);
		}

		// pop cursor
		releaseCursor(this);
	};

	List.prototype.forEach = List.prototype.each;

	List.prototype.eachRight = function (fn, context) {
		let item;

		if (context === undefined) {
			context = this;
		}

		// push cursor
		const cursor = allocateCursor(this, this.tail, null);

		while (cursor.prev !== null) {
			item = cursor.prev;
			cursor.prev = item.prev;

			fn.call(context, item.data, item, this);
		}

		// pop cursor
		releaseCursor(this);
	};

	List.prototype.forEachRight = List.prototype.eachRight;

	List.prototype.nextUntil = function (start, fn, context) {
		if (start === null) {
			return;
		}

		let item;

		if (context === undefined) {
			context = this;
		}

		// push cursor
		const cursor = allocateCursor(this, null, start);

		while (cursor.next !== null) {
			item = cursor.next;
			cursor.next = item.next;

			if (fn.call(context, item.data, item, this)) {
				break;
			}
		}

		// pop cursor
		releaseCursor(this);
	};

	List.prototype.prevUntil = function (start, fn, context) {
		if (start === null) {
			return;
		}

		let item;

		if (context === undefined) {
			context = this;
		}

		// push cursor
		const cursor = allocateCursor(this, start, null);

		while (cursor.prev !== null) {
			item = cursor.prev;
			cursor.prev = item.prev;

			if (fn.call(context, item.data, item, this)) {
				break;
			}
		}

		// pop cursor
		releaseCursor(this);
	};

	List.prototype.some = function (fn, context) {
		let cursor = this.head;

		if (context === undefined) {
			context = this;
		}

		while (cursor !== null) {
			if (fn.call(context, cursor.data, cursor, this)) {
				return true;
			}

			cursor = cursor.next;
		}

		return false;
	};

	List.prototype.map = function (fn, context) {
		const result = new List();
		let cursor = this.head;

		if (context === undefined) {
			context = this;
		}

		while (cursor !== null) {
			result.appendData(fn.call(context, cursor.data, cursor, this));
			cursor = cursor.next;
		}

		return result;
	};

	List.prototype.filter = function (fn, context) {
		const result = new List();
		let cursor = this.head;

		if (context === undefined) {
			context = this;
		}

		while (cursor !== null) {
			if (fn.call(context, cursor.data, cursor, this)) {
				result.appendData(cursor.data);
			}
			cursor = cursor.next;
		}

		return result;
	};

	List.prototype.clear = function () {
		this.head = null;
		this.tail = null;
	};

	List.prototype.copy = function () {
		const result = new List();
		let cursor = this.head;

		while (cursor !== null) {
			result.insert(createItem(cursor.data));
			cursor = cursor.next;
		}

		return result;
	};

	List.prototype.prepend = function (item) {
		//      head
		//    ^
		// item
		this.updateCursors(null, item, this.head, item);

		// insert to the beginning of the list
		if (this.head !== null) {
			// new item <- first item
			this.head.prev = item;

			// new item -> first item
			item.next = this.head;
		} else {
			// if list has no head, then it also has no tail
			// in this case tail points to the new item
			this.tail = item;
		}

		// head always points to new item
		this.head = item;

		return this;
	};

	List.prototype.prependData = function (data) {
		return this.prepend(createItem(data));
	};

	List.prototype.append = function (item) {
		return this.insert(item);
	};

	List.prototype.appendData = function (data) {
		return this.insert(createItem(data));
	};

	List.prototype.insert = function (item, before) {
		if (before !== undefined && before !== null) {
			// prev   before
			//      ^
			//     item
			this.updateCursors(before.prev, item, before, item);

			if (before.prev === null) {
				// insert to the beginning of list
				if (this.head !== before) {
					throw new Error("before doesn\"t belong to list");
				}

				// since head points to before therefore list doesn"t empty
				// no need to check tail
				this.head = item;
				before.prev = item;
				item.next = before;

				this.updateCursors(null, item);
			} else {

				// insert between two items
				before.prev.next = item;
				item.prev = before.prev;

				before.prev = item;
				item.next = before;
			}
		} else {
			// tail
			//      ^
			//      item
			this.updateCursors(this.tail, item, null, item);

			// insert to the ending of the list
			if (this.tail !== null) {
				// last item -> new item
				this.tail.next = item;

				// last item <- new item
				item.prev = this.tail;
			} else {
				// if list has no tail, then it also has no head
				// in this case head points to new item
				this.head = item;
			}

			// tail always points to new item
			this.tail = item;
		}

		return this;
	};

	List.prototype.insertData = function (data, before) {
		return this.insert(createItem(data), before);
	};

	List.prototype.remove = function (item) {
		//      item
		//       ^
		// prev     next
		this.updateCursors(item, item.prev, item, item.next);

		if (item.prev !== null) {
			item.prev.next = item.next;
		} else {
			if (this.head !== item) {
				throw new Error("item doesn\"t belong to list");
			}

			this.head = item.next;
		}

		if (item.next !== null) {
			item.next.prev = item.prev;
		} else {
			if (this.tail !== item) {
				throw new Error("item doesn\"t belong to list");
			}

			this.tail = item.prev;
		}

		item.prev = null;
		item.next = null;

		return item;
	};

	List.prototype.push = function (data) {
		this.insert(createItem(data));
	};

	List.prototype.pop = function () {
		if (this.tail !== null) {
			return this.remove(this.tail);
		}
	};

	List.prototype.unshift = function (data) {
		this.prepend(createItem(data));
	};

	List.prototype.shift = function () {
		if (this.head !== null) {
			return this.remove(this.head);
		}
	};

	List.prototype.prependList = function (list) {
		return this.insertList(list, this.head);
	};

	List.prototype.appendList = function (list) {
		return this.insertList(list);
	};

	List.prototype.insertList = function (list, before) {
		// ignore empty lists
		if (list.head === null) {
			return this;
		}

		if (before !== undefined && before !== null) {
			this.updateCursors(before.prev, list.tail, before, list.head);

			// insert in the middle of dist list
			if (before.prev !== null) {
				// before.prev <-> list.head
				before.prev.next = list.head;
				list.head.prev = before.prev;
			} else {
				this.head = list.head;
			}

			before.prev = list.tail;
			list.tail.next = before;
		} else {
			this.updateCursors(this.tail, list.tail, null, list.head);

			// insert to end of the list
			if (this.tail !== null) {
				// if destination list has a tail, then it also has a head,
				// but head doesn"t change

				// dest tail -> source head
				this.tail.next = list.head;

				// dest tail <- source head
				list.head.prev = this.tail;
			} else {
				// if list has no a tail, then it also has no a head
				// in this case points head to new item
				this.head = list.head;
			}

			// tail always start point to new item
			this.tail = list.tail;
		}

		list.head = null;
		list.tail = null;

		return this;
	};

	List.prototype.replace = function (oldItem, newItemOrList) {
		if ("head" in newItemOrList) {
			this.insertList(newItemOrList, oldItem);
		} else {
			this.insert(newItemOrList, oldItem);
		}

		this.remove(oldItem);
	};

	// ---
	function createCustomError(name, message) {
		// use Object.create(), because some VMs prevent setting line/column otherwise
		// (iOS Safari 10 even throws an exception)
		const error = Object.create(SyntaxError.prototype);
		const errorStack = new Error();

		error.name = name;
		error.message = message;

		Object.defineProperty(error, "stack", {
			get: function () {
				return (errorStack.stack || "").replace(/^(.+\n){1,3}/, name + ": " + message + "\n");
			}
		});

		return error;
	}

	// ---

	const MAX_LINE_LENGTH = 100;
	const OFFSET_CORRECTION = 60;
	const TAB_REPLACEMENT = "    ";

	function sourceFragment(error, extraLines) {
		function processLines(start, end) {
			return lines.slice(start, end).map(function (line, idx) {
				let num = String(start + idx + 1);

				while (num.length < maxNumLength) {
					num = " " + num;
				}

				return num + " |" + line;
			}).join("\n");
		}

		const lines = error.source.split(/\r\n?|\n|\f/);
		let line = error.line;
		let column = error.column;
		const startLine = Math.max(1, line - extraLines) - 1;
		const endLine = Math.min(line + extraLines, lines.length + 1);
		const maxNumLength = Math.max(4, String(endLine).length) + 1;
		let cutLeft = 0;

		// column correction according to replaced tab before column
		column += (TAB_REPLACEMENT.length - 1) * (lines[line - 1].substr(0, column - 1).match(/\t/g) || []).length;

		if (column > MAX_LINE_LENGTH) {
			cutLeft = column - OFFSET_CORRECTION + 3;
			column = OFFSET_CORRECTION - 2;
		}

		for (let i = startLine; i <= endLine; i++) {
			if (i >= 0 && i < lines.length) {
				lines[i] = lines[i].replace(/\t/g, TAB_REPLACEMENT);
				lines[i] =
					(cutLeft > 0 && lines[i].length > cutLeft ? "\u2026" : "") +
					lines[i].substr(cutLeft, MAX_LINE_LENGTH - 2) +
					(lines[i].length > cutLeft + MAX_LINE_LENGTH - 1 ? "\u2026" : "");
			}
		}

		return [
			processLines(startLine, line),
			new Array(column + maxNumLength + 2).join("-") + "^",
			processLines(line, endLine)
		].filter(Boolean).join("\n");
	}

	function CssSyntaxError(message, source, offset, line, column) {
		const error = createCustomError("CssSyntaxError", message);

		error.source = source;
		error.offset = offset;
		error.line = line;
		error.column = column;

		error.sourceFragment = function (extraLines) {
			return sourceFragment(error, isNaN(extraLines) ? 0 : extraLines);
		};
		Object.defineProperty(error, "formattedMessage", {
			get: function () {
				return (
					"Parse error: " + error.message + "\n" +
					sourceFragment(error, 2)
				);
			}
		});

		// for backward capability
		error.parseError = {
			offset: offset,
			line: line,
			column: column
		};

		return error;
	}

	// ---

	// token types (note: value shouldn't intersect with used char codes)
	const WHITESPACE = 1;
	const IDENTIFIER = 2;
	const NUMBER = 3;
	const STRING = 4;
	const COMMENT = 5;
	const PUNCTUATOR = 6;
	const CDO = 7;
	const CDC = 8;
	const ATKEYWORD = 14;
	const FUNCTION = 15;
	const URL = 16;
	const RAW = 17;

	const TAB = 9;
	const NEW_LINE = 10;
	const F = 12;
	const R = 13;
	const SPACE = 32;

	const TYPE = {
		WhiteSpace: WHITESPACE,
		Identifier: IDENTIFIER,
		Number: NUMBER,
		String: STRING,
		Comment: COMMENT,
		Punctuator: PUNCTUATOR,
		CDO: CDO,
		CDC: CDC,
		AtKeyword: ATKEYWORD,
		Function: FUNCTION,
		Url: URL,
		Raw: RAW,

		ExclamationMark: 33,  // !
		QuotationMark: 34,  // "
		NumberSign: 35,  // #
		DollarSign: 36,  // $
		PercentSign: 37,  // %
		Ampersand: 38,  // &
		Apostrophe: 39,  // '
		LeftParenthesis: 40,  // (
		RightParenthesis: 41,  // )
		Asterisk: 42,  // *
		PlusSign: 43,  // +
		Comma: 44,  // ,
		HyphenMinus: 45,  // -
		FullStop: 46,  // .
		Solidus: 47,  // /
		Colon: 58,  // :
		Semicolon: 59,  // ;
		LessThanSign: 60,  // <
		EqualsSign: 61,  // =
		GreaterThanSign: 62,  // >
		QuestionMark: 63,  // ?
		CommercialAt: 64,  // @
		LeftSquareBracket: 91,  // [
		Backslash: 92,  // \
		RightSquareBracket: 93,  // ]
		CircumflexAccent: 94,  // ^
		LowLine: 95,  // _
		GraveAccent: 96,  // `
		LeftCurlyBracket: 123,  // {
		VerticalLine: 124,  // |
		RightCurlyBracket: 125,  // }
		Tilde: 126   // ~
	};

	const NAME = Object.keys(TYPE).reduce(function (result, key) {
		result[TYPE[key]] = key;
		return result;
	}, {});

	// https://drafts.csswg.org/css-syntax/#tokenizer-definitions
	// > non-ASCII code point
	// >   A code point with a value equal to or greater than U+0080 <control>
	// > name-start code point
	// >   A letter, a non-ASCII code point, or U+005F LOW LINE (_).
	// > name code point
	// >   A name-start code point, a digit, or U+002D HYPHEN-MINUS (-)
	// That means only ASCII code points has a special meaning and we a maps for 0..127 codes only
	const SafeUint32Array = typeof Uint32Array !== "undefined" ? Uint32Array : Array; // fallback on Array when TypedArray is not supported
	const SYMBOL_TYPE = new SafeUint32Array(0x80);
	const PUNCTUATION = new SafeUint32Array(0x80);
	const STOP_URL_RAW = new SafeUint32Array(0x80);

	for (let i = 0; i < SYMBOL_TYPE.length; i++) {
		SYMBOL_TYPE[i] = IDENTIFIER;
	}

	// fill categories
	[
		TYPE.ExclamationMark,    // !
		TYPE.QuotationMark,      // "
		TYPE.NumberSign,         // #
		TYPE.DollarSign,         // $
		TYPE.PercentSign,        // %
		TYPE.Ampersand,          // &
		TYPE.Apostrophe,         // '
		TYPE.LeftParenthesis,    // (
		TYPE.RightParenthesis,   // )
		TYPE.Asterisk,           // *
		TYPE.PlusSign,           // +
		TYPE.Comma,              // ,
		TYPE.HyphenMinus,        // -
		TYPE.FullStop,           // .
		TYPE.Solidus,            // /
		TYPE.Colon,              // :
		TYPE.Semicolon,          // ;
		TYPE.LessThanSign,       // <
		TYPE.EqualsSign,         // =
		TYPE.GreaterThanSign,    // >
		TYPE.QuestionMark,       // ?
		TYPE.CommercialAt,       // @
		TYPE.LeftSquareBracket,  // [
		// TYPE.Backslash,          // \
		TYPE.RightSquareBracket, // ]
		TYPE.CircumflexAccent,   // ^
		// TYPE.LowLine,            // _
		TYPE.GraveAccent,        // `
		TYPE.LeftCurlyBracket,   // {
		TYPE.VerticalLine,       // |
		TYPE.RightCurlyBracket,  // }
		TYPE.Tilde               // ~
	].forEach(function (key) {
		SYMBOL_TYPE[Number(key)] = PUNCTUATOR;
		PUNCTUATION[Number(key)] = PUNCTUATOR;
	});

	for (let i = 48; i <= 57; i++) {
		SYMBOL_TYPE[i] = NUMBER;
	}

	SYMBOL_TYPE[SPACE] = WHITESPACE;
	SYMBOL_TYPE[TAB] = WHITESPACE;
	SYMBOL_TYPE[NEW_LINE] = WHITESPACE;
	SYMBOL_TYPE[R] = WHITESPACE;
	SYMBOL_TYPE[F] = WHITESPACE;

	SYMBOL_TYPE[TYPE.Apostrophe] = STRING;
	SYMBOL_TYPE[TYPE.QuotationMark] = STRING;

	STOP_URL_RAW[SPACE] = 1;
	STOP_URL_RAW[TAB] = 1;
	STOP_URL_RAW[NEW_LINE] = 1;
	STOP_URL_RAW[R] = 1;
	STOP_URL_RAW[F] = 1;
	STOP_URL_RAW[TYPE.Apostrophe] = 1;
	STOP_URL_RAW[TYPE.QuotationMark] = 1;
	STOP_URL_RAW[TYPE.LeftParenthesis] = 1;
	STOP_URL_RAW[TYPE.RightParenthesis] = 1;

	// whitespace is punctuation ...
	PUNCTUATION[SPACE] = PUNCTUATOR;
	PUNCTUATION[TAB] = PUNCTUATOR;
	PUNCTUATION[NEW_LINE] = PUNCTUATOR;
	PUNCTUATION[R] = PUNCTUATOR;
	PUNCTUATION[F] = PUNCTUATOR;
	// ... hyper minus is not
	PUNCTUATION[TYPE.HyphenMinus] = 0;

	const constants = {
		TYPE: TYPE,
		NAME: NAME,

		SYMBOL_TYPE: SYMBOL_TYPE,
		PUNCTUATION: PUNCTUATION,
		STOP_URL_RAW: STOP_URL_RAW
	};

	// ---

	const BACK_SLASH = 92;
	const E = 101; // 'e'.charCodeAt(0)

	function firstCharOffset(source) {
		// detect BOM (https://en.wikipedia.org/wiki/Byte_order_mark)
		if (source.charCodeAt(0) === 0xFEFF ||  // UTF-16BE
			source.charCodeAt(0) === 0xFFFE) {  // UTF-16LE
			return 1;
		}

		return 0;
	}

	function isHex(code) {
		return (code >= 48 && code <= 57) || // 0 .. 9
			(code >= 65 && code <= 70) || // A .. F
			(code >= 97 && code <= 102);  // a .. f
	}

	function isNumber(code) {
		return code >= 48 && code <= 57;
	}

	function isWhiteSpace(code) {
		return code === SPACE || code === TAB || isNewline(code);
	}

	function isNewline(code) {
		return code === R || code === NEW_LINE || code === F;
	}

	function getNewlineLength(source, offset, code) {
		if (isNewline(code)) {
			if (code === R && offset + 1 < source.length && source.charCodeAt(offset + 1) === NEW_LINE) {
				return 2;
			}

			return 1;
		}

		return 0;
	}

	function cmpChar(testStr, offset, referenceCode) {
		let code = testStr.charCodeAt(offset);

		// code.toLowerCase() for A..Z
		if (code >= 65 && code <= 90) {
			code = code | 32;
		}

		return code === referenceCode;
	}

	function cmpStr(testStr, start, end, referenceStr) {
		if (end - start !== referenceStr.length) {
			return false;
		}

		if (start < 0 || end > testStr.length) {
			return false;
		}

		for (let i = start; i < end; i++) {
			let testCode = testStr.charCodeAt(i);
			const refCode = referenceStr.charCodeAt(i - start);

			// testCode.toLowerCase() for A..Z
			if (testCode >= 65 && testCode <= 90) {
				testCode = testCode | 32;
			}

			if (testCode !== refCode) {
				return false;
			}
		}

		return true;
	}

	function findWhiteSpaceStart(source, offset) {
		while (offset >= 0 && isWhiteSpace(source.charCodeAt(offset))) {
			offset--;
		}

		return offset + 1;
	}

	function findWhiteSpaceEnd(source, offset) {
		while (offset < source.length && isWhiteSpace(source.charCodeAt(offset))) {
			offset++;
		}

		return offset;
	}

	function findCommentEnd(source, offset) {
		const commentEnd = source.indexOf("*/", offset);

		if (commentEnd === -1) {
			return source.length;
		}

		return commentEnd + 2;
	}

	function findStringEnd(source, offset, quote) {
		for (; offset < source.length; offset++) {
			const code = source.charCodeAt(offset);

			// TODO: bad string
			if (code === BACK_SLASH) {
				offset++;
			} else if (code === quote) {
				offset++;
				break;
			}
		}

		return offset;
	}

	function findDecimalNumberEnd(source, offset) {
		while (offset < source.length && isNumber(source.charCodeAt(offset))) {
			offset++;
		}

		return offset;
	}

	function findNumberEnd(source, offset, allowFraction) {
		let code;

		offset = findDecimalNumberEnd(source, offset);

		// fraction: .\d+
		if (allowFraction && offset + 1 < source.length && source.charCodeAt(offset) === FULLSTOP) {
			code = source.charCodeAt(offset + 1);

			if (isNumber(code)) {
				offset = findDecimalNumberEnd(source, offset + 1);
			}
		}

		// exponent: e[+-]\d+
		if (offset + 1 < source.length) {
			if ((source.charCodeAt(offset) | 32) === E) { // case insensitive check for `e`
				code = source.charCodeAt(offset + 1);

				if (code === PLUSSIGN || code === HYPHENMINUS) {
					if (offset + 2 < source.length) {
						code = source.charCodeAt(offset + 2);
					}
				}

				if (isNumber(code)) {
					offset = findDecimalNumberEnd(source, offset + 2);
				}
			}
		}

		return offset;
	}

	// skip escaped unicode sequence that can ends with space
	// [0-9a-f]{1,6}(\r\n|[ \n\r\t\f])?
	function findEscapeEnd(source, offset) {
		for (let i = 0; i < 7 && offset + i < source.length; i++) {
			const code = source.charCodeAt(offset + i);

			if (i !== 6 && isHex(code)) {
				continue;
			}

			if (i > 0) {
				offset += i - 1 + getNewlineLength(source, offset + i, code);
				if (code === SPACE || code === TAB) {
					offset++;
				}
			}

			break;
		}

		return offset;
	}

	function findIdentifierEnd(source, offset) {
		for (; offset < source.length; offset++) {
			const code = source.charCodeAt(offset);

			if (code === BACK_SLASH) {
				offset = findEscapeEnd(source, offset + 1);
			} else if (code < 0x80 && PUNCTUATION[code] === PUNCTUATOR) {
				break;
			}
		}

		return offset;
	}

	function findUrlRawEnd(source, offset) {
		for (; offset < source.length; offset++) {
			const code = source.charCodeAt(offset);

			if (code === BACK_SLASH) {
				offset = findEscapeEnd(source, offset + 1);
			} else if (code < 0x80 && STOP_URL_RAW[code] === 1) {
				break;
			}
		}

		return offset;
	}

	const utils = {
		firstCharOffset: firstCharOffset,

		isHex: isHex,
		isNumber: isNumber,
		isWhiteSpace: isWhiteSpace,
		isNewline: isNewline,
		getNewlineLength: getNewlineLength,

		cmpChar: cmpChar,
		cmpStr: cmpStr,

		findWhiteSpaceStart: findWhiteSpaceStart,
		findWhiteSpaceEnd: findWhiteSpaceEnd,
		findCommentEnd: findCommentEnd,
		findStringEnd: findStringEnd,
		findDecimalNumberEnd: findDecimalNumberEnd,
		findNumberEnd: findNumberEnd,
		findEscapeEnd: findEscapeEnd,
		findIdentifierEnd: findIdentifierEnd,
		findUrlRawEnd: findUrlRawEnd
	};

	// ---

	const STAR = TYPE.Asterisk;
	const SLASH = TYPE.Solidus;
	const FULLSTOP = TYPE.FullStop;
	const PLUSSIGN = TYPE.PlusSign;
	const HYPHENMINUS = TYPE.HyphenMinus;
	const GREATERTHANSIGN = TYPE.GreaterThanSign;
	const LESSTHANSIGN = TYPE.LessThanSign;
	const EXCLAMATIONMARK = TYPE.ExclamationMark;
	const COMMERCIALAT = TYPE.CommercialAt;
	const QUOTATIONMARK = TYPE.QuotationMark;
	const APOSTROPHE = TYPE.Apostrophe;
	const LEFTPARENTHESIS = TYPE.LeftParenthesis;
	const RIGHTPARENTHESIS = TYPE.RightParenthesis;
	const LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;
	const RIGHTCURLYBRACKET = TYPE.RightCurlyBracket;
	const LEFTSQUAREBRACKET = TYPE.LeftSquareBracket;
	const RIGHTSQUAREBRACKET = TYPE.RightSquareBracket;
	const NUMBERSIGN = TYPE.NumberSign;
	const COMMA = TYPE.Comma;
	const SOLIDUS = TYPE.Solidus;
	const ASTERISK = TYPE.Asterisk;
	const PERCENTSIGN = TYPE.PercentSign;
	const BACKSLASH = TYPE.Backslash;
	const VERTICALLINE = TYPE.VerticalLine;
	const TILDE = TYPE.Tilde;
	const SEMICOLON = TYPE.Semicolon;
	const COLON = TYPE.Colon;
	const DOLLARSIGN = TYPE.DollarSign;
	const EQUALSSIGN = TYPE.EqualsSign;
	const CIRCUMFLEXACCENT = TYPE.CircumflexAccent;
	const TYPE_CDC = TYPE.CDC;
	const TYPE_CDO = TYPE.CDO;
	const QUESTIONMARK = TYPE.QuestionMark;

	const NULL = 0;
	const MIN_BUFFER_SIZE = 16 * 1024;
	const OFFSET_MASK = 0x00FFFFFF;
	const TYPE_SHIFT = 24;

	function computeLinesAndColumns(tokenizer, source) {
		const sourceLength = source.length;
		const start = firstCharOffset(source);
		let lines = tokenizer.lines;
		let line = tokenizer.startLine;
		let columns = tokenizer.columns;
		let column = tokenizer.startColumn;

		if (lines === null || lines.length < sourceLength + 1) {
			lines = new SafeUint32Array(Math.max(sourceLength + 1024, MIN_BUFFER_SIZE));
			columns = new SafeUint32Array(lines.length);
		}

		let i;
		for (i = start; i < sourceLength; i++) {
			const code = source.charCodeAt(i);

			lines[i] = line;
			columns[i] = column++;

			if (code === NEW_LINE || code === R || code === F) {
				if (code === R && i + 1 < sourceLength && source.charCodeAt(i + 1) === NEW_LINE) {
					i++;
					lines[i] = line;
					columns[i] = column;
				}

				line++;
				column = 1;
			}
		}

		lines[i] = line;
		columns[i] = column;

		tokenizer.linesAnsColumnsComputed = true;
		tokenizer.lines = lines;
		tokenizer.columns = columns;
	}

	function tokenLayout(tokenizer, source, startPos) {
		const sourceLength = source.length;
		let offsetAndType = tokenizer.offsetAndType;
		let balance = tokenizer.balance;
		let tokenCount = 0;
		let prevType = 0;
		let offset = startPos;
		let anchor = 0;
		let balanceCloseCode = 0;
		let balanceStart = 0;
		let balancePrev = 0;

		if (offsetAndType === null || offsetAndType.length < sourceLength + 1) {
			offsetAndType = new SafeUint32Array(sourceLength + 1024);
			balance = new SafeUint32Array(sourceLength + 1024);
		}

		while (offset < sourceLength) {
			let code = source.charCodeAt(offset);
			let type = code < 0x80 ? SYMBOL_TYPE[code] : IDENTIFIER;

			balance[tokenCount] = sourceLength;

			switch (type) {
				case WHITESPACE:
					offset = findWhiteSpaceEnd(source, offset + 1);
					break;

				case PUNCTUATOR:
					switch (code) {
						case balanceCloseCode:
							balancePrev = balanceStart & OFFSET_MASK;
							balanceStart = balance[balancePrev];
							balanceCloseCode = balanceStart >> TYPE_SHIFT;
							balance[tokenCount] = balancePrev;
							balance[balancePrev++] = tokenCount;
							for (; balancePrev < tokenCount; balancePrev++) {
								if (balance[balancePrev] === sourceLength) {
									balance[balancePrev] = tokenCount;
								}
							}
							break;

						case LEFTSQUAREBRACKET:
							balance[tokenCount] = balanceStart;
							balanceCloseCode = RIGHTSQUAREBRACKET;
							balanceStart = (balanceCloseCode << TYPE_SHIFT) | tokenCount;
							break;

						case LEFTCURLYBRACKET:
							balance[tokenCount] = balanceStart;
							balanceCloseCode = RIGHTCURLYBRACKET;
							balanceStart = (balanceCloseCode << TYPE_SHIFT) | tokenCount;
							break;

						case LEFTPARENTHESIS:
							balance[tokenCount] = balanceStart;
							balanceCloseCode = RIGHTPARENTHESIS;
							balanceStart = (balanceCloseCode << TYPE_SHIFT) | tokenCount;
							break;
					}

					// /*
					if (code === STAR && prevType === SLASH) {
						type = COMMENT;
						offset = findCommentEnd(source, offset + 1);
						tokenCount--; // rewrite prev token
						break;
					}

					// edge case for -.123 and +.123
					if (code === FULLSTOP && (prevType === PLUSSIGN || prevType === HYPHENMINUS)) {
						if (offset + 1 < sourceLength && isNumber(source.charCodeAt(offset + 1))) {
							type = NUMBER;
							offset = findNumberEnd(source, offset + 2, false);
							tokenCount--; // rewrite prev token
							break;
						}
					}

					// <!--
					if (code === EXCLAMATIONMARK && prevType === LESSTHANSIGN) {
						if (offset + 2 < sourceLength &&
							source.charCodeAt(offset + 1) === HYPHENMINUS &&
							source.charCodeAt(offset + 2) === HYPHENMINUS) {
							type = CDO;
							offset = offset + 3;
							tokenCount--; // rewrite prev token
							break;
						}
					}

					// -->
					if (code === HYPHENMINUS && prevType === HYPHENMINUS) {
						if (offset + 1 < sourceLength && source.charCodeAt(offset + 1) === GREATERTHANSIGN) {
							type = CDC;
							offset = offset + 2;
							tokenCount--; // rewrite prev token
							break;
						}
					}

					// ident(
					if (code === LEFTPARENTHESIS && prevType === IDENTIFIER) {
						offset = offset + 1;
						tokenCount--; // rewrite prev token
						balance[tokenCount] = balance[tokenCount + 1];
						balanceStart--;

						// 4 char length identifier and equal to `url(` (case insensitive)
						if (offset - anchor === 4 && cmpStr(source, anchor, offset, "url(")) {
							// special case for url() because it can contain any symbols sequence with few exceptions
							anchor = findWhiteSpaceEnd(source, offset);
							code = source.charCodeAt(anchor);
							if (code !== LEFTPARENTHESIS &&
								code !== RIGHTPARENTHESIS &&
								code !== QUOTATIONMARK &&
								code !== APOSTROPHE) {
								// url(
								offsetAndType[tokenCount++] = (URL << TYPE_SHIFT) | offset;
								balance[tokenCount] = sourceLength;

								// ws*
								if (anchor !== offset) {
									offsetAndType[tokenCount++] = (WHITESPACE << TYPE_SHIFT) | anchor;
									balance[tokenCount] = sourceLength;
								}

								// raw
								type = RAW;
								offset = findUrlRawEnd(source, anchor);
							} else {
								type = URL;
							}
						} else {
							type = FUNCTION;
						}
						break;
					}

					type = code;
					offset = offset + 1;
					break;

				case NUMBER:
					offset = findNumberEnd(source, offset + 1, prevType !== FULLSTOP);

					// merge number with a preceding dot, dash or plus
					if (prevType === FULLSTOP ||
						prevType === HYPHENMINUS ||
						prevType === PLUSSIGN) {
						tokenCount--; // rewrite prev token
					}

					break;

				case STRING:
					offset = findStringEnd(source, offset + 1, code);
					break;

				default:
					anchor = offset;
					offset = findIdentifierEnd(source, offset);

					// merge identifier with a preceding dash
					if (prevType === HYPHENMINUS) {
						// rewrite prev token
						tokenCount--;
						// restore prev prev token type
						// for case @-prefix-ident
						prevType = tokenCount === 0 ? 0 : offsetAndType[tokenCount - 1] >> TYPE_SHIFT;
					}

					if (prevType === COMMERCIALAT) {
						// rewrite prev token and change type to <at-keyword-token>
						tokenCount--;
						type = ATKEYWORD;
					}
			}

			offsetAndType[tokenCount++] = (type << TYPE_SHIFT) | offset;
			prevType = type;
		}

		// finalize arrays
		offsetAndType[tokenCount] = offset;
		balance[tokenCount] = sourceLength;
		balance[sourceLength] = sourceLength; // prevents false positive balance match with any token
		while (balanceStart !== 0) {
			balancePrev = balanceStart & OFFSET_MASK;
			balanceStart = balance[balancePrev];
			balance[balancePrev] = sourceLength;
		}

		tokenizer.offsetAndType = offsetAndType;
		tokenizer.tokenCount = tokenCount;
		tokenizer.balance = balance;
	}

	//
	// tokenizer
	//

	function Tokenizer(source, startOffset, startLine, startColumn) {
		this.offsetAndType = null;
		this.balance = null;
		this.lines = null;
		this.columns = null;

		this.setSource(source, startOffset, startLine, startColumn);
	}

	Tokenizer.prototype = {
		setSource: function (source, startOffset, startLine, startColumn) {
			const safeSource = String(source || "");
			const start = firstCharOffset(safeSource);

			this.source = safeSource;
			this.firstCharOffset = start;
			this.startOffset = typeof startOffset === "undefined" ? 0 : startOffset;
			this.startLine = typeof startLine === "undefined" ? 1 : startLine;
			this.startColumn = typeof startColumn === "undefined" ? 1 : startColumn;
			this.linesAnsColumnsComputed = false;

			this.eof = false;
			this.currentToken = -1;
			this.tokenType = 0;
			this.tokenStart = start;
			this.tokenEnd = start;

			tokenLayout(this, safeSource, start);
			this.next();
		},

		lookupType: function (offset) {
			offset += this.currentToken;

			if (offset < this.tokenCount) {
				return this.offsetAndType[offset] >> TYPE_SHIFT;
			}

			return NULL;
		},
		lookupNonWSType: function (offset) {
			offset += this.currentToken;

			for (let type; offset < this.tokenCount; offset++) {
				type = this.offsetAndType[offset] >> TYPE_SHIFT;

				if (type !== WHITESPACE) {
					return type;
				}
			}

			return NULL;
		},
		lookupValue: function (offset, referenceStr) {
			offset += this.currentToken;

			if (offset < this.tokenCount) {
				return cmpStr(
					this.source,
					this.offsetAndType[offset - 1] & OFFSET_MASK,
					this.offsetAndType[offset] & OFFSET_MASK,
					referenceStr
				);
			}

			return false;
		},
		getTokenStart: function (tokenNum) {
			if (tokenNum === this.currentToken) {
				return this.tokenStart;
			}

			if (tokenNum > 0) {
				return tokenNum < this.tokenCount
					? this.offsetAndType[tokenNum - 1] & OFFSET_MASK
					: this.offsetAndType[this.tokenCount] & OFFSET_MASK;
			}

			return this.firstCharOffset;
		},
		getOffsetExcludeWS: function () {
			if (this.currentToken > 0) {
				if ((this.offsetAndType[this.currentToken - 1] >> TYPE_SHIFT) === WHITESPACE) {
					return this.currentToken > 1
						? this.offsetAndType[this.currentToken - 2] & OFFSET_MASK
						: this.firstCharOffset;
				}
			}
			return this.tokenStart;
		},
		getRawLength: function (startToken, endTokenType1, endTokenType2, includeTokenType2) {
			let cursor = startToken;
			let balanceEnd;

			loop:
			for (; cursor < this.tokenCount; cursor++) {
				balanceEnd = this.balance[cursor];

				// belance end points to offset before start
				if (balanceEnd < startToken) {
					break loop;
				}

				// check token is stop type
				switch (this.offsetAndType[cursor] >> TYPE_SHIFT) {
					case endTokenType1:
						break loop;

					case endTokenType2:
						if (includeTokenType2) {
							cursor++;
						}
						break loop;

					default:
						// fast forward to the end of balanced block
						if (this.balance[balanceEnd] === cursor) {
							cursor = balanceEnd;
						}
				}

			}

			return cursor - this.currentToken;
		},
		isBalanceEdge: function (pos) {
			const balanceStart = this.balance[this.currentToken];
			return balanceStart < pos;
		},

		getTokenValue: function () {
			return this.source.substring(this.tokenStart, this.tokenEnd);
		},
		substrToCursor: function (start) {
			return this.source.substring(start, this.tokenStart);
		},

		skipWS: function () {
			let skipTokenCount = 0;
			for (let i = this.currentToken; i < this.tokenCount; i++ , skipTokenCount++) {
				if ((this.offsetAndType[i] >> TYPE_SHIFT) !== WHITESPACE) {
					break;
				}
			}

			if (skipTokenCount > 0) {
				this.skip(skipTokenCount);
			}
		},
		skipSC: function () {
			while (this.tokenType === WHITESPACE || this.tokenType === COMMENT) {
				this.next();
			}
		},
		skip: function (tokenCount) {
			let next = this.currentToken + tokenCount;

			if (next < this.tokenCount) {
				this.currentToken = next;
				this.tokenStart = this.offsetAndType[next - 1] & OFFSET_MASK;
				next = this.offsetAndType[next];
				this.tokenType = next >> TYPE_SHIFT;
				this.tokenEnd = next & OFFSET_MASK;
			} else {
				this.currentToken = this.tokenCount;
				this.next();
			}
		},
		next: function () {
			let next = this.currentToken + 1;

			if (next < this.tokenCount) {
				this.currentToken = next;
				this.tokenStart = this.tokenEnd;
				next = this.offsetAndType[next];
				this.tokenType = next >> TYPE_SHIFT;
				this.tokenEnd = next & OFFSET_MASK;
			} else {
				this.currentToken = this.tokenCount;
				this.eof = true;
				this.tokenType = NULL;
				this.tokenStart = this.tokenEnd = this.source.length;
			}
		},

		eat: function (tokenType) {
			if (this.tokenType !== tokenType) {
				let offset = this.tokenStart;
				let message = NAME[tokenType] + " is expected";

				// tweak message and offset
				if (tokenType === IDENTIFIER) {
					// when identifier is expected but there is a function or url
					if (this.tokenType === FUNCTION || this.tokenType === URL) {
						offset = this.tokenEnd - 1;
						message += " but function found";
					}
				} else {
					// when test type is part of another token show error for current position + 1
					// e.g. eat(HYPHENMINUS) will fail on "-foo", but pointing on "-" is odd
					if (this.source.charCodeAt(this.tokenStart) === tokenType) {
						offset = offset + 1;
					}
				}

				this.error(message, offset);
			}

			this.next();
		},
		eatNonWS: function (tokenType) {
			this.skipWS();
			this.eat(tokenType);
		},

		consume: function (tokenType) {
			const value = this.getTokenValue();

			this.eat(tokenType);

			return value;
		},
		consumeFunctionName: function () {
			const name = this.source.substring(this.tokenStart, this.tokenEnd - 1);

			this.eat(FUNCTION);

			return name;
		},
		consumeNonWS: function (tokenType) {
			this.skipWS();

			return this.consume(tokenType);
		},

		expectIdentifier: function (name) {
			if (this.tokenType !== IDENTIFIER || cmpStr(this.source, this.tokenStart, this.tokenEnd, name) === false) {
				this.error("Identifier `" + name + "` is expected");
			}

			this.next();
		},

		getLocation: function (offset, filename) {
			if (!this.linesAnsColumnsComputed) {
				computeLinesAndColumns(this, this.source);
			}

			return {
				source: filename,
				offset: this.startOffset + offset,
				line: this.lines[offset],
				column: this.columns[offset]
			};
		},

		getLocationRange: function (start, end, filename) {
			if (!this.linesAnsColumnsComputed) {
				computeLinesAndColumns(this, this.source);
			}

			return {
				source: filename,
				start: {
					offset: this.startOffset + start,
					line: this.lines[start],
					column: this.columns[start]
				},
				end: {
					offset: this.startOffset + end,
					line: this.lines[end],
					column: this.columns[end]
				}
			};
		},

		error: function (message, offset) {
			const location = typeof offset !== "undefined" && offset < this.source.length
				? this.getLocation(offset)
				: this.eof
					? this.getLocation(findWhiteSpaceStart(this.source, this.source.length - 1))
					: this.getLocation(this.tokenStart);

			throw new CssSyntaxError(
				message || "Unexpected input",
				this.source,
				location.offset,
				location.line,
				location.column
			);
		},

		dump: function () {
			let offset = 0;

			return Array.prototype.slice.call(this.offsetAndType, 0, this.tokenCount).map(function (item, idx) {
				const start = offset;
				const end = item & OFFSET_MASK;

				offset = end;

				return {
					idx: idx,
					type: NAME[item >> TYPE_SHIFT],
					chunk: this.source.substring(start, end),
					balance: this.balance[idx]
				};
			}, this);
		}
	};

	// extend with error class
	Tokenizer.CssSyntaxError = CssSyntaxError;

	// extend tokenizer with constants
	Object.keys(constants).forEach(function (key) {
		Tokenizer[key] = constants[key];
	});

	// extend tokenizer with static methods from utils
	Object.keys(utils).forEach(function (key) {
		Tokenizer[key] = utils[key];
	});

	// warm up tokenizer to elimitate code branches that never execute
	// fix soft deoptimizations (insufficient type feedback)
	new Tokenizer("\n\r\r\n\f<!---->//\"\"''/*\r\n\f*/1a;.\\31\t+2{url(a);func();+1.2e3 -.4e-5 .6e+7}").getLocation();

	// ---

	const sequence = function readSequence(recognizer) {
		const children = this.createList();
		let child = null;
		const context = {
			recognizer: recognizer,
			space: null,
			ignoreWS: false,
			ignoreWSAfter: false
		};

		this.scanner.skipSC();

		while (!this.scanner.eof) {
			switch (this.scanner.tokenType) {
				case COMMENT:
					this.scanner.next();
					continue;

				case WHITESPACE:
					if (context.ignoreWS) {
						this.scanner.next();
					} else {
						context.space = this.WhiteSpace();
					}
					continue;
			}

			child = recognizer.getNode.call(this, context);

			if (child === undefined) {
				break;
			}

			if (context.space !== null) {
				children.push(context.space);
				context.space = null;
			}

			children.push(child);

			if (context.ignoreWSAfter) {
				context.ignoreWSAfter = false;
				context.ignoreWS = true;
			} else {
				context.ignoreWS = false;
			}
		}

		return children;
	};

	// ---

	const noop = function () { };

	function createParseContext(name) {
		return function () {
			return this[name]();
		};
	}

	function processConfig(config) {
		const parserConfig = {
			context: {},
			scope: {},
			atrule: {},
			pseudo: {}
		};

		if (config.parseContext) {
			for (let name in config.parseContext) {
				switch (typeof config.parseContext[name]) {
					case "function":
						parserConfig.context[name] = config.parseContext[name];
						break;

					case "string":
						parserConfig.context[name] = createParseContext(config.parseContext[name]);
						break;
				}
			}
		}

		if (config.scope) {
			for (let name in config.scope) {
				parserConfig.scope[name] = config.scope[name];
			}
		}

		if (config.atrule) {
			for (let name in config.atrule) {
				const atrule = config.atrule[name];

				if (atrule.parse) {
					parserConfig.atrule[name] = atrule.parse;
				}
			}
		}

		if (config.pseudo) {
			for (let name in config.pseudo) {
				const pseudo = config.pseudo[name];

				if (pseudo.parse) {
					parserConfig.pseudo[name] = pseudo.parse;
				}
			}
		}

		if (config.node) {
			for (let name in config.node) {
				parserConfig[name] = config.node[name].parse;
			}
		}

		return parserConfig;
	}

	function createParser(config) {
		const parser = {
			scanner: new Tokenizer(),
			filename: "<unknown>",
			needPositions: false,
			onParseError: noop,
			onParseErrorThrow: false,
			parseAtrulePrelude: true,
			parseRulePrelude: true,
			parseValue: true,
			parseCustomProperty: false,

			readSequence: sequence,

			createList: function () {
				return new List();
			},
			createSingleNodeList: function (node) {
				return new List().appendData(node);
			},
			getFirstListNode: function (list) {
				return list && list.first();
			},
			getLastListNode: function (list) {
				return list.last();
			},

			parseWithFallback: function (consumer, fallback) {
				const startToken = this.scanner.currentToken;

				try {
					return consumer.call(this);
				} catch (e) {
					if (this.onParseErrorThrow) {
						throw e;
					}

					const fallbackNode = fallback.call(this, startToken);

					this.onParseErrorThrow = true;
					this.onParseError(e, fallbackNode);
					this.onParseErrorThrow = false;

					return fallbackNode;
				}
			},

			getLocation: function (start, end) {
				if (this.needPositions) {
					return this.scanner.getLocationRange(
						start,
						end,
						this.filename
					);
				}

				return null;
			},
			getLocationFromList: function (list) {
				if (this.needPositions) {
					const head = this.getFirstListNode(list);
					const tail = this.getLastListNode(list);
					return this.scanner.getLocationRange(
						head !== null ? head.loc.start.offset - this.scanner.startOffset : this.scanner.tokenStart,
						tail !== null ? tail.loc.end.offset - this.scanner.startOffset : this.scanner.tokenStart,
						this.filename
					);
				}

				return null;
			}
		};

		config = processConfig(config || {});
		for (let key in config) {
			parser[key] = config[key];
		}

		return function (source, options) {
			options = options || {};

			const context = options.context || "default";
			let ast;

			parser.scanner.setSource(source, options.offset, options.line, options.column);
			parser.filename = options.filename || "<unknown>";
			parser.needPositions = Boolean(options.positions);
			parser.onParseError = typeof options.onParseError === "function" ? options.onParseError : noop;
			parser.onParseErrorThrow = false;
			parser.parseAtrulePrelude = "parseAtrulePrelude" in options ? Boolean(options.parseAtrulePrelude) : true;
			parser.parseRulePrelude = "parseRulePrelude" in options ? Boolean(options.parseRulePrelude) : true;
			parser.parseValue = "parseValue" in options ? Boolean(options.parseValue) : true;
			parser.parseCustomProperty = "parseCustomProperty" in options ? Boolean(options.parseCustomProperty) : false;

			if (!parser.context.hasOwnProperty(context)) {
				throw new Error("Unknown context `" + context + "`");
			}

			ast = parser.context[context].call(parser, options);

			if (!parser.scanner.eof) {
				parser.scanner.error();
			}

			return ast;
		};
	}

	// ---

	const U = 117; // 'u'.charCodeAt(0)

	const getNode = function defaultRecognizer(context) {
		switch (this.scanner.tokenType) {
			case NUMBERSIGN:
				return this.HexColor();

			case COMMA:
				context.space = null;
				context.ignoreWSAfter = true;
				return this.Operator();

			case SOLIDUS:
			case ASTERISK:
			case PLUSSIGN:
			case HYPHENMINUS:
				return this.Operator();

			case LEFTPARENTHESIS:
				return this.Parentheses(this.readSequence, context.recognizer);

			case LEFTSQUAREBRACKET:
				return this.Brackets(this.readSequence, context.recognizer);

			case STRING:
				return this.String();

			case NUMBER:
				switch (this.scanner.lookupType(1)) {
					case PERCENTSIGN:
						return this.Percentage();

					case IDENTIFIER:
						// edge case: number with folowing \0 and \9 hack shouldn"t to be a Dimension
						if (cmpChar(this.scanner.source, this.scanner.tokenEnd, BACKSLASH)) {
							return this.Number();
						} else {
							return this.Dimension();
						}

					default:
						return this.Number();
				}

			case FUNCTION:
				return this.Function(this.readSequence, context.recognizer);

			case URL:
				return this.Url();

			case IDENTIFIER:
				// check for unicode range, it should start with u+ or U+
				if (cmpChar(this.scanner.source, this.scanner.tokenStart, U) &&
					cmpChar(this.scanner.source, this.scanner.tokenStart + 1, PLUSSIGN)) {
					return this.UnicodeRange();
				} else {
					return this.Identifier();
				}
		}
	};

	// ---

	const AtrulePrelude = {
		getNode: getNode
	};

	// ---

	function Selector_getNode(context) {
		switch (this.scanner.tokenType) {
			case PLUSSIGN:
			case GREATERTHANSIGN:
			case TILDE:
				context.space = null;
				context.ignoreWSAfter = true;
				return this.Combinator();

			case SOLIDUS:  // /deep/
				return this.Combinator();

			case FULLSTOP:
				return this.ClassSelector();

			case LEFTSQUAREBRACKET:
				return this.AttributeSelector();

			case NUMBERSIGN:
				return this.IdSelector();

			case COLON:
				if (this.scanner.lookupType(1) === COLON) {
					return this.PseudoElementSelector();
				} else {
					return this.PseudoClassSelector();
				}

			case IDENTIFIER:
			case ASTERISK:
			case VERTICALLINE:
				return this.TypeSelector();

			case NUMBER:
				return this.Percentage();
		}
	}

	const Selector = {
		getNode: Selector_getNode
	};

	// ---

	const Value_getNode = function defaultRecognizer(context) {
		switch (this.scanner.tokenType) {
			case NUMBERSIGN:
				return this.HexColor();

			case COMMA:
				context.space = null;
				context.ignoreWSAfter = true;
				return this.Operator();

			case SOLIDUS:
			case ASTERISK:
			case PLUSSIGN:
			case HYPHENMINUS:
				return this.Operator();

			case LEFTPARENTHESIS:
				return this.Parentheses(this.readSequence, context.recognizer);

			case LEFTSQUAREBRACKET:
				return this.Brackets(this.readSequence, context.recognizer);

			case STRING:
				return this.String();

			case NUMBER:
				switch (this.scanner.lookupType(1)) {
					case PERCENTSIGN:
						return this.Percentage();

					case IDENTIFIER:
						// edge case: number with folowing \0 and \9 hack shouldn't to be a Dimension
						if (cmpChar(this.scanner.source, this.scanner.tokenEnd, BACKSLASH)) {
							return this.Number();
						} else {
							return this.Dimension();
						}

					default:
						return this.Number();
				}

			case FUNCTION:
				return this.Function(this.readSequence, context.recognizer);

			case URL:
				return this.Url();

			case IDENTIFIER:
				// check for unicode range, it should start with u+ or U+
				if (cmpChar(this.scanner.source, this.scanner.tokenStart, U) &&
					cmpChar(this.scanner.source, this.scanner.tokenStart + 1, PLUSSIGN)) {
					return this.UnicodeRange();
				} else {
					return this.Identifier();
				}
		}
	};

	// ---

	// https://drafts.csswg.org/css-images-4/#element-notation
	// https://developer.mozilla.org/en-US/docs/Web/CSS/element
	const Value_Element = function () {
		this.scanner.skipSC();

		const children = this.createSingleNodeList(
			this.IdSelector()
		);

		this.scanner.skipSC();

		return children;
	};

	// ---

	// legacy IE function
	// expression '(' raw ')'
	const Value_expression = function () {
		return this.createSingleNodeList(
			this.Raw(this.scanner.currentToken, 0, 0, false, false)
		);
	};

	// ---	

	// let '(' ident (',' <value>? )? ')'
	const Value_var = function () {
		const children = this.createList();

		this.scanner.skipSC();

		const identStart = this.scanner.tokenStart;

		this.scanner.eat(HYPHENMINUS);
		if (this.scanner.source.charCodeAt(this.scanner.tokenStart) !== HYPHENMINUS) {
			this.scanner.error("HyphenMinus is expected");
		}
		this.scanner.eat(IDENTIFIER);

		children.push({
			type: "Identifier",
			loc: this.getLocation(identStart, this.scanner.tokenStart),
			name: this.scanner.substrToCursor(identStart)
		});

		this.scanner.skipSC();

		if (this.scanner.tokenType === COMMA) {
			children.push(this.Operator());
			children.push(this.parseCustomProperty
				? this.Value(null)
				: this.Raw(this.scanner.currentToken, EXCLAMATIONMARK, SEMICOLON, false, false)
			);
		}

		return children;
	};

	// ---

	const Value = {
		getNode: Value_getNode,
		"-moz-element": Value_Element,
		"element": Value_Element,
		"expression": Value_expression,
		"let": Value_var
	};

	// ---

	const scope = {
		AtrulePrelude: AtrulePrelude,
		Selector: Selector,
		Value: Value
	};

	// ---

	const fontFace = {
		parse: {
			prelude: null,
			block: function () {
				return this.Block(true);
			}
		}
	};

	// ---

	const _import = {
		parse: {
			prelude: function () {
				const children = this.createList();

				this.scanner.skipSC();

				switch (this.scanner.tokenType) {
					case STRING:
						children.push(this.String());
						break;

					case URL:
						children.push(this.Url());
						break;

					default:
						this.scanner.error("String or url() is expected");
				}

				if (this.scanner.lookupNonWSType(0) === IDENTIFIER ||
					this.scanner.lookupNonWSType(0) === LEFTPARENTHESIS) {
					children.push(this.WhiteSpace());
					children.push(this.MediaQueryList());
				}

				return children;
			},
			block: null
		}
	};

	// ---

	const media = {
		parse: {
			prelude: function () {
				return this.createSingleNodeList(
					this.MediaQueryList()
				);
			},
			block: function () {
				return this.Block(false);
			}
		}
	};

	// ---

	const page = {
		parse: {
			prelude: function () {
				return this.createSingleNodeList(
					this.SelectorList()
				);
			},
			block: function () {
				return this.Block(true);
			}
		}
	};

	// ---

	function supports_consumeRaw() {
		return this.createSingleNodeList(
			this.Raw(this.scanner.currentToken, 0, 0, false, false)
		);
	}

	function parentheses() {
		let index = 0;

		this.scanner.skipSC();

		// TODO: make it simplier
		if (this.scanner.tokenType === IDENTIFIER) {
			index = 1;
		} else if (this.scanner.tokenType === HYPHENMINUS &&
			this.scanner.lookupType(1) === IDENTIFIER) {
			index = 2;
		}

		if (index !== 0 && this.scanner.lookupNonWSType(index) === COLON) {
			return this.createSingleNodeList(
				this.Declaration()
			);
		}

		return readSequence.call(this);
	}

	function readSequence() {
		const children = this.createList();
		let space = null;
		let child;

		this.scanner.skipSC();

		scan:
		while (!this.scanner.eof) {
			switch (this.scanner.tokenType) {
				case WHITESPACE:
					space = this.WhiteSpace();
					continue;

				case COMMENT:
					this.scanner.next();
					continue;

				case FUNCTION:
					child = this.Function(supports_consumeRaw, this.scope.AtrulePrelude);
					break;

				case IDENTIFIER:
					child = this.Identifier();
					break;

				case LEFTPARENTHESIS:
					child = this.Parentheses(parentheses, this.scope.AtrulePrelude);
					break;

				default:
					break scan;
			}

			if (space !== null) {
				children.push(space);
				space = null;
			}

			children.push(child);
		}

		return children;
	}

	const supports = {
		parse: {
			prelude: function () {
				const children = readSequence.call(this);

				if (this.getFirstListNode(children) === null) {
					this.scanner.error("Condition is expected");
				}

				return children;
			},
			block: function () {
				return this.Block(false);
			}
		}
	};

	// ---

	const atrule = {
		"font-face": fontFace,
		"import": _import,
		media: media,
		page: page,
		supports: supports
	};

	// ---

	const dir = {
		parse: function () {
			return this.createSingleNodeList(
				this.Identifier()
			);
		}
	};

	// ---

	const has = {
		parse: function () {
			return this.createSingleNodeList(
				this.SelectorList()
			);
		}
	};

	// ---

	const lang = {
		parse: function () {
			return this.createSingleNodeList(
				this.Identifier()
			);
		}
	};

	// ---

	const matches = {
		parse: function selectorList() {
			return this.createSingleNodeList(
				this.SelectorList()
			);
		}
	};
	const not = matches;

	// ---

	const ALLOW_OF_CLAUSE = true;

	const nthChild = {
		parse: function nthWithOfClause() {
			return this.createSingleNodeList(
				this.Nth(ALLOW_OF_CLAUSE)
			);
		}
	};
	const nthLastChild = nthChild;

	// ---

	const DISALLOW_OF_CLAUSE = false;

	const nthLastOfType = {
		parse: function nth() {
			return this.createSingleNodeList(
				this.Nth(DISALLOW_OF_CLAUSE)
			);
		}
	};
	const nthOfType = nthLastOfType;

	// ---

	const slotted = {
		parse: function compoundSelector() {
			return this.createSingleNodeList(
				this.Selector()
			);
		}
	};

	// ---

	const pseudo = {
		dir: dir,
		has: has,
		lang: lang,
		matches: matches,
		not: not,
		"nth-child": nthChild,
		"nth-last-child": nthLastChild,
		"nth-last-of-type": nthLastOfType,
		"nth-of-type": nthOfType,
		slotted: slotted
	};

	// ---

	const AnPlusB_N = 110; // 'n'.charCodeAt(0)
	const DISALLOW_SIGN = true;
	const ALLOW_SIGN = false;

	function checkTokenIsInteger(scanner, disallowSign) {
		let pos = scanner.tokenStart;

		if (scanner.source.charCodeAt(pos) === PLUSSIGN ||
			scanner.source.charCodeAt(pos) === HYPHENMINUS) {
			if (disallowSign) {
				scanner.error();
			}
			pos++;
		}

		for (; pos < scanner.tokenEnd; pos++) {
			if (!isNumber(scanner.source.charCodeAt(pos))) {
				scanner.error("Unexpected input", pos);
			}
		}
	}

	// An+B microsyntax https://www.w3.org/TR/css-syntax-3/#anb
	const AnPlusB = {
		name: "AnPlusB",
		structure: {
			a: [String, null],
			b: [String, null]
		},
		parse: function () {
			const start = this.scanner.tokenStart;
			let end = start;
			let prefix = "";
			let a = null;
			let b = null;

			if (this.scanner.tokenType === NUMBER ||
				this.scanner.tokenType === PLUSSIGN) {
				checkTokenIsInteger(this.scanner, ALLOW_SIGN);
				prefix = this.scanner.getTokenValue();
				this.scanner.next();
				end = this.scanner.tokenStart;
			}

			if (this.scanner.tokenType === IDENTIFIER) {
				let bStart = this.scanner.tokenStart;

				if (cmpChar(this.scanner.source, bStart, HYPHENMINUS)) {
					if (prefix === "") {
						prefix = "-";
						bStart++;
					} else {
						this.scanner.error("Unexpected hyphen minus");
					}
				}

				if (!cmpChar(this.scanner.source, bStart, AnPlusB_N)) {
					this.scanner.error();
				}

				a = prefix === "" ? "1" :
					prefix === "+" ? "+1" :
						prefix === "-" ? "-1" :
							prefix;

				const len = this.scanner.tokenEnd - bStart;
				if (len > 1) {
					// ..n-..
					if (this.scanner.source.charCodeAt(bStart + 1) !== HYPHENMINUS) {
						this.scanner.error("Unexpected input", bStart + 1);
					}

					if (len > 2) {
						// ..n-{number}..
						this.scanner.tokenStart = bStart + 2;
					} else {
						// ..n- {number}
						this.scanner.next();
						this.scanner.skipSC();
					}

					checkTokenIsInteger(this.scanner, DISALLOW_SIGN);
					b = "-" + this.scanner.getTokenValue();
					this.scanner.next();
					end = this.scanner.tokenStart;
				} else {
					prefix = "";
					this.scanner.next();
					end = this.scanner.tokenStart;
					this.scanner.skipSC();

					if (this.scanner.tokenType === HYPHENMINUS ||
						this.scanner.tokenType === PLUSSIGN) {
						prefix = this.scanner.getTokenValue();
						this.scanner.next();
						this.scanner.skipSC();
					}

					if (this.scanner.tokenType === NUMBER) {
						checkTokenIsInteger(this.scanner, prefix !== "");

						if (!isNumber(this.scanner.source.charCodeAt(this.scanner.tokenStart))) {
							prefix = this.scanner.source.charAt(this.scanner.tokenStart);
							this.scanner.tokenStart++;
						}

						if (prefix === "") {
							// should be an operator before number
							this.scanner.error();
						} else if (prefix === "+") {
							// plus is using by default
							prefix = "";
						}

						b = prefix + this.scanner.getTokenValue();

						this.scanner.next();
						end = this.scanner.tokenStart;
					} else {
						if (prefix) {
							this.scanner.eat(NUMBER);
						}
					}
				}
			} else {
				if (prefix === "" || prefix === "+") { // no number
					this.scanner.error(
						"Number or identifier is expected",
						this.scanner.tokenStart + (
							this.scanner.tokenType === PLUSSIGN ||
							this.scanner.tokenType === HYPHENMINUS
						)
					);
				}

				b = prefix;
			}

			return {
				type: "AnPlusB",
				loc: this.getLocation(start, end),
				a: a,
				b: b
			};
		},
		generate: function (node) {
			const a = node.a !== null && node.a !== undefined;
			let b = node.b !== null && node.b !== undefined;

			if (a) {
				this.chunk(
					node.a === "+1" ? "+n" :
						node.a === "1" ? "n" :
							node.a === "-1" ? "-n" :
								node.a + "n"
				);

				if (b) {
					b = String(node.b);
					if (b.charAt(0) === "-" || b.charAt(0) === "+") {
						this.chunk(b.charAt(0));
						this.chunk(b.substr(1));
					} else {
						this.chunk("+");
						this.chunk(b);
					}
				}
			} else {
				this.chunk(String(node.b));
			}
		}
	};

	// ---

	function Atrule_consumeRaw(startToken) {
		return this.Raw(startToken, SEMICOLON, LEFTCURLYBRACKET, false, true);
	}

	function isDeclarationBlockAtrule() {
		for (let offset = 1, type; type = this.scanner.lookupType(offset); offset++) { // eslint-disable-line no-cond-assign
			if (type === RIGHTCURLYBRACKET) {
				return true;
			}

			if (type === LEFTCURLYBRACKET ||
				type === ATKEYWORD) {
				return false;
			}
		}

		return false;
	}

	const Atrule = {
		name: "Atrule",
		structure: {
			name: String,
			prelude: ["AtrulePrelude", "Raw", null],
			block: ["Block", null]
		},
		parse: function () {
			const start = this.scanner.tokenStart;
			let name;
			let nameLowerCase;
			let prelude = null;
			let block = null;

			this.scanner.eat(ATKEYWORD);

			name = this.scanner.substrToCursor(start + 1);
			nameLowerCase = name.toLowerCase();
			this.scanner.skipSC();

			// parse prelude
			if (this.scanner.eof === false &&
				this.scanner.tokenType !== LEFTCURLYBRACKET &&
				this.scanner.tokenType !== SEMICOLON) {
				if (this.parseAtrulePrelude) {
					prelude = this.parseWithFallback(this.AtrulePrelude.bind(this, name), Atrule_consumeRaw);

					// turn empty AtrulePrelude into null
					if (prelude.type === "AtrulePrelude" && prelude.children.head === null) {
						prelude = null;
					}
				} else {
					prelude = Atrule_consumeRaw.call(this, this.scanner.currentToken);
				}

				this.scanner.skipSC();
			}

			switch (this.scanner.tokenType) {
				case SEMICOLON:
					this.scanner.next();
					break;

				case LEFTCURLYBRACKET:
					if (this.atrule.hasOwnProperty(nameLowerCase) &&
						typeof this.atrule[nameLowerCase].block === "function") {
						block = this.atrule[nameLowerCase].block.call(this);
					} else {
						// TODO: should consume block content as Raw?
						block = this.Block(isDeclarationBlockAtrule.call(this));
					}

					break;
			}

			return {
				type: "Atrule",
				loc: this.getLocation(start, this.scanner.tokenStart),
				name: name,
				prelude: prelude,
				block: block
			};
		},
		generate: function (node) {
			this.chunk("@");
			this.chunk(node.name);

			if (node.prelude !== null) {
				this.chunk(" ");
				this.node(node.prelude);
			}

			if (node.block) {
				this.node(node.block);
			} else {
				this.chunk(";");
			}
		},
		walkContext: "atrule"
	};

	// ---

	const Syntax_AtrulePrelude = {
		name: "AtrulePrelude",
		structure: {
			children: [[]]
		},
		parse: function (name) {
			let children = null;

			if (name !== null) {
				name = name.toLowerCase();
			}

			this.scanner.skipSC();

			if (this.atrule.hasOwnProperty(name) &&
				typeof this.atrule[name].prelude === "function") {
				// custom consumer
				children = this.atrule[name].prelude.call(this);
			} else {
				// default consumer
				children = this.readSequence(this.scope.AtrulePrelude);
			}

			this.scanner.skipSC();

			if (this.scanner.eof !== true &&
				this.scanner.tokenType !== LEFTCURLYBRACKET &&
				this.scanner.tokenType !== SEMICOLON) {
				this.scanner.error("Semicolon or block is expected");
			}

			if (children === null) {
				children = this.createList();
			}

			return {
				type: "AtrulePrelude",
				loc: this.getLocationFromList(children),
				children: children
			};
		},
		generate: function (node) {
			this.children(node);
		},
		walkContext: "atrulePrelude"
	};

	// ---

	function getAttributeName() {
		if (this.scanner.eof) {
			this.scanner.error("Unexpected end of input");
		}

		const start = this.scanner.tokenStart;
		let expectIdentifier = false;
		let checkColon = true;

		if (this.scanner.tokenType === ASTERISK) {
			expectIdentifier = true;
			checkColon = false;
			this.scanner.next();
		} else if (this.scanner.tokenType !== VERTICALLINE) {
			this.scanner.eat(IDENTIFIER);
		}

		if (this.scanner.tokenType === VERTICALLINE) {
			if (this.scanner.lookupType(1) !== EQUALSSIGN) {
				this.scanner.next();
				this.scanner.eat(IDENTIFIER);
			} else if (expectIdentifier) {
				this.scanner.error("Identifier is expected", this.scanner.tokenEnd);
			}
		} else if (expectIdentifier) {
			this.scanner.error("Vertical line is expected");
		}

		if (checkColon && this.scanner.tokenType === COLON) {
			this.scanner.next();
			this.scanner.eat(IDENTIFIER);
		}

		return {
			type: "Identifier",
			loc: this.getLocation(start, this.scanner.tokenStart),
			name: this.scanner.substrToCursor(start)
		};
	}

	function getOperator() {
		const start = this.scanner.tokenStart;
		const tokenType = this.scanner.tokenType;

		if (tokenType !== EQUALSSIGN &&        // =
			tokenType !== TILDE &&             // ~=
			tokenType !== CIRCUMFLEXACCENT &&  // ^=
			tokenType !== DOLLARSIGN &&        // $=
			tokenType !== ASTERISK &&          // *=
			tokenType !== VERTICALLINE         // |=
		) {
			this.scanner.error("Attribute selector (=, ~=, ^=, $=, *=, |=) is expected");
		}

		if (tokenType === EQUALSSIGN) {
			this.scanner.next();
		} else {
			this.scanner.next();
			this.scanner.eat(EQUALSSIGN);
		}

		return this.scanner.substrToCursor(start);
	}

	// "[" S* attrib_name "]"
	// "[" S* attrib_name S* attrib_matcher S* [ IDENT | STRING ] S* attrib_flags? S* "]"
	const AttributeSelector = {
		name: "AttributeSelector",
		structure: {
			name: "Identifier",
			matcher: [String, null],
			value: ["String", "Identifier", null],
			flags: [String, null]
		},
		parse: function () {
			const start = this.scanner.tokenStart;
			let name;
			let matcher = null;
			let value = null;
			let flags = null;

			this.scanner.eat(LEFTSQUAREBRACKET);
			this.scanner.skipSC();

			name = getAttributeName.call(this);
			this.scanner.skipSC();

			if (this.scanner.tokenType !== RIGHTSQUAREBRACKET) {
				// avoid case `[name i]`
				if (this.scanner.tokenType !== IDENTIFIER) {
					matcher = getOperator.call(this);

					this.scanner.skipSC();

					value = this.scanner.tokenType === STRING
						? this.String()
						: this.Identifier();

					this.scanner.skipSC();
				}

				// attribute flags
				if (this.scanner.tokenType === IDENTIFIER) {
					flags = this.scanner.getTokenValue();
					this.scanner.next();

					this.scanner.skipSC();
				}
			}

			this.scanner.eat(RIGHTSQUAREBRACKET);

			return {
				type: "AttributeSelector",
				loc: this.getLocation(start, this.scanner.tokenStart),
				name: name,
				matcher: matcher,
				value: value,
				flags: flags
			};
		},
		generate: function (node) {
			let flagsPrefix = " ";

			this.chunk("[");
			this.node(node.name);

			if (node.matcher !== null) {
				this.chunk(node.matcher);

				if (node.value !== null) {
					this.node(node.value);

					// space between string and flags is not required
					if (node.value.type === "String") {
						flagsPrefix = "";
					}
				}
			}

			if (node.flags !== null) {
				this.chunk(flagsPrefix);
				this.chunk(node.flags);
			}

			this.chunk("]");
		}
	};

	// ---

	function Block_consumeRaw(startToken) {
		return this.Raw(startToken, 0, 0, false, true);
	}
	function consumeRule() {
		return this.parseWithFallback(this.Rule, Block_consumeRaw);
	}
	function consumeRawDeclaration(startToken) {
		return this.Raw(startToken, 0, SEMICOLON, true, true);
	}
	function consumeDeclaration() {
		if (this.scanner.tokenType === SEMICOLON) {
			return consumeRawDeclaration.call(this, this.scanner.currentToken);
		}

		const node = this.parseWithFallback(this.Declaration, consumeRawDeclaration);

		if (this.scanner.tokenType === SEMICOLON) {
			this.scanner.next();
		}

		return node;
	}

	const Block = {
		name: "Block",
		structure: {
			children: [[
				"Atrule",
				"Rule",
				"Declaration"
			]]
		},
		parse: function (isDeclaration) {
			const consumer = isDeclaration ? consumeDeclaration : consumeRule;

			const start = this.scanner.tokenStart;
			const children = this.createList();

			this.scanner.eat(LEFTCURLYBRACKET);

			scan:
			while (!this.scanner.eof) {
				switch (this.scanner.tokenType) {
					case RIGHTCURLYBRACKET:
						break scan;

					case WHITESPACE:
					case COMMENT:
						this.scanner.next();
						break;

					case ATKEYWORD:
						children.push(this.parseWithFallback(this.Atrule, Block_consumeRaw));
						break;

					default:
						children.push(consumer.call(this));
				}
			}

			if (!this.scanner.eof) {
				this.scanner.eat(RIGHTCURLYBRACKET);
			}

			return {
				type: "Block",
				loc: this.getLocation(start, this.scanner.tokenStart),
				children: children
			};
		},
		generate: function (node) {
			this.chunk("{");
			this.children(node, function (prev) {
				if (prev.type === "Declaration") {
					this.chunk(";");
				}
			});
			this.chunk("}");
		},
		walkContext: "block"
	};

	// ---

	const Brackets = {
		name: "Brackets",
		structure: {
			children: [[]]
		},
		parse: function (readSequence, recognizer) {
			const start = this.scanner.tokenStart;
			let children = null;

			this.scanner.eat(LEFTSQUAREBRACKET);

			children = readSequence.call(this, recognizer);

			if (!this.scanner.eof) {
				this.scanner.eat(RIGHTSQUAREBRACKET);
			}

			return {
				type: "Brackets",
				loc: this.getLocation(start, this.scanner.tokenStart),
				children: children
			};
		},
		generate: function (node) {
			this.chunk("[");
			this.children(node);
			this.chunk("]");
		}
	};

	// ---

	const Syntax_CDC = {
		name: "CDC",
		structure: [],
		parse: function () {
			const start = this.scanner.tokenStart;

			this.scanner.eat(TYPE_CDC); // -->

			return {
				type: "CDC",
				loc: this.getLocation(start, this.scanner.tokenStart)
			};
		},
		generate: function () {
			this.chunk("-->");
		}
	};

	// ---

	const Syntax_CDO = {
		name: "CDO",
		structure: [],
		parse: function () {
			const start = this.scanner.tokenStart;

			this.scanner.eat(TYPE_CDO); // <!--

			return {
				type: "CDO",
				loc: this.getLocation(start, this.scanner.tokenStart)
			};
		},
		generate: function () {
			this.chunk("<!--");
		}
	};

	// ---

	// '.' ident
	const ClassSelector = {
		name: "ClassSelector",
		structure: {
			name: String
		},
		parse: function () {
			this.scanner.eat(FULLSTOP);

			return {
				type: "ClassSelector",
				loc: this.getLocation(this.scanner.tokenStart - 1, this.scanner.tokenEnd),
				name: this.scanner.consume(IDENTIFIER)
			};
		},
		generate: function (node) {
			this.chunk(".");
			this.chunk(node.name);
		}
	};

	// ---

	// + | > | ~ | /deep/
	const Combinator = {
		name: "Combinator",
		structure: {
			name: String
		},
		parse: function () {
			const start = this.scanner.tokenStart;

			switch (this.scanner.tokenType) {
				case GREATERTHANSIGN:
				case PLUSSIGN:
				case TILDE:
					this.scanner.next();
					break;

				case SOLIDUS:
					this.scanner.next();
					this.scanner.expectIdentifier("deep");
					this.scanner.eat(SOLIDUS);
					break;

				default:
					this.scanner.error("Combinator is expected");
			}

			return {
				type: "Combinator",
				loc: this.getLocation(start, this.scanner.tokenStart),
				name: this.scanner.substrToCursor(start)
			};
		},
		generate: function (node) {
			this.chunk(node.name);
		}
	};

	// ---

	// '/*' .* '*/'
	const Syntax_Comment = {
		name: "Comment",
		structure: {
			value: String
		},
		parse: function () {
			const start = this.scanner.tokenStart;
			let end = this.scanner.tokenEnd;

			if ((end - start + 2) >= 2 &&
				this.scanner.source.charCodeAt(end - 2) === ASTERISK &&
				this.scanner.source.charCodeAt(end - 1) === SOLIDUS) {
				end -= 2;
			}

			this.scanner.next();

			return {
				type: "Comment",
				loc: this.getLocation(start, this.scanner.tokenStart),
				value: this.scanner.source.substring(start + 2, end)
			};
		},
		generate: function (node) {
			this.chunk("/*");
			this.chunk(node.value);
			this.chunk("*/");
		}
	};

	// ---

	const hasOwnProperty = Object.prototype.hasOwnProperty;
	const keywords = Object.create(null);
	const properties = Object.create(null);
	const NAMES_HYPHENMINUS = 45; // "-".charCodeAt()

	function isCustomProperty(str, offset) {
		offset = offset || 0;

		return str.length - offset >= 2 &&
			str.charCodeAt(offset) === NAMES_HYPHENMINUS &&
			str.charCodeAt(offset + 1) === NAMES_HYPHENMINUS;
	}

	function getVendorPrefix(str, offset) {
		offset = offset || 0;

		// verdor prefix should be at least 3 chars length
		if (str.length - offset >= 3) {
			// vendor prefix starts with hyper minus following non-hyper minus
			if (str.charCodeAt(offset) === NAMES_HYPHENMINUS &&
				str.charCodeAt(offset + 1) !== NAMES_HYPHENMINUS) {
				// vendor prefix should contain a hyper minus at the ending
				const secondDashIndex = str.indexOf("-", offset + 2);

				if (secondDashIndex !== -1) {
					return str.substring(offset, secondDashIndex + 1);
				}
			}
		}

		return "";
	}

	function getKeywordDescriptor(keyword) {
		if (hasOwnProperty.call(keywords, keyword)) {
			return keywords[keyword];
		}

		const name = keyword.toLowerCase();

		if (hasOwnProperty.call(keywords, name)) {
			return keywords[keyword] = keywords[name];
		}

		const custom = names.isCustomProperty(name, 0);
		const vendor = !custom ? getVendorPrefix(name, 0) : "";

		return keywords[keyword] = Object.freeze({
			basename: name.substr(vendor.length),
			name: name,
			vendor: vendor,
			prefix: vendor,
			custom: custom
		});
	}

	function getPropertyDescriptor(property) {
		if (hasOwnProperty.call(properties, property)) {
			return properties[property];
		}

		let name = property;
		let hack = property[0];

		if (hack === "/") {
			hack = property[1] === "/" ? "//" : "/";
		} else if (hack !== "_" &&
			hack !== "*" &&
			hack !== "$" &&
			hack !== "#" &&
			hack !== "+") {
			hack = "";
		}

		const custom = isCustomProperty(name, hack.length);

		// re-use result when possible (the same as for lower case)
		if (!custom) {
			name = name.toLowerCase();
			if (hasOwnProperty.call(properties, name)) {
				return properties[property] = properties[name];
			}
		}

		const vendor = !custom ? getVendorPrefix(name, hack.length) : "";
		const prefix = name.substr(0, hack.length + vendor.length);

		return properties[property] = Object.freeze({
			basename: name.substr(prefix.length),
			name: name.substr(hack.length),
			hack: hack,
			vendor: vendor,
			prefix: prefix,
			custom: custom
		});
	}

	const names = {
		keyword: getKeywordDescriptor,
		property: getPropertyDescriptor,
		isCustomProperty: isCustomProperty,
		vendorPrefix: getVendorPrefix
	};

	// ---

	function consumeValueRaw(startToken) {
		return this.Raw(startToken, EXCLAMATIONMARK, SEMICOLON, false, true);
	}

	function consumeCustomPropertyRaw(startToken) {
		return this.Raw(startToken, EXCLAMATIONMARK, SEMICOLON, false, false);
	}

	function consumeValue() {
		const startValueToken = this.scanner.currentToken;
		const value = this.Value();

		if (value.type !== "Raw" &&
			this.scanner.eof === false &&
			this.scanner.tokenType !== SEMICOLON &&
			this.scanner.tokenType !== EXCLAMATIONMARK &&
			this.scanner.isBalanceEdge(startValueToken) === false) {
			this.scanner.error();
		}

		return value;
	}

	const Declaration = {
		name: "Declaration",
		structure: {
			important: [Boolean, String],
			property: String,
			value: ["Value", "Raw"]
		},
		parse: function () {
			const start = this.scanner.tokenStart;
			const startToken = this.scanner.currentToken;
			const property = readProperty.call(this);
			const customProperty = names.isCustomProperty(property);
			const parseValue = customProperty ? this.parseCustomProperty : this.parseValue;
			const consumeRaw = customProperty ? consumeCustomPropertyRaw : consumeValueRaw;
			let important = false;
			let value;

			this.scanner.skipSC();
			this.scanner.eat(COLON);

			if (!customProperty) {
				this.scanner.skipSC();
			}

			if (parseValue) {
				value = this.parseWithFallback(consumeValue, consumeRaw);
			} else {
				value = consumeRaw.call(this, this.scanner.currentToken);
			}

			if (this.scanner.tokenType === EXCLAMATIONMARK) {
				important = getImportant(this.scanner);
				this.scanner.skipSC();
			}

			// Do not include semicolon to range per spec
			// https://drafts.csswg.org/css-syntax/#declaration-diagram

			if (this.scanner.eof === false &&
				this.scanner.tokenType !== SEMICOLON &&
				this.scanner.isBalanceEdge(startToken) === false) {
				this.scanner.error();
			}

			return {
				type: "Declaration",
				loc: this.getLocation(start, this.scanner.tokenStart),
				important: important,
				property: property,
				value: value
			};
		},
		generate: function (node) {
			this.chunk(node.property);
			this.chunk(":");
			this.node(node.value);

			if (node.important) {
				this.chunk(node.important === true ? "!important" : "!" + node.important);
			}
		},
		walkContext: "declaration"
	};

	function readProperty() {
		const start = this.scanner.tokenStart;
		let prefix = 0;

		// hacks
		switch (this.scanner.tokenType) {
			case ASTERISK:
			case DOLLARSIGN:
			case PLUSSIGN:
			case NUMBERSIGN:
				prefix = 1;
				break;

			// TODO: not sure we should support this hack
			case SOLIDUS:
				prefix = this.scanner.lookupType(1) === SOLIDUS ? 2 : 1;
				break;
		}

		if (this.scanner.lookupType(prefix) === HYPHENMINUS) {
			prefix++;
		}

		if (prefix) {
			this.scanner.skip(prefix);
		}

		this.scanner.eat(IDENTIFIER);

		return this.scanner.substrToCursor(start);
	}

	// ! ws* important
	function getImportant(scanner) {
		scanner.eat(EXCLAMATIONMARK);
		scanner.skipSC();

		const important = scanner.consume(IDENTIFIER);

		// store original value in case it differ from `important`
		// for better original source restoring and hacks like `!ie` support
		return important === "important" ? true : important;
	}

	// ---

	function DeclarationList_consumeRaw(startToken) {
		return this.Raw(startToken, 0, SEMICOLON, true, true);
	}

	const DeclarationList = {
		name: "DeclarationList",
		structure: {
			children: [[
				"Declaration"
			]]
		},
		parse: function () {
			const children = this.createList();

			while (!this.scanner.eof) {
				switch (this.scanner.tokenType) {
					case WHITESPACE:
					case COMMENT:
					case SEMICOLON:
						this.scanner.next();
						break;

					default:
						children.push(this.parseWithFallback(this.Declaration, DeclarationList_consumeRaw));
				}
			}

			return {
				type: "DeclarationList",
				loc: this.getLocationFromList(children),
				children: children
			};
		},
		generate: function (node) {
			this.children(node, function (prev) {
				if (prev.type === "Declaration") {
					this.chunk(";");
				}
			});
		}
	};

	// ---

	// special reader for units to avoid adjoined IE hacks (i.e. '1px\9')
	function readUnit(scanner) {
		const unit = scanner.getTokenValue();
		const backSlashPos = unit.indexOf("\\");

		if (backSlashPos > 0) {
			// patch token offset
			scanner.tokenStart += backSlashPos;

			// return part before backslash
			return unit.substring(0, backSlashPos);
		}

		// no backslash in unit name
		scanner.next();

		return unit;
	}

	// number ident
	const Dimension = {
		name: "Dimension",
		structure: {
			value: String,
			unit: String
		},
		parse: function () {
			const start = this.scanner.tokenStart;
			const value = this.scanner.consume(NUMBER);
			const unit = readUnit(this.scanner);

			return {
				type: "Dimension",
				loc: this.getLocation(start, this.scanner.tokenStart),
				value: value,
				unit: unit
			};
		},
		generate: function (node) {
			this.chunk(node.value);
			this.chunk(node.unit);
		}
	};

	// ---

	// <function-token> <sequence> ')'
	const Syntax_Function = {
		name: "Function",
		structure: {
			name: String,
			children: [[]]
		},
		parse: function (readSequence, recognizer) {
			const start = this.scanner.tokenStart;
			const name = this.scanner.consumeFunctionName();
			const nameLowerCase = name.toLowerCase();
			let children;

			children = recognizer.hasOwnProperty(nameLowerCase)
				? recognizer[nameLowerCase].call(this, recognizer)
				: readSequence.call(this, recognizer);

			if (!this.scanner.eof) {
				this.scanner.eat(RIGHTPARENTHESIS);
			}

			return {
				type: "Function",
				loc: this.getLocation(start, this.scanner.tokenStart),
				name: name,
				children: children
			};
		},
		generate: function (node) {
			this.chunk(node.name);
			this.chunk("(");
			this.children(node);
			this.chunk(")");
		},
		walkContext: "function"
	};

	// ---

	function consumeHexSequence(scanner, required) {
		if (!isHex(scanner.source.charCodeAt(scanner.tokenStart))) {
			if (required) {
				scanner.error("Unexpected input", scanner.tokenStart);
			} else {
				return;
			}
		}

		for (let pos = scanner.tokenStart + 1; pos < scanner.tokenEnd; pos++) {
			const code = scanner.source.charCodeAt(pos);

			// break on non-hex char
			if (!isHex(code)) {
				// break token, exclude symbol
				scanner.tokenStart = pos;
				return;
			}
		}

		// token is full hex sequence, go to next token
		scanner.next();
	}

	// # ident
	const HexColor = {
		name: "HexColor",
		structure: {
			value: String
		},
		parse: function () {
			const start = this.scanner.tokenStart;

			this.scanner.eat(NUMBERSIGN);

			switch (this.scanner.tokenType) {
				case NUMBER:
					consumeHexSequence(this.scanner, true);

					// if token is identifier then number consists of hex only,
					// try to add identifier to result
					if (this.scanner.tokenType === IDENTIFIER) {
						consumeHexSequence(this.scanner, false);
					}

					break;

				case IDENTIFIER:
					consumeHexSequence(this.scanner, true);
					break;

				default:
					this.scanner.error("Number or identifier is expected");
			}

			return {
				type: "HexColor",
				loc: this.getLocation(start, this.scanner.tokenStart),
				value: this.scanner.substrToCursor(start + 1) // skip #
			};
		},
		generate: function (node) {
			this.chunk("#");
			this.chunk(node.value);
		}
	};

	// ---

	const Identifier = {
		name: "Identifier",
		structure: {
			name: String
		},
		parse: function () {
			return {
				type: "Identifier",
				loc: this.getLocation(this.scanner.tokenStart, this.scanner.tokenEnd),
				name: this.scanner.consume(IDENTIFIER)
			};
		},
		generate: function (node) {
			this.chunk(node.name);
		}
	};

	// ---

	// '#' ident
	const IdSelector = {
		name: "IdSelector",
		structure: {
			name: String
		},
		parse: function () {
			this.scanner.eat(NUMBERSIGN);

			return {
				type: "IdSelector",
				loc: this.getLocation(this.scanner.tokenStart - 1, this.scanner.tokenEnd),
				name: this.scanner.consume(IDENTIFIER)
			};
		},
		generate: function (node) {
			this.chunk("#");
			this.chunk(node.name);
		}
	};

	// ---

	const MediaFeature = {
		name: "MediaFeature",
		structure: {
			name: String,
			value: ["Identifier", "Number", "Dimension", "Ratio", null]
		},
		parse: function () {
			const start = this.scanner.tokenStart;
			let name;
			let value = null;

			this.scanner.eat(LEFTPARENTHESIS);
			this.scanner.skipSC();

			name = this.scanner.consume(IDENTIFIER);
			this.scanner.skipSC();

			if (this.scanner.tokenType !== RIGHTPARENTHESIS) {
				this.scanner.eat(COLON);
				this.scanner.skipSC();

				switch (this.scanner.tokenType) {
					case NUMBER:
						if (this.scanner.lookupType(1) === IDENTIFIER) {
							value = this.Dimension();
						} else if (this.scanner.lookupNonWSType(1) === SOLIDUS) {
							value = this.Ratio();
						} else {
							value = this.Number();
						}

						break;

					case IDENTIFIER:
						value = this.Identifier();

						break;

					default:
						this.scanner.error("Number, dimension, ratio or identifier is expected");
				}

				this.scanner.skipSC();
			}

			this.scanner.eat(RIGHTPARENTHESIS);

			return {
				type: "MediaFeature",
				loc: this.getLocation(start, this.scanner.tokenStart),
				name: name,
				value: value
			};
		},
		generate: function (node) {
			this.chunk("(");
			this.chunk(node.name);
			if (node.value !== null) {
				this.chunk(":");
				this.node(node.value);
			}
			this.chunk(")");
		}
	};

	// ---

	const MediaQuery = {
		name: "MediaQuery",
		structure: {
			children: [[
				"Identifier",
				"MediaFeature",
				"WhiteSpace"
			]]
		},
		parse: function () {
			this.scanner.skipSC();

			const children = this.createList();
			let child = null;
			let space = null;

			scan:
			while (!this.scanner.eof) {
				switch (this.scanner.tokenType) {
					case COMMENT:
						this.scanner.next();
						continue;

					case WHITESPACE:
						space = this.WhiteSpace();
						continue;

					case IDENTIFIER:
						child = this.Identifier();
						break;

					case LEFTPARENTHESIS:
						child = this.MediaFeature();
						break;

					default:
						break scan;
				}

				if (space !== null) {
					children.push(space);
					space = null;
				}

				children.push(child);
			}

			if (child === null) {
				this.scanner.error("Identifier or parenthesis is expected");
			}

			return {
				type: "MediaQuery",
				loc: this.getLocationFromList(children),
				children: children
			};
		},
		generate: function (node) {
			this.children(node);
		}
	};

	// ---

	const MediaQueryList = {
		name: "MediaQueryList",
		structure: {
			children: [[
				"MediaQuery"
			]]
		},
		parse: function (relative) {
			const children = this.createList();

			this.scanner.skipSC();

			while (!this.scanner.eof) {
				children.push(this.MediaQuery(relative));

				if (this.scanner.tokenType !== COMMA) {
					break;
				}

				this.scanner.next();
			}

			return {
				type: "MediaQueryList",
				loc: this.getLocationFromList(children),
				children: children
			};
		},
		generate: function (node) {
			this.children(node, function () {
				this.chunk(",");
			});
		}
	};

	// ---

	// https://drafts.csswg.org/css-syntax-3/#the-anb-type
	const Nth = {
		name: "Nth",
		structure: {
			nth: ["AnPlusB", "Identifier"],
			selector: ["SelectorList", null]
		},
		parse: function (allowOfClause) {
			this.scanner.skipSC();

			const start = this.scanner.tokenStart;
			let end = start;
			let selector = null;
			let query;

			if (this.scanner.lookupValue(0, "odd") || this.scanner.lookupValue(0, "even")) {
				query = this.Identifier();
			} else {
				query = this.AnPlusB();
			}

			this.scanner.skipSC();

			if (allowOfClause && this.scanner.lookupValue(0, "of")) {
				this.scanner.next();

				selector = this.SelectorList();

				if (this.needPositions) {
					end = this.getLastListNode(selector.children).loc.end.offset;
				}
			} else {
				if (this.needPositions) {
					end = query.loc.end.offset;
				}
			}

			return {
				type: "Nth",
				loc: this.getLocation(start, end),
				nth: query,
				selector: selector
			};
		},
		generate: function (node) {
			this.node(node.nth);
			if (node.selector !== null) {
				this.chunk(" of ");
				this.node(node.selector);
			}
		}
	};

	// ---

	const Syntax_Number = {
		name: "Number",
		structure: {
			value: String
		},
		parse: function () {
			return {
				type: "Number",
				loc: this.getLocation(this.scanner.tokenStart, this.scanner.tokenEnd),
				value: this.scanner.consume(NUMBER)
			};
		},
		generate: function (node) {
			this.chunk(node.value);
		}
	};

	// ---

	// '/' | '*' | ',' | ':' | '+' | '-'
	const Operator = {
		name: "Operator",
		structure: {
			value: String
		},
		parse: function () {
			const start = this.scanner.tokenStart;

			this.scanner.next();

			return {
				type: "Operator",
				loc: this.getLocation(start, this.scanner.tokenStart),
				value: this.scanner.substrToCursor(start)
			};
		},
		generate: function (node) {
			this.chunk(node.value);
		}
	};

	// ---

	const Parentheses = {
		name: "Parentheses",
		structure: {
			children: [[]]
		},
		parse: function (readSequence, recognizer) {
			const start = this.scanner.tokenStart;
			let children = null;

			this.scanner.eat(LEFTPARENTHESIS);

			children = readSequence.call(this, recognizer);

			if (!this.scanner.eof) {
				this.scanner.eat(RIGHTPARENTHESIS);
			}

			return {
				type: "Parentheses",
				loc: this.getLocation(start, this.scanner.tokenStart),
				children: children
			};
		},
		generate: function (node) {
			this.chunk("(");
			this.children(node);
			this.chunk(")");
		}
	};

	// ---

	const Percentage = {
		name: "Percentage",
		structure: {
			value: String
		},
		parse: function () {
			const start = this.scanner.tokenStart;
			const number = this.scanner.consume(NUMBER);

			this.scanner.eat(PERCENTSIGN);

			return {
				type: "Percentage",
				loc: this.getLocation(start, this.scanner.tokenStart),
				value: number
			};
		},
		generate: function (node) {
			this.chunk(node.value);
			this.chunk("%");
		}
	};

	// ---

	// : ident [ "(" .. ")" ]?
	const PseudoClassSelector = {
		name: "PseudoClassSelector",
		structure: {
			name: String,
			children: [["Raw"], null]
		},
		parse: function () {
			const start = this.scanner.tokenStart;
			let children = null;
			let name;
			let nameLowerCase;

			this.scanner.eat(COLON);

			if (this.scanner.tokenType === FUNCTION) {
				name = this.scanner.consumeFunctionName();
				nameLowerCase = name.toLowerCase();

				if (this.pseudo.hasOwnProperty(nameLowerCase)) {
					this.scanner.skipSC();
					children = this.pseudo[nameLowerCase].call(this);
					this.scanner.skipSC();
				} else {
					children = this.createList();
					children.push(
						this.Raw(this.scanner.currentToken, 0, 0, false, false)
					);
				}

				this.scanner.eat(RIGHTPARENTHESIS);
			} else {
				name = this.scanner.consume(IDENTIFIER);
			}

			return {
				type: "PseudoClassSelector",
				loc: this.getLocation(start, this.scanner.tokenStart),
				name: name,
				children: children
			};
		},
		generate: function (node) {
			this.chunk(":");
			this.chunk(node.name);

			if (node.children !== null) {
				this.chunk("(");
				this.children(node);
				this.chunk(")");
			}
		},
		walkContext: "function"
	};

	// ---

	// :: ident [ "(" .. ")" ]?
	const PseudoElementSelector = {
		name: "PseudoElementSelector",
		structure: {
			name: String,
			children: [["Raw"], null]
		},
		parse: function () {
			const start = this.scanner.tokenStart;
			let children = null;
			let name;
			let nameLowerCase;

			this.scanner.eat(COLON);
			this.scanner.eat(COLON);

			if (this.scanner.tokenType === FUNCTION) {
				name = this.scanner.consumeFunctionName();
				nameLowerCase = name.toLowerCase();

				if (this.pseudo.hasOwnProperty(nameLowerCase)) {
					this.scanner.skipSC();
					children = this.pseudo[nameLowerCase].call(this);
					this.scanner.skipSC();
				} else {
					children = this.createList();
					children.push(
						this.Raw(this.scanner.currentToken, 0, 0, false, false)
					);
				}

				this.scanner.eat(RIGHTPARENTHESIS);
			} else {
				name = this.scanner.consume(IDENTIFIER);
			}

			return {
				type: "PseudoElementSelector",
				loc: this.getLocation(start, this.scanner.tokenStart),
				name: name,
				children: children
			};
		},
		generate: function (node) {
			this.chunk("::");
			this.chunk(node.name);

			if (node.children !== null) {
				this.chunk("(");
				this.children(node);
				this.chunk(")");
			}
		},
		walkContext: "function"
	};

	// ---

	// Terms of <ratio> should to be a positive number (not zero or negative)
	// (see https://drafts.csswg.org/mediaqueries-3/#values)
	// However, -o-min-device-pixel-ratio takes fractional values as a ratio"s term
	// and this is using by letious sites. Therefore we relax checking on parse
	// to test a term is unsigned number without exponent part.
	// Additional checks may to be applied on lexer validation.
	function consumeNumber(scanner) {
		const value = scanner.consumeNonWS(NUMBER);

		for (let i = 0; i < value.length; i++) {
			const code = value.charCodeAt(i);
			if (!isNumber(code) && code !== FULLSTOP) {
				scanner.error("Unsigned number is expected", scanner.tokenStart - value.length + i);
			}
		}

		if (Number(value) === 0) {
			scanner.error("Zero number is not allowed", scanner.tokenStart - value.length);
		}

		return value;
	}

	// <positive-integer> S* "/" S* <positive-integer>
	const Ratio = {
		name: "Ratio",
		structure: {
			left: String,
			right: String
		},
		parse: function () {
			const start = this.scanner.tokenStart;
			const left = consumeNumber(this.scanner);
			let right;

			this.scanner.eatNonWS(SOLIDUS);
			right = consumeNumber(this.scanner);

			return {
				type: "Ratio",
				loc: this.getLocation(start, this.scanner.tokenStart),
				left: left,
				right: right
			};
		},
		generate: function (node) {
			this.chunk(node.left);
			this.chunk("/");
			this.chunk(node.right);
		}
	};

	// ---

	const Raw = {
		name: "Raw",
		structure: {
			value: String
		},
		parse: function (startToken, endTokenType1, endTokenType2, includeTokenType2, excludeWhiteSpace) {
			const startOffset = this.scanner.getTokenStart(startToken);
			let endOffset;

			this.scanner.skip(
				this.scanner.getRawLength(
					startToken,
					endTokenType1,
					endTokenType2,
					includeTokenType2
				)
			);

			if (excludeWhiteSpace && this.scanner.tokenStart > startOffset) {
				endOffset = this.scanner.getOffsetExcludeWS();
			} else {
				endOffset = this.scanner.tokenStart;
			}

			return {
				type: "Raw",
				loc: this.getLocation(startOffset, endOffset),
				value: this.scanner.source.substring(startOffset, endOffset)
			};
		},
		generate: function (node) {
			this.chunk(node.value);
		}
	};

	// ---

	function Rule_consumeRaw(startToken) {
		return this.Raw(startToken, LEFTCURLYBRACKET, 0, false, true);
	}

	function consumePrelude() {
		const prelude = this.SelectorList();

		if (prelude.type !== "Raw" &&
			this.scanner.eof === false &&
			this.scanner.tokenType !== LEFTCURLYBRACKET) {
			this.scanner.error();
		}

		return prelude;
	}

	const Rule = {
		name: "Rule",
		structure: {
			prelude: ["SelectorList", "Raw"],
			block: ["Block"]
		},
		parse: function () {
			const startToken = this.scanner.currentToken;
			const startOffset = this.scanner.tokenStart;
			let prelude;
			let block;

			if (this.parseRulePrelude) {
				prelude = this.parseWithFallback(consumePrelude, Rule_consumeRaw);
			} else {
				prelude = Rule_consumeRaw.call(this, startToken);
			}

			block = this.Block(true);

			return {
				type: "Rule",
				loc: this.getLocation(startOffset, this.scanner.tokenStart),
				prelude: prelude,
				block: block
			};
		},
		generate: function (node) {
			this.node(node.prelude);
			this.node(node.block);
		},
		walkContext: "rule"
	};

	// ---

	const Syntax_Selector = {
		name: "Selector",
		structure: {
			children: [[
				"TypeSelector",
				"IdSelector",
				"ClassSelector",
				"AttributeSelector",
				"PseudoClassSelector",
				"PseudoElementSelector",
				"Combinator",
				"WhiteSpace"
			]]
		},
		parse: function () {
			const children = this.readSequence(this.scope.Selector);

			// nothing were consumed
			if (this.getFirstListNode(children) === null) {
				this.scanner.error("Selector is expected");
			}

			return {
				type: "Selector",
				loc: this.getLocationFromList(children),
				children: children
			};
		},
		generate: function (node) {
			this.children(node);
		}
	};

	// ---

	const SelectorList = {
		name: "SelectorList",
		structure: {
			children: [[
				"Selector",
				"Raw"
			]]
		},
		parse: function () {
			const children = this.createList();

			while (!this.scanner.eof) {
				children.push(this.Selector());

				if (this.scanner.tokenType === COMMA) {
					this.scanner.next();
					continue;
				}

				break;
			}

			return {
				type: "SelectorList",
				loc: this.getLocationFromList(children),
				children: children
			};
		},
		generate: function (node) {
			this.children(node, function () {
				this.chunk(",");
			});
		},
		walkContext: "selector"
	};

	// ---

	const Syntax_String = {
		name: "String",
		structure: {
			value: String
		},
		parse: function () {
			return {
				type: "String",
				loc: this.getLocation(this.scanner.tokenStart, this.scanner.tokenEnd),
				value: this.scanner.consume(STRING)
			};
		},
		generate: function (node) {
			this.chunk(node.value);
		}
	};

	// ---

	function StyleSheet_consumeRaw(startToken) {
		return this.Raw(startToken, 0, 0, false, false);
	}

	const Syntax_StyleSheet = {
		name: "StyleSheet",
		structure: {
			children: [[
				"Comment",
				"CDO",
				"CDC",
				"Atrule",
				"Rule",
				"Raw"
			]]
		},
		parse: function () {
			const start = this.scanner.tokenStart;
			const children = this.createList();
			let child;

			while (!this.scanner.eof) {
				switch (this.scanner.tokenType) {
					case WHITESPACE:
						this.scanner.next();
						continue;

					case COMMENT:
						// ignore comments except exclamation comments (i.e. /*! .. */) on top level
						if (this.scanner.source.charCodeAt(this.scanner.tokenStart + 2) !== EXCLAMATIONMARK) {
							this.scanner.next();
							continue;
						}

						child = this.Comment();
						break;

					case CDO: // <!--
						child = this.CDO();
						break;

					case CDC: // -->
						child = this.CDC();
						break;

					// CSS Syntax Module Level 3
					// §2.2 Error handling
					// At the "top level" of a stylesheet, an <at-keyword-token> starts an at-rule.
					case ATKEYWORD:
						child = this.parseWithFallback(this.Atrule, StyleSheet_consumeRaw);
						break;

					// Anything else starts a qualified rule ...
					default:
						child = this.parseWithFallback(this.Rule, StyleSheet_consumeRaw);
				}

				children.push(child);
			}

			return {
				type: "StyleSheet",
				loc: this.getLocation(start, this.scanner.tokenStart),
				children: children
			};
		},
		generate: function (node) {
			this.children(node);
		},
		walkContext: "stylesheet"
	};

	// ---

	function eatIdentifierOrAsterisk() {
		if (this.scanner.tokenType !== IDENTIFIER &&
			this.scanner.tokenType !== ASTERISK) {
			this.scanner.error("Identifier or asterisk is expected");
		}

		this.scanner.next();
	}

	// ident
	// ident|ident
	// ident|*
	// *
	// *|ident
	// *|*
	// |ident
	// |*
	const TypeSelector = {
		name: "TypeSelector",
		structure: {
			name: String
		},
		parse: function () {
			const start = this.scanner.tokenStart;

			if (this.scanner.tokenType === VERTICALLINE) {
				this.scanner.next();
				eatIdentifierOrAsterisk.call(this);
			} else {
				eatIdentifierOrAsterisk.call(this);

				if (this.scanner.tokenType === VERTICALLINE) {
					this.scanner.next();
					eatIdentifierOrAsterisk.call(this);
				}
			}

			return {
				type: "TypeSelector",
				loc: this.getLocation(start, this.scanner.tokenStart),
				name: this.scanner.substrToCursor(start)
			};
		},
		generate: function (node) {
			this.chunk(node.name);
		}
	};

	// ---	

	function scanUnicodeNumber(scanner) {
		for (let pos = scanner.tokenStart + 1; pos < scanner.tokenEnd; pos++) {
			const code = scanner.source.charCodeAt(pos);

			// break on fullstop or hyperminus/plussign after exponent
			if (code === FULLSTOP || code === PLUSSIGN) {
				// break token, exclude symbol
				scanner.tokenStart = pos;
				return false;
			}
		}

		return true;
	}

	// https://drafts.csswg.org/css-syntax-3/#urange
	function scanUnicodeRange(scanner) {
		const hexStart = scanner.tokenStart + 1; // skip +
		let hexLength = 0;

		scan: {
			if (scanner.tokenType === NUMBER) {
				if (scanner.source.charCodeAt(scanner.tokenStart) !== FULLSTOP && scanUnicodeNumber(scanner)) {
					scanner.next();
				} else if (scanner.source.charCodeAt(scanner.tokenStart) !== HYPHENMINUS) {
					break scan;
				}
			} else {
				scanner.next(); // PLUSSIGN
			}

			if (scanner.tokenType === HYPHENMINUS) {
				scanner.next();
			}

			if (scanner.tokenType === NUMBER) {
				scanner.next();
			}

			if (scanner.tokenType === IDENTIFIER) {
				scanner.next();
			}

			if (scanner.tokenStart === hexStart) {
				scanner.error("Unexpected input", hexStart);
			}
		}

		// validate for U+x{1,6} or U+x{1,6}-x{1,6}
		// where x is [0-9a-fA-F]
		let i;
		let wasHyphenMinus = false;
		for (i = hexStart; i < scanner.tokenStart; i++) {
			const code = scanner.source.charCodeAt(i);

			if (isHex(code) === false && (code !== HYPHENMINUS || wasHyphenMinus)) {
				scanner.error("Unexpected input", i);
			}

			if (code === HYPHENMINUS) {
				// hex sequence shouldn"t be an empty
				if (hexLength === 0) {
					scanner.error("Unexpected input", i);
				}

				wasHyphenMinus = true;
				hexLength = 0;
			} else {
				hexLength++;

				// too long hex sequence
				if (hexLength > 6) {
					scanner.error("Too long hex sequence", i);
				}
			}

		}

		// check we have a non-zero sequence
		if (hexLength === 0) {
			scanner.error("Unexpected input", i - 1);
		}

		// U+abc???
		if (!wasHyphenMinus) {
			// consume as many U+003F QUESTION MARK (?) code points as possible
			for (; hexLength < 6 && !scanner.eof; scanner.next()) {
				if (scanner.tokenType !== QUESTIONMARK) {
					break;
				}

				hexLength++;
			}
		}
	}

	const UnicodeRange = {
		name: "UnicodeRange",
		structure: {
			value: String
		},
		parse: function () {
			const start = this.scanner.tokenStart;

			this.scanner.next(); // U or u
			scanUnicodeRange(this.scanner);

			return {
				type: "UnicodeRange",
				loc: this.getLocation(start, this.scanner.tokenStart),
				value: this.scanner.substrToCursor(start)
			};
		},
		generate: function (node) {
			this.chunk(node.value);
		}
	};

	// ---

	// url "(" S* (string | raw) S* ")"
	const Url = {
		name: "Url",
		structure: {
			value: ["String", "Raw"]
		},
		parse: function () {
			const start = this.scanner.tokenStart;
			let value;

			this.scanner.eat(URL);
			this.scanner.skipSC();

			switch (this.scanner.tokenType) {
				case STRING:
					value = this.String();
					break;

				case RAW:
					value = this.Raw(this.scanner.currentToken, 0, RAW, true, false);
					break;

				default:
					this.scanner.error("String or Raw is expected");
			}

			this.scanner.skipSC();
			this.scanner.eat(RIGHTPARENTHESIS);

			return {
				type: "Url",
				loc: this.getLocation(start, this.scanner.tokenStart),
				value: value
			};
		},
		generate: function (node) {
			this.chunk("url");
			this.chunk("(");
			this.node(node.value);
			this.chunk(")");
		}
	};

	// ---

	const Syntax_Value = {
		name: "Value",
		structure: {
			children: [[]]
		},
		parse: function () {
			const start = this.scanner.tokenStart;
			const children = this.readSequence(this.scope.Value);

			return {
				type: "Value",
				loc: this.getLocation(start, this.scanner.tokenStart),
				children: children
			};
		},
		generate: function (node) {
			this.children(node);
		}
	};

	// ---

	const WhiteSpace_SPACE = Object.freeze({
		type: "WhiteSpace",
		loc: null,
		value: " "
	});

	const WhiteSpace = {
		name: "WhiteSpace",
		structure: {
			value: String
		},
		parse: function () {
			this.scanner.eat(WHITESPACE);
			return WhiteSpace_SPACE;

			// return {
			//     type: "WhiteSpace",
			//     loc: this.getLocation(this.scanner.tokenStart, this.scanner.tokenEnd),
			//     value: this.scanner.consume(WHITESPACE)
			// };
		},
		generate: function (node) {
			this.chunk(node.value);
		}
	};

	// ---

	function processChildren(node, delimeter) {
		const list = node.children;
		let prev = null;

		if (typeof delimeter !== "function") {
			list.forEach(this.node, this);
		} else {
			list.forEach(function (node) {
				if (prev !== null) {
					delimeter.call(this, prev);
				}

				this.node(node);
				prev = node;
			}, this);
		}
	}

	function createGenerator(config) {
		function processNode(node) {
			if (hasOwnProperty.call(types, node.type)) {
				types[node.type].call(this, node);
			} else {
				throw new Error("Unknown node type: " + node.type);
			}
		}

		const types = {};

		if (config.node) {
			for (const name in config.node) {
				types[name] = config.node[name].generate;
			}
		}

		return function (node, options) {
			let buffer = "";
			let handlers = {
				children: processChildren,
				node: processNode,
				chunk: function (chunk) {
					buffer += chunk;
				},
				result: function () {
					return buffer;
				}
			};

			if (options) {
				if (typeof options.decorator === "function") {
					handlers = options.decorator(handlers);
				}
			}

			handlers.node(node);

			return handlers.result();
		};
	}

	// ---

	const node = {
		AnPlusB: AnPlusB,
		Atrule: Atrule,
		AtrulePrelude: Syntax_AtrulePrelude,
		AttributeSelector: AttributeSelector,
		Block: Block,
		Brackets: Brackets,
		CDC: Syntax_CDC,
		CDO: Syntax_CDO,
		ClassSelector: ClassSelector,
		Combinator: Combinator,
		Comment: Syntax_Comment,
		Declaration: Declaration,
		DeclarationList: DeclarationList,
		Dimension: Dimension,
		Function: Syntax_Function,
		HexColor: HexColor,
		Identifier: Identifier,
		IdSelector: IdSelector,
		MediaFeature: MediaFeature,
		MediaQuery: MediaQuery,
		MediaQueryList: MediaQueryList,
		Nth: Nth,
		Number: Syntax_Number,
		Operator: Operator,
		Parentheses: Parentheses,
		Percentage: Percentage,
		PseudoClassSelector: PseudoClassSelector,
		PseudoElementSelector: PseudoElementSelector,
		Ratio: Ratio,
		Raw: Raw,
		Rule: Rule,
		Selector: Syntax_Selector,
		SelectorList: SelectorList,
		String: Syntax_String,
		StyleSheet: Syntax_StyleSheet,
		TypeSelector: TypeSelector,
		UnicodeRange: UnicodeRange,
		Url: Url,
		Value: Syntax_Value,
		WhiteSpace: WhiteSpace
	};

	// ---

	const config = {
		parseContext: {
			default: "StyleSheet",
			stylesheet: "StyleSheet",
			atrule: "Atrule",
			atrulePrelude: function (options) {
				return this.AtrulePrelude(options.atrule ? String(options.atrule) : null);
			},
			mediaQueryList: "MediaQueryList",
			mediaQuery: "MediaQuery",
			rule: "Rule",
			selectorList: "SelectorList",
			selector: "Selector",
			block: function () {
				return this.Block(true);
			},
			declarationList: "DeclarationList",
			declaration: "Declaration",
			value: "Value"
		},
		scope: scope,
		atrule: atrule,
		pseudo: pseudo,
		node: node
	};

	return {
		parse: createParser(config),
		generate: createGenerator(config)
	};

})();