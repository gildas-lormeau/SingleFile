/* global URL, setTimeout */

import {
    decodeMimeHeader,
    getResourceDOM,
    releaseResourceDOM,
    decodeBase64,
    decodeBinary,
    getCharset,
    getResourceURI,
    resolvePath,
    isImage,
    isMedia,
    isPlainText,
    isStylesheet,
    EVENT_HANDLER_ATTRIBUTES
} from "./util.js";
import * as cssTree from "./vendor/csstree.esm.js";
import * as srcsetParser from "./srcset-parser.js";

const BASE64_ENCODING = "base64";
const HREF_ATTRIBUTE = "href";
const SRC_ATTRIBUTE = "src";
const TITLE_ATTRIBUTE = "title";
const SRCSET_ATTRIBUTE = "srcset";
const SRCDOC_ATTRIBUTE = "srcdoc";
const CONTENT_ATTRIBUTE = "content";
const STYLE_ATTRIBUTE = "style";
const MEDIA_ATTRIBUTE = "media";
const BACKGROUND_ATTRIBUTE = "background";
const REL_ATTRIBUTE = "rel";
const DATA_ATTRIBUTE = "data";
const TYPE_ATTRIBUTE = "type";
const PING_ATTRIBUTE = "ping";
const HTTP_EQUIV_ATTRIBUTE = "http-equiv";
const INTEGRITY_ATTRIBUTE = "integrity";
const CHARSET_ATTRIBUTE = "charset";
const SHADOWMODE_ATTRIBUTE = "shadowmode";
const SHADOWROOTMODE_ATTRIBUTE = "shadowrootmode";
const SIZES_ATTRIBUTE = "sizes";
const CID_PROTOCOL = "cid:";
const DATA_PROTOCOL = "data:";
const HTTP_PROTOCOL = "http:";
const HTTPS_PROTOCOL = "https:";
const URN_PROTOCOL = "urn:";
const AT_RULE = "Atrule";
const IMPORT_RULE = "import";
const URL_FUNCTION = "Url";
const STYLESHEET_CONTEXT = "stylesheet";
const DECLARATION_LIST_CONTEXT = "declarationList";
const BASE_TAG = "BASE";
const LINK_TAG = "LINK";
const STYLE_TAG = "STYLE";
const IMG_TAG = "IMG";
const AUDIO_TAG = "AUDIO";
const VIDEO_TAG = "VIDEO";
const SOURCE_TAG = "SOURCE";
const SCRIPT_TAG = "SCRIPT";
const BODY_TAG = "BODY";
const TABLE_TAG = "TABLE";
const TD_TAG = "TD";
const TH_TAG = "TH";
const INPUT_TAG = "INPUT";
const IFRAME_TAG = "IFRAME";
const FRAME_TAG = "FRAME";
const EMBED_TAG = "EMBED";
const OBJECT_TAG = "OBJECT";
const A_TAG = "A";
const AREA_TAG = "AREA";
const META_TAG = "META";
const TEMPLATE_TAG = "TEMPLATE";
const HEAD_TAG = "HEAD";
const TITLE_TAG = "TITLE";
const ORIGINAL_URL_FUNCTION_NAME = "--mhtml-to-html-url";
const ORIGINAL_URL_ATTRIBUTE_PREFIX = "data-original-";
const CONTENT_TYPE_HEADER = "Content-Type";
const REL_ATTRIBUTE_STYLESHEET = "stylesheet";
const REL_ATTRIBUTE_ICON = "icon";
const REL_ATTRIBUTE_CANONICAL = "canonical";
const REL_ATTRIBUTE_ALTERNATE = "alternate";
const HTTP_EQUIV_ATTRIBUTE_REFRESH = "refresh";
const HTTP_EQUIV_ATTRIBUTE_CSP = "content-security-policy";
const TYPE_ATTRIBUTE_IMAGE = "image";
const REL_SEPARATOR_REGEXP = /\s+/;
const REL_REMOVED_VALUES_REGEXP = /(preconnect|prerender|dns-prefetch|preload|prefetch|manifest|modulepreload)/gi;
const URN_ERROR_REGEXP = /^urn:[^:]+:(.+)$/;
const APPLICATION_OCTET_STREAM_CONTENT_TYPE = "application/octet-stream";
const JSON_LD_CONTENT_TYPE = "application/ld+json";
const TEXT_HTML_CONTENT_TYPE = "text/html";
const UTF8_CHARSET = "utf-8";
const INDEX_PAGE_NOT_FOUND_ERROR = "Index page not found";
const CID_REGEXP = /^<.+>$/;
const CONTENT_TYPE_SEPARATOR = ";";
const DATA_URI_PAYLOAD_SEPARATOR = ",";
const EMPTY_STRING = "";
const AMPERSAND_REGEXP = /&/g;
const LESS_THAN_REGEXP = /</g;
const ORIGINAL_URL_FUNCTION_REGEXP = /url\(--mhtml-to-html-url\\\(\\"(.*?)\\"\\\)\\ /g;
const ORIGINAL_URL_COMMENT = "/* original URL: $1 */ url(";
const DEFAULT_CSP = "default-src 'none'; connect-src 'self' data:; font-src 'self' data:; img-src 'self' data:; style-src 'self' 'unsafe-inline' data:; frame-src 'self' data:; media-src 'self' data:; object-src 'self' data:; ";
const JS_ENABLED_CSP = "script-src 'self' 'unsafe-inline' data:;";
const JS_DISABLED_CSP = "script-src 'none';";
const CSS_FUNCTION_PARENTHESIS_START = "(";
const CSS_FUNCTION_PARENTHESIS_END = ") ";
const RETRY_AFTER_HEADER = "Retry-After";
const TOO_MANY_REQUESTS_STATUS = 429;
const SERVER_ERROR_STATUS = 500;
const SERVER_ERROR_MAX_STATUS = 599;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_MAX_PARALLEL_REQUESTS = 16;
const RETRY_BASE_DELAY = 500;
const MAX_RETRY_DELAY = 5000;
const SYNTHESIZED_INDEX_ANOMALY = "index-synthesized";
const SUBJECT_HEADER = "subject";
const DATE_HEADER = "date";
const FROM_HEADER = "from";
const EVENT_HANDLER_ATTRIBUTE_SET = new Set(EVENT_HANDLER_ATTRIBUTES);
const JSON_LD_PAGE_INFO = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "additionalProperty": {
        "@type": "PropertyValue",
        "name": "savedBy"
    }
};

