/*
 * Copyright 2010 Gildas Lormeau
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

(function(holder) {
	var IMPORT_URL_VALUE_EXP = /(url\s*\(\s*(?:'|")?\s*([^('|"|\))]*)\s*(?:'|")?\s*\))|(@import\s*\(?\s*(?:'|")?\s*([^('|"|\))]*)\s*(?:'|")?\s*(?:\)|;))/i;

	var URL_VALUE_EXP = /url\s*\(\s*(?:'|")?\s*([^('|"|\))]*)\s*(?:'|")?\s*\)/i;
	var IMPORT_VALUE_ALT_EXP = /@import\s*\(?\s*(?:'|")?\s*([^('|"|\))]*)\s*(?:'|")?\s*(?:\)|;)/i;

	var URL_EXP = /url\s*\(([^\)]*)\)/gi;

	var IMPORT_EXP = /(@import\s*url\s*\([^\)]*\)\s*;?)|(@import\s*('|")?\s*[^\(|;|'|"]*\s*('|")?\s*;)/gi;
	var IMPORT_ALT_EXP = /@import\s*('|")?\s*[^\(|;|'|"]*\s*('|")?\s*;/gi;

	var EMPTY_PIXEL_DATA = "data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

	var targetDoc;

	function trim(s) {
		return s.replace(/^\s*([\S\s]*?)\s*$/, '$1');
	}

	function formatURL(link, host) {
		var i, newlinkparts, hparts, lparts = link.split('/');

		host = host.split("#")[0].split("?")[0];
		if (/http:|https:|ftp:|data:|javascript:/i.test(lparts[0]))
			return trim(link);
		hparts = host.split('/');
		newlinkparts = [];
		if (hparts.length > 3)
			hparts.pop();
		if (lparts[0] == '') {
			if (lparts[1] == '')
				host = hparts[0] + '//' + lparts[2];
			else
				host = hparts[0] + '//' + hparts[2];
			hparts = host.split('/');
			delete lparts[0];
			if (lparts[1] == '') {
				delete lparts[1];
				delete lparts[2];
			}
		}
		for (i = 0; i < lparts.length; i++) {
			if (lparts[i] == '..') {
				if (lparts[i - 1])
					delete lparts[i - 1];
				else if (hparts.length > 3)
					hparts.pop();
				delete lparts[i];
			}
			if (lparts[i] == '.')
				delete lparts[i];
		}
		for (i = 0; i < lparts.length; i++)
			if (lparts[i])
				newlinkparts[newlinkparts.length] = lparts[i];
		return trim(hparts.join('/') + '/' + newlinkparts.join('/'));
	}

	function resolveURLs(content, host) {
		var ret = content.replace(URL_EXP, function(value) {
			var result = value.match(URL_VALUE_EXP);
			if (result)
				if (result[1].indexOf("data:") != 0)
					return value.replace(result[1], formatURL(result[1], host));
			return value;
		});
		return ret.replace(IMPORT_ALT_EXP, function(value) {
			var result = value.match(IMPORT_VALUE_ALT_EXP);
			if (result)
				if (result[1].indexOf("data:") != 0)
					return "@import \"" + formatURL(result[1], host) + "\";";
			return value;
		});

	}

	function getDataURI(data, defaultURL, woURL) {
		if (data.content)
			return (woURL ? "" : "url(") + "data:" + data.mediaType + ";" + data.mediaTypeParam + "," + data.content + (woURL ? "" : ")");
		else
			return woURL ? defaultURL : ("url(" + defaultURL + ")");
	}

	function removeCssComments(content) {
		var start, end;
		do {
			start = content.indexOf("/*");
			end = content.indexOf("*/", start);
			if (start != -1 && end != -1)
				content = content.substring(0, start) + content.substr(end + 2);
		} while (start != -1 && end != -1);
		return content;
	}

	function replaceCssURLs(getStyle, setStyle, host, callback) {
		var i, url, result, values = removeCssComments(getStyle()).match(URL_EXP);
		if (values)
			for (i = 0; i < values.length; i++) {
				result = values[i].match(URL_VALUE_EXP);
				if (result && result[1]) {
					url = formatURL(result[1], host);
					if (url.indexOf("data:") != 0)
						(function(origUrl) {
							callback(url, function(data) {
								if (getStyle().indexOf(origUrl) != -1)
									setStyle(getStyle().replace(new RegExp(origUrl.replace(/([{}\(\)\^$&.\*\?\/\+\|\[\\\\]|\]|\-)/g, "\\$1"), "gi"),
											getDataURI(data, EMPTY_PIXEL_DATA, true)));
							}, true);
						})(result[1]);
				}
			}
	}

	holder.filters = {
		init : function(doc) {
			targetDoc = doc;
		},
		document : {
			getStylesheets : function(doc, sendRequest) {
				holder.filters.link.get(doc, sendRequest);
				holder.filters.style.getImport(doc, sendRequest);
			},
			get : function(doc, sendRequest, topWindow) {
				holder.filters.styleAttr.get(doc, sendRequest);
				holder.filters.bgAttr.get(doc, sendRequest);
				holder.filters.image.get(doc, sendRequest);
				if (topWindow)
					holder.filters.image.getFavico(doc, sendRequest);
				holder.filters.svg.get(doc, sendRequest);
				holder.filters.script.get(doc, sendRequest);
				holder.filters.style.getURL(doc, sendRequest);
			},
			getDoctype : function() {
				var docType = targetDoc.doctype, docTypeStr;
				if (docType) {
					docTypeStr = "<!DOCTYPE " + docType.nodeName;
					if (docType.publicId) {
						docTypeStr += " PUBLIC \"" + docType.publicId + "\"";
						if (docType.systemId)
							docTypeStr += " \"" + docType.systemId + "\"";
					} else if (docType.systemId)
						docTypeStr += " SYSTEM \"" + docType.systemId + "\"";
					if (docType.internalSubset)
						docTypeStr += " [" + docType.internalSubset + "]";
					return docTypeStr + ">\n";
				}
				return "";
			}
		},
		element : {
			clean : function(doc) {
				Array.prototype.forEach.call(doc.querySelectorAll("blockquote[cite]"), function(element) {
					element.removeAttribute("cite");
				});
			},
			removeHidden : function() {
				if (targetDoc.body)
					Array.prototype.forEach.call(targetDoc.body.querySelectorAll("*:not(style):not(script):not(link):not(area)"), function(element) {
						var style = getComputedStyle(element);
						if ((style.visibility == "hidden" || style.display == "none" || style.opacity == 0) && (element.id != "__SingleFile_mask__"))
							element.parentElement.removeChild(element);
					});
			}
		},
		frame : {
			clean : function() {
				Array.prototype.forEach.call(targetDoc.querySelectorAll("iframe[src], frame[src]"), function(frame) {
					if (!frame.src)
						frame.removeAttribute("src");
				});
			},
			count : function() {
				return targetDoc.querySelectorAll("iframe[src], frame[src]").length;
			},
			remove : function(doc) {
				Array.prototype.forEach.call(doc.querySelectorAll("iframe[src], frame[src]"), function(frame) {
					frame.src = "about:blank";
				});
			},
			set : function(doc, urlsArray) {
				Array.prototype.forEach.call(doc.querySelectorAll("iframe[src], frame[src]"), function(frame, index) {
					frame.src = urlsArray[index] || "about:blank";
				});
			}
		},
		object : {
			remove : function(doc) {
				var i, nodes = doc.querySelectorAll('applet, object:not([type="image/svg+xml"]):not([type="image/svg-xml"]), embed:not([src*=".svg"])');
				for (i = 0; i < nodes.length; i++)
					nodes[i].parentElement.removeChild(nodes[i]);
			}
		},
		styleAttr : {
			get : function(doc, sendRequest) {
				var STYLE_ATTR_SELECTOR = "*[style]";
				Array.prototype.forEach.call(doc.querySelectorAll(STYLE_ATTR_SELECTOR), function(node) {
					replaceCssURLs(function() {
						return node.getAttribute("style");
					}, function(value) {
						node.setAttribute("style", value);
					}, targetDoc.baseURI, sendRequest);					
				});
			}
		},
		bgAttr : {
			get : function(doc, sendRequest) {
				var BG_SELECTOR = 'body[background],table[background],thead[background],tbody[background],tr[background],th[background],td[background]';
				Array.prototype.forEach.call(doc.querySelectorAll(BG_SELECTOR), function(node) {
					var url, value = node.getAttribute("background");
					if (value.indexOf(".") != -1) {
						url = formatURL(value, targetDoc.baseURI);
						if (url.indexOf("data:") != 0)
							sendRequest(url, function(data) {
								node.setAttribute("background", getDataURI(data, EMPTY_PIXEL_DATA, true));
							}, true);
					}
				});
			}
		},
		image : {
			get : function(doc, sendRequest) {
				var IMG_SELECTOR = 'link[href][rel="shortcut icon"], link[href][rel="apple-touch-icon"], link[href][rel="icon"], img[src], input[src][type="image"]';
				Array.prototype.forEach.call(doc.querySelectorAll(IMG_SELECTOR), function(node) {
					var url = formatURL(node.href || node.src, targetDoc.baseURI);
					if (url.indexOf("data:") != 0)
						sendRequest(url, function(data) {
							node.setAttribute(node.href ? "href" : "src", getDataURI(data, EMPTY_PIXEL_DATA, true));
						}, true);
				});
			},
			getFavico : function(doc, sendRequest) {
				var node, foundLink = false, IMG_SELECTOR = 'link[href][rel="shortcut icon"], link[href][rel="apple-touch-icon"], link[href][rel="icon"]';
				Array.prototype.forEach.call(doc.querySelectorAll(IMG_SELECTOR), function(n) {
					var url = formatURL(n.href, targetDoc.baseURI);
					if (!foundLink && url.indexOf("data:") != 0)
						foundLink = true;
				});
				if (!foundLink) {
					node = targetDoc.createElement("link");
					node.type = "image/x-icon";
					node.rel = "shortcut icon";
					node.href = "/favicon.ico";
					doc.querySelector("html > head").appendChild(node);
					sendRequest(node.href, function(data) {
						node.setAttribute(node.href ? "href" : "src", getDataURI(data, EMPTY_PIXEL_DATA, true));
					}, true);
				}
			}
		},
		svg : {
			get : function(doc, sendRequest) {
				var SVG_SELECTOR = 'object[type="image/svg+xml"], object[type="image/svg-xml"], embed[src*=".svg"]';
				Array.prototype.forEach.call(doc.querySelectorAll(SVG_SELECTOR), function(node) {
					var url = formatURL(node.data || node.src, targetDoc.baseURI);
					if (url.indexOf("data:") != 0)
						sendRequest(url, function(data) {
							node.setAttribute(node.data ? "data" : "src", getDataURI(data, "data:text/xml,<svg></svg>", true));
						}, false, true);
				});
			}
		},
		link : {
			get : function(doc, sendRequest) {
				var LINK_SELECTOR = 'link[href][rel*="stylesheet"]';
				Array.prototype.forEach.call(doc.querySelectorAll(LINK_SELECTOR), function(node) {
					if (node.href.indexOf("data:") != 0)
						sendRequest(node.href, function(data) {
							var i, newNode;
							newNode = targetDoc.createElement("style");
							for (i = 0; i < node.attributes.length; i++)
								if (node.attributes[i].value)
									newNode.setAttribute(node.attributes[i].name, node.attributes[i].value);
							newNode._href = node.href;
							newNode.removeAttribute("href");
							newNode.textContent = resolveURLs(data.content || "", data.url) + "\n";
							node.parentElement.replaceChild(newNode, node);
						});
				});
			}
		},
		script : {
			get : function(doc, sendRequest) {
				var SCRIPT_SELECTOR = 'script[src]';
				Array.prototype.forEach.call(doc.querySelectorAll(SCRIPT_SELECTOR), function(node) {
					if (node.src.indexOf("data:") != 0)
						sendRequest(node.src, function(data) {
							data.content = data.content.replace(/"([^"]*)<\/\s*script\s*>([^"]*)"/gi, '"$1<"+"/script>$2"');
							data.content = data.content.replace(/'([^']*)<\/\s*script\s*>([^']*)'/gi, "'$1<'+'/script>$2'");
							node.textContent = [ "\n", data.content, "\n" ].join("");
							node.removeAttribute("src");
						}, false, false, targetDoc.characterSet);
				});
			},
			remove : function(doc) {
				var i, nodes = doc.querySelectorAll('script'), body = doc.querySelector("html > body");
				for (i = 0; i < nodes.length; i++)
					nodes[i].parentElement.removeChild(nodes[i]);
				if (body && body.getAttribute("onload"))
					body.removeAttribute("onload");
			}
		},
		style : {
			getURL : function(doc, sendRequest) {
				Array.prototype.forEach.call(doc.querySelectorAll("style"), function(styleSheet) {
					replaceCssURLs(function() {
						return styleSheet.textContent;
					}, function(value) {
						styleSheet.textContent = value
					}, styleSheet._href || targetDoc.baseURI, sendRequest);
				});
			},
			getImport : function(doc, sendRequest) {
				Array.prototype.forEach.call(doc.querySelectorAll("style"), function(styleSheet) {
					var i, url, result, imports = removeCssComments(styleSheet.textContent).match(IMPORT_EXP);
					if (imports)
						for (i = 0; i < imports.length; i++) {
							result = imports[i].match(IMPORT_URL_VALUE_EXP);
							if (result && (result[2] || result[4])) {
								url = formatURL(result[2] || result[4], styleSheet._href || targetDoc.baseURI);
								if (url.indexOf("data:") != 0)
									(function(imp) {
										sendRequest(url, function(data) {
											styleSheet.textContent = styleSheet.textContent.replace(imp, data.content ? resolveURLs(data.content, data.url)
													: "");
										}, false, false, targetDoc.characterSet);
									})(imports[i]);
							}
						}
				});
			},
			removeUnused : function() {
				Array.prototype.forEach.call(targetDoc.querySelectorAll("style"), function(style) {
					var cssRules = [];

					function process(rules) {
						var selector;
						Array.prototype.forEach.call(rules, function(rule) {
							if (rule instanceof CSSMediaRule) {
								cssRules.push("@media " + Array.prototype.join.call(rule.media, ",") + " {");
								process(rule.cssRules, true);
								cssRules.push("}");
							} else if (rule.selectorText) {
								selector = trim(rule.selectorText.replace(/::after|::before|::first-line|::first-letter|:focus|:hover/gi, ''));
								if (selector) {
									try {
										if (targetDoc.querySelector(selector))
											cssRules.push(rule.cssText);
									} catch (e) {
										cssRules.push(rule.cssText);
									}
								}
							}
						});
					}
					if (style.sheet) {
						process(style.sheet.rules);
						style.innerText = cssRules.join("");
					}
				});
			}
		}
	};
})(singlefile);