/*
 * Copyright 2018 Gildas Lormeau
 * contact : gildas.lormeau <at> gmail.com
 * 
 * The MIT License (MIT)
 * 
 * Copyright (c) 2018
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

// Derived from the work of Kirill Maltsev - https://github.com/posthtml/htmlnano

/* global Node, NodeFilter */

this.htmlnano = this.htmlnano || (() => {

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

	const noWhitespaceCollapseElements = ["script", "style", "pre", "textarea"];

	// Source: https://www.w3.org/TR/html4/sgml/dtd.html#events (Generic Attributes)
	const safeToRemoveAttrs = [
		"id",
		"class",
		"style",
		"title",
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
		"form": {
			"method": "get"
		},
		"input": {
			"type": "text"
		},
		"button": {
			"type": "submit"
		},
		"script": {
			"language": "javascript",
			"type": "text/javascript",
			// Remove attribute if the function returns false
			"charset": node => {
				// The charset attribute only really makes sense on “external” SCRIPT elements:
				// http://perfectionkills.com/optimizing-html/#8_script_charset
				return !node.getAttribute("src");
			}
		},
		"style": {
			"media": "all",
			"type": "text/css"
		},
		"link": {
			"media": "all"
		}
	};

	const modules = [collapseBooleanAttributes, collapseWhitespace, removeComments, removeEmptyAttributes, removeRedundantAttributes];

	return {
		process: doc => {
			const nodesWalker = doc.createTreeWalker(doc.documentElement, NodeFilter.SHOW_ALL, null, false);
			let node = nodesWalker.nextNode();
			while (node) {
				const deletedNode = modules.find(module => module(node));
				const previousNode = node;
				node = nodesWalker.nextNode();
				if (deletedNode) {
					previousNode.remove();
				}
			}
		}
	};

	function collapseBooleanAttributes(node) {
		if (node.nodeType == Node.ELEMENT_NODE) {
			node.getAttributeNames().forEach(attributeName => {
				if (booleanAttributes.includes(attributeName)) {
					node.setAttribute(attributeName, "");
				}
			});
		}
	}

	/** Collapses redundant whitespaces */
	function collapseWhitespace(node) {
		if (node.nodeType == Node.TEXT_NODE) {
			if (node.previousSibling && node.previousSibling.nodeType == Node.TEXT_NODE) {
				node.textContent = node.previousSibling.textContent + node.textContent;
				node.previousSibling.remove();
			}
			let element = node.parentElement;
			let textContent = node.textContent;
			while (noWhitespaceCollapse(element)) {
				element = element.parentElement;
			}
			if ((!element || noWhitespaceCollapse(element)) && textContent.match(/\s+/) && textContent.length > 1) {
				let lastTextContent;
				while (lastTextContent != textContent) {
					lastTextContent = textContent;
					textContent = textContent.replace(/( )+|(\n)+|(\t)+|(\f)+||(\r)+/g, "$1");
				}
				node.textContent = textContent;
			}
		}
	}

	function noWhitespaceCollapse(element) {
		return element && !noWhitespaceCollapseElements.includes(element.tagName.toLowerCase());
	}

	/** Removes HTML comments */
	function removeComments(node) {
		if (node.nodeType == Node.COMMENT_NODE) {
			return !node.textContent.toLowerCase().trim().startsWith("[if");
		}
	}

	/** Removes empty attributes */
	function removeEmptyAttributes(node) {
		if (node.nodeType == Node.ELEMENT_NODE) {
			node.getAttributeNames().forEach(attributeName => {
				if (safeToRemoveAttrs.includes(attributeName.toLowerCase())) {
					const attributeValue = node.getAttribute(attributeName);
					if (attributeValue === "" || (attributeValue || "").match(/^\s+$/)) {
						node.removeAttribute(attributeName);
					}
				}
			});
		}
	}

	/** Removes redundant attributes */
	function removeRedundantAttributes(node) {
		if (node.nodeType == Node.ELEMENT_NODE) {
			const tagRedundantAttributes = redundantAttributes[node.tagName.toLowerCase()];
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

})();