export default fetchAndConvert;

async function fetchAndConvert(mhtml, config, failedResources = []) {
    if (config.fetchMissingResources) {
        let { fetch } = config;
        if (!fetch) {
            fetch = globalThis.fetch;
        }
        let missingResources = convert(mhtml, config);
        missingResources = missingResources.filter(resource => !failedResources.includes(resource.id));
        if (missingResources.length) {
            await fetchResources(missingResources, mhtml, fetch, config, failedResources);
            return fetchAndConvert(mhtml, config, failedResources);
        } else {
            return convert(mhtml, { ...config, fetchMissingResources: false });
        }
    } else {
        return convert(mhtml, config);
    }
}

async function fetchResources(missingResources, mhtml, fetch, config, failedResources) {
    const { maxParallelRequests = DEFAULT_MAX_PARALLEL_REQUESTS } = config;
    const countWorkers = Math.max(1, Math.min(maxParallelRequests, missingResources.length));
    let indexResource = 0;
    await Promise.all(Array.from({ length: countWorkers }, async () => {
        while (indexResource < missingResources.length) {
            const resource = missingResources[indexResource++];
            const { id } = resource;
            if (await fetchResource(resource, fetch, config)) {
                mhtml.resources[id] = resource;
            } else if (!failedResources.includes(id)) {
                failedResources.push(id);
            }
        }
    }));
}

async function fetchResource(resource, fetch, { maxRetries = DEFAULT_MAX_RETRIES }) {
    const { id, transferEncoding } = resource;
    let url = id;
    const urnErrorMatch = url.match(URN_ERROR_REGEXP);
    if (urnErrorMatch) {
        url = urnErrorMatch[1];
    }
    for (let indexAttempt = 0; ; indexAttempt++) {
        let delay;
        try {
            const response = await fetch(url);
            if (response.ok) {
                resource.contentType = response.headers.get(CONTENT_TYPE_HEADER) || APPLICATION_OCTET_STREAM_CONTENT_TYPE;
                if (transferEncoding === BASE64_ENCODING) {
                    resource.data = decodeBinary(response.bytes
                        ? await response.bytes()
                        : new Uint8Array(await response.arrayBuffer()));
                } else {
                    resource.data = await response.text();
                }
                return true;
            }
            if (!isTransientStatus(response.status)) {
                return false;
            }
            delay = getRetryDelay(response, indexAttempt);
            // eslint-disable-next-line no-unused-vars
        } catch (_) {
            delay = getBackoffDelay(indexAttempt);
        }
        if (delay === undefined || indexAttempt >= maxRetries) {
            return false;
        }
        await wait(delay);
    }
}

