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

/* global browser */

import * as config from "./config.js";
import { autoSaveIsEnabled } from "./autosave-util.js";
import * as editor from "./editor.js";
import * as requests from "./requests.js";
import * as ui from "./../../ui/bg/index.js";
import { injectScript } from "./../../index.js";

const ERROR_CONNECTION_ERROR_CHROMIUM = "Could not establish connection. Receiving end does not exist.";
const ERROR_CONNECTION_LOST_CHROMIUM = "The message port closed before a response was received.";
const ERROR_CONNECTION_LOST_GECKO = "Message manager disconnected";
const ERROR_EDITOR_PAGE_CHROMIUM = "Cannot access contents of url ";
const ERROR_CHANNEL_CLOSED_CHROMIUM = "A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received";
const INJECT_SCRIPTS_STEP = 1;
const EXECUTE_SCRIPTS_STEP = 2;
const TASK_PENDING_STATE = "pending";
const TASK_PROCESSING_STATE = "processing";

const extensionScriptFiles = [
	"lib/single-file-extension.js"
];

const tasks = [];
let currentTaskId = 0, maxParallelWorkers, processInForeground;
ui.init({ isSavingTab, saveTabs, saveUrls, cancelTab, openEditor, saveSelectedLinks, batchSaveUrls });

export {
	saveTabs,
	saveUrls,
	saveSelectedLinks,
	cancelTask,
	cancelAllTasks,
	getTasksInfo,
	getTaskInfo,
	setCancelCallback,
	onSaveEnd,
	onInit,
	onTabReplaced,
	cancelTab as onTabRemoved
};

async function saveSelectedLinks(tab) {
	const tabOptions = { extensionScriptFiles, tabId: tab.id, tabIndex: tab.index };
	const scriptsInjected = await injectScript(tab.id, tabOptions);
	if (scriptsInjected) {
		const response = await browser.tabs.sendMessage(tab.id, { method: "content.getSelectedLinks" });
		if (response.urls && response.urls.length) {
			const tab = await batchSaveUrls();
			const onTabUpdated = (tabId, changeInfo) => {
				if (changeInfo.status == "complete" && tabId == tab.id) {
					browser.tabs.onUpdated.removeListener(onTabUpdated);
					browser.tabs.sendMessage(tab.id, { method: "newUrls.addURLs", urls: response.urls });
				}
			};
			browser.tabs.onUpdated.addListener(onTabUpdated);
		}
	} else {
		ui.onForbiddenDomain(tab);
	}
}

async function batchSaveUrls() {
	return browser.tabs.create({ active: true, url: "/src/ui/pages/batch-save-urls.html" });
}

async function saveUrls(urls, options = {}) {
	await initMaxParallelWorkers();
	await Promise.all(urls.map(async url => {
		const tabOptions = await config.getOptions(url);
		Object.keys(options).forEach(key => tabOptions[key] = options[key]);
		tabOptions.autoClose = true;
		tabOptions.extensionScriptFiles = extensionScriptFiles;
		if (tabOptions.passReferrerOnError) {
			requests.enableReferrerOnError();
		}
		addTask({
			tab: { url },
			status: TASK_PENDING_STATE,
			options: tabOptions,
			method: "content.save"
		});
	}));
	runTasks();
}

async function saveTabs(tabs, options = {}) {
	await initMaxParallelWorkers();
	await Promise.all(tabs.map(async tab => {
		const tabId = tab.id;
		const tabOptions = await config.getOptions(tab.url);
		Object.keys(options).forEach(key => tabOptions[key] = options[key]);
		tabOptions.tabId = tabId;
		tabOptions.tabIndex = tab.index;
		tabOptions.extensionScriptFiles = extensionScriptFiles;
		if (tabOptions.passReferrerOnError) {
			requests.enableReferrerOnError();
		}
		const tabData = {
			id: tab.id,
			index: tab.index,
			url: tab.url,
			title: tab.title
		};
		if (options.autoSave) {
			if (autoSaveIsEnabled(tab)) {
				const taskInfo = addTask({
					status: TASK_PROCESSING_STATE,
					tab: tabData,
					options: tabOptions,
					method: "content.autosave"
				});
				runTask(taskInfo);
			}
		} else {
			ui.onStart(tabId, INJECT_SCRIPTS_STEP);
			const scriptsInjected = await injectScript(tabId, tabOptions);
			if (scriptsInjected || editor.isEditor(tab)) {
				ui.onStart(tabId, EXECUTE_SCRIPTS_STEP);
				addTask({
					status: TASK_PENDING_STATE,
					tab: tabData,
					options: tabOptions,
					method: "content.save"
				});
			} else {
				ui.onForbiddenDomain(tab);
			}
		}
	}));
	runTasks();
}

function addTask(info) {
	const taskInfo = {
		id: currentTaskId,
		status: info.status,
		tab: info.tab,
		options: info.options,
		method: info.method,
		done: function (runNextTasks = true) {
			const index = tasks.findIndex(taskInfo => taskInfo.id == this.id);
			if (index > -1) {
				tasks.splice(index, 1);
				if (runNextTasks) {
					runTasks();
				}
			}
		}
	};
	tasks.push(taskInfo);
	currentTaskId++;
	return taskInfo;
}

function openEditor(tab) {
	browser.tabs.sendMessage(tab.id, { method: "content.openEditor" });
}

async function initMaxParallelWorkers() {
	if (!maxParallelWorkers) {
		const configData = await config.get();
		processInForeground = configData.processInForeground;
		maxParallelWorkers = processInForeground ? 1 : configData.maxParallelWorkers;
	}
}

