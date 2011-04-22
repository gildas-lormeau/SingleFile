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
			processInBackground : false,
			displayProcessedPage : true,
			savePage : false,
			filenameMaxLength : 90,
			getContent : false,
			getRawDoc : false,
			displayInContextMenu : true
		};
	};

	singlefile.config.reset = function() {
		delete localStorage.config;
	};

	// migration 0.1 -> 0.2
	delete localStorage.options;
	
	// migration 0.2.26 -> 0.2.27
	if (localStorage.config) {
		var conf = singlefile.config.get();
		if (typeof conf.displayInContextMenu == "undefined") {
			conf.displayInContextMenu = true;
			singlefile.config.set(conf);
		}
			
	}

})();