function isTransientStatus(status) {
    return status === TOO_MANY_REQUESTS_STATUS || (status >= SERVER_ERROR_STATUS && status <= SERVER_ERROR_MAX_STATUS);
}

function getRetryDelay(response, indexAttempt) {
    const retryAfter = response.headers && response.headers.get(RETRY_AFTER_HEADER);
    if (retryAfter) {
        const delay = parseRetryAfter(retryAfter);
        return delay === undefined || delay > MAX_RETRY_DELAY ? undefined : delay;
    }
    return getBackoffDelay(indexAttempt);
}

function parseRetryAfter(retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) {
        return Math.max(0, seconds * 1000);
    }
    const date = Date.parse(retryAfter);
    if (!Number.isNaN(date)) {
        return Math.max(0, date - Date.now());
    }
}

function getBackoffDelay(indexAttempt) {
    return Math.min(RETRY_BASE_DELAY * Math.pow(2, indexAttempt), MAX_RETRY_DELAY);
}

function wait(delay) {
    return new Promise(resolve => setTimeout(resolve, delay));
}

function convert({ headers, frames, resources, unfoundResources = new Set(), index, id, anomalies = [] }, { DOMParser, enableScripts, fetchMissingResources } = { DOMParser: globalThis.DOMParser }) {
    let resource = resources[index];
    if (!resource) {
        // an archive does not have to hold a page: a browser saves a standalone image or text file
        // the same way, and presents it as a document built around that single resource
        resource = createDocument(resources);
        if (!resource) {
            throw new Error(INDEX_PAGE_NOT_FOUND_ERROR);
        }
        index = resource.id;
        if (!fetchMissingResources) {
            // reported on a copy rather than pushed into the parse result, so converting the same
            // archive again reports it once again instead of twice
            anomalies = [...anomalies, { type: SYNTHESIZED_INDEX_ANOMALY, id: index }];
        }
    }
    let base = resource.id;
    if (resource.transferEncoding === BASE64_ENCODING) {
        resource.transferEncoding = undefined;
        resource.data = decodeBase64(resource.data, getCharset(resource.contentType));
    }
    // a part is not required to declare a type, and parseDOM falls back to HTML when it does not
    const contentType = resource.contentType ? resource.contentType.split(CONTENT_TYPE_SEPARATOR)[0] : undefined;
    const dom = getResourceDOM(resource, contentType, DOMParser);
    if (!fetchMissingResources) {
        // the rewrite mutates the tree it walks, so the cached one is given up: were the same
        // document shown by two frames, the second would otherwise be rewritten twice over
        releaseResourceDOM(resource);
    }
    const document = dom.document;
    const nodes = [document];
    const baseElement = document.getElementsByTagName(BASE_TAG)[0];
    if (baseElement) {
        const href = baseElement.getAttribute(HREF_ATTRIBUTE);
        if (href) {
            base = resolvePath(href, base);
        }
        // the collecting walks share the cached tree, so the element they still need is only
        // removed by the rewriting one
        if (!fetchMissingResources) {
            baseElement.remove();
        }
    }
    if (!fetchMissingResources) {
        resource.used = true;
    }
    let canonicalLinkElement;
    const stylesheets = {};
    // its presence is what tells resolveReference which walk this is: collecting when set,
    // rewriting when not
    const missingResources = fetchMissingResources ? [] : undefined;
    const removedNodes = [];
    const favicons = [];
    let title;
    // a growing cursor rather than shift(): shifting re-indexes the whole queue on every node
    let indexNode = 0;
    while (indexNode < nodes.length) {
        const childNode = nodes[indexNode++];
        if (childNode.childNodes) {
            const parentTagName = childNode.tagName && childNode.tagName.toUpperCase();
            for (const child of childNode.childNodes) {
                const tagName = child.tagName && child.tagName.toUpperCase();
                let href, src;
                if (child.getAttribute) {
                    href = child.getAttribute(HREF_ATTRIBUTE);
                    if (href) {
                        href = resolvePath(href, base);
                    }
                    src = child.getAttribute(SRC_ATTRIBUTE);
                    if (src) {
                        src = resolvePath(src, base);
                    }
                    const style = child.getAttribute(STYLE_ATTRIBUTE);
                    if (style) {
                        const declarations = replaceStylesheetUrls(resources, base, { data: style }, { context: DECLARATION_LIST_CONTEXT }, stylesheets, missingResources, unfoundResources);
                        if (!fetchMissingResources) {
                            child.setAttribute(STYLE_ATTRIBUTE, declarations);
                        }
                    }
                    const integrity = child.getAttribute(INTEGRITY_ATTRIBUTE);
                    if (integrity) {
                        child.removeAttribute(INTEGRITY_ATTRIBUTE);
                    }
                }
                if (!enableScripts && child.removeAttribute) {
                    // driven by the attributes the element carries — usually none — rather than
                    // by one removal attempt per name on the list
                    if (child.getAttributeNames) {
                        for (const attributeName of child.getAttributeNames()) {
                            if (EVENT_HANDLER_ATTRIBUTE_SET.has(attributeName.toLowerCase())) {
                                child.removeAttribute(attributeName);
                            }
                        }
                    } else {
                        EVENT_HANDLER_ATTRIBUTES.forEach(attribute => child.removeAttribute(attribute));
                    }
                }
                if (tagName === LINK_TAG && href) {
                    let rel = child.getAttribute(REL_ATTRIBUTE);
                    if (rel) {
                        rel = rel.toLowerCase();
                        // rel holds an unordered set of keywords, so "stylesheet" is looked for
                        // among them rather than compared with the whole value
                        const relTokens = rel.trim().split(REL_SEPARATOR_REGEXP);
                        if (relTokens.includes(REL_ATTRIBUTE_STYLESHEET)) {
                            let stylesheet;
                            resolveReference(resources, missingResources, unfoundResources, {
                                id: href,
                                rawId: child.getAttribute(HREF_ATTRIBUTE),
                                descend(resource) {
                                    let base = resource.id;
                                    if (base.startsWith(CID_PROTOCOL)) {
                                        if (index.match(CID_REGEXP)) {
                                            base = id;
                                        } else {
                                            base = index;
                                        }
                                    }
                                    stylesheet = replaceStylesheetUrls(resources, base, resource, { context: STYLESHEET_CONTEXT }, stylesheets, missingResources, unfoundResources);
                                },
                                found(resource) {
                                    resource.data = stylesheet;
                                    const media = child.getAttribute(MEDIA_ATTRIBUTE);
                                    // a titled sheet belongs to a set the reader can switch between,
                                    // and an alternate one starts switched off. Turning it into a
                                    // style element would apply it whatever the reader chose, so it
                                    // stays a link and only the address it points at changes.
                                    if (child.getAttribute(TITLE_ATTRIBUTE) || relTokens.includes(REL_ATTRIBUTE_ALTERNATE)) {
                                        setAttribute(child, HREF_ATTRIBUTE, getResourceURI(resource));
                                    } else {
                                        const styleElement = document.createElement(STYLE_TAG);
                                        if (media) {
                                            styleElement.setAttribute(MEDIA_ATTRIBUTE, media);
                                        }
                                        if (!href.startsWith(DATA_PROTOCOL)) {
                                            styleElement.setAttribute(ORIGINAL_URL_ATTRIBUTE_PREFIX + HREF_ATTRIBUTE, href);
                                        }
                                        styleElement.appendChild(document.createTextNode(resource.data));
                                        child.replaceWith(styleElement);
                                    }
                                },
                                notFound() {
                                    setAttribute(child, HREF_ATTRIBUTE, href);
                                }
                            });
                        } else if (rel.includes(REL_ATTRIBUTE_ICON)) {
                            const media = child.getAttribute(MEDIA_ATTRIBUTE);
                            const type = child.getAttribute(TYPE_ATTRIBUTE);
                            const sizes = child.getAttribute(SIZES_ATTRIBUTE);
                            resolveReference(resources, missingResources, unfoundResources, {
                                id: href,
                                rawId: child.getAttribute(HREF_ATTRIBUTE),
                                encoding: BASE64_ENCODING,
                                found(resource) {
                                    const resourceURI = getResourceURI(resource);
                                    setAttribute(child, HREF_ATTRIBUTE, resourceURI);
                                    favicons.push({ href: resourceURI, media, type, sizes, originalHref: href });
                                },
                                notFound() {
                                    setAttribute(child, HREF_ATTRIBUTE, href);
                                    favicons.push({ href, media, type, sizes });
                                }
                            });
                        } else if (rel == REL_ATTRIBUTE_CANONICAL && !fetchMissingResources) {
                            canonicalLinkElement = child;
                        }
                        if (!fetchMissingResources) {
                            const relValue = rel
                                .replace(REL_REMOVED_VALUES_REGEXP, EMPTY_STRING)
                                .trim();
                            if (relValue.length) {
                                child.setAttribute(REL_ATTRIBUTE, relValue);
                            } else {
                                removedNodes.push(child);
                            }
                        }
                    }
                } else if (tagName === STYLE_TAG) {
                    const style = replaceStylesheetUrls(resources, base, { data: child.textContent }, { context: STYLESHEET_CONTEXT }, stylesheets, missingResources, unfoundResources);
                    if (!fetchMissingResources) {
                        const styleElement = document.createElement(STYLE_TAG);
                        const media = child.getAttribute(MEDIA_ATTRIBUTE);
                        if (media) {
                            styleElement.setAttribute(MEDIA_ATTRIBUTE, media);
                        }
                        // a titled style element belongs to a style set the reader can switch
                        // between, exactly like a titled link: losing the title would apply it
                        // whatever the reader chose
                        const title = child.getAttribute(TITLE_ATTRIBUTE);
                        if (title) {
                            styleElement.setAttribute(TITLE_ATTRIBUTE, title);
                        }
                        styleElement.appendChild(document.createTextNode(style));
                        child.replaceWith(styleElement);
                    }
                } else if (tagName === IMG_TAG || tagName === AUDIO_TAG || tagName === VIDEO_TAG || tagName === SOURCE_TAG || tagName === SCRIPT_TAG) {
                    if (src) {
                        resolveReference(resources, missingResources, unfoundResources, {
                            id: src,
                            rawId: child.getAttribute(SRC_ATTRIBUTE),
                            encoding: BASE64_ENCODING,
                            found(resource) {
                                setAttribute(child, SRC_ATTRIBUTE, getResourceURI(resource));
                            },
                            notFound() {
                                setAttribute(child, SRC_ATTRIBUTE, src);
                            }
                        });
                    }
                    if (tagName === IMG_TAG || tagName === SOURCE_TAG) {
                        const srcset = child.getAttribute(SRCSET_ATTRIBUTE);
                        if (srcset) {
                            const srcsetData = srcsetParser.parse(srcset).map(data => {
                                const src = resolvePath(data.url, base);
                                resolveReference(resources, missingResources, unfoundResources, {
                                    id: src,
                                    rawId: data.url,
                                    encoding: BASE64_ENCODING,
                                    found(resource) {
                                        data.url = getResourceURI(resource);
                                    },
                                    notFound() {
                                        data.url = src;
                                    }
                                });
                                return data;
                            });
                            if (!fetchMissingResources) {
                                setAttribute(child, SRCSET_ATTRIBUTE, srcsetParser.serialize(srcsetData));
                            }
                        }
                    } else if (tagName === SCRIPT_TAG && !fetchMissingResources) {
                        let type = child.getAttribute(TYPE_ATTRIBUTE);
                        if (type) {
                            type = type.toLowerCase();
                        }
                        if (!enableScripts && (!type || type !== JSON_LD_CONTENT_TYPE)) {
                            removedNodes.push(child);
                        }
                    }
                } else if (tagName === BODY_TAG || tagName === TABLE_TAG || tagName === TD_TAG || tagName === TH_TAG) {
                    let background = child.getAttribute(BACKGROUND_ATTRIBUTE);
                    if (background && !background.startsWith(DATA_PROTOCOL)) {
                        const resolvedBackground = resolvePath(background, base);
                        resolveReference(resources, missingResources, unfoundResources, {
                            id: resolvedBackground,
                            rawId: background,
                            encoding: BASE64_ENCODING,
                            found(resource) {
                                setAttribute(child, BACKGROUND_ATTRIBUTE, getResourceURI(resource));
                            },
                            notFound() {
                                setAttribute(child, BACKGROUND_ATTRIBUTE, resolvedBackground);
                            }
                        });
                    }
                } else if (tagName === INPUT_TAG) {
                    const type = child.getAttribute(TYPE_ATTRIBUTE);
                    if (type && type.toLowerCase() === TYPE_ATTRIBUTE_IMAGE && src) {
                        resolveReference(resources, missingResources, unfoundResources, {
                            id: src,
                            rawId: child.getAttribute(SRC_ATTRIBUTE),
                            encoding: BASE64_ENCODING,
                            found(resource) {
                                setAttribute(child, SRC_ATTRIBUTE, getResourceURI(resource));
                            },
                            notFound() {
                                setAttribute(child, SRC_ATTRIBUTE, src);
                            }
                        });
                    }
                } else if (tagName === IFRAME_TAG || tagName === FRAME_TAG || tagName === EMBED_TAG || tagName === OBJECT_TAG) {
                    let attribute;
                    if (tagName === OBJECT_TAG) {
                        attribute = DATA_ATTRIBUTE;
                        src = child.getAttribute(DATA_ATTRIBUTE);
                        if (src) {
                            src = resolvePath(src, base);
                        }
                    } else {
                        attribute = SRC_ATTRIBUTE;
                    }
                    if (src) {
                        let frameId, frameResource;
                        if (src.startsWith(CID_PROTOCOL)) {
                            frameId = `<${src.split(CID_PROTOCOL)[1]}>`;
                            frameResource = frames[frameId];
                        } else {
                            frameId = src;
                            frameResource = getResource(resources, src, child.getAttribute(attribute));
                        }
                        // a frame does not always hold a document: a tracking pixel is saved as an
                        // image part, and converting it would parse its bytes as markup
                        if (frameResource && !(tagName === EMBED_TAG || tagName === OBJECT_TAG || isMedia(frameResource.contentType))) {
                            const result = convert({
                                resources: Object.assign({}, resources, { [frameId]: frameResource }),
                                unfoundResources,
                                frames: frames,
                                index: frameId,
                                id: frameResource.id
                            }, { DOMParser, enableScripts, fetchMissingResources });
                            if (fetchMissingResources) {
                                for (const missingResource of result) {
                                    if (!missingResources.find(resource => resource.id === missingResource.id)) {
                                        missingResources.push(missingResource);
                                    }
                                }
                            } else {
                                frameResource.used = true;
                                if (tagName === IFRAME_TAG) {
                                    setAttribute(child, SRC_ATTRIBUTE);
                                    child.removeAttribute(SRC_ATTRIBUTE);
                                    child.setAttribute(SRCDOC_ATTRIBUTE, result.data);
                                } else {
                                    setAttribute(child, attribute, DATA_PROTOCOL + TEXT_HTML_CONTENT_TYPE + DATA_URI_PAYLOAD_SEPARATOR + encodeURIComponent(result.data));
                                }
                            }
                        } else {
                            resolveReference(resources, missingResources, unfoundResources, {
                                id: src,
                                resource: frameResource,
                                found(resource) {
                                    setAttribute(child, attribute, getResourceURI(resource));
                                },
                                notFound() {
                                    setAttribute(child, attribute, src);
                                }
                            });
                        }
                    }
                } else if ((tagName === A_TAG || tagName === AREA_TAG) && !fetchMissingResources) {
                    if (href) {
                        try {
                            const url = new URL(child.getAttribute(HREF_ATTRIBUTE), base);
                            const hash = url.hash;
                            url.hash = EMPTY_STRING;
                            if (url == base && hash) {
                                child.setAttribute(HREF_ATTRIBUTE, hash);
                            } else {
                                child.setAttribute(HREF_ATTRIBUTE, href);
                            }
                            // eslint-disable-next-line no-unused-vars
                        } catch (_) {
                            child.setAttribute(HREF_ATTRIBUTE, href);
                        }
                    }
                    child.removeAttribute(PING_ATTRIBUTE);
                } else if (tagName === META_TAG && !fetchMissingResources) {
                    let httpEquiv = child.getAttribute(HTTP_EQUIV_ATTRIBUTE);
                    if (httpEquiv) {
                        httpEquiv = httpEquiv.toLowerCase();
                        if (httpEquiv === HTTP_EQUIV_ATTRIBUTE_REFRESH || httpEquiv === HTTP_EQUIV_ATTRIBUTE_CSP) {
                            removedNodes.push(child);
                        }
                    }
                } else if (tagName === TEMPLATE_TAG && !fetchMissingResources) {
                    const shadowModeAttribute = child.getAttribute(SHADOWMODE_ATTRIBUTE);
                    if (shadowModeAttribute) {
                        child.removeAttribute(SHADOWMODE_ATTRIBUTE);
                        child.setAttribute(SHADOWROOTMODE_ATTRIBUTE, shadowModeAttribute);
                    }
                    if (child.content) {
                        nodes.push(child.content);
                    }
                } else if (tagName === TITLE_TAG && !fetchMissingResources && parentTagName === HEAD_TAG && title === undefined && child.textContent) {
                    title = child.textContent;
                }
                nodes.push(child);
            }
        }
    }
    if (fetchMissingResources) {
        return missingResources;
    } else {
        removedNodes.forEach(node => node.remove());
        if (!canonicalLinkElement) {
            const linkElement = document.createElement(LINK_TAG);
            linkElement.setAttribute(REL_ATTRIBUTE, REL_ATTRIBUTE_CANONICAL);
            linkElement.setAttribute(HREF_ATTRIBUTE, index);
            document.head.appendChild(linkElement);
        }
        let metaElement = document.createElement(META_TAG);
        metaElement.setAttribute(HTTP_EQUIV_ATTRIBUTE, HTTP_EQUIV_ATTRIBUTE_CSP);
        let csp = DEFAULT_CSP;
        if (enableScripts) {
            csp += JS_ENABLED_CSP;
        } else {
            csp += JS_DISABLED_CSP;
        }
        metaElement.setAttribute(CONTENT_ATTRIBUTE, csp);
        if (document.head.firstChild) {
            document.head.prepend(metaElement);
        } else {
            document.head.appendChild(metaElement);
        }
        metaElement = document.createElement(META_TAG);
        metaElement.setAttribute(CHARSET_ATTRIBUTE, UTF8_CHARSET);
        document.head.prepend(metaElement);
        if (headers) {
            const pageInfoElement = document.createElement(SCRIPT_TAG);
            pageInfoElement.setAttribute(TYPE_ATTRIBUTE, JSON_LD_CONTENT_TYPE);
            pageInfoElement.appendChild(document.createTextNode(JSON.stringify(getPageInfo(headers, index), null, 2)));
            document.head.firstChild.after(pageInfoElement);
        }
        const unfoundResourceIds = [];
        if (unfoundResources.size) {
            unfoundResources.forEach(id => {
                if (!id.startsWith(DATA_PROTOCOL)) {
                    resources[id] = { id, notFound: true, used: true };
                    unfoundResourceIds.push(id);
                }
            });
        }
        return {
            title,
            favicons,
            // the addresses left pointing outside the page, so a caller can tell an archive that
            // converted whole from one with holes without diffing the markup
            unfoundResources: unfoundResourceIds,
            // what was wrong with the archive and recovered from, mirrored from the parse result
            // for the callers that never see one
            anomalies,
            data: dom.serialize()
        };
    }
}

