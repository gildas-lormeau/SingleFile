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

/* global browser, fetch, crypto, TextEncoder, btoa */

const TOKEN_URL = "https://api.dropboxapi.com/oauth2/token";
const AUTH_URL = "https://www.dropbox.com/oauth2/authorize";
const REVOKE_ACCESS_URL = "https://api.dropboxapi.com/2/auth/token/revoke";
const DROPBOX_SEARCH_URL = "https://api.dropboxapi.com/2/files/search_v2";
const DROPBOX_UPLOAD_URL = "https://content.dropboxapi.com/2/files/upload_session/start";
const DROPBOX_APPEND_URL = "https://content.dropboxapi.com/2/files/upload_session/append_v2";
const DROPBOX_FINISH_URL = "https://content.dropboxapi.com/2/files/upload_session/finish";
const CONFLICT_ACTION_UNIQUIFY = "uniquify";
const CONFLICT_ACTION_OVERWRITE = "overwrite";
const CONFLICT_ACTION_SKIP = "skip";
const CONFLICT_ACTION_PROMPT = "prompt";
const ENCODED_CHARS = /[\u007f-\uffff]/g;

class Dropbox {
	constructor(clientId, clientKey) {
		this.clientId = clientId;
		this.clientKey = clientKey;
	}
	async auth(options = { interactive: true }) {
		if (options.code) {
			return authFromCode(this, options);
		}
		const state = generateState();
		const { verifier, challenge } = await generateCodeVerifier();
		this.codeVerifier = verifier;
		this.authURL = AUTH_URL +
			"?client_id=" + this.clientId +
			"&response_type=code" +
			"&token_access_type=offline" +
			"&state=" + state +
			"&code_challenge=" + challenge +
			"&code_challenge_method=S256" +
			"&redirect_uri=" + browser.identity.getRedirectURL();
		return initAuth(this, options, state);
	}
	setAuthInfo(authInfo) {
		if (authInfo) {
			this.accessToken = authInfo.accessToken;
			this.refreshToken = authInfo.refreshToken;
			this.expirationDate = authInfo.expirationDate;
		} else {
			delete this.accessToken;
			delete this.refreshToken;
			delete this.expirationDate;
		}
	}
	async refreshAuthToken() {
		if (this.refreshToken) {
			const httpResponse = await fetch(TOKEN_URL, {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: "client_id=" + this.clientId +
					"&refresh_token=" + this.refreshToken +
					"&grant_type=refresh_token" +
					"&client_secret=" + this.clientKey
			});
			if (httpResponse.status == 400) {
				throw new Error("unknown_token");
			}
			const response = await getJSON(httpResponse);
			this.accessToken = response.access_token;
			if (response.refresh_token) {
				this.refreshToken = response.refresh_token;
			}
			if (response.expires_in) {
				this.expirationDate = Date.now() + (response.expires_in * 1000);
			}
			return { accessToken: this.accessToken, refreshToken: this.refreshToken, expirationDate: this.expirationDate };
		} else {
			delete this.accessToken;
		}
	}
	async revokeAuthToken(accessToken) {
		if (accessToken) {
			const httpResponse = await fetch(REVOKE_ACCESS_URL, {
				method: "POST",
				headers: {
					"Authorization": "Bearer " + accessToken
				}
			});
			try {
				await httpResponse.text();
			}
			catch (error) {
				if (error.message != "invalid_token") {
					throw error;
				}
			}
			finally {
				delete this.accessToken;
				delete this.refreshToken;
				delete this.expirationDate;
			}
		}
	}
	async upload(filename, blob, options, setCancelCallback) {
		const uploader = new MediaUploader({
			token: this.accessToken,
			file: blob,
			filename,
			onProgress: options.onProgress,
			filenameConflictAction: options.filenameConflictAction,
			prompt: options.prompt
		});
		if (setCancelCallback) {
			setCancelCallback(() => uploader.cancelled = true);
		}
		await uploader.upload();
	}
}

class MediaUploader {
	constructor(options) {
		this.file = options.file;
		this.onProgress = options.onProgress;
		this.contentType = this.file.type || "application/octet-stream";
		this.metadata = {
			name: options.filename,
			mimeType: this.contentType
		};
		this.token = options.token;
		this.offset = 0;
		this.chunkSize = options.chunkSize || 8 * 1024 * 1024;
		this.filenameConflictAction = options.filenameConflictAction;
		this.prompt = options.prompt;
	}
	async upload() {
		const httpListResponse = getResponse(await fetch(DROPBOX_SEARCH_URL, {
			method: "POST",
			headers: {
				"Authorization": "Bearer " + this.token,
				"Content-Type": "application/json"
			},
			body: stringify({
				query: this.metadata.name,
				options: {
					filename: true
				}
			})
		}));
		const response = await getJSON(httpListResponse);
		if (response.matches.length) {
			if (this.filenameConflictAction == CONFLICT_ACTION_PROMPT) {
				if (this.prompt) {
					const name = await this.prompt(this.metadata.name);
					if (name) {
						this.metadata.name = name;
					} else {
						return response;
					}
				} else {
					this.filenameConflictAction = CONFLICT_ACTION_UNIQUIFY;
				}
			} else if (this.filenameConflictAction == CONFLICT_ACTION_SKIP) {
				return response;
			}
		}
		const httpResponse = getResponse(await fetch(DROPBOX_UPLOAD_URL, {
			method: "POST",
			headers: {
				"Authorization": "Bearer " + this.token,
				"Dropbox-API-Arg": stringify({
					close: false
				}),
				"Content-Type": "application/octet-stream"
			}
		}));
		const sessionId = (await getJSON(httpResponse)).session_id;
		this.sessionId = sessionId;
		if (!this.cancelled) {
			if (this.onProgress) {
				this.onProgress(0, this.file.size);
			}
			return sendFile(this);
		}
	}
}

