import {
    decodeQuotedPrintable,
    decodeBinary,
    parseDOM,
    decodeString,
    encodeString,
    getCharset,
    replaceCharset,
    isDocument,
    isStylesheet,
    isText,
    isMultipartAlternative,
    getBoundary,
    indexOf,
    startsWithBoundary,
    isLineFeed,
    endsWithCRLF,
    endsWithLF
} from "./util.js";
import * as cssTree from "./vendor/csstree.esm.js";

const MHTML_HEADERS = 0;
const MTHML_CONTENT = 1;
const MHTML_DATA = 2;
const MHTML_END = 3;
const STRING_TYPE = "string";
const HEADER_SEPARATOR = ":";
const QUOTED_PRINTABLE_ENCODING = "quoted-printable";
const BINARY_ENCODING = "binary";
const CONTENT_TYPE_HEADER = "content-type";
const CONTENT_TRANSFER_ENCODING_HEADER = "content-transfer-encoding";
const CONTENT_ID_HEADER = "content-id";
const CONTENT_LOCATION_HEADER = "content-location";
const BASE64_ENCODING = "base64";
const UTF8_CHARSET = "utf-8";
const META_TAG = "META";
const CONTENT_ATTRIBUTE = "content";
const CHARSET_ATTRIBUTE = "charset";
const HTTP_EQUIV_ATTRIBUTE = "http-equiv";
const AT_RULE = "Atrule";
const CHARSET_IDENTIFIER = "charset";
const RANDOM_ID_PREFIX = "_";

export default parse;

