/*
 * Copyright 2010-2020 Gildas Lormeau
 * contact : gildas.lormeau <at> gmail.com
 *
 * This file is part of SingleFile.
 *
 *   The code in this file is free software: you can redistribute it and/or
 *   modify it under the terms of the GNU Affero General Public License
 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
 *   of the License, or (at your option) any later version.
 *
 *   The code in this file is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero
 *   General Public License for more details.
 *
 *   As additional permission under GNU AGPL version 3 section 7, you may
 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU
 *   AGPL normally required by section 4, provided you include this license
 *   notice and a URL through which recipients can access the Corresponding
 *   Source.
 */

const ESCAPED_CHARACTER_REGEXP = /\\x([0-9a-fA-F]{2})/g;
const CHARACTER_CLASS_SPECIAL_CHARACTERS = ["[", "]", "^", "-", "\\"];
const HEXADECIMAL_RADIX = 16;
const CHARACTER_CODE_DIGITS = 2;
const FIRST_PRINTABLE_CHARACTER_CODE = 0x20;
const DELETE_CHARACTER_CODE = 0x7f;

export {
	getReplacements,
	getReplacedCharactersOptions,
	replaceCharacters,
	formatCharacters,
	parseCharacters,
	testCharacters
};

function getReplacements({ filenameReplacedCharacters = [], filenameReplacementCharacters = [] }) {
	return filenameReplacedCharacters.map((characters, index) => ({
		characters,
		replacement: filenameReplacementCharacters[index] === undefined ? "" : filenameReplacementCharacters[index]
	}));
}

function getReplacedCharactersOptions(replacements) {
	const definedReplacementsFirst = replacements
		.filter(({ characters }) => characters)
		.sort((firstReplacement, secondReplacement) => (secondReplacement.replacement ? 1 : 0) - (firstReplacement.replacement ? 1 : 0));
	const filenameReplacementCharacters = [];
	for (const { replacement } of definedReplacementsFirst) {
		if (!replacement) {
			break;
		}
		filenameReplacementCharacters.push(replacement);
	}
	return {
		filenameReplacedCharacters: definedReplacementsFirst.map(({ characters }) => characters),
		filenameReplacementCharacters
	};
}

function replaceCharacters(filename, replacements, replacementCharacter) {
	replacements.forEach(({ characters, replacement }) => {
		if (replacement && replacement != characters) {
			filename = replaceMatchingCharacters(filename, characters, "", replacement);
		}
	});
	replacements.forEach(({ characters, replacement }) => {
		if (!replacement) {
			filename = replaceMatchingCharacters(filename, characters, "+", replacementCharacter);
		}
	});
	return filename;
}

function formatCharacters(characters) {
	return Array.from(String(characters)).map(character => {
		const characterCode = character.charCodeAt(0);
		return characterCode < FIRST_PRINTABLE_CHARACTER_CODE || characterCode == DELETE_CHARACTER_CODE
			? "\\x" + characterCode.toString(HEXADECIMAL_RADIX).padStart(CHARACTER_CODE_DIGITS, "0")
			: character;
	}).join("");
}

function parseCharacters(characters) {
	return String(characters).replace(ESCAPED_CHARACTER_REGEXP, (match, characterCode) => String.fromCharCode(parseInt(characterCode, HEXADECIMAL_RADIX)));
}

function testCharacters(characters) {
	try {
		getCharacterClass(characters, "");
		return true;
		// eslint-disable-next-line no-unused-vars
	} catch (error) {
		return false;
	}
}

function replaceMatchingCharacters(filename, characters, quantifier, replacement) {
	try {
		return filename.replace(getCharacterClass(characters, quantifier), replacement);
		// eslint-disable-next-line no-unused-vars
	} catch (error) {
		return filename;
	}
}

function getCharacterClass(characters, quantifier) {
	const classContent = characters.length == 1 && CHARACTER_CLASS_SPECIAL_CHARACTERS.includes(characters) ? "\\" + characters : characters;
	return new RegExp("[" + classContent + "]" + quantifier, "g");
}
