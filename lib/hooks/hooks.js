/*
 * Copyright 2010-2019 Gildas Lormeau
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

/* global history, dispatchEvent, CustomEvent, document, HTMLDocument */

this.hooks = this.hooks || (() => {

	if (document instanceof HTMLDocument) {
		const scriptElement = document.createElement("script");
		scriptElement.textContent = `(${hookPushState.toString()})()`;
		document.appendChild(scriptElement);
		scriptElement.remove();
	}

	return true;

	function hookPushState() {
		const pushState = history.pushState;
		let warningDisplayed;
		history.pushState = function (state, title, url) {
			if (!warningDisplayed) {
				warningDisplayed = true;
				console.warn("SingleFile is hooking the history.pushState API to detect navigation."); // eslint-disable-line no-console		
			}
			dispatchEvent(new CustomEvent("single-file-push-state", { detail: { state, title, url } }));
			pushState.call(history, state, title, url);
		};
	}

})();