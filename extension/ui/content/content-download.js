/* global addEventListener, removeEventListener, document, URL, MouseEvent, Blob, top */

addEventListener("message", listener, false);

function listener(event) {
	removeEventListener("message", listener, false);
	const [filename, content] = JSON.parse(event.data);
	const link = document.createElement("a");
	document.body.appendChild(link);
	link.download = filename;
	const url = URL.createObjectURL(new Blob([content], { type: "text/html" }));
	link.href = url;
	link.dispatchEvent(new MouseEvent("click"));
	URL.revokeObjectURL(url);
	top.postMessage("content.saved", "*");
}