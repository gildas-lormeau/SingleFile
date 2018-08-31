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

/* global browser, document, Node, window, top, getComputedStyle */

this.singlefile.infobar = this.singlefile.infobar || (() => {

	const INFOBAR_TAGNAME = "singlefile-infobar";
	const LINK_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAABmJLR0QABQDuAACS38mlAAAACXBIWXMAACfuAAAn7gExzuVDAAAAB3RJTUUH4ggCDDcMnYqGGAAAATtJREFUOMvNk19LwlAYxp+zhOoqpxJ1la3patFVINk/oRDBLuyreiPFMmcj/QQRSOOwpEINDCpwRr7d1HBMc4sufO7Oe877e5/zcA4wbWLDi8urGr2+vXsOFfJZdnPboDtuueoRcQEH6RQDgNBP8bxcpfvmA0QxPHF6u/MMInLVHFDP7kMUwyjks2xU8+ZGkgGAbtSp1e5gRhBc+0KQHHSjTg2TY0tVEItF/wYqV6+pYXKoiox0atvjOuQXYnILqiJj/ztceXUlGEirGGRyC0pCciDDmfm6mlYxiFtNKAkJmb0dV2OxpFGxpNFE0NmFTtxqQpbiHsgojQX1bBuyFMfR4S7zk+PYjE5PcizI0xD+6685jubnZvH41MJwgL+p233B8tKiF7SeXMPnYIB+/8OXg2hERO44wzC1+gJYGGpVbtoqiAAAAABJRU5ErkJggg==";
	const SINGLEFILE_COMMENT = "Archive processed by SingleFile";

	if (window == top) {
		document.addEventListener("DOMContentLoaded", async () => {
			const singleFileComment = document.documentElement.childNodes[0];
			if (singleFileComment.nodeType == Node.COMMENT_NODE && singleFileComment.textContent.includes(SINGLEFILE_COMMENT)) {
				const info = singleFileComment.textContent.split("\n");
				const [, , url, saveDate] = info;
				const config = await browser.runtime.sendMessage({ getConfig: true });
				if (config.displayInfobar) {
					initInfobar(url, saveDate);
				}
			}
		});
	}
	return true;

	function initInfobar(url, saveDate) {
		let infobarElement = document.querySelector(INFOBAR_TAGNAME);
		if (!infobarElement) {
			infobarElement = createElement(INFOBAR_TAGNAME, document.body);
			infobarElement.style.setProperty("background-color", "#f9f9f9", "important");
			infobarElement.style.setProperty("color", "#9aa0a6", "important");
			infobarElement.style.setProperty("display", "block", "important");
			infobarElement.style.setProperty("position", "fixed", "important");
			infobarElement.style.setProperty("top", "16px", "important");
			infobarElement.style.setProperty("right", "16px", "important");
			infobarElement.style.setProperty("height", "auto", "important");
			infobarElement.style.setProperty("line-height", "28px", "important");
			infobarElement.style.setProperty("border-radius", "16px", "important");
			infobarElement.style.setProperty("border", "2px solid #737373", "important");
			infobarElement.style.setProperty("-webkit-border-start", "2px solid #737373", "important");
			infobarElement.style.setProperty("-webkit-border-before", "2px solid #737373", "important");
			infobarElement.style.setProperty("-webkit-border-end", "2px solid #737373", "important");
			infobarElement.style.setProperty("-webkit-border-after", "2px solid #737373", "important");
			infobarElement.style.setProperty("z-index", 2147483647, "important");
			infobarElement.style.setProperty("text-align", "center", "important");
			infobarElement.style.setProperty("font-family", "Arial", "important");
			infobarElement.style.setProperty("will-change", "opacity, padding-left, padding-right, width, background-color, color", "important");
			const linkElement = createElement("a", infobarElement);
			linkElement.style.setProperty("display", "inline-block", "important");
			linkElement.style.setProperty("padding-left", "8px", "important");
			linkElement.style.setProperty("line-height", "28px", "important");
			linkElement.style.setProperty("cursor", "pointer", "important");
			linkElement.target = "_blank";
			linkElement.rel = "noopener noreferrer";
			linkElement.title = "Open original page";
			linkElement.href = url.split("url: ")[1];
			const imgElement = createElement("img", linkElement);
			imgElement.style.setProperty("vertical-align", "middle", "important");
			imgElement.style.setProperty("padding-bottom", "2px", "important");
			imgElement.style.setProperty("-webkit-padding-after", "2px", "important");
			imgElement.style.setProperty("padding-left", "2px", "important");
			imgElement.style.setProperty("-webkit-padding-start", "2px", "important");
			imgElement.style.setProperty("cursor", "pointer", "important");
			imgElement.src = LINK_ICON;
			hideInfobar(infobarElement, linkElement, saveDate);
			infobarElement.onmouseover = () => infobarElement.style.setProperty("opacity", 1, "important");
			document.addEventListener("click", event => {
				if (event.button === 0) {
					let element = event.target;
					while (element && element != infobarElement) {
						element = element.parentElement;
					}
					if (element != infobarElement) {
						hideInfobar(infobarElement, linkElement, saveDate);
					}
				}
			});
			setTimeout(() => {
				infobarElement.style.setProperty("transition-property", "opacity, padding-left, padding-right, width, background-color, color", "important");
				infobarElement.style.setProperty("transition-duration", "250ms", "important");
			});
		}
	}

	function displayInfobar(infobarElement, linkElement, saveDate) {
		infobarElement.style.setProperty("font-size", "15px", "important");
		infobarElement.style.setProperty("opacity", 1, "important");
		infobarElement.style.setProperty("width", "auto", "important");
		infobarElement.style.setProperty("background-color", "#f9f9f9", "important");
		infobarElement.style.setProperty("cursor", "auto", "important");
		infobarElement.style.setProperty("color", "#9aa0a6", "important");
		infobarElement.style.setProperty("padding-left", "16px", "important");
		infobarElement.style.setProperty("padding-right", "16px", "important");
		infobarElement.style.setProperty("-webkit-padding-start", "16px", "important");
		infobarElement.style.setProperty("-webkit-padding-end", "16px", "important");
		infobarElement.textContent = saveDate.split("saved date: ")[1];
		infobarElement.appendChild(linkElement);
		infobarElement.onclick = null;
		infobarElement.onmouseout = null;
	}

	function hideInfobar(infobarElement, linkElement, saveDate) {
		infobarElement.style.opacity = .7;
		infobarElement.onmouseout = () => infobarElement.style.opacity = .7;
		infobarElement.style.setProperty("font-size", "24px", "important");
		infobarElement.style.setProperty("width", "28px", "important");
		infobarElement.style.setProperty("background-color", "#737373", "important");
		infobarElement.style.setProperty("cursor", "pointer", "important");
		infobarElement.style.setProperty("color", "white", "important");
		infobarElement.style.setProperty("padding-left", 0, "important");
		infobarElement.style.setProperty("padding-right", 0, "important");
		infobarElement.style.setProperty("-webkit-padding-start", 0, "important");
		infobarElement.style.setProperty("-webkit-padding-end", 0, "important");
		infobarElement.textContent = "ℹ";
		infobarElement.onclick = event => {
			if (event.button === 0) {
				displayInfobar(infobarElement, linkElement, saveDate);
				return false;
			}
		};
	}

	function createElement(tagName, parentElement) {
		const element = document.createElement(tagName);
		parentElement.appendChild(element);
		Array.from(getComputedStyle(element)).forEach(property => element.style.setProperty(property, "initial", "important"));
		return element;
	}

})();
