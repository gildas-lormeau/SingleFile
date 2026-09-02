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

/* global browser, document */

const menusLabel = document.getElementById("menusLabel");
const menusEditorLabel = document.getElementById("menusEditorLabel");
const menusEditorLink = document.getElementById("menusEditorLink");
const menusStateLabel = document.getElementById("menusStateLabel");
const menusSection = document.getElementById("menusSection");

menusLabel.textContent = browser.i18n.getMessage("optionsMenusSubTitle");
menusEditorLabel.textContent = browser.i18n.getMessage("optionMenusEditor");
menusEditorLink.textContent = browser.i18n.getMessage("optionMenusEditorLink");

browser.runtime.sendMessage({ method: "config.getConstants" }).then(constants => menusSection.hidden = !constants.BROWSER_MENUS_API_SUPPORTED);
refreshState();
browser.storage.onChanged.addListener(changes => {
	if (Object.keys(changes).includes("menuLayout")) {
		refreshState();
	}
});

async function refreshState() {
	try {
		const { menuLayout } = await browser.runtime.sendMessage({ method: "config.getMenuLayout" });
		menusStateLabel.textContent = browser.i18n.getMessage(menuLayout ? "optionMenusCustomized" : "optionMenusDefault");
		// eslint-disable-next-line no-unused-vars
	} catch (error) {
		menusStateLabel.textContent = "";
	}
}
