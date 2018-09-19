
/* global window, addEventListener, dispatchEvent, CustomEvent, document, HTMLDocument */

this.fontFaceProxy = this.fontFaceProxy || (() => {

	const fontFaces = [];

	if (document instanceof HTMLDocument) {
		const scriptElement = document.createElement("script");
		scriptElement.textContent = `(${hook.toString()})()`;
		document.documentElement.appendChild(scriptElement);
		scriptElement.remove();
		addEventListener("single-file-font-face", event => fontFaces.push(event.detail));
	}

	return {
		getFontsData: () => fontFaces
	};

	function hook() {
		const FONT_STYLE_PROPERTIES = {
			family: "font-family",
			style: "font-style",
			weight: "font-weight",
			stretch: "font-stretch",
			unicodeRange: "unicode-range",
			variant: "font-variant",
			featureSettings: "font-feature-settings"
		};

		Array.from(document.fonts).forEach(fontFace => document.fonts.delete(fontFace));
		const FontFace = window.FontFace;
		window.__defineGetter__("FontFace", () => new Proxy(FontFace, {
			construct(FontFace, argumentsList) {
				const detail = {};
				detail["font-family"] = argumentsList[0];
				detail.src = argumentsList[1];
				const descriptors = argumentsList[2];
				if (descriptors) {
					Object.keys(descriptors).forEach(descriptor => {
						detail[FONT_STYLE_PROPERTIES[descriptor]] = descriptors[descriptor];
					});
				}
				dispatchEvent(new CustomEvent("single-file-font-face", { detail }));
				return new FontFace(...argumentsList);
			}
		}));
	}

})();