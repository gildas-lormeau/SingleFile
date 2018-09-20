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

this.lazyLoader = this.lazyLoader || (() => {

	const DATA_URI_PREFIX = "data:";
	const EMPTY_DATA_URI = "data:base64,";

	return {
		process(doc) {
			replaceSrc(doc.querySelectorAll("img[data-src]"), "src");
			replaceSrc(doc.querySelectorAll("img[data-lazy-src]"), "lazy-src", "lazySrc");
			replaceSrc(doc.querySelectorAll("img[data-original]"), "original");
			doc.querySelectorAll("[data-bg]").forEach(element => {
				const dataBg = element.dataset.bg;
				if (dataBg && dataBg.startsWith(DATA_URI_PREFIX) && dataBg != EMPTY_DATA_URI && !element.style.backgroundImage.includes(dataBg)) {
					element.style.backgroundImage = "url(" + element.dataset.bg + ")";
					processElement(element);
				}
				element.removeAttribute("data-bg");
			});
			doc.querySelectorAll("[data-srcset]").forEach(imgElement => {
				const srcset = imgElement.dataset.srcset;
				if (srcset && imgElement.srcset != srcset) {
					imgElement.srcset = srcset;
					processElement(imgElement);
				}
				imgElement.removeAttribute("data-srcset");
			});
			doc.querySelectorAll("[data-lazy-srcset]").forEach(imgElement => {
				const srcset = imgElement.dataset.lazySrcset;
				if (srcset && imgElement.srcset != srcset) {
					imgElement.srcset = srcset;
					processElement(imgElement);
				}
				imgElement.removeAttribute("data-lazy-srcset");
			});
			doc.querySelectorAll(".lazyload").forEach(element => {
				element.classList.add("lazypreload");
				element.classList.remove("lazyload");
			});
		},
		imageSelectors: {
			src: {
				"img[data-src]": "data-src",
				"img[data-original]": "data-original",
				"img[data-bg]": "data-bg",
				"img[data-lazy-src]": "data-lazy-src"
			},
			srcset: {
				"[data-srcset]": "data-srcset",
				"[data-lazy-srcset]": "data-lazy-srcset"
			}
		}
	};

	function replaceSrc(elements, attributeName, propertyName) {
		elements.forEach(element => {
			const dataSrc = element.dataset[propertyName || attributeName];
			if (dataSrc && dataSrc.startsWith(DATA_URI_PREFIX) && dataSrc != EMPTY_DATA_URI && (!element.src || (element.src != dataSrc && dataSrc.length > element.src.length))) {
				element.src = element.dataset[propertyName || attributeName];
				processElement(element);
				element.style.opacity = 1;
				element.style.visibility = "visible";
			}
			element.removeAttribute("data-" + attributeName);
		});
	}

	function processElement(element) {
		element.removeAttribute("data-lazyload");
		element.classList.remove("b-lazy");
		element.classList.forEach(className => {
			if (className.includes("loading")) {
				element.classList.remove(className);
			}
		});
	}

})();