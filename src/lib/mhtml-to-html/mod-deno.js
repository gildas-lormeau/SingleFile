/// <reference types="./mod.d.ts" />

import { DOMParser } from "@b-fuze/deno-dom";
import { convert as modConvert, parse as modParse } from "./mod.js";

export { convert, parse };

function convert(mhtml, config = {}) {
    return modConvert(mhtml, { ...config, DOMParser });
}

function parse(data, config = {}) {
    return modParse(data, { ...config, DOMParser });
}
