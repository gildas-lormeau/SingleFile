/// <reference types="./mod.d.ts" />

// derived from https://github.com/msindwan/mhtml2html

/**
 * The MIT License(MIT)
 *
 * Copyright(c) 2016 Mayank Sindwani (https://github.com/msindwan/mhtml2html)
 * Copyright(c) 2025 Gildas Lormeau
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files(the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and / or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions :
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import modConvert from "./convert.js";
import modParse from "./parse.js";

export { convert, parse };

function convert(mhtml, config = {}) {
    if (config.DOMParser === undefined && globalThis.DOMParser) {
        config.DOMParser = globalThis.DOMParser;
    }
    if ((typeof mhtml === "string") || mhtml instanceof Uint8Array) {
        mhtml = parse(mhtml, config);
    }
    return modConvert(mhtml, config);
}

function parse(data, config = {}) {
    if (config.DOMParser === undefined && globalThis.DOMParser) {
        config.DOMParser = globalThis.DOMParser;
    }
    return modParse(data, config);
}
