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

/* global browser, SingleFileBrowser, singlefile, frameTree, document, Blob, MouseEvent, getSelection, prompt, addEventListener, Node, window, lazyLoader, URL, timeout */

this.singlefile.top = this.singlefile.top || (() => {

	const MESSAGE_PREFIX = "__SingleFile__::";
	const SingleFile = SingleFileBrowser.getClass();

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
		singlefile.ui.onStartPage();
		const processor = new SingleFile(options);
		const preInitializationPromises = [];
		options.insertSingleFileComment = true;
		options.insertFaviconLink = true;
		if (!options.removeFrames && this.frameTree) {
			let frameTreePromise;
			if (options.lazyLoadImages) {
				frameTreePromise = new Promise(resolve => timeout.set(() => resolve(frameTree.getAsync(options)), options.maxLazyLoadImagesIdleTime - frameTree.TIMEOUT_INIT_REQUEST_MESSAGE));
			} else {
				frameTreePromise = frameTree.getAsync(options);
			}
			singlefile.ui.onLoadingFrames();
			frameTreePromise.then(() => singlefile.ui.onLoadFrames());
			preInitializationPromises.push(frameTreePromise);
		}
		if (options.lazyLoadImages && options.shadowEnabled) {
			const lazyLoadPromise = lazyLoader.process(options);
			singlefile.ui.onLoadingDeferResources();
			lazyLoadPromise.then(() => singlefile.ui.onLoadDeferResources());
			preInitializationPromises.push(lazyLoadPromise);
		}
		let index = 0, maxIndex = 0;
		options.onprogress = event => {
			if (event.type == event.RESOURCES_INITIALIZED) {
				maxIndex = event.detail.max;
			}
			if (event.type == event.RESOURCES_INITIALIZED || event.type == event.RESOURCE_LOADED) {
				if (event.type == event.RESOURCE_LOADED) {
					index++;
				}
				browser.runtime.sendMessage({ processProgress: true, index, maxIndex, options: { autoSave: false } });
				if (options.shadowEnabled) {
					singlefile.ui.onLoadResource(index, maxIndex);
				}
			} if (event.type == event.PAGE_ENDED) {
				browser.runtime.sendMessage({ processEnd: true, options: { autoSave: false } });
			} else if (options.shadowEnabled && !event.detail.frame) {
				if (event.type == event.PAGE_LOADING) {
					singlefile.ui.onPageLoading();
				} else if (event.type == event.PAGE_LOADED) {
					singlefile.ui.onLoadPage();
				} else if (event.type == event.STAGE_STARTED) {
					singlefile.ui.onStartStage(event.detail.step);
				} else if (event.type == event.STAGE_ENDED) {
					singlefile.ui.onEndStage(event.detail.step);
				} else if (event.type == event.STAGE_TASK_STARTED) {
					singlefile.ui.onStartStageTask(event.detail.step, event.detail.task);
				} else if (event.type == event.STAGE_TASK_ENDED) {
					if (event.detail.step < 3) {
						singlefile.ui.onEndStageTask(event.detail.step, event.detail.task);
					}
				}
			}
		};
		[options.framesData] = await Promise.all(preInitializationPromises);
		options.doc = document;
		options.win = window;
		await processor.initialize();
		await processor.run();
		if (options.confirmInfobar) {
			options.infobarContent = prompt("Infobar content", options.infobarContent) || "";
		}
		const page = await processor.getPageData();
		if (options.selected) {
			unmarkSelectedContent();
		}
		page.url = URL.createObjectURL(new Blob([page.content], { type: "text/html" }));
		if (options.shadowEnabled) {
			singlefile.ui.onEndPage();
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
					element.setAttribute(SingleFile.SELECTED_CONTENT_ATTRIBUTE_NAME, "");
				}
			}
			if (selectionFound) {
				ancestorElement.setAttribute(SingleFile.SELECTED_CONTENT_ROOT_ATTRIBUTE_NAME, "");
			}
		}
		return selectionFound;
	}

	function markSelectedArea(selectedAreaElement) {
		selectedAreaElement.setAttribute(SingleFile.SELECTED_CONTENT_ROOT_ATTRIBUTE_NAME, "");
		selectedAreaElement.querySelectorAll("*").forEach(element => element.setAttribute(SingleFile.SELECTED_CONTENT_ATTRIBUTE_NAME, ""));
	}

	function unmarkSelectedContent() {
		document.querySelectorAll("[" + SingleFile.SELECTED_CONTENT_ATTRIBUTE_NAME + "]").forEach(selectedContent => selectedContent.removeAttribute(SingleFile.SELECTED_CONTENT_ATTRIBUTE_NAME));
		document.querySelectorAll("[" + SingleFile.SELECTED_CONTENT_ROOT_ATTRIBUTE_NAME + "]").forEach(selectedContent => selectedContent.removeAttribute(SingleFile.SELECTED_CONTENT_ROOT_ATTRIBUTE_NAME));
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