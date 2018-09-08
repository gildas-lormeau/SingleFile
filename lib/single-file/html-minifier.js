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

this.htmlmini = this.htmlmini || (() => {

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

	const REGEXP_WHITESPACE = /[ \t\f\r]+/g;
	const REGEXP_NEWLINE = /[\n]+/g;
	const REGEXP_ENDS_WHITESPACE = /^\s+$/;

	const modules = [
		collapseBooleanAttributes,
		mergeTextNodes,
		collapseWhitespace,
		removeComments,
		removeEmptyAttributes,
		removeRedundantAttributes,
		compressJSONLD,
		node => mergeElements(node, "style", (node, previousSibling) => node.parentElement && node.parentElement.tagName == "HEAD" && node.media == previousSibling.media),
		node => mergeElements(node, "script", (node, previousSibling) => node.parentElement && node.parentElement.tagName == "HEAD" && ((!node.type || node.nodeType == "text/javascript") && (!previousSibling.type || previousSibling.nodeType == "text/javascript")))
	];

	return {
		process: (doc, options) => {
			const nodesWalker = doc.createTreeWalker(doc.documentElement, NodeFilter.SHOW_ALL, null, false);
			let node = nodesWalker.nextNode();
			while (node) {
				const deletedNode = modules.find(module => module(node, options));
				const previousNode = node;
				node = nodesWalker.nextNode();
				if (deletedNode) {
					previousNode.remove();
				}
			}
		},
		postProcess: doc => {
			removeEmptyInlineElements(doc);
		}
	};

	function collapseBooleanAttributes(node) {
		if (node.nodeType == Node.ELEMENT_NODE) {
			Array.from(node.attributes).forEach(attribute => {
				if (booleanAttributes.includes(attribute.name)) {
					node.setAttribute(attribute.name, "");
				}
			});
		}
	}

	function mergeTextNodes(node) {
		if (node.nodeType == Node.TEXT_NODE) {
			if (node.previousSibling && node.previousSibling.nodeType == Node.TEXT_NODE) {
				node.textContent = node.previousSibling.textContent + node.textContent;
				node.previousSibling.remove();
			}
		}
	}

	function mergeElements(node, tagName, acceptMerge) {
		if (node.nodeType == Node.ELEMENT_NODE && node.tagName.toLowerCase() == tagName.toLowerCase()) {
			let previousSibling = node.previousSibling;
			let previousSiblings = [];
			while (previousSibling && previousSibling.nodeType == Node.TEXT_NODE && !previousSibling.textContent.trim()) {
				previousSiblings.push(previousSibling);
				previousSibling = previousSibling.previousSibling;
			}
			if (previousSibling && previousSibling.nodeType == Node.ELEMENT_NODE && previousSibling.tagName == node.tagName && acceptMerge(node, previousSibling)) {
				node.textContent = previousSibling.textContent + node.textContent;
				previousSiblings.forEach(node => node.remove());
				previousSibling.remove();
			}
		}
	}

	function collapseWhitespace(node, options) {
		if (node.nodeType == Node.TEXT_NODE) {
			let element = node.parentElement;
			const spacePreserved = element.getAttribute(options.preservedSpaceAttributeName) == "";
			let textContent = node.textContent;
			let noWhitespace = !spacePreserved && noWhitespaceCollapse(element);
			while (noWhitespace) {
				element = element.parentElement;
				noWhitespace = element && noWhitespaceCollapse(element);
			}
			if ((!element || noWhitespace) && textContent.length > 1) {
				node.textContent = textContent.replace(REGEXP_WHITESPACE, getWhiteSpace(node)).replace(REGEXP_NEWLINE, getWhiteSpace(node));
			}
		}
	}

	function getWhiteSpace(node) {
		return node.parentElement && node.parentElement.tagName == "HEAD" ? "\n" : " ";
	}

	function noWhitespaceCollapse(element) {
		return element && !noWhitespaceCollapseElements.includes(element.tagName.toLowerCase());
	}

	function removeComments(node) {
		if (node.nodeType == Node.COMMENT_NODE) {
			return !node.textContent.toLowerCase().trim().startsWith("[if");
		}
	}

	function removeEmptyAttributes(node) {
		if (node.nodeType == Node.ELEMENT_NODE) {
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

	function compressJSONLD(node) {
		if (node.nodeType == Node.ELEMENT_NODE && node.tagName == "SCRIPT" && node.type == "application/ld+json" && node.textContent.trim()) {
			try {
				node.textContent = JSON.stringify(JSON.parse(node.textContent));
			} catch (error) {
				/* ignored */
			}
		}
	}

	function removeEmptyInlineElements(doc) {
		doc.querySelectorAll("style, script, noscript").forEach(element => {
			if (!element.textContent.trim()) {
				element.remove();
			}
		});
	}

})();