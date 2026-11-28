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
import * as archiveStore from "./archive-store.js";
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
const AUTOSAVE_METHOD = "content.autosave";
const ARCHIVE_PASSWORD_ERROR = "Saving tabs in one archive is not supported with a password yet.";
const NO_TAB_GROUP_ERROR = "The tab is not in a tab group.";
const NO_GROUP_ID = -1;
const PDF_CONTENT_TYPE = "application/pdf";
const ARCHIVE_PRIVATE_TAB_ERROR = "The tabs of a private window cannot be added to the archive in progress.";
const ARCHIVE_POSITION_FACTOR = 1000;
const PAUSED_TASKS_STORAGE_KEY = "pausedTasks";
const NEW_TAB_URL_REGEXP = /^(about:(blank|newtab|home)|(chrome|edge):\/\/(newtab|new-tab-page))/;
const ARCHIVE_SAVE_OPTION_NAMES = [
	"backgroundSave",
	"confirmFilename",
	"openSavedPage",
	"saveToClipboard",
	"saveToGDrive",
	"saveToDropbox",
	"saveWithWebDAV",
	"saveWithMCP",
	"saveToGitHub",
	"saveWithCompanion",
	"saveToRestFormApi",
	"saveToS3",
	"sharePage",
	"addProof",
	"archiveDedupPages",
	"archiveTableOfContents",
	"archiveMarkUnarchivedLinks",
	"archivePageTransitions"
];
const ARCHIVE_PAGE_OPTIONS = {
	compressContent: true,
	backgroundSave: true,
	confirmFilename: false,
	openEditor: false,
	autoOpenEditor: false,
	openSavedPage: false,
	saveToClipboard: false,
	saveToGDrive: false,
	saveToDropbox: false,
	saveWithWebDAV: false,
	saveWithMCP: false,
	saveToGitHub: false,
	saveWithCompanion: false,
	saveToRestFormApi: false,
	saveToS3: false,
	sharePage: false,
	addProof: false,
	insertEmbeddedImage: false,
	insertEmbeddedScreenshotImage: false,
	autoClose: false,
	archiveTask: true
};

const extensionScriptFiles = [
	"lib/single-file-extension.js"
];

const tasks = [];
let currentTaskId = 1, maxParallelWorkers, processInForeground, onArchiveEnd, paused = false, endedTasksCount = 0, tasksStored = false, tasksStorePending = false;
const tasksRestored = restoreTasks();
ui.init({ isSavingTab, saveTabs, saveTabGroup, saveTabsInArchive, saveTabGroupInArchive, addTabsToArchive, addTabGroupToArchive, addUrlsToArchive, saveUrls, cancelTab, openEditor, saveSelectedLinks, batchSaveUrls });

export {
	saveTabs,
	saveTabGroup,
	saveTabsInArchive,
	saveTabGroupInArchive,
	addTabsToArchive,
	addTabGroupToArchive,
	addUrlsToArchive,
	addArchivePage,
	setArchiveEndCallback,
	captureTab,
	saveUrls,
	saveSelectedLinks,
	cancelTask,
	cancelAllTasks,
	pauseTasks,
	resumeTasks,
	getTasksInfo,
	getTaskInfo,
	setCancelCallback,
	onSaveStart,
	onSaveEnd,
	onInit,
	onTabRemoved,
	onTabReplaced,
	cancelTab as cancel
};

