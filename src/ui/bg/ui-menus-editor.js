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

/* global browser, document, window, confirm */

import { SURFACES, CONTEXTS, ACTIONS, ACTION_NAMES, getDefaultLayout, normalizeLayout, createEntry as createLayoutEntry } from "./../common/menu-layout.js";

const CONTEXT_LABEL_KEYS = {
	page: "menusContextPage",
	selection: "menusContextSelection",
	frame: "menusContextFrame",
	link: "menusContextLink"
};
const SURFACE_HINT_KEYS = {
	page: "menusHintPage",
	button: "menusHintButton",
	tab: "menusHintTab"
};
const AUTO_SAVE_LABEL_KEYS = ["menuAutoSaveDisabled", "menuAutoSaveTab", "menuAutoSaveUnpinnedTabs", "menuAutoSaveAllTabs"];
const DRAG_THRESHOLD = 5;
const AUTO_SCROLL_MARGIN = 40;
const AUTO_SCROLL_STEP = 12;
const MENUS_API = browser.menus || browser.contextMenus;
const CHROME_ACTION_MENU_LIMIT = MENUS_API && MENUS_API.ACTION_MENU_TOP_LEVEL_LIMIT;
const TAB_MENU_SUPPORTED = Boolean(MENUS_API && MENUS_API.ContextType && MENUS_API.ContextType.TAB);
const MENU_AUTO_WRAP = Boolean(browser.runtime.getBrowserInfo);

const menuList = document.getElementById("menuList");
const surfaceSelect = document.getElementById("surfaceSelect");
const surfaceHint = document.getElementById("surfaceHint");
const addSelect = document.getElementById("addSelect");
const addButton = document.getElementById("addButton");
const copyButton = document.getElementById("copyButton");
const inspectorElement = document.getElementById("inspector");
const jsonInput = document.getElementById("jsonInput");
const jsonApplyButton = document.getElementById("jsonApplyButton");
const resetButton = document.getElementById("resetButton");
const statusLabel = document.getElementById("statusLabel");
const capNote = document.getElementById("capNote");
const contextChips = document.getElementById("contextChips");

let uidCounter = 0;
let layout = withUids(getDefaultLayout());
let profileNames = [];
let constants = {};
let selected = null;
let currentSurface = "page";
let pageContext = "page";
let dragData = null;
let renderedJson = "";
let ownSaves = [];
let pendingSave = Promise.resolve();

document.getElementById("titleLabel").textContent = getMessage("menusTitle");
document.getElementById("subTitleLabel").textContent = getMessage("menusSubTitle");
document.getElementById("surfaceLabel").textContent = getMessage("menusSurfaceLabel");
document.getElementById("surfacePageLabel").textContent = getMessage("menusSurfacePage");
document.getElementById("surfaceButtonLabel").textContent = getMessage("menusSurfaceButton");
document.getElementById("surfaceTabLabel").textContent = getMessage("menusSurfaceTab");
document.getElementById("addLabel").textContent = getMessage("menusAddLabel");
document.getElementById("editHint").textContent = getMessage("menusEditHint");
document.getElementById("jsonLabel").textContent = getMessage("menusJsonLabel");
addButton.textContent = getMessage("menusAddButton");
copyButton.textContent = getMessage("menusUseForAllButton");
copyButton.title = getMessage("menusUseForAllTooltip");
jsonApplyButton.textContent = getMessage("menusJsonApplyButton");
resetButton.textContent = getMessage("menusResetButton");
contextChips.setAttribute("aria-label", getMessage("menusContextsField"));
if (!TAB_MENU_SUPPORTED) {
	document.getElementById("surfaceTabLabel").hidden = true;
}

init();

async function init() {
	const [{ menuLayout }, profiles, constantsData] = await Promise.all([
		browser.runtime.sendMessage({ method: "config.getMenuLayout" }),
		browser.runtime.sendMessage({ method: "config.getProfiles" }),
		browser.runtime.sendMessage({ method: "config.getConstants" })
	]);
	constants = constantsData;
	if (!constants.BROWSER_MENUS_API_SUPPORTED) {
		const unsupportedLabel = document.getElementById("unsupportedLabel");
		unsupportedLabel.textContent = getMessage("menusUnsupported");
		unsupportedLabel.hidden = false;
		document.querySelector(".menus-editor").classList.add("unsupported");
		return;
	}
	profileNames = Object.keys(profiles);
	if (menuLayout) {
		layout = withUids(menuLayout);
	}
	renderAddSelect();
	renderContextChips();
	render();
	bindEvents();
	browser.storage.onChanged.addListener(onStorageChanged);
}

