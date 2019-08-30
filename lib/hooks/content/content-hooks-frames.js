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

this.singlefile.lib.hooks.content.frames = this.singlefile.lib.hooks.content.frames || (() => {

	const LOAD_DEFERRED_IMAGES_START_EVENT = "single-file-load-deferred-images-start";
	const LOAD_DEFERRED_IMAGES_END_EVENT = "single-file-load-deferred-images-end";
	const BLOCK_COOKIES_START_EVENT = "single-file-block-cookies-start";
	const BLOCK_COOKIES_END_EVENT = "single-file-block-cookies-end";
	const BLOCK_STORAGE_START_EVENT = "single-file-block-storage-start";
	const BLOCK_STORAGE_END_EVENT = "single-file-block-storage-end";
	const LOAD_IMAGE_EVENT = "single-file-load-image";
	const IMAGE_LOADED_EVENT = "single-file-image-loaded";
	const NEW_FONT_FACE_EVENT = "single-file-new-font-face";

	const browser = this.browser;
	const addEventListener = window.addEventListener;
	const dispatchEvent = window.dispatchEvent;
	const CustomEvent = window.CustomEvent;
	const document = window.document;
	const HTMLDocument = window.HTMLDocument;

	const fontFaces = [];

	if (document instanceof HTMLDocument) {
		let scriptElement = document.createElement("script");
		if (browser && browser.runtime && browser.runtime.getURL) {
			scriptElement.src = browser.runtime.getURL("/lib/hooks/content/content-hooks-frames-web.js");
			scriptElement.async = false;
		} else if (this.singlefile.lib.getFileContent) {
			scriptElement.textContent = this.singlefile.lib.getFileContent("/lib/hooks/content/content-hooks-frames-web.js");
		}
		(document.documentElement || document).appendChild(scriptElement);
		scriptElement.remove();
		addEventListener.call(window, NEW_FONT_FACE_EVENT, event => fontFaces.push(event.detail));
	}

	return {
		getFontsData: () => fontFaces,
		loadDeferredImagesStart: options => {
			if (options.loadDeferredImagesBlockCookies) {
				dispatchEvent.call(window, new CustomEvent(BLOCK_COOKIES_START_EVENT));
			}
			if (options.loadDeferredImagesBlockStorage) {
				dispatchEvent.call(window, new CustomEvent(BLOCK_STORAGE_START_EVENT));
			}
			dispatchEvent.call(window, new CustomEvent(LOAD_DEFERRED_IMAGES_START_EVENT));
		},
		loadDeferredImagesEnd: options => {
			if (options.loadDeferredImagesBlockCookies) {
				dispatchEvent.call(window, new CustomEvent(BLOCK_COOKIES_END_EVENT));
			}
			if (options.loadDeferredImagesBlockStorage) {
				dispatchEvent.call(window, new CustomEvent(BLOCK_STORAGE_END_EVENT));
			}
			dispatchEvent.call(window, new CustomEvent(LOAD_DEFERRED_IMAGES_END_EVENT));
		},
		LOAD_IMAGE_EVENT,
		IMAGE_LOADED_EVENT
	};

})();