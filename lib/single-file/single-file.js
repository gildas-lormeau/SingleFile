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

this.singlefile.lib.SingleFile = this.singlefile.lib.SingleFile || (() => {

	const SELECTED_CONTENT_ATTRIBUTE_NAME = "data-single-file-selected-content";

	const singlefile = this.singlefile;

	const modules = {
		helper: singlefile.lib.helper,
		srcsetParser: singlefile.lib.vendor.srcsetParser,
		cssMinifier: singlefile.lib.vendor.cssMinifier,
		htmlMinifier: singlefile.lib.modules.htmlMinifier,
		serializer: singlefile.lib.modules.serializer,
		fontsMinifier: singlefile.lib.modules.fontsMinifier,
		fontsAltMinifier: singlefile.lib.modules.fontsAltMinifier,
		cssRulesMinifier: singlefile.lib.modules.cssRulesMinifier,
		matchedRules: singlefile.lib.modules.matchedRules,
		mediasAltMinifier: singlefile.lib.modules.mediasAltMinifier,
		imagesAltMinifier: singlefile.lib.modules.imagesAltMinifier
	};

	return {
		SELECTED_CONTENT_ATTRIBUTE_NAME,
		getClass: classOptions => {
			const SingleFile = singlefile.lib.core.getClass(singlefile.lib.util.getInstance(modules, classOptions), singlefile.lib.vendor.cssTree, SELECTED_CONTENT_ATTRIBUTE_NAME);
			return SingleFile;
		}
	};

})();