async function onStorageChanged(changes) {
	const keys = Object.keys(changes);
	if (keys.includes("menuLayout")) {
		await refreshLayout();
	}
	if (keys.includes("sync") || keys.some(key => key.startsWith("profile_"))) {
		await refreshProfiles();
	}
}

async function refreshLayout() {
	const { menuLayout } = await browser.runtime.sendMessage({ method: "config.getMenuLayout" });
	const stored = JSON.stringify(menuLayout || getDefaultLayout());
	const ownSaveIndex = ownSaves.indexOf(stored);
	if (ownSaveIndex >= 0) {
		ownSaves.splice(0, ownSaveIndex + 1);
		return;
	}
	const current = JSON.stringify(normalizeLayout(serialize(layout)));
	if (stored != current) {
		layout = withUids(menuLayout || getDefaultLayout());
		selected = null;
		render();
	}
}

async function refreshProfiles() {
	const profiles = await browser.runtime.sendMessage({ method: "config.getProfiles" });
	const names = Object.keys(profiles);
	if (names.join("\n") != profileNames.join("\n")) {
		profileNames = names;
		render();
	}
}

function countEntries(entries) {
	return (Array.isArray(entries) ? entries : []).reduce((count, entry) => count + 1 + (entry && typeof entry == "object" ? countEntries(entry.children) : 0), 0);
}

function needsProfiles(action) {
	return ["profiles", "radio-profiles", "radio-rule"].includes(ACTIONS[action].dynamic) && profileNames.length < 2;
}

function unsupportedAction(action) {
	return (action == "auto-save" && constants.AUTO_SAVE_SUPPORTED === false) || (action == "save-selected-tabs" && constants.SELECTABLE_TABS_SUPPORTED === false);
}

function pageOnly(entry, surface) {
	const definition = ACTIONS[entry.action];
	return Boolean(definition.surfaces && !definition.surfaces.includes(surface));
}

function missingProfile(entry) {
	return Boolean(entry.profile && !profileNames.includes(entry.profile));
}

function emptyContainer(entry, surface) {
	return Boolean(ACTIONS[entry.action].container && !entry.children.some(child => isRenderable(child, surface)));
}

function isRenderable(entry, surface) {
	const definition = ACTIONS[entry.action];
	if (pageOnly(entry, surface) || unsupportedAction(entry.action) || needsProfiles(entry.action)) {
		return false;
	}
	if (surface == "page" && !definition.dynamic && !definition.separator && !effectiveContexts(entry).length) {
		return false;
	}
	return !emptyContainer(entry, surface);
}

function contextMismatch(entry, surface) {
	const definition = ACTIONS[entry.action];
	return surface == "page" && !definition.dynamic && !definition.separator && !effectiveContexts(entry).includes(pageContext);
}

function getMessage(key, substitutions) {
	return browser.i18n.getMessage(key, substitutions);
}

function getActionLabel(action) {
	return getMessage(ACTIONS[action].labelKey);
}

function getProfileLabel(profileName) {
	return profileName == constants.DEFAULT_PROFILE_NAME ? getMessage("profileDefaultSettings") : profileName;
}

function createEntry(action, extra = {}) {
	const entry = createLayoutEntry(action, extra);
	entry.uid = "e" + (++uidCounter);
	if (entry.children) {
		entry.children = entry.children.map(child => child.uid ? child : withUidsEntry(child));
	}
	return entry;
}

function withUidsEntry(entry) {
	const copy = Object.assign({}, entry);
	delete copy.uid;
	if (copy.children) {
		copy.children = copy.children.map(withUidsEntry);
	}
	return createEntry(entry.action, copy);
}

function withUids(data) {
	const result = {};
	SURFACES.forEach(surface => result[surface] = (data[surface] || []).map(withUidsEntry));
	return result;
}

function serialize(currentLayout) {
	const strip = entries => entries.map(entry => {
		const copy = {};
		Object.keys(entry).forEach(key => {
			if (key != "uid") {
				copy[key] = key == "children" ? strip(entry.children) : entry[key];
			}
		});
		return copy;
	});
	const result = {};
	SURFACES.forEach(surface => result[surface] = strip(currentLayout[surface] || []));
	return result;
}

