import { terser } from "rollup-plugin-terser";

export default [{
	input: ["index.js"],
	output: [{
		file: "dist/single-file.js",
		format: "umd",
		name: "singlefile",
		plugins: [terser()]
	}]
},{
	input: ["single-file-frames.js"],
	output: [{
		file: "dist/single-file-frames.js",
		format: "umd",
		name: "singlefile",
		plugins: [terser()]
	}]
},{
	input: ["single-file-bootstrap.js"],
	output: [{
		file: "dist/single-file-bootstrap.js",
		format: "umd",
		name: "singlefile",
		plugins: [terser()]
	}]
}];