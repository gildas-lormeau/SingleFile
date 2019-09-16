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

/* global document, Node, window, top, getComputedStyle, location, setTimeout */

(() => {

	const INFOBAR_TAGNAME = "singlefile-infobar";
	const LINK_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAABmJLR0QABQDuAACS38mlAAAACXBIWXMAACfuAAAn7gExzuVDAAAAB3RJTUUH4ggCDDcMnYqGGAAAATtJREFUOMvNk19LwlAYxp+zhOoqpxJ1la3patFVINk/oRDBLuyreiPFMmcj/QQRSOOwpEINDCpwRr7d1HBMc4sufO7Oe877e5/zcA4wbWLDi8urGr2+vXsOFfJZdnPboDtuueoRcQEH6RQDgNBP8bxcpfvmA0QxPHF6u/MMInLVHFDP7kMUwyjks2xU8+ZGkgGAbtSp1e5gRhBc+0KQHHSjTg2TY0tVEItF/wYqV6+pYXKoiox0atvjOuQXYnILqiJj/ztceXUlGEirGGRyC0pCciDDmfm6mlYxiFtNKAkJmb0dV2OxpFGxpNFE0NmFTtxqQpbiHsgojQX1bBuyFMfR4S7zk+PYjE5PcizI0xD+6685jubnZvH41MJwgL+p233B8tKiF7SeXMPnYIB+/8OXg2hERO44wzC1+gJYGGpVbtoqiAAAAABJRU5ErkJggg==";
	const IMAGE_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAABIUlEQVQ4y+2TsarCMBSGvxTBRdqiUZAWOrhJB9EXcPKFfCvfQYfulUKHDqXg4CYUJSioYO4mSDX3ttzt3n87fMlHTpIjlsulxpDZbEYYhgghSNOUOI5Ny2mZYBAELBYLer0eAJ7ncTweKYri4x7LJJRS0u12n7XrukgpjSc0CpVSXK/XZ32/31FKNW85z3PW6zXT6RSAJEnIsqy5UGvNZrNhu90CcDqd+C6tT6J+v//2Th+PB2VZ1hN2Oh3G4zGTyQTbtl/YbrdjtVpxu91+Ljyfz0RRhG3bzOfzF+Y4TvNXvlwuaK2pE4tfzr/wzwsty0IIURlL0998KxRCMBqN8H2/wlzXJQxD2u12vVkeDoeUZUkURRU+GAw4HA7s9/sK+wK6CWHasQ/S/wAAAABJRU5ErkJggg==";
	const SINGLEFILE_COMMENT = "SingleFile";

	const browser = this.browser;

	if (window == top && location && location.href && location.href.startsWith("file:///")) {
		if (document.readyState == "loading") {
			document.addEventListener("DOMContentLoaded", displayIcon, false);
		} else {
			displayIcon();
		}
	}

	async function displayIcon() {
		let singleFileComment = document.documentElement.childNodes[0];
		if (!isSingleFileComment(singleFileComment)) {
			singleFileComment = findSingleFileComment();
		}
		if (singleFileComment) {
			const info = singleFileComment.textContent.split("\n");
			const [, , url, saveDate, ...infoData] = info;
			let options;
			if (browser && browser.runtime && browser.runtime.sendMessage) {
				options = await browser.runtime.sendMessage({ method: "tabs.getOptions", url });
			} else {
				options = { displayInfobar: true };
			}
			if (options.displayInfobar) {
				initInfobar(url, saveDate, infoData);
			}
		}
	}

	function findSingleFileComment(node = document.documentElement) {
		return node.childNodes && node.childNodes.length ? Array.from(node.childNodes).find(findSingleFileComment) : isSingleFileComment(node);
	}

	function isSingleFileComment(node) {
		return node.nodeType == Node.COMMENT_NODE && node.textContent.includes(SINGLEFILE_COMMENT);
	}

	function initInfobar(url, saveDate, infoData) {
		let infobarElement = document.querySelector(INFOBAR_TAGNAME);
		if (!infobarElement) {
			url = url.split("url: ")[1];
			saveDate = saveDate.split("saved date: ")[1];
			if (infoData && infoData.length > 1) {
				let content = infoData[0].split("info: ")[1].trim();
				for (let indexLine = 1; indexLine < infoData.length - 1; indexLine++) {
					content += "\n" + infoData[indexLine].trim();
				}
				infoData = content.trim();
			} else {
				infoData = saveDate;
			}
			infobarElement = createElement(INFOBAR_TAGNAME, document.body);
			setProperty(infobarElement, "background-color", "#f9f9f9");
			setProperty(infobarElement, "display", "flex");
			setProperty(infobarElement, "position", "fixed");
			setProperty(infobarElement, "top", "16px");
			setProperty(infobarElement, "right", "16px");
			setProperty(infobarElement, "height", "auto");
			setProperty(infobarElement, "min-height", "24px");
			setProperty(infobarElement, "min-width", "24px");
			setProperty(infobarElement, "background-position", "center");
			setProperty(infobarElement, "background-repeat", "no-repeat");
			setProperty(infobarElement, "z-index", 2147483647);
			setProperty(infobarElement, "text-align", "center");
			setProperty(infobarElement, "will-change", "opacity, padding-left, padding-right, width, background-color, color");
			setProperty(infobarElement, "margin", "0 0 0 16px");
			const infoElement = createElement("span", infobarElement);
			setProperty(infoElement, "font-family", "Arial");
			setProperty(infoElement, "color", "#9aa0a6");
			setProperty(infoElement, "font-size", "14px");
			setProperty(infoElement, "line-height", "22px");
			setProperty(infoElement, "word-break", "break-word");
			setProperty(infoElement, "white-space", "pre-wrap");
			infoElement.textContent = infoData;
			const linkElement = createElement("a", infobarElement);
			setProperty(linkElement, "display", "inline-block");
			setProperty(linkElement, "padding-left", "8px");
			setProperty(linkElement, "line-height", "11px");
			setProperty(linkElement, "cursor", "pointer");
			setProperty(linkElement, "user-select", "none");
			linkElement.target = "_blank";
			linkElement.rel = "noopener noreferrer";
			linkElement.title = "Open source URL: " + url;
			linkElement.href = url;
			const imgElement = createElement("img", linkElement);
			setProperty(imgElement, "padding-top", "3px");
			setProperty(imgElement, "-webkit-padding-after", "2px");
			setProperty(imgElement, "padding-left", "2px");
			setProperty(imgElement, "-webkit-padding-start", "2px");
			setProperty(imgElement, "cursor", "pointer");
			setProperty(infobarElement, "text-align", "right");
			imgElement.src = LINK_ICON;
			hideInfobar(infobarElement, linkElement, infoElement);
			infobarElement.onmouseover = () => setProperty(infobarElement, "opacity", 1);
			document.addEventListener("click", event => {
				if (event.button === 0) {
					let element = event.target;
					while (element && element != infobarElement) {
						element = element.parentElement;
					}
					if (element != infobarElement) {
						hideInfobar(infobarElement, linkElement, infoElement);
					}
				}
			});
			setTimeout(() => {
				setProperty(infobarElement, "transition-property", "opacity");
				setProperty(infobarElement, "transition-duration", "250ms");
			});
		}
	}

	function displayInfobar(infobarElement, linkElement, infoElement) {
		setProperty(infobarElement, "font-size", "13px");
		setProperty(infobarElement, "opacity", 1);
		setProperty(infobarElement, "width", "auto");
		setProperty(infobarElement, "background-color", "#f9f9f9");
		setProperty(infobarElement, "cursor", "auto");
		setProperty(infobarElement, "color", "#9aa0a6");
		setProperty(infobarElement, "padding-left", "8px");
		setProperty(infobarElement, "padding-right", "4px");
		setProperty(infobarElement, "padding-top", "2px");
		setProperty(infobarElement, "padding-bottom", "2px");
		setProperty(infobarElement, "-webkit-padding-start", "8px");
		setProperty(infobarElement, "-webkit-padding-end", "4px");
		setProperty(infobarElement, "border", "2px solid #555");
		setProperty(infobarElement, "-webkit-border-start", "2px solid #555");
		setProperty(infobarElement, "-webkit-border-before", "2px solid #555");
		setProperty(infobarElement, "-webkit-border-end", "2px solid #555");
		setProperty(infobarElement, "-webkit-border-after", "2px solid #555");
		setProperty(infobarElement, "background-image", "none");
		setProperty(infobarElement, "border-radius", "8px");
		setProperty(infoElement, "display", "inline-block");
		setProperty(linkElement, "display", "inline-block");
		setProperty(infobarElement, "user-select", "initial");
		setProperty(infobarElement, "-moz-user-select", "initial");
		infobarElement.onclick = null;
		infobarElement.onmouseout = null;
	}

	function hideInfobar(infobarElement, linkElement, infoElement) {
		setProperty(infobarElement, "user-select", "none");
		setProperty(infobarElement, "-moz-user-select", "none");
		setProperty(infobarElement, "opacity", .7);
		infobarElement.onmouseout = () => setProperty(infobarElement, "opacity", .7);
		setProperty(infobarElement, "width", "24px");
		setProperty(infobarElement, "background-color", "#737373");
		setProperty(infobarElement, "cursor", "pointer");
		setProperty(infobarElement, "color", "white");
		setProperty(infobarElement, "padding-left", 0);
		setProperty(infobarElement, "padding-right", 0);
		setProperty(infobarElement, "padding-top", 0);
		setProperty(infobarElement, "padding-bottom", 0);
		setProperty(infobarElement, "-webkit-padding-start", 0);
		setProperty(infobarElement, "-webkit-padding-end", 0);
		setProperty(infobarElement, "border", "2px solid #eee");
		setProperty(infobarElement, "-webkit-border-start", "2px solid #eee");
		setProperty(infobarElement, "-webkit-border-before", "2px solid #eee");
		setProperty(infobarElement, "-webkit-border-end", "2px solid #eee");
		setProperty(infobarElement, "-webkit-border-after", "2px solid #eee");
		setProperty(infobarElement, "background-image", "url(" + IMAGE_ICON + ")");
		setProperty(infobarElement, "background-size", "70% 70%");
		setProperty(infobarElement, "border-radius", "16px");
		setProperty(linkElement, "display", "none");
		setProperty(infoElement, "display", "none");
		infobarElement.onclick = event => {
			if (event.button === 0) {
				displayInfobar(infobarElement, linkElement, infoElement);
				return false;
			}
		};
	}

	function createElement(tagName, parentElement) {
		const element = document.createElement(tagName);
		parentElement.appendChild(element);
		Array.from(getComputedStyle(element)).forEach(property => setProperty(element, property, "initial"));
		return element;
	}

	function setProperty(element, name, value) {
		element.style.setProperty(name, value, "important");
	}

})();