async function saveSelectedLinks(tab) {
	const tabOptions = { extensionScriptFiles, tabId: tab.id, tabIndex: tab.index };
	let scriptsInjected;
	try {
		scriptsInjected = await injectScript(tab.id, tabOptions);
		// eslint-disable-next-line no-unused-vars
	} catch (error) {
		// ignored
	}
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

async function saveUrls(urls, options = {}, profileName, archive) {
	await initMaxParallelWorkers();
	const skippedUrls = [];
	const pendingTasks = await Promise.all(urls.map(async url => {
		const tabOptions = profileName ? await config.getProfileOptions(profileName) : await config.getOptions(url);
		if (tabOptions.profileName == config.DISABLED_PROFILE_NAME) {
			skippedUrls.push(url);
		} else {
			Object.keys(options).forEach(key => tabOptions[key] = options[key]);
			if (archive) {
				if (!tabOptions.compressContent) {
					tabOptions.selfExtractingArchive = true;
					tabOptions.extractDataFromPage = true;
				}
				Object.assign(tabOptions, ARCHIVE_PAGE_OPTIONS);
			}
			tabOptions.autoClose = true;
			tabOptions.originalUrl = url;
			tabOptions.extensionScriptFiles = extensionScriptFiles;
			if (tabOptions.passReferrerOnError) {
				requests.enableReferrerOnError();
			}
			return {
				tab: { url },
				status: TASK_PENDING_STATE,
				options: tabOptions,
				method: "content.save",
				archive
			};
		}
	}));
	const addedTasks = pendingTasks.filter(Boolean);
	if (archive) {
		archive.pendingCount = addedTasks.length;
		pendingTasks.forEach((taskInfo, index) => {
			if (taskInfo) {
				taskInfo.archiveIndex = index;
			}
		});
	}
	addedTasks.forEach(addTask);
	storeTasks();
	runTasks();
	return { skippedUrls };
}

async function saveTabsInArchive(tabs, options = {}) {
	if (await testArchivePassword(tabs, options)) {
		await displayArchiveError(tabs, ARCHIVE_PASSWORD_ERROR);
	} else {
		await saveTabs(tabs, options, { pages: [], pendingCount: 0, failedTabs: [] });
	}
}

async function saveTabGroup(tab, options = {}) {
	const tabs = await getTabGroupTabs(tab);
	if (tabs) {
		await saveTabs(tabs, options);
	}
}

async function saveTabGroupInArchive(tab, options = {}) {
	const tabs = await getTabGroupTabs(tab);
	if (tabs) {
		await saveTabsInArchive(tabs, options);
	}
}

async function addTabGroupToArchive(tab, options = {}) {
	const tabs = await getTabGroupTabs(tab);
	if (tabs) {
		await addTabsToArchive(tabs, options);
	}
}

async function getTabGroupTabs(tab) {
	if (tab.groupId === undefined || tab.groupId == NO_GROUP_ID) {
		await displayArchiveError([tab], NO_TAB_GROUP_ERROR);
	} else {
		const tabs = await browser.tabs.query({ groupId: tab.groupId });
		return tabs.sort((tab1, tab2) => tab1.index - tab2.index);
	}
}

async function addTabsToArchive(tabs, options = {}) {
	if (tabs.some(tab => tab.incognito)) {
		await displayArchiveError(tabs, ARCHIVE_PRIVATE_TAB_ERROR);
	} else if (await testArchivePassword(tabs, options)) {
		await displayArchiveError(tabs, ARCHIVE_PASSWORD_ERROR);
	} else {
		await saveTabs(tabs, options, { pages: [], pendingCount: 0, persistent: true, date: Date.now() });
	}
}

async function addUrlsToArchive(urls, profileName, tab) {
	const urlsOptions = await Promise.all(urls.map(url => profileName ? config.getProfileOptions(profileName) : config.getOptions(url)));
	let error;
	if (tab && tab.incognito) {
		error = ARCHIVE_PRIVATE_TAB_ERROR;
	} else if (urlsOptions.some(urlOptions => urlOptions.password)) {
		error = ARCHIVE_PASSWORD_ERROR;
	}
	if (error) {
		if (tab) {
			await displayArchiveError([tab], error);
		}
		return { error };
	} else {
		return saveUrls(urls, {}, profileName, { pages: [], pendingCount: 0, persistent: true, date: Date.now() });
	}
}

async function testArchivePassword(tabs, options) {
	const tabsOptions = await Promise.all(tabs.map(tab => config.getOptions(tab.url)));
	return tabsOptions.some(tabOptions => Object.assign({}, tabOptions, options).password);
}

async function displayArchiveError(tabs, message) {
	const tab = tabs.find(tab => tab.active) || tabs[0];
	try {
		await injectScript(tab.id, { extensionScriptFiles, tabId: tab.id, tabIndex: tab.index });
		// eslint-disable-next-line no-unused-vars
	} catch (error) {
		// ignored
	}
	ui.onError(tab.id, message);
}

function addArchivePage(taskId, page) {
	const taskInfo = tasks.find(taskInfo => taskInfo.id == taskId);
	if (taskInfo && taskInfo.archive) {
		taskInfo.archivePage = page;
		if (taskInfo.archive.persistent) {
			page.persistent = true;
			page.position = taskInfo.archive.date * ARCHIVE_POSITION_FACTOR + taskInfo.archiveIndex;
		} else {
			page.saveOptions = taskInfo.archiveSaveOptions;
			taskInfo.archive.pages[taskInfo.archiveIndex] = page;
		}
		return true;
	}
}

async function isPDFDocument(tabId) {
	const results = await browser.tabs.executeScript(tabId, { code: "document.contentType" });
	return Boolean(results) && results[0] == PDF_CONTENT_TYPE;
}

function addArchiveFailure(archive, archiveIndex, { url, title }) {
	if (archive) {
		if (archive.persistent) {
			archiveStore.addFailure({
				position: archive.date * ARCHIVE_POSITION_FACTOR + archiveIndex,
				url,
				title,
				date: Date.now(),
				failed: true
			}).catch(() => { });
		} else if (url && !NEW_TAB_URL_REGEXP.test(url)) {
			archive.failedTabs.push({ url, title });
		}
	}
}

function isArchivePageSaved({ archivePage }) {
	return Boolean(archivePage && (archivePage.blobURL || archivePage.blob || archivePage.saved));
}

function setArchiveEndCallback(callback) {
	onArchiveEnd = callback;
}

async function saveTabs(tabs, options = {}, archive) {
	await initMaxParallelWorkers();
	const pendingTasks = await Promise.all(tabs.map(async (tab, indexTab) => {
		const tabId = tab.id;
		const tabOptions = await config.getOptions(tab.url);
		if (tabOptions.profileName != config.DISABLED_PROFILE_NAME) {
			Object.keys(options).forEach(key => tabOptions[key] = options[key]);
			if (tabOptions.buttonClicked && tabOptions.buttonSaveSelection) {
				tabOptions.optionallySelected = true;
			}
			let archiveSaveOptions;
			if (archive) {
				archiveSaveOptions = {};
				ARCHIVE_SAVE_OPTION_NAMES.forEach(name => archiveSaveOptions[name] = tabOptions[name]);
				if (!tabOptions.compressContent) {
					tabOptions.selfExtractingArchive = true;
					tabOptions.extractDataFromPage = true;
				}
				Object.assign(tabOptions, ARCHIVE_PAGE_OPTIONS);
			}
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
				if (await autoSaveIsEnabled(tab)) {
					const taskInfo = addTask({
						status: TASK_PROCESSING_STATE,
						tab: tabData,
						options: tabOptions,
						method: AUTOSAVE_METHOD
					});
					runTask(taskInfo);
				}
			} else {
				ui.onStart(tabId, INJECT_SCRIPTS_STEP);
				let scriptsInjected;
				try {
					if (!archive || !(await isPDFDocument(tabId))) {
						scriptsInjected = await injectScript(tabId, tabOptions);
					}
					// eslint-disable-next-line no-unused-vars
				} catch (error) {
					// ignored
				}
				if (editor.isEditor(tab) ? !archive : scriptsInjected) {
					ui.onStart(tabId, EXECUTE_SCRIPTS_STEP);
					return {
						status: TASK_PENDING_STATE,
						tab: tabData,
						options: tabOptions,
						method: "content.save",
						archive,
						archiveSaveOptions
					};
				} else {
					ui.onForbiddenDomain(tab);
					addArchiveFailure(archive, indexTab, tab);
				}
			}
		} else {
			ui.onForbiddenDomain(tab);
			addArchiveFailure(archive, indexTab, tab);
		}
	}));
	const addedTasks = pendingTasks.filter(Boolean);
	if (archive) {
		archive.pendingCount = addedTasks.length;
		pendingTasks.forEach((taskInfo, index) => {
			if (taskInfo) {
				taskInfo.archiveIndex = index;
			}
		});
	}
	addedTasks.forEach(addTask);
	runTasks();
}

