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

/* global browser, document, getComputedStyle, addEventListener, removeEventListener, requestAnimationFrame, scrollX, scrollY, setTimeout */

this.singlefile.ui = this.singlefile.ui || (() => {

	const MASK_TAGNAME = "singlefile-mask";
	const PROGRESS_BAR_TAGNAME = "singlefile-progress-bar";
	const SELECTION_ZONE_TAGNAME = "single-file-selection-zone";
	const LOGS_WINDOW_TAGNAME = "singlefile-logs-window";
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

	function updateLog(id, textContent, textStatus) {
		let lineElement = logsWindowElement.querySelector("[data-id='" + id + "']");
		if (!lineElement) {
			lineElement = createElement("div", logsWindowElement);
			lineElement.setAttribute("data-id", id);
			lineElement.style.setProperty("display", "flex");
			lineElement.style.setProperty("justify-content", "space-between");
			const textElement = createElement("span", lineElement);
			textElement.style.setProperty("font-size", "13px", "important");
			textElement.style.setProperty("font-family", "arial, sans-serif", "important");
			textElement.style.setProperty("color", "black", "important");
			textElement.style.setProperty("background-color", "white", "important");
			textElement.textContent = textContent;
			const statusElement = createElement("span", lineElement);
			statusElement.style.setProperty("font-size", "13px", "important");
			statusElement.style.setProperty("font-family", "arial, sans-serif", "important");
			statusElement.style.setProperty("color", "black", "important");
			statusElement.style.setProperty("background-color", "white", "important");
			statusElement.style.setProperty("min-width", "15px", "important");
			statusElement.style.setProperty("text-align", "center", "important");
		}
		updateLogLine(lineElement, textContent, textStatus);
	}

	function updateLogLine(lineElement, textContent, textStatus) {
		lineElement.childNodes[0].textContent = textContent;
		const statusElement = lineElement.childNodes[1];
		statusElement.style.setProperty("color", textStatus == "✓" ? "#055000" : "black", "important");
		statusElement.textContent = textStatus;
	}

	function clearLogs() {
		logsWindowElement = createLogsWindowElement();
	}

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
			selectorElement.style.setProperty("top", (scrollY + boundingRect.top - 10) + "px");
			selectorElement.style.setProperty("left", (scrollX + boundingRect.left - 10) + "px");
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
		let progressBarElement = document.querySelector(PROGRESS_BAR_TAGNAME);
		if (!progressBarElement) {
			progressBarElement = createElement(PROGRESS_BAR_TAGNAME, maskElement);
			progressBarElement.style.setProperty("background-color", "white", "important");
			progressBarElement.style.setProperty("background-image", "linear-gradient( -45deg, rgba(0, 0, 0, .2) 25%, transparent 25%, transparent 50%, rgba(0, 0, 0, .2) 50%, rgba(0, 0, 0, .2) 75%, transparent 75%, transparent )", "important");
			progressBarElement.style.setProperty("position", "fixed", "important");
			progressBarElement.style.setProperty("top", "0", "important");
			progressBarElement.style.setProperty("left", "0", "important");
			progressBarElement.style.setProperty("width", "0", "important");
			progressBarElement.style.setProperty("height", "8px", "important");
			progressBarElement.style.setProperty("transition", "width 100ms", "important");
			progressBarElement.style.setProperty("will-change", "width", "important");
			progressBarElement.style.setProperty("animation", "single-file-progress 2s linear infinite");
		}
		return progressBarElement;
	}

	function createLogsWindowElement() {
		let logsWindowElement = document.querySelector(LOGS_WINDOW_TAGNAME);
		if (!logsWindowElement) {
			logsWindowElement = document.createElement(LOGS_WINDOW_TAGNAME);
		}
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
		logsWindowElement.style.setProperty("min-height", "16px", "important");
		logsWindowElement.style.setProperty("transition", "height 100ms", "important");
		logsWindowElement.style.setProperty("will-change", "height", "important");
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
		parentElement.appendChild(element);
		initStyle(element);
		return element;
	}

	function initStyle(element) {
		allProperties.forEach(property => element.style.setProperty(property, "initial", "important"));
	}

})();
