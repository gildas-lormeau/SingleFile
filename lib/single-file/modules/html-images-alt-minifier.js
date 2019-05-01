/*
 * Copyright 2010-2019 Gildas Lormeau
 * contact : gildas.lormeau <at> gmail.com
 * 
 * This file is part of SingleFile.
 *
 *   The code in this file is free software: you can redistribute it and/or 
 *   modify it under the terms of the GNU Affero General Public License 
 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
 *   of the License, or (at your option) any later version.
 * 
 *   The code in this file is distributed in the hope that it will be useful, 
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
 *   General Public License for more details.
 *
 *   As additional permission under GNU AGPL version 3 section 7, you may 
 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
 *   AGPL normally required by section 4, provided you include this license 
 *   notice and a URL through which recipients can access the Corresponding 
 *   Source.
 */

this.singlefile.lib.modules.imagesAltMinifier = this.singlefile.lib.modules.imagesAltMinifier || (() => {

	const singlefile = this.singlefile;

	const EMPTY_IMAGE = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

	return {
		process(doc) {
			doc.querySelectorAll("picture").forEach(pictureElement => {
				const imgElement = pictureElement.querySelector("img");
				if (imgElement) {
					let srcData = getImgSrcData(imgElement);
					let { src, srcset } = srcData;
					if (!src) {
						const sources = Array.from(pictureElement.querySelectorAll("source")).reverse();
						const data = getSourceSrcData(Array.from(sources));
						src = data.src;
						if (!srcset) {
							srcset = data.srcset;
						}
					}
					setSrc({ src, srcset }, imgElement, pictureElement);
				}
			});
			doc.querySelectorAll(":not(picture) > img[srcset]").forEach(imgElement => setSrc(getImgSrcData(imgElement), imgElement));
		}
	};

	function getImgSrcData(imgElement) {
		let src = imgElement.getAttribute("src");
		if (src == EMPTY_IMAGE) {
			src = null;
		}
		let srcset = getSourceSrc(imgElement.getAttribute("srcset"));
		if (srcset == EMPTY_IMAGE) {
			srcset = null;
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
			if (src == EMPTY_IMAGE) {
				src = null;
			}
		}
		if (!srcset) {
			source = sources.find(source => getSourceSrc(source.srcset));
			srcset = source && source.srcset;
			if (srcset == EMPTY_IMAGE) {
				srcset = null;
			}
		}
		return { src, srcset };
	}

	function setSrc(srcData, imgElement, pictureElement) {
		if (srcData.src) {
			imgElement.setAttribute("src", srcData.src);
			imgElement.setAttribute("srcset", "");
			imgElement.setAttribute("sizes", "");
		} else {
			imgElement.setAttribute("src", EMPTY_IMAGE);
			if (srcData.srcset) {
				imgElement.setAttribute("srcset", srcData.srcset);
			} else {
				imgElement.setAttribute("srcset", "");
				imgElement.setAttribute("sizes", "");
			}
		}
		if (pictureElement) {
			pictureElement.querySelectorAll("source").forEach(sourceElement => sourceElement.remove());
		}
	}

	function getSourceSrc(sourceSrcSet) {
		if (sourceSrcSet) {
			const srcset = singlefile.lib.vendor.srcsetParser.process(sourceSrcSet);
			return (srcset.find(srcset => srcset.url)).url;
		}
	}

})();