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

/* global fetch, btoa, AbortController */

const EMPTY_STRING = "";
const CONFLICT_ACTION_SKIP = "skip";
const CONFLICT_ACTION_UNIQUIFY = "uniquify";
const CONFLICT_ACTION_OVERWRITE = "overwrite";
const CONFLICT_ACTION_PROMPT = "prompt";
const BASIC_PREFIX_AUTHORIZATION = "Basic ";
const AUTHORIZATION_HEADER = "Authorization";
const AUTHORIZATION_SEPARATOR = ":";
const DIRECTORY_SEPARATOR = "/";
const EXTENSION_SEPARATOR = ".";
const ERROR_PREFIX_MESSAGE = "Error ";
const INDEX_FILENAME_PREFIX = " (";
const INDEX_FILENAME_SUFFIX = ")";
const INDEX_FILENAME_REGEXP = /\s\((\d+)\)$/;
const ABORT_ERROR_NAME = "AbortError";
const HEAD_METHOD = "HEAD";
const PUT_METHOD = "PUT";
const DELETE_METHOD = "DELETE";
const PROPFIND_METHOD = "PROPFIND";
const MKCOL_METHOD = "MKCOL";
const CONTENT_TYPE_HEADER = "Content-Type";
const HTML_CONTENT_TYPE = "text/html";
const CREDENTIALS_PARAMETER = "omit";
const FOUND_STATUS = 200;
const CREATED_STATUS = 201;
const NOT_FOUND_STATUS = 404;
const MIN_ERROR_STATUS = 400;

export {
	WebDAV
};

class WebDAV {
	constructor(url, username, password) {
		if (!url.endsWith(DIRECTORY_SEPARATOR)) {
			url += DIRECTORY_SEPARATOR;
		}
		this.url = url;
		this.authorization = BASIC_PREFIX_AUTHORIZATION + btoa(username + AUTHORIZATION_SEPARATOR + password);
	}

	upload(filename, content, options) {
		this.controller = new AbortController();
		options.signal = this.controller.signal;
		options.authorization = this.authorization;
		options.url = this.url;
		return upload(filename, content, options);
	}

	abort() {
		if (this.controller) {
			this.controller.abort();
		}
	}
}

async function upload(filename, content, options) {
	const { authorization, filenameConflictAction, prompt, signal, preventRetry } = options;
	let { url } = options;
	try {
		if (filenameConflictAction == CONFLICT_ACTION_OVERWRITE) {
			let response = await sendRequest(filename, PUT_METHOD, content);
			if (response.status == CREATED_STATUS) {
				return response;
			} else if (response.status >= MIN_ERROR_STATUS) {
				response = await sendRequest(filename, DELETE_METHOD);
				if (response.status >= MIN_ERROR_STATUS) {
					throw new Error(ERROR_PREFIX_MESSAGE + response.status);
				}
				return await upload(filename, content, options);
			}
		} else {
			let response = await sendRequest(filename, HEAD_METHOD);
			if (response.status == FOUND_STATUS) {
				if (filenameConflictAction == CONFLICT_ACTION_UNIQUIFY || (filenameConflictAction == CONFLICT_ACTION_PROMPT && !prompt)) {
					const { filenameWithoutExtension, extension, indexFilename } = splitFilename(filename);
					options.indexFilename = indexFilename + 1;
					return await upload(getFilename(filenameWithoutExtension, extension), content, options);
				} else if (filenameConflictAction == CONFLICT_ACTION_PROMPT) {
					filename = await prompt(filename);
					return filename ? upload(filename, content, options) : response;
				} else if (filenameConflictAction == CONFLICT_ACTION_SKIP) {
					return response;
				}
			} else if (response.status == NOT_FOUND_STATUS) {
				response = await sendRequest(filename, PUT_METHOD, content);
				if (response.status >= MIN_ERROR_STATUS && !preventRetry) {
					if (filename.includes(DIRECTORY_SEPARATOR)) {
						await createDirectories();
						options.preventRetry = true;
						return await upload(filename, content, options);
					} else {
						throw new Error(ERROR_PREFIX_MESSAGE + response.status);
					}
				} else {
					return response;
				}
			} else if (response.status >= MIN_ERROR_STATUS) {
				throw new Error(ERROR_PREFIX_MESSAGE + response.status);
			}
		}
	} catch (error) {
		if (error.name != ABORT_ERROR_NAME) {
			throw error;
		}
	}

	function sendRequest(path, method, body) {
		const headers = {
			[AUTHORIZATION_HEADER]: authorization
		};
		if (body) {
			headers[CONTENT_TYPE_HEADER] = HTML_CONTENT_TYPE;
		}
		return fetch(url + path, { method, headers, signal, body, credentials: CREDENTIALS_PARAMETER });
	}

	function splitFilename(filename) {
		let filenameWithoutExtension = filename;
		let extension = EMPTY_STRING;
		const indexExtensionSeparator = filename.lastIndexOf(EXTENSION_SEPARATOR);
		if (indexExtensionSeparator > -1) {
			filenameWithoutExtension = filename.substring(0, indexExtensionSeparator);
			extension = filename.substring(indexExtensionSeparator + 1);
		}
		let indexFilename;
		({ filenameWithoutExtension, indexFilename } = extractIndexFilename(filenameWithoutExtension));
		return { filenameWithoutExtension, extension, indexFilename };
	}

	function extractIndexFilename(filenameWithoutExtension) {
		const indexFilenameMatch = filenameWithoutExtension.match(INDEX_FILENAME_REGEXP);
		let indexFilename = 0;
		if (indexFilenameMatch && indexFilenameMatch.length > 1) {
			const parsedIndexFilename = Number(indexFilenameMatch[indexFilenameMatch.length - 1]);
			if (!Number.isNaN(parsedIndexFilename)) {
				indexFilename = parsedIndexFilename;
				filenameWithoutExtension = filenameWithoutExtension.replace(INDEX_FILENAME_REGEXP, EMPTY_STRING);
			}
		}
		return { filenameWithoutExtension, indexFilename };
	}

	function getFilename(filenameWithoutExtension, extension) {
		return filenameWithoutExtension +
			INDEX_FILENAME_PREFIX + options.indexFilename + INDEX_FILENAME_SUFFIX +
			(extension ? EXTENSION_SEPARATOR + extension : EMPTY_STRING);
	}

	async function createDirectories() {
		const filenameParts = filename.split(DIRECTORY_SEPARATOR);
		filenameParts.pop();
		let path = EMPTY_STRING;
		for (const filenamePart of filenameParts) {
			if (filenamePart) {
				path += filenamePart;
				const response = await sendRequest(path, PROPFIND_METHOD);
				if (response.status == NOT_FOUND_STATUS) {
					const response = await sendRequest(path, MKCOL_METHOD);
					if (response.status >= MIN_ERROR_STATUS) {
						throw new Error(ERROR_PREFIX_MESSAGE + response.status);
					}
				}
				path += DIRECTORY_SEPARATOR;
			}
		}
	}
}