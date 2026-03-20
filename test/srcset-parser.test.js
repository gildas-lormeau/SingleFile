import { describe, it, expect } from "vitest";
import { parse, serialize } from "../src/lib/mhtml-to-html/srcset-parser.js";

describe("srcset-parser", () => {
	describe("parse", () => {
		it("parses a single URL with no descriptor", () => {
			const result = parse("image.png");
			expect(result).toEqual([{ url: "image.png" }]);
		});

		it("parses a single URL with width descriptor", () => {
			const result = parse("image.png 400w");
			expect(result).toEqual([{ url: "image.png", w: 400 }]);
		});

		it("parses a single URL with pixel density descriptor", () => {
			const result = parse("image.png 2x");
			expect(result).toEqual([{ url: "image.png", d: 2 }]);
		});

		it("parses multiple candidates", () => {
			const result = parse("small.png 320w, medium.png 640w, large.png 1024w");
			expect(result).toEqual([
				{ url: "small.png", w: 320 },
				{ url: "medium.png", w: 640 },
				{ url: "large.png", w: 1024 }
			]);
		});

		it("parses mixed width and density descriptors", () => {
			const result = parse("low.png 1x, high.png 2x");
			expect(result).toEqual([
				{ url: "low.png", d: 1 },
				{ url: "high.png", d: 2 }
			]);
		});

		it("handles leading and trailing whitespace", () => {
			const result = parse("  image.png 400w  ");
			expect(result).toEqual([{ url: "image.png", w: 400 }]);
		});

		it("handles extra whitespace between candidates", () => {
			const result = parse("a.png 1x  ,  b.png 2x");
			expect(result).toEqual([
				{ url: "a.png", d: 1 },
				{ url: "b.png", d: 2 }
			]);
		});

		it("returns empty array for empty input", () => {
			const result = parse("");
			expect(result).toEqual([]);
		});

		it("returns empty array for whitespace-only input", () => {
			const result = parse("   ");
			expect(result).toEqual([]);
		});

		it("parses floating-point density descriptors", () => {
			const result = parse("image.png 1.5x");
			expect(result).toEqual([{ url: "image.png", d: 1.5 }]);
		});
	});

	describe("serialize", () => {
		it("serializes a single URL with no descriptor", () => {
			expect(serialize([{ url: "image.png" }])).toBe("image.png");
		});

		it("serializes width descriptors", () => {
			expect(serialize([{ url: "image.png", w: 400 }])).toBe("image.png 400w");
		});

		it("serializes density descriptors", () => {
			expect(serialize([{ url: "image.png", d: 2 }])).toBe("image.png 2x");
		});

		it("serializes multiple candidates", () => {
			const result = serialize([
				{ url: "small.png", w: 320 },
				{ url: "large.png", w: 1024 }
			]);
			expect(result).toBe("small.png 320w, large.png 1024w");
		});
	});

	describe("round-trip", () => {
		it("preserves width descriptors through parse/serialize", () => {
			const input = "small.png 320w, large.png 1024w";
			expect(serialize(parse(input))).toBe(input);
		});

		it("preserves density descriptors through parse/serialize", () => {
			const input = "low.png 1x, high.png 2x";
			expect(serialize(parse(input))).toBe(input);
		});
	});
});
