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

/* global fetch, btoa, Blob, FileReader, AbortController */

const EMPTY_STRING = "";
const CONFLICT_ACTION_SKIP = "skip";
const CONFLICT_ACTION_UNIQUIFY = "uniquify";
const CONFLICT_ACTION_OVERWRITE = "overwrite";
const CONFLICT_ACTION_PROMPT = "prompt";
const AUTHORIZATION_HEADER = "Authorization";
const BEARER_PREFIX_AUTHORIZATION = "Bearer ";
const ACCEPT_HEADER = "Accept";
const GITHUB_API_CONTENT_TYPE = "application/vnd.github+json";
const GITHUB_API_VERSION_HEADER = "X-GitHub-Api-Version";
const GITHUB_API_VERSION = "2022-11-28";
const EXTENSION_SEPARATOR = ".";
const INDEX_FILENAME_PREFIX = " (";
const INDEX_FILENAME_SUFFIX = ")";
const INDEX_FILENAME_REGEXP = /\s\((\d+)\)$/;
const ABORT_ERROR_NAME = "AbortError";
const GET_METHOD = "GET";
const PUT_METHOD = "PUT";
const GITHUB_URL = "https://github.com";
const GITHUB_API_URL = "https://api.github.com";
const BLOB_PATH = "blob";
const REPOS_PATH = "repos";
const CONTENTS_PATH = "contents";

export { GitHub };

let pendingPush;

class GitHub {
	constructor(token, userName, repositoryName, branch) {
		this.headers = new Map([
			[AUTHORIZATION_HEADER, BEARER_PREFIX_AUTHORIZATION + token],
			[ACCEPT_HEADER, GITHUB_API_CONTENT_TYPE],
			[GITHUB_API_VERSION_HEADER, GITHUB_API_VERSION]
		]);
		this.userName = userName;
		this.repositoryName = repositoryName;
		this.branch = branch;
	}

	async upload(path, content, options) {
		this.controller = new AbortController();
		options.signal = this.controller.signal;
		options.headers = this.headers;
		const base64Content = content instanceof Blob ? await blobToBase64(content) : btoa(unescape(encodeURIComponent(content)));
		return upload(this.userName, this.repositoryName, this.branch, path, base64Content, options);
	}

	abort() {
		if (this.controller) {
			this.controller.abort();
		}
	}
}

async function upload(userName, repositoryName, branch, path, content, options) {
	const { filenameConflictAction, prompt, signal, headers } = options;
	while (pendingPush) {
		await pendingPush;
	}
	try {
		pendingPush = await createContent({ path, content });
	} finally {
		pendingPush = null;
	}
	return {
		url: `${GITHUB_URL}/${userName}/${repositoryName}/${BLOB_PATH}/${branch}/${path}`
	};

	async function createContent({ path, content, message = EMPTY_STRING, sha }) {
		try {
			const response = await fetchContentData(PUT_METHOD, JSON.stringify({
				content,
				message,
				branch,
				sha
			}));
			const responseData = await response.json();
			if (response.status == 422) {
				if (filenameConflictAction == CONFLICT_ACTION_OVERWRITE) {
					const response = await fetchContentData(GET_METHOD);
					const responseData = await response.json();
					const sha = responseData.sha;
					return await createContent({ path, content, message, sha });
				} else if (filenameConflictAction == CONFLICT_ACTION_UNIQUIFY) {
					const { filenameWithoutExtension, extension, indexFilename } = splitFilename(path);
					options.indexFilename = indexFilename + 1;
					path = getFilename(filenameWithoutExtension, extension);
					return await createContent({ path, content, message });
				} else if (filenameConflictAction == CONFLICT_ACTION_SKIP) {
					return responseData;
				} else if (filenameConflictAction == CONFLICT_ACTION_PROMPT) {
					if (prompt) {
						path = await prompt(path);
						if (path) {
							return await createContent({ path, content, message });
						} else {
							return responseData;
						}
					} else {
						options.filenameConflictAction = CONFLICT_ACTION_UNIQUIFY;
						return await createContent({ path, content, message });
					}
				}
			}
			if (response.status < 400) {
				return responseData;
			} else {
				throw new Error(responseData.message);
			}
		} catch (error) {
			if (error.name != ABORT_ERROR_NAME) {
				throw error;
			}
		}

		function fetchContentData(method, body) {
			return fetch(`${GITHUB_API_URL}/${REPOS_PATH}/${userName}/${repositoryName}/${CONTENTS_PATH}/${path}`, {
				method,
				headers,
				body,
				signal
			});
		}
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
}

function blobToBase64(blob) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result.match(/^data:[^,]+,(.*)$/)[1]);
		reader.onerror = event => reject(event.detail);
		reader.readAsDataURL(blob);
	});
}