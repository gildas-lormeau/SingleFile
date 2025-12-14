/* global URL */

import {
    decodeMimeHeader,
    parseDOM,
    decodeBase64,
    decodeBinary,
    getCharset,
    getResourceURI,
    resolvePath,
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
const STYLESHEET_CONTENT_TYPE = "text/css";
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
const ORIGINAL_URL_FUNCTION_REGEXP = /url\(--mhtml-to-html-url\\\(\\"(.*?)\\"\\\)\\ /g;
const ORIGINAL_URL_COMMENT = "/* original URL: $1 */ url(";
const DEFAULT_CSP = "default-src 'none'; connect-src 'self' data:; font-src 'self' data:; img-src 'self' data:; style-src 'self' 'unsafe-inline' data:; frame-src 'self' data:; media-src 'self' data:; object-src 'self' data:; ";
const JS_ENABLED_CSP = "script-src 'self' 'unsafe-inline' data:;";
const JS_DISABLED_CSP = "script-src 'none';";
const CSS_FUNCTION_PARENTHESIS_START = "(";
const CSS_FUNCTION_PARENTHESIS_END = ") ";
const SUBJECT_HEADER = "Subject";
const DATE_HEADER = "Date";
const FROM_HEADER = "From";
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
        let missingResources = [];
        if (!fetch) {
            fetch = globalThis.fetch;
        }
        missingResources = convert(mhtml, config);
        missingResources = missingResources.filter(resource => !failedResources.includes(resource.id));
        if (missingResources.length) {
            await Promise.all(missingResources.map(async resource => {
                const { id, transferEncoding } = resource;
                let url = id;
                const urnErrorMatch = url.match(URN_ERROR_REGEXP);
                if (urnErrorMatch) {
                    url = urnErrorMatch[1];
                }
                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        resource.contentType = response.headers.get(CONTENT_TYPE_HEADER) || APPLICATION_OCTET_STREAM_CONTENT_TYPE;
                        if (transferEncoding === BASE64_ENCODING) {
                            const bytes = await response.bytes();
                            resource.data = decodeBinary(bytes);
                        } else {
                            resource.data = await response.text();
                        }
                        mhtml.resources[id] = resource;
                    } else if (!failedResources.includes(id)) {
                        failedResources.push(id);
                    }
                    // eslint-disable-next-line no-unused-vars
                } catch (_) {
                    if (!failedResources.includes(id)) {
                        failedResources.push(id);
                    }
                }
            }));
            return fetchAndConvert(mhtml, config, failedResources);
        } else {
            return convert(mhtml, { ...config, fetchMissingResources: false });
        }
    } else {
        return convert(mhtml, config);
    }
}