function cloneEntry(entry) {
	return withUidsEntry(entry);
}

function findEntry(list, uid) {
	for (let index = 0; index < list.length; index++) {
		const entry = list[index];
		if (entry.uid == uid) {
			return { list, index, entry };
		}
		if (entry.children) {
			const found = findEntry(entry.children, uid);
			if (found) {
				return found;
			}
		}
	}
	return null;
}

function contains(entry, uid) {
	return Boolean(entry.children && entry.children.some(child => child.uid == uid || contains(child, uid)));
}

function effectiveLabel(entry) {
	if (entry.label) {
		return entry.label;
	}
	const label = getActionLabel(entry.action);
	return entry.profile ? label + " (" + getProfileLabel(entry.profile) + ")" : label;
}

function effectiveContexts(entry) {
	return entry.contexts || ACTIONS[entry.action].contexts || CONTEXTS;
}

function renderAddSelect() {
	addSelect.replaceChildren(...ACTION_NAMES.filter(action => !unsupportedAction(action)).map(action => {
		const definition = ACTIONS[action];
		const option = document.createElement("option");
		option.value = action;
		option.textContent = getActionLabel(action) + (definition.container || definition.dynamic ? " ▸" : "");
		return option;
	}));
}

function renderContextChips() {
	contextChips.replaceChildren(...CONTEXTS.map(context => {
		const chip = document.createElement("button");
		chip.type = "button";
		chip.textContent = getMessage(CONTEXT_LABEL_KEYS[context]);
		chip.setAttribute("aria-pressed", String(context == pageContext));
		chip.addEventListener("click", () => {
			pageContext = context;
			renderContextChips();
			render();
		});
		return chip;
	}));
}

function render() {
	surfaceSelect.value = currentSurface;
	contextChips.hidden = currentSurface != "page";
	surfaceHint.textContent = getMessage(SURFACE_HINT_KEYS[currentSurface]);
	menuList.replaceChildren(...renderList(layout[currentSurface], currentSurface));
	capNote.hidden = true;
	if (currentSurface == "button" && CHROME_ACTION_MENU_LIMIT) {
		applyChromeCap();
	}
	renderInspector();
	const json = JSON.stringify(serialize(layout), null, "\t");
	if (json != renderedJson) {
		renderedJson = json;
		jsonInput.value = json;
	}
}

function renderList(entries, surface) {
	return entries.map(entry => {
		const definition = ACTIONS[entry.action];
		const inlineProfiles = definition.dynamic == "profiles" && entry.inline;
		const item = document.createElement("li");
		item.className = "menus-item";
		item.dataset.uid = entry.uid;
		item.tabIndex = 0;
		if (definition.separator) {
			item.classList.add("separator");
		}
		if (inlineProfiles) {
			item.classList.add("inline-parent");
		}
		if (selected && selected.surface == surface && selected.uid == entry.uid) {
			item.classList.add("selected");
		}
		if (contextMismatch(entry, surface) || !isRenderable(entry, surface)) {
			item.classList.add("unavailable");
		}
		item.append(renderRow(entry, surface, inlineProfiles));
		if (definition.container) {
			const submenu = document.createElement("ul");
			submenu.className = "menus-submenu";
			submenu.replaceChildren(...renderList(entry.children, surface));
			item.append(submenu);
		} else if (definition.dynamic) {
			const submenu = document.createElement("ul");
			submenu.className = "menus-submenu" + (inlineProfiles ? " inline-group" : "");
			submenu.replaceChildren(...renderDynamicChildren(entry));
			item.append(submenu);
		}
		bindEntryEvents(item, entry, surface);
		return item;
	});
}

