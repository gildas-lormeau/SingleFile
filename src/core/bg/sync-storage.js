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
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU AGPL for
 *   more details.
 *
 *   As additional permission under GNU AGPL version 3 section 7, you may
 *   distribute non-source (e.g., minimized or compacted) forms of the code in
 *   this file without the copy of the GNU GPL normally required by section 4,
 *   provided you include this license notice and a URL through which
 *   recipients can access the Corresponding Source.
 */

/* global browser, TextEncoder */

const CHUNK_KEY_PREFIX = "__chunk_";
const CHUNKS_COUNT_PROPERTY = "__chunks";
const MAX_ITEM_BYTES = 6144;

export {
	get,
	set,
	remove,
	CHUNK_KEY_PREFIX,
	CHUNKS_COUNT_PROPERTY,
	MAX_ITEM_BYTES
};

async function get(keys) {
	const data = await browser.storage.sync.get(keys === undefined ? null : keys);
	const chunkKeys = [];
	Object.keys(data).forEach(key => {
		if (key.startsWith(CHUNK_KEY_PREFIX)) {
			delete data[key];
		} else if (isChunked(data[key])) {
			chunkKeys.push(...getChunkKeys(key, data[key][CHUNKS_COUNT_PROPERTY]));
		}
	});
	if (chunkKeys.length) {
		const chunks = await browser.storage.sync.get(chunkKeys);
		Object.keys(data).forEach(key => {
			if (isChunked(data[key])) {
				const content = getChunkKeys(key, data[key][CHUNKS_COUNT_PROPERTY]).map(chunkKey => chunks[chunkKey]);
				data[key] = content.includes(undefined) ? undefined : JSON.parse(content.join(""));
			}
		});
	}
	return data;
}

async function set(items) {
	const keys = Object.keys(items);
	const previousData = await browser.storage.sync.get(keys);
	const newItems = {};
	const staleKeys = [];
	keys.forEach(key => {
		const previousChunksCount = isChunked(previousData[key]) ? previousData[key][CHUNKS_COUNT_PROPERTY] : 0;
		const chunks = splitValue(key, items[key]);
		if (chunks) {
			newItems[key] = { [CHUNKS_COUNT_PROPERTY]: chunks.length };
			chunks.forEach((chunk, index) => newItems[getChunkKey(key, index)] = chunk);
			staleKeys.push(...getChunkKeys(key, previousChunksCount).slice(chunks.length));
		} else {
			newItems[key] = items[key];
			staleKeys.push(...getChunkKeys(key, previousChunksCount));
		}
	});
	await browser.storage.sync.set(newItems);
	if (staleKeys.length) {
		await browser.storage.sync.remove(staleKeys);
	}
}

async function remove(keys) {
	const data = await browser.storage.sync.get(keys);
	const removedKeys = [...keys];
	keys.forEach(key => {
		if (isChunked(data[key])) {
			removedKeys.push(...getChunkKeys(key, data[key][CHUNKS_COUNT_PROPERTY]));
		}
	});
	await browser.storage.sync.remove(removedKeys);
}

function splitValue(key, value) {
	const content = JSON.stringify(value);
	if (content === undefined || getItemSize(key, content) <= MAX_ITEM_BYTES) {
		return;
	}
	const chunks = [];
	let offset = 0;
	while (offset < content.length) {
		let length = Math.min(content.length - offset, MAX_ITEM_BYTES);
		let chunk = getChunk(content, offset, length);
		while (getItemSize(getChunkKey(key, chunks.length), JSON.stringify(chunk)) > MAX_ITEM_BYTES) {
			length = Math.max(1, Math.floor(length * 3 / 4));
			chunk = getChunk(content, offset, length);
		}
		chunks.push(chunk);
		offset += chunk.length;
	}
	return chunks;
}

function getChunk(content, offset, length) {
	let end = offset + length;
	if (end < content.length) {
		const code = content.charCodeAt(end - 1);
		if (code >= 0xD800 && code <= 0xDBFF) {
			end--;
		}
	}
	return content.substring(offset, end);
}

function getItemSize(key, content) {
	return new TextEncoder().encode(key + content).length;
}

function isChunked(value) {
	return Boolean(value) && typeof value == "object" && Number.isInteger(value[CHUNKS_COUNT_PROPERTY]) && Object.keys(value).length == 1;
}

function getChunkKey(key, index) {
	return CHUNK_KEY_PREFIX + index + "_" + key;
}

function getChunkKeys(key, count) {
	const keys = [];
	for (let index = 0; index < count; index++) {
		keys.push(getChunkKey(key, index));
	}
	return keys;
}
