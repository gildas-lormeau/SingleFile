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

/* global setTimeout, clearTimeout */

this.timeout = this.timeout || (() => {

	const TIMEOUT_STEP = 100;

	const timeoutIds = [];

	return {
		set(fn, delay) {
			const id = timeoutIds.length;
			let elapsedTime = 0;
			timeoutIds[id] = setTimeout(step, 0);
			return id;

			function step() {
				if (elapsedTime < delay) {
					timeoutIds[id] = setTimeout(() => {
						elapsedTime += TIMEOUT_STEP;
						step();
					}, TIMEOUT_STEP);
				}
				else {
					fn();
				}
			}
		},
		clear(id) {
			if (timeoutIds[id]) {
				clearTimeout(timeoutIds[id]);
				timeoutIds[id] = null;
			}
		}
	};

})();