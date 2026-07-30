/**
 * Module for converting MHTML to HTML and parsing MHTML data to a structured object representation.
 * 
 * @author Gildas Lormeau
 * @license MIT
 * 
 * @example
 * Convert MHTML to HTML
 * ```js
 * import { convert } from "mhtml-to-html"; // Node.js
 * // import { convert } from "@mhtml-to-html/mhtml-to-html"; // Deno via JSR
 * // import { convert } from "mhtml-to-html/deno"; // Deno via NPM
 * // import { convert } from "mhtml-to-html/browser"; // Browser
 * 
 * const mhtml = `...`; // or new Uint8Array([...])
 * const { data, title, favicons } = await convert(mhtml);
 * console.log(data); // HTML content
 * ```
 * 
 * @example
 * Parse MHTML data
 * ```js
 * import { parse, convert } from "mhtml-to-html"; // Node.js
 * // import { parse, convert } from "@mhtml-to-html/mhtml-to-html"; // Deno via JSR
 * // import { parse, convert } from "mhtml-to-html/deno"; // Deno via NPM
 * // import { parse, convert } from "mhtml-to-html/browser"; // Browser
 * 
 * const data = `...`; // or new Uint8Array([...])
 * const mhtml = parse(data);
 * console.log(mhtml); // { headers, frames, resources, index }
 * // convert mhtml to html
 * const { data, title, favicons } = await convert(mhtml);
 * console.log(data); // HTML content
 * ```
 * 
 * @module mhtml-to-html
 */

/**
 * Convert MHTML to HTML
 * 
 * @param mhtml the MHTML data to convert to HTML provided as a string or Uint8Array or MHTML object
 * @param config optional configuration object
 * @returns the converted HTML, the title of the page and the favicons
 */
export function convert(mhtml: MHTML | string | Uint8Array, config?: ConvertConfig): Promise<PageData>;

/**
 * Parse MHTML data
 * 
 * @param data the MHTML data to parse provided as a string or Uint8Array
 * @param config optional configuration object
 * @returns the parsed MHTML data
 */
export function parse(data: string | Uint8Array, config?: ParseConfig): MHTML;

/**
 * Configuration object for convert function
 */
export interface ConvertConfig {
    /**
     * Constructor of the DOMParser implementation to use for parsing HTML. It does not have to
     * be a whole DOM: {@link DOMParserLike} describes the exact subset the library relies on.
     *
     * @default globalThis.DOMParser
     */
    DOMParser?: DOMParserLike;
    /**
     * Enable scripts in the converted HTML
     * 
     * @default false
     */
    enableScripts?: boolean;
    /**
     * Fetch missing resources
     * 
     * @default false
     */
    fetchMissingResources?: boolean;
    /**
     * Fetch implementation to use for fetching resources
     *
     * @default globalThis.fetch
     */
    fetch?: typeof fetch;
    /**
     * Number of times a resource is requested again when the failure looks transient (a network
     * error, a "429 Too Many Requests" or a server error). Retries are delayed with an exponential
     * backoff, or by the delay requested by the "Retry-After" header when present.
     *
     * @default 2
     */
    maxRetries?: number;
    /**
     * Maximum number of resources requested at the same time
     *
     * @default 16
     */
    maxParallelRequests?: number;
}

/**
 * Configuration object for parse function
 */
export interface ParseConfig {
    /**
     * Constructor of the DOMParser implementation to use for parsing HTML. It does not have to
     * be a whole DOM: {@link DOMParserLike} describes the exact subset the library relies on.
     *
     * @default globalThis.DOMParser
     */
    DOMParser?: DOMParserLike;
}

/**
 * Constructor of the DOM implementation used to read and rewrite documents. The default is
 * `globalThis.DOMParser`: the one of the browser, or deno-dom in Deno; the Node.js entry point
 * falls back to an internal parse5-based implementation.
 *
 * A custom implementation does not have to be a whole DOM: the library relies only on the members
 * described by {@link DocumentLike}, {@link ElementLike} and {@link NodeLike}. `parseFromString`
 * receives the media type of the document being parsed and may throw when it does not support it:
 * the library calls it again with "text/html".
 */
export type DOMParserLike = new () => {
    parseFromString(html: string, contentType?: string): DocumentLike;
};

/**
 * The subset of `Document` the library relies on
 */
export interface DocumentLike {
    /**
     * Root element; the converted page is read from its `outerHTML`
     */
    documentElement: ElementLike;
    /**
     * Written back at the top of the converted page when present
     */
    doctype?: { name: string, publicId?: string, systemId?: string } | null;
    /**
     * Head element; the charset declaration, the content security policy and the page
     * information are inserted into it
     */
    head: ElementLike;
    /**
     * The conversion walk starts at the document and descends into any node carrying childNodes
     */
    childNodes: Iterable<NodeLike>;
    getElementsByTagName(tagName: string): ArrayLike<ElementLike>;
    createElement(tagName: string): ElementLike;
    createTextNode(data: string): NodeLike;
}

