import {
    decodeQuotedPrintable,
    decodeBinary,
    decodeBase64Bytes,
    parseDOM,
    cacheResourceDOM,
    decodeString,
    encodeString,
    getCharset,
    getBomCharset,
    replaceCharset,
    isDocument,
    isStylesheet,
    isText,
    isMultipart,
    isMultipartAlternative,
    normalizeLocation,
    getBoundary,
    indexOf,
    startsWithBoundary,
    isLineFeed,
    endsWithCRLF,
    endsWithLF
} from "./util.js";
import * as cssTree from "./vendor/csstree.esm.js";

const MHTML_HEADERS = 0;
const MHTML_CONTENT = 1;
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
const GENERATED_ID_PREFIX = "_";
const TEXT_HTML_CONTENT_TYPE = "text/html";
const MISLABELED_DOCUMENT_ANOMALY = "document-mislabeled-as-archive";
const UNUSED_BOUNDARY_ANOMALY = "declared-boundary-unused";
const MISSING_DELIMITERS_ANOMALY = "multipart-without-delimiters";
const UNDECODABLE_BASE64_ANOMALY = "base64-left-encoded";
const LESS_THAN_SIGN = 0x3C;
// RFC 5322: a field name is printable ASCII without the colon; a folded value continues indented
const HEADER_NAME_REGEXP = /^[!-9;-~]+:/;
const HEADER_CONTINUATION_REGEXP = /^[ \t]/;
const REPLACEMENT_CHARACTER = "�";
const LINE_FEED = 0x0A;
const CARRIAGE_RETURN = 0x0D;
const HYPHEN_MINUS = 0x2D;
const SPACE = 0x20;
const HORIZONTAL_TAB = 0x09;
const EQUAL_SIGN = 0x3D;
const NUL = 0x00;

export default parse;

