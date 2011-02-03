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

(function() {

	singlefile.nio = {};

	singlefile.nio.RequestManager = function() {
		var cache = {}, keys = [], pendingResponseHandlers = {};

		function sendResponses(key) {
			if (pendingResponseHandlers[key]) {
				pendingResponseHandlers[key].forEach(function(callback) {
					callback(cache[key]);
				});
				delete pendingResponseHandlers[key];
			}
		}

		function throwAwayHighOrderBytes(str) {
			var i, ret = [];
			for (i = 0; i < str.length; i++)
				ret[i] = String.fromCharCode(str.charCodeAt(i) & 0xff);
			return ret.join("");
		}

		this.reset = function() {
			cache = {};
			keys = [];
		};

		this.send = function(url, responseHandler, characterSet, mediaTypeParam) {
			var xhr, key = JSON.stringify({
				url : url,
				characterSet : characterSet,
				mediaTypeParam : mediaTypeParam
			}), resource = cache[key];

			if (resource)
				setTimeout(function() {
					responseHandler(resource);
				}, 1);
			else if (pendingResponseHandlers[key])
				pendingResponseHandlers[key].push(responseHandler);
			else {
				pendingResponseHandlers[key] = [ responseHandler ];
				xhr = new XMLHttpRequest();
				xhr.onreadystatechange = function() {
					if (xhr.readyState == 4) {
						cache[key] = {
							url : url,
							status : xhr.status,
							mediaType : xhr.getResponseHeader("Content-Type"),
							content : mediaTypeParam == "base64" ? btoa(throwAwayHighOrderBytes(xhr.responseText)) : xhr.responseText,
							mediaTypeParam : mediaTypeParam
						};
						keys.push(key);
						sendResponses(key);
					}
				};
				xhr.onerror = function() {
					sendResponses(key);
				};
				xhr.open("GET", url, true);
				if (characterSet)
					xhr.overrideMimeType('text/plain; charset=' + characterSet);
				try {
					xhr.send(null);
				} catch (e) {
					sendResponses(key);
				}
			}
		};
	};

})();