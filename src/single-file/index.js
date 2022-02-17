/*
 * Copyright 2010-2020 Gildas Lormeau
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

/* global globalThis */

import * as processors from "./processors/index.js";
import * as vendor from "./vendor/index.js";
import * as modules from "./modules/index.js";
import * as core from "./single-file-core.js";
import * as helper from "./single-file-helper.js";
import * as util from "./single-file-util.js";

let SingleFile;
export {
	init,
	getPageData,
	processors,
	vendor,
	modules,
	helper,
	SingleFile
};

function init(initOptions) {
	SingleFile = core.getClass(util.getInstance(initOptions), vendor.cssTree);
}

async function getPageData(options = {}, initOptions, doc = globalThis.document, win = globalThis) {
	const frames = processors.frameTree;
	let framesSessionId;
	init(initOptions);
	if (doc && win) {
		helper.initDoc(doc);
		const preInitializationPromises = [];
		if (!options.saveRawPage) {
			if (!options.removeFrames && frames && globalThis.frames && globalThis.frames.length) {
				let frameTreePromise;
				if (options.loadDeferredImages) {
					frameTreePromise = new Promise(resolve => globalThis.setTimeout(() => resolve(frames.getAsync(options)), options.loadDeferredImagesMaxIdleTime - frames.TIMEOUT_INIT_REQUEST_MESSAGE));
				} else {
					frameTreePromise = frames.getAsync(options);
				}
				preInitializationPromises.push(frameTreePromise);
			}
			if (options.loadDeferredImages) {
				preInitializationPromises.push(processors.lazy.process(options));
			}
		}
		[options.frames] = await Promise.all(preInitializationPromises);
		framesSessionId = options.frames && options.frames.sessionId;
	}
	options.doc = doc;
	options.win = win;
	options.insertCanonicalLink = true;
	options.onprogress = event => {
		if (event.type === event.RESOURCES_INITIALIZED && doc && win && options.loadDeferredImages) {
			processors.lazy.resetZoomLevel(options);
		}
	};
	const processor = new SingleFile(options);
	await processor.run();
	if (framesSessionId) {
		frames.cleanup(framesSessionId);
	}
	return await processor.getPageData();
}