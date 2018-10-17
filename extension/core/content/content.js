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

/* global browser, SingleFile, singlefile, frameTree, document, Blob, MouseEvent, getSelection, prompt, addEventListener, Node, window, lazyLoader */

this.singlefile.top = this.singlefile.top || (() => {

	const MESSAGE_PREFIX = "__SingleFile__::";
	const SingleFileClass = SingleFile.getClass();

	let processing = false;

	browser.runtime.onMessage.addListener(message => {
		if (message.savePage) {
			savePage(message);
		}
	});

	addEventListener("message", event => {
		if (typeof event.data == "string" && event.data.startsWith(MESSAGE_PREFIX)) {
			const message = JSON.parse(event.data.substring(MESSAGE_PREFIX.length));
			if (message.savePage) {
				savePage(message);
			}
		}
	});
	return true;

	async function savePage(message) {
		const options = message.options;
		if (!processing && !options.frameId) {
			let selectionFound;
			if (options.selected) {
				selectionFound = await markSelection();
			}
			if (!options.selected || selectionFound) {
				processing = true;
				try {
					const page = await processPage(options);
					await downloadPage(page, options);
				} catch (error) {
					console.error(error); // eslint-disable-line no-console
					browser.runtime.sendMessage({ processError: true, error, options: { autoSave: false } });
				}
			} else {
				browser.runtime.sendMessage({ processCancelled: true, options: { autoSave: false } });
			}
			processing = false;
		}
	}

	async function markSelection() {
		let selectionFound = markSelectedContent();
		if (selectionFound) {
			return selectionFound;
		} else {
			const selectedArea = await singlefile.ui.getSelectedArea();
			if (selectedArea) {
				markSelectedArea(selectedArea);
				selectionFound = true;
			}
			return selectionFound;
		}
	}

	async function processPage(options) {
		singlefile.ui.init();
		const processor = new SingleFileClass(options);
		const preInitializationPromises = [];
		options.insertSingleFileComment = true;
		options.insertFaviconLink = true;
		if (!options.removeFrames && this.frameTree) {
			preInitializationPromises.push(frameTree.getAsync(options));
		}
		if (options.lazyLoadImages) {
			preInitializationPromises.push(lazyLoader.process());
		}
		options.doc = document;
		options.win = window;
		let index = 0, maxIndex = 0;
		options.onprogress = event => {
			if (event.type == event.RESOURCES_INITIALIZED) {
				maxIndex = event.details.max;
			}
			if (event.type == event.RESOURCES_INITIALIZED || event.type == event.RESOURCE_LOADED) {
				if (event.type == event.RESOURCE_LOADED) {
					index++;
				}
				browser.runtime.sendMessage({ processProgress: true, index, maxIndex, options: { autoSave: false } });
				if (options.shadowEnabled) {
					singlefile.ui.onprogress(index, maxIndex);
				}
			} else if (event.type == event.PAGE_ENDED) {
				browser.runtime.sendMessage({ processEnd: true, options: { autoSave: false } });
			}
		};
		[options.framesData] = await Promise.all(preInitializationPromises);
		await processor.initialize();
		await processor.preparePageData();
		const page = await processor.getPageData();
		if (options.selected) {
			unmarkSelectedContent();
		}
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

	function markSelectedContent() {
		const selection = getSelection();
		const range = selection.rangeCount ? selection.getRangeAt(0) : null;
		let selectionFound = false;
		if (range && range.commonAncestorContainer) {
			const treeWalker = document.createTreeWalker(range.commonAncestorContainer);
			const ancestorElement = range.commonAncestorContainer != Node.ELEMENT_NODE ? range.commonAncestorContainer.parentElement : range.commonAncestorContainer;
			while (treeWalker.nextNode() && treeWalker.currentNode != range.endContainer) {
				if (treeWalker.currentNode == range.startContainer) {
					selectionFound = true;
				}
				if (selectionFound) {
					const element = treeWalker.currentNode.nodeType == Node.ELEMENT_NODE ? treeWalker.currentNode : treeWalker.currentNode.parentElement;
					element.setAttribute(SingleFileClass.SELECTED_CONTENT_ATTRIBUTE_NAME, "");
				}
			}
			if (selectionFound) {
				ancestorElement.setAttribute(SingleFileClass.SELECTED_CONTENT_ROOT_ATTRIBUTE_NAME, "");
			}
		}
		return selectionFound;
	}

	function markSelectedArea(selectedAreaElement) {
		selectedAreaElement.setAttribute(SingleFileClass.SELECTED_CONTENT_ROOT_ATTRIBUTE_NAME, "");
		selectedAreaElement.querySelectorAll("*").forEach(element => element.setAttribute(SingleFileClass.SELECTED_CONTENT_ATTRIBUTE_NAME, ""));
	}

	function unmarkSelectedContent() {
		document.querySelectorAll("[" + SingleFileClass.SELECTED_CONTENT_ATTRIBUTE_NAME + "]").forEach(selectedContent => selectedContent.removeAttribute(SingleFileClass.SELECTED_CONTENT_ATTRIBUTE_NAME));
		document.querySelectorAll("[" + SingleFileClass.SELECTED_CONTENT_ROOT_ATTRIBUTE_NAME + "]").forEach(selectedContent => selectedContent.removeAttribute(SingleFileClass.SELECTED_CONTENT_ROOT_ATTRIBUTE_NAME));
	}

	async function downloadPage(page, options) {
		if (options.backgroundSave) {
			const response = await browser.runtime.sendMessage({ download: true, url: page.url, confirmFilename: options.confirmFilename, filename: page.filename });
			if (response.notSupported) {
				const response = await browser.runtime.sendMessage({ download: true, content: page.content, confirmFilename: options.confirmFilename, filename: page.filename });
				if (response.notSupported) {
					downloadPageFallback(page, options);
				}
			} else {
				URL.revokeObjectURL(page.url);
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
			URL.revokeObjectURL(page.url);
		}
	}

})();