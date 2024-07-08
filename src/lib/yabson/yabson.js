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

export {
	getSerializer,
	getParser,
	registerType,
	clone,
	serialize,
	parse,
	serializeValue,
	serializeArray,
	serializeString,
	serializeTypedArray,
	serializeArrayBuffer,
	serializeNumber,
	serializeUint32,
	serializeInt32,
	serializeUint16,
	serializeInt16,
	serializeUint8,
	serializeInt8,
	serializeBoolean,
	serializeMap,
	serializeSet,
	serializeDate,
	serializeError,
	serializeRegExp,
	serializeStringObject,
	serializeNumberObject,
	serializeBooleanObject,
	serializeSymbol,
	parseValue,
	parseObject,
	parseArray,
	parseString,
	parseFloat64Array,
	parseFloat32Array,
	parseUint32Array,
	parseInt32Array,
	parseUint16Array,
	parseInt16Array,
	parseUint8ClampedArray,
	parseUint8Array,
	parseInt8Array,
	parseArrayBuffer,
	parseNumber,
	parseUint32,
	parseInt32,
	parseUint16,
	parseInt16,
	parseUint8,
	parseInt8,
	parseUndefined,
	parseNull,
	parseNaN,
	parseBoolean,
	parseMap,
	parseSet,
	parseDate,
	parseError,
	parseRegExp,
	parseStringObject,
	parseNumberObject,
	parseBooleanObject,
	parseSymbol,
	testObject,
	testArray,
	testString,
	testFloat64Array,
	testFloat32Array,
	testUint32Array,
	testInt32Array,
	testUint16Array,
	testInt16Array,
	testUint8ClampedArray,
	testUint8Array,
	testInt8Array,
	testArrayBuffer,
	testNumber,
	testBigInt,
	testUint32,
	testInt32,
	testUint16,
	testInt16,
	testUint8,
	testInt8,
	testInteger,
	testUndefined,
	testNull,
	testNaN,
	testBoolean,
	testMap,
	testSet,
	testDate,
	testError,
	testRegExp,
	testStringObject,
	testNumberObject,
	testBooleanObject,
	testSymbol
};

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

async function clone(object, options) {
	const serializer = getSerializer(object, options);
	const parser = getParser();
	let result;
	for await (const chunk of serializer) {
		result = await parser.next(chunk);
	}
	result = await parser.next();
	return result.value;
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

async function parse(array) {
	const parser = getParser();
	await parser.next(array);
	const result = await parser.next();
	return result.value;
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
			await this.append(new Uint8Array(array).subarray(0, offset));
			await this.appendData({ value: this.value });
			this.offset = 0;
			await this.append(new Uint8Array(array).subarray(offset));
		} else {
			this.value.set(array, this.offset);
			this.offset += array.length;
		}
	}

	async flush() {
		if (this.offset) {
			await this.appendData({ value: new Uint8Array(this.value).subarray(0, this.offset), done: true });
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
	if (!ArrayBuffer.isView(value)) {
		let entries = Object.entries(value);
		if (testArray(value)) {
			entries = entries.filter(([key]) => !testInteger(Number(key)));
		}
		await serializeValue(data, entries.length);
		for (const [key, value] of entries) {
			await serializeString(data, key);
			await serializeValue(data, value);
		}
	} else {
		await serializeValue(data, 0);
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
	await data.append(array.constructor.name == "Uint8Array" ? array : new Uint8Array(array.buffer));
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
			const pending = new Uint8Array(this.value).subarray(this.offset, this.value.length);
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
	return value.constructor.name == "Float64Array";
}

function testUint32Array(value) {
	return value.constructor.name == "Uint32Array";
}

function testInt32Array(value) {
	return value.constructor.name == "Int32Array";
}

function testUint16Array(value) {
	return value.constructor.name == "Uint16Array";
}

function testFloat32Array(value) {
	return value.constructor.name == "Float32Array";
}

function testInt16Array(value) {
	return value.constructor.name == "Int16Array";
}

function testUint8ClampedArray(value) {
	return value.constructor.name == "Uint8ClampedArray";
}

function testUint8Array(value) {
	return value.constructor.name == "Uint8Array";
}

function testInt8Array(value) {
	return value.constructor.name == "Int8Array";
}

function testArrayBuffer(value) {
	return value.constructor.name == "ArrayBuffer";
}

function testNumber(value) {
	return typeof value == "number";
}

function testBigInt(value) {
	return typeof value == "bigint";
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