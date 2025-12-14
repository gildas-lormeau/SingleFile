(function () {
	'use strict';

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

	/* global document, getComputedStyle, FileReader, Image, OffscreenCanvas, createImageBitmap */

	const singlefile$1 = globalThis.singlefile;

	const CLOSE_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABhmlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AYht+mSlUqHewg4hChOogFURFHqWIRLJS2QqsOJpf+CE0akhQXR8G14ODPYtXBxVlXB1dBEPwBcXNzUnSREr9LCi1ivOO4h/e+9+XuO0Col5lqdowDqmYZqXhMzOZWxMAruhGiOYohiZl6Ir2Qgef4uoeP73dRnuVd9+foVfImA3wi8SzTDYt4nXh609I57xOHWUlSiM+Jxwy6IPEj12WX3zgXHRZ4ZtjIpOaIw8RisY3lNmYlQyWeIo4oqkb5QtZlhfMWZ7VcZc178hcG89pymuu0BhHHIhJIQoSMKjZQhoUo7RopJlJ0HvPwDzj+JLlkcm2AkWMeFaiQHD/4H/zurVmYnHCTgjGg88W2P4aBwC7QqNn297FtN04A/zNwpbX8lTow80l6raVFjoDQNnBx3dLkPeByB+h/0iVDciQ/LaFQAN7P6JtyQN8t0LPq9q15jtMHIEO9WroBDg6BkSJlr3m8u6u9b//WNPv3A6mTcr3f/E/sAAAABmJLR0QAigCKAIrj2uckAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAB3RJTUUH5QkPDysvCdPVuwAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAELSURBVHja7ZpLFsIwDAPj3v/OsGHDe1BIa8tKO7Mnlkw+dpoxAAAAAGCfx4ur6Yx/B337UUS4mp/VuWUEcjSfOgO+BXCZCWe0hSqQo/npBLglIUNLdAV2MH84Ad1JyIwdLkK6YoabIHWscBWmihHuAqvHtv+XqmdXOK9TxdKy3axUm2vZkXXGgPJksTuz1bVFeeU2Y6ijsLIpXbtKa1kDs2ews69o7+A+ihJ2lvI+/lcS1G21zUVG18XKNm4OS4BNkGOQQohSmGaIdpgLESvzyiRwKepsXjE2H0ZWMF8Zi4+jK5mviM0DiRXNZ2rhkdTK5jO0xermz2o8dCnq+FS2XNNVH0sDAAAA3JYnre9cH8BZmhEAAAAASUVORK5CYII=";

	const SINGLE_FILE_UI_ELEMENT_CLASS$1 = singlefile$1.helper.SINGLE_FILE_UI_ELEMENT_CLASS;
	const SHARE_PAGE_BAR_TAGNAME = "singlefile-share-page-bar";
	let EMBEDDED_IMAGE_BUTTON_MESSAGE$1, SHARE_PAGE_BUTTON_MESSAGE$1, SHARE_SELECTION_BUTTON_MESSAGE$1, ERROR_TITLE_MESSAGE$1;

	const CSS_PROPERTIES$1 = new Set(Array.from(getComputedStyle(document.documentElement)));

	function setLabels(labels) {
		({ EMBEDDED_IMAGE_BUTTON_MESSAGE: EMBEDDED_IMAGE_BUTTON_MESSAGE$1, SHARE_PAGE_BUTTON_MESSAGE: SHARE_PAGE_BUTTON_MESSAGE$1, SHARE_SELECTION_BUTTON_MESSAGE: SHARE_SELECTION_BUTTON_MESSAGE$1, ERROR_TITLE_MESSAGE: ERROR_TITLE_MESSAGE$1 } = labels);
	}

	function getSharePageBar() {
		let resolvePromise;
		return {
			display: async function (selectedContent) {
				return new Promise(resolve => {
					resolvePromise = resolve;
					displayBar(SHARE_PAGE_BAR_TAGNAME, "", {
						buttonLabel: selectedContent ? SHARE_SELECTION_BUTTON_MESSAGE$1 : SHARE_PAGE_BUTTON_MESSAGE$1,
						buttonOnclick: resolve
					});
				});
			},
			hide: function () {
				const barElement = document.querySelector(SHARE_PAGE_BAR_TAGNAME);
				if (barElement) {
					barElement.remove();
				}
			},
			cancel: function () {
				this.hide();
				if (resolvePromise) {
					resolvePromise(true);
				}
			}
		};
	}

	function displayBar(tagName, message, { link, buttonLabel, buttonOnclick } = {}) {
		try {
			const barElement = document.querySelector(tagName);
			if (!barElement) {
				const barElement = createElement$1(tagName);
				const shadowRoot = barElement.attachShadow({ mode: "open" });
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
				.singlefile-open-file-bar.container, .singlefile-share-page-bar.container {
					background-color: gainsboro;
					border-block-end: gray 1px solid;
				}
				.text {
					flex: 1;
					padding-top: 4px;
					padding-bottom: 4px;
					padding-left: 8px;					
				}
				button {
					background-color: grey;
					color: white;
					border: 1px solid darkgrey;
					padding: 3px;
					padding-left: 8px;
					padding-right: 8px;
					border-radius: 4px;
					cursor: pointer;
				}
				.close-button {
					opacity: .7;
					padding-left: 8px;
					padding-right: 8px;
					cursor: pointer;
					transition: opacity 250ms;
					height: 16px;
					font-size: .8rem;
					align-self: center;
				}
				.singlefile-open-file-bar button, .singlefile-share-page-bar button{
					background-color: dimgrey;
				}
				.singlefile-open-file-bar .close-button, .singlefile-share-page-bar .close-button{
					filter: invert(1);
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
				containerElement.classList.add(tagName);
				containerElement.classList.add("container");
				const textElement = document.createElement("span");
				textElement.classList.add("text");
				const content = message.split("__DOC_LINK__");
				textElement.textContent = content[0];
				if (link && content.length == 2) {
					const linkElement = document.createElement("a");
					linkElement.textContent = link;
					linkElement.href = link;
					linkElement.target = "_blank";
					textElement.appendChild(linkElement);
					textElement.appendChild(document.createTextNode(content[1]));
				}
				if (buttonLabel && buttonOnclick) {
					const buttonElement = document.createElement("button");
					buttonElement.textContent = buttonLabel;
					buttonElement.onclick = () => buttonOnclick();
					textElement.appendChild(buttonElement);
				}
				containerElement.appendChild(textElement);
				const closeElement = document.createElement("img");
				closeElement.classList.add("close-button");
				containerElement.appendChild(closeElement);
				shadowRoot.appendChild(containerElement);
				closeElement.src = CLOSE_ICON;
				closeElement.onclick = event => {
					if (event.button === 0) {
						if (buttonOnclick) {
							buttonOnclick(true);
						}
						barElement.remove();
					}
				};
				document.documentElement.appendChild(barElement);
			}
			// eslint-disable-next-line no-unused-vars
		} catch (error) {
			// iignored
		}
	}

	function createElement$1(tagName, parentElement) {
		const element = document.createElement(tagName);
		element.className = SINGLE_FILE_UI_ELEMENT_CLASS$1;
		CSS_PROPERTIES$1.forEach(property => element.style.setProperty(property, "initial", "important"));
		return element;
	}

	/* global TextEncoder, TextDecoder */

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

	/* global browser, document, prompt, getComputedStyle, addEventListener, removeEventListener, requestAnimationFrame, setTimeout, getSelection, Node, URL */

	const singlefile = globalThis.singlefile;

	singlefile.helper.SELECTED_CONTENT_ATTRIBUTE_NAME;
	const LOGS_WINDOW_TAGNAME = "singlefile-logs-window";
	const LOGS_CLASSNAME = "singlefile-logs";
	const LOGS_LINE_CLASSNAME = "singlefile-logs-line";
	const LOGS_LINE_TEXT_ELEMENT_CLASSNAME = "singlefile-logs-line-text";
	const LOGS_LINE_STATUS_ELEMENT_CLASSNAME = "singlefile-logs-line-icon";
	const SINGLE_FILE_UI_ELEMENT_CLASS = singlefile.helper.SINGLE_FILE_UI_ELEMENT_CLASS;
	const CSS_PROPERTIES = new Set(Array.from(getComputedStyle(document.documentElement)));
	let LOG_PANEL_WIDTH, LOG_PANEL_DEFERRED_IMAGES_MESSAGE, LOG_PANEL_FRAME_CONTENTS_MESSAGE, LOG_PANEL_EMBEDDED_IMAGE_MESSAGE, LOG_PANEL_STEP_MESSAGE;
	try {
		LOG_PANEL_WIDTH = browser.i18n.getMessage("logPanelWidth");
		LOG_PANEL_DEFERRED_IMAGES_MESSAGE = browser.i18n.getMessage("logPanelDeferredImages");
		LOG_PANEL_FRAME_CONTENTS_MESSAGE = browser.i18n.getMessage("logPanelFrameContents");
		LOG_PANEL_EMBEDDED_IMAGE_MESSAGE = browser.i18n.getMessage("logPanelEmbeddedImage");
		LOG_PANEL_STEP_MESSAGE = browser.i18n.getMessage("logPanelStep");
		// eslint-disable-next-line no-unused-vars
	} catch (error) {
		// ignored
	}

	let logsWindowElement;
	createLogsWindowElement();

	function promptMessage(message, defaultValue) {
		return prompt(message, defaultValue);
	}

	function createLogsWindowElement() {
		try {
			logsWindowElement = document.querySelector(LOGS_WINDOW_TAGNAME);
			if (!logsWindowElement) {
				logsWindowElement = createElement(LOGS_WINDOW_TAGNAME);
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
			// eslint-disable-next-line no-unused-vars
		} catch (error) {
			// ignored
		}
	}

	function createElement(tagName, parentElement) {
		const element = document.createElement(tagName);
		element.className = SINGLE_FILE_UI_ELEMENT_CLASS;
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


	let EMBEDDED_IMAGE_BUTTON_MESSAGE, SHARE_PAGE_BUTTON_MESSAGE, SHARE_SELECTION_BUTTON_MESSAGE, ERROR_TITLE_MESSAGE;

	try {
		EMBEDDED_IMAGE_BUTTON_MESSAGE = browser.i18n.getMessage("topPanelEmbeddedImageButton");
		SHARE_PAGE_BUTTON_MESSAGE = browser.i18n.getMessage("topPanelSharePageButton");
		SHARE_SELECTION_BUTTON_MESSAGE = browser.i18n.getMessage("topPanelShareSelectionButton");
		ERROR_TITLE_MESSAGE = browser.i18n.getMessage("topPanelError");
		// eslint-disable-next-line no-unused-vars
	} catch (error) {
		// ignored
	}

	let sharePageBar;
	setLabels({
		EMBEDDED_IMAGE_BUTTON_MESSAGE,
		SHARE_PAGE_BUTTON_MESSAGE,
		SHARE_SELECTION_BUTTON_MESSAGE,
		ERROR_TITLE_MESSAGE
	});

	async function downloadPageForeground(pageData, options) {
		if (Array.isArray(pageData.content)) {
			pageData.content = new Uint8Array(pageData.content);
		}
		if (options.sharePage && navigator.share) {
			await sharePage(pageData, options);
		} else {
			let filename = pageData.filename;
			if (options.confirmFilename) {
				filename = promptMessage("Save as", pageData.filename);
				if (filename) {
					pageData.filename = filename;
				} else {
					browser.runtime.sendMessage({ method: "downloads.cancel" });
					browser.runtime.sendMessage({ method: "ui.processCancelled" });
				}
			}
			if (filename) {
				const link = document.createElement("a");
				link.download = pageData.filename;
				link.href = URL.createObjectURL(new Blob([pageData.content], { type: pageData.mimeType }));
				link.dispatchEvent(new MouseEvent("click"));
				return new Promise(resolve => setTimeout(() => { URL.revokeObjectURL(link.href); resolve(); }, 1000));
			}
		}
	}

	async function sharePage(pageData, options) {
		sharePageBar = getSharePageBar();
		const cancelled = await sharePageBar.display(options.selected);
		if (!cancelled) {
			const data = { files: [new File([pageData.content], pageData.filename, { type: pageData.mimeType })] };
			try {
				await navigator.share(data);
				sharePageBar.hide();
			} catch (error) {
				sharePageBar.hide();
				if (error.name === "AbortError") {
					await sharePage(pageData, options);
				} else {
					throw error;
				}
			}
		}
	}

	/* global URL, TextDecoder, TextEncoder, btoa, atob */

	const EVENT_HANDLER_ATTRIBUTES = [
	    "onafterprint",
	    "onbeforeprint",
	    "onbeforeunload",
	    "onhashchange",
	    "onlanguagechange",
	    "onmessage",
	    "onmessageerror",
	    "onoffline",
	    "ononline",
	    "onpagehide",
	    "onpageshow",
	    "onpopstate",
	    "onrejectionhandled",
	    "onstorage",
	    "onunhandledrejection",
	    "onunload",
	    "ongamepadconnected",
	    "ongamepaddisconnected",
	    "onabort",
	    "onblur",
	    "onfocus",
	    "oncancel",
	    "onauxclick",
	    "onbeforeinput",
	    "onbeforetoggle",
	    "oncanplay",
	    "oncanplaythrough",
	    "onchange",
	    "onclick",
	    "onclose",
	    "oncontentvisibilityautostatechange",
	    "oncontextlost",
	    "oncontextmenu",
	    "oncontextrestored",
	    "oncopy",
	    "oncuechange",
	    "oncut",
	    "ondblclick",
	    "ondrag",
	    "ondragend",
	    "ondragenter",
	    "ondragleave",
	    "ondragover",
	    "ondragstart",
	    "ondrop",
	    "ondurationchange",
	    "onemptied",
	    "onended",
	    "onformdata",
	    "oninput",
	    "oninvalid",
	    "onkeydown",
	    "onkeypress",
	    "onkeyup",
	    "onload",
	    "onloadeddata",
	    "onloadedmetadata",
	    "onloadstart",
	    "onmousedown",
	    "onmouseenter",
	    "onmouseleave",
	    "onmousemove",
	    "onmouseout",
	    "onmouseover",
	    "onmouseup",
	    "onwheel",
	    "onpaste",
	    "onpause",
	    "onplay",
	    "onplaying",
	    "onprogress",
	    "onratechange",
	    "onreset",
	    "onresize",
	    "onscroll",
	    "onscrollend",
	    "onsecuritypolicyviolation",
	    "onseeked",
	    "onseeking",
	    "onselect",
	    "onslotchange",
	    "onstalled",
	    "onsubmit",
	    "onsuspend",
	    "ontimeupdate",
	    "onvolumechange",
	    "onwaiting",
	    "onselectstart",
	    "onselectionchange",
	    "ontoggle",
	    "onpointercancel",
	    "onpointerdown",
	    "onpointerup",
	    "onpointermove",
	    "onpointerout",
	    "onpointerover",
	    "onpointerenter",
	    "onpointerleave",
	    "ongotpointercapture",
	    "onlostpointercapture",
	    "onanimationcancel",
	    "onanimationend",
	    "onanimationiteration",
	    "onanimationstart",
	    "ontransitioncancel",
	    "ontransitionend",
	    "ontransitionrun",
	    "ontransitionstart",
	    "onerror",
	    "onfullscreenchange",
	    "onfullscreenerror"
	];

	function decodeQuotedPrintable(array) {
	    const result = [];
	    for (let i = 0; i < array.length; i++) {
	        if (array[i] === 0x3D) {
	            if (isHex(array[i + 1]) && isHex(array[i + 2])) {
	                const hex = parseInt(String.fromCharCode(array[i + 1], array[i + 2]), 16);
	                result.push(hex);
	                i += 2;
	            } else {
	                result.push(array[i]);
	            }
	        } else {
	            result.push(array[i]);
	        }
	    }
	    return new Uint8Array(result);

	    function isHex(value) {
	        return value >= 0x30 && value <= 0x39 || value >= 0x41 && value <= 0x46;
	    }
	}

	function decodeBinary(array) {
	    let data = "";
	    for (let indexData = 0; indexData < array.length; indexData++) {
	        data += String.fromCharCode(array[indexData]);
	    }
	    return btoa(data);
	}

	function decodeBase64(value, charset) {
	    const decodedData = new Uint8Array(atob(value).split("").map(char => char.charCodeAt(0)));
	    return new TextDecoder(charset).decode(decodedData);
	}

	function decodeMimeHeader(encodedSubject) {
	    if (encodedSubject && encodedSubject.startsWith("=?") && encodedSubject.endsWith("?=")) {
	        const encodedSubjectParts = [];
	        let index = 0;
	        while (index < encodedSubject.length) {
	            const start = encodedSubject.indexOf("=?", index);
	            if (start === -1) {
	                break;
	            }
	            const endCharset = encodedSubject.indexOf("?", start + 2);
	            if (endCharset === -1) {
	                break;
	            }
	            const charset = encodedSubject.substring(start + 2, endCharset);
	            const endEncoding = encodedSubject.indexOf("?", endCharset + 1);
	            if (endEncoding === -1) {
	                break;
	            }
	            const encoding = encodedSubject.substring(endCharset + 1, endEncoding);
	            const endValue = encodedSubject.indexOf("?=", endEncoding + 1);
	            if (endValue === -1) {
	                break;
	            }
	            const value = encodedSubject.substring(endEncoding + 1, endValue);
	            index = endValue + 2;
	            if (encoding === "Q") {
	                encodedSubjectParts.push(new TextDecoder(charset).decode(decodeQuotedPrintable(new TextEncoder().encode(value))));
	            } else if (encoding === "B") {
	                encodedSubjectParts.push(decodeBase64(value, charset));
	            }
	        }
	        encodedSubject = encodedSubjectParts.join("");
	    }
	    return encodedSubject || "";
	}

	function parseDOM(asset, contentType = "text/html", DOMParser = globalThis.DOMParser) {
	    let document;
	    try {
	        document = new DOMParser().parseFromString(asset, contentType);
	        // eslint-disable-next-line no-unused-vars
	    } catch (_) {
	        document = new DOMParser().parseFromString(asset, "text/html");
	    }
	    return {
	        document,
	        serialize() {
	            let result = "";
	            if (this.document.doctype) {
	                result += serializeDocType(this.document.doctype) + "\n";
	            }
	            result += this.document.documentElement.outerHTML;
	            return result;
	        }
	    };
	}

	function serializeDocType(doctype) {
	    return `<!DOCTYPE ${doctype.name}${(doctype.publicId ? ` PUBLIC "${doctype.publicId}"` : "")}${(doctype.systemId ? ` "${doctype.systemId}"` : "")}>`;
	}

	function decodeString(array, charset) {
	    return new TextDecoder(charset).decode(array);
	}

	function encodeString(string, charset) {
	    return new TextEncoder(charset).encode(string);
	}

	function getCharset(contentType) {
	    const charsetMatch = contentType.match(/charset=([^;]+)/);
	    if (charsetMatch) {
	        return removeQuotes(charsetMatch[1]).toLowerCase();
	    }
	}

	function removeQuotes(value) {
	    return value.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1").trim();
	}

	function replaceCharset(contentType, charset) {
	    return contentType.replace(/charset=([^;]+)/, `charset=${charset}`);
	}

	function isDocument(contentType) {
	    return contentType.startsWith("text/html") || contentType.startsWith("application/xhtml+xml");
	}

	function isStylesheet(contentType) {
	    return contentType.startsWith("text/css");
	}

	function isText(contentType) {
	    return contentType.startsWith("text/");
	}

	function isMultipartAlternative(contentType) {
	    return contentType.startsWith("multipart/alternative");
	}

	function getBoundary(contentType) {
	    const contentTypeParams = contentType.split(";");
	    contentTypeParams.shift();
	    const boundaryParam = contentTypeParams.find(param => param.startsWith("boundary="));
	    if (boundaryParam) {
	        return removeQuotes(boundaryParam.substring(9));
	    }
	}

	function indexOf(array, string) {
	    const stringBytes = new TextEncoder().encode(string);
	    for (let i = 0; i < array.length; i++) {
	        if (array[i] === stringBytes[0]) {
	            let match = true;
	            for (let j = 1; j < stringBytes.length; j++) {
	                if (array[i + j] !== stringBytes[j]) {
	                    match = false;
	                    break;
	                }
	            }
	            if (match) {
	                // return index
	                return i;
	            }
	        }
	    }
	    return -1;
	}

	function isLineFeed(array) {
	    return array.length == 2 ? array[0] == 0x0D && array[1] == 0x0A : array.length == 1 ? array[0] == 0x0A : false;
	}

	function endsWithCRLF(array) {
	    return array.length >= 2 ? array[array.length - 2] == 0x0D && array[array.length - 1] == 0x0A : array.length >= 1 ? array[array.length - 1] == 0x0D : false;
	}

	function endsWithLF(array) {
	    return array.length >= 1 ? array[array.length - 1] == 0x0A : false;
	}

	function startsWithBoundary(array) {
	    return array.length >= 2 ? array[0] == 0x2D && array[1] == 0x2D : false;
	}

	function getResourceURI({ contentType, transferEncoding, data }) {
	    return `data:${contentType};${"base64"},${transferEncoding === "base64" ? data : btoa(unescape(encodeURIComponent(data)))}`;
	}

	function resolvePath(path, base) {
	    if (base && !path.startsWith("data:")) {
	        try {
	            return new URL(path, base).href;
	            // eslint-disable-next-line no-unused-vars
	        } catch (_) {
	            if (path.startsWith("//")) {
	                const protocol = base.match(/^[^:]+/);
	                if (protocol) {
	                    return `${protocol[0]}:${path}`;
	                } else {
	                    return path;
	                }
	            } else {
	                return path;
	            }
	        }
	    } else {
	        return path;
	    }
	}

	// dist/csstree.esm.js from https://github.com/csstree/csstree/tree/b3fe3e026ce131aa559427162451a60792589730

	/*
	 * Copyright (C) 2016-2024 by Roman Dvornov
	 * 
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 * 
	 * The above copyright notice and this permission notice shall be included in
	 * all copies or substantial portions of the Software.
	 * 
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	 * THE SOFTWARE.
	 */

	var Ra=Object.create;var or=Object.defineProperty;var Fa=Object.getOwnPropertyDescriptor;var Ma=Object.getOwnPropertyNames;var Ba=Object.getPrototypeOf,_a=Object.prototype.hasOwnProperty;var Me=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports),f=(e,t)=>{for(var r in t)or(e,r,{get:t[r],enumerable:true});},Wa=(e,t,r,n)=>{if(t&&typeof t=="object"||typeof t=="function")for(let i of Ma(t))!_a.call(e,i)&&i!==r&&or(e,i,{get:()=>t[i],enumerable:!(n=Fa(t,i))||n.enumerable});return e};var qa=(e,t,r)=>(r=e!=null?Ra(Ba(e)):{},Wa(or(r,"default",{value:e,enumerable:true}),e));var So=Me(fr=>{var vo="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");fr.encode=function(e){if(0<=e&&e<vo.length)return vo[e];throw new TypeError("Must be between 0 and 63: "+e)};fr.decode=function(e){var t=65,r=90,n=97,i=122,o=48,s=57,u=43,c=47,a=26,l=52;return t<=e&&e<=r?e-t:n<=e&&e<=i?e-n+a:o<=e&&e<=s?e-o+l:e==u?62:e==c?63:-1};});var Eo=Me(br=>{var Co=So(),gr=5,To=1<<gr,Ao=To-1,Lo=To;function Za(e){return e<0?(-e<<1)+1:(e<<1)+0}function Ja(e){var t=(e&1)===1,r=e>>1;return t?-r:r}br.encode=function(t){var r="",n,i=Za(t);do n=i&Ao,i>>>=gr,i>0&&(n|=Lo),r+=Co.encode(n);while(i>0);return r};br.decode=function(t,r,n){var i=t.length,o=0,s=0,u,c;do{if(r>=i)throw new Error("Expected more digits in base 64 VLQ value.");if(c=Co.decode(t.charCodeAt(r++)),c===-1)throw new Error("Invalid base64 digit: "+t.charAt(r-1));u=!!(c&Lo),c&=Ao,o=o+(c<<s),s+=gr;}while(u);n.value=Ja(o),n.rest=r;};});var Rt=Me(W=>{function el(e,t,r){if(t in e)return e[t];if(arguments.length===3)return r;throw new Error('"'+t+'" is a required argument.')}W.getArg=el;var zo=/^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/,tl=/^data:.+\,.+$/;function lt(e){var t=e.match(zo);return t?{scheme:t[1],auth:t[2],host:t[3],port:t[4],path:t[5]}:null}W.urlParse=lt;function Ge(e){var t="";return e.scheme&&(t+=e.scheme+":"),t+="//",e.auth&&(t+=e.auth+"@"),e.host&&(t+=e.host),e.port&&(t+=":"+e.port),e.path&&(t+=e.path),t}W.urlGenerate=Ge;var rl=32;function nl(e){var t=[];return function(r){for(var n=0;n<t.length;n++)if(t[n].input===r){var i=t[0];return t[0]=t[n],t[n]=i,t[0].result}var o=e(r);return t.unshift({input:r,result:o}),t.length>rl&&t.pop(),o}}var xr=nl(function(t){var r=t,n=lt(t);if(n){if(!n.path)return t;r=n.path;}for(var i=W.isAbsolute(r),o=[],s=0,u=0;;)if(s=u,u=r.indexOf("/",s),u===-1){o.push(r.slice(s));break}else for(o.push(r.slice(s,u));u<r.length&&r[u]==="/";)u++;for(var c,a=0,u=o.length-1;u>=0;u--)c=o[u],c==="."?o.splice(u,1):c===".."?a++:a>0&&(c===""?(o.splice(u+1,a),a=0):(o.splice(u,2),a--));return r=o.join("/"),r===""&&(r=i?"/":"."),n?(n.path=r,Ge(n)):r});W.normalize=xr;function Po(e,t){e===""&&(e="."),t===""&&(t=".");var r=lt(t),n=lt(e);if(n&&(e=n.path||"/"),r&&!r.scheme)return n&&(r.scheme=n.scheme),Ge(r);if(r||t.match(tl))return t;if(n&&!n.host&&!n.path)return n.host=t,Ge(n);var i=t.charAt(0)==="/"?t:xr(e.replace(/\/+$/,"")+"/"+t);return n?(n.path=i,Ge(n)):i}W.join=Po;W.isAbsolute=function(e){return e.charAt(0)==="/"||zo.test(e)};function il(e,t){e===""&&(e="."),e=e.replace(/\/$/,"");for(var r=0;t.indexOf(e+"/")!==0;){var n=e.lastIndexOf("/");if(n<0||(e=e.slice(0,n),e.match(/^([^\/]+:\/)?\/*$/)))return t;++r;}return Array(r+1).join("../")+t.substr(e.length+1)}W.relative=il;var Io=function(){var e=Object.create(null);return !("__proto__"in e)}();function Do(e){return e}function ol(e){return No(e)?"$"+e:e}W.toSetString=Io?Do:ol;function sl(e){return No(e)?e.slice(1):e}W.fromSetString=Io?Do:sl;function No(e){if(!e)return  false;var t=e.length;if(t<9||e.charCodeAt(t-1)!==95||e.charCodeAt(t-2)!==95||e.charCodeAt(t-3)!==111||e.charCodeAt(t-4)!==116||e.charCodeAt(t-5)!==111||e.charCodeAt(t-6)!==114||e.charCodeAt(t-7)!==112||e.charCodeAt(t-8)!==95||e.charCodeAt(t-9)!==95)return  false;for(var r=t-10;r>=0;r--)if(e.charCodeAt(r)!==36)return  false;return  true}function al(e,t,r){var n=ke(e.source,t.source);return n!==0||(n=e.originalLine-t.originalLine,n!==0)||(n=e.originalColumn-t.originalColumn,n!==0||r)||(n=e.generatedColumn-t.generatedColumn,n!==0)||(n=e.generatedLine-t.generatedLine,n!==0)?n:ke(e.name,t.name)}W.compareByOriginalPositions=al;function ll(e,t,r){var n;return n=e.originalLine-t.originalLine,n!==0||(n=e.originalColumn-t.originalColumn,n!==0||r)||(n=e.generatedColumn-t.generatedColumn,n!==0)||(n=e.generatedLine-t.generatedLine,n!==0)?n:ke(e.name,t.name)}W.compareByOriginalPositionsNoSource=ll;function cl(e,t,r){var n=e.generatedLine-t.generatedLine;return n!==0||(n=e.generatedColumn-t.generatedColumn,n!==0||r)||(n=ke(e.source,t.source),n!==0)||(n=e.originalLine-t.originalLine,n!==0)||(n=e.originalColumn-t.originalColumn,n!==0)?n:ke(e.name,t.name)}W.compareByGeneratedPositionsDeflated=cl;function ul(e,t,r){var n=e.generatedColumn-t.generatedColumn;return n!==0||r||(n=ke(e.source,t.source),n!==0)||(n=e.originalLine-t.originalLine,n!==0)||(n=e.originalColumn-t.originalColumn,n!==0)?n:ke(e.name,t.name)}W.compareByGeneratedPositionsDeflatedNoLine=ul;function ke(e,t){return e===t?0:e===null?1:t===null?-1:e>t?1:-1}function pl(e,t){var r=e.generatedLine-t.generatedLine;return r!==0||(r=e.generatedColumn-t.generatedColumn,r!==0)||(r=ke(e.source,t.source),r!==0)||(r=e.originalLine-t.originalLine,r!==0)||(r=e.originalColumn-t.originalColumn,r!==0)?r:ke(e.name,t.name)}W.compareByGeneratedPositionsInflated=pl;function hl(e){return JSON.parse(e.replace(/^\)]}'[^\n]*\n/,""))}W.parseSourceMapInput=hl;function ml(e,t,r){if(t=t||"",e&&(e[e.length-1]!=="/"&&t[0]!=="/"&&(e+="/"),t=e+t),r){var n=lt(r);if(!n)throw new Error("sourceMapURL could not be parsed");if(n.path){var i=n.path.lastIndexOf("/");i>=0&&(n.path=n.path.substring(0,i+1));}t=Po(Ge(n),t);}return xr(t)}W.computeSourceURL=ml;});var Ro=Me(Oo=>{var yr=Rt(),kr=Object.prototype.hasOwnProperty,Ne=typeof Map<"u";function we(){this._array=[],this._set=Ne?new Map:Object.create(null);}we.fromArray=function(t,r){for(var n=new we,i=0,o=t.length;i<o;i++)n.add(t[i],r);return n};we.prototype.size=function(){return Ne?this._set.size:Object.getOwnPropertyNames(this._set).length};we.prototype.add=function(t,r){var n=Ne?t:yr.toSetString(t),i=Ne?this.has(t):kr.call(this._set,n),o=this._array.length;(!i||r)&&this._array.push(t),i||(Ne?this._set.set(t,o):this._set[n]=o);};we.prototype.has=function(t){if(Ne)return this._set.has(t);var r=yr.toSetString(t);return kr.call(this._set,r)};we.prototype.indexOf=function(t){if(Ne){var r=this._set.get(t);if(r>=0)return r}else {var n=yr.toSetString(t);if(kr.call(this._set,n))return this._set[n]}throw new Error('"'+t+'" is not in the set.')};we.prototype.at=function(t){if(t>=0&&t<this._array.length)return this._array[t];throw new Error("No element indexed by "+t)};we.prototype.toArray=function(){return this._array.slice()};Oo.ArraySet=we;});var Bo=Me(Mo=>{var Fo=Rt();function dl(e,t){var r=e.generatedLine,n=t.generatedLine,i=e.generatedColumn,o=t.generatedColumn;return n>r||n==r&&o>=i||Fo.compareByGeneratedPositionsInflated(e,t)<=0}function Ft(){this._array=[],this._sorted=true,this._last={generatedLine:-1,generatedColumn:0};}Ft.prototype.unsortedForEach=function(t,r){this._array.forEach(t,r);};Ft.prototype.add=function(t){dl(this._last,t)?(this._last=t,this._array.push(t)):(this._sorted=false,this._array.push(t));};Ft.prototype.toArray=function(){return this._sorted||(this._array.sort(Fo.compareByGeneratedPositionsInflated),this._sorted=true),this._array};Mo.MappingList=Ft;});var Wo=Me(_o=>{var ct=Eo(),F=Rt(),Mt=Ro().ArraySet,fl=Bo().MappingList;function ne(e){e||(e={}),this._file=F.getArg(e,"file",null),this._sourceRoot=F.getArg(e,"sourceRoot",null),this._skipValidation=F.getArg(e,"skipValidation",false),this._sources=new Mt,this._names=new Mt,this._mappings=new fl,this._sourcesContents=null;}ne.prototype._version=3;ne.fromSourceMap=function(t){var r=t.sourceRoot,n=new ne({file:t.file,sourceRoot:r});return t.eachMapping(function(i){var o={generated:{line:i.generatedLine,column:i.generatedColumn}};i.source!=null&&(o.source=i.source,r!=null&&(o.source=F.relative(r,o.source)),o.original={line:i.originalLine,column:i.originalColumn},i.name!=null&&(o.name=i.name)),n.addMapping(o);}),t.sources.forEach(function(i){var o=i;r!==null&&(o=F.relative(r,i)),n._sources.has(o)||n._sources.add(o);var s=t.sourceContentFor(i);s!=null&&n.setSourceContent(i,s);}),n};ne.prototype.addMapping=function(t){var r=F.getArg(t,"generated"),n=F.getArg(t,"original",null),i=F.getArg(t,"source",null),o=F.getArg(t,"name",null);this._skipValidation||this._validateMapping(r,n,i,o),i!=null&&(i=String(i),this._sources.has(i)||this._sources.add(i)),o!=null&&(o=String(o),this._names.has(o)||this._names.add(o)),this._mappings.add({generatedLine:r.line,generatedColumn:r.column,originalLine:n!=null&&n.line,originalColumn:n!=null&&n.column,source:i,name:o});};ne.prototype.setSourceContent=function(t,r){var n=t;this._sourceRoot!=null&&(n=F.relative(this._sourceRoot,n)),r!=null?(this._sourcesContents||(this._sourcesContents=Object.create(null)),this._sourcesContents[F.toSetString(n)]=r):this._sourcesContents&&(delete this._sourcesContents[F.toSetString(n)],Object.keys(this._sourcesContents).length===0&&(this._sourcesContents=null));};ne.prototype.applySourceMap=function(t,r,n){var i=r;if(r==null){if(t.file==null)throw new Error(`SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, or the source map's "file" property. Both were omitted.`);i=t.file;}var o=this._sourceRoot;o!=null&&(i=F.relative(o,i));var s=new Mt,u=new Mt;this._mappings.unsortedForEach(function(c){if(c.source===i&&c.originalLine!=null){var a=t.originalPositionFor({line:c.originalLine,column:c.originalColumn});a.source!=null&&(c.source=a.source,n!=null&&(c.source=F.join(n,c.source)),o!=null&&(c.source=F.relative(o,c.source)),c.originalLine=a.line,c.originalColumn=a.column,a.name!=null&&(c.name=a.name));}var l=c.source;l!=null&&!s.has(l)&&s.add(l);var p=c.name;p!=null&&!u.has(p)&&u.add(p);},this),this._sources=s,this._names=u,t.sources.forEach(function(c){var a=t.sourceContentFor(c);a!=null&&(n!=null&&(c=F.join(n,c)),o!=null&&(c=F.relative(o,c)),this.setSourceContent(c,a));},this);};ne.prototype._validateMapping=function(t,r,n,i){if(r&&typeof r.line!="number"&&typeof r.column!="number")throw new Error("original.line and original.column are not numbers -- you probably meant to omit the original mapping entirely and only map the generated position. If so, pass null for the original mapping instead of an object with empty or null values.");if(!(t&&"line"in t&&"column"in t&&t.line>0&&t.column>=0&&!r&&!n&&!i)){if(t&&"line"in t&&"column"in t&&r&&"line"in r&&"column"in r&&t.line>0&&t.column>=0&&r.line>0&&r.column>=0&&n)return;throw new Error("Invalid mapping: "+JSON.stringify({generated:t,source:n,original:r,name:i}))}};ne.prototype._serializeMappings=function(){for(var t=0,r=1,n=0,i=0,o=0,s=0,u="",c,a,l,p,h=this._mappings.toArray(),d=0,g=h.length;d<g;d++){if(a=h[d],c="",a.generatedLine!==r)for(t=0;a.generatedLine!==r;)c+=";",r++;else if(d>0){if(!F.compareByGeneratedPositionsInflated(a,h[d-1]))continue;c+=",";}c+=ct.encode(a.generatedColumn-t),t=a.generatedColumn,a.source!=null&&(p=this._sources.indexOf(a.source),c+=ct.encode(p-s),s=p,c+=ct.encode(a.originalLine-1-i),i=a.originalLine-1,c+=ct.encode(a.originalColumn-n),n=a.originalColumn,a.name!=null&&(l=this._names.indexOf(a.name),c+=ct.encode(l-o),o=l)),u+=c;}return u};ne.prototype._generateSourcesContent=function(t,r){return t.map(function(n){if(!this._sourcesContents)return null;r!=null&&(n=F.relative(r,n));var i=F.toSetString(n);return Object.prototype.hasOwnProperty.call(this._sourcesContents,i)?this._sourcesContents[i]:null},this)};ne.prototype.toJSON=function(){var t={version:this._version,sources:this._sources.toArray(),names:this._names.toArray(),mappings:this._serializeMappings()};return this._file!=null&&(t.file=this._file),this._sourceRoot!=null&&(t.sourceRoot=this._sourceRoot),this._sourcesContents&&(t.sourcesContent=this._generateSourcesContent(t.sources,t.sourceRoot)),t};ne.prototype.toString=function(){return JSON.stringify(this.toJSON())};_o.SourceMapGenerator=ne;});var sr={};f(sr,{AtKeyword:()=>D,BadString:()=>Be,BadUrl:()=>H,CDC:()=>G,CDO:()=>ze,Colon:()=>B,Comma:()=>Y,Comment:()=>N,Delim:()=>v,Dimension:()=>k,EOF:()=>be,Function:()=>y,Hash:()=>A,Ident:()=>m,LeftCurlyBracket:()=>R,LeftParenthesis:()=>S,LeftSquareBracket:()=>X,Number:()=>b,Percentage:()=>P,RightCurlyBracket:()=>$,RightParenthesis:()=>x,RightSquareBracket:()=>Z,Semicolon:()=>_,String:()=>te,Url:()=>M,WhiteSpace:()=>L});var be=0,m=1,y=2,D=3,A=4,te=5,Be=6,M=7,H=8,v=9,b=10,P=11,k=12,L=13,ze=14,G=15,B=16,_=17,Y=18,X=19,Z=20,S=21,x=22,R=23,$=24,N=25;function O(e){return e>=48&&e<=57}function J(e){return O(e)||e>=65&&e<=70||e>=97&&e<=102}function Lt(e){return e>=65&&e<=90}function ja(e){return e>=97&&e<=122}function Ua(e){return Lt(e)||ja(e)}function Ha(e){return e>=128}function At(e){return Ua(e)||Ha(e)||e===95}function _e(e){return At(e)||O(e)||e===45}function Ga(e){return e>=0&&e<=8||e===11||e>=14&&e<=31||e===127}function tt(e){return e===10||e===13||e===12}function me(e){return tt(e)||e===32||e===9}function K(e,t){return !(e!==92||tt(t)||t===0)}function We(e,t,r){return e===45?At(t)||t===45||K(t,r):At(e)?true:e===92?K(e,t):false}function Et(e,t,r){return e===43||e===45?O(t)?2:t===46&&O(r)?3:0:e===46?O(t)?2:0:O(e)?1:0}function zt(e){return e===65279||e===65534?1:0}var ar=new Array(128),Ya=128,rt=130,lr=131,Pt=132,cr=133;for(let e=0;e<ar.length;e++)ar[e]=me(e)&&rt||O(e)&&lr||At(e)&&Pt||Ga(e)&&cr||e||Ya;function It(e){return e<128?ar[e]:Pt}function qe(e,t){return t<e.length?e.charCodeAt(t):0}function Dt(e,t,r){return r===13&&qe(e,t+1)===10?2:1}function xe(e,t,r){let n=e.charCodeAt(t);return Lt(n)&&(n=n|32),n===r}function ye(e,t,r,n){if(r-t!==n.length||t<0||r>e.length)return  false;for(let i=t;i<r;i++){let o=n.charCodeAt(i-t),s=e.charCodeAt(i);if(Lt(s)&&(s=s|32),s!==o)return  false}return  true}function lo(e,t){for(;t>=0&&me(e.charCodeAt(t));t--);return t+1}function nt(e,t){for(;t<e.length&&me(e.charCodeAt(t));t++);return t}function ur(e,t){for(;t<e.length&&O(e.charCodeAt(t));t++);return t}function se(e,t){if(t+=2,J(qe(e,t-1))){for(let n=Math.min(e.length,t+5);t<n&&J(qe(e,t));t++);let r=qe(e,t);me(r)&&(t+=Dt(e,t,r));}return t}function it(e,t){for(;t<e.length;t++){let r=e.charCodeAt(t);if(!_e(r)){if(K(r,qe(e,t+1))){t=se(e,t)-1;continue}break}}return t}function Pe(e,t){let r=e.charCodeAt(t);if((r===43||r===45)&&(r=e.charCodeAt(t+=1)),O(r)&&(t=ur(e,t+1),r=e.charCodeAt(t)),r===46&&O(e.charCodeAt(t+1))&&(t+=2,t=ur(e,t)),xe(e,t,101)){let n=0;r=e.charCodeAt(t+1),(r===45||r===43)&&(n=1,r=e.charCodeAt(t+2)),O(r)&&(t=ur(e,t+1+n+1));}return t}function Nt(e,t){for(;t<e.length;t++){let r=e.charCodeAt(t);if(r===41){t++;break}K(r,qe(e,t+1))&&(t=se(e,t));}return t}function je(e){if(e.length===1&&!J(e.charCodeAt(0)))return e[0];let t=parseInt(e,16);return (t===0||t>=55296&&t<=57343||t>1114111)&&(t=65533),String.fromCodePoint(t)}var Ie=["EOF-token","ident-token","function-token","at-keyword-token","hash-token","string-token","bad-string-token","url-token","bad-url-token","delim-token","number-token","percentage-token","dimension-token","whitespace-token","CDO-token","CDC-token","colon-token","semicolon-token","comma-token","[-token","]-token","(-token",")-token","{-token","}-token","comment-token"];function Ue(e=null,t){return e===null||e.length<t?new Uint32Array(Math.max(t+1024,16384)):e}var co=10,Ka=12,uo=13;function po(e){let t=e.source,r=t.length,n=t.length>0?zt(t.charCodeAt(0)):0,i=Ue(e.lines,r),o=Ue(e.columns,r),s=e.startLine,u=e.startColumn;for(let c=n;c<r;c++){let a=t.charCodeAt(c);i[c]=s,o[c]=u++,(a===co||a===uo||a===Ka)&&(a===uo&&c+1<r&&t.charCodeAt(c+1)===co&&(c++,i[c]=s,o[c]=u),s++,u=1);}i[r]=s,o[r]=u,e.lines=i,e.columns=o,e.computed=true;}var ot=class{constructor(t,r,n,i){this.setSource(t,r,n,i),this.lines=null,this.columns=null;}setSource(t="",r=0,n=1,i=1){this.source=t,this.startOffset=r,this.startLine=n,this.startColumn=i,this.computed=false;}getLocation(t,r){return this.computed||po(this),{source:r,offset:this.startOffset+t,line:this.lines[t],column:this.columns[t]}}getLocationRange(t,r,n){return this.computed||po(this),{source:n,start:{offset:this.startOffset+t,line:this.lines[t],column:this.columns[t]},end:{offset:this.startOffset+r,line:this.lines[r],column:this.columns[r]}}}};var ae=16777215,le=24,at=1,Ot=2,Se=new Uint8Array(32);Se[2]=22;Se[21]=22;Se[19]=20;Se[23]=24;var ce=new Uint8Array(32);ce[2]=at;ce[21]=at;ce[19]=at;ce[23]=at;ce[22]=Ot;ce[20]=Ot;ce[24]=Ot;function ho(e,t,r){return e<t?t:e>r?r:e}var st=class{constructor(t,r){this.setSource(t,r);}reset(){this.eof=false,this.tokenIndex=-1,this.tokenType=0,this.tokenStart=this.firstCharOffset,this.tokenEnd=this.firstCharOffset;}setSource(t="",r=()=>{}){t=String(t||"");let n=t.length,i=Ue(this.offsetAndType,t.length+1),o=Ue(this.balance,t.length+1),s=0,u=-1,c=0,a=t.length;this.offsetAndType=null,this.balance=null,o.fill(0),r(t,(l,p,h)=>{let d=s++;if(i[d]=l<<le|h,u===-1&&(u=p),o[d]=a,l===c){let g=o[a];o[a]=d,a=g,c=Se[i[g]>>le];}else this.isBlockOpenerTokenType(l)&&(a=d,c=Se[l]);}),i[s]=0<<le|n,o[s]=s;for(let l=0;l<s;l++){let p=o[l];if(p<=l){let h=o[p];h!==l&&(o[l]=h);}else p>s&&(o[l]=s);}this.source=t,this.firstCharOffset=u===-1?0:u,this.tokenCount=s,this.offsetAndType=i,this.balance=o,this.reset(),this.next();}lookupType(t){return t+=this.tokenIndex,t<this.tokenCount?this.offsetAndType[t]>>le:0}lookupTypeNonSC(t){for(let r=this.tokenIndex;r<this.tokenCount;r++){let n=this.offsetAndType[r]>>le;if(n!==13&&n!==25&&t--===0)return n}return 0}lookupOffset(t){return t+=this.tokenIndex,t<this.tokenCount?this.offsetAndType[t-1]&ae:this.source.length}lookupOffsetNonSC(t){for(let r=this.tokenIndex;r<this.tokenCount;r++){let n=this.offsetAndType[r]>>le;if(n!==13&&n!==25&&t--===0)return r-this.tokenIndex}return 0}lookupValue(t,r){return t+=this.tokenIndex,t<this.tokenCount?ye(this.source,this.offsetAndType[t-1]&ae,this.offsetAndType[t]&ae,r):false}getTokenStart(t){return t===this.tokenIndex?this.tokenStart:t>0?t<this.tokenCount?this.offsetAndType[t-1]&ae:this.offsetAndType[this.tokenCount]&ae:this.firstCharOffset}getTokenEnd(t){return t===this.tokenIndex?this.tokenEnd:this.offsetAndType[ho(t,0,this.tokenCount)]&ae}getTokenType(t){return t===this.tokenIndex?this.tokenType:this.offsetAndType[ho(t,0,this.tokenCount)]>>le}substrToCursor(t){return this.source.substring(t,this.tokenStart)}isBlockOpenerTokenType(t){return ce[t]===at}isBlockCloserTokenType(t){return ce[t]===Ot}getBlockTokenPairIndex(t){let r=this.getTokenType(t);if(ce[r]===1){let n=this.balance[t],i=this.getTokenType(n);return Se[r]===i?n:-1}else if(ce[r]===2){let n=this.balance[t],i=this.getTokenType(n);return Se[i]===r?n:-1}return  -1}isBalanceEdge(t){return this.balance[this.tokenIndex]<t}isDelim(t,r){return r?this.lookupType(r)===9&&this.source.charCodeAt(this.lookupOffset(r))===t:this.tokenType===9&&this.source.charCodeAt(this.tokenStart)===t}skip(t){let r=this.tokenIndex+t;r<this.tokenCount?(this.tokenIndex=r,this.tokenStart=this.offsetAndType[r-1]&ae,r=this.offsetAndType[r],this.tokenType=r>>le,this.tokenEnd=r&ae):(this.tokenIndex=this.tokenCount,this.next());}next(){let t=this.tokenIndex+1;t<this.tokenCount?(this.tokenIndex=t,this.tokenStart=this.tokenEnd,t=this.offsetAndType[t],this.tokenType=t>>le,this.tokenEnd=t&ae):(this.eof=true,this.tokenIndex=this.tokenCount,this.tokenType=0,this.tokenStart=this.tokenEnd=this.source.length);}skipSC(){for(;this.tokenType===13||this.tokenType===25;)this.next();}skipUntilBalanced(t,r){let n=t,i=0,o=0;e:for(;n<this.tokenCount;n++){if(i=this.balance[n],i<t)break e;switch(o=n>0?this.offsetAndType[n-1]&ae:this.firstCharOffset,r(this.source.charCodeAt(o))){case 1:break e;case 2:n++;break e;default:this.isBlockOpenerTokenType(this.offsetAndType[n]>>le)&&(n=i);}}this.skip(n-this.tokenIndex);}forEachToken(t){for(let r=0,n=this.firstCharOffset;r<this.tokenCount;r++){let i=n,o=this.offsetAndType[r],s=o&ae,u=o>>le;n=s,t(u,i,s,r);}}dump(){let t=new Array(this.tokenCount);return this.forEachToken((r,n,i,o)=>{t[o]={idx:o,type:Ie[r],chunk:this.source.substring(n,i),balance:this.balance[o]};}),t}};function Ce(e,t){function r(p){return p<u?e.charCodeAt(p):0}function n(){if(a=Pe(e,a),We(r(a),r(a+1),r(a+2))){l=12,a=it(e,a);return}if(r(a)===37){l=11,a++;return}l=10;}function i(){let p=a;if(a=it(e,a),ye(e,p,a,"url")&&r(a)===40){if(a=nt(e,a+1),r(a)===34||r(a)===39){l=2,a=p+4;return}s();return}if(r(a)===40){l=2,a++;return}l=1;}function o(p){for(p||(p=r(a++)),l=5;a<e.length;a++){let h=e.charCodeAt(a);switch(It(h)){case p:a++;return;case rt:if(tt(h)){a+=Dt(e,a,h),l=6;return}break;case 92:if(a===e.length-1)break;let d=r(a+1);tt(d)?a+=Dt(e,a+1,d):K(h,d)&&(a=se(e,a)-1);break}}}function s(){for(l=7,a=nt(e,a);a<e.length;a++){let p=e.charCodeAt(a);switch(It(p)){case 41:a++;return;case rt:if(a=nt(e,a),r(a)===41||a>=e.length){a<e.length&&a++;return}a=Nt(e,a),l=8;return;case 34:case 39:case 40:case cr:a=Nt(e,a),l=8;return;case 92:if(K(p,r(a+1))){a=se(e,a)-1;break}a=Nt(e,a),l=8;return}}}e=String(e||"");let u=e.length,c=zt(r(0)),a=c,l;for(;a<u;){let p=e.charCodeAt(a);switch(It(p)){case rt:l=13,a=nt(e,a+1);break;case 34:o();break;case 35:_e(r(a+1))||K(r(a+1),r(a+2))?(l=4,a=it(e,a+1)):(l=9,a++);break;case 39:o();break;case 40:l=21,a++;break;case 41:l=22,a++;break;case 43:Et(p,r(a+1),r(a+2))?n():(l=9,a++);break;case 44:l=18,a++;break;case 45:Et(p,r(a+1),r(a+2))?n():r(a+1)===45&&r(a+2)===62?(l=15,a=a+3):We(p,r(a+1),r(a+2))?i():(l=9,a++);break;case 46:Et(p,r(a+1),r(a+2))?n():(l=9,a++);break;case 47:r(a+1)===42?(l=25,a=e.indexOf("*/",a+2),a=a===-1?e.length:a+2):(l=9,a++);break;case 58:l=16,a++;break;case 59:l=17,a++;break;case 60:r(a+1)===33&&r(a+2)===45&&r(a+3)===45?(l=14,a=a+4):(l=9,a++);break;case 64:We(r(a+1),r(a+2),r(a+3))?(l=3,a=it(e,a+1)):(l=9,a++);break;case 91:l=19,a++;break;case 92:K(p,r(a+1))?i():(l=9,a++);break;case 93:l=20,a++;break;case 123:l=23,a++;break;case 125:l=24,a++;break;case lr:n();break;case Pt:i();break;default:l=9,a++;}t(l,c,c=a);}}var He=null,V=class e{static createItem(t){return {prev:null,next:null,data:t}}constructor(){this.head=null,this.tail=null,this.cursor=null;}createItem(t){return e.createItem(t)}allocateCursor(t,r){let n;return He!==null?(n=He,He=He.cursor,n.prev=t,n.next=r,n.cursor=this.cursor):n={prev:t,next:r,cursor:this.cursor},this.cursor=n,n}releaseCursor(){let{cursor:t}=this;this.cursor=t.cursor,t.prev=null,t.next=null,t.cursor=He,He=t;}updateCursors(t,r,n,i){let{cursor:o}=this;for(;o!==null;)o.prev===t&&(o.prev=r),o.next===n&&(o.next=i),o=o.cursor;}*[Symbol.iterator](){for(let t=this.head;t!==null;t=t.next)yield t.data;}get size(){let t=0;for(let r=this.head;r!==null;r=r.next)t++;return t}get isEmpty(){return this.head===null}get first(){return this.head&&this.head.data}get last(){return this.tail&&this.tail.data}fromArray(t){let r=null;this.head=null;for(let n of t){let i=e.createItem(n);r!==null?r.next=i:this.head=i,i.prev=r,r=i;}return this.tail=r,this}toArray(){return [...this]}toJSON(){return [...this]}forEach(t,r=this){let n=this.allocateCursor(null,this.head);for(;n.next!==null;){let i=n.next;n.next=i.next,t.call(r,i.data,i,this);}this.releaseCursor();}forEachRight(t,r=this){let n=this.allocateCursor(this.tail,null);for(;n.prev!==null;){let i=n.prev;n.prev=i.prev,t.call(r,i.data,i,this);}this.releaseCursor();}reduce(t,r,n=this){let i=this.allocateCursor(null,this.head),o=r,s;for(;i.next!==null;)s=i.next,i.next=s.next,o=t.call(n,o,s.data,s,this);return this.releaseCursor(),o}reduceRight(t,r,n=this){let i=this.allocateCursor(this.tail,null),o=r,s;for(;i.prev!==null;)s=i.prev,i.prev=s.prev,o=t.call(n,o,s.data,s,this);return this.releaseCursor(),o}some(t,r=this){for(let n=this.head;n!==null;n=n.next)if(t.call(r,n.data,n,this))return  true;return  false}map(t,r=this){let n=new e;for(let i=this.head;i!==null;i=i.next)n.appendData(t.call(r,i.data,i,this));return n}filter(t,r=this){let n=new e;for(let i=this.head;i!==null;i=i.next)t.call(r,i.data,i,this)&&n.appendData(i.data);return n}nextUntil(t,r,n=this){if(t===null)return;let i=this.allocateCursor(null,t);for(;i.next!==null;){let o=i.next;if(i.next=o.next,r.call(n,o.data,o,this))break}this.releaseCursor();}prevUntil(t,r,n=this){if(t===null)return;let i=this.allocateCursor(t,null);for(;i.prev!==null;){let o=i.prev;if(i.prev=o.prev,r.call(n,o.data,o,this))break}this.releaseCursor();}clear(){this.head=null,this.tail=null;}copy(){let t=new e;for(let r of this)t.appendData(r);return t}prepend(t){return this.updateCursors(null,t,this.head,t),this.head!==null?(this.head.prev=t,t.next=this.head):this.tail=t,this.head=t,this}prependData(t){return this.prepend(e.createItem(t))}append(t){return this.insert(t)}appendData(t){return this.insert(e.createItem(t))}insert(t,r=null){if(r!==null)if(this.updateCursors(r.prev,t,r,t),r.prev===null){if(this.head!==r)throw new Error("before doesn't belong to list");this.head=t,r.prev=t,t.next=r,this.updateCursors(null,t);}else r.prev.next=t,t.prev=r.prev,r.prev=t,t.next=r;else this.updateCursors(this.tail,t,null,t),this.tail!==null?(this.tail.next=t,t.prev=this.tail):this.head=t,this.tail=t;return this}insertData(t,r){return this.insert(e.createItem(t),r)}remove(t){if(this.updateCursors(t,t.prev,t,t.next),t.prev!==null)t.prev.next=t.next;else {if(this.head!==t)throw new Error("item doesn't belong to list");this.head=t.next;}if(t.next!==null)t.next.prev=t.prev;else {if(this.tail!==t)throw new Error("item doesn't belong to list");this.tail=t.prev;}return t.prev=null,t.next=null,t}push(t){this.insert(e.createItem(t));}pop(){return this.tail!==null?this.remove(this.tail):null}unshift(t){this.prepend(e.createItem(t));}shift(){return this.head!==null?this.remove(this.head):null}prependList(t){return this.insertList(t,this.head)}appendList(t){return this.insertList(t)}insertList(t,r){return t.head===null?this:(r!=null?(this.updateCursors(r.prev,t.tail,r,t.head),r.prev!==null?(r.prev.next=t.head,t.head.prev=r.prev):this.head=t.head,r.prev=t.tail,t.tail.next=r):(this.updateCursors(this.tail,t.tail,null,t.head),this.tail!==null?(this.tail.next=t.head,t.head.prev=this.tail):this.head=t.head,this.tail=t.tail),t.head=null,t.tail=null,this)}replace(t,r){"head"in r?this.insertList(r,t):this.insert(r,t),this.remove(t);}};function De(e,t){let r=Object.create(SyntaxError.prototype),n=new Error;return Object.assign(r,{name:e,message:t,get stack(){return (n.stack||"").replace(/^(.+\n){1,3}/,`${e}: ${t}
`)}})}var pr=100,mo=60,fo="    ";function go({source:e,line:t,column:r,baseLine:n,baseColumn:i},o){function s(g,ee){return a.slice(g,ee).map((j,w)=>String(g+w+1).padStart(h)+" |"+j).join(`
`)}let u=`
`.repeat(Math.max(n-1,0)),c=" ".repeat(Math.max(i-1,0)),a=(u+c+e).split(/\r\n?|\n|\f/),l=Math.max(1,t-o)-1,p=Math.min(t+o,a.length+1),h=Math.max(4,String(p).length)+1,d=0;r+=(fo.length-1)*(a[t-1].substr(0,r-1).match(/\t/g)||[]).length,r>pr&&(d=r-mo+3,r=mo-2);for(let g=l;g<=p;g++)g>=0&&g<a.length&&(a[g]=a[g].replace(/\t/g,fo),a[g]=(d>0&&a[g].length>d?"\u2026":"")+a[g].substr(d,pr-2)+(a[g].length>d+pr-1?"\u2026":""));return [s(l,t),new Array(r+h+2).join("-")+"^",s(t,p)].filter(Boolean).join(`
`).replace(/^(\s+\d+\s+\|\n)+/,"").replace(/\n(\s+\d+\s+\|)+$/,"")}function hr(e,t,r,n,i,o=1,s=1){return Object.assign(De("SyntaxError",e),{source:t,offset:r,line:n,column:i,sourceFragment(c){return go({source:t,line:n,column:i,baseLine:o,baseColumn:s},isNaN(c)?0:c)},get formattedMessage(){return `Parse error: ${e}
`+go({source:t,line:n,column:i,baseLine:o,baseColumn:s},2)}})}function bo(e){let t=this.createList(),r=false,n={recognizer:e};for(;!this.eof;){switch(this.tokenType){case 25:this.next();continue;case 13:r=true,this.next();continue}let i=e.getNode.call(this,n);if(i===void 0)break;r&&(e.onWhiteSpace&&e.onWhiteSpace.call(this,i,t,n),r=false),t.push(i);}return r&&e.onWhiteSpace&&e.onWhiteSpace.call(this,null,t,n),t}var xo=()=>{},Va=33,Qa=35,mr=59,yo=123,ko=0;function Xa(e){return function(){return this[e]()}}function dr(e){let t=Object.create(null);for(let r of Object.keys(e)){let n=e[r],i=n.parse||n;i&&(t[r]=i);}return t}function $a(e){let t={context:Object.create(null),features:Object.assign(Object.create(null),e.features),scope:Object.assign(Object.create(null),e.scope),atrule:dr(e.atrule),pseudo:dr(e.pseudo),node:dr(e.node)};for(let[r,n]of Object.entries(e.parseContext))switch(typeof n){case "function":t.context[r]=n;break;case "string":t.context[r]=Xa(n);break}return {config:t,...t,...t.node}}function wo(e){let t="",r="<unknown>",n=false,i=xo,o=false,s=new ot,u=Object.assign(new st,$a(e||{}),{parseAtrulePrelude:true,parseRulePrelude:true,parseValue:true,parseCustomProperty:false,readSequence:bo,consumeUntilBalanceEnd:()=>0,consumeUntilLeftCurlyBracket(l){return l===yo?1:0},consumeUntilLeftCurlyBracketOrSemicolon(l){return l===yo||l===mr?1:0},consumeUntilExclamationMarkOrSemicolon(l){return l===Va||l===mr?1:0},consumeUntilSemicolonIncluded(l){return l===mr?2:0},createList(){return new V},createSingleNodeList(l){return new V().appendData(l)},getFirstListNode(l){return l&&l.first},getLastListNode(l){return l&&l.last},parseWithFallback(l,p){let h=this.tokenIndex;try{return l.call(this)}catch(d){if(o)throw d;this.skip(h-this.tokenIndex);let g=p.call(this);return o=true,i(d,g),o=false,g}},lookupNonWSType(l){let p;do if(p=this.lookupType(l++),p!==13&&p!==25)return p;while(p!==ko);return ko},charCodeAt(l){return l>=0&&l<t.length?t.charCodeAt(l):0},substring(l,p){return t.substring(l,p)},substrToCursor(l){return this.source.substring(l,this.tokenStart)},cmpChar(l,p){return xe(t,l,p)},cmpStr(l,p,h){return ye(t,l,p,h)},consume(l){let p=this.tokenStart;return this.eat(l),this.substrToCursor(p)},consumeFunctionName(){let l=t.substring(this.tokenStart,this.tokenEnd-1);return this.eat(2),l},consumeNumber(l){let p=t.substring(this.tokenStart,Pe(t,this.tokenStart));return this.eat(l),p},eat(l){if(this.tokenType!==l){let p=Ie[l].slice(0,-6).replace(/-/g," ").replace(/^./,g=>g.toUpperCase()),h=`${/[[\](){}]/.test(p)?`"${p}"`:p} is expected`,d=this.tokenStart;switch(l){case 1:this.tokenType===2||this.tokenType===7?(d=this.tokenEnd-1,h="Identifier is expected but function found"):h="Identifier is expected";break;case 4:this.isDelim(Qa)&&(this.next(),d++,h="Name is expected");break;case 11:this.tokenType===10&&(d=this.tokenEnd,h="Percent sign is expected");break}this.error(h,d);}this.next();},eatIdent(l){(this.tokenType!==1||this.lookupValue(0,l)===false)&&this.error(`Identifier "${l}" is expected`),this.next();},eatDelim(l){this.isDelim(l)||this.error(`Delim "${String.fromCharCode(l)}" is expected`),this.next();},getLocation(l,p){return n?s.getLocationRange(l,p,r):null},getLocationFromList(l){if(n){let p=this.getFirstListNode(l),h=this.getLastListNode(l);return s.getLocationRange(p!==null?p.loc.start.offset-s.startOffset:this.tokenStart,h!==null?h.loc.end.offset-s.startOffset:this.tokenStart,r)}return null},error(l,p){let h=typeof p<"u"&&p<t.length?s.getLocation(p):this.eof?s.getLocation(lo(t,t.length-1)):s.getLocation(this.tokenStart);throw new hr(l||"Unexpected input",t,h.offset,h.line,h.column,s.startLine,s.startColumn)}}),c=()=>({filename:r,source:t,tokenCount:u.tokenCount,getTokenType:l=>u.getTokenType(l),getTokenTypeName:l=>Ie[u.getTokenType(l)],getTokenStart:l=>u.getTokenStart(l),getTokenEnd:l=>u.getTokenEnd(l),getTokenValue:l=>u.source.substring(u.getTokenStart(l),u.getTokenEnd(l)),substring:(l,p)=>u.source.substring(l,p),balance:u.balance.subarray(0,u.tokenCount+1),isBlockOpenerTokenType:u.isBlockOpenerTokenType,isBlockCloserTokenType:u.isBlockCloserTokenType,getBlockTokenPairIndex:l=>u.getBlockTokenPairIndex(l),getLocation:l=>s.getLocation(l,r),getRangeLocation:(l,p)=>s.getLocationRange(l,p,r)});return Object.assign(function(l,p){t=l,p=p||{},u.setSource(t,Ce),s.setSource(t,p.offset,p.line,p.column),r=p.filename||"<unknown>",n=!!p.positions,i=typeof p.onParseError=="function"?p.onParseError:xo,o=false,u.parseAtrulePrelude="parseAtrulePrelude"in p?!!p.parseAtrulePrelude:true,u.parseRulePrelude="parseRulePrelude"in p?!!p.parseRulePrelude:true,u.parseValue="parseValue"in p?!!p.parseValue:true,u.parseCustomProperty="parseCustomProperty"in p?!!p.parseCustomProperty:false;let{context:h="default",onComment:d,onToken:g}=p;if(!(h in u.context))throw new Error("Unknown context `"+h+"`");Array.isArray(g)?u.forEachToken((j,w,T)=>{g.push({type:j,start:w,end:T});}):typeof g=="function"&&u.forEachToken(g.bind(c())),typeof d=="function"&&u.forEachToken((j,w,T)=>{if(j===25){let he=u.getLocation(w,T),z=ye(t,T-2,T,"*/")?t.slice(w+2,T-2):t.slice(w+2,T);d(z,he);}});let ee=u.context[h].call(u,p);return u.eof||u.error(),ee},{SyntaxError:hr,config:u.config})}var jo=qa(Wo()),qo=new Set(["Atrule","Selector","Declaration"]);function Uo(e){let t=new jo.SourceMapGenerator,r={line:1,column:0},n={line:0,column:0},i={line:1,column:0},o={generated:i},s=1,u=0,c=false,a=e.node;e.node=function(h){if(h.loc&&h.loc.start&&qo.has(h.type)){let d=h.loc.start.line,g=h.loc.start.column-1;(n.line!==d||n.column!==g)&&(n.line=d,n.column=g,r.line=s,r.column=u,c&&(c=false,(r.line!==i.line||r.column!==i.column)&&t.addMapping(o)),c=true,t.addMapping({source:h.loc.source,original:n,generated:r}));}a.call(this,h),c&&qo.has(h.type)&&(i.line=s,i.column=u);};let l=e.emit;e.emit=function(h,d,g){for(let ee=0;ee<h.length;ee++)h.charCodeAt(ee)===10?(s++,u=0):u++;l(h,d,g);};let p=e.result;return e.result=function(){return c&&t.addMapping(o),{css:p(),map:t}},e}var Bt={};f(Bt,{safe:()=>vr,spec:()=>yl});var gl=43,bl=45,wr=(e,t)=>{if(e===9&&(e=t),typeof e=="string"){let r=e.charCodeAt(0);return r>127?32768:r<<8}return e},Ho=[[1,1],[1,2],[1,7],[1,8],[1,"-"],[1,10],[1,11],[1,12],[1,15],[1,21],[3,1],[3,2],[3,7],[3,8],[3,"-"],[3,10],[3,11],[3,12],[3,15],[4,1],[4,2],[4,7],[4,8],[4,"-"],[4,10],[4,11],[4,12],[4,15],[12,1],[12,2],[12,7],[12,8],[12,"-"],[12,10],[12,11],[12,12],[12,15],["#",1],["#",2],["#",7],["#",8],["#","-"],["#",10],["#",11],["#",12],["#",15],["-",1],["-",2],["-",7],["-",8],["-","-"],["-",10],["-",11],["-",12],["-",15],[10,1],[10,2],[10,7],[10,8],[10,10],[10,11],[10,12],[10,"%"],[10,15],["@",1],["@",2],["@",7],["@",8],["@","-"],["@",15],[".",10],[".",11],[".",12],["+",10],["+",11],["+",12],["/","*"]],xl=Ho.concat([[1,4],[12,4],[4,4],[3,21],[3,5],[3,16],[11,11],[11,12],[11,2],[11,"-"],[22,1],[22,2],[22,11],[22,12],[22,4],[22,"-"]]);function Go(e){let t=new Set(e.map(([r,n])=>wr(r)<<16|wr(n)));return function(r,n,i){let o=wr(n,i),s=i.charCodeAt(0);return (s===bl&&n!==1&&n!==2&&n!==15||s===gl?t.has(r<<16|s<<8):t.has(r<<16|o))&&this.emit(" ",13,true),o}}var yl=Go(Ho),vr=Go(xl);var kl=92;function wl(e,t){if(typeof t=="function"){let r=null;e.children.forEach(n=>{r!==null&&t.call(this,r),this.node(n),r=n;});return}e.children.forEach(this.node,this);}function vl(e){Ce(e,(t,r,n)=>{this.token(t,e.slice(r,n));});}function Yo(e){let t=new Map;for(let[r,n]of Object.entries(e.node))typeof(n.generate||n)=="function"&&t.set(r,n.generate||n);return function(r,n){let i="",o=0,s={node(c){if(t.has(c.type))t.get(c.type).call(u,c);else throw new Error("Unknown node type: "+c.type)},tokenBefore:vr,token(c,a){o=this.tokenBefore(o,c,a),this.emit(a,c,false),c===9&&a.charCodeAt(0)===kl&&this.emit(`
`,13,true);},emit(c){i+=c;},result(){return i}};n&&(typeof n.decorator=="function"&&(s=n.decorator(s)),n.sourceMap&&(s=Uo(s)),n.mode in Bt&&(s.tokenBefore=Bt[n.mode]));let u={node:c=>s.node(c),children:wl,token:(c,a)=>s.token(c,a),tokenize:vl};return s.node(r),s.result()}}function Ko(e){return {fromPlainObject(t){return e(t,{enter(r){r.children&&!(r.children instanceof V)&&(r.children=new V().fromArray(r.children));}}),t},toPlainObject(t){return e(t,{leave(r){r.children&&r.children instanceof V&&(r.children=r.children.toArray());}}),t}}}var{hasOwnProperty:Sr}=Object.prototype,ut=function(){};function Vo(e){return typeof e=="function"?e:ut}function Qo(e,t){return function(r,n,i){r.type===t&&e.call(this,r,n,i);}}function Sl(e,t){let r=t.structure,n=[];for(let i in r){if(Sr.call(r,i)===false)continue;let o=r[i],s={name:i,type:false,nullable:false};Array.isArray(o)||(o=[o]);for(let u of o)u===null?s.nullable=true:typeof u=="string"?s.type="node":Array.isArray(u)&&(s.type="list");s.type&&n.push(s);}return n.length?{context:t.walkContext,fields:n}:null}function Cl(e){let t={};for(let r in e.node)if(Sr.call(e.node,r)){let n=e.node[r];if(!n.structure)throw new Error("Missed `structure` field in `"+r+"` node type definition");t[r]=Sl(r,n);}return t}function Xo(e,t){let r=e.fields.slice(),n=e.context,i=typeof n=="string";return t&&r.reverse(),function(o,s,u,c){let a;i&&(a=s[n],s[n]=o);for(let l of r){let p=o[l.name];if(!l.nullable||p){if(l.type==="list"){if(t?p.reduceRight(c,false):p.reduce(c,false))return  true}else if(u(p))return  true}}i&&(s[n]=a);}}function $o({StyleSheet:e,Atrule:t,Rule:r,Block:n,DeclarationList:i}){return {Atrule:{StyleSheet:e,Atrule:t,Rule:r,Block:n},Rule:{StyleSheet:e,Atrule:t,Rule:r,Block:n},Declaration:{StyleSheet:e,Atrule:t,Rule:r,Block:n,DeclarationList:i}}}function Zo(e){let t=Cl(e),r={},n={},i=Symbol("break-walk"),o=Symbol("skip-node");for(let a in t)Sr.call(t,a)&&t[a]!==null&&(r[a]=Xo(t[a],false),n[a]=Xo(t[a],true));let s=$o(r),u=$o(n),c=function(a,l){function p(w,T,he){let z=h.call(j,w,T,he);return z===i?true:z===o?false:!!(g.hasOwnProperty(w.type)&&g[w.type](w,j,p,ee)||d.call(j,w,T,he)===i)}let h=ut,d=ut,g=r,ee=(w,T,he,z)=>w||p(T,he,z),j={break:i,skip:o,root:a,stylesheet:null,atrule:null,atrulePrelude:null,rule:null,selector:null,block:null,declaration:null,function:null};if(typeof l=="function")h=l;else if(l&&(h=Vo(l.enter),d=Vo(l.leave),l.reverse&&(g=n),l.visit)){if(s.hasOwnProperty(l.visit))g=l.reverse?u[l.visit]:s[l.visit];else if(!t.hasOwnProperty(l.visit))throw new Error("Bad value `"+l.visit+"` for `visit` option (should be: "+Object.keys(t).sort().join(", ")+")");h=Qo(h,l.visit),d=Qo(d,l.visit);}if(h===ut&&d===ut)throw new Error("Neither `enter` nor `leave` walker handler is set or both aren't a function");p(a);};return c.break=i,c.skip=o,c.find=function(a,l){let p=null;return c(a,function(h,d,g){if(l.call(this,h,d,g))return p=h,i}),p},c.findLast=function(a,l){let p=null;return c(a,{reverse:true,enter(h,d,g){if(l.call(this,h,d,g))return p=h,i}}),p},c.findAll=function(a,l){let p=[];return c(a,function(h,d,g){l.call(this,h,d,g)&&p.push(h);}),p},c}function Tl(e){return e}function Al(e){let{min:t,max:r,comma:n}=e;return t===0&&r===0?n?"#?":"*":t===0&&r===1?"?":t===1&&r===0?n?"#":"+":t===1&&r===1?"":(n?"#":"")+(t===r?"{"+t+"}":"{"+t+","+(r!==0?r:"")+"}")}function Ll(e){switch(e.type){case "Range":return " ["+(e.min===null?"-\u221E":e.min)+","+(e.max===null?"\u221E":e.max)+"]";default:throw new Error("Unknown node type `"+e.type+"`")}}function El(e,t,r,n){let i=e.combinator===" "||n?e.combinator:" "+e.combinator+" ",o=e.terms.map(s=>_t(s,t,r,n)).join(i);return e.explicit||r?(n||o[0]===","?"[":"[ ")+o+(n?"]":" ]"):o}function _t(e,t,r,n){let i;switch(e.type){case "Group":i=El(e,t,r,n)+(e.disallowEmpty?"!":"");break;case "Multiplier":return _t(e.term,t,r,n)+t(Al(e),e);case "Boolean":i="<boolean-expr["+_t(e.term,t,r,n)+"]>";break;case "Type":i="<"+e.name+(e.opts?t(Ll(e.opts),e.opts):"")+">";break;case "Property":i="<'"+e.name+"'>";break;case "Keyword":i=e.name;break;case "AtKeyword":i="@"+e.name;break;case "Function":i=e.name+"(";break;case "String":case "Token":i=e.value;break;case "Comma":i=",";break;default:throw new Error("Unknown node type `"+e.type+"`")}return t(i,e)}function Oe(e,t){let r=Tl,n=false,i=false;return typeof t=="function"?r=t:t&&(n=!!t.forceBraces,i=!!t.compact,typeof t.decorate=="function"&&(r=t.decorate)),_t(e,r,n,i)}var Jo={offset:0,line:1,column:1};function zl(e,t){let r=e.tokens,n=e.longestMatch,i=n<r.length&&r[n].node||null,o=i!==t?i:null,s=0,u=0,c=0,a="",l,p;for(let h=0;h<r.length;h++){let d=r[h].value;h===n&&(u=d.length,s=a.length),o!==null&&r[h].node===o&&(h<=n?c++:c=0),a+=d;}return n===r.length||c>1?(l=Wt(o||t,"end")||pt(Jo,a),p=pt(l)):(l=Wt(o,"start")||pt(Wt(t,"start")||Jo,a.slice(0,s)),p=Wt(o,"end")||pt(l,a.substr(s,u))),{css:a,mismatchOffset:s,mismatchLength:u,start:l,end:p}}function Wt(e,t){let r=e&&e.loc&&e.loc[t];return r?"line"in r?pt(r):r:null}function pt({offset:e,line:t,column:r},n){let i={offset:e,line:t,column:r};if(n){let o=n.split(/\n|\r\n?|\f/);i.offset+=n.length,i.line+=o.length-1,i.column=o.length===1?i.column+n.length:o.pop().length+1;}return i}var Ye=function(e,t){let r=De("SyntaxReferenceError",e+(t?" `"+t+"`":""));return r.reference=t,r},es=function(e,t,r,n){let i=De("SyntaxMatchError",e),{css:o,mismatchOffset:s,mismatchLength:u,start:c,end:a}=zl(n,r);return i.rawMessage=e,i.syntax=t?Oe(t):"<generic>",i.css=o,i.mismatchOffset=s,i.mismatchLength=u,i.message=e+`
  syntax: `+i.syntax+`
   value: `+(o||"<empty string>")+`
  --------`+new Array(i.mismatchOffset+1).join("-")+"^",Object.assign(i,c),i.loc={source:r&&r.loc&&r.loc.source||"<unknown>",start:c,end:a},i};var qt=new Map,Ke=new Map,jt=45,Ut=Pl,Cr=Il;function Ht(e,t){return t=t||0,e.length-t>=2&&e.charCodeAt(t)===jt&&e.charCodeAt(t+1)===jt}function Tr(e,t){if(t=t||0,e.length-t>=3&&e.charCodeAt(t)===jt&&e.charCodeAt(t+1)!==jt){let r=e.indexOf("-",t+2);if(r!==-1)return e.substring(t,r+1)}return ""}function Pl(e){if(qt.has(e))return qt.get(e);let t=e.toLowerCase(),r=qt.get(t);if(r===void 0){let n=Ht(t,0),i=n?"":Tr(t,0);r=Object.freeze({basename:t.substr(i.length),name:t,prefix:i,vendor:i,custom:n});}return qt.set(e,r),r}function Il(e){if(Ke.has(e))return Ke.get(e);let t=e,r=e[0];r==="/"?r=e[1]==="/"?"//":"/":r!=="_"&&r!=="*"&&r!=="$"&&r!=="#"&&r!=="+"&&r!=="&"&&(r="");let n=Ht(t,r.length);if(!n&&(t=t.toLowerCase(),Ke.has(t))){let u=Ke.get(t);return Ke.set(e,u),u}let i=n?"":Tr(t,r.length),o=t.substr(0,r.length+i.length),s=Object.freeze({basename:t.substr(o.length),name:t.substr(r.length),hack:r,vendor:i,prefix:o,custom:n});return Ke.set(e,s),s}var Ve=["initial","inherit","unset","revert","revert-layer"];var mt=43,de=45,Ar=110,Qe=true,Nl=false;function Er(e,t){return e!==null&&e.type===9&&e.value.charCodeAt(0)===t}function ht(e,t,r){for(;e!==null&&(e.type===13||e.type===25);)e=r(++t);return t}function Te(e,t,r,n){if(!e)return 0;let i=e.value.charCodeAt(t);if(i===mt||i===de){if(r)return 0;t++;}for(;t<e.value.length;t++)if(!O(e.value.charCodeAt(t)))return 0;return n+1}function Lr(e,t,r){let n=false,i=ht(e,t,r);if(e=r(i),e===null)return t;if(e.type!==10)if(Er(e,mt)||Er(e,de)){if(n=true,i=ht(r(++i),i,r),e=r(i),e===null||e.type!==10)return 0}else return t;if(!n){let o=e.value.charCodeAt(0);if(o!==mt&&o!==de)return 0}return Te(e,n?0:1,n,i)}function zr(e,t){let r=0;if(!e)return 0;if(e.type===10)return Te(e,0,Nl,r);if(e.type===1&&e.value.charCodeAt(0)===de){if(!xe(e.value,1,Ar))return 0;switch(e.value.length){case 2:return Lr(t(++r),r,t);case 3:return e.value.charCodeAt(2)!==de?0:(r=ht(t(++r),r,t),e=t(r),Te(e,0,Qe,r));default:return e.value.charCodeAt(2)!==de?0:Te(e,3,Qe,r)}}else if(e.type===1||Er(e,mt)&&t(r+1).type===1){if(e.type!==1&&(e=t(++r)),e===null||!xe(e.value,0,Ar))return 0;switch(e.value.length){case 1:return Lr(t(++r),r,t);case 2:return e.value.charCodeAt(1)!==de?0:(r=ht(t(++r),r,t),e=t(r),Te(e,0,Qe,r));default:return e.value.charCodeAt(1)!==de?0:Te(e,2,Qe,r)}}else if(e.type===12){let n=e.value.charCodeAt(0),i=n===mt||n===de?1:0,o=i;for(;o<e.value.length&&O(e.value.charCodeAt(o));o++);return o===i||!xe(e.value,o,Ar)?0:o+1===e.value.length?Lr(t(++r),r,t):e.value.charCodeAt(o+1)!==de?0:o+2===e.value.length?(r=ht(t(++r),r,t),e=t(r),Te(e,0,Qe,r)):Te(e,o+2,Qe,r)}return 0}var Ol=43,ts=45,rs=63,Rl=117;function Pr(e,t){return e!==null&&e.type===9&&e.value.charCodeAt(0)===t}function Fl(e,t){return e.value.charCodeAt(0)===t}function dt(e,t,r){let n=0;for(let i=t;i<e.value.length;i++){let o=e.value.charCodeAt(i);if(o===ts&&r&&n!==0)return dt(e,t+n+1,false),6;if(!J(o)||++n>6)return 0}return n}function Gt(e,t,r){if(!e)return 0;for(;Pr(r(t),rs);){if(++e>6)return 0;t++;}return t}function Ir(e,t){let r=0;if(e===null||e.type!==1||!xe(e.value,0,Rl)||(e=t(++r),e===null))return 0;if(Pr(e,Ol))return e=t(++r),e===null?0:e.type===1?Gt(dt(e,0,true),++r,t):Pr(e,rs)?Gt(1,++r,t):0;if(e.type===10){let n=dt(e,1,true);return n===0?0:(e=t(++r),e===null?r:e.type===12||e.type===10?!Fl(e,ts)||!dt(e,1,false)?0:r+1:Gt(n,r,t))}return e.type===12?Gt(dt(e,1,true),++r,t):0}var Ml=["calc(","-moz-calc(","-webkit-calc("],Dr=new Map([[2,22],[21,22],[19,20],[23,24]]);function ue(e,t){return t<e.length?e.charCodeAt(t):0}function ns(e,t){return ye(e,0,e.length,t)}function is(e,t){for(let r=0;r<t.length;r++)if(ns(e,t[r]))return  true;return  false}function os(e,t){return t!==e.length-2?false:ue(e,t)===92&&O(ue(e,t+1))}function Yt(e,t,r){if(e&&e.type==="Range"){let n=Number(r!==void 0&&r!==t.length?t.substr(0,r):t);if(isNaN(n)||e.min!==null&&n<e.min&&typeof e.min!="string"||e.max!==null&&n>e.max&&typeof e.max!="string")return  true}return  false}function Bl(e,t){let r=0,n=[],i=0;e:do{switch(e.type){case 24:case 22:case 20:if(e.type!==r)break e;if(r=n.pop(),n.length===0){i++;break e}break;case 2:case 21:case 19:case 23:n.push(r),r=Dr.get(e.type);break}i++;}while(e=t(i));return i}function ie(e){return function(t,r,n){return t===null?0:t.type===2&&is(t.value,Ml)?Bl(t,r):e(t,r,n)}}function I(e){return function(t){return t===null||t.type!==e?0:1}}function _l(e){if(e===null||e.type!==1)return 0;let t=e.value.toLowerCase();return is(t,Ve)||ns(t,"default")?0:1}function ss(e){return e===null||e.type!==1||ue(e.value,0)!==45||ue(e.value,1)!==45?0:1}function Wl(e){return !ss(e)||e.value==="--"?0:1}function ql(e){if(e===null||e.type!==4)return 0;let t=e.value.length;if(t!==4&&t!==5&&t!==7&&t!==9)return 0;for(let r=1;r<t;r++)if(!J(ue(e.value,r)))return 0;return 1}function jl(e){return e===null||e.type!==4||!We(ue(e.value,1),ue(e.value,2),ue(e.value,3))?0:1}function Ul(e,t){if(!e)return 0;let r=0,n=[],i=0;e:do{switch(e.type){case 6:case 8:break e;case 24:case 22:case 20:if(e.type!==r)break e;r=n.pop();break;case 17:if(r===0)break e;break;case 9:if(r===0&&e.value==="!")break e;break;case 2:case 21:case 19:case 23:n.push(r),r=Dr.get(e.type);break}i++;}while(e=t(i));return i}function Hl(e,t){if(!e)return 0;let r=0,n=[],i=0;e:do{switch(e.type){case 6:case 8:break e;case 24:case 22:case 20:if(e.type!==r)break e;r=n.pop();break;case 2:case 21:case 19:case 23:n.push(r),r=Dr.get(e.type);break}i++;}while(e=t(i));return i}function ve(e){return e&&(e=new Set(e)),function(t,r,n){if(t===null||t.type!==12)return 0;let i=Pe(t.value,0);if(e!==null){let o=t.value.indexOf("\\",i),s=o===-1||!os(t.value,o)?t.value.substr(i):t.value.substring(i,o);if(e.has(s.toLowerCase())===false)return 0}return Yt(n,t.value,i)?0:1}}function Gl(e,t,r){return e===null||e.type!==11||Yt(r,e.value,e.value.length-1)?0:1}function as(e){return typeof e!="function"&&(e=function(){return 0}),function(t,r,n){return t!==null&&t.type===10&&Number(t.value)===0?1:e(t,r,n)}}function Yl(e,t,r){if(e===null)return 0;let n=Pe(e.value,0);return !(n===e.value.length)&&!os(e.value,n)||Yt(r,e.value,n)?0:1}function Kl(e,t,r){if(e===null||e.type!==10)return 0;let n=ue(e.value,0)===43||ue(e.value,0)===45?1:0;for(;n<e.value.length;n++)if(!O(ue(e.value,n)))return 0;return Yt(r,e.value,n)?0:1}var Vl={"ident-token":I(1),"function-token":I(2),"at-keyword-token":I(3),"hash-token":I(4),"string-token":I(5),"bad-string-token":I(6),"url-token":I(7),"bad-url-token":I(8),"delim-token":I(9),"number-token":I(10),"percentage-token":I(11),"dimension-token":I(12),"whitespace-token":I(13),"CDO-token":I(14),"CDC-token":I(15),"colon-token":I(16),"semicolon-token":I(17),"comma-token":I(18),"[-token":I(19),"]-token":I(20),"(-token":I(21),")-token":I(22),"{-token":I(23),"}-token":I(24)},Ql={string:I(5),ident:I(1),percentage:ie(Gl),zero:as(),number:ie(Yl),integer:ie(Kl),"custom-ident":_l,"dashed-ident":ss,"custom-property-name":Wl,"hex-color":ql,"id-selector":jl,"an-plus-b":zr,urange:Ir,"declaration-value":Ul,"any-value":Hl};function Xl(e){let{angle:t,decibel:r,frequency:n,flex:i,length:o,resolution:s,semitones:u,time:c}=e||{};return {dimension:ie(ve(null)),angle:ie(ve(t)),decibel:ie(ve(r)),frequency:ie(ve(n)),flex:ie(ve(i)),length:ie(as(ve(o))),resolution:ie(ve(s)),semitones:ie(ve(u)),time:ie(ve(c))}}function ls(e){return {...Vl,...Ql,...Xl(e)}}var Kt={};f(Kt,{angle:()=>Zl,decibel:()=>nc,flex:()=>rc,frequency:()=>ec,length:()=>$l,resolution:()=>tc,semitones:()=>ic,time:()=>Jl});var $l=["cm","mm","q","in","pt","pc","px","em","rem","ex","rex","cap","rcap","ch","rch","ic","ric","lh","rlh","vw","svw","lvw","dvw","vh","svh","lvh","dvh","vi","svi","lvi","dvi","vb","svb","lvb","dvb","vmin","svmin","lvmin","dvmin","vmax","svmax","lvmax","dvmax","cqw","cqh","cqi","cqb","cqmin","cqmax"],Zl=["deg","grad","rad","turn"],Jl=["s","ms"],ec=["hz","khz"],tc=["dpi","dpcm","dppx","x"],rc=["fr"],nc=["db"],ic=["st"];var ws={};f(ws,{SyntaxError:()=>Vt,generate:()=>Oe,parse:()=>Xe,walk:()=>Zt});function Vt(e,t,r){return Object.assign(De("SyntaxError",e),{input:t,offset:r,rawMessage:e,message:e+`
  `+t+`
--`+new Array((r||t.length)+1).join("-")+"^"})}var oc=9,sc=10,ac=12,lc=13,cc=32,cs=new Uint8Array(128).map((e,t)=>/[a-zA-Z0-9\-]/.test(String.fromCharCode(t))?1:0),Qt=class{constructor(t){this.str=t,this.pos=0;}charCodeAt(t){return t<this.str.length?this.str.charCodeAt(t):0}charCode(){return this.charCodeAt(this.pos)}isNameCharCode(t=this.charCode()){return t<128&&cs[t]===1}nextCharCode(){return this.charCodeAt(this.pos+1)}nextNonWsCode(t){return this.charCodeAt(this.findWsEnd(t))}skipWs(){this.pos=this.findWsEnd(this.pos);}findWsEnd(t){for(;t<this.str.length;t++){let r=this.str.charCodeAt(t);if(r!==lc&&r!==sc&&r!==ac&&r!==cc&&r!==oc)break}return t}substringToPos(t){return this.str.substring(this.pos,this.pos=t)}eat(t){this.charCode()!==t&&this.error("Expect `"+String.fromCharCode(t)+"`"),this.pos++;}peek(){return this.pos<this.str.length?this.str.charAt(this.pos++):""}error(t){throw new Vt(t,this.str,this.pos)}scanSpaces(){return this.substringToPos(this.findWsEnd(this.pos))}scanWord(){let t=this.pos;for(;t<this.str.length;t++){let r=this.str.charCodeAt(t);if(r>=128||cs[r]===0)break}return this.pos===t&&this.error("Expect a keyword"),this.substringToPos(t)}scanNumber(){let t=this.pos;for(;t<this.str.length;t++){let r=this.str.charCodeAt(t);if(r<48||r>57)break}return this.pos===t&&this.error("Expect a number"),this.substringToPos(t)}scanString(){let t=this.str.indexOf("'",this.pos+1);return t===-1&&(this.pos=this.str.length,this.error("Expect an apostrophe")),this.substringToPos(t+1)}};var uc=9,pc=10,hc=12,mc=13,dc=32,bs=33,Fr=35,us=38,Xt=39,xs=40,fc=41,ys=42,Mr=43,Br=44,ps=45,_r=60,Or=62,Rr=63,gc=64,ft=91,gt=93,$t=123,hs=124,ms=125,ds=8734,fs={" ":1,"&&":2,"||":3,"|":4};function gs(e){let t=null,r=null;return e.eat($t),e.skipWs(),t=e.scanNumber(e),e.skipWs(),e.charCode()===Br?(e.pos++,e.skipWs(),e.charCode()!==ms&&(r=e.scanNumber(e),e.skipWs())):r=t,e.eat(ms),{min:Number(t),max:r?Number(r):0}}function bc(e){let t=null,r=false;switch(e.charCode()){case ys:e.pos++,t={min:0,max:0};break;case Mr:e.pos++,t={min:1,max:0};break;case Rr:e.pos++,t={min:0,max:1};break;case Fr:e.pos++,r=true,e.charCode()===$t?t=gs(e):e.charCode()===Rr?(e.pos++,t={min:0,max:0}):t={min:1,max:0};break;case $t:t=gs(e);break;default:return null}return {type:"Multiplier",comma:r,min:t.min,max:t.max,term:null}}function Ae(e,t){let r=bc(e);return r!==null?(r.term=t,e.charCode()===Fr&&e.charCodeAt(e.pos-1)===Mr?Ae(e,r):r):t}function Nr(e){let t=e.peek();return t===""?null:Ae(e,{type:"Token",value:t})}function xc(e){let t;return e.eat(_r),e.eat(Xt),t=e.scanWord(),e.eat(Xt),e.eat(Or),Ae(e,{type:"Property",name:t})}function yc(e){let t=null,r=null,n=1;return e.eat(ft),e.charCode()===ps&&(e.peek(),n=-1),n==-1&&e.charCode()===ds?e.peek():(t=n*Number(e.scanNumber(e)),e.isNameCharCode()&&(t+=e.scanWord())),e.skipWs(),e.eat(Br),e.skipWs(),e.charCode()===ds?e.peek():(n=1,e.charCode()===ps&&(e.peek(),n=-1),r=n*Number(e.scanNumber(e)),e.isNameCharCode()&&(r+=e.scanWord())),e.eat(gt),{type:"Range",min:t,max:r}}function kc(e){let t,r=null;if(e.eat(_r),t=e.scanWord(),t==="boolean-expr"){e.eat(ft);let n=Wr(e,gt);return e.eat(gt),e.eat(Or),Ae(e,{type:"Boolean",term:n.terms.length===1?n.terms[0]:n})}return e.charCode()===xs&&e.nextCharCode()===fc&&(e.pos+=2,t+="()"),e.charCodeAt(e.findWsEnd(e.pos))===ft&&(e.skipWs(),r=yc(e)),e.eat(Or),Ae(e,{type:"Type",name:t,opts:r})}function wc(e){let t=e.scanWord();return e.charCode()===xs?(e.pos++,{type:"Function",name:t}):Ae(e,{type:"Keyword",name:t})}function vc(e,t){function r(i,o){return {type:"Group",terms:i,combinator:o,disallowEmpty:false,explicit:false}}let n;for(t=Object.keys(t).sort((i,o)=>fs[i]-fs[o]);t.length>0;){n=t.shift();let i=0,o=0;for(;i<e.length;i++){let s=e[i];s.type==="Combinator"&&(s.value===n?(o===-1&&(o=i-1),e.splice(i,1),i--):(o!==-1&&i-o>1&&(e.splice(o,i-o,r(e.slice(o,i),n)),i=o+1),o=-1));}o!==-1&&t.length&&e.splice(o,i-o,r(e.slice(o,i),n));}return n}function Wr(e,t){let r=Object.create(null),n=[],i,o=null,s=e.pos;for(;e.charCode()!==t&&(i=Cc(e,t));)i.type!=="Spaces"&&(i.type==="Combinator"?((o===null||o.type==="Combinator")&&(e.pos=s,e.error("Unexpected combinator")),r[i.value]=true):o!==null&&o.type!=="Combinator"&&(r[" "]=true,n.push({type:"Combinator",value:" "})),n.push(i),o=i,s=e.pos);return o!==null&&o.type==="Combinator"&&(e.pos-=s,e.error("Unexpected combinator")),{type:"Group",terms:n,combinator:vc(n,r)||" ",disallowEmpty:false,explicit:false}}function Sc(e,t){let r;return e.eat(ft),r=Wr(e,t),e.eat(gt),r.explicit=true,e.charCode()===bs&&(e.pos++,r.disallowEmpty=true),r}function Cc(e,t){let r=e.charCode();switch(r){case gt:break;case ft:return Ae(e,Sc(e,t));case _r:return e.nextCharCode()===Xt?xc(e):kc(e);case hs:return {type:"Combinator",value:e.substringToPos(e.pos+(e.nextCharCode()===hs?2:1))};case us:return e.pos++,e.eat(us),{type:"Combinator",value:"&&"};case Br:return e.pos++,{type:"Comma"};case Xt:return Ae(e,{type:"String",value:e.scanString()});case dc:case uc:case pc:case mc:case hc:return {type:"Spaces",value:e.scanSpaces()};case gc:return r=e.nextCharCode(),e.isNameCharCode(r)?(e.pos++,{type:"AtKeyword",name:e.scanWord()}):Nr(e);case ys:case Mr:case Rr:case Fr:case bs:break;case $t:if(r=e.nextCharCode(),r<48||r>57)return Nr(e);break;default:return e.isNameCharCode(r)?wc(e):Nr(e)}}function Xe(e){let t=new Qt(e),r=Wr(t);return t.pos!==e.length&&t.error("Unexpected input"),r.terms.length===1&&r.terms[0].type==="Group"?r.terms[0]:r}var bt=function(){};function ks(e){return typeof e=="function"?e:bt}function Zt(e,t,r){function n(s){switch(i.call(r,s),s.type){case "Group":s.terms.forEach(n);break;case "Multiplier":case "Boolean":n(s.term);break;case "Type":case "Property":case "Keyword":case "AtKeyword":case "Function":case "String":case "Token":case "Comma":break;default:throw new Error("Unknown type: "+s.type)}o.call(r,s);}let i=bt,o=bt;if(typeof t=="function"?i=t:t&&(i=ks(t.enter),o=ks(t.leave)),i===bt&&o===bt)throw new Error("Neither `enter` nor `leave` walker handler is set or both aren't a function");n(e);}var Tc={decorator(e){let t=[],r=null;return {...e,node(n){let i=r;r=n,e.node.call(this,n),r=i;},emit(n,i,o){t.push({type:i,value:n,node:o?null:r});},result(){return t}}}};function Ac(e){let t=[];return Ce(e,(r,n,i)=>t.push({type:r,value:e.slice(n,i),node:null})),t}function vs(e,t){return typeof e=="string"?Ac(e):t.generate(e,Tc)}var C={type:"Match"},E={type:"Mismatch"},Jt={type:"DisallowEmpty"},Lc=40,Ec=41;function Q(e,t,r){return t===C&&r===E||e===C&&t===C&&r===C?e:(e.type==="If"&&e.else===E&&t===C&&(t=e.then,e=e.match),{type:"If",match:e,then:t,else:r})}function Cs(e){return e.length>2&&e.charCodeAt(e.length-2)===Lc&&e.charCodeAt(e.length-1)===Ec}function Ss(e){return e.type==="Keyword"||e.type==="AtKeyword"||e.type==="Function"||e.type==="Type"&&Cs(e.name)}function Le(e,t=" ",r=false){return {type:"Group",terms:e,combinator:t,disallowEmpty:false,explicit:r}}function xt(e,t,r=new Set){if(!r.has(e))switch(r.add(e),e.type){case "If":e.match=xt(e.match,t,r),e.then=xt(e.then,t,r),e.else=xt(e.else,t,r);break;case "Type":return t[e.name]||e}return e}function qr(e,t,r){switch(e){case " ":{let n=C;for(let i=t.length-1;i>=0;i--){let o=t[i];n=Q(o,n,E);}return n}case "|":{let n=E,i=null;for(let o=t.length-1;o>=0;o--){let s=t[o];if(Ss(s)&&(i===null&&o>0&&Ss(t[o-1])&&(i=Object.create(null),n=Q({type:"Enum",map:i},C,n)),i!==null)){let u=(Cs(s.name)?s.name.slice(0,-1):s.name).toLowerCase();if(!(u in i)){i[u]=s;continue}}i=null,n=Q(s,C,n);}return n}case "&&":{if(t.length>5)return {type:"MatchOnce",terms:t,all:true};let n=E;for(let i=t.length-1;i>=0;i--){let o=t[i],s;t.length>1?s=qr(e,t.filter(function(u){return u!==o}),false):s=C,n=Q(o,s,n);}return n}case "||":{if(t.length>5)return {type:"MatchOnce",terms:t,all:false};let n=r?C:E;for(let i=t.length-1;i>=0;i--){let o=t[i],s;t.length>1?s=qr(e,t.filter(function(u){return u!==o}),true):s=C,n=Q(o,s,n);}return n}}}function zc(e){let t=C,r=$e(e.term);if(e.max===0)r=Q(r,Jt,E),t=Q(r,null,E),t.then=Q(C,C,t),e.comma&&(t.then.else=Q({type:"Comma",syntax:e},t,E));else for(let n=e.min||1;n<=e.max;n++)e.comma&&t!==C&&(t=Q({type:"Comma",syntax:e},t,E)),t=Q(r,Q(C,C,t),E);if(e.min===0)t=Q(C,C,t);else for(let n=0;n<e.min-1;n++)e.comma&&t!==C&&(t=Q({type:"Comma",syntax:e},t,E)),t=Q(r,t,E);return t}function $e(e){if(typeof e=="function")return {type:"Generic",fn:e};switch(e.type){case "Group":{let t=qr(e.combinator,e.terms.map($e),false);return e.disallowEmpty&&(t=Q(t,Jt,E)),t}case "Multiplier":return zc(e);case "Boolean":{let t=$e(e.term),r=$e(Le([Le([{type:"Keyword",name:"not"},{type:"Type",name:"!boolean-group"}]),Le([{type:"Type",name:"!boolean-group"},Le([{type:"Multiplier",comma:false,min:0,max:0,term:Le([{type:"Keyword",name:"and"},{type:"Type",name:"!boolean-group"}])},{type:"Multiplier",comma:false,min:0,max:0,term:Le([{type:"Keyword",name:"or"},{type:"Type",name:"!boolean-group"}])}],"|")])],"|")),n=$e(Le([{type:"Type",name:"!term"},Le([{type:"Token",value:"("},{type:"Type",name:"!self"},{type:"Token",value:")"}]),{type:"Type",name:"general-enclosed"}],"|"));return xt(n,{"!term":t,"!self":r}),xt(r,{"!boolean-group":n}),r}case "Type":case "Property":return {type:e.type,name:e.name,syntax:e};case "Keyword":return {type:e.type,name:e.name.toLowerCase(),syntax:e};case "AtKeyword":return {type:e.type,name:"@"+e.name.toLowerCase(),syntax:e};case "Function":return {type:e.type,name:e.name.toLowerCase()+"(",syntax:e};case "String":return e.value.length===3?{type:"Token",value:e.value.charAt(1),syntax:e}:{type:e.type,value:e.value.substr(1,e.value.length-2).replace(/\\'/g,"'"),syntax:e};case "Token":return {type:e.type,value:e.value,syntax:e};case "Comma":return {type:e.type,syntax:e};default:throw new Error("Unknown node type:",e.type)}}function yt(e,t){return typeof e=="string"&&(e=Xe(e)),{type:"MatchGraph",match:$e(e),syntax:t||null,source:e}}var {hasOwnProperty:Ts}=Object.prototype,Pc=0,Ic=1,Ur=2,Ps=3,As="Match",Dc="Mismatch",Nc="Maximum iteration number exceeded (please fill an issue on https://github.com/csstree/csstree/issues)",Ls=15e3;function Rc(e){let t=null,r=null,n=e;for(;n!==null;)r=n.prev,n.prev=t,t=n,n=r;return t}function jr(e,t){if(e.length!==t.length)return  false;for(let r=0;r<e.length;r++){let n=t.charCodeAt(r),i=e.charCodeAt(r);if(i>=65&&i<=90&&(i=i|32),i!==n)return  false}return  true}function Fc(e){return e.type!==9?false:e.value!=="?"}function Es(e){return e===null?true:e.type===18||e.type===2||e.type===21||e.type===19||e.type===23||Fc(e)}function zs(e){return e===null?true:e.type===22||e.type===20||e.type===24||e.type===9&&e.value==="/"}function Mc(e,t,r){function n(){do T++,w=T<e.length?e[T]:null;while(w!==null&&(w.type===13||w.type===25))}function i(oe){let ge=T+oe;return ge<e.length?e[ge]:null}function o(oe,ge){return {nextState:oe,matchStack:z,syntaxStack:p,thenStack:h,tokenIndex:T,prev:ge}}function s(oe){h={nextState:oe,matchStack:z,syntaxStack:p,prev:h};}function u(oe){d=o(oe,d);}function c(){z={type:Ic,syntax:t.syntax,token:w,prev:z},n(),g=null,T>he&&(he=T);}function a(){p={syntax:t.syntax,opts:t.syntax.opts||p!==null&&p.opts||null,prev:p},z={type:Ur,syntax:t.syntax,token:z.token,prev:z};}function l(){z.type===Ur?z=z.prev:z={type:Ps,syntax:p.syntax,token:z.token,prev:z},p=p.prev;}let p=null,h=null,d=null,g=null,ee=0,j=null,w=null,T=-1,he=0,z={type:Pc,syntax:null,token:null,prev:null};for(n();j===null&&++ee<Ls;)switch(t.type){case "Match":if(h===null){if(w!==null&&(T!==e.length-1||w.value!=="\\0"&&w.value!=="\\9")){t=E;break}j=As;break}if(t=h.nextState,t===Jt)if(h.matchStack===z){t=E;break}else t=C;for(;h.syntaxStack!==p;)l();h=h.prev;break;case "Mismatch":if(g!==null&&g!==false)(d===null||T>d.tokenIndex)&&(d=g,g=false);else if(d===null){j=Dc;break}t=d.nextState,h=d.thenStack,p=d.syntaxStack,z=d.matchStack,T=d.tokenIndex,w=T<e.length?e[T]:null,d=d.prev;break;case "MatchGraph":t=t.match;break;case "If":t.else!==E&&u(t.else),t.then!==C&&s(t.then),t=t.match;break;case "MatchOnce":t={type:"MatchOnceBuffer",syntax:t,index:0,mask:0};break;case "MatchOnceBuffer":{let q=t.syntax.terms;if(t.index===q.length){if(t.mask===0||t.syntax.all){t=E;break}t=C;break}if(t.mask===(1<<q.length)-1){t=C;break}for(;t.index<q.length;t.index++){let U=1<<t.index;if(!(t.mask&U)){u(t),s({type:"AddMatchOnce",syntax:t.syntax,mask:t.mask|U}),t=q[t.index++];break}}break}case "AddMatchOnce":t={type:"MatchOnceBuffer",syntax:t.syntax,index:0,mask:t.mask};break;case "Enum":if(w!==null){let q=w.value.toLowerCase();if(q.indexOf("\\")!==-1&&(q=q.replace(/\\[09].*$/,"")),Ts.call(t.map,q)){t=t.map[q];break}}t=E;break;case "Generic":{let q=p!==null?p.opts:null,U=T+Math.floor(t.fn(w,i,q));if(!isNaN(U)&&U>T){for(;T<U;)c();t=C;}else t=E;break}case "Type":case "Property":{let q=t.type==="Type"?"types":"properties",U=Ts.call(r,q)?r[q][t.name]:null;if(!U||!U.match)throw new Error("Bad syntax reference: "+(t.type==="Type"?"<"+t.name+">":"<'"+t.name+"'>"));if(g!==false&&w!==null&&t.type==="Type"&&(t.name==="custom-ident"&&w.type===1||t.name==="length"&&w.value==="0")){g===null&&(g=o(t,d)),t=E;break}a(),t=U.matchRef||U.match;break}case "Keyword":{let q=t.name;if(w!==null){let U=w.value;if(U.indexOf("\\")!==-1&&(U=U.replace(/\\[09].*$/,"")),jr(U,q)){c(),t=C;break}}t=E;break}case "AtKeyword":case "Function":if(w!==null&&jr(w.value,t.name)){c(),t=C;break}t=E;break;case "Token":if(w!==null&&w.value===t.value){c(),t=C;break}t=E;break;case "Comma":w!==null&&w.type===18?Es(z.token)?t=E:(c(),t=zs(w)?E:C):t=Es(z.token)||zs(w)?C:E;break;case "String":let oe="",ge=T;for(;ge<e.length&&oe.length<t.value.length;ge++)oe+=e[ge].value;if(jr(oe,t.value)){for(;T<ge;)c();t=C;}else t=E;break;default:throw new Error("Unknown node type: "+t.type)}switch(j){case null:console.warn("[csstree-match] BREAK after "+Ls+" iterations"),j=Nc,z=null;break;case As:for(;p!==null;)l();break;default:z=null;}return {tokens:e,reason:j,iterations:ee,match:z,longestMatch:he}}function Hr(e,t,r){let n=Mc(e,t,r||{});if(n.match===null)return n;let i=n.match,o=n.match={syntax:t.syntax||null,match:[]},s=[o];for(i=Rc(i).prev;i!==null;){switch(i.type){case Ur:o.match.push(o={syntax:i.syntax,match:[]}),s.push(o);break;case Ps:s.pop(),o=s[s.length-1];break;default:o.match.push({syntax:i.syntax||null,token:i.token.value,node:i.token.node});}i=i.prev;}return n}var Yr={};f(Yr,{getTrace:()=>Is,isKeyword:()=>Wc,isProperty:()=>_c,isType:()=>Bc});function Is(e){function t(i){return i===null?false:i.type==="Type"||i.type==="Property"||i.type==="Keyword"}function r(i){if(Array.isArray(i.match)){for(let o=0;o<i.match.length;o++)if(r(i.match[o]))return t(i.syntax)&&n.unshift(i.syntax),true}else if(i.node===e)return n=t(i.syntax)?[i.syntax]:[],true;return  false}let n=null;return this.matched!==null&&r(this.matched),n}function Bc(e,t){return Gr(this,e,r=>r.type==="Type"&&r.name===t)}function _c(e,t){return Gr(this,e,r=>r.type==="Property"&&r.name===t)}function Wc(e){return Gr(this,e,t=>t.type==="Keyword")}function Gr(e,t,r){let n=Is.call(e,t);return n===null?false:n.some(r)}function Ds(e){return "node"in e?e.node:Ds(e.match[0])}function Ns(e){return "node"in e?e.node:Ns(e.match[e.match.length-1])}function Kr(e,t,r,n,i){function o(u){if(u.syntax!==null&&u.syntax.type===n&&u.syntax.name===i){let c=Ds(u),a=Ns(u);e.syntax.walk(t,function(l,p,h){if(l===c){let d=new V;do{if(d.appendData(p.data),p.data===a)break;p=p.next;}while(p!==null);s.push({parent:h,nodes:d});}});}Array.isArray(u.match)&&u.match.forEach(o);}let s=[];return r.matched!==null&&o(r.matched),s}var{hasOwnProperty:kt}=Object.prototype;function Vr(e){return typeof e=="number"&&isFinite(e)&&Math.floor(e)===e&&e>=0}function Os(e){return !!e&&Vr(e.offset)&&Vr(e.line)&&Vr(e.column)}function qc(e,t){return function(n,i){if(!n||n.constructor!==Object)return i(n,"Type of node should be an Object");for(let o in n){let s=true;if(kt.call(n,o)!==false){if(o==="type")n.type!==e&&i(n,"Wrong node type `"+n.type+"`, expected `"+e+"`");else if(o==="loc"){if(n.loc===null)continue;if(n.loc&&n.loc.constructor===Object)if(typeof n.loc.source!="string")o+=".source";else if(!Os(n.loc.start))o+=".start";else if(!Os(n.loc.end))o+=".end";else continue;s=false;}else if(t.hasOwnProperty(o)){s=false;for(let u=0;!s&&u<t[o].length;u++){let c=t[o][u];switch(c){case String:s=typeof n[o]=="string";break;case Boolean:s=typeof n[o]=="boolean";break;case null:s=n[o]===null;break;default:typeof c=="string"?s=n[o]&&n[o].type===c:Array.isArray(c)&&(s=n[o]instanceof V);}}}else i(n,"Unknown field `"+o+"` for "+e+" node type");s||i(n,"Bad value for `"+e+"."+o+"`");}}for(let o in t)kt.call(t,o)&&kt.call(n,o)===false&&i(n,"Field `"+e+"."+o+"` is missed");}}function Rs(e,t){let r=[];for(let n=0;n<e.length;n++){let i=e[n];if(i===String||i===Boolean)r.push(i.name.toLowerCase());else if(i===null)r.push("null");else if(typeof i=="string")r.push(i);else if(Array.isArray(i))r.push("List<"+(Rs(i,t)||"any")+">");else throw new Error("Wrong value `"+i+"` in `"+t+"` structure definition")}return r.join(" | ")}function jc(e,t){let r=t.structure,n={type:String,loc:true},i={type:'"'+e+'"'};for(let o in r){if(kt.call(r,o)===false)continue;let s=n[o]=Array.isArray(r[o])?r[o].slice():[r[o]];i[o]=Rs(s,e+"."+o);}return {docs:i,check:qc(e,n)}}function Fs(e){let t={};if(e.node){for(let r in e.node)if(kt.call(e.node,r)){let n=e.node[r];if(n.structure)t[r]=jc(r,n);else throw new Error("Missed `structure` field in `"+r+"` node type definition")}}return t}function Qr(e,t,r){let n={};for(let i in e)e[i].syntax&&(n[i]=r?e[i].syntax:Oe(e[i].syntax,{compact:t}));return n}function Uc(e,t,r){let n={};for(let[i,o]of Object.entries(e))n[i]={prelude:o.prelude&&(r?o.prelude.syntax:Oe(o.prelude.syntax,{compact:t})),descriptors:o.descriptors&&Qr(o.descriptors,t,r)};return n}function Hc(e){for(let t=0;t<e.length;t++)if(e[t].value.toLowerCase()==="var(")return  true;return  false}function Gc(e){let t=e.terms[0];return e.explicit===false&&e.terms.length===1&&t.type==="Multiplier"&&t.comma===true}function pe(e,t,r){return {matched:e,iterations:r,error:t,...Yr}}function Ze(e,t,r,n){let i=vs(r,e.syntax),o;return Hc(i)?pe(null,new Error("Matching for a tree with var() is not supported")):(n&&(o=Hr(i,e.cssWideKeywordsSyntax,e)),(!n||!o.match)&&(o=Hr(i,t.match,e),!o.match)?pe(null,new es(o.reason,t.syntax,r,o),o.iterations):pe(o.match,null,o.iterations))}var Je=class{constructor(t,r,n){if(this.cssWideKeywords=Ve,this.syntax=r,this.generic=false,this.units={...Kt},this.atrules=Object.create(null),this.properties=Object.create(null),this.types=Object.create(null),this.structure=n||Fs(t),t){if(t.cssWideKeywords&&(this.cssWideKeywords=t.cssWideKeywords),t.units)for(let i of Object.keys(Kt))Array.isArray(t.units[i])&&(this.units[i]=t.units[i]);if(t.types)for(let[i,o]of Object.entries(t.types))this.addType_(i,o);if(t.generic){this.generic=true;for(let[i,o]of Object.entries(ls(this.units)))this.addType_(i,o);}if(t.atrules)for(let[i,o]of Object.entries(t.atrules))this.addAtrule_(i,o);if(t.properties)for(let[i,o]of Object.entries(t.properties))this.addProperty_(i,o);}this.cssWideKeywordsSyntax=yt(this.cssWideKeywords.join(" |  "));}checkStructure(t){function r(o,s){i.push({node:o,message:s});}let n=this.structure,i=[];return this.syntax.walk(t,function(o){n.hasOwnProperty(o.type)?n[o.type].check(o,r):r(o,"Unknown node type `"+o.type+"`");}),i.length?i:false}createDescriptor(t,r,n,i=null){let o={type:r,name:n},s={type:r,name:n,parent:i,serializable:typeof t=="string"||t&&typeof t.type=="string",syntax:null,match:null,matchRef:null};return typeof t=="function"?s.match=yt(t,o):(typeof t=="string"?Object.defineProperty(s,"syntax",{get(){return Object.defineProperty(s,"syntax",{value:Xe(t)}),s.syntax}}):s.syntax=t,Object.defineProperty(s,"match",{get(){return Object.defineProperty(s,"match",{value:yt(s.syntax,o)}),s.match}}),r==="Property"&&Object.defineProperty(s,"matchRef",{get(){let u=s.syntax,c=Gc(u)?yt({...u,terms:[u.terms[0].term]},o):null;return Object.defineProperty(s,"matchRef",{value:c}),c}})),s}addAtrule_(t,r){r&&(this.atrules[t]={type:"Atrule",name:t,prelude:r.prelude?this.createDescriptor(r.prelude,"AtrulePrelude",t):null,descriptors:r.descriptors?Object.keys(r.descriptors).reduce((n,i)=>(n[i]=this.createDescriptor(r.descriptors[i],"AtruleDescriptor",i,t),n),Object.create(null)):null});}addProperty_(t,r){r&&(this.properties[t]=this.createDescriptor(r,"Property",t));}addType_(t,r){r&&(this.types[t]=this.createDescriptor(r,"Type",t));}checkAtruleName(t){if(!this.getAtrule(t))return new Ye("Unknown at-rule","@"+t)}checkAtrulePrelude(t,r){let n=this.checkAtruleName(t);if(n)return n;let i=this.getAtrule(t);if(!i.prelude&&r)return new SyntaxError("At-rule `@"+t+"` should not contain a prelude");if(i.prelude&&!r&&!Ze(this,i.prelude,"",false).matched)return new SyntaxError("At-rule `@"+t+"` should contain a prelude")}checkAtruleDescriptorName(t,r){let n=this.checkAtruleName(t);if(n)return n;let i=this.getAtrule(t),o=Ut(r);if(!i.descriptors)return new SyntaxError("At-rule `@"+t+"` has no known descriptors");if(!i.descriptors[o.name]&&!i.descriptors[o.basename])return new Ye("Unknown at-rule descriptor",r)}checkPropertyName(t){if(!this.getProperty(t))return new Ye("Unknown property",t)}matchAtrulePrelude(t,r){let n=this.checkAtrulePrelude(t,r);if(n)return pe(null,n);let i=this.getAtrule(t);return i.prelude?Ze(this,i.prelude,r||"",false):pe(null,null)}matchAtruleDescriptor(t,r,n){let i=this.checkAtruleDescriptorName(t,r);if(i)return pe(null,i);let o=this.getAtrule(t),s=Ut(r);return Ze(this,o.descriptors[s.name]||o.descriptors[s.basename],n,false)}matchDeclaration(t){return t.type!=="Declaration"?pe(null,new Error("Not a Declaration node")):this.matchProperty(t.property,t.value)}matchProperty(t,r){if(Cr(t).custom)return pe(null,new Error("Lexer matching doesn't applicable for custom properties"));let n=this.checkPropertyName(t);return n?pe(null,n):Ze(this,this.getProperty(t),r,true)}matchType(t,r){let n=this.getType(t);return n?Ze(this,n,r,false):pe(null,new Ye("Unknown type",t))}match(t,r){return typeof t!="string"&&(!t||!t.type)?pe(null,new Ye("Bad syntax")):((typeof t=="string"||!t.match)&&(t=this.createDescriptor(t,"Type","anonymous")),Ze(this,t,r,false))}findValueFragments(t,r,n,i){return Kr(this,r,this.matchProperty(t,r),n,i)}findDeclarationValueFragments(t,r,n){return Kr(this,t.value,this.matchDeclaration(t),r,n)}findAllFragments(t,r,n){let i=[];return this.syntax.walk(t,{visit:"Declaration",enter:o=>{i.push.apply(i,this.findDeclarationValueFragments(o,r,n));}}),i}getAtrule(t,r=true){let n=Ut(t);return (n.vendor&&r?this.atrules[n.name]||this.atrules[n.basename]:this.atrules[n.name])||null}getAtrulePrelude(t,r=true){let n=this.getAtrule(t,r);return n&&n.prelude||null}getAtruleDescriptor(t,r){return this.atrules.hasOwnProperty(t)&&this.atrules.declarators&&this.atrules[t].declarators[r]||null}getProperty(t,r=true){let n=Cr(t);return (n.vendor&&r?this.properties[n.name]||this.properties[n.basename]:this.properties[n.name])||null}getType(t){return hasOwnProperty.call(this.types,t)?this.types[t]:null}validate(){function t(c,a){return a?`<${c}>`:`<'${c}'>`}function r(c,a,l,p){if(l.has(a))return l.get(a);l.set(a,false),p.syntax!==null&&Zt(p.syntax,function(h){if(h.type!=="Type"&&h.type!=="Property")return;let d=h.type==="Type"?c.types:c.properties,g=h.type==="Type"?i:o;hasOwnProperty.call(d,h.name)?r(c,h.name,g,d[h.name])&&(n.push(`${t(a,l===i)} used broken syntax definition ${t(h.name,h.type==="Type")}`),l.set(a,true)):(n.push(`${t(a,l===i)} used missed syntax definition ${t(h.name,h.type==="Type")}`),l.set(a,true));},this);}let n=[],i=new Map,o=new Map;for(let c in this.types)r(this,c,i,this.types[c]);for(let c in this.properties)r(this,c,o,this.properties[c]);let s=[...i.keys()].filter(c=>i.get(c)),u=[...o.keys()].filter(c=>o.get(c));return s.length||u.length?{errors:n,types:s,properties:u}:null}dump(t,r){return {generic:this.generic,cssWideKeywords:this.cssWideKeywords,units:this.units,types:Qr(this.types,!r,t),properties:Qr(this.properties,!r,t),atrules:Uc(this.atrules,!r,t)}}toString(){return JSON.stringify(this.dump())}};function Xr(e,t){return typeof t=="string"&&/^\s*\|/.test(t)?typeof e=="string"?e+t:t.replace(/^\s*\|\s*/,""):t||null}function Yc(e,t){let r=Object.create(null);for(let n of Object.keys(e))t.includes(n)&&(r[n]=e[n]);return r}function $r(e,t,r){let n={...e};for(let[i,o]of Object.entries(t))n[i]={...n[i],...r?Yc(o,r):o};return n}function wt(e,t){let r={...e};for(let[n,i]of Object.entries(t))switch(n){case "generic":r[n]=!!i;break;case "cssWideKeywords":r[n]=e[n]?[...e[n],...i]:i||[];break;case "units":r[n]={...e[n]};for(let[o,s]of Object.entries(i))r[n][o]=Array.isArray(s)?s:[];break;case "atrules":r[n]={...e[n]};for(let[o,s]of Object.entries(i)){let u=r[n][o]||{},c=r[n][o]={prelude:u.prelude||null,descriptors:{...u.descriptors}};if(s){c.prelude=s.prelude?Xr(c.prelude,s.prelude):c.prelude||null;for(let[a,l]of Object.entries(s.descriptors||{}))c.descriptors[a]=l?Xr(c.descriptors[a],l):null;Object.keys(c.descriptors).length||(c.descriptors=null);}}break;case "types":case "properties":r[n]={...e[n]};for(let[o,s]of Object.entries(i))r[n][o]=Xr(r[n][o],s);break;case "parseContext":r[n]={...e[n],...i};break;case "scope":case "features":r[n]=$r(e[n],i);break;case "atrule":case "pseudo":r[n]=$r(e[n],i,["parse"]);break;case "node":r[n]=$r(e[n],i,["name","structure","parse","generate","walkContext"]);break}return r}function Ms(e){let t=wo(e),r=Zo(e),n=Yo(e),{fromPlainObject:i,toPlainObject:o}=Ko(r),s={lexer:null,createLexer:u=>new Je(u,s,s.lexer.structure),tokenize:Ce,parse:t,generate:n,walk:r,find:r.find,findLast:r.findLast,findAll:r.findAll,fromPlainObject:i,toPlainObject:o,fork(u){let c=wt({},e);return Ms(typeof u=="function"?u(c):wt(c,u))}};return s.lexer=new Je({generic:e.generic,cssWideKeywords:e.cssWideKeywords,units:e.units,types:e.types,atrules:e.atrules,properties:e.properties,node:e.node},s),s}var Zr=e=>Ms(wt({},e));var Bs={generic:true,cssWideKeywords:["initial","inherit","unset","revert","revert-layer"],units:{angle:["deg","grad","rad","turn"],decibel:["db"],flex:["fr"],frequency:["hz","khz"],length:["cm","mm","q","in","pt","pc","px","em","rem","ex","rex","cap","rcap","ch","rch","ic","ric","lh","rlh","vw","svw","lvw","dvw","vh","svh","lvh","dvh","vi","svi","lvi","dvi","vb","svb","lvb","dvb","vmin","svmin","lvmin","dvmin","vmax","svmax","lvmax","dvmax","cqw","cqh","cqi","cqb","cqmin","cqmax"],resolution:["dpi","dpcm","dppx","x"],semitones:["st"],time:["s","ms"]},types:{"abs()":"abs( <calc-sum> )","absolute-size":"xx-small|x-small|small|medium|large|x-large|xx-large|xxx-large","acos()":"acos( <calc-sum> )","alpha-value":"<number>|<percentage>","an+b":"odd|even|<integer>|<n-dimension>|'+'? \u2020 n|-n|<ndashdigit-dimension>|'+'? \u2020 <ndashdigit-ident>|<dashndashdigit-ident>|<n-dimension> <signed-integer>|'+'? \u2020 n <signed-integer>|-n <signed-integer>|<ndash-dimension> <signless-integer>|'+'? \u2020 n- <signless-integer>|-n- <signless-integer>|<n-dimension> ['+'|'-'] <signless-integer>|'+'? \u2020 n ['+'|'-'] <signless-integer>|-n ['+'|'-'] <signless-integer>","anchor()":"anchor( <anchor-name>?&&<anchor-side> , <length-percentage>? )","anchor-name":"<dashed-ident>","anchor-side":"inside|outside|top|left|right|bottom|start|end|self-start|self-end|<percentage>|center","anchor-size":"width|height|block|inline|self-block|self-inline","anchor-size()":"anchor-size( [<anchor-name>||<anchor-size>]? , <length-percentage>? )","angle-percentage":"<angle>|<percentage>","angular-color-hint":"<angle-percentage>|<zero>","angular-color-stop":"<color> <color-stop-angle>?","angular-color-stop-list":"<angular-color-stop> , [<angular-color-hint>? , <angular-color-stop>]#?","animateable-feature":"scroll-position|contents|<custom-ident>","asin()":"asin( <calc-sum> )","atan()":"atan( <calc-sum> )","atan2()":"atan2( <calc-sum> , <calc-sum> )",attachment:"scroll|fixed|local","attr()":"attr( <attr-name> <type-or-unit>? [, <attr-fallback>]? )","attr-matcher":"['~'|'|'|'^'|'$'|'*']? '='","attr-modifier":"i|s","attribute-selector":"'[' <wq-name> ']'|'[' <wq-name> <attr-matcher> [<string-token>|<ident-token>] <attr-modifier>? ']'","auto-repeat":"repeat( [auto-fill|auto-fit] , [<line-names>? <fixed-size>]+ <line-names>? )","auto-track-list":"[<line-names>? [<fixed-size>|<fixed-repeat>]]* <line-names>? <auto-repeat> [<line-names>? [<fixed-size>|<fixed-repeat>]]* <line-names>?",axis:"block|inline|x|y","baseline-position":"[first|last]? baseline","basic-shape":"<inset()>|<xywh()>|<rect()>|<circle()>|<ellipse()>|<polygon()>|<path()>","basic-shape-rect":"<inset()>|<rect()>|<xywh()>","bg-clip":"<visual-box>|border-area|text","bg-image":"none|<image>","bg-layer":"<bg-image>||<bg-position> [/ <bg-size>]?||<repeat-style>||<attachment>||<visual-box>||<visual-box>","bg-position":"[[left|center|right|top|bottom|<length-percentage>]|[left|center|right|<length-percentage>] [top|center|bottom|<length-percentage>]|[center|[left|right] <length-percentage>?]&&[center|[top|bottom] <length-percentage>?]]","bg-size":"[<length-percentage>|auto]{1,2}|cover|contain","blend-mode":"normal|multiply|screen|overlay|darken|lighten|color-dodge|color-burn|hard-light|soft-light|difference|exclusion|hue|saturation|color|luminosity","blur()":"blur( <length>? )","brightness()":"brightness( [<number>|<percentage>]? )","calc()":"calc( <calc-sum> )","calc-constant":"e|pi|infinity|-infinity|NaN","calc-product":"<calc-value> ['*' <calc-value>|'/' <number>]*","calc-size()":"calc-size( <calc-size-basis> , <calc-sum> )","calc-size-basis":"<intrinsic-size-keyword>|<calc-size()>|any|<calc-sum>","calc-sum":"<calc-product> [['+'|'-'] <calc-product>]*","calc-value":"<number>|<dimension>|<percentage>|<calc-constant>|( <calc-sum> )","cf-final-image":"<image>|<color>","cf-mixing-image":"<percentage>?&&<image>","circle()":"circle( <radial-size>? [at <position>]? )","clamp()":"clamp( <calc-sum>#{3} )","class-selector":"'.' <ident-token>","clip-source":"<url>",color:"<color-base>|currentColor|<system-color>|<device-cmyk()>|<light-dark()>|<-non-standard-color>","color()":"color( <colorspace-params> [/ [<alpha-value>|none]]? )","color-base":"<hex-color>|<color-function>|<named-color>|<color-mix()>|transparent","color-function":"<rgb()>|<rgba()>|<hsl()>|<hsla()>|<hwb()>|<lab()>|<lch()>|<oklab()>|<oklch()>|<color()>","color-interpolation-method":"in [<rectangular-color-space>|<polar-color-space> <hue-interpolation-method>?|<custom-color-space>]","color-mix()":"color-mix( <color-interpolation-method> , [<color>&&<percentage [0,100]>?]#{2} )","color-stop":"<color-stop-length>|<color-stop-angle>","color-stop-angle":"[<angle-percentage>|<zero>]{1,2}","color-stop-length":"<length-percentage>{1,2}","color-stop-list":"<linear-color-stop> , [<linear-color-hint>? , <linear-color-stop>]#?","colorspace-params":"[<predefined-rgb-params>|<xyz-params>]",combinator:"'>'|'+'|'~'|['|' '|']","common-lig-values":"[common-ligatures|no-common-ligatures]","compat-auto":"searchfield|textarea|push-button|slider-horizontal|checkbox|radio|square-button|menulist|listbox|meter|progress-bar|button","complex-selector":"<complex-selector-unit> [<combinator>? <complex-selector-unit>]*","complex-selector-list":"<complex-selector>#","composite-style":"clear|copy|source-over|source-in|source-out|source-atop|destination-over|destination-in|destination-out|destination-atop|xor","compositing-operator":"add|subtract|intersect|exclude","compound-selector":"[<type-selector>? <subclass-selector>*]!","compound-selector-list":"<compound-selector>#","conic-gradient()":"conic-gradient( [<conic-gradient-syntax>] )","conic-gradient-syntax":"[[[from [<angle>|<zero>]]? [at <position>]?]||<color-interpolation-method>]? , <angular-color-stop-list>","container-condition":"not <query-in-parens>|<query-in-parens> [[and <query-in-parens>]*|[or <query-in-parens>]*]","container-name":"<custom-ident>","container-query":"not <query-in-parens>|<query-in-parens> [[and <query-in-parens>]*|[or <query-in-parens>]*]","content-distribution":"space-between|space-around|space-evenly|stretch","content-list":"[<string>|contents|<image>|<counter>|<quote>|<target>|<leader()>|<attr()>]+","content-position":"center|start|end|flex-start|flex-end","content-replacement":"<image>","contextual-alt-values":"[contextual|no-contextual]","contrast()":"contrast( [<number>|<percentage>]? )","coord-box":"content-box|padding-box|border-box|fill-box|stroke-box|view-box","cos()":"cos( <calc-sum> )",counter:"<counter()>|<counters()>","counter()":"counter( <counter-name> , <counter-style>? )","counter-name":"<custom-ident>","counter-style":"<counter-style-name>|symbols( )","counter-style-name":"<custom-ident>","counters()":"counters( <counter-name> , <string> , <counter-style>? )","cross-fade()":"cross-fade( <cf-mixing-image> , <cf-final-image>? )","cubic-bezier()":"cubic-bezier( [<number [0,1]> , <number>]#{2} )","cubic-bezier-timing-function":"ease|ease-in|ease-out|ease-in-out|<cubic-bezier()>","custom-color-space":"<dashed-ident>","custom-params":"<dashed-ident> [<number>|<percentage>|none]+",dasharray:"[[<length-percentage>|<number>]+]#","dashndashdigit-ident":"<ident-token>","deprecated-system-color":"ActiveBorder|ActiveCaption|AppWorkspace|Background|ButtonHighlight|ButtonShadow|CaptionText|InactiveBorder|InactiveCaption|InactiveCaptionText|InfoBackground|InfoText|Menu|MenuText|Scrollbar|ThreeDDarkShadow|ThreeDFace|ThreeDHighlight|ThreeDLightShadow|ThreeDShadow|Window|WindowFrame|WindowText","discretionary-lig-values":"[discretionary-ligatures|no-discretionary-ligatures]","display-box":"contents|none","display-inside":"flow|flow-root|table|flex|grid|ruby","display-internal":"table-row-group|table-header-group|table-footer-group|table-row|table-cell|table-column-group|table-column|table-caption|ruby-base|ruby-text|ruby-base-container|ruby-text-container","display-legacy":"inline-block|inline-list-item|inline-table|inline-flex|inline-grid","display-listitem":"<display-outside>?&&[flow|flow-root]?&&list-item","display-outside":"block|inline|run-in","drop-shadow()":"drop-shadow( [<color>?&&<length>{2,3}] )","easing-function":"<linear-easing-function>|<cubic-bezier-easing-function>|<step-easing-function>","east-asian-variant-values":"[jis78|jis83|jis90|jis04|simplified|traditional]","east-asian-width-values":"[full-width|proportional-width]","element()":"element( <custom-ident> , [first|start|last|first-except]? )|element( <id-selector> )","ellipse()":"ellipse( <radial-size>? [at <position>]? )","env()":"env( <custom-ident> , <declaration-value>? )","exp()":"exp( <calc-sum> )","explicit-track-list":"[<line-names>? <track-size>]+ <line-names>?","family-name":"<string>|<custom-ident>+","feature-tag-value":"<string> [<integer>|on|off]?","feature-type":"@stylistic|@historical-forms|@styleset|@character-variant|@swash|@ornaments|@annotation","feature-value-block":"<feature-type> '{' <feature-value-declaration-list> '}'","feature-value-block-list":"<feature-value-block>+","feature-value-declaration":"<custom-ident> : <integer>+ ;","feature-value-declaration-list":"<feature-value-declaration>","feature-value-name":"<custom-ident>","filter-function":"<blur()>|<brightness()>|<contrast()>|<drop-shadow()>|<grayscale()>|<hue-rotate()>|<invert()>|<opacity()>|<saturate()>|<sepia()>","filter-value-list":"[<filter-function>|<url>]+","final-bg-layer":"<'background-color'>||<bg-image>||<bg-position> [/ <bg-size>]?||<repeat-style>||<attachment>||<visual-box>||<visual-box>","fit-content()":"fit-content( <length-percentage [0,\u221E]> )","fixed-breadth":"<length-percentage>","fixed-repeat":"repeat( [<integer [1,\u221E]>] , [<line-names>? <fixed-size>]+ <line-names>? )","fixed-size":"<fixed-breadth>|minmax( <fixed-breadth> , <track-breadth> )|minmax( <inflexible-breadth> , <fixed-breadth> )","font-stretch-absolute":"normal|ultra-condensed|extra-condensed|condensed|semi-condensed|semi-expanded|expanded|extra-expanded|ultra-expanded|<percentage>","font-variant-css21":"[normal|small-caps]","font-weight-absolute":"normal|bold|<number [1,1000]>","form-control-identifier":"select","frequency-percentage":"<frequency>|<percentage>","generic-complete":"serif|sans-serif|system-ui|cursive|fantasy|math|monospace","general-enclosed":"[<function-token> <any-value>? )]|[( <any-value>? )]","generic-family":"<generic-script-specific>|<generic-complete>|<generic-incomplete>|<-non-standard-generic-family>","generic-incomplete":"ui-serif|ui-sans-serif|ui-monospace|ui-rounded","geometry-box":"<shape-box>|fill-box|stroke-box|view-box",gradient:"<linear-gradient()>|<repeating-linear-gradient()>|<radial-gradient()>|<repeating-radial-gradient()>|<conic-gradient()>|<repeating-conic-gradient()>|<-legacy-gradient>","grayscale()":"grayscale( [<number>|<percentage>]? )","grid-line":"auto|<custom-ident>|[<integer>&&<custom-ident>?]|[span&&[<integer>||<custom-ident>]]","historical-lig-values":"[historical-ligatures|no-historical-ligatures]","hsl()":"hsl( <hue> , <percentage> , <percentage> , <alpha-value>? )|hsl( [<hue>|none] [<percentage>|<number>|none] [<percentage>|<number>|none] [/ [<alpha-value>|none]]? )","hsla()":"hsla( <hue> , <percentage> , <percentage> , <alpha-value>? )|hsla( [<hue>|none] [<percentage>|<number>|none] [<percentage>|<number>|none] [/ [<alpha-value>|none]]? )",hue:"<number>|<angle>","hue-interpolation-method":"[shorter|longer|increasing|decreasing] hue","hue-rotate()":"hue-rotate( [<angle>|<zero>]? )","hwb()":"hwb( [<hue>|none] [<percentage>|<number>|none] [<percentage>|<number>|none] [/ [<alpha-value>|none]]? )","hypot()":"hypot( <calc-sum># )",image:"<url>|<image()>|<image-set()>|<element()>|<paint()>|<cross-fade()>|<gradient>","image()":"image( <image-tags>? [<image-src>? , <color>?]! )","image-set()":"image-set( <image-set-option># )","image-set-option":"[<image>|<string>] [<resolution>||type( <string> )]","image-src":"<url>|<string>","image-tags":"ltr|rtl","inflexible-breadth":"<length-percentage>|min-content|max-content|auto","inset()":"inset( <length-percentage>{1,4} [round <'border-radius'>]? )","invert()":"invert( [<number>|<percentage>]? )","keyframe-block":"<keyframe-selector># { <declaration-list> }","keyframe-selector":"from|to|<percentage [0,100]>|<timeline-range-name> <percentage>","keyframes-name":"<custom-ident>|<string>","lab()":"lab( [<percentage>|<number>|none] [<percentage>|<number>|none] [<percentage>|<number>|none] [/ [<alpha-value>|none]]? )","layer()":"layer( <layer-name> )","layer-name":"<ident> ['.' <ident>]*","lch()":"lch( [<percentage>|<number>|none] [<percentage>|<number>|none] [<hue>|none] [/ [<alpha-value>|none]]? )","leader()":"leader( <leader-type> )","leader-type":"dotted|solid|space|<string>","length-percentage":"<length>|<percentage>","light-dark()":"light-dark( <color> , <color> )","line-name-list":"[<line-names>|<name-repeat>]+","line-names":"'[' <custom-ident>* ']'","line-style":"none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset","line-width":"<length>|thin|medium|thick","linear()":"linear( [<number>&&<percentage>{0,2}]# )","linear-color-hint":"<length-percentage>","linear-color-stop":"<color> <color-stop-length>?","linear-easing-function":"linear|<linear()>","linear-gradient()":"linear-gradient( [<linear-gradient-syntax>] )","linear-gradient-syntax":"[[<angle>|<zero>|to <side-or-corner>]||<color-interpolation-method>]? , <color-stop-list>","log()":"log( <calc-sum> , <calc-sum>? )","mask-layer":"<mask-reference>||<position> [/ <bg-size>]?||<repeat-style>||<geometry-box>||[<geometry-box>|no-clip]||<compositing-operator>||<masking-mode>","mask-position":"[<length-percentage>|left|center|right] [<length-percentage>|top|center|bottom]?","mask-reference":"none|<image>|<mask-source>","mask-source":"<url>","masking-mode":"alpha|luminance|match-source","matrix()":"matrix( <number>#{6} )","matrix3d()":"matrix3d( <number>#{16} )","max()":"max( <calc-sum># )","media-and":"<media-in-parens> [and <media-in-parens>]+","media-condition":"<media-not>|<media-and>|<media-or>|<media-in-parens>","media-condition-without-or":"<media-not>|<media-and>|<media-in-parens>","media-feature":"( [<mf-plain>|<mf-boolean>|<mf-range>] )","media-in-parens":"( <media-condition> )|<media-feature>|<general-enclosed>","media-not":"not <media-in-parens>","media-or":"<media-in-parens> [or <media-in-parens>]+","media-query":"<media-condition>|[not|only]? <media-type> [and <media-condition-without-or>]?","media-query-list":"<media-query>#","media-type":"<ident>","mf-boolean":"<mf-name>","mf-name":"<ident>","mf-plain":"<mf-name> : <mf-value>","mf-range":"<mf-name> ['<'|'>']? '='? <mf-value>|<mf-value> ['<'|'>']? '='? <mf-name>|<mf-value> '<' '='? <mf-name> '<' '='? <mf-value>|<mf-value> '>' '='? <mf-name> '>' '='? <mf-value>","mf-value":"<number>|<dimension>|<ident>|<ratio>","min()":"min( <calc-sum># )","minmax()":"minmax( [<length-percentage>|min-content|max-content|auto] , [<length-percentage>|<flex>|min-content|max-content|auto] )","mod()":"mod( <calc-sum> , <calc-sum> )","n-dimension":"<dimension-token>","name-repeat":"repeat( [<integer [1,\u221E]>|auto-fill] , <line-names>+ )","named-color":"aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen","namespace-prefix":"<ident>","ndash-dimension":"<dimension-token>","ndashdigit-dimension":"<dimension-token>","ndashdigit-ident":"<ident-token>","ns-prefix":"[<ident-token>|'*']? '|'","number-percentage":"<number>|<percentage>","numeric-figure-values":"[lining-nums|oldstyle-nums]","numeric-fraction-values":"[diagonal-fractions|stacked-fractions]","numeric-spacing-values":"[proportional-nums|tabular-nums]","offset-path":"<ray()>|<url>|<basic-shape>","oklab()":"oklab( [<percentage>|<number>|none] [<percentage>|<number>|none] [<percentage>|<number>|none] [/ [<alpha-value>|none]]? )","oklch()":"oklch( [<percentage>|<number>|none] [<percentage>|<number>|none] [<hue>|none] [/ [<alpha-value>|none]]? )","opacity()":"opacity( [<number>|<percentage>]? )","opacity-value":"<number>|<percentage>","outline-line-style":"none|dotted|dashed|solid|double|groove|ridge|inset|outset","outline-radius":"<length>|<percentage>","overflow-position":"unsafe|safe","page-body":"<declaration>? [; <page-body>]?|<page-margin-box> <page-body>","page-margin-box":"<page-margin-box-type> '{' <declaration-list> '}'","page-margin-box-type":"@top-left-corner|@top-left|@top-center|@top-right|@top-right-corner|@bottom-left-corner|@bottom-left|@bottom-center|@bottom-right|@bottom-right-corner|@left-top|@left-middle|@left-bottom|@right-top|@right-middle|@right-bottom","page-selector":"<pseudo-page>+|<ident> <pseudo-page>*","page-selector-list":"[<page-selector>#]?","page-size":"A5|A4|A3|B5|B4|JIS-B5|JIS-B4|letter|legal|ledger",paint:"none|<color>|<url> [none|<color>]?|context-fill|context-stroke","paint()":"paint( <ident> , <declaration-value>? )","paint-box":"<visual-box>|fill-box|stroke-box","palette-identifier":"<dashed-ident>","palette-mix()":"palette-mix( <color-interpolation-method> , [[normal|light|dark|<palette-identifier>|<palette-mix()>]&&<percentage [0,100]>?]#{2} )","path()":"path( <'fill-rule'>? , <string> )","perspective()":"perspective( [<length [0,\u221E]>|none] )","polar-color-space":"hsl|hwb|lch|oklch","polygon()":"polygon( <'fill-rule'>? , [<length-percentage> <length-percentage>]# )",position:"[[left|center|right]||[top|center|bottom]|[left|center|right|<length-percentage>] [top|center|bottom|<length-percentage>]?|[[left|right] <length-percentage>]&&[[top|bottom] <length-percentage>]]","position-area":"[[left|center|right|span-left|span-right|x-start|x-end|span-x-start|span-x-end|x-self-start|x-self-end|span-x-self-start|span-x-self-end|span-all]||[top|center|bottom|span-top|span-bottom|y-start|y-end|span-y-start|span-y-end|y-self-start|y-self-end|span-y-self-start|span-y-self-end|span-all]|[block-start|center|block-end|span-block-start|span-block-end|span-all]||[inline-start|center|inline-end|span-inline-start|span-inline-end|span-all]|[self-block-start|center|self-block-end|span-self-block-start|span-self-block-end|span-all]||[self-inline-start|center|self-inline-end|span-self-inline-start|span-self-inline-end|span-all]|[start|center|end|span-start|span-end|span-all]{1,2}|[self-start|center|self-end|span-self-start|span-self-end|span-all]{1,2}]","pow()":"pow( <calc-sum> , <calc-sum> )","predefined-rgb":"srgb|srgb-linear|display-p3|a98-rgb|prophoto-rgb|rec2020","predefined-rgb-params":"<predefined-rgb> [<number>|<percentage>|none]{3}","pseudo-class-selector":"':' <ident-token>|':' <function-token> <any-value> ')'","pseudo-element-selector":"':' <pseudo-class-selector>|<legacy-pseudo-element-selector>","pseudo-page":": [left|right|first|blank]","query-in-parens":"( <container-condition> )|( <size-feature> )|style( <style-query> )|<general-enclosed>",quote:"open-quote|close-quote|no-open-quote|no-close-quote","radial-extent":"closest-corner|closest-side|farthest-corner|farthest-side","radial-gradient()":"radial-gradient( [<radial-gradient-syntax>] )","radial-gradient-syntax":"[[[<radial-shape>||<radial-size>]? [at <position>]?]||<color-interpolation-method>]? , <color-stop-list>","radial-shape":"circle|ellipse","radial-size":"<radial-extent>|<length [0,\u221E]>|<length-percentage [0,\u221E]>{2}",ratio:"<number [0,\u221E]> [/ <number [0,\u221E]>]?","ray()":"ray( <angle>&&<ray-size>?&&contain?&&[at <position>]? )","ray-size":"closest-side|closest-corner|farthest-side|farthest-corner|sides","rect()":"rect( [<length-percentage>|auto]{4} [round <'border-radius'>]? )","rectangular-color-space":"srgb|srgb-linear|display-p3|a98-rgb|prophoto-rgb|rec2020|lab|oklab|xyz|xyz-d50|xyz-d65","relative-selector":"<combinator>? <complex-selector>","relative-selector-list":"<relative-selector>#","relative-size":"larger|smaller","rem()":"rem( <calc-sum> , <calc-sum> )","repeat-style":"repeat-x|repeat-y|[repeat|space|round|no-repeat]{1,2}","repeating-conic-gradient()":"repeating-conic-gradient( [<conic-gradient-syntax>] )","repeating-linear-gradient()":"repeating-linear-gradient( [<linear-gradient-syntax>] )","repeating-radial-gradient()":"repeating-radial-gradient( [<radial-gradient-syntax>] )","reversed-counter-name":"reversed( <counter-name> )","rgb()":"rgb( <percentage>#{3} , <alpha-value>? )|rgb( <number>#{3} , <alpha-value>? )|rgb( [<number>|<percentage>|none]{3} [/ [<alpha-value>|none]]? )","rgba()":"rgba( <percentage>#{3} , <alpha-value>? )|rgba( <number>#{3} , <alpha-value>? )|rgba( [<number>|<percentage>|none]{3} [/ [<alpha-value>|none]]? )","rotate()":"rotate( [<angle>|<zero>] )","rotate3d()":"rotate3d( <number> , <number> , <number> , [<angle>|<zero>] )","rotateX()":"rotateX( [<angle>|<zero>] )","rotateY()":"rotateY( [<angle>|<zero>] )","rotateZ()":"rotateZ( [<angle>|<zero>] )","round()":"round( <rounding-strategy>? , <calc-sum> , <calc-sum> )","rounding-strategy":"nearest|up|down|to-zero","saturate()":"saturate( [<number>|<percentage>]? )","scale()":"scale( [<number>|<percentage>]#{1,2} )","scale3d()":"scale3d( [<number>|<percentage>]#{3} )","scaleX()":"scaleX( [<number>|<percentage>] )","scaleY()":"scaleY( [<number>|<percentage>] )","scaleZ()":"scaleZ( [<number>|<percentage>] )","scope-end":"<forgiving-selector-list>","scope-start":"<forgiving-selector-list>","scroll()":"scroll( [<scroller>||<axis>]? )",scroller:"root|nearest|self","scroll-state-feature":"<media-query-list>","scroll-state-in-parens":"( <scroll-state-query> )|( <scroll-state-feature> )|<general-enclosed>","scroll-state-query":"not <scroll-state-in-parens>|<scroll-state-in-parens> [[and <scroll-state-in-parens>]*|[or <scroll-state-in-parens>]*]|<scroll-state-feature>","selector-list":"<complex-selector-list>","self-position":"center|start|end|self-start|self-end|flex-start|flex-end","sepia()":"sepia( [<number>|<percentage>]? )",shadow:"inset?&&<length>{2,4}&&<color>?","shadow-t":"[<length>{2,3}&&<color>?]",shape:"rect( <top> , <right> , <bottom> , <left> )|rect( <top> <right> <bottom> <left> )","shape-box":"<visual-box>|margin-box","side-or-corner":"[left|right]||[top|bottom]","sign()":"sign( <calc-sum> )","signed-integer":"<number-token>","signless-integer":"<number-token>","sin()":"sin( <calc-sum> )","single-animation":"<'animation-duration'>||<easing-function>||<'animation-delay'>||<single-animation-iteration-count>||<single-animation-direction>||<single-animation-fill-mode>||<single-animation-play-state>||[none|<keyframes-name>]||<single-animation-timeline>","single-animation-composition":"replace|add|accumulate","single-animation-direction":"normal|reverse|alternate|alternate-reverse","single-animation-fill-mode":"none|forwards|backwards|both","single-animation-iteration-count":"infinite|<number>","single-animation-play-state":"running|paused","single-animation-timeline":"auto|none|<dashed-ident>|<scroll()>|<view()>","single-transition":"[none|<single-transition-property>]||<time>||<easing-function>||<time>||<transition-behavior-value>","single-transition-property":"all|<custom-ident>",size:"closest-side|farthest-side|closest-corner|farthest-corner|<length>|<length-percentage>{2}","size-feature":"<mf-plain>|<mf-boolean>|<mf-range>","skew()":"skew( [<angle>|<zero>] , [<angle>|<zero>]? )","skewX()":"skewX( [<angle>|<zero>] )","skewY()":"skewY( [<angle>|<zero>] )","sqrt()":"sqrt( <calc-sum> )","step-position":"jump-start|jump-end|jump-none|jump-both|start|end","step-easing-function":"step-start|step-end|<steps()>","steps()":"steps( <integer> , <step-position>? )","style-feature":"<declaration>","style-in-parens":"( <style-condition> )|( <style-feature> )|<general-enclosed>","style-query":"<style-condition>|<style-feature>","subclass-selector":"<id-selector>|<class-selector>|<attribute-selector>|<pseudo-class-selector>","supports-condition":"not <supports-in-parens>|<supports-in-parens> [and <supports-in-parens>]*|<supports-in-parens> [or <supports-in-parens>]*","supports-decl":"( <declaration> )","supports-feature":"<supports-decl>|<supports-selector-fn>","supports-in-parens":"( <supports-condition> )|<supports-feature>|<general-enclosed>","supports-selector-fn":"selector( <complex-selector> )",symbol:"<string>|<image>|<custom-ident>","symbols()":"symbols( <symbols-type>? [<string>|<image>]+ )","symbols-type":"cyclic|numeric|alphabetic|symbolic|fixed","system-color":"AccentColor|AccentColorText|ActiveText|ButtonBorder|ButtonFace|ButtonText|Canvas|CanvasText|Field|FieldText|GrayText|Highlight|HighlightText|LinkText|Mark|MarkText|SelectedItem|SelectedItemText|VisitedText","tan()":"tan( <calc-sum> )",target:"<target-counter()>|<target-counters()>|<target-text()>","target-counter()":"target-counter( [<string>|<url>] , <custom-ident> , <counter-style>? )","target-counters()":"target-counters( [<string>|<url>] , <custom-ident> , <string> , <counter-style>? )","target-text()":"target-text( [<string>|<url>] , [content|before|after|first-letter]? )","text-edge":"[text|cap|ex|ideographic|ideographic-ink] [text|alphabetic|ideographic|ideographic-ink]?","time-percentage":"<time>|<percentage>","timeline-range-name":"cover|contain|entry|exit|entry-crossing|exit-crossing","track-breadth":"<length-percentage>|<flex>|min-content|max-content|auto","track-list":"[<line-names>? [<track-size>|<track-repeat>]]+ <line-names>?","track-repeat":"repeat( [<integer [1,\u221E]>] , [<line-names>? <track-size>]+ <line-names>? )","track-size":"<track-breadth>|minmax( <inflexible-breadth> , <track-breadth> )|fit-content( <length-percentage> )","transform-function":"<matrix()>|<translate()>|<translateX()>|<translateY()>|<scale()>|<scaleX()>|<scaleY()>|<rotate()>|<skew()>|<skewX()>|<skewY()>|<matrix3d()>|<translate3d()>|<translateZ()>|<scale3d()>|<scaleZ()>|<rotate3d()>|<rotateX()>|<rotateY()>|<rotateZ()>|<perspective()>","transform-list":"<transform-function>+","transition-behavior-value":"normal|allow-discrete","translate()":"translate( <length-percentage> , <length-percentage>? )","translate3d()":"translate3d( <length-percentage> , <length-percentage> , <length> )","translateX()":"translateX( <length-percentage> )","translateY()":"translateY( <length-percentage> )","translateZ()":"translateZ( <length> )","try-size":"most-width|most-height|most-block-size|most-inline-size","try-tactic":"flip-block||flip-inline||flip-start","type-or-unit":"string|color|url|integer|number|length|angle|time|frequency|cap|ch|em|ex|ic|lh|rlh|rem|vb|vi|vw|vh|vmin|vmax|mm|Q|cm|in|pt|pc|px|deg|grad|rad|turn|ms|s|Hz|kHz|%","type-selector":"<wq-name>|<ns-prefix>? '*'","var()":"var( <custom-property-name> , <declaration-value>? )","view()":"view( [<axis>||<'view-timeline-inset'>]? )","viewport-length":"auto|<length-percentage>","visual-box":"content-box|padding-box|border-box","wq-name":"<ns-prefix>? <ident-token>","xywh()":"xywh( <length-percentage>{2} <length-percentage [0,\u221E]>{2} [round <'border-radius'>]? )",xyz:"xyz|xyz-d50|xyz-d65","xyz-params":"<xyz-space> [<number>|<percentage>|none]{3}","-legacy-gradient":"<-webkit-gradient()>|<-legacy-linear-gradient>|<-legacy-repeating-linear-gradient>|<-legacy-radial-gradient>|<-legacy-repeating-radial-gradient>","-legacy-linear-gradient":"-moz-linear-gradient( <-legacy-linear-gradient-arguments> )|-webkit-linear-gradient( <-legacy-linear-gradient-arguments> )|-o-linear-gradient( <-legacy-linear-gradient-arguments> )","-legacy-repeating-linear-gradient":"-moz-repeating-linear-gradient( <-legacy-linear-gradient-arguments> )|-webkit-repeating-linear-gradient( <-legacy-linear-gradient-arguments> )|-o-repeating-linear-gradient( <-legacy-linear-gradient-arguments> )","-legacy-linear-gradient-arguments":"[<angle>|<side-or-corner>]? , <color-stop-list>","-legacy-radial-gradient":"-moz-radial-gradient( <-legacy-radial-gradient-arguments> )|-webkit-radial-gradient( <-legacy-radial-gradient-arguments> )|-o-radial-gradient( <-legacy-radial-gradient-arguments> )","-legacy-repeating-radial-gradient":"-moz-repeating-radial-gradient( <-legacy-radial-gradient-arguments> )|-webkit-repeating-radial-gradient( <-legacy-radial-gradient-arguments> )|-o-repeating-radial-gradient( <-legacy-radial-gradient-arguments> )","-legacy-radial-gradient-arguments":"[<position> ,]? [[[<-legacy-radial-gradient-shape>||<-legacy-radial-gradient-size>]|[<length>|<percentage>]{2}] ,]? <color-stop-list>","-legacy-radial-gradient-size":"closest-side|closest-corner|farthest-side|farthest-corner|contain|cover","-legacy-radial-gradient-shape":"circle|ellipse","-non-standard-font":"-apple-system-body|-apple-system-headline|-apple-system-subheadline|-apple-system-caption1|-apple-system-caption2|-apple-system-footnote|-apple-system-short-body|-apple-system-short-headline|-apple-system-short-subheadline|-apple-system-short-caption1|-apple-system-short-footnote|-apple-system-tall-body","-non-standard-color":"-moz-ButtonDefault|-moz-ButtonHoverFace|-moz-ButtonHoverText|-moz-CellHighlight|-moz-CellHighlightText|-moz-Combobox|-moz-ComboboxText|-moz-Dialog|-moz-DialogText|-moz-dragtargetzone|-moz-EvenTreeRow|-moz-Field|-moz-FieldText|-moz-html-CellHighlight|-moz-html-CellHighlightText|-moz-mac-accentdarkestshadow|-moz-mac-accentdarkshadow|-moz-mac-accentface|-moz-mac-accentlightesthighlight|-moz-mac-accentlightshadow|-moz-mac-accentregularhighlight|-moz-mac-accentregularshadow|-moz-mac-chrome-active|-moz-mac-chrome-inactive|-moz-mac-focusring|-moz-mac-menuselect|-moz-mac-menushadow|-moz-mac-menutextselect|-moz-MenuHover|-moz-MenuHoverText|-moz-MenuBarText|-moz-MenuBarHoverText|-moz-nativehyperlinktext|-moz-OddTreeRow|-moz-win-communicationstext|-moz-win-mediatext|-moz-activehyperlinktext|-moz-default-background-color|-moz-default-color|-moz-hyperlinktext|-moz-visitedhyperlinktext|-webkit-activelink|-webkit-focus-ring-color|-webkit-link|-webkit-text","-non-standard-image-rendering":"optimize-contrast|-moz-crisp-edges|-o-crisp-edges|-webkit-optimize-contrast","-non-standard-overflow":"overlay|-moz-scrollbars-none|-moz-scrollbars-horizontal|-moz-scrollbars-vertical|-moz-hidden-unscrollable","-non-standard-size":"intrinsic|min-intrinsic|-webkit-fill-available|-webkit-fit-content|-webkit-min-content|-webkit-max-content|-moz-available|-moz-fit-content|-moz-min-content|-moz-max-content","-webkit-gradient()":"-webkit-gradient( <-webkit-gradient-type> , <-webkit-gradient-point> [, <-webkit-gradient-point>|, <-webkit-gradient-radius> , <-webkit-gradient-point>] [, <-webkit-gradient-radius>]? [, <-webkit-gradient-color-stop>]* )","-webkit-gradient-color-stop":"from( <color> )|color-stop( [<number-zero-one>|<percentage>] , <color> )|to( <color> )","-webkit-gradient-point":"[left|center|right|<length-percentage>] [top|center|bottom|<length-percentage>]","-webkit-gradient-radius":"<length>|<percentage>","-webkit-gradient-type":"linear|radial","-webkit-mask-box-repeat":"repeat|stretch|round","-ms-filter-function-list":"<-ms-filter-function>+","-ms-filter-function":"<-ms-filter-function-progid>|<-ms-filter-function-legacy>","-ms-filter-function-progid":"'progid:' [<ident-token> '.']* [<ident-token>|<function-token> <any-value>? )]","-ms-filter-function-legacy":"<ident-token>|<function-token> <any-value>? )",age:"child|young|old","attr-name":"<wq-name>","attr-fallback":"<any-value>",bottom:"<length>|auto","cubic-bezier-easing-function":"ease|ease-in|ease-out|ease-in-out|cubic-bezier( <number [0,1]> , <number> , <number [0,1]> , <number> )","generic-voice":"[<age>? <gender> <integer>?]",gender:"male|female|neutral","generic-script-specific":"generic( kai )|generic( fangsong )|generic( nastaliq )","-non-standard-generic-family":"-apple-system|BlinkMacSystemFont","intrinsic-size-keyword":"min-content|max-content|fit-content",left:"<length>|auto","device-cmyk()":"<legacy-device-cmyk-syntax>|<modern-device-cmyk-syntax>","legacy-device-cmyk-syntax":"device-cmyk( <number>#{4} )","modern-device-cmyk-syntax":"device-cmyk( <cmyk-component>{4} [/ [<alpha-value>|none]]? )","cmyk-component":"<number>|<percentage>|none","color-space":"<rectangular-color-space>|<polar-color-space>|<custom-color-space>",right:"<length>|auto","forgiving-selector-list":"<complex-real-selector-list>","forgiving-relative-selector-list":"<relative-real-selector-list>","complex-real-selector-list":"<complex-real-selector>#","simple-selector-list":"<simple-selector>#","relative-real-selector-list":"<relative-real-selector>#","complex-selector-unit":"[<compound-selector>? <pseudo-compound-selector>*]!","complex-real-selector":"<compound-selector> [<combinator>? <compound-selector>]*","relative-real-selector":"<combinator>? <complex-real-selector>","pseudo-compound-selector":"<pseudo-element-selector> <pseudo-class-selector>*","simple-selector":"<type-selector>|<subclass-selector>","legacy-pseudo-element-selector":"':' [before|after|first-line|first-letter]","svg-length":"<percentage>|<length>|<number>","svg-writing-mode":"lr-tb|rl-tb|tb-rl|lr|rl|tb",top:"<length>|auto",x:"<number>",y:"<number>",declaration:"<ident-token> : <declaration-value>? ['!' important]?","declaration-list":"[<declaration>? ';']* <declaration>?",url:"url( <string> <url-modifier>* )|<url-token>","url-modifier":"<ident>|<function-token> <any-value> )","number-zero-one":"<number [0,1]>","number-one-or-greater":"<number [1,\u221E]>","xyz-space":"xyz|xyz-d50|xyz-d65","style-condition":"not <style-in-parens>|<style-in-parens> [[and <style-in-parens>]*|[or <style-in-parens>]*]","-non-standard-display":"-ms-inline-flexbox|-ms-grid|-ms-inline-grid|-webkit-flex|-webkit-inline-flex|-webkit-box|-webkit-inline-box|-moz-inline-stack|-moz-box|-moz-inline-box","inset-area":"[[left|center|right|span-left|span-right|x-start|x-end|span-x-start|span-x-end|x-self-start|x-self-end|span-x-self-start|span-x-self-end|span-all]||[top|center|bottom|span-top|span-bottom|y-start|y-end|span-y-start|span-y-end|y-self-start|y-self-end|span-y-self-start|span-y-self-end|span-all]|[block-start|center|block-end|span-block-start|span-block-end|span-all]||[inline-start|center|inline-end|span-inline-start|span-inline-end|span-all]|[self-block-start|self-block-end|span-self-block-start|span-self-block-end|span-all]||[self-inline-start|self-inline-end|span-self-inline-start|span-self-inline-end|span-all]|[start|center|end|span-start|span-end|span-all]{1,2}|[self-start|center|self-end|span-self-start|span-self-end|span-all]{1,2}]","font-variant-css2":"normal|small-caps","font-width-css3":"normal|ultra-condensed|extra-condensed|condensed|semi-condensed|semi-expanded|expanded|extra-expanded|ultra-expanded","system-family-name":"caption|icon|menu|message-box|small-caption|status-bar"},properties:{"--*":"<declaration-value>","-ms-accelerator":"false|true","-ms-block-progression":"tb|rl|bt|lr","-ms-content-zoom-chaining":"none|chained","-ms-content-zoom-limit":"<'-ms-content-zoom-limit-min'> <'-ms-content-zoom-limit-max'>","-ms-content-zoom-limit-max":"<percentage>","-ms-content-zoom-limit-min":"<percentage>","-ms-content-zoom-snap":"<'-ms-content-zoom-snap-type'>||<'-ms-content-zoom-snap-points'>","-ms-content-zoom-snap-points":"snapInterval( <percentage> , <percentage> )|snapList( <percentage># )","-ms-content-zoom-snap-type":"none|proximity|mandatory","-ms-content-zooming":"none|zoom","-ms-filter":"<string>","-ms-flow-from":"[none|<custom-ident>]#","-ms-flow-into":"[none|<custom-ident>]#","-ms-grid-columns":"none|<track-list>|<auto-track-list>","-ms-grid-rows":"none|<track-list>|<auto-track-list>","-ms-high-contrast-adjust":"auto|none","-ms-hyphenate-limit-chars":"auto|<integer>{1,3}","-ms-hyphenate-limit-lines":"no-limit|<integer>","-ms-hyphenate-limit-zone":"<percentage>|<length>","-ms-ime-align":"auto|after","-ms-overflow-style":"auto|none|scrollbar|-ms-autohiding-scrollbar","-ms-scroll-chaining":"chained|none","-ms-scroll-limit":"<'-ms-scroll-limit-x-min'> <'-ms-scroll-limit-y-min'> <'-ms-scroll-limit-x-max'> <'-ms-scroll-limit-y-max'>","-ms-scroll-limit-x-max":"auto|<length>","-ms-scroll-limit-x-min":"<length>","-ms-scroll-limit-y-max":"auto|<length>","-ms-scroll-limit-y-min":"<length>","-ms-scroll-rails":"none|railed","-ms-scroll-snap-points-x":"snapInterval( <length-percentage> , <length-percentage> )|snapList( <length-percentage># )","-ms-scroll-snap-points-y":"snapInterval( <length-percentage> , <length-percentage> )|snapList( <length-percentage># )","-ms-scroll-snap-type":"none|proximity|mandatory","-ms-scroll-snap-x":"<'-ms-scroll-snap-type'> <'-ms-scroll-snap-points-x'>","-ms-scroll-snap-y":"<'-ms-scroll-snap-type'> <'-ms-scroll-snap-points-y'>","-ms-scroll-translation":"none|vertical-to-horizontal","-ms-scrollbar-3dlight-color":"<color>","-ms-scrollbar-arrow-color":"<color>","-ms-scrollbar-base-color":"<color>","-ms-scrollbar-darkshadow-color":"<color>","-ms-scrollbar-face-color":"<color>","-ms-scrollbar-highlight-color":"<color>","-ms-scrollbar-shadow-color":"<color>","-ms-scrollbar-track-color":"<color>","-ms-text-autospace":"none|ideograph-alpha|ideograph-numeric|ideograph-parenthesis|ideograph-space","-ms-touch-select":"grippers|none","-ms-user-select":"none|element|text","-ms-wrap-flow":"auto|both|start|end|maximum|clear","-ms-wrap-margin":"<length>","-ms-wrap-through":"wrap|none","-moz-appearance":"none|button|button-arrow-down|button-arrow-next|button-arrow-previous|button-arrow-up|button-bevel|button-focus|caret|checkbox|checkbox-container|checkbox-label|checkmenuitem|dualbutton|groupbox|listbox|listitem|menuarrow|menubar|menucheckbox|menuimage|menuitem|menuitemtext|menulist|menulist-button|menulist-text|menulist-textfield|menupopup|menuradio|menuseparator|meterbar|meterchunk|progressbar|progressbar-vertical|progresschunk|progresschunk-vertical|radio|radio-container|radio-label|radiomenuitem|range|range-thumb|resizer|resizerpanel|scale-horizontal|scalethumbend|scalethumb-horizontal|scalethumbstart|scalethumbtick|scalethumb-vertical|scale-vertical|scrollbarbutton-down|scrollbarbutton-left|scrollbarbutton-right|scrollbarbutton-up|scrollbarthumb-horizontal|scrollbarthumb-vertical|scrollbartrack-horizontal|scrollbartrack-vertical|searchfield|separator|sheet|spinner|spinner-downbutton|spinner-textfield|spinner-upbutton|splitter|statusbar|statusbarpanel|tab|tabpanel|tabpanels|tab-scroll-arrow-back|tab-scroll-arrow-forward|textfield|textfield-multiline|toolbar|toolbarbutton|toolbarbutton-dropdown|toolbargripper|toolbox|tooltip|treeheader|treeheadercell|treeheadersortarrow|treeitem|treeline|treetwisty|treetwistyopen|treeview|-moz-mac-unified-toolbar|-moz-win-borderless-glass|-moz-win-browsertabbar-toolbox|-moz-win-communicationstext|-moz-win-communications-toolbox|-moz-win-exclude-glass|-moz-win-glass|-moz-win-mediatext|-moz-win-media-toolbox|-moz-window-button-box|-moz-window-button-box-maximized|-moz-window-button-close|-moz-window-button-maximize|-moz-window-button-minimize|-moz-window-button-restore|-moz-window-frame-bottom|-moz-window-frame-left|-moz-window-frame-right|-moz-window-titlebar|-moz-window-titlebar-maximized","-moz-binding":"<url>|none","-moz-border-bottom-colors":"<color>+|none","-moz-border-left-colors":"<color>+|none","-moz-border-right-colors":"<color>+|none","-moz-border-top-colors":"<color>+|none","-moz-context-properties":"none|[fill|fill-opacity|stroke|stroke-opacity]#","-moz-float-edge":"border-box|content-box|margin-box|padding-box","-moz-force-broken-image-icon":"0|1","-moz-image-region":"<shape>|auto","-moz-orient":"inline|block|horizontal|vertical","-moz-outline-radius":"<outline-radius>{1,4} [/ <outline-radius>{1,4}]?","-moz-outline-radius-bottomleft":"<outline-radius>","-moz-outline-radius-bottomright":"<outline-radius>","-moz-outline-radius-topleft":"<outline-radius>","-moz-outline-radius-topright":"<outline-radius>","-moz-stack-sizing":"ignore|stretch-to-fit","-moz-text-blink":"none|blink","-moz-user-focus":"ignore|normal|select-after|select-before|select-menu|select-same|select-all|none","-moz-user-input":"auto|none|enabled|disabled","-moz-user-modify":"read-only|read-write|write-only","-moz-window-dragging":"drag|no-drag","-moz-window-shadow":"default|menu|tooltip|sheet|none","-webkit-appearance":"none|button|button-bevel|caps-lock-indicator|caret|checkbox|default-button|inner-spin-button|listbox|listitem|media-controls-background|media-controls-fullscreen-background|media-current-time-display|media-enter-fullscreen-button|media-exit-fullscreen-button|media-fullscreen-button|media-mute-button|media-overlay-play-button|media-play-button|media-seek-back-button|media-seek-forward-button|media-slider|media-sliderthumb|media-time-remaining-display|media-toggle-closed-captions-button|media-volume-slider|media-volume-slider-container|media-volume-sliderthumb|menulist|menulist-button|menulist-text|menulist-textfield|meter|progress-bar|progress-bar-value|push-button|radio|scrollbarbutton-down|scrollbarbutton-left|scrollbarbutton-right|scrollbarbutton-up|scrollbargripper-horizontal|scrollbargripper-vertical|scrollbarthumb-horizontal|scrollbarthumb-vertical|scrollbartrack-horizontal|scrollbartrack-vertical|searchfield|searchfield-cancel-button|searchfield-decoration|searchfield-results-button|searchfield-results-decoration|slider-horizontal|slider-vertical|sliderthumb-horizontal|sliderthumb-vertical|square-button|textarea|textfield|-apple-pay-button","-webkit-border-before":"<'border-width'>||<'border-style'>||<color>","-webkit-border-before-color":"<color>","-webkit-border-before-style":"<'border-style'>","-webkit-border-before-width":"<'border-width'>","-webkit-box-reflect":"[above|below|right|left]? <length>? <image>?","-webkit-line-clamp":"none|<integer>","-webkit-mask":"[<mask-reference>||<position> [/ <bg-size>]?||<repeat-style>||[<visual-box>|border|padding|content|text]||[<visual-box>|border|padding|content]]#","-webkit-mask-attachment":"<attachment>#","-webkit-mask-clip":"[<coord-box>|no-clip|border|padding|content|text]#","-webkit-mask-composite":"<composite-style>#","-webkit-mask-image":"<mask-reference>#","-webkit-mask-origin":"[<coord-box>|border|padding|content]#","-webkit-mask-position":"<position>#","-webkit-mask-position-x":"[<length-percentage>|left|center|right]#","-webkit-mask-position-y":"[<length-percentage>|top|center|bottom]#","-webkit-mask-repeat":"<repeat-style>#","-webkit-mask-repeat-x":"repeat|no-repeat|space|round","-webkit-mask-repeat-y":"repeat|no-repeat|space|round","-webkit-mask-size":"<bg-size>#","-webkit-overflow-scrolling":"auto|touch","-webkit-tap-highlight-color":"<color>","-webkit-text-fill-color":"<color>","-webkit-text-stroke":"<length>||<color>","-webkit-text-stroke-color":"<color>","-webkit-text-stroke-width":"<length>","-webkit-touch-callout":"default|none","-webkit-user-modify":"read-only|read-write|read-write-plaintext-only","-webkit-user-select":"auto|none|text|all","accent-color":"auto|<color>","align-content":"normal|<baseline-position>|<content-distribution>|<overflow-position>? <content-position>","align-items":"normal|stretch|<baseline-position>|[<overflow-position>? <self-position>]","align-self":"auto|normal|stretch|<baseline-position>|<overflow-position>? <self-position>","align-tracks":"[normal|<baseline-position>|<content-distribution>|<overflow-position>? <content-position>]#","alignment-baseline":"auto|baseline|before-edge|text-before-edge|middle|central|after-edge|text-after-edge|ideographic|alphabetic|hanging|mathematical",all:"initial|inherit|unset|revert|revert-layer","anchor-name":"none|<dashed-ident>#","anchor-scope":"none|all|<dashed-ident>#",animation:"<single-animation>#","animation-composition":"<single-animation-composition>#","animation-delay":"<time>#","animation-direction":"<single-animation-direction>#","animation-duration":"<time>#","animation-fill-mode":"<single-animation-fill-mode>#","animation-iteration-count":"<single-animation-iteration-count>#","animation-name":"[none|<keyframes-name>]#","animation-play-state":"<single-animation-play-state>#","animation-range":"[<'animation-range-start'> <'animation-range-end'>?]#","animation-range-end":"[normal|<length-percentage>|<timeline-range-name> <length-percentage>?]#","animation-range-start":"[normal|<length-percentage>|<timeline-range-name> <length-percentage>?]#","animation-timeline":"<single-animation-timeline>#","animation-timing-function":"<easing-function>#",appearance:"none|auto|textfield|menulist-button|<compat-auto>","aspect-ratio":"auto||<ratio>","backdrop-filter":"none|<filter-value-list>","backface-visibility":"visible|hidden",background:"[<bg-layer> ,]* <final-bg-layer>","background-attachment":"<attachment>#","background-blend-mode":"<blend-mode>#","background-clip":"<bg-clip>#","background-color":"<color>","background-image":"<bg-image>#","background-origin":"<visual-box>#","background-position":"<bg-position>#","background-position-x":"[center|[[left|right|x-start|x-end]? <length-percentage>?]!]#","background-position-y":"[center|[[top|bottom|y-start|y-end]? <length-percentage>?]!]#","background-repeat":"<repeat-style>#","background-size":"<bg-size>#","baseline-shift":"baseline|sub|super|<svg-length>","block-size":"<'width'>",border:"<line-width>||<line-style>||<color>","border-block":"<'border-block-start'>","border-block-color":"<'border-top-color'>{1,2}","border-block-end":"<'border-top-width'>||<'border-top-style'>||<color>","border-block-end-color":"<'border-top-color'>","border-block-end-style":"<'border-top-style'>","border-block-end-width":"<'border-top-width'>","border-block-start":"<'border-top-width'>||<'border-top-style'>||<color>","border-block-start-color":"<'border-top-color'>","border-block-start-style":"<'border-top-style'>","border-block-start-width":"<'border-top-width'>","border-block-style":"<'border-top-style'>{1,2}","border-block-width":"<'border-top-width'>{1,2}","border-bottom":"<line-width>||<line-style>||<color>","border-bottom-color":"<'border-top-color'>","border-bottom-left-radius":"<length-percentage>{1,2}","border-bottom-right-radius":"<length-percentage>{1,2}","border-bottom-style":"<line-style>","border-bottom-width":"<line-width>","border-collapse":"collapse|separate","border-color":"<color>{1,4}","border-end-end-radius":"<'border-top-left-radius'>","border-end-start-radius":"<'border-top-left-radius'>","border-image":"<'border-image-source'>||<'border-image-slice'> [/ <'border-image-width'>|/ <'border-image-width'>? / <'border-image-outset'>]?||<'border-image-repeat'>","border-image-outset":"[<length>|<number>]{1,4}","border-image-repeat":"[stretch|repeat|round|space]{1,2}","border-image-slice":"<number-percentage>{1,4}&&fill?","border-image-source":"none|<image>","border-image-width":"[<length-percentage>|<number>|auto]{1,4}","border-inline":"<'border-block-start'>","border-inline-color":"<'border-top-color'>{1,2}","border-inline-end":"<'border-top-width'>||<'border-top-style'>||<color>","border-inline-end-color":"<'border-top-color'>","border-inline-end-style":"<'border-top-style'>","border-inline-end-width":"<'border-top-width'>","border-inline-start":"<'border-top-width'>||<'border-top-style'>||<color>","border-inline-start-color":"<'border-top-color'>","border-inline-start-style":"<'border-top-style'>","border-inline-start-width":"<'border-top-width'>","border-inline-style":"<'border-top-style'>{1,2}","border-inline-width":"<'border-top-width'>{1,2}","border-left":"<line-width>||<line-style>||<color>","border-left-color":"<color>","border-left-style":"<line-style>","border-left-width":"<line-width>","border-radius":"<length-percentage>{1,4} [/ <length-percentage>{1,4}]?","border-right":"<line-width>||<line-style>||<color>","border-right-color":"<color>","border-right-style":"<line-style>","border-right-width":"<line-width>","border-spacing":"<length> <length>?","border-start-end-radius":"<'border-top-left-radius'>","border-start-start-radius":"<'border-top-left-radius'>","border-style":"<line-style>{1,4}","border-top":"<line-width>||<line-style>||<color>","border-top-color":"<color>","border-top-left-radius":"<length-percentage>{1,2}","border-top-right-radius":"<length-percentage>{1,2}","border-top-style":"<line-style>","border-top-width":"<line-width>","border-width":"<line-width>{1,4}",bottom:"<length>|<percentage>|auto","box-align":"start|center|end|baseline|stretch","box-decoration-break":"slice|clone","box-direction":"normal|reverse|inherit","box-flex":"<number>","box-flex-group":"<integer>","box-lines":"single|multiple","box-ordinal-group":"<integer>","box-orient":"horizontal|vertical|inline-axis|block-axis|inherit","box-pack":"start|center|end|justify","box-shadow":"none|<shadow>#","box-sizing":"content-box|border-box","break-after":"auto|avoid|always|all|avoid-page|page|left|right|recto|verso|avoid-column|column|avoid-region|region","break-before":"auto|avoid|always|all|avoid-page|page|left|right|recto|verso|avoid-column|column|avoid-region|region","break-inside":"auto|avoid|avoid-page|avoid-column|avoid-region","caption-side":"top|bottom",caret:"<'caret-color'>||<'caret-shape'>","caret-color":"auto|<color>","caret-shape":"auto|bar|block|underscore",clear:"none|left|right|both|inline-start|inline-end",clip:"<shape>|auto","clip-path":"<clip-source>|[<basic-shape>||<geometry-box>]|none","clip-rule":"nonzero|evenodd",color:"<color>","color-interpolation-filters":"auto|sRGB|linearRGB","color-scheme":"normal|[light|dark|<custom-ident>]+&&only?","column-count":"<integer>|auto","column-fill":"auto|balance","column-gap":"normal|<length-percentage>","column-rule":"<'column-rule-width'>||<'column-rule-style'>||<'column-rule-color'>","column-rule-color":"<color>","column-rule-style":"<'border-style'>","column-rule-width":"<'border-width'>","column-span":"none|all","column-width":"<length>|auto",columns:"<'column-width'>||<'column-count'>",contain:"none|strict|content|[[size||inline-size]||layout||style||paint]","contain-intrinsic-block-size":"auto? [none|<length>]","contain-intrinsic-height":"auto? [none|<length>]","contain-intrinsic-inline-size":"auto? [none|<length>]","contain-intrinsic-size":"[auto? [none|<length>]]{1,2}","contain-intrinsic-width":"auto? [none|<length>]",container:"<'container-name'> [/ <'container-type'>]?","container-name":"none|<custom-ident>+","container-type":"normal|[[size|inline-size]||scroll-state]",content:"normal|none|[<content-replacement>|<content-list>] [/ [<string>|<counter>]+]?","content-visibility":"visible|auto|hidden","counter-increment":"[<counter-name> <integer>?]+|none","counter-reset":"[<counter-name> <integer>?|<reversed-counter-name> <integer>?]+|none","counter-set":"[<counter-name> <integer>?]+|none",cursor:"[[<url> [<x> <y>]? ,]* [auto|default|none|context-menu|help|pointer|progress|wait|cell|crosshair|text|vertical-text|alias|copy|move|no-drop|not-allowed|e-resize|n-resize|ne-resize|nw-resize|s-resize|se-resize|sw-resize|w-resize|ew-resize|ns-resize|nesw-resize|nwse-resize|col-resize|row-resize|all-scroll|zoom-in|zoom-out|grab|grabbing|hand|-webkit-grab|-webkit-grabbing|-webkit-zoom-in|-webkit-zoom-out|-moz-grab|-moz-grabbing|-moz-zoom-in|-moz-zoom-out]]",cx:"<length>|<percentage>",cy:"<length>|<percentage>",d:"none|path( <string> )",direction:"ltr|rtl",display:"[<display-outside>||<display-inside>]|<display-listitem>|<display-internal>|<display-box>|<display-legacy>|<-non-standard-display>","dominant-baseline":"auto|use-script|no-change|reset-size|ideographic|alphabetic|hanging|mathematical|central|middle|text-after-edge|text-before-edge","empty-cells":"show|hide","field-sizing":"content|fixed",fill:"<paint>","fill-opacity":"<number-zero-one>","fill-rule":"nonzero|evenodd",filter:"none|<filter-value-list>|<-ms-filter-function-list>",flex:"none|[<'flex-grow'> <'flex-shrink'>?||<'flex-basis'>]","flex-basis":"content|<'width'>","flex-direction":"row|row-reverse|column|column-reverse","flex-flow":"<'flex-direction'>||<'flex-wrap'>","flex-grow":"<number>","flex-shrink":"<number>","flex-wrap":"nowrap|wrap|wrap-reverse",float:"left|right|none|inline-start|inline-end","flood-color":"<color>","flood-opacity":"<'opacity'>",font:"[[<'font-style'>||<font-variant-css2>||<'font-weight'>||<font-width-css3>]? <'font-size'> [/ <'line-height'>]? <'font-family'>#]|<system-family-name>|<-non-standard-font>","font-family":"[<family-name>|<generic-family>]#","font-feature-settings":"normal|<feature-tag-value>#","font-kerning":"auto|normal|none","font-language-override":"normal|<string>","font-optical-sizing":"auto|none","font-palette":"normal|light|dark|<palette-identifier>|<palette-mix()>","font-size":"<absolute-size>|<relative-size>|<length-percentage [0,\u221E]>|math","font-size-adjust":"none|[ex-height|cap-height|ch-width|ic-width|ic-height]? [from-font|<number>]","font-smooth":"auto|never|always|<absolute-size>|<length>","font-stretch":"<font-stretch-absolute>","font-style":"normal|italic|oblique <angle>?","font-synthesis":"none|[weight||style||small-caps||position]","font-synthesis-position":"auto|none","font-synthesis-small-caps":"auto|none","font-synthesis-style":"auto|none","font-synthesis-weight":"auto|none","font-variant":"normal|none|[<common-lig-values>||<discretionary-lig-values>||<historical-lig-values>||<contextual-alt-values>||stylistic( <feature-value-name> )||historical-forms||styleset( <feature-value-name># )||character-variant( <feature-value-name># )||swash( <feature-value-name> )||ornaments( <feature-value-name> )||annotation( <feature-value-name> )||[small-caps|all-small-caps|petite-caps|all-petite-caps|unicase|titling-caps]||<numeric-figure-values>||<numeric-spacing-values>||<numeric-fraction-values>||ordinal||slashed-zero||<east-asian-variant-values>||<east-asian-width-values>||ruby]","font-variant-alternates":"normal|[stylistic( <feature-value-name> )||historical-forms||styleset( <feature-value-name># )||character-variant( <feature-value-name># )||swash( <feature-value-name> )||ornaments( <feature-value-name> )||annotation( <feature-value-name> )]","font-variant-caps":"normal|small-caps|all-small-caps|petite-caps|all-petite-caps|unicase|titling-caps","font-variant-east-asian":"normal|[<east-asian-variant-values>||<east-asian-width-values>||ruby]","font-variant-emoji":"normal|text|emoji|unicode","font-variant-ligatures":"normal|none|[<common-lig-values>||<discretionary-lig-values>||<historical-lig-values>||<contextual-alt-values>]","font-variant-numeric":"normal|[<numeric-figure-values>||<numeric-spacing-values>||<numeric-fraction-values>||ordinal||slashed-zero]","font-variant-position":"normal|sub|super","font-variation-settings":"normal|[<string> <number>]#","font-weight":"<font-weight-absolute>|bolder|lighter","forced-color-adjust":"auto|none|preserve-parent-color",gap:"<'row-gap'> <'column-gap'>?",grid:"<'grid-template'>|<'grid-template-rows'> / [auto-flow&&dense?] <'grid-auto-columns'>?|[auto-flow&&dense?] <'grid-auto-rows'>? / <'grid-template-columns'>","grid-area":"<grid-line> [/ <grid-line>]{0,3}","grid-auto-columns":"<track-size>+","grid-auto-flow":"[row|column]||dense","grid-auto-rows":"<track-size>+","grid-column":"<grid-line> [/ <grid-line>]?","grid-column-end":"<grid-line>","grid-column-gap":"<length-percentage>","grid-column-start":"<grid-line>","grid-gap":"<'grid-row-gap'> <'grid-column-gap'>?","grid-row":"<grid-line> [/ <grid-line>]?","grid-row-end":"<grid-line>","grid-row-gap":"<length-percentage>","grid-row-start":"<grid-line>","grid-template":"none|[<'grid-template-rows'> / <'grid-template-columns'>]|[<line-names>? <string> <track-size>? <line-names>?]+ [/ <explicit-track-list>]?","grid-template-areas":"none|<string>+","grid-template-columns":"none|<track-list>|<auto-track-list>|subgrid <line-name-list>?","grid-template-rows":"none|<track-list>|<auto-track-list>|subgrid <line-name-list>?","hanging-punctuation":"none|[first||[force-end|allow-end]||last]",height:"auto|<length-percentage [0,\u221E]>|min-content|max-content|fit-content|fit-content( <length-percentage [0,\u221E]> )|<calc-size()>|<anchor-size()>|stretch|<-non-standard-size>","hyphenate-character":"auto|<string>","hyphenate-limit-chars":"[auto|<integer>]{1,3}",hyphens:"none|manual|auto","image-orientation":"from-image|<angle>|[<angle>? flip]","image-rendering":"auto|crisp-edges|pixelated|smooth|optimizeSpeed|optimizeQuality|<-non-standard-image-rendering>","image-resolution":"[from-image||<resolution>]&&snap?","ime-mode":"auto|normal|active|inactive|disabled","initial-letter":"normal|[<number> <integer>?]","initial-letter-align":"[auto|alphabetic|hanging|ideographic]","inline-size":"<'width'>",inset:"<'top'>{1,4}","inset-block":"<'top'>{1,2}","inset-block-end":"<'top'>","inset-block-start":"<'top'>","inset-inline":"<'top'>{1,2}","inset-inline-end":"<'top'>","inset-inline-start":"<'top'>","interpolate-size":"numeric-only|allow-keywords",isolation:"auto|isolate","justify-content":"normal|<content-distribution>|<overflow-position>? [<content-position>|left|right]","justify-items":"normal|stretch|<baseline-position>|<overflow-position>? [<self-position>|left|right]|legacy|legacy&&[left|right|center]","justify-self":"auto|normal|stretch|<baseline-position>|<overflow-position>? [<self-position>|left|right]","justify-tracks":"[normal|<content-distribution>|<overflow-position>? [<content-position>|left|right]]#",left:"<length>|<percentage>|auto","letter-spacing":"normal|<length-percentage>","lighting-color":"<color>","line-break":"auto|loose|normal|strict|anywhere","line-clamp":"none|<integer>","line-height":"normal|<number>|<length>|<percentage>","line-height-step":"<length>","list-style":"<'list-style-type'>||<'list-style-position'>||<'list-style-image'>","list-style-image":"<image>|none","list-style-position":"inside|outside","list-style-type":"<counter-style>|<string>|none",margin:"<'margin-top'>{1,4}","margin-block":"<'margin-top'>{1,2}","margin-block-end":"<'margin-top'>","margin-block-start":"<'margin-top'>","margin-bottom":"<length-percentage>|auto","margin-inline":"<'margin-top'>{1,2}","margin-inline-end":"<'margin-top'>","margin-inline-start":"<'margin-top'>","margin-left":"<length-percentage>|auto","margin-right":"<length-percentage>|auto","margin-top":"<length-percentage>|auto","margin-trim":"none|in-flow|all",marker:"none|<url>","marker-end":"none|<url>","marker-mid":"none|<url>","marker-start":"none|<url>",mask:"<mask-layer>#","mask-border":"<'mask-border-source'>||<'mask-border-slice'> [/ <'mask-border-width'>? [/ <'mask-border-outset'>]?]?||<'mask-border-repeat'>||<'mask-border-mode'>","mask-border-mode":"luminance|alpha","mask-border-outset":"[<length>|<number>]{1,4}","mask-border-repeat":"[stretch|repeat|round|space]{1,2}","mask-border-slice":"<number-percentage>{1,4} fill?","mask-border-source":"none|<image>","mask-border-width":"[<length-percentage>|<number>|auto]{1,4}","mask-clip":"[<coord-box>|no-clip]#","mask-composite":"<compositing-operator>#","mask-image":"<mask-reference>#","mask-mode":"<masking-mode>#","mask-origin":"<coord-box>#","mask-position":"<position>#","mask-repeat":"<repeat-style>#","mask-size":"<bg-size>#","mask-type":"luminance|alpha","masonry-auto-flow":"[pack|next]||[definite-first|ordered]","math-depth":"auto-add|add( <integer> )|<integer>","math-shift":"normal|compact","math-style":"normal|compact","max-block-size":"<'max-width'>","max-height":"none|<length-percentage [0,\u221E]>|min-content|max-content|fit-content|fit-content( <length-percentage [0,\u221E]> )|<calc-size()>|<anchor-size()>|stretch|<-non-standard-size>","max-inline-size":"<'max-width'>","max-lines":"none|<integer>","max-width":"none|<length-percentage [0,\u221E]>|min-content|max-content|fit-content|fit-content( <length-percentage [0,\u221E]> )|<calc-size()>|<anchor-size()>|stretch|<-non-standard-size>","min-block-size":"<'min-width'>","min-height":"auto|<length-percentage [0,\u221E]>|min-content|max-content|fit-content|fit-content( <length-percentage [0,\u221E]> )|<calc-size()>|<anchor-size()>|stretch|<-non-standard-size>","min-inline-size":"<'min-width'>","min-width":"auto|<length-percentage [0,\u221E]>|min-content|max-content|fit-content|fit-content( <length-percentage [0,\u221E]> )|<calc-size()>|<anchor-size()>|stretch|<-non-standard-size>","mix-blend-mode":"<blend-mode>|plus-lighter","object-fit":"fill|contain|cover|none|scale-down","object-position":"<position>","object-view-box":"none|<basic-shape-rect>",offset:"[<'offset-position'>? [<'offset-path'> [<'offset-distance'>||<'offset-rotate'>]?]?]! [/ <'offset-anchor'>]?","offset-anchor":"auto|<position>","offset-distance":"<length-percentage>","offset-path":"none|<offset-path>||<coord-box>","offset-position":"normal|auto|<position>","offset-rotate":"[auto|reverse]||<angle>",opacity:"<opacity-value>",order:"<integer>",orphans:"<integer>",outline:"<'outline-width'>||<'outline-style'>||<'outline-color'>","outline-color":"auto|<color>","outline-offset":"<length>","outline-style":"auto|<outline-line-style>","outline-width":"<line-width>",overflow:"[visible|hidden|clip|scroll|auto]{1,2}|<-non-standard-overflow>","overflow-anchor":"auto|none","overflow-block":"visible|hidden|clip|scroll|auto","overflow-clip-box":"padding-box|content-box","overflow-clip-margin":"<visual-box>||<length [0,\u221E]>","overflow-inline":"visible|hidden|clip|scroll|auto","overflow-wrap":"normal|break-word|anywhere","overflow-x":"visible|hidden|clip|scroll|auto|<-non-standard-overflow>","overflow-y":"visible|hidden|clip|scroll|auto|<-non-standard-overflow>",overlay:"none|auto","overscroll-behavior":"[contain|none|auto]{1,2}","overscroll-behavior-block":"contain|none|auto","overscroll-behavior-inline":"contain|none|auto","overscroll-behavior-x":"contain|none|auto","overscroll-behavior-y":"contain|none|auto",padding:"<'padding-top'>{1,4}","padding-block":"<'padding-top'>{1,2}","padding-block-end":"<'padding-top'>","padding-block-start":"<'padding-top'>","padding-bottom":"<length-percentage [0,\u221E]>","padding-inline":"<'padding-top'>{1,2}","padding-inline-end":"<'padding-top'>","padding-inline-start":"<'padding-top'>","padding-left":"<length-percentage [0,\u221E]>","padding-right":"<length-percentage [0,\u221E]>","padding-top":"<length-percentage [0,\u221E]>",page:"auto|<custom-ident>","page-break-after":"auto|always|avoid|left|right|recto|verso","page-break-before":"auto|always|avoid|left|right|recto|verso","page-break-inside":"auto|avoid","paint-order":"normal|[fill||stroke||markers]",perspective:"none|<length>","perspective-origin":"<position>","place-content":"<'align-content'> <'justify-content'>?","place-items":"<'align-items'> <'justify-items'>?","place-self":"<'align-self'> <'justify-self'>?","pointer-events":"auto|none|visiblePainted|visibleFill|visibleStroke|visible|painted|fill|stroke|all|inherit",position:"static|relative|absolute|sticky|fixed|-webkit-sticky","position-anchor":"auto|<anchor-name>","position-area":"none|<position-area>","position-try":"<'position-try-order'>? <'position-try-fallbacks'>","position-try-fallbacks":"none|[[<dashed-ident>||<try-tactic>]|<'position-area'>]#","position-try-order":"normal|<try-size>","position-visibility":"always|[anchors-valid||anchors-visible||no-overflow]","print-color-adjust":"economy|exact",quotes:"none|auto|[<string> <string>]+",r:"<length>|<percentage>",resize:"none|both|horizontal|vertical|block|inline",right:"<length>|<percentage>|auto",rotate:"none|<angle>|[x|y|z|<number>{3}]&&<angle>","row-gap":"normal|<length-percentage>","ruby-align":"start|center|space-between|space-around","ruby-merge":"separate|collapse|auto","ruby-position":"[alternate||[over|under]]|inter-character",rx:"<length>|<percentage>",ry:"<length>|<percentage>",scale:"none|[<number>|<percentage>]{1,3}","scroll-behavior":"auto|smooth","scroll-initial-target":"none|nearest","scroll-margin":"<length>{1,4}","scroll-margin-block":"<length>{1,2}","scroll-margin-block-end":"<length>","scroll-margin-block-start":"<length>","scroll-margin-bottom":"<length>","scroll-margin-inline":"<length>{1,2}","scroll-margin-inline-end":"<length>","scroll-margin-inline-start":"<length>","scroll-margin-left":"<length>","scroll-margin-right":"<length>","scroll-margin-top":"<length>","scroll-padding":"[auto|<length-percentage>]{1,4}","scroll-padding-block":"[auto|<length-percentage>]{1,2}","scroll-padding-block-end":"auto|<length-percentage>","scroll-padding-block-start":"auto|<length-percentage>","scroll-padding-bottom":"auto|<length-percentage>","scroll-padding-inline":"[auto|<length-percentage>]{1,2}","scroll-padding-inline-end":"auto|<length-percentage>","scroll-padding-inline-start":"auto|<length-percentage>","scroll-padding-left":"auto|<length-percentage>","scroll-padding-right":"auto|<length-percentage>","scroll-padding-top":"auto|<length-percentage>","scroll-snap-align":"[none|start|end|center]{1,2}","scroll-snap-coordinate":"none|<position>#","scroll-snap-destination":"<position>","scroll-snap-points-x":"none|repeat( <length-percentage> )","scroll-snap-points-y":"none|repeat( <length-percentage> )","scroll-snap-stop":"normal|always","scroll-snap-type":"none|[x|y|block|inline|both] [mandatory|proximity]?","scroll-snap-type-x":"none|mandatory|proximity","scroll-snap-type-y":"none|mandatory|proximity","scroll-timeline":"[<'scroll-timeline-name'> <'scroll-timeline-axis'>?]#","scroll-timeline-axis":"[block|inline|x|y]#","scroll-timeline-name":"[none|<dashed-ident>]#","scrollbar-color":"auto|<color>{2}","scrollbar-gutter":"auto|stable&&both-edges?","scrollbar-width":"auto|thin|none","shape-image-threshold":"<opacity-value>","shape-margin":"<length-percentage>","shape-outside":"none|[<shape-box>||<basic-shape>]|<image>","shape-rendering":"auto|optimizeSpeed|crispEdges|geometricPrecision","speak-as":"normal|spell-out||digits||[literal-punctuation|no-punctuation]","stop-color":"<'color'>","stop-opacity":"<'opacity'>",stroke:"<paint>","stroke-dasharray":"none|[<svg-length>+]#","stroke-dashoffset":"<svg-length>","stroke-linecap":"butt|round|square","stroke-linejoin":"miter|round|bevel","stroke-miterlimit":"<number-one-or-greater>","stroke-opacity":"<'opacity'>","stroke-width":"<svg-length>","tab-size":"<integer>|<length>","table-layout":"auto|fixed","text-align":"start|end|left|right|center|justify|match-parent","text-align-last":"auto|start|end|left|right|center|justify","text-anchor":"start|middle|end","text-box":"normal|<'text-box-trim'>||<'text-box-edge'>","text-box-edge":"auto|<text-edge>","text-box-trim":"none|trim-start|trim-end|trim-both","text-combine-upright":"none|all|[digits <integer>?]","text-decoration":"<'text-decoration-line'>||<'text-decoration-style'>||<'text-decoration-color'>||<'text-decoration-thickness'>","text-decoration-color":"<color>","text-decoration-line":"none|[underline||overline||line-through||blink]|spelling-error|grammar-error","text-decoration-skip":"none|[objects||[spaces|[leading-spaces||trailing-spaces]]||edges||box-decoration]","text-decoration-skip-ink":"auto|all|none","text-decoration-style":"solid|double|dotted|dashed|wavy","text-decoration-thickness":"auto|from-font|<length>|<percentage>","text-emphasis":"<'text-emphasis-style'>||<'text-emphasis-color'>","text-emphasis-color":"<color>","text-emphasis-position":"auto|[over|under]&&[right|left]?","text-emphasis-style":"none|[[filled|open]||[dot|circle|double-circle|triangle|sesame]]|<string>","text-indent":"<length-percentage>&&hanging?&&each-line?","text-justify":"auto|inter-character|inter-word|none","text-orientation":"mixed|upright|sideways","text-overflow":"[clip|ellipsis|<string>]{1,2}","text-rendering":"auto|optimizeSpeed|optimizeLegibility|geometricPrecision","text-shadow":"none|<shadow-t>#","text-size-adjust":"none|auto|<percentage>","text-spacing-trim":"space-all|normal|space-first|trim-start","text-transform":"none|[capitalize|uppercase|lowercase]||full-width||full-size-kana|math-auto","text-underline-offset":"auto|<length>|<percentage>","text-underline-position":"auto|from-font|[under||[left|right]]","text-wrap":"<'text-wrap-mode'>||<'text-wrap-style'>","text-wrap-mode":"wrap|nowrap","text-wrap-style":"auto|balance|stable|pretty","timeline-scope":"none|<dashed-ident>#",top:"<length>|<percentage>|auto","touch-action":"auto|none|[[pan-x|pan-left|pan-right]||[pan-y|pan-up|pan-down]||pinch-zoom]|manipulation",transform:"none|<transform-list>","transform-box":"content-box|border-box|fill-box|stroke-box|view-box","transform-origin":"[<length-percentage>|left|center|right|top|bottom]|[[<length-percentage>|left|center|right]&&[<length-percentage>|top|center|bottom]] <length>?","transform-style":"flat|preserve-3d",transition:"<single-transition>#","transition-behavior":"<transition-behavior-value>#","transition-delay":"<time>#","transition-duration":"<time>#","transition-property":"none|<single-transition-property>#","transition-timing-function":"<easing-function>#",translate:"none|<length-percentage> [<length-percentage> <length>?]?","unicode-bidi":"normal|embed|isolate|bidi-override|isolate-override|plaintext|-moz-isolate|-moz-isolate-override|-moz-plaintext|-webkit-isolate|-webkit-isolate-override|-webkit-plaintext","user-select":"auto|text|none|all","vector-effect":"none|non-scaling-stroke|non-scaling-size|non-rotation|fixed-position","vertical-align":"baseline|sub|super|text-top|text-bottom|middle|top|bottom|<percentage>|<length>","view-timeline":"[<'view-timeline-name'> [<'view-timeline-axis'>||<'view-timeline-inset'>]?]#","view-timeline-axis":"[block|inline|x|y]#","view-timeline-inset":"[[auto|<length-percentage>]{1,2}]#","view-timeline-name":"[none|<dashed-ident>]#","view-transition-class":"none|<custom-ident>+","view-transition-name":"none|<custom-ident>",visibility:"visible|hidden|collapse","white-space":"normal|pre|pre-wrap|pre-line|<'white-space-collapse'>||<'text-wrap-mode'>","white-space-collapse":"collapse|preserve|preserve-breaks|preserve-spaces|break-spaces",widows:"<integer>",width:"auto|<length-percentage [0,\u221E]>|min-content|max-content|fit-content|fit-content( <length-percentage [0,\u221E]> )|<calc-size()>|<anchor-size()>|stretch|<-non-standard-size>","will-change":"auto|<animateable-feature>#","word-break":"normal|break-all|keep-all|break-word|auto-phrase","word-spacing":"normal|<length>","word-wrap":"normal|break-word","writing-mode":"horizontal-tb|vertical-rl|vertical-lr|sideways-rl|sideways-lr|<svg-writing-mode>",x:"<length>|<percentage>",y:"<length>|<percentage>","z-index":"auto|<integer>",zoom:"normal|reset|<number [0,\u221E]>||<percentage [0,\u221E]>","-moz-background-clip":"padding|border","-moz-border-radius-bottomleft":"<'border-bottom-left-radius'>","-moz-border-radius-bottomright":"<'border-bottom-right-radius'>","-moz-border-radius-topleft":"<'border-top-left-radius'>","-moz-border-radius-topright":"<'border-bottom-right-radius'>","-moz-control-character-visibility":"visible|hidden","-moz-osx-font-smoothing":"auto|grayscale","-moz-user-select":"none|text|all|-moz-none","-ms-flex-align":"start|end|center|baseline|stretch","-ms-flex-item-align":"auto|start|end|center|baseline|stretch","-ms-flex-line-pack":"start|end|center|justify|distribute|stretch","-ms-flex-negative":"<'flex-shrink'>","-ms-flex-pack":"start|end|center|justify|distribute","-ms-flex-order":"<integer>","-ms-flex-positive":"<'flex-grow'>","-ms-flex-preferred-size":"<'flex-basis'>","-ms-interpolation-mode":"nearest-neighbor|bicubic","-ms-grid-column-align":"start|end|center|stretch","-ms-grid-row-align":"start|end|center|stretch","-ms-hyphenate-limit-last":"none|always|column|page|spread","-webkit-background-clip":"[<visual-box>|border|padding|content|text]#","-webkit-column-break-after":"always|auto|avoid","-webkit-column-break-before":"always|auto|avoid","-webkit-column-break-inside":"always|auto|avoid","-webkit-font-smoothing":"auto|none|antialiased|subpixel-antialiased","-webkit-mask-box-image":"[<url>|<gradient>|none] [<length-percentage>{4} <-webkit-mask-box-repeat>{2}]?","-webkit-print-color-adjust":"economy|exact","-webkit-text-security":"none|circle|disc|square","-webkit-user-drag":"none|element|auto",behavior:"<url>+",cue:"<'cue-before'> <'cue-after'>?","cue-after":"<url> <decibel>?|none","cue-before":"<url> <decibel>?|none","glyph-orientation-horizontal":"<angle>","glyph-orientation-vertical":"<angle>",kerning:"auto|<svg-length>",pause:"<'pause-before'> <'pause-after'>?","pause-after":"<time>|none|x-weak|weak|medium|strong|x-strong","pause-before":"<time>|none|x-weak|weak|medium|strong|x-strong","position-try-options":"<'position-try-fallbacks'>",rest:"<'rest-before'> <'rest-after'>?","rest-after":"<time>|none|x-weak|weak|medium|strong|x-strong","rest-before":"<time>|none|x-weak|weak|medium|strong|x-strong",speak:"auto|never|always","voice-balance":"<number>|left|center|right|leftwards|rightwards","voice-duration":"auto|<time>","voice-family":"[[<family-name>|<generic-voice>] ,]* [<family-name>|<generic-voice>]|preserve","voice-pitch":"<frequency>&&absolute|[[x-low|low|medium|high|x-high]||[<frequency>|<semitones>|<percentage>]]","voice-range":"<frequency>&&absolute|[[x-low|low|medium|high|x-high]||[<frequency>|<semitones>|<percentage>]]","voice-rate":"[normal|x-slow|slow|medium|fast|x-fast]||<percentage>","voice-stress":"normal|strong|moderate|none|reduced","voice-volume":"silent|[[x-soft|soft|medium|loud|x-loud]||<decibel>]","white-space-trim":"none|discard-before||discard-after||discard-inner"},atrules:{charset:{prelude:"<string>",descriptors:null},"counter-style":{prelude:"<counter-style-name>",descriptors:{"additive-symbols":"[<integer>&&<symbol>]#",fallback:"<counter-style-name>",negative:"<symbol> <symbol>?",pad:"<integer>&&<symbol>",prefix:"<symbol>",range:"[[<integer>|infinite]{2}]#|auto","speak-as":"auto|bullets|numbers|words|spell-out|<counter-style-name>",suffix:"<symbol>",symbols:"<symbol>+",system:"cyclic|numeric|alphabetic|symbolic|additive|[fixed <integer>?]|[extends <counter-style-name>]"}},container:{prelude:"[<container-name>]? <container-condition>",descriptors:null},document:{prelude:"[<url>|url-prefix( <string> )|domain( <string> )|media-document( <string> )|regexp( <string> )]#",descriptors:null},"font-face":{prelude:null,descriptors:{"ascent-override":"normal|<percentage>","descent-override":"normal|<percentage>","font-display":"auto|block|swap|fallback|optional","font-family":"<family-name>","font-feature-settings":"normal|<feature-tag-value>#","font-stretch":"<font-stretch-absolute>{1,2}","font-style":"normal|italic|oblique <angle>{0,2}","font-variation-settings":"normal|[<string> <number>]#","font-weight":"<font-weight-absolute>{1,2}","line-gap-override":"normal|<percentage>","size-adjust":"<percentage>",src:"[<url> [format( <string># )]?|local( <family-name> )]#","unicode-range":"<unicode-range-token>#"}},"font-feature-values":{prelude:"<family-name>#",descriptors:null},"font-palette-values":{prelude:"<dashed-ident>",descriptors:{"base-palette":"light|dark|<integer [0,\u221E]>","font-family":"<family-name>#","override-colors":"[<integer [0,\u221E]> <color>]#"}},import:{prelude:"[<string>|<url>] [layer|layer( <layer-name> )]? [supports( [<supports-condition>|<declaration>] )]? <media-query-list>?",descriptors:null},keyframes:{prelude:"<keyframes-name>",descriptors:null},layer:{prelude:"[<layer-name>#|<layer-name>?]",descriptors:null},media:{prelude:"<media-query-list>",descriptors:null},namespace:{prelude:"<namespace-prefix>? [<string>|<url>]",descriptors:null},page:{prelude:"<page-selector-list>",descriptors:{bleed:"auto|<length>",marks:"none|[crop||cross]","page-orientation":"upright|rotate-left|rotate-right",size:"<length>{1,2}|auto|[<page-size>||[portrait|landscape]]"}},"position-try":{prelude:"<dashed-ident>",descriptors:{top:"<'top'>",left:"<'left'>",bottom:"<'bottom'>",right:"<'right'>","inset-block-start":"<'inset-block-start'>","inset-block-end":"<'inset-block-end'>","inset-inline-start":"<'inset-inline-start'>","inset-inline-end":"<'inset-inline-end'>","inset-block":"<'inset-block'>","inset-inline":"<'inset-inline'>",inset:"<'inset'>","margin-top":"<'margin-top'>","margin-left":"<'margin-left'>","margin-bottom":"<'margin-bottom'>","margin-right":"<'margin-right'>","margin-block-start":"<'margin-block-start'>","margin-block-end":"<'margin-block-end'>","margin-inline-start":"<'margin-inline-start'>","margin-inline-end":"<'margin-inline-end'>",margin:"<'margin'>","margin-block":"<'margin-block'>","margin-inline":"<'margin-inline'>",width:"<'width'>",height:"<'height'>","min-width":"<'min-width'>","min-height":"<'min-height'>","max-width":"<'max-width'>","max-height":"<'max-height'>","block-size":"<'block-size'>","inline-size":"<'inline-size'>","min-block-size":"<'min-block-size'>","min-inline-size":"<'min-inline-size'>","max-block-size":"<'max-block-size'>","max-inline-size":"<'max-inline-size'>","align-self":"<'align-self'>|anchor-center","justify-self":"<'justify-self'>|anchor-center"}},property:{prelude:"<custom-property-name>",descriptors:{inherits:"true|false","initial-value":"<declaration-value>?",syntax:"<string>"}},scope:{prelude:"[( <scope-start> )]? [to ( <scope-end> )]?",descriptors:null},"starting-style":{prelude:null,descriptors:null},supports:{prelude:"<supports-condition>",descriptors:null},"view-transition":{prelude:null,descriptors:{navigation:"auto|none",types:"none|<custom-ident>+"}},nest:{prelude:"<complex-selector-list>",descriptors:null}}};var Ct={};f(Ct,{AnPlusB:()=>tn,Atrule:()=>nn,AtrulePrelude:()=>sn,AttributeSelector:()=>cn,Block:()=>pn,Brackets:()=>mn,CDC:()=>fn,CDO:()=>bn,ClassSelector:()=>yn,Combinator:()=>wn,Comment:()=>Sn,Condition:()=>Tn,Declaration:()=>Ln,DeclarationList:()=>Pn,Dimension:()=>Dn,Feature:()=>On,FeatureFunction:()=>Fn,FeatureRange:()=>_n,Function:()=>qn,GeneralEnclosed:()=>Un,Hash:()=>Gn,IdSelector:()=>Qn,Identifier:()=>Kn,Layer:()=>$n,LayerList:()=>Jn,MediaQuery:()=>ti,MediaQueryList:()=>ni,NestingSelector:()=>oi,Nth:()=>ai,Number:()=>ci,Operator:()=>pi,Parentheses:()=>mi,Percentage:()=>fi,PseudoClassSelector:()=>bi,PseudoElementSelector:()=>yi,Ratio:()=>wi,Raw:()=>Si,Rule:()=>Ti,Scope:()=>Li,Selector:()=>zi,SelectorList:()=>Ii,String:()=>Fi,StyleSheet:()=>Bi,SupportsDeclaration:()=>Wi,TypeSelector:()=>Ui,UnicodeRange:()=>Yi,Url:()=>Zi,Value:()=>eo,WhiteSpace:()=>ro});var tn={};f(tn,{generate:()=>Xc,name:()=>Vc,parse:()=>en,structure:()=>Qc});var fe=43,re=45,er=110,Re=true,Kc=false;function tr(e,t){let r=this.tokenStart+e,n=this.charCodeAt(r);for((n===fe||n===re)&&(t&&this.error("Number sign is not allowed"),r++);r<this.tokenEnd;r++)O(this.charCodeAt(r))||this.error("Integer is expected",r);}function et(e){return tr.call(this,0,e)}function Ee(e,t){if(!this.cmpChar(this.tokenStart+e,t)){let r="";switch(t){case er:r="N is expected";break;case re:r="HyphenMinus is expected";break}this.error(r,this.tokenStart+e);}}function Jr(){let e=0,t=0,r=this.tokenType;for(;r===13||r===25;)r=this.lookupType(++e);if(r!==10)if(this.isDelim(fe,e)||this.isDelim(re,e)){t=this.isDelim(fe,e)?fe:re;do r=this.lookupType(++e);while(r===13||r===25);r!==10&&(this.skip(e),et.call(this,Re));}else return null;return e>0&&this.skip(e),t===0&&(r=this.charCodeAt(this.tokenStart),r!==fe&&r!==re&&this.error("Number sign is expected")),et.call(this,t!==0),t===re?"-"+this.consume(10):this.consume(10)}var Vc="AnPlusB",Qc={a:[String,null],b:[String,null]};function en(){let e=this.tokenStart,t=null,r=null;if(this.tokenType===10)et.call(this,Kc),r=this.consume(10);else if(this.tokenType===1&&this.cmpChar(this.tokenStart,re))switch(t="-1",Ee.call(this,1,er),this.tokenEnd-this.tokenStart){case 2:this.next(),r=Jr.call(this);break;case 3:Ee.call(this,2,re),this.next(),this.skipSC(),et.call(this,Re),r="-"+this.consume(10);break;default:Ee.call(this,2,re),tr.call(this,3,Re),this.next(),r=this.substrToCursor(e+2);}else if(this.tokenType===1||this.isDelim(fe)&&this.lookupType(1)===1){let n=0;switch(t="1",this.isDelim(fe)&&(n=1,this.next()),Ee.call(this,0,er),this.tokenEnd-this.tokenStart){case 1:this.next(),r=Jr.call(this);break;case 2:Ee.call(this,1,re),this.next(),this.skipSC(),et.call(this,Re),r="-"+this.consume(10);break;default:Ee.call(this,1,re),tr.call(this,2,Re),this.next(),r=this.substrToCursor(e+n+1);}}else if(this.tokenType===12){let n=this.charCodeAt(this.tokenStart),i=n===fe||n===re,o=this.tokenStart+i;for(;o<this.tokenEnd&&O(this.charCodeAt(o));o++);o===this.tokenStart+i&&this.error("Integer is expected",this.tokenStart+i),Ee.call(this,o-this.tokenStart,er),t=this.substring(e,o),o+1===this.tokenEnd?(this.next(),r=Jr.call(this)):(Ee.call(this,o-this.tokenStart+1,re),o+2===this.tokenEnd?(this.next(),this.skipSC(),et.call(this,Re),r="-"+this.consume(10)):(tr.call(this,o-this.tokenStart+2,Re),this.next(),r=this.substrToCursor(o+1)));}else this.error();return t!==null&&t.charCodeAt(0)===fe&&(t=t.substr(1)),r!==null&&r.charCodeAt(0)===fe&&(r=r.substr(1)),{type:"AnPlusB",loc:this.getLocation(e,this.tokenStart),a:t,b:r}}function Xc(e){if(e.a){let t=e.a==="+1"&&"n"||e.a==="1"&&"n"||e.a==="-1"&&"-n"||e.a+"n";if(e.b){let r=e.b[0]==="-"||e.b[0]==="+"?e.b:"+"+e.b;this.tokenize(t+r);}else this.tokenize(t);}else this.tokenize(e.b);}var nn={};f(nn,{generate:()=>tu,name:()=>Zc,parse:()=>rn,structure:()=>eu,walkContext:()=>Jc});function _s(){return this.Raw(this.consumeUntilLeftCurlyBracketOrSemicolon,true)}function $c(){for(let e=1,t;t=this.lookupType(e);e++){if(t===24)return  true;if(t===23||t===3)return  false}return  false}var Zc="Atrule",Jc="atrule",eu={name:String,prelude:["AtrulePrelude","Raw",null],block:["Block",null]};function rn(e=false){let t=this.tokenStart,r,n,i=null,o=null;switch(this.eat(3),r=this.substrToCursor(t+1),n=r.toLowerCase(),this.skipSC(),this.eof===false&&this.tokenType!==23&&this.tokenType!==17&&(this.parseAtrulePrelude?i=this.parseWithFallback(this.AtrulePrelude.bind(this,r,e),_s):i=_s.call(this,this.tokenIndex),this.skipSC()),this.tokenType){case 17:this.next();break;case 23:hasOwnProperty.call(this.atrule,n)&&typeof this.atrule[n].block=="function"?o=this.atrule[n].block.call(this,e):o=this.Block($c.call(this));break}return {type:"Atrule",loc:this.getLocation(t,this.tokenStart),name:r,prelude:i,block:o}}function tu(e){this.token(3,"@"+e.name),e.prelude!==null&&this.node(e.prelude),e.block?this.node(e.block):this.token(17,";");}var sn={};f(sn,{generate:()=>ou,name:()=>ru,parse:()=>on,structure:()=>iu,walkContext:()=>nu});var ru="AtrulePrelude",nu="atrulePrelude",iu={children:[[]]};function on(e){let t=null;return e!==null&&(e=e.toLowerCase()),this.skipSC(),hasOwnProperty.call(this.atrule,e)&&typeof this.atrule[e].prelude=="function"?t=this.atrule[e].prelude.call(this):t=this.readSequence(this.scope.AtrulePrelude),this.skipSC(),this.eof!==true&&this.tokenType!==23&&this.tokenType!==17&&this.error("Semicolon or block is expected"),{type:"AtrulePrelude",loc:this.getLocationFromList(t),children:t}}function ou(e){this.children(e);}var cn={};f(cn,{generate:()=>mu,name:()=>pu,parse:()=>ln,structure:()=>hu});var su=36,Ws=42,rr=61,au=94,an=124,lu=126;function cu(){this.eof&&this.error("Unexpected end of input");let e=this.tokenStart,t=false;return this.isDelim(Ws)?(t=true,this.next()):this.isDelim(an)||this.eat(1),this.isDelim(an)?this.charCodeAt(this.tokenStart+1)!==rr?(this.next(),this.eat(1)):t&&this.error("Identifier is expected",this.tokenEnd):t&&this.error("Vertical line is expected"),{type:"Identifier",loc:this.getLocation(e,this.tokenStart),name:this.substrToCursor(e)}}function uu(){let e=this.tokenStart,t=this.charCodeAt(e);return t!==rr&&t!==lu&&t!==au&&t!==su&&t!==Ws&&t!==an&&this.error("Attribute selector (=, ~=, ^=, $=, *=, |=) is expected"),this.next(),t!==rr&&(this.isDelim(rr)||this.error("Equal sign is expected"),this.next()),this.substrToCursor(e)}var pu="AttributeSelector",hu={name:"Identifier",matcher:[String,null],value:["String","Identifier",null],flags:[String,null]};function ln(){let e=this.tokenStart,t,r=null,n=null,i=null;return this.eat(19),this.skipSC(),t=cu.call(this),this.skipSC(),this.tokenType!==20&&(this.tokenType!==1&&(r=uu.call(this),this.skipSC(),n=this.tokenType===5?this.String():this.Identifier(),this.skipSC()),this.tokenType===1&&(i=this.consume(1),this.skipSC())),this.eat(20),{type:"AttributeSelector",loc:this.getLocation(e,this.tokenStart),name:t,matcher:r,value:n,flags:i}}function mu(e){this.token(9,"["),this.node(e.name),e.matcher!==null&&(this.tokenize(e.matcher),this.node(e.value)),e.flags!==null&&this.token(1,e.flags),this.token(9,"]");}var pn={};f(pn,{generate:()=>yu,name:()=>gu,parse:()=>un,structure:()=>xu,walkContext:()=>bu});var du=38;function Us(){return this.Raw(null,true)}function qs(){return this.parseWithFallback(this.Rule,Us)}function js(){return this.Raw(this.consumeUntilSemicolonIncluded,true)}function fu(){if(this.tokenType===17)return js.call(this,this.tokenIndex);let e=this.parseWithFallback(this.Declaration,js);return this.tokenType===17&&this.next(),e}var gu="Block",bu="block",xu={children:[["Atrule","Rule","Declaration"]]};function un(e){let t=e?fu:qs,r=this.tokenStart,n=this.createList();this.eat(23);e:for(;!this.eof;)switch(this.tokenType){case 24:break e;case 13:case 25:this.next();break;case 3:n.push(this.parseWithFallback(this.Atrule.bind(this,e),Us));break;default:e&&this.isDelim(du)?n.push(qs.call(this)):n.push(t.call(this));}return this.eof||this.eat(24),{type:"Block",loc:this.getLocation(r,this.tokenStart),children:n}}function yu(e){this.token(23,"{"),this.children(e,t=>{t.type==="Declaration"&&this.token(17,";");}),this.token(24,"}");}var mn={};f(mn,{generate:()=>vu,name:()=>ku,parse:()=>hn,structure:()=>wu});var ku="Brackets",wu={children:[[]]};function hn(e,t){let r=this.tokenStart,n=null;return this.eat(19),n=e.call(this,t),this.eof||this.eat(20),{type:"Brackets",loc:this.getLocation(r,this.tokenStart),children:n}}function vu(e){this.token(9,"["),this.children(e),this.token(9,"]");}var fn={};f(fn,{generate:()=>Tu,name:()=>Su,parse:()=>dn,structure:()=>Cu});var Su="CDC",Cu=[];function dn(){let e=this.tokenStart;return this.eat(15),{type:"CDC",loc:this.getLocation(e,this.tokenStart)}}function Tu(){this.token(15,"-->");}var bn={};f(bn,{generate:()=>Eu,name:()=>Au,parse:()=>gn,structure:()=>Lu});var Au="CDO",Lu=[];function gn(){let e=this.tokenStart;return this.eat(14),{type:"CDO",loc:this.getLocation(e,this.tokenStart)}}function Eu(){this.token(14,"<!--");}var yn={};f(yn,{generate:()=>Du,name:()=>Pu,parse:()=>xn,structure:()=>Iu});var zu=46,Pu="ClassSelector",Iu={name:String};function xn(){return this.eatDelim(zu),{type:"ClassSelector",loc:this.getLocation(this.tokenStart-1,this.tokenEnd),name:this.consume(1)}}function Du(e){this.token(9,"."),this.token(1,e.name);}var wn={};f(wn,{generate:()=>Bu,name:()=>Fu,parse:()=>kn,structure:()=>Mu});var Nu=43,Hs=47,Ou=62,Ru=126,Fu="Combinator",Mu={name:String};function kn(){let e=this.tokenStart,t;switch(this.tokenType){case 13:t=" ";break;case 9:switch(this.charCodeAt(this.tokenStart)){case Ou:case Nu:case Ru:this.next();break;case Hs:this.next(),this.eatIdent("deep"),this.eatDelim(Hs);break;default:this.error("Combinator is expected");}t=this.substrToCursor(e);break}return {type:"Combinator",loc:this.getLocation(e,this.tokenStart),name:t}}function Bu(e){this.tokenize(e.name);}var Sn={};f(Sn,{generate:()=>Uu,name:()=>qu,parse:()=>vn,structure:()=>ju});var _u=42,Wu=47,qu="Comment",ju={value:String};function vn(){let e=this.tokenStart,t=this.tokenEnd;return this.eat(25),t-e+2>=2&&this.charCodeAt(t-2)===_u&&this.charCodeAt(t-1)===Wu&&(t-=2),{type:"Comment",loc:this.getLocation(e,this.tokenStart),value:this.substring(e+2,t)}}function Uu(e){this.token(25,"/*"+e.value+"*/");}var Tn={};f(Tn,{generate:()=>Vu,name:()=>Gu,parse:()=>Cn,structure:()=>Yu});var Hu=new Set([16,22,0]),Gu="Condition",Yu={kind:String,children:[["Identifier","Feature","FeatureFunction","FeatureRange","SupportsDeclaration"]]};function Gs(e){return this.lookupTypeNonSC(1)===1&&Hu.has(this.lookupTypeNonSC(2))?this.Feature(e):this.FeatureRange(e)}var Ku={media:Gs,container:Gs,supports(){return this.SupportsDeclaration()}};function Cn(e="media"){let t=this.createList();e:for(;!this.eof;)switch(this.tokenType){case 25:case 13:this.next();continue;case 1:t.push(this.Identifier());break;case 21:{let r=this.parseWithFallback(()=>Ku[e].call(this,e),()=>null);r||(r=this.parseWithFallback(()=>{this.eat(21);let n=this.Condition(e);return this.eat(22),n},()=>this.GeneralEnclosed(e))),t.push(r);break}case 2:{let r=this.parseWithFallback(()=>this.FeatureFunction(e),()=>null);r||(r=this.GeneralEnclosed(e)),t.push(r);break}default:break e}return t.isEmpty&&this.error("Condition is expected"),{type:"Condition",loc:this.getLocationFromList(t),kind:e,children:t}}function Vu(e){e.children.forEach(t=>{t.type==="Condition"?(this.token(21,"("),this.node(t),this.token(22,")")):this.node(t);});}var Ln={};f(Ln,{generate:()=>sp,name:()=>np,parse:()=>An,structure:()=>op,walkContext:()=>ip});var Ks=33,Qu=35,Xu=36,$u=38,Zu=42,Ju=43,Ys=47;function ep(){return this.Raw(this.consumeUntilExclamationMarkOrSemicolon,true)}function tp(){return this.Raw(this.consumeUntilExclamationMarkOrSemicolon,false)}function rp(){let e=this.tokenIndex,t=this.Value();return t.type!=="Raw"&&this.eof===false&&this.tokenType!==17&&this.isDelim(Ks)===false&&this.isBalanceEdge(e)===false&&this.error(),t}var np="Declaration",ip="declaration",op={important:[Boolean,String],property:String,value:["Value","Raw"]};function An(){let e=this.tokenStart,t=this.tokenIndex,r=ap.call(this),n=Ht(r),i=n?this.parseCustomProperty:this.parseValue,o=n?tp:ep,s=false,u;this.skipSC(),this.eat(16);let c=this.tokenIndex;if(n||this.skipSC(),i?u=this.parseWithFallback(rp,o):u=o.call(this,this.tokenIndex),n&&u.type==="Value"&&u.children.isEmpty){for(let a=c-this.tokenIndex;a<=0;a++)if(this.lookupType(a)===13){u.children.appendData({type:"WhiteSpace",loc:null,value:" "});break}}return this.isDelim(Ks)&&(s=lp.call(this),this.skipSC()),this.eof===false&&this.tokenType!==17&&this.isBalanceEdge(t)===false&&this.error(),{type:"Declaration",loc:this.getLocation(e,this.tokenStart),important:s,property:r,value:u}}function sp(e){this.token(1,e.property),this.token(16,":"),this.node(e.value),e.important&&(this.token(9,"!"),this.token(1,e.important===true?"important":e.important));}function ap(){let e=this.tokenStart;if(this.tokenType===9)switch(this.charCodeAt(this.tokenStart)){case Zu:case Xu:case Ju:case Qu:case $u:this.next();break;case Ys:this.next(),this.isDelim(Ys)&&this.next();break}return this.tokenType===4?this.eat(4):this.eat(1),this.substrToCursor(e)}function lp(){this.eat(9),this.skipSC();let e=this.consume(1);return e==="important"?true:e}var Pn={};f(Pn,{generate:()=>hp,name:()=>up,parse:()=>zn,structure:()=>pp});var cp=38;function En(){return this.Raw(this.consumeUntilSemicolonIncluded,true)}var up="DeclarationList",pp={children:[["Declaration","Atrule","Rule"]]};function zn(){let e=this.createList();for(;!this.eof;)switch(this.tokenType){case 13:case 25:case 17:this.next();break;case 3:e.push(this.parseWithFallback(this.Atrule.bind(this,true),En));break;default:this.isDelim(cp)?e.push(this.parseWithFallback(this.Rule,En)):e.push(this.parseWithFallback(this.Declaration,En));}return {type:"DeclarationList",loc:this.getLocationFromList(e),children:e}}function hp(e){this.children(e,t=>{t.type==="Declaration"&&this.token(17,";");});}var Dn={};f(Dn,{generate:()=>fp,name:()=>mp,parse:()=>In,structure:()=>dp});var mp="Dimension",dp={value:String,unit:String};function In(){let e=this.tokenStart,t=this.consumeNumber(12);return {type:"Dimension",loc:this.getLocation(e,this.tokenStart),value:t,unit:this.substring(e+t.length,this.tokenStart)}}function fp(e){this.token(12,e.value+e.unit);}var On={};f(On,{generate:()=>yp,name:()=>bp,parse:()=>Nn,structure:()=>xp});var gp=47,bp="Feature",xp={kind:String,name:String,value:["Identifier","Number","Dimension","Ratio","Function",null]};function Nn(e){let t=this.tokenStart,r,n=null;if(this.eat(21),this.skipSC(),r=this.consume(1),this.skipSC(),this.tokenType!==22){switch(this.eat(16),this.skipSC(),this.tokenType){case 10:this.lookupNonWSType(1)===9?n=this.Ratio():n=this.Number();break;case 12:n=this.Dimension();break;case 1:n=this.Identifier();break;case 2:n=this.parseWithFallback(()=>{let i=this.Function(this.readSequence,this.scope.Value);return this.skipSC(),this.isDelim(gp)&&this.error(),i},()=>this.Ratio());break;default:this.error("Number, dimension, ratio or identifier is expected");}this.skipSC();}return this.eof||this.eat(22),{type:"Feature",loc:this.getLocation(t,this.tokenStart),kind:e,name:r,value:n}}function yp(e){this.token(21,"("),this.token(1,e.name),e.value!==null&&(this.token(16,":"),this.node(e.value)),this.token(22,")");}var Fn={};f(Fn,{generate:()=>Sp,name:()=>kp,parse:()=>Rn,structure:()=>wp});var kp="FeatureFunction",wp={kind:String,feature:String,value:["Declaration","Selector"]};function vp(e,t){let n=(this.features[e]||{})[t];return typeof n!="function"&&this.error(`Unknown feature ${t}()`),n}function Rn(e="unknown"){let t=this.tokenStart,r=this.consumeFunctionName(),n=vp.call(this,e,r.toLowerCase());this.skipSC();let i=this.parseWithFallback(()=>{let o=this.tokenIndex,s=n.call(this);return this.eof===false&&this.isBalanceEdge(o)===false&&this.error(),s},()=>this.Raw(null,false));return this.eof||this.eat(22),{type:"FeatureFunction",loc:this.getLocation(t,this.tokenStart),kind:e,feature:r,value:i}}function Sp(e){this.token(2,e.feature+"("),this.node(e.value),this.token(22,")");}var _n={};f(_n,{generate:()=>Ep,name:()=>Ap,parse:()=>Bn,structure:()=>Lp});var Vs=47,Cp=60,Qs=61,Tp=62,Ap="FeatureRange",Lp={kind:String,left:["Identifier","Number","Dimension","Ratio","Function"],leftComparison:String,middle:["Identifier","Number","Dimension","Ratio","Function"],rightComparison:[String,null],right:["Identifier","Number","Dimension","Ratio","Function",null]};function Mn(){switch(this.skipSC(),this.tokenType){case 10:return this.isDelim(Vs,this.lookupOffsetNonSC(1))?this.Ratio():this.Number();case 12:return this.Dimension();case 1:return this.Identifier();case 2:return this.parseWithFallback(()=>{let e=this.Function(this.readSequence,this.scope.Value);return this.skipSC(),this.isDelim(Vs)&&this.error(),e},()=>this.Ratio());default:this.error("Number, dimension, ratio or identifier is expected");}}function Xs(e){if(this.skipSC(),this.isDelim(Cp)||this.isDelim(Tp)){let t=this.source[this.tokenStart];return this.next(),this.isDelim(Qs)?(this.next(),t+"="):t}if(this.isDelim(Qs))return "=";this.error(`Expected ${e?'":", ':""}"<", ">", "=" or ")"`);}function Bn(e="unknown"){let t=this.tokenStart;this.skipSC(),this.eat(21);let r=Mn.call(this),n=Xs.call(this,r.type==="Identifier"),i=Mn.call(this),o=null,s=null;return this.lookupNonWSType(0)!==22&&(o=Xs.call(this),s=Mn.call(this)),this.skipSC(),this.eat(22),{type:"FeatureRange",loc:this.getLocation(t,this.tokenStart),kind:e,left:r,leftComparison:n,middle:i,rightComparison:o,right:s}}function Ep(e){this.token(21,"("),this.node(e.left),this.tokenize(e.leftComparison),this.node(e.middle),e.right&&(this.tokenize(e.rightComparison),this.node(e.right)),this.token(22,")");}var qn={};f(qn,{generate:()=>Dp,name:()=>zp,parse:()=>Wn,structure:()=>Ip,walkContext:()=>Pp});var zp="Function",Pp="function",Ip={name:String,children:[[]]};function Wn(e,t){let r=this.tokenStart,n=this.consumeFunctionName(),i=n.toLowerCase(),o;return o=t.hasOwnProperty(i)?t[i].call(this,t):e.call(this,t),this.eof||this.eat(22),{type:"Function",loc:this.getLocation(r,this.tokenStart),name:n,children:o}}function Dp(e){this.token(2,e.name+"("),this.children(e),this.token(22,")");}var Un={};f(Un,{generate:()=>Rp,name:()=>Np,parse:()=>jn,structure:()=>Op});var Np="GeneralEnclosed",Op={kind:String,function:[String,null],children:[[]]};function jn(e){let t=this.tokenStart,r=null;this.tokenType===2?r=this.consumeFunctionName():this.eat(21);let n=this.parseWithFallback(()=>{let i=this.tokenIndex,o=this.readSequence(this.scope.Value);return this.eof===false&&this.isBalanceEdge(i)===false&&this.error(),o},()=>this.createSingleNodeList(this.Raw(null,false)));return this.eof||this.eat(22),{type:"GeneralEnclosed",loc:this.getLocation(t,this.tokenStart),kind:e,function:r,children:n}}function Rp(e){e.function?this.token(2,e.function+"("):this.token(21,"("),this.children(e),this.token(22,")");}var Gn={};f(Gn,{generate:()=>_p,name:()=>Mp,parse:()=>Hn,structure:()=>Bp,xxx:()=>Fp});var Fp="XXX",Mp="Hash",Bp={value:String};function Hn(){let e=this.tokenStart;return this.eat(4),{type:"Hash",loc:this.getLocation(e,this.tokenStart),value:this.substrToCursor(e+1)}}function _p(e){this.token(4,"#"+e.value);}var Kn={};f(Kn,{generate:()=>jp,name:()=>Wp,parse:()=>Yn,structure:()=>qp});var Wp="Identifier",qp={name:String};function Yn(){return {type:"Identifier",loc:this.getLocation(this.tokenStart,this.tokenEnd),name:this.consume(1)}}function jp(e){this.token(1,e.name);}var Qn={};f(Qn,{generate:()=>Gp,name:()=>Up,parse:()=>Vn,structure:()=>Hp});var Up="IdSelector",Hp={name:String};function Vn(){let e=this.tokenStart;return this.eat(4),{type:"IdSelector",loc:this.getLocation(e,this.tokenStart),name:this.substrToCursor(e+1)}}function Gp(e){this.token(9,"#"+e.name);}var $n={};f($n,{generate:()=>Qp,name:()=>Kp,parse:()=>Xn,structure:()=>Vp});var Yp=46,Kp="Layer",Vp={name:String};function Xn(){let e=this.tokenStart,t=this.consume(1);for(;this.isDelim(Yp);)this.eat(9),t+="."+this.consume(1);return {type:"Layer",loc:this.getLocation(e,this.tokenStart),name:t}}function Qp(e){this.tokenize(e.name);}var Jn={};f(Jn,{generate:()=>Zp,name:()=>Xp,parse:()=>Zn,structure:()=>$p});var Xp="LayerList",$p={children:[["Layer"]]};function Zn(){let e=this.createList();for(this.skipSC();!this.eof&&(e.push(this.Layer()),this.lookupTypeNonSC(0)===18);)this.skipSC(),this.next(),this.skipSC();return {type:"LayerList",loc:this.getLocationFromList(e),children:e}}function Zp(e){this.children(e,()=>this.token(18,","));}var ti={};f(ti,{generate:()=>th,name:()=>Jp,parse:()=>ei,structure:()=>eh});var Jp="MediaQuery",eh={modifier:[String,null],mediaType:[String,null],condition:["Condition",null]};function ei(){let e=this.tokenStart,t=null,r=null,n=null;if(this.skipSC(),this.tokenType===1&&this.lookupTypeNonSC(1)!==21){let i=this.consume(1),o=i.toLowerCase();switch(o==="not"||o==="only"?(this.skipSC(),t=o,r=this.consume(1)):r=i,this.lookupTypeNonSC(0)){case 1:{this.skipSC(),this.eatIdent("and"),n=this.Condition("media");break}case 23:case 17:case 18:case 0:break;default:this.error("Identifier or parenthesis is expected");}}else switch(this.tokenType){case 1:case 21:case 2:{n=this.Condition("media");break}case 23:case 17:case 0:break;default:this.error("Identifier or parenthesis is expected");}return {type:"MediaQuery",loc:this.getLocation(e,this.tokenStart),modifier:t,mediaType:r,condition:n}}function th(e){e.mediaType?(e.modifier&&this.token(1,e.modifier),this.token(1,e.mediaType),e.condition&&(this.token(1,"and"),this.node(e.condition))):e.condition&&this.node(e.condition);}var ni={};f(ni,{generate:()=>ih,name:()=>rh,parse:()=>ri,structure:()=>nh});var rh="MediaQueryList",nh={children:[["MediaQuery"]]};function ri(){let e=this.createList();for(this.skipSC();!this.eof&&(e.push(this.MediaQuery()),this.tokenType===18);)this.next();return {type:"MediaQueryList",loc:this.getLocationFromList(e),children:e}}function ih(e){this.children(e,()=>this.token(18,","));}var oi={};f(oi,{generate:()=>lh,name:()=>sh,parse:()=>ii,structure:()=>ah});var oh=38,sh="NestingSelector",ah={};function ii(){let e=this.tokenStart;return this.eatDelim(oh),{type:"NestingSelector",loc:this.getLocation(e,this.tokenStart)}}function lh(){this.token(9,"&");}var ai={};f(ai,{generate:()=>ph,name:()=>ch,parse:()=>si,structure:()=>uh});var ch="Nth",uh={nth:["AnPlusB","Identifier"],selector:["SelectorList",null]};function si(){this.skipSC();let e=this.tokenStart,t=e,r=null,n;return this.lookupValue(0,"odd")||this.lookupValue(0,"even")?n=this.Identifier():n=this.AnPlusB(),t=this.tokenStart,this.skipSC(),this.lookupValue(0,"of")&&(this.next(),r=this.SelectorList(),t=this.tokenStart),{type:"Nth",loc:this.getLocation(e,t),nth:n,selector:r}}function ph(e){this.node(e.nth),e.selector!==null&&(this.token(1,"of"),this.node(e.selector));}var ci={};f(ci,{generate:()=>dh,name:()=>hh,parse:()=>li,structure:()=>mh});var hh="Number",mh={value:String};function li(){return {type:"Number",loc:this.getLocation(this.tokenStart,this.tokenEnd),value:this.consume(10)}}function dh(e){this.token(10,e.value);}var pi={};f(pi,{generate:()=>bh,name:()=>fh,parse:()=>ui,structure:()=>gh});var fh="Operator",gh={value:String};function ui(){let e=this.tokenStart;return this.next(),{type:"Operator",loc:this.getLocation(e,this.tokenStart),value:this.substrToCursor(e)}}function bh(e){this.tokenize(e.value);}var mi={};f(mi,{generate:()=>kh,name:()=>xh,parse:()=>hi,structure:()=>yh});var xh="Parentheses",yh={children:[[]]};function hi(e,t){let r=this.tokenStart,n=null;return this.eat(21),n=e.call(this,t),this.eof||this.eat(22),{type:"Parentheses",loc:this.getLocation(r,this.tokenStart),children:n}}function kh(e){this.token(21,"("),this.children(e),this.token(22,")");}var fi={};f(fi,{generate:()=>Sh,name:()=>wh,parse:()=>di,structure:()=>vh});var wh="Percentage",vh={value:String};function di(){return {type:"Percentage",loc:this.getLocation(this.tokenStart,this.tokenEnd),value:this.consumeNumber(11)}}function Sh(e){this.token(11,e.value+"%");}var bi={};f(bi,{generate:()=>Lh,name:()=>Ch,parse:()=>gi,structure:()=>Ah,walkContext:()=>Th});var Ch="PseudoClassSelector",Th="function",Ah={name:String,children:[["Raw"],null]};function gi(){let e=this.tokenStart,t=null,r,n;return this.eat(16),this.tokenType===2?(r=this.consumeFunctionName(),n=r.toLowerCase(),this.lookupNonWSType(0)==22?t=this.createList():hasOwnProperty.call(this.pseudo,n)?(this.skipSC(),t=this.pseudo[n].call(this),this.skipSC()):(t=this.createList(),t.push(this.Raw(null,false))),this.eat(22)):r=this.consume(1),{type:"PseudoClassSelector",loc:this.getLocation(e,this.tokenStart),name:r,children:t}}function Lh(e){this.token(16,":"),e.children===null?this.token(1,e.name):(this.token(2,e.name+"("),this.children(e),this.token(22,")"));}var yi={};f(yi,{generate:()=>Ih,name:()=>Eh,parse:()=>xi,structure:()=>Ph,walkContext:()=>zh});var Eh="PseudoElementSelector",zh="function",Ph={name:String,children:[["Raw"],null]};function xi(){let e=this.tokenStart,t=null,r,n;return this.eat(16),this.eat(16),this.tokenType===2?(r=this.consumeFunctionName(),n=r.toLowerCase(),this.lookupNonWSType(0)==22?t=this.createList():hasOwnProperty.call(this.pseudo,n)?(this.skipSC(),t=this.pseudo[n].call(this),this.skipSC()):(t=this.createList(),t.push(this.Raw(null,false))),this.eat(22)):r=this.consume(1),{type:"PseudoElementSelector",loc:this.getLocation(e,this.tokenStart),name:r,children:t}}function Ih(e){this.token(16,":"),this.token(16,":"),e.children===null?this.token(1,e.name):(this.token(2,e.name+"("),this.children(e),this.token(22,")"));}var wi={};f(wi,{generate:()=>Oh,name:()=>Dh,parse:()=>ki,structure:()=>Nh});var $s=47;function Zs(){switch(this.skipSC(),this.tokenType){case 10:return this.Number();case 2:return this.Function(this.readSequence,this.scope.Value);default:this.error("Number of function is expected");}}var Dh="Ratio",Nh={left:["Number","Function"],right:["Number","Function",null]};function ki(){let e=this.tokenStart,t=Zs.call(this),r=null;return this.skipSC(),this.isDelim($s)&&(this.eatDelim($s),r=Zs.call(this)),{type:"Ratio",loc:this.getLocation(e,this.tokenStart),left:t,right:r}}function Oh(e){this.node(e.left),this.token(9,"/"),e.right?this.node(e.right):this.node(10,1);}var Si={};f(Si,{generate:()=>Bh,name:()=>Fh,parse:()=>vi,structure:()=>Mh});function Rh(){return this.tokenIndex>0&&this.lookupType(-1)===13?this.tokenIndex>1?this.getTokenStart(this.tokenIndex-1):this.firstCharOffset:this.tokenStart}var Fh="Raw",Mh={value:String};function vi(e,t){let r=this.getTokenStart(this.tokenIndex),n;return this.skipUntilBalanced(this.tokenIndex,e||this.consumeUntilBalanceEnd),t&&this.tokenStart>r?n=Rh.call(this):n=this.tokenStart,{type:"Raw",loc:this.getLocation(r,n),value:this.substring(r,n)}}function Bh(e){this.tokenize(e.value);}var Ti={};f(Ti,{generate:()=>Uh,name:()=>Wh,parse:()=>Ci,structure:()=>jh,walkContext:()=>qh});function Js(){return this.Raw(this.consumeUntilLeftCurlyBracket,true)}function _h(){let e=this.SelectorList();return e.type!=="Raw"&&this.eof===false&&this.tokenType!==23&&this.error(),e}var Wh="Rule",qh="rule",jh={prelude:["SelectorList","Raw"],block:["Block"]};function Ci(){let e=this.tokenIndex,t=this.tokenStart,r,n;return this.parseRulePrelude?r=this.parseWithFallback(_h,Js):r=Js.call(this,e),n=this.Block(true),{type:"Rule",loc:this.getLocation(t,this.tokenStart),prelude:r,block:n}}function Uh(e){this.node(e.prelude),this.node(e.block);}var Li={};f(Li,{generate:()=>Yh,name:()=>Hh,parse:()=>Ai,structure:()=>Gh});var Hh="Scope",Gh={root:["SelectorList","Raw",null],limit:["SelectorList","Raw",null]};function Ai(){let e=null,t=null;this.skipSC();let r=this.tokenStart;return this.tokenType===21&&(this.next(),this.skipSC(),e=this.parseWithFallback(this.SelectorList,()=>this.Raw(false,true)),this.skipSC(),this.eat(22)),this.lookupNonWSType(0)===1&&(this.skipSC(),this.eatIdent("to"),this.skipSC(),this.eat(21),this.skipSC(),t=this.parseWithFallback(this.SelectorList,()=>this.Raw(false,true)),this.skipSC(),this.eat(22)),{type:"Scope",loc:this.getLocation(r,this.tokenStart),root:e,limit:t}}function Yh(e){e.root&&(this.token(21,"("),this.node(e.root),this.token(22,")")),e.limit&&(this.token(1,"to"),this.token(21,"("),this.node(e.limit),this.token(22,")"));}var zi={};f(zi,{generate:()=>Qh,name:()=>Kh,parse:()=>Ei,structure:()=>Vh});var Kh="Selector",Vh={children:[["TypeSelector","IdSelector","ClassSelector","AttributeSelector","PseudoClassSelector","PseudoElementSelector","Combinator"]]};function Ei(){let e=this.readSequence(this.scope.Selector);return this.getFirstListNode(e)===null&&this.error("Selector is expected"),{type:"Selector",loc:this.getLocationFromList(e),children:e}}function Qh(e){this.children(e);}var Ii={};f(Ii,{generate:()=>Jh,name:()=>Xh,parse:()=>Pi,structure:()=>Zh,walkContext:()=>$h});var Xh="SelectorList",$h="selector",Zh={children:[["Selector","Raw"]]};function Pi(){let e=this.createList();for(;!this.eof;){if(e.push(this.Selector()),this.tokenType===18){this.next();continue}break}return {type:"SelectorList",loc:this.getLocationFromList(e),children:e}}function Jh(e){this.children(e,()=>this.token(18,","));}var Fi={};f(Fi,{generate:()=>rm,name:()=>em,parse:()=>Ri,structure:()=>tm});var Oi={};f(Oi,{decode:()=>vt,encode:()=>Ni});var Di=92,ea=34,ta=39;function vt(e){let t=e.length,r=e.charCodeAt(0),n=r===ea||r===ta?1:0,i=n===1&&t>1&&e.charCodeAt(t-1)===r?t-2:t-1,o="";for(let s=n;s<=i;s++){let u=e.charCodeAt(s);if(u===Di){if(s===i){s!==t-1&&(o=e.substr(s+1));break}if(u=e.charCodeAt(++s),K(Di,u)){let c=s-1,a=se(e,c);s=a-1,o+=je(e.substring(c+1,a));}else u===13&&e.charCodeAt(s+1)===10&&s++;}else o+=e[s];}return o}function Ni(e,t){let r=t?"'":'"',n=t?ta:ea,i="",o=false;for(let s=0;s<e.length;s++){let u=e.charCodeAt(s);if(u===0){i+="\uFFFD";continue}if(u<=31||u===127){i+="\\"+u.toString(16),o=true;continue}u===n||u===Di?(i+="\\"+e.charAt(s),o=false):(o&&(J(u)||me(u))&&(i+=" "),i+=e.charAt(s),o=false);}return r+i+r}var em="String",tm={value:String};function Ri(){return {type:"String",loc:this.getLocation(this.tokenStart,this.tokenEnd),value:vt(this.consume(5))}}function rm(e){this.token(5,Ni(e.value));}var Bi={};f(Bi,{generate:()=>am,name:()=>im,parse:()=>Mi,structure:()=>sm,walkContext:()=>om});var nm=33;function ra(){return this.Raw(null,false)}var im="StyleSheet",om="stylesheet",sm={children:[["Comment","CDO","CDC","Atrule","Rule","Raw"]]};function Mi(){let e=this.tokenStart,t=this.createList(),r;for(;!this.eof;){switch(this.tokenType){case 13:this.next();continue;case 25:if(this.charCodeAt(this.tokenStart+2)!==nm){this.next();continue}r=this.Comment();break;case 14:r=this.CDO();break;case 15:r=this.CDC();break;case 3:r=this.parseWithFallback(this.Atrule,ra);break;default:r=this.parseWithFallback(this.Rule,ra);}t.push(r);}return {type:"StyleSheet",loc:this.getLocation(e,this.tokenStart),children:t}}function am(e){this.children(e);}var Wi={};f(Wi,{generate:()=>um,name:()=>lm,parse:()=>_i,structure:()=>cm});var lm="SupportsDeclaration",cm={declaration:"Declaration"};function _i(){let e=this.tokenStart;this.eat(21),this.skipSC();let t=this.Declaration();return this.eof||this.eat(22),{type:"SupportsDeclaration",loc:this.getLocation(e,this.tokenStart),declaration:t}}function um(e){this.token(21,"("),this.node(e.declaration),this.token(22,")");}var Ui={};f(Ui,{generate:()=>dm,name:()=>hm,parse:()=>ji,structure:()=>mm});var pm=42,na=124;function qi(){this.tokenType!==1&&this.isDelim(pm)===false&&this.error("Identifier or asterisk is expected"),this.next();}var hm="TypeSelector",mm={name:String};function ji(){let e=this.tokenStart;return this.isDelim(na)?(this.next(),qi.call(this)):(qi.call(this),this.isDelim(na)&&(this.next(),qi.call(this))),{type:"TypeSelector",loc:this.getLocation(e,this.tokenStart),name:this.substrToCursor(e)}}function dm(e){this.tokenize(e.name);}var Yi={};f(Yi,{generate:()=>ym,name:()=>bm,parse:()=>Gi,structure:()=>xm});var ia=43,oa=45,Hi=63;function St(e,t){let r=0;for(let n=this.tokenStart+e;n<this.tokenEnd;n++){let i=this.charCodeAt(n);if(i===oa&&t&&r!==0)return St.call(this,e+r+1,false),-1;J(i)||this.error(t&&r!==0?"Hyphen minus"+(r<6?" or hex digit":"")+" is expected":r<6?"Hex digit is expected":"Unexpected input",n),++r>6&&this.error("Too many hex digits",n);}return this.next(),r}function nr(e){let t=0;for(;this.isDelim(Hi);)++t>e&&this.error("Too many question marks"),this.next();}function fm(e){this.charCodeAt(this.tokenStart)!==e&&this.error((e===ia?"Plus sign":"Hyphen minus")+" is expected");}function gm(){let e=0;switch(this.tokenType){case 10:if(e=St.call(this,1,true),this.isDelim(Hi)){nr.call(this,6-e);break}if(this.tokenType===12||this.tokenType===10){fm.call(this,oa),St.call(this,1,false);break}break;case 12:e=St.call(this,1,true),e>0&&nr.call(this,6-e);break;default:if(this.eatDelim(ia),this.tokenType===1){e=St.call(this,0,true),e>0&&nr.call(this,6-e);break}if(this.isDelim(Hi)){this.next(),nr.call(this,5);break}this.error("Hex digit or question mark is expected");}}var bm="UnicodeRange",xm={value:String};function Gi(){let e=this.tokenStart;return this.eatIdent("u"),gm.call(this),{type:"UnicodeRange",loc:this.getLocation(e,this.tokenStart),value:this.substrToCursor(e)}}function ym(e){this.tokenize(e.value);}var Zi={};f(Zi,{generate:()=>Am,name:()=>Cm,parse:()=>$i,structure:()=>Tm});var Xi={};f(Xi,{decode:()=>Vi,encode:()=>Qi});var km=32,Ki=92,wm=34,vm=39,Sm=40,sa=41;function Vi(e){let t=e.length,r=4,n=e.charCodeAt(t-1)===sa?t-2:t-1,i="";for(;r<n&&me(e.charCodeAt(r));)r++;for(;r<n&&me(e.charCodeAt(n));)n--;for(let o=r;o<=n;o++){let s=e.charCodeAt(o);if(s===Ki){if(o===n){o!==t-1&&(i=e.substr(o+1));break}if(s=e.charCodeAt(++o),K(Ki,s)){let u=o-1,c=se(e,u);o=c-1,i+=je(e.substring(u+1,c));}else s===13&&e.charCodeAt(o+1)===10&&o++;}else i+=e[o];}return i}function Qi(e){let t="",r=false;for(let n=0;n<e.length;n++){let i=e.charCodeAt(n);if(i===0){t+="\uFFFD";continue}if(i<=31||i===127){t+="\\"+i.toString(16),r=true;continue}i===km||i===Ki||i===wm||i===vm||i===Sm||i===sa?(t+="\\"+e.charAt(n),r=false):(r&&J(i)&&(t+=" "),t+=e.charAt(n),r=false);}return "url("+t+")"}var Cm="Url",Tm={value:String};function $i(){let e=this.tokenStart,t;switch(this.tokenType){case 7:t=Vi(this.consume(7));break;case 2:this.cmpStr(this.tokenStart,this.tokenEnd,"url(")||this.error("Function name must be `url`"),this.eat(2),this.skipSC(),t=vt(this.consume(5)),this.skipSC(),this.eof||this.eat(22);break;default:this.error("Url or Function is expected");}return {type:"Url",loc:this.getLocation(e,this.tokenStart),value:t}}function Am(e){this.token(7,Qi(e.value));}var eo={};f(eo,{generate:()=>zm,name:()=>Lm,parse:()=>Ji,structure:()=>Em});var Lm="Value",Em={children:[[]]};function Ji(){let e=this.tokenStart,t=this.readSequence(this.scope.Value);return {type:"Value",loc:this.getLocation(e,this.tokenStart),children:t}}function zm(e){this.children(e);}var ro={};f(ro,{generate:()=>Nm,name:()=>Im,parse:()=>to,structure:()=>Dm});var Pm=Object.freeze({type:"WhiteSpace",loc:null,value:" "}),Im="WhiteSpace",Dm={value:String};function to(){return this.eat(13),Pm}function Nm(e){this.token(13,e.value);}var aa={generic:true,cssWideKeywords:Ve,...Bs,node:Ct};var no={};f(no,{AtrulePrelude:()=>ca,Selector:()=>pa,Value:()=>fa});var Om=35,Rm=42,la=43,Fm=45,Mm=47,Bm=117;function Tt(e){switch(this.tokenType){case 4:return this.Hash();case 18:return this.Operator();case 21:return this.Parentheses(this.readSequence,e.recognizer);case 19:return this.Brackets(this.readSequence,e.recognizer);case 5:return this.String();case 12:return this.Dimension();case 11:return this.Percentage();case 10:return this.Number();case 2:return this.cmpStr(this.tokenStart,this.tokenEnd,"url(")?this.Url():this.Function(this.readSequence,e.recognizer);case 7:return this.Url();case 1:return this.cmpChar(this.tokenStart,Bm)&&this.cmpChar(this.tokenStart+1,la)?this.UnicodeRange():this.Identifier();case 9:{let t=this.charCodeAt(this.tokenStart);if(t===Mm||t===Rm||t===la||t===Fm)return this.Operator();t===Om&&this.error("Hex or identifier is expected",this.tokenStart+1);break}}}var ca={getNode:Tt};var _m=35,Wm=38,qm=42,jm=43,Um=47,ua=46,Hm=62,Gm=124,Ym=126;function Km(e,t){t.last!==null&&t.last.type!=="Combinator"&&e!==null&&e.type!=="Combinator"&&t.push({type:"Combinator",loc:null,name:" "});}function Vm(){switch(this.tokenType){case 19:return this.AttributeSelector();case 4:return this.IdSelector();case 16:return this.lookupType(1)===16?this.PseudoElementSelector():this.PseudoClassSelector();case 1:return this.TypeSelector();case 10:case 11:return this.Percentage();case 12:this.charCodeAt(this.tokenStart)===ua&&this.error("Identifier is expected",this.tokenStart+1);break;case 9:{switch(this.charCodeAt(this.tokenStart)){case jm:case Hm:case Ym:case Um:return this.Combinator();case ua:return this.ClassSelector();case qm:case Gm:return this.TypeSelector();case _m:return this.IdSelector();case Wm:return this.NestingSelector()}break}}}var pa={onWhiteSpace:Km,getNode:Vm};function ha(){return this.createSingleNodeList(this.Raw(null,false))}function ma(){let e=this.createList();if(this.skipSC(),e.push(this.Identifier()),this.skipSC(),this.tokenType===18){e.push(this.Operator());let t=this.tokenIndex,r=this.parseCustomProperty?this.Value(null):this.Raw(this.consumeUntilExclamationMarkOrSemicolon,false);if(r.type==="Value"&&r.children.isEmpty){for(let n=t-this.tokenIndex;n<=0;n++)if(this.lookupType(n)===13){r.children.appendData({type:"WhiteSpace",loc:null,value:" "});break}}e.push(r);}return e}function da(e){return e!==null&&e.type==="Operator"&&(e.value[e.value.length-1]==="-"||e.value[e.value.length-1]==="+")}var fa={getNode:Tt,onWhiteSpace(e,t){da(e)&&(e.value=" "+e.value),da(t.last)&&(t.last.value+=" ");},expression:ha,var:ma};var Qm=new Set(["none","and","not","or"]),ga={parse:{prelude(){let e=this.createList();if(this.tokenType===1){let t=this.substring(this.tokenStart,this.tokenEnd);Qm.has(t.toLowerCase())||e.push(this.Identifier());}return e.push(this.Condition("container")),e},block(e=false){return this.Block(e)}}};var ba={parse:{prelude:null,block(){return this.Block(true)}}};function io(e,t){return this.parseWithFallback(()=>{try{return e.call(this)}finally{this.skipSC(),this.lookupNonWSType(0)!==22&&this.error();}},t||(()=>this.Raw(null,true)))}var xa={layer(){this.skipSC();let e=this.createList(),t=io.call(this,this.Layer);return (t.type!=="Raw"||t.value!=="")&&e.push(t),e},supports(){this.skipSC();let e=this.createList(),t=io.call(this,this.Declaration,()=>io.call(this,()=>this.Condition("supports")));return (t.type!=="Raw"||t.value!=="")&&e.push(t),e}},ya={parse:{prelude(){let e=this.createList();switch(this.tokenType){case 5:e.push(this.String());break;case 7:case 2:e.push(this.Url());break;default:this.error("String or url() is expected");}return this.skipSC(),this.tokenType===1&&this.cmpStr(this.tokenStart,this.tokenEnd,"layer")?e.push(this.Identifier()):this.tokenType===2&&this.cmpStr(this.tokenStart,this.tokenEnd,"layer(")&&e.push(this.Function(null,xa)),this.skipSC(),this.tokenType===2&&this.cmpStr(this.tokenStart,this.tokenEnd,"supports(")&&e.push(this.Function(null,xa)),(this.lookupNonWSType(0)===1||this.lookupNonWSType(0)===21)&&e.push(this.MediaQueryList()),e},block:null}};var ka={parse:{prelude(){return this.createSingleNodeList(this.LayerList())},block(){return this.Block(false)}}};var wa={parse:{prelude(){return this.createSingleNodeList(this.MediaQueryList())},block(e=false){return this.Block(e)}}};var va={parse:{prelude(){return this.createSingleNodeList(this.SelectorList())},block(){return this.Block(true)}}};var Sa={parse:{prelude(){return this.createSingleNodeList(this.SelectorList())},block(){return this.Block(true)}}};var Ca={parse:{prelude(){return this.createSingleNodeList(this.Scope())},block(e=false){return this.Block(e)}}};var Ta={parse:{prelude:null,block(e=false){return this.Block(e)}}};var Aa={parse:{prelude(){return this.createSingleNodeList(this.Condition("supports"))},block(e=false){return this.Block(e)}}};var La={container:ga,"font-face":ba,import:ya,layer:ka,media:wa,nest:va,page:Sa,scope:Ca,"starting-style":Ta,supports:Aa};function Ea(){let e=this.createList();this.skipSC();e:for(;!this.eof;){switch(this.tokenType){case 1:e.push(this.Identifier());break;case 5:e.push(this.String());break;case 18:e.push(this.Operator());break;case 22:break e;default:this.error("Identifier, string or comma is expected");}this.skipSC();}return e}var Fe={parse(){return this.createSingleNodeList(this.SelectorList())}},oo={parse(){return this.createSingleNodeList(this.Selector())}},Xm={parse(){return this.createSingleNodeList(this.Identifier())}},$m={parse:Ea},ir={parse(){return this.createSingleNodeList(this.Nth())}},za={dir:Xm,has:Fe,lang:$m,matches:Fe,is:Fe,"-moz-any":Fe,"-webkit-any":Fe,where:Fe,not:Fe,"nth-child":ir,"nth-last-child":ir,"nth-last-of-type":ir,"nth-of-type":ir,slotted:oo,host:oo,"host-context":oo};var so={};f(so,{AnPlusB:()=>en,Atrule:()=>rn,AtrulePrelude:()=>on,AttributeSelector:()=>ln,Block:()=>un,Brackets:()=>hn,CDC:()=>dn,CDO:()=>gn,ClassSelector:()=>xn,Combinator:()=>kn,Comment:()=>vn,Condition:()=>Cn,Declaration:()=>An,DeclarationList:()=>zn,Dimension:()=>In,Feature:()=>Nn,FeatureFunction:()=>Rn,FeatureRange:()=>Bn,Function:()=>Wn,GeneralEnclosed:()=>jn,Hash:()=>Hn,IdSelector:()=>Vn,Identifier:()=>Yn,Layer:()=>Xn,LayerList:()=>Zn,MediaQuery:()=>ei,MediaQueryList:()=>ri,NestingSelector:()=>ii,Nth:()=>si,Number:()=>li,Operator:()=>ui,Parentheses:()=>hi,Percentage:()=>di,PseudoClassSelector:()=>gi,PseudoElementSelector:()=>xi,Ratio:()=>ki,Raw:()=>vi,Rule:()=>Ci,Scope:()=>Ai,Selector:()=>Ei,SelectorList:()=>Pi,String:()=>Ri,StyleSheet:()=>Mi,SupportsDeclaration:()=>_i,TypeSelector:()=>ji,UnicodeRange:()=>Gi,Url:()=>$i,Value:()=>Ji,WhiteSpace:()=>to});var Pa={parseContext:{default:"StyleSheet",stylesheet:"StyleSheet",atrule:"Atrule",atrulePrelude(e){return this.AtrulePrelude(e.atrule?String(e.atrule):null)},mediaQueryList:"MediaQueryList",mediaQuery:"MediaQuery",condition(e){return this.Condition(e.kind)},rule:"Rule",selectorList:"SelectorList",selector:"Selector",block(){return this.Block(true)},declarationList:"DeclarationList",declaration:"Declaration",value:"Value"},features:{supports:{selector(){return this.Selector()}},container:{style(){return this.Declaration()}}},scope:no,atrule:La,pseudo:za,node:so};var Ia={node:Ct};var Da=Zr({...aa,...Pa,...Ia});var Oa={};f(Oa,{decode:()=>Zm,encode:()=>Jm});var Na=92;function Zm(e){let t=e.length-1,r="";for(let n=0;n<e.length;n++){let i=e.charCodeAt(n);if(i===Na){if(n===t)break;if(i=e.charCodeAt(++n),K(Na,i)){let o=n-1,s=se(e,o);n=s-1,r+=je(e.substring(o+1,s));}else i===13&&e.charCodeAt(n+1)===10&&n++;}else r+=e[n];}return r}function Jm(e){let t="";if(e.length===1&&e.charCodeAt(0)===45)return "\\-";for(let r=0;r<e.length;r++){let n=e.charCodeAt(r);if(n===0){t+="\uFFFD";continue}if(n<=31||n===127||n>=48&&n<=57&&(r===0||r===1&&e.charCodeAt(0)===45)){t+="\\"+n.toString(16)+" ";continue}_e(n)?t+=e.charAt(r):t+="\\"+e.charAt(r);}return t}var{tokenize:$b,parse:Zb,generate:Jb,lexer:ex,createLexer:tx,walk:rx,find:nx,findLast:ix,findAll:ox,toPlainObject:sx,fromPlainObject:ax,fork:lx}=Da;

	// deno-lint-ignore-file no-control-regex


	// 1. Let input be the value passed to this algorithm.
	function parse$2(input) {

		// UTILITY FUNCTIONS

		// Manual is faster than RegEx
		// http://bjorn.tipling.com/state-and-regular-expressions-in-javascript
		// http://jsperf.com/whitespace-character/5
		function isSpace(c) {
			return (c === "\u0020" || // space
				c === "\u0009" || // horizontal tab
				c === "\u000A" || // new line
				c === "\u000C" || // form feed
				c === "\u000D");  // carriage return
		}

		function collectCharacters(regEx) {
			let chars;
			const match = regEx.exec(input.substring(pos));
			if (match) {
				chars = match[0];
				pos += chars.length;
				return chars;
			}
		}

		const inputLength = input.length;

		// (Don"t use \s, to avoid matching non-breaking space)
		/* eslint-disable no-control-regex */
		const regexLeadingSpaces = /^[ \t\n\r\u000c]+/;
		const regexLeadingCommasOrSpaces = /^[, \t\n\r\u000c]+/;
		const regexLeadingNotSpaces = /^[^ \t\n\r\u000c]+/;
		const regexTrailingCommas = /[,]+$/;
		const regexNonNegativeInteger = /^\d+$/;
		/* eslint-enable no-control-regex */

		// ( Positive or negative or unsigned integers or decimals, without or without exponents.
		// Must include at least one digit.
		// According to spec tests any decimal point must be followed by a digit.
		// No leading plus sign is allowed.)
		// https://html.spec.whatwg.org/multipage/infrastructure.html#valid-floating-point-number
		const regexFloatingPoint = /^-?(?:[0-9]+|[0-9]*\.[0-9]+)(?:[eE][+-]?[0-9]+)?$/;

		let url, descriptors, currentDescriptor, state, c,
			// 2. Let position be a pointer into input, initially pointing at the start
			//    of the string.
			pos = 0;
		// 3. Let candidates be an initially empty source set.
		const candidates = [];

		// 4. Splitting loop: Collect a sequence of characters that are space
		//    characters or U+002C COMMA characters. If any U+002C COMMA characters
		//    were collected, that is a parse error.		
		while (true) {
			collectCharacters(regexLeadingCommasOrSpaces);

			// 5. If position is past the end of input, return candidates and abort these steps.
			if (pos >= inputLength) {
				return candidates; // (we"re done, this is the sole return path)
			}

			// 6. Collect a sequence of characters that are not space characters,
			//    and let that be url.
			url = collectCharacters(regexLeadingNotSpaces);

			// 7. Let descriptors be a new empty list.
			descriptors = [];

			// 8. If url ends with a U+002C COMMA character (,), follow these substeps:
			//		(1). Remove all trailing U+002C COMMA characters from url. If this removed
			//         more than one character, that is a parse error.
			if (url.slice(-1) === ",") {
				url = url.replace(regexTrailingCommas, "");
				// (Jump ahead to step 9 to skip tokenization and just push the candidate).
				parseDescriptors();

				//	Otherwise, follow these substeps:
			} else {
				tokenize();
			} // (close else of step 8)

			// 16. Return to the step labeled splitting loop.
		} // (Close of big while loop.)

		/**
		 * Tokenizes descriptor properties prior to parsing
		 * Returns undefined.
		 */
		function tokenize() {

			// 8.1. Descriptor tokeniser: Skip whitespace
			collectCharacters(regexLeadingSpaces);

			// 8.2. Let current descriptor be the empty string.
			currentDescriptor = "";

			// 8.3. Let state be in descriptor.
			state = "in descriptor";

			while (true) {

				// 8.4. Let c be the character at position.
				c = input.charAt(pos);

				//  Do the following depending on the value of state.
				//  For the purpose of this step, "EOF" is a special character representing
				//  that position is past the end of input.

				// In descriptor
				if (state === "in descriptor") {
					// Do the following, depending on the value of c:

					// Space character
					// If current descriptor is not empty, append current descriptor to
					// descriptors and let current descriptor be the empty string.
					// Set state to after descriptor.
					if (isSpace(c)) {
						if (currentDescriptor) {
							descriptors.push(currentDescriptor);
							currentDescriptor = "";
							state = "after descriptor";
						}

						// U+002C COMMA (,)
						// Advance position to the next character in input. If current descriptor
						// is not empty, append current descriptor to descriptors. Jump to the step
						// labeled descriptor parser.
					} else if (c === ",") {
						pos += 1;
						if (currentDescriptor) {
							descriptors.push(currentDescriptor);
						}
						parseDescriptors();
						return;

						// U+0028 LEFT PARENTHESIS (()
						// Append c to current descriptor. Set state to in parens.
					} else if (c === "\u0028") {
						currentDescriptor = currentDescriptor + c;
						state = "in parens";

						// EOF
						// If current descriptor is not empty, append current descriptor to
						// descriptors. Jump to the step labeled descriptor parser.
					} else if (c === "") {
						if (currentDescriptor) {
							descriptors.push(currentDescriptor);
						}
						parseDescriptors();
						return;

						// Anything else
						// Append c to current descriptor.
					} else {
						currentDescriptor = currentDescriptor + c;
					}
					// (end "in descriptor"

					// In parens
				} else if (state === "in parens") {

					// U+0029 RIGHT PARENTHESIS ())
					// Append c to current descriptor. Set state to in descriptor.
					if (c === ")") {
						currentDescriptor = currentDescriptor + c;
						state = "in descriptor";

						// EOF
						// Append current descriptor to descriptors. Jump to the step labeled
						// descriptor parser.
					} else if (c === "") {
						descriptors.push(currentDescriptor);
						parseDescriptors();
						return;

						// Anything else
						// Append c to current descriptor.
					} else {
						currentDescriptor = currentDescriptor + c;
					}

					// After descriptor
				} else if (state === "after descriptor") {

					// Do the following, depending on the value of c:
					// Space character: Stay in this state.
					if (isSpace(c)) ; else if (c === "") {
						parseDescriptors();
						return;

						// Anything else
						// Set state to in descriptor. Set position to the previous character in input.
					} else {
						state = "in descriptor";
						pos -= 1;

					}
				}

				// Advance position to the next character in input.
				pos += 1;

				// Repeat this step.
			} // (close while true loop)
		}

		/**
		 * Adds descriptor properties to a candidate, pushes to the candidates array
		 * @return undefined
		 */
		// Declared outside of the while loop so that it"s only created once.
		function parseDescriptors() {

			// 9. Descriptor parser: Let error be no.
			let pError = false,

				// 10. Let width be absent.
				// 11. Let density be absent.
				// 12. Let future-compat-h be absent. (We"re implementing it now as h)
				w, d, h, i,
				desc, lastChar, value, intVal, floatVal;
			const candidate = {};

			// 13. For each descriptor in descriptors, run the appropriate set of steps
			// from the following list:
			for (i = 0; i < descriptors.length; i++) {
				desc = descriptors[i];

				lastChar = desc[desc.length - 1];
				value = desc.substring(0, desc.length - 1);
				intVal = parseInt(value, 10);
				floatVal = parseFloat(value);

				// If the descriptor consists of a valid non-negative integer followed by
				// a U+0077 LATIN SMALL LETTER W character
				if (regexNonNegativeInteger.test(value) && (lastChar === "w")) {

					// If width and density are not both absent, then let error be yes.
					if (w || d) { pError = true; }

					// Apply the rules for parsing non-negative integers to the descriptor.
					// If the result is zero, let error be yes.
					// Otherwise, let width be the result.
					if (intVal === 0) { pError = true; } else { w = intVal; }

					// If the descriptor consists of a valid floating-point number followed by
					// a U+0078 LATIN SMALL LETTER X character
				} else if (regexFloatingPoint.test(value) && (lastChar === "x")) {

					// If width, density and future-compat-h are not all absent, then let error
					// be yes.
					if (w || d || h) { pError = true; }

					// Apply the rules for parsing floating-point number values to the descriptor.
					// If the result is less than zero, let error be yes. Otherwise, let density
					// be the result.
					if (floatVal < 0) { pError = true; } else { d = floatVal; }

					// If the descriptor consists of a valid non-negative integer followed by
					// a U+0068 LATIN SMALL LETTER H character
				} else if (regexNonNegativeInteger.test(value) && (lastChar === "h")) {

					// If height and density are not both absent, then let error be yes.
					if (h || d) { pError = true; }

					// Apply the rules for parsing non-negative integers to the descriptor.
					// If the result is zero, let error be yes. Otherwise, let future-compat-h
					// be the result.
					if (intVal === 0) { pError = true; } else { h = intVal; }

					// Anything else, Let error be yes.
				} else { pError = true; }
			} // (close step 13 for loop)

			// 15. If error is still no, then append a new image source to candidates whose
			// URL is url, associated with a width width if not absent and a pixel
			// density density if not absent. Otherwise, there is a parse error.
			if (!pError) {
				candidate.url = url;
				if (w) { candidate.w = w; }
				if (d) { candidate.d = d; }
				if (h) { candidate.h = h; }
				candidates.push(candidate);
			} else if (console && console.log) {  // eslint-disable-line no-console
				console.log("Invalid srcset descriptor found in \"" + input + "\" at \"" + desc + "\"."); // eslint-disable-line no-console
			}
		} // (close parseDescriptors fn)

	}

	function serialize(srcset) {
		return srcset.map(function (candidate) {
			let descriptor = "";
			if (candidate.w) {
				descriptor += candidate.w + "w";
			}
			if (candidate.h) {
				descriptor += candidate.h + "h";
			}
			if (candidate.d) {
				descriptor += candidate.d + "x";
			}
			return candidate.url + (descriptor ? " " + descriptor : "");
		}).join(", ");
	}

	/* global URL */


	const BASE64_ENCODING$1 = "base64";
	const HREF_ATTRIBUTE = "href";
	const SRC_ATTRIBUTE = "src";
	const TITLE_ATTRIBUTE = "title";
	const SRCSET_ATTRIBUTE = "srcset";
	const SRCDOC_ATTRIBUTE = "srcdoc";
	const CONTENT_ATTRIBUTE$1 = "content";
	const STYLE_ATTRIBUTE = "style";
	const MEDIA_ATTRIBUTE = "media";
	const BACKGROUND_ATTRIBUTE = "background";
	const REL_ATTRIBUTE = "rel";
	const DATA_ATTRIBUTE = "data";
	const TYPE_ATTRIBUTE = "type";
	const PING_ATTRIBUTE = "ping";
	const HTTP_EQUIV_ATTRIBUTE$1 = "http-equiv";
	const INTEGRITY_ATTRIBUTE = "integrity";
	const CHARSET_ATTRIBUTE$1 = "charset";
	const SHADOWMODE_ATTRIBUTE = "shadowmode";
	const SHADOWROOTMODE_ATTRIBUTE = "shadowrootmode";
	const SIZES_ATTRIBUTE = "sizes";
	const STYLESHEET_CONTENT_TYPE = "text/css";
	const CID_PROTOCOL = "cid:";
	const DATA_PROTOCOL = "data:";
	const HTTP_PROTOCOL = "http:";
	const HTTPS_PROTOCOL = "https:";
	const URN_PROTOCOL = "urn:";
	const AT_RULE$1 = "Atrule";
	const IMPORT_RULE = "import";
	const URL_FUNCTION = "Url";
	const STYLESHEET_CONTEXT = "stylesheet";
	const DECLARATION_LIST_CONTEXT = "declarationList";
	const BASE_TAG = "BASE";
	const LINK_TAG = "LINK";
	const STYLE_TAG = "STYLE";
	const IMG_TAG = "IMG";
	const AUDIO_TAG = "AUDIO";
	const VIDEO_TAG = "VIDEO";
	const SOURCE_TAG = "SOURCE";
	const SCRIPT_TAG = "SCRIPT";
	const BODY_TAG = "BODY";
	const TABLE_TAG = "TABLE";
	const TD_TAG = "TD";
	const TH_TAG = "TH";
	const INPUT_TAG = "INPUT";
	const IFRAME_TAG = "IFRAME";
	const FRAME_TAG = "FRAME";
	const EMBED_TAG = "EMBED";
	const OBJECT_TAG = "OBJECT";
	const A_TAG = "A";
	const AREA_TAG = "AREA";
	const META_TAG$1 = "META";
	const TEMPLATE_TAG = "TEMPLATE";
	const HEAD_TAG = "HEAD";
	const TITLE_TAG = "TITLE";
	const ORIGINAL_URL_FUNCTION_NAME = "--mhtml-to-html-url";
	const ORIGINAL_URL_ATTRIBUTE_PREFIX = "data-original-";
	const CONTENT_TYPE_HEADER$1 = "Content-Type";
	const REL_ATTRIBUTE_STYLESHEET = "stylesheet";
	const REL_ATTRIBUTE_ICON = "icon";
	const REL_ATTRIBUTE_CANONICAL = "canonical";
	const REL_ATTRIBUTE_ALTERNATE = "alternate";
	const HTTP_EQUIV_ATTRIBUTE_REFRESH = "refresh";
	const HTTP_EQUIV_ATTRIBUTE_CSP = "content-security-policy";
	const TYPE_ATTRIBUTE_IMAGE = "image";
	const REL_REMOVED_VALUES_REGEXP = /(preconnect|prerender|dns-prefetch|preload|prefetch|manifest|modulepreload)/gi;
	const URN_ERROR_REGEXP = /^urn:[^:]+:(.+)$/;
	const APPLICATION_OCTET_STREAM_CONTENT_TYPE = "application/octet-stream";
	const JSON_LD_CONTENT_TYPE = "application/ld+json";
	const TEXT_HTML_CONTENT_TYPE = "text/html";
	const UTF8_CHARSET$1 = "utf-8";
	const INDEX_PAGE_NOT_FOUND_ERROR = "Index page not found";
	const CID_REGEXP = /^<.+>$/;
	const CONTENT_TYPE_SEPARATOR = ";";
	const DATA_URI_PAYLOAD_SEPARATOR = ",";
	const EMPTY_STRING = "";
	const ORIGINAL_URL_FUNCTION_REGEXP = /url\(--mhtml-to-html-url\\\(\\"(.*?)\\"\\\)\\ /g;
	const ORIGINAL_URL_COMMENT = "/* original URL: $1 */ url(";
	const DEFAULT_CSP = "default-src 'none'; connect-src 'self' data:; font-src 'self' data:; img-src 'self' data:; style-src 'self' 'unsafe-inline' data:; frame-src 'self' data:; media-src 'self' data:; object-src 'self' data:; ";
	const JS_ENABLED_CSP = "script-src 'self' 'unsafe-inline' data:;";
	const JS_DISABLED_CSP = "script-src 'none';";
	const CSS_FUNCTION_PARENTHESIS_START = "(";
	const CSS_FUNCTION_PARENTHESIS_END = ") ";
	const SUBJECT_HEADER = "Subject";
	const DATE_HEADER = "Date";
	const FROM_HEADER = "From";
	const JSON_LD_PAGE_INFO = {
	    "@context": "https://schema.org",
	    "@type": "WebPage",
	    "additionalProperty": {
	        "@type": "PropertyValue",
	        "name": "savedBy"
	    }
	};

	async function fetchAndConvert(mhtml, config, failedResources = []) {
	    if (config.fetchMissingResources) {
	        let { fetch } = config;
	        let missingResources = [];
	        if (!fetch) {
	            fetch = globalThis.fetch;
	        }
	        missingResources = convert$1(mhtml, config);
	        missingResources = missingResources.filter(resource => !failedResources.includes(resource.id));
	        if (missingResources.length) {
	            await Promise.all(missingResources.map(async resource => {
	                const { id, transferEncoding } = resource;
	                let url = id;
	                const urnErrorMatch = url.match(URN_ERROR_REGEXP);
	                if (urnErrorMatch) {
	                    url = urnErrorMatch[1];
	                }
	                try {
	                    const response = await fetch(url);
	                    if (response.ok) {
	                        resource.contentType = response.headers.get(CONTENT_TYPE_HEADER$1) || APPLICATION_OCTET_STREAM_CONTENT_TYPE;
	                        if (transferEncoding === BASE64_ENCODING$1) {
	                            const bytes = await response.bytes();
	                            resource.data = decodeBinary(bytes);
	                        } else {
	                            resource.data = await response.text();
	                        }
	                        mhtml.resources[id] = resource;
	                    } else if (!failedResources.includes(id)) {
	                        failedResources.push(id);
	                    }
	                    // eslint-disable-next-line no-unused-vars
	                } catch (_) {
	                    if (!failedResources.includes(id)) {
	                        failedResources.push(id);
	                    }
	                }
	            }));
	            return fetchAndConvert(mhtml, config, failedResources);
	        } else {
	            return convert$1(mhtml, { ...config, fetchMissingResources: false });
	        }
	    } else {
	        return convert$1(mhtml, config);
	    }
	}

	function convert$1({ headers, frames, resources, unfoundResources = new Set(), index, id }, { DOMParser, enableScripts, fetchMissingResources } = { DOMParser: globalThis.DOMParser }) {
	    let resource = resources[index];
	    if (!resource) {
	        throw new Error(INDEX_PAGE_NOT_FOUND_ERROR);
	    }
	    let base = resource.id;
	    if (resource.transferEncoding === BASE64_ENCODING$1) {
	        resource.transferEncoding = undefined;
	        resource.data = decodeBase64(resource.data, getCharset(resource.contentType));
	    }
	    const contentType = resource.contentType.split(CONTENT_TYPE_SEPARATOR)[0];
	    const dom = parseDOM(resource.data, contentType, DOMParser);
	    const document = dom.document;
	    let nodes = [document];
	    const baseElement = document.getElementsByTagName(BASE_TAG)[0];
	    if (baseElement) {
	        const href = baseElement.getAttribute(HREF_ATTRIBUTE);
	        if (href) {
	            base = resolvePath(href, base);
	        }
	        baseElement.remove();
	    }
	    if (!fetchMissingResources) {
	        resource.used = true;
	    }
	    nodes = [document];
	    let canonicalLinkElement;
	    const stylesheets = {};
	    const missingResources = [];
	    const removedNodes = [];
	    const favicons = [];
	    let title;
	    while (nodes.length) {
	        const childNode = nodes.shift();
	        if (childNode.childNodes) {
	            for (const child of childNode.childNodes) {
	                let href, src;
	                if (child.getAttribute) {
	                    href = child.getAttribute(HREF_ATTRIBUTE);
	                    if (href) {
	                        href = resolvePath(href, base);
	                    }
	                    src = child.getAttribute(SRC_ATTRIBUTE);
	                    if (src) {
	                        src = resolvePath(src, base);
	                    }
	                    const style = child.getAttribute(STYLE_ATTRIBUTE);
	                    if (style) {
	                        const declarations = replaceStylesheetUrls(resources, base, { data: style }, { context: DECLARATION_LIST_CONTEXT }, stylesheets, fetchMissingResources && missingResources, unfoundResources);
	                        if (!fetchMissingResources) {
	                            child.setAttribute(STYLE_ATTRIBUTE, declarations);
	                        }
	                    }
	                    const integrity = child.getAttribute(INTEGRITY_ATTRIBUTE);
	                    if (integrity) {
	                        child.removeAttribute(INTEGRITY_ATTRIBUTE);
	                    }
	                }
	                if (!enableScripts && child.removeAttribute) {
	                    EVENT_HANDLER_ATTRIBUTES.forEach(attribute => child.removeAttribute(attribute));
	                }
	                if (child.tagName && child.tagName.toUpperCase() === LINK_TAG && href) {
	                    let rel = child.getAttribute(REL_ATTRIBUTE);
	                    if (rel) {
	                        rel = rel.toLowerCase();
	                        if (rel === REL_ATTRIBUTE_STYLESHEET) {
	                            resource = getResource(resources, href, child.getAttribute(HREF_ATTRIBUTE));
	                            if (resource) {
	                                let base = resource.id;
	                                if (base.startsWith(CID_PROTOCOL)) {
	                                    if (index.match(CID_REGEXP)) {
	                                        base = id;
	                                    } else {
	                                        base = index;
	                                    }
	                                }
	                                const stylesheet = replaceStylesheetUrls(resources, base, resource, { context: STYLESHEET_CONTEXT }, stylesheets, fetchMissingResources && missingResources, unfoundResources);
	                                if (!fetchMissingResources) {
	                                    const styleElement = document.createElement(STYLE_TAG);
	                                    styleElement.type = STYLESHEET_CONTENT_TYPE;
	                                    const media = child.getAttribute(MEDIA_ATTRIBUTE);
	                                    if (media) {
	                                        styleElement.setAttribute(MEDIA_ATTRIBUTE, media);
	                                    }
	                                    resource.used = true;
	                                    resource.data = stylesheet;
	                                    if (!href.startsWith(DATA_PROTOCOL)) {
	                                        styleElement.setAttribute(ORIGINAL_URL_ATTRIBUTE_PREFIX + HREF_ATTRIBUTE, href);
	                                    }
	                                    styleElement.appendChild(document.createTextNode(resource.data));
	                                    child.replaceWith(styleElement);
	                                }
	                            } else if (fetchMissingResources) {
	                                addMissingResource(missingResources, href);
	                            } else {
	                                unfoundResources.add(href);
	                                setAttribute(child, HREF_ATTRIBUTE, href);
	                            }
	                            if (!fetchMissingResources) {
	                                const title = child.getAttribute(TITLE_ATTRIBUTE);
	                                if (title && rel.includes(REL_ATTRIBUTE_ALTERNATE)) {
	                                    removedNodes.push(child);
	                                }
	                            }
	                        } else if (rel.includes(REL_ATTRIBUTE_ICON)) {
	                            resource = getResource(resources, href, child.getAttribute(HREF_ATTRIBUTE));
	                            const media = child.getAttribute(MEDIA_ATTRIBUTE);
	                            const type = child.getAttribute(TYPE_ATTRIBUTE);
	                            const sizes = child.getAttribute(SIZES_ATTRIBUTE);
	                            if (resource) {
	                                if (!fetchMissingResources) {
	                                    resource.used = true;
	                                    const resourceURI = getResourceURI(resource);
	                                    setAttribute(child, HREF_ATTRIBUTE, resourceURI);
	                                    favicons.push({ href: resourceURI, media, type, sizes, originalHref: href });
	                                }
	                            } else if (fetchMissingResources) {
	                                addMissingResource(missingResources, href, BASE64_ENCODING$1);
	                            } else {
	                                unfoundResources.add(href);
	                                setAttribute(child, HREF_ATTRIBUTE, href);
	                                favicons.push({ href, media, type, sizes });
	                            }
	                        } else if (rel == REL_ATTRIBUTE_CANONICAL && !fetchMissingResources) {
	                            canonicalLinkElement = child;
	                        }
	                        if (!fetchMissingResources) {
	                            const relValue = rel
	                                .replace(REL_REMOVED_VALUES_REGEXP, EMPTY_STRING)
	                                .trim();
	                            if (relValue.length) {
	                                child.setAttribute(REL_ATTRIBUTE, relValue);
	                            } else {
	                                removedNodes.push(child);
	                            }
	                        }
	                    }
	                } else if (child.tagName && child.tagName.toUpperCase() === STYLE_TAG) {
	                    const style = replaceStylesheetUrls(resources, base, { data: child.textContent }, { context: STYLESHEET_CONTEXT }, stylesheets, fetchMissingResources && missingResources, unfoundResources);
	                    if (!fetchMissingResources) {
	                        const styleElement = document.createElement(STYLE_TAG);
	                        styleElement.type = STYLESHEET_CONTENT_TYPE;
	                        const media = child.getAttribute(MEDIA_ATTRIBUTE);
	                        if (media) {
	                            styleElement.setAttribute(MEDIA_ATTRIBUTE, media);
	                        }
	                        styleElement.appendChild(document.createTextNode(style));
	                        child.replaceWith(styleElement);
	                    }
	                } else if (child.tagName && child.tagName.toUpperCase() === IMG_TAG || child.tagName && child.tagName.toUpperCase() === AUDIO_TAG || child.tagName && child.tagName.toUpperCase() === VIDEO_TAG || child.tagName && child.tagName.toUpperCase() === SOURCE_TAG || child.tagName && child.tagName.toUpperCase() === SCRIPT_TAG) {
	                    if (src) {
	                        resource = getResource(resources, src, child.getAttribute(SRC_ATTRIBUTE));
	                        if (resource) {
	                            if (!fetchMissingResources) {
	                                resource.used = true;
	                                setAttribute(child, SRC_ATTRIBUTE, getResourceURI(resource));
	                            }
	                        } else if (fetchMissingResources) {
	                            addMissingResource(missingResources, src, BASE64_ENCODING$1);
	                        } else {
	                            unfoundResources.add(src);
	                            setAttribute(child, SRC_ATTRIBUTE, src);
	                        }
	                    }
	                    if (child.tagName && child.tagName.toUpperCase() === IMG_TAG || child.tagName && child.tagName.toUpperCase() === SOURCE_TAG) {
	                        const srcset = child.getAttribute(SRCSET_ATTRIBUTE);
	                        if (srcset) {
	                            const srcsetData = parse$2(srcset).map(data => {
	                                const src = resolvePath(data.url, base);
	                                const resource = getResource(resources, src, data.url);
	                                if (resource) {
	                                    if (!fetchMissingResources) {
	                                        resource.used = true;
	                                        data.url = getResourceURI(resource);
	                                    }
	                                } else if (fetchMissingResources) {
	                                    addMissingResource(missingResources, src, BASE64_ENCODING$1);
	                                } else {
	                                    unfoundResources.add(src);
	                                    data.url = src;
	                                }
	                                return data;
	                            });
	                            if (!fetchMissingResources) {
	                                setAttribute(child, SRCSET_ATTRIBUTE, serialize(srcsetData));
	                            }
	                        }
	                    } else if (child.tagName && child.tagName.toUpperCase() === SCRIPT_TAG && !fetchMissingResources) {
	                        let type = child.getAttribute(TYPE_ATTRIBUTE);
	                        if (type) {
	                            type = type.toLowerCase();
	                        }
	                        if (!enableScripts && (!type || type !== JSON_LD_CONTENT_TYPE)) {
	                            removedNodes.push(child);
	                        }
	                    }
	                } else if (child.tagName && child.tagName.toUpperCase() === BODY_TAG || child.tagName && child.tagName.toUpperCase() === TABLE_TAG || child.tagName && child.tagName.toUpperCase() === TD_TAG || child.tagName && child.tagName.toUpperCase() === TH_TAG) {
	                    let background = child.getAttribute(BACKGROUND_ATTRIBUTE);
	                    if (background && !background.startsWith(DATA_PROTOCOL)) {
	                        background = resolvePath(background, base);
	                        resource = getResource(resources, background, child.getAttribute(BACKGROUND_ATTRIBUTE));
	                        if (resource) {
	                            if (!fetchMissingResources) {
	                                resource.used = true;
	                                setAttribute(child, BACKGROUND_ATTRIBUTE, getResourceURI(resource));
	                            }
	                        } else if (fetchMissingResources) {
	                            addMissingResource(missingResources, background, BASE64_ENCODING$1);
	                        } else {
	                            unfoundResources.add(background);
	                            setAttribute(child, BACKGROUND_ATTRIBUTE, background);
	                        }
	                    }
	                } else if (child.tagName && child.tagName.toUpperCase() === INPUT_TAG) {
	                    const type = child.getAttribute(TYPE_ATTRIBUTE);
	                    if (type && type.toLowerCase() === TYPE_ATTRIBUTE_IMAGE && src) {
	                        resource = getResource(resources, src, child.getAttribute(SRC_ATTRIBUTE));
	                        if (resource) {
	                            if (!fetchMissingResources) {
	                                resource.used = true;
	                                setAttribute(child, SRC_ATTRIBUTE, getResourceURI(resource));
	                            }
	                        } else if (fetchMissingResources) {
	                            addMissingResource(missingResources, src, BASE64_ENCODING$1);
	                        } else {
	                            unfoundResources.add(src);
	                            setAttribute(child, SRC_ATTRIBUTE, src);
	                        }
	                    }
	                } else if (child.tagName && child.tagName.toUpperCase() === IFRAME_TAG || child.tagName && child.tagName.toUpperCase() === FRAME_TAG || child.tagName && child.tagName.toUpperCase() === EMBED_TAG || child.tagName && child.tagName.toUpperCase() === OBJECT_TAG) {
	                    let id, attribute;
	                    if (child.tagName && child.tagName.toUpperCase() === OBJECT_TAG) {
	                        attribute = DATA_ATTRIBUTE;
	                        src = child.getAttribute(DATA_ATTRIBUTE);
	                        if (src) {
	                            src = resolvePath(src, base);
	                        }
	                    } else {
	                        attribute = SRC_ATTRIBUTE;
	                    }
	                    if (src) {
	                        if (src.startsWith(CID_PROTOCOL)) {
	                            id = `<${src.split(CID_PROTOCOL)[1]}>`;
	                            resource = frames[id];
	                        } else {
	                            id = src;
	                            resource = getResource(resources, src, child.getAttribute(attribute));
	                        }
	                        if (resource) {
	                            if (child.tagName && child.tagName.toUpperCase() === EMBED_TAG || child.tagName && child.tagName.toUpperCase() === OBJECT_TAG) {
	                                if (!fetchMissingResources) {
	                                    resource.used = true;
	                                    setAttribute(child, attribute, getResourceURI(resource));
	                                }
	                            } else {
	                                const result = convert$1({
	                                    resources: Object.assign({}, resources, { [id]: resource }),
	                                    unfoundResources,
	                                    frames: frames,
	                                    index: id,
	                                    id: resource.id
	                                }, { DOMParser, enableScripts, fetchMissingResources });
	                                if (fetchMissingResources) {
	                                    for (const missingResource of result) {
	                                        if (!missingResources.find(resource => resource.id === missingResource.id)) {
	                                            missingResources.push(missingResource);
	                                        }
	                                    }
	                                } else {
	                                    resource.used = true;
	                                    if (child.tagName && child.tagName.toUpperCase() === IFRAME_TAG) {
	                                        setAttribute(child, SRC_ATTRIBUTE);
	                                        child.removeAttribute(SRC_ATTRIBUTE);
	                                        child.setAttribute(SRCDOC_ATTRIBUTE, result.data);
	                                    } else {
	                                        setAttribute(child, attribute, DATA_PROTOCOL + TEXT_HTML_CONTENT_TYPE + DATA_URI_PAYLOAD_SEPARATOR + encodeURIComponent(result.data));
	                                    }
	                                }
	                            }
	                        } else if (fetchMissingResources) {
	                            addMissingResource(missingResources, src);
	                        } else {
	                            unfoundResources.add(src);
	                            setAttribute(child, attribute, src);
	                        }
	                    }
	                } else if ((child.tagName && child.tagName.toUpperCase() === A_TAG || child.tagName && child.tagName.toUpperCase() === AREA_TAG) && !fetchMissingResources) {
	                    if (href) {
	                        try {
	                            const url = new URL(child.getAttribute(HREF_ATTRIBUTE), base);
	                            const hash = url.hash;
	                            url.hash = EMPTY_STRING;
	                            if (url == base && hash) {
	                                child.setAttribute(HREF_ATTRIBUTE, hash);
	                            } else {
	                                child.setAttribute(HREF_ATTRIBUTE, href);
	                            }
	                            // eslint-disable-next-line no-unused-vars
	                        } catch (_) {
	                            child.setAttribute(HREF_ATTRIBUTE, href);
	                        }
	                    }
	                    child.removeAttribute(PING_ATTRIBUTE);
	                } else if (child.tagName && child.tagName.toUpperCase() === META_TAG$1 && !fetchMissingResources) {
	                    let httpEquiv = child.getAttribute(HTTP_EQUIV_ATTRIBUTE$1);
	                    if (httpEquiv) {
	                        httpEquiv = httpEquiv.toLowerCase();
	                        if (httpEquiv === HTTP_EQUIV_ATTRIBUTE_REFRESH || httpEquiv === HTTP_EQUIV_ATTRIBUTE_CSP) {
	                            removedNodes.push(child);
	                        }
	                    }
	                } else if (child.tagName && child.tagName.toUpperCase() === TEMPLATE_TAG && !fetchMissingResources) {
	                    const shadowModeAttribute = child.getAttribute(SHADOWMODE_ATTRIBUTE);
	                    if (shadowModeAttribute) {
	                        child.removeAttribute(SHADOWMODE_ATTRIBUTE);
	                        child.setAttribute(SHADOWROOTMODE_ATTRIBUTE, shadowModeAttribute);
	                    }
	                    if (child.content) {
	                        child.content.childNodes.forEach(node => nodes.push(node));
	                    }
	                } else if (child.tagName && child.tagName.toUpperCase() === TITLE_TAG && !fetchMissingResources && childNode.tagName && childNode.tagName.toUpperCase() === HEAD_TAG && title === undefined && child.textContent) {
	                    title = child.textContent;
	                }
	                nodes.push(child);
	            }
	        }
	    }
	    if (fetchMissingResources) {
	        return missingResources;
	    } else {
	        removedNodes.forEach(node => node.remove());
	        if (!canonicalLinkElement) {
	            const linkElement = document.createElement(LINK_TAG);
	            linkElement.setAttribute(REL_ATTRIBUTE, REL_ATTRIBUTE_CANONICAL);
	            linkElement.setAttribute(HREF_ATTRIBUTE, index);
	            document.head.appendChild(linkElement);
	        }
	        let metaElement = document.createElement(META_TAG$1);
	        metaElement.setAttribute(HTTP_EQUIV_ATTRIBUTE$1, HTTP_EQUIV_ATTRIBUTE_CSP);
	        let csp = DEFAULT_CSP;
	        if (enableScripts) {
	            csp += JS_ENABLED_CSP;
	        } else {
	            csp += JS_DISABLED_CSP;
	        }
	        metaElement.setAttribute(CONTENT_ATTRIBUTE$1, csp);
	        if (document.head.firstChild) {
	            document.head.prepend(metaElement);
	        } else {
	            document.head.appendChild(metaElement);
	        }
	        metaElement.setAttribute(CONTENT_ATTRIBUTE$1, csp);
	        metaElement = document.createElement(META_TAG$1);
	        metaElement.setAttribute(CHARSET_ATTRIBUTE$1, UTF8_CHARSET$1);
	        document.head.prepend(metaElement);
	        if (headers) {
	            const pageInfoElement = document.createElement(SCRIPT_TAG);
	            pageInfoElement.setAttribute(TYPE_ATTRIBUTE, JSON_LD_CONTENT_TYPE);
	            pageInfoElement.appendChild(document.createTextNode(JSON.stringify(getPageInfo(headers, index), null, 2)));
	            if (document.head.firstChild) {
	                document.head.firstChild.after(pageInfoElement);
	            } else {
	                document.head.appendChild(pageInfoElement);
	            }
	        }
	        if (unfoundResources.size) {
	            unfoundResources.forEach(id => {
	                if (!id.startsWith(DATA_PROTOCOL)) {
	                    resources[id] = { id, notFound: true, used: true };
	                }
	            });
	        }
	        return {
	            title,
	            favicons,
	            data: dom.serialize()
	        };
	    }
	}

	function setAttribute(element, attribute, newValue) {
	    const value = element.getAttribute(attribute);
	    if (value && !value.startsWith(DATA_PROTOCOL) && value !== newValue) {
	        element.setAttribute(ORIGINAL_URL_ATTRIBUTE_PREFIX + attribute, value);
	    }
	    if (newValue !== undefined) {
	        element.setAttribute(attribute, newValue);
	    }
	}

	function replaceStylesheetUrls(resources, base, resource, options = {}, stylesheets, missingResources, unfoundResources) {
	    let ast;
	    if (resource.id !== undefined) {
	        if (stylesheets[resource.id]) {
	            return stylesheets[resource.id].data;
	        } else {
	            stylesheets[resource.id] = {};
	        }
	    }
	    try {
	        ast = Zb(resource.data, options);
	        // eslint-disable-next-line no-unused-vars
	    } catch (_) {
	        // ignored
	    }
	    if (ast) {
	        rx(ast, node => {
	            if (node.type === URL_FUNCTION) {
	                const path = node.value;
	                if (!path.startsWith(DATA_PROTOCOL) && !path.startsWith(ORIGINAL_URL_FUNCTION_NAME)) {
	                    const id = resolvePath(path, base);
	                    const resource = getResource(resources, id, path);
	                    if (resource) {
	                        if (!missingResources) {
	                            resource.used = true;
	                            if (isStylesheet(resource.contentType)) {
	                                resource.data = replaceStylesheetUrls(resources, resource.id, resource, { context: STYLESHEET_CONTEXT }, stylesheets, missingResources, unfoundResources);
	                            }
	                            node.value = getOriginalUrlFunction(id, getResourceURI(resource));
	                        }
	                    } else if (missingResources) {
	                        addMissingResource(missingResources, id, BASE64_ENCODING$1);
	                    } else {
	                        unfoundResources.add(id);
	                        node.value = getOriginalUrlFunction(id);
	                    }
	                }
	            } else if (node.type === AT_RULE$1 && node.name.toLowerCase() === IMPORT_RULE) {
	                const path = node.prelude.children.first.value;
	                if (!path.startsWith(DATA_PROTOCOL) && !path.startsWith(ORIGINAL_URL_FUNCTION_NAME)) {
	                    const id = resolvePath(path, base);
	                    const resource = getResource(resources, id, path);
	                    if (resource) {
	                        resource.data = replaceStylesheetUrls(resources, resource.id, resource, { context: STYLESHEET_CONTEXT }, stylesheets, missingResources, unfoundResources);
	                        if (!missingResources) {
	                            resource.used = true;
	                            node.prelude.children.first.value = getOriginalUrlFunction(id, getResourceURI(resource));
	                        }
	                    } else if (missingResources) {
	                        addMissingResource(missingResources, id);
	                    } else {
	                        unfoundResources.add(id);
	                        node.prelude.children.first.value = getOriginalUrlFunction(id);
	                    }
	                }
	            }
	        });
	        try {
	            const result = Jb(ast);
	            if (resource.id !== undefined) {
	                stylesheets[resource.id].data = result;
	            }
	            return result.replace(ORIGINAL_URL_FUNCTION_REGEXP, ORIGINAL_URL_COMMENT);
	            // eslint-disable-next-line no-unused-vars
	        } catch (_) {
	            return resource.data;
	        }
	    } else {
	        return resource.data;
	    }
	}

	function getResource(resources, id, rawId) {
	    let resource = resources[id];
	    if (!resource) {
	        resource = resources[rawId];
	    }
	    return resource;
	}

	function addMissingResource(missingResources, id, transferEncoding) {
	    if ((id.startsWith(HTTP_PROTOCOL) || id.startsWith(HTTPS_PROTOCOL) || id.startsWith(URN_PROTOCOL)) && !missingResources.find(resource => resource.id === id)) {
	        missingResources.push({ id, transferEncoding });
	    }
	}

	function getOriginalUrlFunction(id, resourceURI = id) {
	    return ORIGINAL_URL_FUNCTION_NAME + CSS_FUNCTION_PARENTHESIS_START + JSON.stringify(id) + CSS_FUNCTION_PARENTHESIS_END + resourceURI;
	}

	function getPageInfo(headers, index) {
	    return {
	        ...JSON_LD_PAGE_INFO,
	        url: index,
	        name: decodeMimeHeader(headers[SUBJECT_HEADER]),
	        dateCreated: headers[DATE_HEADER],
	        additionalProperty: {
	            ...JSON_LD_PAGE_INFO.additionalProperty,
	            value: decodeMimeHeader(headers[FROM_HEADER])
	        }
	    };
	}

	const MHTML_HEADERS = 0;
	const MTHML_CONTENT = 1;
	const MHTML_DATA = 2;
	const MHTML_END = 3;
	const STRING_TYPE = "string";
	const HEADER_SEPARATOR = ":";
	const QUOTED_PRINTABLE_ENCODING = "quoted-printable";
	const BINARY_ENCODING = "binary";
	const CONTENT_TYPE_HEADER = "content-type";
	const CONTENT_TRANSFER_ENCODING_HEADER = "content-transfer-encoding";
	const CONTENT_ID_HEADER = "content-id";
	const CONTENT_LOCATION_HEADER = "content-location";
	const BASE64_ENCODING = "base64";
	const UTF8_CHARSET = "utf-8";
	const META_TAG = "META";
	const CONTENT_ATTRIBUTE = "content";
	const CHARSET_ATTRIBUTE = "charset";
	const HTTP_EQUIV_ATTRIBUTE = "http-equiv";
	const AT_RULE = "Atrule";
	const CHARSET_IDENTIFIER = "charset";
	const RANDOM_ID_PREFIX = "_";

	function parse$1(mhtml, { DOMParser } = { DOMParser: globalThis.DOMParser }, context = { resources: {}, frames: {} }) {
	    // deno-lint-ignore valid-typeof
	    if (typeof mhtml === STRING_TYPE) {
	        mhtml = encodeString(mhtml);
	    }
	    const headers = {};
	    const { resources, frames } = context;
	    let resource, transferEncoding, boundary, headerKey;
	    let content = {};
	    let state = MHTML_HEADERS;
	    let indexMhtml = 0;
	    let indexStartEmbeddedMhtml;
	    while (state !== MHTML_END && indexMhtml < mhtml.length - 1) {
	        let next;
	        if (state === MHTML_HEADERS) {
	            next = getLine();
	            if (!isLineFeed(next)) {
	                splitHeaders(next, headers);
	            } else {
	                if (headers[CONTENT_TYPE_HEADER]) {
	                    boundary = getBoundary(headers[CONTENT_TYPE_HEADER]);
	                }
	                if (boundary) {
	                    while (indexOf(next, boundary) === -1 && indexMhtml < mhtml.length - 1) {
	                        next = getLine();
	                    }
	                } else {
	                    const previousIndex = indexMhtml;
	                    next = getLine(transferEncoding);
	                    if (!boundary && startsWithBoundary(next)) {
	                        boundary = decodeString(next);
	                    } else {
	                        indexMhtml = previousIndex;
	                    }
	                }
	                content = {};
	                state = MTHML_CONTENT;
	            }
	        } else if (state === MTHML_CONTENT) {
	            if (boundary) {
	                if (indexStartEmbeddedMhtml === undefined) {
	                    indexStartEmbeddedMhtml = indexMhtml;
	                }
	                next = getLine();
	                if (!isLineFeed(next)) {
	                    splitHeaders(next, content);
	                } else {
	                    initResource(content);
	                    if (!resource.contentType || !isMultipartAlternative(resource.contentType)) {
	                        indexStartEmbeddedMhtml = undefined;
	                    }
	                    state = MHTML_DATA;
	                }
	            } else {
	                initResource(headers);
	                state = MHTML_DATA;
	            }
	        } else if (state === MHTML_DATA) {
	            const indexEndData = parseResourceData();
	            if (indexStartEmbeddedMhtml !== undefined && indexEndData !== undefined) {
	                resource.used = true;
	                context.index = convertEmbeddedMhtml(indexEndData);
	            } else {
	                processResource();
	            }
	            state = (indexMhtml >= mhtml.length - 1 ? MHTML_END : MTHML_CONTENT);
	        }
	    }
	    return { headers, frames, resources, index: context.index };

	    function getLine(transferEncoding) {
	        const indexStart = indexMhtml;
	        while (!isLineFeed([mhtml[indexMhtml]]) && indexMhtml++ < mhtml.length - 1);
	        indexMhtml++;
	        const line = mhtml.slice(indexStart, indexMhtml);
	        return transferEncoding === QUOTED_PRINTABLE_ENCODING ? decodeQuotedPrintable(line) : line;
	    }

	    function splitHeaders(line, obj) {
	        const lineString = decodeString(line);
	        const indexColumn = lineString.indexOf(HEADER_SEPARATOR);
	        if (indexColumn > -1) {
	            headerKey = lineString.substring(0, indexColumn).trim().toLowerCase();
	            obj[headerKey] = lineString.substring(indexColumn + 1, lineString.length).trim();
	        } else {
	            obj[headerKey] += lineString.trim();
	        }
	    }

	    function initResource(resourceData) {
	        transferEncoding = resourceData[CONTENT_TRANSFER_ENCODING_HEADER];
	        const contentType = resourceData[CONTENT_TYPE_HEADER];
	        const contentId = resourceData[CONTENT_ID_HEADER];
	        let id = resourceData[CONTENT_LOCATION_HEADER];
	        if (transferEncoding) {
	            transferEncoding = transferEncoding.toLowerCase();
	        }
	        resource = {
	            transferEncoding,
	            contentType,
	            data: [],
	            id
	        };
	        if (id === undefined) {
	            if (contentId !== undefined) {
	                id = contentId;
	            } else {
	                do {
	                    id = RANDOM_ID_PREFIX + Math.random().toString(36).substring(2);
	                } while (resources[id]);
	            }
	            resource.id = id;
	        }
	        if (context.index === undefined && isDocument(contentType)) {
	            context.index = id;
	        }
	        if (contentId !== undefined) {
	            frames[contentId] = resource;
	        }
	        if (!resources[id]) {
	            resources[id] = resource;
	        }
	        content = {};
	    }

	    function parseResourceData() {
	        let next = getLine(transferEncoding);
	        let indexEndData, boundaryFound;
	        while (!boundaryFound && indexMhtml < mhtml.length - 1) {
	            indexEndData = indexMhtml;
	            const indexBoundary = indexOf(next, boundary);
	            if (indexBoundary !== -1) {
	                indexEndData = indexEndData - next.length + indexBoundary - 2;
	                if (indexBoundary > 2) {
	                    next = next.slice(0, indexBoundary - 2);
	                } else {
	                    next = [];
	                }
	                boundaryFound = true;
	            }
	            if (resource.transferEncoding === QUOTED_PRINTABLE_ENCODING) {
	                if (resource.data.length > 2 && resource.data[resource.data.length - 3] === 0x3D && endsWithCRLF(next)) {
	                    resource.data.splice(resource.data.length - 3, 3);
	                } else if (resource.data.length > 1 && resource.data[resource.data.length - 2] === 0x3D && endsWithLF(next)) {
	                    resource.data.splice(resource.data.length - 2, 2);
	                }
	            } else if (resource.transferEncoding === BASE64_ENCODING) {
	                if (endsWithCRLF(next)) {
	                    next = next.slice(0, next.length - 2);
	                } else if (endsWithLF(next)) {
	                    next = next.slice(0, next.length - 1);
	                }
	            }
	            resource.data.splice(resource.data.length, 0, ...next);
	            if (!boundaryFound) {
	                next = getLine(transferEncoding);
	            }
	        }
	        if (!boundaryFound && boundary) {
	            indexEndData = indexMhtml;
	        }
	        return indexEndData;
	    }

	    function convertEmbeddedMhtml(indexEnd) {
	        const context = { resources, frames };
	        if (endsWithCRLF(mhtml)) {
	            indexEnd -= 2;
	        } else if (endsWithLF(mhtml)) {
	            indexEnd--;
	        }
	        parse$1(mhtml.slice(indexStartEmbeddedMhtml, indexEnd), { DOMParser }, context);
	        return context.index;
	    }

	    function processResource() {
	        resource.data = resource.rawData = new Uint8Array(resource.data);
	        const charset = resource.contentType ? getCharset(resource.contentType) : undefined;
	        if (resource.transferEncoding === BINARY_ENCODING && (!resource.contentType || !isText(resource.contentType))) {
	            resource.transferEncoding = BASE64_ENCODING;
	            resource.data = decodeBinary(resource.data);
	        } else {
	            resource.data = decodeString(resource.data, charset);
	        }
	        if (resource.contentType) {
	            resource.contentType = replaceCharset(resource.contentType, UTF8_CHARSET);
	            if (isStylesheet(resource.contentType)) {
	                processStylesheetCharset(charset);
	            } else if (isDocument(resource.contentType)) {
	                processDocumentCharset(charset);
	            }
	        }
	        delete resource.rawData;
	    }

	    function processStylesheetCharset(charset) {
	        try {
	            let ast = Zb(resource.data);
	            if (ast.children.first && ast.children.first.type === AT_RULE && ast.children.first.name.toLowerCase() === CHARSET_IDENTIFIER) {
	                const charsetNode = ast.children.first;
	                const cssCharset = charsetNode.prelude.children.first.value.toLowerCase();
	                if (cssCharset !== UTF8_CHARSET && cssCharset !== charset) {
	                    resource.data = decodeString(resource.rawData, cssCharset);
	                    ast = Zb(resource.data);
	                }
	                ast.children.remove(ast.children.head);
	                resource.data = Jb(ast);
	            }
	            // eslint-disable-next-line no-unused-vars
	        } catch (_) {
	            // ignored
	        }
	    }

	    function processDocumentCharset(charset) {
	        const contentType = resource.contentType.split(";")[0];
	        let dom = parseDOM(resource.data, contentType, DOMParser);
	        let charserMetaElement = getMetaCharsetElement(dom.document.documentElement);
	        if (charserMetaElement) {
	            let htmlCharset = charserMetaElement.getAttribute(CHARSET_ATTRIBUTE);
	            if (htmlCharset) {
	                htmlCharset = htmlCharset.toLowerCase();
	                if (htmlCharset !== UTF8_CHARSET && htmlCharset !== charset) {
	                    resource.data = decodeString(resource.rawData, charset);
	                    dom = parseDOM(resource.data, contentType, DOMParser);
	                    charserMetaElement = getMetaCharsetElement(dom.document.documentElement);
	                }
	            }
	            if (charserMetaElement) {
	                charserMetaElement.remove();
	            }
	            resource.data = dom.serialize();
	        }
	        let metaElement = getMetaContentTypeElement(dom.document);
	        if (metaElement) {
	            const contentType = metaElement.getAttribute(CONTENT_ATTRIBUTE);
	            const htmlCharset = getCharset(contentType);
	            if (htmlCharset && htmlCharset !== UTF8_CHARSET && htmlCharset !== charset) {
	                resource.data = decodeString(resource.rawData, htmlCharset);
	                dom = parseDOM(resource.data, contentType, DOMParser);
	                metaElement = getMetaContentTypeElement(dom.document.documentElement);
	            }
	            if (metaElement) {
	                metaElement.remove();
	            }
	            resource.data = dom.serialize();
	        }
	    }
	}

	function getMetaCharsetElement(document) {
	    const metaElements = document.getElementsByTagName(META_TAG);
	    return Array.from(metaElements).find(metaElement => metaElement.getAttribute(CHARSET_ATTRIBUTE));
	}

	function getMetaContentTypeElement(document) {
	    const metaElements = document.getElementsByTagName(META_TAG);
	    return Array.from(metaElements).find(metaElement => metaElement.getAttribute(HTTP_EQUIV_ATTRIBUTE)
	        && metaElement.getAttribute(HTTP_EQUIV_ATTRIBUTE).toLowerCase() === CONTENT_TYPE_HEADER.toLowerCase());
	}

	/// <reference types="./mod.d.ts" />


	function convert(mhtml, config = {}) {
	    if (config.DOMParser === undefined && globalThis.DOMParser) {
	        config.DOMParser = globalThis.DOMParser;
	    }
	    if ((typeof mhtml === "string") || mhtml instanceof Uint8Array) {
	        mhtml = parse(mhtml, config);
	    }
	    return fetchAndConvert(mhtml, config);
	}

	function parse(data, config = {}) {
	    if (config.DOMParser === undefined && globalThis.DOMParser) {
	        config.DOMParser = globalThis.DOMParser;
	    }
	    return parse$1(data, config);
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


	(globalThis => {

		const IS_NOT_SAFARI = !/Safari/.test(navigator.userAgent) || /Chrome/.test(navigator.userAgent) || /Vivaldi/.test(navigator.userAgent) || /OPR/.test(navigator.userAgent);

		const singlefile = globalThis.singlefile;

		const FORBIDDEN_TAG_NAMES = ["a", "area", "audio", "base", "br", "col", "command", "embed", "hr", "img", "iframe", "input", "keygen", "link", "meta", "param", "source", "track", "video", "wbr"];
		const BUTTON_ANCHOR_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgAgMAAAAOFJJnAAABhGlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV9TtaIVETuIOASsThZERRylikWwUNoKrTqYXPohNGlIUlwcBdeCgx+LVQcXZ10dXAVB8APEydFJ0UVK/F9SaBHjwXE/3t173L0DhFqJqWbbOKBqlpGMRcVMdkUMvKIbfQCG0SExU4+nFtLwHF/38PH1LsKzvM/9OXqUnMkAn0g8y3TDIl4nnt60dM77xCFWlBTic+Ixgy5I/Mh12eU3zgWHBZ4ZMtLJOeIQsVhoYbmFWdFQiaeIw4qqUb6QcVnhvMVZLVVY4578hcGctpziOs0hxLCIOBIQIaOCDZRgIUKrRoqJJO1HPfyDjj9BLplcG2DkmEcZKiTHD/4Hv7s185MTblIwCrS/2PbHCBDYBepV2/4+tu36CeB/Bq60pr9cA2Y+Sa82tfAR0LsNXFw3NXkPuNwBBp50yZAcyU9TyOeB9zP6pizQfwt0rbq9NfZx+gCkqaulG+DgEBgtUPaax7s7W3v790yjvx825XKP2aKCdAAAAAlwSFlzAAAuIwAALiMBeKU/dgAAAAd0SU1FB+QLEQA4M3Y7LzIAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAACVBMVEUAAAAAAACKioqjwG1pAAAAAXRSTlMAQObYZgAAAAFiS0dEAmYLfGQAAABkSURBVBjThc47CsNADIThWfD0bnSfbdIroP/+V0mhsN5gTNToK0YPaSvnF9B9wGykG54j/2GF1/hauE4E1AOuNxrBdA5KUXIqdiCnqC1zIZ2mFJQzKJ3wesOhcwDM4+fo7cOuD9C4HTQ9HAAQAAAAAElFTkSuQmCC";
		const BUTTON_CLOSE_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgAgMAAAAOFJJnAAABhGlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV9TtaIVETuIOASsThZERRylikWwUNoKrTqYXPohNGlIUlwcBdeCgx+LVQcXZ10dXAVB8APEydFJ0UVK/F9SaBHjwXE/3t173L0DhFqJqWbbOKBqlpGMRcVMdkUMvKIbfQCG0SExU4+nFtLwHF/38PH1LsKzvM/9OXqUnMkAn0g8y3TDIl4nnt60dM77xCFWlBTic+Ixgy5I/Mh12eU3zgWHBZ4ZMtLJOeIQsVhoYbmFWdFQiaeIw4qqUb6QcVnhvMVZLVVY4578hcGctpziOs0hxLCIOBIQIaOCDZRgIUKrRoqJJO1HPfyDjj9BLplcG2DkmEcZKiTHD/4Hv7s185MTblIwCrS/2PbHCBDYBepV2/4+tu36CeB/Bq60pr9cA2Y+Sa82tfAR0LsNXFw3NXkPuNwBBp50yZAcyU9TyOeB9zP6pizQfwt0rbq9NfZx+gCkqaulG+DgEBgtUPaax7s7W3v790yjvx825XKP2aKCdAAAAAlwSFlzAAAuIwAALiMBeKU/dgAAAAd0SU1FB+QLEQA6Na1u6IUAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAACVBMVEUAAAAAAACKioqjwG1pAAAAAXRSTlMAQObYZgAAAAFiS0dEAmYLfGQAAABlSURBVBhXTc/BEUQhCAPQ58ES6McSPED/rfwDI7vOMCoJIeGd6CvFgZXiwk47Ia5VUKdrVXcb39kfqxqmTg+I2xJ2tqhVTaGaQjTl7/GgIc/4CL4Vs3RsjLFndcxPnAn4iww8A3yQjRZjti1t6AAAAABJRU5ErkJggg==";
		const SHADOWROOT_ATTRIBUTE_NAME = "shadowrootmode";
		const SCRIPT_TEMPLATE_SHADOW_ROOT = "data-template-shadow-root";
		const SCRIPT_OPTIONS = "data-single-file-options";
		const NOTE_TAGNAME = "single-file-note";
		const NOTE_CLASS = "note";
		const NOTE_MASK_CLASS = "note-mask";
		const NOTE_HIDDEN_CLASS = "note-hidden";
		const NOTE_ANCHORED_CLASS = "note-anchored";
		const NOTE_SELECTED_CLASS = "note-selected";
		const NOTE_MOVING_CLASS = "note-moving";
		const NOTE_MASK_MOVING_CLASS = "note-mask-moving";
		const PAGE_MASK_CLASS = "page-mask";
		const MASK_CLASS = "single-file-mask";
		const PAGE_MASK_CONTAINER_CLASS = "single-file-page-mask";
		const HIGHLIGHT_CLASS = "single-file-highlight";
		const HIGHLIGHTS_STYLESHEET_CLASS = "single-file-highlights-stylesheet";
		const REMOVED_CONTENT_CLASS = "single-file-removed";
		const HIGHLIGHT_HIDDEN_CLASS = "single-file-highlight-hidden";
		const PAGE_MASK_ACTIVE_CLASS = "page-mask-active";
		const CUT_HOVER_CLASS = "single-file-cut-hover";
		const CUT_OUTER_HOVER_CLASS = "single-file-cut-outer-hover";
		const CUT_SELECTED_CLASS = "single-file-cut-selected";
		const CUT_OUTER_SELECTED_CLASS = "single-file-cut-outer-selected";
		const CUT_MODE_CLASS = "single-file-cut-mode";
		const NOTE_INITIAL_POSITION_X = 20;
		const NOTE_INITIAL_POSITION_Y = 20;
		const NOTE_INITIAL_WIDTH = 150;
		const NOTE_INITIAL_HEIGHT = 150;
		const NOTE_HEADER_HEIGHT = 25;
		const DISABLED_NOSCRIPT_ATTRIBUTE_NAME = "data-single-file-disabled-noscript";
		const COMMENT_HEADER = "Page saved with SingleFile";
		const COMMENT_HEADER_LEGACY = "Archive processed by SingleFile";

		let NOTES_WEB_STYLESHEET, MASK_WEB_STYLESHEET, HIGHLIGHTS_WEB_STYLESHEET;
		let selectedNote, anchorElement, maskNoteElement, maskPageElement, highlightSelectionMode, removeHighlightMode, resizingNoteMode, movingNoteMode, highlightColor, collapseNoteTimeout, cuttingOuterMode, cuttingMode, cuttingTouchTarget, cuttingPath, cuttingPathIndex, previousContent;
		let removedElements = [], removedElementIndex = 0, pageResources, pageUrl, pageCompressContent, includeInfobar, openInfobar, infobarPositionAbsolute, infobarPositionTop, infobarPositionBottom, infobarPositionLeft, infobarPositionRight;

		globalThis.zip = singlefile.helper.zip;
		initEventListeners();
		new MutationObserver(initEventListeners).observe(document, { childList: true });

		function initEventListeners() {
			window.onmessage = async event => {
				const message = JSON.parse(event.data);
				if (message.method == "init") {
					await init(message);
				}
				if (message.method == "addNote") {
					addNote(message);
				}
				if (message.method == "displayNotes") {
					document.querySelectorAll(NOTE_TAGNAME).forEach(noteElement => noteElement.shadowRoot.querySelector("." + NOTE_CLASS).classList.remove(NOTE_HIDDEN_CLASS));
				}
				if (message.method == "hideNotes") {
					document.querySelectorAll(NOTE_TAGNAME).forEach(noteElement => noteElement.shadowRoot.querySelector("." + NOTE_CLASS).classList.add(NOTE_HIDDEN_CLASS));
				}
				if (message.method == "enableHighlight") {
					if (highlightColor) {
						document.documentElement.classList.remove(highlightColor + "-mode");
					}
					highlightColor = message.color;
					highlightSelectionMode = true;
					document.documentElement.classList.add(message.color + "-mode");
				}
				if (message.method == "disableHighlight") {
					disableHighlight();
					highlightSelectionMode = false;
				}
				if (message.method == "displayHighlights") {
					document.querySelectorAll("." + HIGHLIGHT_CLASS).forEach(noteElement => noteElement.classList.remove(HIGHLIGHT_HIDDEN_CLASS));
				}
				if (message.method == "hideHighlights") {
					document.querySelectorAll("." + HIGHLIGHT_CLASS).forEach(noteElement => noteElement.classList.add(HIGHLIGHT_HIDDEN_CLASS));
				}
				if (message.method == "enableRemoveHighlights") {
					removeHighlightMode = true;
					document.documentElement.classList.add("single-file-remove-highlights-mode");
				}
				if (message.method == "disableRemoveHighlights") {
					removeHighlightMode = false;
					document.documentElement.classList.remove("single-file-remove-highlights-mode");
				}
				if (message.method == "enableEditPage") {
					document.body.contentEditable = true;
					onUpdate(false);
				}
				if (message.method == "formatPage") {
					formatPage(!message.applySystemTheme, message.contentWidth);
				}
				if (message.method == "cancelFormatPage") {
					cancelFormatPage();
				}
				if (message.method == "disableEditPage") {
					document.body.contentEditable = false;
				}
				if (message.method == "enableCutInnerPage") {
					cuttingMode = true;
					document.documentElement.classList.add(CUT_MODE_CLASS);
				}
				if (message.method == "enableCutOuterPage") {
					cuttingOuterMode = true;
					document.documentElement.classList.add(CUT_MODE_CLASS);
				}
				if (message.method == "disableCutInnerPage" || message.method == "disableCutOuterPage") {
					if (message.method == "disableCutInnerPage") {
						cuttingMode = false;
					} else {
						cuttingOuterMode = false;
					}
					document.documentElement.classList.remove(CUT_MODE_CLASS);
					resetSelectedElements();
					if (cuttingPath) {
						unhighlightCutElement();
						cuttingPath = null;
					}
				}
				if (message.method == "undoCutPage") {
					undoCutPage();
				}
				if (message.method == "undoAllCutPage") {
					while (removedElementIndex) {
						removedElements[removedElementIndex - 1].forEach(element => element.classList.remove(REMOVED_CONTENT_CLASS));
						removedElementIndex--;
					}
				}
				if (message.method == "redoCutPage") {
					redoCutPage();
				}
				if (message.method == "getContent") {
					onUpdate(true);
					includeInfobar = message.includeInfobar;
					openInfobar = message.openInfobar;
					infobarPositionAbsolute = message.infobarPositionAbsolute;
					infobarPositionTop = message.infobarPositionTop;
					infobarPositionBottom = message.infobarPositionBottom;
					infobarPositionLeft = message.infobarPositionLeft;
					infobarPositionRight = message.infobarPositionRight;
					let content = getContent(message.compressHTML);
					let filename;
					const pageOptions = loadOptionsFromPage(document);
					if (pageOptions) {
						pageOptions.backgroundSave = message.backgroundSave;
						pageOptions.saveDate = new Date(pageOptions.saveDate);
						pageOptions.visitDate = new Date(pageOptions.visitDate);
						filename = await singlefile.helper.formatFilename(content, document, pageOptions);
					}
					if (message.sharePage) {
						setLabels(message.labels);
					}
					if (pageCompressContent) {
						const viewport = document.head.querySelector("meta[name=viewport]");
						window.parent.postMessage(JSON.stringify({
							method: "setContent",
							content,
							filename,
							title: document.title,
							doctype: singlefile.helper.getDoctypeString(document),
							url: pageUrl,
							viewport: viewport ? viewport.content : null,
							compressContent: true,
							foregroundSave: message.foregroundSave,
							sharePage: message.sharePage,
							documentHeight: document.documentElement.offsetHeight
						}), "*");
					} else {
						if (message.foregroundSave || message.sharePage) {
							try {
								await downloadPageForeground({
									content,
									filename: filename || message.filename,
									mimeType: "text/html"
								}, { sharePage: message.sharePage });
							} catch (error) {
								console.log(error); // eslint-disable-line no-console
								window.parent.postMessage(JSON.stringify({ method: "onError", error: error.message }), "*");
							}
						} else {
							window.parent.postMessage(JSON.stringify({
								method: "setContent",
								content,
								filename,
								title: document.title,
								url: pageUrl
							}), "*");
						}
					}
				}
				if (message.method == "printPage") {
					printPage();
				}
				if (message.method == "importMht") {
					let { content, filename } = message;
					const { data } = await convert(content, { DOMParser: globalThis.DOMParser });
					content = data;
					await init({ content }, { filename, reset: true, isMHTML: true });
				}
				if (message.method == "displayInfobar") {
					singlefile.helper.displayIcon(document, true, {
						openInfobar: message.openInfobar,
						infobarPositionAbsolute: message.infobarPositionAbsolute,
						infobarPositionTop: message.infobarPositionTop,
						infobarPositionBottom: message.infobarPositionBottom,
						infobarPositionLeft: message.infobarPositionLeft,
						infobarPositionRight: message.infobarPositionRight
					});
					const infobarDoc = document.implementation.createHTMLDocument();
					infobarDoc.body.appendChild(document.querySelector(singlefile.helper.INFOBAR_TAGNAME));
					serializeShadowRoots(infobarDoc.body);
					const content = singlefile.helper.serialize(infobarDoc, true);
					window.parent.postMessage(JSON.stringify({
						method: "displayInfobar",
						content
					}), "*");
				}
				if (message.method == "download") {
					try {
						await downloadPageForeground({
							content: message.content,
							filename: message.filename,
							mimeType: message.mimeType
						}, { sharePage: message.sharePage });
					} catch (error) {
						console.log(error); // eslint-disable-line no-console
						window.parent.postMessage(JSON.stringify({ method: "onError", error: error.message }), "*");
					}
				}
			};
			window.onresize = reflowNotes;
			document.ondragover = event => event.preventDefault();
			document.ondrop = async event => {
				if (event.dataTransfer.files && event.dataTransfer.files[0]) {
					const file = event.dataTransfer.files[0];
					event.preventDefault();
					let content = new TextDecoder().decode(await file.arrayBuffer());
					const compressContent = /<html[^>]* data-sfz[^>]*>/i.test(content);
					if (compressContent) {
						await init({ content: file, compressContent }, { filename: file.name });
					} else {
						const isMHTML = /\.mhtml?$|\.mht$/i.test(file.name);
						let filename = file.name || "Untitled.html";
						filename = filename.replace(/(\.mhtml|\.mht)$/i, ".html");
						if (!filename.endsWith(".html")) {
							filename += ".html";
						}
						if (isMHTML) {
							const { data } = await convert(content, { DOMParser: globalThis.DOMParser });
							content = data;
						}
						await init({ content }, { filename, isMHTML });
					}
				}
			};
		}

		async function init({ content, password, compressContent }, { filename, reset, isMHTML } = {}) {
			await initConstants();
			if (compressContent) {
				const zipOptions = {
					workerScripts: { inflate: ["/lib/single-file-z-worker.js"] }
				};
				try {
					const worker = new Worker(zipOptions.workerScripts.inflate[0]);
					worker.terminate();
					// eslint-disable-next-line no-unused-vars
				} catch (error) {
					delete zipOptions.workerScripts;
				}
				zipOptions.useWebWorkers = IS_NOT_SAFARI;
				const { docContent, origDocContent, resources, url } = await singlefile.helper.extract(content, {
					password,
					prompt,
					zipOptions
				});
				pageResources = resources;
				pageUrl = url;
				pageCompressContent = true;
				const contentDocument = (new DOMParser()).parseFromString(docContent, "text/html");
				if (detectSavedPage(contentDocument)) {
					const { saveUrl } = singlefile.helper.extractInfobarData(contentDocument);
					pageUrl = saveUrl;
					await singlefile.helper.display(document, docContent, { disableFramePointerEvents: true });
					singlefile.helper.fixInvalidNesting(document);
					const infobarElement = document.querySelector(singlefile.helper.INFOBAR_TAGNAME);
					if (infobarElement) {
						infobarElement.remove();
					}
					await initPage();
					let icon;
					const origContentDocument = (new DOMParser()).parseFromString(origDocContent, "text/html");
					const iconElement = origContentDocument.querySelector("link[rel*=icon]");
					if (iconElement) {
						const iconResource = resources.find(resource => resource.filename == iconElement.getAttribute("href"));
						if (iconResource && iconResource.content) {
							const reader = new FileReader();
							reader.readAsDataURL(await (await fetch(iconResource.content)).blob());
							icon = await new Promise((resolve, reject) => {
								reader.addEventListener("load", () => resolve(reader.result), false);
								reader.addEventListener("error", reject, false);
							});
						} else {
							icon = iconElement.href;
						}
					}
					window.parent.postMessage(JSON.stringify({
						method: "onInit",
						title: document.title,
						icon,
						filename,
						reset,
						formatPageEnabled: isProbablyReaderable(document)
					}), "*");
				}
			} else {
				const contentDocument = (new DOMParser()).parseFromString(content, "text/html");
				if (detectSavedPage(contentDocument) || isMHTML) {
					if (!isMHTML) {
						const { saveUrl } = singlefile.helper.extractInfobarData(contentDocument);
						pageUrl = saveUrl;
					}
					if (contentDocument.doctype) {
						if (document.doctype) {
							document.replaceChild(contentDocument.doctype, document.doctype);
						} else {
							document.insertBefore(contentDocument.doctype, document.documentElement);
						}
					} else if (document.doctype) {
						document.doctype.remove();
					}
					const infobarElement = contentDocument.querySelector(singlefile.helper.INFOBAR_TAGNAME);
					if (infobarElement) {
						infobarElement.remove();
					}
					contentDocument.querySelectorAll("noscript").forEach(element => {
						element.setAttribute(DISABLED_NOSCRIPT_ATTRIBUTE_NAME, element.innerHTML);
						element.textContent = "";
					});
					contentDocument.querySelectorAll("iframe").forEach(element => {
						const pointerEvents = "pointer-events";
						element.style.setProperty("-sf-" + pointerEvents, element.style.getPropertyValue(pointerEvents), element.style.getPropertyPriority(pointerEvents));
						element.style.setProperty(pointerEvents, "none", "important");
					});
					document.replaceChild(contentDocument.documentElement, document.documentElement);
					singlefile.helper.fixInvalidNesting(document);
					document.querySelectorAll("[data-single-file-note-refs]").forEach(noteRefElement => noteRefElement.dataset.singleFileNoteRefs = noteRefElement.dataset.singleFileNoteRefs.replace(/,/g, " "));
					deserializeShadowRoots(document);
					document.querySelectorAll(NOTE_TAGNAME).forEach(containerElement => attachNoteListeners(containerElement, true));
					insertHighlightStylesheet(document);
					maskPageElement = getMaskElement(PAGE_MASK_CLASS, PAGE_MASK_CONTAINER_CLASS);
					maskNoteElement = getMaskElement(NOTE_MASK_CLASS);
					document.documentElement.onmousedown = onMouseDown;
					document.documentElement.onmouseup = document.documentElement.ontouchend = onMouseUp;
					document.documentElement.onmouseover = onMouseOver;
					document.documentElement.onmouseout = onMouseOut;
					document.documentElement.onkeydown = onKeyDown;
					document.documentElement.ontouchstart = document.documentElement.ontouchmove = onTouchMove;
					window.onclick = event => event.preventDefault();
					const iconElement = document.querySelector("link[rel*=icon]");
					window.parent.postMessage(JSON.stringify({
						method: "onInit",
						title: document.title,
						icon: iconElement && iconElement.href,
						filename,
						reset,
						formatPageEnabled: isProbablyReaderable(document)
					}), "*");
				}
			}
		}

		function loadOptionsFromPage(doc) {
			const optionsElement = doc.body.querySelector("script[type=\"application/json\"][" + SCRIPT_OPTIONS + "]");
			if (optionsElement) {
				return JSON.parse(optionsElement.textContent);
			}
		}

		async function initPage() {
			document.querySelectorAll("iframe").forEach(element => {
				const pointerEvents = "pointer-events";
				element.style.setProperty("-sf-" + pointerEvents, element.style.getPropertyValue(pointerEvents), element.style.getPropertyPriority(pointerEvents));
				element.style.setProperty(pointerEvents, "none", "important");
			});
			document.querySelectorAll("[data-single-file-note-refs]").forEach(noteRefElement => noteRefElement.dataset.singleFileNoteRefs = noteRefElement.dataset.singleFileNoteRefs.replace(/,/g, " "));
			deserializeShadowRoots(document);
			reflowNotes();
			await waitResourcesLoad();
			reflowNotes();
			document.querySelectorAll(NOTE_TAGNAME).forEach(containerElement => attachNoteListeners(containerElement, true));
			insertHighlightStylesheet(document);
			maskPageElement = getMaskElement(PAGE_MASK_CLASS, PAGE_MASK_CONTAINER_CLASS);
			maskNoteElement = getMaskElement(NOTE_MASK_CLASS);
			document.documentElement.onmousedown = onMouseDown;
			document.documentElement.onmouseup = document.documentElement.ontouchend = onMouseUp;
			document.documentElement.onmouseover = onMouseOver;
			document.documentElement.onmouseout = onMouseOut;
			document.documentElement.onkeydown = onKeyDown;
			document.documentElement.ontouchstart = document.documentElement.ontouchmove = onTouchMove;
			window.onclick = event => event.preventDefault();
		}

		async function initConstants() {
			[NOTES_WEB_STYLESHEET, MASK_WEB_STYLESHEET, HIGHLIGHTS_WEB_STYLESHEET] = await Promise.all([
				minifyText(await ((await fetch("../pages/editor-note-web.css")).text())),
				minifyText(await ((await fetch("../pages/editor-mask-web.css")).text())),
				minifyText(await ((await fetch("../pages/editor-frame-web.css")).text()))
			]);
		}

		function addNote({ color }) {
			const containerElement = document.createElement(NOTE_TAGNAME);
			const noteElement = document.createElement("div");
			const headerElement = document.createElement("header");
			const blockquoteElement = document.createElement("blockquote");
			const mainElement = document.createElement("textarea");
			const resizeElement = document.createElement("div");
			const removeNoteElement = document.createElement("img");
			const anchorIconElement = document.createElement("img");
			const noteShadow = containerElement.attachShadow({ mode: "open" });
			headerElement.appendChild(anchorIconElement);
			headerElement.appendChild(removeNoteElement);
			blockquoteElement.appendChild(mainElement);
			noteElement.appendChild(headerElement);
			noteElement.appendChild(blockquoteElement);
			noteElement.appendChild(resizeElement);
			noteShadow.appendChild(getStyleElement(NOTES_WEB_STYLESHEET));
			noteShadow.appendChild(noteElement);
			const notesElements = Array.from(document.querySelectorAll(NOTE_TAGNAME));
			const noteId = Math.max.call(Math, 0, ...notesElements.map(noteElement => Number(noteElement.dataset.noteId))) + 1;
			blockquoteElement.cite = "https://www.w3.org/TR/annotation-model/#selector(type=CssSelector,value=[data-single-file-note-refs~=\"" + noteId + "\"])";
			noteElement.classList.add(NOTE_CLASS);
			noteElement.classList.add(NOTE_ANCHORED_CLASS);
			noteElement.classList.add(color);
			noteElement.dataset.color = color;
			mainElement.dir = "auto";
			const boundingRectDocument = document.documentElement.getBoundingClientRect();
			let positionX = NOTE_INITIAL_WIDTH + NOTE_INITIAL_POSITION_X - 1 - boundingRectDocument.x;
			let positionY = NOTE_INITIAL_HEIGHT + NOTE_INITIAL_POSITION_Y - 1 - boundingRectDocument.y;
			while (Array.from(document.elementsFromPoint(positionX - window.scrollX, positionY - window.scrollY)).find(element => element.tagName.toLowerCase() == NOTE_TAGNAME)) {
				positionX += NOTE_INITIAL_POSITION_X;
				positionY += NOTE_INITIAL_POSITION_Y;
			}
			noteElement.style.setProperty("left", (positionX - NOTE_INITIAL_WIDTH - 1) + "px");
			noteElement.style.setProperty("top", (positionY - NOTE_INITIAL_HEIGHT - 1) + "px");
			resizeElement.className = "note-resize";
			resizeElement.ondragstart = event => event.preventDefault();
			removeNoteElement.className = "note-remove";
			removeNoteElement.src = BUTTON_CLOSE_URL;
			removeNoteElement.ondragstart = event => event.preventDefault();
			anchorIconElement.className = "note-anchor";
			anchorIconElement.src = BUTTON_ANCHOR_URL;
			anchorIconElement.ondragstart = event => event.preventDefault();
			containerElement.dataset.noteId = noteId;
			addNoteRef(document.documentElement, noteId);
			attachNoteListeners(containerElement, true);
			document.documentElement.insertBefore(containerElement, maskPageElement.getRootNode().host);
			noteElement.classList.add(NOTE_SELECTED_CLASS);
			selectedNote = noteElement;
			onUpdate(false);
		}

		function attachNoteListeners(containerElement, editable = false) {
			const SELECT_PX_THRESHOLD = 4;
			const COLLAPSING_NOTE_DELAY = 750;
			const noteShadow = containerElement.shadowRoot;
			const noteElement = noteShadow.childNodes[1];
			const headerElement = noteShadow.querySelector("header");
			const mainElement = noteShadow.querySelector("textarea");
			const noteId = containerElement.dataset.noteId;
			const resizeElement = noteShadow.querySelector(".note-resize");
			const anchorIconElement = noteShadow.querySelector(".note-anchor");
			const removeNoteElement = noteShadow.querySelector(".note-remove");
			mainElement.readOnly = !editable;
			if (!editable) {
				anchorIconElement.style.setProperty("display", "none", "important");
			} else {
				anchorIconElement.style.removeProperty("display");
			}
			headerElement.ontouchstart = headerElement.onmousedown = event => {
				if (event.target == headerElement) {
					collapseNoteTimeout = setTimeout(() => {
						noteElement.classList.toggle("note-collapsed");
						hideMaskNote();
					}, COLLAPSING_NOTE_DELAY);
					event.preventDefault();
					const position = getPosition(event);
					const clientX = position.clientX;
					const clientY = position.clientY;
					const boundingRect = noteElement.getBoundingClientRect();
					const deltaX = clientX - boundingRect.left;
					const deltaY = clientY - boundingRect.top;
					maskPageElement.classList.add(PAGE_MASK_ACTIVE_CLASS);
					document.documentElement.style.setProperty("user-select", "none", "important");
					anchorElement = getAnchorElement(containerElement);
					displayMaskNote();
					selectNote(noteElement);
					moveNote(event, deltaX, deltaY);
					movingNoteMode = { event, deltaX, deltaY };
					document.documentElement.ontouchmove = document.documentElement.onmousemove = event => {
						clearTimeout(collapseNoteTimeout);
						if (!movingNoteMode) {
							movingNoteMode = { deltaX, deltaY };
						}
						movingNoteMode.event = event;
						moveNote(event, deltaX, deltaY);
					};
				}
			};
			resizeElement.ontouchstart = resizeElement.onmousedown = event => {
				event.preventDefault();
				resizingNoteMode = true;
				selectNote(noteElement);
				maskPageElement.classList.add(PAGE_MASK_ACTIVE_CLASS);
				document.documentElement.style.setProperty("user-select", "none", "important");
				document.documentElement.ontouchmove = document.documentElement.onmousemove = event => {
					event.preventDefault();
					const { clientX, clientY } = getPosition(event);
					const boundingRectNote = noteElement.getBoundingClientRect();
					noteElement.style.width = clientX - boundingRectNote.left + "px";
					noteElement.style.height = clientY - boundingRectNote.top + "px";
				};
			};
			anchorIconElement.ontouchend = anchorIconElement.onclick = event => {
				event.preventDefault();
				noteElement.classList.toggle(NOTE_ANCHORED_CLASS);
				if (!noteElement.classList.contains(NOTE_ANCHORED_CLASS)) {
					deleteNoteRef(containerElement, noteId);
					addNoteRef(document.documentElement, noteId);
				}
				onUpdate(false);
			};
			removeNoteElement.ontouchend = removeNoteElement.onclick = event => {
				event.preventDefault();
				deleteNoteRef(containerElement, noteId);
				containerElement.remove();
			};
			noteElement.onmousedown = () => {
				selectNote(noteElement);
			};

			function moveNote(event, deltaX, deltaY) {
				event.preventDefault();
				const { clientX, clientY } = getPosition(event);
				noteElement.classList.add(NOTE_MOVING_CLASS);
				if (editable) {
					if (noteElement.classList.contains(NOTE_ANCHORED_CLASS)) {
						deleteNoteRef(containerElement, noteId);
						anchorElement = getTarget(clientX, clientY) || document.documentElement;
						addNoteRef(anchorElement, noteId);
					} else {
						anchorElement = document.documentElement;
					}
				}
				document.documentElement.insertBefore(containerElement, maskPageElement.getRootNode().host);
				noteElement.style.setProperty("left", (clientX - deltaX) + "px");
				noteElement.style.setProperty("top", (clientY - deltaY) + "px");
				noteElement.style.setProperty("position", "fixed");
				displayMaskNote();
			}

			function displayMaskNote() {
				if (anchorElement == document.documentElement || anchorElement == document.documentElement) {
					hideMaskNote();
				} else {
					const boundingRectAnchor = anchorElement.getBoundingClientRect();
					maskNoteElement.classList.add(NOTE_MASK_MOVING_CLASS);
					if (selectedNote) {
						maskNoteElement.classList.add(selectedNote.dataset.color);
					}
					maskNoteElement.style.setProperty("top", (boundingRectAnchor.y - 3) + "px");
					maskNoteElement.style.setProperty("left", (boundingRectAnchor.x - 3) + "px");
					maskNoteElement.style.setProperty("width", (boundingRectAnchor.width + 3) + "px");
					maskNoteElement.style.setProperty("height", (boundingRectAnchor.height + 3) + "px");
				}
			}

			function hideMaskNote() {
				maskNoteElement.classList.remove(NOTE_MASK_MOVING_CLASS);
				if (selectedNote) {
					maskNoteElement.classList.remove(selectedNote.dataset.color);
				}
			}

			function selectNote(noteElement) {
				if (selectedNote) {
					selectedNote.classList.remove(NOTE_SELECTED_CLASS);
					maskNoteElement.classList.remove(selectedNote.dataset.color);
				}
				noteElement.classList.add(NOTE_SELECTED_CLASS);
				noteElement.classList.add(noteElement.dataset.color);
				selectedNote = noteElement;
			}

			function getTarget(clientX, clientY) {
				const targets = Array.from(document.elementsFromPoint(clientX, clientY)).filter(element => element.matches("html *:not(" + NOTE_TAGNAME + "):not(." + MASK_CLASS + ")"));
				if (!targets.includes(document.documentElement)) {
					targets.push(document.documentElement);
				}
				let newTarget, target = targets[0], boundingRect = target.getBoundingClientRect();
				newTarget = determineTargetElement("floor", target, clientX - boundingRect.left, getMatchedParents(target, "left"));
				if (newTarget == target) {
					newTarget = determineTargetElement("ceil", target, boundingRect.left + boundingRect.width - clientX, getMatchedParents(target, "right"));
				}
				if (newTarget == target) {
					newTarget = determineTargetElement("floor", target, clientY - boundingRect.top, getMatchedParents(target, "top"));
				}
				if (newTarget == target) {
					newTarget = determineTargetElement("ceil", target, boundingRect.top + boundingRect.height - clientY, getMatchedParents(target, "bottom"));
				}
				target = newTarget;
				while (boundingRect = target && target.getBoundingClientRect(), boundingRect && boundingRect.width <= SELECT_PX_THRESHOLD && boundingRect.height <= SELECT_PX_THRESHOLD) {
					target = target.parentElement;
				}
				return target;
			}

			function getMatchedParents(target, property) {
				let element = target, matchedParent, parents = [];
				do {
					const boundingRect = element.getBoundingClientRect();
					if (element.parentElement && !element.parentElement.tagName.toLowerCase() != NOTE_TAGNAME && !element.classList.contains(MASK_CLASS)) {
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
		}

		function onMouseDown(event) {
			if ((cuttingMode || cuttingOuterMode) && cuttingPath) {
				event.preventDefault();
			}
		}

		function onMouseUp(event) {
			if (highlightSelectionMode) {
				event.preventDefault();
				highlightSelection();
				onUpdate(false);
			}
			if (removeHighlightMode) {
				event.preventDefault();
				let element = event.target, done;
				while (element && !done) {
					if (element.classList.contains(HIGHLIGHT_CLASS)) {
						document.querySelectorAll("." + HIGHLIGHT_CLASS + "[data-singlefile-highlight-id=" + JSON.stringify(element.dataset.singlefileHighlightId) + "]").forEach(highlightedElement => {
							resetHighlightedElement(highlightedElement);
							onUpdate(false);
						});
						done = true;
					}
					element = element.parentElement;
				}
			}
			if (resizingNoteMode) {
				event.preventDefault();
				resizingNoteMode = false;
				document.documentElement.style.removeProperty("user-select");
				maskPageElement.classList.remove(PAGE_MASK_ACTIVE_CLASS);
				document.documentElement.ontouchmove = onTouchMove;
				document.documentElement.onmousemove = null;
				onUpdate(false);
			}
			if (movingNoteMode) {
				event.preventDefault();
				anchorNote(movingNoteMode.event || event, selectedNote, movingNoteMode.deltaX, movingNoteMode.deltaY);
				movingNoteMode = null;
				document.documentElement.ontouchmove = onTouchMove;
				document.documentElement.onmousemove = null;
				onUpdate(false);
			}
			if ((cuttingMode || cuttingOuterMode) && cuttingPath) {
				event.preventDefault();
				if (event.ctrlKey) {
					const element = cuttingPath[cuttingPathIndex];
					element.classList.toggle(cuttingMode ? CUT_SELECTED_CLASS : CUT_OUTER_SELECTED_CLASS);
				} else {
					validateCutElement(event.shiftKey);
				}
			}
			if (collapseNoteTimeout) {
				clearTimeout(collapseNoteTimeout);
				collapseNoteTimeout = null;
			}
		}

		function onMouseOver(event) {
			if (cuttingMode || cuttingOuterMode) {
				const target = event.target;
				if (target.classList) {
					let ancestorFound;
					document.querySelectorAll("." + (cuttingMode ? CUT_SELECTED_CLASS : CUT_OUTER_SELECTED_CLASS)).forEach(element => {
						if (element == target || isAncestor(element, target) || isAncestor(target, element)) {
							ancestorFound = element;
						}
					});
					if (ancestorFound) {
						cuttingPath = [ancestorFound];
					} else {
						cuttingPath = getParents(event.target);
					}
					cuttingPathIndex = 0;
					highlightCutElement();
				}
			}
		}

		function onMouseOut() {
			if (cuttingMode || cuttingOuterMode) {
				if (cuttingPath) {
					unhighlightCutElement();
					cuttingPath = null;
				}
			}
		}

		function onTouchMove(event) {
			if (cuttingMode || cuttingOuterMode) {
				event.preventDefault();
				const { clientX, clientY } = getPosition(event);
				const target = document.elementFromPoint(clientX, clientY);
				if (cuttingTouchTarget != target) {
					onMouseOut();
					if (target) {
						cuttingTouchTarget = target;
						onMouseOver({ target });
					}
				}
			}
		}

		function onKeyDown(event) {
			if (cuttingMode || cuttingOuterMode) {
				if (event.code == "Tab") {
					if (cuttingPath) {
						const delta = event.shiftKey ? -1 : 1;
						let element = cuttingPath[cuttingPathIndex];
						let nextElement = cuttingPath[cuttingPathIndex + delta];
						if (nextElement) {
							let pathIndex = cuttingPathIndex + delta;
							while (
								nextElement &&
								(
									(delta == 1 &&
										element.getBoundingClientRect().width >= nextElement.getBoundingClientRect().width &&
										element.getBoundingClientRect().height >= nextElement.getBoundingClientRect().height) ||
									(delta == -1 &&
										element.getBoundingClientRect().width <= nextElement.getBoundingClientRect().width &&
										element.getBoundingClientRect().height <= nextElement.getBoundingClientRect().height))) {
								pathIndex += delta;
								nextElement = cuttingPath[pathIndex];
							}
							if (nextElement && nextElement.classList && nextElement != document.body && nextElement != document.documentElement) {
								unhighlightCutElement();
								cuttingPathIndex = pathIndex;
								highlightCutElement();
							}
						}
					}
					event.preventDefault();
				}
				if (event.code == "Space") {
					if (cuttingPath) {
						if (event.ctrlKey) {
							const element = cuttingPath[cuttingPathIndex];
							element.classList.add(cuttingMode ? CUT_SELECTED_CLASS : CUT_OUTER_SELECTED_CLASS);
						} else {
							validateCutElement(event.shiftKey);
						}
						event.preventDefault();
					}
				}
				if (event.code == "Escape") {
					resetSelectedElements();
					event.preventDefault();
				}
				if (event.key.toLowerCase() == "z" && event.ctrlKey) {
					if (event.shiftKey) {
						redoCutPage();
					} else {
						undoCutPage();
					}
					event.preventDefault();
				}
			}
			if (event.key.toLowerCase() == "s" && event.ctrlKey) {
				window.parent.postMessage(JSON.stringify({ "method": "savePage" }), "*");
				event.preventDefault();
			}
			if (event.key.toLowerCase() == "p" && event.ctrlKey) {
				printPage();
				event.preventDefault();
			}
		}

		function printPage() {
			unhighlightCutElement();
			resetSelectedElements();
			window.print();
		}

		function highlightCutElement() {
			const element = cuttingPath[cuttingPathIndex];
			element.classList.add(cuttingMode ? CUT_HOVER_CLASS : CUT_OUTER_HOVER_CLASS);
		}

		function unhighlightCutElement() {
			if (cuttingPath) {
				const element = cuttingPath[cuttingPathIndex];
				element.classList.remove(CUT_HOVER_CLASS);
				element.classList.remove(CUT_OUTER_HOVER_CLASS);
			}
		}

		function disableHighlight(doc = document) {
			if (highlightColor) {
				doc.documentElement.classList.remove(highlightColor + "-mode");
			}
		}

		function undoCutPage() {
			if (removedElementIndex) {
				removedElements[removedElementIndex - 1].forEach(element => element.classList.remove(REMOVED_CONTENT_CLASS));
				removedElementIndex--;
			}
		}

		function redoCutPage() {
			if (removedElementIndex < removedElements.length) {
				removedElements[removedElementIndex].forEach(element => element.classList.add(REMOVED_CONTENT_CLASS));
				removedElementIndex++;
			}
		}

		function validateCutElement(invert) {
			const selectedElement = cuttingPath[cuttingPathIndex];
			if ((cuttingMode && !invert) || (cuttingOuterMode && invert)) {
				if (document.documentElement != selectedElement && selectedElement.tagName.toLowerCase() != NOTE_TAGNAME) {
					const elementsRemoved = [selectedElement].concat(...document.querySelectorAll("." + CUT_SELECTED_CLASS + ",." + CUT_SELECTED_CLASS + " *,." + CUT_HOVER_CLASS + " *"));
					resetSelectedElements();
					if (elementsRemoved.length) {
						elementsRemoved.forEach(element => {
							unhighlightCutElement();
							if (element.tagName.toLowerCase() == NOTE_TAGNAME) {
								resetAnchorNote(element);
							} else {
								element.classList.add(REMOVED_CONTENT_CLASS);
							}
						});
						removedElements[removedElementIndex] = elementsRemoved;
						removedElementIndex++;
						removedElements.length = removedElementIndex;
						onUpdate(false);
					}
				}
			} else {
				if (document.documentElement != selectedElement && selectedElement.tagName.toLowerCase() != NOTE_TAGNAME) {
					const elements = [];
					const searchSelector = "*:not(style):not(meta):not(." + REMOVED_CONTENT_CLASS + ")";
					const elementsKept = [selectedElement].concat(...document.querySelectorAll("." + CUT_OUTER_SELECTED_CLASS));
					document.body.querySelectorAll(searchSelector).forEach(element => {
						let removed = true;
						elementsKept.forEach(elementKept => removed = removed && (elementKept != element && !isAncestor(elementKept, element) && !isAncestor(element, elementKept)));
						if (removed) {
							if (element.tagName.toLowerCase() == NOTE_TAGNAME) {
								resetAnchorNote(element);
							} else {
								elements.push(element);
							}
						}
					});
					elementsKept.forEach(elementKept => {
						unhighlightCutElement();
						const elementKeptRect = elementKept.getBoundingClientRect();
						elementKept.querySelectorAll(searchSelector).forEach(descendant => {
							const descendantRect = descendant.getBoundingClientRect();
							if (descendantRect.width && descendantRect.height && (
								descendantRect.left + descendantRect.width < elementKeptRect.left ||
								descendantRect.right > elementKeptRect.right + elementKeptRect.width ||
								descendantRect.top + descendantRect.height < elementKeptRect.top ||
								descendantRect.bottom > elementKeptRect.bottom + elementKeptRect.height
							)) {
								elements.push(descendant);
							}
						});
					});
					resetSelectedElements();
					if (elements.length) {
						elements.forEach(element => element.classList.add(REMOVED_CONTENT_CLASS));
						removedElements[removedElementIndex] = elements;
						removedElementIndex++;
						removedElements.length = removedElementIndex;
						onUpdate(false);
					}
				}
			}
		}

		function resetSelectedElements(doc = document) {
			doc.querySelectorAll("." + CUT_OUTER_SELECTED_CLASS + ",." + CUT_SELECTED_CLASS).forEach(element => {
				element.classList.remove(CUT_OUTER_SELECTED_CLASS);
				element.classList.remove(CUT_SELECTED_CLASS);
			});
		}

		function anchorNote(event, noteElement, deltaX, deltaY) {
			event.preventDefault();
			const { clientX, clientY } = getPosition(event);
			document.documentElement.style.removeProperty("user-select");
			noteElement.classList.remove(NOTE_MOVING_CLASS);
			maskNoteElement.classList.remove(NOTE_MASK_MOVING_CLASS);
			maskPageElement.classList.remove(PAGE_MASK_ACTIVE_CLASS);
			maskNoteElement.classList.remove(noteElement.dataset.color);
			const headerElement = noteElement.querySelector("header");
			headerElement.ontouchmove = document.documentElement.onmousemove = null;
			let currentElement = anchorElement;
			let positionedElement;
			while (currentElement.parentElement && !positionedElement) {
				if (!FORBIDDEN_TAG_NAMES.includes(currentElement.tagName.toLowerCase())) {
					const currentElementStyle = getComputedStyle(currentElement);
					if (currentElementStyle.position != "static") {
						positionedElement = currentElement;
					}
				}
				currentElement = currentElement.parentElement;
			}
			if (!positionedElement) {
				positionedElement = document.documentElement;
			}
			const containerElement = noteElement.getRootNode().host;
			if (positionedElement == document.documentElement) {
				const firstMaskElement = document.querySelector("." + MASK_CLASS);
				firstMaskElement.parentElement.insertBefore(containerElement, firstMaskElement);
			} else {
				positionedElement.appendChild(containerElement);
			}
			const boundingRectPositionedElement = positionedElement.getBoundingClientRect();
			const stylePositionedElement = window.getComputedStyle(positionedElement);
			const borderX = parseInt(stylePositionedElement.getPropertyValue("border-left-width"));
			const borderY = parseInt(stylePositionedElement.getPropertyValue("border-top-width"));
			noteElement.style.setProperty("position", "absolute");
			noteElement.style.setProperty("left", (clientX - boundingRectPositionedElement.x - deltaX - borderX) + "px");
			noteElement.style.setProperty("top", (clientY - boundingRectPositionedElement.y - deltaY - borderY) + "px");
		}

		function resetAnchorNote(containerElement) {
			const noteId = containerElement.dataset.noteId;
			const noteElement = containerElement.shadowRoot.childNodes[1];
			noteElement.classList.remove(NOTE_ANCHORED_CLASS);
			deleteNoteRef(containerElement, noteId);
			addNoteRef(document.documentElement, noteId);
			document.documentElement.insertBefore(containerElement, maskPageElement.getRootNode().host);
		}

		function getPosition(event) {
			if (event.touches && event.touches.length) {
				const touch = event.touches[0];
				return touch;
			} else {
				return event;
			}
		}

		function highlightSelection() {
			let highlightId = 0;
			document.querySelectorAll("." + HIGHLIGHT_CLASS).forEach(highlightedElement => highlightId = Math.max(highlightId, highlightedElement.dataset.singlefileHighlightId));
			highlightId++;
			const selection = window.getSelection();
			const highlightedNodes = new Set();
			for (let indexRange = 0; indexRange < selection.rangeCount; indexRange++) {
				const range = selection.getRangeAt(indexRange);
				if (!range.collapsed) {
					if (range.commonAncestorContainer.nodeType == range.commonAncestorContainer.TEXT_NODE) {
						let contentText = range.startContainer.splitText(range.startOffset);
						contentText = contentText.splitText(range.endOffset);
						addHighLightedNode(contentText.previousSibling);
					} else {
						const treeWalker = document.createTreeWalker(range.commonAncestorContainer, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
						let highlightNodes;
						while (treeWalker.nextNode()) {
							if (highlightNodes && !treeWalker.currentNode.contains(range.endContainer)) {
								addHighLightedNode(treeWalker.currentNode);
							}
							if (treeWalker.currentNode == range.startContainer) {
								if (range.startContainer.nodeType == range.startContainer.TEXT_NODE) {
									const contentText = range.startContainer.splitText(range.startOffset);
									treeWalker.nextNode();
									addHighLightedNode(contentText);
								} else {
									addHighLightedNode(range.startContainer.childNodes[range.startOffset]);
								}
								highlightNodes = true;
							}
							if (treeWalker.currentNode == range.endContainer) {
								if (range.endContainer.nodeType == range.endContainer.TEXT_NODE) {
									const contentText = range.endContainer.splitText(range.endOffset);
									treeWalker.nextNode();
									addHighLightedNode(contentText.previousSibling);
								} else {
									addHighLightedNode(range.endContainer.childNodes[range.endOffset]);
								}
								highlightNodes = false;
							}
						}
						range.collapse();
					}
				}
			}
			highlightedNodes.forEach(node => highlightNode(node));

			function addHighLightedNode(node) {
				if (node && node.textContent.trim()) {
					if (node.nodeType == node.TEXT_NODE && node.parentElement.childNodes.length == 1 && node.parentElement.classList.contains(HIGHLIGHT_CLASS)) {
						highlightedNodes.add(node.parentElement);
					} else {
						highlightedNodes.add(node);
					}
				}
			}

			function highlightNode(node) {
				if (node.nodeType == node.ELEMENT_NODE) {
					resetHighlightedElement(node);
					node.classList.add(HIGHLIGHT_CLASS);
					node.classList.add(highlightColor);
					node.dataset.singlefileHighlightId = highlightId;
				} else if (node.parentElement) {
					highlightTextNode(node);
				}
			}

			function highlightTextNode(node) {
				const spanElement = document.createElement("span");
				spanElement.classList.add(HIGHLIGHT_CLASS);
				spanElement.classList.add(highlightColor);
				spanElement.textContent = node.textContent;
				spanElement.dataset.singlefileHighlightId = highlightId;
				node.parentNode.replaceChild(spanElement, node);
				return spanElement;
			}
		}

		function getParents(element) {
			const path = [];
			while (element) {
				path.push(element);
				element = element.parentElement;
			}
			return path;
		}

		function formatPage(applySystemTheme, contentWidth) {
			if (pageCompressContent) {
				serializeShadowRoots(document);
				previousContent = document.documentElement.cloneNode(true);
				deserializeShadowRoots(document);
			} else {
				previousContent = getContent(false);
			}
			const shadowRoots = {};
			const classesToPreserve = ["single-file-highlight", "single-file-highlight-yellow", "single-file-highlight-green", "single-file-highlight-pink", "single-file-highlight-blue"];
			document.querySelectorAll(NOTE_TAGNAME).forEach(containerElement => {
				shadowRoots[containerElement.dataset.noteId] = containerElement.shadowRoot;
				const className = "singlefile-note-id-" + containerElement.dataset.noteId;
				containerElement.classList.add(className);
				classesToPreserve.push(className);
			});
			const optionsElement = document.querySelector("script[type=\"application/json\"][" + SCRIPT_OPTIONS + "]");
			const article = new Readability(document, { classesToPreserve }).parse();
			const articleMetadata = Object.assign({}, article);
			delete articleMetadata.content;
			delete articleMetadata.textContent;
			for (const key in articleMetadata) {
				if (articleMetadata[key] == null) {
					delete articleMetadata[key];
				}
			}
			removedElements = [];
			removedElementIndex = 0;
			document.body.innerHTML = "";
			const domParser = new DOMParser();
			const doc = domParser.parseFromString(article.content, "text/html");
			const contentEditable = document.body.contentEditable;
			document.documentElement.replaceChild(doc.body, document.body);
			if (optionsElement) {
				document.body.appendChild(optionsElement);
			}
			document.querySelectorAll(NOTE_TAGNAME).forEach(containerElement => {
				const noteId = (Array.from(containerElement.classList).find(className => /singlefile-note-id-\d+/.test(className))).split("singlefile-note-id-")[1];
				containerElement.classList.remove("singlefile-note-id-" + noteId);
				containerElement.dataset.noteId = noteId;
				if (!containerElement.shadowRoot) {
					containerElement.attachShadow({ mode: "open" });
					containerElement.shadowRoot.appendChild(shadowRoots[noteId]);
				}
			});
			document.querySelectorAll(NOTE_TAGNAME).forEach(containerElement => shadowRoots[containerElement.dataset.noteId].childNodes.forEach(node => containerElement.shadowRoot.appendChild(node)));
			document.body.contentEditable = contentEditable;
			document.head.querySelectorAll("style").forEach(styleElement => styleElement.remove());
			const styleElement = document.createElement("style");
			styleElement.textContent = getStyleFormattedPage(contentWidth);
			document.head.appendChild(styleElement);
			document.body.classList.add("moz-reader-content");
			document.body.classList.add("content-width6");
			document.body.classList.add("reader-show-element");
			document.body.classList.add("sans-serif");
			document.body.classList.add("container");
			document.body.classList.add("line-height4");
			const prefersColorSchemeDark = matchMedia("(prefers-color-scheme: dark)");
			if (applySystemTheme && prefersColorSchemeDark && prefersColorSchemeDark.matches) {
				document.body.classList.add("dark");
			}
			document.body.style.setProperty("display", "block");
			document.body.style.setProperty("padding", "24px");
			const titleElement = document.createElement("h1");
			titleElement.classList.add("reader-title");
			titleElement.textContent = article.title;
			document.body.insertBefore(titleElement, document.body.firstChild);
			const existingMetaDataElement = document.querySelector("script[id=singlefile-readability-metadata]");
			if (existingMetaDataElement) {
				existingMetaDataElement.remove();
			}
			const metaDataElement = document.createElement("script");
			metaDataElement.type = "application/json";
			metaDataElement.id = "singlefile-readability-metadata";
			metaDataElement.textContent = JSON.stringify(articleMetadata, null, 2);
			document.head.appendChild(metaDataElement);
			document.querySelectorAll("a[href]").forEach(element => {
				const href = element.getAttribute("href").trim();
				if (href.startsWith(document.baseURI + "#")) {
					element.setAttribute("href", href.substring(document.baseURI.length));
				}
			});
			insertHighlightStylesheet(document);
			maskPageElement = getMaskElement(PAGE_MASK_CLASS, PAGE_MASK_CONTAINER_CLASS);
			maskNoteElement = getMaskElement(NOTE_MASK_CLASS);
			reflowNotes();
			onUpdate(false);
		}

		async function cancelFormatPage() {
			if (previousContent) {
				const contentEditable = document.body.contentEditable;
				if (pageCompressContent) {
					document.replaceChild(previousContent, document.documentElement);
					deserializeShadowRoots(document);
					await initPage();
				} else {
					await init({ content: previousContent }, { reset: true });
				}
				document.body.contentEditable = contentEditable;
				onUpdate(false);
				previousContent = null;
			}
		}

		function insertHighlightStylesheet(doc) {
			if (!doc.querySelector("." + HIGHLIGHTS_STYLESHEET_CLASS)) {
				const styleheetHighlights = getStyleElement(HIGHLIGHTS_WEB_STYLESHEET);
				styleheetHighlights.classList.add(HIGHLIGHTS_STYLESHEET_CLASS);
				doc.documentElement.appendChild(styleheetHighlights);
			}
		}

		function getContent(compressHTML) {
			unhighlightCutElement();
			serializeShadowRoots(document);
			singlefile.helper.markInvalidNesting(document);
			const doc = document.cloneNode(true);
			disableHighlight(doc);
			resetSelectedElements(doc);
			deserializeShadowRoots(doc);
			deserializeShadowRoots(document);
			doc.documentElement.classList.remove(CUT_MODE_CLASS);
			doc.querySelectorAll("[" + DISABLED_NOSCRIPT_ATTRIBUTE_NAME + "]").forEach(element => {
				element.textContent = element.getAttribute(DISABLED_NOSCRIPT_ATTRIBUTE_NAME);
				element.removeAttribute(DISABLED_NOSCRIPT_ATTRIBUTE_NAME);
			});
			doc.querySelectorAll("." + MASK_CLASS + ", " + singlefile.helper.INFOBAR_TAGNAME + ", ." + REMOVED_CONTENT_CLASS).forEach(element => element.remove());
			if (includeInfobar) {
				const options = singlefile.helper.extractInfobarData(doc);
				options.openInfobar = openInfobar;
				options.infobarPositionAbsolute = infobarPositionAbsolute;
				options.infobarPositionTop = infobarPositionTop;
				options.infobarPositionRight = infobarPositionRight;
				options.infobarPositionBottom = infobarPositionBottom;
				options.infobarPositionLeft = infobarPositionLeft;
				singlefile.helper.appendInfobar(doc, options);
			}
			doc.querySelectorAll("." + HIGHLIGHT_CLASS).forEach(noteElement => noteElement.classList.remove(HIGHLIGHT_HIDDEN_CLASS));
			doc.querySelectorAll(`template[${SHADOWROOT_ATTRIBUTE_NAME}]`).forEach(templateElement => {
				const noteElement = templateElement.querySelector("." + NOTE_CLASS);
				if (noteElement) {
					noteElement.classList.remove(NOTE_HIDDEN_CLASS);
				}
				const mainElement = templateElement.querySelector("textarea");
				if (mainElement) {
					mainElement.textContent = mainElement.value;
				}
			});
			doc.querySelectorAll("iframe").forEach(element => {
				const pointerEvents = "pointer-events";
				element.style.setProperty(pointerEvents, element.style.getPropertyValue("-sf-" + pointerEvents), element.style.getPropertyPriority("-sf-" + pointerEvents));
				element.style.removeProperty("-sf-" + pointerEvents);
			});
			doc.body.removeAttribute("contentEditable");
			if (pageCompressContent) {
				const pageFilename = pageResources
					.filter(resource => resource.filename.endsWith("index.html"))
					.sort((resourceLeft, resourceRight) => resourceLeft.filename.length - resourceRight.filename.length)[0].filename;
				const resources = pageResources.filter(resource => resource.parentResources.includes(pageFilename));
				doc.querySelectorAll("[src]").forEach(element => resources.forEach(resource => {
					if (element.src == resource.content) {
						element.src = resource.name;
					}
				}));
				let content = singlefile.helper.serialize(doc, compressHTML);
				resources.sort((resourceLeft, resourceRight) => resourceRight.content.length - resourceLeft.content.length);
				resources.forEach(resource => content = content.replaceAll(resource.content, resource.name));
				return content + "<script " + SCRIPT_TEMPLATE_SHADOW_ROOT + ">" + getEmbedScript() + "</script>";
			} else {
				return singlefile.helper.serialize(doc, compressHTML) + "<script " + SCRIPT_TEMPLATE_SHADOW_ROOT + ">" + getEmbedScript() + "</script>";
			}
		}

		function onUpdate(saved) {
			window.parent.postMessage(JSON.stringify({ "method": "onUpdate", saved }), "*");
		}

		function waitResourcesLoad() {
			return new Promise(resolve => {
				let counterMutations = 0;
				const done = () => {
					observer.disconnect();
					resolve();
				};
				let timeoutInit = setTimeout(done, 100);
				const observer = new MutationObserver(() => {
					if (counterMutations < 20) {
						counterMutations++;
						clearTimeout(timeoutInit);
						timeoutInit = setTimeout(done, 100);
					} else {
						done();
					}
				});
				observer.observe(document, { subtree: true, childList: true, attributes: true });
			});
		}

		function reflowNotes() {
			document.querySelectorAll(NOTE_TAGNAME).forEach(containerElement => {
				const noteElement = containerElement.shadowRoot.querySelector("." + NOTE_CLASS);
				const noteBoundingRect = noteElement.getBoundingClientRect();
				const anchorElement = getAnchorElement(containerElement);
				const anchorBoundingRect = anchorElement.getBoundingClientRect();
				const maxX = anchorBoundingRect.x + Math.max(0, anchorBoundingRect.width - noteBoundingRect.width);
				const minX = anchorBoundingRect.x;
				const maxY = anchorBoundingRect.y + Math.max(0, anchorBoundingRect.height - NOTE_HEADER_HEIGHT);
				const minY = anchorBoundingRect.y;
				let left = parseInt(noteElement.style.getPropertyValue("left"));
				let top = parseInt(noteElement.style.getPropertyValue("top"));
				if (noteBoundingRect.x > maxX) {
					left -= noteBoundingRect.x - maxX;
				}
				if (noteBoundingRect.x < minX) {
					left += minX - noteBoundingRect.x;
				}
				if (noteBoundingRect.y > maxY) {
					top -= noteBoundingRect.y - maxY;
				}
				if (noteBoundingRect.y < minY) {
					top += minY - noteBoundingRect.y;
				}
				noteElement.style.setProperty("position", "absolute");
				noteElement.style.setProperty("left", left + "px");
				noteElement.style.setProperty("top", top + "px");
			});
		}

		function resetHighlightedElement(element) {
			element.classList.remove(HIGHLIGHT_CLASS);
			element.classList.remove("single-file-highlight-yellow");
			element.classList.remove("single-file-highlight-pink");
			element.classList.remove("single-file-highlight-blue");
			element.classList.remove("single-file-highlight-green");
			delete element.dataset.singlefileHighlightId;
		}

		function serializeShadowRoots(node) {
			node.querySelectorAll("*").forEach(element => {
				const shadowRoot = getShadowRoot(element);
				if (shadowRoot) {
					serializeShadowRoots(shadowRoot);
					const templateElement = document.createElement("template");
					templateElement.setAttribute(SHADOWROOT_ATTRIBUTE_NAME, "open");
					Array.from(shadowRoot.childNodes).forEach(childNode => templateElement.appendChild(childNode));
					element.appendChild(templateElement);
				}
			});
		}

		function deserializeShadowRoots(node) {
			node.querySelectorAll(`template[${SHADOWROOT_ATTRIBUTE_NAME}]`).forEach(element => {
				if (element.parentElement) {
					let shadowRoot = getShadowRoot(element.parentElement);
					if (shadowRoot) {
						Array.from(element.childNodes).forEach(node => shadowRoot.appendChild(node));
						element.remove();
					} else {
						try {
							shadowRoot = element.parentElement.attachShadow({ mode: "open" });
							const contentDocument = (new DOMParser()).parseFromString(element.innerHTML, "text/html");
							Array.from(contentDocument.head.childNodes).forEach(node => shadowRoot.appendChild(node));
							Array.from(contentDocument.body.childNodes).forEach(node => shadowRoot.appendChild(node));
							// eslint-disable-next-line no-unused-vars
						} catch (error) {
							// ignored
						}
					}
					if (shadowRoot) {
						deserializeShadowRoots(shadowRoot);
					}
				}
			});
		}

		function getMaskElement(className, containerClassName) {
			let maskElement = document.documentElement.querySelector("." + className);
			if (!maskElement) {
				maskElement = document.createElement("div");
				const maskContainerElement = document.createElement("div");
				if (containerClassName) {
					maskContainerElement.classList.add(containerClassName);
				}
				maskContainerElement.classList.add(MASK_CLASS);
				const firstNote = document.querySelector(NOTE_TAGNAME);
				if (firstNote && firstNote.parentElement == document.documentElement) {
					document.documentElement.insertBefore(maskContainerElement, firstNote);
				} else {
					document.documentElement.appendChild(maskContainerElement);
				}
				maskElement.classList.add(className);
				const maskShadow = maskContainerElement.attachShadow({ mode: "open" });
				maskShadow.appendChild(getStyleElement(MASK_WEB_STYLESHEET));
				maskShadow.appendChild(maskElement);
				return maskElement;
			}
		}

		function getStyleFormattedPage(contentWidth) {
			return `
	/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/* Avoid adding ID selector rules in this style sheet, since they could
 * inadvertently match elements in the article content. */

:root {
  --grey-90-a10: rgba(12, 12, 13, 0.1);
  --grey-90-a20: rgba(12, 12, 13, 0.2);
  --grey-90-a30: rgba(12, 12, 13, 0.3);
  --grey-90-a80: rgba(12, 12, 13, 0.8);
  --grey-30: #d7d7db;
  --blue-40: #45a1ff;
  --blue-40-a30: rgba(69, 161, 255, 0.3);
  --blue-60: #0060df;
  --body-padding: 64px;
  --font-size: 12;
  --content-width: ${contentWidth}em;
  --line-height: 1.6em;
}

body {
  --main-background: #fff;
  --main-foreground: #333;
  --font-color: #000000;
  --primary-color: #0B83FF;
  --toolbar-border: var(--grey-90-a20);
  --toolbar-transparent-border: transparent;
  --toolbar-box-shadow: var(--grey-90-a10);
  --toolbar-button-background: transparent;
  --toolbar-button-background-hover: var(--grey-90-a10);
  --toolbar-button-foreground-hover: var(--font-color);
  --toolbar-button-background-active: var(--grey-90-a20);
  --toolbar-button-foreground-active: var(--primary-color);
  --toolbar-button-border: transparent;
  --toolbar-button-border-hover: transparent;
  --toolbar-button-border-active: transparent;
  --tooltip-background: var(--grey-90-a80);
  --tooltip-foreground: white;
  --tooltip-border: transparent;
  --popup-background: white;
  --popup-border: rgba(0, 0, 0, 0.12);
  --opaque-popup-border: #e0e0e0;
  --popup-line: var(--grey-30);
  --popup-shadow: rgba(49, 49, 49, 0.3);
  --popup-button-background: #edecf0;
  --popup-button-background-hover: hsla(0,0%,70%,.4);
  --popup-button-foreground-hover: var(--font-color);
  --popup-button-background-active: hsla(240,5%,5%,.15);
  --selected-background: var(--blue-40-a30);
  --selected-border: var(--blue-40);
  --font-value-border: var(--grey-30);
  --icon-fill: #3b3b3c;
  --icon-disabled-fill: #8080807F;
  --link-foreground: var(--blue-60);
  --link-selected-foreground: #333;
  --visited-link-foreground: #b5007f;
  /* light colours */
}

body.sepia {
  --main-background: #f4ecd8;
  --main-foreground: #5b4636;
  --toolbar-border: #5b4636;
}

body.dark {
  --main-background: rgb(28, 27, 34);
  --main-foreground: #eee;
  --font-color: #fff;
  --toolbar-border: #4a4a4b;
  --toolbar-box-shadow: black;
  --toolbar-button-background-hover: var(--grey-90-a30);
  --toolbar-button-background-active: var(--grey-90-a80);
  --tooltip-background: black;
  --tooltip-foreground: white;
  --popup-background: rgb(66,65,77);
  --opaque-popup-border: #434146;
  --popup-line: rgb(82, 82, 94);
  --popup-button-background: #5c5c61;
  --popup-button-background-active: hsla(0,0%,70%,.6);
  --selected-background: #3E6D9A;
  --font-value-border: #656468;
  --icon-fill: #fff;
  --icon-disabled-fill: #ffffff66;
  --link-foreground: #45a1ff;
  --link-selected-foreground: #fff;
  --visited-link-foreground: #e675fd;
  /* dark colours */
}

body.hcm {
  --main-background: Canvas;
  --main-foreground: CanvasText;
  --font-color: CanvasText;
  --primary-color: SelectedItem;
  --toolbar-border: CanvasText;
   /* We need a true transparent but in HCM this would compute to an actual color,
      so select the page's background color instead: */
  --toolbar-transparent-border: Canvas;
  --toolbar-box-shadow: Canvas;
  --toolbar-button-background: ButtonFace;
  --toolbar-button-background-hover: ButtonText;
  --toolbar-button-foreground-hover: ButtonFace;
  --toolbar-button-background-active: SelectedItem;
  --toolbar-button-foreground-active: SelectedItemText;
  --toolbar-button-border: ButtonText;
  --toolbar-button-border-hover: ButtonText;
  --toolbar-button-border-active: ButtonText;
  --tooltip-background: Canvas;
  --tooltip-foreground: CanvasText;
  --tooltip-border: CanvasText;
  --popup-background: Canvas;
  --popup-border: CanvasText;
  --opaque-popup-border: CanvasText;
  --popup-line: CanvasText;
  --popup-button-background: ButtonFace;
  --popup-button-background-hover: ButtonText;
  --popup-button-foreground-hover: ButtonFace;
  --popup-button-background-active: ButtonText;
  --selected-background: Canvas;
  --selected-border: SelectedItem;
  --font-value-border: CanvasText;
  --icon-fill: ButtonText;
  --icon-disabled-fill: GrayText;
  --link-foreground: LinkText;
  --link-selected-foreground: ActiveText;
  --visited-link-foreground: VisitedText;
}

body {
  margin: 0;
  padding: var(--body-padding);
  background-color: var(--main-background);
  color: var(--main-foreground);
}

body.loaded {
  transition: color 0.4s, background-color 0.4s;
}

body.dark *::-moz-selection {
  background-color: var(--selected-background);
}

a::-moz-selection {
  color: var(--link-selected-foreground);
}

body.sans-serif,
body.sans-serif .remove-button {
  font-family: Helvetica, Arial, sans-serif;
}

body.serif,
body.serif .remove-button {
  font-family: Georgia, "Times New Roman", serif;
}

/* Override some controls and content styles based on color scheme */

body.light > .container > .header > .domain {
  border-bottom-color: #333333 !important;
}

body.sepia > .container > .header > .domain {
  border-bottom-color: #5b4636 !important;
}

body.dark > .container > .header > .domain {
  border-bottom-color: #eeeeee !important;
}

body.light blockquote {
  border-inline-start: 2px solid #333333 !important;
}

body.sepia blockquote {
  border-inline-start: 2px solid #5b4636 !important;
}

body.dark blockquote {
  border-inline-start: 2px solid #eeeeee !important;
}

.light-button {
  color: #333333;
  background-color: #ffffff;
}

.dark-button {
  color: #eeeeee;
  background-color: #1c1b22;
}

.sepia-button {
  color: #5b4636;
  background-color: #f4ecd8;
}

.auto-button {
  text-align: center;
}

@media (prefers-color-scheme: dark) {
  .auto-button {
    background-color: #1c1b22;
    color: #eeeeee;
  }
}

@media not (prefers-color-scheme: dark) {
  .auto-button {
    background-color: #ffffff;
    color: #333333;
  }
}

/* Loading/error message */

.reader-message {
  margin-top: 40px;
  display: none;
  text-align: center;
  width: 100%;
  font-size: 0.9em;
}

/* Detector element to see if we're at the top of the doc or not. */
.top-anchor {
  position: absolute;
  top: 0;
  width: 0;
  height: 5px;
  pointer-events: none;
}

/* Header */

.header {
  text-align: start;
  display: none;
}

.domain {
  font-size: 0.9em;
  line-height: 1.48em;
  padding-bottom: 4px;
  font-family: Helvetica, Arial, sans-serif;
  text-decoration: none;
  border-bottom: 1px solid;
  color: var(--link-foreground);
}

.header > h1 {
  font-size: 1.6em;
  line-height: 1.25em;
  width: 100%;
  margin: 30px 0;
  padding: 0;
}

.header > .credits {
  font-size: 0.9em;
  line-height: 1.48em;
  margin: 0 0 10px;
  padding: 0;
  font-style: italic;
}

.header > .meta-data {
  font-size: 0.65em;
  margin: 0 0 15px;
}

.reader-estimated-time {
  text-align: match-parent;
}

/* Controls toolbar */

.toolbar-container {
  position: sticky;
  z-index: 2;
  top: 32px;
  height: 0; /* take up no space, so body is at the top. */

  /* As a stick container, we're positioned relative to the body. Move us to
   * the edge of the viewport using margins, and take the width of
   * the body padding into account for calculating our width.
   */
  margin-inline-start: calc(-1 * var(--body-padding));
  width: max(var(--body-padding), calc((100% - var(--content-width)) / 2 + var(--body-padding)));
  font-size: var(--font-size); /* Needed to ensure 'em' units match, is reset for .reader-controls */
}

.toolbar {
  padding-block: 16px;
  border: 1px solid var(--toolbar-border);
  border-radius: 6px;
  box-shadow: 0 2px 8px var(--toolbar-box-shadow);

  width: 32px; /* basic width, without padding/border */

  /* padding should be 16px, except if there's not enough space for that, in
   * which case use half the available space for padding (=25% on each side).
   * The 34px here is the width + borders. We use a variable because we need
   * to know this size for the margin calculation.
   */
  --inline-padding: min(16px, calc(25% - 0.25 * 34px));
  padding-inline: var(--inline-padding);

  /* Keep a maximum of 96px distance to the body, but center once the margin
   * gets too small. We need to set the start margin, however...
   * To center, we'd want 50% of the container, but we'd subtract half our
   * own width (16px) and half the border (1px) and the inline padding.
   * When the other margin would be 96px, we want 100% - 96px - the complete
   * width of the actual toolbar (34px + 2 * padding)
   */
  margin-inline-start: max(calc(50% - 17px - var(--inline-padding)), calc(100% - 96px - 34px - 2 * var(--inline-padding)));

  font-family: Helvetica, Arial, sans-serif;
  list-style: none;
  user-select: none;
}

@media (prefers-reduced-motion: no-preference) {
  .toolbar {
    transition-property: border-color, box-shadow;
    transition-duration: 250ms;
  }

  .toolbar .toolbar-button {
    transition-property: opacity;
    transition-duration: 250ms;
  }

  .toolbar-container.scrolled .toolbar:not(:hover, :focus-within) {
    border-color: var(--toolbar-transparent-border);
    box-shadow: 0 2px 8px transparent;
  }

  .toolbar-container.scrolled .toolbar:not(:hover, :focus-within) .toolbar-button {
    opacity: 0.6;
  }

  .toolbar-container.transition-location {
    transition-duration: 250ms;
    transition-property: width;
  }
}

.toolbar-container.overlaps .toolbar-button {
  opacity: 0.1;
}

.dropdown-open .toolbar {
  border-color: var(--toolbar-transparent-border);
  box-shadow: 0 2px 8px transparent;
}

.reader-controls {
  /* We use 'em's above this node to get it to the right size. However,
   * the UI inside the toolbar should use a fixed, smaller size. */
  font-size: 11px;
}

button {
  -moz-context-properties: fill;
  color: var(--font-color);
  fill: var(--icon-fill);
}

button:disabled {
  fill: var(--icon-disabled-fill);
}

.toolbar button::-moz-focus-inner {
  border: 0;
}

.toolbar-button {
  position: relative;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--toolbar-button-border);
  border-radius: 4px;
  margin: 4px 0;
  background-color: var(--toolbar-button-background);
  background-size: 16px 16px;
  background-position: center;
  background-repeat: no-repeat;
}

.toolbar-button:hover,
.toolbar-button:focus-visible {
  background-color: var(--toolbar-button-background-hover);
  border-color: var(--toolbar-button-border-hover);
  fill: var(--toolbar-button-foreground-hover);
}

.open .toolbar-button,
.toolbar-button:hover:active {
  background-color: var(--toolbar-button-background-active);
  border-color: var(--toolbar-button-border-active);
  color: var(--toolbar-button-foreground-active);
  fill: var(--toolbar-button-foreground-active);
}

.hover-label {
  position: absolute;
  top: 4px;
  inset-inline-start: 36px;
  line-height: 16px;
  white-space: pre; /* make sure we don't wrap */
  background-color: var(--tooltip-background);
  color: var(--tooltip-foreground);
  padding: 4px 8px;
  border: 1px solid var(--tooltip-border);
  border-radius: 2px;
  visibility: hidden;
  pointer-events: none;
  /* Put above .dropdown .dropdown-popup, which has z-index: 1000. */
  z-index: 1001;
}

/* Show the hover tooltip on non-dropdown buttons. */
.toolbar-button:not(.dropdown-toggle):hover > .hover-label,
.toolbar-button:not(.dropdown-toggle):focus-visible > .hover-label,
/* Show the hover tooltip for dropdown buttons unless its dropdown is open. */
:not(.open) > li > .dropdown-toggle:hover > .hover-label,
:not(.open) > li > .dropdown-toggle:focus-visible > .hover-label {
  visibility: visible;
}

.dropdown {
  text-align: center;
  list-style: none;
  margin: 0;
  padding: 0;
  position: relative;
}

.dropdown li {
  margin: 0;
  padding: 0;
}

/* Popup */

.dropdown .dropdown-popup {
  text-align: start;
  position: absolute;
  inset-inline-start: 40px;
  z-index: 1000;
  background-color: var(--popup-background);
  visibility: hidden;
  border-radius: 4px;
  border: 1px solid var(--popup-border);
  box-shadow: 0 0 10px 0 var(--popup-shadow);
  top: 0;
}

.open > .dropdown-popup {
  visibility: visible;
}

.dropdown-arrow {
  position: absolute;
  height: 24px;
  width: 16px;
  inset-inline-start: -16px;
  background-image: url("chrome://global/skin/reader/RM-Type-Controls-Arrow.svg");
  display: block;
  -moz-context-properties: fill, stroke;
  fill: var(--popup-background);
  stroke: var(--opaque-popup-border);
  pointer-events: none;
}

.dropdown-arrow:dir(rtl) {
  transform: scaleX(-1);
}

/* Align the style dropdown arrow (narrate does its own) */
.style-dropdown .dropdown-arrow {
  top: 7px;
}

/* Font style popup */

.radio-button {
  /* We visually hide these, but we keep them around so they can be focused
   * and changed by interacting with them via the label, or the keyboard, or
   * assistive technology.
   */
  opacity: 0;
  pointer-events: none;
  position: absolute;
}

.radiorow,
.buttonrow {
  display: flex;
  align-content: center;
  justify-content: center;
}

.content-width-value,
.font-size-value,
.line-height-value {
  box-sizing: border-box;
  width: 36px;
  height: 20px;
  line-height: 20px;
  display: flex;
  justify-content: center;
  align-content: center;
  margin: auto;
  border-radius: 10px;
  border: 1px solid var(--font-value-border);
  background-color: var(--popup-button-background);
}

.buttonrow > button {
  border: 0;
  height: 60px;
  width: 90px;
  background-color: transparent;
  background-repeat: no-repeat;
  background-position: center;
}

.buttonrow > button:enabled:hover,
.buttonrow > button:enabled:focus-visible {
  background-color: var(--popup-button-background-hover);
  color: var(--popup-button-foreground-hover);
  fill: var(--popup-button-foreground-hover);
}

.buttonrow > button:enabled:hover:active {
  background-color: var(--popup-button-background-active);
}

.radiorow:not(:last-child),
.buttonrow:not(:last-child) {
  border-bottom: 1px solid var(--popup-line);
}

body.hcm .buttonrow.line-height-buttons {
  /* On HCM the .color-scheme-buttons row is hidden, so remove the border from the row above it */
  border-bottom: none;
}

.radiorow > label {
  position: relative;
  box-sizing: border-box;
  border-radius: 2px;
  border: 2px solid var(--popup-border);
}

.radiorow > label[checked] {
  border-color: var(--selected-border);
}

/* For the hover style, we draw a line under the item by means of a
 * pseudo-element. Because these items are variable height, and
 * because their contents are variable height, position it absolutely,
 * and give it a width of 100% (the content width) + 4px for the 2 * 2px
 * border width.
 */
.radiorow > input[type=radio]:focus-visible + label::after,
.radiorow > label:hover::after {
  content: "";
  display: block;
  border-bottom: 2px solid var(--selected-border);
  width: calc(100% + 4px);
  position: absolute;
  /* to skip the 2 * 2px border + 2px spacing. */
  bottom: -6px;
  /* Match the start of the 2px border of the element: */
  inset-inline-start: -2px;
}

.font-type-buttons > label {
  height: 64px;
  width: 105px;
  /* Slightly more space between these items. */
  margin: 10px;
  /* Center the Sans-serif / Serif labels */
  text-align: center;
  background-size: 63px 39px;
  background-repeat: no-repeat;
  background-position: center 18px;
  background-color: var(--popup-button-background);
  fill: currentColor;
  -moz-context-properties: fill;
  /* This mostly matches baselines, but because of differences in font
   * baselines between serif and sans-serif, this isn't always enough. */
  line-height: 1;
  padding-top: 2px;
}

.font-type-buttons > label[checked] {
  background-color: var(--selected-background);
}

.sans-serif-button {
  font-family: Helvetica, Arial, sans-serif;
  background-image: url("chrome://global/skin/reader/RM-Sans-Serif.svg");
}

/* Tweak padding to match the baseline on mac */
:root[platform=macosx] .sans-serif-button {
  padding-top: 3px;
}

.serif-button {
  font-family: Georgia, "Times New Roman", serif;
  background-image: url("chrome://global/skin/reader/RM-Serif.svg");
}

body.hcm .color-scheme-buttons {
  /* Disallow selecting themes when HCM is on. */
  display: none;
}

.color-scheme-buttons > label {
  padding: 12px;
  height: 34px;
  font-size: 12px;
  /* Center the labels horizontally as well as vertically */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* We want 10px between items, but there's no margin collapsing in flexbox. */
  margin: 10px 5px;
}

.color-scheme-buttons > input:first-child + label {
  margin-inline-start: 10px;
}

.color-scheme-buttons > label:last-child {
  margin-inline-end: 10px;
}

/* Toolbar icons */

.close-button {
  background-image: url("chrome://global/skin/icons/close.svg");
}

.style-button {
  background-image: url("chrome://global/skin/reader/RM-Type-Controls-24x24.svg");
}

.minus-button {
  background-size: 18px 18px;
  background-image: url("chrome://global/skin/reader/RM-Minus-24x24.svg");
}

.plus-button {
  background-size: 18px 18px;
  background-image: url("chrome://global/skin/reader/RM-Plus-24x24.svg");
}

.content-width-minus-button {
  background-size: 42px 16px;
  background-image: url("chrome://global/skin/reader/RM-Content-Width-Minus-42x16.svg");
}

.content-width-plus-button {
  background-size: 44px 16px;
  background-image: url("chrome://global/skin/reader/RM-Content-Width-Plus-44x16.svg");
}

.line-height-minus-button {
  background-size: 34px 14px;
  background-image: url("chrome://global/skin/reader/RM-Line-Height-Minus-38x14.svg");
}

.line-height-plus-button {
  background-size: 34px 24px;
  background-image: url("chrome://global/skin/reader/RM-Line-Height-Plus-38x24.svg");
}

/* Mirror the line height buttons if the article is RTL. */
.reader-controls[articledir="rtl"] .line-height-minus-button,
.reader-controls[articledir="rtl"] .line-height-plus-button {
  transform: scaleX(-1);
}

@media print {
  .toolbar {
    display: none !important;
  }
}

/* Article content */

/* Note that any class names from the original article that we want to match on
 * must be added to CLASSES_TO_PRESERVE in ReaderMode.jsm, so that
 * Readability.js doesn't strip them out */

.container {
  margin: 0 auto;
  font-size: var(--font-size);
  max-width: var(--content-width);
  line-height: var(--line-height);
}

pre {
  font-family: inherit;
}

.moz-reader-content {
  display: none;
  font-size: 1em;
}

@media print {
  .moz-reader-content p,
  .moz-reader-content code,
  .moz-reader-content pre,
  .moz-reader-content blockquote,
  .moz-reader-content ul,
  .moz-reader-content ol,
  .moz-reader-content li,
  .moz-reader-content figure,
  .moz-reader-content .wp-caption {
    margin: 0 0 10px !important;
    padding: 0 !important;
  }
}

.moz-reader-content h1,
.moz-reader-content h2,
.moz-reader-content h3 {
  font-weight: bold;
}

.moz-reader-content h1 {
  font-size: 1.6em;
  line-height: 1.25em;
}

.moz-reader-content h2 {
  font-size: 1.2em;
  line-height: 1.51em;
}

.moz-reader-content h3 {
  font-size: 1em;
  line-height: 1.66em;
}

.moz-reader-content a:link {
  text-decoration: underline;
  font-weight: normal;
}

.moz-reader-content a:link,
.moz-reader-content a:link:hover,
.moz-reader-content a:link:active {
  color: var(--link-foreground);
}

.moz-reader-content a:visited {
  color: var(--visited-link-foreground);
}

.moz-reader-content * {
  max-width: 100%;
  height: auto;
}

.moz-reader-content p,
.moz-reader-content p,
.moz-reader-content code,
.moz-reader-content pre,
.moz-reader-content blockquote,
.moz-reader-content ul,
.moz-reader-content ol,
.moz-reader-content li,
.moz-reader-content figure,
.moz-reader-content .wp-caption {
  margin: -10px -10px 20px;
  padding: 10px;
  border-radius: 5px;
}

.moz-reader-content li {
  margin-bottom: 0;
}

.moz-reader-content li > ul,
.moz-reader-content li > ol {
  margin-bottom: -10px;
}

.moz-reader-content p > img:only-child,
.moz-reader-content p > a:only-child > img:only-child,
.moz-reader-content .wp-caption img,
.moz-reader-content figure img {
  display: block;
}

.moz-reader-content img[moz-reader-center] {
  margin-inline: auto;
}

.moz-reader-content .caption,
.moz-reader-content .wp-caption-text
.moz-reader-content figcaption {
  font-size: 0.9em;
  line-height: 1.48em;
  font-style: italic;
}

.moz-reader-content pre {
  white-space: pre-wrap;
}

.moz-reader-content blockquote {
  padding: 0;
  padding-inline-start: 16px;
}

.moz-reader-content ul,
.moz-reader-content ol {
  padding: 0;
}

.moz-reader-content ul {
  padding-inline-start: 30px;
  list-style: disc;
}

.moz-reader-content ol {
  padding-inline-start: 30px;
}

table,
th,
td {
  border: 1px solid currentColor;
  border-collapse: collapse;
  padding: 6px;
  vertical-align: top;
}

table {
  margin: 5px;
}

/* Visually hide (but don't display: none) screen reader elements */
.moz-reader-content .visually-hidden,
.moz-reader-content .visuallyhidden,
.moz-reader-content .sr-only {
  display: inline-block;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  border-width: 0;
}

/* Hide elements with common "hidden" class names */
.moz-reader-content .hidden,
.moz-reader-content .invisible {
  display: none;
}

/* Enforce wordpress and similar emoji/smileys aren't sized to be full-width,
 * see bug 1399616 for context. */
.moz-reader-content img.wp-smiley,
.moz-reader-content img.emoji {
  display: inline-block;
  border-width: 0;
  /* height: auto is implied from '.moz-reader-content *' rule. */
  width: 1em;
  margin: 0 .07em;
  padding: 0;
}

.reader-show-element {
  display: initial;
}

/* Provide extra spacing for images that may be aided with accompanying element such as <figcaption> */
.moz-reader-block-img:not(:last-child) {
  margin-block-end: 12px;
}

.moz-reader-wide-table {
  overflow-x: auto;
  display: block;
}

pre code {
  background-color: var(--main-background);
  border: 1px solid var(--font-color);
  display: block;
  overflow: auto;
}`;
		}

		function getEmbedScript() {
			return minifyText(`(() => {
			document.currentScript.remove();
			const processNode = node => {
				node.querySelectorAll("template[${SHADOWROOT_ATTRIBUTE_NAME}]").forEach(element=>{
					let shadowRoot = getShadowRoot(element.parentElement);
					if (!shadowRoot) {
						try {
							shadowRoot = element.parentElement.attachShadow({mode:element.getAttribute("${SHADOWROOT_ATTRIBUTE_NAME}")});
							shadowRoot.innerHTML = element.innerHTML;
							element.remove();
						} catch (error) {}						
						if (shadowRoot) {
							processNode(shadowRoot);
						}
					}					
				})
			};
			const FORBIDDEN_TAG_NAMES = ${JSON.stringify(FORBIDDEN_TAG_NAMES)};
			const NOTE_TAGNAME = ${JSON.stringify(NOTE_TAGNAME)};
			const NOTE_CLASS = ${JSON.stringify(NOTE_CLASS)};
			const NOTE_ANCHORED_CLASS = ${JSON.stringify(NOTE_ANCHORED_CLASS)};
			const NOTE_SELECTED_CLASS = ${JSON.stringify(NOTE_SELECTED_CLASS)};
			const NOTE_MOVING_CLASS = ${JSON.stringify(NOTE_MOVING_CLASS)};
			const NOTE_MASK_MOVING_CLASS = ${JSON.stringify(NOTE_MASK_MOVING_CLASS)};
			const MASK_CLASS = ${JSON.stringify(MASK_CLASS)};
			const HIGHLIGHT_CLASS = ${JSON.stringify(HIGHLIGHT_CLASS)};
			const NOTES_WEB_STYLESHEET = ${JSON.stringify(NOTES_WEB_STYLESHEET)};
			const MASK_WEB_STYLESHEET = ${JSON.stringify(MASK_WEB_STYLESHEET)};
			const NOTE_HEADER_HEIGHT = ${JSON.stringify(NOTE_HEADER_HEIGHT)};
			const PAGE_MASK_ACTIVE_CLASS = ${JSON.stringify(PAGE_MASK_ACTIVE_CLASS)};
			const REMOVED_CONTENT_CLASS = ${JSON.stringify(REMOVED_CONTENT_CLASS)};
			const NESTING_TRACK_ID_ATTRIBUTE_NAME = ${JSON.stringify(singlefile.helper.NESTING_TRACK_ID_ATTRIBUTE_NAME)};
			const reflowNotes = ${minifyText(reflowNotes.toString())};			
			const addNoteRef = ${minifyText(addNoteRef.toString())};
			const deleteNoteRef = ${minifyText(deleteNoteRef.toString())};
			const getNoteRefs = ${minifyText(getNoteRefs.toString())};
			const setNoteRefs = ${minifyText(setNoteRefs.toString())};
			const getAnchorElement = ${minifyText(getAnchorElement.toString())};
			const getMaskElement = ${minifyText(getMaskElement.toString())};
			const getStyleElement = ${minifyText(getStyleElement.toString())};
			const attachNoteListeners = ${minifyText(attachNoteListeners.toString())};
			const anchorNote = ${minifyText(anchorNote.toString())};
			const getPosition = ${minifyText(getPosition.toString())};
			const onMouseUp = ${minifyText(onMouseUp.toString())};
			const getShadowRoot = ${minifyText(getShadowRoot.toString())};
			const waitResourcesLoad = ${minifyText(waitResourcesLoad.toString())};
			const maskNoteElement = getMaskElement(${JSON.stringify(NOTE_MASK_CLASS)});
			const maskPageElement = getMaskElement(${JSON.stringify(PAGE_MASK_CLASS)}, ${JSON.stringify(PAGE_MASK_CONTAINER_CLASS)});
			let selectedNote, highlightSelectionMode, removeHighlightMode, resizingNoteMode, movingNoteMode, collapseNoteTimeout, cuttingMode, cuttingOuterMode;
			window.onresize = reflowNotes;
			window.onUpdate = () => {};
			document.documentElement.onmouseup = document.documentElement.ontouchend = onMouseUp;
			processNode(document);
			reflowNotes();
			document.querySelectorAll(${JSON.stringify(NOTE_TAGNAME)}).forEach(noteElement => attachNoteListeners(noteElement));
			if (document.documentElement.dataset && document.documentElement.dataset.sfz !== undefined) {
				waitResourcesLoad().then(reflowNotes);
			}
			const trackIds = {};
			document.querySelectorAll("[" + NESTING_TRACK_ID_ATTRIBUTE_NAME + "]").forEach(element => trackIds[element.getAttribute(NESTING_TRACK_ID_ATTRIBUTE_NAME)] = element);
			Object.keys(trackIds).forEach(id => {
				const element = trackIds[id];
				const idParts = id.split(".");
				if (idParts.length > 1) {
					const parentId = idParts.slice(0, -1).join(".");
					const expectedParent = trackIds[parentId];
					if (expectedParent && element.parentElement !== expectedParent) {
						expectedParent.appendChild(element);
					}
				}
			});
			document.querySelectorAll("[" + NESTING_TRACK_ID_ATTRIBUTE_NAME + "]").forEach(element => element.removeAttribute(NESTING_TRACK_ID_ATTRIBUTE_NAME));
		})()`);
		}

		function getStyleElement(stylesheet) {
			const linkElement = document.createElement("style");
			linkElement.textContent = stylesheet;
			return linkElement;
		}

		function getAnchorElement(containerElement) {
			return document.querySelector("[data-single-file-note-refs~=\"" + containerElement.dataset.noteId + "\"]") || document.documentElement;
		}

		function addNoteRef(anchorElement, noteId) {
			const noteRefs = getNoteRefs(anchorElement);
			noteRefs.push(noteId);
			setNoteRefs(anchorElement, noteRefs);
		}

		function deleteNoteRef(containerElement, noteId) {
			const anchorElement = getAnchorElement(containerElement);
			const noteRefs = getNoteRefs(anchorElement).filter(noteRefs => noteRefs != noteId);
			if (noteRefs.length) {
				setNoteRefs(anchorElement, noteRefs);
			} else {
				delete anchorElement.dataset.singleFileNoteRefs;
			}
		}

		function getNoteRefs(anchorElement) {
			return anchorElement.dataset.singleFileNoteRefs ? anchorElement.dataset.singleFileNoteRefs.split(" ") : [];
		}

		function setNoteRefs(anchorElement, noteRefs) {
			anchorElement.dataset.singleFileNoteRefs = noteRefs.join(" ");
		}

		function minifyText(text) {
			return text.replace(/[\n\t\s]+/g, " ");
		}

		function isAncestor(element, otherElement) {
			return otherElement.parentElement && (element == otherElement.parentElement || isAncestor(element, otherElement.parentElement));
		}

		function getShadowRoot(element) {
			const chrome = window.chrome;
			if (element.openOrClosedShadowRoot) {
				return element.openOrClosedShadowRoot;
			} else if (chrome && chrome.dom && chrome.dom.openOrClosedShadowRoot) {
				try {
					return chrome.dom.openOrClosedShadowRoot(element);
					/* eslint-disable-next-line no-unused-vars */
				} catch (error) {
					return element.shadowRoot;
				}
			} else {
				return element.shadowRoot;
			}
		}

		function detectSavedPage(document) {
			const firstDocumentChild = document.documentElement.firstChild;
			return firstDocumentChild.nodeType == Node.COMMENT_NODE &&
				(firstDocumentChild.textContent.includes(COMMENT_HEADER) || firstDocumentChild.textContent.includes(COMMENT_HEADER_LEGACY));
		}

	})(typeof globalThis == "object" ? globalThis : window);

})();
