/*
 * The MIT License (MIT)
 * 
 * Author: Gildas Lormeau
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// Derived from https://github.com/csstree/csstree

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
    __markAsModule(target);
    for (var name41 in all)
        __defProp(target, name41, { get: all[name41], enumerable: true });
};
var __reExport = (target, module, desc) => {
    if (module && typeof module === "object" || typeof module === "function") {
        for (let key of __getOwnPropNames(module))
            if (!__hasOwnProp.call(target, key) && key !== "default")
                __defProp(target, key, { get: () => module[key], enumerable: !(desc = __getOwnPropDesc(module, key)) || desc.enumerable });
    }
    return target;
};
var __toModule = (module) => {
    return __reExport(__markAsModule(__defProp(module != null ? __create(__getProtoOf(module)) : {}, "default", module && module.__esModule && "default" in module ? { get: () => module.default, enumerable: true } : { value: module, enumerable: true })), module);
};

// node_modules/source-map-js/lib/base64.js
var require_base64 = __commonJS({
    "node_modules/source-map-js/lib/base64.js"(exports) {
        var intToCharMap = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");
        exports.encode = function (number2) {
            if (0 <= number2 && number2 < intToCharMap.length) {
                return intToCharMap[number2];
            }
            throw new TypeError("Must be between 0 and 63: " + number2);
        };
        exports.decode = function (charCode) {
            var bigA = 65;
            var bigZ = 90;
            var littleA = 97;
            var littleZ = 122;
            var zero2 = 48;
            var nine = 57;
            var plus = 43;
            var slash = 47;
            var littleOffset = 26;
            var numberOffset = 52;
            if (bigA <= charCode && charCode <= bigZ) {
                return charCode - bigA;
            }
            if (littleA <= charCode && charCode <= littleZ) {
                return charCode - littleA + littleOffset;
            }
            if (zero2 <= charCode && charCode <= nine) {
                return charCode - zero2 + numberOffset;
            }
            if (charCode == plus) {
                return 62;
            }
            if (charCode == slash) {
                return 63;
            }
            return -1;
        };
    }
});

// node_modules/source-map-js/lib/base64-vlq.js
var require_base64_vlq = __commonJS({
    "node_modules/source-map-js/lib/base64-vlq.js"(exports) {
        var base64 = require_base64();
        var VLQ_BASE_SHIFT = 5;
        var VLQ_BASE = 1 << VLQ_BASE_SHIFT;
        var VLQ_BASE_MASK = VLQ_BASE - 1;
        var VLQ_CONTINUATION_BIT = VLQ_BASE;
        function toVLQSigned(aValue) {
            return aValue < 0 ? (-aValue << 1) + 1 : (aValue << 1) + 0;
        }
        function fromVLQSigned(aValue) {
            var isNegative = (aValue & 1) === 1;
            var shifted = aValue >> 1;
            return isNegative ? -shifted : shifted;
        }
        exports.encode = function base64VLQ_encode(aValue) {
            var encoded = "";
            var digit;
            var vlq = toVLQSigned(aValue);
            do {
                digit = vlq & VLQ_BASE_MASK;
                vlq >>>= VLQ_BASE_SHIFT;
                if (vlq > 0) {
                    digit |= VLQ_CONTINUATION_BIT;
                }
                encoded += base64.encode(digit);
            } while (vlq > 0);
            return encoded;
        };
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
    }
});

// node_modules/source-map-js/lib/util.js
var require_util = __commonJS({
    "node_modules/source-map-js/lib/util.js"(exports) {
        function getArg(aArgs, aName, aDefaultValue) {
            if (aName in aArgs) {
                return aArgs[aName];
            } else if (arguments.length === 3) {
                return aDefaultValue;
            } else {
                throw new Error('"' + aName + '" is a required argument.');
            }
        }
        exports.getArg = getArg;
        var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/;
        var dataUrlRegexp = /^data:.+\,.+$/;
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
        var MAX_CACHED_INPUTS = 32;
        function lruMemoize(f) {
            var cache = [];
            return function (input) {
                for (var i = 0; i < cache.length; i++) {
                    if (cache[i].input === input) {
                        var temp = cache[0];
                        cache[0] = cache[i];
                        cache[i] = temp;
                        return cache[0].result;
                    }
                }
                var result = f(input);
                cache.unshift({
                    input,
                    result
                });
                if (cache.length > MAX_CACHED_INPUTS) {
                    cache.pop();
                }
                return result;
            };
        }
        var normalize = lruMemoize(function normalize2(aPath) {
            var path = aPath;
            var url = urlParse(aPath);
            if (url) {
                if (!url.path) {
                    return aPath;
                }
                path = url.path;
            }
            var isAbsolute = exports.isAbsolute(path);
            var parts = [];
            var start = 0;
            var i = 0;
            while (true) {
                start = i;
                i = path.indexOf("/", start);
                if (i === -1) {
                    parts.push(path.slice(start));
                    break;
                } else {
                    parts.push(path.slice(start, i));
                    while (i < path.length && path[i] === "/") {
                        i++;
                    }
                }
            }
            for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
                part = parts[i];
                if (part === ".") {
                    parts.splice(i, 1);
                } else if (part === "..") {
                    up++;
                } else if (up > 0) {
                    if (part === "") {
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
        });
        exports.normalize = normalize;
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
            if (aPathUrl && !aPathUrl.scheme) {
                if (aRootUrl) {
                    aPathUrl.scheme = aRootUrl.scheme;
                }
                return urlGenerate(aPathUrl);
            }
            if (aPathUrl || aPath.match(dataUrlRegexp)) {
                return aPath;
            }
            if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
                aRootUrl.host = aPath;
                return urlGenerate(aRootUrl);
            }
            var joined = aPath.charAt(0) === "/" ? aPath : normalize(aRoot.replace(/\/+$/, "") + "/" + aPath);
            if (aRootUrl) {
                aRootUrl.path = joined;
                return urlGenerate(aRootUrl);
            }
            return joined;
        }
        exports.join = join;
        exports.isAbsolute = function (aPath) {
            return aPath.charAt(0) === "/" || urlRegexp.test(aPath);
        };
        function relative(aRoot, aPath) {
            if (aRoot === "") {
                aRoot = ".";
            }
            aRoot = aRoot.replace(/\/$/, "");
            var level = 0;
            while (aPath.indexOf(aRoot + "/") !== 0) {
                var index = aRoot.lastIndexOf("/");
                if (index < 0) {
                    return aPath;
                }
                aRoot = aRoot.slice(0, index);
                if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
                    return aPath;
                }
                ++level;
            }
            return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
        }
        exports.relative = relative;
        var supportsNullProto = function () {
            var obj = Object.create(null);
            return !("__proto__" in obj);
        }();
        function identity(s) {
            return s;
        }
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
            if (length < 9) {
                return false;
            }
            if (s.charCodeAt(length - 1) !== 95 || s.charCodeAt(length - 2) !== 95 || s.charCodeAt(length - 3) !== 111 || s.charCodeAt(length - 4) !== 116 || s.charCodeAt(length - 5) !== 111 || s.charCodeAt(length - 6) !== 114 || s.charCodeAt(length - 7) !== 112 || s.charCodeAt(length - 8) !== 95 || s.charCodeAt(length - 9) !== 95) {
                return false;
            }
            for (var i = length - 10; i >= 0; i--) {
                if (s.charCodeAt(i) !== 36) {
                    return false;
                }
            }
            return true;
        }
        function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
            var cmp = strcmp(mappingA.source, mappingB.source);
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
            return strcmp(mappingA.name, mappingB.name);
        }
        exports.compareByOriginalPositions = compareByOriginalPositions;
        function compareByOriginalPositionsNoSource(mappingA, mappingB, onlyCompareOriginal) {
            var cmp;
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
            return strcmp(mappingA.name, mappingB.name);
        }
        exports.compareByOriginalPositionsNoSource = compareByOriginalPositionsNoSource;
        function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
            var cmp = mappingA.generatedLine - mappingB.generatedLine;
            if (cmp !== 0) {
                return cmp;
            }
            cmp = mappingA.generatedColumn - mappingB.generatedColumn;
            if (cmp !== 0 || onlyCompareGenerated) {
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
        exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;
        function compareByGeneratedPositionsDeflatedNoLine(mappingA, mappingB, onlyCompareGenerated) {
            var cmp = mappingA.generatedColumn - mappingB.generatedColumn;
            if (cmp !== 0 || onlyCompareGenerated) {
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
        exports.compareByGeneratedPositionsDeflatedNoLine = compareByGeneratedPositionsDeflatedNoLine;
        function strcmp(aStr1, aStr2) {
            if (aStr1 === aStr2) {
                return 0;
            }
            if (aStr1 === null) {
                return 1;
            }
            if (aStr2 === null) {
                return -1;
            }
            if (aStr1 > aStr2) {
                return 1;
            }
            return -1;
        }
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
        function parseSourceMapInput(str) {
            return JSON.parse(str.replace(/^\)]}'[^\n]*\n/, ""));
        }
        exports.parseSourceMapInput = parseSourceMapInput;
        function computeSourceURL(sourceRoot, sourceURL, sourceMapURL) {
            sourceURL = sourceURL || "";
            if (sourceRoot) {
                if (sourceRoot[sourceRoot.length - 1] !== "/" && sourceURL[0] !== "/") {
                    sourceRoot += "/";
                }
                sourceURL = sourceRoot + sourceURL;
            }
            if (sourceMapURL) {
                var parsed = urlParse(sourceMapURL);
                if (!parsed) {
                    throw new Error("sourceMapURL could not be parsed");
                }
                if (parsed.path) {
                    var index = parsed.path.lastIndexOf("/");
                    if (index >= 0) {
                        parsed.path = parsed.path.substring(0, index + 1);
                    }
                }
                sourceURL = join(urlGenerate(parsed), sourceURL);
            }
            return normalize(sourceURL);
        }
        exports.computeSourceURL = computeSourceURL;
    }
});

// node_modules/source-map-js/lib/array-set.js
var require_array_set = __commonJS({
    "node_modules/source-map-js/lib/array-set.js"(exports) {
        var util = require_util();
        var has = Object.prototype.hasOwnProperty;
        var hasNativeMap = typeof Map !== "undefined";
        function ArraySet() {
            this._array = [];
            this._set = hasNativeMap ? /* @__PURE__ */ new Map() : Object.create(null);
        }
        ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
            var set = new ArraySet();
            for (var i = 0, len = aArray.length; i < len; i++) {
                set.add(aArray[i], aAllowDuplicates);
            }
            return set;
        };
        ArraySet.prototype.size = function ArraySet_size() {
            return hasNativeMap ? this._set.size : Object.getOwnPropertyNames(this._set).length;
        };
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
        ArraySet.prototype.has = function ArraySet_has(aStr) {
            if (hasNativeMap) {
                return this._set.has(aStr);
            } else {
                var sStr = util.toSetString(aStr);
                return has.call(this._set, sStr);
            }
        };
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
            throw new Error('"' + aStr + '" is not in the set.');
        };
        ArraySet.prototype.at = function ArraySet_at(aIdx) {
            if (aIdx >= 0 && aIdx < this._array.length) {
                return this._array[aIdx];
            }
            throw new Error("No element indexed by " + aIdx);
        };
        ArraySet.prototype.toArray = function ArraySet_toArray() {
            return this._array.slice();
        };
        exports.ArraySet = ArraySet;
    }
});

// node_modules/source-map-js/lib/mapping-list.js
var require_mapping_list = __commonJS({
    "node_modules/source-map-js/lib/mapping-list.js"(exports) {
        var util = require_util();
        function generatedPositionAfter(mappingA, mappingB) {
            var lineA = mappingA.generatedLine;
            var lineB = mappingB.generatedLine;
            var columnA = mappingA.generatedColumn;
            var columnB = mappingB.generatedColumn;
            return lineB > lineA || lineB == lineA && columnB >= columnA || util.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0;
        }
        function MappingList() {
            this._array = [];
            this._sorted = true;
            this._last = { generatedLine: -1, generatedColumn: 0 };
        }
        MappingList.prototype.unsortedForEach = function MappingList_forEach(aCallback, aThisArg) {
            this._array.forEach(aCallback, aThisArg);
        };
        MappingList.prototype.add = function MappingList_add(aMapping) {
            if (generatedPositionAfter(this._last, aMapping)) {
                this._last = aMapping;
                this._array.push(aMapping);
            } else {
                this._sorted = false;
                this._array.push(aMapping);
            }
        };
        MappingList.prototype.toArray = function MappingList_toArray() {
            if (!this._sorted) {
                this._array.sort(util.compareByGeneratedPositionsInflated);
                this._sorted = true;
            }
            return this._array;
        };
        exports.MappingList = MappingList;
    }
});

// node_modules/source-map-js/lib/source-map-generator.js
var require_source_map_generator = __commonJS({
    "node_modules/source-map-js/lib/source-map-generator.js"(exports) {
        var base64VLQ = require_base64_vlq();
        var util = require_util();
        var ArraySet = require_array_set().ArraySet;
        var MappingList = require_mapping_list().MappingList;
        function SourceMapGenerator2(aArgs) {
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
        SourceMapGenerator2.prototype._version = 3;
        SourceMapGenerator2.fromSourceMap = function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
            var sourceRoot = aSourceMapConsumer.sourceRoot;
            var generator = new SourceMapGenerator2({
                file: aSourceMapConsumer.file,
                sourceRoot
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
                var sourceRelative = sourceFile;
                if (sourceRoot !== null) {
                    sourceRelative = util.relative(sourceRoot, sourceFile);
                }
                if (!generator._sources.has(sourceRelative)) {
                    generator._sources.add(sourceRelative);
                }
                var content = aSourceMapConsumer.sourceContentFor(sourceFile);
                if (content != null) {
                    generator.setSourceContent(sourceFile, content);
                }
            });
            return generator;
        };
        SourceMapGenerator2.prototype.addMapping = function SourceMapGenerator_addMapping(aArgs) {
            var generated = util.getArg(aArgs, "generated");
            var original = util.getArg(aArgs, "original", null);
            var source = util.getArg(aArgs, "source", null);
            var name41 = util.getArg(aArgs, "name", null);
            if (!this._skipValidation) {
                this._validateMapping(generated, original, source, name41);
            }
            if (source != null) {
                source = String(source);
                if (!this._sources.has(source)) {
                    this._sources.add(source);
                }
            }
            if (name41 != null) {
                name41 = String(name41);
                if (!this._names.has(name41)) {
                    this._names.add(name41);
                }
            }
            this._mappings.add({
                generatedLine: generated.line,
                generatedColumn: generated.column,
                originalLine: original != null && original.line,
                originalColumn: original != null && original.column,
                source,
                name: name41
            });
        };
        SourceMapGenerator2.prototype.setSourceContent = function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
            var source = aSourceFile;
            if (this._sourceRoot != null) {
                source = util.relative(this._sourceRoot, source);
            }
            if (aSourceContent != null) {
                if (!this._sourcesContents) {
                    this._sourcesContents = Object.create(null);
                }
                this._sourcesContents[util.toSetString(source)] = aSourceContent;
            } else if (this._sourcesContents) {
                delete this._sourcesContents[util.toSetString(source)];
                if (Object.keys(this._sourcesContents).length === 0) {
                    this._sourcesContents = null;
                }
            }
        };
        SourceMapGenerator2.prototype.applySourceMap = function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
            var sourceFile = aSourceFile;
            if (aSourceFile == null) {
                if (aSourceMapConsumer.file == null) {
                    throw new Error(`SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, or the source map's "file" property. Both were omitted.`);
                }
                sourceFile = aSourceMapConsumer.file;
            }
            var sourceRoot = this._sourceRoot;
            if (sourceRoot != null) {
                sourceFile = util.relative(sourceRoot, sourceFile);
            }
            var newSources = new ArraySet();
            var newNames = new ArraySet();
            this._mappings.unsortedForEach(function (mapping) {
                if (mapping.source === sourceFile && mapping.originalLine != null) {
                    var original = aSourceMapConsumer.originalPositionFor({
                        line: mapping.originalLine,
                        column: mapping.originalColumn
                    });
                    if (original.source != null) {
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
                var name41 = mapping.name;
                if (name41 != null && !newNames.has(name41)) {
                    newNames.add(name41);
                }
            }, this);
            this._sources = newSources;
            this._names = newNames;
            aSourceMapConsumer.sources.forEach(function (sourceFile2) {
                var content = aSourceMapConsumer.sourceContentFor(sourceFile2);
                if (content != null) {
                    if (aSourceMapPath != null) {
                        sourceFile2 = util.join(aSourceMapPath, sourceFile2);
                    }
                    if (sourceRoot != null) {
                        sourceFile2 = util.relative(sourceRoot, sourceFile2);
                    }
                    this.setSourceContent(sourceFile2, content);
                }
            }, this);
        };
        SourceMapGenerator2.prototype._validateMapping = function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource, aName) {
            if (aOriginal && typeof aOriginal.line !== "number" && typeof aOriginal.column !== "number") {
                throw new Error("original.line and original.column are not numbers -- you probably meant to omit the original mapping entirely and only map the generated position. If so, pass null for the original mapping instead of an object with empty or null values.");
            }
            if (aGenerated && "line" in aGenerated && "column" in aGenerated && aGenerated.line > 0 && aGenerated.column >= 0 && !aOriginal && !aSource && !aName) {
                return;
            } else if (aGenerated && "line" in aGenerated && "column" in aGenerated && aOriginal && "line" in aOriginal && "column" in aOriginal && aGenerated.line > 0 && aGenerated.column >= 0 && aOriginal.line > 0 && aOriginal.column >= 0 && aSource) {
                return;
            } else {
                throw new Error("Invalid mapping: " + JSON.stringify({
                    generated: aGenerated,
                    source: aSource,
                    original: aOriginal,
                    name: aName
                }));
            }
        };
        SourceMapGenerator2.prototype._serializeMappings = function SourceMapGenerator_serializeMappings() {
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
                } else {
                    if (i > 0) {
                        if (!util.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) {
                            continue;
                        }
                        next += ",";
                    }
                }
                next += base64VLQ.encode(mapping.generatedColumn - previousGeneratedColumn);
                previousGeneratedColumn = mapping.generatedColumn;
                if (mapping.source != null) {
                    sourceIdx = this._sources.indexOf(mapping.source);
                    next += base64VLQ.encode(sourceIdx - previousSource);
                    previousSource = sourceIdx;
                    next += base64VLQ.encode(mapping.originalLine - 1 - previousOriginalLine);
                    previousOriginalLine = mapping.originalLine - 1;
                    next += base64VLQ.encode(mapping.originalColumn - previousOriginalColumn);
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
        SourceMapGenerator2.prototype._generateSourcesContent = function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
            return aSources.map(function (source) {
                if (!this._sourcesContents) {
                    return null;
                }
                if (aSourceRoot != null) {
                    source = util.relative(aSourceRoot, source);
                }
                var key = util.toSetString(source);
                return Object.prototype.hasOwnProperty.call(this._sourcesContents, key) ? this._sourcesContents[key] : null;
            }, this);
        };
        SourceMapGenerator2.prototype.toJSON = function SourceMapGenerator_toJSON() {
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
        SourceMapGenerator2.prototype.toString = function SourceMapGenerator_toString() {
            return JSON.stringify(this.toJSON());
        };
        exports.SourceMapGenerator = SourceMapGenerator2;
    }
});

// lib/index.js
var lib_exports = {};
__export(lib_exports, {
    Lexer: () => Lexer,
    List: () => List,
    TokenStream: () => TokenStream,
    clone: () => clone,
    createSyntax: () => create_default,
    definitionSyntax: () => definition_syntax_exports,
    generate: () => generate42,
    ident: () => ident_exports,
    isCustomProperty: () => isCustomProperty,
    keyword: () => keyword,
    parse: () => parse42,
    property: () => property,
    string: () => string_exports,
    tokenNames: () => names_default,
    tokenTypes: () => types_exports,
    url: () => url_exports,
    vendorPrefix: () => vendorPrefix,
    version: () => version
});

// lib/tokenizer/types.js
var types_exports = {};
__export(types_exports, {
    AtKeyword: () => AtKeyword,
    BadString: () => BadString,
    BadUrl: () => BadUrl,
    CDC: () => CDC,
    CDO: () => CDO,
    Colon: () => Colon,
    Comma: () => Comma,
    Comment: () => Comment,
    Delim: () => Delim,
    Dimension: () => Dimension,
    EOF: () => EOF,
    Function: () => Function,
    Hash: () => Hash,
    Ident: () => Ident,
    LeftCurlyBracket: () => LeftCurlyBracket,
    LeftParenthesis: () => LeftParenthesis,
    LeftSquareBracket: () => LeftSquareBracket,
    Number: () => Number2,
    Percentage: () => Percentage,
    RightCurlyBracket: () => RightCurlyBracket,
    RightParenthesis: () => RightParenthesis,
    RightSquareBracket: () => RightSquareBracket,
    Semicolon: () => Semicolon,
    String: () => String2,
    Url: () => Url,
    WhiteSpace: () => WhiteSpace
});
var EOF = 0;
var Ident = 1;
var Function = 2;
var AtKeyword = 3;
var Hash = 4;
var String2 = 5;
var BadString = 6;
var Url = 7;
var BadUrl = 8;
var Delim = 9;
var Number2 = 10;
var Percentage = 11;
var Dimension = 12;
var WhiteSpace = 13;
var CDO = 14;
var CDC = 15;
var Colon = 16;
var Semicolon = 17;
var Comma = 18;
var LeftSquareBracket = 19;
var RightSquareBracket = 20;
var LeftParenthesis = 21;
var RightParenthesis = 22;
var LeftCurlyBracket = 23;
var RightCurlyBracket = 24;
var Comment = 25;

// lib/tokenizer/char-code-definitions.js
var EOF2 = 0;
function isDigit(code2) {
    return code2 >= 48 && code2 <= 57;
}
function isHexDigit(code2) {
    return isDigit(code2) || code2 >= 65 && code2 <= 70 || code2 >= 97 && code2 <= 102;
}
function isUppercaseLetter(code2) {
    return code2 >= 65 && code2 <= 90;
}
function isLowercaseLetter(code2) {
    return code2 >= 97 && code2 <= 122;
}
function isLetter(code2) {
    return isUppercaseLetter(code2) || isLowercaseLetter(code2);
}
function isNonAscii(code2) {
    return code2 >= 128;
}
function isNameStart(code2) {
    return isLetter(code2) || isNonAscii(code2) || code2 === 95;
}
function isName(code2) {
    return isNameStart(code2) || isDigit(code2) || code2 === 45;
}
function isNonPrintable(code2) {
    return code2 >= 0 && code2 <= 8 || code2 === 11 || code2 >= 14 && code2 <= 31 || code2 === 127;
}
function isNewline(code2) {
    return code2 === 10 || code2 === 13 || code2 === 12;
}
function isWhiteSpace(code2) {
    return isNewline(code2) || code2 === 32 || code2 === 9;
}
function isValidEscape(first, second) {
    if (first !== 92) {
        return false;
    }
    if (isNewline(second) || second === EOF2) {
        return false;
    }
    return true;
}
function isIdentifierStart(first, second, third) {
    if (first === 45) {
        return isNameStart(second) || second === 45 || isValidEscape(second, third);
    }
    if (isNameStart(first)) {
        return true;
    }
    if (first === 92) {
        return isValidEscape(first, second);
    }
    return false;
}
function isNumberStart(first, second, third) {
    if (first === 43 || first === 45) {
        if (isDigit(second)) {
            return 2;
        }
        return second === 46 && isDigit(third) ? 3 : 0;
    }
    if (first === 46) {
        return isDigit(second) ? 2 : 0;
    }
    if (isDigit(first)) {
        return 1;
    }
    return 0;
}
function isBOM(code2) {
    if (code2 === 65279) {
        return 1;
    }
    if (code2 === 65534) {
        return 1;
    }
    return 0;
}
var CATEGORY = new Array(128);
var EofCategory = 128;
var WhiteSpaceCategory = 130;
var DigitCategory = 131;
var NameStartCategory = 132;
var NonPrintableCategory = 133;
for (let i = 0; i < CATEGORY.length; i++) {
    CATEGORY[i] = isWhiteSpace(i) && WhiteSpaceCategory || isDigit(i) && DigitCategory || isNameStart(i) && NameStartCategory || isNonPrintable(i) && NonPrintableCategory || i || EofCategory;
}
function charCodeCategory(code2) {
    return code2 < 128 ? CATEGORY[code2] : NameStartCategory;
}