function parse(mhtml, { DOMParser } = { DOMParser: globalThis.DOMParser }, context = { resources: {}, frames: {} }) {
    // deno-lint-ignore valid-typeof
    if (typeof mhtml === STRING_TYPE) {
        mhtml = encodeString(mhtml);
    }
    const headers = {};
    const { resources, frames } = context;
    let resource, transferEncoding, boundary, headerKey;
    let content = {};
    let state = MHTML_HEADERS;
    let indexMhtml = 0;
    let indexStartEmbeddedMhtml;
    while (state !== MHTML_END && indexMhtml < mhtml.length - 1) {
        let next;
        if (state === MHTML_HEADERS) {
            next = getLine();
            if (!isLineFeed(next)) {
                splitHeaders(next, headers);
            } else {
                if (headers[CONTENT_TYPE_HEADER]) {
                    boundary = getBoundary(headers[CONTENT_TYPE_HEADER]);
                }
                if (boundary) {
                    while (indexOf(next, boundary) === -1 && indexMhtml < mhtml.length - 1) {
                        next = getLine();
                    }
                } else {
                    const previousIndex = indexMhtml;
                    next = getLine(transferEncoding);
                    if (!boundary && startsWithBoundary(next)) {
                        boundary = decodeString(next);
                    } else {
                        indexMhtml = previousIndex;
                    }
                }
                content = {};
                state = MTHML_CONTENT;
            }
        } else if (state === MTHML_CONTENT) {
            if (boundary) {
                if (indexStartEmbeddedMhtml === undefined) {
                    indexStartEmbeddedMhtml = indexMhtml;
                }
                next = getLine();
                if (!isLineFeed(next)) {
                    splitHeaders(next, content);
                } else {
                    initResource(content);
                    if (!resource.contentType || !isMultipartAlternative(resource.contentType)) {
                        indexStartEmbeddedMhtml = undefined;
                    }
                    state = MHTML_DATA;
                }
            } else {
                initResource(headers);
                state = MHTML_DATA;
            }
        } else if (state === MHTML_DATA) {
            const indexEndData = parseResourceData();
            if (indexStartEmbeddedMhtml !== undefined && indexEndData !== undefined) {
                resource.used = true;
                context.index = convertEmbeddedMhtml(indexEndData);
            } else {
                processResource();
            }
            state = (indexMhtml >= mhtml.length - 1 ? MHTML_END : MTHML_CONTENT);
        }
    }
    return { headers, frames, resources, index: context.index };

    function getLine(transferEncoding) {
        const indexStart = indexMhtml;
        while (!isLineFeed([mhtml[indexMhtml]]) && indexMhtml++ < mhtml.length - 1);
        indexMhtml++;
        const line = mhtml.slice(indexStart, indexMhtml);
        return transferEncoding === QUOTED_PRINTABLE_ENCODING ? decodeQuotedPrintable(line) : line;
    }

    function splitHeaders(line, obj) {
        const lineString = decodeString(line);
        const indexColumn = lineString.indexOf(HEADER_SEPARATOR);
        if (indexColumn > -1) {
            headerKey = lineString.substring(0, indexColumn).trim().toLowerCase();
            obj[headerKey] = lineString.substring(indexColumn + 1, lineString.length).trim();
        } else {
            obj[headerKey] += lineString.trim();
        }
    }

    function initResource(resourceData) {
        transferEncoding = resourceData[CONTENT_TRANSFER_ENCODING_HEADER];
        const contentType = resourceData[CONTENT_TYPE_HEADER];
        const contentId = resourceData[CONTENT_ID_HEADER];
        let id = resourceData[CONTENT_LOCATION_HEADER];
        if (transferEncoding) {
            transferEncoding = transferEncoding.toLowerCase();
        }
        resource = {
            transferEncoding,
            contentType,
            data: [],
            id
        };
        if (id === undefined) {
            if (contentId !== undefined) {
                id = contentId;
            } else {
                do {
                    id = RANDOM_ID_PREFIX + Math.random().toString(36).substring(2);
                } while (resources[id]);
            }
            resource.id = id;
        }
        if (context.index === undefined && isDocument(contentType)) {
            context.index = id;
        }
        if (contentId !== undefined) {
            frames[contentId] = resource;
        }
        if (!resources[id]) {
            resources[id] = resource;
        }
        content = {};
    }

    function parseResourceData() {
        let next = getLine(transferEncoding);
        let indexEndData, boundaryFound;
        while (!boundaryFound && indexMhtml < mhtml.length - 1) {
            indexEndData = indexMhtml;
            const indexBoundary = indexOf(next, boundary);
            if (indexBoundary !== -1) {
                indexEndData = indexEndData - next.length + indexBoundary - 2;
                if (indexBoundary > 2) {
                    next = next.slice(0, indexBoundary - 2);
                } else {
                    next = [];
                }
                boundaryFound = true;
            }
            if (resource.transferEncoding === QUOTED_PRINTABLE_ENCODING) {
                if (resource.data.length > 2 && resource.data[resource.data.length - 3] === 0x3D && endsWithCRLF(next)) {
                    resource.data.splice(resource.data.length - 3, 3);
                } else if (resource.data.length > 1 && resource.data[resource.data.length - 2] === 0x3D && endsWithLF(next)) {
                    resource.data.splice(resource.data.length - 2, 2);
                }
            } else if (resource.transferEncoding === BASE64_ENCODING) {
                if (endsWithCRLF(next)) {
                    next = next.slice(0, next.length - 2);
                } else if (endsWithLF(next)) {
                    next = next.slice(0, next.length - 1);
                }
            }
            resource.data.splice(resource.data.length, 0, ...next);
            if (!boundaryFound) {
                next = getLine(transferEncoding);
            }
        }
        if (!boundaryFound && boundary) {
            indexEndData = indexMhtml;
        }
        return indexEndData;
    }

    function convertEmbeddedMhtml(indexEnd) {
        const context = { resources, frames };
        if (endsWithCRLF(mhtml)) {
            indexEnd -= 2;
        } else if (endsWithLF(mhtml)) {
            indexEnd--;
        }
        parse(mhtml.slice(indexStartEmbeddedMhtml, indexEnd), { DOMParser }, context);
        return context.index;
    }

    function processResource() {
        resource.data = resource.rawData = new Uint8Array(resource.data);
        const charset = resource.contentType ? getCharset(resource.contentType) : undefined;
        if (resource.transferEncoding === BINARY_ENCODING && (!resource.contentType || !isText(resource.contentType))) {
            resource.transferEncoding = BASE64_ENCODING;
            resource.data = decodeBinary(resource.data);
        } else {
            resource.data = decodeString(resource.data, charset);
        }
        if (resource.contentType) {
            resource.contentType = replaceCharset(resource.contentType, UTF8_CHARSET);
            if (isStylesheet(resource.contentType)) {
                processStylesheetCharset(charset);
            } else if (isDocument(resource.contentType)) {
                processDocumentCharset(charset);
            }
        }
        delete resource.rawData;
    }

    function processStylesheetCharset(charset) {
        try {
            let ast = cssTree.parse(resource.data);
            if (ast.children.first && ast.children.first.type === AT_RULE && ast.children.first.name.toLowerCase() === CHARSET_IDENTIFIER) {
                const charsetNode = ast.children.first;
                const cssCharset = charsetNode.prelude.children.first.value.toLowerCase();
                if (cssCharset !== UTF8_CHARSET && cssCharset !== charset) {
                    resource.data = decodeString(resource.rawData, cssCharset);
                    ast = cssTree.parse(resource.data);
                }
                ast.children.remove(ast.children.head);
                resource.data = cssTree.generate(ast);
            }
            // eslint-disable-next-line no-unused-vars
        } catch (_) {
            // ignored
        }
    }

    function processDocumentCharset(charset) {
        const contentType = resource.contentType.split(";")[0];
        let dom = parseDOM(resource.data, contentType, DOMParser);
        let charserMetaElement = getMetaCharsetElement(dom.document.documentElement);
        if (charserMetaElement) {
            let htmlCharset = charserMetaElement.getAttribute(CHARSET_ATTRIBUTE);
            if (htmlCharset) {
                htmlCharset = htmlCharset.toLowerCase();
                if (htmlCharset !== UTF8_CHARSET && htmlCharset !== charset) {
                    resource.data = decodeString(resource.rawData, charset);
                    dom = parseDOM(resource.data, contentType, DOMParser);
                    charserMetaElement = getMetaCharsetElement(dom.document.documentElement);
                }
            }
            if (charserMetaElement) {
                charserMetaElement.remove();
            }
            resource.data = dom.serialize();
        }
        let metaElement = getMetaContentTypeElement(dom.document);
        if (metaElement) {
            const contentType = metaElement.getAttribute(CONTENT_ATTRIBUTE);
            const htmlCharset = getCharset(contentType);
            if (htmlCharset && htmlCharset !== UTF8_CHARSET && htmlCharset !== charset) {
                resource.data = decodeString(resource.rawData, htmlCharset);
                dom = parseDOM(resource.data, contentType, DOMParser);
                metaElement = getMetaContentTypeElement(dom.document.documentElement);
            }
            if (metaElement) {
                metaElement.remove();
            }
            resource.data = dom.serialize();
        }
    }
}

function getMetaCharsetElement(document) {
    const metaElements = document.getElementsByTagName(META_TAG);
    return Array.from(metaElements).find(metaElement => metaElement.getAttribute(CHARSET_ATTRIBUTE));
}

function getMetaContentTypeElement(document) {
    const metaElements = document.getElementsByTagName(META_TAG);
    return Array.from(metaElements).find(metaElement => metaElement.getAttribute(HTTP_EQUIV_ATTRIBUTE)
        && metaElement.getAttribute(HTTP_EQUIV_ATTRIBUTE).toLowerCase() === CONTENT_TYPE_HEADER.toLowerCase());
}
