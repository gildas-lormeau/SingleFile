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

	//omittedEndTag.followings && omittedEndTag.followings.includes(nextSibling.tagName.toLowerCase())

	const SELF_CLOSED_TAG_NAMES = ["area", "base", "br", "col", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"];
	const OMITTED_END_TAGS = [
		{ tagName: "html", acceptNode: next => !next || next.nodeType != Node.COMMENT_NODE },
		{ tagName: "head", acceptNode: next => !next || next.nodeType != Node.COMMENT_NODE && (next.nodeType != Node.TEXT_NODE || !spaceFirstCharacter(next.textContent)) },
		{ tagName: "body", acceptNode: next => !next || next.nodeType != Node.COMMENT_NODE },
		{ tagName: "li", acceptNode: next => !next || ["LI"].includes(next.tagName) },
		{ tagName: "dt", acceptNode: next => !next || ["DT", "DD"].includes(next.tagName) },
		{ tagName: "dd", acceptNode: next => !next || ["DT", "DD"].includes(next.tagName) },
		{ tagName: "rt", acceptNode: next => !next || ["RT", "RP"].includes(next.tagName) },
		{ tagName: "rp", acceptNode: next => !next || ["RT", "RP"].includes(next.tagName) },
		{ tagName: "optgroup", acceptNode: next => !next || ["OPTGROUP"].includes(next.tagName) },
		{ tagName: "option", acceptNode: next => !next || ["OPTION", "OPTGROUP"].includes(next.tagName) },
		{ tagName: "colgroup", acceptNode: next => !next || next.nodeType != Node.COMMENT_NODE && (next.nodeType != Node.TEXT_NODE || !spaceFirstCharacter(next.textContent)) },
		{ tagName: "caption", acceptNode: next => !next || next.nodeType != Node.COMMENT_NODE && (next.nodeType != Node.TEXT_NODE || !spaceFirstCharacter(next.textContent)) },
		{ tagName: "thead", acceptNode: next => !next || ["TBODY", "TFOOT"].includes(next.tagName) },
		{ tagName: "tbody", acceptNode: next => !next || ["TBODY", "TFOOT"].includes(next.tagName) },
		{ tagName: "tfoot", acceptNode: next => !next },
		{ tagName: "tr", acceptNode: next => !next || ["TR"].includes(next.tagName) },
		{ tagName: "td", acceptNode: next => !next || ["TD", "TH"].includes(next.tagName) },
		{ tagName: "th", acceptNode: next => !next || ["TD", "TH"].includes(next.tagName) },
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
		let content = "<" + tagName;
		Array.from(element.attributes).forEach(attribute => {
			const name = attribute.name.replace(/["'>/=]/g, "");
			let value = attribute.value;
			if (name == "class") {
				value = Array.from(element.classList).map(className => className.trim()).join(" ");
			}
			value = value.replace(/&/g, "&amp;").replace(/\u00a0/g, "&nbsp;").replace(/"/g, "&quot;");
			const validUnquotedValue = value.match(/^[^ \t\n\f\r"'`=<>]+$/);
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
				if (!validUnquotedValue) {
					content += "\"";
				}
				content += value;
				if (!validUnquotedValue) {
					content += "\"";
				}
			}
		});
		content += ">";
		Array.from(element.childNodes).forEach(childNode => content += serialize(childNode));
		const omittedEndTag = OMITTED_END_TAGS.find(omittedEndTag => {
			const nextSibling = element.nextSibling;
			return tagName == omittedEndTag.tagName && omittedEndTag.acceptNode(nextSibling);
		});
		if (!omittedEndTag && !SELF_CLOSED_TAG_NAMES.includes(tagName)) {
			content += "</" + tagName + ">";
		}
		return content;
	}

	function spaceFirstCharacter(textContent) {
		return Boolean(textContent.charAt(0).match(/[\u0020\u0009\u000A\u000C\u000D]+/)); // eslint-disable-line no-control-regex
	}

})();