// lib/tokenizer/utils.js
function getCharCode(source, offset) {
    return offset < source.length ? source.charCodeAt(offset) : 0;
}
function getNewlineLength(source, offset, code2) {
    if (code2 === 13 && getCharCode(source, offset + 1) === 10) {
        return 2;
    }
    return 1;
}
function cmpChar(testStr, offset, referenceCode) {
    let code2 = testStr.charCodeAt(offset);
    if (isUppercaseLetter(code2)) {
        code2 = code2 | 32;
    }
    return code2 === referenceCode;
}
function cmpStr(testStr, start, end, referenceStr) {
    if (end - start !== referenceStr.length) {
        return false;
    }
    if (start < 0 || end > testStr.length) {
        return false;
    }
    for (let i = start; i < end; i++) {
        const referenceCode = referenceStr.charCodeAt(i - start);
        let testCode = testStr.charCodeAt(i);
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
function consumeEscaped(source, offset) {
    offset += 2;
    if (isHexDigit(getCharCode(source, offset - 1))) {
        for (const maxOffset = Math.min(source.length, offset + 5); offset < maxOffset; offset++) {
            if (!isHexDigit(getCharCode(source, offset))) {
                break;
            }
        }
        const code2 = getCharCode(source, offset);
        if (isWhiteSpace(code2)) {
            offset += getNewlineLength(source, offset, code2);
        }
    }
    return offset;
}
function consumeName(source, offset) {
    for (; offset < source.length; offset++) {
        const code2 = source.charCodeAt(offset);
        if (isName(code2)) {
            continue;
        }
        if (isValidEscape(code2, getCharCode(source, offset + 1))) {
            offset = consumeEscaped(source, offset) - 1;
            continue;
        }
        break;
    }
    return offset;
}
function consumeNumber(source, offset) {
    let code2 = source.charCodeAt(offset);
    if (code2 === 43 || code2 === 45) {
        code2 = source.charCodeAt(offset += 1);
    }
    if (isDigit(code2)) {
        offset = findDecimalNumberEnd(source, offset + 1);
        code2 = source.charCodeAt(offset);
    }
    if (code2 === 46 && isDigit(source.charCodeAt(offset + 1))) {
        offset += 2;
        offset = findDecimalNumberEnd(source, offset);
    }
    if (cmpChar(source, offset, 101)) {
        let sign = 0;
        code2 = source.charCodeAt(offset + 1);
        if (code2 === 45 || code2 === 43) {
            sign = 1;
            code2 = source.charCodeAt(offset + 2);
        }
        if (isDigit(code2)) {
            offset = findDecimalNumberEnd(source, offset + 1 + sign + 1);
        }
    }
    return offset;
}
function consumeBadUrlRemnants(source, offset) {
    for (; offset < source.length; offset++) {
        const code2 = source.charCodeAt(offset);
        if (code2 === 41) {
            offset++;
            break;
        }
        if (isValidEscape(code2, getCharCode(source, offset + 1))) {
            offset = consumeEscaped(source, offset);
        }
    }
    return offset;
}
function decodeEscaped(escaped) {
    if (escaped.length === 1 && !isHexDigit(escaped.charCodeAt(0))) {
        return escaped[0];
    }
    let code2 = parseInt(escaped, 16);
    if (code2 === 0 || code2 >= 55296 && code2 <= 57343 || code2 > 1114111) {
        code2 = 65533;
    }
    return String.fromCodePoint(code2);
}

// lib/tokenizer/names.js
var names_default = [
    "EOF-token",
    "ident-token",
    "function-token",
    "at-keyword-token",
    "hash-token",
    "string-token",
    "bad-string-token",
    "url-token",
    "bad-url-token",
    "delim-token",
    "number-token",
    "percentage-token",
    "dimension-token",
    "whitespace-token",
    "CDO-token",
    "CDC-token",
    "colon-token",
    "semicolon-token",
    "comma-token",
    "[-token",
    "]-token",
    "(-token",
    ")-token",
    "{-token",
    "}-token"
];

// lib/tokenizer/adopt-buffer.js
var MIN_SIZE = 16 * 1024;
function adoptBuffer(buffer = null, size) {
    if (buffer === null || buffer.length < size) {
        return new Uint32Array(Math.max(size + 1024, MIN_SIZE));
    }
    return buffer;
}

// lib/tokenizer/OffsetToLocation.js
var N = 10;
var F = 12;
var R = 13;
function computeLinesAndColumns(host) {
    const source = host.source;
    const sourceLength = source.length;
    const startOffset = source.length > 0 ? isBOM(source.charCodeAt(0)) : 0;
    const lines = adoptBuffer(host.lines, sourceLength);
    const columns = adoptBuffer(host.columns, sourceLength);
    let line = host.startLine;
    let column = host.startColumn;
    for (let i = startOffset; i < sourceLength; i++) {
        const code2 = source.charCodeAt(i);
        lines[i] = line;
        columns[i] = column++;
        if (code2 === N || code2 === R || code2 === F) {
            if (code2 === R && i + 1 < sourceLength && source.charCodeAt(i + 1) === N) {
                i++;
                lines[i] = line;
                columns[i] = column;
            }
            line++;
            column = 1;
        }
    }
    lines[sourceLength] = line;
    columns[sourceLength] = column;
    host.lines = lines;
    host.columns = columns;
    host.computed = true;
}
var OffsetToLocation = class {
    constructor() {
        this.lines = null;
        this.columns = null;
        this.computed = false;
    }
    setSource(source, startOffset = 0, startLine = 1, startColumn = 1) {
        this.source = source;
        this.startOffset = startOffset;
        this.startLine = startLine;
        this.startColumn = startColumn;
        this.computed = false;
    }
    getLocation(offset, filename) {
        if (!this.computed) {
            computeLinesAndColumns(this);
        }
        return {
            source: filename,
            offset: this.startOffset + offset,
            line: this.lines[offset],
            column: this.columns[offset]
        };
    }
    getLocationRange(start, end, filename) {
        if (!this.computed) {
            computeLinesAndColumns(this);
        }
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

// lib/tokenizer/TokenStream.js
var OFFSET_MASK = 16777215;
var TYPE_SHIFT = 24;
var balancePair = /* @__PURE__ */ new Map([
    [Function, RightParenthesis],
    [LeftParenthesis, RightParenthesis],
    [LeftSquareBracket, RightSquareBracket],
    [LeftCurlyBracket, RightCurlyBracket]
]);
var TokenStream = class {
    constructor(source, tokenize2) {
        this.setSource(source, tokenize2);
    }
    reset() {
        this.eof = false;
        this.tokenIndex = -1;
        this.tokenType = 0;
        this.tokenStart = this.firstCharOffset;
        this.tokenEnd = this.firstCharOffset;
    }
    setSource(source = "", tokenize2 = () => {
    }) {
        source = String(source || "");
        const sourceLength = source.length;
        const offsetAndType = adoptBuffer(this.offsetAndType, source.length + 1);
        const balance = adoptBuffer(this.balance, source.length + 1);
        let tokenCount = 0;
        let balanceCloseType = 0;
        let balanceStart = 0;
        let firstCharOffset = -1;
        this.offsetAndType = null;
        this.balance = null;
        tokenize2(source, (type, start, end) => {
            switch (type) {
                default:
                    balance[tokenCount] = sourceLength;
                    break;
                case balanceCloseType: {
                    let balancePrev = balanceStart & OFFSET_MASK;
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
                }
                case LeftParenthesis:
                case Function:
                case LeftSquareBracket:
                case LeftCurlyBracket:
                    balance[tokenCount] = balanceStart;
                    balanceCloseType = balancePair.get(type);
                    balanceStart = balanceCloseType << TYPE_SHIFT | tokenCount;
                    break;
            }
            offsetAndType[tokenCount++] = type << TYPE_SHIFT | end;
            if (firstCharOffset === -1) {
                firstCharOffset = start;
            }
        });
        offsetAndType[tokenCount] = EOF << TYPE_SHIFT | sourceLength;
        balance[tokenCount] = sourceLength;
        balance[sourceLength] = sourceLength;
        while (balanceStart !== 0) {
            const balancePrev = balanceStart & OFFSET_MASK;
            balanceStart = balance[balancePrev];
            balance[balancePrev] = sourceLength;
        }
        this.source = source;
        this.firstCharOffset = firstCharOffset === -1 ? 0 : firstCharOffset;
        this.tokenCount = tokenCount;
        this.offsetAndType = offsetAndType;
        this.balance = balance;
        this.reset();
        this.next();
    }
    lookupType(offset) {
        offset += this.tokenIndex;
        if (offset < this.tokenCount) {
            return this.offsetAndType[offset] >> TYPE_SHIFT;
        }
        return EOF;
    }
    lookupOffset(offset) {
        offset += this.tokenIndex;
        if (offset < this.tokenCount) {
            return this.offsetAndType[offset - 1] & OFFSET_MASK;
        }
        return this.source.length;
    }
    lookupValue(offset, referenceStr) {
        offset += this.tokenIndex;
        if (offset < this.tokenCount) {
            return cmpStr(this.source, this.offsetAndType[offset - 1] & OFFSET_MASK, this.offsetAndType[offset] & OFFSET_MASK, referenceStr);
        }
        return false;
    }
    getTokenStart(tokenIndex) {
        if (tokenIndex === this.tokenIndex) {
            return this.tokenStart;
        }
        if (tokenIndex > 0) {
            return tokenIndex < this.tokenCount ? this.offsetAndType[tokenIndex - 1] & OFFSET_MASK : this.offsetAndType[this.tokenCount] & OFFSET_MASK;
        }
        return this.firstCharOffset;
    }
    substrToCursor(start) {
        return this.source.substring(start, this.tokenStart);
    }
    isBalanceEdge(pos) {
        return this.balance[this.tokenIndex] < pos;
    }
    isDelim(code2, offset) {
        if (offset) {
            return this.lookupType(offset) === Delim && this.source.charCodeAt(this.lookupOffset(offset)) === code2;
        }
        return this.tokenType === Delim && this.source.charCodeAt(this.tokenStart) === code2;
    }
    skip(tokenCount) {
        let next = this.tokenIndex + tokenCount;
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
    }
    next() {
        let next = this.tokenIndex + 1;
        if (next < this.tokenCount) {
            this.tokenIndex = next;
            this.tokenStart = this.tokenEnd;
            next = this.offsetAndType[next];
            this.tokenType = next >> TYPE_SHIFT;
            this.tokenEnd = next & OFFSET_MASK;
        } else {
            this.eof = true;
            this.tokenIndex = this.tokenCount;
            this.tokenType = EOF;
            this.tokenStart = this.tokenEnd = this.source.length;
        }
    }
    skipSC() {
        while (this.tokenType === WhiteSpace || this.tokenType === Comment) {
            this.next();
        }
    }
    skipUntilBalanced(startToken, stopConsume) {
        let cursor = startToken;
        let balanceEnd;
        let offset;
        loop:
        for (; cursor < this.tokenCount; cursor++) {
            balanceEnd = this.balance[cursor];
            if (balanceEnd < startToken) {
                break loop;
            }
            offset = cursor > 0 ? this.offsetAndType[cursor - 1] & OFFSET_MASK : this.firstCharOffset;
            switch (stopConsume(this.source.charCodeAt(offset))) {
                case 1:
                    break loop;
                case 2:
                    cursor++;
                    break loop;
                default:
                    if (this.balance[balanceEnd] === cursor) {
                        cursor = balanceEnd;
                    }
            }
        }
        this.skip(cursor - this.tokenIndex);
    }
    forEachToken(fn) {
        for (let i = 0, offset = this.firstCharOffset; i < this.tokenCount; i++) {
            const start = offset;
            const item = this.offsetAndType[i];
            const end = item & OFFSET_MASK;
            const type = item >> TYPE_SHIFT;
            offset = end;
            fn(type, start, end, i);
        }
    }
    dump() {
        const tokens = new Array(this.tokenCount);
        this.forEachToken((type, start, end, index) => {
            tokens[index] = {
                idx: index,
                type: names_default[type],
                chunk: this.source.substring(start, end),
                balance: this.balance[index]
            };
        });
        return tokens;
    }
};

// lib/tokenizer/index.js
function tokenize(source, onToken) {
    function getCharCode2(offset2) {
        return offset2 < sourceLength ? source.charCodeAt(offset2) : 0;
    }
    function consumeNumericToken() {
        offset = consumeNumber(source, offset);
        if (isIdentifierStart(getCharCode2(offset), getCharCode2(offset + 1), getCharCode2(offset + 2))) {
            type = Dimension;
            offset = consumeName(source, offset);
            return;
        }
        if (getCharCode2(offset) === 37) {
            type = Percentage;
            offset++;
            return;
        }
        type = Number2;
    }
    function consumeIdentLikeToken() {
        const nameStartOffset = offset;
        offset = consumeName(source, offset);
        if (cmpStr(source, nameStartOffset, offset, "url") && getCharCode2(offset) === 40) {
            offset = findWhiteSpaceEnd(source, offset + 1);
            if (getCharCode2(offset) === 34 || getCharCode2(offset) === 39) {
                type = Function;
                offset = nameStartOffset + 4;
                return;
            }
            consumeUrlToken();
            return;
        }
        if (getCharCode2(offset) === 40) {
            type = Function;
            offset++;
            return;
        }
        type = Ident;
    }
    function consumeStringToken(endingCodePoint) {
        if (!endingCodePoint) {
            endingCodePoint = getCharCode2(offset++);
        }
        type = String2;
        for (; offset < source.length; offset++) {
            const code2 = source.charCodeAt(offset);
            switch (charCodeCategory(code2)) {
                case endingCodePoint:
                    offset++;
                    return;
                case WhiteSpaceCategory:
                    if (isNewline(code2)) {
                        offset += getNewlineLength(source, offset, code2);
                        type = BadString;
                        return;
                    }
                    break;
                case 92:
                    if (offset === source.length - 1) {
                        break;
                    }
                    const nextCode = getCharCode2(offset + 1);
                    if (isNewline(nextCode)) {
                        offset += getNewlineLength(source, offset + 1, nextCode);
                    } else if (isValidEscape(code2, nextCode)) {
                        offset = consumeEscaped(source, offset) - 1;
                    }
                    break;
            }
        }
    }
    function consumeUrlToken() {
        type = Url;
        offset = findWhiteSpaceEnd(source, offset);
        for (; offset < source.length; offset++) {
            const code2 = source.charCodeAt(offset);
            switch (charCodeCategory(code2)) {
                case 41:
                    offset++;
                    return;
                case WhiteSpaceCategory:
                    offset = findWhiteSpaceEnd(source, offset);
                    if (getCharCode2(offset) === 41 || offset >= source.length) {
                        if (offset < source.length) {
                            offset++;
                        }
                        return;
                    }
                    offset = consumeBadUrlRemnants(source, offset);
                    type = BadUrl;
                    return;
                case 34:
                case 39:
                case 40:
                case NonPrintableCategory:
                    offset = consumeBadUrlRemnants(source, offset);
                    type = BadUrl;
                    return;
                case 92:
                    if (isValidEscape(code2, getCharCode2(offset + 1))) {
                        offset = consumeEscaped(source, offset) - 1;
                        break;
                    }
                    offset = consumeBadUrlRemnants(source, offset);
                    type = BadUrl;
                    return;
            }
        }
    }
    source = String(source || "");
    const sourceLength = source.length;
    let start = isBOM(getCharCode2(0));
    let offset = start;
    let type;
    while (offset < sourceLength) {
        const code2 = source.charCodeAt(offset);
        switch (charCodeCategory(code2)) {
            case WhiteSpaceCategory:
                type = WhiteSpace;
                offset = findWhiteSpaceEnd(source, offset + 1);
                break;
            case 34:
                consumeStringToken();
                break;
            case 35:
                if (isName(getCharCode2(offset + 1)) || isValidEscape(getCharCode2(offset + 1), getCharCode2(offset + 2))) {
                    type = Hash;
                    offset = consumeName(source, offset + 1);
                } else {
                    type = Delim;
                    offset++;
                }
                break;
            case 39:
                consumeStringToken();
                break;
            case 40:
                type = LeftParenthesis;
                offset++;
                break;
            case 41:
                type = RightParenthesis;
                offset++;
                break;
            case 43:
                if (isNumberStart(code2, getCharCode2(offset + 1), getCharCode2(offset + 2))) {
                    consumeNumericToken();
                } else {
                    type = Delim;
                    offset++;
                }
                break;
            case 44:
                type = Comma;
                offset++;
                break;
            case 45:
                if (isNumberStart(code2, getCharCode2(offset + 1), getCharCode2(offset + 2))) {
                    consumeNumericToken();
                } else {
                    if (getCharCode2(offset + 1) === 45 && getCharCode2(offset + 2) === 62) {
                        type = CDC;
                        offset = offset + 3;
                    } else {
                        if (isIdentifierStart(code2, getCharCode2(offset + 1), getCharCode2(offset + 2))) {
                            consumeIdentLikeToken();
                        } else {
                            type = Delim;
                            offset++;
                        }
                    }
                }
                break;
            case 46:
                if (isNumberStart(code2, getCharCode2(offset + 1), getCharCode2(offset + 2))) {
                    consumeNumericToken();
                } else {
                    type = Delim;
                    offset++;
                }
                break;
            case 47:
                if (getCharCode2(offset + 1) === 42) {
                    type = Comment;
                    offset = source.indexOf("*/", offset + 2);
                    offset = offset === -1 ? source.length : offset + 2;
                } else {
                    type = Delim;
                    offset++;
                }
                break;
            case 58:
                type = Colon;
                offset++;
                break;
            case 59:
                type = Semicolon;
                offset++;
                break;
            case 60:
                if (getCharCode2(offset + 1) === 33 && getCharCode2(offset + 2) === 45 && getCharCode2(offset + 3) === 45) {
                    type = CDO;
                    offset = offset + 4;
                } else {
                    type = Delim;
                    offset++;
                }
                break;
            case 64:
                if (isIdentifierStart(getCharCode2(offset + 1), getCharCode2(offset + 2), getCharCode2(offset + 3))) {
                    type = AtKeyword;
                    offset = consumeName(source, offset + 1);
                } else {
                    type = Delim;
                    offset++;
                }
                break;
            case 91:
                type = LeftSquareBracket;
                offset++;
                break;
            case 92:
                if (isValidEscape(code2, getCharCode2(offset + 1))) {
                    consumeIdentLikeToken();
                } else {
                    type = Delim;
                    offset++;
                }
                break;
            case 93:
                type = RightSquareBracket;
                offset++;
                break;
            case 123:
                type = LeftCurlyBracket;
                offset++;
                break;
            case 125:
                type = RightCurlyBracket;
                offset++;
                break;
            case DigitCategory:
                consumeNumericToken();
                break;
            case NameStartCategory:
                consumeIdentLikeToken();
                break;
            default:
                type = Delim;
                offset++;
        }
        onToken(type, start, start = offset);
    }
}

// lib/utils/List.js
var releasedCursors = null;
var List = class {
    static createItem(data) {
        return {
            prev: null,
            next: null,
            data
        };
    }
    constructor() {
        this.head = null;
        this.tail = null;
        this.cursor = null;
    }
    createItem(data) {
        return List.createItem(data);
    }
    allocateCursor(prev, next) {
        let cursor;
        if (releasedCursors !== null) {
            cursor = releasedCursors;
            releasedCursors = releasedCursors.cursor;
            cursor.prev = prev;
            cursor.next = next;
            cursor.cursor = this.cursor;
        } else {
            cursor = {
                prev,
                next,
                cursor: this.cursor
            };
        }
        this.cursor = cursor;
        return cursor;
    }
    releaseCursor() {
        const { cursor } = this;
        this.cursor = cursor.cursor;
        cursor.prev = null;
        cursor.next = null;
        cursor.cursor = releasedCursors;
        releasedCursors = cursor;
    }
    updateCursors(prevOld, prevNew, nextOld, nextNew) {
        let { cursor } = this;
        while (cursor !== null) {
            if (cursor.prev === prevOld) {
                cursor.prev = prevNew;
            }
            if (cursor.next === nextOld) {
                cursor.next = nextNew;
            }
            cursor = cursor.cursor;
        }
    }
    *[Symbol.iterator]() {
        for (let cursor = this.head; cursor !== null; cursor = cursor.next) {
            yield cursor.data;
        }
    }
    get size() {
        let size = 0;
        for (let cursor = this.head; cursor !== null; cursor = cursor.next) {
            size++;
        }
        return size;
    }
    get isEmpty() {
        return this.head === null;
    }
    get first() {
        return this.head && this.head.data;
    }
    get last() {
        return this.tail && this.tail.data;
    }
    fromArray(array) {
        let cursor = null;
        this.head = null;
        for (let data of array) {
            const item = List.createItem(data);
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
    }
    toArray() {
        return [...this];
    }
    toJSON() {
        return [...this];
    }
    forEach(fn, thisArg = this) {
        const cursor = this.allocateCursor(null, this.head);
        while (cursor.next !== null) {
            const item = cursor.next;
            cursor.next = item.next;
            fn.call(thisArg, item.data, item, this);
        }
        this.releaseCursor();
    }
    forEachRight(fn, thisArg = this) {
        const cursor = this.allocateCursor(this.tail, null);
        while (cursor.prev !== null) {
            const item = cursor.prev;
            cursor.prev = item.prev;
            fn.call(thisArg, item.data, item, this);
        }
        this.releaseCursor();
    }
    reduce(fn, initialValue, thisArg = this) {
        let cursor = this.allocateCursor(null, this.head);
        let acc = initialValue;
        let item;
        while (cursor.next !== null) {
            item = cursor.next;
            cursor.next = item.next;
            acc = fn.call(thisArg, acc, item.data, item, this);
        }
        this.releaseCursor();
        return acc;
    }
    reduceRight(fn, initialValue, thisArg = this) {
        let cursor = this.allocateCursor(this.tail, null);
        let acc = initialValue;
        let item;
        while (cursor.prev !== null) {
            item = cursor.prev;
            cursor.prev = item.prev;
            acc = fn.call(thisArg, acc, item.data, item, this);
        }
        this.releaseCursor();
        return acc;
    }
    some(fn, thisArg = this) {
        for (let cursor = this.head; cursor !== null; cursor = cursor.next) {
            if (fn.call(thisArg, cursor.data, cursor, this)) {
                return true;
            }
        }
        return false;
    }
    map(fn, thisArg = this) {
        const result = new List();
        for (let cursor = this.head; cursor !== null; cursor = cursor.next) {
            result.appendData(fn.call(thisArg, cursor.data, cursor, this));
        }
        return result;
    }
    filter(fn, thisArg = this) {
        const result = new List();
        for (let cursor = this.head; cursor !== null; cursor = cursor.next) {
            if (fn.call(thisArg, cursor.data, cursor, this)) {
                result.appendData(cursor.data);
            }
        }
        return result;
    }
    nextUntil(start, fn, thisArg = this) {
        if (start === null) {
            return;
        }
        const cursor = this.allocateCursor(null, start);
        while (cursor.next !== null) {
            const item = cursor.next;
            cursor.next = item.next;
            if (fn.call(thisArg, item.data, item, this)) {
                break;
            }
        }
        this.releaseCursor();
    }
    prevUntil(start, fn, thisArg = this) {
        if (start === null) {
            return;
        }
        const cursor = this.allocateCursor(start, null);
        while (cursor.prev !== null) {
            const item = cursor.prev;
            cursor.prev = item.prev;
            if (fn.call(thisArg, item.data, item, this)) {
                break;
            }
        }
        this.releaseCursor();
    }
    clear() {
        this.head = null;
        this.tail = null;
    }
    copy() {
        const result = new List();
        for (let data of this) {
            result.appendData(data);
        }
        return result;
    }
    prepend(item) {
        this.updateCursors(null, item, this.head, item);
        if (this.head !== null) {
            this.head.prev = item;
            item.next = this.head;
        } else {
            this.tail = item;
        }
        this.head = item;
        return this;
    }
    prependData(data) {
        return this.prepend(List.createItem(data));
    }
    append(item) {
        return this.insert(item);
    }
    appendData(data) {
        return this.insert(List.createItem(data));
    }
    insert(item, before = null) {
        if (before !== null) {
            this.updateCursors(before.prev, item, before, item);
            if (before.prev === null) {
                if (this.head !== before) {
                    throw new Error("before doesn't belong to list");
                }
                this.head = item;
                before.prev = item;
                item.next = before;
                this.updateCursors(null, item);
            } else {
                before.prev.next = item;
                item.prev = before.prev;
                before.prev = item;
                item.next = before;
            }
        } else {
            this.updateCursors(this.tail, item, null, item);
            if (this.tail !== null) {
                this.tail.next = item;
                item.prev = this.tail;
            } else {
                this.head = item;
            }
            this.tail = item;
        }
        return this;
    }
    insertData(data, before) {
        return this.insert(List.createItem(data), before);
    }
    remove(item) {
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
    }
    push(data) {
        this.insert(List.createItem(data));
    }
    pop() {
        return this.tail !== null ? this.remove(this.tail) : null;
    }
    unshift(data) {
        this.prepend(List.createItem(data));
    }
    shift() {
        return this.head !== null ? this.remove(this.head) : null;
    }
    prependList(list) {
        return this.insertList(list, this.head);
    }
    appendList(list) {
        return this.insertList(list);
    }
    insertList(list, before) {
        if (list.head === null) {
            return this;
        }
        if (before !== void 0 && before !== null) {
            this.updateCursors(before.prev, list.tail, before, list.head);
            if (before.prev !== null) {
                before.prev.next = list.head;
                list.head.prev = before.prev;
            } else {
                this.head = list.head;
            }
            before.prev = list.tail;
            list.tail.next = before;
        } else {
            this.updateCursors(this.tail, list.tail, null, list.head);
            if (this.tail !== null) {
                this.tail.next = list.head;
                list.head.prev = this.tail;
            } else {
                this.head = list.head;
            }
            this.tail = list.tail;
        }
        list.head = null;
        list.tail = null;
        return this;
    }
    replace(oldItem, newItemOrList) {
        if ("head" in newItemOrList) {
            this.insertList(newItemOrList, oldItem);
        } else {
            this.insert(newItemOrList, oldItem);
        }
        this.remove(oldItem);
    }
};

// lib/utils/create-custom-error.js
function createCustomError(name41, message) {
    const error = Object.create(SyntaxError.prototype);
    const errorStack = new Error();
    return Object.assign(error, {
        name: name41,
        message,
        get stack() {
            return (errorStack.stack || "").replace(/^(.+\n){1,3}/, `${name41}: ${message}
  `);
        }
    });
}

// lib/parser/SyntaxError.js
var MAX_LINE_LENGTH = 100;
var OFFSET_CORRECTION = 60;
var TAB_REPLACEMENT = "    ";
function sourceFragment({ source, line, column }, extraLines) {
    function processLines(start, end) {
        return lines.slice(start, end).map((line2, idx) => String(start + idx + 1).padStart(maxNumLength) + " |" + line2).join("\n");
    }
    const lines = source.split(/\r\n?|\n|\f/);
    const startLine = Math.max(1, line - extraLines) - 1;
    const endLine = Math.min(line + extraLines, lines.length + 1);
    const maxNumLength = Math.max(4, String(endLine).length) + 1;
    let cutLeft = 0;
    column += (TAB_REPLACEMENT.length - 1) * (lines[line - 1].substr(0, column - 1).match(/\t/g) || []).length;
    if (column > MAX_LINE_LENGTH) {
        cutLeft = column - OFFSET_CORRECTION + 3;
        column = OFFSET_CORRECTION - 2;
    }
    for (let i = startLine; i <= endLine; i++) {
        if (i >= 0 && i < lines.length) {
            lines[i] = lines[i].replace(/\t/g, TAB_REPLACEMENT);
            lines[i] = (cutLeft > 0 && lines[i].length > cutLeft ? "\u2026" : "") + lines[i].substr(cutLeft, MAX_LINE_LENGTH - 2) + (lines[i].length > cutLeft + MAX_LINE_LENGTH - 1 ? "\u2026" : "");
        }
    }
    return [
        processLines(startLine, line),
        new Array(column + maxNumLength + 2).join("-") + "^",
        processLines(line, endLine)
    ].filter(Boolean).join("\n");
}
function SyntaxError2(message, source, offset, line, column) {
    const error = Object.assign(createCustomError("SyntaxError", message), {
        source,
        offset,
        line,
        column,
        sourceFragment(extraLines) {
            return sourceFragment({ source, line, column }, isNaN(extraLines) ? 0 : extraLines);
        },
        get formattedMessage() {
            return `Parse error: ${message}
  ` + sourceFragment({ source, line, column }, 2);
        }
    });
    return error;
}

// lib/parser/sequence.js
function readSequence(recognizer) {
    const children = this.createList();
    let space = false;
    const context = {
        recognizer
    };
    while (!this.eof) {
        switch (this.tokenType) {
            case Comment:
                this.next();
                continue;
            case WhiteSpace:
                space = true;
                this.next();
                continue;
        }
        let child = recognizer.getNode.call(this, context);
        if (child === void 0) {
            break;
        }
        if (space) {
            if (recognizer.onWhiteSpace) {
                recognizer.onWhiteSpace.call(this, child, children, context);
            }
            space = false;
        }
        children.push(child);
    }
    if (space && recognizer.onWhiteSpace) {
        recognizer.onWhiteSpace.call(this, null, children, context);
    }
    return children;
}

// lib/parser/create.js
var NOOP = () => {
};
var EXCLAMATIONMARK = 33;
var NUMBERSIGN = 35;
var SEMICOLON = 59;
var LEFTCURLYBRACKET = 123;
var NULL = 0;
function createParseContext(name41) {
    return function () {
        return this[name41]();
    };
}
function fetchParseValues(dict) {
    const result = Object.create(null);
    for (const name41 in dict) {
        const item = dict[name41];
        if (item.parse) {
            result[name41] = item.parse;
        }
    }
    return result;
}
function processConfig(config) {
    const parseConfig = {
        context: Object.create(null),
        scope: Object.assign(Object.create(null), config.scope),
        atrule: fetchParseValues(config.atrule),
        pseudo: fetchParseValues(config.pseudo),
        node: fetchParseValues(config.node)
    };
    for (const name41 in config.parseContext) {
        switch (typeof config.parseContext[name41]) {
            case "function":
                parseConfig.context[name41] = config.parseContext[name41];
                break;
            case "string":
                parseConfig.context[name41] = createParseContext(config.parseContext[name41]);
                break;
        }
    }
    return {
        config: parseConfig,
        ...parseConfig,
        ...parseConfig.node
    };
}
function createParser(config) {
    let source = "";
    let filename = "<unknown>";
    let needPositions = false;
    let onParseError = NOOP;
    let onParseErrorThrow = false;
    const locationMap = new OffsetToLocation();
    const parser = Object.assign(new TokenStream(), processConfig(config || {}), {
        parseAtrulePrelude: true,
        parseRulePrelude: true,
        parseValue: true,
        parseCustomProperty: false,
        readSequence,
        consumeUntilBalanceEnd: () => 0,
        consumeUntilLeftCurlyBracket(code2) {
            return code2 === LEFTCURLYBRACKET ? 1 : 0;
        },
        consumeUntilLeftCurlyBracketOrSemicolon(code2) {
            return code2 === LEFTCURLYBRACKET || code2 === SEMICOLON ? 1 : 0;
        },
        consumeUntilExclamationMarkOrSemicolon(code2) {
            return code2 === EXCLAMATIONMARK || code2 === SEMICOLON ? 1 : 0;
        },
        consumeUntilSemicolonIncluded(code2) {
            return code2 === SEMICOLON ? 2 : 0;
        },
        createList() {
            return new List();
        },
        createSingleNodeList(node) {
            return new List().appendData(node);
        },
        getFirstListNode(list) {
            return list && list.first;
        },
        getLastListNode(list) {
            return list && list.last;
        },
        parseWithFallback(consumer, fallback) {
            const startToken = this.tokenIndex;
            try {
                return consumer.call(this);
            } catch (e) {
                if (onParseErrorThrow) {
                    throw e;
                }
                const fallbackNode = fallback.call(this, startToken);
                onParseErrorThrow = true;
                onParseError(e, fallbackNode);
                onParseErrorThrow = false;
                return fallbackNode;
            }
        },
        lookupNonWSType(offset) {
            let type;
            do {
                type = this.lookupType(offset++);
                if (type !== WhiteSpace) {
                    return type;
                }
            } while (type !== NULL);
            return NULL;
        },
        charCodeAt(offset) {
            return offset >= 0 && offset < source.length ? source.charCodeAt(offset) : 0;
        },
        substring(offsetStart, offsetEnd) {
            return source.substring(offsetStart, offsetEnd);
        },
        substrToCursor(start) {
            return this.source.substring(start, this.tokenStart);
        },
        cmpChar(offset, charCode) {
            return cmpChar(source, offset, charCode);
        },
        cmpStr(offsetStart, offsetEnd, str) {
            return cmpStr(source, offsetStart, offsetEnd, str);
        },
        consume(tokenType2) {
            const start = this.tokenStart;
            this.eat(tokenType2);
            return this.substrToCursor(start);
        },
        consumeFunctionName() {
            const name41 = source.substring(this.tokenStart, this.tokenEnd - 1);
            this.eat(Function);
            return name41;
        },
        consumeNumber(type) {
            const number2 = source.substring(this.tokenStart, consumeNumber(source, this.tokenStart));
            this.eat(type);
            return number2;
        },
        eat(tokenType2) {
            if (this.tokenType !== tokenType2) {
                const tokenName = names_default[tokenType2].slice(0, -6).replace(/-/g, " ").replace(/^./, (m) => m.toUpperCase());
                let message = `${/[[\](){}]/.test(tokenName) ? `"${tokenName}"` : tokenName} is expected`;
                let offset = this.tokenStart;
                switch (tokenType2) {
                    case Ident:
                        if (this.tokenType === Function || this.tokenType === Url) {
                            offset = this.tokenEnd - 1;
                            message = "Identifier is expected but function found";
                        } else {
                            message = "Identifier is expected";
                        }
                        break;
                    case Hash:
                        if (this.isDelim(NUMBERSIGN)) {
                            this.next();
                            offset++;
                            message = "Name is expected";
                        }
                        break;
                    case Percentage:
                        if (this.tokenType === Number2) {
                            offset = this.tokenEnd;
                            message = "Percent sign is expected";
                        }
                        break;
                }
                this.error(message, offset);
            }
            this.next();
        },
        eatIdent(name41) {
            if (this.tokenType !== Ident || this.lookupValue(0, name41) === false) {
                this.error(`Identifier "${name41}" is expected`);
            }
            this.next();
        },
        eatDelim(code2) {
            if (!this.isDelim(code2)) {
                this.error(`Delim "${String.fromCharCode(code2)}" is expected`);
            }
            this.next();
        },
        getLocation(start, end) {
            if (needPositions) {
                return locationMap.getLocationRange(start, end, filename);
            }
            return null;
        },
        getLocationFromList(list) {
            if (needPositions) {
                const head = this.getFirstListNode(list);
                const tail = this.getLastListNode(list);
                return locationMap.getLocationRange(head !== null ? head.loc.start.offset - locationMap.startOffset : this.tokenStart, tail !== null ? tail.loc.end.offset - locationMap.startOffset : this.tokenStart, filename);
            }
            return null;
        },
        error(message, offset) {
            const location = typeof offset !== "undefined" && offset < source.length ? locationMap.getLocation(offset) : this.eof ? locationMap.getLocation(findWhiteSpaceStart(source, source.length - 1)) : locationMap.getLocation(this.tokenStart);
            throw new SyntaxError2(message || "Unexpected input", source, location.offset, location.line, location.column);
        }
    });
    const parse43 = function (source_, options) {
        source = source_;
        options = options || {};
        parser.setSource(source, tokenize);
        locationMap.setSource(source, options.offset, options.line, options.column);
        filename = options.filename || "<unknown>";
        needPositions = Boolean(options.positions);
        onParseError = typeof options.onParseError === "function" ? options.onParseError : NOOP;
        onParseErrorThrow = false;
        parser.parseAtrulePrelude = "parseAtrulePrelude" in options ? Boolean(options.parseAtrulePrelude) : true;
        parser.parseRulePrelude = "parseRulePrelude" in options ? Boolean(options.parseRulePrelude) : true;
        parser.parseValue = "parseValue" in options ? Boolean(options.parseValue) : true;
        parser.parseCustomProperty = "parseCustomProperty" in options ? Boolean(options.parseCustomProperty) : false;
        const { context = "default", onComment } = options;
        if (context in parser.context === false) {
            throw new Error("Unknown context `" + context + "`");
        }
        if (typeof onComment === "function") {
            parser.forEachToken((type, start, end) => {
                if (type === Comment) {
                    const loc = parser.getLocation(start, end);
                    const value = cmpStr(source, end - 2, end, "*/") ? source.slice(start + 2, end - 2) : source.slice(start + 2, end);
                    onComment(value, loc);
                }
            });
        }
        const ast = parser.context[context].call(parser, options);
        if (!parser.eof) {
            parser.error();
        }
        return ast;
    };
    return Object.assign(parse43, {
        SyntaxError: SyntaxError2,
        config: parser.config
    });
}

// lib/generator/sourceMap.js
var import_source_map_generator = __toModule(require_source_map_generator());
var trackNodes = /* @__PURE__ */ new Set(["Atrule", "Selector", "Declaration"]);
function generateSourceMap(handlers) {
    const map = new import_source_map_generator.SourceMapGenerator();
    const generated = {
        line: 1,
        column: 0
    };
    const original = {
        line: 0,
        column: 0
    };
    const activatedGenerated = {
        line: 1,
        column: 0
    };
    const activatedMapping = {
        generated: activatedGenerated
    };
    let line = 1;
    let column = 0;
    let sourceMappingActive = false;
    const origHandlersNode = handlers.node;
    handlers.node = function (node) {
        if (node.loc && node.loc.start && trackNodes.has(node.type)) {
            const nodeLine = node.loc.start.line;
            const nodeColumn = node.loc.start.column - 1;
            if (original.line !== nodeLine || original.column !== nodeColumn) {
                original.line = nodeLine;
                original.column = nodeColumn;
                generated.line = line;
                generated.column = column;
                if (sourceMappingActive) {
                    sourceMappingActive = false;
                    if (generated.line !== activatedGenerated.line || generated.column !== activatedGenerated.column) {
                        map.addMapping(activatedMapping);
                    }
                }
                sourceMappingActive = true;
                map.addMapping({
                    source: node.loc.source,
                    original,
                    generated
                });
            }
        }
        origHandlersNode.call(this, node);
        if (sourceMappingActive && trackNodes.has(node.type)) {
            activatedGenerated.line = line;
            activatedGenerated.column = column;
        }
    };
    const origHandlersEmit = handlers.emit;
    handlers.emit = function (value, type, auto) {
        for (let i = 0; i < value.length; i++) {
            if (value.charCodeAt(i) === 10) {
                line++;
                column = 0;
            } else {
                column++;
            }
        }
        origHandlersEmit(value, type, auto);
    };
    const origHandlersResult = handlers.result;
    handlers.result = function () {
        if (sourceMappingActive) {
            map.addMapping(activatedMapping);
        }
        return {
            css: origHandlersResult(),
            map
        };
    };
    return handlers;
}

// lib/generator/token-before.js
var token_before_exports = {};
__export(token_before_exports, {
    safe: () => safe,
    spec: () => spec
});
var PLUSSIGN = 43;
var HYPHENMINUS = 45;
var code = (type, value) => {
    if (type === Delim) {
        type = value;
    }
    if (typeof type === "string") {
        const charCode = type.charCodeAt(0);
        return charCode > 127 ? 32768 : charCode << 8;
    }
    return type;
};
var specPairs = [
    [Ident, Ident],
    [Ident, Function],
    [Ident, Url],
    [Ident, BadUrl],
    [Ident, "-"],
    [Ident, Number2],
    [Ident, Percentage],
    [Ident, Dimension],
    [Ident, CDC],
    [Ident, LeftParenthesis],
    [AtKeyword, Ident],
    [AtKeyword, Function],
    [AtKeyword, Url],
    [AtKeyword, BadUrl],
    [AtKeyword, "-"],
    [AtKeyword, Number2],
    [AtKeyword, Percentage],
    [AtKeyword, Dimension],
    [AtKeyword, CDC],
    [Hash, Ident],
    [Hash, Function],
    [Hash, Url],
    [Hash, BadUrl],
    [Hash, "-"],
    [Hash, Number2],
    [Hash, Percentage],
    [Hash, Dimension],
    [Hash, CDC],
    [Dimension, Ident],
    [Dimension, Function],
    [Dimension, Url],
    [Dimension, BadUrl],
    [Dimension, "-"],
    [Dimension, Number2],
    [Dimension, Percentage],
    [Dimension, Dimension],
    [Dimension, CDC],
    ["#", Ident],
    ["#", Function],
    ["#", Url],
    ["#", BadUrl],
    ["#", "-"],
    ["#", Number2],
    ["#", Percentage],
    ["#", Dimension],
    ["#", CDC],
    ["-", Ident],
    ["-", Function],
    ["-", Url],
    ["-", BadUrl],
    ["-", "-"],
    ["-", Number2],
    ["-", Percentage],
    ["-", Dimension],
    ["-", CDC],
    [Number2, Ident],
    [Number2, Function],
    [Number2, Url],
    [Number2, BadUrl],
    [Number2, Number2],
    [Number2, Percentage],
    [Number2, Dimension],
    [Number2, "%"],
    [Number2, CDC],
    ["@", Ident],
    ["@", Function],
    ["@", Url],
    ["@", BadUrl],
    ["@", "-"],
    ["@", CDC],
    [".", Number2],
    [".", Percentage],
    [".", Dimension],
    ["+", Number2],
    ["+", Percentage],
    ["+", Dimension],
    ["/", "*"]
];
var safePairs = specPairs.concat([
    [Ident, Hash],
    [Dimension, Hash],
    [Hash, Hash],
    [AtKeyword, LeftParenthesis],
    [AtKeyword, String2],
    [AtKeyword, Colon],
    [Percentage, Percentage],
    [Percentage, Dimension],
    [Percentage, Function],
    [Percentage, "-"],
    [RightParenthesis, Ident],
    [RightParenthesis, Function],
    [RightParenthesis, Percentage],
    [RightParenthesis, Dimension],
    [RightParenthesis, Hash],
    [RightParenthesis, "-"]
]);
function createMap(pairs) {
    const isWhiteSpaceRequired = new Set(pairs.map(([prev, next]) => code(prev) << 16 | code(next)));
    return function (prevCode, type, value) {
        const nextCode = code(type, value);
        const nextCharCode = value.charCodeAt(0);
        const emitWs = nextCharCode === HYPHENMINUS && type !== Ident && type !== Function && type !== CDC || nextCharCode === PLUSSIGN ? isWhiteSpaceRequired.has(prevCode << 16 | nextCharCode << 8) : isWhiteSpaceRequired.has(prevCode << 16 | nextCode);
        if (emitWs) {
            this.emit(" ", WhiteSpace, true);
        }
        return nextCode;
    };
}
var spec = createMap(specPairs);
var safe = createMap(safePairs);

// lib/generator/create.js
var REVERSESOLIDUS = 92;
function processChildren(node, delimeter) {
    if (typeof delimeter === "function") {
        let prev = null;
        node.children.forEach((node2) => {
            if (prev !== null) {
                delimeter.call(this, prev);
            }
            this.node(node2);
            prev = node2;
        });
        return;
    }
    node.children.forEach(this.node, this);
}
function processChunk(chunk) {
    tokenize(chunk, (type, start, end) => {
        this.token(type, chunk.slice(start, end));
    });
}
function createGenerator(config) {
    const types = /* @__PURE__ */ new Map();
    for (let name41 in config.node) {
        types.set(name41, config.node[name41].generate);
    }
    return function (node, options) {
        let buffer = "";
        let prevCode = 0;
        let handlers = {
            node(node2) {
                if (types.has(node2.type)) {
                    types.get(node2.type).call(publicApi, node2);
                } else {
                    throw new Error("Unknown node type: " + node2.type);
                }
            },
            tokenBefore: safe,
            token(type, value) {
                prevCode = this.tokenBefore(prevCode, type, value);
                this.emit(value, type, false);
                if (type === Delim && value.charCodeAt(0) === REVERSESOLIDUS) {
                    this.emit("\n", WhiteSpace, true);
                }
            },
            emit(value) {
                buffer += value;
            },
            result() {
                return buffer;
            }
        };
        if (options) {
            if (typeof options.decorator === "function") {
                handlers = options.decorator(handlers);
            }
            if (options.sourceMap) {
                handlers = generateSourceMap(handlers);
            }
            if (options.mode in token_before_exports) {
                handlers.tokenBefore = token_before_exports[options.mode];
            }
        }
        const publicApi = {
            node: (node2) => handlers.node(node2),
            children: processChildren,
            token: (type, value) => handlers.token(type, value),
            tokenize: processChunk
        };
        handlers.node(node);
        return handlers.result();
    };
}

// lib/convertor/create.js
function createConvertor(walk2) {
    return {
        fromPlainObject: function (ast) {
            walk2(ast, {
                enter: function (node) {
                    if (node.children && node.children instanceof List === false) {
                        node.children = new List().fromArray(node.children);
                    }
                }
            });
            return ast;
        },
        toPlainObject: function (ast) {
            walk2(ast, {
                leave: function (node) {
                    if (node.children && node.children instanceof List) {
                        node.children = node.children.toArray();
                    }
                }
            });
            return ast;
        }
    };
}

// lib/walker/create.js
var { hasOwnProperty: hasOwnProperty2 } = Object.prototype;
var noop = function () {
};
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
function getWalkersFromStructure(name41, nodeType) {
    const structure41 = nodeType.structure;
    const walkers = [];
    for (const key in structure41) {
        if (hasOwnProperty2.call(structure41, key) === false) {
            continue;
        }
        let fieldTypes = structure41[key];
        const walker = {
            name: key,
            type: false,
            nullable: false
        };
        if (!Array.isArray(fieldTypes)) {
            fieldTypes = [fieldTypes];
        }
        for (const fieldType of fieldTypes) {
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
    const types = {};
    for (const name41 in config.node) {
        if (hasOwnProperty2.call(config.node, name41)) {
            const nodeType = config.node[name41];
            if (!nodeType.structure) {
                throw new Error("Missed `structure` field in `" + name41 + "` node type definition");
            }
            types[name41] = getWalkersFromStructure(name41, nodeType);
        }
    }
    return types;
}
function createTypeIterator(config, reverse) {
    const fields = config.fields.slice();
    const contextName = config.context;
    const useContext = typeof contextName === "string";
    if (reverse) {
        fields.reverse();
    }
    return function (node, context, walk2, walkReducer) {
        let prevContextValue;
        if (useContext) {
            prevContextValue = context[contextName];
            context[contextName] = node;
        }
        for (const field of fields) {
            const ref = node[field.name];
            if (!field.nullable || ref) {
                if (field.type === "list") {
                    const breakWalk = reverse ? ref.reduceRight(walkReducer, false) : ref.reduce(walkReducer, false);
                    if (breakWalk) {
                        return true;
                    }
                } else if (walk2(ref)) {
                    return true;
                }
            }
        }
        if (useContext) {
            context[contextName] = prevContextValue;
        }
    };
}
function createFastTraveralMap({
    StyleSheet,
    Atrule,
    Rule,
    Block,
    DeclarationList
}) {
    return {
        Atrule: {
            StyleSheet,
            Atrule,
            Rule,
            Block
        },
        Rule: {
            StyleSheet,
            Atrule,
            Rule,
            Block
        },
        Declaration: {
            StyleSheet,
            Atrule,
            Rule,
            Block,
            DeclarationList
        }
    };
}
function createWalker(config) {
    const types = getTypesFromConfig(config);
    const iteratorsNatural = {};
    const iteratorsReverse = {};
    const breakWalk = Symbol("break-walk");
    const skipNode = Symbol("skip-node");
    for (const name41 in types) {
        if (hasOwnProperty2.call(types, name41) && types[name41] !== null) {
            iteratorsNatural[name41] = createTypeIterator(types[name41], false);
            iteratorsReverse[name41] = createTypeIterator(types[name41], true);
        }
    }
    const fastTraversalIteratorsNatural = createFastTraveralMap(iteratorsNatural);
    const fastTraversalIteratorsReverse = createFastTraveralMap(iteratorsReverse);
    const walk2 = function (root, options) {
        function walkNode(node, item, list) {
            const enterRet = enter.call(context, node, item, list);
            if (enterRet === breakWalk) {
                return true;
            }
            if (enterRet === skipNode) {
                return false;
            }
            if (iterators.hasOwnProperty(node.type)) {
                if (iterators[node.type](node, context, walkNode, walkReducer)) {
                    return true;
                }
            }
            if (leave.call(context, node, item, list) === breakWalk) {
                return true;
            }
            return false;
        }
        let enter = noop;
        let leave = noop;
        let iterators = iteratorsNatural;
        let walkReducer = (ret, data, item, list) => ret || walkNode(data, item, list);
        const context = {
            break: breakWalk,
            skip: skipNode,
            root,
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
                    iterators = options.reverse ? fastTraversalIteratorsReverse[options.visit] : fastTraversalIteratorsNatural[options.visit];
                } else if (!types.hasOwnProperty(options.visit)) {
                    throw new Error("Bad value `" + options.visit + "` for `visit` option (should be: " + Object.keys(types).sort().join(", ") + ")");
                }
                enter = invokeForType(enter, options.visit);
                leave = invokeForType(leave, options.visit);
            }
        }
        if (enter === noop && leave === noop) {
            throw new Error("Neither `enter` nor `leave` walker handler is set or both aren't a function");
        }
        walkNode(root);
    };
    walk2.break = breakWalk;
    walk2.skip = skipNode;
    walk2.find = function (ast, fn) {
        let found = null;
        walk2(ast, function (node, item, list) {
            if (fn.call(this, node, item, list)) {
                found = node;
                return breakWalk;
            }
        });
        return found;
    };
    walk2.findLast = function (ast, fn) {
        let found = null;
        walk2(ast, {
            reverse: true,
            enter: function (node, item, list) {
                if (fn.call(this, node, item, list)) {
                    found = node;
                    return breakWalk;
                }
            }
        });
        return found;
    };
    walk2.findAll = function (ast, fn) {
        const found = [];
        walk2(ast, function (node, item, list) {
            if (fn.call(this, node, item, list)) {
                found.push(node);
            }
        });
        return found;
    };
    return walk2;
}

// lib/definition-syntax/generate.js
function noop2(value) {
    return value;
}
function generateMultiplier(multiplier) {
    const { min, max, comma } = multiplier;
    if (min === 0 && max === 0) {
        return "*";
    }
    if (min === 0 && max === 1) {
        return "?";
    }
    if (min === 1 && max === 0) {
        return comma ? "#" : "+";
    }
    if (min === 1 && max === 1) {
        return "";
    }
    return (comma ? "#" : "") + (min === max ? "{" + min + "}" : "{" + min + "," + (max !== 0 ? max : "") + "}");
}
function generateTypeOpts(node) {
    switch (node.type) {
        case "Range":
            return " [" + (node.min === null ? "-\u221E" : node.min) + "," + (node.max === null ? "\u221E" : node.max) + "]";
        default:
            throw new Error("Unknown node type `" + node.type + "`");
    }
}
function generateSequence(node, decorate, forceBraces, compact) {
    const combinator = node.combinator === " " || compact ? node.combinator : " " + node.combinator + " ";
    const result = node.terms.map((term) => internalGenerate(term, decorate, forceBraces, compact)).join(combinator);
    if (node.explicit || forceBraces) {
        return (compact || result[0] === "," ? "[" : "[ ") + result + (compact ? "]" : " ]");
    }
    return result;
}
function internalGenerate(node, decorate, forceBraces, compact) {
    let result;
    switch (node.type) {
        case "Group":
            result = generateSequence(node, decorate, forceBraces, compact) + (node.disallowEmpty ? "!" : "");
            break;
        case "Multiplier":
            return internalGenerate(node.term, decorate, forceBraces, compact) + decorate(generateMultiplier(node), node);
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
function generate(node, options) {
    let decorate = noop2;
    let forceBraces = false;
    let compact = false;
    if (typeof options === "function") {
        decorate = options;
    } else if (options) {
        forceBraces = Boolean(options.forceBraces);
        compact = Boolean(options.compact);
        if (typeof options.decorate === "function") {
            decorate = options.decorate;
        }
    }
    return internalGenerate(node, decorate, forceBraces, compact);
}

// lib/lexer/error.js
var defaultLoc = { offset: 0, line: 1, column: 1 };
function locateMismatch(matchResult, node) {
    const tokens = matchResult.tokens;
    const longestMatch = matchResult.longestMatch;
    const mismatchNode = longestMatch < tokens.length ? tokens[longestMatch].node || null : null;
    const badNode = mismatchNode !== node ? mismatchNode : null;
    let mismatchOffset = 0;
    let mismatchLength = 0;
    let entries = 0;
    let css = "";
    let start;
    let end;
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i].value;
        if (i === longestMatch) {
            mismatchLength = token.length;
            mismatchOffset = css.length;
        }
        if (badNode !== null && tokens[i].node === badNode) {
            if (i <= longestMatch) {
                entries++;
            } else {
                entries = 0;
            }
        }
        css += token;
    }
    if (longestMatch === tokens.length || entries > 1) {
        start = fromLoc(badNode || node, "end") || buildLoc(defaultLoc, css);
        end = buildLoc(start);
    } else {
        start = fromLoc(badNode, "start") || buildLoc(fromLoc(node, "start") || defaultLoc, css.slice(0, mismatchOffset));
        end = fromLoc(badNode, "end") || buildLoc(start, css.substr(mismatchOffset, mismatchLength));
    }
    return {
        css,
        mismatchOffset,
        mismatchLength,
        start,
        end
    };
}
function fromLoc(node, point) {
    const value = node && node.loc && node.loc[point];
    if (value) {
        return "line" in value ? buildLoc(value) : value;
    }
    return null;
}
function buildLoc({ offset, line, column }, extra) {
    const loc = {
        offset,
        line,
        column
    };
    if (extra) {
        const lines = extra.split(/\n|\r\n?|\f/);
        loc.offset += extra.length;
        loc.line += lines.length - 1;
        loc.column = lines.length === 1 ? loc.column + extra.length : lines.pop().length + 1;
    }
    return loc;
}
var SyntaxReferenceError = function (type, referenceName) {
    const error = createCustomError("SyntaxReferenceError", type + (referenceName ? " `" + referenceName + "`" : ""));
    error.reference = referenceName;
    return error;
};
var SyntaxMatchError = function (message, syntax, node, matchResult) {
    const error = createCustomError("SyntaxMatchError", message);
    const {
        css,
        mismatchOffset,
        mismatchLength,
        start,
        end
    } = locateMismatch(matchResult, node);
    error.rawMessage = message;
    error.syntax = syntax ? generate(syntax) : "<generic>";
    error.css = css;
    error.mismatchOffset = mismatchOffset;
    error.mismatchLength = mismatchLength;
    error.message = message + "\n  syntax: " + error.syntax + "\n   value: " + (css || "<empty string>") + "\n  --------" + new Array(error.mismatchOffset + 1).join("-") + "^";
    Object.assign(error, start);
    error.loc = {
        source: node && node.loc && node.loc.source || "<unknown>",
        start,
        end
    };
    return error;
};

// lib/utils/names.js
var keywords = /* @__PURE__ */ new Map();
var properties = /* @__PURE__ */ new Map();
var HYPHENMINUS2 = 45;
var keyword = getKeywordDescriptor;
var property = getPropertyDescriptor;
var vendorPrefix = getVendorPrefix;
function isCustomProperty(str, offset) {
    offset = offset || 0;
    return str.length - offset >= 2 && str.charCodeAt(offset) === HYPHENMINUS2 && str.charCodeAt(offset + 1) === HYPHENMINUS2;
}
function getVendorPrefix(str, offset) {
    offset = offset || 0;
    if (str.length - offset >= 3) {
        if (str.charCodeAt(offset) === HYPHENMINUS2 && str.charCodeAt(offset + 1) !== HYPHENMINUS2) {
            const secondDashIndex = str.indexOf("-", offset + 2);
            if (secondDashIndex !== -1) {
                return str.substring(offset, secondDashIndex + 1);
            }
        }
    }
    return "";
}
function getKeywordDescriptor(keyword2) {
    if (keywords.has(keyword2)) {
        return keywords.get(keyword2);
    }
    const name41 = keyword2.toLowerCase();
    let descriptor = keywords.get(name41);
    if (descriptor === void 0) {
        const custom = isCustomProperty(name41, 0);
        const vendor = !custom ? getVendorPrefix(name41, 0) : "";
        descriptor = Object.freeze({
            basename: name41.substr(vendor.length),
            name: name41,
            prefix: vendor,
            vendor,
            custom
        });
    }
    keywords.set(keyword2, descriptor);
    return descriptor;
}
function getPropertyDescriptor(property2) {
    if (properties.has(property2)) {
        return properties.get(property2);
    }
    let name41 = property2;
    let hack = property2[0];
    if (hack === "/") {
        hack = property2[1] === "/" ? "//" : "/";
    } else if (hack !== "_" && hack !== "*" && hack !== "$" && hack !== "#" && hack !== "+" && hack !== "&") {
        hack = "";
    }
    const custom = isCustomProperty(name41, hack.length);
    if (!custom) {
        name41 = name41.toLowerCase();
        if (properties.has(name41)) {
            const descriptor2 = properties.get(name41);
            properties.set(property2, descriptor2);
            return descriptor2;
        }
    }
    const vendor = !custom ? getVendorPrefix(name41, hack.length) : "";
    const prefix = name41.substr(0, hack.length + vendor.length);
    const descriptor = Object.freeze({
        basename: name41.substr(prefix.length),
        name: name41.substr(hack.length),
        hack,
        vendor,
        prefix,
        custom
    });
    properties.set(property2, descriptor);
    return descriptor;
}

// lib/lexer/generic-an-plus-b.js
var PLUSSIGN2 = 43;
var HYPHENMINUS3 = 45;
var N2 = 110;
var DISALLOW_SIGN = true;
var ALLOW_SIGN = false;
function isDelim(token, code2) {
    return token !== null && token.type === Delim && token.value.charCodeAt(0) === code2;
}
function skipSC(token, offset, getNextToken) {
    while (token !== null && (token.type === WhiteSpace || token.type === Comment)) {
        token = getNextToken(++offset);
    }
    return offset;
}
function checkInteger(token, valueOffset, disallowSign, offset) {
    if (!token) {
        return 0;
    }
    const code2 = token.value.charCodeAt(valueOffset);
    if (code2 === PLUSSIGN2 || code2 === HYPHENMINUS3) {
        if (disallowSign) {
            return 0;
        }
        valueOffset++;
    }
    for (; valueOffset < token.value.length; valueOffset++) {
        if (!isDigit(token.value.charCodeAt(valueOffset))) {
            return 0;
        }
    }
    return offset + 1;
}
function consumeB(token, offset_, getNextToken) {
    let sign = false;
    let offset = skipSC(token, offset_, getNextToken);
    token = getNextToken(offset);
    if (token === null) {
        return offset_;
    }
    if (token.type !== Number2) {
        if (isDelim(token, PLUSSIGN2) || isDelim(token, HYPHENMINUS3)) {
            sign = true;
            offset = skipSC(getNextToken(++offset), offset, getNextToken);
            token = getNextToken(offset);
            if (token === null || token.type !== Number2) {
                return 0;
            }
        } else {
            return offset_;
        }
    }
    if (!sign) {
        const code2 = token.value.charCodeAt(0);
        if (code2 !== PLUSSIGN2 && code2 !== HYPHENMINUS3) {
            return 0;
        }
    }
    return checkInteger(token, sign ? 0 : 1, sign, offset);
}
function anPlusB(token, getNextToken) {
    let offset = 0;
    if (!token) {
        return 0;
    }
    if (token.type === Number2) {
        return checkInteger(token, 0, ALLOW_SIGN, offset);
    } else if (token.type === Ident && token.value.charCodeAt(0) === HYPHENMINUS3) {
        if (!cmpChar(token.value, 1, N2)) {
            return 0;
        }
        switch (token.value.length) {
            case 2:
                return consumeB(getNextToken(++offset), offset, getNextToken);
            case 3:
                if (token.value.charCodeAt(2) !== HYPHENMINUS3) {
                    return 0;
                }
                offset = skipSC(getNextToken(++offset), offset, getNextToken);
                token = getNextToken(offset);
                return checkInteger(token, 0, DISALLOW_SIGN, offset);
            default:
                if (token.value.charCodeAt(2) !== HYPHENMINUS3) {
                    return 0;
                }
                return checkInteger(token, 3, DISALLOW_SIGN, offset);
        }
    } else if (token.type === Ident || isDelim(token, PLUSSIGN2) && getNextToken(offset + 1).type === Ident) {
        if (token.type !== Ident) {
            token = getNextToken(++offset);
        }
        if (token === null || !cmpChar(token.value, 0, N2)) {
            return 0;
        }
        switch (token.value.length) {
            case 1:
                return consumeB(getNextToken(++offset), offset, getNextToken);
            case 2:
                if (token.value.charCodeAt(1) !== HYPHENMINUS3) {
                    return 0;
                }
                offset = skipSC(getNextToken(++offset), offset, getNextToken);
                token = getNextToken(offset);
                return checkInteger(token, 0, DISALLOW_SIGN, offset);
            default:
                if (token.value.charCodeAt(1) !== HYPHENMINUS3) {
                    return 0;
                }
                return checkInteger(token, 2, DISALLOW_SIGN, offset);
        }
    } else if (token.type === Dimension) {
        let code2 = token.value.charCodeAt(0);
        let sign = code2 === PLUSSIGN2 || code2 === HYPHENMINUS3 ? 1 : 0;
        let i = sign;
        for (; i < token.value.length; i++) {
            if (!isDigit(token.value.charCodeAt(i))) {
                break;
            }
        }
        if (i === sign) {
            return 0;
        }
        if (!cmpChar(token.value, i, N2)) {
            return 0;
        }
        if (i + 1 === token.value.length) {
            return consumeB(getNextToken(++offset), offset, getNextToken);
        } else {
            if (token.value.charCodeAt(i + 1) !== HYPHENMINUS3) {
                return 0;
            }
            if (i + 2 === token.value.length) {
                offset = skipSC(getNextToken(++offset), offset, getNextToken);
                token = getNextToken(offset);
                return checkInteger(token, 0, DISALLOW_SIGN, offset);
            } else {
                return checkInteger(token, i + 2, DISALLOW_SIGN, offset);
            }
        }
    }
    return 0;
}

// lib/lexer/generic-urange.js
var PLUSSIGN3 = 43;
var HYPHENMINUS4 = 45;
var QUESTIONMARK = 63;
var U = 117;
function isDelim2(token, code2) {
    return token !== null && token.type === Delim && token.value.charCodeAt(0) === code2;
}
function startsWith(token, code2) {
    return token.value.charCodeAt(0) === code2;
}
function hexSequence(token, offset, allowDash) {
    let hexlen = 0;
    for (let pos = offset; pos < token.value.length; pos++) {
        const code2 = token.value.charCodeAt(pos);
        if (code2 === HYPHENMINUS4 && allowDash && hexlen !== 0) {
            hexSequence(token, offset + hexlen + 1, false);
            return 6;
        }
        if (!isHexDigit(code2)) {
            return 0;
        }
        if (++hexlen > 6) {
            return 0;
        }
        ;
    }
    return hexlen;
}
function withQuestionMarkSequence(consumed, length, getNextToken) {
    if (!consumed) {
        return 0;
    }
    while (isDelim2(getNextToken(length), QUESTIONMARK)) {
        if (++consumed > 6) {
            return 0;
        }
        length++;
    }
    return length;
}
function urange(token, getNextToken) {
    let length = 0;
    if (token === null || token.type !== Ident || !cmpChar(token.value, 0, U)) {
        return 0;
    }
    token = getNextToken(++length);
    if (token === null) {
        return 0;
    }
    if (isDelim2(token, PLUSSIGN3)) {
        token = getNextToken(++length);
        if (token === null) {
            return 0;
        }
        if (token.type === Ident) {
            return withQuestionMarkSequence(hexSequence(token, 0, true), ++length, getNextToken);
        }
        if (isDelim2(token, QUESTIONMARK)) {
            return withQuestionMarkSequence(1, ++length, getNextToken);
        }
        return 0;
    }
    if (token.type === Number2) {
        const consumedHexLength = hexSequence(token, 1, true);
        if (consumedHexLength === 0) {
            return 0;
        }
        token = getNextToken(++length);
        if (token === null) {
            return length;
        }
        if (token.type === Dimension || token.type === Number2) {
            if (!startsWith(token, HYPHENMINUS4) || !hexSequence(token, 1, false)) {
                return 0;
            }
            return length + 1;
        }
        return withQuestionMarkSequence(consumedHexLength, length, getNextToken);
    }
    if (token.type === Dimension) {
        return withQuestionMarkSequence(hexSequence(token, 1, true), ++length, getNextToken);
    }
    return 0;
}

// lib/lexer/generic.js
var cssWideKeywords = ["unset", "initial", "inherit"];
var calcFunctionNames = ["calc(", "-moz-calc(", "-webkit-calc("];
var balancePair2 = /* @__PURE__ */ new Map([
    [Function, RightParenthesis],
    [LeftParenthesis, RightParenthesis],
    [LeftSquareBracket, RightSquareBracket],
    [LeftCurlyBracket, RightCurlyBracket]
]);
var LENGTH = [
    "px",
    "mm",
    "cm",
    "in",
    "pt",
    "pc",
    "q",
    "em",
    "ex",
    "ch",
    "rem",
    "vh",
    "vw",
    "vmin",
    "vmax",
    "vm"
];
var ANGLE = ["deg", "grad", "rad", "turn"];
var TIME = ["s", "ms"];
var FREQUENCY = ["hz", "khz"];
var RESOLUTION = ["dpi", "dpcm", "dppx", "x"];
var FLEX = ["fr"];
var DECIBEL = ["db"];
var SEMITONES = ["st"];
function charCodeAt(str, index) {
    return index < str.length ? str.charCodeAt(index) : 0;
}
function eqStr(actual, expected) {
    return cmpStr(actual, 0, actual.length, expected);
}
function eqStrAny(actual, expected) {
    for (let i = 0; i < expected.length; i++) {
        if (eqStr(actual, expected[i])) {
            return true;
        }
    }
    return false;
}
function isPostfixIeHack(str, offset) {
    if (offset !== str.length - 2) {
        return false;
    }
    return charCodeAt(str, offset) === 92 && isDigit(charCodeAt(str, offset + 1));
}
function outOfRange(opts, value, numEnd) {
    if (opts && opts.type === "Range") {
        const num = Number(numEnd !== void 0 && numEnd !== value.length ? value.substr(0, numEnd) : value);
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
    let balanceCloseType = 0;
    let balanceStash = [];
    let length = 0;
    scan:
    do {
        switch (token.type) {
            case RightCurlyBracket:
            case RightParenthesis:
            case RightSquareBracket:
                if (token.type !== balanceCloseType) {
                    break scan;
                }
                balanceCloseType = balanceStash.pop();
                if (balanceStash.length === 0) {
                    length++;
                    break scan;
                }
                break;
            case Function:
            case LeftParenthesis:
            case LeftSquareBracket:
            case LeftCurlyBracket:
                balanceStash.push(balanceCloseType);
                balanceCloseType = balancePair2.get(token.type);
                break;
        }
        length++;
    } while (token = getNextToken(length));
    return length;
}
function calc(next) {
    return function (token, getNextToken, opts) {
        if (token === null) {
            return 0;
        }
        if (token.type === Function && eqStrAny(token.value, calcFunctionNames)) {
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
function func(name41) {
    name41 = name41 + "(";
    return function (token, getNextToken) {
        if (token !== null && eqStr(token.value, name41)) {
            return consumeFunction(token, getNextToken);
        }
        return 0;
    };
}
function customIdent(token) {
    if (token === null || token.type !== Ident) {
        return 0;
    }
    const name41 = token.value.toLowerCase();
    if (eqStrAny(name41, cssWideKeywords)) {
        return 0;
    }
    if (eqStr(name41, "default")) {
        return 0;
    }
    return 1;
}
function customPropertyName(token) {
    if (token === null || token.type !== Ident) {
        return 0;
    }
    if (charCodeAt(token.value, 0) !== 45 || charCodeAt(token.value, 1) !== 45) {
        return 0;
    }
    return 1;
}
function hexColor(token) {
    if (token === null || token.type !== Hash) {
        return 0;
    }
    const length = token.value.length;
    if (length !== 4 && length !== 5 && length !== 7 && length !== 9) {
        return 0;
    }
    for (let i = 1; i < length; i++) {
        if (!isHexDigit(charCodeAt(token.value, i))) {
            return 0;
        }
    }
    return 1;
}
function idSelector(token) {
    if (token === null || token.type !== Hash) {
        return 0;
    }
    if (!isIdentifierStart(charCodeAt(token.value, 1), charCodeAt(token.value, 2), charCodeAt(token.value, 3))) {
        return 0;
    }
    return 1;
}
function declarationValue(token, getNextToken) {
    if (!token) {
        return 0;
    }
    let balanceCloseType = 0;
    let balanceStash = [];
    let length = 0;
    scan:
    do {
        switch (token.type) {
            case BadString:
            case BadUrl:
                break scan;
            case RightCurlyBracket:
            case RightParenthesis:
            case RightSquareBracket:
                if (token.type !== balanceCloseType) {
                    break scan;
                }
                balanceCloseType = balanceStash.pop();
                break;
            case Semicolon:
                if (balanceCloseType === 0) {
                    break scan;
                }
                break;
            case Delim:
                if (balanceCloseType === 0 && token.value === "!") {
                    break scan;
                }
                break;
            case Function:
            case LeftParenthesis:
            case LeftSquareBracket:
            case LeftCurlyBracket:
                balanceStash.push(balanceCloseType);
                balanceCloseType = balancePair2.get(token.type);
                break;
        }
        length++;
    } while (token = getNextToken(length));
    return length;
}
function anyValue(token, getNextToken) {
    if (!token) {
        return 0;
    }
    let balanceCloseType = 0;
    let balanceStash = [];
    let length = 0;
    scan:
    do {
        switch (token.type) {
            case BadString:
            case BadUrl:
                break scan;
            case RightCurlyBracket:
            case RightParenthesis:
            case RightSquareBracket:
                if (token.type !== balanceCloseType) {
                    break scan;
                }
                balanceCloseType = balanceStash.pop();
                break;
            case Function:
            case LeftParenthesis:
            case LeftSquareBracket:
            case LeftCurlyBracket:
                balanceStash.push(balanceCloseType);
                balanceCloseType = balancePair2.get(token.type);
                break;
        }
        length++;
    } while (token = getNextToken(length));
    return length;
}
function dimension(type) {
    if (type) {
        type = new Set(type);
    }
    return function (token, getNextToken, opts) {
        if (token === null || token.type !== Dimension) {
            return 0;
        }
        const numberEnd = consumeNumber(token.value, 0);
        if (type !== null) {
            const reverseSolidusOffset = token.value.indexOf("\\", numberEnd);
            const unit = reverseSolidusOffset === -1 || !isPostfixIeHack(token.value, reverseSolidusOffset) ? token.value.substr(numberEnd) : token.value.substring(numberEnd, reverseSolidusOffset);
            if (type.has(unit.toLowerCase()) === false) {
                return 0;
            }
        }
        if (outOfRange(opts, token.value, numberEnd)) {
            return 0;
        }
        return 1;
    };
}
function percentage(token, getNextToken, opts) {
    if (token === null || token.type !== Percentage) {
        return 0;
    }
    if (outOfRange(opts, token.value, token.value.length - 1)) {
        return 0;
    }
    return 1;
}
function zero(next) {
    if (typeof next !== "function") {
        next = function () {
            return 0;
        };
    }
    return function (token, getNextToken, opts) {
        if (token !== null && token.type === Number2) {
            if (Number(token.value) === 0) {
                return 1;
            }
        }
        return next(token, getNextToken, opts);
    };
}
function number(token, getNextToken, opts) {
    if (token === null) {
        return 0;
    }
    const numberEnd = consumeNumber(token.value, 0);
    const isNumber = numberEnd === token.value.length;
    if (!isNumber && !isPostfixIeHack(token.value, numberEnd)) {
        return 0;
    }
    if (outOfRange(opts, token.value, numberEnd)) {
        return 0;
    }
    return 1;
}
function integer(token, getNextToken, opts) {
    if (token === null || token.type !== Number2) {
        return 0;
    }
    let i = charCodeAt(token.value, 0) === 43 || charCodeAt(token.value, 0) === 45 ? 1 : 0;
    for (; i < token.value.length; i++) {
        if (!isDigit(charCodeAt(token.value, i))) {
            return 0;
        }
    }
    if (outOfRange(opts, token.value, i)) {
        return 0;
    }
    return 1;
}
var generic_default = {
    "ident-token": tokenType(Ident),
    "function-token": tokenType(Function),
    "at-keyword-token": tokenType(AtKeyword),
    "hash-token": tokenType(Hash),
    "string-token": tokenType(String2),
    "bad-string-token": tokenType(BadString),
    "url-token": tokenType(Url),
    "bad-url-token": tokenType(BadUrl),
    "delim-token": tokenType(Delim),
    "number-token": tokenType(Number2),
    "percentage-token": tokenType(Percentage),
    "dimension-token": tokenType(Dimension),
    "whitespace-token": tokenType(WhiteSpace),
    "CDO-token": tokenType(CDO),
    "CDC-token": tokenType(CDC),
    "colon-token": tokenType(Colon),
    "semicolon-token": tokenType(Semicolon),
    "comma-token": tokenType(Comma),
    "[-token": tokenType(LeftSquareBracket),
    "]-token": tokenType(RightSquareBracket),
    "(-token": tokenType(LeftParenthesis),
    ")-token": tokenType(RightParenthesis),
    "{-token": tokenType(LeftCurlyBracket),
    "}-token": tokenType(RightCurlyBracket),
    "string": tokenType(String2),
    "ident": tokenType(Ident),
    "custom-ident": customIdent,
    "custom-property-name": customPropertyName,
    "hex-color": hexColor,
    "id-selector": idSelector,
    "an-plus-b": anPlusB,
    "urange": urange,
    "declaration-value": declarationValue,
    "any-value": anyValue,
    "dimension": calc(dimension(null)),
    "angle": calc(dimension(ANGLE)),
    "decibel": calc(dimension(DECIBEL)),
    "frequency": calc(dimension(FREQUENCY)),
    "flex": calc(dimension(FLEX)),
    "length": calc(zero(dimension(LENGTH))),
    "resolution": calc(dimension(RESOLUTION)),
    "semitones": calc(dimension(SEMITONES)),
    "time": calc(dimension(TIME)),
    "percentage": calc(percentage),
    "zero": zero(),
    "number": calc(number),
    "integer": calc(integer),
    "-ms-legacy-expression": func("expression")
};

// lib/definition-syntax/index.js
var definition_syntax_exports = {};
__export(definition_syntax_exports, {
    SyntaxError: () => SyntaxError3,
    generate: () => generate,
    parse: () => parse,
    walk: () => walk
});

// lib/definition-syntax/SyntaxError.js
function SyntaxError3(message, input, offset) {
    return Object.assign(createCustomError("SyntaxError", message), {
        input,
        offset,
        rawMessage: message,
        message: message + "\n  " + input + "\n--" + new Array((offset || input.length) + 1).join("-") + "^"
    });
}

// lib/definition-syntax/tokenizer.js
var TAB = 9;
var N3 = 10;
var F2 = 12;
var R2 = 13;
var SPACE = 32;
var Tokenizer = class {
    constructor(str) {
        this.str = str;
        this.pos = 0;
    }
    charCodeAt(pos) {
        return pos < this.str.length ? this.str.charCodeAt(pos) : 0;
    }
    charCode() {
        return this.charCodeAt(this.pos);
    }
    nextCharCode() {
        return this.charCodeAt(this.pos + 1);
    }
    nextNonWsCode(pos) {
        return this.charCodeAt(this.findWsEnd(pos));
    }
    findWsEnd(pos) {
        for (; pos < this.str.length; pos++) {
            const code2 = this.str.charCodeAt(pos);
            if (code2 !== R2 && code2 !== N3 && code2 !== F2 && code2 !== SPACE && code2 !== TAB) {
                break;
            }
        }
        return pos;
    }
    substringToPos(end) {
        return this.str.substring(this.pos, this.pos = end);
    }
    eat(code2) {
        if (this.charCode() !== code2) {
            this.error("Expect `" + String.fromCharCode(code2) + "`");
        }
        this.pos++;
    }
    peek() {
        return this.pos < this.str.length ? this.str.charAt(this.pos++) : "";
    }
    error(message) {
        throw new SyntaxError3(message, this.str, this.pos);
    }
};

// lib/definition-syntax/parse.js
var TAB2 = 9;
var N4 = 10;
var F3 = 12;
var R3 = 13;
var SPACE2 = 32;
var EXCLAMATIONMARK2 = 33;
var NUMBERSIGN2 = 35;
var AMPERSAND = 38;
var APOSTROPHE = 39;
var LEFTPARENTHESIS = 40;
var RIGHTPARENTHESIS = 41;
var ASTERISK = 42;
var PLUSSIGN4 = 43;
var COMMA = 44;
var HYPERMINUS = 45;
var LESSTHANSIGN = 60;
var GREATERTHANSIGN = 62;
var QUESTIONMARK2 = 63;
var COMMERCIALAT = 64;
var LEFTSQUAREBRACKET = 91;
var RIGHTSQUAREBRACKET = 93;
var LEFTCURLYBRACKET2 = 123;
var VERTICALLINE = 124;
var RIGHTCURLYBRACKET = 125;
var INFINITY = 8734;
var NAME_CHAR = new Uint8Array(128).map((_, idx) => /[a-zA-Z0-9\-]/.test(String.fromCharCode(idx)) ? 1 : 0);
var COMBINATOR_PRECEDENCE = {
    " ": 1,
    "&&": 2,
    "||": 3,
    "|": 4
};
function scanSpaces(tokenizer) {
    return tokenizer.substringToPos(tokenizer.findWsEnd(tokenizer.pos));
}
function scanWord(tokenizer) {
    let end = tokenizer.pos;
    for (; end < tokenizer.str.length; end++) {
        const code2 = tokenizer.str.charCodeAt(end);
        if (code2 >= 128 || NAME_CHAR[code2] === 0) {
            break;
        }
    }
    if (tokenizer.pos === end) {
        tokenizer.error("Expect a keyword");
    }
    return tokenizer.substringToPos(end);
}
function scanNumber(tokenizer) {
    let end = tokenizer.pos;
    for (; end < tokenizer.str.length; end++) {
        const code2 = tokenizer.str.charCodeAt(end);
        if (code2 < 48 || code2 > 57) {
            break;
        }
    }
    if (tokenizer.pos === end) {
        tokenizer.error("Expect a number");
    }
    return tokenizer.substringToPos(end);
}
function scanString(tokenizer) {
    const end = tokenizer.str.indexOf("'", tokenizer.pos + 1);
    if (end === -1) {
        tokenizer.pos = tokenizer.str.length;
        tokenizer.error("Expect an apostrophe");
    }
    return tokenizer.substringToPos(end + 1);
}
function readMultiplierRange(tokenizer) {
    let min = null;
    let max = null;
    tokenizer.eat(LEFTCURLYBRACKET2);
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
    let range = null;
    let comma = false;
    switch (tokenizer.charCode()) {
        case ASTERISK:
            tokenizer.pos++;
            range = {
                min: 0,
                max: 0
            };
            break;
        case PLUSSIGN4:
            tokenizer.pos++;
            range = {
                min: 1,
                max: 0
            };
            break;
        case QUESTIONMARK2:
            tokenizer.pos++;
            range = {
                min: 0,
                max: 1
            };
            break;
        case NUMBERSIGN2:
            tokenizer.pos++;
            comma = true;
            if (tokenizer.charCode() === LEFTCURLYBRACKET2) {
                range = readMultiplierRange(tokenizer);
            } else {
                range = {
                    min: 1,
                    max: 0
                };
            }
            break;
        case LEFTCURLYBRACKET2:
            range = readMultiplierRange(tokenizer);
            break;
        default:
            return null;
    }
    return {
        type: "Multiplier",
        comma,
        min: range.min,
        max: range.max,
        term: null
    };
}
function maybeMultiplied(tokenizer, node) {
    const multiplier = readMultiplier(tokenizer);
    if (multiplier !== null) {
        multiplier.term = node;
        return multiplier;
    }
    return node;
}
function maybeToken(tokenizer) {
    const ch = tokenizer.peek();
    if (ch === "") {
        return null;
    }
    return {
        type: "Token",
        value: ch
    };
}
function readProperty(tokenizer) {
    let name41;
    tokenizer.eat(LESSTHANSIGN);
    tokenizer.eat(APOSTROPHE);
    name41 = scanWord(tokenizer);
    tokenizer.eat(APOSTROPHE);
    tokenizer.eat(GREATERTHANSIGN);
    return maybeMultiplied(tokenizer, {
        type: "Property",
        name: name41
    });
}
function readTypeRange(tokenizer) {
    let min = null;
    let max = null;
    let sign = 1;
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
    if (min === null && max === null) {
        return null;
    }
    return {
        type: "Range",
        min,
        max
    };
}
function readType(tokenizer) {
    let name41;
    let opts = null;
    tokenizer.eat(LESSTHANSIGN);
    name41 = scanWord(tokenizer);
    if (tokenizer.charCode() === LEFTPARENTHESIS && tokenizer.nextCharCode() === RIGHTPARENTHESIS) {
        tokenizer.pos += 2;
        name41 += "()";
    }
    if (tokenizer.charCodeAt(tokenizer.findWsEnd(tokenizer.pos)) === LEFTSQUAREBRACKET) {
        scanSpaces(tokenizer);
        opts = readTypeRange(tokenizer);
    }
    tokenizer.eat(GREATERTHANSIGN);
    return maybeMultiplied(tokenizer, {
        type: "Type",
        name: name41,
        opts
    });
}
function readKeywordOrFunction(tokenizer) {
    const name41 = scanWord(tokenizer);
    if (tokenizer.charCode() === LEFTPARENTHESIS) {
        tokenizer.pos++;
        return {
            type: "Function",
            name: name41
        };
    }
    return maybeMultiplied(tokenizer, {
        type: "Keyword",
        name: name41
    });
}
function regroupTerms(terms, combinators) {
    function createGroup(terms2, combinator2) {
        return {
            type: "Group",
            terms: terms2,
            combinator: combinator2,
            disallowEmpty: false,
            explicit: false
        };
    }
    let combinator;
    combinators = Object.keys(combinators).sort((a, b) => COMBINATOR_PRECEDENCE[a] - COMBINATOR_PRECEDENCE[b]);
    while (combinators.length > 0) {
        combinator = combinators.shift();
        let i = 0;
        let subgroupStart = 0;
        for (; i < terms.length; i++) {
            const term = terms[i];
            if (term.type === "Combinator") {
                if (term.value === combinator) {
                    if (subgroupStart === -1) {
                        subgroupStart = i - 1;
                    }
                    terms.splice(i, 1);
                    i--;
                } else {
                    if (subgroupStart !== -1 && i - subgroupStart > 1) {
                        terms.splice(subgroupStart, i - subgroupStart, createGroup(terms.slice(subgroupStart, i), combinator));
                        i = subgroupStart + 1;
                    }
                    subgroupStart = -1;
                }
            }
        }
        if (subgroupStart !== -1 && combinators.length) {
            terms.splice(subgroupStart, i - subgroupStart, createGroup(terms.slice(subgroupStart, i), combinator));
        }
    }
    return combinator;
}
function readImplicitGroup(tokenizer) {
    const terms = [];
    const combinators = {};
    let token;
    let prevToken = null;
    let prevTokenPos = tokenizer.pos;
    while (token = peek(tokenizer)) {
        if (token.type !== "Spaces") {
            if (token.type === "Combinator") {
                if (prevToken === null || prevToken.type === "Combinator") {
                    tokenizer.pos = prevTokenPos;
                    tokenizer.error("Unexpected combinator");
                }
                combinators[token.value] = true;
            } else if (prevToken !== null && prevToken.type !== "Combinator") {
                combinators[" "] = true;
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
    if (prevToken !== null && prevToken.type === "Combinator") {
        tokenizer.pos -= prevTokenPos;
        tokenizer.error("Unexpected combinator");
    }
    return {
        type: "Group",
        terms,
        combinator: regroupTerms(terms, combinators) || " ",
        disallowEmpty: false,
        explicit: false
    };
}
function readGroup(tokenizer) {
    let result;
    tokenizer.eat(LEFTSQUAREBRACKET);
    result = readImplicitGroup(tokenizer);
    tokenizer.eat(RIGHTSQUAREBRACKET);
    result.explicit = true;
    if (tokenizer.charCode() === EXCLAMATIONMARK2) {
        tokenizer.pos++;
        result.disallowEmpty = true;
    }
    return result;
}
function peek(tokenizer) {
    let code2 = tokenizer.charCode();
    if (code2 < 128 && NAME_CHAR[code2] === 1) {
        return readKeywordOrFunction(tokenizer);
    }
    switch (code2) {
        case RIGHTSQUAREBRACKET:
            break;
        case LEFTSQUAREBRACKET:
            return maybeMultiplied(tokenizer, readGroup(tokenizer));
        case LESSTHANSIGN:
            return tokenizer.nextCharCode() === APOSTROPHE ? readProperty(tokenizer) : readType(tokenizer);
        case VERTICALLINE:
            return {
                type: "Combinator",
                value: tokenizer.substringToPos(tokenizer.pos + (tokenizer.nextCharCode() === VERTICALLINE ? 2 : 1))
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
        case SPACE2:
        case TAB2:
        case N4:
        case R3:
        case F3:
            return {
                type: "Spaces",
                value: scanSpaces(tokenizer)
            };
        case COMMERCIALAT:
            code2 = tokenizer.nextCharCode();
            if (code2 < 128 && NAME_CHAR[code2] === 1) {
                tokenizer.pos++;
                return {
                    type: "AtKeyword",
                    name: scanWord(tokenizer)
                };
            }
            return maybeToken(tokenizer);
        case ASTERISK:
        case PLUSSIGN4:
        case QUESTIONMARK2:
        case NUMBERSIGN2:
        case EXCLAMATIONMARK2:
            break;
        case LEFTCURLYBRACKET2:
            code2 = tokenizer.nextCharCode();
            if (code2 < 48 || code2 > 57) {
                return maybeToken(tokenizer);
            }
            break;
        default:
            return maybeToken(tokenizer);
    }
}
function parse(source) {
    const tokenizer = new Tokenizer(source);
    const result = readImplicitGroup(tokenizer);
    if (tokenizer.pos !== source.length) {
        tokenizer.error("Unexpected input");
    }
    if (result.terms.length === 1 && result.terms[0].type === "Group") {
        return result.terms[0];
    }
    return result;
}

// lib/definition-syntax/walk.js
var noop3 = function () {
};
function ensureFunction2(value) {
    return typeof value === "function" ? value : noop3;
}
function walk(node, options, context) {
    function walk2(node2) {
        enter.call(context, node2);
        switch (node2.type) {
            case "Group":
                node2.terms.forEach(walk2);
                break;
            case "Multiplier":
                walk2(node2.term);
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
                throw new Error("Unknown type: " + node2.type);
        }
        leave.call(context, node2);
    }
    let enter = noop3;
    let leave = noop3;
    if (typeof options === "function") {
        enter = options;
    } else if (options) {
        enter = ensureFunction2(options.enter);
        leave = ensureFunction2(options.leave);
    }
    if (enter === noop3 && leave === noop3) {
        throw new Error("Neither `enter` nor `leave` walker handler is set or both aren't a function");
    }
    walk2(node, context);
}

// lib/lexer/prepare-tokens.js
var astToTokens = {
    decorator: function (handlers) {
        const tokens = [];
        let curNode = null;
        return {
            ...handlers,
            node(node) {
                const tmp = curNode;
                curNode = node;
                handlers.node.call(this, node);
                curNode = tmp;
            },
            emit(value, type, auto) {
                tokens.push({
                    type,
                    value,
                    node: auto ? null : curNode
                });
            },
            result() {
                return tokens;
            }
        };
    }
};
function stringToTokens(str) {
    const tokens = [];
    tokenize(str, (type, start, end) => tokens.push({
        type,
        value: str.slice(start, end),
        node: null
    }));
    return tokens;
}
function prepare_tokens_default(value, syntax) {
    if (typeof value === "string") {
        return stringToTokens(value);
    }
    return syntax.generate(value, astToTokens);
}

// lib/lexer/match-graph.js
var MATCH = { type: "Match" };
var MISMATCH = { type: "Mismatch" };
var DISALLOW_EMPTY = { type: "DisallowEmpty" };
var LEFTPARENTHESIS2 = 40;
var RIGHTPARENTHESIS2 = 41;
function createCondition(match, thenBranch, elseBranch) {
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
        match,
        then: thenBranch,
        else: elseBranch
    };
}
function isFunctionType(name41) {
    return name41.length > 2 && name41.charCodeAt(name41.length - 2) === LEFTPARENTHESIS2 && name41.charCodeAt(name41.length - 1) === RIGHTPARENTHESIS2;
}
function isEnumCapatible(term) {
    return term.type === "Keyword" || term.type === "AtKeyword" || term.type === "Function" || term.type === "Type" && isFunctionType(term.name);
}
function buildGroupMatchGraph(combinator, terms, atLeastOneTermMatched) {
    switch (combinator) {
        case " ": {
            let result = MATCH;
            for (let i = terms.length - 1; i >= 0; i--) {
                const term = terms[i];
                result = createCondition(term, result, MISMATCH);
            }
            ;
            return result;
        }
        case "|": {
            let result = MISMATCH;
            let map = null;
            for (let i = terms.length - 1; i >= 0; i--) {
                let term = terms[i];
                if (isEnumCapatible(term)) {
                    if (map === null && i > 0 && isEnumCapatible(terms[i - 1])) {
                        map = Object.create(null);
                        result = createCondition({
                            type: "Enum",
                            map
                        }, MATCH, result);
                    }
                    if (map !== null) {
                        const key = (isFunctionType(term.name) ? term.name.slice(0, -1) : term.name).toLowerCase();
                        if (key in map === false) {
                            map[key] = term;
                            continue;
                        }
                    }
                }
                map = null;
                result = createCondition(term, MATCH, result);
            }
            ;
            return result;
        }
        case "&&": {
            if (terms.length > 5) {
                return {
                    type: "MatchOnce",
                    terms,
                    all: true
                };
            }
            let result = MISMATCH;
            for (let i = terms.length - 1; i >= 0; i--) {
                const term = terms[i];
                let thenClause;
                if (terms.length > 1) {
                    thenClause = buildGroupMatchGraph(combinator, terms.filter(function (newGroupTerm) {
                        return newGroupTerm !== term;
                    }), false);
                } else {
                    thenClause = MATCH;
                }
                result = createCondition(term, thenClause, result);
            }
            ;
            return result;
        }
        case "||": {
            if (terms.length > 5) {
                return {
                    type: "MatchOnce",
                    terms,
                    all: false
                };
            }
            let result = atLeastOneTermMatched ? MATCH : MISMATCH;
            for (let i = terms.length - 1; i >= 0; i--) {
                const term = terms[i];
                let thenClause;
                if (terms.length > 1) {
                    thenClause = buildGroupMatchGraph(combinator, terms.filter(function (newGroupTerm) {
                        return newGroupTerm !== term;
                    }), true);
                } else {
                    thenClause = MATCH;
                }
                result = createCondition(term, thenClause, result);
            }
            ;
            return result;
        }
    }
}
function buildMultiplierMatchGraph(node) {
    let result = MATCH;
    let matchTerm = buildMatchGraphInternal(node.term);
    if (node.max === 0) {
        matchTerm = createCondition(matchTerm, DISALLOW_EMPTY, MISMATCH);
        result = createCondition(matchTerm, null, MISMATCH);
        result.then = createCondition(MATCH, MATCH, result);
        if (node.comma) {
            result.then.else = createCondition({ type: "Comma", syntax: node }, result, MISMATCH);
        }
    } else {
        for (let i = node.min || 1; i <= node.max; i++) {
            if (node.comma && result !== MATCH) {
                result = createCondition({ type: "Comma", syntax: node }, result, MISMATCH);
            }
            result = createCondition(matchTerm, createCondition(MATCH, MATCH, result), MISMATCH);
        }
    }
    if (node.min === 0) {
        result = createCondition(MATCH, MATCH, result);
    } else {
        for (let i = 0; i < node.min - 1; i++) {
            if (node.comma && result !== MATCH) {
                result = createCondition({ type: "Comma", syntax: node }, result, MISMATCH);
            }
            result = createCondition(matchTerm, result, MISMATCH);
        }
    }
    return result;
}
function buildMatchGraphInternal(node) {
    if (typeof node === "function") {
        return {
            type: "Generic",
            fn: node
        };
    }
    switch (node.type) {
        case "Group": {
            let result = buildGroupMatchGraph(node.combinator, node.terms.map(buildMatchGraphInternal), false);
            if (node.disallowEmpty) {
                result = createCondition(result, DISALLOW_EMPTY, MISMATCH);
            }
            return result;
        }
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
            if (node.value.length === 3) {
                return {
                    type: "Token",
                    value: node.value.charAt(1),
                    syntax: node
                };
            }
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
function buildMatchGraph(syntaxTree, ref) {
    if (typeof syntaxTree === "string") {
        syntaxTree = parse(syntaxTree);
    }
    return {
        type: "MatchGraph",
        match: buildMatchGraphInternal(syntaxTree),
        syntax: ref || null,
        source: syntaxTree
    };
}

// lib/lexer/match.js
var { hasOwnProperty: hasOwnProperty3 } = Object.prototype;
var STUB = 0;
var TOKEN = 1;
var OPEN_SYNTAX = 2;
var CLOSE_SYNTAX = 3;
var EXIT_REASON_MATCH = "Match";
var EXIT_REASON_MISMATCH = "Mismatch";
var EXIT_REASON_ITERATION_LIMIT = "Maximum iteration number exceeded (please fill an issue on https://github.com/csstree/csstree/issues)";
var ITERATION_LIMIT = 15e3;
var totalIterationCount = 0;
function reverseList(list) {
    let prev = null;
    let next = null;
    let item = list;
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
    for (let i = 0; i < testStr.length; i++) {
        const referenceCode = referenceStr.charCodeAt(i);
        let testCode = testStr.charCodeAt(i);
        if (testCode >= 65 && testCode <= 90) {
            testCode = testCode | 32;
        }
        if (testCode !== referenceCode) {
            return false;
        }
    }
    return true;
}
function isContextEdgeDelim(token) {
    if (token.type !== Delim) {
        return false;
    }
    return token.value !== "?";
}
function isCommaContextStart(token) {
    if (token === null) {
        return true;
    }
    return token.type === Comma || token.type === Function || token.type === LeftParenthesis || token.type === LeftSquareBracket || token.type === LeftCurlyBracket || isContextEdgeDelim(token);
}
function isCommaContextEnd(token) {
    if (token === null) {
        return true;
    }
    return token.type === RightParenthesis || token.type === RightSquareBracket || token.type === RightCurlyBracket || token.type === Delim;
}
function internalMatch(tokens, state, syntaxes) {
    function moveToNextToken() {
        do {
            tokenIndex++;
            token = tokenIndex < tokens.length ? tokens[tokenIndex] : null;
        } while (token !== null && (token.type === WhiteSpace || token.type === Comment));
    }
    function getNextToken(offset) {
        const nextIndex = tokenIndex + offset;
        return nextIndex < tokens.length ? tokens[nextIndex] : null;
    }
    function stateSnapshotFromSyntax(nextState, prev) {
        return {
            nextState,
            matchStack,
            syntaxStack,
            thenStack,
            tokenIndex,
            prev
        };
    }
    function pushThenStack(nextState) {
        thenStack = {
            nextState,
            matchStack,
            syntaxStack,
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
            token,
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
            opts: state.syntax.opts || syntaxStack !== null && syntaxStack.opts || null,
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
    let syntaxStack = null;
    let thenStack = null;
    let elseStack = null;
    let syntaxStash = null;
    let iterationCount = 0;
    let exitReason = null;
    let token = null;
    let tokenIndex = -1;
    let longestMatch = 0;
    let matchStack = {
        type: STUB,
        syntax: null,
        token: null,
        prev: null
    };
    moveToNextToken();
    while (exitReason === null && ++iterationCount < ITERATION_LIMIT) {
        switch (state.type) {
            case "Match":
                if (thenStack === null) {
                    if (token !== null) {
                        if (tokenIndex !== tokens.length - 1 || token.value !== "\\0" && token.value !== "\\9") {
                            state = MISMATCH;
                            break;
                        }
                    }
                    exitReason = EXIT_REASON_MATCH;
                    break;
                }
                state = thenStack.nextState;
                if (state === DISALLOW_EMPTY) {
                    if (thenStack.matchStack === matchStack) {
                        state = MISMATCH;
                        break;
                    } else {
                        state = MATCH;
                    }
                }
                while (thenStack.syntaxStack !== syntaxStack) {
                    closeSyntax();
                }
                thenStack = thenStack.prev;
                break;
            case "Mismatch":
                if (syntaxStash !== null && syntaxStash !== false) {
                    if (elseStack === null || tokenIndex > elseStack.tokenIndex) {
                        elseStack = syntaxStash;
                        syntaxStash = false;
                    }
                } else if (elseStack === null) {
                    exitReason = EXIT_REASON_MISMATCH;
                    break;
                }
                state = elseStack.nextState;
                thenStack = elseStack.thenStack;
                syntaxStack = elseStack.syntaxStack;
                matchStack = elseStack.matchStack;
                tokenIndex = elseStack.tokenIndex;
                token = tokenIndex < tokens.length ? tokens[tokenIndex] : null;
                elseStack = elseStack.prev;
                break;
            case "MatchGraph":
                state = state.match;
                break;
            case "If":
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
            case "MatchOnceBuffer": {
                const terms = state.syntax.terms;
                if (state.index === terms.length) {
                    if (state.mask === 0 || state.syntax.all) {
                        state = MISMATCH;
                        break;
                    }
                    state = MATCH;
                    break;
                }
                if (state.mask === (1 << terms.length) - 1) {
                    state = MATCH;
                    break;
                }
                for (; state.index < terms.length; state.index++) {
                    const matchFlag = 1 << state.index;
                    if ((state.mask & matchFlag) === 0) {
                        pushElseStack(state);
                        pushThenStack({
                            type: "AddMatchOnce",
                            syntax: state.syntax,
                            mask: state.mask | matchFlag
                        });
                        state = terms[state.index++];
                        break;
                    }
                }
                break;
            }
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
                    let name41 = token.value.toLowerCase();
                    if (name41.indexOf("\\") !== -1) {
                        name41 = name41.replace(/\\[09].*$/, "");
                    }
                    if (hasOwnProperty3.call(state.map, name41)) {
                        state = state.map[name41];
                        break;
                    }
                }
                state = MISMATCH;
                break;
            case "Generic": {
                const opts = syntaxStack !== null ? syntaxStack.opts : null;
                const lastTokenIndex2 = tokenIndex + Math.floor(state.fn(token, getNextToken, opts));
                if (!isNaN(lastTokenIndex2) && lastTokenIndex2 > tokenIndex) {
                    while (tokenIndex < lastTokenIndex2) {
                        addTokenToMatch();
                    }
                    state = MATCH;
                } else {
                    state = MISMATCH;
                }
                break;
            }
            case "Type":
            case "Property": {
                const syntaxDict = state.type === "Type" ? "types" : "properties";
                const dictSyntax = hasOwnProperty3.call(syntaxes, syntaxDict) ? syntaxes[syntaxDict][state.name] : null;
                if (!dictSyntax || !dictSyntax.match) {
                    throw new Error("Bad syntax reference: " + (state.type === "Type" ? "<" + state.name + ">" : "<'" + state.name + "'>"));
                }
                if (syntaxStash !== false && token !== null && state.type === "Type") {
                    const lowPriorityMatching = state.name === "custom-ident" && token.type === Ident || state.name === "length" && token.value === "0";
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
            }
            case "Keyword": {
                const name41 = state.name;
                if (token !== null) {
                    let keywordName = token.value;
                    if (keywordName.indexOf("\\") !== -1) {
                        keywordName = keywordName.replace(/\\[09].*$/, "");
                    }
                    if (areStringsEqualCaseInsensitive(keywordName, name41)) {
                        addTokenToMatch();
                        state = MATCH;
                        break;
                    }
                }
                state = MISMATCH;
                break;
            }
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
                if (token !== null && token.type === Comma) {
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
                let string = "";
                let lastTokenIndex = tokenIndex;
                for (; lastTokenIndex < tokens.length && string.length < state.value.length; lastTokenIndex++) {
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
            console.warn("[csstree-match] BREAK after " + ITERATION_LIMIT + " iterations");
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
        tokens,
        reason: exitReason,
        iterations: iterationCount,
        match: matchStack,
        longestMatch
    };
}
function matchAsTree(tokens, matchGraph, syntaxes) {
    const matchResult = internalMatch(tokens, matchGraph, syntaxes || {});
    if (matchResult.match === null) {
        return matchResult;
    }
    let item = matchResult.match;
    let host = matchResult.match = {
        syntax: matchGraph.syntax || null,
        match: []
    };
    const hostStack = [host];
    item = reverseList(item).prev;
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

// lib/lexer/trace.js
var trace_exports = {};
__export(trace_exports, {
    getTrace: () => getTrace,
    isKeyword: () => isKeyword,
    isProperty: () => isProperty,
    isType: () => isType
});
function getTrace(node) {
    function shouldPutToTrace(syntax) {
        if (syntax === null) {
            return false;
        }
        return syntax.type === "Type" || syntax.type === "Property" || syntax.type === "Keyword";
    }
    function hasMatch(matchNode) {
        if (Array.isArray(matchNode.match)) {
            for (let i = 0; i < matchNode.match.length; i++) {
                if (hasMatch(matchNode.match[i])) {
                    if (shouldPutToTrace(matchNode.syntax)) {
                        result.unshift(matchNode.syntax);
                    }
                    return true;
                }
            }
        } else if (matchNode.node === node) {
            result = shouldPutToTrace(matchNode.syntax) ? [matchNode.syntax] : [];
            return true;
        }
        return false;
    }
    let result = null;
    if (this.matched !== null) {
        hasMatch(this.matched);
    }
    return result;
}
function isType(node, type) {
    return testNode(this, node, (match) => match.type === "Type" && match.name === type);
}
function isProperty(node, property2) {
    return testNode(this, node, (match) => match.type === "Property" && match.name === property2);
}
function isKeyword(node) {
    return testNode(this, node, (match) => match.type === "Keyword");
}
function testNode(match, node, fn) {
    const trace = getTrace.call(match, node);
    if (trace === null) {
        return false;
    }
    return trace.some(fn);
}

// lib/lexer/search.js
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
function matchFragments(lexer, ast, match, type, name41) {
    function findFragments(matchNode) {
        if (matchNode.syntax !== null && matchNode.syntax.type === type && matchNode.syntax.name === name41) {
            const start = getFirstMatchNode(matchNode);
            const end = getLastMatchNode(matchNode);
            lexer.syntax.walk(ast, function (node, item, list) {
                if (node === start) {
                    const nodes = new List();
                    do {
                        nodes.appendData(item.data);
                        if (item.data === end) {
                            break;
                        }
                        item = item.next;
                    } while (item !== null);
                    fragments.push({
                        parent: list,
                        nodes
                    });
                }
            });
        }
        if (Array.isArray(matchNode.match)) {
            matchNode.match.forEach(findFragments);
        }
    }
    const fragments = [];
    if (match.matched !== null) {
        findFragments(match.matched);
    }
    return fragments;
}

// lib/lexer/structure.js
var { hasOwnProperty: hasOwnProperty4 } = Object.prototype;
function isValidNumber(value) {
    return typeof value === "number" && isFinite(value) && Math.floor(value) === value && value >= 0;
}
function isValidLocation(loc) {
    return Boolean(loc) && isValidNumber(loc.offset) && isValidNumber(loc.line) && isValidNumber(loc.column);
}
function createNodeStructureChecker(type, fields) {
    return function checkNode(node, warn) {
        if (!node || node.constructor !== Object) {
            return warn(node, "Type of node should be an Object");
        }
        for (let key in node) {
            let valid = true;
            if (hasOwnProperty4.call(node, key) === false) {
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
                valid = false;
                for (let i = 0; !valid && i < fields[key].length; i++) {
                    const fieldType = fields[key][i];
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
        for (const key in fields) {
            if (hasOwnProperty4.call(fields, key) && hasOwnProperty4.call(node, key) === false) {
                warn(node, "Field `" + type + "." + key + "` is missed");
            }
        }
    };
}
function processStructure(name41, nodeType) {
    const structure41 = nodeType.structure;
    const fields = {
        type: String,
        loc: true
    };
    const docs = {
        type: '"' + name41 + '"'
    };
    for (const key in structure41) {
        if (hasOwnProperty4.call(structure41, key) === false) {
            continue;
        }
        const docsTypes = [];
        const fieldTypes = fields[key] = Array.isArray(structure41[key]) ? structure41[key].slice() : [structure41[key]];
        for (let i = 0; i < fieldTypes.length; i++) {
            const fieldType = fieldTypes[i];
            if (fieldType === String || fieldType === Boolean) {
                docsTypes.push(fieldType.name);
            } else if (fieldType === null) {
                docsTypes.push("null");
            } else if (typeof fieldType === "string") {
                docsTypes.push("<" + fieldType + ">");
            } else if (Array.isArray(fieldType)) {
                docsTypes.push("List");
            } else {
                throw new Error("Wrong value `" + fieldType + "` in `" + name41 + "." + key + "` structure definition");
            }
        }
        docs[key] = docsTypes.join(" | ");
    }
    return {
        docs,
        check: createNodeStructureChecker(name41, fields)
    };
}
function getStructureFromConfig(config) {
    const structure41 = {};
    if (config.node) {
        for (const name41 in config.node) {
            if (hasOwnProperty4.call(config.node, name41)) {
                const nodeType = config.node[name41];
                if (nodeType.structure) {
                    structure41[name41] = processStructure(name41, nodeType);
                } else {
                    throw new Error("Missed `structure` field in `" + name41 + "` node type definition");
                }
            }
        }
    }
    return structure41;
}

// lib/lexer/Lexer.js
var cssWideKeywords2 = buildMatchGraph("inherit | initial | unset");
var cssWideKeywordsWithExpression = buildMatchGraph("inherit | initial | unset | <-ms-legacy-expression>");
function dumpMapSyntax(map, compact, syntaxAsAst) {
    const result = {};
    for (const name41 in map) {
        if (map[name41].syntax) {
            result[name41] = syntaxAsAst ? map[name41].syntax : generate(map[name41].syntax, { compact });
        }
    }
    return result;
}
function dumpAtruleMapSyntax(map, compact, syntaxAsAst) {
    const result = {};
    for (const [name41, atrule] of Object.entries(map)) {
        result[name41] = {
            prelude: atrule.prelude && (syntaxAsAst ? atrule.prelude.syntax : generate(atrule.prelude.syntax, { compact })),
            descriptors: atrule.descriptors && dumpMapSyntax(atrule.descriptors, compact, syntaxAsAst)
        };
    }
    return result;
}
function valueHasVar(tokens) {
    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i].value.toLowerCase() === "var(") {
            return true;
        }
    }
    return false;
}
function buildMatchResult(matched, error, iterations) {
    return {
        matched,
        iterations,
        error,
        ...trace_exports
    };
}
function matchSyntax(lexer, syntax, value, useCommon) {
    const tokens = prepare_tokens_default(value, lexer.syntax);
    let result;
    if (valueHasVar(tokens)) {
        return buildMatchResult(null, new Error("Matching for a tree with var() is not supported"));
    }
    if (useCommon) {
        result = matchAsTree(tokens, lexer.valueCommonSyntax, lexer);
    }
    if (!useCommon || !result.match) {
        result = matchAsTree(tokens, syntax.match, lexer);
        if (!result.match) {
            return buildMatchResult(null, new SyntaxMatchError(result.reason, syntax.syntax, value, result), result.iterations);
        }
    }
    return buildMatchResult(result.match, null, result.iterations);
}
var Lexer = class {
    constructor(config, syntax, structure41) {
        this.valueCommonSyntax = cssWideKeywords2;
        this.syntax = syntax;
        this.generic = false;
        this.atrules = Object.create(null);
        this.properties = Object.create(null);
        this.types = Object.create(null);
        this.structure = structure41 || getStructureFromConfig(config);
        if (config) {
            if (config.types) {
                for (const name41 in config.types) {
                    this.addType_(name41, config.types[name41]);
                }
            }
            if (config.generic) {
                this.generic = true;
                for (const name41 in generic_default) {
                    this.addType_(name41, generic_default[name41]);
                }
            }
            if (config.atrules) {
                for (const name41 in config.atrules) {
                    this.addAtrule_(name41, config.atrules[name41]);
                }
            }
            if (config.properties) {
                for (const name41 in config.properties) {
                    this.addProperty_(name41, config.properties[name41]);
                }
            }
        }
    }
    checkStructure(ast) {
        function collectWarning(node, message) {
            warns.push({ node, message });
        }
        const structure41 = this.structure;
        const warns = [];
        this.syntax.walk(ast, function (node) {
            if (structure41.hasOwnProperty(node.type)) {
                structure41[node.type].check(node, collectWarning);
            } else {
                collectWarning(node, "Unknown node type `" + node.type + "`");
            }
        });
        return warns.length ? warns : false;
    }
    createDescriptor(syntax, type, name41, parent = null) {
        const ref = {
            type,
            name: name41
        };
        const descriptor = {
            type,
            name: name41,
            parent,
            serializable: typeof syntax === "string" || syntax && typeof syntax.type === "string",
            syntax: null,
            match: null
        };
        if (typeof syntax === "function") {
            descriptor.match = buildMatchGraph(syntax, ref);
        } else {
            if (typeof syntax === "string") {
                Object.defineProperty(descriptor, "syntax", {
                    get() {
                        Object.defineProperty(descriptor, "syntax", {
                            value: parse(syntax)
                        });
                        return descriptor.syntax;
                    }
                });
            } else {
                descriptor.syntax = syntax;
            }
            Object.defineProperty(descriptor, "match", {
                get() {
                    Object.defineProperty(descriptor, "match", {
                        value: buildMatchGraph(descriptor.syntax, ref)
                    });
                    return descriptor.match;
                }
            });
        }
        return descriptor;
    }
    addAtrule_(name41, syntax) {
        if (!syntax) {
            return;
        }
        this.atrules[name41] = {
            type: "Atrule",
            name: name41,
            prelude: syntax.prelude ? this.createDescriptor(syntax.prelude, "AtrulePrelude", name41) : null,
            descriptors: syntax.descriptors ? Object.keys(syntax.descriptors).reduce((map, descName) => {
                map[descName] = this.createDescriptor(syntax.descriptors[descName], "AtruleDescriptor", descName, name41);
                return map;
            }, Object.create(null)) : null
        };
    }
    addProperty_(name41, syntax) {
        if (!syntax) {
            return;
        }
        this.properties[name41] = this.createDescriptor(syntax, "Property", name41);
    }
    addType_(name41, syntax) {
        if (!syntax) {
            return;
        }
        this.types[name41] = this.createDescriptor(syntax, "Type", name41);
        if (syntax === generic_default["-ms-legacy-expression"]) {
            this.valueCommonSyntax = cssWideKeywordsWithExpression;
        }
    }
    checkAtruleName(atruleName) {
        if (!this.getAtrule(atruleName)) {
            return new SyntaxReferenceError("Unknown at-rule", "@" + atruleName);
        }
    }
    checkAtrulePrelude(atruleName, prelude) {
        const error = this.checkAtruleName(atruleName);
        if (error) {
            return error;
        }
        const atrule = this.getAtrule(atruleName);
        if (!atrule.prelude && prelude) {
            return new SyntaxError("At-rule `@" + atruleName + "` should not contain a prelude");
        }
        if (atrule.prelude && !prelude) {
            return new SyntaxError("At-rule `@" + atruleName + "` should contain a prelude");
        }
    }
    checkAtruleDescriptorName(atruleName, descriptorName) {
        const error = this.checkAtruleName(atruleName);
        if (error) {
            return error;
        }
        const atrule = this.getAtrule(atruleName);
        const descriptor = keyword(descriptorName);
        if (!atrule.descriptors) {
            return new SyntaxError("At-rule `@" + atruleName + "` has no known descriptors");
        }
        if (!atrule.descriptors[descriptor.name] && !atrule.descriptors[descriptor.basename]) {
            return new SyntaxReferenceError("Unknown at-rule descriptor", descriptorName);
        }
    }
    checkPropertyName(propertyName) {
        if (!this.getProperty(propertyName)) {
            return new SyntaxReferenceError("Unknown property", propertyName);
        }
    }
    matchAtrulePrelude(atruleName, prelude) {
        const error = this.checkAtrulePrelude(atruleName, prelude);
        if (error) {
            return buildMatchResult(null, error);
        }
        if (!prelude) {
            return buildMatchResult(null, null);
        }
        return matchSyntax(this, this.getAtrule(atruleName).prelude, prelude, false);
    }
    matchAtruleDescriptor(atruleName, descriptorName, value) {
        const error = this.checkAtruleDescriptorName(atruleName, descriptorName);
        if (error) {
            return buildMatchResult(null, error);
        }
        const atrule = this.getAtrule(atruleName);
        const descriptor = keyword(descriptorName);
        return matchSyntax(this, atrule.descriptors[descriptor.name] || atrule.descriptors[descriptor.basename], value, false);
    }
    matchDeclaration(node) {
        if (node.type !== "Declaration") {
            return buildMatchResult(null, new Error("Not a Declaration node"));
        }
        return this.matchProperty(node.property, node.value);
    }
    matchProperty(propertyName, value) {
        if (property(propertyName).custom) {
            return buildMatchResult(null, new Error("Lexer matching doesn't applicable for custom properties"));
        }
        const error = this.checkPropertyName(propertyName);
        if (error) {
            return buildMatchResult(null, error);
        }
        return matchSyntax(this, this.getProperty(propertyName), value, true);
    }
    matchType(typeName, value) {
        const typeSyntax = this.getType(typeName);
        if (!typeSyntax) {
            return buildMatchResult(null, new SyntaxReferenceError("Unknown type", typeName));
        }
        return matchSyntax(this, typeSyntax, value, false);
    }
    match(syntax, value) {
        if (typeof syntax !== "string" && (!syntax || !syntax.type)) {
            return buildMatchResult(null, new SyntaxReferenceError("Bad syntax"));
        }
        if (typeof syntax === "string" || !syntax.match) {
            syntax = this.createDescriptor(syntax, "Type", "anonymous");
        }
        return matchSyntax(this, syntax, value, false);
    }
    findValueFragments(propertyName, value, type, name41) {
        return matchFragments(this, value, this.matchProperty(propertyName, value), type, name41);
    }
    findDeclarationValueFragments(declaration, type, name41) {
        return matchFragments(this, declaration.value, this.matchDeclaration(declaration), type, name41);
    }
    findAllFragments(ast, type, name41) {
        const result = [];
        this.syntax.walk(ast, {
            visit: "Declaration",
            enter: (declaration) => {
                result.push.apply(result, this.findDeclarationValueFragments(declaration, type, name41));
            }
        });
        return result;
    }
    getAtrule(atruleName, fallbackBasename = true) {
        const atrule = keyword(atruleName);
        const atruleEntry = atrule.vendor && fallbackBasename ? this.atrules[atrule.name] || this.atrules[atrule.basename] : this.atrules[atrule.name];
        return atruleEntry || null;
    }
    getAtrulePrelude(atruleName, fallbackBasename = true) {
        const atrule = this.getAtrule(atruleName, fallbackBasename);
        return atrule && atrule.prelude || null;
    }
    getAtruleDescriptor(atruleName, name41) {
        return this.atrules.hasOwnProperty(atruleName) && this.atrules.declarators ? this.atrules[atruleName].declarators[name41] || null : null;
    }
    getProperty(propertyName, fallbackBasename = true) {
        const property2 = property(propertyName);
        const propertyEntry = property2.vendor && fallbackBasename ? this.properties[property2.name] || this.properties[property2.basename] : this.properties[property2.name];
        return propertyEntry || null;
    }
    getType(name41) {
        return hasOwnProperty.call(this.types, name41) ? this.types[name41] : null;
    }
    validate() {
        function validate(syntax, name41, broken, descriptor) {
            if (broken.has(name41)) {
                return broken.get(name41);
            }
            broken.set(name41, false);
            if (descriptor.syntax !== null) {
                walk(descriptor.syntax, function (node) {
                    if (node.type !== "Type" && node.type !== "Property") {
                        return;
                    }
                    const map = node.type === "Type" ? syntax.types : syntax.properties;
                    const brokenMap = node.type === "Type" ? brokenTypes : brokenProperties;
                    if (!hasOwnProperty.call(map, node.name) || validate(syntax, node.name, brokenMap, map[node.name])) {
                        broken.set(name41, true);
                    }
                }, this);
            }
        }
        let brokenTypes = /* @__PURE__ */ new Map();
        let brokenProperties = /* @__PURE__ */ new Map();
        for (const key in this.types) {
            validate(this, key, brokenTypes, this.types[key]);
        }
        for (const key in this.properties) {
            validate(this, key, brokenProperties, this.properties[key]);
        }
        brokenTypes = [...brokenTypes.keys()].filter((name41) => brokenTypes.get(name41));
        brokenProperties = [...brokenProperties.keys()].filter((name41) => brokenProperties.get(name41));
        if (brokenTypes.length || brokenProperties.length) {
            return {
                types: brokenTypes,
                properties: brokenProperties
            };
        }
        return null;
    }
    dump(syntaxAsAst, pretty) {
        return {
            generic: this.generic,
            types: dumpMapSyntax(this.types, !pretty, syntaxAsAst),
            properties: dumpMapSyntax(this.properties, !pretty, syntaxAsAst),
            atrules: dumpAtruleMapSyntax(this.atrules, !pretty, syntaxAsAst)
        };
    }
    toString() {
        return JSON.stringify(this.dump());
    }
};

// lib/syntax/config/mix.js
var { hasOwnProperty: hasOwnProperty5 } = Object.prototype;
var shape = {
    generic: true,
    types: appendOrAssign,
    atrules: {
        prelude: appendOrAssignOrNull,
        descriptors: appendOrAssignOrNull
    },
    properties: appendOrAssign,
    parseContext: assign,
    scope: deepAssign,
    atrule: ["parse"],
    pseudo: ["parse"],
    node: ["name", "structure", "parse", "generate", "walkContext"]
};
function isObject(value) {
    return value && value.constructor === Object;
}
function copy(value) {
    return isObject(value) ? { ...value } : value;
}
function assign(dest, src) {
    return Object.assign(dest, src);
}
function deepAssign(dest, src) {
    for (const key in src) {
        if (hasOwnProperty5.call(src, key)) {
            if (isObject(dest[key])) {
                deepAssign(dest[key], copy(src[key]));
            } else {
                dest[key] = copy(src[key]);
            }
        }
    }
    return dest;
}
function append(a, b) {
    if (typeof b === "string" && /^\s*\|/.test(b)) {
        return typeof a === "string" ? a + b : b.replace(/^\s*\|\s*/, "");
    }
    return b || null;
}
function appendOrAssign(a, b) {
    if (typeof b === "string") {
        return append(a, b);
    }
    const result = { ...a };
    for (let key in b) {
        if (hasOwnProperty5.call(b, key)) {
            result[key] = append(hasOwnProperty5.call(a, key) ? a[key] : void 0, b[key]);
        }
    }
    return result;
}
function appendOrAssignOrNull(a, b) {
    const result = appendOrAssign(a, b);
    return !isObject(result) || Object.keys(result).length ? result : null;
}
function mix(dest, src, shape2) {
    for (const key in shape2) {
        if (hasOwnProperty5.call(shape2, key) === false) {
            continue;
        }
        if (shape2[key] === true) {
            if (key in src) {
                if (hasOwnProperty5.call(src, key)) {
                    dest[key] = copy(src[key]);
                }
            }
        } else if (shape2[key]) {
            if (typeof shape2[key] === "function") {
                const fn = shape2[key];
                dest[key] = fn({}, dest[key]);
                dest[key] = fn(dest[key] || {}, src[key]);
            } else if (isObject(shape2[key])) {
                const result = {};
                for (let name41 in dest[key]) {
                    result[name41] = mix({}, dest[key][name41], shape2[key]);
                }
                for (let name41 in src[key]) {
                    result[name41] = mix(result[name41] || {}, src[key][name41], shape2[key]);
                }
                dest[key] = result;
            } else if (Array.isArray(shape2[key])) {
                const res = {};
                const innerShape = shape2[key].reduce(function (s, k) {
                    s[k] = true;
                    return s;
                }, {});
                for (const [name41, value] of Object.entries(dest[key] || {})) {
                    res[name41] = {};
                    if (value) {
                        mix(res[name41], value, innerShape);
                    }
                }
                for (const name41 in src[key]) {
                    if (hasOwnProperty5.call(src[key], name41)) {
                        if (!res[name41]) {
                            res[name41] = {};
                        }
                        if (src[key] && src[key][name41]) {
                            mix(res[name41], src[key][name41], innerShape);
                        }
                    }
                }
                dest[key] = res;
            }
        }
    }
    return dest;
}
var mix_default = (dest, src) => mix(dest, src, shape);

// lib/syntax/create.js
function createSyntax(config) {
    const parse43 = createParser(config);
    const walk2 = createWalker(config);
    const generate43 = createGenerator(config);
    const { fromPlainObject, toPlainObject } = createConvertor(walk2);
    const syntax = {
        lexer: null,
        createLexer: (config2) => new Lexer(config2, syntax, syntax.lexer.structure),
        tokenize,
        parse: parse43,
        generate: generate43,
        walk: walk2,
        find: walk2.find,
        findLast: walk2.findLast,
        findAll: walk2.findAll,
        fromPlainObject,
        toPlainObject,
        fork(extension) {
            const base = mix_default({}, config);
            return createSyntax(typeof extension === "function" ? extension(base, Object.assign) : mix_default(base, extension));
        }
    };
    syntax.lexer = new Lexer({
        generic: true,
        types: config.types,
        atrules: config.atrules,
        properties: config.properties,
        node: config.node
    }, syntax);
    return syntax;
}
var create_default = (config) => createSyntax(mix_default({}, config));

// dist/data.js
var data_default = {
    "generic": true,
    "types": {
        "absolute-size": "xx-small|x-small|small|medium|large|x-large|xx-large|xxx-large",
        "alpha-value": "<number>|<percentage>",
        "angle-percentage": "<angle>|<percentage>",
        "angular-color-hint": "<angle-percentage>",
        "angular-color-stop": "<color>&&<color-stop-angle>?",
        "angular-color-stop-list": "[<angular-color-stop> [, <angular-color-hint>]?]# , <angular-color-stop>",
        "animateable-feature": "scroll-position|contents|<custom-ident>",
        "attachment": "scroll|fixed|local",
        "attr()": "attr( <attr-name> <type-or-unit>? [, <attr-fallback>]? )",
        "attr-matcher": "['~'|'|'|'^'|'$'|'*']? '='",
        "attr-modifier": "i|s",
        "attribute-selector": "'[' <wq-name> ']'|'[' <wq-name> <attr-matcher> [<string-token>|<ident-token>] <attr-modifier>? ']'",
        "auto-repeat": "repeat( [auto-fill|auto-fit] , [<line-names>? <fixed-size>]+ <line-names>? )",
        "auto-track-list": "[<line-names>? [<fixed-size>|<fixed-repeat>]]* <line-names>? <auto-repeat> [<line-names>? [<fixed-size>|<fixed-repeat>]]* <line-names>?",
        "baseline-position": "[first|last]? baseline",
        "basic-shape": "<inset()>|<circle()>|<ellipse()>|<polygon()>|<path()>",
        "bg-image": "none|<image>",
        "bg-layer": "<bg-image>||<bg-position> [/ <bg-size>]?||<repeat-style>||<attachment>||<box>||<box>",
        "bg-position": "[[left|center|right|top|bottom|<length-percentage>]|[left|center|right|<length-percentage>] [top|center|bottom|<length-percentage>]|[center|[left|right] <length-percentage>?]&&[center|[top|bottom] <length-percentage>?]]",
        "bg-size": "[<length-percentage>|auto]{1,2}|cover|contain",
        "blur()": "blur( <length> )",
        "blend-mode": "normal|multiply|screen|overlay|darken|lighten|color-dodge|color-burn|hard-light|soft-light|difference|exclusion|hue|saturation|color|luminosity",
        "box": "border-box|padding-box|content-box",
        "brightness()": "brightness( <number-percentage> )",
        "calc()": "calc( <calc-sum> )",
        "calc-sum": "<calc-product> [['+'|'-'] <calc-product>]*",
        "calc-product": "<calc-value> ['*' <calc-value>|'/' <number>]*",
        "calc-value": "<number>|<dimension>|<percentage>|( <calc-sum> )",
        "cf-final-image": "<image>|<color>",
        "cf-mixing-image": "<percentage>?&&<image>",
        "circle()": "circle( [<shape-radius>]? [at <position>]? )",
        "clamp()": "clamp( <calc-sum>#{3} )",
        "class-selector": "'.' <ident-token>",
        "clip-source": "<url>",
        "color": "<rgb()>|<rgba()>|<hsl()>|<hsla()>|<hex-color>|<named-color>|currentcolor|<deprecated-system-color>",
        "color-stop": "<color-stop-length>|<color-stop-angle>",
        "color-stop-angle": "<angle-percentage>{1,2}",
        "color-stop-length": "<length-percentage>{1,2}",
        "color-stop-list": "[<linear-color-stop> [, <linear-color-hint>]?]# , <linear-color-stop>",
        "combinator": "'>'|'+'|'~'|['||']",
        "common-lig-values": "[common-ligatures|no-common-ligatures]",
        "compat-auto": "searchfield|textarea|push-button|slider-horizontal|checkbox|radio|square-button|menulist|listbox|meter|progress-bar|button",
        "composite-style": "clear|copy|source-over|source-in|source-out|source-atop|destination-over|destination-in|destination-out|destination-atop|xor",
        "compositing-operator": "add|subtract|intersect|exclude",
        "compound-selector": "[<type-selector>? <subclass-selector>* [<pseudo-element-selector> <pseudo-class-selector>*]*]!",
        "compound-selector-list": "<compound-selector>#",
        "complex-selector": "<compound-selector> [<combinator>? <compound-selector>]*",
        "complex-selector-list": "<complex-selector>#",
        "conic-gradient()": "conic-gradient( [from <angle>]? [at <position>]? , <angular-color-stop-list> )",
        "contextual-alt-values": "[contextual|no-contextual]",
        "content-distribution": "space-between|space-around|space-evenly|stretch",
        "content-list": "[<string>|contents|<image>|<counter>|<quote>|<target>|<leader()>]+",
        "content-position": "center|start|end|flex-start|flex-end",
        "content-replacement": "<image>",
        "contrast()": "contrast( [<number-percentage>] )",
        "counter()": "counter( <counter-name> , <counter-style>? )",
        "counter-style": "<counter-style-name>|symbols( )",
        "counter-style-name": "<custom-ident>",
        "counters()": "counters( <counter-name> , <string> , <counter-style>? )",
        "cross-fade()": "cross-fade( <cf-mixing-image> , <cf-final-image>? )",
        "cubic-bezier-timing-function": "ease|ease-in|ease-out|ease-in-out|cubic-bezier( <number [0,1]> , <number> , <number [0,1]> , <number> )",
        "deprecated-system-color": "ActiveBorder|ActiveCaption|AppWorkspace|Background|ButtonFace|ButtonHighlight|ButtonShadow|ButtonText|CaptionText|GrayText|Highlight|HighlightText|InactiveBorder|InactiveCaption|InactiveCaptionText|InfoBackground|InfoText|Menu|MenuText|Scrollbar|ThreeDDarkShadow|ThreeDFace|ThreeDHighlight|ThreeDLightShadow|ThreeDShadow|Window|WindowFrame|WindowText",
        "discretionary-lig-values": "[discretionary-ligatures|no-discretionary-ligatures]",
        "display-box": "contents|none",
        "display-inside": "flow|flow-root|table|flex|grid|ruby",
        "display-internal": "table-row-group|table-header-group|table-footer-group|table-row|table-cell|table-column-group|table-column|table-caption|ruby-base|ruby-text|ruby-base-container|ruby-text-container",
        "display-legacy": "inline-block|inline-list-item|inline-table|inline-flex|inline-grid",
        "display-listitem": "<display-outside>?&&[flow|flow-root]?&&list-item",
        "display-outside": "block|inline|run-in",
        "drop-shadow()": "drop-shadow( <length>{2,3} <color>? )",
        "east-asian-variant-values": "[jis78|jis83|jis90|jis04|simplified|traditional]",
        "east-asian-width-values": "[full-width|proportional-width]",
        "element()": "element( <custom-ident> , [first|start|last|first-except]? )|element( <id-selector> )",
        "ellipse()": "ellipse( [<shape-radius>{2}]? [at <position>]? )",
        "ending-shape": "circle|ellipse",
        "env()": "env( <custom-ident> , <declaration-value>? )",
        "explicit-track-list": "[<line-names>? <track-size>]+ <line-names>?",
        "family-name": "<string>|<custom-ident>+",
        "feature-tag-value": "<string> [<integer>|on|off]?",
        "feature-type": "@stylistic|@historical-forms|@styleset|@character-variant|@swash|@ornaments|@annotation",
        "feature-value-block": "<feature-type> '{' <feature-value-declaration-list> '}'",
        "feature-value-block-list": "<feature-value-block>+",
        "feature-value-declaration": "<custom-ident> : <integer>+ ;",
        "feature-value-declaration-list": "<feature-value-declaration>",
        "feature-value-name": "<custom-ident>",
        "fill-rule": "nonzero|evenodd",
        "filter-function": "<blur()>|<brightness()>|<contrast()>|<drop-shadow()>|<grayscale()>|<hue-rotate()>|<invert()>|<opacity()>|<saturate()>|<sepia()>",
        "filter-function-list": "[<filter-function>|<url>]+",
        "final-bg-layer": "<'background-color'>||<bg-image>||<bg-position> [/ <bg-size>]?||<repeat-style>||<attachment>||<box>||<box>",
        "fit-content()": "fit-content( [<length>|<percentage>] )",
        "fixed-breadth": "<length-percentage>",
        "fixed-repeat": "repeat( [<integer [1,\u221E]>] , [<line-names>? <fixed-size>]+ <line-names>? )",
        "fixed-size": "<fixed-breadth>|minmax( <fixed-breadth> , <track-breadth> )|minmax( <inflexible-breadth> , <fixed-breadth> )",
        "font-stretch-absolute": "normal|ultra-condensed|extra-condensed|condensed|semi-condensed|semi-expanded|expanded|extra-expanded|ultra-expanded|<percentage>",
        "font-variant-css21": "[normal|small-caps]",
        "font-weight-absolute": "normal|bold|<number [1,1000]>",
        "frequency-percentage": "<frequency>|<percentage>",
        "general-enclosed": "[<function-token> <any-value> )]|( <ident> <any-value> )",
        "generic-family": "serif|sans-serif|cursive|fantasy|monospace|-apple-system",
        "generic-name": "serif|sans-serif|cursive|fantasy|monospace",
        "geometry-box": "<shape-box>|fill-box|stroke-box|view-box",
        "gradient": "<linear-gradient()>|<repeating-linear-gradient()>|<radial-gradient()>|<repeating-radial-gradient()>|<conic-gradient()>|<-legacy-gradient>",
        "grayscale()": "grayscale( <number-percentage> )",
        "grid-line": "auto|<custom-ident>|[<integer>&&<custom-ident>?]|[span&&[<integer>||<custom-ident>]]",
        "historical-lig-values": "[historical-ligatures|no-historical-ligatures]",
        "hsl()": "hsl( <hue> <percentage> <percentage> [/ <alpha-value>]? )|hsl( <hue> , <percentage> , <percentage> , <alpha-value>? )",
        "hsla()": "hsla( <hue> <percentage> <percentage> [/ <alpha-value>]? )|hsla( <hue> , <percentage> , <percentage> , <alpha-value>? )",
        "hue": "<number>|<angle>",
        "hue-rotate()": "hue-rotate( <angle> )",
        "image": "<url>|<image()>|<image-set()>|<element()>|<paint()>|<cross-fade()>|<gradient>",
        "image()": "image( <image-tags>? [<image-src>? , <color>?]! )",
        "image-set()": "image-set( <image-set-option># )",
        "image-set-option": "[<image>|<string>] [<resolution>||type( <string> )]",
        "image-src": "<url>|<string>",
        "image-tags": "ltr|rtl",
        "inflexible-breadth": "<length>|<percentage>|min-content|max-content|auto",
        "inset()": "inset( <length-percentage>{1,4} [round <'border-radius'>]? )",
        "invert()": "invert( <number-percentage> )",
        "keyframes-name": "<custom-ident>|<string>",
        "keyframe-block": "<keyframe-selector># { <declaration-list> }",
        "keyframe-block-list": "<keyframe-block>+",
        "keyframe-selector": "from|to|<percentage>",
        "leader()": "leader( <leader-type> )",
        "leader-type": "dotted|solid|space|<string>",
        "length-percentage": "<length>|<percentage>",
        "line-names": "'[' <custom-ident>* ']'",
        "line-name-list": "[<line-names>|<name-repeat>]+",
        "line-style": "none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset",
        "line-width": "<length>|thin|medium|thick",
        "linear-color-hint": "<length-percentage>",
        "linear-color-stop": "<color> <color-stop-length>?",
        "linear-gradient()": "linear-gradient( [<angle>|to <side-or-corner>]? , <color-stop-list> )",
        "mask-layer": "<mask-reference>||<position> [/ <bg-size>]?||<repeat-style>||<geometry-box>||[<geometry-box>|no-clip]||<compositing-operator>||<masking-mode>",
        "mask-position": "[<length-percentage>|left|center|right] [<length-percentage>|top|center|bottom]?",
        "mask-reference": "none|<image>|<mask-source>",
        "mask-source": "<url>",
        "masking-mode": "alpha|luminance|match-source",
        "matrix()": "matrix( <number>#{6} )",
        "matrix3d()": "matrix3d( <number>#{16} )",
        "max()": "max( <calc-sum># )",
        "media-and": "<media-in-parens> [and <media-in-parens>]+",
        "media-condition": "<media-not>|<media-and>|<media-or>|<media-in-parens>",
        "media-condition-without-or": "<media-not>|<media-and>|<media-in-parens>",
        "media-feature": "( [<mf-plain>|<mf-boolean>|<mf-range>] )",
        "media-in-parens": "( <media-condition> )|<media-feature>|<general-enclosed>",
        "media-not": "not <media-in-parens>",
        "media-or": "<media-in-parens> [or <media-in-parens>]+",
        "media-query": "<media-condition>|[not|only]? <media-type> [and <media-condition-without-or>]?",
        "media-query-list": "<media-query>#",
        "media-type": "<ident>",
        "mf-boolean": "<mf-name>",
        "mf-name": "<ident>",
        "mf-plain": "<mf-name> : <mf-value>",
        "mf-range": "<mf-name> ['<'|'>']? '='? <mf-value>|<mf-value> ['<'|'>']? '='? <mf-name>|<mf-value> '<' '='? <mf-name> '<' '='? <mf-value>|<mf-value> '>' '='? <mf-name> '>' '='? <mf-value>",
        "mf-value": "<number>|<dimension>|<ident>|<ratio>",
        "min()": "min( <calc-sum># )",
        "minmax()": "minmax( [<length>|<percentage>|min-content|max-content|auto] , [<length>|<percentage>|<flex>|min-content|max-content|auto] )",
        "named-color": "transparent|aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen|<-non-standard-color>",
        "namespace-prefix": "<ident>",
        "ns-prefix": "[<ident-token>|'*']? '|'",
        "number-percentage": "<number>|<percentage>",
        "numeric-figure-values": "[lining-nums|oldstyle-nums]",
        "numeric-fraction-values": "[diagonal-fractions|stacked-fractions]",
        "numeric-spacing-values": "[proportional-nums|tabular-nums]",
        "nth": "<an-plus-b>|even|odd",
        "opacity()": "opacity( [<number-percentage>] )",
        "overflow-position": "unsafe|safe",
        "outline-radius": "<length>|<percentage>",
        "page-body": "<declaration>? [; <page-body>]?|<page-margin-box> <page-body>",
        "page-margin-box": "<page-margin-box-type> '{' <declaration-list> '}'",
        "page-margin-box-type": "@top-left-corner|@top-left|@top-center|@top-right|@top-right-corner|@bottom-left-corner|@bottom-left|@bottom-center|@bottom-right|@bottom-right-corner|@left-top|@left-middle|@left-bottom|@right-top|@right-middle|@right-bottom",
        "page-selector-list": "[<page-selector>#]?",
        "page-selector": "<pseudo-page>+|<ident> <pseudo-page>*",
        "page-size": "A5|A4|A3|B5|B4|JIS-B5|JIS-B4|letter|legal|ledger",
        "path()": "path( [<fill-rule> ,]? <string> )",
        "paint()": "paint( <ident> , <declaration-value>? )",
        "perspective()": "perspective( <length> )",
        "polygon()": "polygon( <fill-rule>? , [<length-percentage> <length-percentage>]# )",
        "position": "[[left|center|right]||[top|center|bottom]|[left|center|right|<length-percentage>] [top|center|bottom|<length-percentage>]?|[[left|right] <length-percentage>]&&[[top|bottom] <length-percentage>]]",
        "pseudo-class-selector": "':' <ident-token>|':' <function-token> <any-value> ')'",
        "pseudo-element-selector": "':' <pseudo-class-selector>",
        "pseudo-page": ": [left|right|first|blank]",
        "quote": "open-quote|close-quote|no-open-quote|no-close-quote",
        "radial-gradient()": "radial-gradient( [<ending-shape>||<size>]? [at <position>]? , <color-stop-list> )",
        "relative-selector": "<combinator>? <complex-selector>",
        "relative-selector-list": "<relative-selector>#",
        "relative-size": "larger|smaller",
        "repeat-style": "repeat-x|repeat-y|[repeat|space|round|no-repeat]{1,2}",
        "repeating-linear-gradient()": "repeating-linear-gradient( [<angle>|to <side-or-corner>]? , <color-stop-list> )",
        "repeating-radial-gradient()": "repeating-radial-gradient( [<ending-shape>||<size>]? [at <position>]? , <color-stop-list> )",
        "rgb()": "rgb( <percentage>{3} [/ <alpha-value>]? )|rgb( <number>{3} [/ <alpha-value>]? )|rgb( <percentage>#{3} , <alpha-value>? )|rgb( <number>#{3} , <alpha-value>? )",
        "rgba()": "rgba( <percentage>{3} [/ <alpha-value>]? )|rgba( <number>{3} [/ <alpha-value>]? )|rgba( <percentage>#{3} , <alpha-value>? )|rgba( <number>#{3} , <alpha-value>? )",
        "rotate()": "rotate( [<angle>|<zero>] )",
        "rotate3d()": "rotate3d( <number> , <number> , <number> , [<angle>|<zero>] )",
        "rotateX()": "rotateX( [<angle>|<zero>] )",
        "rotateY()": "rotateY( [<angle>|<zero>] )",
        "rotateZ()": "rotateZ( [<angle>|<zero>] )",
        "saturate()": "saturate( <number-percentage> )",
        "scale()": "scale( <number> , <number>? )",
        "scale3d()": "scale3d( <number> , <number> , <number> )",
        "scaleX()": "scaleX( <number> )",
        "scaleY()": "scaleY( <number> )",
        "scaleZ()": "scaleZ( <number> )",
        "self-position": "center|start|end|self-start|self-end|flex-start|flex-end",
        "shape-radius": "<length-percentage>|closest-side|farthest-side",
        "skew()": "skew( [<angle>|<zero>] , [<angle>|<zero>]? )",
        "skewX()": "skewX( [<angle>|<zero>] )",
        "skewY()": "skewY( [<angle>|<zero>] )",
        "sepia()": "sepia( <number-percentage> )",
        "shadow": "inset?&&<length>{2,4}&&<color>?",
        "shadow-t": "[<length>{2,3}&&<color>?]",
        "shape": "rect( <top> , <right> , <bottom> , <left> )|rect( <top> <right> <bottom> <left> )",
        "shape-box": "<box>|margin-box",
        "side-or-corner": "[left|right]||[top|bottom]",
        "single-animation": "<time>||<easing-function>||<time>||<single-animation-iteration-count>||<single-animation-direction>||<single-animation-fill-mode>||<single-animation-play-state>||[none|<keyframes-name>]",
        "single-animation-direction": "normal|reverse|alternate|alternate-reverse",
        "single-animation-fill-mode": "none|forwards|backwards|both",
        "single-animation-iteration-count": "infinite|<number>",
        "single-animation-play-state": "running|paused",
        "single-transition": "[none|<single-transition-property>]||<time>||<easing-function>||<time>",
        "single-transition-property": "all|<custom-ident>",
        "size": "closest-side|farthest-side|closest-corner|farthest-corner|<length>|<length-percentage>{2}",
        "step-position": "jump-start|jump-end|jump-none|jump-both|start|end",
        "step-timing-function": "step-start|step-end|steps( <integer> [, <step-position>]? )",
        "subclass-selector": "<id-selector>|<class-selector>|<attribute-selector>|<pseudo-class-selector>",
        "supports-condition": "not <supports-in-parens>|<supports-in-parens> [and <supports-in-parens>]*|<supports-in-parens> [or <supports-in-parens>]*",
        "supports-in-parens": "( <supports-condition> )|<supports-feature>|<general-enclosed>",
        "supports-feature": "<supports-decl>|<supports-selector-fn>",
        "supports-decl": "( <declaration> )",
        "supports-selector-fn": "selector( <complex-selector> )",
        "symbol": "<string>|<image>|<custom-ident>",
        "target": "<target-counter()>|<target-counters()>|<target-text()>",
        "target-counter()": "target-counter( [<string>|<url>] , <custom-ident> , <counter-style>? )",
        "target-counters()": "target-counters( [<string>|<url>] , <custom-ident> , <string> , <counter-style>? )",
        "target-text()": "target-text( [<string>|<url>] , [content|before|after|first-letter]? )",
        "time-percentage": "<time>|<percentage>",
        "easing-function": "linear|<cubic-bezier-timing-function>|<step-timing-function>",
        "track-breadth": "<length-percentage>|<flex>|min-content|max-content|auto",
        "track-list": "[<line-names>? [<track-size>|<track-repeat>]]+ <line-names>?",
        "track-repeat": "repeat( [<integer [1,\u221E]>] , [<line-names>? <track-size>]+ <line-names>? )",
        "track-size": "<track-breadth>|minmax( <inflexible-breadth> , <track-breadth> )|fit-content( [<length>|<percentage>] )",
        "transform-function": "<matrix()>|<translate()>|<translateX()>|<translateY()>|<scale()>|<scaleX()>|<scaleY()>|<rotate()>|<skew()>|<skewX()>|<skewY()>|<matrix3d()>|<translate3d()>|<translateZ()>|<scale3d()>|<scaleZ()>|<rotate3d()>|<rotateX()>|<rotateY()>|<rotateZ()>|<perspective()>",
        "transform-list": "<transform-function>+",
        "translate()": "translate( <length-percentage> , <length-percentage>? )",
        "translate3d()": "translate3d( <length-percentage> , <length-percentage> , <length> )",
        "translateX()": "translateX( <length-percentage> )",
        "translateY()": "translateY( <length-percentage> )",
        "translateZ()": "translateZ( <length> )",
        "type-or-unit": "string|color|url|integer|number|length|angle|time|frequency|cap|ch|em|ex|ic|lh|rlh|rem|vb|vi|vw|vh|vmin|vmax|mm|Q|cm|in|pt|pc|px|deg|grad|rad|turn|ms|s|Hz|kHz|%",
        "type-selector": "<wq-name>|<ns-prefix>? '*'",
        "var()": "var( <custom-property-name> , <declaration-value>? )",
        "viewport-length": "auto|<length-percentage>",
        "visual-box": "content-box|padding-box|border-box",
        "wq-name": "<ns-prefix>? <ident-token>",
        "-legacy-gradient": "<-webkit-gradient()>|<-legacy-linear-gradient>|<-legacy-repeating-linear-gradient>|<-legacy-radial-gradient>|<-legacy-repeating-radial-gradient>",
        "-legacy-linear-gradient": "-moz-linear-gradient( <-legacy-linear-gradient-arguments> )|-webkit-linear-gradient( <-legacy-linear-gradient-arguments> )|-o-linear-gradient( <-legacy-linear-gradient-arguments> )",
        "-legacy-repeating-linear-gradient": "-moz-repeating-linear-gradient( <-legacy-linear-gradient-arguments> )|-webkit-repeating-linear-gradient( <-legacy-linear-gradient-arguments> )|-o-repeating-linear-gradient( <-legacy-linear-gradient-arguments> )",
        "-legacy-linear-gradient-arguments": "[<angle>|<side-or-corner>]? , <color-stop-list>",
        "-legacy-radial-gradient": "-moz-radial-gradient( <-legacy-radial-gradient-arguments> )|-webkit-radial-gradient( <-legacy-radial-gradient-arguments> )|-o-radial-gradient( <-legacy-radial-gradient-arguments> )",
        "-legacy-repeating-radial-gradient": "-moz-repeating-radial-gradient( <-legacy-radial-gradient-arguments> )|-webkit-repeating-radial-gradient( <-legacy-radial-gradient-arguments> )|-o-repeating-radial-gradient( <-legacy-radial-gradient-arguments> )",
        "-legacy-radial-gradient-arguments": "[<position> ,]? [[[<-legacy-radial-gradient-shape>||<-legacy-radial-gradient-size>]|[<length>|<percentage>]{2}] ,]? <color-stop-list>",
        "-legacy-radial-gradient-size": "closest-side|closest-corner|farthest-side|farthest-corner|contain|cover",
        "-legacy-radial-gradient-shape": "circle|ellipse",
        "-non-standard-font": "-apple-system-body|-apple-system-headline|-apple-system-subheadline|-apple-system-caption1|-apple-system-caption2|-apple-system-footnote|-apple-system-short-body|-apple-system-short-headline|-apple-system-short-subheadline|-apple-system-short-caption1|-apple-system-short-footnote|-apple-system-tall-body",
        "-non-standard-color": "-moz-ButtonDefault|-moz-ButtonHoverFace|-moz-ButtonHoverText|-moz-CellHighlight|-moz-CellHighlightText|-moz-Combobox|-moz-ComboboxText|-moz-Dialog|-moz-DialogText|-moz-dragtargetzone|-moz-EvenTreeRow|-moz-Field|-moz-FieldText|-moz-html-CellHighlight|-moz-html-CellHighlightText|-moz-mac-accentdarkestshadow|-moz-mac-accentdarkshadow|-moz-mac-accentface|-moz-mac-accentlightesthighlight|-moz-mac-accentlightshadow|-moz-mac-accentregularhighlight|-moz-mac-accentregularshadow|-moz-mac-chrome-active|-moz-mac-chrome-inactive|-moz-mac-focusring|-moz-mac-menuselect|-moz-mac-menushadow|-moz-mac-menutextselect|-moz-MenuHover|-moz-MenuHoverText|-moz-MenuBarText|-moz-MenuBarHoverText|-moz-nativehyperlinktext|-moz-OddTreeRow|-moz-win-communicationstext|-moz-win-mediatext|-moz-activehyperlinktext|-moz-default-background-color|-moz-default-color|-moz-hyperlinktext|-moz-visitedhyperlinktext|-webkit-activelink|-webkit-focus-ring-color|-webkit-link|-webkit-text",
        "-non-standard-image-rendering": "optimize-contrast|-moz-crisp-edges|-o-crisp-edges|-webkit-optimize-contrast",
        "-non-standard-overflow": "-moz-scrollbars-none|-moz-scrollbars-horizontal|-moz-scrollbars-vertical|-moz-hidden-unscrollable",
        "-non-standard-width": "fill-available|min-intrinsic|intrinsic|-moz-available|-moz-fit-content|-moz-min-content|-moz-max-content|-webkit-min-content|-webkit-max-content",
        "-webkit-gradient()": "-webkit-gradient( <-webkit-gradient-type> , <-webkit-gradient-point> [, <-webkit-gradient-point>|, <-webkit-gradient-radius> , <-webkit-gradient-point>] [, <-webkit-gradient-radius>]? [, <-webkit-gradient-color-stop>]* )",
        "-webkit-gradient-color-stop": "from( <color> )|color-stop( [<number-zero-one>|<percentage>] , <color> )|to( <color> )",
        "-webkit-gradient-point": "[left|center|right|<length-percentage>] [top|center|bottom|<length-percentage>]",
        "-webkit-gradient-radius": "<length>|<percentage>",
        "-webkit-gradient-type": "linear|radial",
        "-webkit-mask-box-repeat": "repeat|stretch|round",
        "-webkit-mask-clip-style": "border|border-box|padding|padding-box|content|content-box|text",
        "-ms-filter-function-list": "<-ms-filter-function>+",
        "-ms-filter-function": "<-ms-filter-function-progid>|<-ms-filter-function-legacy>",
        "-ms-filter-function-progid": "'progid:' [<ident-token> '.']* [<ident-token>|<function-token> <any-value>? )]",
        "-ms-filter-function-legacy": "<ident-token>|<function-token> <any-value>? )",
        "-ms-filter": "<string>",
        "age": "child|young|old",
        "attr-name": "<wq-name>",
        "attr-fallback": "<any-value>",
        "border-radius": "<length-percentage>{1,2}",
        "bottom": "<length>|auto",
        "counter": "<counter()>|<counters()>",
        "counter-name": "<custom-ident>",
        "generic-voice": "[<age>? <gender> <integer>?]",
        "gender": "male|female|neutral",
        "left": "<length>|auto",
        "mask-image": "<mask-reference>#",
        "name-repeat": "repeat( [<positive-integer>|auto-fill] , <line-names>+ )",
        "paint": "none|<color>|<url> [none|<color>]?|context-fill|context-stroke",
        "ratio": "<integer> / <integer>",
        "right": "<length>|auto",
        "svg-length": "<percentage>|<length>|<number>",
        "svg-writing-mode": "lr-tb|rl-tb|tb-rl|lr|rl|tb",
        "top": "<length>|auto",
        "track-group": "'(' [<string>* <track-minmax> <string>*]+ ')' ['[' <positive-integer> ']']?|<track-minmax>",
        "track-list-v0": "[<string>* <track-group> <string>*]+|none",
        "track-minmax": "minmax( <track-breadth> , <track-breadth> )|auto|<track-breadth>|fit-content",
        "x": "<number>",
        "y": "<number>",
        "declaration": "<ident-token> : <declaration-value>? ['!' important]?",
        "declaration-list": "[<declaration>? ';']* <declaration>?",
        "url": "url( <string> <url-modifier>* )|<url-token>",
        "url-modifier": "<ident>|<function-token> <any-value> )",
        "number-zero-one": "<number [0,1]>",
        "number-one-or-greater": "<number [1,\u221E]>",
        "positive-integer": "<integer [0,\u221E]>",
        "-non-standard-display": "-ms-inline-flexbox|-ms-grid|-ms-inline-grid|-webkit-flex|-webkit-inline-flex|-webkit-box|-webkit-inline-box|-moz-inline-stack|-moz-box|-moz-inline-box"
    },
    "properties": {
        "--*": "<declaration-value>",
        "-ms-accelerator": "false|true",
        "-ms-block-progression": "tb|rl|bt|lr",
        "-ms-content-zoom-chaining": "none|chained",
        "-ms-content-zooming": "none|zoom",
        "-ms-content-zoom-limit": "<'-ms-content-zoom-limit-min'> <'-ms-content-zoom-limit-max'>",
        "-ms-content-zoom-limit-max": "<percentage>",
        "-ms-content-zoom-limit-min": "<percentage>",
        "-ms-content-zoom-snap": "<'-ms-content-zoom-snap-type'>||<'-ms-content-zoom-snap-points'>",
        "-ms-content-zoom-snap-points": "snapInterval( <percentage> , <percentage> )|snapList( <percentage># )",
        "-ms-content-zoom-snap-type": "none|proximity|mandatory",
        "-ms-filter": "<string>",
        "-ms-flow-from": "[none|<custom-ident>]#",
        "-ms-flow-into": "[none|<custom-ident>]#",
        "-ms-grid-columns": "none|<track-list>|<auto-track-list>",
        "-ms-grid-rows": "none|<track-list>|<auto-track-list>",
        "-ms-high-contrast-adjust": "auto|none",
        "-ms-hyphenate-limit-chars": "auto|<integer>{1,3}",
        "-ms-hyphenate-limit-lines": "no-limit|<integer>",
        "-ms-hyphenate-limit-zone": "<percentage>|<length>",
        "-ms-ime-align": "auto|after",
        "-ms-overflow-style": "auto|none|scrollbar|-ms-autohiding-scrollbar",
        "-ms-scrollbar-3dlight-color": "<color>",
        "-ms-scrollbar-arrow-color": "<color>",
        "-ms-scrollbar-base-color": "<color>",
        "-ms-scrollbar-darkshadow-color": "<color>",
        "-ms-scrollbar-face-color": "<color>",
        "-ms-scrollbar-highlight-color": "<color>",
        "-ms-scrollbar-shadow-color": "<color>",
        "-ms-scrollbar-track-color": "<color>",
        "-ms-scroll-chaining": "chained|none",
        "-ms-scroll-limit": "<'-ms-scroll-limit-x-min'> <'-ms-scroll-limit-y-min'> <'-ms-scroll-limit-x-max'> <'-ms-scroll-limit-y-max'>",
        "-ms-scroll-limit-x-max": "auto|<length>",
        "-ms-scroll-limit-x-min": "<length>",
        "-ms-scroll-limit-y-max": "auto|<length>",
        "-ms-scroll-limit-y-min": "<length>",
        "-ms-scroll-rails": "none|railed",
        "-ms-scroll-snap-points-x": "snapInterval( <length-percentage> , <length-percentage> )|snapList( <length-percentage># )",
        "-ms-scroll-snap-points-y": "snapInterval( <length-percentage> , <length-percentage> )|snapList( <length-percentage># )",
        "-ms-scroll-snap-type": "none|proximity|mandatory",
        "-ms-scroll-snap-x": "<'-ms-scroll-snap-type'> <'-ms-scroll-snap-points-x'>",
        "-ms-scroll-snap-y": "<'-ms-scroll-snap-type'> <'-ms-scroll-snap-points-y'>",
        "-ms-scroll-translation": "none|vertical-to-horizontal",
        "-ms-text-autospace": "none|ideograph-alpha|ideograph-numeric|ideograph-parenthesis|ideograph-space",
        "-ms-touch-select": "grippers|none",
        "-ms-user-select": "none|element|text",
        "-ms-wrap-flow": "auto|both|start|end|maximum|clear",
        "-ms-wrap-margin": "<length>",
        "-ms-wrap-through": "wrap|none",
        "-moz-appearance": "none|button|button-arrow-down|button-arrow-next|button-arrow-previous|button-arrow-up|button-bevel|button-focus|caret|checkbox|checkbox-container|checkbox-label|checkmenuitem|dualbutton|groupbox|listbox|listitem|menuarrow|menubar|menucheckbox|menuimage|menuitem|menuitemtext|menulist|menulist-button|menulist-text|menulist-textfield|menupopup|menuradio|menuseparator|meterbar|meterchunk|progressbar|progressbar-vertical|progresschunk|progresschunk-vertical|radio|radio-container|radio-label|radiomenuitem|range|range-thumb|resizer|resizerpanel|scale-horizontal|scalethumbend|scalethumb-horizontal|scalethumbstart|scalethumbtick|scalethumb-vertical|scale-vertical|scrollbarbutton-down|scrollbarbutton-left|scrollbarbutton-right|scrollbarbutton-up|scrollbarthumb-horizontal|scrollbarthumb-vertical|scrollbartrack-horizontal|scrollbartrack-vertical|searchfield|separator|sheet|spinner|spinner-downbutton|spinner-textfield|spinner-upbutton|splitter|statusbar|statusbarpanel|tab|tabpanel|tabpanels|tab-scroll-arrow-back|tab-scroll-arrow-forward|textfield|textfield-multiline|toolbar|toolbarbutton|toolbarbutton-dropdown|toolbargripper|toolbox|tooltip|treeheader|treeheadercell|treeheadersortarrow|treeitem|treeline|treetwisty|treetwistyopen|treeview|-moz-mac-unified-toolbar|-moz-win-borderless-glass|-moz-win-browsertabbar-toolbox|-moz-win-communicationstext|-moz-win-communications-toolbox|-moz-win-exclude-glass|-moz-win-glass|-moz-win-mediatext|-moz-win-media-toolbox|-moz-window-button-box|-moz-window-button-box-maximized|-moz-window-button-close|-moz-window-button-maximize|-moz-window-button-minimize|-moz-window-button-restore|-moz-window-frame-bottom|-moz-window-frame-left|-moz-window-frame-right|-moz-window-titlebar|-moz-window-titlebar-maximized",
        "-moz-binding": "<url>|none",
        "-moz-border-bottom-colors": "<color>+|none",
        "-moz-border-left-colors": "<color>+|none",
        "-moz-border-right-colors": "<color>+|none",
        "-moz-border-top-colors": "<color>+|none",
        "-moz-context-properties": "none|[fill|fill-opacity|stroke|stroke-opacity]#",
        "-moz-float-edge": "border-box|content-box|margin-box|padding-box",
        "-moz-force-broken-image-icon": "0|1",
        "-moz-image-region": "<shape>|auto",
        "-moz-orient": "inline|block|horizontal|vertical",
        "-moz-outline-radius": "<outline-radius>{1,4} [/ <outline-radius>{1,4}]?",
        "-moz-outline-radius-bottomleft": "<outline-radius>",
        "-moz-outline-radius-bottomright": "<outline-radius>",
        "-moz-outline-radius-topleft": "<outline-radius>",
        "-moz-outline-radius-topright": "<outline-radius>",
        "-moz-stack-sizing": "ignore|stretch-to-fit",
        "-moz-text-blink": "none|blink",
        "-moz-user-focus": "ignore|normal|select-after|select-before|select-menu|select-same|select-all|none",
        "-moz-user-input": "auto|none|enabled|disabled",
        "-moz-user-modify": "read-only|read-write|write-only",
        "-moz-window-dragging": "drag|no-drag",
        "-moz-window-shadow": "default|menu|tooltip|sheet|none",
        "-webkit-appearance": "none|button|button-bevel|caps-lock-indicator|caret|checkbox|default-button|inner-spin-button|listbox|listitem|media-controls-background|media-controls-fullscreen-background|media-current-time-display|media-enter-fullscreen-button|media-exit-fullscreen-button|media-fullscreen-button|media-mute-button|media-overlay-play-button|media-play-button|media-seek-back-button|media-seek-forward-button|media-slider|media-sliderthumb|media-time-remaining-display|media-toggle-closed-captions-button|media-volume-slider|media-volume-slider-container|media-volume-sliderthumb|menulist|menulist-button|menulist-text|menulist-textfield|meter|progress-bar|progress-bar-value|push-button|radio|scrollbarbutton-down|scrollbarbutton-left|scrollbarbutton-right|scrollbarbutton-up|scrollbargripper-horizontal|scrollbargripper-vertical|scrollbarthumb-horizontal|scrollbarthumb-vertical|scrollbartrack-horizontal|scrollbartrack-vertical|searchfield|searchfield-cancel-button|searchfield-decoration|searchfield-results-button|searchfield-results-decoration|slider-horizontal|slider-vertical|sliderthumb-horizontal|sliderthumb-vertical|square-button|textarea|textfield|-apple-pay-button",
        "-webkit-border-before": "<'border-width'>||<'border-style'>||<color>",
        "-webkit-border-before-color": "<color>",
        "-webkit-border-before-style": "<'border-style'>",
        "-webkit-border-before-width": "<'border-width'>",
        "-webkit-box-reflect": "[above|below|right|left]? <length>? <image>?",
        "-webkit-line-clamp": "none|<integer>",
        "-webkit-mask": "[<mask-reference>||<position> [/ <bg-size>]?||<repeat-style>||[<box>|border|padding|content|text]||[<box>|border|padding|content]]#",
        "-webkit-mask-attachment": "<attachment>#",
        "-webkit-mask-clip": "[<box>|border|padding|content|text]#",
        "-webkit-mask-composite": "<composite-style>#",
        "-webkit-mask-image": "<mask-reference>#",
        "-webkit-mask-origin": "[<box>|border|padding|content]#",
        "-webkit-mask-position": "<position>#",
        "-webkit-mask-position-x": "[<length-percentage>|left|center|right]#",
        "-webkit-mask-position-y": "[<length-percentage>|top|center|bottom]#",
        "-webkit-mask-repeat": "<repeat-style>#",
        "-webkit-mask-repeat-x": "repeat|no-repeat|space|round",
        "-webkit-mask-repeat-y": "repeat|no-repeat|space|round",
        "-webkit-mask-size": "<bg-size>#",
        "-webkit-overflow-scrolling": "auto|touch",
        "-webkit-tap-highlight-color": "<color>",
        "-webkit-text-fill-color": "<color>",
        "-webkit-text-stroke": "<length>||<color>",
        "-webkit-text-stroke-color": "<color>",
        "-webkit-text-stroke-width": "<length>",
        "-webkit-touch-callout": "default|none",
        "-webkit-user-modify": "read-only|read-write|read-write-plaintext-only",
        "accent-color": "auto|<color>",
        "align-content": "normal|<baseline-position>|<content-distribution>|<overflow-position>? <content-position>",
        "align-items": "normal|stretch|<baseline-position>|[<overflow-position>? <self-position>]",
        "align-self": "auto|normal|stretch|<baseline-position>|<overflow-position>? <self-position>",
        "align-tracks": "[normal|<baseline-position>|<content-distribution>|<overflow-position>? <content-position>]#",
        "all": "initial|inherit|unset|revert",
        "animation": "<single-animation>#",
        "animation-delay": "<time>#",
        "animation-direction": "<single-animation-direction>#",
        "animation-duration": "<time>#",
        "animation-fill-mode": "<single-animation-fill-mode>#",
        "animation-iteration-count": "<single-animation-iteration-count>#",
        "animation-name": "[none|<keyframes-name>]#",
        "animation-play-state": "<single-animation-play-state>#",
        "animation-timing-function": "<easing-function>#",
        "appearance": "none|auto|textfield|menulist-button|<compat-auto>",
        "aspect-ratio": "auto|<ratio>",
        "azimuth": "<angle>|[[left-side|far-left|left|center-left|center|center-right|right|far-right|right-side]||behind]|leftwards|rightwards",
        "backdrop-filter": "none|<filter-function-list>",
        "backface-visibility": "visible|hidden",
        "background": "[<bg-layer> ,]* <final-bg-layer>",
        "background-attachment": "<attachment>#",
        "background-blend-mode": "<blend-mode>#",
        "background-clip": "<box>#",
        "background-color": "<color>",
        "background-image": "<bg-image>#",
        "background-origin": "<box>#",
        "background-position": "<bg-position>#",
        "background-position-x": "[center|[[left|right|x-start|x-end]? <length-percentage>?]!]#",
        "background-position-y": "[center|[[top|bottom|y-start|y-end]? <length-percentage>?]!]#",
        "background-repeat": "<repeat-style>#",
        "background-size": "<bg-size>#",
        "block-overflow": "clip|ellipsis|<string>",
        "block-size": "<'width'>",
        "border": "<line-width>||<line-style>||<color>",
        "border-block": "<'border-top-width'>||<'border-top-style'>||<color>",
        "border-block-color": "<'border-top-color'>{1,2}",
        "border-block-style": "<'border-top-style'>",
        "border-block-width": "<'border-top-width'>",
        "border-block-end": "<'border-top-width'>||<'border-top-style'>||<color>",
        "border-block-end-color": "<'border-top-color'>",
        "border-block-end-style": "<'border-top-style'>",
        "border-block-end-width": "<'border-top-width'>",
        "border-block-start": "<'border-top-width'>||<'border-top-style'>||<color>",
        "border-block-start-color": "<'border-top-color'>",
        "border-block-start-style": "<'border-top-style'>",
        "border-block-start-width": "<'border-top-width'>",
        "border-bottom": "<line-width>||<line-style>||<color>",
        "border-bottom-color": "<'border-top-color'>",
        "border-bottom-left-radius": "<length-percentage>{1,2}",
        "border-bottom-right-radius": "<length-percentage>{1,2}",
        "border-bottom-style": "<line-style>",
        "border-bottom-width": "<line-width>",
        "border-collapse": "collapse|separate",
        "border-color": "<color>{1,4}",
        "border-end-end-radius": "<length-percentage>{1,2}",
        "border-end-start-radius": "<length-percentage>{1,2}",
        "border-image": "<'border-image-source'>||<'border-image-slice'> [/ <'border-image-width'>|/ <'border-image-width'>? / <'border-image-outset'>]?||<'border-image-repeat'>",
        "border-image-outset": "[<length>|<number>]{1,4}",
        "border-image-repeat": "[stretch|repeat|round|space]{1,2}",
        "border-image-slice": "<number-percentage>{1,4}&&fill?",
        "border-image-source": "none|<image>",
        "border-image-width": "[<length-percentage>|<number>|auto]{1,4}",
        "border-inline": "<'border-top-width'>||<'border-top-style'>||<color>",
        "border-inline-end": "<'border-top-width'>||<'border-top-style'>||<color>",
        "border-inline-color": "<'border-top-color'>{1,2}",
        "border-inline-style": "<'border-top-style'>",
        "border-inline-width": "<'border-top-width'>",
        "border-inline-end-color": "<'border-top-color'>",
        "border-inline-end-style": "<'border-top-style'>",
        "border-inline-end-width": "<'border-top-width'>",
        "border-inline-start": "<'border-top-width'>||<'border-top-style'>||<color>",
        "border-inline-start-color": "<'border-top-color'>",
        "border-inline-start-style": "<'border-top-style'>",
        "border-inline-start-width": "<'border-top-width'>",
        "border-left": "<line-width>||<line-style>||<color>",
        "border-left-color": "<color>",
        "border-left-style": "<line-style>",
        "border-left-width": "<line-width>",
        "border-radius": "<length-percentage>{1,4} [/ <length-percentage>{1,4}]?",
        "border-right": "<line-width>||<line-style>||<color>",
        "border-right-color": "<color>",
        "border-right-style": "<line-style>",
        "border-right-width": "<line-width>",
        "border-spacing": "<length> <length>?",
        "border-start-end-radius": "<length-percentage>{1,2}",
        "border-start-start-radius": "<length-percentage>{1,2}",
        "border-style": "<line-style>{1,4}",
        "border-top": "<line-width>||<line-style>||<color>",
        "border-top-color": "<color>",
        "border-top-left-radius": "<length-percentage>{1,2}",
        "border-top-right-radius": "<length-percentage>{1,2}",
        "border-top-style": "<line-style>",
        "border-top-width": "<line-width>",
        "border-width": "<line-width>{1,4}",
        "bottom": "<length>|<percentage>|auto",
        "box-align": "start|center|end|baseline|stretch",
        "box-decoration-break": "slice|clone",
        "box-direction": "normal|reverse|inherit",
        "box-flex": "<number>",
        "box-flex-group": "<integer>",
        "box-lines": "single|multiple",
        "box-ordinal-group": "<integer>",
        "box-orient": "horizontal|vertical|inline-axis|block-axis|inherit",
        "box-pack": "start|center|end|justify",
        "box-shadow": "none|<shadow>#",
        "box-sizing": "content-box|border-box",
        "break-after": "auto|avoid|always|all|avoid-page|page|left|right|recto|verso|avoid-column|column|avoid-region|region",
        "break-before": "auto|avoid|always|all|avoid-page|page|left|right|recto|verso|avoid-column|column|avoid-region|region",
        "break-inside": "auto|avoid|avoid-page|avoid-column|avoid-region",
        "caption-side": "top|bottom|block-start|block-end|inline-start|inline-end",
        "caret-color": "auto|<color>",
        "clear": "none|left|right|both|inline-start|inline-end",
        "clip": "<shape>|auto",
        "clip-path": "<clip-source>|[<basic-shape>||<geometry-box>]|none",
        "color": "<color>",
        "color-adjust": "economy|exact",
        "color-scheme": "normal|[light|dark|<custom-ident>]+",
        "column-count": "<integer>|auto",
        "column-fill": "auto|balance|balance-all",
        "column-gap": "normal|<length-percentage>",
        "column-rule": "<'column-rule-width'>||<'column-rule-style'>||<'column-rule-color'>",
        "column-rule-color": "<color>",
        "column-rule-style": "<'border-style'>",
        "column-rule-width": "<'border-width'>",
        "column-span": "none|all",
        "column-width": "<length>|auto",
        "columns": "<'column-width'>||<'column-count'>",
        "contain": "none|strict|content|[size||layout||style||paint]",
        "content": "normal|none|[<content-replacement>|<content-list>] [/ [<string>|<counter>]+]?",
        "content-visibility": "visible|auto|hidden",
        "counter-increment": "[<counter-name> <integer>?]+|none",
        "counter-reset": "[<counter-name> <integer>?]+|none",
        "counter-set": "[<counter-name> <integer>?]+|none",
        "cursor": "[[<url> [<x> <y>]? ,]* [auto|default|none|context-menu|help|pointer|progress|wait|cell|crosshair|text|vertical-text|alias|copy|move|no-drop|not-allowed|e-resize|n-resize|ne-resize|nw-resize|s-resize|se-resize|sw-resize|w-resize|ew-resize|ns-resize|nesw-resize|nwse-resize|col-resize|row-resize|all-scroll|zoom-in|zoom-out|grab|grabbing|hand|-webkit-grab|-webkit-grabbing|-webkit-zoom-in|-webkit-zoom-out|-moz-grab|-moz-grabbing|-moz-zoom-in|-moz-zoom-out]]",
        "direction": "ltr|rtl",
        "display": "[<display-outside>||<display-inside>]|<display-listitem>|<display-internal>|<display-box>|<display-legacy>|<-non-standard-display>",
        "empty-cells": "show|hide",
        "filter": "none|<filter-function-list>|<-ms-filter-function-list>",
        "flex": "none|[<'flex-grow'> <'flex-shrink'>?||<'flex-basis'>]",
        "flex-basis": "content|<'width'>",
        "flex-direction": "row|row-reverse|column|column-reverse",
        "flex-flow": "<'flex-direction'>||<'flex-wrap'>",
        "flex-grow": "<number>",
        "flex-shrink": "<number>",
        "flex-wrap": "nowrap|wrap|wrap-reverse",
        "float": "left|right|none|inline-start|inline-end",
        "font": "[[<'font-style'>||<font-variant-css21>||<'font-weight'>||<'font-stretch'>]? <'font-size'> [/ <'line-height'>]? <'font-family'>]|caption|icon|menu|message-box|small-caption|status-bar",
        "font-family": "[<family-name>|<generic-family>]#",
        "font-feature-settings": "normal|<feature-tag-value>#",
        "font-kerning": "auto|normal|none",
        "font-language-override": "normal|<string>",
        "font-optical-sizing": "auto|none",
        "font-variation-settings": "normal|[<string> <number>]#",
        "font-size": "<absolute-size>|<relative-size>|<length-percentage>",
        "font-size-adjust": "none|[ex-height|cap-height|ch-width|ic-width|ic-height]? [from-font|<number>]",
        "font-smooth": "auto|never|always|<absolute-size>|<length>",
        "font-stretch": "<font-stretch-absolute>",
        "font-style": "normal|italic|oblique <angle>?",
        "font-synthesis": "none|[weight||style||small-caps]",
        "font-variant": "normal|none|[<common-lig-values>||<discretionary-lig-values>||<historical-lig-values>||<contextual-alt-values>||stylistic( <feature-value-name> )||historical-forms||styleset( <feature-value-name># )||character-variant( <feature-value-name># )||swash( <feature-value-name> )||ornaments( <feature-value-name> )||annotation( <feature-value-name> )||[small-caps|all-small-caps|petite-caps|all-petite-caps|unicase|titling-caps]||<numeric-figure-values>||<numeric-spacing-values>||<numeric-fraction-values>||ordinal||slashed-zero||<east-asian-variant-values>||<east-asian-width-values>||ruby]",
        "font-variant-alternates": "normal|[stylistic( <feature-value-name> )||historical-forms||styleset( <feature-value-name># )||character-variant( <feature-value-name># )||swash( <feature-value-name> )||ornaments( <feature-value-name> )||annotation( <feature-value-name> )]",
        "font-variant-caps": "normal|small-caps|all-small-caps|petite-caps|all-petite-caps|unicase|titling-caps",
        "font-variant-east-asian": "normal|[<east-asian-variant-values>||<east-asian-width-values>||ruby]",
        "font-variant-ligatures": "normal|none|[<common-lig-values>||<discretionary-lig-values>||<historical-lig-values>||<contextual-alt-values>]",
        "font-variant-numeric": "normal|[<numeric-figure-values>||<numeric-spacing-values>||<numeric-fraction-values>||ordinal||slashed-zero]",
        "font-variant-position": "normal|sub|super",
        "font-weight": "<font-weight-absolute>|bolder|lighter",
        "forced-color-adjust": "auto|none",
        "gap": "<'row-gap'> <'column-gap'>?",
        "grid": "<'grid-template'>|<'grid-template-rows'> / [auto-flow&&dense?] <'grid-auto-columns'>?|[auto-flow&&dense?] <'grid-auto-rows'>? / <'grid-template-columns'>",
        "grid-area": "<grid-line> [/ <grid-line>]{0,3}",
        "grid-auto-columns": "<track-size>+",
        "grid-auto-flow": "[row|column]||dense",
        "grid-auto-rows": "<track-size>+",
        "grid-column": "<grid-line> [/ <grid-line>]?",
        "grid-column-end": "<grid-line>",
        "grid-column-gap": "<length-percentage>",
        "grid-column-start": "<grid-line>",
        "grid-gap": "<'grid-row-gap'> <'grid-column-gap'>?",
        "grid-row": "<grid-line> [/ <grid-line>]?",
        "grid-row-end": "<grid-line>",
        "grid-row-gap": "<length-percentage>",
        "grid-row-start": "<grid-line>",
        "grid-template": "none|[<'grid-template-rows'> / <'grid-template-columns'>]|[<line-names>? <string> <track-size>? <line-names>?]+ [/ <explicit-track-list>]?",
        "grid-template-areas": "none|<string>+",
        "grid-template-columns": "none|<track-list>|<auto-track-list>|subgrid <line-name-list>?",
        "grid-template-rows": "none|<track-list>|<auto-track-list>|subgrid <line-name-list>?",
        "hanging-punctuation": "none|[first||[force-end|allow-end]||last]",
        "height": "auto|<length>|<percentage>|min-content|max-content|fit-content|fit-content( <length-percentage> )",
        "hyphens": "none|manual|auto",
        "image-orientation": "from-image|<angle>|[<angle>? flip]",
        "image-rendering": "auto|crisp-edges|pixelated|optimizeSpeed|optimizeQuality|<-non-standard-image-rendering>",
        "image-resolution": "[from-image||<resolution>]&&snap?",
        "ime-mode": "auto|normal|active|inactive|disabled",
        "initial-letter": "normal|[<number> <integer>?]",
        "initial-letter-align": "[auto|alphabetic|hanging|ideographic]",
        "inline-size": "<'width'>",
        "inset": "<'top'>{1,4}",
        "inset-block": "<'top'>{1,2}",
        "inset-block-end": "<'top'>",
        "inset-block-start": "<'top'>",
        "inset-inline": "<'top'>{1,2}",
        "inset-inline-end": "<'top'>",
        "inset-inline-start": "<'top'>",
        "isolation": "auto|isolate",
        "justify-content": "normal|<content-distribution>|<overflow-position>? [<content-position>|left|right]",
        "justify-items": "normal|stretch|<baseline-position>|<overflow-position>? [<self-position>|left|right]|legacy|legacy&&[left|right|center]",
        "justify-self": "auto|normal|stretch|<baseline-position>|<overflow-position>? [<self-position>|left|right]",
        "justify-tracks": "[normal|<content-distribution>|<overflow-position>? [<content-position>|left|right]]#",
        "left": "<length>|<percentage>|auto",
        "letter-spacing": "normal|<length-percentage>",
        "line-break": "auto|loose|normal|strict|anywhere",
        "line-clamp": "none|<integer>",
        "line-height": "normal|<number>|<length>|<percentage>",
        "line-height-step": "<length>",
        "list-style": "<'list-style-type'>||<'list-style-position'>||<'list-style-image'>",
        "list-style-image": "<image>|none",
        "list-style-position": "inside|outside",
        "list-style-type": "<counter-style>|<string>|none",
        "margin": "[<length>|<percentage>|auto]{1,4}",
        "margin-block": "<'margin-left'>{1,2}",
        "margin-block-end": "<'margin-left'>",
        "margin-block-start": "<'margin-left'>",
        "margin-bottom": "<length>|<percentage>|auto",
        "margin-inline": "<'margin-left'>{1,2}",
        "margin-inline-end": "<'margin-left'>",
        "margin-inline-start": "<'margin-left'>",
        "margin-left": "<length>|<percentage>|auto",
        "margin-right": "<length>|<percentage>|auto",
        "margin-top": "<length>|<percentage>|auto",
        "margin-trim": "none|in-flow|all",
        "mask": "<mask-layer>#",
        "mask-border": "<'mask-border-source'>||<'mask-border-slice'> [/ <'mask-border-width'>? [/ <'mask-border-outset'>]?]?||<'mask-border-repeat'>||<'mask-border-mode'>",
        "mask-border-mode": "luminance|alpha",
        "mask-border-outset": "[<length>|<number>]{1,4}",
        "mask-border-repeat": "[stretch|repeat|round|space]{1,2}",
        "mask-border-slice": "<number-percentage>{1,4} fill?",
        "mask-border-source": "none|<image>",
        "mask-border-width": "[<length-percentage>|<number>|auto]{1,4}",
        "mask-clip": "[<geometry-box>|no-clip]#",
        "mask-composite": "<compositing-operator>#",
        "mask-image": "<mask-reference>#",
        "mask-mode": "<masking-mode>#",
        "mask-origin": "<geometry-box>#",
        "mask-position": "<position>#",
        "mask-repeat": "<repeat-style>#",
        "mask-size": "<bg-size>#",
        "mask-type": "luminance|alpha",
        "masonry-auto-flow": "[pack|next]||[definite-first|ordered]",
        "math-style": "normal|compact",
        "max-block-size": "<'max-width'>",
        "max-height": "none|<length-percentage>|min-content|max-content|fit-content|fit-content( <length-percentage> )",
        "max-inline-size": "<'max-width'>",
        "max-lines": "none|<integer>",
        "max-width": "none|<length-percentage>|min-content|max-content|fit-content|fit-content( <length-percentage> )|<-non-standard-width>",
        "min-block-size": "<'min-width'>",
        "min-height": "auto|<length>|<percentage>|min-content|max-content|fit-content|fit-content( <length-percentage> )",
        "min-inline-size": "<'min-width'>",
        "min-width": "auto|<length>|<percentage>|min-content|max-content|fit-content|fit-content( <length-percentage> )|<-non-standard-width>",
        "mix-blend-mode": "<blend-mode>",
        "object-fit": "fill|contain|cover|none|scale-down",
        "object-position": "<position>",
        "offset": "[<'offset-position'>? [<'offset-path'> [<'offset-distance'>||<'offset-rotate'>]?]?]! [/ <'offset-anchor'>]?",
        "offset-anchor": "auto|<position>",
        "offset-distance": "<length-percentage>",
        "offset-path": "none|ray( [<angle>&&<size>&&contain?] )|<path()>|<url>|[<basic-shape>||<geometry-box>]",
        "offset-position": "auto|<position>",
        "offset-rotate": "[auto|reverse]||<angle>",
        "opacity": "<alpha-value>",
        "order": "<integer>",
        "orphans": "<integer>",
        "outline": "[<'outline-color'>||<'outline-style'>||<'outline-width'>]",
        "outline-color": "<color>|invert",
        "outline-offset": "<length>",
        "outline-style": "auto|<'border-style'>",
        "outline-width": "<line-width>",
        "overflow": "[visible|hidden|clip|scroll|auto]{1,2}|<-non-standard-overflow>",
        "overflow-anchor": "auto|none",
        "overflow-block": "visible|hidden|clip|scroll|auto",
        "overflow-clip-box": "padding-box|content-box",
        "overflow-clip-margin": "<visual-box>||<length [0,\u221E]>",
        "overflow-inline": "visible|hidden|clip|scroll|auto",
        "overflow-wrap": "normal|break-word|anywhere",
        "overflow-x": "visible|hidden|clip|scroll|auto",
        "overflow-y": "visible|hidden|clip|scroll|auto",
        "overscroll-behavior": "[contain|none|auto]{1,2}",
        "overscroll-behavior-block": "contain|none|auto",
        "overscroll-behavior-inline": "contain|none|auto",
        "overscroll-behavior-x": "contain|none|auto",
        "overscroll-behavior-y": "contain|none|auto",
        "padding": "[<length>|<percentage>]{1,4}",
        "padding-block": "<'padding-left'>{1,2}",
        "padding-block-end": "<'padding-left'>",
        "padding-block-start": "<'padding-left'>",
        "padding-bottom": "<length>|<percentage>",
        "padding-inline": "<'padding-left'>{1,2}",
        "padding-inline-end": "<'padding-left'>",
        "padding-inline-start": "<'padding-left'>",
        "padding-left": "<length>|<percentage>",
        "padding-right": "<length>|<percentage>",
        "padding-top": "<length>|<percentage>",
        "page-break-after": "auto|always|avoid|left|right|recto|verso",
        "page-break-before": "auto|always|avoid|left|right|recto|verso",
        "page-break-inside": "auto|avoid",
        "paint-order": "normal|[fill||stroke||markers]",
        "perspective": "none|<length>",
        "perspective-origin": "<position>",
        "place-content": "<'align-content'> <'justify-content'>?",
        "place-items": "<'align-items'> <'justify-items'>?",
        "place-self": "<'align-self'> <'justify-self'>?",
        "pointer-events": "auto|none|visiblePainted|visibleFill|visibleStroke|visible|painted|fill|stroke|all|inherit",
        "position": "static|relative|absolute|sticky|fixed|-webkit-sticky",
        "quotes": "none|auto|[<string> <string>]+",
        "resize": "none|both|horizontal|vertical|block|inline",
        "right": "<length>|<percentage>|auto",
        "rotate": "none|<angle>|[x|y|z|<number>{3}]&&<angle>",
        "row-gap": "normal|<length-percentage>",
        "ruby-align": "start|center|space-between|space-around",
        "ruby-merge": "separate|collapse|auto",
        "ruby-position": "[alternate||[over|under]]|inter-character",
        "scale": "none|<number>{1,3}",
        "scrollbar-color": "auto|<color>{2}",
        "scrollbar-gutter": "auto|stable&&both-edges?",
        "scrollbar-width": "auto|thin|none",
        "scroll-behavior": "auto|smooth",
        "scroll-margin": "<length>{1,4}",
        "scroll-margin-block": "<length>{1,2}",
        "scroll-margin-block-start": "<length>",
        "scroll-margin-block-end": "<length>",
        "scroll-margin-bottom": "<length>",
        "scroll-margin-inline": "<length>{1,2}",
        "scroll-margin-inline-start": "<length>",
        "scroll-margin-inline-end": "<length>",
        "scroll-margin-left": "<length>",
        "scroll-margin-right": "<length>",
        "scroll-margin-top": "<length>",
        "scroll-padding": "[auto|<length-percentage>]{1,4}",
        "scroll-padding-block": "[auto|<length-percentage>]{1,2}",
        "scroll-padding-block-start": "auto|<length-percentage>",
        "scroll-padding-block-end": "auto|<length-percentage>",
        "scroll-padding-bottom": "auto|<length-percentage>",
        "scroll-padding-inline": "[auto|<length-percentage>]{1,2}",
        "scroll-padding-inline-start": "auto|<length-percentage>",
        "scroll-padding-inline-end": "auto|<length-percentage>",
        "scroll-padding-left": "auto|<length-percentage>",
        "scroll-padding-right": "auto|<length-percentage>",
        "scroll-padding-top": "auto|<length-percentage>",
        "scroll-snap-align": "[none|start|end|center]{1,2}",
        "scroll-snap-coordinate": "none|<position>#",
        "scroll-snap-destination": "<position>",
        "scroll-snap-points-x": "none|repeat( <length-percentage> )",
        "scroll-snap-points-y": "none|repeat( <length-percentage> )",
        "scroll-snap-stop": "normal|always",
        "scroll-snap-type": "none|[x|y|block|inline|both] [mandatory|proximity]?",
        "scroll-snap-type-x": "none|mandatory|proximity",
        "scroll-snap-type-y": "none|mandatory|proximity",
        "shape-image-threshold": "<alpha-value>",
        "shape-margin": "<length-percentage>",
        "shape-outside": "none|[<shape-box>||<basic-shape>]|<image>",
        "tab-size": "<integer>|<length>",
        "table-layout": "auto|fixed",
        "text-align": "start|end|left|right|center|justify|match-parent",
        "text-align-last": "auto|start|end|left|right|center|justify",
        "text-combine-upright": "none|all|[digits <integer>?]",
        "text-decoration": "<'text-decoration-line'>||<'text-decoration-style'>||<'text-decoration-color'>||<'text-decoration-thickness'>",
        "text-decoration-color": "<color>",
        "text-decoration-line": "none|[underline||overline||line-through||blink]|spelling-error|grammar-error",
        "text-decoration-skip": "none|[objects||[spaces|[leading-spaces||trailing-spaces]]||edges||box-decoration]",
        "text-decoration-skip-ink": "auto|all|none",
        "text-decoration-style": "solid|double|dotted|dashed|wavy",
        "text-decoration-thickness": "auto|from-font|<length>|<percentage>",
        "text-emphasis": "<'text-emphasis-style'>||<'text-emphasis-color'>",
        "text-emphasis-color": "<color>",
        "text-emphasis-position": "[over|under]&&[right|left]",
        "text-emphasis-style": "none|[[filled|open]||[dot|circle|double-circle|triangle|sesame]]|<string>",
        "text-indent": "<length-percentage>&&hanging?&&each-line?",
        "text-justify": "auto|inter-character|inter-word|none",
        "text-orientation": "mixed|upright|sideways",
        "text-overflow": "[clip|ellipsis|<string>]{1,2}",
        "text-rendering": "auto|optimizeSpeed|optimizeLegibility|geometricPrecision",
        "text-shadow": "none|<shadow-t>#",
        "text-size-adjust": "none|auto|<percentage>",
        "text-transform": "none|capitalize|uppercase|lowercase|full-width|full-size-kana",
        "text-underline-offset": "auto|<length>|<percentage>",
        "text-underline-position": "auto|from-font|[under||[left|right]]",
        "top": "<length>|<percentage>|auto",
        "touch-action": "auto|none|[[pan-x|pan-left|pan-right]||[pan-y|pan-up|pan-down]||pinch-zoom]|manipulation",
        "transform": "none|<transform-list>",
        "transform-box": "content-box|border-box|fill-box|stroke-box|view-box",
        "transform-origin": "[<length-percentage>|left|center|right|top|bottom]|[[<length-percentage>|left|center|right]&&[<length-percentage>|top|center|bottom]] <length>?",
        "transform-style": "flat|preserve-3d",
        "transition": "<single-transition>#",
        "transition-delay": "<time>#",
        "transition-duration": "<time>#",
        "transition-property": "none|<single-transition-property>#",
        "transition-timing-function": "<easing-function>#",
        "translate": "none|<length-percentage> [<length-percentage> <length>?]?",
        "unicode-bidi": "normal|embed|isolate|bidi-override|isolate-override|plaintext|-moz-isolate|-moz-isolate-override|-moz-plaintext|-webkit-isolate|-webkit-isolate-override|-webkit-plaintext",
        "user-select": "auto|text|none|contain|all",
        "vertical-align": "baseline|sub|super|text-top|text-bottom|middle|top|bottom|<percentage>|<length>",
        "visibility": "visible|hidden|collapse",
        "white-space": "normal|pre|nowrap|pre-wrap|pre-line|break-spaces",
        "widows": "<integer>",
        "width": "auto|<length>|<percentage>|min-content|max-content|fit-content|fit-content( <length-percentage> )|fill|stretch|intrinsic|-moz-max-content|-webkit-max-content|-moz-fit-content|-webkit-fit-content",
        "will-change": "auto|<animateable-feature>#",
        "word-break": "normal|break-all|keep-all|break-word",
        "word-spacing": "normal|<length>",
        "word-wrap": "normal|break-word",
        "writing-mode": "horizontal-tb|vertical-rl|vertical-lr|sideways-rl|sideways-lr|<svg-writing-mode>",
        "z-index": "auto|<integer>",
        "zoom": "normal|reset|<number>|<percentage>",
        "-moz-background-clip": "padding|border",
        "-moz-border-radius-bottomleft": "<'border-bottom-left-radius'>",
        "-moz-border-radius-bottomright": "<'border-bottom-right-radius'>",
        "-moz-border-radius-topleft": "<'border-top-left-radius'>",
        "-moz-border-radius-topright": "<'border-bottom-right-radius'>",
        "-moz-control-character-visibility": "visible|hidden",
        "-moz-osx-font-smoothing": "auto|grayscale",
        "-moz-user-select": "none|text|all|-moz-none",
        "-ms-flex-align": "start|end|center|baseline|stretch",
        "-ms-flex-item-align": "auto|start|end|center|baseline|stretch",
        "-ms-flex-line-pack": "start|end|center|justify|distribute|stretch",
        "-ms-flex-negative": "<'flex-shrink'>",
        "-ms-flex-pack": "start|end|center|justify|distribute",
        "-ms-flex-order": "<integer>",
        "-ms-flex-positive": "<'flex-grow'>",
        "-ms-flex-preferred-size": "<'flex-basis'>",
        "-ms-interpolation-mode": "nearest-neighbor|bicubic",
        "-ms-grid-column-align": "start|end|center|stretch",
        "-ms-grid-row-align": "start|end|center|stretch",
        "-ms-hyphenate-limit-last": "none|always|column|page|spread",
        "-webkit-background-clip": "[<box>|border|padding|content|text]#",
        "-webkit-column-break-after": "always|auto|avoid",
        "-webkit-column-break-before": "always|auto|avoid",
        "-webkit-column-break-inside": "always|auto|avoid",
        "-webkit-font-smoothing": "auto|none|antialiased|subpixel-antialiased",
        "-webkit-mask-box-image": "[<url>|<gradient>|none] [<length-percentage>{4} <-webkit-mask-box-repeat>{2}]?",
        "-webkit-print-color-adjust": "economy|exact",
        "-webkit-text-security": "none|circle|disc|square",
        "-webkit-user-drag": "none|element|auto",
        "-webkit-user-select": "auto|none|text|all",
        "alignment-baseline": "auto|baseline|before-edge|text-before-edge|middle|central|after-edge|text-after-edge|ideographic|alphabetic|hanging|mathematical",
        "baseline-shift": "baseline|sub|super|<svg-length>",
        "behavior": "<url>+",
        "clip-rule": "nonzero|evenodd",
        "cue": "<'cue-before'> <'cue-after'>?",
        "cue-after": "<url> <decibel>?|none",
        "cue-before": "<url> <decibel>?|none",
        "dominant-baseline": "auto|use-script|no-change|reset-size|ideographic|alphabetic|hanging|mathematical|central|middle|text-after-edge|text-before-edge",
        "fill": "<paint>",
        "fill-opacity": "<number-zero-one>",
        "fill-rule": "nonzero|evenodd",
        "glyph-orientation-horizontal": "<angle>",
        "glyph-orientation-vertical": "<angle>",
        "kerning": "auto|<svg-length>",
        "marker": "none|<url>",
        "marker-end": "none|<url>",
        "marker-mid": "none|<url>",
        "marker-start": "none|<url>",
        "pause": "<'pause-before'> <'pause-after'>?",
        "pause-after": "<time>|none|x-weak|weak|medium|strong|x-strong",
        "pause-before": "<time>|none|x-weak|weak|medium|strong|x-strong",
        "rest": "<'rest-before'> <'rest-after'>?",
        "rest-after": "<time>|none|x-weak|weak|medium|strong|x-strong",
        "rest-before": "<time>|none|x-weak|weak|medium|strong|x-strong",
        "shape-rendering": "auto|optimizeSpeed|crispEdges|geometricPrecision",
        "src": "[<url> [format( <string># )]?|local( <family-name> )]#",
        "speak": "auto|none|normal",
        "speak-as": "normal|spell-out||digits||[literal-punctuation|no-punctuation]",
        "stroke": "<paint>",
        "stroke-dasharray": "none|[<svg-length>+]#",
        "stroke-dashoffset": "<svg-length>",
        "stroke-linecap": "butt|round|square",
        "stroke-linejoin": "miter|round|bevel",
        "stroke-miterlimit": "<number-one-or-greater>",
        "stroke-opacity": "<number-zero-one>",
        "stroke-width": "<svg-length>",
        "text-anchor": "start|middle|end",
        "unicode-range": "<urange>#",
        "voice-balance": "<number>|left|center|right|leftwards|rightwards",
        "voice-duration": "auto|<time>",
        "voice-family": "[[<family-name>|<generic-voice>] ,]* [<family-name>|<generic-voice>]|preserve",
        "voice-pitch": "<frequency>&&absolute|[[x-low|low|medium|high|x-high]||[<frequency>|<semitones>|<percentage>]]",
        "voice-range": "<frequency>&&absolute|[[x-low|low|medium|high|x-high]||[<frequency>|<semitones>|<percentage>]]",
        "voice-rate": "[normal|x-slow|slow|medium|fast|x-fast]||<percentage>",
        "voice-stress": "normal|strong|moderate|none|reduced",
        "voice-volume": "silent|[[x-soft|soft|medium|loud|x-loud]||<decibel>]"
    },
    "atrules": {
        "charset": {
            "prelude": "<string>",
            "descriptors": null
        },
        "counter-style": {
            "prelude": "<counter-style-name>",
            "descriptors": {
                "additive-symbols": "[<integer>&&<symbol>]#",
                "fallback": "<counter-style-name>",
                "negative": "<symbol> <symbol>?",
                "pad": "<integer>&&<symbol>",
                "prefix": "<symbol>",
                "range": "[[<integer>|infinite]{2}]#|auto",
                "speak-as": "auto|bullets|numbers|words|spell-out|<counter-style-name>",
                "suffix": "<symbol>",
                "symbols": "<symbol>+",
                "system": "cyclic|numeric|alphabetic|symbolic|additive|[fixed <integer>?]|[extends <counter-style-name>]"
            }
        },
        "document": {
            "prelude": "[<url>|url-prefix( <string> )|domain( <string> )|media-document( <string> )|regexp( <string> )]#",
            "descriptors": null
        },
        "font-face": {
            "prelude": null,
            "descriptors": {
                "ascent-override": "normal|<percentage>",
                "descent-override": "normal|<percentage>",
                "font-display": "[auto|block|swap|fallback|optional]",
                "font-family": "<family-name>",
                "font-feature-settings": "normal|<feature-tag-value>#",
                "font-variation-settings": "normal|[<string> <number>]#",
                "font-stretch": "<font-stretch-absolute>{1,2}",
                "font-style": "normal|italic|oblique <angle>{0,2}",
                "font-weight": "<font-weight-absolute>{1,2}",
                "font-variant": "normal|none|[<common-lig-values>||<discretionary-lig-values>||<historical-lig-values>||<contextual-alt-values>||stylistic( <feature-value-name> )||historical-forms||styleset( <feature-value-name># )||character-variant( <feature-value-name># )||swash( <feature-value-name> )||ornaments( <feature-value-name> )||annotation( <feature-value-name> )||[small-caps|all-small-caps|petite-caps|all-petite-caps|unicase|titling-caps]||<numeric-figure-values>||<numeric-spacing-values>||<numeric-fraction-values>||ordinal||slashed-zero||<east-asian-variant-values>||<east-asian-width-values>||ruby]",
                "line-gap-override": "normal|<percentage>",
                "size-adjust": "<percentage>",
                "src": "[<url> [format( <string># )]?|local( <family-name> )]#",
                "unicode-range": "<urange>#"
            }
        },
        "font-feature-values": {
            "prelude": "<family-name>#",
            "descriptors": null
        },
        "import": {
            "prelude": "[<string>|<url>] [<media-query-list>]?",
            "descriptors": null
        },
        "keyframes": {
            "prelude": "<keyframes-name>",
            "descriptors": null
        },
        "media": {
            "prelude": "<media-query-list>",
            "descriptors": null
        },
        "namespace": {
            "prelude": "<namespace-prefix>? [<string>|<url>]",
            "descriptors": null
        },
        "page": {
            "prelude": "<page-selector-list>",
            "descriptors": {
                "bleed": "auto|<length>",
                "marks": "none|[crop||cross]",
                "size": "<length>{1,2}|auto|[<page-size>||[portrait|landscape]]"
            }
        },
        "property": {
            "prelude": "<custom-property-name>",
            "descriptors": {
                "syntax": "<string>",
                "inherits": "true|false",
                "initial-value": "<string>"
            }
        },
        "supports": {
            "prelude": "<supports-condition>",
            "descriptors": null
        },
        "viewport": {
            "prelude": null,
            "descriptors": {
                "height": "<viewport-length>{1,2}",
                "max-height": "<viewport-length>",
                "max-width": "<viewport-length>",
                "max-zoom": "auto|<number>|<percentage>",
                "min-height": "<viewport-length>",
                "min-width": "<viewport-length>",
                "min-zoom": "auto|<number>|<percentage>",
                "orientation": "auto|portrait|landscape",
                "user-zoom": "zoom|fixed",
                "viewport-fit": "auto|contain|cover",
                "width": "<viewport-length>{1,2}",
                "zoom": "auto|<number>|<percentage>"
            }
        }
    }
};

// lib/syntax/node/index.js
var node_exports = {};
__export(node_exports, {
    AnPlusB: () => AnPlusB_exports,
    Atrule: () => Atrule_exports,
    AtrulePrelude: () => AtrulePrelude_exports,
    AttributeSelector: () => AttributeSelector_exports,
    Block: () => Block_exports,
    Brackets: () => Brackets_exports,
    CDC: () => CDC_exports,
    CDO: () => CDO_exports,
    ClassSelector: () => ClassSelector_exports,
    Combinator: () => Combinator_exports,
    Comment: () => Comment_exports,
    Declaration: () => Declaration_exports,
    DeclarationList: () => DeclarationList_exports,
    Dimension: () => Dimension_exports,
    Function: () => Function_exports,
    Hash: () => Hash_exports,
    IdSelector: () => IdSelector_exports,
    Identifier: () => Identifier_exports,
    MediaFeature: () => MediaFeature_exports,
    MediaQuery: () => MediaQuery_exports,
    MediaQueryList: () => MediaQueryList_exports,
    Nth: () => Nth_exports,
    Number: () => Number_exports,
    Operator: () => Operator_exports,
    Parentheses: () => Parentheses_exports,
    Percentage: () => Percentage_exports,
    PseudoClassSelector: () => PseudoClassSelector_exports,
    PseudoElementSelector: () => PseudoElementSelector_exports,
    Ratio: () => Ratio_exports,
    Raw: () => Raw_exports,
    Rule: () => Rule_exports,
    Selector: () => Selector_exports,
    SelectorList: () => SelectorList_exports,
    String: () => String_exports,
    StyleSheet: () => StyleSheet_exports,
    TypeSelector: () => TypeSelector_exports,
    UnicodeRange: () => UnicodeRange_exports,
    Url: () => Url_exports,
    Value: () => Value_exports,
    WhiteSpace: () => WhiteSpace_exports
});

// lib/syntax/node/AnPlusB.js
var AnPlusB_exports = {};
__export(AnPlusB_exports, {
    generate: () => generate2,
    name: () => name,
    parse: () => parse2,
    structure: () => structure
});
var PLUSSIGN5 = 43;
var HYPHENMINUS5 = 45;
var N5 = 110;
var DISALLOW_SIGN2 = true;
var ALLOW_SIGN2 = false;
function checkInteger2(offset, disallowSign) {
    let pos = this.tokenStart + offset;
    const code2 = this.charCodeAt(pos);
    if (code2 === PLUSSIGN5 || code2 === HYPHENMINUS5) {
        if (disallowSign) {
            this.error("Number sign is not allowed");
        }
        pos++;
    }
    for (; pos < this.tokenEnd; pos++) {
        if (!isDigit(this.charCodeAt(pos))) {
            this.error("Integer is expected", pos);
        }
    }
}
function checkTokenIsInteger(disallowSign) {
    return checkInteger2.call(this, 0, disallowSign);
}
function expectCharCode(offset, code2) {
    if (!this.cmpChar(this.tokenStart + offset, code2)) {
        let msg = "";
        switch (code2) {
            case N5:
                msg = "N is expected";
                break;
            case HYPHENMINUS5:
                msg = "HyphenMinus is expected";
                break;
        }
        this.error(msg, this.tokenStart + offset);
    }
}
function consumeB2() {
    let offset = 0;
    let sign = 0;
    let type = this.tokenType;
    while (type === WhiteSpace || type === Comment) {
        type = this.lookupType(++offset);
    }
    if (type !== Number2) {
        if (this.isDelim(PLUSSIGN5, offset) || this.isDelim(HYPHENMINUS5, offset)) {
            sign = this.isDelim(PLUSSIGN5, offset) ? PLUSSIGN5 : HYPHENMINUS5;
            do {
                type = this.lookupType(++offset);
            } while (type === WhiteSpace || type === Comment);
            if (type !== Number2) {
                this.skip(offset);
                checkTokenIsInteger.call(this, DISALLOW_SIGN2);
            }
        } else {
            return null;
        }
    }
    if (offset > 0) {
        this.skip(offset);
    }
    if (sign === 0) {
        type = this.charCodeAt(this.tokenStart);
        if (type !== PLUSSIGN5 && type !== HYPHENMINUS5) {
            this.error("Number sign is expected");
        }
    }
    checkTokenIsInteger.call(this, sign !== 0);
    return sign === HYPHENMINUS5 ? "-" + this.consume(Number2) : this.consume(Number2);
}
var name = "AnPlusB";
var structure = {
    a: [String, null],
    b: [String, null]
};
function parse2() {
    const start = this.tokenStart;
    let a = null;
    let b = null;
    if (this.tokenType === Number2) {
        checkTokenIsInteger.call(this, ALLOW_SIGN2);
        b = this.consume(Number2);
    } else if (this.tokenType === Ident && this.cmpChar(this.tokenStart, HYPHENMINUS5)) {
        a = "-1";
        expectCharCode.call(this, 1, N5);
        switch (this.tokenEnd - this.tokenStart) {
            case 2:
                this.next();
                b = consumeB2.call(this);
                break;
            case 3:
                expectCharCode.call(this, 2, HYPHENMINUS5);
                this.next();
                this.skipSC();
                checkTokenIsInteger.call(this, DISALLOW_SIGN2);
                b = "-" + this.consume(Number2);
                break;
            default:
                expectCharCode.call(this, 2, HYPHENMINUS5);
                checkInteger2.call(this, 3, DISALLOW_SIGN2);
                this.next();
                b = this.substrToCursor(start + 2);
        }
    } else if (this.tokenType === Ident || this.isDelim(PLUSSIGN5) && this.lookupType(1) === Ident) {
        let sign = 0;
        a = "1";
        if (this.isDelim(PLUSSIGN5)) {
            sign = 1;
            this.next();
        }
        expectCharCode.call(this, 0, N5);
        switch (this.tokenEnd - this.tokenStart) {
            case 1:
                this.next();
                b = consumeB2.call(this);
                break;
            case 2:
                expectCharCode.call(this, 1, HYPHENMINUS5);
                this.next();
                this.skipSC();
                checkTokenIsInteger.call(this, DISALLOW_SIGN2);
                b = "-" + this.consume(Number2);
                break;
            default:
                expectCharCode.call(this, 1, HYPHENMINUS5);
                checkInteger2.call(this, 2, DISALLOW_SIGN2);
                this.next();
                b = this.substrToCursor(start + sign + 1);
        }
    } else if (this.tokenType === Dimension) {
        const code2 = this.charCodeAt(this.tokenStart);
        const sign = code2 === PLUSSIGN5 || code2 === HYPHENMINUS5;
        let i = this.tokenStart + sign;
        for (; i < this.tokenEnd; i++) {
            if (!isDigit(this.charCodeAt(i))) {
                break;
            }
        }
        if (i === this.tokenStart + sign) {
            this.error("Integer is expected", this.tokenStart + sign);
        }
        expectCharCode.call(this, i - this.tokenStart, N5);
        a = this.substring(start, i);
        if (i + 1 === this.tokenEnd) {
            this.next();
            b = consumeB2.call(this);
        } else {
            expectCharCode.call(this, i - this.tokenStart + 1, HYPHENMINUS5);
            if (i + 2 === this.tokenEnd) {
                this.next();
                this.skipSC();
                checkTokenIsInteger.call(this, DISALLOW_SIGN2);
                b = "-" + this.consume(Number2);
            } else {
                checkInteger2.call(this, i - this.tokenStart + 2, DISALLOW_SIGN2);
                this.next();
                b = this.substrToCursor(i + 1);
            }
        }
    } else {
        this.error();
    }
    if (a !== null && a.charCodeAt(0) === PLUSSIGN5) {
        a = a.substr(1);
    }
    if (b !== null && b.charCodeAt(0) === PLUSSIGN5) {
        b = b.substr(1);
    }
    return {
        type: "AnPlusB",
        loc: this.getLocation(start, this.tokenStart),
        a,
        b
    };
}
function generate2(node) {
    if (node.a) {
        const a = node.a === "+1" && "n" || node.a === "1" && "n" || node.a === "-1" && "-n" || node.a + "n";
        if (node.b) {
            const b = node.b[0] === "-" || node.b[0] === "+" ? node.b : "+" + node.b;
            this.tokenize(a + b);
        } else {
            this.tokenize(a);
        }
    } else {
        this.tokenize(node.b);
    }
}

// lib/syntax/node/Atrule.js
var Atrule_exports = {};
__export(Atrule_exports, {
    generate: () => generate3,
    name: () => name2,
    parse: () => parse3,
    structure: () => structure2,
    walkContext: () => walkContext
});
function consumeRaw(startToken) {
    return this.Raw(startToken, this.consumeUntilLeftCurlyBracketOrSemicolon, true);
}
function isDeclarationBlockAtrule() {
    for (let offset = 1, type; type = this.lookupType(offset); offset++) {
        if (type === RightCurlyBracket) {
            return true;
        }
        if (type === LeftCurlyBracket || type === AtKeyword) {
            return false;
        }
    }
    return false;
}
var name2 = "Atrule";
var walkContext = "atrule";
var structure2 = {
    name: String,
    prelude: ["AtrulePrelude", "Raw", null],
    block: ["Block", null]
};
function parse3() {
    const start = this.tokenStart;
    let name41;
    let nameLowerCase;
    let prelude = null;
    let block = null;
    this.eat(AtKeyword);
    name41 = this.substrToCursor(start + 1);
    nameLowerCase = name41.toLowerCase();
    this.skipSC();
    if (this.eof === false && this.tokenType !== LeftCurlyBracket && this.tokenType !== Semicolon) {
        if (this.parseAtrulePrelude) {
            prelude = this.parseWithFallback(this.AtrulePrelude.bind(this, name41), consumeRaw);
        } else {
            prelude = consumeRaw.call(this, this.tokenIndex);
        }
        this.skipSC();
    }
    switch (this.tokenType) {
        case Semicolon:
            this.next();
            break;
        case LeftCurlyBracket:
            if (hasOwnProperty.call(this.atrule, nameLowerCase) && typeof this.atrule[nameLowerCase].block === "function") {
                block = this.atrule[nameLowerCase].block.call(this);
            } else {
                block = this.Block(isDeclarationBlockAtrule.call(this));
            }
            break;
    }
    return {
        type: "Atrule",
        loc: this.getLocation(start, this.tokenStart),
        name: name41,
        prelude,
        block
    };
}
function generate3(node) {
    this.token(AtKeyword, "@" + node.name);
    if (node.prelude !== null) {
        this.node(node.prelude);
    }
    if (node.block) {
        this.node(node.block);
    } else {
        this.token(Semicolon, ";");
    }
}

// lib/syntax/node/AtrulePrelude.js
var AtrulePrelude_exports = {};
__export(AtrulePrelude_exports, {
    generate: () => generate4,
    name: () => name3,
    parse: () => parse4,
    structure: () => structure3,
    walkContext: () => walkContext2
});
var name3 = "AtrulePrelude";
var walkContext2 = "atrulePrelude";
var structure3 = {
    children: [[]]
};
function parse4(name41) {
    let children = null;
    if (name41 !== null) {
        name41 = name41.toLowerCase();
    }
    this.skipSC();
    if (hasOwnProperty.call(this.atrule, name41) && typeof this.atrule[name41].prelude === "function") {
        children = this.atrule[name41].prelude.call(this);
    } else {
        children = this.readSequence(this.scope.AtrulePrelude);
    }
    this.skipSC();
    if (this.eof !== true && this.tokenType !== LeftCurlyBracket && this.tokenType !== Semicolon) {
        this.error("Semicolon or block is expected");
    }
    return {
        type: "AtrulePrelude",
        loc: this.getLocationFromList(children),
        children
    };
}
function generate4(node) {
    this.children(node);
}

// lib/syntax/node/AttributeSelector.js
var AttributeSelector_exports = {};
__export(AttributeSelector_exports, {
    generate: () => generate5,
    name: () => name4,
    parse: () => parse5,
    structure: () => structure4
});
var DOLLARSIGN = 36;
var ASTERISK2 = 42;
var EQUALSSIGN = 61;
var CIRCUMFLEXACCENT = 94;
var VERTICALLINE2 = 124;
var TILDE = 126;
function getAttributeName() {
    if (this.eof) {
        this.error("Unexpected end of input");
    }
    const start = this.tokenStart;
    let expectIdent = false;
    if (this.isDelim(ASTERISK2)) {
        expectIdent = true;
        this.next();
    } else if (!this.isDelim(VERTICALLINE2)) {
        this.eat(Ident);
    }
    if (this.isDelim(VERTICALLINE2)) {
        if (this.charCodeAt(this.tokenStart + 1) !== EQUALSSIGN) {
            this.next();
            this.eat(Ident);
        } else if (expectIdent) {
            this.error("Identifier is expected", this.tokenEnd);
        }
    } else if (expectIdent) {
        this.error("Vertical line is expected");
    }
    return {
        type: "Identifier",
        loc: this.getLocation(start, this.tokenStart),
        name: this.substrToCursor(start)
    };
}
function getOperator() {
    const start = this.tokenStart;
    const code2 = this.charCodeAt(start);
    if (code2 !== EQUALSSIGN && code2 !== TILDE && code2 !== CIRCUMFLEXACCENT && code2 !== DOLLARSIGN && code2 !== ASTERISK2 && code2 !== VERTICALLINE2) {
        this.error("Attribute selector (=, ~=, ^=, $=, *=, |=) is expected");
    }
    this.next();
    if (code2 !== EQUALSSIGN) {
        if (!this.isDelim(EQUALSSIGN)) {
            this.error("Equal sign is expected");
        }
        this.next();
    }
    return this.substrToCursor(start);
}
var name4 = "AttributeSelector";
var structure4 = {
    name: "Identifier",
    matcher: [String, null],
    value: ["String", "Identifier", null],
    flags: [String, null]
};
function parse5() {
    const start = this.tokenStart;
    let name41;
    let matcher = null;
    let value = null;
    let flags = null;
    this.eat(LeftSquareBracket);
    this.skipSC();
    name41 = getAttributeName.call(this);
    this.skipSC();
    if (this.tokenType !== RightSquareBracket) {
        if (this.tokenType !== Ident) {
            matcher = getOperator.call(this);
            this.skipSC();
            value = this.tokenType === String2 ? this.String() : this.Identifier();
            this.skipSC();
        }
        if (this.tokenType === Ident) {
            flags = this.consume(Ident);
            this.skipSC();
        }
    }
    this.eat(RightSquareBracket);
    return {
        type: "AttributeSelector",
        loc: this.getLocation(start, this.tokenStart),
        name: name41,
        matcher,
        value,
        flags
    };
}
function generate5(node) {
    this.token(Delim, "[");
    this.node(node.name);
    if (node.matcher !== null) {
        this.tokenize(node.matcher);
        this.node(node.value);
    }
    if (node.flags !== null) {
        this.token(Ident, node.flags);
    }
    this.token(Delim, "]");
}

// lib/syntax/node/Block.js
var Block_exports = {};
__export(Block_exports, {
    generate: () => generate6,
    name: () => name5,
    parse: () => parse6,
    structure: () => structure5,
    walkContext: () => walkContext3
});
function consumeRaw2(startToken) {
    return this.Raw(startToken, null, true);
}
function consumeRule() {
    return this.parseWithFallback(this.Rule, consumeRaw2);
}
function consumeRawDeclaration(startToken) {
    return this.Raw(startToken, this.consumeUntilSemicolonIncluded, true);
}
function consumeDeclaration() {
    if (this.tokenType === Semicolon) {
        return consumeRawDeclaration.call(this, this.tokenIndex);
    }
    const node = this.parseWithFallback(this.Declaration, consumeRawDeclaration);
    if (this.tokenType === Semicolon) {
        this.next();
    }
    return node;
}
var name5 = "Block";
var walkContext3 = "block";
var structure5 = {
    children: [[
        "Atrule",
        "Rule",
        "Declaration"
    ]]
};
function parse6(isDeclaration) {
    const consumer = isDeclaration ? consumeDeclaration : consumeRule;
    const start = this.tokenStart;
    let children = this.createList();
    this.eat(LeftCurlyBracket);
    scan:
    while (!this.eof) {
        switch (this.tokenType) {
            case RightCurlyBracket:
                break scan;
            case WhiteSpace:
            case Comment:
                this.next();
                break;
            case AtKeyword:
                children.push(this.parseWithFallback(this.Atrule, consumeRaw2));
                break;
            default:
                children.push(consumer.call(this));
        }
    }
    if (!this.eof) {
        this.eat(RightCurlyBracket);
    }
    return {
        type: "Block",
        loc: this.getLocation(start, this.tokenStart),
        children
    };
}
function generate6(node) {
    this.token(LeftCurlyBracket, "{");
    this.children(node, (prev) => {
        if (prev.type === "Declaration") {
            this.token(Semicolon, ";");
        }
    });
    this.token(RightCurlyBracket, "}");
}

// lib/syntax/node/Brackets.js
var Brackets_exports = {};
__export(Brackets_exports, {
    generate: () => generate7,
    name: () => name6,
    parse: () => parse7,
    structure: () => structure6
});
var name6 = "Brackets";
var structure6 = {
    children: [[]]
};
function parse7(readSequence3, recognizer) {
    const start = this.tokenStart;
    let children = null;
    this.eat(LeftSquareBracket);
    children = readSequence3.call(this, recognizer);
    if (!this.eof) {
        this.eat(RightSquareBracket);
    }
    return {
        type: "Brackets",
        loc: this.getLocation(start, this.tokenStart),
        children
    };
}
function generate7(node) {
    this.token(Delim, "[");
    this.children(node);
    this.token(Delim, "]");
}

// lib/syntax/node/CDC.js
var CDC_exports = {};
__export(CDC_exports, {
    generate: () => generate8,
    name: () => name7,
    parse: () => parse8,
    structure: () => structure7
});
var name7 = "CDC";
var structure7 = [];
function parse8() {
    const start = this.tokenStart;
    this.eat(CDC);
    return {
        type: "CDC",
        loc: this.getLocation(start, this.tokenStart)
    };
}
function generate8() {
    this.token(CDC, "-->");
}

// lib/syntax/node/CDO.js
var CDO_exports = {};
__export(CDO_exports, {
    generate: () => generate9,
    name: () => name8,
    parse: () => parse9,
    structure: () => structure8
});
var name8 = "CDO";
var structure8 = [];
function parse9() {
    const start = this.tokenStart;
    this.eat(CDO);
    return {
        type: "CDO",
        loc: this.getLocation(start, this.tokenStart)
    };
}
function generate9() {
    this.token(CDO, "<!--");
}

// lib/syntax/node/ClassSelector.js
var ClassSelector_exports = {};
__export(ClassSelector_exports, {
    generate: () => generate10,
    name: () => name9,
    parse: () => parse10,
    structure: () => structure9
});
var FULLSTOP = 46;
var name9 = "ClassSelector";
var structure9 = {
    name: String
};
function parse10() {
    this.eatDelim(FULLSTOP);
    return {
        type: "ClassSelector",
        loc: this.getLocation(this.tokenStart - 1, this.tokenEnd),
        name: this.consume(Ident)
    };
}
function generate10(node) {
    this.token(Delim, ".");
    this.token(Ident, node.name);
}

// lib/syntax/node/Combinator.js
var Combinator_exports = {};
__export(Combinator_exports, {
    generate: () => generate11,
    name: () => name10,
    parse: () => parse11,
    structure: () => structure10
});
var PLUSSIGN6 = 43;
var SOLIDUS = 47;
var GREATERTHANSIGN2 = 62;
var TILDE2 = 126;
var name10 = "Combinator";
var structure10 = {
    name: String
};
function parse11() {
    const start = this.tokenStart;
    let name41;
    switch (this.tokenType) {
        case WhiteSpace:
            name41 = " ";
            break;
        case Delim:
            switch (this.charCodeAt(this.tokenStart)) {
                case GREATERTHANSIGN2:
                case PLUSSIGN6:
                case TILDE2:
                    this.next();
                    break;
                case SOLIDUS:
                    this.next();
                    this.eatIdent("deep");
                    this.eatDelim(SOLIDUS);
                    break;
                default:
                    this.error("Combinator is expected");
            }
            name41 = this.substrToCursor(start);
            break;
    }
    return {
        type: "Combinator",
        loc: this.getLocation(start, this.tokenStart),
        name: name41
    };
}
function generate11(node) {
    this.tokenize(node.name);
}

// lib/syntax/node/Comment.js
var Comment_exports = {};
__export(Comment_exports, {
    generate: () => generate12,
    name: () => name11,
    parse: () => parse12,
    structure: () => structure11
});
var ASTERISK3 = 42;
var SOLIDUS2 = 47;
var name11 = "Comment";
var structure11 = {
    value: String
};
function parse12() {
    const start = this.tokenStart;
    let end = this.tokenEnd;
    this.eat(Comment);
    if (end - start + 2 >= 2 && this.charCodeAt(end - 2) === ASTERISK3 && this.charCodeAt(end - 1) === SOLIDUS2) {
        end -= 2;
    }
    return {
        type: "Comment",
        loc: this.getLocation(start, this.tokenStart),
        value: this.substring(start + 2, end)
    };
}
function generate12(node) {
    this.token(Comment, "/*" + node.value + "*/");
}

// lib/syntax/node/Declaration.js
var Declaration_exports = {};
__export(Declaration_exports, {
    generate: () => generate13,
    name: () => name12,
    parse: () => parse13,
    structure: () => structure12,
    walkContext: () => walkContext4
});
var EXCLAMATIONMARK3 = 33;
var NUMBERSIGN3 = 35;
var DOLLARSIGN2 = 36;
var AMPERSAND2 = 38;
var ASTERISK4 = 42;
var PLUSSIGN7 = 43;
var SOLIDUS3 = 47;
function consumeValueRaw(startToken) {
    return this.Raw(startToken, this.consumeUntilExclamationMarkOrSemicolon, true);
}
function consumeCustomPropertyRaw(startToken) {
    return this.Raw(startToken, this.consumeUntilExclamationMarkOrSemicolon, false);
}
function consumeValue() {
    const startValueToken = this.tokenIndex;
    const value = this.Value();
    if (value.type !== "Raw" && this.eof === false && this.tokenType !== Semicolon && this.isDelim(EXCLAMATIONMARK3) === false && this.isBalanceEdge(startValueToken) === false) {
        this.error();
    }
    return value;
}
var name12 = "Declaration";
var walkContext4 = "declaration";
var structure12 = {
    important: [Boolean, String],
    property: String,
    value: ["Value", "Raw"]
};
function parse13() {
    const start = this.tokenStart;
    const startToken = this.tokenIndex;
    const property2 = readProperty2.call(this);
    const customProperty = isCustomProperty(property2);
    const parseValue = customProperty ? this.parseCustomProperty : this.parseValue;
    const consumeRaw7 = customProperty ? consumeCustomPropertyRaw : consumeValueRaw;
    let important = false;
    let value;
    this.skipSC();
    this.eat(Colon);
    const valueStart = this.tokenIndex;
    if (!customProperty) {
        this.skipSC();
    }
    if (parseValue) {
        value = this.parseWithFallback(consumeValue, consumeRaw7);
    } else {
        value = consumeRaw7.call(this, this.tokenIndex);
    }
    if (customProperty && value.type === "Value" && value.children.isEmpty) {
        for (let offset = valueStart - this.tokenIndex; offset <= 0; offset++) {
            if (this.lookupType(offset) === WhiteSpace) {
                value.children.appendData({
                    type: "WhiteSpace",
                    loc: null,
                    value: " "
                });
                break;
            }
        }
    }
    if (this.isDelim(EXCLAMATIONMARK3)) {
        important = getImportant.call(this);
        this.skipSC();
    }
    if (this.eof === false && this.tokenType !== Semicolon && this.isBalanceEdge(startToken) === false) {
        this.error();
    }
    return {
        type: "Declaration",
        loc: this.getLocation(start, this.tokenStart),
        important,
        property: property2,
        value
    };
}
function generate13(node) {
    this.token(Ident, node.property);
    this.token(Colon, ":");
    this.node(node.value);
    if (node.important) {
        this.token(Delim, "!");
        this.token(Ident, node.important === true ? "important" : node.important);
    }
}
function readProperty2() {
    const start = this.tokenStart;
    if (this.tokenType === Delim) {
        switch (this.charCodeAt(this.tokenStart)) {
            case ASTERISK4:
            case DOLLARSIGN2:
            case PLUSSIGN7:
            case NUMBERSIGN3:
            case AMPERSAND2:
                this.next();
                break;
            case SOLIDUS3:
                this.next();
                if (this.isDelim(SOLIDUS3)) {
                    this.next();
                }
                break;
        }
    }
    if (this.tokenType === Hash) {
        this.eat(Hash);
    } else {
        this.eat(Ident);
    }
    return this.substrToCursor(start);
}
function getImportant() {
    this.eat(Delim);
    this.skipSC();
    const important = this.consume(Ident);
    return important === "important" ? true : important;
}

// lib/syntax/node/DeclarationList.js
var DeclarationList_exports = {};
__export(DeclarationList_exports, {
    generate: () => generate14,
    name: () => name13,
    parse: () => parse14,
    structure: () => structure13
});
function consumeRaw3(startToken) {
    return this.Raw(startToken, this.consumeUntilSemicolonIncluded, true);
}
var name13 = "DeclarationList";
var structure13 = {
    children: [[
        "Declaration"
    ]]
};
function parse14() {
    const children = this.createList();
    scan:
    while (!this.eof) {
        switch (this.tokenType) {
            case WhiteSpace:
            case Comment:
            case Semicolon:
                this.next();
                break;
            default:
                children.push(this.parseWithFallback(this.Declaration, consumeRaw3));
        }
    }
    return {
        type: "DeclarationList",
        loc: this.getLocationFromList(children),
        children
    };
}
function generate14(node) {
    this.children(node, (prev) => {
        if (prev.type === "Declaration") {
            this.token(Semicolon, ";");
        }
    });
}

// lib/syntax/node/Dimension.js
var Dimension_exports = {};
__export(Dimension_exports, {
    generate: () => generate15,
    name: () => name14,
    parse: () => parse15,
    structure: () => structure14
});
var name14 = "Dimension";
var structure14 = {
    value: String,
    unit: String
};
function parse15() {
    const start = this.tokenStart;
    const value = this.consumeNumber(Dimension);
    return {
        type: "Dimension",
        loc: this.getLocation(start, this.tokenStart),
        value,
        unit: this.substring(start + value.length, this.tokenStart)
    };
}
function generate15(node) {
    this.token(Dimension, node.value + node.unit);
}

// lib/syntax/node/Function.js
var Function_exports = {};
__export(Function_exports, {
    generate: () => generate16,
    name: () => name15,
    parse: () => parse16,
    structure: () => structure15,
    walkContext: () => walkContext5
});
var name15 = "Function";
var walkContext5 = "function";
var structure15 = {
    name: String,
    children: [[]]
};
function parse16(readSequence3, recognizer) {
    const start = this.tokenStart;
    const name41 = this.consumeFunctionName();
    const nameLowerCase = name41.toLowerCase();
    let children;
    children = recognizer.hasOwnProperty(nameLowerCase) ? recognizer[nameLowerCase].call(this, recognizer) : readSequence3.call(this, recognizer);
    if (!this.eof) {
        this.eat(RightParenthesis);
    }
    return {
        type: "Function",
        loc: this.getLocation(start, this.tokenStart),
        name: name41,
        children
    };
}
function generate16(node) {
    this.token(Function, node.name + "(");
    this.children(node);
    this.token(RightParenthesis, ")");
}

// lib/syntax/node/Hash.js
var Hash_exports = {};
__export(Hash_exports, {
    generate: () => generate17,
    name: () => name16,
    parse: () => parse17,
    structure: () => structure16,
    xxx: () => xxx
});
var xxx = "XXX";
var name16 = "Hash";
var structure16 = {
    value: String
};
function parse17() {
    const start = this.tokenStart;
    this.eat(Hash);
    return {
        type: "Hash",
        loc: this.getLocation(start, this.tokenStart),
        value: this.substrToCursor(start + 1)
    };
}
function generate17(node) {
    this.token(Hash, "#" + node.value);
}

// lib/syntax/node/Identifier.js
var Identifier_exports = {};
__export(Identifier_exports, {
    generate: () => generate18,
    name: () => name17,
    parse: () => parse18,
    structure: () => structure17
});
var name17 = "Identifier";
var structure17 = {
    name: String
};
function parse18() {
    return {
        type: "Identifier",
        loc: this.getLocation(this.tokenStart, this.tokenEnd),
        name: this.consume(Ident)
    };
}
function generate18(node) {
    this.token(Ident, node.name);
}

// lib/syntax/node/IdSelector.js
var IdSelector_exports = {};
__export(IdSelector_exports, {
    generate: () => generate19,
    name: () => name18,
    parse: () => parse19,
    structure: () => structure18
});
var name18 = "IdSelector";
var structure18 = {
    name: String
};
function parse19() {
    const start = this.tokenStart;
    this.eat(Hash);
    return {
        type: "IdSelector",
        loc: this.getLocation(start, this.tokenStart),
        name: this.substrToCursor(start + 1)
    };
}
function generate19(node) {
    this.token(Delim, "#" + node.name);
}

// lib/syntax/node/MediaFeature.js
var MediaFeature_exports = {};
__export(MediaFeature_exports, {
    generate: () => generate20,
    name: () => name19,
    parse: () => parse20,
    structure: () => structure19
});
var name19 = "MediaFeature";
var structure19 = {
    name: String,
    value: ["Identifier", "Number", "Dimension", "Ratio", null]
};
function parse20() {
    const start = this.tokenStart;
    let name41;
    let value = null;
    this.eat(LeftParenthesis);
    this.skipSC();
    name41 = this.consume(Ident);
    this.skipSC();
    if (this.tokenType !== RightParenthesis) {
        this.eat(Colon);
        this.skipSC();
        switch (this.tokenType) {
            case Number2:
                if (this.lookupNonWSType(1) === Delim) {
                    value = this.Ratio();
                } else {
                    value = this.Number();
                }
                break;
            case Dimension:
                value = this.Dimension();
                break;
            case Ident:
                value = this.Identifier();
                break;
            default:
                this.error("Number, dimension, ratio or identifier is expected");
        }
        this.skipSC();
    }
    this.eat(RightParenthesis);
    return {
        type: "MediaFeature",
        loc: this.getLocation(start, this.tokenStart),
        name: name41,
        value
    };
}
function generate20(node) {
    this.token(LeftParenthesis, "(");
    this.token(Ident, node.name);
    if (node.value !== null) {
        this.token(Colon, ":");
        this.node(node.value);
    }
    this.token(RightParenthesis, ")");
}

// lib/syntax/node/MediaQuery.js
var MediaQuery_exports = {};
__export(MediaQuery_exports, {
    generate: () => generate21,
    name: () => name20,
    parse: () => parse21,
    structure: () => structure20
});
var name20 = "MediaQuery";
var structure20 = {
    children: [[
        "Identifier",
        "MediaFeature",
        "WhiteSpace"
    ]]
};
function parse21() {
    const children = this.createList();
    let child = null;
    this.skipSC();
    scan:
    while (!this.eof) {
        switch (this.tokenType) {
            case Comment:
            case WhiteSpace:
                this.next();
                continue;
            case Ident:
                child = this.Identifier();
                break;
            case LeftParenthesis:
                child = this.MediaFeature();
                break;
            default:
                break scan;
        }
        children.push(child);
    }
    if (child === null) {
        this.error("Identifier or parenthesis is expected");
    }
    return {
        type: "MediaQuery",
        loc: this.getLocationFromList(children),
        children
    };
}
function generate21(node) {
    this.children(node);
}

// lib/syntax/node/MediaQueryList.js
var MediaQueryList_exports = {};
__export(MediaQueryList_exports, {
    generate: () => generate22,
    name: () => name21,
    parse: () => parse22,
    structure: () => structure21
});
var name21 = "MediaQueryList";
var structure21 = {
    children: [[
        "MediaQuery"
    ]]
};
function parse22() {
    const children = this.createList();
    this.skipSC();
    while (!this.eof) {
        children.push(this.MediaQuery());
        if (this.tokenType !== Comma) {
            break;
        }
        this.next();
    }
    return {
        type: "MediaQueryList",
        loc: this.getLocationFromList(children),
        children
    };
}
function generate22(node) {
    this.children(node, () => this.token(Comma, ","));
}

// lib/syntax/node/Nth.js
var Nth_exports = {};
__export(Nth_exports, {
    generate: () => generate23,
    name: () => name22,
    parse: () => parse23,
    structure: () => structure22
});
var name22 = "Nth";
var structure22 = {
    nth: ["AnPlusB", "Identifier"],
    selector: ["SelectorList", null]
};
function parse23() {
    this.skipSC();
    const start = this.tokenStart;
    let end = start;
    let selector2 = null;
    let nth2;
    if (this.lookupValue(0, "odd") || this.lookupValue(0, "even")) {
        nth2 = this.Identifier();
    } else {
        nth2 = this.AnPlusB();
    }
    end = this.tokenStart;
    this.skipSC();
    if (this.lookupValue(0, "of")) {
        this.next();
        selector2 = this.SelectorList();
        end = this.tokenStart;
    }
    return {
        type: "Nth",
        loc: this.getLocation(start, end),
        nth: nth2,
        selector: selector2
    };
}
function generate23(node) {
    this.node(node.nth);
    if (node.selector !== null) {
        this.token(Ident, "of");
        this.node(node.selector);
    }
}

// lib/syntax/node/Number.js
var Number_exports = {};
__export(Number_exports, {
    generate: () => generate24,
    name: () => name23,
    parse: () => parse24,
    structure: () => structure23
});
var name23 = "Number";
var structure23 = {
    value: String
};
function parse24() {
    return {
        type: "Number",
        loc: this.getLocation(this.tokenStart, this.tokenEnd),
        value: this.consume(Number2)
    };
}
function generate24(node) {
    this.token(Number2, node.value);
}

// lib/syntax/node/Operator.js
var Operator_exports = {};
__export(Operator_exports, {
    generate: () => generate25,
    name: () => name24,
    parse: () => parse25,
    structure: () => structure24
});
var name24 = "Operator";
var structure24 = {
    value: String
};
function parse25() {
    const start = this.tokenStart;
    this.next();
    return {
        type: "Operator",
        loc: this.getLocation(start, this.tokenStart),
        value: this.substrToCursor(start)
    };
}
function generate25(node) {
    this.tokenize(node.value);
}

// lib/syntax/node/Parentheses.js
var Parentheses_exports = {};
__export(Parentheses_exports, {
    generate: () => generate26,
    name: () => name25,
    parse: () => parse26,
    structure: () => structure25
});
var name25 = "Parentheses";
var structure25 = {
    children: [[]]
};
function parse26(readSequence3, recognizer) {
    const start = this.tokenStart;
    let children = null;
    this.eat(LeftParenthesis);
    children = readSequence3.call(this, recognizer);
    if (!this.eof) {
        this.eat(RightParenthesis);
    }
    return {
        type: "Parentheses",
        loc: this.getLocation(start, this.tokenStart),
        children
    };
}
function generate26(node) {
    this.token(LeftParenthesis, "(");
    this.children(node);
    this.token(RightParenthesis, ")");
}

// lib/syntax/node/Percentage.js
var Percentage_exports = {};
__export(Percentage_exports, {
    generate: () => generate27,
    name: () => name26,
    parse: () => parse27,
    structure: () => structure26
});
var name26 = "Percentage";
var structure26 = {
    value: String
};
function parse27() {
    return {
        type: "Percentage",
        loc: this.getLocation(this.tokenStart, this.tokenEnd),
        value: this.consumeNumber(Percentage)
    };
}
function generate27(node) {
    this.token(Percentage, node.value + "%");
}

// lib/syntax/node/PseudoClassSelector.js
var PseudoClassSelector_exports = {};
__export(PseudoClassSelector_exports, {
    generate: () => generate28,
    name: () => name27,
    parse: () => parse28,
    structure: () => structure27,
    walkContext: () => walkContext6
});
var name27 = "PseudoClassSelector";
var walkContext6 = "function";
var structure27 = {
    name: String,
    children: [["Raw"], null]
};
function parse28() {
    const start = this.tokenStart;
    let children = null;
    let name41;
    let nameLowerCase;
    this.eat(Colon);
    if (this.tokenType === Function) {
        name41 = this.consumeFunctionName();
        nameLowerCase = name41.toLowerCase();
        if (hasOwnProperty.call(this.pseudo, nameLowerCase)) {
            this.skipSC();
            children = this.pseudo[nameLowerCase].call(this);
            this.skipSC();
        } else {
            children = this.createList();
            children.push(this.Raw(this.tokenIndex, null, false));
        }
        this.eat(RightParenthesis);
    } else {
        name41 = this.consume(Ident);
    }
    return {
        type: "PseudoClassSelector",
        loc: this.getLocation(start, this.tokenStart),
        name: name41,
        children
    };
}
function generate28(node) {
    this.token(Colon, ":");
    if (node.children === null) {
        this.token(Ident, node.name);
    } else {
        this.token(Function, node.name + "(");
        this.children(node);
        this.token(RightParenthesis, ")");
    }
}

// lib/syntax/node/PseudoElementSelector.js
var PseudoElementSelector_exports = {};
__export(PseudoElementSelector_exports, {
    generate: () => generate29,
    name: () => name28,
    parse: () => parse29,
    structure: () => structure28,
    walkContext: () => walkContext7
});
var name28 = "PseudoElementSelector";
var walkContext7 = "function";
var structure28 = {
    name: String,
    children: [["Raw"], null]
};
function parse29() {
    const start = this.tokenStart;
    let children = null;
    let name41;
    let nameLowerCase;
    this.eat(Colon);
    this.eat(Colon);
    if (this.tokenType === Function) {
        name41 = this.consumeFunctionName();
        nameLowerCase = name41.toLowerCase();
        if (hasOwnProperty.call(this.pseudo, nameLowerCase)) {
            this.skipSC();
            children = this.pseudo[nameLowerCase].call(this);
            this.skipSC();
        } else {
            children = this.createList();
            children.push(this.Raw(this.tokenIndex, null, false));
        }
        this.eat(RightParenthesis);
    } else {
        name41 = this.consume(Ident);
    }
    return {
        type: "PseudoElementSelector",
        loc: this.getLocation(start, this.tokenStart),
        name: name41,
        children
    };
}
function generate29(node) {
    this.token(Colon, ":");
    this.token(Colon, ":");
    if (node.children === null) {
        this.token(Ident, node.name);
    } else {
        this.token(Function, node.name + "(");
        this.children(node);
        this.token(RightParenthesis, ")");
    }
}

// lib/syntax/node/Ratio.js
var Ratio_exports = {};
__export(Ratio_exports, {
    generate: () => generate30,
    name: () => name29,
    parse: () => parse30,
    structure: () => structure29
});
var SOLIDUS4 = 47;
var FULLSTOP2 = 46;
function consumeNumber2() {
    this.skipSC();
    const value = this.consume(Number2);
    for (let i = 0; i < value.length; i++) {
        const code2 = value.charCodeAt(i);
        if (!isDigit(code2) && code2 !== FULLSTOP2) {
            this.error("Unsigned number is expected", this.tokenStart - value.length + i);
        }
    }
    if (Number(value) === 0) {
        this.error("Zero number is not allowed", this.tokenStart - value.length);
    }
    return value;
}
var name29 = "Ratio";
var structure29 = {
    left: String,
    right: String
};
function parse30() {
    const start = this.tokenStart;
    const left = consumeNumber2.call(this);
    let right;
    this.skipSC();
    this.eatDelim(SOLIDUS4);
    right = consumeNumber2.call(this);
    return {
        type: "Ratio",
        loc: this.getLocation(start, this.tokenStart),
        left,
        right
    };
}
function generate30(node) {
    this.token(Number2, node.left);
    this.token(Delim, "/");
    this.token(Number2, node.right);
}

// lib/syntax/node/Raw.js
var Raw_exports = {};
__export(Raw_exports, {
    generate: () => generate31,
    name: () => name30,
    parse: () => parse31,
    structure: () => structure30
});
function getOffsetExcludeWS() {
    if (this.tokenIndex > 0) {
        if (this.lookupType(-1) === WhiteSpace) {
            return this.tokenIndex > 1 ? this.getTokenStart(this.tokenIndex - 1) : this.firstCharOffset;
        }
    }
    return this.tokenStart;
}
var name30 = "Raw";
var structure30 = {
    value: String
};
function parse31(startToken, consumeUntil, excludeWhiteSpace) {
    const startOffset = this.getTokenStart(startToken);
    let endOffset;
    this.skipUntilBalanced(startToken, consumeUntil || this.consumeUntilBalanceEnd);
    if (excludeWhiteSpace && this.tokenStart > startOffset) {
        endOffset = getOffsetExcludeWS.call(this);
    } else {
        endOffset = this.tokenStart;
    }
    return {
        type: "Raw",
        loc: this.getLocation(startOffset, endOffset),
        value: this.substring(startOffset, endOffset)
    };
}
function generate31(node) {
    this.tokenize(node.value);
}

// lib/syntax/node/Rule.js
var Rule_exports = {};
__export(Rule_exports, {
    generate: () => generate32,
    name: () => name31,
    parse: () => parse32,
    structure: () => structure31,
    walkContext: () => walkContext8
});
function consumeRaw4(startToken) {
    return this.Raw(startToken, this.consumeUntilLeftCurlyBracket, true);
}
function consumePrelude() {
    const prelude = this.SelectorList();
    if (prelude.type !== "Raw" && this.eof === false && this.tokenType !== LeftCurlyBracket) {
        this.error();
    }
    return prelude;
}
var name31 = "Rule";
var walkContext8 = "rule";
var structure31 = {
    prelude: ["SelectorList", "Raw"],
    block: ["Block"]
};
function parse32() {
    const startToken = this.tokenIndex;
    const startOffset = this.tokenStart;
    let prelude;
    let block;
    if (this.parseRulePrelude) {
        prelude = this.parseWithFallback(consumePrelude, consumeRaw4);
    } else {
        prelude = consumeRaw4.call(this, startToken);
    }
    block = this.Block(true);
    return {
        type: "Rule",
        loc: this.getLocation(startOffset, this.tokenStart),
        prelude,
        block
    };
}
function generate32(node) {
    this.node(node.prelude);
    this.node(node.block);
}

// lib/syntax/node/Selector.js
var Selector_exports = {};
__export(Selector_exports, {
    generate: () => generate33,
    name: () => name32,
    parse: () => parse33,
    structure: () => structure32
});
var name32 = "Selector";
var structure32 = {
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
};
function parse33() {
    const children = this.readSequence(this.scope.Selector);
    if (this.getFirstListNode(children) === null) {
        this.error("Selector is expected");
    }
    return {
        type: "Selector",
        loc: this.getLocationFromList(children),
        children
    };
}
function generate33(node) {
    this.children(node);
}

// lib/syntax/node/SelectorList.js
var SelectorList_exports = {};
__export(SelectorList_exports, {
    generate: () => generate34,
    name: () => name33,
    parse: () => parse34,
    structure: () => structure33,
    walkContext: () => walkContext9
});
var name33 = "SelectorList";
var walkContext9 = "selector";
var structure33 = {
    children: [[
        "Selector",
        "Raw"
    ]]
};
function parse34() {
    const children = this.createList();
    while (!this.eof) {
        children.push(this.Selector());
        if (this.tokenType === Comma) {
            this.next();
            continue;
        }
        break;
    }
    return {
        type: "SelectorList",
        loc: this.getLocationFromList(children),
        children
    };
}
function generate34(node) {
    this.children(node, () => this.token(Comma, ","));
}

// lib/syntax/node/String.js
var String_exports = {};
__export(String_exports, {
    generate: () => generate35,
    name: () => name34,
    parse: () => parse35,
    structure: () => structure34
});

// lib/utils/string.js
var string_exports = {};
__export(string_exports, {
    decode: () => decode,
    encode: () => encode
});
var REVERSE_SOLIDUS = 92;
var QUOTATION_MARK = 34;
var APOSTROPHE2 = 39;
function decode(str) {
    const len = str.length;
    const firstChar = str.charCodeAt(0);
    const start = firstChar === QUOTATION_MARK || firstChar === APOSTROPHE2 ? 1 : 0;
    const end = start === 1 && len > 1 && str.charCodeAt(len - 1) === firstChar ? len - 2 : len - 1;
    let decoded = "";
    for (let i = start; i <= end; i++) {
        let code2 = str.charCodeAt(i);
        if (code2 === REVERSE_SOLIDUS) {
            if (i === end) {
                if (i !== len - 1) {
                    decoded = str.substr(i + 1);
                }
                break;
            }
            code2 = str.charCodeAt(++i);
            if (isValidEscape(REVERSE_SOLIDUS, code2)) {
                const escapeStart = i - 1;
                const escapeEnd = consumeEscaped(str, escapeStart);
                i = escapeEnd - 1;
                decoded += decodeEscaped(str.substring(escapeStart + 1, escapeEnd));
            } else {
                if (code2 === 13 && str.charCodeAt(i + 1) === 10) {
                    i++;
                }
            }
        } else {
            decoded += str[i];
        }
    }
    return decoded;
}
function encode(str, apostrophe) {
    const quote = apostrophe ? "'" : '"';
    const quoteCode = apostrophe ? APOSTROPHE2 : QUOTATION_MARK;
    let encoded = "";
    let wsBeforeHexIsNeeded = false;
    for (let i = 0; i < str.length; i++) {
        const code2 = str.charCodeAt(i);
        if (code2 === 0) {
            encoded += "\uFFFD";
            continue;
        }
        if (code2 <= 31 || code2 === 127) {
            encoded += "\\" + code2.toString(16);
            wsBeforeHexIsNeeded = true;
            continue;
        }
        if (code2 === quoteCode || code2 === REVERSE_SOLIDUS) {
            encoded += "\\" + str.charAt(i);
            wsBeforeHexIsNeeded = false;
        } else {
            if (wsBeforeHexIsNeeded && (isHexDigit(code2) || isWhiteSpace(code2))) {
                encoded += " ";
            }
            encoded += str.charAt(i);
            wsBeforeHexIsNeeded = false;
        }
    }
    return quote + encoded + quote;
}

// lib/syntax/node/String.js
var name34 = "String";
var structure34 = {
    value: String
};
function parse35() {
    return {
        type: "String",
        loc: this.getLocation(this.tokenStart, this.tokenEnd),
        value: decode(this.consume(String2))
    };
}
function generate35(node) {
    this.token(String2, encode(node.value));
}

// lib/syntax/node/StyleSheet.js
var StyleSheet_exports = {};
__export(StyleSheet_exports, {
    generate: () => generate36,
    name: () => name35,
    parse: () => parse36,
    structure: () => structure35,
    walkContext: () => walkContext10
});
var EXCLAMATIONMARK4 = 33;
function consumeRaw5(startToken) {
    return this.Raw(startToken, null, false);
}
var name35 = "StyleSheet";
var walkContext10 = "stylesheet";
var structure35 = {
    children: [[
        "Comment",
        "CDO",
        "CDC",
        "Atrule",
        "Rule",
        "Raw"
    ]]
};
function parse36() {
    const start = this.tokenStart;
    const children = this.createList();
    let child;
    scan:
    while (!this.eof) {
        switch (this.tokenType) {
            case WhiteSpace:
                this.next();
                continue;
            case Comment:
                if (this.charCodeAt(this.tokenStart + 2) !== EXCLAMATIONMARK4) {
                    this.next();
                    continue;
                }
                child = this.Comment();
                break;
            case CDO:
                child = this.CDO();
                break;
            case CDC:
                child = this.CDC();
                break;
            case AtKeyword:
                child = this.parseWithFallback(this.Atrule, consumeRaw5);
                break;
            default:
                child = this.parseWithFallback(this.Rule, consumeRaw5);
        }
        children.push(child);
    }
    return {
        type: "StyleSheet",
        loc: this.getLocation(start, this.tokenStart),
        children
    };
}
function generate36(node) {
    this.children(node);
}

// lib/syntax/node/TypeSelector.js
var TypeSelector_exports = {};
__export(TypeSelector_exports, {
    generate: () => generate37,
    name: () => name36,
    parse: () => parse37,
    structure: () => structure36
});
var ASTERISK5 = 42;
var VERTICALLINE3 = 124;
function eatIdentifierOrAsterisk() {
    if (this.tokenType !== Ident && this.isDelim(ASTERISK5) === false) {
        this.error("Identifier or asterisk is expected");
    }
    this.next();
}
var name36 = "TypeSelector";
var structure36 = {
    name: String
};
function parse37() {
    const start = this.tokenStart;
    if (this.isDelim(VERTICALLINE3)) {
        this.next();
        eatIdentifierOrAsterisk.call(this);
    } else {
        eatIdentifierOrAsterisk.call(this);
        if (this.isDelim(VERTICALLINE3)) {
            this.next();
            eatIdentifierOrAsterisk.call(this);
        }
    }
    return {
        type: "TypeSelector",
        loc: this.getLocation(start, this.tokenStart),
        name: this.substrToCursor(start)
    };
}
function generate37(node) {
    this.tokenize(node.name);
}

// lib/syntax/node/UnicodeRange.js
var UnicodeRange_exports = {};
__export(UnicodeRange_exports, {
    generate: () => generate38,
    name: () => name37,
    parse: () => parse38,
    structure: () => structure37
});
var PLUSSIGN8 = 43;
var HYPHENMINUS6 = 45;
var QUESTIONMARK3 = 63;
function eatHexSequence(offset, allowDash) {
    let len = 0;
    for (let pos = this.tokenStart + offset; pos < this.tokenEnd; pos++) {
        const code2 = this.charCodeAt(pos);
        if (code2 === HYPHENMINUS6 && allowDash && len !== 0) {
            eatHexSequence.call(this, offset + len + 1, false);
            return -1;
        }
        if (!isHexDigit(code2)) {
            this.error(allowDash && len !== 0 ? "Hyphen minus" + (len < 6 ? " or hex digit" : "") + " is expected" : len < 6 ? "Hex digit is expected" : "Unexpected input", pos);
        }
        if (++len > 6) {
            this.error("Too many hex digits", pos);
        }
        ;
    }
    this.next();
    return len;
}
function eatQuestionMarkSequence(max) {
    let count = 0;
    while (this.isDelim(QUESTIONMARK3)) {
        if (++count > max) {
            this.error("Too many question marks");
        }
        this.next();
    }
}
function startsWith2(code2) {
    if (this.charCodeAt(this.tokenStart) !== code2) {
        this.error((code2 === PLUSSIGN8 ? "Plus sign" : "Hyphen minus") + " is expected");
    }
}
function scanUnicodeRange() {
    let hexLength = 0;
    switch (this.tokenType) {
        case Number2:
            hexLength = eatHexSequence.call(this, 1, true);
            if (this.isDelim(QUESTIONMARK3)) {
                eatQuestionMarkSequence.call(this, 6 - hexLength);
                break;
            }
            if (this.tokenType === Dimension || this.tokenType === Number2) {
                startsWith2.call(this, HYPHENMINUS6);
                eatHexSequence.call(this, 1, false);
                break;
            }
            break;
        case Dimension:
            hexLength = eatHexSequence.call(this, 1, true);
            if (hexLength > 0) {
                eatQuestionMarkSequence.call(this, 6 - hexLength);
            }
            break;
        default:
            this.eatDelim(PLUSSIGN8);
            if (this.tokenType === Ident) {
                hexLength = eatHexSequence.call(this, 0, true);
                if (hexLength > 0) {
                    eatQuestionMarkSequence.call(this, 6 - hexLength);
                }
                break;
            }
            if (this.isDelim(QUESTIONMARK3)) {
                this.next();
                eatQuestionMarkSequence.call(this, 5);
                break;
            }
            this.error("Hex digit or question mark is expected");
    }
}
var name37 = "UnicodeRange";
var structure37 = {
    value: String
};
function parse38() {
    const start = this.tokenStart;
    this.eatIdent("u");
    scanUnicodeRange.call(this);
    return {
        type: "UnicodeRange",
        loc: this.getLocation(start, this.tokenStart),
        value: this.substrToCursor(start)
    };
}
function generate38(node) {
    this.tokenize(node.value);
}

// lib/syntax/node/Url.js
var Url_exports = {};
__export(Url_exports, {
    generate: () => generate39,
    name: () => name38,
    parse: () => parse39,
    structure: () => structure38
});

// lib/utils/url.js
var url_exports = {};
__export(url_exports, {
    decode: () => decode2,
    encode: () => encode2
});
var SPACE3 = 32;
var REVERSE_SOLIDUS2 = 92;
var QUOTATION_MARK2 = 34;
var APOSTROPHE3 = 39;
var LEFTPARENTHESIS3 = 40;
var RIGHTPARENTHESIS3 = 41;
function decode2(str) {
    const len = str.length;
    let start = 4;
    let end = str.charCodeAt(len - 1) === RIGHTPARENTHESIS3 ? len - 2 : len - 1;
    let decoded = "";
    while (start < end && isWhiteSpace(str.charCodeAt(start))) {
        start++;
    }
    while (start < end && isWhiteSpace(str.charCodeAt(end))) {
        end--;
    }
    for (let i = start; i <= end; i++) {
        let code2 = str.charCodeAt(i);
        if (code2 === REVERSE_SOLIDUS2) {
            if (i === end) {
                if (i !== len - 1) {
                    decoded = str.substr(i + 1);
                }
                break;
            }
            code2 = str.charCodeAt(++i);
            if (isValidEscape(REVERSE_SOLIDUS2, code2)) {
                const escapeStart = i - 1;
                const escapeEnd = consumeEscaped(str, escapeStart);
                i = escapeEnd - 1;
                decoded += decodeEscaped(str.substring(escapeStart + 1, escapeEnd));
            } else {
                if (code2 === 13 && str.charCodeAt(i + 1) === 10) {
                    i++;
                }
            }
        } else {
            decoded += str[i];
        }
    }
    return decoded;
}
function encode2(str) {
    let encoded = "";
    let wsBeforeHexIsNeeded = false;
    for (let i = 0; i < str.length; i++) {
        const code2 = str.charCodeAt(i);
        if (code2 === 0) {
            encoded += "\uFFFD";
            continue;
        }
        if (code2 <= 31 || code2 === 127) {
            encoded += "\\" + code2.toString(16);
            wsBeforeHexIsNeeded = true;
            continue;
        }
        if (code2 === SPACE3 || code2 === REVERSE_SOLIDUS2 || code2 === QUOTATION_MARK2 || code2 === APOSTROPHE3 || code2 === LEFTPARENTHESIS3 || code2 === RIGHTPARENTHESIS3) {
            encoded += "\\" + str.charAt(i);
            wsBeforeHexIsNeeded = false;
        } else {
            if (wsBeforeHexIsNeeded && isHexDigit(code2)) {
                encoded += " ";
            }
            encoded += str.charAt(i);
            wsBeforeHexIsNeeded = false;
        }
    }
    return "url(" + encoded + ")";
}

// lib/syntax/node/Url.js
var name38 = "Url";
var structure38 = {
    value: String
};
function parse39() {
    const start = this.tokenStart;
    let value;
    switch (this.tokenType) {
        case Url:
            value = decode2(this.consume(Url));
            break;
        case Function:
            if (!this.cmpStr(this.tokenStart, this.tokenEnd, "url(")) {
                this.error("Function name must be `url`");
            }
            this.eat(Function);
            this.skipSC();
            value = decode(this.consume(String2));
            this.skipSC();
            if (!this.eof) {
                this.eat(RightParenthesis);
            }
            break;
        default:
            this.error("Url or Function is expected");
    }
    return {
        type: "Url",
        loc: this.getLocation(start, this.tokenStart),
        value
    };
}
function generate39(node) {
    this.token(Url, encode2(node.value));
}

// lib/syntax/node/Value.js
var Value_exports = {};
__export(Value_exports, {
    generate: () => generate40,
    name: () => name39,
    parse: () => parse40,
    structure: () => structure39
});
var name39 = "Value";
var structure39 = {
    children: [[]]
};
function parse40() {
    const start = this.tokenStart;
    const children = this.readSequence(this.scope.Value);
    return {
        type: "Value",
        loc: this.getLocation(start, this.tokenStart),
        children
    };
}
function generate40(node) {
    this.children(node);
}

// lib/syntax/node/WhiteSpace.js
var WhiteSpace_exports = {};
__export(WhiteSpace_exports, {
    generate: () => generate41,
    name: () => name40,
    parse: () => parse41,
    structure: () => structure40
});
var SPACE4 = Object.freeze({
    type: "WhiteSpace",
    loc: null,
    value: " "
});
var name40 = "WhiteSpace";
var structure40 = {
    value: String
};
function parse41() {
    this.eat(WhiteSpace);
    return SPACE4;
}
function generate41(node) {
    this.token(WhiteSpace, node.value);
}

// lib/syntax/config/lexer.js
var lexer_default = {
    generic: true,
    ...data_default,
    node: node_exports
};

// lib/syntax/scope/index.js
var scope_exports = {};
__export(scope_exports, {
    AtrulePrelude: () => atrulePrelude_default,
    Selector: () => selector_default,
    Value: () => value_default
});

// lib/syntax/scope/default.js
var NUMBERSIGN4 = 35;
var ASTERISK6 = 42;
var PLUSSIGN9 = 43;
var HYPHENMINUS7 = 45;
var SOLIDUS5 = 47;
var U2 = 117;
function defaultRecognizer(context) {
    switch (this.tokenType) {
        case Hash:
            return this.Hash();
        case Comma:
            return this.Operator();
        case LeftParenthesis:
            return this.Parentheses(this.readSequence, context.recognizer);
        case LeftSquareBracket:
            return this.Brackets(this.readSequence, context.recognizer);
        case String2:
            return this.String();
        case Dimension:
            return this.Dimension();
        case Percentage:
            return this.Percentage();
        case Number2:
            return this.Number();
        case Function:
            return this.cmpStr(this.tokenStart, this.tokenEnd, "url(") ? this.Url() : this.Function(this.readSequence, context.recognizer);
        case Url:
            return this.Url();
        case Ident:
            if (this.cmpChar(this.tokenStart, U2) && this.cmpChar(this.tokenStart + 1, PLUSSIGN9)) {
                return this.UnicodeRange();
            } else {
                return this.Identifier();
            }
        case Delim: {
            const code2 = this.charCodeAt(this.tokenStart);
            if (code2 === SOLIDUS5 || code2 === ASTERISK6 || code2 === PLUSSIGN9 || code2 === HYPHENMINUS7) {
                return this.Operator();
            }
            if (code2 === NUMBERSIGN4) {
                this.error("Hex or identifier is expected", this.tokenStart + 1);
            }
            break;
        }
    }
}

// lib/syntax/scope/atrulePrelude.js
var atrulePrelude_default = {
    getNode: defaultRecognizer
};

// lib/syntax/scope/selector.js
var NUMBERSIGN5 = 35;
var ASTERISK7 = 42;
var PLUSSIGN10 = 43;
var SOLIDUS6 = 47;
var FULLSTOP3 = 46;
var GREATERTHANSIGN3 = 62;
var VERTICALLINE4 = 124;
var TILDE3 = 126;
function onWhiteSpace(next, children) {
    if (children.last !== null && children.last.type !== "Combinator" && next !== null && next.type !== "Combinator") {
        children.push({
            type: "Combinator",
            loc: null,
            name: " "
        });
    }
}
function getNode() {
    switch (this.tokenType) {
        case LeftSquareBracket:
            return this.AttributeSelector();
        case Hash:
            return this.IdSelector();
        case Colon:
            if (this.lookupType(1) === Colon) {
                return this.PseudoElementSelector();
            } else {
                return this.PseudoClassSelector();
            }
        case Ident:
            return this.TypeSelector();
        case Number2:
        case Percentage:
            return this.Percentage();
        case Dimension:
            if (this.charCodeAt(this.tokenStart) === FULLSTOP3) {
                this.error("Identifier is expected", this.tokenStart + 1);
            }
            break;
        case Delim: {
            const code2 = this.charCodeAt(this.tokenStart);
            switch (code2) {
                case PLUSSIGN10:
                case GREATERTHANSIGN3:
                case TILDE3:
                case SOLIDUS6:
                    return this.Combinator();
                case FULLSTOP3:
                    return this.ClassSelector();
                case ASTERISK7:
                case VERTICALLINE4:
                    return this.TypeSelector();
                case NUMBERSIGN5:
                    return this.IdSelector();
            }
            break;
        }
    }
}
var selector_default = {
    onWhiteSpace,
    getNode
};

// lib/syntax/function/expression.js
function expression_default() {
    return this.createSingleNodeList(this.Raw(this.tokenIndex, null, false));
}

// lib/syntax/function/var.js
function var_default() {
    const children = this.createList();
    this.skipSC();
    children.push(this.Identifier());
    this.skipSC();
    if (this.tokenType === Comma) {
        children.push(this.Operator());
        const startIndex = this.tokenIndex;
        const value = this.parseCustomProperty ? this.Value(null) : this.Raw(this.tokenIndex, this.consumeUntilExclamationMarkOrSemicolon, false);
        if (value.type === "Value" && value.children.isEmpty) {
            for (let offset = startIndex - this.tokenIndex; offset <= 0; offset++) {
                if (this.lookupType(offset) === WhiteSpace) {
                    value.children.appendData({
                        type: "WhiteSpace",
                        loc: null,
                        value: " "
                    });
                    break;
                }
            }
        }
        children.push(value);
    }
    return children;
}

// lib/syntax/scope/value.js
function isPlusMinusOperator(node) {
    return node !== null && node.type === "Operator" && (node.value[node.value.length - 1] === "-" || node.value[node.value.length - 1] === "+");
}
var value_default = {
    getNode: defaultRecognizer,
    onWhiteSpace: function (next, children) {
        if (isPlusMinusOperator(next)) {
            next.value = " " + next.value;
        }
        if (isPlusMinusOperator(children.last)) {
            children.last.value += " ";
        }
    },
    "expression": expression_default,
    "var": var_default
};

// lib/syntax/atrule/font-face.js
var font_face_default = {
    parse: {
        prelude: null,
        block() {
            return this.Block(true);
        }
    }
};

// lib/syntax/atrule/import.js
var import_default3 = {
    parse: {
        prelude() {
            const children = this.createList();
            this.skipSC();
            switch (this.tokenType) {
                case String2:
                    children.push(this.String());
                    break;
                case Url:
                case Function:
                    children.push(this.Url());
                    break;
                default:
                    this.error("String or url() is expected");
            }
            if (this.lookupNonWSType(0) === Ident || this.lookupNonWSType(0) === LeftParenthesis) {
                children.push(this.MediaQueryList());
            }
            return children;
        },
        block: null
    }
};

// lib/syntax/atrule/media.js
var media_default = {
    parse: {
        prelude() {
            return this.createSingleNodeList(this.MediaQueryList());
        },
        block() {
            return this.Block(false);
        }
    }
};

// lib/syntax/atrule/page.js
var page_default = {
    parse: {
        prelude() {
            return this.createSingleNodeList(this.SelectorList());
        },
        block() {
            return this.Block(true);
        }
    }
};

// lib/syntax/atrule/supports.js
function consumeRaw6() {
    return this.createSingleNodeList(this.Raw(this.tokenIndex, null, false));
}
function parentheses() {
    this.skipSC();
    if (this.tokenType === Ident && this.lookupNonWSType(1) === Colon) {
        return this.createSingleNodeList(this.Declaration());
    }
    return readSequence2.call(this);
}
function readSequence2() {
    const children = this.createList();
    let child;
    this.skipSC();
    scan:
    while (!this.eof) {
        switch (this.tokenType) {
            case Comment:
            case WhiteSpace:
                this.next();
                continue;
            case Function:
                child = this.Function(consumeRaw6, this.scope.AtrulePrelude);
                break;
            case Ident:
                child = this.Identifier();
                break;
            case LeftParenthesis:
                child = this.Parentheses(parentheses, this.scope.AtrulePrelude);
                break;
            default:
                break scan;
        }
        children.push(child);
    }
    return children;
}
var supports_default = {
    parse: {
        prelude() {
            const children = readSequence2.call(this);
            if (this.getFirstListNode(children) === null) {
                this.error("Condition is expected");
            }
            return children;
        },
        block() {
            return this.Block(false);
        }
    }
};

// lib/syntax/atrule/index.js
var atrule_default = {
    "font-face": font_face_default,
    "import": import_default3,
    media: media_default,
    page: page_default,
    supports: supports_default
};

// lib/syntax/pseudo/index.js
var selectorList = {
    parse() {
        return this.createSingleNodeList(this.SelectorList());
    }
};
var selector = {
    parse() {
        return this.createSingleNodeList(this.Selector());
    }
};
var identList = {
    parse() {
        return this.createSingleNodeList(this.Identifier());
    }
};
var nth = {
    parse() {
        return this.createSingleNodeList(this.Nth());
    }
};
var pseudo_default = {
    "dir": identList,
    "has": selectorList,
    "lang": identList,
    "matches": selectorList,
    "not": selectorList,
    "nth-child": nth,
    "nth-last-child": nth,
    "nth-last-of-type": nth,
    "nth-of-type": nth,
    "slotted": selector
};

// lib/syntax/config/parser.js
var parser_default = {
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
    scope: scope_exports,
    atrule: atrule_default,
    pseudo: pseudo_default,
    node: node_exports
};

// lib/syntax/config/walker.js
var walker_default = {
    node: node_exports
};

// lib/syntax/index.js
var syntax_default = create_default({
    ...lexer_default,
    ...parser_default,
    ...walker_default
});

// dist/version.js
var version = "2.0.4";

// lib/utils/clone.js
function clone(node) {
    const result = {};
    for (const key in node) {
        let value = node[key];
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
}

// lib/utils/ident.js
var ident_exports = {};
__export(ident_exports, {
    decode: () => decode3,
    encode: () => encode3
});
var REVERSE_SOLIDUS3 = 92;
function decode3(str) {
    const end = str.length - 1;
    let decoded = "";
    for (let i = 0; i < str.length; i++) {
        let code2 = str.charCodeAt(i);
        if (code2 === REVERSE_SOLIDUS3) {
            if (i === end) {
                break;
            }
            code2 = str.charCodeAt(++i);
            if (isValidEscape(REVERSE_SOLIDUS3, code2)) {
                const escapeStart = i - 1;
                const escapeEnd = consumeEscaped(str, escapeStart);
                i = escapeEnd - 1;
                decoded += decodeEscaped(str.substring(escapeStart + 1, escapeEnd));
            } else {
                if (code2 === 13 && str.charCodeAt(i + 1) === 10) {
                    i++;
                }
            }
        } else {
            decoded += str[i];
        }
    }
    return decoded;
}
function encode3(str) {
    let encoded = "";
    if (str.length === 1 && str.charCodeAt(0) === 45) {
        return "\\-";
    }
    for (let i = 0; i < str.length; i++) {
        const code2 = str.charCodeAt(i);
        if (code2 === 0) {
            encoded += "\uFFFD";
            continue;
        }
        if (code2 <= 31 || code2 === 127 || code2 >= 48 && code2 <= 57 && (i === 0 || i === 1 && str.charCodeAt(0) === 45)) {
            encoded += "\\" + code2.toString(16) + " ";
            continue;
        }
        if (isName(code2)) {
            encoded += str.charAt(i);
        } else {
            encoded += "\\" + str.charAt(i);
        }
    }
    return encoded;
}

// lib/index.js
export {
    parse,
    generate
};