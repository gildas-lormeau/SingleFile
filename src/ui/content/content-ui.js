/*
 * Copyright 2010-2020 Gildas Lormeau
 * contact : gildas.lormeau <at> gmail.com
 * 
 * This file is part of SingleFile.
 *
 *   The code in this file is free software: you can redistribute it and/or 
 *   modify it under the terms of the GNU Affero General Public License 
 *   (GNU AGPL) as published by the Free Software Foundation, either version 3
 *   of the License, or (at your option) any later version.
 * 
 *   The code in this file is distributed in the hope that it will be useful, 
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of 
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero 
 *   General Public License for more details.
 *
 *   As additional permission under GNU AGPL version 3 section 7, you may 
 *   distribute UNMODIFIED VERSIONS OF THIS file without the copy of the GNU 
 *   AGPL normally required by section 4, provided you include this license 
 *   notice and a URL through which recipients can access the Corresponding 
 *   Source.
 */

/* global browser, document, prompt, getComputedStyle, addEventListener, removeEventListener, requestAnimationFrame, setTimeout, getSelection, Node */

const singlefile = globalThis.singlefile;

const SELECTED_CONTENT_ATTRIBUTE_NAME = singlefile.helper.SELECTED_CONTENT_ATTRIBUTE_NAME;

const MASK_TAGNAME = "singlefile-mask";
const MASK_CONTENT_CLASSNAME = "singlefile-mask-content";
const PROGRESSBAR_CLASSNAME = "singlefile-progress-bar";
const PROGRESSBAR_CONTENT_CLASSNAME = "singlefile-progress-bar-content";
const SELECTION_ZONE_TAGNAME = "single-file-selection-zone";
const LOGS_WINDOW_TAGNAME = "singlefile-logs-window";
const LOGS_CLASSNAME = "singlefile-logs";
const LOGS_LINE_CLASSNAME = "singlefile-logs-line";
const LOGS_LINE_TEXT_ELEMENT_CLASSNAME = "singlefile-logs-line-text";
const LOGS_LINE_STATUS_ELEMENT_CLASSNAME = "singlefile-logs-line-icon";
const SINGLE_FILE_UI_ELEMENT_CLASS = singlefile.helper.SINGLE_FILE_UI_ELEMENT_CLASS;
const SELECT_PX_THRESHOLD = 8;
const CSS_PROPERTIES = new Set(Array.from(getComputedStyle(document.documentElement)));
let LOG_PANEL_WIDTH, LOG_PANEL_DEFERRED_IMAGES_MESSAGE, LOG_PANEL_FRAME_CONTENTS_MESSAGE, LOG_PANEL_EMBEDDED_IMAGE_MESSAGE, LOG_PANEL_STEP_MESSAGE;
try {
	LOG_PANEL_WIDTH = browser.i18n.getMessage("logPanelWidth");
	LOG_PANEL_DEFERRED_IMAGES_MESSAGE = browser.i18n.getMessage("logPanelDeferredImages");
	LOG_PANEL_FRAME_CONTENTS_MESSAGE = browser.i18n.getMessage("logPanelFrameContents");
	LOG_PANEL_EMBEDDED_IMAGE_MESSAGE = browser.i18n.getMessage("logPanelEmbeddedImage");
	LOG_PANEL_STEP_MESSAGE = browser.i18n.getMessage("logPanelStep");
	// eslint-disable-next-line no-unused-vars
} catch (error) {
	// ignored
}

let selectedAreaElement, logsWindowElement;
createLogsWindowElement();

export {
	getSelectedLinks,
	markSelection,
	unmarkSelection,
	promptMessage as prompt,
	setVisible,
	onStartPage,
	onEndPage,
	onLoadResource,
	onInsertingEmbeddedImage,
	onInsertEmbeddedImage,
	onLoadingDeferResources,
	onLoadDeferResources,
	onLoadingFrames,
	onLoadFrames,
	onStartStage,
	onEndStage,
	onPageLoading,
	onLoadPage
};

function promptMessage(message, defaultValue) {
	return prompt(message, defaultValue);
}

