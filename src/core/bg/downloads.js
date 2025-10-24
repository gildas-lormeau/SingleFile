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

/* global browser, singlefile, URL, fetch, document, Blob */

import * as config from "./config.js";
import * as bookmarks from "./bookmarks.js";
import * as companion from "./companion.js";
import * as business from "./business.js";
import * as editor from "./editor.js";
import { launchWebAuthFlow, extractAuthCode } from "./tabs-util.js";
import * as ui from "./../../ui/bg/index.js";
import * as woleet from "./../../lib/woleet/woleet.js";
import { GDrive } from "./../../lib/gdrive/gdrive.js";
import { Dropbox } from "./../../lib/dropbox/dropbox.js";
import { WebDAV } from "./../../lib/webdav/webdav.js";
import { GitHub } from "./../../lib/github/github.js";
import { S3 } from "./../../lib/s3/s3.js";
import { download } from "./download-util.js";
import * as yabson from "./../../lib/yabson/yabson.js";
import { RestFormApi } from "../../lib/../lib/rest-form-api/index.js";

const partialContents = new Map();
const tabData = new Map();
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];
const CONFLICT_ACTION_SKIP = "skip";
const CONFLICT_ACTION_UNIQUIFY = "uniquify";
const REGEXP_ESCAPE = /([{}()^$&.*?/+|[\\\\]|\]|-)/g;
let GDRIVE_CLIENT_ID = "207618107333-h1220p1oasj3050kr5r416661adm091a.apps.googleusercontent.com";
let GDRIVE_CLIENT_KEY = "VQJ8Gq8Vxx72QyxPyeLtWvUt";
const DROPBOX_CLIENT_ID = "s50p6litdvuzrtb";
const DROPBOX_CLIENT_KEY = "i1vzwllesr14fzd";

const gDriveOauth2 = browser.runtime.getManifest().oauth2;
if (gDriveOauth2) {
	GDRIVE_CLIENT_ID = gDriveOauth2.client_id;
	GDRIVE_CLIENT_KEY = gDriveOauth2.client_secret;
}
const gDrive = new GDrive(GDRIVE_CLIENT_ID, GDRIVE_CLIENT_KEY, SCOPES);
const dropbox = new Dropbox(DROPBOX_CLIENT_ID, DROPBOX_CLIENT_KEY);

export {
	onMessage,
	downloadPage,
	testSkipSave,
	saveToGDrive,
	saveToGitHub,
	saveToDropbox,
	saveWithWebDAV,
	saveToRestFormApi,
	saveToS3,
	encodeSharpCharacter
};

async function onMessage(message, sender) {
	if (message.method.endsWith(".download")) {
		return downloadTabPage(message, sender.tab);
	}
	if (message.method.endsWith(".disableGDrive")) {
		const authInfo = await config.getAuthInfo();
		config.removeAuthInfo();
		await gDrive.revokeAuthToken(authInfo && (authInfo.accessToken || authInfo.revokableAccessToken));
		return {};
	}
	if (message.method.endsWith(".disableDropbox")) {
		const authInfo = await config.getDropboxAuthInfo();
		config.removeDropboxAuthInfo();
		await dropbox.revokeAuthToken(authInfo && (authInfo.accessToken || authInfo.revokableAccessToken));
		return {};
	}
	if (message.method.endsWith(".end")) {
		if (message.hash) {
			try {
				await woleet.anchor(message.hash, message.woleetKey);
			} catch (error) {
				ui.onError(sender.tab.id, error.message, error.link);
			}
		}
		business.onSaveEnd(message.taskId);
		return {};
	}
	if (message.method.endsWith(".getInfo")) {
		return business.getTasksInfo();
	}
	if (message.method.endsWith(".cancel")) {
		if (message.taskId) {
			business.cancelTask(message.taskId);
		} else {
			business.cancel(sender.tab.id);
		}
		return {};
	}
	if (message.method.endsWith(".cancelAll")) {
		business.cancelAllTasks();
		return {};
	}
	if (message.method.endsWith(".saveUrls")) {
		business.saveUrls(message.urls);
		return {};
	}
}

