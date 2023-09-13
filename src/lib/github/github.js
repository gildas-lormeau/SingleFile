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

const CONFLICT_ACTION_SKIP = "skip";
const CONFLICT_ACTION_UNIQUIFY = "uniquify";
const CONFLICT_ACTION_OVERWRITE = "overwrite";
const CONFLICT_ACTION_PROMPT = "prompt";

export { pushGitHub };

let pendingPush;

async function pushGitHub(token, userName, repositoryName, branchName, path, content, { filenameConflictAction, prompt }) {
	while (pendingPush) {
		await pendingPush;
	}
	const controller = new AbortController();
	pendingPush = (async () => {
		try {
			await createContent({ path, content }, controller.signal);
		} finally {
			pendingPush = null;
		}
	})();
	return {
		url: `https://github.com/${userName}/${repositoryName}/blob/${branchName}/${path}`,
		cancelPush: () => controller.abort(),
		pushPromise: pendingPush
	};

	async function createContent({ path, content, message = "", sha }, signal) {
		const headers = new Map([
			["Authorization", `Bearer ${token}`],
			["Accept", "application/vnd.github+json"],
			["X-GitHub-Api-Version", "2022-11-28"]
		]);
		try {
			const response = await fetchContentData("PUT", JSON.stringify({ content: btoa(unescape(encodeURIComponent(content))), message, branch: branchName, sha }));
			const responseData = await response.json();
			if (response.status == 422) {
				if (filenameConflictAction == CONFLICT_ACTION_OVERWRITE) {
					const response = await fetchContentData();
					const responseData = await response.json();
					const sha = responseData.sha;
					return createContent({ path, content, message, sha }, signal);
				} else if (filenameConflictAction == CONFLICT_ACTION_UNIQUIFY) {
					let pathWithoutExtension = path;
					let extension = "";
					const dotIndex = path.lastIndexOf(".");
					if (dotIndex > -1) {
						pathWithoutExtension = path.substring(0, dotIndex);
						extension = path.substring(dotIndex + 1);
					}
					let saved = false;
					let indexFilename = 1;
					while (!saved) {
						path = pathWithoutExtension + " (" + indexFilename + ")." + extension;
						const response = await fetchContentData();
						if (response.status == 404) {
							return createContent({ path, content, message }, signal);
						} else {
							indexFilename++;
						}
					}
				} else if (filenameConflictAction == CONFLICT_ACTION_SKIP) {
					return responseData;
				} else if (filenameConflictAction == CONFLICT_ACTION_PROMPT) {
					path = await prompt(path); 
					if (path) {
						return createContent({ path, content, message }, signal);
					} else {
						return responseData;
					}
				} else {
					throw new Error("File already exists");
				}
			}
			if (response.status < 400) {
				return responseData;
			} else {
				throw new Error(responseData.message);
			}
		} catch (error) {
			if (error.name != "AbortError") {
				throw error;
			}
		}

		function fetchContentData(method = "GET", body) {
			return fetch(`https://api.github.com/repos/${userName}/${repositoryName}/contents/${path}`, {
				method,
				headers,
				body,
				signal
			});
		}
	}
}