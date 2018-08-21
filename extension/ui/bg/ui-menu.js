/*
 * Copyright 2018 Gildas Lormeau
 * contact : gildas.lormeau <at> gmail.com
 * 
 * This file is part of SingleFile.
 *
 *   SingleFile is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU Lesser General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   SingleFile is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU Lesser General Public License for more details.
 *
 *   You should have received a copy of the GNU Lesser General Public License
 *   along with SingleFile.  If not, see <http://www.gnu.org/licenses/>.
 */

/* global browser, singlefile */

singlefile.ui.menu = (() => {

	const DEFAULT_TITLE = "Save page with SingleFile";
	const BROWSER_MENUS_API_SUPPORTED = browser.menus && browser.menus.onClicked && browser.menus.create && browser.menus.update && browser.menus.removeAll;
	const MENU_ID_SAVE_PAGE = "save-page";
	const MENU_ID_SAVE_SELECTED = "save-selected";
	const MENU_ID_SAVE_FRAME = "save-frame";
	const MENU_ID_SAVE_SELECTED_TABS = "save-selected-tabs";
	const MENU_ID_SAVE_UNPINNED_TABS = "save-unpinned-tabs";
	const MENU_ID_SAVE_ALL_TABS = "save-tabs";
	const MENU_ID_AUTO_SAVE = "auto-save";
	const MENU_ID_AUTO_SAVE_DISABLED = "auto-save-disabled";
	const MENU_ID_AUTO_SAVE_TAB = "auto-save-tab";
	const MENU_ID_AUTO_SAVE_UNPINNED = "auto-save-unpinned";
	const MENU_ID_AUTO_SAVE_ALL = "auto-save-all";

	initialize();
	browser.tabs.onActivated.addListener(async activeInfo => {
		const tab = await browser.tabs.get(activeInfo.tabId);
		await refreshState(tab);
	});
	browser.tabs.onCreated.addListener(refreshState);
	return {
		refresh
	};

	async function refresh() {
		const config = await singlefile.config.get();
		if (BROWSER_MENUS_API_SUPPORTED) {
			const pageContextsEnabled = ["page", "frame", "image"];
			const defaultContextsDisabled = ["browser_action"];
			const defaultContextsEnabled = defaultContextsDisabled.concat(...pageContextsEnabled);
			const defaultContexts = config.contextMenuEnabled ? defaultContextsEnabled : defaultContextsDisabled;
			await browser.menus.removeAll();
			if (config.contextMenuEnabled) {
				browser.menus.create({
					id: MENU_ID_SAVE_PAGE,
					contexts: pageContextsEnabled,
					title: DEFAULT_TITLE
				});
			}
			if (config.contextMenuEnabled) {
				browser.menus.create({
					id: "separator-1",
					contexts: pageContextsEnabled,
					type: "separator"
				});
			}
			browser.menus.create({
				id: MENU_ID_SAVE_SELECTED,
				contexts: config.contextMenuEnabled ? defaultContextsDisabled.concat(["selection"]) : defaultContextsDisabled,
				title: "Save selection"
			});
			if (config.contextMenuEnabled) {
				browser.menus.create({
					id: MENU_ID_SAVE_FRAME,
					contexts: ["frame"],
					title: "Save frame"
				});
				browser.menus.create({
					id: MENU_ID_SAVE_SELECTED_TABS,
					contexts: pageContextsEnabled,
					title: "Save selected tabs"
				});
			}
			browser.menus.create({
				id: MENU_ID_SAVE_UNPINNED_TABS,
				contexts: defaultContexts,
				title: "Save unpinned tabs"
			});
			browser.menus.create({
				id: MENU_ID_SAVE_ALL_TABS,
				contexts: defaultContexts,
				title: "Save all tabs"
			});
			if (config.contextMenuEnabled) {
				browser.menus.create({
					id: "separator-2",
					contexts: pageContextsEnabled,
					type: "separator"
				});
			}
			browser.menus.create({
				id: MENU_ID_AUTO_SAVE,
				contexts: defaultContexts,
				title: "Auto-save"
			});
			browser.menus.create({
				id: MENU_ID_AUTO_SAVE_DISABLED,
				type: "radio",
				title: "Disabled",
				contexts: defaultContexts,
				checked: true,
				parentId: MENU_ID_AUTO_SAVE
			});
			browser.menus.create({
				id: MENU_ID_AUTO_SAVE_TAB,
				type: "radio",
				title: "Auto-save this tab",
				contexts: defaultContexts,
				checked: false,
				parentId: MENU_ID_AUTO_SAVE
			});
			browser.menus.create({
				id: MENU_ID_AUTO_SAVE_UNPINNED,
				type: "radio",
				title: "Auto-save unpinned tabs",
				contexts: defaultContexts,
				checked: false,
				parentId: MENU_ID_AUTO_SAVE
			});
			browser.menus.create({
				id: MENU_ID_AUTO_SAVE_ALL,
				type: "radio",
				title: "Auto-save all tabs",
				contexts: defaultContexts,
				checked: false,
				parentId: MENU_ID_AUTO_SAVE
			});
		}
	}

	async function initialize() {
		if (BROWSER_MENUS_API_SUPPORTED) {
			refresh();
			browser.menus.onClicked.addListener(async (event, tab) => {
				if (event.menuItemId == MENU_ID_SAVE_PAGE) {
					singlefile.ui.processTab(tab);
				}
				if (event.menuItemId == MENU_ID_SAVE_SELECTED) {
					singlefile.ui.processTab(tab, { selected: true });
				}
				if (event.menuItemId == MENU_ID_SAVE_FRAME) {
					singlefile.ui.processTab(tab, { frameId: event.frameId });
				}
				if (event.menuItemId == MENU_ID_SAVE_SELECTED_TABS) {
					const tabs = await browser.tabs.query({ currentWindow: true, highlighted: true });
					tabs.forEach(tab => singlefile.ui.isAllowedURL(tab.url) && singlefile.ui.processTab(tab));
				}
				if (event.menuItemId == MENU_ID_SAVE_UNPINNED_TABS) {
					const tabs = await browser.tabs.query({ currentWindow: true, pinned: false });
					tabs.forEach(tab => singlefile.ui.isAllowedURL(tab.url) && singlefile.ui.processTab(tab));
				}
				if (event.menuItemId == MENU_ID_SAVE_ALL_TABS) {
					const tabs = await browser.tabs.query({ currentWindow: true });
					tabs.forEach(tab => singlefile.ui.isAllowedURL(tab.url) && singlefile.ui.processTab(tab));
				}
				if (event.menuItemId == MENU_ID_AUTO_SAVE_TAB) {
					const tabsData = await singlefile.storage.get();
					if (!tabsData[tab.id]) {
						tabsData[tab.id] = {};
					}
					tabsData[tab.id].autoSave = event.checked;
					await singlefile.storage.set(tabsData);
					refreshExternalComponents(tab.id, { autoSave: true });
				}
				if (event.menuItemId == MENU_ID_AUTO_SAVE_DISABLED) {
					const tabsData = await singlefile.storage.get();
					Object.keys(tabsData).forEach(tabId => tabsData[tabId].autoSave = false);
					tabsData.autoSaveUnpinned = tabsData.autoSaveAll = false;
					await singlefile.storage.set(tabsData);
					refreshExternalComponents(tab.id, { autoSave: false });
				}
				if (event.menuItemId == MENU_ID_AUTO_SAVE_ALL) {
					const tabsData = await singlefile.storage.get();
					tabsData.autoSaveAll = event.checked;
					await singlefile.storage.set(tabsData);
					refreshExternalComponents(tab.id, { autoSave: true });
				}
				if (event.menuItemId == MENU_ID_AUTO_SAVE_UNPINNED) {
					const tabsData = await singlefile.storage.get();
					tabsData.autoSaveUnpinned = event.checked;
					await singlefile.storage.set(tabsData);
					refreshExternalComponents(tab.id, { autoSave: true });
				}
			});
			const tabs = await browser.tabs.query({});
			tabs.forEach(tab => refreshState(tab));
		}
	}

	async function refreshExternalComponents(tabId, tabData) {
		await singlefile.ui.autosave.refresh();
		singlefile.ui.button.refresh(tabId, tabData);
	}

	async function refreshState(tab) {
		const tabsData = await singlefile.storage.get();
		if (BROWSER_MENUS_API_SUPPORTED) {
			try {
				const disabled = Boolean(!tabsData[tab.id] || !tabsData[tab.id].autoSave);
				await browser.menus.update(MENU_ID_AUTO_SAVE_DISABLED, { checked: disabled });
				await browser.menus.update(MENU_ID_AUTO_SAVE_TAB, { checked: !disabled });
				await browser.menus.update(MENU_ID_AUTO_SAVE_UNPINNED, { checked: Boolean(tabsData.autoSaveUnpinned) });
				await browser.menus.update(MENU_ID_AUTO_SAVE_ALL, { checked: Boolean(tabsData.autoSaveAll) });
			} catch (error) {
				/* ignored */
			}
		}
	}

})();