function renderRow(entry, surface, inlineProfiles) {
	const definition = ACTIONS[entry.action];
	const row = document.createElement("div");
	row.className = "menus-row";
	const grip = document.createElement("span");
	grip.className = "menus-grip";
	grip.textContent = "⠿";
	grip.setAttribute("aria-hidden", "true");
	row.append(grip);
	if (definition.separator) {
		row.append(createRemoveButton(entry, surface));
		return row;
	}
	const label = document.createElement("span");
	label.className = "menus-label";
	label.textContent = inlineProfiles ? getMessage("menusPresentationInline") : effectiveLabel(entry);
	if (definition.altLabelKey) {
		row.title = getMessage("menusAltLabelHelp", [getMessage(definition.altLabelKey)]);
	}
	row.append(label);
	if (entry.profile && !entry.label) {
		const chip = document.createElement("span");
		chip.className = "menus-chip";
		chip.textContent = getProfileLabel(entry.profile);
		if (missingProfile(entry)) {
			chip.classList.add("missing");
			chip.title = getMessage("menusProfileMissingHelp", [entry.profile]);
		}
		row.append(chip);
	}
	const badgeKey = unsupportedAction(entry.action) ? "menusUnsupportedBadge" : needsProfiles(entry.action) ? "menusProfilesBadge" : definition.dynamic && !inlineProfiles ? "menusDynamicBadge" : null;
	if (badgeKey) {
		const badge = document.createElement("span");
		badge.className = "menus-badge";
		badge.textContent = getMessage(badgeKey);
		row.append(badge);
	}
	if ((definition.container || definition.dynamic) && !inlineProfiles) {
		const arrow = document.createElement("span");
		arrow.className = "menus-arrow";
		arrow.textContent = "▸";
		row.append(arrow);
	}
	row.append(createRemoveButton(entry, surface));
	label.addEventListener("dblclick", event => {
		event.stopPropagation();
		if (!inlineProfiles) {
			startRename(label, entry);
		}
	});
	return row;
}

function createRemoveButton(entry, surface) {
	const remove = document.createElement("button");
	remove.type = "button";
	remove.className = "menus-remove";
	remove.title = getMessage("menusRemoveTooltip");
	remove.textContent = "×";
	remove.addEventListener("click", event => {
		event.stopPropagation();
		removeEntry(surface, entry.uid);
	});
	return remove;
}

function renderDynamicChildren(entry) {
	const definition = ACTIONS[entry.action];
	let rows = [];
	if (definition.dynamic == "profiles") {
		rows = profileNames.map(name => ({ label: getProfileLabel(name) }));
	} else if (definition.dynamic == "radio-profiles") {
		rows = profileNames.map((name, index) => ({ label: getProfileLabel(name), radio: true, checked: index == 0 }));
	} else if (definition.dynamic == "radio-rule") {
		rows = [{ label: constants.CURRENT_PROFILE_NAME, radio: true, checked: true }].concat(profileNames.map(name => ({ label: getProfileLabel(name), radio: true })));
	} else if (definition.dynamic == "radio-autosave") {
		rows = AUTO_SAVE_LABEL_KEYS.map((key, index) => ({ label: getMessage(key), radio: true, checked: index == 0 }));
	}
	return rows.map(data => {
		const item = document.createElement("li");
		item.className = "menus-item example";
		const row = document.createElement("div");
		row.className = "menus-row";
		if (data.radio) {
			const radio = document.createElement("span");
			radio.className = "menus-radio" + (data.checked ? " checked" : "");
			row.append(radio);
		}
		const label = document.createElement("span");
		label.className = "menus-label";
		label.textContent = data.label;
		row.append(label);
		item.append(row);
		return item;
	});
}

function menuSlots(entry, surface) {
	const definition = ACTIONS[entry.action];
	if (definition.separator) {
		return 1;
	}
	if (!isRenderable(entry, surface)) {
		return 0;
	}
	return definition.dynamic == "profiles" && entry.inline ? profileNames.length : 1;
}

function applyChromeCap() {
	const total = layout.button.reduce((sum, entry) => sum + menuSlots(entry, "button"), 0);
	const wrapped = MENU_AUTO_WRAP && total > CHROME_ACTION_MENU_LIMIT;
	const limit = wrapped ? CHROME_ACTION_MENU_LIMIT - 1 : CHROME_ACTION_MENU_LIMIT;
	let count = 0;
	let overflow = false;
	Array.from(menuList.children).forEach((item, index) => {
		const slots = menuSlots(layout.button[index], "button");
		if (slots && count >= limit) {
			if (!overflow) {
				overflow = true;
				const line = document.createElement("li");
				line.className = "menus-cap-line";
				line.textContent = getMessage(wrapped ? "menusActionLimitLineWrapped" : "menusActionLimitLine", [String(limit)]);
				menuList.insertBefore(line, item);
			}
			item.classList.add("over-cap");
		}
		count += slots;
	});
	overflow = overflow || total > CHROME_ACTION_MENU_LIMIT;
	capNote.hidden = !overflow;
	if (overflow) {
		capNote.replaceChildren();
		const text = document.createElement("span");
		text.textContent = getMessage(wrapped ? "menusActionLimitNoteWrapped" : "menusActionLimitNote", [String(limit)]);
		const wrap = document.createElement("button");
		wrap.type = "button";
		wrap.textContent = getMessage("menusWrapButton");
		wrap.addEventListener("click", wrapOverflowInSubmenu);
		capNote.append(text, wrap);
	}
}

