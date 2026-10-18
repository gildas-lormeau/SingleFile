import test from "node:test";
import assert from "node:assert/strict";
import { setImmediate } from "node:timers/promises";

const stored = { rules: [] };
const items = new Map();
const tab = { id: 1, url: "https://example.com/page" };
const storage = {
	async get(keys) {
		return keys ? Object.fromEntries(keys.map(key => [key, stored[key]])) : { ...stored };
	},
	async set(values) {
		Object.assign(stored, values);
	},
	async remove(keys) {
		keys.forEach(key => delete stored[key]);
	}
};
globalThis.browser = {
	storage: { local: storage, onChanged: { addListener() { } } },
	tabs: { async query() { return []; } },
	i18n: { getMessage(key) { return key; } },
	browserAction: { onClicked: { addListener() { } } },
	menus: {
		onClicked: { addListener() { } },
		create(item) { items.set(item.id, { ...item }); },
		async update(id, changes) { Object.assign(items.get(id), changes); },
		async removeAll() { items.clear(); }
	}
};

// Exercise the real profile/rule resolution and menu lifecycle; only the browser
// APIs are replaced. In particular, a wildcard rule is not a domain-specific rule.
const config = await import("../src/core/bg/config.js");
const tabsData = await import("../src/core/bg/tabs-data.js");
await config.getProfiles();
await config.onMessage({ method: "config.createProfile", profileName: "Work" });
await tabsData.set({ profileName: "Work" });
const menus = await import("../src/ui/bg/ui-menus.js");
await setImmediate();

const cases = [
	{ name: "no domain rule inherits the selected global profile", rules: [], selected: "-", title: "menuCreateDomainRule", effective: "Work" },
	{ name: "an explicit default profile rule remains selected", rules: [rule("example.com", "__Default_Settings__")], selected: "profileDefaultSettings", title: "menuUpdateRule", effective: "__Default_Settings__" },
	{ name: "an explicit current profile rule remains selected", rules: [rule("example.com", "-")], selected: "-", title: "menuUpdateRule", effective: "Work" },
	{ name: "an explicit named profile rule remains selected", rules: [rule("example.com", "Work")], selected: "Work", title: "menuUpdateRule", effective: "Work" },
	{ name: "a wildcard does not select a domain-specific profile", rules: [rule("*", "Work")], selected: "-", title: "menuCreateDomainRule", effective: "Work" },
	{ name: "a domain rule overrides a wildcard in the menu", rules: [rule("*", "Work"), rule("example.com", "__Default_Settings__")], selected: "profileDefaultSettings", title: "menuUpdateRule", effective: "__Default_Settings__" }
];

for (const { name, rules, selected, title, effective } of cases) {
	test(name, async () => {
		stored.rules = rules;
		await menus.refreshTab(tab);
		assertSelection(selected);
		await menus.onTabActivated(tab);
		assertSelection(selected, title);
		assert.equal(await config.onMessage({ method: "config.getProfileName", url: tab.url }), effective);
	});
}

test("switching from a ruled domain clears its selection on an unruled domain", async () => {
	stored.rules = [rule("example.com", "Work")];
	await menus.refreshTab(tab);
	await menus.onTabActivated(tab);
	assertSelection("Work", "menuUpdateRule");
	await menus.onTabActivated({ id: 2, url: "https://unruled.example/page" });
	assertSelection("-", "menuCreateDomainRule");
});

function rule(url, profile) {
	return { url, profile, autoSaveProfile: profile };
}

function assertSelection(selected, title) {
	const currentItems = [...items.values()].filter(item => item.id.endsWith("-current"));
	assert.ok(currentItems.length > 0, "domain-profile menus were created");
	for (const { parentId } of currentItems) {
		const checked = [...items.values()].filter(item => item.parentId == parentId && item.checked);
		assert.deepEqual(checked.map(item => item.title), [selected], parentId);
		if (title) {
			assert.equal(items.get(parentId).title, title, parentId);
		}
	}
}
