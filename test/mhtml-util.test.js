import { describe, it, expect } from "vitest";
import {
	getCharset,
	replaceCharset,
	isDocument,
	isStylesheet,
	isText,
	getBoundary,
	decodeQuotedPrintable,
	decodeMimeHeader,
	resolvePath,
	indexOf,
	isLineFeed,
	endsWithCRLF,
	startsWithBoundary
} from "../src/lib/mhtml-to-html/util.js";

describe("mhtml-to-html/util", () => {
	describe("getCharset", () => {
		it("extracts charset from content-type", () => {
			expect(getCharset("text/html; charset=utf-8")).toBe("utf-8");
		});

		it("extracts quoted charset", () => {
			expect(getCharset("text/html; charset=\"UTF-8\"")).toBe("utf-8");
		});

		it("returns undefined when no charset", () => {
			expect(getCharset("text/html")).toBeUndefined();
		});
	});

	describe("replaceCharset", () => {
		it("replaces charset in content-type", () => {
			expect(replaceCharset("text/html; charset=utf-8", "iso-8859-1")).toBe("text/html; charset=iso-8859-1");
		});
	});

	describe("content-type classification", () => {
		it("isDocument matches text/html", () => {
			expect(isDocument("text/html")).toBe(true);
		});

		it("isDocument matches application/xhtml+xml", () => {
			expect(isDocument("application/xhtml+xml")).toBe(true);
		});

		it("isDocument rejects text/plain", () => {
			expect(isDocument("text/plain")).toBe(false);
		});

		it("isStylesheet matches text/css", () => {
			expect(isStylesheet("text/css")).toBe(true);
		});

		it("isStylesheet rejects text/html", () => {
			expect(isStylesheet("text/html")).toBe(false);
		});

		it("isText matches text/* types", () => {
			expect(isText("text/plain")).toBe(true);
			expect(isText("text/html")).toBe(true);
			expect(isText("text/css")).toBe(true);
		});

		it("isText rejects non-text types", () => {
			expect(isText("image/png")).toBe(false);
		});
	});

	describe("getBoundary", () => {
		it("extracts boundary from content-type", () => {
			expect(getBoundary("multipart/related;boundary=----=_Part_123")).toBe("----=_Part_123");
		});

		it("extracts quoted boundary", () => {
			expect(getBoundary("multipart/related;boundary=\"----=_Part_123\"")).toBe("----=_Part_123");
		});

		it("returns undefined when no boundary", () => {
			expect(getBoundary("text/html")).toBeUndefined();
		});
	});

	describe("decodeQuotedPrintable", () => {
		it("decodes =3D to equals sign", () => {
			const input = new Uint8Array([0x3D, 0x33, 0x44]); // =3D
			const result = decodeQuotedPrintable(input);
			expect(result).toEqual(new Uint8Array([0x3D])); // =
		});

		it("passes through normal bytes unchanged", () => {
			const input = new Uint8Array([0x48, 0x65, 0x6C, 0x6C, 0x6F]); // Hello
			const result = decodeQuotedPrintable(input);
			expect(result).toEqual(input);
		});

		it("handles mixed encoded and plain bytes", () => {
			const input = new Uint8Array([0x41, 0x3D, 0x34, 0x32, 0x43]); // A=42C
			const result = decodeQuotedPrintable(input);
			expect(result).toEqual(new Uint8Array([0x41, 0x42, 0x43])); // ABC
		});
	});

	describe("decodeMimeHeader", () => {
		it("decodes base64 MIME encoded word", () => {
			// =?utf-8?B?SGVsbG8=?= is "Hello" in base64
			expect(decodeMimeHeader("=?utf-8?B?SGVsbG8=?=")).toBe("Hello");
		});

		it("returns empty string for null input", () => {
			expect(decodeMimeHeader(null)).toBe("");
		});

		it("returns plain string as-is", () => {
			expect(decodeMimeHeader("plain text")).toBe("plain text");
		});
	});

	describe("resolvePath", () => {
		it("resolves relative URL against base", () => {
			expect(resolvePath("image.png", "https://example.com/page/")).toBe("https://example.com/page/image.png");
		});

		it("resolves absolute path against base", () => {
			expect(resolvePath("/image.png", "https://example.com/page/")).toBe("https://example.com/image.png");
		});

		it("returns data: URIs unchanged", () => {
			const dataUri = "data:image/png;base64,abc123";
			expect(resolvePath(dataUri, "https://example.com/")).toBe(dataUri);
		});

		it("returns path as-is when no base", () => {
			expect(resolvePath("image.png")).toBe("image.png");
		});

		it("handles protocol-relative URLs", () => {
			const result = resolvePath("//cdn.example.com/img.png", "https://example.com/");
			expect(result).toBe("https://cdn.example.com/img.png");
		});
	});

	describe("byte-level utilities", () => {
		it("indexOf finds string in byte array", () => {
			const encoder = new TextEncoder();
			const array = encoder.encode("Hello World");
			expect(indexOf(array, "World")).toBe(6);
		});

		it("indexOf returns -1 when not found", () => {
			const encoder = new TextEncoder();
			const array = encoder.encode("Hello");
			expect(indexOf(array, "World")).toBe(-1);
		});

		it("isLineFeed detects CRLF", () => {
			expect(isLineFeed(new Uint8Array([0x0D, 0x0A]))).toBe(true);
		});

		it("isLineFeed detects LF", () => {
			expect(isLineFeed(new Uint8Array([0x0A]))).toBe(true);
		});

		it("isLineFeed rejects other bytes", () => {
			expect(isLineFeed(new Uint8Array([0x41]))).toBe(false);
		});

		it("endsWithCRLF detects CRLF at end", () => {
			expect(endsWithCRLF(new Uint8Array([0x41, 0x0D, 0x0A]))).toBe(true);
		});

		it("endsWithCRLF rejects when no CRLF at end", () => {
			expect(endsWithCRLF(new Uint8Array([0x41, 0x42]))).toBe(false);
		});

		it("startsWithBoundary detects -- prefix", () => {
			expect(startsWithBoundary(new Uint8Array([0x2D, 0x2D, 0x41]))).toBe(true);
		});

		it("startsWithBoundary rejects non-boundary", () => {
			expect(startsWithBoundary(new Uint8Array([0x41, 0x42]))).toBe(false);
		});
	});
});