function wrapOverflowInSubmenu() {
	const entries = layout.button;
	let count = 0;
	let cut = entries.length;
	for (let index = 0; index < entries.length; index++) {
		const slots = menuSlots(entries[index], "button");
		if (slots && count + slots > CHROME_ACTION_MENU_LIMIT - 1) {
			cut = index;
			break;
		}
		count += slots;
	}
	const more = createEntry("submenu", { label: getMessage("menusMoreSubmenu"), children: entries.slice(cut) });
	layout.button = entries.slice(0, cut).concat([more]);
	selected = { surface: "button", uid: more.uid };
	commit();
}

function selectEntry(surface, uid) {
	selected = { surface, uid };
	render();
	focusEntry(uid);
}

function focusEntry(uid) {
	const item = uid && menuList.querySelector(".menus-item[data-uid=\"" + uid + "\"]");
	if (item) {
		item.focus({ preventScroll: true });
	}
}

function bindEntryEvents(item, entry, surface) {
	item.addEventListener("click", event => {
		event.stopPropagation();
		if (!selected || selected.uid != entry.uid) {
			selectEntry(surface, entry.uid);
		}
	});
	item.addEventListener("keydown", event => {
		if (event.target != item) {
			return;
		}
		if (event.key == "Delete" || event.key == "Backspace") {
			event.preventDefault();
			removeEntry(surface, entry.uid);
		} else if (event.key == "Enter" || event.key == " ") {
			event.preventDefault();
			selectEntry(surface, entry.uid);
		} else if (event.altKey && (event.key == "ArrowUp" || event.key == "ArrowDown")) {
			event.preventDefault();
			moveEntry(surface, entry.uid, event.key == "ArrowUp" ? -1 : 1);
		}
	});
	item.querySelector(":scope > .menus-row").addEventListener("pointerdown", event => startDrag(event, item, entry, surface));
}

function startDrag(event, item, entry, surface) {
	if (event.button != 0 || dragData || event.target.closest("button, input")) {
		return;
	}
	if (event.pointerType != "mouse" && !event.target.closest(".menus-grip")) {
		return;
	}
	const row = event.currentTarget;
	const startX = event.clientX;
	const startY = event.clientY;
	let active = false;
	let dropTarget = null;
	row.setPointerCapture(event.pointerId);
	row.addEventListener("pointermove", onMove);
	row.addEventListener("pointerup", onEnd);
	row.addEventListener("pointercancel", onCancel);

	function onMove(moveEvent) {
		if (!active) {
			if (Math.abs(moveEvent.clientX - startX) < DRAG_THRESHOLD && Math.abs(moveEvent.clientY - startY) < DRAG_THRESHOLD) {
				return;
			}
			active = true;
			dragData = { surface, uid: entry.uid };
			item.classList.add("dragging");
			document.body.classList.add("menus-dragging");
		}
		moveEvent.preventDefault();
		dropTarget = updateDropTarget(moveEvent.clientX, moveEvent.clientY);
		autoScroll(moveEvent.clientY);
	}

	function onEnd() {
		cleanup();
		if (active) {
			const data = dragData;
			dragData = null;
			if (dropTarget) {
				placeEntry(surface, data, dropTarget.entry, dropTarget.position);
			}
		}
	}

	function onCancel() {
		cleanup();
		dragData = null;
	}

	function cleanup() {
		row.removeEventListener("pointermove", onMove);
		row.removeEventListener("pointerup", onEnd);
		row.removeEventListener("pointercancel", onCancel);
		clearDropMarkers();
		item.classList.remove("dragging");
		document.body.classList.remove("menus-dragging");
	}
}