/**
 * The subset of `Element` the library relies on
 */
export interface ElementLike extends NodeLike {
    tagName: string;
    textContent: string;
    /**
     * Only read on the root element, to serialize the converted page
     */
    outerHTML: string;
    /**
     * Only read on template elements, to convert the content of a shadow root
     */
    content?: NodeLike;
    getAttribute(name: string): string | null | undefined;
    setAttribute(name: string, value: string): void;
    removeAttribute(name: string): void;
    /**
     * Optional: when absent, event handler attributes are removed by trying each name of a fixed
     * list instead of reading the names the element actually carries
     */
    getAttributeNames?(): string[];
    getElementsByTagName(tagName: string): ArrayLike<ElementLike>;
    appendChild(node: NodeLike): unknown;
    remove(): void;
    // the library only ever passes nodes; the string variant mirrors the native signatures so a
    // real DOM stays assignable
    replaceWith(...nodes: (NodeLike | string)[]): void;
    prepend(...nodes: (NodeLike | string)[]): void;
    after(...nodes: (NodeLike | string)[]): void;
}

/**
 * A node as far as the library is concerned. Non-element nodes are opaque: they are only created,
 * attached and carried around. The conversion walk descends into any node exposing `childNodes`
 * and treats the ones exposing the {@link ElementLike} members as elements.
 */
export interface NodeLike {
    childNodes?: Iterable<NodeLike>;
    firstChild?: NodeLike | null;
}

/**
 * MHTML data structure
 */
export interface MHTML {
    /**
     * Headers of the MHTML
     */
    headers: Record<string, string>;
    /**
     * Frames of the MHTML
     */
    frames: Record<string, Resource>;
    /**
     * Resources of the MHTML
     */
    resources: Record<string, Resource>;
    /**
     * Id of the index page
     */
    index: string;
    /**
     * Defects of the archive the parser recovered from
     */
    anomalies: Anomaly[];
}

/**
 * A defect of the archive the library recovered from. An empty anomalies array together with an
 * empty unfoundResources array tells the archive converted cleanly
 */
export interface Anomaly {
    /**
     * - "document-mislabeled-as-archive": the file begins with markup and was treated as a plain
     *   HTML document (e.g. Word saves plain HTML as .mht); there never were parts to inline
     * - "declared-boundary-unused": the boundary declared in the headers appears nowhere in the
     *   body; the parts were read with the boundary the body actually uses
     * - "multipart-without-delimiters": the file promised parts but no delimiter ever turned up;
     *   what follows the top-level headers was read as the one part left
     * - "index-synthesized": the archive holds no document, so the page was built around the
     *   first image or text part it knows how to present
     * - "base64-left-encoded": the data of the part could not be decoded and stays the base64
     *   text as it was written
     */
    type: "document-mislabeled-as-archive" | "declared-boundary-unused" | "multipart-without-delimiters"
        | "index-synthesized" | "base64-left-encoded";
    /**
     * Id of the part involved, when one is
     */
    id?: string;
}

/**
 * Resource data structure
 */
export interface Resource {
    /**
     * Id of the resource
     */
    id: string;
    /**
     * Content type of the resource
     */
    contentType: string;
    /**
     * Transfer encoding of the resource ("binary" resources are automatically converted to "base64")
     */
    transferEncoding?: "base64" | "quoted-printable" | "7bit" | "8bit";
    /**
     * Content of the resource as text or base64 encoded data
     */
    data: string;
}

/**
 * Page data structure
 */
export interface PageData {
    /**
     * HTML content of the page
     */
    data: string;
    /**
     * Title of the page
     */
    title?: string;
    /**
     * Addresses referenced by the page for which the archive holds no part — and which could not
     * be fetched, when fetching is enabled. They are kept in the page as absolute URLs, so an
     * empty array tells the page converted whole
     */
    unfoundResources: string[];
    /**
     * Defects of the archive the library recovered from while parsing and converting it
     */
    anomalies: Anomaly[];
    /**
     * Favicons
     */
    favicons?: {
        /**
         * URL of the favicon
         */
        href: string,
        /**
         * Original URL of the favicon
         */
        originalHref?: string,
        /**
         * Media type of the favicon
         */
        media?: string,
        /**
         * Type of the favicon
         */
        type?: string,
        /**
         * Sizes of the favicon
         */
        sizes?: string
    }[];
}