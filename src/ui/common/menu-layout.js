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

const SURFACES = ["page", "button", "tab"];
const CONTEXTS = ["page", "selection", "frame", "link"];
const ACTIONS = {
	"save-page": { labelKey: "menuSavePage", bindable: true },
	"edit-and-save-page": { labelKey: "menuEditAndSavePage", altLabelKey: "menuEditPage", bindable: true },
	"save-selection": { labelKey: "menuSaveSelection", bindable: true },
	"save-selected-links": { labelKey: "menuSaveSelectedLinks", contexts: ["selection"] },
	"save-frame": { labelKey: "menuSaveFrame", contexts: ["frame"], surfaces: ["page"] },
	"save-with-profile": { labelKey: "menuSaveWithProfile", dynamic: "profiles" },
	"save-tabs": { labelKey: "menuSaveTabs", container: true, preset: ["save-selected-tabs", "save-unpinned-tabs", "save-all-tabs"] },
	"save-selected-tabs": { labelKey: "menuSaveSelectedTabs", bindable: true },
	"save-unpinned-tabs": { labelKey: "menuSaveUnpinnedTabs", bindable: true },
	"save-all-tabs": { labelKey: "menuSaveAllTabs", bindable: true },
	"select-profile": { labelKey: "menuSelectProfile", dynamic: "radio-profiles" },
	"domain-rule": { labelKey: "menuCreateDomainRule", dynamic: "radio-rule" },
	"auto-save": { labelKey: "menuAutoSave", dynamic: "radio-autosave" },
	"batch-save-urls": { labelKey: "menuBatchSaveUrls" },
	"view-pendings": { labelKey: "menuViewPendingSaves" },
	"submenu": { labelKey: "menuSubmenu", container: true },
	"separator": { labelKey: "menuSeparator", separator: true }
};
const ACTION_NAMES = Object.keys(ACTIONS);

export {
	SURFACES,
	CONTEXTS,
	ACTIONS,
	ACTION_NAMES,
	getDefaultLayout,
	normalizeLayout,
	createEntry
};

function createEntry(action, extra = {}) {
	const definition = ACTIONS[action];
	const entry = Object.assign({ action }, extra);
	if (definition.container) {
		entry.children = extra.children || (definition.preset || []).map(childAction => createEntry(childAction));
	}
	return entry;
}

function getDefaultLayout() {
	const commonTail = () => [
		createEntry("select-profile"),
		createEntry("domain-rule"),
		createEntry("auto-save"),
		createEntry("separator"),
		createEntry("batch-save-urls"),
		createEntry("view-pendings")
	];
	const buttonLayout = () => [
		createEntry("save-page"),
		createEntry("edit-and-save-page"),
		createEntry("save-selected-links"),
		createEntry("save-with-profile"),
		createEntry("save-selection"),
		createEntry("save-tabs"),
		...commonTail()
	];
	return {
		page: [
			createEntry("save-page"),
			createEntry("edit-and-save-page"),
			createEntry("save-selected-links"),
			createEntry("save-with-profile"),
			createEntry("separator"),
			createEntry("save-selection"),
			createEntry("save-frame"),
			createEntry("save-selected-tabs"),
			createEntry("save-unpinned-tabs"),
			createEntry("save-all-tabs"),
			createEntry("separator"),
			createEntry("select-profile"),
			createEntry("domain-rule"),
			createEntry("separator"),
			createEntry("auto-save"),
			createEntry("separator"),
			createEntry("batch-save-urls"),
			createEntry("view-pendings")
		],
		button: buttonLayout(),
		tab: buttonLayout()
	};
}

function normalizeLayout(data) {
	if (!data || typeof data != "object") {
		return null;
	}
	const layout = {};
	SURFACES.forEach(surface => layout[surface] = normalizeEntries(data[surface]));
	return layout;
}

function normalizeEntries(entries) {
	return (Array.isArray(entries) ? entries : [])
		.filter(entry => entry && typeof entry == "object" && ACTIONS[entry.action])
		.map(entry => {
			const definition = ACTIONS[entry.action];
			const extra = {};
			if (typeof entry.label == "string" && entry.label.trim()) {
				extra.label = entry.label.trim();
			}
			if (definition.bindable && typeof entry.profile == "string" && entry.profile) {
				extra.profile = entry.profile;
			}
			if (definition.dynamic == "profiles" && entry.inline) {
				extra.inline = true;
			}
			if (Array.isArray(entry.contexts) && !definition.dynamic && !definition.separator) {
				const contexts = CONTEXTS.filter(context => entry.contexts.includes(context));
				if (contexts.length) {
					extra.contexts = contexts;
				}
			}
			if (definition.container && Array.isArray(entry.children)) {
				extra.children = normalizeEntries(entry.children);
			}
			return createEntry(entry.action, extra);
		});
}