function setVisible(visible) {
	const maskElement = document.querySelector(MASK_TAGNAME);
	if (maskElement) {
		maskElement.style.setProperty("display", visible ? "block" : "none");
	}
	if (logsWindowElement) {
		logsWindowElement.style.setProperty("display", visible ? "block" : "none");
	}
}

function onStartPage(options) {
	let maskElement = document.querySelector(MASK_TAGNAME);
	if (!maskElement) {
		if (options.logsEnabled) {
			document.documentElement.appendChild(logsWindowElement);
		}
		if (options.shadowEnabled) {
			const maskElement = createMaskElement();
			if (options.progressBarEnabled) {
				createProgressBarElement(maskElement);
			}
		}
	}
}

function onEndPage() {
	const maskElement = document.querySelector(MASK_TAGNAME);
	if (maskElement) {
		maskElement.remove();
	}
	logsWindowElement.remove();
	clearLogs();
}

function onLoadResource(index, maxIndex, options) {
	if (options.shadowEnabled && options.progressBarEnabled) {
		updateProgressBar(index, maxIndex);
	}
}

function onLoadingDeferResources(options) {
	updateLog("load-deferred-images", LOG_PANEL_DEFERRED_IMAGES_MESSAGE, "…", options);
}

function onLoadDeferResources(options) {
	updateLog("load-deferred-images", LOG_PANEL_DEFERRED_IMAGES_MESSAGE, "✓", options);
}

function onInsertingEmbeddedImage(options) {
	updateLog("insert-embedded-image", LOG_PANEL_EMBEDDED_IMAGE_MESSAGE, "…", options);
}

function onInsertEmbeddedImage(options) {
	updateLog("insert-embedded-image", LOG_PANEL_EMBEDDED_IMAGE_MESSAGE, "✓", options);
}

function onLoadingFrames(options) {
	updateLog("load-frames", LOG_PANEL_FRAME_CONTENTS_MESSAGE, "…", options);
}

function onLoadFrames(options) {
	updateLog("load-frames", LOG_PANEL_FRAME_CONTENTS_MESSAGE, "✓", options);
}

function onStartStage(step, options) {
	updateLog("step-" + step, `${LOG_PANEL_STEP_MESSAGE} ${step + 1} / 3`, "…", options);
}

function onEndStage(step, options) {
	updateLog("step-" + step, `${LOG_PANEL_STEP_MESSAGE} ${step + 1} / 3`, "✓", options);
}

function onPageLoading() { }

function onLoadPage() { }

function getSelectedLinks() {
	let selectionFound;
	const links = [];
	const selection = getSelection();
	for (let indexRange = 0; indexRange < selection.rangeCount; indexRange++) {
		let range = selection.getRangeAt(indexRange);
		if (range && range.commonAncestorContainer) {
			const treeWalker = document.createTreeWalker(range.commonAncestorContainer);
			let rangeSelectionFound = false;
			let finished = false;
			while (!finished) {
				if (rangeSelectionFound || treeWalker.currentNode == range.startContainer || treeWalker.currentNode == range.endContainer) {
					rangeSelectionFound = true;
					if (range.startContainer != range.endContainer || range.startOffset != range.endOffset) {
						selectionFound = true;
						if (treeWalker.currentNode.tagName == "A" && treeWalker.currentNode.href) {
							links.push(treeWalker.currentNode.href);
						}
					}
				}
				if (treeWalker.currentNode == range.endContainer) {
					finished = true;
				} else {
					treeWalker.nextNode();
				}
			}
			if (selectionFound && treeWalker.currentNode == range.endContainer && treeWalker.currentNode.querySelectorAll) {
				treeWalker.currentNode.querySelectorAll("*").forEach(descendantElement => {
					if (descendantElement.tagName == "A" && descendantElement.href) {
						links.push(treeWalker.currentNode.href);
					}
				});
			}
		}
	}
	return Array.from(new Set(links));
}

async function markSelection(optionallySelected) {
	let selectionFound = markSelectedContent();
	if (selectionFound || optionallySelected) {
		return selectionFound;
	} else {
		selectionFound = await selectArea();
		if (selectionFound) {
			return markSelectedContent();
		}
	}
}

