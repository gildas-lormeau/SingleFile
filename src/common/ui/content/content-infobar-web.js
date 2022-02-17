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

/* global globalThis, window, document, Node, getComputedStyle, XPathResult */

(globalThis => {

	const INFOBAR_TAGNAME = "singlefile-infobar";
	const LINK_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABAAgMAAADXB5lNAAABhmlDQ1BJQ0MgcHJvZmlsZQAAKJF9kj1Iw0AYht+mSkUrDnYQcchQnSyIijqWKhbBQmkrtOpgcukfNGlIUlwcBdeCgz+LVQcXZ10dXAVB8AfEydFJ0UVK/C4ptIjx4LiH9+59+e67A4RGhalm1wSgapaRisfEbG5VDLyiDwEAvZiVmKkn0osZeI6ve/j4ehfhWd7n/hz9St5kgE8kjjLdsIg3iGc2LZ3zPnGIlSSF+Jx43KACiR+5Lrv8xrnosMAzQ0YmNU8cIhaLHSx3MCsZKvE0cVhRNcoXsi4rnLc4q5Uaa9XJbxjMaytprtMcQRxLSCAJETJqKKMCCxFaNVJMpGg/5uEfdvxJcsnkKoORYwFVqJAcP/gb/O6tWZiadJOCMaD7xbY/RoHALtCs2/b3sW03TwD/M3Cltf3VBjD3SXq9rYWPgIFt4OK6rcl7wOUOMPSkS4bkSH6aQqEAvJ/RM+WAwVv6EGtu31r7OH0AMtSr5Rvg4BAYK1L2use9ezr79u+ZVv9+AFlNcp0UUpiqAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAB3RJTUUH5AsHAB8H+DhhoQAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAJUExURQAAAICHi4qKioTuJAkAAAABdFJOUwBA5thmAAAAAWJLR0QCZgt8ZAAAAJJJREFUOI3t070NRCEMA2CnYAOyDyPwpHj/Va7hJ3FzV7zy3ET5JIwoAF6Jk4wzAJAkzxAYG9YRTgB+24wBgKmfrGAKTcEfAY4KRlRoIeBTgKOCERVaCPgU4Khge2GqKOBTgKOCERVaAEC/4PNcnyoSWHpjqkhwKxbcig0Q6AorXYF/+A6eIYD1lVbwG/jdA6/kA2THRAURVubcAAAAAElFTkSuQmCC";
	const CLOSE_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABAAgMAAADXB5lNAAABhmlDQ1BJQ0MgcHJvZmlsZQAAKJF9kj1Iw0AYht+mSkUrDnYQcchQnSyIijqWKhbBQmkrtOpgcukfNGlIUlwcBdeCgz+LVQcXZ10dXAVB8AfEydFJ0UVK/C4ptIjx4LiH9+59+e67A4RGhalm1wSgapaRisfEbG5VDLyiDwEAvZiVmKkn0osZeI6ve/j4ehfhWd7n/hz9St5kgE8kjjLdsIg3iGc2LZ3zPnGIlSSF+Jx43KACiR+5Lrv8xrnosMAzQ0YmNU8cIhaLHSx3MCsZKvE0cVhRNcoXsi4rnLc4q5Uaa9XJbxjMaytprtMcQRxLSCAJETJqKKMCCxFaNVJMpGg/5uEfdvxJcsnkKoORYwFVqJAcP/gb/O6tWZiadJOCMaD7xbY/RoHALtCs2/b3sW03TwD/M3Cltf3VBjD3SXq9rYWPgIFt4OK6rcl7wOUOMPSkS4bkSH6aQqEAvJ/RM+WAwVv6EGtu31r7OH0AMtSr5Rvg4BAYK1L2use9ezr79u+ZVv9+AFlNcp0UUpiqAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAB3RJTUUH5AsHAB8VC4EQ6QAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAJUExURQAAAICHi4qKioTuJAkAAAABdFJOUwBA5thmAAAAAWJLR0QCZgt8ZAAAAJtJREFUOI3NkrsBgCAMRLFwBPdxBArcfxXFkO8rbKWAAJfHJ9faf9vuYX/749T5NmShm3bEwbe2SxeuM4+2oxDL1cDoKtVUjRy+tH78Cv2CS+wIiQNC1AEhk4AQeUTMWUJMfUJMSEJMSEY8kIx4IONroaYAimNxsXp1PA7PxwfVL8QnowwoVC0lig07wDDVUjAdbAnjwtow/z/bDW7eI4M2KruJAAAAAElFTkSuQmCC";
	const IMAGE_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABABAMAAABYR2ztAAABhmlDQ1BJQ0MgcHJvZmlsZQAAKJF9kj1Iw0AYht+mSkUrDnYQcchQnSyIijqWKhbBQmkrtOpgcukfNGlIUlwcBdeCgz+LVQcXZ10dXAVB8AfEydFJ0UVK/C4ptIjx4LiH9+59+e67A4RGhalm1wSgapaRisfEbG5VDLyiDwEAvZiVmKkn0osZeI6ve/j4ehfhWd7n/hz9St5kgE8kjjLdsIg3iGc2LZ3zPnGIlSSF+Jx43KACiR+5Lrv8xrnosMAzQ0YmNU8cIhaLHSx3MCsZKvE0cVhRNcoXsi4rnLc4q5Uaa9XJbxjMaytprtMcQRxLSCAJETJqKKMCCxFaNVJMpGg/5uEfdvxJcsnkKoORYwFVqJAcP/gb/O6tWZiadJOCMaD7xbY/RoHALtCs2/b3sW03TwD/M3Cltf3VBjD3SXq9rYWPgIFt4OK6rcl7wOUOMPSkS4bkSH6aQqEAvJ/RM+WAwVv6EGtu31r7OH0AMtSr5Rvg4BAYK1L2use9ezr79u+ZVv9+AFlNcp0UUpiqAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAB3RJTUUH5AsHADIRLMaOHwAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAAPUExURQAAAIqKioyNjY2OjvDw8L2y1DEAAAABdFJOUwBA5thmAAAAAWJLR0QB/wIt3gAAAGNJREFUSMdjYCAJsLi4OBCQx6/CBQwIGIDPCBcXAkYQUsACU+AwlBVQHg6Eg5pgZBGOboIJZugDFwRwoJECJCUOhJI1wZwzqmBUwagCuipgIqTABG9h7YIKaKGAURAFEF/6AQAO4HqSoDP8bgAAAABJRU5ErkJggg==";
	const SINGLEFILE_COMMENT = "SingleFile";
	const SINGLE_FILE_UI_ELEMENT_CLASS = "single-file-ui-element";
	const INFOBAR_STYLES = `
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
		padding-top: 4px;
		padding-left: 8px;
		padding-right: 8px;
		cursor: pointer;
		transition: opacity 250ms;
		height: 16px;
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
		text-align: left;
	}
	.infobar-link {
		display: none;
		padding-left: 8px;
		padding-right: 8px;
		line-height: 11px;
		cursor: pointer;
		user-select: none;
		outline: 0;
	}
	.infobar-link-icon {
		padding-top: 4px;
		padding-left: 2px;
		cursor: pointer;
		opacity: .7;
		transition: opacity 250ms;
		height: 16px;
	}
	.infobar-link-icon:hover {
		opacity: 1;
	}
	.infobar-open .infobar-close-button, .infobar-open .infobar-content, .infobar-open .infobar-link {
		display: inline-block;
	}`;
	let SHADOW_DOM_SUPPORTED = true;

	const browser = globalThis.browser;

	if (globalThis.window == globalThis.top) {
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
					await initInfobar(url, saveDate, infoData);
				}
			}
		}
	}

	function isSingleFileComment(node) {
		return node.nodeType == Node.COMMENT_NODE && node.textContent.includes(SINGLEFILE_COMMENT);
	}

	async function initInfobar(url, saveDate, infoData) {
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
			const shadowRoot = await getShadowRoot(infobarElement);
			const styleElement = document.createElement("style");
			styleElement.textContent = INFOBAR_STYLES;
			shadowRoot.appendChild(styleElement);
			const infobarContent = document.createElement("div");
			infobarContent.classList.add("infobar");
			shadowRoot.appendChild(infobarContent);
			const closeElement = document.createElement("img");
			closeElement.classList.add("infobar-close-button");
			infobarContent.appendChild(closeElement);
			closeElement.src = CLOSE_ICON;
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
		if (!SHADOW_DOM_SUPPORTED) {
			const infobarElement = document.querySelector(INFOBAR_TAGNAME);
			const frameElement = infobarElement.childNodes[0];
			frameElement.contentWindow.getSelection().removeAllRanges();
		}
		infobarContent.classList.add("infobar-open");
		infobarContent.onclick = null;
		infobarContent.onmouseout = null;
		if (!SHADOW_DOM_SUPPORTED) {
			const infobarElement = document.querySelector(INFOBAR_TAGNAME);
			const frameElement = infobarElement.childNodes[0];
			frameElement.style.setProperty("width", "100vw", "important");
			frameElement.style.setProperty("height", "100vh", "important");
			frameElement.style.setProperty("width", (infobarContent.getBoundingClientRect().width + 33) + "px", "important");
			frameElement.style.setProperty("height", (infobarContent.getBoundingClientRect().height + 21) + "px", "important");
		}
	}

	function hideInfobar(infobarContent) {
		infobarContent.classList.remove("infobar-open");
		infobarContent.onclick = event => {
			if (event.button === 0) {
				displayInfobar(infobarContent);
				return false;
			}
		};
		if (!SHADOW_DOM_SUPPORTED) {
			const infobarElement = document.querySelector(INFOBAR_TAGNAME);
			const frameElement = infobarElement.childNodes[0];
			frameElement.style.setProperty("width", "44px", "important");
			frameElement.style.setProperty("height", "48px", "important");
		}
	}

	function createElement(tagName, parentElement) {
		const element = document.createElement(tagName);
		parentElement.appendChild(element);
		Array.from(getComputedStyle(element)).forEach(property => element.style.setProperty(property, "initial", "important"));
		return element;
	}

	async function getShadowRoot(element) {
		if (element.attachShadow) {
			return element.attachShadow({ mode: "open" });
		} else {
			SHADOW_DOM_SUPPORTED = false;
			const iframe = createElement("iframe", element);
			iframe.style.setProperty("background-color", "transparent", "important");
			iframe.style.setProperty("position", "fixed", "important");
			iframe.style.setProperty("top", 0, "important");
			iframe.style.setProperty("right", 0, "important");
			iframe.style.setProperty("width", "44px", "important");
			iframe.style.setProperty("height", "48px", "important");
			iframe.style.setProperty("z-index", 2147483647, "important");
			return new Promise(resolve => {
				iframe.contentDocument.body.style.setProperty("margin", 0);
				iframe.onload = () => resolve(iframe.contentDocument.body);
			});
		}
	}

})(typeof globalThis == "object" ? globalThis : window);