function updateDropTarget(x, y) {
	clearDropMarkers();
	const element = document.elementFromPoint(x, y);
	if (!element || !menuList.contains(element)) {
		return null;
	}
	const item = element.closest(".menus-item[data-uid]");
	if (!item) {
		menuList.classList.add("drop-target");
		return { entry: null };
	}
	if (item.closest(".menus-item.dragging")) {
		return null;
	}
	const found = findEntry(layout[currentSurface], item.dataset.uid);
	if (!found) {
		return null;
	}
	const position = dropPosition(y, item, found.entry);
	item.classList.add("drop-" + position);
	return { entry: found.entry, position };
}

function autoScroll(y) {
	if (y < AUTO_SCROLL_MARGIN) {
		window.scrollBy(0, -AUTO_SCROLL_STEP);
	} else if (y > window.innerHeight - AUTO_SCROLL_MARGIN) {
		window.scrollBy(0, AUTO_SCROLL_STEP);
	}
}

function dropPosition(y, item, entry) {
	const row = item.querySelector(":scope > .menus-row");
	const rect = row.getBoundingClientRect();
	const ratio = (y - rect.top) / rect.height;
	if (ACTIONS[entry.action].container && ratio > 0.3 && ratio < 0.7) {
		return "inside";
	}
	return ratio < 0.5 ? "before" : "after";
}

function clearDropMarkers() {
	document.querySelectorAll(".drop-before, .drop-after, .drop-inside, .drop-target").forEach(element => {
		element.classList.remove("drop-before", "drop-after", "drop-inside", "drop-target");
	});
}

function placeEntry(surface, data, target, position) {
	if (!data) {
		return;
	}
	let entry;
	if (data.action) {
		entry = createEntry(data.action);
	} else {
		const found = findEntry(layout[data.surface], data.uid);
		if (!found) {
			return;
		}
		if (data.surface == surface) {
			if (target && (target.uid == data.uid || contains(found.entry, target.uid))) {
				return;
			}
			found.list.splice(found.index, 1);
			entry = found.entry;
		} else {
			entry = cloneEntry(found.entry);
		}
	}
	const allowedSurfaces = ACTIONS[entry.action].surfaces;
	if (allowedSurfaces && !allowedSurfaces.includes(surface)) {
		setStatus(getMessage("menusPageOnly", [getActionLabel(entry.action)]));
		render();
		return;
	}
	if (!target) {
		layout[surface].push(entry);
	} else {
		const found = findEntry(layout[surface], target.uid);
		if (!found) {
			layout[surface].push(entry);
		} else if (position == "inside") {
			found.entry.children.push(entry);
		} else {
			found.list.splice(found.index + (position == "after" ? 1 : 0), 0, entry);
		}
	}
	selected = { surface, uid: entry.uid };
	setStatus("");
	commit();
}

function removeEntry(surface, uid) {
	const found = findEntry(layout[surface], uid);
	if (found) {
		found.list.splice(found.index, 1);
		if (selected && selected.uid == uid) {
			selected = null;
		}
		commit();
		const neighbour = found.list[found.index] || found.list[found.index - 1];
		focusEntry(neighbour && neighbour.uid);
	}
}

function moveEntry(surface, uid, delta) {
	const found = findEntry(layout[surface], uid);
	if (found) {
		const newIndex = found.index + delta;
		if (newIndex >= 0 && newIndex < found.list.length) {
			found.list.splice(found.index, 1);
			found.list.splice(newIndex, 0, found.entry);
			commit();
			focusEntry(uid);
		}
	}
}

function startRename(label, entry) {
	const input = document.createElement("input");
	input.type = "text";
	input.value = effectiveLabel(entry);
	const derivedLabel = effectiveLabel(Object.assign({}, entry, { label: undefined }));
	let done = false;
	const finish = () => {
		if (!done) {
			done = true;
			const value = input.value.trim();
			if (value && value != derivedLabel) {
				entry.label = value;
			} else {
				delete entry.label;
			}
			commit();
		}
	};
	input.addEventListener("click", event => event.stopPropagation());
	input.addEventListener("dblclick", event => event.stopPropagation());
	input.addEventListener("blur", finish);
	input.addEventListener("keydown", event => {
		if (event.key == "Enter") {
			finish();
		} else if (event.key == "Escape") {
			done = true;
			render();
		}
		event.stopPropagation();
	});
	label.replaceChildren(input);
	input.focus();
	input.select();
}