function markSelectedContent() {
	const selection = getSelection();
	let selectionFound;
	for (let indexRange = 0; indexRange < selection.rangeCount; indexRange++) {
		let range = selection.getRangeAt(indexRange);
		if (range && range.commonAncestorContainer) {
			const treeWalker = document.createTreeWalker(range.commonAncestorContainer);
			let rangeSelectionFound = false;
			let finished = false;
			while (!finished) {
				if (rangeSelectionFound || treeWalker.currentNode == range.startContainer || treeWalker.currentNode == range.endContainer) {
					rangeSelectionFound = true;
					if (range.startContainer != range.endContainer || range.startOffset != range.endOffset) {
						selectionFound = true;
						markSelectedNode(treeWalker.currentNode);
					}
				}
				if (selectionFound && treeWalker.currentNode == range.startContainer) {
					markSelectedParents(treeWalker.currentNode);
				}
				if (treeWalker.currentNode == range.endContainer) {
					finished = true;
				} else {
					treeWalker.nextNode();
				}
			}
			if (selectionFound && treeWalker.currentNode == range.endContainer && treeWalker.currentNode.querySelectorAll) {
				for (
					let offset = range.startContainer === range.endContainer ? range.startOffset : 0;
					offset < range.endOffset;
					offset++
				) {
					const node = range.endContainer.childNodes[offset];
					if (node) {
						markSelectedNode(node);
						if (node.querySelectorAll) {
							node.querySelectorAll("*").forEach(markSelectedNode);
						}
					}
				}
			}
		}
	}
	return selectionFound;
}

function markSelectedNode(node) {
	const element = node.nodeType == Node.ELEMENT_NODE ? node : node.parentElement;
	element.setAttribute(SELECTED_CONTENT_ATTRIBUTE_NAME, "");
}

function markSelectedParents(node) {
	if (node.parentElement) {
		markSelectedNode(node);
		markSelectedParents(node.parentElement);
	}
}

function unmarkSelection() {
	document.querySelectorAll("[" + SELECTED_CONTENT_ATTRIBUTE_NAME + "]").forEach(selectedContent => selectedContent.removeAttribute(SELECTED_CONTENT_ATTRIBUTE_NAME));
}

function selectArea() {
	return new Promise(resolve => {
		let selectedRanges = [];
		addEventListener("mousemove", mousemoveListener, true);
		addEventListener("click", clickListener, true);
		addEventListener("keyup", keypressListener, true);
		document.addEventListener("contextmenu", contextmenuListener, true);
		getSelection().removeAllRanges();

		function contextmenuListener(event) {
			selectedRanges = [];
			select();
			event.preventDefault();
		}

		function mousemoveListener(event) {
			const targetElement = getTarget(event);
			if (targetElement) {
				selectedAreaElement = targetElement;
				moveAreaSelector(targetElement);
			}
		}

		function clickListener(event) {
			event.preventDefault();
			event.stopPropagation();
			if (event.button == 0) {
				select(selectedAreaElement, event.ctrlKey);
			} else {
				cancel();
			}
		}

		function keypressListener(event) {
			if (event.key == "Escape") {
				cancel();
			}
		}

		function cancel() {
			if (selectedRanges.length) {
				getSelection().removeAllRanges();
			}
			selectedRanges = [];
			cleanupAndResolve();
		}

		function select(selectedElement, multiSelect) {
			if (selectedElement) {
				if (!multiSelect) {
					restoreSelectedRanges();
				}
				const range = document.createRange();
				range.selectNodeContents(selectedElement);
				cleanupSelectionRanges();
				getSelection().addRange(range);
				saveSelectedRanges();
				if (!multiSelect) {
					cleanupAndResolve();
				}
			} else {
				cleanupAndResolve();
			}
		}

		function cleanupSelectionRanges() {
			const selection = getSelection();
			for (let indexRange = selection.rangeCount - 1; indexRange >= 0; indexRange--) {
				const range = selection.getRangeAt(indexRange);
				if (range.startOffset == range.endOffset) {
					selection.removeRange(range);
					indexRange--;
				}
			}
		}

		function cleanupAndResolve() {
			getAreaSelector().remove();
			removeEventListener("mousemove", mousemoveListener, true);
			removeEventListener("click", clickListener, true);
			removeEventListener("keyup", keypressListener, true);
			selectedAreaElement = null;
			resolve(Boolean(selectedRanges.length));
			setTimeout(() => document.removeEventListener("contextmenu", contextmenuListener, true), 0);
		}

		function restoreSelectedRanges() {
			getSelection().removeAllRanges();
			selectedRanges.forEach(range => getSelection().addRange(range));
		}

		function saveSelectedRanges() {
			selectedRanges = [];
			for (let indexRange = 0; indexRange < getSelection().rangeCount; indexRange++) {
				const range = getSelection().getRangeAt(indexRange);
				selectedRanges.push(range);
			}
		}
	});
}

