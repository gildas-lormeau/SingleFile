/* global window, dispatchEvent, Element, UIEvent */

(() => {

	Element.prototype.getBoundingClientRect = window._singleFile_getBoundingClientRect;
	delete window._singleFile_getBoundingClientRect;
	dispatchEvent(new UIEvent("scroll"));

})();