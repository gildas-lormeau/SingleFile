/* global module */

module.exports = {
	"env": {
		"es6": true,
		"node": false,
		"browser": false
	},
	"globals": {
		"console": true
	},
	"extends": "eslint:recommended",
	"parserOptions": {
		"ecmaVersion": 2018,
		"sourceType": "module"
	},
	"ignorePatterns": [
		"/lib/"
	],
	"rules": {
		"indent": [
			"error",
			"tab", {
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
		]
	}
};