async function downloadTabPage(message, tab) {
	const tabId = tab.id;
	let contents;
	if (message.blobURL) {
		try {
			if (message.compressContent) {
				message.pageData = await yabson.parse(new Uint8Array(await (await fetch(message.blobURL)).arrayBuffer()));
				await downloadCompressedContent(message, tab);
			} else {
				message.content = await (await fetch(message.blobURL)).text();
				await downloadContent([message.content], tab, tab.incognito, message);
			}
			// eslint-disable-next-line no-unused-vars
		} catch (error) {
			return { error: true };
		}
	} else if (message.compressContent) {
		let parser = tabData.get(tabId);
		if (!parser) {
			parser = yabson.getParser();
			tabData.set(tabId, parser);
		}
		if (message.data) {
			await parser.next(new Uint8Array(message.data));
		} else {
			tabData.delete(tabId);
			const result = await parser.next();
			const message = result.value;
			await downloadCompressedContent(message, tab);
		}
	} else {
		if (message.truncated) {
			contents = partialContents.get(tabId);
			if (!contents) {
				contents = [];
				partialContents.set(tabId, contents);
			}
			contents.push(message.content);
			if (message.finished) {
				partialContents.delete(tabId);
			}
		} else if (message.content) {
			contents = [message.content];
		}
		if (!message.truncated || message.finished) {
			await downloadContent(contents, tab, tab.incognito, message);
		}
	}
	return {};
}

async function downloadContent(contents, tab, incognito, message) {
	const tabId = tab.id;
	try {
		let skipped;
		if (message.backgroundSave && !message.saveToGDrive && !message.saveToDropbox && !message.saveWithWebDAV && !message.saveToGitHub && !message.saveToRestFormApi && !message.saveToS3) {
			const testSkip = await testSkipSave(message.filename, message);
			message.filenameConflictAction = testSkip.filenameConflictAction;
			skipped = testSkip.skipped;
		}
		if (skipped) {
			ui.onEnd(tabId);
		} else {
			const prompt = filename => promptFilename(tabId, filename);
			let response;
			if (message.openEditor) {
				ui.onEdit(tabId);
				await editor.open({ tabIndex: tab.index + 1, filename: message.filename, content: contents.join(""), url: message.originalUrl });
			} else if (message.saveToClipboard) {
				message.content = contents.join("");
				saveToClipboard(message);
			} else if (message.saveWithWebDAV) {
				response = await saveWithWebDAV(message.taskId, encodeSharpCharacter(message.filename), contents.join(""), message.webDAVURL, message.webDAVUser, message.webDAVPassword, { filenameConflictAction: message.filenameConflictAction, prompt });
			} else if (message.saveToGDrive) {
				await saveToGDrive(message.taskId, encodeSharpCharacter(message.filename), new Blob(contents, { type: message.mimeType }), {
					forceWebAuthFlow: message.forceWebAuthFlow
				}, {
					onProgress: (offset, size) => ui.onUploadProgress(tabId, offset, size),
					filenameConflictAction: message.filenameConflictAction,
					prompt
				});
			} else if (message.saveToDropbox) {
				await saveToDropbox(message.taskId, encodeSharpCharacter(message.filename), new Blob(contents, { type: message.mimeType }), {
					onProgress: (offset, size) => ui.onUploadProgress(tabId, offset, size),
					filenameConflictAction: message.filenameConflictAction,
					prompt
				});
			} else if (message.saveToGitHub) {
				response = await saveToGitHub(message.taskId, encodeSharpCharacter(message.filename), contents.join(""), message.githubToken, message.githubUser, message.githubRepository, message.githubBranch, {
					filenameConflictAction: message.filenameConflictAction,
					prompt
				});
				await response.pushPromise;
			} else if (message.saveWithCompanion) {
				await companion.save({
					filename: message.filename,
					content: message.content,
					filenameConflictAction: message.filenameConflictAction
				});
			} else if (message.saveToRestFormApi) {
				response = await saveToRestFormApi(
					message.taskId,
					message.filename,
					contents.join(""),
					tab.url,
					message.saveToRestFormApiToken,
					message.saveToRestFormApiUrl,
					message.saveToRestFormApiFileFieldName,
					message.saveToRestFormApiUrlFieldName
				);
			} else if (message.saveToS3) {
				response = await saveToS3(message.taskId, encodeSharpCharacter(message.filename), new Blob(contents, { type: message.mimeType }), message.S3Domain, message.S3Region, message.S3Bucket, message.S3AccessKey, message.S3SecretKey, {
					filenameConflictAction: message.filenameConflictAction,
					prompt
				});
			} else {
				message.url = URL.createObjectURL(new Blob(contents, { type: message.mimeType }));
				response = await downloadPage(message, {
					confirmFilename: message.confirmFilename,
					incognito,
					filenameConflictAction: message.filenameConflictAction,
					filenameReplacementCharacter: message.filenameReplacementCharacter,
					bookmarkId: message.bookmarkId,
					replaceBookmarkURL: message.replaceBookmarkURL,
					includeInfobar: message.includeInfobar,
					openInfobar: message.openInfobar,
					infobarPositionAbsolute: message.infobarPositionAbsolute,
					infobarPositionTop: message.infobarPositionTop,
					infobarPositionBottom: message.infobarPositionBottom,
					infobarPositionLeft: message.infobarPositionLeft,
					infobarPositionRight: message.infobarPositionRight
				});
				if (!response) {
					throw new Error("upload_cancelled");
				}
			}
			if (message.bookmarkId && message.replaceBookmarkURL && response && response.url) {
				await bookmarks.update(message.bookmarkId, { url: response.url });
			}
			ui.onEnd(tabId);
			if (message.openSavedPage && !message.openEditor) {
				const createTabProperties = { active: true, url: "/src/ui/pages/viewer.html?blobURI=" + URL.createObjectURL(new Blob(contents, { type: message.mimeType })), windowId: tab.windowId };
				if (tab.index != null) {
					createTabProperties.index = tab.index + 1;
				}
				browser.tabs.create(createTabProperties);
			}
		}
	} catch (error) {
		if (!error.message || error.message != "upload_cancelled") {
			console.error(error); // eslint-disable-line no-console
			ui.onError(tabId, error.message, error.link);
		}
	} finally {
		if (message.url) {
			URL.revokeObjectURL(message.url);
		}
	}
}