function parse(mhtml, { DOMParser } = { DOMParser: globalThis.DOMParser }, context = { resources: {}, frames: {} }) {
    // deno-lint-ignore valid-typeof
    if (typeof mhtml === STRING_TYPE) {
        mhtml = encodeString(mhtml);
    }
    const headers = {};
    // kept to decode again the headers a non-conforming writer emitted as raw bytes (see decodeRawHeaders)
    const rawHeaderLines = [];
    if (!context.anomalies) {
        context.anomalies = [];
    }
    const { resources, frames, anomalies } = context;
    let resource, transferEncoding, contentId, boundary, boundaryBytes, headerKey;
    let declaredBoundaryUnused;
    let content = {};
    let state = MHTML_HEADERS;
    let indexMhtml = 0;
    let indexGeneratedId = 0;
    let indexStartEmbeddedMhtml;
    // the extension is not a promise: Word saves plain HTML as .mht, and its markup would otherwise
    // be read as headers, the "urn:" prefixes of its namespaces passing for header names
    if (startsWithMarkup(mhtml)) {
        anomalies.push({ type: MISLABELED_DOCUMENT_ANOMALY });
        headers[CONTENT_TYPE_HEADER] = TEXT_HTML_CONTENT_TYPE;
        initResource(headers);
        appendData(resource.data, mhtml);
        processResource();
        return { headers, frames, resources, index: context.index, anomalies };
    }
    // the last line counts: a part whose body is empty ends the file on the blank line closing its
    // headers, and stopping a byte short would drop it — the document itself, in a file cut off there.
    // Once that line is read the resource still has to be recorded, hence the second condition.
    while (state !== MHTML_END && (indexMhtml < mhtml.length || state === MHTML_DATA)) {
        let next;
        if (state === MHTML_HEADERS) {
            next = getLine();
            if (!isLineFeed(next)) {
                rawHeaderLines.push(next);
                splitHeaders(next, headers);
            } else {
                if (headers[CONTENT_TYPE_HEADER]) {
                    setBoundary(getBoundary(headers[CONTENT_TYPE_HEADER]));
                }
                if (boundary) {
                    const indexStartBody = indexMhtml;
                    while (findBoundaryDelimiter(next, boundaryBytes) === -1 && indexMhtml < mhtml.length - 1) {
                        next = getLine();
                    }
                    // the declared boundary is not always the one the body uses: rather than read
                    // the whole file as a single part, go back and take the one it does use
                    if (findBoundaryDelimiter(next, boundaryBytes) === -1) {
                        indexMhtml = indexStartBody;
                        setBoundary(undefined);
                        declaredBoundaryUnused = true;
                    }
                }
                if (!boundary) {
                    const previousIndex = indexMhtml;
                    next = getLine(transferEncoding);
                    if (startsWithBoundary(next)) {
                        setBoundary(decodeString(next).substring(2).trimEnd());
                        // only reported when a replacement was found: a file whose delimiters
                        // never turn up at all is reported as missing them instead
                        if (declaredBoundaryUnused) {
                            anomalies.push({ type: UNUSED_BOUNDARY_ANOMALY });
                        }
                    } else {
                        indexMhtml = previousIndex;
                    }
                }
                content = {};
                state = MHTML_CONTENT;
            }
        } else if (state === MHTML_CONTENT) {
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
                // with no boundary the body is everything that is left, and headers describing a
                // container say nothing about it, so the body has to speak for itself
                const missingDelimiters = isMultipart(headers[CONTENT_TYPE_HEADER]);
                if (missingDelimiters) {
                    anomalies.push({ type: MISSING_DELIMITERS_ANOMALY });
                }
                initResource(missingDelimiters ? readBodyHeaders() : headers);
                state = MHTML_DATA;
            }
        } else if (state === MHTML_DATA) {
            const indexEndData = parseResourceData();
            if (indexStartEmbeddedMhtml !== undefined && indexEndData !== undefined) {
                resource.data = flattenData(resource.data);
                resource.used = true;
                context.index = convertEmbeddedMhtml(indexEndData);
            } else {
                processResource();
            }
            state = (indexMhtml >= mhtml.length - 1 ? MHTML_END : MHTML_CONTENT);
        }
    }
    return { headers, frames, resources, index: context.index, anomalies };

    function setBoundary(value) {
        boundary = value;
        boundaryBytes = value === undefined ? undefined : encodeString(value);
    }

    function getLine(transferEncoding) {
        const indexStart = indexMhtml;
        const indexLineFeed = mhtml.indexOf(LINE_FEED, indexStart);
        indexMhtml = indexLineFeed === -1 ? mhtml.length + 1 : indexLineFeed + 1;
        // a view, not a copy: every line is read or transformed, never written to
        const line = mhtml.subarray(indexStart, indexMhtml);
        return transferEncoding === QUOTED_PRINTABLE_ENCODING ? decodeQuotedPrintable(line) : line;
    }

    function splitHeaders(line, obj) {
        headerKey = parseHeaderLine(decodeString(line), obj, headerKey);
    }

    // RFC 5322 headers must be ASCII, but a localized writer can emit raw bytes in e.g. "From:" (IE
    // does it for the "Saved by ..." value). They are decoded as UTF-8 while the charset of the
    // document is still unknown, so decode them again once it is, and keep the ones that survived.
    function decodeRawHeaders(charset) {
        if (charset === undefined || charset === UTF8_CHARSET ||
            !Object.values(headers).some(value => value.includes(REPLACEMENT_CHARACTER))) {
            return;
        }
        const decodedHeaders = {};
        let decodedHeaderKey;
        for (const line of rawHeaderLines) {
            decodedHeaderKey = parseHeaderLine(decodeString(line, charset), decodedHeaders, decodedHeaderKey);
        }
        for (const [name, value] of Object.entries(headers)) {
            if (value.includes(REPLACEMENT_CHARACTER) && decodedHeaders[name] !== undefined) {
                headers[name] = decodedHeaders[name];
            }
        }
    }

    // The delimiters a multipart document promised never turned up. What follows the top-level
    // headers is then either the headers of the one part left, or its body already — so take
    // whichever it looks like, and give up on the container type either way.
    function readBodyHeaders() {
        const indexStartBody = indexMhtml;
        if (startsWithMarkup(mhtml.subarray(indexMhtml))) {
            return { [CONTENT_TYPE_HEADER]: TEXT_HTML_CONTENT_TYPE };
        }
        const bodyHeaders = {};
        headerKey = undefined;
        let indexBeforeLine = indexMhtml;
        let next = getLine();
        while (next.length && !isLineFeed(next) && isHeaderLine(next, Object.keys(bodyHeaders).length)) {
            splitHeaders(next, bodyHeaders);
            indexBeforeLine = indexMhtml;
            next = getLine();
        }
        if (bodyHeaders[CONTENT_TYPE_HEADER] === undefined) {
            indexMhtml = indexStartBody;
            return headers;
        }
        if (!isLineFeed(next)) {
            // the line was already part of the body
            indexMhtml = indexBeforeLine;
        }
        return bodyHeaders;
    }

    function isHeaderLine(line, countHeaders) {
        const value = decodeString(line);
        return HEADER_NAME_REGEXP.test(value) || (countHeaders > 0 && HEADER_CONTINUATION_REGEXP.test(value));
    }

    function initResource(resourceData) {
        transferEncoding = resourceData[CONTENT_TRANSFER_ENCODING_HEADER];
        const contentType = resourceData[CONTENT_TYPE_HEADER];
        contentId = resourceData[CONTENT_ID_HEADER];
        let id = resourceData[CONTENT_LOCATION_HEADER];
        if (transferEncoding) {
            transferEncoding = transferEncoding.toLowerCase();
        }
        resource = {
            transferEncoding,
            contentType,
            data: { chunks: [], length: 0 },
            id
        };
        if (id === undefined) {
            if (contentId !== undefined) {
                id = contentId;
            } else {
                do {
                    id = GENERATED_ID_PREFIX + indexGeneratedId++;
                } while (resources[id]);
            }
        }
        const writtenId = id;
        id = normalizeLocation(id);
        resource.id = id;
        if (context.index === undefined && isDocument(contentType)) {
            context.index = id;
        }
        if (contentId !== undefined) {
            frames[contentId] = resource;
            // also reachable as a resource, so that a cid: reference outside a frame finds it
            if (!resources[contentId]) {
                resources[contentId] = resource;
            }
        }
        if (!resources[id]) {
            resources[id] = resource;
        }
        // the address as it was written stays reachable, for a reference that is never normalized
        if (writtenId !== id && !resources[writtenId]) {
            resources[writtenId] = resource;
        }
        content = {};
        headerKey = undefined;
    }

    function parseResourceData() {
        let next = getLine(transferEncoding);
        let indexEndData, boundaryFound;
        while (!boundaryFound && next.length) {
            indexEndData = indexMhtml;
            const indexBoundary = findBoundaryDelimiter(next, boundaryBytes);
            if (indexBoundary !== -1) {
                indexEndData = indexEndData - next.length + indexBoundary - 2;
                if (indexBoundary > 2) {
                    next = next.subarray(0, indexBoundary - 2);
                } else {
                    next = [];
                }
                boundaryFound = true;
            }
            if (resource.transferEncoding === QUOTED_PRINTABLE_ENCODING) {
                if (resource.data.length > 2 && getDataByte(resource.data, 3) === EQUAL_SIGN && endsWithCRLF(next)) {
                    truncateData(resource.data, 3);
                } else if (resource.data.length > 1 && getDataByte(resource.data, 2) === EQUAL_SIGN && endsWithLF(next)) {
                    truncateData(resource.data, 2);
                }
            } else if (resource.transferEncoding === BASE64_ENCODING) {
                if (endsWithCRLF(next)) {
                    next = next.subarray(0, next.length - 2);
                } else if (endsWithLF(next)) {
                    next = next.subarray(0, next.length - 1);
                }
            }
            appendData(resource.data, next);
            if (!boundaryFound) {
                next = getLine(transferEncoding);
            }
        }
        truncateDataLineTerminator(resource.data);
        if (!boundaryFound && boundary) {
            indexEndData = indexMhtml;
        }
        return indexEndData;
    }

    function convertEmbeddedMhtml(indexEnd) {
        const context = { resources, frames, anomalies };
        const embeddedMhtml = mhtml.subarray(indexStartEmbeddedMhtml, indexEnd);
        if (endsWithCRLF(embeddedMhtml)) {
            indexEnd -= 2;
        } else if (endsWithLF(embeddedMhtml)) {
            indexEnd--;
        }
        parse(mhtml.subarray(indexStartEmbeddedMhtml, indexEnd), { DOMParser }, context);
        return context.index;
    }

    function processResource() {
        resource.data = resource.rawData = flattenData(resource.data);
        const declaredCharset = resource.contentType ? getCharset(resource.contentType) : undefined;
        // the parts shown as text — the main document, the framed documents and the stylesheets —
        // must be decoded here, otherwise the charset they declare cannot be detected and they are
        // decoded as UTF-8. Every other part is kept encoded: it is inlined as a data URI and must
        // stay byte-exact, even when it is mislabeled as text (e.g. a font served as text/plain, or
        // a photo served as text/html) — which is why a document is only decoded when a frame will
        // actually show it, that is when it is the index or carries a Content-ID.
        if (resource.transferEncoding === BASE64_ENCODING && resource.contentType &&
            (resource.id === context.index ||
                (contentId !== undefined && isDocument(resource.contentType)) ||
                isStylesheet(resource.contentType))) {
            const decodedData = decodeBase64Bytes(decodeString(resource.data));
            if (decodedData !== undefined) {
                resource.transferEncoding = undefined;
                resource.data = resource.rawData = decodedData;
            } else {
                // the part will be shown as the base64 text it carries, which is the one quiet
                // recovery worth pointing at when a page comes out wrong
                anomalies.push({ type: UNDECODABLE_BASE64_ANOMALY, id: resource.id });
            }
        }
        // read once the part is whole: a base64 stylesheet only shows its mark after being decoded
        const bomCharset = getBomCharset(resource.data);
        const charset = bomCharset || declaredCharset;
        if (resource.transferEncoding === BINARY_ENCODING && (!resource.contentType || !isText(resource.contentType))) {
            resource.transferEncoding = BASE64_ENCODING;
            resource.data = decodeBinary(resource.data);
        } else {
            resource.data = decodeString(resource.data, charset);
        }
        if (resource.contentType) {
            // the charset parameter is rewritten only when the bytes were transcoded: a part kept
            // encoded still carries the bytes as they were written, and relabeling them utf-8 would
            // put a lie in the data URI it is inlined as
            if (resource.transferEncoding !== BASE64_ENCODING) {
                resource.contentType = replaceCharset(resource.contentType, UTF8_CHARSET);
            }
            if (isStylesheet(resource.contentType)) {
                processStylesheetCharset(charset, bomCharset);
            } else if (isDocument(resource.contentType)) {
                const documentCharset = processDocumentCharset(charset, bomCharset);
                if (resource.id === context.index) {
                    decodeRawHeaders(documentCharset);
                }
            }
        }
        delete resource.rawData;
    }

    // the rule is removed whatever happens: it described the bytes as they were written, and says
    // nothing true about the UTF-8 the sheet is inlined as. Only the re-reading it can ask for is
    // refused when a byte order mark has already settled the question.
    function processStylesheetCharset(charset, bomCharset) {
        try {
            let ast = cssTree.parse(resource.data);
            if (ast.children.first && ast.children.first.type === AT_RULE && ast.children.first.name.toLowerCase() === CHARSET_IDENTIFIER) {
                const charsetNode = ast.children.first;
                const cssCharset = charsetNode.prelude.children.first.value.toLowerCase();
                if (bomCharset === undefined && cssCharset !== UTF8_CHARSET && cssCharset !== charset) {
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

    function processDocumentCharset(charset, bomCharset) {
        let documentCharset = charset;
        let modified = false;
        const contentType = resource.contentType.split(";")[0];
        let dom = parseDOM(resource.data, contentType, DOMParser);
        // the first declaration is the one a browser would have obeyed, so it alone decides how the
        // bytes are read; the others only have to go
        let charsetMetaElements = getMetaCharsetElements(dom.document.documentElement);
        if (charsetMetaElements.length) {
            let htmlCharset = charsetMetaElements[0].getAttribute(CHARSET_ATTRIBUTE);
            if (htmlCharset) {
                htmlCharset = htmlCharset.toLowerCase();
                if (bomCharset === undefined && htmlCharset !== UTF8_CHARSET && htmlCharset !== charset) {
                    resource.data = decodeString(resource.rawData, htmlCharset);
                    documentCharset = htmlCharset;
                    dom = parseDOM(resource.data, contentType, DOMParser);
                    charsetMetaElements = getMetaCharsetElements(dom.document.documentElement);
                }
            }
            charsetMetaElements.forEach(metaElement => metaElement.remove());
            modified = true;
        }
        let metaElements = getMetaContentTypeElements(dom.document.documentElement);
        if (metaElements.length) {
            const contentType = metaElements[0].getAttribute(CONTENT_ATTRIBUTE);
            const htmlCharset = getCharset(contentType);
            // measured against documentCharset, not the declared one: a document saying the same
            // thing twice — a meta charset then a meta http-equiv — has already been re-read above
            if (bomCharset === undefined && htmlCharset && htmlCharset !== UTF8_CHARSET && htmlCharset !== documentCharset) {
                resource.data = decodeString(resource.rawData, htmlCharset);
                documentCharset = htmlCharset;
                dom = parseDOM(resource.data, contentType, DOMParser);
                metaElements = getMetaContentTypeElements(dom.document.documentElement);
                // re-reading the raw bytes brought back the meta charset elements removed above
                getMetaCharsetElements(dom.document.documentElement).forEach(metaElement => metaElement.remove());
            }
            metaElements.forEach(metaElement => metaElement.remove());
            modified = true;
        }
        // one serialization at the end: with both kinds of declaration present it used to run twice
        if (modified) {
            resource.data = dom.serialize();
            // serializing is not idempotent — an attribute with an unwritable name leaves a gap,
            // script text has its closing markers escaped again — so the tree standing for the
            // serialized string has to be read back from it
            dom = parseDOM(resource.data, contentType, DOMParser);
        }
        // the tree built here is kept on the resource, sparing the conversion its own parse
        cacheResourceDOM(resource, dom);
        return documentCharset;
    }
}

function appendData(data, chunk) {
    if (chunk.length) {
        data.chunks.push(chunk);
        data.length += chunk.length;
    }
}

function getDataByte(data, offsetFromEnd) {
    let offset = offsetFromEnd;
    for (let indexChunk = data.chunks.length - 1; indexChunk >= 0; indexChunk--) {
        const chunk = data.chunks[indexChunk];
        if (chunk.length >= offset) {
            return chunk[chunk.length - offset];
        }
        offset -= chunk.length;
    }
}

// the line terminator preceding a boundary delimiter belongs to the delimiter, not to the resource
// a delimiter line is "--" followed by the boundary, an optional "--" closing the multipart body,
// then only transport padding: a line merely starting with the boundary is not a delimiter
function findBoundaryDelimiter(line, boundaryBytes) {
    const indexBoundary = indexOf(line, boundaryBytes);
    if (indexBoundary >= 2 && line[indexBoundary - 2] === HYPHEN_MINUS && line[indexBoundary - 1] === HYPHEN_MINUS) {
        let index = indexBoundary + boundaryBytes.length;
        if (line[index] === HYPHEN_MINUS && line[index + 1] === HYPHEN_MINUS) {
            index += 2;
        }
        while (line[index] === SPACE || line[index] === HORIZONTAL_TAB) {
            index++;
        }
        if (index >= line.length || line[index] === CARRIAGE_RETURN || line[index] === LINE_FEED) {
            return indexBoundary;
        }
    }
    return -1;
}

function truncateDataLineTerminator(data) {
    if (data.length > 1 && getDataByte(data, 2) === CARRIAGE_RETURN && getDataByte(data, 1) === LINE_FEED) {
        truncateData(data, 2);
    } else if (data.length > 0 && getDataByte(data, 1) === LINE_FEED) {
        truncateData(data, 1);
    }
}

function truncateData(data, count) {
    data.length -= count;
    let remaining = count;
    while (remaining) {
        const chunk = data.chunks[data.chunks.length - 1];
        if (chunk.length > remaining) {
            data.chunks[data.chunks.length - 1] = chunk.subarray(0, chunk.length - remaining);
            remaining = 0;
        } else {
            data.chunks.pop();
            remaining -= chunk.length;
        }
    }
}

function flattenData(data) {
    const result = new Uint8Array(data.length);
    let offset = 0;
    for (const chunk of data.chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }
    return result;
}

// a document begins with a tag, whitespace aside; anything else is read as an archive, so that a
// file which is neither is still reported rather than turned into a page of nonsense
function startsWithMarkup(array) {
    // a byte order mark only says how the text is encoded, so it is skipped; after a UTF-16 mark
    // the NUL half of each character is skipped too, whichever end it comes on
    const bomCharset = getBomCharset(array);
    let index = 0;
    let skipNul = false;
    if (bomCharset === UTF8_CHARSET) {
        index = 3;
    } else if (bomCharset !== undefined) {
        index = 2;
        skipNul = true;
    }
    for (; index < array.length; index++) {
        const byte = array[index];
        if (byte === LESS_THAN_SIGN) {
            return true;
        }
        if (skipNul && byte === NUL) {
            continue;
        }
        if (byte !== SPACE && byte !== HORIZONTAL_TAB && byte !== CARRIAGE_RETURN && byte !== LINE_FEED) {
            return false;
        }
    }
    return false;
}

function parseHeaderLine(lineString, obj, headerKey) {
    const indexColumn = lineString.indexOf(HEADER_SEPARATOR);
    if (indexColumn > -1) {
        headerKey = lineString.substring(0, indexColumn).trim().toLowerCase();
        obj[headerKey] = lineString.substring(indexColumn + 1, lineString.length).trim();
    } else if (headerKey !== undefined && obj[headerKey] !== undefined) {
        obj[headerKey] += lineString.trim();
    }
    return headerKey;
}

// all of them, not just the first: a page assembled from several templates declares its charset
// once per template, and a declaration left behind would outlive the bytes it described — the
// document is inlined as UTF-8, so any survivor is a lie about the text around it
function getMetaCharsetElements(document) {
    const metaElements = document.getElementsByTagName(META_TAG);
    return Array.from(metaElements).filter(metaElement => metaElement.getAttribute(CHARSET_ATTRIBUTE));
}

function getMetaContentTypeElements(document) {
    const metaElements = document.getElementsByTagName(META_TAG);
    return Array.from(metaElements).filter(metaElement => metaElement.getAttribute(HTTP_EQUIV_ATTRIBUTE)
        && metaElement.getAttribute(HTTP_EQUIV_ATTRIBUTE).toLowerCase() === CONTENT_TYPE_HEADER.toLowerCase());
}
