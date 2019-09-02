/*
 * Copyright 2010-2019 Gildas Lormeau
 * contact : gildas.lormeau <at> gmail.com
 * 
 * This file is part of SingleFile.
 *
 *   The code in this file is free software: you can redistribute it and/or 
 *   modify it under the terms of the GNU Affero General Public License 
 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
 *   of the License, or (at your option) any later version.
 * 
 *   The code in this file is distributed in the hope that it will be useful, 
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
 *   General Public License for more details.
 *
 *   As additional permission under GNU AGPL version 3 section 7, you may 
 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
 *   AGPL normally required by section 4, provided you include this license 
 *   notice and a URL through which recipients can access the Corresponding 
 *   Source.
 */

/* global window */

this.singlefile = this.singlefile || {
	lib: {
		frameTree: {
			content: {}
		},
		hooks: {
			content: {}
		},
		lazy: {
			content: {}
		},
		vendor: {},
		modules: {},
		async initializeOptions(options = {}, doc = window.document, win = window) {
			this.helper.initDoc(doc);
			const preInitializationPromises = [];
			if (!options.saveRawPage) {
				if (!options.removeFrames) {
					preInitializationPromises.push(this.frameTree.content.frames.getAsync(options));
				}
				if (options.loadDeferredImages) {
					preInitializationPromises.push(this.lazy.content.loader.process(options));
				}
			}
			[options.frames] = await Promise.all(preInitializationPromises);
			options.doc = doc;
			options.win = win;
			return options;
		},
		async getPageData(options = {}, initOptions) {
			options.insertSingleFileComment = true;
			options.insertFaviconLink = true;
			this.main.init(initOptions);
			const singleFile = new this.SingleFile(options);
			await singleFile.run();
			return await singleFile.getPageData();
		}
	}
};