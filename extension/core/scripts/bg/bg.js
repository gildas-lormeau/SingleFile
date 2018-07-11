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

/* global singlefile, FrameTree */

singlefile.core = (() => {

	const browser = this.browser || this.chrome;

	return {
		processTab(tab, processOptions = {}) {
			const options = singlefile.config.get();
			Object.keys(processOptions).forEach(key => options[key] = processOptions[key]);
			options.insertSingleFileComment = true;
			options.insertFaviconLink = true;
			if (options.removeFrames) {
				processStart(tab, options);
			} else {
				FrameTree.initialize(tab.id)
					.then(() => processStart(tab, options));
			}
		}
	};

	function processStart(tab, options) {
		browser.tabs.sendMessage(tab.id, { processStart: true, options });
	}

})();
