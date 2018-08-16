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

/* global browser, window, addEventListener, document, location, docHelper */

this.singlefile.autoSave = this.singlefile.autoSave || (async () => {

	const [isAutoSaveUnloadEnabled, options] = await Promise.all([browser.runtime.sendMessage({ isAutoSaveUnloadEnabled: true }), browser.runtime.sendMessage({ getConfig: true })]);
	if (isAutoSaveUnloadEnabled) {
		addEventListener("unload", () => {
			const docData = docHelper.preProcessDoc(document, window, options);
			browser.runtime.sendMessage({ processContent: true, content: docHelper.serialize(document), canvasData: docData.canvasData, emptyStyleRulesText: docData.emptyStyleRulesText, url: location.href });
		});
	}

})();