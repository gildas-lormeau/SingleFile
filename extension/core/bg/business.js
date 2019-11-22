/*
 * Copyright 2010-2019 Gildas Lormeau
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
	let currentTaskId = 0;

	return {
		isSavingTab: tab => Boolean(tasks.find(taskInfo => taskInfo.tab.id == tab.id)),
		saveTabs,
		saveLink,
		cancelTab,
		cancelTask: taskId => cancelTask(tasks.find(taskInfo => taskInfo.taskId == taskId)),
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
		onTabUpdated: cancelTab,
		onTabRemoved: cancelTab
	};

	async function saveTabs(tabs, options = {}) {
		const config = singlefile.extension.core.bg.config;
		const maxParallelWorkers = (await config.get()).maxParallelWorkers;
		const autosave = singlefile.extension.core.bg.autosave;
		const ui = singlefile.extension.ui.bg.main;
		await Promise.all(tabs.map(async tab => {
			const tabId = tab.id;
			const tabOptions = await config.getOptions(tab.url);
			Object.keys(options).forEach(key => tabOptions[key] = options[key]);
			tabOptions.tabId = tabId;
			tabOptions.tabIndex = tab.index;
			tabOptions.extensionScriptFiles = extensionScriptFiles;
			if (options.autoSave) {
				if (autosave.isEnabled(tab)) {
					tasks.push({ id: currentTaskId, status: "pending", tab, options: tabOptions, method: "content.autosave" });
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
		const processingCount = tasks.filter(taskInfo => taskInfo.status == "processing").length;
		for (let index = 0; index < Math.min(tabs.length, (maxParallelWorkers - processingCount)); index++) {
			runTask();
		}
	}

	function runTask() {
		const taskInfo = tasks.find(taskInfo => taskInfo.status == "pending");
		if (taskInfo) {
			const tabId = taskInfo.tab.id;
			const taskId = taskInfo.id;
			return new Promise((resolve, reject) => {
				taskInfo.status = "processing";
				taskInfo.resolve = async () => {
					if (taskInfo.options.autoClose && !taskInfo.cancelled) {
						singlefile.extension.core.bg.tabs.remove(taskInfo.tab.id);
					}
					tasks.splice(tasks.findIndex(taskInfo => taskInfo.id == taskId), 1);
					resolve();
					await runTask();
				};
				taskInfo.reject = async error => {
					tasks.splice(tasks.findIndex(taskInfo => taskInfo.id == taskId), 1);
					reject(error);
					await runTask();
				};
				taskInfo.options.taskId = taskId;
				singlefile.extension.core.bg.tabs.sendMessage(tabId, { method: taskInfo.method, options: taskInfo.options })
					.catch(error => {
						if (error && (!error.message || (error.message != ERROR_CONNECTION_LOST_CHROMIUM && error.message != ERROR_CONNECTION_ERROR_CHROMIUM && error.message != ERROR_CONNECTION_LOST_GECKO))) {
							console.log(error); // eslint-disable-line no-console
							singlefile.extension.ui.bg.main.onError(tabId);
							taskInfo.reject(error);
						}
					});
			});
		}
	}

	async function saveLink(url, options = {}) {
		const tabs = singlefile.extension.core.bg.tabs;
		const tab = await tabs.create({ url, active: false });
		options.autoClose = true;
		await saveTabs([tab], options);
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
