/*
 * Copyright 2010-2025 Gildas Lormeau
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

/* global fetch, Blob, AbortController, TextDecoder, btoa */

const EMPTY_STRING = "";
const CONFLICT_ACTION_SKIP = "skip";
const CONFLICT_ACTION_UNIQUIFY = "uniquify";
const CONFLICT_ACTION_OVERWRITE = "overwrite";
const CONFLICT_ACTION_PROMPT = "prompt";
const EXTENSION_SEPARATOR = ".";
const INDEX_FILENAME_PREFIX = " (";
const INDEX_FILENAME_SUFFIX = ")";
const INDEX_FILENAME_REGEXP = /\s\((\d+)\)$/;
const ABORT_ERROR_NAME = "AbortError";
const CONTENT_TYPE_HEADER = "Content-Type";
const JSON_CONTENT_TYPE = "application/json";
const MCP_JSONRPC_VERSION = "2.0";
const BASE64_ENCODING = "base64";
const BASE64_CHUNK_SIZE = 0x8000;
const WRITE_FILE_TOOL = "write_file";
const GET_FILE_INFO_TOOL = "get_file_info";

export { MCP };

class MCP {
    constructor(serverUrl, authToken) {
        this.serverUrl = serverUrl;
        this.authToken = authToken;
        this.requestId = 0;
    }

    async upload(path, content, options) {
        this.controller = new AbortController();
        options.signal = this.controller.signal;
        options.serverUrl = this.serverUrl;
        options.authToken = this.authToken;
        options.getRequestId = () => ++this.requestId;
        if (content instanceof Blob) {
            const bytes = new Uint8Array(await content.arrayBuffer());
            try {
                content = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
            } catch (error) {
                if (!await supportsBase64(this.serverUrl, this.authToken, options.signal, options.getRequestId)) {
                    throw new Error("The MCP server does not support binary files (the write_file tool has no 'encoding' argument)", { cause: error });
                }
                content = toBase64(bytes);
                options.encoding = BASE64_ENCODING;
            }
        }
        return upload(path, content, options);
    }

    abort() {
        if (this.controller) {
            this.controller.abort();
        }
    }
}

async function upload(path, content, options) {
    const { filenameConflictAction, prompt, signal, serverUrl, authToken, getRequestId, encoding } = options;

    try {
        const existsResponse = await checkFileExists(serverUrl, authToken, path, signal, getRequestId);

        if (existsResponse.exists) {
            if (filenameConflictAction == CONFLICT_ACTION_SKIP) {
                return { url: path, skipped: true };
            } else if (filenameConflictAction == CONFLICT_ACTION_OVERWRITE) {
                // Continue to write
            } else if (filenameConflictAction == CONFLICT_ACTION_UNIQUIFY) {
                const { filenameWithoutExtension, extension, indexFilename } = splitFilename(path);
                options.indexFilename = indexFilename + 1;
                path = getFilename(filenameWithoutExtension, extension, options.indexFilename);
                return await upload(path, content, options);
            } else if (filenameConflictAction == CONFLICT_ACTION_PROMPT) {
                if (prompt) {
                    path = await prompt(path);
                    if (path) {
                        return await upload(path, content, options);
                    } else {
                        return { url: path, skipped: true };
                    }
                } else {
                    options.filenameConflictAction = CONFLICT_ACTION_UNIQUIFY;
                    return await upload(path, content, options);
                }
            }
        }

        const writeResponse = await writeFile(serverUrl, authToken, path, content, encoding, signal, getRequestId);

        if (writeResponse.success) {
            return { url: path };
        } else {
            throw new Error(writeResponse.error || "Failed to write file via MCP");
        }
    } catch (error) {
        if (error.name != ABORT_ERROR_NAME) {
            throw error;
        }
    }
}

async function checkFileExists(serverUrl, authToken, path, signal, getRequestId) {
    const data = await callTool(serverUrl, authToken, GET_FILE_INFO_TOOL, { path }, signal, getRequestId);
    return { exists: Boolean(data.result && !data.result.isError) };
}

async function writeFile(serverUrl, authToken, path, content, encoding, signal, getRequestId) {
    const toolArguments = { path, content };
    if (encoding) {
        toolArguments.encoding = encoding;
    }
    const data = await callTool(serverUrl, authToken, WRITE_FILE_TOOL, toolArguments, signal, getRequestId);
    if (data.error) {
        throw new Error(data.error.message);
    }
    return { success: true };
}

async function supportsBase64(serverUrl, authToken, signal, getRequestId) {
    const data = await callMethod(serverUrl, authToken, "tools/list", {}, signal, getRequestId);
    const tools = (data.result && data.result.tools) || [];
    const writeFileTool = tools.find(tool => tool.name == WRITE_FILE_TOOL);
    const properties = writeFileTool && writeFileTool.inputSchema && writeFileTool.inputSchema.properties;
    return Boolean(properties && properties.encoding);
}

function callTool(serverUrl, authToken, name, toolArguments, signal, getRequestId) {
    return callMethod(serverUrl, authToken, "tools/call", { name, arguments: toolArguments }, signal, getRequestId);
}

async function callMethod(serverUrl, authToken, method, params, signal, getRequestId) {
    const headers = {
        [CONTENT_TYPE_HEADER]: JSON_CONTENT_TYPE,
        "Accept": "application/json, text/event-stream"
    };
    if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
    }
    const response = await fetch(serverUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ jsonrpc: MCP_JSONRPC_VERSION, id: getRequestId(), method, params }),
        signal
    });
    if (!response.ok) {
        throw new Error(`MCP server error: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

function toBase64(bytes) {
    let binary = "";
    for (let index = 0; index < bytes.length; index += BASE64_CHUNK_SIZE) {
        binary += String.fromCharCode.apply(null, bytes.subarray(index, index + BASE64_CHUNK_SIZE));
    }
    return btoa(binary);
}

function splitFilename(filename) {
    let filenameWithoutExtension = filename;
    let extension = EMPTY_STRING;
    const indexExtensionSeparator = filename.lastIndexOf(EXTENSION_SEPARATOR);
    if (indexExtensionSeparator > -1) {
        filenameWithoutExtension = filename.substring(0, indexExtensionSeparator);
        extension = filename.substring(indexExtensionSeparator + 1);
    }
    let indexFilename;
    ({ filenameWithoutExtension, indexFilename } = extractIndexFilename(filenameWithoutExtension));
    return { filenameWithoutExtension, extension, indexFilename };
}

function extractIndexFilename(filenameWithoutExtension) {
    const indexFilenameMatch = filenameWithoutExtension.match(INDEX_FILENAME_REGEXP);
    let indexFilename = 0;
    if (indexFilenameMatch && indexFilenameMatch.length > 1) {
        const parsedIndexFilename = Number(indexFilenameMatch[indexFilenameMatch.length - 1]);
        if (!Number.isNaN(parsedIndexFilename)) {
            indexFilename = parsedIndexFilename;
            filenameWithoutExtension = filenameWithoutExtension.replace(INDEX_FILENAME_REGEXP, EMPTY_STRING);
        }
    }
    return { filenameWithoutExtension, indexFilename };
}

function getFilename(filenameWithoutExtension, extension, indexFilename) {
    return filenameWithoutExtension +
        INDEX_FILENAME_PREFIX + indexFilename + INDEX_FILENAME_SUFFIX +
        (extension ? EXTENSION_SEPARATOR + extension : EMPTY_STRING);
}
