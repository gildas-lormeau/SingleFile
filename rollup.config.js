import { terser } from "rollup-plugin-terser";
import resolve from "@rollup/plugin-node-resolve";

const PLUGINS = [resolve({ moduleDirectories: ["node_modules"] })];
const EXTERNAL = ["single-file-core"];

export default [{
	input: ["src/single-file/single-file.js"],
	output: [{
		file: "lib/single-file.js",
		format: "umd",
		name: "singlefile",
		plugins: [terser()]
	}],
	plugins: PLUGINS,
	external: EXTERNAL
}, {
	input: ["src/single-file/single-file-frames.js"],
	output: [{
		file: "lib/single-file-frames.js",
		format: "umd",
		name: "singlefile",
		plugins: [terser()]
	}],
	plugins: PLUGINS,
	external: EXTERNAL
}, {
	input: ["src/single-file/single-file-bootstrap.js"],
	output: [{
		file: "lib/single-file-bootstrap.js",
		format: "umd",
		name: "singlefileBootstrap",
		plugins: [terser()]
	}],
	plugins: PLUGINS,
	external: EXTERNAL
}, {
	input: ["src/common/ui/content/content-infobar.js"],
	output: [{
		file: "lib/infobar.js",
		format: "umd",
		name: "infobar",
		plugins: [terser()]
	}]
}, {
	input: ["src/extension/core/content/content-bootstrap.js"],
	output: [{
		file: "lib/extension-bootstrap.js",
		format: "iife",
		plugins: [terser()]
	}]
}, {
	input: ["src/extension/core/content/content-frames.js"],
	output: [{
		file: "lib/extension-frames.js",
		format: "iife",
		plugins: [terser()]
	}]
}, {
	input: ["src/extension/index.js"],
	output: [{
		file: "lib/extension-core.js",
		format: "umd",
		name: "extension",
		plugins: [terser()]
	}]
}, {
	input: ["src/extension/core/content/content.js"],
	output: [{
		file: "lib/extension.js",
		format: "iife",
		plugins: [terser()]
	}]
}, {
	input: ["src/single-file/single-file-hooks-web.js"],
	output: [{
		file: "lib/single-file-hooks.js",
		format: "iife",
		plugins: [terser()]
	}],
	plugins: PLUGINS,
	external: EXTERNAL
}, {
	input: ["src/single-file/single-file-hooks-frames-web.js"],
	output: [{
		file: "lib/single-file-hooks-frames.js",
		format: "iife",
		plugins: [terser()]
	}],
	plugins: PLUGINS,
	external: EXTERNAL
}, {
	input: ["src/common/ui/content/content-infobar-web.js"],
	output: [{
		file: "lib/single-file-infobar.js",
		format: "iife",
		plugins: [terser()]
	}]
}, {
	input: ["src/extension/ui/content/content-ui-editor-init-web.js"],
	output: [{
		file: "lib/single-file-editor-init.js",
		format: "iife",
		plugins: [terser()]
	}]
}, {
	input: ["src/extension/ui/content/content-ui-editor-web.js"],
	output: [{
		file: "lib/single-file-editor.js",
		format: "iife",
		plugins: []
	}]
}, {
	input: ["src/extension/ui/content/content-ui-editor-helper-web"],
	output: [{
		file: "lib/single-file-editor-helper.js",
		format: "umd",
		name: "singlefile",
		plugins: [terser()]
	}],
	plugins: PLUGINS,
	external: EXTERNAL
}, {
	input: ["src/extension/lib/single-file/browser-polyfill/chrome-browser-polyfill.js"],
	output: [{
		file: "lib/chrome-browser-polyfill.js",
		format: "iife",
		plugins: [terser()]
	}]
}, {
	input: ["src/extension/core/bg/index.js"],
	output: [{
		file: "lib/extension-background.js",
		format: "iife",
		plugins: [terser()]
	}]
}, {
	input: ["src/extension/lib/single-file/background.js"],
	output: [{
		file: "lib/single-file-background.js",
		format: "iife",
		plugins: [terser()]
	}]
}];