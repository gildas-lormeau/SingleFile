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

/* global browser, SingleFile, singlefile, Blob */

singlefile.processor = (() => {

	browser.runtime.onMessage.addListener((request, sender) => {
		if (request.saveContent) {
			saveContent(request, sender.tab.id, sender.tab.incognito);
		}
	});
	return true;

	async function saveContent(message, tabId, incognito) {
		const options = await singlefile.config.get();
		options.content = message.content;
		options.url = message.url;
		options.framesData = message.framesData;
		options.canvasData = message.canvasData;
		options.fontsData = message.fontsData;
		options.stylesheetContents = message.stylesheetContents;
		options.responsiveImageData = message.responsiveImageData;
		options.imageData = message.imageData;
		options.postersData = message.postersData;
		options.insertSingleFileComment = true;
		options.insertFaviconLink = true;
		options.backgroundTab = true;
		options.autoSave = true;
		options.incognito = incognito;
		options.tabId = tabId;
		options.sessionId = 0;
		let index = 0, maxIndex = 0;
		options.onprogress = async event => {
			if (event.type == event.RESOURCES_INITIALIZED) {
				maxIndex = event.details.max;
				singlefile.ui.button.onProgress(tabId, index, maxIndex, { autoSave: true });
			}
			if (event.type == event.RESOURCE_LOADED) {
				index++;
				singlefile.ui.button.onProgress(tabId, index, maxIndex, { autoSave: true });
			} else if (event.type == event.PAGE_ENDED) {
				singlefile.ui.button.onEnd(tabId, { autoSave: true });
			}
		};
		const processor = new (SingleFile.getClass())(options);
		await processor.initialize();
		await processor.preparePageData();
		const page = await processor.getPageData();
		page.url = URL.createObjectURL(new Blob([page.content], { type: "text/html" }));
		return singlefile.download.downloadPage(page, options);
	}

})();
