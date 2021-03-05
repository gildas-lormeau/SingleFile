import * as frameTree from "./processors/frame-tree/content/content-frame-tree.js";
import * as serializer from "./modules/html-serializer.js";
import {
	COMMENT_HEADER,
	COMMENT_HEADER_LEGACY,
	ON_BEFORE_CAPTURE_EVENT_NAME,
	ON_AFTER_CAPTURE_EVENT_NAME,
	initUserScriptHandler,
	preProcessDoc,
	postProcessDoc,
	getShadowRoot
} from "./single-file-helper.js";

const processors = { frameTree };
const helper = {
	COMMENT_HEADER,
	COMMENT_HEADER_LEGACY,
	ON_BEFORE_CAPTURE_EVENT_NAME,
	ON_AFTER_CAPTURE_EVENT_NAME,
	preProcessDoc,
	postProcessDoc,
	serialize(doc, compressHTML) {
		return serializer.process(doc, compressHTML);
	},
	getShadowRoot
};

initUserScriptHandler();

export {
	helper,
	processors
};