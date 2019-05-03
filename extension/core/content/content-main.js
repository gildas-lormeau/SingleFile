/*
 * Copyright 2010-2019 Gildas Lormeau
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

/* global browser, document, window, setTimeout */

this.singlefile.extension.core.content.main = this.singlefile.extension.core.content.main || (() => {

	const singlefile = this.singlefile;

	let ui;

	const MAX_CONTENT_SIZE = 64 * (1024 * 1024);
	const DOWNLOADER_FRAME_ID = "single-file-downloader";
	const SingleFile = singlefile.lib.SingleFile.getClass();

	let processing = false;

	browser.runtime.onMessage.addListener(async message => {
		if (!ui) {
			ui = singlefile.extension.ui.content.main;
		}
		if (message.method == "content.save") {
			await savePage(message);
			return {};
		}
	});
	return {};

	async function savePage(message) {
		const options = message.options;
		if (!processing) {
			let selectionFound;
			if (options.selected) {
				selectionFound = await ui.markSelection();
			}
			if (!options.selected || selectionFound) {
				processing = true;
				try {
					const page = await processPage(options);
					await downloadPage(page, options);
				} catch (error) {
					console.error(error); // eslint-disable-line no-console
					browser.runtime.sendMessage({ method: "ui.processError", error, options: {} });
				}
			} else {
				browser.runtime.sendMessage({ method: "ui.processCancelled", options: {} });
			}
			processing = false;
		}
	}

	async function processPage(options) {
		const frames = singlefile.lib.frameTree.content.frames;
		singlefile.lib.helper.initDoc(document);
		const iframe = document.getElementById(DOWNLOADER_FRAME_ID);
		if (iframe) {
			iframe.remove();
		}
		ui.onStartPage(options);
		const processor = new SingleFile(options);
		const preInitializationPromises = [];
		options.insertSingleFileComment = true;
		if (!options.saveRawPage) {
			if (!options.removeFrames && frames) {
				let frameTreePromise;
				if (options.loadDeferredImages) {
					frameTreePromise = new Promise(resolve => setTimeout(() => resolve(frames.getAsync(options)), options.loadDeferredImagesMaxIdleTime - frames.TIMEOUT_INIT_REQUEST_MESSAGE));
				} else {
					frameTreePromise = frames.getAsync(options);
				}
				ui.onLoadingFrames();
				frameTreePromise.then(() => ui.onLoadFrames());
				preInitializationPromises.push(frameTreePromise);
			}
			if (options.loadDeferredImages) {
				const lazyLoadPromise = singlefile.lib.lazy.content.loader.process(options);
				ui.onLoadingDeferResources();
				lazyLoadPromise.then(() => ui.onLoadDeferResources());
				preInitializationPromises.push(lazyLoadPromise);
			}
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
				browser.runtime.sendMessage({ method: "ui.processProgress", index, maxIndex, options: {} });
				ui.onLoadResource(index, maxIndex, options);
			} if (event.type == event.PAGE_ENDED) {
				browser.runtime.sendMessage({ method: "ui.processEnd", options: {} });
			} else if (!event.detail.frame) {
				if (event.type == event.PAGE_LOADING) {
					ui.onPageLoading();
				} else if (event.type == event.PAGE_LOADED) {
					ui.onLoadPage();
				} else if (event.type == event.STAGE_STARTED) {
					if (event.detail.step < 3) {
						ui.onStartStage(event.detail.step);
					}
				} else if (event.type == event.STAGE_ENDED) {
					if (event.detail.step < 3) {
						ui.onEndStage(event.detail.step);
					}
				} else if (event.type == event.STAGE_TASK_STARTED) {
					ui.onStartStageTask(event.detail.step, event.detail.task);
				} else if (event.type == event.STAGE_TASK_ENDED) {
					ui.onEndStageTask(event.detail.step, event.detail.task);
				}
			}
		};
		[options.framesData] = await Promise.all(preInitializationPromises);
		const selectedFrame = options.framesData && options.framesData.find(frameData => frameData.requestedFrame);
		options.win = window;
		if (selectedFrame) {
			options.content = selectedFrame.content;
			options.url = selectedFrame.baseURI;
			options.canvasData = selectedFrame.canvasData;
			options.fontsData = selectedFrame.fontsData;
			options.stylesheetsData = selectedFrame.stylesheetsData;
			options.imagesData = selectedFrame.imagesData;
			options.postersData = selectedFrame.postersData;
			options.usedFonts = selectedFrame.usedFonts;
			options.shadowRootsData = selectedFrame.shadowRootsData;
		} else {
			options.doc = document;
		}
		await processor.run();
		if (!options.saveRawPage && !options.removeFrames && frames) {
			frames.cleanup(options);
		}
		if (options.confirmInfobarContent) {
			options.infobarContent = ui.prompt("Infobar content", options.infobarContent) || "";
		}
		const page = await processor.getPageData();
		if (options.selected) {
			ui.unmarkSelection();
		}
		ui.onEndPage(options);
		if (options.displayStats) {
			console.log("SingleFile stats"); // eslint-disable-line no-console
			console.table(page.stats); // eslint-disable-line no-console
		}
		return page;
	}

	async function downloadPage(page, options) {
		if (options.backgroundSave) {
			for (let blockIndex = 0; blockIndex * MAX_CONTENT_SIZE < page.content.length; blockIndex++) {
				const message = { method: "downloads.download", confirmFilename: options.confirmFilename, filenameConflictAction: options.filenameConflictAction, filename: page.filename, saveToClipboard: options.saveToClipboard };
				message.truncated = page.content.length > MAX_CONTENT_SIZE;
				if (message.truncated) {
					message.finished = (blockIndex + 1) * MAX_CONTENT_SIZE > page.content.length;
					message.content = page.content.substring(blockIndex * MAX_CONTENT_SIZE, (blockIndex + 1) * MAX_CONTENT_SIZE);
				} else {
					message.content = page.content;
				}
				await browser.runtime.sendMessage(message);
			}
		} else {
			if (options.saveToClipboard) {
				saveToClipboard(page);
			} else {
				downloadPageForeground(page, options);
			}
		}
	}

	function downloadPageForeground(page, options) {
		if (options.confirmFilename) {
			page.filename = ui.prompt("File name", page.filename);
		}
		if (page.filename && page.filename.length) {
			const iframe = document.createElement("iframe");
			iframe.id = DOWNLOADER_FRAME_ID;
			iframe.style.setProperty("display", "inline-block", "important");
			iframe.style.setProperty("max-width", "0", "important");
			iframe.style.setProperty("max-height", "0", "important");
			iframe.style.setProperty("border-width", "0", "important");
			iframe.style.setProperty("margin", "0", "important");
			iframe.src = browser.runtime.getURL("/extension/core/pages/downloader.html");
			iframe.onload = () => iframe.contentWindow.postMessage(JSON.stringify([page.filename, page.content]), "*");
			document.body.appendChild(iframe);
		}
	}

	function saveToClipboard(page) {
		const command = "copy";
		document.addEventListener(command, listener);
		document.execCommand(command);
		document.removeEventListener(command, listener);

		function listener(event) {
			event.clipboardData.setData("text/html", page.content);
			event.clipboardData.setData("text/plain", page.content);
			event.preventDefault();
		}
	}

})();