function renderInspector() {
	inspectorElement.replaceChildren();
	const found = selected && findEntry(layout[selected.surface], selected.uid);
	if (!found || selected.surface != currentSurface) {
		selected = null;
		inspectorElement.append(createParagraph(getMessage("menusInspectorEmpty")));
		return;
	}
	const entry = found.entry;
	const definition = ACTIONS[entry.action];
	const surface = selected.surface;
	if (definition.separator) {
		inspectorElement.append(createParagraph(getMessage("menusInspectorSeparator")));
		appendRemoveField(entry, surface);
		return;
	}
	const inlineProfiles = definition.dynamic == "profiles" && entry.inline;
	if (pageOnly(entry, surface)) {
		inspectorElement.append(createParagraph(getMessage("menusPageOnly", [getActionLabel(entry.action)])));
	} else if (unsupportedAction(entry.action)) {
		inspectorElement.append(createParagraph(getMessage("menusUnsupportedActionHelp")));
	} else if (needsProfiles(entry.action)) {
		inspectorElement.append(createParagraph(getMessage("menusProfilesHelp")));
	} else if (emptyContainer(entry, surface)) {
		inspectorElement.append(createParagraph(getMessage("menusEmptySubmenuHelp")));
	} else if (contextMismatch(entry, surface)) {
		inspectorElement.append(createParagraph(getMessage("menusContextHelp", [getMessage(CONTEXT_LABEL_KEYS[pageContext])])));
	}
	if (missingProfile(entry)) {
		inspectorElement.append(createParagraph(getMessage("menusProfileMissingHelp", [entry.profile])));
	}
	if (!inlineProfiles) {
		inspectorElement.append(createField(getMessage("menusLabelField"), () => {
			const input = document.createElement("input");
			input.type = "text";
			input.value = entry.label || "";
			input.placeholder = effectiveLabel(entry);
			input.addEventListener("change", () => {
				const value = input.value.trim();
				if (value) {
					entry.label = value;
				} else {
					delete entry.label;
				}
				commit();
			});
			return input;
		}, getMessage("menusLabelHelp")));
	}
	if (definition.bindable && profileNames.length > 1) {
		inspectorElement.append(createField(getMessage("menusProfileField"), () => {
			const select = document.createElement("select");
			const none = document.createElement("option");
			none.value = "";
			none.textContent = getMessage("menusProfileNone");
			select.append(none);
			profileNames.forEach(name => {
				const option = document.createElement("option");
				option.value = name;
				option.textContent = getProfileLabel(name);
				select.append(option);
			});
			select.value = entry.profile && profileNames.includes(entry.profile) ? entry.profile : "";
			select.addEventListener("change", () => {
				if (select.value) {
					entry.profile = select.value;
				} else {
					delete entry.profile;
				}
				commit();
			});
			return select;
		}, getMessage("menusProfileHelp")));
	}
	if (definition.dynamic == "profiles") {
		inspectorElement.append(createField(getMessage("menusPresentationField"), () => {
			const select = document.createElement("select");
			[["submenu", getMessage("menusPresentationSubmenu")], ["inline", getMessage("menusPresentationInline")]].forEach(([value, text]) => {
				const option = document.createElement("option");
				option.value = value;
				option.textContent = text;
				select.append(option);
			});
			select.value = entry.inline ? "inline" : "submenu";
			select.addEventListener("change", () => {
				if (select.value == "inline") {
					entry.inline = true;
				} else {
					delete entry.inline;
				}
				commit();
			});
			return select;
		}, getMessage("menusPresentationHelp")));
	}
	if (definition.dynamic && definition.dynamic != "profiles") {
		inspectorElement.append(createField(getMessage("menusContentsField"), () => createHelp(getMessage("menusContentsHelp"))));
	}
	if (surface == "page" && !definition.dynamic) {
		inspectorElement.append(createField(getMessage("menusContextsField"), () => {
			const wrapper = document.createElement("div");
			wrapper.className = "menus-contexts";
			const current = effectiveContexts(entry);
			CONTEXTS.forEach(context => {
				const label = document.createElement("label");
				const checkbox = document.createElement("input");
				checkbox.type = "checkbox";
				checkbox.checked = current.includes(context);
				checkbox.addEventListener("change", () => {
					const next = CONTEXTS.filter(candidate => candidate == context ? checkbox.checked : effectiveContexts(entry).includes(candidate));
					const standard = definition.contexts || CONTEXTS;
					if (next.length == standard.length && next.every(value => standard.includes(value))) {
						delete entry.contexts;
					} else {
						entry.contexts = next;
					}
					commit();
				});
				label.append(checkbox, document.createTextNode(getMessage(CONTEXT_LABEL_KEYS[context])));
				wrapper.append(label);
			});
			return wrapper;
		}, definition.altLabelKey ? getMessage("menusAltLabelHelp", [getMessage(definition.altLabelKey)]) : ""));
	}
	if (definition.container) {
		inspectorElement.append(createField(getMessage("menusSubmenuField"), () => createHelp(getMessage("menusSubmenuHelp", [String(entry.children.length)]))));
	}
	appendRemoveField(entry, surface);
}

