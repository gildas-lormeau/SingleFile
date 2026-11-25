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

/* global indexedDB */

const DATABASE_NAME = "single-file-archive";
const PAGES_STORE_NAME = "pages";
const DATA_STORE_NAME = "data";
const STORE_NAMES = [PAGES_STORE_NAME, DATA_STORE_NAME];

let databasePromise;

export {
	add,
	getPages,
	getData,
	remove,
	clear,
	setTitle,
	setPositions
};

function add(page, data) {
	return runTransaction("readwrite", (stores, resolve) => {
		const request = stores[PAGES_STORE_NAME].add(page);
		request.onsuccess = () => {
			stores[DATA_STORE_NAME].put(data, request.result);
			resolve(request.result);
		};
	});
}

async function getPages() {
	const pages = await runTransaction("readonly", (stores, resolve) => {
		const pages = [];
		stores[PAGES_STORE_NAME].openCursor().onsuccess = event => {
			const cursor = event.target.result;
			if (cursor) {
				pages.push(Object.assign({}, cursor.value, { id: cursor.key }));
				cursor.continue();
			} else {
				resolve(pages);
			}
		};
	});
	return pages.sort((page, otherPage) => page.position - otherPage.position);
}

function getData(id) {
	return runTransaction("readonly", (stores, resolve) => {
		const request = stores[DATA_STORE_NAME].get(id);
		request.onsuccess = () => resolve(request.result);
	});
}

function remove(id) {
	return runTransaction("readwrite", stores => STORE_NAMES.forEach(storeName => stores[storeName].delete(id)));
}

function clear() {
	return runTransaction("readwrite", stores => STORE_NAMES.forEach(storeName => stores[storeName].clear()));
}

function setTitle(id, title) {
	return updatePage(id, page => page.title = title);
}

function setPositions(ids) {
	return runTransaction("readwrite", stores => ids.forEach((id, position) => update(stores[PAGES_STORE_NAME], id, page => page.position = position)));
}

function updatePage(id, callback) {
	return runTransaction("readwrite", stores => update(stores[PAGES_STORE_NAME], id, callback));
}

function update(store, id, callback) {
	const request = store.get(id);
	request.onsuccess = () => {
		const page = request.result;
		if (page) {
			callback(page);
			store.put(page, id);
		}
	};
}

async function runTransaction(mode, callback) {
	const database = await getDatabase();
	return new Promise((resolve, reject) => {
		const transaction = database.transaction(STORE_NAMES, mode);
		const stores = {};
		let result;
		STORE_NAMES.forEach(storeName => stores[storeName] = transaction.objectStore(storeName));
		transaction.oncomplete = () => resolve(result);
		transaction.onerror = transaction.onabort = () => reject(transaction.error);
		callback(stores, value => result = value);
	});
}

function getDatabase() {
	if (!databasePromise) {
		databasePromise = new Promise((resolve, reject) => {
			const request = indexedDB.open(DATABASE_NAME, 1);
			request.onupgradeneeded = () => {
				request.result.createObjectStore(PAGES_STORE_NAME, { autoIncrement: true });
				request.result.createObjectStore(DATA_STORE_NAME);
			};
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	}
	return databasePromise;
}
