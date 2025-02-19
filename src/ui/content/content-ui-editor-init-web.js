/* global document */

(() => {

	document.currentScript.remove();
	processNode(document);

	function processNode(node) {
		node.querySelectorAll("template[shadowrootmode]").forEach(element => {
			let shadowRoot = element.parentElement.shadowRoot;
			if (!shadowRoot) {
				try {
					shadowRoot = element.parentElement.attachShadow({
						mode: element.getAttribute("shadowrootmode")
					});
					shadowRoot.innerHTML = element.innerHTML;
					element.remove();
					// eslint-disable-next-line no-unused-vars
				} catch (error) {
					// ignored
				}
				if (shadowRoot) {
					processNode(shadowRoot);
				}
			}
		});
	}

})();