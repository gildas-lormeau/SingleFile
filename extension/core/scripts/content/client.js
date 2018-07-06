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

/* global chrome, SingleFile, singlefile, document, Blob, MouseEvent, getSelection */

(() => {

	const SELECTED_CONTENT_ATTRIBUTE_NAME = "data-single-file-selected-content";

	chrome.runtime.onMessage.addListener(request => {
		if (request.processStart) {
			fixInlineScripts();
			const options = request.options;
			options.url = document.location.href;
			if (options.selected) {
				markSelectedContent();
			}
			options.content = getDoctype(document) + document.documentElement.outerHTML;
			document.querySelectorAll("[" + SELECTED_CONTENT_ATTRIBUTE_NAME + "]").forEach(selectedContent => selectedContent.removeAttribute(SELECTED_CONTENT_ATTRIBUTE_NAME));
			options.jsEnabled = true;
			options.onprogress = event => {
				if (event.type == event.RESOURCES_INITIALIZED) {
					chrome.runtime.sendMessage({
						processStart: true,
						index: event.details.index,
						maxIndex: event.details.max
					});
				}
				if (event.type == event.RESOURCE_LOADED) {
					chrome.runtime.sendMessage({
						processProgress: true,
						index: event.details.index,
						maxIndex: event.details.max
					});
				}
				if (event.type == event.PAGE_ENDED) {
					chrome.runtime.sendMessage({ processEnd: true });
				}
			};
			singlefile.ui.init();
			SingleFile.process(options)
				.then(page => {
					const date = new Date();
					page.filename = page.title + " - (" + date.toISOString().split("T")[0] + " " + date.toLocaleTimeString() + ")" + ".html";
					page.url = URL.createObjectURL(new Blob([page.content], { type: "text/html" }));
					downloadPage(page);
					singlefile.ui.end();
				})
				.catch(error => {
					console.error(error); // eslint-disable-line no-console
					chrome.runtime.sendMessage({ processError: true });
				});
		}
	});

	function downloadPage(page) {
		const link = document.createElement("a");
		document.body.appendChild(link);
		link.download = page.filename;
		link.href = page.url;
		link.dispatchEvent(new MouseEvent("click"));
		link.remove();
	}

	function getDoctype(doc) {
		const docType = doc.doctype;
		let docTypeString;
		if (docType) {
			docTypeString = "<!DOCTYPE " + docType.nodeName;
			if (docType.publicId) {
				docTypeString += " PUBLIC \"" + docType.publicId + "\"";
				if (docType.systemId)
					docTypeString += " \"" + docType.systemId + "\"";
			} else if (docType.systemId)
				docTypeString += " SYSTEM \"" + docType.systemId + "\"";
			if (docType.internalSubset)
				docTypeString += " [" + docType.internalSubset + "]";
			return docTypeString + ">\n";
		}
		return "";
	}

	function markSelectedContent() {
		const selection = getSelection();
		const range = selection.rangeCount ? selection.getRangeAt(0) : null;
		let node;
		if (range && range.startOffset != range.endOffset) {
			node = range.commonAncestorContainer;
			if (node.nodeType != node.ELEMENT_NODE) {
				node = node.parentElement;
			}
		}
		node.setAttribute(SELECTED_CONTENT_ATTRIBUTE_NAME, "");
	}

	function fixInlineScripts() {
		document.querySelectorAll("script").forEach(element => element.textContent = element.textContent.replace(/<\/script>/gi, "<\\/script>"));
	}

})();
