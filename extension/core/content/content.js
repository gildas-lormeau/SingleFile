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

/* global browser, SingleFile, singlefile, frameTree, document, Blob, MouseEvent, getSelection, prompt, addEventListener, Node, window */

this.singlefile.top = this.singlefile.top || (() => {

	let processing = false;

	browser.runtime.onMessage.addListener(message => {
		if (message.savePage) {
			savePage(message);
		}
	});

	addEventListener("message", event => {
		if (typeof event.data == "string" && event.data.startsWith("__SingleFile__::")) {
			const message = JSON.parse(event.data.substring("__SingleFile__".length + 2));
			if (message.savePage) {
				savePage(message);
			}
		}
	});
	return true;

	async function savePage(message) {
		const options = message.options;
		if (!processing && !options.frameId) {
			processing = true;
			try {
				const page = await processPage(options);
				await downloadPage(page, options);
				revokeDownloadURL(page);
			} catch (error) {
				console.error(error); // eslint-disable-line no-console
				browser.runtime.sendMessage({ processError: true, error, options: { autoSave: false } });
			}
			processing = false;
		}
	}

	async function processPage(options) {
		singlefile.ui.init();
		const processor = new (SingleFile.getClass())(options);
		options.insertSingleFileComment = true;
		options.insertFaviconLink = true;
		if (!options.removeFrames && this.frameTree) {
			options.framesData = await frameTree.getAsync(options);
		}
		options.doc = document;
		options.win = window;
		options.onprogress = event => {
			if (event.type == event.RESOURCES_INITIALIZED || event.type == event.RESOURCE_LOADED) {
				browser.runtime.sendMessage({ processProgress: true, index: event.details.index, maxIndex: event.details.max, options: { autoSave: false } });
				if (options.shadowEnabled) {
					singlefile.ui.onprogress(event);
				}
			} else if (event.type == event.PAGE_ENDED) {
				browser.runtime.sendMessage({ processEnd: true, options: { autoSave: false } });
			}
		};
		if (options.selected) {
			const selectionFound = markSelectedContent(processor.SELECTED_CONTENT_ATTRIBUTE_NAME, processor.SELECTED_CONTENT_ROOT_ATTRIBUTE_NAME);
			if (!selectionFound) {
				options.selected = false;
			}
		}
		if (options.lazyLoadImages) {
			await lazyLoadResources();
		}
		await processor.initialize();
		await processor.preparePageData();
		const page = processor.getPageData();
		if (options.selected) {
			unmarkSelectedContent(processor.SELECTED_CONTENT_ATTRIBUTE_NAME, processor.SELECTED_CONTENT_ROOT_ATTRIBUTE_NAME);
		}
		const date = new Date();
		page.filename = page.title + (options.appendSaveDate ? " (" + date.toISOString().split("T")[0] + " " + date.toLocaleTimeString() + ")" : "") + ".html";
		page.url = URL.createObjectURL(new Blob([page.content], { type: "text/html" }));
		if (options.shadowEnabled) {
			singlefile.ui.end();
		}
		if (options.displayStats) {
			console.log("SingleFile stats"); // eslint-disable-line no-console
			console.table(page.stats); // eslint-disable-line no-console
		}
		return page;
	}

	async function lazyLoadResources() {
		const scriptURL = browser.runtime.getURL("lib/single-file/lazy-loader-before.js");
		const scriptElement = document.createElement("script");
		scriptElement.src = scriptURL;
		document.body.appendChild(scriptElement);
		const promise = new Promise(resolve => scriptElement.onload = () => setTimeout(() => {
			const scriptURL = browser.runtime.getURL("lib/single-file/lazy-loader-after.js");
			const scriptElement = document.createElement("script");
			scriptElement.src = scriptURL;
			document.body.appendChild(scriptElement);
			resolve();
		}, 100));
		return promise;
	}

	function revokeDownloadURL(page) {
		URL.revokeObjectURL(page.url);
	}

	function markSelectedContent(SELECTED_CONTENT_ATTRIBUTE_NAME, SELECTED_CONTENT_ROOT_ATTRIBUTE_NAME) {
		const selection = getSelection();
		const range = selection.rangeCount ? selection.getRangeAt(0) : null;
		const treeWalker = document.createTreeWalker(range.commonAncestorContainer);
		let selectionFound = false;
		const ancestorElement = range.commonAncestorContainer != Node.ELEMENT_NODE ? range.commonAncestorContainer.parentElement : range.commonAncestorContainer;
		ancestorElement.setAttribute(SELECTED_CONTENT_ROOT_ATTRIBUTE_NAME, "");
		while (treeWalker.nextNode() && treeWalker.currentNode != range.endContainer) {
			if (treeWalker.currentNode == range.startContainer) {
				selectionFound = true;
			}
			if (selectionFound) {
				const element = treeWalker.currentNode.nodeType == Node.ELEMENT_NODE ? treeWalker.currentNode : treeWalker.currentNode.parentElement;
				element.setAttribute(SELECTED_CONTENT_ATTRIBUTE_NAME, "");
			}
		}
		return selectionFound;
	}

	function unmarkSelectedContent(SELECTED_CONTENT_ATTRIBUTE_NAME, SELECTED_CONTENT_ROOT_ATTRIBUTE_NAME) {
		document.querySelectorAll("[" + SELECTED_CONTENT_ATTRIBUTE_NAME + "]").forEach(selectedContent => selectedContent.removeAttribute(SELECTED_CONTENT_ATTRIBUTE_NAME));
		document.querySelectorAll("[" + SELECTED_CONTENT_ROOT_ATTRIBUTE_NAME + "]").forEach(selectedContent => selectedContent.removeAttribute(SELECTED_CONTENT_ROOT_ATTRIBUTE_NAME));
	}

	async function downloadPage(page, options) {
		if (options.backgroundSave) {
			const response = await browser.runtime.sendMessage({ download: true, url: page.url, confirmFilename: options.confirmFilename, filename: page.filename });
			if (response.notSupported) {
				const response = await browser.runtime.sendMessage({ download: true, content: page.content, confirmFilename: options.confirmFilename, filename: page.filename });
				if (response.notSupported) {
					downloadPageFallback(page, options);
				}
			}
		} else {
			downloadPageFallback(page, options);
		}
	}

	function downloadPageFallback(page, options) {
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