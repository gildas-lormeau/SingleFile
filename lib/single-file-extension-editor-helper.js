(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.singlefile = {}));
})(this, (function (exports) { 'use strict';

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	const SELF_CLOSED_TAG_NAMES = ["AREA", "BASE", "BR", "COL", "COMMAND", "EMBED", "HR", "IMG", "INPUT", "KEYGEN", "LINK", "META", "PARAM", "SOURCE", "TRACK", "WBR"];

	const Node_ELEMENT_NODE$1 = 1;
	const Node_TEXT_NODE$1 = 3;
	const Node_COMMENT_NODE$1 = 8;

	// see https://www.w3.org/TR/html5/syntax.html#optional-tags
	const OMITTED_START_TAGS = [
		{ tagName: "HEAD", accept: element => !element.childNodes.length || element.childNodes[0].nodeType == Node_ELEMENT_NODE$1 },
		{ tagName: "BODY", accept: element => !element.childNodes.length }
	];
	const OMITTED_END_TAGS = [
		{ tagName: "HTML", accept: next => !next || next.nodeType != Node_COMMENT_NODE$1 },
		{ tagName: "HEAD", accept: next => !next || (next.nodeType != Node_COMMENT_NODE$1 && (next.nodeType != Node_TEXT_NODE$1 || !startsWithSpaceChar(next.textContent))) },
		{ tagName: "BODY", accept: next => !next || next.nodeType != Node_COMMENT_NODE$1 },
		{ tagName: "LI", accept: (next, element) => (!next && element.parentElement && (getTagName$1(element.parentElement) == "UL" || getTagName$1(element.parentElement) == "OL")) || (next && ["LI"].includes(getTagName$1(next))) },
		{ tagName: "DT", accept: next => !next || ["DT", "DD"].includes(getTagName$1(next)) },
		{ tagName: "P", accept: next => next && ["ADDRESS", "ARTICLE", "ASIDE", "BLOCKQUOTE", "DETAILS", "DIV", "DL", "FIELDSET", "FIGCAPTION", "FIGURE", "FOOTER", "FORM", "H1", "H2", "H3", "H4", "H5", "H6", "HEADER", "HR", "MAIN", "NAV", "OL", "P", "PRE", "SECTION", "TABLE", "UL"].includes(getTagName$1(next)) },
		{ tagName: "DD", accept: next => !next || ["DT", "DD"].includes(getTagName$1(next)) },
		{ tagName: "RT", accept: next => !next || ["RT", "RP"].includes(getTagName$1(next)) },
		{ tagName: "RP", accept: next => !next || ["RT", "RP"].includes(getTagName$1(next)) },
		{ tagName: "OPTGROUP", accept: next => !next || ["OPTGROUP"].includes(getTagName$1(next)) },
		{ tagName: "OPTION", accept: next => !next || ["OPTION", "OPTGROUP"].includes(getTagName$1(next)) },
		{ tagName: "COLGROUP", accept: next => !next || (next.nodeType != Node_COMMENT_NODE$1 && (next.nodeType != Node_TEXT_NODE$1 || !startsWithSpaceChar(next.textContent))) },
		{ tagName: "CAPTION", accept: next => !next || (next.nodeType != Node_COMMENT_NODE$1 && (next.nodeType != Node_TEXT_NODE$1 || !startsWithSpaceChar(next.textContent))) },
		{ tagName: "THEAD", accept: next => !next || ["TBODY", "TFOOT"].includes(getTagName$1(next)) },
		{ tagName: "TBODY", accept: next => !next || ["TBODY", "TFOOT"].includes(getTagName$1(next)) },
		{ tagName: "TFOOT", accept: next => !next },
		{ tagName: "TR", accept: next => !next || ["TR"].includes(getTagName$1(next)) },
		{ tagName: "TD", accept: next => !next || ["TD", "TH"].includes(getTagName$1(next)) },
		{ tagName: "TH", accept: next => !next || ["TD", "TH"].includes(getTagName$1(next)) }
	];
	const TEXT_NODE_TAGS = ["STYLE", "SCRIPT", "XMP", "IFRAME", "NOEMBED", "NOFRAMES", "PLAINTEXT", "NOSCRIPT"];

	function process$7(doc, compressHTML) {
		const docType = doc.doctype;
		let docTypeString = "";
		if (docType) {
			docTypeString = "<!DOCTYPE " + docType.nodeName;
			if (docType.publicId) {
				docTypeString += " PUBLIC \"" + docType.publicId + "\"";
				if (docType.systemId)
					docTypeString += " \"" + docType.systemId + "\"";
			} else if (docType.systemId)
				docTypeString += " SYSTEM \"" + docType.systemId + "\"";
			if (docType.internalSubset)
				docTypeString += " [" + docType.internalSubset + "]";
			docTypeString += "> ";
		}
		return docTypeString + serialize(doc.documentElement, compressHTML);
	}

	function serialize(node, compressHTML, isSVG) {
		if (node.nodeType == Node_TEXT_NODE$1) {
			return serializeTextNode(node);
		} else if (node.nodeType == Node_COMMENT_NODE$1) {
			return serializeCommentNode(node);
		} else if (node.nodeType == Node_ELEMENT_NODE$1) {
			return serializeElement(node, compressHTML, isSVG);
		}
	}

	function serializeTextNode(textNode) {
		const parentNode = textNode.parentNode;
		let parentTagName;
		if (parentNode && parentNode.nodeType == Node_ELEMENT_NODE$1) {
			parentTagName = getTagName$1(parentNode);
		}
		if (!parentTagName || TEXT_NODE_TAGS.includes(parentTagName)) {
			if (parentTagName == "SCRIPT" || parentTagName == "STYLE") {
				return textNode.textContent.replace(/<\//gi, "<\\/").replace(/\/>/gi, "\\/>");
			}
			return textNode.textContent;
		} else {
			return textNode.textContent.replace(/&/g, "&amp;").replace(/\u00a0/g, "&nbsp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
		}
	}

	function serializeCommentNode(commentNode) {
		return "<!--" + commentNode.textContent + "-->";
	}

	function serializeElement(element, compressHTML, isSVG) {
		const tagName = getTagName$1(element);
		const omittedStartTag = compressHTML && OMITTED_START_TAGS.find(omittedStartTag => tagName == getTagName$1(omittedStartTag) && omittedStartTag.accept(element));
		let content = "";
		if (!omittedStartTag || element.attributes.length) {
			content = "<" + tagName.toLowerCase();
			Array.from(element.attributes).forEach(attribute => content += serializeAttribute(attribute, element, compressHTML));
			content += ">";
		}
		if (tagName == "TEMPLATE" && !element.childNodes.length) {
			content += element.innerHTML;
		} else {
			Array.from(element.childNodes).forEach(childNode => content += serialize(childNode, compressHTML, isSVG || tagName == "svg"));
		}
		const omittedEndTag = compressHTML && OMITTED_END_TAGS.find(omittedEndTag => tagName == getTagName$1(omittedEndTag) && omittedEndTag.accept(element.nextSibling, element));
		if (isSVG || (!omittedEndTag && !SELF_CLOSED_TAG_NAMES.includes(tagName))) {
			content += "</" + tagName.toLowerCase() + ">";
		}
		return content;
	}

	function serializeAttribute(attribute, element, compressHTML) {
		const name = attribute.name;
		let content = "";
		if (!name.match(/["'>/=]/)) {
			let value = attribute.value;
			if (compressHTML && name == "class") {
				value = Array.from(element.classList).map(className => className.trim()).join(" ");
			}
			let simpleQuotesValue;
			value = value.replace(/&/g, "&amp;").replace(/\u00a0/g, "&nbsp;");
			if (value.includes("\"")) {
				if (value.includes("'") || !compressHTML) {
					value = value.replace(/"/g, "&quot;");
				} else {
					simpleQuotesValue = true;
				}
			}
			const invalidUnquotedValue = !compressHTML || value.match(/[ \t\n\f\r'"`=<>]/);
			content += " ";
			if (!attribute.namespace) {
				content += name;
			} else if (attribute.namespaceURI == "http://www.w3.org/XML/1998/namespace") {
				content += "xml:" + name;
			} else if (attribute.namespaceURI == "http://www.w3.org/2000/xmlns/") {
				if (name !== "xmlns") {
					content += "xmlns:";
				}
				content += name;
			} else if (attribute.namespaceURI == "http://www.w3.org/1999/xlink") {
				content += "xlink:" + name;
			} else {
				content += name;
			}
			if (value != "") {
				content += "=";
				if (invalidUnquotedValue) {
					content += simpleQuotesValue ? "'" : "\"";
				}
				content += value;
				if (invalidUnquotedValue) {
					content += simpleQuotesValue ? "'" : "\"";
				}
			}
		}
		return content;
	}

	function startsWithSpaceChar(textContent) {
		return Boolean(textContent.match(/^[ \t\n\f\r]/));
	}

	function getTagName$1(element) {
		return  element.tagName && element.tagName.toUpperCase();
	}

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	function peg$subclass(child, parent) {
		function ctor() { this.constructor = child; }
		ctor.prototype = parent.prototype;
		child.prototype = new ctor();
	}

	function peg$SyntaxError(message, expected, found, location) {
		this.message = message;
		this.expected = expected;
		this.found = found;
		this.location = location;
		this.name = "SyntaxError";

		if (typeof Error.captureStackTrace === "function") {
			Error.captureStackTrace(this, peg$SyntaxError);
		}
	}

	peg$subclass(peg$SyntaxError, Error);

	peg$SyntaxError.buildMessage = function (expected, found) {
		var DESCRIBE_EXPECTATION_FNS = {
			literal: function (expectation) {
				return "\"" + literalEscape(expectation.text) + "\"";
			},

			"class": function (expectation) {
				var escapedParts = "",
					i;

				for (i = 0; i < expectation.parts.length; i++) {
					escapedParts += expectation.parts[i] instanceof Array
						? classEscape(expectation.parts[i][0]) + "-" + classEscape(expectation.parts[i][1])
						: classEscape(expectation.parts[i]);
				}

				return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
			},

			any: function () {
				return "any character";
			},

			end: function () {
				return "end of input";
			},

			other: function (expectation) {
				return expectation.description;
			}
		};

		function hex(ch) {
			return ch.charCodeAt(0).toString(16).toUpperCase();
		}

		function literalEscape(s) {
			return s
				.replace(/\\/g, "\\\\")
				.replace(/"/g, "\\\"")
				.replace(/\0/g, "\\0")
				.replace(/\t/g, "\\t")
				.replace(/\n/g, "\\n")
				.replace(/\r/g, "\\r")
				.replace(/[\x00-\x0F]/g, function (ch) { return "\\x0" + hex(ch); })
				.replace(/[\x10-\x1F\x7F-\x9F]/g, function (ch) { return "\\x" + hex(ch); });
		}

		function classEscape(s) {
			return s
				.replace(/\\/g, "\\\\")
				.replace(/\]/g, "\\]")
				.replace(/\^/g, "\\^")
				.replace(/-/g, "\\-")
				.replace(/\0/g, "\\0")
				.replace(/\t/g, "\\t")
				.replace(/\n/g, "\\n")
				.replace(/\r/g, "\\r")
				.replace(/[\x00-\x0F]/g, function (ch) { return "\\x0" + hex(ch); })
				.replace(/[\x10-\x1F\x7F-\x9F]/g, function (ch) { return "\\x" + hex(ch); });
		}

		function describeExpectation(expectation) {
			return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
		}

		function describeExpected(expected) {
			var descriptions = new Array(expected.length),
				i, j;

			for (i = 0; i < expected.length; i++) {
				descriptions[i] = describeExpectation(expected[i]);
			}

			descriptions.sort();

			if (descriptions.length > 0) {
				for (i = 1, j = 1; i < descriptions.length; i++) {
					if (descriptions[i - 1] !== descriptions[i]) {
						descriptions[j] = descriptions[i];
						j++;
					}
				}
				descriptions.length = j;
			}

			switch (descriptions.length) {
				case 1:
					return descriptions[0];

				case 2:
					return descriptions[0] + " or " + descriptions[1];

				default:
					return descriptions.slice(0, -1).join(", ")
						+ ", or "
						+ descriptions[descriptions.length - 1];
			}
		}

		function describeFound(found) {
			return found ? "\"" + literalEscape(found) + "\"" : "end of input";
		}

		return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
	};

	async function peg$parse(input, options) {
		options = options !== void 0 ? options : {};

		var peg$FAILED = {},

			peg$startRuleFunctions = { start: peg$parsestart },
			peg$startRuleFunction = peg$parsestart,

			peg$c0 = function (expression) { return expression.join(""); },
			peg$c1 = "|",
			peg$c2 = peg$literalExpectation("|", false),
			peg$c3 = function (value) { return value; },
			peg$c4 = "%",
			peg$c5 = peg$literalExpectation("%", false),
			peg$c6 = "<",
			peg$c7 = peg$literalExpectation("<", false),
			peg$c8 = ">",
			peg$c9 = peg$literalExpectation(">", false),
			peg$c10 = function (name, args, length) { return options.callFunction(name, args, length); },
			peg$c11 = "{",
			peg$c12 = peg$literalExpectation("{", false),
			peg$c13 = "}",
			peg$c14 = peg$literalExpectation("}", false),
			peg$c15 = function (name, length) { return options.getVariableValue(name, length); },
			peg$c16 = "[",
			peg$c17 = peg$literalExpectation("[", false),
			peg$c18 = "]",
			peg$c19 = peg$literalExpectation("]", false),
			peg$c20 = function (length, unit) { return { length, unit }; },
			peg$c21 = "ch",
			peg$c22 = peg$literalExpectation("ch", false),
			peg$c23 = /^[a-z0-9-]/,
			peg$c24 = peg$classExpectation([["a", "z"], ["0", "9"], "-"], false, false),
			peg$c25 = function () { return text(); },
			peg$c26 = /^[0-9]/,
			peg$c27 = peg$classExpectation([["0", "9"]], false, false),
			peg$c28 = function () { return Number(text()); },
			peg$c29 = "\\\\%",
			peg$c30 = peg$literalExpectation("\\\\%", false),
			peg$c31 = "\\\\{",
			peg$c32 = peg$literalExpectation("\\\\{", false),
			peg$c33 = "\\\\|",
			peg$c34 = peg$literalExpectation("\\\\|", false),
			peg$c35 = "\\\\>",
			peg$c36 = peg$literalExpectation("\\\\>", false),
			peg$c37 = peg$anyExpectation(),

			peg$currPos = 0,
			peg$savedPos = 0,
			peg$posDetailsCache = [{ line: 1, column: 1 }],
			peg$maxFailPos = 0,
			peg$maxFailExpected = [],
			peg$silentFails = 0,

			peg$result;

		if ("startRule" in options) {
			if (!(options.startRule in peg$startRuleFunctions)) {
				throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
			}

			peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
		}

		function text() {
			return input.substring(peg$savedPos, peg$currPos);
		}

		function peg$literalExpectation(text, ignoreCase) {
			return { type: "literal", text: text, ignoreCase: ignoreCase };
		}

		function peg$classExpectation(parts, inverted, ignoreCase) {
			return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
		}

		function peg$anyExpectation() {
			return { type: "any" };
		}

		function peg$endExpectation() {
			return { type: "end" };
		}

		function peg$computePosDetails(pos) {
			var details = peg$posDetailsCache[pos], p;

			if (details) {
				return details;
			} else {
				p = pos - 1;
				while (!peg$posDetailsCache[p]) {
					p--;
				}

				details = peg$posDetailsCache[p];
				details = {
					line: details.line,
					column: details.column
				};

				while (p < pos) {
					if (input.charCodeAt(p) === 10) {
						details.line++;
						details.column = 1;
					} else {
						details.column++;
					}

					p++;
				}

				peg$posDetailsCache[pos] = details;
				return details;
			}
		}

		function peg$computeLocation(startPos, endPos) {
			var startPosDetails = peg$computePosDetails(startPos),
				endPosDetails = peg$computePosDetails(endPos);

			return {
				start: {
					offset: startPos,
					line: startPosDetails.line,
					column: startPosDetails.column
				},
				end: {
					offset: endPos,
					line: endPosDetails.line,
					column: endPosDetails.column
				}
			};
		}

		function peg$fail(expected) {
			if (peg$currPos < peg$maxFailPos) { return; }

			if (peg$currPos > peg$maxFailPos) {
				peg$maxFailPos = peg$currPos;
				peg$maxFailExpected = [];
			}

			peg$maxFailExpected.push(expected);
		}

		function peg$buildStructuredError(expected, found, location) {
			return new peg$SyntaxError(
				peg$SyntaxError.buildMessage(expected, found),
				expected,
				found,
				location
			);
		}

		async function peg$parsestart() {
			var s0;

			s0 = await peg$parseexpression();

			return s0;
		}

		async function peg$parseexpression() {
			var s0, s1, s2;

			s0 = peg$currPos;
			s1 = [];
			s2 = await peg$parsestatement();
			while (s2 !== peg$FAILED) {
				s1.push(s2);
				s2 = await peg$parsestatement();
			}
			if (s1 !== peg$FAILED) {
				peg$savedPos = s0;
				s1 = peg$c0(s1);
			}
			s0 = s1;

			return s0;
		}

		async function peg$parsestatement() {
			var s0;

			s0 = await peg$parsefunctionCall();
			if (s0 === peg$FAILED) {
				s0 = await peg$parsevariable();
				if (s0 === peg$FAILED) {
					s0 = peg$parsetext();
				}
			}

			return s0;
		}

		async function peg$parsearg() {
			var s0, s1, s2;

			s0 = peg$currPos;
			if (input.charCodeAt(peg$currPos) === 124) {
				s1 = peg$c1;
				peg$currPos++;
			} else {
				s1 = peg$FAILED;
				if (peg$silentFails === 0) { peg$fail(peg$c2); }
			}
			if (s1 !== peg$FAILED) {
				s2 = await peg$parseexpression();
				if (s2 !== peg$FAILED) {
					peg$savedPos = s0;
					s1 = peg$c3(s2);
					s0 = s1;
				} else {
					peg$currPos = s0;
					s0 = peg$FAILED;
				}
			} else {
				peg$currPos = s0;
				s0 = peg$FAILED;
			}

			return s0;
		}

		async function peg$parseoptionalArgs() {
			var s0, s1;

			s0 = [];
			s1 = await peg$parsearg();
			if (s1 !== peg$FAILED) {
				while (s1 !== peg$FAILED) {
					s0.push(s1);
					s1 = await peg$parsearg();
				}
			} else {
				s0 = peg$FAILED;
			}

			return s0;
		}

		async function peg$parseargs() {
			var s0, s1, s2;

			s0 = peg$currPos;
			s1 = await peg$parseexpression();
			if (s1 !== peg$FAILED) {
				s2 = await peg$parseoptionalArgs();
				if (s2 === peg$FAILED) {
					s2 = null;
				}
				if (s2 !== peg$FAILED) {
					s1 = [s1, s2];
					s0 = s1;
				} else {
					peg$currPos = s0;
					s0 = peg$FAILED;
				}
			} else {
				peg$currPos = s0;
				s0 = peg$FAILED;
			}

			return s0;
		}

		async function peg$parsefunctionCall() {
			var s0, s1, s2, s3, s4, s5, s6;

			s0 = peg$currPos;
			if (input.charCodeAt(peg$currPos) === 37) {
				s1 = peg$c4;
				peg$currPos++;
			} else {
				s1 = peg$FAILED;
				if (peg$silentFails === 0) { peg$fail(peg$c5); }
			}
			if (s1 !== peg$FAILED) {
				s2 = peg$parseidentifier();
				if (s2 !== peg$FAILED) {
					if (input.charCodeAt(peg$currPos) === 60) {
						s3 = peg$c6;
						peg$currPos++;
					} else {
						s3 = peg$FAILED;
						if (peg$silentFails === 0) { peg$fail(peg$c7); }
					}
					if (s3 !== peg$FAILED) {
						s4 = await peg$parseargs();
						if (s4 !== peg$FAILED) {
							if (input.charCodeAt(peg$currPos) === 62) {
								s5 = peg$c8;
								peg$currPos++;
							} else {
								s5 = peg$FAILED;
								if (peg$silentFails === 0) { peg$fail(peg$c9); }
							}
							if (s5 !== peg$FAILED) {
								s6 = peg$parseresultLength();
								if (s6 === peg$FAILED) {
									s6 = null;
								}
								if (s6 !== peg$FAILED) {
									peg$savedPos = s0;
									s1 = await peg$c10(s2, s4, s6);
									s0 = s1;
								} else {
									peg$currPos = s0;
									s0 = peg$FAILED;
								}
							} else {
								peg$currPos = s0;
								s0 = peg$FAILED;
							}
						} else {
							peg$currPos = s0;
							s0 = peg$FAILED;
						}
					} else {
						peg$currPos = s0;
						s0 = peg$FAILED;
					}
				} else {
					peg$currPos = s0;
					s0 = peg$FAILED;
				}
			} else {
				peg$currPos = s0;
				s0 = peg$FAILED;
			}

			return s0;
		}

		async function peg$parsevariable() {
			var s0, s1, s2, s3, s4;

			s0 = peg$currPos;
			if (input.charCodeAt(peg$currPos) === 123) {
				s1 = peg$c11;
				peg$currPos++;
			} else {
				s1 = peg$FAILED;
				if (peg$silentFails === 0) { peg$fail(peg$c12); }
			}
			if (s1 !== peg$FAILED) {
				s2 = peg$parseidentifier();
				if (s2 !== peg$FAILED) {
					if (input.charCodeAt(peg$currPos) === 125) {
						s3 = peg$c13;
						peg$currPos++;
					} else {
						s3 = peg$FAILED;
						if (peg$silentFails === 0) { peg$fail(peg$c14); }
					}
					if (s3 !== peg$FAILED) {
						s4 = peg$parseresultLength();
						if (s4 === peg$FAILED) {
							s4 = null;
						}
						if (s4 !== peg$FAILED) {
							peg$savedPos = s0;
							s1 = await peg$c15(s2, s4);
							s0 = s1;
						} else {
							peg$currPos = s0;
							s0 = peg$FAILED;
						}
					} else {
						peg$currPos = s0;
						s0 = peg$FAILED;
					}
				} else {
					peg$currPos = s0;
					s0 = peg$FAILED;
				}
			} else {
				peg$currPos = s0;
				s0 = peg$FAILED;
			}

			return s0;
		}

		function peg$parseresultLength() {
			var s0, s1, s2, s3, s4;

			s0 = peg$currPos;
			if (input.charCodeAt(peg$currPos) === 91) {
				s1 = peg$c16;
				peg$currPos++;
			} else {
				s1 = peg$FAILED;
				if (peg$silentFails === 0) { peg$fail(peg$c17); }
			}
			if (s1 !== peg$FAILED) {
				s2 = peg$parsenumber();
				if (s2 !== peg$FAILED) {
					s3 = peg$parselengthUnit();
					if (s3 !== peg$FAILED) {
						if (input.charCodeAt(peg$currPos) === 93) {
							s4 = peg$c18;
							peg$currPos++;
						} else {
							s4 = peg$FAILED;
							if (peg$silentFails === 0) { peg$fail(peg$c19); }
						}
						if (s4 !== peg$FAILED) {
							peg$savedPos = s0;
							s1 = peg$c20(s2, s3);
							s0 = s1;
						} else {
							peg$currPos = s0;
							s0 = peg$FAILED;
						}
					} else {
						peg$currPos = s0;
						s0 = peg$FAILED;
					}
				} else {
					peg$currPos = s0;
					s0 = peg$FAILED;
				}
			} else {
				peg$currPos = s0;
				s0 = peg$FAILED;
			}

			return s0;
		}

		function peg$parselengthUnit() {
			var s0;

			if (input.substr(peg$currPos, 2) === peg$c21) {
				s0 = peg$c21;
				peg$currPos += 2;
			} else {
				s0 = peg$FAILED;
				if (peg$silentFails === 0) { peg$fail(peg$c22); }
			}
			if (s0 === peg$FAILED) {
				s0 = null;
			}

			return s0;
		}

		function peg$parseidentifier() {
			var s0, s1, s2;

			s0 = peg$currPos;
			s1 = [];
			if (peg$c23.test(input.charAt(peg$currPos))) {
				s2 = input.charAt(peg$currPos);
				peg$currPos++;
			} else {
				s2 = peg$FAILED;
				if (peg$silentFails === 0) { peg$fail(peg$c24); }
			}
			if (s2 !== peg$FAILED) {
				while (s2 !== peg$FAILED) {
					s1.push(s2);
					if (peg$c23.test(input.charAt(peg$currPos))) {
						s2 = input.charAt(peg$currPos);
						peg$currPos++;
					} else {
						s2 = peg$FAILED;
						if (peg$silentFails === 0) { peg$fail(peg$c24); }
					}
				}
			} else {
				s1 = peg$FAILED;
			}
			if (s1 !== peg$FAILED) {
				peg$savedPos = s0;
				s1 = peg$c25();
			}
			s0 = s1;

			return s0;
		}

		function peg$parsenumber() {
			var s0, s1, s2;

			s0 = peg$currPos;
			s1 = [];
			if (peg$c26.test(input.charAt(peg$currPos))) {
				s2 = input.charAt(peg$currPos);
				peg$currPos++;
			} else {
				s2 = peg$FAILED;
				if (peg$silentFails === 0) { peg$fail(peg$c27); }
			}
			if (s2 !== peg$FAILED) {
				while (s2 !== peg$FAILED) {
					s1.push(s2);
					if (peg$c26.test(input.charAt(peg$currPos))) {
						s2 = input.charAt(peg$currPos);
						peg$currPos++;
					} else {
						s2 = peg$FAILED;
						if (peg$silentFails === 0) { peg$fail(peg$c27); }
					}
				}
			} else {
				s1 = peg$FAILED;
			}
			if (s1 !== peg$FAILED) {
				peg$savedPos = s0;
				s1 = peg$c28();
			}
			s0 = s1;

			return s0;
		}

		function peg$parsetext() {
			var s0, s1, s2;

			s0 = peg$currPos;
			s1 = [];
			s2 = peg$parsechar();
			if (s2 !== peg$FAILED) {
				while (s2 !== peg$FAILED) {
					s1.push(s2);
					s2 = peg$parsechar();
				}
			} else {
				s1 = peg$FAILED;
			}
			if (s1 !== peg$FAILED) {
				peg$savedPos = s0;
				s1 = peg$c25();
			}
			s0 = s1;

			return s0;
		}

		function peg$parsechar() {
			var s0, s1, s2, s3, s4, s5;

			s0 = peg$currPos;
			s1 = peg$currPos;
			peg$silentFails++;
			if (input.charCodeAt(peg$currPos) === 37) {
				s2 = peg$c4;
				peg$currPos++;
			} else {
				s2 = peg$FAILED;
				if (peg$silentFails === 0) { peg$fail(peg$c5); }
			}
			peg$silentFails--;
			if (s2 === peg$FAILED) {
				s1 = void 0;
			} else {
				peg$currPos = s1;
				s1 = peg$FAILED;
			}
			if (s1 !== peg$FAILED) {
				s2 = peg$currPos;
				peg$silentFails++;
				if (input.charCodeAt(peg$currPos) === 123) {
					s3 = peg$c11;
					peg$currPos++;
				} else {
					s3 = peg$FAILED;
					if (peg$silentFails === 0) { peg$fail(peg$c12); }
				}
				peg$silentFails--;
				if (s3 === peg$FAILED) {
					s2 = void 0;
				} else {
					peg$currPos = s2;
					s2 = peg$FAILED;
				}
				if (s2 !== peg$FAILED) {
					s3 = peg$currPos;
					peg$silentFails++;
					if (input.charCodeAt(peg$currPos) === 124) {
						s4 = peg$c1;
						peg$currPos++;
					} else {
						s4 = peg$FAILED;
						if (peg$silentFails === 0) { peg$fail(peg$c2); }
					}
					peg$silentFails--;
					if (s4 === peg$FAILED) {
						s3 = void 0;
					} else {
						peg$currPos = s3;
						s3 = peg$FAILED;
					}
					if (s3 !== peg$FAILED) {
						s4 = peg$currPos;
						peg$silentFails++;
						if (input.charCodeAt(peg$currPos) === 62) {
							s5 = peg$c8;
							peg$currPos++;
						} else {
							s5 = peg$FAILED;
							if (peg$silentFails === 0) { peg$fail(peg$c9); }
						}
						peg$silentFails--;
						if (s5 === peg$FAILED) {
							s4 = void 0;
						} else {
							peg$currPos = s4;
							s4 = peg$FAILED;
						}
						if (s4 !== peg$FAILED) {
							s5 = peg$parseescapedChar();
							if (s5 !== peg$FAILED) {
								s1 = [s1, s2, s3, s4, s5];
								s0 = s1;
							} else {
								peg$currPos = s0;
								s0 = peg$FAILED;
							}
						} else {
							peg$currPos = s0;
							s0 = peg$FAILED;
						}
					} else {
						peg$currPos = s0;
						s0 = peg$FAILED;
					}
				} else {
					peg$currPos = s0;
					s0 = peg$FAILED;
				}
			} else {
				peg$currPos = s0;
				s0 = peg$FAILED;
			}

			return s0;
		}

		function peg$parseescapedChar() {
			var s0;

			if (input.substr(peg$currPos, 3) === peg$c29) {
				s0 = peg$c29;
				peg$currPos += 3;
			} else {
				s0 = peg$FAILED;
				if (peg$silentFails === 0) { peg$fail(peg$c30); }
			}
			if (s0 === peg$FAILED) {
				if (input.substr(peg$currPos, 3) === peg$c31) {
					s0 = peg$c31;
					peg$currPos += 3;
				} else {
					s0 = peg$FAILED;
					if (peg$silentFails === 0) { peg$fail(peg$c32); }
				}
				if (s0 === peg$FAILED) {
					if (input.substr(peg$currPos, 3) === peg$c33) {
						s0 = peg$c33;
						peg$currPos += 3;
					} else {
						s0 = peg$FAILED;
						if (peg$silentFails === 0) { peg$fail(peg$c34); }
					}
					if (s0 === peg$FAILED) {
						if (input.substr(peg$currPos, 3) === peg$c35) {
							s0 = peg$c35;
							peg$currPos += 3;
						} else {
							s0 = peg$FAILED;
							if (peg$silentFails === 0) { peg$fail(peg$c36); }
						}
						if (s0 === peg$FAILED) {
							if (input.length > peg$currPos) {
								s0 = input.charAt(peg$currPos);
								peg$currPos++;
							} else {
								s0 = peg$FAILED;
								if (peg$silentFails === 0) { peg$fail(peg$c37); }
							}
						}
					}
				}
			}

			return s0;
		}

		peg$result = await peg$startRuleFunction();

		if (peg$result !== peg$FAILED && peg$currPos === input.length) {
			return peg$result;
		} else {
			if (peg$result !== peg$FAILED && peg$currPos < input.length) {
				peg$fail(peg$endExpectation());
			}

			throw peg$buildStructuredError(
				peg$maxFailExpected,
				peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
				peg$maxFailPos < input.length
					? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
					: peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
			);
		}
	}

	/*
	 * The MIT License (MIT)
	 *
	 * Author: Gildas Lormeau
	 *
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in all
	 * copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	 * SOFTWARE.
	 */

	// derived from https://github.com/postcss/postcss-selector-parser/blob/master/src/util/unesc.js

	/*
	 * The MIT License (MIT)
	 * Copyright (c) Ben Briggs <beneb.info@gmail.com> (http://beneb.info)
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

	const whitespace = "[\\x20\\t\\r\\n\\f]";
	const unescapeRegExp = new RegExp("\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig");

	function process$6(str) {
		return str.replace(unescapeRegExp, (_, escaped, escapedWhitespace) => {
			const high = "0x" + escaped - 0x10000;

			// NaN means non-codepoint
			// Workaround erroneous numeric interpretation of +"0x"
			// eslint-disable-next-line no-self-compare
			return high !== high || escapedWhitespace
				? escaped
				: high < 0
					? // BMP codepoint
					String.fromCharCode(high + 0x10000)
					: // Supplemental Plane codepoint (surrogate pair)
					String.fromCharCode((high >> 10) | 0xd800, (high & 0x3ff) | 0xdc00);
		});
	}

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */
	const NEW_FONT_FACE_EVENT = "single-file-new-font-face";
	const DELETE_FONT_EVENT = "single-file-delete-font";
	const CLEAR_FONTS_EVENT = "single-file-clear-fonts";
	const FONT_FACE_PROPERTY_NAME = "_singleFile_fontFaces";
	const document$1 = globalThis.document;
	const Document = globalThis.Document;
	const JSON$2 = globalThis.JSON;
	const MutationObserver = globalThis.MutationObserver;

	let fontFaces;
	if (window[FONT_FACE_PROPERTY_NAME]) {
		fontFaces = window[FONT_FACE_PROPERTY_NAME];
	} else {
		fontFaces = window[FONT_FACE_PROPERTY_NAME] = new Map();
	}

	init();
	new MutationObserver(init).observe(document$1, { childList: true });

	function init() {
		if (document$1 instanceof Document) {
			document$1.addEventListener(NEW_FONT_FACE_EVENT, event => {
				const detail = event.detail;
				const key = Object.assign({}, detail);
				delete key.src;
				fontFaces.set(JSON$2.stringify(key), detail);
			});
			document$1.addEventListener(DELETE_FONT_EVENT, event => {
				const detail = event.detail;
				const key = Object.assign({}, detail);
				delete key.src;
				fontFaces.delete(JSON$2.stringify(key));
			});
			document$1.addEventListener(CLEAR_FONTS_EVENT, () => fontFaces = new Map());
		}
	}

	function getFontsData$1() {
		return Array.from(fontFaces.values());
	}

	const SINGLE_FILE_PREFIX = "single-file-";
	const COMMENT_HEADER = "Page saved with SingleFile";
	const SINGLE_FILE_SIGNATURE = "SingleFile";
	const WAIT_FOR_USERSCRIPT_PROPERTY_NAME = "_singleFile_waitForUserScript";
	const NO_SCRIPT_PROPERTY_NAME = "singleFileDisabledNoscript";

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	const INFOBAR_TAGNAME$1 = "single-file-infobar";
	const INFOBAR_STYLES = `
.infobar,
.infobar .infobar-icon,
.infobar .infobar-link-icon {
  min-inline-size: 28px;
  min-block-size: 28px;
  box-sizing: border-box;
}

.infobar,
.infobar .infobar-close-icon,
.infobar .infobar-link-icon {
  opacity: 0.7;
  transition: opacity 250ms;
}

.infobar:hover,
.infobar .infobar-close-icon:hover,
.infobar .infobar-link-icon:hover {
  opacity: 1;
}

.infobar,
.infobar-content {
  display: flex;
}

.infobar {
  position: fixed;
  top: 16px;
  right: 16px;
  margin-inline-start: 16px;
  margin-block-end: 16px;
  color: #2d2d2d;
  background-color: #737373;
  border: 2px solid;
  border-color: #eee;
  border-radius: 16px;
  z-index: 2147483647;
}

.infobar:valid, .infobar:not(:focus-within) .infobar-content {
  display: none;
}

.infobar:focus-within {
  background-color: #f9f9f9;
  border-color: #878787;
  border-radius: 8px;
  opacity: 1;
  transition-property: opacity, background-color, border-color, border-radius,
    color;
}

.infobar-content {
  align-items: center;
}

.infobar-content span {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 14px;
  line-height: 18px;
  word-break: break-word;
  white-space: pre-wrap;
  margin-inline: 4px;
  margin-block: 4px;
}

.infobar .infobar-icon,
.infobar .infobar-close-icon,
.infobar .infobar-link-icon {
  cursor: pointer;
  background-position: center;
  background-repeat: no-repeat;
}

.infobar .infobar-close-icon,
.infobar .infobar-link-icon {
  align-self: flex-start;
}

.infobar .infobar-icon {
  position: absolute;
  min-inline-size: 24px;
  min-block-size: 24px;
}

.infobar:focus-within .infobar-icon {
  z-index: -1;
  background-image: none;
}

.infobar .infobar-close-icon {
  min-inline-size: 22px;
  min-block-size: 22px;
}

.infobar .infobar-icon {
  background-color: transparent;
  background-size: 70%;
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABABAMAAABYR2ztAAABhmlDQ1BJQ0MgcHJvZmlsZQAAKJF9kj1Iw0AYht+mSkUrDnYQcchQnSyIijqWKhbBQmkrtOpgcukfNGlIUlwcBdeCgz+LVQcXZ10dXAVB8AfEydFJ0UVK/C4ptIjx4LiH9+59+e67A4RGhalm1wSgapaRisfEbG5VDLyiDwEAvZiVmKkn0osZeI6ve/j4ehfhWd7n/hz9St5kgE8kjjLdsIg3iGc2LZ3zPnGIlSSF+Jx43KACiR+5Lrv8xrnosMAzQ0YmNU8cIhaLHSx3MCsZKvE0cVhRNcoXsi4rnLc4q5Uaa9XJbxjMaytprtMcQRxLSCAJETJqKKMCCxFaNVJMpGg/5uEfdvxJcsnkKoORYwFVqJAcP/gb/O6tWZiadJOCMaD7xbY/RoHALtCs2/b3sW03TwD/M3Cltf3VBjD3SXq9rYWPgIFt4OK6rcl7wOUOMPSkS4bkSH6aQqEAvJ/RM+WAwVv6EGtu31r7OH0AMtSr5Rvg4BAYK1L2use9ezr79u+ZVv9+AFlNcp0UUpiqAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAB3RJTUUH5AsHADIRLMaOHwAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAPUExURQAAAIqKioyNjY2OjvDw8L2y1DEAAAABdFJOUwBA5thmAAAAAWJLR0QB/wIt3gAAAGNJREFUSMdjYCAJsLi4OBCQx6/CBQwIGIDPCBcXAkYQUsACU+AwlBVQHg6Eg5pgZBGOboIJZugDFwRwoJECJCUOhJI1wZwzqmBUwagCuipgIqTABG9h7YIKaKGAURAFEF/6AQAO4HqSoDP8bgAAAABJRU5ErkJggg==);
}

.infobar .infobar-link-icon {
  background-size: 60%;
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABAAgMAAADXB5lNAAABhmlDQ1BJQ0MgcHJvZmlsZQAAKJF9kj1Iw0AYht+mSkUrDnYQcchQnSyIijqWKhbBQmkrtOpgcukfNGlIUlwcBdeCgz+LVQcXZ10dXAVB8AfEydFJ0UVK/C4ptIjx4LiH9+59+e67A4RGhalm1wSgapaRisfEbG5VDLyiDwEAvZiVmKkn0osZeI6ve/j4ehfhWd7n/hz9St5kgE8kjjLdsIg3iGc2LZ3zPnGIlSSF+Jx43KACiR+5Lrv8xrnosMAzQ0YmNU8cIhaLHSx3MCsZKvE0cVhRNcoXsi4rnLc4q5Uaa9XJbxjMaytprtMcQRxLSCAJETJqKKMCCxFaNVJMpGg/5uEfdvxJcsnkKoORYwFVqJAcP/gb/O6tWZiadJOCMaD7xbY/RoHALtCs2/b3sW03TwD/M3Cltf3VBjD3SXq9rYWPgIFt4OK6rcl7wOUOMPSkS4bkSH6aQqEAvJ/RM+WAwVv6EGtu31r7OH0AMtSr5Rvg4BAYK1L2use9ezr79u+ZVv9+AFlNcp0UUpiqAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAB3RJTUUH5AsHAB8H+DhhoQAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAJUExURQAAAICHi4qKioTuJAkAAAABdFJOUwBA5thmAAAAAWJLR0QCZgt8ZAAAAJJJREFUOI3t070NRCEMA2CnYAOyDyPwpHj/Va7hJ3FzV7zy3ET5JIwoAF6Jk4wzAJAkzxAYG9YRTgB+24wBgKmfrGAKTcEfAY4KRlRoIeBTgKOCERVaCPgU4Khge2GqKOBTgKOCERVaAEC/4PNcnyoSWHpjqkhwKxbcig0Q6AorXYF/+A6eIYD1lVbwG/jdA6/kA2THRAURVubcAAAAAElFTkSuQmCC);
}

.infobar .infobar-close-icon {
  appearance: none;
  background-size: 80%;
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABAAgMAAADXB5lNAAABhmlDQ1BJQ0MgcHJvZmlsZQAAKJF9kj1Iw0AYht+mSkUrDnYQcchQnSyIijqWKhbBQmkrtOpgcukfNGlIUlwcBdeCgz+LVQcXZ10dXAVB8AfEydFJ0UVK/C4ptIjx4LiH9+59+e67A4RGhalm1wSgapaRisfEbG5VDLyiDwEAvZiVmKkn0osZeI6ve/j4ehfhWd7n/hz9St5kgE8kjjLdsIg3iGc2LZ3zPnGIlSSF+Jx43KACiR+5Lrv8xrnosMAzQ0YmNU8cIhaLHSx3MCsZKvE0cVhRNcoXsi4rnLc4q5Uaa9XJbxjMaytprtMcQRxLSCAJETJqKKMCCxFaNVJMpGg/5uEfdvxJcsnkKoORYwFVqJAcP/gb/O6tWZiadJOCMaD7xbY/RoHALtCs2/b3sW03TwD/M3Cltf3VBjD3SXq9rYWPgIFt4OK6rcl7wOUOMPSkS4bkSH6aQqEAvJ/RM+WAwVv6EGtu31r7OH0AMtSr5Rvg4BAYK1L2use9ezr79u+ZVv9+AFlNcp0UUpiqAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAB3RJTUUH5AsHAB8VC4EQ6QAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAJUExURQAAAICHi4qKioTuJAkAAAABdFJOUwBA5thmAAAAAWJLR0QCZgt8ZAAAAJtJREFUOI3NkrsBgCAMRLFwBPdxBArcfxXFkO8rbKWAAJfHJ9faf9vuYX/749T5NmShm3bEwbe2SxeuM4+2oxDL1cDoKtVUjRy+tH78Cv2CS+wIiQNC1AEhk4AQeUTMWUJMfUJMSEJMSEY8kIx4IONroaYAimNxsXp1PA7PxwfVL8QnowwoVC0lig07wDDVUjAdbAnjwtow/z/bDW7eI4M2KruJAAAAAElFTkSuQmCC);
}
`;

	function appendInfobar$1(doc, options, useShadowRoot) {
		if (!doc.querySelector(INFOBAR_TAGNAME$1)) {
			let infoData;
			if (options.infobarContent) {
				infoData = options.infobarContent.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
			} else if (options.saveDate) {
				infoData = options.saveDate;
			}
			infoData = infoData || "No info";
			const parentElement = doc.body.tagName == "BODY" ? doc.body : doc.documentElement;
			const infobarElement = createElement(doc, INFOBAR_TAGNAME$1, parentElement);
			let infobarContainer;
			if (useShadowRoot) {
				infobarContainer = infobarElement.attachShadow({ mode: "open" });
			} else {
				const shadowRootTemplate = doc.createElement("template");
				shadowRootTemplate.setAttribute("shadowrootmode", "open");
				infobarElement.appendChild(shadowRootTemplate);
				infobarContainer = shadowRootTemplate;
			}
			const shadowRootContent = doc.createElement("div");
			const styleElement = doc.createElement("style");
			styleElement.textContent = INFOBAR_STYLES
				.replace(/ {2}/g, "")
				.replace(/\n/g, "")
				.replace(/: /g, ":")
				.replace(/, /g, ",");
			shadowRootContent.appendChild(styleElement);
			const infobarContent = doc.createElement("form");
			infobarContent.classList.add("infobar");
			shadowRootContent.appendChild(infobarContent);
			const iconElement = doc.createElement("span");
			iconElement.tabIndex = -1;
			iconElement.classList.add("infobar-icon");
			infobarContent.appendChild(iconElement);
			const contentElement = doc.createElement("span");
			contentElement.tabIndex = -1;
			contentElement.classList.add("infobar-content");
			const closeButtonElement = doc.createElement("input");
			closeButtonElement.type = "checkbox";
			closeButtonElement.required = true;
			closeButtonElement.classList.add("infobar-close-icon");
			closeButtonElement.title = "Close";
			contentElement.appendChild(closeButtonElement);
			const textElement = doc.createElement("span");
			textElement.textContent = infoData;
			contentElement.appendChild(textElement);
			const linkElement = doc.createElement("a");
			linkElement.classList.add("infobar-link-icon");
			linkElement.target = "_blank";
			linkElement.rel = "noopener noreferrer";
			linkElement.title = "Open source URL: " + options.saveUrl;
			linkElement.href = options.saveUrl;
			contentElement.appendChild(linkElement);
			infobarContent.appendChild(contentElement);
			if (useShadowRoot) {
				infobarContainer.appendChild(shadowRootContent);
			} else {
				const scriptElement = doc.createElement("script");
				let scriptContent = refreshInfobarInfo.toString();
				scriptContent += ";const SINGLE_FILE_SIGNATURE = " + JSON.stringify(SINGLE_FILE_SIGNATURE) + ";";
				scriptContent += extractInfobarData.toString();
				scriptContent += "(" + initInfobar.toString() + ")(document)";
				scriptElement.textContent = scriptContent;
				shadowRootContent.appendChild(scriptElement);
				infobarContainer.innerHTML = shadowRootContent.outerHTML;
			}
		}
	}

	function extractInfobarData(doc) {
		const result = doc.evaluate("//comment()", doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
		let singleFileComment = result && result.singleNodeValue;
		if (singleFileComment && singleFileComment.nodeType == Node.COMMENT_NODE && singleFileComment.textContent.includes(SINGLE_FILE_SIGNATURE)) {
			const info = singleFileComment.textContent.split("\n");
			const [, , urlData, ...optionalData] = info;
			const urlMatch = urlData.match(/^ url: (.*) ?$/);
			const saveUrl = urlMatch && urlMatch[1];
			if (saveUrl) {
				let infobarContent, saveDate;
				if (optionalData.length) {
					saveDate = optionalData[0].split("saved date: ")[1];
					if (saveDate) {
						optionalData.shift();
					}
					if (optionalData.length > 1) {
						let content = optionalData[0].split("info: ")[1].trim();
						for (let indexLine = 1; indexLine < optionalData.length - 1; indexLine++) {
							content += "\n" + optionalData[indexLine].trim();
						}
						infobarContent = content.trim();
					}
				}
				return { saveUrl, infobarContent, saveDate };
			}
		}
	}

	function refreshInfobarInfo(doc, { saveUrl, infobarContent, saveDate }) {
		if (saveUrl) {
			const infobarElement = doc.querySelector("single-file-infobar");
			const shadowRootFragment = infobarElement.shadowRoot;
			const infobarContentElement = shadowRootFragment.querySelector(".infobar-content span");
			infobarContentElement.textContent = infobarContent || saveDate;
			const linkElement = shadowRootFragment.querySelector(".infobar-content .infobar-link-icon");
			linkElement.href = saveUrl;
			linkElement.title = "Open source URL: " + saveUrl;
		}
	}

	function displayIcon(doc, useShadowRoot) {
		const infoData = extractInfobarData(doc);
		if (infoData.saveUrl) {
			appendInfobar$1(doc, infoData, useShadowRoot);
			refreshInfobarInfo(doc, infoData);
		}
	}

	function initInfobar(doc) {
		const infoData = extractInfobarData(doc);
		if (infoData && infoData.saveUrl) {
			refreshInfobarInfo(doc, infoData);
		}
	}

	function createElement(doc, tagName, parentElement) {
		const element = doc.createElement(tagName);
		parentElement.appendChild(element);
		Array.from(getComputedStyle(element)).forEach(property => element.style.setProperty(property, "initial", "important"));
		return element;
	}

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	const ON_BEFORE_CAPTURE_EVENT_NAME = SINGLE_FILE_PREFIX + "on-before-capture";
	const ON_AFTER_CAPTURE_EVENT_NAME = SINGLE_FILE_PREFIX + "on-after-capture";
	const GET_ADOPTED_STYLESHEETS_REQUEST_EVENT = SINGLE_FILE_PREFIX + "request-get-adopted-stylesheets";
	const GET_ADOPTED_STYLESHEETS_RESPONSE_EVENT = SINGLE_FILE_PREFIX + "response-get-adopted-stylesheets";
	const UNREGISTER_GET_ADOPTED_STYLESHEETS_REQUEST_EVENT = SINGLE_FILE_PREFIX + "unregister-request-get-adopted-stylesheets";
	const REMOVED_CONTENT_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "removed-content";
	const HIDDEN_CONTENT_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "hidden-content";
	const KEPT_CONTENT_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "kept-content";
	const HIDDEN_FRAME_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "hidden-frame";
	const PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "preserved-space-element";
	const SHADOW_ROOT_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "shadow-root-element";
	const WIN_ID_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "win-id";
	const IMAGE_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "image";
	const POSTER_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "poster";
	const VIDEO_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "video";
	const CANVAS_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "canvas";
	const STYLE_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "movable-style";
	const INPUT_VALUE_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "input-value";
	const LAZY_SRC_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "lazy-loaded-src";
	const STYLESHEET_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "stylesheet";
	const DISABLED_NOSCRIPT_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "disabled-noscript";
	const SELECTED_CONTENT_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "selected-content";
	const INVALID_ELEMENT_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "invalid-element";
	const ASYNC_SCRIPT_ATTRIBUTE_NAME = "data-" + SINGLE_FILE_PREFIX + "async-script";
	const FLOW_ELEMENTS_SELECTOR = "*:not(base):not(link):not(meta):not(noscript):not(script):not(style):not(template):not(title)";
	const KEPT_TAG_NAMES = ["NOSCRIPT", "DISABLED-NOSCRIPT", "META", "LINK", "STYLE", "TITLE", "TEMPLATE", "SOURCE", "OBJECT", "SCRIPT", "HEAD", "BODY"];
	const IGNORED_TAG_NAMES = ["SCRIPT", "NOSCRIPT", "META", "LINK", "TEMPLATE"];
	const REGEXP_SIMPLE_QUOTES_STRING$1 = /^'(.*?)'$/;
	const REGEXP_DOUBLE_QUOTES_STRING$1 = /^"(.*?)"$/;
	const FONT_WEIGHTS = {
		regular: "400",
		normal: "400",
		bold: "700",
		bolder: "700",
		lighter: "100"
	};
	const COMMENT_HEADER_LEGACY = "Archive processed by SingleFile";
	const SINGLE_FILE_UI_ELEMENT_CLASS = "single-file-ui-element";
	const INFOBAR_TAGNAME = INFOBAR_TAGNAME$1;
	const EMPTY_RESOURCE$1 = "data:,";
	const JSON$1 = globalThis.JSON;
	const crypto$1 = globalThis.crypto;
	const TextEncoder$1 = globalThis.TextEncoder;
	const Blob$4 = globalThis.Blob;
	const CustomEvent = globalThis.CustomEvent;

	function initDoc(doc) {
		doc.querySelectorAll("meta[http-equiv=refresh]").forEach(element => {
			element.removeAttribute("http-equiv");
			element.setAttribute("disabled-http-equiv", "refresh");
		});
	}

	function preProcessDoc(doc, win, options) {
		doc.querySelectorAll("noscript:not([" + DISABLED_NOSCRIPT_ATTRIBUTE_NAME + "])").forEach(element => {
			element.setAttribute(DISABLED_NOSCRIPT_ATTRIBUTE_NAME, element.textContent);
			element.textContent = "";
		});
		initDoc(doc);
		if (doc.head) {
			doc.head.querySelectorAll(FLOW_ELEMENTS_SELECTOR).forEach(element => element.hidden = true);
		}
		doc.querySelectorAll("svg foreignObject").forEach(element => {
			const flowElements = element.querySelectorAll("html > head > " + FLOW_ELEMENTS_SELECTOR + ", html > body > " + FLOW_ELEMENTS_SELECTOR);
			if (flowElements.length) {
				Array.from(element.childNodes).forEach(node => node.remove());
				flowElements.forEach(flowElement => element.appendChild(flowElement));
			}
		});
		const invalidElements = new Map();
		let elementsInfo;
		if (win && doc.documentElement) {
			doc.querySelectorAll("button button, a a").forEach(element => {
				const placeHolderElement = doc.createElement("template");
				placeHolderElement.setAttribute(INVALID_ELEMENT_ATTRIBUTE_NAME, "");
				placeHolderElement.content.appendChild(element.cloneNode(true));
				invalidElements.set(element, placeHolderElement);
				element.replaceWith(placeHolderElement);
			});
			elementsInfo = getElementsInfo(win, doc, doc.documentElement, options);
			if (options.moveStylesInHead) {
				doc.querySelectorAll("body style, body ~ style").forEach(element => {
					const computedStyle = getComputedStyle$1(win, element);
					if (computedStyle && testHiddenElement(element, computedStyle)) {
						element.setAttribute(STYLE_ATTRIBUTE_NAME, "");
						elementsInfo.markedElements.push(element);
					}
				});
			}
		} else {
			elementsInfo = {
				canvases: [],
				images: [],
				posters: [],
				videos: [],
				usedFonts: [],
				shadowRoots: [],
				markedElements: []
			};
		}
		return {
			canvases: elementsInfo.canvases,
			fonts: getFontsData(),
			stylesheets: getStylesheetsData(doc),
			images: elementsInfo.images,
			posters: elementsInfo.posters,
			videos: elementsInfo.videos,
			usedFonts: Array.from(elementsInfo.usedFonts.values()),
			shadowRoots: elementsInfo.shadowRoots,
			referrer: doc.referrer,
			markedElements: elementsInfo.markedElements,
			invalidElements,
			scrollPosition: { x: win.scrollX, y: win.scrollY },
			adoptedStyleSheets: getStylesheetsContent(doc.adoptedStyleSheets)
		};
	}

	function getElementsInfo(win, doc, element, options, data = { usedFonts: new Map(), canvases: [], images: [], posters: [], videos: [], shadowRoots: [], markedElements: [] }, ascendantHidden) {
		if (element.childNodes) {
			const elements = Array.from(element.childNodes).filter(node => (node instanceof win.HTMLElement) || (node instanceof win.SVGElement) || (node instanceof globalThis.HTMLElement) || (node instanceof globalThis.SVGElement));
			elements.forEach(element => {
				let elementHidden, elementKept, computedStyle;
				if (!options.autoSaveExternalSave && (options.removeHiddenElements || options.removeUnusedFonts || options.compressHTML)) {
					computedStyle = getComputedStyle$1(win, element);
					if ((element instanceof win.HTMLElement) || (element instanceof globalThis.HTMLElement)) {
						if (options.removeHiddenElements) {
							elementKept = ((ascendantHidden || element.closest("html > head")) && KEPT_TAG_NAMES.includes(element.tagName.toUpperCase())) || element.closest("details");
							if (!elementKept) {
								elementHidden = ascendantHidden || testHiddenElement(element, computedStyle);
								if (elementHidden && !IGNORED_TAG_NAMES.includes(element.tagName.toUpperCase())) {
									element.setAttribute(HIDDEN_CONTENT_ATTRIBUTE_NAME, "");
									data.markedElements.push(element);
								}
							}
						}
					}
					if (!elementHidden) {
						if (options.compressHTML && computedStyle) {
							const whiteSpace = computedStyle.getPropertyValue("white-space");
							if (whiteSpace && whiteSpace.startsWith("pre")) {
								element.setAttribute(PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME, "");
								data.markedElements.push(element);
							}
						}
						if (options.removeUnusedFonts) {
							getUsedFont(computedStyle, options, data.usedFonts);
							getUsedFont(getComputedStyle$1(win, element, ":first-letter"), options, data.usedFonts);
							getUsedFont(getComputedStyle$1(win, element, ":before"), options, data.usedFonts);
							getUsedFont(getComputedStyle$1(win, element, ":after"), options, data.usedFonts);
						}
					}
				}
				getResourcesInfo(win, doc, element, options, data, elementHidden, computedStyle);
				const shadowRoot = !((element instanceof win.SVGElement) || (element instanceof globalThis.SVGElement)) && getShadowRoot(element);
				if (shadowRoot && !element.classList.contains(SINGLE_FILE_UI_ELEMENT_CLASS) && element.tagName.toLowerCase() != INFOBAR_TAGNAME) {
					const shadowRootInfo = {};
					element.setAttribute(SHADOW_ROOT_ATTRIBUTE_NAME, data.shadowRoots.length);
					data.markedElements.push(element);
					data.shadowRoots.push(shadowRootInfo);
					try {
						if (shadowRoot.adoptedStyleSheets) {
							if (shadowRoot.adoptedStyleSheets.length) {
								shadowRootInfo.adoptedStyleSheets = getStylesheetsContent(shadowRoot.adoptedStyleSheets);
							} else if (shadowRoot.adoptedStyleSheets.length === undefined) {
								const listener = event => shadowRootInfo.adoptedStyleSheets = event.detail.adoptedStyleSheets;
								shadowRoot.addEventListener(GET_ADOPTED_STYLESHEETS_RESPONSE_EVENT, listener);
								shadowRoot.dispatchEvent(new CustomEvent(GET_ADOPTED_STYLESHEETS_REQUEST_EVENT, { bubbles: true }));
								if (!shadowRootInfo.adoptedStyleSheets) {
									element.dispatchEvent(new CustomEvent(GET_ADOPTED_STYLESHEETS_REQUEST_EVENT, { bubbles: true }));
								}
								shadowRoot.removeEventListener(GET_ADOPTED_STYLESHEETS_RESPONSE_EVENT, listener);
							}
						}
					} catch (error) {
						// ignored
					}
					getElementsInfo(win, doc, shadowRoot, options, data, elementHidden);
					shadowRootInfo.content = shadowRoot.innerHTML;
					shadowRootInfo.mode = shadowRoot.mode;
					try {
						if (shadowRoot.adoptedStyleSheets && shadowRoot.adoptedStyleSheets.length === undefined) {
							shadowRoot.dispatchEvent(new CustomEvent(UNREGISTER_GET_ADOPTED_STYLESHEETS_REQUEST_EVENT, { bubbles: true }));
						}
					} catch (error) {
						// ignored
					}
				}
				getElementsInfo(win, doc, element, options, data, elementHidden);
				if (!options.autoSaveExternalSave && options.removeHiddenElements && ascendantHidden) {
					if (elementKept || element.getAttribute(KEPT_CONTENT_ATTRIBUTE_NAME) == "") {
						if (element.parentElement) {
							element.parentElement.setAttribute(KEPT_CONTENT_ATTRIBUTE_NAME, "");
							data.markedElements.push(element.parentElement);
						}
					} else if (elementHidden) {
						element.setAttribute(REMOVED_CONTENT_ATTRIBUTE_NAME, "");
						data.markedElements.push(element);
					}
				}
			});
		}
		return data;
	}

	function getStylesheetsContent(styleSheets) {
		return styleSheets ? Array.from(styleSheets).map(stylesheet => Array.from(stylesheet.cssRules).map(cssRule => cssRule.cssText).join("\n")) : [];
	}

	function getResourcesInfo(win, doc, element, options, data, elementHidden, computedStyle) {
		const tagName = element.tagName && element.tagName.toUpperCase();
		if (tagName == "CANVAS") {
			try {
				data.canvases.push({
					dataURI: element.toDataURL("image/png", ""),
					backgroundColor: computedStyle.getPropertyValue("background-color")
				});
				element.setAttribute(CANVAS_ATTRIBUTE_NAME, data.canvases.length - 1);
				data.markedElements.push(element);
			} catch (error) {
				// ignored
			}
		}
		if (tagName == "IMG") {
			const imageData = {
				currentSrc: elementHidden ?
					EMPTY_RESOURCE$1 :
					(options.loadDeferredImages && element.getAttribute(LAZY_SRC_ATTRIBUTE_NAME)) || element.currentSrc
			};
			data.images.push(imageData);
			element.setAttribute(IMAGE_ATTRIBUTE_NAME, data.images.length - 1);
			data.markedElements.push(element);
			element.removeAttribute(LAZY_SRC_ATTRIBUTE_NAME);
			computedStyle = computedStyle || getComputedStyle$1(win, element);
			if (computedStyle) {
				imageData.size = getSize(win, element, computedStyle);
				const boxShadow = computedStyle.getPropertyValue("box-shadow");
				const backgroundImage = computedStyle.getPropertyValue("background-image");
				if ((!boxShadow || boxShadow == "none") &&
					(!backgroundImage || backgroundImage == "none") &&
					(imageData.size.pxWidth > 1 || imageData.size.pxHeight > 1)) {
					imageData.replaceable = true;
					imageData.backgroundColor = computedStyle.getPropertyValue("background-color");
					imageData.objectFit = computedStyle.getPropertyValue("object-fit");
					imageData.boxSizing = computedStyle.getPropertyValue("box-sizing");
					imageData.objectPosition = computedStyle.getPropertyValue("object-position");
				}
			}
		}
		if (tagName == "VIDEO") {
			const src = element.currentSrc;
			if (src && !src.startsWith("blob:") && !src.startsWith("data:")) {
				const computedStyle = getComputedStyle$1(win, element.parentNode);
				data.videos.push({
					positionParent: computedStyle && computedStyle.getPropertyValue("position"),
					src,
					size: {
						pxWidth: element.clientWidth,
						pxHeight: element.clientHeight
					},
					currentTime: element.currentTime
				});
				element.setAttribute(VIDEO_ATTRIBUTE_NAME, data.videos.length - 1);
			}
			if (!element.getAttribute("poster")) {
				const canvasElement = doc.createElement("canvas");
				const context = canvasElement.getContext("2d");
				canvasElement.width = element.clientWidth;
				canvasElement.height = element.clientHeight;
				try {
					context.drawImage(element, 0, 0, canvasElement.width, canvasElement.height);
					data.posters.push(canvasElement.toDataURL("image/png", ""));
					element.setAttribute(POSTER_ATTRIBUTE_NAME, data.posters.length - 1);
					data.markedElements.push(element);
				} catch (error) {
					// ignored
				}
			}
		}
		if (tagName == "IFRAME") {
			if (elementHidden && options.removeHiddenElements) {
				element.setAttribute(HIDDEN_FRAME_ATTRIBUTE_NAME, "");
				data.markedElements.push(element);
			}
		}
		if (tagName == "INPUT") {
			if (element.type != "password") {
				element.setAttribute(INPUT_VALUE_ATTRIBUTE_NAME, element.value);
				data.markedElements.push(element);
			}
			if (element.type == "radio" || element.type == "checkbox") {
				element.setAttribute(INPUT_VALUE_ATTRIBUTE_NAME, element.checked);
				data.markedElements.push(element);
			}
		}
		if (tagName == "TEXTAREA") {
			element.setAttribute(INPUT_VALUE_ATTRIBUTE_NAME, element.value);
			data.markedElements.push(element);
		}
		if (tagName == "SELECT") {
			element.querySelectorAll("option").forEach(option => {
				if (option.selected) {
					option.setAttribute(INPUT_VALUE_ATTRIBUTE_NAME, "");
					data.markedElements.push(option);
				}
			});
		}
		if (tagName == "SCRIPT") {
			if (element.async && element.getAttribute("async") != "" && element.getAttribute("async") != "async") {
				element.setAttribute(ASYNC_SCRIPT_ATTRIBUTE_NAME, "");
				data.markedElements.push(element);
			}
			element.textContent = element.textContent.replace(/<\/script>/gi, "<\\/script>");
		}
	}

	function getUsedFont(computedStyle, options, usedFonts) {
		if (computedStyle) {
			const fontStyle = computedStyle.getPropertyValue("font-style") || "normal";
			computedStyle.getPropertyValue("font-family").split(",").forEach(fontFamilyName => {
				fontFamilyName = normalizeFontFamily(fontFamilyName);
				if (!options.loadedFonts || options.loadedFonts.find(font => normalizeFontFamily(font.family) == fontFamilyName && font.style == fontStyle)) {
					const fontWeight = getFontWeight(computedStyle.getPropertyValue("font-weight"));
					const fontVariant = computedStyle.getPropertyValue("font-variant") || "normal";
					const value = [fontFamilyName, fontWeight, fontStyle, fontVariant];
					usedFonts.set(JSON$1.stringify(value), [fontFamilyName, fontWeight, fontStyle, fontVariant]);
				}
			});
		}
	}

	function getShadowRoot(element) {
		const chrome = globalThis.chrome;
		if (element.openOrClosedShadowRoot) {
			return element.openOrClosedShadowRoot;
		} else if (chrome && chrome.dom && chrome.dom.openOrClosedShadowRoot) {
			try {
				return chrome.dom.openOrClosedShadowRoot(element);
			} catch (error) {
				return element.shadowRoot;
			}
		} else {
			return element.shadowRoot;
		}
	}

	function appendInfobar(doc, options, useShadowRoot) {
		return appendInfobar$1(doc, options, useShadowRoot);
	}

	function normalizeFontFamily(fontFamilyName = "") {
		return removeQuotes$1(process$6(fontFamilyName.trim())).toLowerCase();
	}

	function testHiddenElement(element, computedStyle) {
		let hidden = false;
		if (computedStyle) {
			const display = computedStyle.getPropertyValue("display");
			const opacity = computedStyle.getPropertyValue("opacity");
			const visibility = computedStyle.getPropertyValue("visibility");
			hidden = display == "none";
			if (!hidden && (opacity == "0" || visibility == "hidden") && element.getBoundingClientRect) {
				const boundingRect = element.getBoundingClientRect();
				hidden = !boundingRect.width && !boundingRect.height;
			}
		}
		return Boolean(hidden);
	}

	function postProcessDoc(doc, markedElements, invalidElements) {
		doc.querySelectorAll("[" + DISABLED_NOSCRIPT_ATTRIBUTE_NAME + "]").forEach(element => {
			element.textContent = element.getAttribute(DISABLED_NOSCRIPT_ATTRIBUTE_NAME);
			element.removeAttribute(DISABLED_NOSCRIPT_ATTRIBUTE_NAME);
		});
		doc.querySelectorAll("meta[disabled-http-equiv]").forEach(element => {
			element.setAttribute("http-equiv", element.getAttribute("disabled-http-equiv"));
			element.removeAttribute("disabled-http-equiv");
		});
		if (doc.head) {
			doc.head.querySelectorAll("*:not(base):not(link):not(meta):not(noscript):not(script):not(style):not(template):not(title)").forEach(element => element.removeAttribute("hidden"));
		}
		if (!markedElements) {
			const singleFileAttributes = [REMOVED_CONTENT_ATTRIBUTE_NAME, HIDDEN_FRAME_ATTRIBUTE_NAME, HIDDEN_CONTENT_ATTRIBUTE_NAME, PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME, IMAGE_ATTRIBUTE_NAME, POSTER_ATTRIBUTE_NAME, VIDEO_ATTRIBUTE_NAME, CANVAS_ATTRIBUTE_NAME, INPUT_VALUE_ATTRIBUTE_NAME, SHADOW_ROOT_ATTRIBUTE_NAME, STYLESHEET_ATTRIBUTE_NAME, ASYNC_SCRIPT_ATTRIBUTE_NAME];
			markedElements = doc.querySelectorAll(singleFileAttributes.map(name => "[" + name + "]").join(","));
		}
		markedElements.forEach(element => {
			element.removeAttribute(REMOVED_CONTENT_ATTRIBUTE_NAME);
			element.removeAttribute(HIDDEN_CONTENT_ATTRIBUTE_NAME);
			element.removeAttribute(KEPT_CONTENT_ATTRIBUTE_NAME);
			element.removeAttribute(HIDDEN_FRAME_ATTRIBUTE_NAME);
			element.removeAttribute(PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME);
			element.removeAttribute(IMAGE_ATTRIBUTE_NAME);
			element.removeAttribute(POSTER_ATTRIBUTE_NAME);
			element.removeAttribute(VIDEO_ATTRIBUTE_NAME);
			element.removeAttribute(CANVAS_ATTRIBUTE_NAME);
			element.removeAttribute(INPUT_VALUE_ATTRIBUTE_NAME);
			element.removeAttribute(SHADOW_ROOT_ATTRIBUTE_NAME);
			element.removeAttribute(STYLESHEET_ATTRIBUTE_NAME);
			element.removeAttribute(ASYNC_SCRIPT_ATTRIBUTE_NAME);
			element.removeAttribute(STYLE_ATTRIBUTE_NAME);
		});
		if (invalidElements) {
			invalidElements.forEach((placeholderElement, element) => placeholderElement.replaceWith(element));
		}
	}

	function getStylesheetsData(doc) {
		if (doc) {
			const contents = [];
			doc.querySelectorAll("style").forEach((styleElement, styleIndex) => {
				try {
					if (!styleElement.sheet.disabled) {
						const tempStyleElement = doc.createElement("style");
						tempStyleElement.textContent = styleElement.textContent;
						doc.body.appendChild(tempStyleElement);
						const stylesheet = tempStyleElement.sheet;
						tempStyleElement.remove();
						const textContentStylesheet = Array.from(stylesheet.cssRules).map(cssRule => cssRule.cssText).join("\n");
						const sheetStylesheet = Array.from(styleElement.sheet.cssRules).map(cssRule => cssRule.cssText).join("\n");
						if (!stylesheet || textContentStylesheet != sheetStylesheet) {
							styleElement.setAttribute(STYLESHEET_ATTRIBUTE_NAME, styleIndex);
							contents[styleIndex] = Array.from(styleElement.sheet.cssRules).map(cssRule => cssRule.cssText).join("\n");
						}
					}
				} catch (error) {
					// ignored
				}
			});
			return contents;
		}
	}

	function getSize(win, imageElement, computedStyle) {
		let pxWidth = imageElement.naturalWidth;
		let pxHeight = imageElement.naturalHeight;
		if (!pxWidth && !pxHeight) {
			const noStyleAttribute = imageElement.getAttribute("style") == null;
			computedStyle = computedStyle || getComputedStyle$1(win, imageElement);
			if (computedStyle) {
				let removeBorderWidth = false;
				if (computedStyle.getPropertyValue("box-sizing") == "content-box") {
					const boxSizingValue = imageElement.style.getPropertyValue("box-sizing");
					const boxSizingPriority = imageElement.style.getPropertyPriority("box-sizing");
					const clientWidth = imageElement.clientWidth;
					imageElement.style.setProperty("box-sizing", "border-box", "important");
					removeBorderWidth = imageElement.clientWidth != clientWidth;
					if (boxSizingValue) {
						imageElement.style.setProperty("box-sizing", boxSizingValue, boxSizingPriority);
					} else {
						imageElement.style.removeProperty("box-sizing");
					}
				}
				let paddingLeft, paddingRight, paddingTop, paddingBottom, borderLeft, borderRight, borderTop, borderBottom;
				paddingLeft = getWidth("padding-left", computedStyle);
				paddingRight = getWidth("padding-right", computedStyle);
				paddingTop = getWidth("padding-top", computedStyle);
				paddingBottom = getWidth("padding-bottom", computedStyle);
				if (removeBorderWidth) {
					borderLeft = getWidth("border-left-width", computedStyle);
					borderRight = getWidth("border-right-width", computedStyle);
					borderTop = getWidth("border-top-width", computedStyle);
					borderBottom = getWidth("border-bottom-width", computedStyle);
				} else {
					borderLeft = borderRight = borderTop = borderBottom = 0;
				}
				pxWidth = Math.max(0, imageElement.clientWidth - paddingLeft - paddingRight - borderLeft - borderRight);
				pxHeight = Math.max(0, imageElement.clientHeight - paddingTop - paddingBottom - borderTop - borderBottom);
				if (noStyleAttribute) {
					imageElement.removeAttribute("style");
				}
			}
		}
		return { pxWidth, pxHeight };
	}

	function getWidth(styleName, computedStyle) {
		if (computedStyle.getPropertyValue(styleName).endsWith("px")) {
			return parseFloat(computedStyle.getPropertyValue(styleName));
		}
	}

	function getFontsData() {
		return getFontsData$1();
	}

	function removeQuotes$1(string) {
		if (string.match(REGEXP_SIMPLE_QUOTES_STRING$1)) {
			string = string.replace(REGEXP_SIMPLE_QUOTES_STRING$1, "$1");
		} else {
			string = string.replace(REGEXP_DOUBLE_QUOTES_STRING$1, "$1");
		}
		return string.trim();
	}

	function getFontWeight(weight) {
		return FONT_WEIGHTS[weight.toLowerCase().trim()] || weight;
	}

	function getContentSize(content) {
		return new Blob$4([content]).size;
	}

	async function digest(algo, text) {
		try {
			const hash = await crypto$1.subtle.digest(algo, new TextEncoder$1("utf-8").encode(text));
			return hex(hash);
		} catch (error) {
			return "";
		}
	}

	// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
	function hex(buffer) {
		const hexCodes = [];
		const view = new DataView(buffer);
		for (let i = 0; i < view.byteLength; i += 4) {
			const value = view.getUint32(i);
			const stringValue = value.toString(16);
			const padding = "00000000";
			const paddedValue = (padding + stringValue).slice(-padding.length);
			hexCodes.push(paddedValue);
		}
		return hexCodes.join("");
	}

	function flatten(array) {
		return array.flat ? array.flat() : array.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []);
	}

	function getComputedStyle$1(win, element, pseudoElement) {
		try {
			return win.getComputedStyle(element, pseudoElement);
		} catch (error) {
			// ignored
		}
	}

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 *
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or
	 *   modify it under the terms of the GNU Affero General Public License
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 *
	 *   The code in this file is distributed in the hope that it will be useful,
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU
	 *   AGPL normally required by section 4, provided you include this license
	 *   notice and a URL through which recipients can access the Corresponding
	 *   Source.
	 */

	const Blob$3 = globalThis.Blob;
	const FileReader$2 = globalThis.FileReader;
	const URL$3 = globalThis.URL;
	const URLSearchParams$1 = globalThis.URLSearchParams;

	// eslint-disable-next-line quotes
	const DEFAULT_REPLACED_CHARACTERS$1 = ["~", "+", "\\\\", "?", "%", "*", ":", "|", '"', "<", ">", "\x00-\x1f", "\x7F"];
	const DEFAULT_REPLACEMENT_CHARACTER$1 = "_";
	const REGEXP_ESCAPE = /([{}()^$&.*?/+|[\\\\]|\]|-)/g;

	const EMOJI_NAMES = {
		"😀": "grinning-face",
		"😃": "grinning-face-with-big-eyes",
		"😄": "grinning-face-with-smiling-eyes",
		"😁": "beaming-face-with-smiling-eyes",
		"😆": "grinning-squinting-face",
		"😅": "grinning-face-with-sweat",
		"🤣": "rolling-on-the-floor-laughing",
		"😂": "face-with-tears-of-joy",
		"🙂": "slightly-smiling-face",
		"🙃": "upside-down-face",
		"🫠": "melting-face",
		"😉": "winking-face",
		"😊": "smiling-face-with-smiling-eyes",
		"😇": "smiling-face-with-halo",
		"🥰": "smiling-face-with-hearts",
		"😍": "smiling-face-with-heart-eyes",
		"🤩": "star-struck",
		"😘": "face-blowing-a-kiss",
		"😗": "kissing-face",
		"☺": "smiling-face",
		"😚": "kissing-face-with-closed-eyes",
		"😙": "kissing-face-with-smiling-eyes",
		"🥲": "smiling-face-with-tear",
		"😋": "face-savoring-food",
		"😛": "face-with-tongue",
		"😜": "winking-face-with-tongue",
		"🤪": "zany-face",
		"😝": "squinting-face-with-tongue",
		"🤑": "money-mouth-face",
		"🤗": "smiling-face-with-open-hands",
		"🤭": "face-with-hand-over-mouth",
		"🫢": "face-with-open-eyes-and-hand-over-mouth",
		"🫣": "face-with-peeking-eye",
		"🤫": "shushing-face",
		"🤔": "thinking-face",
		"🫡": "saluting-face",
		"🤐": "zipper-mouth-face",
		"🤨": "face-with-raised-eyebrow",
		"😐": "neutral-face",
		"😑": "expressionless-face",
		"😶": "face-without-mouth",
		"🫥": "dotted-line-face",
		"😶‍🌫️": "face-in-clouds",
		"😏": "smirking-face",
		"😒": "unamused-face",
		"🙄": "face-with-rolling-eyes",
		"😬": "grimacing-face",
		"😮‍💨": "face-exhaling",
		"🤥": "lying-face",
		"🫨": "⊛-shaking-face",
		"😌": "relieved-face",
		"😔": "pensive-face",
		"😪": "sleepy-face",
		"🤤": "drooling-face",
		"😴": "sleeping-face",
		"😷": "face-with-medical-mask",
		"🤒": "face-with-thermometer",
		"🤕": "face-with-head-bandage",
		"🤢": "nauseated-face",
		"🤮": "face-vomiting",
		"🤧": "sneezing-face",
		"🥵": "hot-face",
		"🥶": "cold-face",
		"🥴": "woozy-face",
		"😵": "face-with-crossed-out-eyes",
		"😵‍💫": "face-with-spiral-eyes",
		"🤯": "exploding-head",
		"🤠": "cowboy-hat-face",
		"🥳": "partying-face",
		"🥸": "disguised-face",
		"😎": "smiling-face-with-sunglasses",
		"🤓": "nerd-face",
		"🧐": "face-with-monocle",
		"😕": "confused-face",
		"🫤": "face-with-diagonal-mouth",
		"😟": "worried-face",
		"🙁": "slightly-frowning-face",
		"☹": "frowning-face",
		"😮": "face-with-open-mouth",
		"😯": "hushed-face",
		"😲": "astonished-face",
		"😳": "flushed-face",
		"🥺": "pleading-face",
		"🥹": "face-holding-back-tears",
		"😦": "frowning-face-with-open-mouth",
		"😧": "anguished-face",
		"😨": "fearful-face",
		"😰": "anxious-face-with-sweat",
		"😥": "sad-but-relieved-face",
		"😢": "crying-face",
		"😭": "loudly-crying-face",
		"😱": "face-screaming-in-fear",
		"😖": "confounded-face",
		"😣": "persevering-face",
		"😞": "disappointed-face",
		"😓": "downcast-face-with-sweat",
		"😩": "weary-face",
		"😫": "tired-face",
		"🥱": "yawning-face",
		"😤": "face-with-steam-from-nose",
		"😡": "enraged-face",
		"😠": "angry-face",
		"🤬": "face-with-symbols-on-mouth",
		"😈": "smiling-face-with-horns",
		"👿": "angry-face-with-horns",
		"💀": "skull",
		"☠": "skull-and-crossbones",
		"💩": "pile-of-poo",
		"🤡": "clown-face",
		"👹": "ogre",
		"👺": "goblin",
		"👻": "ghost",
		"👽": "alien",
		"👾": "alien-monster",
		"🤖": "robot",
		"😺": "grinning-cat",
		"😸": "grinning-cat-with-smiling-eyes",
		"😹": "cat-with-tears-of-joy",
		"😻": "smiling-cat-with-heart-eyes",
		"😼": "cat-with-wry-smile",
		"😽": "kissing-cat",
		"🙀": "weary-cat",
		"😿": "crying-cat",
		"😾": "pouting-cat",
		"🙈": "see-no-evil-monkey",
		"🙉": "hear-no-evil-monkey",
		"🙊": "speak-no-evil-monkey",
		"💌": "love-letter",
		"💘": "heart-with-arrow",
		"💝": "heart-with-ribbon",
		"💖": "sparkling-heart",
		"💗": "growing-heart",
		"💓": "beating-heart",
		"💞": "revolving-hearts",
		"💕": "two-hearts",
		"💟": "heart-decoration",
		"❣": "heart-exclamation",
		"💔": "broken-heart",
		"❤️‍🔥": "heart-on-fire",
		"❤️‍🩹": "mending-heart",
		"❤": "red-heart",
		"🩷": "⊛-pink-heart",
		"🧡": "orange-heart",
		"💛": "yellow-heart",
		"💚": "green-heart",
		"💙": "blue-heart",
		"🩵": "⊛-light-blue-heart",
		"💜": "purple-heart",
		"🤎": "brown-heart",
		"🖤": "black-heart",
		"🩶": "⊛-grey-heart",
		"🤍": "white-heart",
		"💋": "kiss-mark",
		"💯": "hundred-points",
		"💢": "anger-symbol",
		"💥": "collision",
		"💫": "dizzy",
		"💦": "sweat-droplets",
		"💨": "dashing-away",
		"🕳": "hole",
		"💬": "speech-balloon",
		"👁️‍🗨️": "eye-in-speech-bubble",
		"🗨": "left-speech-bubble",
		"🗯": "right-anger-bubble",
		"💭": "thought-balloon",
		"💤": "zzz",
		"👋": "waving-hand",
		"🤚": "raised-back-of-hand",
		"🖐": "hand-with-fingers-splayed",
		"✋": "raised-hand",
		"🖖": "vulcan-salute",
		"🫱": "rightwards-hand",
		"🫲": "leftwards-hand",
		"🫳": "palm-down-hand",
		"🫴": "palm-up-hand",
		"🫷": "⊛-leftwards-pushing-hand",
		"🫸": "⊛-rightwards-pushing-hand",
		"👌": "ok-hand",
		"🤌": "pinched-fingers",
		"🤏": "pinching-hand",
		"✌": "victory-hand",
		"🤞": "crossed-fingers",
		"🫰": "hand-with-index-finger-and-thumb-crossed",
		"🤟": "love-you-gesture",
		"🤘": "sign-of-the-horns",
		"🤙": "call-me-hand",
		"👈": "backhand-index-pointing-left",
		"👉": "backhand-index-pointing-right",
		"👆": "backhand-index-pointing-up",
		"🖕": "middle-finger",
		"👇": "backhand-index-pointing-down",
		"☝": "index-pointing-up",
		"🫵": "index-pointing-at-the-viewer",
		"👍": "thumbs-up",
		"👎": "thumbs-down",
		"✊": "raised-fist",
		"👊": "oncoming-fist",
		"🤛": "left-facing-fist",
		"🤜": "right-facing-fist",
		"👏": "clapping-hands",
		"🙌": "raising-hands",
		"🫶": "heart-hands",
		"👐": "open-hands",
		"🤲": "palms-up-together",
		"🤝": "handshake",
		"🙏": "folded-hands",
		"✍": "writing-hand",
		"💅": "nail-polish",
		"🤳": "selfie",
		"💪": "flexed-biceps",
		"🦾": "mechanical-arm",
		"🦿": "mechanical-leg",
		"🦵": "leg",
		"🦶": "foot",
		"👂": "ear",
		"🦻": "ear-with-hearing-aid",
		"👃": "nose",
		"🧠": "brain",
		"🫀": "anatomical-heart",
		"🫁": "lungs",
		"🦷": "tooth",
		"🦴": "bone",
		"👀": "eyes",
		"👁": "eye",
		"👅": "tongue",
		"👄": "mouth",
		"🫦": "biting-lip",
		"👶": "baby",
		"🧒": "child",
		"👦": "boy",
		"👧": "girl",
		"🧑": "person",
		"👱": "person-blond-hair",
		"👨": "man",
		"🧔": "person-beard",
		"🧔‍♂️": "man-beard",
		"🧔‍♀️": "woman-beard",
		"👨‍🦰": "man-red-hair",
		"👨‍🦱": "man-curly-hair",
		"👨‍🦳": "man-white-hair",
		"👨‍🦲": "man-bald",
		"👩": "woman",
		"👩‍🦰": "woman-red-hair",
		"🧑‍🦰": "person-red-hair",
		"👩‍🦱": "woman-curly-hair",
		"🧑‍🦱": "person-curly-hair",
		"👩‍🦳": "woman-white-hair",
		"🧑‍🦳": "person-white-hair",
		"👩‍🦲": "woman-bald",
		"🧑‍🦲": "person-bald",
		"👱‍♀️": "woman-blond-hair",
		"👱‍♂️": "man-blond-hair",
		"🧓": "older-person",
		"👴": "old-man",
		"👵": "old-woman",
		"🙍": "person-frowning",
		"🙍‍♂️": "man-frowning",
		"🙍‍♀️": "woman-frowning",
		"🙎": "person-pouting",
		"🙎‍♂️": "man-pouting",
		"🙎‍♀️": "woman-pouting",
		"🙅": "person-gesturing-no",
		"🙅‍♂️": "man-gesturing-no",
		"🙅‍♀️": "woman-gesturing-no",
		"🙆": "person-gesturing-ok",
		"🙆‍♂️": "man-gesturing-ok",
		"🙆‍♀️": "woman-gesturing-ok",
		"💁": "person-tipping-hand",
		"💁‍♂️": "man-tipping-hand",
		"💁‍♀️": "woman-tipping-hand",
		"🙋": "person-raising-hand",
		"🙋‍♂️": "man-raising-hand",
		"🙋‍♀️": "woman-raising-hand",
		"🧏": "deaf-person",
		"🧏‍♂️": "deaf-man",
		"🧏‍♀️": "deaf-woman",
		"🙇": "person-bowing",
		"🙇‍♂️": "man-bowing",
		"🙇‍♀️": "woman-bowing",
		"🤦": "person-facepalming",
		"🤦‍♂️": "man-facepalming",
		"🤦‍♀️": "woman-facepalming",
		"🤷": "person-shrugging",
		"🤷‍♂️": "man-shrugging",
		"🤷‍♀️": "woman-shrugging",
		"🧑‍⚕️": "health-worker",
		"👨‍⚕️": "man-health-worker",
		"👩‍⚕️": "woman-health-worker",
		"🧑‍🎓": "student",
		"👨‍🎓": "man-student",
		"👩‍🎓": "woman-student",
		"🧑‍🏫": "teacher",
		"👨‍🏫": "man-teacher",
		"👩‍🏫": "woman-teacher",
		"🧑‍⚖️": "judge",
		"👨‍⚖️": "man-judge",
		"👩‍⚖️": "woman-judge",
		"🧑‍🌾": "farmer",
		"👨‍🌾": "man-farmer",
		"👩‍🌾": "woman-farmer",
		"🧑‍🍳": "cook",
		"👨‍🍳": "man-cook",
		"👩‍🍳": "woman-cook",
		"🧑‍🔧": "mechanic",
		"👨‍🔧": "man-mechanic",
		"👩‍🔧": "woman-mechanic",
		"🧑‍🏭": "factory-worker",
		"👨‍🏭": "man-factory-worker",
		"👩‍🏭": "woman-factory-worker",
		"🧑‍💼": "office-worker",
		"👨‍💼": "man-office-worker",
		"👩‍💼": "woman-office-worker",
		"🧑‍🔬": "scientist",
		"👨‍🔬": "man-scientist",
		"👩‍🔬": "woman-scientist",
		"🧑‍💻": "technologist",
		"👨‍💻": "man-technologist",
		"👩‍💻": "woman-technologist",
		"🧑‍🎤": "singer",
		"👨‍🎤": "man-singer",
		"👩‍🎤": "woman-singer",
		"🧑‍🎨": "artist",
		"👨‍🎨": "man-artist",
		"👩‍🎨": "woman-artist",
		"🧑‍✈️": "pilot",
		"👨‍✈️": "man-pilot",
		"👩‍✈️": "woman-pilot",
		"🧑‍🚀": "astronaut",
		"👨‍🚀": "man-astronaut",
		"👩‍🚀": "woman-astronaut",
		"🧑‍🚒": "firefighter",
		"👨‍🚒": "man-firefighter",
		"👩‍🚒": "woman-firefighter",
		"👮": "police-officer",
		"👮‍♂️": "man-police-officer",
		"👮‍♀️": "woman-police-officer",
		"🕵": "detective",
		"🕵️‍♂️": "man-detective",
		"🕵️‍♀️": "woman-detective",
		"💂": "guard",
		"💂‍♂️": "man-guard",
		"💂‍♀️": "woman-guard",
		"🥷": "ninja",
		"👷": "construction-worker",
		"👷‍♂️": "man-construction-worker",
		"👷‍♀️": "woman-construction-worker",
		"🫅": "person-with-crown",
		"🤴": "prince",
		"👸": "princess",
		"👳": "person-wearing-turban",
		"👳‍♂️": "man-wearing-turban",
		"👳‍♀️": "woman-wearing-turban",
		"👲": "person-with-skullcap",
		"🧕": "woman-with-headscarf",
		"🤵": "person-in-tuxedo",
		"🤵‍♂️": "man-in-tuxedo",
		"🤵‍♀️": "woman-in-tuxedo",
		"👰": "person-with-veil",
		"👰‍♂️": "man-with-veil",
		"👰‍♀️": "woman-with-veil",
		"🤰": "pregnant-woman",
		"🫃": "pregnant-man",
		"🫄": "pregnant-person",
		"🤱": "breast-feeding",
		"👩‍🍼": "woman-feeding-baby",
		"👨‍🍼": "man-feeding-baby",
		"🧑‍🍼": "person-feeding-baby",
		"👼": "baby-angel",
		"🎅": "santa-claus",
		"🤶": "mrs-claus",
		"🧑‍🎄": "mx-claus",
		"🦸": "superhero",
		"🦸‍♂️": "man-superhero",
		"🦸‍♀️": "woman-superhero",
		"🦹": "supervillain",
		"🦹‍♂️": "man-supervillain",
		"🦹‍♀️": "woman-supervillain",
		"🧙": "mage",
		"🧙‍♂️": "man-mage",
		"🧙‍♀️": "woman-mage",
		"🧚": "fairy",
		"🧚‍♂️": "man-fairy",
		"🧚‍♀️": "woman-fairy",
		"🧛": "vampire",
		"🧛‍♂️": "man-vampire",
		"🧛‍♀️": "woman-vampire",
		"🧜": "merperson",
		"🧜‍♂️": "merman",
		"🧜‍♀️": "mermaid",
		"🧝": "elf",
		"🧝‍♂️": "man-elf",
		"🧝‍♀️": "woman-elf",
		"🧞": "genie",
		"🧞‍♂️": "man-genie",
		"🧞‍♀️": "woman-genie",
		"🧟": "zombie",
		"🧟‍♂️": "man-zombie",
		"🧟‍♀️": "woman-zombie",
		"🧌": "troll",
		"💆": "person-getting-massage",
		"💆‍♂️": "man-getting-massage",
		"💆‍♀️": "woman-getting-massage",
		"💇": "person-getting-haircut",
		"💇‍♂️": "man-getting-haircut",
		"💇‍♀️": "woman-getting-haircut",
		"🚶": "person-walking",
		"🚶‍♂️": "man-walking",
		"🚶‍♀️": "woman-walking",
		"🧍": "person-standing",
		"🧍‍♂️": "man-standing",
		"🧍‍♀️": "woman-standing",
		"🧎": "person-kneeling",
		"🧎‍♂️": "man-kneeling",
		"🧎‍♀️": "woman-kneeling",
		"🧑‍🦯": "person-with-white-cane",
		"👨‍🦯": "man-with-white-cane",
		"👩‍🦯": "woman-with-white-cane",
		"🧑‍🦼": "person-in-motorized-wheelchair",
		"👨‍🦼": "man-in-motorized-wheelchair",
		"👩‍🦼": "woman-in-motorized-wheelchair",
		"🧑‍🦽": "person-in-manual-wheelchair",
		"👨‍🦽": "man-in-manual-wheelchair",
		"👩‍🦽": "woman-in-manual-wheelchair",
		"🏃": "person-running",
		"🏃‍♂️": "man-running",
		"🏃‍♀️": "woman-running",
		"💃": "woman-dancing",
		"🕺": "man-dancing",
		"🕴": "person-in-suit-levitating",
		"👯": "people-with-bunny-ears",
		"👯‍♂️": "men-with-bunny-ears",
		"👯‍♀️": "women-with-bunny-ears",
		"🧖": "person-in-steamy-room",
		"🧖‍♂️": "man-in-steamy-room",
		"🧖‍♀️": "woman-in-steamy-room",
		"🧗": "person-climbing",
		"🧗‍♂️": "man-climbing",
		"🧗‍♀️": "woman-climbing",
		"🤺": "person-fencing",
		"🏇": "horse-racing",
		"⛷": "skier",
		"🏂": "snowboarder",
		"🏌": "person-golfing",
		"🏌️‍♂️": "man-golfing",
		"🏌️‍♀️": "woman-golfing",
		"🏄": "person-surfing",
		"🏄‍♂️": "man-surfing",
		"🏄‍♀️": "woman-surfing",
		"🚣": "person-rowing-boat",
		"🚣‍♂️": "man-rowing-boat",
		"🚣‍♀️": "woman-rowing-boat",
		"🏊": "person-swimming",
		"🏊‍♂️": "man-swimming",
		"🏊‍♀️": "woman-swimming",
		"⛹": "person-bouncing-ball",
		"⛹️‍♂️": "man-bouncing-ball",
		"⛹️‍♀️": "woman-bouncing-ball",
		"🏋": "person-lifting-weights",
		"🏋️‍♂️": "man-lifting-weights",
		"🏋️‍♀️": "woman-lifting-weights",
		"🚴": "person-biking",
		"🚴‍♂️": "man-biking",
		"🚴‍♀️": "woman-biking",
		"🚵": "person-mountain-biking",
		"🚵‍♂️": "man-mountain-biking",
		"🚵‍♀️": "woman-mountain-biking",
		"🤸": "person-cartwheeling",
		"🤸‍♂️": "man-cartwheeling",
		"🤸‍♀️": "woman-cartwheeling",
		"🤼": "people-wrestling",
		"🤼‍♂️": "men-wrestling",
		"🤼‍♀️": "women-wrestling",
		"🤽": "person-playing-water-polo",
		"🤽‍♂️": "man-playing-water-polo",
		"🤽‍♀️": "woman-playing-water-polo",
		"🤾": "person-playing-handball",
		"🤾‍♂️": "man-playing-handball",
		"🤾‍♀️": "woman-playing-handball",
		"🤹": "person-juggling",
		"🤹‍♂️": "man-juggling",
		"🤹‍♀️": "woman-juggling",
		"🧘": "person-in-lotus-position",
		"🧘‍♂️": "man-in-lotus-position",
		"🧘‍♀️": "woman-in-lotus-position",
		"🛀": "person-taking-bath",
		"🛌": "person-in-bed",
		"🧑‍🤝‍🧑": "people-holding-hands",
		"👭": "women-holding-hands",
		"👫": "woman-and-man-holding-hands",
		"👬": "men-holding-hands",
		"💏": "kiss",
		"👩‍❤️‍💋‍👨": "kiss-woman,-man",
		"👨‍❤️‍💋‍👨": "kiss-man,-man",
		"👩‍❤️‍💋‍👩": "kiss-woman,-woman",
		"💑": "couple-with-heart",
		"👩‍❤️‍👨": "couple-with-heart-woman,-man",
		"👨‍❤️‍👨": "couple-with-heart-man,-man",
		"👩‍❤️‍👩": "couple-with-heart-woman,-woman",
		"👪": "family",
		"👨‍👩‍👦": "family-man,-woman,-boy",
		"👨‍👩‍👧": "family-man,-woman,-girl",
		"👨‍👩‍👧‍👦": "family-man,-woman,-girl,-boy",
		"👨‍👩‍👦‍👦": "family-man,-woman,-boy,-boy",
		"👨‍👩‍👧‍👧": "family-man,-woman,-girl,-girl",
		"👨‍👨‍👦": "family-man,-man,-boy",
		"👨‍👨‍👧": "family-man,-man,-girl",
		"👨‍👨‍👧‍👦": "family-man,-man,-girl,-boy",
		"👨‍👨‍👦‍👦": "family-man,-man,-boy,-boy",
		"👨‍👨‍👧‍👧": "family-man,-man,-girl,-girl",
		"👩‍👩‍👦": "family-woman,-woman,-boy",
		"👩‍👩‍👧": "family-woman,-woman,-girl",
		"👩‍👩‍👧‍👦": "family-woman,-woman,-girl,-boy",
		"👩‍👩‍👦‍👦": "family-woman,-woman,-boy,-boy",
		"👩‍👩‍👧‍👧": "family-woman,-woman,-girl,-girl",
		"👨‍👦": "family-man,-boy",
		"👨‍👦‍👦": "family-man,-boy,-boy",
		"👨‍👧": "family-man,-girl",
		"👨‍👧‍👦": "family-man,-girl,-boy",
		"👨‍👧‍👧": "family-man,-girl,-girl",
		"👩‍👦": "family-woman,-boy",
		"👩‍👦‍👦": "family-woman,-boy,-boy",
		"👩‍👧": "family-woman,-girl",
		"👩‍👧‍👦": "family-woman,-girl,-boy",
		"👩‍👧‍👧": "family-woman,-girl,-girl",
		"🗣": "speaking-head",
		"👤": "bust-in-silhouette",
		"👥": "busts-in-silhouette",
		"🫂": "people-hugging",
		"👣": "footprints",
		"🦰": "red-hair",
		"🦱": "curly-hair",
		"🦳": "white-hair",
		"🦲": "bald",
		"🐵": "monkey-face",
		"🐒": "monkey",
		"🦍": "gorilla",
		"🦧": "orangutan",
		"🐶": "dog-face",
		"🐕": "dog",
		"🦮": "guide-dog",
		"🐕‍🦺": "service-dog",
		"🐩": "poodle",
		"🐺": "wolf",
		"🦊": "fox",
		"🦝": "raccoon",
		"🐱": "cat-face",
		"🐈": "cat",
		"🐈‍⬛": "black-cat",
		"🦁": "lion",
		"🐯": "tiger-face",
		"🐅": "tiger",
		"🐆": "leopard",
		"🐴": "horse-face",
		"🫎": "⊛-moose",
		"🫏": "⊛-donkey",
		"🐎": "horse",
		"🦄": "unicorn",
		"🦓": "zebra",
		"🦌": "deer",
		"🦬": "bison",
		"🐮": "cow-face",
		"🐂": "ox",
		"🐃": "water-buffalo",
		"🐄": "cow",
		"🐷": "pig-face",
		"🐖": "pig",
		"🐗": "boar",
		"🐽": "pig-nose",
		"🐏": "ram",
		"🐑": "ewe",
		"🐐": "goat",
		"🐪": "camel",
		"🐫": "two-hump-camel",
		"🦙": "llama",
		"🦒": "giraffe",
		"🐘": "elephant",
		"🦣": "mammoth",
		"🦏": "rhinoceros",
		"🦛": "hippopotamus",
		"🐭": "mouse-face",
		"🐁": "mouse",
		"🐀": "rat",
		"🐹": "hamster",
		"🐰": "rabbit-face",
		"🐇": "rabbit",
		"🐿": "chipmunk",
		"🦫": "beaver",
		"🦔": "hedgehog",
		"🦇": "bat",
		"🐻": "bear",
		"🐻‍❄️": "polar-bear",
		"🐨": "koala",
		"🐼": "panda",
		"🦥": "sloth",
		"🦦": "otter",
		"🦨": "skunk",
		"🦘": "kangaroo",
		"🦡": "badger",
		"🐾": "paw-prints",
		"🦃": "turkey",
		"🐔": "chicken",
		"🐓": "rooster",
		"🐣": "hatching-chick",
		"🐤": "baby-chick",
		"🐥": "front-facing-baby-chick",
		"🐦": "bird",
		"🐧": "penguin",
		"🕊": "dove",
		"🦅": "eagle",
		"🦆": "duck",
		"🦢": "swan",
		"🦉": "owl",
		"🦤": "dodo",
		"🪶": "feather",
		"🦩": "flamingo",
		"🦚": "peacock",
		"🦜": "parrot",
		"🪽": "⊛-wing",
		"🐦‍⬛": "⊛-black-bird",
		"🪿": "⊛-goose",
		"🐸": "frog",
		"🐊": "crocodile",
		"🐢": "turtle",
		"🦎": "lizard",
		"🐍": "snake",
		"🐲": "dragon-face",
		"🐉": "dragon",
		"🦕": "sauropod",
		"🦖": "t-rex",
		"🐳": "spouting-whale",
		"🐋": "whale",
		"🐬": "dolphin",
		"🦭": "seal",
		"🐟": "fish",
		"🐠": "tropical-fish",
		"🐡": "blowfish",
		"🦈": "shark",
		"🐙": "octopus",
		"🐚": "spiral-shell",
		"🪸": "coral",
		"🪼": "⊛-jellyfish",
		"🐌": "snail",
		"🦋": "butterfly",
		"🐛": "bug",
		"🐜": "ant",
		"🐝": "honeybee",
		"🪲": "beetle",
		"🐞": "lady-beetle",
		"🦗": "cricket",
		"🪳": "cockroach",
		"🕷": "spider",
		"🕸": "spider-web",
		"🦂": "scorpion",
		"🦟": "mosquito",
		"🪰": "fly",
		"🪱": "worm",
		"🦠": "microbe",
		"💐": "bouquet",
		"🌸": "cherry-blossom",
		"💮": "white-flower",
		"🪷": "lotus",
		"🏵": "rosette",
		"🌹": "rose",
		"🥀": "wilted-flower",
		"🌺": "hibiscus",
		"🌻": "sunflower",
		"🌼": "blossom",
		"🌷": "tulip",
		"🪻": "⊛-hyacinth",
		"🌱": "seedling",
		"🪴": "potted-plant",
		"🌲": "evergreen-tree",
		"🌳": "deciduous-tree",
		"🌴": "palm-tree",
		"🌵": "cactus",
		"🌾": "sheaf-of-rice",
		"🌿": "herb",
		"☘": "shamrock",
		"🍀": "four-leaf-clover",
		"🍁": "maple-leaf",
		"🍂": "fallen-leaf",
		"🍃": "leaf-fluttering-in-wind",
		"🪹": "empty-nest",
		"🪺": "nest-with-eggs",
		"🍄": "mushroom",
		"🍇": "grapes",
		"🍈": "melon",
		"🍉": "watermelon",
		"🍊": "tangerine",
		"🍋": "lemon",
		"🍌": "banana",
		"🍍": "pineapple",
		"🥭": "mango",
		"🍎": "red-apple",
		"🍏": "green-apple",
		"🍐": "pear",
		"🍑": "peach",
		"🍒": "cherries",
		"🍓": "strawberry",
		"🫐": "blueberries",
		"🥝": "kiwi-fruit",
		"🍅": "tomato",
		"🫒": "olive",
		"🥥": "coconut",
		"🥑": "avocado",
		"🍆": "eggplant",
		"🥔": "potato",
		"🥕": "carrot",
		"🌽": "ear-of-corn",
		"🌶": "hot-pepper",
		"🫑": "bell-pepper",
		"🥒": "cucumber",
		"🥬": "leafy-green",
		"🥦": "broccoli",
		"🧄": "garlic",
		"🧅": "onion",
		"🥜": "peanuts",
		"🫘": "beans",
		"🌰": "chestnut",
		"🫚": "⊛-ginger-root",
		"🫛": "⊛-pea-pod",
		"🍞": "bread",
		"🥐": "croissant",
		"🥖": "baguette-bread",
		"🫓": "flatbread",
		"🥨": "pretzel",
		"🥯": "bagel",
		"🥞": "pancakes",
		"🧇": "waffle",
		"🧀": "cheese-wedge",
		"🍖": "meat-on-bone",
		"🍗": "poultry-leg",
		"🥩": "cut-of-meat",
		"🥓": "bacon",
		"🍔": "hamburger",
		"🍟": "french-fries",
		"🍕": "pizza",
		"🌭": "hot-dog",
		"🥪": "sandwich",
		"🌮": "taco",
		"🌯": "burrito",
		"🫔": "tamale",
		"🥙": "stuffed-flatbread",
		"🧆": "falafel",
		"🥚": "egg",
		"🍳": "cooking",
		"🥘": "shallow-pan-of-food",
		"🍲": "pot-of-food",
		"🫕": "fondue",
		"🥣": "bowl-with-spoon",
		"🥗": "green-salad",
		"🍿": "popcorn",
		"🧈": "butter",
		"🧂": "salt",
		"🥫": "canned-food",
		"🍱": "bento-box",
		"🍘": "rice-cracker",
		"🍙": "rice-ball",
		"🍚": "cooked-rice",
		"🍛": "curry-rice",
		"🍜": "steaming-bowl",
		"🍝": "spaghetti",
		"🍠": "roasted-sweet-potato",
		"🍢": "oden",
		"🍣": "sushi",
		"🍤": "fried-shrimp",
		"🍥": "fish-cake-with-swirl",
		"🥮": "moon-cake",
		"🍡": "dango",
		"🥟": "dumpling",
		"🥠": "fortune-cookie",
		"🥡": "takeout-box",
		"🦀": "crab",
		"🦞": "lobster",
		"🦐": "shrimp",
		"🦑": "squid",
		"🦪": "oyster",
		"🍦": "soft-ice-cream",
		"🍧": "shaved-ice",
		"🍨": "ice-cream",
		"🍩": "doughnut",
		"🍪": "cookie",
		"🎂": "birthday-cake",
		"🍰": "shortcake",
		"🧁": "cupcake",
		"🥧": "pie",
		"🍫": "chocolate-bar",
		"🍬": "candy",
		"🍭": "lollipop",
		"🍮": "custard",
		"🍯": "honey-pot",
		"🍼": "baby-bottle",
		"🥛": "glass-of-milk",
		"☕": "hot-beverage",
		"🫖": "teapot",
		"🍵": "teacup-without-handle",
		"🍶": "sake",
		"🍾": "bottle-with-popping-cork",
		"🍷": "wine-glass",
		"🍸": "cocktail-glass",
		"🍹": "tropical-drink",
		"🍺": "beer-mug",
		"🍻": "clinking-beer-mugs",
		"🥂": "clinking-glasses",
		"🥃": "tumbler-glass",
		"🫗": "pouring-liquid",
		"🥤": "cup-with-straw",
		"🧋": "bubble-tea",
		"🧃": "beverage-box",
		"🧉": "mate",
		"🧊": "ice",
		"🥢": "chopsticks",
		"🍽": "fork-and-knife-with-plate",
		"🍴": "fork-and-knife",
		"🥄": "spoon",
		"🔪": "kitchen-knife",
		"🫙": "jar",
		"🏺": "amphora",
		"🌍": "globe-showing-europe-africa",
		"🌎": "globe-showing-americas",
		"🌏": "globe-showing-asia-australia",
		"🌐": "globe-with-meridians",
		"🗺": "world-map",
		"🗾": "map-of-japan",
		"🧭": "compass",
		"🏔": "snow-capped-mountain",
		"⛰": "mountain",
		"🌋": "volcano",
		"🗻": "mount-fuji",
		"🏕": "camping",
		"🏖": "beach-with-umbrella",
		"🏜": "desert",
		"🏝": "desert-island",
		"🏞": "national-park",
		"🏟": "stadium",
		"🏛": "classical-building",
		"🏗": "building-construction",
		"🧱": "brick",
		"🪨": "rock",
		"🪵": "wood",
		"🛖": "hut",
		"🏘": "houses",
		"🏚": "derelict-house",
		"🏠": "house",
		"🏡": "house-with-garden",
		"🏢": "office-building",
		"🏣": "japanese-post-office",
		"🏤": "post-office",
		"🏥": "hospital",
		"🏦": "bank",
		"🏨": "hotel",
		"🏩": "love-hotel",
		"🏪": "convenience-store",
		"🏫": "school",
		"🏬": "department-store",
		"🏭": "factory",
		"🏯": "japanese-castle",
		"🏰": "castle",
		"💒": "wedding",
		"🗼": "tokyo-tower",
		"🗽": "statue-of-liberty",
		"⛪": "church",
		"🕌": "mosque",
		"🛕": "hindu-temple",
		"🕍": "synagogue",
		"⛩": "shinto-shrine",
		"🕋": "kaaba",
		"⛲": "fountain",
		"⛺": "tent",
		"🌁": "foggy",
		"🌃": "night-with-stars",
		"🏙": "cityscape",
		"🌄": "sunrise-over-mountains",
		"🌅": "sunrise",
		"🌆": "cityscape-at-dusk",
		"🌇": "sunset",
		"🌉": "bridge-at-night",
		"♨": "hot-springs",
		"🎠": "carousel-horse",
		"🛝": "playground-slide",
		"🎡": "ferris-wheel",
		"🎢": "roller-coaster",
		"💈": "barber-pole",
		"🎪": "circus-tent",
		"🚂": "locomotive",
		"🚃": "railway-car",
		"🚄": "high-speed-train",
		"🚅": "bullet-train",
		"🚆": "train",
		"🚇": "metro",
		"🚈": "light-rail",
		"🚉": "station",
		"🚊": "tram",
		"🚝": "monorail",
		"🚞": "mountain-railway",
		"🚋": "tram-car",
		"🚌": "bus",
		"🚍": "oncoming-bus",
		"🚎": "trolleybus",
		"🚐": "minibus",
		"🚑": "ambulance",
		"🚒": "fire-engine",
		"🚓": "police-car",
		"🚔": "oncoming-police-car",
		"🚕": "taxi",
		"🚖": "oncoming-taxi",
		"🚗": "automobile",
		"🚘": "oncoming-automobile",
		"🚙": "sport-utility-vehicle",
		"🛻": "pickup-truck",
		"🚚": "delivery-truck",
		"🚛": "articulated-lorry",
		"🚜": "tractor",
		"🏎": "racing-car",
		"🏍": "motorcycle",
		"🛵": "motor-scooter",
		"🦽": "manual-wheelchair",
		"🦼": "motorized-wheelchair",
		"🛺": "auto-rickshaw",
		"🚲": "bicycle",
		"🛴": "kick-scooter",
		"🛹": "skateboard",
		"🛼": "roller-skate",
		"🚏": "bus-stop",
		"🛣": "motorway",
		"🛤": "railway-track",
		"🛢": "oil-drum",
		"⛽": "fuel-pump",
		"🛞": "wheel",
		"🚨": "police-car-light",
		"🚥": "horizontal-traffic-light",
		"🚦": "vertical-traffic-light",
		"🛑": "stop-sign",
		"🚧": "construction",
		"⚓": "anchor",
		"🛟": "ring-buoy",
		"⛵": "sailboat",
		"🛶": "canoe",
		"🚤": "speedboat",
		"🛳": "passenger-ship",
		"⛴": "ferry",
		"🛥": "motor-boat",
		"🚢": "ship",
		"✈": "airplane",
		"🛩": "small-airplane",
		"🛫": "airplane-departure",
		"🛬": "airplane-arrival",
		"🪂": "parachute",
		"💺": "seat",
		"🚁": "helicopter",
		"🚟": "suspension-railway",
		"🚠": "mountain-cableway",
		"🚡": "aerial-tramway",
		"🛰": "satellite",
		"🚀": "rocket",
		"🛸": "flying-saucer",
		"🛎": "bellhop-bell",
		"🧳": "luggage",
		"⌛": "hourglass-done",
		"⏳": "hourglass-not-done",
		"⌚": "watch",
		"⏰": "alarm-clock",
		"⏱": "stopwatch",
		"⏲": "timer-clock",
		"🕰": "mantelpiece-clock",
		"🕛": "twelve-o-clock",
		"🕧": "twelve-thirty",
		"🕐": "one-o-clock",
		"🕜": "one-thirty",
		"🕑": "two-o-clock",
		"🕝": "two-thirty",
		"🕒": "three-o-clock",
		"🕞": "three-thirty",
		"🕓": "four-o-clock",
		"🕟": "four-thirty",
		"🕔": "five-o-clock",
		"🕠": "five-thirty",
		"🕕": "six-o-clock",
		"🕡": "six-thirty",
		"🕖": "seven-o-clock",
		"🕢": "seven-thirty",
		"🕗": "eight-o-clock",
		"🕣": "eight-thirty",
		"🕘": "nine-o-clock",
		"🕤": "nine-thirty",
		"🕙": "ten-o-clock",
		"🕥": "ten-thirty",
		"🕚": "eleven-o-clock",
		"🕦": "eleven-thirty",
		"🌑": "new-moon",
		"🌒": "waxing-crescent-moon",
		"🌓": "first-quarter-moon",
		"🌔": "waxing-gibbous-moon",
		"🌕": "full-moon",
		"🌖": "waning-gibbous-moon",
		"🌗": "last-quarter-moon",
		"🌘": "waning-crescent-moon",
		"🌙": "crescent-moon",
		"🌚": "new-moon-face",
		"🌛": "first-quarter-moon-face",
		"🌜": "last-quarter-moon-face",
		"🌡": "thermometer",
		"☀": "sun",
		"🌝": "full-moon-face",
		"🌞": "sun-with-face",
		"🪐": "ringed-planet",
		"⭐": "star",
		"🌟": "glowing-star",
		"🌠": "shooting-star",
		"🌌": "milky-way",
		"☁": "cloud",
		"⛅": "sun-behind-cloud",
		"⛈": "cloud-with-lightning-and-rain",
		"🌤": "sun-behind-small-cloud",
		"🌥": "sun-behind-large-cloud",
		"🌦": "sun-behind-rain-cloud",
		"🌧": "cloud-with-rain",
		"🌨": "cloud-with-snow",
		"🌩": "cloud-with-lightning",
		"🌪": "tornado",
		"🌫": "fog",
		"🌬": "wind-face",
		"🌀": "cyclone",
		"🌈": "rainbow",
		"🌂": "closed-umbrella",
		"☂": "umbrella",
		"☔": "umbrella-with-rain-drops",
		"⛱": "umbrella-on-ground",
		"⚡": "high-voltage",
		"❄": "snowflake",
		"☃": "snowman",
		"⛄": "snowman-without-snow",
		"☄": "comet",
		"🔥": "fire",
		"💧": "droplet",
		"🌊": "water-wave",
		"🎃": "jack-o-lantern",
		"🎄": "christmas-tree",
		"🎆": "fireworks",
		"🎇": "sparkler",
		"🧨": "firecracker",
		"✨": "sparkles",
		"🎈": "balloon",
		"🎉": "party-popper",
		"🎊": "confetti-ball",
		"🎋": "tanabata-tree",
		"🎍": "pine-decoration",
		"🎎": "japanese-dolls",
		"🎏": "carp-streamer",
		"🎐": "wind-chime",
		"🎑": "moon-viewing-ceremony",
		"🧧": "red-envelope",
		"🎀": "ribbon",
		"🎁": "wrapped-gift",
		"🎗": "reminder-ribbon",
		"🎟": "admission-tickets",
		"🎫": "ticket",
		"🎖": "military-medal",
		"🏆": "trophy",
		"🏅": "sports-medal",
		"🥇": "1st-place-medal",
		"🥈": "2nd-place-medal",
		"🥉": "3rd-place-medal",
		"⚽": "soccer-ball",
		"⚾": "baseball",
		"🥎": "softball",
		"🏀": "basketball",
		"🏐": "volleyball",
		"🏈": "american-football",
		"🏉": "rugby-football",
		"🎾": "tennis",
		"🥏": "flying-disc",
		"🎳": "bowling",
		"🏏": "cricket-game",
		"🏑": "field-hockey",
		"🏒": "ice-hockey",
		"🥍": "lacrosse",
		"🏓": "ping-pong",
		"🏸": "badminton",
		"🥊": "boxing-glove",
		"🥋": "martial-arts-uniform",
		"🥅": "goal-net",
		"⛳": "flag-in-hole",
		"⛸": "ice-skate",
		"🎣": "fishing-pole",
		"🤿": "diving-mask",
		"🎽": "running-shirt",
		"🎿": "skis",
		"🛷": "sled",
		"🥌": "curling-stone",
		"🎯": "bullseye",
		"🪀": "yo-yo",
		"🪁": "kite",
		"🔫": "water-pistol",
		"🎱": "pool-8-ball",
		"🔮": "crystal-ball",
		"🪄": "magic-wand",
		"🎮": "video-game",
		"🕹": "joystick",
		"🎰": "slot-machine",
		"🎲": "game-die",
		"🧩": "puzzle-piece",
		"🧸": "teddy-bear",
		"🪅": "piñata",
		"🪩": "mirror-ball",
		"🪆": "nesting-dolls",
		"♠": "spade-suit",
		"♥": "heart-suit",
		"♦": "diamond-suit",
		"♣": "club-suit",
		"♟": "chess-pawn",
		"🃏": "joker",
		"🀄": "mahjong-red-dragon",
		"🎴": "flower-playing-cards",
		"🎭": "performing-arts",
		"🖼": "framed-picture",
		"🎨": "artist-palette",
		"🧵": "thread",
		"🪡": "sewing-needle",
		"🧶": "yarn",
		"🪢": "knot",
		"👓": "glasses",
		"🕶": "sunglasses",
		"🥽": "goggles",
		"🥼": "lab-coat",
		"🦺": "safety-vest",
		"👔": "necktie",
		"👕": "t-shirt",
		"👖": "jeans",
		"🧣": "scarf",
		"🧤": "gloves",
		"🧥": "coat",
		"🧦": "socks",
		"👗": "dress",
		"👘": "kimono",
		"🥻": "sari",
		"🩱": "one-piece-swimsuit",
		"🩲": "briefs",
		"🩳": "shorts",
		"👙": "bikini",
		"👚": "woman-s-clothes",
		"🪭": "⊛-folding-hand-fan",
		"👛": "purse",
		"👜": "handbag",
		"👝": "clutch-bag",
		"🛍": "shopping-bags",
		"🎒": "backpack",
		"🩴": "thong-sandal",
		"👞": "man-s-shoe",
		"👟": "running-shoe",
		"🥾": "hiking-boot",
		"🥿": "flat-shoe",
		"👠": "high-heeled-shoe",
		"👡": "woman-s-sandal",
		"🩰": "ballet-shoes",
		"👢": "woman-s-boot",
		"🪮": "⊛-hair-pick",
		"👑": "crown",
		"👒": "woman-s-hat",
		"🎩": "top-hat",
		"🎓": "graduation-cap",
		"🧢": "billed-cap",
		"🪖": "military-helmet",
		"⛑": "rescue-worker-s-helmet",
		"📿": "prayer-beads",
		"💄": "lipstick",
		"💍": "ring",
		"💎": "gem-stone",
		"🔇": "muted-speaker",
		"🔈": "speaker-low-volume",
		"🔉": "speaker-medium-volume",
		"🔊": "speaker-high-volume",
		"📢": "loudspeaker",
		"📣": "megaphone",
		"📯": "postal-horn",
		"🔔": "bell",
		"🔕": "bell-with-slash",
		"🎼": "musical-score",
		"🎵": "musical-note",
		"🎶": "musical-notes",
		"🎙": "studio-microphone",
		"🎚": "level-slider",
		"🎛": "control-knobs",
		"🎤": "microphone",
		"🎧": "headphone",
		"📻": "radio",
		"🎷": "saxophone",
		"🪗": "accordion",
		"🎸": "guitar",
		"🎹": "musical-keyboard",
		"🎺": "trumpet",
		"🎻": "violin",
		"🪕": "banjo",
		"🥁": "drum",
		"🪘": "long-drum",
		"🪇": "maracas",
		"🪈": "flute",
		"📱": "mobile-phone",
		"📲": "mobile-phone-with-arrow",
		"☎": "telephone",
		"📞": "telephone-receiver",
		"📟": "pager",
		"📠": "fax-machine",
		"🔋": "battery",
		"🪫": "low-battery",
		"🔌": "electric-plug",
		"💻": "laptop",
		"🖥": "desktop-computer",
		"🖨": "printer",
		"⌨": "keyboard",
		"🖱": "computer-mouse",
		"🖲": "trackball",
		"💽": "computer-disk",
		"💾": "floppy-disk",
		"💿": "optical-disk",
		"📀": "dvd",
		"🧮": "abacus",
		"🎥": "movie-camera",
		"🎞": "film-frames",
		"📽": "film-projector",
		"🎬": "clapper-board",
		"📺": "television",
		"📷": "camera",
		"📸": "camera-with-flash",
		"📹": "video-camera",
		"📼": "videocassette",
		"🔍": "magnifying-glass-tilted-left",
		"🔎": "magnifying-glass-tilted-right",
		"🕯": "candle",
		"💡": "light-bulb",
		"🔦": "flashlight",
		"🏮": "red-paper-lantern",
		"🪔": "diya-lamp",
		"📔": "notebook-with-decorative-cover",
		"📕": "closed-book",
		"📖": "open-book",
		"📗": "green-book",
		"📘": "blue-book",
		"📙": "orange-book",
		"📚": "books",
		"📓": "notebook",
		"📒": "ledger",
		"📃": "page-with-curl",
		"📜": "scroll",
		"📄": "page-facing-up",
		"📰": "newspaper",
		"🗞": "rolled-up-newspaper",
		"📑": "bookmark-tabs",
		"🔖": "bookmark",
		"🏷": "label",
		"💰": "money-bag",
		"🪙": "coin",
		"💴": "yen-banknote",
		"💵": "dollar-banknote",
		"💶": "euro-banknote",
		"💷": "pound-banknote",
		"💸": "money-with-wings",
		"💳": "credit-card",
		"🧾": "receipt",
		"💹": "chart-increasing-with-yen",
		"✉": "envelope",
		"📧": "e-mail",
		"📨": "incoming-envelope",
		"📩": "envelope-with-arrow",
		"📤": "outbox-tray",
		"📥": "inbox-tray",
		"📦": "package",
		"📫": "closed-mailbox-with-raised-flag",
		"📪": "closed-mailbox-with-lowered-flag",
		"📬": "open-mailbox-with-raised-flag",
		"📭": "open-mailbox-with-lowered-flag",
		"📮": "postbox",
		"🗳": "ballot-box-with-ballot",
		"✏": "pencil",
		"✒": "black-nib",
		"🖋": "fountain-pen",
		"🖊": "pen",
		"🖌": "paintbrush",
		"🖍": "crayon",
		"📝": "memo",
		"💼": "briefcase",
		"📁": "file-folder",
		"📂": "open-file-folder",
		"🗂": "card-index-dividers",
		"📅": "calendar",
		"📆": "tear-off-calendar",
		"🗒": "spiral-notepad",
		"🗓": "spiral-calendar",
		"📇": "card-index",
		"📈": "chart-increasing",
		"📉": "chart-decreasing",
		"📊": "bar-chart",
		"📋": "clipboard",
		"📌": "pushpin",
		"📍": "round-pushpin",
		"📎": "paperclip",
		"🖇": "linked-paperclips",
		"📏": "straight-ruler",
		"📐": "triangular-ruler",
		"✂": "scissors",
		"🗃": "card-file-box",
		"🗄": "file-cabinet",
		"🗑": "wastebasket",
		"🔒": "locked",
		"🔓": "unlocked",
		"🔏": "locked-with-pen",
		"🔐": "locked-with-key",
		"🔑": "key",
		"🗝": "old-key",
		"🔨": "hammer",
		"🪓": "axe",
		"⛏": "pick",
		"⚒": "hammer-and-pick",
		"🛠": "hammer-and-wrench",
		"🗡": "dagger",
		"⚔": "crossed-swords",
		"💣": "bomb",
		"🪃": "boomerang",
		"🏹": "bow-and-arrow",
		"🛡": "shield",
		"🪚": "carpentry-saw",
		"🔧": "wrench",
		"🪛": "screwdriver",
		"🔩": "nut-and-bolt",
		"⚙": "gear",
		"🗜": "clamp",
		"⚖": "balance-scale",
		"🦯": "white-cane",
		"🔗": "link",
		"⛓": "chains",
		"🪝": "hook",
		"🧰": "toolbox",
		"🧲": "magnet",
		"🪜": "ladder",
		"⚗": "alembic",
		"🧪": "test-tube",
		"🧫": "petri-dish",
		"🧬": "dna",
		"🔬": "microscope",
		"🔭": "telescope",
		"📡": "satellite-antenna",
		"💉": "syringe",
		"🩸": "drop-of-blood",
		"💊": "pill",
		"🩹": "adhesive-bandage",
		"🩼": "crutch",
		"🩺": "stethoscope",
		"🩻": "x-ray",
		"🚪": "door",
		"🛗": "elevator",
		"🪞": "mirror",
		"🪟": "window",
		"🛏": "bed",
		"🛋": "couch-and-lamp",
		"🪑": "chair",
		"🚽": "toilet",
		"🪠": "plunger",
		"🚿": "shower",
		"🛁": "bathtub",
		"🪤": "mouse-trap",
		"🪒": "razor",
		"🧴": "lotion-bottle",
		"🧷": "safety-pin",
		"🧹": "broom",
		"🧺": "basket",
		"🧻": "roll-of-paper",
		"🪣": "bucket",
		"🧼": "soap",
		"🫧": "bubbles",
		"🪥": "toothbrush",
		"🧽": "sponge",
		"🧯": "fire-extinguisher",
		"🛒": "shopping-cart",
		"🚬": "cigarette",
		"⚰": "coffin",
		"🪦": "headstone",
		"⚱": "funeral-urn",
		"🧿": "nazar-amulet",
		"🪬": "hamsa",
		"🗿": "moai",
		"🪧": "placard",
		"🪪": "identification-card",
		"🏧": "atm-sign",
		"🚮": "litter-in-bin-sign",
		"🚰": "potable-water",
		"♿": "wheelchair-symbol",
		"🚹": "men-s-room",
		"🚺": "women-s-room",
		"🚻": "restroom",
		"🚼": "baby-symbol",
		"🚾": "water-closet",
		"🛂": "passport-control",
		"🛃": "customs",
		"🛄": "baggage-claim",
		"🛅": "left-luggage",
		"⚠": "warning",
		"🚸": "children-crossing",
		"⛔": "no-entry",
		"🚫": "prohibited",
		"🚳": "no-bicycles",
		"🚭": "no-smoking",
		"🚯": "no-littering",
		"🚱": "non-potable-water",
		"🚷": "no-pedestrians",
		"📵": "no-mobile-phones",
		"🔞": "no-one-under-eighteen",
		"☢": "radioactive",
		"☣": "biohazard",
		"⬆": "up-arrow",
		"↗": "up-right-arrow",
		"➡": "right-arrow",
		"↘": "down-right-arrow",
		"⬇": "down-arrow",
		"↙": "down-left-arrow",
		"⬅": "left-arrow",
		"↖": "up-left-arrow",
		"↕": "up-down-arrow",
		"↔": "left-right-arrow",
		"↩": "right-arrow-curving-left",
		"↪": "left-arrow-curving-right",
		"⤴": "right-arrow-curving-up",
		"⤵": "right-arrow-curving-down",
		"🔃": "clockwise-vertical-arrows",
		"🔄": "counterclockwise-arrows-button",
		"🔙": "back-arrow",
		"🔚": "end-arrow",
		"🔛": "on!-arrow",
		"🔜": "soon-arrow",
		"🔝": "top-arrow",
		"🛐": "place-of-worship",
		"⚛": "atom-symbol",
		"🕉": "om",
		"✡": "star-of-david",
		"☸": "wheel-of-dharma",
		"☯": "yin-yang",
		"✝": "latin-cross",
		"☦": "orthodox-cross",
		"☪": "star-and-crescent",
		"☮": "peace-symbol",
		"🕎": "menorah",
		"🔯": "dotted-six-pointed-star",
		"🪯": "⊛-khanda",
		"♈": "aries",
		"♉": "taurus",
		"♊": "gemini",
		"♋": "cancer",
		"♌": "leo",
		"♍": "virgo",
		"♎": "libra",
		"♏": "scorpio",
		"♐": "sagittarius",
		"♑": "capricorn",
		"♒": "aquarius",
		"♓": "pisces",
		"⛎": "ophiuchus",
		"🔀": "shuffle-tracks-button",
		"🔁": "repeat-button",
		"🔂": "repeat-single-button",
		"▶": "play-button",
		"⏩": "fast-forward-button",
		"⏭": "next-track-button",
		"⏯": "play-or-pause-button",
		"◀": "reverse-button",
		"⏪": "fast-reverse-button",
		"⏮": "last-track-button",
		"🔼": "upwards-button",
		"⏫": "fast-up-button",
		"🔽": "downwards-button",
		"⏬": "fast-down-button",
		"⏸": "pause-button",
		"⏹": "stop-button",
		"⏺": "record-button",
		"⏏": "eject-button",
		"🎦": "cinema",
		"🔅": "dim-button",
		"🔆": "bright-button",
		"📶": "antenna-bars",
		"🛜": "⊛-wireless",
		"📳": "vibration-mode",
		"📴": "mobile-phone-off",
		"♀": "female-sign",
		"♂": "male-sign",
		"⚧": "transgender-symbol",
		"✖": "multiply",
		"➕": "plus",
		"➖": "minus",
		"➗": "divide",
		"🟰": "heavy-equals-sign",
		"♾": "infinity",
		"‼": "double-exclamation-mark",
		"⁉": "exclamation-question-mark",
		"❓": "red-question-mark",
		"❔": "white-question-mark",
		"❕": "white-exclamation-mark",
		"❗": "red-exclamation-mark",
		"〰": "wavy-dash",
		"💱": "currency-exchange",
		"💲": "heavy-dollar-sign",
		"⚕": "medical-symbol",
		"♻": "recycling-symbol",
		"⚜": "fleur-de-lis",
		"🔱": "trident-emblem",
		"📛": "name-badge",
		"🔰": "japanese-symbol-for-beginner",
		"⭕": "hollow-red-circle",
		"✅": "check-mark-button",
		"☑": "check-box-with-check",
		"✔": "check-mark",
		"❌": "cross-mark",
		"❎": "cross-mark-button",
		"➰": "curly-loop",
		"➿": "double-curly-loop",
		"〽": "part-alternation-mark",
		"✳": "eight-spoked-asterisk",
		"✴": "eight-pointed-star",
		"❇": "sparkle",
		"©": "copyright",
		"®": "registered",
		"™": "trade-mark",
		"#️⃣": "keycap-#",
		"*️⃣": "keycap-*",
		"0️⃣": "keycap-0",
		"1️⃣": "keycap-1",
		"2️⃣": "keycap-2",
		"3️⃣": "keycap-3",
		"4️⃣": "keycap-4",
		"5️⃣": "keycap-5",
		"6️⃣": "keycap-6",
		"7️⃣": "keycap-7",
		"8️⃣": "keycap-8",
		"9️⃣": "keycap-9",
		"🔟": "keycap-10",
		"🔠": "input-latin-uppercase",
		"🔡": "input-latin-lowercase",
		"🔢": "input-numbers",
		"🔣": "input-symbols",
		"🔤": "input-latin-letters",
		"🅰": "a-button-(blood-type)",
		"🆎": "ab-button-(blood-type)",
		"🅱": "b-button-(blood-type)",
		"🆑": "cl-button",
		"🆒": "cool-button",
		"🆓": "free-button",
		ℹ: "information",
		"🆔": "id-button",
		"Ⓜ": "circled-m",
		"🆕": "new-button",
		"🆖": "ng-button",
		"🅾": "o-button-(blood-type)",
		"🆗": "ok-button",
		"🅿": "p-button",
		"🆘": "sos-button",
		"🆙": "up!-button",
		"🆚": "vs-button",
		"🈁": "japanese-here-button",
		"🈂": "japanese-service-charge-button",
		"🈷": "japanese-monthly-amount-button",
		"🈶": "japanese-not-free-of-charge-button",
		"🈯": "japanese-reserved-button",
		"🉐": "japanese-bargain-button",
		"🈹": "japanese-discount-button",
		"🈚": "japanese-free-of-charge-button",
		"🈲": "japanese-prohibited-button",
		"🉑": "japanese-acceptable-button",
		"🈸": "japanese-application-button",
		"🈴": "japanese-passing-grade-button",
		"🈳": "japanese-vacancy-button",
		"㊗": "japanese-congratulations-button",
		"㊙": "japanese-secret-button",
		"🈺": "japanese-open-for-business-button",
		"🈵": "japanese-no-vacancy-button",
		"🔴": "red-circle",
		"🟠": "orange-circle",
		"🟡": "yellow-circle",
		"🟢": "green-circle",
		"🔵": "blue-circle",
		"🟣": "purple-circle",
		"🟤": "brown-circle",
		"⚫": "black-circle",
		"⚪": "white-circle",
		"🟥": "red-square",
		"🟧": "orange-square",
		"🟨": "yellow-square",
		"🟩": "green-square",
		"🟦": "blue-square",
		"🟪": "purple-square",
		"🟫": "brown-square",
		"⬛": "black-large-square",
		"⬜": "white-large-square",
		"◼": "black-medium-square",
		"◻": "white-medium-square",
		"◾": "black-medium-small-square",
		"◽": "white-medium-small-square",
		"▪": "black-small-square",
		"▫": "white-small-square",
		"🔶": "large-orange-diamond",
		"🔷": "large-blue-diamond",
		"🔸": "small-orange-diamond",
		"🔹": "small-blue-diamond",
		"🔺": "red-triangle-pointed-up",
		"🔻": "red-triangle-pointed-down",
		"💠": "diamond-with-a-dot",
		"🔘": "radio-button",
		"🔳": "white-square-button",
		"🔲": "black-square-button",
		"🏁": "chequered-flag",
		"🚩": "triangular-flag",
		"🎌": "crossed-flags",
		"🏴": "black-flag",
		"🏳": "white-flag",
		"🏳️‍🌈": "rainbow-flag",
		"🏳️‍⚧️": "transgender-flag",
		"🏴‍☠️": "pirate-flag",
		"🇦🇨": "flag-ascension-island",
		"🇦🇩": "flag-andorra",
		"🇦🇪": "flag-united-arab-emirates",
		"🇦🇫": "flag-afghanistan",
		"🇦🇬": "flag-antigua-and-barbuda",
		"🇦🇮": "flag-anguilla",
		"🇦🇱": "flag-albania",
		"🇦🇲": "flag-armenia",
		"🇦🇴": "flag-angola",
		"🇦🇶": "flag-antarctica",
		"🇦🇷": "flag-argentina",
		"🇦🇸": "flag-american-samoa",
		"🇦🇹": "flag-austria",
		"🇦🇺": "flag-australia",
		"🇦🇼": "flag-aruba",
		"🇦🇽": "flag-åland-islands",
		"🇦🇿": "flag-azerbaijan",
		"🇧🇦": "flag-bosnia-and-herzegovina",
		"🇧🇧": "flag-barbados",
		"🇧🇩": "flag-bangladesh",
		"🇧🇪": "flag-belgium",
		"🇧🇫": "flag-burkina-faso",
		"🇧🇬": "flag-bulgaria",
		"🇧🇭": "flag-bahrain",
		"🇧🇮": "flag-burundi",
		"🇧🇯": "flag-benin",
		"🇧🇱": "flag-st-barthelemy",
		"🇧🇲": "flag-bermuda",
		"🇧🇳": "flag-brunei",
		"🇧🇴": "flag-bolivia",
		"🇧🇶": "flag-caribbean-netherlands",
		"🇧🇷": "flag-brazil",
		"🇧🇸": "flag-bahamas",
		"🇧🇹": "flag-bhutan",
		"🇧🇻": "flag-bouvet-island",
		"🇧🇼": "flag-botswana",
		"🇧🇾": "flag-belarus",
		"🇧🇿": "flag-belize",
		"🇨🇦": "flag-canada",
		"🇨🇨": "flag-cocos-(keeling)-islands",
		"🇨🇩": "flag-congo---kinshasa",
		"🇨🇫": "flag-central-african-republic",
		"🇨🇬": "flag-congo---brazzaville",
		"🇨🇭": "flag-switzerland",
		"🇨🇮": "flag-côte-d-ivoire",
		"🇨🇰": "flag-cook-islands",
		"🇨🇱": "flag-chile",
		"🇨🇲": "flag-cameroon",
		"🇨🇳": "flag-china",
		"🇨🇴": "flag-colombia",
		"🇨🇵": "flag-clipperton-island",
		"🇨🇷": "flag-costa-rica",
		"🇨🇺": "flag-cuba",
		"🇨🇻": "flag-cape-verde",
		"🇨🇼": "flag-curaçao",
		"🇨🇽": "flag-christmas-island",
		"🇨🇾": "flag-cyprus",
		"🇨🇿": "flag-czechia",
		"🇩🇪": "flag-germany",
		"🇩🇬": "flag-diego-garcia",
		"🇩🇯": "flag-djibouti",
		"🇩🇰": "flag-denmark",
		"🇩🇲": "flag-dominica",
		"🇩🇴": "flag-dominican-republic",
		"🇩🇿": "flag-algeria",
		"🇪🇦": "flag-ceuta-and-melilla",
		"🇪🇨": "flag-ecuador",
		"🇪🇪": "flag-estonia",
		"🇪🇬": "flag-egypt",
		"🇪🇭": "flag-western-sahara",
		"🇪🇷": "flag-eritrea",
		"🇪🇸": "flag-spain",
		"🇪🇹": "flag-ethiopia",
		"🇪🇺": "flag-european-union",
		"🇫🇮": "flag-finland",
		"🇫🇯": "flag-fiji",
		"🇫🇰": "flag-falkland-islands",
		"🇫🇲": "flag-micronesia",
		"🇫🇴": "flag-faroe-islands",
		"🇫🇷": "flag-france",
		"🇬🇦": "flag-gabon",
		"🇬🇧": "flag-united-kingdom",
		"🇬🇩": "flag-grenada",
		"🇬🇪": "flag-georgia",
		"🇬🇫": "flag-french-guiana",
		"🇬🇬": "flag-guernsey",
		"🇬🇭": "flag-ghana",
		"🇬🇮": "flag-gibraltar",
		"🇬🇱": "flag-greenland",
		"🇬🇲": "flag-gambia",
		"🇬🇳": "flag-guinea",
		"🇬🇵": "flag-guadeloupe",
		"🇬🇶": "flag-equatorial-guinea",
		"🇬🇷": "flag-greece",
		"🇬🇸": "flag-south-georgia-and-south-sandwich-islands",
		"🇬🇹": "flag-guatemala",
		"🇬🇺": "flag-guam",
		"🇬🇼": "flag-guinea-bissau",
		"🇬🇾": "flag-guyana",
		"🇭🇰": "flag-hong-kong-sar-china",
		"🇭🇲": "flag-heard-and-mcdonald-islands",
		"🇭🇳": "flag-honduras",
		"🇭🇷": "flag-croatia",
		"🇭🇹": "flag-haiti",
		"🇭🇺": "flag-hungary",
		"🇮🇨": "flag-canary-islands",
		"🇮🇩": "flag-indonesia",
		"🇮🇪": "flag-ireland",
		"🇮🇱": "flag-israel",
		"🇮🇲": "flag-isle-of-man",
		"🇮🇳": "flag-india",
		"🇮🇴": "flag-british-indian-ocean-territory",
		"🇮🇶": "flag-iraq",
		"🇮🇷": "flag-iran",
		"🇮🇸": "flag-iceland",
		"🇮🇹": "flag-italy",
		"🇯🇪": "flag-jersey",
		"🇯🇲": "flag-jamaica",
		"🇯🇴": "flag-jordan",
		"🇯🇵": "flag-japan",
		"🇰🇪": "flag-kenya",
		"🇰🇬": "flag-kyrgyzstan",
		"🇰🇭": "flag-cambodia",
		"🇰🇮": "flag-kiribati",
		"🇰🇲": "flag-comoros",
		"🇰🇳": "flag-st-kitts-and-nevis",
		"🇰🇵": "flag-north-korea",
		"🇰🇷": "flag-south-korea",
		"🇰🇼": "flag-kuwait",
		"🇰🇾": "flag-cayman-islands",
		"🇰🇿": "flag-kazakhstan",
		"🇱🇦": "flag-laos",
		"🇱🇧": "flag-lebanon",
		"🇱🇨": "flag-st-lucia",
		"🇱🇮": "flag-liechtenstein",
		"🇱🇰": "flag-sri-lanka",
		"🇱🇷": "flag-liberia",
		"🇱🇸": "flag-lesotho",
		"🇱🇹": "flag-lithuania",
		"🇱🇺": "flag-luxembourg",
		"🇱🇻": "flag-latvia",
		"🇱🇾": "flag-libya",
		"🇲🇦": "flag-morocco",
		"🇲🇨": "flag-monaco",
		"🇲🇩": "flag-moldova",
		"🇲🇪": "flag-montenegro",
		"🇲🇫": "flag-st-martin",
		"🇲🇬": "flag-madagascar",
		"🇲🇭": "flag-marshall-islands",
		"🇲🇰": "flag-north-macedonia",
		"🇲🇱": "flag-mali",
		"🇲🇲": "flag-myanmar-(burma)",
		"🇲🇳": "flag-mongolia",
		"🇲🇴": "flag-macao-sar-china",
		"🇲🇵": "flag-northern-mariana-islands",
		"🇲🇶": "flag-martinique",
		"🇲🇷": "flag-mauritania",
		"🇲🇸": "flag-montserrat",
		"🇲🇹": "flag-malta",
		"🇲🇺": "flag-mauritius",
		"🇲🇻": "flag-maldives",
		"🇲🇼": "flag-malawi",
		"🇲🇽": "flag-mexico",
		"🇲🇾": "flag-malaysia",
		"🇲🇿": "flag-mozambique",
		"🇳🇦": "flag-namibia",
		"🇳🇨": "flag-new-caledonia",
		"🇳🇪": "flag-niger",
		"🇳🇫": "flag-norfolk-island",
		"🇳🇬": "flag-nigeria",
		"🇳🇮": "flag-nicaragua",
		"🇳🇱": "flag-netherlands",
		"🇳🇴": "flag-norway",
		"🇳🇵": "flag-nepal",
		"🇳🇷": "flag-nauru",
		"🇳🇺": "flag-niue",
		"🇳🇿": "flag-new-zealand",
		"🇴🇲": "flag-oman",
		"🇵🇦": "flag-panama",
		"🇵🇪": "flag-peru",
		"🇵🇫": "flag-french-polynesia",
		"🇵🇬": "flag-papua-new-guinea",
		"🇵🇭": "flag-philippines",
		"🇵🇰": "flag-pakistan",
		"🇵🇱": "flag-poland",
		"🇵🇲": "flag-st-pierre-and-miquelon",
		"🇵🇳": "flag-pitcairn-islands",
		"🇵🇷": "flag-puerto-rico",
		"🇵🇸": "flag-palestinian-territories",
		"🇵🇹": "flag-portugal",
		"🇵🇼": "flag-palau",
		"🇵🇾": "flag-paraguay",
		"🇶🇦": "flag-qatar",
		"🇷🇪": "flag-reunion",
		"🇷🇴": "flag-romania",
		"🇷🇸": "flag-serbia",
		"🇷🇺": "flag-russia",
		"🇷🇼": "flag-rwanda",
		"🇸🇦": "flag-saudi-arabia",
		"🇸🇧": "flag-solomon-islands",
		"🇸🇨": "flag-seychelles",
		"🇸🇩": "flag-sudan",
		"🇸🇪": "flag-sweden",
		"🇸🇬": "flag-singapore",
		"🇸🇭": "flag-st-helena",
		"🇸🇮": "flag-slovenia",
		"🇸🇯": "flag-svalbard-and-jan-mayen",
		"🇸🇰": "flag-slovakia",
		"🇸🇱": "flag-sierra-leone",
		"🇸🇲": "flag-san-marino",
		"🇸🇳": "flag-senegal",
		"🇸🇴": "flag-somalia",
		"🇸🇷": "flag-suriname",
		"🇸🇸": "flag-south-sudan",
		"🇸🇹": "flag-são-tome-and-príncipe",
		"🇸🇻": "flag-el-salvador",
		"🇸🇽": "flag-sint-maarten",
		"🇸🇾": "flag-syria",
		"🇸🇿": "flag-eswatini",
		"🇹🇦": "flag-tristan-da-cunha",
		"🇹🇨": "flag-turks-and-caicos-islands",
		"🇹🇩": "flag-chad",
		"🇹🇫": "flag-french-southern-territories",
		"🇹🇬": "flag-togo",
		"🇹🇭": "flag-thailand",
		"🇹🇯": "flag-tajikistan",
		"🇹🇰": "flag-tokelau",
		"🇹🇱": "flag-timor-leste",
		"🇹🇲": "flag-turkmenistan",
		"🇹🇳": "flag-tunisia",
		"🇹🇴": "flag-tonga",
		"🇹🇷": "flag-turkey",
		"🇹🇹": "flag-trinidad-and-tobago",
		"🇹🇻": "flag-tuvalu",
		"🇹🇼": "flag-taiwan",
		"🇹🇿": "flag-tanzania",
		"🇺🇦": "flag-ukraine",
		"🇺🇬": "flag-uganda",
		"🇺🇲": "flag-us-outlying-islands",
		"🇺🇳": "flag-united-nations",
		"🇺🇸": "flag-united-states",
		"🇺🇾": "flag-uruguay",
		"🇺🇿": "flag-uzbekistan",
		"🇻🇦": "flag-vatican-city",
		"🇻🇨": "flag-st-vincent-and-grenadines",
		"🇻🇪": "flag-venezuela",
		"🇻🇬": "flag-british-virgin-islands",
		"🇻🇮": "flag-us-virgin-islands",
		"🇻🇳": "flag-vietnam",
		"🇻🇺": "flag-vanuatu",
		"🇼🇫": "flag-wallis-and-futuna",
		"🇼🇸": "flag-samoa",
		"🇽🇰": "flag-kosovo",
		"🇾🇪": "flag-yemen",
		"🇾🇹": "flag-mayotte",
		"🇿🇦": "flag-south-africa",
		"🇿🇲": "flag-zambia",
		"🇿🇼": "flag-zimbabwe",
		"🏴󠁧󠁢󠁥󠁮󠁧󠁿": "flag-england",
		"🏴󠁧󠁢󠁳󠁣󠁴󠁿": "flag-scotland",
		"🏴󠁧󠁢󠁷󠁬󠁳󠁿": "flag-wales"
	};
	const EMOJIS = Object.keys(EMOJI_NAMES);

	// https://publicsuffix.org/list/public_suffix_list.dat

	const PUBLIC_SUFFIX_LIST = `
// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at https://mozilla.org/MPL/2.0/.

// Please pull this list from, and only from https://publicsuffix.org/list/public_suffix_list.dat,
// rather than any other VCS sites. Pulling from any other URL is not guaranteed to be supported.

// Instructions on pulling and using this list can be found at https://publicsuffix.org/list/.

// ===BEGIN ICANN DOMAINS===

// ac : http://nic.ac/rules.htm
ac
com.ac
edu.ac
gov.ac
net.ac
mil.ac
org.ac

// ad : https://en.wikipedia.org/wiki/.ad
ad
nom.ad

// ae : https://tdra.gov.ae/en/aeda/ae-policies
ae
co.ae
net.ae
org.ae
sch.ae
ac.ae
gov.ae
mil.ae

// aero : see https://www.information.aero/index.php?id=66
aero
accident-investigation.aero
accident-prevention.aero
aerobatic.aero
aeroclub.aero
aerodrome.aero
agents.aero
aircraft.aero
airline.aero
airport.aero
air-surveillance.aero
airtraffic.aero
air-traffic-control.aero
ambulance.aero
amusement.aero
association.aero
author.aero
ballooning.aero
broker.aero
caa.aero
cargo.aero
catering.aero
certification.aero
championship.aero
charter.aero
civilaviation.aero
club.aero
conference.aero
consultant.aero
consulting.aero
control.aero
council.aero
crew.aero
design.aero
dgca.aero
educator.aero
emergency.aero
engine.aero
engineer.aero
entertainment.aero
equipment.aero
exchange.aero
express.aero
federation.aero
flight.aero
fuel.aero
gliding.aero
government.aero
groundhandling.aero
group.aero
hanggliding.aero
homebuilt.aero
insurance.aero
journal.aero
journalist.aero
leasing.aero
logistics.aero
magazine.aero
maintenance.aero
media.aero
microlight.aero
modelling.aero
navigation.aero
parachuting.aero
paragliding.aero
passenger-association.aero
pilot.aero
press.aero
production.aero
recreation.aero
repbody.aero
res.aero
research.aero
rotorcraft.aero
safety.aero
scientist.aero
services.aero
show.aero
skydiving.aero
software.aero
student.aero
trader.aero
trading.aero
trainer.aero
union.aero
workinggroup.aero
works.aero

// af : http://www.nic.af/help.jsp
af
gov.af
com.af
org.af
net.af
edu.af

// ag : http://www.nic.ag/prices.htm
ag
com.ag
org.ag
net.ag
co.ag
nom.ag

// ai : http://nic.com.ai/
ai
off.ai
com.ai
net.ai
org.ai

// al : http://www.ert.gov.al/ert_alb/faq_det.html?Id=31
al
com.al
edu.al
gov.al
mil.al
net.al
org.al

// am : https://www.amnic.net/policy/en/Policy_EN.pdf
am
co.am
com.am
commune.am
net.am
org.am

// ao : https://en.wikipedia.org/wiki/.ao
// http://www.dns.ao/REGISTR.DOC
ao
ed.ao
gv.ao
og.ao
co.ao
pb.ao
it.ao

// aq : https://en.wikipedia.org/wiki/.aq
aq

// ar : https://nic.ar/es/nic-argentina/normativa
ar
bet.ar
com.ar
coop.ar
edu.ar
gob.ar
gov.ar
int.ar
mil.ar
musica.ar
mutual.ar
net.ar
org.ar
senasa.ar
tur.ar

// arpa : https://en.wikipedia.org/wiki/.arpa
// Confirmed by registry <iana-questions@icann.org> 2008-06-18
arpa
e164.arpa
in-addr.arpa
ip6.arpa
iris.arpa
uri.arpa
urn.arpa

// as : https://en.wikipedia.org/wiki/.as
as
gov.as

// asia : https://en.wikipedia.org/wiki/.asia
asia

// at : https://en.wikipedia.org/wiki/.at
// Confirmed by registry <it@nic.at> 2008-06-17
at
ac.at
co.at
gv.at
or.at
sth.ac.at

// au : https://en.wikipedia.org/wiki/.au
// http://www.auda.org.au/
au
// 2LDs
com.au
net.au
org.au
edu.au
gov.au
asn.au
id.au
// Historic 2LDs (closed to new registration, but sites still exist)
info.au
conf.au
oz.au
// CGDNs - http://www.cgdn.org.au/
act.au
nsw.au
nt.au
qld.au
sa.au
tas.au
vic.au
wa.au
// 3LDs
act.edu.au
catholic.edu.au
// eq.edu.au - Removed at the request of the Queensland Department of Education
nsw.edu.au
nt.edu.au
qld.edu.au
sa.edu.au
tas.edu.au
vic.edu.au
wa.edu.au
// act.gov.au  Bug 984824 - Removed at request of Greg Tankard
// nsw.gov.au  Bug 547985 - Removed at request of <Shae.Donelan@services.nsw.gov.au>
// nt.gov.au  Bug 940478 - Removed at request of Greg Connors <Greg.Connors@nt.gov.au>
qld.gov.au
sa.gov.au
tas.gov.au
vic.gov.au
wa.gov.au
// 4LDs
// education.tas.edu.au - Removed at the request of the Department of Education Tasmania
schools.nsw.edu.au

// aw : https://en.wikipedia.org/wiki/.aw
aw
com.aw

// ax : https://en.wikipedia.org/wiki/.ax
ax

// az : https://en.wikipedia.org/wiki/.az
az
com.az
net.az
int.az
gov.az
org.az
edu.az
info.az
pp.az
mil.az
name.az
pro.az
biz.az

// ba : http://nic.ba/users_data/files/pravilnik_o_registraciji.pdf
ba
com.ba
edu.ba
gov.ba
mil.ba
net.ba
org.ba

// bb : https://en.wikipedia.org/wiki/.bb
bb
biz.bb
co.bb
com.bb
edu.bb
gov.bb
info.bb
net.bb
org.bb
store.bb
tv.bb

// bd : https://en.wikipedia.org/wiki/.bd
*.bd

// be : https://en.wikipedia.org/wiki/.be
// Confirmed by registry <tech@dns.be> 2008-06-08
be
ac.be

// bf : https://en.wikipedia.org/wiki/.bf
bf
gov.bf

// bg : https://en.wikipedia.org/wiki/.bg
// https://www.register.bg/user/static/rules/en/index.html
bg
a.bg
b.bg
c.bg
d.bg
e.bg
f.bg
g.bg
h.bg
i.bg
j.bg
k.bg
l.bg
m.bg
n.bg
o.bg
p.bg
q.bg
r.bg
s.bg
t.bg
u.bg
v.bg
w.bg
x.bg
y.bg
z.bg
0.bg
1.bg
2.bg
3.bg
4.bg
5.bg
6.bg
7.bg
8.bg
9.bg

// bh : https://en.wikipedia.org/wiki/.bh
bh
com.bh
edu.bh
net.bh
org.bh
gov.bh

// bi : https://en.wikipedia.org/wiki/.bi
// http://whois.nic.bi/
bi
co.bi
com.bi
edu.bi
or.bi
org.bi

// biz : https://en.wikipedia.org/wiki/.biz
biz

// bj : https://nic.bj/bj-suffixes.txt
// submitted by registry <contact@nic.bj>
bj
africa.bj
agro.bj
architectes.bj
assur.bj
avocats.bj
co.bj
com.bj
eco.bj
econo.bj
edu.bj
info.bj
loisirs.bj
money.bj
net.bj
org.bj
ote.bj
resto.bj
restaurant.bj
tourism.bj
univ.bj

// bm : http://www.bermudanic.bm/dnr-text.txt
bm
com.bm
edu.bm
gov.bm
net.bm
org.bm

// bn : http://www.bnnic.bn/faqs
bn
com.bn
edu.bn
gov.bn
net.bn
org.bn

// bo : https://nic.bo/delegacion2015.php#h-1.10
bo
com.bo
edu.bo
gob.bo
int.bo
org.bo
net.bo
mil.bo
tv.bo
web.bo
// Social Domains
academia.bo
agro.bo
arte.bo
blog.bo
bolivia.bo
ciencia.bo
cooperativa.bo
democracia.bo
deporte.bo
ecologia.bo
economia.bo
empresa.bo
indigena.bo
industria.bo
info.bo
medicina.bo
movimiento.bo
musica.bo
natural.bo
nombre.bo
noticias.bo
patria.bo
politica.bo
profesional.bo
plurinacional.bo
pueblo.bo
revista.bo
salud.bo
tecnologia.bo
tksat.bo
transporte.bo
wiki.bo

// br : http://registro.br/dominio/categoria.html
// Submitted by registry <fneves@registro.br>
br
9guacu.br
abc.br
adm.br
adv.br
agr.br
aju.br
am.br
anani.br
aparecida.br
app.br
arq.br
art.br
ato.br
b.br
barueri.br
belem.br
bhz.br
bib.br
bio.br
blog.br
bmd.br
boavista.br
bsb.br
campinagrande.br
campinas.br
caxias.br
cim.br
cng.br
cnt.br
com.br
contagem.br
coop.br
coz.br
cri.br
cuiaba.br
curitiba.br
def.br
des.br
det.br
dev.br
ecn.br
eco.br
edu.br
emp.br
enf.br
eng.br
esp.br
etc.br
eti.br
far.br
feira.br
flog.br
floripa.br
fm.br
fnd.br
fortal.br
fot.br
foz.br
fst.br
g12.br
geo.br
ggf.br
goiania.br
gov.br
// gov.br 26 states + df https://en.wikipedia.org/wiki/States_of_Brazil
ac.gov.br
al.gov.br
am.gov.br
ap.gov.br
ba.gov.br
ce.gov.br
df.gov.br
es.gov.br
go.gov.br
ma.gov.br
mg.gov.br
ms.gov.br
mt.gov.br
pa.gov.br
pb.gov.br
pe.gov.br
pi.gov.br
pr.gov.br
rj.gov.br
rn.gov.br
ro.gov.br
rr.gov.br
rs.gov.br
sc.gov.br
se.gov.br
sp.gov.br
to.gov.br
gru.br
imb.br
ind.br
inf.br
jab.br
jampa.br
jdf.br
joinville.br
jor.br
jus.br
leg.br
lel.br
log.br
londrina.br
macapa.br
maceio.br
manaus.br
maringa.br
mat.br
med.br
mil.br
morena.br
mp.br
mus.br
natal.br
net.br
niteroi.br
*.nom.br
not.br
ntr.br
odo.br
ong.br
org.br
osasco.br
palmas.br
poa.br
ppg.br
pro.br
psc.br
psi.br
pvh.br
qsl.br
radio.br
rec.br
recife.br
rep.br
ribeirao.br
rio.br
riobranco.br
riopreto.br
salvador.br
sampa.br
santamaria.br
santoandre.br
saobernardo.br
saogonca.br
seg.br
sjc.br
slg.br
slz.br
sorocaba.br
srv.br
taxi.br
tc.br
tec.br
teo.br
the.br
tmp.br
trd.br
tur.br
tv.br
udi.br
vet.br
vix.br
vlog.br
wiki.br
zlg.br

// bs : http://www.nic.bs/rules.html
bs
com.bs
net.bs
org.bs
edu.bs
gov.bs

// bt : https://en.wikipedia.org/wiki/.bt
bt
com.bt
edu.bt
gov.bt
net.bt
org.bt

// bv : No registrations at this time.
// Submitted by registry <jarle@uninett.no>
bv

// bw : https://en.wikipedia.org/wiki/.bw
// http://www.gobin.info/domainname/bw.doc
// list of other 2nd level tlds ?
bw
co.bw
org.bw

// by : https://en.wikipedia.org/wiki/.by
// http://tld.by/rules_2006_en.html
// list of other 2nd level tlds ?
by
gov.by
mil.by
// Official information does not indicate that com.by is a reserved
// second-level domain, but it's being used as one (see www.google.com.by and
// www.yahoo.com.by, for example), so we list it here for safety's sake.
com.by

// http://hoster.by/
of.by

// bz : https://en.wikipedia.org/wiki/.bz
// http://www.belizenic.bz/
bz
com.bz
net.bz
org.bz
edu.bz
gov.bz

// ca : https://en.wikipedia.org/wiki/.ca
ca
// ca geographical names
ab.ca
bc.ca
mb.ca
nb.ca
nf.ca
nl.ca
ns.ca
nt.ca
nu.ca
on.ca
pe.ca
qc.ca
sk.ca
yk.ca
// gc.ca: https://en.wikipedia.org/wiki/.gc.ca
// see also: http://registry.gc.ca/en/SubdomainFAQ
gc.ca

// cat : https://en.wikipedia.org/wiki/.cat
cat

// cc : https://en.wikipedia.org/wiki/.cc
cc

// cd : https://en.wikipedia.org/wiki/.cd
// see also: https://www.nic.cd/domain/insertDomain_2.jsp?act=1
cd
gov.cd

// cf : https://en.wikipedia.org/wiki/.cf
cf

// cg : https://en.wikipedia.org/wiki/.cg
cg

// ch : https://en.wikipedia.org/wiki/.ch
ch

// ci : https://en.wikipedia.org/wiki/.ci
// http://www.nic.ci/index.php?page=charte
ci
org.ci
or.ci
com.ci
co.ci
edu.ci
ed.ci
ac.ci
net.ci
go.ci
asso.ci
aéroport.ci
int.ci
presse.ci
md.ci
gouv.ci

// ck : https://en.wikipedia.org/wiki/.ck
*.ck
!www.ck

// cl : https://www.nic.cl
// Confirmed by .CL registry <hsalgado@nic.cl>
cl
co.cl
gob.cl
gov.cl
mil.cl

// cm : https://en.wikipedia.org/wiki/.cm plus bug 981927
cm
co.cm
com.cm
gov.cm
net.cm

// cn : https://en.wikipedia.org/wiki/.cn
// Submitted by registry <tanyaling@cnnic.cn>
cn
ac.cn
com.cn
edu.cn
gov.cn
net.cn
org.cn
mil.cn
公司.cn
网络.cn
網絡.cn
// cn geographic names
ah.cn
bj.cn
cq.cn
fj.cn
gd.cn
gs.cn
gz.cn
gx.cn
ha.cn
hb.cn
he.cn
hi.cn
hl.cn
hn.cn
jl.cn
js.cn
jx.cn
ln.cn
nm.cn
nx.cn
qh.cn
sc.cn
sd.cn
sh.cn
sn.cn
sx.cn
tj.cn
xj.cn
xz.cn
yn.cn
zj.cn
hk.cn
mo.cn
tw.cn

// co : https://en.wikipedia.org/wiki/.co
// Submitted by registry <tecnico@uniandes.edu.co>
co
arts.co
com.co
edu.co
firm.co
gov.co
info.co
int.co
mil.co
net.co
nom.co
org.co
rec.co
web.co

// com : https://en.wikipedia.org/wiki/.com
com

// coop : https://en.wikipedia.org/wiki/.coop
coop

// cr : http://www.nic.cr/niccr_publico/showRegistroDominiosScreen.do
cr
ac.cr
co.cr
ed.cr
fi.cr
go.cr
or.cr
sa.cr

// cu : https://en.wikipedia.org/wiki/.cu
cu
com.cu
edu.cu
org.cu
net.cu
gov.cu
inf.cu

// cv : https://en.wikipedia.org/wiki/.cv
// cv : http://www.dns.cv/tldcv_portal/do?com=DS;5446457100;111;+PAGE(4000018)+K-CAT-CODIGO(RDOM)+RCNT(100); <- registration rules
cv
com.cv
edu.cv
int.cv
nome.cv
org.cv

// cw : http://www.una.cw/cw_registry/
// Confirmed by registry <registry@una.net> 2013-03-26
cw
com.cw
edu.cw
net.cw
org.cw

// cx : https://en.wikipedia.org/wiki/.cx
// list of other 2nd level tlds ?
cx
gov.cx

// cy : http://www.nic.cy/
// Submitted by registry Panayiotou Fotia <cydns@ucy.ac.cy>
// namespace policies URL https://www.nic.cy/portal//sites/default/files/symfonia_gia_eggrafi.pdf
cy
ac.cy
biz.cy
com.cy
ekloges.cy
gov.cy
ltd.cy
mil.cy
net.cy
org.cy
press.cy
pro.cy
tm.cy

// cz : https://en.wikipedia.org/wiki/.cz
cz

// de : https://en.wikipedia.org/wiki/.de
// Confirmed by registry <ops@denic.de> (with technical
// reservations) 2008-07-01
de

// dj : https://en.wikipedia.org/wiki/.dj
dj

// dk : https://en.wikipedia.org/wiki/.dk
// Confirmed by registry <robert@dk-hostmaster.dk> 2008-06-17
dk

// dm : https://en.wikipedia.org/wiki/.dm
dm
com.dm
net.dm
org.dm
edu.dm
gov.dm

// do : https://en.wikipedia.org/wiki/.do
do
art.do
com.do
edu.do
gob.do
gov.do
mil.do
net.do
org.do
sld.do
web.do

// dz : http://www.nic.dz/images/pdf_nic/charte.pdf
dz
art.dz
asso.dz
com.dz
edu.dz
gov.dz
org.dz
net.dz
pol.dz
soc.dz
tm.dz

// ec : http://www.nic.ec/reg/paso1.asp
// Submitted by registry <vabboud@nic.ec>
ec
com.ec
info.ec
net.ec
fin.ec
k12.ec
med.ec
pro.ec
org.ec
edu.ec
gov.ec
gob.ec
mil.ec

// edu : https://en.wikipedia.org/wiki/.edu
edu

// ee : http://www.eenet.ee/EENet/dom_reeglid.html#lisa_B
ee
edu.ee
gov.ee
riik.ee
lib.ee
med.ee
com.ee
pri.ee
aip.ee
org.ee
fie.ee

// eg : https://en.wikipedia.org/wiki/.eg
eg
com.eg
edu.eg
eun.eg
gov.eg
mil.eg
name.eg
net.eg
org.eg
sci.eg

// er : https://en.wikipedia.org/wiki/.er
*.er

// es : https://www.nic.es/site_ingles/ingles/dominios/index.html
es
com.es
nom.es
org.es
gob.es
edu.es

// et : https://en.wikipedia.org/wiki/.et
et
com.et
gov.et
org.et
edu.et
biz.et
name.et
info.et
net.et

// eu : https://en.wikipedia.org/wiki/.eu
eu

// fi : https://en.wikipedia.org/wiki/.fi
fi
// aland.fi : https://en.wikipedia.org/wiki/.ax
// This domain is being phased out in favor of .ax. As there are still many
// domains under aland.fi, we still keep it on the list until aland.fi is
// completely removed.
// TODO: Check for updates (expected to be phased out around Q1/2009)
aland.fi

// fj : http://domains.fj/
// Submitted by registry <garth.miller@cocca.org.nz> 2020-02-11
fj
ac.fj
biz.fj
com.fj
gov.fj
info.fj
mil.fj
name.fj
net.fj
org.fj
pro.fj

// fk : https://en.wikipedia.org/wiki/.fk
*.fk

// fm : https://en.wikipedia.org/wiki/.fm
com.fm
edu.fm
net.fm
org.fm
fm

// fo : https://en.wikipedia.org/wiki/.fo
fo

// fr : https://www.afnic.fr/ https://www.afnic.fr/wp-media/uploads/2022/12/afnic-naming-policy-2023-01-01.pdf
fr
asso.fr
com.fr
gouv.fr
nom.fr
prd.fr
tm.fr
// Other SLDs now selfmanaged out of AFNIC range. Former "domaines sectoriels", still registration suffixes
avoues.fr
cci.fr
greta.fr
huissier-justice.fr

// ga : https://en.wikipedia.org/wiki/.ga
ga

// gb : This registry is effectively dormant
// Submitted by registry <Damien.Shaw@ja.net>
gb

// gd : https://en.wikipedia.org/wiki/.gd
edu.gd
gov.gd
gd

// ge : http://www.nic.net.ge/policy_en.pdf
ge
com.ge
edu.ge
gov.ge
org.ge
mil.ge
net.ge
pvt.ge

// gf : https://en.wikipedia.org/wiki/.gf
gf

// gg : http://www.channelisles.net/register-domains/
// Confirmed by registry <nigel@channelisles.net> 2013-11-28
gg
co.gg
net.gg
org.gg

// gh : https://en.wikipedia.org/wiki/.gh
// see also: http://www.nic.gh/reg_now.php
// Although domains directly at second level are not possible at the moment,
// they have been possible for some time and may come back.
gh
com.gh
edu.gh
gov.gh
org.gh
mil.gh

// gi : http://www.nic.gi/rules.html
gi
com.gi
ltd.gi
gov.gi
mod.gi
edu.gi
org.gi

// gl : https://en.wikipedia.org/wiki/.gl
// http://nic.gl
gl
co.gl
com.gl
edu.gl
net.gl
org.gl

// gm : http://www.nic.gm/htmlpages%5Cgm-policy.htm
gm

// gn : http://psg.com/dns/gn/gn.txt
// Submitted by registry <randy@psg.com>
gn
ac.gn
com.gn
edu.gn
gov.gn
org.gn
net.gn

// gov : https://en.wikipedia.org/wiki/.gov
gov

// gp : http://www.nic.gp/index.php?lang=en
gp
com.gp
net.gp
mobi.gp
edu.gp
org.gp
asso.gp

// gq : https://en.wikipedia.org/wiki/.gq
gq

// gr : https://grweb.ics.forth.gr/english/1617-B-2005.html
// Submitted by registry <segred@ics.forth.gr>
gr
com.gr
edu.gr
net.gr
org.gr
gov.gr

// gs : https://en.wikipedia.org/wiki/.gs
gs

// gt : https://www.gt/sitio/registration_policy.php?lang=en
gt
com.gt
edu.gt
gob.gt
ind.gt
mil.gt
net.gt
org.gt

// gu : http://gadao.gov.gu/register.html
// University of Guam : https://www.uog.edu
// Submitted by uognoc@triton.uog.edu
gu
com.gu
edu.gu
gov.gu
guam.gu
info.gu
net.gu
org.gu
web.gu

// gw : https://en.wikipedia.org/wiki/.gw
// gw : https://nic.gw/regras/
gw

// gy : https://en.wikipedia.org/wiki/.gy
// http://registry.gy/
gy
co.gy
com.gy
edu.gy
gov.gy
net.gy
org.gy

// hk : https://www.hkirc.hk
// Submitted by registry <hk.tech@hkirc.hk>
hk
com.hk
edu.hk
gov.hk
idv.hk
net.hk
org.hk
公司.hk
教育.hk
敎育.hk
政府.hk
個人.hk
个人.hk
箇人.hk
網络.hk
网络.hk
组織.hk
網絡.hk
网絡.hk
组织.hk
組織.hk
組织.hk

// hm : https://en.wikipedia.org/wiki/.hm
hm

// hn : http://www.nic.hn/politicas/ps02,,05.html
hn
com.hn
edu.hn
org.hn
net.hn
mil.hn
gob.hn

// hr : http://www.dns.hr/documents/pdf/HRTLD-regulations.pdf
hr
iz.hr
from.hr
name.hr
com.hr

// ht : http://www.nic.ht/info/charte.cfm
ht
com.ht
shop.ht
firm.ht
info.ht
adult.ht
net.ht
pro.ht
org.ht
med.ht
art.ht
coop.ht
pol.ht
asso.ht
edu.ht
rel.ht
gouv.ht
perso.ht

// hu : http://www.domain.hu/domain/English/sld.html
// Confirmed by registry <pasztor@iszt.hu> 2008-06-12
hu
co.hu
info.hu
org.hu
priv.hu
sport.hu
tm.hu
2000.hu
agrar.hu
bolt.hu
casino.hu
city.hu
erotica.hu
erotika.hu
film.hu
forum.hu
games.hu
hotel.hu
ingatlan.hu
jogasz.hu
konyvelo.hu
lakas.hu
media.hu
news.hu
reklam.hu
sex.hu
shop.hu
suli.hu
szex.hu
tozsde.hu
utazas.hu
video.hu

// id : https://pandi.id/en/domain/registration-requirements/
id
ac.id
biz.id
co.id
desa.id
go.id
mil.id
my.id
net.id
or.id
ponpes.id
sch.id
web.id

// ie : https://en.wikipedia.org/wiki/.ie
ie
gov.ie

// il :         http://www.isoc.org.il/domains/
// see also:    https://en.isoc.org.il/il-cctld/registration-rules
// ISOC-IL      (operated by .il Registry)
il
ac.il
co.il
gov.il
idf.il
k12.il
muni.il
net.il
org.il
// xn--4dbrk0ce ("Israel", Hebrew) : IL
ישראל
// xn--4dbgdty6c.xn--4dbrk0ce.
אקדמיה.ישראל
// xn--5dbhl8d.xn--4dbrk0ce.
ישוב.ישראל
// xn--8dbq2a.xn--4dbrk0ce.
צהל.ישראל
// xn--hebda8b.xn--4dbrk0ce.
ממשל.ישראל

// im : https://www.nic.im/
// Submitted by registry <info@nic.im>
im
ac.im
co.im
com.im
ltd.co.im
net.im
org.im
plc.co.im
tt.im
tv.im

// in : https://en.wikipedia.org/wiki/.in
// see also: https://registry.in/policies
// Please note, that nic.in is not an official eTLD, but used by most
// government institutions.
in
5g.in
6g.in
ac.in
ai.in
am.in
bihar.in
biz.in
business.in
ca.in
cn.in
co.in
com.in
coop.in
cs.in
delhi.in
dr.in
edu.in
er.in
firm.in
gen.in
gov.in
gujarat.in
ind.in
info.in
int.in
internet.in
io.in
me.in
mil.in
net.in
nic.in
org.in
pg.in
post.in
pro.in
res.in
travel.in
tv.in
uk.in
up.in
us.in

// info : https://en.wikipedia.org/wiki/.info
info

// int : https://en.wikipedia.org/wiki/.int
// Confirmed by registry <iana-questions@icann.org> 2008-06-18
int
eu.int

// io : http://www.nic.io/rules.htm
// list of other 2nd level tlds ?
io
com.io

// iq : http://www.cmc.iq/english/iq/iqregister1.htm
iq
gov.iq
edu.iq
mil.iq
com.iq
org.iq
net.iq

// ir : http://www.nic.ir/Terms_and_Conditions_ir,_Appendix_1_Domain_Rules
// Also see http://www.nic.ir/Internationalized_Domain_Names
// Two <iran>.ir entries added at request of <tech-team@nic.ir>, 2010-04-16
ir
ac.ir
co.ir
gov.ir
id.ir
net.ir
org.ir
sch.ir
// xn--mgba3a4f16a.ir (<iran>.ir, Persian YEH)
ایران.ir
// xn--mgba3a4fra.ir (<iran>.ir, Arabic YEH)
ايران.ir

// is : http://www.isnic.is/domain/rules.php
// Confirmed by registry <marius@isgate.is> 2008-12-06
is
net.is
com.is
edu.is
gov.is
org.is
int.is

// it : https://en.wikipedia.org/wiki/.it
it
gov.it
edu.it
// Reserved geo-names (regions and provinces):
// https://www.nic.it/sites/default/files/archivio/docs/Regulation_assignation_v7.1.pdf
// Regions
abr.it
abruzzo.it
aosta-valley.it
aostavalley.it
bas.it
basilicata.it
cal.it
calabria.it
cam.it
campania.it
emilia-romagna.it
emiliaromagna.it
emr.it
friuli-v-giulia.it
friuli-ve-giulia.it
friuli-vegiulia.it
friuli-venezia-giulia.it
friuli-veneziagiulia.it
friuli-vgiulia.it
friuliv-giulia.it
friulive-giulia.it
friulivegiulia.it
friulivenezia-giulia.it
friuliveneziagiulia.it
friulivgiulia.it
fvg.it
laz.it
lazio.it
lig.it
liguria.it
lom.it
lombardia.it
lombardy.it
lucania.it
mar.it
marche.it
mol.it
molise.it
piedmont.it
piemonte.it
pmn.it
pug.it
puglia.it
sar.it
sardegna.it
sardinia.it
sic.it
sicilia.it
sicily.it
taa.it
tos.it
toscana.it
trentin-sud-tirol.it
trentin-süd-tirol.it
trentin-sudtirol.it
trentin-südtirol.it
trentin-sued-tirol.it
trentin-suedtirol.it
trentino-a-adige.it
trentino-aadige.it
trentino-alto-adige.it
trentino-altoadige.it
trentino-s-tirol.it
trentino-stirol.it
trentino-sud-tirol.it
trentino-süd-tirol.it
trentino-sudtirol.it
trentino-südtirol.it
trentino-sued-tirol.it
trentino-suedtirol.it
trentino.it
trentinoa-adige.it
trentinoaadige.it
trentinoalto-adige.it
trentinoaltoadige.it
trentinos-tirol.it
trentinostirol.it
trentinosud-tirol.it
trentinosüd-tirol.it
trentinosudtirol.it
trentinosüdtirol.it
trentinosued-tirol.it
trentinosuedtirol.it
trentinsud-tirol.it
trentinsüd-tirol.it
trentinsudtirol.it
trentinsüdtirol.it
trentinsued-tirol.it
trentinsuedtirol.it
tuscany.it
umb.it
umbria.it
val-d-aosta.it
val-daosta.it
vald-aosta.it
valdaosta.it
valle-aosta.it
valle-d-aosta.it
valle-daosta.it
valleaosta.it
valled-aosta.it
valledaosta.it
vallee-aoste.it
vallée-aoste.it
vallee-d-aoste.it
vallée-d-aoste.it
valleeaoste.it
valléeaoste.it
valleedaoste.it
valléedaoste.it
vao.it
vda.it
ven.it
veneto.it
// Provinces
ag.it
agrigento.it
al.it
alessandria.it
alto-adige.it
altoadige.it
an.it
ancona.it
andria-barletta-trani.it
andria-trani-barletta.it
andriabarlettatrani.it
andriatranibarletta.it
ao.it
aosta.it
aoste.it
ap.it
aq.it
aquila.it
ar.it
arezzo.it
ascoli-piceno.it
ascolipiceno.it
asti.it
at.it
av.it
avellino.it
ba.it
balsan-sudtirol.it
balsan-südtirol.it
balsan-suedtirol.it
balsan.it
bari.it
barletta-trani-andria.it
barlettatraniandria.it
belluno.it
benevento.it
bergamo.it
bg.it
bi.it
biella.it
bl.it
bn.it
bo.it
bologna.it
bolzano-altoadige.it
bolzano.it
bozen-sudtirol.it
bozen-südtirol.it
bozen-suedtirol.it
bozen.it
br.it
brescia.it
brindisi.it
bs.it
bt.it
bulsan-sudtirol.it
bulsan-südtirol.it
bulsan-suedtirol.it
bulsan.it
bz.it
ca.it
cagliari.it
caltanissetta.it
campidano-medio.it
campidanomedio.it
campobasso.it
carbonia-iglesias.it
carboniaiglesias.it
carrara-massa.it
carraramassa.it
caserta.it
catania.it
catanzaro.it
cb.it
ce.it
cesena-forli.it
cesena-forlì.it
cesenaforli.it
cesenaforlì.it
ch.it
chieti.it
ci.it
cl.it
cn.it
co.it
como.it
cosenza.it
cr.it
cremona.it
crotone.it
cs.it
ct.it
cuneo.it
cz.it
dell-ogliastra.it
dellogliastra.it
en.it
enna.it
fc.it
fe.it
fermo.it
ferrara.it
fg.it
fi.it
firenze.it
florence.it
fm.it
foggia.it
forli-cesena.it
forlì-cesena.it
forlicesena.it
forlìcesena.it
fr.it
frosinone.it
ge.it
genoa.it
genova.it
go.it
gorizia.it
gr.it
grosseto.it
iglesias-carbonia.it
iglesiascarbonia.it
im.it
imperia.it
is.it
isernia.it
kr.it
la-spezia.it
laquila.it
laspezia.it
latina.it
lc.it
le.it
lecce.it
lecco.it
li.it
livorno.it
lo.it
lodi.it
lt.it
lu.it
lucca.it
macerata.it
mantova.it
massa-carrara.it
massacarrara.it
matera.it
mb.it
mc.it
me.it
medio-campidano.it
mediocampidano.it
messina.it
mi.it
milan.it
milano.it
mn.it
mo.it
modena.it
monza-brianza.it
monza-e-della-brianza.it
monza.it
monzabrianza.it
monzaebrianza.it
monzaedellabrianza.it
ms.it
mt.it
na.it
naples.it
napoli.it
no.it
novara.it
nu.it
nuoro.it
og.it
ogliastra.it
olbia-tempio.it
olbiatempio.it
or.it
oristano.it
ot.it
pa.it
padova.it
padua.it
palermo.it
parma.it
pavia.it
pc.it
pd.it
pe.it
perugia.it
pesaro-urbino.it
pesarourbino.it
pescara.it
pg.it
pi.it
piacenza.it
pisa.it
pistoia.it
pn.it
po.it
pordenone.it
potenza.it
pr.it
prato.it
pt.it
pu.it
pv.it
pz.it
ra.it
ragusa.it
ravenna.it
rc.it
re.it
reggio-calabria.it
reggio-emilia.it
reggiocalabria.it
reggioemilia.it
rg.it
ri.it
rieti.it
rimini.it
rm.it
rn.it
ro.it
roma.it
rome.it
rovigo.it
sa.it
salerno.it
sassari.it
savona.it
si.it
siena.it
siracusa.it
so.it
sondrio.it
sp.it
sr.it
ss.it
suedtirol.it
südtirol.it
sv.it
ta.it
taranto.it
te.it
tempio-olbia.it
tempioolbia.it
teramo.it
terni.it
tn.it
to.it
torino.it
tp.it
tr.it
trani-andria-barletta.it
trani-barletta-andria.it
traniandriabarletta.it
tranibarlettaandria.it
trapani.it
trento.it
treviso.it
trieste.it
ts.it
turin.it
tv.it
ud.it
udine.it
urbino-pesaro.it
urbinopesaro.it
va.it
varese.it
vb.it
vc.it
ve.it
venezia.it
venice.it
verbania.it
vercelli.it
verona.it
vi.it
vibo-valentia.it
vibovalentia.it
vicenza.it
viterbo.it
vr.it
vs.it
vt.it
vv.it

// je : http://www.channelisles.net/register-domains/
// Confirmed by registry <nigel@channelisles.net> 2013-11-28
je
co.je
net.je
org.je

// jm : http://www.com.jm/register.html
*.jm

// jo : http://www.dns.jo/Registration_policy.aspx
jo
com.jo
org.jo
net.jo
edu.jo
sch.jo
gov.jo
mil.jo
name.jo

// jobs : https://en.wikipedia.org/wiki/.jobs
jobs

// jp : https://en.wikipedia.org/wiki/.jp
// http://jprs.co.jp/en/jpdomain.html
// Submitted by registry <info@jprs.jp>
jp
// jp organizational type names
ac.jp
ad.jp
co.jp
ed.jp
go.jp
gr.jp
lg.jp
ne.jp
or.jp
// jp prefecture type names
aichi.jp
akita.jp
aomori.jp
chiba.jp
ehime.jp
fukui.jp
fukuoka.jp
fukushima.jp
gifu.jp
gunma.jp
hiroshima.jp
hokkaido.jp
hyogo.jp
ibaraki.jp
ishikawa.jp
iwate.jp
kagawa.jp
kagoshima.jp
kanagawa.jp
kochi.jp
kumamoto.jp
kyoto.jp
mie.jp
miyagi.jp
miyazaki.jp
nagano.jp
nagasaki.jp
nara.jp
niigata.jp
oita.jp
okayama.jp
okinawa.jp
osaka.jp
saga.jp
saitama.jp
shiga.jp
shimane.jp
shizuoka.jp
tochigi.jp
tokushima.jp
tokyo.jp
tottori.jp
toyama.jp
wakayama.jp
yamagata.jp
yamaguchi.jp
yamanashi.jp
栃木.jp
愛知.jp
愛媛.jp
兵庫.jp
熊本.jp
茨城.jp
北海道.jp
千葉.jp
和歌山.jp
長崎.jp
長野.jp
新潟.jp
青森.jp
静岡.jp
東京.jp
石川.jp
埼玉.jp
三重.jp
京都.jp
佐賀.jp
大分.jp
大阪.jp
奈良.jp
宮城.jp
宮崎.jp
富山.jp
山口.jp
山形.jp
山梨.jp
岩手.jp
岐阜.jp
岡山.jp
島根.jp
広島.jp
徳島.jp
沖縄.jp
滋賀.jp
神奈川.jp
福井.jp
福岡.jp
福島.jp
秋田.jp
群馬.jp
香川.jp
高知.jp
鳥取.jp
鹿児島.jp
// jp geographic type names
// http://jprs.jp/doc/rule/saisoku-1.html
*.kawasaki.jp
*.kitakyushu.jp
*.kobe.jp
*.nagoya.jp
*.sapporo.jp
*.sendai.jp
*.yokohama.jp
!city.kawasaki.jp
!city.kitakyushu.jp
!city.kobe.jp
!city.nagoya.jp
!city.sapporo.jp
!city.sendai.jp
!city.yokohama.jp
// 4th level registration
aisai.aichi.jp
ama.aichi.jp
anjo.aichi.jp
asuke.aichi.jp
chiryu.aichi.jp
chita.aichi.jp
fuso.aichi.jp
gamagori.aichi.jp
handa.aichi.jp
hazu.aichi.jp
hekinan.aichi.jp
higashiura.aichi.jp
ichinomiya.aichi.jp
inazawa.aichi.jp
inuyama.aichi.jp
isshiki.aichi.jp
iwakura.aichi.jp
kanie.aichi.jp
kariya.aichi.jp
kasugai.aichi.jp
kira.aichi.jp
kiyosu.aichi.jp
komaki.aichi.jp
konan.aichi.jp
kota.aichi.jp
mihama.aichi.jp
miyoshi.aichi.jp
nishio.aichi.jp
nisshin.aichi.jp
obu.aichi.jp
oguchi.aichi.jp
oharu.aichi.jp
okazaki.aichi.jp
owariasahi.aichi.jp
seto.aichi.jp
shikatsu.aichi.jp
shinshiro.aichi.jp
shitara.aichi.jp
tahara.aichi.jp
takahama.aichi.jp
tobishima.aichi.jp
toei.aichi.jp
togo.aichi.jp
tokai.aichi.jp
tokoname.aichi.jp
toyoake.aichi.jp
toyohashi.aichi.jp
toyokawa.aichi.jp
toyone.aichi.jp
toyota.aichi.jp
tsushima.aichi.jp
yatomi.aichi.jp
akita.akita.jp
daisen.akita.jp
fujisato.akita.jp
gojome.akita.jp
hachirogata.akita.jp
happou.akita.jp
higashinaruse.akita.jp
honjo.akita.jp
honjyo.akita.jp
ikawa.akita.jp
kamikoani.akita.jp
kamioka.akita.jp
katagami.akita.jp
kazuno.akita.jp
kitaakita.akita.jp
kosaka.akita.jp
kyowa.akita.jp
misato.akita.jp
mitane.akita.jp
moriyoshi.akita.jp
nikaho.akita.jp
noshiro.akita.jp
odate.akita.jp
oga.akita.jp
ogata.akita.jp
semboku.akita.jp
yokote.akita.jp
yurihonjo.akita.jp
aomori.aomori.jp
gonohe.aomori.jp
hachinohe.aomori.jp
hashikami.aomori.jp
hiranai.aomori.jp
hirosaki.aomori.jp
itayanagi.aomori.jp
kuroishi.aomori.jp
misawa.aomori.jp
mutsu.aomori.jp
nakadomari.aomori.jp
noheji.aomori.jp
oirase.aomori.jp
owani.aomori.jp
rokunohe.aomori.jp
sannohe.aomori.jp
shichinohe.aomori.jp
shingo.aomori.jp
takko.aomori.jp
towada.aomori.jp
tsugaru.aomori.jp
tsuruta.aomori.jp
abiko.chiba.jp
asahi.chiba.jp
chonan.chiba.jp
chosei.chiba.jp
choshi.chiba.jp
chuo.chiba.jp
funabashi.chiba.jp
futtsu.chiba.jp
hanamigawa.chiba.jp
ichihara.chiba.jp
ichikawa.chiba.jp
ichinomiya.chiba.jp
inzai.chiba.jp
isumi.chiba.jp
kamagaya.chiba.jp
kamogawa.chiba.jp
kashiwa.chiba.jp
katori.chiba.jp
katsuura.chiba.jp
kimitsu.chiba.jp
kisarazu.chiba.jp
kozaki.chiba.jp
kujukuri.chiba.jp
kyonan.chiba.jp
matsudo.chiba.jp
midori.chiba.jp
mihama.chiba.jp
minamiboso.chiba.jp
mobara.chiba.jp
mutsuzawa.chiba.jp
nagara.chiba.jp
nagareyama.chiba.jp
narashino.chiba.jp
narita.chiba.jp
noda.chiba.jp
oamishirasato.chiba.jp
omigawa.chiba.jp
onjuku.chiba.jp
otaki.chiba.jp
sakae.chiba.jp
sakura.chiba.jp
shimofusa.chiba.jp
shirako.chiba.jp
shiroi.chiba.jp
shisui.chiba.jp
sodegaura.chiba.jp
sosa.chiba.jp
tako.chiba.jp
tateyama.chiba.jp
togane.chiba.jp
tohnosho.chiba.jp
tomisato.chiba.jp
urayasu.chiba.jp
yachimata.chiba.jp
yachiyo.chiba.jp
yokaichiba.chiba.jp
yokoshibahikari.chiba.jp
yotsukaido.chiba.jp
ainan.ehime.jp
honai.ehime.jp
ikata.ehime.jp
imabari.ehime.jp
iyo.ehime.jp
kamijima.ehime.jp
kihoku.ehime.jp
kumakogen.ehime.jp
masaki.ehime.jp
matsuno.ehime.jp
matsuyama.ehime.jp
namikata.ehime.jp
niihama.ehime.jp
ozu.ehime.jp
saijo.ehime.jp
seiyo.ehime.jp
shikokuchuo.ehime.jp
tobe.ehime.jp
toon.ehime.jp
uchiko.ehime.jp
uwajima.ehime.jp
yawatahama.ehime.jp
echizen.fukui.jp
eiheiji.fukui.jp
fukui.fukui.jp
ikeda.fukui.jp
katsuyama.fukui.jp
mihama.fukui.jp
minamiechizen.fukui.jp
obama.fukui.jp
ohi.fukui.jp
ono.fukui.jp
sabae.fukui.jp
sakai.fukui.jp
takahama.fukui.jp
tsuruga.fukui.jp
wakasa.fukui.jp
ashiya.fukuoka.jp
buzen.fukuoka.jp
chikugo.fukuoka.jp
chikuho.fukuoka.jp
chikujo.fukuoka.jp
chikushino.fukuoka.jp
chikuzen.fukuoka.jp
chuo.fukuoka.jp
dazaifu.fukuoka.jp
fukuchi.fukuoka.jp
hakata.fukuoka.jp
higashi.fukuoka.jp
hirokawa.fukuoka.jp
hisayama.fukuoka.jp
iizuka.fukuoka.jp
inatsuki.fukuoka.jp
kaho.fukuoka.jp
kasuga.fukuoka.jp
kasuya.fukuoka.jp
kawara.fukuoka.jp
keisen.fukuoka.jp
koga.fukuoka.jp
kurate.fukuoka.jp
kurogi.fukuoka.jp
kurume.fukuoka.jp
minami.fukuoka.jp
miyako.fukuoka.jp
miyama.fukuoka.jp
miyawaka.fukuoka.jp
mizumaki.fukuoka.jp
munakata.fukuoka.jp
nakagawa.fukuoka.jp
nakama.fukuoka.jp
nishi.fukuoka.jp
nogata.fukuoka.jp
ogori.fukuoka.jp
okagaki.fukuoka.jp
okawa.fukuoka.jp
oki.fukuoka.jp
omuta.fukuoka.jp
onga.fukuoka.jp
onojo.fukuoka.jp
oto.fukuoka.jp
saigawa.fukuoka.jp
sasaguri.fukuoka.jp
shingu.fukuoka.jp
shinyoshitomi.fukuoka.jp
shonai.fukuoka.jp
soeda.fukuoka.jp
sue.fukuoka.jp
tachiarai.fukuoka.jp
tagawa.fukuoka.jp
takata.fukuoka.jp
toho.fukuoka.jp
toyotsu.fukuoka.jp
tsuiki.fukuoka.jp
ukiha.fukuoka.jp
umi.fukuoka.jp
usui.fukuoka.jp
yamada.fukuoka.jp
yame.fukuoka.jp
yanagawa.fukuoka.jp
yukuhashi.fukuoka.jp
aizubange.fukushima.jp
aizumisato.fukushima.jp
aizuwakamatsu.fukushima.jp
asakawa.fukushima.jp
bandai.fukushima.jp
date.fukushima.jp
fukushima.fukushima.jp
furudono.fukushima.jp
futaba.fukushima.jp
hanawa.fukushima.jp
higashi.fukushima.jp
hirata.fukushima.jp
hirono.fukushima.jp
iitate.fukushima.jp
inawashiro.fukushima.jp
ishikawa.fukushima.jp
iwaki.fukushima.jp
izumizaki.fukushima.jp
kagamiishi.fukushima.jp
kaneyama.fukushima.jp
kawamata.fukushima.jp
kitakata.fukushima.jp
kitashiobara.fukushima.jp
koori.fukushima.jp
koriyama.fukushima.jp
kunimi.fukushima.jp
miharu.fukushima.jp
mishima.fukushima.jp
namie.fukushima.jp
nango.fukushima.jp
nishiaizu.fukushima.jp
nishigo.fukushima.jp
okuma.fukushima.jp
omotego.fukushima.jp
ono.fukushima.jp
otama.fukushima.jp
samegawa.fukushima.jp
shimogo.fukushima.jp
shirakawa.fukushima.jp
showa.fukushima.jp
soma.fukushima.jp
sukagawa.fukushima.jp
taishin.fukushima.jp
tamakawa.fukushima.jp
tanagura.fukushima.jp
tenei.fukushima.jp
yabuki.fukushima.jp
yamato.fukushima.jp
yamatsuri.fukushima.jp
yanaizu.fukushima.jp
yugawa.fukushima.jp
anpachi.gifu.jp
ena.gifu.jp
gifu.gifu.jp
ginan.gifu.jp
godo.gifu.jp
gujo.gifu.jp
hashima.gifu.jp
hichiso.gifu.jp
hida.gifu.jp
higashishirakawa.gifu.jp
ibigawa.gifu.jp
ikeda.gifu.jp
kakamigahara.gifu.jp
kani.gifu.jp
kasahara.gifu.jp
kasamatsu.gifu.jp
kawaue.gifu.jp
kitagata.gifu.jp
mino.gifu.jp
minokamo.gifu.jp
mitake.gifu.jp
mizunami.gifu.jp
motosu.gifu.jp
nakatsugawa.gifu.jp
ogaki.gifu.jp
sakahogi.gifu.jp
seki.gifu.jp
sekigahara.gifu.jp
shirakawa.gifu.jp
tajimi.gifu.jp
takayama.gifu.jp
tarui.gifu.jp
toki.gifu.jp
tomika.gifu.jp
wanouchi.gifu.jp
yamagata.gifu.jp
yaotsu.gifu.jp
yoro.gifu.jp
annaka.gunma.jp
chiyoda.gunma.jp
fujioka.gunma.jp
higashiagatsuma.gunma.jp
isesaki.gunma.jp
itakura.gunma.jp
kanna.gunma.jp
kanra.gunma.jp
katashina.gunma.jp
kawaba.gunma.jp
kiryu.gunma.jp
kusatsu.gunma.jp
maebashi.gunma.jp
meiwa.gunma.jp
midori.gunma.jp
minakami.gunma.jp
naganohara.gunma.jp
nakanojo.gunma.jp
nanmoku.gunma.jp
numata.gunma.jp
oizumi.gunma.jp
ora.gunma.jp
ota.gunma.jp
shibukawa.gunma.jp
shimonita.gunma.jp
shinto.gunma.jp
showa.gunma.jp
takasaki.gunma.jp
takayama.gunma.jp
tamamura.gunma.jp
tatebayashi.gunma.jp
tomioka.gunma.jp
tsukiyono.gunma.jp
tsumagoi.gunma.jp
ueno.gunma.jp
yoshioka.gunma.jp
asaminami.hiroshima.jp
daiwa.hiroshima.jp
etajima.hiroshima.jp
fuchu.hiroshima.jp
fukuyama.hiroshima.jp
hatsukaichi.hiroshima.jp
higashihiroshima.hiroshima.jp
hongo.hiroshima.jp
jinsekikogen.hiroshima.jp
kaita.hiroshima.jp
kui.hiroshima.jp
kumano.hiroshima.jp
kure.hiroshima.jp
mihara.hiroshima.jp
miyoshi.hiroshima.jp
naka.hiroshima.jp
onomichi.hiroshima.jp
osakikamijima.hiroshima.jp
otake.hiroshima.jp
saka.hiroshima.jp
sera.hiroshima.jp
seranishi.hiroshima.jp
shinichi.hiroshima.jp
shobara.hiroshima.jp
takehara.hiroshima.jp
abashiri.hokkaido.jp
abira.hokkaido.jp
aibetsu.hokkaido.jp
akabira.hokkaido.jp
akkeshi.hokkaido.jp
asahikawa.hokkaido.jp
ashibetsu.hokkaido.jp
ashoro.hokkaido.jp
assabu.hokkaido.jp
atsuma.hokkaido.jp
bibai.hokkaido.jp
biei.hokkaido.jp
bifuka.hokkaido.jp
bihoro.hokkaido.jp
biratori.hokkaido.jp
chippubetsu.hokkaido.jp
chitose.hokkaido.jp
date.hokkaido.jp
ebetsu.hokkaido.jp
embetsu.hokkaido.jp
eniwa.hokkaido.jp
erimo.hokkaido.jp
esan.hokkaido.jp
esashi.hokkaido.jp
fukagawa.hokkaido.jp
fukushima.hokkaido.jp
furano.hokkaido.jp
furubira.hokkaido.jp
haboro.hokkaido.jp
hakodate.hokkaido.jp
hamatonbetsu.hokkaido.jp
hidaka.hokkaido.jp
higashikagura.hokkaido.jp
higashikawa.hokkaido.jp
hiroo.hokkaido.jp
hokuryu.hokkaido.jp
hokuto.hokkaido.jp
honbetsu.hokkaido.jp
horokanai.hokkaido.jp
horonobe.hokkaido.jp
ikeda.hokkaido.jp
imakane.hokkaido.jp
ishikari.hokkaido.jp
iwamizawa.hokkaido.jp
iwanai.hokkaido.jp
kamifurano.hokkaido.jp
kamikawa.hokkaido.jp
kamishihoro.hokkaido.jp
kamisunagawa.hokkaido.jp
kamoenai.hokkaido.jp
kayabe.hokkaido.jp
kembuchi.hokkaido.jp
kikonai.hokkaido.jp
kimobetsu.hokkaido.jp
kitahiroshima.hokkaido.jp
kitami.hokkaido.jp
kiyosato.hokkaido.jp
koshimizu.hokkaido.jp
kunneppu.hokkaido.jp
kuriyama.hokkaido.jp
kuromatsunai.hokkaido.jp
kushiro.hokkaido.jp
kutchan.hokkaido.jp
kyowa.hokkaido.jp
mashike.hokkaido.jp
matsumae.hokkaido.jp
mikasa.hokkaido.jp
minamifurano.hokkaido.jp
mombetsu.hokkaido.jp
moseushi.hokkaido.jp
mukawa.hokkaido.jp
muroran.hokkaido.jp
naie.hokkaido.jp
nakagawa.hokkaido.jp
nakasatsunai.hokkaido.jp
nakatombetsu.hokkaido.jp
nanae.hokkaido.jp
nanporo.hokkaido.jp
nayoro.hokkaido.jp
nemuro.hokkaido.jp
niikappu.hokkaido.jp
niki.hokkaido.jp
nishiokoppe.hokkaido.jp
noboribetsu.hokkaido.jp
numata.hokkaido.jp
obihiro.hokkaido.jp
obira.hokkaido.jp
oketo.hokkaido.jp
okoppe.hokkaido.jp
otaru.hokkaido.jp
otobe.hokkaido.jp
otofuke.hokkaido.jp
otoineppu.hokkaido.jp
oumu.hokkaido.jp
ozora.hokkaido.jp
pippu.hokkaido.jp
rankoshi.hokkaido.jp
rebun.hokkaido.jp
rikubetsu.hokkaido.jp
rishiri.hokkaido.jp
rishirifuji.hokkaido.jp
saroma.hokkaido.jp
sarufutsu.hokkaido.jp
shakotan.hokkaido.jp
shari.hokkaido.jp
shibecha.hokkaido.jp
shibetsu.hokkaido.jp
shikabe.hokkaido.jp
shikaoi.hokkaido.jp
shimamaki.hokkaido.jp
shimizu.hokkaido.jp
shimokawa.hokkaido.jp
shinshinotsu.hokkaido.jp
shintoku.hokkaido.jp
shiranuka.hokkaido.jp
shiraoi.hokkaido.jp
shiriuchi.hokkaido.jp
sobetsu.hokkaido.jp
sunagawa.hokkaido.jp
taiki.hokkaido.jp
takasu.hokkaido.jp
takikawa.hokkaido.jp
takinoue.hokkaido.jp
teshikaga.hokkaido.jp
tobetsu.hokkaido.jp
tohma.hokkaido.jp
tomakomai.hokkaido.jp
tomari.hokkaido.jp
toya.hokkaido.jp
toyako.hokkaido.jp
toyotomi.hokkaido.jp
toyoura.hokkaido.jp
tsubetsu.hokkaido.jp
tsukigata.hokkaido.jp
urakawa.hokkaido.jp
urausu.hokkaido.jp
uryu.hokkaido.jp
utashinai.hokkaido.jp
wakkanai.hokkaido.jp
wassamu.hokkaido.jp
yakumo.hokkaido.jp
yoichi.hokkaido.jp
aioi.hyogo.jp
akashi.hyogo.jp
ako.hyogo.jp
amagasaki.hyogo.jp
aogaki.hyogo.jp
asago.hyogo.jp
ashiya.hyogo.jp
awaji.hyogo.jp
fukusaki.hyogo.jp
goshiki.hyogo.jp
harima.hyogo.jp
himeji.hyogo.jp
ichikawa.hyogo.jp
inagawa.hyogo.jp
itami.hyogo.jp
kakogawa.hyogo.jp
kamigori.hyogo.jp
kamikawa.hyogo.jp
kasai.hyogo.jp
kasuga.hyogo.jp
kawanishi.hyogo.jp
miki.hyogo.jp
minamiawaji.hyogo.jp
nishinomiya.hyogo.jp
nishiwaki.hyogo.jp
ono.hyogo.jp
sanda.hyogo.jp
sannan.hyogo.jp
sasayama.hyogo.jp
sayo.hyogo.jp
shingu.hyogo.jp
shinonsen.hyogo.jp
shiso.hyogo.jp
sumoto.hyogo.jp
taishi.hyogo.jp
taka.hyogo.jp
takarazuka.hyogo.jp
takasago.hyogo.jp
takino.hyogo.jp
tamba.hyogo.jp
tatsuno.hyogo.jp
toyooka.hyogo.jp
yabu.hyogo.jp
yashiro.hyogo.jp
yoka.hyogo.jp
yokawa.hyogo.jp
ami.ibaraki.jp
asahi.ibaraki.jp
bando.ibaraki.jp
chikusei.ibaraki.jp
daigo.ibaraki.jp
fujishiro.ibaraki.jp
hitachi.ibaraki.jp
hitachinaka.ibaraki.jp
hitachiomiya.ibaraki.jp
hitachiota.ibaraki.jp
ibaraki.ibaraki.jp
ina.ibaraki.jp
inashiki.ibaraki.jp
itako.ibaraki.jp
iwama.ibaraki.jp
joso.ibaraki.jp
kamisu.ibaraki.jp
kasama.ibaraki.jp
kashima.ibaraki.jp
kasumigaura.ibaraki.jp
koga.ibaraki.jp
miho.ibaraki.jp
mito.ibaraki.jp
moriya.ibaraki.jp
naka.ibaraki.jp
namegata.ibaraki.jp
oarai.ibaraki.jp
ogawa.ibaraki.jp
omitama.ibaraki.jp
ryugasaki.ibaraki.jp
sakai.ibaraki.jp
sakuragawa.ibaraki.jp
shimodate.ibaraki.jp
shimotsuma.ibaraki.jp
shirosato.ibaraki.jp
sowa.ibaraki.jp
suifu.ibaraki.jp
takahagi.ibaraki.jp
tamatsukuri.ibaraki.jp
tokai.ibaraki.jp
tomobe.ibaraki.jp
tone.ibaraki.jp
toride.ibaraki.jp
tsuchiura.ibaraki.jp
tsukuba.ibaraki.jp
uchihara.ibaraki.jp
ushiku.ibaraki.jp
yachiyo.ibaraki.jp
yamagata.ibaraki.jp
yawara.ibaraki.jp
yuki.ibaraki.jp
anamizu.ishikawa.jp
hakui.ishikawa.jp
hakusan.ishikawa.jp
kaga.ishikawa.jp
kahoku.ishikawa.jp
kanazawa.ishikawa.jp
kawakita.ishikawa.jp
komatsu.ishikawa.jp
nakanoto.ishikawa.jp
nanao.ishikawa.jp
nomi.ishikawa.jp
nonoichi.ishikawa.jp
noto.ishikawa.jp
shika.ishikawa.jp
suzu.ishikawa.jp
tsubata.ishikawa.jp
tsurugi.ishikawa.jp
uchinada.ishikawa.jp
wajima.ishikawa.jp
fudai.iwate.jp
fujisawa.iwate.jp
hanamaki.iwate.jp
hiraizumi.iwate.jp
hirono.iwate.jp
ichinohe.iwate.jp
ichinoseki.iwate.jp
iwaizumi.iwate.jp
iwate.iwate.jp
joboji.iwate.jp
kamaishi.iwate.jp
kanegasaki.iwate.jp
karumai.iwate.jp
kawai.iwate.jp
kitakami.iwate.jp
kuji.iwate.jp
kunohe.iwate.jp
kuzumaki.iwate.jp
miyako.iwate.jp
mizusawa.iwate.jp
morioka.iwate.jp
ninohe.iwate.jp
noda.iwate.jp
ofunato.iwate.jp
oshu.iwate.jp
otsuchi.iwate.jp
rikuzentakata.iwate.jp
shiwa.iwate.jp
shizukuishi.iwate.jp
sumita.iwate.jp
tanohata.iwate.jp
tono.iwate.jp
yahaba.iwate.jp
yamada.iwate.jp
ayagawa.kagawa.jp
higashikagawa.kagawa.jp
kanonji.kagawa.jp
kotohira.kagawa.jp
manno.kagawa.jp
marugame.kagawa.jp
mitoyo.kagawa.jp
naoshima.kagawa.jp
sanuki.kagawa.jp
tadotsu.kagawa.jp
takamatsu.kagawa.jp
tonosho.kagawa.jp
uchinomi.kagawa.jp
utazu.kagawa.jp
zentsuji.kagawa.jp
akune.kagoshima.jp
amami.kagoshima.jp
hioki.kagoshima.jp
isa.kagoshima.jp
isen.kagoshima.jp
izumi.kagoshima.jp
kagoshima.kagoshima.jp
kanoya.kagoshima.jp
kawanabe.kagoshima.jp
kinko.kagoshima.jp
kouyama.kagoshima.jp
makurazaki.kagoshima.jp
matsumoto.kagoshima.jp
minamitane.kagoshima.jp
nakatane.kagoshima.jp
nishinoomote.kagoshima.jp
satsumasendai.kagoshima.jp
soo.kagoshima.jp
tarumizu.kagoshima.jp
yusui.kagoshima.jp
aikawa.kanagawa.jp
atsugi.kanagawa.jp
ayase.kanagawa.jp
chigasaki.kanagawa.jp
ebina.kanagawa.jp
fujisawa.kanagawa.jp
hadano.kanagawa.jp
hakone.kanagawa.jp
hiratsuka.kanagawa.jp
isehara.kanagawa.jp
kaisei.kanagawa.jp
kamakura.kanagawa.jp
kiyokawa.kanagawa.jp
matsuda.kanagawa.jp
minamiashigara.kanagawa.jp
miura.kanagawa.jp
nakai.kanagawa.jp
ninomiya.kanagawa.jp
odawara.kanagawa.jp
oi.kanagawa.jp
oiso.kanagawa.jp
sagamihara.kanagawa.jp
samukawa.kanagawa.jp
tsukui.kanagawa.jp
yamakita.kanagawa.jp
yamato.kanagawa.jp
yokosuka.kanagawa.jp
yugawara.kanagawa.jp
zama.kanagawa.jp
zushi.kanagawa.jp
aki.kochi.jp
geisei.kochi.jp
hidaka.kochi.jp
higashitsuno.kochi.jp
ino.kochi.jp
kagami.kochi.jp
kami.kochi.jp
kitagawa.kochi.jp
kochi.kochi.jp
mihara.kochi.jp
motoyama.kochi.jp
muroto.kochi.jp
nahari.kochi.jp
nakamura.kochi.jp
nankoku.kochi.jp
nishitosa.kochi.jp
niyodogawa.kochi.jp
ochi.kochi.jp
okawa.kochi.jp
otoyo.kochi.jp
otsuki.kochi.jp
sakawa.kochi.jp
sukumo.kochi.jp
susaki.kochi.jp
tosa.kochi.jp
tosashimizu.kochi.jp
toyo.kochi.jp
tsuno.kochi.jp
umaji.kochi.jp
yasuda.kochi.jp
yusuhara.kochi.jp
amakusa.kumamoto.jp
arao.kumamoto.jp
aso.kumamoto.jp
choyo.kumamoto.jp
gyokuto.kumamoto.jp
kamiamakusa.kumamoto.jp
kikuchi.kumamoto.jp
kumamoto.kumamoto.jp
mashiki.kumamoto.jp
mifune.kumamoto.jp
minamata.kumamoto.jp
minamioguni.kumamoto.jp
nagasu.kumamoto.jp
nishihara.kumamoto.jp
oguni.kumamoto.jp
ozu.kumamoto.jp
sumoto.kumamoto.jp
takamori.kumamoto.jp
uki.kumamoto.jp
uto.kumamoto.jp
yamaga.kumamoto.jp
yamato.kumamoto.jp
yatsushiro.kumamoto.jp
ayabe.kyoto.jp
fukuchiyama.kyoto.jp
higashiyama.kyoto.jp
ide.kyoto.jp
ine.kyoto.jp
joyo.kyoto.jp
kameoka.kyoto.jp
kamo.kyoto.jp
kita.kyoto.jp
kizu.kyoto.jp
kumiyama.kyoto.jp
kyotamba.kyoto.jp
kyotanabe.kyoto.jp
kyotango.kyoto.jp
maizuru.kyoto.jp
minami.kyoto.jp
minamiyamashiro.kyoto.jp
miyazu.kyoto.jp
muko.kyoto.jp
nagaokakyo.kyoto.jp
nakagyo.kyoto.jp
nantan.kyoto.jp
oyamazaki.kyoto.jp
sakyo.kyoto.jp
seika.kyoto.jp
tanabe.kyoto.jp
uji.kyoto.jp
ujitawara.kyoto.jp
wazuka.kyoto.jp
yamashina.kyoto.jp
yawata.kyoto.jp
asahi.mie.jp
inabe.mie.jp
ise.mie.jp
kameyama.mie.jp
kawagoe.mie.jp
kiho.mie.jp
kisosaki.mie.jp
kiwa.mie.jp
komono.mie.jp
kumano.mie.jp
kuwana.mie.jp
matsusaka.mie.jp
meiwa.mie.jp
mihama.mie.jp
minamiise.mie.jp
misugi.mie.jp
miyama.mie.jp
nabari.mie.jp
shima.mie.jp
suzuka.mie.jp
tado.mie.jp
taiki.mie.jp
taki.mie.jp
tamaki.mie.jp
toba.mie.jp
tsu.mie.jp
udono.mie.jp
ureshino.mie.jp
watarai.mie.jp
yokkaichi.mie.jp
furukawa.miyagi.jp
higashimatsushima.miyagi.jp
ishinomaki.miyagi.jp
iwanuma.miyagi.jp
kakuda.miyagi.jp
kami.miyagi.jp
kawasaki.miyagi.jp
marumori.miyagi.jp
matsushima.miyagi.jp
minamisanriku.miyagi.jp
misato.miyagi.jp
murata.miyagi.jp
natori.miyagi.jp
ogawara.miyagi.jp
ohira.miyagi.jp
onagawa.miyagi.jp
osaki.miyagi.jp
rifu.miyagi.jp
semine.miyagi.jp
shibata.miyagi.jp
shichikashuku.miyagi.jp
shikama.miyagi.jp
shiogama.miyagi.jp
shiroishi.miyagi.jp
tagajo.miyagi.jp
taiwa.miyagi.jp
tome.miyagi.jp
tomiya.miyagi.jp
wakuya.miyagi.jp
watari.miyagi.jp
yamamoto.miyagi.jp
zao.miyagi.jp
aya.miyazaki.jp
ebino.miyazaki.jp
gokase.miyazaki.jp
hyuga.miyazaki.jp
kadogawa.miyazaki.jp
kawaminami.miyazaki.jp
kijo.miyazaki.jp
kitagawa.miyazaki.jp
kitakata.miyazaki.jp
kitaura.miyazaki.jp
kobayashi.miyazaki.jp
kunitomi.miyazaki.jp
kushima.miyazaki.jp
mimata.miyazaki.jp
miyakonojo.miyazaki.jp
miyazaki.miyazaki.jp
morotsuka.miyazaki.jp
nichinan.miyazaki.jp
nishimera.miyazaki.jp
nobeoka.miyazaki.jp
saito.miyazaki.jp
shiiba.miyazaki.jp
shintomi.miyazaki.jp
takaharu.miyazaki.jp
takanabe.miyazaki.jp
takazaki.miyazaki.jp
tsuno.miyazaki.jp
achi.nagano.jp
agematsu.nagano.jp
anan.nagano.jp
aoki.nagano.jp
asahi.nagano.jp
azumino.nagano.jp
chikuhoku.nagano.jp
chikuma.nagano.jp
chino.nagano.jp
fujimi.nagano.jp
hakuba.nagano.jp
hara.nagano.jp
hiraya.nagano.jp
iida.nagano.jp
iijima.nagano.jp
iiyama.nagano.jp
iizuna.nagano.jp
ikeda.nagano.jp
ikusaka.nagano.jp
ina.nagano.jp
karuizawa.nagano.jp
kawakami.nagano.jp
kiso.nagano.jp
kisofukushima.nagano.jp
kitaaiki.nagano.jp
komagane.nagano.jp
komoro.nagano.jp
matsukawa.nagano.jp
matsumoto.nagano.jp
miasa.nagano.jp
minamiaiki.nagano.jp
minamimaki.nagano.jp
minamiminowa.nagano.jp
minowa.nagano.jp
miyada.nagano.jp
miyota.nagano.jp
mochizuki.nagano.jp
nagano.nagano.jp
nagawa.nagano.jp
nagiso.nagano.jp
nakagawa.nagano.jp
nakano.nagano.jp
nozawaonsen.nagano.jp
obuse.nagano.jp
ogawa.nagano.jp
okaya.nagano.jp
omachi.nagano.jp
omi.nagano.jp
ookuwa.nagano.jp
ooshika.nagano.jp
otaki.nagano.jp
otari.nagano.jp
sakae.nagano.jp
sakaki.nagano.jp
saku.nagano.jp
sakuho.nagano.jp
shimosuwa.nagano.jp
shinanomachi.nagano.jp
shiojiri.nagano.jp
suwa.nagano.jp
suzaka.nagano.jp
takagi.nagano.jp
takamori.nagano.jp
takayama.nagano.jp
tateshina.nagano.jp
tatsuno.nagano.jp
togakushi.nagano.jp
togura.nagano.jp
tomi.nagano.jp
ueda.nagano.jp
wada.nagano.jp
yamagata.nagano.jp
yamanouchi.nagano.jp
yasaka.nagano.jp
yasuoka.nagano.jp
chijiwa.nagasaki.jp
futsu.nagasaki.jp
goto.nagasaki.jp
hasami.nagasaki.jp
hirado.nagasaki.jp
iki.nagasaki.jp
isahaya.nagasaki.jp
kawatana.nagasaki.jp
kuchinotsu.nagasaki.jp
matsuura.nagasaki.jp
nagasaki.nagasaki.jp
obama.nagasaki.jp
omura.nagasaki.jp
oseto.nagasaki.jp
saikai.nagasaki.jp
sasebo.nagasaki.jp
seihi.nagasaki.jp
shimabara.nagasaki.jp
shinkamigoto.nagasaki.jp
togitsu.nagasaki.jp
tsushima.nagasaki.jp
unzen.nagasaki.jp
ando.nara.jp
gose.nara.jp
heguri.nara.jp
higashiyoshino.nara.jp
ikaruga.nara.jp
ikoma.nara.jp
kamikitayama.nara.jp
kanmaki.nara.jp
kashiba.nara.jp
kashihara.nara.jp
katsuragi.nara.jp
kawai.nara.jp
kawakami.nara.jp
kawanishi.nara.jp
koryo.nara.jp
kurotaki.nara.jp
mitsue.nara.jp
miyake.nara.jp
nara.nara.jp
nosegawa.nara.jp
oji.nara.jp
ouda.nara.jp
oyodo.nara.jp
sakurai.nara.jp
sango.nara.jp
shimoichi.nara.jp
shimokitayama.nara.jp
shinjo.nara.jp
soni.nara.jp
takatori.nara.jp
tawaramoto.nara.jp
tenkawa.nara.jp
tenri.nara.jp
uda.nara.jp
yamatokoriyama.nara.jp
yamatotakada.nara.jp
yamazoe.nara.jp
yoshino.nara.jp
aga.niigata.jp
agano.niigata.jp
gosen.niigata.jp
itoigawa.niigata.jp
izumozaki.niigata.jp
joetsu.niigata.jp
kamo.niigata.jp
kariwa.niigata.jp
kashiwazaki.niigata.jp
minamiuonuma.niigata.jp
mitsuke.niigata.jp
muika.niigata.jp
murakami.niigata.jp
myoko.niigata.jp
nagaoka.niigata.jp
niigata.niigata.jp
ojiya.niigata.jp
omi.niigata.jp
sado.niigata.jp
sanjo.niigata.jp
seiro.niigata.jp
seirou.niigata.jp
sekikawa.niigata.jp
shibata.niigata.jp
tagami.niigata.jp
tainai.niigata.jp
tochio.niigata.jp
tokamachi.niigata.jp
tsubame.niigata.jp
tsunan.niigata.jp
uonuma.niigata.jp
yahiko.niigata.jp
yoita.niigata.jp
yuzawa.niigata.jp
beppu.oita.jp
bungoono.oita.jp
bungotakada.oita.jp
hasama.oita.jp
hiji.oita.jp
himeshima.oita.jp
hita.oita.jp
kamitsue.oita.jp
kokonoe.oita.jp
kuju.oita.jp
kunisaki.oita.jp
kusu.oita.jp
oita.oita.jp
saiki.oita.jp
taketa.oita.jp
tsukumi.oita.jp
usa.oita.jp
usuki.oita.jp
yufu.oita.jp
akaiwa.okayama.jp
asakuchi.okayama.jp
bizen.okayama.jp
hayashima.okayama.jp
ibara.okayama.jp
kagamino.okayama.jp
kasaoka.okayama.jp
kibichuo.okayama.jp
kumenan.okayama.jp
kurashiki.okayama.jp
maniwa.okayama.jp
misaki.okayama.jp
nagi.okayama.jp
niimi.okayama.jp
nishiawakura.okayama.jp
okayama.okayama.jp
satosho.okayama.jp
setouchi.okayama.jp
shinjo.okayama.jp
shoo.okayama.jp
soja.okayama.jp
takahashi.okayama.jp
tamano.okayama.jp
tsuyama.okayama.jp
wake.okayama.jp
yakage.okayama.jp
aguni.okinawa.jp
ginowan.okinawa.jp
ginoza.okinawa.jp
gushikami.okinawa.jp
haebaru.okinawa.jp
higashi.okinawa.jp
hirara.okinawa.jp
iheya.okinawa.jp
ishigaki.okinawa.jp
ishikawa.okinawa.jp
itoman.okinawa.jp
izena.okinawa.jp
kadena.okinawa.jp
kin.okinawa.jp
kitadaito.okinawa.jp
kitanakagusuku.okinawa.jp
kumejima.okinawa.jp
kunigami.okinawa.jp
minamidaito.okinawa.jp
motobu.okinawa.jp
nago.okinawa.jp
naha.okinawa.jp
nakagusuku.okinawa.jp
nakijin.okinawa.jp
nanjo.okinawa.jp
nishihara.okinawa.jp
ogimi.okinawa.jp
okinawa.okinawa.jp
onna.okinawa.jp
shimoji.okinawa.jp
taketomi.okinawa.jp
tarama.okinawa.jp
tokashiki.okinawa.jp
tomigusuku.okinawa.jp
tonaki.okinawa.jp
urasoe.okinawa.jp
uruma.okinawa.jp
yaese.okinawa.jp
yomitan.okinawa.jp
yonabaru.okinawa.jp
yonaguni.okinawa.jp
zamami.okinawa.jp
abeno.osaka.jp
chihayaakasaka.osaka.jp
chuo.osaka.jp
daito.osaka.jp
fujiidera.osaka.jp
habikino.osaka.jp
hannan.osaka.jp
higashiosaka.osaka.jp
higashisumiyoshi.osaka.jp
higashiyodogawa.osaka.jp
hirakata.osaka.jp
ibaraki.osaka.jp
ikeda.osaka.jp
izumi.osaka.jp
izumiotsu.osaka.jp
izumisano.osaka.jp
kadoma.osaka.jp
kaizuka.osaka.jp
kanan.osaka.jp
kashiwara.osaka.jp
katano.osaka.jp
kawachinagano.osaka.jp
kishiwada.osaka.jp
kita.osaka.jp
kumatori.osaka.jp
matsubara.osaka.jp
minato.osaka.jp
minoh.osaka.jp
misaki.osaka.jp
moriguchi.osaka.jp
neyagawa.osaka.jp
nishi.osaka.jp
nose.osaka.jp
osakasayama.osaka.jp
sakai.osaka.jp
sayama.osaka.jp
sennan.osaka.jp
settsu.osaka.jp
shijonawate.osaka.jp
shimamoto.osaka.jp
suita.osaka.jp
tadaoka.osaka.jp
taishi.osaka.jp
tajiri.osaka.jp
takaishi.osaka.jp
takatsuki.osaka.jp
tondabayashi.osaka.jp
toyonaka.osaka.jp
toyono.osaka.jp
yao.osaka.jp
ariake.saga.jp
arita.saga.jp
fukudomi.saga.jp
genkai.saga.jp
hamatama.saga.jp
hizen.saga.jp
imari.saga.jp
kamimine.saga.jp
kanzaki.saga.jp
karatsu.saga.jp
kashima.saga.jp
kitagata.saga.jp
kitahata.saga.jp
kiyama.saga.jp
kouhoku.saga.jp
kyuragi.saga.jp
nishiarita.saga.jp
ogi.saga.jp
omachi.saga.jp
ouchi.saga.jp
saga.saga.jp
shiroishi.saga.jp
taku.saga.jp
tara.saga.jp
tosu.saga.jp
yoshinogari.saga.jp
arakawa.saitama.jp
asaka.saitama.jp
chichibu.saitama.jp
fujimi.saitama.jp
fujimino.saitama.jp
fukaya.saitama.jp
hanno.saitama.jp
hanyu.saitama.jp
hasuda.saitama.jp
hatogaya.saitama.jp
hatoyama.saitama.jp
hidaka.saitama.jp
higashichichibu.saitama.jp
higashimatsuyama.saitama.jp
honjo.saitama.jp
ina.saitama.jp
iruma.saitama.jp
iwatsuki.saitama.jp
kamiizumi.saitama.jp
kamikawa.saitama.jp
kamisato.saitama.jp
kasukabe.saitama.jp
kawagoe.saitama.jp
kawaguchi.saitama.jp
kawajima.saitama.jp
kazo.saitama.jp
kitamoto.saitama.jp
koshigaya.saitama.jp
kounosu.saitama.jp
kuki.saitama.jp
kumagaya.saitama.jp
matsubushi.saitama.jp
minano.saitama.jp
misato.saitama.jp
miyashiro.saitama.jp
miyoshi.saitama.jp
moroyama.saitama.jp
nagatoro.saitama.jp
namegawa.saitama.jp
niiza.saitama.jp
ogano.saitama.jp
ogawa.saitama.jp
ogose.saitama.jp
okegawa.saitama.jp
omiya.saitama.jp
otaki.saitama.jp
ranzan.saitama.jp
ryokami.saitama.jp
saitama.saitama.jp
sakado.saitama.jp
satte.saitama.jp
sayama.saitama.jp
shiki.saitama.jp
shiraoka.saitama.jp
soka.saitama.jp
sugito.saitama.jp
toda.saitama.jp
tokigawa.saitama.jp
tokorozawa.saitama.jp
tsurugashima.saitama.jp
urawa.saitama.jp
warabi.saitama.jp
yashio.saitama.jp
yokoze.saitama.jp
yono.saitama.jp
yorii.saitama.jp
yoshida.saitama.jp
yoshikawa.saitama.jp
yoshimi.saitama.jp
aisho.shiga.jp
gamo.shiga.jp
higashiomi.shiga.jp
hikone.shiga.jp
koka.shiga.jp
konan.shiga.jp
kosei.shiga.jp
koto.shiga.jp
kusatsu.shiga.jp
maibara.shiga.jp
moriyama.shiga.jp
nagahama.shiga.jp
nishiazai.shiga.jp
notogawa.shiga.jp
omihachiman.shiga.jp
otsu.shiga.jp
ritto.shiga.jp
ryuoh.shiga.jp
takashima.shiga.jp
takatsuki.shiga.jp
torahime.shiga.jp
toyosato.shiga.jp
yasu.shiga.jp
akagi.shimane.jp
ama.shimane.jp
gotsu.shimane.jp
hamada.shimane.jp
higashiizumo.shimane.jp
hikawa.shimane.jp
hikimi.shimane.jp
izumo.shimane.jp
kakinoki.shimane.jp
masuda.shimane.jp
matsue.shimane.jp
misato.shimane.jp
nishinoshima.shimane.jp
ohda.shimane.jp
okinoshima.shimane.jp
okuizumo.shimane.jp
shimane.shimane.jp
tamayu.shimane.jp
tsuwano.shimane.jp
unnan.shimane.jp
yakumo.shimane.jp
yasugi.shimane.jp
yatsuka.shimane.jp
arai.shizuoka.jp
atami.shizuoka.jp
fuji.shizuoka.jp
fujieda.shizuoka.jp
fujikawa.shizuoka.jp
fujinomiya.shizuoka.jp
fukuroi.shizuoka.jp
gotemba.shizuoka.jp
haibara.shizuoka.jp
hamamatsu.shizuoka.jp
higashiizu.shizuoka.jp
ito.shizuoka.jp
iwata.shizuoka.jp
izu.shizuoka.jp
izunokuni.shizuoka.jp
kakegawa.shizuoka.jp
kannami.shizuoka.jp
kawanehon.shizuoka.jp
kawazu.shizuoka.jp
kikugawa.shizuoka.jp
kosai.shizuoka.jp
makinohara.shizuoka.jp
matsuzaki.shizuoka.jp
minamiizu.shizuoka.jp
mishima.shizuoka.jp
morimachi.shizuoka.jp
nishiizu.shizuoka.jp
numazu.shizuoka.jp
omaezaki.shizuoka.jp
shimada.shizuoka.jp
shimizu.shizuoka.jp
shimoda.shizuoka.jp
shizuoka.shizuoka.jp
susono.shizuoka.jp
yaizu.shizuoka.jp
yoshida.shizuoka.jp
ashikaga.tochigi.jp
bato.tochigi.jp
haga.tochigi.jp
ichikai.tochigi.jp
iwafune.tochigi.jp
kaminokawa.tochigi.jp
kanuma.tochigi.jp
karasuyama.tochigi.jp
kuroiso.tochigi.jp
mashiko.tochigi.jp
mibu.tochigi.jp
moka.tochigi.jp
motegi.tochigi.jp
nasu.tochigi.jp
nasushiobara.tochigi.jp
nikko.tochigi.jp
nishikata.tochigi.jp
nogi.tochigi.jp
ohira.tochigi.jp
ohtawara.tochigi.jp
oyama.tochigi.jp
sakura.tochigi.jp
sano.tochigi.jp
shimotsuke.tochigi.jp
shioya.tochigi.jp
takanezawa.tochigi.jp
tochigi.tochigi.jp
tsuga.tochigi.jp
ujiie.tochigi.jp
utsunomiya.tochigi.jp
yaita.tochigi.jp
aizumi.tokushima.jp
anan.tokushima.jp
ichiba.tokushima.jp
itano.tokushima.jp
kainan.tokushima.jp
komatsushima.tokushima.jp
matsushige.tokushima.jp
mima.tokushima.jp
minami.tokushima.jp
miyoshi.tokushima.jp
mugi.tokushima.jp
nakagawa.tokushima.jp
naruto.tokushima.jp
sanagochi.tokushima.jp
shishikui.tokushima.jp
tokushima.tokushima.jp
wajiki.tokushima.jp
adachi.tokyo.jp
akiruno.tokyo.jp
akishima.tokyo.jp
aogashima.tokyo.jp
arakawa.tokyo.jp
bunkyo.tokyo.jp
chiyoda.tokyo.jp
chofu.tokyo.jp
chuo.tokyo.jp
edogawa.tokyo.jp
fuchu.tokyo.jp
fussa.tokyo.jp
hachijo.tokyo.jp
hachioji.tokyo.jp
hamura.tokyo.jp
higashikurume.tokyo.jp
higashimurayama.tokyo.jp
higashiyamato.tokyo.jp
hino.tokyo.jp
hinode.tokyo.jp
hinohara.tokyo.jp
inagi.tokyo.jp
itabashi.tokyo.jp
katsushika.tokyo.jp
kita.tokyo.jp
kiyose.tokyo.jp
kodaira.tokyo.jp
koganei.tokyo.jp
kokubunji.tokyo.jp
komae.tokyo.jp
koto.tokyo.jp
kouzushima.tokyo.jp
kunitachi.tokyo.jp
machida.tokyo.jp
meguro.tokyo.jp
minato.tokyo.jp
mitaka.tokyo.jp
mizuho.tokyo.jp
musashimurayama.tokyo.jp
musashino.tokyo.jp
nakano.tokyo.jp
nerima.tokyo.jp
ogasawara.tokyo.jp
okutama.tokyo.jp
ome.tokyo.jp
oshima.tokyo.jp
ota.tokyo.jp
setagaya.tokyo.jp
shibuya.tokyo.jp
shinagawa.tokyo.jp
shinjuku.tokyo.jp
suginami.tokyo.jp
sumida.tokyo.jp
tachikawa.tokyo.jp
taito.tokyo.jp
tama.tokyo.jp
toshima.tokyo.jp
chizu.tottori.jp
hino.tottori.jp
kawahara.tottori.jp
koge.tottori.jp
kotoura.tottori.jp
misasa.tottori.jp
nanbu.tottori.jp
nichinan.tottori.jp
sakaiminato.tottori.jp
tottori.tottori.jp
wakasa.tottori.jp
yazu.tottori.jp
yonago.tottori.jp
asahi.toyama.jp
fuchu.toyama.jp
fukumitsu.toyama.jp
funahashi.toyama.jp
himi.toyama.jp
imizu.toyama.jp
inami.toyama.jp
johana.toyama.jp
kamiichi.toyama.jp
kurobe.toyama.jp
nakaniikawa.toyama.jp
namerikawa.toyama.jp
nanto.toyama.jp
nyuzen.toyama.jp
oyabe.toyama.jp
taira.toyama.jp
takaoka.toyama.jp
tateyama.toyama.jp
toga.toyama.jp
tonami.toyama.jp
toyama.toyama.jp
unazuki.toyama.jp
uozu.toyama.jp
yamada.toyama.jp
arida.wakayama.jp
aridagawa.wakayama.jp
gobo.wakayama.jp
hashimoto.wakayama.jp
hidaka.wakayama.jp
hirogawa.wakayama.jp
inami.wakayama.jp
iwade.wakayama.jp
kainan.wakayama.jp
kamitonda.wakayama.jp
katsuragi.wakayama.jp
kimino.wakayama.jp
kinokawa.wakayama.jp
kitayama.wakayama.jp
koya.wakayama.jp
koza.wakayama.jp
kozagawa.wakayama.jp
kudoyama.wakayama.jp
kushimoto.wakayama.jp
mihama.wakayama.jp
misato.wakayama.jp
nachikatsuura.wakayama.jp
shingu.wakayama.jp
shirahama.wakayama.jp
taiji.wakayama.jp
tanabe.wakayama.jp
wakayama.wakayama.jp
yuasa.wakayama.jp
yura.wakayama.jp
asahi.yamagata.jp
funagata.yamagata.jp
higashine.yamagata.jp
iide.yamagata.jp
kahoku.yamagata.jp
kaminoyama.yamagata.jp
kaneyama.yamagata.jp
kawanishi.yamagata.jp
mamurogawa.yamagata.jp
mikawa.yamagata.jp
murayama.yamagata.jp
nagai.yamagata.jp
nakayama.yamagata.jp
nanyo.yamagata.jp
nishikawa.yamagata.jp
obanazawa.yamagata.jp
oe.yamagata.jp
oguni.yamagata.jp
ohkura.yamagata.jp
oishida.yamagata.jp
sagae.yamagata.jp
sakata.yamagata.jp
sakegawa.yamagata.jp
shinjo.yamagata.jp
shirataka.yamagata.jp
shonai.yamagata.jp
takahata.yamagata.jp
tendo.yamagata.jp
tozawa.yamagata.jp
tsuruoka.yamagata.jp
yamagata.yamagata.jp
yamanobe.yamagata.jp
yonezawa.yamagata.jp
yuza.yamagata.jp
abu.yamaguchi.jp
hagi.yamaguchi.jp
hikari.yamaguchi.jp
hofu.yamaguchi.jp
iwakuni.yamaguchi.jp
kudamatsu.yamaguchi.jp
mitou.yamaguchi.jp
nagato.yamaguchi.jp
oshima.yamaguchi.jp
shimonoseki.yamaguchi.jp
shunan.yamaguchi.jp
tabuse.yamaguchi.jp
tokuyama.yamaguchi.jp
toyota.yamaguchi.jp
ube.yamaguchi.jp
yuu.yamaguchi.jp
chuo.yamanashi.jp
doshi.yamanashi.jp
fuefuki.yamanashi.jp
fujikawa.yamanashi.jp
fujikawaguchiko.yamanashi.jp
fujiyoshida.yamanashi.jp
hayakawa.yamanashi.jp
hokuto.yamanashi.jp
ichikawamisato.yamanashi.jp
kai.yamanashi.jp
kofu.yamanashi.jp
koshu.yamanashi.jp
kosuge.yamanashi.jp
minami-alps.yamanashi.jp
minobu.yamanashi.jp
nakamichi.yamanashi.jp
nanbu.yamanashi.jp
narusawa.yamanashi.jp
nirasaki.yamanashi.jp
nishikatsura.yamanashi.jp
oshino.yamanashi.jp
otsuki.yamanashi.jp
showa.yamanashi.jp
tabayama.yamanashi.jp
tsuru.yamanashi.jp
uenohara.yamanashi.jp
yamanakako.yamanashi.jp
yamanashi.yamanashi.jp

// ke : http://www.kenic.or.ke/index.php/en/ke-domains/ke-domains
ke
ac.ke
co.ke
go.ke
info.ke
me.ke
mobi.ke
ne.ke
or.ke
sc.ke

// kg : http://www.domain.kg/dmn_n.html
kg
org.kg
net.kg
com.kg
edu.kg
gov.kg
mil.kg

// kh : http://www.mptc.gov.kh/dns_registration.htm
*.kh

// ki : http://www.ki/dns/index.html
ki
edu.ki
biz.ki
net.ki
org.ki
gov.ki
info.ki
com.ki

// km : https://en.wikipedia.org/wiki/.km
// http://www.domaine.km/documents/charte.doc
km
org.km
nom.km
gov.km
prd.km
tm.km
edu.km
mil.km
ass.km
com.km
// These are only mentioned as proposed suggestions at domaine.km, but
// https://en.wikipedia.org/wiki/.km says they're available for registration:
coop.km
asso.km
presse.km
medecin.km
notaires.km
pharmaciens.km
veterinaire.km
gouv.km

// kn : https://en.wikipedia.org/wiki/.kn
// http://www.dot.kn/domainRules.html
kn
net.kn
org.kn
edu.kn
gov.kn

// kp : http://www.kcce.kp/en_index.php
kp
com.kp
edu.kp
gov.kp
org.kp
rep.kp
tra.kp

// kr : https://en.wikipedia.org/wiki/.kr
// see also: http://domain.nida.or.kr/eng/registration.jsp
kr
ac.kr
co.kr
es.kr
go.kr
hs.kr
kg.kr
mil.kr
ms.kr
ne.kr
or.kr
pe.kr
re.kr
sc.kr
// kr geographical names
busan.kr
chungbuk.kr
chungnam.kr
daegu.kr
daejeon.kr
gangwon.kr
gwangju.kr
gyeongbuk.kr
gyeonggi.kr
gyeongnam.kr
incheon.kr
jeju.kr
jeonbuk.kr
jeonnam.kr
seoul.kr
ulsan.kr

// kw : https://www.nic.kw/policies/
// Confirmed by registry <nic.tech@citra.gov.kw>
kw
com.kw
edu.kw
emb.kw
gov.kw
ind.kw
net.kw
org.kw

// ky : http://www.icta.ky/da_ky_reg_dom.php
// Confirmed by registry <kysupport@perimeterusa.com> 2008-06-17
ky
com.ky
edu.ky
net.ky
org.ky

// kz : https://en.wikipedia.org/wiki/.kz
// see also: http://www.nic.kz/rules/index.jsp
kz
org.kz
edu.kz
net.kz
gov.kz
mil.kz
com.kz

// la : https://en.wikipedia.org/wiki/.la
// Submitted by registry <gavin.brown@nic.la>
la
int.la
net.la
info.la
edu.la
gov.la
per.la
com.la
org.la

// lb : https://en.wikipedia.org/wiki/.lb
// Submitted by registry <randy@psg.com>
lb
com.lb
edu.lb
gov.lb
net.lb
org.lb

// lc : https://en.wikipedia.org/wiki/.lc
// see also: http://www.nic.lc/rules.htm
lc
com.lc
net.lc
co.lc
org.lc
edu.lc
gov.lc

// li : https://en.wikipedia.org/wiki/.li
li

// lk : https://www.nic.lk/index.php/domain-registration/lk-domain-naming-structure
lk
gov.lk
sch.lk
net.lk
int.lk
com.lk
org.lk
edu.lk
ngo.lk
soc.lk
web.lk
ltd.lk
assn.lk
grp.lk
hotel.lk
ac.lk

// lr : http://psg.com/dns/lr/lr.txt
// Submitted by registry <randy@psg.com>
lr
com.lr
edu.lr
gov.lr
org.lr
net.lr

// ls : http://www.nic.ls/
// Confirmed by registry <lsadmin@nic.ls>
ls
ac.ls
biz.ls
co.ls
edu.ls
gov.ls
info.ls
net.ls
org.ls
sc.ls

// lt : https://en.wikipedia.org/wiki/.lt
lt
// gov.lt : http://www.gov.lt/index_en.php
gov.lt

// lu : http://www.dns.lu/en/
lu

// lv : http://www.nic.lv/DNS/En/generic.php
lv
com.lv
edu.lv
gov.lv
org.lv
mil.lv
id.lv
net.lv
asn.lv
conf.lv

// ly : http://www.nic.ly/regulations.php
ly
com.ly
net.ly
gov.ly
plc.ly
edu.ly
sch.ly
med.ly
org.ly
id.ly

// ma : https://en.wikipedia.org/wiki/.ma
// http://www.anrt.ma/fr/admin/download/upload/file_fr782.pdf
ma
co.ma
net.ma
gov.ma
org.ma
ac.ma
press.ma

// mc : http://www.nic.mc/
mc
tm.mc
asso.mc

// md : https://en.wikipedia.org/wiki/.md
md

// me : https://en.wikipedia.org/wiki/.me
me
co.me
net.me
org.me
edu.me
ac.me
gov.me
its.me
priv.me

// mg : http://nic.mg/nicmg/?page_id=39
mg
org.mg
nom.mg
gov.mg
prd.mg
tm.mg
edu.mg
mil.mg
com.mg
co.mg

// mh : https://en.wikipedia.org/wiki/.mh
mh

// mil : https://en.wikipedia.org/wiki/.mil
mil

// mk : https://en.wikipedia.org/wiki/.mk
// see also: http://dns.marnet.net.mk/postapka.php
mk
com.mk
org.mk
net.mk
edu.mk
gov.mk
inf.mk
name.mk

// ml : http://www.gobin.info/domainname/ml-template.doc
// see also: https://en.wikipedia.org/wiki/.ml
ml
com.ml
edu.ml
gouv.ml
gov.ml
net.ml
org.ml
presse.ml

// mm : https://en.wikipedia.org/wiki/.mm
*.mm

// mn : https://en.wikipedia.org/wiki/.mn
mn
gov.mn
edu.mn
org.mn

// mo : http://www.monic.net.mo/
mo
com.mo
net.mo
org.mo
edu.mo
gov.mo

// mobi : https://en.wikipedia.org/wiki/.mobi
mobi

// mp : http://www.dot.mp/
// Confirmed by registry <dcamacho@saipan.com> 2008-06-17
mp

// mq : https://en.wikipedia.org/wiki/.mq
mq

// mr : https://en.wikipedia.org/wiki/.mr
mr
gov.mr

// ms : http://www.nic.ms/pdf/MS_Domain_Name_Rules.pdf
ms
com.ms
edu.ms
gov.ms
net.ms
org.ms

// mt : https://www.nic.org.mt/go/policy
// Submitted by registry <help@nic.org.mt>
mt
com.mt
edu.mt
net.mt
org.mt

// mu : https://en.wikipedia.org/wiki/.mu
mu
com.mu
net.mu
org.mu
gov.mu
ac.mu
co.mu
or.mu

// museum : https://welcome.museum/wp-content/uploads/2018/05/20180525-Registration-Policy-MUSEUM-EN_VF-2.pdf https://welcome.museum/buy-your-dot-museum-2/
museum

// mv : https://en.wikipedia.org/wiki/.mv
// "mv" included because, contra Wikipedia, google.mv exists.
mv
aero.mv
biz.mv
com.mv
coop.mv
edu.mv
gov.mv
info.mv
int.mv
mil.mv
museum.mv
name.mv
net.mv
org.mv
pro.mv

// mw : http://www.registrar.mw/
mw
ac.mw
biz.mw
co.mw
com.mw
coop.mw
edu.mw
gov.mw
int.mw
museum.mw
net.mw
org.mw

// mx : http://www.nic.mx/
// Submitted by registry <farias@nic.mx>
mx
com.mx
org.mx
gob.mx
edu.mx
net.mx

// my : http://www.mynic.my/
// Available strings: https://mynic.my/resources/domains/buying-a-domain/
my
biz.my
com.my
edu.my
gov.my
mil.my
name.my
net.my
org.my

// mz : http://www.uem.mz/
// Submitted by registry <antonio@uem.mz>
mz
ac.mz
adv.mz
co.mz
edu.mz
gov.mz
mil.mz
net.mz
org.mz

// na : http://www.na-nic.com.na/
// http://www.info.na/domain/
na
info.na
pro.na
name.na
school.na
or.na
dr.na
us.na
mx.na
ca.na
in.na
cc.na
tv.na
ws.na
mobi.na
co.na
com.na
org.na

// name : has 2nd-level tlds, but there's no list of them
name

// nc : http://www.cctld.nc/
nc
asso.nc
nom.nc

// ne : https://en.wikipedia.org/wiki/.ne
ne

// net : https://en.wikipedia.org/wiki/.net
net

// nf : https://en.wikipedia.org/wiki/.nf
nf
com.nf
net.nf
per.nf
rec.nf
web.nf
arts.nf
firm.nf
info.nf
other.nf
store.nf

// ng : http://www.nira.org.ng/index.php/join-us/register-ng-domain/189-nira-slds
ng
com.ng
edu.ng
gov.ng
i.ng
mil.ng
mobi.ng
name.ng
net.ng
org.ng
sch.ng

// ni : http://www.nic.ni/
ni
ac.ni
biz.ni
co.ni
com.ni
edu.ni
gob.ni
in.ni
info.ni
int.ni
mil.ni
net.ni
nom.ni
org.ni
web.ni

// nl : https://en.wikipedia.org/wiki/.nl
//      https://www.sidn.nl/
//      ccTLD for the Netherlands
nl

// no : https://www.norid.no/en/om-domenenavn/regelverk-for-no/
// Norid geographical second level domains : https://www.norid.no/en/om-domenenavn/regelverk-for-no/vedlegg-b/
// Norid category second level domains : https://www.norid.no/en/om-domenenavn/regelverk-for-no/vedlegg-c/
// Norid category second-level domains managed by parties other than Norid : https://www.norid.no/en/om-domenenavn/regelverk-for-no/vedlegg-d/
// RSS feed: https://teknisk.norid.no/en/feed/
no
// Norid category second level domains : https://www.norid.no/en/om-domenenavn/regelverk-for-no/vedlegg-c/
fhs.no
vgs.no
fylkesbibl.no
folkebibl.no
museum.no
idrett.no
priv.no
// Norid category second-level domains managed by parties other than Norid : https://www.norid.no/en/om-domenenavn/regelverk-for-no/vedlegg-d/
mil.no
stat.no
dep.no
kommune.no
herad.no
// Norid geographical second level domains : https://www.norid.no/en/om-domenenavn/regelverk-for-no/vedlegg-b/
// counties
aa.no
ah.no
bu.no
fm.no
hl.no
hm.no
jan-mayen.no
mr.no
nl.no
nt.no
of.no
ol.no
oslo.no
rl.no
sf.no
st.no
svalbard.no
tm.no
tr.no
va.no
vf.no
// primary and lower secondary schools per county
gs.aa.no
gs.ah.no
gs.bu.no
gs.fm.no
gs.hl.no
gs.hm.no
gs.jan-mayen.no
gs.mr.no
gs.nl.no
gs.nt.no
gs.of.no
gs.ol.no
gs.oslo.no
gs.rl.no
gs.sf.no
gs.st.no
gs.svalbard.no
gs.tm.no
gs.tr.no
gs.va.no
gs.vf.no
// cities
akrehamn.no
åkrehamn.no
algard.no
ålgård.no
arna.no
brumunddal.no
bryne.no
bronnoysund.no
brønnøysund.no
drobak.no
drøbak.no
egersund.no
fetsund.no
floro.no
florø.no
fredrikstad.no
hokksund.no
honefoss.no
hønefoss.no
jessheim.no
jorpeland.no
jørpeland.no
kirkenes.no
kopervik.no
krokstadelva.no
langevag.no
langevåg.no
leirvik.no
mjondalen.no
mjøndalen.no
mo-i-rana.no
mosjoen.no
mosjøen.no
nesoddtangen.no
orkanger.no
osoyro.no
osøyro.no
raholt.no
råholt.no
sandnessjoen.no
sandnessjøen.no
skedsmokorset.no
slattum.no
spjelkavik.no
stathelle.no
stavern.no
stjordalshalsen.no
stjørdalshalsen.no
tananger.no
tranby.no
vossevangen.no
// communities
afjord.no
åfjord.no
agdenes.no
al.no
ål.no
alesund.no
ålesund.no
alstahaug.no
alta.no
áltá.no
alaheadju.no
álaheadju.no
alvdal.no
amli.no
åmli.no
amot.no
åmot.no
andebu.no
andoy.no
andøy.no
andasuolo.no
ardal.no
årdal.no
aremark.no
arendal.no
ås.no
aseral.no
åseral.no
asker.no
askim.no
askvoll.no
askoy.no
askøy.no
asnes.no
åsnes.no
audnedaln.no
aukra.no
aure.no
aurland.no
aurskog-holand.no
aurskog-høland.no
austevoll.no
austrheim.no
averoy.no
averøy.no
balestrand.no
ballangen.no
balat.no
bálát.no
balsfjord.no
bahccavuotna.no
báhccavuotna.no
bamble.no
bardu.no
beardu.no
beiarn.no
bajddar.no
bájddar.no
baidar.no
báidár.no
berg.no
bergen.no
berlevag.no
berlevåg.no
bearalvahki.no
bearalváhki.no
bindal.no
birkenes.no
bjarkoy.no
bjarkøy.no
bjerkreim.no
bjugn.no
bodo.no
bodø.no
badaddja.no
bådåddjå.no
budejju.no
bokn.no
bremanger.no
bronnoy.no
brønnøy.no
bygland.no
bykle.no
barum.no
bærum.no
bo.telemark.no
bø.telemark.no
bo.nordland.no
bø.nordland.no
bievat.no
bievát.no
bomlo.no
bømlo.no
batsfjord.no
båtsfjord.no
bahcavuotna.no
báhcavuotna.no
dovre.no
drammen.no
drangedal.no
dyroy.no
dyrøy.no
donna.no
dønna.no
eid.no
eidfjord.no
eidsberg.no
eidskog.no
eidsvoll.no
eigersund.no
elverum.no
enebakk.no
engerdal.no
etne.no
etnedal.no
evenes.no
evenassi.no
evenášši.no
evje-og-hornnes.no
farsund.no
fauske.no
fuossko.no
fuoisku.no
fedje.no
fet.no
finnoy.no
finnøy.no
fitjar.no
fjaler.no
fjell.no
flakstad.no
flatanger.no
flekkefjord.no
flesberg.no
flora.no
fla.no
flå.no
folldal.no
forsand.no
fosnes.no
frei.no
frogn.no
froland.no
frosta.no
frana.no
fræna.no
froya.no
frøya.no
fusa.no
fyresdal.no
forde.no
førde.no
gamvik.no
gangaviika.no
gáŋgaviika.no
gaular.no
gausdal.no
gildeskal.no
gildeskål.no
giske.no
gjemnes.no
gjerdrum.no
gjerstad.no
gjesdal.no
gjovik.no
gjøvik.no
gloppen.no
gol.no
gran.no
grane.no
granvin.no
gratangen.no
grimstad.no
grong.no
kraanghke.no
kråanghke.no
grue.no
gulen.no
hadsel.no
halden.no
halsa.no
hamar.no
hamaroy.no
habmer.no
hábmer.no
hapmir.no
hápmir.no
hammerfest.no
hammarfeasta.no
hámmárfeasta.no
haram.no
hareid.no
harstad.no
hasvik.no
aknoluokta.no
ákŋoluokta.no
hattfjelldal.no
aarborte.no
haugesund.no
hemne.no
hemnes.no
hemsedal.no
heroy.more-og-romsdal.no
herøy.møre-og-romsdal.no
heroy.nordland.no
herøy.nordland.no
hitra.no
hjartdal.no
hjelmeland.no
hobol.no
hobøl.no
hof.no
hol.no
hole.no
holmestrand.no
holtalen.no
holtålen.no
hornindal.no
horten.no
hurdal.no
hurum.no
hvaler.no
hyllestad.no
hagebostad.no
hægebostad.no
hoyanger.no
høyanger.no
hoylandet.no
høylandet.no
ha.no
hå.no
ibestad.no
inderoy.no
inderøy.no
iveland.no
jevnaker.no
jondal.no
jolster.no
jølster.no
karasjok.no
karasjohka.no
kárášjohka.no
karlsoy.no
galsa.no
gálsá.no
karmoy.no
karmøy.no
kautokeino.no
guovdageaidnu.no
klepp.no
klabu.no
klæbu.no
kongsberg.no
kongsvinger.no
kragero.no
kragerø.no
kristiansand.no
kristiansund.no
krodsherad.no
krødsherad.no
kvalsund.no
rahkkeravju.no
ráhkkerávju.no
kvam.no
kvinesdal.no
kvinnherad.no
kviteseid.no
kvitsoy.no
kvitsøy.no
kvafjord.no
kvæfjord.no
giehtavuoatna.no
kvanangen.no
kvænangen.no
navuotna.no
návuotna.no
kafjord.no
kåfjord.no
gaivuotna.no
gáivuotna.no
larvik.no
lavangen.no
lavagis.no
loabat.no
loabát.no
lebesby.no
davvesiida.no
leikanger.no
leirfjord.no
leka.no
leksvik.no
lenvik.no
leangaviika.no
leaŋgaviika.no
lesja.no
levanger.no
lier.no
lierne.no
lillehammer.no
lillesand.no
lindesnes.no
lindas.no
lindås.no
lom.no
loppa.no
lahppi.no
láhppi.no
lund.no
lunner.no
luroy.no
lurøy.no
luster.no
lyngdal.no
lyngen.no
ivgu.no
lardal.no
lerdal.no
lærdal.no
lodingen.no
lødingen.no
lorenskog.no
lørenskog.no
loten.no
løten.no
malvik.no
masoy.no
måsøy.no
muosat.no
muosát.no
mandal.no
marker.no
marnardal.no
masfjorden.no
meland.no
meldal.no
melhus.no
meloy.no
meløy.no
meraker.no
meråker.no
moareke.no
moåreke.no
midsund.no
midtre-gauldal.no
modalen.no
modum.no
molde.no
moskenes.no
moss.no
mosvik.no
malselv.no
målselv.no
malatvuopmi.no
málatvuopmi.no
namdalseid.no
aejrie.no
namsos.no
namsskogan.no
naamesjevuemie.no
nååmesjevuemie.no
laakesvuemie.no
nannestad.no
narvik.no
narviika.no
naustdal.no
nedre-eiker.no
nes.akershus.no
nes.buskerud.no
nesna.no
nesodden.no
nesseby.no
unjarga.no
unjárga.no
nesset.no
nissedal.no
nittedal.no
nord-aurdal.no
nord-fron.no
nord-odal.no
norddal.no
nordkapp.no
davvenjarga.no
davvenjárga.no
nordre-land.no
nordreisa.no
raisa.no
ráisa.no
nore-og-uvdal.no
notodden.no
naroy.no
nærøy.no
notteroy.no
nøtterøy.no
odda.no
oksnes.no
øksnes.no
oppdal.no
oppegard.no
oppegård.no
orkdal.no
orland.no
ørland.no
orskog.no
ørskog.no
orsta.no
ørsta.no
os.hedmark.no
os.hordaland.no
osen.no
osteroy.no
osterøy.no
ostre-toten.no
østre-toten.no
overhalla.no
ovre-eiker.no
øvre-eiker.no
oyer.no
øyer.no
oygarden.no
øygarden.no
oystre-slidre.no
øystre-slidre.no
porsanger.no
porsangu.no
porsáŋgu.no
porsgrunn.no
radoy.no
radøy.no
rakkestad.no
rana.no
ruovat.no
randaberg.no
rauma.no
rendalen.no
rennebu.no
rennesoy.no
rennesøy.no
rindal.no
ringebu.no
ringerike.no
ringsaker.no
rissa.no
risor.no
risør.no
roan.no
rollag.no
rygge.no
ralingen.no
rælingen.no
rodoy.no
rødøy.no
romskog.no
rømskog.no
roros.no
røros.no
rost.no
røst.no
royken.no
røyken.no
royrvik.no
røyrvik.no
rade.no
råde.no
salangen.no
siellak.no
saltdal.no
salat.no
sálát.no
sálat.no
samnanger.no
sande.more-og-romsdal.no
sande.møre-og-romsdal.no
sande.vestfold.no
sandefjord.no
sandnes.no
sandoy.no
sandøy.no
sarpsborg.no
sauda.no
sauherad.no
sel.no
selbu.no
selje.no
seljord.no
sigdal.no
siljan.no
sirdal.no
skaun.no
skedsmo.no
ski.no
skien.no
skiptvet.no
skjervoy.no
skjervøy.no
skierva.no
skiervá.no
skjak.no
skjåk.no
skodje.no
skanland.no
skånland.no
skanit.no
skánit.no
smola.no
smøla.no
snillfjord.no
snasa.no
snåsa.no
snoasa.no
snaase.no
snåase.no
sogndal.no
sokndal.no
sola.no
solund.no
songdalen.no
sortland.no
spydeberg.no
stange.no
stavanger.no
steigen.no
steinkjer.no
stjordal.no
stjørdal.no
stokke.no
stor-elvdal.no
stord.no
stordal.no
storfjord.no
omasvuotna.no
strand.no
stranda.no
stryn.no
sula.no
suldal.no
sund.no
sunndal.no
surnadal.no
sveio.no
svelvik.no
sykkylven.no
sogne.no
søgne.no
somna.no
sømna.no
sondre-land.no
søndre-land.no
sor-aurdal.no
sør-aurdal.no
sor-fron.no
sør-fron.no
sor-odal.no
sør-odal.no
sor-varanger.no
sør-varanger.no
matta-varjjat.no
mátta-várjjat.no
sorfold.no
sørfold.no
sorreisa.no
sørreisa.no
sorum.no
sørum.no
tana.no
deatnu.no
time.no
tingvoll.no
tinn.no
tjeldsund.no
dielddanuorri.no
tjome.no
tjøme.no
tokke.no
tolga.no
torsken.no
tranoy.no
tranøy.no
tromso.no
tromsø.no
tromsa.no
romsa.no
trondheim.no
troandin.no
trysil.no
trana.no
træna.no
trogstad.no
trøgstad.no
tvedestrand.no
tydal.no
tynset.no
tysfjord.no
divtasvuodna.no
divttasvuotna.no
tysnes.no
tysvar.no
tysvær.no
tonsberg.no
tønsberg.no
ullensaker.no
ullensvang.no
ulvik.no
utsira.no
vadso.no
vadsø.no
cahcesuolo.no
čáhcesuolo.no
vaksdal.no
valle.no
vang.no
vanylven.no
vardo.no
vardø.no
varggat.no
várggát.no
vefsn.no
vaapste.no
vega.no
vegarshei.no
vegårshei.no
vennesla.no
verdal.no
verran.no
vestby.no
vestnes.no
vestre-slidre.no
vestre-toten.no
vestvagoy.no
vestvågøy.no
vevelstad.no
vik.no
vikna.no
vindafjord.no
volda.no
voss.no
varoy.no
værøy.no
vagan.no
vågan.no
voagat.no
vagsoy.no
vågsøy.no
vaga.no
vågå.no
valer.ostfold.no
våler.østfold.no
valer.hedmark.no
våler.hedmark.no

// np : http://www.mos.com.np/register.html
*.np

// nr : http://cenpac.net.nr/dns/index.html
// Submitted by registry <technician@cenpac.net.nr>
nr
biz.nr
info.nr
gov.nr
edu.nr
org.nr
net.nr
com.nr

// nu : https://en.wikipedia.org/wiki/.nu
nu

// nz : https://en.wikipedia.org/wiki/.nz
// Submitted by registry <jay@nzrs.net.nz>
nz
ac.nz
co.nz
cri.nz
geek.nz
gen.nz
govt.nz
health.nz
iwi.nz
kiwi.nz
maori.nz
mil.nz
māori.nz
net.nz
org.nz
parliament.nz
school.nz

// om : https://en.wikipedia.org/wiki/.om
om
co.om
com.om
edu.om
gov.om
med.om
museum.om
net.om
org.om
pro.om

// onion : https://tools.ietf.org/html/rfc7686
onion

// org : https://en.wikipedia.org/wiki/.org
org

// pa : http://www.nic.pa/
// Some additional second level "domains" resolve directly as hostnames, such as
// pannet.pa, so we add a rule for "pa".
pa
ac.pa
gob.pa
com.pa
org.pa
sld.pa
edu.pa
net.pa
ing.pa
abo.pa
med.pa
nom.pa

// pe : https://www.nic.pe/InformeFinalComision.pdf
pe
edu.pe
gob.pe
nom.pe
mil.pe
org.pe
com.pe
net.pe

// pf : http://www.gobin.info/domainname/formulaire-pf.pdf
pf
com.pf
org.pf
edu.pf

// pg : https://en.wikipedia.org/wiki/.pg
*.pg

// ph : http://www.domains.ph/FAQ2.asp
// Submitted by registry <jed@email.com.ph>
ph
com.ph
net.ph
org.ph
gov.ph
edu.ph
ngo.ph
mil.ph
i.ph

// pk : http://pk5.pknic.net.pk/pk5/msgNamepk.PK
pk
com.pk
net.pk
edu.pk
org.pk
fam.pk
biz.pk
web.pk
gov.pk
gob.pk
gok.pk
gon.pk
gop.pk
gos.pk
info.pk

// pl http://www.dns.pl/english/index.html
// Submitted by registry
pl
com.pl
net.pl
org.pl
// pl functional domains (http://www.dns.pl/english/index.html)
aid.pl
agro.pl
atm.pl
auto.pl
biz.pl
edu.pl
gmina.pl
gsm.pl
info.pl
mail.pl
miasta.pl
media.pl
mil.pl
nieruchomosci.pl
nom.pl
pc.pl
powiat.pl
priv.pl
realestate.pl
rel.pl
sex.pl
shop.pl
sklep.pl
sos.pl
szkola.pl
targi.pl
tm.pl
tourism.pl
travel.pl
turystyka.pl
// Government domains
gov.pl
ap.gov.pl
griw.gov.pl
ic.gov.pl
is.gov.pl
kmpsp.gov.pl
konsulat.gov.pl
kppsp.gov.pl
kwp.gov.pl
kwpsp.gov.pl
mup.gov.pl
mw.gov.pl
oia.gov.pl
oirm.gov.pl
oke.gov.pl
oow.gov.pl
oschr.gov.pl
oum.gov.pl
pa.gov.pl
pinb.gov.pl
piw.gov.pl
po.gov.pl
pr.gov.pl
psp.gov.pl
psse.gov.pl
pup.gov.pl
rzgw.gov.pl
sa.gov.pl
sdn.gov.pl
sko.gov.pl
so.gov.pl
sr.gov.pl
starostwo.gov.pl
ug.gov.pl
ugim.gov.pl
um.gov.pl
umig.gov.pl
upow.gov.pl
uppo.gov.pl
us.gov.pl
uw.gov.pl
uzs.gov.pl
wif.gov.pl
wiih.gov.pl
winb.gov.pl
wios.gov.pl
witd.gov.pl
wiw.gov.pl
wkz.gov.pl
wsa.gov.pl
wskr.gov.pl
wsse.gov.pl
wuoz.gov.pl
wzmiuw.gov.pl
zp.gov.pl
zpisdn.gov.pl
// pl regional domains (http://www.dns.pl/english/index.html)
augustow.pl
babia-gora.pl
bedzin.pl
beskidy.pl
bialowieza.pl
bialystok.pl
bielawa.pl
bieszczady.pl
boleslawiec.pl
bydgoszcz.pl
bytom.pl
cieszyn.pl
czeladz.pl
czest.pl
dlugoleka.pl
elblag.pl
elk.pl
glogow.pl
gniezno.pl
gorlice.pl
grajewo.pl
ilawa.pl
jaworzno.pl
jelenia-gora.pl
jgora.pl
kalisz.pl
kazimierz-dolny.pl
karpacz.pl
kartuzy.pl
kaszuby.pl
katowice.pl
kepno.pl
ketrzyn.pl
klodzko.pl
kobierzyce.pl
kolobrzeg.pl
konin.pl
konskowola.pl
kutno.pl
lapy.pl
lebork.pl
legnica.pl
lezajsk.pl
limanowa.pl
lomza.pl
lowicz.pl
lubin.pl
lukow.pl
malbork.pl
malopolska.pl
mazowsze.pl
mazury.pl
mielec.pl
mielno.pl
mragowo.pl
naklo.pl
nowaruda.pl
nysa.pl
olawa.pl
olecko.pl
olkusz.pl
olsztyn.pl
opoczno.pl
opole.pl
ostroda.pl
ostroleka.pl
ostrowiec.pl
ostrowwlkp.pl
pila.pl
pisz.pl
podhale.pl
podlasie.pl
polkowice.pl
pomorze.pl
pomorskie.pl
prochowice.pl
pruszkow.pl
przeworsk.pl
pulawy.pl
radom.pl
rawa-maz.pl
rybnik.pl
rzeszow.pl
sanok.pl
sejny.pl
slask.pl
slupsk.pl
sosnowiec.pl
stalowa-wola.pl
skoczow.pl
starachowice.pl
stargard.pl
suwalki.pl
swidnica.pl
swiebodzin.pl
swinoujscie.pl
szczecin.pl
szczytno.pl
tarnobrzeg.pl
tgory.pl
turek.pl
tychy.pl
ustka.pl
walbrzych.pl
warmia.pl
warszawa.pl
waw.pl
wegrow.pl
wielun.pl
wlocl.pl
wloclawek.pl
wodzislaw.pl
wolomin.pl
wroclaw.pl
zachpomor.pl
zagan.pl
zarow.pl
zgora.pl
zgorzelec.pl

// pm : https://www.afnic.fr/wp-media/uploads/2022/12/afnic-naming-policy-2023-01-01.pdf
pm

// pn : http://www.government.pn/PnRegistry/policies.htm
pn
gov.pn
co.pn
org.pn
edu.pn
net.pn

// post : https://en.wikipedia.org/wiki/.post
post

// pr : http://www.nic.pr/index.asp?f=1
pr
com.pr
net.pr
org.pr
gov.pr
edu.pr
isla.pr
pro.pr
biz.pr
info.pr
name.pr
// these aren't mentioned on nic.pr, but on https://en.wikipedia.org/wiki/.pr
est.pr
prof.pr
ac.pr

// pro : http://registry.pro/get-pro
pro
aaa.pro
aca.pro
acct.pro
avocat.pro
bar.pro
cpa.pro
eng.pro
jur.pro
law.pro
med.pro
recht.pro

// ps : https://en.wikipedia.org/wiki/.ps
// http://www.nic.ps/registration/policy.html#reg
ps
edu.ps
gov.ps
sec.ps
plo.ps
com.ps
org.ps
net.ps

// pt : https://www.dns.pt/en/domain/pt-terms-and-conditions-registration-rules/
pt
net.pt
gov.pt
org.pt
edu.pt
int.pt
publ.pt
com.pt
nome.pt

// pw : https://en.wikipedia.org/wiki/.pw
pw
co.pw
ne.pw
or.pw
ed.pw
go.pw
belau.pw

// py : http://www.nic.py/pautas.html#seccion_9
// Submitted by registry
py
com.py
coop.py
edu.py
gov.py
mil.py
net.py
org.py

// qa : http://domains.qa/en/
qa
com.qa
edu.qa
gov.qa
mil.qa
name.qa
net.qa
org.qa
sch.qa

// re : https://www.afnic.fr/wp-media/uploads/2022/12/afnic-naming-policy-2023-01-01.pdf
re
asso.re
com.re
nom.re

// ro : http://www.rotld.ro/
ro
arts.ro
com.ro
firm.ro
info.ro
nom.ro
nt.ro
org.ro
rec.ro
store.ro
tm.ro
www.ro

// rs : https://www.rnids.rs/en/domains/national-domains
rs
ac.rs
co.rs
edu.rs
gov.rs
in.rs
org.rs

// ru : https://cctld.ru/files/pdf/docs/en/rules_ru-rf.pdf
// Submitted by George Georgievsky <gug@cctld.ru>
ru

// rw : https://www.ricta.org.rw/sites/default/files/resources/registry_registrar_contract_0.pdf
rw
ac.rw
co.rw
coop.rw
gov.rw
mil.rw
net.rw
org.rw

// sa : http://www.nic.net.sa/
sa
com.sa
net.sa
org.sa
gov.sa
med.sa
pub.sa
edu.sa
sch.sa

// sb : http://www.sbnic.net.sb/
// Submitted by registry <lee.humphries@telekom.com.sb>
sb
com.sb
edu.sb
gov.sb
net.sb
org.sb

// sc : http://www.nic.sc/
sc
com.sc
gov.sc
net.sc
org.sc
edu.sc

// sd : http://www.isoc.sd/sudanic.isoc.sd/billing_pricing.htm
// Submitted by registry <admin@isoc.sd>
sd
com.sd
net.sd
org.sd
edu.sd
med.sd
tv.sd
gov.sd
info.sd

// se : https://en.wikipedia.org/wiki/.se
// Submitted by registry <patrik.wallstrom@iis.se>
se
a.se
ac.se
b.se
bd.se
brand.se
c.se
d.se
e.se
f.se
fh.se
fhsk.se
fhv.se
g.se
h.se
i.se
k.se
komforb.se
kommunalforbund.se
komvux.se
l.se
lanbib.se
m.se
n.se
naturbruksgymn.se
o.se
org.se
p.se
parti.se
pp.se
press.se
r.se
s.se
t.se
tm.se
u.se
w.se
x.se
y.se
z.se

// sg : http://www.nic.net.sg/page/registration-policies-procedures-and-guidelines
sg
com.sg
net.sg
org.sg
gov.sg
edu.sg
per.sg

// sh : http://nic.sh/rules.htm
sh
com.sh
net.sh
gov.sh
org.sh
mil.sh

// si : https://en.wikipedia.org/wiki/.si
si

// sj : No registrations at this time.
// Submitted by registry <jarle@uninett.no>
sj

// sk : https://en.wikipedia.org/wiki/.sk
// list of 2nd level domains ?
sk

// sl : http://www.nic.sl
// Submitted by registry <adam@neoip.com>
sl
com.sl
net.sl
edu.sl
gov.sl
org.sl

// sm : https://en.wikipedia.org/wiki/.sm
sm

// sn : https://en.wikipedia.org/wiki/.sn
sn
art.sn
com.sn
edu.sn
gouv.sn
org.sn
perso.sn
univ.sn

// so : http://sonic.so/policies/
so
com.so
edu.so
gov.so
me.so
net.so
org.so

// sr : https://en.wikipedia.org/wiki/.sr
sr

// ss : https://registry.nic.ss/
// Submitted by registry <technical@nic.ss>
ss
biz.ss
com.ss
edu.ss
gov.ss
me.ss
net.ss
org.ss
sch.ss

// st : http://www.nic.st/html/policyrules/
st
co.st
com.st
consulado.st
edu.st
embaixada.st
mil.st
net.st
org.st
principe.st
saotome.st
store.st

// su : https://en.wikipedia.org/wiki/.su
su

// sv : http://www.svnet.org.sv/niveldos.pdf
sv
com.sv
edu.sv
gob.sv
org.sv
red.sv

// sx : https://en.wikipedia.org/wiki/.sx
// Submitted by registry <jcvignes@openregistry.com>
sx
gov.sx

// sy : https://en.wikipedia.org/wiki/.sy
// see also: http://www.gobin.info/domainname/sy.doc
sy
edu.sy
gov.sy
net.sy
mil.sy
com.sy
org.sy

// sz : https://en.wikipedia.org/wiki/.sz
// http://www.sispa.org.sz/
sz
co.sz
ac.sz
org.sz

// tc : https://en.wikipedia.org/wiki/.tc
tc

// td : https://en.wikipedia.org/wiki/.td
td

// tel: https://en.wikipedia.org/wiki/.tel
// http://www.telnic.org/
tel

// tf : https://www.afnic.fr/wp-media/uploads/2022/12/afnic-naming-policy-2023-01-01.pdf
tf

// tg : https://en.wikipedia.org/wiki/.tg
// http://www.nic.tg/
tg

// th : https://en.wikipedia.org/wiki/.th
// Submitted by registry <krit@thains.co.th>
th
ac.th
co.th
go.th
in.th
mi.th
net.th
or.th

// tj : http://www.nic.tj/policy.html
tj
ac.tj
biz.tj
co.tj
com.tj
edu.tj
go.tj
gov.tj
int.tj
mil.tj
name.tj
net.tj
nic.tj
org.tj
test.tj
web.tj

// tk : https://en.wikipedia.org/wiki/.tk
tk

// tl : https://en.wikipedia.org/wiki/.tl
tl
gov.tl

// tm : http://www.nic.tm/local.html
tm
com.tm
co.tm
org.tm
net.tm
nom.tm
gov.tm
mil.tm
edu.tm

// tn : http://www.registre.tn/fr/
// https://whois.ati.tn/
tn
com.tn
ens.tn
fin.tn
gov.tn
ind.tn
info.tn
intl.tn
mincom.tn
nat.tn
net.tn
org.tn
perso.tn
tourism.tn

// to : https://en.wikipedia.org/wiki/.to
// Submitted by registry <egullich@colo.to>
to
com.to
gov.to
net.to
org.to
edu.to
mil.to

// tr : https://nic.tr/
// https://nic.tr/forms/eng/policies.pdf
// https://nic.tr/index.php?USRACTN=PRICELST
tr
av.tr
bbs.tr
bel.tr
biz.tr
com.tr
dr.tr
edu.tr
gen.tr
gov.tr
info.tr
mil.tr
k12.tr
kep.tr
name.tr
net.tr
org.tr
pol.tr
tel.tr
tsk.tr
tv.tr
web.tr
// Used by Northern Cyprus
nc.tr
// Used by government agencies of Northern Cyprus
gov.nc.tr

// tt : http://www.nic.tt/
tt
co.tt
com.tt
org.tt
net.tt
biz.tt
info.tt
pro.tt
int.tt
coop.tt
jobs.tt
mobi.tt
travel.tt
museum.tt
aero.tt
name.tt
gov.tt
edu.tt

// tv : https://en.wikipedia.org/wiki/.tv
// Not listing any 2LDs as reserved since none seem to exist in practice,
// Wikipedia notwithstanding.
tv

// tw : https://en.wikipedia.org/wiki/.tw
tw
edu.tw
gov.tw
mil.tw
com.tw
net.tw
org.tw
idv.tw
game.tw
ebiz.tw
club.tw
網路.tw
組織.tw
商業.tw

// tz : http://www.tznic.or.tz/index.php/domains
// Submitted by registry <manager@tznic.or.tz>
tz
ac.tz
co.tz
go.tz
hotel.tz
info.tz
me.tz
mil.tz
mobi.tz
ne.tz
or.tz
sc.tz
tv.tz

// ua : https://hostmaster.ua/policy/?ua
// Submitted by registry <dk@cctld.ua>
ua
// ua 2LD
com.ua
edu.ua
gov.ua
in.ua
net.ua
org.ua
// ua geographic names
// https://hostmaster.ua/2ld/
cherkassy.ua
cherkasy.ua
chernigov.ua
chernihiv.ua
chernivtsi.ua
chernovtsy.ua
ck.ua
cn.ua
cr.ua
crimea.ua
cv.ua
dn.ua
dnepropetrovsk.ua
dnipropetrovsk.ua
donetsk.ua
dp.ua
if.ua
ivano-frankivsk.ua
kh.ua
kharkiv.ua
kharkov.ua
kherson.ua
khmelnitskiy.ua
khmelnytskyi.ua
kiev.ua
kirovograd.ua
km.ua
kr.ua
kropyvnytskyi.ua
krym.ua
ks.ua
kv.ua
kyiv.ua
lg.ua
lt.ua
lugansk.ua
luhansk.ua
lutsk.ua
lv.ua
lviv.ua
mk.ua
mykolaiv.ua
nikolaev.ua
od.ua
odesa.ua
odessa.ua
pl.ua
poltava.ua
rivne.ua
rovno.ua
rv.ua
sb.ua
sebastopol.ua
sevastopol.ua
sm.ua
sumy.ua
te.ua
ternopil.ua
uz.ua
uzhgorod.ua
uzhhorod.ua
vinnica.ua
vinnytsia.ua
vn.ua
volyn.ua
yalta.ua
zakarpattia.ua
zaporizhzhe.ua
zaporizhzhia.ua
zhitomir.ua
zhytomyr.ua
zp.ua
zt.ua

// ug : https://www.registry.co.ug/
ug
co.ug
or.ug
ac.ug
sc.ug
go.ug
ne.ug
com.ug
org.ug

// uk : https://en.wikipedia.org/wiki/.uk
// Submitted by registry <Michael.Daly@nominet.org.uk>
uk
ac.uk
co.uk
gov.uk
ltd.uk
me.uk
net.uk
nhs.uk
org.uk
plc.uk
police.uk
*.sch.uk

// us : https://en.wikipedia.org/wiki/.us
us
dni.us
fed.us
isa.us
kids.us
nsn.us
// us geographic names
ak.us
al.us
ar.us
as.us
az.us
ca.us
co.us
ct.us
dc.us
de.us
fl.us
ga.us
gu.us
hi.us
ia.us
id.us
il.us
in.us
ks.us
ky.us
la.us
ma.us
md.us
me.us
mi.us
mn.us
mo.us
ms.us
mt.us
nc.us
nd.us
ne.us
nh.us
nj.us
nm.us
nv.us
ny.us
oh.us
ok.us
or.us
pa.us
pr.us
ri.us
sc.us
sd.us
tn.us
tx.us
ut.us
vi.us
vt.us
va.us
wa.us
wi.us
wv.us
wy.us
// The registrar notes several more specific domains available in each state,
// such as state.*.us, dst.*.us, etc., but resolution of these is somewhat
// haphazard; in some states these domains resolve as addresses, while in others
// only subdomains are available, or even nothing at all. We include the
// most common ones where it's clear that different sites are different
// entities.
k12.ak.us
k12.al.us
k12.ar.us
k12.as.us
k12.az.us
k12.ca.us
k12.co.us
k12.ct.us
k12.dc.us
k12.fl.us
k12.ga.us
k12.gu.us
// k12.hi.us  Bug 614565 - Hawaii has a state-wide DOE login
k12.ia.us
k12.id.us
k12.il.us
k12.in.us
k12.ks.us
k12.ky.us
k12.la.us
k12.ma.us
k12.md.us
k12.me.us
k12.mi.us
k12.mn.us
k12.mo.us
k12.ms.us
k12.mt.us
k12.nc.us
// k12.nd.us  Bug 1028347 - Removed at request of Travis Rosso <trossow@nd.gov>
k12.ne.us
k12.nh.us
k12.nj.us
k12.nm.us
k12.nv.us
k12.ny.us
k12.oh.us
k12.ok.us
k12.or.us
k12.pa.us
k12.pr.us
// k12.ri.us  Removed at request of Kim Cournoyer <netsupport@staff.ri.net>
k12.sc.us
// k12.sd.us  Bug 934131 - Removed at request of James Booze <James.Booze@k12.sd.us>
k12.tn.us
k12.tx.us
k12.ut.us
k12.vi.us
k12.vt.us
k12.va.us
k12.wa.us
k12.wi.us
// k12.wv.us  Bug 947705 - Removed at request of Verne Britton <verne@wvnet.edu>
k12.wy.us
cc.ak.us
cc.al.us
cc.ar.us
cc.as.us
cc.az.us
cc.ca.us
cc.co.us
cc.ct.us
cc.dc.us
cc.de.us
cc.fl.us
cc.ga.us
cc.gu.us
cc.hi.us
cc.ia.us
cc.id.us
cc.il.us
cc.in.us
cc.ks.us
cc.ky.us
cc.la.us
cc.ma.us
cc.md.us
cc.me.us
cc.mi.us
cc.mn.us
cc.mo.us
cc.ms.us
cc.mt.us
cc.nc.us
cc.nd.us
cc.ne.us
cc.nh.us
cc.nj.us
cc.nm.us
cc.nv.us
cc.ny.us
cc.oh.us
cc.ok.us
cc.or.us
cc.pa.us
cc.pr.us
cc.ri.us
cc.sc.us
cc.sd.us
cc.tn.us
cc.tx.us
cc.ut.us
cc.vi.us
cc.vt.us
cc.va.us
cc.wa.us
cc.wi.us
cc.wv.us
cc.wy.us
lib.ak.us
lib.al.us
lib.ar.us
lib.as.us
lib.az.us
lib.ca.us
lib.co.us
lib.ct.us
lib.dc.us
// lib.de.us  Issue #243 - Moved to Private section at request of Ed Moore <Ed.Moore@lib.de.us>
lib.fl.us
lib.ga.us
lib.gu.us
lib.hi.us
lib.ia.us
lib.id.us
lib.il.us
lib.in.us
lib.ks.us
lib.ky.us
lib.la.us
lib.ma.us
lib.md.us
lib.me.us
lib.mi.us
lib.mn.us
lib.mo.us
lib.ms.us
lib.mt.us
lib.nc.us
lib.nd.us
lib.ne.us
lib.nh.us
lib.nj.us
lib.nm.us
lib.nv.us
lib.ny.us
lib.oh.us
lib.ok.us
lib.or.us
lib.pa.us
lib.pr.us
lib.ri.us
lib.sc.us
lib.sd.us
lib.tn.us
lib.tx.us
lib.ut.us
lib.vi.us
lib.vt.us
lib.va.us
lib.wa.us
lib.wi.us
// lib.wv.us  Bug 941670 - Removed at request of Larry W Arnold <arnold@wvlc.lib.wv.us>
lib.wy.us
// k12.ma.us contains school districts in Massachusetts. The 4LDs are
//  managed independently except for private (PVT), charter (CHTR) and
//  parochial (PAROCH) schools.  Those are delegated directly to the
//  5LD operators.   <k12-ma-hostmaster _ at _ rsuc.gweep.net>
pvt.k12.ma.us
chtr.k12.ma.us
paroch.k12.ma.us
// Merit Network, Inc. maintains the registry for =~ /(k12|cc|lib).mi.us/ and the following
//    see also: http://domreg.merit.edu
//    see also: whois -h whois.domreg.merit.edu help
ann-arbor.mi.us
cog.mi.us
dst.mi.us
eaton.mi.us
gen.mi.us
mus.mi.us
tec.mi.us
washtenaw.mi.us

// uy : http://www.nic.org.uy/
uy
com.uy
edu.uy
gub.uy
mil.uy
net.uy
org.uy

// uz : http://www.reg.uz/
uz
co.uz
com.uz
net.uz
org.uz

// va : https://en.wikipedia.org/wiki/.va
va

// vc : https://en.wikipedia.org/wiki/.vc
// Submitted by registry <kshah@ca.afilias.info>
vc
com.vc
net.vc
org.vc
gov.vc
mil.vc
edu.vc

// ve : https://registro.nic.ve/
// Submitted by registry nic@nic.ve and nicve@conatel.gob.ve
ve
arts.ve
bib.ve
co.ve
com.ve
e12.ve
edu.ve
firm.ve
gob.ve
gov.ve
info.ve
int.ve
mil.ve
net.ve
nom.ve
org.ve
rar.ve
rec.ve
store.ve
tec.ve
web.ve

// vg : https://en.wikipedia.org/wiki/.vg
vg

// vi : http://www.nic.vi/newdomainform.htm
// http://www.nic.vi/Domain_Rules/body_domain_rules.html indicates some other
// TLDs are "reserved", such as edu.vi and gov.vi, but doesn't actually say they
// are available for registration (which they do not seem to be).
vi
co.vi
com.vi
k12.vi
net.vi
org.vi

// vn : https://www.vnnic.vn/en/domain/cctld-vn
// https://vnnic.vn/sites/default/files/tailieu/vn.cctld.domains.txt
vn
ac.vn
ai.vn
biz.vn
com.vn
edu.vn
gov.vn
health.vn
id.vn
info.vn
int.vn
io.vn
name.vn
net.vn
org.vn
pro.vn

// vn geographical names
angiang.vn
bacgiang.vn
backan.vn
baclieu.vn
bacninh.vn
baria-vungtau.vn
bentre.vn
binhdinh.vn
binhduong.vn
binhphuoc.vn
binhthuan.vn
camau.vn
cantho.vn
caobang.vn
daklak.vn
daknong.vn
danang.vn
dienbien.vn
dongnai.vn
dongthap.vn
gialai.vn
hagiang.vn
haiduong.vn
haiphong.vn
hanam.vn
hanoi.vn
hatinh.vn
haugiang.vn
hoabinh.vn
hungyen.vn
khanhhoa.vn
kiengiang.vn
kontum.vn
laichau.vn
lamdong.vn
langson.vn
laocai.vn
longan.vn
namdinh.vn
nghean.vn
ninhbinh.vn
ninhthuan.vn
phutho.vn
phuyen.vn
quangbinh.vn
quangnam.vn
quangngai.vn
quangninh.vn
quangtri.vn
soctrang.vn
sonla.vn
tayninh.vn
thaibinh.vn
thainguyen.vn
thanhhoa.vn
thanhphohochiminh.vn
thuathienhue.vn
tiengiang.vn
travinh.vn
tuyenquang.vn
vinhlong.vn
vinhphuc.vn
yenbai.vn

// vu : https://en.wikipedia.org/wiki/.vu
// http://www.vunic.vu/
vu
com.vu
edu.vu
net.vu
org.vu

// wf : https://www.afnic.fr/wp-media/uploads/2022/12/afnic-naming-policy-2023-01-01.pdf
wf

// ws : https://en.wikipedia.org/wiki/.ws
// http://samoanic.ws/index.dhtml
ws
com.ws
net.ws
org.ws
gov.ws
edu.ws

// yt : https://www.afnic.fr/wp-media/uploads/2022/12/afnic-naming-policy-2023-01-01.pdf
yt

// IDN ccTLDs
// When submitting patches, please maintain a sort by ISO 3166 ccTLD, then
// U-label, and follow this format:
// // A-Label ("<Latin renderings>", <language name>[, variant info]) : <ISO 3166 ccTLD>
// // [sponsoring org]
// U-Label

// xn--mgbaam7a8h ("Emerat", Arabic) : AE
// http://nic.ae/english/arabicdomain/rules.jsp
امارات

// xn--y9a3aq ("hye", Armenian) : AM
// ISOC AM (operated by .am Registry)
հայ

// xn--54b7fta0cc ("Bangla", Bangla) : BD
বাংলা

// xn--90ae ("bg", Bulgarian) : BG
бг

// xn--mgbcpq6gpa1a ("albahrain", Arabic) : BH
البحرين

// xn--90ais ("bel", Belarusian/Russian Cyrillic) : BY
// Operated by .by registry
бел

// xn--fiqs8s ("Zhongguo/China", Chinese, Simplified) : CN
// CNNIC
// http://cnnic.cn/html/Dir/2005/10/11/3218.htm
中国

// xn--fiqz9s ("Zhongguo/China", Chinese, Traditional) : CN
// CNNIC
// http://cnnic.cn/html/Dir/2005/10/11/3218.htm
中國

// xn--lgbbat1ad8j ("Algeria/Al Jazair", Arabic) : DZ
الجزائر

// xn--wgbh1c ("Egypt/Masr", Arabic) : EG
// http://www.dotmasr.eg/
مصر

// xn--e1a4c ("eu", Cyrillic) : EU
// https://eurid.eu
ею

// xn--qxa6a ("eu", Greek) : EU
// https://eurid.eu
ευ

// xn--mgbah1a3hjkrd ("Mauritania", Arabic) : MR
موريتانيا

// xn--node ("ge", Georgian Mkhedruli) : GE
გე

// xn--qxam ("el", Greek) : GR
// Hellenic Ministry of Infrastructure, Transport, and Networks
ελ

// xn--j6w193g ("Hong Kong", Chinese) : HK
// https://www.hkirc.hk
// Submitted by registry <hk.tech@hkirc.hk>
// https://www.hkirc.hk/content.jsp?id=30#!/34
香港
公司.香港
教育.香港
政府.香港
個人.香港
網絡.香港
組織.香港

// xn--2scrj9c ("Bharat", Kannada) : IN
// India
ಭಾರತ

// xn--3hcrj9c ("Bharat", Oriya) : IN
// India
ଭାରତ

// xn--45br5cyl ("Bharatam", Assamese) : IN
// India
ভাৰত

// xn--h2breg3eve ("Bharatam", Sanskrit) : IN
// India
भारतम्

// xn--h2brj9c8c ("Bharot", Santali) : IN
// India
भारोत

// xn--mgbgu82a ("Bharat", Sindhi) : IN
// India
ڀارت

// xn--rvc1e0am3e ("Bharatam", Malayalam) : IN
// India
ഭാരതം

// xn--h2brj9c ("Bharat", Devanagari) : IN
// India
भारत

// xn--mgbbh1a ("Bharat", Kashmiri) : IN
// India
بارت

// xn--mgbbh1a71e ("Bharat", Arabic) : IN
// India
بھارت

// xn--fpcrj9c3d ("Bharat", Telugu) : IN
// India
భారత్

// xn--gecrj9c ("Bharat", Gujarati) : IN
// India
ભારત

// xn--s9brj9c ("Bharat", Gurmukhi) : IN
// India
ਭਾਰਤ

// xn--45brj9c ("Bharat", Bengali) : IN
// India
ভারত

// xn--xkc2dl3a5ee0h ("India", Tamil) : IN
// India
இந்தியா

// xn--mgba3a4f16a ("Iran", Persian) : IR
ایران

// xn--mgba3a4fra ("Iran", Arabic) : IR
ايران

// xn--mgbtx2b ("Iraq", Arabic) : IQ
// Communications and Media Commission
عراق

// xn--mgbayh7gpa ("al-Ordon", Arabic) : JO
// National Information Technology Center (NITC)
// Royal Scientific Society, Al-Jubeiha
الاردن

// xn--3e0b707e ("Republic of Korea", Hangul) : KR
한국

// xn--80ao21a ("Kaz", Kazakh) : KZ
қаз

// xn--q7ce6a ("Lao", Lao) : LA
ລາວ

// xn--fzc2c9e2c ("Lanka", Sinhalese-Sinhala) : LK
// https://nic.lk
ලංකා

// xn--xkc2al3hye2a ("Ilangai", Tamil) : LK
// https://nic.lk
இலங்கை

// xn--mgbc0a9azcg ("Morocco/al-Maghrib", Arabic) : MA
المغرب

// xn--d1alf ("mkd", Macedonian) : MK
// MARnet
мкд

// xn--l1acc ("mon", Mongolian) : MN
мон

// xn--mix891f ("Macao", Chinese, Traditional) : MO
// MONIC / HNET Asia (Registry Operator for .mo)
澳門

// xn--mix082f ("Macao", Chinese, Simplified) : MO
澳门

// xn--mgbx4cd0ab ("Malaysia", Malay) : MY
مليسيا

// xn--mgb9awbf ("Oman", Arabic) : OM
عمان

// xn--mgbai9azgqp6j ("Pakistan", Urdu/Arabic) : PK
پاکستان

// xn--mgbai9a5eva00b ("Pakistan", Urdu/Arabic, variant) : PK
پاكستان

// xn--ygbi2ammx ("Falasteen", Arabic) : PS
// The Palestinian National Internet Naming Authority (PNINA)
// http://www.pnina.ps
فلسطين

// xn--90a3ac ("srb", Cyrillic) : RS
// https://www.rnids.rs/en/domains/national-domains
срб
пр.срб
орг.срб
обр.срб
од.срб
упр.срб
ак.срб

// xn--p1ai ("rf", Russian-Cyrillic) : RU
// https://cctld.ru/files/pdf/docs/en/rules_ru-rf.pdf
// Submitted by George Georgievsky <gug@cctld.ru>
рф

// xn--wgbl6a ("Qatar", Arabic) : QA
// http://www.ict.gov.qa/
قطر

// xn--mgberp4a5d4ar ("AlSaudiah", Arabic) : SA
// http://www.nic.net.sa/
السعودية

// xn--mgberp4a5d4a87g ("AlSaudiah", Arabic, variant)  : SA
السعودیة

// xn--mgbqly7c0a67fbc ("AlSaudiah", Arabic, variant) : SA
السعودیۃ

// xn--mgbqly7cvafr ("AlSaudiah", Arabic, variant) : SA
السعوديه

// xn--mgbpl2fh ("sudan", Arabic) : SD
// Operated by .sd registry
سودان

// xn--yfro4i67o Singapore ("Singapore", Chinese) : SG
新加坡

// xn--clchc0ea0b2g2a9gcd ("Singapore", Tamil) : SG
சிங்கப்பூர்

// xn--ogbpf8fl ("Syria", Arabic) : SY
سورية

// xn--mgbtf8fl ("Syria", Arabic, variant) : SY
سوريا

// xn--o3cw4h ("Thai", Thai) : TH
// http://www.thnic.co.th
ไทย
ศึกษา.ไทย
ธุรกิจ.ไทย
รัฐบาล.ไทย
ทหาร.ไทย
เน็ต.ไทย
องค์กร.ไทย

// xn--pgbs0dh ("Tunisia", Arabic) : TN
// http://nic.tn
تونس

// xn--kpry57d ("Taiwan", Chinese, Traditional) : TW
// http://www.twnic.net/english/dn/dn_07a.htm
台灣

// xn--kprw13d ("Taiwan", Chinese, Simplified) : TW
// http://www.twnic.net/english/dn/dn_07a.htm
台湾

// xn--nnx388a ("Taiwan", Chinese, variant) : TW
臺灣

// xn--j1amh ("ukr", Cyrillic) : UA
укр

// xn--mgb2ddes ("AlYemen", Arabic) : YE
اليمن

// xxx : http://icmregistry.com
xxx

// ye : http://www.y.net.ye/services/domain_name.htm
ye
com.ye
edu.ye
gov.ye
net.ye
mil.ye
org.ye

// za : https://www.zadna.org.za/content/page/domain-information/
ac.za
agric.za
alt.za
co.za
edu.za
gov.za
grondar.za
law.za
mil.za
net.za
ngo.za
nic.za
nis.za
nom.za
org.za
school.za
tm.za
web.za

// zm : https://zicta.zm/
// Submitted by registry <info@zicta.zm>
zm
ac.zm
biz.zm
co.zm
com.zm
edu.zm
gov.zm
info.zm
mil.zm
net.zm
org.zm
sch.zm

// zw : https://www.potraz.gov.zw/
// Confirmed by registry <bmtengwa@potraz.gov.zw> 2017-01-25
zw
ac.zw
co.zw
gov.zw
mil.zw
org.zw


// newGTLDs

// List of new gTLDs imported from https://www.icann.org/resources/registries/gtlds/v2/gtlds.json on 2023-10-20T15:11:50Z
// This list is auto-generated, don't edit it manually.
// aaa : American Automobile Association, Inc.
// https://www.iana.org/domains/root/db/aaa.html
aaa

// aarp : AARP
// https://www.iana.org/domains/root/db/aarp.html
aarp

// abb : ABB Ltd
// https://www.iana.org/domains/root/db/abb.html
abb

// abbott : Abbott Laboratories, Inc.
// https://www.iana.org/domains/root/db/abbott.html
abbott

// abbvie : AbbVie Inc.
// https://www.iana.org/domains/root/db/abbvie.html
abbvie

// abc : Disney Enterprises, Inc.
// https://www.iana.org/domains/root/db/abc.html
abc

// able : Able Inc.
// https://www.iana.org/domains/root/db/able.html
able

// abogado : Registry Services, LLC
// https://www.iana.org/domains/root/db/abogado.html
abogado

// abudhabi : Abu Dhabi Systems and Information Centre
// https://www.iana.org/domains/root/db/abudhabi.html
abudhabi

// academy : Binky Moon, LLC
// https://www.iana.org/domains/root/db/academy.html
academy

// accenture : Accenture plc
// https://www.iana.org/domains/root/db/accenture.html
accenture

// accountant : dot Accountant Limited
// https://www.iana.org/domains/root/db/accountant.html
accountant

// accountants : Binky Moon, LLC
// https://www.iana.org/domains/root/db/accountants.html
accountants

// aco : ACO Severin Ahlmann GmbH & Co. KG
// https://www.iana.org/domains/root/db/aco.html
aco

// actor : Dog Beach, LLC
// https://www.iana.org/domains/root/db/actor.html
actor

// ads : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/ads.html
ads

// adult : ICM Registry AD LLC
// https://www.iana.org/domains/root/db/adult.html
adult

// aeg : Aktiebolaget Electrolux
// https://www.iana.org/domains/root/db/aeg.html
aeg

// aetna : Aetna Life Insurance Company
// https://www.iana.org/domains/root/db/aetna.html
aetna

// afl : Australian Football League
// https://www.iana.org/domains/root/db/afl.html
afl

// africa : ZA Central Registry NPC trading as Registry.Africa
// https://www.iana.org/domains/root/db/africa.html
africa

// agakhan : Fondation Aga Khan (Aga Khan Foundation)
// https://www.iana.org/domains/root/db/agakhan.html
agakhan

// agency : Binky Moon, LLC
// https://www.iana.org/domains/root/db/agency.html
agency

// aig : American International Group, Inc.
// https://www.iana.org/domains/root/db/aig.html
aig

// airbus : Airbus S.A.S.
// https://www.iana.org/domains/root/db/airbus.html
airbus

// airforce : Dog Beach, LLC
// https://www.iana.org/domains/root/db/airforce.html
airforce

// airtel : Bharti Airtel Limited
// https://www.iana.org/domains/root/db/airtel.html
airtel

// akdn : Fondation Aga Khan (Aga Khan Foundation)
// https://www.iana.org/domains/root/db/akdn.html
akdn

// alibaba : Alibaba Group Holding Limited
// https://www.iana.org/domains/root/db/alibaba.html
alibaba

// alipay : Alibaba Group Holding Limited
// https://www.iana.org/domains/root/db/alipay.html
alipay

// allfinanz : Allfinanz Deutsche Vermögensberatung Aktiengesellschaft
// https://www.iana.org/domains/root/db/allfinanz.html
allfinanz

// allstate : Allstate Fire and Casualty Insurance Company
// https://www.iana.org/domains/root/db/allstate.html
allstate

// ally : Ally Financial Inc.
// https://www.iana.org/domains/root/db/ally.html
ally

// alsace : Region Grand Est
// https://www.iana.org/domains/root/db/alsace.html
alsace

// alstom : ALSTOM
// https://www.iana.org/domains/root/db/alstom.html
alstom

// amazon : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/amazon.html
amazon

// americanexpress : American Express Travel Related Services Company, Inc.
// https://www.iana.org/domains/root/db/americanexpress.html
americanexpress

// americanfamily : AmFam, Inc.
// https://www.iana.org/domains/root/db/americanfamily.html
americanfamily

// amex : American Express Travel Related Services Company, Inc.
// https://www.iana.org/domains/root/db/amex.html
amex

// amfam : AmFam, Inc.
// https://www.iana.org/domains/root/db/amfam.html
amfam

// amica : Amica Mutual Insurance Company
// https://www.iana.org/domains/root/db/amica.html
amica

// amsterdam : Gemeente Amsterdam
// https://www.iana.org/domains/root/db/amsterdam.html
amsterdam

// analytics : Campus IP LLC
// https://www.iana.org/domains/root/db/analytics.html
analytics

// android : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/android.html
android

// anquan : Beijing Qihu Keji Co., Ltd.
// https://www.iana.org/domains/root/db/anquan.html
anquan

// anz : Australia and New Zealand Banking Group Limited
// https://www.iana.org/domains/root/db/anz.html
anz

// aol : Oath Inc.
// https://www.iana.org/domains/root/db/aol.html
aol

// apartments : Binky Moon, LLC
// https://www.iana.org/domains/root/db/apartments.html
apartments

// app : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/app.html
app

// apple : Apple Inc.
// https://www.iana.org/domains/root/db/apple.html
apple

// aquarelle : Aquarelle.com
// https://www.iana.org/domains/root/db/aquarelle.html
aquarelle

// arab : League of Arab States
// https://www.iana.org/domains/root/db/arab.html
arab

// aramco : Aramco Services Company
// https://www.iana.org/domains/root/db/aramco.html
aramco

// archi : Identity Digital Limited
// https://www.iana.org/domains/root/db/archi.html
archi

// army : Dog Beach, LLC
// https://www.iana.org/domains/root/db/army.html
army

// art : UK Creative Ideas Limited
// https://www.iana.org/domains/root/db/art.html
art

// arte : Association Relative à la Télévision Européenne G.E.I.E.
// https://www.iana.org/domains/root/db/arte.html
arte

// asda : Wal-Mart Stores, Inc.
// https://www.iana.org/domains/root/db/asda.html
asda

// associates : Binky Moon, LLC
// https://www.iana.org/domains/root/db/associates.html
associates

// athleta : The Gap, Inc.
// https://www.iana.org/domains/root/db/athleta.html
athleta

// attorney : Dog Beach, LLC
// https://www.iana.org/domains/root/db/attorney.html
attorney

// auction : Dog Beach, LLC
// https://www.iana.org/domains/root/db/auction.html
auction

// audi : AUDI Aktiengesellschaft
// https://www.iana.org/domains/root/db/audi.html
audi

// audible : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/audible.html
audible

// audio : XYZ.COM LLC
// https://www.iana.org/domains/root/db/audio.html
audio

// auspost : Australian Postal Corporation
// https://www.iana.org/domains/root/db/auspost.html
auspost

// author : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/author.html
author

// auto : XYZ.COM LLC
// https://www.iana.org/domains/root/db/auto.html
auto

// autos : XYZ.COM LLC
// https://www.iana.org/domains/root/db/autos.html
autos

// avianca : Avianca Inc.
// https://www.iana.org/domains/root/db/avianca.html
avianca

// aws : AWS Registry LLC
// https://www.iana.org/domains/root/db/aws.html
aws

// axa : AXA Group Operations SAS
// https://www.iana.org/domains/root/db/axa.html
axa

// azure : Microsoft Corporation
// https://www.iana.org/domains/root/db/azure.html
azure

// baby : XYZ.COM LLC
// https://www.iana.org/domains/root/db/baby.html
baby

// baidu : Baidu, Inc.
// https://www.iana.org/domains/root/db/baidu.html
baidu

// banamex : Citigroup Inc.
// https://www.iana.org/domains/root/db/banamex.html
banamex

// bananarepublic : The Gap, Inc.
// https://www.iana.org/domains/root/db/bananarepublic.html
bananarepublic

// band : Dog Beach, LLC
// https://www.iana.org/domains/root/db/band.html
band

// bank : fTLD Registry Services LLC
// https://www.iana.org/domains/root/db/bank.html
bank

// bar : Punto 2012 Sociedad Anonima Promotora de Inversion de Capital Variable
// https://www.iana.org/domains/root/db/bar.html
bar

// barcelona : Municipi de Barcelona
// https://www.iana.org/domains/root/db/barcelona.html
barcelona

// barclaycard : Barclays Bank PLC
// https://www.iana.org/domains/root/db/barclaycard.html
barclaycard

// barclays : Barclays Bank PLC
// https://www.iana.org/domains/root/db/barclays.html
barclays

// barefoot : Gallo Vineyards, Inc.
// https://www.iana.org/domains/root/db/barefoot.html
barefoot

// bargains : Binky Moon, LLC
// https://www.iana.org/domains/root/db/bargains.html
bargains

// baseball : MLB Advanced Media DH, LLC
// https://www.iana.org/domains/root/db/baseball.html
baseball

// basketball : Fédération Internationale de Basketball (FIBA)
// https://www.iana.org/domains/root/db/basketball.html
basketball

// bauhaus : Werkhaus GmbH
// https://www.iana.org/domains/root/db/bauhaus.html
bauhaus

// bayern : Bayern Connect GmbH
// https://www.iana.org/domains/root/db/bayern.html
bayern

// bbc : British Broadcasting Corporation
// https://www.iana.org/domains/root/db/bbc.html
bbc

// bbt : BB&T Corporation
// https://www.iana.org/domains/root/db/bbt.html
bbt

// bbva : BANCO BILBAO VIZCAYA ARGENTARIA, S.A.
// https://www.iana.org/domains/root/db/bbva.html
bbva

// bcg : The Boston Consulting Group, Inc.
// https://www.iana.org/domains/root/db/bcg.html
bcg

// bcn : Municipi de Barcelona
// https://www.iana.org/domains/root/db/bcn.html
bcn

// beats : Beats Electronics, LLC
// https://www.iana.org/domains/root/db/beats.html
beats

// beauty : XYZ.COM LLC
// https://www.iana.org/domains/root/db/beauty.html
beauty

// beer : Registry Services, LLC
// https://www.iana.org/domains/root/db/beer.html
beer

// bentley : Bentley Motors Limited
// https://www.iana.org/domains/root/db/bentley.html
bentley

// berlin : dotBERLIN GmbH & Co. KG
// https://www.iana.org/domains/root/db/berlin.html
berlin

// best : BestTLD Pty Ltd
// https://www.iana.org/domains/root/db/best.html
best

// bestbuy : BBY Solutions, Inc.
// https://www.iana.org/domains/root/db/bestbuy.html
bestbuy

// bet : Identity Digital Limited
// https://www.iana.org/domains/root/db/bet.html
bet

// bharti : Bharti Enterprises (Holding) Private Limited
// https://www.iana.org/domains/root/db/bharti.html
bharti

// bible : American Bible Society
// https://www.iana.org/domains/root/db/bible.html
bible

// bid : dot Bid Limited
// https://www.iana.org/domains/root/db/bid.html
bid

// bike : Binky Moon, LLC
// https://www.iana.org/domains/root/db/bike.html
bike

// bing : Microsoft Corporation
// https://www.iana.org/domains/root/db/bing.html
bing

// bingo : Binky Moon, LLC
// https://www.iana.org/domains/root/db/bingo.html
bingo

// bio : Identity Digital Limited
// https://www.iana.org/domains/root/db/bio.html
bio

// black : Identity Digital Limited
// https://www.iana.org/domains/root/db/black.html
black

// blackfriday : Registry Services, LLC
// https://www.iana.org/domains/root/db/blackfriday.html
blackfriday

// blockbuster : Dish DBS Corporation
// https://www.iana.org/domains/root/db/blockbuster.html
blockbuster

// blog : Knock Knock WHOIS There, LLC
// https://www.iana.org/domains/root/db/blog.html
blog

// bloomberg : Bloomberg IP Holdings LLC
// https://www.iana.org/domains/root/db/bloomberg.html
bloomberg

// blue : Identity Digital Limited
// https://www.iana.org/domains/root/db/blue.html
blue

// bms : Bristol-Myers Squibb Company
// https://www.iana.org/domains/root/db/bms.html
bms

// bmw : Bayerische Motoren Werke Aktiengesellschaft
// https://www.iana.org/domains/root/db/bmw.html
bmw

// bnpparibas : BNP Paribas
// https://www.iana.org/domains/root/db/bnpparibas.html
bnpparibas

// boats : XYZ.COM LLC
// https://www.iana.org/domains/root/db/boats.html
boats

// boehringer : Boehringer Ingelheim International GmbH
// https://www.iana.org/domains/root/db/boehringer.html
boehringer

// bofa : Bank of America Corporation
// https://www.iana.org/domains/root/db/bofa.html
bofa

// bom : Núcleo de Informação e Coordenação do Ponto BR - NIC.br
// https://www.iana.org/domains/root/db/bom.html
bom

// bond : ShortDot SA
// https://www.iana.org/domains/root/db/bond.html
bond

// boo : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/boo.html
boo

// book : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/book.html
book

// booking : Booking.com B.V.
// https://www.iana.org/domains/root/db/booking.html
booking

// bosch : Robert Bosch GMBH
// https://www.iana.org/domains/root/db/bosch.html
bosch

// bostik : Bostik SA
// https://www.iana.org/domains/root/db/bostik.html
bostik

// boston : Registry Services, LLC
// https://www.iana.org/domains/root/db/boston.html
boston

// bot : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/bot.html
bot

// boutique : Binky Moon, LLC
// https://www.iana.org/domains/root/db/boutique.html
boutique

// box : Intercap Registry Inc.
// https://www.iana.org/domains/root/db/box.html
box

// bradesco : Banco Bradesco S.A.
// https://www.iana.org/domains/root/db/bradesco.html
bradesco

// bridgestone : Bridgestone Corporation
// https://www.iana.org/domains/root/db/bridgestone.html
bridgestone

// broadway : Celebrate Broadway, Inc.
// https://www.iana.org/domains/root/db/broadway.html
broadway

// broker : Dog Beach, LLC
// https://www.iana.org/domains/root/db/broker.html
broker

// brother : Brother Industries, Ltd.
// https://www.iana.org/domains/root/db/brother.html
brother

// brussels : DNS.be vzw
// https://www.iana.org/domains/root/db/brussels.html
brussels

// build : Plan Bee LLC
// https://www.iana.org/domains/root/db/build.html
build

// builders : Binky Moon, LLC
// https://www.iana.org/domains/root/db/builders.html
builders

// business : Binky Moon, LLC
// https://www.iana.org/domains/root/db/business.html
business

// buy : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/buy.html
buy

// buzz : DOTSTRATEGY CO.
// https://www.iana.org/domains/root/db/buzz.html
buzz

// bzh : Association www.bzh
// https://www.iana.org/domains/root/db/bzh.html
bzh

// cab : Binky Moon, LLC
// https://www.iana.org/domains/root/db/cab.html
cab

// cafe : Binky Moon, LLC
// https://www.iana.org/domains/root/db/cafe.html
cafe

// cal : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/cal.html
cal

// call : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/call.html
call

// calvinklein : PVH gTLD Holdings LLC
// https://www.iana.org/domains/root/db/calvinklein.html
calvinklein

// cam : Cam Connecting SARL
// https://www.iana.org/domains/root/db/cam.html
cam

// camera : Binky Moon, LLC
// https://www.iana.org/domains/root/db/camera.html
camera

// camp : Binky Moon, LLC
// https://www.iana.org/domains/root/db/camp.html
camp

// canon : Canon Inc.
// https://www.iana.org/domains/root/db/canon.html
canon

// capetown : ZA Central Registry NPC trading as ZA Central Registry
// https://www.iana.org/domains/root/db/capetown.html
capetown

// capital : Binky Moon, LLC
// https://www.iana.org/domains/root/db/capital.html
capital

// capitalone : Capital One Financial Corporation
// https://www.iana.org/domains/root/db/capitalone.html
capitalone

// car : XYZ.COM LLC
// https://www.iana.org/domains/root/db/car.html
car

// caravan : Caravan International, Inc.
// https://www.iana.org/domains/root/db/caravan.html
caravan

// cards : Binky Moon, LLC
// https://www.iana.org/domains/root/db/cards.html
cards

// care : Binky Moon, LLC
// https://www.iana.org/domains/root/db/care.html
care

// career : dotCareer LLC
// https://www.iana.org/domains/root/db/career.html
career

// careers : Binky Moon, LLC
// https://www.iana.org/domains/root/db/careers.html
careers

// cars : XYZ.COM LLC
// https://www.iana.org/domains/root/db/cars.html
cars

// casa : Registry Services, LLC
// https://www.iana.org/domains/root/db/casa.html
casa

// case : Digity, LLC
// https://www.iana.org/domains/root/db/case.html
case

// cash : Binky Moon, LLC
// https://www.iana.org/domains/root/db/cash.html
cash

// casino : Binky Moon, LLC
// https://www.iana.org/domains/root/db/casino.html
casino

// catering : Binky Moon, LLC
// https://www.iana.org/domains/root/db/catering.html
catering

// catholic : Pontificium Consilium de Comunicationibus Socialibus (PCCS) (Pontifical Council for Social Communication)
// https://www.iana.org/domains/root/db/catholic.html
catholic

// cba : COMMONWEALTH BANK OF AUSTRALIA
// https://www.iana.org/domains/root/db/cba.html
cba

// cbn : The Christian Broadcasting Network, Inc.
// https://www.iana.org/domains/root/db/cbn.html
cbn

// cbre : CBRE, Inc.
// https://www.iana.org/domains/root/db/cbre.html
cbre

// cbs : CBS Domains Inc.
// https://www.iana.org/domains/root/db/cbs.html
cbs

// center : Binky Moon, LLC
// https://www.iana.org/domains/root/db/center.html
center

// ceo : XYZ.COM LLC
// https://www.iana.org/domains/root/db/ceo.html
ceo

// cern : European Organization for Nuclear Research ("CERN")
// https://www.iana.org/domains/root/db/cern.html
cern

// cfa : CFA Institute
// https://www.iana.org/domains/root/db/cfa.html
cfa

// cfd : ShortDot SA
// https://www.iana.org/domains/root/db/cfd.html
cfd

// chanel : Chanel International B.V.
// https://www.iana.org/domains/root/db/chanel.html
chanel

// channel : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/channel.html
channel

// charity : Public Interest Registry
// https://www.iana.org/domains/root/db/charity.html
charity

// chase : JPMorgan Chase Bank, National Association
// https://www.iana.org/domains/root/db/chase.html
chase

// chat : Binky Moon, LLC
// https://www.iana.org/domains/root/db/chat.html
chat

// cheap : Binky Moon, LLC
// https://www.iana.org/domains/root/db/cheap.html
cheap

// chintai : CHINTAI Corporation
// https://www.iana.org/domains/root/db/chintai.html
chintai

// christmas : XYZ.COM LLC
// https://www.iana.org/domains/root/db/christmas.html
christmas

// chrome : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/chrome.html
chrome

// church : Binky Moon, LLC
// https://www.iana.org/domains/root/db/church.html
church

// cipriani : Hotel Cipriani Srl
// https://www.iana.org/domains/root/db/cipriani.html
cipriani

// circle : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/circle.html
circle

// cisco : Cisco Technology, Inc.
// https://www.iana.org/domains/root/db/cisco.html
cisco

// citadel : Citadel Domain LLC
// https://www.iana.org/domains/root/db/citadel.html
citadel

// citi : Citigroup Inc.
// https://www.iana.org/domains/root/db/citi.html
citi

// citic : CITIC Group Corporation
// https://www.iana.org/domains/root/db/citic.html
citic

// city : Binky Moon, LLC
// https://www.iana.org/domains/root/db/city.html
city

// claims : Binky Moon, LLC
// https://www.iana.org/domains/root/db/claims.html
claims

// cleaning : Binky Moon, LLC
// https://www.iana.org/domains/root/db/cleaning.html
cleaning

// click : Internet Naming Company LLC
// https://www.iana.org/domains/root/db/click.html
click

// clinic : Binky Moon, LLC
// https://www.iana.org/domains/root/db/clinic.html
clinic

// clinique : The Estée Lauder Companies Inc.
// https://www.iana.org/domains/root/db/clinique.html
clinique

// clothing : Binky Moon, LLC
// https://www.iana.org/domains/root/db/clothing.html
clothing

// cloud : Aruba PEC S.p.A.
// https://www.iana.org/domains/root/db/cloud.html
cloud

// club : Registry Services, LLC
// https://www.iana.org/domains/root/db/club.html
club

// clubmed : Club Méditerranée S.A.
// https://www.iana.org/domains/root/db/clubmed.html
clubmed

// coach : Binky Moon, LLC
// https://www.iana.org/domains/root/db/coach.html
coach

// codes : Binky Moon, LLC
// https://www.iana.org/domains/root/db/codes.html
codes

// coffee : Binky Moon, LLC
// https://www.iana.org/domains/root/db/coffee.html
coffee

// college : XYZ.COM LLC
// https://www.iana.org/domains/root/db/college.html
college

// cologne : dotKoeln GmbH
// https://www.iana.org/domains/root/db/cologne.html
cologne

// comcast : Comcast IP Holdings I, LLC
// https://www.iana.org/domains/root/db/comcast.html
comcast

// commbank : COMMONWEALTH BANK OF AUSTRALIA
// https://www.iana.org/domains/root/db/commbank.html
commbank

// community : Binky Moon, LLC
// https://www.iana.org/domains/root/db/community.html
community

// company : Binky Moon, LLC
// https://www.iana.org/domains/root/db/company.html
company

// compare : Registry Services, LLC
// https://www.iana.org/domains/root/db/compare.html
compare

// computer : Binky Moon, LLC
// https://www.iana.org/domains/root/db/computer.html
computer

// comsec : VeriSign, Inc.
// https://www.iana.org/domains/root/db/comsec.html
comsec

// condos : Binky Moon, LLC
// https://www.iana.org/domains/root/db/condos.html
condos

// construction : Binky Moon, LLC
// https://www.iana.org/domains/root/db/construction.html
construction

// consulting : Dog Beach, LLC
// https://www.iana.org/domains/root/db/consulting.html
consulting

// contact : Dog Beach, LLC
// https://www.iana.org/domains/root/db/contact.html
contact

// contractors : Binky Moon, LLC
// https://www.iana.org/domains/root/db/contractors.html
contractors

// cooking : Registry Services, LLC
// https://www.iana.org/domains/root/db/cooking.html
cooking

// cool : Binky Moon, LLC
// https://www.iana.org/domains/root/db/cool.html
cool

// corsica : Collectivité de Corse
// https://www.iana.org/domains/root/db/corsica.html
corsica

// country : Internet Naming Company LLC
// https://www.iana.org/domains/root/db/country.html
country

// coupon : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/coupon.html
coupon

// coupons : Binky Moon, LLC
// https://www.iana.org/domains/root/db/coupons.html
coupons

// courses : Registry Services, LLC
// https://www.iana.org/domains/root/db/courses.html
courses

// cpa : American Institute of Certified Public Accountants
// https://www.iana.org/domains/root/db/cpa.html
cpa

// credit : Binky Moon, LLC
// https://www.iana.org/domains/root/db/credit.html
credit

// creditcard : Binky Moon, LLC
// https://www.iana.org/domains/root/db/creditcard.html
creditcard

// creditunion : DotCooperation LLC
// https://www.iana.org/domains/root/db/creditunion.html
creditunion

// cricket : dot Cricket Limited
// https://www.iana.org/domains/root/db/cricket.html
cricket

// crown : Crown Equipment Corporation
// https://www.iana.org/domains/root/db/crown.html
crown

// crs : Federated Co-operatives Limited
// https://www.iana.org/domains/root/db/crs.html
crs

// cruise : Viking River Cruises (Bermuda) Ltd.
// https://www.iana.org/domains/root/db/cruise.html
cruise

// cruises : Binky Moon, LLC
// https://www.iana.org/domains/root/db/cruises.html
cruises

// cuisinella : SCHMIDT GROUPE S.A.S.
// https://www.iana.org/domains/root/db/cuisinella.html
cuisinella

// cymru : Nominet UK
// https://www.iana.org/domains/root/db/cymru.html
cymru

// cyou : ShortDot SA
// https://www.iana.org/domains/root/db/cyou.html
cyou

// dabur : Dabur India Limited
// https://www.iana.org/domains/root/db/dabur.html
dabur

// dad : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/dad.html
dad

// dance : Dog Beach, LLC
// https://www.iana.org/domains/root/db/dance.html
dance

// data : Dish DBS Corporation
// https://www.iana.org/domains/root/db/data.html
data

// date : dot Date Limited
// https://www.iana.org/domains/root/db/date.html
date

// dating : Binky Moon, LLC
// https://www.iana.org/domains/root/db/dating.html
dating

// datsun : NISSAN MOTOR CO., LTD.
// https://www.iana.org/domains/root/db/datsun.html
datsun

// day : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/day.html
day

// dclk : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/dclk.html
dclk

// dds : Registry Services, LLC
// https://www.iana.org/domains/root/db/dds.html
dds

// deal : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/deal.html
deal

// dealer : Intercap Registry Inc.
// https://www.iana.org/domains/root/db/dealer.html
dealer

// deals : Binky Moon, LLC
// https://www.iana.org/domains/root/db/deals.html
deals

// degree : Dog Beach, LLC
// https://www.iana.org/domains/root/db/degree.html
degree

// delivery : Binky Moon, LLC
// https://www.iana.org/domains/root/db/delivery.html
delivery

// dell : Dell Inc.
// https://www.iana.org/domains/root/db/dell.html
dell

// deloitte : Deloitte Touche Tohmatsu
// https://www.iana.org/domains/root/db/deloitte.html
deloitte

// delta : Delta Air Lines, Inc.
// https://www.iana.org/domains/root/db/delta.html
delta

// democrat : Dog Beach, LLC
// https://www.iana.org/domains/root/db/democrat.html
democrat

// dental : Binky Moon, LLC
// https://www.iana.org/domains/root/db/dental.html
dental

// dentist : Dog Beach, LLC
// https://www.iana.org/domains/root/db/dentist.html
dentist

// desi : Desi Networks LLC
// https://www.iana.org/domains/root/db/desi.html
desi

// design : Registry Services, LLC
// https://www.iana.org/domains/root/db/design.html
design

// dev : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/dev.html
dev

// dhl : Deutsche Post AG
// https://www.iana.org/domains/root/db/dhl.html
dhl

// diamonds : Binky Moon, LLC
// https://www.iana.org/domains/root/db/diamonds.html
diamonds

// diet : XYZ.COM LLC
// https://www.iana.org/domains/root/db/diet.html
diet

// digital : Binky Moon, LLC
// https://www.iana.org/domains/root/db/digital.html
digital

// direct : Binky Moon, LLC
// https://www.iana.org/domains/root/db/direct.html
direct

// directory : Binky Moon, LLC
// https://www.iana.org/domains/root/db/directory.html
directory

// discount : Binky Moon, LLC
// https://www.iana.org/domains/root/db/discount.html
discount

// discover : Discover Financial Services
// https://www.iana.org/domains/root/db/discover.html
discover

// dish : Dish DBS Corporation
// https://www.iana.org/domains/root/db/dish.html
dish

// diy : Lifestyle Domain Holdings, Inc.
// https://www.iana.org/domains/root/db/diy.html
diy

// dnp : Dai Nippon Printing Co., Ltd.
// https://www.iana.org/domains/root/db/dnp.html
dnp

// docs : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/docs.html
docs

// doctor : Binky Moon, LLC
// https://www.iana.org/domains/root/db/doctor.html
doctor

// dog : Binky Moon, LLC
// https://www.iana.org/domains/root/db/dog.html
dog

// domains : Binky Moon, LLC
// https://www.iana.org/domains/root/db/domains.html
domains

// dot : Dish DBS Corporation
// https://www.iana.org/domains/root/db/dot.html
dot

// download : dot Support Limited
// https://www.iana.org/domains/root/db/download.html
download

// drive : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/drive.html
drive

// dtv : Dish DBS Corporation
// https://www.iana.org/domains/root/db/dtv.html
dtv

// dubai : Dubai Smart Government Department
// https://www.iana.org/domains/root/db/dubai.html
dubai

// dunlop : The Goodyear Tire & Rubber Company
// https://www.iana.org/domains/root/db/dunlop.html
dunlop

// dupont : DuPont Specialty Products USA, LLC
// https://www.iana.org/domains/root/db/dupont.html
dupont

// durban : ZA Central Registry NPC trading as ZA Central Registry
// https://www.iana.org/domains/root/db/durban.html
durban

// dvag : Deutsche Vermögensberatung Aktiengesellschaft DVAG
// https://www.iana.org/domains/root/db/dvag.html
dvag

// dvr : DISH Technologies L.L.C.
// https://www.iana.org/domains/root/db/dvr.html
dvr

// earth : Interlink Systems Innovation Institute K.K.
// https://www.iana.org/domains/root/db/earth.html
earth

// eat : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/eat.html
eat

// eco : Big Room Inc.
// https://www.iana.org/domains/root/db/eco.html
eco

// edeka : EDEKA Verband kaufmännischer Genossenschaften e.V.
// https://www.iana.org/domains/root/db/edeka.html
edeka

// education : Binky Moon, LLC
// https://www.iana.org/domains/root/db/education.html
education

// email : Binky Moon, LLC
// https://www.iana.org/domains/root/db/email.html
email

// emerck : Merck KGaA
// https://www.iana.org/domains/root/db/emerck.html
emerck

// energy : Binky Moon, LLC
// https://www.iana.org/domains/root/db/energy.html
energy

// engineer : Dog Beach, LLC
// https://www.iana.org/domains/root/db/engineer.html
engineer

// engineering : Binky Moon, LLC
// https://www.iana.org/domains/root/db/engineering.html
engineering

// enterprises : Binky Moon, LLC
// https://www.iana.org/domains/root/db/enterprises.html
enterprises

// epson : Seiko Epson Corporation
// https://www.iana.org/domains/root/db/epson.html
epson

// equipment : Binky Moon, LLC
// https://www.iana.org/domains/root/db/equipment.html
equipment

// ericsson : Telefonaktiebolaget L M Ericsson
// https://www.iana.org/domains/root/db/ericsson.html
ericsson

// erni : ERNI Group Holding AG
// https://www.iana.org/domains/root/db/erni.html
erni

// esq : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/esq.html
esq

// estate : Binky Moon, LLC
// https://www.iana.org/domains/root/db/estate.html
estate

// etisalat : Emirates Telecommunications Corporation (trading as Etisalat)
// https://www.iana.org/domains/root/db/etisalat.html
etisalat

// eurovision : European Broadcasting Union (EBU)
// https://www.iana.org/domains/root/db/eurovision.html
eurovision

// eus : Puntueus Fundazioa
// https://www.iana.org/domains/root/db/eus.html
eus

// events : Binky Moon, LLC
// https://www.iana.org/domains/root/db/events.html
events

// exchange : Binky Moon, LLC
// https://www.iana.org/domains/root/db/exchange.html
exchange

// expert : Binky Moon, LLC
// https://www.iana.org/domains/root/db/expert.html
expert

// exposed : Binky Moon, LLC
// https://www.iana.org/domains/root/db/exposed.html
exposed

// express : Binky Moon, LLC
// https://www.iana.org/domains/root/db/express.html
express

// extraspace : Extra Space Storage LLC
// https://www.iana.org/domains/root/db/extraspace.html
extraspace

// fage : Fage International S.A.
// https://www.iana.org/domains/root/db/fage.html
fage

// fail : Binky Moon, LLC
// https://www.iana.org/domains/root/db/fail.html
fail

// fairwinds : FairWinds Partners, LLC
// https://www.iana.org/domains/root/db/fairwinds.html
fairwinds

// faith : dot Faith Limited
// https://www.iana.org/domains/root/db/faith.html
faith

// family : Dog Beach, LLC
// https://www.iana.org/domains/root/db/family.html
family

// fan : Dog Beach, LLC
// https://www.iana.org/domains/root/db/fan.html
fan

// fans : ZDNS International Limited
// https://www.iana.org/domains/root/db/fans.html
fans

// farm : Binky Moon, LLC
// https://www.iana.org/domains/root/db/farm.html
farm

// farmers : Farmers Insurance Exchange
// https://www.iana.org/domains/root/db/farmers.html
farmers

// fashion : Registry Services, LLC
// https://www.iana.org/domains/root/db/fashion.html
fashion

// fast : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/fast.html
fast

// fedex : Federal Express Corporation
// https://www.iana.org/domains/root/db/fedex.html
fedex

// feedback : Top Level Spectrum, Inc.
// https://www.iana.org/domains/root/db/feedback.html
feedback

// ferrari : Fiat Chrysler Automobiles N.V.
// https://www.iana.org/domains/root/db/ferrari.html
ferrari

// ferrero : Ferrero Trading Lux S.A.
// https://www.iana.org/domains/root/db/ferrero.html
ferrero

// fidelity : Fidelity Brokerage Services LLC
// https://www.iana.org/domains/root/db/fidelity.html
fidelity

// fido : Rogers Communications Canada Inc.
// https://www.iana.org/domains/root/db/fido.html
fido

// film : Motion Picture Domain Registry Pty Ltd
// https://www.iana.org/domains/root/db/film.html
film

// final : Núcleo de Informação e Coordenação do Ponto BR - NIC.br
// https://www.iana.org/domains/root/db/final.html
final

// finance : Binky Moon, LLC
// https://www.iana.org/domains/root/db/finance.html
finance

// financial : Binky Moon, LLC
// https://www.iana.org/domains/root/db/financial.html
financial

// fire : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/fire.html
fire

// firestone : Bridgestone Licensing Services, Inc
// https://www.iana.org/domains/root/db/firestone.html
firestone

// firmdale : Firmdale Holdings Limited
// https://www.iana.org/domains/root/db/firmdale.html
firmdale

// fish : Binky Moon, LLC
// https://www.iana.org/domains/root/db/fish.html
fish

// fishing : Registry Services, LLC
// https://www.iana.org/domains/root/db/fishing.html
fishing

// fit : Registry Services, LLC
// https://www.iana.org/domains/root/db/fit.html
fit

// fitness : Binky Moon, LLC
// https://www.iana.org/domains/root/db/fitness.html
fitness

// flickr : Flickr, Inc.
// https://www.iana.org/domains/root/db/flickr.html
flickr

// flights : Binky Moon, LLC
// https://www.iana.org/domains/root/db/flights.html
flights

// flir : FLIR Systems, Inc.
// https://www.iana.org/domains/root/db/flir.html
flir

// florist : Binky Moon, LLC
// https://www.iana.org/domains/root/db/florist.html
florist

// flowers : XYZ.COM LLC
// https://www.iana.org/domains/root/db/flowers.html
flowers

// fly : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/fly.html
fly

// foo : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/foo.html
foo

// food : Lifestyle Domain Holdings, Inc.
// https://www.iana.org/domains/root/db/food.html
food

// football : Binky Moon, LLC
// https://www.iana.org/domains/root/db/football.html
football

// ford : Ford Motor Company
// https://www.iana.org/domains/root/db/ford.html
ford

// forex : Dog Beach, LLC
// https://www.iana.org/domains/root/db/forex.html
forex

// forsale : Dog Beach, LLC
// https://www.iana.org/domains/root/db/forsale.html
forsale

// forum : Fegistry, LLC
// https://www.iana.org/domains/root/db/forum.html
forum

// foundation : Public Interest Registry
// https://www.iana.org/domains/root/db/foundation.html
foundation

// fox : FOX Registry, LLC
// https://www.iana.org/domains/root/db/fox.html
fox

// free : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/free.html
free

// fresenius : Fresenius Immobilien-Verwaltungs-GmbH
// https://www.iana.org/domains/root/db/fresenius.html
fresenius

// frl : FRLregistry B.V.
// https://www.iana.org/domains/root/db/frl.html
frl

// frogans : OP3FT
// https://www.iana.org/domains/root/db/frogans.html
frogans

// frontier : Frontier Communications Corporation
// https://www.iana.org/domains/root/db/frontier.html
frontier

// ftr : Frontier Communications Corporation
// https://www.iana.org/domains/root/db/ftr.html
ftr

// fujitsu : Fujitsu Limited
// https://www.iana.org/domains/root/db/fujitsu.html
fujitsu

// fun : Radix FZC DMCC
// https://www.iana.org/domains/root/db/fun.html
fun

// fund : Binky Moon, LLC
// https://www.iana.org/domains/root/db/fund.html
fund

// furniture : Binky Moon, LLC
// https://www.iana.org/domains/root/db/furniture.html
furniture

// futbol : Dog Beach, LLC
// https://www.iana.org/domains/root/db/futbol.html
futbol

// fyi : Binky Moon, LLC
// https://www.iana.org/domains/root/db/fyi.html
fyi

// gal : Asociación puntoGAL
// https://www.iana.org/domains/root/db/gal.html
gal

// gallery : Binky Moon, LLC
// https://www.iana.org/domains/root/db/gallery.html
gallery

// gallo : Gallo Vineyards, Inc.
// https://www.iana.org/domains/root/db/gallo.html
gallo

// gallup : Gallup, Inc.
// https://www.iana.org/domains/root/db/gallup.html
gallup

// game : XYZ.COM LLC
// https://www.iana.org/domains/root/db/game.html
game

// games : Dog Beach, LLC
// https://www.iana.org/domains/root/db/games.html
games

// gap : The Gap, Inc.
// https://www.iana.org/domains/root/db/gap.html
gap

// garden : Registry Services, LLC
// https://www.iana.org/domains/root/db/garden.html
garden

// gay : Registry Services, LLC
// https://www.iana.org/domains/root/db/gay.html
gay

// gbiz : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/gbiz.html
gbiz

// gdn : Joint Stock Company "Navigation-information systems"
// https://www.iana.org/domains/root/db/gdn.html
gdn

// gea : GEA Group Aktiengesellschaft
// https://www.iana.org/domains/root/db/gea.html
gea

// gent : Easyhost BV
// https://www.iana.org/domains/root/db/gent.html
gent

// genting : Resorts World Inc Pte. Ltd.
// https://www.iana.org/domains/root/db/genting.html
genting

// george : Wal-Mart Stores, Inc.
// https://www.iana.org/domains/root/db/george.html
george

// ggee : GMO Internet, Inc.
// https://www.iana.org/domains/root/db/ggee.html
ggee

// gift : DotGift, LLC
// https://www.iana.org/domains/root/db/gift.html
gift

// gifts : Binky Moon, LLC
// https://www.iana.org/domains/root/db/gifts.html
gifts

// gives : Public Interest Registry
// https://www.iana.org/domains/root/db/gives.html
gives

// giving : Public Interest Registry
// https://www.iana.org/domains/root/db/giving.html
giving

// glass : Binky Moon, LLC
// https://www.iana.org/domains/root/db/glass.html
glass

// gle : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/gle.html
gle

// global : Identity Digital Limited
// https://www.iana.org/domains/root/db/global.html
global

// globo : Globo Comunicação e Participações S.A
// https://www.iana.org/domains/root/db/globo.html
globo

// gmail : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/gmail.html
gmail

// gmbh : Binky Moon, LLC
// https://www.iana.org/domains/root/db/gmbh.html
gmbh

// gmo : GMO Internet, Inc.
// https://www.iana.org/domains/root/db/gmo.html
gmo

// gmx : 1&1 Mail & Media GmbH
// https://www.iana.org/domains/root/db/gmx.html
gmx

// godaddy : Go Daddy East, LLC
// https://www.iana.org/domains/root/db/godaddy.html
godaddy

// gold : Binky Moon, LLC
// https://www.iana.org/domains/root/db/gold.html
gold

// goldpoint : YODOBASHI CAMERA CO.,LTD.
// https://www.iana.org/domains/root/db/goldpoint.html
goldpoint

// golf : Binky Moon, LLC
// https://www.iana.org/domains/root/db/golf.html
golf

// goo : NTT Resonant Inc.
// https://www.iana.org/domains/root/db/goo.html
goo

// goodyear : The Goodyear Tire & Rubber Company
// https://www.iana.org/domains/root/db/goodyear.html
goodyear

// goog : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/goog.html
goog

// google : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/google.html
google

// gop : Republican State Leadership Committee, Inc.
// https://www.iana.org/domains/root/db/gop.html
gop

// got : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/got.html
got

// grainger : Grainger Registry Services, LLC
// https://www.iana.org/domains/root/db/grainger.html
grainger

// graphics : Binky Moon, LLC
// https://www.iana.org/domains/root/db/graphics.html
graphics

// gratis : Binky Moon, LLC
// https://www.iana.org/domains/root/db/gratis.html
gratis

// green : Identity Digital Limited
// https://www.iana.org/domains/root/db/green.html
green

// gripe : Binky Moon, LLC
// https://www.iana.org/domains/root/db/gripe.html
gripe

// grocery : Wal-Mart Stores, Inc.
// https://www.iana.org/domains/root/db/grocery.html
grocery

// group : Binky Moon, LLC
// https://www.iana.org/domains/root/db/group.html
group

// guardian : The Guardian Life Insurance Company of America
// https://www.iana.org/domains/root/db/guardian.html
guardian

// gucci : Guccio Gucci S.p.a.
// https://www.iana.org/domains/root/db/gucci.html
gucci

// guge : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/guge.html
guge

// guide : Binky Moon, LLC
// https://www.iana.org/domains/root/db/guide.html
guide

// guitars : XYZ.COM LLC
// https://www.iana.org/domains/root/db/guitars.html
guitars

// guru : Binky Moon, LLC
// https://www.iana.org/domains/root/db/guru.html
guru

// hair : XYZ.COM LLC
// https://www.iana.org/domains/root/db/hair.html
hair

// hamburg : Hamburg Top-Level-Domain GmbH
// https://www.iana.org/domains/root/db/hamburg.html
hamburg

// hangout : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/hangout.html
hangout

// haus : Dog Beach, LLC
// https://www.iana.org/domains/root/db/haus.html
haus

// hbo : HBO Registry Services, Inc.
// https://www.iana.org/domains/root/db/hbo.html
hbo

// hdfc : HOUSING DEVELOPMENT FINANCE CORPORATION LIMITED
// https://www.iana.org/domains/root/db/hdfc.html
hdfc

// hdfcbank : HDFC Bank Limited
// https://www.iana.org/domains/root/db/hdfcbank.html
hdfcbank

// health : Registry Services, LLC
// https://www.iana.org/domains/root/db/health.html
health

// healthcare : Binky Moon, LLC
// https://www.iana.org/domains/root/db/healthcare.html
healthcare

// help : Innovation service Limited
// https://www.iana.org/domains/root/db/help.html
help

// helsinki : City of Helsinki
// https://www.iana.org/domains/root/db/helsinki.html
helsinki

// here : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/here.html
here

// hermes : HERMES INTERNATIONAL
// https://www.iana.org/domains/root/db/hermes.html
hermes

// hiphop : Dot Hip Hop, LLC
// https://www.iana.org/domains/root/db/hiphop.html
hiphop

// hisamitsu : Hisamitsu Pharmaceutical Co.,Inc.
// https://www.iana.org/domains/root/db/hisamitsu.html
hisamitsu

// hitachi : Hitachi, Ltd.
// https://www.iana.org/domains/root/db/hitachi.html
hitachi

// hiv : Internet Naming Company LLC
// https://www.iana.org/domains/root/db/hiv.html
hiv

// hkt : PCCW-HKT DataCom Services Limited
// https://www.iana.org/domains/root/db/hkt.html
hkt

// hockey : Binky Moon, LLC
// https://www.iana.org/domains/root/db/hockey.html
hockey

// holdings : Binky Moon, LLC
// https://www.iana.org/domains/root/db/holdings.html
holdings

// holiday : Binky Moon, LLC
// https://www.iana.org/domains/root/db/holiday.html
holiday

// homedepot : Home Depot Product Authority, LLC
// https://www.iana.org/domains/root/db/homedepot.html
homedepot

// homegoods : The TJX Companies, Inc.
// https://www.iana.org/domains/root/db/homegoods.html
homegoods

// homes : XYZ.COM LLC
// https://www.iana.org/domains/root/db/homes.html
homes

// homesense : The TJX Companies, Inc.
// https://www.iana.org/domains/root/db/homesense.html
homesense

// honda : Honda Motor Co., Ltd.
// https://www.iana.org/domains/root/db/honda.html
honda

// horse : Registry Services, LLC
// https://www.iana.org/domains/root/db/horse.html
horse

// hospital : Binky Moon, LLC
// https://www.iana.org/domains/root/db/hospital.html
hospital

// host : Radix FZC DMCC
// https://www.iana.org/domains/root/db/host.html
host

// hosting : XYZ.COM LLC
// https://www.iana.org/domains/root/db/hosting.html
hosting

// hot : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/hot.html
hot

// hotels : Booking.com B.V.
// https://www.iana.org/domains/root/db/hotels.html
hotels

// hotmail : Microsoft Corporation
// https://www.iana.org/domains/root/db/hotmail.html
hotmail

// house : Binky Moon, LLC
// https://www.iana.org/domains/root/db/house.html
house

// how : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/how.html
how

// hsbc : HSBC Global Services (UK) Limited
// https://www.iana.org/domains/root/db/hsbc.html
hsbc

// hughes : Hughes Satellite Systems Corporation
// https://www.iana.org/domains/root/db/hughes.html
hughes

// hyatt : Hyatt GTLD, L.L.C.
// https://www.iana.org/domains/root/db/hyatt.html
hyatt

// hyundai : Hyundai Motor Company
// https://www.iana.org/domains/root/db/hyundai.html
hyundai

// ibm : International Business Machines Corporation
// https://www.iana.org/domains/root/db/ibm.html
ibm

// icbc : Industrial and Commercial Bank of China Limited
// https://www.iana.org/domains/root/db/icbc.html
icbc

// ice : IntercontinentalExchange, Inc.
// https://www.iana.org/domains/root/db/ice.html
ice

// icu : ShortDot SA
// https://www.iana.org/domains/root/db/icu.html
icu

// ieee : IEEE Global LLC
// https://www.iana.org/domains/root/db/ieee.html
ieee

// ifm : ifm electronic gmbh
// https://www.iana.org/domains/root/db/ifm.html
ifm

// ikano : Ikano S.A.
// https://www.iana.org/domains/root/db/ikano.html
ikano

// imamat : Fondation Aga Khan (Aga Khan Foundation)
// https://www.iana.org/domains/root/db/imamat.html
imamat

// imdb : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/imdb.html
imdb

// immo : Binky Moon, LLC
// https://www.iana.org/domains/root/db/immo.html
immo

// immobilien : Dog Beach, LLC
// https://www.iana.org/domains/root/db/immobilien.html
immobilien

// inc : Intercap Registry Inc.
// https://www.iana.org/domains/root/db/inc.html
inc

// industries : Binky Moon, LLC
// https://www.iana.org/domains/root/db/industries.html
industries

// infiniti : NISSAN MOTOR CO., LTD.
// https://www.iana.org/domains/root/db/infiniti.html
infiniti

// ing : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/ing.html
ing

// ink : Registry Services, LLC
// https://www.iana.org/domains/root/db/ink.html
ink

// institute : Binky Moon, LLC
// https://www.iana.org/domains/root/db/institute.html
institute

// insurance : fTLD Registry Services LLC
// https://www.iana.org/domains/root/db/insurance.html
insurance

// insure : Binky Moon, LLC
// https://www.iana.org/domains/root/db/insure.html
insure

// international : Binky Moon, LLC
// https://www.iana.org/domains/root/db/international.html
international

// intuit : Intuit Administrative Services, Inc.
// https://www.iana.org/domains/root/db/intuit.html
intuit

// investments : Binky Moon, LLC
// https://www.iana.org/domains/root/db/investments.html
investments

// ipiranga : Ipiranga Produtos de Petroleo S.A.
// https://www.iana.org/domains/root/db/ipiranga.html
ipiranga

// irish : Binky Moon, LLC
// https://www.iana.org/domains/root/db/irish.html
irish

// ismaili : Fondation Aga Khan (Aga Khan Foundation)
// https://www.iana.org/domains/root/db/ismaili.html
ismaili

// ist : Istanbul Metropolitan Municipality
// https://www.iana.org/domains/root/db/ist.html
ist

// istanbul : Istanbul Metropolitan Municipality
// https://www.iana.org/domains/root/db/istanbul.html
istanbul

// itau : Itau Unibanco Holding S.A.
// https://www.iana.org/domains/root/db/itau.html
itau

// itv : ITV Services Limited
// https://www.iana.org/domains/root/db/itv.html
itv

// jaguar : Jaguar Land Rover Ltd
// https://www.iana.org/domains/root/db/jaguar.html
jaguar

// java : Oracle Corporation
// https://www.iana.org/domains/root/db/java.html
java

// jcb : JCB Co., Ltd.
// https://www.iana.org/domains/root/db/jcb.html
jcb

// jeep : FCA US LLC.
// https://www.iana.org/domains/root/db/jeep.html
jeep

// jetzt : Binky Moon, LLC
// https://www.iana.org/domains/root/db/jetzt.html
jetzt

// jewelry : Binky Moon, LLC
// https://www.iana.org/domains/root/db/jewelry.html
jewelry

// jio : Reliance Industries Limited
// https://www.iana.org/domains/root/db/jio.html
jio

// jll : Jones Lang LaSalle Incorporated
// https://www.iana.org/domains/root/db/jll.html
jll

// jmp : Matrix IP LLC
// https://www.iana.org/domains/root/db/jmp.html
jmp

// jnj : Johnson & Johnson Services, Inc.
// https://www.iana.org/domains/root/db/jnj.html
jnj

// joburg : ZA Central Registry NPC trading as ZA Central Registry
// https://www.iana.org/domains/root/db/joburg.html
joburg

// jot : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/jot.html
jot

// joy : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/joy.html
joy

// jpmorgan : JPMorgan Chase Bank, National Association
// https://www.iana.org/domains/root/db/jpmorgan.html
jpmorgan

// jprs : Japan Registry Services Co., Ltd.
// https://www.iana.org/domains/root/db/jprs.html
jprs

// juegos : Internet Naming Company LLC
// https://www.iana.org/domains/root/db/juegos.html
juegos

// juniper : JUNIPER NETWORKS, INC.
// https://www.iana.org/domains/root/db/juniper.html
juniper

// kaufen : Dog Beach, LLC
// https://www.iana.org/domains/root/db/kaufen.html
kaufen

// kddi : KDDI CORPORATION
// https://www.iana.org/domains/root/db/kddi.html
kddi

// kerryhotels : Kerry Trading Co. Limited
// https://www.iana.org/domains/root/db/kerryhotels.html
kerryhotels

// kerrylogistics : Kerry Trading Co. Limited
// https://www.iana.org/domains/root/db/kerrylogistics.html
kerrylogistics

// kerryproperties : Kerry Trading Co. Limited
// https://www.iana.org/domains/root/db/kerryproperties.html
kerryproperties

// kfh : Kuwait Finance House
// https://www.iana.org/domains/root/db/kfh.html
kfh

// kia : KIA MOTORS CORPORATION
// https://www.iana.org/domains/root/db/kia.html
kia

// kids : DotKids Foundation Limited
// https://www.iana.org/domains/root/db/kids.html
kids

// kim : Identity Digital Limited
// https://www.iana.org/domains/root/db/kim.html
kim

// kinder : Ferrero Trading Lux S.A.
// https://www.iana.org/domains/root/db/kinder.html
kinder

// kindle : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/kindle.html
kindle

// kitchen : Binky Moon, LLC
// https://www.iana.org/domains/root/db/kitchen.html
kitchen

// kiwi : DOT KIWI LIMITED
// https://www.iana.org/domains/root/db/kiwi.html
kiwi

// koeln : dotKoeln GmbH
// https://www.iana.org/domains/root/db/koeln.html
koeln

// komatsu : Komatsu Ltd.
// https://www.iana.org/domains/root/db/komatsu.html
komatsu

// kosher : Kosher Marketing Assets LLC
// https://www.iana.org/domains/root/db/kosher.html
kosher

// kpmg : KPMG International Cooperative (KPMG International Genossenschaft)
// https://www.iana.org/domains/root/db/kpmg.html
kpmg

// kpn : Koninklijke KPN N.V.
// https://www.iana.org/domains/root/db/kpn.html
kpn

// krd : KRG Department of Information Technology
// https://www.iana.org/domains/root/db/krd.html
krd

// kred : KredTLD Pty Ltd
// https://www.iana.org/domains/root/db/kred.html
kred

// kuokgroup : Kerry Trading Co. Limited
// https://www.iana.org/domains/root/db/kuokgroup.html
kuokgroup

// kyoto : Academic Institution: Kyoto Jyoho Gakuen
// https://www.iana.org/domains/root/db/kyoto.html
kyoto

// lacaixa : Fundación Bancaria Caixa d’Estalvis i Pensions de Barcelona, “la Caixa”
// https://www.iana.org/domains/root/db/lacaixa.html
lacaixa

// lamborghini : Automobili Lamborghini S.p.A.
// https://www.iana.org/domains/root/db/lamborghini.html
lamborghini

// lamer : The Estée Lauder Companies Inc.
// https://www.iana.org/domains/root/db/lamer.html
lamer

// lancaster : LANCASTER
// https://www.iana.org/domains/root/db/lancaster.html
lancaster

// land : Binky Moon, LLC
// https://www.iana.org/domains/root/db/land.html
land

// landrover : Jaguar Land Rover Ltd
// https://www.iana.org/domains/root/db/landrover.html
landrover

// lanxess : LANXESS Corporation
// https://www.iana.org/domains/root/db/lanxess.html
lanxess

// lasalle : Jones Lang LaSalle Incorporated
// https://www.iana.org/domains/root/db/lasalle.html
lasalle

// lat : XYZ.COM LLC
// https://www.iana.org/domains/root/db/lat.html
lat

// latino : Dish DBS Corporation
// https://www.iana.org/domains/root/db/latino.html
latino

// latrobe : La Trobe University
// https://www.iana.org/domains/root/db/latrobe.html
latrobe

// law : Registry Services, LLC
// https://www.iana.org/domains/root/db/law.html
law

// lawyer : Dog Beach, LLC
// https://www.iana.org/domains/root/db/lawyer.html
lawyer

// lds : IRI Domain Management, LLC
// https://www.iana.org/domains/root/db/lds.html
lds

// lease : Binky Moon, LLC
// https://www.iana.org/domains/root/db/lease.html
lease

// leclerc : A.C.D. LEC Association des Centres Distributeurs Edouard Leclerc
// https://www.iana.org/domains/root/db/leclerc.html
leclerc

// lefrak : LeFrak Organization, Inc.
// https://www.iana.org/domains/root/db/lefrak.html
lefrak

// legal : Binky Moon, LLC
// https://www.iana.org/domains/root/db/legal.html
legal

// lego : LEGO Juris A/S
// https://www.iana.org/domains/root/db/lego.html
lego

// lexus : TOYOTA MOTOR CORPORATION
// https://www.iana.org/domains/root/db/lexus.html
lexus

// lgbt : Identity Digital Limited
// https://www.iana.org/domains/root/db/lgbt.html
lgbt

// lidl : Schwarz Domains und Services GmbH & Co. KG
// https://www.iana.org/domains/root/db/lidl.html
lidl

// life : Binky Moon, LLC
// https://www.iana.org/domains/root/db/life.html
life

// lifeinsurance : American Council of Life Insurers
// https://www.iana.org/domains/root/db/lifeinsurance.html
lifeinsurance

// lifestyle : Lifestyle Domain Holdings, Inc.
// https://www.iana.org/domains/root/db/lifestyle.html
lifestyle

// lighting : Binky Moon, LLC
// https://www.iana.org/domains/root/db/lighting.html
lighting

// like : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/like.html
like

// lilly : Eli Lilly and Company
// https://www.iana.org/domains/root/db/lilly.html
lilly

// limited : Binky Moon, LLC
// https://www.iana.org/domains/root/db/limited.html
limited

// limo : Binky Moon, LLC
// https://www.iana.org/domains/root/db/limo.html
limo

// lincoln : Ford Motor Company
// https://www.iana.org/domains/root/db/lincoln.html
lincoln

// link : Nova Registry Ltd
// https://www.iana.org/domains/root/db/link.html
link

// lipsy : Lipsy Ltd
// https://www.iana.org/domains/root/db/lipsy.html
lipsy

// live : Dog Beach, LLC
// https://www.iana.org/domains/root/db/live.html
live

// living : Lifestyle Domain Holdings, Inc.
// https://www.iana.org/domains/root/db/living.html
living

// llc : Identity Digital Limited
// https://www.iana.org/domains/root/db/llc.html
llc

// llp : Intercap Registry Inc.
// https://www.iana.org/domains/root/db/llp.html
llp

// loan : dot Loan Limited
// https://www.iana.org/domains/root/db/loan.html
loan

// loans : Binky Moon, LLC
// https://www.iana.org/domains/root/db/loans.html
loans

// locker : Orange Domains LLC
// https://www.iana.org/domains/root/db/locker.html
locker

// locus : Locus Analytics LLC
// https://www.iana.org/domains/root/db/locus.html
locus

// lol : XYZ.COM LLC
// https://www.iana.org/domains/root/db/lol.html
lol

// london : Dot London Domains Limited
// https://www.iana.org/domains/root/db/london.html
london

// lotte : Lotte Holdings Co., Ltd.
// https://www.iana.org/domains/root/db/lotte.html
lotte

// lotto : Identity Digital Limited
// https://www.iana.org/domains/root/db/lotto.html
lotto

// love : Merchant Law Group LLP
// https://www.iana.org/domains/root/db/love.html
love

// lpl : LPL Holdings, Inc.
// https://www.iana.org/domains/root/db/lpl.html
lpl

// lplfinancial : LPL Holdings, Inc.
// https://www.iana.org/domains/root/db/lplfinancial.html
lplfinancial

// ltd : Binky Moon, LLC
// https://www.iana.org/domains/root/db/ltd.html
ltd

// ltda : InterNetX, Corp
// https://www.iana.org/domains/root/db/ltda.html
ltda

// lundbeck : H. Lundbeck A/S
// https://www.iana.org/domains/root/db/lundbeck.html
lundbeck

// luxe : Registry Services, LLC
// https://www.iana.org/domains/root/db/luxe.html
luxe

// luxury : Luxury Partners, LLC
// https://www.iana.org/domains/root/db/luxury.html
luxury

// madrid : Comunidad de Madrid
// https://www.iana.org/domains/root/db/madrid.html
madrid

// maif : Mutuelle Assurance Instituteur France (MAIF)
// https://www.iana.org/domains/root/db/maif.html
maif

// maison : Binky Moon, LLC
// https://www.iana.org/domains/root/db/maison.html
maison

// makeup : XYZ.COM LLC
// https://www.iana.org/domains/root/db/makeup.html
makeup

// man : MAN SE
// https://www.iana.org/domains/root/db/man.html
man

// management : Binky Moon, LLC
// https://www.iana.org/domains/root/db/management.html
management

// mango : PUNTO FA S.L.
// https://www.iana.org/domains/root/db/mango.html
mango

// map : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/map.html
map

// market : Dog Beach, LLC
// https://www.iana.org/domains/root/db/market.html
market

// marketing : Binky Moon, LLC
// https://www.iana.org/domains/root/db/marketing.html
marketing

// markets : Dog Beach, LLC
// https://www.iana.org/domains/root/db/markets.html
markets

// marriott : Marriott Worldwide Corporation
// https://www.iana.org/domains/root/db/marriott.html
marriott

// marshalls : The TJX Companies, Inc.
// https://www.iana.org/domains/root/db/marshalls.html
marshalls

// mattel : Mattel Sites, Inc.
// https://www.iana.org/domains/root/db/mattel.html
mattel

// mba : Binky Moon, LLC
// https://www.iana.org/domains/root/db/mba.html
mba

// mckinsey : McKinsey Holdings, Inc.
// https://www.iana.org/domains/root/db/mckinsey.html
mckinsey

// med : Medistry LLC
// https://www.iana.org/domains/root/db/med.html
med

// media : Binky Moon, LLC
// https://www.iana.org/domains/root/db/media.html
media

// meet : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/meet.html
meet

// melbourne : The Crown in right of the State of Victoria, represented by its Department of State Development, Business and Innovation
// https://www.iana.org/domains/root/db/melbourne.html
melbourne

// meme : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/meme.html
meme

// memorial : Dog Beach, LLC
// https://www.iana.org/domains/root/db/memorial.html
memorial

// men : Exclusive Registry Limited
// https://www.iana.org/domains/root/db/men.html
men

// menu : Dot Menu Registry, LLC
// https://www.iana.org/domains/root/db/menu.html
menu

// merckmsd : MSD Registry Holdings, Inc.
// https://www.iana.org/domains/root/db/merckmsd.html
merckmsd

// miami : Registry Services, LLC
// https://www.iana.org/domains/root/db/miami.html
miami

// microsoft : Microsoft Corporation
// https://www.iana.org/domains/root/db/microsoft.html
microsoft

// mini : Bayerische Motoren Werke Aktiengesellschaft
// https://www.iana.org/domains/root/db/mini.html
mini

// mint : Intuit Administrative Services, Inc.
// https://www.iana.org/domains/root/db/mint.html
mint

// mit : Massachusetts Institute of Technology
// https://www.iana.org/domains/root/db/mit.html
mit

// mitsubishi : Mitsubishi Corporation
// https://www.iana.org/domains/root/db/mitsubishi.html
mitsubishi

// mlb : MLB Advanced Media DH, LLC
// https://www.iana.org/domains/root/db/mlb.html
mlb

// mls : The Canadian Real Estate Association
// https://www.iana.org/domains/root/db/mls.html
mls

// mma : MMA IARD
// https://www.iana.org/domains/root/db/mma.html
mma

// mobile : Dish DBS Corporation
// https://www.iana.org/domains/root/db/mobile.html
mobile

// moda : Dog Beach, LLC
// https://www.iana.org/domains/root/db/moda.html
moda

// moe : Interlink Systems Innovation Institute K.K.
// https://www.iana.org/domains/root/db/moe.html
moe

// moi : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/moi.html
moi

// mom : XYZ.COM LLC
// https://www.iana.org/domains/root/db/mom.html
mom

// monash : Monash University
// https://www.iana.org/domains/root/db/monash.html
monash

// money : Binky Moon, LLC
// https://www.iana.org/domains/root/db/money.html
money

// monster : XYZ.COM LLC
// https://www.iana.org/domains/root/db/monster.html
monster

// mormon : IRI Domain Management, LLC
// https://www.iana.org/domains/root/db/mormon.html
mormon

// mortgage : Dog Beach, LLC
// https://www.iana.org/domains/root/db/mortgage.html
mortgage

// moscow : Foundation for Assistance for Internet Technologies and Infrastructure Development (FAITID)
// https://www.iana.org/domains/root/db/moscow.html
moscow

// moto : Motorola Trademark Holdings, LLC
// https://www.iana.org/domains/root/db/moto.html
moto

// motorcycles : XYZ.COM LLC
// https://www.iana.org/domains/root/db/motorcycles.html
motorcycles

// mov : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/mov.html
mov

// movie : Binky Moon, LLC
// https://www.iana.org/domains/root/db/movie.html
movie

// msd : MSD Registry Holdings, Inc.
// https://www.iana.org/domains/root/db/msd.html
msd

// mtn : MTN Dubai Limited
// https://www.iana.org/domains/root/db/mtn.html
mtn

// mtr : MTR Corporation Limited
// https://www.iana.org/domains/root/db/mtr.html
mtr

// music : DotMusic Limited
// https://www.iana.org/domains/root/db/music.html
music

// nab : National Australia Bank Limited
// https://www.iana.org/domains/root/db/nab.html
nab

// nagoya : GMO Registry, Inc.
// https://www.iana.org/domains/root/db/nagoya.html
nagoya

// natura : NATURA COSMÉTICOS S.A.
// https://www.iana.org/domains/root/db/natura.html
natura

// navy : Dog Beach, LLC
// https://www.iana.org/domains/root/db/navy.html
navy

// nba : NBA REGISTRY, LLC
// https://www.iana.org/domains/root/db/nba.html
nba

// nec : NEC Corporation
// https://www.iana.org/domains/root/db/nec.html
nec

// netbank : COMMONWEALTH BANK OF AUSTRALIA
// https://www.iana.org/domains/root/db/netbank.html
netbank

// netflix : Netflix, Inc.
// https://www.iana.org/domains/root/db/netflix.html
netflix

// network : Binky Moon, LLC
// https://www.iana.org/domains/root/db/network.html
network

// neustar : NeuStar, Inc.
// https://www.iana.org/domains/root/db/neustar.html
neustar

// new : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/new.html
new

// news : Dog Beach, LLC
// https://www.iana.org/domains/root/db/news.html
news

// next : Next plc
// https://www.iana.org/domains/root/db/next.html
next

// nextdirect : Next plc
// https://www.iana.org/domains/root/db/nextdirect.html
nextdirect

// nexus : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/nexus.html
nexus

// nfl : NFL Reg Ops LLC
// https://www.iana.org/domains/root/db/nfl.html
nfl

// ngo : Public Interest Registry
// https://www.iana.org/domains/root/db/ngo.html
ngo

// nhk : Japan Broadcasting Corporation (NHK)
// https://www.iana.org/domains/root/db/nhk.html
nhk

// nico : DWANGO Co., Ltd.
// https://www.iana.org/domains/root/db/nico.html
nico

// nike : NIKE, Inc.
// https://www.iana.org/domains/root/db/nike.html
nike

// nikon : NIKON CORPORATION
// https://www.iana.org/domains/root/db/nikon.html
nikon

// ninja : Dog Beach, LLC
// https://www.iana.org/domains/root/db/ninja.html
ninja

// nissan : NISSAN MOTOR CO., LTD.
// https://www.iana.org/domains/root/db/nissan.html
nissan

// nissay : Nippon Life Insurance Company
// https://www.iana.org/domains/root/db/nissay.html
nissay

// nokia : Nokia Corporation
// https://www.iana.org/domains/root/db/nokia.html
nokia

// norton : NortonLifeLock Inc.
// https://www.iana.org/domains/root/db/norton.html
norton

// now : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/now.html
now

// nowruz : Asia Green IT System Bilgisayar San. ve Tic. Ltd. Sti.
// https://www.iana.org/domains/root/db/nowruz.html
nowruz

// nowtv : Starbucks (HK) Limited
// https://www.iana.org/domains/root/db/nowtv.html
nowtv

// nra : NRA Holdings Company, INC.
// https://www.iana.org/domains/root/db/nra.html
nra

// nrw : Minds + Machines GmbH
// https://www.iana.org/domains/root/db/nrw.html
nrw

// ntt : NIPPON TELEGRAPH AND TELEPHONE CORPORATION
// https://www.iana.org/domains/root/db/ntt.html
ntt

// nyc : The City of New York by and through the New York City Department of Information Technology & Telecommunications
// https://www.iana.org/domains/root/db/nyc.html
nyc

// obi : OBI Group Holding SE & Co. KGaA
// https://www.iana.org/domains/root/db/obi.html
obi

// observer : Fegistry, LLC
// https://www.iana.org/domains/root/db/observer.html
observer

// office : Microsoft Corporation
// https://www.iana.org/domains/root/db/office.html
office

// okinawa : BRregistry, Inc.
// https://www.iana.org/domains/root/db/okinawa.html
okinawa

// olayan : Competrol (Luxembourg) Sarl
// https://www.iana.org/domains/root/db/olayan.html
olayan

// olayangroup : Competrol (Luxembourg) Sarl
// https://www.iana.org/domains/root/db/olayangroup.html
olayangroup

// oldnavy : The Gap, Inc.
// https://www.iana.org/domains/root/db/oldnavy.html
oldnavy

// ollo : Dish DBS Corporation
// https://www.iana.org/domains/root/db/ollo.html
ollo

// omega : The Swatch Group Ltd
// https://www.iana.org/domains/root/db/omega.html
omega

// one : One.com A/S
// https://www.iana.org/domains/root/db/one.html
one

// ong : Public Interest Registry
// https://www.iana.org/domains/root/db/ong.html
ong

// onl : iRegistry GmbH
// https://www.iana.org/domains/root/db/onl.html
onl

// online : Radix FZC DMCC
// https://www.iana.org/domains/root/db/online.html
online

// ooo : INFIBEAM AVENUES LIMITED
// https://www.iana.org/domains/root/db/ooo.html
ooo

// open : American Express Travel Related Services Company, Inc.
// https://www.iana.org/domains/root/db/open.html
open

// oracle : Oracle Corporation
// https://www.iana.org/domains/root/db/oracle.html
oracle

// orange : Orange Brand Services Limited
// https://www.iana.org/domains/root/db/orange.html
orange

// organic : Identity Digital Limited
// https://www.iana.org/domains/root/db/organic.html
organic

// origins : The Estée Lauder Companies Inc.
// https://www.iana.org/domains/root/db/origins.html
origins

// osaka : Osaka Registry Co., Ltd.
// https://www.iana.org/domains/root/db/osaka.html
osaka

// otsuka : Otsuka Holdings Co., Ltd.
// https://www.iana.org/domains/root/db/otsuka.html
otsuka

// ott : Dish DBS Corporation
// https://www.iana.org/domains/root/db/ott.html
ott

// ovh : MédiaBC
// https://www.iana.org/domains/root/db/ovh.html
ovh

// page : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/page.html
page

// panasonic : Panasonic Holdings Corporation
// https://www.iana.org/domains/root/db/panasonic.html
panasonic

// paris : City of Paris
// https://www.iana.org/domains/root/db/paris.html
paris

// pars : Asia Green IT System Bilgisayar San. ve Tic. Ltd. Sti.
// https://www.iana.org/domains/root/db/pars.html
pars

// partners : Binky Moon, LLC
// https://www.iana.org/domains/root/db/partners.html
partners

// parts : Binky Moon, LLC
// https://www.iana.org/domains/root/db/parts.html
parts

// party : Blue Sky Registry Limited
// https://www.iana.org/domains/root/db/party.html
party

// pay : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/pay.html
pay

// pccw : PCCW Enterprises Limited
// https://www.iana.org/domains/root/db/pccw.html
pccw

// pet : Identity Digital Limited
// https://www.iana.org/domains/root/db/pet.html
pet

// pfizer : Pfizer Inc.
// https://www.iana.org/domains/root/db/pfizer.html
pfizer

// pharmacy : National Association of Boards of Pharmacy
// https://www.iana.org/domains/root/db/pharmacy.html
pharmacy

// phd : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/phd.html
phd

// philips : Koninklijke Philips N.V.
// https://www.iana.org/domains/root/db/philips.html
philips

// phone : Dish DBS Corporation
// https://www.iana.org/domains/root/db/phone.html
phone

// photo : Registry Services, LLC
// https://www.iana.org/domains/root/db/photo.html
photo

// photography : Binky Moon, LLC
// https://www.iana.org/domains/root/db/photography.html
photography

// photos : Binky Moon, LLC
// https://www.iana.org/domains/root/db/photos.html
photos

// physio : PhysBiz Pty Ltd
// https://www.iana.org/domains/root/db/physio.html
physio

// pics : XYZ.COM LLC
// https://www.iana.org/domains/root/db/pics.html
pics

// pictet : Pictet Europe S.A.
// https://www.iana.org/domains/root/db/pictet.html
pictet

// pictures : Binky Moon, LLC
// https://www.iana.org/domains/root/db/pictures.html
pictures

// pid : Top Level Spectrum, Inc.
// https://www.iana.org/domains/root/db/pid.html
pid

// pin : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/pin.html
pin

// ping : Ping Registry Provider, Inc.
// https://www.iana.org/domains/root/db/ping.html
ping

// pink : Identity Digital Limited
// https://www.iana.org/domains/root/db/pink.html
pink

// pioneer : Pioneer Corporation
// https://www.iana.org/domains/root/db/pioneer.html
pioneer

// pizza : Binky Moon, LLC
// https://www.iana.org/domains/root/db/pizza.html
pizza

// place : Binky Moon, LLC
// https://www.iana.org/domains/root/db/place.html
place

// play : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/play.html
play

// playstation : Sony Interactive Entertainment Inc.
// https://www.iana.org/domains/root/db/playstation.html
playstation

// plumbing : Binky Moon, LLC
// https://www.iana.org/domains/root/db/plumbing.html
plumbing

// plus : Binky Moon, LLC
// https://www.iana.org/domains/root/db/plus.html
plus

// pnc : PNC Domain Co., LLC
// https://www.iana.org/domains/root/db/pnc.html
pnc

// pohl : Deutsche Vermögensberatung Aktiengesellschaft DVAG
// https://www.iana.org/domains/root/db/pohl.html
pohl

// poker : Identity Digital Limited
// https://www.iana.org/domains/root/db/poker.html
poker

// politie : Politie Nederland
// https://www.iana.org/domains/root/db/politie.html
politie

// porn : ICM Registry PN LLC
// https://www.iana.org/domains/root/db/porn.html
porn

// pramerica : Prudential Financial, Inc.
// https://www.iana.org/domains/root/db/pramerica.html
pramerica

// praxi : Praxi S.p.A.
// https://www.iana.org/domains/root/db/praxi.html
praxi

// press : Radix FZC DMCC
// https://www.iana.org/domains/root/db/press.html
press

// prime : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/prime.html
prime

// prod : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/prod.html
prod

// productions : Binky Moon, LLC
// https://www.iana.org/domains/root/db/productions.html
productions

// prof : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/prof.html
prof

// progressive : Progressive Casualty Insurance Company
// https://www.iana.org/domains/root/db/progressive.html
progressive

// promo : Identity Digital Limited
// https://www.iana.org/domains/root/db/promo.html
promo

// properties : Binky Moon, LLC
// https://www.iana.org/domains/root/db/properties.html
properties

// property : Digital Property Infrastructure Limited
// https://www.iana.org/domains/root/db/property.html
property

// protection : XYZ.COM LLC
// https://www.iana.org/domains/root/db/protection.html
protection

// pru : Prudential Financial, Inc.
// https://www.iana.org/domains/root/db/pru.html
pru

// prudential : Prudential Financial, Inc.
// https://www.iana.org/domains/root/db/prudential.html
prudential

// pub : Dog Beach, LLC
// https://www.iana.org/domains/root/db/pub.html
pub

// pwc : PricewaterhouseCoopers LLP
// https://www.iana.org/domains/root/db/pwc.html
pwc

// qpon : dotQPON LLC
// https://www.iana.org/domains/root/db/qpon.html
qpon

// quebec : PointQuébec Inc
// https://www.iana.org/domains/root/db/quebec.html
quebec

// quest : XYZ.COM LLC
// https://www.iana.org/domains/root/db/quest.html
quest

// racing : Premier Registry Limited
// https://www.iana.org/domains/root/db/racing.html
racing

// radio : European Broadcasting Union (EBU)
// https://www.iana.org/domains/root/db/radio.html
radio

// read : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/read.html
read

// realestate : dotRealEstate LLC
// https://www.iana.org/domains/root/db/realestate.html
realestate

// realtor : Real Estate Domains LLC
// https://www.iana.org/domains/root/db/realtor.html
realtor

// realty : Internet Naming Company LLC
// https://www.iana.org/domains/root/db/realty.html
realty

// recipes : Binky Moon, LLC
// https://www.iana.org/domains/root/db/recipes.html
recipes

// red : Identity Digital Limited
// https://www.iana.org/domains/root/db/red.html
red

// redstone : Redstone Haute Couture Co., Ltd.
// https://www.iana.org/domains/root/db/redstone.html
redstone

// redumbrella : Travelers TLD, LLC
// https://www.iana.org/domains/root/db/redumbrella.html
redumbrella

// rehab : Dog Beach, LLC
// https://www.iana.org/domains/root/db/rehab.html
rehab

// reise : Binky Moon, LLC
// https://www.iana.org/domains/root/db/reise.html
reise

// reisen : Binky Moon, LLC
// https://www.iana.org/domains/root/db/reisen.html
reisen

// reit : National Association of Real Estate Investment Trusts, Inc.
// https://www.iana.org/domains/root/db/reit.html
reit

// reliance : Reliance Industries Limited
// https://www.iana.org/domains/root/db/reliance.html
reliance

// ren : ZDNS International Limited
// https://www.iana.org/domains/root/db/ren.html
ren

// rent : XYZ.COM LLC
// https://www.iana.org/domains/root/db/rent.html
rent

// rentals : Binky Moon, LLC
// https://www.iana.org/domains/root/db/rentals.html
rentals

// repair : Binky Moon, LLC
// https://www.iana.org/domains/root/db/repair.html
repair

// report : Binky Moon, LLC
// https://www.iana.org/domains/root/db/report.html
report

// republican : Dog Beach, LLC
// https://www.iana.org/domains/root/db/republican.html
republican

// rest : Punto 2012 Sociedad Anonima Promotora de Inversion de Capital Variable
// https://www.iana.org/domains/root/db/rest.html
rest

// restaurant : Binky Moon, LLC
// https://www.iana.org/domains/root/db/restaurant.html
restaurant

// review : dot Review Limited
// https://www.iana.org/domains/root/db/review.html
review

// reviews : Dog Beach, LLC
// https://www.iana.org/domains/root/db/reviews.html
reviews

// rexroth : Robert Bosch GMBH
// https://www.iana.org/domains/root/db/rexroth.html
rexroth

// rich : iRegistry GmbH
// https://www.iana.org/domains/root/db/rich.html
rich

// richardli : Pacific Century Asset Management (HK) Limited
// https://www.iana.org/domains/root/db/richardli.html
richardli

// ricoh : Ricoh Company, Ltd.
// https://www.iana.org/domains/root/db/ricoh.html
ricoh

// ril : Reliance Industries Limited
// https://www.iana.org/domains/root/db/ril.html
ril

// rio : Empresa Municipal de Informática SA - IPLANRIO
// https://www.iana.org/domains/root/db/rio.html
rio

// rip : Dog Beach, LLC
// https://www.iana.org/domains/root/db/rip.html
rip

// rocher : Ferrero Trading Lux S.A.
// https://www.iana.org/domains/root/db/rocher.html
rocher

// rocks : Dog Beach, LLC
// https://www.iana.org/domains/root/db/rocks.html
rocks

// rodeo : Registry Services, LLC
// https://www.iana.org/domains/root/db/rodeo.html
rodeo

// rogers : Rogers Communications Canada Inc.
// https://www.iana.org/domains/root/db/rogers.html
rogers

// room : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/room.html
room

// rsvp : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/rsvp.html
rsvp

// rugby : World Rugby Strategic Developments Limited
// https://www.iana.org/domains/root/db/rugby.html
rugby

// ruhr : dotSaarland GmbH
// https://www.iana.org/domains/root/db/ruhr.html
ruhr

// run : Binky Moon, LLC
// https://www.iana.org/domains/root/db/run.html
run

// rwe : RWE AG
// https://www.iana.org/domains/root/db/rwe.html
rwe

// ryukyu : BRregistry, Inc.
// https://www.iana.org/domains/root/db/ryukyu.html
ryukyu

// saarland : dotSaarland GmbH
// https://www.iana.org/domains/root/db/saarland.html
saarland

// safe : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/safe.html
safe

// safety : Safety Registry Services, LLC.
// https://www.iana.org/domains/root/db/safety.html
safety

// sakura : SAKURA Internet Inc.
// https://www.iana.org/domains/root/db/sakura.html
sakura

// sale : Dog Beach, LLC
// https://www.iana.org/domains/root/db/sale.html
sale

// salon : Binky Moon, LLC
// https://www.iana.org/domains/root/db/salon.html
salon

// samsclub : Wal-Mart Stores, Inc.
// https://www.iana.org/domains/root/db/samsclub.html
samsclub

// samsung : SAMSUNG SDS CO., LTD
// https://www.iana.org/domains/root/db/samsung.html
samsung

// sandvik : Sandvik AB
// https://www.iana.org/domains/root/db/sandvik.html
sandvik

// sandvikcoromant : Sandvik AB
// https://www.iana.org/domains/root/db/sandvikcoromant.html
sandvikcoromant

// sanofi : Sanofi
// https://www.iana.org/domains/root/db/sanofi.html
sanofi

// sap : SAP AG
// https://www.iana.org/domains/root/db/sap.html
sap

// sarl : Binky Moon, LLC
// https://www.iana.org/domains/root/db/sarl.html
sarl

// sas : Research IP LLC
// https://www.iana.org/domains/root/db/sas.html
sas

// save : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/save.html
save

// saxo : Saxo Bank A/S
// https://www.iana.org/domains/root/db/saxo.html
saxo

// sbi : STATE BANK OF INDIA
// https://www.iana.org/domains/root/db/sbi.html
sbi

// sbs : ShortDot SA
// https://www.iana.org/domains/root/db/sbs.html
sbs

// sca : SVENSKA CELLULOSA AKTIEBOLAGET SCA (publ)
// https://www.iana.org/domains/root/db/sca.html
sca

// scb : The Siam Commercial Bank Public Company Limited ("SCB")
// https://www.iana.org/domains/root/db/scb.html
scb

// schaeffler : Schaeffler Technologies AG & Co. KG
// https://www.iana.org/domains/root/db/schaeffler.html
schaeffler

// schmidt : SCHMIDT GROUPE S.A.S.
// https://www.iana.org/domains/root/db/schmidt.html
schmidt

// scholarships : Scholarships.com, LLC
// https://www.iana.org/domains/root/db/scholarships.html
scholarships

// school : Binky Moon, LLC
// https://www.iana.org/domains/root/db/school.html
school

// schule : Binky Moon, LLC
// https://www.iana.org/domains/root/db/schule.html
schule

// schwarz : Schwarz Domains und Services GmbH & Co. KG
// https://www.iana.org/domains/root/db/schwarz.html
schwarz

// science : dot Science Limited
// https://www.iana.org/domains/root/db/science.html
science

// scot : Dot Scot Registry Limited
// https://www.iana.org/domains/root/db/scot.html
scot

// search : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/search.html
search

// seat : SEAT, S.A. (Sociedad Unipersonal)
// https://www.iana.org/domains/root/db/seat.html
seat

// secure : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/secure.html
secure

// security : XYZ.COM LLC
// https://www.iana.org/domains/root/db/security.html
security

// seek : Seek Limited
// https://www.iana.org/domains/root/db/seek.html
seek

// select : Registry Services, LLC
// https://www.iana.org/domains/root/db/select.html
select

// sener : Sener Ingeniería y Sistemas, S.A.
// https://www.iana.org/domains/root/db/sener.html
sener

// services : Binky Moon, LLC
// https://www.iana.org/domains/root/db/services.html
services

// seven : Seven West Media Ltd
// https://www.iana.org/domains/root/db/seven.html
seven

// sew : SEW-EURODRIVE GmbH & Co KG
// https://www.iana.org/domains/root/db/sew.html
sew

// sex : ICM Registry SX LLC
// https://www.iana.org/domains/root/db/sex.html
sex

// sexy : Internet Naming Company LLC
// https://www.iana.org/domains/root/db/sexy.html
sexy

// sfr : Societe Francaise du Radiotelephone - SFR
// https://www.iana.org/domains/root/db/sfr.html
sfr

// shangrila : Shangri‐La International Hotel Management Limited
// https://www.iana.org/domains/root/db/shangrila.html
shangrila

// sharp : Sharp Corporation
// https://www.iana.org/domains/root/db/sharp.html
sharp

// shaw : Shaw Cablesystems G.P.
// https://www.iana.org/domains/root/db/shaw.html
shaw

// shell : Shell Information Technology International Inc
// https://www.iana.org/domains/root/db/shell.html
shell

// shia : Asia Green IT System Bilgisayar San. ve Tic. Ltd. Sti.
// https://www.iana.org/domains/root/db/shia.html
shia

// shiksha : Identity Digital Limited
// https://www.iana.org/domains/root/db/shiksha.html
shiksha

// shoes : Binky Moon, LLC
// https://www.iana.org/domains/root/db/shoes.html
shoes

// shop : GMO Registry, Inc.
// https://www.iana.org/domains/root/db/shop.html
shop

// shopping : Binky Moon, LLC
// https://www.iana.org/domains/root/db/shopping.html
shopping

// shouji : Beijing Qihu Keji Co., Ltd.
// https://www.iana.org/domains/root/db/shouji.html
shouji

// show : Binky Moon, LLC
// https://www.iana.org/domains/root/db/show.html
show

// showtime : CBS Domains Inc.
// https://www.iana.org/domains/root/db/showtime.html
showtime

// silk : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/silk.html
silk

// sina : Sina Corporation
// https://www.iana.org/domains/root/db/sina.html
sina

// singles : Binky Moon, LLC
// https://www.iana.org/domains/root/db/singles.html
singles

// site : Radix FZC DMCC
// https://www.iana.org/domains/root/db/site.html
site

// ski : Identity Digital Limited
// https://www.iana.org/domains/root/db/ski.html
ski

// skin : XYZ.COM LLC
// https://www.iana.org/domains/root/db/skin.html
skin

// sky : Sky International AG
// https://www.iana.org/domains/root/db/sky.html
sky

// skype : Microsoft Corporation
// https://www.iana.org/domains/root/db/skype.html
skype

// sling : DISH Technologies L.L.C.
// https://www.iana.org/domains/root/db/sling.html
sling

// smart : Smart Communications, Inc. (SMART)
// https://www.iana.org/domains/root/db/smart.html
smart

// smile : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/smile.html
smile

// sncf : Société Nationale SNCF
// https://www.iana.org/domains/root/db/sncf.html
sncf

// soccer : Binky Moon, LLC
// https://www.iana.org/domains/root/db/soccer.html
soccer

// social : Dog Beach, LLC
// https://www.iana.org/domains/root/db/social.html
social

// softbank : SoftBank Group Corp.
// https://www.iana.org/domains/root/db/softbank.html
softbank

// software : Dog Beach, LLC
// https://www.iana.org/domains/root/db/software.html
software

// sohu : Sohu.com Limited
// https://www.iana.org/domains/root/db/sohu.html
sohu

// solar : Binky Moon, LLC
// https://www.iana.org/domains/root/db/solar.html
solar

// solutions : Binky Moon, LLC
// https://www.iana.org/domains/root/db/solutions.html
solutions

// song : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/song.html
song

// sony : Sony Corporation
// https://www.iana.org/domains/root/db/sony.html
sony

// soy : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/soy.html
soy

// spa : Asia Spa and Wellness Promotion Council Limited
// https://www.iana.org/domains/root/db/spa.html
spa

// space : Radix FZC DMCC
// https://www.iana.org/domains/root/db/space.html
space

// sport : SportAccord
// https://www.iana.org/domains/root/db/sport.html
sport

// spot : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/spot.html
spot

// srl : InterNetX, Corp
// https://www.iana.org/domains/root/db/srl.html
srl

// stada : STADA Arzneimittel AG
// https://www.iana.org/domains/root/db/stada.html
stada

// staples : Staples, Inc.
// https://www.iana.org/domains/root/db/staples.html
staples

// star : Star India Private Limited
// https://www.iana.org/domains/root/db/star.html
star

// statebank : STATE BANK OF INDIA
// https://www.iana.org/domains/root/db/statebank.html
statebank

// statefarm : State Farm Mutual Automobile Insurance Company
// https://www.iana.org/domains/root/db/statefarm.html
statefarm

// stc : Saudi Telecom Company
// https://www.iana.org/domains/root/db/stc.html
stc

// stcgroup : Saudi Telecom Company
// https://www.iana.org/domains/root/db/stcgroup.html
stcgroup

// stockholm : Stockholms kommun
// https://www.iana.org/domains/root/db/stockholm.html
stockholm

// storage : XYZ.COM LLC
// https://www.iana.org/domains/root/db/storage.html
storage

// store : Radix FZC DMCC
// https://www.iana.org/domains/root/db/store.html
store

// stream : dot Stream Limited
// https://www.iana.org/domains/root/db/stream.html
stream

// studio : Dog Beach, LLC
// https://www.iana.org/domains/root/db/studio.html
studio

// study : Registry Services, LLC
// https://www.iana.org/domains/root/db/study.html
study

// style : Binky Moon, LLC
// https://www.iana.org/domains/root/db/style.html
style

// sucks : Vox Populi Registry Ltd.
// https://www.iana.org/domains/root/db/sucks.html
sucks

// supplies : Binky Moon, LLC
// https://www.iana.org/domains/root/db/supplies.html
supplies

// supply : Binky Moon, LLC
// https://www.iana.org/domains/root/db/supply.html
supply

// support : Binky Moon, LLC
// https://www.iana.org/domains/root/db/support.html
support

// surf : Registry Services, LLC
// https://www.iana.org/domains/root/db/surf.html
surf

// surgery : Binky Moon, LLC
// https://www.iana.org/domains/root/db/surgery.html
surgery

// suzuki : SUZUKI MOTOR CORPORATION
// https://www.iana.org/domains/root/db/suzuki.html
suzuki

// swatch : The Swatch Group Ltd
// https://www.iana.org/domains/root/db/swatch.html
swatch

// swiss : Swiss Confederation
// https://www.iana.org/domains/root/db/swiss.html
swiss

// sydney : State of New South Wales, Department of Premier and Cabinet
// https://www.iana.org/domains/root/db/sydney.html
sydney

// systems : Binky Moon, LLC
// https://www.iana.org/domains/root/db/systems.html
systems

// tab : Tabcorp Holdings Limited
// https://www.iana.org/domains/root/db/tab.html
tab

// taipei : Taipei City Government
// https://www.iana.org/domains/root/db/taipei.html
taipei

// talk : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/talk.html
talk

// taobao : Alibaba Group Holding Limited
// https://www.iana.org/domains/root/db/taobao.html
taobao

// target : Target Domain Holdings, LLC
// https://www.iana.org/domains/root/db/target.html
target

// tatamotors : Tata Motors Ltd
// https://www.iana.org/domains/root/db/tatamotors.html
tatamotors

// tatar : Limited Liability Company "Coordination Center of Regional Domain of Tatarstan Republic"
// https://www.iana.org/domains/root/db/tatar.html
tatar

// tattoo : Registry Services, LLC
// https://www.iana.org/domains/root/db/tattoo.html
tattoo

// tax : Binky Moon, LLC
// https://www.iana.org/domains/root/db/tax.html
tax

// taxi : Binky Moon, LLC
// https://www.iana.org/domains/root/db/taxi.html
taxi

// tci : Asia Green IT System Bilgisayar San. ve Tic. Ltd. Sti.
// https://www.iana.org/domains/root/db/tci.html
tci

// tdk : TDK Corporation
// https://www.iana.org/domains/root/db/tdk.html
tdk

// team : Binky Moon, LLC
// https://www.iana.org/domains/root/db/team.html
team

// tech : Radix FZC DMCC
// https://www.iana.org/domains/root/db/tech.html
tech

// technology : Binky Moon, LLC
// https://www.iana.org/domains/root/db/technology.html
technology

// temasek : Temasek Holdings (Private) Limited
// https://www.iana.org/domains/root/db/temasek.html
temasek

// tennis : Binky Moon, LLC
// https://www.iana.org/domains/root/db/tennis.html
tennis

// teva : Teva Pharmaceutical Industries Limited
// https://www.iana.org/domains/root/db/teva.html
teva

// thd : Home Depot Product Authority, LLC
// https://www.iana.org/domains/root/db/thd.html
thd

// theater : Binky Moon, LLC
// https://www.iana.org/domains/root/db/theater.html
theater

// theatre : XYZ.COM LLC
// https://www.iana.org/domains/root/db/theatre.html
theatre

// tiaa : Teachers Insurance and Annuity Association of America
// https://www.iana.org/domains/root/db/tiaa.html
tiaa

// tickets : XYZ.COM LLC
// https://www.iana.org/domains/root/db/tickets.html
tickets

// tienda : Binky Moon, LLC
// https://www.iana.org/domains/root/db/tienda.html
tienda

// tips : Binky Moon, LLC
// https://www.iana.org/domains/root/db/tips.html
tips

// tires : Binky Moon, LLC
// https://www.iana.org/domains/root/db/tires.html
tires

// tirol : punkt Tirol GmbH
// https://www.iana.org/domains/root/db/tirol.html
tirol

// tjmaxx : The TJX Companies, Inc.
// https://www.iana.org/domains/root/db/tjmaxx.html
tjmaxx

// tjx : The TJX Companies, Inc.
// https://www.iana.org/domains/root/db/tjx.html
tjx

// tkmaxx : The TJX Companies, Inc.
// https://www.iana.org/domains/root/db/tkmaxx.html
tkmaxx

// tmall : Alibaba Group Holding Limited
// https://www.iana.org/domains/root/db/tmall.html
tmall

// today : Binky Moon, LLC
// https://www.iana.org/domains/root/db/today.html
today

// tokyo : GMO Registry, Inc.
// https://www.iana.org/domains/root/db/tokyo.html
tokyo

// tools : Binky Moon, LLC
// https://www.iana.org/domains/root/db/tools.html
tools

// top : .TOP Registry
// https://www.iana.org/domains/root/db/top.html
top

// toray : Toray Industries, Inc.
// https://www.iana.org/domains/root/db/toray.html
toray

// toshiba : TOSHIBA Corporation
// https://www.iana.org/domains/root/db/toshiba.html
toshiba

// total : TotalEnergies SE
// https://www.iana.org/domains/root/db/total.html
total

// tours : Binky Moon, LLC
// https://www.iana.org/domains/root/db/tours.html
tours

// town : Binky Moon, LLC
// https://www.iana.org/domains/root/db/town.html
town

// toyota : TOYOTA MOTOR CORPORATION
// https://www.iana.org/domains/root/db/toyota.html
toyota

// toys : Binky Moon, LLC
// https://www.iana.org/domains/root/db/toys.html
toys

// trade : Elite Registry Limited
// https://www.iana.org/domains/root/db/trade.html
trade

// trading : Dog Beach, LLC
// https://www.iana.org/domains/root/db/trading.html
trading

// training : Binky Moon, LLC
// https://www.iana.org/domains/root/db/training.html
training

// travel : Dog Beach, LLC
// https://www.iana.org/domains/root/db/travel.html
travel

// travelers : Travelers TLD, LLC
// https://www.iana.org/domains/root/db/travelers.html
travelers

// travelersinsurance : Travelers TLD, LLC
// https://www.iana.org/domains/root/db/travelersinsurance.html
travelersinsurance

// trust : Internet Naming Company LLC
// https://www.iana.org/domains/root/db/trust.html
trust

// trv : Travelers TLD, LLC
// https://www.iana.org/domains/root/db/trv.html
trv

// tube : Latin American Telecom LLC
// https://www.iana.org/domains/root/db/tube.html
tube

// tui : TUI AG
// https://www.iana.org/domains/root/db/tui.html
tui

// tunes : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/tunes.html
tunes

// tushu : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/tushu.html
tushu

// tvs : T V SUNDRAM IYENGAR  & SONS LIMITED
// https://www.iana.org/domains/root/db/tvs.html
tvs

// ubank : National Australia Bank Limited
// https://www.iana.org/domains/root/db/ubank.html
ubank

// ubs : UBS AG
// https://www.iana.org/domains/root/db/ubs.html
ubs

// unicom : China United Network Communications Corporation Limited
// https://www.iana.org/domains/root/db/unicom.html
unicom

// university : Binky Moon, LLC
// https://www.iana.org/domains/root/db/university.html
university

// uno : Radix FZC DMCC
// https://www.iana.org/domains/root/db/uno.html
uno

// uol : UBN INTERNET LTDA.
// https://www.iana.org/domains/root/db/uol.html
uol

// ups : UPS Market Driver, Inc.
// https://www.iana.org/domains/root/db/ups.html
ups

// vacations : Binky Moon, LLC
// https://www.iana.org/domains/root/db/vacations.html
vacations

// vana : Lifestyle Domain Holdings, Inc.
// https://www.iana.org/domains/root/db/vana.html
vana

// vanguard : The Vanguard Group, Inc.
// https://www.iana.org/domains/root/db/vanguard.html
vanguard

// vegas : Dot Vegas, Inc.
// https://www.iana.org/domains/root/db/vegas.html
vegas

// ventures : Binky Moon, LLC
// https://www.iana.org/domains/root/db/ventures.html
ventures

// verisign : VeriSign, Inc.
// https://www.iana.org/domains/root/db/verisign.html
verisign

// versicherung : tldbox GmbH
// https://www.iana.org/domains/root/db/versicherung.html
versicherung

// vet : Dog Beach, LLC
// https://www.iana.org/domains/root/db/vet.html
vet

// viajes : Binky Moon, LLC
// https://www.iana.org/domains/root/db/viajes.html
viajes

// video : Dog Beach, LLC
// https://www.iana.org/domains/root/db/video.html
video

// vig : VIENNA INSURANCE GROUP AG Wiener Versicherung Gruppe
// https://www.iana.org/domains/root/db/vig.html
vig

// viking : Viking River Cruises (Bermuda) Ltd.
// https://www.iana.org/domains/root/db/viking.html
viking

// villas : Binky Moon, LLC
// https://www.iana.org/domains/root/db/villas.html
villas

// vin : Binky Moon, LLC
// https://www.iana.org/domains/root/db/vin.html
vin

// vip : Registry Services, LLC
// https://www.iana.org/domains/root/db/vip.html
vip

// virgin : Virgin Enterprises Limited
// https://www.iana.org/domains/root/db/virgin.html
virgin

// visa : Visa Worldwide Pte. Limited
// https://www.iana.org/domains/root/db/visa.html
visa

// vision : Binky Moon, LLC
// https://www.iana.org/domains/root/db/vision.html
vision

// viva : Saudi Telecom Company
// https://www.iana.org/domains/root/db/viva.html
viva

// vivo : Telefonica Brasil S.A.
// https://www.iana.org/domains/root/db/vivo.html
vivo

// vlaanderen : DNS.be vzw
// https://www.iana.org/domains/root/db/vlaanderen.html
vlaanderen

// vodka : Registry Services, LLC
// https://www.iana.org/domains/root/db/vodka.html
vodka

// volkswagen : Volkswagen Group of America Inc.
// https://www.iana.org/domains/root/db/volkswagen.html
volkswagen

// volvo : Volvo Holding Sverige Aktiebolag
// https://www.iana.org/domains/root/db/volvo.html
volvo

// vote : Monolith Registry LLC
// https://www.iana.org/domains/root/db/vote.html
vote

// voting : Valuetainment Corp.
// https://www.iana.org/domains/root/db/voting.html
voting

// voto : Monolith Registry LLC
// https://www.iana.org/domains/root/db/voto.html
voto

// voyage : Binky Moon, LLC
// https://www.iana.org/domains/root/db/voyage.html
voyage

// wales : Nominet UK
// https://www.iana.org/domains/root/db/wales.html
wales

// walmart : Wal-Mart Stores, Inc.
// https://www.iana.org/domains/root/db/walmart.html
walmart

// walter : Sandvik AB
// https://www.iana.org/domains/root/db/walter.html
walter

// wang : Zodiac Wang Limited
// https://www.iana.org/domains/root/db/wang.html
wang

// wanggou : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/wanggou.html
wanggou

// watch : Binky Moon, LLC
// https://www.iana.org/domains/root/db/watch.html
watch

// watches : Identity Digital Limited
// https://www.iana.org/domains/root/db/watches.html
watches

// weather : International Business Machines Corporation
// https://www.iana.org/domains/root/db/weather.html
weather

// weatherchannel : International Business Machines Corporation
// https://www.iana.org/domains/root/db/weatherchannel.html
weatherchannel

// webcam : dot Webcam Limited
// https://www.iana.org/domains/root/db/webcam.html
webcam

// weber : Saint-Gobain Weber SA
// https://www.iana.org/domains/root/db/weber.html
weber

// website : Radix FZC DMCC
// https://www.iana.org/domains/root/db/website.html
website

// wedding : Registry Services, LLC
// https://www.iana.org/domains/root/db/wedding.html
wedding

// weibo : Sina Corporation
// https://www.iana.org/domains/root/db/weibo.html
weibo

// weir : Weir Group IP Limited
// https://www.iana.org/domains/root/db/weir.html
weir

// whoswho : Who's Who Registry
// https://www.iana.org/domains/root/db/whoswho.html
whoswho

// wien : punkt.wien GmbH
// https://www.iana.org/domains/root/db/wien.html
wien

// wiki : Registry Services, LLC
// https://www.iana.org/domains/root/db/wiki.html
wiki

// williamhill : William Hill Organization Limited
// https://www.iana.org/domains/root/db/williamhill.html
williamhill

// win : First Registry Limited
// https://www.iana.org/domains/root/db/win.html
win

// windows : Microsoft Corporation
// https://www.iana.org/domains/root/db/windows.html
windows

// wine : Binky Moon, LLC
// https://www.iana.org/domains/root/db/wine.html
wine

// winners : The TJX Companies, Inc.
// https://www.iana.org/domains/root/db/winners.html
winners

// wme : William Morris Endeavor Entertainment, LLC
// https://www.iana.org/domains/root/db/wme.html
wme

// wolterskluwer : Wolters Kluwer N.V.
// https://www.iana.org/domains/root/db/wolterskluwer.html
wolterskluwer

// woodside : Woodside Petroleum Limited
// https://www.iana.org/domains/root/db/woodside.html
woodside

// work : Registry Services, LLC
// https://www.iana.org/domains/root/db/work.html
work

// works : Binky Moon, LLC
// https://www.iana.org/domains/root/db/works.html
works

// world : Binky Moon, LLC
// https://www.iana.org/domains/root/db/world.html
world

// wow : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/wow.html
wow

// wtc : World Trade Centers Association, Inc.
// https://www.iana.org/domains/root/db/wtc.html
wtc

// wtf : Binky Moon, LLC
// https://www.iana.org/domains/root/db/wtf.html
wtf

// xbox : Microsoft Corporation
// https://www.iana.org/domains/root/db/xbox.html
xbox

// xerox : Xerox DNHC LLC
// https://www.iana.org/domains/root/db/xerox.html
xerox

// xfinity : Comcast IP Holdings I, LLC
// https://www.iana.org/domains/root/db/xfinity.html
xfinity

// xihuan : Beijing Qihu Keji Co., Ltd.
// https://www.iana.org/domains/root/db/xihuan.html
xihuan

// xin : Elegant Leader Limited
// https://www.iana.org/domains/root/db/xin.html
xin

// xn--11b4c3d : VeriSign Sarl
// https://www.iana.org/domains/root/db/xn--11b4c3d.html
कॉम

// xn--1ck2e1b : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/xn--1ck2e1b.html
セール

// xn--1qqw23a : Guangzhou YU Wei Information Technology Co., Ltd.
// https://www.iana.org/domains/root/db/xn--1qqw23a.html
佛山

// xn--30rr7y : Excellent First Limited
// https://www.iana.org/domains/root/db/xn--30rr7y.html
慈善

// xn--3bst00m : Eagle Horizon Limited
// https://www.iana.org/domains/root/db/xn--3bst00m.html
集团

// xn--3ds443g : TLD REGISTRY LIMITED OY
// https://www.iana.org/domains/root/db/xn--3ds443g.html
在线

// xn--3pxu8k : VeriSign Sarl
// https://www.iana.org/domains/root/db/xn--3pxu8k.html
点看

// xn--42c2d9a : VeriSign Sarl
// https://www.iana.org/domains/root/db/xn--42c2d9a.html
คอม

// xn--45q11c : Zodiac Gemini Ltd
// https://www.iana.org/domains/root/db/xn--45q11c.html
八卦

// xn--4gbrim : Helium TLDs Ltd
// https://www.iana.org/domains/root/db/xn--4gbrim.html
موقع

// xn--55qw42g : China Organizational Name Administration Center
// https://www.iana.org/domains/root/db/xn--55qw42g.html
公益

// xn--55qx5d : China Internet Network Information Center (CNNIC)
// https://www.iana.org/domains/root/db/xn--55qx5d.html
公司

// xn--5su34j936bgsg : Shangri‐La International Hotel Management Limited
// https://www.iana.org/domains/root/db/xn--5su34j936bgsg.html
香格里拉

// xn--5tzm5g : Global Website TLD Asia Limited
// https://www.iana.org/domains/root/db/xn--5tzm5g.html
网站

// xn--6frz82g : Identity Digital Limited
// https://www.iana.org/domains/root/db/xn--6frz82g.html
移动

// xn--6qq986b3xl : Tycoon Treasure Limited
// https://www.iana.org/domains/root/db/xn--6qq986b3xl.html
我爱你

// xn--80adxhks : Foundation for Assistance for Internet Technologies and Infrastructure Development (FAITID)
// https://www.iana.org/domains/root/db/xn--80adxhks.html
москва

// xn--80aqecdr1a : Pontificium Consilium de Comunicationibus Socialibus (PCCS) (Pontifical Council for Social Communication)
// https://www.iana.org/domains/root/db/xn--80aqecdr1a.html
католик

// xn--80asehdb : CORE Association
// https://www.iana.org/domains/root/db/xn--80asehdb.html
онлайн

// xn--80aswg : CORE Association
// https://www.iana.org/domains/root/db/xn--80aswg.html
сайт

// xn--8y0a063a : China United Network Communications Corporation Limited
// https://www.iana.org/domains/root/db/xn--8y0a063a.html
联通

// xn--9dbq2a : VeriSign Sarl
// https://www.iana.org/domains/root/db/xn--9dbq2a.html
קום

// xn--9et52u : RISE VICTORY LIMITED
// https://www.iana.org/domains/root/db/xn--9et52u.html
时尚

// xn--9krt00a : Sina Corporation
// https://www.iana.org/domains/root/db/xn--9krt00a.html
微博

// xn--b4w605ferd : Temasek Holdings (Private) Limited
// https://www.iana.org/domains/root/db/xn--b4w605ferd.html
淡马锡

// xn--bck1b9a5dre4c : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/xn--bck1b9a5dre4c.html
ファッション

// xn--c1avg : Public Interest Registry
// https://www.iana.org/domains/root/db/xn--c1avg.html
орг

// xn--c2br7g : VeriSign Sarl
// https://www.iana.org/domains/root/db/xn--c2br7g.html
नेट

// xn--cck2b3b : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/xn--cck2b3b.html
ストア

// xn--cckwcxetd : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/xn--cckwcxetd.html
アマゾン

// xn--cg4bki : SAMSUNG SDS CO., LTD
// https://www.iana.org/domains/root/db/xn--cg4bki.html
삼성

// xn--czr694b : Internet DotTrademark Organisation Limited
// https://www.iana.org/domains/root/db/xn--czr694b.html
商标

// xn--czrs0t : Binky Moon, LLC
// https://www.iana.org/domains/root/db/xn--czrs0t.html
商店

// xn--czru2d : Zodiac Aquarius Limited
// https://www.iana.org/domains/root/db/xn--czru2d.html
商城

// xn--d1acj3b : The Foundation for Network Initiatives “The Smart Internet”
// https://www.iana.org/domains/root/db/xn--d1acj3b.html
дети

// xn--eckvdtc9d : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/xn--eckvdtc9d.html
ポイント

// xn--efvy88h : Guangzhou YU Wei Information Technology Co., Ltd.
// https://www.iana.org/domains/root/db/xn--efvy88h.html
新闻

// xn--fct429k : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/xn--fct429k.html
家電

// xn--fhbei : VeriSign Sarl
// https://www.iana.org/domains/root/db/xn--fhbei.html
كوم

// xn--fiq228c5hs : TLD REGISTRY LIMITED OY
// https://www.iana.org/domains/root/db/xn--fiq228c5hs.html
中文网

// xn--fiq64b : CITIC Group Corporation
// https://www.iana.org/domains/root/db/xn--fiq64b.html
中信

// xn--fjq720a : Binky Moon, LLC
// https://www.iana.org/domains/root/db/xn--fjq720a.html
娱乐

// xn--flw351e : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/xn--flw351e.html
谷歌

// xn--fzys8d69uvgm : PCCW Enterprises Limited
// https://www.iana.org/domains/root/db/xn--fzys8d69uvgm.html
電訊盈科

// xn--g2xx48c : Nawang Heli(Xiamen) Network Service Co., LTD.
// https://www.iana.org/domains/root/db/xn--g2xx48c.html
购物

// xn--gckr3f0f : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/xn--gckr3f0f.html
クラウド

// xn--gk3at1e : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/xn--gk3at1e.html
通販

// xn--hxt814e : Zodiac Taurus Limited
// https://www.iana.org/domains/root/db/xn--hxt814e.html
网店

// xn--i1b6b1a6a2e : Public Interest Registry
// https://www.iana.org/domains/root/db/xn--i1b6b1a6a2e.html
संगठन

// xn--imr513n : Internet DotTrademark Organisation Limited
// https://www.iana.org/domains/root/db/xn--imr513n.html
餐厅

// xn--io0a7i : China Internet Network Information Center (CNNIC)
// https://www.iana.org/domains/root/db/xn--io0a7i.html
网络

// xn--j1aef : VeriSign Sarl
// https://www.iana.org/domains/root/db/xn--j1aef.html
ком

// xn--jlq480n2rg : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/xn--jlq480n2rg.html
亚马逊

// xn--jvr189m : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/xn--jvr189m.html
食品

// xn--kcrx77d1x4a : Koninklijke Philips N.V.
// https://www.iana.org/domains/root/db/xn--kcrx77d1x4a.html
飞利浦

// xn--kput3i : Beijing RITT-Net Technology Development Co., Ltd
// https://www.iana.org/domains/root/db/xn--kput3i.html
手机

// xn--mgba3a3ejt : Aramco Services Company
// https://www.iana.org/domains/root/db/xn--mgba3a3ejt.html
ارامكو

// xn--mgba7c0bbn0a : Competrol (Luxembourg) Sarl
// https://www.iana.org/domains/root/db/xn--mgba7c0bbn0a.html
العليان

// xn--mgbaakc7dvf : Emirates Telecommunications Corporation (trading as Etisalat)
// https://www.iana.org/domains/root/db/xn--mgbaakc7dvf.html
اتصالات

// xn--mgbab2bd : CORE Association
// https://www.iana.org/domains/root/db/xn--mgbab2bd.html
بازار

// xn--mgbca7dzdo : Abu Dhabi Systems and Information Centre
// https://www.iana.org/domains/root/db/xn--mgbca7dzdo.html
ابوظبي

// xn--mgbi4ecexp : Pontificium Consilium de Comunicationibus Socialibus (PCCS) (Pontifical Council for Social Communication)
// https://www.iana.org/domains/root/db/xn--mgbi4ecexp.html
كاثوليك

// xn--mgbt3dhd : Asia Green IT System Bilgisayar San. ve Tic. Ltd. Sti.
// https://www.iana.org/domains/root/db/xn--mgbt3dhd.html
همراه

// xn--mk1bu44c : VeriSign Sarl
// https://www.iana.org/domains/root/db/xn--mk1bu44c.html
닷컴

// xn--mxtq1m : Net-Chinese Co., Ltd.
// https://www.iana.org/domains/root/db/xn--mxtq1m.html
政府

// xn--ngbc5azd : International Domain Registry Pty. Ltd.
// https://www.iana.org/domains/root/db/xn--ngbc5azd.html
شبكة

// xn--ngbe9e0a : Kuwait Finance House
// https://www.iana.org/domains/root/db/xn--ngbe9e0a.html
بيتك

// xn--ngbrx : League of Arab States
// https://www.iana.org/domains/root/db/xn--ngbrx.html
عرب

// xn--nqv7f : Public Interest Registry
// https://www.iana.org/domains/root/db/xn--nqv7f.html
机构

// xn--nqv7fs00ema : Public Interest Registry
// https://www.iana.org/domains/root/db/xn--nqv7fs00ema.html
组织机构

// xn--nyqy26a : Stable Tone Limited
// https://www.iana.org/domains/root/db/xn--nyqy26a.html
健康

// xn--otu796d : Jiang Yu Liang Cai Technology Company Limited
// https://www.iana.org/domains/root/db/xn--otu796d.html
招聘

// xn--p1acf : Rusnames Limited
// https://www.iana.org/domains/root/db/xn--p1acf.html
рус

// xn--pssy2u : VeriSign Sarl
// https://www.iana.org/domains/root/db/xn--pssy2u.html
大拿

// xn--q9jyb4c : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/xn--q9jyb4c.html
みんな

// xn--qcka1pmc : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/xn--qcka1pmc.html
グーグル

// xn--rhqv96g : Stable Tone Limited
// https://www.iana.org/domains/root/db/xn--rhqv96g.html
世界

// xn--rovu88b : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/xn--rovu88b.html
書籍

// xn--ses554g : KNET Co., Ltd.
// https://www.iana.org/domains/root/db/xn--ses554g.html
网址

// xn--t60b56a : VeriSign Sarl
// https://www.iana.org/domains/root/db/xn--t60b56a.html
닷넷

// xn--tckwe : VeriSign Sarl
// https://www.iana.org/domains/root/db/xn--tckwe.html
コム

// xn--tiq49xqyj : Pontificium Consilium de Comunicationibus Socialibus (PCCS) (Pontifical Council for Social Communication)
// https://www.iana.org/domains/root/db/xn--tiq49xqyj.html
天主教

// xn--unup4y : Binky Moon, LLC
// https://www.iana.org/domains/root/db/xn--unup4y.html
游戏

// xn--vermgensberater-ctb : Deutsche Vermögensberatung Aktiengesellschaft DVAG
// https://www.iana.org/domains/root/db/xn--vermgensberater-ctb.html
vermögensberater

// xn--vermgensberatung-pwb : Deutsche Vermögensberatung Aktiengesellschaft DVAG
// https://www.iana.org/domains/root/db/xn--vermgensberatung-pwb.html
vermögensberatung

// xn--vhquv : Binky Moon, LLC
// https://www.iana.org/domains/root/db/xn--vhquv.html
企业

// xn--vuq861b : Beijing Tele-info Technology Co., Ltd.
// https://www.iana.org/domains/root/db/xn--vuq861b.html
信息

// xn--w4r85el8fhu5dnra : Kerry Trading Co. Limited
// https://www.iana.org/domains/root/db/xn--w4r85el8fhu5dnra.html
嘉里大酒店

// xn--w4rs40l : Kerry Trading Co. Limited
// https://www.iana.org/domains/root/db/xn--w4rs40l.html
嘉里

// xn--xhq521b : Guangzhou YU Wei Information Technology Co., Ltd.
// https://www.iana.org/domains/root/db/xn--xhq521b.html
广东

// xn--zfr164b : China Organizational Name Administration Center
// https://www.iana.org/domains/root/db/xn--zfr164b.html
政务

// xyz : XYZ.COM LLC
// https://www.iana.org/domains/root/db/xyz.html
xyz

// yachts : XYZ.COM LLC
// https://www.iana.org/domains/root/db/yachts.html
yachts

// yahoo : Oath Inc.
// https://www.iana.org/domains/root/db/yahoo.html
yahoo

// yamaxun : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/yamaxun.html
yamaxun

// yandex : Yandex Europe B.V.
// https://www.iana.org/domains/root/db/yandex.html
yandex

// yodobashi : YODOBASHI CAMERA CO.,LTD.
// https://www.iana.org/domains/root/db/yodobashi.html
yodobashi

// yoga : Registry Services, LLC
// https://www.iana.org/domains/root/db/yoga.html
yoga

// yokohama : GMO Registry, Inc.
// https://www.iana.org/domains/root/db/yokohama.html
yokohama

// you : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/you.html
you

// youtube : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/youtube.html
youtube

// yun : Beijing Qihu Keji Co., Ltd.
// https://www.iana.org/domains/root/db/yun.html
yun

// zappos : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/zappos.html
zappos

// zara : Industria de Diseño Textil, S.A. (INDITEX, S.A.)
// https://www.iana.org/domains/root/db/zara.html
zara

// zero : Amazon Registry Services, Inc.
// https://www.iana.org/domains/root/db/zero.html
zero

// zip : Charleston Road Registry Inc.
// https://www.iana.org/domains/root/db/zip.html
zip

// zone : Binky Moon, LLC
// https://www.iana.org/domains/root/db/zone.html
zone

// zuerich : Kanton Zürich (Canton of Zurich)
// https://www.iana.org/domains/root/db/zuerich.html
zuerich


// ===END ICANN DOMAINS===
// ===BEGIN PRIVATE DOMAINS===
// (Note: these are in alphabetical order by company name)

// 1GB LLC : https://www.1gb.ua/
// Submitted by 1GB LLC <noc@1gb.com.ua>
cc.ua
inf.ua
ltd.ua

// 611coin : https://611project.org/
611.to

// Aaron Marais' Gitlab pages: https://lab.aaronleem.co.za
// Submitted by Aaron Marais <its_me@aaronleem.co.za>
graphox.us

// accesso Technology Group, plc. : https://accesso.com/
// Submitted by accesso Team <accessoecommerce@accesso.com>
*.devcdnaccesso.com

// Acorn Labs : https://acorn.io
// Submitted by Craig Jellick <domains@acorn.io>
*.on-acorn.io

// ActiveTrail: https://www.activetrail.biz/
// Submitted by Ofer Kalaora <postmaster@activetrail.com>
activetrail.biz

// Adobe : https://www.adobe.com/
// Submitted by Ian Boston <boston@adobe.com> and Lars Trieloff <trieloff@adobe.com>
adobeaemcloud.com
*.dev.adobeaemcloud.com
hlx.live
adobeaemcloud.net
hlx.page
hlx3.page

// Adobe Developer Platform : https://developer.adobe.com
// Submitted by Jesse MacFadyen<jessem@adobe.com>
adobeio-static.net
adobeioruntime.net

// Agnat sp. z o.o. : https://domena.pl
// Submitted by Przemyslaw Plewa <it-admin@domena.pl>
beep.pl

// Airkit : https://www.airkit.com/
// Submitted by Grant Cooksey <security@airkit.com>
airkitapps.com
airkitapps-au.com
airkitapps.eu

// Aiven: https://aiven.io/
// Submitted by Etienne Stalmans <security@aiven.io>
aivencloud.com

// Akamai : https://www.akamai.com/
// Submitted by Akamai Team <publicsuffixlist@akamai.com>
akadns.net
akamai.net
akamai-staging.net
akamaiedge.net
akamaiedge-staging.net
akamaihd.net
akamaihd-staging.net
akamaiorigin.net
akamaiorigin-staging.net
akamaized.net
akamaized-staging.net
edgekey.net
edgekey-staging.net
edgesuite.net
edgesuite-staging.net

// alboto.ca : http://alboto.ca
// Submitted by Anton Avramov <avramov@alboto.ca>
barsy.ca

// Alces Software Ltd : http://alces-software.com
// Submitted by Mark J. Titorenko <mark.titorenko@alces-software.com>
*.compute.estate
*.alces.network

// all-inkl.com : https://all-inkl.com
// Submitted by Werner Kaltofen <wk@all-inkl.com>
kasserver.com

// Altervista: https://www.altervista.org
// Submitted by Carlo Cannas <tech_staff@altervista.it>
altervista.org

// alwaysdata : https://www.alwaysdata.com
// Submitted by Cyril <admin@alwaysdata.com>
alwaysdata.net

// Amaze Software : https://amaze.co
// Submitted by Domain Admin <domainadmin@amaze.co>
myamaze.net

// Amazon : https://www.amazon.com/
// Submitted by AWS Security <psl-maintainers@amazon.com>
// Subsections of Amazon/subsidiaries will appear until "concludes" tag

// Amazon CloudFront
// Submitted by Donavan Miller <donavanm@amazon.com>
// Reference: 54144616-fd49-4435-8535-19c6a601bdb3
cloudfront.net

// Amazon EC2
// Submitted by Luke Wells <psl-maintainers@amazon.com>
// Reference: 4c38fa71-58ac-4768-99e5-689c1767e537
*.compute.amazonaws.com
*.compute-1.amazonaws.com
*.compute.amazonaws.com.cn
us-east-1.amazonaws.com

// Amazon S3
// Submitted by Luke Wells <psl-maintainers@amazon.com>
// Reference: d068bd97-f0a9-4838-a6d8-954b622ef4ae
s3.cn-north-1.amazonaws.com.cn
s3.dualstack.ap-northeast-1.amazonaws.com
s3.dualstack.ap-northeast-2.amazonaws.com
s3.ap-northeast-2.amazonaws.com
s3-website.ap-northeast-2.amazonaws.com
s3.dualstack.ap-south-1.amazonaws.com
s3.ap-south-1.amazonaws.com
s3-website.ap-south-1.amazonaws.com
s3.dualstack.ap-southeast-1.amazonaws.com
s3.dualstack.ap-southeast-2.amazonaws.com
s3.dualstack.ca-central-1.amazonaws.com
s3.ca-central-1.amazonaws.com
s3-website.ca-central-1.amazonaws.com
s3.dualstack.eu-central-1.amazonaws.com
s3.eu-central-1.amazonaws.com
s3-website.eu-central-1.amazonaws.com
s3.dualstack.eu-west-1.amazonaws.com
s3.dualstack.eu-west-2.amazonaws.com
s3.eu-west-2.amazonaws.com
s3-website.eu-west-2.amazonaws.com
s3.dualstack.eu-west-3.amazonaws.com
s3.eu-west-3.amazonaws.com
s3-website.eu-west-3.amazonaws.com
s3.amazonaws.com
s3-ap-northeast-1.amazonaws.com
s3-ap-northeast-2.amazonaws.com
s3-ap-south-1.amazonaws.com
s3-ap-southeast-1.amazonaws.com
s3-ap-southeast-2.amazonaws.com
s3-ca-central-1.amazonaws.com
s3-eu-central-1.amazonaws.com
s3-eu-west-1.amazonaws.com
s3-eu-west-2.amazonaws.com
s3-eu-west-3.amazonaws.com
s3-external-1.amazonaws.com
s3-fips-us-gov-west-1.amazonaws.com
s3-sa-east-1.amazonaws.com
s3-us-east-2.amazonaws.com
s3-us-gov-west-1.amazonaws.com
s3-us-west-1.amazonaws.com
s3-us-west-2.amazonaws.com
s3-website-ap-northeast-1.amazonaws.com
s3-website-ap-southeast-1.amazonaws.com
s3-website-ap-southeast-2.amazonaws.com
s3-website-eu-west-1.amazonaws.com
s3-website-sa-east-1.amazonaws.com
s3-website-us-east-1.amazonaws.com
s3-website-us-west-1.amazonaws.com
s3-website-us-west-2.amazonaws.com
s3.dualstack.sa-east-1.amazonaws.com
s3.dualstack.us-east-1.amazonaws.com
s3.dualstack.us-east-2.amazonaws.com
s3.us-east-2.amazonaws.com
s3-website.us-east-2.amazonaws.com

// Analytics on AWS
// Submitted by AWS Security <psl-maintainers@amazon.com>
// Reference: c02c3a80-f8a0-4fd2-b719-48ea8b7c28de
analytics-gateway.ap-northeast-1.amazonaws.com
analytics-gateway.eu-west-1.amazonaws.com
analytics-gateway.us-east-1.amazonaws.com
analytics-gateway.us-east-2.amazonaws.com
analytics-gateway.us-west-2.amazonaws.com

// AWS Cloud9
// Submitted by: AWS Security <psl-maintainers@amazon.com>
// Reference: 05c44955-977c-4b57-938a-f2af92733f9f
webview-assets.aws-cloud9.af-south-1.amazonaws.com
vfs.cloud9.af-south-1.amazonaws.com
webview-assets.cloud9.af-south-1.amazonaws.com
webview-assets.aws-cloud9.ap-east-1.amazonaws.com
vfs.cloud9.ap-east-1.amazonaws.com
webview-assets.cloud9.ap-east-1.amazonaws.com
webview-assets.aws-cloud9.ap-northeast-1.amazonaws.com
vfs.cloud9.ap-northeast-1.amazonaws.com
webview-assets.cloud9.ap-northeast-1.amazonaws.com
webview-assets.aws-cloud9.ap-northeast-2.amazonaws.com
vfs.cloud9.ap-northeast-2.amazonaws.com
webview-assets.cloud9.ap-northeast-2.amazonaws.com
webview-assets.aws-cloud9.ap-northeast-3.amazonaws.com
vfs.cloud9.ap-northeast-3.amazonaws.com
webview-assets.cloud9.ap-northeast-3.amazonaws.com
webview-assets.aws-cloud9.ap-south-1.amazonaws.com
vfs.cloud9.ap-south-1.amazonaws.com
webview-assets.cloud9.ap-south-1.amazonaws.com
webview-assets.aws-cloud9.ap-southeast-1.amazonaws.com
vfs.cloud9.ap-southeast-1.amazonaws.com
webview-assets.cloud9.ap-southeast-1.amazonaws.com
webview-assets.aws-cloud9.ap-southeast-2.amazonaws.com
vfs.cloud9.ap-southeast-2.amazonaws.com
webview-assets.cloud9.ap-southeast-2.amazonaws.com
webview-assets.aws-cloud9.ca-central-1.amazonaws.com
vfs.cloud9.ca-central-1.amazonaws.com
webview-assets.cloud9.ca-central-1.amazonaws.com
webview-assets.aws-cloud9.eu-central-1.amazonaws.com
vfs.cloud9.eu-central-1.amazonaws.com
webview-assets.cloud9.eu-central-1.amazonaws.com
webview-assets.aws-cloud9.eu-north-1.amazonaws.com
vfs.cloud9.eu-north-1.amazonaws.com
webview-assets.cloud9.eu-north-1.amazonaws.com
webview-assets.aws-cloud9.eu-south-1.amazonaws.com
vfs.cloud9.eu-south-1.amazonaws.com
webview-assets.cloud9.eu-south-1.amazonaws.com
webview-assets.aws-cloud9.eu-west-1.amazonaws.com
vfs.cloud9.eu-west-1.amazonaws.com
webview-assets.cloud9.eu-west-1.amazonaws.com
webview-assets.aws-cloud9.eu-west-2.amazonaws.com
vfs.cloud9.eu-west-2.amazonaws.com
webview-assets.cloud9.eu-west-2.amazonaws.com
webview-assets.aws-cloud9.eu-west-3.amazonaws.com
vfs.cloud9.eu-west-3.amazonaws.com
webview-assets.cloud9.eu-west-3.amazonaws.com
webview-assets.aws-cloud9.me-south-1.amazonaws.com
vfs.cloud9.me-south-1.amazonaws.com
webview-assets.cloud9.me-south-1.amazonaws.com
webview-assets.aws-cloud9.sa-east-1.amazonaws.com
vfs.cloud9.sa-east-1.amazonaws.com
webview-assets.cloud9.sa-east-1.amazonaws.com
webview-assets.aws-cloud9.us-east-1.amazonaws.com
vfs.cloud9.us-east-1.amazonaws.com
webview-assets.cloud9.us-east-1.amazonaws.com
webview-assets.aws-cloud9.us-east-2.amazonaws.com
vfs.cloud9.us-east-2.amazonaws.com
webview-assets.cloud9.us-east-2.amazonaws.com
webview-assets.aws-cloud9.us-west-1.amazonaws.com
vfs.cloud9.us-west-1.amazonaws.com
webview-assets.cloud9.us-west-1.amazonaws.com
webview-assets.aws-cloud9.us-west-2.amazonaws.com
vfs.cloud9.us-west-2.amazonaws.com
webview-assets.cloud9.us-west-2.amazonaws.com

// AWS Elastic Beanstalk
// Submitted by Luke Wells <psl-maintainers@amazon.com>
// Reference: aa202394-43a0-4857-b245-8db04549137e
cn-north-1.eb.amazonaws.com.cn
cn-northwest-1.eb.amazonaws.com.cn
elasticbeanstalk.com
ap-northeast-1.elasticbeanstalk.com
ap-northeast-2.elasticbeanstalk.com
ap-northeast-3.elasticbeanstalk.com
ap-south-1.elasticbeanstalk.com
ap-southeast-1.elasticbeanstalk.com
ap-southeast-2.elasticbeanstalk.com
ca-central-1.elasticbeanstalk.com
eu-central-1.elasticbeanstalk.com
eu-west-1.elasticbeanstalk.com
eu-west-2.elasticbeanstalk.com
eu-west-3.elasticbeanstalk.com
sa-east-1.elasticbeanstalk.com
us-east-1.elasticbeanstalk.com
us-east-2.elasticbeanstalk.com
us-gov-west-1.elasticbeanstalk.com
us-west-1.elasticbeanstalk.com
us-west-2.elasticbeanstalk.com

// (AWS) Elastic Load Balancing
// Submitted by Luke Wells <psl-maintainers@amazon.com>
// Reference: 12a3d528-1bac-4433-a359-a395867ffed2
*.elb.amazonaws.com.cn
*.elb.amazonaws.com

// AWS Global Accelerator
// Submitted by Daniel Massaguer <psl-maintainers@amazon.com>
// Reference: d916759d-a08b-4241-b536-4db887383a6a
awsglobalaccelerator.com

// eero
// Submitted by Yue Kang <eero-dynamic-dns@amazon.com>
// Reference: 264afe70-f62c-4c02-8ab9-b5281ed24461
eero.online
eero-stage.online

// concludes Amazon

// Amune : https://amune.org/
// Submitted by Team Amune <cert@amune.org>
t3l3p0rt.net
tele.amune.org

// Apigee : https://apigee.com/
// Submitted by Apigee Security Team <security@apigee.com>
apigee.io

// Apphud : https://apphud.com
// Submitted by Alexander Selivanov <alex@apphud.com>
siiites.com

// Appspace : https://www.appspace.com
// Submitted by Appspace Security Team <security@appspace.com>
appspacehosted.com
appspaceusercontent.com

// Appudo UG (haftungsbeschränkt) : https://www.appudo.com
// Submitted by Alexander Hochbaum <admin@appudo.com>
appudo.net

// Aptible : https://www.aptible.com/
// Submitted by Thomas Orozco <thomas@aptible.com>
on-aptible.com

// ASEINet : https://www.aseinet.com/
// Submitted by Asei SEKIGUCHI <mail@aseinet.com>
user.aseinet.ne.jp
gv.vc
d.gv.vc

// Asociación Amigos de la Informática "Euskalamiga" : http://encounter.eus/
// Submitted by Hector Martin <marcan@euskalencounter.org>
user.party.eus

// Association potager.org : https://potager.org/
// Submitted by Lunar <jardiniers@potager.org>
pimienta.org
poivron.org
potager.org
sweetpepper.org

// ASUSTOR Inc. : http://www.asustor.com
// Submitted by Vincent Tseng <vincenttseng@asustor.com>
myasustor.com

// Atlassian : https://atlassian.com
// Submitted by Sam Smyth <devloop@atlassian.com>
cdn.prod.atlassian-dev.net

// Authentick UG (haftungsbeschränkt) : https://authentick.net
// Submitted by Lukas Reschke <lukas@authentick.net>
translated.page

// Autocode : https://autocode.com
// Submitted by Jacob Lee <jacob@autocode.com>
autocode.dev

// AVM : https://avm.de
// Submitted by Andreas Weise <a.weise@avm.de>
myfritz.net

// AVStack Pte. Ltd. : https://avstack.io
// Submitted by Jasper Hugo <jasper@avstack.io>
onavstack.net

// AW AdvisorWebsites.com Software Inc : https://advisorwebsites.com
// Submitted by James Kennedy <domains@advisorwebsites.com>
*.awdev.ca
*.advisor.ws

// AZ.pl sp. z.o.o: https://az.pl
// Submitted by Krzysztof Wolski <krzysztof.wolski@home.eu>
ecommerce-shop.pl

// b-data GmbH : https://www.b-data.io
// Submitted by Olivier Benz <olivier.benz@b-data.ch>
b-data.io

// backplane : https://www.backplane.io
// Submitted by Anthony Voutas <anthony@backplane.io>
backplaneapp.io

// Balena : https://www.balena.io
// Submitted by Petros Angelatos <petrosagg@balena.io>
balena-devices.com

// University of Banja Luka : https://unibl.org
// Domains for Republic of Srpska administrative entity.
// Submitted by Marko Ivanovic <kormang@hotmail.rs>
rs.ba

// Banzai Cloud
// Submitted by Janos Matyas <info@banzaicloud.com>
*.banzai.cloud
app.banzaicloud.io
*.backyards.banzaicloud.io

// BASE, Inc. : https://binc.jp
// Submitted by Yuya NAGASAWA <public-suffix-list@binc.jp>
base.ec
official.ec
buyshop.jp
fashionstore.jp
handcrafted.jp
kawaiishop.jp
supersale.jp
theshop.jp
shopselect.net
base.shop

// BeagleBoard.org Foundation : https://beagleboard.org
// Submitted by Jason Kridner <jkridner@beagleboard.org>
beagleboard.io

// Beget Ltd
// Submitted by Lev Nekrasov <lnekrasov@beget.com>
*.beget.app

// BetaInABox
// Submitted by Adrian <adrian@betainabox.com>
betainabox.com

// BinaryLane : http://www.binarylane.com
// Submitted by Nathan O'Sullivan <nathan@mammoth.com.au>
bnr.la

// Bitbucket : http://bitbucket.org
// Submitted by Andy Ortlieb <aortlieb@atlassian.com>
bitbucket.io

// Blackbaud, Inc. : https://www.blackbaud.com
// Submitted by Paul Crowder <paul.crowder@blackbaud.com>
blackbaudcdn.net

// Blatech : http://www.blatech.net
// Submitted by Luke Bratch <luke@bratch.co.uk>
of.je

// Blue Bite, LLC : https://bluebite.com
// Submitted by Joshua Weiss <admin.engineering@bluebite.com>
bluebite.io

// Boomla : https://boomla.com
// Submitted by Tibor Halter <thalter@boomla.com>
boomla.net

// Boutir : https://www.boutir.com
// Submitted by Eric Ng Ka Ka <ngkaka@boutir.com>
boutir.com

// Boxfuse : https://boxfuse.com
// Submitted by Axel Fontaine <axel@boxfuse.com>
boxfuse.io

// bplaced : https://www.bplaced.net/
// Submitted by Miroslav Bozic <security@bplaced.net>
square7.ch
bplaced.com
bplaced.de
square7.de
bplaced.net
square7.net

// Brendly : https://brendly.rs
// Submitted by Dusan Radovanovic <dusan.radovanovic@brendly.rs>
shop.brendly.rs

// BrowserSafetyMark
// Submitted by Dave Tharp <browsersafetymark.io@quicinc.com>
browsersafetymark.io

// Bytemark Hosting : https://www.bytemark.co.uk
// Submitted by Paul Cammish <paul.cammish@bytemark.co.uk>
uk0.bigv.io
dh.bytemark.co.uk
vm.bytemark.co.uk

// Caf.js Labs LLC : https://www.cafjs.com
// Submitted by Antonio Lain <antlai@cafjs.com>
cafjs.com

// callidomus : https://www.callidomus.com/
// Submitted by Marcus Popp <admin@callidomus.com>
mycd.eu

// Canva Pty Ltd : https://canva.com/
// Submitted by Joel Aquilina <publicsuffixlist@canva.com>
canva-apps.cn
canva-apps.com

// Carrd : https://carrd.co
// Submitted by AJ <aj@carrd.co>
drr.ac
uwu.ai
carrd.co
crd.co
ju.mp

// CentralNic : http://www.centralnic.com/names/domains
// Submitted by registry <gavin.brown@centralnic.com>
ae.org
br.com
cn.com
com.de
com.se
de.com
eu.com
gb.net
hu.net
jp.net
jpn.com
mex.com
ru.com
sa.com
se.net
uk.com
uk.net
us.com
za.bz
za.com

// No longer operated by CentralNic, these entries should be adopted and/or removed by current operators
// Submitted by Gavin Brown <gavin.brown@centralnic.com>
ar.com
hu.com
kr.com
no.com
qc.com
uy.com

// Africa.com Web Solutions Ltd : https://registry.africa.com
// Submitted by Gavin Brown <gavin.brown@centralnic.com>
africa.com

// iDOT Services Limited : http://www.domain.gr.com
// Submitted by Gavin Brown <gavin.brown@centralnic.com>
gr.com

// Radix FZC : http://domains.in.net
// Submitted by Gavin Brown <gavin.brown@centralnic.com>
in.net
web.in

// US REGISTRY LLC : http://us.org
// Submitted by Gavin Brown <gavin.brown@centralnic.com>
us.org

// co.com Registry, LLC : https://registry.co.com
// Submitted by Gavin Brown <gavin.brown@centralnic.com>
co.com

// Roar Domains LLC : https://roar.basketball/
// Submitted by Gavin Brown <gavin.brown@centralnic.com>
aus.basketball
nz.basketball

// BRS Media : https://brsmedia.com/
// Submitted by Gavin Brown <gavin.brown@centralnic.com>
radio.am
radio.fm

// c.la : http://www.c.la/
c.la

// certmgr.org : https://certmgr.org
// Submitted by B. Blechschmidt <hostmaster@certmgr.org>
certmgr.org

// Cityhost LLC  : https://cityhost.ua
// Submitted by Maksym Rivtin <support@cityhost.net.ua>
cx.ua

// Civilized Discourse Construction Kit, Inc. : https://www.discourse.org/
// Submitted by Rishabh Nambiar & Michael Brown <team@discourse.org>
discourse.group
discourse.team

// Clever Cloud : https://www.clever-cloud.com/
// Submitted by Quentin Adam <noc@clever-cloud.com>
cleverapps.io

// Clerk : https://www.clerk.dev
// Submitted by Colin Sidoti <systems@clerk.dev>
clerk.app
clerkstage.app
*.lcl.dev
*.lclstage.dev
*.stg.dev
*.stgstage.dev

// ClickRising : https://clickrising.com/
// Submitted by Umut Gumeli <infrastructure-publicsuffixlist@clickrising.com>
clickrising.net

// Cloud66 : https://www.cloud66.com/
// Submitted by Khash Sajadi <khash@cloud66.com>
c66.me
cloud66.ws
cloud66.zone

// CloudAccess.net : https://www.cloudaccess.net/
// Submitted by Pawel Panek <noc@cloudaccess.net>
jdevcloud.com
wpdevcloud.com
cloudaccess.host
freesite.host
cloudaccess.net

// cloudControl : https://www.cloudcontrol.com/
// Submitted by Tobias Wilken <tw@cloudcontrol.com>
cloudcontrolled.com
cloudcontrolapp.com

// Cloudera, Inc. : https://www.cloudera.com/
// Submitted by Kedarnath Waikar <security@cloudera.com>
*.cloudera.site

// Cloudflare, Inc. : https://www.cloudflare.com/
// Submitted by Cloudflare Team <publicsuffixlist@cloudflare.com>
cf-ipfs.com
cloudflare-ipfs.com
trycloudflare.com
pages.dev
r2.dev
workers.dev

// Clovyr : https://clovyr.io
// Submitted by Patrick Nielsen <patrick@clovyr.io>
wnext.app

// co.ca : http://registry.co.ca/
co.ca

// Co & Co : https://co-co.nl/
// Submitted by Govert Versluis <govert@co-co.nl>
*.otap.co

// i-registry s.r.o. : http://www.i-registry.cz/
// Submitted by Martin Semrad <semrad@i-registry.cz>
co.cz

// CDN77.com : http://www.cdn77.com
// Submitted by Jan Krpes <jan.krpes@cdn77.com>
c.cdn77.org
cdn77-ssl.net
r.cdn77.net
rsc.cdn77.org
ssl.origin.cdn77-secure.org

// Cloud DNS Ltd : http://www.cloudns.net
// Submitted by Aleksander Hristov <noc@cloudns.net>
cloudns.asia
cloudns.biz
cloudns.club
cloudns.cc
cloudns.eu
cloudns.in
cloudns.info
cloudns.org
cloudns.pro
cloudns.pw
cloudns.us

// CNPY : https://cnpy.gdn
// Submitted by Angelo Gladding <angelo@lahacker.net>
cnpy.gdn

// Codeberg e. V. : https://codeberg.org
// Submitted by Moritz Marquardt <git@momar.de>
codeberg.page

// CoDNS B.V.
co.nl
co.no

// Combell.com : https://www.combell.com
// Submitted by Thomas Wouters <thomas.wouters@combellgroup.com>
webhosting.be
hosting-cluster.nl

// Coordination Center for TLD RU and XN--P1AI : https://cctld.ru/en/domains/domens_ru/reserved/
// Submitted by George Georgievsky <gug@cctld.ru>
ac.ru
edu.ru
gov.ru
int.ru
mil.ru
test.ru

// COSIMO GmbH : http://www.cosimo.de
// Submitted by Rene Marticke <rmarticke@cosimo.de>
dyn.cosidns.de
dynamisches-dns.de
dnsupdater.de
internet-dns.de
l-o-g-i-n.de
dynamic-dns.info
feste-ip.net
knx-server.net
static-access.net

// Craynic, s.r.o. : http://www.craynic.com/
// Submitted by Ales Krajnik <ales.krajnik@craynic.com>
realm.cz

// Cryptonomic : https://cryptonomic.net/
// Submitted by Andrew Cady <public-suffix-list@cryptonomic.net>
*.cryptonomic.net

// Cupcake : https://cupcake.io/
// Submitted by Jonathan Rudenberg <jonathan@cupcake.io>
cupcake.is

// Curv UG : https://curv-labs.de/
// Submitted by Marvin Wiesner <Marvin@curv-labs.de>
curv.dev

// Customer OCI - Oracle Dyn https://cloud.oracle.com/home https://dyn.com/dns/
// Submitted by Gregory Drake <support@dyn.com>
// Note: This is intended to also include customer-oci.com due to wildcards implicitly including the current label
*.customer-oci.com
*.oci.customer-oci.com
*.ocp.customer-oci.com
*.ocs.customer-oci.com

// cyon GmbH : https://www.cyon.ch/
// Submitted by Dominic Luechinger <dol@cyon.ch>
cyon.link
cyon.site

// Danger Science Group: https://dangerscience.com/
// Submitted by Skylar MacDonald <skylar@dangerscience.com>
fnwk.site
folionetwork.site
platform0.app

// Daplie, Inc : https://daplie.com
// Submitted by AJ ONeal <aj@daplie.com>
daplie.me
localhost.daplie.me

// Datto, Inc. : https://www.datto.com/
// Submitted by Philipp Heckel <ph@datto.com>
dattolocal.com
dattorelay.com
dattoweb.com
mydatto.com
dattolocal.net
mydatto.net

// Dansk.net : http://www.dansk.net/
// Submitted by Anani Voule <digital@digital.co.dk>
biz.dk
co.dk
firm.dk
reg.dk
store.dk

// dappnode.io : https://dappnode.io/
// Submitted by Abel Boldu / DAppNode Team <community@dappnode.io>
dyndns.dappnode.io

// dapps.earth : https://dapps.earth/
// Submitted by Daniil Burdakov <icqkill@gmail.com>
*.dapps.earth
*.bzz.dapps.earth

// Dark, Inc. : https://darklang.com
// Submitted by Paul Biggar <ops@darklang.com>
builtwithdark.com

// DataDetect, LLC. : https://datadetect.com
// Submitted by Andrew Banchich <abanchich@sceven.com>
demo.datadetect.com
instance.datadetect.com

// Datawire, Inc : https://www.datawire.io
// Submitted by Richard Li <secalert@datawire.io>
edgestack.me

// DDNS5 : https://ddns5.com
// Submitted by Cameron Elliott <cameron@cameronelliott.com>
ddns5.com

// Debian : https://www.debian.org/
// Submitted by Peter Palfrader / Debian Sysadmin Team <dsa-publicsuffixlist@debian.org>
debian.net

// Deno Land Inc : https://deno.com/
// Submitted by Luca Casonato <hostmaster@deno.com>
deno.dev
deno-staging.dev

// deSEC : https://desec.io/
// Submitted by Peter Thomassen <peter@desec.io>
dedyn.io

// Deta: https://www.deta.sh/
// Submitted by Aavash Shrestha <aavash@deta.sh>
deta.app
deta.dev

// Diher Solutions : https://diher.solutions
// Submitted by Didi Hermawan <mail@diher.solutions>
*.rss.my.id
*.diher.solutions

// Discord Inc : https://discord.com
// Submitted by Sahn Lam <slam@discordapp.com>
discordsays.com
discordsez.com

// DNS Africa Ltd https://dns.business
// Submitted by Calvin Browne <calvin@dns.business>
jozi.biz

// DNShome : https://www.dnshome.de/
// Submitted by Norbert Auler <mail@dnshome.de>
dnshome.de

// DotArai : https://www.dotarai.com/
// Submitted by Atsadawat Netcharadsang <atsadawat@dotarai.co.th>
online.th
shop.th

// DrayTek Corp. : https://www.draytek.com/
// Submitted by Paul Fang <mis@draytek.com>
drayddns.com

// DreamCommerce : https://shoper.pl/
// Submitted by Konrad Kotarba <konrad.kotarba@dreamcommerce.com>
shoparena.pl

// DreamHost : http://www.dreamhost.com/
// Submitted by Andrew Farmer <andrew.farmer@dreamhost.com>
dreamhosters.com

// Drobo : http://www.drobo.com/
// Submitted by Ricardo Padilha <rpadilha@drobo.com>
mydrobo.com

// Drud Holdings, LLC. : https://www.drud.com/
// Submitted by Kevin Bridges <kevin@drud.com>
drud.io
drud.us

// DuckDNS : http://www.duckdns.org/
// Submitted by Richard Harper <richard@duckdns.org>
duckdns.org

// Bip : https://bip.sh
// Submitted by Joel Kennedy <joel@bip.sh>
bip.sh

// bitbridge.net : Submitted by Craig Welch, abeliidev@gmail.com
bitbridge.net

// dy.fi : http://dy.fi/
// Submitted by Heikki Hannikainen <hessu@hes.iki.fi>
dy.fi
tunk.org

// DynDNS.com : http://www.dyndns.com/services/dns/dyndns/
dyndns-at-home.com
dyndns-at-work.com
dyndns-blog.com
dyndns-free.com
dyndns-home.com
dyndns-ip.com
dyndns-mail.com
dyndns-office.com
dyndns-pics.com
dyndns-remote.com
dyndns-server.com
dyndns-web.com
dyndns-wiki.com
dyndns-work.com
dyndns.biz
dyndns.info
dyndns.org
dyndns.tv
at-band-camp.net
ath.cx
barrel-of-knowledge.info
barrell-of-knowledge.info
better-than.tv
blogdns.com
blogdns.net
blogdns.org
blogsite.org
boldlygoingnowhere.org
broke-it.net
buyshouses.net
cechire.com
dnsalias.com
dnsalias.net
dnsalias.org
dnsdojo.com
dnsdojo.net
dnsdojo.org
does-it.net
doesntexist.com
doesntexist.org
dontexist.com
dontexist.net
dontexist.org
doomdns.com
doomdns.org
dvrdns.org
dyn-o-saur.com
dynalias.com
dynalias.net
dynalias.org
dynathome.net
dyndns.ws
endofinternet.net
endofinternet.org
endoftheinternet.org
est-a-la-maison.com
est-a-la-masion.com
est-le-patron.com
est-mon-blogueur.com
for-better.biz
for-more.biz
for-our.info
for-some.biz
for-the.biz
forgot.her.name
forgot.his.name
from-ak.com
from-al.com
from-ar.com
from-az.net
from-ca.com
from-co.net
from-ct.com
from-dc.com
from-de.com
from-fl.com
from-ga.com
from-hi.com
from-ia.com
from-id.com
from-il.com
from-in.com
from-ks.com
from-ky.com
from-la.net
from-ma.com
from-md.com
from-me.org
from-mi.com
from-mn.com
from-mo.com
from-ms.com
from-mt.com
from-nc.com
from-nd.com
from-ne.com
from-nh.com
from-nj.com
from-nm.com
from-nv.com
from-ny.net
from-oh.com
from-ok.com
from-or.com
from-pa.com
from-pr.com
from-ri.com
from-sc.com
from-sd.com
from-tn.com
from-tx.com
from-ut.com
from-va.com
from-vt.com
from-wa.com
from-wi.com
from-wv.com
from-wy.com
ftpaccess.cc
fuettertdasnetz.de
game-host.org
game-server.cc
getmyip.com
gets-it.net
go.dyndns.org
gotdns.com
gotdns.org
groks-the.info
groks-this.info
ham-radio-op.net
here-for-more.info
hobby-site.com
hobby-site.org
home.dyndns.org
homedns.org
homeftp.net
homeftp.org
homeip.net
homelinux.com
homelinux.net
homelinux.org
homeunix.com
homeunix.net
homeunix.org
iamallama.com
in-the-band.net
is-a-anarchist.com
is-a-blogger.com
is-a-bookkeeper.com
is-a-bruinsfan.org
is-a-bulls-fan.com
is-a-candidate.org
is-a-caterer.com
is-a-celticsfan.org
is-a-chef.com
is-a-chef.net
is-a-chef.org
is-a-conservative.com
is-a-cpa.com
is-a-cubicle-slave.com
is-a-democrat.com
is-a-designer.com
is-a-doctor.com
is-a-financialadvisor.com
is-a-geek.com
is-a-geek.net
is-a-geek.org
is-a-green.com
is-a-guru.com
is-a-hard-worker.com
is-a-hunter.com
is-a-knight.org
is-a-landscaper.com
is-a-lawyer.com
is-a-liberal.com
is-a-libertarian.com
is-a-linux-user.org
is-a-llama.com
is-a-musician.com
is-a-nascarfan.com
is-a-nurse.com
is-a-painter.com
is-a-patsfan.org
is-a-personaltrainer.com
is-a-photographer.com
is-a-player.com
is-a-republican.com
is-a-rockstar.com
is-a-socialist.com
is-a-soxfan.org
is-a-student.com
is-a-teacher.com
is-a-techie.com
is-a-therapist.com
is-an-accountant.com
is-an-actor.com
is-an-actress.com
is-an-anarchist.com
is-an-artist.com
is-an-engineer.com
is-an-entertainer.com
is-by.us
is-certified.com
is-found.org
is-gone.com
is-into-anime.com
is-into-cars.com
is-into-cartoons.com
is-into-games.com
is-leet.com
is-lost.org
is-not-certified.com
is-saved.org
is-slick.com
is-uberleet.com
is-very-bad.org
is-very-evil.org
is-very-good.org
is-very-nice.org
is-very-sweet.org
is-with-theband.com
isa-geek.com
isa-geek.net
isa-geek.org
isa-hockeynut.com
issmarterthanyou.com
isteingeek.de
istmein.de
kicks-ass.net
kicks-ass.org
knowsitall.info
land-4-sale.us
lebtimnetz.de
leitungsen.de
likes-pie.com
likescandy.com
merseine.nu
mine.nu
misconfused.org
mypets.ws
myphotos.cc
neat-url.com
office-on-the.net
on-the-web.tv
podzone.net
podzone.org
readmyblog.org
saves-the-whales.com
scrapper-site.net
scrapping.cc
selfip.biz
selfip.com
selfip.info
selfip.net
selfip.org
sells-for-less.com
sells-for-u.com
sells-it.net
sellsyourhome.org
servebbs.com
servebbs.net
servebbs.org
serveftp.net
serveftp.org
servegame.org
shacknet.nu
simple-url.com
space-to-rent.com
stuff-4-sale.org
stuff-4-sale.us
teaches-yoga.com
thruhere.net
traeumtgerade.de
webhop.biz
webhop.info
webhop.net
webhop.org
worse-than.tv
writesthisblog.com

// ddnss.de : https://www.ddnss.de/
// Submitted by Robert Niedziela <webmaster@ddnss.de>
ddnss.de
dyn.ddnss.de
dyndns.ddnss.de
dyndns1.de
dyn-ip24.de
home-webserver.de
dyn.home-webserver.de
myhome-server.de
ddnss.org

// Definima : http://www.definima.com/
// Submitted by Maxence Bitterli <maxence@definima.com>
definima.net
definima.io

// DigitalOcean App Platform : https://www.digitalocean.com/products/app-platform/
// Submitted by Braxton Huggins <psl-maintainers@digitalocean.com>
ondigitalocean.app

// DigitalOcean Spaces : https://www.digitalocean.com/products/spaces/
// Submitted by Robin H. Johnson <psl-maintainers@digitalocean.com>
*.digitaloceanspaces.com

// dnstrace.pro : https://dnstrace.pro/
// Submitted by Chris Partridge <chris@partridge.tech>
bci.dnstrace.pro

// Dynu.com : https://www.dynu.com/
// Submitted by Sue Ye <sue@dynu.com>
ddnsfree.com
ddnsgeek.com
giize.com
gleeze.com
kozow.com
loseyourip.com
ooguy.com
theworkpc.com
casacam.net
dynu.net
accesscam.org
camdvr.org
freeddns.org
mywire.org
webredirect.org
myddns.rocks
blogsite.xyz

// dynv6 : https://dynv6.com
// Submitted by Dominik Menke <dom@digineo.de>
dynv6.net

// E4YOU spol. s.r.o. : https://e4you.cz/
// Submitted by Vladimir Dudr <info@e4you.cz>
e4.cz

// Easypanel : https://easypanel.io
// Submitted by Andrei Canta <andrei@easypanel.io>
easypanel.app
easypanel.host

// Elementor : Elementor Ltd.
// Submitted by Anton Barkan <antonb@elementor.com>
elementor.cloud
elementor.cool

// En root‽ : https://en-root.org
// Submitted by Emmanuel Raviart <emmanuel@raviart.com>
en-root.fr

// Enalean SAS: https://www.enalean.com
// Submitted by Thomas Cottier <thomas.cottier@enalean.com>
mytuleap.com
tuleap-partners.com

// Encoretivity AB: https://encore.dev
// Submitted by André Eriksson <andre@encore.dev>
encr.app
encoreapi.com

// ECG Robotics, Inc: https://ecgrobotics.org
// Submitted by <frc1533@ecgrobotics.org>
onred.one
staging.onred.one

// encoway GmbH : https://www.encoway.de
// Submitted by Marcel Daus <cloudops@encoway.de>
eu.encoway.cloud

// EU.org https://eu.org/
// Submitted by Pierre Beyssac <hostmaster@eu.org>
eu.org
al.eu.org
asso.eu.org
at.eu.org
au.eu.org
be.eu.org
bg.eu.org
ca.eu.org
cd.eu.org
ch.eu.org
cn.eu.org
cy.eu.org
cz.eu.org
de.eu.org
dk.eu.org
edu.eu.org
ee.eu.org
es.eu.org
fi.eu.org
fr.eu.org
gr.eu.org
hr.eu.org
hu.eu.org
ie.eu.org
il.eu.org
in.eu.org
int.eu.org
is.eu.org
it.eu.org
jp.eu.org
kr.eu.org
lt.eu.org
lu.eu.org
lv.eu.org
mc.eu.org
me.eu.org
mk.eu.org
mt.eu.org
my.eu.org
net.eu.org
ng.eu.org
nl.eu.org
no.eu.org
nz.eu.org
paris.eu.org
pl.eu.org
pt.eu.org
q-a.eu.org
ro.eu.org
ru.eu.org
se.eu.org
si.eu.org
sk.eu.org
tr.eu.org
uk.eu.org
us.eu.org

// Eurobyte : https://eurobyte.ru
// Submitted by Evgeniy Subbotin <e.subbotin@eurobyte.ru>
eurodir.ru

// Evennode : http://www.evennode.com/
// Submitted by Michal Kralik <support@evennode.com>
eu-1.evennode.com
eu-2.evennode.com
eu-3.evennode.com
eu-4.evennode.com
us-1.evennode.com
us-2.evennode.com
us-3.evennode.com
us-4.evennode.com

// eDirect Corp. : https://hosting.url.com.tw/
// Submitted by C.S. chang <cschang@corp.url.com.tw>
twmail.cc
twmail.net
twmail.org
mymailer.com.tw
url.tw

// Fabrica Technologies, Inc. : https://www.fabrica.dev/
// Submitted by Eric Jiang <eric@fabrica.dev>
onfabrica.com

// Facebook, Inc.
// Submitted by Peter Ruibal <public-suffix@fb.com>
apps.fbsbx.com

// FAITID : https://faitid.org/
// Submitted by Maxim Alzoba <tech.contact@faitid.org>
// https://www.flexireg.net/stat_info
ru.net
adygeya.ru
bashkiria.ru
bir.ru
cbg.ru
com.ru
dagestan.ru
grozny.ru
kalmykia.ru
kustanai.ru
marine.ru
mordovia.ru
msk.ru
mytis.ru
nalchik.ru
nov.ru
pyatigorsk.ru
spb.ru
vladikavkaz.ru
vladimir.ru
abkhazia.su
adygeya.su
aktyubinsk.su
arkhangelsk.su
armenia.su
ashgabad.su
azerbaijan.su
balashov.su
bashkiria.su
bryansk.su
bukhara.su
chimkent.su
dagestan.su
east-kazakhstan.su
exnet.su
georgia.su
grozny.su
ivanovo.su
jambyl.su
kalmykia.su
kaluga.su
karacol.su
karaganda.su
karelia.su
khakassia.su
krasnodar.su
kurgan.su
kustanai.su
lenug.su
mangyshlak.su
mordovia.su
msk.su
murmansk.su
nalchik.su
navoi.su
north-kazakhstan.su
nov.su
obninsk.su
penza.su
pokrovsk.su
sochi.su
spb.su
tashkent.su
termez.su
togliatti.su
troitsk.su
tselinograd.su
tula.su
tuva.su
vladikavkaz.su
vladimir.su
vologda.su

// Fancy Bits, LLC : http://getchannels.com
// Submitted by Aman Gupta <aman@getchannels.com>
channelsdvr.net
u.channelsdvr.net

// Fastly Inc. : http://www.fastly.com/
// Submitted by Fastly Security <security@fastly.com>
edgecompute.app
fastly-edge.com
fastly-terrarium.com
fastlylb.net
map.fastlylb.net
freetls.fastly.net
map.fastly.net
a.prod.fastly.net
global.prod.fastly.net
a.ssl.fastly.net
b.ssl.fastly.net
global.ssl.fastly.net

// Fastmail : https://www.fastmail.com/
// Submitted by Marc Bradshaw <marc@fastmailteam.com>
*.user.fm

// FASTVPS EESTI OU : https://fastvps.ru/
// Submitted by Likhachev Vasiliy <lihachev@fastvps.ru>
fastvps-server.com
fastvps.host
myfast.host
fastvps.site
myfast.space

// Fedora : https://fedoraproject.org/
// submitted by Patrick Uiterwijk <puiterwijk@fedoraproject.org>
fedorainfracloud.org
fedorapeople.org
cloud.fedoraproject.org
app.os.fedoraproject.org
app.os.stg.fedoraproject.org

// FearWorks Media Ltd. : https://fearworksmedia.co.uk
// submitted by Keith Fairley <domains@fearworksmedia.co.uk>
conn.uk
copro.uk
hosp.uk

// Fermax : https://fermax.com/
// submitted by Koen Van Isterdael <k.vanisterdael@fermax.be>
mydobiss.com

// FH Muenster : https://www.fh-muenster.de
// Submitted by Robin Naundorf <r.naundorf@fh-muenster.de>
fh-muenster.io

// Filegear Inc. : https://www.filegear.com
// Submitted by Jason Zhu <jason@owtware.com>
filegear.me
filegear-au.me
filegear-de.me
filegear-gb.me
filegear-ie.me
filegear-jp.me
filegear-sg.me

// Firebase, Inc.
// Submitted by Chris Raynor <chris@firebase.com>
firebaseapp.com

// Firewebkit : https://www.firewebkit.com
// Submitted by Majid Qureshi <mqureshi@amrayn.com>
fireweb.app

// FLAP : https://www.flap.cloud
// Submitted by Louis Chemineau <louis@chmn.me>
flap.id

// FlashDrive : https://flashdrive.io
// Submitted by Eric Chan <support@flashdrive.io>
onflashdrive.app
fldrv.com

// fly.io: https://fly.io
// Submitted by Kurt Mackey <kurt@fly.io>
fly.dev
edgeapp.net
shw.io

// Flynn : https://flynn.io
// Submitted by Jonathan Rudenberg <jonathan@flynn.io>
flynnhosting.net

// Forgerock : https://www.forgerock.com
// Submitted by Roderick Parr <roderick.parr@forgerock.com>
forgeblocks.com
id.forgerock.io

// Framer : https://www.framer.com
// Submitted by Koen Rouwhorst <koenrh@framer.com>
framer.app
framercanvas.com
framer.media
framer.photos
framer.website
framer.wiki

// Frusky MEDIA&PR : https://www.frusky.de
// Submitted by Victor Pupynin <hallo@frusky.de>
*.frusky.de

// RavPage : https://www.ravpage.co.il
// Submitted by Roni Horowitz <roni@responder.co.il>
ravpage.co.il

// Frederik Braun https://frederik-braun.com
// Submitted by Frederik Braun <fb@frederik-braun.com>
0e.vc

// Freebox : http://www.freebox.fr
// Submitted by Romain Fliedel <rfliedel@freebox.fr>
freebox-os.com
freeboxos.com
fbx-os.fr
fbxos.fr
freebox-os.fr
freeboxos.fr

// freedesktop.org : https://www.freedesktop.org
// Submitted by Daniel Stone <daniel@fooishbar.org>
freedesktop.org

// freemyip.com : https://freemyip.com
// Submitted by Cadence <contact@freemyip.com>
freemyip.com

// FunkFeuer - Verein zur Förderung freier Netze : https://www.funkfeuer.at
// Submitted by Daniel A. Maierhofer <vorstand@funkfeuer.at>
wien.funkfeuer.at

// Futureweb OG : http://www.futureweb.at
// Submitted by Andreas Schnederle-Wagner <schnederle@futureweb.at>
*.futurecms.at
*.ex.futurecms.at
*.in.futurecms.at
futurehosting.at
futuremailing.at
*.ex.ortsinfo.at
*.kunden.ortsinfo.at
*.statics.cloud

// GDS : https://www.gov.uk/service-manual/technology/managing-domain-names
// Submitted by Stephen Ford <hostmaster@digital.cabinet-office.gov.uk>
independent-commission.uk
independent-inquest.uk
independent-inquiry.uk
independent-panel.uk
independent-review.uk
public-inquiry.uk
royal-commission.uk
campaign.gov.uk
service.gov.uk

// CDDO : https://www.gov.uk/guidance/get-an-api-domain-on-govuk
// Submitted by Jamie Tanna <jamie.tanna@digital.cabinet-office.gov.uk>
api.gov.uk

// Gehirn Inc. : https://www.gehirn.co.jp/
// Submitted by Kohei YOSHIDA <tech@gehirn.co.jp>
gehirn.ne.jp
usercontent.jp

// Gentlent, Inc. : https://www.gentlent.com
// Submitted by Tom Klein <tom@gentlent.com>
gentapps.com
gentlentapis.com
lab.ms
cdn-edges.net

// Ghost Foundation : https://ghost.org
// Submitted by Matt Hanley <security@ghost.org>
ghost.io

// GignoSystemJapan: http://gsj.bz
// Submitted by GignoSystemJapan <kakutou-ec@gsj.bz>
gsj.bz

// GitHub, Inc.
// Submitted by Patrick Toomey <security@github.com>
githubusercontent.com
githubpreview.dev
github.io

// GitLab, Inc.
// Submitted by Alex Hanselka <alex@gitlab.com>
gitlab.io

// Gitplac.si - https://gitplac.si
// Submitted by Aljaž Starc <me@aljaxus.eu>
gitapp.si
gitpage.si

// Glitch, Inc : https://glitch.com
// Submitted by Mads Hartmann <mads@glitch.com>
glitch.me

// Global NOG Alliance : https://nogalliance.org/
// Submitted by Sander Steffann <sander@nogalliance.org>
nog.community

// Globe Hosting SRL : https://www.globehosting.com/
// Submitted by Gavin Brown <gavin.brown@centralnic.com>
co.ro
shop.ro

// GMO Pepabo, Inc. : https://pepabo.com/
// Submitted by Hosting Div <admin@pepabo.com>
lolipop.io
angry.jp
babyblue.jp
babymilk.jp
backdrop.jp
bambina.jp
bitter.jp
blush.jp
boo.jp
boy.jp
boyfriend.jp
but.jp
candypop.jp
capoo.jp
catfood.jp
cheap.jp
chicappa.jp
chillout.jp
chips.jp
chowder.jp
chu.jp
ciao.jp
cocotte.jp
coolblog.jp
cranky.jp
cutegirl.jp
daa.jp
deca.jp
deci.jp
digick.jp
egoism.jp
fakefur.jp
fem.jp
flier.jp
floppy.jp
fool.jp
frenchkiss.jp
girlfriend.jp
girly.jp
gloomy.jp
gonna.jp
greater.jp
hacca.jp
heavy.jp
her.jp
hiho.jp
hippy.jp
holy.jp
hungry.jp
icurus.jp
itigo.jp
jellybean.jp
kikirara.jp
kill.jp
kilo.jp
kuron.jp
littlestar.jp
lolipopmc.jp
lolitapunk.jp
lomo.jp
lovepop.jp
lovesick.jp
main.jp
mods.jp
mond.jp
mongolian.jp
moo.jp
namaste.jp
nikita.jp
nobushi.jp
noor.jp
oops.jp
parallel.jp
parasite.jp
pecori.jp
peewee.jp
penne.jp
pepper.jp
perma.jp
pigboat.jp
pinoko.jp
punyu.jp
pupu.jp
pussycat.jp
pya.jp
raindrop.jp
readymade.jp
sadist.jp
schoolbus.jp
secret.jp
staba.jp
stripper.jp
sub.jp
sunnyday.jp
thick.jp
tonkotsu.jp
under.jp
upper.jp
velvet.jp
verse.jp
versus.jp
vivian.jp
watson.jp
weblike.jp
whitesnow.jp
zombie.jp
heteml.net

// GOV.UK Platform as a Service : https://www.cloud.service.gov.uk/
// Submitted by Tom Whitwell <gov-uk-paas-support@digital.cabinet-office.gov.uk>
cloudapps.digital
london.cloudapps.digital

// GOV.UK Pay : https://www.payments.service.gov.uk/
// Submitted by Richard Baker <richard.baker@digital.cabinet-office.gov.uk>
pymnt.uk

// UKHomeOffice : https://www.gov.uk/government/organisations/home-office
// Submitted by Jon Shanks <jon.shanks@digital.homeoffice.gov.uk>
homeoffice.gov.uk

// GlobeHosting, Inc.
// Submitted by Zoltan Egresi <egresi@globehosting.com>
ro.im

// GoIP DNS Services : http://www.goip.de
// Submitted by Christian Poulter <milchstrasse@goip.de>
goip.de

// Google, Inc.
// Submitted by Eduardo Vela <evn@google.com>
run.app
a.run.app
web.app
*.0emm.com
appspot.com
*.r.appspot.com
codespot.com
googleapis.com
googlecode.com
pagespeedmobilizer.com
publishproxy.com
withgoogle.com
withyoutube.com
*.gateway.dev
cloud.goog
translate.goog
*.usercontent.goog
cloudfunctions.net
blogspot.ae
blogspot.al
blogspot.am
blogspot.ba
blogspot.be
blogspot.bg
blogspot.bj
blogspot.ca
blogspot.cf
blogspot.ch
blogspot.cl
blogspot.co.at
blogspot.co.id
blogspot.co.il
blogspot.co.ke
blogspot.co.nz
blogspot.co.uk
blogspot.co.za
blogspot.com
blogspot.com.ar
blogspot.com.au
blogspot.com.br
blogspot.com.by
blogspot.com.co
blogspot.com.cy
blogspot.com.ee
blogspot.com.eg
blogspot.com.es
blogspot.com.mt
blogspot.com.ng
blogspot.com.tr
blogspot.com.uy
blogspot.cv
blogspot.cz
blogspot.de
blogspot.dk
blogspot.fi
blogspot.fr
blogspot.gr
blogspot.hk
blogspot.hr
blogspot.hu
blogspot.ie
blogspot.in
blogspot.is
blogspot.it
blogspot.jp
blogspot.kr
blogspot.li
blogspot.lt
blogspot.lu
blogspot.md
blogspot.mk
blogspot.mr
blogspot.mx
blogspot.my
blogspot.nl
blogspot.no
blogspot.pe
blogspot.pt
blogspot.qa
blogspot.re
blogspot.ro
blogspot.rs
blogspot.ru
blogspot.se
blogspot.sg
blogspot.si
blogspot.sk
blogspot.sn
blogspot.td
blogspot.tw
blogspot.ug
blogspot.vn

// Goupile : https://goupile.fr
// Submitted by Niels Martignene <hello@goupile.fr>
goupile.fr

// Government of the Netherlands: https://www.government.nl
// Submitted by <domeinnaam@minaz.nl>
gov.nl

// Group 53, LLC : https://www.group53.com
// Submitted by Tyler Todd <noc@nova53.net>
awsmppl.com

// GünstigBestellen : https://günstigbestellen.de
// Submitted by Furkan Akkoc <info@hendelzon.de>
günstigbestellen.de
günstigliefern.de

// Hakaran group: http://hakaran.cz
// Submitted by Arseniy Sokolov <security@hakaran.cz>
fin.ci
free.hr
caa.li
ua.rs
conf.se

// Handshake : https://handshake.org
// Submitted by Mike Damm <md@md.vc>
hs.zone
hs.run

// Hashbang : https://hashbang.sh
hashbang.sh

// Hasura : https://hasura.io
// Submitted by Shahidh K Muhammed <shahidh@hasura.io>
hasura.app
hasura-app.io

// Heilbronn University of Applied Sciences - Faculty Informatics (GitLab Pages): https://www.hs-heilbronn.de
// Submitted by Richard Zowalla <mi-admin@hs-heilbronn.de>
pages.it.hs-heilbronn.de

// Hepforge : https://www.hepforge.org
// Submitted by David Grellscheid <admin@hepforge.org>
hepforge.org

// Heroku : https://www.heroku.com/
// Submitted by Tom Maher <tmaher@heroku.com>
herokuapp.com
herokussl.com

// Hibernating Rhinos
// Submitted by Oren Eini <oren@ravendb.net>
ravendb.cloud
ravendb.community
ravendb.me
development.run
ravendb.run

// home.pl S.A.: https://home.pl
// Submitted by Krzysztof Wolski <krzysztof.wolski@home.eu>
homesklep.pl

// Hong Kong Productivity Council: https://www.hkpc.org/
// Submitted by SECaaS Team <summchan@hkpc.org>
secaas.hk

// Hoplix : https://www.hoplix.com
// Submitted by Danilo De Franco<info@hoplix.shop>
hoplix.shop


// HOSTBIP REGISTRY : https://www.hostbip.com/
// Submitted by Atanunu Igbunuroghene <publicsuffixlist@hostbip.com>
orx.biz
biz.gl
col.ng
firm.ng
gen.ng
ltd.ng
ngo.ng
edu.scot
sch.so

// HostFly : https://www.ie.ua
// Submitted by Bohdan Dub <support@hostfly.com.ua>
ie.ua

// HostyHosting (hostyhosting.com)
hostyhosting.io

// Häkkinen.fi
// Submitted by Eero Häkkinen <Eero+psl@Häkkinen.fi>
häkkinen.fi

// Ici la Lune : http://www.icilalune.com/
// Submitted by Simon Morvan <simon@icilalune.com>
*.moonscale.io
moonscale.net

// iki.fi
// Submitted by Hannu Aronsson <haa@iki.fi>
iki.fi

// iliad italia: https://www.iliad.it
// Submitted by Marios Makassikis <mmakassikis@freebox.fr>
ibxos.it
iliadboxos.it

// Impertrix Solutions : <https://impertrixcdn.com>
// Submitted by Zhixiang Zhao <csuite@impertrix.com>
impertrixcdn.com
impertrix.com

// Incsub, LLC: https://incsub.com/
// Submitted by Aaron Edwards <sysadmins@incsub.com>
smushcdn.com
wphostedmail.com
wpmucdn.com
tempurl.host
wpmudev.host

// Individual Network Berlin e.V. : https://www.in-berlin.de/
// Submitted by Christian Seitz <chris@in-berlin.de>
dyn-berlin.de
in-berlin.de
in-brb.de
in-butter.de
in-dsl.de
in-dsl.net
in-dsl.org
in-vpn.de
in-vpn.net
in-vpn.org

// info.at : http://www.info.at/
biz.at
info.at

// info.cx : http://info.cx
// Submitted by Jacob Slater <whois@igloo.to>
info.cx

// Interlegis : http://www.interlegis.leg.br
// Submitted by Gabriel Ferreira <registrobr@interlegis.leg.br>
ac.leg.br
al.leg.br
am.leg.br
ap.leg.br
ba.leg.br
ce.leg.br
df.leg.br
es.leg.br
go.leg.br
ma.leg.br
mg.leg.br
ms.leg.br
mt.leg.br
pa.leg.br
pb.leg.br
pe.leg.br
pi.leg.br
pr.leg.br
rj.leg.br
rn.leg.br
ro.leg.br
rr.leg.br
rs.leg.br
sc.leg.br
se.leg.br
sp.leg.br
to.leg.br

// intermetrics GmbH : https://pixolino.com/
// Submitted by Wolfgang Schwarz <admin@intermetrics.de>
pixolino.com

// Internet-Pro, LLP: https://netangels.ru/
// Submitted by Vasiliy Sheredeko <piphon@gmail.com>
na4u.ru

// iopsys software solutions AB : https://iopsys.eu/
// Submitted by Roman Azarenko <roman.azarenko@iopsys.eu>
iopsys.se

// IPiFony Systems, Inc. : https://www.ipifony.com/
// Submitted by Matthew Hardeman <mhardeman@ipifony.com>
ipifony.net

// IServ GmbH : https://iserv.de
// Submitted by Mario Hoberg <info@iserv.de>
iservschule.de
mein-iserv.de
schulplattform.de
schulserver.de
test-iserv.de
iserv.dev

// I-O DATA DEVICE, INC. : http://www.iodata.com/
// Submitted by Yuji Minagawa <domains-admin@iodata.jp>
iobb.net

// Jelastic, Inc. : https://jelastic.com/
// Submitted by Ihor Kolodyuk <ik@jelastic.com>
mel.cloudlets.com.au
cloud.interhostsolutions.be
mycloud.by
alp1.ae.flow.ch
appengine.flow.ch
es-1.axarnet.cloud
diadem.cloud
vip.jelastic.cloud
jele.cloud
it1.eur.aruba.jenv-aruba.cloud
it1.jenv-aruba.cloud
keliweb.cloud
cs.keliweb.cloud
oxa.cloud
tn.oxa.cloud
uk.oxa.cloud
primetel.cloud
uk.primetel.cloud
ca.reclaim.cloud
uk.reclaim.cloud
us.reclaim.cloud
ch.trendhosting.cloud
de.trendhosting.cloud
jele.club
amscompute.com
dopaas.com
paas.hosted-by-previder.com
rag-cloud.hosteur.com
rag-cloud-ch.hosteur.com
jcloud.ik-server.com
jcloud-ver-jpc.ik-server.com
demo.jelastic.com
kilatiron.com
paas.massivegrid.com
jed.wafaicloud.com
lon.wafaicloud.com
ryd.wafaicloud.com
j.scaleforce.com.cy
jelastic.dogado.eu
fi.cloudplatform.fi
demo.datacenter.fi
paas.datacenter.fi
jele.host
mircloud.host
paas.beebyte.io
sekd1.beebyteapp.io
jele.io
cloud-fr1.unispace.io
jc.neen.it
cloud.jelastic.open.tim.it
jcloud.kz
upaas.kazteleport.kz
cloudjiffy.net
fra1-de.cloudjiffy.net
west1-us.cloudjiffy.net
jls-sto1.elastx.net
jls-sto2.elastx.net
jls-sto3.elastx.net
faststacks.net
fr-1.paas.massivegrid.net
lon-1.paas.massivegrid.net
lon-2.paas.massivegrid.net
ny-1.paas.massivegrid.net
ny-2.paas.massivegrid.net
sg-1.paas.massivegrid.net
jelastic.saveincloud.net
nordeste-idc.saveincloud.net
j.scaleforce.net
jelastic.tsukaeru.net
sdscloud.pl
unicloud.pl
mircloud.ru
jelastic.regruhosting.ru
enscaled.sg
jele.site
jelastic.team
orangecloud.tn
j.layershift.co.uk
phx.enscaled.us
mircloud.us

// Jino : https://www.jino.ru
// Submitted by Sergey Ulyashin <ulyashin@jino.ru>
myjino.ru
*.hosting.myjino.ru
*.landing.myjino.ru
*.spectrum.myjino.ru
*.vps.myjino.ru

// Jotelulu S.L. : https://jotelulu.com
// Submitted by Daniel Fariña <ingenieria@jotelulu.com>
jotelulu.cloud

// Joyent : https://www.joyent.com/
// Submitted by Brian Bennett <brian.bennett@joyent.com>
*.triton.zone
*.cns.joyent.com

// JS.ORG : http://dns.js.org
// Submitted by Stefan Keim <admin@js.org>
js.org

// KaasHosting : http://www.kaashosting.nl/
// Submitted by Wouter Bakker <hostmaster@kaashosting.nl>
kaas.gg
khplay.nl

// Kakao : https://www.kakaocorp.com/
// Submitted by JaeYoong Lee <cec@kakaocorp.com>
ktistory.com

// Kapsi : https://kapsi.fi
// Submitted by Tomi Juntunen <erani@kapsi.fi>
kapsi.fi

// Keyweb AG : https://www.keyweb.de
// Submitted by Martin Dannehl <postmaster@keymachine.de>
keymachine.de

// KingHost : https://king.host
// Submitted by Felipe Keller Braz <felipebraz@kinghost.com.br>
kinghost.net
uni5.net

// KnightPoint Systems, LLC : http://www.knightpoint.com/
// Submitted by Roy Keene <rkeene@knightpoint.com>
knightpoint.systems

// KoobinEvent, SL: https://www.koobin.com
// Submitted by Iván Oliva <ivan.oliva@koobin.com>
koobin.events

// KUROKU LTD : https://kuroku.ltd/
// Submitted by DisposaBoy <security@oya.to>
oya.to

// Katholieke Universiteit Leuven: https://www.kuleuven.be
// Submitted by Abuse KU Leuven <abuse@kuleuven.be>
kuleuven.cloud
ezproxy.kuleuven.be

// .KRD : http://nic.krd/data/krd/Registration%20Policy.pdf
co.krd
edu.krd

// Krellian Ltd. : https://krellian.com
// Submitted by Ben Francis <ben@krellian.com>
krellian.net
webthings.io

// LCube - Professional hosting e.K. : https://www.lcube-webhosting.de
// Submitted by Lars Laehn <info@lcube.de>
git-repos.de
lcube-server.de
svn-repos.de

// Leadpages : https://www.leadpages.net
// Submitted by Greg Dallavalle <domains@leadpages.net>
leadpages.co
lpages.co
lpusercontent.com

// Lelux.fi : https://lelux.fi/
// Submitted by Lelux Admin <publisuffix@lelux.site>
lelux.site

// Lifetime Hosting : https://Lifetime.Hosting/
// Submitted by Mike Fillator <support@lifetime.hosting>
co.business
co.education
co.events
co.financial
co.network
co.place
co.technology

// Lightmaker Property Manager, Inc. : https://app.lmpm.com/
// Submitted by Greg Holland <greg.holland@lmpm.com>
app.lmpm.com

// linkyard ldt: https://www.linkyard.ch/
// Submitted by Mario Siegenthaler <mario.siegenthaler@linkyard.ch>
linkyard.cloud
linkyard-cloud.ch

// Linode : https://linode.com
// Submitted by <security@linode.com>
members.linode.com
*.nodebalancer.linode.com
*.linodeobjects.com
ip.linodeusercontent.com

// LiquidNet Ltd : http://www.liquidnetlimited.com/
// Submitted by Victor Velchev <admin@liquidnetlimited.com>
we.bs

// Localcert : https://localcert.dev
// Submitted by Lann Martin <security@localcert.dev>
*.user.localcert.dev

// localzone.xyz
// Submitted by Kenny Niehage <hello@yahe.sh>
localzone.xyz

// Log'in Line : https://www.loginline.com/
// Submitted by Rémi Mach <remi.mach@loginline.com>
loginline.app
loginline.dev
loginline.io
loginline.services
loginline.site

// Lokalized : https://lokalized.nl
// Submitted by Noah Taheij <noah@lokalized.nl>
servers.run

// Lõhmus Family, The
// Submitted by Heiki Lõhmus <hostmaster at lohmus dot me>
lohmus.me

// LubMAN UMCS Sp. z o.o : https://lubman.pl/
// Submitted by Ireneusz Maliszewski <ireneusz.maliszewski@lubman.pl>
krasnik.pl
leczna.pl
lubartow.pl
lublin.pl
poniatowa.pl
swidnik.pl

// Lug.org.uk : https://lug.org.uk
// Submitted by Jon Spriggs <admin@lug.org.uk>
glug.org.uk
lug.org.uk
lugs.org.uk

// Lukanet Ltd : https://lukanet.com
// Submitted by Anton Avramov <register@lukanet.com>
barsy.bg
barsy.co.uk
barsyonline.co.uk
barsycenter.com
barsyonline.com
barsy.club
barsy.de
barsy.eu
barsy.in
barsy.info
barsy.io
barsy.me
barsy.menu
barsy.mobi
barsy.net
barsy.online
barsy.org
barsy.pro
barsy.pub
barsy.ro
barsy.shop
barsy.site
barsy.support
barsy.uk

// Magento Commerce
// Submitted by Damien Tournoud <dtournoud@magento.cloud>
*.magentosite.cloud

// May First - People Link : https://mayfirst.org/
// Submitted by Jamie McClelland <info@mayfirst.org>
mayfirst.info
mayfirst.org

// Mail.Ru Group : https://hb.cldmail.ru
// Submitted by Ilya Zaretskiy <zaretskiy@corp.mail.ru>
hb.cldmail.ru

// Mail Transfer Platform : https://www.neupeer.com
// Submitted by Li Hui <lihui@neupeer.com>
cn.vu

// Maze Play: https://www.mazeplay.com
// Submitted by Adam Humpherys <adam@mws.dev>
mazeplay.com

// mcpe.me : https://mcpe.me
// Submitted by Noa Heyl <hi@noa.dev>
mcpe.me

// McHost : https://mchost.ru
// Submitted by Evgeniy Subbotin <e.subbotin@mchost.ru>
mcdir.me
mcdir.ru
mcpre.ru
vps.mcdir.ru

// Mediatech : https://mediatech.by
// Submitted by Evgeniy Kozhuhovskiy <ugenk@mediatech.by>
mediatech.by
mediatech.dev

// Medicom Health : https://medicomhealth.com
// Submitted by Michael Olson <molson@medicomhealth.com>
hra.health

// Memset hosting : https://www.memset.com
// Submitted by Tom Whitwell <domains@memset.com>
miniserver.com
memset.net

// Messerli Informatik AG : https://www.messerli.ch/
// Submitted by Ruben Schmidmeister <psl-maintainers@messerli.ch>
messerli.app

// MetaCentrum, CESNET z.s.p.o. : https://www.metacentrum.cz/en/
// Submitted by Zdeněk Šustr <zdenek.sustr@cesnet.cz>
*.cloud.metacentrum.cz
custom.metacentrum.cz

// MetaCentrum, CESNET z.s.p.o. : https://www.metacentrum.cz/en/
// Submitted by Radim Janča <janca@cesnet.cz>
flt.cloud.muni.cz
usr.cloud.muni.cz

// Meteor Development Group : https://www.meteor.com/hosting
// Submitted by Pierre Carrier <pierre@meteor.com>
meteorapp.com
eu.meteorapp.com

// Michau Enterprises Limited : http://www.co.pl/
co.pl

// Microsoft Corporation : http://microsoft.com
// Submitted by Public Suffix List Admin <msftpsladmin@microsoft.com>
*.azurecontainer.io
azurewebsites.net
azure-mobile.net
cloudapp.net
azurestaticapps.net
1.azurestaticapps.net
2.azurestaticapps.net
3.azurestaticapps.net
centralus.azurestaticapps.net
eastasia.azurestaticapps.net
eastus2.azurestaticapps.net
westeurope.azurestaticapps.net
westus2.azurestaticapps.net

// minion.systems : http://minion.systems
// Submitted by Robert Böttinger <r@minion.systems>
csx.cc

// Mintere : https://mintere.com/
// Submitted by Ben Aubin <security@mintere.com>
mintere.site

// MobileEducation, LLC : https://joinforte.com
// Submitted by Grayson Martin <grayson.martin@mobileeducation.us>
forte.id

// Mozilla Corporation : https://mozilla.com
// Submitted by Ben Francis <bfrancis@mozilla.com>
mozilla-iot.org

// Mozilla Foundation : https://mozilla.org/
// Submitted by glob <glob@mozilla.com>
bmoattachments.org

// MSK-IX : https://www.msk-ix.ru/
// Submitted by Khannanov Roman <r.khannanov@msk-ix.ru>
net.ru
org.ru
pp.ru

// Mythic Beasts : https://www.mythic-beasts.com
// Submitted by Paul Cammish <kelduum@mythic-beasts.com>
hostedpi.com
customer.mythic-beasts.com
caracal.mythic-beasts.com
fentiger.mythic-beasts.com
lynx.mythic-beasts.com
ocelot.mythic-beasts.com
oncilla.mythic-beasts.com
onza.mythic-beasts.com
sphinx.mythic-beasts.com
vs.mythic-beasts.com
x.mythic-beasts.com
yali.mythic-beasts.com
cust.retrosnub.co.uk

// Nabu Casa : https://www.nabucasa.com
// Submitted by Paulus Schoutsen <infra@nabucasa.com>
ui.nabu.casa

// Net at Work Gmbh : https://www.netatwork.de
// Submitted by Jan Jaeschke <jan.jaeschke@netatwork.de>
cloud.nospamproxy.com

// Netlify : https://www.netlify.com
// Submitted by Jessica Parsons <jessica@netlify.com>
netlify.app

// Neustar Inc.
// Submitted by Trung Tran <Trung.Tran@neustar.biz>
4u.com

// ngrok : https://ngrok.com/
// Submitted by Alan Shreve <alan@ngrok.com>
ngrok.app
ngrok-free.app
ngrok.dev
ngrok-free.dev
ngrok.io
ap.ngrok.io
au.ngrok.io
eu.ngrok.io
in.ngrok.io
jp.ngrok.io
sa.ngrok.io
us.ngrok.io
ngrok.pizza

// Nimbus Hosting Ltd. : https://www.nimbushosting.co.uk/
// Submitted by Nicholas Ford <nick@nimbushosting.co.uk>
nh-serv.co.uk

// NFSN, Inc. : https://www.NearlyFreeSpeech.NET/
// Submitted by Jeff Wheelhouse <support@nearlyfreespeech.net>
nfshost.com

// Noop : https://noop.app
// Submitted by Nathaniel Schweinberg <noop@rearc.io>
*.developer.app
noop.app

// Northflank Ltd. : https://northflank.com/
// Submitted by Marco Suter <marco@northflank.com>
*.northflank.app
*.build.run
*.code.run
*.database.run
*.migration.run

// Noticeable : https://noticeable.io
// Submitted by Laurent Pellegrino <security@noticeable.io>
noticeable.news

// Now-DNS : https://now-dns.com
// Submitted by Steve Russell <steve@now-dns.com>
dnsking.ch
mypi.co
n4t.co
001www.com
ddnslive.com
myiphost.com
forumz.info
16-b.it
32-b.it
64-b.it
soundcast.me
tcp4.me
dnsup.net
hicam.net
now-dns.net
ownip.net
vpndns.net
dynserv.org
now-dns.org
x443.pw
now-dns.top
ntdll.top
freeddns.us
crafting.xyz
zapto.xyz

// nsupdate.info : https://www.nsupdate.info/
// Submitted by Thomas Waldmann <info@nsupdate.info>
nsupdate.info
nerdpol.ovh

// No-IP.com : https://noip.com/
// Submitted by Deven Reza <publicsuffixlist@noip.com>
blogsyte.com
brasilia.me
cable-modem.org
ciscofreak.com
collegefan.org
couchpotatofries.org
damnserver.com
ddns.me
ditchyourip.com
dnsfor.me
dnsiskinky.com
dvrcam.info
dynns.com
eating-organic.net
fantasyleague.cc
geekgalaxy.com
golffan.us
health-carereform.com
homesecuritymac.com
homesecuritypc.com
hopto.me
ilovecollege.info
loginto.me
mlbfan.org
mmafan.biz
myactivedirectory.com
mydissent.net
myeffect.net
mymediapc.net
mypsx.net
mysecuritycamera.com
mysecuritycamera.net
mysecuritycamera.org
net-freaks.com
nflfan.org
nhlfan.net
no-ip.ca
no-ip.co.uk
no-ip.net
noip.us
onthewifi.com
pgafan.net
point2this.com
pointto.us
privatizehealthinsurance.net
quicksytes.com
read-books.org
securitytactics.com
serveexchange.com
servehumour.com
servep2p.com
servesarcasm.com
stufftoread.com
ufcfan.org
unusualperson.com
workisboring.com
3utilities.com
bounceme.net
ddns.net
ddnsking.com
gotdns.ch
hopto.org
myftp.biz
myftp.org
myvnc.com
no-ip.biz
no-ip.info
no-ip.org
noip.me
redirectme.net
servebeer.com
serveblog.net
servecounterstrike.com
serveftp.com
servegame.com
servehalflife.com
servehttp.com
serveirc.com
serveminecraft.net
servemp3.com
servepics.com
servequake.com
sytes.net
webhop.me
zapto.org

// NodeArt : https://nodeart.io
// Submitted by Konstantin Nosov <Nosov@nodeart.io>
stage.nodeart.io

// Nucleos Inc. : https://nucleos.com
// Submitted by Piotr Zduniak <piotr@nucleos.com>
pcloud.host

// NYC.mn : http://www.information.nyc.mn
// Submitted by Matthew Brown <mattbrown@nyc.mn>
nyc.mn

// Observable, Inc. : https://observablehq.com
// Submitted by Mike Bostock <dns@observablehq.com>
static.observableusercontent.com

// Octopodal Solutions, LLC. : https://ulterius.io/
// Submitted by Andrew Sampson <andrew@ulterius.io>
cya.gg

// OMG.LOL : <https://omg.lol>
// Submitted by Adam Newbold <adam@omg.lol>
omg.lol

// Omnibond Systems, LLC. : https://www.omnibond.com
// Submitted by Cole Estep <cole@omnibond.com>
cloudycluster.net

// OmniWe Limited: https://omniwe.com
// Submitted by Vicary Archangel <vicary@omniwe.com>
omniwe.site

// One.com: https://www.one.com/
// Submitted by Jacob Bunk Nielsen <jbn@one.com>
123hjemmeside.dk
123hjemmeside.no
123homepage.it
123kotisivu.fi
123minsida.se
123miweb.es
123paginaweb.pt
123sait.ru
123siteweb.fr
123webseite.at
123webseite.de
123website.be
123website.ch
123website.lu
123website.nl
service.one
simplesite.com
simplesite.com.br
simplesite.gr
simplesite.pl

// One Fold Media : http://www.onefoldmedia.com/
// Submitted by Eddie Jones <eddie@onefoldmedia.com>
nid.io

// Open Social : https://www.getopensocial.com/
// Submitted by Alexander Varwijk <security@getopensocial.com>
opensocial.site

// OpenCraft GmbH : http://opencraft.com/
// Submitted by Sven Marnach <sven@opencraft.com>
opencraft.hosting

// OpenResearch GmbH: https://openresearch.com/
// Submitted by Philipp Schmid <ops@openresearch.com>
orsites.com

// Opera Software, A.S.A.
// Submitted by Yngve Pettersen <yngve@opera.com>
operaunite.com

// Orange : https://www.orange.com
// Submitted by Alexandre Linte <alexandre.linte@orange.com>
tech.orange

// Oursky Limited : https://authgear.com/, https://skygear.io/
// Submitted by Authgear Team <hello@authgear.com>, Skygear Developer <hello@skygear.io>
authgear-staging.com
authgearapps.com
skygearapp.com

// OutSystems
// Submitted by Duarte Santos <domain-admin@outsystemscloud.com>
outsystemscloud.com

// OVHcloud: https://ovhcloud.com
// Submitted by Vincent Cassé <vincent.casse@ovhcloud.com>
*.webpaas.ovh.net
*.hosting.ovh.net

// OwnProvider GmbH: http://www.ownprovider.com
// Submitted by Jan Moennich <jan.moennich@ownprovider.com>
ownprovider.com
own.pm

// OwO : https://whats-th.is/
// Submitted by Dean Sheather <dean@deansheather.com>
*.owo.codes

// OX : http://www.ox.rs
// Submitted by Adam Grand <webmaster@mail.ox.rs>
ox.rs

// oy.lc
// Submitted by Charly Coste <changaco@changaco.oy.lc>
oy.lc

// Pagefog : https://pagefog.com/
// Submitted by Derek Myers <derek@pagefog.com>
pgfog.com

// Pagefront : https://www.pagefronthq.com/
// Submitted by Jason Kriss <jason@pagefronthq.com>
pagefrontapp.com

// PageXL : https://pagexl.com
// Submitted by Yann Guichard <yann@pagexl.com>
pagexl.com

// Paywhirl, Inc : https://paywhirl.com/
// Submitted by Daniel Netzer <dan@paywhirl.com>
*.paywhirl.com

// pcarrier.ca Software Inc: https://pcarrier.ca/
// Submitted by Pierre Carrier <pc@rrier.ca>
bar0.net
bar1.net
bar2.net
rdv.to

// .pl domains (grandfathered)
art.pl
gliwice.pl
krakow.pl
poznan.pl
wroc.pl
zakopane.pl

// Pantheon Systems, Inc. : https://pantheon.io/
// Submitted by Gary Dylina <gary@pantheon.io>
pantheonsite.io
gotpantheon.com

// Peplink | Pepwave : http://peplink.com/
// Submitted by Steve Leung <steveleung@peplink.com>
mypep.link

// Perspecta : https://perspecta.com/
// Submitted by Kenneth Van Alstyne <kvanalstyne@perspecta.com>
perspecta.cloud

// PE Ulyanov Kirill Sergeevich : https://airy.host
// Submitted by Kirill Ulyanov <k.ulyanov@airy.host>
lk3.ru

// Planet-Work : https://www.planet-work.com/
// Submitted by Frédéric VANNIÈRE <f.vanniere@planet-work.com>
on-web.fr

// Platform.sh : https://platform.sh
// Submitted by Nikola Kotur <nikola@platform.sh>
bc.platform.sh
ent.platform.sh
eu.platform.sh
us.platform.sh
*.platformsh.site
*.tst.site

// Platter: https://platter.dev
// Submitted by Patrick Flor <patrick@platter.dev>
platter-app.com
platter-app.dev
platterp.us

// Plesk : https://www.plesk.com/
// Submitted by Anton Akhtyamov <program-managers@plesk.com>
pdns.page
plesk.page
pleskns.com

// Port53 : https://port53.io/
// Submitted by Maximilian Schieder <maxi@zeug.co>
dyn53.io

// Porter : https://porter.run/
// Submitted by Rudraksh MK <rudi@porter.run>
onporter.run

// Positive Codes Technology Company : http://co.bn/faq.html
// Submitted by Zulfais <pc@co.bn>
co.bn

// Postman, Inc : https://postman.com
// Submitted by Rahul Dhawan <security@postman.com>
postman-echo.com
pstmn.io
mock.pstmn.io
httpbin.org

//prequalifyme.today : https://prequalifyme.today
//Submitted by DeepakTiwari deepak@ivylead.io
prequalifyme.today

// prgmr.com : https://prgmr.com/
// Submitted by Sarah Newman <owner@prgmr.com>
xen.prgmr.com

// priv.at : http://www.nic.priv.at/
// Submitted by registry <lendl@nic.at>
priv.at

// privacytools.io : https://www.privacytools.io/
// Submitted by Jonah Aragon <jonah@privacytools.io>
prvcy.page

// Protocol Labs : https://protocol.ai/
// Submitted by Michael Burns <noc@protocol.ai>
*.dweb.link

// Protonet GmbH : http://protonet.io
// Submitted by Martin Meier <admin@protonet.io>
protonet.io

// Publication Presse Communication SARL : https://ppcom.fr
// Submitted by Yaacov Akiba Slama <admin@chirurgiens-dentistes-en-france.fr>
chirurgiens-dentistes-en-france.fr
byen.site

// pubtls.org: https://www.pubtls.org
// Submitted by Kor Nielsen <kor@pubtls.org>
pubtls.org

// PythonAnywhere LLP: https://www.pythonanywhere.com
// Submitted by Giles Thomas <giles@pythonanywhere.com>
pythonanywhere.com
eu.pythonanywhere.com

// QOTO, Org.
// Submitted by Jeffrey Phillips Freeman <jeffrey.freeman@qoto.org>
qoto.io

// Qualifio : https://qualifio.com/
// Submitted by Xavier De Cock <xdecock@gmail.com>
qualifioapp.com

// Quality Unit: https://qualityunit.com
// Submitted by Vasyl Tsalko <vtsalko@qualityunit.com>
ladesk.com

// QuickBackend: https://www.quickbackend.com
// Submitted by Dani Biro <dani@pymet.com>
qbuser.com

// Rad Web Hosting: https://radwebhosting.com
// Submitted by Scott Claeys <s.claeys@radwebhosting.com>
cloudsite.builders

// Redgate Software: https://red-gate.com
// Submitted by Andrew Farries <andrew.farries@red-gate.com>
instances.spawn.cc

// Redstar Consultants : https://www.redstarconsultants.com/
// Submitted by Jons Slemmer <jons@redstarconsultants.com>
instantcloud.cn

// Russian Academy of Sciences
// Submitted by Tech Support <support@rasnet.ru>
ras.ru

// QA2
// Submitted by Daniel Dent (https://www.danieldent.com/)
qa2.com

// QCX
// Submitted by Cassandra Beelen <cassandra@beelen.one>
qcx.io
*.sys.qcx.io

// QNAP System Inc : https://www.qnap.com
// Submitted by Nick Chang <nickchang@qnap.com>
dev-myqnapcloud.com
alpha-myqnapcloud.com
myqnapcloud.com

// Quip : https://quip.com
// Submitted by Patrick Linehan <plinehan@quip.com>
*.quipelements.com

// Qutheory LLC : http://qutheory.io
// Submitted by Jonas Schwartz <jonas@qutheory.io>
vapor.cloud
vaporcloud.io

// Rackmaze LLC : https://www.rackmaze.com
// Submitted by Kirill Pertsev <kika@rackmaze.com>
rackmaze.com
rackmaze.net

// Rakuten Games, Inc : https://dev.viberplay.io
// Submitted by Joshua Zhang <public-suffix@rgames.jp>
g.vbrplsbx.io

// Rancher Labs, Inc : https://rancher.com
// Submitted by Vincent Fiduccia <domains@rancher.com>
*.on-k3s.io
*.on-rancher.cloud
*.on-rio.io

// Read The Docs, Inc : https://www.readthedocs.org
// Submitted by David Fischer <team@readthedocs.org>
readthedocs.io

// Red Hat, Inc. OpenShift : https://openshift.redhat.com/
// Submitted by Tim Kramer <tkramer@rhcloud.com>
rhcloud.com

// Render : https://render.com
// Submitted by Anurag Goel <dev@render.com>
app.render.com
onrender.com

// Repl.it : https://repl.it
// Submitted by Lincoln Bergeson <lincoln@replit.com>
firewalledreplit.co
id.firewalledreplit.co
repl.co
id.repl.co
repl.run

// Resin.io : https://resin.io
// Submitted by Tim Perry <tim@resin.io>
resindevice.io
devices.resinstaging.io

// RethinkDB : https://www.rethinkdb.com/
// Submitted by Chris Kastorff <info@rethinkdb.com>
hzc.io

// Revitalised Limited : http://www.revitalised.co.uk
// Submitted by Jack Price <jack@revitalised.co.uk>
wellbeingzone.eu
wellbeingzone.co.uk

// Rico Developments Limited : https://adimo.co
// Submitted by Colin Brown <hello@adimo.co>
adimo.co.uk

// Riseup Networks : https://riseup.net
// Submitted by Micah Anderson <micah@riseup.net>
itcouldbewor.se

// Rochester Institute of Technology : http://www.rit.edu/
// Submitted by Jennifer Herting <jchits@rit.edu>
git-pages.rit.edu

// Rocky Enterprise Software Foundation : https://resf.org
// Submitted by Neil Hanlon <neil@resf.org>
rocky.page

// Rusnames Limited: http://rusnames.ru/
// Submitted by Sergey Zotov <admin@rusnames.ru>
биз.рус
ком.рус
крым.рус
мир.рус
мск.рус
орг.рус
самара.рус
сочи.рус
спб.рус
я.рус

// SAKURA Internet Inc. : https://www.sakura.ad.jp/
// Submitted by Internet Service Department <rs-vendor-ml@sakura.ad.jp>
180r.com
dojin.com
sakuratan.com
sakuraweb.com
x0.com
2-d.jp
bona.jp
crap.jp
daynight.jp
eek.jp
flop.jp
halfmoon.jp
jeez.jp
matrix.jp
mimoza.jp
ivory.ne.jp
mail-box.ne.jp
mints.ne.jp
mokuren.ne.jp
opal.ne.jp
sakura.ne.jp
sumomo.ne.jp
topaz.ne.jp
netgamers.jp
nyanta.jp
o0o0.jp
rdy.jp
rgr.jp
rulez.jp
s3.isk01.sakurastorage.jp
s3.isk02.sakurastorage.jp
saloon.jp
sblo.jp
skr.jp
tank.jp
uh-oh.jp
undo.jp
rs.webaccel.jp
user.webaccel.jp
websozai.jp
xii.jp
squares.net
jpn.org
kirara.st
x0.to
from.tv
sakura.tv

// Salesforce.com, Inc. https://salesforce.com/
// Submitted by Michael Biven <mbiven@salesforce.com>
*.builder.code.com
*.dev-builder.code.com
*.stg-builder.code.com

// Sandstorm Development Group, Inc. : https://sandcats.io/
// Submitted by Asheesh Laroia <asheesh@sandstorm.io>
sandcats.io

// SBE network solutions GmbH : https://www.sbe.de/
// Submitted by Norman Meilick <nm@sbe.de>
logoip.de
logoip.com

// Scaleway : https://www.scaleway.com/
// Submitted by Rémy Léone <rleone@scaleway.com>
fr-par-1.baremetal.scw.cloud
fr-par-2.baremetal.scw.cloud
nl-ams-1.baremetal.scw.cloud
fnc.fr-par.scw.cloud
functions.fnc.fr-par.scw.cloud
k8s.fr-par.scw.cloud
nodes.k8s.fr-par.scw.cloud
s3.fr-par.scw.cloud
s3-website.fr-par.scw.cloud
whm.fr-par.scw.cloud
priv.instances.scw.cloud
pub.instances.scw.cloud
k8s.scw.cloud
k8s.nl-ams.scw.cloud
nodes.k8s.nl-ams.scw.cloud
s3.nl-ams.scw.cloud
s3-website.nl-ams.scw.cloud
whm.nl-ams.scw.cloud
k8s.pl-waw.scw.cloud
nodes.k8s.pl-waw.scw.cloud
s3.pl-waw.scw.cloud
s3-website.pl-waw.scw.cloud
scalebook.scw.cloud
smartlabeling.scw.cloud
dedibox.fr

// schokokeks.org GbR : https://schokokeks.org/
// Submitted by Hanno Böck <hanno@schokokeks.org>
schokokeks.net

// Scottish Government: https://www.gov.scot
// Submitted by Martin Ellis <martin.ellis@gov.scot>
gov.scot
service.gov.scot

// Scry Security : http://www.scrysec.com
// Submitted by Shante Adam <shante@skyhat.io>
scrysec.com

// Securepoint GmbH : https://www.securepoint.de
// Submitted by Erik Anders <erik.anders@securepoint.de>
firewall-gateway.com
firewall-gateway.de
my-gateway.de
my-router.de
spdns.de
spdns.eu
firewall-gateway.net
my-firewall.org
myfirewall.org
spdns.org

// Seidat : https://www.seidat.com
// Submitted by Artem Kondratev <accounts@seidat.com>
seidat.net

// Sellfy : https://sellfy.com
// Submitted by Yuriy Romadin <contact@sellfy.com>
sellfy.store

// Senseering GmbH : https://www.senseering.de
// Submitted by Felix Mönckemeyer <f.moenckemeyer@senseering.de>
senseering.net

// Sendmsg: https://www.sendmsg.co.il
// Submitted by Assaf Stern <domains@comstar.co.il>
minisite.ms

// Service Magnet : https://myservicemagnet.com
// Submitted by Dave Sanders <dave@myservicemagnet.com>
magnet.page

// Service Online LLC : http://drs.ua/
// Submitted by Serhii Bulakh <support@drs.ua>
biz.ua
co.ua
pp.ua

// Shift Crypto AG : https://shiftcrypto.ch
// Submitted by alex <alex@shiftcrypto.ch>
shiftcrypto.dev
shiftcrypto.io

// ShiftEdit : https://shiftedit.net/
// Submitted by Adam Jimenez <adam@shiftcreate.com>
shiftedit.io

// Shopblocks : http://www.shopblocks.com/
// Submitted by Alex Bowers <alex@shopblocks.com>
myshopblocks.com

// Shopify : https://www.shopify.com
// Submitted by Alex Richter <alex.richter@shopify.com>
myshopify.com

// Shopit : https://www.shopitcommerce.com/
// Submitted by Craig McMahon <craig@shopitcommerce.com>
shopitsite.com

// shopware AG : https://shopware.com
// Submitted by Jens Küper <cloud@shopware.com>
shopware.store

// Siemens Mobility GmbH
// Submitted by Oliver Graebner <security@mo-siemens.io>
mo-siemens.io

// SinaAppEngine : http://sae.sina.com.cn/
// Submitted by SinaAppEngine <saesupport@sinacloud.com>
1kapp.com
appchizi.com
applinzi.com
sinaapp.com
vipsinaapp.com

// Siteleaf : https://www.siteleaf.com/
// Submitted by Skylar Challand <support@siteleaf.com>
siteleaf.net

// Skyhat : http://www.skyhat.io
// Submitted by Shante Adam <shante@skyhat.io>
bounty-full.com
alpha.bounty-full.com
beta.bounty-full.com

// Smallregistry by Promopixel SARL: https://www.smallregistry.net
// Former AFNIC's SLDs 
// Submitted by Jérôme Lipowicz <support@promopixel.com>
aeroport.fr
avocat.fr
chambagri.fr
chirurgiens-dentistes.fr
experts-comptables.fr
medecin.fr
notaires.fr
pharmacien.fr
port.fr
veterinaire.fr

// Small Technology Foundation : https://small-tech.org
// Submitted by Aral Balkan <aral@small-tech.org>
small-web.org

// Smoove.io : https://www.smoove.io/
// Submitted by Dan Kozak <dan@smoove.io>
vp4.me

// Snowflake Inc : https://www.snowflake.com/
// Submitted by Faith Olapade <faith.olapade@snowflake.com>
snowflake.app
privatelink.snowflake.app
streamlit.app
streamlitapp.com

// Snowplow Analytics : https://snowplowanalytics.com/
// Submitted by Ian Streeter <ian@snowplowanalytics.com>
try-snowplow.com

// SourceHut : https://sourcehut.org
// Submitted by Drew DeVault <sir@cmpwn.com>
srht.site

// Stackhero : https://www.stackhero.io
// Submitted by Adrien Gillon <adrien+public-suffix-list@stackhero.io>
stackhero-network.com

// Staclar : https://staclar.com
// Submitted by Q Misell <q@staclar.com>
musician.io
// Submitted by Matthias Merkel <matthias.merkel@staclar.com>
novecore.site

// staticland : https://static.land
// Submitted by Seth Vincent <sethvincent@gmail.com>
static.land
dev.static.land
sites.static.land

// Storebase : https://www.storebase.io
// Submitted by Tony Schirmer <tony@storebase.io>
storebase.store

// Strategic System Consulting (eApps Hosting): https://www.eapps.com/
// Submitted by Alex Oancea <aoancea@cloudscale365.com>
vps-host.net
atl.jelastic.vps-host.net
njs.jelastic.vps-host.net
ric.jelastic.vps-host.net

// Sony Interactive Entertainment LLC : https://sie.com/
// Submitted by David Coles <david.coles@sony.com>
playstation-cloud.com

// SourceLair PC : https://www.sourcelair.com
// Submitted by Antonis Kalipetis <akalipetis@sourcelair.com>
apps.lair.io
*.stolos.io

// SpaceKit : https://www.spacekit.io/
// Submitted by Reza Akhavan <spacekit.io@gmail.com>
spacekit.io

// SpeedPartner GmbH: https://www.speedpartner.de/
// Submitted by Stefan Neufeind <info@speedpartner.de>
customer.speedpartner.de

// Spreadshop (sprd.net AG) : https://www.spreadshop.com/
// Submitted by Martin Breest <security@spreadshop.com>
myspreadshop.at
myspreadshop.com.au
myspreadshop.be
myspreadshop.ca
myspreadshop.ch
myspreadshop.com
myspreadshop.de
myspreadshop.dk
myspreadshop.es
myspreadshop.fi
myspreadshop.fr
myspreadshop.ie
myspreadshop.it
myspreadshop.net
myspreadshop.nl
myspreadshop.no
myspreadshop.pl
myspreadshop.se
myspreadshop.co.uk

// Standard Library : https://stdlib.com
// Submitted by Jacob Lee <jacob@stdlib.com>
api.stdlib.com

// Storipress : https://storipress.com
// Submitted by Benno Liu <benno@storipress.com>
storipress.app

// Storj Labs Inc. : https://storj.io/
// Submitted by Philip Hutchins <hostmaster@storj.io>
storj.farm

// Studenten Net Twente : http://www.snt.utwente.nl/
// Submitted by Silke Hofstra <syscom@snt.utwente.nl>
utwente.io

// Student-Run Computing Facility : https://www.srcf.net/
// Submitted by Edwin Balani <sysadmins@srcf.net>
soc.srcf.net
user.srcf.net

// Sub 6 Limited: http://www.sub6.com
// Submitted by Dan Miller <dm@sub6.com>
temp-dns.com

// Supabase : https://supabase.io
// Submitted by Inian Parameshwaran <security@supabase.io>
supabase.co
supabase.in
supabase.net
su.paba.se

// Symfony, SAS : https://symfony.com/
// Submitted by Fabien Potencier <fabien@symfony.com>
*.s5y.io
*.sensiosite.cloud

// Syncloud : https://syncloud.org
// Submitted by Boris Rybalkin <syncloud@syncloud.it>
syncloud.it

// Synology, Inc. : https://www.synology.com/
// Submitted by Rony Weng <ronyweng@synology.com>
dscloud.biz
direct.quickconnect.cn
dsmynas.com
familyds.com
diskstation.me
dscloud.me
i234.me
myds.me
synology.me
dscloud.mobi
dsmynas.net
familyds.net
dsmynas.org
familyds.org
vpnplus.to
direct.quickconnect.to

// Tabit Technologies Ltd. : https://tabit.cloud/
// Submitted by Oren Agiv <oren@tabit.cloud>
tabitorder.co.il
mytabit.co.il
mytabit.com

// TAIFUN Software AG : http://taifun-software.de
// Submitted by Bjoern Henke <dev-server@taifun-software.de>
taifun-dns.de

// Tailscale Inc. : https://www.tailscale.com
// Submitted by David Anderson <danderson@tailscale.com>
beta.tailscale.net
ts.net

// TASK geographical domains (www.task.gda.pl/uslugi/dns)
gda.pl
gdansk.pl
gdynia.pl
med.pl
sopot.pl

// team.blue https://team.blue
// Submitted by Cedric Dubois <cedric.dubois@team.blue>
site.tb-hosting.com

// Teckids e.V. : https://www.teckids.org
// Submitted by Dominik George <dominik.george@teckids.org>
edugit.io
s3.teckids.org

// Telebit : https://telebit.cloud
// Submitted by AJ ONeal <aj@telebit.cloud>
telebit.app
telebit.io
*.telebit.xyz

// Thingdust AG : https://thingdust.com/
// Submitted by Adrian Imboden <adi@thingdust.com>
*.firenet.ch
*.svc.firenet.ch
reservd.com
thingdustdata.com
cust.dev.thingdust.io
cust.disrec.thingdust.io
cust.prod.thingdust.io
cust.testing.thingdust.io
reservd.dev.thingdust.io
reservd.disrec.thingdust.io
reservd.testing.thingdust.io

// ticket i/O GmbH : https://ticket.io
// Submitted by Christian Franke <it@ticket.io>
tickets.io

// Tlon.io : https://tlon.io
// Submitted by Mark Staarink <mark@tlon.io>
arvo.network
azimuth.network
tlon.network

// Tor Project, Inc. : https://torproject.org
// Submitted by Antoine Beaupré <anarcat@torproject.org
torproject.net
pages.torproject.net

// TownNews.com : http://www.townnews.com
// Submitted by Dustin Ward <dward@townnews.com>
bloxcms.com
townnews-staging.com

// TrafficPlex GmbH : https://www.trafficplex.de/
// Submitted by Phillipp Röll <phillipp.roell@trafficplex.de>
12hp.at
2ix.at
4lima.at
lima-city.at
12hp.ch
2ix.ch
4lima.ch
lima-city.ch
trafficplex.cloud
de.cool
12hp.de
2ix.de
4lima.de
lima-city.de
1337.pictures
clan.rip
lima-city.rocks
webspace.rocks
lima.zone

// TransIP : https://www.transip.nl
// Submitted by Rory Breuk <rbreuk@transip.nl>
*.transurl.be
*.transurl.eu
*.transurl.nl

// TransIP: https://www.transip.nl
// Submitted by Cedric Dubois <cedric.dubois@team.blue>
site.transip.me

// TuxFamily : http://tuxfamily.org
// Submitted by TuxFamily administrators <adm@staff.tuxfamily.org>
tuxfamily.org

// TwoDNS : https://www.twodns.de/
// Submitted by TwoDNS-Support <support@two-dns.de>
dd-dns.de
diskstation.eu
diskstation.org
dray-dns.de
draydns.de
dyn-vpn.de
dynvpn.de
mein-vigor.de
my-vigor.de
my-wan.de
syno-ds.de
synology-diskstation.de
synology-ds.de

// Typedream : https://typedream.com
// Submitted by Putri Karunia <putri@typedream.com>
typedream.app

// Typeform : https://www.typeform.com
// Submitted by Sergi Ferriz <sergi.ferriz@typeform.com>
pro.typeform.com

// Uberspace : https://uberspace.de
// Submitted by Moritz Werner <mwerner@jonaspasche.com>
uber.space
*.uberspace.de

// UDR Limited : http://www.udr.hk.com
// Submitted by registry <hostmaster@udr.hk.com>
hk.com
hk.org
ltd.hk
inc.hk

// UK Intis Telecom LTD : https://it.com
// Submitted by ITComdomains <to@it.com>
it.com

// UNIVERSAL DOMAIN REGISTRY : https://www.udr.org.yt/
// see also: whois -h whois.udr.org.yt help
// Submitted by Atanunu Igbunuroghene <publicsuffixlist@udr.org.yt>
name.pm
sch.tf
biz.wf
sch.wf
org.yt

// United Gameserver GmbH : https://united-gameserver.de
// Submitted by Stefan Schwarz <sysadm@united-gameserver.de>
virtualuser.de
virtual-user.de

// Upli : https://upli.io
// Submitted by Lenny Bakkalian <lenny.bakkalian@gmail.com>
upli.io

// urown.net : https://urown.net
// Submitted by Hostmaster <hostmaster@urown.net>
urown.cloud
dnsupdate.info

// .US
// Submitted by Ed Moore <Ed.Moore@lib.de.us>
lib.de.us

// VeryPositive SIA : http://very.lv
// Submitted by Danko Aleksejevs <danko@very.lv>
2038.io

// Vercel, Inc : https://vercel.com/
// Submitted by Connor Davis <security@vercel.com>
vercel.app
vercel.dev
now.sh

// Viprinet Europe GmbH : http://www.viprinet.com
// Submitted by Simon Kissel <hostmaster@viprinet.com>
router.management

// Virtual-Info : https://www.virtual-info.info/
// Submitted by Adnan RIHAN <hostmaster@v-info.info>
v-info.info

// Voorloper.com: https://voorloper.com
// Submitted by Nathan van Bakel <info@voorloper.com>
voorloper.cloud

// Voxel.sh DNS : https://voxel.sh/dns/
// Submitted by Mia Rehlinger <dns@voxel.sh>
neko.am
nyaa.am
be.ax
cat.ax
es.ax
eu.ax
gg.ax
mc.ax
us.ax
xy.ax
nl.ci
xx.gl
app.gp
blog.gt
de.gt
to.gt
be.gy
cc.hn
blog.kg
io.kg
jp.kg
tv.kg
uk.kg
us.kg
de.ls
at.md
de.md
jp.md
to.md
indie.porn
vxl.sh
ch.tc
me.tc
we.tc
nyan.to
at.vg
blog.vu
dev.vu
me.vu

// V.UA Domain Administrator : https://domain.v.ua/
// Submitted by Serhii Rostilo <sergey@rostilo.kiev.ua>
v.ua

// Vultr Objects : https://www.vultr.com/products/object-storage/
// Submitted by Niels Maumenee <storage@vultr.com>
*.vultrobjects.com

// Waffle Computer Inc., Ltd. : https://docs.waffleinfo.com
// Submitted by Masayuki Note <masa@blade.wafflecell.com>
wafflecell.com

// WebHare bv: https://www.webhare.com/
// Submitted by Arnold Hendriks <info@webhare.com>
*.webhare.dev

// WebHotelier Technologies Ltd: https://www.webhotelier.net/
// Submitted by Apostolos Tsakpinis <apostolos.tsakpinis@gmail.com>
reserve-online.net
reserve-online.com
bookonline.app
hotelwithflight.com

// WeDeploy by Liferay, Inc. : https://www.wedeploy.com
// Submitted by Henrique Vicente <security@wedeploy.com>
wedeploy.io
wedeploy.me
wedeploy.sh

// Western Digital Technologies, Inc : https://www.wdc.com
// Submitted by Jung Jin <jungseok.jin@wdc.com>
remotewd.com

// WIARD Enterprises : https://wiardweb.com
// Submitted by Kidd Hustle <kiddhustle@wiardweb.com>
pages.wiardweb.com

// Wikimedia Labs : https://wikitech.wikimedia.org
// Submitted by Arturo Borrero Gonzalez <aborrero@wikimedia.org>
wmflabs.org
toolforge.org
wmcloud.org

// WISP : https://wisp.gg
// Submitted by Stepan Fedotov <stepan@wisp.gg>
panel.gg
daemon.panel.gg

// Wizard Zines : https://wizardzines.com
// Submitted by Julia Evans <julia@wizardzines.com>
messwithdns.com

// WoltLab GmbH : https://www.woltlab.com
// Submitted by Tim Düsterhus <security@woltlab.cloud>
woltlab-demo.com
myforum.community
community-pro.de
diskussionsbereich.de
community-pro.net
meinforum.net

// Woods Valldata : https://www.woodsvalldata.co.uk/
// Submitted by Chris Whittle <chris.whittle@woodsvalldata.co.uk>
affinitylottery.org.uk
raffleentry.org.uk
weeklylottery.org.uk

// WP Engine : https://wpengine.com/
// Submitted by Michael Smith <michael.smith@wpengine.com>
// Submitted by Brandon DuRette <brandon.durette@wpengine.com>
wpenginepowered.com
js.wpenginepowered.com

// Wix.com, Inc. : https://www.wix.com
// Submitted by Shahar Talmi <shahar@wix.com>
wixsite.com
editorx.io
wixstudio.io
wix.run

// XenonCloud GbR: https://xenoncloud.net
// Submitted by Julian Uphoff <publicsuffixlist@xenoncloud.net>
half.host

// XnBay Technology : http://www.xnbay.com/
// Submitted by XnBay Developer <developer.xncloud@gmail.com>
xnbay.com
u2.xnbay.com
u2-local.xnbay.com

// XS4ALL Internet bv : https://www.xs4all.nl/
// Submitted by Daniel Mostertman <unixbeheer+publicsuffix@xs4all.net>
cistron.nl
demon.nl
xs4all.space

// Yandex.Cloud LLC: https://cloud.yandex.com
// Submitted by Alexander Lodin <security+psl@yandex-team.ru>
yandexcloud.net
storage.yandexcloud.net
website.yandexcloud.net

// YesCourse Pty Ltd : https://yescourse.com
// Submitted by Atul Bhouraskar <atul@yescourse.com>
official.academy

// Yola : https://www.yola.com/
// Submitted by Stefano Rivera <stefano@yola.com>
yolasite.com

// Yombo : https://yombo.net
// Submitted by Mitch Schwenk <mitch@yombo.net>
ybo.faith
yombo.me
homelink.one
ybo.party
ybo.review
ybo.science
ybo.trade

// Yunohost : https://yunohost.org
// Submitted by Valentin Grimaud <security@yunohost.org>
ynh.fr
nohost.me
noho.st

// ZaNiC : http://www.za.net/
// Submitted by registry <hostmaster@nic.za.net>
za.net
za.org

// Zine EOOD : https://zine.bg/
// Submitted by Martin Angelov <martin@zine.bg>
bss.design

// Zitcom A/S : https://www.zitcom.dk
// Submitted by Emil Stahl <esp@zitcom.dk>
basicserver.io
virtualserver.io
enterprisecloud.nu

// ===END PRIVATE DOMAINS===
`.split("\n").filter(line => !line.startsWith("//") && line.trim().length > 0).sort((lineLeft, lineRight) => lineRight.length - lineLeft.length);

	async function formatFilename(content, doc, options) {
		let filename = (await evalTemplate(options.filenameTemplate, options, content, doc)) || "";
		filename = filename.trim();
		if (options.replaceEmojisInFilename) {
			EMOJIS.forEach(emoji => (filename = replaceAll(filename, emoji, " _" + EMOJI_NAMES[emoji] + "_ ")));
		}
		const replacementCharacter = options.filenameReplacementCharacter;
		filename = getValidFilename(filename, options.filenameReplacedCharacters, replacementCharacter);
		if (!options.backgroundSave) {
			filename = filename.replace(/\//g, replacementCharacter);
		}
		if (!options.keepFilename && ((options.filenameMaxLengthUnit == "bytes" && getContentSize(filename) > options.filenameMaxLength) || filename.length > options.filenameMaxLength)) {
			const extensionMatch = filename.match(/(\.[^.]{3,4})$/);
			const extension = extensionMatch && extensionMatch[0] && extensionMatch[0].length > 1 ? extensionMatch[0] : "";
			filename = options.filenameMaxLengthUnit == "bytes" ? await truncateText(filename, options.filenameMaxLength - extension.length) : filename.substring(0, options.filenameMaxLength - extension.length);
			filename = filename + "…" + extension;
		}
		if (!filename) {
			filename = "Unnamed page";
		}
		if (filename.startsWith(".")) {
			filename = "Unnamed page" + filename;
		}
		return filename.trim();
	}

	async function evalTemplate(template = "", options, content, doc, dontReplaceSlash) {
		const url = new URL$3(options.saveUrl);
		const urlHref = decode(url.href);
		const params = Array.from(new URLSearchParams$1(url.search));
		const bookmarkFolder = (options.bookmarkFolders && options.bookmarkFolders.join("/")) || "";
		const dontReplaceSlashIfUndefined = dontReplaceSlash === undefined ? true : dontReplaceSlash;
		const urlSuffix = PUBLIC_SUFFIX_LIST.find(urlTopLevelDomainName => url.hostname.endsWith("." + urlTopLevelDomainName) && urlTopLevelDomainName);
		const urlDomainName = urlSuffix ? url.hostname.substring(0, url.hostname.length - urlSuffix.length - 1) : url.hostname;
		const indexLastDotCharacter = urlDomainName.lastIndexOf(".");
		let urlSubDomains = urlDomainName.substring(0, indexLastDotCharacter == -1 ? 0 : indexLastDotCharacter);
		const urlDomain = urlDomainName.substring(urlSubDomains.length ? urlSubDomains.length + 1 : 0);
		const urlRoot = urlDomain + "." + urlSuffix;
		if (urlSubDomains.startsWith("www.")) {
			urlSubDomains = urlSubDomains.substring(4);
		} else if (urlSubDomains == "www") {
			urlSubDomains = "";
		}
		const variables = {
			"page-title": { getter: () => options.title },
			"page-heading": { getter: () => options.info.heading },
			"page-language": { getter: () => options.info.lang },
			"page-description": { getter: () => options.info.description },
			"page-author": { getter: () => options.info.author },
			"page-creator": { getter: () => options.info.creator },
			"page-publisher": { getter: () => options.info.publisher },
			"url-hash": { getter: () => url.hash.substring(1) },
			"url-host": { getter: () => url.host.replace(/\/$/, "") },
			"url-hostname": { getter: () => url.hostname.replace(/\/$/, "") },
			"url-hostname-suffix": { getter: () => urlSuffix },
			"url-hostname-domain": { getter: () => urlDomain },
			"url-hostname-root": { getter: () => urlRoot },
			"url-hostname-subdomains": { getter: () => urlSubDomains },
			"url-href": { getter: () => urlHref, dontReplaceSlash: dontReplaceSlashIfUndefined },
			"url-href-digest-sha-1": { getter: urlHref ? async () => digest("SHA-1", urlHref) : "" },
			"url-href-flat": { getter: () => decode(url.href), dontReplaceSlash: false },
			"url-referrer": { getter: () => decode(options.referrer), dontReplaceSlash: dontReplaceSlashIfUndefined },
			"url-referrer-flat": { getter: () => decode(options.referrer), dontReplaceSlash: false },
			"url-password": { getter: () => url.password },
			"url-pathname": { getter: () => decode(url.pathname).replace(/^\//, "").replace(/\/$/, ""), dontReplaceSlash: dontReplaceSlashIfUndefined },
			"url-pathname-flat": { getter: () => decode(url.pathname), dontReplaceSlash: false },
			"url-port": { getter: () => url.port },
			"url-protocol": { getter: () => url.protocol },
			"url-search": { getter: () => url.search.substring(1) },
			"url-username": { getter: () => url.username },
			"tab-id": { getter: () => String(options.tabId) },
			"tab-index": { getter: () => String(options.tabIndex) },
			"url-last-segment": { getter: () => decode(getLastSegment(url, options.filenameReplacementCharacter)) },
			"bookmark-pathname": { getter: () => bookmarkFolder, dontReplaceSlash: dontReplaceSlashIfUndefined },
			"bookmark-pathname-flat": { getter: () => bookmarkFolder, dontReplaceSlash: false },
			"profile-name": { getter: () => options.profileName },
			"filename-extension": { getter: () => getFilenameExtension(options) },
			"save-action": { getter: () => options.selected ? "selection" : "page" }
		};
		if (content) {
			variables["digest-sha-256"] = { getter: async () => digest("SHA-256", content) };
			variables["digest-sha-384"] = { getter: async () => digest("SHA-384", content) };
			variables["digest-sha-512"] = { getter: async () => digest("SHA-512", content) };
		}
		if (options.saveDate) {
			addDateVariables(options.saveDate);
		}
		if (options.visitDate) {
			addDateVariables(options.visitDate, "visit-");
		}
		const functions = {
			"if-empty": (...values) => {
				const defaultValue = values.pop();
				const foundValue = values.find(value => value);
				return foundValue ? foundValue : defaultValue;
			},
			"if-not-empty": (...values) => {
				const defaultValue = values.pop();
				const foundValue = values.find(value => value);
				return foundValue ? defaultValue : foundValue;
			},
			"if-equals": (value, otherValue, trueValue, falseValue) => value == otherValue ? trueValue : falseValue,
			"if-not-equals": (value, otherValue, trueValue, falseValue) => value != otherValue ? trueValue : falseValue,
			"if-contains": (value, otherValue, trueValue, falseValue) => otherValue && value.includes(otherValue) ? trueValue : falseValue,
			"if-not-contains": (value, otherValue, trueValue, falseValue) => otherValue && !value.includes(otherValue) ? trueValue : falseValue,
			"substring": (value, start, end) => value.substring(start, end),
			"lowercase": value => value.toLowerCase(),
			"uppercase": value => value.toUpperCase(),
			"capitalize": value => value.charAt(0).toUpperCase() + value.slice(1),
			"replace": (value, searchValue, replaceValue) => searchValue && replaceValue ? replaceAll(value, searchValue, replaceValue) : value,
			"trim": value => value.trim(),
			"trim-left": value => value.trimLeft(),
			"trim-right": value => value.trimRight(),
			"pad-left": (value, length, padString) => length > 0 ? value.padStart(length, padString) : value,
			"pad-right": (value, length, padString) => length > 0 ? value.padEnd(length, padString) : value,
			"repeat": (value, count) => count > 0 ? value.repeat(count) : "",
			"index-of": (value, searchValue, fromIndex) => value.indexOf(searchValue, fromIndex),
			"last-index-of": (value, searchValue, fromIndex) => value.lastIndexOf(searchValue, fromIndex),
			"length": value => value.length,
			"url-search-name": (index = 0) => params[index] && params[index][0],
			"url-search-value": (index = 0) => params[index] && params[index][1],
			"url-search-named-value": name => {
				const param = params.find(param => param[0] == name);
				return (param && param[1]);
			},
			"url-search": name => {
				const param = params.find(param => param[0] == name);
				return (param && param[1]);
			},
			"url-segment": (index = 0) => {
				const segments = decode(url.pathname).split("/");
				segments.pop();
				segments.push(getLastSegment(url, options.filenameReplacementCharacter));
				return segments[index];
			},
			"url-hostname-subdomain": (index = 0) => {
				const subdomains = urlSubDomains.split(".");
				return subdomains[subdomains.length - index - 1];
			},
			"stringify": value => { try { return JSON.stringify(value); } catch (error) { return value; } },
			"encode-uri": value => { try { return encodeURI(value); } catch (error) { return value; } },
			"decode-uri": value => { try { return decodeURI(value); } catch (error) { return value; } },
			"encode-uri-component": value => { try { return encodeURIComponent(value); } catch (error) { return value; } },
			"decode-uri-component": value => { try { return decodeURIComponent(value); } catch (error) { return value; } }
		};
		if (doc) {
			functions["page-element-text"] = (selector) => {
				const element = doc.querySelector(selector);
				return element && element.textContent;
			};
			functions["page-element-attribute"] = (selector, attribute) => {
				const element = doc.querySelector(selector);
				return element && element.getAttribute(attribute);
			};
		}
		template = replaceAll(template, "\\%", "\\\\%");
		template = replaceAll(template, "\\{", "\\\\{");
		template = replaceAll(template, "\\|", "\\\\|");
		template = replaceAll(template, "\\>", "\\\\>");
		let result = (await peg$parse(template, {
			async callFunction(name, [argument, optionalArguments], lengthData) {
				const fn = functions[name];
				if (fn) {
					argument = argument.replace(/\\\\(.)/g, "$1");
					if (!optionalArguments) {
						optionalArguments = [];
					}
					optionalArguments = optionalArguments
						.map(argument => argument.replace(/\\\\(.)/g, "$1"))
						.filter(argument => argument != undefined && argument != null && argument != "");
					if ((argument != undefined && argument != null && argument != "") || optionalArguments.length > 0) {
						try {
							return await getValue(() => fn(argument, ...optionalArguments), true, options.filenameReplacementCharacter, lengthData);
						} catch (error) {
							return "";
						}
					} else {
						return "";
					}
				} else {
					return "";
				}
			},
			getVariableValue(name, lengthData) {
				const variable = variables[name];
				if (variable) {
					return getValue(variable.getter, variable.dontReplaceSlash, options.filenameReplacementCharacter, lengthData);
				} else {
					return "";
				}
			}
		}));
		result = replaceAll(result, "\\\\%", "%");
		result = replaceAll(result, "\\\\{", "{");
		result = replaceAll(result, "\\\\|", "|");
		result = replaceAll(result, "\\\\>", ">");
		return result;

		function addDateVariables(date, prefix = "") {
			variables[prefix + "datetime-iso"] = { getter: () => date.toISOString() };
			variables[prefix + "date-iso"] = { getter: () => date.toISOString().split("T")[0] };
			variables[prefix + "time-iso"] = { getter: () => date.toISOString().split("T")[1].split("Z")[0] };
			variables[prefix + "date-locale"] = { getter: () => date.toLocaleDateString() };
			variables[prefix + "time-locale"] = { getter: () => date.toLocaleTimeString() };
			variables[prefix + "day-locale"] = { getter: () => String(date.getDate()).padStart(2, "0") };
			variables[prefix + "month-locale"] = { getter: () => String(date.getMonth() + 1).padStart(2, "0") };
			variables[prefix + "year-locale"] = { getter: () => String(date.getFullYear()) };
			variables[prefix + "datetime-locale"] = { getter: () => date.toLocaleString() };
			variables[prefix + "datetime-utc"] = { getter: () => date.toUTCString() };
			variables[prefix + "day-utc"] = { getter: () => String(date.getUTCDate()).padStart(2, "0") };
			variables[prefix + "month-utc"] = { getter: () => String(date.getUTCMonth() + 1).padStart(2, "0") };
			variables[prefix + "year-utc"] = { getter: () => String(date.getUTCFullYear()) };
			variables[prefix + "hours-locale"] = { getter: () => String(date.getHours()).padStart(2, "0") };
			variables[prefix + "minutes-locale"] = { getter: () => String(date.getMinutes()).padStart(2, "0") };
			variables[prefix + "seconds-locale"] = { getter: () => String(date.getSeconds()).padStart(2, "0") };
			variables[prefix + "hours-utc"] = { getter: () => String(date.getUTCHours()).padStart(2, "0") };
			variables[prefix + "minutes-utc"] = { getter: () => String(date.getUTCMinutes()).padStart(2, "0") };
			variables[prefix + "seconds-utc"] = { getter: () => String(date.getUTCSeconds()).padStart(2, "0") };
			variables[prefix + "time-ms"] = { getter: () => String(date.getTime()) };
		}
	}

	function replaceAll(string, search, replacement) {
		if (typeof string.replaceAll == "function") {
			return string.replaceAll(search, replacement);
		} else {
			const searchRegExp = new RegExp(search.replace(REGEXP_ESCAPE, "\\$1"), "g");
			return string.replace(searchRegExp, replacement);
		}
	}

	async function getValue(valueGetter, dontReplaceSlash, replacementCharacter, lengthData) {
		const { maxLength, maxCharLength } = extractMaxLength(lengthData);
		let value = (await valueGetter()) || "";
		if (!dontReplaceSlash) {
			value = value.replace(/\/+/g, replacementCharacter);
		}
		if (maxLength) {
			value = await truncateText(value, maxLength);
		} else if (maxCharLength) {
			value = value.substring(0, maxCharLength);
		}
		return value;
	}

	function extractMaxLength(lengthData) {
		if (lengthData) {
			const { unit, length } = lengthData;
			let maxLength, maxCharLength;
			if (unit == "char") {
				maxCharLength = length;
			} else {
				maxLength = length;
			}
			return { maxLength, maxCharLength };
		} else {
			return {};
		}
	}

	function decode(value) {
		try {
			return decodeURI(value);
		} catch (error) {
			return value;
		}
	}

	function getLastSegment(url, replacementCharacter) {
		let lastSegmentMatch = url.pathname.match(/\/([^/]+)$/),
			lastSegment = lastSegmentMatch && lastSegmentMatch[0];
		if (!lastSegment) {
			lastSegmentMatch = url.href.match(/([^/]+)\/?$/);
			lastSegment = lastSegmentMatch && lastSegmentMatch[0];
		}
		if (!lastSegment) {
			lastSegmentMatch = lastSegment.match(/(.*)\.[^.]+$/);
			lastSegment = lastSegmentMatch && lastSegmentMatch[0];
		}
		if (!lastSegment) {
			lastSegment = url.hostname.replace(/\/+/g, replacementCharacter).replace(/\/$/, "");
		}
		lastSegmentMatch = lastSegment.match(/(.*)\.[^.]+$/);
		if (lastSegmentMatch && lastSegmentMatch[1]) {
			lastSegment = lastSegmentMatch[1];
		}
		lastSegment = lastSegment.replace(/\/$/, "").replace(/^\//, "");
		return lastSegment;
	}

	function getValidFilename(filename, replacedCharacters = DEFAULT_REPLACED_CHARACTERS$1, replacementCharacter = DEFAULT_REPLACEMENT_CHARACTER$1) {
		replacedCharacters.forEach(replacedCharacter => (filename = filename.replace(new RegExp("[" + replacedCharacter + "]+", "g"), replacementCharacter)));
		filename = filename
			.replace(/\.\.\//g, "")
			.replace(/^\/+/, "")
			.replace(/\/+/g, "/")
			.replace(/\/$/, "")
			.replace(/\.$/, "")
			.replace(/\.\//g, "." + replacementCharacter)
			.replace(/\/\./g, "/" + replacementCharacter);
		return filename;
	}

	function truncateText(content, maxSize) {
		const blob = new Blob$3([content]);
		const reader = new FileReader$2();
		reader.readAsText(blob.slice(0, maxSize));
		return new Promise((resolve, reject) => {
			reader.addEventListener(
				"load",
				() => {
					if (content.startsWith(reader.result)) {
						resolve(reader.result);
					} else {
						truncateText(content, maxSize - 1)
							.then(resolve)
							.catch(reject);
					}
				},
				false
			);
			reader.addEventListener("error", reject, false);
		});
	}

	function getFilenameExtension(options) {
		if (options.compressContent) {
			if (options.selfExtractingArchive) {
				if (options.extractDataFromPage) {
					return "u.zip.html";
				} else {
					return "zip.html";
				}
			} else {
				return "zip";
			}
		} else {
			return "html";
		}
	}

	const { Array: Array$1, Object: Object$1, String: String$1, Number: Number$1, BigInt, Math: Math$1, Date: Date$1, Map: Map$1, Set: Set$1, Response, URL: URL$2, Error: Error$1, Uint8Array: Uint8Array$1, Uint16Array, Uint32Array: Uint32Array$1, DataView: DataView$1, Blob: Blob$2, Promise: Promise$1, TextEncoder, TextDecoder: TextDecoder$1, crypto, btoa, TransformStream, ReadableStream, WritableStream, CompressionStream, DecompressionStream, navigator, Worker } = globalThis;

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	const MAX_32_BITS = 0xffffffff;
	const MAX_16_BITS = 0xffff;
	const COMPRESSION_METHOD_DEFLATE = 0x08;
	const COMPRESSION_METHOD_STORE = 0x00;
	const COMPRESSION_METHOD_AES = 0x63;

	const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
	const SPLIT_ZIP_FILE_SIGNATURE = 0x08074b50;
	const DATA_DESCRIPTOR_RECORD_SIGNATURE = SPLIT_ZIP_FILE_SIGNATURE;
	const CENTRAL_FILE_HEADER_SIGNATURE = 0x02014b50;
	const END_OF_CENTRAL_DIR_SIGNATURE = 0x06054b50;
	const ZIP64_END_OF_CENTRAL_DIR_SIGNATURE = 0x06064b50;
	const ZIP64_END_OF_CENTRAL_DIR_LOCATOR_SIGNATURE = 0x07064b50;
	const END_OF_CENTRAL_DIR_LENGTH = 22;
	const ZIP64_END_OF_CENTRAL_DIR_LOCATOR_LENGTH = 20;
	const ZIP64_END_OF_CENTRAL_DIR_LENGTH = 56;
	const ZIP64_END_OF_CENTRAL_DIR_TOTAL_LENGTH = END_OF_CENTRAL_DIR_LENGTH + ZIP64_END_OF_CENTRAL_DIR_LOCATOR_LENGTH + ZIP64_END_OF_CENTRAL_DIR_LENGTH;

	const EXTRAFIELD_TYPE_ZIP64 = 0x0001;
	const EXTRAFIELD_TYPE_AES = 0x9901;
	const EXTRAFIELD_TYPE_NTFS = 0x000a;
	const EXTRAFIELD_TYPE_NTFS_TAG1 = 0x0001;
	const EXTRAFIELD_TYPE_EXTENDED_TIMESTAMP = 0x5455;
	const EXTRAFIELD_TYPE_UNICODE_PATH = 0x7075;
	const EXTRAFIELD_TYPE_UNICODE_COMMENT = 0x6375;
	const EXTRAFIELD_TYPE_USDZ = 0x1986;

	const BITFLAG_ENCRYPTED = 0x01;
	const BITFLAG_LEVEL = 0x06;
	const BITFLAG_DATA_DESCRIPTOR = 0x0008;
	const BITFLAG_LANG_ENCODING_FLAG = 0x0800;
	const FILE_ATTR_MSDOS_DIR_MASK = 0x10;

	const VERSION_DEFLATE = 0x14;
	const VERSION_ZIP64 = 0x2D;
	const VERSION_AES = 0x33;

	const DIRECTORY_SIGNATURE = "/";

	const MAX_DATE = new Date$1(2107, 11, 31);
	const MIN_DATE = new Date$1(1980, 0, 1);

	const UNDEFINED_VALUE = undefined;
	const UNDEFINED_TYPE$1 = "undefined";
	const FUNCTION_TYPE$1 = "function";

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	class StreamAdapter {

		constructor(Codec) {
			return class extends TransformStream {
				constructor(_format, options) {
					const codec = new Codec(options);
					super({
						transform(chunk, controller) {
							controller.enqueue(codec.append(chunk));
						},
						flush(controller) {
							const chunk = codec.flush();
							if (chunk) {
								controller.enqueue(chunk);
							}
						}
					});
				}
			};
		}
	}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	const MINIMUM_CHUNK_SIZE = 64;
	let maxWorkers = 2;
	try {
		if (typeof navigator != UNDEFINED_TYPE$1 && navigator.hardwareConcurrency) {
			maxWorkers = navigator.hardwareConcurrency;
		}
	} catch (_error) {
		// ignored
	}
	const DEFAULT_CONFIGURATION = {
		chunkSize: 512 * 1024,
		maxWorkers,
		terminateWorkerTimeout: 5000,
		useWebWorkers: true,
		useCompressionStream: true,
		workerScripts: UNDEFINED_VALUE,
		CompressionStreamNative: typeof CompressionStream != UNDEFINED_TYPE$1 && CompressionStream,
		DecompressionStreamNative: typeof DecompressionStream != UNDEFINED_TYPE$1 && DecompressionStream
	};

	const config = Object$1.assign({}, DEFAULT_CONFIGURATION);

	function getConfiguration() {
		return config;
	}

	function getChunkSize(config) {
		return Math$1.max(config.chunkSize, MINIMUM_CHUNK_SIZE);
	}

	function configure(configuration) {
		const {
			baseURL,
			chunkSize,
			maxWorkers,
			terminateWorkerTimeout,
			useCompressionStream,
			useWebWorkers,
			Deflate,
			Inflate,
			CompressionStream,
			DecompressionStream,
			workerScripts
		} = configuration;
		setIfDefined("baseURL", baseURL);
		setIfDefined("chunkSize", chunkSize);
		setIfDefined("maxWorkers", maxWorkers);
		setIfDefined("terminateWorkerTimeout", terminateWorkerTimeout);
		setIfDefined("useCompressionStream", useCompressionStream);
		setIfDefined("useWebWorkers", useWebWorkers);
		if (Deflate) {
			config.CompressionStream = new StreamAdapter(Deflate);
		}
		if (Inflate) {
			config.DecompressionStream = new StreamAdapter(Inflate);
		}
		setIfDefined("CompressionStream", CompressionStream);
		setIfDefined("DecompressionStream", DecompressionStream);
		if (workerScripts !== UNDEFINED_VALUE) {
			const { deflate, inflate } = workerScripts;
			if (deflate || inflate) {
				if (!config.workerScripts) {
					config.workerScripts = {};
				}
			}
			if (deflate) {
				if (!Array$1.isArray(deflate)) {
					throw new Error$1("workerScripts.deflate must be an array");
				}
				config.workerScripts.deflate = deflate;
			}
			if (inflate) {
				if (!Array$1.isArray(inflate)) {
					throw new Error$1("workerScripts.inflate must be an array");
				}
				config.workerScripts.inflate = inflate;
			}
		}
	}

	function setIfDefined(propertyName, propertyValue) {
		if (propertyValue !== UNDEFINED_VALUE) {
			config[propertyName] = propertyValue;
		}
	}

	function e(e){const t=()=>URL$2.createObjectURL(new Blob$2(['const{Array:e,Object:t,Number:n,Math:r,Error:s,Uint8Array:a,Uint16Array:i,Uint32Array:o,Int32Array:l,Map:c,DataView:h,Promise:f,TextEncoder:u,crypto:p,postMessage:d,TransformStream:g,ReadableStream:w,WritableStream:v,CompressionStream:y,DecompressionStream:b}=self;class m{constructor(e){return class extends g{constructor(t,n){const r=new e(n);super({transform(e,t){t.enqueue(r.append(e))},flush(e){const t=r.flush();t&&e.enqueue(t)}})}}}}const _=[];for(let e=0;256>e;e++){let t=e;for(let e=0;8>e;e++)1&t?t=t>>>1^3988292384:t>>>=1;_[e]=t}class k{constructor(e){this.crc=e||-1}append(e){let t=0|this.crc;for(let n=0,r=0|e.length;r>n;n++)t=t>>>8^_[255&(t^e[n])];this.crc=t}get(){return~this.crc}}class S extends g{constructor(){let e;const t=new k;super({transform(e,n){t.append(e),n.enqueue(e)},flush(){const n=new a(4);new h(n.buffer).setUint32(0,t.get()),e.value=n}}),e=this}}const z={concat(e,t){if(0===e.length||0===t.length)return e.concat(t);const n=e[e.length-1],r=z.getPartial(n);return 32===r?e.concat(t):z._shiftRight(t,r,0|n,e.slice(0,e.length-1))},bitLength(e){const t=e.length;if(0===t)return 0;const n=e[t-1];return 32*(t-1)+z.getPartial(n)},clamp(e,t){if(32*e.length<t)return e;const n=(e=e.slice(0,r.ceil(t/32))).length;return t&=31,n>0&&t&&(e[n-1]=z.partial(t,e[n-1]&2147483648>>t-1,1)),e},partial:(e,t,n)=>32===e?t:(n?0|t:t<<32-e)+1099511627776*e,getPartial:e=>r.round(e/1099511627776)||32,_shiftRight(e,t,n,r){for(void 0===r&&(r=[]);t>=32;t-=32)r.push(n),n=0;if(0===t)return r.concat(e);for(let s=0;s<e.length;s++)r.push(n|e[s]>>>t),n=e[s]<<32-t;const s=e.length?e[e.length-1]:0,a=z.getPartial(s);return r.push(z.partial(t+a&31,t+a>32?n:r.pop(),1)),r}},D={bytes:{fromBits(e){const t=z.bitLength(e)/8,n=new a(t);let r;for(let s=0;t>s;s++)0==(3&s)&&(r=e[s/4]),n[s]=r>>>24,r<<=8;return n},toBits(e){const t=[];let n,r=0;for(n=0;n<e.length;n++)r=r<<8|e[n],3==(3&n)&&(t.push(r),r=0);return 3&n&&t.push(z.partial(8*(3&n),r)),t}}},C=class{constructor(e){const t=this;t.blockSize=512,t._init=[1732584193,4023233417,2562383102,271733878,3285377520],t._key=[1518500249,1859775393,2400959708,3395469782],e?(t._h=e._h.slice(0),t._buffer=e._buffer.slice(0),t._length=e._length):t.reset()}reset(){const e=this;return e._h=e._init.slice(0),e._buffer=[],e._length=0,e}update(e){const t=this;"string"==typeof e&&(e=D.utf8String.toBits(e));const n=t._buffer=z.concat(t._buffer,e),r=t._length,a=t._length=r+z.bitLength(e);if(a>9007199254740991)throw new s("Cannot hash more than 2^53 - 1 bits");const i=new o(n);let l=0;for(let e=t.blockSize+r-(t.blockSize+r&t.blockSize-1);a>=e;e+=t.blockSize)t._block(i.subarray(16*l,16*(l+1))),l+=1;return n.splice(0,16*l),t}finalize(){const e=this;let t=e._buffer;const n=e._h;t=z.concat(t,[z.partial(1,1)]);for(let e=t.length+2;15&e;e++)t.push(0);for(t.push(r.floor(e._length/4294967296)),t.push(0|e._length);t.length;)e._block(t.splice(0,16));return e.reset(),n}_f(e,t,n,r){return e>19?e>39?e>59?e>79?void 0:t^n^r:t&n|t&r|n&r:t^n^r:t&n|~t&r}_S(e,t){return t<<e|t>>>32-e}_block(t){const n=this,s=n._h,a=e(80);for(let e=0;16>e;e++)a[e]=t[e];let i=s[0],o=s[1],l=s[2],c=s[3],h=s[4];for(let e=0;79>=e;e++){16>e||(a[e]=n._S(1,a[e-3]^a[e-8]^a[e-14]^a[e-16]));const t=n._S(5,i)+n._f(e,o,l,c)+h+a[e]+n._key[r.floor(e/20)]|0;h=c,c=l,l=n._S(30,o),o=i,i=t}s[0]=s[0]+i|0,s[1]=s[1]+o|0,s[2]=s[2]+l|0,s[3]=s[3]+c|0,s[4]=s[4]+h|0}},I={getRandomValues(e){const t=new o(e.buffer),n=e=>{let t=987654321;const n=4294967295;return()=>(t=36969*(65535&t)+(t>>16)&n,(((t<<16)+(e=18e3*(65535&e)+(e>>16)&n)&n)/4294967296+.5)*(r.random()>.5?1:-1))};for(let s,a=0;a<e.length;a+=4){const e=n(4294967296*(s||r.random()));s=987654071*e(),t[a/4]=4294967296*e()|0}return e}},x={importKey:e=>new x.hmacSha1(D.bytes.toBits(e)),pbkdf2(e,t,n,r){if(n=n||1e4,0>r||0>n)throw new s("invalid params to pbkdf2");const a=1+(r>>5)<<2;let i,o,l,c,f;const u=new ArrayBuffer(a),p=new h(u);let d=0;const g=z;for(t=D.bytes.toBits(t),f=1;(a||1)>d;f++){for(i=o=e.encrypt(g.concat(t,[f])),l=1;n>l;l++)for(o=e.encrypt(o),c=0;c<o.length;c++)i[c]^=o[c];for(l=0;(a||1)>d&&l<i.length;l++)p.setInt32(d,i[l]),d+=4}return u.slice(0,r/8)},hmacSha1:class{constructor(e){const t=this,n=t._hash=C,r=[[],[]];t._baseHash=[new n,new n];const s=t._baseHash[0].blockSize/32;e.length>s&&(e=(new n).update(e).finalize());for(let t=0;s>t;t++)r[0][t]=909522486^e[t],r[1][t]=1549556828^e[t];t._baseHash[0].update(r[0]),t._baseHash[1].update(r[1]),t._resultHash=new n(t._baseHash[0])}reset(){const e=this;e._resultHash=new e._hash(e._baseHash[0]),e._updated=!1}update(e){this._updated=!0,this._resultHash.update(e)}digest(){const e=this,t=e._resultHash.finalize(),n=new e._hash(e._baseHash[1]).update(t).finalize();return e.reset(),n}encrypt(e){if(this._updated)throw new s("encrypt on already updated hmac called!");return this.update(e),this.digest(e)}}},A=void 0!==p&&"function"==typeof p.getRandomValues,T="Invalid password",R="Invalid signature",H="zipjs-abort-check-password";function q(e){return A?p.getRandomValues(e):I.getRandomValues(e)}const B=16,K={name:"PBKDF2"},V=t.assign({hash:{name:"HMAC"}},K),P=t.assign({iterations:1e3,hash:{name:"SHA-1"}},K),E=["deriveBits"],U=[8,12,16],W=[16,24,32],M=10,N=[0,0,0,0],O="undefined",F="function",L=typeof p!=O,j=L&&p.subtle,G=L&&typeof j!=O,X=D.bytes,J=class{constructor(e){const t=this;t._tables=[[[],[],[],[],[]],[[],[],[],[],[]]],t._tables[0][0][0]||t._precompute();const n=t._tables[0][4],r=t._tables[1],a=e.length;let i,o,l,c=1;if(4!==a&&6!==a&&8!==a)throw new s("invalid aes key size");for(t._key=[o=e.slice(0),l=[]],i=a;4*a+28>i;i++){let e=o[i-1];(i%a==0||8===a&&i%a==4)&&(e=n[e>>>24]<<24^n[e>>16&255]<<16^n[e>>8&255]<<8^n[255&e],i%a==0&&(e=e<<8^e>>>24^c<<24,c=c<<1^283*(c>>7))),o[i]=o[i-a]^e}for(let e=0;i;e++,i--){const t=o[3&e?i:i-4];l[e]=4>=i||4>e?t:r[0][n[t>>>24]]^r[1][n[t>>16&255]]^r[2][n[t>>8&255]]^r[3][n[255&t]]}}encrypt(e){return this._crypt(e,0)}decrypt(e){return this._crypt(e,1)}_precompute(){const e=this._tables[0],t=this._tables[1],n=e[4],r=t[4],s=[],a=[];let i,o,l,c;for(let e=0;256>e;e++)a[(s[e]=e<<1^283*(e>>7))^e]=e;for(let h=i=0;!n[h];h^=o||1,i=a[i]||1){let a=i^i<<1^i<<2^i<<3^i<<4;a=a>>8^255&a^99,n[h]=a,r[a]=h,c=s[l=s[o=s[h]]];let f=16843009*c^65537*l^257*o^16843008*h,u=257*s[a]^16843008*a;for(let n=0;4>n;n++)e[n][h]=u=u<<24^u>>>8,t[n][a]=f=f<<24^f>>>8}for(let n=0;5>n;n++)e[n]=e[n].slice(0),t[n]=t[n].slice(0)}_crypt(e,t){if(4!==e.length)throw new s("invalid aes block size");const n=this._key[t],r=n.length/4-2,a=[0,0,0,0],i=this._tables[t],o=i[0],l=i[1],c=i[2],h=i[3],f=i[4];let u,p,d,g=e[0]^n[0],w=e[t?3:1]^n[1],v=e[2]^n[2],y=e[t?1:3]^n[3],b=4;for(let e=0;r>e;e++)u=o[g>>>24]^l[w>>16&255]^c[v>>8&255]^h[255&y]^n[b],p=o[w>>>24]^l[v>>16&255]^c[y>>8&255]^h[255&g]^n[b+1],d=o[v>>>24]^l[y>>16&255]^c[g>>8&255]^h[255&w]^n[b+2],y=o[y>>>24]^l[g>>16&255]^c[w>>8&255]^h[255&v]^n[b+3],b+=4,g=u,w=p,v=d;for(let e=0;4>e;e++)a[t?3&-e:e]=f[g>>>24]<<24^f[w>>16&255]<<16^f[v>>8&255]<<8^f[255&y]^n[b++],u=g,g=w,w=v,v=y,y=u;return a}},Q=class{constructor(e,t){this._prf=e,this._initIv=t,this._iv=t}reset(){this._iv=this._initIv}update(e){return this.calculate(this._prf,e,this._iv)}incWord(e){if(255==(e>>24&255)){let t=e>>16&255,n=e>>8&255,r=255&e;255===t?(t=0,255===n?(n=0,255===r?r=0:++r):++n):++t,e=0,e+=t<<16,e+=n<<8,e+=r}else e+=1<<24;return e}incCounter(e){0===(e[0]=this.incWord(e[0]))&&(e[1]=this.incWord(e[1]))}calculate(e,t,n){let r;if(!(r=t.length))return[];const s=z.bitLength(t);for(let s=0;r>s;s+=4){this.incCounter(n);const r=e.encrypt(n);t[s]^=r[0],t[s+1]^=r[1],t[s+2]^=r[2],t[s+3]^=r[3]}return z.clamp(t,s)}},Y=x.hmacSha1;let Z=L&&G&&typeof j.importKey==F,$=L&&G&&typeof j.deriveBits==F;class ee extends g{constructor({password:e,signed:n,encryptionStrength:r,checkPasswordOnly:i}){super({start(){t.assign(this,{ready:new f((e=>this.resolveReady=e)),password:e,signed:n,strength:r-1,pending:new a})},async transform(e,t){const n=this,{password:r,strength:o,resolveReady:l,ready:c}=n;r?(await(async(e,t,n,r)=>{const a=await re(e,t,n,ae(r,0,U[t])),i=ae(r,U[t]);if(a[0]!=i[0]||a[1]!=i[1])throw new s(T)})(n,o,r,ae(e,0,U[o]+2)),e=ae(e,U[o]+2),i?t.error(new s(H)):l()):await c;const h=new a(e.length-M-(e.length-M)%B);t.enqueue(ne(n,e,h,0,M,!0))},async flush(e){const{signed:t,ctr:n,hmac:r,pending:i,ready:o}=this;if(r&&n){await o;const l=ae(i,0,i.length-M),c=ae(i,i.length-M);let h=new a;if(l.length){const e=oe(X,l);r.update(e);const t=n.update(e);h=ie(X,t)}if(t){const e=ae(ie(X,r.digest()),0,M);for(let t=0;M>t;t++)if(e[t]!=c[t])throw new s(R)}e.enqueue(h)}}})}}class te extends g{constructor({password:e,encryptionStrength:n}){let r;super({start(){t.assign(this,{ready:new f((e=>this.resolveReady=e)),password:e,strength:n-1,pending:new a})},async transform(e,t){const n=this,{password:r,strength:s,resolveReady:i,ready:o}=n;let l=new a;r?(l=await(async(e,t,n)=>{const r=q(new a(U[t]));return se(r,await re(e,t,n,r))})(n,s,r),i()):await o;const c=new a(l.length+e.length-e.length%B);c.set(l,0),t.enqueue(ne(n,e,c,l.length,0))},async flush(e){const{ctr:t,hmac:n,pending:s,ready:i}=this;if(n&&t){await i;let o=new a;if(s.length){const e=t.update(oe(X,s));n.update(e),o=ie(X,e)}r.signature=ie(X,n.digest()).slice(0,M),e.enqueue(se(o,r.signature))}}}),r=this}}function ne(e,t,n,r,s,i){const{ctr:o,hmac:l,pending:c}=e,h=t.length-s;let f;for(c.length&&(t=se(c,t),n=((e,t)=>{if(t&&t>e.length){const n=e;(e=new a(t)).set(n,0)}return e})(n,h-h%B)),f=0;h-B>=f;f+=B){const e=oe(X,ae(t,f,f+B));i&&l.update(e);const s=o.update(e);i||l.update(s),n.set(ie(X,s),f+r)}return e.pending=ae(t,f),n}async function re(n,r,s,i){n.password=null;const o=(e=>{if(void 0===u){const t=new a((e=unescape(encodeURIComponent(e))).length);for(let n=0;n<t.length;n++)t[n]=e.charCodeAt(n);return t}return(new u).encode(e)})(s),l=await(async(e,t,n,r,s)=>{if(!Z)return x.importKey(t);try{return await j.importKey("raw",t,n,!1,s)}catch(e){return Z=!1,x.importKey(t)}})(0,o,V,0,E),c=await(async(e,t,n)=>{if(!$)return x.pbkdf2(t,e.salt,P.iterations,n);try{return await j.deriveBits(e,t,n)}catch(r){return $=!1,x.pbkdf2(t,e.salt,P.iterations,n)}})(t.assign({salt:i},P),l,8*(2*W[r]+2)),h=new a(c),f=oe(X,ae(h,0,W[r])),p=oe(X,ae(h,W[r],2*W[r])),d=ae(h,2*W[r]);return t.assign(n,{keys:{key:f,authentication:p,passwordVerification:d},ctr:new Q(new J(f),e.from(N)),hmac:new Y(p)}),d}function se(e,t){let n=e;return e.length+t.length&&(n=new a(e.length+t.length),n.set(e,0),n.set(t,e.length)),n}function ae(e,t,n){return e.subarray(t,n)}function ie(e,t){return e.fromBits(t)}function oe(e,t){return e.toBits(t)}class le extends g{constructor({password:e,passwordVerification:n,checkPasswordOnly:r}){super({start(){t.assign(this,{password:e,passwordVerification:n}),ue(this,e)},transform(e,t){const n=this;if(n.password){const t=he(n,e.subarray(0,12));if(n.password=null,t[11]!=n.passwordVerification)throw new s(T);e=e.subarray(12)}r?t.error(new s(H)):t.enqueue(he(n,e))}})}}class ce extends g{constructor({password:e,passwordVerification:n}){super({start(){t.assign(this,{password:e,passwordVerification:n}),ue(this,e)},transform(e,t){const n=this;let r,s;if(n.password){n.password=null;const t=q(new a(12));t[11]=n.passwordVerification,r=new a(e.length+t.length),r.set(fe(n,t),0),s=12}else r=new a(e.length),s=0;r.set(fe(n,e),s),t.enqueue(r)}})}}function he(e,t){const n=new a(t.length);for(let r=0;r<t.length;r++)n[r]=de(e)^t[r],pe(e,n[r]);return n}function fe(e,t){const n=new a(t.length);for(let r=0;r<t.length;r++)n[r]=de(e)^t[r],pe(e,t[r]);return n}function ue(e,n){const r=[305419896,591751049,878082192];t.assign(e,{keys:r,crcKey0:new k(r[0]),crcKey2:new k(r[2])});for(let t=0;t<n.length;t++)pe(e,n.charCodeAt(t))}function pe(e,t){let[n,s,a]=e.keys;e.crcKey0.append([t]),n=~e.crcKey0.get(),s=we(r.imul(we(s+ge(n)),134775813)+1),e.crcKey2.append([s>>>24]),a=~e.crcKey2.get(),e.keys=[n,s,a]}function de(e){const t=2|e.keys[2];return ge(r.imul(t,1^t)>>>8)}function ge(e){return 255&e}function we(e){return 4294967295&e}const ve="deflate-raw";class ye extends g{constructor(e,{chunkSize:t,CompressionStream:n,CompressionStreamNative:r}){super({});const{compressed:s,encrypted:a,useCompressionStream:i,zipCrypto:o,signed:l,level:c}=e,f=this;let u,p,d=me(super.readable);a&&!o||!l||(u=new S,d=Se(d,u)),s&&(d=ke(d,i,{level:c,chunkSize:t},r,n)),a&&(o?d=Se(d,new ce(e)):(p=new te(e),d=Se(d,p))),_e(f,d,(()=>{let e;a&&!o&&(e=p.signature),a&&!o||!l||(e=new h(u.value.buffer).getUint32(0)),f.signature=e}))}}class be extends g{constructor(e,{chunkSize:t,DecompressionStream:n,DecompressionStreamNative:r}){super({});const{zipCrypto:a,encrypted:i,signed:o,signature:l,compressed:c,useCompressionStream:f}=e;let u,p,d=me(super.readable);i&&(a?d=Se(d,new le(e)):(p=new ee(e),d=Se(d,p))),c&&(d=ke(d,f,{chunkSize:t},r,n)),i&&!a||!o||(u=new S,d=Se(d,u)),_e(this,d,(()=>{if((!i||a)&&o){const e=new h(u.value.buffer);if(l!=e.getUint32(0,!1))throw new s(R)}}))}}function me(e){return Se(e,new g({transform(e,t){e&&e.length&&t.enqueue(e)}}))}function _e(e,n,r){n=Se(n,new g({flush:r})),t.defineProperty(e,"readable",{get:()=>n})}function ke(e,t,n,r,s){try{e=Se(e,new(t&&r?r:s)(ve,n))}catch(r){if(!t)throw r;e=Se(e,new s(ve,n))}return e}function Se(e,t){return e.pipeThrough(t)}const ze="data";class De extends g{constructor(e,n){super({});const r=this,{codecType:s}=e;let a;s.startsWith("deflate")?a=ye:s.startsWith("inflate")&&(a=be);let i=0;const o=new a(e,n),l=super.readable,c=new g({transform(e,t){e&&e.length&&(i+=e.length,t.enqueue(e))},flush(){const{signature:e}=o;t.assign(r,{signature:e,size:i})}});t.defineProperty(r,"readable",{get:()=>l.pipeThrough(o).pipeThrough(c)})}}const Ce=new c,Ie=new c;let xe=0;async function Ae(e){try{const{options:t,scripts:r,config:s}=e;r&&r.length&&importScripts.apply(void 0,r),self.initCodec&&self.initCodec(),s.CompressionStreamNative=self.CompressionStream,s.DecompressionStreamNative=self.DecompressionStream,self.Deflate&&(s.CompressionStream=new m(self.Deflate)),self.Inflate&&(s.DecompressionStream=new m(self.Inflate));const a={highWaterMark:1,size:()=>s.chunkSize},i=e.readable||new w({async pull(e){const t=new f((e=>Ce.set(xe,e)));Te({type:"pull",messageId:xe}),xe=(xe+1)%n.MAX_SAFE_INTEGER;const{value:r,done:s}=await t;e.enqueue(r),s&&e.close()}},a),o=e.writable||new v({async write(e){let t;const r=new f((e=>t=e));Ie.set(xe,t),Te({type:ze,value:e,messageId:xe}),xe=(xe+1)%n.MAX_SAFE_INTEGER,await r}},a),l=new De(t,s);await i.pipeThrough(l).pipeTo(o,{preventClose:!0,preventAbort:!0});try{await o.getWriter().close()}catch(e){}const{signature:c,size:h}=l;Te({type:"close",result:{signature:c,size:h}})}catch(e){Re(e)}}function Te(e){let{value:t}=e;if(t)if(t.length)try{t=new a(t),e.value=t.buffer,d(e,[e.value])}catch(t){d(e)}else d(e);else d(e)}function Re(e=new s("Unknown error")){const{message:t,stack:n,code:r,name:a}=e;d({error:{message:t,stack:n,code:r,name:a}})}addEventListener("message",(({data:e})=>{const{type:t,messageId:n,value:r,done:s}=e;try{if("start"==t&&Ae(e),t==ze){const e=Ce.get(n);Ce.delete(n),e({value:new a(r),done:s})}if("ack"==t){const e=Ie.get(n);Ie.delete(n),e()}}catch(e){Re(e)}}));var He=a,qe=i,Be=l,Ke=new He([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0]),Ve=new He([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,0,0]),Pe=new He([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),Ee=(e,t)=>{for(var n=new qe(31),r=0;31>r;++r)n[r]=t+=1<<e[r-1];var s=new Be(n[30]);for(r=1;30>r;++r)for(var a=n[r];a<n[r+1];++a)s[a]=a-n[r]<<5|r;return{b:n,r:s}},Ue=Ee(Ke,2),We=Ue.b,Me=Ue.r;We[28]=258,Me[258]=28;for(var Ne=Ee(Ve,0),Oe=Ne.b,Fe=Ne.r,Le=new qe(32768),je=0;32768>je;++je){var Ge=(43690&je)>>1|(21845&je)<<1;Ge=(61680&(Ge=(52428&Ge)>>2|(13107&Ge)<<2))>>4|(3855&Ge)<<4,Le[je]=((65280&Ge)>>8|(255&Ge)<<8)>>1}var Xe=(e,t,n)=>{for(var r=e.length,s=0,a=new qe(t);r>s;++s)e[s]&&++a[e[s]-1];var i,o=new qe(t);for(s=1;t>s;++s)o[s]=o[s-1]+a[s-1]<<1;if(n){i=new qe(1<<t);var l=15-t;for(s=0;r>s;++s)if(e[s])for(var c=s<<4|e[s],h=t-e[s],f=o[e[s]-1]++<<h,u=f|(1<<h)-1;u>=f;++f)i[Le[f]>>l]=c}else for(i=new qe(r),s=0;r>s;++s)e[s]&&(i[s]=Le[o[e[s]-1]++]>>15-e[s]);return i},Je=new He(288);for(je=0;144>je;++je)Je[je]=8;for(je=144;256>je;++je)Je[je]=9;for(je=256;280>je;++je)Je[je]=7;for(je=280;288>je;++je)Je[je]=8;var Qe=new He(32);for(je=0;32>je;++je)Qe[je]=5;var Ye=Xe(Je,9,0),Ze=Xe(Je,9,1),$e=Xe(Qe,5,0),et=Xe(Qe,5,1),tt=e=>{for(var t=e[0],n=1;n<e.length;++n)e[n]>t&&(t=e[n]);return t},nt=(e,t,n)=>{var r=t/8|0;return(e[r]|e[r+1]<<8)>>(7&t)&n},rt=(e,t)=>{var n=t/8|0;return(e[n]|e[n+1]<<8|e[n+2]<<16)>>(7&t)},st=e=>(e+7)/8|0,at=(e,t,n)=>((null==t||0>t)&&(t=0),(null==n||n>e.length)&&(n=e.length),new He(e.subarray(t,n))),it=["unexpected EOF","invalid block type","invalid length/literal","invalid distance","stream finished","no stream handler",,"no callback","invalid UTF-8 data","extra field too long","date not in range 1980-2099","filename too long","stream finishing","invalid zip data"],ot=(e,t,n)=>{var r=new s(t||it[e]);if(r.code=e,s.captureStackTrace&&s.captureStackTrace(r,ot),!n)throw r;return r},lt=(e,t,n)=>{n<<=7&t;var r=t/8|0;e[r]|=n,e[r+1]|=n>>8},ct=(e,t,n)=>{n<<=7&t;var r=t/8|0;e[r]|=n,e[r+1]|=n>>8,e[r+2]|=n>>16},ht=(e,t)=>{for(var n=[],r=0;r<e.length;++r)e[r]&&n.push({s:r,f:e[r]});var s=n.length,a=n.slice();if(!s)return{t:vt,l:0};if(1==s){var i=new He(n[0].s+1);return i[n[0].s]=1,{t:i,l:1}}n.sort(((e,t)=>e.f-t.f)),n.push({s:-1,f:25001});var o=n[0],l=n[1],c=0,h=1,f=2;for(n[0]={s:-1,f:o.f+l.f,l:o,r:l};h!=s-1;)o=n[n[c].f<n[f].f?c++:f++],l=n[c!=h&&n[c].f<n[f].f?c++:f++],n[h++]={s:-1,f:o.f+l.f,l:o,r:l};var u=a[0].s;for(r=1;s>r;++r)a[r].s>u&&(u=a[r].s);var p=new qe(u+1),d=ft(n[h-1],p,0);if(d>t){r=0;var g=0,w=d-t,v=1<<w;for(a.sort(((e,t)=>p[t.s]-p[e.s]||e.f-t.f));s>r;++r){var y=a[r].s;if(p[y]<=t)break;g+=v-(1<<d-p[y]),p[y]=t}for(g>>=w;g>0;){var b=a[r].s;p[b]<t?g-=1<<t-p[b]++-1:++r}for(;r>=0&&g;--r){var m=a[r].s;p[m]==t&&(--p[m],++g)}d=t}return{t:new He(p),l:d}},ft=(e,t,n)=>-1==e.s?r.max(ft(e.l,t,n+1),ft(e.r,t,n+1)):t[e.s]=n,ut=e=>{for(var t=e.length;t&&!e[--t];);for(var n=new qe(++t),r=0,s=e[0],a=1,i=e=>{n[r++]=e},o=1;t>=o;++o)if(e[o]==s&&o!=t)++a;else{if(!s&&a>2){for(;a>138;a-=138)i(32754);a>2&&(i(a>10?a-11<<5|28690:a-3<<5|12305),a=0)}else if(a>3){for(i(s),--a;a>6;a-=6)i(8304);a>2&&(i(a-3<<5|8208),a=0)}for(;a--;)i(s);a=1,s=e[o]}return{c:n.subarray(0,r),n:t}},pt=(e,t)=>{for(var n=0,r=0;r<t.length;++r)n+=e[r]*t[r];return n},dt=(e,t,n)=>{var r=n.length,s=st(t+2);e[s]=255&r,e[s+1]=r>>8,e[s+2]=255^e[s],e[s+3]=255^e[s+1];for(var a=0;r>a;++a)e[s+a+4]=n[a];return 8*(s+4+r)},gt=(e,t,n,r,s,a,i,o,l,c,h)=>{lt(t,h++,n),++s[256];for(var f=ht(s,15),u=f.t,p=f.l,d=ht(a,15),g=d.t,w=d.l,v=ut(u),y=v.c,b=v.n,m=ut(g),_=m.c,k=m.n,S=new qe(19),z=0;z<y.length;++z)++S[31&y[z]];for(z=0;z<_.length;++z)++S[31&_[z]];for(var D=ht(S,7),C=D.t,I=D.l,x=19;x>4&&!C[Pe[x-1]];--x);var A,T,R,H,q=c+5<<3,B=pt(s,Je)+pt(a,Qe)+i,K=pt(s,u)+pt(a,g)+i+14+3*x+pt(S,C)+2*S[16]+3*S[17]+7*S[18];if(l>=0&&B>=q&&K>=q)return dt(t,h,e.subarray(l,l+c));if(lt(t,h,1+(B>K)),h+=2,B>K){A=Xe(u,p,0),T=u,R=Xe(g,w,0),H=g;var V=Xe(C,I,0);for(lt(t,h,b-257),lt(t,h+5,k-1),lt(t,h+10,x-4),h+=14,z=0;x>z;++z)lt(t,h+3*z,C[Pe[z]]);h+=3*x;for(var P=[y,_],E=0;2>E;++E){var U=P[E];for(z=0;z<U.length;++z){var W=31&U[z];lt(t,h,V[W]),h+=C[W],W>15&&(lt(t,h,U[z]>>5&127),h+=U[z]>>12)}}}else A=Ye,T=Je,R=$e,H=Qe;for(z=0;o>z;++z){var M=r[z];if(M>255){ct(t,h,A[257+(W=M>>18&31)]),h+=T[W+257],W>7&&(lt(t,h,M>>23&31),h+=Ke[W]);var N=31&M;ct(t,h,R[N]),h+=H[N],N>3&&(ct(t,h,M>>5&8191),h+=Ve[N])}else ct(t,h,A[M]),h+=T[M]}return ct(t,h,A[256]),h+T[256]},wt=new Be([65540,131080,131088,131104,262176,1048704,1048832,2114560,2117632]),vt=new He(0),yt=function(){function e(e,t){if("function"==typeof e&&(t=e,e={}),this.ondata=t,this.o=e||{},this.s={l:0,i:32768,w:32768,z:32768},this.b=new He(98304),this.o.dictionary){var n=this.o.dictionary.subarray(-32768);this.b.set(n,32768-n.length),this.s.i=32768-n.length}}return e.prototype.p=function(e,t){this.ondata(((e,t,n,s,a)=>{if(!a&&(a={l:1},t.dictionary)){var i=t.dictionary.subarray(-32768),o=new He(i.length+e.length);o.set(i),o.set(e,i.length),e=o,a.w=i.length}return((e,t,n,s,a,i)=>{var o=i.z||e.length,l=new He(0+o+5*(1+r.ceil(o/7e3))+0),c=l.subarray(0,l.length-0),h=i.l,f=7&(i.r||0);if(t){f&&(c[0]=i.r>>3);for(var u=wt[t-1],p=u>>13,d=8191&u,g=(1<<n)-1,w=i.p||new qe(32768),v=i.h||new qe(g+1),y=r.ceil(n/3),b=2*y,m=t=>(e[t]^e[t+1]<<y^e[t+2]<<b)&g,_=new Be(25e3),k=new qe(288),S=new qe(32),z=0,D=0,C=i.i||0,I=0,x=i.w||0,A=0;o>C+2;++C){var T=m(C),R=32767&C,H=v[T];if(w[R]=H,v[T]=R,C>=x){var q=o-C;if((z>7e3||I>24576)&&(q>423||!h)){f=gt(e,c,0,_,k,S,D,I,A,C-A,f),I=z=D=0,A=C;for(var B=0;286>B;++B)k[B]=0;for(B=0;30>B;++B)S[B]=0}var K=2,V=0,P=d,E=R-H&32767;if(q>2&&T==m(C-E))for(var U=r.min(p,q)-1,W=r.min(32767,C),M=r.min(258,q);W>=E&&--P&&R!=H;){if(e[C+K]==e[C+K-E]){for(var N=0;M>N&&e[C+N]==e[C+N-E];++N);if(N>K){if(K=N,V=E,N>U)break;var O=r.min(E,N-2),F=0;for(B=0;O>B;++B){var L=C-E+B&32767,j=L-w[L]&32767;j>F&&(F=j,H=L)}}}E+=(R=H)-(H=w[R])&32767}if(V){_[I++]=268435456|Me[K]<<18|Fe[V];var G=31&Me[K],X=31&Fe[V];D+=Ke[G]+Ve[X],++k[257+G],++S[X],x=C+K,++z}else _[I++]=e[C],++k[e[C]]}}for(C=r.max(C,x);o>C;++C)_[I++]=e[C],++k[e[C]];f=gt(e,c,h,_,k,S,D,I,A,C-A,f),h||(i.r=7&f|c[f/8|0]<<3,f-=7,i.h=v,i.p=w,i.i=C,i.w=x)}else{for(C=i.w||0;o+h>C;C+=65535){var J=C+65535;o>J||(c[f/8|0]=h,J=o),f=dt(c,f+1,e.subarray(C,J))}i.i=o}return at(l,0,0+st(f)+0)})(e,null==t.level?6:t.level,null==t.mem?r.ceil(1.5*r.max(8,r.min(13,r.log(e.length)))):12+t.mem,0,0,a)})(e,this.o,0,0,this.s),t)},e.prototype.push=function(e,t){this.ondata||ot(5),this.s.l&&ot(4);var n=e.length+this.s.z;if(n>this.b.length){if(n>2*this.b.length-32768){var r=new He(-32768&n);r.set(this.b.subarray(0,this.s.z)),this.b=r}var s=this.b.length-this.s.z;s&&(this.b.set(e.subarray(0,s),this.s.z),this.s.z=this.b.length,this.p(this.b,!1)),this.b.set(this.b.subarray(-32768)),this.b.set(e.subarray(s),32768),this.s.z=e.length-s+32768,this.s.i=32766,this.s.w=32768}else this.b.set(e,this.s.z),this.s.z+=e.length;this.s.l=1&t,(this.s.z>this.s.w+8191||t)&&(this.p(this.b,t||!1),this.s.w=this.s.i,this.s.i-=2)},e}(),bt=function(){function e(e,t){"function"==typeof e&&(t=e,e={}),this.ondata=t;var n=e&&e.dictionary&&e.dictionary.subarray(-32768);this.s={i:0,b:n?n.length:0},this.o=new He(32768),this.p=new He(0),n&&this.o.set(n)}return e.prototype.e=function(e){if(this.ondata||ot(5),this.d&&ot(4),this.p.length){if(e.length){var t=new He(this.p.length+e.length);t.set(this.p),t.set(e,this.p.length),this.p=t}}else this.p=e},e.prototype.c=function(e){this.s.i=+(this.d=e||!1);var t=this.s.b,n=((e,t,n)=>{var s=e.length;if(!s||t.f&&!t.l)return n||new He(0);var a=!n,i=a||2!=t.i,o=t.i;a&&(n=new He(3*s));var l=e=>{var t=n.length;if(e>t){var s=new He(r.max(2*t,e));s.set(n),n=s}},c=t.f||0,h=t.p||0,f=t.b||0,u=t.l,p=t.d,d=t.m,g=t.n,w=8*s;do{if(!u){c=nt(e,h,1);var v=nt(e,h+1,3);if(h+=3,!v){var y=e[(A=st(h)+4)-4]|e[A-3]<<8,b=A+y;if(b>s){o&&ot(0);break}i&&l(f+y),n.set(e.subarray(A,b),f),t.b=f+=y,t.p=h=8*b,t.f=c;continue}if(1==v)u=Ze,p=et,d=9,g=5;else if(2==v){var m=nt(e,h,31)+257,_=nt(e,h+10,15)+4,k=m+nt(e,h+5,31)+1;h+=14;for(var S=new He(k),z=new He(19),D=0;_>D;++D)z[Pe[D]]=nt(e,h+3*D,7);h+=3*_;var C=tt(z),I=(1<<C)-1,x=Xe(z,C,1);for(D=0;k>D;){var A,T=x[nt(e,h,I)];if(h+=15&T,16>(A=T>>4))S[D++]=A;else{var R=0,H=0;for(16==A?(H=3+nt(e,h,3),h+=2,R=S[D-1]):17==A?(H=3+nt(e,h,7),h+=3):18==A&&(H=11+nt(e,h,127),h+=7);H--;)S[D++]=R}}var q=S.subarray(0,m),B=S.subarray(m);d=tt(q),g=tt(B),u=Xe(q,d,1),p=Xe(B,g,1)}else ot(1);if(h>w){o&&ot(0);break}}i&&l(f+131072);for(var K=(1<<d)-1,V=(1<<g)-1,P=h;;P=h){var E=(R=u[rt(e,h)&K])>>4;if((h+=15&R)>w){o&&ot(0);break}if(R||ot(2),256>E)n[f++]=E;else{if(256==E){P=h,u=null;break}var U=E-254;if(E>264){var W=Ke[D=E-257];U=nt(e,h,(1<<W)-1)+We[D],h+=W}var M=p[rt(e,h)&V],N=M>>4;if(M||ot(3),h+=15&M,B=Oe[N],N>3&&(W=Ve[N],B+=rt(e,h)&(1<<W)-1,h+=W),h>w){o&&ot(0);break}i&&l(f+131072);var O=f+U;if(B>f){var F=0-B,L=r.min(B,O);for(0>F+f&&ot(3);L>f;++f)n[f]=undefined[F+f]}for(;O>f;++f)n[f]=n[f-B]}}t.l=u,t.p=P,t.b=f,t.f=c,u&&(c=1,t.m=d,t.d=p,t.n=g)}while(!c);return f!=n.length&&a?at(n,0,f):n.subarray(0,f)})(this.p,this.s,this.o);this.ondata(at(n,t,this.s.b),this.d),this.o=at(n,this.s.b-32768),this.s.b=this.o.length,this.p=at(this.p,this.s.p/8|0),this.s.p&=7},e.prototype.push=function(e,t){this.e(e),this.c(t)},e}(),mt="undefined"!=typeof TextDecoder&&new TextDecoder;try{mt.decode(vt,{stream:!0})}catch(e){}function _t(e,n,r){return class{constructor(s){const i=this;var o,l;o=s,l="level",("function"==typeof t.hasOwn?t.hasOwn(o,l):o.hasOwnProperty(l))&&void 0===s.level&&delete s.level,i.codec=new e(t.assign({},n,s)),r(i.codec,(e=>{if(i.pendingData){const t=i.pendingData;i.pendingData=new a(t.length+e.length);const{pendingData:n}=i;n.set(t,0),n.set(e,t.length)}else i.pendingData=new a(e)}))}append(e){return this.codec.push(e),s(this)}flush(){return this.codec.push(new a,!0),s(this)}};function s(e){if(e.pendingData){const t=e.pendingData;return e.pendingData=null,t}return new a}}const{Deflate:kt,Inflate:St}=((e,t={},n)=>({Deflate:_t(e.Deflate,t.deflate,n),Inflate:_t(e.Inflate,t.inflate,n)}))({Deflate:yt,Inflate:bt},void 0,((e,t)=>e.ondata=t));self.initCodec=()=>{self.Deflate=kt,self.Inflate=St};\n'],{type:"text/javascript"}));e({workerScripts:{inflate:[t],deflate:[t]}});}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	function getMimeType() {
		return "application/octet-stream";
	}

	function initShimAsyncCodec(library, options = {}, registerDataHandler) {
		return {
			Deflate: createCodecClass(library.Deflate, options.deflate, registerDataHandler),
			Inflate: createCodecClass(library.Inflate, options.inflate, registerDataHandler)
		};
	}

	function objectHasOwn(object, propertyName) {
		// eslint-disable-next-line no-prototype-builtins
		return typeof Object$1.hasOwn === "function" ? Object$1.hasOwn(object, propertyName) : object.hasOwnProperty(propertyName);
	}

	function createCodecClass(constructor, constructorOptions, registerDataHandler) {
		return class {

			constructor(options) {
				const codecAdapter = this;
				const onData = data => {
					if (codecAdapter.pendingData) {
						const previousPendingData = codecAdapter.pendingData;
						codecAdapter.pendingData = new Uint8Array$1(previousPendingData.length + data.length);
						const { pendingData } = codecAdapter;
						pendingData.set(previousPendingData, 0);
						pendingData.set(data, previousPendingData.length);
					} else {
						codecAdapter.pendingData = new Uint8Array$1(data);
					}
				};
				if (objectHasOwn(options, "level") && options.level === undefined) {
					delete options.level;
				}
				codecAdapter.codec = new constructor(Object$1.assign({}, constructorOptions, options));
				registerDataHandler(codecAdapter.codec, onData);
			}
			append(data) {
				this.codec.push(data);
				return getResponse(this);
			}
			flush() {
				this.codec.push(new Uint8Array$1(), true);
				return getResponse(this);
			}
		};

		function getResponse(codec) {
			if (codec.pendingData) {
				const output = codec.pendingData;
				codec.pendingData = null;
				return output;
			} else {
				return new Uint8Array$1();
			}
		}
	}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	const table = [];
	for (let i = 0; i < 256; i++) {
		let t = i;
		for (let j = 0; j < 8; j++) {
			if (t & 1) {
				t = (t >>> 1) ^ 0xEDB88320;
			} else {
				t = t >>> 1;
			}
		}
		table[i] = t;
	}

	class Crc32 {

		constructor(crc) {
			this.crc = crc || -1;
		}

		append(data) {
			let crc = this.crc | 0;
			for (let offset = 0, length = data.length | 0; offset < length; offset++) {
				crc = (crc >>> 8) ^ table[(crc ^ data[offset]) & 0xFF];
			}
			this.crc = crc;
		}

		get() {
			return ~this.crc;
		}
	}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	class Crc32Stream extends TransformStream {

		constructor() {
			let stream;
			const crc32 = new Crc32();
			super({
				transform(chunk, controller) {
					crc32.append(chunk);
					controller.enqueue(chunk);
				},
				flush() {
					const value = new Uint8Array$1(4);
					const dataView = new DataView$1(value.buffer);
					dataView.setUint32(0, crc32.get());
					stream.value = value;
				}
			});
			stream = this;
		}
	}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	function encodeText(value) {
		if (typeof TextEncoder == "undefined") {
			value = unescape(encodeURIComponent(value));
			const result = new Uint8Array$1(value.length);
			for (let i = 0; i < result.length; i++) {
				result[i] = value.charCodeAt(i);
			}
			return result;
		} else {
			return new TextEncoder().encode(value);
		}
	}

	// Derived from https://github.com/xqdoo00o/jszip/blob/master/lib/sjcl.js and https://github.com/bitwiseshiftleft/sjcl

	// deno-lint-ignore-file no-this-alias

	/*
	 * SJCL is open. You can use, modify and redistribute it under a BSD
	 * license or under the GNU GPL, version 2.0.
	 */

	/** @fileOverview Javascript cryptography implementation.
	 *
	 * Crush to remove comments, shorten variable names and
	 * generally reduce transmission size.
	 *
	 * @author Emily Stark
	 * @author Mike Hamburg
	 * @author Dan Boneh
	 */

	/*jslint indent: 2, bitwise: false, nomen: false, plusplus: false, white: false, regexp: false */

	/** @fileOverview Arrays of bits, encoded as arrays of Numbers.
	 *
	 * @author Emily Stark
	 * @author Mike Hamburg
	 * @author Dan Boneh
	 */

	/**
	 * Arrays of bits, encoded as arrays of Numbers.
	 * @namespace
	 * @description
	 * <p>
	 * These objects are the currency accepted by SJCL's crypto functions.
	 * </p>
	 *
	 * <p>
	 * Most of our crypto primitives operate on arrays of 4-byte words internally,
	 * but many of them can take arguments that are not a multiple of 4 bytes.
	 * This library encodes arrays of bits (whose size need not be a multiple of 8
	 * bits) as arrays of 32-bit words.  The bits are packed, big-endian, into an
	 * array of words, 32 bits at a time.  Since the words are double-precision
	 * floating point numbers, they fit some extra data.  We use this (in a private,
	 * possibly-changing manner) to encode the number of bits actually  present
	 * in the last word of the array.
	 * </p>
	 *
	 * <p>
	 * Because bitwise ops clear this out-of-band data, these arrays can be passed
	 * to ciphers like AES which want arrays of words.
	 * </p>
	 */
	const bitArray = {
		/**
		 * Concatenate two bit arrays.
		 * @param {bitArray} a1 The first array.
		 * @param {bitArray} a2 The second array.
		 * @return {bitArray} The concatenation of a1 and a2.
		 */
		concat(a1, a2) {
			if (a1.length === 0 || a2.length === 0) {
				return a1.concat(a2);
			}

			const last = a1[a1.length - 1], shift = bitArray.getPartial(last);
			if (shift === 32) {
				return a1.concat(a2);
			} else {
				return bitArray._shiftRight(a2, shift, last | 0, a1.slice(0, a1.length - 1));
			}
		},

		/**
		 * Find the length of an array of bits.
		 * @param {bitArray} a The array.
		 * @return {Number} The length of a, in bits.
		 */
		bitLength(a) {
			const l = a.length;
			if (l === 0) {
				return 0;
			}
			const x = a[l - 1];
			return (l - 1) * 32 + bitArray.getPartial(x);
		},

		/**
		 * Truncate an array.
		 * @param {bitArray} a The array.
		 * @param {Number} len The length to truncate to, in bits.
		 * @return {bitArray} A new array, truncated to len bits.
		 */
		clamp(a, len) {
			if (a.length * 32 < len) {
				return a;
			}
			a = a.slice(0, Math$1.ceil(len / 32));
			const l = a.length;
			len = len & 31;
			if (l > 0 && len) {
				a[l - 1] = bitArray.partial(len, a[l - 1] & 0x80000000 >> (len - 1), 1);
			}
			return a;
		},

		/**
		 * Make a partial word for a bit array.
		 * @param {Number} len The number of bits in the word.
		 * @param {Number} x The bits.
		 * @param {Number} [_end=0] Pass 1 if x has already been shifted to the high side.
		 * @return {Number} The partial word.
		 */
		partial(len, x, _end) {
			if (len === 32) {
				return x;
			}
			return (_end ? x | 0 : x << (32 - len)) + len * 0x10000000000;
		},

		/**
		 * Get the number of bits used by a partial word.
		 * @param {Number} x The partial word.
		 * @return {Number} The number of bits used by the partial word.
		 */
		getPartial(x) {
			return Math$1.round(x / 0x10000000000) || 32;
		},

		/** Shift an array right.
		 * @param {bitArray} a The array to shift.
		 * @param {Number} shift The number of bits to shift.
		 * @param {Number} [carry=0] A byte to carry in
		 * @param {bitArray} [out=[]] An array to prepend to the output.
		 * @private
		 */
		_shiftRight(a, shift, carry, out) {
			if (out === undefined) {
				out = [];
			}

			for (; shift >= 32; shift -= 32) {
				out.push(carry);
				carry = 0;
			}
			if (shift === 0) {
				return out.concat(a);
			}

			for (let i = 0; i < a.length; i++) {
				out.push(carry | a[i] >>> shift);
				carry = a[i] << (32 - shift);
			}
			const last2 = a.length ? a[a.length - 1] : 0;
			const shift2 = bitArray.getPartial(last2);
			out.push(bitArray.partial(shift + shift2 & 31, (shift + shift2 > 32) ? carry : out.pop(), 1));
			return out;
		}
	};

	/** @fileOverview Bit array codec implementations.
	 *
	 * @author Emily Stark
	 * @author Mike Hamburg
	 * @author Dan Boneh
	 */

	/**
	 * Arrays of bytes
	 * @namespace
	 */
	const codec = {
		bytes: {
			/** Convert from a bitArray to an array of bytes. */
			fromBits(arr) {
				const bl = bitArray.bitLength(arr);
				const byteLength = bl / 8;
				const out = new Uint8Array$1(byteLength);
				let tmp;
				for (let i = 0; i < byteLength; i++) {
					if ((i & 3) === 0) {
						tmp = arr[i / 4];
					}
					out[i] = tmp >>> 24;
					tmp <<= 8;
				}
				return out;
			},
			/** Convert from an array of bytes to a bitArray. */
			toBits(bytes) {
				const out = [];
				let i;
				let tmp = 0;
				for (i = 0; i < bytes.length; i++) {
					tmp = tmp << 8 | bytes[i];
					if ((i & 3) === 3) {
						out.push(tmp);
						tmp = 0;
					}
				}
				if (i & 3) {
					out.push(bitArray.partial(8 * (i & 3), tmp));
				}
				return out;
			}
		}
	};

	const hash = {};

	/**
	 * Context for a SHA-1 operation in progress.
	 * @constructor
	 */
	hash.sha1 = class {
		constructor(hash) {
			const sha1 = this;
			/**
			 * The hash's block size, in bits.
			 * @constant
			 */
			sha1.blockSize = 512;
			/**
			 * The SHA-1 initialization vector.
			 * @private
			 */
			sha1._init = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];
			/**
			 * The SHA-1 hash key.
			 * @private
			 */
			sha1._key = [0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xCA62C1D6];
			if (hash) {
				sha1._h = hash._h.slice(0);
				sha1._buffer = hash._buffer.slice(0);
				sha1._length = hash._length;
			} else {
				sha1.reset();
			}
		}

		/**
		 * Reset the hash state.
		 * @return this
		 */
		reset() {
			const sha1 = this;
			sha1._h = sha1._init.slice(0);
			sha1._buffer = [];
			sha1._length = 0;
			return sha1;
		}

		/**
		 * Input several words to the hash.
		 * @param {bitArray|String} data the data to hash.
		 * @return this
		 */
		update(data) {
			const sha1 = this;
			if (typeof data === "string") {
				data = codec.utf8String.toBits(data);
			}
			const b = sha1._buffer = bitArray.concat(sha1._buffer, data);
			const ol = sha1._length;
			const nl = sha1._length = ol + bitArray.bitLength(data);
			if (nl > 9007199254740991) {
				throw new Error$1("Cannot hash more than 2^53 - 1 bits");
			}
			const c = new Uint32Array$1(b);
			let j = 0;
			for (let i = sha1.blockSize + ol - ((sha1.blockSize + ol) & (sha1.blockSize - 1)); i <= nl;
				i += sha1.blockSize) {
				sha1._block(c.subarray(16 * j, 16 * (j + 1)));
				j += 1;
			}
			b.splice(0, 16 * j);
			return sha1;
		}

		/**
		 * Complete hashing and output the hash value.
		 * @return {bitArray} The hash value, an array of 5 big-endian words. TODO
		 */
		finalize() {
			const sha1 = this;
			let b = sha1._buffer;
			const h = sha1._h;

			// Round out and push the buffer
			b = bitArray.concat(b, [bitArray.partial(1, 1)]);
			// Round out the buffer to a multiple of 16 words, less the 2 length words.
			for (let i = b.length + 2; i & 15; i++) {
				b.push(0);
			}

			// append the length
			b.push(Math$1.floor(sha1._length / 0x100000000));
			b.push(sha1._length | 0);

			while (b.length) {
				sha1._block(b.splice(0, 16));
			}

			sha1.reset();
			return h;
		}

		/**
		 * The SHA-1 logical functions f(0), f(1), ..., f(79).
		 * @private
		 */
		_f(t, b, c, d) {
			if (t <= 19) {
				return (b & c) | (~b & d);
			} else if (t <= 39) {
				return b ^ c ^ d;
			} else if (t <= 59) {
				return (b & c) | (b & d) | (c & d);
			} else if (t <= 79) {
				return b ^ c ^ d;
			}
		}

		/**
		 * Circular left-shift operator.
		 * @private
		 */
		_S(n, x) {
			return (x << n) | (x >>> 32 - n);
		}

		/**
		 * Perform one cycle of SHA-1.
		 * @param {Uint32Array|bitArray} words one block of words.
		 * @private
		 */
		_block(words) {
			const sha1 = this;
			const h = sha1._h;
			// When words is passed to _block, it has 16 elements. SHA1 _block
			// function extends words with new elements (at the end there are 80 elements). 
			// The problem is that if we use Uint32Array instead of Array, 
			// the length of Uint32Array cannot be changed. Thus, we replace words with a 
			// normal Array here.
			const w = Array$1(80); // do not use Uint32Array here as the instantiation is slower
			for (let j = 0; j < 16; j++) {
				w[j] = words[j];
			}

			let a = h[0];
			let b = h[1];
			let c = h[2];
			let d = h[3];
			let e = h[4];

			for (let t = 0; t <= 79; t++) {
				if (t >= 16) {
					w[t] = sha1._S(1, w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16]);
				}
				const tmp = (sha1._S(5, a) + sha1._f(t, b, c, d) + e + w[t] +
					sha1._key[Math$1.floor(t / 20)]) | 0;
				e = d;
				d = c;
				c = sha1._S(30, b);
				b = a;
				a = tmp;
			}

			h[0] = (h[0] + a) | 0;
			h[1] = (h[1] + b) | 0;
			h[2] = (h[2] + c) | 0;
			h[3] = (h[3] + d) | 0;
			h[4] = (h[4] + e) | 0;
		}
	};

	/** @fileOverview Low-level AES implementation.
	 *
	 * This file contains a low-level implementation of AES, optimized for
	 * size and for efficiency on several browsers.  It is based on
	 * OpenSSL's aes_core.c, a public-domain implementation by Vincent
	 * Rijmen, Antoon Bosselaers and Paulo Barreto.
	 *
	 * An older version of this implementation is available in the public
	 * domain, but this one is (c) Emily Stark, Mike Hamburg, Dan Boneh,
	 * Stanford University 2008-2010 and BSD-licensed for liability
	 * reasons.
	 *
	 * @author Emily Stark
	 * @author Mike Hamburg
	 * @author Dan Boneh
	 */

	const cipher = {};

	/**
	 * Schedule out an AES key for both encryption and decryption.  This
	 * is a low-level class.  Use a cipher mode to do bulk encryption.
	 *
	 * @constructor
	 * @param {Array} key The key as an array of 4, 6 or 8 words.
	 */
	cipher.aes = class {
		constructor(key) {
			/**
			 * The expanded S-box and inverse S-box tables.  These will be computed
			 * on the client so that we don't have to send them down the wire.
			 *
			 * There are two tables, _tables[0] is for encryption and
			 * _tables[1] is for decryption.
			 *
			 * The first 4 sub-tables are the expanded S-box with MixColumns.  The
			 * last (_tables[01][4]) is the S-box itself.
			 *
			 * @private
			 */
			const aes = this;
			aes._tables = [[[], [], [], [], []], [[], [], [], [], []]];

			if (!aes._tables[0][0][0]) {
				aes._precompute();
			}

			const sbox = aes._tables[0][4];
			const decTable = aes._tables[1];
			const keyLen = key.length;

			let i, encKey, decKey, rcon = 1;

			if (keyLen !== 4 && keyLen !== 6 && keyLen !== 8) {
				throw new Error$1("invalid aes key size");
			}

			aes._key = [encKey = key.slice(0), decKey = []];

			// schedule encryption keys
			for (i = keyLen; i < 4 * keyLen + 28; i++) {
				let tmp = encKey[i - 1];

				// apply sbox
				if (i % keyLen === 0 || (keyLen === 8 && i % keyLen === 4)) {
					tmp = sbox[tmp >>> 24] << 24 ^ sbox[tmp >> 16 & 255] << 16 ^ sbox[tmp >> 8 & 255] << 8 ^ sbox[tmp & 255];

					// shift rows and add rcon
					if (i % keyLen === 0) {
						tmp = tmp << 8 ^ tmp >>> 24 ^ rcon << 24;
						rcon = rcon << 1 ^ (rcon >> 7) * 283;
					}
				}

				encKey[i] = encKey[i - keyLen] ^ tmp;
			}

			// schedule decryption keys
			for (let j = 0; i; j++, i--) {
				const tmp = encKey[j & 3 ? i : i - 4];
				if (i <= 4 || j < 4) {
					decKey[j] = tmp;
				} else {
					decKey[j] = decTable[0][sbox[tmp >>> 24]] ^
						decTable[1][sbox[tmp >> 16 & 255]] ^
						decTable[2][sbox[tmp >> 8 & 255]] ^
						decTable[3][sbox[tmp & 255]];
				}
			}
		}
		// public
		/* Something like this might appear here eventually
		name: "AES",
		blockSize: 4,
		keySizes: [4,6,8],
		*/

		/**
		 * Encrypt an array of 4 big-endian words.
		 * @param {Array} data The plaintext.
		 * @return {Array} The ciphertext.
		 */
		encrypt(data) {
			return this._crypt(data, 0);
		}

		/**
		 * Decrypt an array of 4 big-endian words.
		 * @param {Array} data The ciphertext.
		 * @return {Array} The plaintext.
		 */
		decrypt(data) {
			return this._crypt(data, 1);
		}

		/**
		 * Expand the S-box tables.
		 *
		 * @private
		 */
		_precompute() {
			const encTable = this._tables[0];
			const decTable = this._tables[1];
			const sbox = encTable[4];
			const sboxInv = decTable[4];
			const d = [];
			const th = [];
			let xInv, x2, x4, x8;

			// Compute double and third tables
			for (let i = 0; i < 256; i++) {
				th[(d[i] = i << 1 ^ (i >> 7) * 283) ^ i] = i;
			}

			for (let x = xInv = 0; !sbox[x]; x ^= x2 || 1, xInv = th[xInv] || 1) {
				// Compute sbox
				let s = xInv ^ xInv << 1 ^ xInv << 2 ^ xInv << 3 ^ xInv << 4;
				s = s >> 8 ^ s & 255 ^ 99;
				sbox[x] = s;
				sboxInv[s] = x;

				// Compute MixColumns
				x8 = d[x4 = d[x2 = d[x]]];
				let tDec = x8 * 0x1010101 ^ x4 * 0x10001 ^ x2 * 0x101 ^ x * 0x1010100;
				let tEnc = d[s] * 0x101 ^ s * 0x1010100;

				for (let i = 0; i < 4; i++) {
					encTable[i][x] = tEnc = tEnc << 24 ^ tEnc >>> 8;
					decTable[i][s] = tDec = tDec << 24 ^ tDec >>> 8;
				}
			}

			// Compactify.  Considerable speedup on Firefox.
			for (let i = 0; i < 5; i++) {
				encTable[i] = encTable[i].slice(0);
				decTable[i] = decTable[i].slice(0);
			}
		}

		/**
		 * Encryption and decryption core.
		 * @param {Array} input Four words to be encrypted or decrypted.
		 * @param dir The direction, 0 for encrypt and 1 for decrypt.
		 * @return {Array} The four encrypted or decrypted words.
		 * @private
		 */
		_crypt(input, dir) {
			if (input.length !== 4) {
				throw new Error$1("invalid aes block size");
			}

			const key = this._key[dir];

			const nInnerRounds = key.length / 4 - 2;
			const out = [0, 0, 0, 0];
			const table = this._tables[dir];

			// load up the tables
			const t0 = table[0];
			const t1 = table[1];
			const t2 = table[2];
			const t3 = table[3];
			const sbox = table[4];

			// state variables a,b,c,d are loaded with pre-whitened data
			let a = input[0] ^ key[0];
			let b = input[dir ? 3 : 1] ^ key[1];
			let c = input[2] ^ key[2];
			let d = input[dir ? 1 : 3] ^ key[3];
			let kIndex = 4;
			let a2, b2, c2;

			// Inner rounds.  Cribbed from OpenSSL.
			for (let i = 0; i < nInnerRounds; i++) {
				a2 = t0[a >>> 24] ^ t1[b >> 16 & 255] ^ t2[c >> 8 & 255] ^ t3[d & 255] ^ key[kIndex];
				b2 = t0[b >>> 24] ^ t1[c >> 16 & 255] ^ t2[d >> 8 & 255] ^ t3[a & 255] ^ key[kIndex + 1];
				c2 = t0[c >>> 24] ^ t1[d >> 16 & 255] ^ t2[a >> 8 & 255] ^ t3[b & 255] ^ key[kIndex + 2];
				d = t0[d >>> 24] ^ t1[a >> 16 & 255] ^ t2[b >> 8 & 255] ^ t3[c & 255] ^ key[kIndex + 3];
				kIndex += 4;
				a = a2; b = b2; c = c2;
			}

			// Last round.
			for (let i = 0; i < 4; i++) {
				out[dir ? 3 & -i : i] =
					sbox[a >>> 24] << 24 ^
					sbox[b >> 16 & 255] << 16 ^
					sbox[c >> 8 & 255] << 8 ^
					sbox[d & 255] ^
					key[kIndex++];
				a2 = a; a = b; b = c; c = d; d = a2;
			}

			return out;
		}
	};

	/**
	 * Random values
	 * @namespace
	 */
	const random = {
		/** 
		 * Generate random words with pure js, cryptographically not as strong & safe as native implementation.
		 * @param {TypedArray} typedArray The array to fill.
		 * @return {TypedArray} The random values.
		 */
		getRandomValues(typedArray) {
			const words = new Uint32Array$1(typedArray.buffer);
			const r = (m_w) => {
				let m_z = 0x3ade68b1;
				const mask = 0xffffffff;
				return function () {
					m_z = (0x9069 * (m_z & 0xFFFF) + (m_z >> 0x10)) & mask;
					m_w = (0x4650 * (m_w & 0xFFFF) + (m_w >> 0x10)) & mask;
					const result = ((((m_z << 0x10) + m_w) & mask) / 0x100000000) + .5;
					return result * (Math$1.random() > .5 ? 1 : -1);
				};
			};
			for (let i = 0, rcache; i < typedArray.length; i += 4) {
				const _r = r((rcache || Math$1.random()) * 0x100000000);
				rcache = _r() * 0x3ade67b7;
				words[i / 4] = (_r() * 0x100000000) | 0;
			}
			return typedArray;
		}
	};

	/** @fileOverview CTR mode implementation.
	 *
	 * Special thanks to Roy Nicholson for pointing out a bug in our
	 * implementation.
	 *
	 * @author Emily Stark
	 * @author Mike Hamburg
	 * @author Dan Boneh
	 */

	/** Brian Gladman's CTR Mode.
	* @constructor
	* @param {Object} _prf The aes instance to generate key.
	* @param {bitArray} _iv The iv for ctr mode, it must be 128 bits.
	*/

	const mode = {};

	/**
	 * Brian Gladman's CTR Mode.
	 * @namespace
	 */
	mode.ctrGladman = class {
		constructor(prf, iv) {
			this._prf = prf;
			this._initIv = iv;
			this._iv = iv;
		}

		reset() {
			this._iv = this._initIv;
		}

		/** Input some data to calculate.
		 * @param {bitArray} data the data to process, it must be intergral multiple of 128 bits unless it's the last.
		 */
		update(data) {
			return this.calculate(this._prf, data, this._iv);
		}

		incWord(word) {
			if (((word >> 24) & 0xff) === 0xff) { //overflow
				let b1 = (word >> 16) & 0xff;
				let b2 = (word >> 8) & 0xff;
				let b3 = word & 0xff;

				if (b1 === 0xff) { // overflow b1   
					b1 = 0;
					if (b2 === 0xff) {
						b2 = 0;
						if (b3 === 0xff) {
							b3 = 0;
						} else {
							++b3;
						}
					} else {
						++b2;
					}
				} else {
					++b1;
				}

				word = 0;
				word += (b1 << 16);
				word += (b2 << 8);
				word += b3;
			} else {
				word += (0x01 << 24);
			}
			return word;
		}

		incCounter(counter) {
			if ((counter[0] = this.incWord(counter[0])) === 0) {
				// encr_data in fileenc.c from  Dr Brian Gladman's counts only with DWORD j < 8
				counter[1] = this.incWord(counter[1]);
			}
		}

		calculate(prf, data, iv) {
			let l;
			if (!(l = data.length)) {
				return [];
			}
			const bl = bitArray.bitLength(data);
			for (let i = 0; i < l; i += 4) {
				this.incCounter(iv);
				const e = prf.encrypt(iv);
				data[i] ^= e[0];
				data[i + 1] ^= e[1];
				data[i + 2] ^= e[2];
				data[i + 3] ^= e[3];
			}
			return bitArray.clamp(data, bl);
		}
	};

	const misc = {
		importKey(password) {
			return new misc.hmacSha1(codec.bytes.toBits(password));
		},
		pbkdf2(prf, salt, count, length) {
			count = count || 10000;
			if (length < 0 || count < 0) {
				throw new Error$1("invalid params to pbkdf2");
			}
			const byteLength = ((length >> 5) + 1) << 2;
			let u, ui, i, j, k;
			const arrayBuffer = new ArrayBuffer(byteLength);
			const out = new DataView$1(arrayBuffer);
			let outLength = 0;
			const b = bitArray;
			salt = codec.bytes.toBits(salt);
			for (k = 1; outLength < (byteLength || 1); k++) {
				u = ui = prf.encrypt(b.concat(salt, [k]));
				for (i = 1; i < count; i++) {
					ui = prf.encrypt(ui);
					for (j = 0; j < ui.length; j++) {
						u[j] ^= ui[j];
					}
				}
				for (i = 0; outLength < (byteLength || 1) && i < u.length; i++) {
					out.setInt32(outLength, u[i]);
					outLength += 4;
				}
			}
			return arrayBuffer.slice(0, length / 8);
		}
	};

	/** @fileOverview HMAC implementation.
	 *
	 * @author Emily Stark
	 * @author Mike Hamburg
	 * @author Dan Boneh
	 */

	/** HMAC with the specified hash function.
	 * @constructor
	 * @param {bitArray} key the key for HMAC.
	 * @param {Object} [Hash=hash.sha1] The hash function to use.
	 */
	misc.hmacSha1 = class {

		constructor(key) {
			const hmac = this;
			const Hash = hmac._hash = hash.sha1;
			const exKey = [[], []];
			hmac._baseHash = [new Hash(), new Hash()];
			const bs = hmac._baseHash[0].blockSize / 32;

			if (key.length > bs) {
				key = new Hash().update(key).finalize();
			}

			for (let i = 0; i < bs; i++) {
				exKey[0][i] = key[i] ^ 0x36363636;
				exKey[1][i] = key[i] ^ 0x5C5C5C5C;
			}

			hmac._baseHash[0].update(exKey[0]);
			hmac._baseHash[1].update(exKey[1]);
			hmac._resultHash = new Hash(hmac._baseHash[0]);
		}
		reset() {
			const hmac = this;
			hmac._resultHash = new hmac._hash(hmac._baseHash[0]);
			hmac._updated = false;
		}

		update(data) {
			const hmac = this;
			hmac._updated = true;
			hmac._resultHash.update(data);
		}

		digest() {
			const hmac = this;
			const w = hmac._resultHash.finalize();
			const result = new (hmac._hash)(hmac._baseHash[1]).update(w).finalize();

			hmac.reset();

			return result;
		}

		encrypt(data) {
			if (!this._updated) {
				this.update(data);
				return this.digest(data);
			} else {
				throw new Error$1("encrypt on already updated hmac called!");
			}
		}
	};

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	const GET_RANDOM_VALUES_SUPPORTED = typeof crypto != "undefined" && typeof crypto.getRandomValues == "function";

	const ERR_INVALID_PASSWORD = "Invalid password";
	const ERR_INVALID_SIGNATURE = "Invalid signature";
	const ERR_ABORT_CHECK_PASSWORD = "zipjs-abort-check-password";

	function getRandomValues(array) {
		if (GET_RANDOM_VALUES_SUPPORTED) {
			return crypto.getRandomValues(array);
		} else {
			return random.getRandomValues(array);
		}
	}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	const BLOCK_LENGTH = 16;
	const RAW_FORMAT = "raw";
	const PBKDF2_ALGORITHM = { name: "PBKDF2" };
	const HASH_ALGORITHM = { name: "HMAC" };
	const HASH_FUNCTION = "SHA-1";
	const BASE_KEY_ALGORITHM = Object$1.assign({ hash: HASH_ALGORITHM }, PBKDF2_ALGORITHM);
	const DERIVED_BITS_ALGORITHM = Object$1.assign({ iterations: 1000, hash: { name: HASH_FUNCTION } }, PBKDF2_ALGORITHM);
	const DERIVED_BITS_USAGE = ["deriveBits"];
	const SALT_LENGTH = [8, 12, 16];
	const KEY_LENGTH = [16, 24, 32];
	const SIGNATURE_LENGTH = 10;
	const COUNTER_DEFAULT_VALUE = [0, 0, 0, 0];
	const UNDEFINED_TYPE = "undefined";
	const FUNCTION_TYPE = "function";
	// deno-lint-ignore valid-typeof
	const CRYPTO_API_SUPPORTED = typeof crypto != UNDEFINED_TYPE;
	const subtle = CRYPTO_API_SUPPORTED && crypto.subtle;
	const SUBTLE_API_SUPPORTED = CRYPTO_API_SUPPORTED && typeof subtle != UNDEFINED_TYPE;
	const codecBytes = codec.bytes;
	const Aes = cipher.aes;
	const CtrGladman = mode.ctrGladman;
	const HmacSha1 = misc.hmacSha1;

	let IMPORT_KEY_SUPPORTED = CRYPTO_API_SUPPORTED && SUBTLE_API_SUPPORTED && typeof subtle.importKey == FUNCTION_TYPE;
	let DERIVE_BITS_SUPPORTED = CRYPTO_API_SUPPORTED && SUBTLE_API_SUPPORTED && typeof subtle.deriveBits == FUNCTION_TYPE;

	class AESDecryptionStream extends TransformStream {

		constructor({ password, signed, encryptionStrength, checkPasswordOnly }) {
			super({
				start() {
					Object$1.assign(this, {
						ready: new Promise$1(resolve => this.resolveReady = resolve),
						password,
						signed,
						strength: encryptionStrength - 1,
						pending: new Uint8Array$1()
					});
				},
				async transform(chunk, controller) {
					const aesCrypto = this;
					const {
						password,
						strength,
						resolveReady,
						ready
					} = aesCrypto;
					if (password) {
						await createDecryptionKeys(aesCrypto, strength, password, subarray(chunk, 0, SALT_LENGTH[strength] + 2));
						chunk = subarray(chunk, SALT_LENGTH[strength] + 2);
						if (checkPasswordOnly) {
							controller.error(new Error$1(ERR_ABORT_CHECK_PASSWORD));
						} else {
							resolveReady();
						}
					} else {
						await ready;
					}
					const output = new Uint8Array$1(chunk.length - SIGNATURE_LENGTH - ((chunk.length - SIGNATURE_LENGTH) % BLOCK_LENGTH));
					controller.enqueue(append(aesCrypto, chunk, output, 0, SIGNATURE_LENGTH, true));
				},
				async flush(controller) {
					const {
						signed,
						ctr,
						hmac,
						pending,
						ready
					} = this;
					if (hmac && ctr) {
						await ready;
						const chunkToDecrypt = subarray(pending, 0, pending.length - SIGNATURE_LENGTH);
						const originalSignature = subarray(pending, pending.length - SIGNATURE_LENGTH);
						let decryptedChunkArray = new Uint8Array$1();
						if (chunkToDecrypt.length) {
							const encryptedChunk = toBits(codecBytes, chunkToDecrypt);
							hmac.update(encryptedChunk);
							const decryptedChunk = ctr.update(encryptedChunk);
							decryptedChunkArray = fromBits(codecBytes, decryptedChunk);
						}
						if (signed) {
							const signature = subarray(fromBits(codecBytes, hmac.digest()), 0, SIGNATURE_LENGTH);
							for (let indexSignature = 0; indexSignature < SIGNATURE_LENGTH; indexSignature++) {
								if (signature[indexSignature] != originalSignature[indexSignature]) {
									throw new Error$1(ERR_INVALID_SIGNATURE);
								}
							}
						}
						controller.enqueue(decryptedChunkArray);
					}
				}
			});
		}
	}

	class AESEncryptionStream extends TransformStream {

		constructor({ password, encryptionStrength }) {
			// deno-lint-ignore prefer-const
			let stream;
			super({
				start() {
					Object$1.assign(this, {
						ready: new Promise$1(resolve => this.resolveReady = resolve),
						password,
						strength: encryptionStrength - 1,
						pending: new Uint8Array$1()
					});
				},
				async transform(chunk, controller) {
					const aesCrypto = this;
					const {
						password,
						strength,
						resolveReady,
						ready
					} = aesCrypto;
					let preamble = new Uint8Array$1();
					if (password) {
						preamble = await createEncryptionKeys(aesCrypto, strength, password);
						resolveReady();
					} else {
						await ready;
					}
					const output = new Uint8Array$1(preamble.length + chunk.length - (chunk.length % BLOCK_LENGTH));
					output.set(preamble, 0);
					controller.enqueue(append(aesCrypto, chunk, output, preamble.length, 0));
				},
				async flush(controller) {
					const {
						ctr,
						hmac,
						pending,
						ready
					} = this;
					if (hmac && ctr) {
						await ready;
						let encryptedChunkArray = new Uint8Array$1();
						if (pending.length) {
							const encryptedChunk = ctr.update(toBits(codecBytes, pending));
							hmac.update(encryptedChunk);
							encryptedChunkArray = fromBits(codecBytes, encryptedChunk);
						}
						stream.signature = fromBits(codecBytes, hmac.digest()).slice(0, SIGNATURE_LENGTH);
						controller.enqueue(concat(encryptedChunkArray, stream.signature));
					}
				}
			});
			stream = this;
		}
	}

	function append(aesCrypto, input, output, paddingStart, paddingEnd, verifySignature) {
		const {
			ctr,
			hmac,
			pending
		} = aesCrypto;
		const inputLength = input.length - paddingEnd;
		if (pending.length) {
			input = concat(pending, input);
			output = expand(output, inputLength - (inputLength % BLOCK_LENGTH));
		}
		let offset;
		for (offset = 0; offset <= inputLength - BLOCK_LENGTH; offset += BLOCK_LENGTH) {
			const inputChunk = toBits(codecBytes, subarray(input, offset, offset + BLOCK_LENGTH));
			if (verifySignature) {
				hmac.update(inputChunk);
			}
			const outputChunk = ctr.update(inputChunk);
			if (!verifySignature) {
				hmac.update(outputChunk);
			}
			output.set(fromBits(codecBytes, outputChunk), offset + paddingStart);
		}
		aesCrypto.pending = subarray(input, offset);
		return output;
	}

	async function createDecryptionKeys(decrypt, strength, password, preamble) {
		const passwordVerificationKey = await createKeys$1(decrypt, strength, password, subarray(preamble, 0, SALT_LENGTH[strength]));
		const passwordVerification = subarray(preamble, SALT_LENGTH[strength]);
		if (passwordVerificationKey[0] != passwordVerification[0] || passwordVerificationKey[1] != passwordVerification[1]) {
			throw new Error$1(ERR_INVALID_PASSWORD);
		}
	}

	async function createEncryptionKeys(encrypt, strength, password) {
		const salt = getRandomValues(new Uint8Array$1(SALT_LENGTH[strength]));
		const passwordVerification = await createKeys$1(encrypt, strength, password, salt);
		return concat(salt, passwordVerification);
	}

	async function createKeys$1(aesCrypto, strength, password, salt) {
		aesCrypto.password = null;
		const encodedPassword = encodeText(password);
		const baseKey = await importKey(RAW_FORMAT, encodedPassword, BASE_KEY_ALGORITHM, false, DERIVED_BITS_USAGE);
		const derivedBits = await deriveBits(Object$1.assign({ salt }, DERIVED_BITS_ALGORITHM), baseKey, 8 * ((KEY_LENGTH[strength] * 2) + 2));
		const compositeKey = new Uint8Array$1(derivedBits);
		const key = toBits(codecBytes, subarray(compositeKey, 0, KEY_LENGTH[strength]));
		const authentication = toBits(codecBytes, subarray(compositeKey, KEY_LENGTH[strength], KEY_LENGTH[strength] * 2));
		const passwordVerification = subarray(compositeKey, KEY_LENGTH[strength] * 2);
		Object$1.assign(aesCrypto, {
			keys: {
				key,
				authentication,
				passwordVerification
			},
			ctr: new CtrGladman(new Aes(key), Array$1.from(COUNTER_DEFAULT_VALUE)),
			hmac: new HmacSha1(authentication)
		});
		return passwordVerification;
	}

	async function importKey(format, password, algorithm, extractable, keyUsages) {
		if (IMPORT_KEY_SUPPORTED) {
			try {
				return await subtle.importKey(format, password, algorithm, extractable, keyUsages);
			} catch (_error) {
				IMPORT_KEY_SUPPORTED = false;
				return misc.importKey(password);
			}
		} else {
			return misc.importKey(password);
		}
	}

	async function deriveBits(algorithm, baseKey, length) {
		if (DERIVE_BITS_SUPPORTED) {
			try {
				return await subtle.deriveBits(algorithm, baseKey, length);
			} catch (_error) {
				DERIVE_BITS_SUPPORTED = false;
				return misc.pbkdf2(baseKey, algorithm.salt, DERIVED_BITS_ALGORITHM.iterations, length);
			}
		} else {
			return misc.pbkdf2(baseKey, algorithm.salt, DERIVED_BITS_ALGORITHM.iterations, length);
		}
	}

	function concat(leftArray, rightArray) {
		let array = leftArray;
		if (leftArray.length + rightArray.length) {
			array = new Uint8Array$1(leftArray.length + rightArray.length);
			array.set(leftArray, 0);
			array.set(rightArray, leftArray.length);
		}
		return array;
	}

	function expand(inputArray, length) {
		if (length && length > inputArray.length) {
			const array = inputArray;
			inputArray = new Uint8Array$1(length);
			inputArray.set(array, 0);
		}
		return inputArray;
	}

	function subarray(array, begin, end) {
		return array.subarray(begin, end);
	}

	function fromBits(codecBytes, chunk) {
		return codecBytes.fromBits(chunk);
	}
	function toBits(codecBytes, chunk) {
		return codecBytes.toBits(chunk);
	}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	const HEADER_LENGTH = 12;

	class ZipCryptoDecryptionStream extends TransformStream {

		constructor({ password, passwordVerification, checkPasswordOnly }) {
			super({
				start() {
					Object$1.assign(this, {
						password,
						passwordVerification
					});
					createKeys(this, password);
				},
				transform(chunk, controller) {
					const zipCrypto = this;
					if (zipCrypto.password) {
						const decryptedHeader = decrypt(zipCrypto, chunk.subarray(0, HEADER_LENGTH));
						zipCrypto.password = null;
						if (decryptedHeader[HEADER_LENGTH - 1] != zipCrypto.passwordVerification) {
							throw new Error$1(ERR_INVALID_PASSWORD);
						}
						chunk = chunk.subarray(HEADER_LENGTH);
					}
					if (checkPasswordOnly) {
						controller.error(new Error$1(ERR_ABORT_CHECK_PASSWORD));
					} else {
						controller.enqueue(decrypt(zipCrypto, chunk));
					}
				}
			});
		}
	}

	class ZipCryptoEncryptionStream extends TransformStream {

		constructor({ password, passwordVerification }) {
			super({
				start() {
					Object$1.assign(this, {
						password,
						passwordVerification
					});
					createKeys(this, password);
				},
				transform(chunk, controller) {
					const zipCrypto = this;
					let output;
					let offset;
					if (zipCrypto.password) {
						zipCrypto.password = null;
						const header = getRandomValues(new Uint8Array$1(HEADER_LENGTH));
						header[HEADER_LENGTH - 1] = zipCrypto.passwordVerification;
						output = new Uint8Array$1(chunk.length + header.length);
						output.set(encrypt(zipCrypto, header), 0);
						offset = HEADER_LENGTH;
					} else {
						output = new Uint8Array$1(chunk.length);
						offset = 0;
					}
					output.set(encrypt(zipCrypto, chunk), offset);
					controller.enqueue(output);
				}
			});
		}
	}

	function decrypt(target, input) {
		const output = new Uint8Array$1(input.length);
		for (let index = 0; index < input.length; index++) {
			output[index] = getByte(target) ^ input[index];
			updateKeys(target, output[index]);
		}
		return output;
	}

	function encrypt(target, input) {
		const output = new Uint8Array$1(input.length);
		for (let index = 0; index < input.length; index++) {
			output[index] = getByte(target) ^ input[index];
			updateKeys(target, input[index]);
		}
		return output;
	}

	function createKeys(target, password) {
		const keys = [0x12345678, 0x23456789, 0x34567890];
		Object$1.assign(target, {
			keys,
			crcKey0: new Crc32(keys[0]),
			crcKey2: new Crc32(keys[2]),
		});
		for (let index = 0; index < password.length; index++) {
			updateKeys(target, password.charCodeAt(index));
		}
	}

	function updateKeys(target, byte) {
		let [key0, key1, key2] = target.keys;
		target.crcKey0.append([byte]);
		key0 = ~target.crcKey0.get();
		key1 = getInt32(Math$1.imul(getInt32(key1 + getInt8(key0)), 134775813) + 1);
		target.crcKey2.append([key1 >>> 24]);
		key2 = ~target.crcKey2.get();
		target.keys = [key0, key1, key2];
	}

	function getByte(target) {
		const temp = target.keys[2] | 2;
		return getInt8(Math$1.imul(temp, (temp ^ 1)) >>> 8);
	}

	function getInt8(number) {
		return number & 0xFF;
	}

	function getInt32(number) {
		return number & 0xFFFFFFFF;
	}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	const COMPRESSION_FORMAT = "deflate-raw";

	class DeflateStream extends TransformStream {

		constructor(options, { chunkSize, CompressionStream, CompressionStreamNative }) {
			super({});
			const { compressed, encrypted, useCompressionStream, zipCrypto, signed, level } = options;
			const stream = this;
			let crc32Stream, encryptionStream;
			let readable = filterEmptyChunks(super.readable);
			if ((!encrypted || zipCrypto) && signed) {
				crc32Stream = new Crc32Stream();
				readable = pipeThrough(readable, crc32Stream);
			}
			if (compressed) {
				readable = pipeThroughCommpressionStream(readable, useCompressionStream, { level, chunkSize }, CompressionStreamNative, CompressionStream);
			}
			if (encrypted) {
				if (zipCrypto) {
					readable = pipeThrough(readable, new ZipCryptoEncryptionStream(options));
				} else {
					encryptionStream = new AESEncryptionStream(options);
					readable = pipeThrough(readable, encryptionStream);
				}
			}
			setReadable(stream, readable, () => {
				let signature;
				if (encrypted && !zipCrypto) {
					signature = encryptionStream.signature;
				}
				if ((!encrypted || zipCrypto) && signed) {
					signature = new DataView$1(crc32Stream.value.buffer).getUint32(0);
				}
				stream.signature = signature;
			});
		}
	}

	class InflateStream extends TransformStream {

		constructor(options, { chunkSize, DecompressionStream, DecompressionStreamNative }) {
			super({});
			const { zipCrypto, encrypted, signed, signature, compressed, useCompressionStream } = options;
			let crc32Stream, decryptionStream;
			let readable = filterEmptyChunks(super.readable);
			if (encrypted) {
				if (zipCrypto) {
					readable = pipeThrough(readable, new ZipCryptoDecryptionStream(options));
				} else {
					decryptionStream = new AESDecryptionStream(options);
					readable = pipeThrough(readable, decryptionStream);
				}
			}
			if (compressed) {
				readable = pipeThroughCommpressionStream(readable, useCompressionStream, { chunkSize }, DecompressionStreamNative, DecompressionStream);
			}
			if ((!encrypted || zipCrypto) && signed) {
				crc32Stream = new Crc32Stream();
				readable = pipeThrough(readable, crc32Stream);
			}
			setReadable(this, readable, () => {
				if ((!encrypted || zipCrypto) && signed) {
					const dataViewSignature = new DataView$1(crc32Stream.value.buffer);
					if (signature != dataViewSignature.getUint32(0, false)) {
						throw new Error$1(ERR_INVALID_SIGNATURE);
					}
				}
			});
		}
	}

	function filterEmptyChunks(readable) {
		return pipeThrough(readable, new TransformStream({
			transform(chunk, controller) {
				if (chunk && chunk.length) {
					controller.enqueue(chunk);
				}
			}
		}));
	}

	function setReadable(stream, readable, flush) {
		readable = pipeThrough(readable, new TransformStream({ flush }));
		Object$1.defineProperty(stream, "readable", {
			get() {
				return readable;
			}
		});
	}

	function pipeThroughCommpressionStream(readable, useCompressionStream, options, CodecStreamNative, CodecStream) {
		try {
			const CompressionStream = useCompressionStream && CodecStreamNative ? CodecStreamNative : CodecStream;
			readable = pipeThrough(readable, new CompressionStream(COMPRESSION_FORMAT, options));
		} catch (error) {
			if (useCompressionStream) {
				readable = pipeThrough(readable, new CodecStream(COMPRESSION_FORMAT, options));
			} else {
				throw error;
			}
		}
		return readable;
	}

	function pipeThrough(readable, transformStream) {
		return readable.pipeThrough(transformStream);
	}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	const MESSAGE_EVENT_TYPE = "message";
	const MESSAGE_START = "start";
	const MESSAGE_PULL = "pull";
	const MESSAGE_DATA = "data";
	const MESSAGE_ACK_DATA = "ack";
	const MESSAGE_CLOSE = "close";
	const CODEC_DEFLATE = "deflate";
	const CODEC_INFLATE = "inflate";

	class CodecStream extends TransformStream {

		constructor(options, config) {
			super({});
			const codec = this;
			const { codecType } = options;
			let Stream;
			if (codecType.startsWith(CODEC_DEFLATE)) {
				Stream = DeflateStream;
			} else if (codecType.startsWith(CODEC_INFLATE)) {
				Stream = InflateStream;
			}
			let size = 0;
			const stream = new Stream(options, config);
			const readable = super.readable;
			const transformStream = new TransformStream({
				transform(chunk, controller) {
					if (chunk && chunk.length) {
						size += chunk.length;
						controller.enqueue(chunk);
					}
				},
				flush() {
					const { signature } = stream;
					Object$1.assign(codec, {
						signature,
						size
					});
				}
			});
			Object$1.defineProperty(codec, "readable", {
				get() {
					return readable.pipeThrough(stream).pipeThrough(transformStream);
				}
			});
		}
	}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	// deno-lint-ignore valid-typeof
	const WEB_WORKERS_SUPPORTED = typeof Worker != UNDEFINED_TYPE$1;

	class CodecWorker {

		constructor(workerData, { readable, writable }, { options, config, streamOptions, useWebWorkers, transferStreams, scripts }, onTaskFinished) {
			const { signal } = streamOptions;
			Object$1.assign(workerData, {
				busy: true,
				readable: readable.pipeThrough(new ProgressWatcherStream(readable, streamOptions, config), { signal }),
				writable,
				options: Object$1.assign({}, options),
				scripts,
				transferStreams,
				terminate() {
					const { worker, busy } = workerData;
					if (worker && !busy) {
						worker.terminate();
						workerData.interface = null;
					}
				},
				onTaskFinished() {
					workerData.busy = false;
					onTaskFinished(workerData);
				}
			});
			return (useWebWorkers && WEB_WORKERS_SUPPORTED ? createWebWorkerInterface : createWorkerInterface)(workerData, config);
		}
	}

	class ProgressWatcherStream extends TransformStream {

		constructor(readableSource, { onstart, onprogress, size, onend }, { chunkSize }) {
			let chunkOffset = 0;
			super({
				start() {
					if (onstart) {
						callHandler(onstart, size);
					}
				},
				async transform(chunk, controller) {
					chunkOffset += chunk.length;
					if (onprogress) {
						await callHandler(onprogress, chunkOffset, size);
					}
					controller.enqueue(chunk);
				},
				flush() {
					readableSource.size = chunkOffset;
					if (onend) {
						callHandler(onend, chunkOffset);
					}
				}
			}, { highWaterMark: 1, size: () => chunkSize });
		}
	}

	async function callHandler(handler, ...parameters) {
		try {
			await handler(...parameters);
		} catch (_error) {
			// ignored
		}
	}

	function createWorkerInterface(workerData, config) {
		return {
			run: () => runWorker$1(workerData, config)
		};
	}

	function createWebWorkerInterface(workerData, { baseURL, chunkSize }) {
		if (!workerData.interface) {
			Object$1.assign(workerData, {
				worker: getWebWorker(workerData.scripts[0], baseURL, workerData),
				interface: {
					run: () => runWebWorker(workerData, { chunkSize })
				}
			});
		}
		return workerData.interface;
	}

	async function runWorker$1({ options, readable, writable, onTaskFinished }, config) {
		const codecStream = new CodecStream(options, config);
		try {
			await readable.pipeThrough(codecStream).pipeTo(writable, { preventClose: true, preventAbort: true });
			const {
				signature,
				size
			} = codecStream;
			return {
				signature,
				size
			};
		} finally {
			onTaskFinished();
		}
	}

	async function runWebWorker(workerData, config) {
		let resolveResult, rejectResult;
		const result = new Promise$1((resolve, reject) => {
			resolveResult = resolve;
			rejectResult = reject;
		});
		Object$1.assign(workerData, {
			reader: null,
			writer: null,
			resolveResult,
			rejectResult,
			result
		});
		const { readable, options, scripts } = workerData;
		const { writable, closed } = watchClosedStream(workerData.writable);
		const streamsTransferred = sendMessage({
			type: MESSAGE_START,
			scripts: scripts.slice(1),
			options,
			config,
			readable,
			writable
		}, workerData);
		if (!streamsTransferred) {
			Object$1.assign(workerData, {
				reader: readable.getReader(),
				writer: writable.getWriter()
			});
		}
		const resultValue = await result;
		try {
			await writable.getWriter().close();
		} catch (_error) {
			// ignored
		}
		await closed;
		return resultValue;
	}

	function watchClosedStream(writableSource) {
		const writer = writableSource.getWriter();
		let resolveStreamClosed;
		const closed = new Promise$1(resolve => resolveStreamClosed = resolve);
		const writable = new WritableStream({
			async write(chunk) {
				await writer.ready;
				await writer.write(chunk);
			},
			close() {
				writer.releaseLock();
				resolveStreamClosed();
			},
			abort(reason) {
				return writer.abort(reason);
			}
		});
		return { writable, closed };
	}

	let classicWorkersSupported = true;
	let transferStreamsSupported = true;

	function getWebWorker(url, baseURL, workerData) {
		const workerOptions = { type: "module" };
		let scriptUrl, worker;
		// deno-lint-ignore valid-typeof
		if (typeof url == FUNCTION_TYPE$1) {
			url = url();
		}
		try {
			scriptUrl = new URL$2(url, baseURL);
		} catch (_error) {
			scriptUrl = url;
		}
		if (classicWorkersSupported) {
			try {
				worker = new Worker(scriptUrl);
			} catch (_error) {
				classicWorkersSupported = false;
				worker = new Worker(scriptUrl, workerOptions);
			}
		} else {
			worker = new Worker(scriptUrl, workerOptions);
		}
		worker.addEventListener(MESSAGE_EVENT_TYPE, event => onMessage(event, workerData));
		return worker;
	}

	function sendMessage(message, { worker, writer, onTaskFinished, transferStreams }) {
		try {
			let { value, readable, writable } = message;
			const transferables = [];
			if (value) {
				message.value = value.buffer;
				transferables.push(message.value);
			}
			if (transferStreams && transferStreamsSupported) {
				if (readable) {
					transferables.push(readable);
				}
				if (writable) {
					transferables.push(writable);
				}
			} else {
				message.readable = message.writable = null;
			}
			if (transferables.length) {
				try {
					worker.postMessage(message, transferables);
					return true;
				} catch (_error) {
					transferStreamsSupported = false;
					message.readable = message.writable = null;
					worker.postMessage(message);
				}
			} else {
				worker.postMessage(message);
			}
		} catch (error) {
			if (writer) {
				writer.releaseLock();
			}
			onTaskFinished();
			throw error;
		}
	}

	async function onMessage({ data }, workerData) {
		const { type, value, messageId, result, error } = data;
		const { reader, writer, resolveResult, rejectResult, onTaskFinished } = workerData;
		try {
			if (error) {
				const { message, stack, code, name } = error;
				const responseError = new Error$1(message);
				Object$1.assign(responseError, { stack, code, name });
				close(responseError);
			} else {
				if (type == MESSAGE_PULL) {
					const { value, done } = await reader.read();
					sendMessage({ type: MESSAGE_DATA, value, done, messageId }, workerData);
				}
				if (type == MESSAGE_DATA) {
					await writer.ready;
					await writer.write(new Uint8Array$1(value));
					sendMessage({ type: MESSAGE_ACK_DATA, messageId }, workerData);
				}
				if (type == MESSAGE_CLOSE) {
					close(null, result);
				}
			}
		} catch (error) {
			close(error);
		}

		function close(error, result) {
			if (error) {
				rejectResult(error);
			} else {
				resolveResult(result);
			}
			if (writer) {
				writer.releaseLock();
			}
			onTaskFinished();
		}
	}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	let pool = [];
	const pendingRequests = [];

	let indexWorker = 0;

	async function runWorker(stream, workerOptions) {
		const { options, config } = workerOptions;
		const { transferStreams, useWebWorkers, useCompressionStream, codecType, compressed, signed, encrypted } = options;
		const { workerScripts, maxWorkers, terminateWorkerTimeout } = config;
		workerOptions.transferStreams = transferStreams || transferStreams === UNDEFINED_VALUE;
		const streamCopy = !compressed && !signed && !encrypted && !workerOptions.transferStreams;
		workerOptions.useWebWorkers = !streamCopy && (useWebWorkers || (useWebWorkers === UNDEFINED_VALUE && config.useWebWorkers));
		workerOptions.scripts = workerOptions.useWebWorkers && workerScripts ? workerScripts[codecType] : [];
		options.useCompressionStream = useCompressionStream || (useCompressionStream === UNDEFINED_VALUE && config.useCompressionStream);
		let worker;
		const workerData = pool.find(workerData => !workerData.busy);
		if (workerData) {
			clearTerminateTimeout(workerData);
			worker = new CodecWorker(workerData, stream, workerOptions, onTaskFinished);
		} else if (pool.length < maxWorkers) {
			const workerData = { indexWorker };
			indexWorker++;
			pool.push(workerData);
			worker = new CodecWorker(workerData, stream, workerOptions, onTaskFinished);
		} else {
			worker = await new Promise$1(resolve => pendingRequests.push({ resolve, stream, workerOptions }));
		}
		return worker.run();

		function onTaskFinished(workerData) {
			if (pendingRequests.length) {
				const [{ resolve, stream, workerOptions }] = pendingRequests.splice(0, 1);
				resolve(new CodecWorker(workerData, stream, workerOptions, onTaskFinished));
			} else if (workerData.worker) {
				clearTerminateTimeout(workerData);
				if (Number$1.isFinite(terminateWorkerTimeout) && terminateWorkerTimeout >= 0) {
					workerData.terminateTimeout = setTimeout(() => {
						pool = pool.filter(data => data != workerData);
						workerData.terminate();
					}, terminateWorkerTimeout);
				}
			} else {
				pool = pool.filter(data => data != workerData);
			}
		}
	}

	function clearTerminateTimeout(workerData) {
		const { terminateTimeout } = workerData;
		if (terminateTimeout) {
			clearTimeout(terminateTimeout);
			workerData.terminateTimeout = null;
		}
	}

	function terminateWorkers() {
		pool.forEach(workerData => {
			clearTerminateTimeout(workerData);
			workerData.terminate();
		});
	}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	const ERR_HTTP_STATUS = "HTTP error ";
	const ERR_HTTP_RANGE = "HTTP Range not supported";
	const ERR_ITERATOR_COMPLETED_TOO_SOON = "Writer iterator completed too soon";

	const CONTENT_TYPE_TEXT_PLAIN = "text/plain";
	const HTTP_HEADER_CONTENT_LENGTH = "Content-Length";
	const HTTP_HEADER_CONTENT_RANGE = "Content-Range";
	const HTTP_HEADER_ACCEPT_RANGES = "Accept-Ranges";
	const HTTP_HEADER_RANGE = "Range";
	const HTTP_HEADER_CONTENT_TYPE = "Content-Type";
	const HTTP_METHOD_HEAD = "HEAD";
	const HTTP_METHOD_GET = "GET";
	const HTTP_RANGE_UNIT = "bytes";
	const DEFAULT_CHUNK_SIZE = 64 * 1024;

	const PROPERTY_NAME_WRITABLE = "writable";

	class Stream {

		constructor() {
			this.size = 0;
		}

		init() {
			this.initialized = true;
		}
	}

	class Reader extends Stream {

		get readable() {
			const reader = this;
			const { chunkSize = DEFAULT_CHUNK_SIZE } = reader;
			const readable = new ReadableStream({
				start() {
					this.chunkOffset = 0;
				},
				async pull(controller) {
					const { offset = 0, size, diskNumberStart } = readable;
					const { chunkOffset } = this;
					controller.enqueue(await readUint8Array(reader, offset + chunkOffset, Math$1.min(chunkSize, size - chunkOffset), diskNumberStart));
					if (chunkOffset + chunkSize > size) {
						controller.close();
					} else {
						this.chunkOffset += chunkSize;
					}
				}
			});
			return readable;
		}
	}

	class Writer extends Stream {

		constructor() {
			super();
			const writer = this;
			const writable = new WritableStream({
				write(chunk) {
					return writer.writeUint8Array(chunk);
				}
			});
			Object$1.defineProperty(writer, PROPERTY_NAME_WRITABLE, {
				get() {
					return writable;
				}
			});
		}

		writeUint8Array() {
			// abstract
		}
	}

	class Data64URIReader extends Reader {

		constructor(dataURI) {
			super();
			let dataEnd = dataURI.length;
			while (dataURI.charAt(dataEnd - 1) == "=") {
				dataEnd--;
			}
			const dataStart = dataURI.indexOf(",") + 1;
			Object$1.assign(this, {
				dataURI,
				dataStart,
				size: Math$1.floor((dataEnd - dataStart) * 0.75)
			});
		}

		readUint8Array(offset, length) {
			const {
				dataStart,
				dataURI
			} = this;
			const dataArray = new Uint8Array$1(length);
			const start = Math$1.floor(offset / 3) * 4;
			const bytes = atob(dataURI.substring(start + dataStart, Math$1.ceil((offset + length) / 3) * 4 + dataStart));
			const delta = offset - Math$1.floor(start / 4) * 3;
			for (let indexByte = delta; indexByte < delta + length; indexByte++) {
				dataArray[indexByte - delta] = bytes.charCodeAt(indexByte);
			}
			return dataArray;
		}
	}

	class Data64URIWriter extends Writer {

		constructor(contentType) {
			super();
			Object$1.assign(this, {
				data: "data:" + (contentType || "") + ";base64,",
				pending: []
			});
		}

		writeUint8Array(array) {
			const writer = this;
			let indexArray = 0;
			let dataString = writer.pending;
			const delta = writer.pending.length;
			writer.pending = "";
			for (indexArray = 0; indexArray < (Math$1.floor((delta + array.length) / 3) * 3) - delta; indexArray++) {
				dataString += String$1.fromCharCode(array[indexArray]);
			}
			for (; indexArray < array.length; indexArray++) {
				writer.pending += String$1.fromCharCode(array[indexArray]);
			}
			if (dataString.length > 2) {
				writer.data += btoa(dataString);
			} else {
				writer.pending = dataString;
			}
		}

		getData() {
			return this.data + btoa(this.pending);
		}
	}

	class BlobReader extends Reader {

		constructor(blob) {
			super();
			Object$1.assign(this, {
				blob,
				size: blob.size
			});
		}

		async readUint8Array(offset, length) {
			const reader = this;
			const offsetEnd = offset + length;
			const blob = offset || offsetEnd < reader.size ? reader.blob.slice(offset, offsetEnd) : reader.blob;
			let arrayBuffer = await blob.arrayBuffer();
			if (arrayBuffer.byteLength > length) {
				arrayBuffer = arrayBuffer.slice(offset, offsetEnd);
			}
			return new Uint8Array$1(arrayBuffer);
		}
	}

	class BlobWriter extends Stream {

		constructor(contentType) {
			super();
			const writer = this;
			const transformStream = new TransformStream();
			const headers = [];
			if (contentType) {
				headers.push([HTTP_HEADER_CONTENT_TYPE, contentType]);
			}
			Object$1.defineProperty(writer, PROPERTY_NAME_WRITABLE, {
				get() {
					return transformStream.writable;
				}
			});
			writer.blob = new Response(transformStream.readable, { headers }).blob();
		}

		getData() {
			return this.blob;
		}
	}

	class TextReader extends BlobReader {

		constructor(text) {
			super(new Blob$2([text], { type: CONTENT_TYPE_TEXT_PLAIN }));
		}
	}

	class TextWriter extends BlobWriter {

		constructor(encoding) {
			super(encoding);
			Object$1.assign(this, {
				encoding,
				utf8: !encoding || encoding.toLowerCase() == "utf-8"
			});
		}

		async getData() {
			const {
				encoding,
				utf8
			} = this;
			const blob = await super.getData();
			if (blob.text && utf8) {
				return blob.text();
			} else {
				const reader = new FileReader();
				return new Promise$1((resolve, reject) => {
					Object$1.assign(reader, {
						onload: ({ target }) => resolve(target.result),
						onerror: () => reject(reader.error)
					});
					reader.readAsText(blob, encoding);
				});
			}
		}
	}

	class FetchReader extends Reader {

		constructor(url, options) {
			super();
			createHtpReader(this, url, options);
		}

		async init() {
			await initHttpReader(this, sendFetchRequest, getFetchRequestData);
			super.init();
		}

		readUint8Array(index, length) {
			return readUint8ArrayHttpReader(this, index, length, sendFetchRequest, getFetchRequestData);
		}
	}

	class XHRReader extends Reader {

		constructor(url, options) {
			super();
			createHtpReader(this, url, options);
		}

		async init() {
			await initHttpReader(this, sendXMLHttpRequest, getXMLHttpRequestData);
			super.init();
		}

		readUint8Array(index, length) {
			return readUint8ArrayHttpReader(this, index, length, sendXMLHttpRequest, getXMLHttpRequestData);
		}
	}

	function createHtpReader(httpReader, url, options) {
		const {
			preventHeadRequest,
			useRangeHeader,
			forceRangeRequests
		} = options;
		options = Object$1.assign({}, options);
		delete options.preventHeadRequest;
		delete options.useRangeHeader;
		delete options.forceRangeRequests;
		delete options.useXHR;
		Object$1.assign(httpReader, {
			url,
			options,
			preventHeadRequest,
			useRangeHeader,
			forceRangeRequests
		});
	}

	async function initHttpReader(httpReader, sendRequest, getRequestData) {
		const {
			url,
			useRangeHeader,
			forceRangeRequests
		} = httpReader;
		if (isHttpFamily(url) && (useRangeHeader || forceRangeRequests)) {
			const { headers } = await sendRequest(HTTP_METHOD_GET, httpReader, getRangeHeaders(httpReader));
			if (!forceRangeRequests && headers.get(HTTP_HEADER_ACCEPT_RANGES) != HTTP_RANGE_UNIT) {
				throw new Error$1(ERR_HTTP_RANGE);
			} else {
				let contentSize;
				const contentRangeHeader = headers.get(HTTP_HEADER_CONTENT_RANGE);
				if (contentRangeHeader) {
					const splitHeader = contentRangeHeader.trim().split(/\s*\/\s*/);
					if (splitHeader.length) {
						const headerValue = splitHeader[1];
						if (headerValue && headerValue != "*") {
							contentSize = Number$1(headerValue);
						}
					}
				}
				if (contentSize === UNDEFINED_VALUE) {
					await getContentLength(httpReader, sendRequest, getRequestData);
				} else {
					httpReader.size = contentSize;
				}
			}
		} else {
			await getContentLength(httpReader, sendRequest, getRequestData);
		}
	}

	async function readUint8ArrayHttpReader(httpReader, index, length, sendRequest, getRequestData) {
		const {
			useRangeHeader,
			forceRangeRequests,
			options
		} = httpReader;
		if (useRangeHeader || forceRangeRequests) {
			const response = await sendRequest(HTTP_METHOD_GET, httpReader, getRangeHeaders(httpReader, index, length));
			if (response.status != 206) {
				throw new Error$1(ERR_HTTP_RANGE);
			}
			return new Uint8Array$1(await response.arrayBuffer());
		} else {
			const { data } = httpReader;
			if (!data) {
				await getRequestData(httpReader, options);
			}
			return new Uint8Array$1(httpReader.data.subarray(index, index + length));
		}
	}

	function getRangeHeaders(httpReader, index = 0, length = 1) {
		return Object$1.assign({}, getHeaders(httpReader), { [HTTP_HEADER_RANGE]: HTTP_RANGE_UNIT + "=" + index + "-" + (index + length - 1) });
	}

	function getHeaders({ options }) {
		const { headers } = options;
		if (headers) {
			if (Symbol.iterator in headers) {
				return Object$1.fromEntries(headers);
			} else {
				return headers;
			}
		}
	}

	async function getFetchRequestData(httpReader) {
		await getRequestData(httpReader, sendFetchRequest);
	}

	async function getXMLHttpRequestData(httpReader) {
		await getRequestData(httpReader, sendXMLHttpRequest);
	}

	async function getRequestData(httpReader, sendRequest) {
		const response = await sendRequest(HTTP_METHOD_GET, httpReader, getHeaders(httpReader));
		httpReader.data = new Uint8Array$1(await response.arrayBuffer());
		if (!httpReader.size) {
			httpReader.size = httpReader.data.length;
		}
	}

	async function getContentLength(httpReader, sendRequest, getRequestData) {
		if (httpReader.preventHeadRequest) {
			await getRequestData(httpReader, httpReader.options);
		} else {
			const response = await sendRequest(HTTP_METHOD_HEAD, httpReader, getHeaders(httpReader));
			const contentLength = response.headers.get(HTTP_HEADER_CONTENT_LENGTH);
			if (contentLength) {
				httpReader.size = Number$1(contentLength);
			} else {
				await getRequestData(httpReader, httpReader.options);
			}
		}
	}

	async function sendFetchRequest(method, { options, url }, headers) {
		const response = await fetch(url, Object$1.assign({}, options, { method, headers }));
		if (response.status < 400) {
			return response;
		} else {
			throw response.status == 416 ? new Error$1(ERR_HTTP_RANGE) : new Error$1(ERR_HTTP_STATUS + (response.statusText || response.status));
		}
	}

	function sendXMLHttpRequest(method, { url }, headers) {
		return new Promise$1((resolve, reject) => {
			const request = new XMLHttpRequest();
			request.addEventListener("load", () => {
				if (request.status < 400) {
					const headers = [];
					request.getAllResponseHeaders().trim().split(/[\r\n]+/).forEach(header => {
						const splitHeader = header.trim().split(/\s*:\s*/);
						splitHeader[0] = splitHeader[0].trim().replace(/^[a-z]|-[a-z]/g, value => value.toUpperCase());
						headers.push(splitHeader);
					});
					resolve({
						status: request.status,
						arrayBuffer: () => request.response,
						headers: new Map$1(headers)
					});
				} else {
					reject(request.status == 416 ? new Error$1(ERR_HTTP_RANGE) : new Error$1(ERR_HTTP_STATUS + (request.statusText || request.status)));
				}
			}, false);
			request.addEventListener("error", event => reject(event.detail ? event.detail.error : new Error$1("Network error")), false);
			request.open(method, url);
			if (headers) {
				for (const entry of Object$1.entries(headers)) {
					request.setRequestHeader(entry[0], entry[1]);
				}
			}
			request.responseType = "arraybuffer";
			request.send();
		});
	}

	class HttpReader extends Reader {

		constructor(url, options = {}) {
			super();
			Object$1.assign(this, {
				url,
				reader: options.useXHR ? new XHRReader(url, options) : new FetchReader(url, options)
			});
		}

		set size(value) {
			// ignored
		}

		get size() {
			return this.reader.size;
		}

		async init() {
			await this.reader.init();
			super.init();
		}

		readUint8Array(index, length) {
			return this.reader.readUint8Array(index, length);
		}
	}

	class HttpRangeReader extends HttpReader {

		constructor(url, options = {}) {
			options.useRangeHeader = true;
			super(url, options);
		}
	}


	class Uint8ArrayReader extends Reader {

		constructor(array) {
			super();
			Object$1.assign(this, {
				array,
				size: array.length
			});
		}

		readUint8Array(index, length) {
			return this.array.slice(index, index + length);
		}
	}

	class Uint8ArrayWriter extends Writer {

		init(initSize = 0) {
			Object$1.assign(this, {
				offset: 0,
				array: new Uint8Array$1(initSize)
			});
			super.init();
		}

		writeUint8Array(array) {
			const writer = this;
			if (writer.offset + array.length > writer.array.length) {
				const previousArray = writer.array;
				writer.array = new Uint8Array$1(previousArray.length + array.length);
				writer.array.set(previousArray);
			}
			writer.array.set(array, writer.offset);
			writer.offset += array.length;
		}

		getData() {
			return this.array;
		}
	}

	class SplitDataReader extends Reader {

		constructor(readers) {
			super();
			this.readers = readers;
		}

		async init() {
			const reader = this;
			const { readers } = reader;
			reader.lastDiskNumber = 0;
			reader.lastDiskOffset = 0;
			await Promise$1.all(readers.map(async (diskReader, indexDiskReader) => {
				await diskReader.init();
				if (indexDiskReader != readers.length - 1) {
					reader.lastDiskOffset += diskReader.size;
				}
				reader.size += diskReader.size;
			}));
			super.init();
		}

		async readUint8Array(offset, length, diskNumber = 0) {
			const reader = this;
			const { readers } = this;
			let result;
			let currentDiskNumber = diskNumber;
			if (currentDiskNumber == -1) {
				currentDiskNumber = readers.length - 1;
			}
			let currentReaderOffset = offset;
			while (currentReaderOffset >= readers[currentDiskNumber].size) {
				currentReaderOffset -= readers[currentDiskNumber].size;
				currentDiskNumber++;
			}
			const currentReader = readers[currentDiskNumber];
			const currentReaderSize = currentReader.size;
			if (currentReaderOffset + length <= currentReaderSize) {
				result = await readUint8Array(currentReader, currentReaderOffset, length);
			} else {
				const chunkLength = currentReaderSize - currentReaderOffset;
				result = new Uint8Array$1(length);
				result.set(await readUint8Array(currentReader, currentReaderOffset, chunkLength));
				result.set(await reader.readUint8Array(offset + chunkLength, length - chunkLength, diskNumber), chunkLength);
			}
			reader.lastDiskNumber = Math$1.max(currentDiskNumber, reader.lastDiskNumber);
			return result;
		}
	}

	class SplitDataWriter extends Stream {

		constructor(writerGenerator, maxSize = 4294967295) {
			super();
			const zipWriter = this;
			Object$1.assign(zipWriter, {
				diskNumber: 0,
				diskOffset: 0,
				size: 0,
				maxSize,
				availableSize: maxSize
			});
			let diskSourceWriter, diskWritable, diskWriter;
			const writable = new WritableStream({
				async write(chunk) {
					const { availableSize } = zipWriter;
					if (!diskWriter) {
						const { value, done } = await writerGenerator.next();
						if (done && !value) {
							throw new Error$1(ERR_ITERATOR_COMPLETED_TOO_SOON);
						} else {
							diskSourceWriter = value;
							diskSourceWriter.size = 0;
							if (diskSourceWriter.maxSize) {
								zipWriter.maxSize = diskSourceWriter.maxSize;
							}
							zipWriter.availableSize = zipWriter.maxSize;
							await initStream(diskSourceWriter);
							diskWritable = value.writable;
							diskWriter = diskWritable.getWriter();
						}
						await this.write(chunk);
					} else if (chunk.length >= availableSize) {
						await writeChunk(chunk.slice(0, availableSize));
						await closeDisk();
						zipWriter.diskOffset += diskSourceWriter.size;
						zipWriter.diskNumber++;
						diskWriter = null;
						await this.write(chunk.slice(availableSize));
					} else {
						await writeChunk(chunk);
					}
				},
				async close() {
					await diskWriter.ready;
					await closeDisk();
				}
			});
			Object$1.defineProperty(zipWriter, PROPERTY_NAME_WRITABLE, {
				get() {
					return writable;
				}
			});

			async function writeChunk(chunk) {
				const chunkLength = chunk.length;
				if (chunkLength) {
					await diskWriter.ready;
					await diskWriter.write(chunk);
					diskSourceWriter.size += chunkLength;
					zipWriter.size += chunkLength;
					zipWriter.availableSize -= chunkLength;
				}
			}

			async function closeDisk() {
				diskWritable.size = diskSourceWriter.size;
				await diskWriter.close();
			}
		}
	}

	function isHttpFamily(url) {
		const { baseURL } = getConfiguration();
		const { protocol } = new URL$2(url, baseURL);
		return protocol == "http:" || protocol == "https:";
	}

	async function initStream(stream, initSize) {
		if (stream.init && !stream.initialized) {
			await stream.init(initSize);
		}
	}

	function initReader(reader) {
		if (Array$1.isArray(reader)) {
			reader = new SplitDataReader(reader);
		}
		if (reader instanceof ReadableStream) {
			reader = {
				readable: reader
			};
		}
		return reader;
	}

	function initWriter(writer) {
		if (writer.writable === UNDEFINED_VALUE && typeof writer.next == FUNCTION_TYPE$1) {
			writer = new SplitDataWriter(writer);
		}
		if (writer instanceof WritableStream) {
			writer = {
				writable: writer
			};
		}
		const { writable } = writer;
		if (writable.size === UNDEFINED_VALUE) {
			writable.size = 0;
		}
		const splitZipFile = writer instanceof SplitDataWriter;
		if (!splitZipFile) {
			Object$1.assign(writer, {
				diskNumber: 0,
				diskOffset: 0,
				availableSize: Infinity,
				maxSize: Infinity
			});
		}
		return writer;
	}

	function readUint8Array(reader, offset, size, diskNumber) {
		return reader.readUint8Array(offset, size, diskNumber);
	}

	const SplitZipReader = SplitDataReader;
	const SplitZipWriter = SplitDataWriter;

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	/* global TextDecoder */

	const CP437 = "\0☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼ !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~⌂ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ".split("");
	const VALID_CP437 = CP437.length == 256;

	function decodeCP437(stringValue) {
		if (VALID_CP437) {
			let result = "";
			for (let indexCharacter = 0; indexCharacter < stringValue.length; indexCharacter++) {
				result += CP437[stringValue[indexCharacter]];
			}
			return result;
		} else {
			return new TextDecoder$1().decode(stringValue);
		}
	}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	function decodeText(value, encoding) {
		if (encoding && encoding.trim().toLowerCase() == "cp437") {
			return decodeCP437(value);
		} else {
			return new TextDecoder$1(encoding).decode(value);
		}
	}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	const PROPERTY_NAME_FILENAME = "filename";
	const PROPERTY_NAME_RAW_FILENAME = "rawFilename";
	const PROPERTY_NAME_COMMENT = "comment";
	const PROPERTY_NAME_RAW_COMMENT = "rawComment";
	const PROPERTY_NAME_UNCOMPPRESSED_SIZE = "uncompressedSize";
	const PROPERTY_NAME_COMPPRESSED_SIZE = "compressedSize";
	const PROPERTY_NAME_OFFSET = "offset";
	const PROPERTY_NAME_DISK_NUMBER_START = "diskNumberStart";
	const PROPERTY_NAME_LAST_MODIFICATION_DATE = "lastModDate";
	const PROPERTY_NAME_RAW_LAST_MODIFICATION_DATE = "rawLastModDate";
	const PROPERTY_NAME_LAST_ACCESS_DATE = "lastAccessDate";
	const PROPERTY_NAME_RAW_LAST_ACCESS_DATE = "rawLastAccessDate";
	const PROPERTY_NAME_CREATION_DATE = "creationDate";
	const PROPERTY_NAME_RAW_CREATION_DATE = "rawCreationDate";
	const PROPERTY_NAME_INTERNAL_FILE_ATTRIBUTE = "internalFileAttribute";
	const PROPERTY_NAME_EXTERNAL_FILE_ATTRIBUTE = "externalFileAttribute";
	const PROPERTY_NAME_MS_DOS_COMPATIBLE = "msDosCompatible";
	const PROPERTY_NAME_ZIP64 = "zip64";

	const PROPERTY_NAMES = [
		PROPERTY_NAME_FILENAME, PROPERTY_NAME_RAW_FILENAME, PROPERTY_NAME_COMPPRESSED_SIZE, PROPERTY_NAME_UNCOMPPRESSED_SIZE,
		PROPERTY_NAME_LAST_MODIFICATION_DATE, PROPERTY_NAME_RAW_LAST_MODIFICATION_DATE, PROPERTY_NAME_COMMENT, PROPERTY_NAME_RAW_COMMENT,
		PROPERTY_NAME_LAST_ACCESS_DATE, PROPERTY_NAME_CREATION_DATE, PROPERTY_NAME_OFFSET, PROPERTY_NAME_DISK_NUMBER_START,
		PROPERTY_NAME_DISK_NUMBER_START, PROPERTY_NAME_INTERNAL_FILE_ATTRIBUTE, PROPERTY_NAME_EXTERNAL_FILE_ATTRIBUTE,
		PROPERTY_NAME_MS_DOS_COMPATIBLE, PROPERTY_NAME_ZIP64,
		"directory", "bitFlag", "encrypted", "signature", "filenameUTF8", "commentUTF8", "compressionMethod", "version", "versionMadeBy",
		"extraField", "rawExtraField", "extraFieldZip64", "extraFieldUnicodePath", "extraFieldUnicodeComment", "extraFieldAES", "extraFieldNTFS",
		"extraFieldExtendedTimestamp"];

	class Entry {

		constructor(data) {
			PROPERTY_NAMES.forEach(name => this[name] = data[name]);
		}

	}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	const ERR_BAD_FORMAT = "File format is not recognized";
	const ERR_EOCDR_NOT_FOUND = "End of central directory not found";
	const ERR_EOCDR_ZIP64_NOT_FOUND = "End of Zip64 central directory not found";
	const ERR_EOCDR_LOCATOR_ZIP64_NOT_FOUND = "End of Zip64 central directory locator not found";
	const ERR_CENTRAL_DIRECTORY_NOT_FOUND = "Central directory header not found";
	const ERR_LOCAL_FILE_HEADER_NOT_FOUND = "Local file header not found";
	const ERR_EXTRAFIELD_ZIP64_NOT_FOUND = "Zip64 extra field not found";
	const ERR_ENCRYPTED = "File contains encrypted entry";
	const ERR_UNSUPPORTED_ENCRYPTION = "Encryption method not supported";
	const ERR_UNSUPPORTED_COMPRESSION = "Compression method not supported";
	const ERR_SPLIT_ZIP_FILE = "Split zip file";
	const CHARSET_UTF8 = "utf-8";
	const CHARSET_CP437 = "cp437";
	const ZIP64_PROPERTIES = [
		[PROPERTY_NAME_UNCOMPPRESSED_SIZE, MAX_32_BITS],
		[PROPERTY_NAME_COMPPRESSED_SIZE, MAX_32_BITS],
		[PROPERTY_NAME_OFFSET, MAX_32_BITS],
		[PROPERTY_NAME_DISK_NUMBER_START, MAX_16_BITS]
	];
	const ZIP64_EXTRACTION = {
		[MAX_16_BITS]: {
			getValue: getUint32,
			bytes: 4
		},
		[MAX_32_BITS]: {
			getValue: getBigUint64,
			bytes: 8
		}
	};

	class ZipReader {

		constructor(reader, options = {}) {
			Object$1.assign(this, {
				reader: initReader(reader),
				options,
				config: getConfiguration()
			});
		}

		async* getEntriesGenerator(options = {}) {
			const zipReader = this;
			let { reader } = zipReader;
			const { config } = zipReader;
			await initStream(reader);
			if (reader.size === UNDEFINED_VALUE || !reader.readUint8Array) {
				reader = new BlobReader(await new Response(reader.readable).blob());
				await initStream(reader);
			}
			if (reader.size < END_OF_CENTRAL_DIR_LENGTH) {
				throw new Error$1(ERR_BAD_FORMAT);
			}
			reader.chunkSize = getChunkSize(config);
			const endOfDirectoryInfo = await seekSignature(reader, END_OF_CENTRAL_DIR_SIGNATURE, reader.size, END_OF_CENTRAL_DIR_LENGTH, MAX_16_BITS * 16);
			if (!endOfDirectoryInfo) {
				const signatureArray = await readUint8Array(reader, 0, 4);
				const signatureView = getDataView$1(signatureArray);
				if (getUint32(signatureView) == SPLIT_ZIP_FILE_SIGNATURE) {
					throw new Error$1(ERR_SPLIT_ZIP_FILE);
				} else {
					throw new Error$1(ERR_EOCDR_NOT_FOUND);
				}
			}
			const endOfDirectoryView = getDataView$1(endOfDirectoryInfo);
			let directoryDataLength = getUint32(endOfDirectoryView, 12);
			let directoryDataOffset = getUint32(endOfDirectoryView, 16);
			const commentOffset = endOfDirectoryInfo.offset;
			const commentLength = getUint16(endOfDirectoryView, 20);
			const appendedDataOffset = commentOffset + END_OF_CENTRAL_DIR_LENGTH + commentLength;
			let lastDiskNumber = getUint16(endOfDirectoryView, 4);
			const expectedLastDiskNumber = reader.lastDiskNumber || 0;
			let diskNumber = getUint16(endOfDirectoryView, 6);
			let filesLength = getUint16(endOfDirectoryView, 8);
			let prependedDataLength = 0;
			let startOffset = 0;
			if (directoryDataOffset == MAX_32_BITS || directoryDataLength == MAX_32_BITS || filesLength == MAX_16_BITS || diskNumber == MAX_16_BITS) {
				const endOfDirectoryLocatorArray = await readUint8Array(reader, endOfDirectoryInfo.offset - ZIP64_END_OF_CENTRAL_DIR_LOCATOR_LENGTH, ZIP64_END_OF_CENTRAL_DIR_LOCATOR_LENGTH);
				const endOfDirectoryLocatorView = getDataView$1(endOfDirectoryLocatorArray);
				if (getUint32(endOfDirectoryLocatorView, 0) != ZIP64_END_OF_CENTRAL_DIR_LOCATOR_SIGNATURE) {
					throw new Error$1(ERR_EOCDR_ZIP64_NOT_FOUND);
				}
				directoryDataOffset = getBigUint64(endOfDirectoryLocatorView, 8);
				let endOfDirectoryArray = await readUint8Array(reader, directoryDataOffset, ZIP64_END_OF_CENTRAL_DIR_LENGTH, -1);
				let endOfDirectoryView = getDataView$1(endOfDirectoryArray);
				const expectedDirectoryDataOffset = endOfDirectoryInfo.offset - ZIP64_END_OF_CENTRAL_DIR_LOCATOR_LENGTH - ZIP64_END_OF_CENTRAL_DIR_LENGTH;
				if (getUint32(endOfDirectoryView, 0) != ZIP64_END_OF_CENTRAL_DIR_SIGNATURE && directoryDataOffset != expectedDirectoryDataOffset) {
					const originalDirectoryDataOffset = directoryDataOffset;
					directoryDataOffset = expectedDirectoryDataOffset;
					prependedDataLength = directoryDataOffset - originalDirectoryDataOffset;
					endOfDirectoryArray = await readUint8Array(reader, directoryDataOffset, ZIP64_END_OF_CENTRAL_DIR_LENGTH, -1);
					endOfDirectoryView = getDataView$1(endOfDirectoryArray);
				}
				if (getUint32(endOfDirectoryView, 0) != ZIP64_END_OF_CENTRAL_DIR_SIGNATURE) {
					throw new Error$1(ERR_EOCDR_LOCATOR_ZIP64_NOT_FOUND);
				}
				if (lastDiskNumber == MAX_16_BITS) {
					lastDiskNumber = getUint32(endOfDirectoryView, 16);
				}
				if (diskNumber == MAX_16_BITS) {
					diskNumber = getUint32(endOfDirectoryView, 20);
				}
				if (filesLength == MAX_16_BITS) {
					filesLength = getBigUint64(endOfDirectoryView, 32);
				}
				if (directoryDataLength == MAX_32_BITS) {
					directoryDataLength = getBigUint64(endOfDirectoryView, 40);
				}
				directoryDataOffset -= directoryDataLength;
			}
			if (directoryDataOffset >= reader.size) {
				prependedDataLength = reader.size - directoryDataOffset - directoryDataLength - END_OF_CENTRAL_DIR_LENGTH;
				directoryDataOffset = reader.size - directoryDataLength - END_OF_CENTRAL_DIR_LENGTH;	
			}
			if (expectedLastDiskNumber != lastDiskNumber) {
				throw new Error$1(ERR_SPLIT_ZIP_FILE);
			}
			if (directoryDataOffset < 0) {
				throw new Error$1(ERR_BAD_FORMAT);
			}
			let offset = 0;
			let directoryArray = await readUint8Array(reader, directoryDataOffset, directoryDataLength, diskNumber);
			let directoryView = getDataView$1(directoryArray);
			if (directoryDataLength) {
				const expectedDirectoryDataOffset = endOfDirectoryInfo.offset - directoryDataLength;
				if (getUint32(directoryView, offset) != CENTRAL_FILE_HEADER_SIGNATURE && directoryDataOffset != expectedDirectoryDataOffset) {
					const originalDirectoryDataOffset = directoryDataOffset;
					directoryDataOffset = expectedDirectoryDataOffset;
					prependedDataLength += directoryDataOffset - originalDirectoryDataOffset;
					directoryArray = await readUint8Array(reader, directoryDataOffset, directoryDataLength, diskNumber);
					directoryView = getDataView$1(directoryArray);
				}
			}
			const expectedDirectoryDataLength = endOfDirectoryInfo.offset - directoryDataOffset - (reader.lastDiskOffset || 0);
			if (directoryDataLength != expectedDirectoryDataLength && expectedDirectoryDataLength >= 0) {
				directoryDataLength = expectedDirectoryDataLength;
				directoryArray = await readUint8Array(reader, directoryDataOffset, directoryDataLength, diskNumber);
				directoryView = getDataView$1(directoryArray);
			}
			if (directoryDataOffset < 0 || directoryDataOffset >= reader.size) {
				throw new Error$1(ERR_BAD_FORMAT);
			}
			const filenameEncoding = getOptionValue$1(zipReader, options, "filenameEncoding");
			const commentEncoding = getOptionValue$1(zipReader, options, "commentEncoding");
			for (let indexFile = 0; indexFile < filesLength; indexFile++) {
				const fileEntry = new ZipEntry(reader, config, zipReader.options);
				if (getUint32(directoryView, offset) != CENTRAL_FILE_HEADER_SIGNATURE) {
					throw new Error$1(ERR_CENTRAL_DIRECTORY_NOT_FOUND);
				}
				readCommonHeader(fileEntry, directoryView, offset + 6);
				const languageEncodingFlag = Boolean(fileEntry.bitFlag.languageEncodingFlag);
				const filenameOffset = offset + 46;
				const extraFieldOffset = filenameOffset + fileEntry.filenameLength;
				const commentOffset = extraFieldOffset + fileEntry.extraFieldLength;
				const versionMadeBy = getUint16(directoryView, offset + 4);
				const msDosCompatible = (versionMadeBy & 0) == 0;
				const rawFilename = directoryArray.subarray(filenameOffset, extraFieldOffset);
				const commentLength = getUint16(directoryView, offset + 32);
				const endOffset = commentOffset + commentLength;
				const rawComment = directoryArray.subarray(commentOffset, endOffset);
				const filenameUTF8 = languageEncodingFlag;
				const commentUTF8 = languageEncodingFlag;
				const directory = msDosCompatible && ((getUint8(directoryView, offset + 38) & FILE_ATTR_MSDOS_DIR_MASK) == FILE_ATTR_MSDOS_DIR_MASK);
				const offsetFileEntry = getUint32(directoryView, offset + 42) + prependedDataLength;
				Object$1.assign(fileEntry, {
					versionMadeBy,
					msDosCompatible,
					compressedSize: 0,
					uncompressedSize: 0,
					commentLength,
					directory,
					offset: offsetFileEntry,
					diskNumberStart: getUint16(directoryView, offset + 34),
					internalFileAttribute: getUint16(directoryView, offset + 36),
					externalFileAttribute: getUint32(directoryView, offset + 38),
					rawFilename,
					filenameUTF8,
					commentUTF8,
					rawExtraField: directoryArray.subarray(extraFieldOffset, commentOffset)
				});
				const [filename, comment] = await Promise$1.all([
					decodeText(rawFilename, filenameUTF8 ? CHARSET_UTF8 : filenameEncoding || CHARSET_CP437),
					decodeText(rawComment, commentUTF8 ? CHARSET_UTF8 : commentEncoding || CHARSET_CP437)
				]);
				Object$1.assign(fileEntry, {
					rawComment,
					filename,
					comment,
					directory: directory || filename.endsWith(DIRECTORY_SIGNATURE)
				});
				startOffset = Math$1.max(offsetFileEntry, startOffset);
				await readCommonFooter(fileEntry, fileEntry, directoryView, offset + 6);
				const entry = new Entry(fileEntry);
				entry.getData = (writer, options) => fileEntry.getData(writer, entry, options);
				offset = endOffset;
				const { onprogress } = options;
				if (onprogress) {
					try {
						await onprogress(indexFile + 1, filesLength, new Entry(fileEntry));
					} catch (_error) {
						// ignored
					}
				}
				yield entry;
			}
			const extractPrependedData = getOptionValue$1(zipReader, options, "extractPrependedData");
			const extractAppendedData = getOptionValue$1(zipReader, options, "extractAppendedData");
			if (extractPrependedData) {
				zipReader.prependedData = startOffset > 0 ? await readUint8Array(reader, 0, startOffset) : new Uint8Array$1();
			}
			zipReader.comment = commentLength ? await readUint8Array(reader, commentOffset + END_OF_CENTRAL_DIR_LENGTH, commentLength) : new Uint8Array$1();
			if (extractAppendedData) {
				zipReader.appendedData = appendedDataOffset < reader.size ? await readUint8Array(reader, appendedDataOffset, reader.size - appendedDataOffset) : new Uint8Array$1();
			}
			return true;
		}

		async getEntries(options = {}) {
			const entries = [];
			for await (const entry of this.getEntriesGenerator(options)) {
				entries.push(entry);
			}
			return entries;
		}

		async close() {
		}
	}

	class ZipEntry {

		constructor(reader, config, options) {
			Object$1.assign(this, {
				reader,
				config,
				options
			});
		}

		async getData(writer, fileEntry, options = {}) {
			const zipEntry = this;
			const {
				reader,
				offset,
				diskNumberStart,
				extraFieldAES,
				compressionMethod,
				config,
				bitFlag,
				signature,
				rawLastModDate,
				uncompressedSize,
				compressedSize
			} = zipEntry;
			const localDirectory = fileEntry.localDirectory = {};
			const dataArray = await readUint8Array(reader, offset, 30, diskNumberStart);
			const dataView = getDataView$1(dataArray);
			let password = getOptionValue$1(zipEntry, options, "password");
			password = password && password.length && password;
			if (extraFieldAES) {
				if (extraFieldAES.originalCompressionMethod != COMPRESSION_METHOD_AES) {
					throw new Error$1(ERR_UNSUPPORTED_COMPRESSION);
				}
			}
			if (compressionMethod != COMPRESSION_METHOD_STORE && compressionMethod != COMPRESSION_METHOD_DEFLATE) {
				throw new Error$1(ERR_UNSUPPORTED_COMPRESSION);
			}
			if (getUint32(dataView, 0) != LOCAL_FILE_HEADER_SIGNATURE) {
				throw new Error$1(ERR_LOCAL_FILE_HEADER_NOT_FOUND);
			}
			readCommonHeader(localDirectory, dataView, 4);
			localDirectory.rawExtraField = localDirectory.extraFieldLength ?
				await readUint8Array(reader, offset + 30 + localDirectory.filenameLength, localDirectory.extraFieldLength, diskNumberStart) :
				new Uint8Array$1();
			await readCommonFooter(zipEntry, localDirectory, dataView, 4, true);
			Object$1.assign(fileEntry, {
				lastAccessDate: localDirectory.lastAccessDate,
				creationDate: localDirectory.creationDate
			});
			const encrypted = zipEntry.encrypted && localDirectory.encrypted;
			const zipCrypto = encrypted && !extraFieldAES;
			if (encrypted) {
				if (!zipCrypto && extraFieldAES.strength === UNDEFINED_VALUE) {
					throw new Error$1(ERR_UNSUPPORTED_ENCRYPTION);
				} else if (!password) {
					throw new Error$1(ERR_ENCRYPTED);
				}
			}
			const dataOffset = offset + 30 + localDirectory.filenameLength + localDirectory.extraFieldLength;
			const size = compressedSize;
			const readable = reader.readable;
			Object$1.assign(readable, {
				diskNumberStart,
				offset: dataOffset,
				size
			});
			const signal = getOptionValue$1(zipEntry, options, "signal");
			const checkPasswordOnly = getOptionValue$1(zipEntry, options, "checkPasswordOnly");
			if (checkPasswordOnly) {
				writer = new WritableStream();
			}
			writer = initWriter(writer);
			await initStream(writer, uncompressedSize);
			const { writable } = writer;
			const { onstart, onprogress, onend } = options;
			const workerOptions = {
				options: {
					codecType: CODEC_INFLATE,
					password,
					zipCrypto,
					encryptionStrength: extraFieldAES && extraFieldAES.strength,
					signed: getOptionValue$1(zipEntry, options, "checkSignature"),
					passwordVerification: zipCrypto && (bitFlag.dataDescriptor ? ((rawLastModDate >>> 8) & 0xFF) : ((signature >>> 24) & 0xFF)),
					signature,
					compressed: compressionMethod != 0,
					encrypted,
					useWebWorkers: getOptionValue$1(zipEntry, options, "useWebWorkers"),
					useCompressionStream: getOptionValue$1(zipEntry, options, "useCompressionStream"),
					transferStreams: getOptionValue$1(zipEntry, options, "transferStreams"),
					checkPasswordOnly
				},
				config,
				streamOptions: { signal, size, onstart, onprogress, onend }
			};
			let outputSize = 0;
			try {
				({ outputSize } = (await runWorker({ readable, writable }, workerOptions)));
			} catch (error) {
				if (!checkPasswordOnly || error.message != ERR_ABORT_CHECK_PASSWORD) {
					throw error;
				}
			} finally {
				const preventClose = getOptionValue$1(zipEntry, options, "preventClose");
				writable.size += outputSize;
				if (!preventClose && !writable.locked) {
					await writable.getWriter().close();
				}
			}
			return checkPasswordOnly ? undefined : writer.getData ? writer.getData() : writable;
		}
	}

	function readCommonHeader(directory, dataView, offset) {
		const rawBitFlag = directory.rawBitFlag = getUint16(dataView, offset + 2);
		const encrypted = (rawBitFlag & BITFLAG_ENCRYPTED) == BITFLAG_ENCRYPTED;
		const rawLastModDate = getUint32(dataView, offset + 6);
		Object$1.assign(directory, {
			encrypted,
			version: getUint16(dataView, offset),
			bitFlag: {
				level: (rawBitFlag & BITFLAG_LEVEL) >> 1,
				dataDescriptor: (rawBitFlag & BITFLAG_DATA_DESCRIPTOR) == BITFLAG_DATA_DESCRIPTOR,
				languageEncodingFlag: (rawBitFlag & BITFLAG_LANG_ENCODING_FLAG) == BITFLAG_LANG_ENCODING_FLAG
			},
			rawLastModDate,
			lastModDate: getDate(rawLastModDate),
			filenameLength: getUint16(dataView, offset + 22),
			extraFieldLength: getUint16(dataView, offset + 24)
		});
	}

	async function readCommonFooter(fileEntry, directory, dataView, offset, localDirectory) {
		const { rawExtraField } = directory;
		const extraField = directory.extraField = new Map$1();
		const rawExtraFieldView = getDataView$1(new Uint8Array$1(rawExtraField));
		let offsetExtraField = 0;
		try {
			while (offsetExtraField < rawExtraField.length) {
				const type = getUint16(rawExtraFieldView, offsetExtraField);
				const size = getUint16(rawExtraFieldView, offsetExtraField + 2);
				extraField.set(type, {
					type,
					data: rawExtraField.slice(offsetExtraField + 4, offsetExtraField + 4 + size)
				});
				offsetExtraField += 4 + size;
			}
		} catch (_error) {
			// ignored
		}
		const compressionMethod = getUint16(dataView, offset + 4);
		Object$1.assign(directory, {
			signature: getUint32(dataView, offset + 10),
			uncompressedSize: getUint32(dataView, offset + 18),
			compressedSize: getUint32(dataView, offset + 14)
		});
		const extraFieldZip64 = extraField.get(EXTRAFIELD_TYPE_ZIP64);
		if (extraFieldZip64) {
			readExtraFieldZip64(extraFieldZip64, directory);
			directory.extraFieldZip64 = extraFieldZip64;
		}
		const extraFieldUnicodePath = extraField.get(EXTRAFIELD_TYPE_UNICODE_PATH);
		if (extraFieldUnicodePath) {
			await readExtraFieldUnicode(extraFieldUnicodePath, PROPERTY_NAME_FILENAME, PROPERTY_NAME_RAW_FILENAME, directory, fileEntry);
			directory.extraFieldUnicodePath = extraFieldUnicodePath;
		}
		const extraFieldUnicodeComment = extraField.get(EXTRAFIELD_TYPE_UNICODE_COMMENT);
		if (extraFieldUnicodeComment) {
			await readExtraFieldUnicode(extraFieldUnicodeComment, PROPERTY_NAME_COMMENT, PROPERTY_NAME_RAW_COMMENT, directory, fileEntry);
			directory.extraFieldUnicodeComment = extraFieldUnicodeComment;
		}
		const extraFieldAES = extraField.get(EXTRAFIELD_TYPE_AES);
		if (extraFieldAES) {
			readExtraFieldAES(extraFieldAES, directory, compressionMethod);
			directory.extraFieldAES = extraFieldAES;
		} else {
			directory.compressionMethod = compressionMethod;
		}
		const extraFieldNTFS = extraField.get(EXTRAFIELD_TYPE_NTFS);
		if (extraFieldNTFS) {
			readExtraFieldNTFS(extraFieldNTFS, directory);
			directory.extraFieldNTFS = extraFieldNTFS;
		}
		const extraFieldExtendedTimestamp = extraField.get(EXTRAFIELD_TYPE_EXTENDED_TIMESTAMP);
		if (extraFieldExtendedTimestamp) {
			readExtraFieldExtendedTimestamp(extraFieldExtendedTimestamp, directory, localDirectory);
			directory.extraFieldExtendedTimestamp = extraFieldExtendedTimestamp;
		}
		const extraFieldUSDZ = extraField.get(EXTRAFIELD_TYPE_USDZ);
		if (extraFieldUSDZ) {
			directory.extraFieldUSDZ = extraFieldUSDZ;
		}
	}

	function readExtraFieldZip64(extraFieldZip64, directory) {
		directory.zip64 = true;
		const extraFieldView = getDataView$1(extraFieldZip64.data);
		const missingProperties = ZIP64_PROPERTIES.filter(([propertyName, max]) => directory[propertyName] == max);
		for (let indexMissingProperty = 0, offset = 0; indexMissingProperty < missingProperties.length; indexMissingProperty++) {
			const [propertyName, max] = missingProperties[indexMissingProperty];
			if (directory[propertyName] == max) {
				const extraction = ZIP64_EXTRACTION[max];
				directory[propertyName] = extraFieldZip64[propertyName] = extraction.getValue(extraFieldView, offset);
				offset += extraction.bytes;
			} else if (extraFieldZip64[propertyName]) {
				throw new Error$1(ERR_EXTRAFIELD_ZIP64_NOT_FOUND);
			}
		}
	}

	async function readExtraFieldUnicode(extraFieldUnicode, propertyName, rawPropertyName, directory, fileEntry) {
		const extraFieldView = getDataView$1(extraFieldUnicode.data);
		const crc32 = new Crc32();
		crc32.append(fileEntry[rawPropertyName]);
		const dataViewSignature = getDataView$1(new Uint8Array$1(4));
		dataViewSignature.setUint32(0, crc32.get(), true);
		const signature = getUint32(extraFieldView, 1);
		Object$1.assign(extraFieldUnicode, {
			version: getUint8(extraFieldView, 0),
			[propertyName]: decodeText(extraFieldUnicode.data.subarray(5)),
			valid: !fileEntry.bitFlag.languageEncodingFlag && signature == getUint32(dataViewSignature, 0)
		});
		if (extraFieldUnicode.valid) {
			directory[propertyName] = extraFieldUnicode[propertyName];
			directory[propertyName + "UTF8"] = true;
		}
	}

	function readExtraFieldAES(extraFieldAES, directory, compressionMethod) {
		const extraFieldView = getDataView$1(extraFieldAES.data);
		const strength = getUint8(extraFieldView, 4);
		Object$1.assign(extraFieldAES, {
			vendorVersion: getUint8(extraFieldView, 0),
			vendorId: getUint8(extraFieldView, 2),
			strength,
			originalCompressionMethod: compressionMethod,
			compressionMethod: getUint16(extraFieldView, 5)
		});
		directory.compressionMethod = extraFieldAES.compressionMethod;
	}

	function readExtraFieldNTFS(extraFieldNTFS, directory) {
		const extraFieldView = getDataView$1(extraFieldNTFS.data);
		let offsetExtraField = 4;
		let tag1Data;
		try {
			while (offsetExtraField < extraFieldNTFS.data.length && !tag1Data) {
				const tagValue = getUint16(extraFieldView, offsetExtraField);
				const attributeSize = getUint16(extraFieldView, offsetExtraField + 2);
				if (tagValue == EXTRAFIELD_TYPE_NTFS_TAG1) {
					tag1Data = extraFieldNTFS.data.slice(offsetExtraField + 4, offsetExtraField + 4 + attributeSize);
				}
				offsetExtraField += 4 + attributeSize;
			}
		} catch (_error) {
			// ignored
		}
		try {
			if (tag1Data && tag1Data.length == 24) {
				const tag1View = getDataView$1(tag1Data);
				const rawLastModDate = tag1View.getBigUint64(0, true);
				const rawLastAccessDate = tag1View.getBigUint64(8, true);
				const rawCreationDate = tag1View.getBigUint64(16, true);
				Object$1.assign(extraFieldNTFS, {
					rawLastModDate,
					rawLastAccessDate,
					rawCreationDate
				});
				const lastModDate = getDateNTFS(rawLastModDate);
				const lastAccessDate = getDateNTFS(rawLastAccessDate);
				const creationDate = getDateNTFS(rawCreationDate);
				const extraFieldData = { lastModDate, lastAccessDate, creationDate };
				Object$1.assign(extraFieldNTFS, extraFieldData);
				Object$1.assign(directory, extraFieldData);
			}
		} catch (_error) {
			// ignored
		}
	}

	function readExtraFieldExtendedTimestamp(extraFieldExtendedTimestamp, directory, localDirectory) {
		const extraFieldView = getDataView$1(extraFieldExtendedTimestamp.data);
		const flags = getUint8(extraFieldView, 0);
		const timeProperties = [];
		const timeRawProperties = [];
		if (localDirectory) {
			if ((flags & 0x1) == 0x1) {
				timeProperties.push(PROPERTY_NAME_LAST_MODIFICATION_DATE);
				timeRawProperties.push(PROPERTY_NAME_RAW_LAST_MODIFICATION_DATE);
			}
			if ((flags & 0x2) == 0x2) {
				timeProperties.push(PROPERTY_NAME_LAST_ACCESS_DATE);
				timeRawProperties.push(PROPERTY_NAME_RAW_LAST_ACCESS_DATE);
			}
			if ((flags & 0x4) == 0x4) {
				timeProperties.push(PROPERTY_NAME_CREATION_DATE);
				timeRawProperties.push(PROPERTY_NAME_RAW_CREATION_DATE);
			}
		} else if (extraFieldExtendedTimestamp.data.length >= 5) {
			timeProperties.push(PROPERTY_NAME_LAST_MODIFICATION_DATE);
			timeRawProperties.push(PROPERTY_NAME_RAW_LAST_MODIFICATION_DATE);
		}
		let offset = 1;
		timeProperties.forEach((propertyName, indexProperty) => {
			if (extraFieldExtendedTimestamp.data.length >= offset + 4) {
				const time = getUint32(extraFieldView, offset);
				directory[propertyName] = extraFieldExtendedTimestamp[propertyName] = new Date$1(time * 1000);
				const rawPropertyName = timeRawProperties[indexProperty];
				extraFieldExtendedTimestamp[rawPropertyName] = time;
			}
			offset += 4;
		});
	}

	async function seekSignature(reader, signature, startOffset, minimumBytes, maximumLength) {
		const signatureArray = new Uint8Array$1(4);
		const signatureView = getDataView$1(signatureArray);
		setUint32$1(signatureView, 0, signature);
		const maximumBytes = minimumBytes + maximumLength;
		return (await seek(minimumBytes)) || await seek(Math$1.min(maximumBytes, startOffset));

		async function seek(length) {
			const offset = startOffset - length;
			const bytes = await readUint8Array(reader, offset, length);
			for (let indexByte = bytes.length - minimumBytes; indexByte >= 0; indexByte--) {
				if (bytes[indexByte] == signatureArray[0] && bytes[indexByte + 1] == signatureArray[1] &&
					bytes[indexByte + 2] == signatureArray[2] && bytes[indexByte + 3] == signatureArray[3]) {
					return {
						offset: offset + indexByte,
						buffer: bytes.slice(indexByte, indexByte + minimumBytes).buffer
					};
				}
			}
		}
	}

	function getOptionValue$1(zipReader, options, name) {
		return options[name] === UNDEFINED_VALUE ? zipReader.options[name] : options[name];
	}

	function getDate(timeRaw) {
		const date = (timeRaw & 0xffff0000) >> 16, time = timeRaw & 0x0000ffff;
		try {
			return new Date$1(1980 + ((date & 0xFE00) >> 9), ((date & 0x01E0) >> 5) - 1, date & 0x001F, (time & 0xF800) >> 11, (time & 0x07E0) >> 5, (time & 0x001F) * 2, 0);
		} catch (_error) {
			// ignored
		}
	}

	function getDateNTFS(timeRaw) {
		return new Date$1((Number$1((timeRaw / BigInt(10000)) - BigInt(11644473600000))));
	}

	function getUint8(view, offset) {
		return view.getUint8(offset);
	}

	function getUint16(view, offset) {
		return view.getUint16(offset, true);
	}

	function getUint32(view, offset) {
		return view.getUint32(offset, true);
	}

	function getBigUint64(view, offset) {
		return Number$1(view.getBigUint64(offset, true));
	}

	function setUint32$1(view, offset, value) {
		view.setUint32(offset, value, true);
	}

	function getDataView$1(array) {
		return new DataView$1(array.buffer);
	}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	const ERR_DUPLICATED_NAME = "File already exists";
	const ERR_INVALID_COMMENT = "Zip file comment exceeds 64KB";
	const ERR_INVALID_ENTRY_COMMENT = "File entry comment exceeds 64KB";
	const ERR_INVALID_ENTRY_NAME = "File entry name exceeds 64KB";
	const ERR_INVALID_VERSION = "Version exceeds 65535";
	const ERR_INVALID_ENCRYPTION_STRENGTH = "The strength must equal 1, 2, or 3";
	const ERR_INVALID_EXTRAFIELD_TYPE = "Extra field type exceeds 65535";
	const ERR_INVALID_EXTRAFIELD_DATA = "Extra field data exceeds 64KB";
	const ERR_UNSUPPORTED_FORMAT = "Zip64 is not supported (make sure 'keepOrder' is set to 'true')";

	const EXTRAFIELD_DATA_AES = new Uint8Array$1([0x07, 0x00, 0x02, 0x00, 0x41, 0x45, 0x03, 0x00, 0x00]);

	let workers = 0;
	const pendingEntries = [];

	class ZipWriter {

		constructor(writer, options = {}) {
			writer = initWriter(writer);
			Object$1.assign(this, {
				writer,
				addSplitZipSignature: writer instanceof SplitDataWriter,
				options,
				config: getConfiguration(),
				files: new Map$1(),
				filenames: new Set$1(),
				offset: writer.writable.size,
				pendingEntriesSize: 0,
				pendingAddFileCalls: new Set$1(),
				bufferedWrites: 0
			});
		}

		async add(name = "", reader, options = {}) {
			const zipWriter = this;
			const {
				pendingAddFileCalls,
				config
			} = zipWriter;
			if (workers < config.maxWorkers) {
				workers++;
			} else {
				await new Promise$1(resolve => pendingEntries.push(resolve));
			}
			let promiseAddFile;
			try {
				name = name.trim();
				if (zipWriter.filenames.has(name)) {
					throw new Error$1(ERR_DUPLICATED_NAME);
				}
				zipWriter.filenames.add(name);
				promiseAddFile = addFile(zipWriter, name, reader, options);
				pendingAddFileCalls.add(promiseAddFile);
				return await promiseAddFile;
			} catch (error) {
				zipWriter.filenames.delete(name);
				throw error;
			} finally {
				pendingAddFileCalls.delete(promiseAddFile);
				const pendingEntry = pendingEntries.shift();
				if (pendingEntry) {
					pendingEntry();
				} else {
					workers--;
				}
			}
		}

		async close(comment = new Uint8Array$1(), options = {}) {
			const zipWriter = this;
			const { pendingAddFileCalls, writer } = this;
			const { writable } = writer;
			while (pendingAddFileCalls.size) {
				await Promise$1.all(Array$1.from(pendingAddFileCalls));
			}
			await closeFile(this, comment, options);
			const preventClose = getOptionValue(zipWriter, options, "preventClose");
			if (!preventClose) {
				await writable.getWriter().close();
			}
			return writer.getData ? writer.getData() : writable;
		}
	}

	async function addFile(zipWriter, name, reader, options) {
		name = name.trim();
		if (options.directory && (!name.endsWith(DIRECTORY_SIGNATURE))) {
			name += DIRECTORY_SIGNATURE;
		} else {
			options.directory = name.endsWith(DIRECTORY_SIGNATURE);
		}
		const rawFilename = encodeText(name);
		if (getLength(rawFilename) > MAX_16_BITS) {
			throw new Error$1(ERR_INVALID_ENTRY_NAME);
		}
		const comment = options.comment || "";
		const rawComment = encodeText(comment);
		if (getLength(rawComment) > MAX_16_BITS) {
			throw new Error$1(ERR_INVALID_ENTRY_COMMENT);
		}
		const version = getOptionValue(zipWriter, options, "version", VERSION_DEFLATE);
		if (version > MAX_16_BITS) {
			throw new Error$1(ERR_INVALID_VERSION);
		}
		const versionMadeBy = getOptionValue(zipWriter, options, "versionMadeBy", 20);
		if (versionMadeBy > MAX_16_BITS) {
			throw new Error$1(ERR_INVALID_VERSION);
		}
		const lastModDate = getOptionValue(zipWriter, options, PROPERTY_NAME_LAST_MODIFICATION_DATE, new Date$1());
		const lastAccessDate = getOptionValue(zipWriter, options, PROPERTY_NAME_LAST_ACCESS_DATE);
		const creationDate = getOptionValue(zipWriter, options, PROPERTY_NAME_CREATION_DATE);
		const msDosCompatible = getOptionValue(zipWriter, options, PROPERTY_NAME_MS_DOS_COMPATIBLE, true);
		const internalFileAttribute = getOptionValue(zipWriter, options, PROPERTY_NAME_INTERNAL_FILE_ATTRIBUTE, 0);
		const externalFileAttribute = getOptionValue(zipWriter, options, PROPERTY_NAME_EXTERNAL_FILE_ATTRIBUTE, 0);
		const password = getOptionValue(zipWriter, options, "password");
		const encryptionStrength = getOptionValue(zipWriter, options, "encryptionStrength", 3);
		const zipCrypto = getOptionValue(zipWriter, options, "zipCrypto");
		const extendedTimestamp = getOptionValue(zipWriter, options, "extendedTimestamp", true);
		const keepOrder = getOptionValue(zipWriter, options, "keepOrder", true);
		const level = getOptionValue(zipWriter, options, "level");
		const useWebWorkers = getOptionValue(zipWriter, options, "useWebWorkers");
		const bufferedWrite = getOptionValue(zipWriter, options, "bufferedWrite");
		const dataDescriptorSignature = getOptionValue(zipWriter, options, "dataDescriptorSignature", false);
		const signal = getOptionValue(zipWriter, options, "signal");
		const useCompressionStream = getOptionValue(zipWriter, options, "useCompressionStream");
		let dataDescriptor = getOptionValue(zipWriter, options, "dataDescriptor", true);
		let zip64 = getOptionValue(zipWriter, options, PROPERTY_NAME_ZIP64);
		if (password !== UNDEFINED_VALUE && encryptionStrength !== UNDEFINED_VALUE && (encryptionStrength < 1 || encryptionStrength > 3)) {
			throw new Error$1(ERR_INVALID_ENCRYPTION_STRENGTH);
		}
		let rawExtraField = new Uint8Array$1();
		const { extraField } = options;
		if (extraField) {
			let extraFieldSize = 0;
			let offset = 0;
			extraField.forEach(data => extraFieldSize += 4 + getLength(data));
			rawExtraField = new Uint8Array$1(extraFieldSize);
			extraField.forEach((data, type) => {
				if (type > MAX_16_BITS) {
					throw new Error$1(ERR_INVALID_EXTRAFIELD_TYPE);
				}
				if (getLength(data) > MAX_16_BITS) {
					throw new Error$1(ERR_INVALID_EXTRAFIELD_DATA);
				}
				arraySet(rawExtraField, new Uint16Array([type]), offset);
				arraySet(rawExtraField, new Uint16Array([getLength(data)]), offset + 2);
				arraySet(rawExtraField, data, offset + 4);
				offset += 4 + getLength(data);
			});
		}
		let maximumCompressedSize = 0;
		let maximumEntrySize = 0;
		let uncompressedSize = 0;
		const zip64Enabled = zip64 === true;
		if (reader) {
			reader = initReader(reader);
			await initStream(reader);
			if (reader.size === UNDEFINED_VALUE) {
				dataDescriptor = true;
				if (zip64 || zip64 === UNDEFINED_VALUE) {
					zip64 = true;
					uncompressedSize = maximumCompressedSize = MAX_32_BITS;
				}
			} else {
				uncompressedSize = reader.size;
				maximumCompressedSize = getMaximumCompressedSize(uncompressedSize);
			}
		}
		const { diskOffset, diskNumber, maxSize } = zipWriter.writer;
		const zip64UncompressedSize = zip64Enabled || uncompressedSize >= MAX_32_BITS;
		const zip64CompressedSize = zip64Enabled || maximumCompressedSize >= MAX_32_BITS;
		const zip64Offset = zip64Enabled || zipWriter.offset + zipWriter.pendingEntriesSize - diskOffset >= MAX_32_BITS;
		const supportZip64SplitFile = getOptionValue(zipWriter, options, "supportZip64SplitFile", true);
		const zip64DiskNumberStart = (supportZip64SplitFile && zip64Enabled) || diskNumber + Math$1.ceil(zipWriter.pendingEntriesSize / maxSize) >= MAX_16_BITS;
		if (zip64Offset || zip64UncompressedSize || zip64CompressedSize || zip64DiskNumberStart) {
			if (zip64 === false || !keepOrder) {
				throw new Error$1(ERR_UNSUPPORTED_FORMAT);
			} else {
				zip64 = true;
			}
		}
		zip64 = zip64 || false;
		options = Object$1.assign({}, options, {
			rawFilename,
			rawComment,
			version,
			versionMadeBy,
			lastModDate,
			lastAccessDate,
			creationDate,
			rawExtraField,
			zip64,
			zip64UncompressedSize,
			zip64CompressedSize,
			zip64Offset,
			zip64DiskNumberStart,
			password,
			level,
			useWebWorkers,
			encryptionStrength,
			extendedTimestamp,
			zipCrypto,
			bufferedWrite,
			keepOrder,
			dataDescriptor,
			dataDescriptorSignature,
			signal,
			msDosCompatible,
			internalFileAttribute,
			externalFileAttribute,
			useCompressionStream
		});
		const headerInfo = getHeaderInfo(options);
		const dataDescriptorInfo = getDataDescriptorInfo(options);
		const metadataSize = getLength(headerInfo.localHeaderArray, dataDescriptorInfo.dataDescriptorArray);
		maximumEntrySize = metadataSize + maximumCompressedSize;
		if (zipWriter.options.usdz) {
			maximumEntrySize += maximumEntrySize + 64;
		}
		zipWriter.pendingEntriesSize += maximumEntrySize;
		let fileEntry;
		try {
			fileEntry = await getFileEntry(zipWriter, name, reader, { headerInfo, dataDescriptorInfo, metadataSize }, options);
		} finally {
			zipWriter.pendingEntriesSize -= maximumEntrySize;
		}
		Object$1.assign(fileEntry, { name, comment, extraField });
		return new Entry(fileEntry);
	}

	async function getFileEntry(zipWriter, name, reader, entryInfo, options) {
		const {
			files,
			writer
		} = zipWriter;
		const {
			keepOrder,
			dataDescriptor,
			signal
		} = options;
		const {
			headerInfo
		} = entryInfo;
		const { usdz } = zipWriter.options;
		const previousFileEntry = Array$1.from(files.values()).pop();
		let fileEntry = {};
		let bufferedWrite;
		let releaseLockWriter;
		let releaseLockCurrentFileEntry;
		let writingBufferedEntryData;
		let writingEntryData;
		let fileWriter;
		files.set(name, fileEntry);
		try {
			let lockPreviousFileEntry;
			if (keepOrder) {
				lockPreviousFileEntry = previousFileEntry && previousFileEntry.lock;
				requestLockCurrentFileEntry();
			}
			if ((options.bufferedWrite || zipWriter.writerLocked || (zipWriter.bufferedWrites && keepOrder) || !dataDescriptor) && !usdz) {
				fileWriter = new BlobWriter();
				fileWriter.writable.size = 0;
				bufferedWrite = true;
				zipWriter.bufferedWrites++;
				await initStream(writer);
			} else {
				fileWriter = writer;
				await requestLockWriter();
			}
			await initStream(fileWriter);
			const { writable } = writer;
			let { diskOffset } = writer;
			if (zipWriter.addSplitZipSignature) {
				delete zipWriter.addSplitZipSignature;
				const signatureArray = new Uint8Array$1(4);
				const signatureArrayView = getDataView(signatureArray);
				setUint32(signatureArrayView, 0, SPLIT_ZIP_FILE_SIGNATURE);
				await writeData(writable, signatureArray);
				zipWriter.offset += 4;
			}
			if (usdz) {
				appendExtraFieldUSDZ(entryInfo, zipWriter.offset - diskOffset);
			}
			if (!bufferedWrite) {
				await lockPreviousFileEntry;
				await skipDiskIfNeeded(writable);
			}
			const { diskNumber } = writer;
			writingEntryData = true;
			fileEntry.diskNumberStart = diskNumber;
			fileEntry = await createFileEntry(reader, fileWriter, fileEntry, entryInfo, zipWriter.config, options);
			writingEntryData = false;
			files.set(name, fileEntry);
			fileEntry.filename = name;
			if (bufferedWrite) {
				await fileWriter.writable.getWriter().close();
				let blob = await fileWriter.getData();
				await lockPreviousFileEntry;
				await requestLockWriter();
				writingBufferedEntryData = true;
				if (!dataDescriptor) {
					blob = await writeExtraHeaderInfo(fileEntry, blob, writable, options);
				}
				await skipDiskIfNeeded(writable);
				fileEntry.diskNumberStart = writer.diskNumber;
				diskOffset = writer.diskOffset;
				await blob.stream().pipeTo(writable, { preventClose: true, preventAbort: true, signal });
				writable.size += blob.size;
				writingBufferedEntryData = false;
			}
			fileEntry.offset = zipWriter.offset - diskOffset;
			if (fileEntry.zip64) {
				setZip64ExtraInfo(fileEntry, options);
			} else if (fileEntry.offset >= MAX_32_BITS) {
				throw new Error$1(ERR_UNSUPPORTED_FORMAT);
			}
			zipWriter.offset += fileEntry.length;
			return fileEntry;
		} catch (error) {
			if ((bufferedWrite && writingBufferedEntryData) || (!bufferedWrite && writingEntryData)) {
				zipWriter.hasCorruptedEntries = true;
				if (error) {
					try {
						error.corruptedEntry = true;
					} catch (_error) {
						// ignored
					}
				}
				if (bufferedWrite) {
					zipWriter.offset += fileWriter.writable.size;
				} else {
					zipWriter.offset = fileWriter.writable.size;
				}
			}
			files.delete(name);
			throw error;
		} finally {
			if (bufferedWrite) {
				zipWriter.bufferedWrites--;
			}
			if (releaseLockCurrentFileEntry) {
				releaseLockCurrentFileEntry();
			}
			if (releaseLockWriter) {
				releaseLockWriter();
			}
		}

		function requestLockCurrentFileEntry() {
			fileEntry.lock = new Promise$1(resolve => releaseLockCurrentFileEntry = resolve);
		}

		async function requestLockWriter() {
			zipWriter.writerLocked = true;
			const { lockWriter } = zipWriter;
			zipWriter.lockWriter = new Promise$1(resolve => releaseLockWriter = () => {
				zipWriter.writerLocked = false;
				resolve();
			});
			await lockWriter;
		}

		async function skipDiskIfNeeded(writable) {
			if (headerInfo.localHeaderArray.length > writer.availableSize) {
				writer.availableSize = 0;
				await writeData(writable, new Uint8Array$1());
			}
		}
	}

	async function createFileEntry(reader, writer, { diskNumberStart, lock }, entryInfo, config, options) {
		const {
			headerInfo,
			dataDescriptorInfo,
			metadataSize
		} = entryInfo;
		const {
			localHeaderArray,
			headerArray,
			lastModDate,
			rawLastModDate,
			encrypted,
			compressed,
			version,
			compressionMethod,
			rawExtraFieldExtendedTimestamp,
			extraFieldExtendedTimestampFlag,
			rawExtraFieldNTFS,
			rawExtraFieldAES
		} = headerInfo;
		const { dataDescriptorArray } = dataDescriptorInfo;
		const {
			rawFilename,
			lastAccessDate,
			creationDate,
			password,
			level,
			zip64,
			zip64UncompressedSize,
			zip64CompressedSize,
			zip64Offset,
			zip64DiskNumberStart,
			zipCrypto,
			dataDescriptor,
			directory,
			versionMadeBy,
			rawComment,
			rawExtraField,
			useWebWorkers,
			onstart,
			onprogress,
			onend,
			signal,
			encryptionStrength,
			extendedTimestamp,
			msDosCompatible,
			internalFileAttribute,
			externalFileAttribute,
			useCompressionStream
		} = options;
		const fileEntry = {
			lock,
			versionMadeBy,
			zip64,
			directory: Boolean(directory),
			filenameUTF8: true,
			rawFilename,
			commentUTF8: true,
			rawComment,
			rawExtraFieldExtendedTimestamp,
			rawExtraFieldNTFS,
			rawExtraFieldAES,
			rawExtraField,
			extendedTimestamp,
			msDosCompatible,
			internalFileAttribute,
			externalFileAttribute,
			diskNumberStart
		};
		let compressedSize = 0;
		let uncompressedSize = 0;
		let signature;
		const { writable } = writer;
		if (reader) {
			reader.chunkSize = getChunkSize(config);
			await writeData(writable, localHeaderArray);
			const readable = reader.readable;
			const size = readable.size = reader.size;
			const workerOptions = {
				options: {
					codecType: CODEC_DEFLATE,
					level,
					password,
					encryptionStrength,
					zipCrypto: encrypted && zipCrypto,
					passwordVerification: encrypted && zipCrypto && (rawLastModDate >> 8) & 0xFF,
					signed: true,
					compressed,
					encrypted,
					useWebWorkers,
					useCompressionStream,
					transferStreams: false
				},
				config,
				streamOptions: { signal, size, onstart, onprogress, onend }
			};
			const result = await runWorker({ readable, writable }, workerOptions);
			writable.size += result.size;
			signature = result.signature;
			uncompressedSize = reader.size = readable.size;
			compressedSize = result.size;
		} else {
			await writeData(writable, localHeaderArray);
		}
		let rawExtraFieldZip64;
		if (zip64) {
			let rawExtraFieldZip64Length = 4;
			if (zip64UncompressedSize) {
				rawExtraFieldZip64Length += 8;
			}
			if (zip64CompressedSize) {
				rawExtraFieldZip64Length += 8;
			}
			if (zip64Offset) {
				rawExtraFieldZip64Length += 8;
			}
			if (zip64DiskNumberStart) {
				rawExtraFieldZip64Length += 4;
			}
			rawExtraFieldZip64 = new Uint8Array$1(rawExtraFieldZip64Length);
		} else {
			rawExtraFieldZip64 = new Uint8Array$1();
		}
		setEntryInfo({
			signature,
			rawExtraFieldZip64,
			compressedSize,
			uncompressedSize,
			headerInfo,
			dataDescriptorInfo
		}, options);
		if (dataDescriptor) {
			await writeData(writable, dataDescriptorArray);
		}
		Object$1.assign(fileEntry, {
			uncompressedSize,
			compressedSize,
			lastModDate,
			rawLastModDate,
			creationDate,
			lastAccessDate,
			encrypted,
			length: metadataSize + compressedSize,
			compressionMethod,
			version,
			headerArray,
			signature,
			rawExtraFieldZip64,
			extraFieldExtendedTimestampFlag,
			zip64UncompressedSize,
			zip64CompressedSize,
			zip64Offset,
			zip64DiskNumberStart
		});
		return fileEntry;
	}

	function getHeaderInfo(options) {
		const {
			rawFilename,
			lastModDate,
			lastAccessDate,
			creationDate,
			password,
			level,
			zip64,
			zipCrypto,
			dataDescriptor,
			directory,
			rawExtraField,
			encryptionStrength,
			extendedTimestamp
		} = options;
		const compressed = level !== 0 && !directory;
		const encrypted = Boolean(password && getLength(password));
		let version = options.version;
		let rawExtraFieldAES;
		if (encrypted && !zipCrypto) {
			rawExtraFieldAES = new Uint8Array$1(getLength(EXTRAFIELD_DATA_AES) + 2);
			const extraFieldAESView = getDataView(rawExtraFieldAES);
			setUint16(extraFieldAESView, 0, EXTRAFIELD_TYPE_AES);
			arraySet(rawExtraFieldAES, EXTRAFIELD_DATA_AES, 2);
			setUint8(extraFieldAESView, 8, encryptionStrength);
		} else {
			rawExtraFieldAES = new Uint8Array$1();
		}
		let rawExtraFieldNTFS;
		let rawExtraFieldExtendedTimestamp;
		let extraFieldExtendedTimestampFlag;
		if (extendedTimestamp) {
			rawExtraFieldExtendedTimestamp = new Uint8Array$1(9 + (lastAccessDate ? 4 : 0) + (creationDate ? 4 : 0));
			const extraFieldExtendedTimestampView = getDataView(rawExtraFieldExtendedTimestamp);
			setUint16(extraFieldExtendedTimestampView, 0, EXTRAFIELD_TYPE_EXTENDED_TIMESTAMP);
			setUint16(extraFieldExtendedTimestampView, 2, getLength(rawExtraFieldExtendedTimestamp) - 4);
			extraFieldExtendedTimestampFlag = 0x1 + (lastAccessDate ? 0x2 : 0) + (creationDate ? 0x4 : 0);
			setUint8(extraFieldExtendedTimestampView, 4, extraFieldExtendedTimestampFlag);
			let offset = 5;
			setUint32(extraFieldExtendedTimestampView, offset, Math$1.floor(lastModDate.getTime() / 1000));
			offset += 4;
			if (lastAccessDate) {
				setUint32(extraFieldExtendedTimestampView, offset, Math$1.floor(lastAccessDate.getTime() / 1000));
				offset += 4;
			}
			if (creationDate) {
				setUint32(extraFieldExtendedTimestampView, offset, Math$1.floor(creationDate.getTime() / 1000));
			}
			try {
				rawExtraFieldNTFS = new Uint8Array$1(36);
				const extraFieldNTFSView = getDataView(rawExtraFieldNTFS);
				const lastModTimeNTFS = getTimeNTFS(lastModDate);
				setUint16(extraFieldNTFSView, 0, EXTRAFIELD_TYPE_NTFS);
				setUint16(extraFieldNTFSView, 2, 32);
				setUint16(extraFieldNTFSView, 8, EXTRAFIELD_TYPE_NTFS_TAG1);
				setUint16(extraFieldNTFSView, 10, 24);
				setBigUint64(extraFieldNTFSView, 12, lastModTimeNTFS);
				setBigUint64(extraFieldNTFSView, 20, getTimeNTFS(lastAccessDate) || lastModTimeNTFS);
				setBigUint64(extraFieldNTFSView, 28, getTimeNTFS(creationDate) || lastModTimeNTFS);
			} catch (_error) {
				rawExtraFieldNTFS = new Uint8Array$1();
			}
		} else {
			rawExtraFieldNTFS = rawExtraFieldExtendedTimestamp = new Uint8Array$1();
		}
		let bitFlag = BITFLAG_LANG_ENCODING_FLAG;
		if (dataDescriptor) {
			bitFlag = bitFlag | BITFLAG_DATA_DESCRIPTOR;
		}
		let compressionMethod = COMPRESSION_METHOD_STORE;
		if (compressed) {
			compressionMethod = COMPRESSION_METHOD_DEFLATE;
		}
		if (zip64) {
			version = version > VERSION_ZIP64 ? version : VERSION_ZIP64;
		}
		if (encrypted) {
			bitFlag = bitFlag | BITFLAG_ENCRYPTED;
			if (!zipCrypto) {
				version = version > VERSION_AES ? version : VERSION_AES;
				compressionMethod = COMPRESSION_METHOD_AES;
				if (compressed) {
					rawExtraFieldAES[9] = COMPRESSION_METHOD_DEFLATE;
				}
			}
		}
		const headerArray = new Uint8Array$1(26);
		const headerView = getDataView(headerArray);
		setUint16(headerView, 0, version);
		setUint16(headerView, 2, bitFlag);
		setUint16(headerView, 4, compressionMethod);
		const dateArray = new Uint32Array$1(1);
		const dateView = getDataView(dateArray);
		let lastModDateMsDos;
		if (lastModDate < MIN_DATE) {
			lastModDateMsDos = MIN_DATE;
		} else if (lastModDate > MAX_DATE) {
			lastModDateMsDos = MAX_DATE;
		} else {
			lastModDateMsDos = lastModDate;
		}
		setUint16(dateView, 0, (((lastModDateMsDos.getHours() << 6) | lastModDateMsDos.getMinutes()) << 5) | lastModDateMsDos.getSeconds() / 2);
		setUint16(dateView, 2, ((((lastModDateMsDos.getFullYear() - 1980) << 4) | (lastModDateMsDos.getMonth() + 1)) << 5) | lastModDateMsDos.getDate());
		const rawLastModDate = dateArray[0];
		setUint32(headerView, 6, rawLastModDate);
		setUint16(headerView, 22, getLength(rawFilename));
		const extraFieldLength = getLength(rawExtraFieldAES, rawExtraFieldExtendedTimestamp, rawExtraFieldNTFS, rawExtraField);
		setUint16(headerView, 24, extraFieldLength);
		const localHeaderArray = new Uint8Array$1(30 + getLength(rawFilename) + extraFieldLength);
		const localHeaderView = getDataView(localHeaderArray);
		setUint32(localHeaderView, 0, LOCAL_FILE_HEADER_SIGNATURE);
		arraySet(localHeaderArray, headerArray, 4);
		arraySet(localHeaderArray, rawFilename, 30);
		arraySet(localHeaderArray, rawExtraFieldAES, 30 + getLength(rawFilename));
		arraySet(localHeaderArray, rawExtraFieldExtendedTimestamp, 30 + getLength(rawFilename, rawExtraFieldAES));
		arraySet(localHeaderArray, rawExtraFieldNTFS, 30 + getLength(rawFilename, rawExtraFieldAES, rawExtraFieldExtendedTimestamp));
		arraySet(localHeaderArray, rawExtraField, 30 + getLength(rawFilename, rawExtraFieldAES, rawExtraFieldExtendedTimestamp, rawExtraFieldNTFS));
		return {
			localHeaderArray,
			headerArray,
			headerView,
			lastModDate,
			rawLastModDate,
			encrypted,
			compressed,
			version,
			compressionMethod,
			extraFieldExtendedTimestampFlag,
			rawExtraFieldExtendedTimestamp,
			rawExtraFieldNTFS,
			rawExtraFieldAES,
			extraFieldLength
		};
	}

	function appendExtraFieldUSDZ(entryInfo, zipWriterOffset) {
		const { headerInfo } = entryInfo;
		let { localHeaderArray, extraFieldLength } = headerInfo;
		let localHeaderArrayView = getDataView(localHeaderArray);
		let extraBytesLength = 64 - ((zipWriterOffset + localHeaderArray.length) % 64);
		if (extraBytesLength < 4) {
			extraBytesLength += 64;
		}
		const rawExtraFieldUSDZ = new Uint8Array$1(extraBytesLength);
		const extraFieldUSDZView = getDataView(rawExtraFieldUSDZ);
		setUint16(extraFieldUSDZView, 0, EXTRAFIELD_TYPE_USDZ);
		setUint16(extraFieldUSDZView, 2, extraBytesLength - 2);
		const previousLocalHeaderArray = localHeaderArray;
		headerInfo.localHeaderArray = localHeaderArray = new Uint8Array$1(previousLocalHeaderArray.length + extraBytesLength);
		arraySet(localHeaderArray, previousLocalHeaderArray);
		arraySet(localHeaderArray, rawExtraFieldUSDZ, previousLocalHeaderArray.length);
		localHeaderArrayView = getDataView(localHeaderArray);
		setUint16(localHeaderArrayView, 28, extraFieldLength + extraBytesLength);
		entryInfo.metadataSize += extraBytesLength;
	}

	function getDataDescriptorInfo(options) {
		const {
			zip64,
			dataDescriptor,
			dataDescriptorSignature
		} = options;
		let dataDescriptorArray = new Uint8Array$1();
		let dataDescriptorView, dataDescriptorOffset = 0;
		if (dataDescriptor) {
			dataDescriptorArray = new Uint8Array$1(zip64 ? (dataDescriptorSignature ? 24 : 20) : (dataDescriptorSignature ? 16 : 12));
			dataDescriptorView = getDataView(dataDescriptorArray);
			if (dataDescriptorSignature) {
				dataDescriptorOffset = 4;
				setUint32(dataDescriptorView, 0, DATA_DESCRIPTOR_RECORD_SIGNATURE);
			}
		}
		return {
			dataDescriptorArray,
			dataDescriptorView,
			dataDescriptorOffset
		};
	}

	function setEntryInfo(entryInfo, options) {
		const {
			signature,
			rawExtraFieldZip64,
			compressedSize,
			uncompressedSize,
			headerInfo,
			dataDescriptorInfo
		} = entryInfo;
		const {
			headerView,
			encrypted
		} = headerInfo;
		const {
			dataDescriptorView,
			dataDescriptorOffset
		} = dataDescriptorInfo;
		const {
			zip64,
			zip64UncompressedSize,
			zip64CompressedSize,
			zipCrypto,
			dataDescriptor
		} = options;
		if ((!encrypted || zipCrypto) && signature !== UNDEFINED_VALUE) {
			setUint32(headerView, 10, signature);
			if (dataDescriptor) {
				setUint32(dataDescriptorView, dataDescriptorOffset, signature);
			}
		}
		if (zip64) {
			const rawExtraFieldZip64View = getDataView(rawExtraFieldZip64);
			setUint16(rawExtraFieldZip64View, 0, EXTRAFIELD_TYPE_ZIP64);
			setUint16(rawExtraFieldZip64View, 2, rawExtraFieldZip64.length - 4);
			let rawExtraFieldZip64Offset = 4;
			if (zip64UncompressedSize) {
				setUint32(headerView, 18, MAX_32_BITS);
				setBigUint64(rawExtraFieldZip64View, rawExtraFieldZip64Offset, BigInt(uncompressedSize));
				rawExtraFieldZip64Offset += 8;
			}
			if (zip64CompressedSize) {
				setUint32(headerView, 14, MAX_32_BITS);
				setBigUint64(rawExtraFieldZip64View, rawExtraFieldZip64Offset, BigInt(compressedSize));
			}
			if (dataDescriptor) {
				setBigUint64(dataDescriptorView, dataDescriptorOffset + 4, BigInt(compressedSize));
				setBigUint64(dataDescriptorView, dataDescriptorOffset + 12, BigInt(uncompressedSize));
			}
		} else {
			setUint32(headerView, 14, compressedSize);
			setUint32(headerView, 18, uncompressedSize);
			if (dataDescriptor) {
				setUint32(dataDescriptorView, dataDescriptorOffset + 4, compressedSize);
				setUint32(dataDescriptorView, dataDescriptorOffset + 8, uncompressedSize);
			}
		}
	}

	async function writeExtraHeaderInfo(fileEntry, entryData, writable, { zipCrypto }) {
		let arrayBuffer;
		arrayBuffer = await entryData.slice(0, 26).arrayBuffer();
		if (arrayBuffer.byteLength != 26) {
			arrayBuffer = arrayBuffer.slice(0, 26);
		}
		const arrayBufferView = new DataView$1(arrayBuffer);
		if (!fileEntry.encrypted || zipCrypto) {
			setUint32(arrayBufferView, 14, fileEntry.signature);
		}
		if (fileEntry.zip64) {
			setUint32(arrayBufferView, 18, MAX_32_BITS);
			setUint32(arrayBufferView, 22, MAX_32_BITS);
		} else {
			setUint32(arrayBufferView, 18, fileEntry.compressedSize);
			setUint32(arrayBufferView, 22, fileEntry.uncompressedSize);
		}
		await writeData(writable, new Uint8Array$1(arrayBuffer));
		return entryData.slice(arrayBuffer.byteLength);
	}

	function setZip64ExtraInfo(fileEntry, options) {
		const { rawExtraFieldZip64, offset, diskNumberStart } = fileEntry;
		const { zip64UncompressedSize, zip64CompressedSize, zip64Offset, zip64DiskNumberStart } = options;
		const rawExtraFieldZip64View = getDataView(rawExtraFieldZip64);
		let rawExtraFieldZip64Offset = 4;
		if (zip64UncompressedSize) {
			rawExtraFieldZip64Offset += 8;
		}
		if (zip64CompressedSize) {
			rawExtraFieldZip64Offset += 8;
		}
		if (zip64Offset) {
			setBigUint64(rawExtraFieldZip64View, rawExtraFieldZip64Offset, BigInt(offset));
			rawExtraFieldZip64Offset += 8;
		}
		if (zip64DiskNumberStart) {
			setUint32(rawExtraFieldZip64View, rawExtraFieldZip64Offset, diskNumberStart);
		}
	}

	async function closeFile(zipWriter, comment, options) {
		const { files, writer } = zipWriter;
		const { diskOffset, writable } = writer;
		let { diskNumber } = writer;
		let offset = 0;
		let directoryDataLength = 0;
		let directoryOffset = zipWriter.offset - diskOffset;
		let filesLength = files.size;
		for (const [, fileEntry] of files) {
			const {
				rawFilename,
				rawExtraFieldZip64,
				rawExtraFieldAES,
				rawComment,
				rawExtraFieldNTFS,
				rawExtraField,
				extendedTimestamp,
				extraFieldExtendedTimestampFlag,
				lastModDate
			} = fileEntry;
			let rawExtraFieldTimestamp;
			if (extendedTimestamp) {
				rawExtraFieldTimestamp = new Uint8Array$1(9);
				const extraFieldExtendedTimestampView = getDataView(rawExtraFieldTimestamp);
				setUint16(extraFieldExtendedTimestampView, 0, EXTRAFIELD_TYPE_EXTENDED_TIMESTAMP);
				setUint16(extraFieldExtendedTimestampView, 2, 5);
				setUint8(extraFieldExtendedTimestampView, 4, extraFieldExtendedTimestampFlag);
				setUint32(extraFieldExtendedTimestampView, 5, Math$1.floor(lastModDate.getTime() / 1000));
			} else {
				rawExtraFieldTimestamp = new Uint8Array$1();
			}
			fileEntry.rawExtraFieldCDExtendedTimestamp = rawExtraFieldTimestamp;
			directoryDataLength += 46 +
				getLength(
					rawFilename,
					rawComment,
					rawExtraFieldZip64,
					rawExtraFieldAES,
					rawExtraFieldNTFS,
					rawExtraFieldTimestamp,
					rawExtraField);
		}
		const directoryArray = new Uint8Array$1(directoryDataLength);
		const directoryView = getDataView(directoryArray);
		await initStream(writer);
		let directoryDiskOffset = 0;
		for (const [indexFileEntry, fileEntry] of Array$1.from(files.values()).entries()) {
			const {
				offset: fileEntryOffset,
				rawFilename,
				rawExtraFieldZip64,
				rawExtraFieldAES,
				rawExtraFieldCDExtendedTimestamp,
				rawExtraFieldNTFS,
				rawExtraField,
				rawComment,
				versionMadeBy,
				headerArray,
				directory,
				zip64,
				zip64UncompressedSize,
				zip64CompressedSize,
				zip64DiskNumberStart,
				zip64Offset,
				msDosCompatible,
				internalFileAttribute,
				externalFileAttribute,
				diskNumberStart,
				uncompressedSize,
				compressedSize
			} = fileEntry;
			const extraFieldLength = getLength(rawExtraFieldZip64, rawExtraFieldAES, rawExtraFieldCDExtendedTimestamp, rawExtraFieldNTFS, rawExtraField);
			setUint32(directoryView, offset, CENTRAL_FILE_HEADER_SIGNATURE);
			setUint16(directoryView, offset + 4, versionMadeBy);
			const headerView = getDataView(headerArray);
			if (!zip64UncompressedSize) {
				setUint32(headerView, 18, uncompressedSize);
			}
			if (!zip64CompressedSize) {
				setUint32(headerView, 14, compressedSize);
			}
			arraySet(directoryArray, headerArray, offset + 6);
			setUint16(directoryView, offset + 30, extraFieldLength);
			setUint16(directoryView, offset + 32, getLength(rawComment));
			setUint16(directoryView, offset + 34, zip64 && zip64DiskNumberStart ? MAX_16_BITS : diskNumberStart);
			setUint16(directoryView, offset + 36, internalFileAttribute);
			if (externalFileAttribute) {
				setUint32(directoryView, offset + 38, externalFileAttribute);
			} else if (directory && msDosCompatible) {
				setUint8(directoryView, offset + 38, FILE_ATTR_MSDOS_DIR_MASK);
			}
			setUint32(directoryView, offset + 42, zip64 && zip64Offset ? MAX_32_BITS : fileEntryOffset);
			arraySet(directoryArray, rawFilename, offset + 46);
			arraySet(directoryArray, rawExtraFieldZip64, offset + 46 + getLength(rawFilename));
			arraySet(directoryArray, rawExtraFieldAES, offset + 46 + getLength(rawFilename, rawExtraFieldZip64));
			arraySet(directoryArray, rawExtraFieldCDExtendedTimestamp, offset + 46 + getLength(rawFilename, rawExtraFieldZip64, rawExtraFieldAES));
			arraySet(directoryArray, rawExtraFieldNTFS, offset + 46 + getLength(rawFilename, rawExtraFieldZip64, rawExtraFieldAES, rawExtraFieldCDExtendedTimestamp));
			arraySet(directoryArray, rawExtraField, offset + 46 + getLength(rawFilename, rawExtraFieldZip64, rawExtraFieldAES, rawExtraFieldCDExtendedTimestamp, rawExtraFieldNTFS));
			arraySet(directoryArray, rawComment, offset + 46 + getLength(rawFilename) + extraFieldLength);
			const directoryEntryLength = 46 + getLength(rawFilename, rawComment) + extraFieldLength;
			if (offset - directoryDiskOffset > writer.availableSize) {
				writer.availableSize = 0;
				await writeData(writable, directoryArray.slice(directoryDiskOffset, offset));
				directoryDiskOffset = offset;
			}
			offset += directoryEntryLength;
			if (options.onprogress) {
				try {
					await options.onprogress(indexFileEntry + 1, files.size, new Entry(fileEntry));
				} catch (_error) {
					// ignored
				}
			}
		}
		await writeData(writable, directoryDiskOffset ? directoryArray.slice(directoryDiskOffset) : directoryArray);
		let lastDiskNumber = writer.diskNumber;
		const { availableSize } = writer;
		if (availableSize < END_OF_CENTRAL_DIR_LENGTH) {
			lastDiskNumber++;
		}
		let zip64 = getOptionValue(zipWriter, options, "zip64");
		if (directoryOffset >= MAX_32_BITS || directoryDataLength >= MAX_32_BITS || filesLength >= MAX_16_BITS || lastDiskNumber >= MAX_16_BITS) {
			if (zip64 === false) {
				throw new Error$1(ERR_UNSUPPORTED_FORMAT);
			} else {
				zip64 = true;
			}
		}
		const endOfdirectoryArray = new Uint8Array$1(zip64 ? ZIP64_END_OF_CENTRAL_DIR_TOTAL_LENGTH : END_OF_CENTRAL_DIR_LENGTH);
		const endOfdirectoryView = getDataView(endOfdirectoryArray);
		offset = 0;
		if (zip64) {
			setUint32(endOfdirectoryView, 0, ZIP64_END_OF_CENTRAL_DIR_SIGNATURE);
			setBigUint64(endOfdirectoryView, 4, BigInt(44));
			setUint16(endOfdirectoryView, 12, 45);
			setUint16(endOfdirectoryView, 14, 45);
			setUint32(endOfdirectoryView, 16, lastDiskNumber);
			setUint32(endOfdirectoryView, 20, diskNumber);
			setBigUint64(endOfdirectoryView, 24, BigInt(filesLength));
			setBigUint64(endOfdirectoryView, 32, BigInt(filesLength));
			setBigUint64(endOfdirectoryView, 40, BigInt(directoryDataLength));
			setBigUint64(endOfdirectoryView, 48, BigInt(directoryOffset));
			setUint32(endOfdirectoryView, 56, ZIP64_END_OF_CENTRAL_DIR_LOCATOR_SIGNATURE);
			setBigUint64(endOfdirectoryView, 64, BigInt(directoryOffset) + BigInt(directoryDataLength));
			setUint32(endOfdirectoryView, 72, lastDiskNumber + 1);
			const supportZip64SplitFile = getOptionValue(zipWriter, options, "supportZip64SplitFile", true);
			if (supportZip64SplitFile) {
				lastDiskNumber = MAX_16_BITS;
				diskNumber = MAX_16_BITS;
			}
			filesLength = MAX_16_BITS;
			directoryOffset = MAX_32_BITS;
			directoryDataLength = MAX_32_BITS;
			offset += ZIP64_END_OF_CENTRAL_DIR_LENGTH + ZIP64_END_OF_CENTRAL_DIR_LOCATOR_LENGTH;
		}
		setUint32(endOfdirectoryView, offset, END_OF_CENTRAL_DIR_SIGNATURE);
		setUint16(endOfdirectoryView, offset + 4, lastDiskNumber);
		setUint16(endOfdirectoryView, offset + 6, diskNumber);
		setUint16(endOfdirectoryView, offset + 8, filesLength);
		setUint16(endOfdirectoryView, offset + 10, filesLength);
		setUint32(endOfdirectoryView, offset + 12, directoryDataLength);
		setUint32(endOfdirectoryView, offset + 16, directoryOffset);
		const commentLength = getLength(comment);
		if (commentLength) {
			if (commentLength <= MAX_16_BITS) {
				setUint16(endOfdirectoryView, offset + 20, commentLength);
			} else {
				throw new Error$1(ERR_INVALID_COMMENT);
			}
		}
		await writeData(writable, endOfdirectoryArray);
		if (commentLength) {
			await writeData(writable, comment);
		}
	}

	async function writeData(writable, array) {
		const streamWriter = writable.getWriter();
		await streamWriter.ready;
		writable.size += getLength(array);
		await streamWriter.write(array);
		streamWriter.releaseLock();
	}

	function getTimeNTFS(date) {
		if (date) {
			return ((BigInt(date.getTime()) + BigInt(11644473600000)) * BigInt(10000));
		}
	}

	function getOptionValue(zipWriter, options, name, defaultValue) {
		const result = options[name] === UNDEFINED_VALUE ? zipWriter.options[name] : options[name];
		return result === UNDEFINED_VALUE ? defaultValue : result;
	}

	function getMaximumCompressedSize(uncompressedSize) {
		return uncompressedSize + (5 * (Math$1.floor(uncompressedSize / 16383) + 1));
	}

	function setUint8(view, offset, value) {
		view.setUint8(offset, value);
	}

	function setUint16(view, offset, value) {
		view.setUint16(offset, value, true);
	}

	function setUint32(view, offset, value) {
		view.setUint32(offset, value, true);
	}

	function setBigUint64(view, offset, value) {
		view.setBigUint64(offset, value, true);
	}

	function arraySet(array, typedArray, offset) {
		array.set(typedArray, offset);
	}

	function getDataView(array) {
		return new DataView$1(array.buffer);
	}

	function getLength(...arrayLikes) {
		let result = 0;
		arrayLikes.forEach(arrayLike => arrayLike && (result += arrayLike.length));
		return result;
	}

	/*
	 Copyright (c) 2022 Gildas Lormeau. All rights reserved.

	 Redistribution and use in source and binary forms, with or without
	 modification, are permitted provided that the following conditions are met:

	 1. Redistributions of source code must retain the above copyright notice,
	 this list of conditions and the following disclaimer.

	 2. Redistributions in binary form must reproduce the above copyright 
	 notice, this list of conditions and the following disclaimer in 
	 the documentation and/or other materials provided with the distribution.

	 3. The names of the authors may not be used to endorse or promote products
	 derived from this software without specific prior written permission.

	 THIS SOFTWARE IS PROVIDED ''AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
	 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WA    RRANTIES OF MERCHANTABILITY AND
	 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
	 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
	 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
	 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
	 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
	 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
	 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
	 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	 */

	let baseURL;
	try {
		baseURL = (typeof document === 'undefined' && typeof location === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : typeof document === 'undefined' ? location.href : (document.currentScript && document.currentScript.src || new URL('single-file-extension-editor-helper.js', document.baseURI).href));
	} catch (_error) {
		// ignored
	}
	configure({ baseURL });
	e(configure);

	var zip$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		BlobReader: BlobReader,
		BlobWriter: BlobWriter,
		Data64URIReader: Data64URIReader,
		Data64URIWriter: Data64URIWriter,
		ERR_BAD_FORMAT: ERR_BAD_FORMAT,
		ERR_CENTRAL_DIRECTORY_NOT_FOUND: ERR_CENTRAL_DIRECTORY_NOT_FOUND,
		ERR_DUPLICATED_NAME: ERR_DUPLICATED_NAME,
		ERR_ENCRYPTED: ERR_ENCRYPTED,
		ERR_EOCDR_LOCATOR_ZIP64_NOT_FOUND: ERR_EOCDR_LOCATOR_ZIP64_NOT_FOUND,
		ERR_EOCDR_NOT_FOUND: ERR_EOCDR_NOT_FOUND,
		ERR_EOCDR_ZIP64_NOT_FOUND: ERR_EOCDR_ZIP64_NOT_FOUND,
		ERR_EXTRAFIELD_ZIP64_NOT_FOUND: ERR_EXTRAFIELD_ZIP64_NOT_FOUND,
		ERR_HTTP_RANGE: ERR_HTTP_RANGE,
		ERR_INVALID_COMMENT: ERR_INVALID_COMMENT,
		ERR_INVALID_ENCRYPTION_STRENGTH: ERR_INVALID_ENCRYPTION_STRENGTH,
		ERR_INVALID_ENTRY_COMMENT: ERR_INVALID_ENTRY_COMMENT,
		ERR_INVALID_ENTRY_NAME: ERR_INVALID_ENTRY_NAME,
		ERR_INVALID_EXTRAFIELD_DATA: ERR_INVALID_EXTRAFIELD_DATA,
		ERR_INVALID_EXTRAFIELD_TYPE: ERR_INVALID_EXTRAFIELD_TYPE,
		ERR_INVALID_PASSWORD: ERR_INVALID_PASSWORD,
		ERR_INVALID_SIGNATURE: ERR_INVALID_SIGNATURE,
		ERR_INVALID_VERSION: ERR_INVALID_VERSION,
		ERR_ITERATOR_COMPLETED_TOO_SOON: ERR_ITERATOR_COMPLETED_TOO_SOON,
		ERR_LOCAL_FILE_HEADER_NOT_FOUND: ERR_LOCAL_FILE_HEADER_NOT_FOUND,
		ERR_SPLIT_ZIP_FILE: ERR_SPLIT_ZIP_FILE,
		ERR_UNSUPPORTED_COMPRESSION: ERR_UNSUPPORTED_COMPRESSION,
		ERR_UNSUPPORTED_ENCRYPTION: ERR_UNSUPPORTED_ENCRYPTION,
		ERR_UNSUPPORTED_FORMAT: ERR_UNSUPPORTED_FORMAT,
		HttpRangeReader: HttpRangeReader,
		HttpReader: HttpReader,
		Reader: Reader,
		SplitDataReader: SplitDataReader,
		SplitDataWriter: SplitDataWriter,
		SplitZipReader: SplitZipReader,
		SplitZipWriter: SplitZipWriter,
		TextReader: TextReader,
		TextWriter: TextWriter,
		Uint8ArrayReader: Uint8ArrayReader,
		Uint8ArrayWriter: Uint8ArrayWriter,
		Writer: Writer,
		ZipReader: ZipReader,
		ZipWriter: ZipWriter,
		configure: configure,
		getMimeType: getMimeType,
		initReader: initReader,
		initShimAsyncCodec: initShimAsyncCodec,
		initStream: initStream,
		initWriter: initWriter,
		readUint8Array: readUint8Array,
		terminateWorkers: terminateWorkers
	});

	// dist/csstree.esm.js from https://github.com/csstree/csstree/tree/612cc5f2922b2304869497d165a0cc65257f7a8b

	/*
	 * Copyright (C) 2016-2022 by Roman Dvornov
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

	var rs=Object.create;var tr=Object.defineProperty;var ns=Object.getOwnPropertyDescriptor;var os=Object.getOwnPropertyNames;var is=Object.getPrototypeOf,as=Object.prototype.hasOwnProperty;var Oe=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports),b=(e,t)=>{for(var r in t)tr(e,r,{get:t[r],enumerable:!0});},ss=(e,t,r,n)=>{if(t&&typeof t=="object"||typeof t=="function")for(let o of os(t))!as.call(e,o)&&o!==r&&tr(e,o,{get:()=>t[o],enumerable:!(n=ns(t,o))||n.enumerable});return e};var ls=(e,t,r)=>(r=e!=null?rs(is(e)):{},ss(t||!e||!e.__esModule?tr(r,"default",{value:e,enumerable:!0}):r,e));var Jo=Oe(ur=>{var Zo="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");ur.encode=function(e){if(0<=e&&e<Zo.length)return Zo[e];throw new TypeError("Must be between 0 and 63: "+e)};ur.decode=function(e){var t=65,r=90,n=97,o=122,i=48,s=57,u=43,c=47,a=26,l=52;return t<=e&&e<=r?e-t:n<=e&&e<=o?e-n+a:i<=e&&e<=s?e-i+l:e==u?62:e==c?63:-1};});var oi=Oe(hr=>{var ei=Jo(),pr=5,ti=1<<pr,ri=ti-1,ni=ti;function ks(e){return e<0?(-e<<1)+1:(e<<1)+0}function ws(e){var t=(e&1)===1,r=e>>1;return t?-r:r}hr.encode=function(t){var r="",n,o=ks(t);do n=o&ri,o>>>=pr,o>0&&(n|=ni),r+=ei.encode(n);while(o>0);return r};hr.decode=function(t,r,n){var o=t.length,i=0,s=0,u,c;do{if(r>=o)throw new Error("Expected more digits in base 64 VLQ value.");if(c=ei.decode(t.charCodeAt(r++)),c===-1)throw new Error("Invalid base64 digit: "+t.charAt(r-1));u=!!(c&ni),c&=ri,i=i+(c<<s),s+=pr;}while(u);n.value=ws(i),n.rest=r;};});var Et=Oe(K=>{function vs(e,t,r){if(t in e)return e[t];if(arguments.length===3)return r;throw new Error('"'+t+'" is a required argument.')}K.getArg=vs;var ii=/^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/,Ss=/^data:.+\,.+$/;function nt(e){var t=e.match(ii);return t?{scheme:t[1],auth:t[2],host:t[3],port:t[4],path:t[5]}:null}K.urlParse=nt;function Ue(e){var t="";return e.scheme&&(t+=e.scheme+":"),t+="//",e.auth&&(t+=e.auth+"@"),e.host&&(t+=e.host),e.port&&(t+=":"+e.port),e.path&&(t+=e.path),t}K.urlGenerate=Ue;var Cs=32;function As(e){var t=[];return function(r){for(var n=0;n<t.length;n++)if(t[n].input===r){var o=t[0];return t[0]=t[n],t[n]=o,t[0].result}var i=e(r);return t.unshift({input:r,result:i}),t.length>Cs&&t.pop(),i}}var mr=As(function(t){var r=t,n=nt(t);if(n){if(!n.path)return t;r=n.path;}for(var o=K.isAbsolute(r),i=[],s=0,u=0;;)if(s=u,u=r.indexOf("/",s),u===-1){i.push(r.slice(s));break}else for(i.push(r.slice(s,u));u<r.length&&r[u]==="/";)u++;for(var c,a=0,u=i.length-1;u>=0;u--)c=i[u],c==="."?i.splice(u,1):c===".."?a++:a>0&&(c===""?(i.splice(u+1,a),a=0):(i.splice(u,2),a--));return r=i.join("/"),r===""&&(r=o?"/":"."),n?(n.path=r,Ue(n)):r});K.normalize=mr;function ai(e,t){e===""&&(e="."),t===""&&(t=".");var r=nt(t),n=nt(e);if(n&&(e=n.path||"/"),r&&!r.scheme)return n&&(r.scheme=n.scheme),Ue(r);if(r||t.match(Ss))return t;if(n&&!n.host&&!n.path)return n.host=t,Ue(n);var o=t.charAt(0)==="/"?t:mr(e.replace(/\/+$/,"")+"/"+t);return n?(n.path=o,Ue(n)):o}K.join=ai;K.isAbsolute=function(e){return e.charAt(0)==="/"||ii.test(e)};function Ts(e,t){e===""&&(e="."),e=e.replace(/\/$/,"");for(var r=0;t.indexOf(e+"/")!==0;){var n=e.lastIndexOf("/");if(n<0||(e=e.slice(0,n),e.match(/^([^\/]+:\/)?\/*$/)))return t;++r;}return Array(r+1).join("../")+t.substr(e.length+1)}K.relative=Ts;var si=function(){var e=Object.create(null);return !("__proto__"in e)}();function li(e){return e}function Es(e){return ci(e)?"$"+e:e}K.toSetString=si?li:Es;function Ls(e){return ci(e)?e.slice(1):e}K.fromSetString=si?li:Ls;function ci(e){if(!e)return !1;var t=e.length;if(t<9||e.charCodeAt(t-1)!==95||e.charCodeAt(t-2)!==95||e.charCodeAt(t-3)!==111||e.charCodeAt(t-4)!==116||e.charCodeAt(t-5)!==111||e.charCodeAt(t-6)!==114||e.charCodeAt(t-7)!==112||e.charCodeAt(t-8)!==95||e.charCodeAt(t-9)!==95)return !1;for(var r=t-10;r>=0;r--)if(e.charCodeAt(r)!==36)return !1;return !0}function Ps(e,t,r){var n=be(e.source,t.source);return n!==0||(n=e.originalLine-t.originalLine,n!==0)||(n=e.originalColumn-t.originalColumn,n!==0||r)||(n=e.generatedColumn-t.generatedColumn,n!==0)||(n=e.generatedLine-t.generatedLine,n!==0)?n:be(e.name,t.name)}K.compareByOriginalPositions=Ps;function Is(e,t,r){var n;return n=e.originalLine-t.originalLine,n!==0||(n=e.originalColumn-t.originalColumn,n!==0||r)||(n=e.generatedColumn-t.generatedColumn,n!==0)||(n=e.generatedLine-t.generatedLine,n!==0)?n:be(e.name,t.name)}K.compareByOriginalPositionsNoSource=Is;function Ds(e,t,r){var n=e.generatedLine-t.generatedLine;return n!==0||(n=e.generatedColumn-t.generatedColumn,n!==0||r)||(n=be(e.source,t.source),n!==0)||(n=e.originalLine-t.originalLine,n!==0)||(n=e.originalColumn-t.originalColumn,n!==0)?n:be(e.name,t.name)}K.compareByGeneratedPositionsDeflated=Ds;function Os(e,t,r){var n=e.generatedColumn-t.generatedColumn;return n!==0||r||(n=be(e.source,t.source),n!==0)||(n=e.originalLine-t.originalLine,n!==0)||(n=e.originalColumn-t.originalColumn,n!==0)?n:be(e.name,t.name)}K.compareByGeneratedPositionsDeflatedNoLine=Os;function be(e,t){return e===t?0:e===null?1:t===null?-1:e>t?1:-1}function Ns(e,t){var r=e.generatedLine-t.generatedLine;return r!==0||(r=e.generatedColumn-t.generatedColumn,r!==0)||(r=be(e.source,t.source),r!==0)||(r=e.originalLine-t.originalLine,r!==0)||(r=e.originalColumn-t.originalColumn,r!==0)?r:be(e.name,t.name)}K.compareByGeneratedPositionsInflated=Ns;function zs(e){return JSON.parse(e.replace(/^\)]}'[^\n]*\n/,""))}K.parseSourceMapInput=zs;function Ms(e,t,r){if(t=t||"",e&&(e[e.length-1]!=="/"&&t[0]!=="/"&&(e+="/"),t=e+t),r){var n=nt(r);if(!n)throw new Error("sourceMapURL could not be parsed");if(n.path){var o=n.path.lastIndexOf("/");o>=0&&(n.path=n.path.substring(0,o+1));}t=ai(Ue(n),t);}return mr(t)}K.computeSourceURL=Ms;});var pi=Oe(ui=>{var fr=Et(),dr=Object.prototype.hasOwnProperty,Le=typeof Map<"u";function xe(){this._array=[],this._set=Le?new Map:Object.create(null);}xe.fromArray=function(t,r){for(var n=new xe,o=0,i=t.length;o<i;o++)n.add(t[o],r);return n};xe.prototype.size=function(){return Le?this._set.size:Object.getOwnPropertyNames(this._set).length};xe.prototype.add=function(t,r){var n=Le?t:fr.toSetString(t),o=Le?this.has(t):dr.call(this._set,n),i=this._array.length;(!o||r)&&this._array.push(t),o||(Le?this._set.set(t,i):this._set[n]=i);};xe.prototype.has=function(t){if(Le)return this._set.has(t);var r=fr.toSetString(t);return dr.call(this._set,r)};xe.prototype.indexOf=function(t){if(Le){var r=this._set.get(t);if(r>=0)return r}else {var n=fr.toSetString(t);if(dr.call(this._set,n))return this._set[n]}throw new Error('"'+t+'" is not in the set.')};xe.prototype.at=function(t){if(t>=0&&t<this._array.length)return this._array[t];throw new Error("No element indexed by "+t)};xe.prototype.toArray=function(){return this._array.slice()};ui.ArraySet=xe;});var fi=Oe(mi=>{var hi=Et();function Rs(e,t){var r=e.generatedLine,n=t.generatedLine,o=e.generatedColumn,i=t.generatedColumn;return n>r||n==r&&i>=o||hi.compareByGeneratedPositionsInflated(e,t)<=0}function Lt(){this._array=[],this._sorted=!0,this._last={generatedLine:-1,generatedColumn:0};}Lt.prototype.unsortedForEach=function(t,r){this._array.forEach(t,r);};Lt.prototype.add=function(t){Rs(this._last,t)?(this._last=t,this._array.push(t)):(this._sorted=!1,this._array.push(t));};Lt.prototype.toArray=function(){return this._sorted||(this._array.sort(hi.compareByGeneratedPositionsInflated),this._sorted=!0),this._array};mi.MappingList=Lt;});var gi=Oe(di=>{var ot=oi(),q=Et(),Pt=pi().ArraySet,Fs=fi().MappingList;function oe(e){e||(e={}),this._file=q.getArg(e,"file",null),this._sourceRoot=q.getArg(e,"sourceRoot",null),this._skipValidation=q.getArg(e,"skipValidation",!1),this._sources=new Pt,this._names=new Pt,this._mappings=new Fs,this._sourcesContents=null;}oe.prototype._version=3;oe.fromSourceMap=function(t){var r=t.sourceRoot,n=new oe({file:t.file,sourceRoot:r});return t.eachMapping(function(o){var i={generated:{line:o.generatedLine,column:o.generatedColumn}};o.source!=null&&(i.source=o.source,r!=null&&(i.source=q.relative(r,i.source)),i.original={line:o.originalLine,column:o.originalColumn},o.name!=null&&(i.name=o.name)),n.addMapping(i);}),t.sources.forEach(function(o){var i=o;r!==null&&(i=q.relative(r,o)),n._sources.has(i)||n._sources.add(i);var s=t.sourceContentFor(o);s!=null&&n.setSourceContent(o,s);}),n};oe.prototype.addMapping=function(t){var r=q.getArg(t,"generated"),n=q.getArg(t,"original",null),o=q.getArg(t,"source",null),i=q.getArg(t,"name",null);this._skipValidation||this._validateMapping(r,n,o,i),o!=null&&(o=String(o),this._sources.has(o)||this._sources.add(o)),i!=null&&(i=String(i),this._names.has(i)||this._names.add(i)),this._mappings.add({generatedLine:r.line,generatedColumn:r.column,originalLine:n!=null&&n.line,originalColumn:n!=null&&n.column,source:o,name:i});};oe.prototype.setSourceContent=function(t,r){var n=t;this._sourceRoot!=null&&(n=q.relative(this._sourceRoot,n)),r!=null?(this._sourcesContents||(this._sourcesContents=Object.create(null)),this._sourcesContents[q.toSetString(n)]=r):this._sourcesContents&&(delete this._sourcesContents[q.toSetString(n)],Object.keys(this._sourcesContents).length===0&&(this._sourcesContents=null));};oe.prototype.applySourceMap=function(t,r,n){var o=r;if(r==null){if(t.file==null)throw new Error(`SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, or the source map's "file" property. Both were omitted.`);o=t.file;}var i=this._sourceRoot;i!=null&&(o=q.relative(i,o));var s=new Pt,u=new Pt;this._mappings.unsortedForEach(function(c){if(c.source===o&&c.originalLine!=null){var a=t.originalPositionFor({line:c.originalLine,column:c.originalColumn});a.source!=null&&(c.source=a.source,n!=null&&(c.source=q.join(n,c.source)),i!=null&&(c.source=q.relative(i,c.source)),c.originalLine=a.line,c.originalColumn=a.column,a.name!=null&&(c.name=a.name));}var l=c.source;l!=null&&!s.has(l)&&s.add(l);var p=c.name;p!=null&&!u.has(p)&&u.add(p);},this),this._sources=s,this._names=u,t.sources.forEach(function(c){var a=t.sourceContentFor(c);a!=null&&(n!=null&&(c=q.join(n,c)),i!=null&&(c=q.relative(i,c)),this.setSourceContent(c,a));},this);};oe.prototype._validateMapping=function(t,r,n,o){if(r&&typeof r.line!="number"&&typeof r.column!="number")throw new Error("original.line and original.column are not numbers -- you probably meant to omit the original mapping entirely and only map the generated position. If so, pass null for the original mapping instead of an object with empty or null values.");if(!(t&&"line"in t&&"column"in t&&t.line>0&&t.column>=0&&!r&&!n&&!o)){if(t&&"line"in t&&"column"in t&&r&&"line"in r&&"column"in r&&t.line>0&&t.column>=0&&r.line>0&&r.column>=0&&n)return;throw new Error("Invalid mapping: "+JSON.stringify({generated:t,source:n,original:r,name:o}))}};oe.prototype._serializeMappings=function(){for(var t=0,r=1,n=0,o=0,i=0,s=0,u="",c,a,l,p,m=this._mappings.toArray(),f=0,P=m.length;f<P;f++){if(a=m[f],c="",a.generatedLine!==r)for(t=0;a.generatedLine!==r;)c+=";",r++;else if(f>0){if(!q.compareByGeneratedPositionsInflated(a,m[f-1]))continue;c+=",";}c+=ot.encode(a.generatedColumn-t),t=a.generatedColumn,a.source!=null&&(p=this._sources.indexOf(a.source),c+=ot.encode(p-s),s=p,c+=ot.encode(a.originalLine-1-o),o=a.originalLine-1,c+=ot.encode(a.originalColumn-n),n=a.originalColumn,a.name!=null&&(l=this._names.indexOf(a.name),c+=ot.encode(l-i),i=l)),u+=c;}return u};oe.prototype._generateSourcesContent=function(t,r){return t.map(function(n){if(!this._sourcesContents)return null;r!=null&&(n=q.relative(r,n));var o=q.toSetString(n);return Object.prototype.hasOwnProperty.call(this._sourcesContents,o)?this._sourcesContents[o]:null},this)};oe.prototype.toJSON=function(){var t={version:this._version,sources:this._sources.toArray(),names:this._names.toArray(),mappings:this._serializeMappings()};return this._file!=null&&(t.file=this._file),this._sourceRoot!=null&&(t.sourceRoot=this._sourceRoot),this._sourcesContents&&(t.sourcesContent=this._generateSourcesContent(t.sources,t.sourceRoot)),t};oe.prototype.toString=function(){return JSON.stringify(this.toJSON())};di.SourceMapGenerator=oe;});var $e={};b($e,{AtKeyword:()=>I,BadString:()=>Ae,BadUrl:()=>Y,CDC:()=>j,CDO:()=>ue,Colon:()=>O,Comma:()=>G,Comment:()=>E,Delim:()=>g,Dimension:()=>y,EOF:()=>Xe,Function:()=>x,Hash:()=>v,Ident:()=>h,LeftCurlyBracket:()=>M,LeftParenthesis:()=>T,LeftSquareBracket:()=>U,Number:()=>d,Percentage:()=>A,RightCurlyBracket:()=>H,RightParenthesis:()=>w,RightSquareBracket:()=>V,Semicolon:()=>_,String:()=>W,Url:()=>F,WhiteSpace:()=>k});var Xe=0,h=1,x=2,I=3,v=4,W=5,Ae=6,F=7,Y=8,g=9,d=10,A=11,y=12,k=13,ue=14,j=15,O=16,_=17,G=18,U=19,V=20,T=21,w=22,M=23,H=24,E=25;function B(e){return e>=48&&e<=57}function ee(e){return B(e)||e>=65&&e<=70||e>=97&&e<=102}function yt(e){return e>=65&&e<=90}function cs(e){return e>=97&&e<=122}function us(e){return yt(e)||cs(e)}function ps(e){return e>=128}function xt(e){return us(e)||ps(e)||e===95}function Ne(e){return xt(e)||B(e)||e===45}function hs(e){return e>=0&&e<=8||e===11||e>=14&&e<=31||e===127}function Ze(e){return e===10||e===13||e===12}function pe(e){return Ze(e)||e===32||e===9}function $(e,t){return !(e!==92||Ze(t)||t===0)}function ze(e,t,r){return e===45?xt(t)||t===45||$(t,r):xt(e)?!0:e===92?$(e,t):!1}function kt(e,t,r){return e===43||e===45?B(t)?2:t===46&&B(r)?3:0:e===46?B(t)?2:0:B(e)?1:0}function wt(e){return e===65279||e===65534?1:0}var rr=new Array(128),ms=128,Je=130,nr=131,vt=132,or=133;for(let e=0;e<rr.length;e++)rr[e]=pe(e)&&Je||B(e)&&nr||xt(e)&&vt||hs(e)&&or||e||ms;function St(e){return e<128?rr[e]:vt}function Me(e,t){return t<e.length?e.charCodeAt(t):0}function Ct(e,t,r){return r===13&&Me(e,t+1)===10?2:1}function de(e,t,r){let n=e.charCodeAt(t);return yt(n)&&(n=n|32),n===r}function ge(e,t,r,n){if(r-t!==n.length||t<0||r>e.length)return !1;for(let o=t;o<r;o++){let i=n.charCodeAt(o-t),s=e.charCodeAt(o);if(yt(s)&&(s=s|32),s!==i)return !1}return !0}function Uo(e,t){for(;t>=0&&pe(e.charCodeAt(t));t--);return t+1}function et(e,t){for(;t<e.length&&pe(e.charCodeAt(t));t++);return t}function ir(e,t){for(;t<e.length&&B(e.charCodeAt(t));t++);return t}function se(e,t){if(t+=2,ee(Me(e,t-1))){for(let n=Math.min(e.length,t+5);t<n&&ee(Me(e,t));t++);let r=Me(e,t);pe(r)&&(t+=Ct(e,t,r));}return t}function tt(e,t){for(;t<e.length;t++){let r=e.charCodeAt(t);if(!Ne(r)){if($(r,Me(e,t+1))){t=se(e,t)-1;continue}break}}return t}function Te(e,t){let r=e.charCodeAt(t);if((r===43||r===45)&&(r=e.charCodeAt(t+=1)),B(r)&&(t=ir(e,t+1),r=e.charCodeAt(t)),r===46&&B(e.charCodeAt(t+1))&&(t+=2,t=ir(e,t)),de(e,t,101)){let n=0;r=e.charCodeAt(t+1),(r===45||r===43)&&(n=1,r=e.charCodeAt(t+2)),B(r)&&(t=ir(e,t+1+n+1));}return t}function At(e,t){for(;t<e.length;t++){let r=e.charCodeAt(t);if(r===41){t++;break}$(r,Me(e,t+1))&&(t=se(e,t));}return t}function Re(e){if(e.length===1&&!ee(e.charCodeAt(0)))return e[0];let t=parseInt(e,16);return (t===0||t>=55296&&t<=57343||t>1114111)&&(t=65533),String.fromCodePoint(t)}var Fe=["EOF-token","ident-token","function-token","at-keyword-token","hash-token","string-token","bad-string-token","url-token","bad-url-token","delim-token","number-token","percentage-token","dimension-token","whitespace-token","CDO-token","CDC-token","colon-token","semicolon-token","comma-token","[-token","]-token","(-token",")-token","{-token","}-token","comment-token"];function Be(e=null,t){return e===null||e.length<t?new Uint32Array(Math.max(t+1024,16384)):e}var jo=10,fs=12,qo=13;function Wo(e){let t=e.source,r=t.length,n=t.length>0?wt(t.charCodeAt(0)):0,o=Be(e.lines,r),i=Be(e.columns,r),s=e.startLine,u=e.startColumn;for(let c=n;c<r;c++){let a=t.charCodeAt(c);o[c]=s,i[c]=u++,(a===jo||a===qo||a===fs)&&(a===qo&&c+1<r&&t.charCodeAt(c+1)===jo&&(c++,o[c]=s,i[c]=u),s++,u=1);}o[r]=s,i[r]=u,e.lines=o,e.columns=i,e.computed=!0;}var Tt=class{constructor(){this.lines=null,this.columns=null,this.computed=!1;}setSource(t,r=0,n=1,o=1){this.source=t,this.startOffset=r,this.startLine=n,this.startColumn=o,this.computed=!1;}getLocation(t,r){return this.computed||Wo(this),{source:r,offset:this.startOffset+t,line:this.lines[t],column:this.columns[t]}}getLocationRange(t,r,n){return this.computed||Wo(this),{source:n,start:{offset:this.startOffset+t,line:this.lines[t],column:this.columns[t]},end:{offset:this.startOffset+r,line:this.lines[r],column:this.columns[r]}}}};var ne=16777215,we=24,ds=new Map([[2,22],[21,22],[19,20],[23,24]]),rt=class{constructor(t,r){this.setSource(t,r);}reset(){this.eof=!1,this.tokenIndex=-1,this.tokenType=0,this.tokenStart=this.firstCharOffset,this.tokenEnd=this.firstCharOffset;}setSource(t="",r=()=>{}){t=String(t||"");let n=t.length,o=Be(this.offsetAndType,t.length+1),i=Be(this.balance,t.length+1),s=0,u=0,c=0,a=-1;for(this.offsetAndType=null,this.balance=null,r(t,(l,p,m)=>{switch(l){default:i[s]=n;break;case u:{let f=c&ne;for(c=i[f],u=c>>we,i[s]=f,i[f++]=s;f<s;f++)i[f]===n&&(i[f]=s);break}case 21:case 2:case 19:case 23:i[s]=c,u=ds.get(l),c=u<<we|s;break}o[s++]=l<<we|m,a===-1&&(a=p);}),o[s]=0<<we|n,i[s]=n,i[n]=n;c!==0;){let l=c&ne;c=i[l],i[l]=n;}this.source=t,this.firstCharOffset=a===-1?0:a,this.tokenCount=s,this.offsetAndType=o,this.balance=i,this.reset(),this.next();}lookupType(t){return t+=this.tokenIndex,t<this.tokenCount?this.offsetAndType[t]>>we:0}lookupOffset(t){return t+=this.tokenIndex,t<this.tokenCount?this.offsetAndType[t-1]&ne:this.source.length}lookupValue(t,r){return t+=this.tokenIndex,t<this.tokenCount?ge(this.source,this.offsetAndType[t-1]&ne,this.offsetAndType[t]&ne,r):!1}getTokenStart(t){return t===this.tokenIndex?this.tokenStart:t>0?t<this.tokenCount?this.offsetAndType[t-1]&ne:this.offsetAndType[this.tokenCount]&ne:this.firstCharOffset}substrToCursor(t){return this.source.substring(t,this.tokenStart)}isBalanceEdge(t){return this.balance[this.tokenIndex]<t}isDelim(t,r){return r?this.lookupType(r)===9&&this.source.charCodeAt(this.lookupOffset(r))===t:this.tokenType===9&&this.source.charCodeAt(this.tokenStart)===t}skip(t){let r=this.tokenIndex+t;r<this.tokenCount?(this.tokenIndex=r,this.tokenStart=this.offsetAndType[r-1]&ne,r=this.offsetAndType[r],this.tokenType=r>>we,this.tokenEnd=r&ne):(this.tokenIndex=this.tokenCount,this.next());}next(){let t=this.tokenIndex+1;t<this.tokenCount?(this.tokenIndex=t,this.tokenStart=this.tokenEnd,t=this.offsetAndType[t],this.tokenType=t>>we,this.tokenEnd=t&ne):(this.eof=!0,this.tokenIndex=this.tokenCount,this.tokenType=0,this.tokenStart=this.tokenEnd=this.source.length);}skipSC(){for(;this.tokenType===13||this.tokenType===25;)this.next();}skipUntilBalanced(t,r){let n=t,o,i;e:for(;n<this.tokenCount;n++){if(o=this.balance[n],o<t)break e;switch(i=n>0?this.offsetAndType[n-1]&ne:this.firstCharOffset,r(this.source.charCodeAt(i))){case 1:break e;case 2:n++;break e;default:this.balance[o]===n&&(n=o);}}this.skip(n-this.tokenIndex);}forEachToken(t){for(let r=0,n=this.firstCharOffset;r<this.tokenCount;r++){let o=n,i=this.offsetAndType[r],s=i&ne,u=i>>we;n=s,t(u,o,s,r);}}dump(){let t=new Array(this.tokenCount);return this.forEachToken((r,n,o,i)=>{t[i]={idx:i,type:Fe[r],chunk:this.source.substring(n,o),balance:this.balance[i]};}),t}};function ve(e,t){function r(p){return p<u?e.charCodeAt(p):0}function n(){if(a=Te(e,a),ze(r(a),r(a+1),r(a+2))){l=12,a=tt(e,a);return}if(r(a)===37){l=11,a++;return}l=10;}function o(){let p=a;if(a=tt(e,a),ge(e,p,a,"url")&&r(a)===40){if(a=et(e,a+1),r(a)===34||r(a)===39){l=2,a=p+4;return}s();return}if(r(a)===40){l=2,a++;return}l=1;}function i(p){for(p||(p=r(a++)),l=5;a<e.length;a++){let m=e.charCodeAt(a);switch(St(m)){case p:a++;return;case Je:if(Ze(m)){a+=Ct(e,a,m),l=6;return}break;case 92:if(a===e.length-1)break;let f=r(a+1);Ze(f)?a+=Ct(e,a+1,f):$(m,f)&&(a=se(e,a)-1);break}}}function s(){for(l=7,a=et(e,a);a<e.length;a++){let p=e.charCodeAt(a);switch(St(p)){case 41:a++;return;case Je:if(a=et(e,a),r(a)===41||a>=e.length){a<e.length&&a++;return}a=At(e,a),l=8;return;case 34:case 39:case 40:case or:a=At(e,a),l=8;return;case 92:if($(p,r(a+1))){a=se(e,a)-1;break}a=At(e,a),l=8;return}}}e=String(e||"");let u=e.length,c=wt(r(0)),a=c,l;for(;a<u;){let p=e.charCodeAt(a);switch(St(p)){case Je:l=13,a=et(e,a+1);break;case 34:i();break;case 35:Ne(r(a+1))||$(r(a+1),r(a+2))?(l=4,a=tt(e,a+1)):(l=9,a++);break;case 39:i();break;case 40:l=21,a++;break;case 41:l=22,a++;break;case 43:kt(p,r(a+1),r(a+2))?n():(l=9,a++);break;case 44:l=18,a++;break;case 45:kt(p,r(a+1),r(a+2))?n():r(a+1)===45&&r(a+2)===62?(l=15,a=a+3):ze(p,r(a+1),r(a+2))?o():(l=9,a++);break;case 46:kt(p,r(a+1),r(a+2))?n():(l=9,a++);break;case 47:r(a+1)===42?(l=25,a=e.indexOf("*/",a+2),a=a===-1?e.length:a+2):(l=9,a++);break;case 58:l=16,a++;break;case 59:l=17,a++;break;case 60:r(a+1)===33&&r(a+2)===45&&r(a+3)===45?(l=14,a=a+4):(l=9,a++);break;case 64:ze(r(a+1),r(a+2),r(a+3))?(l=3,a=tt(e,a+1)):(l=9,a++);break;case 91:l=19,a++;break;case 92:$(p,r(a+1))?o():(l=9,a++);break;case 93:l=20,a++;break;case 123:l=23,a++;break;case 125:l=24,a++;break;case nr:n();break;case vt:o();break;default:l=9,a++;}t(l,c,c=a);}}var _e=null,D=class{static createItem(t){return {prev:null,next:null,data:t}}constructor(){this.head=null,this.tail=null,this.cursor=null;}createItem(t){return D.createItem(t)}allocateCursor(t,r){let n;return _e!==null?(n=_e,_e=_e.cursor,n.prev=t,n.next=r,n.cursor=this.cursor):n={prev:t,next:r,cursor:this.cursor},this.cursor=n,n}releaseCursor(){let{cursor:t}=this;this.cursor=t.cursor,t.prev=null,t.next=null,t.cursor=_e,_e=t;}updateCursors(t,r,n,o){let{cursor:i}=this;for(;i!==null;)i.prev===t&&(i.prev=r),i.next===n&&(i.next=o),i=i.cursor;}*[Symbol.iterator](){for(let t=this.head;t!==null;t=t.next)yield t.data;}get size(){let t=0;for(let r=this.head;r!==null;r=r.next)t++;return t}get isEmpty(){return this.head===null}get first(){return this.head&&this.head.data}get last(){return this.tail&&this.tail.data}fromArray(t){let r=null;this.head=null;for(let n of t){let o=D.createItem(n);r!==null?r.next=o:this.head=o,o.prev=r,r=o;}return this.tail=r,this}toArray(){return [...this]}toJSON(){return [...this]}forEach(t,r=this){let n=this.allocateCursor(null,this.head);for(;n.next!==null;){let o=n.next;n.next=o.next,t.call(r,o.data,o,this);}this.releaseCursor();}forEachRight(t,r=this){let n=this.allocateCursor(this.tail,null);for(;n.prev!==null;){let o=n.prev;n.prev=o.prev,t.call(r,o.data,o,this);}this.releaseCursor();}reduce(t,r,n=this){let o=this.allocateCursor(null,this.head),i=r,s;for(;o.next!==null;)s=o.next,o.next=s.next,i=t.call(n,i,s.data,s,this);return this.releaseCursor(),i}reduceRight(t,r,n=this){let o=this.allocateCursor(this.tail,null),i=r,s;for(;o.prev!==null;)s=o.prev,o.prev=s.prev,i=t.call(n,i,s.data,s,this);return this.releaseCursor(),i}some(t,r=this){for(let n=this.head;n!==null;n=n.next)if(t.call(r,n.data,n,this))return !0;return !1}map(t,r=this){let n=new D;for(let o=this.head;o!==null;o=o.next)n.appendData(t.call(r,o.data,o,this));return n}filter(t,r=this){let n=new D;for(let o=this.head;o!==null;o=o.next)t.call(r,o.data,o,this)&&n.appendData(o.data);return n}nextUntil(t,r,n=this){if(t===null)return;let o=this.allocateCursor(null,t);for(;o.next!==null;){let i=o.next;if(o.next=i.next,r.call(n,i.data,i,this))break}this.releaseCursor();}prevUntil(t,r,n=this){if(t===null)return;let o=this.allocateCursor(t,null);for(;o.prev!==null;){let i=o.prev;if(o.prev=i.prev,r.call(n,i.data,i,this))break}this.releaseCursor();}clear(){this.head=null,this.tail=null;}copy(){let t=new D;for(let r of this)t.appendData(r);return t}prepend(t){return this.updateCursors(null,t,this.head,t),this.head!==null?(this.head.prev=t,t.next=this.head):this.tail=t,this.head=t,this}prependData(t){return this.prepend(D.createItem(t))}append(t){return this.insert(t)}appendData(t){return this.insert(D.createItem(t))}insert(t,r=null){if(r!==null)if(this.updateCursors(r.prev,t,r,t),r.prev===null){if(this.head!==r)throw new Error("before doesn't belong to list");this.head=t,r.prev=t,t.next=r,this.updateCursors(null,t);}else r.prev.next=t,t.prev=r.prev,r.prev=t,t.next=r;else this.updateCursors(this.tail,t,null,t),this.tail!==null?(this.tail.next=t,t.prev=this.tail):this.head=t,this.tail=t;return this}insertData(t,r){return this.insert(D.createItem(t),r)}remove(t){if(this.updateCursors(t,t.prev,t,t.next),t.prev!==null)t.prev.next=t.next;else {if(this.head!==t)throw new Error("item doesn't belong to list");this.head=t.next;}if(t.next!==null)t.next.prev=t.prev;else {if(this.tail!==t)throw new Error("item doesn't belong to list");this.tail=t.prev;}return t.prev=null,t.next=null,t}push(t){this.insert(D.createItem(t));}pop(){return this.tail!==null?this.remove(this.tail):null}unshift(t){this.prepend(D.createItem(t));}shift(){return this.head!==null?this.remove(this.head):null}prependList(t){return this.insertList(t,this.head)}appendList(t){return this.insertList(t)}insertList(t,r){return t.head===null?this:(r!=null?(this.updateCursors(r.prev,t.tail,r,t.head),r.prev!==null?(r.prev.next=t.head,t.head.prev=r.prev):this.head=t.head,r.prev=t.tail,t.tail.next=r):(this.updateCursors(this.tail,t.tail,null,t.head),this.tail!==null?(this.tail.next=t.head,t.head.prev=this.tail):this.head=t.head,this.tail=t.tail),t.head=null,t.tail=null,this)}replace(t,r){"head"in r?this.insertList(r,t):this.insert(r,t),this.remove(t);}};function Ee(e,t){let r=Object.create(SyntaxError.prototype),n=new Error;return Object.assign(r,{name:e,message:t,get stack(){return (n.stack||"").replace(/^(.+\n){1,3}/,`${e}: ${t}
`)}})}var ar=100,Ho=60,Yo="    ";function Go({source:e,line:t,column:r},n){function o(l,p){return i.slice(l,p).map((m,f)=>String(l+f+1).padStart(c)+" |"+m).join(`
`)}let i=e.split(/\r\n?|\n|\f/),s=Math.max(1,t-n)-1,u=Math.min(t+n,i.length+1),c=Math.max(4,String(u).length)+1,a=0;r+=(Yo.length-1)*(i[t-1].substr(0,r-1).match(/\t/g)||[]).length,r>ar&&(a=r-Ho+3,r=Ho-2);for(let l=s;l<=u;l++)l>=0&&l<i.length&&(i[l]=i[l].replace(/\t/g,Yo),i[l]=(a>0&&i[l].length>a?"\u2026":"")+i[l].substr(a,ar-2)+(i[l].length>a+ar-1?"\u2026":""));return [o(s,t),new Array(r+c+2).join("-")+"^",o(t,u)].filter(Boolean).join(`
`)}function sr(e,t,r,n,o){return Object.assign(Ee("SyntaxError",e),{source:t,offset:r,line:n,column:o,sourceFragment(s){return Go({source:t,line:n,column:o},isNaN(s)?0:s)},get formattedMessage(){return `Parse error: ${e}
`+Go({source:t,line:n,column:o},2)}})}function Vo(e){let t=this.createList(),r=!1,n={recognizer:e};for(;!this.eof;){switch(this.tokenType){case 25:this.next();continue;case 13:r=!0,this.next();continue}let o=e.getNode.call(this,n);if(o===void 0)break;r&&(e.onWhiteSpace&&e.onWhiteSpace.call(this,o,t,n),r=!1),t.push(o);}return r&&e.onWhiteSpace&&e.onWhiteSpace.call(this,null,t,n),t}var Ko=()=>{},gs=33,bs=35,lr=59,Qo=123,Xo=0;function xs(e){return function(){return this[e]()}}function cr(e){let t=Object.create(null);for(let r in e){let n=e[r],o=n.parse||n;o&&(t[r]=o);}return t}function ys(e){let t={context:Object.create(null),scope:Object.assign(Object.create(null),e.scope),atrule:cr(e.atrule),pseudo:cr(e.pseudo),node:cr(e.node)};for(let r in e.parseContext)switch(typeof e.parseContext[r]){case"function":t.context[r]=e.parseContext[r];break;case"string":t.context[r]=xs(e.parseContext[r]);break}return {config:t,...t,...t.node}}function $o(e){let t="",r="<unknown>",n=!1,o=Ko,i=!1,s=new Tt,u=Object.assign(new rt,ys(e||{}),{parseAtrulePrelude:!0,parseRulePrelude:!0,parseValue:!0,parseCustomProperty:!1,readSequence:Vo,consumeUntilBalanceEnd:()=>0,consumeUntilLeftCurlyBracket(a){return a===Qo?1:0},consumeUntilLeftCurlyBracketOrSemicolon(a){return a===Qo||a===lr?1:0},consumeUntilExclamationMarkOrSemicolon(a){return a===gs||a===lr?1:0},consumeUntilSemicolonIncluded(a){return a===lr?2:0},createList(){return new D},createSingleNodeList(a){return new D().appendData(a)},getFirstListNode(a){return a&&a.first},getLastListNode(a){return a&&a.last},parseWithFallback(a,l){let p=this.tokenIndex;try{return a.call(this)}catch(m){if(i)throw m;let f=l.call(this,p);return i=!0,o(m,f),i=!1,f}},lookupNonWSType(a){let l;do if(l=this.lookupType(a++),l!==13)return l;while(l!==Xo);return Xo},charCodeAt(a){return a>=0&&a<t.length?t.charCodeAt(a):0},substring(a,l){return t.substring(a,l)},substrToCursor(a){return this.source.substring(a,this.tokenStart)},cmpChar(a,l){return de(t,a,l)},cmpStr(a,l,p){return ge(t,a,l,p)},consume(a){let l=this.tokenStart;return this.eat(a),this.substrToCursor(l)},consumeFunctionName(){let a=t.substring(this.tokenStart,this.tokenEnd-1);return this.eat(2),a},consumeNumber(a){let l=t.substring(this.tokenStart,Te(t,this.tokenStart));return this.eat(a),l},eat(a){if(this.tokenType!==a){let l=Fe[a].slice(0,-6).replace(/-/g," ").replace(/^./,f=>f.toUpperCase()),p=`${/[[\](){}]/.test(l)?`"${l}"`:l} is expected`,m=this.tokenStart;switch(a){case 1:this.tokenType===2||this.tokenType===7?(m=this.tokenEnd-1,p="Identifier is expected but function found"):p="Identifier is expected";break;case 4:this.isDelim(bs)&&(this.next(),m++,p="Name is expected");break;case 11:this.tokenType===10&&(m=this.tokenEnd,p="Percent sign is expected");break}this.error(p,m);}this.next();},eatIdent(a){(this.tokenType!==1||this.lookupValue(0,a)===!1)&&this.error(`Identifier "${a}" is expected`),this.next();},eatDelim(a){this.isDelim(a)||this.error(`Delim "${String.fromCharCode(a)}" is expected`),this.next();},getLocation(a,l){return n?s.getLocationRange(a,l,r):null},getLocationFromList(a){if(n){let l=this.getFirstListNode(a),p=this.getLastListNode(a);return s.getLocationRange(l!==null?l.loc.start.offset-s.startOffset:this.tokenStart,p!==null?p.loc.end.offset-s.startOffset:this.tokenStart,r)}return null},error(a,l){let p=typeof l<"u"&&l<t.length?s.getLocation(l):this.eof?s.getLocation(Uo(t,t.length-1)):s.getLocation(this.tokenStart);throw new sr(a||"Unexpected input",t,p.offset,p.line,p.column)}});return Object.assign(function(a,l){t=a,l=l||{},u.setSource(t,ve),s.setSource(t,l.offset,l.line,l.column),r=l.filename||"<unknown>",n=Boolean(l.positions),o=typeof l.onParseError=="function"?l.onParseError:Ko,i=!1,u.parseAtrulePrelude="parseAtrulePrelude"in l?Boolean(l.parseAtrulePrelude):!0,u.parseRulePrelude="parseRulePrelude"in l?Boolean(l.parseRulePrelude):!0,u.parseValue="parseValue"in l?Boolean(l.parseValue):!0,u.parseCustomProperty="parseCustomProperty"in l?Boolean(l.parseCustomProperty):!1;let{context:p="default",onComment:m}=l;if(!(p in u.context))throw new Error("Unknown context `"+p+"`");typeof m=="function"&&u.forEachToken((P,te,X)=>{if(P===25){let S=u.getLocation(te,X),R=ge(t,X-2,X,"*/")?t.slice(te+2,X-2):t.slice(te+2,X);m(R,S);}});let f=u.context[p].call(u,l);return u.eof||u.error(),f},{SyntaxError:sr,config:u.config})}var xi=ls(gi(),1),bi=new Set(["Atrule","Selector","Declaration"]);function yi(e){let t=new xi.SourceMapGenerator,r={line:1,column:0},n={line:0,column:0},o={line:1,column:0},i={generated:o},s=1,u=0,c=!1,a=e.node;e.node=function(m){if(m.loc&&m.loc.start&&bi.has(m.type)){let f=m.loc.start.line,P=m.loc.start.column-1;(n.line!==f||n.column!==P)&&(n.line=f,n.column=P,r.line=s,r.column=u,c&&(c=!1,(r.line!==o.line||r.column!==o.column)&&t.addMapping(i)),c=!0,t.addMapping({source:m.loc.source,original:n,generated:r}));}a.call(this,m),c&&bi.has(m.type)&&(o.line=s,o.column=u);};let l=e.emit;e.emit=function(m,f,P){for(let te=0;te<m.length;te++)m.charCodeAt(te)===10?(s++,u=0):u++;l(m,f,P);};let p=e.result;return e.result=function(){return c&&t.addMapping(i),{css:p(),map:t}},e}var It={};b(It,{safe:()=>br,spec:()=>js});var Bs=43,_s=45,gr=(e,t)=>{if(e===9&&(e=t),typeof e=="string"){let r=e.charCodeAt(0);return r>127?32768:r<<8}return e},ki=[[1,1],[1,2],[1,7],[1,8],[1,"-"],[1,10],[1,11],[1,12],[1,15],[1,21],[3,1],[3,2],[3,7],[3,8],[3,"-"],[3,10],[3,11],[3,12],[3,15],[4,1],[4,2],[4,7],[4,8],[4,"-"],[4,10],[4,11],[4,12],[4,15],[12,1],[12,2],[12,7],[12,8],[12,"-"],[12,10],[12,11],[12,12],[12,15],["#",1],["#",2],["#",7],["#",8],["#","-"],["#",10],["#",11],["#",12],["#",15],["-",1],["-",2],["-",7],["-",8],["-","-"],["-",10],["-",11],["-",12],["-",15],[10,1],[10,2],[10,7],[10,8],[10,10],[10,11],[10,12],[10,"%"],[10,15],["@",1],["@",2],["@",7],["@",8],["@","-"],["@",15],[".",10],[".",11],[".",12],["+",10],["+",11],["+",12],["/","*"]],Us=ki.concat([[1,4],[12,4],[4,4],[3,21],[3,5],[3,16],[11,11],[11,12],[11,2],[11,"-"],[22,1],[22,2],[22,11],[22,12],[22,4],[22,"-"]]);function wi(e){let t=new Set(e.map(([r,n])=>gr(r)<<16|gr(n)));return function(r,n,o){let i=gr(n,o),s=o.charCodeAt(0);return (s===_s&&n!==1&&n!==2&&n!==15||s===Bs?t.has(r<<16|s<<8):t.has(r<<16|i))&&this.emit(" ",13,!0),i}}var js=wi(ki),br=wi(Us);var qs=92;function Ws(e,t){if(typeof t=="function"){let r=null;e.children.forEach(n=>{r!==null&&t.call(this,r),this.node(n),r=n;});return}e.children.forEach(this.node,this);}function Hs(e){ve(e,(t,r,n)=>{this.token(t,e.slice(r,n));});}function vi(e){let t=new Map;for(let r in e.node){let n=e.node[r];typeof(n.generate||n)=="function"&&t.set(r,n.generate||n);}return function(r,n){let o="",i=0,s={node(c){if(t.has(c.type))t.get(c.type).call(u,c);else throw new Error("Unknown node type: "+c.type)},tokenBefore:br,token(c,a){i=this.tokenBefore(i,c,a),this.emit(a,c,!1),c===9&&a.charCodeAt(0)===qs&&this.emit(`
`,13,!0);},emit(c){o+=c;},result(){return o}};n&&(typeof n.decorator=="function"&&(s=n.decorator(s)),n.sourceMap&&(s=yi(s)),n.mode in It&&(s.tokenBefore=It[n.mode]));let u={node:c=>s.node(c),children:Ws,token:(c,a)=>s.token(c,a),tokenize:Hs};return s.node(r),s.result()}}function Si(e){return {fromPlainObject(t){return e(t,{enter(r){r.children&&!(r.children instanceof D)&&(r.children=new D().fromArray(r.children));}}),t},toPlainObject(t){return e(t,{leave(r){r.children&&r.children instanceof D&&(r.children=r.children.toArray());}}),t}}}var{hasOwnProperty:xr}=Object.prototype,it=function(){};function Ci(e){return typeof e=="function"?e:it}function Ai(e,t){return function(r,n,o){r.type===t&&e.call(this,r,n,o);}}function Ys(e,t){let r=t.structure,n=[];for(let o in r){if(xr.call(r,o)===!1)continue;let i=r[o],s={name:o,type:!1,nullable:!1};Array.isArray(i)||(i=[i]);for(let u of i)u===null?s.nullable=!0:typeof u=="string"?s.type="node":Array.isArray(u)&&(s.type="list");s.type&&n.push(s);}return n.length?{context:t.walkContext,fields:n}:null}function Gs(e){let t={};for(let r in e.node)if(xr.call(e.node,r)){let n=e.node[r];if(!n.structure)throw new Error("Missed `structure` field in `"+r+"` node type definition");t[r]=Ys(r,n);}return t}function Ti(e,t){let r=e.fields.slice(),n=e.context,o=typeof n=="string";return t&&r.reverse(),function(i,s,u,c){let a;o&&(a=s[n],s[n]=i);for(let l of r){let p=i[l.name];if(!l.nullable||p){if(l.type==="list"){if(t?p.reduceRight(c,!1):p.reduce(c,!1))return !0}else if(u(p))return !0}}o&&(s[n]=a);}}function Ei({StyleSheet:e,Atrule:t,Rule:r,Block:n,DeclarationList:o}){return {Atrule:{StyleSheet:e,Atrule:t,Rule:r,Block:n},Rule:{StyleSheet:e,Atrule:t,Rule:r,Block:n},Declaration:{StyleSheet:e,Atrule:t,Rule:r,Block:n,DeclarationList:o}}}function Li(e){let t=Gs(e),r={},n={},o=Symbol("break-walk"),i=Symbol("skip-node");for(let a in t)xr.call(t,a)&&t[a]!==null&&(r[a]=Ti(t[a],!1),n[a]=Ti(t[a],!0));let s=Ei(r),u=Ei(n),c=function(a,l){function p(S,R,ke){let z=m.call(X,S,R,ke);return z===o?!0:z===i?!1:!!(P.hasOwnProperty(S.type)&&P[S.type](S,X,p,te)||f.call(X,S,R,ke)===o)}let m=it,f=it,P=r,te=(S,R,ke,z)=>S||p(R,ke,z),X={break:o,skip:i,root:a,stylesheet:null,atrule:null,atrulePrelude:null,rule:null,selector:null,block:null,declaration:null,function:null};if(typeof l=="function")m=l;else if(l&&(m=Ci(l.enter),f=Ci(l.leave),l.reverse&&(P=n),l.visit)){if(s.hasOwnProperty(l.visit))P=l.reverse?u[l.visit]:s[l.visit];else if(!t.hasOwnProperty(l.visit))throw new Error("Bad value `"+l.visit+"` for `visit` option (should be: "+Object.keys(t).sort().join(", ")+")");m=Ai(m,l.visit),f=Ai(f,l.visit);}if(m===it&&f===it)throw new Error("Neither `enter` nor `leave` walker handler is set or both aren't a function");p(a);};return c.break=o,c.skip=i,c.find=function(a,l){let p=null;return c(a,function(m,f,P){if(l.call(this,m,f,P))return p=m,o}),p},c.findLast=function(a,l){let p=null;return c(a,{reverse:!0,enter(m,f,P){if(l.call(this,m,f,P))return p=m,o}}),p},c.findAll=function(a,l){let p=[];return c(a,function(m,f,P){l.call(this,m,f,P)&&p.push(m);}),p},c}function Vs(e){return e}function Ks(e){let{min:t,max:r,comma:n}=e;return t===0&&r===0?n?"#?":"*":t===0&&r===1?"?":t===1&&r===0?n?"#":"+":t===1&&r===1?"":(n?"#":"")+(t===r?"{"+t+"}":"{"+t+","+(r!==0?r:"")+"}")}function Qs(e){switch(e.type){case"Range":return " ["+(e.min===null?"-\u221E":e.min)+","+(e.max===null?"\u221E":e.max)+"]";default:throw new Error("Unknown node type `"+e.type+"`")}}function Xs(e,t,r,n){let o=e.combinator===" "||n?e.combinator:" "+e.combinator+" ",i=e.terms.map(s=>yr(s,t,r,n)).join(o);return e.explicit||r?(n||i[0]===","?"[":"[ ")+i+(n?"]":" ]"):i}function yr(e,t,r,n){let o;switch(e.type){case"Group":o=Xs(e,t,r,n)+(e.disallowEmpty?"!":"");break;case"Multiplier":return yr(e.term,t,r,n)+t(Ks(e),e);case"Type":o="<"+e.name+(e.opts?t(Qs(e.opts),e.opts):"")+">";break;case"Property":o="<'"+e.name+"'>";break;case"Keyword":o=e.name;break;case"AtKeyword":o="@"+e.name;break;case"Function":o=e.name+"(";break;case"String":case"Token":o=e.value;break;case"Comma":o=",";break;default:throw new Error("Unknown node type `"+e.type+"`")}return t(o,e)}function Pe(e,t){let r=Vs,n=!1,o=!1;return typeof t=="function"?r=t:t&&(n=Boolean(t.forceBraces),o=Boolean(t.compact),typeof t.decorate=="function"&&(r=t.decorate)),yr(e,r,n,o)}var Pi={offset:0,line:1,column:1};function $s(e,t){let r=e.tokens,n=e.longestMatch,o=n<r.length&&r[n].node||null,i=o!==t?o:null,s=0,u=0,c=0,a="",l,p;for(let m=0;m<r.length;m++){let f=r[m].value;m===n&&(u=f.length,s=a.length),i!==null&&r[m].node===i&&(m<=n?c++:c=0),a+=f;}return n===r.length||c>1?(l=Dt(i||t,"end")||at(Pi,a),p=at(l)):(l=Dt(i,"start")||at(Dt(t,"start")||Pi,a.slice(0,s)),p=Dt(i,"end")||at(l,a.substr(s,u))),{css:a,mismatchOffset:s,mismatchLength:u,start:l,end:p}}function Dt(e,t){let r=e&&e.loc&&e.loc[t];return r?"line"in r?at(r):r:null}function at({offset:e,line:t,column:r},n){let o={offset:e,line:t,column:r};if(n){let i=n.split(/\n|\r\n?|\f/);o.offset+=n.length,o.line+=i.length-1,o.column=i.length===1?o.column+n.length:i.pop().length+1;}return o}var je=function(e,t){let r=Ee("SyntaxReferenceError",e+(t?" `"+t+"`":""));return r.reference=t,r},Ii=function(e,t,r,n){let o=Ee("SyntaxMatchError",e),{css:i,mismatchOffset:s,mismatchLength:u,start:c,end:a}=$s(n,r);return o.rawMessage=e,o.syntax=t?Pe(t):"<generic>",o.css=i,o.mismatchOffset=s,o.mismatchLength=u,o.message=e+`
  syntax: `+o.syntax+`
   value: `+(i||"<empty string>")+`
  --------`+new Array(o.mismatchOffset+1).join("-")+"^",Object.assign(o,c),o.loc={source:r&&r.loc&&r.loc.source||"<unknown>",start:c,end:a},o};var Ot=new Map,qe=new Map,Nt=45,zt=Zs,kr=Js;function Mt(e,t){return t=t||0,e.length-t>=2&&e.charCodeAt(t)===Nt&&e.charCodeAt(t+1)===Nt}function wr(e,t){if(t=t||0,e.length-t>=3&&e.charCodeAt(t)===Nt&&e.charCodeAt(t+1)!==Nt){let r=e.indexOf("-",t+2);if(r!==-1)return e.substring(t,r+1)}return ""}function Zs(e){if(Ot.has(e))return Ot.get(e);let t=e.toLowerCase(),r=Ot.get(t);if(r===void 0){let n=Mt(t,0),o=n?"":wr(t,0);r=Object.freeze({basename:t.substr(o.length),name:t,prefix:o,vendor:o,custom:n});}return Ot.set(e,r),r}function Js(e){if(qe.has(e))return qe.get(e);let t=e,r=e[0];r==="/"?r=e[1]==="/"?"//":"/":r!=="_"&&r!=="*"&&r!=="$"&&r!=="#"&&r!=="+"&&r!=="&"&&(r="");let n=Mt(t,r.length);if(!n&&(t=t.toLowerCase(),qe.has(t))){let u=qe.get(t);return qe.set(e,u),u}let o=n?"":wr(t,r.length),i=t.substr(0,r.length+o.length),s=Object.freeze({basename:t.substr(i.length),name:t.substr(r.length),hack:r,vendor:o,prefix:i,custom:n});return qe.set(e,s),s}var Rt=["initial","inherit","unset","revert","revert-layer"];var lt=43,he=45,vr=110,We=!0,tl=!1;function Cr(e,t){return e!==null&&e.type===9&&e.value.charCodeAt(0)===t}function st(e,t,r){for(;e!==null&&(e.type===13||e.type===25);)e=r(++t);return t}function Se(e,t,r,n){if(!e)return 0;let o=e.value.charCodeAt(t);if(o===lt||o===he){if(r)return 0;t++;}for(;t<e.value.length;t++)if(!B(e.value.charCodeAt(t)))return 0;return n+1}function Sr(e,t,r){let n=!1,o=st(e,t,r);if(e=r(o),e===null)return t;if(e.type!==10)if(Cr(e,lt)||Cr(e,he)){if(n=!0,o=st(r(++o),o,r),e=r(o),e===null||e.type!==10)return 0}else return t;if(!n){let i=e.value.charCodeAt(0);if(i!==lt&&i!==he)return 0}return Se(e,n?0:1,n,o)}function Ar(e,t){let r=0;if(!e)return 0;if(e.type===10)return Se(e,0,tl,r);if(e.type===1&&e.value.charCodeAt(0)===he){if(!de(e.value,1,vr))return 0;switch(e.value.length){case 2:return Sr(t(++r),r,t);case 3:return e.value.charCodeAt(2)!==he?0:(r=st(t(++r),r,t),e=t(r),Se(e,0,We,r));default:return e.value.charCodeAt(2)!==he?0:Se(e,3,We,r)}}else if(e.type===1||Cr(e,lt)&&t(r+1).type===1){if(e.type!==1&&(e=t(++r)),e===null||!de(e.value,0,vr))return 0;switch(e.value.length){case 1:return Sr(t(++r),r,t);case 2:return e.value.charCodeAt(1)!==he?0:(r=st(t(++r),r,t),e=t(r),Se(e,0,We,r));default:return e.value.charCodeAt(1)!==he?0:Se(e,2,We,r)}}else if(e.type===12){let n=e.value.charCodeAt(0),o=n===lt||n===he?1:0,i=o;for(;i<e.value.length&&B(e.value.charCodeAt(i));i++);return i===o||!de(e.value,i,vr)?0:i+1===e.value.length?Sr(t(++r),r,t):e.value.charCodeAt(i+1)!==he?0:i+2===e.value.length?(r=st(t(++r),r,t),e=t(r),Se(e,0,We,r)):Se(e,i+2,We,r)}return 0}var rl=43,Di=45,Oi=63,nl=117;function Tr(e,t){return e!==null&&e.type===9&&e.value.charCodeAt(0)===t}function ol(e,t){return e.value.charCodeAt(0)===t}function ct(e,t,r){let n=0;for(let o=t;o<e.value.length;o++){let i=e.value.charCodeAt(o);if(i===Di&&r&&n!==0)return ct(e,t+n+1,!1),6;if(!ee(i)||++n>6)return 0}return n}function Ft(e,t,r){if(!e)return 0;for(;Tr(r(t),Oi);){if(++e>6)return 0;t++;}return t}function Er(e,t){let r=0;if(e===null||e.type!==1||!de(e.value,0,nl)||(e=t(++r),e===null))return 0;if(Tr(e,rl))return e=t(++r),e===null?0:e.type===1?Ft(ct(e,0,!0),++r,t):Tr(e,Oi)?Ft(1,++r,t):0;if(e.type===10){let n=ct(e,1,!0);return n===0?0:(e=t(++r),e===null?r:e.type===12||e.type===10?!ol(e,Di)||!ct(e,1,!1)?0:r+1:Ft(n,r,t))}return e.type===12?Ft(ct(e,1,!0),++r,t):0}var il=["calc(","-moz-calc(","-webkit-calc("],Lr=new Map([[2,22],[21,22],[19,20],[23,24]]);function le(e,t){return t<e.length?e.charCodeAt(t):0}function Ni(e,t){return ge(e,0,e.length,t)}function zi(e,t){for(let r=0;r<t.length;r++)if(Ni(e,t[r]))return !0;return !1}function Mi(e,t){return t!==e.length-2?!1:le(e,t)===92&&B(le(e,t+1))}function Bt(e,t,r){if(e&&e.type==="Range"){let n=Number(r!==void 0&&r!==t.length?t.substr(0,r):t);if(isNaN(n)||e.min!==null&&n<e.min&&typeof e.min!="string"||e.max!==null&&n>e.max&&typeof e.max!="string")return !0}return !1}function al(e,t){let r=0,n=[],o=0;e:do{switch(e.type){case 24:case 22:case 20:if(e.type!==r)break e;if(r=n.pop(),n.length===0){o++;break e}break;case 2:case 21:case 19:case 23:n.push(r),r=Lr.get(e.type);break}o++;}while(e=t(o));return o}function ie(e){return function(t,r,n){return t===null?0:t.type===2&&zi(t.value,il)?al(t,r):e(t,r,n)}}function N(e){return function(t){return t===null||t.type!==e?0:1}}function sl(e){if(e===null||e.type!==1)return 0;let t=e.value.toLowerCase();return zi(t,Rt)||Ni(t,"default")?0:1}function ll(e){return e===null||e.type!==1||le(e.value,0)!==45||le(e.value,1)!==45?0:1}function cl(e){if(e===null||e.type!==4)return 0;let t=e.value.length;if(t!==4&&t!==5&&t!==7&&t!==9)return 0;for(let r=1;r<t;r++)if(!ee(le(e.value,r)))return 0;return 1}function ul(e){return e===null||e.type!==4||!ze(le(e.value,1),le(e.value,2),le(e.value,3))?0:1}function pl(e,t){if(!e)return 0;let r=0,n=[],o=0;e:do{switch(e.type){case 6:case 8:break e;case 24:case 22:case 20:if(e.type!==r)break e;r=n.pop();break;case 17:if(r===0)break e;break;case 9:if(r===0&&e.value==="!")break e;break;case 2:case 21:case 19:case 23:n.push(r),r=Lr.get(e.type);break}o++;}while(e=t(o));return o}function hl(e,t){if(!e)return 0;let r=0,n=[],o=0;e:do{switch(e.type){case 6:case 8:break e;case 24:case 22:case 20:if(e.type!==r)break e;r=n.pop();break;case 2:case 21:case 19:case 23:n.push(r),r=Lr.get(e.type);break}o++;}while(e=t(o));return o}function ye(e){return e&&(e=new Set(e)),function(t,r,n){if(t===null||t.type!==12)return 0;let o=Te(t.value,0);if(e!==null){let i=t.value.indexOf("\\",o),s=i===-1||!Mi(t.value,i)?t.value.substr(o):t.value.substring(o,i);if(e.has(s.toLowerCase())===!1)return 0}return Bt(n,t.value,o)?0:1}}function ml(e,t,r){return e===null||e.type!==11||Bt(r,e.value,e.value.length-1)?0:1}function Ri(e){return typeof e!="function"&&(e=function(){return 0}),function(t,r,n){return t!==null&&t.type===10&&Number(t.value)===0?1:e(t,r,n)}}function fl(e,t,r){if(e===null)return 0;let n=Te(e.value,0);return !(n===e.value.length)&&!Mi(e.value,n)||Bt(r,e.value,n)?0:1}function dl(e,t,r){if(e===null||e.type!==10)return 0;let n=le(e.value,0)===43||le(e.value,0)===45?1:0;for(;n<e.value.length;n++)if(!B(le(e.value,n)))return 0;return Bt(r,e.value,n)?0:1}var gl={"ident-token":N(1),"function-token":N(2),"at-keyword-token":N(3),"hash-token":N(4),"string-token":N(5),"bad-string-token":N(6),"url-token":N(7),"bad-url-token":N(8),"delim-token":N(9),"number-token":N(10),"percentage-token":N(11),"dimension-token":N(12),"whitespace-token":N(13),"CDO-token":N(14),"CDC-token":N(15),"colon-token":N(16),"semicolon-token":N(17),"comma-token":N(18),"[-token":N(19),"]-token":N(20),"(-token":N(21),")-token":N(22),"{-token":N(23),"}-token":N(24)},bl={string:N(5),ident:N(1),percentage:ie(ml),zero:Ri(),number:ie(fl),integer:ie(dl),"custom-ident":sl,"custom-property-name":ll,"hex-color":cl,"id-selector":ul,"an-plus-b":Ar,urange:Er,"declaration-value":pl,"any-value":hl};function xl(e){let{angle:t,decibel:r,frequency:n,flex:o,length:i,resolution:s,semitones:u,time:c}=e||{};return {dimension:ie(ye(null)),angle:ie(ye(t)),decibel:ie(ye(r)),frequency:ie(ye(n)),flex:ie(ye(o)),length:ie(Ri(ye(i))),resolution:ie(ye(s)),semitones:ie(ye(u)),time:ie(ye(c))}}function Fi(e){return {...gl,...bl,...xl(e)}}var _t={};b(_t,{angle:()=>kl,decibel:()=>Al,flex:()=>Cl,frequency:()=>vl,length:()=>yl,resolution:()=>Sl,semitones:()=>Tl,time:()=>wl});var yl=["cm","mm","q","in","pt","pc","px","em","rem","ex","rex","cap","rcap","ch","rch","ic","ric","lh","rlh","vw","svw","lvw","dvw","vh","svh","lvh","dvh","vi","svi","lvi","dvi","vb","svb","lvb","dvb","vmin","svmin","lvmin","dvmin","vmax","svmax","lvmax","dvmax","cqw","cqh","cqi","cqb","cqmin","cqmax"],kl=["deg","grad","rad","turn"],wl=["s","ms"],vl=["hz","khz"],Sl=["dpi","dpcm","dppx","x"],Cl=["fr"],Al=["db"],Tl=["st"];var $i={};b($i,{SyntaxError:()=>Ut,generate:()=>Pe,parse:()=>Ge,walk:()=>Vt});function Ut(e,t,r){return Object.assign(Ee("SyntaxError",e),{input:t,offset:r,rawMessage:e,message:e+`
  `+t+`
--`+new Array((r||t.length)+1).join("-")+"^"})}var El=9,Ll=10,Pl=12,Il=13,Dl=32,jt=class{constructor(t){this.str=t,this.pos=0;}charCodeAt(t){return t<this.str.length?this.str.charCodeAt(t):0}charCode(){return this.charCodeAt(this.pos)}nextCharCode(){return this.charCodeAt(this.pos+1)}nextNonWsCode(t){return this.charCodeAt(this.findWsEnd(t))}findWsEnd(t){for(;t<this.str.length;t++){let r=this.str.charCodeAt(t);if(r!==Il&&r!==Ll&&r!==Pl&&r!==Dl&&r!==El)break}return t}substringToPos(t){return this.str.substring(this.pos,this.pos=t)}eat(t){this.charCode()!==t&&this.error("Expect `"+String.fromCharCode(t)+"`"),this.pos++;}peek(){return this.pos<this.str.length?this.str.charAt(this.pos++):""}error(t){throw new Ut(t,this.str,this.pos)}};var Ol=9,Nl=10,zl=12,Ml=13,Rl=32,Yi=33,Dr=35,Bi=38,qt=39,Gi=40,Fl=41,Vi=42,Or=43,Nr=44,_i=45,zr=60,Ki=62,Ir=63,Bl=64,Gt=91,Mr=93,Wt=123,Ui=124,ji=125,qi=8734,ut=new Uint8Array(128).map((e,t)=>/[a-zA-Z0-9\-]/.test(String.fromCharCode(t))?1:0),Wi={" ":1,"&&":2,"||":3,"|":4};function Ht(e){return e.substringToPos(e.findWsEnd(e.pos))}function He(e){let t=e.pos;for(;t<e.str.length;t++){let r=e.str.charCodeAt(t);if(r>=128||ut[r]===0)break}return e.pos===t&&e.error("Expect a keyword"),e.substringToPos(t)}function Yt(e){let t=e.pos;for(;t<e.str.length;t++){let r=e.str.charCodeAt(t);if(r<48||r>57)break}return e.pos===t&&e.error("Expect a number"),e.substringToPos(t)}function _l(e){let t=e.str.indexOf("'",e.pos+1);return t===-1&&(e.pos=e.str.length,e.error("Expect an apostrophe")),e.substringToPos(t+1)}function Hi(e){let t=null,r=null;return e.eat(Wt),t=Yt(e),e.charCode()===Nr?(e.pos++,e.charCode()!==ji&&(r=Yt(e))):r=t,e.eat(ji),{min:Number(t),max:r?Number(r):0}}function Ul(e){let t=null,r=!1;switch(e.charCode()){case Vi:e.pos++,t={min:0,max:0};break;case Or:e.pos++,t={min:1,max:0};break;case Ir:e.pos++,t={min:0,max:1};break;case Dr:e.pos++,r=!0,e.charCode()===Wt?t=Hi(e):e.charCode()===Ir?(e.pos++,t={min:0,max:0}):t={min:1,max:0};break;case Wt:t=Hi(e);break;default:return null}return {type:"Multiplier",comma:r,min:t.min,max:t.max,term:null}}function Ye(e,t){let r=Ul(e);return r!==null?(r.term=t,e.charCode()===Dr&&e.charCodeAt(e.pos-1)===Or?Ye(e,r):r):t}function Pr(e){let t=e.peek();return t===""?null:{type:"Token",value:t}}function jl(e){let t;return e.eat(zr),e.eat(qt),t=He(e),e.eat(qt),e.eat(Ki),Ye(e,{type:"Property",name:t})}function ql(e){let t=null,r=null,n=1;return e.eat(Gt),e.charCode()===_i&&(e.peek(),n=-1),n==-1&&e.charCode()===qi?e.peek():(t=n*Number(Yt(e)),ut[e.charCode()]!==0&&(t+=He(e))),Ht(e),e.eat(Nr),Ht(e),e.charCode()===qi?e.peek():(n=1,e.charCode()===_i&&(e.peek(),n=-1),r=n*Number(Yt(e)),ut[e.charCode()]!==0&&(r+=He(e))),e.eat(Mr),{type:"Range",min:t,max:r}}function Wl(e){let t,r=null;return e.eat(zr),t=He(e),e.charCode()===Gi&&e.nextCharCode()===Fl&&(e.pos+=2,t+="()"),e.charCodeAt(e.findWsEnd(e.pos))===Gt&&(Ht(e),r=ql(e)),e.eat(Ki),Ye(e,{type:"Type",name:t,opts:r})}function Hl(e){let t=He(e);return e.charCode()===Gi?(e.pos++,{type:"Function",name:t}):Ye(e,{type:"Keyword",name:t})}function Yl(e,t){function r(o,i){return {type:"Group",terms:o,combinator:i,disallowEmpty:!1,explicit:!1}}let n;for(t=Object.keys(t).sort((o,i)=>Wi[o]-Wi[i]);t.length>0;){n=t.shift();let o=0,i=0;for(;o<e.length;o++){let s=e[o];s.type==="Combinator"&&(s.value===n?(i===-1&&(i=o-1),e.splice(o,1),o--):(i!==-1&&o-i>1&&(e.splice(i,o-i,r(e.slice(i,o),n)),o=i+1),i=-1));}i!==-1&&t.length&&e.splice(i,o-i,r(e.slice(i,o),n));}return n}function Qi(e){let t=[],r={},n,o=null,i=e.pos;for(;n=Vl(e);)n.type!=="Spaces"&&(n.type==="Combinator"?((o===null||o.type==="Combinator")&&(e.pos=i,e.error("Unexpected combinator")),r[n.value]=!0):o!==null&&o.type!=="Combinator"&&(r[" "]=!0,t.push({type:"Combinator",value:" "})),t.push(n),o=n,i=e.pos);return o!==null&&o.type==="Combinator"&&(e.pos-=i,e.error("Unexpected combinator")),{type:"Group",terms:t,combinator:Yl(t,r)||" ",disallowEmpty:!1,explicit:!1}}function Gl(e){let t;return e.eat(Gt),t=Qi(e),e.eat(Mr),t.explicit=!0,e.charCode()===Yi&&(e.pos++,t.disallowEmpty=!0),t}function Vl(e){let t=e.charCode();if(t<128&&ut[t]===1)return Hl(e);switch(t){case Mr:break;case Gt:return Ye(e,Gl(e));case zr:return e.nextCharCode()===qt?jl(e):Wl(e);case Ui:return {type:"Combinator",value:e.substringToPos(e.pos+(e.nextCharCode()===Ui?2:1))};case Bi:return e.pos++,e.eat(Bi),{type:"Combinator",value:"&&"};case Nr:return e.pos++,{type:"Comma"};case qt:return Ye(e,{type:"String",value:_l(e)});case Rl:case Ol:case Nl:case Ml:case zl:return {type:"Spaces",value:Ht(e)};case Bl:return t=e.nextCharCode(),t<128&&ut[t]===1?(e.pos++,{type:"AtKeyword",name:He(e)}):Pr(e);case Vi:case Or:case Ir:case Dr:case Yi:break;case Wt:if(t=e.nextCharCode(),t<48||t>57)return Pr(e);break;default:return Pr(e)}}function Ge(e){let t=new jt(e),r=Qi(t);return t.pos!==e.length&&t.error("Unexpected input"),r.terms.length===1&&r.terms[0].type==="Group"?r.terms[0]:r}var pt=function(){};function Xi(e){return typeof e=="function"?e:pt}function Vt(e,t,r){function n(s){switch(o.call(r,s),s.type){case"Group":s.terms.forEach(n);break;case"Multiplier":n(s.term);break;case"Type":case"Property":case"Keyword":case"AtKeyword":case"Function":case"String":case"Token":case"Comma":break;default:throw new Error("Unknown type: "+s.type)}i.call(r,s);}let o=pt,i=pt;if(typeof t=="function"?o=t:t&&(o=Xi(t.enter),i=Xi(t.leave)),o===pt&&i===pt)throw new Error("Neither `enter` nor `leave` walker handler is set or both aren't a function");n(e);}var Kl={decorator(e){let t=[],r=null;return {...e,node(n){let o=r;r=n,e.node.call(this,n),r=o;},emit(n,o,i){t.push({type:o,value:n,node:i?null:r});},result(){return t}}}};function Ql(e){let t=[];return ve(e,(r,n,o)=>t.push({type:r,value:e.slice(n,o),node:null})),t}function Zi(e,t){return typeof e=="string"?Ql(e):t.generate(e,Kl)}var C={type:"Match"},L={type:"Mismatch"},Kt={type:"DisallowEmpty"},Xl=40,$l=41;function Z(e,t,r){return t===C&&r===L||e===C&&t===C&&r===C?e:(e.type==="If"&&e.else===L&&t===C&&(t=e.then,e=e.match),{type:"If",match:e,then:t,else:r})}function ea(e){return e.length>2&&e.charCodeAt(e.length-2)===Xl&&e.charCodeAt(e.length-1)===$l}function Ji(e){return e.type==="Keyword"||e.type==="AtKeyword"||e.type==="Function"||e.type==="Type"&&ea(e.name)}function Rr(e,t,r){switch(e){case" ":{let n=C;for(let o=t.length-1;o>=0;o--){let i=t[o];n=Z(i,n,L);}return n}case"|":{let n=L,o=null;for(let i=t.length-1;i>=0;i--){let s=t[i];if(Ji(s)&&(o===null&&i>0&&Ji(t[i-1])&&(o=Object.create(null),n=Z({type:"Enum",map:o},C,n)),o!==null)){let u=(ea(s.name)?s.name.slice(0,-1):s.name).toLowerCase();if(!(u in o)){o[u]=s;continue}}o=null,n=Z(s,C,n);}return n}case"&&":{if(t.length>5)return {type:"MatchOnce",terms:t,all:!0};let n=L;for(let o=t.length-1;o>=0;o--){let i=t[o],s;t.length>1?s=Rr(e,t.filter(function(u){return u!==i}),!1):s=C,n=Z(i,s,n);}return n}case"||":{if(t.length>5)return {type:"MatchOnce",terms:t,all:!1};let n=r?C:L;for(let o=t.length-1;o>=0;o--){let i=t[o],s;t.length>1?s=Rr(e,t.filter(function(u){return u!==i}),!0):s=C,n=Z(i,s,n);}return n}}}function Zl(e){let t=C,r=Fr(e.term);if(e.max===0)r=Z(r,Kt,L),t=Z(r,null,L),t.then=Z(C,C,t),e.comma&&(t.then.else=Z({type:"Comma",syntax:e},t,L));else for(let n=e.min||1;n<=e.max;n++)e.comma&&t!==C&&(t=Z({type:"Comma",syntax:e},t,L)),t=Z(r,Z(C,C,t),L);if(e.min===0)t=Z(C,C,t);else for(let n=0;n<e.min-1;n++)e.comma&&t!==C&&(t=Z({type:"Comma",syntax:e},t,L)),t=Z(r,t,L);return t}function Fr(e){if(typeof e=="function")return {type:"Generic",fn:e};switch(e.type){case"Group":{let t=Rr(e.combinator,e.terms.map(Fr),!1);return e.disallowEmpty&&(t=Z(t,Kt,L)),t}case"Multiplier":return Zl(e);case"Type":case"Property":return {type:e.type,name:e.name,syntax:e};case"Keyword":return {type:e.type,name:e.name.toLowerCase(),syntax:e};case"AtKeyword":return {type:e.type,name:"@"+e.name.toLowerCase(),syntax:e};case"Function":return {type:e.type,name:e.name.toLowerCase()+"(",syntax:e};case"String":return e.value.length===3?{type:"Token",value:e.value.charAt(1),syntax:e}:{type:e.type,value:e.value.substr(1,e.value.length-2).replace(/\\'/g,"'"),syntax:e};case"Token":return {type:e.type,value:e.value,syntax:e};case"Comma":return {type:e.type,syntax:e};default:throw new Error("Unknown node type:",e.type)}}function Qt(e,t){return typeof e=="string"&&(e=Ge(e)),{type:"MatchGraph",match:Fr(e),syntax:t||null,source:e}}var {hasOwnProperty:ta}=Object.prototype,Jl=0,ec=1,_r=2,aa=3,ra="Match",tc="Mismatch",rc="Maximum iteration number exceeded (please fill an issue on https://github.com/csstree/csstree/issues)",na=15e3;function oc(e){let t=null,r=null,n=e;for(;n!==null;)r=n.prev,n.prev=t,t=n,n=r;return t}function Br(e,t){if(e.length!==t.length)return !1;for(let r=0;r<e.length;r++){let n=t.charCodeAt(r),o=e.charCodeAt(r);if(o>=65&&o<=90&&(o=o|32),o!==n)return !1}return !0}function ic(e){return e.type!==9?!1:e.value!=="?"}function oa(e){return e===null?!0:e.type===18||e.type===2||e.type===21||e.type===19||e.type===23||ic(e)}function ia(e){return e===null?!0:e.type===22||e.type===20||e.type===24||e.type===9&&e.value==="/"}function ac(e,t,r){function n(){do R++,S=R<e.length?e[R]:null;while(S!==null&&(S.type===13||S.type===25))}function o(ae){let fe=R+ae;return fe<e.length?e[fe]:null}function i(ae,fe){return {nextState:ae,matchStack:z,syntaxStack:p,thenStack:m,tokenIndex:R,prev:fe}}function s(ae){m={nextState:ae,matchStack:z,syntaxStack:p,prev:m};}function u(ae){f=i(ae,f);}function c(){z={type:ec,syntax:t.syntax,token:S,prev:z},n(),P=null,R>ke&&(ke=R);}function a(){p={syntax:t.syntax,opts:t.syntax.opts||p!==null&&p.opts||null,prev:p},z={type:_r,syntax:t.syntax,token:z.token,prev:z};}function l(){z.type===_r?z=z.prev:z={type:aa,syntax:p.syntax,token:z.token,prev:z},p=p.prev;}let p=null,m=null,f=null,P=null,te=0,X=null,S=null,R=-1,ke=0,z={type:Jl,syntax:null,token:null,prev:null};for(n();X===null&&++te<na;)switch(t.type){case"Match":if(m===null){if(S!==null&&(R!==e.length-1||S.value!=="\\0"&&S.value!=="\\9")){t=L;break}X=ra;break}if(t=m.nextState,t===Kt)if(m.matchStack===z){t=L;break}else t=C;for(;m.syntaxStack!==p;)l();m=m.prev;break;case"Mismatch":if(P!==null&&P!==!1)(f===null||R>f.tokenIndex)&&(f=P,P=!1);else if(f===null){X=tc;break}t=f.nextState,m=f.thenStack,p=f.syntaxStack,z=f.matchStack,R=f.tokenIndex,S=R<e.length?e[R]:null,f=f.prev;break;case"MatchGraph":t=t.match;break;case"If":t.else!==L&&u(t.else),t.then!==C&&s(t.then),t=t.match;break;case"MatchOnce":t={type:"MatchOnceBuffer",syntax:t,index:0,mask:0};break;case"MatchOnceBuffer":{let Q=t.syntax.terms;if(t.index===Q.length){if(t.mask===0||t.syntax.all){t=L;break}t=C;break}if(t.mask===(1<<Q.length)-1){t=C;break}for(;t.index<Q.length;t.index++){let J=1<<t.index;if((t.mask&J)===0){u(t),s({type:"AddMatchOnce",syntax:t.syntax,mask:t.mask|J}),t=Q[t.index++];break}}break}case"AddMatchOnce":t={type:"MatchOnceBuffer",syntax:t.syntax,index:0,mask:t.mask};break;case"Enum":if(S!==null){let Q=S.value.toLowerCase();if(Q.indexOf("\\")!==-1&&(Q=Q.replace(/\\[09].*$/,"")),ta.call(t.map,Q)){t=t.map[Q];break}}t=L;break;case"Generic":{let Q=p!==null?p.opts:null,J=R+Math.floor(t.fn(S,o,Q));if(!isNaN(J)&&J>R){for(;R<J;)c();t=C;}else t=L;break}case"Type":case"Property":{let Q=t.type==="Type"?"types":"properties",J=ta.call(r,Q)?r[Q][t.name]:null;if(!J||!J.match)throw new Error("Bad syntax reference: "+(t.type==="Type"?"<"+t.name+">":"<'"+t.name+"'>"));if(P!==!1&&S!==null&&t.type==="Type"&&(t.name==="custom-ident"&&S.type===1||t.name==="length"&&S.value==="0")){P===null&&(P=i(t,f)),t=L;break}a(),t=J.match;break}case"Keyword":{let Q=t.name;if(S!==null){let J=S.value;if(J.indexOf("\\")!==-1&&(J=J.replace(/\\[09].*$/,"")),Br(J,Q)){c(),t=C;break}}t=L;break}case"AtKeyword":case"Function":if(S!==null&&Br(S.value,t.name)){c(),t=C;break}t=L;break;case"Token":if(S!==null&&S.value===t.value){c(),t=C;break}t=L;break;case"Comma":S!==null&&S.type===18?oa(z.token)?t=L:(c(),t=ia(S)?L:C):t=oa(z.token)||ia(S)?C:L;break;case"String":let ae="",fe=R;for(;fe<e.length&&ae.length<t.value.length;fe++)ae+=e[fe].value;if(Br(ae,t.value)){for(;R<fe;)c();t=C;}else t=L;break;default:throw new Error("Unknown node type: "+t.type)}switch(X){case null:console.warn("[csstree-match] BREAK after "+na+" iterations"),X=rc,z=null;break;case ra:for(;p!==null;)l();break;default:z=null;}return {tokens:e,reason:X,iterations:te,match:z,longestMatch:ke}}function Ur(e,t,r){let n=ac(e,t,r||{});if(n.match===null)return n;let o=n.match,i=n.match={syntax:t.syntax||null,match:[]},s=[i];for(o=oc(o).prev;o!==null;){switch(o.type){case _r:i.match.push(i={syntax:o.syntax,match:[]}),s.push(i);break;case aa:s.pop(),i=s[s.length-1];break;default:i.match.push({syntax:o.syntax||null,token:o.token.value,node:o.token.node});}o=o.prev;}return n}var qr={};b(qr,{getTrace:()=>sa,isKeyword:()=>cc,isProperty:()=>lc,isType:()=>sc});function sa(e){function t(o){return o===null?!1:o.type==="Type"||o.type==="Property"||o.type==="Keyword"}function r(o){if(Array.isArray(o.match)){for(let i=0;i<o.match.length;i++)if(r(o.match[i]))return t(o.syntax)&&n.unshift(o.syntax),!0}else if(o.node===e)return n=t(o.syntax)?[o.syntax]:[],!0;return !1}let n=null;return this.matched!==null&&r(this.matched),n}function sc(e,t){return jr(this,e,r=>r.type==="Type"&&r.name===t)}function lc(e,t){return jr(this,e,r=>r.type==="Property"&&r.name===t)}function cc(e){return jr(this,e,t=>t.type==="Keyword")}function jr(e,t,r){let n=sa.call(e,t);return n===null?!1:n.some(r)}function la(e){return "node"in e?e.node:la(e.match[0])}function ca(e){return "node"in e?e.node:ca(e.match[e.match.length-1])}function Wr(e,t,r,n,o){function i(u){if(u.syntax!==null&&u.syntax.type===n&&u.syntax.name===o){let c=la(u),a=ca(u);e.syntax.walk(t,function(l,p,m){if(l===c){let f=new D;do{if(f.appendData(p.data),p.data===a)break;p=p.next;}while(p!==null);s.push({parent:m,nodes:f});}});}Array.isArray(u.match)&&u.match.forEach(i);}let s=[];return r.matched!==null&&i(r.matched),s}var{hasOwnProperty:ht}=Object.prototype;function Hr(e){return typeof e=="number"&&isFinite(e)&&Math.floor(e)===e&&e>=0}function ua(e){return Boolean(e)&&Hr(e.offset)&&Hr(e.line)&&Hr(e.column)}function uc(e,t){return function(n,o){if(!n||n.constructor!==Object)return o(n,"Type of node should be an Object");for(let i in n){let s=!0;if(ht.call(n,i)!==!1){if(i==="type")n.type!==e&&o(n,"Wrong node type `"+n.type+"`, expected `"+e+"`");else if(i==="loc"){if(n.loc===null)continue;if(n.loc&&n.loc.constructor===Object)if(typeof n.loc.source!="string")i+=".source";else if(!ua(n.loc.start))i+=".start";else if(!ua(n.loc.end))i+=".end";else continue;s=!1;}else if(t.hasOwnProperty(i)){s=!1;for(let u=0;!s&&u<t[i].length;u++){let c=t[i][u];switch(c){case String:s=typeof n[i]=="string";break;case Boolean:s=typeof n[i]=="boolean";break;case null:s=n[i]===null;break;default:typeof c=="string"?s=n[i]&&n[i].type===c:Array.isArray(c)&&(s=n[i]instanceof D);}}}else o(n,"Unknown field `"+i+"` for "+e+" node type");s||o(n,"Bad value for `"+e+"."+i+"`");}}for(let i in t)ht.call(t,i)&&ht.call(n,i)===!1&&o(n,"Field `"+e+"."+i+"` is missed");}}function pc(e,t){let r=t.structure,n={type:String,loc:!0},o={type:'"'+e+'"'};for(let i in r){if(ht.call(r,i)===!1)continue;let s=[],u=n[i]=Array.isArray(r[i])?r[i].slice():[r[i]];for(let c=0;c<u.length;c++){let a=u[c];if(a===String||a===Boolean)s.push(a.name);else if(a===null)s.push("null");else if(typeof a=="string")s.push("<"+a+">");else if(Array.isArray(a))s.push("List");else throw new Error("Wrong value `"+a+"` in `"+e+"."+i+"` structure definition")}o[i]=s.join(" | ");}return {docs:o,check:uc(e,n)}}function pa(e){let t={};if(e.node){for(let r in e.node)if(ht.call(e.node,r)){let n=e.node[r];if(n.structure)t[r]=pc(r,n);else throw new Error("Missed `structure` field in `"+r+"` node type definition")}}return t}var hc=Qt(Rt.join(" | "));function Yr(e,t,r){let n={};for(let o in e)e[o].syntax&&(n[o]=r?e[o].syntax:Pe(e[o].syntax,{compact:t}));return n}function mc(e,t,r){let n={};for(let[o,i]of Object.entries(e))n[o]={prelude:i.prelude&&(r?i.prelude.syntax:Pe(i.prelude.syntax,{compact:t})),descriptors:i.descriptors&&Yr(i.descriptors,t,r)};return n}function fc(e){for(let t=0;t<e.length;t++)if(e[t].value.toLowerCase()==="var(")return !0;return !1}function ce(e,t,r){return {matched:e,iterations:r,error:t,...qr}}function Ve(e,t,r,n){let o=Zi(r,e.syntax),i;return fc(o)?ce(null,new Error("Matching for a tree with var() is not supported")):(n&&(i=Ur(o,e.cssWideKeywordsSyntax,e)),(!n||!i.match)&&(i=Ur(o,t.match,e),!i.match)?ce(null,new Ii(i.reason,t.syntax,r,i),i.iterations):ce(i.match,null,i.iterations))}var Ke=class{constructor(t,r,n){if(this.cssWideKeywordsSyntax=hc,this.syntax=r,this.generic=!1,this.units={..._t},this.atrules=Object.create(null),this.properties=Object.create(null),this.types=Object.create(null),this.structure=n||pa(t),t){if(t.units)for(let o of Object.keys(_t))Array.isArray(t.units[o])&&(this.units[o]=t.units[o]);if(t.types)for(let o in t.types)this.addType_(o,t.types[o]);if(t.generic){this.generic=!0;for(let[o,i]of Object.entries(Fi(this.units)))this.addType_(o,i);}if(t.atrules)for(let o in t.atrules)this.addAtrule_(o,t.atrules[o]);if(t.properties)for(let o in t.properties)this.addProperty_(o,t.properties[o]);}}checkStructure(t){function r(i,s){o.push({node:i,message:s});}let n=this.structure,o=[];return this.syntax.walk(t,function(i){n.hasOwnProperty(i.type)?n[i.type].check(i,r):r(i,"Unknown node type `"+i.type+"`");}),o.length?o:!1}createDescriptor(t,r,n,o=null){let i={type:r,name:n},s={type:r,name:n,parent:o,serializable:typeof t=="string"||t&&typeof t.type=="string",syntax:null,match:null};return typeof t=="function"?s.match=Qt(t,i):(typeof t=="string"?Object.defineProperty(s,"syntax",{get(){return Object.defineProperty(s,"syntax",{value:Ge(t)}),s.syntax}}):s.syntax=t,Object.defineProperty(s,"match",{get(){return Object.defineProperty(s,"match",{value:Qt(s.syntax,i)}),s.match}})),s}addAtrule_(t,r){!r||(this.atrules[t]={type:"Atrule",name:t,prelude:r.prelude?this.createDescriptor(r.prelude,"AtrulePrelude",t):null,descriptors:r.descriptors?Object.keys(r.descriptors).reduce((n,o)=>(n[o]=this.createDescriptor(r.descriptors[o],"AtruleDescriptor",o,t),n),Object.create(null)):null});}addProperty_(t,r){!r||(this.properties[t]=this.createDescriptor(r,"Property",t));}addType_(t,r){!r||(this.types[t]=this.createDescriptor(r,"Type",t));}checkAtruleName(t){if(!this.getAtrule(t))return new je("Unknown at-rule","@"+t)}checkAtrulePrelude(t,r){let n=this.checkAtruleName(t);if(n)return n;let o=this.getAtrule(t);if(!o.prelude&&r)return new SyntaxError("At-rule `@"+t+"` should not contain a prelude");if(o.prelude&&!r&&!Ve(this,o.prelude,"",!1).matched)return new SyntaxError("At-rule `@"+t+"` should contain a prelude")}checkAtruleDescriptorName(t,r){let n=this.checkAtruleName(t);if(n)return n;let o=this.getAtrule(t),i=zt(r);if(!o.descriptors)return new SyntaxError("At-rule `@"+t+"` has no known descriptors");if(!o.descriptors[i.name]&&!o.descriptors[i.basename])return new je("Unknown at-rule descriptor",r)}checkPropertyName(t){if(!this.getProperty(t))return new je("Unknown property",t)}matchAtrulePrelude(t,r){let n=this.checkAtrulePrelude(t,r);if(n)return ce(null,n);let o=this.getAtrule(t);return o.prelude?Ve(this,o.prelude,r||"",!1):ce(null,null)}matchAtruleDescriptor(t,r,n){let o=this.checkAtruleDescriptorName(t,r);if(o)return ce(null,o);let i=this.getAtrule(t),s=zt(r);return Ve(this,i.descriptors[s.name]||i.descriptors[s.basename],n,!1)}matchDeclaration(t){return t.type!=="Declaration"?ce(null,new Error("Not a Declaration node")):this.matchProperty(t.property,t.value)}matchProperty(t,r){if(kr(t).custom)return ce(null,new Error("Lexer matching doesn't applicable for custom properties"));let n=this.checkPropertyName(t);return n?ce(null,n):Ve(this,this.getProperty(t),r,!0)}matchType(t,r){let n=this.getType(t);return n?Ve(this,n,r,!1):ce(null,new je("Unknown type",t))}match(t,r){return typeof t!="string"&&(!t||!t.type)?ce(null,new je("Bad syntax")):((typeof t=="string"||!t.match)&&(t=this.createDescriptor(t,"Type","anonymous")),Ve(this,t,r,!1))}findValueFragments(t,r,n,o){return Wr(this,r,this.matchProperty(t,r),n,o)}findDeclarationValueFragments(t,r,n){return Wr(this,t.value,this.matchDeclaration(t),r,n)}findAllFragments(t,r,n){let o=[];return this.syntax.walk(t,{visit:"Declaration",enter:i=>{o.push.apply(o,this.findDeclarationValueFragments(i,r,n));}}),o}getAtrule(t,r=!0){let n=zt(t);return (n.vendor&&r?this.atrules[n.name]||this.atrules[n.basename]:this.atrules[n.name])||null}getAtrulePrelude(t,r=!0){let n=this.getAtrule(t,r);return n&&n.prelude||null}getAtruleDescriptor(t,r){return this.atrules.hasOwnProperty(t)&&this.atrules.declarators&&this.atrules[t].declarators[r]||null}getProperty(t,r=!0){let n=kr(t);return (n.vendor&&r?this.properties[n.name]||this.properties[n.basename]:this.properties[n.name])||null}getType(t){return hasOwnProperty.call(this.types,t)?this.types[t]:null}validate(){function t(o,i,s,u){if(s.has(i))return s.get(i);s.set(i,!1),u.syntax!==null&&Vt(u.syntax,function(c){if(c.type!=="Type"&&c.type!=="Property")return;let a=c.type==="Type"?o.types:o.properties,l=c.type==="Type"?r:n;(!hasOwnProperty.call(a,c.name)||t(o,c.name,l,a[c.name]))&&s.set(i,!0);},this);}let r=new Map,n=new Map;for(let o in this.types)t(this,o,r,this.types[o]);for(let o in this.properties)t(this,o,n,this.properties[o]);return r=[...r.keys()].filter(o=>r.get(o)),n=[...n.keys()].filter(o=>n.get(o)),r.length||n.length?{types:r,properties:n}:null}dump(t,r){return {generic:this.generic,units:this.units,types:Yr(this.types,!r,t),properties:Yr(this.properties,!r,t),atrules:mc(this.atrules,!r,t)}}toString(){return JSON.stringify(this.dump())}};function Gr(e,t){return typeof t=="string"&&/^\s*\|/.test(t)?typeof e=="string"?e+t:t.replace(/^\s*\|\s*/,""):t||null}function ha(e,t){let r=Object.create(null);for(let[n,o]of Object.entries(e))if(o){r[n]={};for(let i of Object.keys(o))t.includes(i)&&(r[n][i]=o[i]);}return r}function mt(e,t){let r={...e};for(let[n,o]of Object.entries(t))switch(n){case"generic":r[n]=Boolean(o);break;case"units":r[n]={...e[n]};for(let[i,s]of Object.entries(o))r[n][i]=Array.isArray(s)?s:[];break;case"atrules":r[n]={...e[n]};for(let[i,s]of Object.entries(o)){let u=r[n][i]||{},c=r[n][i]={prelude:u.prelude||null,descriptors:{...u.descriptors}};if(!!s){c.prelude=s.prelude?Gr(c.prelude,s.prelude):c.prelude||null;for(let[a,l]of Object.entries(s.descriptors||{}))c.descriptors[a]=l?Gr(c.descriptors[a],l):null;Object.keys(c.descriptors).length||(c.descriptors=null);}}break;case"types":case"properties":r[n]={...e[n]};for(let[i,s]of Object.entries(o))r[n][i]=Gr(r[n][i],s);break;case"scope":r[n]={...e[n]};for(let[i,s]of Object.entries(o))r[n][i]={...r[n][i],...s};break;case"parseContext":r[n]={...e[n],...o};break;case"atrule":case"pseudo":r[n]={...e[n],...ha(o,["parse"])};break;case"node":r[n]={...e[n],...ha(o,["name","structure","parse","generate","walkContext"])};break}return r}function ma(e){let t=$o(e),r=Li(e),n=vi(e),{fromPlainObject:o,toPlainObject:i}=Si(r),s={lexer:null,createLexer:u=>new Ke(u,s,s.lexer.structure),tokenize:ve,parse:t,generate:n,walk:r,find:r.find,findLast:r.findLast,findAll:r.findAll,fromPlainObject:o,toPlainObject:i,fork(u){let c=mt({},e);return ma(typeof u=="function"?u(c,Object.assign):mt(c,u))}};return s.lexer=new Ke({generic:!0,units:e.units,types:e.types,atrules:e.atrules,properties:e.properties,node:e.node},s),s}var Vr=e=>ma(mt({},e));var fa={generic:!0,units:{angle:["deg","grad","rad","turn"],decibel:["db"],flex:["fr"],frequency:["hz","khz"],length:["cm","mm","q","in","pt","pc","px","em","rem","ex","rex","cap","rcap","ch","rch","ic","ric","lh","rlh","vw","svw","lvw","dvw","vh","svh","lvh","dvh","vi","svi","lvi","dvi","vb","svb","lvb","dvb","vmin","svmin","lvmin","dvmin","vmax","svmax","lvmax","dvmax","cqw","cqh","cqi","cqb","cqmin","cqmax"],resolution:["dpi","dpcm","dppx","x"],semitones:["st"],time:["s","ms"]},types:{"abs()":"abs( <calc-sum> )","absolute-size":"xx-small|x-small|small|medium|large|x-large|xx-large|xxx-large","acos()":"acos( <calc-sum> )","alpha-value":"<number>|<percentage>","angle-percentage":"<angle>|<percentage>","angular-color-hint":"<angle-percentage>","angular-color-stop":"<color>&&<color-stop-angle>?","angular-color-stop-list":"[<angular-color-stop> [, <angular-color-hint>]?]# , <angular-color-stop>","animateable-feature":"scroll-position|contents|<custom-ident>","asin()":"asin( <calc-sum> )","atan()":"atan( <calc-sum> )","atan2()":"atan2( <calc-sum> , <calc-sum> )",attachment:"scroll|fixed|local","attr()":"attr( <attr-name> <type-or-unit>? [, <attr-fallback>]? )","attr-matcher":"['~'|'|'|'^'|'$'|'*']? '='","attr-modifier":"i|s","attribute-selector":"'[' <wq-name> ']'|'[' <wq-name> <attr-matcher> [<string-token>|<ident-token>] <attr-modifier>? ']'","auto-repeat":"repeat( [auto-fill|auto-fit] , [<line-names>? <fixed-size>]+ <line-names>? )","auto-track-list":"[<line-names>? [<fixed-size>|<fixed-repeat>]]* <line-names>? <auto-repeat> [<line-names>? [<fixed-size>|<fixed-repeat>]]* <line-names>?",axis:"block|inline|vertical|horizontal","baseline-position":"[first|last]? baseline","basic-shape":"<inset()>|<circle()>|<ellipse()>|<polygon()>|<path()>","bg-image":"none|<image>","bg-layer":"<bg-image>||<bg-position> [/ <bg-size>]?||<repeat-style>||<attachment>||<box>||<box>","bg-position":"[[left|center|right|top|bottom|<length-percentage>]|[left|center|right|<length-percentage>] [top|center|bottom|<length-percentage>]|[center|[left|right] <length-percentage>?]&&[center|[top|bottom] <length-percentage>?]]","bg-size":"[<length-percentage>|auto]{1,2}|cover|contain","blur()":"blur( <length> )","blend-mode":"normal|multiply|screen|overlay|darken|lighten|color-dodge|color-burn|hard-light|soft-light|difference|exclusion|hue|saturation|color|luminosity",box:"border-box|padding-box|content-box","brightness()":"brightness( <number-percentage> )","calc()":"calc( <calc-sum> )","calc-sum":"<calc-product> [['+'|'-'] <calc-product>]*","calc-product":"<calc-value> ['*' <calc-value>|'/' <number>]*","calc-value":"<number>|<dimension>|<percentage>|<calc-constant>|( <calc-sum> )","calc-constant":"e|pi|infinity|-infinity|NaN","cf-final-image":"<image>|<color>","cf-mixing-image":"<percentage>?&&<image>","circle()":"circle( [<shape-radius>]? [at <position>]? )","clamp()":"clamp( <calc-sum>#{3} )","class-selector":"'.' <ident-token>","clip-source":"<url>",color:"<rgb()>|<rgba()>|<hsl()>|<hsla()>|<hwb()>|<lab()>|<lch()>|<hex-color>|<named-color>|currentcolor|<deprecated-system-color>","color-stop":"<color-stop-length>|<color-stop-angle>","color-stop-angle":"<angle-percentage>{1,2}","color-stop-length":"<length-percentage>{1,2}","color-stop-list":"[<linear-color-stop> [, <linear-color-hint>]?]# , <linear-color-stop>",combinator:"'>'|'+'|'~'|['||']","common-lig-values":"[common-ligatures|no-common-ligatures]","compat-auto":"searchfield|textarea|push-button|slider-horizontal|checkbox|radio|square-button|menulist|listbox|meter|progress-bar|button","composite-style":"clear|copy|source-over|source-in|source-out|source-atop|destination-over|destination-in|destination-out|destination-atop|xor","compositing-operator":"add|subtract|intersect|exclude","compound-selector":"[<type-selector>? <subclass-selector>* [<pseudo-element-selector> <pseudo-class-selector>*]*]!","compound-selector-list":"<compound-selector>#","complex-selector":"<compound-selector> [<combinator>? <compound-selector>]*","complex-selector-list":"<complex-selector>#","conic-gradient()":"conic-gradient( [from <angle>]? [at <position>]? , <angular-color-stop-list> )","contextual-alt-values":"[contextual|no-contextual]","content-distribution":"space-between|space-around|space-evenly|stretch","content-list":"[<string>|contents|<image>|<counter>|<quote>|<target>|<leader()>|<attr()>]+","content-position":"center|start|end|flex-start|flex-end","content-replacement":"<image>","contrast()":"contrast( [<number-percentage>] )","cos()":"cos( <calc-sum> )",counter:"<counter()>|<counters()>","counter()":"counter( <counter-name> , <counter-style>? )","counter-name":"<custom-ident>","counter-style":"<counter-style-name>|symbols( )","counter-style-name":"<custom-ident>","counters()":"counters( <counter-name> , <string> , <counter-style>? )","cross-fade()":"cross-fade( <cf-mixing-image> , <cf-final-image>? )","cubic-bezier-timing-function":"ease|ease-in|ease-out|ease-in-out|cubic-bezier( <number [0,1]> , <number> , <number [0,1]> , <number> )","deprecated-system-color":"ActiveBorder|ActiveCaption|AppWorkspace|Background|ButtonFace|ButtonHighlight|ButtonShadow|ButtonText|CaptionText|GrayText|Highlight|HighlightText|InactiveBorder|InactiveCaption|InactiveCaptionText|InfoBackground|InfoText|Menu|MenuText|Scrollbar|ThreeDDarkShadow|ThreeDFace|ThreeDHighlight|ThreeDLightShadow|ThreeDShadow|Window|WindowFrame|WindowText","discretionary-lig-values":"[discretionary-ligatures|no-discretionary-ligatures]","display-box":"contents|none","display-inside":"flow|flow-root|table|flex|grid|ruby","display-internal":"table-row-group|table-header-group|table-footer-group|table-row|table-cell|table-column-group|table-column|table-caption|ruby-base|ruby-text|ruby-base-container|ruby-text-container","display-legacy":"inline-block|inline-list-item|inline-table|inline-flex|inline-grid","display-listitem":"<display-outside>?&&[flow|flow-root]?&&list-item","display-outside":"block|inline|run-in","drop-shadow()":"drop-shadow( <length>{2,3} <color>? )","east-asian-variant-values":"[jis78|jis83|jis90|jis04|simplified|traditional]","east-asian-width-values":"[full-width|proportional-width]","element()":"element( <custom-ident> , [first|start|last|first-except]? )|element( <id-selector> )","ellipse()":"ellipse( [<shape-radius>{2}]? [at <position>]? )","ending-shape":"circle|ellipse","env()":"env( <custom-ident> , <declaration-value>? )","exp()":"exp( <calc-sum> )","explicit-track-list":"[<line-names>? <track-size>]+ <line-names>?","family-name":"<string>|<custom-ident>+","feature-tag-value":"<string> [<integer>|on|off]?","feature-type":"@stylistic|@historical-forms|@styleset|@character-variant|@swash|@ornaments|@annotation","feature-value-block":"<feature-type> '{' <feature-value-declaration-list> '}'","feature-value-block-list":"<feature-value-block>+","feature-value-declaration":"<custom-ident> : <integer>+ ;","feature-value-declaration-list":"<feature-value-declaration>","feature-value-name":"<custom-ident>","fill-rule":"nonzero|evenodd","filter-function":"<blur()>|<brightness()>|<contrast()>|<drop-shadow()>|<grayscale()>|<hue-rotate()>|<invert()>|<opacity()>|<saturate()>|<sepia()>","filter-function-list":"[<filter-function>|<url>]+","final-bg-layer":"<'background-color'>||<bg-image>||<bg-position> [/ <bg-size>]?||<repeat-style>||<attachment>||<box>||<box>","fixed-breadth":"<length-percentage>","fixed-repeat":"repeat( [<integer [1,\u221E]>] , [<line-names>? <fixed-size>]+ <line-names>? )","fixed-size":"<fixed-breadth>|minmax( <fixed-breadth> , <track-breadth> )|minmax( <inflexible-breadth> , <fixed-breadth> )","font-stretch-absolute":"normal|ultra-condensed|extra-condensed|condensed|semi-condensed|semi-expanded|expanded|extra-expanded|ultra-expanded|<percentage>","font-variant-css21":"[normal|small-caps]","font-weight-absolute":"normal|bold|<number [1,1000]>","frequency-percentage":"<frequency>|<percentage>","general-enclosed":"[<function-token> <any-value> )]|( <ident> <any-value> )","generic-family":"serif|sans-serif|cursive|fantasy|monospace|-apple-system","generic-name":"serif|sans-serif|cursive|fantasy|monospace","geometry-box":"<shape-box>|fill-box|stroke-box|view-box",gradient:"<linear-gradient()>|<repeating-linear-gradient()>|<radial-gradient()>|<repeating-radial-gradient()>|<conic-gradient()>|<repeating-conic-gradient()>|<-legacy-gradient>","grayscale()":"grayscale( <number-percentage> )","grid-line":"auto|<custom-ident>|[<integer>&&<custom-ident>?]|[span&&[<integer>||<custom-ident>]]","historical-lig-values":"[historical-ligatures|no-historical-ligatures]","hsl()":"hsl( <hue> <percentage> <percentage> [/ <alpha-value>]? )|hsl( <hue> , <percentage> , <percentage> , <alpha-value>? )","hsla()":"hsla( <hue> <percentage> <percentage> [/ <alpha-value>]? )|hsla( <hue> , <percentage> , <percentage> , <alpha-value>? )",hue:"<number>|<angle>","hue-rotate()":"hue-rotate( <angle> )","hwb()":"hwb( [<hue>|none] [<percentage>|none] [<percentage>|none] [/ [<alpha-value>|none]]? )","hypot()":"hypot( <calc-sum># )",image:"<url>|<image()>|<image-set()>|<element()>|<paint()>|<cross-fade()>|<gradient>","image()":"image( <image-tags>? [<image-src>? , <color>?]! )","image-set()":"image-set( <image-set-option># )","image-set-option":"[<image>|<string>] [<resolution>||type( <string> )]","image-src":"<url>|<string>","image-tags":"ltr|rtl","inflexible-breadth":"<length-percentage>|min-content|max-content|auto","inset()":"inset( <length-percentage>{1,4} [round <'border-radius'>]? )","invert()":"invert( <number-percentage> )","keyframes-name":"<custom-ident>|<string>","keyframe-block":"<keyframe-selector># { <declaration-list> }","keyframe-block-list":"<keyframe-block>+","keyframe-selector":"from|to|<percentage>","lab()":"lab( [<percentage>|<number>|none] [<percentage>|<number>|none] [<percentage>|<number>|none] [/ [<alpha-value>|none]]? )","layer()":"layer( <layer-name> )","layer-name":"<ident> ['.' <ident>]*","lch()":"lch( [<percentage>|<number>|none] [<percentage>|<number>|none] [<hue>|none] [/ [<alpha-value>|none]]? )","leader()":"leader( <leader-type> )","leader-type":"dotted|solid|space|<string>","length-percentage":"<length>|<percentage>","line-names":"'[' <custom-ident>* ']'","line-name-list":"[<line-names>|<name-repeat>]+","line-style":"none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset","line-width":"<length>|thin|medium|thick","linear-color-hint":"<length-percentage>","linear-color-stop":"<color> <color-stop-length>?","linear-gradient()":"linear-gradient( [<angle>|to <side-or-corner>]? , <color-stop-list> )","log()":"log( <calc-sum> , <calc-sum>? )","mask-layer":"<mask-reference>||<position> [/ <bg-size>]?||<repeat-style>||<geometry-box>||[<geometry-box>|no-clip]||<compositing-operator>||<masking-mode>","mask-position":"[<length-percentage>|left|center|right] [<length-percentage>|top|center|bottom]?","mask-reference":"none|<image>|<mask-source>","mask-source":"<url>","masking-mode":"alpha|luminance|match-source","matrix()":"matrix( <number>#{6} )","matrix3d()":"matrix3d( <number>#{16} )","max()":"max( <calc-sum># )","media-and":"<media-in-parens> [and <media-in-parens>]+","media-condition":"<media-not>|<media-and>|<media-or>|<media-in-parens>","media-condition-without-or":"<media-not>|<media-and>|<media-in-parens>","media-feature":"( [<mf-plain>|<mf-boolean>|<mf-range>] )","media-in-parens":"( <media-condition> )|<media-feature>|<general-enclosed>","media-not":"not <media-in-parens>","media-or":"<media-in-parens> [or <media-in-parens>]+","media-query":"<media-condition>|[not|only]? <media-type> [and <media-condition-without-or>]?","media-query-list":"<media-query>#","media-type":"<ident>","mf-boolean":"<mf-name>","mf-name":"<ident>","mf-plain":"<mf-name> : <mf-value>","mf-range":"<mf-name> ['<'|'>']? '='? <mf-value>|<mf-value> ['<'|'>']? '='? <mf-name>|<mf-value> '<' '='? <mf-name> '<' '='? <mf-value>|<mf-value> '>' '='? <mf-name> '>' '='? <mf-value>","mf-value":"<number>|<dimension>|<ident>|<ratio>","min()":"min( <calc-sum># )","minmax()":"minmax( [<length-percentage>|min-content|max-content|auto] , [<length-percentage>|<flex>|min-content|max-content|auto] )","mod()":"mod( <calc-sum> , <calc-sum> )","name-repeat":"repeat( [<integer [1,\u221E]>|auto-fill] , <line-names>+ )","named-color":"transparent|aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen|<-non-standard-color>","namespace-prefix":"<ident>","ns-prefix":"[<ident-token>|'*']? '|'","number-percentage":"<number>|<percentage>","numeric-figure-values":"[lining-nums|oldstyle-nums]","numeric-fraction-values":"[diagonal-fractions|stacked-fractions]","numeric-spacing-values":"[proportional-nums|tabular-nums]",nth:"<an-plus-b>|even|odd","opacity()":"opacity( [<number-percentage>] )","overflow-position":"unsafe|safe","outline-radius":"<length>|<percentage>","page-body":"<declaration>? [; <page-body>]?|<page-margin-box> <page-body>","page-margin-box":"<page-margin-box-type> '{' <declaration-list> '}'","page-margin-box-type":"@top-left-corner|@top-left|@top-center|@top-right|@top-right-corner|@bottom-left-corner|@bottom-left|@bottom-center|@bottom-right|@bottom-right-corner|@left-top|@left-middle|@left-bottom|@right-top|@right-middle|@right-bottom","page-selector-list":"[<page-selector>#]?","page-selector":"<pseudo-page>+|<ident> <pseudo-page>*","page-size":"A5|A4|A3|B5|B4|JIS-B5|JIS-B4|letter|legal|ledger","path()":"path( [<fill-rule> ,]? <string> )","paint()":"paint( <ident> , <declaration-value>? )","perspective()":"perspective( [<length [0,\u221E]>|none] )","polygon()":"polygon( <fill-rule>? , [<length-percentage> <length-percentage>]# )",position:"[[left|center|right]||[top|center|bottom]|[left|center|right|<length-percentage>] [top|center|bottom|<length-percentage>]?|[[left|right] <length-percentage>]&&[[top|bottom] <length-percentage>]]","pow()":"pow( <calc-sum> , <calc-sum> )","pseudo-class-selector":"':' <ident-token>|':' <function-token> <any-value> ')'","pseudo-element-selector":"':' <pseudo-class-selector>","pseudo-page":": [left|right|first|blank]",quote:"open-quote|close-quote|no-open-quote|no-close-quote","radial-gradient()":"radial-gradient( [<ending-shape>||<size>]? [at <position>]? , <color-stop-list> )",ratio:"<number [0,\u221E]> [/ <number [0,\u221E]>]?","relative-selector":"<combinator>? <complex-selector>","relative-selector-list":"<relative-selector>#","relative-size":"larger|smaller","rem()":"rem( <calc-sum> , <calc-sum> )","repeat-style":"repeat-x|repeat-y|[repeat|space|round|no-repeat]{1,2}","repeating-conic-gradient()":"repeating-conic-gradient( [from <angle>]? [at <position>]? , <angular-color-stop-list> )","repeating-linear-gradient()":"repeating-linear-gradient( [<angle>|to <side-or-corner>]? , <color-stop-list> )","repeating-radial-gradient()":"repeating-radial-gradient( [<ending-shape>||<size>]? [at <position>]? , <color-stop-list> )","reversed-counter-name":"reversed( <counter-name> )","rgb()":"rgb( <percentage>{3} [/ <alpha-value>]? )|rgb( <number>{3} [/ <alpha-value>]? )|rgb( <percentage>#{3} , <alpha-value>? )|rgb( <number>#{3} , <alpha-value>? )","rgba()":"rgba( <percentage>{3} [/ <alpha-value>]? )|rgba( <number>{3} [/ <alpha-value>]? )|rgba( <percentage>#{3} , <alpha-value>? )|rgba( <number>#{3} , <alpha-value>? )","rotate()":"rotate( [<angle>|<zero>] )","rotate3d()":"rotate3d( <number> , <number> , <number> , [<angle>|<zero>] )","rotateX()":"rotateX( [<angle>|<zero>] )","rotateY()":"rotateY( [<angle>|<zero>] )","rotateZ()":"rotateZ( [<angle>|<zero>] )","round()":"round( <rounding-strategy>? , <calc-sum> , <calc-sum> )","rounding-strategy":"nearest|up|down|to-zero","saturate()":"saturate( <number-percentage> )","scale()":"scale( [<number>|<percentage>]#{1,2} )","scale3d()":"scale3d( [<number>|<percentage>]#{3} )","scaleX()":"scaleX( [<number>|<percentage>] )","scaleY()":"scaleY( [<number>|<percentage>] )","scaleZ()":"scaleZ( [<number>|<percentage>] )",scroller:"root|nearest","self-position":"center|start|end|self-start|self-end|flex-start|flex-end","shape-radius":"<length-percentage>|closest-side|farthest-side","sign()":"sign( <calc-sum> )","skew()":"skew( [<angle>|<zero>] , [<angle>|<zero>]? )","skewX()":"skewX( [<angle>|<zero>] )","skewY()":"skewY( [<angle>|<zero>] )","sepia()":"sepia( <number-percentage> )",shadow:"inset?&&<length>{2,4}&&<color>?","shadow-t":"[<length>{2,3}&&<color>?]",shape:"rect( <top> , <right> , <bottom> , <left> )|rect( <top> <right> <bottom> <left> )","shape-box":"<box>|margin-box","side-or-corner":"[left|right]||[top|bottom]","sin()":"sin( <calc-sum> )","single-animation":"<time>||<easing-function>||<time>||<single-animation-iteration-count>||<single-animation-direction>||<single-animation-fill-mode>||<single-animation-play-state>||[none|<keyframes-name>]","single-animation-direction":"normal|reverse|alternate|alternate-reverse","single-animation-fill-mode":"none|forwards|backwards|both","single-animation-iteration-count":"infinite|<number>","single-animation-play-state":"running|paused","single-animation-timeline":"auto|none|<timeline-name>|scroll( <axis>? <scroller>? )","single-transition":"[none|<single-transition-property>]||<time>||<easing-function>||<time>","single-transition-property":"all|<custom-ident>",size:"closest-side|farthest-side|closest-corner|farthest-corner|<length>|<length-percentage>{2}","sqrt()":"sqrt( <calc-sum> )","step-position":"jump-start|jump-end|jump-none|jump-both|start|end","step-timing-function":"step-start|step-end|steps( <integer> [, <step-position>]? )","subclass-selector":"<id-selector>|<class-selector>|<attribute-selector>|<pseudo-class-selector>","supports-condition":"not <supports-in-parens>|<supports-in-parens> [and <supports-in-parens>]*|<supports-in-parens> [or <supports-in-parens>]*","supports-in-parens":"( <supports-condition> )|<supports-feature>|<general-enclosed>","supports-feature":"<supports-decl>|<supports-selector-fn>","supports-decl":"( <declaration> )","supports-selector-fn":"selector( <complex-selector> )",symbol:"<string>|<image>|<custom-ident>","tan()":"tan( <calc-sum> )",target:"<target-counter()>|<target-counters()>|<target-text()>","target-counter()":"target-counter( [<string>|<url>] , <custom-ident> , <counter-style>? )","target-counters()":"target-counters( [<string>|<url>] , <custom-ident> , <string> , <counter-style>? )","target-text()":"target-text( [<string>|<url>] , [content|before|after|first-letter]? )","time-percentage":"<time>|<percentage>","timeline-name":"<custom-ident>|<string>","easing-function":"linear|<cubic-bezier-timing-function>|<step-timing-function>","track-breadth":"<length-percentage>|<flex>|min-content|max-content|auto","track-list":"[<line-names>? [<track-size>|<track-repeat>]]+ <line-names>?","track-repeat":"repeat( [<integer [1,\u221E]>] , [<line-names>? <track-size>]+ <line-names>? )","track-size":"<track-breadth>|minmax( <inflexible-breadth> , <track-breadth> )|fit-content( <length-percentage> )","transform-function":"<matrix()>|<translate()>|<translateX()>|<translateY()>|<scale()>|<scaleX()>|<scaleY()>|<rotate()>|<skew()>|<skewX()>|<skewY()>|<matrix3d()>|<translate3d()>|<translateZ()>|<scale3d()>|<scaleZ()>|<rotate3d()>|<rotateX()>|<rotateY()>|<rotateZ()>|<perspective()>","transform-list":"<transform-function>+","translate()":"translate( <length-percentage> , <length-percentage>? )","translate3d()":"translate3d( <length-percentage> , <length-percentage> , <length> )","translateX()":"translateX( <length-percentage> )","translateY()":"translateY( <length-percentage> )","translateZ()":"translateZ( <length> )","type-or-unit":"string|color|url|integer|number|length|angle|time|frequency|cap|ch|em|ex|ic|lh|rlh|rem|vb|vi|vw|vh|vmin|vmax|mm|Q|cm|in|pt|pc|px|deg|grad|rad|turn|ms|s|Hz|kHz|%","type-selector":"<wq-name>|<ns-prefix>? '*'","var()":"var( <custom-property-name> , <declaration-value>? )","viewport-length":"auto|<length-percentage>","visual-box":"content-box|padding-box|border-box","wq-name":"<ns-prefix>? <ident-token>","-legacy-gradient":"<-webkit-gradient()>|<-legacy-linear-gradient>|<-legacy-repeating-linear-gradient>|<-legacy-radial-gradient>|<-legacy-repeating-radial-gradient>","-legacy-linear-gradient":"-moz-linear-gradient( <-legacy-linear-gradient-arguments> )|-webkit-linear-gradient( <-legacy-linear-gradient-arguments> )|-o-linear-gradient( <-legacy-linear-gradient-arguments> )","-legacy-repeating-linear-gradient":"-moz-repeating-linear-gradient( <-legacy-linear-gradient-arguments> )|-webkit-repeating-linear-gradient( <-legacy-linear-gradient-arguments> )|-o-repeating-linear-gradient( <-legacy-linear-gradient-arguments> )","-legacy-linear-gradient-arguments":"[<angle>|<side-or-corner>]? , <color-stop-list>","-legacy-radial-gradient":"-moz-radial-gradient( <-legacy-radial-gradient-arguments> )|-webkit-radial-gradient( <-legacy-radial-gradient-arguments> )|-o-radial-gradient( <-legacy-radial-gradient-arguments> )","-legacy-repeating-radial-gradient":"-moz-repeating-radial-gradient( <-legacy-radial-gradient-arguments> )|-webkit-repeating-radial-gradient( <-legacy-radial-gradient-arguments> )|-o-repeating-radial-gradient( <-legacy-radial-gradient-arguments> )","-legacy-radial-gradient-arguments":"[<position> ,]? [[[<-legacy-radial-gradient-shape>||<-legacy-radial-gradient-size>]|[<length>|<percentage>]{2}] ,]? <color-stop-list>","-legacy-radial-gradient-size":"closest-side|closest-corner|farthest-side|farthest-corner|contain|cover","-legacy-radial-gradient-shape":"circle|ellipse","-non-standard-font":"-apple-system-body|-apple-system-headline|-apple-system-subheadline|-apple-system-caption1|-apple-system-caption2|-apple-system-footnote|-apple-system-short-body|-apple-system-short-headline|-apple-system-short-subheadline|-apple-system-short-caption1|-apple-system-short-footnote|-apple-system-tall-body","-non-standard-color":"-moz-ButtonDefault|-moz-ButtonHoverFace|-moz-ButtonHoverText|-moz-CellHighlight|-moz-CellHighlightText|-moz-Combobox|-moz-ComboboxText|-moz-Dialog|-moz-DialogText|-moz-dragtargetzone|-moz-EvenTreeRow|-moz-Field|-moz-FieldText|-moz-html-CellHighlight|-moz-html-CellHighlightText|-moz-mac-accentdarkestshadow|-moz-mac-accentdarkshadow|-moz-mac-accentface|-moz-mac-accentlightesthighlight|-moz-mac-accentlightshadow|-moz-mac-accentregularhighlight|-moz-mac-accentregularshadow|-moz-mac-chrome-active|-moz-mac-chrome-inactive|-moz-mac-focusring|-moz-mac-menuselect|-moz-mac-menushadow|-moz-mac-menutextselect|-moz-MenuHover|-moz-MenuHoverText|-moz-MenuBarText|-moz-MenuBarHoverText|-moz-nativehyperlinktext|-moz-OddTreeRow|-moz-win-communicationstext|-moz-win-mediatext|-moz-activehyperlinktext|-moz-default-background-color|-moz-default-color|-moz-hyperlinktext|-moz-visitedhyperlinktext|-webkit-activelink|-webkit-focus-ring-color|-webkit-link|-webkit-text","-non-standard-image-rendering":"optimize-contrast|-moz-crisp-edges|-o-crisp-edges|-webkit-optimize-contrast","-non-standard-overflow":"-moz-scrollbars-none|-moz-scrollbars-horizontal|-moz-scrollbars-vertical|-moz-hidden-unscrollable","-non-standard-width":"fill-available|min-intrinsic|intrinsic|-moz-available|-moz-fit-content|-moz-min-content|-moz-max-content|-webkit-min-content|-webkit-max-content","-webkit-gradient()":"-webkit-gradient( <-webkit-gradient-type> , <-webkit-gradient-point> [, <-webkit-gradient-point>|, <-webkit-gradient-radius> , <-webkit-gradient-point>] [, <-webkit-gradient-radius>]? [, <-webkit-gradient-color-stop>]* )","-webkit-gradient-color-stop":"from( <color> )|color-stop( [<number-zero-one>|<percentage>] , <color> )|to( <color> )","-webkit-gradient-point":"[left|center|right|<length-percentage>] [top|center|bottom|<length-percentage>]","-webkit-gradient-radius":"<length>|<percentage>","-webkit-gradient-type":"linear|radial","-webkit-mask-box-repeat":"repeat|stretch|round","-webkit-mask-clip-style":"border|border-box|padding|padding-box|content|content-box|text","-ms-filter-function-list":"<-ms-filter-function>+","-ms-filter-function":"<-ms-filter-function-progid>|<-ms-filter-function-legacy>","-ms-filter-function-progid":"'progid:' [<ident-token> '.']* [<ident-token>|<function-token> <any-value>? )]","-ms-filter-function-legacy":"<ident-token>|<function-token> <any-value>? )","-ms-filter":"<string>",age:"child|young|old","attr-name":"<wq-name>","attr-fallback":"<any-value>","bg-clip":"<box>|border|text",bottom:"<length>|auto","generic-voice":"[<age>? <gender> <integer>?]",gender:"male|female|neutral",left:"<length>|auto","mask-image":"<mask-reference>#",paint:"none|<color>|<url> [none|<color>]?|context-fill|context-stroke",right:"<length>|auto","single-animation-composition":"replace|add|accumulate","svg-length":"<percentage>|<length>|<number>","svg-writing-mode":"lr-tb|rl-tb|tb-rl|lr|rl|tb",top:"<length>|auto",x:"<number>",y:"<number>",declaration:"<ident-token> : <declaration-value>? ['!' important]?","declaration-list":"[<declaration>? ';']* <declaration>?",url:"url( <string> <url-modifier>* )|<url-token>","url-modifier":"<ident>|<function-token> <any-value> )","number-zero-one":"<number [0,1]>","number-one-or-greater":"<number [1,\u221E]>","-non-standard-display":"-ms-inline-flexbox|-ms-grid|-ms-inline-grid|-webkit-flex|-webkit-inline-flex|-webkit-box|-webkit-inline-box|-moz-inline-stack|-moz-box|-moz-inline-box"},properties:{"--*":"<declaration-value>","-ms-accelerator":"false|true","-ms-block-progression":"tb|rl|bt|lr","-ms-content-zoom-chaining":"none|chained","-ms-content-zooming":"none|zoom","-ms-content-zoom-limit":"<'-ms-content-zoom-limit-min'> <'-ms-content-zoom-limit-max'>","-ms-content-zoom-limit-max":"<percentage>","-ms-content-zoom-limit-min":"<percentage>","-ms-content-zoom-snap":"<'-ms-content-zoom-snap-type'>||<'-ms-content-zoom-snap-points'>","-ms-content-zoom-snap-points":"snapInterval( <percentage> , <percentage> )|snapList( <percentage># )","-ms-content-zoom-snap-type":"none|proximity|mandatory","-ms-filter":"<string>","-ms-flow-from":"[none|<custom-ident>]#","-ms-flow-into":"[none|<custom-ident>]#","-ms-grid-columns":"none|<track-list>|<auto-track-list>","-ms-grid-rows":"none|<track-list>|<auto-track-list>","-ms-high-contrast-adjust":"auto|none","-ms-hyphenate-limit-chars":"auto|<integer>{1,3}","-ms-hyphenate-limit-lines":"no-limit|<integer>","-ms-hyphenate-limit-zone":"<percentage>|<length>","-ms-ime-align":"auto|after","-ms-overflow-style":"auto|none|scrollbar|-ms-autohiding-scrollbar","-ms-scrollbar-3dlight-color":"<color>","-ms-scrollbar-arrow-color":"<color>","-ms-scrollbar-base-color":"<color>","-ms-scrollbar-darkshadow-color":"<color>","-ms-scrollbar-face-color":"<color>","-ms-scrollbar-highlight-color":"<color>","-ms-scrollbar-shadow-color":"<color>","-ms-scrollbar-track-color":"<color>","-ms-scroll-chaining":"chained|none","-ms-scroll-limit":"<'-ms-scroll-limit-x-min'> <'-ms-scroll-limit-y-min'> <'-ms-scroll-limit-x-max'> <'-ms-scroll-limit-y-max'>","-ms-scroll-limit-x-max":"auto|<length>","-ms-scroll-limit-x-min":"<length>","-ms-scroll-limit-y-max":"auto|<length>","-ms-scroll-limit-y-min":"<length>","-ms-scroll-rails":"none|railed","-ms-scroll-snap-points-x":"snapInterval( <length-percentage> , <length-percentage> )|snapList( <length-percentage># )","-ms-scroll-snap-points-y":"snapInterval( <length-percentage> , <length-percentage> )|snapList( <length-percentage># )","-ms-scroll-snap-type":"none|proximity|mandatory","-ms-scroll-snap-x":"<'-ms-scroll-snap-type'> <'-ms-scroll-snap-points-x'>","-ms-scroll-snap-y":"<'-ms-scroll-snap-type'> <'-ms-scroll-snap-points-y'>","-ms-scroll-translation":"none|vertical-to-horizontal","-ms-text-autospace":"none|ideograph-alpha|ideograph-numeric|ideograph-parenthesis|ideograph-space","-ms-touch-select":"grippers|none","-ms-user-select":"none|element|text","-ms-wrap-flow":"auto|both|start|end|maximum|clear","-ms-wrap-margin":"<length>","-ms-wrap-through":"wrap|none","-moz-appearance":"none|button|button-arrow-down|button-arrow-next|button-arrow-previous|button-arrow-up|button-bevel|button-focus|caret|checkbox|checkbox-container|checkbox-label|checkmenuitem|dualbutton|groupbox|listbox|listitem|menuarrow|menubar|menucheckbox|menuimage|menuitem|menuitemtext|menulist|menulist-button|menulist-text|menulist-textfield|menupopup|menuradio|menuseparator|meterbar|meterchunk|progressbar|progressbar-vertical|progresschunk|progresschunk-vertical|radio|radio-container|radio-label|radiomenuitem|range|range-thumb|resizer|resizerpanel|scale-horizontal|scalethumbend|scalethumb-horizontal|scalethumbstart|scalethumbtick|scalethumb-vertical|scale-vertical|scrollbarbutton-down|scrollbarbutton-left|scrollbarbutton-right|scrollbarbutton-up|scrollbarthumb-horizontal|scrollbarthumb-vertical|scrollbartrack-horizontal|scrollbartrack-vertical|searchfield|separator|sheet|spinner|spinner-downbutton|spinner-textfield|spinner-upbutton|splitter|statusbar|statusbarpanel|tab|tabpanel|tabpanels|tab-scroll-arrow-back|tab-scroll-arrow-forward|textfield|textfield-multiline|toolbar|toolbarbutton|toolbarbutton-dropdown|toolbargripper|toolbox|tooltip|treeheader|treeheadercell|treeheadersortarrow|treeitem|treeline|treetwisty|treetwistyopen|treeview|-moz-mac-unified-toolbar|-moz-win-borderless-glass|-moz-win-browsertabbar-toolbox|-moz-win-communicationstext|-moz-win-communications-toolbox|-moz-win-exclude-glass|-moz-win-glass|-moz-win-mediatext|-moz-win-media-toolbox|-moz-window-button-box|-moz-window-button-box-maximized|-moz-window-button-close|-moz-window-button-maximize|-moz-window-button-minimize|-moz-window-button-restore|-moz-window-frame-bottom|-moz-window-frame-left|-moz-window-frame-right|-moz-window-titlebar|-moz-window-titlebar-maximized","-moz-binding":"<url>|none","-moz-border-bottom-colors":"<color>+|none","-moz-border-left-colors":"<color>+|none","-moz-border-right-colors":"<color>+|none","-moz-border-top-colors":"<color>+|none","-moz-context-properties":"none|[fill|fill-opacity|stroke|stroke-opacity]#","-moz-float-edge":"border-box|content-box|margin-box|padding-box","-moz-force-broken-image-icon":"0|1","-moz-image-region":"<shape>|auto","-moz-orient":"inline|block|horizontal|vertical","-moz-outline-radius":"<outline-radius>{1,4} [/ <outline-radius>{1,4}]?","-moz-outline-radius-bottomleft":"<outline-radius>","-moz-outline-radius-bottomright":"<outline-radius>","-moz-outline-radius-topleft":"<outline-radius>","-moz-outline-radius-topright":"<outline-radius>","-moz-stack-sizing":"ignore|stretch-to-fit","-moz-text-blink":"none|blink","-moz-user-focus":"ignore|normal|select-after|select-before|select-menu|select-same|select-all|none","-moz-user-input":"auto|none|enabled|disabled","-moz-user-modify":"read-only|read-write|write-only","-moz-window-dragging":"drag|no-drag","-moz-window-shadow":"default|menu|tooltip|sheet|none","-webkit-appearance":"none|button|button-bevel|caps-lock-indicator|caret|checkbox|default-button|inner-spin-button|listbox|listitem|media-controls-background|media-controls-fullscreen-background|media-current-time-display|media-enter-fullscreen-button|media-exit-fullscreen-button|media-fullscreen-button|media-mute-button|media-overlay-play-button|media-play-button|media-seek-back-button|media-seek-forward-button|media-slider|media-sliderthumb|media-time-remaining-display|media-toggle-closed-captions-button|media-volume-slider|media-volume-slider-container|media-volume-sliderthumb|menulist|menulist-button|menulist-text|menulist-textfield|meter|progress-bar|progress-bar-value|push-button|radio|scrollbarbutton-down|scrollbarbutton-left|scrollbarbutton-right|scrollbarbutton-up|scrollbargripper-horizontal|scrollbargripper-vertical|scrollbarthumb-horizontal|scrollbarthumb-vertical|scrollbartrack-horizontal|scrollbartrack-vertical|searchfield|searchfield-cancel-button|searchfield-decoration|searchfield-results-button|searchfield-results-decoration|slider-horizontal|slider-vertical|sliderthumb-horizontal|sliderthumb-vertical|square-button|textarea|textfield|-apple-pay-button","-webkit-border-before":"<'border-width'>||<'border-style'>||<color>","-webkit-border-before-color":"<color>","-webkit-border-before-style":"<'border-style'>","-webkit-border-before-width":"<'border-width'>","-webkit-box-reflect":"[above|below|right|left]? <length>? <image>?","-webkit-line-clamp":"none|<integer>","-webkit-mask":"[<mask-reference>||<position> [/ <bg-size>]?||<repeat-style>||[<box>|border|padding|content|text]||[<box>|border|padding|content]]#","-webkit-mask-attachment":"<attachment>#","-webkit-mask-clip":"[<box>|border|padding|content|text]#","-webkit-mask-composite":"<composite-style>#","-webkit-mask-image":"<mask-reference>#","-webkit-mask-origin":"[<box>|border|padding|content]#","-webkit-mask-position":"<position>#","-webkit-mask-position-x":"[<length-percentage>|left|center|right]#","-webkit-mask-position-y":"[<length-percentage>|top|center|bottom]#","-webkit-mask-repeat":"<repeat-style>#","-webkit-mask-repeat-x":"repeat|no-repeat|space|round","-webkit-mask-repeat-y":"repeat|no-repeat|space|round","-webkit-mask-size":"<bg-size>#","-webkit-overflow-scrolling":"auto|touch","-webkit-tap-highlight-color":"<color>","-webkit-text-fill-color":"<color>","-webkit-text-stroke":"<length>||<color>","-webkit-text-stroke-color":"<color>","-webkit-text-stroke-width":"<length>","-webkit-touch-callout":"default|none","-webkit-user-modify":"read-only|read-write|read-write-plaintext-only","accent-color":"auto|<color>","align-content":"normal|<baseline-position>|<content-distribution>|<overflow-position>? <content-position>","align-items":"normal|stretch|<baseline-position>|[<overflow-position>? <self-position>]","align-self":"auto|normal|stretch|<baseline-position>|<overflow-position>? <self-position>","align-tracks":"[normal|<baseline-position>|<content-distribution>|<overflow-position>? <content-position>]#",all:"initial|inherit|unset|revert|revert-layer",animation:"<single-animation>#","animation-composition":"<single-animation-composition>#","animation-delay":"<time>#","animation-direction":"<single-animation-direction>#","animation-duration":"<time>#","animation-fill-mode":"<single-animation-fill-mode>#","animation-iteration-count":"<single-animation-iteration-count>#","animation-name":"[none|<keyframes-name>]#","animation-play-state":"<single-animation-play-state>#","animation-timing-function":"<easing-function>#","animation-timeline":"<single-animation-timeline>#",appearance:"none|auto|textfield|menulist-button|<compat-auto>","aspect-ratio":"auto|<ratio>",azimuth:"<angle>|[[left-side|far-left|left|center-left|center|center-right|right|far-right|right-side]||behind]|leftwards|rightwards","backdrop-filter":"none|<filter-function-list>","backface-visibility":"visible|hidden",background:"[<bg-layer> ,]* <final-bg-layer>","background-attachment":"<attachment>#","background-blend-mode":"<blend-mode>#","background-clip":"<bg-clip>#","background-color":"<color>","background-image":"<bg-image>#","background-origin":"<box>#","background-position":"<bg-position>#","background-position-x":"[center|[[left|right|x-start|x-end]? <length-percentage>?]!]#","background-position-y":"[center|[[top|bottom|y-start|y-end]? <length-percentage>?]!]#","background-repeat":"<repeat-style>#","background-size":"<bg-size>#","block-overflow":"clip|ellipsis|<string>","block-size":"<'width'>",border:"<line-width>||<line-style>||<color>","border-block":"<'border-top-width'>||<'border-top-style'>||<color>","border-block-color":"<'border-top-color'>{1,2}","border-block-style":"<'border-top-style'>","border-block-width":"<'border-top-width'>","border-block-end":"<'border-top-width'>||<'border-top-style'>||<color>","border-block-end-color":"<'border-top-color'>","border-block-end-style":"<'border-top-style'>","border-block-end-width":"<'border-top-width'>","border-block-start":"<'border-top-width'>||<'border-top-style'>||<color>","border-block-start-color":"<'border-top-color'>","border-block-start-style":"<'border-top-style'>","border-block-start-width":"<'border-top-width'>","border-bottom":"<line-width>||<line-style>||<color>","border-bottom-color":"<'border-top-color'>","border-bottom-left-radius":"<length-percentage>{1,2}","border-bottom-right-radius":"<length-percentage>{1,2}","border-bottom-style":"<line-style>","border-bottom-width":"<line-width>","border-collapse":"collapse|separate","border-color":"<color>{1,4}","border-end-end-radius":"<length-percentage>{1,2}","border-end-start-radius":"<length-percentage>{1,2}","border-image":"<'border-image-source'>||<'border-image-slice'> [/ <'border-image-width'>|/ <'border-image-width'>? / <'border-image-outset'>]?||<'border-image-repeat'>","border-image-outset":"[<length>|<number>]{1,4}","border-image-repeat":"[stretch|repeat|round|space]{1,2}","border-image-slice":"<number-percentage>{1,4}&&fill?","border-image-source":"none|<image>","border-image-width":"[<length-percentage>|<number>|auto]{1,4}","border-inline":"<'border-top-width'>||<'border-top-style'>||<color>","border-inline-end":"<'border-top-width'>||<'border-top-style'>||<color>","border-inline-color":"<'border-top-color'>{1,2}","border-inline-style":"<'border-top-style'>","border-inline-width":"<'border-top-width'>","border-inline-end-color":"<'border-top-color'>","border-inline-end-style":"<'border-top-style'>","border-inline-end-width":"<'border-top-width'>","border-inline-start":"<'border-top-width'>||<'border-top-style'>||<color>","border-inline-start-color":"<'border-top-color'>","border-inline-start-style":"<'border-top-style'>","border-inline-start-width":"<'border-top-width'>","border-left":"<line-width>||<line-style>||<color>","border-left-color":"<color>","border-left-style":"<line-style>","border-left-width":"<line-width>","border-radius":"<length-percentage>{1,4} [/ <length-percentage>{1,4}]?","border-right":"<line-width>||<line-style>||<color>","border-right-color":"<color>","border-right-style":"<line-style>","border-right-width":"<line-width>","border-spacing":"<length> <length>?","border-start-end-radius":"<length-percentage>{1,2}","border-start-start-radius":"<length-percentage>{1,2}","border-style":"<line-style>{1,4}","border-top":"<line-width>||<line-style>||<color>","border-top-color":"<color>","border-top-left-radius":"<length-percentage>{1,2}","border-top-right-radius":"<length-percentage>{1,2}","border-top-style":"<line-style>","border-top-width":"<line-width>","border-width":"<line-width>{1,4}",bottom:"<length>|<percentage>|auto","box-align":"start|center|end|baseline|stretch","box-decoration-break":"slice|clone","box-direction":"normal|reverse|inherit","box-flex":"<number>","box-flex-group":"<integer>","box-lines":"single|multiple","box-ordinal-group":"<integer>","box-orient":"horizontal|vertical|inline-axis|block-axis|inherit","box-pack":"start|center|end|justify","box-shadow":"none|<shadow>#","box-sizing":"content-box|border-box","break-after":"auto|avoid|always|all|avoid-page|page|left|right|recto|verso|avoid-column|column|avoid-region|region","break-before":"auto|avoid|always|all|avoid-page|page|left|right|recto|verso|avoid-column|column|avoid-region|region","break-inside":"auto|avoid|avoid-page|avoid-column|avoid-region","caption-side":"top|bottom|block-start|block-end|inline-start|inline-end",caret:"<'caret-color'>||<'caret-shape'>","caret-color":"auto|<color>","caret-shape":"auto|bar|block|underscore",clear:"none|left|right|both|inline-start|inline-end",clip:"<shape>|auto","clip-path":"<clip-source>|[<basic-shape>||<geometry-box>]|none",color:"<color>","print-color-adjust":"economy|exact","color-scheme":"normal|[light|dark|<custom-ident>]+&&only?","column-count":"<integer>|auto","column-fill":"auto|balance|balance-all","column-gap":"normal|<length-percentage>","column-rule":"<'column-rule-width'>||<'column-rule-style'>||<'column-rule-color'>","column-rule-color":"<color>","column-rule-style":"<'border-style'>","column-rule-width":"<'border-width'>","column-span":"none|all","column-width":"<length>|auto",columns:"<'column-width'>||<'column-count'>",contain:"none|strict|content|[[size||inline-size]||layout||style||paint]","contain-intrinsic-size":"[none|<length>|auto <length>]{1,2}","contain-intrinsic-block-size":"none|<length>|auto <length>","contain-intrinsic-height":"none|<length>|auto <length>","contain-intrinsic-inline-size":"none|<length>|auto <length>","contain-intrinsic-width":"none|<length>|auto <length>",content:"normal|none|[<content-replacement>|<content-list>] [/ [<string>|<counter>]+]?","content-visibility":"visible|auto|hidden","counter-increment":"[<counter-name> <integer>?]+|none","counter-reset":"[<counter-name> <integer>?|<reversed-counter-name> <integer>?]+|none","counter-set":"[<counter-name> <integer>?]+|none",cursor:"[[<url> [<x> <y>]? ,]* [auto|default|none|context-menu|help|pointer|progress|wait|cell|crosshair|text|vertical-text|alias|copy|move|no-drop|not-allowed|e-resize|n-resize|ne-resize|nw-resize|s-resize|se-resize|sw-resize|w-resize|ew-resize|ns-resize|nesw-resize|nwse-resize|col-resize|row-resize|all-scroll|zoom-in|zoom-out|grab|grabbing|hand|-webkit-grab|-webkit-grabbing|-webkit-zoom-in|-webkit-zoom-out|-moz-grab|-moz-grabbing|-moz-zoom-in|-moz-zoom-out]]",direction:"ltr|rtl",display:"[<display-outside>||<display-inside>]|<display-listitem>|<display-internal>|<display-box>|<display-legacy>|<-non-standard-display>","empty-cells":"show|hide",filter:"none|<filter-function-list>|<-ms-filter-function-list>",flex:"none|[<'flex-grow'> <'flex-shrink'>?||<'flex-basis'>]","flex-basis":"content|<'width'>","flex-direction":"row|row-reverse|column|column-reverse","flex-flow":"<'flex-direction'>||<'flex-wrap'>","flex-grow":"<number>","flex-shrink":"<number>","flex-wrap":"nowrap|wrap|wrap-reverse",float:"left|right|none|inline-start|inline-end",font:"[[<'font-style'>||<font-variant-css21>||<'font-weight'>||<'font-stretch'>]? <'font-size'> [/ <'line-height'>]? <'font-family'>]|caption|icon|menu|message-box|small-caption|status-bar","font-family":"[<family-name>|<generic-family>]#","font-feature-settings":"normal|<feature-tag-value>#","font-kerning":"auto|normal|none","font-language-override":"normal|<string>","font-optical-sizing":"auto|none","font-variation-settings":"normal|[<string> <number>]#","font-size":"<absolute-size>|<relative-size>|<length-percentage>","font-size-adjust":"none|[ex-height|cap-height|ch-width|ic-width|ic-height]? [from-font|<number>]","font-smooth":"auto|never|always|<absolute-size>|<length>","font-stretch":"<font-stretch-absolute>","font-style":"normal|italic|oblique <angle>?","font-synthesis":"none|[weight||style||small-caps]","font-variant":"normal|none|[<common-lig-values>||<discretionary-lig-values>||<historical-lig-values>||<contextual-alt-values>||stylistic( <feature-value-name> )||historical-forms||styleset( <feature-value-name># )||character-variant( <feature-value-name># )||swash( <feature-value-name> )||ornaments( <feature-value-name> )||annotation( <feature-value-name> )||[small-caps|all-small-caps|petite-caps|all-petite-caps|unicase|titling-caps]||<numeric-figure-values>||<numeric-spacing-values>||<numeric-fraction-values>||ordinal||slashed-zero||<east-asian-variant-values>||<east-asian-width-values>||ruby]","font-variant-alternates":"normal|[stylistic( <feature-value-name> )||historical-forms||styleset( <feature-value-name># )||character-variant( <feature-value-name># )||swash( <feature-value-name> )||ornaments( <feature-value-name> )||annotation( <feature-value-name> )]","font-variant-caps":"normal|small-caps|all-small-caps|petite-caps|all-petite-caps|unicase|titling-caps","font-variant-east-asian":"normal|[<east-asian-variant-values>||<east-asian-width-values>||ruby]","font-variant-ligatures":"normal|none|[<common-lig-values>||<discretionary-lig-values>||<historical-lig-values>||<contextual-alt-values>]","font-variant-numeric":"normal|[<numeric-figure-values>||<numeric-spacing-values>||<numeric-fraction-values>||ordinal||slashed-zero]","font-variant-position":"normal|sub|super","font-weight":"<font-weight-absolute>|bolder|lighter","forced-color-adjust":"auto|none",gap:"<'row-gap'> <'column-gap'>?",grid:"<'grid-template'>|<'grid-template-rows'> / [auto-flow&&dense?] <'grid-auto-columns'>?|[auto-flow&&dense?] <'grid-auto-rows'>? / <'grid-template-columns'>","grid-area":"<grid-line> [/ <grid-line>]{0,3}","grid-auto-columns":"<track-size>+","grid-auto-flow":"[row|column]||dense","grid-auto-rows":"<track-size>+","grid-column":"<grid-line> [/ <grid-line>]?","grid-column-end":"<grid-line>","grid-column-gap":"<length-percentage>","grid-column-start":"<grid-line>","grid-gap":"<'grid-row-gap'> <'grid-column-gap'>?","grid-row":"<grid-line> [/ <grid-line>]?","grid-row-end":"<grid-line>","grid-row-gap":"<length-percentage>","grid-row-start":"<grid-line>","grid-template":"none|[<'grid-template-rows'> / <'grid-template-columns'>]|[<line-names>? <string> <track-size>? <line-names>?]+ [/ <explicit-track-list>]?","grid-template-areas":"none|<string>+","grid-template-columns":"none|<track-list>|<auto-track-list>|subgrid <line-name-list>?","grid-template-rows":"none|<track-list>|<auto-track-list>|subgrid <line-name-list>?","hanging-punctuation":"none|[first||[force-end|allow-end]||last]",height:"auto|<length>|<percentage>|min-content|max-content|fit-content|fit-content( <length-percentage> )","hyphenate-character":"auto|<string>",hyphens:"none|manual|auto","image-orientation":"from-image|<angle>|[<angle>? flip]","image-rendering":"auto|crisp-edges|pixelated|optimizeSpeed|optimizeQuality|<-non-standard-image-rendering>","image-resolution":"[from-image||<resolution>]&&snap?","ime-mode":"auto|normal|active|inactive|disabled","initial-letter":"normal|[<number> <integer>?]","initial-letter-align":"[auto|alphabetic|hanging|ideographic]","inline-size":"<'width'>","input-security":"auto|none",inset:"<'top'>{1,4}","inset-block":"<'top'>{1,2}","inset-block-end":"<'top'>","inset-block-start":"<'top'>","inset-inline":"<'top'>{1,2}","inset-inline-end":"<'top'>","inset-inline-start":"<'top'>",isolation:"auto|isolate","justify-content":"normal|<content-distribution>|<overflow-position>? [<content-position>|left|right]","justify-items":"normal|stretch|<baseline-position>|<overflow-position>? [<self-position>|left|right]|legacy|legacy&&[left|right|center]","justify-self":"auto|normal|stretch|<baseline-position>|<overflow-position>? [<self-position>|left|right]","justify-tracks":"[normal|<content-distribution>|<overflow-position>? [<content-position>|left|right]]#",left:"<length>|<percentage>|auto","letter-spacing":"normal|<length-percentage>","line-break":"auto|loose|normal|strict|anywhere","line-clamp":"none|<integer>","line-height":"normal|<number>|<length>|<percentage>","line-height-step":"<length>","list-style":"<'list-style-type'>||<'list-style-position'>||<'list-style-image'>","list-style-image":"<image>|none","list-style-position":"inside|outside","list-style-type":"<counter-style>|<string>|none",margin:"[<length>|<percentage>|auto]{1,4}","margin-block":"<'margin-left'>{1,2}","margin-block-end":"<'margin-left'>","margin-block-start":"<'margin-left'>","margin-bottom":"<length>|<percentage>|auto","margin-inline":"<'margin-left'>{1,2}","margin-inline-end":"<'margin-left'>","margin-inline-start":"<'margin-left'>","margin-left":"<length>|<percentage>|auto","margin-right":"<length>|<percentage>|auto","margin-top":"<length>|<percentage>|auto","margin-trim":"none|in-flow|all",mask:"<mask-layer>#","mask-border":"<'mask-border-source'>||<'mask-border-slice'> [/ <'mask-border-width'>? [/ <'mask-border-outset'>]?]?||<'mask-border-repeat'>||<'mask-border-mode'>","mask-border-mode":"luminance|alpha","mask-border-outset":"[<length>|<number>]{1,4}","mask-border-repeat":"[stretch|repeat|round|space]{1,2}","mask-border-slice":"<number-percentage>{1,4} fill?","mask-border-source":"none|<image>","mask-border-width":"[<length-percentage>|<number>|auto]{1,4}","mask-clip":"[<geometry-box>|no-clip]#","mask-composite":"<compositing-operator>#","mask-image":"<mask-reference>#","mask-mode":"<masking-mode>#","mask-origin":"<geometry-box>#","mask-position":"<position>#","mask-repeat":"<repeat-style>#","mask-size":"<bg-size>#","mask-type":"luminance|alpha","masonry-auto-flow":"[pack|next]||[definite-first|ordered]","math-depth":"auto-add|add( <integer> )|<integer>","math-shift":"normal|compact","math-style":"normal|compact","max-block-size":"<'max-width'>","max-height":"none|<length-percentage>|min-content|max-content|fit-content|fit-content( <length-percentage> )","max-inline-size":"<'max-width'>","max-lines":"none|<integer>","max-width":"none|<length-percentage>|min-content|max-content|fit-content|fit-content( <length-percentage> )|<-non-standard-width>","min-block-size":"<'min-width'>","min-height":"auto|<length>|<percentage>|min-content|max-content|fit-content|fit-content( <length-percentage> )","min-inline-size":"<'min-width'>","min-width":"auto|<length>|<percentage>|min-content|max-content|fit-content|fit-content( <length-percentage> )|<-non-standard-width>","mix-blend-mode":"<blend-mode>|plus-lighter","object-fit":"fill|contain|cover|none|scale-down","object-position":"<position>",offset:"[<'offset-position'>? [<'offset-path'> [<'offset-distance'>||<'offset-rotate'>]?]?]! [/ <'offset-anchor'>]?","offset-anchor":"auto|<position>","offset-distance":"<length-percentage>","offset-path":"none|ray( [<angle>&&<size>&&contain?] )|<path()>|<url>|[<basic-shape>||<geometry-box>]","offset-position":"auto|<position>","offset-rotate":"[auto|reverse]||<angle>",opacity:"<alpha-value>",order:"<integer>",orphans:"<integer>",outline:"[<'outline-color'>||<'outline-style'>||<'outline-width'>]","outline-color":"<color>|invert","outline-offset":"<length>","outline-style":"auto|<'border-style'>","outline-width":"<line-width>",overflow:"[visible|hidden|clip|scroll|auto]{1,2}|<-non-standard-overflow>","overflow-anchor":"auto|none","overflow-block":"visible|hidden|clip|scroll|auto","overflow-clip-box":"padding-box|content-box","overflow-clip-margin":"<visual-box>||<length [0,\u221E]>","overflow-inline":"visible|hidden|clip|scroll|auto","overflow-wrap":"normal|break-word|anywhere","overflow-x":"visible|hidden|clip|scroll|auto","overflow-y":"visible|hidden|clip|scroll|auto","overscroll-behavior":"[contain|none|auto]{1,2}","overscroll-behavior-block":"contain|none|auto","overscroll-behavior-inline":"contain|none|auto","overscroll-behavior-x":"contain|none|auto","overscroll-behavior-y":"contain|none|auto",padding:"[<length>|<percentage>]{1,4}","padding-block":"<'padding-left'>{1,2}","padding-block-end":"<'padding-left'>","padding-block-start":"<'padding-left'>","padding-bottom":"<length>|<percentage>","padding-inline":"<'padding-left'>{1,2}","padding-inline-end":"<'padding-left'>","padding-inline-start":"<'padding-left'>","padding-left":"<length>|<percentage>","padding-right":"<length>|<percentage>","padding-top":"<length>|<percentage>","page-break-after":"auto|always|avoid|left|right|recto|verso","page-break-before":"auto|always|avoid|left|right|recto|verso","page-break-inside":"auto|avoid","paint-order":"normal|[fill||stroke||markers]",perspective:"none|<length>","perspective-origin":"<position>","place-content":"<'align-content'> <'justify-content'>?","place-items":"<'align-items'> <'justify-items'>?","place-self":"<'align-self'> <'justify-self'>?","pointer-events":"auto|none|visiblePainted|visibleFill|visibleStroke|visible|painted|fill|stroke|all|inherit",position:"static|relative|absolute|sticky|fixed|-webkit-sticky",quotes:"none|auto|[<string> <string>]+",resize:"none|both|horizontal|vertical|block|inline",right:"<length>|<percentage>|auto",rotate:"none|<angle>|[x|y|z|<number>{3}]&&<angle>","row-gap":"normal|<length-percentage>","ruby-align":"start|center|space-between|space-around","ruby-merge":"separate|collapse|auto","ruby-position":"[alternate||[over|under]]|inter-character",scale:"none|<number>{1,3}","scrollbar-color":"auto|<color>{2}","scrollbar-gutter":"auto|stable&&both-edges?","scrollbar-width":"auto|thin|none","scroll-behavior":"auto|smooth","scroll-margin":"<length>{1,4}","scroll-margin-block":"<length>{1,2}","scroll-margin-block-start":"<length>","scroll-margin-block-end":"<length>","scroll-margin-bottom":"<length>","scroll-margin-inline":"<length>{1,2}","scroll-margin-inline-start":"<length>","scroll-margin-inline-end":"<length>","scroll-margin-left":"<length>","scroll-margin-right":"<length>","scroll-margin-top":"<length>","scroll-padding":"[auto|<length-percentage>]{1,4}","scroll-padding-block":"[auto|<length-percentage>]{1,2}","scroll-padding-block-start":"auto|<length-percentage>","scroll-padding-block-end":"auto|<length-percentage>","scroll-padding-bottom":"auto|<length-percentage>","scroll-padding-inline":"[auto|<length-percentage>]{1,2}","scroll-padding-inline-start":"auto|<length-percentage>","scroll-padding-inline-end":"auto|<length-percentage>","scroll-padding-left":"auto|<length-percentage>","scroll-padding-right":"auto|<length-percentage>","scroll-padding-top":"auto|<length-percentage>","scroll-snap-align":"[none|start|end|center]{1,2}","scroll-snap-coordinate":"none|<position>#","scroll-snap-destination":"<position>","scroll-snap-points-x":"none|repeat( <length-percentage> )","scroll-snap-points-y":"none|repeat( <length-percentage> )","scroll-snap-stop":"normal|always","scroll-snap-type":"none|[x|y|block|inline|both] [mandatory|proximity]?","scroll-snap-type-x":"none|mandatory|proximity","scroll-snap-type-y":"none|mandatory|proximity","scroll-timeline":"[<'scroll-timeline-name'>||<'scroll-timeline-axis'>]#","scroll-timeline-axis":"[block|inline|vertical|horizontal]#","scroll-timeline-name":"none|<custom-ident>#","shape-image-threshold":"<alpha-value>","shape-margin":"<length-percentage>","shape-outside":"none|[<shape-box>||<basic-shape>]|<image>","tab-size":"<integer>|<length>","table-layout":"auto|fixed","text-align":"start|end|left|right|center|justify|match-parent","text-align-last":"auto|start|end|left|right|center|justify","text-combine-upright":"none|all|[digits <integer>?]","text-decoration":"<'text-decoration-line'>||<'text-decoration-style'>||<'text-decoration-color'>||<'text-decoration-thickness'>","text-decoration-color":"<color>","text-decoration-line":"none|[underline||overline||line-through||blink]|spelling-error|grammar-error","text-decoration-skip":"none|[objects||[spaces|[leading-spaces||trailing-spaces]]||edges||box-decoration]","text-decoration-skip-ink":"auto|all|none","text-decoration-style":"solid|double|dotted|dashed|wavy","text-decoration-thickness":"auto|from-font|<length>|<percentage>","text-emphasis":"<'text-emphasis-style'>||<'text-emphasis-color'>","text-emphasis-color":"<color>","text-emphasis-position":"[over|under]&&[right|left]","text-emphasis-style":"none|[[filled|open]||[dot|circle|double-circle|triangle|sesame]]|<string>","text-indent":"<length-percentage>&&hanging?&&each-line?","text-justify":"auto|inter-character|inter-word|none","text-orientation":"mixed|upright|sideways","text-overflow":"[clip|ellipsis|<string>]{1,2}","text-rendering":"auto|optimizeSpeed|optimizeLegibility|geometricPrecision","text-shadow":"none|<shadow-t>#","text-size-adjust":"none|auto|<percentage>","text-transform":"none|capitalize|uppercase|lowercase|full-width|full-size-kana","text-underline-offset":"auto|<length>|<percentage>","text-underline-position":"auto|from-font|[under||[left|right]]",top:"<length>|<percentage>|auto","touch-action":"auto|none|[[pan-x|pan-left|pan-right]||[pan-y|pan-up|pan-down]||pinch-zoom]|manipulation",transform:"none|<transform-list>","transform-box":"content-box|border-box|fill-box|stroke-box|view-box","transform-origin":"[<length-percentage>|left|center|right|top|bottom]|[[<length-percentage>|left|center|right]&&[<length-percentage>|top|center|bottom]] <length>?","transform-style":"flat|preserve-3d",transition:"<single-transition>#","transition-delay":"<time>#","transition-duration":"<time>#","transition-property":"none|<single-transition-property>#","transition-timing-function":"<easing-function>#",translate:"none|<length-percentage> [<length-percentage> <length>?]?","unicode-bidi":"normal|embed|isolate|bidi-override|isolate-override|plaintext|-moz-isolate|-moz-isolate-override|-moz-plaintext|-webkit-isolate|-webkit-isolate-override|-webkit-plaintext","user-select":"auto|text|none|contain|all","vertical-align":"baseline|sub|super|text-top|text-bottom|middle|top|bottom|<percentage>|<length>",visibility:"visible|hidden|collapse","white-space":"normal|pre|nowrap|pre-wrap|pre-line|break-spaces",widows:"<integer>",width:"auto|<length>|<percentage>|min-content|max-content|fit-content|fit-content( <length-percentage> )|fill|stretch|intrinsic|-moz-max-content|-webkit-max-content|-moz-fit-content|-webkit-fit-content","will-change":"auto|<animateable-feature>#","word-break":"normal|break-all|keep-all|break-word","word-spacing":"normal|<length>","word-wrap":"normal|break-word","writing-mode":"horizontal-tb|vertical-rl|vertical-lr|sideways-rl|sideways-lr|<svg-writing-mode>","z-index":"auto|<integer>",zoom:"normal|reset|<number>|<percentage>","-moz-background-clip":"padding|border","-moz-border-radius-bottomleft":"<'border-bottom-left-radius'>","-moz-border-radius-bottomright":"<'border-bottom-right-radius'>","-moz-border-radius-topleft":"<'border-top-left-radius'>","-moz-border-radius-topright":"<'border-bottom-right-radius'>","-moz-control-character-visibility":"visible|hidden","-moz-osx-font-smoothing":"auto|grayscale","-moz-user-select":"none|text|all|-moz-none","-ms-flex-align":"start|end|center|baseline|stretch","-ms-flex-item-align":"auto|start|end|center|baseline|stretch","-ms-flex-line-pack":"start|end|center|justify|distribute|stretch","-ms-flex-negative":"<'flex-shrink'>","-ms-flex-pack":"start|end|center|justify|distribute","-ms-flex-order":"<integer>","-ms-flex-positive":"<'flex-grow'>","-ms-flex-preferred-size":"<'flex-basis'>","-ms-interpolation-mode":"nearest-neighbor|bicubic","-ms-grid-column-align":"start|end|center|stretch","-ms-grid-row-align":"start|end|center|stretch","-ms-hyphenate-limit-last":"none|always|column|page|spread","-webkit-background-clip":"[<box>|border|padding|content|text]#","-webkit-column-break-after":"always|auto|avoid","-webkit-column-break-before":"always|auto|avoid","-webkit-column-break-inside":"always|auto|avoid","-webkit-font-smoothing":"auto|none|antialiased|subpixel-antialiased","-webkit-mask-box-image":"[<url>|<gradient>|none] [<length-percentage>{4} <-webkit-mask-box-repeat>{2}]?","-webkit-print-color-adjust":"economy|exact","-webkit-text-security":"none|circle|disc|square","-webkit-user-drag":"none|element|auto","-webkit-user-select":"auto|none|text|all","alignment-baseline":"auto|baseline|before-edge|text-before-edge|middle|central|after-edge|text-after-edge|ideographic|alphabetic|hanging|mathematical","baseline-shift":"baseline|sub|super|<svg-length>",behavior:"<url>+","clip-rule":"nonzero|evenodd",cue:"<'cue-before'> <'cue-after'>?","cue-after":"<url> <decibel>?|none","cue-before":"<url> <decibel>?|none","dominant-baseline":"auto|use-script|no-change|reset-size|ideographic|alphabetic|hanging|mathematical|central|middle|text-after-edge|text-before-edge",fill:"<paint>","fill-opacity":"<number-zero-one>","fill-rule":"nonzero|evenodd","glyph-orientation-horizontal":"<angle>","glyph-orientation-vertical":"<angle>",kerning:"auto|<svg-length>",marker:"none|<url>","marker-end":"none|<url>","marker-mid":"none|<url>","marker-start":"none|<url>",pause:"<'pause-before'> <'pause-after'>?","pause-after":"<time>|none|x-weak|weak|medium|strong|x-strong","pause-before":"<time>|none|x-weak|weak|medium|strong|x-strong",rest:"<'rest-before'> <'rest-after'>?","rest-after":"<time>|none|x-weak|weak|medium|strong|x-strong","rest-before":"<time>|none|x-weak|weak|medium|strong|x-strong","shape-rendering":"auto|optimizeSpeed|crispEdges|geometricPrecision",src:"[<url> [format( <string># )]?|local( <family-name> )]#",speak:"auto|none|normal","speak-as":"normal|spell-out||digits||[literal-punctuation|no-punctuation]",stroke:"<paint>","stroke-dasharray":"none|[<svg-length>+]#","stroke-dashoffset":"<svg-length>","stroke-linecap":"butt|round|square","stroke-linejoin":"miter|round|bevel","stroke-miterlimit":"<number-one-or-greater>","stroke-opacity":"<number-zero-one>","stroke-width":"<svg-length>","text-anchor":"start|middle|end","unicode-range":"<urange>#","voice-balance":"<number>|left|center|right|leftwards|rightwards","voice-duration":"auto|<time>","voice-family":"[[<family-name>|<generic-voice>] ,]* [<family-name>|<generic-voice>]|preserve","voice-pitch":"<frequency>&&absolute|[[x-low|low|medium|high|x-high]||[<frequency>|<semitones>|<percentage>]]","voice-range":"<frequency>&&absolute|[[x-low|low|medium|high|x-high]||[<frequency>|<semitones>|<percentage>]]","voice-rate":"[normal|x-slow|slow|medium|fast|x-fast]||<percentage>","voice-stress":"normal|strong|moderate|none|reduced","voice-volume":"silent|[[x-soft|soft|medium|loud|x-loud]||<decibel>]"},atrules:{charset:{prelude:"<string>",descriptors:null},"counter-style":{prelude:"<counter-style-name>",descriptors:{"additive-symbols":"[<integer>&&<symbol>]#",fallback:"<counter-style-name>",negative:"<symbol> <symbol>?",pad:"<integer>&&<symbol>",prefix:"<symbol>",range:"[[<integer>|infinite]{2}]#|auto","speak-as":"auto|bullets|numbers|words|spell-out|<counter-style-name>",suffix:"<symbol>",symbols:"<symbol>+",system:"cyclic|numeric|alphabetic|symbolic|additive|[fixed <integer>?]|[extends <counter-style-name>]"}},document:{prelude:"[<url>|url-prefix( <string> )|domain( <string> )|media-document( <string> )|regexp( <string> )]#",descriptors:null},"font-face":{prelude:null,descriptors:{"ascent-override":"normal|<percentage>","descent-override":"normal|<percentage>","font-display":"[auto|block|swap|fallback|optional]","font-family":"<family-name>","font-feature-settings":"normal|<feature-tag-value>#","font-variation-settings":"normal|[<string> <number>]#","font-stretch":"<font-stretch-absolute>{1,2}","font-style":"normal|italic|oblique <angle>{0,2}","font-weight":"<font-weight-absolute>{1,2}","font-variant":"normal|none|[<common-lig-values>||<discretionary-lig-values>||<historical-lig-values>||<contextual-alt-values>||stylistic( <feature-value-name> )||historical-forms||styleset( <feature-value-name># )||character-variant( <feature-value-name># )||swash( <feature-value-name> )||ornaments( <feature-value-name> )||annotation( <feature-value-name> )||[small-caps|all-small-caps|petite-caps|all-petite-caps|unicase|titling-caps]||<numeric-figure-values>||<numeric-spacing-values>||<numeric-fraction-values>||ordinal||slashed-zero||<east-asian-variant-values>||<east-asian-width-values>||ruby]","line-gap-override":"normal|<percentage>","size-adjust":"<percentage>",src:"[<url> [format( <string># )]?|local( <family-name> )]#","unicode-range":"<urange>#"}},"font-feature-values":{prelude:"<family-name>#",descriptors:null},import:{prelude:"[<string>|<url>] [layer|layer( <layer-name> )]? [supports( [<supports-condition>|<declaration>] )]? <media-query-list>?",descriptors:null},keyframes:{prelude:"<keyframes-name>",descriptors:null},layer:{prelude:"[<layer-name>#|<layer-name>?]",descriptors:null},media:{prelude:"<media-query-list>",descriptors:null},namespace:{prelude:"<namespace-prefix>? [<string>|<url>]",descriptors:null},page:{prelude:"<page-selector-list>",descriptors:{bleed:"auto|<length>",marks:"none|[crop||cross]",size:"<length>{1,2}|auto|[<page-size>||[portrait|landscape]]"}},property:{prelude:"<custom-property-name>",descriptors:{syntax:"<string>",inherits:"true|false","initial-value":"<string>"}},"scroll-timeline":{prelude:"<timeline-name>",descriptors:null},supports:{prelude:"<supports-condition>",descriptors:null},viewport:{prelude:null,descriptors:{height:"<viewport-length>{1,2}","max-height":"<viewport-length>","max-width":"<viewport-length>","max-zoom":"auto|<number>|<percentage>","min-height":"<viewport-length>","min-width":"<viewport-length>","min-zoom":"auto|<number>|<percentage>",orientation:"auto|portrait|landscape","user-zoom":"zoom|fixed","viewport-fit":"auto|contain|cover",width:"<viewport-length>{1,2}",zoom:"auto|<number>|<percentage>"}},nest:{prelude:"<complex-selector-list>",descriptors:null}}};var gt={};b(gt,{AnPlusB:()=>Xr,Atrule:()=>Zr,AtrulePrelude:()=>en,AttributeSelector:()=>nn,Block:()=>an,Brackets:()=>ln,CDC:()=>un,CDO:()=>hn,ClassSelector:()=>fn,Combinator:()=>gn,Comment:()=>xn,Declaration:()=>kn,DeclarationList:()=>Sn,Dimension:()=>An,Function:()=>En,Hash:()=>Pn,IdSelector:()=>Nn,Identifier:()=>Dn,MediaFeature:()=>Mn,MediaQuery:()=>Fn,MediaQueryList:()=>_n,NestingSelector:()=>jn,Nth:()=>Wn,Number:()=>Yn,Operator:()=>Vn,Parentheses:()=>Qn,Percentage:()=>$n,PseudoClassSelector:()=>Jn,PseudoElementSelector:()=>to,Ratio:()=>no,Raw:()=>io,Rule:()=>so,Selector:()=>co,SelectorList:()=>po,String:()=>bo,StyleSheet:()=>yo,TypeSelector:()=>vo,UnicodeRange:()=>Ao,Url:()=>Do,Value:()=>No,WhiteSpace:()=>Mo});var Xr={};b(Xr,{generate:()=>xc,name:()=>gc,parse:()=>Qr,structure:()=>bc});var me=43,re=45,Xt=110,Ie=!0,dc=!1;function $t(e,t){let r=this.tokenStart+e,n=this.charCodeAt(r);for((n===me||n===re)&&(t&&this.error("Number sign is not allowed"),r++);r<this.tokenEnd;r++)B(this.charCodeAt(r))||this.error("Integer is expected",r);}function Qe(e){return $t.call(this,0,e)}function Ce(e,t){if(!this.cmpChar(this.tokenStart+e,t)){let r="";switch(t){case Xt:r="N is expected";break;case re:r="HyphenMinus is expected";break}this.error(r,this.tokenStart+e);}}function Kr(){let e=0,t=0,r=this.tokenType;for(;r===13||r===25;)r=this.lookupType(++e);if(r!==10)if(this.isDelim(me,e)||this.isDelim(re,e)){t=this.isDelim(me,e)?me:re;do r=this.lookupType(++e);while(r===13||r===25);r!==10&&(this.skip(e),Qe.call(this,Ie));}else return null;return e>0&&this.skip(e),t===0&&(r=this.charCodeAt(this.tokenStart),r!==me&&r!==re&&this.error("Number sign is expected")),Qe.call(this,t!==0),t===re?"-"+this.consume(10):this.consume(10)}var gc="AnPlusB",bc={a:[String,null],b:[String,null]};function Qr(){let e=this.tokenStart,t=null,r=null;if(this.tokenType===10)Qe.call(this,dc),r=this.consume(10);else if(this.tokenType===1&&this.cmpChar(this.tokenStart,re))switch(t="-1",Ce.call(this,1,Xt),this.tokenEnd-this.tokenStart){case 2:this.next(),r=Kr.call(this);break;case 3:Ce.call(this,2,re),this.next(),this.skipSC(),Qe.call(this,Ie),r="-"+this.consume(10);break;default:Ce.call(this,2,re),$t.call(this,3,Ie),this.next(),r=this.substrToCursor(e+2);}else if(this.tokenType===1||this.isDelim(me)&&this.lookupType(1)===1){let n=0;switch(t="1",this.isDelim(me)&&(n=1,this.next()),Ce.call(this,0,Xt),this.tokenEnd-this.tokenStart){case 1:this.next(),r=Kr.call(this);break;case 2:Ce.call(this,1,re),this.next(),this.skipSC(),Qe.call(this,Ie),r="-"+this.consume(10);break;default:Ce.call(this,1,re),$t.call(this,2,Ie),this.next(),r=this.substrToCursor(e+n+1);}}else if(this.tokenType===12){let n=this.charCodeAt(this.tokenStart),o=n===me||n===re,i=this.tokenStart+o;for(;i<this.tokenEnd&&B(this.charCodeAt(i));i++);i===this.tokenStart+o&&this.error("Integer is expected",this.tokenStart+o),Ce.call(this,i-this.tokenStart,Xt),t=this.substring(e,i),i+1===this.tokenEnd?(this.next(),r=Kr.call(this)):(Ce.call(this,i-this.tokenStart+1,re),i+2===this.tokenEnd?(this.next(),this.skipSC(),Qe.call(this,Ie),r="-"+this.consume(10)):($t.call(this,i-this.tokenStart+2,Ie),this.next(),r=this.substrToCursor(i+1)));}else this.error();return t!==null&&t.charCodeAt(0)===me&&(t=t.substr(1)),r!==null&&r.charCodeAt(0)===me&&(r=r.substr(1)),{type:"AnPlusB",loc:this.getLocation(e,this.tokenStart),a:t,b:r}}function xc(e){if(e.a){let t=e.a==="+1"&&"n"||e.a==="1"&&"n"||e.a==="-1"&&"-n"||e.a+"n";if(e.b){let r=e.b[0]==="-"||e.b[0]==="+"?e.b:"+"+e.b;this.tokenize(t+r);}else this.tokenize(t);}else this.tokenize(e.b);}var Zr={};b(Zr,{generate:()=>Sc,name:()=>kc,parse:()=>$r,structure:()=>vc,walkContext:()=>wc});function da(e){return this.Raw(e,this.consumeUntilLeftCurlyBracketOrSemicolon,!0)}function yc(){for(let e=1,t;t=this.lookupType(e);e++){if(t===24)return !0;if(t===23||t===3)return !1}return !1}var kc="Atrule",wc="atrule",vc={name:String,prelude:["AtrulePrelude","Raw",null],block:["Block",null]};function $r(e=!1){let t=this.tokenStart,r,n,o=null,i=null;switch(this.eat(3),r=this.substrToCursor(t+1),n=r.toLowerCase(),this.skipSC(),this.eof===!1&&this.tokenType!==23&&this.tokenType!==17&&(this.parseAtrulePrelude?o=this.parseWithFallback(this.AtrulePrelude.bind(this,r,e),da):o=da.call(this,this.tokenIndex),this.skipSC()),this.tokenType){case 17:this.next();break;case 23:hasOwnProperty.call(this.atrule,n)&&typeof this.atrule[n].block=="function"?i=this.atrule[n].block.call(this,e):i=this.Block(yc.call(this));break}return {type:"Atrule",loc:this.getLocation(t,this.tokenStart),name:r,prelude:o,block:i}}function Sc(e){this.token(3,"@"+e.name),e.prelude!==null&&this.node(e.prelude),e.block?this.node(e.block):this.token(17,";");}var en={};b(en,{generate:()=>Ec,name:()=>Cc,parse:()=>Jr,structure:()=>Tc,walkContext:()=>Ac});var Cc="AtrulePrelude",Ac="atrulePrelude",Tc={children:[[]]};function Jr(e){let t=null;return e!==null&&(e=e.toLowerCase()),this.skipSC(),hasOwnProperty.call(this.atrule,e)&&typeof this.atrule[e].prelude=="function"?t=this.atrule[e].prelude.call(this):t=this.readSequence(this.scope.AtrulePrelude),this.skipSC(),this.eof!==!0&&this.tokenType!==23&&this.tokenType!==17&&this.error("Semicolon or block is expected"),{type:"AtrulePrelude",loc:this.getLocationFromList(t),children:t}}function Ec(e){this.children(e);}var nn={};b(nn,{generate:()=>Mc,name:()=>Nc,parse:()=>rn,structure:()=>zc});var Lc=36,ga=42,Zt=61,Pc=94,tn=124,Ic=126;function Dc(){this.eof&&this.error("Unexpected end of input");let e=this.tokenStart,t=!1;return this.isDelim(ga)?(t=!0,this.next()):this.isDelim(tn)||this.eat(1),this.isDelim(tn)?this.charCodeAt(this.tokenStart+1)!==Zt?(this.next(),this.eat(1)):t&&this.error("Identifier is expected",this.tokenEnd):t&&this.error("Vertical line is expected"),{type:"Identifier",loc:this.getLocation(e,this.tokenStart),name:this.substrToCursor(e)}}function Oc(){let e=this.tokenStart,t=this.charCodeAt(e);return t!==Zt&&t!==Ic&&t!==Pc&&t!==Lc&&t!==ga&&t!==tn&&this.error("Attribute selector (=, ~=, ^=, $=, *=, |=) is expected"),this.next(),t!==Zt&&(this.isDelim(Zt)||this.error("Equal sign is expected"),this.next()),this.substrToCursor(e)}var Nc="AttributeSelector",zc={name:"Identifier",matcher:[String,null],value:["String","Identifier",null],flags:[String,null]};function rn(){let e=this.tokenStart,t,r=null,n=null,o=null;return this.eat(19),this.skipSC(),t=Dc.call(this),this.skipSC(),this.tokenType!==20&&(this.tokenType!==1&&(r=Oc.call(this),this.skipSC(),n=this.tokenType===5?this.String():this.Identifier(),this.skipSC()),this.tokenType===1&&(o=this.consume(1),this.skipSC())),this.eat(20),{type:"AttributeSelector",loc:this.getLocation(e,this.tokenStart),name:t,matcher:r,value:n,flags:o}}function Mc(e){this.token(9,"["),this.node(e.name),e.matcher!==null&&(this.tokenize(e.matcher),this.node(e.value)),e.flags!==null&&this.token(1,e.flags),this.token(9,"]");}var an={};b(an,{generate:()=>jc,name:()=>Bc,parse:()=>on,structure:()=>Uc,walkContext:()=>_c});var Rc=38;function ya(e){return this.Raw(e,null,!0)}function ba(){return this.parseWithFallback(this.Rule,ya)}function xa(e){return this.Raw(e,this.consumeUntilSemicolonIncluded,!0)}function Fc(){if(this.tokenType===17)return xa.call(this,this.tokenIndex);let e=this.parseWithFallback(this.Declaration,xa);return this.tokenType===17&&this.next(),e}var Bc="Block",_c="block",Uc={children:[["Atrule","Rule","Declaration"]]};function on(e){let t=e?Fc:ba,r=this.tokenStart,n=this.createList();this.eat(23);e:for(;!this.eof;)switch(this.tokenType){case 24:break e;case 13:case 25:this.next();break;case 3:n.push(this.parseWithFallback(this.Atrule.bind(this,e),ya));break;default:e&&this.isDelim(Rc)?n.push(ba.call(this)):n.push(t.call(this));}return this.eof||this.eat(24),{type:"Block",loc:this.getLocation(r,this.tokenStart),children:n}}function jc(e){this.token(23,"{"),this.children(e,t=>{t.type==="Declaration"&&this.token(17,";");}),this.token(24,"}");}var ln={};b(ln,{generate:()=>Hc,name:()=>qc,parse:()=>sn,structure:()=>Wc});var qc="Brackets",Wc={children:[[]]};function sn(e,t){let r=this.tokenStart,n=null;return this.eat(19),n=e.call(this,t),this.eof||this.eat(20),{type:"Brackets",loc:this.getLocation(r,this.tokenStart),children:n}}function Hc(e){this.token(9,"["),this.children(e),this.token(9,"]");}var un={};b(un,{generate:()=>Vc,name:()=>Yc,parse:()=>cn,structure:()=>Gc});var Yc="CDC",Gc=[];function cn(){let e=this.tokenStart;return this.eat(15),{type:"CDC",loc:this.getLocation(e,this.tokenStart)}}function Vc(){this.token(15,"-->");}var hn={};b(hn,{generate:()=>Xc,name:()=>Kc,parse:()=>pn,structure:()=>Qc});var Kc="CDO",Qc=[];function pn(){let e=this.tokenStart;return this.eat(14),{type:"CDO",loc:this.getLocation(e,this.tokenStart)}}function Xc(){this.token(14,"<!--");}var fn={};b(fn,{generate:()=>eu,name:()=>Zc,parse:()=>mn,structure:()=>Jc});var $c=46,Zc="ClassSelector",Jc={name:String};function mn(){return this.eatDelim($c),{type:"ClassSelector",loc:this.getLocation(this.tokenStart-1,this.tokenEnd),name:this.consume(1)}}function eu(e){this.token(9,"."),this.token(1,e.name);}var gn={};b(gn,{generate:()=>au,name:()=>ou,parse:()=>dn,structure:()=>iu});var tu=43,ka=47,ru=62,nu=126,ou="Combinator",iu={name:String};function dn(){let e=this.tokenStart,t;switch(this.tokenType){case 13:t=" ";break;case 9:switch(this.charCodeAt(this.tokenStart)){case ru:case tu:case nu:this.next();break;case ka:this.next(),this.eatIdent("deep"),this.eatDelim(ka);break;default:this.error("Combinator is expected");}t=this.substrToCursor(e);break}return {type:"Combinator",loc:this.getLocation(e,this.tokenStart),name:t}}function au(e){this.tokenize(e.name);}var xn={};b(xn,{generate:()=>pu,name:()=>cu,parse:()=>bn,structure:()=>uu});var su=42,lu=47,cu="Comment",uu={value:String};function bn(){let e=this.tokenStart,t=this.tokenEnd;return this.eat(25),t-e+2>=2&&this.charCodeAt(t-2)===su&&this.charCodeAt(t-1)===lu&&(t-=2),{type:"Comment",loc:this.getLocation(e,this.tokenStart),value:this.substring(e+2,t)}}function pu(e){this.token(25,"/*"+e.value+"*/");}var kn={};b(kn,{generate:()=>Su,name:()=>ku,parse:()=>yn,structure:()=>vu,walkContext:()=>wu});var va=33,hu=35,mu=36,fu=38,du=42,gu=43,wa=47;function bu(e){return this.Raw(e,this.consumeUntilExclamationMarkOrSemicolon,!0)}function xu(e){return this.Raw(e,this.consumeUntilExclamationMarkOrSemicolon,!1)}function yu(){let e=this.tokenIndex,t=this.Value();return t.type!=="Raw"&&this.eof===!1&&this.tokenType!==17&&this.isDelim(va)===!1&&this.isBalanceEdge(e)===!1&&this.error(),t}var ku="Declaration",wu="declaration",vu={important:[Boolean,String],property:String,value:["Value","Raw"]};function yn(){let e=this.tokenStart,t=this.tokenIndex,r=Cu.call(this),n=Mt(r),o=n?this.parseCustomProperty:this.parseValue,i=n?xu:bu,s=!1,u;this.skipSC(),this.eat(16);let c=this.tokenIndex;if(n||this.skipSC(),o?u=this.parseWithFallback(yu,i):u=i.call(this,this.tokenIndex),n&&u.type==="Value"&&u.children.isEmpty){for(let a=c-this.tokenIndex;a<=0;a++)if(this.lookupType(a)===13){u.children.appendData({type:"WhiteSpace",loc:null,value:" "});break}}return this.isDelim(va)&&(s=Au.call(this),this.skipSC()),this.eof===!1&&this.tokenType!==17&&this.isBalanceEdge(t)===!1&&this.error(),{type:"Declaration",loc:this.getLocation(e,this.tokenStart),important:s,property:r,value:u}}function Su(e){this.token(1,e.property),this.token(16,":"),this.node(e.value),e.important&&(this.token(9,"!"),this.token(1,e.important===!0?"important":e.important));}function Cu(){let e=this.tokenStart;if(this.tokenType===9)switch(this.charCodeAt(this.tokenStart)){case du:case mu:case gu:case hu:case fu:this.next();break;case wa:this.next(),this.isDelim(wa)&&this.next();break}return this.tokenType===4?this.eat(4):this.eat(1),this.substrToCursor(e)}function Au(){this.eat(9),this.skipSC();let e=this.consume(1);return e==="important"?!0:e}var Sn={};b(Sn,{generate:()=>Pu,name:()=>Eu,parse:()=>vn,structure:()=>Lu});var Tu=38;function wn(e){return this.Raw(e,this.consumeUntilSemicolonIncluded,!0)}var Eu="DeclarationList",Lu={children:[["Declaration","Atrule","Rule"]]};function vn(){let e=this.createList();for(;!this.eof;)switch(this.tokenType){case 13:case 25:case 17:this.next();break;case 3:e.push(this.parseWithFallback(this.Atrule.bind(this,!0),wn));break;default:this.isDelim(Tu)?e.push(this.parseWithFallback(this.Rule,wn)):e.push(this.parseWithFallback(this.Declaration,wn));}return {type:"DeclarationList",loc:this.getLocationFromList(e),children:e}}function Pu(e){this.children(e,t=>{t.type==="Declaration"&&this.token(17,";");});}var An={};b(An,{generate:()=>Ou,name:()=>Iu,parse:()=>Cn,structure:()=>Du});var Iu="Dimension",Du={value:String,unit:String};function Cn(){let e=this.tokenStart,t=this.consumeNumber(12);return {type:"Dimension",loc:this.getLocation(e,this.tokenStart),value:t,unit:this.substring(e+t.length,this.tokenStart)}}function Ou(e){this.token(12,e.value+e.unit);}var En={};b(En,{generate:()=>Ru,name:()=>Nu,parse:()=>Tn,structure:()=>Mu,walkContext:()=>zu});var Nu="Function",zu="function",Mu={name:String,children:[[]]};function Tn(e,t){let r=this.tokenStart,n=this.consumeFunctionName(),o=n.toLowerCase(),i;return i=t.hasOwnProperty(o)?t[o].call(this,t):e.call(this,t),this.eof||this.eat(22),{type:"Function",loc:this.getLocation(r,this.tokenStart),name:n,children:i}}function Ru(e){this.token(2,e.name+"("),this.children(e),this.token(22,")");}var Pn={};b(Pn,{generate:()=>Uu,name:()=>Bu,parse:()=>Ln,structure:()=>_u,xxx:()=>Fu});var Fu="XXX",Bu="Hash",_u={value:String};function Ln(){let e=this.tokenStart;return this.eat(4),{type:"Hash",loc:this.getLocation(e,this.tokenStart),value:this.substrToCursor(e+1)}}function Uu(e){this.token(4,"#"+e.value);}var Dn={};b(Dn,{generate:()=>Wu,name:()=>ju,parse:()=>In,structure:()=>qu});var ju="Identifier",qu={name:String};function In(){return {type:"Identifier",loc:this.getLocation(this.tokenStart,this.tokenEnd),name:this.consume(1)}}function Wu(e){this.token(1,e.name);}var Nn={};b(Nn,{generate:()=>Gu,name:()=>Hu,parse:()=>On,structure:()=>Yu});var Hu="IdSelector",Yu={name:String};function On(){let e=this.tokenStart;return this.eat(4),{type:"IdSelector",loc:this.getLocation(e,this.tokenStart),name:this.substrToCursor(e+1)}}function Gu(e){this.token(9,"#"+e.name);}var Mn={};b(Mn,{generate:()=>Qu,name:()=>Vu,parse:()=>zn,structure:()=>Ku});var Vu="MediaFeature",Ku={name:String,value:["Identifier","Number","Dimension","Ratio",null]};function zn(){let e=this.tokenStart,t,r=null;if(this.eat(21),this.skipSC(),t=this.consume(1),this.skipSC(),this.tokenType!==22){switch(this.eat(16),this.skipSC(),this.tokenType){case 10:this.lookupNonWSType(1)===9?r=this.Ratio():r=this.Number();break;case 12:r=this.Dimension();break;case 1:r=this.Identifier();break;default:this.error("Number, dimension, ratio or identifier is expected");}this.skipSC();}return this.eat(22),{type:"MediaFeature",loc:this.getLocation(e,this.tokenStart),name:t,value:r}}function Qu(e){this.token(21,"("),this.token(1,e.name),e.value!==null&&(this.token(16,":"),this.node(e.value)),this.token(22,")");}var Fn={};b(Fn,{generate:()=>Zu,name:()=>Xu,parse:()=>Rn,structure:()=>$u});var Xu="MediaQuery",$u={children:[["Identifier","MediaFeature","WhiteSpace"]]};function Rn(){let e=this.createList(),t=null;this.skipSC();e:for(;!this.eof;){switch(this.tokenType){case 25:case 13:this.next();continue;case 1:t=this.Identifier();break;case 21:t=this.MediaFeature();break;default:break e}e.push(t);}return t===null&&this.error("Identifier or parenthesis is expected"),{type:"MediaQuery",loc:this.getLocationFromList(e),children:e}}function Zu(e){this.children(e);}var _n={};b(_n,{generate:()=>tp,name:()=>Ju,parse:()=>Bn,structure:()=>ep});var Ju="MediaQueryList",ep={children:[["MediaQuery"]]};function Bn(){let e=this.createList();for(this.skipSC();!this.eof&&(e.push(this.MediaQuery()),this.tokenType===18);)this.next();return {type:"MediaQueryList",loc:this.getLocationFromList(e),children:e}}function tp(e){this.children(e,()=>this.token(18,","));}var jn={};b(jn,{generate:()=>ip,name:()=>np,parse:()=>Un,structure:()=>op});var rp=38,np="NestingSelector",op={};function Un(){let e=this.tokenStart;return this.eatDelim(rp),{type:"NestingSelector",loc:this.getLocation(e,this.tokenStart)}}function ip(){this.token(9,"&");}var Wn={};b(Wn,{generate:()=>lp,name:()=>ap,parse:()=>qn,structure:()=>sp});var ap="Nth",sp={nth:["AnPlusB","Identifier"],selector:["SelectorList",null]};function qn(){this.skipSC();let e=this.tokenStart,t=e,r=null,n;return this.lookupValue(0,"odd")||this.lookupValue(0,"even")?n=this.Identifier():n=this.AnPlusB(),t=this.tokenStart,this.skipSC(),this.lookupValue(0,"of")&&(this.next(),r=this.SelectorList(),t=this.tokenStart),{type:"Nth",loc:this.getLocation(e,t),nth:n,selector:r}}function lp(e){this.node(e.nth),e.selector!==null&&(this.token(1,"of"),this.node(e.selector));}var Yn={};b(Yn,{generate:()=>pp,name:()=>cp,parse:()=>Hn,structure:()=>up});var cp="Number",up={value:String};function Hn(){return {type:"Number",loc:this.getLocation(this.tokenStart,this.tokenEnd),value:this.consume(10)}}function pp(e){this.token(10,e.value);}var Vn={};b(Vn,{generate:()=>fp,name:()=>hp,parse:()=>Gn,structure:()=>mp});var hp="Operator",mp={value:String};function Gn(){let e=this.tokenStart;return this.next(),{type:"Operator",loc:this.getLocation(e,this.tokenStart),value:this.substrToCursor(e)}}function fp(e){this.tokenize(e.value);}var Qn={};b(Qn,{generate:()=>bp,name:()=>dp,parse:()=>Kn,structure:()=>gp});var dp="Parentheses",gp={children:[[]]};function Kn(e,t){let r=this.tokenStart,n=null;return this.eat(21),n=e.call(this,t),this.eof||this.eat(22),{type:"Parentheses",loc:this.getLocation(r,this.tokenStart),children:n}}function bp(e){this.token(21,"("),this.children(e),this.token(22,")");}var $n={};b($n,{generate:()=>kp,name:()=>xp,parse:()=>Xn,structure:()=>yp});var xp="Percentage",yp={value:String};function Xn(){return {type:"Percentage",loc:this.getLocation(this.tokenStart,this.tokenEnd),value:this.consumeNumber(11)}}function kp(e){this.token(11,e.value+"%");}var Jn={};b(Jn,{generate:()=>Cp,name:()=>wp,parse:()=>Zn,structure:()=>Sp,walkContext:()=>vp});var wp="PseudoClassSelector",vp="function",Sp={name:String,children:[["Raw"],null]};function Zn(){let e=this.tokenStart,t=null,r,n;return this.eat(16),this.tokenType===2?(r=this.consumeFunctionName(),n=r.toLowerCase(),this.lookupNonWSType(0)==22?t=this.createList():hasOwnProperty.call(this.pseudo,n)?(this.skipSC(),t=this.pseudo[n].call(this),this.skipSC()):(t=this.createList(),t.push(this.Raw(this.tokenIndex,null,!1))),this.eat(22)):r=this.consume(1),{type:"PseudoClassSelector",loc:this.getLocation(e,this.tokenStart),name:r,children:t}}function Cp(e){this.token(16,":"),e.children===null?this.token(1,e.name):(this.token(2,e.name+"("),this.children(e),this.token(22,")"));}var to={};b(to,{generate:()=>Lp,name:()=>Ap,parse:()=>eo,structure:()=>Ep,walkContext:()=>Tp});var Ap="PseudoElementSelector",Tp="function",Ep={name:String,children:[["Raw"],null]};function eo(){let e=this.tokenStart,t=null,r,n;return this.eat(16),this.eat(16),this.tokenType===2?(r=this.consumeFunctionName(),n=r.toLowerCase(),this.lookupNonWSType(0)==22?t=this.createList():hasOwnProperty.call(this.pseudo,n)?(this.skipSC(),t=this.pseudo[n].call(this),this.skipSC()):(t=this.createList(),t.push(this.Raw(this.tokenIndex,null,!1))),this.eat(22)):r=this.consume(1),{type:"PseudoElementSelector",loc:this.getLocation(e,this.tokenStart),name:r,children:t}}function Lp(e){this.token(16,":"),this.token(16,":"),e.children===null?this.token(1,e.name):(this.token(2,e.name+"("),this.children(e),this.token(22,")"));}var no={};b(no,{generate:()=>Np,name:()=>Dp,parse:()=>ro,structure:()=>Op});var Pp=47,Ip=46;function Sa(){this.skipSC();let e=this.consume(10);for(let t=0;t<e.length;t++){let r=e.charCodeAt(t);!B(r)&&r!==Ip&&this.error("Unsigned number is expected",this.tokenStart-e.length+t);}return Number(e)===0&&this.error("Zero number is not allowed",this.tokenStart-e.length),e}var Dp="Ratio",Op={left:String,right:String};function ro(){let e=this.tokenStart,t=Sa.call(this),r;return this.skipSC(),this.eatDelim(Pp),r=Sa.call(this),{type:"Ratio",loc:this.getLocation(e,this.tokenStart),left:t,right:r}}function Np(e){this.token(10,e.left),this.token(9,"/"),this.token(10,e.right);}var io={};b(io,{generate:()=>Fp,name:()=>Mp,parse:()=>oo,structure:()=>Rp});function zp(){return this.tokenIndex>0&&this.lookupType(-1)===13?this.tokenIndex>1?this.getTokenStart(this.tokenIndex-1):this.firstCharOffset:this.tokenStart}var Mp="Raw",Rp={value:String};function oo(e,t,r){let n=this.getTokenStart(e),o;return this.skipUntilBalanced(e,t||this.consumeUntilBalanceEnd),r&&this.tokenStart>n?o=zp.call(this):o=this.tokenStart,{type:"Raw",loc:this.getLocation(n,o),value:this.substring(n,o)}}function Fp(e){this.tokenize(e.value);}var so={};b(so,{generate:()=>qp,name:()=>_p,parse:()=>ao,structure:()=>jp,walkContext:()=>Up});function Ca(e){return this.Raw(e,this.consumeUntilLeftCurlyBracket,!0)}function Bp(){let e=this.SelectorList();return e.type!=="Raw"&&this.eof===!1&&this.tokenType!==23&&this.error(),e}var _p="Rule",Up="rule",jp={prelude:["SelectorList","Raw"],block:["Block"]};function ao(){let e=this.tokenIndex,t=this.tokenStart,r,n;return this.parseRulePrelude?r=this.parseWithFallback(Bp,Ca):r=Ca.call(this,e),n=this.Block(!0),{type:"Rule",loc:this.getLocation(t,this.tokenStart),prelude:r,block:n}}function qp(e){this.node(e.prelude),this.node(e.block);}var co={};b(co,{generate:()=>Yp,name:()=>Wp,parse:()=>lo,structure:()=>Hp});var Wp="Selector",Hp={children:[["TypeSelector","IdSelector","ClassSelector","AttributeSelector","PseudoClassSelector","PseudoElementSelector","Combinator","WhiteSpace"]]};function lo(){let e=this.readSequence(this.scope.Selector);return this.getFirstListNode(e)===null&&this.error("Selector is expected"),{type:"Selector",loc:this.getLocationFromList(e),children:e}}function Yp(e){this.children(e);}var po={};b(po,{generate:()=>Qp,name:()=>Gp,parse:()=>uo,structure:()=>Kp,walkContext:()=>Vp});var Gp="SelectorList",Vp="selector",Kp={children:[["Selector","Raw"]]};function uo(){let e=this.createList();for(;!this.eof;){if(e.push(this.Selector()),this.tokenType===18){this.next();continue}break}return {type:"SelectorList",loc:this.getLocationFromList(e),children:e}}function Qp(e){this.children(e,()=>this.token(18,","));}var bo={};b(bo,{generate:()=>Zp,name:()=>Xp,parse:()=>go,structure:()=>$p});var fo={};b(fo,{decode:()=>ft,encode:()=>mo});var ho=92,Aa=34,Ta=39;function ft(e){let t=e.length,r=e.charCodeAt(0),n=r===Aa||r===Ta?1:0,o=n===1&&t>1&&e.charCodeAt(t-1)===r?t-2:t-1,i="";for(let s=n;s<=o;s++){let u=e.charCodeAt(s);if(u===ho){if(s===o){s!==t-1&&(i=e.substr(s+1));break}if(u=e.charCodeAt(++s),$(ho,u)){let c=s-1,a=se(e,c);s=a-1,i+=Re(e.substring(c+1,a));}else u===13&&e.charCodeAt(s+1)===10&&s++;}else i+=e[s];}return i}function mo(e,t){let r=t?"'":'"',n=t?Ta:Aa,o="",i=!1;for(let s=0;s<e.length;s++){let u=e.charCodeAt(s);if(u===0){o+="\uFFFD";continue}if(u<=31||u===127){o+="\\"+u.toString(16),i=!0;continue}u===n||u===ho?(o+="\\"+e.charAt(s),i=!1):(i&&(ee(u)||pe(u))&&(o+=" "),o+=e.charAt(s),i=!1);}return r+o+r}var Xp="String",$p={value:String};function go(){return {type:"String",loc:this.getLocation(this.tokenStart,this.tokenEnd),value:ft(this.consume(5))}}function Zp(e){this.token(5,mo(e.value));}var yo={};b(yo,{generate:()=>nh,name:()=>eh,parse:()=>xo,structure:()=>rh,walkContext:()=>th});var Jp=33;function Ea(e){return this.Raw(e,null,!1)}var eh="StyleSheet",th="stylesheet",rh={children:[["Comment","CDO","CDC","Atrule","Rule","Raw"]]};function xo(){let e=this.tokenStart,t=this.createList(),r;for(;!this.eof;){switch(this.tokenType){case 13:this.next();continue;case 25:if(this.charCodeAt(this.tokenStart+2)!==Jp){this.next();continue}r=this.Comment();break;case 14:r=this.CDO();break;case 15:r=this.CDC();break;case 3:r=this.parseWithFallback(this.Atrule,Ea);break;default:r=this.parseWithFallback(this.Rule,Ea);}t.push(r);}return {type:"StyleSheet",loc:this.getLocation(e,this.tokenStart),children:t}}function nh(e){this.children(e);}var vo={};b(vo,{generate:()=>sh,name:()=>ih,parse:()=>wo,structure:()=>ah});var oh=42,La=124;function ko(){this.tokenType!==1&&this.isDelim(oh)===!1&&this.error("Identifier or asterisk is expected"),this.next();}var ih="TypeSelector",ah={name:String};function wo(){let e=this.tokenStart;return this.isDelim(La)?(this.next(),ko.call(this)):(ko.call(this),this.isDelim(La)&&(this.next(),ko.call(this))),{type:"TypeSelector",loc:this.getLocation(e,this.tokenStart),name:this.substrToCursor(e)}}function sh(e){this.tokenize(e.name);}var Ao={};b(Ao,{generate:()=>hh,name:()=>uh,parse:()=>Co,structure:()=>ph});var Pa=43,Ia=45,So=63;function dt(e,t){let r=0;for(let n=this.tokenStart+e;n<this.tokenEnd;n++){let o=this.charCodeAt(n);if(o===Ia&&t&&r!==0)return dt.call(this,e+r+1,!1),-1;ee(o)||this.error(t&&r!==0?"Hyphen minus"+(r<6?" or hex digit":"")+" is expected":r<6?"Hex digit is expected":"Unexpected input",n),++r>6&&this.error("Too many hex digits",n);}return this.next(),r}function Jt(e){let t=0;for(;this.isDelim(So);)++t>e&&this.error("Too many question marks"),this.next();}function lh(e){this.charCodeAt(this.tokenStart)!==e&&this.error((e===Pa?"Plus sign":"Hyphen minus")+" is expected");}function ch(){let e=0;switch(this.tokenType){case 10:if(e=dt.call(this,1,!0),this.isDelim(So)){Jt.call(this,6-e);break}if(this.tokenType===12||this.tokenType===10){lh.call(this,Ia),dt.call(this,1,!1);break}break;case 12:e=dt.call(this,1,!0),e>0&&Jt.call(this,6-e);break;default:if(this.eatDelim(Pa),this.tokenType===1){e=dt.call(this,0,!0),e>0&&Jt.call(this,6-e);break}if(this.isDelim(So)){this.next(),Jt.call(this,5);break}this.error("Hex digit or question mark is expected");}}var uh="UnicodeRange",ph={value:String};function Co(){let e=this.tokenStart;return this.eatIdent("u"),ch.call(this),{type:"UnicodeRange",loc:this.getLocation(e,this.tokenStart),value:this.substrToCursor(e)}}function hh(e){this.tokenize(e.value);}var Do={};b(Do,{generate:()=>yh,name:()=>bh,parse:()=>Io,structure:()=>xh});var Po={};b(Po,{decode:()=>Eo,encode:()=>Lo});var mh=32,To=92,fh=34,dh=39,gh=40,Da=41;function Eo(e){let t=e.length,r=4,n=e.charCodeAt(t-1)===Da?t-2:t-1,o="";for(;r<n&&pe(e.charCodeAt(r));)r++;for(;r<n&&pe(e.charCodeAt(n));)n--;for(let i=r;i<=n;i++){let s=e.charCodeAt(i);if(s===To){if(i===n){i!==t-1&&(o=e.substr(i+1));break}if(s=e.charCodeAt(++i),$(To,s)){let u=i-1,c=se(e,u);i=c-1,o+=Re(e.substring(u+1,c));}else s===13&&e.charCodeAt(i+1)===10&&i++;}else o+=e[i];}return o}function Lo(e){let t="",r=!1;for(let n=0;n<e.length;n++){let o=e.charCodeAt(n);if(o===0){t+="\uFFFD";continue}if(o<=31||o===127){t+="\\"+o.toString(16),r=!0;continue}o===mh||o===To||o===fh||o===dh||o===gh||o===Da?(t+="\\"+e.charAt(n),r=!1):(r&&ee(o)&&(t+=" "),t+=e.charAt(n),r=!1);}return "url("+t+")"}var bh="Url",xh={value:String};function Io(){let e=this.tokenStart,t;switch(this.tokenType){case 7:t=Eo(this.consume(7));break;case 2:this.cmpStr(this.tokenStart,this.tokenEnd,"url(")||this.error("Function name must be `url`"),this.eat(2),this.skipSC(),t=ft(this.consume(5)),this.skipSC(),this.eof||this.eat(22);break;default:this.error("Url or Function is expected");}return {type:"Url",loc:this.getLocation(e,this.tokenStart),value:t}}function yh(e){this.token(7,Lo(e.value));}var No={};b(No,{generate:()=>vh,name:()=>kh,parse:()=>Oo,structure:()=>wh});var kh="Value",wh={children:[[]]};function Oo(){let e=this.tokenStart,t=this.readSequence(this.scope.Value);return {type:"Value",loc:this.getLocation(e,this.tokenStart),children:t}}function vh(e){this.children(e);}var Mo={};b(Mo,{generate:()=>Th,name:()=>Ch,parse:()=>zo,structure:()=>Ah});var Sh=Object.freeze({type:"WhiteSpace",loc:null,value:" "}),Ch="WhiteSpace",Ah={value:String};function zo(){return this.eat(13),Sh}function Th(e){this.token(13,e.value);}var Oa={generic:!0,...fa,node:gt};var Ro={};b(Ro,{AtrulePrelude:()=>za,Selector:()=>Ra,Value:()=>Ua});var Eh=35,Lh=42,Na=43,Ph=45,Ih=47,Dh=117;function bt(e){switch(this.tokenType){case 4:return this.Hash();case 18:return this.Operator();case 21:return this.Parentheses(this.readSequence,e.recognizer);case 19:return this.Brackets(this.readSequence,e.recognizer);case 5:return this.String();case 12:return this.Dimension();case 11:return this.Percentage();case 10:return this.Number();case 2:return this.cmpStr(this.tokenStart,this.tokenEnd,"url(")?this.Url():this.Function(this.readSequence,e.recognizer);case 7:return this.Url();case 1:return this.cmpChar(this.tokenStart,Dh)&&this.cmpChar(this.tokenStart+1,Na)?this.UnicodeRange():this.Identifier();case 9:{let t=this.charCodeAt(this.tokenStart);if(t===Ih||t===Lh||t===Na||t===Ph)return this.Operator();t===Eh&&this.error("Hex or identifier is expected",this.tokenStart+1);break}}}var za={getNode:bt};var Oh=35,Nh=38,zh=42,Mh=43,Rh=47,Ma=46,Fh=62,Bh=124,_h=126;function Uh(e,t){t.last!==null&&t.last.type!=="Combinator"&&e!==null&&e.type!=="Combinator"&&t.push({type:"Combinator",loc:null,name:" "});}function jh(){switch(this.tokenType){case 19:return this.AttributeSelector();case 4:return this.IdSelector();case 16:return this.lookupType(1)===16?this.PseudoElementSelector():this.PseudoClassSelector();case 1:return this.TypeSelector();case 10:case 11:return this.Percentage();case 12:this.charCodeAt(this.tokenStart)===Ma&&this.error("Identifier is expected",this.tokenStart+1);break;case 9:{switch(this.charCodeAt(this.tokenStart)){case Mh:case Fh:case _h:case Rh:return this.Combinator();case Ma:return this.ClassSelector();case zh:case Bh:return this.TypeSelector();case Oh:return this.IdSelector();case Nh:return this.NestingSelector()}break}}}var Ra={onWhiteSpace:Uh,getNode:jh};function Fa(){return this.createSingleNodeList(this.Raw(this.tokenIndex,null,!1))}function Ba(){let e=this.createList();if(this.skipSC(),e.push(this.Identifier()),this.skipSC(),this.tokenType===18){e.push(this.Operator());let t=this.tokenIndex,r=this.parseCustomProperty?this.Value(null):this.Raw(this.tokenIndex,this.consumeUntilExclamationMarkOrSemicolon,!1);if(r.type==="Value"&&r.children.isEmpty){for(let n=t-this.tokenIndex;n<=0;n++)if(this.lookupType(n)===13){r.children.appendData({type:"WhiteSpace",loc:null,value:" "});break}}e.push(r);}return e}function _a(e){return e!==null&&e.type==="Operator"&&(e.value[e.value.length-1]==="-"||e.value[e.value.length-1]==="+")}var Ua={getNode:bt,onWhiteSpace(e,t){_a(e)&&(e.value=" "+e.value),_a(t.last)&&(t.last.value+=" ");},expression:Fa,var:Ba};var ja={parse:{prelude:null,block(){return this.Block(!0)}}};var qa={parse:{prelude(){let e=this.createList();switch(this.skipSC(),this.tokenType){case 5:e.push(this.String());break;case 7:case 2:e.push(this.Url());break;default:this.error("String or url() is expected");}return (this.lookupNonWSType(0)===1||this.lookupNonWSType(0)===21)&&e.push(this.MediaQueryList()),e},block:null}};var Wa={parse:{prelude(){return this.createSingleNodeList(this.MediaQueryList())},block(e=!1){return this.Block(e)}}};var Ha={parse:{prelude(){return this.createSingleNodeList(this.SelectorList())},block(){return this.Block(!0)}}};var Ya={parse:{prelude(){return this.createSingleNodeList(this.SelectorList())},block(){return this.Block(!0)}}};function qh(){return this.createSingleNodeList(this.Raw(this.tokenIndex,null,!1))}function Wh(){return this.skipSC(),this.tokenType===1&&this.lookupNonWSType(1)===16?this.createSingleNodeList(this.Declaration()):Ga.call(this)}function Ga(){let e=this.createList(),t;this.skipSC();e:for(;!this.eof;){switch(this.tokenType){case 25:case 13:this.next();continue;case 2:t=this.Function(qh,this.scope.AtrulePrelude);break;case 1:t=this.Identifier();break;case 21:t=this.Parentheses(Wh,this.scope.AtrulePrelude);break;default:break e}e.push(t);}return e}var Va={parse:{prelude(){let e=Ga.call(this);return this.getFirstListNode(e)===null&&this.error("Condition is expected"),e},block(e=!1){return this.Block(e)}}};var Ka={"font-face":ja,import:qa,media:Wa,nest:Ha,page:Ya,supports:Va};var De={parse(){return this.createSingleNodeList(this.SelectorList())}},Fo={parse(){return this.createSingleNodeList(this.Selector())}},Qa={parse(){return this.createSingleNodeList(this.Identifier())}},er={parse(){return this.createSingleNodeList(this.Nth())}},Xa={dir:Qa,has:De,lang:Qa,matches:De,is:De,"-moz-any":De,"-webkit-any":De,where:De,not:De,"nth-child":er,"nth-last-child":er,"nth-last-of-type":er,"nth-of-type":er,slotted:Fo,host:Fo,"host-context":Fo};var Bo={};b(Bo,{AnPlusB:()=>Qr,Atrule:()=>$r,AtrulePrelude:()=>Jr,AttributeSelector:()=>rn,Block:()=>on,Brackets:()=>sn,CDC:()=>cn,CDO:()=>pn,ClassSelector:()=>mn,Combinator:()=>dn,Comment:()=>bn,Declaration:()=>yn,DeclarationList:()=>vn,Dimension:()=>Cn,Function:()=>Tn,Hash:()=>Ln,IdSelector:()=>On,Identifier:()=>In,MediaFeature:()=>zn,MediaQuery:()=>Rn,MediaQueryList:()=>Bn,NestingSelector:()=>Un,Nth:()=>qn,Number:()=>Hn,Operator:()=>Gn,Parentheses:()=>Kn,Percentage:()=>Xn,PseudoClassSelector:()=>Zn,PseudoElementSelector:()=>eo,Ratio:()=>ro,Raw:()=>oo,Rule:()=>ao,Selector:()=>lo,SelectorList:()=>uo,String:()=>go,StyleSheet:()=>xo,TypeSelector:()=>wo,UnicodeRange:()=>Co,Url:()=>Io,Value:()=>Oo,WhiteSpace:()=>zo});var $a={parseContext:{default:"StyleSheet",stylesheet:"StyleSheet",atrule:"Atrule",atrulePrelude(e){return this.AtrulePrelude(e.atrule?String(e.atrule):null)},mediaQueryList:"MediaQueryList",mediaQuery:"MediaQuery",rule:"Rule",selectorList:"SelectorList",selector:"Selector",block(){return this.Block(!0)},declarationList:"DeclarationList",declaration:"Declaration",value:"Value"},scope:Ro,atrule:Ka,pseudo:Xa,node:Bo};var Za={node:gt};var Ja=Vr({...Oa,...$a,...Za});var ts={};b(ts,{decode:()=>Hh,encode:()=>Yh});var es=92;function Hh(e){let t=e.length-1,r="";for(let n=0;n<e.length;n++){let o=e.charCodeAt(n);if(o===es){if(n===t)break;if(o=e.charCodeAt(++n),$(es,o)){let i=n-1,s=se(e,i);n=s-1,r+=Re(e.substring(i+1,s));}else o===13&&e.charCodeAt(n+1)===10&&n++;}else r+=e[n];}return r}function Yh(e){let t="";if(e.length===1&&e.charCodeAt(0)===45)return "\\-";for(let r=0;r<e.length;r++){let n=e.charCodeAt(r);if(n===0){t+="\uFFFD";continue}if(n<=31||n===127||n>=48&&n<=57&&(r===0||r===1&&e.charCodeAt(0)===45)){t+="\\"+n.toString(16)+" ";continue}Ne(n)?t+=e.charAt(r):t+="\\"+e.charAt(r);}return t}var{tokenize:fb,parse:db,generate:gb,lexer:bb,createLexer:xb,walk:yb,find:kb,findLast:wb,findAll:vb,toPlainObject:Sb,fromPlainObject:Cb,fork:Ab}=Ja;

	/*
	 * The MIT License (MIT)
	 * 
	 * Author: Gildas Lormeau
	 * 
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in all
	 * copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	 * SOFTWARE.
	 */
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

	const errorPrefix = "[parse-css-font] ";

	function parse(value) {
		const stringValue = gb(value);
		if (systemFontKeywords.indexOf(stringValue) !== -1) {
			return { system: stringValue };
		}
		const tokens = value.children;

		const font = {
			lineHeight: "normal",
			stretch: "normal",
			style: "normal",
			variant: "normal",
			weight: "normal",
		};

		let isLocked = false;
		for (let tokenNode = tokens.head; tokenNode; tokenNode = tokenNode.next) {
			const token = gb(tokenNode.data);
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

			if (tokenNode.data.type == "Dimension") {
				font.size = gb(tokenNode.data);
				tokenNode = tokenNode.next;
				if (tokenNode && tokenNode.data.type == "Operator" && tokenNode.data.value == "/" && tokenNode.next) {
					tokenNode = tokenNode.next;
					font.lineHeight = gb(tokenNode.data);
					tokenNode = tokenNode.next;
				} else if (tokens.head.data.type == "Operator" && tokens.head.data.value == "/" && tokens.head.next) {
					font.lineHeight = gb(tokens.head.next.data);
					tokenNode = tokens.head.next.next;
				}
				if (!tokenNode) {
					throw error("Missing required font-family.");
				}
				font.family = [];
				let familyName = "";
				while (tokenNode) {
					while (tokenNode && tokenNode.data.type == "Operator" && tokenNode.data.value == ",") {
						tokenNode = tokenNode.next;
					}
					if (tokenNode) {
						if (tokenNode.data.type == "Identifier") {
							while (tokenNode && tokenNode.data.type == "Identifier") {
								familyName += " " + gb(tokenNode.data);
								tokenNode = tokenNode.next;
							}
						} else {
							familyName = removeQuotes(gb(tokenNode.data));
							tokenNode = tokenNode.next;
						}
					}
					familyName = familyName.trim();
					if (familyName) {
						font.family.push(familyName);
						familyName = "";
					}
				}
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

	function error(message) {
		return new Error(errorPrefix + message);
	}

	function removeQuotes(string) {
		if (string.match(REGEXP_SIMPLE_QUOTES_STRING)) {
			string = string.replace(REGEXP_SIMPLE_QUOTES_STRING, "$1");
		} else {
			string = string.replace(REGEXP_DOUBLE_QUOTES_STRING, "$1");
		}
		return string.trim();
	}

	/*
	 * The MIT License (MIT)
	 * 
	 * Author: Gildas Lormeau
	 * 
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in all
	 * copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	 * SOFTWARE.
	 */

	// derived from https://github.com/dryoma/postcss-media-query-parser

	/*
	 * The MIT License (MIT)
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

	/**
	 * Parses a media feature expression, e.g. `max-width: 10px`, `(color)`
	 *
	 * @param {string} string - the source expression string, can be inside parens
	 * @param {Number} index - the index of `string` in the overall input
	 *
	 * @return {Array} an array of Nodes, the first element being a media feature,
	 *    the second - its value (may be missing)
	 */

	function parseMediaFeature(string, index = 0) {
		const modesEntered = [{
			mode: "normal",
			character: null,
		}];
		const result = [];
		let lastModeIndex = 0, mediaFeature = "", colon = null, mediaFeatureValue = null, indexLocal = index;

		let stringNormalized = string;
		// Strip trailing parens (if any), and correct the starting index
		if (string[0] === "(" && string[string.length - 1] === ")") {
			stringNormalized = string.substring(1, string.length - 1);
			indexLocal++;
		}

		for (let i = 0; i < stringNormalized.length; i++) {
			const character = stringNormalized[i];

			// If entering/exiting a string
			if (character === "'" || character === "\"") {
				if (modesEntered[lastModeIndex].isCalculationEnabled === true) {
					modesEntered.push({
						mode: "string",
						isCalculationEnabled: false,
						character,
					});
					lastModeIndex++;
				} else if (modesEntered[lastModeIndex].mode === "string" &&
					modesEntered[lastModeIndex].character === character &&
					stringNormalized[i - 1] !== "\\"
				) {
					modesEntered.pop();
					lastModeIndex--;
				}
			}

			// If entering/exiting interpolation
			if (character === "{") {
				modesEntered.push({
					mode: "interpolation",
					isCalculationEnabled: true,
				});
				lastModeIndex++;
			} else if (character === "}") {
				modesEntered.pop();
				lastModeIndex--;
			}

			// If a : is met outside of a string, function call or interpolation, than
			// this : separates a media feature and a value
			if (modesEntered[lastModeIndex].mode === "normal" && character === ":") {
				const mediaFeatureValueStr = stringNormalized.substring(i + 1);
				mediaFeatureValue = {
					type: "value",
					before: /^(\s*)/.exec(mediaFeatureValueStr)[1],
					after: /(\s*)$/.exec(mediaFeatureValueStr)[1],
					value: mediaFeatureValueStr.trim(),
				};
				// +1 for the colon
				mediaFeatureValue.sourceIndex =
					mediaFeatureValue.before.length + i + 1 + indexLocal;
				colon = {
					type: "colon",
					sourceIndex: i + indexLocal,
					after: mediaFeatureValue.before,
					value: ":", // for consistency only
				};
				break;
			}

			mediaFeature += character;
		}

		// Forming a media feature node
		mediaFeature = {
			type: "media-feature",
			before: /^(\s*)/.exec(mediaFeature)[1],
			after: /(\s*)$/.exec(mediaFeature)[1],
			value: mediaFeature.trim(),
		};
		mediaFeature.sourceIndex = mediaFeature.before.length + indexLocal;
		result.push(mediaFeature);

		if (colon !== null) {
			colon.before = mediaFeature.after;
			result.push(colon);
		}

		if (mediaFeatureValue !== null) {
			result.push(mediaFeatureValue);
		}

		return result;
	}

	/**
	 * Parses a media query, e.g. `screen and (color)`, `only tv`
	 *
	 * @param {string} string - the source media query string
	 * @param {Number} index - the index of `string` in the overall input
	 *
	 * @return {Array} an array of Nodes and Containers
	 */

	function parseMediaQuery(string, index = 0) {
		const result = [];

		// How many times the parser entered parens/curly braces
		let localLevel = 0;
		// Has any keyword, media type, media feature expression or interpolation
		// ('element' hereafter) started
		let insideSomeValue = false, node;

		function resetNode() {
			return {
				before: "",
				after: "",
				value: "",
			};
		}

		node = resetNode();

		for (let i = 0; i < string.length; i++) {
			const character = string[i];
			// If not yet entered any element
			if (!insideSomeValue) {
				if (character.search(/\s/) !== -1) {
					// A whitespace
					// Don't form 'after' yet; will do it later
					node.before += character;
				} else {
					// Not a whitespace - entering an element
					// Expression start
					if (character === "(") {
						node.type = "media-feature-expression";
						localLevel++;
					}
					node.value = character;
					node.sourceIndex = index + i;
					insideSomeValue = true;
				}
			} else {
				// Already in the middle of some element
				node.value += character;

				// Here parens just increase localLevel and don't trigger a start of
				// a media feature expression (since they can't be nested)
				// Interpolation start
				if (character === "{" || character === "(") { localLevel++; }
				// Interpolation/function call/media feature expression end
				if (character === ")" || character === "}") { localLevel--; }
			}

			// If exited all parens/curlies and the next symbol
			if (insideSomeValue && localLevel === 0 &&
				(character === ")" || i === string.length - 1 ||
					string[i + 1].search(/\s/) !== -1)
			) {
				if (["not", "only", "and"].indexOf(node.value) !== -1) {
					node.type = "keyword";
				}
				// if it's an expression, parse its contents
				if (node.type === "media-feature-expression") {
					node.nodes = parseMediaFeature(node.value, node.sourceIndex);
				}
				result.push(Array.isArray(node.nodes) ?
					new Container(node) : new Node$1(node));
				node = resetNode();
				insideSomeValue = false;
			}
		}

		// Now process the result array - to specify undefined types of the nodes
		// and specify the `after` prop
		for (let i = 0; i < result.length; i++) {
			node = result[i];
			if (i > 0) { result[i - 1].after = node.before; }

			// Node types. Might not be set because contains interpolation/function
			// calls or fully consists of them
			if (node.type === undefined) {
				if (i > 0) {
					// only `and` can follow an expression
					if (result[i - 1].type === "media-feature-expression") {
						node.type = "keyword";
						continue;
					}
					// Anything after 'only|not' is a media type
					if (result[i - 1].value === "not" || result[i - 1].value === "only") {
						node.type = "media-type";
						continue;
					}
					// Anything after 'and' is an expression
					if (result[i - 1].value === "and") {
						node.type = "media-feature-expression";
						continue;
					}

					if (result[i - 1].type === "media-type") {
						// if it is the last element - it might be an expression
						// or 'and' depending on what is after it
						if (!result[i + 1]) {
							node.type = "media-feature-expression";
						} else {
							node.type = result[i + 1].type === "media-feature-expression" ?
								"keyword" : "media-feature-expression";
						}
					}
				}

				if (i === 0) {
					// `screen`, `fn( ... )`, `#{ ... }`. Not an expression, since then
					// its type would have been set by now
					if (!result[i + 1]) {
						node.type = "media-type";
						continue;
					}

					// `screen and` or `#{...} (max-width: 10px)`
					if (result[i + 1] &&
						(result[i + 1].type === "media-feature-expression" ||
							result[i + 1].type === "keyword")
					) {
						node.type = "media-type";
						continue;
					}
					if (result[i + 2]) {
						// `screen and (color) ...`
						if (result[i + 2].type === "media-feature-expression") {
							node.type = "media-type";
							result[i + 1].type = "keyword";
							continue;
						}
						// `only screen and ...`
						if (result[i + 2].type === "keyword") {
							node.type = "keyword";
							result[i + 1].type = "media-type";
							continue;
						}
					}
					if (result[i + 3]) {
						// `screen and (color) ...`
						if (result[i + 3].type === "media-feature-expression") {
							node.type = "keyword";
							result[i + 1].type = "media-type";
							result[i + 2].type = "keyword";
							continue;
						}
					}
				}
			}
		}
		return result;
	}

	/**
	 * Parses a media query list. Takes a possible `url()` at the start into
	 * account, and divides the list into media queries that are parsed separately
	 *
	 * @param {string} string - the source media query list string
	 *
	 * @return {Array} an array of Nodes/Containers
	 */

	function parseMediaList(string) {
		const result = [];
		let interimIndex = 0, levelLocal = 0;

		// Check for a `url(...)` part (if it is contents of an @import rule)
		const doesHaveUrl = /^(\s*)url\s*\(/.exec(string);
		if (doesHaveUrl !== null) {
			let i = doesHaveUrl[0].length;
			let parenthesesLv = 1;
			while (parenthesesLv > 0) {
				const character = string[i];
				if (character === "(") { parenthesesLv++; }
				if (character === ")") { parenthesesLv--; }
				i++;
			}
			result.unshift(new Node$1({
				type: "url",
				value: string.substring(0, i).trim(),
				sourceIndex: doesHaveUrl[1].length,
				before: doesHaveUrl[1],
				after: /^(\s*)/.exec(string.substring(i))[1],
			}));
			interimIndex = i;
		}

		// Start processing the media query list
		for (let i = interimIndex; i < string.length; i++) {
			const character = string[i];

			// Dividing the media query list into comma-separated media queries
			// Only count commas that are outside of any parens
			// (i.e., not part of function call params list, etc.)
			if (character === "(") { levelLocal++; }
			if (character === ")") { levelLocal--; }
			if (levelLocal === 0 && character === ",") {
				const mediaQueryString = string.substring(interimIndex, i);
				const spaceBefore = /^(\s*)/.exec(mediaQueryString)[1];
				result.push(new Container({
					type: "media-query",
					value: mediaQueryString.trim(),
					sourceIndex: interimIndex + spaceBefore.length,
					nodes: parseMediaQuery(mediaQueryString, interimIndex),
					before: spaceBefore,
					after: /(\s*)$/.exec(mediaQueryString)[1],
				}));
				interimIndex = i + 1;
			}
		}

		const mediaQueryString = string.substring(interimIndex);
		const spaceBefore = /^(\s*)/.exec(mediaQueryString)[1];
		result.push(new Container({
			type: "media-query",
			value: mediaQueryString.trim(),
			sourceIndex: interimIndex + spaceBefore.length,
			nodes: parseMediaQuery(mediaQueryString, interimIndex),
			before: spaceBefore,
			after: /(\s*)$/.exec(mediaQueryString)[1],
		}));

		return result;
	}

	function Container(opts) {
		this.constructor(opts);

		this.nodes = opts.nodes;

		if (this.after === undefined) {
			this.after = this.nodes.length > 0 ?
				this.nodes[this.nodes.length - 1].after : "";
		}

		if (this.before === undefined) {
			this.before = this.nodes.length > 0 ?
				this.nodes[0].before : "";
		}

		if (this.sourceIndex === undefined) {
			this.sourceIndex = this.before.length;
		}

		this.nodes.forEach(node => {
			node.parent = this; // eslint-disable-line no-param-reassign
		});
	}

	Container.prototype = Object.create(Node$1.prototype);
	Container.constructor = Node$1;

	/**
	 * Iterate over descendant nodes of the node
	 *
	 * @param {RegExp|string} filter - Optional. Only nodes with node.type that
	 *    satisfies the filter will be traversed over
	 * @param {function} cb - callback to call on each node. Takes these params:
	 *    node - the node being processed, i - it's index, nodes - the array
	 *    of all nodes
	 *    If false is returned, the iteration breaks
	 *
	 * @return (boolean) false, if the iteration was broken
	 */
	Container.prototype.walk = function walk(filter, cb) {
		const hasFilter = typeof filter === "string" || filter instanceof RegExp;
		const callback = hasFilter ? cb : filter;
		const filterReg = typeof filter === "string" ? new RegExp(filter) : filter;

		for (let i = 0; i < this.nodes.length; i++) {
			const node = this.nodes[i];
			const filtered = hasFilter ? filterReg.test(node.type) : true;
			if (filtered && callback && callback(node, i, this.nodes) === false) {
				return false;
			}
			if (node.nodes && node.walk(filter, cb) === false) { return false; }
		}
		return true;
	};

	/**
	 * Iterate over immediate children of the node
	 *
	 * @param {function} cb - callback to call on each node. Takes these params:
	 *    node - the node being processed, i - it's index, nodes - the array
	 *    of all nodes
	 *    If false is returned, the iteration breaks
	 *
	 * @return (boolean) false, if the iteration was broken
	 */
	Container.prototype.each = function each(cb = () => { }) {
		for (let i = 0; i < this.nodes.length; i++) {
			const node = this.nodes[i];
			if (cb(node, i, this.nodes) === false) { return false; }
		}
		return true;
	};

	/**
	 * A very generic node. Pretty much any element of a media query
	 */

	function Node$1(opts) {
		this.after = opts.after;
		this.before = opts.before;
		this.type = opts.type;
		this.value = opts.value;
		this.sourceIndex = opts.sourceIndex;
	}

	/*
	 * The MIT License (MIT)
	 * 
	 * Author: Gildas Lormeau
	 * 
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in all
	 * copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	 * SOFTWARE.
	 */

	// derived from https://github.com/fmarcia/UglifyCSS

	/**
	 * UglifyCSS
	 * Port of YUI CSS Compressor to NodeJS
	 * Author: Franck Marcia - https://github.com/fmarcia
	 * MIT licenced
	 */

	/**
	 * cssmin.js
	 * Author: Stoyan Stefanov - http://phpied.com/
	 * This is a JavaScript port of the CSS minification tool
	 * distributed with YUICompressor, itself a port
	 * of the cssmin utility by Isaac Schlueter - http://foohack.com/
	 * Permission is hereby granted to use the JavaScript version under the same
	 * conditions as the YUICompressor (original YUICompressor note below).
	 */

	/**
	 * YUI Compressor
	 * http://developer.yahoo.com/yui/compressor/
	 * Author: Julien Lecomte - http://www.julienlecomte.net/
	 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
	 * The copyrights embodied in the content of this file are licensed
	 * by Yahoo! Inc. under the BSD (revised) open source license.
	 */

	/**
	 * @type {string} - placeholder prefix
	 */

	const ___PRESERVED_TOKEN_ = "___PRESERVED_TOKEN_";

	/**
	 * @typedef {object} options - UglifyCSS options
	 * @property {number} [maxLineLen=0] - Maximum line length of uglified CSS
	 * @property {boolean} [expandVars=false] - Expand variables
	 * @property {boolean} [uglyComments=false] - Removes newlines within preserved comments
	 * @property {boolean} [cuteComments=false] - Preserves newlines within and around preserved comments
	 * @property {boolean} [debug=false] - Prints full error stack on error
	 * @property {string} [output=''] - Output file name
	 */

	/**
	 * @type {options} - UglifyCSS options
	 */

	const defaultOptions = {
		maxLineLen: 0,
		expandVars: false,
		uglyComments: false,
		cuteComments: false,
		debug: false,
		output: ""
	};

	const REGEXP_DATA_URI = /url\(\s*(["']?)data:/g;
	const REGEXP_WHITE_SPACES = /\s+/g;
	const REGEXP_NEW_LINE = /\n/g;

	/**
	 * extractDataUrls replaces all data urls with tokens before we start
	 * compressing, to avoid performance issues running some of the subsequent
	 * regexes against large strings chunks.
	 *
	 * @param {string} css - CSS content
	 * @param {string[]} preservedTokens - Global array of tokens to preserve
	 *
	 * @return {string} Processed CSS
	 */

	function extractDataUrls(css, preservedTokens) {

		// Leave data urls alone to increase parse performance.
		const pattern = REGEXP_DATA_URI;
		const maxIndex = css.length - 1;
		const sb = [];

		let appendIndex = 0, match;

		// Since we need to account for non-base64 data urls, we need to handle
		// ' and ) being part of the data string. Hence switching to indexOf,
		// to determine whether or not we have matching string terminators and
		// handling sb appends directly, instead of using matcher.append* methods.

		while ((match = pattern.exec(css)) !== null) {

			const startIndex = match.index + 4;  // 'url('.length()
			let terminator = match[1];         // ', " or empty (not quoted)

			if (terminator.length === 0) {
				terminator = ")";
			}

			let foundTerminator = false, endIndex = pattern.lastIndex - 1;

			while (foundTerminator === false && endIndex + 1 <= maxIndex && endIndex != -1) {
				endIndex = css.indexOf(terminator, endIndex + 1);

				// endIndex == 0 doesn't really apply here
				if ((endIndex > 0) && (css.charAt(endIndex - 1) !== "\\")) {
					foundTerminator = true;
					if (")" != terminator) {
						endIndex = css.indexOf(")", endIndex);
					}
				}
			}

			// Enough searching, start moving stuff over to the buffer
			sb.push(css.substring(appendIndex, match.index));

			if (foundTerminator) {

				let token = css.substring(startIndex, endIndex);
				const parts = token.split(",");
				if (parts.length > 1 && parts[0].slice(-7) == ";base64") {
					token = token.replace(REGEXP_WHITE_SPACES, "");
				} else {
					token = token.replace(REGEXP_NEW_LINE, " ");
					token = token.replace(REGEXP_WHITE_SPACES, " ");
					token = token.replace(REGEXP_PRESERVE_HSLA1, "");
				}

				preservedTokens.push(token);

				const preserver = "url(" + ___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___)";
				sb.push(preserver);

				appendIndex = endIndex + 1;
			} else {
				// No end terminator found, re-add the whole match. Should we throw/warn here?
				sb.push(css.substring(match.index, pattern.lastIndex));
				appendIndex = pattern.lastIndex;
			}
		}

		sb.push(css.substring(appendIndex));

		return sb.join("");
	}

	const REGEXP_HEX_COLORS = /(=\s*?["']?)?#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])(\}|[^0-9a-f{][^{]*?\})/gi;

	/**
	 * compressHexColors compresses hex color values of the form #AABBCC to #ABC.
	 *
	 * DOES NOT compress CSS ID selectors which match the above pattern (which would
	 * break things), like #AddressForm { ... }
	 *
	 * DOES NOT compress IE filters, which have hex color values (which would break
	 * things), like chroma(color='#FFFFFF');
	 *
	 * DOES NOT compress invalid hex values, like background-color: #aabbccdd
	 *
	 * @param {string} css - CSS content
	 *
	 * @return {string} Processed CSS
	 */

	function compressHexColors(css) {

		// Look for hex colors inside { ... } (to avoid IDs) and which don't have a =, or a " in front of them (to avoid filters)

		const pattern = REGEXP_HEX_COLORS;
		const sb = [];

		let index = 0, match;

		while ((match = pattern.exec(css)) !== null) {

			sb.push(css.substring(index, match.index));

			const isFilter = match[1];

			if (isFilter) {
				// Restore, maintain case, otherwise filter will break
				sb.push(match[1] + "#" + (match[2] + match[3] + match[4] + match[5] + match[6] + match[7]));
			} else {
				if (match[2].toLowerCase() == match[3].toLowerCase() &&
					match[4].toLowerCase() == match[5].toLowerCase() &&
					match[6].toLowerCase() == match[7].toLowerCase()) {

					// Compress.
					sb.push("#" + (match[3] + match[5] + match[7]).toLowerCase());
				} else {
					// Non compressible color, restore but lower case.
					sb.push("#" + (match[2] + match[3] + match[4] + match[5] + match[6] + match[7]).toLowerCase());
				}
			}

			index = pattern.lastIndex = pattern.lastIndex - match[8].length;
		}

		sb.push(css.substring(index));

		return sb.join("");
	}

	const REGEXP_KEYFRAMES = /@[a-z0-9-_]*keyframes\s+[a-z0-9-_]+\s*{/gi;
	const REGEXP_WHITE_SPACE = /(^\s|\s$)/g;

	/** keyframes preserves 0 followed by unit in keyframes steps
	 *
	 * @param {string} content - CSS content
	 * @param {string[]} preservedTokens - Global array of tokens to preserve
	 *
	 * @return {string} Processed CSS
	 */

	function keyframes(content, preservedTokens) {

		const pattern = REGEXP_KEYFRAMES;

		let index = 0, buffer;

		const preserve = (part, i) => {
			part = part.replace(REGEXP_WHITE_SPACE, "");
			if (part.charAt(0) === "0") {
				preservedTokens.push(part);
				buffer[i] = ___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___";
			}
		};

		while (true) { // eslint-disable-line no-constant-condition

			let level = 0;
			buffer = "";

			let startIndex = content.slice(index).search(pattern);
			if (startIndex < 0) {
				break;
			}

			index += startIndex;
			startIndex = index;

			const len = content.length;
			const buffers = [];

			for (; index < len; ++index) {

				const ch = content.charAt(index);

				if (ch === "{") {

					if (level === 0) {
						buffers.push(buffer.replace(REGEXP_WHITE_SPACE, ""));

					} else if (level === 1) {

						buffer = buffer.split(",");

						buffer.forEach(preserve);

						buffers.push(buffer.join(",").replace(REGEXP_WHITE_SPACE, ""));
					}

					buffer = "";
					level += 1;

				} else if (ch === "}") {

					if (level === 2) {
						buffers.push("{" + buffer.replace(REGEXP_WHITE_SPACE, "") + "}");
						buffer = "";

					} else if (level === 1) {
						content = content.slice(0, startIndex) +
							buffers.shift() + "{" +
							buffers.join("") +
							content.slice(index);
						break;
					}

					level -= 1;
				}

				if (level < 0) {
					break;

				} else if (ch !== "{" && ch !== "}") {
					buffer += ch;
				}
			}
		}

		return content;
	}

	/**
	 * collectComments collects all comment blocks and return new content with comment placeholders
	 *
	 * @param {string} content - CSS content
	 * @param {string[]} comments - Global array of extracted comments
	 *
	 * @return {string} Processed CSS
	 */

	function collectComments(content, comments) {

		const table = [];

		let from = 0, end;

		while (true) { // eslint-disable-line no-constant-condition

			const start = content.indexOf("/*", from);

			if (start > -1) {

				end = content.indexOf("*/", start + 2);

				if (end > -1) {
					comments.push(content.slice(start + 2, end));
					table.push(content.slice(from, start));
					table.push("/*___PRESERVE_CANDIDATE_COMMENT_" + (comments.length - 1) + "___*/");
					from = end + 2;

				} else {
					// unterminated comment
					end = -2;
					break;
				}

			} else {
				break;
			}
		}

		table.push(content.slice(end + 2));

		return table.join("");
	}

	/**
	 * processString uglifies a CSS string
	 *
	 * @param {string} content - CSS string
	 * @param {options} options - UglifyCSS options
	 *
	 * @return {string} Uglified result
	 */

	// const REGEXP_EMPTY_RULES = /[^};{/]+\{\}/g;
	const REGEXP_PRESERVE_STRING1 = /"([^\\"])*"/g;
	const REGEXP_PRESERVE_STRING1_BIS = /"(\\.)*"/g;
	const REGEXP_PRESERVE_STRING1_TER = /"(\\)*"/g;
	const REGEXP_PRESERVE_STRING2 = /'([^\\'])*'/g;
	const REGEXP_PRESERVE_STRING2_BIS = /'(\\.)*'/g;
	const REGEXP_PRESERVE_STRING2_TER = /'(\\)*'/g;
	const REGEXP_MINIFY_ALPHA = /progid:DXImageTransform.Microsoft.Alpha\(Opacity=/gi;
	const REGEXP_PRESERVE_TOKEN1 = /\r\n/g;
	const REGEXP_PRESERVE_TOKEN2 = /[\r\n]/g;
	const REGEXP_VARIABLES = /@variables\s*\{\s*([^}]+)\s*\}/g;
	const REGEXP_VARIABLE = /\s*([a-z0-9-]+)\s*:\s*([^;}]+)\s*/gi;
	const REGEXP_VARIABLE_VALUE = /var\s*\(\s*([^)]+)\s*\)/g;
	const REGEXP_PRESERVE_CALC = /calc\(([^;}]*)\)/g;
	const REGEXP_TRIM = /(^\s*|\s*$)/g;
	const REGEXP_PRESERVE_CALC2 = /\( /g;
	const REGEXP_PRESERVE_CALC3 = / \)/g;
	const REGEXP_PRESERVE_MATRIX = /\s*filter:\s*progid:DXImageTransform.Microsoft.Matrix\(([^)]+)\);/g;
	const REGEXP_REMOVE_SPACES = /(^|\})(([^{:])+:)+([^{]*{)/g;
	const REGEXP_REMOVE_SPACES2 = /\s+([!{;:>+()\],])/g;
	const REGEXP_REMOVE_SPACES2_BIS = /([^\\])\s+([}])/g;
	const REGEXP_RESTORE_SPACE_IMPORTANT = /!important/g;
	const REGEXP_PSEUDOCLASSCOLON = /___PSEUDOCLASSCOLON___/g;
	const REGEXP_COLUMN = /:/g;
	const REGEXP_PRESERVE_ZERO_UNIT = /\s*(animation|animation-delay|animation-duration|transition|transition-delay|transition-duration):\s*([^;}]+)/gi;
	const REGEXP_PRESERVE_ZERO_UNIT1 = /(^|\D)0?\.?0(m?s)/gi;
	const REGEXP_PRESERVE_FLEX = /\s*(flex|flex-basis):\s*([^;}]+)/gi;
	const REGEXP_SPACES = /\s+/;
	const REGEXP_PRESERVE_HSLA = /(hsla?)\(([^)]+)\)/g;
	const REGEXP_PRESERVE_HSLA1 = /(^\s+|\s+$)/g;
	const REGEXP_RETAIN_SPACE_IE6 = /:first-(line|letter)(\{|,)/gi;
	const REGEXP_CHARSET = /^(.*)(@charset)( "[^"]*";)/gi;
	const REGEXP_REMOVE_SECOND_CHARSET = /^((\s*)(@charset)( [^;]+;\s*))+/gi;
	const REGEXP_LOWERCASE_DIRECTIVES = /@(font-face|import|(?:-(?:atsc|khtml|moz|ms|o|wap|webkit)-)?keyframe|media|page|namespace)/gi;
	const REGEXP_LOWERCASE_PSEUDO_ELEMENTS = /:(active|after|before|checked|disabled|empty|enabled|first-(?:child|of-type)|focus|hover|last-(?:child|of-type)|link|only-(?:child|of-type)|root|:selection|target|visited)/gi;
	const REGEXP_CHARSET2 = /^(.*)(@charset "[^"]*";)/g;
	const REGEXP_CHARSET3 = /^(\s*@charset [^;]+;\s*)+/g;
	const REGEXP_LOWERCASE_FUNCTIONS = /:(lang|not|nth-child|nth-last-child|nth-last-of-type|nth-of-type|(?:-(?:atsc|khtml|moz|ms|o|wap|webkit)-)?any)\(/gi;
	const REGEXP_LOWERCASE_FUNCTIONS2 = /([:,( ]\s*)(attr|color-stop|from|rgba|to|url|(?:-(?:atsc|khtml|moz|ms|o|wap|webkit)-)?(?:calc|max|min|(?:repeating-)?(?:linear|radial)-gradient)|-webkit-gradient)/gi;
	const REGEXP_NEWLINE1 = /\s*\/\*/g;
	const REGEXP_NEWLINE2 = /\*\/\s*/g;
	const REGEXP_RESTORE_SPACE1 = /\band\(/gi;
	const REGEXP_RESTORE_SPACE2 = /([^:])not\(/gi;
	const REGEXP_RESTORE_SPACE3 = /\bor\(/gi;
	const REGEXP_REMOVE_SPACES3 = /([!{}:;>+([,])\s+/g;
	const REGEXP_REMOVE_SEMI_COLUMNS = /;+\}/g;
	// const REGEXP_REPLACE_ZERO = /(^|[^.0-9\\])(?:0?\.)?0(?:ex|ch|r?em|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|g?rad|turn|ms|k?Hz|dpi|dpcm|dppx|%)(?![a-z0-9])/gi;
	const REGEXP_REPLACE_ZERO_DOT = /([0-9])\.0(ex|ch|r?em|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|g?rad|turn|m?s|k?Hz|dpi|dpcm|dppx|%| |;)/gi;
	const REGEXP_REPLACE_4_ZEROS = /:0 0 0 0(;|\})/g;
	const REGEXP_REPLACE_3_ZEROS = /:0 0 0(;|\})/g;
	// const REGEXP_REPLACE_2_ZEROS = /:0 0(;|\})/g;
	const REGEXP_REPLACE_1_ZERO = /(transform-origin|webkit-transform-origin|moz-transform-origin|o-transform-origin|ms-transform-origin|box-shadow):0(;|\})/gi;
	const REGEXP_REPLACE_ZERO_DOT_DECIMAL = /(:|\s)0+\.(\d+)/g;
	const REGEXP_REPLACE_RGB = /rgb\s*\(\s*([0-9,\s]+)\s*\)/gi;
	const REGEXP_REPLACE_BORDER_ZERO = /(border|border-top|border-right|border-bottom|border-left|outline|background):none(;|\})/gi;
	const REGEXP_REPLACE_IE_OPACITY = /progid:DXImageTransform\.Microsoft\.Alpha\(Opacity=/gi;
	const REGEXP_REPLACE_QUERY_FRACTION = /\(([-A-Za-z]+):([0-9]+)\/([0-9]+)\)/g;
	const REGEXP_QUERY_FRACTION = /___QUERY_FRACTION___/g;
	const REGEXP_REPLACE_SEMI_COLUMNS = /;;+/g;
	const REGEXP_REPLACE_HASH_COLOR = /(:|\s)(#f00)(;|})/g;
	const REGEXP_PRESERVED_NEWLINE = /___PRESERVED_NEWLINE___/g;
	const REGEXP_REPLACE_HASH_COLOR_SHORT1 = /(:|\s)(#000080)(;|})/g;
	const REGEXP_REPLACE_HASH_COLOR_SHORT2 = /(:|\s)(#808080)(;|})/g;
	const REGEXP_REPLACE_HASH_COLOR_SHORT3 = /(:|\s)(#808000)(;|})/g;
	const REGEXP_REPLACE_HASH_COLOR_SHORT4 = /(:|\s)(#800080)(;|})/g;
	const REGEXP_REPLACE_HASH_COLOR_SHORT5 = /(:|\s)(#c0c0c0)(;|})/g;
	const REGEXP_REPLACE_HASH_COLOR_SHORT6 = /(:|\s)(#008080)(;|})/g;
	const REGEXP_REPLACE_HASH_COLOR_SHORT7 = /(:|\s)(#ffa500)(;|})/g;
	const REGEXP_REPLACE_HASH_COLOR_SHORT8 = /(:|\s)(#800000)(;|})/g;

	function processString(content = "", options = defaultOptions) {

		const comments = [];
		const preservedTokens = [];

		let pattern;

		const originalContent = content;
		content = extractDataUrls(content, preservedTokens);
		content = collectComments(content, comments);

		preserveString(REGEXP_PRESERVE_STRING1);
		preserveString(REGEXP_PRESERVE_STRING1_BIS);
		preserveString(REGEXP_PRESERVE_STRING1_TER);
		preserveString(REGEXP_PRESERVE_STRING2);
		preserveString(REGEXP_PRESERVE_STRING2_BIS);
		preserveString(REGEXP_PRESERVE_STRING2_TER);

		function preserveString(pattern) {
			content = content.replace(pattern, token => {
				const quote = token.substring(0, 1);
				token = token.slice(1, -1);
				// maybe the string contains a comment-like substring or more? put'em back then
				if (token.indexOf("___PRESERVE_CANDIDATE_COMMENT_") >= 0) {
					for (let i = 0, len = comments.length; i < len; i += 1) {
						token = token.replace("___PRESERVE_CANDIDATE_COMMENT_" + i + "___", comments[i]);
					}
				}
				// minify alpha opacity in filter strings
				token = token.replace(REGEXP_MINIFY_ALPHA, "alpha(opacity=");
				preservedTokens.push(token);
				return quote + ___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___" + quote;
			});
		}

		// strings are safe, now wrestle the comments
		for (let i = 0, len = comments.length; i < len; i += 1) {

			const token = comments[i];
			const placeholder = "___PRESERVE_CANDIDATE_COMMENT_" + i + "___";

			// ! in the first position of the comment means preserve
			// so push to the preserved tokens keeping the !
			if (token.charAt(0) === "!") {
				if (options.cuteComments) {
					preservedTokens.push(token.substring(1).replace(REGEXP_PRESERVE_TOKEN1, "\n"));
				} else if (options.uglyComments) {
					preservedTokens.push(token.substring(1).replace(REGEXP_PRESERVE_TOKEN2, ""));
				} else {
					preservedTokens.push(token);
				}
				content = content.replace(placeholder, ___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___");
				continue;
			}

			// \ in the last position looks like hack for Mac/IE5
			// shorten that to /*\*/ and the next one to /**/
			if (token.charAt(token.length - 1) === "\\") {
				preservedTokens.push("\\");
				content = content.replace(placeholder, ___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___");
				i = i + 1; // attn: advancing the loop
				preservedTokens.push("");
				content = content.replace(
					"___PRESERVE_CANDIDATE_COMMENT_" + i + "___",
					___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___"
				);
				continue;
			}

			// keep empty comments after child selectors (IE7 hack)
			// e.g. html >/**/ body
			if (token.length === 0) {
				const startIndex = content.indexOf(placeholder);
				if (startIndex > 2) {
					if (content.charAt(startIndex - 3) === ">") {
						preservedTokens.push("");
						content = content.replace(placeholder, ___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___");
					}
				}
			}

			// in all other cases kill the comment
			content = content.replace(`/*${placeholder}*/`, "");
		}

		// parse simple @variables blocks and remove them
		if (options.expandVars) {
			const vars = {};
			pattern = REGEXP_VARIABLES;
			content = content.replace(pattern, (_, f1) => {
				pattern = REGEXP_VARIABLE;
				f1.replace(pattern, (_, f1, f2) => {
					if (f1 && f2) {
						vars[f1] = f2;
					}
					return "";
				});
				return "";
			});

			// replace var(x) with the value of x
			pattern = REGEXP_VARIABLE_VALUE;
			content = content.replace(pattern, (_, f1) => {
				return vars[f1] || "none";
			});
		}

		// normalize all whitespace strings to single spaces. Easier to work with that way.
		content = content.replace(REGEXP_WHITE_SPACES, " ");

		// preserve formulas in calc() before removing spaces
		pattern = REGEXP_PRESERVE_CALC;
		content = content.replace(pattern, (_, f1) => {
			preservedTokens.push(
				"calc(" +
				f1.replace(REGEXP_TRIM, "")
					.replace(REGEXP_PRESERVE_CALC2, "(")
					.replace(REGEXP_PRESERVE_CALC3, ")") +
				")"
			);
			return ___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___";
		});

		// preserve matrix
		pattern = REGEXP_PRESERVE_MATRIX;
		content = content.replace(pattern, (_, f1) => {
			preservedTokens.push(f1);
			return "filter:progid:DXImageTransform.Microsoft.Matrix(" + ___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___);";
		});

		// remove the spaces before the things that should not have spaces before them.
		// but, be careful not to turn 'p :link {...}' into 'p:link{...}'
		// swap out any pseudo-class colons with the token, and then swap back.
		try {
			pattern = REGEXP_REMOVE_SPACES;
			content = content.replace(pattern, token => token.replace(REGEXP_COLUMN, "___PSEUDOCLASSCOLON___"));
		} catch (_error) {
			// ignored
		}

		// remove spaces before the things that should not have spaces before them.
		content = content.replace(REGEXP_REMOVE_SPACES2, "$1");
		content = content.replace(REGEXP_REMOVE_SPACES2_BIS, "$1$2");

		// restore spaces for !important
		content = content.replace(REGEXP_RESTORE_SPACE_IMPORTANT, " !important");

		// bring back the colon
		content = content.replace(REGEXP_PSEUDOCLASSCOLON, ":");

		// preserve 0 followed by a time unit for properties using time units
		pattern = REGEXP_PRESERVE_ZERO_UNIT;
		content = content.replace(pattern, (_, f1, f2) => {

			f2 = f2.replace(REGEXP_PRESERVE_ZERO_UNIT1, (_, g1, g2) => {
				preservedTokens.push("0" + g2);
				return g1 + ___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___";
			});

			return f1 + ":" + f2;
		});

		// preserve unit for flex-basis within flex and flex-basis (ie10 bug)
		pattern = REGEXP_PRESERVE_FLEX;
		content = content.replace(pattern, (_, f1, f2) => {
			let f2b = f2.split(REGEXP_SPACES);
			preservedTokens.push(f2b.pop());
			f2b.push(___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___");
			f2b = f2b.join(" ");
			return `${f1}:${f2b}`;
		});

		// preserve 0% in hsl and hsla color definitions
		content = content.replace(REGEXP_PRESERVE_HSLA, (_, f1, f2) => {
			const f0 = [];
			f2.split(",").forEach(part => {
				part = part.replace(REGEXP_PRESERVE_HSLA1, "");
				if (part === "0%") {
					preservedTokens.push("0%");
					f0.push(___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___");
				} else {
					f0.push(part);
				}
			});
			return f1 + "(" + f0.join(",") + ")";
		});

		// preserve 0 followed by unit in keyframes steps (WIP)
		content = keyframes(content, preservedTokens);

		// retain space for special IE6 cases
		content = content.replace(REGEXP_RETAIN_SPACE_IE6, (_, f1, f2) => ":first-" + f1.toLowerCase() + " " + f2);

		// newlines before and after the end of a preserved comment
		if (options.cuteComments) {
			content = content.replace(REGEXP_NEWLINE1, "___PRESERVED_NEWLINE___/*");
			content = content.replace(REGEXP_NEWLINE2, "*/___PRESERVED_NEWLINE___");
			// no space after the end of a preserved comment
		} else {
			content = content.replace(REGEXP_NEWLINE2, "*/");
		}

		// If there are multiple @charset directives, push them to the top of the file.
		pattern = REGEXP_CHARSET;
		content = content.replace(pattern, (_, f1, f2, f3) => f2.toLowerCase() + f3 + f1);

		// When all @charset are at the top, remove the second and after (as they are completely ignored).
		pattern = REGEXP_REMOVE_SECOND_CHARSET;
		content = content.replace(pattern, (_, __, f2, f3, f4) => f2 + f3.toLowerCase() + f4);

		// lowercase some popular @directives (@charset is done right above)
		pattern = REGEXP_LOWERCASE_DIRECTIVES;
		content = content.replace(pattern, (_, f1) => "@" + f1.toLowerCase());

		// lowercase some more common pseudo-elements
		pattern = REGEXP_LOWERCASE_PSEUDO_ELEMENTS;
		content = content.replace(pattern, (_, f1) => ":" + f1.toLowerCase());

		// if there is a @charset, then only allow one, and push to the top of the file.
		content = content.replace(REGEXP_CHARSET2, "$2$1");
		content = content.replace(REGEXP_CHARSET3, "$1");

		// lowercase some more common functions
		pattern = REGEXP_LOWERCASE_FUNCTIONS;
		content = content.replace(pattern, (_, f1) => ":" + f1.toLowerCase() + "(");

		// lower case some common function that can be values
		// NOTE: rgb() isn't useful as we replace with #hex later, as well as and() is already done for us right after this
		pattern = REGEXP_LOWERCASE_FUNCTIONS2;
		content = content.replace(pattern, (_, f1, f2) => f1 + f2.toLowerCase());

		// put the space back in some cases, to support stuff like
		// @media screen and (-webkit-min-device-pixel-ratio:0){
		content = content.replace(REGEXP_RESTORE_SPACE1, "and (");
		content = content.replace(REGEXP_RESTORE_SPACE2, "$1not (");
		content = content.replace(REGEXP_RESTORE_SPACE3, "or (");

		// remove the spaces after the things that should not have spaces after them.
		content = content.replace(REGEXP_REMOVE_SPACES3, "$1");

		// remove unnecessary semicolons
		content = content.replace(REGEXP_REMOVE_SEMI_COLUMNS, "}");

		// replace 0(px,em,%) with 0.
		// content = content.replace(REGEXP_REPLACE_ZERO, "$10");

		// Replace x.0(px,em,%) with x(px,em,%).
		content = content.replace(REGEXP_REPLACE_ZERO_DOT, "$1$2");

		// replace 0 0 0 0; with 0.
		content = content.replace(REGEXP_REPLACE_4_ZEROS, ":0$1");
		content = content.replace(REGEXP_REPLACE_3_ZEROS, ":0$1");
		// content = content.replace(REGEXP_REPLACE_2_ZEROS, ":0$1");

		// replace background-position:0; with background-position:0 0;
		// same for transform-origin and box-shadow
		pattern = REGEXP_REPLACE_1_ZERO;
		content = content.replace(pattern, (_, f1, f2) => f1.toLowerCase() + ":0 0" + f2);

		// replace 0.6 to .6, but only when preceded by : or a white-space
		content = content.replace(REGEXP_REPLACE_ZERO_DOT_DECIMAL, "$1.$2");

		// shorten colors from rgb(51,102,153) to #336699
		// this makes it more likely that it'll get further compressed in the next step.
		pattern = REGEXP_REPLACE_RGB;
		content = content.replace(pattern, (_, f1) => {
			const rgbcolors = f1.split(",");
			let hexcolor = "#";
			for (let i = 0; i < rgbcolors.length; i += 1) {
				let val = parseInt(rgbcolors[i], 10);
				if (val < 16) {
					hexcolor += "0";
				}
				if (val > 255) {
					val = 255;
				}
				hexcolor += val.toString(16);
			}
			return hexcolor;
		});

		// Shorten colors from #AABBCC to #ABC.
		content = compressHexColors(content);

		// Replace #f00 -> red
		content = content.replace(REGEXP_REPLACE_HASH_COLOR, "$1red$3");

		// Replace other short color keywords
		content = content.replace(REGEXP_REPLACE_HASH_COLOR_SHORT1, "$1navy$3");
		content = content.replace(REGEXP_REPLACE_HASH_COLOR_SHORT2, "$1gray$3");
		content = content.replace(REGEXP_REPLACE_HASH_COLOR_SHORT3, "$1olive$3");
		content = content.replace(REGEXP_REPLACE_HASH_COLOR_SHORT4, "$1purple$3");
		content = content.replace(REGEXP_REPLACE_HASH_COLOR_SHORT5, "$1silver$3");
		content = content.replace(REGEXP_REPLACE_HASH_COLOR_SHORT6, "$1teal$3");
		content = content.replace(REGEXP_REPLACE_HASH_COLOR_SHORT7, "$1orange$3");
		content = content.replace(REGEXP_REPLACE_HASH_COLOR_SHORT8, "$1maroon$3");

		// border: none -> border:0
		pattern = REGEXP_REPLACE_BORDER_ZERO;
		content = content.replace(pattern, (_, f1, f2) => f1.toLowerCase() + ":0" + f2);

		// shorter opacity IE filter
		content = content.replace(REGEXP_REPLACE_IE_OPACITY, "alpha(opacity=");

		// Find a fraction that is used for Opera's -o-device-pixel-ratio query
		// Add token to add the '\' back in later
		content = content.replace(REGEXP_REPLACE_QUERY_FRACTION, "($1:$2___QUERY_FRACTION___$3)");

		// remove empty rules.
		// content = content.replace(REGEXP_EMPTY_RULES, "");

		// Add '\' back to fix Opera -o-device-pixel-ratio query
		content = content.replace(REGEXP_QUERY_FRACTION, "/");

		// some source control tools don't like it when files containing lines longer
		// than, say 8000 characters, are checked in. The linebreak option is used in
		// that case to split long lines after a specific column.
		if (options.maxLineLen > 0) {
			const lines = [];
			let line = [];
			for (let i = 0, len = content.length; i < len; i += 1) {
				const ch = content.charAt(i);
				line.push(ch);
				if (ch === "}" && line.length > options.maxLineLen) {
					lines.push(line.join(""));
					line = [];
				}
			}
			if (line.length) {
				lines.push(line.join(""));
			}

			content = lines.join("\n");
		}

		// replace multiple semi-colons in a row by a single one
		// see SF bug #1980989
		content = content.replace(REGEXP_REPLACE_SEMI_COLUMNS, ";");

		// trim the final string (for any leading or trailing white spaces)
		content = content.replace(REGEXP_TRIM, "");

		if (preservedTokens.length > 1000) {
			return originalContent;
		}

		// restore preserved tokens
		for (let i = preservedTokens.length - 1; i >= 0; i--) {
			content = content.replace(___PRESERVED_TOKEN_ + i + "___", preservedTokens[i], "g");
		}

		// restore preserved newlines
		content = content.replace(REGEXP_PRESERVED_NEWLINE, "\n");

		// return
		return content;
	}

	/*
	 * The MIT License (MIT)
	 * 
	 * Author: Gildas Lormeau
	 * 
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in all
	 * copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	 * SOFTWARE.
	 */

	// 1. Let input be the value passed to this algorithm.
	function process$5(input) {

		// UTILITY FUNCTIONS

		// Manual is faster than RegEx
		// http://bjorn.tipling.com/state-and-regular-expressions-in-javascript
		// http://jsperf.com/whitespace-character/5
		function isSpace(c) {
			return (c === "\u0020" || // space
				c === "\u0009" || // horizontal tab
				c === "\u000A" || // new line
				c === "\u000C" || // form feed
				c === "\u000D");  // carriage return
		}

		function collectCharacters(regEx) {
			let chars;
			const match = regEx.exec(input.substring(pos));
			if (match) {
				chars = match[0];
				pos += chars.length;
				return chars;
			}
		}

		const inputLength = input.length;

		// (Don"t use \s, to avoid matching non-breaking space)
		/* eslint-disable no-control-regex */
		const regexLeadingSpaces = /^[ \t\n\r\u000c]+/;
		const regexLeadingCommasOrSpaces = /^[, \t\n\r\u000c]+/;
		const regexLeadingNotSpaces = /^[^ \t\n\r\u000c]+/;
		const regexTrailingCommas = /[,]+$/;
		const regexNonNegativeInteger = /^\d+$/;
		/* eslint-enable no-control-regex */

		// ( Positive or negative or unsigned integers or decimals, without or without exponents.
		// Must include at least one digit.
		// According to spec tests any decimal point must be followed by a digit.
		// No leading plus sign is allowed.)
		// https://html.spec.whatwg.org/multipage/infrastructure.html#valid-floating-point-number
		const regexFloatingPoint = /^-?(?:[0-9]+|[0-9]*\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/;

		let url, descriptors, currentDescriptor, state, c,
			// 2. Let position be a pointer into input, initially pointing at the start
			//    of the string.
			pos = 0;
		// 3. Let candidates be an initially empty source set.
		const candidates = [];

		// 4. Splitting loop: Collect a sequence of characters that are space
		//    characters or U+002C COMMA characters. If any U+002C COMMA characters
		//    were collected, that is a parse error.		
		while (true) { // eslint-disable-line no-constant-condition
			collectCharacters(regexLeadingCommasOrSpaces);

			// 5. If position is past the end of input, return candidates and abort these steps.
			if (pos >= inputLength) {
				return candidates; // (we"re done, this is the sole return path)
			}

			// 6. Collect a sequence of characters that are not space characters,
			//    and let that be url.
			url = collectCharacters(regexLeadingNotSpaces);

			// 7. Let descriptors be a new empty list.
			descriptors = [];

			// 8. If url ends with a U+002C COMMA character (,), follow these substeps:
			//		(1). Remove all trailing U+002C COMMA characters from url. If this removed
			//         more than one character, that is a parse error.
			if (url.slice(-1) === ",") {
				url = url.replace(regexTrailingCommas, "");
				// (Jump ahead to step 9 to skip tokenization and just push the candidate).
				parseDescriptors();

				//	Otherwise, follow these substeps:
			} else {
				tokenize();
			} // (close else of step 8)

			// 16. Return to the step labeled splitting loop.
		} // (Close of big while loop.)

		/**
		 * Tokenizes descriptor properties prior to parsing
		 * Returns undefined.
		 */
		function tokenize() {

			// 8.1. Descriptor tokeniser: Skip whitespace
			collectCharacters(regexLeadingSpaces);

			// 8.2. Let current descriptor be the empty string.
			currentDescriptor = "";

			// 8.3. Let state be in descriptor.
			state = "in descriptor";

			while (true) { // eslint-disable-line no-constant-condition

				// 8.4. Let c be the character at position.
				c = input.charAt(pos);

				//  Do the following depending on the value of state.
				//  For the purpose of this step, "EOF" is a special character representing
				//  that position is past the end of input.

				// In descriptor
				if (state === "in descriptor") {
					// Do the following, depending on the value of c:

					// Space character
					// If current descriptor is not empty, append current descriptor to
					// descriptors and let current descriptor be the empty string.
					// Set state to after descriptor.
					if (isSpace(c)) {
						if (currentDescriptor) {
							descriptors.push(currentDescriptor);
							currentDescriptor = "";
							state = "after descriptor";
						}

						// U+002C COMMA (,)
						// Advance position to the next character in input. If current descriptor
						// is not empty, append current descriptor to descriptors. Jump to the step
						// labeled descriptor parser.
					} else if (c === ",") {
						pos += 1;
						if (currentDescriptor) {
							descriptors.push(currentDescriptor);
						}
						parseDescriptors();
						return;

						// U+0028 LEFT PARENTHESIS (()
						// Append c to current descriptor. Set state to in parens.
					} else if (c === "\u0028") {
						currentDescriptor = currentDescriptor + c;
						state = "in parens";

						// EOF
						// If current descriptor is not empty, append current descriptor to
						// descriptors. Jump to the step labeled descriptor parser.
					} else if (c === "") {
						if (currentDescriptor) {
							descriptors.push(currentDescriptor);
						}
						parseDescriptors();
						return;

						// Anything else
						// Append c to current descriptor.
					} else {
						currentDescriptor = currentDescriptor + c;
					}
					// (end "in descriptor"

					// In parens
				} else if (state === "in parens") {

					// U+0029 RIGHT PARENTHESIS ())
					// Append c to current descriptor. Set state to in descriptor.
					if (c === ")") {
						currentDescriptor = currentDescriptor + c;
						state = "in descriptor";

						// EOF
						// Append current descriptor to descriptors. Jump to the step labeled
						// descriptor parser.
					} else if (c === "") {
						descriptors.push(currentDescriptor);
						parseDescriptors();
						return;

						// Anything else
						// Append c to current descriptor.
					} else {
						currentDescriptor = currentDescriptor + c;
					}

					// After descriptor
				} else if (state === "after descriptor") {

					// Do the following, depending on the value of c:
					// Space character: Stay in this state.
					if (isSpace(c)) ; else if (c === "") {
						parseDescriptors();
						return;

						// Anything else
						// Set state to in descriptor. Set position to the previous character in input.
					} else {
						state = "in descriptor";
						pos -= 1;

					}
				}

				// Advance position to the next character in input.
				pos += 1;

				// Repeat this step.
			} // (close while true loop)
		}

		/**
		 * Adds descriptor properties to a candidate, pushes to the candidates array
		 * @return undefined
		 */
		// Declared outside of the while loop so that it"s only created once.
		function parseDescriptors() {

			// 9. Descriptor parser: Let error be no.
			let pError = false,

				// 10. Let width be absent.
				// 11. Let density be absent.
				// 12. Let future-compat-h be absent. (We"re implementing it now as h)
				w, d, h, i,
				desc, lastChar, value, intVal, floatVal;
			const candidate = {};

			// 13. For each descriptor in descriptors, run the appropriate set of steps
			// from the following list:
			for (i = 0; i < descriptors.length; i++) {
				desc = descriptors[i];

				lastChar = desc[desc.length - 1];
				value = desc.substring(0, desc.length - 1);
				intVal = parseInt(value, 10);
				floatVal = parseFloat(value);

				// If the descriptor consists of a valid non-negative integer followed by
				// a U+0077 LATIN SMALL LETTER W character
				if (regexNonNegativeInteger.test(value) && (lastChar === "w")) {

					// If width and density are not both absent, then let error be yes.
					if (w || d) { pError = true; }

					// Apply the rules for parsing non-negative integers to the descriptor.
					// If the result is zero, let error be yes.
					// Otherwise, let width be the result.
					if (intVal === 0) { pError = true; } else { w = intVal; }

					// If the descriptor consists of a valid floating-point number followed by
					// a U+0078 LATIN SMALL LETTER X character
				} else if (regexFloatingPoint.test(value) && (lastChar === "x")) {

					// If width, density and future-compat-h are not all absent, then let error
					// be yes.
					if (w || d || h) { pError = true; }

					// Apply the rules for parsing floating-point number values to the descriptor.
					// If the result is less than zero, let error be yes. Otherwise, let density
					// be the result.
					if (floatVal < 0) { pError = true; } else { d = floatVal; }

					// If the descriptor consists of a valid non-negative integer followed by
					// a U+0068 LATIN SMALL LETTER H character
				} else if (regexNonNegativeInteger.test(value) && (lastChar === "h")) {

					// If height and density are not both absent, then let error be yes.
					if (h || d) { pError = true; }

					// Apply the rules for parsing non-negative integers to the descriptor.
					// If the result is zero, let error be yes. Otherwise, let future-compat-h
					// be the result.
					if (intVal === 0) { pError = true; } else { h = intVal; }

					// Anything else, Let error be yes.
				} else { pError = true; }
			} // (close step 13 for loop)

			// 15. If error is still no, then append a new image source to candidates whose
			// URL is url, associated with a width width if not absent and a pixel
			// density density if not absent. Otherwise, there is a parse error.
			if (!pError) {
				candidate.url = url;
				if (w) { candidate.w = w; }
				if (d) { candidate.d = d; }
				if (h) { candidate.h = h; }
				candidates.push(candidate);
			} else if (console && console.log) {  // eslint-disable-line no-console
				console.log("Invalid srcset descriptor found in \"" + input + "\" at \"" + desc + "\"."); // eslint-disable-line no-console
			}
		} // (close parseDescriptors fn)

	}

	/*
	 * The MIT License (MIT)
	 * 
	 * Author: Gildas Lormeau
	 * 
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in all
	 * copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	 * SOFTWARE.
	 */

	// derived from https://github.com/jsdom/whatwg-mimetype

	/* 
	 * Copyright © 2017–2018 Domenic Denicola <d@domenic.me>
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

	let utils, parser, serializer, MIMEType;

	// lib/utils.js
	{
		utils = {};
		utils.removeLeadingAndTrailingHTTPWhitespace = string => {
			return string.replace(/^[ \t\n\r]+/, "").replace(/[ \t\n\r]+$/, "");
		};

		utils.removeTrailingHTTPWhitespace = string => {
			return string.replace(/[ \t\n\r]+$/, "");
		};

		utils.isHTTPWhitespaceChar = char => {
			return char === " " || char === "\t" || char === "\n" || char === "\r";
		};

		utils.solelyContainsHTTPTokenCodePoints = string => {
			return /^[-!#$%&'*+.^_`|~A-Za-z0-9]*$/.test(string);
		};

		utils.soleyContainsHTTPQuotedStringTokenCodePoints = string => {
			return /^[\t\u0020-\u007E\u0080-\u00FF]*$/.test(string);
		};

		utils.asciiLowercase = string => {
			return string.replace(/[A-Z]/g, l => l.toLowerCase());
		};

		// This variant only implements it with the extract-value flag set.
		utils.collectAnHTTPQuotedString = (input, position) => {
			let value = "";

			position++;

			// eslint-disable-next-line no-constant-condition
			while (true) {
				while (position < input.length && input[position] !== "\"" && input[position] !== "\\") {
					value += input[position];
					++position;
				}

				if (position >= input.length) {
					break;
				}

				const quoteOrBackslash = input[position];
				++position;

				if (quoteOrBackslash === "\\") {
					if (position >= input.length) {
						value += "\\";
						break;
					}

					value += input[position];
					++position;
				} else {
					break;
				}
			}

			return [value, position];
		};
	}

	// lib/serializer.js
	{
		const { solelyContainsHTTPTokenCodePoints } = utils;
		serializer = mimeType => {
			let serialization = `${mimeType.type}/${mimeType.subtype}`;

			if (mimeType.parameters.size === 0) {
				return serialization;
			}

			for (let [name, value] of mimeType.parameters) {
				serialization += ";";
				serialization += name;
				serialization += "=";

				if (!solelyContainsHTTPTokenCodePoints(value) || value.length === 0) {
					value = value.replace(/(["\\])/g, "\\$1");
					value = `"${value}"`;
				}

				serialization += value;
			}

			return serialization;
		};
	}

	// lib/parser.js
	{
		const {
			removeLeadingAndTrailingHTTPWhitespace,
			removeTrailingHTTPWhitespace,
			isHTTPWhitespaceChar,
			solelyContainsHTTPTokenCodePoints,
			soleyContainsHTTPQuotedStringTokenCodePoints,
			asciiLowercase,
			collectAnHTTPQuotedString
		} = utils;

		parser = input => {
			input = removeLeadingAndTrailingHTTPWhitespace(input);

			let position = 0;
			let type = "";
			while (position < input.length && input[position] !== "/") {
				type += input[position];
				++position;
			}

			if (type.length === 0 || !solelyContainsHTTPTokenCodePoints(type)) {
				return null;
			}

			if (position >= input.length) {
				return null;
			}

			// Skips past "/"
			++position;

			let subtype = "";
			while (position < input.length && input[position] !== ";") {
				subtype += input[position];
				++position;
			}

			subtype = removeTrailingHTTPWhitespace(subtype);

			if (subtype.length === 0 || !solelyContainsHTTPTokenCodePoints(subtype)) {
				return null;
			}

			const mimeType = {
				type: asciiLowercase(type),
				subtype: asciiLowercase(subtype),
				parameters: new Map()
			};

			while (position < input.length) {
				// Skip past ";"
				++position;

				while (isHTTPWhitespaceChar(input[position])) {
					++position;
				}

				let parameterName = "";
				while (position < input.length && input[position] !== ";" && input[position] !== "=") {
					parameterName += input[position];
					++position;
				}
				parameterName = asciiLowercase(parameterName);

				if (position < input.length) {
					if (input[position] === ";") {
						continue;
					}

					// Skip past "="
					++position;
				}

				let parameterValue = null;
				if (input[position] === "\"") {
					[parameterValue, position] = collectAnHTTPQuotedString(input, position);

					while (position < input.length && input[position] !== ";") {
						++position;
					}
				} else {
					parameterValue = "";
					while (position < input.length && input[position] !== ";") {
						parameterValue += input[position];
						++position;
					}

					parameterValue = removeTrailingHTTPWhitespace(parameterValue);

					if (parameterValue === "") {
						continue;
					}
				}

				if (parameterName.length > 0 &&
					solelyContainsHTTPTokenCodePoints(parameterName) &&
					soleyContainsHTTPQuotedStringTokenCodePoints(parameterValue) &&
					!mimeType.parameters.has(parameterName)) {
					mimeType.parameters.set(parameterName, parameterValue);
				}
			}

			return mimeType;
		};
	}

	// lib/mime-type.js
	{
		const parse = parser;
		const serialize = serializer;
		const {
			asciiLowercase,
			solelyContainsHTTPTokenCodePoints,
			soleyContainsHTTPQuotedStringTokenCodePoints
		} = utils;

		MIMEType = class MIMEType {
			constructor(string) {
				string = String(string);
				const result = parse(string);
				if (result === null) {
					throw new Error(`Could not parse MIME type string "${string}"`);
				}

				this._type = result.type;
				this._subtype = result.subtype;
				this._parameters = new MIMETypeParameters(result.parameters);
			}

			static parse(string) {
				try {
					return new this(string);
				} catch (e) {
					return null;
				}
			}

			get essence() {
				return `${this.type}/${this.subtype}`;
			}

			get type() {
				return this._type;
			}

			set type(value) {
				value = asciiLowercase(String(value));

				if (value.length === 0) {
					throw new Error("Invalid type: must be a non-empty string");
				}
				if (!solelyContainsHTTPTokenCodePoints(value)) {
					throw new Error(`Invalid type ${value}: must contain only HTTP token code points`);
				}

				this._type = value;
			}

			get subtype() {
				return this._subtype;
			}

			set subtype(value) {
				value = asciiLowercase(String(value));

				if (value.length === 0) {
					throw new Error("Invalid subtype: must be a non-empty string");
				}
				if (!solelyContainsHTTPTokenCodePoints(value)) {
					throw new Error(`Invalid subtype ${value}: must contain only HTTP token code points`);
				}

				this._subtype = value;
			}

			get parameters() {
				return this._parameters;
			}

			toString() {
				// The serialize function works on both "MIME type records" (i.e. the results of parse) and on this class, since
				// this class's interface is identical.
				return serialize(this);
			}

			isJavaScript({ allowParameters = false } = {}) {
				switch (this._type) {
					case "text": {
						switch (this._subtype) {
							case "ecmascript":
							case "javascript":
							case "javascript1.0":
							case "javascript1.1":
							case "javascript1.2":
							case "javascript1.3":
							case "javascript1.4":
							case "javascript1.5":
							case "jscript":
							case "livescript":
							case "x-ecmascript":
							case "x-javascript": {
								return allowParameters || this._parameters.size === 0;
							}
							default: {
								return false;
							}
						}
					}
					case "application": {
						switch (this._subtype) {
							case "ecmascript":
							case "javascript":
							case "x-ecmascript":
							case "x-javascript": {
								return allowParameters || this._parameters.size === 0;
							}
							default: {
								return false;
							}
						}
					}
					default: {
						return false;
					}
				}
			}
			isXML() {
				return (this._subtype === "xml" && (this._type === "text" || this._type === "application")) ||
					this._subtype.endsWith("+xml");
			}
			isHTML() {
				return this._subtype === "html" && this._type === "text";
			}
		};

		class MIMETypeParameters {
			constructor(map) {
				this._map = map;
			}

			get size() {
				return this._map.size;
			}

			get(name) {
				name = asciiLowercase(String(name));
				return this._map.get(name);
			}

			has(name) {
				name = asciiLowercase(String(name));
				return this._map.has(name);
			}

			set(name, value) {
				name = asciiLowercase(String(name));
				value = String(value);

				if (!solelyContainsHTTPTokenCodePoints(name)) {
					throw new Error(`Invalid MIME type parameter name "${name}": only HTTP token code points are valid.`);
				}
				if (!soleyContainsHTTPQuotedStringTokenCodePoints(value)) {
					throw new Error(`Invalid MIME type parameter value "${value}": only HTTP quoted-string token code points are valid.`);
				}

				return this._map.set(name, value);
			}

			clear() {
				this._map.clear();
			}

			delete(name) {
				name = asciiLowercase(String(name));
				return this._map.delete(name);
			}

			forEach(callbackFn, thisArg) {
				this._map.forEach(callbackFn, thisArg);
			}

			keys() {
				return this._map.keys();
			}

			values() {
				return this._map.values();
			}

			entries() {
				return this._map.entries();
			}

			[Symbol.iterator]() {
				return this._map[Symbol.iterator]();
			}
		}

	}

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	const helper$2 = {
		normalizeFontFamily,
		flatten,
		getFontWeight,
		removeQuotes: removeQuotes$1
	};

	const REGEXP_COMMA = /\s*,\s*/;
	const REGEXP_DASH = /-/;
	const REGEXP_QUESTION_MARK = /\?/g;
	const REGEXP_STARTS_U_PLUS = /^U\+/i;
	const VALID_FONT_STYLES = [/^normal$/, /^italic$/, /^oblique$/, /^oblique\s+/];

	function process$4(doc, stylesheets, styles, options) {
		const stats = { rules: { processed: 0, discarded: 0 }, fonts: { processed: 0, discarded: 0 } };
		const fontsInfo = { declared: [], used: [] };
		const workStyleElement = doc.createElement("style");
		let docContent = "";
		doc.body.appendChild(workStyleElement);
		stylesheets.forEach(stylesheetInfo => {
			const cssRules = stylesheetInfo.stylesheet.children;
			if (cssRules) {
				stats.processed += cssRules.size;
				stats.discarded += cssRules.size;
				getFontsInfo(cssRules, fontsInfo, options);
				docContent = getRulesTextContent(doc, cssRules, workStyleElement, docContent);
			}
		});
		styles.forEach(declarations => {
			const fontFamilyNames = getFontFamilyNames(declarations, options);
			if (fontFamilyNames.length) {
				fontsInfo.used.push(fontFamilyNames);
			}
			docContent = getDeclarationsTextContent(declarations.children, workStyleElement, docContent);
		});
		workStyleElement.remove();
		docContent += doc.body.innerText;
		if (globalThis.getComputedStyle && options.doc) {
			fontsInfo.used = fontsInfo.used.map(fontNames => fontNames.map(familyName => {
				const matchedVar = familyName.match(/^var\((--.*)\)$/);
				if (matchedVar && matchedVar[1]) {
					const computedFamilyName = globalThis.getComputedStyle(options.doc.body).getPropertyValue(matchedVar[1]);
					return (computedFamilyName && computedFamilyName.split(",").map(name => helper$2.normalizeFontFamily(name))) || familyName;
				}
				return familyName;
			}));
			fontsInfo.used = fontsInfo.used.map(fontNames => helper$2.flatten(fontNames));
		}
		const variableFound = fontsInfo.used.find(fontNames => fontNames.find(fontName => fontName.match(/^var\(--/)));
		let unusedFonts, filteredUsedFonts;
		if (variableFound) {
			unusedFonts = [];
		} else {
			filteredUsedFonts = new Map();
			fontsInfo.used.forEach(fontNames => fontNames.forEach(familyName => {
				if (fontsInfo.declared.find(fontInfo => fontInfo.fontFamily == familyName)) {
					const optionalData = options.usedFonts && options.usedFonts.filter(fontInfo => fontInfo[0] == familyName);
					if (optionalData && optionalData.length) {
						filteredUsedFonts.set(familyName, optionalData);
					}
				}
			}));
			unusedFonts = fontsInfo.declared.filter(fontInfo => !filteredUsedFonts.has(fontInfo.fontFamily));
		}
		const docChars = Array.from(new Set(docContent)).map(char => char.charCodeAt(0)).sort((value1, value2) => value1 - value2);
		stylesheets.forEach(stylesheetInfo => {
			const cssRules = stylesheetInfo.stylesheet.children;
			if (cssRules) {
				filterUnusedFonts(cssRules, fontsInfo.declared, unusedFonts, filteredUsedFonts, docChars);
				stats.rules.discarded -= cssRules.size;
			}
		});
		return stats;
	}

	function getFontsInfo(cssRules, fontsInfo, options) {
		cssRules.forEach(ruleData => {
			if (ruleData.type == "Atrule" && (ruleData.name == "media" || ruleData.name == "supports" || ruleData.name == "layer") && ruleData.block && ruleData.block.children) {
				getFontsInfo(ruleData.block.children, fontsInfo, options);
			} else if (ruleData.type == "Rule") {
				const fontFamilyNames = getFontFamilyNames(ruleData.block, options);
				if (fontFamilyNames.length) {
					fontsInfo.used.push(fontFamilyNames);
				}
			} else {
				if (ruleData.type == "Atrule" && ruleData.name == "font-face") {
					const fontFamily = helper$2.normalizeFontFamily(getDeclarationValue(ruleData.block.children, "font-family"));
					if (fontFamily) {
						const fontWeight = getDeclarationValue(ruleData.block.children, "font-weight") || "400";
						const fontStyle = getDeclarationValue(ruleData.block.children, "font-style") || "normal";
						const fontVariant = getDeclarationValue(ruleData.block.children, "font-variant") || "normal";
						fontWeight.split(",").forEach(weightValue =>
							fontsInfo.declared.push({ fontFamily, fontWeight: helper$2.getFontWeight(helper$2.removeQuotes(weightValue)), fontStyle, fontVariant }));
					}
				}
			}
		});
	}

	function filterUnusedFonts(cssRules, declaredFonts, unusedFonts, filteredUsedFonts, docChars) {
		const removedRules = [];
		for (let cssRule = cssRules.head; cssRule; cssRule = cssRule.next) {
			const ruleData = cssRule.data;
			if (ruleData.type == "Atrule" && ruleData.name == "import" && ruleData.prelude && ruleData.prelude.children && ruleData.prelude.children.head.data.importedChildren) {
				filterUnusedFonts(ruleData.prelude.children.head.data.importedChildren, declaredFonts, unusedFonts, filteredUsedFonts, docChars);
			} else if (ruleData.type == "Atrule" && (ruleData.name == "media" || ruleData.name == "supports" || ruleData.name == "layer") && ruleData.block && ruleData.block.children) {
				filterUnusedFonts(ruleData.block.children, declaredFonts, unusedFonts, filteredUsedFonts, docChars);
			} else if (ruleData.type == "Atrule" && ruleData.name == "font-face") {
				const fontFamily = helper$2.normalizeFontFamily(getDeclarationValue(ruleData.block.children, "font-family"));
				if (fontFamily) {
					const unicodeRange = getDeclarationValue(ruleData.block.children, "unicode-range");
					if (unusedFonts.find(fontInfo => fontInfo.fontFamily == fontFamily) || !testUnicodeRange(docChars, unicodeRange) || !testUsedFont(ruleData, fontFamily, declaredFonts, filteredUsedFonts)) {
						removedRules.push(cssRule);
					}
				}
				const removedDeclarations = [];
				for (let declaration = ruleData.block.children.head; declaration; declaration = declaration.next) {
					if (declaration.data.property == "font-display") {
						removedDeclarations.push(declaration);
					}
				}
				if (removedDeclarations.length) {
					removedDeclarations.forEach(removedDeclaration => ruleData.block.children.remove(removedDeclaration));
				}
			}
		}
		removedRules.forEach(cssRule => cssRules.remove(cssRule));
	}

	function testUsedFont(ruleData, familyName, declaredFonts, filteredUsedFonts) {
		let test;
		const optionalUsedFonts = filteredUsedFonts && filteredUsedFonts.get(familyName);
		if (optionalUsedFonts && optionalUsedFonts.length) {
			let fontStyle = getDeclarationValue(ruleData.block.children, "font-style") || "normal";
			if (VALID_FONT_STYLES.find(rule => fontStyle.trim().match(rule))) {
				const fontWeight = helper$2.getFontWeight(getDeclarationValue(ruleData.block.children, "font-weight") || "400");
				const declaredFontsWeights = declaredFonts
					.filter(fontInfo => fontInfo.fontFamily == familyName && fontInfo.fontStyle == fontStyle)
					.map(fontInfo => fontInfo.fontWeight.split(" "))
					.sort((weight1, weight2) => Number.parseInt(weight1[0], 10) - Number.parseInt(weight2[0], 10));
				let usedFontWeights = optionalUsedFonts
					.map(fontInfo => getUsedFontWeight(fontInfo, fontStyle, declaredFontsWeights))
					.filter(fontWeight => fontWeight);
				test = testFontweight(fontWeight, usedFontWeights);
				if (!test) {
					usedFontWeights = optionalUsedFonts
						.map(fontInfo => {
							fontInfo = Array.from(fontInfo);
							fontInfo[2] = "normal";
							return getUsedFontWeight(fontInfo, fontStyle, declaredFontsWeights);
						})
						.filter(fontWeight => fontWeight);
					test = testFontweight(fontWeight, usedFontWeights);
					if (!test) {
						usedFontWeights = optionalUsedFonts
							.map(fontInfo => {
								fontInfo = Array.from(fontInfo);
								fontInfo[2] = fontStyle = "normal";
								return getUsedFontWeight(fontInfo, fontStyle, declaredFontsWeights);
							})
							.filter(fontWeight => fontWeight);
						test = testFontweight(fontWeight, usedFontWeights);
					}
				}
			} else {
				test = true;
			}
		} else {
			test = true;
		}
		return test;
	}

	function testFontweight(fontWeight, usedFontWeights) {
		let test;
		for (const fontWeightValue of fontWeight.split(",")) {
			let { min: fontWeightMin, max: fontWeightMax } = parseFontWeight(fontWeightValue);
			if (!fontWeightMax) {
				fontWeightMax = 900;
			}
			test = test || usedFontWeights.find(usedFontWeight => {
				let { min: usedFontWeightMin, max: usedFontWeightMax } = parseFontWeight(usedFontWeight);
				if (!usedFontWeightMax) {
					usedFontWeightMax = usedFontWeightMin;
				}
				return usedFontWeightMin >= fontWeightMin && usedFontWeightMax <= fontWeightMax;
			});
		}
		return test;
	}

	function parseFontWeight(fontWeight) {
		const fontWeightValues = fontWeight.split(" ");
		const min = Number.parseInt(helper$2.getFontWeight(fontWeightValues[0]), 10);
		const max = fontWeightValues[1] && Number.parseInt(helper$2.getFontWeight(fontWeightValues[1]), 10);
		return {
			min, max
		};
	}

	function getDeclarationValue(declarations, propertyName) {
		let property;
		if (declarations) {
			property = declarations.filter(declaration => declaration.property == propertyName).tail;
		}
		if (property) {
			try {
				return helper$2.removeQuotes(gb(property.data.value)).toLowerCase();
			} catch (error) {
				// ignored
			}
		}
	}

	function getFontFamilyNames(declarations, options) {
		let fontFamilyName = declarations.children.filter(node => node.property == "font-family").tail;
		let fontFamilyNames = [];
		if (fontFamilyName) {
			if (fontFamilyName.data.value.children) {
				parseFamilyNames(fontFamilyName.data.value, fontFamilyNames);
			} else {
				fontFamilyName = gb(fontFamilyName.data.value);
				if (fontFamilyName) {
					fontFamilyNames.push(helper$2.normalizeFontFamily(fontFamilyName));
				}
			}
		}
		const font = declarations.children.filter(node => node.property == "font").tail;
		if (font && font.data && font.data.value) {
			try {
				let value = font.data.value;
				let fontFamilyName = gb(value);
				const matchedVar = fontFamilyName.match(/^var\((--.*)\)$/);
				if (matchedVar && matchedVar[1]) {
					value = db(globalThis.getComputedStyle(options.doc.body).getPropertyValue(matchedVar[1]), { context: "value" });
				}
				const parsedFont = parse(value);
				parsedFont.family.forEach(familyName => fontFamilyNames.push(helper$2.normalizeFontFamily(familyName)));
			} catch (error) {
				// ignored				
			}
		}
		return fontFamilyNames;
	}

	function parseFamilyNames(fontFamilyNameTokenData, fontFamilyNames) {
		let nextToken = fontFamilyNameTokenData.children.head;
		while (nextToken) {
			if (nextToken.data.type == "Identifier") {
				let familyName = nextToken.data.name;
				let nextIdentifierToken = nextToken.next;
				while (nextIdentifierToken && nextIdentifierToken.data.type != "Operator" && nextIdentifierToken.data.value != ",") {
					familyName += " " + nextIdentifierToken.data.name;
					nextIdentifierToken = nextIdentifierToken.next;
				}
				fontFamilyNames.push(helper$2.normalizeFontFamily(familyName));
				nextToken = nextToken.next;
			} else if (nextToken.data.type == "Function" && nextToken.data.name == "var" && nextToken.data.children) {
				const varName = nextToken.data.children.head.data.name;
				fontFamilyNames.push(helper$2.normalizeFontFamily("var(" + varName + ")"));
				let nextValueToken = nextToken.data.children.head.next;
				while (nextValueToken && nextValueToken.data.type == "Operator" && nextValueToken.data.value == ",") {
					nextValueToken = nextValueToken.next;
				}
				const fallbackToken = nextValueToken;
				if (fallbackToken) {
					if (fallbackToken.data.children) {
						parseFamilyNames(fallbackToken.data, fontFamilyNames);
					} else {
						fontFamilyNames.push(helper$2.normalizeFontFamily(fallbackToken.data.value));
					}
				}
				nextToken = nextToken.next;
			} else if (nextToken.data.type == "String") {
				fontFamilyNames.push(helper$2.normalizeFontFamily(nextToken.data.value));
				nextToken = nextToken.next;
			} else if (nextToken.data.type == "Number") {
				fontFamilyNames.push(helper$2.normalizeFontFamily(String(nextToken.data.value)));
				nextToken = nextToken.next;
			} else {
				nextToken = nextToken.next;
			}
		}
	}

	function getUsedFontWeight(fontInfo, fontStyle, fontWeights) {
		let foundWeight;
		fontWeights = fontWeights.map(weights => weights.map(value => String(Number.parseInt(value, 10))));
		if (fontInfo[2] == fontStyle) {
			let fontWeight = Number(fontInfo[1]);
			if (fontWeights.length > 1) {
				if (fontWeight >= 400 && fontWeight <= 500) {
					foundWeight = fontWeights.find(weights => weights[0] >= fontWeight && weights[0] <= 500);
					if (!foundWeight) {
						foundWeight = findDescendingFontWeight(fontWeight, fontWeights);
					}
					if (!foundWeight) {
						foundWeight = findAscendingFontWeight(fontWeight, fontWeights);
					}
				}
				if (fontWeight < 400) {
					foundWeight = fontWeights.slice().reverse().find(weights => weights[weights.length - 1] <= fontWeight);
					if (!foundWeight) {
						foundWeight = findAscendingFontWeight(fontWeight, fontWeights);
					}
				}
				if (fontWeight > 500) {
					foundWeight = fontWeights.find(weights => weights[0] >= fontWeight);
					if (!foundWeight) {
						foundWeight = findDescendingFontWeight(fontWeight, fontWeights);
					}
				}
				if (!foundWeight) {
					foundWeight = fontWeights.find(weights => weights[0] <= fontWeight && weights[weights.length - 1] >= fontWeight);
				}
			} else {
				foundWeight = fontWeights[0];
			}
		}
		return foundWeight ? foundWeight.join(" ") : undefined;
	}

	function findDescendingFontWeight(fontWeight, fontWeights) {
		return fontWeights.slice().reverse().find(weights => weights[weights.length - 1] < fontWeight);
	}

	function findAscendingFontWeight(fontWeight, fontWeights) {
		return fontWeights.find(weights => weights[0] > fontWeight);
	}

	function getRulesTextContent(doc, cssRules, workStylesheet, content) {
		cssRules.forEach(ruleData => {
			if (ruleData.block && ruleData.block.children && ruleData.prelude && ruleData.prelude.children) {
				if (ruleData.type == "Atrule" && (ruleData.name == "media" || ruleData.name == "supports" || ruleData.name == "layer")) {
					content = getRulesTextContent(doc, ruleData.block.children, workStylesheet, content);
				} else if (ruleData.type == "Rule") {
					content = getDeclarationsTextContent(ruleData.block.children, workStylesheet, content);
				}
			}
		});
		return content;
	}

	function getDeclarationsTextContent(declarations, workStylesheet, content) {
		const contentText = getDeclarationUnescapedValue(declarations, "content", workStylesheet);
		const quotesText = getDeclarationUnescapedValue(declarations, "quotes", workStylesheet);
		if (!content.includes(contentText)) {
			content += contentText;
		}
		if (!content.includes(quotesText)) {
			content += quotesText;
		}
		return content;
	}

	function getDeclarationUnescapedValue(declarations, property, workStylesheet) {
		const rawValue = getDeclarationValue(declarations, property) || "";
		if (rawValue) {
			workStylesheet.textContent = "tmp { content:\"" + rawValue + "\"}";
			if (workStylesheet.sheet && workStylesheet.sheet.cssRules) {
				return helper$2.removeQuotes(workStylesheet.sheet.cssRules[0].style.getPropertyValue("content"));
			} else {
				return rawValue;
			}
		}
		return "";
	}

	function testUnicodeRange(docCharCodes, unicodeRange) {
		if (unicodeRange) {
			const unicodeRanges = unicodeRange.split(REGEXP_COMMA);
			const result = unicodeRanges.filter(rangeValue => {
				const range = rangeValue.split(REGEXP_DASH);
				if (range.length == 2) {
					range[0] = transformRange(range[0]);
					range[1] = transformRange(range[1]);
				} else if (range.length == 1) {
					if (range[0].includes("?")) {
						const firstRange = range[0];
						const secondRange = firstRange;
						range[0] = transformRange(firstRange.replace(REGEXP_QUESTION_MARK, "0"));
						range[1] = transformRange(secondRange.replace(REGEXP_QUESTION_MARK, "F"));
					} else if (range[0]) {
						range[0] = transformRange(range[0]);
					}
				}
				if (!range[0] || docCharCodes.find(charCode => charCode >= range[0] && charCode <= range[1])) {
					return true;
				}
			});
			return (!unicodeRanges.length || result.length);
		}
		return true;
	}

	function transformRange(range) {
		range = range.replace(REGEXP_STARTS_U_PLUS, "");
		return parseInt(range, 16);
	}

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	const MEDIA_ALL$1 = "all";
	const IGNORED_PSEUDO_ELEMENTS = ["after", "before", "first-letter", "first-line", "placeholder", "selection", "part", "marker"];
	const SINGLE_FILE_HIDDEN_CLASS_NAME = "sf-hidden";
	const DISPLAY_STYLE = "display";
	const REGEXP_VENDOR_IDENTIFIER = /-(ms|webkit|moz|o)-/;

	class MatchedRules {
		constructor(doc, stylesheets, styles) {
			this.doc = doc;
			this.mediaAllInfo = createMediaInfo(MEDIA_ALL$1);
			const matchedElementsCache = new Map();
			let sheetIndex = 0;
			const workStyleSheet = doc.createElement("style");
			doc.body.appendChild(workStyleSheet);
			const workStyleElement = doc.createElement("span");
			doc.body.appendChild(workStyleElement);
			stylesheets.forEach((stylesheetInfo, key) => {
				if (!stylesheetInfo.scoped && !key.urlNode) {
					const cssRules = stylesheetInfo.stylesheet.children;
					if (cssRules) {
						if (stylesheetInfo.mediaText && stylesheetInfo.mediaText != MEDIA_ALL$1) {
							const mediaInfo = createMediaInfo(stylesheetInfo.mediaText);
							this.mediaAllInfo.medias.set("style-" + sheetIndex + "-" + stylesheetInfo.mediaText, mediaInfo);
							getMatchedElementsRules(doc, cssRules, stylesheets, mediaInfo, sheetIndex, styles, matchedElementsCache, workStyleSheet);
						} else {
							getMatchedElementsRules(doc, cssRules, stylesheets, this.mediaAllInfo, sheetIndex, styles, matchedElementsCache, workStyleSheet);
						}
					}
				}
				sheetIndex++;
			});
			sortRules(this.mediaAllInfo);
			computeCascade(this.mediaAllInfo, [], this.mediaAllInfo, workStyleSheet, workStyleElement);
			workStyleSheet.remove();
			workStyleElement.remove();
		}

		getMediaAllInfo() {
			return this.mediaAllInfo;
		}
	}

	function getMediaAllInfo(doc, stylesheets, styles) {
		return new MatchedRules(doc, stylesheets, styles).getMediaAllInfo();
	}

	function createMediaInfo(media) {
		const mediaInfo = {
			media: media,
			elements: new Map(),
			medias: new Map(),
			rules: new Map(),
			pseudoRules: new Map()
		};
		if (media == MEDIA_ALL$1) {
			mediaInfo.matchedStyles = new Map();
		}
		return mediaInfo;
	}

	function getMatchedElementsRules(doc, cssRules, stylesheets, mediaInfo, sheetIndex, styles, matchedElementsCache, workStylesheet, indexes = {
		mediaIndex: 0, ruleIndex: 0
	}) {
		cssRules.forEach(ruleData => {
			if (ruleData.type == "Atrule" && ruleData.name == "import" && ruleData.prelude && ruleData.prelude.children && ruleData.prelude.children.head.data.importedChildren) {
				getMatchedElementsRules(doc, ruleData.prelude.children.head.data.importedChildren, stylesheets, mediaInfo, sheetIndex, styles, matchedElementsCache, workStylesheet, indexes);
			} else if (ruleData.block && ruleData.block.children && ruleData.prelude && ruleData.prelude.children) {
				if (ruleData.type == "Atrule" && ruleData.name == "media") {
					const mediaText = gb(ruleData.prelude);
					const ruleMediaInfo = createMediaInfo(mediaText);
					mediaInfo.medias.set("rule-" + sheetIndex + "-" + indexes.mediaIndex + "-" + mediaText, ruleMediaInfo);
					getMatchedElementsRules(doc, ruleData.block.children, stylesheets, ruleMediaInfo, sheetIndex, styles, matchedElementsCache, workStylesheet);
					indexes.mediaIndex++;
				} else if (ruleData.type == "Rule") {
					const selectors = ruleData.prelude.children.toArray();
					const selectorsText = ruleData.prelude.children.toArray().map(selector => gb(selector));
					const ruleInfo = { ruleData, mediaInfo, ruleIndex: indexes.ruleIndex, sheetIndex, matchedSelectors: new Set(), declarations: new Set(), selectors, selectorsText };
					if (!invalidSelector(selectorsText.join(","), workStylesheet) || selectorsText.find(selectorText => selectorText.includes("|"))) {
						for (let selector = ruleData.prelude.children.head, selectorIndex = 0; selector; selector = selector.next, selectorIndex++) {
							const selectorText = selectorsText[selectorIndex];
							const selectorInfo = { selector, selectorText, ruleInfo };
							getMatchedElementsSelector(doc, selectorInfo, styles, matchedElementsCache);
						}
					}
					indexes.ruleIndex++;
				}
			}
		});
	}

	function invalidSelector(selectorText, workStylesheet) {
		workStylesheet.textContent = selectorText + "{}";
		return workStylesheet.sheet ? !workStylesheet.sheet.cssRules.length : workStylesheet.sheet;
	}

	function getMatchedElementsSelector(doc, selectorInfo, styles, matchedElementsCache) {
		const filteredSelectorText = getFilteredSelector(selectorInfo.selector, selectorInfo.selectorText);
		const selectorText = filteredSelectorText != selectorInfo.selectorText ? filteredSelectorText : selectorInfo.selectorText;
		const cachedMatchedElements = matchedElementsCache.get(selectorText);
		let matchedElements = cachedMatchedElements;
		if (!matchedElements) {
			try {
				matchedElements = doc.querySelectorAll(selectorText);
				if (selectorText != "." + SINGLE_FILE_HIDDEN_CLASS_NAME) {
					matchedElements = Array.from(doc.querySelectorAll(selectorText)).filter(matchedElement =>
						!matchedElement.classList.contains(SINGLE_FILE_HIDDEN_CLASS_NAME) &&
						(matchedElement.style.getPropertyValue(DISPLAY_STYLE) != "none" || matchedElement.style.getPropertyPriority("display") != "important")
					);
				}
			} catch (error) {
				// ignored				
			}
		}
		if (matchedElements) {
			if (!cachedMatchedElements) {
				matchedElementsCache.set(selectorText, matchedElements);
			}
			if (matchedElements.length) {
				if (filteredSelectorText == selectorInfo.selectorText) {
					matchedElements.forEach(element => addRule(element, selectorInfo, styles));
				} else {
					let pseudoSelectors = selectorInfo.ruleInfo.mediaInfo.pseudoRules.get(selectorInfo.ruleInfo.ruleData);
					if (!pseudoSelectors) {
						pseudoSelectors = new Set();
						selectorInfo.ruleInfo.mediaInfo.pseudoRules.set(selectorInfo.ruleInfo.ruleData, pseudoSelectors);
					}
					pseudoSelectors.add(selectorInfo.selectorText);
				}
			}
		}
	}

	function getFilteredSelector(selector, selectorText) {
		const removedSelectors = [];
		let namespaceFound;
		selector = { data: db(gb(selector.data), { context: "selector" }) };
		filterNamespace(selector);
		if (namespaceFound) {
			selectorText = gb(selector.data).trim();
		}
		filterPseudoClasses(selector);
		if (removedSelectors.length) {
			removedSelectors.forEach(({ parentSelector, selector }) => {
				if (parentSelector.data.children.size == 0 || !selector.prev || selector.prev.data.type == "Combinator" || selector.prev.data.type == "WhiteSpace") {
					parentSelector.data.children.replace(selector, db("*", { context: "selector" }).children.head);
				} else {
					parentSelector.data.children.remove(selector);
				}
			});
			selectorText = gb(selector.data).trim();
		}
		return selectorText;

		function filterPseudoClasses(selector, parentSelector) {
			if (selector.data.children) {
				for (let childSelector = selector.data.children.head; childSelector; childSelector = childSelector.next) {
					filterPseudoClasses(childSelector, selector);
				}
			}
			if ((selector.data.type == "PseudoClassSelector") ||
				(selector.data.type == "PseudoElementSelector" && (testVendorPseudo(selector) || IGNORED_PSEUDO_ELEMENTS.includes(selector.data.name)))) {
				removedSelectors.push({ parentSelector, selector });
			}
		}

		function filterNamespace(selector) {
			if (selector.data.children) {
				for (let childSelector = selector.data.children.head; childSelector; childSelector = childSelector.next) {
					filterNamespace(childSelector);
				}
			}
			if (selector.data.type == "TypeSelector" && selector.data.name.includes("|")) {
				namespaceFound = true;
				selector.data.name = selector.data.name.substring(selector.data.name.lastIndexOf("|") + 1);
			}
		}

		function testVendorPseudo(selector) {
			const name = selector.data.name;
			return name.startsWith("-") || name.startsWith("\\-");
		}
	}

	function addRule(element, selectorInfo, styles) {
		const mediaInfo = selectorInfo.ruleInfo.mediaInfo;
		const elementStyle = styles.get(element);
		let elementInfo = mediaInfo.elements.get(element);
		if (!elementInfo) {
			elementInfo = [];
			if (elementStyle) {
				elementInfo.push({ styleInfo: { styleData: elementStyle, declarations: new Set() } });
			}
			mediaInfo.elements.set(element, elementInfo);
		}
		const specificity = computeSpecificity(selectorInfo.selector.data);
		specificity.ruleIndex = selectorInfo.ruleInfo.ruleIndex;
		specificity.sheetIndex = selectorInfo.ruleInfo.sheetIndex;
		selectorInfo.specificity = specificity;
		elementInfo.push(selectorInfo);
	}

	function computeCascade(mediaInfo, parentMediaInfo, mediaAllInfo, workStylesheet, workStyleElement) {
		mediaInfo.elements.forEach((elementInfo/*, element*/) =>
			getDeclarationsInfo(elementInfo, workStylesheet, workStyleElement/*, element*/).forEach((declarationsInfo, property) => {
				if (declarationsInfo.selectorInfo.ruleInfo || mediaInfo == mediaAllInfo) {
					let info;
					if (declarationsInfo.selectorInfo.ruleInfo) {
						info = declarationsInfo.selectorInfo.ruleInfo;
						const ruleData = info.ruleData;
						const ascendantMedia = [mediaInfo, ...parentMediaInfo].find(media => media.rules.get(ruleData)) || mediaInfo;
						ascendantMedia.rules.set(ruleData, info);
						if (ruleData) {
							info.matchedSelectors.add(declarationsInfo.selectorInfo.selectorText);
						}
					} else {
						info = declarationsInfo.selectorInfo.styleInfo;
						const styleData = info.styleData;
						const matchedStyleInfo = mediaAllInfo.matchedStyles.get(styleData);
						if (!matchedStyleInfo) {
							mediaAllInfo.matchedStyles.set(styleData, info);
						}
					}
					if (!info.declarations.has(property)) {
						info.declarations.add(property);
					}
				}
			}));
		delete mediaInfo.elements;
		mediaInfo.medias.forEach(childMediaInfo => computeCascade(childMediaInfo, [mediaInfo, ...parentMediaInfo], mediaAllInfo, workStylesheet, workStyleElement));
	}

	function getDeclarationsInfo(elementInfo, workStylesheet, workStyleElement/*, element*/) {
		const declarationsInfo = new Map();
		const processedProperties = new Set();
		elementInfo.forEach(selectorInfo => {
			let declarations;
			if (selectorInfo.styleInfo) {
				declarations = selectorInfo.styleInfo.styleData.children;
			} else {
				declarations = selectorInfo.ruleInfo.ruleData.block.children;
			}
			processDeclarations(declarationsInfo, declarations, selectorInfo, processedProperties, workStylesheet, workStyleElement);
		});
		return declarationsInfo;
	}

	function processDeclarations(declarationsInfo, declarations, selectorInfo, processedProperties, workStylesheet, workStyleElement) {
		for (let declaration = declarations.tail; declaration; declaration = declaration.prev) {
			const declarationData = declaration.data;
			const declarationText = gb(declarationData);
			if (declarationData.type == "Declaration" &&
				(declarationText.match(REGEXP_VENDOR_IDENTIFIER) || !processedProperties.has(declarationData.property) || declarationData.important) && !invalidDeclaration(declarationText, workStyleElement)) {
				const declarationInfo = declarationsInfo.get(declarationData);
				if (!declarationInfo || (declarationData.important && !declarationInfo.important)) {
					declarationsInfo.set(declarationData, { selectorInfo, important: declarationData.important });
					if (!declarationText.match(REGEXP_VENDOR_IDENTIFIER)) {
						processedProperties.add(declarationData.property);
					}
				}
			}
		}
	}

	function invalidDeclaration(declarationText, workStyleElement) {
		let invalidDeclaration;
		workStyleElement.style = declarationText;
		if (!workStyleElement.style.length) {
			if (!declarationText.match(REGEXP_VENDOR_IDENTIFIER)) {
				invalidDeclaration = true;
			}
		}
		return invalidDeclaration;
	}

	function sortRules(media) {
		media.elements.forEach(elementRules => elementRules.sort((ruleInfo1, ruleInfo2) =>
			ruleInfo1.styleInfo && !ruleInfo2.styleInfo ? -1 :
				!ruleInfo1.styleInfo && ruleInfo2.styleInfo ? 1 :
					compareSpecificity(ruleInfo1.specificity, ruleInfo2.specificity)));
		media.medias.forEach(sortRules);
	}

	function computeSpecificity(selector, specificity = { a: 0, b: 0, c: 0 }) {
		if (selector.type == "IdSelector") {
			specificity.a++;
		}
		if (selector.type == "ClassSelector" || selector.type == "AttributeSelector" || (selector.type == "PseudoClassSelector" && selector.name != "not")) {
			specificity.b++;
		}
		if ((selector.type == "TypeSelector" && selector.name != "*") || selector.type == "PseudoElementSelector") {
			specificity.c++;
		}
		if (selector.children) {
			selector.children.forEach(selector => computeSpecificity(selector, specificity));
		}
		return specificity;
	}

	function compareSpecificity(specificity1, specificity2) {
		if (specificity1.a > specificity2.a) {
			return -1;
		} else if (specificity1.a < specificity2.a) {
			return 1;
		} else if (specificity1.b > specificity2.b) {
			return -1;
		} else if (specificity1.b < specificity2.b) {
			return 1;
		} else if (specificity1.c > specificity2.c) {
			return -1;
		} else if (specificity1.c < specificity2.c) {
			return 1;
		} else if (specificity1.sheetIndex > specificity2.sheetIndex) {
			return -1;
		} else if (specificity1.sheetIndex < specificity2.sheetIndex) {
			return 1;
		} else if (specificity1.ruleIndex > specificity2.ruleIndex) {
			return -1;
		} else if (specificity1.ruleIndex < specificity2.ruleIndex) {
			return 1;
		} else {
			return -1;
		}
	}

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	const helper$1 = {
		flatten
	};

	const MEDIA_ALL = "all";
	const MEDIA_SCREEN = "screen";

	function process$3(stylesheets) {
		const stats = { processed: 0, discarded: 0 };
		stylesheets.forEach((stylesheetInfo, key) => {
			if (matchesMediaType(stylesheetInfo.mediaText || MEDIA_ALL) && stylesheetInfo.stylesheet.children) {
				const removedRules = processRules$1(stylesheetInfo.stylesheet.children, stats);
				removedRules.forEach(({ cssRules, cssRule }) => cssRules.remove(cssRule));
			} else {
				stylesheets.delete(key);
				if (key.element) {
					key.element.remove();
				}
			}
		});
		return stats;
	}

	function processRules$1(cssRules, stats, removedRules = []) {
		for (let cssRule = cssRules.head; cssRule; cssRule = cssRule.next) {
			const ruleData = cssRule.data;
			if (ruleData.type == "Atrule" && ruleData.name == "media" && ruleData.block && ruleData.block.children && ruleData.prelude && ruleData.prelude.children) {
				stats.processed++;
				if (matchesMediaType(gb(ruleData.prelude))) {
					processRules$1(ruleData.block.children, stats, removedRules);
				} else {
					removedRules.push({ cssRules, cssRule });
					stats.discarded++;
				}
			}
		}
		return removedRules;
	}

	function matchesMediaType(mediaText) {
		const foundMediaTypes = helper$1.flatten(parseMediaList(mediaText).map(node => getMediaTypes(node)));
		return foundMediaTypes.find(mediaTypeInfo =>
			(!mediaTypeInfo.not && (mediaTypeInfo.value == MEDIA_SCREEN || mediaTypeInfo.value == MEDIA_ALL)) ||
			(mediaTypeInfo.not && (mediaTypeInfo.value != MEDIA_SCREEN && mediaTypeInfo.value != MEDIA_ALL)));
	}

	function getMediaTypes(parentNode, mediaTypes = []) {
		parentNode.nodes.map((node, indexNode) => {
			if (node.type == "media-query") {
				return getMediaTypes(node);
			} else {
				if (node.type == "media-type") {
					const nodeMediaType = {
						not: Boolean(indexNode && parentNode.nodes[0].type == "keyword" && parentNode.nodes[0].value == "not"),
						value: node.value
					};
					mediaTypes.push(nodeMediaType);
				}
			}
		});
		if (!mediaTypes.length) {
			mediaTypes.push({ not: false, value: MEDIA_ALL });
		}
		return mediaTypes;
	}

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	function process$2(stylesheets, styles, mediaAllInfo) {
		const stats = { processed: 0, discarded: 0 };
		let sheetIndex = 0;
		stylesheets.forEach((stylesheetInfo, key) => {
			if (!stylesheetInfo.scoped && !key.urlNode) {
				const cssRules = stylesheetInfo.stylesheet.children;
				if (cssRules) {
					stats.processed += cssRules.size;
					stats.discarded += cssRules.size;
					let mediaInfo;
					if (stylesheetInfo.mediaText && stylesheetInfo.mediaText != "all") {
						mediaInfo = mediaAllInfo.medias.get("style-" + sheetIndex + "-" + stylesheetInfo.mediaText);
					} else {
						mediaInfo = mediaAllInfo;
					}
					processRules(cssRules, sheetIndex, mediaInfo);
					stats.discarded -= cssRules.size;
				}
			}
			sheetIndex++;
		});
		styles.forEach(style => processStyleAttribute(style, mediaAllInfo));
		return stats;
	}

	function processRules(cssRules, sheetIndex, mediaInfo, indexes = { mediaRuleIndex: 0 }) {
		const removedCssRules = [];
		for (let cssRule = cssRules.head; cssRule; cssRule = cssRule.next) {
			const ruleData = cssRule.data;
			if (ruleData.type == "Atrule" && ruleData.name == "import" && ruleData.prelude && ruleData.prelude.children && ruleData.prelude.children.head.data.importedChildren) {
				processRules(ruleData.prelude.children.head.data.importedChildren, sheetIndex, mediaInfo, indexes);
			} else if (ruleData.block && ruleData.block.children && ruleData.prelude && ruleData.prelude.children) {
				if (ruleData.type == "Atrule" && ruleData.name == "media") {
					const mediaText = gb(ruleData.prelude);
					processRules(ruleData.block.children, sheetIndex, mediaInfo.medias.get("rule-" + sheetIndex + "-" + indexes.mediaRuleIndex + "-" + mediaText));
					indexes.mediaRuleIndex++;
				} else if (ruleData.type == "Rule") {
					const ruleInfo = mediaInfo.rules.get(ruleData);
					const pseudoSelectors = mediaInfo.pseudoRules.get(ruleData);
					if (!ruleInfo && !pseudoSelectors) {
						removedCssRules.push(cssRule);
					} else if (ruleInfo) {
						processRuleInfo(ruleData, ruleInfo, pseudoSelectors);
						if (!ruleData.prelude.children.size || !ruleData.block.children.size) {
							removedCssRules.push(cssRule);
						}
					}
				}
			} else {
				if (!ruleData || ruleData.type == "Raw" || (ruleData.type == "Rule" && (!ruleData.prelude || ruleData.prelude.type == "Raw"))) {
					removedCssRules.push(cssRule);
				}
			}
		}
		removedCssRules.forEach(cssRule => cssRules.remove(cssRule));
	}

	function processRuleInfo(ruleData, ruleInfo, pseudoSelectors) {
		const removedDeclarations = [];
		const removedSelectors = [];
		let pseudoSelectorFound;
		for (let selector = ruleData.prelude.children.head; selector; selector = selector.next) {
			const selectorText = gb(selector.data);
			if (pseudoSelectors && pseudoSelectors.has(selectorText)) {
				pseudoSelectorFound = true;
			}
			if (!ruleInfo.matchedSelectors.has(selectorText) && (!pseudoSelectors || !pseudoSelectors.has(selectorText))) {
				removedSelectors.push(selector);
			}
		}
		if (!pseudoSelectorFound) {
			for (let declaration = ruleData.block.children.tail; declaration; declaration = declaration.prev) {
				if (!ruleInfo.declarations.has(declaration.data)) {
					removedDeclarations.push(declaration);
				}
			}
		}
		removedDeclarations.forEach(declaration => ruleData.block.children.remove(declaration));
		removedSelectors.forEach(selector => ruleData.prelude.children.remove(selector));
	}

	function processStyleAttribute(styleData, mediaAllInfo) {
		const removedDeclarations = [];
		const styleInfo = mediaAllInfo.matchedStyles.get(styleData);
		if (styleInfo) {
			let propertyFound;
			for (let declaration = styleData.children.head; declaration && !propertyFound; declaration = declaration.next) {
				if (!styleInfo.declarations.has(declaration.data)) {
					removedDeclarations.push(declaration);
				}
			}
			removedDeclarations.forEach(declaration => styleData.children.remove(declaration));
		}
	}

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	const EMPTY_RESOURCE = "data:,";

	function process$1(doc) {
		doc.querySelectorAll("picture").forEach(pictureElement => {
			const imgElement = pictureElement.querySelector("img");
			if (imgElement) {
				let { src, srcset } = getImgSrcData(imgElement);
				if (!src) {
					const data = getSourceSrcData(Array.from(pictureElement.querySelectorAll("source")).reverse());
					src = data.src;
					if (!srcset) {
						srcset = data.srcset;
					}
				}
				setSrc({ src, srcset }, imgElement, pictureElement);
			}
		});
		doc.querySelectorAll(":not(picture) > img[srcset]").forEach(imgElement => setSrc(getImgSrcData(imgElement), imgElement));
	}

	function getImgSrcData(imgElement) {
		let src = imgElement.getAttribute("src");
		if (src == EMPTY_RESOURCE) {
			src = null;
		}
		let srcset = getSourceSrc(imgElement.getAttribute("srcset"));
		if (srcset == EMPTY_RESOURCE) {
			srcset = null;
		}
		return { src, srcset };
	}

	function getSourceSrcData(sources) {
		let source = sources.find(source => source.src);
		let src = source && source.src;
		let srcset = source && source.srcset;
		if (!src) {
			source = sources.find(source => getSourceSrc(source.src));
			src = source && source.src;
			if (src == EMPTY_RESOURCE) {
				src = null;
			}
		}
		if (!srcset) {
			source = sources.find(source => getSourceSrc(source.srcset));
			srcset = source && source.srcset;
			if (srcset == EMPTY_RESOURCE) {
				srcset = null;
			}
		}
		return { src, srcset };
	}

	function setSrc(srcData, imgElement, pictureElement) {
		if (srcData.src) {
			imgElement.setAttribute("src", srcData.src);
			imgElement.setAttribute("srcset", "");
			imgElement.setAttribute("sizes", "");
		} else {
			imgElement.setAttribute("src", EMPTY_RESOURCE);
			if (srcData.srcset) {
				imgElement.setAttribute("srcset", srcData.srcset);
			} else {
				imgElement.setAttribute("srcset", "");
				imgElement.setAttribute("sizes", "");
			}
		}
		if (pictureElement) {
			pictureElement.querySelectorAll("source").forEach(sourceElement => sourceElement.remove());
		}
	}

	function getSourceSrc(sourceSrcSet) {
		if (sourceSrcSet) {
			try {
				const srcset = process$5(sourceSrcSet);
				if (srcset.length) {
					return (srcset.find(srcset => srcset.url)).url;
				}
			} catch (error) {
				// ignored
			}
		}
	}

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	// Derived from the work of Kirill Maltsev - https://github.com/posthtml/htmlnano

	// Source: https://github.com/kangax/html-minifier/issues/63
	const booleanAttributes = [
		"allowfullscreen",
		"async",
		"autofocus",
		"autoplay",
		"checked",
		"compact",
		"controls",
		"declare",
		"default",
		"defaultchecked",
		"defaultmuted",
		"defaultselected",
		"defer",
		"disabled",
		"enabled",
		"formnovalidate",
		"hidden",
		"indeterminate",
		"inert",
		"ismap",
		"itemscope",
		"loop",
		"multiple",
		"muted",
		"nohref",
		"noresize",
		"noshade",
		"novalidate",
		"nowrap",
		"open",
		"pauseonexit",
		"readonly",
		"required",
		"reversed",
		"scoped",
		"seamless",
		"selected",
		"sortable",
		"truespeed",
		"typemustmatch",
		"visible"
	];

	const noWhitespaceCollapseElements = ["SCRIPT", "STYLE", "PRE", "TEXTAREA"];

	// Source: https://www.w3.org/TR/html4/sgml/dtd.html#events (Generic Attributes)
	const safeToRemoveAttrs = [
		"id",
		"class",
		"style",
		"lang",
		"dir",
		"onclick",
		"ondblclick",
		"onmousedown",
		"onmouseup",
		"onmouseover",
		"onmousemove",
		"onmouseout",
		"onkeypress",
		"onkeydown",
		"onkeyup"
	];

	const redundantAttributes = {
		"FORM": {
			"method": "get"
		},
		"SCRIPT": {
			"language": "javascript",
			"type": "text/javascript",
			// Remove attribute if the function returns false
			"charset": node => {
				// The charset attribute only really makes sense on “external” SCRIPT elements:
				// http://perfectionkills.com/optimizing-html/#8_script_charset
				return !node.getAttribute("src");
			}
		},
		"STYLE": {
			"media": "all",
			"type": "text/css"
		},
		"LINK": {
			"media": "all"
		}
	};

	const REGEXP_WHITESPACE = /[ \t\f\r]+/g;
	const REGEXP_NEWLINE = /[\n]+/g;
	const REGEXP_ENDS_WHITESPACE = /^\s+$/;
	const NodeFilter_SHOW_ALL = 4294967295;
	const Node_ELEMENT_NODE = 1;
	const Node_TEXT_NODE = 3;
	const Node_COMMENT_NODE = 8;

	const modules = [
		collapseBooleanAttributes,
		mergeTextNodes,
		collapseWhitespace,
		removeComments,
		removeEmptyAttributes,
		removeRedundantAttributes,
		compressJSONLD
	];

	function process(doc, options) {
		removeEmptyInlineElements(doc);
		const nodesWalker = doc.createTreeWalker(doc.documentElement, NodeFilter_SHOW_ALL, null, false);
		let node = nodesWalker.nextNode();
		while (node) {
			const deletedNode = modules.find(module => module(node, options));
			const previousNode = node;
			node = nodesWalker.nextNode();
			if (deletedNode) {
				previousNode.remove();
			}
		}
	}

	function collapseBooleanAttributes(node) {
		if (node.nodeType == Node_ELEMENT_NODE) {
			Array.from(node.attributes).forEach(attribute => {
				if (booleanAttributes.includes(attribute.name)) {
					node.setAttribute(attribute.name, "");
				}
			});
		}
	}

	function mergeTextNodes(node) {
		if (node.nodeType == Node_TEXT_NODE) {
			if (node.previousSibling && node.previousSibling.nodeType == Node_TEXT_NODE) {
				node.textContent = node.previousSibling.textContent + node.textContent;
				node.previousSibling.remove();
			}
		}
	}

	function collapseWhitespace(node, options) {
		if (node.nodeType == Node_TEXT_NODE) {
			let element = node.parentElement;
			const spacePreserved = element.getAttribute(options.PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME) == "";
			if (!spacePreserved) {
				const textContent = node.textContent;
				let noWhitespace = noWhitespaceCollapse(element);
				while (noWhitespace) {
					element = element.parentElement;
					noWhitespace = element && noWhitespaceCollapse(element);
				}
				if ((!element || noWhitespace) && textContent.length > 1) {
					node.textContent = textContent.replace(REGEXP_WHITESPACE, getWhiteSpace(node)).replace(REGEXP_NEWLINE, "\n");
				}
			}
		}
	}

	function getWhiteSpace(node) {
		return node.parentElement && getTagName(node.parentElement) == "HEAD" ? "\n" : " ";
	}

	function noWhitespaceCollapse(element) {
		return element && !noWhitespaceCollapseElements.includes(getTagName(element));
	}

	function removeComments(node) {
		if (node.nodeType == Node_COMMENT_NODE && getTagName(node.parentElement) != "HTML") {
			return !node.textContent.toLowerCase().trim().startsWith("[if");
		}
	}

	function removeEmptyAttributes(node) {
		if (node.nodeType == Node_ELEMENT_NODE) {
			Array.from(node.attributes).forEach(attribute => {
				if (safeToRemoveAttrs.includes(attribute.name.toLowerCase())) {
					const attributeValue = node.getAttribute(attribute.name);
					if (attributeValue == "" || (attributeValue || "").match(REGEXP_ENDS_WHITESPACE)) {
						node.removeAttribute(attribute.name);
					}
				}
			});
		}
	}

	function removeRedundantAttributes(node) {
		if (node.nodeType == Node_ELEMENT_NODE) {
			const tagRedundantAttributes = redundantAttributes[getTagName(node)];
			if (tagRedundantAttributes) {
				Object.keys(tagRedundantAttributes).forEach(redundantAttributeName => {
					const tagRedundantAttributeValue = tagRedundantAttributes[redundantAttributeName];
					if (typeof tagRedundantAttributeValue == "function" ? tagRedundantAttributeValue(node) : node.getAttribute(redundantAttributeName) == tagRedundantAttributeValue) {
						node.removeAttribute(redundantAttributeName);
					}
				});
			}
		}
	}

	function compressJSONLD(node) {
		if (node.nodeType == Node_ELEMENT_NODE && getTagName(node) == "SCRIPT" && node.type == "application/ld+json" && node.textContent.trim()) {
			try {
				node.textContent = JSON.stringify(JSON.parse(node.textContent));
			} catch (error) {
				// ignored
			}
		}
	}

	function removeEmptyInlineElements(doc) {
		doc.querySelectorAll("style, script:not([src])").forEach(element => {
			if (!element.textContent.trim()) {
				element.remove();
			}
		});
	}

	function getTagName(element) {
		return  element.tagName && element.tagName.toUpperCase();
	}

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	const DEBUG = false;
	const ONE_MB = 1024 * 1024;
	const PREFIX_CONTENT_TYPE_TEXT = "text/";
	const DEFAULT_REPLACED_CHARACTERS = ["~", "+", "\\\\", "?", "%", "*", ":", "|", "\"", "<", ">", "\x00-\x1f", "\x7F"];
	const DEFAULT_REPLACEMENT_CHARACTER = "_";
	const CONTENT_TYPE_EXTENSIONS = {
		"image/svg+xml": ".svg",
		"image/png": ".png",
		"image/gif": ".gif",
		"image/tiff": ".tiff",
		"image/bmp": ".bmp",
		"image/x-icon": ".ico",
		"image/heif": ".heif",
		"image/heic": ".heic",
		"image/avif": ".avif",
		"image/apng": ".apng",
		"image/jpeg": ".jpg",
		"image/webp": ".webp",
		"audio/mpeg": ".mp3",
		"audio/ogg": ".ogg",
		"audio/wav": ".wav",
		"audio/webm": ".webm",
		"video/3gpp": ".3gp",
		"video/3gpp2": ".3g2",
		"video/mpeg": ".mpeg",
		"video/quicktime": ".mov",
		"video/x-msvideo": ".avi",
		"video/webm": ".webm",
		"video/ogg": ".ogv",
		"video/mp4": ".mp4",
		"video/mp2t": ".ts",
		"font/otf": ".otf",
		"font/ttf": ".ttf",
		"font/woff": ".woff",
		"font/woff2": ".woff2",
		"application/vnd.ms-fontobject": ".eot",
		"font/collection": ".ttc"
	};
	const CONTENT_TYPE_OCTET_STREAM = "application/octet-stream";

	const URL$1 = globalThis.URL;
	const DOMParser$1 = globalThis.DOMParser;
	const Blob$1 = globalThis.Blob;
	const FileReader$1 = globalThis.FileReader;
	const fetch$1 = (url, options) => globalThis.fetch(url, options);
	const TextDecoder = globalThis.TextDecoder;
	const URLSearchParams = globalThis.URLSearchParams;

	function getInstance(utilOptions) {
		utilOptions = utilOptions || {};
		utilOptions.fetch = utilOptions.fetch || fetch$1;
		utilOptions.frameFetch = utilOptions.frameFetch || utilOptions.fetch || fetch$1;
		return {
			getDoctypeString,
			getFilenameExtension(resourceURL, replacedCharacters, replacementCharacter) {
				let matchExtension;
				try { 
					matchExtension = new URL$1(resourceURL).pathname.match(/(\.[^\\/.]*)$/);
				} catch (error) {
					// ignored
				}
				return ((matchExtension && matchExtension[1] && this.getValidFilename(matchExtension[1], replacedCharacters, replacementCharacter)) || "").toLowerCase();
			},
			getContentTypeExtension(contentType) {
				return CONTENT_TYPE_EXTENSIONS[contentType] || "";
			},
			getContent,
			parseURL(resourceURL, baseURI) {
				if (baseURI === undefined) {
					return new URL$1(resourceURL);
				} else {
					return new URL$1(resourceURL, baseURI);
				}
			},
			resolveURL(resourceURL, baseURI) {
				return this.parseURL(resourceURL, baseURI).href;
			},
			getSearchParams(searchParams) {
				return Array.from(new URLSearchParams(searchParams));
			},
			getValidFilename(filename, replacedCharacters = DEFAULT_REPLACED_CHARACTERS, replacementCharacter = DEFAULT_REPLACEMENT_CHARACTER) {
				replacedCharacters.forEach(replacedCharacter => filename = filename.replace(new RegExp("[" + replacedCharacter + "]+", "g"), replacementCharacter));
				filename = filename
					.replace(/\.\.\//g, "")
					.replace(/^\/+/, "")
					.replace(/\/+/g, "/")
					.replace(/\/$/, "")
					.replace(/\.$/, "")
					.replace(/\.\//g, "." + replacementCharacter)
					.replace(/\/\./g, "/" + replacementCharacter);
				return filename;
			},
			parseDocContent(content, baseURI) {
				const doc = (new DOMParser$1()).parseFromString(content, "text/html");
				if (!doc.head) {
					doc.documentElement.insertBefore(doc.createElement("HEAD"), doc.body);
				}
				let baseElement = doc.querySelector("base");
				if (!baseElement || !baseElement.getAttribute("href")) {
					if (baseElement) {
						baseElement.remove();
					}
					baseElement = doc.createElement("base");
					baseElement.setAttribute("href", baseURI);
					doc.head.insertBefore(baseElement, doc.head.firstChild);
				}
				return doc;
			},
			parseXMLContent(content) {
				return (new DOMParser$1()).parseFromString(content, "text/xml");
			},
			parseSVGContent(content) {
				const doc = (new DOMParser$1()).parseFromString(content, "image/svg+xml");
				if (doc.querySelector("parsererror")) {
					return (new DOMParser$1()).parseFromString(content, "text/html");
				} else {
					return doc;
				}
			},
			async digest(algo, text) {
				return digest(algo, text);
			},
			getContentSize(content) {
				return getContentSize(content);
			},
			formatFilename(content, doc, options) {
				return formatFilename(content, doc, options);
			},
			getMimeType(options) {
				return !options.compressContent || options.selfExtractingArchive ? "text/html" : "application/zip";
			},
			async evalTemplate(template, options, content, doc, dontReplaceSlash) {
				return evalTemplate(template, options, content, doc, dontReplaceSlash);
			},
			minifyHTML(doc, options) {
				return process(doc, options);
			},
			minifyCSSRules(stylesheets, styles, mediaAllInfo) {
				return process$2(stylesheets, styles, mediaAllInfo);
			},
			removeUnusedFonts(doc, stylesheets, styles, options) {
				return process$4(doc, stylesheets, styles, options);
			},
			getMediaAllInfo(doc, stylesheets, styles) {
				return getMediaAllInfo(doc, stylesheets, styles);
			},
			compressCSS(content, options) {
				return processString(content, options);
			},
			minifyMedias(stylesheets) {
				return process$3(stylesheets);
			},
			removeAlternativeImages(doc) {
				return process$1(doc);
			},
			parseSrcset(srcset) {
				return process$5(srcset);
			},
			preProcessDoc(doc, win, options) {
				return preProcessDoc(doc, win, options);
			},
			postProcessDoc(doc, markedElements, invalidElements) {
				postProcessDoc(doc, markedElements, invalidElements);
			},
			serialize(doc, compressHTML) {
				return process$7(doc, compressHTML);
			},
			removeQuotes(string) {
				return removeQuotes$1(string);
			},
			appendInfobar(doc, options) {
				return appendInfobar(doc, options);
			},
			findLast(array, callback) {
				if (array.findLast && typeof array.findLast == "function") {
					return array.findLast(callback);
				} else {
					let index = array.length;
					while (index--) {
						if (callback(array[index], index, array)) {
							return array[index];
						}
					}
				}
			},
			ON_BEFORE_CAPTURE_EVENT_NAME: ON_BEFORE_CAPTURE_EVENT_NAME,
			ON_AFTER_CAPTURE_EVENT_NAME: ON_AFTER_CAPTURE_EVENT_NAME,
			WIN_ID_ATTRIBUTE_NAME: WIN_ID_ATTRIBUTE_NAME,
			REMOVED_CONTENT_ATTRIBUTE_NAME: REMOVED_CONTENT_ATTRIBUTE_NAME,
			HIDDEN_CONTENT_ATTRIBUTE_NAME: HIDDEN_CONTENT_ATTRIBUTE_NAME,
			HIDDEN_FRAME_ATTRIBUTE_NAME: HIDDEN_FRAME_ATTRIBUTE_NAME,
			IMAGE_ATTRIBUTE_NAME: IMAGE_ATTRIBUTE_NAME,
			POSTER_ATTRIBUTE_NAME: POSTER_ATTRIBUTE_NAME,
			VIDEO_ATTRIBUTE_NAME: VIDEO_ATTRIBUTE_NAME,
			CANVAS_ATTRIBUTE_NAME: CANVAS_ATTRIBUTE_NAME,
			STYLE_ATTRIBUTE_NAME: STYLE_ATTRIBUTE_NAME,
			INPUT_VALUE_ATTRIBUTE_NAME: INPUT_VALUE_ATTRIBUTE_NAME,
			SHADOW_ROOT_ATTRIBUTE_NAME: SHADOW_ROOT_ATTRIBUTE_NAME,
			PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME: PRESERVED_SPACE_ELEMENT_ATTRIBUTE_NAME,
			STYLESHEET_ATTRIBUTE_NAME: STYLESHEET_ATTRIBUTE_NAME,
			SELECTED_CONTENT_ATTRIBUTE_NAME: SELECTED_CONTENT_ATTRIBUTE_NAME,
			INVALID_ELEMENT_ATTRIBUTE_NAME: INVALID_ELEMENT_ATTRIBUTE_NAME,
			COMMENT_HEADER: COMMENT_HEADER,
			COMMENT_HEADER_LEGACY: COMMENT_HEADER_LEGACY,
			SINGLE_FILE_UI_ELEMENT_CLASS: SINGLE_FILE_UI_ELEMENT_CLASS,
			EMPTY_RESOURCE: EMPTY_RESOURCE$1,
			INFOBAR_TAGNAME: INFOBAR_TAGNAME,
			WAIT_FOR_USERSCRIPT_PROPERTY_NAME: WAIT_FOR_USERSCRIPT_PROPERTY_NAME,
			NO_SCRIPT_PROPERTY_NAME: NO_SCRIPT_PROPERTY_NAME
		};

		async function getContent(resourceURL, options) {
			let response, startTime, networkTimeoutId, networkTimeoutPromise, resolveNetworkTimeoutPromise;
			const fetchResource = utilOptions.fetch;
			const fetchFrameResource = utilOptions.frameFetch;
			if (options.blockMixedContent && /^https:/i.test(options.baseURI) && !/^https:/i.test(resourceURL)) {
				return getFetchResponse(resourceURL, options);
			}
			if (options.networkTimeout) {
				networkTimeoutPromise = new Promise((resolve, reject) => {
					resolveNetworkTimeoutPromise = resolve;
					networkTimeoutId = globalThis.setTimeout(() => reject(new Error("network timeout")), options.networkTimeout);
				});
			} else {
				networkTimeoutPromise = new Promise(resolve => {
					resolveNetworkTimeoutPromise = resolve;
				});
			}
			try {
				const accept = options.acceptHeaders ? options.acceptHeaders[options.expectedType] : "*/*";
				if (options.frameId) {
					try {
						response = await Promise.race([
							fetchFrameResource(resourceURL, { frameId: options.frameId, referrer: options.resourceReferrer, headers: { accept } }),
							networkTimeoutPromise
						]);
					} catch (error) {
						response = await Promise.race([
							fetchResource(resourceURL, { headers: { accept } }),
							networkTimeoutPromise
						]);
					}
				} else {
					response = await Promise.race([
						fetchResource(resourceURL, { referrer: options.resourceReferrer, headers: { accept } }),
						networkTimeoutPromise
					]);
				}
			} catch (error) {
				return getFetchResponse(resourceURL, options);
			} finally {
				resolveNetworkTimeoutPromise();
				if (options.networkTimeout) {
					globalThis.clearTimeout(networkTimeoutId);
				}
			}
			let buffer;
			try {
				buffer = await response.arrayBuffer();
			} catch (error) {
				return options.inline ? { data: options.asBinary ? EMPTY_RESOURCE$1 : "", resourceURL } : { resourceURL };
			}
			resourceURL = response.url || resourceURL;
			let contentType = "", charset;
			try {
				const mimeType = new MIMEType(response.headers.get("content-type"));
				contentType = mimeType.type + "/" + mimeType.subtype;
				charset = mimeType.parameters.get("charset");
			} catch (error) {
				// ignored
			}
			if (!contentType || (contentType == CONTENT_TYPE_OCTET_STREAM && options.asBinary)) {
				contentType = guessMIMEType(options.expectedType, buffer);
				if (!contentType) {
					contentType = options.contentType ? options.contentType : options.asBinary ? CONTENT_TYPE_OCTET_STREAM : "";
				}
			}
			if (!charset && options.charset) {
				charset = options.charset;
			}
			if (options.asBinary) {
				if (response.status >= 400) {
					return getFetchResponse(resourceURL, options);
				}
				try {
					if (DEBUG) ;
					if (options.maxResourceSizeEnabled && buffer.byteLength > options.maxResourceSize * ONE_MB) {
						return getFetchResponse(resourceURL, options);
					} else {
						return getFetchResponse(resourceURL, options, buffer, null, contentType);
					}
				} catch (error) {
					return getFetchResponse(resourceURL, options);
				}
			} else {
				if (response.status >= 400 || (options.validateTextContentType && contentType && !contentType.startsWith(PREFIX_CONTENT_TYPE_TEXT))) {
					return getFetchResponse(resourceURL, options);
				}
				if (!charset) {
					charset = "utf-8";
				}
				if (options.maxResourceSizeEnabled && buffer.byteLength > options.maxResourceSize * ONE_MB) {
					return getFetchResponse(resourceURL, options, null, charset);
				} else {
					try {
						return getFetchResponse(resourceURL, options, buffer, charset, contentType);
					} catch (error) {
						return getFetchResponse(resourceURL, options, null, charset);
					}
				}
			}
		}
	}

	async function getFetchResponse(resourceURL, options, data, charset, contentType) {
		if (data) {
			if (options.asBinary) {
				if (options.inline) {
					const reader = new FileReader$1();
					reader.readAsDataURL(new Blob$1([data], { type: contentType + (options.charset ? ";charset=" + options.charset : "") }));
					data = await new Promise((resolve, reject) => {
						reader.addEventListener("load", () => resolve(reader.result), false);
						reader.addEventListener("error", reject, false);
					});
				} else {
					data = new Uint8Array(data);
				}
			} else {
				const firstBytes = new Uint8Array(data.slice(0, 4));
				if (firstBytes[0] == 132 && firstBytes[1] == 49 && firstBytes[2] == 149 && firstBytes[3] == 51) {
					charset = "gb18030";
				} else if (firstBytes[0] == 255 && firstBytes[1] == 254) {
					charset = "utf-16le";
				} else if (firstBytes[0] == 254 && firstBytes[1] == 255) {
					charset = "utf-16be";
				}
				try {
					data = new TextDecoder(charset).decode(data);
				} catch (error) {
					charset = "utf-8";
					data = new TextDecoder(charset).decode(data);
				}
				data = data.replace(/\ufeff/gi, "");
			}
		} else if (options.inline) {
			data = options.asBinary ? EMPTY_RESOURCE$1 : "";
		}
		return { data, resourceURL, charset, contentType };
	}

	function guessMIMEType(expectedType, buffer) {
		if (expectedType == "image") {
			if (compareBytes([255, 255, 255, 255], [0, 0, 1, 0])) {
				return "image/x-icon";
			}
			if (compareBytes([255, 255, 255, 255], [0, 0, 2, 0])) {
				return "image/x-icon";
			}
			if (compareBytes([255, 255], [78, 77])) {
				return "image/bmp";
			}
			if (compareBytes([255, 255, 255, 255, 255, 255], [71, 73, 70, 56, 57, 97])) {
				return "image/gif";
			}
			if (compareBytes([255, 255, 255, 255, 255, 255], [71, 73, 70, 56, 59, 97])) {
				return "image/gif";
			}
			if (compareBytes([255, 255, 255, 255, 0, 0, 0, 0, 255, 255, 255, 255, 255, 255], [82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80, 86, 80])) {
				return "image/webp";
			}
			if (compareBytes([255, 255, 255, 255, 255, 255, 255, 255], [137, 80, 78, 71, 13, 10, 26, 10])) {
				return "image/png";
			}
			if (compareBytes([255, 255, 255], [255, 216, 255])) {
				return "image/jpeg";
			}
		}
		if (expectedType == "font") {
			if (compareBytes([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255],
				[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 76, 80])) {
				return "application/vnd.ms-fontobject";
			}
			if (compareBytes([255, 255, 255, 255], [0, 1, 0, 0])) {
				return "font/ttf";
			}
			if (compareBytes([255, 255, 255, 255], [79, 84, 84, 79])) {
				return "font/otf";
			}
			if (compareBytes([255, 255, 255, 255], [116, 116, 99, 102])) {
				return "font/collection";
			}
			if (compareBytes([255, 255, 255, 255], [119, 79, 70, 70])) {
				return "font/woff";
			}
			if (compareBytes([255, 255, 255, 255], [119, 79, 70, 50])) {
				return "font/woff2";
			}
		}
		if (expectedType == "video") {
			if (compareBytes([0, 0, 0, 0, 255, 255, 255, 255, 255, 255, 255, 255], [0, 0, 0, 0, 102, 116, 121, 112, 105, 115, 111, 109])) {
				return "video/mp4";
			}
			if (compareBytes([255, 255, 255, 255, 0, 0, 0, 0, 255, 255, 255, 255], [82, 73, 70, 70, 0, 0, 0, 0, 87, 65, 86, 69])) {
				return "video/x-msvideo";
			}
			if (compareBytes([255, 255, 255, 255], [0, 0, 1, 179]) || compareBytes([255, 255, 255, 255], [0, 0, 1, 186])) {
				return "video/mpeg";
			}
			if (compareBytes([255, 255, 255, 255], [79, 103, 103, 83])) {
				return "video/ogg";
			}
			if (compareBytes([255], [71])) {
				return "video/mp2t";
			}
			if (compareBytes([255, 255, 255, 255], [26, 69, 223, 163])) {
				return "video/webm";
			}
			if (compareBytes([0, 0, 0, 0, 255, 255, 255, 255, 255, 255], [0, 0, 0, 0, 102, 116, 121, 112, 51, 103])) {
				return "video/3gpp";
			}
		}
		if (expectedType == "audio") {
			if (compareBytes([255, 255], [255, 249]) || compareBytes([255, 255], [255, 254])) {
				return "audio/aac";
			}
			if (compareBytes([255, 255, 255, 255], [77, 84, 104, 100])) {
				return "audio/midi";
			}
			if (compareBytes([255, 255, 255, 255], [0, 0, 1, 179]) || compareBytes([255, 255, 255, 255], [0, 0, 1, 186])) {
				return "audio/mpeg";
			}
			if (compareBytes([255, 255], [255, 251]) || compareBytes([255, 255], [255, 243]) || compareBytes([255, 255], [255, 242]) || compareBytes([255, 255, 255], [73, 68, 51])) {
				return "audio/mpeg";
			}
			if (compareBytes([255, 255, 255, 255], [79, 103, 103, 83])) {
				return "audio/ogg";
			}
			if (compareBytes([255, 255, 255, 255, 0, 0, 0, 0, 255, 255, 255, 255], [82, 73, 70, 70, 0, 0, 0, 0, 87, 65, 86, 69])) {
				return "audio/wav";
			}
			if (compareBytes([255, 255, 255, 255], [26, 69, 223, 163])) {
				return "audio/webm";
			}
			if (compareBytes([0, 0, 0, 0, 255, 255, 255, 255, 255, 255], [0, 0, 0, 0, 102, 116, 121, 112, 51, 103])) {
				return "audio/3gpp";
			}
		}

		function compareBytes(mask, pattern) {
			let patternMatch = true, index = 0;
			if (buffer.byteLength >= pattern.length) {
				const value = new Uint8Array(buffer, 0, mask.length);
				for (index = 0; index < mask.length && patternMatch; index++) {
					patternMatch = patternMatch && ((value[index] & mask[index]) == pattern[index]);
				}
				return patternMatch;
			}
		}
	}

	function getDoctypeString(doc) {
		const docType = doc.doctype;
		let docTypeString = "";
		if (docType) {
			docTypeString = "<!DOCTYPE " + docType.nodeName;
			if (docType.publicId) {
				docTypeString += " PUBLIC \"" + docType.publicId + "\"";
				if (docType.systemId)
					docTypeString += " \"" + docType.systemId + "\"";
			} else if (docType.systemId)
				docTypeString += " SYSTEM \"" + docType.systemId + "\"";
			if (docType.internalSubset)
				docTypeString += " [" + docType.internalSubset + "]";
			docTypeString += "> ";
		}
		return docTypeString;
	}

	function log(...args) {
		console.log("S-File <browser>", ...args); // eslint-disable-line no-console
	}

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	async function extract(content, { password, prompt = () => { }, shadowRootScriptURL, zipOptions = { useWebWorkers: false }, noBlobURL } = {}) {
		const KNOWN_MIMETYPES = {
			"gif": "image/gif",
			"jpg": "image/jpeg",
			"png": "image/png",
			"tif": "image/tiff",
			"tiff": "image/tiff",
			"bmp": "image/bmp",
			"ico": "image/vnd.microsoft.icon",
			"webp": "image/webp",
			"svg": "image/svg+xml",
			"avi": "video/x-msvideo",
			"ogv": "video/ogg",
			"mp4": "video/mp4",
			"mpeg": "video/mpeg",
			"ts": "video/mp2t",
			"webm": "video/webm",
			"3gp": "video/3gpp",
			"3g2": "video/3gpp",
			"mp3": "audio/mpeg",
			"oga": "audio/ogg",
			"mid": "audio/midi",
			"midi": "audio/midi",
			"opus": "audio/opus",
			"wav": "audio/wav",
			"weba": "audio/webm",
			"heif": "image/heif",
			"heic": "image/heic",
			"avif": "image/avif",
			"apng": "image/apng",
			"mov": "video/quicktime",
			"otf": "font/otf",
			"ttf": "font/ttf",
			"woff": "font/woff",
			"woff2": "font/woff2",
			"eot": "application/vnd.ms-fontobject",
			"pdf": "application/pdf"
		};
		const REGEXP_MATCH_STYLESHEET = /stylesheet_[0-9]+\.css/;
		const REGEXP_MATCH_SCRIPT = /scripts\/[0-9]+\.js/;
		const REGEXP_MATCH_ROOT_INDEX = /^([0-9_]+\/)?index\.html$/;
		const REGEXP_MATCH_INDEX = /index\.html$/;
		const REGEXP_MATCH_FRAMES = /frames\//;
		const REGEXP_MATCH_MANIFEST = /manifest\.json$/;
		const CHARSET_UTF8 = ";charset=utf-8";
		const REGEXP_ESCAPE = /([{}()^$&.*?/+|[\\\\]|\]|-)/g;

		if (Array.isArray(content)) {
			content = new Blob([new Uint8Array(content)]);
		}
		zip.configure(zipOptions);
		const blobReader = new zip.BlobReader(content);
		const zipReader = new zip.ZipReader(blobReader);
		const entries = await zipReader.getEntries();
		const options = { password };
		let docContent, origDocContent, url, resources = [], indexPages = [], textResources = [];
		await Promise.all(entries.map(async entry => {
			const { filename } = entry;
			let dataWriter, content, textContent, mimeType;
			const resourceInfo = {};
			if (!options.password && entry.encrypted) {
				options.password = prompt("Please enter the password to view the page");
			}
			if (filename.match(REGEXP_MATCH_INDEX) || filename.match(REGEXP_MATCH_STYLESHEET) || filename.match(REGEXP_MATCH_SCRIPT)) {
				if (filename.match(REGEXP_MATCH_INDEX)) {
					indexPages.push(resourceInfo);
				} else {
					textResources.push(resourceInfo);
				}
				dataWriter = new zip.TextWriter();
				textContent = await entry.getData(dataWriter, options);
				if (filename.match(REGEXP_MATCH_INDEX)) {
					mimeType = "text/html" + CHARSET_UTF8;
				} else {
					if (filename.match(REGEXP_MATCH_STYLESHEET)) {
						mimeType = "text/css" + CHARSET_UTF8;
					} else if (filename.match(REGEXP_MATCH_SCRIPT)) {
						mimeType = "text/javascript" + CHARSET_UTF8;
					}
				}
			} else {
				resources.push(resourceInfo);
				const extension = filename.match(/\.([^.]+)/);
				if (extension && extension[1] && KNOWN_MIMETYPES[extension[1]]) {
					mimeType = KNOWN_MIMETYPES[extension[1]];
				} else {
					mimeType = "application/octet-stream";
				}
				if (filename.match(REGEXP_MATCH_FRAMES) || noBlobURL) {
					content = await entry.getData(new zip.Data64URIWriter(mimeType), options);
				} else {
					const blob = await entry.getData(new zip.BlobWriter(mimeType), options);
					content = URL.createObjectURL(blob);
				}
			}
			const name = entry.filename.match(/^([0-9_]+\/)?(.*)$/)[2];
			let prefixPath = "";
			const prefixPathMatch = filename.match(/(.*\/)[^/]+$/);
			if (prefixPathMatch && prefixPathMatch[1]) {
				prefixPath = prefixPathMatch[1];
			}
			Object.assign(resourceInfo, {
				prefixPath,
				filename: entry.filename,
				name,
				url: entry.comment,
				content,
				mimeType,
				textContent,
				parentResources: []
			});
		}));
		await zipReader.close();
		indexPages.sort(sortByFilenameLengthDec);
		textResources.sort(sortByFilenameLengthInc);
		resources = resources.sort(sortByFilenameLengthDec).concat(...textResources).concat(...indexPages);
		for (const resource of resources) {
			const { filename, prefixPath } = resource;
			let { textContent } = resource;
			if (textContent !== undefined) {
				if (filename.match(REGEXP_MATCH_ROOT_INDEX)) {
					origDocContent = textContent;
				}
				if (!filename.match(REGEXP_MATCH_SCRIPT)) {
					resources.forEach(innerResource => {
						const { filename, parentResources, content } = innerResource;
						if (filename.startsWith(prefixPath) && filename != resource.filename) {
							const relativeFilename = filename.substring(prefixPath.length);
							if (!relativeFilename.match(REGEXP_MATCH_MANIFEST)) {
								if (textContent.includes(relativeFilename)) {
									parentResources.push(resource.filename);
									if (innerResource.textContent === undefined) {
										textContent = replaceAll(textContent, relativeFilename, content);
									}
								}
							}
						}
					});
					resource.textContent = textContent;
				}
			}
		}
		for (const resource of resources) {
			let { textContent, prefixPath, filename } = resource;
			if (textContent !== undefined) {
				if (!filename.match(REGEXP_MATCH_SCRIPT)) {
					const resourceFilename = filename;
					for (const innerResource of resources) {
						const { filename } = innerResource;
						if (filename.startsWith(prefixPath) && filename != resourceFilename) {
							const relativeFilename = filename.substring(prefixPath.length);
							if (!relativeFilename.match(REGEXP_MATCH_MANIFEST)) {
								const position = textContent.indexOf(relativeFilename);
								if (position != -1) {
									innerResource.content = await getContent(innerResource);
									textContent = replaceAll(textContent, relativeFilename, innerResource.content);
								}
							}
						}
					}
					resource.textContent = textContent;
					resource.content = await getContent(resource);
				}
				if (filename.match(REGEXP_MATCH_INDEX)) {
					if (shadowRootScriptURL) {
						resource.textContent = textContent.replace(/<script data-template-shadow-root.*<\/script>/g, "<script data-template-shadow-root src=" + shadowRootScriptURL + "></" + "script>");
					}
				}
				if (filename.match(REGEXP_MATCH_ROOT_INDEX)) {
					docContent = textContent;
					url = resource.url;
				}
			}
		}
		return { docContent, origDocContent, resources, url };

		async function getContent(resource) {
			return resource.filename.match(REGEXP_MATCH_FRAMES) || noBlobURL ? await getDataURI(resource.textContent, resource.mimeType) : URL.createObjectURL(new Blob([resource.textContent], { type: resource.mimeType }));
		}

		async function getDataURI(textContent, mimeType) {
			const reader = new FileReader();
			reader.readAsDataURL(new Blob([textContent], { type: mimeType }));
			return new Promise((resolve, reject) => {
				reader.onload = () => resolve(reader.result.replace(CHARSET_UTF8, ""));
				reader.onerror = reject;
			});
		}

		function replaceAll(string, search, replacement) {
			if (typeof string.replaceAll == "function") {
				return string.replaceAll(search, replacement);
			} else {
				const searchRegExp = new RegExp(search.replace(REGEXP_ESCAPE, "\\$1"), "g");
				return string.replace(searchRegExp, replacement);
			}
		}

		function sortByFilenameLengthDec(resourceLeft, resourceRight) {
			const lengthDifference = resourceRight.filename.length - resourceLeft.filename.length;
			if (lengthDifference) {
				return lengthDifference;
			} else {
				return resourceRight.filename.localeCompare(resourceLeft.filename);
			}
		}

		function sortByFilenameLengthInc(resourceLeft, resourceRight) {
			const lengthDifference = resourceLeft.filename.length - resourceRight.filename.length;
			if (lengthDifference) {
				return lengthDifference;
			} else {
				return resourceLeft.filename.localeCompare(resourceRight.filename);
			}
		}
	}

	/*
	 * Copyright 2010-2022 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	async function display(document, docContent, { disableFramePointerEvents } = {}) {
		docContent = docContent.replace(/<noscript/gi, "<template disabled-noscript");
		docContent = docContent.replaceAll(/<\/noscript/gi, "</template");
		const doc = (new DOMParser()).parseFromString(docContent, "text/html");
		if (disableFramePointerEvents) {
			doc.querySelectorAll("iframe").forEach(element => {
				const pointerEvents = "pointer-events";
				element.style.setProperty("-sf-" + pointerEvents, element.style.getPropertyValue(pointerEvents), element.style.getPropertyPriority(pointerEvents));
				element.style.setProperty(pointerEvents, "none", "important");
			});
		}
		document.open();
		document.write(getDoctypeString(doc));
		document.write(doc.documentElement.outerHTML);
		document.close();
		document.querySelectorAll("template[disabled-noscript]").forEach(element => {
			const noscriptElement = document.createElement("noscript");
			element.removeAttribute("disabled-noscript");
			Array.from(element.attributes).forEach(attribute => noscriptElement.setAttribute(attribute.name, attribute.value));
			noscriptElement.textContent = element.innerHTML;
			element.parentElement.replaceChild(noscriptElement, element);
		});
		document.documentElement.setAttribute("data-sfz", "");
		document.querySelectorAll("link[rel*=icon]").forEach(element => element.parentElement.replaceChild(element, element));

		function getDoctypeString(doc) {
			const docType = doc.doctype;
			let docTypeString = "";
			if (docType) {
				docTypeString = "<!DOCTYPE " + docType.nodeName;
				if (docType.publicId) {
					docTypeString += " PUBLIC \"" + docType.publicId + "\"";
					if (docType.systemId)
						docTypeString += " \"" + docType.systemId + "\"";
				} else if (docType.systemId)
					docTypeString += " SYSTEM \"" + docType.systemId + "\"";
				if (docType.internalSubset)
					docTypeString += " [" + docType.internalSubset + "]";
				docTypeString += "> ";
			}
			return docTypeString;
		}
	}

	/*
	 * Copyright 2010-2020 Gildas Lormeau
	 * contact : gildas.lormeau <at> gmail.com
	 * 
	 * This file is part of SingleFile.
	 *
	 *   The code in this file is free software: you can redistribute it and/or 
	 *   modify it under the terms of the GNU Affero General Public License 
	 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
	 *   of the License, or (at your option) any later version.
	 * 
	 *   The code in this file is distributed in the hope that it will be useful, 
	 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
	 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
	 *   General Public License for more details.
	 *
	 *   As additional permission under GNU AGPL version 3 section 7, you may 
	 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
	 *   AGPL normally required by section 4, provided you include this license 
	 *   notice and a URL through which recipients can access the Corresponding 
	 *   Source.
	 */

	const util = getInstance();
	const helper = {
		serialize(doc, compressHTML) {
			return process$7(doc, compressHTML);
		},
		getDoctypeString(doc) {
			return util.getDoctypeString(doc);
		},
		appendInfobar(doc, options, useShadowRoot) {
			return appendInfobar$1(doc, options, useShadowRoot);
		},
		extractInfobarData(doc) {
			return extractInfobarData(doc);
		},
		displayIcon(doc, useShadowRoot) {
			return displayIcon(doc, useShadowRoot);
		},
		zip: zip$1,
		extract,
		display,
		formatFilename,
		INFOBAR_TAGNAME: INFOBAR_TAGNAME$1
	};

	exports.helper = helper;

	Object.defineProperty(exports, '__esModule', { value: true });

}));