function appendRemoveField(entry, surface) {
	inspectorElement.append(createField("", () => {
		const button = document.createElement("button");
		button.type = "button";
		button.textContent = getMessage("menusRemoveButton");
		button.addEventListener("click", () => removeEntry(surface, entry.uid));
		return button;
	}));
}

function createParagraph(text) {
	const paragraph = document.createElement("p");
	paragraph.className = "menus-empty";
	paragraph.textContent = text;
	return paragraph;
}

function createHelp(text) {
	const help = document.createElement("span");
	help.className = "menus-help";
	help.textContent = text;
	return help;
}

function createField(labelText, build, helpText) {
	const wrapper = document.createElement("div");
	wrapper.className = "menus-field";
	if (labelText) {
		const label = document.createElement("label");
		label.textContent = labelText;
		wrapper.append(label);
	}
	wrapper.append(build());
	if (helpText) {
		wrapper.append(createHelp(helpText));
	}
	return wrapper;
}

function setStatus(text) {
	statusLabel.textContent = text;
}

function commit() {
	render();
	save();
}

function save(menuLayout = serialize(layout)) {
	ownSaves.push(JSON.stringify(menuLayout ? normalizeLayout(menuLayout) : getDefaultLayout()));
	pendingSave = pendingSave
		.then(() => browser.runtime.sendMessage({ method: "config.setMenuLayout", menuLayout }))
		.catch(error => setStatus(getMessage("menusSaveError", [error.message || String(error)])));
	return pendingSave;
}

function addSelectedAction() {
	const found = selected && selected.surface == currentSurface && findEntry(layout[currentSurface], selected.uid);
	const inside = found && ACTIONS[found.entry.action].container;
	placeEntry(currentSurface, { action: addSelect.value }, found ? found.entry : null, inside ? "inside" : "after");
}

function bindEvents() {
	surfaceSelect.addEventListener("change", () => {
		currentSurface = surfaceSelect.value;
		selected = null;
		setStatus("");
		render();
	});
	addButton.addEventListener("click", addSelectedAction);
	addSelect.addEventListener("keydown", event => {
		if (event.key == "Enter") {
			event.preventDefault();
			addSelectedAction();
		}
	});
	copyButton.addEventListener("click", () => {
		const source = currentSurface;
		SURFACES.filter(surface => surface != source).forEach(surface => {
			layout[surface] = layout[source]
				.filter(entry => !ACTIONS[entry.action].surfaces || ACTIONS[entry.action].surfaces.includes(surface))
				.map(cloneEntry);
		});
		setStatus(getMessage("menusUseForAllStatus"));
		commit();
	});
	resetButton.addEventListener("click", () => {
		if (confirm(getMessage("menusResetConfirm"))) {
			layout = withUids(getDefaultLayout());
			selected = null;
			setStatus("");
			render();
			save(null);
		}
	});
	jsonApplyButton.addEventListener("click", () => {
		let data, ignored;
		try {
			const parsed = JSON.parse(jsonInput.value);
			data = normalizeLayout(parsed);
			if (data) {
				ignored = SURFACES.reduce((count, surface) => count + countEntries(parsed[surface]) - countEntries(data[surface]), 0);
			}
			// eslint-disable-next-line no-unused-vars
		} catch (error) {
			data = null;
		}
		if (data) {
			layout = withUids(data);
			selected = null;
			renderedJson = "";
			commit();
			setStatus(ignored ? getMessage("menusJsonIgnored", [String(ignored)]) : "");
		} else {
			setStatus(getMessage("menusJsonInvalid"));
		}
	});
	document.addEventListener("click", event => {
		if (!event.target.closest(".menus-item, .menus-inspector, .menus-json, button, input, select, label")) {
			if (selected) {
				selected = null;
				render();
			}
		}
	});
}
