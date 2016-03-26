/*
 * Copyright 2011 Gildas Lormeau
 * contact : gildas.lormeau <at> gmail.com
 * 
 * This file is part of SingleFile Core.
 *
 *   SingleFile Core is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU Lesser General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   SingleFile Core is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU Lesser General Public License for more details.
 *
 *   You should have received a copy of the GNU Lesser General Public License
 *   along with SingleFile Core.  If not, see <http://www.gnu.org/licenses/>.
 */

(function() {

	singlefile.nio = {};

	singlefile.nio.RequestManager = function() {
		var cache = {}, keys = [], pendingResponseHandlers = {}, XHR_TIMEOUT = 45000;

		function sendResponses(key) {
			if (pendingResponseHandlers[key]) {
				pendingResponseHandlers[key].forEach(function(callback) {
					callback(cache[key]);
				});
				delete pendingResponseHandlers[key];
			}
		}

		function arrayBufferToBase64(buffer) {
			var binary, bytes, len, i;
			binary = "";
			if (buffer) {
				bytes = new Uint8Array(buffer);
				len = bytes.byteLength;
				for (i = 0; i < len; i++) {
					binary += String.fromCharCode(bytes[i]);
				}
			}
			return btoa(binary);
		}

		this.reset = function() {
			cache = {};
			keys = [];
		};

		this.send = function(url, responseHandler, characterSet, mediaTypeParam, node, scale) {
			var xhr, timeout, key = JSON.stringify({
				url : url,
				characterSet : characterSet,
				mediaTypeParam : mediaTypeParam
			});

			if (cache[key])
				setTimeout(function() {
					responseHandler(cache[key]);
				}, 1);
			else if (pendingResponseHandlers[key])
				pendingResponseHandlers[key].push(responseHandler);
			else {
				pendingResponseHandlers[key] = [ responseHandler ];
				xhr = new XMLHttpRequest();
				xhr.onload = function() {
					clearTimeout(timeout);
					var media = xhr.getResponseHeader("Content-Type");
					var data = mediaTypeParam == "base64" ? arrayBufferToBase64(xhr.response) : xhr.responseText;
			        	
					if (media.indexOf('image') >= 0 && media.indexOf('svg') < 0 && 
						mediaTypeParam == "base64" && (scale < 1 || node && (node.width || node.height))) {
							var img = new Image();
							// When the event "onload" is triggered we can resize the image.
					        img.onload = function()
				            {        
				            	clearTimeout(timeout);
				            	var ratio = Math.min(1, node && node.width ? node.width / img.width : 1,
			            			node && node.height ? node.height / img.height : 1);
		            			if (ratio < 1 || media.indexOf('jp') < 0 || scale < 1) {
					                 // We create a canvas and get its context.
					                var canvas = document.createElement('canvas');
					                var ctx = canvas.getContext('2d');
					
					                // We set the dimensions at the wanted size.
					                canvas.width = img.width * ratio;
					                canvas.height = img.height * ratio;
					
					                // We resize the image with the canvas method drawImage();
					                ctx.drawImage(this, 0, 0, canvas.width, canvas.height);
					                
					                //Determine whether it contains transparent pixels
					                var transparent = false;
					                if (media.indexOf('png') > 0) {
					                  var imgData=ctx.getImageData(0,0,canvas.width,canvas.height);
									  var dat=imgData.data;
									  var n = dat.length;
									  for(var i=0;i< n && !transparent;i+=4){
									    if(dat[i+3]<255){ transparent = true; }
									  }
					                }
									//Decide on the output format
									if (ratio < 1 && transparent) {
										var dp = canvas.toDataURL(media).replace(/data:image.+;base64,/, '');
										if (dp.length < data.length)
											data = dp;
									} else if (media.indexOf('jp') > 0) {
										if (ratio < 1 || scale < 1) {
											var ds = canvas.toDataURL('image/jpeg', scale)
												.replace(/data:image.+;base64,/, '');
											if (ds.length < data.length) {
												data = ds;
												media = 'image/jpeg';
											}
										}
									} else if (!transparent && (media.indexOf('png') < 0 || scale < 1)) {
										var d = canvas.toDataURL('image/png')
											.replace(/data:image.+;base64,/, '');
										var d2 = canvas.toDataURL('image/jpeg', scale)
											.replace(/data:image.+;base64,/, '');
										var min = Math.min(d.length, d2.length, data.length);
										if (min === data.length);
										else if (min === d.length) {
											data = d;
											media = 'image/png';
										} else {
											data = d2;
											media = 'image/jpeg';
										}
									}
		            			}
								cache[key] = {
									url : url,
									status : xhr.status,
									mediaType : media,
									content : data,
									mediaTypeParam : mediaTypeParam
								};
								keys.push(key);
								sendResponses(key);
				            };
					        img.onerror = function() {
								cache[key] = {};
								keys.push(key);
								sendResponses(key);
							};   
					        img.src = "data:" + media + ";base64," + data;
					} else {
						cache[key] = {
							url : url,
							status : xhr.status,
							mediaType : media,
							content : data,
							mediaTypeParam : mediaTypeParam
						};
						keys.push(key);
						sendResponses(key);
					}
				};
				xhr.onerror = function() {
					cache[key] = {};
					keys.push(key);
					sendResponses(key);
				};
				xhr.open("GET", url, true);
				if (mediaTypeParam == "base64") {
					xhr.responseType = "arraybuffer";
				}
				timeout = setTimeout(function() {
					xhr.abort();
					sendResponses(key);
				}, XHR_TIMEOUT);
				try {
					xhr.send(null);
				} catch (e) {
					sendResponses(key);
				}
			}
		};
	};

})();
