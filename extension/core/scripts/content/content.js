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

/* global SingleFile, singlefile, FrameTree, document, Blob, MouseEvent, getSelection */

(() => {

	const browser = this.browser || this.chrome;

	const SELECTED_CONTENT_ATTRIBUTE_NAME = "data-single-file-selected-content";

	let processing = false;

	browser.runtime.onMessage.addListener(request => {
		if (request.processStart && !processing) {
			processing = true;
			fixInlineScripts();
			getOptions(request.options)
				.then(options => SingleFile.initialize(options))
				.then(process => {
					singlefile.ui.init();
					return process();
				})
				.then(page => {
					const date = new Date();
					page.filename = page.title + " (" + date.toISOString().split("T")[0] + " " + date.toLocaleTimeString() + ")" + ".html";
					page.url = URL.createObjectURL(new Blob([page.content], { type: "text/html" }));
					downloadPage(page);
					singlefile.ui.end();
					processing = false;
				})
				.catch(error => {
					browser.runtime.sendMessage({ processError: true });
					processing = false;
					throw error;
				});
		}
	});

	function fixInlineScripts() {
		document.querySelectorAll("script").forEach(element => element.textContent = element.textContent.replace(/<\/script>/gi, "<\\/script>"));
	}

	async function getOptions(options) {
		options.url = document.location.href;
		if (options.selected) {
			markSelectedContent();
		}
		options.content = getDoctype(document) + document.documentElement.outerHTML;
		options.canvasData = getCanvasData();
		if (!options.removeFrames) {
			options.framesData = await FrameTree.getFramesData();
		}
		document.querySelectorAll("[" + SELECTED_CONTENT_ATTRIBUTE_NAME + "]").forEach(selectedContent => selectedContent.removeAttribute(SELECTED_CONTENT_ATTRIBUTE_NAME));
		options.jsEnabled = true;
		options.onprogress = onProgress;
		return options;
	}

	function getCanvasData() {
		const canvasData = [];
		document.querySelectorAll("canvas").forEach(canvasElement => {
			try {
				canvasData.push({ dataURI: canvasElement.toDataURL("image/png", ""), width: canvasElement.clientWidth, height: canvasElement.clientHeight });
			} catch (e) {
				canvasData.push(null);
			}
		});
		return canvasData;
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

	function onProgress(event) {
		if (event.type == event.RESOURCES_INITIALIZED) {
			browser.runtime.sendMessage({
				processStart: true,
				index: event.details.index,
				maxIndex: event.details.max
			});
		}
		if (event.type == event.RESOURCE_LOADED) {
			browser.runtime.sendMessage({
				processProgress: true,
				index: event.details.index,
				maxIndex: event.details.max
			});
		}
		if (event.type == event.PAGE_ENDED) {
			browser.runtime.sendMessage({ processEnd: true });
		}
	}

	function downloadPage(page) {
		const link = document.createElement("a");
		document.body.appendChild(link);
		link.download = page.filename;
		link.href = page.url;
		link.dispatchEvent(new MouseEvent("click"));
		link.remove();
	}

})();
