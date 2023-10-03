(function () {
	'use strict';

	/* global TextEncoder, TextDecoder */

	const DEFAULT_CHUNK_SIZE = 8 * 1024 * 1024;
	const TYPE_REFERENCE = 0;
	const SPECIAL_TYPES = [TYPE_REFERENCE];
	const EMPTY_SLOT_VALUE = Symbol();

	const textEncoder = new TextEncoder();
	const textDecoder = new TextDecoder();
	const types = new Array(256);
	let typeIndex = 0;

	registerType(serializeCircularReference, parseCircularReference, testCircularReference, TYPE_REFERENCE);
	registerType(null, parseObject, testObject);
	registerType(serializeArray, parseArray, testArray);
	registerType(serializeString, parseString, testString);
	registerType(serializeTypedArray, parseFloat64Array, testFloat64Array);
	registerType(serializeTypedArray, parseFloat32Array, testFloat32Array);
	registerType(serializeTypedArray, parseUint32Array, testUint32Array);
	registerType(serializeTypedArray, parseInt32Array, testInt32Array);
	registerType(serializeTypedArray, parseUint16Array, testUint16Array);
	registerType(serializeTypedArray, parseInt16Array, testInt16Array);
	registerType(serializeTypedArray, parseUint8ClampedArray, testUint8ClampedArray);
	registerType(serializeTypedArray, parseUint8Array, testUint8Array);
	registerType(serializeTypedArray, parseInt8Array, testInt8Array);
	registerType(serializeArrayBuffer, parseArrayBuffer, testArrayBuffer);
	registerType(serializeNumber, parseNumber, testNumber);
	registerType(serializeUint32, parseUint32, testUint32);
	registerType(serializeInt32, parseInt32, testInt32);
	registerType(serializeUint16, parseUint16, testUint16);
	registerType(serializeInt16, parseInt16, testInt16);
	registerType(serializeUint8, parseUint8, testUint8);
	registerType(serializeInt8, parseInt8, testInt8);
	registerType(null, parseUndefined, testUndefined);
	registerType(null, parseNull, testNull);
	registerType(null, parseNaN, testNaN);
	registerType(serializeBoolean, parseBoolean, testBoolean);
	registerType(serializeSymbol, parseSymbol, testSymbol);
	registerType(null, parseEmptySlot, testEmptySlot);
	registerType(serializeMap, parseMap, testMap);
	registerType(serializeSet, parseSet, testSet);
	registerType(serializeDate, parseDate, testDate);
	registerType(serializeError, parseError, testError);
	registerType(serializeRegExp, parseRegExp, testRegExp);
	registerType(serializeStringObject, parseStringObject, testStringObject);
	registerType(serializeNumberObject, parseNumberObject, testNumberObject);
	registerType(serializeBooleanObject, parseBooleanObject, testBooleanObject);

	function registerType(serialize, parse, test, type) {
		if (type === undefined) {
			typeIndex++;
			if (types.length - typeIndex >= SPECIAL_TYPES.length) {
				types[types.length - typeIndex] = { serialize, parse, test };
			} else {
				throw new Error("Reached maximum number of custom types");
			}
		} else {
			types[type] = { serialize, parse, test };
		}
	}

	async function serialize(object, options) {
		const serializer = getSerializer(object, options);
		let result = new Uint8Array([]);
		for await (const chunk of serializer) {
			const previousResult = result;
			result = new Uint8Array(previousResult.length + chunk.length);
			result.set(previousResult, 0);
			result.set(chunk, previousResult.length);
		}
		return result;
	}

	class SerializerData {
		constructor(appendData, chunkSize) {
			this.stream = new WriteStream(appendData, chunkSize);
			this.objects = [];
		}

		append(array) {
			return this.stream.append(array);
		}

		flush() {
			return this.stream.flush();
		}

		addObject(value) {
			this.objects.push(testReferenceable(value) && !testCircularReference(value, this) ? value : undefined);
		}
	}

	class WriteStream {
		constructor(appendData, chunkSize) {
			this.offset = 0;
			this.appendData = appendData;
			this.value = new Uint8Array(chunkSize);
		}

		async append(array) {
			if (this.offset + array.length > this.value.length) {
				const offset = this.value.length - this.offset;
				await this.append(array.subarray(0, offset));
				await this.appendData({ value: this.value });
				this.offset = 0;
				await this.append(array.subarray(offset));
			} else {
				this.value.set(array, this.offset);
				this.offset += array.length;
			}
		}

		async flush() {
			if (this.offset) {
				await this.appendData({ value: this.value.subarray(0, this.offset), done: true });
			}
		}
	}

	function getSerializer(value, { chunkSize = DEFAULT_CHUNK_SIZE } = {}) {
		let serializerData, result, setResult, iterationDone, previousResult, resolvePreviousResult;
		return {
			[Symbol.asyncIterator]() {
				return {
					next() {
						return iterationDone ? { done: iterationDone } : getResult();
					},
					return() {
						return { done: true };
					}
				};
			}
		};

		async function getResult() {
			if (resolvePreviousResult) {
				resolvePreviousResult();
			} else {
				initSerializerData().catch(() => { /* ignored */ });
			}
			initPreviousData();
			const value = await getValue();
			return { value };
		}

		async function initSerializerData() {
			initResult();
			serializerData = new SerializerData(appendData, chunkSize);
			await serializeValue(serializerData, value);
			await serializerData.flush();
		}

		function initResult() {
			result = new Promise(resolve => setResult = resolve);
		}

		function initPreviousData() {
			previousResult = new Promise(resolve => resolvePreviousResult = resolve);
		}

		async function appendData(result) {
			setResult(result);
			await previousResult;
		}

		async function getValue() {
			const { value, done } = await result;
			iterationDone = done;
			if (!done) {
				initResult();
			}
			return value;
		}
	}

	async function serializeValue(data, value) {
		const type = types.findIndex(({ test } = {}) => test && test(value, data));
		data.addObject(value);
		await data.append(new Uint8Array([type]));
		const serialize = types[type].serialize;
		if (serialize) {
			await serialize(data, value);
		}
		if (type != TYPE_REFERENCE && testObject(value)) {
			await serializeSymbols(data, value);
			await serializeOwnProperties(data, value);
		}
	}

	async function serializeSymbols(data, value) {
		const ownPropertySymbols = Object.getOwnPropertySymbols(value);
		const symbols = ownPropertySymbols.map(propertySymbol => [propertySymbol, value[propertySymbol]]);
		await serializeArray(data, symbols);
	}

	async function serializeOwnProperties(data, value) {
		let entries = Object.entries(value);
		if (testArray(value)) {
			entries = entries.filter(([key]) => !testInteger(Number(key)));
		}
		await serializeValue(data, entries.length);
		for (const [key, value] of entries) {
			await serializeString(data, key);
			await serializeValue(data, value);
		}
	}

	async function serializeCircularReference(data, value) {
		const index = data.objects.indexOf(value);
		await serializeValue(data, index);
	}

	async function serializeArray(data, array) {
		await serializeValue(data, array.length);
		const notEmptyIndexes = Object.keys(array).filter(key => testInteger(Number(key))).map(key => Number(key));
		let indexNotEmptyIndexes = 0, currentNotEmptyIndex = notEmptyIndexes[indexNotEmptyIndexes];
		for (const [indexArray, value] of array.entries()) {
			if (currentNotEmptyIndex == indexArray) {
				currentNotEmptyIndex = notEmptyIndexes[++indexNotEmptyIndexes];
				await serializeValue(data, value);
			} else {
				await serializeValue(data, EMPTY_SLOT_VALUE);
			}
		}
	}

	async function serializeString(data, string) {
		const encodedString = textEncoder.encode(string);
		await serializeValue(data, encodedString.length);
		await data.append(encodedString);
	}

	async function serializeTypedArray(data, array) {
		await serializeValue(data, array.length);
		await data.append(new Uint8Array(array.buffer));
	}

	async function serializeArrayBuffer(data, arrayBuffer) {
		await serializeValue(data, arrayBuffer.byteLength);
		await data.append(new Uint8Array(arrayBuffer));
	}

	async function serializeNumber(data, number) {
		const serializedNumber = new Uint8Array(new Float64Array([number]).buffer);
		await data.append(serializedNumber);
	}

	async function serializeUint32(data, number) {
		const serializedNumber = new Uint8Array(new Uint32Array([number]).buffer);
		await data.append(serializedNumber);
	}

	async function serializeInt32(data, number) {
		const serializedNumber = new Uint8Array(new Int32Array([number]).buffer);
		await data.append(serializedNumber);
	}

	async function serializeUint16(data, number) {
		const serializedNumber = new Uint8Array(new Uint16Array([number]).buffer);
		await data.append(serializedNumber);
	}

	async function serializeInt16(data, number) {
		const serializedNumber = new Uint8Array(new Int16Array([number]).buffer);
		await data.append(serializedNumber);
	}

	async function serializeUint8(data, number) {
		const serializedNumber = new Uint8Array([number]);
		await data.append(serializedNumber);
	}

	async function serializeInt8(data, number) {
		const serializedNumber = new Uint8Array(new Int8Array([number]).buffer);
		await data.append(serializedNumber);
	}

	async function serializeBoolean(data, boolean) {
		const serializedBoolean = new Uint8Array([Number(boolean)]);
		await data.append(serializedBoolean);
	}

	async function serializeMap(data, map) {
		const entries = map.entries();
		await serializeValue(data, map.size);
		for (const [key, value] of entries) {
			await serializeValue(data, key);
			await serializeValue(data, value);
		}
	}

	async function serializeSet(data, set) {
		await serializeValue(data, set.size);
		for (const value of set) {
			await serializeValue(data, value);
		}
	}

	async function serializeDate(data, date) {
		await serializeNumber(data, date.getTime());
	}

	async function serializeError(data, error) {
		await serializeString(data, error.message);
		await serializeString(data, error.stack);
	}

	async function serializeRegExp(data, regExp) {
		await serializeString(data, regExp.source);
		await serializeString(data, regExp.flags);
	}

	async function serializeStringObject(data, string) {
		await serializeString(data, string.valueOf());
	}

	async function serializeNumberObject(data, number) {
		await serializeNumber(data, number.valueOf());
	}

	async function serializeBooleanObject(data, boolean) {
		await serializeBoolean(data, boolean.valueOf());
	}

	async function serializeSymbol(data, symbol) {
		await serializeString(data, symbol.description);
	}

	class Reference {
		constructor(index, data) {
			this.index = index;
			this.data = data;
		}

		getObject() {
			return this.data.objects[this.index];
		}
	}

	class ParserData {
		constructor(consumeData) {
			this.stream = new ReadStream(consumeData);
			this.objects = [];
			this.setters = [];
		}

		consume(size) {
			return this.stream.consume(size);
		}

		getObjectId() {
			const objectIndex = this.objects.length;
			this.objects.push(undefined);
			return objectIndex;
		}

		resolveObject(objectId, value) {
			if (testReferenceable(value) && !testReference(value)) {
				this.objects[objectId] = value;
			}
		}

		setObject(functionArguments, setterFunction) {
			this.setters.push({ functionArguments, setterFunction });
		}

		executeSetters() {
			this.setters.forEach(({ functionArguments, setterFunction }) => {
				const resolvedArguments = functionArguments.map(argument => testReference(argument) ? argument.getObject() : argument);
				setterFunction(...resolvedArguments);
			});
		}
	}

	class ReadStream {
		constructor(consumeData) {
			this.offset = 0;
			this.value = new Uint8Array(0);
			this.consumeData = consumeData;
		}

		async consume(size) {
			if (this.offset + size > this.value.length) {
				const pending = this.value.subarray(this.offset, this.value.length);
				const value = await this.consumeData();
				if (pending.length + value.length != this.value.length) {
					this.value = new Uint8Array(pending.length + value.length);
				}
				this.value.set(pending);
				this.value.set(value, pending.length);
				this.offset = 0;
				return this.consume(size);
			} else {
				const result = this.value.slice(this.offset, this.offset + size);
				this.offset += result.length;
				return result;
			}
		}
	}

	function getParser() {
		let parserData, input, setInput, value, previousData, resolvePreviousData;
		return {
			async next(input) {
				return input ? getResult(input) : { value: await value, done: true };
			},
			return() {
				return { done: true };
			}
		};

		async function getResult(input) {
			if (previousData) {
				await previousData;
			} else {
				initParserData().catch(() => { /* ignored */ });
			}
			initPreviousData();
			setInput(input);
			return { done: false };
		}

		async function initParserData() {
			let setValue;
			value = new Promise(resolve => setValue = resolve);
			parserData = new ParserData(consumeData);
			initChunk();
			const data = await parseValue(parserData);
			parserData.executeSetters();
			setValue(data);
		}

		function initChunk() {
			input = new Promise(resolve => setInput = resolve);
		}

		function initPreviousData() {
			previousData = new Promise(resolve => resolvePreviousData = resolve);
		}

		async function consumeData() {
			const data = await input;
			initChunk();
			if (resolvePreviousData) {
				resolvePreviousData();
			}
			return data;
		}
	}

	async function parseValue(data) {
		const array = await data.consume(1);
		const parserType = array[0];
		const parse = types[parserType].parse;
		const valueId = data.getObjectId();
		const result = await parse(data);
		if (parserType != TYPE_REFERENCE && testObject(result)) {
			await parseSymbols(data, result);
			await parseOwnProperties(data, result);
		}
		data.resolveObject(valueId, result);
		return result;
	}

	async function parseSymbols(data, value) {
		const symbols = await parseArray(data);
		data.setObject([symbols], symbols => symbols.forEach(([symbol, propertyValue]) => value[symbol] = propertyValue));
	}

	async function parseOwnProperties(data, object) {
		const size = await parseValue(data);
		if (size) {
			await parseNextProperty();
		}

		async function parseNextProperty(indexKey = 0) {
			const key = await parseString(data);
			const value = await parseValue(data);
			data.setObject([value], value => object[key] = value);
			if (indexKey < size - 1) {
				await parseNextProperty(indexKey + 1);
			}
		}
	}

	async function parseCircularReference(data) {
		const index = await parseValue(data);
		const result = new Reference(index, data);
		return result;
	}

	function parseObject() {
		return {};
	}

	async function parseArray(data) {
		const length = await parseValue(data);
		const array = new Array(length);
		if (length) {
			await parseNextSlot();
		}
		return array;

		async function parseNextSlot(indexArray = 0) {
			const value = await parseValue(data);
			if (!testEmptySlot(value)) {
				data.setObject([value], value => array[indexArray] = value);
			}
			if (indexArray < length - 1) {
				await parseNextSlot(indexArray + 1);
			}
		}
	}

	function parseEmptySlot() {
		return EMPTY_SLOT_VALUE;
	}

	async function parseString(data) {
		const size = await parseValue(data);
		const array = await data.consume(size);
		return textDecoder.decode(array);
	}

	async function parseFloat64Array(data) {
		const length = await parseValue(data);
		const array = await data.consume(length * 8);
		return new Float64Array(array.buffer);
	}

	async function parseFloat32Array(data) {
		const length = await parseValue(data);
		const array = await data.consume(length * 4);
		return new Float32Array(array.buffer);
	}

	async function parseUint32Array(data) {
		const length = await parseValue(data);
		const array = await data.consume(length * 4);
		return new Uint32Array(array.buffer);
	}

	async function parseInt32Array(data) {
		const length = await parseValue(data);
		const array = await data.consume(length * 4);
		return new Int32Array(array.buffer);
	}

	async function parseUint16Array(data) {
		const length = await parseValue(data);
		const array = await data.consume(length * 2);
		return new Uint16Array(array.buffer);
	}

	async function parseInt16Array(data) {
		const length = await parseValue(data);
		const array = await data.consume(length * 2);
		return new Int16Array(array.buffer);
	}

	async function parseUint8ClampedArray(data) {
		const length = await parseValue(data);
		const array = await data.consume(length);
		return new Uint8ClampedArray(array.buffer);
	}

	async function parseUint8Array(data) {
		const length = await parseValue(data);
		const array = await data.consume(length);
		return array;
	}

	async function parseInt8Array(data) {
		const length = await parseValue(data);
		const array = await data.consume(length);
		return new Int8Array(array.buffer);
	}

	async function parseArrayBuffer(data) {
		const length = await parseValue(data);
		const array = await data.consume(length);
		return array.buffer;
	}

	async function parseNumber(data) {
		const array = await data.consume(8);
		return new Float64Array(array.buffer)[0];
	}

	async function parseUint32(data) {
		const array = await data.consume(4);
		return new Uint32Array(array.buffer)[0];
	}

	async function parseInt32(data) {
		const array = await data.consume(4);
		return new Int32Array(array.buffer)[0];
	}

	async function parseUint16(data) {
		const array = await data.consume(2);
		return new Uint16Array(array.buffer)[0];
	}

	async function parseInt16(data) {
		const array = await data.consume(2);
		return new Int16Array(array.buffer)[0];
	}

	async function parseUint8(data) {
		const array = await data.consume(1);
		return new Uint8Array(array.buffer)[0];
	}

	async function parseInt8(data) {
		const array = await data.consume(1);
		return new Int8Array(array.buffer)[0];
	}

	function parseUndefined() {
		return undefined;
	}

	function parseNull() {
		return null;
	}

	function parseNaN() {
		return NaN;
	}

	async function parseBoolean(data) {
		const array = await data.consume(1);
		return Boolean(array[0]);
	}

	async function parseMap(data) {
		const size = await parseValue(data);
		const map = new Map();
		if (size) {
			await parseNextEntry();
		}
		return map;

		async function parseNextEntry(indexKey = 0) {
			const key = await parseValue(data);
			const value = await parseValue(data);
			data.setObject([key, value], (key, value) => map.set(key, value));
			if (indexKey < size - 1) {
				await parseNextEntry(indexKey + 1);
			}
		}
	}

	async function parseSet(data) {
		const size = await parseValue(data);
		const set = new Set();
		if (size) {
			await parseNextEntry();
		}
		return set;

		async function parseNextEntry(indexKey = 0) {
			const value = await parseValue(data);
			data.setObject([value], value => set.add(value));
			if (indexKey < size - 1) {
				await parseNextEntry(indexKey + 1);
			}
		}
	}

	async function parseDate(data) {
		const milliseconds = await parseNumber(data);
		return new Date(milliseconds);
	}

	async function parseError(data) {
		const message = await parseString(data);
		const stack = await parseString(data);
		const error = new Error(message);
		error.stack = stack;
		return error;
	}

	async function parseRegExp(data) {
		const source = await parseString(data);
		const flags = await parseString(data);
		return new RegExp(source, flags);
	}

	async function parseStringObject(data) {
		return new String(await parseString(data));
	}

	async function parseNumberObject(data) {
		return new Number(await parseNumber(data));
	}

	async function parseBooleanObject(data) {
		return new Boolean(await parseBoolean(data));
	}

	async function parseSymbol(data) {
		const description = await parseString(data);
		return Symbol(description);
	}

	function testCircularReference(value, data) {
		return testObject(value) && data.objects.includes(value);
	}

	function testReference(value) {
		return value instanceof Reference;
	}

	function testObject(value) {
		return value === Object(value);
	}

	function testArray(value) {
		return typeof value.length == "number";
	}

	function testEmptySlot(value) {
		return value === EMPTY_SLOT_VALUE;
	}

	function testString(value) {
		return typeof value == "string";
	}

	function testFloat64Array(value) {
		return value instanceof Float64Array;
	}

	function testUint32Array(value) {
		return value instanceof Uint32Array;
	}

	function testInt32Array(value) {
		return value instanceof Int32Array;
	}

	function testUint16Array(value) {
		return value instanceof Uint16Array;
	}

	function testFloat32Array(value) {
		return value instanceof Float32Array;
	}

	function testInt16Array(value) {
		return value instanceof Int16Array;
	}

	function testUint8ClampedArray(value) {
		return value instanceof Uint8ClampedArray;
	}

	function testUint8Array(value) {
		return value instanceof Uint8Array;
	}

	function testInt8Array(value) {
		return value instanceof Int8Array;
	}

	function testArrayBuffer(value) {
		return value instanceof ArrayBuffer;
	}

	function testNumber(value) {
		return typeof value == "number";
	}

	function testUint32(value) {
		return testInteger(value) && value >= 0 && value <= 4294967295;
	}

	function testInt32(value) {
		return testInteger(value) && value >= -2147483648 && value <= 2147483647;
	}

	function testUint16(value) {
		return testInteger(value) && value >= 0 && value <= 65535;
	}

	function testInt16(value) {
		return testInteger(value) && value >= -32768 && value <= 32767;
	}

	function testUint8(value) {
		return testInteger(value) && value >= 0 && value <= 255;
	}

	function testInt8(value) {
		return testInteger(value) && value >= -128 && value <= 127;
	}

	function testInteger(value) {
		return testNumber(value) && Number.isInteger(value);
	}

	function testUndefined(value) {
		return value === undefined;
	}

	function testNull(value) {
		return value === null;
	}

	function testNaN(value) {
		return Number.isNaN(value);
	}

	function testBoolean(value) {
		return typeof value == "boolean";
	}

	function testMap(value) {
		return value instanceof Map;
	}

	function testSet(value) {
		return value instanceof Set;
	}

	function testDate(value) {
		return value instanceof Date;
	}

	function testError(value) {
		return value instanceof Error;
	}

	function testRegExp(value) {
		return value instanceof RegExp;
	}

	function testStringObject(value) {
		return value instanceof String;
	}

	function testNumberObject(value) {
		return value instanceof Number;
	}

	function testBooleanObject(value) {
		return value instanceof Boolean;
	}

	function testSymbol(value) {
		return typeof value == "symbol";
	}

	function testReferenceable(value) {
		return testObject(value) || testSymbol(value);
	}

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

	const MAX_CONTENT_SIZE = 32 * (1024 * 1024);

	async function downloadPage(pageData, options) {
		if (options.includeBOM) {
			pageData.content = "\ufeff" + pageData.content;
		}
		const message = {
			method: "downloads.download",
			taskId: options.taskId,
			insertTextBody: options.insertTextBody,
			confirmFilename: options.confirmFilename,
			filenameConflictAction: options.filenameConflictAction,
			filename: pageData.filename,
			saveToClipboard: options.saveToClipboard,
			saveToGDrive: options.saveToGDrive,
			saveWithWebDAV: options.saveWithWebDAV,
			webDAVURL: options.webDAVURL,
			webDAVUser: options.webDAVUser,
			webDAVPassword: options.webDAVPassword,
			saveToGitHub: options.saveToGitHub,
			githubToken: options.githubToken,
			githubUser: options.githubUser,
			githubRepository: options.githubRepository,
			githubBranch: options.githubBranch,
			saveWithCompanion: options.saveWithCompanion,
			forceWebAuthFlow: options.forceWebAuthFlow,
			filenameReplacementCharacter: options.filenameReplacementCharacter,
			openEditor: options.openEditor,
			openSavedPage: options.openSavedPage,
			compressHTML: options.compressHTML,
			backgroundSave: options.backgroundSave,
			bookmarkId: options.bookmarkId,
			replaceBookmarkURL: options.replaceBookmarkURL,
			applySystemTheme: options.applySystemTheme,
			defaultEditorMode: options.defaultEditorMode,
			includeInfobar: options.includeInfobar,
			warnUnsavedPage: options.warnUnsavedPage,
			createRootDirectory: options.createRootDirectory,
			selfExtractingArchive: options.selfExtractingArchive,
			extractDataFromPage: options.extractDataFromPage,
			insertCanonicalLink: options.insertCanonicalLink,
			insertMetaNoIndex: options.insertMetaNoIndex,
			password: options.password,
			compressContent: options.compressContent
		};
		if (options.compressContent) {
			const blobURL = URL.createObjectURL(new Blob([await serialize(pageData)], { type: "application/octet-stream" }));
			message.blobURL = blobURL;
			const result = await browser.runtime.sendMessage(message);
			URL.revokeObjectURL(blobURL);
			if (result.error) {
				message.blobURL = null;
				message.pageData = pageData;
				const serializer = getSerializer(message);
				for await (const data of serializer) {
					await browser.runtime.sendMessage({
						method: "downloads.download",
						compressContent: true,
						data: Array.from(data)
					});
				}
				await browser.runtime.sendMessage({
					method: "downloads.download",
					compressContent: true
				});
			}
			if (options.backgroundSave) {
				await browser.runtime.sendMessage({ method: "downloads.end", taskId: options.taskId });
			}
		} else {
			if (options.backgroundSave || options.openEditor || options.saveToGDrive || options.saveToGitHub || options.saveWithCompanion || options.saveWithWebDAV) {
				const blobURL = URL.createObjectURL(new Blob([pageData.content], { type: "text/html" }));
				message.blobURL = blobURL;
				const result = await browser.runtime.sendMessage(message);
				URL.revokeObjectURL(blobURL);
				if (result.error) {
					message.blobURL = null;
					for (let blockIndex = 0; blockIndex * MAX_CONTENT_SIZE < pageData.content.length; blockIndex++) {
						message.truncated = pageData.content.length > MAX_CONTENT_SIZE;
						if (message.truncated) {
							message.finished = (blockIndex + 1) * MAX_CONTENT_SIZE > pageData.content.length;
							message.content = pageData.content.substring(blockIndex * MAX_CONTENT_SIZE, (blockIndex + 1) * MAX_CONTENT_SIZE);
						} else {
							message.content = pageData.content;
						}
						await browser.runtime.sendMessage(message);
					}
				}
			} else {
				if (options.saveToClipboard) {
					saveToClipboard(pageData);
				} else {
					await downloadPageForeground(pageData);
				}
				if (options.openSavedPage) {
					open(URL.createObjectURL(new Blob([pageData.content], { type: "text/html" })));
				}
				browser.runtime.sendMessage({ method: "ui.processEnd" });
			}
			await browser.runtime.sendMessage({ method: "downloads.end", taskId: options.taskId, hash: pageData.hash, woleetKey: options.woleetKey });
		}
	}

	async function downloadPageForeground(pageData) {
		if (pageData.filename && pageData.filename.length) {
			const link = document.createElement("a");
			link.download = pageData.filename;
			link.href = URL.createObjectURL(new Blob([pageData.content], { type: "text/html" }));
			link.dispatchEvent(new MouseEvent("click"));
			setTimeout(() => URL.revokeObjectURL(link.href), 1000);
		}
		return new Promise(resolve => setTimeout(resolve, 1));
	}

	function saveToClipboard(page) {
		const command = "copy";
		document.addEventListener(command, listener);
		document.execCommand(command);
		document.removeEventListener(command, listener);

		function listener(event) {
			event.clipboardData.setData("text/html", page.content);
			event.clipboardData.setData("text/plain", page.content);
			event.preventDefault();
		}
	}

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

	/* global browser, window, CustomEvent, setTimeout, clearTimeout */

	const FETCH_REQUEST_EVENT = "single-file-request-fetch";
	const FETCH_ACK_EVENT = "single-file-ack-fetch";
	const FETCH_RESPONSE_EVENT = "single-file-response-fetch";
	const ERR_HOST_FETCH = "Host fetch error (SingleFile)";
	const HOST_FETCH_MAX_DELAY = 2500;
	const USE_HOST_FETCH = Boolean(window.wrappedJSObject);

	const addEventListener$1 = (type, listener, options) => window.addEventListener(type, listener, options);
	const dispatchEvent = event => window.dispatchEvent(event);
	const removeEventListener$1 = (type, listener, options) => window.removeEventListener(type, listener, options);

	const fetch = (url, options) => window.fetch(url, options);

	let requestId = 0, pendingResponses = new Map();

	browser.runtime.onMessage.addListener(message => {
		if (message.method == "singlefile.fetchFrame" && window.frameId && window.frameId == message.frameId) {
			return onFetchFrame(message);
		}
		if (message.method == "singlefile.fetchResponse") {
			return onFetchResponse(message);
		}
	});

	async function onFetchFrame(message) {
		try {
			const response = await fetch(message.url, { cache: "force-cache", headers: message.headers });
			return {
				status: response.status,
				headers: [...response.headers],
				array: Array.from(new Uint8Array(await response.arrayBuffer()))
			};
		} catch (error) {
			return {
				error: error && error.toString()
			};
		}
	}

	async function onFetchResponse(message) {
		const pendingResponse = pendingResponses.get(message.requestId);
		if (pendingResponse) {
			if (message.error) {
				pendingResponse.reject(new Error(message.error));
				pendingResponses.delete(message.requestId);
			} else {
				if (message.truncated) {
					if (pendingResponse.array) {
						pendingResponse.array = pendingResponse.array.concat(message.array);
					} else {
						pendingResponse.array = message.array;
						pendingResponses.set(message.requestId, pendingResponse);
					}
					if (message.finished) {
						message.array = pendingResponse.array;
					}
				}
				if (!message.truncated || message.finished) {
					pendingResponse.resolve({
						status: message.status,
						headers: { get: headerName => message.headers && message.headers[headerName] },
						arrayBuffer: async () => new Uint8Array(message.array).buffer
					});
					pendingResponses.delete(message.requestId);
				}
			}
		}
		return {};
	}

	async function hostFetch(url, options) {
		const result = new Promise((resolve, reject) => {
			dispatchEvent(new CustomEvent(FETCH_REQUEST_EVENT, { detail: JSON.stringify({ url, options }) }));
			addEventListener$1(FETCH_ACK_EVENT, onAckFetch, false);
			addEventListener$1(FETCH_RESPONSE_EVENT, onResponseFetch, false);
			const timeout = setTimeout(() => {
				removeListeners();
				reject(new Error(ERR_HOST_FETCH));
			}, HOST_FETCH_MAX_DELAY);

			function onResponseFetch(event) {
				if (event.detail) {
					if (event.detail.url == url) {
						removeListeners();
						if (event.detail.response) {
							resolve({
								status: event.detail.status,
								headers: new Map(event.detail.headers),
								arrayBuffer: async () => event.detail.response
							});
						} else {
							reject(event.detail.error);
						}
					}
				} else {
					reject();
				}
			}

			function onAckFetch() {
				clearTimeout(timeout);
			}

			function removeListeners() {
				removeEventListener$1(FETCH_RESPONSE_EVENT, onResponseFetch, false);
				removeEventListener$1(FETCH_ACK_EVENT, onAckFetch, false);
			}
		});
		try {
			return await result;
		} catch (error) {
			if (error && error.message == ERR_HOST_FETCH) {
				return fetch(url, options);
			} else {
				throw error;
			}
		}
	}

	async function fetchResource(url, options = {}) {
		try {
			const fetchOptions = { cache: "force-cache", headers: options.headers };
			return await (options.referrer && USE_HOST_FETCH ? hostFetch(url, fetchOptions) : fetch(url, fetchOptions));
		}
		catch (error) {
			requestId++;
			const promise = new Promise((resolve, reject) => pendingResponses.set(requestId, { resolve, reject }));
			await sendMessage({ method: "singlefile.fetch", url, requestId, referrer: options.referrer, headers: options.headers });
			return promise;
		}
	}

	async function frameFetch(url, options) {
		const response = await sendMessage({ method: "singlefile.fetchFrame", url, frameId: options.frameId, referrer: options.referrer, headers: options.headers });
		return {
			status: response.status,
			headers: new Map(response.headers),
			arrayBuffer: async () => new Uint8Array(response.array).buffer
		};
	}

	async function sendMessage(message) {
		const response = await browser.runtime.sendMessage(message);
		if (!response || response.error) {
			throw new Error(response && response.error && response.error.toString());
		} else {
			return response;
		}
	}

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

	/* global browser, document, globalThis, prompt, getComputedStyle, addEventListener, removeEventListener, requestAnimationFrame, setTimeout, getSelection, Node */

	const singlefile$2 = globalThis.singlefile;

	const SELECTED_CONTENT_ATTRIBUTE_NAME = singlefile$2.helper.SELECTED_CONTENT_ATTRIBUTE_NAME;

	const MASK_TAGNAME = "singlefile-mask";
	const MASK_CONTENT_CLASSNAME = "singlefile-mask-content";
	const PROGRESSBAR_CLASSNAME = "singlefile-progress-bar";
	const PROGRESSBAR_CONTENT_CLASSNAME = "singlefile-progress-bar-content";
	const SELECTION_ZONE_TAGNAME = "single-file-selection-zone";
	const LOGS_WINDOW_TAGNAME = "singlefile-logs-window";
	const LOGS_CLASSNAME = "singlefile-logs";
	const LOGS_LINE_CLASSNAME = "singlefile-logs-line";
	const LOGS_LINE_TEXT_ELEMENT_CLASSNAME = "singlefile-logs-line-text";
	const LOGS_LINE_STATUS_ELEMENT_CLASSNAME = "singlefile-logs-line-icon";
	const SINGLE_FILE_UI_ELEMENT_CLASS$1 = singlefile$2.helper.SINGLE_FILE_UI_ELEMENT_CLASS;
	const SELECT_PX_THRESHOLD = 8;
	const LOG_PANEL_DEFERRED_IMAGES_MESSAGE = browser.i18n.getMessage("logPanelDeferredImages");
	const LOG_PANEL_FRAME_CONTENTS_MESSAGE = browser.i18n.getMessage("logPanelFrameContents");
	const LOG_PANEL_STEP_MESSAGE = browser.i18n.getMessage("logPanelStep");
	const LOG_PANEL_WIDTH = browser.i18n.getMessage("logPanelWidth");
	const CSS_PROPERTIES$1 = new Set(Array.from(getComputedStyle(document.documentElement)));

	let selectedAreaElement, logsWindowElement;
	createLogsWindowElement();

	function promptMessage(message, defaultValue) {
		return prompt(message, defaultValue);
	}

	function onStartPage(options) {
		let maskElement = document.querySelector(MASK_TAGNAME);
		if (!maskElement) {
			if (options.logsEnabled) {
				document.documentElement.appendChild(logsWindowElement);
			}
			if (options.shadowEnabled) {
				const maskElement = createMaskElement();
				if (options.progressBarEnabled) {
					createProgressBarElement(maskElement);
				}
			}
		}
	}

	function onEndPage() {
		const maskElement = document.querySelector(MASK_TAGNAME);
		if (maskElement) {
			maskElement.remove();
		}
		logsWindowElement.remove();
		clearLogs();
	}

	function onLoadResource(index, maxIndex, options) {
		if (options.shadowEnabled && options.progressBarEnabled) {
			updateProgressBar(index, maxIndex);
		}
	}

	function onLoadingDeferResources(options) {
		updateLog("load-deferred-images", LOG_PANEL_DEFERRED_IMAGES_MESSAGE, "…", options);
	}

	function onLoadDeferResources(options) {
		updateLog("load-deferred-images", LOG_PANEL_DEFERRED_IMAGES_MESSAGE, "✓", options);
	}

	function onLoadingFrames(options) {
		updateLog("load-frames", LOG_PANEL_FRAME_CONTENTS_MESSAGE, "…", options);
	}

	function onLoadFrames(options) {
		updateLog("load-frames", LOG_PANEL_FRAME_CONTENTS_MESSAGE, "✓", options);
	}

	function onStartStage(step, options) {
		updateLog("step-" + step, `${LOG_PANEL_STEP_MESSAGE} ${step + 1} / 3`, "…", options);
	}

	function onEndStage(step, options) {
		updateLog("step-" + step, `${LOG_PANEL_STEP_MESSAGE} ${step + 1} / 3`, "✓", options);
	}

	function onStartStageTask() { }

	function onEndStageTask() { }

	function getSelectedLinks() {
		let selectionFound;
		const links = [];
		const selection = getSelection();
		for (let indexRange = 0; indexRange < selection.rangeCount; indexRange++) {
			let range = selection.getRangeAt(indexRange);
			if (range && range.commonAncestorContainer) {
				const treeWalker = document.createTreeWalker(range.commonAncestorContainer);
				let rangeSelectionFound = false;
				let finished = false;
				while (!finished) {
					if (rangeSelectionFound || treeWalker.currentNode == range.startContainer || treeWalker.currentNode == range.endContainer) {
						rangeSelectionFound = true;
						if (range.startContainer != range.endContainer || range.startOffset != range.endOffset) {
							selectionFound = true;
							if (treeWalker.currentNode.tagName == "A" && treeWalker.currentNode.href) {
								links.push(treeWalker.currentNode.href);
							}
						}
					}
					if (treeWalker.currentNode == range.endContainer) {
						finished = true;
					} else {
						treeWalker.nextNode();
					}
				}
				if (selectionFound && treeWalker.currentNode == range.endContainer && treeWalker.currentNode.querySelectorAll) {
					treeWalker.currentNode.querySelectorAll("*").forEach(descendantElement => {
						if (descendantElement.tagName == "A" && descendantElement.href) {
							links.push(treeWalker.currentNode.href);
						}
					});
				}
			}
		}
		return Array.from(new Set(links));
	}

	async function markSelection(optionallySelected) {
		let selectionFound = markSelectedContent();
		if (selectionFound || optionallySelected) {
			return selectionFound;
		} else {
			selectionFound = await selectArea();
			if (selectionFound) {
				return markSelectedContent();
			}
		}
	}

	function markSelectedContent() {
		const selection = getSelection();
		let selectionFound;
		for (let indexRange = 0; indexRange < selection.rangeCount; indexRange++) {
			let range = selection.getRangeAt(indexRange);
			if (range && range.commonAncestorContainer) {
				const treeWalker = document.createTreeWalker(range.commonAncestorContainer);
				let rangeSelectionFound = false;
				let finished = false;
				while (!finished) {
					if (rangeSelectionFound || treeWalker.currentNode == range.startContainer || treeWalker.currentNode == range.endContainer) {
						rangeSelectionFound = true;
						if (range.startContainer != range.endContainer || range.startOffset != range.endOffset) {
							selectionFound = true;
							markSelectedNode(treeWalker.currentNode);
						}
					}
					if (selectionFound && treeWalker.currentNode == range.startContainer) {
						markSelectedParents(treeWalker.currentNode);
					}
					if (treeWalker.currentNode == range.endContainer) {
						finished = true;
					} else {
						treeWalker.nextNode();
					}
				}
				if (selectionFound && treeWalker.currentNode == range.endContainer && treeWalker.currentNode.querySelectorAll) {
					treeWalker.currentNode.querySelectorAll("*").forEach(descendantElement => markSelectedNode(descendantElement));
				}
			}
		}
		return selectionFound;
	}

	function markSelectedNode(node) {
		const element = node.nodeType == Node.ELEMENT_NODE ? node : node.parentElement;
		element.setAttribute(SELECTED_CONTENT_ATTRIBUTE_NAME, "");
	}

	function markSelectedParents(node) {
		if (node.parentElement) {
			markSelectedNode(node);
			markSelectedParents(node.parentElement);
		}
	}

	function unmarkSelection() {
		document.querySelectorAll("[" + SELECTED_CONTENT_ATTRIBUTE_NAME + "]").forEach(selectedContent => selectedContent.removeAttribute(SELECTED_CONTENT_ATTRIBUTE_NAME));
	}

	function selectArea() {
		return new Promise(resolve => {
			let selectedRanges = [];
			addEventListener("mousemove", mousemoveListener, true);
			addEventListener("click", clickListener, true);
			addEventListener("keyup", keypressListener, true);
			document.addEventListener("contextmenu", contextmenuListener, true);
			getSelection().removeAllRanges();

			function contextmenuListener(event) {
				selectedRanges = [];
				select();
				event.preventDefault();
			}

			function mousemoveListener(event) {
				const targetElement = getTarget(event);
				if (targetElement) {
					selectedAreaElement = targetElement;
					moveAreaSelector(targetElement);
				}
			}

			function clickListener(event) {
				event.preventDefault();
				event.stopPropagation();
				if (event.button == 0) {
					select(selectedAreaElement, event.ctrlKey);
				} else {
					cancel();
				}
			}

			function keypressListener(event) {
				if (event.key == "Escape") {
					cancel();
				}
			}

			function cancel() {
				if (selectedRanges.length) {
					getSelection().removeAllRanges();
				}
				selectedRanges = [];
				cleanupAndResolve();
			}

			function select(selectedElement, multiSelect) {
				if (selectedElement) {
					if (!multiSelect) {
						restoreSelectedRanges();
					}
					const range = document.createRange();
					range.selectNodeContents(selectedElement);
					cleanupSelectionRanges();
					getSelection().addRange(range);
					saveSelectedRanges();
					if (!multiSelect) {
						cleanupAndResolve();
					}
				} else {
					cleanupAndResolve();
				}
			}

			function cleanupSelectionRanges() {
				const selection = getSelection();
				for (let indexRange = selection.rangeCount - 1; indexRange >= 0; indexRange--) {
					const range = selection.getRangeAt(indexRange);
					if (range.startOffset == range.endOffset) {
						selection.removeRange(range);
						indexRange--;
					}
				}
			}

			function cleanupAndResolve() {
				getAreaSelector().remove();
				removeEventListener("mousemove", mousemoveListener, true);
				removeEventListener("click", clickListener, true);
				removeEventListener("keyup", keypressListener, true);
				selectedAreaElement = null;
				resolve(Boolean(selectedRanges.length));
				setTimeout(() => document.removeEventListener("contextmenu", contextmenuListener, true), 0);
			}

			function restoreSelectedRanges() {
				getSelection().removeAllRanges();
				selectedRanges.forEach(range => getSelection().addRange(range));
			}

			function saveSelectedRanges() {
				selectedRanges = [];
				for (let indexRange = 0; indexRange < getSelection().rangeCount; indexRange++) {
					const range = getSelection().getRangeAt(indexRange);
					selectedRanges.push(range);
				}
			}
		});
	}

	function getTarget(event) {
		let newTarget, target = event.target, boundingRect = target.getBoundingClientRect();
		newTarget = determineTargetElement("floor", target, event.clientX - boundingRect.left, getMatchedParents(target, "left"));
		if (newTarget == target) {
			newTarget = determineTargetElement("ceil", target, boundingRect.left + boundingRect.width - event.clientX, getMatchedParents(target, "right"));
		}
		if (newTarget == target) {
			newTarget = determineTargetElement("floor", target, event.clientY - boundingRect.top, getMatchedParents(target, "top"));
		}
		if (newTarget == target) {
			newTarget = determineTargetElement("ceil", target, boundingRect.top + boundingRect.height - event.clientY, getMatchedParents(target, "bottom"));
		}
		target = newTarget;
		while (target && target.clientWidth <= SELECT_PX_THRESHOLD && target.clientHeight <= SELECT_PX_THRESHOLD) {
			target = target.parentElement;
		}
		return target;
	}

	function moveAreaSelector(target) {
		requestAnimationFrame(() => {
			const selectorElement = getAreaSelector();
			const boundingRect = target.getBoundingClientRect();
			const scrollingElement = document.scrollingElement || document.documentElement;
			selectorElement.style.setProperty("top", (scrollingElement.scrollTop + boundingRect.top - 10) + "px");
			selectorElement.style.setProperty("left", (scrollingElement.scrollLeft + boundingRect.left - 10) + "px");
			selectorElement.style.setProperty("width", (boundingRect.width + 20) + "px");
			selectorElement.style.setProperty("height", (boundingRect.height + 20) + "px");
		});
	}

	function getAreaSelector() {
		let selectorElement = document.querySelector(SELECTION_ZONE_TAGNAME);
		if (!selectorElement) {
			selectorElement = createElement$1(SELECTION_ZONE_TAGNAME, document.body);
			selectorElement.style.setProperty("box-sizing", "border-box", "important");
			selectorElement.style.setProperty("background-color", "#3ea9d7", "important");
			selectorElement.style.setProperty("border", "10px solid #0b4892", "important");
			selectorElement.style.setProperty("border-radius", "2px", "important");
			selectorElement.style.setProperty("opacity", ".25", "important");
			selectorElement.style.setProperty("pointer-events", "none", "important");
			selectorElement.style.setProperty("position", "absolute", "important");
			selectorElement.style.setProperty("transition", "all 100ms", "important");
			selectorElement.style.setProperty("cursor", "pointer", "important");
			selectorElement.style.setProperty("z-index", "2147483647", "important");
			selectorElement.style.removeProperty("border-inline-end");
			selectorElement.style.removeProperty("border-inline-start");
			selectorElement.style.removeProperty("inline-size");
			selectorElement.style.removeProperty("block-size");
			selectorElement.style.removeProperty("inset-block-start");
			selectorElement.style.removeProperty("inset-inline-end");
			selectorElement.style.removeProperty("inset-block-end");
			selectorElement.style.removeProperty("inset-inline-start");
		}
		return selectorElement;
	}

	function createMaskElement() {
		try {
			let maskElement = document.querySelector(MASK_TAGNAME);
			if (!maskElement) {
				maskElement = createElement$1(MASK_TAGNAME, document.documentElement);
				const shadowRoot = maskElement.attachShadow({ mode: "open" });
				const styleElement = document.createElement("style");
				styleElement.textContent = `
				@keyframes single-file-progress { 
					0% { 
						left: -50px;
					} 
					100% { 
						left: 0;
					}
				}
				.${PROGRESSBAR_CLASSNAME} {
					position: fixed;
					top: 0;
					left: 0;
					width: 0;
					height: 8px;
					z-index: 2147483646;
					opacity: .5;
					overflow: hidden;					
					transition: width 200ms ease-in-out;
				}
				.${PROGRESSBAR_CONTENT_CLASSNAME} {
					position: absolute;
					left: 0;
					animation: single-file-progress 3s linear infinite reverse;
					background: 
						white 
						linear-gradient(-45deg, rgba(0, 0, 0, 0.075) 25%, 
							transparent 25%, 
							transparent 50%, 
							rgba(0, 0, 0, 0.075) 50%, 
							rgba(0, 0, 0, 0.075) 75%, 
							transparent 75%, transparent)
						repeat scroll 0% 0% / 50px 50px padding-box border-box;
					width: calc(100% + 50px);
					height: 100%;					
				}
				.${MASK_CONTENT_CLASSNAME} {
					position: fixed;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					z-index: 2147483646;
					opacity: 0;
					background-color: black;
					transition: opacity 250ms;
				}
			`;
				shadowRoot.appendChild(styleElement);
				let maskElementContent = document.createElement("div");
				maskElementContent.classList.add(MASK_CONTENT_CLASSNAME);
				shadowRoot.appendChild(maskElementContent);
				maskElement.offsetWidth;
				maskElementContent.style.setProperty("opacity", .3);
				maskElement.offsetWidth;
			}
			return maskElement;
		} catch (error) {
			// ignored
		}
	}

	function createProgressBarElement(maskElement) {
		try {
			let progressBarElement = maskElement.shadowRoot.querySelector("." + PROGRESSBAR_CLASSNAME);
			if (!progressBarElement) {
				let progressBarContent = document.createElement("div");
				progressBarContent.classList.add(PROGRESSBAR_CLASSNAME);
				maskElement.shadowRoot.appendChild(progressBarContent);
				const progressBarContentElement = document.createElement("div");
				progressBarContentElement.classList.add(PROGRESSBAR_CONTENT_CLASSNAME);
				progressBarContent.appendChild(progressBarContentElement);
			}
		} catch (error) {
			// ignored
		}
	}

	function createLogsWindowElement() {
		try {
			logsWindowElement = document.querySelector(LOGS_WINDOW_TAGNAME);
			if (!logsWindowElement) {
				logsWindowElement = createElement$1(LOGS_WINDOW_TAGNAME);
				const shadowRoot = logsWindowElement.attachShadow({ mode: "open" });
				const styleElement = document.createElement("style");
				styleElement.textContent = `
				@keyframes single-file-pulse { 
					0% { 
						opacity: .25;
					} 
					100% { 
						opacity: 1;
					} 
				}
				.${LOGS_CLASSNAME} {
					position: fixed;
					bottom: 24px;
					left: 8px;
					z-index: 2147483647;
					opacity: 0.9;
					padding: 4px;
					background-color: white;
					min-width: ${LOG_PANEL_WIDTH}px;
					min-height: 16px;
					transition: height 100ms;
				}
				.${LOGS_LINE_CLASSNAME} {
					display: flex;
					justify-content: space-between;
					padding: 2px;
					font-family: arial, sans-serif;
					color: black;
					background-color: white;
				}
				.${LOGS_LINE_TEXT_ELEMENT_CLASSNAME} {
					font-size: 13px;
					opacity: 1;
					transition: opacity 200ms;
				}
				.${LOGS_LINE_STATUS_ELEMENT_CLASSNAME} {
					font-size: 11px;
					min-width: 15px;
					text-align: center;
					position: relative;
					top: 1px;
				}
			`;
				shadowRoot.appendChild(styleElement);
				const logsContentElement = document.createElement("div");
				logsContentElement.classList.add(LOGS_CLASSNAME);
				shadowRoot.appendChild(logsContentElement);
			}
		} catch (error) {
			// ignored
		}
	}

	function updateLog(id, textContent, textStatus, options) {
		try {
			if (options.logsEnabled) {
				const logsContentElement = logsWindowElement.shadowRoot.querySelector("." + LOGS_CLASSNAME);
				let lineElement = logsContentElement.querySelector("[data-id='" + id + "']");
				if (!lineElement) {
					lineElement = document.createElement("div");
					lineElement.classList.add(LOGS_LINE_CLASSNAME);
					logsContentElement.appendChild(lineElement);
					lineElement.setAttribute("data-id", id);
					const textElement = document.createElement("div");
					textElement.classList.add(LOGS_LINE_TEXT_ELEMENT_CLASSNAME);
					lineElement.appendChild(textElement);
					textElement.textContent = textContent;
					const statusElement = document.createElement("div");
					statusElement.classList.add(LOGS_LINE_STATUS_ELEMENT_CLASSNAME);
					lineElement.appendChild(statusElement);
				}
				updateLogLine(lineElement, textContent, textStatus);
			}
		} catch (error) {
			// ignored
		}
	}

	function updateLogLine(lineElement, textContent, textStatus) {
		const textElement = lineElement.childNodes[0];
		const statusElement = lineElement.childNodes[1];
		textElement.textContent = textContent;
		statusElement.style.setProperty("color", textStatus == "✓" ? "#055000" : "black");
		if (textStatus == "✓") {
			textElement.style.setProperty("opacity", ".5");
			statusElement.style.setProperty("opacity", ".5");
			statusElement.style.setProperty("animation", "none");
		} else {
			statusElement.style.setProperty("animation", "1s ease-in-out 0s infinite alternate none running single-file-pulse");
		}
		statusElement.textContent = textStatus;
	}

	function updateProgressBar(index, maxIndex) {
		try {
			const maskElement = document.querySelector(MASK_TAGNAME);
			if (maskElement) {
				const progressBarElement = maskElement.shadowRoot.querySelector("." + PROGRESSBAR_CLASSNAME);
				if (progressBarElement && maxIndex) {
					const width = Math.floor((index / maxIndex) * 100) + "%";
					if (progressBarElement.style.getPropertyValue("width") != width) {
						progressBarElement.style.setProperty("width", width);
						progressBarElement.offsetWidth;
					}
				}
			}
		} catch (error) {
			// ignored
		}
	}

	function clearLogs() {
		createLogsWindowElement();
	}

	function getMatchedParents(target, property) {
		let element = target, matchedParent, parents = [];
		do {
			const boundingRect = element.getBoundingClientRect();
			if (element.parentElement) {
				const parentBoundingRect = element.parentElement.getBoundingClientRect();
				matchedParent = Math.abs(parentBoundingRect[property] - boundingRect[property]) <= SELECT_PX_THRESHOLD;
				if (matchedParent) {
					if (element.parentElement.clientWidth > SELECT_PX_THRESHOLD && element.parentElement.clientHeight > SELECT_PX_THRESHOLD &&
						((element.parentElement.clientWidth - element.clientWidth > SELECT_PX_THRESHOLD) || (element.parentElement.clientHeight - element.clientHeight > SELECT_PX_THRESHOLD))) {
						parents.push(element.parentElement);
					}
					element = element.parentElement;
				}
			} else {
				matchedParent = false;
			}
		} while (matchedParent && element);
		return parents;
	}

	function determineTargetElement(roundingMethod, target, widthDistance, parents) {
		if (Math[roundingMethod](widthDistance / SELECT_PX_THRESHOLD) <= parents.length) {
			target = parents[parents.length - Math[roundingMethod](widthDistance / SELECT_PX_THRESHOLD) - 1];
		}
		return target;
	}

	function createElement$1(tagName, parentElement) {
		const element = document.createElement(tagName);
		element.className = SINGLE_FILE_UI_ELEMENT_CLASS$1;
		if (parentElement) {
			parentElement.appendChild(element);
		}
		CSS_PROPERTIES$1.forEach(property => element.style.setProperty(property, "initial", "important"));
		return element;
	}

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

	/* global document, globalThis, getComputedStyle */

	const singlefile$1 = globalThis.singlefile;

	const CLOSE_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABhmlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AYht+mSlUqHewg4hChOogFURFHqWIRLJS2QqsOJpf+CE0akhQXR8G14ODPYtXBxVlXB1dBEPwBcXNzUnSREr9LCi1ivOO4h/e+9+XuO0Col5lqdowDqmYZqXhMzOZWxMAruhGiOYohiZl6Ir2Qgef4uoeP73dRnuVd9+foVfImA3wi8SzTDYt4nXh609I57xOHWUlSiM+Jxwy6IPEj12WX3zgXHRZ4ZtjIpOaIw8RisY3lNmYlQyWeIo4oqkb5QtZlhfMWZ7VcZc178hcG89pymuu0BhHHIhJIQoSMKjZQhoUo7RopJlJ0HvPwDzj+JLlkcm2AkWMeFaiQHD/4H/zurVmYnHCTgjGg88W2P4aBwC7QqNn297FtN04A/zNwpbX8lTow80l6raVFjoDQNnBx3dLkPeByB+h/0iVDciQ/LaFQAN7P6JtyQN8t0LPq9q15jtMHIEO9WroBDg6BkSJlr3m8u6u9b//WNPv3A6mTcr3f/E/sAAAABmJLR0QAigCKAIrj2uckAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAB3RJTUUH5QkPDysvCdPVuwAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAELSURBVHja7ZpLFsIwDAPj3v/OsGHDe1BIa8tKO7Mnlkw+dpoxAAAAAGCfx4ur6Yx/B337UUS4mp/VuWUEcjSfOgO+BXCZCWe0hSqQo/npBLglIUNLdAV2MH84Ad1JyIwdLkK6YoabIHWscBWmihHuAqvHtv+XqmdXOK9TxdKy3axUm2vZkXXGgPJksTuz1bVFeeU2Y6ijsLIpXbtKa1kDs2ews69o7+A+ihJ2lvI+/lcS1G21zUVG18XKNm4OS4BNkGOQQohSmGaIdpgLESvzyiRwKepsXjE2H0ZWMF8Zi4+jK5mviM0DiRXNZ2rhkdTK5jO0xermz2o8dCnq+FS2XNNVH0sDAAAA3JYnre9cH8BZmhEAAAAASUVORK5CYII=";

	const SINGLE_FILE_UI_ELEMENT_CLASS = singlefile$1.helper.SINGLE_FILE_UI_ELEMENT_CLASS;
	const ERROR_BAR_TAGNAME = "singlefile-error-bar";

	const CSS_PROPERTIES = new Set(Array.from(getComputedStyle(document.documentElement)));

	let errorBarElement;

	function onError(message, link) {
		try {
			console.error("SingleFile", message, link); // eslint-disable-line no-console
			errorBarElement = document.querySelector(ERROR_BAR_TAGNAME);
			if (!errorBarElement) {
				errorBarElement = createElement(ERROR_BAR_TAGNAME);
				const shadowRoot = errorBarElement.attachShadow({ mode: "open" });
				const styleElement = document.createElement("style");
				styleElement.textContent = `
				.container {
					background-color: #ff6c00;
					color: white;
					display: flex;
					position: fixed;
					top: 0px;
					left: 0px;
					right: 0px;
					height: auto;
					width: auto;
					min-height: 24px;
					min-width: 24px;					
					z-index: 2147483647;
					margin: 0;
					padding: 2px;
					font-family: Arial;
				}
				.text {
					flex: 1;
					padding-top: 4px;
					padding-bottom: 4px;
					padding-left: 8px;					
				}
				.close-button {
					opacity: .7;
					padding-top: 4px;
					padding-left: 8px;
					padding-right: 8px;
					cursor: pointer;
					transition: opacity 250ms;
					height: 16px;
				}
				a {
					color: #303036;
				}
				.close-button:hover {
					opacity: 1;
				}
			`;
				shadowRoot.appendChild(styleElement);
				const containerElement = document.createElement("div");
				containerElement.className = "container";
				const errorTextElement = document.createElement("span");
				errorTextElement.classList.add("text");
				const content = message.split("__DOC_LINK__");
				errorTextElement.textContent = "SingleFile error: " + content[0];
				if (link && content.length == 2) {
					const linkElement = document.createElement("a");
					linkElement.textContent = link;
					linkElement.href = link;
					linkElement.target = "_blank";
					errorTextElement.appendChild(linkElement);
					errorTextElement.appendChild(document.createTextNode(content[1]));
				}
				containerElement.appendChild(errorTextElement);
				const closeElement = document.createElement("img");
				closeElement.classList.add("close-button");
				containerElement.appendChild(closeElement);
				shadowRoot.appendChild(containerElement);
				closeElement.src = CLOSE_ICON;
				closeElement.onclick = event => {
					if (event.button === 0) {
						errorBarElement.remove();
					}
				};
				document.body.appendChild(errorBarElement);
			}
		} catch (error) {
			// iignored
		}
	}

	function createElement(tagName, parentElement) {
		const element = document.createElement(tagName);
		element.className = SINGLE_FILE_UI_ELEMENT_CLASS;
		if (parentElement) {
			parentElement.appendChild(element);
		}
		CSS_PROPERTIES.forEach(property => element.style.setProperty(property, "initial", "important"));
		return element;
	}

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

	const singlefile = globalThis.singlefile;
	const bootstrap = globalThis.singlefileBootstrap;

	const MOZ_EXTENSION_PROTOCOL = "moz-extension:";

	let processor, processing, downloadParser;

	if (!bootstrap || !bootstrap.initializedSingleFile) {
		singlefile.init({ fetch: fetchResource, frameFetch });
		browser.runtime.onMessage.addListener(message => {
			if (message.method == "content.save" || message.method == "content.cancelSave" || message.method == "content.download" || message.method == "content.getSelectedLinks" || message.method == "content.error" || message.method == "content.prompt") {
				return onMessage(message);
			}
		});
		if (bootstrap) {
			bootstrap.initializedSingleFile = true;
		} else {
			globalThis.singlefileBootstrap = { initializedSingleFile: true };
		}
	}

	async function onMessage(message) {
		if (!location.href.startsWith(MOZ_EXTENSION_PROTOCOL)) {
			if (message.method == "content.save") {
				await savePage(message);
				return {};
			}
			if (message.method == "content.cancelSave") {
				if (processor) {
					processor.cancel();
					onEndPage();
					browser.runtime.sendMessage({ method: "ui.processCancelled" });
				}
				if (message.options.loadDeferredImages) {
					singlefile.processors.lazy.resetZoomLevel(message.options);
				}
				return {};
			}
			if (message.method == "content.getSelectedLinks") {
				return {
					urls: getSelectedLinks()
				};
			}
			if (message.method == "content.download") {
				if (!downloadParser) {
					downloadParser = getParser();
				}
				const result = await downloadParser.next(message.data);
				if (result.done) {
					downloadParser = null;
					const link = document.createElement("a");
					link.download = result.value.filename;
					link.href = URL.createObjectURL(new Blob([result.value.content]), "text/html");
					link.dispatchEvent(new MouseEvent("click"));
					URL.revokeObjectURL(link.href);
					await browser.runtime.sendMessage({ method: "downloads.end", taskId: result.value.taskId });
				}
				return {};
			}
			if (message.method == "content.error") {
				onError(message.error, message.link);
				return {};
			}
			if (message.method == "content.prompt") {
				return promptMessage(message.message, message.value);
			}
		}
	}

	async function savePage(message) {
		const options = message.options;
		let selectionFound;
		if (options.selected || options.optionallySelected) {
			selectionFound = await markSelection(options.optionallySelected);
		}
		if (!processing && (!bootstrap || !bootstrap.pageInfo.processing)) {
			options.updatedResources = bootstrap ? bootstrap.pageInfo.updatedResources : {};
			options.visitDate = bootstrap ? bootstrap.pageInfo.visitDate : new Date();
			Object.keys(options.updatedResources).forEach(url => options.updatedResources[url].retrieved = false);
			if (options.optionallySelected && selectionFound) {
				options.selected = true;
			}
			if (!options.selected || selectionFound) {
				if (bootstrap) {
					bootstrap.pageInfo.processing = true;
				}
				processing = true;
				try {
					const pageData = await processPage(options);
					if (pageData) {
						if (((!options.backgroundSave && !options.saveToClipboard) || options.saveToGDrive || options.saveToGitHub || options.saveWithCompanion || options.saveWithWebDAV) && options.confirmFilename) {
							pageData.filename = promptMessage("Save as", pageData.filename) || pageData.filename;
						}
						await downloadPage(pageData, options);
					}
				} catch (error) {
					if (!processor.cancelled) {
						console.error(error); // eslint-disable-line no-console
						browser.runtime.sendMessage({ method: "ui.processError", error });
					}
				}
			} else {
				browser.runtime.sendMessage({ method: "ui.processCancelled" });
			}
			processing = false;
			if (bootstrap) {
				bootstrap.pageInfo.processing = false;
			}
		}
	}

	async function processPage(options) {
		const frames = singlefile.processors.frameTree;
		let framesSessionId;
		options.keepFilename = options.saveToGDrive || options.saveToGitHub || options.saveWithWebDAV;
		singlefile.helper.initDoc(document);
		onStartPage(options);
		processor = new singlefile.SingleFile(options);
		const preInitializationPromises = [];
		options.insertCanonicalLink = true;
		let index = 0, maxIndex = 0;
		options.onprogress = event => {
			if (!processor.cancelled) {
				if (event.type == event.RESOURCES_INITIALIZED) {
					maxIndex = event.detail.max;
					if (options.loadDeferredImages) {
						singlefile.processors.lazy.resetZoomLevel(options);
					}
				}
				if (event.type == event.RESOURCES_INITIALIZED || event.type == event.RESOURCE_LOADED) {
					if (event.type == event.RESOURCE_LOADED) {
						index++;
					}
					browser.runtime.sendMessage({ method: "ui.processProgress", index, maxIndex });
					onLoadResource(index, maxIndex, options);
				} else if (!event.detail.frame) {
					if (event.type == event.PAGE_LOADING) ; else if (event.type == event.PAGE_LOADED) ; else if (event.type == event.STAGE_STARTED) {
						if (event.detail.step < 3) {
							onStartStage(event.detail.step, options);
						}
					} else if (event.type == event.STAGE_ENDED) {
						if (event.detail.step < 3) {
							onEndStage(event.detail.step, options);
						}
					} else if (event.type == event.STAGE_TASK_STARTED) {
						onStartStageTask(event.detail.step, event.detail.task);
					} else if (event.type == event.STAGE_TASK_ENDED) {
						onEndStageTask(event.detail.step, event.detail.task);
					}
				}
			}
		};
		const cancelProcessor = processor.cancel.bind(processor);
		if (!options.saveRawPage) {
			let lazyLoadPromise;
			if (options.loadDeferredImages) {
				lazyLoadPromise = singlefile.processors.lazy.process(options);
				onLoadingDeferResources(options);
				lazyLoadPromise.then(() => {
					if (!processor.cancelled) {
						onLoadDeferResources(options);
					}
				});
				if (options.loadDeferredImagesBeforeFrames) {
					await lazyLoadPromise;
				}
			}
			if (!options.removeFrames && frames && globalThis.frames) {
				let frameTreePromise;
				if (options.loadDeferredImages) {
					frameTreePromise = new Promise(resolve => globalThis.setTimeout(() => resolve(frames.getAsync(options)), options.loadDeferredImagesBeforeFrames || !options.loadDeferredImages ? 0 : options.loadDeferredImagesMaxIdleTime));
				} else {
					frameTreePromise = frames.getAsync(options);
				}
				onLoadingFrames(options);
				frameTreePromise.then(() => {
					if (!processor.cancelled) {
						onLoadFrames(options);
					}
				});
				if (options.loadDeferredImagesBeforeFrames) {
					options.frames = await new Promise(resolve => {
						processor.cancel = function () {
							cancelProcessor();
							resolve([]);
						};
						frameTreePromise.then(resolve);
					});
				} else {
					preInitializationPromises.push(frameTreePromise);
				}
			}
			if (options.loadDeferredImages && !options.loadDeferredImagesBeforeFrames) {
				preInitializationPromises.push(lazyLoadPromise);
			}
		}
		if (!options.loadDeferredImagesBeforeFrames) {
			[options.frames] = await new Promise(resolve => {
				const preInitializationAllPromises = Promise.all(preInitializationPromises);
				processor.cancel = function () {
					cancelProcessor();
					resolve([[]]);
				};
				preInitializationAllPromises.then(() => resolve(preInitializationAllPromises));
			});
		}
		framesSessionId = options.frames && options.frames.sessionId;
		const selectedFrame = options.frames && options.frames.find(frameData => frameData.requestedFrame);
		options.win = globalThis;
		if (selectedFrame) {
			options.content = selectedFrame.content;
			options.url = selectedFrame.baseURI;
			options.canvases = selectedFrame.canvases;
			options.fonts = selectedFrame.fonts;
			options.stylesheets = selectedFrame.stylesheets;
			options.images = selectedFrame.images;
			options.posters = selectedFrame.posters;
			options.videos = selectedFrame.videos;
			options.usedFonts = selectedFrame.usedFonts;
			options.shadowRoots = selectedFrame.shadowRoots;
			options.adoptedStyleSheets = selectedFrame.adoptedStyleSheets;
		} else {
			options.doc = document;
		}
		if (!processor.cancelled) {
			await processor.run();
		}
		if (framesSessionId) {
			frames.cleanup(framesSessionId);
		}
		let page;
		if (!processor.cancelled) {
			if (options.confirmInfobarContent) {
				options.infobarContent = promptMessage("Infobar content", options.infobarContent) || "";
			}
			page = await processor.getPageData();
			if (options.selected || options.optionallySelected) {
				unmarkSelection();
			}
			onEndPage();
			if (options.displayStats) {
				console.log("SingleFile stats"); // eslint-disable-line no-console
				console.table(page.stats); // eslint-disable-line no-console
			}
		}
		return page;
	}

})();
