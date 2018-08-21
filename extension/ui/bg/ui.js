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

/* global singlefile */

singlefile.ui = (() => {

	return {
		processTab
	};

	async function processTab(tab, options = {}) {
		const tabId = tab.id;
		try {
			singlefile.ui.button.onInitialize(tabId, options, 1);
			await singlefile.core.processTab(tab, options);
			singlefile.ui.button.onInitialize(tabId, options, 2);
		} catch (error) {
			console.log(error); // eslint-disable-line no-console
			singlefile.ui.button.onError(tabId, options);
		}
	}

})();