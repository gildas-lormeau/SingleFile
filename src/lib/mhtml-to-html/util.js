/* global URL, TextDecoder, TextEncoder, btoa, atob */

const EVENT_HANDLER_ATTRIBUTES = [
    "onafterprint",
    "onbeforeprint",
    "onbeforeunload",
    "onhashchange",
    "onlanguagechange",
    "onmessage",
    "onmessageerror",
    "onoffline",
    "ononline",
    "onpagehide",
    "onpageshow",
    "onpopstate",
    "onrejectionhandled",
    "onstorage",
    "onunhandledrejection",
    "onunload",
    "ongamepadconnected",
    "ongamepaddisconnected",
    "onabort",
    "onblur",
    "onfocus",
    "oncancel",
    "onauxclick",
    "onbeforeinput",
    "onbeforetoggle",
    "oncanplay",
    "oncanplaythrough",
    "onchange",
    "onclick",
    "onclose",
    "oncontentvisibilityautostatechange",
    "oncontextlost",
    "oncontextmenu",
    "oncontextrestored",
    "oncopy",
    "oncuechange",
    "oncut",
    "ondblclick",
    "ondrag",
    "ondragend",
    "ondragenter",
    "ondragleave",
    "ondragover",
    "ondragstart",
    "ondrop",
    "ondurationchange",
    "onemptied",
    "onended",
    "onformdata",
    "oninput",
    "oninvalid",
    "onkeydown",
    "onkeypress",
    "onkeyup",
    "onload",
    "onloadeddata",
    "onloadedmetadata",
    "onloadstart",
    "onmousedown",
    "onmouseenter",
    "onmouseleave",
    "onmousemove",
    "onmouseout",
    "onmouseover",
    "onmouseup",
    "onwheel",
    "onpaste",
    "onpause",
    "onplay",
    "onplaying",
    "onprogress",
    "onratechange",
    "onreset",
    "onresize",
    "onscroll",
    "onscrollend",
    "onsecuritypolicyviolation",
    "onseeked",
    "onseeking",
    "onselect",
    "onslotchange",
    "onstalled",
    "onsubmit",
    "onsuspend",
    "ontimeupdate",
    "onvolumechange",
    "onwaiting",
    "onselectstart",
    "onselectionchange",
    "ontoggle",
    "onpointercancel",
    "onpointerdown",
    "onpointerup",
    "onpointermove",
    "onpointerout",
    "onpointerover",
    "onpointerenter",
    "onpointerleave",
    "ongotpointercapture",
    "onlostpointercapture",
    "onanimationcancel",
    "onanimationend",
    "onanimationiteration",
    "onanimationstart",
    "ontransitioncancel",
    "ontransitionend",
    "ontransitionrun",
    "ontransitionstart",
    "onerror",
    "onfullscreenchange",
    "onfullscreenerror"
];
const CHUNK_SIZE = 8192;
const textEncoder = new TextEncoder();
const textDecoders = new Map();
const ENCODED_WORD_START = "=?";
const ENCODED_WORD_END = "?=";
const ENCODED_WORD_SEPARATOR = "?";
const QUOTED_PRINTABLE_LETTER = "q";
const BASE64_LETTER = "b";
const UNDERSCORE_REGEXP = /_/g;
// parameter names are case-insensitive
const CHARSET_REGEXP = /charset=([^;]+)/i;
const QUOTED_PARAMETER_REGEXP = /^([^=]+)=\s*"([^"]*)"\s*$/;
const UTF8_CHARSET = "utf-8";
const UTF16LE_CHARSET = "utf-16le";
const UTF16BE_CHARSET = "utf-16be";
const BOM_FE = 0xFE;
const BOM_FF = 0xFF;
const BOM_EF = 0xEF;
const BOM_BB = 0xBB;
const BOM_BF = 0xBF;

export {
    EVENT_HANDLER_ATTRIBUTES,
    decodeQuotedPrintable,
    decodeBinary,
    decodeMimeHeader,
    parseDOM,
    getResourceDOM,
    cacheResourceDOM,
    releaseResourceDOM,
    decodeBase64,
    decodeBase64Bytes,
    decodeString,
    encodeString,
    getCharset,
    getBomCharset,
    replaceCharset,
    isDocument,
    isStylesheet,
    isText,
    isImage,
    isPlainText,
    isMedia,
    isMultipart,
    isMultipartAlternative,
    getBoundary,
    indexOf,
    startsWithBoundary,
    isLineFeed,
    endsWithCRLF,
    endsWithLF,
    getResourceURI,
    normalizeLocation,
    resolvePath
};