async function downloadCompressedContent(message, tab) {
	const tabId = tab.id;
	try {
		let skipped;
		if (message.backgroundSave && !message.saveToGDrive && !message.saveToDropbox && !message.saveWithWebDAV && !message.saveToGitHub && !message.saveToRestFormApi && !message.sharePage) {
			const testSkip = await testSkipSave(message.filename, message);
			message.filenameConflictAction = testSkip.filenameConflictAction;
			skipped = testSkip.skipped;
		}
		if (skipped) {
			ui.onEnd(tabId);
		} else {
			const pageData = message.pageData;
			const prompt = filename => promptFilename(tabId, filename);
			const blob = await singlefile.processors.compression.process(pageData, {
				insertTextBody: message.insertTextBody,
				url: pageData.url || tab.url,
				createRootDirectory: message.createRootDirectory,
				tabId,
				selfExtractingArchive: message.selfExtractingArchive,
				extractDataFromPage: message.extractDataFromPage,
				preventAppendedData: message.preventAppendedData,
				insertCanonicalLink: message.insertCanonicalLink,
				insertMetaNoIndex: message.insertMetaNoIndex,
				insertMetaCSP: message.insertMetaCSP,
				password: message.password,
				embeddedImage: message.embeddedImage
			});
			let response;
			if (message.openEditor) {
				ui.onEdit(tabId);
				await editor.open({
					tabIndex: tab.index + 1,
					filename: message.filename,
					content: Array.from(new Uint8Array(await blob.arrayBuffer())),
					compressContent: message.compressContent,
					selfExtractingArchive: message.selfExtractingArchive,
					extractDataFromPage: message.extractDataFromPage,
					insertTextBody: message.insertTextBody,
					insertMetaCSP: message.insertMetaCSP,
					embeddedImage: message.embeddedImage,
					url: message.originalUrl
				});
			} else if (message.foregroundSave || !message.backgroundSave || message.sharePage) {
				const response = await downloadPageForeground(message.taskId, message.filename, blob, pageData.mimeType, tabId, {
					foregroundSave: true,
					sharePage: message.sharePage
				});
				if (response.error) {
					throw new Error(response.error);
				}
			} else if (message.saveWithWebDAV) {
				response = await saveWithWebDAV(message.taskId, encodeSharpCharacter(message.filename), blob, message.webDAVURL, message.webDAVUser, message.webDAVPassword, { filenameConflictAction: message.filenameConflictAction, prompt });
			} else if (message.saveToGDrive) {
				await saveToGDrive(message.taskId, encodeSharpCharacter(message.filename), blob, {
					forceWebAuthFlow: message.forceWebAuthFlow
				}, {
					onProgress: (offset, size) => ui.onUploadProgress(tabId, offset, size),
					filenameConflictAction: message.filenameConflictAction,
					prompt
				});
			} else if (message.saveToDropbox) {
				await saveToDropbox(message.taskId, encodeSharpCharacter(message.filename), blob, {
					onProgress: (offset, size) => ui.onUploadProgress(tabId, offset, size),
					filenameConflictAction: message.filenameConflictAction,
					prompt
				});
			} else if (message.saveToGitHub) {
				response = await saveToGitHub(message.taskId, encodeSharpCharacter(message.filename), blob, message.githubToken, message.githubUser, message.githubRepository, message.githubBranch, {
					filenameConflictAction: message.filenameConflictAction,
					prompt
				});
				await response.pushPromise;
			} else if (message.saveToRestFormApi) {
				response = await saveToRestFormApi(
					message.taskId,
					message.filename,
					blob,
					tab.url,
					message.saveToRestFormApiToken,
					message.saveToRestFormApiUrl,
					message.saveToRestFormApiFileFieldName,
					message.saveToRestFormApiUrlFieldName
				);
			} else if (message.saveToS3) {
				response = await saveToS3(message.taskId, encodeSharpCharacter(message.filename), blob, message.S3Domain, message.S3Region, message.S3Bucket, message.S3AccessKey, message.S3SecretKey, {
					filenameConflictAction: message.filenameConflictAction,
					prompt
				});
			} else {
				message.url = URL.createObjectURL(blob);
				response = await downloadPage(message, {
					confirmFilename: message.confirmFilename,
					incognito: tab.incognito,
					filenameConflictAction: message.filenameConflictAction,
					filenameReplacementCharacter: message.filenameReplacementCharacter,
					bookmarkId: message.bookmarkId,
					replaceBookmarkURL: message.replaceBookmarkURL,
					includeInfobar: message.includeInfobar,
					openInfobar: message.openInfobar,
					infobarPositionAbsolute: message.infobarPositionAbsolute,
					infobarPositionTop: message.infobarPositionTop,
					infobarPositionBottom: message.infobarPositionBottom,
					infobarPositionLeft: message.infobarPositionLeft,
					infobarPositionRight: message.infobarPositionRight
				});
			}
			if (message.bookmarkId && message.replaceBookmarkURL && response && response.url) {
				await bookmarks.update(message.bookmarkId, { url: response.url });
			}
			ui.onEnd(tabId);
			if (message.openSavedPage && !message.openEditor) {
				const createTabProperties = { active: true, url: "/src/ui/pages/viewer.html?compressed&blobURI=" + URL.createObjectURL(blob), windowId: tab.windowId };
				if (tab.index != null) {
					createTabProperties.index = tab.index + 1;
				}
				browser.tabs.create(createTabProperties);
			}
		}
	} catch (error) {
		if (!error.message || error.message != "upload_cancelled") {
			console.error(error); // eslint-disable-line no-console
			ui.onError(tabId, error.message, error.link);
		}
	} finally {
		if (message.url) {
			URL.revokeObjectURL(message.url);
		}
	}
}

