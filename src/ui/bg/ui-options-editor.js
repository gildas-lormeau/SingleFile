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

/* global browser, document, alert */

const titleLabel = document.getElementById("titleLabel");

const optionsInput = document.getElementById("optionsInput");
const saveButton = document.getElementById("saveButton");

titleLabel.textContent = browser.i18n.getMessage("optionsEditorTitle");
saveButton.textContent = browser.i18n.getMessage("optionsEditorSaveButton");
const invalidJSONMessage = browser.i18n.getMessage("optionsEditorInvalidJSON");
const configSavedMessage = browser.i18n.getMessage("optionsEditorConfigSaved");

init();
saveButton.addEventListener("click", async () => {
    let config;
    try {
        config = JSON.parse(optionsInput.value);
        // eslint-disable-next-line no-unused-vars
    } catch (error) {
        alert(invalidJSONMessage);
    }
    if (config) {
        await browser.runtime.sendMessage({ method: "config.set", config });
        await refreshExternalComponents(config);
        alert(configSavedMessage);
    }
    saveButton.blur();
});

async function init() {
    const config = await browser.runtime.sendMessage({ method: "config.get" });
    optionsInput.value = JSON.stringify(config, null, 4);
}

async function refreshExternalComponents(config) {
    try {
        await browser.runtime.sendMessage({ method: "ui.refreshMenu" });
        for (const profileName of Object.keys(config.profiles)) {
            await browser.runtime.sendMessage({ method: "options.refresh", profileName });
            await browser.runtime.sendMessage({ method: "options.refreshPanel", profileName });
        }
        // eslint-disable-next-line no-unused-vars
    } catch (error) {
        // ignored
    }
}