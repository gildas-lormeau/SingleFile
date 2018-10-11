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

/* global browser, document, timeout, MutationObserver */

this.lazyLoader = this.lazyLoader || (() => {

	const LAZY_LOADING_TIMEOUT = 500;
	const MAX_LAZY_LOADING_TIMEOUT = 30000;

	return {
		process: () => lazyLoadResources()
	};

	async function lazyLoadResources() {
		const scriptURL = browser.runtime.getURL("lib/lazy/lazy-loader-before.js");
		const scriptBeforeElement = document.createElement("script");
		scriptBeforeElement.src = scriptURL;
		document.body.appendChild(scriptBeforeElement);
		let timeoutId;
		const promise = new Promise(resolve => {
			scriptBeforeElement.onload = () => scriptBeforeElement.remove();
			const observer = new MutationObserver(mutationsList => {
				mutationsList.forEach(mutation => {
					if (mutation.attributeName == "src" || mutation.attributeName == "srcset") {
						timeoutId = deferLazyLoadEnd(timeoutId, observer, resolve);
					}
				});
			});
			observer.observe(document, { attributes: true, childList: true, subtree: true });
			timeoutId = deferLazyLoadEnd(timeoutId, observer, resolve);
			timeout.set(() => {
				timeout.clear(timeoutId);
				lazyLoadEnd(observer, resolve);
			}, MAX_LAZY_LOADING_TIMEOUT);
		});
		return promise;
	}

	function deferLazyLoadEnd(timeoutId, observer, resolve) {
		timeout.clear(timeoutId);
		return timeout.set(() => lazyLoadEnd(observer, resolve), LAZY_LOADING_TIMEOUT);
	}

	function lazyLoadEnd(observer, resolve) {
		resolve();
		const scriptURL = browser.runtime.getURL("lib/lazy/lazy-loader-after.js");
		const scriptAfterElement = document.createElement("script");
		scriptAfterElement.src = scriptURL;
		document.body.appendChild(scriptAfterElement);
		scriptAfterElement.onload = () => scriptAfterElement.remove();
		observer.disconnect();
	}

})();