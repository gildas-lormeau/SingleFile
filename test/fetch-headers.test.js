import test from "node:test";
import assert from "node:assert/strict";

globalThis.browser = {
	runtime: {
		onMessage: {
			addListener() {
			}
		}
	}
};

const { parseHeaders } = await import("../src/lib/single-file/fetch/bg/fetch.js");

test("a raw header block becomes name and value pairs", () => {
	assert.deepEqual(parseHeaders("content-type: text/html\r\ncontent-length: 12"), [
		["content-type", "text/html"],
		["content-length", "12"]
	]);
});

test("lines separated by a bare newline are accepted", () => {
	assert.deepEqual(parseHeaders("content-type: text/html\ncontent-length: 12"), [
		["content-type", "text/html"],
		["content-length", "12"]
	]);
});

test("a value containing colons is kept whole", () => {
	assert.deepEqual(parseHeaders("location: https://example.com:8443/a?b=1"), [
		["location", "https://example.com:8443/a?b=1"]
	]);
});

test("the trailing blank line that getAllResponseHeaders emits is dropped", () => {
	assert.deepEqual(parseHeaders("content-type: text/html\r\n\r\n"), [
		["content-type", "text/html"]
	]);
});

test("an empty header block gives no pairs", () => {
	assert.deepEqual(parseHeaders(""), []);
	assert.deepEqual(parseHeaders("\r\n\r\n"), []);
});

test("a line with no colon is dropped rather than becoming an empty name", () => {
	assert.deepEqual(parseHeaders("content-type: text/html\r\ngarbage"), [
		["content-type", "text/html"]
	]);
});

test("surrounding whitespace is trimmed from both the name and the value", () => {
	assert.deepEqual(parseHeaders("  content-type  :   text/html   "), [
		["content-type", "text/html"]
	]);
});

test("a header with an empty value keeps its name", () => {
	assert.deepEqual(parseHeaders("x-empty:"), [
		["x-empty", ""]
	]);
});

test("a repeated header name is not collapsed", () => {
	assert.deepEqual(parseHeaders("set-cookie: a=1\r\nset-cookie: b=2"), [
		["set-cookie", "a=1"],
		["set-cookie", "b=2"]
	]);
});

test("the shape matches what the MV3 relay produces with [...response.headers]", () => {
	const headers = new Headers({ "content-type": "text/html", "content-length": "12" });
	const fromFetch = [...headers].sort();
	const fromXhr = parseHeaders("content-length: 12\r\ncontent-type: text/html").sort();
	assert.deepEqual(fromXhr, fromFetch);
});
