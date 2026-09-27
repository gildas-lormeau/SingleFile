import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { chunkFinished } from "../src/core/common/chunk-finished.js";

const DOWNLOAD_MAX = 16 * (1024 * 1024);

function sendChunks(content, maxContentSize) {
	const messages = [];
	for (let blockIndex = 0; blockIndex * maxContentSize < content.length; blockIndex++) {
		const truncated = content.length > maxContentSize;
		const message = { truncated };
		if (truncated) {
			message.finished = chunkFinished(blockIndex, maxContentSize, content.length);
			message.content = content.slice(blockIndex * maxContentSize, (blockIndex + 1) * maxContentSize);
		} else {
			message.content = content;
		}
		messages.push(message);
	}
	return messages;
}

function receiveChunks(messages) {
	let parts = [];
	let saved = null;
	let saves = 0;
	for (const message of messages) {
		let contents;
		if (message.truncated) {
			parts.push(message.content);
			if (message.finished) {
				contents = parts;
				parts = [];
			}
		} else if (message.content) {
			contents = [message.content];
		}
		if (!message.truncated || message.finished) {
			saved = (contents || []).join("");
			saves += 1;
		}
	}
	return { saved, saves, pending: parts.join("") };
}

function transfer(content, maxContentSize) {
	return receiveChunks(sendChunks(content, maxContentSize));
}

test("an exact end offset is unfinished with > and finished with chunkFinished", () => {
	const maxContentSize = 4;
	const length = 8;
	const blockIndex = 1;
	assert.equal((blockIndex + 1) * maxContentSize > length, false);
	assert.equal(chunkFinished(blockIndex, maxContentSize, length), true);
});

test("two or three exact chunks finish on the last block", () => {
	for (const multiple of [2, 3]) {
		const content = "x".repeat(4 * multiple);
		const messages = sendChunks(content, 4);
		assert.equal(messages.length, multiple);
		assert.equal(messages.filter(message => message.finished).length, 1);
		assert.equal(messages.at(-1).finished, true);
		assert.equal(messages.slice(0, -1).every(message => message.finished === false), true);
		const result = transfer(content, 4);
		assert.equal(result.saves, 1);
		assert.equal(result.pending, "");
		assert.equal(result.saved, content);
	}
});

test("a payload one unit under or over a multiple still saves once", () => {
	for (const length of [3, 5, 7, 9]) {
		const content = "y".repeat(length);
		const result = transfer(content, 4);
		assert.equal(result.saves, 1, `length ${length}`);
		assert.equal(result.pending, "", `length ${length}`);
		assert.equal(result.saved, content, `length ${length}`);
	}
});

test("a payload that fits in one chunk is not truncated", () => {
	const content = "abc";
	const messages = sendChunks(content, 4);
	assert.equal(messages.length, 1);
	assert.equal(messages[0].truncated, false);
	assert.equal(messages[0].finished, undefined);
	assert.equal(transfer(content, 4).saved, content);
});

test("empty content sends nothing", () => {
	const messages = sendChunks("", 4);
	assert.equal(messages.length, 0);
	assert.equal(transfer("", 4).saves, 0);
});

test("16 MiB is one chunk, and 32 or 48 MiB finishes on the last block", () => {
	const oneChunk = sendChunks("z".repeat(DOWNLOAD_MAX), DOWNLOAD_MAX);
	assert.equal(oneChunk.length, 1);
	assert.equal(oneChunk[0].truncated, false);
	assert.equal(transfer("z".repeat(DOWNLOAD_MAX), DOWNLOAD_MAX).saved.length, DOWNLOAD_MAX);
	for (const multiple of [2, 3]) {
		const length = DOWNLOAD_MAX * multiple;
		const content = "z".repeat(length);
		const messages = sendChunks(content, DOWNLOAD_MAX);
		assert.equal(messages.length, multiple);
		assert.equal(messages.at(-1).finished, true);
		assert.equal(messages.slice(0, -1).every(message => message.finished === false), true);
		const result = transfer(content, DOWNLOAD_MAX);
		assert.equal(result.saves, 1);
		assert.equal(result.saved.length, length);
		assert.equal(result.pending, "");
	}
});

test("one code unit under and over 32 MiB still saves the whole payload", () => {
	for (const length of [DOWNLOAD_MAX * 2 - 1, DOWNLOAD_MAX * 2 + 1]) {
		const content = "z".repeat(length);
		const result = transfer(content, DOWNLOAD_MAX);
		assert.equal(result.saves, 1);
		assert.equal(result.saved.length, length);
		assert.equal(result.pending, "");
	}
});

test("the three chunk senders use chunkFinished", () => {
	const sources = [
		"src/core/common/download.js",
		"src/core/bg/editor.js",
		"src/core/content/content-bootstrap.js"
	];
	for (const source of sources) {
		const text = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", source), "utf8");
		assert.match(text, /chunkFinished\(/, source);
		assert.doesNotMatch(text, /MAX_CONTENT_SIZE > /, source);
	}
});
