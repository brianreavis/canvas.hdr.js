/*
 * "hdr2d" Canvas Context
 * Copyright (c) 2012 Brian Reavis, http://thirdroute.com/
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

(function() {
	
	// detect needed features
	// --------------------------------------------------------------
	
	var __f = function(obj) {
		if (typeof window[obj] === 'undefined') {
			if (typeof console !== 'undefined') {
				console.log('"hdr2d" canvas context not supported (' + obj + ' needed)');
			}
			return false;
		}
		return true;
	}
	
	if (!__f('HTMLCanvasElement')) return;
	if (!__f('ArrayBuffer')) return;
	if (!__f('Float32Array')) return;
	
	// globals
	// --------------------------------------------------------------
	
	window.HDR2D_BLEND_SRC       = 0;
	window.HDR2D_BLEND_DST       = 1;
	window.HDR2D_BLEND_CLEAR     = 2;
	window.HDR2D_BLEND_XOR       = 3;
	window.HDR2D_BLEND_OVER      = 4;
	window.HDR2D_BLEND_IN        = 5;
	window.HDR2D_BLEND_OUT       = 6;
	window.HDR2D_BLEND_ATOP      = 7;
	window.HDR2D_BLEND_DST_OVER  = 8;
	window.HDR2D_BLEND_DST_IN    = 9;
	window.HDR2D_BLEND_DST_OUT   = 10;
	window.HDR2D_BLEND_DST_ATOP  = 11;
	
	window.HDR2D_BLEND_ADD       = 12;
	window.HDR2D_BLEND_SUBTRACT  = 13;
	
	// data structures / fundamental types
	// --------------------------------------------------------------
		
	/**
	 * Image data storage structure for HDR images.
	 * @constructor
	 * @param {int} width  - image width.
	 * @param {int} height - image height.
	 */
	var ImageDataHDR = function(width, height) {
		this.width  = width;
		this.height = height;
		this.data   = new Float32Array(new ArrayBuffer(width * height * 16));
	};
		
	// canvas context extension
	// --------------------------------------------------------------
		
	HTMLCanvasElement.prototype.getContext = (function() {
		var base = HTMLCanvasElement.prototype.getContext;
		
		return function() {
			if (arguments[0] !== 'hdr2d') {
				return base.apply(this, arguments);
			}
			
			// setup
			// -------------------------------------------------------

			var canvas = this;
			
			var CANVAS_WIDTH     = canvas.width;
			var CANVAS_HEIGHT    = canvas.height;
			var context2D        = base.apply(this, ['2d']);
			var imageData2D      = context2D.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
			var imageData2DPixel = context2D.getImageData(0, 0, 1, 1);
			var imageData2DHDR   = new ImageDataHDR(CANVAS_WIDTH, CANVAS_HEIGHT);
			
			var context = {
				canvas: canvas,
				globalAlpha: 1,
				globalBlendMode: HDR2D_BLEND_OVER,
				imageData: imageData2DHDR,
				range: {
					r: {low: 0, high: 255},
					g: {low: 0, high: 255},
					b: {low: 0, high: 255},
					a: {low: 0, high: 255}
				}
			};
			
			// private methods
			// -------------------------------------------------------
		
			/**
			 * Returns a 2-dimensional slice of the image data
			 * as an 
			 * @param {int} x      - x coordinate (px).
			 * @param {int} y      - y coordinate (px).
			 * @param {int} width  - width of the slice (px).
			 * @param {int} height - height of the slice (px).
			 */
			var getImageDataSlice = function(x, y, width, height) {
				var i, j, loc;
				
				var w = Math.min(width, CANVAS_WIDTH - x);
				var h = Math.min(height, CANVAS_HEIGHT - y);
				var i_bound = x + w;
				var j_bound = y + h;
				
				var result = new ImageDataHDR(w, h);
				var data_pos = 0;
				
				for (j = y; j < j_bound; j++) {
					for (i = x; i < i_bound; i++) {
						loc = (j * CANVAS_WIDTH + i) * 4;
						result.data[data_pos++] = imageData2DHDR.data[loc];
						result.data[data_pos++] = imageData2DHDR.data[loc+1];
						result.data[data_pos++] = imageData2DHDR.data[loc+2];
						result.data[data_pos++] = imageData2DHDR.data[loc+3];
					}
				}
				
				return result;
			};
			
			/**
			 * Returns a function used for alpha compositing color and alpha channels,
			 * given a particular compositing / blending mode.
			 *
			 * @param {int} mode - HDR2D_BLEND_SRC, HDR2D_BLEND_DST, etc.
			 */
			var getBlendFunction = (function() {
				var modes = {};
				
				modes[HDR2D_BLEND_SRC] = {
					component: function(comp_src, comp_dest, alpha_src, alpha_dest) {
						return comp_src * alpha_src;
					},
					alpha: function(alpha_src, alpha_dest) {
						return alpha_src;
					}
				};
				modes[HDR2D_BLEND_DST] = {
					component: function(comp_src, comp_dest, alpha_src, alpha_dest) {
						return comp_dest * alpha_dest;
					},
					alpha: function(alpha_src, alpha_dest) {
						return alpha_dest;
					}
				};
				modes[HDR2D_BLEND_CLEAR] = {
					component: function(comp_src, comp_dest, alpha_src, alpha_dest) {
						return 0;
					},
					alpha: function(alpha_src, alpha_dest) {
						return 0;
					}
				};
				modes[HDR2D_BLEND_XOR] = {
					component: function(comp_src, comp_dest, alpha_src, alpha_dest) {
						return comp_src * alpha_src * (1 - alpha_dest) + comp_dest * alpha_dest * (1 - alpha_src);
					},
					alpha: function(alpha_src, alpha_dest) {
						return alpha_src + alpha_dest - 2 * alpha_src * alpha_dest;
					}
				};
				modes[HDR2D_BLEND_OVER] = {
					component: function(comp_src, comp_dest, alpha_src, alpha_dest) {
						return comp_src * alpha_src + comp_dest * alpha_dest * (1 - alpha_src);
					},
					alpha: function(alpha_src, alpha_dest) {
						return alpha_src + alpha_dest - alpha_src * alpha_dest;
					}
				};
				modes[HDR2D_BLEND_IN] = {
					component: function(comp_src, comp_dest, alpha_src, alpha_dest) {
						return comp_src * alpha_src * alpha_dest;
					},
					alpha: function(alpha_src, alpha_dest) {
						return alpha_src * alpha_dest;
					}
				};
				modes[HDR2D_BLEND_OUT] = {
					component: function(comp_src, comp_dest, alpha_src, alpha_dest) {
						return comp_src * alpha_src * (1 - alpha_dest);
					},
					alpha: function(alpha_src, alpha_dest) {
						return alpha_src * (1 - alpha_dest);
					}
				};
				modes[HDR2D_BLEND_ATOP] = {
					component: function(comp_src, comp_dest, alpha_src, alpha_dest) {
						return comp_src * alpha_src * alpha_dest + comp_dest * alpha_dest * (1 - alpha_src);
					},
					alpha: function(alpha_src, alpha_dest) {
						return alpha_dest;
					}
				};
				modes[HDR2D_BLEND_DST_OVER] = {
					component: function(comp_src, comp_dest, alpha_src, alpha_dest) {
						return comp_dest * alpha_dest + comp_src * alpha_src * (1 - alpha_dest);
					},
					alpha: function(alpha_src, alpha_dest) {
						return alpha_src + alpha_dest - alpha_src * alpha_dest;
					}
				};
				modes[HDR2D_BLEND_DST_IN] = {
					component: function(comp_src, comp_dest, alpha_src, alpha_dest) {
						return comp_dest * alpha_dest * alpha_src;
					},
					alpha: function(alpha_src, alpha_dest) {
						return alpha_src * alpha_dest;
					}
				};
				modes[HDR2D_BLEND_DST_OUT] = {
					component: function(comp_src, comp_dest, alpha_src, alpha_dest) {
						return comp_dest * alpha_dest * (1 - alpha_src);
					},
					alpha: function(alpha_src, alpha_dest) {
						return alpha_dest * (1 - alpha_src);
					}
				};
				modes[HDR2D_BLEND_DST_ATOP] = {
					component: function(comp_src, comp_dest, alpha_src, alpha_dest) {
						return comp_dest * alpha_dest * alpha_src + comp_src * alpha_src * (1 - alpha_dest);
					},
					alpha: function(alpha_src, alpha_dest) {
						return alpha_src;
					}
				};
				modes[HDR2D_BLEND_ADD] = {
					component: function(comp_src, comp_dest, alpha_src, alpha_dest) {
						return comp_dest * alpha_dest + comp_src + alpha_src;
					},
					alpha: modes[HDR2D_BLEND_OVER].alpha
				};
				modes[HDR2D_BLEND_SUBTRACT] = {
					component: function(comp_src, comp_dest, alpha_src, alpha_dest) {
						return comp_dest * alpha_dest - comp_src + alpha_src;
					},
					alpha: modes[HDR2D_BLEND_OVER].alpha
				};
				
				return function(mode) {
					return modes[mode];
				};
			})();
			
			// public methods
			// -------------------------------------------------------
		
			/**
			 * Sets the color at the given position.
			 * @param {int}    x     - x coordinate.
			 * @param {int}    y     - y coordinate.
			 * @param {object} color - An object containing r, g, b, a color components.
			 */
			context.setPixel = function(x, y, color) {
				var i = (Math.round(x) + Math.round(y) * CANVAS_WIDTH) * 4;
				var blend = getBlendFunction(context.globalBlendMode);
				
				if (typeof color.a === 'undefined') {
					color.a = 255;
				}
				
				var alpha_dest   = imageData2DHDR.data[i+3] / 255;
				var alpha_src    = color.a * context.globalAlpha / 255;
				
				imageData2DHDR.data[i]   = blend.component(color.r, imageData2DHDR.data[i],  alpha_src, alpha_dest);
				imageData2DHDR.data[i+1] = blend.component(color.g, imageData2DHDR.data[i+1], alpha_src, alpha_dest);
				imageData2DHDR.data[i+2] = blend.component(color.b, imageData2DHDR.data[i+2], alpha_src, alpha_dest);
				imageData2DHDR.data[i+3] = blend.alpha(alpha_src, alpha_dest) * 255;
				
				imageData2DPixel.data[0] = (imageData2DHDR.data[i] - context.range.r.low) / (context.range.r.high - context.range.r.low) * 255;
				imageData2DPixel.data[1] = (imageData2DHDR.data[i+1] - context.range.g.low) / (context.range.g.high - context.range.g.low) * 255;
				imageData2DPixel.data[2] = (imageData2DHDR.data[i+2] - context.range.b.low) / (context.range.b.high - context.range.b.low) * 255;
				imageData2DPixel.data[3] = (imageData2DHDR.data[i+3] - context.range.a.low) / (context.range.a.high - context.range.a.low) * 255;
				context2D.putImageData(imageData2DPixel, x, y);
			};
			
			/**
			 * Returns the color at the given position.
			 * @param {int} x - x coordinate.
			 * @param {int} y - y coordinate.
			 * @returns {object}
			 */
			context.getPixel = function(x, y) {
				var i = (Math.round(x) + Math.round(y) * CANVAS_WIDTH) * 4;
				return {
					r: imageData2DHDR.data[i],
					g: imageData2DHDR.data[i+1],
					b: imageData2DHDR.data[i+2],
					a: imageData2DHDR.data[i+3]
				};
			};
		
			/**
			 * Returns the image data for a given region of the canvas context.
			 * (for drop-in replacement)
			 *
			 * @param {int} x      - x coordinate (px).
			 * @param {int} y      - y coordinate (px).
			 * @param {int} width  - width of the slice (px).
			 * @param {int} height - height of the slice (px).
			 */
			context.getImageData = function(x, y, width, height) {
				if (x === 0 && y === 0 && width === canvas_height && height === canvas_height) {
					return context.imageData;
				} else {
					return getImageDataSlice(x, y, width, height);
				}
			};
			
			/**
			 * Draws an image to the canvas.
			 * (for drop-in replacement)
			 *
			 * @param {object} image - HTMLImageElement or HTMLCanvasElement or HTMLVideoElement.
			 * @param {number} dx - Destination x coordinate (px).
			 * @param {number} dy - Destination x coordinate (px).
			 * @param {number} dWidth - Destination width (px).
			 * @param {number} dHeight - Destination height (px).
			 */
			context.drawImage = function(image, dx, dy, dWidth, dHeight) {
				var i, x, y, alpha;
				var args = arguments;
				
				var sx = 0;
				var sy = 0;
				var sWidth = image.width;
				var sHeight = image.height;
				
				if (arguments.length > 5) {
					sx = args[1];
					sy = args[2];
					sWidth = args[3];
					sHeight = args[4];
					dx = args[5];
					dy = args[6];
					dWidth = args[7];
					dHeight = args[8];
				}
				
				dx = dx || 0;
				dy = dy || 0;
				dWidth = dWidth || sWidth;
				dHeight = dHeight || sHeight;
				
				// draw and transform image natively
				var canvas_tmp = document.createElement('canvas');
				canvas_tmp.width = CANVAS_WIDTH;
				canvas_tmp.height = CANVAS_HEIGHT;
				
				var context_tmp = canvas_tmp.getContext('2d');
				context_tmp.globalAlpha = 1;
				context_tmp.drawImage.apply(context_tmp, args);
				
				// composite image onto hdr canvas
				var alpha_src, alpha_dest, alpha_merged;
				var blend = getBlendFunction(context.globalBlendMode);
				var data  = context_tmp.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT).data;
				var x_min = Math.floor(dx);
				var y_min = Math.floor(dy);
				var x_max = Math.min(CANVAS_WIDTH, Math.ceil(dx + dWidth));
				var y_max = Math.min(CANVAS_WIDTH, Math.ceil(dy + dHeight));
				for (y = y_min; y < y_max; y++) {
					for (x = x_min; x < x_max; x++) {
						i = (y * CANVAS_WIDTH + x) * 4;
						
						alpha_dest = imageData2DHDR.data[i+3] / 255;
						alpha_src  = (data[i+3] * context.globalAlpha) / 255;
						
						imageData2DHDR.data[i] = blend.component(data[i], imageData2DHDR.data[i], alpha_src, alpha_dest);
						imageData2DHDR.data[i+1] = blend.component(data[i+1], imageData2DHDR.data[i+1], alpha_src, alpha_dest);
						imageData2DHDR.data[i+2] = blend.component(data[i+2], imageData2DHDR.data[i+2], alpha_src, alpha_dest);
						imageData2DHDR.data[i+3] = blend.alpha(alpha_src, alpha_dest) * 255;
					}
				}
				
				delete context_tmp;
				delete canvas_tmp;
				context.render();
			};
			
			/**
			 * Transforms the HDR data in its entirety into the 
			 * 8-bit color representation and  renders it to the canvas.
			 */
			context.render = function() {
				var ranges = [];
				for (var k in context.range) {
					if (context.range.hasOwnProperty(k)) {
						ranges.push(context.range[k]);
					}
				}
				for (var r, i = 0, n = imageData2DHDR.data.length; i < n; i++) {
					r = ranges[i % 4];
					imageData2D.data[i] = (imageData2DHDR.data[i] - r.low) / (r.high - r.low) * 255;
				}
				context2D.putImageData(imageData2D, 0, 0);
			};
			
			return context;
		};
	})();
 	
})();