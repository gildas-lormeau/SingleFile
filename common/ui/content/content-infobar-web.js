/*
 * Copyright 2010-2020 Gildas Lormeau
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

/* global document, Node, window, top, getComputedStyle, XPathResult */

(() => {

	const INFOBAR_TAGNAME = "singlefile-infobar";
	const LINK_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASBAMAAACk4JNkAAABhWlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV9TtaIVByuIOGSoTi2IijpKFYtgobQVWnUwufQLmjQkKS6OgmvBwY/FqoOLs64OroIg+AHi5Oik6CIl/i8ptIj14Lgf7+497t4BQq3EVLNjHFA1y0hEI2I6syr6XtGLLgwihBmJmXosuZhC2/F1Dw9f78I8q/25P0efkjUZ4BGJ55huWMQbxNObls55nzjACpJCfE4cMuiCxI9cl11+45x3WOCZASOVmCcOEIv5FpZbmBUMlXiKOKioGuULaZcVzluc1VKFNe7JX+jPaitJrtMcQRRLiCEOETIqKKIEC2FaNVJMJGg/0sY/7Pjj5JLJVQQjxwLKUCE5fvA/+N2tmZuccJP8EaDzxbY/RgHfLlCv2vb3sW3XTwDvM3ClNf3lGjD7SXq1qQWPgP5t4OK6qcl7wOUOMPSkS4bkSF6aQi4HvJ/RN2WAgVugZ83trbGP0wcgRV0t3wAHh8BYnrLX27y7u7W3f880+vsB4D1y0ysS64EAAAAJcEhZcwAALiMAAC4jAXilP3YAAAAHdElNRQfkCwYVMBTMyx7sAAAAGXRFWHRDb21tZW50AENyZWF0ZWQgd2l0aCBHSU1QV4EOFwAAAA9QTFRFAAAAfIeNfoeMgIeLioqKCstQngAAAAF0Uk5TAEDm2GYAAAABYktHRASPaNlRAAAAO0lEQVQIHQXBAQkAMAwDsEANzMMNFOrf2xMAACCbrSh4KCQoNCgiKCooAUqBgqAgOBAcCA4E2bYVAAB80bAE6Tea12kAAAAASUVORK5CYII=";
	const IMAGE_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAABIUlEQVQ4y+2TsarCMBSGvxTBRdqiUZAWOrhJB9EXcPKFfCvfQYfulUKHDqXg4CYUJSioYO4mSDX3ttzt3n87fMlHTpIjlsulxpDZbEYYhgghSNOUOI5Ny2mZYBAELBYLer0eAJ7ncTweKYri4x7LJJRS0u12n7XrukgpjSc0CpVSXK/XZ32/31FKNW85z3PW6zXT6RSAJEnIsqy5UGvNZrNhu90CcDqd+C6tT6J+v//2Th+PB2VZ1hN2Oh3G4zGTyQTbtl/YbrdjtVpxu91+Ljyfz0RRhG3bzOfzF+Y4TvNXvlwuaK2pE4tfzr/wzwsty0IIURlL0998KxRCMBqN8H2/wlzXJQxD2u12vVkeDoeUZUkURRU+GAw4HA7s9/sK+wK6CWHasQ/S/wAAAABJRU5ErkJggg==";
	const SINGLEFILE_COMMENT = "SingleFile";
	const SINGLE_FILE_UI_ELEMENT_CLASS = "single-file-ui-element";

	const browser = this.browser;

	if (window == top) {
		if (document.readyState == "loading") {
			document.addEventListener("DOMContentLoaded", displayIcon, false);
		} else {
			displayIcon();
		}
	}

	async function displayIcon() {
		const result = document.evaluate("//comment()", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
		let singleFileComment = result && result.singleNodeValue;
		if (singleFileComment && isSingleFileComment(singleFileComment)) {
			const info = singleFileComment.textContent.split("\n");
			const [, , url, saveDate, ...infoData] = info;
			if (url && saveDate) {
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
			infobarElement.className = SINGLE_FILE_UI_ELEMENT_CLASS;
			const shadowRoot = infobarElement.attachShadow({ mode: "open" });
			const styleElement = document.createElement("style");
			styleElement.textContent = `
				.infobar {
					background-color: #737373;
					color: white;
					display: flex;
					position: fixed;
					top: 16px;
					right: 16px;
					height: auto;
					width: auto;
					min-height: 24px;
					min-width: 24px;
					background-position: center;
					background-repeat: no-repeat;
					z-index: 2147483647;
					text-align: center;
					margin: 0 0 0 16px;
					background-image: url(${IMAGE_ICON});
					border-radius: 16px;
					user-select: none;
					-moz-user-select: none;
					opacity: .7;
					cursor: pointer;
					padding-left: 0;
					padding-right: 0;
					padding-top: 0;
					padding-bottom: 0;
					border: 2px solid #eee;
					background-size: 70% 70%;
					transition: all 250ms;
					font-size: 13px;					
				}
				.infobar:hover {
					opacity: 1;					
				}
				.infobar-open {					
					opacity: 1;					
					background-color: #f9f9f9;
					cursor: auto;
					color: #2d2d2d;					
					padding-top: 2px;
					padding-bottom: 2px;
					border: 2px solid #878787;
					background-image: none;
					border-radius: 8px;					
					user-select: initial;
					-moz-user-select: initial;
				}
				.infobar-close-button {
					display: none;
					opacity: .7;
					padding-left: 8px;
					padding-right: 8px;
					cursor: pointer;
					color: rgb(126 135 140);
					line-height: 24px;
					font-size: 16px;
					transition: opacity 250ms;
				}
				.infobar-close-button:hover {
					opacity: 1;
				}
				.infobar-content {
					display: none;
					font-family: Arial;
					font-size: 14px;
					line-height: 22px;
					word-break: break-word;
					white-space: pre-wrap;
					position: relative;
					top: 1px;
				}				
				.infobar-link {
					display: none;
					padding-left: 8px;
					padding-right: 8px;
					line-height: 11px;
					cursor: pointer;
					user-select: none;
				}
				.infobar-link-icon {
					padding-top: 3px;
					padding-left: 2px;
					cursor: pointer;
					opacity: .7;
					transition: opacity 250ms;
				}
				.infobar-link-icon:hover {
					opacity: 1;
				}
				.infobar-open .infobar-close-button, .infobar-open .infobar-content, .infobar-open .infobar-link {
					display: inline-block;
				}
			`;
			shadowRoot.appendChild(styleElement);
			const infobarContent = document.createElement("div");
			infobarContent.classList.add("infobar");
			shadowRoot.appendChild(infobarContent);
			const closeElement = document.createElement("span");
			closeElement.classList.add("infobar-close-button");
			infobarContent.appendChild(closeElement);
			closeElement.textContent = "✕";
			closeElement.onclick = event => {
				if (event.button === 0) {
					infobarElement.remove();
				}
			};
			const infoElement = document.createElement("span");
			infobarContent.appendChild(infoElement);
			infoElement.classList.add("infobar-content");
			infoElement.textContent = infoData;
			const linkElement = document.createElement("a");
			linkElement.classList.add("infobar-link");
			infobarContent.appendChild(linkElement);
			linkElement.target = "_blank";
			linkElement.rel = "noopener noreferrer";
			linkElement.title = "Open source URL: " + url;
			linkElement.href = url;
			const imgElement = document.createElement("img");
			imgElement.classList.add("infobar-link-icon");
			linkElement.appendChild(imgElement);
			imgElement.src = LINK_ICON;
			hideInfobar(infobarContent);

			document.addEventListener("click", event => {
				if (event.button === 0) {
					let element = event.target;
					while (element && element != infobarElement) {
						element = element.parentElement;
					}
					if (element != infobarElement) {
						hideInfobar(infobarContent);
					}
				}
			});
		}
	}

	function displayInfobar(infobarContent) {
		infobarContent.classList.add("infobar-open");
		infobarContent.onclick = null;
		infobarContent.onmouseout = null;
	}

	function hideInfobar(infobarContent) {
		infobarContent.classList.remove("infobar-open");
		infobarContent.onclick = event => {
			if (event.button === 0) {
				displayInfobar(infobarContent);
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