// Builds the document a browser would show for an archive that holds no page, around the first part
// it knows how to present. Anything else is left for the caller to reject.
function createDocument(resources) {
    for (const resource of Object.values(resources)) {
        const { contentType } = resource;
        if (isImage(contentType)) {
            return { ...resource, contentType: TEXT_HTML_CONTENT_TYPE, transferEncoding: undefined,
                data: `<html><body><img src="${getResourceURI(resource)}"></body></html>` };
        } else if (isPlainText(contentType)) {
            // only documents and stylesheets are decoded at parse time, so the text may still be
            // carried as base64 here
            const text = resource.transferEncoding === BASE64_ENCODING
                ? decodeBase64(String(resource.data), getCharset(contentType))
                : String(resource.data);
            return { ...resource, contentType: TEXT_HTML_CONTENT_TYPE, transferEncoding: undefined,
                data: `<html><body><pre>${escapeText(text)}</pre></body></html>` };
        }
    }
}

function escapeText(value) {
    return value.replace(AMPERSAND_REGEXP, "&amp;").replace(LESS_THAN_REGEXP, "&lt;");
}

function setAttribute(element, attribute, newValue) {
    const value = element.getAttribute(attribute);
    if (value && !value.startsWith(DATA_PROTOCOL) && value !== newValue) {
        element.setAttribute(ORIGINAL_URL_ATTRIBUTE_PREFIX + attribute, value);
    }
    if (newValue !== undefined) {
        element.setAttribute(attribute, newValue);
    }
}

