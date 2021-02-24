/* global document */

(() => {

	document.currentScript.remove();
	processNode(document);

	function processNode(node) {
		node.querySelectorAll("template[shadowmode]").forEach(element => {
			let shadowRoot = element.parentElement.shadowRoot;
			if (!shadowRoot) {
				try {
					shadowRoot = element.parentElement.attachShadow({
						mode: element.getAttribute("shadowmode"),
						delegatesFocus: Boolean(element.getAttribute("delegatesfocus"))
					});
					shadowRoot.innerHTML = element.innerHTML;
					element.remove();
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