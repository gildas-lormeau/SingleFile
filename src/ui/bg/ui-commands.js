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

import { queryTabs } from "./../../core/bg/tabs-util.js";
import * as config from "./../../core/bg/config.js";

const commands = browser.commands;
const BROWSER_COMMANDS_API_SUPPORTED = commands && commands.onCommand && commands.onCommand.addListener;

let business;

export {
	init
};

function init(businessApi) {
	business = businessApi;
}

if (BROWSER_COMMANDS_API_SUPPORTED) {
	commands.onCommand.addListener(async command => {
		if (command == "save-selected-tabs") {
			const highlightedTabs = await queryTabs({ currentWindow: true, highlighted: true });
			business.saveTabs(highlightedTabs, { optionallySelected: true });
		} else if (command == "save-all-tabs") {
			const tabs = await queryTabs({ currentWindow: true });
			business.saveTabs(tabs);
		} else if (command.startsWith("custom-command-")) {
			const profiles = await config.getProfiles();
			let selectedProfile;
			Object.keys(profiles).some(profile => {
				if (profiles[profile].customShortcut == command) {
					selectedProfile = profile;
					return true;
				}
				return false;
			});
			if (selectedProfile) {
				const highlightedTabs = await queryTabs({ currentWindow: true, highlighted: true });
				business.saveTabs(highlightedTabs, profiles[selectedProfile]);
			}
		}
	});
}