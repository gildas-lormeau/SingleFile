/*
 * Copyright 2011 Gildas Lormeau
 * contact : gildas.lormeau <at> gmail.com
 * 
 * This file is part of SingleFile Core.
 *
 *   SingleFile Core is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU Lesser General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   SingleFile Core is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU Lesser General Public License for more details.
 *
 *   You should have received a copy of the GNU Lesser General Public License
 *   along with SingleFile Core.  If not, see <http://www.gnu.org/licenses/>.
 */

var wininfo = { //5. Called from core/scripts/bg/bgcore.js PageData
	init : function(tabId, callback) {
		chrome.extension.onMessage.addListener(function lid(message) {
			// console.log("wininfo.onMessage", tabId, message);
		    if (message.initResponse) { //9. Called from core/scripts/content/wininfo.js initResponse
		        callback(message.processableDocs); //follow action to core/scripts/bg/bgcore.js PageData
		        chrome.extension.onMessage.removeListener(lid);
		    }
		});
		chrome.tabs.sendMessage(tabId, { //follow action to core/scripts/content/wininfo.js onExtensionMessage
			initRequest : true,
			winId : "0",
			index : 0
		});
	}
};
