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

/* global browser, SingleFile, singlefile, FrameTree, document, Blob, MouseEvent, getSelection, getComputedStyle, prompt, addEventListener */

(() => {

	const PROGRESS_LOADED_COEFFICIENT = 2;

	let processing = false;

	browser.runtime.onMessage.addListener(async message => {
		savePage(message);
		return {};
	});

	addEventListener("message", event => {
		if (typeof event.data === "string" && event.data.startsWith("__SingleFile__::")) {
			const message = JSON.parse(event.data.substring("__SingleFile__".length + 2));
			savePage(message);
		}
	});

	async function savePage(message) {
		if (message.processStart && !processing && !message.options.frameId) {
			processing = true;
			try {
				const page = await processMessage(message);
				downloadPage(page, message.options);
				revokeDownloadURL(page);
			} catch (error) {
				console.error(error); // eslint-disable-line no-console
				browser.runtime.sendMessage({ processError: true, error });
			}
			processing = false;
		}
	}

	async function processMessage(message) {
		const options = await getOptions(message.options);
		const processor = new SingleFile(options);
		fixInlineScripts();
		fixHeadNoScripts();
		if (options.selected) {
			selectSelectedContent(processor.SELECTED_CONTENT_ATTRIBUTE_NAME);
		}
		if (!options.removeFrames) {
			hideHeadFrames();
		}
		if (options.removeHiddenElements) {
			selectRemovedElements(processor.REMOVED_CONTENT_ATTRIBUTE_NAME);
		}
		options.url = options.url || document.location.href;
		options.content = options.content || getDoctype(document) + document.documentElement.outerHTML;
		await processor.initialize();
		if (options.removeHiddenElements) {
			unselectRemovedElements(processor.REMOVED_CONTENT_ATTRIBUTE_NAME);
		}
		if (options.shadowEnabled) {
			singlefile.ui.init();
		}
		await processor.preparePageData();
		const page = processor.getPageData();
		if (options.selected) {
			unselectSelectedContent(processor.SELECTED_CONTENT_ATTRIBUTE_NAME);
		}
		const date = new Date();
		page.filename = page.title + (options.appendSaveDate ? " (" + date.toISOString().split("T")[0] + " " + date.toLocaleTimeString() + ")" : "") + ".html";
		page.url = URL.createObjectURL(new Blob([page.content], { type: "text/html" })); // TODO: revoke after download
		if (options.shadowEnabled) {
			singlefile.ui.end();
		}
		return page;
	}

	function revokeDownloadURL(page) {
		URL.revokeObjectURL(page.url);
	}

	function fixInlineScripts() {
		document.querySelectorAll("script").forEach(element => element.textContent = element.textContent.replace(/<\/script>/gi, "<\\/script>"));
	}

	function hideHeadFrames() {
		document.head.querySelectorAll("iframe, frame, object[type=\"text/html\"][data]").forEach(element => element.hidden = true);
	}

	function fixHeadNoScripts() {
		document.head.querySelectorAll("noscript").forEach(noscriptElement => document.body.insertBefore(noscriptElement, document.body.firstChild));
	}

	function selectRemovedElements(REMOVED_CONTENT_ATTRIBUTE_NAME) {
		document.querySelectorAll("html > body *:not(style):not(script):not(link)").forEach(element => {
			const style = getComputedStyle(element);
			if (element.hidden || style.display == "none" || ((style.opacity === 0 || style.visibility == "hidden") && !element.clientWidth && !element.clientHeight)) {
				element.setAttribute(REMOVED_CONTENT_ATTRIBUTE_NAME, "");
			}
		});
	}

	function unselectRemovedElements(REMOVED_CONTENT_ATTRIBUTE_NAME) {
		document.querySelectorAll("[" + REMOVED_CONTENT_ATTRIBUTE_NAME + "]").forEach(element => element.removeAttribute(REMOVED_CONTENT_ATTRIBUTE_NAME));
	}

	function selectSelectedContent(SELECTED_CONTENT_ATTRIBUTE_NAME) {
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

	function unselectSelectedContent(SELECTED_CONTENT_ATTRIBUTE_NAME) {
		document.querySelectorAll("[" + SELECTED_CONTENT_ATTRIBUTE_NAME + "]").forEach(selectedContent => selectedContent.removeAttribute(SELECTED_CONTENT_ATTRIBUTE_NAME));
	}

	async function getOptions(options) {
		options.canvasData = getCanvasData();
		if (!options.removeFrames) {
			options.framesData = await FrameTree.getFramesData();
		}
		options.jsEnabled = true;
		let indexLoaded = 0, indexLoading = 0;
		options.onprogress = event => {
			if (event.type == event.RESOURCES_INITIALIZED || event.type == event.RESOURCE_LOADED || event.type == event.RESOURCE_LOADING) {
				if (event.type == event.RESOURCE_LOADED) {
					indexLoaded = event.details.index;
				}
				if (event.type == event.RESOURCE_LOADING) {
					indexLoading = event.details.index;
				}
				browser.runtime.sendMessage({ processProgress: true, index: (indexLoaded * PROGRESS_LOADED_COEFFICIENT) + indexLoading, maxIndex: event.details.max * (PROGRESS_LOADED_COEFFICIENT + 1) });
			} else if (event.type == event.PAGE_ENDED) {
				browser.runtime.sendMessage({ processEnd: true });
			}
		};
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

	function downloadPage(page, options) {
		if (options.confirmFilename) {
			page.filename = prompt("File name", page.filename);
		}
		if (page.filename && page.filename.length) {
			const link = document.createElement("a");
			document.body.appendChild(link);
			link.download = page.filename;
			link.href = page.url;
			link.dispatchEvent(new MouseEvent("click"));
			link.remove();
		}
	}

})();
