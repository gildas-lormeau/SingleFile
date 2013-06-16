if (navigator.vendor.indexOf("Opera") != -1) {
	Array.prototype.forEach.call(document.querySelectorAll(".chrome-only-content"), function(content) {
		content.hidden = true;
	});
} else {
	Array.prototype.forEach.call(document.querySelectorAll(".opera-only-content"), function(content) {
		content.hidden = true;
	});
}