function encodeSharpCharacter(path) {
	return path.replace(/#/g, "%23");
}

function getRegExp(string) {
	return string.replace(REGEXP_ESCAPE, "\\$1");
}

async function getAuthInfo(authOptions, force) {
	let authInfo = await config.getAuthInfo();
	const options = {
		interactive: true,
		forceWebAuthFlow: authOptions.forceWebAuthFlow,
		launchWebAuthFlow: options => launchWebAuthFlow(options),
		extractAuthCode: authURL => extractAuthCode(authURL)
	};
	gDrive.setAuthInfo(authInfo, options);
	if (!authInfo || !authInfo.accessToken || force) {
		authInfo = await gDrive.auth(options);
		if (authInfo) {
			await config.setAuthInfo(authInfo);
		} else {
			await config.removeAuthInfo();
		}
	}
	return authInfo;
}

async function getDropboxAuthInfo(force) {
	let authInfo = await config.getDropboxAuthInfo();
	const options = {
		launchWebAuthFlow: options => launchWebAuthFlow(options),
		extractAuthCode: authURL => extractAuthCode(authURL)
	};
	dropbox.setAuthInfo(authInfo);
	if (!authInfo || !authInfo.accessToken || force) {
		authInfo = await dropbox.auth(options);
		if (authInfo) {
			await config.setDropboxAuthInfo(authInfo);
		} else {
			await config.removeDropboxAuthInfo();
		}
	}
	return authInfo;
}

async function saveToGitHub(taskId, filename, content, githubToken, githubUser, githubRepository, githubBranch, { filenameConflictAction, prompt }) {
	try {
		const taskInfo = business.getTaskInfo(taskId);
		if (!taskInfo || !taskInfo.cancelled) {
			const client = new GitHub(githubToken, githubUser, githubRepository, githubBranch);
			business.setCancelCallback(taskId, () => client.abort());
			return await client.upload(filename, content, { filenameConflictAction, prompt });
		}
	} catch (error) {
		throw new Error(error.message + " (GitHub)");
	}
}

async function saveToS3(taskId, filename, blob, domain, region, bucket, accessKey, secretKey, { filenameConflictAction, prompt }) {
	try {
		const taskInfo = business.getTaskInfo(taskId);
		if (!taskInfo || !taskInfo.cancelled) {
			const client = new S3(region, bucket, accessKey, secretKey, domain);
			business.setCancelCallback(taskId, () => client.abort());
			return await client.upload(filename, blob, { filenameConflictAction, prompt });
		}
	} catch (error) {
		throw new Error(error.message + " (S3)");
	}
}

async function saveWithWebDAV(taskId, filename, content, url, username, password, { filenameConflictAction, prompt }) {
	try {
		const taskInfo = business.getTaskInfo(taskId);
		if (!taskInfo || !taskInfo.cancelled) {
			const client = new WebDAV(url, username, password);
			business.setCancelCallback(taskId, () => client.abort());
			return await client.upload(filename, content, { filenameConflictAction, prompt });
		}
	} catch (error) {
		throw new Error(error.message + " (WebDAV)");
	}
}

async function saveToGDrive(taskId, filename, blob, authOptions, uploadOptions) {
	try {
		await getAuthInfo(authOptions);
		const taskInfo = business.getTaskInfo(taskId);
		if (!taskInfo || !taskInfo.cancelled) {
			return await gDrive.upload(filename, blob, uploadOptions, callback => business.setCancelCallback(taskId, callback));
		}
	}
	catch (error) {
		if (error.message == "invalid_token") {
			let authInfo;
			try {
				authInfo = await gDrive.refreshAuthToken();
			} catch (error) {
				if (error.message == "unknown_token") {
					authInfo = await getAuthInfo(authOptions, true);
				} else {
					throw new Error(error.message + " (Google Drive)");
				}
			}
			if (authInfo) {
				await config.setAuthInfo(authInfo);
			} else {
				await config.removeAuthInfo();
			}
			return await saveToGDrive(taskId, filename, blob, authOptions, uploadOptions);
		} else {
			throw new Error(error.message + " (Google Drive)");
		}
	}
}

async function saveToDropbox(taskId, filename, blob, uploadOptions) {
	try {
		await getDropboxAuthInfo();
		const taskInfo = business.getTaskInfo(taskId);
		if (!taskInfo || !taskInfo.cancelled) {
			return await dropbox.upload(filename, blob, uploadOptions, callback => business.setCancelCallback(taskId, callback));
		}
	}
	catch (error) {
		if (error.message == "invalid_token") {
			let authInfo;
			try {
				authInfo = await dropbox.refreshAuthToken();
			} catch (error) {
				if (error.message == "unknown_token") {
					authInfo = await getDropboxAuthInfo(true);
				} else {
					throw new Error(error.message + " (Dropbox)");
				}
			}
			if (authInfo) {
				await config.setDropboxAuthInfo(authInfo);
			} else {
				await config.removeDropboxAuthInfo();
			}
			return await saveToDropbox(taskId, filename, blob, uploadOptions);
		} else {
			throw new Error(error.message + " (Dropbox)");
		}
	}
}

async function testSkipSave(filename, options) {
	let skipped, filenameConflictAction = options.filenameConflictAction;
	if (filenameConflictAction == CONFLICT_ACTION_SKIP) {
		const downloadItems = await browser.downloads.search({
			filenameRegex: "(\\\\|/)" + getRegExp(filename) + "$",
			exists: true
		});
		if (downloadItems.length) {
			skipped = true;
		} else {
			filenameConflictAction = CONFLICT_ACTION_UNIQUIFY;
		}
	}
	return { skipped, filenameConflictAction };
}

function promptFilename(tabId, filename) {
	return browser.tabs.sendMessage(tabId, { method: "content.prompt", message: "Filename conflict, please enter a new filename", value: filename });
}

async function downloadPage(pageData, options) {
	const downloadInfo = {
		url: pageData.url,
		saveAs: options.confirmFilename,
		filename: pageData.filename,
		conflictAction: options.filenameConflictAction
	};
	if (options.incognito) {
		downloadInfo.incognito = true;
	}
	const downloadData = await download(downloadInfo, options.filenameReplacementCharacter);
	if (downloadData.filename) {
		let url = downloadData.filename;
		if (!url.startsWith("file:")) {
			if (url.startsWith("/")) {
				url = url.substring(1);
			}
			url = "file:///" + encodeSharpCharacter(url);
		}
		return { url };
	}
	if (downloadData.cancelled) {
		business.cancelTask(pageData.taskId);
	}
}

function saveToClipboard(pageData) {
	const command = "copy";
	document.addEventListener(command, listener);
	document.execCommand(command);
	document.removeEventListener(command, listener);

	function listener(event) {
		event.clipboardData.setData(pageData.mimeType, pageData.content);
		event.clipboardData.setData("text/plain", pageData.content);
		event.preventDefault();
	}
}

async function saveToRestFormApi(taskId, filename, content, url, token, restApiUrl, fileFieldName, urlFieldName) {
	try {
		const taskInfo = business.getTaskInfo(taskId);
		if (!taskInfo || !taskInfo.cancelled) {
			const client = new RestFormApi(token, restApiUrl, fileFieldName, urlFieldName);
			business.setCancelCallback(taskId, () => client.abort());
			return await client.upload(filename, content, url);
		}
	} catch (error) {
		throw new Error(error.message + " (RestFormApi)");
	}
}

async function downloadPageForeground(taskId, filename, content, mimeType, tabId, { foregroundSave, sharePage } = {}) {
	const serializer = yabson.getSerializer({
		filename,
		taskId,
		foregroundSave,
		sharePage,
		content: await content.arrayBuffer(),
		mimeType
	});
	for await (const data of serializer) {
		await browser.tabs.sendMessage(tabId, {
			method: "content.download",
			data: Array.from(data)
		});
	}
	return browser.tabs.sendMessage(tabId, { method: "content.download" });
}