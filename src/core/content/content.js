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

/* global browser, document, location, setTimeout, URL, setInterval, clearInterval */

import * as download from "./../common/download.js";
import { fetch, frameFetch } from "./../../lib/single-file/fetch/content/content-fetch.js";
import * as ui from "./../../ui/content/content-ui.js";
import { onError, getOpenFileBar, openFile, setLabels } from "./../../ui/common/common-content-ui.js";
import * as yabson from "./../../lib/yabson/yabson.js";

const singlefile = globalThis.singlefile;
const bootstrap = globalThis.singlefileBootstrap;

const MOZ_EXTENSION_PROTOCOL = "moz-extension:";
const EMBEDDED_IMAGE_BUTTON_MESSAGE = browser.i18n.getMessage("topPanelEmbeddedImageButton");
const SHARE_PAGE_BUTTON_MESSAGE = browser.i18n.getMessage("topPanelSharePageButton");
const SHARE_SELECTION_BUTTON_MESSAGE = browser.i18n.getMessage("topPanelShareSelectionButton");
const ERROR_TITLE_MESSAGE = browser.i18n.getMessage("topPanelError");

let processor, processing, downloadParser, openFileInfobar, scrollY, transform, overflow;

setLabels({
	EMBEDDED_IMAGE_BUTTON_MESSAGE,
	SHARE_PAGE_BUTTON_MESSAGE,
	SHARE_SELECTION_BUTTON_MESSAGE,
	ERROR_TITLE_MESSAGE
});

if (!bootstrap || !bootstrap.initializedSingleFile) {
	singlefile.init({ fetch, frameFetch });
	browser.runtime.onMessage.addListener(message => {
		if (message.method == "content.save" ||
			message.method == "content.cancelSave" ||
			message.method == "content.download" ||
			message.method == "content.getSelectedLinks" ||
			message.method == "content.error" ||
			message.method == "content.prompt" ||
			message.method == "content.beginScrollTo" ||
			message.method == "content.scrollTo" ||
			message.method == "content.endScrollTo") {
			return onMessage(message);
		}
	});
	if (bootstrap) {
		bootstrap.initializedSingleFile = true;
	} else {
		globalThis.singlefileBootstrap = { initializedSingleFile: true };
	}
}

async function onMessage(message) {
	if (!location.href.startsWith(MOZ_EXTENSION_PROTOCOL)) {
		if (message.method == "content.save") {
			await savePage(message);
			return {};
		}
		if (message.method == "content.cancelSave") {
			if (processor) {
				processor.cancel();
				ui.onEndPage();
				if (openFileInfobar) {
					openFileInfobar.cancel();
					openFileInfobar = null;
				}
				browser.runtime.sendMessage({ method: "ui.processCancelled" });
			}
			if (message.options.loadDeferredImages) {
				singlefile.processors.lazy.resetZoomLevel(message.options);
			}
			return {};
		}
		if (message.method == "content.getSelectedLinks") {
			return {
				urls: ui.getSelectedLinks()
			};
		}
		if (message.method == "content.download") {
			if (!downloadParser) {
				downloadParser = yabson.getParser();
			}
			const result = await downloadParser.next(message.data);
			if (result.done) {
				downloadParser = null;
				try {
					await download.downloadPageForeground(result.value, {
						foregroundSave: result.value.foregroundSave,
						sharePage: result.value.sharePage,
					});
				} catch (error) {
					return {
						error: error && (error.message || error.toString())
					};
				} finally {
					await browser.runtime.sendMessage({ method: "downloads.end", taskId: result.value.taskId });
				}
			}
			return {};
		}
		if (message.method == "content.error") {
			onError(message.error, message.link);
			return {};
		}
		if (message.method == "content.prompt") {
			return ui.prompt(message.message, message.value);
		}
		if (message.method == "content.beginScrollTo") {
			scrollY = globalThis.scrollY;
			transform = document.documentElement.style.getPropertyValue("transform");
			overflow = document.documentElement.style.getPropertyValue("overflow");
			globalThis.scrollTo(0, 0);
			document.documentElement.style.setProperty("transform", "translateY(0px)");
			document.documentElement.style.setProperty("overflow", "hidden");
			return {};
		}
		if (message.method == "content.scrollTo") {
			document.documentElement.style.setProperty("transform", "translateY(-" + message.y + "px)");
			await new Promise(resolve => setTimeout(resolve, 500));
			return {};
		}
		if (message.method == "content.endScrollTo") {
			globalThis.scrollTo(0, scrollY);
			document.documentElement.style.setProperty("transform", transform);
			document.documentElement.style.setProperty("overflow", overflow);
			return {};
		}
	}
}

