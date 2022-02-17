export default [{
	input: ["src/single-file/index.js"],
	output: [{
		file: "lib/single-file.js",
		format: "umd",
		name: "singlefile",
		plugins: []
	}]
}, {
	input: ["src/single-file/single-file-frames.js"],
	output: [{
		file: "lib/single-file-frames.js",
		format: "umd",
		name: "singlefile",
		plugins: []
	}]
}, {
	input: ["src/single-file/single-file-bootstrap.js"],
	output: [{
		file: "lib/single-file-bootstrap.js",
		format: "umd",
		name: "singlefileBootstrap",
		plugins: []
	}]
}, {
	input: ["src/common/ui/content/content-infobar.js"],
	output: [{
		file: "lib/infobar.js",
		format: "umd",
		name: "infobar",
		plugins: []
	}]
}, {
	input: ["src/extension/core/content/content-bootstrap.js"],
	output: [{
		file: "lib/extension-bootstrap.js",
		format: "iife",
		plugins: []
	}]
}, {
	input: ["src/extension/core/content/content-frames.js"],
	output: [{
		file: "lib/extension-frames.js",
		format: "iife",
		plugins: []
	}]
}, {
	input: ["src/extension/index.js"],
	output: [{
		file: "lib/extension-core.js",
		format: "umd",
		name: "extension",
		plugins: []
	}]
}, {
	input: ["src/extension/core/content/content.js"],
	output: [{
		file: "lib/extension.js",
		format: "iife",
		plugins: []
	}]
}, {
	input: ["src/single-file/processors/hooks/content/content-hooks-web.js"],
	output: [{
		file: "lib/web/hooks/hooks-web.js",
		format: "iife",
		plugins: []
	}]
}, {
	input: ["src/single-file/processors/hooks/content/content-hooks-frames-web.js"],
	output: [{
		file: "lib/web/hooks/hooks-frames-web.js",
		format: "iife",
		plugins: []
	}]
}, {
	input: ["src/common/ui/content/content-infobar-web.js"],
	output: [{
		file: "lib/web/infobar-web.js",
		format: "iife",
		plugins: []
	}]
}, {
	input: ["src/extension/ui/content/content-ui-editor-init-web.js"],
	output: [{
		file: "lib/web/editor/editor-init-web.js",
		format: "iife",
		plugins: []
	}]
}, {
	input: ["src/extension/ui/content/content-ui-editor-web.js"],
	output: [{
		file: "lib/web/editor/editor-web.js",
		format: "iife",
		plugins: []
	}]
}, {
	input: ["src/extension/ui/content/content-ui-editor-helper-web"],
	output: [{
		file: "lib/web/editor/editor-helper-web.js",
		format: "umd",
		name: "singlefile",
		plugins: []
	}]
}, {
	input: ["src/extension/lib/single-file/browser-polyfill/chrome-browser-polyfill.js"],
	output: [{
		file: "lib/chrome-browser-polyfill.js",
		format: "iife",
		plugins: []
	}]
}, {
	input: ["src/extension/core/bg/index.js"],
	output: [{
		file: "lib/extension-background.js",
		format: "iife",
		plugins: []
	}]
}, {
	input: ["src/extension/lib/single-file/background.js"],
	output: [{
		file: "lib/single-file-background.js",
		format: "iife",
		plugins: []
	}]
}];