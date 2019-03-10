/*
 * Copyright 2010-2019 Gildas Lormeau
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

/* global browser, window, top, document, docHelper */

this.singlefile.frame = this.singlefile.frame || (() => {

	if (window != top) {
		browser.runtime.onMessage.addListener(message => {
			if (message.saveFrame) {
				message.options.content = docHelper.serialize(document);
				delete message.saveFrame;
				delete message.options.frameId;
				message.savePage = true;
				message.options.url = document.location.href;
				if (this.browser && browser.runtime && browser.runtime.sendMessage) {
					browser.runtime.sendMessage(message);
				} else {
					top.postMessage("__SingleFile__::" + JSON.stringify(message), "*");
				}
			}
		});
	}
	return true;

})();