async function savePage(message) {
	const pingInterval = setInterval(() => {
		browser.runtime.sendMessage({ method: "ping" }).then(() => { });
	}, 15000);
	const options = message.options;
	let selectionFound;
	if (options.selected || options.optionallySelected) {
		selectionFound = await ui.markSelection(options.optionallySelected);
	}
	if (!processing && (!bootstrap || !bootstrap.pageInfo.processing)) {
		options.updatedResources = bootstrap ? bootstrap.pageInfo.updatedResources : {};
		options.visitDate = bootstrap ? bootstrap.pageInfo.visitDate : new Date();
		Object.keys(options.updatedResources).forEach(url => options.updatedResources[url].retrieved = false);
		if (options.optionallySelected && selectionFound) {
			options.selected = true;
		}
		if (!options.selected || selectionFound) {
			if (bootstrap) {
				bootstrap.pageInfo.processing = true;
			}
			processing = true;
			try {
				const pageData = await processPage(options);
				if (pageData) {
					await download.downloadPage(pageData, options);
				}
			} catch (error) {
				if (!processor.cancelled) {
					console.error(error); // eslint-disable-line no-console
					const errorMessage = error && (error.message || error.toString());
					browser.runtime.sendMessage({ method: "ui.processError", error: errorMessage });
					onError(errorMessage);
				}
			}
		} else {
			browser.runtime.sendMessage({ method: "ui.processCancelled" });
		}
		processing = false;
		if (bootstrap) {
			bootstrap.pageInfo.processing = false;
		}
	}
	clearInterval(pingInterval);
}

