/*
 * Copyright 2018 Gildas Lormeau
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

const SingleFileCore = require("./single-file-core");

// --------
// Download
// --------
const USER_AGENT = "Mozilla/5.0 (compatible; SingleFile Bot/1.0)";

const request = require("request-promise-native");
const dataUri = require("strong-data-uri");
const iconv = require("iconv-lite");
const http = require("http");
const https = require("https");

http.globalAgent.maxSockets = 5;
https.globalAgent.maxSockets = 5;

class Download {
	static async getContent(resourceURL, asDataURI) {
		const requestOptions = {
			method: "GET",
			uri: resourceURL,
			resolveWithFullResponse: true,
			encoding: null,
			headers: {
				"User-Agent": USER_AGENT
			}
		};
		let resourceContent;
		try {
			resourceContent = await request(requestOptions);
		} catch (e) {
			return asDataURI ? "data:base64," : "";
		}
		if (asDataURI) {
			try {
				return dataUri.encode(resourceContent.body, resourceContent.headers["content-type"]);
			} catch (e) {
				return "data:base64,";
			}
		} else {
			const matchCharset = resourceContent.headers["content-type"].match(/\s*;\s*charset\s*=\s*(.*)(;|$)/i);
			if (matchCharset && matchCharset[1]) {
				try {
					return iconv.decode(resourceContent.body, matchCharset[1]);
				} catch (e) {
					return resourceContent.body.toString("utf8");
				}
			} else {
				return resourceContent.body.toString("utf8");
			}
		}
	}
}

// ---
// URL
// ---
const url = require("url");

class URL {
	constructor(resourceUrl, baseURI) {
		this.href = url.resolve(baseURI, resourceUrl);
	}
}

// ---
// DOM
// ---
const jsdom = require("jsdom");

class DOM {
	static create(pageContent, url) {
		const dom = new jsdom.JSDOM(pageContent, { url, virtualConsole: new jsdom.VirtualConsole(), userAgent: USER_AGENT });
		return {
			DOMParser: dom.window.DOMParser,
			document: dom.window.document,
			serialize: () => dom.serialize()
		};
	}
}

module.exports = SingleFileCore(Download, DOM, URL);