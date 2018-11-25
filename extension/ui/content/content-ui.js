/*
 * Copyright 2018 Gildas Lormeau
 * contact : gildas.lormeau <at> gmail.com
 * 
 * This file is part of SingleFile.
 *
 *   SingleFile is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU Lesser General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   SingleFile is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU Lesser General Public License for more details.
 *
 *   You should have received a copy of the GNU Lesser General Public License
 *   along with SingleFile.  If not, see <http://www.gnu.org/licenses/>.
 */

/* global browser, document, getComputedStyle, addEventListener, removeEventListener, requestAnimationFrame, setTimeout */

this.singlefile.ui = this.singlefile.ui || (() => {

	const MASK_TAGNAME = "singlefile-mask";
	const PROGRESS_BAR_TAGNAME = "singlefile-progress-bar";
	const PROGRESS_CURSOR_TAGNAME = "singlefile-progress-cursor";
	const SELECTION_ZONE_TAGNAME = "single-file-selection-zone";
	const LOGS_WINDOW_TAGNAME = "singlefile-logs-window";
	const LOGS_LINE_TAGNAME = "singlefile-logs-line";
	const LOGS_LINE_ELEMENT_TAGNAME = "singlefile-logs-element";
	const SINGLE_FILE_UI_ELEMENT_CLASS = "single-file-ui-element";
	const SELECT_PX_THRESHOLD = 8;

	let selectedAreaElement;

	let logsWindowElement = createLogsWindowElement();
	const allProperties = new Set();
	Array.from(getComputedStyle(document.body)).forEach(property => allProperties.add(property));

	return {
		getSelectedArea,
		onStartPage() {
			let maskElement = document.querySelector(MASK_TAGNAME);
			if (!maskElement) {
				requestAnimationFrame(() => {
					const maskElement = createMaskElement();
					createProgressBarElement(maskElement);
					document.body.appendChild(logsWindowElement);
					setLogsWindowStyle();
					maskElement.offsetWidth;
					maskElement.style.setProperty("background-color", "black", "important");
					maskElement.style.setProperty("opacity", .3, "important");
					document.body.offsetWidth;
				});
			}
		},
		onEndPage() {
			const maskElement = document.querySelector(MASK_TAGNAME);
			logsWindowElement.remove();
			clearLogs();
			if (maskElement) {
				requestAnimationFrame(() => maskElement.remove());
			}
		},
		onLoadResource(index, maxIndex) {
			const progressBarElement = document.querySelector(PROGRESS_BAR_TAGNAME);
			if (progressBarElement && maxIndex) {
				const width = Math.floor((index / maxIndex) * 100) + "%";
				if (progressBarElement.style.width != width) {
					requestAnimationFrame(() => progressBarElement.style.setProperty("width", Math.floor((index / maxIndex) * 100) + "%", "important"));
				}
			}
		},
		onLoadingDeferResources() {
			updateLog("load-deferred-images", browser.i18n.getMessage("logPanelDeferredImages"), "…");
		},
		onLoadDeferResources() {
			updateLog("load-deferred-images", browser.i18n.getMessage("logPanelDeferredImages"), "✓");
		},
		onLoadingFrames() {
			updateLog("load-frames", browser.i18n.getMessage("logPanelFrameContents"), "…");
		},
		onLoadFrames() {
			updateLog("load-frames", browser.i18n.getMessage("logPanelFrameContents"), "✓");
		},
		onStartStage(step) {
			updateLog("step-" + step, `${browser.i18n.getMessage("logPanelStep")} ${step + 1} / 3`, "…");
		},
		onEndStage(step) {
			updateLog("step-" + step, `${browser.i18n.getMessage("logPanelStep")} ${step + 1} / 3`, "✓");
		},
		onPageLoading() { },
		onLoadPage() { },
		onStartStageTask() { },
		onEndStageTask() { }
	};

	function getSelectedArea() {
		return new Promise(resolve => {
			addEventListener("mousemove", mousemoveListener, true);
			addEventListener("click", clickListener, true);
			addEventListener("keyup", keypressListener, true);
			document.addEventListener("contextmenu", contextmenuListener, true);

			function contextmenuListener(event) {
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
				select(event.button === 0 ? selectedAreaElement : null);
				event.preventDefault();
				event.stopPropagation();
			}

			function keypressListener(event) {
				if (event.key == "Escape") {
					select();
				}
			}

			function select(selectedElement) {
				removeEventListener("mousemove", mousemoveListener, true);
				removeEventListener("click", clickListener, true);
				removeEventListener("keyup", keypressListener, true);
				createAreaSelector().remove();
				resolve(selectedElement);
				selectedAreaElement = null;
				setTimeout(() => document.removeEventListener("contextmenu", contextmenuListener, true), 0);
			}
		});
	}

	function getTarget(event) {
		let newTarget, target = event.target, boundingRect = target.getBoundingClientRect();
		newTarget = determineTargetElementFloor(target, event.clientX - boundingRect.left, getMatchedParents(target, "left"));
		if (newTarget == target) {
			newTarget = determineTargetElementCeil(target, boundingRect.left + boundingRect.width - event.clientX, getMatchedParents(target, "right"));
		}
		if (newTarget == target) {
			newTarget = determineTargetElementFloor(target, event.clientY - boundingRect.top, getMatchedParents(target, "top"));
		}
		if (newTarget == target) {
			newTarget = determineTargetElementCeil(target, boundingRect.top + boundingRect.height - event.clientY, getMatchedParents(target, "bottom"));
		}
		target = newTarget;
		while (target && target.clientWidth <= SELECT_PX_THRESHOLD && target.clientHeight <= SELECT_PX_THRESHOLD) {
			target = target.parentElement;
		}
		return target;
	}

	function moveAreaSelector(target) {
		requestAnimationFrame(() => {
			const selectorElement = createAreaSelector();
			const boundingRect = target.getBoundingClientRect();
			selectorElement.style.setProperty("top", (document.documentElement.scrollTop + boundingRect.top - 10) + "px");
			selectorElement.style.setProperty("left", (document.documentElement.scrollLeft + boundingRect.left - 10) + "px");
			selectorElement.style.setProperty("width", (boundingRect.width + 20) + "px");
			selectorElement.style.setProperty("height", (boundingRect.height + 20) + "px");
		});
	}

	function createAreaSelector() {
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
		let maskElement = document.querySelector(MASK_TAGNAME);
		if (!maskElement) {
			maskElement = createElement(MASK_TAGNAME, document.body);
			maskElement.style.setProperty("opacity", 0, "important");
			maskElement.style.setProperty("background-color", "transparent", "important");
			maskElement.offsetWidth;
			maskElement.style.setProperty("position", "fixed", "important");
			maskElement.style.setProperty("top", "0", "important");
			maskElement.style.setProperty("left", "0", "important");
			maskElement.style.setProperty("width", "100%", "important");
			maskElement.style.setProperty("height", "100%", "important");
			maskElement.style.setProperty("z-index", 2147483646, "important");
			maskElement.style.setProperty("transition", "opacity 250ms", "important");
		}
		return maskElement;
	}

	function createProgressBarElement(maskElement) {
		let progressBarElementContainer = document.querySelector(PROGRESS_BAR_TAGNAME);
		if (!progressBarElementContainer) {
			progressBarElementContainer = createElement(PROGRESS_BAR_TAGNAME, maskElement);
			const styleElement = document.createElement("style");
			styleElement.textContent = "@keyframes single-file-progress { 0% { left: -50px } 100% { left: 0 }";
			maskElement.appendChild(styleElement);
			progressBarElementContainer.style.setProperty("position", "fixed", "important");
			progressBarElementContainer.style.setProperty("top", "0", "important");
			progressBarElementContainer.style.setProperty("left", "0", "important");
			progressBarElementContainer.style.setProperty("width", "0", "important");
			progressBarElementContainer.style.setProperty("height", "8px", "important");
			progressBarElementContainer.style.setProperty("overflow", "hidden", "important");
			progressBarElementContainer.style.setProperty("will-change", "width", "important");
			const progressBarElement = createElement(PROGRESS_CURSOR_TAGNAME, progressBarElementContainer);
			progressBarElement.style.setProperty("position", "absolute", "important");
			progressBarElement.style.setProperty("left", "0");
			progressBarElement.style.setProperty("animation", "single-file-progress 5s linear infinite reverse", "important");
			progressBarElement.style.setProperty("background", "white linear-gradient(-45deg, rgba(0, 0, 0, 0.1) 25%, transparent 25%, transparent 50%, rgba(0, 0, 0, 0.1) 50%, rgba(0, 0, 0, 0.1) 75%, transparent 75%, transparent) repeat scroll 0% 0% / 50px 50px padding-box border-box", "important");
			progressBarElement.style.setProperty("transition", "width 50ms", "important");
			progressBarElement.style.setProperty("width", "calc(100% + 50px)", "important");
			progressBarElement.style.setProperty("height", "100%", "important");
			progressBarElement.style.setProperty("inset-inline-start", "auto");
		}
		return progressBarElementContainer;
	}

	function createLogsWindowElement() {
		let logsWindowElement = document.querySelector(LOGS_WINDOW_TAGNAME);
		if (!logsWindowElement) {
			logsWindowElement = document.createElement(LOGS_WINDOW_TAGNAME);
			logsWindowElement.className = SINGLE_FILE_UI_ELEMENT_CLASS;
		}
		const styleElement = document.createElement("style");
		logsWindowElement.appendChild(styleElement);
		styleElement.textContent = "@keyframes single-file-pulse { 0% { opacity: .5 } 100% { opacity: 1 }";
		return logsWindowElement;
	}

	function setLogsWindowStyle() {
		initStyle(logsWindowElement);
		logsWindowElement.style.setProperty("opacity", "0.9", "important");
		logsWindowElement.style.setProperty("padding", "4px", "important");
		logsWindowElement.style.setProperty("position", "fixed", "important");
		logsWindowElement.style.setProperty("bottom", "24px", "important");
		logsWindowElement.style.setProperty("left", "8px", "important");
		logsWindowElement.style.setProperty("z-index", 2147483647, "important");
		logsWindowElement.style.setProperty("background-color", "white", "important");
		logsWindowElement.style.setProperty("min-width", browser.i18n.getMessage("logPanelWidth") + "px", "important");
		logsWindowElement.style.setProperty("min-height", "18px", "important");
		logsWindowElement.style.setProperty("transition", "height 100ms", "important");
		logsWindowElement.style.setProperty("will-change", "height", "important");
	}

	function updateLog(id, textContent, textStatus) {
		let lineElement = logsWindowElement.querySelector("[data-id='" + id + "']");
		if (!lineElement) {
			lineElement = createElement(LOGS_LINE_TAGNAME, logsWindowElement);
			lineElement.setAttribute("data-id", id);
			lineElement.style.setProperty("display", "flex");
			lineElement.style.setProperty("justify-content", "space-between");
			const textElement = createElement(LOGS_LINE_ELEMENT_TAGNAME, lineElement);
			textElement.style.setProperty("font-size", "13px", "important");
			textElement.style.setProperty("font-family", "arial, sans-serif", "important");
			textElement.style.setProperty("color", "black", "important");
			textElement.style.setProperty("background-color", "white", "important");
			textElement.style.setProperty("opacity", "1", "important");
			textElement.style.setProperty("transition", "opacity 200ms", "important");
			textElement.textContent = textContent;
			const statusElement = createElement(LOGS_LINE_ELEMENT_TAGNAME, lineElement);
			statusElement.style.setProperty("font-size", "11px", "important");
			statusElement.style.setProperty("font-family", "arial, sans-serif", "important");
			statusElement.style.setProperty("color", "black", "important");
			statusElement.style.setProperty("background-color", "white", "important");
			statusElement.style.setProperty("min-width", "15px", "important");
			statusElement.style.setProperty("text-align", "center", "important");
			statusElement.style.setProperty("will-change", "opacity", "important");
		}
		updateLogLine(lineElement, textContent, textStatus);
	}

	function updateLogLine(lineElement, textContent, textStatus) {
		const textElement = lineElement.childNodes[0];
		const statusElement = lineElement.childNodes[1];
		textElement.textContent = textContent;
		statusElement.style.setProperty("color", textStatus == "✓" ? "#055000" : "black", "important");
		if (textStatus == "✓") {
			textElement.style.setProperty("opacity", ".5", "important");
			statusElement.style.setProperty("animation", "none", "important");
		} else {
			statusElement.style.setProperty("opacity", ".5", "important");
			statusElement.style.setProperty("animation", "single-file-pulse 1s linear infinite alternate", "important");
		}
		statusElement.textContent = textStatus;
	}

	function clearLogs() {
		logsWindowElement = createLogsWindowElement();
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

	function determineTargetElementCeil(target, widthDistance, parents) {
		if (Math.ceil(widthDistance / SELECT_PX_THRESHOLD) <= parents.length) {
			target = parents[parents.length - Math.ceil(widthDistance / SELECT_PX_THRESHOLD) - 1];
		}
		return target;
	}

	function determineTargetElementFloor(target, widthDistance, parents) {
		if (Math.floor(widthDistance / SELECT_PX_THRESHOLD) <= parents.length) {
			target = parents[parents.length - Math.floor(widthDistance / SELECT_PX_THRESHOLD) - 1];
		}
		return target;
	}

	function createElement(tagName, parentElement) {
		const element = document.createElement(tagName);
		element.className = SINGLE_FILE_UI_ELEMENT_CLASS;
		parentElement.appendChild(element);
		initStyle(element);
		return element;
	}

	function initStyle(element) {
		allProperties.forEach(property => element.style.setProperty(property, "initial", "important"));
	}

})();