async function processPage(options) {
	const frames = singlefile.processors.frameTree;
	let framesSessionId;
	singlefile.helper.initDoc(document);
	ui.onStartPage(options);
	processor = new singlefile.SingleFile(options);
	const preInitializationPromises = [];
	options.insertCanonicalLink = true;
	let index = 0, maxIndex = 0, initializing;
	options.onprogress = async event => {
		const { options } = event.detail;
		if (!processor.cancelled) {
			if (event.type == event.RESOURCES_INITIALIZING) {
				if (!initializing && options.insertEmbeddedScreenshotImage && options.compressContent) {
					initializing = true;
					ui.setVisible(false);
					const screenshotBlobURI = await browser.runtime.sendMessage({
						method: "tabs.getScreenshot",
						width: document.documentElement.scrollWidth,
						height: document.documentElement.scrollHeight,
						innerHeight: globalThis.innerHeight
					});
					ui.setVisible(true);
					ui.onInsertingEmbeddedImage(options);
					options.embeddedImage = new Uint8Array(await (await fetch(screenshotBlobURI)).arrayBuffer());
					URL.revokeObjectURL(screenshotBlobURI);
					ui.onInsertEmbeddedImage(options);
				}
			}
			if (event.type == event.RESOURCES_INITIALIZED) {
				maxIndex = event.detail.max;
				if (options.loadDeferredImages) {
					singlefile.processors.lazy.resetZoomLevel(options);
				}
			}
			if (event.type == event.RESOURCES_INITIALIZED || event.type == event.RESOURCE_LOADED) {
				if (event.type == event.RESOURCE_LOADED) {
					index++;
				}
				await browser.runtime.sendMessage({ method: "ui.processProgress", index, maxIndex });
				ui.onLoadResource(index, maxIndex, options);
			} else if (!event.detail.frame) {
				if (event.type == event.PAGE_LOADING) {
					ui.onPageLoading();
				} else if (event.type == event.PAGE_LOADED) {
					ui.onLoadPage();
				} else if (event.type == event.STAGE_STARTED) {
					if (event.detail.step < 3) {
						ui.onStartStage(event.detail.step, options);
					}
				} else if (event.type == event.STAGE_ENDED) {
					if (event.detail.step < 3) {
						ui.onEndStage(event.detail.step, options);
					}
				}
			}
		}
	};
	const cancelProcessor = processor.cancel.bind(processor);
	if (options.insertEmbeddedImage && options.compressContent) {
		ui.onInsertingEmbeddedImage(options);
		openFileInfobar = getOpenFileBar();
		const cancelled = await openFileInfobar.display();
		if (!cancelled) {
			options.embeddedImage = await openFile({ accept: "image/*" });
			openFileInfobar.hide();
		}
		ui.onInsertEmbeddedImage(options);
	}
	if (!options.saveRawPage && !processor.cancelled) {
		let lazyLoadPromise;
		if (options.loadDeferredImages) {
			lazyLoadPromise = singlefile.processors.lazy.process(options);
			ui.onLoadingDeferResources(options);
			lazyLoadPromise.then(() => {
				if (!processor.cancelled) {
					ui.onLoadDeferResources(options);
				}
			});
			if (options.loadDeferredImagesBeforeFrames) {
				await lazyLoadPromise;
			}
		}
		if (!options.removeFrames && frames && globalThis.frames) {
			let frameTreePromise;
			if (options.loadDeferredImages) {
				frameTreePromise = new Promise(resolve => globalThis.setTimeout(() => resolve(frames.getAsync(options)), options.loadDeferredImagesBeforeFrames || !options.loadDeferredImages ? 0 : options.loadDeferredImagesMaxIdleTime));
			} else {
				frameTreePromise = frames.getAsync(options);
			}
			ui.onLoadingFrames(options);
			frameTreePromise.then(() => {
				if (!processor.cancelled) {
					ui.onLoadFrames(options);
				}
			});
			if (options.loadDeferredImagesBeforeFrames) {
				options.frames = await new Promise(resolve => {
					processor.cancel = function () {
						cancelProcessor();
						resolve([]);
					};
					frameTreePromise.then(resolve);
				});
			} else {
				preInitializationPromises.push(frameTreePromise);
			}
		}
		if (options.loadDeferredImages && !options.loadDeferredImagesBeforeFrames) {
			preInitializationPromises.push(lazyLoadPromise);
		}
	}
	if (!options.loadDeferredImagesBeforeFrames && !processor.cancelled) {
		[options.frames] = await new Promise(resolve => {
			const preInitializationAllPromises = Promise.all(preInitializationPromises);
			processor.cancel = function () {
				cancelProcessor();
				resolve([[]]);
			};
			preInitializationAllPromises.then(() => resolve(preInitializationAllPromises));
		});
	}
	if (options.delayBeforeProcessing) {
		await new Promise(resolve => setTimeout(resolve, options.delayBeforeProcessing * 1000));
	}
	framesSessionId = options.frames && options.frames.sessionId;
	const selectedFrame = options.frames && options.frames.find(frameData => frameData.requestedFrame);
	options.win = globalThis;
	if (selectedFrame) {
		options.content = selectedFrame.content;
		options.url = selectedFrame.baseURI;
		options.canvases = selectedFrame.canvases;
		options.fonts = selectedFrame.fonts;
		options.stylesheets = selectedFrame.stylesheets;
		options.images = selectedFrame.images;
		options.posters = selectedFrame.posters;
		options.videos = selectedFrame.videos;
		options.usedFonts = selectedFrame.usedFonts;
		options.shadowRoots = selectedFrame.shadowRoots;
		options.adoptedStyleSheets = selectedFrame.adoptedStyleSheets;
		options.worklets = selectedFrame.worklets;
	} else {
		options.doc = document;
	}
	if (!processor.cancelled) {
		await processor.run();
	}
	if (framesSessionId) {
		frames.cleanup(framesSessionId);
	}
	let page;
	if (!processor.cancelled) {
		if (options.confirmInfobarContent) {
			options.infobarContent = ui.prompt("Infobar content", options.infobarContent) || "";
		}
		page = await processor.getPageData();
		if (options.selected || options.optionallySelected) {
			ui.unmarkSelection();
		}
		ui.onEndPage();
		if (options.displayStats) {
			console.log("SingleFile stats"); // eslint-disable-line no-console
			console.table(page.stats); // eslint-disable-line no-console
		}
	}
	return page;
}