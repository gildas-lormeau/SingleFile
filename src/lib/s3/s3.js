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

/* global crypto, TextEncoder, fetch, URLSearchParams, AbortController, Response */

const EMPTY_STRING = "";
const CONFLICT_ACTION_UNIQUIFY = "uniquify";
const CONFLICT_ACTION_OVERWRITE = "overwrite";
const CONFLICT_ACTION_PROMPT = "prompt";
const EXTENSION_SEPARATOR = ".";
const INDEX_FILENAME_PREFIX = " (";
const INDEX_FILENAME_SUFFIX = ")";
const INDEX_FILENAME_REGEXP = /\s\((\d+)\)$/;
const ABORT_ERROR_NAME = "AbortError";
const S3_SERVICE = "s3";
const S3_DOMAIN = S3_SERVICE + ".amazonaws.com";

export { S3 };

class S3 {
	constructor(region, bucket, accessKey, secretKey, domain = S3_DOMAIN) {
		this.api = new API({ domain, region, bucket, accessKey, secretKey });
		this.headObjectSupported = true;
		this.listObjectsSupported = true;
	}

	async upload(path, blob, options) {
		const { filenameConflictAction, prompt } = options;
		this.controller = new AbortController();
		options.signal = this.controller.signal;
		try {
			if (filenameConflictAction == CONFLICT_ACTION_OVERWRITE) {
				return this.api.putObject({ path }, { body: await getUint8Array(blob) });
			} else {
				let response;
				if (this.headObjectSupported) {
					response = await this.api.headObject({ path }, options);
				}
				if (!this.headObjectSupported || response.status == 403) {
					this.headObjectSupported = false;
					if (this.listObjectsSupported) {
						response = await this.api.listObjects({ path }, options);
					}
					if (!this.listObjectsSupported || response.status == 403) {
						this.listObjectsSupported = false;
						response = await this.api.getObject({ path }, options);
					}
				}
				if (response.status == 200) {
					if (filenameConflictAction == CONFLICT_ACTION_PROMPT) {
						if (prompt) {
							path = await prompt(path);
							if (path) {
								return this.upload(path, blob, options);
							} else {
								return response;
							}
						} else {
							options.filenameConflictAction = CONFLICT_ACTION_UNIQUIFY;
							return this.upload(path, blob, options);
						}
					} else if (filenameConflictAction == CONFLICT_ACTION_UNIQUIFY) {
						const { filenameWithoutExtension, extension, indexFilename } = splitFilename(path);
						options.indexFilename = indexFilename + 1;
						path = getFilename(filenameWithoutExtension, options.indexFilename, extension);
						return this.upload(path, blob, options);
					}
				} else if (response.status == 404) {
					blob = new Uint8Array(await blob.arrayBuffer());
					return this.api.putObject({ path }, { body: await getUint8Array(blob) });
				} else {
					throw new Error(response.statusText || "Error " + response.status);
				}
			}
		} catch (error) {
			if (error.name != ABORT_ERROR_NAME) {
				throw error;
			}
		}
	}

	abort() {
		if (this.controller) {
			this.controller.abort();
		}
	}
}