function getTarget(event) {
	let newTarget, target = event.target, boundingRect = target.getBoundingClientRect();
	newTarget = determineTargetElement("floor", target, event.clientX - boundingRect.left, getMatchedParents(target, "left"));
	if (newTarget == target) {
		newTarget = determineTargetElement("ceil", target, boundingRect.left + boundingRect.width - event.clientX, getMatchedParents(target, "right"));
	}
	if (newTarget == target) {
		newTarget = determineTargetElement("floor", target, event.clientY - boundingRect.top, getMatchedParents(target, "top"));
	}
	if (newTarget == target) {
		newTarget = determineTargetElement("ceil", target, boundingRect.top + boundingRect.height - event.clientY, getMatchedParents(target, "bottom"));
	}
	target = newTarget;
	while (target && target.clientWidth <= SELECT_PX_THRESHOLD && target.clientHeight <= SELECT_PX_THRESHOLD) {
		target = target.parentElement;
	}
	return target;
}

function moveAreaSelector(target) {
	requestAnimationFrame(() => {
		const selectorElement = getAreaSelector();
		const boundingRect = target.getBoundingClientRect();
		const scrollingElement = document.scrollingElement || document.documentElement;
		selectorElement.style.setProperty("top", (scrollingElement.scrollTop + boundingRect.top - 10) + "px");
		selectorElement.style.setProperty("left", (scrollingElement.scrollLeft + boundingRect.left - 10) + "px");
		selectorElement.style.setProperty("width", (boundingRect.width + 20) + "px");
		selectorElement.style.setProperty("height", (boundingRect.height + 20) + "px");
	});
}

function getAreaSelector() {
	let selectorElement = document.querySelector(SELECTION_ZONE_TAGNAME);
	if (!selectorElement) {
		selectorElement = createElement(SELECTION_ZONE_TAGNAME, document.body);
		selectorElement.style.setProperty("box-sizing", "border-box", "important");
		selectorElement.style.setProperty("background-color", "#3ea9d7", "important");
		selectorElement.style.setProperty("border", "10px solid #0b4892", "important");
		selectorElement.style.setProperty("border-radius", "2px", "important");
		selectorElement.style.setProperty("opacity", ".25", "important");
		selectorElement.style.setProperty("pointer-events", "none", "important");
		selectorElement.style.setProperty("position", "absolute", "important");
		selectorElement.style.setProperty("transition", "all 100ms", "important");
		selectorElement.style.setProperty("cursor", "pointer", "important");
		selectorElement.style.setProperty("z-index", "2147483647", "important");
		selectorElement.style.removeProperty("border-inline-end");
		selectorElement.style.removeProperty("border-inline-start");
		selectorElement.style.removeProperty("inline-size");
		selectorElement.style.removeProperty("block-size");
		selectorElement.style.removeProperty("inset-block-start");
		selectorElement.style.removeProperty("inset-inline-end");
		selectorElement.style.removeProperty("inset-block-end");
		selectorElement.style.removeProperty("inset-inline-start");
	}
	return selectorElement;
}

