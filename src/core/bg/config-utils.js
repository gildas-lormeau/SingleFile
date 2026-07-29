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

const REGEXP_RULE_PREFIX = "regexp:";

const MIGRATION_DEFAULT_VARIABLES_VALUES = {
	"page-title": "No title",
	"page-heading": "No heading",
	"page-language": "No language",
	"page-description": "No description",
	"page-author": "No author",
	"page-creator": "No creator",
	"page-publisher": "No publisher",
	"url-hash": "No hash",
	"url-host": "No host",
	"url-hostname": "No hostname",
	"url-href": "No href",
	"url-href-digest-sha-1": "No hash",
	"url-href-flat": "No href",
	"url-referrer": "No referrer",
	"url-referrer-flat": "No referrer",
	"url-password": "No password",
	"url-pathname": "No pathname",
	"url-pathname-flat": "No pathname",
	"url-port": "No port",
	"url-protocol": "No protocol",
	"url-search": "No search",
	"url-username": "No username",
	"tab-id": "No tab id",
	"tab-index": "No tab index",
	"url-last-segment": "No last segment"
};

const REGEXP_ESCAPE = /([{}()^$&.*?/+|[\\\\]|\]|-)/g;

function updateFilenameTemplate(template) {
	try {
		Object.keys(MIGRATION_DEFAULT_VARIABLES_VALUES).forEach(variable => {
			const value = MIGRATION_DEFAULT_VARIABLES_VALUES[variable];
			template = template.replaceAll(`{${variable}}`, `%if-empty<{${variable}}|${value}>`);
		});
		return template;
		// eslint-disable-next-line no-unused-vars
	} catch (error) {
		// ignored
	}
}

function sortRules(ruleLeft, ruleRight) {
	return ruleRight.url.length - ruleLeft.url.length;
}

function testRegExpRule(rule) {
	return rule.url.toLowerCase().startsWith(REGEXP_RULE_PREFIX);
}

function isSameArray(arrayLeft, arrayRight) {
	return arrayLeft.length == arrayRight.length && arrayLeft.every((value, index) => value == arrayRight[index]);
}

function encodeSharpCharacter(path) {
	return path.replace(/#/g, "%23");
}

function getRegExp(string) {
	return string.replace(REGEXP_ESCAPE, "\\$1");
}

export {
	REGEXP_RULE_PREFIX,
	MIGRATION_DEFAULT_VARIABLES_VALUES,
	REGEXP_ESCAPE,
	updateFilenameTemplate,
	sortRules,
	testRegExpRule,
	isSameArray,
	encodeSharpCharacter,
	getRegExp
};