function decodeQuotedPrintable(array) {
    // most lines carry no escape at all and can be returned as they are
    if (array.indexOf(0x3D) === -1) {
        return array;
    }
    // decoding only ever shrinks the data, so the input length bounds the output
    const result = new Uint8Array(array.length);
    let indexResult = 0;
    for (let i = 0; i < array.length; i++) {
        if (array[i] === 0x3D && isHex(array[i + 1]) && isHex(array[i + 2])) {
            result[indexResult++] = parseInt(String.fromCharCode(array[i + 1], array[i + 2]), 16);
            i += 2;
        } else {
            result[indexResult++] = array[i];
        }
    }
    return result.subarray(0, indexResult);

    function isHex(value) {
        return value >= 0x30 && value <= 0x39 || value >= 0x41 && value <= 0x46 || value >= 0x61 && value <= 0x66;
    }
}

function decodeBinary(array) {
    const parts = [];
    for (let i = 0; i < array.length; i += CHUNK_SIZE) {
        parts.push(String.fromCharCode.apply(null, array.subarray(i, Math.min(i + CHUNK_SIZE, array.length))));
    }
    return btoa(parts.join(""));
}

// returns the decoded bytes, or undefined when the value is not valid base64
function decodeBase64Bytes(value) {
    try {
        const binaryString = atob(value);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
        // eslint-disable-next-line no-unused-vars
    } catch (_) {
        // ignored
    }
}

function decodeBase64(value, charset) {
    const bytes = decodeBase64Bytes(value);
    return bytes === undefined ? value : decodeString(bytes, charset);
}

// RFC 2047: decode the "=?charset?encoding?value?=" words of a header, keeping the text around them.
// Consecutive words sharing a charset are decoded as one: a writer may split a multi-byte character
// across two of them (Chrome does it when it folds a long non-ASCII subject), and decoding each word
// on its own would turn both halves into replacement characters.
function decodeMimeHeader(header) {
    if (!header) {
        return "";
    }
    const parts = [];
    let index = 0;
    let pendingWord;
    while (index < header.length) {
        const start = header.indexOf(ENCODED_WORD_START, index);
        if (start === -1) {
            break;
        }
        const text = header.substring(index, start);
        const encodedWord = decodeEncodedWord(header, start);
        if (encodedWord === undefined) {
            flushPendingWord();
            parts.push(text + ENCODED_WORD_START);
            index = start + ENCODED_WORD_START.length;
        } else {
            // linear whitespace separating two adjacent encoded words is ignored
            if (text && (pendingWord === undefined || text.trim())) {
                flushPendingWord();
                parts.push(text);
            }
            if (pendingWord !== undefined && pendingWord.charset !== encodedWord.charset) {
                flushPendingWord();
            }
            if (pendingWord === undefined) {
                pendingWord = { charset: encodedWord.charset, chunks: [] };
            }
            pendingWord.chunks.push(encodedWord.bytes);
            index = encodedWord.end;
        }
    }
    flushPendingWord();
    parts.push(header.substring(index));
    return parts.join("");

    function flushPendingWord() {
        if (pendingWord !== undefined) {
            parts.push(decodeString(concatBytes(pendingWord.chunks), pendingWord.charset));
            pendingWord = undefined;
        }
    }
}

