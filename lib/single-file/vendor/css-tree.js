/*
 * The MIT License (MIT)
 * Copyright (C) 2016-2019 by Roman Dvornov
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

// Project page: https://github.com/csstree/csstree

/* eslint-disable no-cond-assign */
/* eslint-disable no-unused-vars */
/* eslint-disable no-redeclare */
/* global singlefile csstree module define window global self require */

(function (f) { if (typeof exports === "object" && typeof module !== "undefined") { module.exports = f(); } else if (typeof define === "function" && define.amd) { define([], f); } else { var g; if (typeof window !== "undefined") { g = window; } else if (typeof global !== "undefined") { g = global; } else if (typeof self !== "undefined") { g = self; } else { g = this; } g.csstree = f(); } })(function () {
	var define, module, exports; return (function () { function r(e, n, t) { function o(i, f) { if (!n[i]) { if (!e[i]) { var c = "function" == typeof require && require; if (!f && c) return c(i, !0); if (u) return u(i, !0); var a = new Error("Cannot find module '" + i + "'"); throw a.code = "MODULE_NOT_FOUND", a; } var p = n[i] = { exports: {} }; e[i][0].call(p.exports, function (r) { var n = e[i][1][r]; return o(n || r); }, p, p.exports, r, e, n, t); } return n[i].exports; } for (var u = "function" == typeof require && require, i = 0; i < t.length; i++)o(t[i]); return o; } return r; })()({
		1: [function (require, module, exports) {
			module.exports = { "generic": true, "types": { "absolute-size": "xx-small | x-small | small | medium | large | x-large | xx-large", "alpha-value": "<number> | <percentage>", "angle-percentage": "<angle> | <percentage>", "angular-color-hint": "<angle-percentage>", "angular-color-stop": "<color> && <color-stop-angle>?", "angular-color-stop-list": "[ <angular-color-stop> [, <angular-color-hint> ]? ]# , <angular-color-stop>", "animateable-feature": "scroll-position | contents | <custom-ident>", "attachment": "scroll | fixed | local", "attr()": "attr( <attr-name> <type-or-unit>? [, <attr-fallback> ]? )", "attr-matcher": "[ '~' | '|' | '^' | '$' | '*' ]? '='", "attr-modifier": "i | s", "attribute-selector": "'[' <wq-name> ']' | '[' <wq-name> <attr-matcher> [ <string-token> | <ident-token> ] <attr-modifier>? ']'", "auto-repeat": "repeat( [ auto-fill | auto-fit ] , [ <line-names>? <fixed-size> ]+ <line-names>? )", "auto-track-list": "[ <line-names>? [ <fixed-size> | <fixed-repeat> ] ]* <line-names>? <auto-repeat> [ <line-names>? [ <fixed-size> | <fixed-repeat> ] ]* <line-names>?", "baseline-position": "[ first | last ]? baseline", "basic-shape": "<inset()> | <circle()> | <ellipse()> | <polygon()>", "bg-image": "none | <image>", "bg-layer": "<bg-image> || <bg-position> [ / <bg-size> ]? || <repeat-style> || <attachment> || <box> || <box>", "bg-position": "[ [ left | center | right | top | bottom | <length-percentage> ] | [ left | center | right | <length-percentage> ] [ top | center | bottom | <length-percentage> ] | [ center | [ left | right ] <length-percentage>? ] && [ center | [ top | bottom ] <length-percentage>? ] ]", "bg-size": "[ <length-percentage> | auto ]{1,2} | cover | contain", "blur()": "blur( <length> )", "blend-mode": "normal | multiply | screen | overlay | darken | lighten | color-dodge | color-burn | hard-light | soft-light | difference | exclusion | hue | saturation | color | luminosity", "box": "border-box | padding-box | content-box", "brightness()": "brightness( <number-percentage> )", "calc()": "calc( <calc-sum> )", "calc-sum": "<calc-product> [ [ '+' | '-' ] <calc-product> ]*", "calc-product": "<calc-value> [ '*' <calc-value> | '/' <number> ]*", "calc-value": "<number> | <dimension> | <percentage> | ( <calc-sum> )", "cf-final-image": "<image> | <color>", "cf-mixing-image": "<percentage>? && <image>", "circle()": "circle( [ <shape-radius> ]? [ at <position> ]? )", "clamp()": "clamp( <calc-sum>#{3} )", "class-selector": "'.' <ident-token>", "clip-source": "<url>", "color": "<rgb()> | <rgba()> | <hsl()> | <hsla()> | <hex-color> | <named-color> | currentcolor | <deprecated-system-color>", "color-stop": "<color-stop-length> | <color-stop-angle>", "color-stop-angle": "<angle-percentage>{1,2}", "color-stop-length": "<length-percentage>{1,2}", "color-stop-list": "[ <linear-color-stop> [, <linear-color-hint> ]? ]# , <linear-color-stop>", "combinator": "'>' | '+' | '~' | [ '||' ]", "common-lig-values": "[ common-ligatures | no-common-ligatures ]", "compat": "searchfield | textarea | push-button | button-bevel | slider-horizontal | checkbox | radio | square-button | menulist | menulist-button | listbox | meter | progress-bar", "composite-style": "clear | copy | source-over | source-in | source-out | source-atop | destination-over | destination-in | destination-out | destination-atop | xor", "compositing-operator": "add | subtract | intersect | exclude", "compound-selector": "[ <type-selector>? <subclass-selector>* [ <pseudo-element-selector> <pseudo-class-selector>* ]* ]!", "compound-selector-list": "<compound-selector>#", "complex-selector": "<compound-selector> [ <combinator>? <compound-selector> ]*", "complex-selector-list": "<complex-selector>#", "conic-gradient()": "conic-gradient( [ from <angle> ]? [ at <position> ]? , <angular-color-stop-list> )", "contextual-alt-values": "[ contextual | no-contextual ]", "content-distribution": "space-between | space-around | space-evenly | stretch", "content-list": "[ <string> | contents | <url> | <quote> | <attr()> | counter( <ident> , <'list-style-type'>? ) ]+", "content-position": "center | start | end | flex-start | flex-end", "content-replacement": "<image>", "contrast()": "contrast( [ <number-percentage> ] )", "counter()": "counter( <custom-ident> , [ <counter-style> | none ]? )", "counter-style": "<counter-style-name> | symbols( )", "counter-style-name": "<custom-ident>", "counters()": "counters( <custom-ident> , <string> , [ <counter-style> | none ]? )", "cross-fade()": "cross-fade( <cf-mixing-image> , <cf-final-image>? )", "cubic-bezier-timing-function": "ease | ease-in | ease-out | ease-in-out | cubic-bezier( <number> , <number> , <number> , <number> )", "deprecated-system-color": "ActiveBorder | ActiveCaption | AppWorkspace | Background | ButtonFace | ButtonHighlight | ButtonShadow | ButtonText | CaptionText | GrayText | Highlight | HighlightText | InactiveBorder | InactiveCaption | InactiveCaptionText | InfoBackground | InfoText | Menu | MenuText | Scrollbar | ThreeDDarkShadow | ThreeDFace | ThreeDHighlight | ThreeDLightShadow | ThreeDShadow | Window | WindowFrame | WindowText", "discretionary-lig-values": "[ discretionary-ligatures | no-discretionary-ligatures ]", "display-box": "contents | none", "display-inside": "flow | flow-root | table | flex | grid | ruby", "display-internal": "table-row-group | table-header-group | table-footer-group | table-row | table-cell | table-column-group | table-column | table-caption | ruby-base | ruby-text | ruby-base-container | ruby-text-container", "display-legacy": "inline-block | inline-list-item | inline-table | inline-flex | inline-grid", "display-listitem": "<display-outside>? && [ flow | flow-root ]? && list-item", "display-outside": "block | inline | run-in", "drop-shadow()": "drop-shadow( <length>{2,3} <color>? )", "east-asian-variant-values": "[ jis78 | jis83 | jis90 | jis04 | simplified | traditional ]", "east-asian-width-values": "[ full-width | proportional-width ]", "element()": "element( <id-selector> )", "ellipse()": "ellipse( [ <shape-radius>{2} ]? [ at <position> ]? )", "ending-shape": "circle | ellipse", "env()": "env( <custom-ident> , <declaration-value>? )", "explicit-track-list": "[ <line-names>? <track-size> ]+ <line-names>?", "family-name": "<string> | <custom-ident>+", "feature-tag-value": "<string> [ <integer> | on | off ]?", "feature-type": "@stylistic | @historical-forms | @styleset | @character-variant | @swash | @ornaments | @annotation", "feature-value-block": "<feature-type> '{' <feature-value-declaration-list> '}'", "feature-value-block-list": "<feature-value-block>+", "feature-value-declaration": "<custom-ident> : <integer>+ ;", "feature-value-declaration-list": "<feature-value-declaration>", "feature-value-name": "<custom-ident>", "fill-rule": "nonzero | evenodd", "filter-function": "<blur()> | <brightness()> | <contrast()> | <drop-shadow()> | <grayscale()> | <hue-rotate()> | <invert()> | <opacity()> | <saturate()> | <sepia()>", "filter-function-list": "[ <filter-function> | <url> ]+", "final-bg-layer": "<'background-color'> || <bg-image> || <bg-position> [ / <bg-size> ]? || <repeat-style> || <attachment> || <box> || <box>", "fit-content()": "fit-content( [ <length> | <percentage> ] )", "fixed-breadth": "<length-percentage>", "fixed-repeat": "repeat( [ <positive-integer> ] , [ <line-names>? <fixed-size> ]+ <line-names>? )", "fixed-size": "<fixed-breadth> | minmax( <fixed-breadth> , <track-breadth> ) | minmax( <inflexible-breadth> , <fixed-breadth> )", "font-stretch-absolute": "normal | ultra-condensed | extra-condensed | condensed | semi-condensed | semi-expanded | expanded | extra-expanded | ultra-expanded | <percentage>", "font-variant-css21": "[ normal | small-caps ]", "font-weight-absolute": "normal | bold | <number>", "frequency-percentage": "<frequency> | <percentage>", "general-enclosed": "[ <function-token> <any-value> ) ] | ( <ident> <any-value> )", "generic-family": "serif | sans-serif | cursive | fantasy | monospace | -apple-system", "generic-name": "serif | sans-serif | cursive | fantasy | monospace", "geometry-box": "<shape-box> | fill-box | stroke-box | view-box", "gradient": "<linear-gradient()> | <repeating-linear-gradient()> | <radial-gradient()> | <repeating-radial-gradient()> | <conic-gradient()> | <-legacy-gradient>", "grayscale()": "grayscale( <number-percentage> )", "grid-line": "auto | <custom-ident> | [ <integer> && <custom-ident>? ] | [ span && [ <integer> || <custom-ident> ] ]", "historical-lig-values": "[ historical-ligatures | no-historical-ligatures ]", "hsl()": "hsl( <hue> <percentage> <percentage> [ / <alpha-value> ]? ) | hsl( <hue> , <percentage> , <percentage> , <alpha-value>? )", "hsla()": "hsla( <hue> <percentage> <percentage> [ / <alpha-value> ]? ) | hsla( <hue> , <percentage> , <percentage> , <alpha-value>? )", "hue": "<number> | <angle>", "hue-rotate()": "hue-rotate( <angle> )", "image": "<url> | <image()> | <image-set()> | <element()> | <cross-fade()> | <gradient>", "image()": "image( <image-tags>? [ <image-src>? , <color>? ]! )", "image-set()": "image-set( <image-set-option># )", "image-set-option": "[ <image> | <string> ] <resolution>", "image-src": "<url> | <string>", "image-tags": "ltr | rtl", "inflexible-breadth": "<length> | <percentage> | min-content | max-content | auto", "inset()": "inset( <length-percentage>{1,4} [ round <'border-radius'> ]? )", "invert()": "invert( <number-percentage> )", "keyframes-name": "<custom-ident> | <string>", "keyframe-block": "<keyframe-selector># { <declaration-list> }", "keyframe-block-list": "<keyframe-block>+", "keyframe-selector": "from | to | <percentage>", "leader()": "leader( <leader-type> )", "leader-type": "dotted | solid | space | <string>", "length-percentage": "<length> | <percentage>", "line-names": "'[' <custom-ident>* ']'", "line-name-list": "[ <line-names> | <name-repeat> ]+", "line-style": "none | hidden | dotted | dashed | solid | double | groove | ridge | inset | outset", "line-width": "<length> | thin | medium | thick", "linear-color-hint": "<length-percentage>", "linear-color-stop": "<color> <color-stop-length>?", "linear-gradient()": "linear-gradient( [ <angle> | to <side-or-corner> ]? , <color-stop-list> )", "mask-layer": "<mask-reference> || <position> [ / <bg-size> ]? || <repeat-style> || <geometry-box> || [ <geometry-box> | no-clip ] || <compositing-operator> || <masking-mode>", "mask-position": "[ <length-percentage> | left | center | right ] [ <length-percentage> | top | center | bottom ]?", "mask-reference": "none | <image> | <mask-source>", "mask-source": "<url>", "masking-mode": "alpha | luminance | match-source", "matrix()": "matrix( <number>#{6} )", "matrix3d()": "matrix3d( <number>#{16} )", "max()": "max( <calc-sum># )", "media-and": "<media-in-parens> [ and <media-in-parens> ]+", "media-condition": "<media-not> | <media-and> | <media-or> | <media-in-parens>", "media-condition-without-or": "<media-not> | <media-and> | <media-in-parens>", "media-feature": "( [ <mf-plain> | <mf-boolean> | <mf-range> ] )", "media-in-parens": "( <media-condition> ) | <media-feature> | <general-enclosed>", "media-not": "not <media-in-parens>", "media-or": "<media-in-parens> [ or <media-in-parens> ]+", "media-query": "<media-condition> | [ not | only ]? <media-type> [ and <media-condition-without-or> ]?", "media-query-list": "<media-query>#", "media-type": "<ident>", "mf-boolean": "<mf-name>", "mf-name": "<ident>", "mf-plain": "<mf-name> : <mf-value>", "mf-range": "<mf-name> [ '<' | '>' ]? '='? <mf-value> | <mf-value> [ '<' | '>' ]? '='? <mf-name> | <mf-value> '<' '='? <mf-name> '<' '='? <mf-value> | <mf-value> '>' '='? <mf-name> '>' '='? <mf-value>", "mf-value": "<number> | <dimension> | <ident> | <ratio>", "min()": "min( <calc-sum># )", "minmax()": "minmax( [ <length> | <percentage> | <flex> | min-content | max-content | auto ] , [ <length> | <percentage> | <flex> | min-content | max-content | auto ] )", "named-color": "transparent | aliceblue | antiquewhite | aqua | aquamarine | azure | beige | bisque | black | blanchedalmond | blue | blueviolet | brown | burlywood | cadetblue | chartreuse | chocolate | coral | cornflowerblue | cornsilk | crimson | cyan | darkblue | darkcyan | darkgoldenrod | darkgray | darkgreen | darkgrey | darkkhaki | darkmagenta | darkolivegreen | darkorange | darkorchid | darkred | darksalmon | darkseagreen | darkslateblue | darkslategray | darkslategrey | darkturquoise | darkviolet | deeppink | deepskyblue | dimgray | dimgrey | dodgerblue | firebrick | floralwhite | forestgreen | fuchsia | gainsboro | ghostwhite | gold | goldenrod | gray | green | greenyellow | grey | honeydew | hotpink | indianred | indigo | ivory | khaki | lavender | lavenderblush | lawngreen | lemonchiffon | lightblue | lightcoral | lightcyan | lightgoldenrodyellow | lightgray | lightgreen | lightgrey | lightpink | lightsalmon | lightseagreen | lightskyblue | lightslategray | lightslategrey | lightsteelblue | lightyellow | lime | limegreen | linen | magenta | maroon | mediumaquamarine | mediumblue | mediumorchid | mediumpurple | mediumseagreen | mediumslateblue | mediumspringgreen | mediumturquoise | mediumvioletred | midnightblue | mintcream | mistyrose | moccasin | navajowhite | navy | oldlace | olive | olivedrab | orange | orangered | orchid | palegoldenrod | palegreen | paleturquoise | palevioletred | papayawhip | peachpuff | peru | pink | plum | powderblue | purple | rebeccapurple | red | rosybrown | royalblue | saddlebrown | salmon | sandybrown | seagreen | seashell | sienna | silver | skyblue | slateblue | slategray | slategrey | snow | springgreen | steelblue | tan | teal | thistle | tomato | turquoise | violet | wheat | white | whitesmoke | yellow | yellowgreen | <-non-standard-color>", "namespace-prefix": "<ident>", "ns-prefix": "[ <ident-token> | '*' ]? '|'", "number-percentage": "<number> | <percentage>", "numeric-figure-values": "[ lining-nums | oldstyle-nums ]", "numeric-fraction-values": "[ diagonal-fractions | stacked-fractions ]", "numeric-spacing-values": "[ proportional-nums | tabular-nums ]", "nth": "<an-plus-b> | even | odd", "opacity()": "opacity( [ <number-percentage> ] )", "overflow-position": "unsafe | safe", "outline-radius": "<length> | <percentage>", "page-body": "<declaration>? [ ; <page-body> ]? | <page-margin-box> <page-body>", "page-margin-box": "<page-margin-box-type> '{' <declaration-list> '}'", "page-margin-box-type": "@top-left-corner | @top-left | @top-center | @top-right | @top-right-corner | @bottom-left-corner | @bottom-left | @bottom-center | @bottom-right | @bottom-right-corner | @left-top | @left-middle | @left-bottom | @right-top | @right-middle | @right-bottom", "page-selector-list": "[ <page-selector># ]?", "page-selector": "<pseudo-page>+ | <ident> <pseudo-page>*", "perspective()": "perspective( <length> )", "polygon()": "polygon( <fill-rule>? , [ <length-percentage> <length-percentage> ]# )", "position": "[ [ left | center | right ] || [ top | center | bottom ] | [ left | center | right | <length-percentage> ] [ top | center | bottom | <length-percentage> ]? | [ [ left | right ] <length-percentage> ] && [ [ top | bottom ] <length-percentage> ] ]", "pseudo-class-selector": "':' <ident-token> | ':' <function-token> <any-value> ')'", "pseudo-element-selector": "':' <pseudo-class-selector>", "pseudo-page": ": [ left | right | first | blank ]", "quote": "open-quote | close-quote | no-open-quote | no-close-quote", "radial-gradient()": "radial-gradient( [ <ending-shape> || <size> ]? [ at <position> ]? , <color-stop-list> )", "relative-selector": "<combinator>? <complex-selector>", "relative-selector-list": "<relative-selector>#", "relative-size": "larger | smaller", "repeat-style": "repeat-x | repeat-y | [ repeat | space | round | no-repeat ]{1,2}", "repeating-linear-gradient()": "repeating-linear-gradient( [ <angle> | to <side-or-corner> ]? , <color-stop-list> )", "repeating-radial-gradient()": "repeating-radial-gradient( [ <ending-shape> || <size> ]? [ at <position> ]? , <color-stop-list> )", "rgb()": "rgb( <percentage>{3} [ / <alpha-value> ]? ) | rgb( <number>{3} [ / <alpha-value> ]? ) | rgb( <percentage>#{3} , <alpha-value>? ) | rgb( <number>#{3} , <alpha-value>? )", "rgba()": "rgba( <percentage>{3} [ / <alpha-value> ]? ) | rgba( <number>{3} [ / <alpha-value> ]? ) | rgba( <percentage>#{3} , <alpha-value>? ) | rgba( <number>#{3} , <alpha-value>? )", "rotate()": "rotate( [ <angle> | <zero> ] )", "rotate3d()": "rotate3d( <number> , <number> , <number> , [ <angle> | <zero> ] )", "rotateX()": "rotateX( [ <angle> | <zero> ] )", "rotateY()": "rotateY( [ <angle> | <zero> ] )", "rotateZ()": "rotateZ( [ <angle> | <zero> ] )", "saturate()": "saturate( <number-percentage> )", "scale()": "scale( <number> , <number>? )", "scale3d()": "scale3d( <number> , <number> , <number> )", "scaleX()": "scaleX( <number> )", "scaleY()": "scaleY( <number> )", "scaleZ()": "scaleZ( <number> )", "self-position": "center | start | end | self-start | self-end | flex-start | flex-end", "shape-radius": "<length-percentage> | closest-side | farthest-side", "skew()": "skew( [ <angle> | <zero> ] , [ <angle> | <zero> ]? )", "skewX()": "skewX( [ <angle> | <zero> ] )", "skewY()": "skewY( [ <angle> | <zero> ] )", "sepia()": "sepia( <number-percentage> )", "shadow": "inset? && <length>{2,4} && <color>?", "shadow-t": "[ <length>{2,3} && <color>? ]", "shape": "rect( <top> , <right> , <bottom> , <left> ) | rect( <top> <right> <bottom> <left> )", "shape-box": "<box> | margin-box", "side-or-corner": "[ left | right ] || [ top | bottom ]", "single-animation": "<time> || <timing-function> || <time> || <single-animation-iteration-count> || <single-animation-direction> || <single-animation-fill-mode> || <single-animation-play-state> || [ none | <keyframes-name> ]", "single-animation-direction": "normal | reverse | alternate | alternate-reverse", "single-animation-fill-mode": "none | forwards | backwards | both", "single-animation-iteration-count": "infinite | <number>", "single-animation-play-state": "running | paused", "single-transition": "[ none | <single-transition-property> ] || <time> || <timing-function> || <time>", "single-transition-property": "all | <custom-ident>", "size": "closest-side | farthest-side | closest-corner | farthest-corner | <length> | <length-percentage>{2}", "step-position": "jump-start | jump-end | jump-none | jump-both | start | end", "step-timing-function": "step-start | step-end | steps( <integer> [, <step-position> ]? )", "subclass-selector": "<id-selector> | <class-selector> | <attribute-selector> | <pseudo-class-selector>", "supports-condition": "not <supports-in-parens> | <supports-in-parens> [ and <supports-in-parens> ]* | <supports-in-parens> [ or <supports-in-parens> ]*", "supports-in-parens": "( <supports-condition> ) | <supports-feature> | <general-enclosed>", "supports-feature": "<supports-decl> | <supports-selector-fn>", "supports-decl": "( <declaration> )", "supports-selector-fn": "selector( <complex-selector> )", "symbol": "<string> | <image> | <custom-ident>", "target": "<target-counter()> | <target-counters()> | <target-text()>", "target-counter()": "target-counter( [ <string> | <url> ] , <custom-ident> , <counter-style>? )", "target-counters()": "target-counters( [ <string> | <url> ] , <custom-ident> , <string> , <counter-style>? )", "target-text()": "target-text( [ <string> | <url> ] , [ content | before | after | first-letter ]? )", "time-percentage": "<time> | <percentage>", "timing-function": "linear | <cubic-bezier-timing-function> | <step-timing-function>", "track-breadth": "<length-percentage> | <flex> | min-content | max-content | auto", "track-list": "[ <line-names>? [ <track-size> | <track-repeat> ] ]+ <line-names>?", "track-repeat": "repeat( [ <positive-integer> ] , [ <line-names>? <track-size> ]+ <line-names>? )", "track-size": "<track-breadth> | minmax( <inflexible-breadth> , <track-breadth> ) | fit-content( [ <length> | <percentage> ] )", "transform-function": "<matrix()> | <translate()> | <translateX()> | <translateY()> | <scale()> | <scaleX()> | <scaleY()> | <rotate()> | <skew()> | <skewX()> | <skewY()> | <matrix3d()> | <translate3d()> | <translateZ()> | <scale3d()> | <scaleZ()> | <rotate3d()> | <rotateX()> | <rotateY()> | <rotateZ()> | <perspective()>", "transform-list": "<transform-function>+", "translate()": "translate( <length-percentage> , <length-percentage>? )", "translate3d()": "translate3d( <length-percentage> , <length-percentage> , <length> )", "translateX()": "translateX( <length-percentage> )", "translateY()": "translateY( <length-percentage> )", "translateZ()": "translateZ( <length> )", "type-or-unit": "string | color | url | integer | number | length | angle | time | frequency | cap | ch | em | ex | ic | lh | rlh | rem | vb | vi | vw | vh | vmin | vmax | mm | Q | cm | in | pt | pc | px | deg | grad | rad | turn | ms | s | Hz | kHz | %", "type-selector": "<wq-name> | <ns-prefix>? '*'", "var()": "var( <custom-property-name> , <declaration-value>? )", "viewport-length": "auto | <length-percentage>", "wq-name": "<ns-prefix>? <ident-token>", "-legacy-gradient": "<-webkit-gradient()> | <-legacy-linear-gradient> | <-legacy-repeating-linear-gradient> | <-legacy-radial-gradient> | <-legacy-repeating-radial-gradient>", "-legacy-linear-gradient": "-moz-linear-gradient( <-legacy-linear-gradient-arguments> ) | -webkit-linear-gradient( <-legacy-linear-gradient-arguments> ) | -o-linear-gradient( <-legacy-linear-gradient-arguments> )", "-legacy-repeating-linear-gradient": "-moz-repeating-linear-gradient( <-legacy-linear-gradient-arguments> ) | -webkit-repeating-linear-gradient( <-legacy-linear-gradient-arguments> ) | -o-repeating-linear-gradient( <-legacy-linear-gradient-arguments> )", "-legacy-linear-gradient-arguments": "[ <angle> | <side-or-corner> ]? , <color-stop-list>", "-legacy-radial-gradient": "-moz-radial-gradient( <-legacy-radial-gradient-arguments> ) | -webkit-radial-gradient( <-legacy-radial-gradient-arguments> ) | -o-radial-gradient( <-legacy-radial-gradient-arguments> )", "-legacy-repeating-radial-gradient": "-moz-repeating-radial-gradient( <-legacy-radial-gradient-arguments> ) | -webkit-repeating-radial-gradient( <-legacy-radial-gradient-arguments> ) | -o-repeating-radial-gradient( <-legacy-radial-gradient-arguments> )", "-legacy-radial-gradient-arguments": "[ <position> , ]? [ [ [ <-legacy-radial-gradient-shape> || <-legacy-radial-gradient-size> ] | [ <length> | <percentage> ]{2} ] , ]? <color-stop-list>", "-legacy-radial-gradient-size": "closest-side | closest-corner | farthest-side | farthest-corner | contain | cover", "-legacy-radial-gradient-shape": "circle | ellipse", "-non-standard-font": "-apple-system-body | -apple-system-headline | -apple-system-subheadline | -apple-system-caption1 | -apple-system-caption2 | -apple-system-footnote | -apple-system-short-body | -apple-system-short-headline | -apple-system-short-subheadline | -apple-system-short-caption1 | -apple-system-short-footnote | -apple-system-tall-body", "-non-standard-color": "-moz-ButtonDefault | -moz-ButtonHoverFace | -moz-ButtonHoverText | -moz-CellHighlight | -moz-CellHighlightText | -moz-Combobox | -moz-ComboboxText | -moz-Dialog | -moz-DialogText | -moz-dragtargetzone | -moz-EvenTreeRow | -moz-Field | -moz-FieldText | -moz-html-CellHighlight | -moz-html-CellHighlightText | -moz-mac-accentdarkestshadow | -moz-mac-accentdarkshadow | -moz-mac-accentface | -moz-mac-accentlightesthighlight | -moz-mac-accentlightshadow | -moz-mac-accentregularhighlight | -moz-mac-accentregularshadow | -moz-mac-chrome-active | -moz-mac-chrome-inactive | -moz-mac-focusring | -moz-mac-menuselect | -moz-mac-menushadow | -moz-mac-menutextselect | -moz-MenuHover | -moz-MenuHoverText | -moz-MenuBarText | -moz-MenuBarHoverText | -moz-nativehyperlinktext | -moz-OddTreeRow | -moz-win-communicationstext | -moz-win-mediatext | -moz-activehyperlinktext | -moz-default-background-color | -moz-default-color | -moz-hyperlinktext | -moz-visitedhyperlinktext | -webkit-activelink | -webkit-focus-ring-color | -webkit-link | -webkit-text", "-non-standard-image-rendering": "optimize-contrast | -moz-crisp-edges | -o-crisp-edges | -webkit-optimize-contrast", "-non-standard-overflow": "-moz-scrollbars-none | -moz-scrollbars-horizontal | -moz-scrollbars-vertical | -moz-hidden-unscrollable", "-non-standard-width": "min-intrinsic | intrinsic | -moz-min-content | -moz-max-content | -webkit-min-content | -webkit-max-content", "-webkit-gradient()": "-webkit-gradient( <-webkit-gradient-type> , <-webkit-gradient-point> [, <-webkit-gradient-point> | , <-webkit-gradient-radius> , <-webkit-gradient-point> ] [, <-webkit-gradient-radius> ]? [, <-webkit-gradient-color-stop> ]* )", "-webkit-gradient-color-stop": "from( <color> ) | color-stop( [ <number-zero-one> | <percentage> ] , <color> ) | to( <color> )", "-webkit-gradient-point": "[ left | center | right | <length-percentage> ] [ top | center | bottom | <length-percentage> ]", "-webkit-gradient-radius": "<length> | <percentage>", "-webkit-gradient-type": "linear | radial", "-webkit-mask-box-repeat": "repeat | stretch | round", "-webkit-mask-clip-style": "border | border-box | padding | padding-box | content | content-box | text", "-ms-filter-function-list": "<-ms-filter-function>+", "-ms-filter-function": "<-ms-filter-function-progid> | <-ms-filter-function-legacy>", "-ms-filter-function-progid": "'progid:' [ <ident-token> '.' ]* [ <ident-token> | <function-token> <any-value>? ) ]", "-ms-filter-function-legacy": "<ident-token> | <function-token> <any-value>? )", "-ms-filter": "<string>", "age": "child | young | old", "attr-name": "<wq-name>", "attr-fallback": "<any-value>", "border-radius": "<length-percentage>{1,2}", "bottom": "<length> | auto", "generic-voice": "[ <age>? <gender> <integer>? ]", "gender": "male | female | neutral", "left": "<length> | auto", "mask-image": "<mask-reference>#", "name-repeat": "repeat( [ <positive-integer> | auto-fill ] , <line-names>+ )", "paint": "none | <color> | <url> [ none | <color> ]? | context-fill | context-stroke", "path()": "path( <string> )", "ratio": "<integer> / <integer>", "right": "<length> | auto", "svg-length": "<percentage> | <length> | <number>", "svg-writing-mode": "lr-tb | rl-tb | tb-rl | lr | rl | tb", "top": "<length> | auto", "x": "<number>", "y": "<number>", "declaration": "<ident-token> : <declaration-value>? [ '!' important ]?", "declaration-list": "[ <declaration>? ';' ]* <declaration>?", "url": "url( <string> <url-modifier>* ) | <url-token>", "url-modifier": "<ident> | <function-token> <any-value> )", "number-zero-one": "<number [0,1]>", "number-one-or-greater": "<number [1,∞]>", "positive-integer": "<integer [0,∞]>" }, "properties": { "--*": "<declaration-value>", "-ms-accelerator": "false | true", "-ms-block-progression": "tb | rl | bt | lr", "-ms-content-zoom-chaining": "none | chained", "-ms-content-zooming": "none | zoom", "-ms-content-zoom-limit": "<'-ms-content-zoom-limit-min'> <'-ms-content-zoom-limit-max'>", "-ms-content-zoom-limit-max": "<percentage>", "-ms-content-zoom-limit-min": "<percentage>", "-ms-content-zoom-snap": "<'-ms-content-zoom-snap-type'> || <'-ms-content-zoom-snap-points'>", "-ms-content-zoom-snap-points": "snapInterval( <percentage> , <percentage> ) | snapList( <percentage># )", "-ms-content-zoom-snap-type": "none | proximity | mandatory", "-ms-filter": "<string>", "-ms-flow-from": "[ none | <custom-ident> ]#", "-ms-flow-into": "[ none | <custom-ident> ]#", "-ms-high-contrast-adjust": "auto | none", "-ms-hyphenate-limit-chars": "auto | <integer>{1,3}", "-ms-hyphenate-limit-lines": "no-limit | <integer>", "-ms-hyphenate-limit-zone": "<percentage> | <length>", "-ms-ime-align": "auto | after", "-ms-overflow-style": "auto | none | scrollbar | -ms-autohiding-scrollbar", "-ms-scrollbar-3dlight-color": "<color>", "-ms-scrollbar-arrow-color": "<color>", "-ms-scrollbar-base-color": "<color>", "-ms-scrollbar-darkshadow-color": "<color>", "-ms-scrollbar-face-color": "<color>", "-ms-scrollbar-highlight-color": "<color>", "-ms-scrollbar-shadow-color": "<color>", "-ms-scrollbar-track-color": "<color>", "-ms-scroll-chaining": "chained | none", "-ms-scroll-limit": "<'-ms-scroll-limit-x-min'> <'-ms-scroll-limit-y-min'> <'-ms-scroll-limit-x-max'> <'-ms-scroll-limit-y-max'>", "-ms-scroll-limit-x-max": "auto | <length>", "-ms-scroll-limit-x-min": "<length>", "-ms-scroll-limit-y-max": "auto | <length>", "-ms-scroll-limit-y-min": "<length>", "-ms-scroll-rails": "none | railed", "-ms-scroll-snap-points-x": "snapInterval( <length-percentage> , <length-percentage> ) | snapList( <length-percentage># )", "-ms-scroll-snap-points-y": "snapInterval( <length-percentage> , <length-percentage> ) | snapList( <length-percentage># )", "-ms-scroll-snap-type": "none | proximity | mandatory", "-ms-scroll-snap-x": "<'-ms-scroll-snap-type'> <'-ms-scroll-snap-points-x'>", "-ms-scroll-snap-y": "<'-ms-scroll-snap-type'> <'-ms-scroll-snap-points-y'>", "-ms-scroll-translation": "none | vertical-to-horizontal", "-ms-text-autospace": "none | ideograph-alpha | ideograph-numeric | ideograph-parenthesis | ideograph-space", "-ms-touch-select": "grippers | none", "-ms-user-select": "none | element | text", "-ms-wrap-flow": "auto | both | start | end | maximum | clear", "-ms-wrap-margin": "<length>", "-ms-wrap-through": "wrap | none", "-moz-appearance": "none | button | button-arrow-down | button-arrow-next | button-arrow-previous | button-arrow-up | button-bevel | button-focus | caret | checkbox | checkbox-container | checkbox-label | checkmenuitem | dualbutton | groupbox | listbox | listitem | menuarrow | menubar | menucheckbox | menuimage | menuitem | menuitemtext | menulist | menulist-button | menulist-text | menulist-textfield | menupopup | menuradio | menuseparator | meterbar | meterchunk | progressbar | progressbar-vertical | progresschunk | progresschunk-vertical | radio | radio-container | radio-label | radiomenuitem | range | range-thumb | resizer | resizerpanel | scale-horizontal | scalethumbend | scalethumb-horizontal | scalethumbstart | scalethumbtick | scalethumb-vertical | scale-vertical | scrollbarbutton-down | scrollbarbutton-left | scrollbarbutton-right | scrollbarbutton-up | scrollbarthumb-horizontal | scrollbarthumb-vertical | scrollbartrack-horizontal | scrollbartrack-vertical | searchfield | separator | sheet | spinner | spinner-downbutton | spinner-textfield | spinner-upbutton | splitter | statusbar | statusbarpanel | tab | tabpanel | tabpanels | tab-scroll-arrow-back | tab-scroll-arrow-forward | textfield | textfield-multiline | toolbar | toolbarbutton | toolbarbutton-dropdown | toolbargripper | toolbox | tooltip | treeheader | treeheadercell | treeheadersortarrow | treeitem | treeline | treetwisty | treetwistyopen | treeview | -moz-mac-unified-toolbar | -moz-win-borderless-glass | -moz-win-browsertabbar-toolbox | -moz-win-communicationstext | -moz-win-communications-toolbox | -moz-win-exclude-glass | -moz-win-glass | -moz-win-mediatext | -moz-win-media-toolbox | -moz-window-button-box | -moz-window-button-box-maximized | -moz-window-button-close | -moz-window-button-maximize | -moz-window-button-minimize | -moz-window-button-restore | -moz-window-frame-bottom | -moz-window-frame-left | -moz-window-frame-right | -moz-window-titlebar | -moz-window-titlebar-maximized", "-moz-binding": "<url> | none", "-moz-border-bottom-colors": "<color>+ | none", "-moz-border-left-colors": "<color>+ | none", "-moz-border-right-colors": "<color>+ | none", "-moz-border-top-colors": "<color>+ | none", "-moz-context-properties": "none | [ fill | fill-opacity | stroke | stroke-opacity ]#", "-moz-float-edge": "border-box | content-box | margin-box | padding-box", "-moz-force-broken-image-icon": "<integer>", "-moz-image-region": "<shape> | auto", "-moz-orient": "inline | block | horizontal | vertical", "-moz-outline-radius": "<outline-radius>{1,4} [ / <outline-radius>{1,4} ]?", "-moz-outline-radius-bottomleft": "<outline-radius>", "-moz-outline-radius-bottomright": "<outline-radius>", "-moz-outline-radius-topleft": "<outline-radius>", "-moz-outline-radius-topright": "<outline-radius>", "-moz-stack-sizing": "ignore | stretch-to-fit", "-moz-text-blink": "none | blink", "-moz-user-focus": "ignore | normal | select-after | select-before | select-menu | select-same | select-all | none", "-moz-user-input": "auto | none | enabled | disabled", "-moz-user-modify": "read-only | read-write | write-only", "-moz-window-dragging": "drag | no-drag", "-moz-window-shadow": "default | menu | tooltip | sheet | none", "-webkit-appearance": "none | button | button-bevel | caps-lock-indicator | caret | checkbox | default-button | listbox | listitem | media-fullscreen-button | media-mute-button | media-play-button | media-seek-back-button | media-seek-forward-button | media-slider | media-sliderthumb | menulist | menulist-button | menulist-text | menulist-textfield | push-button | radio | scrollbarbutton-down | scrollbarbutton-left | scrollbarbutton-right | scrollbarbutton-up | scrollbargripper-horizontal | scrollbargripper-vertical | scrollbarthumb-horizontal | scrollbarthumb-vertical | scrollbartrack-horizontal | scrollbartrack-vertical | searchfield | searchfield-cancel-button | searchfield-decoration | searchfield-results-button | searchfield-results-decoration | slider-horizontal | slider-vertical | sliderthumb-horizontal | sliderthumb-vertical | square-button | textarea | textfield", "-webkit-border-before": "<'border-width'> || <'border-style'> || <'color'>", "-webkit-border-before-color": "<'color'>", "-webkit-border-before-style": "<'border-style'>", "-webkit-border-before-width": "<'border-width'>", "-webkit-box-reflect": "[ above | below | right | left ]? <length>? <image>?", "-webkit-line-clamp": "none | <integer>", "-webkit-mask": "[ <mask-reference> || <position> [ / <bg-size> ]? || <repeat-style> || [ <box> | border | padding | content | text ] || [ <box> | border | padding | content ] ]#", "-webkit-mask-attachment": "<attachment>#", "-webkit-mask-clip": "[ <box> | border | padding | content | text ]#", "-webkit-mask-composite": "<composite-style>#", "-webkit-mask-image": "<mask-reference>#", "-webkit-mask-origin": "[ <box> | border | padding | content ]#", "-webkit-mask-position": "<position>#", "-webkit-mask-position-x": "[ <length-percentage> | left | center | right ]#", "-webkit-mask-position-y": "[ <length-percentage> | top | center | bottom ]#", "-webkit-mask-repeat": "<repeat-style>#", "-webkit-mask-repeat-x": "repeat | no-repeat | space | round", "-webkit-mask-repeat-y": "repeat | no-repeat | space | round", "-webkit-mask-size": "<bg-size>#", "-webkit-overflow-scrolling": "auto | touch", "-webkit-tap-highlight-color": "<color>", "-webkit-text-fill-color": "<color>", "-webkit-text-stroke": "<length> || <color>", "-webkit-text-stroke-color": "<color>", "-webkit-text-stroke-width": "<length>", "-webkit-touch-callout": "default | none", "-webkit-user-modify": "read-only | read-write | read-write-plaintext-only", "align-content": "normal | <baseline-position> | <content-distribution> | <overflow-position>? <content-position>", "align-items": "normal | stretch | <baseline-position> | [ <overflow-position>? <self-position> ]", "align-self": "auto | normal | stretch | <baseline-position> | <overflow-position>? <self-position>", "all": "initial | inherit | unset | revert", "animation": "<single-animation>#", "animation-delay": "<time>#", "animation-direction": "<single-animation-direction>#", "animation-duration": "<time>#", "animation-fill-mode": "<single-animation-fill-mode>#", "animation-iteration-count": "<single-animation-iteration-count>#", "animation-name": "[ none | <keyframes-name> ]#", "animation-play-state": "<single-animation-play-state>#", "animation-timing-function": "<timing-function>#", "appearance": "none | auto | button | textfield | <compat>", "azimuth": "<angle> | [ [ left-side | far-left | left | center-left | center | center-right | right | far-right | right-side ] || behind ] | leftwards | rightwards", "backdrop-filter": "none | <filter-function-list>", "backface-visibility": "visible | hidden", "background": "[ <bg-layer> , ]* <final-bg-layer>", "background-attachment": "<attachment>#", "background-blend-mode": "<blend-mode>#", "background-clip": "<box>#", "background-color": "<color>", "background-image": "<bg-image>#", "background-origin": "<box>#", "background-position": "<bg-position>#", "background-position-x": "[ center | [ left | right | x-start | x-end ]? <length-percentage>? ]#", "background-position-y": "[ center | [ top | bottom | y-start | y-end ]? <length-percentage>? ]#", "background-repeat": "<repeat-style>#", "background-size": "<bg-size>#", "block-overflow": "clip | ellipsis | <string>", "block-size": "<'width'>", "border": "<line-width> || <line-style> || <color>", "border-block": "<'border-top-width'> || <'border-top-style'> || <'color'>", "border-block-color": "<'border-top-color'>{1,2}", "border-block-style": "<'border-top-style'>", "border-block-width": "<'border-top-width'>", "border-block-end": "<'border-top-width'> || <'border-top-style'> || <'color'>", "border-block-end-color": "<'border-top-color'>", "border-block-end-style": "<'border-top-style'>", "border-block-end-width": "<'border-top-width'>", "border-block-start": "<'border-top-width'> || <'border-top-style'> || <'color'>", "border-block-start-color": "<'border-top-color'>", "border-block-start-style": "<'border-top-style'>", "border-block-start-width": "<'border-top-width'>", "border-bottom": "<line-width> || <line-style> || <color>", "border-bottom-color": "<'border-top-color'>", "border-bottom-left-radius": "<length-percentage>{1,2}", "border-bottom-right-radius": "<length-percentage>{1,2}", "border-bottom-style": "<line-style>", "border-bottom-width": "<line-width>", "border-collapse": "collapse | separate", "border-color": "<color>{1,4}", "border-end-end-radius": "<length-percentage>{1,2}", "border-end-start-radius": "<length-percentage>{1,2}", "border-image": "<'border-image-source'> || <'border-image-slice'> [ / <'border-image-width'> | / <'border-image-width'>? / <'border-image-outset'> ]? || <'border-image-repeat'>", "border-image-outset": "[ <length> | <number> ]{1,4}", "border-image-repeat": "[ stretch | repeat | round | space ]{1,2}", "border-image-slice": "<number-percentage>{1,4} && fill?", "border-image-source": "none | <image>", "border-image-width": "[ <length-percentage> | <number> | auto ]{1,4}", "border-inline": "<'border-top-width'> || <'border-top-style'> || <'color'>", "border-inline-end": "<'border-top-width'> || <'border-top-style'> || <'color'>", "border-inline-color": "<'border-top-color'>{1,2}", "border-inline-style": "<'border-top-style'>", "border-inline-width": "<'border-top-width'>", "border-inline-end-color": "<'border-top-color'>", "border-inline-end-style": "<'border-top-style'>", "border-inline-end-width": "<'border-top-width'>", "border-inline-start": "<'border-top-width'> || <'border-top-style'> || <'color'>", "border-inline-start-color": "<'border-top-color'>", "border-inline-start-style": "<'border-top-style'>", "border-inline-start-width": "<'border-top-width'>", "border-left": "<line-width> || <line-style> || <color>", "border-left-color": "<color>", "border-left-style": "<line-style>", "border-left-width": "<line-width>", "border-radius": "<length-percentage>{1,4} [ / <length-percentage>{1,4} ]?", "border-right": "<line-width> || <line-style> || <color>", "border-right-color": "<color>", "border-right-style": "<line-style>", "border-right-width": "<line-width>", "border-spacing": "<length> <length>?", "border-start-end-radius": "<length-percentage>{1,2}", "border-start-start-radius": "<length-percentage>{1,2}", "border-style": "<line-style>{1,4}", "border-top": "<line-width> || <line-style> || <color>", "border-top-color": "<color>", "border-top-left-radius": "<length-percentage>{1,2}", "border-top-right-radius": "<length-percentage>{1,2}", "border-top-style": "<line-style>", "border-top-width": "<line-width>", "border-width": "<line-width>{1,4}", "bottom": "<length> | <percentage> | auto", "box-align": "start | center | end | baseline | stretch", "box-decoration-break": "slice | clone", "box-direction": "normal | reverse | inherit", "box-flex": "<number>", "box-flex-group": "<integer>", "box-lines": "single | multiple", "box-ordinal-group": "<integer>", "box-orient": "horizontal | vertical | inline-axis | block-axis | inherit", "box-pack": "start | center | end | justify", "box-shadow": "none | <shadow>#", "box-sizing": "content-box | border-box", "break-after": "auto | avoid | always | all | avoid-page | page | left | right | recto | verso | avoid-column | column | avoid-region | region", "break-before": "auto | avoid | always | all | avoid-page | page | left | right | recto | verso | avoid-column | column | avoid-region | region", "break-inside": "auto | avoid | avoid-page | avoid-column | avoid-region", "caption-side": "top | bottom | block-start | block-end | inline-start | inline-end", "caret-color": "auto | <color>", "clear": "none | left | right | both | inline-start | inline-end", "clip": "<shape> | auto", "clip-path": "<clip-source> | [ <basic-shape> || <geometry-box> ] | none", "color": "<color>", "color-adjust": "economy | exact", "column-count": "<integer> | auto", "column-fill": "auto | balance | balance-all", "column-gap": "normal | <length-percentage>", "column-rule": "<'column-rule-width'> || <'column-rule-style'> || <'column-rule-color'>", "column-rule-color": "<color>", "column-rule-style": "<'border-style'>", "column-rule-width": "<'border-width'>", "column-span": "none | all", "column-width": "<length> | auto", "columns": "<'column-width'> || <'column-count'>", "contain": "none | strict | content | [ size || layout || style || paint ]", "content": "normal | none | [ <content-replacement> | <content-list> ] [ / <string> ]?", "counter-increment": "[ <custom-ident> <integer>? ]+ | none", "counter-reset": "[ <custom-ident> <integer>? ]+ | none", "counter-set": "[ <custom-ident> <integer>? ]+ | none", "cursor": "[ [ <url> [ <x> <y> ]? , ]* [ auto | default | none | context-menu | help | pointer | progress | wait | cell | crosshair | text | vertical-text | alias | copy | move | no-drop | not-allowed | e-resize | n-resize | ne-resize | nw-resize | s-resize | se-resize | sw-resize | w-resize | ew-resize | ns-resize | nesw-resize | nwse-resize | col-resize | row-resize | all-scroll | zoom-in | zoom-out | grab | grabbing | hand | -webkit-grab | -webkit-grabbing | -webkit-zoom-in | -webkit-zoom-out | -moz-grab | -moz-grabbing | -moz-zoom-in | -moz-zoom-out ] ]", "direction": "ltr | rtl", "display": "none | inline | block | list-item | inline-list-item | inline-block | inline-table | table | table-cell | table-column | table-column-group | table-footer-group | table-header-group | table-row | table-row-group | flex | inline-flex | grid | inline-grid | run-in | ruby | ruby-base | ruby-text | ruby-base-container | ruby-text-container | contents | -ms-flexbox | -ms-inline-flexbox | -ms-grid | -ms-inline-grid | -webkit-flex | -webkit-inline-flex | -webkit-box | -webkit-inline-box | -moz-inline-stack | -moz-box | -moz-inline-box", "empty-cells": "show | hide", "filter": "none | <filter-function-list> | <-ms-filter-function-list>", "flex": "none | [ <'flex-grow'> <'flex-shrink'>? || <'flex-basis'> ]", "flex-basis": "content | <'width'>", "flex-direction": "row | row-reverse | column | column-reverse", "flex-flow": "<'flex-direction'> || <'flex-wrap'>", "flex-grow": "<number>", "flex-shrink": "<number>", "flex-wrap": "nowrap | wrap | wrap-reverse", "float": "left | right | none | inline-start | inline-end", "font": "[ [ <'font-style'> || <font-variant-css21> || <'font-weight'> || <'font-stretch'> ]? <'font-size'> [ / <'line-height'> ]? <'font-family'> ] | caption | icon | menu | message-box | small-caption | status-bar", "font-family": "[ <family-name> | <generic-family> ]#", "font-feature-settings": "normal | <feature-tag-value>#", "font-kerning": "auto | normal | none", "font-language-override": "normal | <string>", "font-optical-sizing": "auto | none", "font-variation-settings": "normal | [ <string> <number> ]#", "font-size": "<absolute-size> | <relative-size> | <length-percentage>", "font-size-adjust": "none | <number>", "font-stretch": "<font-stretch-absolute>", "font-style": "normal | italic | oblique <angle>?", "font-synthesis": "none | [ weight || style ]", "font-variant": "normal | none | [ <common-lig-values> || <discretionary-lig-values> || <historical-lig-values> || <contextual-alt-values> || stylistic( <feature-value-name> ) || historical-forms || styleset( <feature-value-name># ) || character-variant( <feature-value-name># ) || swash( <feature-value-name> ) || ornaments( <feature-value-name> ) || annotation( <feature-value-name> ) || [ small-caps | all-small-caps | petite-caps | all-petite-caps | unicase | titling-caps ] || <numeric-figure-values> || <numeric-spacing-values> || <numeric-fraction-values> || ordinal || slashed-zero || <east-asian-variant-values> || <east-asian-width-values> || ruby ]", "font-variant-alternates": "normal | [ stylistic( <feature-value-name> ) || historical-forms || styleset( <feature-value-name># ) || character-variant( <feature-value-name># ) || swash( <feature-value-name> ) || ornaments( <feature-value-name> ) || annotation( <feature-value-name> ) ]", "font-variant-caps": "normal | small-caps | all-small-caps | petite-caps | all-petite-caps | unicase | titling-caps", "font-variant-east-asian": "normal | [ <east-asian-variant-values> || <east-asian-width-values> || ruby ]", "font-variant-ligatures": "normal | none | [ <common-lig-values> || <discretionary-lig-values> || <historical-lig-values> || <contextual-alt-values> ]", "font-variant-numeric": "normal | [ <numeric-figure-values> || <numeric-spacing-values> || <numeric-fraction-values> || ordinal || slashed-zero ]", "font-variant-position": "normal | sub | super", "font-weight": "<font-weight-absolute> | bolder | lighter", "gap": "<'row-gap'> <'column-gap'>?", "grid": "<'grid-template'> | <'grid-template-rows'> / [ auto-flow && dense? ] <'grid-auto-columns'>? | [ auto-flow && dense? ] <'grid-auto-rows'>? / <'grid-template-columns'>", "grid-area": "<grid-line> [ / <grid-line> ]{0,3}", "grid-auto-columns": "<track-size>+", "grid-auto-flow": "[ row | column ] || dense", "grid-auto-rows": "<track-size>+", "grid-column": "<grid-line> [ / <grid-line> ]?", "grid-column-end": "<grid-line>", "grid-column-gap": "<length-percentage>", "grid-column-start": "<grid-line>", "grid-gap": "<'grid-row-gap'> <'grid-column-gap'>?", "grid-row": "<grid-line> [ / <grid-line> ]?", "grid-row-end": "<grid-line>", "grid-row-gap": "<length-percentage>", "grid-row-start": "<grid-line>", "grid-template": "none | [ <'grid-template-rows'> / <'grid-template-columns'> ] | [ <line-names>? <string> <track-size>? <line-names>? ]+ [ / <explicit-track-list> ]?", "grid-template-areas": "none | <string>+", "grid-template-columns": "none | <track-list> | <auto-track-list>", "grid-template-rows": "none | <track-list> | <auto-track-list>", "hanging-punctuation": "none | [ first || [ force-end | allow-end ] || last ]", "height": "[ <length> | <percentage> ] && [ border-box | content-box ]? | available | min-content | max-content | fit-content | auto", "hyphens": "none | manual | auto", "image-orientation": "from-image | <angle> | [ <angle>? flip ]", "image-rendering": "auto | crisp-edges | pixelated | optimizeSpeed | optimizeQuality | <-non-standard-image-rendering>", "image-resolution": "[ from-image || <resolution> ] && snap?", "ime-mode": "auto | normal | active | inactive | disabled", "initial-letter": "normal | [ <number> <integer>? ]", "initial-letter-align": "[ auto | alphabetic | hanging | ideographic ]", "inline-size": "<'width'>", "inset": "<'top'>{1,4}", "inset-block": "<'top'>{1,2}", "inset-block-end": "<'top'>", "inset-block-start": "<'top'>", "inset-inline": "<'top'>{1,2}", "inset-inline-end": "<'top'>", "inset-inline-start": "<'top'>", "isolation": "auto | isolate", "justify-content": "normal | <content-distribution> | <overflow-position>? [ <content-position> | left | right ]", "justify-items": "normal | stretch | <baseline-position> | <overflow-position>? [ <self-position> | left | right ] | legacy | legacy && [ left | right | center ]", "justify-self": "auto | normal | stretch | <baseline-position> | <overflow-position>? [ <self-position> | left | right ]", "left": "<length> | <percentage> | auto", "letter-spacing": "normal | <length-percentage>", "line-break": "auto | loose | normal | strict", "line-clamp": "none | <integer>", "line-height": "normal | <number> | <length> | <percentage>", "line-height-step": "<length>", "list-style": "<'list-style-type'> || <'list-style-position'> || <'list-style-image'>", "list-style-image": "<url> | none", "list-style-position": "inside | outside", "list-style-type": "<counter-style> | <string> | none", "margin": "[ <length> | <percentage> | auto ]{1,4}", "margin-block": "<'margin-left'>{1,2}", "margin-block-end": "<'margin-left'>", "margin-block-start": "<'margin-left'>", "margin-bottom": "<length> | <percentage> | auto", "margin-inline": "<'margin-left'>{1,2}", "margin-inline-end": "<'margin-left'>", "margin-inline-start": "<'margin-left'>", "margin-left": "<length> | <percentage> | auto", "margin-right": "<length> | <percentage> | auto", "margin-top": "<length> | <percentage> | auto", "mask": "<mask-layer>#", "mask-border": "<'mask-border-source'> || <'mask-border-slice'> [ / <'mask-border-width'>? [ / <'mask-border-outset'> ]? ]? || <'mask-border-repeat'> || <'mask-border-mode'>", "mask-border-mode": "luminance | alpha", "mask-border-outset": "[ <length> | <number> ]{1,4}", "mask-border-repeat": "[ stretch | repeat | round | space ]{1,2}", "mask-border-slice": "<number-percentage>{1,4} fill?", "mask-border-source": "none | <image>", "mask-border-width": "[ <length-percentage> | <number> | auto ]{1,4}", "mask-clip": "[ <geometry-box> | no-clip ]#", "mask-composite": "<compositing-operator>#", "mask-image": "<mask-reference>#", "mask-mode": "<masking-mode>#", "mask-origin": "<geometry-box>#", "mask-position": "<position>#", "mask-repeat": "<repeat-style>#", "mask-size": "<bg-size>#", "mask-type": "luminance | alpha", "max-block-size": "<'max-width'>", "max-height": "<length> | <percentage> | none | max-content | min-content | fit-content | fill-available", "max-inline-size": "<'max-width'>", "max-lines": "none | <integer>", "max-width": "<length> | <percentage> | none | max-content | min-content | fit-content | fill-available | <-non-standard-width>", "min-block-size": "<'min-width'>", "min-height": "<length> | <percentage> | auto | max-content | min-content | fit-content | fill-available", "min-inline-size": "<'min-width'>", "min-width": "<length> | <percentage> | auto | max-content | min-content | fit-content | fill-available | <-non-standard-width>", "mix-blend-mode": "<blend-mode>", "object-fit": "fill | contain | cover | none | scale-down", "object-position": "<position>", "offset": "[ <'offset-position'>? [ <'offset-path'> [ <'offset-distance'> || <'offset-rotate'> ]? ]? ]! [ / <'offset-anchor'> ]?", "offset-anchor": "auto | <position>", "offset-distance": "<length-percentage>", "offset-path": "none | ray( [ <angle> && <size>? && contain? ] ) | <path()> | <url> | [ <basic-shape> || <geometry-box> ]", "offset-position": "auto | <position>", "offset-rotate": "[ auto | reverse ] || <angle>", "opacity": "<number-zero-one>", "order": "<integer>", "orphans": "<integer>", "outline": "[ <'outline-color'> || <'outline-style'> || <'outline-width'> ]", "outline-color": "<color> | invert", "outline-offset": "<length>", "outline-style": "auto | <'border-style'>", "outline-width": "<line-width>", "overflow": "[ visible | hidden | clip | scroll | auto ]{1,2} | <-non-standard-overflow>", "overflow-anchor": "auto | none", "overflow-block": "visible | hidden | clip | scroll | auto", "overflow-clip-box": "padding-box | content-box", "overflow-inline": "visible | hidden | clip | scroll | auto", "overflow-wrap": "normal | break-word | anywhere", "overflow-x": "visible | hidden | clip | scroll | auto", "overflow-y": "visible | hidden | clip | scroll | auto", "overscroll-behavior": "[ contain | none | auto ]{1,2}", "overscroll-behavior-x": "contain | none | auto", "overscroll-behavior-y": "contain | none | auto", "padding": "[ <length> | <percentage> ]{1,4}", "padding-block": "<'padding-left'>{1,2}", "padding-block-end": "<'padding-left'>", "padding-block-start": "<'padding-left'>", "padding-bottom": "<length> | <percentage>", "padding-inline": "<'padding-left'>{1,2}", "padding-inline-end": "<'padding-left'>", "padding-inline-start": "<'padding-left'>", "padding-left": "<length> | <percentage>", "padding-right": "<length> | <percentage>", "padding-top": "<length> | <percentage>", "page-break-after": "auto | always | avoid | left | right | recto | verso", "page-break-before": "auto | always | avoid | left | right | recto | verso", "page-break-inside": "auto | avoid", "paint-order": "normal | [ fill || stroke || markers ]", "perspective": "none | <length>", "perspective-origin": "<position>", "place-content": "<'align-content'> <'justify-content'>?", "place-items": "<'align-items'> <'justify-items'>?", "place-self": "<'align-self'> <'justify-self'>?", "pointer-events": "auto | none | visiblePainted | visibleFill | visibleStroke | visible | painted | fill | stroke | all | inherit", "position": "static | relative | absolute | sticky | fixed | -webkit-sticky", "quotes": "none | [ <string> <string> ]+", "resize": "none | both | horizontal | vertical | block | inline", "right": "<length> | <percentage> | auto", "rotate": "none | <angle> | [ x | y | z | <number>{3} ] && <angle>", "row-gap": "normal | <length-percentage>", "ruby-align": "start | center | space-between | space-around", "ruby-merge": "separate | collapse | auto", "ruby-position": "over | under | inter-character", "scale": "none | <number>{1,3}", "scrollbar-color": "auto | dark | light | <color>{2}", "scrollbar-width": "auto | thin | none", "scroll-behavior": "auto | smooth", "scroll-margin": "<length>{1,4}", "scroll-margin-block": "<length>{1,2}", "scroll-margin-block-start": "<length>", "scroll-margin-block-end": "<length>", "scroll-margin-bottom": "<length>", "scroll-margin-inline": "<length>{1,2}", "scroll-margin-inline-start": "<length>", "scroll-margin-inline-end": "<length>", "scroll-margin-left": "<length>", "scroll-margin-right": "<length>", "scroll-margin-top": "<length>", "scroll-padding": "[ auto | <length-percentage> ]{1,4}", "scroll-padding-block": "[ auto | <length-percentage> ]{1,2}", "scroll-padding-block-start": "auto | <length-percentage>", "scroll-padding-block-end": "auto | <length-percentage>", "scroll-padding-bottom": "auto | <length-percentage>", "scroll-padding-inline": "[ auto | <length-percentage> ]{1,2}", "scroll-padding-inline-start": "auto | <length-percentage>", "scroll-padding-inline-end": "auto | <length-percentage>", "scroll-padding-left": "auto | <length-percentage>", "scroll-padding-right": "auto | <length-percentage>", "scroll-padding-top": "auto | <length-percentage>", "scroll-snap-align": "[ none | start | end | center ]{1,2}", "scroll-snap-coordinate": "none | <position>#", "scroll-snap-destination": "<position>", "scroll-snap-points-x": "none | repeat( <length-percentage> )", "scroll-snap-points-y": "none | repeat( <length-percentage> )", "scroll-snap-stop": "normal | always", "scroll-snap-type": "none | [ x | y | block | inline | both ] [ mandatory | proximity ]?", "scroll-snap-type-x": "none | mandatory | proximity", "scroll-snap-type-y": "none | mandatory | proximity", "shape-image-threshold": "<number>", "shape-margin": "<length-percentage>", "shape-outside": "none | <shape-box> || <basic-shape> | <image>", "tab-size": "<integer> | <length>", "table-layout": "auto | fixed", "text-align": "start | end | left | right | center | justify | match-parent", "text-align-last": "auto | start | end | left | right | center | justify", "text-combine-upright": "none | all | [ digits <integer>? ]", "text-decoration": "<'text-decoration-line'> || <'text-decoration-style'> || <'text-decoration-color'>", "text-decoration-color": "<color>", "text-decoration-line": "none | [ underline || overline || line-through || blink ]", "text-decoration-skip": "none | [ objects || [ spaces | [ leading-spaces || trailing-spaces ] ] || edges || box-decoration ]", "text-decoration-skip-ink": "auto | none", "text-decoration-style": "solid | double | dotted | dashed | wavy", "text-emphasis": "<'text-emphasis-style'> || <'text-emphasis-color'>", "text-emphasis-color": "<color>", "text-emphasis-position": "[ over | under ] && [ right | left ]", "text-emphasis-style": "none | [ [ filled | open ] || [ dot | circle | double-circle | triangle | sesame ] ] | <string>", "text-indent": "<length-percentage> && hanging? && each-line?", "text-justify": "auto | inter-character | inter-word | none", "text-orientation": "mixed | upright | sideways", "text-overflow": "[ clip | ellipsis | <string> ]{1,2}", "text-rendering": "auto | optimizeSpeed | optimizeLegibility | geometricPrecision", "text-shadow": "none | <shadow-t>#", "text-size-adjust": "none | auto | <percentage>", "text-transform": "none | capitalize | uppercase | lowercase | full-width | full-size-kana", "text-underline-position": "auto | [ under || [ left | right ] ]", "top": "<length> | <percentage> | auto", "touch-action": "auto | none | [ [ pan-x | pan-left | pan-right ] || [ pan-y | pan-up | pan-down ] || pinch-zoom ] | manipulation", "transform": "none | <transform-list>", "transform-box": "border-box | fill-box | view-box", "transform-origin": "[ <length-percentage> | left | center | right | top | bottom ] | [ [ <length-percentage> | left | center | right ] && [ <length-percentage> | top | center | bottom ] ] <length>?", "transform-style": "flat | preserve-3d", "transition": "<single-transition>#", "transition-delay": "<time>#", "transition-duration": "<time>#", "transition-property": "none | <single-transition-property>#", "transition-timing-function": "<timing-function>#", "translate": "none | <length-percentage> [ <length-percentage> <length>? ]?", "unicode-bidi": "normal | embed | isolate | bidi-override | isolate-override | plaintext | -moz-isolate | -moz-isolate-override | -moz-plaintext | -webkit-isolate", "user-select": "auto | text | none | contain | all", "vertical-align": "baseline | sub | super | text-top | text-bottom | middle | top | bottom | <percentage> | <length>", "visibility": "visible | hidden | collapse", "white-space": "normal | pre | nowrap | pre-wrap | pre-line", "widows": "<integer>", "width": "[ <length> | <percentage> ] && [ border-box | content-box ]? | available | min-content | max-content | fit-content | auto", "will-change": "auto | <animateable-feature>#", "word-break": "normal | break-all | keep-all | break-word", "word-spacing": "normal | <length-percentage>", "word-wrap": "normal | break-word", "writing-mode": "horizontal-tb | vertical-rl | vertical-lr | sideways-rl | sideways-lr | <svg-writing-mode>", "z-index": "auto | <integer>", "zoom": "normal | reset | <number> | <percentage>", "-moz-background-clip": "padding | border", "-moz-border-radius-bottomleft": "<'border-bottom-left-radius'>", "-moz-border-radius-bottomright": "<'border-bottom-right-radius'>", "-moz-border-radius-topleft": "<'border-top-left-radius'>", "-moz-border-radius-topright": "<'border-bottom-right-radius'>", "-moz-osx-font-smoothing": "auto | grayscale", "-moz-user-select": "none | text | all | -moz-none", "-ms-flex-align": "start | end | center | baseline | stretch", "-ms-flex-item-align": "auto | start | end | center | baseline | stretch", "-ms-flex-line-pack": "start | end | center | justify | distribute | stretch", "-ms-flex-negative": "<'flex-shrink'>", "-ms-flex-pack": "start | end | center | justify | distribute", "-ms-flex-order": "<integer>", "-ms-flex-positive": "<'flex-grow'>", "-ms-flex-preferred-size": "<'flex-basis'>", "-ms-interpolation-mode": "nearest-neighbor | bicubic", "-ms-grid-column-align": "start | end | center | stretch", "-ms-grid-row-align": "start | end | center | stretch", "-webkit-background-clip": "[ <box> | border | padding | content | text ]#", "-webkit-column-break-after": "always | auto | avoid", "-webkit-column-break-before": "always | auto | avoid", "-webkit-column-break-inside": "always | auto | avoid", "-webkit-font-smoothing": "auto | none | antialiased | subpixel-antialiased", "-webkit-mask-box-image": "[ <url> | <gradient> | none ] [ <length-percentage>{4} <-webkit-mask-box-repeat>{2} ]?", "-webkit-print-color-adjust": "economy | exact", "-webkit-text-security": "none | circle | disc | square", "-webkit-user-drag": "none | element | auto", "-webkit-user-select": "auto | none | text | all", "alignment-baseline": "auto | baseline | before-edge | text-before-edge | middle | central | after-edge | text-after-edge | ideographic | alphabetic | hanging | mathematical", "baseline-shift": "baseline | sub | super | <svg-length>", "behavior": "<url>+", "clip-rule": "nonzero | evenodd", "cue": "<'cue-before'> <'cue-after'>?", "cue-after": "<url> <decibel>? | none", "cue-before": "<url> <decibel>? | none", "dominant-baseline": "auto | use-script | no-change | reset-size | ideographic | alphabetic | hanging | mathematical | central | middle | text-after-edge | text-before-edge", "fill": "<paint>", "fill-opacity": "<number-zero-one>", "fill-rule": "nonzero | evenodd", "glyph-orientation-horizontal": "<angle>", "glyph-orientation-vertical": "<angle>", "kerning": "auto | <svg-length>", "marker": "none | <url>", "marker-end": "none | <url>", "marker-mid": "none | <url>", "marker-start": "none | <url>", "pause": "<'pause-before'> <'pause-after'>?", "pause-after": "<time> | none | x-weak | weak | medium | strong | x-strong", "pause-before": "<time> | none | x-weak | weak | medium | strong | x-strong", "rest": "<'rest-before'> <'rest-after'>?", "rest-after": "<time> | none | x-weak | weak | medium | strong | x-strong", "rest-before": "<time> | none | x-weak | weak | medium | strong | x-strong", "shape-rendering": "auto | optimizeSpeed | crispEdges | geometricPrecision", "src": "[ <url> [ format( <string># ) ]? | local( <family-name> ) ]#", "speak": "auto | none | normal", "speak-as": "normal | spell-out || digits || [ literal-punctuation | no-punctuation ]", "stroke": "<paint>", "stroke-dasharray": "none | [ <svg-length>+ ]#", "stroke-dashoffset": "<svg-length>", "stroke-linecap": "butt | round | square", "stroke-linejoin": "miter | round | bevel", "stroke-miterlimit": "<number-one-or-greater>", "stroke-opacity": "<number-zero-one>", "stroke-width": "<svg-length>", "text-anchor": "start | middle | end", "unicode-range": "<urange>#", "voice-balance": "<number> | left | center | right | leftwards | rightwards", "voice-duration": "auto | <time>", "voice-family": "[ [ <family-name> | <generic-voice> ] , ]* [ <family-name> | <generic-voice> ] | preserve", "voice-pitch": "<frequency> && absolute | [ [ x-low | low | medium | high | x-high ] || [ <frequency> | <semitones> | <percentage> ] ]", "voice-range": "<frequency> && absolute | [ [ x-low | low | medium | high | x-high ] || [ <frequency> | <semitones> | <percentage> ] ]", "voice-rate": "[ normal | x-slow | slow | medium | fast | x-fast ] || <percentage>", "voice-stress": "normal | strong | moderate | none | reduced", "voice-volume": "silent | [ [ x-soft | soft | medium | loud | x-loud ] || <decibel> ]" } };
		}, {}], 2: [function (require, module, exports) {
			//
			//                              list
			//                            ┌──────┐
			//             ┌──────────────┼─head │
			//             │              │ tail─┼──────────────┐
			//             │              └──────┘              │
			//             ▼                                    ▼
			//            item        item        item        item
			//          ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐
			//  null ◀──┼─prev │◀───┼─prev │◀───┼─prev │◀───┼─prev │
			//          │ next─┼───▶│ next─┼───▶│ next─┼───▶│ next─┼──▶ null
			//          ├──────┤    ├──────┤    ├──────┤    ├──────┤
			//          │ data │    │ data │    │ data │    │ data │
			//          └──────┘    └──────┘    └──────┘    └──────┘
			//

			function createItem(data) {
				return {
					prev: null,
					next: null,
					data: data
				};
			}

			function allocateCursor(node, prev, next) {
				var cursor;

				if (cursors !== null) {
					cursor = cursors;
					cursors = cursors.cursor;
					cursor.prev = prev;
					cursor.next = next;
					cursor.cursor = node.cursor;
				} else {
					cursor = {
						prev: prev,
						next: next,
						cursor: node.cursor
					};
				}

				node.cursor = cursor;

				return cursor;
			}

			function releaseCursor(node) {
				var cursor = node.cursor;

				node.cursor = cursor.cursor;
				cursor.prev = null;
				cursor.next = null;
				cursor.cursor = cursors;
				cursors = cursor;
			}

			var cursors = null;
			var List = function () {
				this.cursor = null;
				this.head = null;
				this.tail = null;
			};

			List.createItem = createItem;
			List.prototype.createItem = createItem;

			List.prototype.updateCursors = function (prevOld, prevNew, nextOld, nextNew) {
				var cursor = this.cursor;

				while (cursor !== null) {
					if (cursor.prev === prevOld) {
						cursor.prev = prevNew;
					}

					if (cursor.next === nextOld) {
						cursor.next = nextNew;
					}

					cursor = cursor.cursor;
				}
			};

			List.prototype.getSize = function () {
				var size = 0;
				var cursor = this.head;

				while (cursor) {
					size++;
					cursor = cursor.next;
				}

				return size;
			};

			List.prototype.fromArray = function (array) {
				var cursor = null;

				this.head = null;

				for (var i = 0; i < array.length; i++) {
					var item = createItem(array[i]);

					if (cursor !== null) {
						cursor.next = item;
					} else {
						this.head = item;
					}

					item.prev = cursor;
					cursor = item;
				}

				this.tail = cursor;

				return this;
			};

			List.prototype.toArray = function () {
				var cursor = this.head;
				var result = [];

				while (cursor) {
					result.push(cursor.data);
					cursor = cursor.next;
				}

				return result;
			};

			List.prototype.toJSON = List.prototype.toArray;

			List.prototype.isEmpty = function () {
				return this.head === null;
			};

			List.prototype.first = function () {
				return this.head && this.head.data;
			};

			List.prototype.last = function () {
				return this.tail && this.tail.data;
			};

			List.prototype.each = function (fn, context) {
				var item;

				if (context === undefined) {
					context = this;
				}

				// push cursor
				var cursor = allocateCursor(this, null, this.head);

				while (cursor.next !== null) {
					item = cursor.next;
					cursor.next = item.next;

					fn.call(context, item.data, item, this);
				}

				// pop cursor
				releaseCursor(this);
			};

			List.prototype.forEach = List.prototype.each;

			List.prototype.eachRight = function (fn, context) {
				var item;

				if (context === undefined) {
					context = this;
				}

				// push cursor
				var cursor = allocateCursor(this, this.tail, null);

				while (cursor.prev !== null) {
					item = cursor.prev;
					cursor.prev = item.prev;

					fn.call(context, item.data, item, this);
				}

				// pop cursor
				releaseCursor(this);
			};

			List.prototype.forEachRight = List.prototype.eachRight;

			List.prototype.nextUntil = function (start, fn, context) {
				if (start === null) {
					return;
				}

				var item;

				if (context === undefined) {
					context = this;
				}

				// push cursor
				var cursor = allocateCursor(this, null, start);

				while (cursor.next !== null) {
					item = cursor.next;
					cursor.next = item.next;

					if (fn.call(context, item.data, item, this)) {
						break;
					}
				}

				// pop cursor
				releaseCursor(this);
			};

			List.prototype.prevUntil = function (start, fn, context) {
				if (start === null) {
					return;
				}

				var item;

				if (context === undefined) {
					context = this;
				}

				// push cursor
				var cursor = allocateCursor(this, start, null);

				while (cursor.prev !== null) {
					item = cursor.prev;
					cursor.prev = item.prev;

					if (fn.call(context, item.data, item, this)) {
						break;
					}
				}

				// pop cursor
				releaseCursor(this);
			};

			List.prototype.some = function (fn, context) {
				var cursor = this.head;

				if (context === undefined) {
					context = this;
				}

				while (cursor !== null) {
					if (fn.call(context, cursor.data, cursor, this)) {
						return true;
					}

					cursor = cursor.next;
				}

				return false;
			};

			List.prototype.map = function (fn, context) {
				var result = new List();
				var cursor = this.head;

				if (context === undefined) {
					context = this;
				}

				while (cursor !== null) {
					result.appendData(fn.call(context, cursor.data, cursor, this));
					cursor = cursor.next;
				}

				return result;
			};

			List.prototype.filter = function (fn, context) {
				var result = new List();
				var cursor = this.head;

				if (context === undefined) {
					context = this;
				}

				while (cursor !== null) {
					if (fn.call(context, cursor.data, cursor, this)) {
						result.appendData(cursor.data);
					}
					cursor = cursor.next;
				}

				return result;
			};

			List.prototype.clear = function () {
				this.head = null;
				this.tail = null;
			};

			List.prototype.copy = function () {
				var result = new List();
				var cursor = this.head;

				while (cursor !== null) {
					result.insert(createItem(cursor.data));
					cursor = cursor.next;
				}

				return result;
			};

			List.prototype.prepend = function (item) {
				//      head
				//    ^
				// item
				this.updateCursors(null, item, this.head, item);

				// insert to the beginning of the list
				if (this.head !== null) {
					// new item <- first item
					this.head.prev = item;

					// new item -> first item
					item.next = this.head;
				} else {
					// if list has no head, then it also has no tail
					// in this case tail points to the new item
					this.tail = item;
				}

				// head always points to new item
				this.head = item;

				return this;
			};

			List.prototype.prependData = function (data) {
				return this.prepend(createItem(data));
			};

			List.prototype.append = function (item) {
				return this.insert(item);
			};

			List.prototype.appendData = function (data) {
				return this.insert(createItem(data));
			};

			List.prototype.insert = function (item, before) {
				if (before !== undefined && before !== null) {
					// prev   before
					//      ^
					//     item
					this.updateCursors(before.prev, item, before, item);

					if (before.prev === null) {
						// insert to the beginning of list
						if (this.head !== before) {
							throw new Error("before doesn't belong to list");
						}

						// since head points to before therefore list doesn't empty
						// no need to check tail
						this.head = item;
						before.prev = item;
						item.next = before;

						this.updateCursors(null, item);
					} else {

						// insert between two items
						before.prev.next = item;
						item.prev = before.prev;

						before.prev = item;
						item.next = before;
					}
				} else {
					// tail
					//      ^
					//      item
					this.updateCursors(this.tail, item, null, item);

					// insert to the ending of the list
					if (this.tail !== null) {
						// last item -> new item
						this.tail.next = item;

						// last item <- new item
						item.prev = this.tail;
					} else {
						// if list has no tail, then it also has no head
						// in this case head points to new item
						this.head = item;
					}

					// tail always points to new item
					this.tail = item;
				}

				return this;
			};

			List.prototype.insertData = function (data, before) {
				return this.insert(createItem(data), before);
			};

			List.prototype.remove = function (item) {
				//      item
				//       ^
				// prev     next
				this.updateCursors(item, item.prev, item, item.next);

				if (item.prev !== null) {
					item.prev.next = item.next;
				} else {
					if (this.head !== item) {
						throw new Error("item doesn't belong to list");
					}

					this.head = item.next;
				}

				if (item.next !== null) {
					item.next.prev = item.prev;
				} else {
					if (this.tail !== item) {
						throw new Error("item doesn't belong to list");
					}

					this.tail = item.prev;
				}

				item.prev = null;
				item.next = null;

				return item;
			};

			List.prototype.push = function (data) {
				this.insert(createItem(data));
			};

			List.prototype.pop = function () {
				if (this.tail !== null) {
					return this.remove(this.tail);
				}
			};

			List.prototype.unshift = function (data) {
				this.prepend(createItem(data));
			};

			List.prototype.shift = function () {
				if (this.head !== null) {
					return this.remove(this.head);
				}
			};

			List.prototype.prependList = function (list) {
				return this.insertList(list, this.head);
			};

			List.prototype.appendList = function (list) {
				return this.insertList(list);
			};

			List.prototype.insertList = function (list, before) {
				// ignore empty lists
				if (list.head === null) {
					return this;
				}

				if (before !== undefined && before !== null) {
					this.updateCursors(before.prev, list.tail, before, list.head);

					// insert in the middle of dist list
					if (before.prev !== null) {
						// before.prev <-> list.head
						before.prev.next = list.head;
						list.head.prev = before.prev;
					} else {
						this.head = list.head;
					}

					before.prev = list.tail;
					list.tail.next = before;
				} else {
					this.updateCursors(this.tail, list.tail, null, list.head);

					// insert to end of the list
					if (this.tail !== null) {
						// if destination list has a tail, then it also has a head,
						// but head doesn't change

						// dest tail -> source head
						this.tail.next = list.head;

						// dest tail <- source head
						list.head.prev = this.tail;
					} else {
						// if list has no a tail, then it also has no a head
						// in this case points head to new item
						this.head = list.head;
					}

					// tail always start point to new item
					this.tail = list.tail;
				}

				list.head = null;
				list.tail = null;

				return this;
			};

			List.prototype.replace = function (oldItem, newItemOrList) {
				if ("head" in newItemOrList) {
					this.insertList(newItemOrList, oldItem);
				} else {
					this.insert(newItemOrList, oldItem);
				}

				this.remove(oldItem);
			};

			module.exports = List;

		}, {}], 3: [function (require, module, exports) {
			var adoptBuffer = require("./adopt-buffer");
			var isBOM = require("../tokenizer").isBOM;

			var N = 10;
			var F = 12;
			var R = 13;

			function computeLinesAndColumns(host, source) {
				var sourceLength = source.length;
				var lines = adoptBuffer(host.lines, sourceLength); // +1
				var line = host.startLine;
				var columns = adoptBuffer(host.columns, sourceLength);
				var column = host.startColumn;
				var startOffset = source.length > 0 ? isBOM(source.charCodeAt(0)) : 0;

				for (var i = startOffset; i < sourceLength; i++) { // -1
					var code = source.charCodeAt(i);

					lines[i] = line;
					columns[i] = column++;

					if (code === N || code === R || code === F) {
						if (code === R && i + 1 < sourceLength && source.charCodeAt(i + 1) === N) {
							i++;
							lines[i] = line;
							columns[i] = column;
						}

						line++;
						column = 1;
					}
				}

				lines[i] = line;
				columns[i] = column;

				host.lines = lines;
				host.columns = columns;
			}

			var OffsetToLocation = function () {
				this.lines = null;
				this.columns = null;
				this.linesAndColumnsComputed = false;
			};

			OffsetToLocation.prototype = {
				setSource: function (source, startOffset, startLine, startColumn) {
					this.source = source;
					this.startOffset = typeof startOffset === "undefined" ? 0 : startOffset;
					this.startLine = typeof startLine === "undefined" ? 1 : startLine;
					this.startColumn = typeof startColumn === "undefined" ? 1 : startColumn;
					this.linesAndColumnsComputed = false;
				},

				ensureLinesAndColumnsComputed: function () {
					if (!this.linesAndColumnsComputed) {
						computeLinesAndColumns(this, this.source);
						this.linesAndColumnsComputed = true;
					}
				},
				getLocation: function (offset, filename) {
					this.ensureLinesAndColumnsComputed();

					return {
						source: filename,
						offset: this.startOffset + offset,
						line: this.lines[offset],
						column: this.columns[offset]
					};
				},
				getLocationRange: function (start, end, filename) {
					this.ensureLinesAndColumnsComputed();

					return {
						source: filename,
						start: {
							offset: this.startOffset + start,
							line: this.lines[start],
							column: this.columns[start]
						},
						end: {
							offset: this.startOffset + end,
							line: this.lines[end],
							column: this.columns[end]
						}
					};
				}
			};

			module.exports = OffsetToLocation;

		}, { "../tokenizer": 107, "./adopt-buffer": 6 }], 4: [function (require, module, exports) {
			var createCustomError = require("../utils/createCustomError");
			var MAX_LINE_LENGTH = 100;
			var OFFSET_CORRECTION = 60;
			var TAB_REPLACEMENT = "    ";

			function sourceFragment(error, extraLines) {
				function processLines(start, end) {
					return lines.slice(start, end).map(function (line, idx) {
						var num = String(start + idx + 1);

						while (num.length < maxNumLength) {
							num = " " + num;
						}

						return num + " |" + line;
					}).join("\n");
				}

				var lines = error.source.split(/\r\n?|\n|\f/);
				var line = error.line;
				var column = error.column;
				var startLine = Math.max(1, line - extraLines) - 1;
				var endLine = Math.min(line + extraLines, lines.length + 1);
				var maxNumLength = Math.max(4, String(endLine).length) + 1;
				var cutLeft = 0;

				// column correction according to replaced tab before column
				column += (TAB_REPLACEMENT.length - 1) * (lines[line - 1].substr(0, column - 1).match(/\t/g) || []).length;

				if (column > MAX_LINE_LENGTH) {
					cutLeft = column - OFFSET_CORRECTION + 3;
					column = OFFSET_CORRECTION - 2;
				}

				for (var i = startLine; i <= endLine; i++) {
					if (i >= 0 && i < lines.length) {
						lines[i] = lines[i].replace(/\t/g, TAB_REPLACEMENT);
						lines[i] =
							(cutLeft > 0 && lines[i].length > cutLeft ? "\u2026" : "") +
							lines[i].substr(cutLeft, MAX_LINE_LENGTH - 2) +
							(lines[i].length > cutLeft + MAX_LINE_LENGTH - 1 ? "\u2026" : "");
					}
				}

				return [
					processLines(startLine, line),
					new Array(column + maxNumLength + 2).join("-") + "^",
					processLines(line, endLine)
				].filter(Boolean).join("\n");
			}

			var SyntaxError = function (message, source, offset, line, column) {
				var error = createCustomError("SyntaxError", message);

				error.source = source;
				error.offset = offset;
				error.line = line;
				error.column = column;

				error.sourceFragment = function (extraLines) {
					return sourceFragment(error, isNaN(extraLines) ? 0 : extraLines);
				};
				Object.defineProperty(error, "formattedMessage", {
					get: function () {
						return (
							"Parse error: " + error.message + "\n" +
							sourceFragment(error, 2)
						);
					}
				});

				// for backward capability
				error.parseError = {
					offset: offset,
					line: line,
					column: column
				};

				return error;
			};

			module.exports = SyntaxError;

		}, { "../utils/createCustomError": 110 }], 5: [function (require, module, exports) {
			var constants = require("../tokenizer/const");
			var TYPE = constants.TYPE;
			var NAME = constants.NAME;

			var utils = require("../tokenizer/utils");
			var cmpStr = utils.cmpStr;

			var EOF = TYPE.EOF;
			var WHITESPACE = TYPE.WhiteSpace;
			var COMMENT = TYPE.Comment;

			var OFFSET_MASK = 0x00FFFFFF;
			var TYPE_SHIFT = 24;

			var TokenStream = function () {
				this.offsetAndType = null;
				this.balance = null;

				this.reset();
			};

			TokenStream.prototype = {
				reset: function () {
					this.eof = false;
					this.tokenIndex = -1;
					this.tokenType = 0;
					this.tokenStart = this.firstCharOffset;
					this.tokenEnd = this.firstCharOffset;
				},

				lookupType: function (offset) {
					offset += this.tokenIndex;

					if (offset < this.tokenCount) {
						return this.offsetAndType[offset] >> TYPE_SHIFT;
					}

					return EOF;
				},
				lookupOffset: function (offset) {
					offset += this.tokenIndex;

					if (offset < this.tokenCount) {
						return this.offsetAndType[offset - 1] & OFFSET_MASK;
					}

					return this.source.length;
				},
				lookupValue: function (offset, referenceStr) {
					offset += this.tokenIndex;

					if (offset < this.tokenCount) {
						return cmpStr(
							this.source,
							this.offsetAndType[offset - 1] & OFFSET_MASK,
							this.offsetAndType[offset] & OFFSET_MASK,
							referenceStr
						);
					}

					return false;
				},
				getTokenStart: function (tokenIndex) {
					if (tokenIndex === this.tokenIndex) {
						return this.tokenStart;
					}

					if (tokenIndex > 0) {
						return tokenIndex < this.tokenCount
							? this.offsetAndType[tokenIndex - 1] & OFFSET_MASK
							: this.offsetAndType[this.tokenCount] & OFFSET_MASK;
					}

					return this.firstCharOffset;
				},

				// TODO: -> skipUntilBalanced
				getRawLength: function (startToken, mode) {
					var cursor = startToken;
					var balanceEnd;
					var offset = this.offsetAndType[Math.max(cursor - 1, 0)] & OFFSET_MASK;
					var type;

					loop:
					for (; cursor < this.tokenCount; cursor++) {
						balanceEnd = this.balance[cursor];

						// stop scanning on balance edge that points to offset before start token
						if (balanceEnd < startToken) {
							break loop;
						}

						type = this.offsetAndType[cursor] >> TYPE_SHIFT;

						// check token is stop type
						switch (mode(type, this.source, offset)) {
							case 1:
								break loop;

							case 2:
								cursor++;
								break loop;

							default:
								offset = this.offsetAndType[cursor] & OFFSET_MASK;

								// fast forward to the end of balanced block
								if (this.balance[balanceEnd] === cursor) {
									cursor = balanceEnd;
								}
						}
					}

					return cursor - this.tokenIndex;
				},
				isBalanceEdge: function (pos) {
					return this.balance[this.tokenIndex] < pos;
				},
				isDelim: function (code, offset) {
					if (offset) {
						return (
							this.lookupType(offset) === TYPE.Delim &&
							this.source.charCodeAt(this.lookupOffset(offset)) === code
						);
					}

					return (
						this.tokenType === TYPE.Delim &&
						this.source.charCodeAt(this.tokenStart) === code
					);
				},

				getTokenValue: function () {
					return this.source.substring(this.tokenStart, this.tokenEnd);
				},
				getTokenLength: function () {
					return this.tokenEnd - this.tokenStart;
				},
				substrToCursor: function (start) {
					return this.source.substring(start, this.tokenStart);
				},

				skipWS: function () {
					for (var i = this.tokenIndex, skipTokenCount = 0; i < this.tokenCount; i++ , skipTokenCount++) {
						if ((this.offsetAndType[i] >> TYPE_SHIFT) !== WHITESPACE) {
							break;
						}
					}

					if (skipTokenCount > 0) {
						this.skip(skipTokenCount);
					}
				},
				skipSC: function () {
					while (this.tokenType === WHITESPACE || this.tokenType === COMMENT) {
						this.next();
					}
				},
				skip: function (tokenCount) {
					var next = this.tokenIndex + tokenCount;

					if (next < this.tokenCount) {
						this.tokenIndex = next;
						this.tokenStart = this.offsetAndType[next - 1] & OFFSET_MASK;
						next = this.offsetAndType[next];
						this.tokenType = next >> TYPE_SHIFT;
						this.tokenEnd = next & OFFSET_MASK;
					} else {
						this.tokenIndex = this.tokenCount;
						this.next();
					}
				},
				next: function () {
					var next = this.tokenIndex + 1;

					if (next < this.tokenCount) {
						this.tokenIndex = next;
						this.tokenStart = this.tokenEnd;
						next = this.offsetAndType[next];
						this.tokenType = next >> TYPE_SHIFT;
						this.tokenEnd = next & OFFSET_MASK;
					} else {
						this.tokenIndex = this.tokenCount;
						this.eof = true;
						this.tokenType = EOF;
						this.tokenStart = this.tokenEnd = this.source.length;
					}
				},

				dump: function () {
					var offset = this.firstCharOffset;

					return Array.prototype.slice.call(this.offsetAndType, 0, this.tokenCount).map(function (item, idx) {
						var start = offset;
						var end = item & OFFSET_MASK;

						offset = end;

						return {
							idx: idx,
							type: NAME[item >> TYPE_SHIFT],
							chunk: this.source.substring(start, end),
							balance: this.balance[idx]
						};
					}, this);
				}
			};

			module.exports = TokenStream;

		}, { "../tokenizer/const": 106, "../tokenizer/utils": 108 }], 6: [function (require, module, exports) {
			var MIN_SIZE = 16 * 1024;
			var SafeUint32Array = typeof Uint32Array !== "undefined" ? Uint32Array : Array; // fallback on Array when TypedArray is not supported

			module.exports = function adoptBuffer(buffer, size) {
				if (buffer === null || buffer.length < size) {
					return new SafeUint32Array(Math.max(size + 1024, MIN_SIZE));
				}

				return buffer;
			};

		}, {}], 7: [function (require, module, exports) {
			var List = require("../common/List");

			module.exports = function createConvertors(walk) {
				return {
					fromPlainObject: function (ast) {
						walk(ast, {
							enter: function (node) {
								if (node.children && node.children instanceof List === false) {
									node.children = new List().fromArray(node.children);
								}
							}
						});

						return ast;
					},
					toPlainObject: function (ast) {
						walk(ast, {
							leave: function (node) {
								if (node.children && node.children instanceof List) {
									node.children = node.children.toArray();
								}
							}
						});

						return ast;
					}
				};
			};

		}, { "../common/List": 2 }], 8: [function (require, module, exports) {
			var sourceMap = require("./sourceMap");
			var hasOwnProperty = Object.prototype.hasOwnProperty;

			function processChildren(node, delimeter) {
				var list = node.children;
				var prev = null;

				if (typeof delimeter !== "function") {
					list.forEach(this.node, this);
				} else {
					list.forEach(function (node) {
						if (prev !== null) {
							delimeter.call(this, prev);
						}

						this.node(node);
						prev = node;
					}, this);
				}
			}

			module.exports = function createGenerator(config) {
				function processNode(node) {
					if (hasOwnProperty.call(types, node.type)) {
						types[node.type].call(this, node);
					} else {
						throw new Error("Unknown node type: " + node.type);
					}
				}

				var types = {};

				if (config.node) {
					for (var name in config.node) {
						types[name] = config.node[name].generate;
					}
				}

				return function (node, options) {
					var buffer = "";
					var handlers = {
						children: processChildren,
						node: processNode,
						chunk: function (chunk) {
							buffer += chunk;
						},
						result: function () {
							return buffer;
						}
					};

					if (options) {
						if (typeof options.decorator === "function") {
							handlers = options.decorator(handlers);
						}

						if (options.sourceMap) {
							handlers = sourceMap(handlers);
						}
					}

					handlers.node(node);

					return handlers.result();
				};
			};

		}, { "./sourceMap": 9 }], 9: [function (require, module, exports) {
			var SourceMapGenerator = require("source-map").SourceMapGenerator;
			var trackNodes = {
				Atrule: true,
				Selector: true,
				Declaration: true
			};

			module.exports = function generateSourceMap(handlers) {
				var map = new SourceMapGenerator();
				var line = 1;
				var column = 0;
				var generated = {
					line: 1,
					column: 0
				};
				var original = {
					line: 0, // should be zero to add first mapping
					column: 0
				};
				var sourceMappingActive = false;
				var activatedGenerated = {
					line: 1,
					column: 0
				};
				var activatedMapping = {
					generated: activatedGenerated
				};

				var handlersNode = handlers.node;
				handlers.node = function (node) {
					if (node.loc && node.loc.start && trackNodes.hasOwnProperty(node.type)) {
						var nodeLine = node.loc.start.line;
						var nodeColumn = node.loc.start.column - 1;

						if (original.line !== nodeLine ||
							original.column !== nodeColumn) {
							original.line = nodeLine;
							original.column = nodeColumn;

							generated.line = line;
							generated.column = column;

							if (sourceMappingActive) {
								sourceMappingActive = false;
								if (generated.line !== activatedGenerated.line ||
									generated.column !== activatedGenerated.column) {
									map.addMapping(activatedMapping);
								}
							}

							sourceMappingActive = true;
							map.addMapping({
								source: node.loc.source,
								original: original,
								generated: generated
							});
						}
					}

					handlersNode.call(this, node);

					if (sourceMappingActive && trackNodes.hasOwnProperty(node.type)) {
						activatedGenerated.line = line;
						activatedGenerated.column = column;
					}
				};

				var handlersChunk = handlers.chunk;
				handlers.chunk = function (chunk) {
					for (var i = 0; i < chunk.length; i++) {
						if (chunk.charCodeAt(i) === 10) { // \n
							line++;
							column = 0;
						} else {
							column++;
						}
					}

					handlersChunk(chunk);
				};

				var handlersResult = handlers.result;
				handlers.result = function () {
					if (sourceMappingActive) {
						map.addMapping(activatedMapping);
					}

					return {
						css: handlersResult(),
						map: map
					};
				};

				return handlers;
			};

		}, { "source-map": 123 }], 10: [function (require, module, exports) {
			module.exports = require("./syntax");

		}, { "./syntax": 44 }], 11: [function (require, module, exports) {
			var SyntaxReferenceError = require("./error").SyntaxReferenceError;
			var MatchError = require("./error").MatchError;
			var names = require("../utils/names");
			var generic = require("./generic");
			var parse = require("./grammar/parse");
			var generate = require("./grammar/generate");
			var walk = require("./grammar/walk");
			var prepareTokens = require("./prepare-tokens");
			var buildMatchGraph = require("./match-graph").buildMatchGraph;
			var matchAsTree = require("./match").matchAsTree;
			var trace = require("./trace");
			var search = require("./search");
			var getStructureFromConfig = require("./structure").getStructureFromConfig;
			var cssWideKeywords = buildMatchGraph("inherit | initial | unset");
			var cssWideKeywordsWithExpression = buildMatchGraph("inherit | initial | unset | <-ms-legacy-expression>");

			function dumpMapSyntax(map, syntaxAsAst) {
				var result = {};

				for (var name in map) {
					if (map[name].syntax) {
						result[name] = syntaxAsAst ? map[name].syntax : generate(map[name].syntax);
					}
				}

				return result;
			}

			function valueHasVar(tokens) {
				for (var i = 0; i < tokens.length; i++) {
					if (tokens[i].value.toLowerCase() === "var(") {
						return true;
					}
				}

				return false;
			}

			function buildMatchResult(match, error, iterations) {
				return {
					matched: match,
					iterations: iterations,
					error: error,
					getTrace: trace.getTrace,
					isType: trace.isType,
					isProperty: trace.isProperty,
					isKeyword: trace.isKeyword
				};
			}

			function matchSyntax(lexer, syntax, value, useCommon) {
				var tokens = prepareTokens(value, lexer.syntax);
				var result;

				if (valueHasVar(tokens)) {
					return buildMatchResult(null, new Error("Matching for a tree with var() is not supported"));
				}

				if (useCommon) {
					result = matchAsTree(tokens, lexer.valueCommonSyntax, lexer);
				}

				if (!useCommon || !result.match) {
					result = matchAsTree(tokens, syntax.match, lexer);
					if (!result.match) {
						return buildMatchResult(
							null,
							new MatchError(result.reason, syntax.syntax, value, result),
							result.iterations
						);
					}
				}

				return buildMatchResult(result.match, null, result.iterations);
			}

			var Lexer = function (config, syntax, structure) {
				this.valueCommonSyntax = cssWideKeywords;
				this.syntax = syntax;
				this.generic = false;
				this.properties = {};
				this.types = {};
				this.structure = structure || getStructureFromConfig(config);

				if (config) {
					if (config.types) {
						for (var name in config.types) {
							this.addType_(name, config.types[name]);
						}
					}

					if (config.generic) {
						this.generic = true;
						for (var name in generic) {
							this.addType_(name, generic[name]);
						}
					}

					if (config.properties) {
						for (var name in config.properties) {
							this.addProperty_(name, config.properties[name]);
						}
					}
				}
			};

			Lexer.prototype = {
				structure: {},
				checkStructure: function (ast) {
					function collectWarning(node, message) {
						warns.push({
							node: node,
							message: message
						});
					}

					var structure = this.structure;
					var warns = [];

					this.syntax.walk(ast, function (node) {
						if (structure.hasOwnProperty(node.type)) {
							structure[node.type].check(node, collectWarning);
						} else {
							collectWarning(node, "Unknown node type `" + node.type + "`");
						}
					});

					return warns.length ? warns : false;
				},

				createDescriptor: function (syntax, type, name) {
					var ref = {
						type: type,
						name: name
					};
					var descriptor = {
						type: type,
						name: name,
						syntax: null,
						match: null
					};

					if (typeof syntax === "function") {
						descriptor.match = buildMatchGraph(syntax, ref);
					} else {
						if (typeof syntax === "string") {
							// lazy parsing on first access
							Object.defineProperty(descriptor, "syntax", {
								get: function () {
									Object.defineProperty(descriptor, "syntax", {
										value: parse(syntax)
									});

									return descriptor.syntax;
								}
							});
						} else {
							descriptor.syntax = syntax;
						}

						// lazy graph build on first access
						Object.defineProperty(descriptor, "match", {
							get: function () {
								Object.defineProperty(descriptor, "match", {
									value: buildMatchGraph(descriptor.syntax, ref)
								});

								return descriptor.match;
							}
						});
					}

					return descriptor;
				},
				addProperty_: function (name, syntax) {
					this.properties[name] = this.createDescriptor(syntax, "Property", name);
				},
				addType_: function (name, syntax) {
					this.types[name] = this.createDescriptor(syntax, "Type", name);

					if (syntax === generic["-ms-legacy-expression"]) {
						this.valueCommonSyntax = cssWideKeywordsWithExpression;
					}
				},

				matchDeclaration: function (node) {
					if (node.type !== "Declaration") {
						return buildMatchResult(null, new Error("Not a Declaration node"));
					}

					return this.matchProperty(node.property, node.value);
				},
				matchProperty: function (propertyName, value) {
					var property = names.property(propertyName);

					// don't match syntax for a custom property
					if (property.custom) {
						return buildMatchResult(null, new Error("Lexer matching doesn't applicable for custom properties"));
					}

					var propertySyntax = property.vendor
						? this.getProperty(property.name) || this.getProperty(property.basename)
						: this.getProperty(property.name);

					if (!propertySyntax) {
						return buildMatchResult(null, new SyntaxReferenceError("Unknown property", propertyName));
					}

					return matchSyntax(this, propertySyntax, value, true);
				},
				matchType: function (typeName, value) {
					var typeSyntax = this.getType(typeName);

					if (!typeSyntax) {
						return buildMatchResult(null, new SyntaxReferenceError("Unknown type", typeName));
					}

					return matchSyntax(this, typeSyntax, value, false);
				},
				match: function (syntax, value) {
					if (typeof syntax !== "string" && (!syntax || !syntax.type)) {
						return buildMatchResult(null, new SyntaxReferenceError("Bad syntax"));
					}

					if (typeof syntax === "string" || !syntax.match) {
						syntax = this.createDescriptor(syntax, "Type", "anonymous");
					}

					return matchSyntax(this, syntax, value, false);
				},

				findValueFragments: function (propertyName, value, type, name) {
					return search.matchFragments(this, value, this.matchProperty(propertyName, value), type, name);
				},
				findDeclarationValueFragments: function (declaration, type, name) {
					return search.matchFragments(this, declaration.value, this.matchDeclaration(declaration), type, name);
				},
				findAllFragments: function (ast, type, name) {
					var result = [];

					this.syntax.walk(ast, {
						visit: "Declaration",
						enter: function (declaration) {
							result.push.apply(result, this.findDeclarationValueFragments(declaration, type, name));
						}.bind(this)
					});

					return result;
				},

				getProperty: function (name) {
					return this.properties.hasOwnProperty(name) ? this.properties[name] : null;
				},
				getType: function (name) {
					return this.types.hasOwnProperty(name) ? this.types[name] : null;
				},

				validate: function () {
					function validate(syntax, name, broken, descriptor) {
						if (broken.hasOwnProperty(name)) {
							return broken[name];
						}

						broken[name] = false;
						if (descriptor.syntax !== null) {
							walk(descriptor.syntax, function (node) {
								if (node.type !== "Type" && node.type !== "Property") {
									return;
								}

								var map = node.type === "Type" ? syntax.types : syntax.properties;
								var brokenMap = node.type === "Type" ? brokenTypes : brokenProperties;

								if (!map.hasOwnProperty(node.name) || validate(syntax, node.name, brokenMap, map[node.name])) {
									broken[name] = true;
								}
							}, this);
						}
					}

					var brokenTypes = {};
					var brokenProperties = {};

					for (var key in this.types) {
						validate(this, key, brokenTypes, this.types[key]);
					}

					for (var key in this.properties) {
						validate(this, key, brokenProperties, this.properties[key]);
					}

					brokenTypes = Object.keys(brokenTypes).filter(function (name) {
						return brokenTypes[name];
					});
					brokenProperties = Object.keys(brokenProperties).filter(function (name) {
						return brokenProperties[name];
					});

					if (brokenTypes.length || brokenProperties.length) {
						return {
							types: brokenTypes,
							properties: brokenProperties
						};
					}

					return null;
				},
				dump: function (syntaxAsAst) {
					return {
						generic: this.generic,
						types: dumpMapSyntax(this.types, syntaxAsAst),
						properties: dumpMapSyntax(this.properties, syntaxAsAst)
					};
				},
				toString: function () {
					return JSON.stringify(this.dump());
				}
			};

			module.exports = Lexer;

		}, { "../utils/names": 111, "./error": 12, "./generic": 15, "./grammar/generate": 17, "./grammar/parse": 19, "./grammar/walk": 21, "./match": 23, "./match-graph": 22, "./prepare-tokens": 24, "./search": 25, "./structure": 26, "./trace": 27 }], 12: [function (require, module, exports) {
			var createCustomError = require("../utils/createCustomError");
			var generateGrammar = require("./grammar/generate");

			function fromMatchResult(matchResult) {
				var tokens = matchResult.tokens;
				var longestMatch = matchResult.longestMatch;
				var node = longestMatch < tokens.length ? tokens[longestMatch].node : null;
				var mismatchOffset = -1;
				var entries = 0;
				var css = "";

				for (var i = 0; i < tokens.length; i++) {
					if (i === longestMatch) {
						mismatchOffset = css.length;
					}

					if (node !== null && tokens[i].node === node) {
						if (i <= longestMatch) {
							entries++;
						} else {
							entries = 0;
						}
					}

					css += tokens[i].value;
				}

				return {
					node: node,
					css: css,
					mismatchOffset: mismatchOffset === -1 ? css.length : mismatchOffset,
					last: node === null || entries > 1
				};
			}

			function getLocation(node, point) {
				var loc = node && node.loc && node.loc[point];

				if (loc) {
					return {
						offset: loc.offset,
						line: loc.line,
						column: loc.column
					};
				}

				return null;
			}

			var SyntaxReferenceError = function (type, referenceName) {
				var error = createCustomError(
					"SyntaxReferenceError",
					type + (referenceName ? " `" + referenceName + "`" : "")
				);

				error.reference = referenceName;

				return error;
			};

			var MatchError = function (message, syntax, node, matchResult) {
				var error = createCustomError("SyntaxMatchError", message);
				var details = fromMatchResult(matchResult);
				var mismatchOffset = details.mismatchOffset || 0;
				var badNode = details.node || node;
				var end = getLocation(badNode, "end");
				var start = details.last ? end : getLocation(badNode, "start");
				var css = details.css;

				error.rawMessage = message;
				error.syntax = syntax ? generateGrammar(syntax) : "<generic>";
				error.css = css;
				error.mismatchOffset = mismatchOffset;
				error.loc = {
					source: (badNode && badNode.loc && badNode.loc.source) || "<unknown>",
					start: start,
					end: end
				};
				error.line = start ? start.line : undefined;
				error.column = start ? start.column : undefined;
				error.offset = start ? start.offset : undefined;
				error.message = message + "\n" +
					"  syntax: " + error.syntax + "\n" +
					"   value: " + (error.css || "<empty string>") + "\n" +
					"  --------" + new Array(error.mismatchOffset + 1).join("-") + "^";

				return error;
			};

			module.exports = {
				SyntaxReferenceError: SyntaxReferenceError,
				MatchError: MatchError
			};

		}, { "../utils/createCustomError": 110, "./grammar/generate": 17 }], 13: [function (require, module, exports) {
			var isDigit = require("../tokenizer").isDigit;
			var cmpChar = require("../tokenizer").cmpChar;
			var TYPE = require("../tokenizer").TYPE;

			var DELIM = TYPE.Delim;
			var WHITESPACE = TYPE.WhiteSpace;
			var COMMENT = TYPE.Comment;
			var IDENT = TYPE.Ident;
			var NUMBER = TYPE.Number;
			var DIMENSION = TYPE.Dimension;
			var PLUSSIGN = 0x002B;    // U+002B PLUS SIGN (+)
			var HYPHENMINUS = 0x002D; // U+002D HYPHEN-MINUS (-)
			var N = 0x006E;           // U+006E LATIN SMALL LETTER N (n)
			var DISALLOW_SIGN = true;
			var ALLOW_SIGN = false;

			function isDelim(token, code) {
				return token !== null && token.type === DELIM && token.value.charCodeAt(0) === code;
			}

			function skipSC(token, offset, getNextToken) {
				while (token !== null && (token.type === WHITESPACE || token.type === COMMENT)) {
					token = getNextToken(++offset);
				}

				return offset;
			}

			function checkInteger(token, valueOffset, disallowSign, offset) {
				if (!token) {
					return 0;
				}

				var code = token.value.charCodeAt(valueOffset);

				if (code === PLUSSIGN || code === HYPHENMINUS) {
					if (disallowSign) {
						// Number sign is not allowed
						return 0;
					}
					valueOffset++;
				}

				for (; valueOffset < token.value.length; valueOffset++) {
					if (!isDigit(token.value.charCodeAt(valueOffset))) {
						// Integer is expected
						return 0;
					}
				}

				return offset + 1;
			}

			// ... <signed-integer>
			// ... ['+' | '-'] <signless-integer>
			function consumeB(token, offset_, getNextToken) {
				var sign = false;
				var offset = skipSC(token, offset_, getNextToken);

				token = getNextToken(offset);

				if (token === null) {
					return offset_;
				}

				if (token.type !== NUMBER) {
					if (isDelim(token, PLUSSIGN) || isDelim(token, HYPHENMINUS)) {
						sign = true;
						offset = skipSC(getNextToken(++offset), offset, getNextToken);
						token = getNextToken(offset);

						if (token === null && token.type !== NUMBER) {
							return 0;
						}
					} else {
						return offset_;
					}
				}

				if (!sign) {
					var code = token.value.charCodeAt(0);
					if (code !== PLUSSIGN && code !== HYPHENMINUS) {
						// Number sign is expected
						return 0;
					}
				}

				return checkInteger(token, sign ? 0 : 1, sign, offset);
			}

			// An+B microsyntax https://www.w3.org/TR/css-syntax-3/#anb
			module.exports = function anPlusB(token, getNextToken) {
				var offset = 0;

				if (!token) {
					return 0;
				}

				// <integer>
				if (token.type === NUMBER) {
					return checkInteger(token, 0, ALLOW_SIGN, offset); // b
				}

				// -n
				// -n <signed-integer>
				// -n ['+' | '-'] <signless-integer>
				// -n- <signless-integer>
				// <dashndashdigit-ident>
				else if (token.type === IDENT && token.value.charCodeAt(0) === HYPHENMINUS) {
					// expect 1st char is N
					if (!cmpChar(token.value, 1, N)) {
						return 0;
					}

					switch (token.value.length) {
						// -n
						// -n <signed-integer>
						// -n ['+' | '-'] <signless-integer>
						case 2:
							return consumeB(getNextToken(++offset), offset, getNextToken);

						// -n- <signless-integer>
						case 3:
							if (token.value.charCodeAt(2) !== HYPHENMINUS) {
								return 0;
							}

							offset = skipSC(getNextToken(++offset), offset, getNextToken);
							token = getNextToken(offset);

							return checkInteger(token, 0, DISALLOW_SIGN, offset);

						// <dashndashdigit-ident>
						default:
							if (token.value.charCodeAt(2) !== HYPHENMINUS) {
								return 0;
							}

							return checkInteger(token, 3, DISALLOW_SIGN, offset);
					}
				}

				// '+'? n
				// '+'? n <signed-integer>
				// '+'? n ['+' | '-'] <signless-integer>
				// '+'? n- <signless-integer>
				// '+'? <ndashdigit-ident>
				else if (token.type === IDENT || (isDelim(token, PLUSSIGN) && getNextToken(offset + 1).type === IDENT)) {
					// just ignore a plus
					if (token.type !== IDENT) {
						token = getNextToken(++offset);
					}

					if (token === null || !cmpChar(token.value, 0, N)) {
						return 0;
					}

					switch (token.value.length) {
						// '+'? n
						// '+'? n <signed-integer>
						// '+'? n ['+' | '-'] <signless-integer>
						case 1:
							return consumeB(getNextToken(++offset), offset, getNextToken);

						// '+'? n- <signless-integer>
						case 2:
							if (token.value.charCodeAt(1) !== HYPHENMINUS) {
								return 0;
							}

							offset = skipSC(getNextToken(++offset), offset, getNextToken);
							token = getNextToken(offset);

							return checkInteger(token, 0, DISALLOW_SIGN, offset);

						// '+'? <ndashdigit-ident>
						default:
							if (token.value.charCodeAt(1) !== HYPHENMINUS) {
								return 0;
							}

							return checkInteger(token, 2, DISALLOW_SIGN, offset);
					}
				}

				// <ndashdigit-dimension>
				// <ndash-dimension> <signless-integer>
				// <n-dimension>
				// <n-dimension> <signed-integer>
				// <n-dimension> ['+' | '-'] <signless-integer>
				else if (token.type === DIMENSION) {
					var code = token.value.charCodeAt(0);
					var sign = code === PLUSSIGN || code === HYPHENMINUS ? 1 : 0;

					for (var i = sign; i < token.value.length; i++) {
						if (!isDigit(token.value.charCodeAt(i))) {
							break;
						}
					}

					if (i === sign) {
						// Integer is expected
						return 0;
					}

					if (!cmpChar(token.value, i, N)) {
						return 0;
					}

					// <n-dimension>
					// <n-dimension> <signed-integer>
					// <n-dimension> ['+' | '-'] <signless-integer>
					if (i + 1 === token.value.length) {
						return consumeB(getNextToken(++offset), offset, getNextToken);
					} else {
						if (token.value.charCodeAt(i + 1) !== HYPHENMINUS) {
							return 0;
						}

						// <ndash-dimension> <signless-integer>
						if (i + 2 === token.value.length) {
							offset = skipSC(getNextToken(++offset), offset, getNextToken);
							token = getNextToken(offset);

							return checkInteger(token, 0, DISALLOW_SIGN, offset);
						}
						// <ndashdigit-dimension>
						else {
							return checkInteger(token, i + 2, DISALLOW_SIGN, offset);
						}
					}
				}

				return 0;
			};

		}, { "../tokenizer": 107 }], 14: [function (require, module, exports) {
			var isHexDigit = require("../tokenizer").isHexDigit;
			var cmpChar = require("../tokenizer").cmpChar;
			var TYPE = require("../tokenizer").TYPE;

			var IDENT = TYPE.Ident;
			var DELIM = TYPE.Delim;
			var NUMBER = TYPE.Number;
			var DIMENSION = TYPE.Dimension;
			var PLUSSIGN = 0x002B;     // U+002B PLUS SIGN (+)
			var HYPHENMINUS = 0x002D;  // U+002D HYPHEN-MINUS (-)
			var QUESTIONMARK = 0x003F; // U+003F QUESTION MARK (?)
			var U = 0x0075;            // U+0075 LATIN SMALL LETTER U (u)

			function isDelim(token, code) {
				return token !== null && token.type === DELIM && token.value.charCodeAt(0) === code;
			}

			function startsWith(token, code) {
				return token.value.charCodeAt(0) === code;
			}

			function hexSequence(token, offset, allowDash) {
				for (var pos = offset, hexlen = 0; pos < token.value.length; pos++) {
					var code = token.value.charCodeAt(pos);

					if (code === HYPHENMINUS && allowDash && hexlen !== 0) {
						if (hexSequence(token, offset + hexlen + 1, false) > 0) {
							return 6; // dissallow following question marks
						}

						return 0; // dash at the ending of a hex sequence is not allowed
					}

					if (!isHexDigit(code)) {
						return 0; // not a hex digit
					}

					if (++hexlen > 6) {
						return 0; // too many hex digits
					}
				}

				return hexlen;
			}

			function withQuestionMarkSequence(consumed, length, getNextToken) {
				if (!consumed) {
					return 0; // nothing consumed
				}

				while (isDelim(getNextToken(length), QUESTIONMARK)) {
					if (++consumed > 6) {
						return 0; // too many question marks
					}

					length++;
				}

				return length;
			}

			// https://drafts.csswg.org/css-syntax/#urange
			// Informally, the <urange> production has three forms:
			// U+0001
			//      Defines a range consisting of a single code point, in this case the code point "1".
			// U+0001-00ff
			//      Defines a range of codepoints between the first and the second value, in this case
			//      the range between "1" and "ff" (255 in decimal) inclusive.
			// U+00??
			//      Defines a range of codepoints where the "?" characters range over all hex digits,
			//      in this case defining the same as the value U+0000-00ff.
			// In each form, a maximum of 6 digits is allowed for each hexadecimal number (if you treat "?" as a hexadecimal digit).
			//
			// <urange> =
			//   u '+' <ident-token> '?'* |
			//   u <dimension-token> '?'* |
			//   u <number-token> '?'* |
			//   u <number-token> <dimension-token> |
			//   u <number-token> <number-token> |
			//   u '+' '?'+
			module.exports = function urange(token, getNextToken) {
				var length = 0;

				// should start with `u` or `U`
				if (token === null || token.type !== IDENT || !cmpChar(token.value, 0, U)) {
					return 0;
				}

				token = getNextToken(++length);
				if (token === null) {
					return 0;
				}

				// u '+' <ident-token> '?'*
				// u '+' '?'+
				if (isDelim(token, PLUSSIGN)) {
					token = getNextToken(++length);
					if (token === null) {
						return 0;
					}

					if (token.type === IDENT) {
						// u '+' <ident-token> '?'*
						return withQuestionMarkSequence(hexSequence(token, 0, true), ++length, getNextToken);
					}

					if (isDelim(token, QUESTIONMARK)) {
						// u '+' '?'+
						return withQuestionMarkSequence(1, ++length, getNextToken);
					}

					// Hex digit or question mark is expected
					return 0;
				}

				// u <number-token> '?'*
				// u <number-token> <dimension-token>
				// u <number-token> <number-token>
				if (token.type === NUMBER) {
					if (!startsWith(token, PLUSSIGN)) {
						return 0;
					}

					var consumedHexLength = hexSequence(token, 1, true);
					if (consumedHexLength === 0) {
						return 0;
					}

					token = getNextToken(++length);
					if (token === null) {
						// u <number-token> <eof>
						return length;
					}

					if (token.type === DIMENSION || token.type === NUMBER) {
						// u <number-token> <dimension-token>
						// u <number-token> <number-token>
						if (!startsWith(token, HYPHENMINUS) || !hexSequence(token, 1, false)) {
							return 0;
						}

						return length + 1;
					}

					// u <number-token> '?'*
					return withQuestionMarkSequence(consumedHexLength, length, getNextToken);
				}

				// u <dimension-token> '?'*
				if (token.type === DIMENSION) {
					if (!startsWith(token, PLUSSIGN)) {
						return 0;
					}

					return withQuestionMarkSequence(hexSequence(token, 1, true), ++length, getNextToken);
				}

				return 0;
			};

		}, { "../tokenizer": 107 }], 15: [function (require, module, exports) {
			var tokenizer = require("../tokenizer");
			var isIdentifierStart = tokenizer.isIdentifierStart;
			var isHexDigit = tokenizer.isHexDigit;
			var isDigit = tokenizer.isDigit;
			var cmpStr = tokenizer.cmpStr;
			var consumeNumber = tokenizer.consumeNumber;
			var TYPE = tokenizer.TYPE;
			var anPlusB = require("./generic-an-plus-b");
			var urange = require("./generic-urange");

			var cssWideKeywords = ["unset", "initial", "inherit"];
			var calcFunctionNames = ["calc(", "-moz-calc(", "-webkit-calc("];

			// https://www.w3.org/TR/css-values-3/#lengths
			var LENGTH = {
				// absolute length units
				"px": true,
				"mm": true,
				"cm": true,
				"in": true,
				"pt": true,
				"pc": true,
				"q": true,

				// relative length units
				"em": true,
				"ex": true,
				"ch": true,
				"rem": true,

				// viewport-percentage lengths
				"vh": true,
				"vw": true,
				"vmin": true,
				"vmax": true,
				"vm": true
			};

			var ANGLE = {
				"deg": true,
				"grad": true,
				"rad": true,
				"turn": true
			};

			var TIME = {
				"s": true,
				"ms": true
			};

			var FREQUENCY = {
				"hz": true,
				"khz": true
			};

			// https://www.w3.org/TR/css-values-3/#resolution (https://drafts.csswg.org/css-values/#resolution)
			var RESOLUTION = {
				"dpi": true,
				"dpcm": true,
				"dppx": true,
				"x": true      // https://github.com/w3c/csswg-drafts/issues/461
			};

			// https://drafts.csswg.org/css-grid/#fr-unit
			var FLEX = {
				"fr": true
			};

			// https://www.w3.org/TR/css3-speech/#mixing-props-voice-volume
			var DECIBEL = {
				"db": true
			};

			// https://www.w3.org/TR/css3-speech/#voice-props-voice-pitch
			var SEMITONES = {
				"st": true
			};

			// safe char code getter
			function charCode(str, index) {
				return index < str.length ? str.charCodeAt(index) : 0;
			}

			function eqStr(actual, expected) {
				return cmpStr(actual, 0, actual.length, expected);
			}

			function eqStrAny(actual, expected) {
				for (var i = 0; i < expected.length; i++) {
					if (eqStr(actual, expected[i])) {
						return true;
					}
				}

				return false;
			}

			// IE postfix hack, i.e. 123\0 or 123px\9
			function isPostfixIeHack(str, offset) {
				if (offset !== str.length - 2) {
					return false;
				}

				return (
					str.charCodeAt(offset) === 0x005C &&  // U+005C REVERSE SOLIDUS (\)
					isDigit(str.charCodeAt(offset + 1))
				);
			}

			function outOfRange(opts, value, numEnd) {
				if (opts && opts.type === "Range") {
					var num = Number(
						numEnd !== undefined && numEnd !== value.length
							? value.substr(0, numEnd)
							: value
					);

					if (isNaN(num)) {
						return true;
					}

					if (opts.min !== null && num < opts.min) {
						return true;
					}

					if (opts.max !== null && num > opts.max) {
						return true;
					}
				}

				return false;
			}

			function consumeFunction(token, getNextToken) {
				var startIdx = token.index;
				var length = 0;

				// balanced token consuming
				do {
					length++;

					if (token.balance <= startIdx) {
						break;
					}
				} while (token = getNextToken(length));

				return length;
			}

			// TODO: implement
			// can be used wherever <length>, <frequency>, <angle>, <time>, <percentage>, <number>, or <integer> values are allowed
			// https://drafts.csswg.org/css-values/#calc-notation
			function calc(next) {
				return function (token, getNextToken, opts) {
					if (token === null) {
						return 0;
					}

					if (token.type === TYPE.Function && eqStrAny(token.value, calcFunctionNames)) {
						return consumeFunction(token, getNextToken);
					}

					return next(token, getNextToken, opts);
				};
			}

			function tokenType(expectedTokenType) {
				return function (token) {
					if (token === null || token.type !== expectedTokenType) {
						return 0;
					}

					return 1;
				};
			}

			function func(name) {
				name = name + "(";

				return function (token, getNextToken) {
					if (token !== null && eqStr(token.value, name)) {
						return consumeFunction(token, getNextToken);
					}

					return 0;
				};
			}

			// =========================
			// Complex types
			//

			// https://drafts.csswg.org/css-values-4/#custom-idents
			// 4.2. Author-defined Identifiers: the <custom-ident> type
			// Some properties accept arbitrary author-defined identifiers as a component value.
			// This generic data type is denoted by <custom-ident>, and represents any valid CSS identifier
			// that would not be misinterpreted as a pre-defined keyword in that property’s value definition.
			//
			// See also: https://developer.mozilla.org/en-US/docs/Web/CSS/custom-ident
			function customIdent(token) {
				if (token === null || token.type !== TYPE.Ident) {
					return 0;
				}

				var name = token.value.toLowerCase();

				// The CSS-wide keywords are not valid <custom-ident>s
				if (eqStrAny(name, cssWideKeywords)) {
					return 0;
				}

				// The default keyword is reserved and is also not a valid <custom-ident>
				if (eqStr(name, "default")) {
					return 0;
				}

				// TODO: ignore property specific keywords (as described https://developer.mozilla.org/en-US/docs/Web/CSS/custom-ident)
				// Specifications using <custom-ident> must specify clearly what other keywords
				// are excluded from <custom-ident>, if any—for example by saying that any pre-defined keywords
				// in that property’s value definition are excluded. Excluded keywords are excluded
				// in all ASCII case permutations.

				return 1;
			}

			// https://drafts.csswg.org/css-variables/#typedef-custom-property-name
			// A custom property is any property whose name starts with two dashes (U+002D HYPHEN-MINUS), like --foo.
			// The <custom-property-name> production corresponds to this: it’s defined as any valid identifier
			// that starts with two dashes, except -- itself, which is reserved for future use by CSS.
			// NOTE: Current implementation treat `--` as a valid name since most (all?) major browsers treat it as valid.
			function customPropertyName(token) {
				// ... defined as any valid identifier
				if (token === null || token.type !== TYPE.Ident) {
					return 0;
				}

				// ... that starts with two dashes (U+002D HYPHEN-MINUS)
				if (charCode(token.value, 0) !== 0x002D || charCode(token.value, 1) !== 0x002D) {
					return 0;
				}

				return 1;
			}

			// https://drafts.csswg.org/css-color-4/#hex-notation
			// The syntax of a <hex-color> is a <hash-token> token whose value consists of 3, 4, 6, or 8 hexadecimal digits.
			// In other words, a hex color is written as a hash character, "#", followed by some number of digits 0-9 or
			// letters a-f (the case of the letters doesn’t matter - #00ff00 is identical to #00FF00).
			function hexColor(token) {
				if (token === null || token.type !== TYPE.Hash) {
					return 0;
				}

				var length = token.value.length;

				// valid values (length): #rgb (4), #rgba (5), #rrggbb (7), #rrggbbaa (9)
				if (length !== 4 && length !== 5 && length !== 7 && length !== 9) {
					return 0;
				}

				for (var i = 1; i < length; i++) {
					if (!isHexDigit(token.value.charCodeAt(i))) {
						return 0;
					}
				}

				return 1;
			}

			function idSelector(token) {
				if (token === null || token.type !== TYPE.Hash) {
					return 0;
				}

				if (!isIdentifierStart(charCode(token.value, 1), charCode(token.value, 2), charCode(token.value, 3))) {
					return 0;
				}

				return 1;
			}

			// https://drafts.csswg.org/css-syntax/#any-value
			// It represents the entirety of what a valid declaration can have as its value.
			function declarationValue(token, getNextToken) {
				if (!token) {
					return 0;
				}

				var length = 0;
				var level = 0;
				var startIdx = token.index;

				// The <declaration-value> production matches any sequence of one or more tokens,
				// so long as the sequence ...
				scan:
				do {
					switch (token.type) {
						// ... does not contain <bad-string-token>, <bad-url-token>,
						case TYPE.BadString:
						case TYPE.BadUrl:
							break scan;

						// ... unmatched <)-token>, <]-token>, or <}-token>,
						case TYPE.RightCurlyBracket:
						case TYPE.RightParenthesis:
						case TYPE.RightSquareBracket:
							if (token.balance > token.index || token.balance < startIdx) {
								break scan;
							}

							level--;
							break;

						// ... or top-level <semicolon-token> tokens
						case TYPE.Semicolon:
							if (level === 0) {
								break scan;
							}

							break;

						// ... or <delim-token> tokens with a value of "!"
						case TYPE.Delim:
							if (token.value === "!" && level === 0) {
								break scan;
							}

							break;

						case TYPE.Function:
						case TYPE.LeftParenthesis:
						case TYPE.LeftSquareBracket:
						case TYPE.LeftCurlyBracket:
							level++;
							break;
					}

					length++;

					// until balance closing
					if (token.balance <= startIdx) {
						break;
					}
				} while (token = getNextToken(length));

				return length;
			}

			// https://drafts.csswg.org/css-syntax/#any-value
			// The <any-value> production is identical to <declaration-value>, but also
			// allows top-level <semicolon-token> tokens and <delim-token> tokens
			// with a value of "!". It represents the entirety of what valid CSS can be in any context.
			function anyValue(token, getNextToken) {
				if (!token) {
					return 0;
				}

				var startIdx = token.index;
				var length = 0;

				// The <any-value> production matches any sequence of one or more tokens,
				// so long as the sequence ...
				scan:
				do {
					switch (token.type) {
						// ... does not contain <bad-string-token>, <bad-url-token>,
						case TYPE.BadString:
						case TYPE.BadUrl:
							break scan;

						// ... unmatched <)-token>, <]-token>, or <}-token>,
						case TYPE.RightCurlyBracket:
						case TYPE.RightParenthesis:
						case TYPE.RightSquareBracket:
							if (token.balance > token.index || token.balance < startIdx) {
								break scan;
							}

							break;
					}

					length++;

					// until balance closing
					if (token.balance <= startIdx) {
						break;
					}
				} while (token = getNextToken(length));

				return length;
			}

			// =========================
			// Dimensions
			//

			function dimension(type) {
				return function (token, getNextToken, opts) {
					if (token === null || token.type !== TYPE.Dimension) {
						return 0;
					}

					var numberEnd = consumeNumber(token.value, 0);

					// check unit
					if (type !== null) {
						// check for IE postfix hack, i.e. 123px\0 or 123px\9
						var reverseSolidusOffset = token.value.indexOf("\\", numberEnd);
						var unit = reverseSolidusOffset === -1 || !isPostfixIeHack(token.value, reverseSolidusOffset)
							? token.value.substr(numberEnd)
							: token.value.substring(numberEnd, reverseSolidusOffset);

						if (type.hasOwnProperty(unit.toLowerCase()) === false) {
							return 0;
						}
					}

					// check range if specified
					if (outOfRange(opts, token.value, numberEnd)) {
						return 0;
					}

					return 1;
				};
			}

			// =========================
			// Percentage
			//

			// §5.5. Percentages: the <percentage> type
			// https://drafts.csswg.org/css-values-4/#percentages
			function percentage(token, getNextToken, opts) {
				// ... corresponds to the <percentage-token> production
				if (token === null || token.type !== TYPE.Percentage) {
					return 0;
				}

				// check range if specified
				if (outOfRange(opts, token.value, token.value.length - 1)) {
					return 0;
				}

				return 1;
			}

			// =========================
			// Numeric
			//

			// https://drafts.csswg.org/css-values-4/#numbers
			// The value <zero> represents a literal number with the value 0. Expressions that merely
			// evaluate to a <number> with the value 0 (for example, calc(0)) do not match <zero>;
			// only literal <number-token>s do.
			function zero(next) {
				if (typeof next !== "function") {
					next = function () {
						return 0;
					};
				}

				return function (token, getNextToken, opts) {
					if (token !== null && token.type === TYPE.Number) {
						if (Number(token.value) === 0) {
							return 1;
						}
					}

					return next(token, getNextToken, opts);
				};
			}

			// § 5.3. Real Numbers: the <number> type
			// https://drafts.csswg.org/css-values-4/#numbers
			// Number values are denoted by <number>, and represent real numbers, possibly with a fractional component.
			// ... It corresponds to the <number-token> production
			function number(token, getNextToken, opts) {
				if (token === null) {
					return 0;
				}

				var numberEnd = consumeNumber(token.value, 0);
				var isNumber = numberEnd === token.value.length;
				if (!isNumber && !isPostfixIeHack(token.value, numberEnd)) {
					return 0;
				}

				// check range if specified
				if (outOfRange(opts, token.value, numberEnd)) {
					return 0;
				}

				return 1;
			}

			// §5.2. Integers: the <integer> type
			// https://drafts.csswg.org/css-values-4/#integers
			function integer(token, getNextToken, opts) {
				// ... corresponds to a subset of the <number-token> production
				if (token === null || token.type !== TYPE.Number) {
					return 0;
				}

				// The first digit of an integer may be immediately preceded by `-` or `+` to indicate the integer’s sign.
				var i = token.value.charCodeAt(0) === 0x002B ||       // U+002B PLUS SIGN (+)
					token.value.charCodeAt(0) === 0x002D ? 1 : 0; // U+002D HYPHEN-MINUS (-)

				// When written literally, an integer is one or more decimal digits 0 through 9 ...
				for (; i < token.value.length; i++) {
					if (!isDigit(token.value.charCodeAt(i))) {
						return 0;
					}
				}

				// check range if specified
				if (outOfRange(opts, token.value, i)) {
					return 0;
				}

				return 1;
			}

			module.exports = {
				// token types
				"ident-token": tokenType(TYPE.Ident),
				"function-token": tokenType(TYPE.Function),
				"at-keyword-token": tokenType(TYPE.AtKeyword),
				"hash-token": tokenType(TYPE.Hash),
				"string-token": tokenType(TYPE.String),
				"bad-string-token": tokenType(TYPE.BadString),
				"url-token": tokenType(TYPE.Url),
				"bad-url-token": tokenType(TYPE.BadUrl),
				"delim-token": tokenType(TYPE.Delim),
				"number-token": tokenType(TYPE.Number),
				"percentage-token": tokenType(TYPE.Percentage),
				"dimension-token": tokenType(TYPE.Dimension),
				"whitespace-token": tokenType(TYPE.WhiteSpace),
				"CDO-token": tokenType(TYPE.CDO),
				"CDC-token": tokenType(TYPE.CDC),
				"colon-token": tokenType(TYPE.Colon),
				"semicolon-token": tokenType(TYPE.Semicolon),
				"comma-token": tokenType(TYPE.Comma),
				"[-token": tokenType(TYPE.LeftSquareBracket),
				"]-token": tokenType(TYPE.RightSquareBracket),
				"(-token": tokenType(TYPE.LeftParenthesis),
				")-token": tokenType(TYPE.RightParenthesis),
				"{-token": tokenType(TYPE.LeftCurlyBracket),
				"}-token": tokenType(TYPE.RightCurlyBracket),

				// token type aliases
				"string": tokenType(TYPE.String),
				"ident": tokenType(TYPE.Ident),

				// complex types
				"custom-ident": customIdent,
				"custom-property-name": customPropertyName,
				"hex-color": hexColor,
				"id-selector": idSelector, // element( <id-selector> )
				"an-plus-b": anPlusB,
				"urange": urange,
				"declaration-value": declarationValue,
				"any-value": anyValue,

				// dimensions
				"dimension": calc(dimension(null)),
				"angle": calc(dimension(ANGLE)),
				"decibel": calc(dimension(DECIBEL)),
				"frequency": calc(dimension(FREQUENCY)),
				"flex": calc(dimension(FLEX)),
				"length": calc(zero(dimension(LENGTH))),
				"resolution": calc(dimension(RESOLUTION)),
				"semitones": calc(dimension(SEMITONES)),
				"time": calc(dimension(TIME)),

				// percentage
				"percentage": calc(percentage),

				// numeric
				"zero": zero(),
				"number": calc(number),
				"integer": calc(integer),

				// old IE stuff
				"-ms-legacy-expression": func("expression")
			};

		}, { "../tokenizer": 107, "./generic-an-plus-b": 13, "./generic-urange": 14 }], 16: [function (require, module, exports) {
			var createCustomError = require("../../utils/createCustomError");

			var SyntaxParseError = function (message, input, offset) {
				var error = createCustomError("SyntaxParseError", message);

				error.input = input;
				error.offset = offset;
				error.rawMessage = message;
				error.message = error.rawMessage + "\n" +
					"  " + error.input + "\n" +
					"--" + new Array((error.offset || error.input.length) + 1).join("-") + "^";

				return error;
			};

			module.exports = {
				SyntaxParseError: SyntaxParseError
			};

		}, { "../../utils/createCustomError": 110 }], 17: [function (require, module, exports) {
			function noop(value) {
				return value;
			}

			function generateMultiplier(multiplier) {
				if (multiplier.min === 0 && multiplier.max === 0) {
					return "*";
				}

				if (multiplier.min === 0 && multiplier.max === 1) {
					return "?";
				}

				if (multiplier.min === 1 && multiplier.max === 0) {
					return multiplier.comma ? "#" : "+";
				}

				if (multiplier.min === 1 && multiplier.max === 1) {
					return "";
				}

				return (
					(multiplier.comma ? "#" : "") +
					(multiplier.min === multiplier.max
						? "{" + multiplier.min + "}"
						: "{" + multiplier.min + "," + (multiplier.max !== 0 ? multiplier.max : "") + "}"
					)
				);
			}

			function generateTypeOpts(node) {
				switch (node.type) {
					case "Range":
						return (
							" [" +
							(node.min === null ? "-∞" : node.min) +
							"," +
							(node.max === null ? "∞" : node.max) +
							"]"
						);

					default:
						throw new Error("Unknown node type `" + node.type + "`");
				}
			}

			function generateSequence(node, forceBraces, decorate) {
				var result = node.terms.map(function (term) {
					return generate(term, forceBraces, decorate);
				}).join(node.combinator === " " ? " " : " " + node.combinator + " ");

				if (node.explicit || forceBraces) {
					result = (result[0] !== "," ? "[ " : "[") + result + " ]";
				}

				return result;
			}

			function generate(node, forceBraces, decorate) {
				var result;

				switch (node.type) {
					case "Group":
						result =
							generateSequence(node, forceBraces, decorate) +
							(node.disallowEmpty ? "!" : "");
						break;

					case "Multiplier":
						// return since node is a composition
						return (
							generate(node.term, forceBraces, decorate) +
							decorate(generateMultiplier(node), node)
						);

					case "Type":
						result = "<" + node.name + (node.opts ? decorate(generateTypeOpts(node.opts), node.opts) : "") + ">";
						break;

					case "Property":
						result = "<'" + node.name + "'>";
						break;

					case "Keyword":
						result = node.name;
						break;

					case "AtKeyword":
						result = "@" + node.name;
						break;

					case "Function":
						result = node.name + "(";
						break;

					case "String":
					case "Token":
						result = node.value;
						break;

					case "Comma":
						result = ",";
						break;

					default:
						throw new Error("Unknown node type `" + node.type + "`");
				}

				return decorate(result, node);
			}

			module.exports = function (node, options) {
				var decorate = noop;
				var forceBraces = false;

				if (typeof options === "function") {
					decorate = options;
				} else if (options) {
					forceBraces = Boolean(options.forceBraces);
					if (typeof options.decorate === "function") {
						decorate = options.decorate;
					}
				}

				return generate(node, forceBraces, decorate);
			};

		}, {}], 18: [function (require, module, exports) {
			module.exports = {
				SyntaxParseError: require("./error").SyntaxParseError,
				parse: require("./parse"),
				generate: require("./generate"),
				walk: require("./walk")
			};

		}, { "./error": 16, "./generate": 17, "./parse": 19, "./walk": 21 }], 19: [function (require, module, exports) {
			var Tokenizer = require("./tokenizer");
			var TAB = 9;
			var N = 10;
			var F = 12;
			var R = 13;
			var SPACE = 32;
			var EXCLAMATIONMARK = 33;    // !
			var NUMBERSIGN = 35;         // #
			var AMPERSAND = 38;          // &
			var APOSTROPHE = 39;         // '
			var LEFTPARENTHESIS = 40;    // (
			var RIGHTPARENTHESIS = 41;   // )
			var ASTERISK = 42;           // *
			var PLUSSIGN = 43;           // +
			var COMMA = 44;              // ,
			var HYPERMINUS = 45;         // -
			var LESSTHANSIGN = 60;       // <
			var GREATERTHANSIGN = 62;    // >
			var QUESTIONMARK = 63;       // ?
			var COMMERCIALAT = 64;       // @
			var LEFTSQUAREBRACKET = 91;  // [
			var RIGHTSQUAREBRACKET = 93; // ]
			var LEFTCURLYBRACKET = 123;  // {
			var VERTICALLINE = 124;      // |
			var RIGHTCURLYBRACKET = 125; // }
			var INFINITY = 8734;         // ∞
			var NAME_CHAR = createCharMap(function (ch) {
				return /[a-zA-Z0-9-]/.test(ch);
			});
			var COMBINATOR_PRECEDENCE = {
				" ": 1,
				"&&": 2,
				"||": 3,
				"|": 4
			};

			function createCharMap(fn) {
				var array = typeof Uint32Array === "function" ? new Uint32Array(128) : new Array(128);
				for (var i = 0; i < 128; i++) {
					array[i] = fn(String.fromCharCode(i)) ? 1 : 0;
				}
				return array;
			}

			function scanSpaces(tokenizer) {
				return tokenizer.substringToPos(
					tokenizer.findWsEnd(tokenizer.pos)
				);
			}

			function scanWord(tokenizer) {
				var end = tokenizer.pos;

				for (; end < tokenizer.str.length; end++) {
					var code = tokenizer.str.charCodeAt(end);
					if (code >= 128 || NAME_CHAR[code] === 0) {
						break;
					}
				}

				if (tokenizer.pos === end) {
					tokenizer.error("Expect a keyword");
				}

				return tokenizer.substringToPos(end);
			}

			function scanNumber(tokenizer) {
				var end = tokenizer.pos;

				for (; end < tokenizer.str.length; end++) {
					var code = tokenizer.str.charCodeAt(end);
					if (code < 48 || code > 57) {
						break;
					}
				}

				if (tokenizer.pos === end) {
					tokenizer.error("Expect a number");
				}

				return tokenizer.substringToPos(end);
			}

			function scanString(tokenizer) {
				var end = tokenizer.str.indexOf("'", tokenizer.pos + 1);

				if (end === -1) {
					tokenizer.pos = tokenizer.str.length;
					tokenizer.error("Expect an apostrophe");
				}

				return tokenizer.substringToPos(end + 1);
			}

			function readMultiplierRange(tokenizer) {
				var min = null;
				var max = null;

				tokenizer.eat(LEFTCURLYBRACKET);

				min = scanNumber(tokenizer);

				if (tokenizer.charCode() === COMMA) {
					tokenizer.pos++;
					if (tokenizer.charCode() !== RIGHTCURLYBRACKET) {
						max = scanNumber(tokenizer);
					}
				} else {
					max = min;
				}

				tokenizer.eat(RIGHTCURLYBRACKET);

				return {
					min: Number(min),
					max: max ? Number(max) : 0
				};
			}

			function readMultiplier(tokenizer) {
				var range = null;
				var comma = false;

				switch (tokenizer.charCode()) {
					case ASTERISK:
						tokenizer.pos++;

						range = {
							min: 0,
							max: 0
						};

						break;

					case PLUSSIGN:
						tokenizer.pos++;

						range = {
							min: 1,
							max: 0
						};

						break;

					case QUESTIONMARK:
						tokenizer.pos++;

						range = {
							min: 0,
							max: 1
						};

						break;

					case NUMBERSIGN:
						tokenizer.pos++;

						comma = true;

						if (tokenizer.charCode() === LEFTCURLYBRACKET) {
							range = readMultiplierRange(tokenizer);
						} else {
							range = {
								min: 1,
								max: 0
							};
						}

						break;

					case LEFTCURLYBRACKET:
						range = readMultiplierRange(tokenizer);
						break;

					default:
						return null;
				}

				return {
					type: "Multiplier",
					comma: comma,
					min: range.min,
					max: range.max,
					term: null
				};
			}

			function maybeMultiplied(tokenizer, node) {
				var multiplier = readMultiplier(tokenizer);

				if (multiplier !== null) {
					multiplier.term = node;
					return multiplier;
				}

				return node;
			}

			function maybeToken(tokenizer) {
				var ch = tokenizer.peek();

				if (ch === "") {
					return null;
				}

				return {
					type: "Token",
					value: ch
				};
			}

			function readProperty(tokenizer) {
				var name;

				tokenizer.eat(LESSTHANSIGN);
				tokenizer.eat(APOSTROPHE);

				name = scanWord(tokenizer);

				tokenizer.eat(APOSTROPHE);
				tokenizer.eat(GREATERTHANSIGN);

				return maybeMultiplied(tokenizer, {
					type: "Property",
					name: name
				});
			}

			// https://drafts.csswg.org/css-values-3/#numeric-ranges
			// 4.1. Range Restrictions and Range Definition Notation
			//
			// Range restrictions can be annotated in the numeric type notation using CSS bracketed
			// range notation—[min,max]—within the angle brackets, after the identifying keyword,
			// indicating a closed range between (and including) min and max.
			// For example, <integer [0, 10]> indicates an integer between 0 and 10, inclusive.
			function readTypeRange(tokenizer) {
				// use null for Infinity to make AST format JSON serializable/deserializable
				var min = null; // -Infinity
				var max = null; // Infinity
				var sign = 1;

				tokenizer.eat(LEFTSQUAREBRACKET);

				if (tokenizer.charCode() === HYPERMINUS) {
					tokenizer.peek();
					sign = -1;
				}

				if (sign == -1 && tokenizer.charCode() === INFINITY) {
					tokenizer.peek();
				} else {
					min = sign * Number(scanNumber(tokenizer));
				}

				scanSpaces(tokenizer);
				tokenizer.eat(COMMA);
				scanSpaces(tokenizer);

				if (tokenizer.charCode() === INFINITY) {
					tokenizer.peek();
				} else {
					sign = 1;

					if (tokenizer.charCode() === HYPERMINUS) {
						tokenizer.peek();
						sign = -1;
					}

					max = sign * Number(scanNumber(tokenizer));
				}

				tokenizer.eat(RIGHTSQUAREBRACKET);

				// If no range is indicated, either by using the bracketed range notation
				// or in the property description, then [−∞,∞] is assumed.
				if (min === null && max === null) {
					return null;
				}

				return {
					type: "Range",
					min: min,
					max: max
				};
			}

			function readType(tokenizer) {
				var name;
				var opts = null;

				tokenizer.eat(LESSTHANSIGN);
				name = scanWord(tokenizer);

				if (tokenizer.charCode() === LEFTPARENTHESIS &&
					tokenizer.nextCharCode() === RIGHTPARENTHESIS) {
					tokenizer.pos += 2;
					name += "()";
				}

				if (tokenizer.charCodeAt(tokenizer.findWsEnd(tokenizer.pos)) === LEFTSQUAREBRACKET) {
					scanSpaces(tokenizer);
					opts = readTypeRange(tokenizer);
				}

				tokenizer.eat(GREATERTHANSIGN);

				return maybeMultiplied(tokenizer, {
					type: "Type",
					name: name,
					opts: opts
				});
			}

			function readKeywordOrFunction(tokenizer) {
				var name;

				name = scanWord(tokenizer);

				if (tokenizer.charCode() === LEFTPARENTHESIS) {
					tokenizer.pos++;

					return {
						type: "Function",
						name: name
					};
				}

				return maybeMultiplied(tokenizer, {
					type: "Keyword",
					name: name
				});
			}

			function regroupTerms(terms, combinators) {
				function createGroup(terms, combinator) {
					return {
						type: "Group",
						terms: terms,
						combinator: combinator,
						disallowEmpty: false,
						explicit: false
					};
				}

				combinators = Object.keys(combinators).sort(function (a, b) {
					return COMBINATOR_PRECEDENCE[a] - COMBINATOR_PRECEDENCE[b];
				});

				while (combinators.length > 0) {
					var combinator = combinators.shift();
					for (var i = 0, subgroupStart = 0; i < terms.length; i++) {
						var term = terms[i];
						if (term.type === "Combinator") {
							if (term.value === combinator) {
								if (subgroupStart === -1) {
									subgroupStart = i - 1;
								}
								terms.splice(i, 1);
								i--;
							} else {
								if (subgroupStart !== -1 && i - subgroupStart > 1) {
									terms.splice(
										subgroupStart,
										i - subgroupStart,
										createGroup(terms.slice(subgroupStart, i), combinator)
									);
									i = subgroupStart + 1;
								}
								subgroupStart = -1;
							}
						}
					}

					if (subgroupStart !== -1 && combinators.length) {
						terms.splice(
							subgroupStart,
							i - subgroupStart,
							createGroup(terms.slice(subgroupStart, i), combinator)
						);
					}
				}

				return combinator;
			}

			function readImplicitGroup(tokenizer) {
				var terms = [];
				var combinators = {};
				var token;
				var prevToken = null;
				var prevTokenPos = tokenizer.pos;

				while (token = peek(tokenizer)) {
					if (token.type !== "Spaces") {
						if (token.type === "Combinator") {
							// check for combinator in group beginning and double combinator sequence
							if (prevToken === null || prevToken.type === "Combinator") {
								tokenizer.pos = prevTokenPos;
								tokenizer.error("Unexpected combinator");
							}

							combinators[token.value] = true;
						} else if (prevToken !== null && prevToken.type !== "Combinator") {
							combinators[" "] = true;  // a b
							terms.push({
								type: "Combinator",
								value: " "
							});
						}

						terms.push(token);
						prevToken = token;
						prevTokenPos = tokenizer.pos;
					}
				}

				// check for combinator in group ending
				if (prevToken !== null && prevToken.type === "Combinator") {
					tokenizer.pos -= prevTokenPos;
					tokenizer.error("Unexpected combinator");
				}

				return {
					type: "Group",
					terms: terms,
					combinator: regroupTerms(terms, combinators) || " ",
					disallowEmpty: false,
					explicit: false
				};
			}

			function readGroup(tokenizer) {
				var result;

				tokenizer.eat(LEFTSQUAREBRACKET);
				result = readImplicitGroup(tokenizer);
				tokenizer.eat(RIGHTSQUAREBRACKET);

				result.explicit = true;

				if (tokenizer.charCode() === EXCLAMATIONMARK) {
					tokenizer.pos++;
					result.disallowEmpty = true;
				}

				return result;
			}

			function peek(tokenizer) {
				var code = tokenizer.charCode();

				if (code < 128 && NAME_CHAR[code] === 1) {
					return readKeywordOrFunction(tokenizer);
				}

				switch (code) {
					case RIGHTSQUAREBRACKET:
						// don't eat, stop scan a group
						break;

					case LEFTSQUAREBRACKET:
						return maybeMultiplied(tokenizer, readGroup(tokenizer));

					case LESSTHANSIGN:
						return tokenizer.nextCharCode() === APOSTROPHE
							? readProperty(tokenizer)
							: readType(tokenizer);

					case VERTICALLINE:
						return {
							type: "Combinator",
							value: tokenizer.substringToPos(
								tokenizer.nextCharCode() === VERTICALLINE
									? tokenizer.pos + 2
									: tokenizer.pos + 1
							)
						};

					case AMPERSAND:
						tokenizer.pos++;
						tokenizer.eat(AMPERSAND);

						return {
							type: "Combinator",
							value: "&&"
						};

					case COMMA:
						tokenizer.pos++;
						return {
							type: "Comma"
						};

					case APOSTROPHE:
						return maybeMultiplied(tokenizer, {
							type: "String",
							value: scanString(tokenizer)
						});

					case SPACE:
					case TAB:
					case N:
					case R:
					case F:
						return {
							type: "Spaces",
							value: scanSpaces(tokenizer)
						};

					case COMMERCIALAT:
						code = tokenizer.nextCharCode();

						if (code < 128 && NAME_CHAR[code] === 1) {
							tokenizer.pos++;
							return {
								type: "AtKeyword",
								name: scanWord(tokenizer)
							};
						}

						return maybeToken(tokenizer);

					case ASTERISK:
					case PLUSSIGN:
					case QUESTIONMARK:
					case NUMBERSIGN:
					case EXCLAMATIONMARK:
						// prohibited tokens (used as a multiplier start)
						break;

					case LEFTCURLYBRACKET:
						// LEFTCURLYBRACKET is allowed since mdn/data uses it w/o quoting
						// check next char isn't a number, because it's likely a disjoined multiplier
						code = tokenizer.nextCharCode();

						if (code < 48 || code > 57) {
							return maybeToken(tokenizer);
						}

						break;

					default:
						return maybeToken(tokenizer);
				}
			}

			function parse(str) {
				var tokenizer = new Tokenizer(str);
				var result = readImplicitGroup(tokenizer);

				if (tokenizer.pos !== str.length) {
					tokenizer.error("Unexpected input");
				}

				// reduce redundant groups with single group term
				if (result.terms.length === 1 && result.terms[0].type === "Group") {
					result = result.terms[0];
				}

				return result;
			}

			// warm up parse to elimitate code branches that never execute
			// fix soft deoptimizations (insufficient type feedback)
			parse("[a&&<b>#|<'c'>*||e() f{2} /,(% g#{1,2} h{2,})]!");

			module.exports = parse;

		}, { "./tokenizer": 20 }], 20: [function (require, module, exports) {
			var SyntaxParseError = require("./error").SyntaxParseError;

			var TAB = 9;
			var N = 10;
			var F = 12;
			var R = 13;
			var SPACE = 32;

			var Tokenizer = function (str) {
				this.str = str;
				this.pos = 0;
			};

			Tokenizer.prototype = {
				charCodeAt: function (pos) {
					return pos < this.str.length ? this.str.charCodeAt(pos) : 0;
				},
				charCode: function () {
					return this.charCodeAt(this.pos);
				},
				nextCharCode: function () {
					return this.charCodeAt(this.pos + 1);
				},
				nextNonWsCode: function (pos) {
					return this.charCodeAt(this.findWsEnd(pos));
				},
				findWsEnd: function (pos) {
					for (; pos < this.str.length; pos++) {
						var code = this.str.charCodeAt(pos);
						if (code !== R && code !== N && code !== F && code !== SPACE && code !== TAB) {
							break;
						}
					}

					return pos;
				},
				substringToPos: function (end) {
					return this.str.substring(this.pos, this.pos = end);
				},
				eat: function (code) {
					if (this.charCode() !== code) {
						this.error("Expect `" + String.fromCharCode(code) + "`");
					}

					this.pos++;
				},
				peek: function () {
					return this.pos < this.str.length ? this.str.charAt(this.pos++) : "";
				},
				error: function (message) {
					throw new SyntaxParseError(message, this.str, this.pos);
				}
			};

			module.exports = Tokenizer;

		}, { "./error": 16 }], 21: [function (require, module, exports) {
			var noop = function () { };

			function ensureFunction(value) {
				return typeof value === "function" ? value : noop;
			}

			module.exports = function (node, options, context) {
				function walk(node) {
					enter.call(context, node);

					switch (node.type) {
						case "Group":
							node.terms.forEach(walk);
							break;

						case "Multiplier":
							walk(node.term);
							break;

						case "Type":
						case "Property":
						case "Keyword":
						case "AtKeyword":
						case "Function":
						case "String":
						case "Token":
						case "Comma":
							break;

						default:
							throw new Error("Unknown type: " + node.type);
					}

					leave.call(context, node);
				}

				var enter = noop;
				var leave = noop;

				if (typeof options === "function") {
					enter = options;
				} else if (options) {
					enter = ensureFunction(options.enter);
					leave = ensureFunction(options.leave);
				}

				if (enter === noop && leave === noop) {
					throw new Error("Neither `enter` nor `leave` walker handler is set or both aren't a function");
				}

				walk(node, context);
			};

		}, {}], 22: [function (require, module, exports) {
			var parse = require("./grammar/parse");

			var MATCH = { type: "Match" };
			var MISMATCH = { type: "Mismatch" };
			var DISALLOW_EMPTY = { type: "DisallowEmpty" };
			var LEFTPARENTHESIS = 40;  // (
			var RIGHTPARENTHESIS = 41; // )

			function createCondition(match, thenBranch, elseBranch) {
				// reduce node count
				if (thenBranch === MATCH && elseBranch === MISMATCH) {
					return match;
				}

				if (match === MATCH && thenBranch === MATCH && elseBranch === MATCH) {
					return match;
				}

				if (match.type === "If" && match.else === MISMATCH && thenBranch === MATCH) {
					thenBranch = match.then;
					match = match.match;
				}

				return {
					type: "If",
					match: match,
					then: thenBranch,
					else: elseBranch
				};
			}

			function isFunctionType(name) {
				return (
					name.length > 2 &&
					name.charCodeAt(name.length - 2) === LEFTPARENTHESIS &&
					name.charCodeAt(name.length - 1) === RIGHTPARENTHESIS
				);
			}

			function isEnumCapatible(term) {
				return (
					term.type === "Keyword" ||
					term.type === "AtKeyword" ||
					term.type === "Function" ||
					term.type === "Type" && isFunctionType(term.name)
				);
			}

			function buildGroupMatchGraph(combinator, terms, atLeastOneTermMatched) {
				switch (combinator) {
					case " ":
						// Juxtaposing components means that all of them must occur, in the given order.
						//
						// a b c
						// =
						// match a
						//   then match b
						//     then match c
						//       then MATCH
						//       else MISMATCH
						//     else MISMATCH
						//   else MISMATCH
						var result = MATCH;

						for (var i = terms.length - 1; i >= 0; i--) {
							var term = terms[i];

							result = createCondition(
								term,
								result,
								MISMATCH
							);
						}

						return result;

					case "|":
						// A bar (|) separates two or more alternatives: exactly one of them must occur.
						//
						// a | b | c
						// =
						// match a
						//   then MATCH
						//   else match b
						//     then MATCH
						//     else match c
						//       then MATCH
						//       else MISMATCH

						var result = MISMATCH;
						var map = null;

						for (var i = terms.length - 1; i >= 0; i--) {
							var term = terms[i];

							// reduce sequence of keywords into a Enum
							if (isEnumCapatible(term)) {
								if (map === null && i > 0 && isEnumCapatible(terms[i - 1])) {
									map = Object.create(null);
									result = createCondition(
										{
											type: "Enum",
											map: map
										},
										MATCH,
										result
									);
								}

								if (map !== null) {
									var key = (isFunctionType(term.name) ? term.name.slice(0, -1) : term.name).toLowerCase();
									if (key in map === false) {
										map[key] = term;
										continue;
									}
								}
							}

							map = null;

							// create a new conditonal node
							result = createCondition(
								term,
								MATCH,
								result
							);
						}

						return result;

					case "&&":
						// A double ampersand (&&) separates two or more components,
						// all of which must occur, in any order.

						// Use MatchOnce for groups with a large number of terms,
						// since &&-groups produces at least N!-node trees
						if (terms.length > 5) {
							return {
								type: "MatchOnce",
								terms: terms,
								all: true
							};
						}

						// Use a combination tree for groups with small number of terms
						//
						// a && b && c
						// =
						// match a
						//   then [b && c]
						//   else match b
						//     then [a && c]
						//     else match c
						//       then [a && b]
						//       else MISMATCH
						//
						// a && b
						// =
						// match a
						//   then match b
						//     then MATCH
						//     else MISMATCH
						//   else match b
						//     then match a
						//       then MATCH
						//       else MISMATCH
						//     else MISMATCH
						var result = MISMATCH;

						for (var i = terms.length - 1; i >= 0; i--) {
							var term = terms[i];
							var thenClause;

							if (terms.length > 1) {
								thenClause = buildGroupMatchGraph(
									combinator,
									terms.filter(function (newGroupTerm) {
										return newGroupTerm !== term;
									}),
									false
								);
							} else {
								thenClause = MATCH;
							}

							result = createCondition(
								term,
								thenClause,
								result
							);
						}

						return result;

					case "||":
						// A double bar (||) separates two or more options:
						// one or more of them must occur, in any order.

						// Use MatchOnce for groups with a large number of terms,
						// since ||-groups produces at least N!-node trees
						if (terms.length > 5) {
							return {
								type: "MatchOnce",
								terms: terms,
								all: false
							};
						}

						// Use a combination tree for groups with small number of terms
						//
						// a || b || c
						// =
						// match a
						//   then [b || c]
						//   else match b
						//     then [a || c]
						//     else match c
						//       then [a || b]
						//       else MISMATCH
						//
						// a || b
						// =
						// match a
						//   then match b
						//     then MATCH
						//     else MATCH
						//   else match b
						//     then match a
						//       then MATCH
						//       else MATCH
						//     else MISMATCH
						var result = atLeastOneTermMatched ? MATCH : MISMATCH;

						for (var i = terms.length - 1; i >= 0; i--) {
							var term = terms[i];
							var thenClause;

							if (terms.length > 1) {
								thenClause = buildGroupMatchGraph(
									combinator,
									terms.filter(function (newGroupTerm) {
										return newGroupTerm !== term;
									}),
									true
								);
							} else {
								thenClause = MATCH;
							}

							result = createCondition(
								term,
								thenClause,
								result
							);
						}

						return result;
				}
			}

			function buildMultiplierMatchGraph(node) {
				var result = MATCH;
				var matchTerm = buildMatchGraph(node.term);

				if (node.max === 0) {
					// disable repeating of empty match to prevent infinite loop
					matchTerm = createCondition(
						matchTerm,
						DISALLOW_EMPTY,
						MISMATCH
					);

					// an occurrence count is not limited, make a cycle;
					// to collect more terms on each following matching mismatch
					result = createCondition(
						matchTerm,
						null, // will be a loop
						MISMATCH
					);

					result.then = createCondition(
						MATCH,
						MATCH,
						result // make a loop
					);

					if (node.comma) {
						result.then.else = createCondition(
							{ type: "Comma", syntax: node },
							result,
							MISMATCH
						);
					}
				} else {
					// create a match node chain for [min .. max] interval with optional matches
					for (var i = node.min || 1; i <= node.max; i++) {
						if (node.comma && result !== MATCH) {
							result = createCondition(
								{ type: "Comma", syntax: node },
								result,
								MISMATCH
							);
						}

						result = createCondition(
							matchTerm,
							createCondition(
								MATCH,
								MATCH,
								result
							),
							MISMATCH
						);
					}
				}

				if (node.min === 0) {
					// allow zero match
					result = createCondition(
						MATCH,
						MATCH,
						result
					);
				} else {
					// create a match node chain to collect [0 ... min - 1] required matches
					for (var i = 0; i < node.min - 1; i++) {
						if (node.comma && result !== MATCH) {
							result = createCondition(
								{ type: "Comma", syntax: node },
								result,
								MISMATCH
							);
						}

						result = createCondition(
							matchTerm,
							result,
							MISMATCH
						);
					}
				}

				return result;
			}

			function buildMatchGraph(node) {
				if (typeof node === "function") {
					return {
						type: "Generic",
						fn: node
					};
				}

				switch (node.type) {
					case "Group":
						var result = buildGroupMatchGraph(
							node.combinator,
							node.terms.map(buildMatchGraph),
							false
						);

						if (node.disallowEmpty) {
							result = createCondition(
								result,
								DISALLOW_EMPTY,
								MISMATCH
							);
						}

						return result;

					case "Multiplier":
						return buildMultiplierMatchGraph(node);

					case "Type":
					case "Property":
						return {
							type: node.type,
							name: node.name,
							syntax: node
						};

					case "Keyword":
						return {
							type: node.type,
							name: node.name.toLowerCase(),
							syntax: node
						};

					case "AtKeyword":
						return {
							type: node.type,
							name: "@" + node.name.toLowerCase(),
							syntax: node
						};

					case "Function":
						return {
							type: node.type,
							name: node.name.toLowerCase() + "(",
							syntax: node
						};

					case "String":
						// convert a one char length String to a Token
						if (node.value.length === 3) {
							return {
								type: "Token",
								value: node.value.charAt(1),
								syntax: node
							};
						}

						// otherwise use it as is
						return {
							type: node.type,
							value: node.value.substr(1, node.value.length - 2).replace(/\\'/g, "'"),
							syntax: node
						};

					case "Token":
						return {
							type: node.type,
							value: node.value,
							syntax: node
						};

					case "Comma":
						return {
							type: node.type,
							syntax: node
						};

					default:
						throw new Error("Unknown node type:", node.type);
				}
			}

			module.exports = {
				MATCH: MATCH,
				MISMATCH: MISMATCH,
				DISALLOW_EMPTY: DISALLOW_EMPTY,
				buildMatchGraph: function (syntaxTree, ref) {
					if (typeof syntaxTree === "string") {
						syntaxTree = parse(syntaxTree);
					}

					return {
						type: "MatchGraph",
						match: buildMatchGraph(syntaxTree),
						syntax: ref || null,
						source: syntaxTree
					};
				}
			};

		}, { "./grammar/parse": 19 }], 23: [function (require, module, exports) {
			var hasOwnProperty = Object.prototype.hasOwnProperty;
			var matchGraph = require("./match-graph");
			var MATCH = matchGraph.MATCH;
			var MISMATCH = matchGraph.MISMATCH;
			var DISALLOW_EMPTY = matchGraph.DISALLOW_EMPTY;
			var TYPE = require("../tokenizer/const").TYPE;

			var STUB = 0;
			var TOKEN = 1;
			var OPEN_SYNTAX = 2;
			var CLOSE_SYNTAX = 3;

			var EXIT_REASON_MATCH = "Match";
			var EXIT_REASON_MISMATCH = "Mismatch";
			var EXIT_REASON_ITERATION_LIMIT = "Maximum iteration number exceeded (please fill an issue on https://github.com/csstree/csstree/issues)";

			var ITERATION_LIMIT = 15000;
			var totalIterationCount = 0;

			function reverseList(list) {
				var prev = null;
				var next = null;
				var item = list;

				while (item !== null) {
					next = item.prev;
					item.prev = prev;
					prev = item;
					item = next;
				}

				return prev;
			}

			function areStringsEqualCaseInsensitive(testStr, referenceStr) {
				if (testStr.length !== referenceStr.length) {
					return false;
				}

				for (var i = 0; i < testStr.length; i++) {
					var testCode = testStr.charCodeAt(i);
					var referenceCode = referenceStr.charCodeAt(i);

					// testCode.toLowerCase() for U+0041 LATIN CAPITAL LETTER A (A) .. U+005A LATIN CAPITAL LETTER Z (Z).
					if (testCode >= 0x0041 && testCode <= 0x005A) {
						testCode = testCode | 32;
					}

					if (testCode !== referenceCode) {
						return false;
					}
				}

				return true;
			}

			function isCommaContextStart(token) {
				if (token === null) {
					return true;
				}

				return (
					token.type === TYPE.Comma ||
					token.type === TYPE.Function ||
					token.type === TYPE.LeftParenthesis ||
					token.type === TYPE.LeftSquareBracket ||
					token.type === TYPE.LeftCurlyBracket ||
					token.type === TYPE.Delim
				);
			}

			function isCommaContextEnd(token) {
				if (token === null) {
					return true;
				}

				return (
					token.type === TYPE.RightParenthesis ||
					token.type === TYPE.RightSquareBracket ||
					token.type === TYPE.RightCurlyBracket ||
					token.type === TYPE.Delim
				);
			}

			function internalMatch(tokens, state, syntaxes) {
				function moveToNextToken() {
					do {
						tokenIndex++;
						token = tokenIndex < tokens.length ? tokens[tokenIndex] : null;
					} while (token !== null && (token.type === TYPE.WhiteSpace || token.type === TYPE.Comment));
				}

				function getNextToken(offset) {
					var nextIndex = tokenIndex + offset;

					return nextIndex < tokens.length ? tokens[nextIndex] : null;
				}

				function stateSnapshotFromSyntax(nextState, prev) {
					return {
						nextState: nextState,
						matchStack: matchStack,
						syntaxStack: syntaxStack,
						thenStack: thenStack,
						tokenIndex: tokenIndex,
						prev: prev
					};
				}

				function pushThenStack(nextState) {
					thenStack = {
						nextState: nextState,
						matchStack: matchStack,
						syntaxStack: syntaxStack,
						prev: thenStack
					};
				}

				function pushElseStack(nextState) {
					elseStack = stateSnapshotFromSyntax(nextState, elseStack);
				}

				function addTokenToMatch() {
					matchStack = {
						type: TOKEN,
						syntax: state.syntax,
						token: token,
						prev: matchStack
					};

					moveToNextToken();
					syntaxStash = null;

					if (tokenIndex > longestMatch) {
						longestMatch = tokenIndex;
					}
				}

				function openSyntax() {
					syntaxStack = {
						syntax: state.syntax,
						opts: state.syntax.opts || (syntaxStack !== null && syntaxStack.opts) || null,
						prev: syntaxStack
					};

					matchStack = {
						type: OPEN_SYNTAX,
						syntax: state.syntax,
						token: matchStack.token,
						prev: matchStack
					};
				}

				function closeSyntax() {
					if (matchStack.type === OPEN_SYNTAX) {
						matchStack = matchStack.prev;
					} else {
						matchStack = {
							type: CLOSE_SYNTAX,
							syntax: syntaxStack.syntax,
							token: matchStack.token,
							prev: matchStack
						};
					}

					syntaxStack = syntaxStack.prev;
				}

				var syntaxStack = null;
				var thenStack = null;
				var elseStack = null;

				// null – stashing allowed, nothing stashed
				// false – stashing disabled, nothing stashed
				// anithing else – fail stashable syntaxes, some syntax stashed
				var syntaxStash = null;

				var iterationCount = 0; // count iterations and prevent infinite loop
				var exitReason = null;

				var token = null;
				var tokenIndex = -1;
				var longestMatch = 0;
				var matchStack = {
					type: STUB,
					syntax: null,
					token: null,
					prev: null
				};

				moveToNextToken();

				while (exitReason === null && ++iterationCount < ITERATION_LIMIT) {
					// function mapList(list, fn) {
					//     var result = [];
					//     while (list) {
					//         result.unshift(fn(list));
					//         list = list.prev;
					//     }
					//     return result;
					// }
					// console.log('--\n',
					//     '#' + iterationCount,
					//     require('util').inspect({
					//         match: mapList(matchStack, x => x.type === TOKEN ? x.token && x.token.value : x.syntax ? ({ [OPEN_SYNTAX]: '<', [CLOSE_SYNTAX]: '</' }[x.type] || x.type) + '!' + x.syntax.name : null),
					//         token: token && token.value,
					//         tokenIndex,
					//         syntax: syntax.type + (syntax.id ? ' #' + syntax.id : '')
					//     }, { depth: null })
					// );
					switch (state.type) {
						case "Match":
							if (thenStack === null) {
								// turn to MISMATCH when some tokens left unmatched
								if (token !== null) {
									// doesn't mismatch if just one token left and it's an IE hack
									if (tokenIndex !== tokens.length - 1 || (token.value !== "\\0" && token.value !== "\\9")) {
										state = MISMATCH;
										break;
									}
								}

								// break the main loop, return a result - MATCH
								exitReason = EXIT_REASON_MATCH;
								break;
							}

							// go to next syntax (`then` branch)
							state = thenStack.nextState;

							// check match is not empty
							if (state === DISALLOW_EMPTY) {
								if (thenStack.matchStack === matchStack) {
									state = MISMATCH;
									break;
								} else {
									state = MATCH;
								}
							}

							// close syntax if needed
							while (thenStack.syntaxStack !== syntaxStack) {
								closeSyntax();
							}

							// pop stack
							thenStack = thenStack.prev;
							break;

						case "Mismatch":
							// when some syntax is stashed
							if (syntaxStash !== null && syntaxStash !== false) {
								// there is no else branches or a branch reduce match stack
								if (elseStack === null || tokenIndex > elseStack.tokenIndex) {
									// restore state from the stash
									elseStack = syntaxStash;
									syntaxStash = false; // disable stashing
								}
							} else if (elseStack === null) {
								// no else branches -> break the main loop
								// return a result - MISMATCH
								exitReason = EXIT_REASON_MISMATCH;
								break;
							}

							// go to next syntax (`else` branch)
							state = elseStack.nextState;

							// restore all the rest stack states
							thenStack = elseStack.thenStack;
							syntaxStack = elseStack.syntaxStack;
							matchStack = elseStack.matchStack;
							tokenIndex = elseStack.tokenIndex;
							token = tokenIndex < tokens.length ? tokens[tokenIndex] : null;

							// pop stack
							elseStack = elseStack.prev;
							break;

						case "MatchGraph":
							state = state.match;
							break;

						case "If":
							// IMPORTANT: else stack push must go first,
							// since it stores the state of thenStack before changes
							if (state.else !== MISMATCH) {
								pushElseStack(state.else);
							}

							if (state.then !== MATCH) {
								pushThenStack(state.then);
							}

							state = state.match;
							break;

						case "MatchOnce":
							state = {
								type: "MatchOnceBuffer",
								syntax: state,
								index: 0,
								mask: 0
							};
							break;

						case "MatchOnceBuffer":
							var terms = state.syntax.terms;

							if (state.index === terms.length) {
								// no matches at all or it's required all terms to be matched
								if (state.mask === 0 || state.syntax.all) {
									state = MISMATCH;
									break;
								}

								// a partial match is ok
								state = MATCH;
								break;
							}

							// all terms are matched
							if (state.mask === (1 << terms.length) - 1) {
								state = MATCH;
								break;
							}

							for (; state.index < terms.length; state.index++) {
								var matchFlag = 1 << state.index;

								if ((state.mask & matchFlag) === 0) {
									// IMPORTANT: else stack push must go first,
									// since it stores the state of thenStack before changes
									pushElseStack(state);
									pushThenStack({
										type: "AddMatchOnce",
										syntax: state.syntax,
										mask: state.mask | matchFlag
									});

									// match
									state = terms[state.index++];
									break;
								}
							}
							break;

						case "AddMatchOnce":
							state = {
								type: "MatchOnceBuffer",
								syntax: state.syntax,
								index: 0,
								mask: state.mask
							};
							break;

						case "Enum":
							if (token !== null) {
								var name = token.value.toLowerCase();

								// drop \0 and \9 hack from keyword name
								if (name.indexOf("\\") !== -1) {
									name = name.replace(/\\[09].*$/, "");
								}

								if (hasOwnProperty.call(state.map, name)) {
									state = state.map[name];
									break;
								}
							}

							state = MISMATCH;
							break;

						case "Generic":
							var opts = syntaxStack !== null ? syntaxStack.opts : null;
							var lastTokenIndex = tokenIndex + Math.floor(state.fn(token, getNextToken, opts));

							if (!isNaN(lastTokenIndex) && lastTokenIndex > tokenIndex) {
								while (tokenIndex < lastTokenIndex) {
									addTokenToMatch();
								}

								state = MATCH;
							} else {
								state = MISMATCH;
							}

							break;

						case "Type":
						case "Property":
							var syntaxDict = state.type === "Type" ? "types" : "properties";
							var dictSyntax = hasOwnProperty.call(syntaxes, syntaxDict) ? syntaxes[syntaxDict][state.name] : null;

							if (!dictSyntax || !dictSyntax.match) {
								throw new Error(
									"Bad syntax reference: " +
									(state.type === "Type"
										? "<" + state.name + ">"
										: "<'" + state.name + "'>")
								);
							}

							// stash a syntax for types with low priority
							if (syntaxStash !== false && token !== null && state.type === "Type") {
								var lowPriorityMatching =
									// https://drafts.csswg.org/css-values-4/#custom-idents
									// When parsing positionally-ambiguous keywords in a property value, a <custom-ident> production
									// can only claim the keyword if no other unfulfilled production can claim it.
									(state.name === "custom-ident" && token.type === TYPE.Ident) ||

									// https://drafts.csswg.org/css-values-4/#lengths
									// ... if a `0` could be parsed as either a <number> or a <length> in a property (such as line-height),
									// it must parse as a <number>
									(state.name === "length" && token.value === "0");

								if (lowPriorityMatching) {
									if (syntaxStash === null) {
										syntaxStash = stateSnapshotFromSyntax(state, elseStack);
									}

									state = MISMATCH;
									break;
								}
							}

							openSyntax();
							state = dictSyntax.match;
							break;

						case "Keyword":
							var name = state.name;

							if (token !== null) {
								var keywordName = token.value;

								// drop \0 and \9 hack from keyword name
								if (keywordName.indexOf("\\") !== -1) {
									keywordName = keywordName.replace(/\\[09].*$/, "");
								}

								if (areStringsEqualCaseInsensitive(keywordName, name)) {
									addTokenToMatch();
									state = MATCH;
									break;
								}
							}

							state = MISMATCH;
							break;

						case "AtKeyword":
						case "Function":
							if (token !== null && areStringsEqualCaseInsensitive(token.value, state.name)) {
								addTokenToMatch();
								state = MATCH;
								break;
							}

							state = MISMATCH;
							break;

						case "Token":
							if (token !== null && token.value === state.value) {
								addTokenToMatch();
								state = MATCH;
								break;
							}

							state = MISMATCH;
							break;

						case "Comma":
							if (token !== null && token.type === TYPE.Comma) {
								if (isCommaContextStart(matchStack.token)) {
									state = MISMATCH;
								} else {
									addTokenToMatch();
									state = isCommaContextEnd(token) ? MISMATCH : MATCH;
								}
							} else {
								state = isCommaContextStart(matchStack.token) || isCommaContextEnd(token) ? MATCH : MISMATCH;
							}

							break;

						case "String":
							var string = "";

							for (var lastTokenIndex = tokenIndex; lastTokenIndex < tokens.length && string.length < state.value.length; lastTokenIndex++) {
								string += tokens[lastTokenIndex].value;
							}

							if (areStringsEqualCaseInsensitive(string, state.value)) {
								while (tokenIndex < lastTokenIndex) {
									addTokenToMatch();
								}

								state = MATCH;
							} else {
								state = MISMATCH;
							}

							break;

						default:
							throw new Error("Unknown node type: " + state.type);
					}
				}

				totalIterationCount += iterationCount;

				switch (exitReason) {
					case null:
						// console.warn("[csstree-match] BREAK after " + ITERATION_LIMIT + " iterations");
						exitReason = EXIT_REASON_ITERATION_LIMIT;
						matchStack = null;
						break;

					case EXIT_REASON_MATCH:
						while (syntaxStack !== null) {
							closeSyntax();
						}
						break;

					default:
						matchStack = null;
				}

				return {
					tokens: tokens,
					reason: exitReason,
					iterations: iterationCount,
					match: matchStack,
					longestMatch: longestMatch
				};
			}

			function matchAsList(tokens, matchGraph, syntaxes) {
				var matchResult = internalMatch(tokens, matchGraph, syntaxes || {});

				if (matchResult.match !== null) {
					var item = reverseList(matchResult.match).prev;

					matchResult.match = [];

					while (item !== null) {
						switch (item.type) {
							case STUB:
								break;

							case OPEN_SYNTAX:
							case CLOSE_SYNTAX:
								matchResult.match.push({
									type: item.type,
									syntax: item.syntax
								});
								break;

							default:
								matchResult.match.push({
									token: item.token.value,
									node: item.token.node
								});
								break;
						}

						item = item.prev;
					}
				}

				return matchResult;
			}

			function matchAsTree(tokens, matchGraph, syntaxes) {
				var matchResult = internalMatch(tokens, matchGraph, syntaxes || {});

				if (matchResult.match === null) {
					return matchResult;
				}

				var item = matchResult.match;
				var host = matchResult.match = {
					syntax: matchGraph.syntax || null,
					match: []
				};
				var hostStack = [host];

				// revert a list and start with 2nd item since 1st is a stub item
				item = reverseList(item).prev;

				// build a tree
				while (item !== null) {
					switch (item.type) {
						case OPEN_SYNTAX:
							host.match.push(host = {
								syntax: item.syntax,
								match: []
							});
							hostStack.push(host);
							break;

						case CLOSE_SYNTAX:
							hostStack.pop();
							host = hostStack[hostStack.length - 1];
							break;

						default:
							host.match.push({
								syntax: item.syntax || null,
								token: item.token.value,
								node: item.token.node
							});
					}

					item = item.prev;
				}

				return matchResult;
			}

			module.exports = {
				matchAsList: matchAsList,
				matchAsTree: matchAsTree,
				getTotalIterationCount: function () {
					return totalIterationCount;
				}
			};

		}, { "../tokenizer/const": 106, "./match-graph": 22 }], 24: [function (require, module, exports) {
			var tokenize = require("../tokenizer");
			var TokenStream = require("../common/TokenStream");
			var tokenStream = new TokenStream();
			var astToTokens = {
				decorator: function (handlers) {
					var curNode = null;
					var prev = { len: 0, node: null };
					var nodes = [prev];
					var buffer = "";

					return {
						children: handlers.children,
						node: function (node) {
							var tmp = curNode;
							curNode = node;
							handlers.node.call(this, node);
							curNode = tmp;
						},
						chunk: function (chunk) {
							buffer += chunk;
							if (prev.node !== curNode) {
								nodes.push({
									len: chunk.length,
									node: curNode
								});
							} else {
								prev.len += chunk.length;
							}
						},
						result: function () {
							return prepareTokens(buffer, nodes);
						}
					};
				}
			};

			function prepareTokens(str, nodes) {
				var tokens = [];
				var nodesOffset = 0;
				var nodesIndex = 0;
				var currentNode = nodes ? nodes[nodesIndex].node : null;

				tokenize(str, tokenStream);

				while (!tokenStream.eof) {
					if (nodes) {
						while (nodesIndex < nodes.length && nodesOffset + nodes[nodesIndex].len <= tokenStream.tokenStart) {
							nodesOffset += nodes[nodesIndex++].len;
							currentNode = nodes[nodesIndex].node;
						}
					}

					tokens.push({
						type: tokenStream.tokenType,
						value: tokenStream.getTokenValue(),
						index: tokenStream.tokenIndex, // TODO: remove it, temporary solution
						balance: tokenStream.balance[tokenStream.tokenIndex], // TODO: remove it, temporary solution
						node: currentNode
					});
					tokenStream.next();
					// console.log({ ...tokens[tokens.length - 1], node: undefined });
				}

				return tokens;
			}

			module.exports = function (value, syntax) {
				if (typeof value === "string") {
					return prepareTokens(value, null);
				}

				return syntax.generate(value, astToTokens);
			};

		}, { "../common/TokenStream": 5, "../tokenizer": 107 }], 25: [function (require, module, exports) {
			var List = require("../common/List");

			function getFirstMatchNode(matchNode) {
				if ("node" in matchNode) {
					return matchNode.node;
				}

				return getFirstMatchNode(matchNode.match[0]);
			}

			function getLastMatchNode(matchNode) {
				if ("node" in matchNode) {
					return matchNode.node;
				}

				return getLastMatchNode(matchNode.match[matchNode.match.length - 1]);
			}

			function matchFragments(lexer, ast, match, type, name) {
				function findFragments(matchNode) {
					if (matchNode.syntax !== null &&
						matchNode.syntax.type === type &&
						matchNode.syntax.name === name) {
						var start = getFirstMatchNode(matchNode);
						var end = getLastMatchNode(matchNode);

						lexer.syntax.walk(ast, function (node, item, list) {
							if (node === start) {
								var nodes = new List();

								do {
									nodes.appendData(item.data);

									if (item.data === end) {
										break;
									}

									item = item.next;
								} while (item !== null);

								fragments.push({
									parent: list,
									nodes: nodes
								});
							}
						});
					}

					if (Array.isArray(matchNode.match)) {
						matchNode.match.forEach(findFragments);
					}
				}

				var fragments = [];

				if (match.matched !== null) {
					findFragments(match.matched);
				}

				return fragments;
			}

			module.exports = {
				matchFragments: matchFragments
			};

		}, { "../common/List": 2 }], 26: [function (require, module, exports) {
			var List = require("../common/List");
			var hasOwnProperty = Object.prototype.hasOwnProperty;

			function isValidNumber(value) {
				// Number.isInteger(value) && value >= 0
				return (
					typeof value === "number" &&
					isFinite(value) &&
					Math.floor(value) === value &&
					value >= 0
				);
			}

			function isValidLocation(loc) {
				return (
					Boolean(loc) &&
					isValidNumber(loc.offset) &&
					isValidNumber(loc.line) &&
					isValidNumber(loc.column)
				);
			}

			function createNodeStructureChecker(type, fields) {
				return function checkNode(node, warn) {
					if (!node || node.constructor !== Object) {
						return warn(node, "Type of node should be an Object");
					}

					for (var key in node) {
						var valid = true;

						if (hasOwnProperty.call(node, key) === false) {
							continue;
						}

						if (key === "type") {
							if (node.type !== type) {
								warn(node, "Wrong node type `" + node.type + "`, expected `" + type + "`");
							}
						} else if (key === "loc") {
							if (node.loc === null) {
								continue;
							} else if (node.loc && node.loc.constructor === Object) {
								if (typeof node.loc.source !== "string") {
									key += ".source";
								} else if (!isValidLocation(node.loc.start)) {
									key += ".start";
								} else if (!isValidLocation(node.loc.end)) {
									key += ".end";
								} else {
									continue;
								}
							}

							valid = false;
						} else if (fields.hasOwnProperty(key)) {
							for (var i = 0, valid = false; !valid && i < fields[key].length; i++) {
								var fieldType = fields[key][i];

								switch (fieldType) {
									case String:
										valid = typeof node[key] === "string";
										break;

									case Boolean:
										valid = typeof node[key] === "boolean";
										break;

									case null:
										valid = node[key] === null;
										break;

									default:
										if (typeof fieldType === "string") {
											valid = node[key] && node[key].type === fieldType;
										} else if (Array.isArray(fieldType)) {
											valid = node[key] instanceof List;
										}
								}
							}
						} else {
							warn(node, "Unknown field `" + key + "` for " + type + " node type");
						}

						if (!valid) {
							warn(node, "Bad value for `" + type + "." + key + "`");
						}
					}

					for (var key in fields) {
						if (hasOwnProperty.call(fields, key) &&
							hasOwnProperty.call(node, key) === false) {
							warn(node, "Field `" + type + "." + key + "` is missed");
						}
					}
				};
			}

			function processStructure(name, nodeType) {
				var structure = nodeType.structure;
				var fields = {
					type: String,
					loc: true
				};
				var docs = {
					type: "\"" + name + "\""
				};

				for (var key in structure) {
					if (hasOwnProperty.call(structure, key) === false) {
						continue;
					}

					var docsTypes = [];
					var fieldTypes = fields[key] = Array.isArray(structure[key])
						? structure[key].slice()
						: [structure[key]];

					for (var i = 0; i < fieldTypes.length; i++) {
						var fieldType = fieldTypes[i];
						if (fieldType === String || fieldType === Boolean) {
							docsTypes.push(fieldType.name);
						} else if (fieldType === null) {
							docsTypes.push("null");
						} else if (typeof fieldType === "string") {
							docsTypes.push("<" + fieldType + ">");
						} else if (Array.isArray(fieldType)) {
							docsTypes.push("List"); // TODO: use type enum
						} else {
							throw new Error("Wrong value `" + fieldType + "` in `" + name + "." + key + "` structure definition");
						}
					}

					docs[key] = docsTypes.join(" | ");
				}

				return {
					docs: docs,
					check: createNodeStructureChecker(name, fields)
				};
			}

			module.exports = {
				getStructureFromConfig: function (config) {
					var structure = {};

					if (config.node) {
						for (var name in config.node) {
							if (hasOwnProperty.call(config.node, name)) {
								var nodeType = config.node[name];

								if (nodeType.structure) {
									structure[name] = processStructure(name, nodeType);
								} else {
									throw new Error("Missed `structure` field in `" + name + "` node type definition");
								}
							}
						}
					}

					return structure;
				}
			};

		}, { "../common/List": 2 }], 27: [function (require, module, exports) {
			function getTrace(node) {
				function shouldPutToTrace(syntax) {
					if (syntax === null) {
						return false;
					}

					return (
						syntax.type === "Type" ||
						syntax.type === "Property" ||
						syntax.type === "Keyword"
					);
				}

				function hasMatch(matchNode) {
					if (Array.isArray(matchNode.match)) {
						// use for-loop for better perfomance
						for (var i = 0; i < matchNode.match.length; i++) {
							if (hasMatch(matchNode.match[i])) {
								if (shouldPutToTrace(matchNode.syntax)) {
									result.unshift(matchNode.syntax);
								}

								return true;
							}
						}
					} else if (matchNode.node === node) {
						result = shouldPutToTrace(matchNode.syntax)
							? [matchNode.syntax]
							: [];

						return true;
					}

					return false;
				}

				var result = null;

				if (this.matched !== null) {
					hasMatch(this.matched);
				}

				return result;
			}

			function testNode(match, node, fn) {
				var trace = getTrace.call(match, node);

				if (trace === null) {
					return false;
				}

				return trace.some(fn);
			}

			function isType(node, type) {
				return testNode(this, node, function (matchNode) {
					return matchNode.type === "Type" && matchNode.name === type;
				});
			}

			function isProperty(node, property) {
				return testNode(this, node, function (matchNode) {
					return matchNode.type === "Property" && matchNode.name === property;
				});
			}

			function isKeyword(node) {
				return testNode(this, node, function (matchNode) {
					return matchNode.type === "Keyword";
				});
			}

			module.exports = {
				getTrace: getTrace,
				isType: isType,
				isProperty: isProperty,
				isKeyword: isKeyword
			};

		}, {}], 28: [function (require, module, exports) {
			var OffsetToLocation = require("../common/OffsetToLocation");
			var SyntaxError = require("../common/SyntaxError");
			var TokenStream = require("../common/TokenStream");
			var List = require("../common/List");
			var tokenize = require("../tokenizer");
			var constants = require("../tokenizer/const");
			var findWhiteSpaceStart = require("../tokenizer/utils").findWhiteSpaceStart;
			var sequence = require("./sequence");
			var noop = function () { };

			var TYPE = constants.TYPE;
			var NAME = constants.NAME;
			var WHITESPACE = TYPE.WhiteSpace;
			var IDENT = TYPE.Ident;
			var FUNCTION = TYPE.Function;
			var URL = TYPE.Url;
			var HASH = TYPE.Hash;
			var PERCENTAGE = TYPE.Percentage;
			var NUMBER = TYPE.Number;
			var NUMBERSIGN = 0x0023; // U+0023 NUMBER SIGN (#)
			var NULL = 0;

			function createParseContext(name) {
				return function () {
					return this[name]();
				};
			}

			function processConfig(config) {
				var parserConfig = {
					context: {},
					scope: {},
					atrule: {},
					pseudo: {}
				};

				if (config.parseContext) {
					for (var name in config.parseContext) {
						switch (typeof config.parseContext[name]) {
							case "function":
								parserConfig.context[name] = config.parseContext[name];
								break;

							case "string":
								parserConfig.context[name] = createParseContext(config.parseContext[name]);
								break;
						}
					}
				}

				if (config.scope) {
					for (var name in config.scope) {
						parserConfig.scope[name] = config.scope[name];
					}
				}

				if (config.atrule) {
					for (var name in config.atrule) {
						var atrule = config.atrule[name];

						if (atrule.parse) {
							parserConfig.atrule[name] = atrule.parse;
						}
					}
				}

				if (config.pseudo) {
					for (var name in config.pseudo) {
						var pseudo = config.pseudo[name];

						if (pseudo.parse) {
							parserConfig.pseudo[name] = pseudo.parse;
						}
					}
				}

				if (config.node) {
					for (var name in config.node) {
						parserConfig[name] = config.node[name].parse;
					}
				}

				return parserConfig;
			}

			module.exports = function createParser(config) {
				var parser = {
					scanner: new TokenStream(),
					locationMap: new OffsetToLocation(),

					filename: "<unknown>",
					needPositions: false,
					onParseError: noop,
					onParseErrorThrow: false,
					parseAtrulePrelude: true,
					parseRulePrelude: true,
					parseValue: true,
					parseCustomProperty: false,

					readSequence: sequence,

					createList: function () {
						return new List();
					},
					createSingleNodeList: function (node) {
						return new List().appendData(node);
					},
					getFirstListNode: function (list) {
						return list && list.first();
					},
					getLastListNode: function (list) {
						return list.last();
					},

					parseWithFallback: function (consumer, fallback) {
						var startToken = this.scanner.tokenIndex;

						try {
							return consumer.call(this);
						} catch (e) {
							if (this.onParseErrorThrow) {
								throw e;
							}

							var fallbackNode = fallback.call(this, startToken);

							this.onParseErrorThrow = true;
							this.onParseError(e, fallbackNode);
							this.onParseErrorThrow = false;

							return fallbackNode;
						}
					},

					lookupNonWSType: function (offset) {
						do {
							var type = this.scanner.lookupType(offset++);
							if (type !== WHITESPACE) {
								return type;
							}
						} while (type !== NULL);

						return NULL;
					},

					eat: function (tokenType) {
						if (this.scanner.tokenType !== tokenType) {
							var offset = this.scanner.tokenStart;
							var message = NAME[tokenType] + " is expected";

							// tweak message and offset
							switch (tokenType) {
								case IDENT:
									// when identifier is expected but there is a function or url
									if (this.scanner.tokenType === FUNCTION || this.scanner.tokenType === URL) {
										offset = this.scanner.tokenEnd - 1;
										message = "Identifier is expected but function found";
									} else {
										message = "Identifier is expected";
									}
									break;

								case HASH:
									if (this.scanner.isDelim(NUMBERSIGN)) {
										this.scanner.next();
										offset++;
										message = "Name is expected";
									}
									break;

								case PERCENTAGE:
									if (this.scanner.tokenType === NUMBER) {
										offset = this.scanner.tokenEnd;
										message = "Percent sign is expected";
									}
									break;

								default:
									// when test type is part of another token show error for current position + 1
									// e.g. eat(HYPHENMINUS) will fail on "-foo", but pointing on "-" is odd
									if (this.scanner.source.charCodeAt(this.scanner.tokenStart) === tokenType) {
										offset = offset + 1;
									}
							}

							this.error(message, offset);
						}

						this.scanner.next();
					},

					consume: function (tokenType) {
						var value = this.scanner.getTokenValue();

						this.eat(tokenType);

						return value;
					},
					consumeFunctionName: function () {
						var name = this.scanner.source.substring(this.scanner.tokenStart, this.scanner.tokenEnd - 1);

						this.eat(FUNCTION);

						return name;
					},

					getLocation: function (start, end) {
						if (this.needPositions) {
							return this.locationMap.getLocationRange(
								start,
								end,
								this.filename
							);
						}

						return null;
					},
					getLocationFromList: function (list) {
						if (this.needPositions) {
							var head = this.getFirstListNode(list);
							var tail = this.getLastListNode(list);
							return this.locationMap.getLocationRange(
								head !== null ? head.loc.start.offset - this.locationMap.startOffset : this.scanner.tokenStart,
								tail !== null ? tail.loc.end.offset - this.locationMap.startOffset : this.scanner.tokenStart,
								this.filename
							);
						}

						return null;
					},

					error: function (message, offset) {
						var location = typeof offset !== "undefined" && offset < this.scanner.source.length
							? this.locationMap.getLocation(offset)
							: this.scanner.eof
								? this.locationMap.getLocation(findWhiteSpaceStart(this.scanner.source, this.scanner.source.length - 1))
								: this.locationMap.getLocation(this.scanner.tokenStart);

						throw new SyntaxError(
							message || "Unexpected input",
							this.scanner.source,
							location.offset,
							location.line,
							location.column
						);
					}
				};

				config = processConfig(config || {});
				for (var key in config) {
					parser[key] = config[key];
				}

				return function (source, options) {
					options = options || {};

					var context = options.context || "default";
					var ast;

					tokenize(source, parser.scanner);
					parser.locationMap.setSource(
						source,
						options.offset,
						options.line,
						options.column
					);

					parser.filename = options.filename || "<unknown>";
					parser.needPositions = Boolean(options.positions);
					parser.onParseError = typeof options.onParseError === "function" ? options.onParseError : noop;
					parser.onParseErrorThrow = false;
					parser.parseAtrulePrelude = "parseAtrulePrelude" in options ? Boolean(options.parseAtrulePrelude) : true;
					parser.parseRulePrelude = "parseRulePrelude" in options ? Boolean(options.parseRulePrelude) : true;
					parser.parseValue = "parseValue" in options ? Boolean(options.parseValue) : true;
					parser.parseCustomProperty = "parseCustomProperty" in options ? Boolean(options.parseCustomProperty) : false;

					if (!parser.context.hasOwnProperty(context)) {
						throw new Error("Unknown context `" + context + "`");
					}

					ast = parser.context[context].call(parser, options);

					if (!parser.scanner.eof) {
						parser.error();
					}

					return ast;
				};
			};

		}, { "../common/List": 2, "../common/OffsetToLocation": 3, "../common/SyntaxError": 4, "../common/TokenStream": 5, "../tokenizer": 107, "../tokenizer/const": 106, "../tokenizer/utils": 108, "./sequence": 29 }], 29: [function (require, module, exports) {
			var TYPE = require("../tokenizer").TYPE;
			var WHITESPACE = TYPE.WhiteSpace;
			var COMMENT = TYPE.Comment;

			module.exports = function readSequence(recognizer) {
				var children = this.createList();
				var child = null;
				var context = {
					recognizer: recognizer,
					space: null,
					ignoreWS: false,
					ignoreWSAfter: false
				};

				this.scanner.skipSC();

				while (!this.scanner.eof) {
					switch (this.scanner.tokenType) {
						case COMMENT:
							this.scanner.next();
							continue;

						case WHITESPACE:
							if (context.ignoreWS) {
								this.scanner.next();
							} else {
								context.space = this.WhiteSpace();
							}
							continue;
					}

					child = recognizer.getNode.call(this, context);

					if (child === undefined) {
						break;
					}

					if (context.space !== null) {
						children.push(context.space);
						context.space = null;
					}

					children.push(child);

					if (context.ignoreWSAfter) {
						context.ignoreWSAfter = false;
						context.ignoreWS = true;
					} else {
						context.ignoreWS = false;
					}
				}

				return children;
			};

		}, { "../tokenizer": 107 }], 30: [function (require, module, exports) {
			module.exports = {
				parse: {
					prelude: null,
					block: function () {
						return this.Block(true);
					}
				}
			};

		}, {}], 31: [function (require, module, exports) {
			var TYPE = require("../../tokenizer").TYPE;

			var STRING = TYPE.String;
			var IDENT = TYPE.Ident;
			var URL = TYPE.Url;
			var FUNCTION = TYPE.Function;
			var LEFTPARENTHESIS = TYPE.LeftParenthesis;

			module.exports = {
				parse: {
					prelude: function () {
						var children = this.createList();

						this.scanner.skipSC();

						switch (this.scanner.tokenType) {
							case STRING:
								children.push(this.String());
								break;

							case URL:
							case FUNCTION:
								children.push(this.Url());
								break;

							default:
								this.error("String or url() is expected");
						}

						if (this.lookupNonWSType(0) === IDENT ||
							this.lookupNonWSType(0) === LEFTPARENTHESIS) {
							children.push(this.WhiteSpace());
							children.push(this.MediaQueryList());
						}

						return children;
					},
					block: null
				}
			};

		}, { "../../tokenizer": 107 }], 32: [function (require, module, exports) {
			module.exports = {
				"font-face": require("./font-face"),
				"import": require("./import"),
				"media": require("./media"),
				"page": require("./page"),
				"supports": require("./supports")
			};

		}, { "./font-face": 30, "./import": 31, "./media": 33, "./page": 34, "./supports": 35 }], 33: [function (require, module, exports) {
			module.exports = {
				parse: {
					prelude: function () {
						return this.createSingleNodeList(
							this.MediaQueryList()
						);
					},
					block: function () {
						return this.Block(false);
					}
				}
			};

		}, {}], 34: [function (require, module, exports) {
			module.exports = {
				parse: {
					prelude: function () {
						return this.createSingleNodeList(
							this.SelectorList()
						);
					},
					block: function () {
						return this.Block(true);
					}
				}
			};

		}, {}], 35: [function (require, module, exports) {
			var TYPE = require("../../tokenizer").TYPE;

			var WHITESPACE = TYPE.WhiteSpace;
			var COMMENT = TYPE.Comment;
			var IDENT = TYPE.Ident;
			var FUNCTION = TYPE.Function;
			var COLON = TYPE.Colon;
			var LEFTPARENTHESIS = TYPE.LeftParenthesis;

			function consumeRaw() {
				return this.createSingleNodeList(
					this.Raw(this.scanner.tokenIndex, null, false)
				);
			}

			function parentheses() {
				this.scanner.skipSC();

				if (this.scanner.tokenType === IDENT &&
					this.lookupNonWSType(1) === COLON) {
					return this.createSingleNodeList(
						this.Declaration()
					);
				}

				return readSequence.call(this);
			}

			function readSequence() {
				var children = this.createList();
				var space = null;
				var child;

				this.scanner.skipSC();

				scan:
				while (!this.scanner.eof) {
					switch (this.scanner.tokenType) {
						case WHITESPACE:
							space = this.WhiteSpace();
							continue;

						case COMMENT:
							this.scanner.next();
							continue;

						case FUNCTION:
							child = this.Function(consumeRaw, this.scope.AtrulePrelude);
							break;

						case IDENT:
							child = this.Identifier();
							break;

						case LEFTPARENTHESIS:
							child = this.Parentheses(parentheses, this.scope.AtrulePrelude);
							break;

						default:
							break scan;
					}

					if (space !== null) {
						children.push(space);
						space = null;
					}

					children.push(child);
				}

				return children;
			}

			module.exports = {
				parse: {
					prelude: function () {
						var children = readSequence.call(this);

						if (this.getFirstListNode(children) === null) {
							this.error("Condition is expected");
						}

						return children;
					},
					block: function () {
						return this.Block(false);
					}
				}
			};

		}, { "../../tokenizer": 107 }], 36: [function (require, module, exports) {
			var data = require("../../../data");

			module.exports = {
				generic: true,
				types: data.types,
				properties: data.properties,
				node: require("../node")
			};

		}, { "../../../data": 1, "../node": 85 }], 37: [function (require, module, exports) {
			var hasOwnProperty = Object.prototype.hasOwnProperty;
			var shape = {
				generic: true,
				types: {},
				properties: {},
				parseContext: {},
				scope: {},
				atrule: ["parse"],
				pseudo: ["parse"],
				node: ["name", "structure", "parse", "generate", "walkContext"]
			};

			function isObject(value) {
				return value && value.constructor === Object;
			}

			function copy(value) {
				if (isObject(value)) {
					var res = {};
					for (var key in value) {
						if (hasOwnProperty.call(value, key)) {
							res[key] = value[key];
						}
					}
					return res;
				} else {
					return value;
				}
			}

			function extend(dest, src) {
				for (var key in src) {
					if (hasOwnProperty.call(src, key)) {
						if (isObject(dest[key])) {
							extend(dest[key], copy(src[key]));
						} else {
							dest[key] = copy(src[key]);
						}
					}
				}
			}

			function mix(dest, src, shape) {
				for (var key in shape) {
					if (hasOwnProperty.call(shape, key) === false) {
						continue;
					}

					if (shape[key] === true) {
						if (key in src) {
							if (hasOwnProperty.call(src, key)) {
								dest[key] = copy(src[key]);
							}
						}
					} else if (shape[key]) {
						if (isObject(shape[key])) {
							var res = {};
							extend(res, dest[key]);
							extend(res, src[key]);
							dest[key] = res;
						} else if (Array.isArray(shape[key])) {
							var res = {};
							var innerShape = shape[key].reduce(function (s, k) {
								s[k] = true;
								return s;
							}, {});
							for (var name in dest[key]) {
								if (hasOwnProperty.call(dest[key], name)) {
									res[name] = {};
									if (dest[key] && dest[key][name]) {
										mix(res[name], dest[key][name], innerShape);
									}
								}
							}
							for (var name in src[key]) {
								if (hasOwnProperty.call(src[key], name)) {
									if (!res[name]) {
										res[name] = {};
									}
									if (src[key] && src[key][name]) {
										mix(res[name], src[key][name], innerShape);
									}
								}
							}
							dest[key] = res;
						}
					}
				}
				return dest;
			}

			module.exports = function (dest, src) {
				return mix(dest, src, shape);
			};

		}, {}], 38: [function (require, module, exports) {
			module.exports = {
				parseContext: {
					default: "StyleSheet",
					stylesheet: "StyleSheet",
					atrule: "Atrule",
					atrulePrelude: function (options) {
						return this.AtrulePrelude(options.atrule ? String(options.atrule) : null);
					},
					mediaQueryList: "MediaQueryList",
					mediaQuery: "MediaQuery",
					rule: "Rule",
					selectorList: "SelectorList",
					selector: "Selector",
					block: function () {
						return this.Block(true);
					},
					declarationList: "DeclarationList",
					declaration: "Declaration",
					value: "Value"
				},
				scope: require("../scope"),
				atrule: require("../atrule"),
				pseudo: require("../pseudo"),
				node: require("../node")
			};

		}, { "../atrule": 32, "../node": 85, "../pseudo": 91, "../scope": 102 }], 39: [function (require, module, exports) {
			module.exports = {
				node: require("../node")
			};

		}, { "../node": 85 }], 40: [function (require, module, exports) {
			var List = require("../common/List");
			var SyntaxError = require("../common/SyntaxError");
			var TokenStream = require("../common/TokenStream");
			var Lexer = require("../lexer/Lexer");
			var grammar = require("../lexer/grammar");
			var tokenize = require("../tokenizer");
			var createParser = require("../parser/create");
			var createGenerator = require("../generator/create");
			var createConvertor = require("../convertor/create");
			var createWalker = require("../walker/create");
			var clone = require("../utils/clone");
			var names = require("../utils/names");
			var mix = require("./config/mix");

			function assign(dest, src) {
				for (var key in src) {
					dest[key] = src[key];
				}

				return dest;
			}

			function createSyntax(config) {
				var parse = createParser(config);
				var walk = createWalker(config);
				var generate = createGenerator(config);
				var convert = createConvertor(walk);

				var syntax = {
					List: List,
					SyntaxError: SyntaxError,
					TokenStream: TokenStream,
					Lexer: Lexer,

					vendorPrefix: names.vendorPrefix,
					keyword: names.keyword,
					property: names.property,
					isCustomProperty: names.isCustomProperty,

					grammar: grammar,
					lexer: null,
					createLexer: function (config) {
						return new Lexer(config, syntax, syntax.lexer.structure);
					},

					tokenize: tokenize,
					parse: parse,
					walk: walk,
					generate: generate,

					clone: clone,
					fromPlainObject: convert.fromPlainObject,
					toPlainObject: convert.toPlainObject,

					createSyntax: function (config) {
						return createSyntax(mix({}, config));
					},
					fork: function (extension) {
						var base = mix({}, config); // copy of config
						return createSyntax(
							typeof extension === "function"
								? extension(base, assign)
								: mix(base, extension)
						);
					}
				};

				syntax.lexer = new Lexer({
					generic: true,
					types: config.types,
					properties: config.properties,
					node: config.node
				}, syntax);

				return syntax;
			}

			exports.create = function (config) {
				return createSyntax(mix({}, config));
			};

		}, { "../common/List": 2, "../common/SyntaxError": 4, "../common/TokenStream": 5, "../convertor/create": 7, "../generator/create": 8, "../lexer/Lexer": 11, "../lexer/grammar": 18, "../parser/create": 28, "../tokenizer": 107, "../utils/clone": 109, "../utils/names": 111, "../walker/create": 112, "./config/mix": 37 }], 41: [function (require, module, exports) {
			// https://drafts.csswg.org/css-images-4/#element-notation
			// https://developer.mozilla.org/en-US/docs/Web/CSS/element
			module.exports = function () {
				this.scanner.skipSC();

				var children = this.createSingleNodeList(
					this.IdSelector()
				);

				this.scanner.skipSC();

				return children;
			};

		}, {}], 42: [function (require, module, exports) {
			// legacy IE function
			// expression( <any-value> )
			module.exports = function () {
				return this.createSingleNodeList(
					this.Raw(this.scanner.tokenIndex, null, false)
				);
			};

		}, {}], 43: [function (require, module, exports) {
			var TYPE = require("../../tokenizer").TYPE;
			var rawMode = require("../node/Raw").mode;

			var COMMA = TYPE.Comma;

			// var( <ident> , <value>? )
			module.exports = function () {
				var children = this.createList();

				this.scanner.skipSC();

				// NOTE: Don't check more than a first argument is an ident, rest checks are for lexer
				children.push(this.Identifier());

				this.scanner.skipSC();

				if (this.scanner.tokenType === COMMA) {
					children.push(this.Operator());
					children.push(this.parseCustomProperty
						? this.Value(null)
						: this.Raw(this.scanner.tokenIndex, rawMode.exclamationMarkOrSemicolon, false)
					);
				}

				return children;
			};

		}, { "../../tokenizer": 107, "../node/Raw": 74 }], 44: [function (require, module, exports) {
			function merge() {
				var dest = {};

				for (var i = 0; i < arguments.length; i++) {
					var src = arguments[i];
					for (var key in src) {
						dest[key] = src[key];
					}
				}

				return dest;
			}

			module.exports = require("./create").create(
				merge(
					require("./config/lexer"),
					require("./config/parser"),
					require("./config/walker")
				)
			);

		}, { "./config/lexer": 36, "./config/parser": 38, "./config/walker": 39, "./create": 40 }], 45: [function (require, module, exports) {
			var cmpChar = require("../../tokenizer").cmpChar;
			var isDigit = require("../../tokenizer").isDigit;
			var TYPE = require("../../tokenizer").TYPE;

			var WHITESPACE = TYPE.WhiteSpace;
			var COMMENT = TYPE.Comment;
			var IDENT = TYPE.Ident;
			var NUMBER = TYPE.Number;
			var DIMENSION = TYPE.Dimension;
			var PLUSSIGN = 0x002B;    // U+002B PLUS SIGN (+)
			var HYPHENMINUS = 0x002D; // U+002D HYPHEN-MINUS (-)
			var N = 0x006E;           // U+006E LATIN SMALL LETTER N (n)
			var DISALLOW_SIGN = true;
			var ALLOW_SIGN = false;

			function checkInteger(offset, disallowSign) {
				var pos = this.scanner.tokenStart + offset;
				var code = this.scanner.source.charCodeAt(pos);

				if (code === PLUSSIGN || code === HYPHENMINUS) {
					if (disallowSign) {
						this.error("Number sign is not allowed");
					}
					pos++;
				}

				for (; pos < this.scanner.tokenEnd; pos++) {
					if (!isDigit(this.scanner.source.charCodeAt(pos))) {
						this.error("Integer is expected", pos);
					}
				}
			}

			function checkTokenIsInteger(disallowSign) {
				return checkInteger.call(this, 0, disallowSign);
			}

			function expectCharCode(offset, code) {
				if (!cmpChar(this.scanner.source, this.scanner.tokenStart + offset, code)) {
					var msg = "";

					switch (code) {
						case N:
							msg = "N is expected";
							break;
						case HYPHENMINUS:
							msg = "HyphenMinus is expected";
							break;
					}

					this.error(msg, this.scanner.tokenStart + offset);
				}
			}

			// ... <signed-integer>
			// ... ['+' | '-'] <signless-integer>
			function consumeB() {
				var offset = 0;
				var sign = 0;
				var type = this.scanner.tokenType;

				while (type === WHITESPACE || type === COMMENT) {
					type = this.scanner.lookupType(++offset);
				}

				if (type !== NUMBER) {
					if (this.scanner.isDelim(PLUSSIGN, offset) ||
						this.scanner.isDelim(HYPHENMINUS, offset)) {
						sign = this.scanner.isDelim(PLUSSIGN, offset) ? PLUSSIGN : HYPHENMINUS;

						do {
							type = this.scanner.lookupType(++offset);
						} while (type === WHITESPACE || type === COMMENT);

						if (type !== NUMBER) {
							this.scanner.skip(offset);
							checkTokenIsInteger.call(this, DISALLOW_SIGN);
						}
					} else {
						return null;
					}
				}

				if (offset > 0) {
					this.scanner.skip(offset);
				}

				if (sign === 0) {
					type = this.scanner.source.charCodeAt(this.scanner.tokenStart);
					if (type !== PLUSSIGN && type !== HYPHENMINUS) {
						this.error("Number sign is expected");
					}
				}

				checkTokenIsInteger.call(this, sign !== 0);
				return sign === HYPHENMINUS ? "-" + this.consume(NUMBER) : this.consume(NUMBER);
			}

			// An+B microsyntax https://www.w3.org/TR/css-syntax-3/#anb
			module.exports = {
				name: "AnPlusB",
				structure: {
					a: [String, null],
					b: [String, null]
				},
				parse: function () {
					var start = this.scanner.tokenStart;
					var a = null;
					var b = null;

					// <integer>
					if (this.scanner.tokenType === NUMBER) {
						checkTokenIsInteger.call(this, ALLOW_SIGN);
						b = this.consume(NUMBER);
					}

					// -n
					// -n <signed-integer>
					// -n ['+' | '-'] <signless-integer>
					// -n- <signless-integer>
					// <dashndashdigit-ident>
					else if (this.scanner.tokenType === IDENT && cmpChar(this.scanner.source, this.scanner.tokenStart, HYPHENMINUS)) {
						a = "-1";

						expectCharCode.call(this, 1, N);

						switch (this.scanner.getTokenLength()) {
							// -n
							// -n <signed-integer>
							// -n ['+' | '-'] <signless-integer>
							case 2:
								this.scanner.next();
								b = consumeB.call(this);
								break;

							// -n- <signless-integer>
							case 3:
								expectCharCode.call(this, 2, HYPHENMINUS);

								this.scanner.next();
								this.scanner.skipSC();

								checkTokenIsInteger.call(this, DISALLOW_SIGN);

								b = "-" + this.consume(NUMBER);
								break;

							// <dashndashdigit-ident>
							default:
								expectCharCode.call(this, 2, HYPHENMINUS);
								checkInteger.call(this, 3, DISALLOW_SIGN);
								this.scanner.next();

								b = this.scanner.substrToCursor(start + 2);
						}
					}

					// '+'? n
					// '+'? n <signed-integer>
					// '+'? n ['+' | '-'] <signless-integer>
					// '+'? n- <signless-integer>
					// '+'? <ndashdigit-ident>
					else if (this.scanner.tokenType === IDENT || (this.scanner.isDelim(PLUSSIGN) && this.scanner.lookupType(1) === IDENT)) {
						var sign = 0;
						a = "1";

						// just ignore a plus
						if (this.scanner.isDelim(PLUSSIGN)) {
							sign = 1;
							this.scanner.next();
						}

						expectCharCode.call(this, 0, N);

						switch (this.scanner.getTokenLength()) {
							// '+'? n
							// '+'? n <signed-integer>
							// '+'? n ['+' | '-'] <signless-integer>
							case 1:
								this.scanner.next();
								b = consumeB.call(this);
								break;

							// '+'? n- <signless-integer>
							case 2:
								expectCharCode.call(this, 1, HYPHENMINUS);

								this.scanner.next();
								this.scanner.skipSC();

								checkTokenIsInteger.call(this, DISALLOW_SIGN);

								b = "-" + this.consume(NUMBER);
								break;

							// '+'? <ndashdigit-ident>
							default:
								expectCharCode.call(this, 1, HYPHENMINUS);
								checkInteger.call(this, 2, DISALLOW_SIGN);
								this.scanner.next();

								b = this.scanner.substrToCursor(start + sign + 1);
						}
					}

					// <ndashdigit-dimension>
					// <ndash-dimension> <signless-integer>
					// <n-dimension>
					// <n-dimension> <signed-integer>
					// <n-dimension> ['+' | '-'] <signless-integer>
					else if (this.scanner.tokenType === DIMENSION) {
						var code = this.scanner.source.charCodeAt(this.scanner.tokenStart);
						var sign = code === PLUSSIGN || code === HYPHENMINUS;

						for (var i = this.scanner.tokenStart + sign; i < this.scanner.tokenEnd; i++) {
							if (!isDigit(this.scanner.source.charCodeAt(i))) {
								break;
							}
						}

						if (i === this.scanner.tokenStart + sign) {
							this.error("Integer is expected", this.scanner.tokenStart + sign);
						}

						expectCharCode.call(this, i - this.scanner.tokenStart, N);
						a = this.scanner.source.substring(start, i);

						// <n-dimension>
						// <n-dimension> <signed-integer>
						// <n-dimension> ['+' | '-'] <signless-integer>
						if (i + 1 === this.scanner.tokenEnd) {
							this.scanner.next();
							b = consumeB.call(this);
						} else {
							expectCharCode.call(this, i - this.scanner.tokenStart + 1, HYPHENMINUS);

							// <ndash-dimension> <signless-integer>
							if (i + 2 === this.scanner.tokenEnd) {
								this.scanner.next();
								this.scanner.skipSC();
								checkTokenIsInteger.call(this, DISALLOW_SIGN);
								b = "-" + this.consume(NUMBER);
							}
							// <ndashdigit-dimension>
							else {
								checkInteger.call(this, i - this.scanner.tokenStart + 2, DISALLOW_SIGN);
								this.scanner.next();
								b = this.scanner.substrToCursor(i + 1);
							}
						}
					} else {
						this.error();
					}

					if (a !== null && a.charCodeAt(0) === PLUSSIGN) {
						a = a.substr(1);
					}

					if (b !== null && b.charCodeAt(0) === PLUSSIGN) {
						b = b.substr(1);
					}

					return {
						type: "AnPlusB",
						loc: this.getLocation(start, this.scanner.tokenStart),
						a: a,
						b: b
					};
				},
				generate: function (node) {
					var a = node.a !== null && node.a !== undefined;
					var b = node.b !== null && node.b !== undefined;

					if (a) {
						this.chunk(
							node.a === "+1" ? "+n" :
								node.a === "1" ? "n" :
									node.a === "-1" ? "-n" :
										node.a + "n"
						);

						if (b) {
							b = String(node.b);
							if (b.charAt(0) === "-" || b.charAt(0) === "+") {
								this.chunk(b.charAt(0));
								this.chunk(b.substr(1));
							} else {
								this.chunk("+");
								this.chunk(b);
							}
						}
					} else {
						this.chunk(String(node.b));
					}
				}
			};

		}, { "../../tokenizer": 107 }], 46: [function (require, module, exports) {
			var TYPE = require("../../tokenizer").TYPE;
			var rawMode = require("./Raw").mode;

			var ATKEYWORD = TYPE.AtKeyword;
			var SEMICOLON = TYPE.Semicolon;
			var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;
			var RIGHTCURLYBRACKET = TYPE.RightCurlyBracket;

			function consumeRaw(startToken) {
				return this.Raw(startToken, rawMode.leftCurlyBracketOrSemicolon, true);
			}

			function isDeclarationBlockAtrule() {
				for (var offset = 1, type; type = this.scanner.lookupType(offset); offset++) {
					if (type === RIGHTCURLYBRACKET) {
						return true;
					}

					if (type === LEFTCURLYBRACKET ||
						type === ATKEYWORD) {
						return false;
					}
				}

				return false;
			}

			module.exports = {
				name: "Atrule",
				structure: {
					name: String,
					prelude: ["AtrulePrelude", "Raw", null],
					block: ["Block", null]
				},
				parse: function () {
					var start = this.scanner.tokenStart;
					var name;
					var nameLowerCase;
					var prelude = null;
					var block = null;

					this.eat(ATKEYWORD);

					name = this.scanner.substrToCursor(start + 1);
					nameLowerCase = name.toLowerCase();
					this.scanner.skipSC();

					// parse prelude
					if (this.scanner.eof === false &&
						this.scanner.tokenType !== LEFTCURLYBRACKET &&
						this.scanner.tokenType !== SEMICOLON) {
						if (this.parseAtrulePrelude) {
							prelude = this.parseWithFallback(this.AtrulePrelude.bind(this, name), consumeRaw);

							// turn empty AtrulePrelude into null
							if (prelude.type === "AtrulePrelude" && prelude.children.head === null) {
								prelude = null;
							}
						} else {
							prelude = consumeRaw.call(this, this.scanner.tokenIndex);
						}

						this.scanner.skipSC();
					}

					switch (this.scanner.tokenType) {
						case SEMICOLON:
							this.scanner.next();
							break;

						case LEFTCURLYBRACKET:
							if (this.atrule.hasOwnProperty(nameLowerCase) &&
								typeof this.atrule[nameLowerCase].block === "function") {
								block = this.atrule[nameLowerCase].block.call(this);
							} else {
								// TODO: should consume block content as Raw?
								block = this.Block(isDeclarationBlockAtrule.call(this));
							}

							break;
					}

					return {
						type: "Atrule",
						loc: this.getLocation(start, this.scanner.tokenStart),
						name: name,
						prelude: prelude,
						block: block
					};
				},
				generate: function (node) {
					this.chunk("@");
					this.chunk(node.name);

					if (node.prelude !== null) {
						this.chunk(" ");
						this.node(node.prelude);
					}

					if (node.block) {
						this.node(node.block);
					} else {
						this.chunk(";");
					}
				},
				walkContext: "atrule"
			};

		}, { "../../tokenizer": 107, "./Raw": 74 }], 47: [function (require, module, exports) {
			var TYPE = require("../../tokenizer").TYPE;

			var SEMICOLON = TYPE.Semicolon;
			var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;

			module.exports = {
				name: "AtrulePrelude",
				structure: {
					children: [[]]
				},
				parse: function (name) {
					var children = null;

					if (name !== null) {
						name = name.toLowerCase();
					}

					this.scanner.skipSC();

					if (this.atrule.hasOwnProperty(name) &&
						typeof this.atrule[name].prelude === "function") {
						// custom consumer
						children = this.atrule[name].prelude.call(this);
					} else {
						// default consumer
						children = this.readSequence(this.scope.AtrulePrelude);
					}

					this.scanner.skipSC();

					if (this.scanner.eof !== true &&
						this.scanner.tokenType !== LEFTCURLYBRACKET &&
						this.scanner.tokenType !== SEMICOLON) {
						this.error("Semicolon or block is expected");
					}

					if (children === null) {
						children = this.createList();
					}

					return {
						type: "AtrulePrelude",
						loc: this.getLocationFromList(children),
						children: children
					};
				},
				generate: function (node) {
					this.children(node);
				},
				walkContext: "atrulePrelude"
			};

		}, { "../../tokenizer": 107 }], 48: [function (require, module, exports) {
			var TYPE = require("../../tokenizer").TYPE;

			var IDENT = TYPE.Ident;
			var STRING = TYPE.String;
			var COLON = TYPE.Colon;
			var LEFTSQUAREBRACKET = TYPE.LeftSquareBracket;
			var RIGHTSQUAREBRACKET = TYPE.RightSquareBracket;
			var DOLLARSIGN = 0x0024;       // U+0024 DOLLAR SIGN ($)
			var ASTERISK = 0x002A;         // U+002A ASTERISK (*)
			var EQUALSSIGN = 0x003D;       // U+003D EQUALS SIGN (=)
			var CIRCUMFLEXACCENT = 0x005E; // U+005E (^)
			var VERTICALLINE = 0x007C;     // U+007C VERTICAL LINE (|)
			var TILDE = 0x007E;            // U+007E TILDE (~)

			function getAttributeName() {
				if (this.scanner.eof) {
					this.error("Unexpected end of input");
				}

				var start = this.scanner.tokenStart;
				var expectIdent = false;
				var checkColon = true;

				if (this.scanner.isDelim(ASTERISK)) {
					expectIdent = true;
					checkColon = false;
					this.scanner.next();
				} else if (!this.scanner.isDelim(VERTICALLINE)) {
					this.eat(IDENT);
				}

				if (this.scanner.isDelim(VERTICALLINE)) {
					if (this.scanner.source.charCodeAt(this.scanner.tokenStart + 1) !== EQUALSSIGN) {
						this.scanner.next();
						this.eat(IDENT);
					} else if (expectIdent) {
						this.error("Identifier is expected", this.scanner.tokenEnd);
					}
				} else if (expectIdent) {
					this.error("Vertical line is expected");
				}

				if (checkColon && this.scanner.tokenType === COLON) {
					this.scanner.next();
					this.eat(IDENT);
				}

				return {
					type: "Identifier",
					loc: this.getLocation(start, this.scanner.tokenStart),
					name: this.scanner.substrToCursor(start)
				};
			}

			function getOperator() {
				var start = this.scanner.tokenStart;
				var code = this.scanner.source.charCodeAt(start);

				if (code !== EQUALSSIGN &&        // =
					code !== TILDE &&             // ~=
					code !== CIRCUMFLEXACCENT &&  // ^=
					code !== DOLLARSIGN &&        // $=
					code !== ASTERISK &&          // *=
					code !== VERTICALLINE         // |=
				) {
					this.error("Attribute selector (=, ~=, ^=, $=, *=, |=) is expected");
				}

				this.scanner.next();

				if (code !== EQUALSSIGN) {
					if (!this.scanner.isDelim(EQUALSSIGN)) {
						this.error("Equal sign is expected");
					}

					this.scanner.next();
				}

				return this.scanner.substrToCursor(start);
			}

			// '[' <wq-name> ']'
			// '[' <wq-name> <attr-matcher> [ <string-token> | <ident-token> ] <attr-modifier>? ']'
			module.exports = {
				name: "AttributeSelector",
				structure: {
					name: "Identifier",
					matcher: [String, null],
					value: ["String", "Identifier", null],
					flags: [String, null]
				},
				parse: function () {
					var start = this.scanner.tokenStart;
					var name;
					var matcher = null;
					var value = null;
					var flags = null;

					this.eat(LEFTSQUAREBRACKET);
					this.scanner.skipSC();

					name = getAttributeName.call(this);
					this.scanner.skipSC();

					if (this.scanner.tokenType !== RIGHTSQUAREBRACKET) {
						// avoid case `[name i]`
						if (this.scanner.tokenType !== IDENT) {
							matcher = getOperator.call(this);

							this.scanner.skipSC();

							value = this.scanner.tokenType === STRING
								? this.String()
								: this.Identifier();

							this.scanner.skipSC();
						}

						// attribute flags
						if (this.scanner.tokenType === IDENT) {
							flags = this.scanner.getTokenValue();
							this.scanner.next();

							this.scanner.skipSC();
						}
					}

					this.eat(RIGHTSQUAREBRACKET);

					return {
						type: "AttributeSelector",
						loc: this.getLocation(start, this.scanner.tokenStart),
						name: name,
						matcher: matcher,
						value: value,
						flags: flags
					};
				},
				generate: function (node) {
					var flagsPrefix = " ";

					this.chunk("[");
					this.node(node.name);

					if (node.matcher !== null) {
						this.chunk(node.matcher);

						if (node.value !== null) {
							this.node(node.value);

							// space between string and flags is not required
							if (node.value.type === "String") {
								flagsPrefix = "";
							}
						}
					}

					if (node.flags !== null) {
						this.chunk(flagsPrefix);
						this.chunk(node.flags);
					}

					this.chunk("]");
				}
			};

		}, { "../../tokenizer": 107 }], 49: [function (require, module, exports) {
			var TYPE = require("../../tokenizer").TYPE;
			var rawMode = require("./Raw").mode;

			var WHITESPACE = TYPE.WhiteSpace;
			var COMMENT = TYPE.Comment;
			var SEMICOLON = TYPE.Semicolon;
			var ATKEYWORD = TYPE.AtKeyword;
			var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;
			var RIGHTCURLYBRACKET = TYPE.RightCurlyBracket;

			function consumeRaw(startToken) {
				return this.Raw(startToken, null, true);
			}
			function consumeRule() {
				return this.parseWithFallback(this.Rule, consumeRaw);
			}
			function consumeRawDeclaration(startToken) {
				return this.Raw(startToken, rawMode.semicolonIncluded, true);
			}
			function consumeDeclaration() {
				if (this.scanner.tokenType === SEMICOLON) {
					return consumeRawDeclaration.call(this, this.scanner.tokenIndex);
				}

				var node = this.parseWithFallback(this.Declaration, consumeRawDeclaration);

				if (this.scanner.tokenType === SEMICOLON) {
					this.scanner.next();
				}

				return node;
			}

			module.exports = {
				name: "Block",
				structure: {
					children: [[
						"Atrule",
						"Rule",
						"Declaration"
					]]
				},
				parse: function (isDeclaration) {
					var consumer = isDeclaration ? consumeDeclaration : consumeRule;

					var start = this.scanner.tokenStart;
					var children = this.createList();

					this.eat(LEFTCURLYBRACKET);

					scan:
					while (!this.scanner.eof) {
						switch (this.scanner.tokenType) {
							case RIGHTCURLYBRACKET:
								break scan;

							case WHITESPACE:
							case COMMENT:
								this.scanner.next();
								break;

							case ATKEYWORD:
								children.push(this.parseWithFallback(this.Atrule, consumeRaw));
								break;

							default:
								children.push(consumer.call(this));
						}
					}

					if (!this.scanner.eof) {
						this.eat(RIGHTCURLYBRACKET);
					}

					return {
						type: "Block",
						loc: this.getLocation(start, this.scanner.tokenStart),
						children: children
					};
				},
				generate: function (node) {
					this.chunk("{");
					this.children(node, function (prev) {
						if (prev.type === "Declaration") {
							this.chunk(";");
						}
					});
					this.chunk("}");
				},
				walkContext: "block"
			};

		}, { "../../tokenizer": 107, "./Raw": 74 }], 50: [function (require, module, exports) {
			var TYPE = require("../../tokenizer").TYPE;

			var LEFTSQUAREBRACKET = TYPE.LeftSquareBracket;
			var RIGHTSQUAREBRACKET = TYPE.RightSquareBracket;

			module.exports = {
				name: "Brackets",
				structure: {
					children: [[]]
				},
				parse: function (readSequence, recognizer) {
					var start = this.scanner.tokenStart;
					var children = null;

					this.eat(LEFTSQUAREBRACKET);

					children = readSequence.call(this, recognizer);

					if (!this.scanner.eof) {
						this.eat(RIGHTSQUAREBRACKET);
					}

					return {
						type: "Brackets",
						loc: this.getLocation(start, this.scanner.tokenStart),
						children: children
					};
				},
				generate: function (node) {
					this.chunk("[");
					this.children(node);
					this.chunk("]");
				}
			};

		}, { "../../tokenizer": 107 }], 51: [function (require, module, exports) {
			var CDC = require("../../tokenizer").TYPE.CDC;

			module.exports = {
				name: "CDC",
				structure: [],
				parse: function () {
					var start = this.scanner.tokenStart;

					this.eat(CDC); // -->

					return {
						type: "CDC",
						loc: this.getLocation(start, this.scanner.tokenStart)
					};
				},
				generate: function () {
					this.chunk("-->");
				}
			};

		}, { "../../tokenizer": 107 }], 52: [function (require, module, exports) {
			var CDO = require("../../tokenizer").TYPE.CDO;

			module.exports = {
				name: "CDO",
				structure: [],
				parse: function () {
					var start = this.scanner.tokenStart;

					this.eat(CDO); // <!--

					return {
						type: "CDO",
						loc: this.getLocation(start, this.scanner.tokenStart)
					};
				},
				generate: function () {
					this.chunk("<!--");
				}
			};

		}, { "../../tokenizer": 107 }], 53: [function (require, module, exports) {
			var TYPE = require("../../tokenizer").TYPE;

			var IDENT = TYPE.Ident;
			var FULLSTOP = 0x002E; // U+002E FULL STOP (.)

			// '.' ident
			module.exports = {
				name: "ClassSelector",
				structure: {
					name: String
				},
				parse: function () {
					if (!this.scanner.isDelim(FULLSTOP)) {
						this.error("Full stop is expected");
					}

					this.scanner.next();

					return {
						type: "ClassSelector",
						loc: this.getLocation(this.scanner.tokenStart - 1, this.scanner.tokenEnd),
						name: this.consume(IDENT)
					};
				},
				generate: function (node) {
					this.chunk(".");
					this.chunk(node.name);
				}
			};

		}, { "../../tokenizer": 107 }], 54: [function (require, module, exports) {
			var TYPE = require("../../tokenizer").TYPE;

			var IDENT = TYPE.Ident;
			var PLUSSIGN = 0x002B;        // U+002B PLUS SIGN (+)
			var SOLIDUS = 0x002F;         // U+002F SOLIDUS (/)
			var GREATERTHANSIGN = 0x003E; // U+003E GREATER-THAN SIGN (>)
			var TILDE = 0x007E;           // U+007E TILDE (~)

			// + | > | ~ | /deep/
			module.exports = {
				name: "Combinator",
				structure: {
					name: String
				},
				parse: function () {
					var start = this.scanner.tokenStart;
					var code = this.scanner.source.charCodeAt(this.scanner.tokenStart);

					switch (code) {
						case GREATERTHANSIGN:
						case PLUSSIGN:
						case TILDE:
							this.scanner.next();
							break;

						case SOLIDUS:
							this.scanner.next();

							if (this.scanner.tokenType !== IDENT || this.scanner.lookupValue(0, "deep") === false) {
								this.error("Identifier `deep` is expected");
							}

							this.scanner.next();

							if (!this.scanner.isDelim(SOLIDUS)) {
								this.error("Solidus is expected");
							}

							this.scanner.next();
							break;

						default:
							this.error("Combinator is expected");
					}

					return {
						type: "Combinator",
						loc: this.getLocation(start, this.scanner.tokenStart),
						name: this.scanner.substrToCursor(start)
					};
				},
				generate: function (node) {
					this.chunk(node.name);
				}
			};

		}, { "../../tokenizer": 107 }], 55: [function (require, module, exports) {
			var TYPE = require("../../tokenizer").TYPE;

			var COMMENT = TYPE.Comment;
			var ASTERISK = 0x002A;        // U+002A ASTERISK (*)
			var SOLIDUS = 0x002F;         // U+002F SOLIDUS (/)

			// '/*' .* '*/'
			module.exports = {
				name: "Comment",
				structure: {
					value: String
				},
				parse: function () {
					var start = this.scanner.tokenStart;
					var end = this.scanner.tokenEnd;

					this.eat(COMMENT);

					if ((end - start + 2) >= 2 &&
						this.scanner.source.charCodeAt(end - 2) === ASTERISK &&
						this.scanner.source.charCodeAt(end - 1) === SOLIDUS) {
						end -= 2;
					}

					return {
						type: "Comment",
						loc: this.getLocation(start, this.scanner.tokenStart),
						value: this.scanner.source.substring(start + 2, end)
					};
				},
				generate: function (node) {
					this.chunk("/*");
					this.chunk(node.value);
					this.chunk("*/");
				}
			};

		}, { "../../tokenizer": 107 }], 56: [function (require, module, exports) {
			var isCustomProperty = require("../../utils/names").isCustomProperty;
			var TYPE = require("../../tokenizer").TYPE;
			var rawMode = require("./Raw").mode;

			var IDENT = TYPE.Ident;
			var HASH = TYPE.Hash;
			var COLON = TYPE.Colon;
			var SEMICOLON = TYPE.Semicolon;
			var DELIM = TYPE.Delim;
			var EXCLAMATIONMARK = 0x0021; // U+0021 EXCLAMATION MARK (!)
			var NUMBERSIGN = 0x0023;      // U+0023 NUMBER SIGN (#)
			var DOLLARSIGN = 0x0024;      // U+0024 DOLLAR SIGN ($)
			var AMPERSAND = 0x0026;       // U+0026 ANPERSAND (&)
			var ASTERISK = 0x002A;        // U+002A ASTERISK (*)
			var PLUSSIGN = 0x002B;        // U+002B PLUS SIGN (+)
			var SOLIDUS = 0x002F;         // U+002F SOLIDUS (/)

			function consumeValueRaw(startToken) {
				return this.Raw(startToken, rawMode.exclamationMarkOrSemicolon, true);
			}

			function consumeCustomPropertyRaw(startToken) {
				return this.Raw(startToken, rawMode.exclamationMarkOrSemicolon, false);
			}

			function consumeValue() {
				var startValueToken = this.scanner.tokenIndex;
				var value = this.Value();

				if (value.type !== "Raw" &&
					this.scanner.eof === false &&
					this.scanner.tokenType !== SEMICOLON &&
					this.scanner.isDelim(EXCLAMATIONMARK) === false &&
					this.scanner.isBalanceEdge(startValueToken) === false) {
					this.error();
				}

				return value;
			}

			module.exports = {
				name: "Declaration",
				structure: {
					important: [Boolean, String],
					property: String,
					value: ["Value", "Raw"]
				},
				parse: function () {
					var start = this.scanner.tokenStart;
					var startToken = this.scanner.tokenIndex;
					var property = readProperty.call(this);
					var customProperty = isCustomProperty(property);
					var parseValue = customProperty ? this.parseCustomProperty : this.parseValue;
					var consumeRaw = customProperty ? consumeCustomPropertyRaw : consumeValueRaw;
					var important = false;
					var value;

					this.scanner.skipSC();
					this.eat(COLON);

					if (!customProperty) {
						this.scanner.skipSC();
					}

					if (parseValue) {
						value = this.parseWithFallback(consumeValue, consumeRaw);
					} else {
						value = consumeRaw.call(this, this.scanner.tokenIndex);
					}

					if (this.scanner.isDelim(EXCLAMATIONMARK)) {
						important = getImportant.call(this);
						this.scanner.skipSC();
					}

					// Do not include semicolon to range per spec
					// https://drafts.csswg.org/css-syntax/#declaration-diagram

					if (this.scanner.eof === false &&
						this.scanner.tokenType !== SEMICOLON &&
						this.scanner.isBalanceEdge(startToken) === false) {
						this.error();
					}

					return {
						type: "Declaration",
						loc: this.getLocation(start, this.scanner.tokenStart),
						important: important,
						property: property,
						value: value
					};
				},
				generate: function (node) {
					this.chunk(node.property);
					this.chunk(":");
					this.node(node.value);

					if (node.important) {
						this.chunk(node.important === true ? "!important" : "!" + node.important);
					}
				},
				walkContext: "declaration"
			};

			function readProperty() {
				var start = this.scanner.tokenStart;
				var prefix = 0;

				// hacks
				if (this.scanner.tokenType === DELIM) {
					switch (this.scanner.source.charCodeAt(this.scanner.tokenStart)) {
						case ASTERISK:
						case DOLLARSIGN:
						case PLUSSIGN:
						case NUMBERSIGN:
						case AMPERSAND:
							this.scanner.next();
							break;

						// TODO: not sure we should support this hack
						case SOLIDUS:
							this.scanner.next();
							if (this.scanner.isDelim(SOLIDUS)) {
								this.scanner.next();
							}
							break;
					}
				}

				if (prefix) {
					this.scanner.skip(prefix);
				}

				if (this.scanner.tokenType === HASH) {
					this.eat(HASH);
				} else {
					this.eat(IDENT);
				}

				return this.scanner.substrToCursor(start);
			}

			// ! ws* important
			function getImportant() {
				this.eat(DELIM);
				this.scanner.skipSC();

				var important = this.consume(IDENT);

				// store original value in case it differ from `important`
				// for better original source restoring and hacks like `!ie` support
				return important === "important" ? true : important;
			}

		}, { "../../tokenizer": 107, "../../utils/names": 111, "./Raw": 74 }], 57: [function (require, module, exports) {
			var TYPE = require("../../tokenizer").TYPE;
			var rawMode = require("./Raw").mode;

			var WHITESPACE = TYPE.WhiteSpace;
			var COMMENT = TYPE.Comment;
			var SEMICOLON = TYPE.Semicolon;

			function consumeRaw(startToken) {
				return this.Raw(startToken, rawMode.semicolonIncluded, true);
			}

			module.exports = {
				name: "DeclarationList",
				structure: {
					children: [[
						"Declaration"
					]]
				},
				parse: function () {
					var children = this.createList();

					while (!this.scanner.eof) {
						switch (this.scanner.tokenType) {
							case WHITESPACE:
							case COMMENT:
							case SEMICOLON:
								this.scanner.next();
								break;

							default:
								children.push(this.parseWithFallback(this.Declaration, consumeRaw));
						}
					}

					return {
						type: "DeclarationList",
						loc: this.getLocationFromList(children),
						children: children
					};
				},
				generate: function (node) {
					this.children(node, function (prev) {
						if (prev.type === "Declaration") {
							this.chunk(";");
						}
					});
				}
			};

		}, { "../../tokenizer": 107, "./Raw": 74 }], 58: [function (require, module, exports) {
			var consumeNumber = require("../../tokenizer/utils").consumeNumber;
			var TYPE = require("../../tokenizer").TYPE;

			var DIMENSION = TYPE.Dimension;

			module.exports = {
				name: "Dimension",
				structure: {
					value: String,
					unit: String
				},
				parse: function () {
					var start = this.scanner.tokenStart;
					var numberEnd = consumeNumber(this.scanner.source, start);

					this.eat(DIMENSION);

					return {
						type: "Dimension",
						loc: this.getLocation(start, this.scanner.tokenStart),
						value: this.scanner.source.substring(start, numberEnd),
						unit: this.scanner.source.substring(numberEnd, this.scanner.tokenStart)
					};
				},
				generate: function (node) {
					this.chunk(node.value);
					this.chunk(node.unit);
				}
			};

		}, { "../../tokenizer": 107, "../../tokenizer/utils": 108 }], 59: [function (require, module, exports) {
			var TYPE = require("../../tokenizer").TYPE;

			var RIGHTPARENTHESIS = TYPE.RightParenthesis;

			// <function-token> <sequence> )
			module.exports = {
				name: "Function",
				structure: {
					name: String,
					children: [[]]
				},
				parse: function (readSequence, recognizer) {
					var start = this.scanner.tokenStart;
					var name = this.consumeFunctionName();
					var nameLowerCase = name.toLowerCase();
					var children;

					children = recognizer.hasOwnProperty(nameLowerCase)
						? recognizer[nameLowerCase].call(this, recognizer)
						: readSequence.call(this, recognizer);

					if (!this.scanner.eof) {
						this.eat(RIGHTPARENTHESIS);
					}

					return {
						type: "Function",
						loc: this.getLocation(start, this.scanner.tokenStart),
						name: name,
						children: children
					};
				},
				generate: function (node) {
					this.chunk(node.name);
					this.chunk("(");
					this.children(node);
					this.chunk(")");
				},
				walkContext: "function"
			};

		}, { "../../tokenizer": 107 }], 60: [function (require, module, exports) {
			var TYPE = require("../../tokenizer").TYPE;

			var HASH = TYPE.Hash;

			// '#' ident
			module.exports = {
				name: "HexColor",
				structure: {
					value: String
				},
				parse: function () {
					var start = this.scanner.tokenStart;

					this.eat(HASH);

					return {
						type: "HexColor",
						loc: this.getLocation(start, this.scanner.tokenStart),
						value: this.scanner.substrToCursor(start + 1)
					};
				},
				generate: function (node) {
					this.chunk("#");
					this.chunk(node.value);
				}
			};

		}, { "../../tokenizer": 107 }], 61: [function (require, module, exports) {
			var TYPE = require("../../tokenizer").TYPE;

			var HASH = TYPE.Hash;

			// <hash-token>
			module.exports = {
				name: "IdSelector",
				structure: {
					name: String
				},
				parse: function () {
					var start = this.scanner.tokenStart;

					// TODO: check value is an ident
					this.eat(HASH);

					return {
						type: "IdSelector",
						loc: this.getLocation(start, this.scanner.tokenStart),
						name: this.scanner.substrToCursor(start + 1)
					};
				},
				generate: function (node) {
					this.chunk("#");
					this.chunk(node.name);
				}
			};

		}, { "../../tokenizer": 107 }], 62: [function (require, module, exports) {
			var TYPE = require("../../tokenizer").TYPE;

			var IDENT = TYPE.Ident;

			module.exports = {
				name: "Identifier",
				structure: {
					name: String
				},
				parse: function () {
					return {
						type: "Identifier",
						loc: this.getLocation(this.scanner.tokenStart, this.scanner.tokenEnd),
						name: this.consume(IDENT)
					};
				},
				generate: function (node) {
					this.chunk(node.name);
				}
			};

		}, { "../../tokenizer": 107 }], 63: [function (require, module, exports) {
			var TYPE = require("../../tokenizer").TYPE;

			var IDENT = TYPE.Ident;
			var NUMBER = TYPE.Number;
			var DIMENSION = TYPE.Dimension;
			var LEFTPARENTHESIS = TYPE.LeftParenthesis;
			var RIGHTPARENTHESIS = TYPE.RightParenthesis;
			var COLON = TYPE.Colon;
			var DELIM = TYPE.Delim;

			module.exports = {
				name: "MediaFeature",
				structure: {
					name: String,
					value: ["Identifier", "Number", "Dimension", "Ratio", null]
				},
				parse: function () {
					var start = this.scanner.tokenStart;
					var name;
					var value = null;

					this.eat(LEFTPARENTHESIS);
					this.scanner.skipSC();

					name = this.consume(IDENT);
					this.scanner.skipSC();

					if (this.scanner.tokenType !== RIGHTPARENTHESIS) {
						this.eat(COLON);
						this.scanner.skipSC();

						switch (this.scanner.tokenType) {
							case NUMBER:
								if (this.lookupNonWSType(1) === DELIM) {
									value = this.Ratio();
								} else {
									value = this.Number();
								}

								break;

							case DIMENSION:
								value = this.Dimension();
								break;

							case IDENT:
								value = this.Identifier();

								break;

							default:
								this.error("Number, dimension, ratio or identifier is expected");
						}

						this.scanner.skipSC();
					}

					this.eat(RIGHTPARENTHESIS);

					return {
						type: "MediaFeature",
						loc: this.getLocation(start, this.scanner.tokenStart),
						name: name,
						value: value
					};
				},
				generate: function (node) {
					this.chunk("(");
					this.chunk(node.name);
					if (node.value !== null) {
						this.chunk(":");
						this.node(node.value);
					}
					this.chunk(")");
				}
			};

		}, { "../../tokenizer": 107 }], 64: [function (require, module, exports) {
			var TYPE = require("../../tokenizer").TYPE;

			var WHITESPACE = TYPE.WhiteSpace;
			var COMMENT = TYPE.Comment;
			var IDENT = TYPE.Ident;
			var LEFTPARENTHESIS = TYPE.LeftParenthesis;

			module.exports = {
				name: "MediaQuery",
				structure: {
					children: [[
						"Identifier",
						"MediaFeature",
						"WhiteSpace"
					]]
				},
				parse: function () {
					this.scanner.skipSC();

					var children = this.createList();
					var child = null;
					var space = null;

					scan:
					while (!this.scanner.eof) {
						switch (this.scanner.tokenType) {
							case COMMENT:
								this.scanner.next();
								continue;

							case WHITESPACE:
								space = this.WhiteSpace();
								continue;

							case IDENT:
								child = this.Identifier();
								break;

							case LEFTPARENTHESIS:
								child = this.MediaFeature();
								break;

							default:
								break scan;
						}

						if (space !== null) {
							children.push(space);
							space = null;
						}

						children.push(child);
					}

					if (child === null) {
						this.error("Identifier or parenthesis is expected");
					}

					return {
						type: "MediaQuery",
						loc: this.getLocationFromList(children),
						children: children
					};
				},
				generate: function (node) {
					this.children(node);
				}
			};

		}, { "../../tokenizer": 107 }], 65: [function (require, module, exports) {
			var COMMA = require("../../tokenizer").TYPE.Comma;

			module.exports = {
				name: "MediaQueryList",
				structure: {
					children: [[
						"MediaQuery"
					]]
				},
				parse: function (relative) {
					var children = this.createList();

					this.scanner.skipSC();

					while (!this.scanner.eof) {
						children.push(this.MediaQuery(relative));

						if (this.scanner.tokenType !== COMMA) {
							break;
						}

						this.scanner.next();
					}

					return {
						type: "MediaQueryList",
						loc: this.getLocationFromList(children),
						children: children
					};
				},
				generate: function (node) {
					this.children(node, function () {
						this.chunk(",");
					});
				}
			};

		}, { "../../tokenizer": 107 }], 66: [function (require, module, exports) {
			module.exports = {
				name: "Nth",
				structure: {
					nth: ["AnPlusB", "Identifier"],
					selector: ["SelectorList", null]
				},
				parse: function (allowOfClause) {
					this.scanner.skipSC();

					var start = this.scanner.tokenStart;
					var end = start;
					var selector = null;
					var query;

					if (this.scanner.lookupValue(0, "odd") || this.scanner.lookupValue(0, "even")) {
						query = this.Identifier();
					} else {
						query = this.AnPlusB();
					}

					this.scanner.skipSC();

					if (allowOfClause && this.scanner.lookupValue(0, "of")) {
						this.scanner.next();

						selector = this.SelectorList();

						if (this.needPositions) {
							end = this.getLastListNode(selector.children).loc.end.offset;
						}
					} else {
						if (this.needPositions) {
							end = query.loc.end.offset;
						}
					}

					return {
						type: "Nth",
						loc: this.getLocation(start, end),
						nth: query,
						selector: selector
					};
				},
				generate: function (node) {
					this.node(node.nth);
					if (node.selector !== null) {
						this.chunk(" of ");
						this.node(node.selector);
					}
				}
			};

		}, {}], 67: [function (require, module, exports) {
			var NUMBER = require("../../tokenizer").TYPE.Number;

			module.exports = {
				name: "Number",
				structure: {
					value: String
				},
				parse: function () {
					return {
						type: "Number",
						loc: this.getLocation(this.scanner.tokenStart, this.scanner.tokenEnd),
						value: this.consume(NUMBER)
					};
				},
				generate: function (node) {
					this.chunk(node.value);
				}
			};

		}, { "../../tokenizer": 107 }], 68: [function (require, module, exports) {
			// '/' | '*' | ',' | ':' | '+' | '-'
			module.exports = {
				name: "Operator",
				structure: {
					value: String
				},
				parse: function () {
					var start = this.scanner.tokenStart;

					this.scanner.next();

					return {
						type: "Operator",
						loc: this.getLocation(start, this.scanner.tokenStart),
						value: this.scanner.substrToCursor(start)
					};
				},
				generate: function (node) {
					this.chunk(node.value);
				}
			};

		}, {}], 69: [function (require, module, exports) {
			var TYPE = require("../../tokenizer").TYPE;

			var LEFTPARENTHESIS = TYPE.LeftParenthesis;
			var RIGHTPARENTHESIS = TYPE.RightParenthesis;

			module.exports = {
				name: "Parentheses",
				structure: {
					children: [[]]
				},
				parse: function (readSequence, recognizer) {
					var start = this.scanner.tokenStart;
					var children = null;

					this.eat(LEFTPARENTHESIS);

					children = readSequence.call(this, recognizer);

					if (!this.scanner.eof) {
						this.eat(RIGHTPARENTHESIS);
					}

					return {
						type: "Parentheses",
						loc: this.getLocation(start, this.scanner.tokenStart),
						children: children
					};
				},
				generate: function (node) {
					this.chunk("(");
					this.children(node);
					this.chunk(")");
				}
			};

		}, { "../../tokenizer": 107 }], 70: [function (require, module, exports) {
			var consumeNumber = require("../../tokenizer/utils").consumeNumber;
			var TYPE = require("../../tokenizer").TYPE;

			var PERCENTAGE = TYPE.Percentage;

			module.exports = {
				name: "Percentage",
				structure: {
					value: String
				},
				parse: function () {
					var start = this.scanner.tokenStart;
					var numberEnd = consumeNumber(this.scanner.source, start);

					this.eat(PERCENTAGE);

					return {
						type: "Percentage",
						loc: this.getLocation(start, this.scanner.tokenStart),
						value: this.scanner.source.substring(start, numberEnd)
					};
				},
				generate: function (node) {
					this.chunk(node.value);
					this.chunk("%");
				}
			};

		}, { "../../tokenizer": 107, "../../tokenizer/utils": 108 }], 71: [function (require, module, exports) {
			var TYPE = require("../../tokenizer").TYPE;

			var IDENT = TYPE.Ident;
			var FUNCTION = TYPE.Function;
			var COLON = TYPE.Colon;
			var RIGHTPARENTHESIS = TYPE.RightParenthesis;

			// : [ <ident> | <function-token> <any-value>? ) ]
			module.exports = {
				name: "PseudoClassSelector",
				structure: {
					name: String,
					children: [["Raw"], null]
				},
				parse: function () {
					var start = this.scanner.tokenStart;
					var children = null;
					var name;
					var nameLowerCase;

					this.eat(COLON);

					if (this.scanner.tokenType === FUNCTION) {
						name = this.consumeFunctionName();
						nameLowerCase = name.toLowerCase();

						if (this.pseudo.hasOwnProperty(nameLowerCase)) {
							this.scanner.skipSC();
							children = this.pseudo[nameLowerCase].call(this);
							this.scanner.skipSC();
						} else {
							children = this.createList();
							children.push(
								this.Raw(this.scanner.tokenIndex, null, false)
							);
						}

						this.eat(RIGHTPARENTHESIS);
					} else {
						name = this.consume(IDENT);
					}

					return {
						type: "PseudoClassSelector",
						loc: this.getLocation(start, this.scanner.tokenStart),
						name: name,
						children: children
					};
				},
				generate: function (node) {
					this.chunk(":");
					this.chunk(node.name);

					if (node.children !== null) {
						this.chunk("(");
						this.children(node);
						this.chunk(")");
					}
				},
				walkContext: "function"
			};

		}, { "../../tokenizer": 107 }], 72: [function (require, module, exports) {
			var TYPE = require("../../tokenizer").TYPE;

			var IDENT = TYPE.Ident;
			var FUNCTION = TYPE.Function;
			var COLON = TYPE.Colon;
			var RIGHTPARENTHESIS = TYPE.RightParenthesis;

			// :: [ <ident> | <function-token> <any-value>? ) ]
			module.exports = {
				name: "PseudoElementSelector",
				structure: {
					name: String,
					children: [["Raw"], null]
				},
				parse: function () {
					var start = this.scanner.tokenStart;
					var children = null;
					var name;
					var nameLowerCase;

					this.eat(COLON);
					this.eat(COLON);

					if (this.scanner.tokenType === FUNCTION) {
						name = this.consumeFunctionName();
						nameLowerCase = name.toLowerCase();

						if (this.pseudo.hasOwnProperty(nameLowerCase)) {
							this.scanner.skipSC();
							children = this.pseudo[nameLowerCase].call(this);
							this.scanner.skipSC();
						} else {
							children = this.createList();
							children.push(
								this.Raw(this.scanner.tokenIndex, null, false)
							);
						}

						this.eat(RIGHTPARENTHESIS);
					} else {
						name = this.consume(IDENT);
					}

					return {
						type: "PseudoElementSelector",
						loc: this.getLocation(start, this.scanner.tokenStart),
						name: name,
						children: children
					};
				},
				generate: function (node) {
					this.chunk("::");
					this.chunk(node.name);

					if (node.children !== null) {
						this.chunk("(");
						this.children(node);
						this.chunk(")");
					}
				},
				walkContext: "function"
			};

		}, { "../../tokenizer": 107 }], 73: [function (require, module, exports) {
			var isDigit = require("../../tokenizer").isDigit;
			var TYPE = require("../../tokenizer").TYPE;

			var NUMBER = TYPE.Number;
			var DELIM = TYPE.Delim;
			var SOLIDUS = 0x002F;  // U+002F SOLIDUS (/)
			var FULLSTOP = 0x002E; // U+002E FULL STOP (.)

			// Terms of <ratio> should be a positive numbers (not zero or negative)
			// (see https://drafts.csswg.org/mediaqueries-3/#values)
			// However, -o-min-device-pixel-ratio takes fractional values as a ratio's term
			// and this is using by various sites. Therefore we relax checking on parse
			// to test a term is unsigned number without an exponent part.
			// Additional checking may be applied on lexer validation.
			function consumeNumber() {
				this.scanner.skipWS();

				var value = this.consume(NUMBER);

				for (var i = 0; i < value.length; i++) {
					var code = value.charCodeAt(i);
					if (!isDigit(code) && code !== FULLSTOP) {
						this.error("Unsigned number is expected", this.scanner.tokenStart - value.length + i);
					}
				}

				if (Number(value) === 0) {
					this.error("Zero number is not allowed", this.scanner.tokenStart - value.length);
				}

				return value;
			}

			// <positive-integer> S* '/' S* <positive-integer>
			module.exports = {
				name: "Ratio",
				structure: {
					left: String,
					right: String
				},
				parse: function () {
					var start = this.scanner.tokenStart;
					var left = consumeNumber.call(this);
					var right;

					this.scanner.skipWS();

					if (!this.scanner.isDelim(SOLIDUS)) {
						this.error("Solidus is expected");
					}
					this.eat(DELIM);
					right = consumeNumber.call(this);

					return {
						type: "Ratio",
						loc: this.getLocation(start, this.scanner.tokenStart),
						left: left,
						right: right
					};
				},
				generate: function (node) {
					this.chunk(node.left);
					this.chunk("/");
					this.chunk(node.right);
				}
			};

		}, { "../../tokenizer": 107 }], 74: [function (require, module, exports) {
			var tokenizer = require("../../tokenizer");
			var TYPE = tokenizer.TYPE;

			var WhiteSpace = TYPE.WhiteSpace;
			var Semicolon = TYPE.Semicolon;
			var LeftCurlyBracket = TYPE.LeftCurlyBracket;
			var Delim = TYPE.Delim;
			var EXCLAMATIONMARK = 0x0021; // U+0021 EXCLAMATION MARK (!)

			function getOffsetExcludeWS() {
				if (this.scanner.tokenIndex > 0) {
					if (this.scanner.lookupType(-1) === WhiteSpace) {
						return this.scanner.tokenIndex > 1
							? this.scanner.getTokenStart(this.scanner.tokenIndex - 1)
							: this.scanner.firstCharOffset;
					}
				}

				return this.scanner.tokenStart;
			}

			// 0, 0, false
			function balanceEnd() {
				return 0;
			}

			// LEFTCURLYBRACKET, 0, false
			function leftCurlyBracket(tokenType) {
				return tokenType === LeftCurlyBracket ? 1 : 0;
			}

			// LEFTCURLYBRACKET, SEMICOLON, false
			function leftCurlyBracketOrSemicolon(tokenType) {
				return tokenType === LeftCurlyBracket || tokenType === Semicolon ? 1 : 0;
			}

			// EXCLAMATIONMARK, SEMICOLON, false
			function exclamationMarkOrSemicolon(tokenType, source, offset) {
				if (tokenType === Delim && source.charCodeAt(offset) === EXCLAMATIONMARK) {
					return 1;
				}

				return tokenType === Semicolon ? 1 : 0;
			}

			// 0, SEMICOLON, true
			function semicolonIncluded(tokenType) {
				return tokenType === Semicolon ? 2 : 0;
			}

			module.exports = {
				name: "Raw",
				structure: {
					value: String
				},
				parse: function (startToken, mode, excludeWhiteSpace) {
					var startOffset = this.scanner.getTokenStart(startToken);
					var endOffset;

					this.scanner.skip(
						this.scanner.getRawLength(startToken, mode || balanceEnd)
					);

					if (excludeWhiteSpace && this.scanner.tokenStart > startOffset) {
						endOffset = getOffsetExcludeWS.call(this);
					} else {
						endOffset = this.scanner.tokenStart;
					}

					return {
						type: "Raw",
						loc: this.getLocation(startOffset, endOffset),
						value: this.scanner.source.substring(startOffset, endOffset)
					};
				},
				generate: function (node) {
					this.chunk(node.value);
				},

				mode: {
					default: balanceEnd,
					leftCurlyBracket: leftCurlyBracket,
					leftCurlyBracketOrSemicolon: leftCurlyBracketOrSemicolon,
					exclamationMarkOrSemicolon: exclamationMarkOrSemicolon,
					semicolonIncluded: semicolonIncluded
				}
			};

		}, { "../../tokenizer": 107 }], 75: [function (require, module, exports) {
			var TYPE = require("../../tokenizer").TYPE;
			var rawMode = require("./Raw").mode;

			var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;

			function consumeRaw(startToken) {
				return this.Raw(startToken, rawMode.leftCurlyBracket, true);
			}

			function consumePrelude() {
				var prelude = this.SelectorList();

				if (prelude.type !== "Raw" &&
					this.scanner.eof === false &&
					this.scanner.tokenType !== LEFTCURLYBRACKET) {
					this.error();
				}

				return prelude;
			}

			module.exports = {
				name: "Rule",
				structure: {
					prelude: ["SelectorList", "Raw"],
					block: ["Block"]
				},
				parse: function () {
					var startToken = this.scanner.tokenIndex;
					var startOffset = this.scanner.tokenStart;
					var prelude;
					var block;

					if (this.parseRulePrelude) {
						prelude = this.parseWithFallback(consumePrelude, consumeRaw);
					} else {
						prelude = consumeRaw.call(this, startToken);
					}

					block = this.Block(true);

					return {
						type: "Rule",
						loc: this.getLocation(startOffset, this.scanner.tokenStart),
						prelude: prelude,
						block: block
					};
				},
				generate: function (node) {
					this.node(node.prelude);
					this.node(node.block);
				},
				walkContext: "rule"
			};

		}, { "../../tokenizer": 107, "./Raw": 74 }], 76: [function (require, module, exports) {
			module.exports = {
				name: "Selector",
				structure: {
					children: [[
						"TypeSelector",
						"IdSelector",
						"ClassSelector",
						"AttributeSelector",
						"PseudoClassSelector",
						"PseudoElementSelector",
						"Combinator",
						"WhiteSpace"
					]]
				},
				parse: function () {
					var children = this.readSequence(this.scope.Selector);

					// nothing were consumed
					if (this.getFirstListNode(children) === null) {
						this.error("Selector is expected");
					}

					return {
						type: "Selector",
						loc: this.getLocationFromList(children),
						children: children
					};
				},
				generate: function (node) {
					this.children(node);
				}
			};

		}, {}], 77: [function (require, module, exports) {
			var TYPE = require("../../tokenizer").TYPE;

			var COMMA = TYPE.Comma;

			module.exports = {
				name: "SelectorList",
				structure: {
					children: [[
						"Selector",
						"Raw"
					]]
				},
				parse: function () {
					var children = this.createList();

					while (!this.scanner.eof) {
						children.push(this.Selector());

						if (this.scanner.tokenType === COMMA) {
							this.scanner.next();
							continue;
						}

						break;
					}

					return {
						type: "SelectorList",
						loc: this.getLocationFromList(children),
						children: children
					};
				},
				generate: function (node) {
					this.children(node, function () {
						this.chunk(",");
					});
				},
				walkContext: "selector"
			};

		}, { "../../tokenizer": 107 }], 78: [function (require, module, exports) {
			var STRING = require("../../tokenizer").TYPE.String;

			module.exports = {
				name: "String",
				structure: {
					value: String
				},
				parse: function () {
					return {
						type: "String",
						loc: this.getLocation(this.scanner.tokenStart, this.scanner.tokenEnd),
						value: this.consume(STRING)
					};
				},
				generate: function (node) {
					this.chunk(node.value);
				}
			};

		}, { "../../tokenizer": 107 }], 79: [function (require, module, exports) {
			var TYPE = require("../../tokenizer").TYPE;

			var WHITESPACE = TYPE.WhiteSpace;
			var COMMENT = TYPE.Comment;
			var ATKEYWORD = TYPE.AtKeyword;
			var CDO = TYPE.CDO;
			var CDC = TYPE.CDC;
			var EXCLAMATIONMARK = 0x0021; // U+0021 EXCLAMATION MARK (!)

			function consumeRaw(startToken) {
				return this.Raw(startToken, null, false);
			}

			module.exports = {
				name: "StyleSheet",
				structure: {
					children: [[
						"Comment",
						"CDO",
						"CDC",
						"Atrule",
						"Rule",
						"Raw"
					]]
				},
				parse: function () {
					var start = this.scanner.tokenStart;
					var children = this.createList();
					var child;

					while (!this.scanner.eof) {
						switch (this.scanner.tokenType) {
							case WHITESPACE:
								this.scanner.next();
								continue;

							case COMMENT:
								// ignore comments except exclamation comments (i.e. /*! .. */) on top level
								if (this.scanner.source.charCodeAt(this.scanner.tokenStart + 2) !== EXCLAMATIONMARK) {
									this.scanner.next();
									continue;
								}

								child = this.Comment();
								break;

							case CDO: // <!--
								child = this.CDO();
								break;

							case CDC: // -->
								child = this.CDC();
								break;

							// CSS Syntax Module Level 3
							// §2.2 Error handling
							// At the "top level" of a stylesheet, an <at-keyword-token> starts an at-rule.
							case ATKEYWORD:
								child = this.parseWithFallback(this.Atrule, consumeRaw);
								break;

							// Anything else starts a qualified rule ...
							default:
								child = this.parseWithFallback(this.Rule, consumeRaw);
						}

						children.push(child);
					}

					return {
						type: "StyleSheet",
						loc: this.getLocation(start, this.scanner.tokenStart),
						children: children
					};
				},
				generate: function (node) {
					this.children(node);
				},
				walkContext: "stylesheet"
			};

		}, { "../../tokenizer": 107 }], 80: [function (require, module, exports) {
			var TYPE = require("../../tokenizer").TYPE;

			var IDENT = TYPE.Ident;
			var ASTERISK = 0x002A;     // U+002A ASTERISK (*)
			var VERTICALLINE = 0x007C; // U+007C VERTICAL LINE (|)

			function eatIdentifierOrAsterisk() {
				if (this.scanner.tokenType !== IDENT &&
					this.scanner.isDelim(ASTERISK) === false) {
					this.error("Identifier or asterisk is expected");
				}

				this.scanner.next();
			}

			// ident
			// ident|ident
			// ident|*
			// *
			// *|ident
			// *|*
			// |ident
			// |*
			module.exports = {
				name: "TypeSelector",
				structure: {
					name: String
				},
				parse: function () {
					var start = this.scanner.tokenStart;

					if (this.scanner.isDelim(VERTICALLINE)) {
						this.scanner.next();
						eatIdentifierOrAsterisk.call(this);
					} else {
						eatIdentifierOrAsterisk.call(this);

						if (this.scanner.isDelim(VERTICALLINE)) {
							this.scanner.next();
							eatIdentifierOrAsterisk.call(this);
						}
					}

					return {
						type: "TypeSelector",
						loc: this.getLocation(start, this.scanner.tokenStart),
						name: this.scanner.substrToCursor(start)
					};
				},
				generate: function (node) {
					this.chunk(node.name);
				}
			};

		}, { "../../tokenizer": 107 }], 81: [function (require, module, exports) {
			var isHexDigit = require("../../tokenizer").isHexDigit;
			var cmpChar = require("../../tokenizer").cmpChar;
			var TYPE = require("../../tokenizer").TYPE;
			var NAME = require("../../tokenizer").NAME;

			var IDENT = TYPE.Ident;
			var NUMBER = TYPE.Number;
			var DIMENSION = TYPE.Dimension;
			var PLUSSIGN = 0x002B;     // U+002B PLUS SIGN (+)
			var HYPHENMINUS = 0x002D;  // U+002D HYPHEN-MINUS (-)
			var QUESTIONMARK = 0x003F; // U+003F QUESTION MARK (?)
			var U = 0x0075;            // U+0075 LATIN SMALL LETTER U (u)

			function eatHexSequence(offset, allowDash) {
				for (var pos = this.scanner.tokenStart + offset, len = 0; pos < this.scanner.tokenEnd; pos++) {
					var code = this.scanner.source.charCodeAt(pos);

					if (code === HYPHENMINUS && allowDash && len !== 0) {
						if (eatHexSequence.call(this, offset + len + 1, false) === 0) {
							this.error();
						}

						return -1;
					}

					if (!isHexDigit(code)) {
						this.error(
							allowDash && len !== 0
								? "HyphenMinus" + (len < 6 ? " or hex digit" : "") + " is expected"
								: (len < 6 ? "Hex digit is expected" : "Unexpected input"),
							pos
						);
					}

					if (++len > 6) {
						this.error("Too many hex digits", pos);
					}
				}

				this.scanner.next();
				return len;
			}

			function eatQuestionMarkSequence(max) {
				var count = 0;

				while (this.scanner.isDelim(QUESTIONMARK)) {
					if (++count > max) {
						this.error("Too many question marks");
					}

					this.scanner.next();
				}
			}

			function startsWith(code) {
				if (this.scanner.source.charCodeAt(this.scanner.tokenStart) !== code) {
					this.error(NAME[code] + " is expected");
				}
			}

			// https://drafts.csswg.org/css-syntax/#urange
			// Informally, the <urange> production has three forms:
			// U+0001
			//      Defines a range consisting of a single code point, in this case the code point "1".
			// U+0001-00ff
			//      Defines a range of codepoints between the first and the second value, in this case
			//      the range between "1" and "ff" (255 in decimal) inclusive.
			// U+00??
			//      Defines a range of codepoints where the "?" characters range over all hex digits,
			//      in this case defining the same as the value U+0000-00ff.
			// In each form, a maximum of 6 digits is allowed for each hexadecimal number (if you treat "?" as a hexadecimal digit).
			//
			// <urange> =
			//   u '+' <ident-token> '?'* |
			//   u <dimension-token> '?'* |
			//   u <number-token> '?'* |
			//   u <number-token> <dimension-token> |
			//   u <number-token> <number-token> |
			//   u '+' '?'+
			function scanUnicodeRange() {
				var hexLength = 0;

				// u '+' <ident-token> '?'*
				// u '+' '?'+
				if (this.scanner.isDelim(PLUSSIGN)) {
					this.scanner.next();

					if (this.scanner.tokenType === IDENT) {
						hexLength = eatHexSequence.call(this, 0, true);
						if (hexLength > 0) {
							eatQuestionMarkSequence.call(this, 6 - hexLength);
						}
						return;
					}

					if (this.scanner.isDelim(QUESTIONMARK)) {
						this.scanner.next();
						eatQuestionMarkSequence.call(this, 5);
						return;
					}

					this.error("Hex digit or question mark is expected");
					return;
				}

				// u <number-token> '?'*
				// u <number-token> <dimension-token>
				// u <number-token> <number-token>
				if (this.scanner.tokenType === NUMBER) {
					startsWith.call(this, PLUSSIGN);
					hexLength = eatHexSequence.call(this, 1, true);

					if (this.scanner.isDelim(QUESTIONMARK)) {
						eatQuestionMarkSequence.call(this, 6 - hexLength);
						return;
					}

					if (this.scanner.tokenType === DIMENSION ||
						this.scanner.tokenType === NUMBER) {
						startsWith.call(this, HYPHENMINUS);
						eatHexSequence.call(this, 1, false);
						return;
					}

					return;
				}

				// u <dimension-token> '?'*
				if (this.scanner.tokenType === DIMENSION) {
					startsWith.call(this, PLUSSIGN);
					hexLength = eatHexSequence.call(this, 1, true);

					if (hexLength > 0) {
						eatQuestionMarkSequence.call(this, 6 - hexLength);
					}

					return;
				}

				this.error();
			}

			module.exports = {
				name: "UnicodeRange",
				structure: {
					value: String
				},
				parse: function () {
					var start = this.scanner.tokenStart;

					// U or u
					if (!cmpChar(this.scanner.source, start, U)) {
						this.error("U is expected");
					}

					if (!cmpChar(this.scanner.source, start + 1, PLUSSIGN)) {
						this.error("Plus sign is expected");
					}

					this.scanner.next();
					scanUnicodeRange.call(this);

					return {
						type: "UnicodeRange",
						loc: this.getLocation(start, this.scanner.tokenStart),
						value: this.scanner.substrToCursor(start)
					};
				},
				generate: function (node) {
					this.chunk(node.value);
				}
			};

		}, { "../../tokenizer": 107 }], 82: [function (require, module, exports) {
			var isWhiteSpace = require("../../tokenizer").isWhiteSpace;
			var cmpStr = require("../../tokenizer").cmpStr;
			var TYPE = require("../../tokenizer").TYPE;

			var FUNCTION = TYPE.Function;
			var URL = TYPE.Url;
			var RIGHTPARENTHESIS = TYPE.RightParenthesis;

			// <url-token> | <function-token> <string> )
			module.exports = {
				name: "Url",
				structure: {
					value: ["String", "Raw"]
				},
				parse: function () {
					var start = this.scanner.tokenStart;
					var value;

					switch (this.scanner.tokenType) {
						case URL:
							var rawStart = start + 4;
							var rawEnd = this.scanner.tokenEnd - 1;

							while (rawStart < rawEnd && isWhiteSpace(this.scanner.source.charCodeAt(rawStart))) {
								rawStart++;
							}

							while (rawStart < rawEnd && isWhiteSpace(this.scanner.source.charCodeAt(rawEnd - 1))) {
								rawEnd--;
							}

							value = {
								type: "Raw",
								loc: this.getLocation(rawStart, rawEnd),
								value: this.scanner.source.substring(rawStart, rawEnd)
							};

							this.eat(URL);
							break;

						case FUNCTION:
							if (!cmpStr(this.scanner.source, this.scanner.tokenStart, this.scanner.tokenEnd, "url(")) {
								this.error("Function name must be `url`");
							}

							this.eat(FUNCTION);
							this.scanner.skipSC();
							value = this.String();
							this.scanner.skipSC();
							this.eat(RIGHTPARENTHESIS);
							break;

						default:
							this.error("Url or Function is expected");
					}

					return {
						type: "Url",
						loc: this.getLocation(start, this.scanner.tokenStart),
						value: value
					};
				},
				generate: function (node) {
					this.chunk("url");
					this.chunk("(");
					this.node(node.value);
					this.chunk(")");
				}
			};

		}, { "../../tokenizer": 107 }], 83: [function (require, module, exports) {
			module.exports = {
				name: "Value",
				structure: {
					children: [[]]
				},
				parse: function () {
					var start = this.scanner.tokenStart;
					var children = this.readSequence(this.scope.Value);

					return {
						type: "Value",
						loc: this.getLocation(start, this.scanner.tokenStart),
						children: children
					};
				},
				generate: function (node) {
					this.children(node);
				}
			};

		}, {}], 84: [function (require, module, exports) {
			var WHITESPACE = require("../../tokenizer").TYPE.WhiteSpace;
			var SPACE = Object.freeze({
				type: "WhiteSpace",
				loc: null,
				value: " "
			});

			module.exports = {
				name: "WhiteSpace",
				structure: {
					value: String
				},
				parse: function () {
					this.eat(WHITESPACE);
					return SPACE;

					// return {
					//     type: 'WhiteSpace',
					//     loc: this.getLocation(this.scanner.tokenStart, this.scanner.tokenEnd),
					//     value: this.consume(WHITESPACE)
					// };
				},
				generate: function (node) {
					this.chunk(node.value);
				}
			};

		}, { "../../tokenizer": 107 }], 85: [function (require, module, exports) {
			module.exports = {
				AnPlusB: require("./AnPlusB"),
				Atrule: require("./Atrule"),
				AtrulePrelude: require("./AtrulePrelude"),
				AttributeSelector: require("./AttributeSelector"),
				Block: require("./Block"),
				Brackets: require("./Brackets"),
				CDC: require("./CDC"),
				CDO: require("./CDO"),
				ClassSelector: require("./ClassSelector"),
				Combinator: require("./Combinator"),
				Comment: require("./Comment"),
				Declaration: require("./Declaration"),
				DeclarationList: require("./DeclarationList"),
				Dimension: require("./Dimension"),
				Function: require("./Function"),
				HexColor: require("./HexColor"),
				Identifier: require("./Identifier"),
				IdSelector: require("./IdSelector"),
				MediaFeature: require("./MediaFeature"),
				MediaQuery: require("./MediaQuery"),
				MediaQueryList: require("./MediaQueryList"),
				Nth: require("./Nth"),
				Number: require("./Number"),
				Operator: require("./Operator"),
				Parentheses: require("./Parentheses"),
				Percentage: require("./Percentage"),
				PseudoClassSelector: require("./PseudoClassSelector"),
				PseudoElementSelector: require("./PseudoElementSelector"),
				Ratio: require("./Ratio"),
				Raw: require("./Raw"),
				Rule: require("./Rule"),
				Selector: require("./Selector"),
				SelectorList: require("./SelectorList"),
				String: require("./String"),
				StyleSheet: require("./StyleSheet"),
				TypeSelector: require("./TypeSelector"),
				UnicodeRange: require("./UnicodeRange"),
				Url: require("./Url"),
				Value: require("./Value"),
				WhiteSpace: require("./WhiteSpace")
			};

		}, { "./AnPlusB": 45, "./Atrule": 46, "./AtrulePrelude": 47, "./AttributeSelector": 48, "./Block": 49, "./Brackets": 50, "./CDC": 51, "./CDO": 52, "./ClassSelector": 53, "./Combinator": 54, "./Comment": 55, "./Declaration": 56, "./DeclarationList": 57, "./Dimension": 58, "./Function": 59, "./HexColor": 60, "./IdSelector": 61, "./Identifier": 62, "./MediaFeature": 63, "./MediaQuery": 64, "./MediaQueryList": 65, "./Nth": 66, "./Number": 67, "./Operator": 68, "./Parentheses": 69, "./Percentage": 70, "./PseudoClassSelector": 71, "./PseudoElementSelector": 72, "./Ratio": 73, "./Raw": 74, "./Rule": 75, "./Selector": 76, "./SelectorList": 77, "./String": 78, "./StyleSheet": 79, "./TypeSelector": 80, "./UnicodeRange": 81, "./Url": 82, "./Value": 83, "./WhiteSpace": 84 }], 86: [function (require, module, exports) {
			var DISALLOW_OF_CLAUSE = false;

			module.exports = {
				parse: function nth() {
					return this.createSingleNodeList(
						this.Nth(DISALLOW_OF_CLAUSE)
					);
				}
			};

		}, {}], 87: [function (require, module, exports) {
			var ALLOW_OF_CLAUSE = true;

			module.exports = {
				parse: function nthWithOfClause() {
					return this.createSingleNodeList(
						this.Nth(ALLOW_OF_CLAUSE)
					);
				}
			};

		}, {}], 88: [function (require, module, exports) {
			module.exports = {
				parse: function selectorList() {
					return this.createSingleNodeList(
						this.SelectorList()
					);
				}
			};

		}, {}], 89: [function (require, module, exports) {
			module.exports = {
				parse: function () {
					return this.createSingleNodeList(
						this.Identifier()
					);
				}
			};

		}, {}], 90: [function (require, module, exports) {
			module.exports = {
				parse: function () {
					return this.createSingleNodeList(
						this.SelectorList()
					);
				}
			};

		}, {}], 91: [function (require, module, exports) {
			module.exports = {
				"dir": require("./dir"),
				"has": require("./has"),
				"lang": require("./lang"),
				"matches": require("./matches"),
				"not": require("./not"),
				"nth-child": require("./nth-child"),
				"nth-last-child": require("./nth-last-child"),
				"nth-last-of-type": require("./nth-last-of-type"),
				"nth-of-type": require("./nth-of-type"),
				"slotted": require("./slotted")
			};

		}, { "./dir": 89, "./has": 90, "./lang": 92, "./matches": 93, "./not": 94, "./nth-child": 95, "./nth-last-child": 96, "./nth-last-of-type": 97, "./nth-of-type": 98, "./slotted": 99 }], 92: [function (require, module, exports) {
			arguments[4][89][0].apply(exports, arguments);
		}, { "dup": 89 }], 93: [function (require, module, exports) {
			module.exports = require("./common/selectorList");

		}, { "./common/selectorList": 88 }], 94: [function (require, module, exports) {
			arguments[4][93][0].apply(exports, arguments);
		}, { "./common/selectorList": 88, "dup": 93 }], 95: [function (require, module, exports) {
			module.exports = require("./common/nthWithOfClause");

		}, { "./common/nthWithOfClause": 87 }], 96: [function (require, module, exports) {
			arguments[4][95][0].apply(exports, arguments);
		}, { "./common/nthWithOfClause": 87, "dup": 95 }], 97: [function (require, module, exports) {
			module.exports = require("./common/nth");

		}, { "./common/nth": 86 }], 98: [function (require, module, exports) {
			arguments[4][97][0].apply(exports, arguments);
		}, { "./common/nth": 86, "dup": 97 }], 99: [function (require, module, exports) {
			module.exports = {
				parse: function compoundSelector() {
					return this.createSingleNodeList(
						this.Selector()
					);
				}
			};

		}, {}], 100: [function (require, module, exports) {
			module.exports = {
				getNode: require("./default")
			};

		}, { "./default": 101 }], 101: [function (require, module, exports) {
			var cmpChar = require("../../tokenizer").cmpChar;
			var cmpStr = require("../../tokenizer").cmpStr;
			var TYPE = require("../../tokenizer").TYPE;

			var IDENT = TYPE.Ident;
			var STRING = TYPE.String;
			var NUMBER = TYPE.Number;
			var FUNCTION = TYPE.Function;
			var URL = TYPE.Url;
			var HASH = TYPE.Hash;
			var DIMENSION = TYPE.Dimension;
			var PERCENTAGE = TYPE.Percentage;
			var LEFTPARENTHESIS = TYPE.LeftParenthesis;
			var LEFTSQUAREBRACKET = TYPE.LeftSquareBracket;
			var COMMA = TYPE.Comma;
			var DELIM = TYPE.Delim;
			var NUMBERSIGN = 0x0023;  // U+0023 NUMBER SIGN (#)
			var ASTERISK = 0x002A;    // U+002A ASTERISK (*)
			var PLUSSIGN = 0x002B;    // U+002B PLUS SIGN (+)
			var HYPHENMINUS = 0x002D; // U+002D HYPHEN-MINUS (-)
			var SOLIDUS = 0x002F;     // U+002F SOLIDUS (/)
			var U = 0x0075;           // U+0075 LATIN SMALL LETTER U (u)

			module.exports = function defaultRecognizer(context) {
				switch (this.scanner.tokenType) {
					case HASH:
						return this.HexColor();

					case COMMA:
						context.space = null;
						context.ignoreWSAfter = true;
						return this.Operator();

					case LEFTPARENTHESIS:
						return this.Parentheses(this.readSequence, context.recognizer);

					case LEFTSQUAREBRACKET:
						return this.Brackets(this.readSequence, context.recognizer);

					case STRING:
						return this.String();

					case DIMENSION:
						return this.Dimension();

					case PERCENTAGE:
						return this.Percentage();

					case NUMBER:
						return this.Number();

					case FUNCTION:
						return cmpStr(this.scanner.source, this.scanner.tokenStart, this.scanner.tokenEnd, "url(")
							? this.Url()
							: this.Function(this.readSequence, context.recognizer);

					case URL:
						return this.Url();

					case IDENT:
						// check for unicode range, it should start with u+ or U+
						if (cmpChar(this.scanner.source, this.scanner.tokenStart, U) &&
							cmpChar(this.scanner.source, this.scanner.tokenStart + 1, PLUSSIGN)) {
							return this.UnicodeRange();
						} else {
							return this.Identifier();
						}

					case DELIM:
						var code = this.scanner.source.charCodeAt(this.scanner.tokenStart);

						if (code === SOLIDUS ||
							code === ASTERISK ||
							code === PLUSSIGN ||
							code === HYPHENMINUS) {
							return this.Operator(); // TODO: replace with Delim
						}

						// TODO: produce a node with Delim node type

						if (code === NUMBERSIGN) {
							this.error("Hex or identifier is expected", this.scanner.tokenStart + 1);
						}

						break;
				}
			};

		}, { "../../tokenizer": 107 }], 102: [function (require, module, exports) {
			module.exports = {
				AtrulePrelude: require("./atrulePrelude"),
				Selector: require("./selector"),
				Value: require("./value")
			};

		}, { "./atrulePrelude": 100, "./selector": 103, "./value": 104 }], 103: [function (require, module, exports) {
			var TYPE = require("../../tokenizer").TYPE;

			var DELIM = TYPE.Delim;
			var IDENT = TYPE.Ident;
			var DIMENSION = TYPE.Dimension;
			var PERCENTAGE = TYPE.Percentage;
			var NUMBER = TYPE.Number;
			var HASH = TYPE.Hash;
			var COLON = TYPE.Colon;
			var LEFTSQUAREBRACKET = TYPE.LeftSquareBracket;
			var NUMBERSIGN = 0x0023;      // U+0023 NUMBER SIGN (#)
			var ASTERISK = 0x002A;        // U+002A ASTERISK (*)
			var PLUSSIGN = 0x002B;        // U+002B PLUS SIGN (+)
			var SOLIDUS = 0x002F;         // U+002F SOLIDUS (/)
			var FULLSTOP = 0x002E;        // U+002E FULL STOP (.)
			var GREATERTHANSIGN = 0x003E; // U+003E GREATER-THAN SIGN (>)
			var VERTICALLINE = 0x007C;    // U+007C VERTICAL LINE (|)
			var TILDE = 0x007E;           // U+007E TILDE (~)

			function getNode(context) {
				switch (this.scanner.tokenType) {
					case LEFTSQUAREBRACKET:
						return this.AttributeSelector();

					case HASH:
						return this.IdSelector();

					case COLON:
						if (this.scanner.lookupType(1) === COLON) {
							return this.PseudoElementSelector();
						} else {
							return this.PseudoClassSelector();
						}

					case IDENT:
						return this.TypeSelector();

					case NUMBER:
					case PERCENTAGE:
						return this.Percentage();

					case DIMENSION:
						// throws when .123ident
						if (this.scanner.source.charCodeAt(this.scanner.tokenStart) === FULLSTOP) {
							this.error("Identifier is expected", this.scanner.tokenStart + 1);
						}
						break;

					case DELIM:
						var code = this.scanner.source.charCodeAt(this.scanner.tokenStart);

						switch (code) {
							case PLUSSIGN:
							case GREATERTHANSIGN:
							case TILDE:
								context.space = null;
								context.ignoreWSAfter = true;
								return this.Combinator();

							case SOLIDUS:  // /deep/
								return this.Combinator();

							case FULLSTOP:
								return this.ClassSelector();

							case ASTERISK:
							case VERTICALLINE:
								return this.TypeSelector();

							case NUMBERSIGN:
								return this.IdSelector();
						}

						break;
				}
			}

			module.exports = {
				getNode: getNode
			};

		}, { "../../tokenizer": 107 }], 104: [function (require, module, exports) {
			module.exports = {
				getNode: require("./default"),
				"-moz-element": require("../function/element"),
				"element": require("../function/element"),
				"expression": require("../function/expression"),
				"var": require("../function/var")
			};

		}, { "../function/element": 41, "../function/expression": 42, "../function/var": 43, "./default": 101 }], 105: [function (require, module, exports) {
			var EOF = 0;

			// https://drafts.csswg.org/css-syntax-3/
			// § 4.2. Definitions

			// digit
			// A code point between U+0030 DIGIT ZERO (0) and U+0039 DIGIT NINE (9).
			function isDigit(code) {
				return code >= 0x0030 && code <= 0x0039;
			}

			// hex digit
			// A digit, or a code point between U+0041 LATIN CAPITAL LETTER A (A) and U+0046 LATIN CAPITAL LETTER F (F),
			// or a code point between U+0061 LATIN SMALL LETTER A (a) and U+0066 LATIN SMALL LETTER F (f).
			function isHexDigit(code) {
				return (
					isDigit(code) || // 0 .. 9
					(code >= 0x0041 && code <= 0x0046) || // A .. F
					(code >= 0x0061 && code <= 0x0066)    // a .. f
				);
			}

			// uppercase letter
			// A code point between U+0041 LATIN CAPITAL LETTER A (A) and U+005A LATIN CAPITAL LETTER Z (Z).
			function isUppercaseLetter(code) {
				return code >= 0x0041 && code <= 0x005A;
			}

			// lowercase letter
			// A code point between U+0061 LATIN SMALL LETTER A (a) and U+007A LATIN SMALL LETTER Z (z).
			function isLowercaseLetter(code) {
				return code >= 0x0061 && code <= 0x007A;
			}

			// letter
			// An uppercase letter or a lowercase letter.
			function isLetter(code) {
				return isUppercaseLetter(code) || isLowercaseLetter(code);
			}

			// non-ASCII code point
			// A code point with a value equal to or greater than U+0080 <control>.
			function isNonAscii(code) {
				return code >= 0x0080;
			}

			// name-start code point
			// A letter, a non-ASCII code point, or U+005F LOW LINE (_).
			function isNameStart(code) {
				return isLetter(code) || isNonAscii(code) || code === 0x005F;
			}

			// name code point
			// A name-start code point, a digit, or U+002D HYPHEN-MINUS (-).
			function isName(code) {
				return isNameStart(code) || isDigit(code) || code === 0x002D;
			}

			// non-printable code point
			// A code point between U+0000 NULL and U+0008 BACKSPACE, or U+000B LINE TABULATION,
			// or a code point between U+000E SHIFT OUT and U+001F INFORMATION SEPARATOR ONE, or U+007F DELETE.
			function isNonPrintable(code) {
				return (
					(code >= 0x0000 && code <= 0x0008) ||
					(code === 0x000B) ||
					(code >= 0x000E && code <= 0x001F) ||
					(code === 0x007F)
				);
			}

			// newline
			// U+000A LINE FEED. Note that U+000D CARRIAGE RETURN and U+000C FORM FEED are not included in this definition,
			// as they are converted to U+000A LINE FEED during preprocessing.
			// TODO: we doesn't do a preprocessing, so check a code point for U+000D CARRIAGE RETURN and U+000C FORM FEED
			function isNewline(code) {
				return code === 0x000A || code === 0x000D || code === 0x000C;
			}

			// whitespace
			// A newline, U+0009 CHARACTER TABULATION, or U+0020 SPACE.
			function isWhiteSpace(code) {
				return isNewline(code) || code === 0x0020 || code === 0x0009;
			}

			// § 4.3.8. Check if two code points are a valid escape
			function isValidEscape(first, second) {
				// If the first code point is not U+005C REVERSE SOLIDUS (\), return false.
				if (first !== 0x005C) {
					return false;
				}

				// Otherwise, if the second code point is a newline or EOF, return false.
				if (isNewline(second) || second === EOF) {
					return false;
				}

				// Otherwise, return true.
				return true;
			}

			// § 4.3.9. Check if three code points would start an identifier
			function isIdentifierStart(first, second, third) {
				// Look at the first code point:

				// U+002D HYPHEN-MINUS
				if (first === 0x002D) {
					// If the second code point is a name-start code point or a U+002D HYPHEN-MINUS,
					// or the second and third code points are a valid escape, return true. Otherwise, return false.
					return (
						isNameStart(second) ||
						second === 0x002D ||
						isValidEscape(second, third)
					);
				}

				// name-start code point
				if (isNameStart(first)) {
					// Return true.
					return true;
				}

				// U+005C REVERSE SOLIDUS (\)
				if (first === 0x005C) {
					// If the first and second code points are a valid escape, return true. Otherwise, return false.
					return isValidEscape(first, second);
				}

				// anything else
				// Return false.
				return false;
			}

			// § 4.3.10. Check if three code points would start a number
			function isNumberStart(first, second, third) {
				// Look at the first code point:

				// U+002B PLUS SIGN (+)
				// U+002D HYPHEN-MINUS (-)
				if (first === 0x002B || first === 0x002D) {
					// If the second code point is a digit, return true.
					if (isDigit(second)) {
						return 2;
					}

					// Otherwise, if the second code point is a U+002E FULL STOP (.)
					// and the third code point is a digit, return true.
					// Otherwise, return false.
					return second === 0x002E && isDigit(third) ? 3 : 0;
				}

				// U+002E FULL STOP (.)
				if (first === 0x002E) {
					// If the second code point is a digit, return true. Otherwise, return false.
					return isDigit(second) ? 2 : 0;
				}

				// digit
				if (isDigit(first)) {
					// Return true.
					return 1;
				}

				// anything else
				// Return false.
				return 0;
			}

			//
			// Misc
			//

			// detect BOM (https://en.wikipedia.org/wiki/Byte_order_mark)
			function isBOM(code) {
				// UTF-16BE
				if (code === 0xFEFF) {
					return 1;
				}

				// UTF-16LE
				if (code === 0xFFFE) {
					return 1;
				}

				return 0;
			}

			// Fast code category
			//
			// https://drafts.csswg.org/css-syntax/#tokenizer-definitions
			// > non-ASCII code point
			// >   A code point with a value equal to or greater than U+0080 <control>
			// > name-start code point
			// >   A letter, a non-ASCII code point, or U+005F LOW LINE (_).
			// > name code point
			// >   A name-start code point, a digit, or U+002D HYPHEN-MINUS (-)
			// That means only ASCII code points has a special meaning and we define a maps for 0..127 codes only
			var CATEGORY = new Array(0x80);
			charCodeCategory.Eof = 0x80;
			charCodeCategory.WhiteSpace = 0x82;
			charCodeCategory.Digit = 0x83;
			charCodeCategory.NameStart = 0x84;
			charCodeCategory.NonPrintable = 0x85;

			for (var i = 0; i < CATEGORY.length; i++) {
				switch (true) {
					case isWhiteSpace(i):
						CATEGORY[i] = charCodeCategory.WhiteSpace;
						break;

					case isDigit(i):
						CATEGORY[i] = charCodeCategory.Digit;
						break;

					case isNameStart(i):
						CATEGORY[i] = charCodeCategory.NameStart;
						break;

					case isNonPrintable(i):
						CATEGORY[i] = charCodeCategory.NonPrintable;
						break;

					default:
						CATEGORY[i] = i || charCodeCategory.Eof;
				}
			}

			function charCodeCategory(code) {
				return code < 0x80 ? CATEGORY[code] : charCodeCategory.NameStart;
			}

			module.exports = {
				isDigit: isDigit,
				isHexDigit: isHexDigit,
				isUppercaseLetter: isUppercaseLetter,
				isLowercaseLetter: isLowercaseLetter,
				isLetter: isLetter,
				isNonAscii: isNonAscii,
				isNameStart: isNameStart,
				isName: isName,
				isNonPrintable: isNonPrintable,
				isNewline: isNewline,
				isWhiteSpace: isWhiteSpace,
				isValidEscape: isValidEscape,
				isIdentifierStart: isIdentifierStart,
				isNumberStart: isNumberStart,

				isBOM: isBOM,
				charCodeCategory: charCodeCategory
			};

		}, {}], 106: [function (require, module, exports) {
			// CSS Syntax Module Level 3
			// https://www.w3.org/TR/css-syntax-3/
			var TYPE = {
				EOF: 0,                 // <EOF-token>
				Ident: 1,               // <ident-token>
				Function: 2,            // <function-token>
				AtKeyword: 3,           // <at-keyword-token>
				Hash: 4,                // <hash-token>
				String: 5,              // <string-token>
				BadString: 6,           // <bad-string-token>
				Url: 7,                 // <url-token>
				BadUrl: 8,              // <bad-url-token>
				Delim: 9,               // <delim-token>
				Number: 10,             // <number-token>
				Percentage: 11,         // <percentage-token>
				Dimension: 12,          // <dimension-token>
				WhiteSpace: 13,         // <whitespace-token>
				CDO: 14,                // <CDO-token>
				CDC: 15,                // <CDC-token>
				Colon: 16,              // <colon-token>     :
				Semicolon: 17,          // <semicolon-token> ;
				Comma: 18,              // <comma-token>     ,
				LeftSquareBracket: 19,  // <[-token>
				RightSquareBracket: 20, // <]-token>
				LeftParenthesis: 21,    // <(-token>
				RightParenthesis: 22,   // <)-token>
				LeftCurlyBracket: 23,   // <{-token>
				RightCurlyBracket: 24,  // <}-token>
				Comment: 25
			};

			var NAME = Object.keys(TYPE).reduce(function (result, key) {
				result[TYPE[key]] = key;
				return result;
			}, {});

			module.exports = {
				TYPE: TYPE,
				NAME: NAME
			};

		}, {}], 107: [function (require, module, exports) {
			var TokenStream = require("../common/TokenStream");
			var adoptBuffer = require("../common/adopt-buffer");

			var constants = require("./const");
			var TYPE = constants.TYPE;

			var charCodeDefinitions = require("./char-code-definitions");
			var isNewline = charCodeDefinitions.isNewline;
			var isName = charCodeDefinitions.isName;
			var isValidEscape = charCodeDefinitions.isValidEscape;
			var isNumberStart = charCodeDefinitions.isNumberStart;
			var isIdentifierStart = charCodeDefinitions.isIdentifierStart;
			var charCodeCategory = charCodeDefinitions.charCodeCategory;
			var isBOM = charCodeDefinitions.isBOM;

			var utils = require("./utils");
			var cmpStr = utils.cmpStr;
			var getNewlineLength = utils.getNewlineLength;
			var findWhiteSpaceEnd = utils.findWhiteSpaceEnd;
			var consumeEscaped = utils.consumeEscaped;
			var consumeName = utils.consumeName;
			var consumeNumber = utils.consumeNumber;
			var consumeBadUrlRemnants = utils.consumeBadUrlRemnants;

			var OFFSET_MASK = 0x00FFFFFF;
			var TYPE_SHIFT = 24;

			function tokenize(source, stream) {
				function getCharCode(offset) {
					return offset < sourceLength ? source.charCodeAt(offset) : 0;
				}

				// § 4.3.3. Consume a numeric token
				function consumeNumericToken() {
					// Consume a number and let number be the result.
					offset = consumeNumber(source, offset);

					// If the next 3 input code points would start an identifier, then:
					if (isIdentifierStart(getCharCode(offset), getCharCode(offset + 1), getCharCode(offset + 2))) {
						// Create a <dimension-token> with the same value and type flag as number, and a unit set initially to the empty string.
						// Consume a name. Set the <dimension-token>’s unit to the returned value.
						// Return the <dimension-token>.
						type = TYPE.Dimension;
						offset = consumeName(source, offset);
						return;
					}

					// Otherwise, if the next input code point is U+0025 PERCENTAGE SIGN (%), consume it.
					if (getCharCode(offset) === 0x0025) {
						// Create a <percentage-token> with the same value as number, and return it.
						type = TYPE.Percentage;
						offset++;
						return;
					}

					// Otherwise, create a <number-token> with the same value and type flag as number, and return it.
					type = TYPE.Number;
				}

				// § 4.3.4. Consume an ident-like token
				function consumeIdentLikeToken() {
					const nameStartOffset = offset;

					// Consume a name, and let string be the result.
					offset = consumeName(source, offset);

					// If string’s value is an ASCII case-insensitive match for "url",
					// and the next input code point is U+0028 LEFT PARENTHESIS ((), consume it.
					if (cmpStr(source, nameStartOffset, offset, "url") && getCharCode(offset) === 0x0028) {
						// While the next two input code points are whitespace, consume the next input code point.
						offset = findWhiteSpaceEnd(source, offset + 1);

						// If the next one or two input code points are U+0022 QUOTATION MARK ("), U+0027 APOSTROPHE ('),
						// or whitespace followed by U+0022 QUOTATION MARK (") or U+0027 APOSTROPHE ('),
						// then create a <function-token> with its value set to string and return it.
						if (getCharCode(offset) === 0x0022 ||
							getCharCode(offset) === 0x0027) {
							type = TYPE.Function;
							offset = nameStartOffset + 4;
							return;
						}

						// Otherwise, consume a url token, and return it.
						consumeUrlToken();
						return;
					}

					// Otherwise, if the next input code point is U+0028 LEFT PARENTHESIS ((), consume it.
					// Create a <function-token> with its value set to string and return it.
					if (getCharCode(offset) === 0x0028) {
						type = TYPE.Function;
						offset++;
						return;
					}

					// Otherwise, create an <ident-token> with its value set to string and return it.
					type = TYPE.Ident;
				}

				// § 4.3.5. Consume a string token
				function consumeStringToken(endingCodePoint) {
					// This algorithm may be called with an ending code point, which denotes the code point
					// that ends the string. If an ending code point is not specified,
					// the current input code point is used.
					if (!endingCodePoint) {
						endingCodePoint = getCharCode(offset++);
					}

					// Initially create a <string-token> with its value set to the empty string.
					type = TYPE.String;

					// Repeatedly consume the next input code point from the stream:
					for (; offset < source.length; offset++) {
						var code = source.charCodeAt(offset);

						switch (charCodeCategory(code)) {
							// ending code point
							case endingCodePoint:
								// Return the <string-token>.
								offset++;
								return;

							// EOF
							case charCodeCategory.Eof:
								// This is a parse error. Return the <string-token>.
								return;

							// newline
							case charCodeCategory.WhiteSpace:
								if (isNewline(code)) {
									// This is a parse error. Reconsume the current input code point,
									// create a <bad-string-token>, and return it.
									offset += getNewlineLength(source, offset, code);
									type = TYPE.BadString;
									return;
								}
								break;

							// U+005C REVERSE SOLIDUS (\)
							case 0x005C:
								// If the next input code point is EOF, do nothing.
								if (offset === source.length - 1) {
									break;
								}

								var nextCode = getCharCode(offset + 1);

								// Otherwise, if the next input code point is a newline, consume it.
								if (isNewline(nextCode)) {
									offset += getNewlineLength(source, offset + 1, nextCode);
								} else if (isValidEscape(code, nextCode)) {
									// Otherwise, (the stream starts with a valid escape) consume
									// an escaped code point and append the returned code point to
									// the <string-token>’s value.
									offset = consumeEscaped(source, offset) - 1;
								}
								break;

							// anything else
							// Append the current input code point to the <string-token>’s value.
						}
					}
				}

				// § 4.3.6. Consume a url token
				// Note: This algorithm assumes that the initial "url(" has already been consumed.
				// This algorithm also assumes that it’s being called to consume an "unquoted" value, like url(foo).
				// A quoted value, like url("foo"), is parsed as a <function-token>. Consume an ident-like token
				// automatically handles this distinction; this algorithm shouldn’t be called directly otherwise.
				function consumeUrlToken() {
					// Initially create a <url-token> with its value set to the empty string.
					type = TYPE.Url;

					// Consume as much whitespace as possible.
					offset = findWhiteSpaceEnd(source, offset);

					// Repeatedly consume the next input code point from the stream:
					for (; offset < source.length; offset++) {
						var code = source.charCodeAt(offset);

						switch (charCodeCategory(code)) {
							// U+0029 RIGHT PARENTHESIS ())
							case 0x0029:
								// Return the <url-token>.
								offset++;
								return;

							// EOF
							case charCodeCategory.Eof:
								// This is a parse error. Return the <url-token>.
								return;

							// whitespace
							case charCodeCategory.WhiteSpace:
								// Consume as much whitespace as possible.
								offset = findWhiteSpaceEnd(source, offset);

								// If the next input code point is U+0029 RIGHT PARENTHESIS ()) or EOF,
								// consume it and return the <url-token>
								// (if EOF was encountered, this is a parse error);
								if (getCharCode(offset) === 0x0029 || offset >= source.length) {
									if (offset < source.length) {
										offset++;
									}
									return;
								}

								// otherwise, consume the remnants of a bad url, create a <bad-url-token>,
								// and return it.
								offset = consumeBadUrlRemnants(source, offset);
								type = TYPE.BadUrl;
								return;

							// U+0022 QUOTATION MARK (")
							// U+0027 APOSTROPHE (')
							// U+0028 LEFT PARENTHESIS (()
							// non-printable code point
							case 0x0022:
							case 0x0027:
							case 0x0028:
							case charCodeCategory.NonPrintable:
								// This is a parse error. Consume the remnants of a bad url,
								// create a <bad-url-token>, and return it.
								offset = consumeBadUrlRemnants(source, offset);
								type = TYPE.BadUrl;
								return;

							// U+005C REVERSE SOLIDUS (\)
							case 0x005C:
								// If the stream starts with a valid escape, consume an escaped code point and
								// append the returned code point to the <url-token>’s value.
								if (isValidEscape(code, getCharCode(offset + 1))) {
									offset = consumeEscaped(source, offset) - 1;
									break;
								}

								// Otherwise, this is a parse error. Consume the remnants of a bad url,
								// create a <bad-url-token>, and return it.
								offset = consumeBadUrlRemnants(source, offset);
								type = TYPE.BadUrl;
								return;

							// anything else
							// Append the current input code point to the <url-token>’s value.
						}
					}
				}

				if (!stream) {
					stream = new TokenStream();
				}

				// ensure source is a string
				source = String(source || "");

				var sourceLength = source.length;
				var offsetAndType = adoptBuffer(stream.offsetAndType, sourceLength + 1); // +1 because of eof-token
				var balance = adoptBuffer(stream.balance, sourceLength + 1);
				var tokenCount = 0;
				var start = isBOM(getCharCode(0));
				var offset = start;
				var balanceCloseType = 0;
				var balanceStart = 0;
				var balancePrev = 0;

				// https://drafts.csswg.org/css-syntax-3/#consume-token
				// § 4.3.1. Consume a token
				while (offset < sourceLength) {
					var code = source.charCodeAt(offset);
					var type = 0;

					balance[tokenCount] = sourceLength;

					switch (charCodeCategory(code)) {
						// whitespace
						case charCodeCategory.WhiteSpace:
							// Consume as much whitespace as possible. Return a <whitespace-token>.
							type = TYPE.WhiteSpace;
							offset = findWhiteSpaceEnd(source, offset + 1);
							break;

						// U+0022 QUOTATION MARK (")
						case 0x0022:
							// Consume a string token and return it.
							consumeStringToken();
							break;

						// U+0023 NUMBER SIGN (#)
						case 0x0023:
							// If the next input code point is a name code point or the next two input code points are a valid escape, then:
							if (isName(getCharCode(offset + 1)) || isValidEscape(getCharCode(offset + 1), getCharCode(offset + 2))) {
								// Create a <hash-token>.
								type = TYPE.Hash;

								// If the next 3 input code points would start an identifier, set the <hash-token>’s type flag to "id".
								// if (isIdentifierStart(getCharCode(offset + 1), getCharCode(offset + 2), getCharCode(offset + 3))) {
								//     // TODO: set id flag
								// }

								// Consume a name, and set the <hash-token>’s value to the returned string.
								offset = consumeName(source, offset + 1);

								// Return the <hash-token>.
							} else {
								// Otherwise, return a <delim-token> with its value set to the current input code point.
								type = TYPE.Delim;
								offset++;
							}

							break;

						// U+0027 APOSTROPHE (')
						case 0x0027:
							// Consume a string token and return it.
							consumeStringToken();
							break;

						// U+0028 LEFT PARENTHESIS (()
						case 0x0028:
							// Return a <(-token>.
							type = TYPE.LeftParenthesis;
							offset++;
							break;

						// U+0029 RIGHT PARENTHESIS ())
						case 0x0029:
							// Return a <)-token>.
							type = TYPE.RightParenthesis;
							offset++;
							break;

						// U+002B PLUS SIGN (+)
						case 0x002B:
							// If the input stream starts with a number, ...
							if (isNumberStart(code, getCharCode(offset + 1), getCharCode(offset + 2))) {
								// ... reconsume the current input code point, consume a numeric token, and return it.
								consumeNumericToken();
							} else {
								// Otherwise, return a <delim-token> with its value set to the current input code point.
								type = TYPE.Delim;
								offset++;
							}
							break;

						// U+002C COMMA (,)
						case 0x002C:
							// Return a <comma-token>.
							type = TYPE.Comma;
							offset++;
							break;

						// U+002D HYPHEN-MINUS (-)
						case 0x002D:
							// If the input stream starts with a number, reconsume the current input code point, consume a numeric token, and return it.
							if (isNumberStart(code, getCharCode(offset + 1), getCharCode(offset + 2))) {
								consumeNumericToken();
							} else {
								// Otherwise, if the next 2 input code points are U+002D HYPHEN-MINUS U+003E GREATER-THAN SIGN (->), consume them and return a <CDC-token>.
								if (getCharCode(offset + 1) === 0x002D &&
									getCharCode(offset + 2) === 0x003E) {
									type = TYPE.CDC;
									offset = offset + 3;
								} else {
									// Otherwise, if the input stream starts with an identifier, ...
									if (isIdentifierStart(code, getCharCode(offset + 1), getCharCode(offset + 2))) {
										// ... reconsume the current input code point, consume an ident-like token, and return it.
										consumeIdentLikeToken();
									} else {
										// Otherwise, return a <delim-token> with its value set to the current input code point.
										type = TYPE.Delim;
										offset++;
									}
								}
							}
							break;

						// U+002E FULL STOP (.)
						case 0x002E:
							// If the input stream starts with a number, ...
							if (isNumberStart(code, getCharCode(offset + 1), getCharCode(offset + 2))) {
								// ... reconsume the current input code point, consume a numeric token, and return it.
								consumeNumericToken();
							} else {
								// Otherwise, return a <delim-token> with its value set to the current input code point.
								type = TYPE.Delim;
								offset++;
							}

							break;

						// U+002F SOLIDUS (/)
						case 0x002F:
							// If the next two input code point are U+002F SOLIDUS (/) followed by a U+002A ASTERISK (*),
							if (getCharCode(offset + 1) === 0x002A) {
								// ... consume them and all following code points up to and including the first U+002A ASTERISK (*)
								// followed by a U+002F SOLIDUS (/), or up to an EOF code point.
								type = TYPE.Comment;
								offset = source.indexOf("*/", offset + 2) + 2;
								if (offset === 1) {
									offset = source.length;
								}
							} else {
								type = TYPE.Delim;
								offset++;
							}
							break;

						// U+003A COLON (:)
						case 0x003A:
							// Return a <colon-token>.
							type = TYPE.Colon;
							offset++;
							break;

						// U+003B SEMICOLON (;)
						case 0x003B:
							// Return a <semicolon-token>.
							type = TYPE.Semicolon;
							offset++;
							break;

						// U+003C LESS-THAN SIGN (<)
						case 0x003C:
							// If the next 3 input code points are U+0021 EXCLAMATION MARK U+002D HYPHEN-MINUS U+002D HYPHEN-MINUS (!--), ...
							if (getCharCode(offset + 1) === 0x0021 &&
								getCharCode(offset + 2) === 0x002D &&
								getCharCode(offset + 3) === 0x002D) {
								// ... consume them and return a <CDO-token>.
								type = TYPE.CDO;
								offset = offset + 4;
							} else {
								// Otherwise, return a <delim-token> with its value set to the current input code point.
								type = TYPE.Delim;
								offset++;
							}

							break;

						// U+0040 COMMERCIAL AT (@)
						case 0x0040:
							// If the next 3 input code points would start an identifier, ...
							if (isIdentifierStart(getCharCode(offset + 1), getCharCode(offset + 2), getCharCode(offset + 3))) {
								// ... consume a name, create an <at-keyword-token> with its value set to the returned value, and return it.
								type = TYPE.AtKeyword;
								offset = consumeName(source, offset + 1);
							} else {
								// Otherwise, return a <delim-token> with its value set to the current input code point.
								type = TYPE.Delim;
								offset++;
							}

							break;

						// U+005B LEFT SQUARE BRACKET ([)
						case 0x005B:
							// Return a <[-token>.
							type = TYPE.LeftSquareBracket;
							offset++;
							break;

						// U+005C REVERSE SOLIDUS (\)
						case 0x005C:
							// If the input stream starts with a valid escape, ...
							if (isValidEscape(code, getCharCode(offset + 1))) {
								// ... reconsume the current input code point, consume an ident-like token, and return it.
								consumeIdentLikeToken();
							} else {
								// Otherwise, this is a parse error. Return a <delim-token> with its value set to the current input code point.
								type = TYPE.Delim;
								offset++;
							}
							break;

						// U+005D RIGHT SQUARE BRACKET (])
						case 0x005D:
							// Return a <]-token>.
							type = TYPE.RightSquareBracket;
							offset++;
							break;

						// U+007B LEFT CURLY BRACKET ({)
						case 0x007B:
							// Return a <{-token>.
							type = TYPE.LeftCurlyBracket;
							offset++;
							break;

						// U+007D RIGHT CURLY BRACKET (})
						case 0x007D:
							// Return a <}-token>.
							type = TYPE.RightCurlyBracket;
							offset++;
							break;

						// digit
						case charCodeCategory.Digit:
							// Reconsume the current input code point, consume a numeric token, and return it.
							consumeNumericToken();
							break;

						// name-start code point
						case charCodeCategory.NameStart:
							// Reconsume the current input code point, consume an ident-like token, and return it.
							consumeIdentLikeToken();
							break;

						// EOF
						case charCodeCategory.Eof:
							// Return an <EOF-token>.
							break;

						// anything else
						default:
							// Return a <delim-token> with its value set to the current input code point.
							type = TYPE.Delim;
							offset++;
					}

					switch (type) {
						case balanceCloseType:
							balancePrev = balanceStart & OFFSET_MASK;
							balanceStart = balance[balancePrev];
							balanceCloseType = balanceStart >> TYPE_SHIFT;
							balance[tokenCount] = balancePrev;
							balance[balancePrev++] = tokenCount;
							for (; balancePrev < tokenCount; balancePrev++) {
								if (balance[balancePrev] === sourceLength) {
									balance[balancePrev] = tokenCount;
								}
							}
							break;

						case TYPE.LeftParenthesis:
						case TYPE.Function:
							balance[tokenCount] = balanceStart;
							balanceCloseType = TYPE.RightParenthesis;
							balanceStart = (balanceCloseType << TYPE_SHIFT) | tokenCount;
							break;

						case TYPE.LeftSquareBracket:
							balance[tokenCount] = balanceStart;
							balanceCloseType = TYPE.RightSquareBracket;
							balanceStart = (balanceCloseType << TYPE_SHIFT) | tokenCount;
							break;

						case TYPE.LeftCurlyBracket:
							balance[tokenCount] = balanceStart;
							balanceCloseType = TYPE.RightCurlyBracket;
							balanceStart = (balanceCloseType << TYPE_SHIFT) | tokenCount;
							break;
					}

					offsetAndType[tokenCount++] = (type << TYPE_SHIFT) | offset;
				}

				// finalize buffers
				offsetAndType[tokenCount] = (TYPE.EOF << TYPE_SHIFT) | offset; // <EOF-token>
				balance[tokenCount] = sourceLength;
				balance[sourceLength] = sourceLength; // prevents false positive balance match with any token
				while (balanceStart !== 0) {
					balancePrev = balanceStart & OFFSET_MASK;
					balanceStart = balance[balancePrev];
					balance[balancePrev] = sourceLength;
				}

				// update stream
				stream.source = source;
				stream.firstCharOffset = start;
				stream.offsetAndType = offsetAndType;
				stream.tokenCount = tokenCount;
				stream.balance = balance;
				stream.reset();
				stream.next();

				return stream;
			}

			// extend tokenizer with constants
			Object.keys(constants).forEach(function (key) {
				tokenize[key] = constants[key];
			});

			// extend tokenizer with static methods from utils
			Object.keys(charCodeDefinitions).forEach(function (key) {
				tokenize[key] = charCodeDefinitions[key];
			});
			Object.keys(utils).forEach(function (key) {
				tokenize[key] = utils[key];
			});

			module.exports = tokenize;

		}, { "../common/TokenStream": 5, "../common/adopt-buffer": 6, "./char-code-definitions": 105, "./const": 106, "./utils": 108 }], 108: [function (require, module, exports) {
			var charCodeDef = require("./char-code-definitions");
			var isDigit = charCodeDef.isDigit;
			var isHexDigit = charCodeDef.isHexDigit;
			var isUppercaseLetter = charCodeDef.isUppercaseLetter;
			var isName = charCodeDef.isName;
			var isWhiteSpace = charCodeDef.isWhiteSpace;
			var isValidEscape = charCodeDef.isValidEscape;

			function getCharCode(source, offset) {
				return offset < source.length ? source.charCodeAt(offset) : 0;
			}

			function getNewlineLength(source, offset, code) {
				if (code === 13 /* \r */ && getCharCode(source, offset + 1) === 10 /* \n */) {
					return 2;
				}

				return 1;
			}

			function cmpChar(testStr, offset, referenceCode) {
				var code = testStr.charCodeAt(offset);

				// code.toLowerCase() for A..Z
				if (isUppercaseLetter(code)) {
					code = code | 32;
				}

				return code === referenceCode;
			}

			function cmpStr(testStr, start, end, referenceStr) {
				if (end - start !== referenceStr.length) {
					return false;
				}

				if (start < 0 || end > testStr.length) {
					return false;
				}

				for (var i = start; i < end; i++) {
					var testCode = testStr.charCodeAt(i);
					var referenceCode = referenceStr.charCodeAt(i - start);

					// testCode.toLowerCase() for A..Z
					if (isUppercaseLetter(testCode)) {
						testCode = testCode | 32;
					}

					if (testCode !== referenceCode) {
						return false;
					}
				}

				return true;
			}

			function findWhiteSpaceStart(source, offset) {
				for (; offset >= 0; offset--) {
					if (!isWhiteSpace(source.charCodeAt(offset))) {
						break;
					}
				}

				return offset + 1;
			}

			function findWhiteSpaceEnd(source, offset) {
				for (; offset < source.length; offset++) {
					if (!isWhiteSpace(source.charCodeAt(offset))) {
						break;
					}
				}

				return offset;
			}

			function findDecimalNumberEnd(source, offset) {
				for (; offset < source.length; offset++) {
					if (!isDigit(source.charCodeAt(offset))) {
						break;
					}
				}

				return offset;
			}

			// § 4.3.7. Consume an escaped code point
			function consumeEscaped(source, offset) {
				// It assumes that the U+005C REVERSE SOLIDUS (\) has already been consumed and
				// that the next input code point has already been verified to be part of a valid escape.
				offset += 2;

				// hex digit
				if (isHexDigit(getCharCode(source, offset - 1))) {
					// Consume as many hex digits as possible, but no more than 5.
					// Note that this means 1-6 hex digits have been consumed in total.
					for (var maxOffset = Math.min(source.length, offset + 5); offset < maxOffset; offset++) {
						if (!isHexDigit(getCharCode(source, offset))) {
							break;
						}
					}

					// If the next input code point is whitespace, consume it as well.
					var code = getCharCode(source, offset);
					if (isWhiteSpace(code)) {
						offset += getNewlineLength(source, offset, code);
					}
				}

				return offset;
			}

			// §4.3.11. Consume a name
			// Note: This algorithm does not do the verification of the first few code points that are necessary
			// to ensure the returned code points would constitute an <ident-token>. If that is the intended use,
			// ensure that the stream starts with an identifier before calling this algorithm.
			function consumeName(source, offset) {
				// Let result initially be an empty string.
				// Repeatedly consume the next input code point from the stream:
				for (; offset < source.length; offset++) {
					var code = source.charCodeAt(offset);

					// name code point
					if (isName(code)) {
						// Append the code point to result.
						continue;
					}

					// the stream starts with a valid escape
					if (isValidEscape(code, getCharCode(source, offset + 1))) {
						// Consume an escaped code point. Append the returned code point to result.
						offset = consumeEscaped(source, offset) - 1;
						continue;
					}

					// anything else
					// Reconsume the current input code point. Return result.
					break;
				}

				return offset;
			}

			// §4.3.12. Consume a number
			function consumeNumber(source, offset) {
				var code = source.charCodeAt(offset);

				// 2. If the next input code point is U+002B PLUS SIGN (+) or U+002D HYPHEN-MINUS (-),
				// consume it and append it to repr.
				if (code === 0x002B || code === 0x002D) {
					code = source.charCodeAt(offset += 1);
				}

				// 3. While the next input code point is a digit, consume it and append it to repr.
				if (isDigit(code)) {
					offset = findDecimalNumberEnd(source, offset + 1);
					code = source.charCodeAt(offset);
				}

				// 4. If the next 2 input code points are U+002E FULL STOP (.) followed by a digit, then:
				if (code === 0x002E && isDigit(source.charCodeAt(offset + 1))) {
					// 4.1 Consume them.
					// 4.2 Append them to repr.
					code = source.charCodeAt(offset += 2);

					// 4.3 Set type to "number".
					// TODO

					// 4.4 While the next input code point is a digit, consume it and append it to repr.

					offset = findDecimalNumberEnd(source, offset);
				}

				// 5. If the next 2 or 3 input code points are U+0045 LATIN CAPITAL LETTER E (E)
				// or U+0065 LATIN SMALL LETTER E (e), ... , followed by a digit, then:
				if (cmpChar(source, offset, 101 /* e */)) {
					var sign = 0;
					code = source.charCodeAt(offset + 1);

					// ... optionally followed by U+002D HYPHEN-MINUS (-) or U+002B PLUS SIGN (+) ...
					if (code === 0x002D || code === 0x002B) {
						sign = 1;
						code = source.charCodeAt(offset + 2);
					}

					// ... followed by a digit
					if (isDigit(code)) {
						// 5.1 Consume them.
						// 5.2 Append them to repr.

						// 5.3 Set type to "number".
						// TODO

						// 5.4 While the next input code point is a digit, consume it and append it to repr.
						offset = findDecimalNumberEnd(source, offset + 1 + sign + 1);
					}
				}

				return offset;
			}

			// § 4.3.14. Consume the remnants of a bad url
			// ... its sole use is to consume enough of the input stream to reach a recovery point
			// where normal tokenizing can resume.
			function consumeBadUrlRemnants(source, offset) {
				// Repeatedly consume the next input code point from the stream:
				for (; offset < source.length; offset++) {
					var code = source.charCodeAt(offset);

					// U+0029 RIGHT PARENTHESIS ())
					// EOF
					if (code === 0x0029) {
						// Return.
						offset++;
						break;
					}

					if (isValidEscape(code, getCharCode(source, offset + 1))) {
						// Consume an escaped code point.
						// Note: This allows an escaped right parenthesis ("\)") to be encountered
						// without ending the <bad-url-token>. This is otherwise identical to
						// the "anything else" clause.
						offset = consumeEscaped(source, offset);
					}
				}

				return offset;
			}

			module.exports = {
				consumeEscaped: consumeEscaped,
				consumeName: consumeName,
				consumeNumber: consumeNumber,
				consumeBadUrlRemnants: consumeBadUrlRemnants,

				cmpChar: cmpChar,
				cmpStr: cmpStr,

				getNewlineLength: getNewlineLength,
				findWhiteSpaceStart: findWhiteSpaceStart,
				findWhiteSpaceEnd: findWhiteSpaceEnd
			};

		}, { "./char-code-definitions": 105 }], 109: [function (require, module, exports) {
			var List = require("../common/List");

			module.exports = function clone(node) {
				var result = {};

				for (var key in node) {
					var value = node[key];

					if (value) {
						if (Array.isArray(value) || value instanceof List) {
							value = value.map(clone);
						} else if (value.constructor === Object) {
							value = clone(value);
						}
					}

					result[key] = value;
				}

				return result;
			};

		}, { "../common/List": 2 }], 110: [function (require, module, exports) {
			module.exports = function createCustomError(name, message) {
				// use Object.create(), because some VMs prevent setting line/column otherwise
				// (iOS Safari 10 even throws an exception)
				var error = Object.create(SyntaxError.prototype);
				var errorStack = new Error();

				error.name = name;
				error.message = message;

				Object.defineProperty(error, "stack", {
					get: function () {
						return (errorStack.stack || "").replace(/^(.+\n){1,3}/, name + ": " + message + "\n");
					}
				});

				return error;
			};

		}, {}], 111: [function (require, module, exports) {
			var hasOwnProperty = Object.prototype.hasOwnProperty;
			var keywords = Object.create(null);
			var properties = Object.create(null);
			var HYPHENMINUS = 45; // '-'.charCodeAt()

			function isCustomProperty(str, offset) {
				offset = offset || 0;

				return str.length - offset >= 2 &&
					str.charCodeAt(offset) === HYPHENMINUS &&
					str.charCodeAt(offset + 1) === HYPHENMINUS;
			}

			function getVendorPrefix(str, offset) {
				offset = offset || 0;

				// verdor prefix should be at least 3 chars length
				if (str.length - offset >= 3) {
					// vendor prefix starts with hyper minus following non-hyper minus
					if (str.charCodeAt(offset) === HYPHENMINUS &&
						str.charCodeAt(offset + 1) !== HYPHENMINUS) {
						// vendor prefix should contain a hyper minus at the ending
						var secondDashIndex = str.indexOf("-", offset + 2);

						if (secondDashIndex !== -1) {
							return str.substring(offset, secondDashIndex + 1);
						}
					}
				}

				return "";
			}

			function getKeywordDescriptor(keyword) {
				if (hasOwnProperty.call(keywords, keyword)) {
					return keywords[keyword];
				}

				var name = keyword.toLowerCase();

				if (hasOwnProperty.call(keywords, name)) {
					return keywords[keyword] = keywords[name];
				}

				var custom = isCustomProperty(name, 0);
				var vendor = !custom ? getVendorPrefix(name, 0) : "";

				return keywords[keyword] = Object.freeze({
					basename: name.substr(vendor.length),
					name: name,
					vendor: vendor,
					prefix: vendor,
					custom: custom
				});
			}

			function getPropertyDescriptor(property) {
				if (hasOwnProperty.call(properties, property)) {
					return properties[property];
				}

				var name = property;
				var hack = property[0];

				if (hack === "/") {
					hack = property[1] === "/" ? "//" : "/";
				} else if (hack !== "_" &&
					hack !== "*" &&
					hack !== "$" &&
					hack !== "#" &&
					hack !== "+" &&
					hack !== "&") {
					hack = "";
				}

				var custom = isCustomProperty(name, hack.length);

				// re-use result when possible (the same as for lower case)
				if (!custom) {
					name = name.toLowerCase();
					if (hasOwnProperty.call(properties, name)) {
						return properties[property] = properties[name];
					}
				}

				var vendor = !custom ? getVendorPrefix(name, hack.length) : "";
				var prefix = name.substr(0, hack.length + vendor.length);

				return properties[property] = Object.freeze({
					basename: name.substr(prefix.length),
					name: name.substr(hack.length),
					hack: hack,
					vendor: vendor,
					prefix: prefix,
					custom: custom
				});
			}

			module.exports = {
				keyword: getKeywordDescriptor,
				property: getPropertyDescriptor,
				isCustomProperty: isCustomProperty,
				vendorPrefix: getVendorPrefix
			};

		}, {}], 112: [function (require, module, exports) {
			var hasOwnProperty = Object.prototype.hasOwnProperty;
			var noop = function () { };

			function ensureFunction(value) {
				return typeof value === "function" ? value : noop;
			}

			function invokeForType(fn, type) {
				return function (node, item, list) {
					if (node.type === type) {
						fn.call(this, node, item, list);
					}
				};
			}

			function getWalkersFromStructure(name, nodeType) {
				var structure = nodeType.structure;
				var walkers = [];

				for (var key in structure) {
					if (hasOwnProperty.call(structure, key) === false) {
						continue;
					}

					var fieldTypes = structure[key];
					var walker = {
						name: key,
						type: false,
						nullable: false
					};

					if (!Array.isArray(structure[key])) {
						fieldTypes = [structure[key]];
					}

					for (var i = 0; i < fieldTypes.length; i++) {
						var fieldType = fieldTypes[i];
						if (fieldType === null) {
							walker.nullable = true;
						} else if (typeof fieldType === "string") {
							walker.type = "node";
						} else if (Array.isArray(fieldType)) {
							walker.type = "list";
						}
					}

					if (walker.type) {
						walkers.push(walker);
					}
				}

				if (walkers.length) {
					return {
						context: nodeType.walkContext,
						fields: walkers
					};
				}

				return null;
			}

			function getTypesFromConfig(config) {
				var types = {};

				for (var name in config.node) {
					if (hasOwnProperty.call(config.node, name)) {
						var nodeType = config.node[name];

						if (!nodeType.structure) {
							throw new Error("Missed `structure` field in `" + name + "` node type definition");
						}

						types[name] = getWalkersFromStructure(name, nodeType);
					}
				}

				return types;
			}

			function createTypeIterator(config, reverse) {
				var fields = reverse ? config.fields.slice().reverse() : config.fields;
				var body = fields.map(function (field) {
					var ref = "node." + field.name;
					var line;

					if (field.type === "list") {
						line = reverse
							? ref + ".forEachRight(walk);"
							: ref + ".forEach(walk);";
					} else {
						line = "walk(" + ref + ");";
					}

					if (field.nullable) {
						line = "if (" + ref + ") {\n    " + line + "}";
					}

					return line;
				});

				if (config.context) {
					body = [].concat(
						"var old = context." + config.context + ";",
						"context." + config.context + " = node;",
						body,
						"context." + config.context + " = old;"
					);
				}

				return new Function("node", "context", "walk", body.join("\n"));
			}

			function createFastTraveralMap(iterators) {
				return {
					Atrule: {
						StyleSheet: iterators.StyleSheet,
						Atrule: iterators.Atrule,
						Rule: iterators.Rule,
						Block: iterators.Block
					},
					Rule: {
						StyleSheet: iterators.StyleSheet,
						Atrule: iterators.Atrule,
						Rule: iterators.Rule,
						Block: iterators.Block
					},
					Declaration: {
						StyleSheet: iterators.StyleSheet,
						Atrule: iterators.Atrule,
						Rule: iterators.Rule,
						Block: iterators.Block
					}
				};
			}

			module.exports = function createWalker(config) {
				var types = getTypesFromConfig(config);
				var iteratorsNatural = {};
				var iteratorsReverse = {};

				for (var name in types) {
					if (hasOwnProperty.call(types, name) && types[name] !== null) {
						iteratorsNatural[name] = createTypeIterator(types[name], false);
						iteratorsReverse[name] = createTypeIterator(types[name], true);
					}
				}

				var fastTraversalIteratorsNatural = createFastTraveralMap(iteratorsNatural);
				var fastTraversalIteratorsReverse = createFastTraveralMap(iteratorsReverse);

				return function walk(root, options) {
					function walkNode(node, item, list) {
						enter.call(context, node, item, list);

						if (iterators.hasOwnProperty(node.type)) {
							iterators[node.type](node, context, walkNode);
						}

						leave.call(context, node, item, list);
					}

					var enter = noop;
					var leave = noop;
					var iterators = iteratorsNatural;
					var context = {
						root: root,
						stylesheet: null,
						atrule: null,
						atrulePrelude: null,
						rule: null,
						selector: null,
						block: null,
						declaration: null,
						function: null
					};

					if (typeof options === "function") {
						enter = options;
					} else if (options) {
						enter = ensureFunction(options.enter);
						leave = ensureFunction(options.leave);

						if (options.reverse) {
							iterators = iteratorsReverse;
						}

						if (options.visit) {
							if (fastTraversalIteratorsNatural.hasOwnProperty(options.visit)) {
								iterators = options.reverse
									? fastTraversalIteratorsReverse[options.visit]
									: fastTraversalIteratorsNatural[options.visit];
							} else if (!types.hasOwnProperty(options.visit)) {
								throw new Error("Bad value `" + options.visit + "` for `visit` option (should be: " + Object.keys(types).join(", ") + ")");
							}

							enter = invokeForType(enter, options.visit);
							leave = invokeForType(leave, options.visit);
						}
					}

					if (enter === noop && leave === noop) {
						throw new Error("Neither `enter` nor `leave` walker handler is set or both aren't a function");
					}

					// swap handlers in reverse mode to invert visit order
					if (options.reverse) {
						var tmp = enter;
						enter = leave;
						leave = tmp;
					}

					walkNode(root);
				};
			};

		}, {}], 113: [function (require, module, exports) {
			/* -*- Mode: js; js-indent-level: 2; -*- */
			/*
			 * Copyright 2011 Mozilla Foundation and contributors
			 * Licensed under the New BSD license. See LICENSE or:
			 * http://opensource.org/licenses/BSD-3-Clause
			 */

			var util = require("./util");
			var has = Object.prototype.hasOwnProperty;
			var hasNativeMap = typeof Map !== "undefined";

			/**
			 * A data structure which is a combination of an array and a set. Adding a new
			 * member is O(1), testing for membership is O(1), and finding the index of an
			 * element is O(1). Removing elements from the set is not supported. Only
			 * strings are supported for membership.
			 */
			function ArraySet() {
				this._array = [];
				this._set = hasNativeMap ? new Map() : Object.create(null);
			}

			/**
			 * Static method for creating ArraySet instances from an existing array.
			 */
			ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
				var set = new ArraySet();
				for (var i = 0, len = aArray.length; i < len; i++) {
					set.add(aArray[i], aAllowDuplicates);
				}
				return set;
			};

			/**
			 * Return how many unique items are in this ArraySet. If duplicates have been
			 * added, than those do not count towards the size.
			 *
			 * @returns Number
			 */
			ArraySet.prototype.size = function ArraySet_size() {
				return hasNativeMap ? this._set.size : Object.getOwnPropertyNames(this._set).length;
			};

			/**
			 * Add the given string to this set.
			 *
			 * @param String aStr
			 */
			ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
				var sStr = hasNativeMap ? aStr : util.toSetString(aStr);
				var isDuplicate = hasNativeMap ? this.has(aStr) : has.call(this._set, sStr);
				var idx = this._array.length;
				if (!isDuplicate || aAllowDuplicates) {
					this._array.push(aStr);
				}
				if (!isDuplicate) {
					if (hasNativeMap) {
						this._set.set(aStr, idx);
					} else {
						this._set[sStr] = idx;
					}
				}
			};

			/**
			 * Is the given string a member of this set?
			 *
			 * @param String aStr
			 */
			ArraySet.prototype.has = function ArraySet_has(aStr) {
				if (hasNativeMap) {
					return this._set.has(aStr);
				} else {
					var sStr = util.toSetString(aStr);
					return has.call(this._set, sStr);
				}
			};

			/**
			 * What is the index of the given string in the array?
			 *
			 * @param String aStr
			 */
			ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
				if (hasNativeMap) {
					var idx = this._set.get(aStr);
					if (idx >= 0) {
						return idx;
					}
				} else {
					var sStr = util.toSetString(aStr);
					if (has.call(this._set, sStr)) {
						return this._set[sStr];
					}
				}

				throw new Error("\"" + aStr + "\" is not in the set.");
			};

			/**
			 * What is the element at the given index?
			 *
			 * @param Number aIdx
			 */
			ArraySet.prototype.at = function ArraySet_at(aIdx) {
				if (aIdx >= 0 && aIdx < this._array.length) {
					return this._array[aIdx];
				}
				throw new Error("No element indexed by " + aIdx);
			};

			/**
			 * Returns the array representation of this set (which has the proper indices
			 * indicated by indexOf). Note that this is a copy of the internal array used
			 * for storing the members so that no one can mess with internal state.
			 */
			ArraySet.prototype.toArray = function ArraySet_toArray() {
				return this._array.slice();
			};

			exports.ArraySet = ArraySet;

		}, { "./util": 122 }], 114: [function (require, module, exports) {
			/* -*- Mode: js; js-indent-level: 2; -*- */
			/*
			 * Copyright 2011 Mozilla Foundation and contributors
			 * Licensed under the New BSD license. See LICENSE or:
			 * http://opensource.org/licenses/BSD-3-Clause
			 *
			 * Based on the Base 64 VLQ implementation in Closure Compiler:
			 * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
			 *
			 * Copyright 2011 The Closure Compiler Authors. All rights reserved.
			 * Redistribution and use in source and binary forms, with or without
			 * modification, are permitted provided that the following conditions are
			 * met:
			 *
			 *  * Redistributions of source code must retain the above copyright
			 *    notice, this list of conditions and the following disclaimer.
			 *  * Redistributions in binary form must reproduce the above
			 *    copyright notice, this list of conditions and the following
			 *    disclaimer in the documentation and/or other materials provided
			 *    with the distribution.
			 *  * Neither the name of Google Inc. nor the names of its
			 *    contributors may be used to endorse or promote products derived
			 *    from this software without specific prior written permission.
			 *
			 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
			 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
			 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
			 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
			 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
			 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
			 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
			 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
			 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
			 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
			 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
			 */

			var base64 = require("./base64");

			// A single base 64 digit can contain 6 bits of data. For the base 64 variable
			// length quantities we use in the source map spec, the first bit is the sign,
			// the next four bits are the actual value, and the 6th bit is the
			// continuation bit. The continuation bit tells us whether there are more
			// digits in this value following this digit.
			//
			//   Continuation
			//   |    Sign
			//   |    |
			//   V    V
			//   101011

			var VLQ_BASE_SHIFT = 5;

			// binary: 100000
			var VLQ_BASE = 1 << VLQ_BASE_SHIFT;

			// binary: 011111
			var VLQ_BASE_MASK = VLQ_BASE - 1;

			// binary: 100000
			var VLQ_CONTINUATION_BIT = VLQ_BASE;

			/**
			 * Converts from a two-complement value to a value where the sign bit is
			 * placed in the least significant bit.  For example, as decimals:
			 *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
			 *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
			 */
			function toVLQSigned(aValue) {
				return aValue < 0
					? ((-aValue) << 1) + 1
					: (aValue << 1) + 0;
			}

			/**
			 * Converts to a two-complement value from a value where the sign bit is
			 * placed in the least significant bit.  For example, as decimals:
			 *   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
			 *   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
			 */
			function fromVLQSigned(aValue) {
				var isNegative = (aValue & 1) === 1;
				var shifted = aValue >> 1;
				return isNegative
					? -shifted
					: shifted;
			}

			/**
			 * Returns the base 64 VLQ encoded value.
			 */
			exports.encode = function base64VLQ_encode(aValue) {
				var encoded = "";
				var digit;

				var vlq = toVLQSigned(aValue);

				do {
					digit = vlq & VLQ_BASE_MASK;
					vlq >>>= VLQ_BASE_SHIFT;
					if (vlq > 0) {
						// There are still more digits in this value, so we must make sure the
						// continuation bit is marked.
						digit |= VLQ_CONTINUATION_BIT;
					}
					encoded += base64.encode(digit);
				} while (vlq > 0);

				return encoded;
			};

			/**
			 * Decodes the next base 64 VLQ value from the given string and returns the
			 * value and the rest of the string via the out parameter.
			 */
			exports.decode = function base64VLQ_decode(aStr, aIndex, aOutParam) {
				var strLen = aStr.length;
				var result = 0;
				var shift = 0;
				var continuation, digit;

				do {
					if (aIndex >= strLen) {
						throw new Error("Expected more digits in base 64 VLQ value.");
					}

					digit = base64.decode(aStr.charCodeAt(aIndex++));
					if (digit === -1) {
						throw new Error("Invalid base64 digit: " + aStr.charAt(aIndex - 1));
					}

					continuation = !!(digit & VLQ_CONTINUATION_BIT);
					digit &= VLQ_BASE_MASK;
					result = result + (digit << shift);
					shift += VLQ_BASE_SHIFT;
				} while (continuation);

				aOutParam.value = fromVLQSigned(result);
				aOutParam.rest = aIndex;
			};

		}, { "./base64": 115 }], 115: [function (require, module, exports) {
			/* -*- Mode: js; js-indent-level: 2; -*- */
			/*
			 * Copyright 2011 Mozilla Foundation and contributors
			 * Licensed under the New BSD license. See LICENSE or:
			 * http://opensource.org/licenses/BSD-3-Clause
			 */

			var intToCharMap = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");

			/**
			 * Encode an integer in the range of 0 to 63 to a single base 64 digit.
			 */
			exports.encode = function (number) {
				if (0 <= number && number < intToCharMap.length) {
					return intToCharMap[number];
				}
				throw new TypeError("Must be between 0 and 63: " + number);
			};

			/**
			 * Decode a single base 64 character code digit to an integer. Returns -1 on
			 * failure.
			 */
			exports.decode = function (charCode) {
				var bigA = 65;     // 'A'
				var bigZ = 90;     // 'Z'

				var littleA = 97;  // 'a'
				var littleZ = 122; // 'z'

				var zero = 48;     // '0'
				var nine = 57;     // '9'

				var plus = 43;     // '+'
				var slash = 47;    // '/'

				var littleOffset = 26;
				var numberOffset = 52;

				// 0 - 25: ABCDEFGHIJKLMNOPQRSTUVWXYZ
				if (bigA <= charCode && charCode <= bigZ) {
					return (charCode - bigA);
				}

				// 26 - 51: abcdefghijklmnopqrstuvwxyz
				if (littleA <= charCode && charCode <= littleZ) {
					return (charCode - littleA + littleOffset);
				}

				// 52 - 61: 0123456789
				if (zero <= charCode && charCode <= nine) {
					return (charCode - zero + numberOffset);
				}

				// 62: +
				if (charCode == plus) {
					return 62;
				}

				// 63: /
				if (charCode == slash) {
					return 63;
				}

				// Invalid base64 digit.
				return -1;
			};

		}, {}], 116: [function (require, module, exports) {
			/* -*- Mode: js; js-indent-level: 2; -*- */
			/*
			 * Copyright 2011 Mozilla Foundation and contributors
			 * Licensed under the New BSD license. See LICENSE or:
			 * http://opensource.org/licenses/BSD-3-Clause
			 */

			exports.GREATEST_LOWER_BOUND = 1;
			exports.LEAST_UPPER_BOUND = 2;

			/**
			 * Recursive implementation of binary search.
			 *
			 * @param aLow Indices here and lower do not contain the needle.
			 * @param aHigh Indices here and higher do not contain the needle.
			 * @param aNeedle The element being searched for.
			 * @param aHaystack The non-empty array being searched.
			 * @param aCompare Function which takes two elements and returns -1, 0, or 1.
			 * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
			 *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
			 *     closest element that is smaller than or greater than the one we are
			 *     searching for, respectively, if the exact element cannot be found.
			 */
			function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare, aBias) {
				// This function terminates when one of the following is true:
				//
				//   1. We find the exact element we are looking for.
				//
				//   2. We did not find the exact element, but we can return the index of
				//      the next-closest element.
				//
				//   3. We did not find the exact element, and there is no next-closest
				//      element than the one we are searching for, so we return -1.
				var mid = Math.floor((aHigh - aLow) / 2) + aLow;
				var cmp = aCompare(aNeedle, aHaystack[mid], true);
				if (cmp === 0) {
					// Found the element we are looking for.
					return mid;
				}
				else if (cmp > 0) {
					// Our needle is greater than aHaystack[mid].
					if (aHigh - mid > 1) {
						// The element is in the upper half.
						return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare, aBias);
					}

					// The exact needle element was not found in this haystack. Determine if
					// we are in termination case (3) or (2) and return the appropriate thing.
					if (aBias == exports.LEAST_UPPER_BOUND) {
						return aHigh < aHaystack.length ? aHigh : -1;
					} else {
						return mid;
					}
				}
				else {
					// Our needle is less than aHaystack[mid].
					if (mid - aLow > 1) {
						// The element is in the lower half.
						return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare, aBias);
					}

					// we are in termination case (3) or (2) and return the appropriate thing.
					if (aBias == exports.LEAST_UPPER_BOUND) {
						return mid;
					} else {
						return aLow < 0 ? -1 : aLow;
					}
				}
			}

			/**
			 * This is an implementation of binary search which will always try and return
			 * the index of the closest element if there is no exact hit. This is because
			 * mappings between original and generated line/col pairs are single points,
			 * and there is an implicit region between each of them, so a miss just means
			 * that you aren't on the very start of a region.
			 *
			 * @param aNeedle The element you are looking for.
			 * @param aHaystack The array that is being searched.
			 * @param aCompare A function which takes the needle and an element in the
			 *     array and returns -1, 0, or 1 depending on whether the needle is less
			 *     than, equal to, or greater than the element, respectively.
			 * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
			 *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
			 *     closest element that is smaller than or greater than the one we are
			 *     searching for, respectively, if the exact element cannot be found.
			 *     Defaults to 'binarySearch.GREATEST_LOWER_BOUND'.
			 */
			exports.search = function search(aNeedle, aHaystack, aCompare, aBias) {
				if (aHaystack.length === 0) {
					return -1;
				}

				var index = recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack,
					aCompare, aBias || exports.GREATEST_LOWER_BOUND);
				if (index < 0) {
					return -1;
				}

				// We have found either the exact element, or the next-closest element than
				// the one we are searching for. However, there may be more than one such
				// element. Make sure we always return the smallest of these.
				while (index - 1 >= 0) {
					if (aCompare(aHaystack[index], aHaystack[index - 1], true) !== 0) {
						break;
					}
					--index;
				}

				return index;
			};

		}, {}], 117: [function (require, module, exports) {
			/* -*- Mode: js; js-indent-level: 2; -*- */
			/*
			 * Copyright 2014 Mozilla Foundation and contributors
			 * Licensed under the New BSD license. See LICENSE or:
			 * http://opensource.org/licenses/BSD-3-Clause
			 */

			var util = require("./util");

			/**
			 * Determine whether mappingB is after mappingA with respect to generated
			 * position.
			 */
			function generatedPositionAfter(mappingA, mappingB) {
				// Optimized for most common case
				var lineA = mappingA.generatedLine;
				var lineB = mappingB.generatedLine;
				var columnA = mappingA.generatedColumn;
				var columnB = mappingB.generatedColumn;
				return lineB > lineA || lineB == lineA && columnB >= columnA ||
					util.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0;
			}

			/**
			 * A data structure to provide a sorted view of accumulated mappings in a
			 * performance conscious manner. It trades a neglibable overhead in general
			 * case for a large speedup in case of mappings being added in order.
			 */
			function MappingList() {
				this._array = [];
				this._sorted = true;
				// Serves as infimum
				this._last = { generatedLine: -1, generatedColumn: 0 };
			}

			/**
			 * Iterate through internal items. This method takes the same arguments that
			 * `Array.prototype.forEach` takes.
			 *
			 * NOTE: The order of the mappings is NOT guaranteed.
			 */
			MappingList.prototype.unsortedForEach =
				function MappingList_forEach(aCallback, aThisArg) {
					this._array.forEach(aCallback, aThisArg);
				};

			/**
			 * Add the given source mapping.
			 *
			 * @param Object aMapping
			 */
			MappingList.prototype.add = function MappingList_add(aMapping) {
				if (generatedPositionAfter(this._last, aMapping)) {
					this._last = aMapping;
					this._array.push(aMapping);
				} else {
					this._sorted = false;
					this._array.push(aMapping);
				}
			};

			/**
			 * Returns the flat, sorted array of mappings. The mappings are sorted by
			 * generated position.
			 *
			 * WARNING: This method returns internal data without copying, for
			 * performance. The return value must NOT be mutated, and should be treated as
			 * an immutable borrow. If you want to take ownership, you must make your own
			 * copy.
			 */
			MappingList.prototype.toArray = function MappingList_toArray() {
				if (!this._sorted) {
					this._array.sort(util.compareByGeneratedPositionsInflated);
					this._sorted = true;
				}
				return this._array;
			};

			exports.MappingList = MappingList;

		}, { "./util": 122 }], 118: [function (require, module, exports) {
			/* -*- Mode: js; js-indent-level: 2; -*- */
			/*
			 * Copyright 2011 Mozilla Foundation and contributors
			 * Licensed under the New BSD license. See LICENSE or:
			 * http://opensource.org/licenses/BSD-3-Clause
			 */

			// It turns out that some (most?) JavaScript engines don't self-host
			// `Array.prototype.sort`. This makes sense because C++ will likely remain
			// faster than JS when doing raw CPU-intensive sorting. However, when using a
			// custom comparator function, calling back and forth between the VM's C++ and
			// JIT'd JS is rather slow *and* loses JIT type information, resulting in
			// worse generated code for the comparator function than would be optimal. In
			// fact, when sorting with a comparator, these costs outweigh the benefits of
			// sorting in C++. By using our own JS-implemented Quick Sort (below), we get
			// a ~3500ms mean speed-up in `bench/bench.html`.

			/**
			 * Swap the elements indexed by `x` and `y` in the array `ary`.
			 *
			 * @param {Array} ary
			 *        The array.
			 * @param {Number} x
			 *        The index of the first item.
			 * @param {Number} y
			 *        The index of the second item.
			 */
			function swap(ary, x, y) {
				var temp = ary[x];
				ary[x] = ary[y];
				ary[y] = temp;
			}

			/**
			 * Returns a random integer within the range `low .. high` inclusive.
			 *
			 * @param {Number} low
			 *        The lower bound on the range.
			 * @param {Number} high
			 *        The upper bound on the range.
			 */
			function randomIntInRange(low, high) {
				return Math.round(low + (Math.random() * (high - low)));
			}

			/**
			 * The Quick Sort algorithm.
			 *
			 * @param {Array} ary
			 *        An array to sort.
			 * @param {function} comparator
			 *        Function to use to compare two items.
			 * @param {Number} p
			 *        Start index of the array
			 * @param {Number} r
			 *        End index of the array
			 */
			function doQuickSort(ary, comparator, p, r) {
				// If our lower bound is less than our upper bound, we (1) partition the
				// array into two pieces and (2) recurse on each half. If it is not, this is
				// the empty array and our base case.

				if (p < r) {
					// (1) Partitioning.
					//
					// The partitioning chooses a pivot between `p` and `r` and moves all
					// elements that are less than or equal to the pivot to the before it, and
					// all the elements that are greater than it after it. The effect is that
					// once partition is done, the pivot is in the exact place it will be when
					// the array is put in sorted order, and it will not need to be moved
					// again. This runs in O(n) time.

					// Always choose a random pivot so that an input array which is reverse
					// sorted does not cause O(n^2) running time.
					var pivotIndex = randomIntInRange(p, r);
					var i = p - 1;

					swap(ary, pivotIndex, r);
					var pivot = ary[r];

					// Immediately after `j` is incremented in this loop, the following hold
					// true:
					//
					//   * Every element in `ary[p .. i]` is less than or equal to the pivot.
					//
					//   * Every element in `ary[i+1 .. j-1]` is greater than the pivot.
					for (var j = p; j < r; j++) {
						if (comparator(ary[j], pivot) <= 0) {
							i += 1;
							swap(ary, i, j);
						}
					}

					swap(ary, i + 1, j);
					var q = i + 1;

					// (2) Recurse on each half.

					doQuickSort(ary, comparator, p, q - 1);
					doQuickSort(ary, comparator, q + 1, r);
				}
			}

			/**
			 * Sort the given array in-place with the given comparator function.
			 *
			 * @param {Array} ary
			 *        An array to sort.
			 * @param {function} comparator
			 *        Function to use to compare two items.
			 */
			exports.quickSort = function (ary, comparator) {
				doQuickSort(ary, comparator, 0, ary.length - 1);
			};

		}, {}], 119: [function (require, module, exports) {
			/* -*- Mode: js; js-indent-level: 2; -*- */
			/*
			 * Copyright 2011 Mozilla Foundation and contributors
			 * Licensed under the New BSD license. See LICENSE or:
			 * http://opensource.org/licenses/BSD-3-Clause
			 */

			var util = require("./util");
			var binarySearch = require("./binary-search");
			var ArraySet = require("./array-set").ArraySet;
			var base64VLQ = require("./base64-vlq");
			var quickSort = require("./quick-sort").quickSort;

			function SourceMapConsumer(aSourceMap) {
				var sourceMap = aSourceMap;
				if (typeof aSourceMap === "string") {
					sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ""));
				}

				return sourceMap.sections != null
					? new IndexedSourceMapConsumer(sourceMap)
					: new BasicSourceMapConsumer(sourceMap);
			}

			SourceMapConsumer.fromSourceMap = function (aSourceMap) {
				return BasicSourceMapConsumer.fromSourceMap(aSourceMap);
			};

			/**
			 * The version of the source mapping spec that we are consuming.
			 */
			SourceMapConsumer.prototype._version = 3;

			// `__generatedMappings` and `__originalMappings` are arrays that hold the
			// parsed mapping coordinates from the source map's "mappings" attribute. They
			// are lazily instantiated, accessed via the `_generatedMappings` and
			// `_originalMappings` getters respectively, and we only parse the mappings
			// and create these arrays once queried for a source location. We jump through
			// these hoops because there can be many thousands of mappings, and parsing
			// them is expensive, so we only want to do it if we must.
			//
			// Each object in the arrays is of the form:
			//
			//     {
			//       generatedLine: The line number in the generated code,
			//       generatedColumn: The column number in the generated code,
			//       source: The path to the original source file that generated this
			//               chunk of code,
			//       originalLine: The line number in the original source that
			//                     corresponds to this chunk of generated code,
			//       originalColumn: The column number in the original source that
			//                       corresponds to this chunk of generated code,
			//       name: The name of the original symbol which generated this chunk of
			//             code.
			//     }
			//
			// All properties except for `generatedLine` and `generatedColumn` can be
			// `null`.
			//
			// `_generatedMappings` is ordered by the generated positions.
			//
			// `_originalMappings` is ordered by the original positions.

			SourceMapConsumer.prototype.__generatedMappings = null;
			Object.defineProperty(SourceMapConsumer.prototype, "_generatedMappings", {
				get: function () {
					if (!this.__generatedMappings) {
						this._parseMappings(this._mappings, this.sourceRoot);
					}

					return this.__generatedMappings;
				}
			});

			SourceMapConsumer.prototype.__originalMappings = null;
			Object.defineProperty(SourceMapConsumer.prototype, "_originalMappings", {
				get: function () {
					if (!this.__originalMappings) {
						this._parseMappings(this._mappings, this.sourceRoot);
					}

					return this.__originalMappings;
				}
			});

			SourceMapConsumer.prototype._charIsMappingSeparator =
				function SourceMapConsumer_charIsMappingSeparator(aStr, index) {
					var c = aStr.charAt(index);
					return c === ";" || c === ",";
				};

			/**
			 * Parse the mappings in a string in to a data structure which we can easily
			 * query (the ordered arrays in the `this.__generatedMappings` and
			 * `this.__originalMappings` properties).
			 */
			SourceMapConsumer.prototype._parseMappings =
				function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
					throw new Error("Subclasses must implement _parseMappings");
				};

			SourceMapConsumer.GENERATED_ORDER = 1;
			SourceMapConsumer.ORIGINAL_ORDER = 2;

			SourceMapConsumer.GREATEST_LOWER_BOUND = 1;
			SourceMapConsumer.LEAST_UPPER_BOUND = 2;

			/**
			 * Iterate over each mapping between an original source/line/column and a
			 * generated line/column in this source map.
			 *
			 * @param Function aCallback
			 *        The function that is called with each mapping.
			 * @param Object aContext
			 *        Optional. If specified, this object will be the value of `this` every
			 *        time that `aCallback` is called.
			 * @param aOrder
			 *        Either `SourceMapConsumer.GENERATED_ORDER` or
			 *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
			 *        iterate over the mappings sorted by the generated file's line/column
			 *        order or the original's source/line/column order, respectively. Defaults to
			 *        `SourceMapConsumer.GENERATED_ORDER`.
			 */
			SourceMapConsumer.prototype.eachMapping =
				function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
					var context = aContext || null;
					var order = aOrder || SourceMapConsumer.GENERATED_ORDER;

					var mappings;
					switch (order) {
						case SourceMapConsumer.GENERATED_ORDER:
							mappings = this._generatedMappings;
							break;
						case SourceMapConsumer.ORIGINAL_ORDER:
							mappings = this._originalMappings;
							break;
						default:
							throw new Error("Unknown order of iteration.");
					}

					var sourceRoot = this.sourceRoot;
					mappings.map(function (mapping) {
						var source = mapping.source === null ? null : this._sources.at(mapping.source);
						if (source != null && sourceRoot != null) {
							source = util.join(sourceRoot, source);
						}
						return {
							source: source,
							generatedLine: mapping.generatedLine,
							generatedColumn: mapping.generatedColumn,
							originalLine: mapping.originalLine,
							originalColumn: mapping.originalColumn,
							name: mapping.name === null ? null : this._names.at(mapping.name)
						};
					}, this).forEach(aCallback, context);
				};

			/**
			 * Returns all generated line and column information for the original source,
			 * line, and column provided. If no column is provided, returns all mappings
			 * corresponding to a either the line we are searching for or the next
			 * closest line that has any mappings. Otherwise, returns all mappings
			 * corresponding to the given line and either the column we are searching for
			 * or the next closest column that has any offsets.
			 *
			 * The only argument is an object with the following properties:
			 *
			 *   - source: The filename of the original source.
			 *   - line: The line number in the original source.
			 *   - column: Optional. the column number in the original source.
			 *
			 * and an array of objects is returned, each with the following properties:
			 *
			 *   - line: The line number in the generated source, or null.
			 *   - column: The column number in the generated source, or null.
			 */
			SourceMapConsumer.prototype.allGeneratedPositionsFor =
				function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
					var line = util.getArg(aArgs, "line");

					// When there is no exact match, BasicSourceMapConsumer.prototype._findMapping
					// returns the index of the closest mapping less than the needle. By
					// setting needle.originalColumn to 0, we thus find the last mapping for
					// the given line, provided such a mapping exists.
					var needle = {
						source: util.getArg(aArgs, "source"),
						originalLine: line,
						originalColumn: util.getArg(aArgs, "column", 0)
					};

					if (this.sourceRoot != null) {
						needle.source = util.relative(this.sourceRoot, needle.source);
					}
					if (!this._sources.has(needle.source)) {
						return [];
					}
					needle.source = this._sources.indexOf(needle.source);

					var mappings = [];

					var index = this._findMapping(needle,
						this._originalMappings,
						"originalLine",
						"originalColumn",
						util.compareByOriginalPositions,
						binarySearch.LEAST_UPPER_BOUND);
					if (index >= 0) {
						var mapping = this._originalMappings[index];

						if (aArgs.column === undefined) {
							var originalLine = mapping.originalLine;

							// Iterate until either we run out of mappings, or we run into
							// a mapping for a different line than the one we found. Since
							// mappings are sorted, this is guaranteed to find all mappings for
							// the line we found.
							while (mapping && mapping.originalLine === originalLine) {
								mappings.push({
									line: util.getArg(mapping, "generatedLine", null),
									column: util.getArg(mapping, "generatedColumn", null),
									lastColumn: util.getArg(mapping, "lastGeneratedColumn", null)
								});

								mapping = this._originalMappings[++index];
							}
						} else {
							var originalColumn = mapping.originalColumn;

							// Iterate until either we run out of mappings, or we run into
							// a mapping for a different line than the one we were searching for.
							// Since mappings are sorted, this is guaranteed to find all mappings for
							// the line we are searching for.
							while (mapping &&
								mapping.originalLine === line &&
								mapping.originalColumn == originalColumn) {
								mappings.push({
									line: util.getArg(mapping, "generatedLine", null),
									column: util.getArg(mapping, "generatedColumn", null),
									lastColumn: util.getArg(mapping, "lastGeneratedColumn", null)
								});

								mapping = this._originalMappings[++index];
							}
						}
					}

					return mappings;
				};

			exports.SourceMapConsumer = SourceMapConsumer;

			/**
			 * A BasicSourceMapConsumer instance represents a parsed source map which we can
			 * query for information about the original file positions by giving it a file
			 * position in the generated source.
			 *
			 * The only parameter is the raw source map (either as a JSON string, or
			 * already parsed to an object). According to the spec, source maps have the
			 * following attributes:
			 *
			 *   - version: Which version of the source map spec this map is following.
			 *   - sources: An array of URLs to the original source files.
			 *   - names: An array of identifiers which can be referrenced by individual mappings.
			 *   - sourceRoot: Optional. The URL root from which all sources are relative.
			 *   - sourcesContent: Optional. An array of contents of the original source files.
			 *   - mappings: A string of base64 VLQs which contain the actual mappings.
			 *   - file: Optional. The generated file this source map is associated with.
			 *
			 * Here is an example source map, taken from the source map spec[0]:
			 *
			 *     {
			 *       version : 3,
			 *       file: "out.js",
			 *       sourceRoot : "",
			 *       sources: ["foo.js", "bar.js"],
			 *       names: ["src", "maps", "are", "fun"],
			 *       mappings: "AA,AB;;ABCDE;"
			 *     }
			 *
			 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
			 */
			function BasicSourceMapConsumer(aSourceMap) {
				var sourceMap = aSourceMap;
				if (typeof aSourceMap === "string") {
					sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ""));
				}

				var version = util.getArg(sourceMap, "version");
				var sources = util.getArg(sourceMap, "sources");
				// Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
				// requires the array) to play nice here.
				var names = util.getArg(sourceMap, "names", []);
				var sourceRoot = util.getArg(sourceMap, "sourceRoot", null);
				var sourcesContent = util.getArg(sourceMap, "sourcesContent", null);
				var mappings = util.getArg(sourceMap, "mappings");
				var file = util.getArg(sourceMap, "file", null);

				// Once again, Sass deviates from the spec and supplies the version as a
				// string rather than a number, so we use loose equality checking here.
				if (version != this._version) {
					throw new Error("Unsupported version: " + version);
				}

				sources = sources
					.map(String)
					// Some source maps produce relative source paths like "./foo.js" instead of
					// "foo.js".  Normalize these first so that future comparisons will succeed.
					// See bugzil.la/1090768.
					.map(util.normalize)
					// Always ensure that absolute sources are internally stored relative to
					// the source root, if the source root is absolute. Not doing this would
					// be particularly problematic when the source root is a prefix of the
					// source (valid, but why??). See github issue #199 and bugzil.la/1188982.
					.map(function (source) {
						return sourceRoot && util.isAbsolute(sourceRoot) && util.isAbsolute(source)
							? util.relative(sourceRoot, source)
							: source;
					});

				// Pass `true` below to allow duplicate names and sources. While source maps
				// are intended to be compressed and deduplicated, the TypeScript compiler
				// sometimes generates source maps with duplicates in them. See Github issue
				// #72 and bugzil.la/889492.
				this._names = ArraySet.fromArray(names.map(String), true);
				this._sources = ArraySet.fromArray(sources, true);

				this.sourceRoot = sourceRoot;
				this.sourcesContent = sourcesContent;
				this._mappings = mappings;
				this.file = file;
			}

			BasicSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
			BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer;

			/**
			 * Create a BasicSourceMapConsumer from a SourceMapGenerator.
			 *
			 * @param SourceMapGenerator aSourceMap
			 *        The source map that will be consumed.
			 * @returns BasicSourceMapConsumer
			 */
			BasicSourceMapConsumer.fromSourceMap =
				function SourceMapConsumer_fromSourceMap(aSourceMap) {
					var smc = Object.create(BasicSourceMapConsumer.prototype);

					var names = smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
					var sources = smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
					smc.sourceRoot = aSourceMap._sourceRoot;
					smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(),
						smc.sourceRoot);
					smc.file = aSourceMap._file;

					// Because we are modifying the entries (by converting string sources and
					// names to indices into the sources and names ArraySets), we have to make
					// a copy of the entry or else bad things happen. Shared mutable state
					// strikes again! See github issue #191.

					var generatedMappings = aSourceMap._mappings.toArray().slice();
					var destGeneratedMappings = smc.__generatedMappings = [];
					var destOriginalMappings = smc.__originalMappings = [];

					for (var i = 0, length = generatedMappings.length; i < length; i++) {
						var srcMapping = generatedMappings[i];
						var destMapping = new Mapping;
						destMapping.generatedLine = srcMapping.generatedLine;
						destMapping.generatedColumn = srcMapping.generatedColumn;

						if (srcMapping.source) {
							destMapping.source = sources.indexOf(srcMapping.source);
							destMapping.originalLine = srcMapping.originalLine;
							destMapping.originalColumn = srcMapping.originalColumn;

							if (srcMapping.name) {
								destMapping.name = names.indexOf(srcMapping.name);
							}

							destOriginalMappings.push(destMapping);
						}

						destGeneratedMappings.push(destMapping);
					}

					quickSort(smc.__originalMappings, util.compareByOriginalPositions);

					return smc;
				};

			/**
			 * The version of the source mapping spec that we are consuming.
			 */
			BasicSourceMapConsumer.prototype._version = 3;

			/**
			 * The list of original sources.
			 */
			Object.defineProperty(BasicSourceMapConsumer.prototype, "sources", {
				get: function () {
					return this._sources.toArray().map(function (s) {
						return this.sourceRoot != null ? util.join(this.sourceRoot, s) : s;
					}, this);
				}
			});

			/**
			 * Provide the JIT with a nice shape / hidden class.
			 */
			function Mapping() {
				this.generatedLine = 0;
				this.generatedColumn = 0;
				this.source = null;
				this.originalLine = null;
				this.originalColumn = null;
				this.name = null;
			}

			/**
			 * Parse the mappings in a string in to a data structure which we can easily
			 * query (the ordered arrays in the `this.__generatedMappings` and
			 * `this.__originalMappings` properties).
			 */
			BasicSourceMapConsumer.prototype._parseMappings =
				function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
					var generatedLine = 1;
					var previousGeneratedColumn = 0;
					var previousOriginalLine = 0;
					var previousOriginalColumn = 0;
					var previousSource = 0;
					var previousName = 0;
					var length = aStr.length;
					var index = 0;
					var cachedSegments = {};
					var temp = {};
					var originalMappings = [];
					var generatedMappings = [];
					var mapping, str, segment, end, value;

					while (index < length) {
						if (aStr.charAt(index) === ";") {
							generatedLine++;
							index++;
							previousGeneratedColumn = 0;
						}
						else if (aStr.charAt(index) === ",") {
							index++;
						}
						else {
							mapping = new Mapping();
							mapping.generatedLine = generatedLine;

							// Because each offset is encoded relative to the previous one,
							// many segments often have the same encoding. We can exploit this
							// fact by caching the parsed variable length fields of each segment,
							// allowing us to avoid a second parse if we encounter the same
							// segment again.
							for (end = index; end < length; end++) {
								if (this._charIsMappingSeparator(aStr, end)) {
									break;
								}
							}
							str = aStr.slice(index, end);

							segment = cachedSegments[str];
							if (segment) {
								index += str.length;
							} else {
								segment = [];
								while (index < end) {
									base64VLQ.decode(aStr, index, temp);
									value = temp.value;
									index = temp.rest;
									segment.push(value);
								}

								if (segment.length === 2) {
									throw new Error("Found a source, but no line and column");
								}

								if (segment.length === 3) {
									throw new Error("Found a source and line, but no column");
								}

								cachedSegments[str] = segment;
							}

							// Generated column.
							mapping.generatedColumn = previousGeneratedColumn + segment[0];
							previousGeneratedColumn = mapping.generatedColumn;

							if (segment.length > 1) {
								// Original source.
								mapping.source = previousSource + segment[1];
								previousSource += segment[1];

								// Original line.
								mapping.originalLine = previousOriginalLine + segment[2];
								previousOriginalLine = mapping.originalLine;
								// Lines are stored 0-based
								mapping.originalLine += 1;

								// Original column.
								mapping.originalColumn = previousOriginalColumn + segment[3];
								previousOriginalColumn = mapping.originalColumn;

								if (segment.length > 4) {
									// Original name.
									mapping.name = previousName + segment[4];
									previousName += segment[4];
								}
							}

							generatedMappings.push(mapping);
							if (typeof mapping.originalLine === "number") {
								originalMappings.push(mapping);
							}
						}
					}

					quickSort(generatedMappings, util.compareByGeneratedPositionsDeflated);
					this.__generatedMappings = generatedMappings;

					quickSort(originalMappings, util.compareByOriginalPositions);
					this.__originalMappings = originalMappings;
				};

			/**
			 * Find the mapping that best matches the hypothetical "needle" mapping that
			 * we are searching for in the given "haystack" of mappings.
			 */
			BasicSourceMapConsumer.prototype._findMapping =
				function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName,
					aColumnName, aComparator, aBias) {
					// To return the position we are searching for, we must first find the
					// mapping for the given position and then return the opposite position it
					// points to. Because the mappings are sorted, we can use binary search to
					// find the best mapping.

					if (aNeedle[aLineName] <= 0) {
						throw new TypeError("Line must be greater than or equal to 1, got "
							+ aNeedle[aLineName]);
					}
					if (aNeedle[aColumnName] < 0) {
						throw new TypeError("Column must be greater than or equal to 0, got "
							+ aNeedle[aColumnName]);
					}

					return binarySearch.search(aNeedle, aMappings, aComparator, aBias);
				};

			/**
			 * Compute the last column for each generated mapping. The last column is
			 * inclusive.
			 */
			BasicSourceMapConsumer.prototype.computeColumnSpans =
				function SourceMapConsumer_computeColumnSpans() {
					for (var index = 0; index < this._generatedMappings.length; ++index) {
						var mapping = this._generatedMappings[index];

						// Mappings do not contain a field for the last generated columnt. We
						// can come up with an optimistic estimate, however, by assuming that
						// mappings are contiguous (i.e. given two consecutive mappings, the
						// first mapping ends where the second one starts).
						if (index + 1 < this._generatedMappings.length) {
							var nextMapping = this._generatedMappings[index + 1];

							if (mapping.generatedLine === nextMapping.generatedLine) {
								mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
								continue;
							}
						}

						// The last mapping for each line spans the entire line.
						mapping.lastGeneratedColumn = Infinity;
					}
				};

			/**
			 * Returns the original source, line, and column information for the generated
			 * source's line and column positions provided. The only argument is an object
			 * with the following properties:
			 *
			 *   - line: The line number in the generated source.
			 *   - column: The column number in the generated source.
			 *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
			 *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
			 *     closest element that is smaller than or greater than the one we are
			 *     searching for, respectively, if the exact element cannot be found.
			 *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
			 *
			 * and an object is returned with the following properties:
			 *
			 *   - source: The original source file, or null.
			 *   - line: The line number in the original source, or null.
			 *   - column: The column number in the original source, or null.
			 *   - name: The original identifier, or null.
			 */
			BasicSourceMapConsumer.prototype.originalPositionFor =
				function SourceMapConsumer_originalPositionFor(aArgs) {
					var needle = {
						generatedLine: util.getArg(aArgs, "line"),
						generatedColumn: util.getArg(aArgs, "column")
					};

					var index = this._findMapping(
						needle,
						this._generatedMappings,
						"generatedLine",
						"generatedColumn",
						util.compareByGeneratedPositionsDeflated,
						util.getArg(aArgs, "bias", SourceMapConsumer.GREATEST_LOWER_BOUND)
					);

					if (index >= 0) {
						var mapping = this._generatedMappings[index];

						if (mapping.generatedLine === needle.generatedLine) {
							var source = util.getArg(mapping, "source", null);
							if (source !== null) {
								source = this._sources.at(source);
								if (this.sourceRoot != null) {
									source = util.join(this.sourceRoot, source);
								}
							}
							var name = util.getArg(mapping, "name", null);
							if (name !== null) {
								name = this._names.at(name);
							}
							return {
								source: source,
								line: util.getArg(mapping, "originalLine", null),
								column: util.getArg(mapping, "originalColumn", null),
								name: name
							};
						}
					}

					return {
						source: null,
						line: null,
						column: null,
						name: null
					};
				};

			/**
			 * Return true if we have the source content for every source in the source
			 * map, false otherwise.
			 */
			BasicSourceMapConsumer.prototype.hasContentsOfAllSources =
				function BasicSourceMapConsumer_hasContentsOfAllSources() {
					if (!this.sourcesContent) {
						return false;
					}
					return this.sourcesContent.length >= this._sources.size() &&
						!this.sourcesContent.some(function (sc) { return sc == null; });
				};

			/**
			 * Returns the original source content. The only argument is the url of the
			 * original source file. Returns null if no original source content is
			 * available.
			 */
			BasicSourceMapConsumer.prototype.sourceContentFor =
				function SourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
					if (!this.sourcesContent) {
						return null;
					}

					if (this.sourceRoot != null) {
						aSource = util.relative(this.sourceRoot, aSource);
					}

					if (this._sources.has(aSource)) {
						return this.sourcesContent[this._sources.indexOf(aSource)];
					}

					var url;
					if (this.sourceRoot != null
						&& (url = util.urlParse(this.sourceRoot))) {
						// XXX: file:// URIs and absolute paths lead to unexpected behavior for
						// many users. We can help them out when they expect file:// URIs to
						// behave like it would if they were running a local HTTP server. See
						// https://bugzilla.mozilla.org/show_bug.cgi?id=885597.
						var fileUriAbsPath = aSource.replace(/^file:\/\//, "");
						if (url.scheme == "file"
							&& this._sources.has(fileUriAbsPath)) {
							return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)];
						}

						if ((!url.path || url.path == "/")
							&& this._sources.has("/" + aSource)) {
							return this.sourcesContent[this._sources.indexOf("/" + aSource)];
						}
					}

					// This function is used recursively from
					// IndexedSourceMapConsumer.prototype.sourceContentFor. In that case, we
					// don't want to throw if we can't find the source - we just want to
					// return null, so we provide a flag to exit gracefully.
					if (nullOnMissing) {
						return null;
					}
					else {
						throw new Error("\"" + aSource + "\" is not in the SourceMap.");
					}
				};

			/**
			 * Returns the generated line and column information for the original source,
			 * line, and column positions provided. The only argument is an object with
			 * the following properties:
			 *
			 *   - source: The filename of the original source.
			 *   - line: The line number in the original source.
			 *   - column: The column number in the original source.
			 *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
			 *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
			 *     closest element that is smaller than or greater than the one we are
			 *     searching for, respectively, if the exact element cannot be found.
			 *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
			 *
			 * and an object is returned with the following properties:
			 *
			 *   - line: The line number in the generated source, or null.
			 *   - column: The column number in the generated source, or null.
			 */
			BasicSourceMapConsumer.prototype.generatedPositionFor =
				function SourceMapConsumer_generatedPositionFor(aArgs) {
					var source = util.getArg(aArgs, "source");
					if (this.sourceRoot != null) {
						source = util.relative(this.sourceRoot, source);
					}
					if (!this._sources.has(source)) {
						return {
							line: null,
							column: null,
							lastColumn: null
						};
					}
					source = this._sources.indexOf(source);

					var needle = {
						source: source,
						originalLine: util.getArg(aArgs, "line"),
						originalColumn: util.getArg(aArgs, "column")
					};

					var index = this._findMapping(
						needle,
						this._originalMappings,
						"originalLine",
						"originalColumn",
						util.compareByOriginalPositions,
						util.getArg(aArgs, "bias", SourceMapConsumer.GREATEST_LOWER_BOUND)
					);

					if (index >= 0) {
						var mapping = this._originalMappings[index];

						if (mapping.source === needle.source) {
							return {
								line: util.getArg(mapping, "generatedLine", null),
								column: util.getArg(mapping, "generatedColumn", null),
								lastColumn: util.getArg(mapping, "lastGeneratedColumn", null)
							};
						}
					}

					return {
						line: null,
						column: null,
						lastColumn: null
					};
				};

			exports.BasicSourceMapConsumer = BasicSourceMapConsumer;

			/**
			 * An IndexedSourceMapConsumer instance represents a parsed source map which
			 * we can query for information. It differs from BasicSourceMapConsumer in
			 * that it takes "indexed" source maps (i.e. ones with a "sections" field) as
			 * input.
			 *
			 * The only parameter is a raw source map (either as a JSON string, or already
			 * parsed to an object). According to the spec for indexed source maps, they
			 * have the following attributes:
			 *
			 *   - version: Which version of the source map spec this map is following.
			 *   - file: Optional. The generated file this source map is associated with.
			 *   - sections: A list of section definitions.
			 *
			 * Each value under the "sections" field has two fields:
			 *   - offset: The offset into the original specified at which this section
			 *       begins to apply, defined as an object with a "line" and "column"
			 *       field.
			 *   - map: A source map definition. This source map could also be indexed,
			 *       but doesn't have to be.
			 *
			 * Instead of the "map" field, it's also possible to have a "url" field
			 * specifying a URL to retrieve a source map from, but that's currently
			 * unsupported.
			 *
			 * Here's an example source map, taken from the source map spec[0], but
			 * modified to omit a section which uses the "url" field.
			 *
			 *  {
			 *    version : 3,
			 *    file: "app.js",
			 *    sections: [{
			 *      offset: {line:100, column:10},
			 *      map: {
			 *        version : 3,
			 *        file: "section.js",
			 *        sources: ["foo.js", "bar.js"],
			 *        names: ["src", "maps", "are", "fun"],
			 *        mappings: "AAAA,E;;ABCDE;"
			 *      }
			 *    }],
			 *  }
			 *
			 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit#heading=h.535es3xeprgt
			 */
			function IndexedSourceMapConsumer(aSourceMap) {
				var sourceMap = aSourceMap;
				if (typeof aSourceMap === "string") {
					sourceMap = JSON.parse(aSourceMap.replace(/^\)\]\}'/, ""));
				}

				var version = util.getArg(sourceMap, "version");
				var sections = util.getArg(sourceMap, "sections");

				if (version != this._version) {
					throw new Error("Unsupported version: " + version);
				}

				this._sources = new ArraySet();
				this._names = new ArraySet();

				var lastOffset = {
					line: -1,
					column: 0
				};
				this._sections = sections.map(function (s) {
					if (s.url) {
						// The url field will require support for asynchronicity.
						// See https://github.com/mozilla/source-map/issues/16
						throw new Error("Support for url field in sections not implemented.");
					}
					var offset = util.getArg(s, "offset");
					var offsetLine = util.getArg(offset, "line");
					var offsetColumn = util.getArg(offset, "column");

					if (offsetLine < lastOffset.line ||
						(offsetLine === lastOffset.line && offsetColumn < lastOffset.column)) {
						throw new Error("Section offsets must be ordered and non-overlapping.");
					}
					lastOffset = offset;

					return {
						generatedOffset: {
							// The offset fields are 0-based, but we use 1-based indices when
							// encoding/decoding from VLQ.
							generatedLine: offsetLine + 1,
							generatedColumn: offsetColumn + 1
						},
						consumer: new SourceMapConsumer(util.getArg(s, "map"))
					};
				});
			}

			IndexedSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
			IndexedSourceMapConsumer.prototype.constructor = SourceMapConsumer;

			/**
			 * The version of the source mapping spec that we are consuming.
			 */
			IndexedSourceMapConsumer.prototype._version = 3;

			/**
			 * The list of original sources.
			 */
			Object.defineProperty(IndexedSourceMapConsumer.prototype, "sources", {
				get: function () {
					var sources = [];
					for (var i = 0; i < this._sections.length; i++) {
						for (var j = 0; j < this._sections[i].consumer.sources.length; j++) {
							sources.push(this._sections[i].consumer.sources[j]);
						}
					}
					return sources;
				}
			});

			/**
			 * Returns the original source, line, and column information for the generated
			 * source's line and column positions provided. The only argument is an object
			 * with the following properties:
			 *
			 *   - line: The line number in the generated source.
			 *   - column: The column number in the generated source.
			 *
			 * and an object is returned with the following properties:
			 *
			 *   - source: The original source file, or null.
			 *   - line: The line number in the original source, or null.
			 *   - column: The column number in the original source, or null.
			 *   - name: The original identifier, or null.
			 */
			IndexedSourceMapConsumer.prototype.originalPositionFor =
				function IndexedSourceMapConsumer_originalPositionFor(aArgs) {
					var needle = {
						generatedLine: util.getArg(aArgs, "line"),
						generatedColumn: util.getArg(aArgs, "column")
					};

					// Find the section containing the generated position we're trying to map
					// to an original position.
					var sectionIndex = binarySearch.search(needle, this._sections,
						function (needle, section) {
							var cmp = needle.generatedLine - section.generatedOffset.generatedLine;
							if (cmp) {
								return cmp;
							}

							return (needle.generatedColumn -
								section.generatedOffset.generatedColumn);
						});
					var section = this._sections[sectionIndex];

					if (!section) {
						return {
							source: null,
							line: null,
							column: null,
							name: null
						};
					}

					return section.consumer.originalPositionFor({
						line: needle.generatedLine -
							(section.generatedOffset.generatedLine - 1),
						column: needle.generatedColumn -
							(section.generatedOffset.generatedLine === needle.generatedLine
								? section.generatedOffset.generatedColumn - 1
								: 0),
						bias: aArgs.bias
					});
				};

			/**
			 * Return true if we have the source content for every source in the source
			 * map, false otherwise.
			 */
			IndexedSourceMapConsumer.prototype.hasContentsOfAllSources =
				function IndexedSourceMapConsumer_hasContentsOfAllSources() {
					return this._sections.every(function (s) {
						return s.consumer.hasContentsOfAllSources();
					});
				};

			/**
			 * Returns the original source content. The only argument is the url of the
			 * original source file. Returns null if no original source content is
			 * available.
			 */
			IndexedSourceMapConsumer.prototype.sourceContentFor =
				function IndexedSourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
					for (var i = 0; i < this._sections.length; i++) {
						var section = this._sections[i];

						var content = section.consumer.sourceContentFor(aSource, true);
						if (content) {
							return content;
						}
					}
					if (nullOnMissing) {
						return null;
					}
					else {
						throw new Error("\"" + aSource + "\" is not in the SourceMap.");
					}
				};

			/**
			 * Returns the generated line and column information for the original source,
			 * line, and column positions provided. The only argument is an object with
			 * the following properties:
			 *
			 *   - source: The filename of the original source.
			 *   - line: The line number in the original source.
			 *   - column: The column number in the original source.
			 *
			 * and an object is returned with the following properties:
			 *
			 *   - line: The line number in the generated source, or null.
			 *   - column: The column number in the generated source, or null.
			 */
			IndexedSourceMapConsumer.prototype.generatedPositionFor =
				function IndexedSourceMapConsumer_generatedPositionFor(aArgs) {
					for (var i = 0; i < this._sections.length; i++) {
						var section = this._sections[i];

						// Only consider this section if the requested source is in the list of
						// sources of the consumer.
						if (section.consumer.sources.indexOf(util.getArg(aArgs, "source")) === -1) {
							continue;
						}
						var generatedPosition = section.consumer.generatedPositionFor(aArgs);
						if (generatedPosition) {
							var ret = {
								line: generatedPosition.line +
									(section.generatedOffset.generatedLine - 1),
								column: generatedPosition.column +
									(section.generatedOffset.generatedLine === generatedPosition.line
										? section.generatedOffset.generatedColumn - 1
										: 0)
							};
							return ret;
						}
					}

					return {
						line: null,
						column: null
					};
				};

			/**
			 * Parse the mappings in a string in to a data structure which we can easily
			 * query (the ordered arrays in the `this.__generatedMappings` and
			 * `this.__originalMappings` properties).
			 */
			IndexedSourceMapConsumer.prototype._parseMappings =
				function IndexedSourceMapConsumer_parseMappings(aStr, aSourceRoot) {
					this.__generatedMappings = [];
					this.__originalMappings = [];
					for (var i = 0; i < this._sections.length; i++) {
						var section = this._sections[i];
						var sectionMappings = section.consumer._generatedMappings;
						for (var j = 0; j < sectionMappings.length; j++) {
							var mapping = sectionMappings[j];

							var source = section.consumer._sources.at(mapping.source);
							if (section.consumer.sourceRoot !== null) {
								source = util.join(section.consumer.sourceRoot, source);
							}
							this._sources.add(source);
							source = this._sources.indexOf(source);

							var name = section.consumer._names.at(mapping.name);
							this._names.add(name);
							name = this._names.indexOf(name);

							// The mappings coming from the consumer for the section have
							// generated positions relative to the start of the section, so we
							// need to offset them to be relative to the start of the concatenated
							// generated file.
							var adjustedMapping = {
								source: source,
								generatedLine: mapping.generatedLine +
									(section.generatedOffset.generatedLine - 1),
								generatedColumn: mapping.generatedColumn +
									(section.generatedOffset.generatedLine === mapping.generatedLine
										? section.generatedOffset.generatedColumn - 1
										: 0),
								originalLine: mapping.originalLine,
								originalColumn: mapping.originalColumn,
								name: name
							};

							this.__generatedMappings.push(adjustedMapping);
							if (typeof adjustedMapping.originalLine === "number") {
								this.__originalMappings.push(adjustedMapping);
							}
						}
					}

					quickSort(this.__generatedMappings, util.compareByGeneratedPositionsDeflated);
					quickSort(this.__originalMappings, util.compareByOriginalPositions);
				};

			exports.IndexedSourceMapConsumer = IndexedSourceMapConsumer;

		}, { "./array-set": 113, "./base64-vlq": 114, "./binary-search": 116, "./quick-sort": 118, "./util": 122 }], 120: [function (require, module, exports) {
			/* -*- Mode: js; js-indent-level: 2; -*- */
			/*
			 * Copyright 2011 Mozilla Foundation and contributors
			 * Licensed under the New BSD license. See LICENSE or:
			 * http://opensource.org/licenses/BSD-3-Clause
			 */

			var base64VLQ = require("./base64-vlq");
			var util = require("./util");
			var ArraySet = require("./array-set").ArraySet;
			var MappingList = require("./mapping-list").MappingList;

			/**
			 * An instance of the SourceMapGenerator represents a source map which is
			 * being built incrementally. You may pass an object with the following
			 * properties:
			 *
			 *   - file: The filename of the generated source.
			 *   - sourceRoot: A root for all relative URLs in this source map.
			 */
			function SourceMapGenerator(aArgs) {
				if (!aArgs) {
					aArgs = {};
				}
				this._file = util.getArg(aArgs, "file", null);
				this._sourceRoot = util.getArg(aArgs, "sourceRoot", null);
				this._skipValidation = util.getArg(aArgs, "skipValidation", false);
				this._sources = new ArraySet();
				this._names = new ArraySet();
				this._mappings = new MappingList();
				this._sourcesContents = null;
			}

			SourceMapGenerator.prototype._version = 3;

			/**
			 * Creates a new SourceMapGenerator based on a SourceMapConsumer
			 *
			 * @param aSourceMapConsumer The SourceMap.
			 */
			SourceMapGenerator.fromSourceMap =
				function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
					var sourceRoot = aSourceMapConsumer.sourceRoot;
					var generator = new SourceMapGenerator({
						file: aSourceMapConsumer.file,
						sourceRoot: sourceRoot
					});
					aSourceMapConsumer.eachMapping(function (mapping) {
						var newMapping = {
							generated: {
								line: mapping.generatedLine,
								column: mapping.generatedColumn
							}
						};

						if (mapping.source != null) {
							newMapping.source = mapping.source;
							if (sourceRoot != null) {
								newMapping.source = util.relative(sourceRoot, newMapping.source);
							}

							newMapping.original = {
								line: mapping.originalLine,
								column: mapping.originalColumn
							};

							if (mapping.name != null) {
								newMapping.name = mapping.name;
							}
						}

						generator.addMapping(newMapping);
					});
					aSourceMapConsumer.sources.forEach(function (sourceFile) {
						var content = aSourceMapConsumer.sourceContentFor(sourceFile);
						if (content != null) {
							generator.setSourceContent(sourceFile, content);
						}
					});
					return generator;
				};

			/**
			 * Add a single mapping from original source line and column to the generated
			 * source's line and column for this source map being created. The mapping
			 * object should have the following properties:
			 *
			 *   - generated: An object with the generated line and column positions.
			 *   - original: An object with the original line and column positions.
			 *   - source: The original source file (relative to the sourceRoot).
			 *   - name: An optional original token name for this mapping.
			 */
			SourceMapGenerator.prototype.addMapping =
				function SourceMapGenerator_addMapping(aArgs) {
					var generated = util.getArg(aArgs, "generated");
					var original = util.getArg(aArgs, "original", null);
					var source = util.getArg(aArgs, "source", null);
					var name = util.getArg(aArgs, "name", null);

					if (!this._skipValidation) {
						this._validateMapping(generated, original, source, name);
					}

					if (source != null) {
						source = String(source);
						if (!this._sources.has(source)) {
							this._sources.add(source);
						}
					}

					if (name != null) {
						name = String(name);
						if (!this._names.has(name)) {
							this._names.add(name);
						}
					}

					this._mappings.add({
						generatedLine: generated.line,
						generatedColumn: generated.column,
						originalLine: original != null && original.line,
						originalColumn: original != null && original.column,
						source: source,
						name: name
					});
				};

			/**
			 * Set the source content for a source file.
			 */
			SourceMapGenerator.prototype.setSourceContent =
				function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
					var source = aSourceFile;
					if (this._sourceRoot != null) {
						source = util.relative(this._sourceRoot, source);
					}

					if (aSourceContent != null) {
						// Add the source content to the _sourcesContents map.
						// Create a new _sourcesContents map if the property is null.
						if (!this._sourcesContents) {
							this._sourcesContents = Object.create(null);
						}
						this._sourcesContents[util.toSetString(source)] = aSourceContent;
					} else if (this._sourcesContents) {
						// Remove the source file from the _sourcesContents map.
						// If the _sourcesContents map is empty, set the property to null.
						delete this._sourcesContents[util.toSetString(source)];
						if (Object.keys(this._sourcesContents).length === 0) {
							this._sourcesContents = null;
						}
					}
				};

			/**
			 * Applies the mappings of a sub-source-map for a specific source file to the
			 * source map being generated. Each mapping to the supplied source file is
			 * rewritten using the supplied source map. Note: The resolution for the
			 * resulting mappings is the minimium of this map and the supplied map.
			 *
			 * @param aSourceMapConsumer The source map to be applied.
			 * @param aSourceFile Optional. The filename of the source file.
			 *        If omitted, SourceMapConsumer's file property will be used.
			 * @param aSourceMapPath Optional. The dirname of the path to the source map
			 *        to be applied. If relative, it is relative to the SourceMapConsumer.
			 *        This parameter is needed when the two source maps aren't in the same
			 *        directory, and the source map to be applied contains relative source
			 *        paths. If so, those relative source paths need to be rewritten
			 *        relative to the SourceMapGenerator.
			 */
			SourceMapGenerator.prototype.applySourceMap =
				function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
					var sourceFile = aSourceFile;
					// If aSourceFile is omitted, we will use the file property of the SourceMap
					if (aSourceFile == null) {
						if (aSourceMapConsumer.file == null) {
							throw new Error(
								"SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, " +
								"or the source map's \"file\" property. Both were omitted."
							);
						}
						sourceFile = aSourceMapConsumer.file;
					}
					var sourceRoot = this._sourceRoot;
					// Make "sourceFile" relative if an absolute Url is passed.
					if (sourceRoot != null) {
						sourceFile = util.relative(sourceRoot, sourceFile);
					}
					// Applying the SourceMap can add and remove items from the sources and
					// the names array.
					var newSources = new ArraySet();
					var newNames = new ArraySet();

					// Find mappings for the "sourceFile"
					this._mappings.unsortedForEach(function (mapping) {
						if (mapping.source === sourceFile && mapping.originalLine != null) {
							// Check if it can be mapped by the source map, then update the mapping.
							var original = aSourceMapConsumer.originalPositionFor({
								line: mapping.originalLine,
								column: mapping.originalColumn
							});
							if (original.source != null) {
								// Copy mapping
								mapping.source = original.source;
								if (aSourceMapPath != null) {
									mapping.source = util.join(aSourceMapPath, mapping.source);
								}
								if (sourceRoot != null) {
									mapping.source = util.relative(sourceRoot, mapping.source);
								}
								mapping.originalLine = original.line;
								mapping.originalColumn = original.column;
								if (original.name != null) {
									mapping.name = original.name;
								}
							}
						}

						var source = mapping.source;
						if (source != null && !newSources.has(source)) {
							newSources.add(source);
						}

						var name = mapping.name;
						if (name != null && !newNames.has(name)) {
							newNames.add(name);
						}

					}, this);
					this._sources = newSources;
					this._names = newNames;

					// Copy sourcesContents of applied map.
					aSourceMapConsumer.sources.forEach(function (sourceFile) {
						var content = aSourceMapConsumer.sourceContentFor(sourceFile);
						if (content != null) {
							if (aSourceMapPath != null) {
								sourceFile = util.join(aSourceMapPath, sourceFile);
							}
							if (sourceRoot != null) {
								sourceFile = util.relative(sourceRoot, sourceFile);
							}
							this.setSourceContent(sourceFile, content);
						}
					}, this);
				};

			/**
			 * A mapping can have one of the three levels of data:
			 *
			 *   1. Just the generated position.
			 *   2. The Generated position, original position, and original source.
			 *   3. Generated and original position, original source, as well as a name
			 *      token.
			 *
			 * To maintain consistency, we validate that any new mapping being added falls
			 * in to one of these categories.
			 */
			SourceMapGenerator.prototype._validateMapping =
				function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource,
					aName) {
					// When aOriginal is truthy but has empty values for .line and .column,
					// it is most likely a programmer error. In this case we throw a very
					// specific error message to try to guide them the right way.
					// For example: https://github.com/Polymer/polymer-bundler/pull/519
					if (aOriginal && typeof aOriginal.line !== "number" && typeof aOriginal.column !== "number") {
						throw new Error(
							"original.line and original.column are not numbers -- you probably meant to omit " +
							"the original mapping entirely and only map the generated position. If so, pass " +
							"null for the original mapping instead of an object with empty or null values."
						);
					}

					if (aGenerated && "line" in aGenerated && "column" in aGenerated
						&& aGenerated.line > 0 && aGenerated.column >= 0
						&& !aOriginal && !aSource && !aName) {
						// Case 1.
						return;
					}
					else if (aGenerated && "line" in aGenerated && "column" in aGenerated
						&& aOriginal && "line" in aOriginal && "column" in aOriginal
						&& aGenerated.line > 0 && aGenerated.column >= 0
						&& aOriginal.line > 0 && aOriginal.column >= 0
						&& aSource) {
						// Cases 2 and 3.
						return;
					}
					else {
						throw new Error("Invalid mapping: " + JSON.stringify({
							generated: aGenerated,
							source: aSource,
							original: aOriginal,
							name: aName
						}));
					}
				};

			/**
			 * Serialize the accumulated mappings in to the stream of base 64 VLQs
			 * specified by the source map format.
			 */
			SourceMapGenerator.prototype._serializeMappings =
				function SourceMapGenerator_serializeMappings() {
					var previousGeneratedColumn = 0;
					var previousGeneratedLine = 1;
					var previousOriginalColumn = 0;
					var previousOriginalLine = 0;
					var previousName = 0;
					var previousSource = 0;
					var result = "";
					var next;
					var mapping;
					var nameIdx;
					var sourceIdx;

					var mappings = this._mappings.toArray();
					for (var i = 0, len = mappings.length; i < len; i++) {
						mapping = mappings[i];
						next = "";

						if (mapping.generatedLine !== previousGeneratedLine) {
							previousGeneratedColumn = 0;
							while (mapping.generatedLine !== previousGeneratedLine) {
								next += ";";
								previousGeneratedLine++;
							}
						}
						else {
							if (i > 0) {
								if (!util.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) {
									continue;
								}
								next += ",";
							}
						}

						next += base64VLQ.encode(mapping.generatedColumn
							- previousGeneratedColumn);
						previousGeneratedColumn = mapping.generatedColumn;

						if (mapping.source != null) {
							sourceIdx = this._sources.indexOf(mapping.source);
							next += base64VLQ.encode(sourceIdx - previousSource);
							previousSource = sourceIdx;

							// lines are stored 0-based in SourceMap spec version 3
							next += base64VLQ.encode(mapping.originalLine - 1
								- previousOriginalLine);
							previousOriginalLine = mapping.originalLine - 1;

							next += base64VLQ.encode(mapping.originalColumn
								- previousOriginalColumn);
							previousOriginalColumn = mapping.originalColumn;

							if (mapping.name != null) {
								nameIdx = this._names.indexOf(mapping.name);
								next += base64VLQ.encode(nameIdx - previousName);
								previousName = nameIdx;
							}
						}

						result += next;
					}

					return result;
				};

			SourceMapGenerator.prototype._generateSourcesContent =
				function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
					return aSources.map(function (source) {
						if (!this._sourcesContents) {
							return null;
						}
						if (aSourceRoot != null) {
							source = util.relative(aSourceRoot, source);
						}
						var key = util.toSetString(source);
						return Object.prototype.hasOwnProperty.call(this._sourcesContents, key)
							? this._sourcesContents[key]
							: null;
					}, this);
				};

			/**
			 * Externalize the source map.
			 */
			SourceMapGenerator.prototype.toJSON =
				function SourceMapGenerator_toJSON() {
					var map = {
						version: this._version,
						sources: this._sources.toArray(),
						names: this._names.toArray(),
						mappings: this._serializeMappings()
					};
					if (this._file != null) {
						map.file = this._file;
					}
					if (this._sourceRoot != null) {
						map.sourceRoot = this._sourceRoot;
					}
					if (this._sourcesContents) {
						map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
					}

					return map;
				};

			/**
			 * Render the source map being generated to a string.
			 */
			SourceMapGenerator.prototype.toString =
				function SourceMapGenerator_toString() {
					return JSON.stringify(this.toJSON());
				};

			exports.SourceMapGenerator = SourceMapGenerator;

		}, { "./array-set": 113, "./base64-vlq": 114, "./mapping-list": 117, "./util": 122 }], 121: [function (require, module, exports) {
			/* -*- Mode: js; js-indent-level: 2; -*- */
			/*
			 * Copyright 2011 Mozilla Foundation and contributors
			 * Licensed under the New BSD license. See LICENSE or:
			 * http://opensource.org/licenses/BSD-3-Clause
			 */

			var SourceMapGenerator = require("./source-map-generator").SourceMapGenerator;
			var util = require("./util");

			// Matches a Windows-style `\r\n` newline or a `\n` newline used by all other
			// operating systems these days (capturing the result).
			var REGEX_NEWLINE = /(\r?\n)/;

			// Newline character code for charCodeAt() comparisons
			var NEWLINE_CODE = 10;

			// Private symbol for identifying `SourceNode`s when multiple versions of
			// the source-map library are loaded. This MUST NOT CHANGE across
			// versions!
			var isSourceNode = "$$$isSourceNode$$$";

			/**
			 * SourceNodes provide a way to abstract over interpolating/concatenating
			 * snippets of generated JavaScript source code while maintaining the line and
			 * column information associated with the original source code.
			 *
			 * @param aLine The original line number.
			 * @param aColumn The original column number.
			 * @param aSource The original source's filename.
			 * @param aChunks Optional. An array of strings which are snippets of
			 *        generated JS, or other SourceNodes.
			 * @param aName The original identifier.
			 */
			function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
				this.children = [];
				this.sourceContents = {};
				this.line = aLine == null ? null : aLine;
				this.column = aColumn == null ? null : aColumn;
				this.source = aSource == null ? null : aSource;
				this.name = aName == null ? null : aName;
				this[isSourceNode] = true;
				if (aChunks != null) this.add(aChunks);
			}

			/**
			 * Creates a SourceNode from generated code and a SourceMapConsumer.
			 *
			 * @param aGeneratedCode The generated code
			 * @param aSourceMapConsumer The SourceMap for the generated code
			 * @param aRelativePath Optional. The path that relative sources in the
			 *        SourceMapConsumer should be relative to.
			 */
			SourceNode.fromStringWithSourceMap =
				function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
					// The SourceNode we want to fill with the generated code
					// and the SourceMap
					var node = new SourceNode();

					// All even indices of this array are one line of the generated code,
					// while all odd indices are the newlines between two adjacent lines
					// (since `REGEX_NEWLINE` captures its match).
					// Processed fragments are accessed by calling `shiftNextLine`.
					var remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
					var remainingLinesIndex = 0;
					var shiftNextLine = function () {
						var lineContents = getNextLine();
						// The last line of a file might not have a newline.
						var newLine = getNextLine() || "";
						return lineContents + newLine;

						function getNextLine() {
							return remainingLinesIndex < remainingLines.length ?
								remainingLines[remainingLinesIndex++] : undefined;
						}
					};

					// We need to remember the position of "remainingLines"
					var lastGeneratedLine = 1, lastGeneratedColumn = 0;

					// The generate SourceNodes we need a code range.
					// To extract it current and last mapping is used.
					// Here we store the last mapping.
					var lastMapping = null;

					aSourceMapConsumer.eachMapping(function (mapping) {
						if (lastMapping !== null) {
							// We add the code from "lastMapping" to "mapping":
							// First check if there is a new line in between.
							if (lastGeneratedLine < mapping.generatedLine) {
								// Associate first line with "lastMapping"
								addMappingWithCode(lastMapping, shiftNextLine());
								lastGeneratedLine++;
								lastGeneratedColumn = 0;
								// The remaining code is added without mapping
							} else {
								// There is no new line in between.
								// Associate the code between "lastGeneratedColumn" and
								// "mapping.generatedColumn" with "lastMapping"
								var nextLine = remainingLines[remainingLinesIndex];
								var code = nextLine.substr(0, mapping.generatedColumn -
									lastGeneratedColumn);
								remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn -
									lastGeneratedColumn);
								lastGeneratedColumn = mapping.generatedColumn;
								addMappingWithCode(lastMapping, code);
								// No more remaining code, continue
								lastMapping = mapping;
								return;
							}
						}
						// We add the generated code until the first mapping
						// to the SourceNode without any mapping.
						// Each line is added as separate string.
						while (lastGeneratedLine < mapping.generatedLine) {
							node.add(shiftNextLine());
							lastGeneratedLine++;
						}
						if (lastGeneratedColumn < mapping.generatedColumn) {
							var nextLine = remainingLines[remainingLinesIndex];
							node.add(nextLine.substr(0, mapping.generatedColumn));
							remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn);
							lastGeneratedColumn = mapping.generatedColumn;
						}
						lastMapping = mapping;
					}, this);
					// We have processed all mappings.
					if (remainingLinesIndex < remainingLines.length) {
						if (lastMapping) {
							// Associate the remaining code in the current line with "lastMapping"
							addMappingWithCode(lastMapping, shiftNextLine());
						}
						// and add the remaining lines without any mapping
						node.add(remainingLines.splice(remainingLinesIndex).join(""));
					}

					// Copy sourcesContent into SourceNode
					aSourceMapConsumer.sources.forEach(function (sourceFile) {
						var content = aSourceMapConsumer.sourceContentFor(sourceFile);
						if (content != null) {
							if (aRelativePath != null) {
								sourceFile = util.join(aRelativePath, sourceFile);
							}
							node.setSourceContent(sourceFile, content);
						}
					});

					return node;

					function addMappingWithCode(mapping, code) {
						if (mapping === null || mapping.source === undefined) {
							node.add(code);
						} else {
							var source = aRelativePath
								? util.join(aRelativePath, mapping.source)
								: mapping.source;
							node.add(new SourceNode(mapping.originalLine,
								mapping.originalColumn,
								source,
								code,
								mapping.name));
						}
					}
				};

			/**
			 * Add a chunk of generated JS to this source node.
			 *
			 * @param aChunk A string snippet of generated JS code, another instance of
			 *        SourceNode, or an array where each member is one of those things.
			 */
			SourceNode.prototype.add = function SourceNode_add(aChunk) {
				if (Array.isArray(aChunk)) {
					aChunk.forEach(function (chunk) {
						this.add(chunk);
					}, this);
				}
				else if (aChunk[isSourceNode] || typeof aChunk === "string") {
					if (aChunk) {
						this.children.push(aChunk);
					}
				}
				else {
					throw new TypeError(
						"Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
					);
				}
				return this;
			};

			/**
			 * Add a chunk of generated JS to the beginning of this source node.
			 *
			 * @param aChunk A string snippet of generated JS code, another instance of
			 *        SourceNode, or an array where each member is one of those things.
			 */
			SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
				if (Array.isArray(aChunk)) {
					for (var i = aChunk.length - 1; i >= 0; i--) {
						this.prepend(aChunk[i]);
					}
				}
				else if (aChunk[isSourceNode] || typeof aChunk === "string") {
					this.children.unshift(aChunk);
				}
				else {
					throw new TypeError(
						"Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
					);
				}
				return this;
			};

			/**
			 * Walk over the tree of JS snippets in this node and its children. The
			 * walking function is called once for each snippet of JS and is passed that
			 * snippet and the its original associated source's line/column location.
			 *
			 * @param aFn The traversal function.
			 */
			SourceNode.prototype.walk = function SourceNode_walk(aFn) {
				var chunk;
				for (var i = 0, len = this.children.length; i < len; i++) {
					chunk = this.children[i];
					if (chunk[isSourceNode]) {
						chunk.walk(aFn);
					}
					else {
						if (chunk !== "") {
							aFn(chunk, {
								source: this.source,
								line: this.line,
								column: this.column,
								name: this.name
							});
						}
					}
				}
			};

			/**
			 * Like `String.prototype.join` except for SourceNodes. Inserts `aStr` between
			 * each of `this.children`.
			 *
			 * @param aSep The separator.
			 */
			SourceNode.prototype.join = function SourceNode_join(aSep) {
				var newChildren;
				var i;
				var len = this.children.length;
				if (len > 0) {
					newChildren = [];
					for (i = 0; i < len - 1; i++) {
						newChildren.push(this.children[i]);
						newChildren.push(aSep);
					}
					newChildren.push(this.children[i]);
					this.children = newChildren;
				}
				return this;
			};

			/**
			 * Call String.prototype.replace on the very right-most source snippet. Useful
			 * for trimming whitespace from the end of a source node, etc.
			 *
			 * @param aPattern The pattern to replace.
			 * @param aReplacement The thing to replace the pattern with.
			 */
			SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
				var lastChild = this.children[this.children.length - 1];
				if (lastChild[isSourceNode]) {
					lastChild.replaceRight(aPattern, aReplacement);
				}
				else if (typeof lastChild === "string") {
					this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
				}
				else {
					this.children.push("".replace(aPattern, aReplacement));
				}
				return this;
			};

			/**
			 * Set the source content for a source file. This will be added to the SourceMapGenerator
			 * in the sourcesContent field.
			 *
			 * @param aSourceFile The filename of the source file
			 * @param aSourceContent The content of the source file
			 */
			SourceNode.prototype.setSourceContent =
				function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
					this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
				};

			/**
			 * Walk over the tree of SourceNodes. The walking function is called for each
			 * source file content and is passed the filename and source content.
			 *
			 * @param aFn The traversal function.
			 */
			SourceNode.prototype.walkSourceContents =
				function SourceNode_walkSourceContents(aFn) {
					for (var i = 0, len = this.children.length; i < len; i++) {
						if (this.children[i][isSourceNode]) {
							this.children[i].walkSourceContents(aFn);
						}
					}

					var sources = Object.keys(this.sourceContents);
					for (var i = 0, len = sources.length; i < len; i++) {
						aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
					}
				};

			/**
			 * Return the string representation of this source node. Walks over the tree
			 * and concatenates all the various snippets together to one string.
			 */
			SourceNode.prototype.toString = function SourceNode_toString() {
				var str = "";
				this.walk(function (chunk) {
					str += chunk;
				});
				return str;
			};

			/**
			 * Returns the string representation of this source node along with a source
			 * map.
			 */
			SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
				var generated = {
					code: "",
					line: 1,
					column: 0
				};
				var map = new SourceMapGenerator(aArgs);
				var sourceMappingActive = false;
				var lastOriginalSource = null;
				var lastOriginalLine = null;
				var lastOriginalColumn = null;
				var lastOriginalName = null;
				this.walk(function (chunk, original) {
					generated.code += chunk;
					if (original.source !== null
						&& original.line !== null
						&& original.column !== null) {
						if (lastOriginalSource !== original.source
							|| lastOriginalLine !== original.line
							|| lastOriginalColumn !== original.column
							|| lastOriginalName !== original.name) {
							map.addMapping({
								source: original.source,
								original: {
									line: original.line,
									column: original.column
								},
								generated: {
									line: generated.line,
									column: generated.column
								},
								name: original.name
							});
						}
						lastOriginalSource = original.source;
						lastOriginalLine = original.line;
						lastOriginalColumn = original.column;
						lastOriginalName = original.name;
						sourceMappingActive = true;
					} else if (sourceMappingActive) {
						map.addMapping({
							generated: {
								line: generated.line,
								column: generated.column
							}
						});
						lastOriginalSource = null;
						sourceMappingActive = false;
					}
					for (var idx = 0, length = chunk.length; idx < length; idx++) {
						if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
							generated.line++;
							generated.column = 0;
							// Mappings end at eol
							if (idx + 1 === length) {
								lastOriginalSource = null;
								sourceMappingActive = false;
							} else if (sourceMappingActive) {
								map.addMapping({
									source: original.source,
									original: {
										line: original.line,
										column: original.column
									},
									generated: {
										line: generated.line,
										column: generated.column
									},
									name: original.name
								});
							}
						} else {
							generated.column++;
						}
					}
				});
				this.walkSourceContents(function (sourceFile, sourceContent) {
					map.setSourceContent(sourceFile, sourceContent);
				});

				return { code: generated.code, map: map };
			};

			exports.SourceNode = SourceNode;

		}, { "./source-map-generator": 120, "./util": 122 }], 122: [function (require, module, exports) {
			/* -*- Mode: js; js-indent-level: 2; -*- */
			/*
			 * Copyright 2011 Mozilla Foundation and contributors
			 * Licensed under the New BSD license. See LICENSE or:
			 * http://opensource.org/licenses/BSD-3-Clause
			 */

			/**
			 * This is a helper function for getting values from parameter/options
			 * objects.
			 *
			 * @param args The object we are extracting values from
			 * @param name The name of the property we are getting.
			 * @param defaultValue An optional value to return if the property is missing
			 * from the object. If this is not specified and the property is missing, an
			 * error will be thrown.
			 */
			function getArg(aArgs, aName, aDefaultValue) {
				if (aName in aArgs) {
					return aArgs[aName];
				} else if (arguments.length === 3) {
					return aDefaultValue;
				} else {
					throw new Error("\"" + aName + "\" is a required argument.");
				}
			}
			exports.getArg = getArg;

			var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.]*)(?::(\d+))?(\S*)$/;
			var dataUrlRegexp = /^data:.+,.+$/;

			function urlParse(aUrl) {
				var match = aUrl.match(urlRegexp);
				if (!match) {
					return null;
				}
				return {
					scheme: match[1],
					auth: match[2],
					host: match[3],
					port: match[4],
					path: match[5]
				};
			}
			exports.urlParse = urlParse;

			function urlGenerate(aParsedUrl) {
				var url = "";
				if (aParsedUrl.scheme) {
					url += aParsedUrl.scheme + ":";
				}
				url += "//";
				if (aParsedUrl.auth) {
					url += aParsedUrl.auth + "@";
				}
				if (aParsedUrl.host) {
					url += aParsedUrl.host;
				}
				if (aParsedUrl.port) {
					url += ":" + aParsedUrl.port;
				}
				if (aParsedUrl.path) {
					url += aParsedUrl.path;
				}
				return url;
			}
			exports.urlGenerate = urlGenerate;

			/**
			 * Normalizes a path, or the path portion of a URL:
			 *
			 * - Replaces consecutive slashes with one slash.
			 * - Removes unnecessary '.' parts.
			 * - Removes unnecessary '<dir>/..' parts.
			 *
			 * Based on code in the Node.js 'path' core module.
			 *
			 * @param aPath The path or url to normalize.
			 */
			function normalize(aPath) {
				var path = aPath;
				var url = urlParse(aPath);
				if (url) {
					if (!url.path) {
						return aPath;
					}
					path = url.path;
				}
				var isAbsolute = exports.isAbsolute(path);

				var parts = path.split(/\/+/);
				for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
					part = parts[i];
					if (part === ".") {
						parts.splice(i, 1);
					} else if (part === "..") {
						up++;
					} else if (up > 0) {
						if (part === "") {
							// The first part is blank if the path is absolute. Trying to go
							// above the root is a no-op. Therefore we can remove all '..' parts
							// directly after the root.
							parts.splice(i + 1, up);
							up = 0;
						} else {
							parts.splice(i, 2);
							up--;
						}
					}
				}
				path = parts.join("/");

				if (path === "") {
					path = isAbsolute ? "/" : ".";
				}

				if (url) {
					url.path = path;
					return urlGenerate(url);
				}
				return path;
			}
			exports.normalize = normalize;

			/**
			 * Joins two paths/URLs.
			 *
			 * @param aRoot The root path or URL.
			 * @param aPath The path or URL to be joined with the root.
			 *
			 * - If aPath is a URL or a data URI, aPath is returned, unless aPath is a
			 *   scheme-relative URL: Then the scheme of aRoot, if any, is prepended
			 *   first.
			 * - Otherwise aPath is a path. If aRoot is a URL, then its path portion
			 *   is updated with the result and aRoot is returned. Otherwise the result
			 *   is returned.
			 *   - If aPath is absolute, the result is aPath.
			 *   - Otherwise the two paths are joined with a slash.
			 * - Joining for example 'http://' and 'www.example.com' is also supported.
			 */
			function join(aRoot, aPath) {
				if (aRoot === "") {
					aRoot = ".";
				}
				if (aPath === "") {
					aPath = ".";
				}
				var aPathUrl = urlParse(aPath);
				var aRootUrl = urlParse(aRoot);
				if (aRootUrl) {
					aRoot = aRootUrl.path || "/";
				}

				// `join(foo, '//www.example.org')`
				if (aPathUrl && !aPathUrl.scheme) {
					if (aRootUrl) {
						aPathUrl.scheme = aRootUrl.scheme;
					}
					return urlGenerate(aPathUrl);
				}

				if (aPathUrl || aPath.match(dataUrlRegexp)) {
					return aPath;
				}

				// `join('http://', 'www.example.com')`
				if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
					aRootUrl.host = aPath;
					return urlGenerate(aRootUrl);
				}

				var joined = aPath.charAt(0) === "/"
					? aPath
					: normalize(aRoot.replace(/\/+$/, "") + "/" + aPath);

				if (aRootUrl) {
					aRootUrl.path = joined;
					return urlGenerate(aRootUrl);
				}
				return joined;
			}
			exports.join = join;

			exports.isAbsolute = function (aPath) {
				return aPath.charAt(0) === "/" || !!aPath.match(urlRegexp);
			};

			/**
			 * Make a path relative to a URL or another path.
			 *
			 * @param aRoot The root path or URL.
			 * @param aPath The path or URL to be made relative to aRoot.
			 */
			function relative(aRoot, aPath) {
				if (aRoot === "") {
					aRoot = ".";
				}

				aRoot = aRoot.replace(/\/$/, "");

				// It is possible for the path to be above the root. In this case, simply
				// checking whether the root is a prefix of the path won't work. Instead, we
				// need to remove components from the root one by one, until either we find
				// a prefix that fits, or we run out of components to remove.
				var level = 0;
				while (aPath.indexOf(aRoot + "/") !== 0) {
					var index = aRoot.lastIndexOf("/");
					if (index < 0) {
						return aPath;
					}

					// If the only part of the root that is left is the scheme (i.e. http://,
					// file:///, etc.), one or more slashes (/), or simply nothing at all, we
					// have exhausted all components, so the path is not relative to the root.
					aRoot = aRoot.slice(0, index);
					if (aRoot.match(/^([^/]+:\/)?\/*$/)) {
						return aPath;
					}

					++level;
				}

				// Make sure we add a "../" for each component we removed from the root.
				return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
			}
			exports.relative = relative;

			var supportsNullProto = (function () {
				var obj = Object.create(null);
				return !("__proto__" in obj);
			}());

			function identity(s) {
				return s;
			}

			/**
			 * Because behavior goes wacky when you set `__proto__` on objects, we
			 * have to prefix all the strings in our set with an arbitrary character.
			 *
			 * See https://github.com/mozilla/source-map/pull/31 and
			 * https://github.com/mozilla/source-map/issues/30
			 *
			 * @param String aStr
			 */
			function toSetString(aStr) {
				if (isProtoString(aStr)) {
					return "$" + aStr;
				}

				return aStr;
			}
			exports.toSetString = supportsNullProto ? identity : toSetString;

			function fromSetString(aStr) {
				if (isProtoString(aStr)) {
					return aStr.slice(1);
				}

				return aStr;
			}
			exports.fromSetString = supportsNullProto ? identity : fromSetString;

			function isProtoString(s) {
				if (!s) {
					return false;
				}

				var length = s.length;

				if (length < 9 /* "__proto__".length */) {
					return false;
				}

				if (s.charCodeAt(length - 1) !== 95  /* '_' */ ||
					s.charCodeAt(length - 2) !== 95  /* '_' */ ||
					s.charCodeAt(length - 3) !== 111 /* 'o' */ ||
					s.charCodeAt(length - 4) !== 116 /* 't' */ ||
					s.charCodeAt(length - 5) !== 111 /* 'o' */ ||
					s.charCodeAt(length - 6) !== 114 /* 'r' */ ||
					s.charCodeAt(length - 7) !== 112 /* 'p' */ ||
					s.charCodeAt(length - 8) !== 95  /* '_' */ ||
					s.charCodeAt(length - 9) !== 95  /* '_' */) {
					return false;
				}

				for (var i = length - 10; i >= 0; i--) {
					if (s.charCodeAt(i) !== 36 /* '$' */) {
						return false;
					}
				}

				return true;
			}

			/**
			 * Comparator between two mappings where the original positions are compared.
			 *
			 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
			 * mappings with the same original source/line/column, but different generated
			 * line and column the same. Useful when searching for a mapping with a
			 * stubbed out mapping.
			 */
			function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
				var cmp = mappingA.source - mappingB.source;
				if (cmp !== 0) {
					return cmp;
				}

				cmp = mappingA.originalLine - mappingB.originalLine;
				if (cmp !== 0) {
					return cmp;
				}

				cmp = mappingA.originalColumn - mappingB.originalColumn;
				if (cmp !== 0 || onlyCompareOriginal) {
					return cmp;
				}

				cmp = mappingA.generatedColumn - mappingB.generatedColumn;
				if (cmp !== 0) {
					return cmp;
				}

				cmp = mappingA.generatedLine - mappingB.generatedLine;
				if (cmp !== 0) {
					return cmp;
				}

				return mappingA.name - mappingB.name;
			}
			exports.compareByOriginalPositions = compareByOriginalPositions;

			/**
			 * Comparator between two mappings with deflated source and name indices where
			 * the generated positions are compared.
			 *
			 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
			 * mappings with the same generated line and column, but different
			 * source/name/original line and column the same. Useful when searching for a
			 * mapping with a stubbed out mapping.
			 */
			function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
				var cmp = mappingA.generatedLine - mappingB.generatedLine;
				if (cmp !== 0) {
					return cmp;
				}

				cmp = mappingA.generatedColumn - mappingB.generatedColumn;
				if (cmp !== 0 || onlyCompareGenerated) {
					return cmp;
				}

				cmp = mappingA.source - mappingB.source;
				if (cmp !== 0) {
					return cmp;
				}

				cmp = mappingA.originalLine - mappingB.originalLine;
				if (cmp !== 0) {
					return cmp;
				}

				cmp = mappingA.originalColumn - mappingB.originalColumn;
				if (cmp !== 0) {
					return cmp;
				}

				return mappingA.name - mappingB.name;
			}
			exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;

			function strcmp(aStr1, aStr2) {
				if (aStr1 === aStr2) {
					return 0;
				}

				if (aStr1 > aStr2) {
					return 1;
				}

				return -1;
			}

			/**
			 * Comparator between two mappings with inflated source and name strings where
			 * the generated positions are compared.
			 */
			function compareByGeneratedPositionsInflated(mappingA, mappingB) {
				var cmp = mappingA.generatedLine - mappingB.generatedLine;
				if (cmp !== 0) {
					return cmp;
				}

				cmp = mappingA.generatedColumn - mappingB.generatedColumn;
				if (cmp !== 0) {
					return cmp;
				}

				cmp = strcmp(mappingA.source, mappingB.source);
				if (cmp !== 0) {
					return cmp;
				}

				cmp = mappingA.originalLine - mappingB.originalLine;
				if (cmp !== 0) {
					return cmp;
				}

				cmp = mappingA.originalColumn - mappingB.originalColumn;
				if (cmp !== 0) {
					return cmp;
				}

				return strcmp(mappingA.name, mappingB.name);
			}
			exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;

		}, {}], 123: [function (require, module, exports) {
			/*
			 * Copyright 2009-2011 Mozilla Foundation and contributors
			 * Licensed under the New BSD license. See LICENSE.txt or:
			 * http://opensource.org/licenses/BSD-3-Clause
			 */
			exports.SourceMapGenerator = require("./lib/source-map-generator").SourceMapGenerator;
			exports.SourceMapConsumer = require("./lib/source-map-consumer").SourceMapConsumer;
			exports.SourceNode = require("./lib/source-node").SourceNode;

		}, { "./lib/source-map-consumer": 119, "./lib/source-map-generator": 120, "./lib/source-node": 121 }]
	}, {}, [10])(10);
});

singlefile.lib.vendor.cssTree = csstree;