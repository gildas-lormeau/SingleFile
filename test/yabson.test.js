import { describe, it, expect } from "vitest";
import { serialize, parse } from "../src/lib/yabson/yabson.js";

async function roundTrip(value) {
	const serialized = await serialize(value);
	return parse(serialized);
}

describe("yabson", () => {
	describe("primitives", () => {
		it("round-trips a string", async () => {
			expect(await roundTrip("hello")).toBe("hello");
		});

		it("round-trips an empty string", async () => {
			expect(await roundTrip("")).toBe("");
		});

		it("round-trips an integer", async () => {
			expect(await roundTrip(42)).toBe(42);
		});

		it("round-trips a float", async () => {
			expect(await roundTrip(3.14)).toBeCloseTo(3.14);
		});

		it("round-trips a negative number", async () => {
			expect(await roundTrip(-100)).toBe(-100);
		});

		it("round-trips zero", async () => {
			expect(await roundTrip(0)).toBe(0);
		});

		it("round-trips true", async () => {
			expect(await roundTrip(true)).toBe(true);
		});

		it("round-trips false", async () => {
			expect(await roundTrip(false)).toBe(false);
		});

		it("round-trips null", async () => {
			expect(await roundTrip(null)).toBeNull();
		});

		it("round-trips undefined", async () => {
			expect(await roundTrip(undefined)).toBeUndefined();
		});

		it("round-trips NaN", async () => {
			expect(await roundTrip(NaN)).toBeNaN();
		});
	});

	describe("containers", () => {
		it("round-trips a plain object", async () => {
			const obj = { a: 1, b: "two", c: true };
			expect(await roundTrip(obj)).toEqual(obj);
		});

		it("round-trips an empty object", async () => {
			expect(await roundTrip({})).toEqual({});
		});

		it("round-trips an array", async () => {
			expect(await roundTrip([1, 2, 3])).toEqual([1, 2, 3]);
		});

		it("round-trips an empty array", async () => {
			expect(await roundTrip([])).toEqual([]);
		});

		it("round-trips nested structures", async () => {
			const nested = { a: [1, { b: [2, 3] }], c: { d: { e: "deep" } } };
			expect(await roundTrip(nested)).toEqual(nested);
		});
	});

	describe("special types", () => {
		it("round-trips a Date", async () => {
			const date = new Date("2024-01-15T12:00:00Z");
			const result = await roundTrip(date);
			expect(result).toBeInstanceOf(Date);
			expect(result.getTime()).toBe(date.getTime());
		});

		it("round-trips a RegExp", async () => {
			const regex = /foo.*bar/gi;
			const result = await roundTrip(regex);
			expect(result).toBeInstanceOf(RegExp);
			expect(result.source).toBe(regex.source);
			expect(result.flags).toBe(regex.flags);
		});

		it("round-trips a Map", async () => {
			const map = new Map([["key1", "value1"], ["key2", 42]]);
			const result = await roundTrip(map);
			expect(result).toBeInstanceOf(Map);
			expect(result.get("key1")).toBe("value1");
			expect(result.get("key2")).toBe(42);
		});

		it("round-trips a Set", async () => {
			const set = new Set([1, 2, 3, "four"]);
			const result = await roundTrip(set);
			expect(result).toBeInstanceOf(Set);
			expect(result.has(1)).toBe(true);
			expect(result.has("four")).toBe(true);
			expect(result.size).toBe(4);
		});

		it("round-trips an Error", async () => {
			const error = new Error("test error");
			const result = await roundTrip(error);
			expect(result).toBeInstanceOf(Error);
			expect(result.message).toBe("test error");
		});
	});

	describe("typed arrays", () => {
		it("round-trips a Uint8Array", async () => {
			const arr = new Uint8Array([1, 2, 3, 255]);
			const result = await roundTrip(arr);
			expect(result).toBeInstanceOf(Uint8Array);
			expect(Array.from(result)).toEqual([1, 2, 3, 255]);
		});

		it("round-trips a Float64Array", async () => {
			const arr = new Float64Array([1.1, 2.2, 3.3]);
			const result = await roundTrip(arr);
			expect(result).toBeInstanceOf(Float64Array);
			expect(Array.from(result)).toEqual([1.1, 2.2, 3.3]);
		});
	});

	describe("edge cases", () => {
		it("round-trips a large string", async () => {
			const large = "x".repeat(100000);
			expect(await roundTrip(large)).toBe(large);
		});

		it("round-trips an array with mixed types", async () => {
			const mixed = [1, "two", true, null, { a: 1 }];
			expect(await roundTrip(mixed)).toEqual(mixed);
		});
	});
});
