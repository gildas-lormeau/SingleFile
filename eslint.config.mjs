import js from "@eslint/js";

export default [
	{
		ignores: [
			"lib/**",
			"src/lib/readability/**",
			"src/lib/mhtml-to-html/**"
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
			"indent": [
				"error",
				"tab",
				{
					"SwitchCase": 1
				}
			],
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
			],
			"no-empty": [
				"error",
				{
					"allowEmptyCatch": true
				}
			]
		}
	},
	{
		files: ["test/**"],
		languageOptions: {
			globals: {
				Headers: "readonly"
			}
		}
	}
];
