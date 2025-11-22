#!/usr/bin/env node

/* eslint-disable no-console */
/* global process */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import cors from "cors";
import express from "express";
import * as z from "zod";

const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";
const MCP_ENDPOINT = "/mcp";
const DEFAULT_SAVE_DIR = "./saved-pages";
const DEFAULT_BODY_SIZE_LIMIT_MB = 100;

const CORS_ORIGIN = "*";
const CORS_HEADERS = ["Content-Type", "Accept", "Mcp-Session-Id"];
const CORS_EXPOSED_HEADERS = ["Mcp-Session-Id"];
const SERVER_NAME = "filesystem";
const SERVER_VERSION = "1.0.0";
const CONTENT_TYPE_TEXT = "text";
const CONTENT_ENCODING_UTF8 = "utf-8";
const JSONRPC_VERSION = "2.0";
const ERROR_CODE_INTERNAL = -32603;
const FILE_NOT_FOUND_CODE = "ENOENT";
const TITLE_TEXT = "MCP Filesystem Server for SingleFile";
const SEPARATOR_TEXT = "═".repeat(80);
const HELP_TEXT = `
${TITLE_TEXT}

Usage:
  node server.js [save-directory] [--limit=<size-in-mb>]

Arguments:
  save-directory     Directory where files will be saved (default: ./saved-pages)
  --limit=<mb>       Maximum request body size in MB (default: 100)
                     Use higher values for large HTML files (e.g., --limit=200)

Environment:
  PORT               Server port (default: 3000)

Examples:
  node server.js
  node server.js /path/to/saves
  node server.js --limit=200
  node server.js /path/to/saves --limit=150
  PORT=8080 node server.js --limit=200
`;
let SAVE_DIR;
let BODY_SIZE_LIMIT;

await main();

async function main() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const args = process.argv.slice(2);
    if (args.includes("--help") || args.includes("-h")) {
        console.log(HELP_TEXT);
        process.exit(0);
    }
    let saveDir = path.join(__dirname, DEFAULT_SAVE_DIR);
    let bodySizeLimitMB = DEFAULT_BODY_SIZE_LIMIT_MB;
    for (const arg of args) {
        if (arg.startsWith("--limit=")) {
            const limitValue = parseInt(arg.split("=")[1], 10);
            if (!isNaN(limitValue) && limitValue > 0) {
                bodySizeLimitMB = limitValue;
            } else {
                console.error(`Invalid limit value: ${arg}. Using default 100MB.`);
            }
        } else if (!arg.startsWith("--")) {
            saveDir = arg;
        }
    }
    BODY_SIZE_LIMIT = `${bodySizeLimitMB}mb`;
    SAVE_DIR = saveDir;
    try {
        await start();
    } catch (err) {
        console.error("Failed to start:", err);
        process.exit(1);
    }
}

async function start() {
    await fs.mkdir(SAVE_DIR, { recursive: true });
    const mcpServer = createMcpServer();
    const app = express();
    app.use(express.json({ limit: BODY_SIZE_LIMIT }));
    app.use(express.urlencoded({ limit: BODY_SIZE_LIMIT, extended: true }));
    app.use(cors({
        origin: CORS_ORIGIN,
        credentials: true,
        exposedHeaders: CORS_EXPOSED_HEADERS,
        allowedHeaders: CORS_HEADERS
    }));
    app.post(MCP_ENDPOINT, async (req, res) => {
        try {
            const transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: undefined,
                enableJsonResponse: true
            });
            res.on("close", async () => {
                try {
                    await transport.close();
                } catch {
                    // ignored
                }
            });
            await mcpServer.connect(transport);
            await transport.handleRequest(req, res, req.body);
        } catch (error) {
            console.error("MCP error:", error);
            if (!res.headersSent) {
                res.status(500).json({
                    jsonrpc: JSONRPC_VERSION,
                    error: { code: ERROR_CODE_INTERNAL, message: error.message },
                    id: null
                });
            }
        }
    });
    app.listen(PORT, HOST, () => {
        console.log(SEPARATOR_TEXT);
        console.log(`  ${TITLE_TEXT}`);
        console.log(SEPARATOR_TEXT);
        console.log(`   Endpoint: http://localhost:${PORT}${MCP_ENDPOINT}`);
        console.log(`   Directory: ${SAVE_DIR}`);
        console.log(SEPARATOR_TEXT + "\n");
    });
}

function createMcpServer() {
    const server = new McpServer({
        name: SERVER_NAME,
        version: SERVER_VERSION
    });
    server.registerTool(
        "write_file",
        {
            title: "Write File",
            description: "Create or overwrite a file with content",
            inputSchema: {
                path: z.string(),
                content: z.string()
            }
        },
        async ({ path: filePath, content }) => {
            const sanitized = sanitizePath(filePath);
            const fullPath = path.join(SAVE_DIR, sanitized);
            const dir = path.dirname(fullPath);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(fullPath, content, CONTENT_ENCODING_UTF8);
            const text = `Successfully wrote to ${sanitized}`;
            return {
                content: [{ type: CONTENT_TYPE_TEXT, text }]
            };
        }
    );
    server.registerTool(
        "get_file_info",
        {
            title: "Get File Info",
            description: "Get file metadata",
            inputSchema: {
                path: z.string()
            }
        },
        async ({ path: filePath }) => {
            const sanitized = sanitizePath(filePath);
            const fullPath = path.join(SAVE_DIR, sanitized);
            try {
                const stats = await fs.stat(fullPath);
                const info = {
                    size: stats.size,
                    created: stats.birthtime.toISOString(),
                    modified: stats.mtime.toISOString(),
                    isDirectory: stats.isDirectory(),
                    isFile: stats.isFile()
                };
                const text = Object.entries(info)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join("\n");
                return {
                    content: [{ type: CONTENT_TYPE_TEXT, text }]
                };
            } catch (error) {
                if (error.code === FILE_NOT_FOUND_CODE) {
                    throw new Error(`File not found: ${sanitized}`);
                }
                throw error;
            }
        }
    );
    return server;
}

function sanitizePath(filePath) {
    const normalized = path.normalize(filePath);
    if (normalized.includes("..")) {
        throw new Error("Invalid path: directory traversal detected");
    }
    return normalized;
}