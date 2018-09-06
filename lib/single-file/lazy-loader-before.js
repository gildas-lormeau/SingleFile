/* global window, screen, dispatchEvent, Element, UIEvent */

(() => {

	window._singleFile_getBoundingClientRect = Element.prototype.getBoundingClientRect;
	Element.prototype.getBoundingClientRect = function () {
		const boundingRect = window._singleFile_getBoundingClientRect.call(this);
		const top = (boundingRect.top > 0 && boundingRect.top < screen.height) ? boundingRect.top : 0;
		const left = (boundingRect.left > 0 && boundingRect.left < screen.width) ? boundingRect.left : 0;
		const bottom = (boundingRect.bottom > 0 && boundingRect.bottom < screen.height) ? boundingRect.bottom : screen.height;
		const right = (boundingRect.right > 0 && boundingRect.right < screen.width) ? boundingRect.bottom : screen.width;
		return { x: boundingRect.x, y: boundingRect.y, top, bottom, left, right, width: boundingRect.width, height: boundingRect.height };
	};
	dispatchEvent(new UIEvent("scroll"));

})();