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
		let content = "";
		if (node.nodeType == Node.TEXT_NODE) {
			content += serializeTextNode(node);
		} else if (node.nodeType == Node.COMMENT_NODE) {
			content += serializeCommentNode(node);
		} else if (node.nodeType == Node.ELEMENT_NODE) {
			content += serializeElement(node);
		}
		return content;
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
			let value = attribute.value;
			if (attribute.name == "class") {
				value = element.classList.toString().trim();
			}
			value = value.replace(/&/g, "&amp;").replace(/\u00a0/g, "&nbsp;").replace(/"/g, "&quot;");
			const validUnquotedValue = value.match(/^[^ \t\n\f\r"'`=<>]+$/);
			content += " "; //+ attribute.name + "=";
			if (!attribute.namespace) {
				content += attribute.name;
			} else if (attribute.namespaceURI == "http://www.w3.org/XML/1998/namespace") {
				content += "xml:" + attribute.name;
			} else if (attribute.namespaceURI == "http://www.w3.org/2000/xmlns/") {
				if (attribute.name !== "xmlns") {
					content += "xmlns:";
				}
				content += attribute.name;
			} else if (attribute.namespaceURI == "http://www.w3.org/1999/xlink") {
				content += "xlink:" + attribute.name;
			} else {
				content += attribute.name;
			}
			content += "=";
			if (!validUnquotedValue) {
				content += "\"";
			}
			content += value;
			if (!validUnquotedValue) {
				content += "\"";
			}
		});
		content += ">";
		Array.from(element.childNodes).forEach(childNode => {
			content += serialize(childNode);
		});
		if (!["area", "base", "br", "col", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"].includes(tagName)) {
			content += "</" + tagName + ">";
		}
		return content;
	}

})();