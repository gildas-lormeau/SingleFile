// src/ui/common/filename-replacement.js carries replaceCharacters, a hand-copy of the two
// replacement loops of getValidFilename in single-file-core/core/helper.js, because the options
// page runs unbundled source and cannot import the core. It powers the preview row of the
// replaced-characters table, so a drift shows up as a preview that lies about what the save does.
//
// The copy is of the two loops only: getValidFilename also strips "../", leading and repeated
// slashes and a trailing dot, which belong to the filename template rather than to this table. The
// samples below therefore avoid slashes and trailing dots, where the two would legitimately differ.

import test from "node:test";
import assert from "node:assert/strict";

globalThis.window = globalThis;
globalThis.document = {};
globalThis.Document = class Document { };
globalThis.MutationObserver = class MutationObserver { observe() { } };

const { getValidFilename } = await import("single-file-core/core/helper.js");
const { getReplacements, replaceCharacters } = await import("../src/ui/common/filename-replacement.js");

const DEFAULT_FILENAME_REPLACED_CHARACTERS = ["~", "+", "?", "%", "*", ":", "|", "\"", "<", ">", "\\\\", "\x00-\x1f", "\x7F"];
const DEFAULT_FILENAME_REPLACEMENT_CHARACTERS = ["～", "＋", "？", "％", "＊", "：", "｜", "＂", "＜", "＞", "＼"];
const FALLBACK_CHARACTER = "_";

const TABLES = [
	{ replaced: DEFAULT_FILENAME_REPLACED_CHARACTERS, replacement: DEFAULT_FILENAME_REPLACEMENT_CHARACTERS },
	{ replaced: ["#", "@"], replacement: ["＃"] },
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
	"abcdef"
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
	const replacements = getReplacements({
		filenameReplacedCharacters: DEFAULT_FILENAME_REPLACED_CHARACTERS,
		filenameReplacementCharacters: DEFAULT_FILENAME_REPLACEMENT_CHARACTERS
	});
	for (const sample of SAMPLES) {
		assert.equal(replaceCharacters(sample, replacements, FALLBACK_CHARACTER), getValidFilename(sample), JSON.stringify(sample));
	}
});

// this one is not a differential: the installed core still writes "null" or "undefined" into the
// name for a falsy entry that is not at the end of the table, so the two sides disagree here until
// a build installs a core carrying the fix
test("a replaced character with no replacement takes the fallback, wherever the table puts it", () => {
	const replacements = getReplacements({ filenameReplacedCharacters: ["#", "@"], filenameReplacementCharacters: ["", "＠"] });
	assert.equal(replaceCharacters("a##b@c", replacements, FALLBACK_CHARACTER), "a_b＠c");
});
