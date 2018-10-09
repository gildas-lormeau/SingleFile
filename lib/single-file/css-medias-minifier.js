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

/* global CSSRule, mediaQueryParser */

this.mediasMinifier = this.mediasMinifier || (() => {

	return {
		process: doc => {
			const stats = { processed: 0, discarded: 0 };
			doc.querySelectorAll("style").forEach(styleElement => {
				if (styleElement.sheet) {
					styleElement.textContent = processRules(doc, styleElement.sheet.cssRules, styleElement.media || "all", stats);
				}
			});
			return stats;
		}
	};

	function processRules(doc, cssRules, media, stats) {
		let sheetContent = "";
		if (matchesMediaType(media, "screen")) {
			Array.from(cssRules).forEach(cssRule => {
				if (cssRule.type == CSSRule.MEDIA_RULE) {
					stats.processed++;
					if (matchesMediaType(cssRule.media.mediaText, "screen")) {
						sheetContent += "@media " + Array.from(cssRule.media).join(",") + "{";
						sheetContent += processRules(doc, cssRule.cssRules, cssRule.media.mediaText, stats);
						sheetContent += "}";
					} else {
						stats.discarded++;
					}
				} else {
					sheetContent += cssRule.cssText;
				}
			});
		}
		return sheetContent;
	}

	function flatten(array) {
		return array.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []);
	}

	function matchesMediaType(mediaText, mediaType) {
		const foundMediaTypes = flatten(mediaQueryParser.parseMediaList(mediaText).map(node => getMediaTypes(node, mediaType)));
		return foundMediaTypes.find(mediaTypeInfo => (!mediaTypeInfo.not && (mediaTypeInfo.value == mediaType || mediaTypeInfo.value == "all")) || (mediaTypeInfo.not && (mediaTypeInfo.value == "all" || mediaTypeInfo.value != mediaType)));
	}

	function getMediaTypes(parentNode, mediaType, mediaTypes = []) {
		parentNode.nodes.map((node, indexNode) => {
			if (node.type == "media-query") {
				return getMediaTypes(node, mediaType, mediaTypes);
			} else {
				if (node.type == "media-type") {
					const nodeMediaType = { not: Boolean(indexNode && parentNode.nodes[0].type == "keyword" && parentNode.nodes[0].value == "not"), value: node.value };
					if (!mediaTypes.find(mediaType => nodeMediaType.not == mediaType.not && nodeMediaType.value == mediaType.value)) {
						mediaTypes.push(nodeMediaType);
					}
				}
			}
		});
		if (!mediaTypes.length) {
			mediaTypes.push({ not: false, value: "all" });
		}
		return mediaTypes;
	}

})();