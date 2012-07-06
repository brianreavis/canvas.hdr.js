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

(function(window) {

	var __f = function(obj) {
		if (typeof window[obj] === 'undefined') {
			if (typeof console !== 'undefined') {
				console.log('Warning: "hdr2d" canvas context not supported (' + obj + ' needed)');
			}
			return false;
		}
		return true;
	}

	if (!__f('HTMLCanvasElement')) return;
	if (!__f('ArrayBuffer')) return;
	if (!__f('Float32Array')) return;

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

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
	window.HDR2D_BLEND_MULTIPLY  = 14;
	window.HDR2D_BLEND_AVERAGE   = 15;
	window.HDR2D_BLEND_SCREEN    = 16;
	window.HDR2D_BLEND_SOFTLIGHT = 17;
	window.HDR2D_BLEND_HARDLIGHT = 18;
	window.HDR2D_BLEND_OVERLAY   = 19;

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	var canvas = document.createElement('canvas');
	canvas.width = 1;
	canvas.height = 1;
	var context = canvas.getContext('2d');
	var _imageData2DPixel = context.getImageData(0, 0, 1, 1);

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	/**
	 * Image data storage structure for HDR images.
	 * Mirrors ImageData in design.
	 *
	 * @constructor
	 * @param {int} width
	 * @param {int} height
	 */
	var ImageDataHDR = function(width, height) {
		this.width  = width;
		this.height = height;
		this.data   = new Float32Array(new ArrayBuffer(width * height * 16));
	};

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	/**
	 * @constructor
	 * @param {HTMLCanvasElement} canvas
	 */
	var CanvasRenderingContextHDR2D = function(canvas) {
		this._context   = canvas.getContext.apply(canvas, ['2d']);
		this._imageData = this._context.getImageData(0, 0, canvas.width, canvas.height);
		this.imageData  = new ImageDataHDR(canvas.width, canvas.height);
		this.canvas     = canvas;
	};

	CanvasRenderingContextHDR2D.prototype.globalAlpha = 1;
	CanvasRenderingContextHDR2D.prototype.globalBlendMode = HDR2D_BLEND_OVER;
	CanvasRenderingContextHDR2D.prototype.range = {
		r: {low: 0, high: 255},
		g: {low: 0, high: 255},
		b: {low: 0, high: 255},
		a: {low: 0, high: 255}
	};

	/**
	 * Returns a function used for alpha compositing color and alpha channels,
	 * given a particular compositing / blending mode.
	 *
	 * @param {int} mode - HDR2D_BLEND_SRC, HDR2D_BLEND_DST, etc.
	 */
	CanvasRenderingContextHDR2D.prototype.getBlendFunction = (function() {
		var modes = {};

		modes[HDR2D_BLEND_SRC] = {
			component: function(comp_src, comp_dst, alpha_src, alpha_dst) {
				return comp_src * alpha_src;
			},
			alpha: function(alpha_src, alpha_dst) {
				return alpha_src;
			}
		};
		modes[HDR2D_BLEND_DST] = {
			component: function(comp_src, comp_dst, alpha_src, alpha_dst) {
				return comp_dst * alpha_dst;
			},
			alpha: function(alpha_src, alpha_dst) {
				return alpha_dst;
			}
		};
		modes[HDR2D_BLEND_CLEAR] = {
			component: function(comp_src, comp_dst, alpha_src, alpha_dst) {
				return 0;
			},
			alpha: function(alpha_src, alpha_dst) {
				return 0;
			}
		};
		modes[HDR2D_BLEND_XOR] = {
			component: function(comp_src, comp_dst, alpha_src, alpha_dst) {
				return comp_src * alpha_src * (1 - alpha_dst) + comp_dst * alpha_dst * (1 - alpha_src);
			},
			alpha: function(alpha_src, alpha_dst) {
				return alpha_src + alpha_dst - 2 * alpha_src * alpha_dst;
			}
		};
		modes[HDR2D_BLEND_OVER] = {
			component: function(comp_src, comp_dst, alpha_src, alpha_dst) {
				return comp_src * alpha_src + comp_dst * alpha_dst * (1 - alpha_src);
			},
			alpha: function(alpha_src, alpha_dst) {
				return alpha_src + alpha_dst - alpha_src * alpha_dst;
			}
		};
		modes[HDR2D_BLEND_IN] = {
			component: function(comp_src, comp_dst, alpha_src, alpha_dst) {
				return comp_src * alpha_src * alpha_dst;
			},
			alpha: function(alpha_src, alpha_dst) {
				return alpha_src * alpha_dst;
			}
		};
		modes[HDR2D_BLEND_OUT] = {
			component: function(comp_src, comp_dst, alpha_src, alpha_dst) {
				return comp_src * alpha_src * (1 - alpha_dst);
			},
			alpha: function(alpha_src, alpha_dst) {
				return alpha_src * (1 - alpha_dst);
			}
		};
		modes[HDR2D_BLEND_ATOP] = {
			component: function(comp_src, comp_dst, alpha_src, alpha_dst) {
				return comp_src * alpha_src * alpha_dst + comp_dst * alpha_dst * (1 - alpha_src);
			},
			alpha: function(alpha_src, alpha_dst) {
				return alpha_dst;
			}
		};
		modes[HDR2D_BLEND_DST_OVER] = {
			component: function(comp_src, comp_dst, alpha_src, alpha_dst) {
				return comp_dst * alpha_dst + comp_src * alpha_src * (1 - alpha_dst);
			},
			alpha: function(alpha_src, alpha_dst) {
				return alpha_src + alpha_dst - alpha_src * alpha_dst;
			}
		};
		modes[HDR2D_BLEND_DST_IN] = {
			component: function(comp_src, comp_dst, alpha_src, alpha_dst) {
				return comp_dst * alpha_dst * alpha_src;
			},
			alpha: function(alpha_src, alpha_dst) {
				return alpha_src * alpha_dst;
			}
		};
		modes[HDR2D_BLEND_DST_OUT] = {
			component: function(comp_src, comp_dst, alpha_src, alpha_dst) {
				return comp_dst * alpha_dst * (1 - alpha_src);
			},
			alpha: function(alpha_src, alpha_dst) {
				return alpha_dst * (1 - alpha_src);
			}
		};
		modes[HDR2D_BLEND_DST_ATOP] = {
			component: function(comp_src, comp_dst, alpha_src, alpha_dst) {
				return comp_dst * alpha_dst * alpha_src + comp_src * alpha_src * (1 - alpha_dst);
			},
			alpha: function(alpha_src, alpha_dst) {
				return alpha_src;
			}
		};
		modes[HDR2D_BLEND_ADD] = {
			component: function(comp_src, comp_dst, alpha_src, alpha_dst) {
				return comp_dst * alpha_dst + comp_src * alpha_src;
			},
			alpha: modes[HDR2D_BLEND_OVER].alpha
		};
		modes[HDR2D_BLEND_SUBTRACT] = {
			component: function(comp_src, comp_dst, alpha_src, alpha_dst) {
				return comp_dst * alpha_dst - comp_src * alpha_src;
			},
			alpha: modes[HDR2D_BLEND_OVER].alpha
		};
		modes[HDR2D_BLEND_MULTIPLY] = {
			component: function(comp_src, comp_dst, alpha_src, alpha_dst) {
				return (comp_src * comp_dst) / 255 * alpha_src + comp_dst * alpha_dst * (1 - alpha_src);
			},
			alpha: modes[HDR2D_BLEND_OVER].alpha
		};
		modes[HDR2D_BLEND_AVERAGE] = {
			component: function(comp_src, comp_dst, alpha_src, alpha_dst) {
				return (comp_src + comp_dst) / 2 * alpha_src + comp_dst * alpha_dst * (1 - alpha_src);
			},
			alpha: modes[HDR2D_BLEND_OVER].alpha
		};
		modes[HDR2D_BLEND_SCREEN] = {
			component: function(comp_src, comp_dst, alpha_src, alpha_dst) {
				return (255 - (Math.round((255 - comp_src) * (255 - comp_dst)) >> 8)) * alpha_src + comp_dst * alpha_dst * (1 - alpha_src);
			},
			alpha: modes[HDR2D_BLEND_OVER].alpha
		};
		modes[HDR2D_BLEND_OVERLAY] = {
			component: function(comp_src, comp_dst, alpha_src, alpha_dst) {
				return ((comp_src > 128) ? (2 * comp_dst * comp_src / 255) : (255 - 2 * (255 - comp_dst) * (255 - comp_src) / 255)) * alpha_src + comp_dst * alpha_dst * (1 - alpha_src);
			},
			alpha: modes[HDR2D_BLEND_OVER].alpha
		};
		modes[HDR2D_BLEND_SOFTLIGHT] = {
			component: function(comp_src, comp_dst, alpha_src, alpha_dst) {
				return ((comp_dst < 128) ? (2 * ((Math.round(comp_src) >> 1) + 64)) * (comp_dst / 255) : (255 - (2 * (255 - ((Math.round(comp_src) >> 1) + 64)) * (255 - comp_dst) / 255))) * alpha_src + comp_dst * alpha_dst * (1 - alpha_src);
			},
			alpha: modes[HDR2D_BLEND_OVER].alpha
		};
		modes[HDR2D_BLEND_HARDLIGHT] = {
			component: function(comp_src, comp_dst, alpha_src, alpha_dst) {
				return ((comp_src < 128) ? (2 * comp_dst * comp_src / 255) : (255 - 2 * (255 - comp_dst) * (255 - comp_src) / 255)) * alpha_src + comp_dst * alpha_dst * (1 - alpha_src);
			},
			alpha: modes[HDR2D_BLEND_OVER].alpha
		};

		return function(mode) {
			return modes[mode];
		};
	})();

	/**
	 * Sets the color at the given position.
	 * @param {int}    x     - x coordinate (px).
	 * @param {int}    y     - y coordinate (px).
	 * @param {object} color - An object containing r, g, b, a color components.
	 */
	CanvasRenderingContextHDR2D.prototype.setPixel = function(x, y, color) {
		var i = (Math.round(x) + Math.round(y) * this.canvas.width) * 4;
		var blend = this.getBlendFunction(this.globalBlendMode);

		if (typeof color.a === 'undefined') {
			color.a = 255;
		}

		var alpha_dst = this.imageData.data[i + 3] / 255;
		var alpha_src  = color.a * context.globalAlpha / 255;

		this.imageData.data[i]     = blend.component(color.r, this.imageData.data[i],  alpha_src, alpha_dst);
		this.imageData.data[i + 1] = blend.component(color.g, this.imageData.data[i+1], alpha_src, alpha_dst);
		this.imageData.data[i + 2] = blend.component(color.b, this.imageData.data[i+2], alpha_src, alpha_dst);
		this.imageData.data[i + 3] = blend.alpha(alpha_src, alpha_dst) * 255;

		_imageData2DPixel.data[0]  = (this.imageData.data[i] - this.range.r.low) / (this.range.r.high - this.range.r.low) * 255;
		_imageData2DPixel.data[1]  = (this.imageData.data[i + 1] - this.range.g.low) / (this.range.g.high - this.range.g.low) * 255;
		_imageData2DPixel.data[2]  = (this.imageData.data[i + 2] - this.range.b.low) / (this.range.b.high - this.range.b.low) * 255;
		_imageData2DPixel.data[3]  = (this.imageData.data[i + 3] - this.range.a.low) / (this.range.a.high - this.range.a.low) * 255;

		this._context.putImageData(_imageData2DPixel, x, y);
	};

	/**
	 * Returns the color at the given position.
	 * @param {int} x - x coordinate.
	 * @param {int} y - y coordinate.
	 * @returns {object}
	 */
	CanvasRenderingContextHDR2D.prototype.getPixel = function(x, y) {
		var i = (Math.round(x) + Math.round(y) * this.imageData.width) * 4;
		return {
			r: this.imageData.data[i],
			g: this.imageData.data[i + 1],
			b: this.imageData.data[i + 2],
			a: this.imageData.data[i + 3]
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
	CanvasRenderingContextHDR2D.prototype.getImageData = function(x, y, width, height) {
		if (x === 0 && y === 0 && width === this.imageData.width && height === this.imageData.height) {
			return this.imageData;
		} else {
			var w = Math.min(width, this.imageData.width - x);
			var h = Math.min(height, this.imageData.height - y);
			var i_bound = x + w;
			var j_bound = y + h;

			var result = new ImageDataHDR(w, h);

			var i, j, pos_base, pos_result = 0;
			for (j = y; j < j_bound; j++) {
				for (i = x; i < i_bound; i++) {
					pos_base = (j * this.imageData.width + i) * 4;
					result.data[pos_result++] = this.imageData.data[pos_base];
					result.data[pos_result++] = this.imageData.data[pos_base + 1];
					result.data[pos_result++] = this.imageData.data[pos_base + 2];
					result.data[pos_result++] = this.imageData.data[pos_base + 3];
				}
			}

			return result;
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
	CanvasRenderingContextHDR2D.prototype.drawImage = function(image, dx, dy, dWidth, dHeight) {
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
		canvas_tmp.width = this.imageData.width;
		canvas_tmp.height = this.imageData.height;

		var context_tmp = canvas_tmp.getContext('2d');
		context_tmp.globalAlpha = 1;
		context_tmp.drawImage.apply(context_tmp, args);

		// composite image onto hdr canvas
		var i, x, y, alpha_src, alpha_dst;
		var blend = this.getBlendFunction(this.globalBlendMode);
		var data  = context_tmp.getImageData(0, 0, this.imageData.width, this.imageData.height).data;
		var x_min = Math.floor(dx);
		var y_min = Math.floor(dy);
		var x_max = Math.min(this.imageData.width, Math.ceil(dx + dWidth));
		var y_max = Math.min(this.imageData.height, Math.ceil(dy + dHeight));
		for (y = y_min; y < y_max; y++) {
			for (x = x_min; x < x_max; x++) {
				i = (y * this.imageData.width + x) * 4;

				alpha_dst = this.imageData.data[i + 3] / 255;
				alpha_src  = (data[i + 3] * context.globalAlpha) / 255;

				this.imageData.data[i]     = blend.component(data[i], this.imageData.data[i], alpha_src, alpha_dst);
				this.imageData.data[i + 1] = blend.component(data[i + 1], this.imageData.data[i + 1], alpha_src, alpha_dst);
				this.imageData.data[i + 2] = blend.component(data[i + 2], this.imageData.data[i + 2], alpha_src, alpha_dst);
				this.imageData.data[i + 3] = blend.alpha(alpha_src, alpha_dst) * 255;
			}
		}

		this.render();
	};

	/**
	 * Transforms the HDR data in its entirety into the
	 * 8-bit color representation and  renders it to the canvas.
	 */
	CanvasRenderingContextHDR2D.prototype.render = function() {
		var ranges = [];
		for (var k in this.range) {
			if (this.range.hasOwnProperty(k)) {
				ranges.push(this.range[k]);
			}
		}
		for (var r, i = 0, n = this.imageData.data.length; i < n; i++) {
			r = ranges[i % 4];
			this._imageData.data[i] = (this.imageData.data[i] - r.low) / (r.high - r.low) * 255;
		}
		this._context.putImageData(this._imageData, 0, 0);
	};

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	window.ImageDataHDR = ImageDataHDR;
	window.CanvasRenderingContextHDR2D = CanvasRenderingContextHDR2D;

	HTMLCanvasElement.prototype.getContext = (function() {
		var base = HTMLCanvasElement.prototype.getContext;
		return function() {
			if (arguments[0] === 'hdr2d') {
				return new CanvasRenderingContextHDR2D(this);
			}
			return base.apply(this, arguments);
		};
	})();

})(window);