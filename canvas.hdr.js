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
	
	window.HDR2D_BLEND_NONE = 0;
	window.HDR2D_BLEND_ADD = 1;
	window.HDR2D_BLEND_SUBTRACT = 2;
	
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
		var canvas = this;
		var base = HTMLCanvasElement.prototype.getContext;
	
		return function() {
			if (arguments[0] !== 'hdr2d') {
				return base.apply(this, arguments);
			}
			
			// setup
			// -------------------------------------------------------

			var CANVAS_WIDTH   = canvas.width;
			var CANVAS_HEIGHT  = canvas.height;
			
			var context2D      = base.apply(this, ['2d']);
			var imageData2D    = context2D.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
			var imageData2DHDR = new ImageDataHDR(CANVAS_WIDTH, CANVAS_HEIGHT);
			
			var context = {
				canvas: canvas,
				globalAlpha: 1,
				imageData: imageDataHDR,
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
			
			// public methods
			// -------------------------------------------------------
		
			/**
			 * Sets the color at the given position.
			 * @param {int}    x     -  x coordinate.
			 * @param {int}    y     - y coordinate.
			 * @param {object} color - An object containing r, g, b, a color components.
			 */
			context.setPixel = function(x, y, color, mode) {
				var i = x + y * CANVAS_WIDTH;
				
				if (typeof color.a === 'undefined') {
					color.a = 255;
				}
				
				if (typeof mode === 'undefined' || mode === HDR2D_BLEND_NONE) {
					imageData2DHDR.data[i]   = color.r;
					imageData2DHDR.data[i+1] = color.g;
					imageData2DHDR.data[i+2] = color.b;
					imageData2DHDR.data[i+3] = color.a;
				} else if (mode === HDR2D_BLEND_ADD) {
					imageData2DHDR.data[i]   += color.r;
					imageData2DHDR.data[i+1] += color.g;
					imageData2DHDR.data[i+2] += color.b;
					imageData2DHDR.data[i+3] += color.a;
				} else if (mode === HDR2D_BLEND_SUBTRACT) {
					imageData2DHDR.data[i]   = Math.max(0, imageData2DHDR.data[i] - color.r);
					imageData2DHDR.data[i+1] = Math.max(0, imageData2DHDR.data[i+1] - color.g);
					imageData2DHDR.data[i+2] = Math.max(0, imageData2DHDR.data[i+2] - color.b);
					imageData2DHDR.data[i+3] = Math.max(0, imageData2DHDR.data[i+3] - color.a);
				}
				
				// TODO: render this pixel
			};
			
			/**
			 * Returns the color at the given position.
			 * @param {int} x - x coordinate.
			 * @param {int} y - y coordinate.
			 * @returns {object}
			 */
			context.getPixel = function(x, y) {
				var i = x + y * CANVAS_WIDTH;
				return {
					r: imageData2DHDR.data[i],
					g: imageData2DHDR.data[i+1],
					b: imageData2DHDR.data[i+2],
					a: imageData2DHDR.data[i+3]
				}
			};
		
			/**
			 * Returns the image data for a given region of the canvas context.
			 * (for drop-in replacement)
			 *
			 * @param {int} x      - x coordinate (px).
			 * @param {int} y      - y coordinate (px).
			 * @param {int} width  - width of the slice (px).
			 * @param {int} height - height of the slice (px).
			 * @returns {}
			 */
			context.getImageData = function(x, y, width, height) {
				if (x === 0 && y === 0 && width === canvas_height && height === canvas_height) {
					return context.imageData;
				} else {
					return getImageDataSlice(x, y, width, height);
				}
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
				
				for (var r, i = 0, n = context.imageData.data.length; i < n; i++) {
					r = context.range[i % 4];
					imageData2D[i] = (context.imageData.data[i] - r.low) / (r.high - r.low) * 255;
				}
				
				context2D.putImageData(imageData2D, 0, 0);
			};
			
			return context;
		};
	})();
 	
});