function convert({ headers, frames, resources, unfoundResources = new Set(), index, id }, { DOMParser, enableScripts, fetchMissingResources } = { DOMParser: globalThis.DOMParser }) {
    let resource = resources[index];
    if (!resource) {
        throw new Error(INDEX_PAGE_NOT_FOUND_ERROR);
    }
    let base = resource.id;
    if (resource.transferEncoding === BASE64_ENCODING) {
        resource.transferEncoding = undefined;
        resource.data = decodeBase64(resource.data, getCharset(resource.contentType));
    }
    const contentType = resource.contentType.split(CONTENT_TYPE_SEPARATOR)[0];
    const dom = parseDOM(resource.data, contentType, DOMParser);
    const document = dom.document;
    let nodes = [document];
    const baseElement = document.getElementsByTagName(BASE_TAG)[0];
    if (baseElement) {
        const href = baseElement.getAttribute(HREF_ATTRIBUTE);
        if (href) {
            base = resolvePath(href, base);
        }
        baseElement.remove();
    }
    if (!fetchMissingResources) {
        resource.used = true;
    }
    nodes = [document];
    let canonicalLinkElement;
    const stylesheets = {};
    const missingResources = [];
    const removedNodes = [];
    const favicons = [];
    let title;
    while (nodes.length) {
        const childNode = nodes.shift();
        if (childNode.childNodes) {
            for (const child of childNode.childNodes) {
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
                        const declarations = replaceStylesheetUrls(resources, base, { data: style }, { context: DECLARATION_LIST_CONTEXT }, stylesheets, fetchMissingResources && missingResources, unfoundResources);
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
                    EVENT_HANDLER_ATTRIBUTES.forEach(attribute => child.removeAttribute(attribute));
                }
                if (child.tagName && child.tagName.toUpperCase() === LINK_TAG && href) {
                    let rel = child.getAttribute(REL_ATTRIBUTE);
                    if (rel) {
                        rel = rel.toLowerCase();
                        if (rel === REL_ATTRIBUTE_STYLESHEET) {
                            resource = getResource(resources, href, child.getAttribute(HREF_ATTRIBUTE));
                            if (resource) {
                                let base = resource.id;
                                if (base.startsWith(CID_PROTOCOL)) {
                                    if (index.match(CID_REGEXP)) {
                                        base = id;
                                    } else {
                                        base = index;
                                    }
                                }
                                const stylesheet = replaceStylesheetUrls(resources, base, resource, { context: STYLESHEET_CONTEXT }, stylesheets, fetchMissingResources && missingResources, unfoundResources);
                                if (!fetchMissingResources) {
                                    const styleElement = document.createElement(STYLE_TAG);
                                    styleElement.type = STYLESHEET_CONTENT_TYPE;
                                    const media = child.getAttribute(MEDIA_ATTRIBUTE);
                                    if (media) {
                                        styleElement.setAttribute(MEDIA_ATTRIBUTE, media);
                                    }
                                    resource.used = true;
                                    resource.data = stylesheet;
                                    if (!href.startsWith(DATA_PROTOCOL)) {
                                        styleElement.setAttribute(ORIGINAL_URL_ATTRIBUTE_PREFIX + HREF_ATTRIBUTE, href);
                                    }
                                    styleElement.appendChild(document.createTextNode(resource.data));
                                    child.replaceWith(styleElement);
                                }
                            } else if (fetchMissingResources) {
                                addMissingResource(missingResources, href);
                            } else {
                                unfoundResources.add(href);
                                setAttribute(child, HREF_ATTRIBUTE, href);
                            }
                            if (!fetchMissingResources) {
                                const title = child.getAttribute(TITLE_ATTRIBUTE);
                                if (title && rel.includes(REL_ATTRIBUTE_ALTERNATE)) {
                                    removedNodes.push(child);
                                }
                            }
                        } else if (rel.includes(REL_ATTRIBUTE_ICON)) {
                            resource = getResource(resources, href, child.getAttribute(HREF_ATTRIBUTE));
                            const media = child.getAttribute(MEDIA_ATTRIBUTE);
                            const type = child.getAttribute(TYPE_ATTRIBUTE);
                            const sizes = child.getAttribute(SIZES_ATTRIBUTE);
                            if (resource) {
                                if (!fetchMissingResources) {
                                    resource.used = true;
                                    const resourceURI = getResourceURI(resource);
                                    setAttribute(child, HREF_ATTRIBUTE, resourceURI);
                                    favicons.push({ href: resourceURI, media, type, sizes, originalHref: href });
                                }
                            } else if (fetchMissingResources) {
                                addMissingResource(missingResources, href, BASE64_ENCODING);
                            } else {
                                unfoundResources.add(href);
                                setAttribute(child, HREF_ATTRIBUTE, href);
                                favicons.push({ href, media, type, sizes });
                            }
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
                } else if (child.tagName && child.tagName.toUpperCase() === STYLE_TAG) {
                    const style = replaceStylesheetUrls(resources, base, { data: child.textContent }, { context: STYLESHEET_CONTEXT }, stylesheets, fetchMissingResources && missingResources, unfoundResources);
                    if (!fetchMissingResources) {
                        const styleElement = document.createElement(STYLE_TAG);
                        styleElement.type = STYLESHEET_CONTENT_TYPE;
                        const media = child.getAttribute(MEDIA_ATTRIBUTE);
                        if (media) {
                            styleElement.setAttribute(MEDIA_ATTRIBUTE, media);
                        }
                        styleElement.appendChild(document.createTextNode(style));
                        child.replaceWith(styleElement);
                    }
                } else if (child.tagName && child.tagName.toUpperCase() === IMG_TAG || child.tagName && child.tagName.toUpperCase() === AUDIO_TAG || child.tagName && child.tagName.toUpperCase() === VIDEO_TAG || child.tagName && child.tagName.toUpperCase() === SOURCE_TAG || child.tagName && child.tagName.toUpperCase() === SCRIPT_TAG) {
                    if (src) {
                        resource = getResource(resources, src, child.getAttribute(SRC_ATTRIBUTE));
                        if (resource) {
                            if (!fetchMissingResources) {
                                resource.used = true;
                                setAttribute(child, SRC_ATTRIBUTE, getResourceURI(resource));
                            }
                        } else if (fetchMissingResources) {
                            addMissingResource(missingResources, src, BASE64_ENCODING);
                        } else {
                            unfoundResources.add(src);
                            setAttribute(child, SRC_ATTRIBUTE, src);
                        }
                    }
                    if (child.tagName && child.tagName.toUpperCase() === IMG_TAG || child.tagName && child.tagName.toUpperCase() === SOURCE_TAG) {
                        const srcset = child.getAttribute(SRCSET_ATTRIBUTE);
                        if (srcset) {
                            const srcsetData = srcsetParser.parse(srcset).map(data => {
                                const src = resolvePath(data.url, base);
                                const resource = getResource(resources, src, data.url);
                                if (resource) {
                                    if (!fetchMissingResources) {
                                        resource.used = true;
                                        data.url = getResourceURI(resource);
                                    }
                                } else if (fetchMissingResources) {
                                    addMissingResource(missingResources, src, BASE64_ENCODING);
                                } else {
                                    unfoundResources.add(src);
                                    data.url = src;
                                }
                                return data;
                            });
                            if (!fetchMissingResources) {
                                setAttribute(child, SRCSET_ATTRIBUTE, srcsetParser.serialize(srcsetData));
                            }
                        }
                    } else if (child.tagName && child.tagName.toUpperCase() === SCRIPT_TAG && !fetchMissingResources) {
                        let type = child.getAttribute(TYPE_ATTRIBUTE);
                        if (type) {
                            type = type.toLowerCase();
                        }
                        if (!enableScripts && (!type || type !== JSON_LD_CONTENT_TYPE)) {
                            removedNodes.push(child);
                        }
                    }
                } else if (child.tagName && child.tagName.toUpperCase() === BODY_TAG || child.tagName && child.tagName.toUpperCase() === TABLE_TAG || child.tagName && child.tagName.toUpperCase() === TD_TAG || child.tagName && child.tagName.toUpperCase() === TH_TAG) {
                    let background = child.getAttribute(BACKGROUND_ATTRIBUTE);
                    if (background && !background.startsWith(DATA_PROTOCOL)) {
                        background = resolvePath(background, base);
                        resource = getResource(resources, background, child.getAttribute(BACKGROUND_ATTRIBUTE));
                        if (resource) {
                            if (!fetchMissingResources) {
                                resource.used = true;
                                setAttribute(child, BACKGROUND_ATTRIBUTE, getResourceURI(resource));
                            }
                        } else if (fetchMissingResources) {
                            addMissingResource(missingResources, background, BASE64_ENCODING);
                        } else {
                            unfoundResources.add(background);
                            setAttribute(child, BACKGROUND_ATTRIBUTE, background);
                        }
                    }
                } else if (child.tagName && child.tagName.toUpperCase() === INPUT_TAG) {
                    const type = child.getAttribute(TYPE_ATTRIBUTE);
                    if (type && type.toLowerCase() === TYPE_ATTRIBUTE_IMAGE && src) {
                        resource = getResource(resources, src, child.getAttribute(SRC_ATTRIBUTE));
                        if (resource) {
                            if (!fetchMissingResources) {
                                resource.used = true;
                                setAttribute(child, SRC_ATTRIBUTE, getResourceURI(resource));
                            }
                        } else if (fetchMissingResources) {
                            addMissingResource(missingResources, src, BASE64_ENCODING);
                        } else {
                            unfoundResources.add(src);
                            setAttribute(child, SRC_ATTRIBUTE, src);
                        }
                    }
                } else if (child.tagName && child.tagName.toUpperCase() === IFRAME_TAG || child.tagName && child.tagName.toUpperCase() === FRAME_TAG || child.tagName && child.tagName.toUpperCase() === EMBED_TAG || child.tagName && child.tagName.toUpperCase() === OBJECT_TAG) {
                    let id, attribute;
                    if (child.tagName && child.tagName.toUpperCase() === OBJECT_TAG) {
                        attribute = DATA_ATTRIBUTE;
                        src = child.getAttribute(DATA_ATTRIBUTE);
                        if (src) {
                            src = resolvePath(src, base);
                        }
                    } else {
                        attribute = SRC_ATTRIBUTE;
                    }
                    if (src) {
                        if (src.startsWith(CID_PROTOCOL)) {
                            id = `<${src.split(CID_PROTOCOL)[1]}>`;
                            resource = frames[id];
                        } else {
                            id = src;
                            resource = getResource(resources, src, child.getAttribute(attribute));
                        }
                        if (resource) {
                            if (child.tagName && child.tagName.toUpperCase() === EMBED_TAG || child.tagName && child.tagName.toUpperCase() === OBJECT_TAG) {
                                if (!fetchMissingResources) {
                                    resource.used = true;
                                    setAttribute(child, attribute, getResourceURI(resource));
                                }
                            } else {
                                const result = convert({
                                    resources: Object.assign({}, resources, { [id]: resource }),
                                    unfoundResources,
                                    frames: frames,
                                    index: id,
                                    id: resource.id
                                }, { DOMParser, enableScripts, fetchMissingResources });
                                if (fetchMissingResources) {
                                    for (const missingResource of result) {
                                        if (!missingResources.find(resource => resource.id === missingResource.id)) {
                                            missingResources.push(missingResource);
                                        }
                                    }
                                } else {
                                    resource.used = true;
                                    if (child.tagName && child.tagName.toUpperCase() === IFRAME_TAG) {
                                        setAttribute(child, SRC_ATTRIBUTE);
                                        child.removeAttribute(SRC_ATTRIBUTE);
                                        child.setAttribute(SRCDOC_ATTRIBUTE, result.data);
                                    } else {
                                        setAttribute(child, attribute, DATA_PROTOCOL + TEXT_HTML_CONTENT_TYPE + DATA_URI_PAYLOAD_SEPARATOR + encodeURIComponent(result.data));
                                    }
                                }
                            }
                        } else if (fetchMissingResources) {
                            addMissingResource(missingResources, src);
                        } else {
                            unfoundResources.add(src);
                            setAttribute(child, attribute, src);
                        }
                    }
                } else if ((child.tagName && child.tagName.toUpperCase() === A_TAG || child.tagName && child.tagName.toUpperCase() === AREA_TAG) && !fetchMissingResources) {
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
                } else if (child.tagName && child.tagName.toUpperCase() === META_TAG && !fetchMissingResources) {
                    let httpEquiv = child.getAttribute(HTTP_EQUIV_ATTRIBUTE);
                    if (httpEquiv) {
                        httpEquiv = httpEquiv.toLowerCase();
                        if (httpEquiv === HTTP_EQUIV_ATTRIBUTE_REFRESH || httpEquiv === HTTP_EQUIV_ATTRIBUTE_CSP) {
                            removedNodes.push(child);
                        }
                    }
                } else if (child.tagName && child.tagName.toUpperCase() === TEMPLATE_TAG && !fetchMissingResources) {
                    const shadowModeAttribute = child.getAttribute(SHADOWMODE_ATTRIBUTE);
                    if (shadowModeAttribute) {
                        child.removeAttribute(SHADOWMODE_ATTRIBUTE);
                        child.setAttribute(SHADOWROOTMODE_ATTRIBUTE, shadowModeAttribute);
                    }
                    if (child.content) {
                        child.content.childNodes.forEach(node => nodes.push(node));
                    }
                } else if (child.tagName && child.tagName.toUpperCase() === TITLE_TAG && !fetchMissingResources && childNode.tagName && childNode.tagName.toUpperCase() === HEAD_TAG && title === undefined && child.textContent) {
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
        metaElement.setAttribute(CONTENT_ATTRIBUTE, csp);
        metaElement = document.createElement(META_TAG);
        metaElement.setAttribute(CHARSET_ATTRIBUTE, UTF8_CHARSET);
        document.head.prepend(metaElement);
        if (headers) {
            const pageInfoElement = document.createElement(SCRIPT_TAG);
            pageInfoElement.setAttribute(TYPE_ATTRIBUTE, JSON_LD_CONTENT_TYPE);
            pageInfoElement.appendChild(document.createTextNode(JSON.stringify(getPageInfo(headers, index), null, 2)));
            if (document.head.firstChild) {
                document.head.firstChild.after(pageInfoElement);
            } else {
                document.head.appendChild(pageInfoElement);
            }
        }
        if (unfoundResources.size) {
            unfoundResources.forEach(id => {
                if (!id.startsWith(DATA_PROTOCOL)) {
                    resources[id] = { id, notFound: true, used: true };
                }
            });
        }
        return {
            title,
            favicons,
            data: dom.serialize()
        };
    }
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
        if (stylesheets[resource.id]) {
            return stylesheets[resource.id].data;
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
                    const resource = getResource(resources, id, path);
                    if (resource) {
                        if (!missingResources) {
                            resource.used = true;
                            if (isStylesheet(resource.contentType)) {
                                resource.data = replaceStylesheetUrls(resources, resource.id, resource, { context: STYLESHEET_CONTEXT }, stylesheets, missingResources, unfoundResources);
                            }
                            node.value = getOriginalUrlFunction(id, getResourceURI(resource));
                        }
                    } else if (missingResources) {
                        addMissingResource(missingResources, id, BASE64_ENCODING);
                    } else {
                        unfoundResources.add(id);
                        node.value = getOriginalUrlFunction(id);
                    }
                }
            } else if (node.type === AT_RULE && node.name.toLowerCase() === IMPORT_RULE) {
                const path = node.prelude.children.first.value;
                if (!path.startsWith(DATA_PROTOCOL) && !path.startsWith(ORIGINAL_URL_FUNCTION_NAME)) {
                    const id = resolvePath(path, base);
                    const resource = getResource(resources, id, path);
                    if (resource) {
                        resource.data = replaceStylesheetUrls(resources, resource.id, resource, { context: STYLESHEET_CONTEXT }, stylesheets, missingResources, unfoundResources);
                        if (!missingResources) {
                            resource.used = true;
                            node.prelude.children.first.value = getOriginalUrlFunction(id, getResourceURI(resource));
                        }
                    } else if (missingResources) {
                        addMissingResource(missingResources, id);
                    } else {
                        unfoundResources.add(id);
                        node.prelude.children.first.value = getOriginalUrlFunction(id);
                    }
                }
            }
        });
        try {
            const result = cssTree.generate(ast);
            if (resource.id !== undefined) {
                stylesheets[resource.id].data = result;
            }
            return result.replace(ORIGINAL_URL_FUNCTION_REGEXP, ORIGINAL_URL_COMMENT);
            // eslint-disable-next-line no-unused-vars
        } catch (_) {
            return resource.data;
        }
    } else {
        return resource.data;
    }
}

function getResource(resources, id, rawId) {
    let resource = resources[id];
    if (!resource) {
        resource = resources[rawId];
    }
    return resource;
}

function addMissingResource(missingResources, id, transferEncoding) {
    if ((id.startsWith(HTTP_PROTOCOL) || id.startsWith(HTTPS_PROTOCOL) || id.startsWith(URN_PROTOCOL)) && !missingResources.find(resource => resource.id === id)) {
        missingResources.push({ id, transferEncoding });
    }
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
