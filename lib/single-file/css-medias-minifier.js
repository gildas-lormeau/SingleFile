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

/* global cssTree, mediaQueryParser */

this.mediasMinifier = this.mediasMinifier || (() => {

	return {
		process: stylesheets => {
			const stats = { processed: 0, discarded: 0 };
			stylesheets.forEach((stylesheet, element) => {
				const media = stylesheet.media || "all";
				if (matchesMediaType(media, "screen")) {
					const removedRules = processRules(stylesheet.stylesheet.children, stats);
					removedRules.forEach(({ cssRules, cssRule }) => cssRules.remove(cssRule));
				} else {
					stylesheets.delete(element);
				}
			});
			return stats;
		}
	};

	function processRules(cssRules, stats, removedRules = []) {
		for (let cssRule = cssRules.head; cssRule; cssRule = cssRule.next) {
			const cssRuleData = cssRule.data;
			if (cssRuleData.type == "Atrule" && cssRuleData.name == "media" && cssRuleData.block && cssRuleData.prelude) {
				stats.processed++;
				if (matchesMediaType(cssTree.generate(cssRuleData.prelude), "screen")) {
					processRules(cssRuleData.block.children, stats, removedRules);
				} else {
					removedRules.push({ cssRules, cssRule });
					stats.discarded++;
				}
			}
		}
		return removedRules;
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