// returns the bytes the word carries, leaving the decoding to the caller so that a character split
// across two words can be put back together before any charset is applied
function decodeEncodedWord(header, start) {
    const endCharset = header.indexOf(ENCODED_WORD_SEPARATOR, start + ENCODED_WORD_START.length);
    if (endCharset === -1) {
        return;
    }
    const endEncoding = header.indexOf(ENCODED_WORD_SEPARATOR, endCharset + 1);
    if (endEncoding === -1) {
        return;
    }
    const endValue = header.indexOf(ENCODED_WORD_END, endEncoding + 1);
    if (endValue === -1) {
        return;
    }
    const charset = header.substring(start + ENCODED_WORD_START.length, endCharset).toLowerCase();
    const encoding = header.substring(endCharset + 1, endEncoding).toLowerCase();
    const value = header.substring(endEncoding + 1, endValue);
    const end = endValue + ENCODED_WORD_END.length;
    if (encoding === QUOTED_PRINTABLE_LETTER) {
        // in encoded words, "_" stands for a space
        return { charset, bytes: decodeQuotedPrintable(encodeString(value.replace(UNDERSCORE_REGEXP, " "))), end };
    } else if (encoding === BASE64_LETTER) {
        const bytes = decodeBase64Bytes(value);
        // an unusable value is kept as it was written, as if it had not been encoded at all
        return { charset, bytes: bytes === undefined ? encodeString(value) : bytes, end };
    }
}

