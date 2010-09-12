/*
 * Copyright 2010 Gildas Lormeau
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

(function(holder) {
	var port = chrome.extension.connect(), extId = "__SingleFile__";

	holder.init(document, {
		addListener : function(onMessage) {
			port.onMessage.addListener(onMessage);
		},
		postMessage : function(message) {
			port.postMessage(message);
		}
	}, {
		addListener : function(onMessage) {
			window.addEventListener("message", function(event) {
				var data = event.data;
				if (data.indexOf(extId + '::') == 0)
					onMessage(JSON.parse(data.substr(extId.length + 2)));
			}, false);
		},
		postMessageToFrames : function(frameSelector, messageFn, params) {
			var execute = function(id, selector, fnStr, fnParamsStr) {
				var i, frameElements = document.querySelectorAll(selector), fn = eval("(" + fnStr + ")");
				for (i = 0; i < frameElements.length; i++)
					frameElements[i].contentWindow.postMessage(id + "::" + JSON.stringify(fn(i, JSON.parse(fnParamsStr))), "*");
			};
			location.href = "javascript:(" + execute.toString() + ")('" + extId + "','" + frameSelector + "','" + messageFn.toString() + "','"
					+ JSON.stringify(params) + "')";
		},
		postMessageToParent : function(message) {
			var msg = extId + "::" + JSON.stringify(message);
			location.href = "javascript:parent.postMessage('" + msg + "', '*')";
		}
	});
})(singlefile);