export { Dropbox };

async function authFromCode(dropbox, options) {
	const httpResponse = await fetch(TOKEN_URL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: "client_id=" + dropbox.clientId +
			"&client_secret=" + dropbox.clientKey +
			"&grant_type=authorization_code" +
			"&code=" + options.code +
			(dropbox.codeVerifier ? "&code_verifier=" + dropbox.codeVerifier : "") +
			"&redirect_uri=" + browser.identity.getRedirectURL()
	});
	const response = await getJSON(httpResponse);
	dropbox.accessToken = response.access_token;
	dropbox.refreshToken = response.refresh_token;
	dropbox.expirationDate = Date.now() + (response.expires_in * 1000);
	return { accessToken: dropbox.accessToken, refreshToken: dropbox.refreshToken, expirationDate: dropbox.expirationDate };
}

async function initAuth(dropbox, options, state) {
	let code;
	const authFlow = { state };
	try {
		options.extractAuthCode(browser.identity.getRedirectURL(), authFlow)
			.then(authCode => code = authCode)
			.catch(() => { /* ignored */ });
		return await options.launchWebAuthFlow({ url: dropbox.authURL }, authFlow);
	}
	catch (error) {
		if (error.message && (error.message == "code_required" || error.message.includes("access"))) {
			if (code) {
				options.code = code;
				return await authFromCode(dropbox, options);
			} else {
				throw new Error("code_required", { cause: error });
			}
		} else {
			throw error;
		}
	}
	finally {
		if (authFlow.cancel) {
			authFlow.cancel();
		}
	}
}

function generateState() {
	return Array.from(crypto.getRandomValues(new Uint8Array(16)))
		.map(value => value.toString(16).padStart(2, "0"))
		.join("");
}

async function generateCodeVerifier() {
	const verifier = encodeBase64URL(crypto.getRandomValues(new Uint8Array(32)));
	const challenge = encodeBase64URL(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
	return { verifier, challenge };
}

function encodeBase64URL(data) {
	return btoa(String.fromCharCode(...data)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sendFile(mediaUploader) {
	let content = mediaUploader.file, end = mediaUploader.file.size;
	if (mediaUploader.offset || mediaUploader.chunkSize) {
		if (mediaUploader.chunkSize) {
			end = Math.min(mediaUploader.offset + mediaUploader.chunkSize, mediaUploader.file.size);
		}
		content = content.slice(mediaUploader.offset, end);
	}
	const httpAppendResponse = getResponse(await fetch(DROPBOX_APPEND_URL, {
		method: "POST",
		headers: {
			"Authorization": "Bearer " + mediaUploader.token,
			"Content-Type": "application/octet-stream",
			"Dropbox-API-Arg": stringify({
				cursor: {
					session_id: mediaUploader.sessionId,
					offset: mediaUploader.offset
				},
				close: end == mediaUploader.file.size
			})
		},
		body: content
	}));
	if (mediaUploader.onProgress && !mediaUploader.cancelled) {
		mediaUploader.onProgress(mediaUploader.offset + mediaUploader.chunkSize, mediaUploader.file.size);
	}
	if (httpAppendResponse.status == 200) {
		mediaUploader.offset = end;
		if (mediaUploader.offset < mediaUploader.file.size) {
			return sendFile(mediaUploader);
		}
	}
	let path = mediaUploader.metadata.name;
	if (!path.startsWith("/")) {
		path = "/" + path;
	}
	const httpFinishResponse = await fetch(DROPBOX_FINISH_URL, {
		method: "POST",
		headers: {
			"Authorization": "Bearer " + mediaUploader.token,
			"Content-Type": "application/octet-stream",
			"Dropbox-API-Arg": stringify({
				cursor: {
					session_id: mediaUploader.sessionId,
					offset: mediaUploader.offset
				},
				commit: {
					path,
					mode: mediaUploader.filenameConflictAction == CONFLICT_ACTION_OVERWRITE ? "overwrite" : "add",
					autorename: mediaUploader.filenameConflictAction == CONFLICT_ACTION_UNIQUIFY
				}
			})
		}
	});
	if (httpFinishResponse.status == 200) {
		return getJSON(httpFinishResponse);
	} else if (httpFinishResponse.status == 409 && mediaUploader.filenameConflictAction == CONFLICT_ACTION_PROMPT) {
		mediaUploader.offset = 0;
		return mediaUploader.upload();
	} else {
		throw new Error("unknown_error (" + httpFinishResponse.status + ")");
	}
}

async function getJSON(httpResponse) {
	httpResponse = getResponse(httpResponse);
	const response = await httpResponse.json();
	if (response.error) {
		throw new Error(response.error);
	} else {
		return response;
	}
}

function getResponse(httpResponse) {
	if (httpResponse.status == 200) {
		return httpResponse;
	} else if (httpResponse.status == 401) {
		throw new Error("invalid_token");
	} else {
		throw new Error("unknown_error (" + httpResponse.status + ")");
	}
}

function stringify(value) {
	return JSON.stringify(value).replace(ENCODED_CHARS,
		function (c) {
			return "\\u" + ("000" + c.charCodeAt(0).toString(16)).slice(-4);
		}
	);
}