function createMaskElement() {
	try {
		let maskElement = document.querySelector(MASK_TAGNAME);
		if (!maskElement) {
			maskElement = createElement(MASK_TAGNAME, document.documentElement);
			const shadowRoot = maskElement.attachShadow({ mode: "open" });
			const styleElement = document.createElement("style");
			styleElement.textContent = `
				@keyframes single-file-progress { 
					0% { 
						left: -50px;
					} 
					100% { 
						left: 0;
					}
				}
				.${PROGRESSBAR_CLASSNAME} {
					position: fixed;
					top: 0;
					left: 0;
					width: 0;
					height: 8px;
					z-index: 2147483646;
					opacity: .5;
					overflow: hidden;					
					transition: width 200ms ease-in-out;
				}
				.${PROGRESSBAR_CONTENT_CLASSNAME} {
					position: absolute;
					left: 0;
					animation: single-file-progress 3s linear infinite reverse;
					background: 
						white 
						linear-gradient(-45deg, rgba(0, 0, 0, 0.075) 25%, 
							transparent 25%, 
							transparent 50%, 
							rgba(0, 0, 0, 0.075) 50%, 
							rgba(0, 0, 0, 0.075) 75%, 
							transparent 75%, transparent)
						repeat scroll 0% 0% / 50px 50px padding-box border-box;
					width: calc(100% + 50px);
					height: 100%;					
				}
				.${MASK_CONTENT_CLASSNAME} {
					position: fixed;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					z-index: 2147483646;
					opacity: 0;
					background-color: black;
					transition: opacity 250ms;
				}
			`;
			shadowRoot.appendChild(styleElement);
			let maskElementContent = document.createElement("div");
			maskElementContent.classList.add(MASK_CONTENT_CLASSNAME);
			shadowRoot.appendChild(maskElementContent);
			maskElement.offsetWidth;
			maskElementContent.style.setProperty("opacity", .3);
			maskElement.offsetWidth;
		}
		return maskElement;
		// eslint-disable-next-line no-unused-vars
	} catch (error) {
		// ignored
	}
}

function createProgressBarElement(maskElement) {
	try {
		let progressBarElement = maskElement.shadowRoot.querySelector("." + PROGRESSBAR_CLASSNAME);
		if (!progressBarElement) {
			let progressBarContent = document.createElement("div");
			progressBarContent.classList.add(PROGRESSBAR_CLASSNAME);
			maskElement.shadowRoot.appendChild(progressBarContent);
			const progressBarContentElement = document.createElement("div");
			progressBarContentElement.classList.add(PROGRESSBAR_CONTENT_CLASSNAME);
			progressBarContent.appendChild(progressBarContentElement);
		}
		// eslint-disable-next-line no-unused-vars
	} catch (error) {
		// ignored
	}
}

function createLogsWindowElement() {
	try {
		logsWindowElement = document.querySelector(LOGS_WINDOW_TAGNAME);
		if (!logsWindowElement) {
			logsWindowElement = createElement(LOGS_WINDOW_TAGNAME);
			const shadowRoot = logsWindowElement.attachShadow({ mode: "open" });
			const styleElement = document.createElement("style");
			styleElement.textContent = `
				@keyframes single-file-pulse { 
					0% { 
						opacity: .25;
					} 
					100% { 
						opacity: 1;
					} 
				}
				.${LOGS_CLASSNAME} {
					position: fixed;
					bottom: 24px;
					left: 8px;
					z-index: 2147483647;
					opacity: 0.9;
					padding: 4px;
					background-color: white;
					min-width: ${LOG_PANEL_WIDTH}px;
					min-height: 16px;
					transition: height 100ms;
				}
				.${LOGS_LINE_CLASSNAME} {
					display: flex;
					justify-content: space-between;
					padding: 2px;
					font-family: arial, sans-serif;
					color: black;
					background-color: white;
				}
				.${LOGS_LINE_TEXT_ELEMENT_CLASSNAME} {
					font-size: 13px;
					opacity: 1;
					transition: opacity 200ms;
				}
				.${LOGS_LINE_STATUS_ELEMENT_CLASSNAME} {
					font-size: 11px;
					min-width: 15px;
					text-align: center;
					position: relative;
					top: 1px;
				}
			`;
			shadowRoot.appendChild(styleElement);
			const logsContentElement = document.createElement("div");
			logsContentElement.classList.add(LOGS_CLASSNAME);
			shadowRoot.appendChild(logsContentElement);
		}
		// eslint-disable-next-line no-unused-vars
	} catch (error) {
		// ignored
	}
}

