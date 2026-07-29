import { describe, it, expect } from "vitest";
import {
	updateFilenameTemplate,
	sortRules,
	testRegExpRule,
	isSameArray,
	encodeSharpCharacter,
	getRegExp
} from "../src/core/bg/config-utils.js";

describe("config-utils", () => {
	describe("updateFilenameTemplate", () => {
		it("wraps known variables with %if-empty", () => {
			const result = updateFilenameTemplate("{page-title}");
			expect(result).toBe("%if-empty<{page-title}|No title>");
		});

		it("wraps multiple variables", () => {
			const result = updateFilenameTemplate("{page-title} - {page-author}");
			expect(result).toBe("%if-empty<{page-title}|No title> - %if-empty<{page-author}|No author>");
		});

		it("leaves unrecognized variables unchanged", () => {
			const result = updateFilenameTemplate("{custom-var}");
			expect(result).toBe("{custom-var}");
		});

		it("handles template with no variables", () => {
			const result = updateFilenameTemplate("static-name");
			expect(result).toBe("static-name");
		});
	});

	describe("sortRules", () => {
		it("sorts longer URLs first (higher specificity)", () => {
			const rules = [
				{ url: "short" },
				{ url: "much-longer-url" },
				{ url: "medium-url" }
			];
			const sorted = [...rules].sort(sortRules);
			expect(sorted[0].url).toBe("much-longer-url");
			expect(sorted[2].url).toBe("short");
		});

		it("returns 0 for equal-length URLs", () => {
			expect(sortRules({ url: "abc" }, { url: "xyz" })).toBe(0);
		});
	});

	describe("testRegExpRule", () => {
		it("returns true for regexp: prefixed rules", () => {
			expect(testRegExpRule({ url: "regexp:.*example\\.com" })).toBe(true);
		});

		it("returns true case-insensitively", () => {
			expect(testRegExpRule({ url: "REGEXP:.*example" })).toBe(true);
		});

		it("returns false for plain URL rules", () => {
			expect(testRegExpRule({ url: "https://example.com" })).toBe(false);
		});

		it("returns false for wildcard rules", () => {
			expect(testRegExpRule({ url: "*" })).toBe(false);
		});
	});

	describe("isSameArray", () => {
		it("returns true for equal arrays", () => {
			expect(isSameArray([1, 2, 3], [1, 2, 3])).toBe(true);
		});

		it("returns false for different values", () => {
			expect(isSameArray([1, 2, 3], [1, 2, 4])).toBe(false);
		});

		it("returns false for different lengths", () => {
			expect(isSameArray([1, 2], [1, 2, 3])).toBe(false);
		});

		it("returns true for empty arrays", () => {
			expect(isSameArray([], [])).toBe(true);
		});

		it("uses loose equality", () => {
			expect(isSameArray([1, "2"], [1, 2])).toBe(true);
		});
	});

	describe("encodeSharpCharacter", () => {
		it("encodes # as %23", () => {
			expect(encodeSharpCharacter("file#name")).toBe("file%23name");
		});

		it("encodes multiple # characters", () => {
			expect(encodeSharpCharacter("a#b#c")).toBe("a%23b%23c");
		});

		it("returns string unchanged without #", () => {
			expect(encodeSharpCharacter("filename")).toBe("filename");
		});
	});

	describe("getRegExp", () => {
		it("escapes special regex characters", () => {
			expect(getRegExp("file.name")).toBe("file\\.name");
			expect(getRegExp("a+b")).toBe("a\\+b");
			expect(getRegExp("a*b")).toBe("a\\*b");
			expect(getRegExp("a?b")).toBe("a\\?b");
			expect(getRegExp("(group)")).toBe("\\(group\\)");
			expect(getRegExp("[class]")).toBe("\\[class\\]");
			expect(getRegExp("{brace}")).toBe("\\{brace\\}");
			expect(getRegExp("a^b")).toBe("a\\^b");
			expect(getRegExp("a$b")).toBe("a\\$b");
			expect(getRegExp("a|b")).toBe("a\\|b");
		});

		it("leaves plain strings unchanged", () => {
			expect(getRegExp("simple")).toBe("simple");
		});
	});
});