async function getUint8Array(blob) {
	return new Uint8Array(await new Response(blob).arrayBuffer());
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

function getFilename(filenameWithoutExtension, indexFilename, extension) {
	return filenameWithoutExtension +
		INDEX_FILENAME_PREFIX + indexFilename + INDEX_FILENAME_SUFFIX +
		(extension ? EXTENSION_SEPARATOR + extension : EMPTY_STRING);
}

const AWS4 = "AWS4";
const AWS4_ALGORITHM = AWS4 + "-HMAC-SHA256";
const AWS4_REQUEST = "aws4_request";

const GET_METHOD = "GET";
const PUT_METHOD = "PUT";
const HEAD_METHOD = "HEAD";

class API {
	constructor({ domain, region, bucket, accessKey, secretKey }) {
		this.domain = domain;
		this.region = region;
		this.bucket = bucket;
		this.accessKey = accessKey;
		this.secretKey = secretKey;
	}

	async putObject({ path }, { headers = {}, body }) {
		return fetchS3(this, { path }, { method: PUT_METHOD, headers, body });
	}

	async getObject({ path }, { headers = {} } = {}) {
		return fetchS3(this, { path }, { method: GET_METHOD, headers });
	}

	async headObject({ path }, { headers = {} } = {}) {
		return fetchS3(this, { path }, { method: HEAD_METHOD, headers });
	}

	async listObjects({ path }, { headers = {}, continuationToken, delimiter, encodingType, prefix, maxKeys } = {}) {
		const searchParams = new URLSearchParams();
		searchParams.set("list-type", "2");
		if (continuationToken) {
			searchParams.set("continuation-token", continuationToken);
		}
		if (delimiter) {
			searchParams.set("delimiter", delimiter);
		}
		if (encodingType) {
			searchParams.set("encoding-type", encodingType);
		}
		if (prefix) {
			searchParams.set("prefix", prefix);
		}
		if (maxKeys) {
			searchParams.set("max-keys", maxKeys);
		}
		return fetchS3(this, { path, searchParams }, { method: "GET", headers });
	}
}

async function fetchS3({ region, bucket, accessKey, secretKey, domain }, { path = "/", searchParams = new URLSearchParams() }, { method, headers = {}, body }) {
	const date = new Date();
	const isoDate = getISODate(date);
	const service = S3_SERVICE;
	if (!path.startsWith("/")) {
		path = "/" + path;
	}
	headers.host = bucket + "." + domain;
	if (body) {
		headers["content-length"] = body.byteLength;
	}
	headers["x-amz-content-sha256"] = await getHexHash(body);
	headers["x-amz-date"] = isoDate;
	headers.authorization = AWS4_ALGORITHM + " " +
		"Credential=" + accessKey + "/" + getCredentialScope(isoDate, region, service) + "," +
		"SignedHeaders=" + getSignedHeaders(headers) + "," +
		"Signature=" + await getSignature({ region, secretKey, service }, { path, searchParams }, { method, headers, body, isoDate });
	const url = "https://" + bucket + "." + domain + path + (searchParams.size ? "?" + searchParams : "");
	const options = { method, headers };
	if (body) {
		options.body = body;
	}
	return fetch(url, options);
}

async function getSignature({ region, secretKey, service }, { path, searchParams }, { method, headers, body, isoDate }) {
	const stringToSign = await getStringToSign(path, searchParams, headers, body, isoDate, region, method, service);
	const signingKey = await getSigningKey(secretKey, isoDate, region, service);
	const signature = await getHMAC(signingKey, getEncodedText(stringToSign));
	return getHexadecimal(signature);
}

async function getStringToSign(path, searchParams, headers, body, isoDate, region, method, service) {
	const canonicalRequest = await getCanonicalRequest(path, searchParams, headers, method, body);
	return AWS4_ALGORITHM + "\n" +
		isoDate + "\n" +
		getCredentialScope(isoDate, region, service) + "\n" +
		getHexadecimal(await getHashSHA256(getEncodedText(canonicalRequest)));
}

async function getCanonicalRequest(path, searchParams, headers, method, body = new Uint8Array(0)) {
	return method + "\n" +
		getCanonicalURI(path) + "\n" +
		getCanonicalQuery(searchParams) + "\n" +
		getCanonicalHeaders(headers) + "\n" +
		getSignedHeaders(headers) + "\n" +
		await getHexHash(body);
}

function getCanonicalURI(path) {
	return decodeURIComponent(path).replace(/[^A-Za-z0-9-._~/]/g, encodeHexadecimal);
}

function encodeHexadecimal(character) {
	let result = encodeURIComponent(character);
	if (result.startsWith("%")) {
		result = result.toUpperCase();
	} else {
		result = "%" + result.charCodeAt(0).toString(16).toUpperCase();
	}
	return result;
}

function getCanonicalQuery(searchParams) {
	if (searchParams) {
		let result = "";
		searchParams.sort();
		for (const [key, value] of searchParams) {
			result += encodeURIComponent(key) + "=" + encodeURIComponent(value) + "&";
		}
		return result.slice(0, -1);
	} else {
		return "";
	}
}

function getCanonicalHeaders(headers) {
	let result = "";
	const sortedHeaders = Object.keys(headers).sort();
	for (const header of sortedHeaders) {
		result += header + ":" + headers[header] + "\n";
	}
	return result;
}

function getSignedHeaders(headers) {
	return Object.keys(headers).map(header => header.toLowerCase()).sort().join(";");
}

async function getHexHash(body = new Uint8Array(0)) {
	return getHexadecimal(await getHashSHA256(body));
}

function getCredentialScope(isoDate, region, service) {
	return isoDate.substring(0, 8) + "/" + region + "/" + service + "/" + AWS4_REQUEST;
}

async function getSigningKey(secretKey, isoDate, region, service) {
	const dateKey = await getHMAC(getEncodedText(AWS4 + secretKey), getEncodedText(isoDate.substring(0, 8)));
	const dateRegionKey = await getHMAC(dateKey, getEncodedText(region));
	const dateRegionServiceKey = await getHMAC(dateRegionKey, getEncodedText(service));
	return getHMAC(dateRegionServiceKey, getEncodedText(AWS4_REQUEST));
}

async function getHashSHA256(value) {
	return crypto.subtle.digest("SHA-256", value);
}

async function getHMAC(key, value) {
	const algorithm = { name: "HMAC", hash: { name: "SHA-256" } };
	const importedKey = await crypto.subtle.importKey("raw", key, algorithm, false, ["sign"]);
	return crypto.subtle.sign(algorithm, importedKey, value);
}

function getEncodedText(text) {
	return new TextEncoder().encode(text);
}

function getHexadecimal(hash) {
	return Array.from(new Uint8Array(hash)).map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function getISODate(date) {
	const result = new Date(date);
	return result.toISOString().replace(/[:-]|\.\d{3}/g, "");
}