function updateLog(id, textContent, textStatus, options) {
	try {
		if (options.logsEnabled) {
			const logsContentElement = logsWindowElement.shadowRoot.querySelector("." + LOGS_CLASSNAME);
			let lineElement = logsContentElement.querySelector("[data-id='" + id + "']");
			if (!lineElement) {
				lineElement = document.createElement("div");
				lineElement.classList.add(LOGS_LINE_CLASSNAME);
				logsContentElement.appendChild(lineElement);
				lineElement.setAttribute("data-id", id);
				const textElement = document.createElement("div");
				textElement.classList.add(LOGS_LINE_TEXT_ELEMENT_CLASSNAME);
				lineElement.appendChild(textElement);
				textElement.textContent = textContent;
				const statusElement = document.createElement("div");
				statusElement.classList.add(LOGS_LINE_STATUS_ELEMENT_CLASSNAME);
				lineElement.appendChild(statusElement);
			}
			updateLogLine(lineElement, textContent, textStatus);
		}
		// eslint-disable-next-line no-unused-vars
	} catch (error) {
		// ignored
	}
}

function updateLogLine(lineElement, textContent, textStatus) {
	const textElement = lineElement.childNodes[0];
	const statusElement = lineElement.childNodes[1];
	textElement.textContent = textContent;
	statusElement.style.setProperty("color", textStatus == "✓" ? "#055000" : "black");
	if (textStatus == "✓") {
		textElement.style.setProperty("opacity", ".5");
		statusElement.style.setProperty("opacity", ".5");
		statusElement.style.setProperty("animation", "none");
	} else {
		statusElement.style.setProperty("animation", "1s ease-in-out 0s infinite alternate none running single-file-pulse");
	}
	statusElement.textContent = textStatus;
}

function updateProgressBar(index, maxIndex) {
	try {
		const maskElement = document.querySelector(MASK_TAGNAME);
		if (maskElement) {
			const progressBarElement = maskElement.shadowRoot.querySelector("." + PROGRESSBAR_CLASSNAME);
			if (progressBarElement && maxIndex) {
				const width = Math.floor((index / maxIndex) * 100) + "%";
				if (progressBarElement.style.getPropertyValue("width") != width) {
					progressBarElement.style.setProperty("width", width);
					progressBarElement.offsetWidth;
				}
			}
		}
		// eslint-disable-next-line no-unused-vars
	} catch (error) {
		// ignored
	}
}

function clearLogs() {
	createLogsWindowElement();
}

function getMatchedParents(target, property) {
	let element = target, matchedParent, parents = [];
	do {
		const boundingRect = element.getBoundingClientRect();
		if (element.parentElement) {
			const parentBoundingRect = element.parentElement.getBoundingClientRect();
			matchedParent = Math.abs(parentBoundingRect[property] - boundingRect[property]) <= SELECT_PX_THRESHOLD;
			if (matchedParent) {
				if (element.parentElement.clientWidth > SELECT_PX_THRESHOLD && element.parentElement.clientHeight > SELECT_PX_THRESHOLD &&
					((element.parentElement.clientWidth - element.clientWidth > SELECT_PX_THRESHOLD) || (element.parentElement.clientHeight - element.clientHeight > SELECT_PX_THRESHOLD))) {
					parents.push(element.parentElement);
				}
				element = element.parentElement;
			}
		} else {
			matchedParent = false;
		}
	} while (matchedParent && element);
	return parents;
}

function determineTargetElement(roundingMethod, target, widthDistance, parents) {
	if (Math[roundingMethod](widthDistance / SELECT_PX_THRESHOLD) <= parents.length) {
		target = parents[parents.length - Math[roundingMethod](widthDistance / SELECT_PX_THRESHOLD) - 1];
	}
	return target;
}

function createElement(tagName, parentElement) {
	const element = document.createElement(tagName);
	element.className = SINGLE_FILE_UI_ELEMENT_CLASS;
	if (parentElement) {
		parentElement.appendChild(element);
	}
	CSS_PROPERTIES.forEach(property => element.style.setProperty(property, "initial", "important"));
	return element;
}