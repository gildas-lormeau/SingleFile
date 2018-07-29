/**
 * UglifyCSS
 * Port of YUI CSS Compressor to Vanilla JS
 * Author: Gildas Lormeau
 * MIT licenced
 */

/**
 * UglifyCSS
 * Port of YUI CSS Compressor to NodeJS
 * Author: Franck Marcia - https://github.com/fmarcia
 * MIT licenced
 */

/**
 * cssmin.js
 * Author: Stoyan Stefanov - http://phpied.com/
 * This is a JavaScript port of the CSS minification tool
 * distributed with YUICompressor, itself a port
 * of the cssmin utility by Isaac Schlueter - http://foohack.com/
 * Permission is hereby granted to use the JavaScript version under the same
 * conditions as the YUICompressor (original YUICompressor note below).
 */

/**
 * YUI Compressor
 * http://developer.yahoo.com/yui/compressor/
 * Author: Julien Lecomte - http://www.julienlecomte.net/
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 * The copyrights embodied in the content of this file are licensed
 * by Yahoo! Inc. under the BSD (revised) open source license.
 */

this.uglifycss = this.uglifycss || (() => {

	/**
	 * @type {string} - placeholder prefix
	 */

	const ___PRESERVED_TOKEN_ = "___PRESERVED_TOKEN_";

	/**
	 * @typedef {object} options - UglifyCSS options
	 * @property {number} [maxLineLen=0] - Maximum line length of uglified CSS
	 * @property {boolean} [expandVars=false] - Expand variables
	 * @property {boolean} [uglyComments=false] - Removes newlines within preserved comments
	 * @property {boolean} [cuteComments=false] - Preserves newlines within and around preserved comments
	 * @property {boolean} [debug=false] - Prints full error stack on error
	 * @property {string} [output=''] - Output file name
	 */

	/**
	 * @type {options} - UglifyCSS options
	 */

	const defaultOptions = {
		maxLineLen: 0,
		expandVars: false,
		uglyComments: false,
		cuteComments: false,
		debug: false,
		output: ""
	};

	/**
	 * convertRelativeUrls converts relative urls and replaces them with tokens
	 * before we start compressing. It must be called *after* extractDataUrls
	 *
	 * @param {string} css - CSS content
	 * @param {options} options - UglifyCSS Options
	 * @param {string[]} preservedTokens - Global array of tokens to preserve
	 *
	 * @return {string} Processed css
	 */

	function convertRelativeUrls(css, options, preservedTokens) {

		const pattern = /(url\s*\()\s*(["']?)/g;
		const maxIndex = css.length - 1;
		const sb = [];

		let appendIndex = 0, match;

		// Since we need to account for non-base64 data urls, we need to handle
		// ' and ) being part of the data string. Hence switching to indexOf,
		// to determine whether or not we have matching string terminators and
		// handling sb appends directly, instead of using matcher.append* methods.

		while ((match = pattern.exec(css)) !== null) {

			const startIndex = match.index + match[1].length;  // 'url('.length()
			let terminator = match[2];         // ', " or empty (not quoted)

			if (terminator.length === 0) {
				terminator = ")";
			}

			let foundTerminator = false, endIndex = pattern.lastIndex - 1;

			while (foundTerminator === false && endIndex + 1 <= maxIndex) {
				endIndex = css.indexOf(terminator, endIndex + 1);

				// endIndex == 0 doesn't really apply here
				if ((endIndex > 0) && (css.charAt(endIndex - 1) !== "\\")) {
					foundTerminator = true;
					if (")" != terminator) {
						endIndex = css.indexOf(")", endIndex);
					}
				}
			}

			// Enough searching, start moving stuff over to the buffer
			sb.push(css.substring(appendIndex, match.index));

			if (foundTerminator) {

				let token = css.substring(startIndex, endIndex).replace(/(^\s*|\s*$)/g, "");
				if (token.slice(0, 19) !== ___PRESERVED_TOKEN_) {

					if (terminator === "'" || terminator === "\"") {
						token = token.slice(1, -1);
					} else if (terminator === ")") {
						terminator = "";
					}

					const url = terminator + token + terminator;

					preservedTokens.push(url);

					const preserver = "url(" + ___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___)";
					sb.push(preserver);

				} else {
					sb.push(`url(${token})`);
				}

				appendIndex = endIndex + 1;

			} else {
				// No end terminator found, re-add the whole match. Should we throw/warn here?
				sb.push(css.substring(match.index, pattern.lastIndex));
				appendIndex = pattern.lastIndex;
			}
		}

		sb.push(css.substring(appendIndex));

		return sb.join("");
	}

	/**
	 * extractDataUrls replaces all data urls with tokens before we start
	 * compressing, to avoid performance issues running some of the subsequent
	 * regexes against large strings chunks.
	 *
	 * @param {string} css - CSS content
	 * @param {string[]} preservedTokens - Global array of tokens to preserve
	 *
	 * @return {string} Processed CSS
	 */

	function extractDataUrls(css, preservedTokens) {

		// Leave data urls alone to increase parse performance.
		const pattern = /url\(\s*(["']?)data:/g;
		const maxIndex = css.length - 1;
		const sb = [];

		let appendIndex = 0, match;

		// Since we need to account for non-base64 data urls, we need to handle
		// ' and ) being part of the data string. Hence switching to indexOf,
		// to determine whether or not we have matching string terminators and
		// handling sb appends directly, instead of using matcher.append* methods.

		while ((match = pattern.exec(css)) !== null) {

			const startIndex = match.index + 4;  // 'url('.length()
			let terminator = match[1];         // ', " or empty (not quoted)

			if (terminator.length === 0) {
				terminator = ")";
			}

			let foundTerminator = false, endIndex = pattern.lastIndex - 1;

			while (foundTerminator === false && endIndex + 1 <= maxIndex) {
				endIndex = css.indexOf(terminator, endIndex + 1);

				// endIndex == 0 doesn't really apply here
				if ((endIndex > 0) && (css.charAt(endIndex - 1) !== "\\")) {
					foundTerminator = true;
					if (")" != terminator) {
						endIndex = css.indexOf(")", endIndex);
					}
				}
			}

			// Enough searching, start moving stuff over to the buffer
			sb.push(css.substring(appendIndex, match.index));

			if (foundTerminator) {

				let token = css.substring(startIndex, endIndex);
				const parts = token.split(",");
				if (parts.length > 1 && parts[0].slice(-7) == ";base64") {
					token = token.replace(/\s+/g, "");
				} else {
					token = token.replace(/\n/g, " ");
					token = token.replace(/\s+/g, " ");
					token = token.replace(/(^\s+|\s+$)/g, "");
				}

				preservedTokens.push(token);

				const preserver = "url(" + ___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___)";
				sb.push(preserver);

				appendIndex = endIndex + 1;
			} else {
				// No end terminator found, re-add the whole match. Should we throw/warn here?
				sb.push(css.substring(match.index, pattern.lastIndex));
				appendIndex = pattern.lastIndex;
			}
		}

		sb.push(css.substring(appendIndex));

		return sb.join("");
	}

	/**
	 * compressHexColors compresses hex color values of the form #AABBCC to #ABC.
	 *
	 * DOES NOT compress CSS ID selectors which match the above pattern (which would
	 * break things), like #AddressForm { ... }
	 *
	 * DOES NOT compress IE filters, which have hex color values (which would break
	 * things), like chroma(color='#FFFFFF');
	 *
	 * DOES NOT compress invalid hex values, like background-color: #aabbccdd
	 *
	 * @param {string} css - CSS content
	 *
	 * @return {string} Processed CSS
	 */

	function compressHexColors(css) {

		// Look for hex colors inside { ... } (to avoid IDs) and which don't have a =, or a " in front of them (to avoid filters)

		const pattern = /(=\s*?["']?)?#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])(\}|[^0-9a-f{][^{]*?\})/gi;
		const sb = [];

		let index = 0, match;

		while ((match = pattern.exec(css)) !== null) {

			sb.push(css.substring(index, match.index));

			const isFilter = match[1];

			if (isFilter) {
				// Restore, maintain case, otherwise filter will break
				sb.push(match[1] + "#" + (match[2] + match[3] + match[4] + match[5] + match[6] + match[7]));
			} else {
				if (match[2].toLowerCase() == match[3].toLowerCase() &&
					match[4].toLowerCase() == match[5].toLowerCase() &&
					match[6].toLowerCase() == match[7].toLowerCase()) {

					// Compress.
					sb.push("#" + (match[3] + match[5] + match[7]).toLowerCase());
				} else {
					// Non compressible color, restore but lower case.
					sb.push("#" + (match[2] + match[3] + match[4] + match[5] + match[6] + match[7]).toLowerCase());
				}
			}

			index = pattern.lastIndex = pattern.lastIndex - match[8].length;
		}

		sb.push(css.substring(index));

		return sb.join("");
	}

	/** keyframes preserves 0 followed by unit in keyframes steps
	 *
	 * @param {string} content - CSS content
	 * @param {string[]} preservedTokens - Global array of tokens to preserve
	 *
	 * @return {string} Processed CSS
	 */

	function keyframes(content, preservedTokens) {

		const pattern = /@[a-z0-9-_]*keyframes\s+[a-z0-9-_]+\s*{/gi;

		let index = 0, buffer;

		const preserve = (part, i) => {
			part = part.replace(/(^\s|\s$)/g, "");
			if (part.charAt(0) === "0") {
				preservedTokens.push(part);
				buffer[i] = ___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___";
			}
		};

		while (true) { // eslint-disable-line no-constant-condition

			let level = 0;
			buffer = "";

			let startIndex = content.slice(index).search(pattern);
			if (startIndex < 0) {
				break;
			}

			index += startIndex;
			startIndex = index;

			const len = content.length;
			const buffers = [];

			for (; index < len; ++index) {

				const ch = content.charAt(index);

				if (ch === "{") {

					if (level === 0) {
						buffers.push(buffer.replace(/(^\s|\s$)/g, ""));

					} else if (level === 1) {

						buffer = buffer.split(",");

						buffer.forEach(preserve);

						buffers.push(buffer.join(",").replace(/(^\s|\s$)/g, ""));
					}

					buffer = "";
					level += 1;

				} else if (ch === "}") {

					if (level === 2) {
						buffers.push("{" + buffer.replace(/(^\s|\s$)/g, "") + "}");
						buffer = "";

					} else if (level === 1) {
						content = content.slice(0, startIndex) +
							buffers.shift() + "{" +
							buffers.join("") +
							content.slice(index);
						break;
					}

					level -= 1;
				}

				if (level < 0) {
					break;

				} else if (ch !== "{" && ch !== "}") {
					buffer += ch;
				}
			}
		}

		return content;
	}

	/**
	 * collectComments collects all comment blocks and return new content with comment placeholders
	 *
	 * @param {string} content - CSS content
	 * @param {string[]} comments - Global array of extracted comments
	 *
	 * @return {string} Processed CSS
	 */

	function collectComments(content, comments) {

		const table = [];

		let from = 0, end;

		while (true) { // eslint-disable-line no-constant-condition

			const start = content.indexOf("/*", from);

			if (start > -1) {

				end = content.indexOf("*/", start + 2);

				if (end > -1) {
					comments.push(content.slice(start + 2, end));
					table.push(content.slice(from, start));
					table.push("/*___PRESERVE_CANDIDATE_COMMENT_" + (comments.length - 1) + "___*/");
					from = end + 2;

				} else {
					// unterminated comment
					end = -2;
					break;
				}

			} else {
				break;
			}
		}

		table.push(content.slice(end + 2));

		return table.join("");
	}

	/**
	 * processString uglifies a CSS string
	 *
	 * @param {string} content - CSS string
	 * @param {options} options - UglifyCSS options
	 *
	 * @return {string} Uglified result
	 */

	function processString(content = "", options = defaultOptions) {

		const comments = [];
		const preservedTokens = [];

		let pattern;

		content = extractDataUrls(content, preservedTokens);
		content = convertRelativeUrls(content, options, preservedTokens);
		content = collectComments(content, comments);

		// preserve strings so their content doesn't get accidentally minified
		pattern = /("([^\\"]|\\.|\\)*")|('([^\\']|\\.|\\)*')/g;
		content = content.replace(pattern, token => {
			const quote = token.substring(0, 1);
			token = token.slice(1, -1);
			// maybe the string contains a comment-like substring or more? put'em back then
			if (token.indexOf("___PRESERVE_CANDIDATE_COMMENT_") >= 0) {
				for (let i = 0, len = comments.length; i < len; i += 1) {
					token = token.replace("___PRESERVE_CANDIDATE_COMMENT_" + i + "___", comments[i]);
				}
			}
			// minify alpha opacity in filter strings
			token = token.replace(/progid:DXImageTransform.Microsoft.Alpha\(Opacity=/gi, "alpha(opacity=");
			preservedTokens.push(token);
			return quote + ___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___" + quote;
		});

		// strings are safe, now wrestle the comments
		for (let i = 0, len = comments.length; i < len; i += 1) {

			const token = comments[i];
			const placeholder = "___PRESERVE_CANDIDATE_COMMENT_" + i + "___";

			// ! in the first position of the comment means preserve
			// so push to the preserved tokens keeping the !
			if (token.charAt(0) === "!") {
				if (options.cuteComments) {
					preservedTokens.push(token.substring(1).replace(/\r\n/g, "\n"));
				} else if (options.uglyComments) {
					preservedTokens.push(token.substring(1).replace(/[\r\n]/g, ""));
				} else {
					preservedTokens.push(token);
				}
				content = content.replace(placeholder, ___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___");
				continue;
			}

			// \ in the last position looks like hack for Mac/IE5
			// shorten that to /*\*/ and the next one to /**/
			if (token.charAt(token.length - 1) === "\\") {
				preservedTokens.push("\\");
				content = content.replace(placeholder, ___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___");
				i = i + 1; // attn: advancing the loop
				preservedTokens.push("");
				content = content.replace(
					"___PRESERVE_CANDIDATE_COMMENT_" + i + "___",
					___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___"
				);
				continue;
			}

			// keep empty comments after child selectors (IE7 hack)
			// e.g. html >/**/ body
			if (token.length === 0) {
				const startIndex = content.indexOf(placeholder);
				if (startIndex > 2) {
					if (content.charAt(startIndex - 3) === ">") {
						preservedTokens.push("");
						content = content.replace(placeholder, ___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___");
					}
				}
			}

			// in all other cases kill the comment
			content = content.replace(`/*${placeholder}*/`, "");
		}

		// parse simple @variables blocks and remove them
		if (options.expandVars) {
			const vars = {};
			pattern = /@variables\s*\{\s*([^}]+)\s*\}/g;
			content = content.replace(pattern, (_, f1) => {
				pattern = /\s*([a-z0-9-]+)\s*:\s*([^;}]+)\s*/gi;
				f1.replace(pattern, (_, f1, f2) => {
					if (f1 && f2) {
						vars[f1] = f2;
					}
					return "";
				});
				return "";
			});

			// replace var(x) with the value of x
			pattern = /var\s*\(\s*([^)]+)\s*\)/g;
			content = content.replace(pattern, (_, f1) => {
				return vars[f1] || "none";
			});
		}

		// normalize all whitespace strings to single spaces. Easier to work with that way.
		content = content.replace(/\s+/g, " ");

		// preserve formulas in calc() before removing spaces
		pattern = /calc\(([^;}]*)\)/g;
		content = content.replace(pattern, (_, f1) => {
			preservedTokens.push(
				"calc(" +
				f1.replace(/(^\s*|\s*$)/g, "")
					.replace(/\( /g, "(")
					.replace(/ \)/g, ")") +
				")"
			);
			return ___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___";
		});

		// preserve matrix
		pattern = /\s*filter:\s*progid:DXImageTransform.Microsoft.Matrix\(([^)]+)\);/g;
		content = content.replace(pattern, (_, f1) => {
			preservedTokens.push(f1);
			return "filter:progid:DXImageTransform.Microsoft.Matrix(" + ___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___);";
		});

		// remove the spaces before the things that should not have spaces before them.
		// but, be careful not to turn 'p :link {...}' into 'p:link{...}'
		// swap out any pseudo-class colons with the token, and then swap back.
		pattern = /(^|\})(([^{:])+:)+([^{]*{)/g;
		content = content.replace(pattern, token => token.replace(/:/g, "___PSEUDOCLASSCOLON___"));

		// remove spaces before the things that should not have spaces before them.
		content = content.replace(/\s+([!{};:>+()\],])/g, "$1");

		// restore spaces for !important
		content = content.replace(/!important/g, " !important");

		// bring back the colon
		content = content.replace(/___PSEUDOCLASSCOLON___/g, ":");

		// preserve 0 followed by a time unit for properties using time units
		pattern = /\s*(animation|animation-delay|animation-duration|transition|transition-delay|transition-duration):\s*([^;}]+)/gi;
		content = content.replace(pattern, (_, f1, f2) => {

			f2 = f2.replace(/(^|\D)0?\.?0(m?s)/gi, (_, g1, g2) => {
				preservedTokens.push("0" + g2);
				return g1 + ___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___";
			});

			return f1 + ":" + f2;
		});

		// preserve unit for flex-basis within flex and flex-basis (ie10 bug)
		pattern = /\s*(flex|flex-basis):\s*([^;}]+)/gi;
		content = content.replace(pattern, (_, f1, f2) => {
			let f2b = f2.split(/\s+/);
			preservedTokens.push(f2b.pop());
			f2b.push(___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___");
			f2b = f2b.join(" ");
			return `${f1}:${f2b}`;
		});

		// preserve 0% in hsl and hsla color definitions
		content = content.replace(/(hsla?)\(([^)]+)\)/g, (_, f1, f2) => {
			const f0 = [];
			f2.split(",").forEach(part => {
				part = part.replace(/(^\s+|\s+$)/g, "");
				if (part === "0%") {
					preservedTokens.push("0%");
					f0.push(___PRESERVED_TOKEN_ + (preservedTokens.length - 1) + "___");
				} else {
					f0.push(part);
				}
			});
			return f1 + "(" + f0.join(",") + ")";
		});

		// preserve 0 followed by unit in keyframes steps (WIP)
		content = keyframes(content, preservedTokens);

		// retain space for special IE6 cases
		content = content.replace(/:first-(line|letter)(\{|,)/gi, (_, f1, f2) => ":first-" + f1.toLowerCase() + " " + f2);

		// newlines before and after the end of a preserved comment
		if (options.cuteComments) {
			content = content.replace(/\s*\/\*/g, "___PRESERVED_NEWLINE___/*");
			content = content.replace(/\*\/\s*/g, "*/___PRESERVED_NEWLINE___");
			// no space after the end of a preserved comment
		} else {
			content = content.replace(/\*\/\s*/g, "*/");
		}

		// If there are multiple @charset directives, push them to the top of the file.
		pattern = /^(.*)(@charset)( "[^"]*";)/gi;
		content = content.replace(pattern, (_, f1, f2, f3) => f2.toLowerCase() + f3 + f1);

		// When all @charset are at the top, remove the second and after (as they are completely ignored).
		pattern = /^((\s*)(@charset)( [^;]+;\s*))+/gi;
		content = content.replace(pattern, (_, __, f2, f3, f4) => f2 + f3.toLowerCase() + f4);

		// lowercase some popular @directives (@charset is done right above)
		pattern = /@(font-face|import|(?:-(?:atsc|khtml|moz|ms|o|wap|webkit)-)?keyframe|media|page|namespace)/gi;
		content = content.replace(pattern, (_, f1) => "@" + f1.toLowerCase());

		// lowercase some more common pseudo-elements
		pattern = /:(active|after|before|checked|disabled|empty|enabled|first-(?:child|of-type)|focus|hover|last-(?:child|of-type)|link|only-(?:child|of-type)|root|:selection|target|visited)/gi;
		content = content.replace(pattern, (_, f1) => ":" + f1.toLowerCase());

		// if there is a @charset, then only allow one, and push to the top of the file.
		content = content.replace(/^(.*)(@charset "[^"]*";)/g, "$2$1");
		content = content.replace(/^(\s*@charset [^;]+;\s*)+/g, "$1");

		// lowercase some more common functions
		pattern = /:(lang|not|nth-child|nth-last-child|nth-last-of-type|nth-of-type|(?:-(?:atsc|khtml|moz|ms|o|wap|webkit)-)?any)\(/gi;
		content = content.replace(pattern, (_, f1) => ":" + f1.toLowerCase() + "(");

		// lower case some common function that can be values
		// NOTE: rgb() isn't useful as we replace with #hex later, as well as and() is already done for us right after this
		pattern = /([:,( ]\s*)(attr|color-stop|from|rgba|to|url|(?:-(?:atsc|khtml|moz|ms|o|wap|webkit)-)?(?:calc|max|min|(?:repeating-)?(?:linear|radial)-gradient)|-webkit-gradient)/gi;
		content = content.replace(pattern, (_, f1, f2) => f1 + f2.toLowerCase());

		// put the space back in some cases, to support stuff like
		// @media screen and (-webkit-min-device-pixel-ratio:0){
		content = content.replace(/\band\(/gi, "and (");

		// remove the spaces after the things that should not have spaces after them.
		content = content.replace(/([!{}:;>+([,])\s+/g, "$1");

		// remove unnecessary semicolons
		content = content.replace(/;+\}/g, "}");

		// replace 0(px,em,%) with 0.
		content = content.replace(/(^|[^.0-9\\])(?:0?\.)?0(?:ex|ch|r?em|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|g?rad|turn|m?s|k?Hz|dpi|dpcm|dppx|%)/gi, "$10");

		// Replace x.0(px,em,%) with x(px,em,%).
		content = content.replace(/([0-9])\.0(ex|ch|r?em|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|g?rad|turn|m?s|k?Hz|dpi|dpcm|dppx|%| |;)/gi, "$1$2");

		// replace 0 0 0 0; with 0.
		content = content.replace(/:0 0 0 0(;|\})/g, ":0$1");
		content = content.replace(/:0 0 0(;|\})/g, ":0$1");
		content = content.replace(/:0 0(;|\})/g, ":0$1");

		// replace background-position:0; with background-position:0 0;
		// same for transform-origin and box-shadow
		pattern = /(background-position|transform-origin|webkit-transform-origin|moz-transform-origin|o-transform-origin|ms-transform-origin|box-shadow):0(;|\})/gi;
		content = content.replace(pattern, (_, f1, f2) => f1.toLowerCase() + ":0 0" + f2);

		// replace 0.6 to .6, but only when preceded by : or a white-space
		content = content.replace(/(:|\s)0+\.(\d+)/g, "$1.$2");

		// shorten colors from rgb(51,102,153) to #336699
		// this makes it more likely that it'll get further compressed in the next step.
		pattern = /rgb\s*\(\s*([0-9,\s]+)\s*\)/gi;
		content = content.replace(pattern, (_, f1) => {
			let rgbcolors = f1.split(","), hexcolor = "#";
			for (let i = 0; i < rgbcolors.length; i += 1) {
				let val = parseInt(rgbcolors[i], 10);
				if (val < 16) {
					hexcolor += "0";
				}
				if (val > 255) {
					val = 255;
				}
				hexcolor += val.toString(16);
			}
			return hexcolor;
		});

		// Shorten colors from #AABBCC to #ABC.
		content = compressHexColors(content);

		// Replace #f00 -> red
		content = content.replace(/(:|\s)(#f00)(;|})/g, "$1red$3");

		// Replace other short color keywords
		content = content.replace(/(:|\s)(#000080)(;|})/g, "$1navy$3");
		content = content.replace(/(:|\s)(#808080)(;|})/g, "$1gray$3");
		content = content.replace(/(:|\s)(#808000)(;|})/g, "$1olive$3");
		content = content.replace(/(:|\s)(#800080)(;|})/g, "$1purple$3");
		content = content.replace(/(:|\s)(#c0c0c0)(;|})/g, "$1silver$3");
		content = content.replace(/(:|\s)(#008080)(;|})/g, "$1teal$3");
		content = content.replace(/(:|\s)(#ffa500)(;|})/g, "$1orange$3");
		content = content.replace(/(:|\s)(#800000)(;|})/g, "$1maroon$3");

		// border: none -> border:0
		pattern = /(border|border-top|border-right|border-bottom|border-left|outline|background):none(;|\})/gi;
		content = content.replace(pattern, (_, f1, f2) => f1.toLowerCase() + ":0" + f2);

		// shorter opacity IE filter
		content = content.replace(/progid:DXImageTransform\.Microsoft\.Alpha\(Opacity=/gi, "alpha(opacity=");

		// Find a fraction that is used for Opera's -o-device-pixel-ratio query
		// Add token to add the '\' back in later
		content = content.replace(/\(([-A-Za-z]+):([0-9]+)\/([0-9]+)\)/g, "($1:$2___QUERY_FRACTION___$3)");

		// remove empty rules.
		content = content.replace(/[^};{/]+\{\}/g, "");

		// Add '\' back to fix Opera -o-device-pixel-ratio query
		content = content.replace(/___QUERY_FRACTION___/g, "/");

		// some source control tools don't like it when files containing lines longer
		// than, say 8000 characters, are checked in. The linebreak option is used in
		// that case to split long lines after a specific column.
		if (options.maxLineLen > 0) {
			const lines = [];
			let line = [];
			for (let i = 0, len = content.length; i < len; i += 1) {
				const ch = content.charAt(i);
				line.push(ch);
				if (ch === "}" && line.length > options.maxLineLen) {
					lines.push(line.join(""));
					line = [];
				}
			}
			if (line.length) {
				lines.push(line.join(""));
			}

			content = lines.join("\n");
		}

		// replace multiple semi-colons in a row by a single one
		// see SF bug #1980989
		content = content.replace(/;;+/g, ";");

		// trim the final string (for any leading or trailing white spaces)
		content = content.replace(/(^\s*|\s*$)/g, "");

		// restore preserved tokens
		for (let i = preservedTokens.length - 1; i >= 0; i--) {
			content = content.replace(___PRESERVED_TOKEN_ + i + "___", preservedTokens[i], "g");
		}

		// restore preserved newlines
		content = content.replace(/___PRESERVED_NEWLINE___/g, "\n");

		// return
		return content;
	}

	return {
		defaultOptions,
		processString
	};

})();