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

/* global browser, singlefile, FrameTree */

singlefile.core = (() => {

	const TIMEOUT_PROCESS_START_MESSAGE = 3000;

	return {
		async processTab(tab, processOptions = {}) {
			const options = await singlefile.config.get();
			Object.keys(processOptions).forEach(key => options[key] = processOptions[key]);
			options.insertSingleFileComment = true;
			options.insertFaviconLink = true;
			return new Promise(async (resolve, reject) => {
				const errorTimeout = setTimeout(reject, TIMEOUT_PROCESS_START_MESSAGE);
				try {
					await processStart(tab, options);
				} catch (error) {
					reject(error);
				}
				clearTimeout(errorTimeout);
				resolve();
			});
		}
	};

	async function processStart(tab, options) {
		if (!options.removeFrames) {
			await FrameTree.initialize(tab.id);
		}
		if (options.frameId) {
			await browser.tabs.sendMessage(tab.id, { processStart: true, options }, { frameId: options.frameId });
		} else {
			await browser.tabs.sendMessage(tab.id, { processStart: true, options });
		}
	}

})();
