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

/* global browser, document, window, location, setTimeout */

this.singlefile.extension.core.content.main = this.singlefile.extension.core.content.main || (() => {

	const singlefile = this.singlefile;
	const MOZ_EXTENSION_PROTOCOL = "moz-extension:";

	let ui, processing = false, processor;

	singlefile.lib.main.init({
		fetch: singlefile.extension.lib.fetch.content.resources.fetch,
		frameFetch: singlefile.extension.lib.fetch.content.resources.frameFetch
	});
	browser.runtime.onMessage.addListener(message => {
		if (message.method == "content.save" || message.method == "content.cancelSave") {
			return onMessage(message);
		}
	});
	return {};

	async function onMessage(message) {
		if (!ui) {
			ui = singlefile.extension.ui.content.main;
		}
		if (!location.href.startsWith(MOZ_EXTENSION_PROTOCOL)) {
			if (message.method == "content.save") {
				await savePage(message);
				return {};
			}
			if (message.method == "content.cancelSave") {
				if (processor) {
					processor.cancel();
					ui.onEndPage();
					browser.runtime.sendMessage({ method: "ui.processCancelled" });
				}
				return {};
			}
		}
	}

	async function savePage(message) {
		const options = message.options;
		if (!processing) {
			options.updatedResources = singlefile.extension.core.content.updatedResources || {};
			Object.keys(options.updatedResources).forEach(url => options.updatedResources[url].retrieved = false);
			let selectionFound;
			if (options.selected || options.optionallySelected) {
				selectionFound = await ui.markSelection(options.optionallySelected);
			}
			if (options.optionallySelected && selectionFound) {
				options.selected = true;
			}
			if (!options.selected || selectionFound) {
				processing = true;
				try {
					const pageData = await processPage(options);
					if (pageData) {
						if (((!options.backgroundSave && !options.saveToClipboard) || options.saveToGDrive) && options.confirmFilename) {
							pageData.filename = ui.prompt("Save as", pageData.filename) || pageData.filename;
						}
						await singlefile.extension.core.content.download.downloadPage(pageData, options);
					}
				} catch (error) {
					if (!processor.cancelled) {
						console.error(error); // eslint-disable-line no-console
						browser.runtime.sendMessage({ method: "ui.processError", error });
					}
				}
			} else {
				browser.runtime.sendMessage({ method: "ui.processCancelled" });
			}
			processing = false;
		}
	}

	async function processPage(options) {
		const frames = singlefile.lib.processors.frameTree.content.frames;
		singlefile.lib.helper.initDoc(document);
		ui.onStartPage(options);
		processor = new singlefile.lib.SingleFile(options);
		const preInitializationPromises = [];
		options.insertSingleFileComment = true;
		if (!options.saveRawPage) {
			if (!options.removeFrames && frames && window.frames && window.frames.length) {
				let frameTreePromise;
				if (options.loadDeferredImages) {
					frameTreePromise = new Promise(resolve => setTimeout(() => resolve(frames.getAsync(options)), options.loadDeferredImagesMaxIdleTime - frames.TIMEOUT_INIT_REQUEST_MESSAGE));
				} else {
					frameTreePromise = frames.getAsync(options);
				}
				ui.onLoadingFrames(options);
				frameTreePromise.then(() => {
					if (!processor.cancelled) {
						ui.onLoadFrames(options);
					}
				});
				preInitializationPromises.push(frameTreePromise);
			}
			if (options.loadDeferredImages) {
				const lazyLoadPromise = singlefile.lib.processors.lazy.content.loader.process(options);
				ui.onLoadingDeferResources(options);
				lazyLoadPromise.then(() => {
					if (!processor.cancelled) {
						ui.onLoadDeferResources(options);
					}
				});
				preInitializationPromises.push(lazyLoadPromise);
			}
		}
		let index = 0, maxIndex = 0;
		options.onprogress = event => {
			if (!processor.cancelled) {
				if (event.type == event.RESOURCES_INITIALIZED) {
					maxIndex = event.detail.max;
				}
				if (event.type == event.RESOURCES_INITIALIZED || event.type == event.RESOURCE_LOADED) {
					if (event.type == event.RESOURCE_LOADED) {
						index++;
					}
					browser.runtime.sendMessage({ method: "ui.processProgress", index, maxIndex });
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
					} else if (event.type == event.STAGE_TASK_STARTED) {
						ui.onStartStageTask(event.detail.step, event.detail.task);
					} else if (event.type == event.STAGE_TASK_ENDED) {
						ui.onEndStageTask(event.detail.step, event.detail.task);
					}
				}
			}
		};
		[options.frames] = await new Promise(async resolve => {
			const preInitializationAllPromises = Promise.all(preInitializationPromises);
			const cancelProcessor = processor.cancel.bind(processor);
			processor.cancel = function () {
				cancelProcessor();
				resolve([[]]);
			};
			await preInitializationAllPromises;
			resolve(preInitializationAllPromises);
		});
		const selectedFrame = options.frames && options.frames.find(frameData => frameData.requestedFrame);
		options.win = window;
		if (selectedFrame) {
			options.content = selectedFrame.content;
			options.url = selectedFrame.baseURI;
			options.canvases = selectedFrame.canvases;
			options.fonts = selectedFrame.fonts;
			options.stylesheets = selectedFrame.stylesheets;
			options.images = selectedFrame.images;
			options.posters = selectedFrame.posters;
			options.usedFonts = selectedFrame.usedFonts;
			options.shadowRoots = selectedFrame.shadowRoots;
			options.imports = selectedFrame.imports;
		} else {
			options.doc = document;
		}
		if (!processor.cancelled) {
			await processor.run();
		}
		if (!options.saveRawPage && !options.removeFrames && frames) {
			frames.cleanup(options);
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

})();