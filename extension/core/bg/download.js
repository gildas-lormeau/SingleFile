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

/* global browser, singlefile, Blob, URL, document */

singlefile.download = (() => {

	const partialContents = new Map();

	return {
		onMessage,
		downloadPage
	};

	function onMessage(message, sender) {
		if (message.method.endsWith(".download")) {
			if (message.truncated) {
				let partialContent = partialContents.get(sender.tab.id);
				if (!partialContent) {
					partialContent = [];
					partialContents.set(sender.tab.id, partialContent);
				}
				partialContent.push(message.content);
				if (message.finished) {
					partialContents.delete(sender.tab.id);
					if (message.saveToClipboard) {
						message.content = partialContent.join("");
					} else {
						message.url = URL.createObjectURL(new Blob(partialContent, { type: "text/html" }));
					}
				} else {
					return Promise.resolve({});
				}
			} else if (message.content && !message.saveToClipboard) {
				message.url = URL.createObjectURL(new Blob([message.content], { type: "text/html" }));
			}
			if (message.saveToClipboard) {
				saveToClipboard(message);
			} else {
				return downloadPage(message, { confirmFilename: message.confirmFilename, incognito: sender.tab.incognito, filenameConflictAction: message.filenameConflictAction })
					.catch(error => {
						if (error.message) {
							if (error.message.includes("'incognito'")) {
								return downloadPage(message, { confirmFilename: message.confirmFilename, filenameConflictAction: message.filenameConflictAction });
							} else if (error.message == "conflictAction prompt not yet implemented") {
								return downloadPage(message, { confirmFilename: message.confirmFilename });
							} else if (error.message.includes("illegal characters")) {
								message.filename = message.filename.replace(/,/g, "_");
								return downloadPage(message, { confirmFilename: message.confirmFilename, incognito: sender.tab.incognito, filenameConflictAction: message.filenameConflictAction });
							} else {
								throw error;
							}
						} else {
							throw error;
						}
					});
			}
		}
	}

	async function downloadPage(page, options) {
		const downloadInfo = {
			url: page.url,
			saveAs: options.confirmFilename,
			filename: page.filename,
			conflictAction: options.filenameConflictAction
		};
		if (options.incognito) {
			downloadInfo.incognito = true;
		}
		let downloadId;
		try {
			downloadId = await browser.downloads.download(downloadInfo);
		} catch (error) {
			if (error.message) {
				if (!error.message.toLowerCase().includes("canceled")) {
					throw error;
				}
			} else {
				throw error;
			}
		}
		return new Promise((resolve, reject) => {
			browser.downloads.onChanged.addListener(onChanged);

			function onChanged(event) {
				if (event.id == downloadId && event.state) {
					if (event.state.current == "complete") {
						URL.revokeObjectURL(page.url);
						resolve({});
						browser.downloads.onChanged.removeListener(onChanged);
					}
					if (event.state.current == "interrupted" && (!event.error || event.error.current != "USER_CANCELED")) {
						URL.revokeObjectURL(page.url);
						reject(new Error(event.state.current));
						browser.downloads.onChanged.removeListener(onChanged);
					}
				}
			}
		});
	}

	function saveToClipboard(page) {
		const command = "copy";
		document.addEventListener(command, listener);
		document.execCommand(command);
		document.removeEventListener(command, listener);

		function listener(event) {
			event.clipboardData.setData("text/html", page.content);
			event.clipboardData.setData("text/plain", page.content);
			event.preventDefault();
		}
	}

})();
