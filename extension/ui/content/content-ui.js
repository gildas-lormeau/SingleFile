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

/* global document, getComputedStyle, addEventListener, removeEventListener, requestAnimationFrame, scrollX, scrollY */

this.singlefile.ui = this.singlefile.ui || (() => {

	const MASK_TAGNAME = "singlefile-mask";
	const PROGRESS_BAR_TAGNAME = "singlefile-progress-var";
	const SELECTION_ZONE_TAGNAME = "single-file-selection-zone";
	const SELECT_PX_THRESHOLD = 8;

	let selectedAreaElement;

	return {
		init() {
			let maskElement = document.querySelector(MASK_TAGNAME);
			if (!maskElement) {
				requestAnimationFrame(() => {
					const maskElement = createMaskElement();
					createProgressBarElement(maskElement);
					maskElement.offsetWidth;
					maskElement.style.setProperty("background-color", "black", "important");
					maskElement.style.setProperty("opacity", .3, "important");
					document.body.offsetWidth;
				});
			}
		},
		onprogress(index, maxIndex) {
			const progressBarElement = document.querySelector(PROGRESS_BAR_TAGNAME);
			if (progressBarElement && maxIndex) {
				const width = Math.floor((index / maxIndex) * 100) + "%";
				if (progressBarElement.style.width != width) {
					requestAnimationFrame(() => progressBarElement.style.setProperty("width", Math.floor((index / maxIndex) * 100) + "%", "important"));
				}
			}
		},
		end() {
			const maskElement = document.querySelector(MASK_TAGNAME);
			if (maskElement) {
				requestAnimationFrame(() => maskElement.remove());
			}
		},
		getSelectedArea
	};

	function getSelectedArea() {
		return new Promise(resolve => {
			addEventListener("mousemove", mousemoveListener, true);
			addEventListener("click", clickListener, true);
			addEventListener("keyup", keypressListener, true);

			function mousemoveListener(event) {
				const targetElement = getTarget(event);
				if (targetElement) {
					selectedAreaElement = targetElement;
					moveAreaSelector(targetElement);
				}
			}

			function clickListener(event) {
				select(selectedAreaElement);
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
			maskElement.style.setProperty("z-index", 2147483647, "important");
			maskElement.style.setProperty("transition", "opacity 250ms", "important");
		}
		return maskElement;
	}

	function createProgressBarElement(maskElement) {
		let progressBarElement = document.querySelector(PROGRESS_BAR_TAGNAME);
		if (!progressBarElement) {
			progressBarElement = createElement(PROGRESS_BAR_TAGNAME, maskElement);
			progressBarElement.style.setProperty("background-color", "white", "important");
			progressBarElement.style.setProperty("position", "fixed", "important");
			progressBarElement.style.setProperty("top", "0", "important");
			progressBarElement.style.setProperty("left", "0", "important");
			progressBarElement.style.setProperty("width", "0", "important");
			progressBarElement.style.setProperty("height", "8px", "important");
			progressBarElement.style.setProperty("transition", "width 100ms", "important");
			progressBarElement.style.setProperty("will-change", "width", "important");
		}
		return progressBarElement;
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
		Array.from(getComputedStyle(element)).forEach(property => element.style.setProperty(property, "initial", "important"));
		return element;
	}

})();
