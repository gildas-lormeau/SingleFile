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

/* global singlefile, localStorage */

singlefile.config = (() => {

	if (localStorage.config) {
		const config = JSON.parse(localStorage.config);
		if (config.removeScripts === undefined) {
			config.removeScripts = true;
			localStorage.config = JSON.stringify(config);
		}
		if (config.compressHTML === undefined) {
			config.compressHTML = true;
			localStorage.config = JSON.stringify(config);
		}
		if (config.contextMenuEnabled == undefined) {
			config.contextMenuEnabled = true;
			localStorage.config = JSON.stringify(config);
		}
		if (config.appendSaveDate == undefined) {
			config.appendSaveDate = true;
			localStorage.config = JSON.stringify(config);
		}
	}

	return {
		set(config) {
			localStorage.config = JSON.stringify(config);
		},
		get() {
			return localStorage.config ? JSON.parse(localStorage.config) : {
				removeHidden: false,
				removeUnusedCSSRules: false,
				removeFrames: true,
				removeScripts: true,
				rawDocument: false,
				compressHTML: true,
				appendSaveDate: true
			};
		},
		reset() {
			delete localStorage.config;
		}
	};

})();
