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

/* global document, globalThis, getComputedStyle */

const singlefile = globalThis.singlefile;

const CLOSE_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABhmlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AYht+mSlUqHewg4hChOogFURFHqWIRLJS2QqsOJpf+CE0akhQXR8G14ODPYtXBxVlXB1dBEPwBcXNzUnSREr9LCi1ivOO4h/e+9+XuO0Col5lqdowDqmYZqXhMzOZWxMAruhGiOYohiZl6Ir2Qgef4uoeP73dRnuVd9+foVfImA3wi8SzTDYt4nXh609I57xOHWUlSiM+Jxwy6IPEj12WX3zgXHRZ4ZtjIpOaIw8RisY3lNmYlQyWeIo4oqkb5QtZlhfMWZ7VcZc178hcG89pymuu0BhHHIhJIQoSMKjZQhoUo7RopJlJ0HvPwDzj+JLlkcm2AkWMeFaiQHD/4H/zurVmYnHCTgjGg88W2P4aBwC7QqNn297FtN04A/zNwpbX8lTow80l6raVFjoDQNnBx3dLkPeByB+h/0iVDciQ/LaFQAN7P6JtyQN8t0LPq9q15jtMHIEO9WroBDg6BkSJlr3m8u6u9b//WNPv3A6mTcr3f/E/sAAAABmJLR0QAigCKAIrj2uckAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAB3RJTUUH5QkPDysvCdPVuwAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAELSURBVHja7ZpLFsIwDAPj3v/OsGHDe1BIa8tKO7Mnlkw+dpoxAAAAAGCfx4ur6Yx/B337UUS4mp/VuWUEcjSfOgO+BXCZCWe0hSqQo/npBLglIUNLdAV2MH84Ad1JyIwdLkK6YoabIHWscBWmihHuAqvHtv+XqmdXOK9TxdKy3axUm2vZkXXGgPJksTuz1bVFeeU2Y6ijsLIpXbtKa1kDs2ews69o7+A+ihJ2lvI+/lcS1G21zUVG18XKNm4OS4BNkGOQQohSmGaIdpgLESvzyiRwKepsXjE2H0ZWMF8Zi4+jK5mviM0DiRXNZ2rhkdTK5jO0xermz2o8dCnq+FS2XNNVH0sDAAAA3JYnre9cH8BZmhEAAAAASUVORK5CYII=";

const SINGLE_FILE_UI_ELEMENT_CLASS = singlefile.helper.SINGLE_FILE_UI_ELEMENT_CLASS;
const ERROR_BAR_TAGNAME = "singlefile-error-bar";

const CSS_PROPERTIES = new Set(Array.from(getComputedStyle(document.documentElement)));

let errorBarElement;

export {
	onError
};

function onError(message, link) {
	try {
		console.error("SingleFile", message, link); // eslint-disable-line no-console
		errorBarElement = document.querySelector(ERROR_BAR_TAGNAME);
		if (!errorBarElement) {
			errorBarElement = createElement(ERROR_BAR_TAGNAME);
			const shadowRoot = errorBarElement.attachShadow({ mode: "open" });
			const styleElement = document.createElement("style");
			styleElement.textContent = `
				.container {
					background-color: #ff6c00;
					color: white;
					display: flex;
					position: fixed;
					top: 0px;
					left: 0px;
					right: 0px;
					height: auto;
					width: auto;
					min-height: 24px;
					min-width: 24px;					
					z-index: 2147483647;
					margin: 0;
					padding: 2px;
					font-family: Arial;
				}
				.text {
					flex: 1;
					padding-top: 4px;
					padding-bottom: 4px;
					padding-left: 8px;					
				}
				.close-button {
					opacity: .7;
					padding-top: 4px;
					padding-left: 8px;
					padding-right: 8px;
					cursor: pointer;
					transition: opacity 250ms;
					height: 16px;
				}
				a {
					color: #303036;
				}
				.close-button:hover {
					opacity: 1;
				}
			`;
			shadowRoot.appendChild(styleElement);
			const containerElement = document.createElement("div");
			containerElement.className = "container";
			const errorTextElement = document.createElement("span");
			errorTextElement.classList.add("text");
			const content = message.split("__DOC_LINK__");
			errorTextElement.textContent = "SingleFile error: " + content[0];
			if (link && content.length == 2) {
				const linkElement = document.createElement("a");
				linkElement.textContent = link;
				linkElement.href = link;
				linkElement.target = "_blank";
				errorTextElement.appendChild(linkElement);
				errorTextElement.appendChild(document.createTextNode(content[1]));
			}
			containerElement.appendChild(errorTextElement);
			const closeElement = document.createElement("img");
			closeElement.classList.add("close-button");
			containerElement.appendChild(closeElement);
			shadowRoot.appendChild(containerElement);
			closeElement.src = CLOSE_ICON;
			closeElement.onclick = event => {
				if (event.button === 0) {
					errorBarElement.remove();
				}
			};
			document.body.appendChild(errorBarElement);
		}
	} catch (error) {
		// iignored
	}
}

function createElement(tagName, parentElement) {
	const element = document.createElement(tagName);
	element.className = SINGLE_FILE_UI_ELEMENT_CLASS;
	if (parentElement) {
		parentElement.appendChild(element);
	}
	CSS_PROPERTIES.forEach(property => element.style.setProperty(property, "initial", "important"));
	return element;
}