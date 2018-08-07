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

/* global Node */


this.serializer = this.serializer || (() => {

	const SELF_CLOSED_TAG_NAMES = ["area", "base", "br", "col", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"];

	// see https://www.w3.org/TR/html5/syntax.html#optional-tags
	const OMITTED_START_TAGS = [
		{ tagName: "head", accept: element => !element.childNodes.length || element.childNodes[0].nodeType == Node.ELEMENT_NODE },
		{ tagName: "body", accept: element => !element.childNodes.length }
	];
	const OMITTED_END_TAGS = [
		{ tagName: "html", accept: next => !next || next.nodeType != Node.COMMENT_NODE },
		{ tagName: "head", accept: next => !next || next.nodeType != Node.COMMENT_NODE && (next.nodeType != Node.TEXT_NODE || !spaceFirstCharacter(next.textContent)) },
		{ tagName: "body", accept: next => !next || next.nodeType != Node.COMMENT_NODE },
		{ tagName: "li", accept: next => !next || ["LI"].includes(next.tagName) },
		{ tagName: "dt", accept: next => !next || ["DT", "DD"].includes(next.tagName) },
		{ tagName: "p", accept: next => next && ["ADDRESS", "ARTICLE", "ASIDE", "BLOCKQUOTE", "DETAILS", "DIV", "DL", "FIELDSET", "FIGCAPTION", "FIGURE", "FOOTER", "FORM", "H1", "H2", "H3", "H4", "H5", "H6", "HEADER", "HR", "MAIN", "NAV", "OL", "P", "PRE", "SECTION", "TABLE", "UL"].includes(next.tagName) },
		{ tagName: "dd", accept: next => !next || ["DT", "DD"].includes(next.tagName) },
		{ tagName: "rt", accept: next => !next || ["RT", "RP"].includes(next.tagName) },
		{ tagName: "rp", accept: next => !next || ["RT", "RP"].includes(next.tagName) },
		{ tagName: "optgroup", accept: next => !next || ["OPTGROUP"].includes(next.tagName) },
		{ tagName: "option", accept: next => !next || ["OPTION", "OPTGROUP"].includes(next.tagName) },
		{ tagName: "colgroup", accept: next => !next || next.nodeType != Node.COMMENT_NODE && (next.nodeType != Node.TEXT_NODE || !spaceFirstCharacter(next.textContent)) },
		{ tagName: "caption", accept: next => !next || next.nodeType != Node.COMMENT_NODE && (next.nodeType != Node.TEXT_NODE || !spaceFirstCharacter(next.textContent)) },
		{ tagName: "thead", accept: next => !next || ["TBODY", "TFOOT"].includes(next.tagName) },
		{ tagName: "tbody", accept: next => !next || ["TBODY", "TFOOT"].includes(next.tagName) },
		{ tagName: "tfoot", accept: next => !next },
		{ tagName: "tr", accept: next => !next || ["TR"].includes(next.tagName) },
		{ tagName: "td", accept: next => !next || ["TD", "TH"].includes(next.tagName) },
		{ tagName: "th", accept: next => !next || ["TD", "TH"].includes(next.tagName) }
	];

	return {
		process(doc, compressHTML) {
			return getDoctype(doc) + (compressHTML ? serialize(doc.documentElement) : doc.documentElement.outerHTML);
		}
	};

	function getDoctype(doc) {
		const docType = doc.doctype;
		let docTypeString;
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
			return docTypeString + ">\n";
		}
		return "";
	}

	function serialize(node) {
		if (node.nodeType == Node.TEXT_NODE) {
			return serializeTextNode(node);
		} else if (node.nodeType == Node.COMMENT_NODE) {
			return serializeCommentNode(node);
		} else if (node.nodeType == Node.ELEMENT_NODE) {
			return serializeElement(node);
		}
	}

	function serializeTextNode(textNode) {
		return textNode.textContent;
	}

	function serializeCommentNode(commentNode) {
		return "<!--" + commentNode.textContent + "-->";
	}

	function serializeElement(element) {
		const tagName = element.tagName.toLowerCase();
		const omittedStartTag = OMITTED_START_TAGS.find(omittedStartTag => tagName == omittedStartTag.tagName && omittedStartTag.accept(element));
		let content = "";
		if (!omittedStartTag || element.attributes.length) {
			content = "<" + tagName;
			Array.from(element.attributes).forEach(attribute => content += serializeAttribute(attribute, element));
			content += ">";
		}
		Array.from(element.childNodes).forEach(childNode => content += serialize(childNode));
		const omittedEndTag = OMITTED_END_TAGS.find(omittedEndTag => tagName == omittedEndTag.tagName && omittedEndTag.accept(element.nextSibling));
		if (!omittedEndTag && !SELF_CLOSED_TAG_NAMES.includes(tagName)) {
			content += "</" + tagName + ">";
		}
		return content;
	}

	function serializeAttribute(attribute, element) {
		const name = attribute.name;
		let content = "";
		if (!name.match(/["'>/=]/)) {
			let value = attribute.value;
			if (name == "class") {
				value = Array.from(element.classList).map(className => className.trim()).join(" ");
			}
			value = value.replace(/&/g, "&amp;").replace(/\u00a0/g, "&nbsp;").replace(/"/g, "&quot;");
			const invalidUnquotedValue = !value.match(/^[^ \t\n\f\r'"`=<>]+$/);
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
					content += "\"";
				}
				content += value;
				if (invalidUnquotedValue) {
					content += "\"";
				}
			}
		}
		return content;
	}

	function spaceFirstCharacter(textContent) {
		return Boolean(textContent.charAt(0).match(/ \t\n\f\r+/));
	}

})();