function replaceStylesheetUrls(resources, base, resource, options = {}, stylesheets, missingResources, unfoundResources) {
    let ast;
    if (resource.id !== undefined) {
        const stylesheet = stylesheets[resource.id];
        if (stylesheet) {
            return stylesheet.data === undefined ? resource.data : stylesheet.data;
        } else {
            stylesheets[resource.id] = {};
        }
    }
    try {
        ast = cssTree.parse(resource.data, options);
        // eslint-disable-next-line no-unused-vars
    } catch (_) {
        // ignored
    }
    if (ast) {
        cssTree.walk(ast, node => {
            if (node.type === URL_FUNCTION) {
                const path = node.value;
                if (!path.startsWith(DATA_PROTOCOL) && !path.startsWith(ORIGINAL_URL_FUNCTION_NAME)) {
                    const id = resolvePath(path, base);
                    resolveReference(resources, missingResources, unfoundResources, {
                        id,
                        rawId: path,
                        encoding: BASE64_ENCODING,
                        found(resource) {
                            if (isStylesheet(resource.contentType)) {
                                resource.data = replaceStylesheetUrls(resources, resource.id, resource, { context: STYLESHEET_CONTEXT }, stylesheets, missingResources, unfoundResources);
                            }
                            node.value = getOriginalUrlFunction(id, getResourceURI(resource));
                        },
                        notFound() {
                            node.value = getOriginalUrlFunction(id);
                        }
                    });
                }
            } else if (node.type === AT_RULE && node.name.toLowerCase() === IMPORT_RULE) {
                // a broken @import may have no prelude at all ("@import;"), or one that holds
                // neither a url nor a string — such a rule imports nothing and is left alone
                const importNode = node.prelude && node.prelude.children && node.prelude.children.first;
                const path = importNode && importNode.value;
                if (path && !path.startsWith(DATA_PROTOCOL) && !path.startsWith(ORIGINAL_URL_FUNCTION_NAME)) {
                    const id = resolvePath(path, base);
                    resolveReference(resources, missingResources, unfoundResources, {
                        id,
                        rawId: path,
                        descend(resource) {
                            resource.data = replaceStylesheetUrls(resources, resource.id, resource, { context: STYLESHEET_CONTEXT }, stylesheets, missingResources, unfoundResources);
                        },
                        found(resource) {
                            setImportUrl(importNode, getOriginalUrlFunction(id, getResourceURI(resource)));
                        },
                        notFound() {
                            setImportUrl(importNode, getOriginalUrlFunction(id));
                        }
                    });
                }
            }
        });
        try {
            const result = cssTree.generate(ast).replace(ORIGINAL_URL_FUNCTION_REGEXP, ORIGINAL_URL_COMMENT);
            if (resource.id !== undefined) {
                stylesheets[resource.id].data = result;
            }
            return result;
            // eslint-disable-next-line no-unused-vars
        } catch (_) {
            return resource.data;
        }
    } else {
        return resource.data;
    }
}

