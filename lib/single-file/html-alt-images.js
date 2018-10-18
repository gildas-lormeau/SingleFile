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

/* global docHelper, parseSrcset */

this.altImages = this.altImages || (() => {

	const EMPTY_IMAGE = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

	return {
		process(doc, options) {
			const dataAttributeName = docHelper.responsiveImagesAttributeName(options.sessionId);
			doc.querySelectorAll("picture").forEach(pictureElement => {
				const imgElement = pictureElement.querySelector("img");
				if (imgElement) {
					let srcData = getImgSrcData(pictureElement, imgElement, options);
					let { src, srcset } = srcData;
					if (!src) {
						const sources = Array.from(pictureElement.querySelectorAll("source")).reverse();
						const data = getSourceSrcData(Array.from(sources));
						src = data.src;
						srcset = srcset || data.srcset;
					}
					if (!src && options.responsiveImageData) {
						const responsiveImageData = options.responsiveImageData[Number(pictureElement.getAttribute(dataAttributeName))];
						if (responsiveImageData.src) {
							src = responsiveImageData.src;
						} else if (responsiveImageData.sources) {
							const sources = responsiveImageData.sources.reverse();
							const data = getSourceSrcData(sources);
							src = data.src;
							srcset = srcset || data.srcset;
						}
					}
					setSrc({ src, srcset }, pictureElement.querySelector("img"), pictureElement);
				}
			});
			doc.querySelectorAll(":not(picture) > img[srcset]").forEach(imgElement => setSrc(getImgSrcData(imgElement, imgElement, options), imgElement));
		}
	};

	function getImgSrcData(pictureElement, imgElement, options) {
		const dataAttributeName = docHelper.responsiveImagesAttributeName(options.sessionId);
		let src = imgElement.getAttribute("src");
		let srcset = getSourceSrc(imgElement.getAttribute("srcset"));
		if (options.responsiveImageData) {
			const responsiveImageData = options.responsiveImageData[Number(pictureElement.getAttribute(dataAttributeName))];
			if (!src && responsiveImageData.src) {
				src = responsiveImageData.src;
			}
			if (srcset && responsiveImageData.srcset) {
				srcset = getSourceSrc(responsiveImageData.srcset);
			}
		}
		return { src, srcset };
	}

	function getSourceSrcData(sources) {
		let source = sources.find(source => source.src);
		let src = source && source.src;
		let srcset = source && source.srcset;
		if (!src) {
			source = sources.find(source => getSourceSrc(source.src));
			src = source && source.src;
		}
		if (!srcset) {
			source = sources.find(source => getSourceSrc(source.srcset));
			srcset = source && source.srcset;
		}
		return { src, srcset };
	}

	function setSrc(srcData, imgElement, pictureElement) {
		imgElement.src = EMPTY_IMAGE;
		imgElement.setAttribute("srcset", "");
		if (srcData.src) {
			imgElement.src = srcData.src;
		} else {
			if (imgElement.getAttribute("srcset")) {
				imgElement.setAttribute("srcset", srcData.srcset || "");
				if (!srcData.srcset) {
					imgElement.setAttribute("sizes", "");
				}
			}
		}
		if (pictureElement) {
			pictureElement.querySelectorAll("source").forEach(sourceElement => sourceElement.remove());
		}
	}

	function getSourceSrc(sourceSrcSet) {
		if (sourceSrcSet) {
			const srcset = parseSrcset.process(sourceSrcSet);
			return (srcset.find(srcset => srcset.url)).url;
		}
	}

})();