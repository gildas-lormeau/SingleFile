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

/* global singlefile */

singlefile.extension.core.bg.business = (() => {

	const ERROR_CONNECTION_ERROR_CHROMIUM = "Could not establish connection. Receiving end does not exist.";
	const ERROR_CONNECTION_LOST_CHROMIUM = "The message port closed before a response was received.";
	const ERROR_CONNECTION_LOST_GECKO = "Message manager disconnected";
	const INJECT_SCRIPTS_STEP = 1;
	const EXECUTE_SCRIPTS_STEP = 2;

	const extensionScriptFiles = [
		"common/index.js",
		"common/ui/content/content-infobar.js",
		"extension/lib/single-file/index.js",
		"extension/core/index.js",
		"extension/ui/index.js",
		"extension/core/content/content-main.js",
		"extension/core/content/content-download.js",
		"extension/ui/content/content-ui-main.js"
	];

	const tasks = [];
	let currentTaskId = 0, maxParallelWorkers;

	return {
		isSavingTab: tab => Boolean(tasks.find(taskInfo => taskInfo.tab.id == tab.id)),
		saveTabs,
		saveUrls,
		saveSelectedLinks,
		cancelTab,
		cancelTask: taskId => cancelTask(tasks.find(taskInfo => taskInfo.id == taskId)),
		cancelAllTasks: () => Array.from(tasks).forEach(cancelTask),
		getTasksInfo: () => tasks.map(mapTaskInfo),
		getTaskInfo: taskId => tasks.find(taskInfo => taskInfo.id == taskId),
		setCancelCallback: (taskId, cancelCallback) => {
			const taskInfo = tasks.find(taskInfo => taskInfo.id == taskId);
			if (taskInfo) {
				taskInfo.cancel = cancelCallback;
			}
		},
		onSaveEnd: taskId => {
			const taskInfo = tasks.find(taskInfo => taskInfo.id == taskId);
			if (taskInfo) {
				taskInfo.resolve();
			}
		},
		onInit: tab => cancelTab(tab.id),
		onTabRemoved: cancelTab
	};

	async function saveSelectedLinks(tab) {
		const tabs = singlefile.extension.core.bg.tabs;
		const tabOptions = { extensionScriptFiles, tabId: tab.id, tabIndex: tab.index };
		const scriptsInjected = await singlefile.extension.injectScript(tab.id, tabOptions);
		if (scriptsInjected) {
			const response = await tabs.sendMessage(tab.id, { method: "content.getSelectedLinks" });
			if (response.urls && response.urls.length) {
				await saveUrls(response.urls);
			}
		} else {
			singlefile.extension.ui.bg.main.onForbiddenDomain(tab);
		}
	}

	async function saveUrls(urls, options = {}) {
		await initMaxParallelWorkers();
		await Promise.all(urls.map(async url => {
			const tabOptions = await singlefile.extension.core.bg.config.getOptions(url);
			Object.keys(options).forEach(key => tabOptions[key] = options[key]);
			tabOptions.autoClose = true;
			tabOptions.extensionScriptFiles = extensionScriptFiles;
			tasks.push({ id: currentTaskId, status: "pending", tab: { url }, options: tabOptions, method: "content.save" });
			currentTaskId++;
		}));
		runTasks();
	}

	async function saveTabs(tabs, options = {}) {
		const config = singlefile.extension.core.bg.config;
		const autosave = singlefile.extension.core.bg.autosave;
		const ui = singlefile.extension.ui.bg.main;
		await initMaxParallelWorkers();
		await Promise.all(tabs.map(async tab => {
			const tabId = tab.id;
			const tabOptions = await config.getOptions(tab.url);
			Object.keys(options).forEach(key => tabOptions[key] = options[key]);
			tabOptions.tabId = tabId;
			tabOptions.tabIndex = tab.index;
			tabOptions.extensionScriptFiles = extensionScriptFiles;
			if (options.autoSave) {
				if (autosave.isEnabled(tab)) {
					const taskInfo = { id: currentTaskId, status: "processing", tab, options: tabOptions, method: "content.autosave" };
					tasks.push(taskInfo);
					runTask(taskInfo);
					currentTaskId++;
				}
			} else {
				ui.onStart(tabId, INJECT_SCRIPTS_STEP);
				const scriptsInjected = await singlefile.extension.injectScript(tabId, tabOptions);
				if (scriptsInjected) {
					ui.onStart(tabId, EXECUTE_SCRIPTS_STEP);
					tasks.push({ id: currentTaskId, status: "pending", tab, options: tabOptions, method: "content.save" });
					currentTaskId++;
				} else {
					ui.onForbiddenDomain(tab);
				}
			}
		}));
		runTasks();
	}

	async function initMaxParallelWorkers() {
		if (!maxParallelWorkers) {
			maxParallelWorkers = (await singlefile.extension.core.bg.config.get()).maxParallelWorkers;
		}
	}

	function runTasks() {
		const processingCount = tasks.filter(taskInfo => taskInfo.status == "processing").length;
		for (let index = 0; index < Math.min(tasks.length - processingCount, (maxParallelWorkers - processingCount)); index++) {
			const taskInfo = tasks.find(taskInfo => taskInfo.status == "pending");
			if (taskInfo) {
				runTask(taskInfo);
			}
		}
	}

	function runTask(taskInfo) {
		const ui = singlefile.extension.ui.bg.main;
		const tabs = singlefile.extension.core.bg.tabs;
		const taskId = taskInfo.id;
		return new Promise(async (resolve, reject) => {
			taskInfo.status = "processing";
			taskInfo.resolve = () => {
				tasks.splice(tasks.findIndex(taskInfo => taskInfo.id == taskId), 1);
				resolve();
				runTasks();
			};
			taskInfo.reject = error => {
				tasks.splice(tasks.findIndex(taskInfo => taskInfo.id == taskId), 1);
				reject(error);
				runTasks();
			};
			if (!taskInfo.tab.id) {
				const tab = await tabs.create({ url: taskInfo.tab.url, active: false });
				taskInfo.tab.id = taskInfo.options.tabId = tab.id;
				taskInfo.tab.index = taskInfo.options.tabIndex = tab.index;
				ui.onStart(taskInfo.tab.id, INJECT_SCRIPTS_STEP);
				const scriptsInjected = await singlefile.extension.injectScript(taskInfo.tab.id, taskInfo.options);
				if (scriptsInjected) {
					ui.onStart(taskInfo.tab.id, EXECUTE_SCRIPTS_STEP);
				} else {
					taskInfo.reject();
					return;
				}
			}
			taskInfo.options.taskId = taskId;
			tabs.sendMessage(taskInfo.tab.id, { method: taskInfo.method, options: taskInfo.options })
				.then(() => {
					if (taskInfo.options.autoClose && !taskInfo.cancelled) {
						tabs.remove(taskInfo.tab.id);
					}
				})
				.catch(error => {
					if (error && (!error.message || (error.message != ERROR_CONNECTION_LOST_CHROMIUM && error.message != ERROR_CONNECTION_ERROR_CHROMIUM && error.message != ERROR_CONNECTION_LOST_GECKO))) {
						console.log(error); // eslint-disable-line no-console
						ui.onError(taskInfo.tab.id);
						taskInfo.reject(error);
					}
				});
		});
	}

	function cancelTab(tabId) {
		Array.from(tasks).filter(taskInfo => taskInfo.tab.id == tabId && !taskInfo.options.autoSave).forEach(cancelTask);
	}

	function cancelTask(taskInfo) {
		const tabId = taskInfo.tab.id;
		const taskId = taskInfo.id;
		taskInfo.cancelled = true;
		singlefile.extension.core.bg.tabs.sendMessage(tabId, { method: "content.cancelSave" });
		if (taskInfo.cancel) {
			taskInfo.cancel();
		}
		if (taskInfo.method == "content.autosave") {
			singlefile.extension.ui.bg.main.onEnd(tabId, true);
		}
		singlefile.extension.ui.bg.main.onCancelled(taskInfo.tab);
		tasks.splice(tasks.findIndex(taskInfo => taskInfo.id == taskId), 1);
		if (taskInfo.resolve) {
			taskInfo.resolve();
		}
	}

	function mapTaskInfo(taskInfo) {
		return { id: taskInfo.id, tabId: taskInfo.tab.id, index: taskInfo.tab.index, url: taskInfo.tab.url, title: taskInfo.tab.title, cancelled: taskInfo.cancelled, status: taskInfo.status };
	}

})();
