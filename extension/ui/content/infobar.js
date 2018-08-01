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

/* global browser, document, Node */

this.singlefile.infobar = this.singlefile.infobar || (() => {

	const INFOBAR_TAGNAME = "singlefile-infobar";
	const LINK_ICON = "<svg style=\"vertical-align: middle\" xmlns=\"http://www.w3.org/2000/svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"#9AA0A6\"><path d=\"M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z\"/></svg>";
	const SINGLEFILE_COMMENT = "Archive processed by SingleFile";

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
	return true;

	function initInfobar(url, saveDate) {
		let infobarElement = document.querySelector(INFOBAR_TAGNAME);
		if (!infobarElement) {
			infobarElement = document.createElement(INFOBAR_TAGNAME);
			infobarElement.style.all = "unset";
			infobarElement.style.display = "block";
			infobarElement.style.fontSize = "15px";
			infobarElement.style.color = "#9aa0a6";
			infobarElement.style.position = "fixed";
			infobarElement.style.top = "16px";
			infobarElement.style.right = "16px";
			infobarElement.style.height = "auto";
			infobarElement.style.width = "32px";
			infobarElement.style.lineHeight = "32px";
			infobarElement.style.borderRadius = "16px";
			infobarElement.style.border = "2px solid #737373";
			infobarElement.style.zIndex = 2147483647;
			infobarElement.style.textAlign = "center";
			infobarElement.style.transition = "all 250ms";
			const linkElement = document.createElement("a");
			linkElement.style.all = "unset";
			linkElement.style.display = "inline-block";
			linkElement.style.paddingLeft = "8px";
			linkElement.style.lineHeight = "32px";
			linkElement.style.cursor = "pointer";
			linkElement.target = "_blank";
			linkElement.rel = "noopener noreferrer";
			linkElement.title = "Open original page";
			linkElement.href = url.split("url: ")[1];
			linkElement.innerHTML = LINK_ICON;
			hideInfobar(infobarElement, linkElement, saveDate);
			infobarElement.onmouseover = () => infobarElement.style.opacity = 1;
			document.body.appendChild(infobarElement);
			document.addEventListener("click", event => {
				let element = event.target;
				while (element && element != infobarElement) {
					element = element.parentElement;
				}
				if (element != infobarElement) {
					hideInfobar(infobarElement, linkElement, saveDate);
				}
			});
		}
	}

	function displayInfobar(infobarElement, linkElement, saveDate) {
		infobarElement.style.opacity = 1;
		infobarElement.onmouseout = null;
		infobarElement.style.paddingLeft = infobarElement.style.paddingRight = "16px";
		infobarElement.textContent = saveDate.split("saved date: ")[1];
		infobarElement.style.width = "auto";
		infobarElement.style.backgroundColor = "#f9f9f9";
		infobarElement.style.cursor = "auto";
		infobarElement.appendChild(linkElement);
		infobarElement.onclick = null;
	}

	function hideInfobar(infobarElement, linkElement, saveDate) {
		infobarElement.style.opacity = .7;
		infobarElement.onmouseout = () => infobarElement.style.opacity = .7;
		infobarElement.style.paddingLeft = infobarElement.style.paddingRight = "0px";
		infobarElement.style.width = "32px";
		infobarElement.style.backgroundColor = "#737373";
		infobarElement.style.cursor = "pointer";
		infobarElement.textContent = "❔";
		infobarElement.onclick = event => {
			if (event.button === 0) {
				displayInfobar(infobarElement, linkElement, saveDate);
				return false;
			}
		};
	}

})();
