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
	var STORAGE_SIZE = 1073741824, FILENAME_MAX_LENGTH = 256, BOM, fs;

	singlefile.storage = {};

	singlefile.storage.isEnabled = typeof requestFileSystem != "undefined" && typeof ArrayBuffer != "undefined" && typeof Uint8Array != "undefined";

	function init() {
		var view;
		if (!singlefile.storage.isEnabled)
			return;
		BOM = new ArrayBuffer(3);
		view = new Uint8Array(BOM);
		view.set([ 0xEF, 0xBB, 0xBF ]);
		requestFileSystem(true, STORAGE_SIZE, function(filesystem) {
			fs = filesystem;
			singlefile.storage.isEnabled = true;
		}, function(e) {
			singlefile.storage.isEnabled = false;
			console.log(e);
		});
	}

	singlefile.storage.addContent = function(name, content, maxLength, callback, index) {
		var suffix = (index ? " (" + (index + 1) + ")" : ""), max = maxLength - suffix.length, filename = (name.length > max - 6 ? name.substring(0, max - 6)
				+ "[...] " : name)
				+ suffix + ".html";
		if (fs) {
			fs.root.getFile(filename, {
				create : true,
				exclusive : true
			}, function(fileEntry) {
				fileEntry.createWriter(function(fileWriter) {
					var blobBuilder = new BlobBuilder();
					blobBuilder.append(BOM);
					blobBuilder.append(content);
					fileWriter.onerror = function(e) {
						callback(false, filename);
					};
					fileWriter.onwrite = function(e) {
						callback(true, filename);
					};
					fileWriter.write(blobBuilder.getBlob());
				}, function(e) {
					console.log(e);
					callback(false, filename);
				});
			}, function(e) {
				if (e.code == e.INVALID_MODIFICATION_ERR) {
					index = index || 0;
					index++;
					singlefile.storage.addContent(name, content, maxLength, callback, index);
				} else {
					console.log(e);
					callback(false, filename);
				}
			});
		} else
			callback(false, filename);
	};

	singlefile.storage.reset = function() {
		var rootReader;
		if (fs) {
			rootReader = fs.root.createReader("/");
			rootReader.readEntries(function(entries) {
				var i;
				for (i = 0; i < entries.length; i++)
					entries[i].remove();
			});
		}
	};

	init();

})();