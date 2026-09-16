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

// the background lane retries a 401/403/404 once so that the webRequest listener can put a Referer
// on the second attempt. The referrer only reaches this module when passReferrerOnError is set:
// single-file-core/core/index.js computes options.resourceReferrer as
// `passReferrerOnError && <the directory of the page URL>`, so with the option off it is false and
// the retry can only ever repeat the first request byte for byte.
let attempts;
let status;

class FakeXMLHttpRequest {
	static DONE = 4;

	constructor() {
		attempts.push(this);
		this.requestHeaders = {};
		this.readyState = 0;
	}

	open(method, url) {
		this.method = method;
		this.url = url;
	}

	setRequestHeader(name, value) {
		this.requestHeaders[name] = value;
	}

	getAllResponseHeaders() {
		return "content-type: text/plain";
	}

	send() {
		this.readyState = FakeXMLHttpRequest.DONE;
		this.status = status;
		this.response = new Uint8Array([1, 2, 3]).buffer;
		queueMicrotask(() => this.onreadystatechange());
	}
}

globalThis.XMLHttpRequest = FakeXMLHttpRequest;

const { fetchResource, referrers, REQUEST_ID_HEADER_NAME } = await import("../src/lib/single-file/fetch/bg/fetch.js");

function reset(responseStatus) {
	attempts = [];
	status = responseStatus;
	referrers.clear();
}

test("a 404 with no referrer is fetched once", async () => {
	reset(404);
	const response = await fetchResource("https://example.com/missing.png", { headers: {} });
	assert.equal(response.status, 404);
	assert.equal(attempts.length, 1, "the second request could only repeat the first, since there is no referrer to add");
});

test("a 404 with no referrer leaves nothing behind in the referrers map", async () => {
	reset(404);
	await fetchResource("https://example.com/missing.png", { headers: {} });
	// setReferrer runs on the retry and only injectRefererHeader deletes the entry, which needs the
	// webRequest listener that passReferrerOnError installs. No retry, nothing to leak.
	assert.equal(referrers.size, 0);
});

test("a 404 with a referrer is retried once so the Referer can be added", async () => {
	reset(404);
	await fetchResource("https://example.com/missing.png", { referrer: "https://example.com/", headers: {} });
	assert.equal(attempts.length, 2);
	assert.equal(attempts[0].requestHeaders[REQUEST_ID_HEADER_NAME], undefined, "the first attempt carries no request id");
	assert.ok(attempts[1].requestHeaders[REQUEST_ID_HEADER_NAME], "the retry carries the request id the listener swaps for a Referer");
});

test("the retried request id maps to the referrer the listener will inject", async () => {
	reset(403);
	await fetchResource("https://example.com/forbidden.png", { referrer: "https://example.com/", headers: {} });
	const requestId = attempts[1].requestHeaders[REQUEST_ID_HEADER_NAME];
	assert.equal(referrers.get(requestId), "https://example.com/");
});

test("401 and 403 retry on the same terms as 404", async () => {
	for (const responseStatus of [401, 403]) {
		reset(responseStatus);
		await fetchResource("https://example.com/denied.png", { headers: {} });
		assert.equal(attempts.length, 1, "no referrer, no retry on " + responseStatus);

		reset(responseStatus);
		await fetchResource("https://example.com/denied.png", { referrer: "https://example.com/", headers: {} });
		assert.equal(attempts.length, 2, "a referrer is worth a retry on " + responseStatus);
	}
});

test("a status the Referer cannot change is never retried", async () => {
	for (const responseStatus of [200, 500, 418]) {
		reset(responseStatus);
		await fetchResource("https://example.com/resource.png", { referrer: "https://example.com/", headers: {} });
		assert.equal(attempts.length, 1, "status " + responseStatus + " was retried");
	}
});
