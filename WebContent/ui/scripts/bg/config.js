/*
 * Copyright 2011 Gildas Lormeau
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

(function() {

	singlefile.config = {};

	singlefile.config.set = function(config) {
		localStorage.config = JSON.stringify(config);
	};

	singlefile.config.get = function() {
		return localStorage.config ? JSON.parse(localStorage.config) : {
			removeFrames : false,
			removeScripts : true,
			removeObjects : true,
			removeHidden : false,
			removeUnusedCSSRules : false,
			processInBackground : true,
			maxFrameSize : 2,
			displayProcessedPage : false,
			getContent : true,
			getRawDoc : false,
			displayInContextMenu : true,
			sendToPageArchiver : false,
			displayBanner : true
		};
	};

	singlefile.config.reset = function() {
		delete localStorage.config;
	};

	// migration 0.3.6 -> 0.3.7
	if (localStorage.config) {
		var conf = singlefile.config.get();
		if (typeof conf.displayNotification != "undefined") {
			if (conf.displayNotification) {
				conf.displayBanner = true;
			}
			delete conf.displayNotification;
			singlefile.config.set(conf);
		}
	}

	// migration 0.3.9 -> 0.3.10
	if (localStorage.config) {
		var conf = singlefile.config.get();
		if (typeof conf.maxFrameSize == "undefined") {
			conf.maxFrameSize = 2;
			singlefile.config.set(conf);
		}
	}

})();
