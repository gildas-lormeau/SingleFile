/* eslint-disable no-console */
/* global process, Buffer, fetch */

import { createHmac, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const USAGE = `usage: node tools/amo-release-notes.mjs --notes <file> [--version <version>] [--dry-run] [--yes]

Sets the "What's new" text of a version on addons.mozilla.org, which the release
workflow does not send.

  --notes <file>    one item per line, a leading "- " optional, "#" lines ignored
  --version <v>     defaults to the most recent listed version
  --dry-run         show what would be sent, write nothing
  --yes             do not ask for confirmation

Credentials come from MOZILLA_JWT_ISSUER and MOZILLA_JWT_SECRET, or from
.amo-key at the repository root: issuer on the first line, secret on the second.`;

const ADDON = "single-file";
const API = "https://addons.mozilla.org/api/v5";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

main().catch(error => {
	console.error(error.message);
	process.exit(1);
});

async function main() {
	const options = parseArgs(process.argv.slice(2));
	if (options.help) {
		console.log(USAGE);
		return;
	}
	if (!options.notes) {
		throw new Error(`--notes is required\n\n${USAGE}`);
	}
	const releaseNotes = toReleaseNotes(readFileSync(options.notes, "utf8"));
	if (!releaseNotes) {
		throw new Error(`no items found in ${options.notes}`);
	}
	const credentials = loadCredentials();
	const version = await findVersion(credentials, options.version);
	console.log(`version ${version.version} (id ${version.id})`);
	console.log(`current: ${version.release_notes ? Object.values(version.release_notes)[0] : "NONE"}`);
	console.log(`new    : ${releaseNotes}`);
	if (options.dryRun) {
		console.log("dry run, nothing written");
		return;
	}
	if (!options.yes && !await confirm()) {
		console.log("cancelled");
		return;
	}
	await request(credentials, `${API}/addons/addon/${ADDON}/versions/${version.id}/`, {
		method: "PATCH",
		body: JSON.stringify({ release_notes: { "en-US": releaseNotes } })
	});
	const stored = await findVersion(credentials, version.version);
	console.log(`stored : ${stored.release_notes ? Object.values(stored.release_notes)[0] : "NONE"}`);
	if (!stored.release_notes) {
		throw new Error("the release notes were not stored");
	}
}

function parseArgs(args) {
	const options = {};
	for (let index = 0; index < args.length; index++) {
		const arg = args[index];
		if (arg == "--notes") {
			options.notes = args[++index];
		} else if (arg == "--version") {
			options.version = args[++index];
		} else if (arg == "--dry-run") {
			options.dryRun = true;
		} else if (arg == "--yes") {
			options.yes = true;
		} else if (arg == "--help" || arg == "-h") {
			options.help = true;
		} else {
			throw new Error(`unknown argument "${arg}"\n\n${USAGE}`);
		}
	}
	return options;
}

function toReleaseNotes(text) {
	const items = text.split("\n")
		.map(line => line.trim())
		.filter(line => line && !line.startsWith("#"))
		.map(line => line.replace(/^[-*]\s+/, ""))
		.map(line => `<li>${escapeHTML(line)}</li>`);
	return items.length ? `<ul>${items.join("")}</ul>` : "";
}

function escapeHTML(text) {
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function loadCredentials() {
	let issuer = process.env.MOZILLA_JWT_ISSUER;
	let secret = process.env.MOZILLA_JWT_SECRET;
	if (!issuer || !secret) {
		const path = join(ROOT, ".amo-key");
		let lines;
		try {
			lines = readFileSync(path, "utf8").split("\n");
		} catch (error) {
			throw new Error(`set MOZILLA_JWT_ISSUER and MOZILLA_JWT_SECRET, or create ${path}`, { cause: error });
		}
		issuer = issuer || (lines[0] || "").trim();
		secret = secret || (lines[1] || "").trim();
	}
	if (!issuer || !secret) {
		throw new Error("the issuer or the secret is empty");
	}
	return { issuer: issuer.trim(), secret: secret.trim() };
}

function token({ issuer, secret }) {
	const issuedAt = Math.floor(Date.now() / 1000);
	const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
	const payload = base64url(JSON.stringify({
		iss: issuer,
		jti: randomBytes(16).toString("hex"),
		iat: issuedAt,
		exp: issuedAt + 60
	}));
	const signature = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
	return `${header}.${payload}.${signature}`;
}

function base64url(text) {
	return Buffer.from(text).toString("base64url");
}

async function request(credentials, url, init = {}) {
	const response = await fetch(url, {
		...init,
		headers: {
			Authorization: `JWT ${token(credentials)}`,
			"Content-Type": "application/json",
			...init.headers
		}
	});
	const text = await response.text();
	if (!response.ok) {
		throw new Error(`${init.method || "GET"} ${url} -> ${response.status} ${text.slice(0, 400)}`);
	}
	return text ? JSON.parse(text) : {};
}

async function findVersion(credentials, wanted) {
	let url = `${API}/addons/addon/${ADDON}/versions/?page_size=50`;
	while (url) {
		const page = await request(credentials, url);
		if (!wanted) {
			if (!page.results.length) {
				throw new Error("no versions listed");
			}
			return page.results[0];
		}
		const found = page.results.find(version => version.version == wanted);
		if (found) {
			return found;
		}
		url = page.next;
	}
	throw new Error(`version ${wanted} not found`);
}

function confirm() {
	const input = createInterface({ input: process.stdin, output: process.stdout });
	return new Promise(resolve => input.question("write these notes? [y/N] ", answer => {
		input.close();
		resolve(answer.trim().toLowerCase() == "y");
	}));
}
