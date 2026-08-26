import js from "@eslint/js";

export default [
	{
		ignores: [
			"lib/**",
			"src/lib/readability/**",
			"src/lib/mhtml-to-html/vendor/**"
		]
	},
	js.configs.recommended,
	{
		languageOptions: {
			ecmaVersion: 2025,
			sourceType: "module",
			globals: {
				console: "readonly",
			}
		},
		rules: {
			"linebreak-style": [
				"error",
				"unix"
			],
			"quotes": [
				"error",
				"double"
			],
			"semi": [
				"error",
				"always"
			],
			"no-console": [
				"warn"
			]
		}
	}
];
