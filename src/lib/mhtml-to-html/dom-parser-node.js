import { parse, defaultTreeAdapter, html } from "parse5";

const { NS, TAG_NAMES, ATTRS } = html;
const VOID_TAG_NAMES = new Set([
    TAG_NAMES.AREA,
    TAG_NAMES.BASE,
    TAG_NAMES.BASEFONT,
    TAG_NAMES.BGSOUND,
    TAG_NAMES.BR,
    TAG_NAMES.COL,
    TAG_NAMES.COMMAND,
    TAG_NAMES.EMBED,
    TAG_NAMES.FRAME,
    TAG_NAMES.HR,
    TAG_NAMES.IMG,
    TAG_NAMES.INPUT,
    TAG_NAMES.KEYGEN,
    TAG_NAMES.LINK,
    TAG_NAMES.META,
    TAG_NAMES.PARAM,
    TAG_NAMES.SOURCE,
    TAG_NAMES.TRACK,
    TAG_NAMES.WBR
]);
const RAW_TEXT_NODE_TAG_NAMES = new Set([
    TAG_NAMES.STYLE,
    TAG_NAMES.SCRIPT,
    TAG_NAMES.XMP,
    TAG_NAMES.IFRAME,
    TAG_NAMES.NOEMBED,
    TAG_NAMES.NOFRAMES,
    TAG_NAMES.PLAINTEXT,
    TAG_NAMES.NOSCRIPT
]);
const JAVASCRIPT_MIME_TYPE = "text/javascript";
const DOCTYPE_PROPERTY_NAME = "doctype";
const DOCUMENT_ELEMENT_PROPERTY_NAME = "documentElement";
const HEAD_PROPERTY_NAME = "head";
const FIRST_CHILD_PROPERTY_NAME = "firstChild";
const TEXT_CONTENT_PROPERTY_NAME = "textContent";
const OUTER_HTML_PROPERTY_NAME = "outerHTML";
const TEXT_NODE_NAME = "#text";
const COMMENT_NODE_NAME = "#comment";
const DOCTYPE_NODE_NAME = "#documentType";
const AMPERSAND_ENTITY = "&amp;";
const QUOTE_ENTITY = "&quot;";
const NON_BREAKING_SPACE_ENTITY = "&nbsp;";
const LESS_THAN_ENTITY = "&lt;";
const GREATER_THAN_ENTITY = "&gt;";
const XLINK_PREFIX = "xlink";
const XMLNS_PREFIX = "xmlns";
const XML_PREFIX = "xml";
const TEXT_ESCAPE_REGEXP = /[&\u00a0<>]/g;
const TEXT_ESCAPE_ENTITIES = {
    "&": AMPERSAND_ENTITY,
    "\u00a0": NON_BREAKING_SPACE_ENTITY,
    "<": LESS_THAN_ENTITY,
    ">": GREATER_THAN_ENTITY
};
const ATTRIBUTE_ESCAPE_REGEXP = /[&\u00a0"]/g;
const ATTRIBUTE_ESCAPE_ENTITIES = {
    "&": AMPERSAND_ENTITY,
    "\u00a0": NON_BREAKING_SPACE_ENTITY,
    "\"": QUOTE_ENTITY
};
const INVALID_TAG_NAME_REGEXP = /["'>/=]/;
const OPENING_TAG_MARKER = "<";
const CLOSING_ANGLE_BRACKET = ">";
const CLOSING_TAG_MARKER = "</";
const CLOSING_TAG_MARKER_REGEXP = /<\//gi;
const ESCAPED_CLOSING_TAG_MARKER = "<\\/";
// a marker already carrying its backslash is left alone, so serializing twice writes the same
// text as serializing once
const SELF_CLOSING_TAG_MARKER_REGEXP = /(?<!\\)\/>/gi;
const ESCAPED_SELF_CLOSING_TAG_MARKER = "\\/>";
const COMMENT_START_MARKER = "<!--";
const COMMENT_END_MARKER = "-->";
const ATTRIBUTE_PREFIX_SEPARATOR = ":";
const ATTRIBUTE_VALUE_SEPARATOR = "=";
const EMPTY_STRING = "";
const SPACE_CHARACTER = " ";
const QUOTE_CHARACTER = "\"";

const treeAdapter = {
    ...defaultTreeAdapter,
    createDocument() {
        const document = defaultTreeAdapter.createDocument();
        document.createElement = function (tagName) {
            return treeAdapter.createElement(tagName, undefined, []);
        };
        document.createTextNode = function (data) {
            return treeAdapter.createTextNode(data);
        };
        document.getElementsByTagName = getElementsByTagName;
        Object.defineProperty(document, DOCTYPE_PROPERTY_NAME, {
            get() {
                const firstChild = treeAdapter.getFirstChild(this);
                if (firstChild && firstChild.nodeName === DOCTYPE_NODE_NAME) {
                    return firstChild;
                } else {
                    return undefined;
                }
            }
        });
        Object.defineProperty(document, DOCUMENT_ELEMENT_PROPERTY_NAME, {
            get() {
                return this.childNodes.find(node => testElement(node, TAG_NAMES.HTML));
            }
        });
        Object.defineProperty(document, HEAD_PROPERTY_NAME, {
            get() {
                return this.documentElement.childNodes.find(node => testElement(node, TAG_NAMES.HEAD));
            }
        });
        return document;
    },
    createElement(tagName, namespaceURI, attrs) {
        // one shared prototype instead of a dozen property definitions on every element
        const element = defaultTreeAdapter.createElement(tagName, namespaceURI, attrs);
        Object.setPrototypeOf(element, elementPrototype);
        return element;
    }
};

const elementPrototype = {
    getAttribute,
    getAttributeNames,
    setAttribute,
    removeAttribute,
    appendChild,
    remove,
    replaceWith,
    prepend,
    after,
    getElementsByTagName,
    get [FIRST_CHILD_PROPERTY_NAME]() {
        return treeAdapter.getFirstChild(this);
    },
    get [TEXT_CONTENT_PROPERTY_NAME]() {
        return joinArray(this.childNodes.map(node => treeAdapter.getTextNodeContent(node)));
    },
    get [OUTER_HTML_PROPERTY_NAME]() {
        return serialize(this);
    }
};

export class DOMParser {
    parseFromString(html) {
        const document = parse(html, { treeAdapter });
        if (!document.head) {
            const headElement = document.createElement(TAG_NAMES.HEAD);
            document.documentElement.prepend(headElement);
        }
        return document;
    }
}

function getAttribute(name) {
    const attribute = findAttribute(this, name);
    if (attribute) {
        return attribute.value;
    }
}

function getAttributeNames() {
    return this.attrs.map(attribute => attribute.name);
}

function setAttribute(name, value) {
    const indexAttribute = findIndexAttribute(this, name);
    if (indexAttribute === -1) {
        this.attrs.push({ name, value });
    } else {
        this.attrs[indexAttribute].value = value;
    }
}

function removeAttribute(name) {
    const indexAttribute = findIndexAttribute(this, name);
    if (indexAttribute !== -1) {
        this.attrs.splice(indexAttribute, 1);
    }
}

function findAttribute(element, name) {
    return element.attrs.find(attr => testAttributeName(attr, name));
}

function findIndexAttribute(element, name) {
    return element.attrs.findIndex(attr => testAttributeName(attr, name));
}

function testAttributeName(attr, name) {
    return testCaseInsensitive(attr.name, name);
}

function appendChild(child) {
    return treeAdapter.appendChild(this, child);
}

function remove() {
    if (this.parentNode) {
        const indexNode = findIndexNode(this);
        if (indexNode !== -1) {
            this.parentNode.childNodes.splice(indexNode, 1);
            this.parentNode = undefined;
        }
    }
}

function replaceWith(...nodes) {
    if (this.parentNode) {
        const indexNode = findIndexNode(this);
        if (indexNode !== -1) {
            const oldNodes = this.parentNode.childNodes.splice(indexNode, 1, ...nodes);
            nodes.forEach(node => node.parentNode = this.parentNode);
            oldNodes.forEach(node => node.parentNode = undefined);
        }
    }
}

function prepend(...nodes) {
    this.childNodes.unshift(...nodes);
    nodes.forEach(node => node.parentNode = this);
}

function after(...nodes) {
    if (this.parentNode) {
        const indexNode = findIndexNode(this);
        if (indexNode !== -1) {
            this.parentNode.childNodes.splice(indexNode + 1, 0, ...nodes);
            nodes.forEach(node => node.parentNode = this.parentNode);
        }
    }
}

function getElementsByTagName(tagName) {
    const elements = [];
    this.childNodes.forEach(node => {
        if (testElement(node, tagName)) {
            elements.push(node);
        }
        if (node.getElementsByTagName) {
            elements.push(...node.getElementsByTagName(tagName));
        }
    });
    return elements;
}

function findIndexNode(node) {
    return node.parentNode.childNodes.indexOf(node);
}

function testElement(node, name) {
    return node.tagName && testCaseInsensitive(node.tagName, name);
}

function testCaseInsensitive(stringLeft, stringRight) {
    // names are almost always already lower case, so the strict comparison usually settles it
    return stringLeft === stringRight || stringLeft.toLowerCase() === stringRight.toLowerCase();
}

function serialize(node) {
    if (node.nodeName === TEXT_NODE_NAME) {
        return serializeTextNode(node);
    } else if (node.nodeName === COMMENT_NODE_NAME) {
        return serializeCommentNode(node);
    } else {
        return serializeElement(node);
    }
}

function serializeTextNode(textNode) {
    if (shouldEscapeEntities(textNode)) {
        return escapeEntitiesTextNode(textNode);
    } else if (shouldEscapeTextNode(textNode)) {
        return escapeTextNode(textNode);
    } else {
        return textNode.value;
    }
}

function shouldEscapeEntities(textNode) {
    const parentNodeTagName = textNode.parentNode.tagName && textNode.parentNode.tagName.toLowerCase();
    return parentNodeTagName && !RAW_TEXT_NODE_TAG_NAMES.has(parentNodeTagName);
}

function shouldEscapeTextNode(textNode) {
    const parentNode = textNode.parentNode;
    const parentNodeTagName = textNode.parentNode.tagName && parentNode.tagName.toLowerCase();
    let parentNodeType;
    if (parentNode.attrs) {
        parentNodeType = parentNode.getAttribute(ATTRS.TYPE);
    }
    return parentNodeTagName === TAG_NAMES.STYLE ||
        (parentNodeTagName === TAG_NAMES.SCRIPT && (!parentNodeType || parentNodeType === JAVASCRIPT_MIME_TYPE));
}

function escapeTextNode(textNode) {
    return textNode.value
        .replace(CLOSING_TAG_MARKER_REGEXP, ESCAPED_CLOSING_TAG_MARKER)
        .replace(SELF_CLOSING_TAG_MARKER_REGEXP, ESCAPED_SELF_CLOSING_TAG_MARKER);
}

function escapeEntitiesTextNode(textNode) {
    // one pass over the text instead of four
    return textNode.value.replace(TEXT_ESCAPE_REGEXP, character => TEXT_ESCAPE_ENTITIES[character]);
}

function serializeCommentNode(commentNode) {
    return COMMENT_START_MARKER + commentNode.data + COMMENT_END_MARKER;
}

function serializeElement(element) {
    let { tagName } = element;
    tagName = tagName.toLowerCase();
    let html = OPENING_TAG_MARKER + tagName;
    const attributes = serializeAttributes(element);
    if (attributes) {
        html += SPACE_CHARACTER + attributes;
    }
    html += CLOSING_ANGLE_BRACKET;
    html += serializeChildren(element);
    if (!VOID_TAG_NAMES.has(tagName)) {
        html += CLOSING_TAG_MARKER + tagName + CLOSING_ANGLE_BRACKET;
    }
    return html;
}

function serializeChildren(element) {
    if (element.tagName.toLowerCase() === TAG_NAMES.TEMPLATE) {
        return joinArray(element.content.childNodes.map(node => serialize(node)));
    } else {
        return joinArray(element.childNodes.map(node => serialize(node)));
    }
}

function serializeAttributes(element) {
    // an attribute whose name cannot be written is dropped before joining, so it does not leave
    // a gap between the ones around it
    return joinArray(element.attrs.filter(({ name }) => !name.match(INVALID_TAG_NAME_REGEXP)).map(({ name, value, prefix, namespace }) => {
        value = escapeAttributeValue(value);
        if (namespace === NS.XLINK) {
            return serializeAttribute(name, value, XLINK_PREFIX);
        } else if (namespace === NS.XML) {
            return serializeAttribute(name, value, XML_PREFIX);
        } else if (namespace === NS.XMLNS) {
            return name === XMLNS_PREFIX ?
                serializeAttribute(name, value) :
                serializeAttribute(name, value, XMLNS_PREFIX);
        } else {
            return serializeAttribute(name, value, prefix);
        }
    }), SPACE_CHARACTER);
}

function escapeAttributeValue(value) {
    return value.replace(ATTRIBUTE_ESCAPE_REGEXP, character => ATTRIBUTE_ESCAPE_ENTITIES[character]);
}

function serializeAttribute(name, value, prefix) {
    if (prefix) {
        return prefix + ATTRIBUTE_PREFIX_SEPARATOR + name + ATTRIBUTE_VALUE_SEPARATOR + QUOTE_CHARACTER + value + QUOTE_CHARACTER;
    } else {
        return name + ATTRIBUTE_VALUE_SEPARATOR + QUOTE_CHARACTER + value + QUOTE_CHARACTER;
    }
}

function joinArray(array, separator = EMPTY_STRING) {
    return array.join(separator);
}