async function captureTab(tab, options = {}) {
	const tabId = tab.id;
	const tabOptions = await config.getOptions(tab.url);
	if (tabOptions.profileName == config.DISABLED_PROFILE_NAME) {
		throw new Error("SingleFile is disabled for this URL");
	}
	Object.assign(tabOptions, options, {
		silent: true,
		logsEnabled: false,
		progressBarEnabled: false,
		confirmFilename: false,
		confirmInfobarContent: false,
		openEditor: false,
		autoOpenEditor: false,
		openSavedPage: false,
		backgroundSave: false,
		saveToClipboard: false,
		saveToGDrive: false,
		saveToDropbox: false,
		saveWithWebDAV: false,
		saveWithMCP: false,
		saveToGitHub: false,
		saveWithCompanion: false,
		saveToRestFormApi: false,
		saveToS3: false,
		sharePage: false,
		tabId,
		tabIndex: tab.index,
		extensionScriptFiles
	});
	await initMaxParallelWorkers();
	let scriptsInjected;
	try {
		scriptsInjected = await injectScript(tabId, tabOptions);
		// eslint-disable-next-line no-unused-vars
	} catch (error) {
		// ignored
	}
	if (scriptsInjected || editor.isEditor(tab)) {
		return new Promise((resolve, reject) => {
			const taskInfo = addTask({
				status: TASK_PENDING_STATE,
				tab: {
					id: tab.id,
					index: tab.index,
					url: tab.url,
					title: tab.title
				},
				options: tabOptions,
				method: "content.capture",
				resolve,
				reject
			});
			taskInfo.cancel = () => reject(new Error("SingleFile capture was cancelled"));
			runTasks();
		});
	}
	throw new Error("Cannot access the tab contents");
}

