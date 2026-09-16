// src/ui/common/filename-replacement.js carries replaceCharacters, a hand-copy of getValidFilename
// in single-file-core/core/helper.js, because the options page runs unbundled source and cannot
// import the core. It powers the preview row of the replaced-characters table, so a drift shows up
// as a preview that lies about what the save does.
//
// The same module is the single source of the default tables: config.js reads them for the default
// profile and download-util.js reads the same pairs as the map of its download retry ladder. The
// core exports the tables it falls back to, so the copy is pinned here rather than compared by eye.

import test from "node:test";
import assert from "node:assert/strict";

globalThis.window = globalThis;
globalThis.document = {};
globalThis.Document = class Document { };
globalThis.MutationObserver = class MutationObserver { observe() { } };

const {
	getValidFilename,
	DEFAULT_REPLACED_CHARACTERS: CORE_REPLACED_CHARACTERS,
	DEFAULT_REPLACEMENT_CHARACTERS: CORE_REPLACEMENT_CHARACTERS
} = await import("single-file-core/core/helper.js");
const {
	getReplacements,
	getReplacedCharactersOptions,
	replaceCharacters,
	LOOKALIKE_CHARACTERS,
	REGEXP_REPLACEABLE_CHARACTERS,
	DEFAULT_REPLACED_CHARACTERS,
	DEFAULT_REPLACEMENT_CHARACTERS
} = await import("../src/ui/common/filename-replacement.js");

const FALLBACK_CHARACTER = "_";
const LAST_BMP_CHARACTER_CODE = 0xffff;

const TABLES = [
	{ replaced: DEFAULT_REPLACED_CHARACTERS, replacement: DEFAULT_REPLACEMENT_CHARACTERS },
	{ replaced: ["#", "@"], replacement: ["＃"] },
	{ replaced: ["#", "@"], replacement: ["", "＠"] },
	{ replaced: ["#"], replacement: ["#"] },
	{ replaced: ["<", ">"], replacement: ["_LT_", "_GT_"] },
	{ replaced: ["[", "]", "\\\\"], replacement: ["［"] },
	{ replaced: ["a-c"], replacement: ["z"] },
	{ replaced: [], replacement: [] }
];

const SAMPLES = [
	"",
	"normal title",
	"a??b",
	"C++ vs C++",
	"Really???",
	"100% <sure>",
	"a:b::c",
	"file|name \"quoted\"",
	"~tilde~ and *stars*",
	"a\x00\x01\x02b",
	"x\x7fy",
	"a#b@c",
	"[bracket] and ]bracket[",
	"back\\slash",
	"abcdef",
	"a/../b",
	"../../etc/passwd",
	"/leading",
	"trailing/",
	"a//b",
	"./hidden",
	"dir/.hidden",
	"ends with a dot."
];

test("the options preview replaces the same characters as the core helper", () => {
	for (const { replaced, replacement } of TABLES) {
		const replacements = getReplacements({ filenameReplacedCharacters: replaced, filenameReplacementCharacters: replacement });
		for (const sample of SAMPLES) {
			assert.equal(
				replaceCharacters(sample, replacements, FALLBACK_CHARACTER),
				getValidFilename(sample, replaced, FALLBACK_CHARACTER, replacement),
				`${JSON.stringify(sample)} with ${JSON.stringify(replaced)} and ${JSON.stringify(replacement)}`);
		}
	}
});

test("the default tables are the ones the core helper falls back to", () => {
	assert.deepEqual(DEFAULT_REPLACED_CHARACTERS, CORE_REPLACED_CHARACTERS);
	assert.deepEqual(DEFAULT_REPLACEMENT_CHARACTERS, CORE_REPLACEMENT_CHARACTERS);
	const replacements = getReplacements({
		filenameReplacedCharacters: DEFAULT_REPLACED_CHARACTERS,
		filenameReplacementCharacters: DEFAULT_REPLACEMENT_CHARACTERS
	});
	for (const sample of SAMPLES) {
		assert.equal(replaceCharacters(sample, replacements, FALLBACK_CHARACTER), getValidFilename(sample), JSON.stringify(sample));
	}
});

test("a replaced character with no replacement takes the fallback, wherever the table puts it", () => {
	const replacements = getReplacements({ filenameReplacedCharacters: ["#", "@"], filenameReplacementCharacters: ["", "＠"] });
	assert.equal(replaceCharacters("a##b@c", replacements, FALLBACK_CHARACTER), "a_b＠c");
	assert.equal(replaceCharacters("a##b@c", replacements, FALLBACK_CHARACTER), getValidFilename("a##b@c", ["#", "@"], FALLBACK_CHARACTER, ["", "＠"]));
});

// the rows are written to the profile in the order the user arranged them, which is only safe
// because the core reads an empty replacement as the fallback character. Sorting them, as this
// function used to, silently swapped two rows of the table the user had just edited
test("the saved options keep the rows in the order the table shows them", () => {
	const options = getReplacedCharactersOptions([
		{ characters: "*", replacement: "" },
		{ characters: ":", replacement: "：" },
		{ characters: "", replacement: "ignored" },
		{ characters: "#", replacement: "" }
	]);
	assert.deepEqual(options.filenameReplacedCharacters, ["*", ":", "#"]);
	assert.deepEqual(options.filenameReplacementCharacters, ["", "：", ""]);
	const replacements = getReplacements(options);
	assert.equal(replaceCharacters("a*b:c#d", replacements, FALLBACK_CHARACTER), "a_b：c_d");
	assert.equal(
		replaceCharacters("a*b:c#d", replacements, FALLBACK_CHARACTER),
		getValidFilename("a*b:c#d", options.filenameReplacedCharacters, FALLBACK_CHARACTER, options.filenameReplacementCharacters));
});

// the retry ladder of the download uses the regexp as the gate and the map as the answer, so a
// character in one and not in the other puts the word "undefined" in the name the user gets
test("the download retry ladder has a lookalike for every character its regexp matches", () => {
	const matched = [];
	for (let characterCode = 0; characterCode <= LAST_BMP_CHARACTER_CODE; characterCode++) {
		const character = String.fromCharCode(characterCode);
		if (character.match(REGEXP_REPLACEABLE_CHARACTERS)) {
			matched.push(character);
		}
	}
	assert.deepEqual(matched, Array.from(LOOKALIKE_CHARACTERS.keys()).sort());
	assert.deepEqual(Array.from(LOOKALIKE_CHARACTERS.values()), CORE_REPLACEMENT_CHARACTERS);
	const sample = Array.from(LOOKALIKE_CHARACTERS.keys()).join("");
	assert.equal(sample.replace(REGEXP_REPLACEABLE_CHARACTERS, character => LOOKALIKE_CHARACTERS.get(character)), CORE_REPLACEMENT_CHARACTERS.join(""));
});
