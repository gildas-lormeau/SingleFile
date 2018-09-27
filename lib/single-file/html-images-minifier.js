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

/* global docHelper */

this.imagesMinifier = this.imagesMinifier || (() => {

	return {
		process: (doc, options) => {
			const imageGroups = getImageGroups(doc);
			const duplicates = new Set();
			imageGroups.forEach((elements, src) => {
				if (elements.length > 1 && src && src != doc.baseURI) {
					elements.forEach(element => duplicates.add(element));
				}
			});
			const customProperties = new Map();
			if (duplicates.size) {
				processImages(doc, duplicates, options, customProperties);
			}
			const styleElement = doc.createElement("style");
			let sheetContent = "";
			customProperties.forEach((variableName, src) => {
				if (sheetContent) {
					sheetContent += ";";
				}
				sheetContent += variableName + ":url(\"" + src + "\")";
			});
			styleElement.textContent = ":root{" + sheetContent + "}";
			doc.head.appendChild(styleElement);
		},
		postProcess: () => { }
	};

	function getImageGroups(doc) {
		const imageGroups = new Map();
		doc.querySelectorAll("img[src]:not([srcset])").forEach(imageElement => {
			if (imageElement.src) {
				let imageInfo = imageGroups.get(imageElement.src);
				if (!imageInfo) {
					imageInfo = [];
					imageGroups.set(imageElement.src, imageInfo);
				}
				imageInfo.push(imageElement);
			}
		});
		return imageGroups;
	}

	function processImages(doc, duplicates, options, customProperties) {
		doc.querySelectorAll("img[src]:not([srcset])").forEach((imgElement, imgIndex) => {
			if (duplicates.has(imgElement) && imgElement.style.getPropertyValue("background-image")) {
				const src = imgElement.getAttribute("src");
				const dataAttributeName = docHelper.imagesAttributeName(options.sessionId);
				const imageData = options.imageData[Number(imgElement.getAttribute(dataAttributeName))];
				imgElement.setAttribute("src", "data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"" + imageData.contentWidth + "\" height=\"" + imageData.contentHeight + "\"><rect fill-opacity=\"0\"/></svg>");
				let variableName = customProperties.get(src);
				if (!variableName) {
					variableName = "--single-file-image-" + imgIndex;
					customProperties.set(src, variableName);
				}
				imgElement.style.setProperty("background-image", "var(" + variableName + ")", "important");
				imgElement.style.setProperty("background-size", imageData.contentWidth + "px " + imageData.contentHeight + "px", "important");
				imgElement.style.setProperty("background-origin", "content-box", "important");
				imgElement.style.setProperty("background-repeat", "no-repeat", "important");
			}
		});
	}

})();