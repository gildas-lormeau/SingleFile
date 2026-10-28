// src/core/bg/sync-storage.js wraps browser.storage.sync so that a value larger than the
// per-item quota of sync storage (8 KB in Firefox and Chrome) is split over several items and
// reassembled on read. A profile with a long filename replacement table is the case that hit
// the quota (#2038).

/* global TextEncoder */

import test from "node:test";
import assert from "node:assert/strict";

const QUOTA_BYTES_PER_ITEM = 8192;
const store = new Map();
const sync = {
	async get(keys) {
		const result = {};
		const keyList = keys === null || keys === undefined ? [...store.keys()] : [].concat(keys);
		keyList.forEach(key => {
			if (store.has(key)) {
				result[key] = JSON.parse(store.get(key));
			}
		});
		return result;
	},
	async set(items) {
		Object.keys(items).forEach(key => {
			const content = JSON.stringify(items[key]);
			if (new TextEncoder().encode(key + content).length > QUOTA_BYTES_PER_ITEM) {
				throw new Error("QuotaExceededError: " + key);
			}
		});
		Object.keys(items).forEach(key => store.set(key, JSON.stringify(items[key])));
	},
	async remove(keys) {
		[].concat(keys).forEach(key => store.delete(key));
	}
};
globalThis.browser = { storage: { sync } };

const syncStorage = await import("../src/core/bg/sync-storage.js");

const SMALL_PROFILE = { name: "small", filenameReplacedCharacters: ["~", "?"], filenameReplacementCharacters: ["～", "？"] };
const LARGE_PROFILE = {
	name: "large",
	filenameReplacedCharacters: Array.from({ length: 128 }, (_, index) => "ÀÁẤ𝐀\"\\\n".repeat(8) + index),
	filenameReplacementCharacters: Array.from({ length: 128 }, (_, index) => "a" + index)
};

test("small values are stored as is", async () => {
	store.clear();
	await syncStorage.set({ profile_small: SMALL_PROFILE, rules: [] });
	assert.deepEqual(JSON.parse(store.get("profile_small")), SMALL_PROFILE);
	assert.deepEqual(await syncStorage.get(["profile_small", "rules"]), { profile_small: SMALL_PROFILE, rules: [] });
});

test("large values are split under the quota and reassembled", async () => {
	store.clear();
	const contentSize = new TextEncoder().encode(JSON.stringify(LARGE_PROFILE)).length;
	assert.ok(contentSize > QUOTA_BYTES_PER_ITEM, "fixture is larger than the quota: " + contentSize);
	await syncStorage.set({ profile_large: LARGE_PROFILE });
	const chunkKeys = [...store.keys()].filter(key => key.startsWith(syncStorage.CHUNK_KEY_PREFIX));
	assert.ok(chunkKeys.length > 1, "stored in " + chunkKeys.length + " chunks");
	assert.deepEqual(JSON.parse(store.get("profile_large")), { [syncStorage.CHUNKS_COUNT_PROPERTY]: chunkKeys.length });
	assert.deepEqual((await syncStorage.get(["profile_large"])).profile_large, LARGE_PROFILE);
	assert.deepEqual((await syncStorage.get()).profile_large, LARGE_PROFILE);
});

test("get without keys hides the chunks", async () => {
	store.clear();
	await syncStorage.set({ profile_large: LARGE_PROFILE, profile_small: SMALL_PROFILE });
	assert.deepEqual(Object.keys(await syncStorage.get()).sort(), ["profile_large", "profile_small"]);
});

test("rewriting a value removes its stale chunks", async () => {
	store.clear();
	await syncStorage.set({ profile_large: LARGE_PROFILE });
	const chunkCount = [...store.keys()].filter(key => key.startsWith(syncStorage.CHUNK_KEY_PREFIX)).length;
	await syncStorage.set({ profile_large: SMALL_PROFILE });
	assert.deepEqual([...store.keys()], ["profile_large"]);
	assert.deepEqual((await syncStorage.get(["profile_large"])).profile_large, SMALL_PROFILE);
	await syncStorage.set({ profile_large: LARGE_PROFILE });
	const shorter = Object.assign({}, LARGE_PROFILE, { filenameReplacedCharacters: LARGE_PROFILE.filenameReplacedCharacters.slice(0, 40) });
	await syncStorage.set({ profile_large: shorter });
	const remaining = [...store.keys()].filter(key => key.startsWith(syncStorage.CHUNK_KEY_PREFIX)).length;
	assert.ok(remaining < chunkCount && remaining > 0, "chunks went from " + chunkCount + " to " + remaining);
	assert.deepEqual((await syncStorage.get(["profile_large"])).profile_large, shorter);
});

test("remove deletes the chunks too", async () => {
	store.clear();
	await syncStorage.set({ profile_large: LARGE_PROFILE, rules: [] });
	await syncStorage.remove(["profile_large"]);
	assert.deepEqual([...store.keys()], ["rules"]);
});

test("a chunk never splits a surrogate pair", async () => {
	store.clear();
	const emoji = { text: "😀".repeat(4000) };
	await syncStorage.set({ emoji });
	const chunks = [...store.keys()].filter(key => key.startsWith(syncStorage.CHUNK_KEY_PREFIX)).map(key => JSON.parse(store.get(key)));
	assert.ok(chunks.length > 1);
	chunks.forEach(chunk => assert.ok(chunk.length % 2 == 0 || chunk.startsWith("{") || chunk.endsWith("}"), "chunk boundary on a code point"));
	assert.deepEqual((await syncStorage.get(["emoji"])).emoji, emoji);
});

test("a value that still exceeds the quota rejects without writing", async () => {
	store.clear();
	await syncStorage.set({ rules: [] });
	const previousSet = sync.set;
	sync.set = async () => { throw new Error("QuotaExceededError"); };
	try {
		await assert.rejects(syncStorage.set({ profile_large: LARGE_PROFILE }), /QuotaExceededError/);
	} finally {
		sync.set = previousSet;
	}
	assert.deepEqual([...store.keys()], ["rules"]);
});