function concatBytes(chunks) {
    if (chunks.length === 1) {
        return chunks[0];
    }
    const result = new Uint8Array(chunks.reduce((total, chunk) => total + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }
    return result;
}

function parseDOM(asset, contentType = "text/html", DOMParser = globalThis.DOMParser) {
    let document;
    try {
        document = new DOMParser().parseFromString(asset, contentType);
        // eslint-disable-next-line no-unused-vars
    } catch (_) {
        document = new DOMParser().parseFromString(asset, "text/html");
    }
    return {
        document,
        serialize() {
            let result = "";
            if (this.document.doctype) {
                result += serializeDocType(this.document.doctype) + "\n";
            }
            result += this.document.documentElement.outerHTML;
            return result;
        }
    };
}

// The tree a document was parsed into travels with its resource, so the parse done to read the
// charset declarations is the one the conversion walks instead of a repeat of it. The tree only
// stands for the string it was parsed from: it is returned while resource.data is that string,
// and parsed anew once the data changed. Both properties ride along non-enumerably, keeping a
// parse result serializable.
function getResourceDOM(resource, contentType, DOMParser) {
    if (resource.dom === undefined || resource.domData !== resource.data) {
        cacheResourceDOM(resource, parseDOM(resource.data, contentType, DOMParser));
    }
    return resource.dom;
}

function cacheResourceDOM(resource, dom) {
    Object.defineProperty(resource, "dom", { value: dom, configurable: true });
    Object.defineProperty(resource, "domData", { value: resource.data, configurable: true });
}

// handing the tree over to be mutated ends its life as a cache: a later reader must not walk a
// document that was already rewritten
function releaseResourceDOM(resource) {
    delete resource.dom;
    delete resource.domData;
}

function serializeDocType(doctype) {
    return `<!DOCTYPE ${doctype.name}${(doctype.publicId ? ` PUBLIC "${doctype.publicId}"` : "")}${(doctype.systemId ? ` "${doctype.systemId}"` : "")}>`;
}

function decodeString(array, charset) {
    let textDecoder = textDecoders.get(charset);
    if (!textDecoder) {
        try {
            textDecoder = new TextDecoder(charset);
            // eslint-disable-next-line no-unused-vars
        } catch (_) {
            // an unknown charset label falls back to UTF-8 instead of aborting the conversion
            textDecoder = new TextDecoder();
        }
        textDecoders.set(charset, textDecoder);
    }
    return textDecoder.decode(array);
}

function encodeString(string) {
    return textEncoder.encode(string);
}

function getCharset(contentType) {
    const charsetMatch = contentType.match(CHARSET_REGEXP);
    if (charsetMatch) {
        return removeQuotes(charsetMatch[1]).toLowerCase();
    }
}

// A byte order mark is the one charset declaration that cannot disagree with the bytes: whatever
// wrote them put it there, while a header or a meta element only records what someone believed
// afterwards. Both the CSS and the HTML syntax rules let it outrank every other source, which is
// what a stylesheet saved as UTF-16 relies on — it usually declares no charset at all, and read as
// UTF-8 it comes out with a NUL between every letter.
function getBomCharset(bytes) {
    if (bytes[0] === BOM_FF && bytes[1] === BOM_FE) {
        return UTF16LE_CHARSET;
    } else if (bytes[0] === BOM_FE && bytes[1] === BOM_FF) {
        return UTF16BE_CHARSET;
    } else if (bytes[0] === BOM_EF && bytes[1] === BOM_BB && bytes[2] === BOM_BF) {
        return UTF8_CHARSET;
    }
}

function removeQuotes(value) {
    return value.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1").trim();
}

function replaceCharset(contentType, charset) {
    return contentType.replace(CHARSET_REGEXP, `charset=${charset}`);
}

function isDocument(contentType) {
    return testContentType(contentType, "text/html") || testContentType(contentType, "application/xhtml+xml");
}

function isStylesheet(contentType) {
    return testContentType(contentType, "text/css");
}

function isText(contentType) {
    return testContentType(contentType, "text/");
}

function isImage(contentType) {
    return testContentType(contentType, "image/");
}

function isPlainText(contentType) {
    return testContentType(contentType, "text/plain");
}

// media a frame can display but that can never be markup. Deliberately not the complement of
// isDocument: a document is often mislabeled, application/octet-stream above all, and such a part
// still has to be converted rather than inlined as it is.
function isMedia(contentType) {
    return testContentType(contentType, "image/") || testContentType(contentType, "audio/") ||
        testContentType(contentType, "video/") || testContentType(contentType, "font/");
}

function isMultipart(contentType) {
    return testContentType(contentType, "multipart/");
}

function isMultipartAlternative(contentType) {
    return testContentType(contentType, "multipart/alternative");
}

// media types are case-insensitive, and a part may have no content type at all
function testContentType(contentType, type) {
    return Boolean(contentType) && contentType.toLowerCase().startsWith(type);
}

function getBoundary(contentType) {
    const contentTypeParams = contentType.split(";");
    contentTypeParams.shift();
    const boundaryParam = contentTypeParams.map(param => param.trim()).find(param => param.startsWith("boundary="));
    if (boundaryParam) {
        return removeQuotes(boundaryParam.substring(9));
    }
}

function indexOf(array, subarray) {
    if (!subarray || !subarray.length) {
        return -1;
    }
    const lastIndex = array.length - subarray.length;
    for (let i = 0; i <= lastIndex; i++) {
        if (array[i] === subarray[0]) {
            let match = true;
            for (let j = 1; j < subarray.length; j++) {
                if (array[i + j] !== subarray[j]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                // return index
                return i;
            }
        }
    }
    return -1;
}

function isLineFeed(array) {
    return array.length == 2 ? array[0] == 0x0D && array[1] == 0x0A : array.length == 1 ? array[0] == 0x0A : false;
}

function endsWithCRLF(array) {
    return array.length >= 2 ? array[array.length - 2] == 0x0D && array[array.length - 1] == 0x0A : array.length >= 1 ? array[array.length - 1] == 0x0D : false;
}

function endsWithLF(array) {
    return array.length >= 1 ? array[array.length - 1] == 0x0A : false;
}

function startsWithBoundary(array) {
    return array.length >= 2 ? array[0] == 0x2D && array[1] == 0x2D : false;
}

function getResourceURI({ contentType, transferEncoding, data }) {
    return `data:${getMediaType(contentType)};base64,${transferEncoding === "base64" ? data : decodeBinary(encodeString(data))}`;
}

// the media type of a data URI cannot contain whitespace (RFC 2397), and the quotes a header may
// put around a parameter value are not valid in a URL either
function getMediaType(contentType) {
    return contentType
        ? contentType.split(";").map(parameter => parameter.trim().replace(QUOTED_PARAMETER_REGEXP, "$1=$2")).join(";")
        : contentType;
}

// An absolute address is stored the way a reference to it will be resolved, so that the two match:
// references go through resolvePath, which percent-encodes, drops dot segments and default ports and
// lowercases the host, while a Content-Location is written by hand and does none of that. Anything
// that is not an absolute URL — a relative location, a Content-ID, a generated id — is left alone.
function normalizeLocation(value) {
    try {
        return new URL(value).href;
        // eslint-disable-next-line no-unused-vars
    } catch (_) {
        return value;
    }
}

function resolvePath(path, base) {
    if (base && !path.startsWith("data:")) {
        try {
            return new URL(path, base).href;
            // eslint-disable-next-line no-unused-vars
        } catch (_) {
            if (path.startsWith("//")) {
                const protocol = base.match(/^[^:]+/);
                if (protocol) {
                    return `${protocol[0]}:${path}`;
                } else {
                    return path;
                }
            } else {
                return path;
            }
        }
    } else {
        return path;
    }
}