// The one place where the collecting walk and the rewriting walk part ways over a reference.
// When missingResources is set the walk is collecting: an unresolved reference is recorded there
// and a resolved one is left alone. Otherwise the walk is rewriting: a resolved reference is
// marked used and handed to found, an unresolved one is recorded and handed to notFound.
// descend runs in both walks, so a stylesheet reached through a reference exposes its own
// references during collection too. A caller that resolved the reference itself passes resource.
function resolveReference(resources, missingResources, unfoundResources, reference) {
    const resource = "resource" in reference ? reference.resource : getResource(resources, reference.id, reference.rawId);
    if (resource) {
        if (reference.descend) {
            reference.descend(resource);
        }
        if (!missingResources) {
            resource.used = true;
            reference.found(resource);
        }
    } else if (missingResources) {
        addMissingResource(missingResources, reference.id, reference.encoding);
    } else {
        unfoundResources.add(reference.id);
        reference.notFound();
    }
}

function getResource(resources, id, rawId) {
    let resource = resources[id];
    if (!resource) {
        resource = resources[rawId];
    }
    // outside a frame a cid: reference is resolved here: it addresses a part by its Content-ID,
    // which is stored with the angle brackets the header carries
    if (!resource && id && id.startsWith(CID_PROTOCOL)) {
        resource = resources[`<${id.substring(CID_PROTOCOL.length)}>`];
    }
    // a reference carrying a fragment is deliberately not matched against the resource without it:
    // an SVG sprite is addressed as sprite.svg#icon once per icon, and inlining the whole sheet
    // every time would both multiply it and lose the fragment that selects the icon
    return resource;
}

