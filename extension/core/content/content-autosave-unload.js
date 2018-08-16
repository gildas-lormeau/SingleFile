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

/* global browser, addEventListener, document, location, docHelper */

this.singlefile.autoSave = this.singlefile.autoSave || (() => {

	browser.runtime.sendMessage({ isAutoSaveUnloadEnabled: true }).then(isAutoSaveUnloadEnabled => {
		if (isAutoSaveUnloadEnabled) {
			addEventListener("unload", () => browser.runtime.sendMessage({ processContent: true, content: docHelper.serialize(document), url: location.href }));
		}
	});
	return true;

})();