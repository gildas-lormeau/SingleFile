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

/* global require */

const fs = require("fs");

const SingleFile = require("../node-index.js").webdriver;

SingleFile.getPageData({
	url: "https://github.com/gildas-lormeau/SingleFile",
	// userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Gecko Firefox AppleWebKit (KHTML, like Gecko) Chrome Safari",
	removeHiddenElements: true,
	removeUnusedStyles: true,
	removeUnusedFonts: true,
	loadDeferredImages: true,
	removeImports: true,
	removeScripts: true,
	compressHTML: true,
	compressCSS: true,
	filenameTemplate: "{page-title} ({date-iso} {time-locale}).html",
	removeAudioSrc: true,
	removeVideoSrc: true,
	removeAlternativeFonts: true,
	removeAlternativeMedias: true,
	removeAlternativeImages: true,
	groupDuplicateImages: true
}).then(pageData => fs.writeFileSync(pageData.filename, pageData.content));