function addMissingResource(missingResources, id, transferEncoding) {
    if ((id.startsWith(HTTP_PROTOCOL) || id.startsWith(HTTPS_PROTOCOL) || id.startsWith(URN_PROTOCOL)) && !missingResources.find(resource => resource.id === id)) {
        missingResources.push({ id, transferEncoding });
    }
}

// `@import` accepts both `url("...")` and a bare string. The marker left for the original URL is
// only recognized inside `url()`, so a string prelude is turned into one before it is written.
function setImportUrl(importNode, value) {
    importNode.type = URL_FUNCTION;
    importNode.value = value;
}

function getOriginalUrlFunction(id, resourceURI = id) {
    return ORIGINAL_URL_FUNCTION_NAME + CSS_FUNCTION_PARENTHESIS_START + JSON.stringify(id) + CSS_FUNCTION_PARENTHESIS_END + resourceURI;
}

function getPageInfo(headers, index) {
    return {
        ...JSON_LD_PAGE_INFO,
        url: index,
        name: decodeMimeHeader(headers[SUBJECT_HEADER]),
        dateCreated: headers[DATE_HEADER],
        additionalProperty: {
            ...JSON_LD_PAGE_INFO.additionalProperty,
            value: decodeMimeHeader(headers[FROM_HEADER])
        }
    };
}
