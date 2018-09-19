
/* global window, addEventListener, dispatchEvent, CustomEvent, document */

this.fontFaceProxy = this.fontFaceProxy || (() => {

	const scriptElement = document.createElement("script");
	scriptElement.textContent = `(${hook.toString()})()`;
	document.documentElement.appendChild(scriptElement);
	const fontFaces = [];
	addEventListener("single-file-font-face", event => fontFaces.push(event.detail));

	return {
		getFontsData: () => fontFaces
	};

	function hook() {
		Array.from(document.fonts).forEach(fontFace => document.fonts.delete(fontFace));
		const FontFace = window.FontFace;
		window.__defineGetter__("FontFace", () => new Proxy(FontFace, {
			construct(FontFace, argumentsList) {
				const detail = argumentsList;
				dispatchEvent(new CustomEvent("single-file-font-face", { detail }));
				return new FontFace(...argumentsList);
			}
		}));
	}

})();