function addTask(info) {
	if (!tasks.length) {
		endedTasksCount = 0;
	}
	const taskInfo = {
		id: currentTaskId,
		status: info.status,
		tab: info.tab,
		options: info.options,
		method: info.method,
		resolve: info.resolve,
		reject: info.reject,
		archive: info.archive,
		archiveIndex: info.archiveIndex,
		archiveSaveOptions: info.archiveSaveOptions,
		done: function (runNextTasks = true) {
			const index = tasks.findIndex(taskInfo => taskInfo.id == this.id);
			if (index > -1) {
				tasks.splice(index, 1);
				if (!this.cancelled) {
					endedTasksCount++;
				}
				if (!tasks.length) {
					paused = false;
				}
				storeTasks();
				if (this.archive) {
					this.archive.pendingCount--;
					if (!this.cancelled && !isArchivePageSaved(this)) {
						addArchiveFailure(this.archive, this.archiveIndex, this.tab);
					}
					if (!this.archive.pendingCount && !this.archive.persistent && onArchiveEnd) {
						onArchiveEnd(this.archive);
					}
				}
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
	await tasksRestored;
	const configData = await config.get();
	processInForeground = configData.processInForeground;
	maxParallelWorkers = processInForeground ? 1 : configData.maxParallelWorkers;
}

function runTasks() {
	if (!paused) {
		const processingCount = tasks.filter(taskInfo => taskInfo.status == TASK_PROCESSING_STATE).length;
		for (let index = 0; index < Math.min(tasks.length - processingCount, (maxParallelWorkers - processingCount)); index++) {
			const taskInfo = tasks.find(taskInfo => taskInfo.status == TASK_PENDING_STATE);
			if (taskInfo) {
				runTask(taskInfo);
			}
		}
	}
}

async function pauseTasks() {
	await tasksRestored;
	if (tasks.length) {
		paused = true;
		storeTasks();
	}
}

async function resumeTasks() {
	await initMaxParallelWorkers();
	paused = false;
	storeTasks();
	runTasks();
}

function storeTasks() {
	if ((paused || tasksStored) && !tasksStorePending) {
		tasksStorePending = true;
		Promise.resolve().then(async () => {
			tasksStorePending = false;
			try {
				await writeTasks();
				// eslint-disable-next-line no-unused-vars
			} catch (error) {
				// ignored
			}
		});
	}
}

async function writeTasks() {
	if (browser.storage.session) {
		if (paused) {
			const options = [];
			const optionsIndexes = new Map();
			const storedTasks = tasks.filter(isStorableTask).map(taskInfo => {
				const taskOptions = JSON.stringify(Object.assign({}, taskInfo.options, { originalUrl: undefined }));
				let optionsIndex = optionsIndexes.get(taskOptions);
				if (optionsIndex === undefined) {
					optionsIndex = options.push(taskOptions) - 1;
					optionsIndexes.set(taskOptions, optionsIndex);
				}
				return {
					url: taskInfo.tab.url,
					optionsIndex,
					archiveDate: taskInfo.archive && taskInfo.archive.date,
					archiveIndex: taskInfo.archiveIndex
				};
			});
			tasksStored = true;
			await browser.storage.session.set({ [PAUSED_TASKS_STORAGE_KEY]: { tasks: storedTasks, options, endedTasksCount } });
		} else {
			tasksStored = false;
			await browser.storage.session.remove(PAUSED_TASKS_STORAGE_KEY);
		}
	}
}

function isStorableTask(taskInfo) {
	return taskInfo.status == TASK_PENDING_STATE && !taskInfo.tab.id && !taskInfo.resolve && (!taskInfo.archive || taskInfo.archive.persistent);
}

async function restoreTasks() {
	if (browser.storage.session) {
		try {
			const storedData = (await browser.storage.session.get(PAUSED_TASKS_STORAGE_KEY))[PAUSED_TASKS_STORAGE_KEY];
			if (storedData) {
				const archives = new Map();
				storedData.tasks.forEach(({ url, optionsIndex, archiveDate, archiveIndex }) => {
					const options = JSON.parse(storedData.options[optionsIndex]);
					let archive;
					options.originalUrl = url;
					if (archiveDate) {
						archive = archives.get(archiveDate);
						if (!archive) {
							archive = { pages: [], pendingCount: 0, persistent: true, date: archiveDate };
							archives.set(archiveDate, archive);
						}
						archive.pendingCount++;
					}
					addTask({ status: TASK_PENDING_STATE, tab: { url }, options, method: "content.save", archive, archiveIndex });
				});
				paused = Boolean(tasks.length);
				endedTasksCount = storedData.endedTasksCount;
				tasksStored = true;
			}
			// eslint-disable-next-line no-unused-vars
		} catch (error) {
			// ignored
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
			try {
				scriptsInjected = await injectScript(taskInfo.tab.id, taskInfo.options);
				// eslint-disable-next-line no-unused-vars
			} catch (error) {
				// ignored
			}
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
		if (processInForeground && !taskInfo.options.silent) {
			await browser.tabs.update(taskInfo.tab.id, { active: true });
		}
		const response = await browser.tabs.sendMessage(taskInfo.tab.id, { method: taskInfo.method, options: taskInfo.options });
		// tasks saving a page are removed when the download ends, tasks returning the page
		// data to the caller are done as soon as the content script replies
		if (taskInfo.resolve && !taskInfo.cancelled) {
			taskInfo.resolve(response);
			taskInfo.done();
		} else if (taskInfo.method == AUTOSAVE_METHOD && (!response || response.pageAutoSaved)) {
			endAutoSaveTask(taskInfo);
		} else if (taskInfo.archive || (response && response.taskEnded)) {
			taskInfo.done();
		}
	} catch (error) {
		// the caller is waiting for a result, it must always be settled
		if (taskInfo.reject) {
			if (!taskInfo.cancelled) {
				taskInfo.reject(error);
			}
			taskInfo.done();
		} else if (error && (!error.message || !isIgnoredError(error))) {
			console.log(error.message ? error.message : error); // eslint-disable-line no-console
			ui.onError(taskInfo.tab.id, error.message, error.link, error.stack);
			taskInfo.done();
		} else if (taskInfo.method == AUTOSAVE_METHOD) {
			endAutoSaveTask(taskInfo);
		} else if (taskInfo.archive) {
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
	endAutoSaveTasks(tab.id);
}

function onTabRemoved(tabId) {
	cancelTab(tabId);
	endAutoSaveTasks(tabId);
}

function endAutoSaveTasks(tabId) {
	Array.from(tasks).filter(taskInfo => taskInfo.tab.id == tabId && taskInfo.method == AUTOSAVE_METHOD).forEach(endAutoSaveTask);
}

function endAutoSaveTask(taskInfo) {
	if (!taskInfo.saving) {
		taskInfo.done();
	}
}

function onSaveStart(taskId) {
	const taskInfo = tasks.find(taskInfo => taskInfo.id == taskId);
	if (taskInfo) {
		taskInfo.saving = true;
	}
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

async function cancelTask(taskId) {
	await tasksRestored;
	const taskInfo = tasks.find(taskInfo => taskInfo.id == taskId);
	if (taskInfo) {
		cancel(taskInfo);
	}
}

async function cancelAllTasks() {
	await tasksRestored;
	Array.from(tasks).forEach(taskInfo => cancel(taskInfo, false));
}

async function getTasksInfo() {
	await tasksRestored;
	return { tasks: tasks.map(mapTaskInfo), paused, endedTasksCount };
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
				loadDeferredContent: taskInfo.options.loadDeferredContent,
				loadDeferredContentKeepZoomLevel: taskInfo.options.loadDeferredContentKeepZoomLevel
			}
		}).catch(() => {
			// ignored
		});
		if (taskInfo.method == AUTOSAVE_METHOD) {
			ui.onEnd(tabId, true);
		}
		if (!taskInfo.options.silent) {
			ui.onCancelled(taskInfo.tab);
		}
	}
	if (taskInfo.cancel) {
		taskInfo.cancel();
	}
	taskInfo.done(runNextTasks);
}

function mapTaskInfo(taskInfo) {
	return { id: taskInfo.id, tabId: taskInfo.tab.id, index: taskInfo.tab.index, url: taskInfo.tab.url, title: taskInfo.tab.title, cancelled: taskInfo.cancelled, status: taskInfo.status };
}