function runTasks() {
	const processingCount = tasks.filter(taskInfo => taskInfo.status == TASK_PROCESSING_STATE).length;
	for (let index = 0; index < Math.min(tasks.length - processingCount, (maxParallelWorkers - processingCount)); index++) {
		const taskInfo = tasks.find(taskInfo => taskInfo.status == TASK_PENDING_STATE);
		if (taskInfo) {
			runTask(taskInfo);
		}
	}
}

async function runTask(taskInfo) {
	const taskId = taskInfo.id;
	taskInfo.status = TASK_PROCESSING_STATE;
	if (!taskInfo.tab.id) {
		let scriptsInjected;
		try {
			const tab = await createTabAndWaitUntilComplete({ url: taskInfo.tab.url, active: false });
			taskInfo.tab.id = taskInfo.options.tabId = tab.id;
			taskInfo.tab.index = taskInfo.options.tabIndex = tab.index;
			ui.onStart(taskInfo.tab.id, INJECT_SCRIPTS_STEP);
			scriptsInjected = await injectScript(taskInfo.tab.id, taskInfo.options);
		} catch (tabId) {
			taskInfo.tab.id = tabId;
		}
		if (scriptsInjected) {
			ui.onStart(taskInfo.tab.id, EXECUTE_SCRIPTS_STEP);
		} else {
			taskInfo.done();
			return;
		}
	}
	taskInfo.options.taskId = taskId;
	try {
		if (processInForeground) {
			await browser.tabs.update(taskInfo.tab.id, { active: true });
		}
		await browser.tabs.sendMessage(taskInfo.tab.id, { method: taskInfo.method, options: taskInfo.options });
	} catch (error) {
		if (error && (!error.message || !isIgnoredError(error))) {
			console.log(error.message ? error.message : error); // eslint-disable-line no-console
			ui.onError(taskInfo.tab.id, error.message, error.link);
			taskInfo.done();
		}
	}
}

function isIgnoredError(error) {
	return error.message == ERROR_CONNECTION_LOST_CHROMIUM ||
		error.message == ERROR_CONNECTION_ERROR_CHROMIUM ||
		error.message == ERROR_CONNECTION_LOST_GECKO ||
		error.message == ERROR_CHANNEL_CLOSED_CHROMIUM ||
		error.message.startsWith(ERROR_EDITOR_PAGE_CHROMIUM + JSON.stringify(editor.EDITOR_URL));
}

function isSavingTab(tab) {
	return Boolean(tasks.find(taskInfo => taskInfo.tab.id == tab.id));
}

function onInit(tab) {
	cancelTab(tab.id, false);
}

function onTabReplaced(addedTabId, removedTabId) {
	tasks.forEach(taskInfo => {
		if (taskInfo.tab.id == removedTabId) {
			taskInfo.tab.id = addedTabId;
		}
	});
}

function onSaveEnd(taskId) {
	const taskInfo = tasks.find(taskInfo => taskInfo.id == taskId);
	if (taskInfo) {
		if (taskInfo.options.autoClose && !taskInfo.cancelled) {
			browser.tabs.remove(taskInfo.tab.id);
		}
		taskInfo.done();
	}
}

async function createTabAndWaitUntilComplete(createProperties) {
	const tab = await browser.tabs.create(createProperties);
	return new Promise((resolve, reject) => {
		browser.tabs.onUpdated.addListener(onTabUpdated);
		browser.tabs.onRemoved.addListener(onTabRemoved);
		function onTabUpdated(tabId, changeInfo) {
			if (tabId == tab.id && changeInfo.status == "complete") {
				resolve(tab);
				browser.tabs.onUpdated.removeListener(onTabUpdated);
				browser.tabs.onRemoved.removeListener(onTabRemoved);
			}
		}
		function onTabRemoved(tabId) {
			if (tabId == tab.id) {
				reject(tabId);
				browser.tabs.onRemoved.removeListener(onTabRemoved);
			}
		}
	});
}

function setCancelCallback(taskId, cancelCallback) {
	const taskInfo = tasks.find(taskInfo => taskInfo.id == taskId);
	if (taskInfo) {
		taskInfo.cancel = cancelCallback;
	}
}

function cancelTab(tabId, stopProcessing = true) {
	Array.from(tasks).filter(taskInfo =>
		taskInfo.tab.id == tabId &&
		!taskInfo.options.autoSave &&
		(stopProcessing || taskInfo.status != TASK_PROCESSING_STATE)
	).forEach(cancel);
}

function cancelTask(taskId) {
	cancel(tasks.find(taskInfo => taskInfo.id == taskId));
}

function cancelAllTasks() {
	Array.from(tasks).forEach(taskInfo => cancel(taskInfo, false));
}

function getTasksInfo() {
	return tasks.map(mapTaskInfo);
}

function getTaskInfo(taskId) {
	return tasks.find(taskInfo => taskInfo.id == taskId);
}

function cancel(taskInfo, runNextTasks) {
	const tabId = taskInfo.tab.id;
	taskInfo.cancelled = true;
	if (tabId) {
		browser.tabs.sendMessage(tabId, {
			method: "content.cancelSave",
			options: {
				loadDeferredImages: taskInfo.options.loadDeferredImages,
				loadDeferredImagesKeepZoomLevel: taskInfo.options.loadDeferredImagesKeepZoomLevel
			}
		}).catch(() => {
			// ignored
		});
		if (taskInfo.method == "content.autosave") {
			ui.onEnd(tabId, true);
		}
		ui.onCancelled(taskInfo.tab);
	}
	if (taskInfo.cancel) {
		taskInfo.cancel();
	}
	taskInfo.done(runNextTasks);
}

function mapTaskInfo(taskInfo) {
	return { id: taskInfo.id, tabId: taskInfo.tab.id, index: taskInfo.tab.index, url: taskInfo.tab.url, title: taskInfo.tab.title, cancelled: taskInfo.cancelled, status: taskInfo.status };
}
