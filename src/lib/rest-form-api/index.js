/*
 * Copyright 2010-2024 Gildas Lormeau
 * contact : gildas.lormeau <at> gmail.com
 * author: gildas.lormeau <at> gmail.com
 * author: dcardin2007 <at> gmail.com
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

/* global fetch, Blob, AbortController, FormData */

const AUTHORIZATION_HEADER = "Authorization";
const BEARER_PREFIX_AUTHORIZATION = "Bearer ";
const ACCEPT_HEADER = "Accept";
const CONTENT_TYPE = "application/json";

export { RestFormApi };

class RestFormApi {
	constructor(token, restApiUrl, fileFieldName, urlFieldName) {
		this.headers = new Map([
			[AUTHORIZATION_HEADER, BEARER_PREFIX_AUTHORIZATION + token],
			[ACCEPT_HEADER, CONTENT_TYPE]
		]);
		this.restApiUrl = restApiUrl;
		this.fileFieldName = fileFieldName;
		this.urlFieldName = urlFieldName;
	}

	async upload(filename, content, url) {
		this.controller = new AbortController();
		const blob = content instanceof Blob ? content : new Blob([content], { type: "text/html" });
		let formData = new FormData();
		if (this.fileFieldName) {
			formData.append(this.fileFieldName, blob, filename);
		}
		if (this.urlFieldName) {
			formData.append(this.urlFieldName, url);
		}
		const response = await fetch(this.restApiUrl, {
			method: "POST",
			body: formData,
			headers: this.headers,
			signal: this.controller.signal
		});
		if ([200, 201].includes(response.status)) {
			return response.json();
		} else {
			throw new Error(await response.text());
		}
	}

	abort() {
		if (this.controller) {
			this.controller.abort();
		}
	}
}
