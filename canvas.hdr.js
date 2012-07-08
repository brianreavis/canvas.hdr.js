/**
 * 'hdr2d' Canvas Context
 * Copyright (c) 2012 Brian Reavis, http://thirdroute.com/
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * 'Software'), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
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
				console.log('Warning: \'hdr2d\' canvas context not supported (' + obj + ' needed)');
			}
			return false;
		}
		return true;
	};

	if (!__f('HTMLCanvasElement')) { return; }
	if (!__f('ArrayBuffer')) { return; }
	if (!__f('Float32Array')) { return; }

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
	 * Image data storage structure for HDR images
	 * that mirrors ImageData in design.
	 *
	 * @constructor
	 * @see ImageData
	 * @param {Number} width
	 * @param {Number} height
	 */
	var ImageDataHDR = function(width, height) {
		this.width  = width;
		this.height = height;
		this.data   = new Float32Array(new ArrayBuffer(width * height * 16));
	};

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	var parseColor = (function() {
		var namedColors = {
			'aliceblue': 'f0f8ff', 'antiquewhite': 'faebd7', 'aqua': '0000ff', 'aquamarine': '7fffd4',
			'azure': 'f0ffff', 'beige': 'f5f5dc', 'bisque': 'ffe4c4', 'black': '000000', 'blanchedalmond': 'ffebcd',
			'blue': '0000ff', 'blueviolet': '8a2be2', 'brown': 'a52a2a', 'burlywood': 'deb887', 'burntsienna': 'ea7e5d',
			'cadetblue': '5f9ea0', 'chartreuse': '7fff00', 'chocolate': 'd2691e', 'coral': 'ff7f50', 'cornflowerblue': '6495ed',
			'cornsilk': 'fff8dc', 'crimson': 'dc143c', 'cyan': '00ffff', 'darkblue': '00008b', 'darkcyan': '008b8b',
			'darkgoldenrod': 'b8860b', 'darkgray': 'a9a9a9', 'darkgreen': '006400', 'darkgrey': 'a9a9a9', 'darkkhaki': 'bdb76b',
			'darkmagenta': '8b008b', 'darkolivegreen': '556b2f', 'darkorange': 'ff8c00', 'darkorchid': '9932cc', 'darkred': '8b0000',
			'darksalmon': 'e9967a', 'darkseagreen': '8fbc8f', 'darkslateblue': '483d8b', 'darkslategray': '2f4f4f',
			'darkslategrey': '2f4f4f', 'darkturquoise': '00ced1', 'darkviolet': '9400d3', 'deeppink': 'ff1493', 'deepskyblue': '00bfff',
			'dimgray': '696969', 'dimgrey': '696969', 'dodgerblue': '1e90ff', 'firebrick': 'b22222', 'floralwhite': 'fffaf0',
			'forestgreen': '228b22', 'fuchsia': 'ff00ff', 'gainsboro': 'dcdcdc', 'ghostwhite': 'f8f8ff', 'gold': 'ffd700',
			'goldenrod': 'daa520', 'gray': '808080', 'green': '008000', 'greenyellow': 'adff2f', 'grey': '808080', 'honeydew': 'f0fff0',
			'hotpink': 'ff69b4', 'indianred': 'cd5c5c', 'indigo': '4b0082', 'ivory': 'fffff0', 'khaki': 'f0e68c', 'lavender': 'e6e6fa',
			'lavenderblush': 'fff0f5', 'lawngreen': '7cfc00', 'lemonchiffon': 'fffacd', 'lightblue': 'add8e6', 'lightcoral': 'f08080',
			'lightcyan': 'e0ffff', 'lightgoldenrodyellow': 'fafad2', 'lightgray': 'd3d3d3', 'lightgreen': '90ee90', 'lightgrey': 'd3d3d3',
			'lightpink': 'ffb6c1', 'lightsalmon': 'ffa07a', 'lightseagreen': '20b2aa', 'lightskyblue': '87cefa', 'lightslategray': '778899',
			'lightslategrey': '789', 'lightsteelblue': 'b0c4de', 'lightyellow': 'ffffe0', 'lime': '00ff00', 'limegreen': '32cd32',
			'linen': 'faf0e6', 'magenta': 'ff00ff', 'maroon': '800000', 'mediumaquamarine': '66cdaa', 'mediumblue': '0000cd',
			'mediumorchid': 'ba55d3', 'mediumpurple': '9370db', 'mediumseagreen': '3cb371', 'mediumslateblue': '7b68ee',
			'mediumspringgreen': '00fa9a', 'mediumturquoise': '48d1cc', 'mediumvioletred': 'c71585', 'midnightblue': '191970',
			'mintcream': 'f5fffa', 'mistyrose': 'ffe4e1', 'moccasin': 'ffe4b5', 'navajowhite': 'ffdead', 'navy': '000080',
			'oldlace': 'fdf5e6', 'olive': '808000', 'olivedrab': '6b8e23', 'orange': 'ffa500', 'orangered': 'ff4500', 'orchid': 'da70d6',
			'palegoldenrod': 'eee8aa', 'palegreen': '98fb98', 'paleturquoise': 'afeeee', 'palevioletred': 'db7093', 'papayawhip': 'ffefd5',
			'peachpuff': 'ffdab9', 'peru': 'cd853f', 'pink': 'ffc0cb', 'plum': 'dda0dd', 'powderblue': 'b0e0e6', 'purple': '800080',
			'red': 'f00', 'rosybrown': 'bc8f8f', 'royalblue': '4169e1', 'saddlebrown': '8b4513', 'salmon': 'fa8072', 'sandybrown':
			'f4a460', 'seagreen': '2e8b57', 'seashell': 'fff5ee', 'sienna': 'a0522d', 'silver': 'c0c0c0', 'skyblue': '87ceeb',
			'slateblue': '6a5acd', 'slategray': '708090', 'slategrey': '708090', 'snow': 'fffafa', 'springgreen': '00ff7f',
			'steelblue': '4682b4', 'tan': 'd2b48c', 'teal': '008080', 'thistle': 'd8bfd8', 'tomato': 'ff6347', 'turquoise': '40e0d0',
			'violet': 'ee82ee', 'wheat': 'f5deb3', 'white': 'ffffff', 'whitesmoke': 'f5f5f5', 'yellow': 'ffff00', 'yellowgreen': '9acd32'
		};

		var hueToRGB = function(m1, m2, h) {
			if (h < 0) h++;
			if (h > 1) h--;
			if (h * 6 < 1) return m1 + (m2 - m1) * h * 6;
			if (h * 2 < 1) return m2;
			if (h * 3 < 2) return m1 + (m2 - m1) * (2/3 - h) * 6;
			return m1;
		};

		return function(str) {
			str = str.replace(/^\s\s*/, '').replace(/\s*\s$/, '').toLowerCase();
			if (namedColors.hasOwnProperty(str)) {
				str = '#' + namedColors[str];
			}
			if (str.charAt(0) === '#') {
				if (str.length === 4) {
					str = ['#',
						str.charAt(1), str.charAt(1),
						str.charAt(2), str.charAt(2),
						str.charAt(3), str.charAt(3)
					].join('');
				}
				return {
					r: parseInt(str.substring(1, 3), 16),
					g: parseInt(str.substring(3, 5), 16),
					b: parseInt(str.substring(5, 7), 16),
					a: 255
				};
			} else {
				var delim_start = str.indexOf('(');
				var delim_end = str.indexOf(')', delim_start);
				var prefix = str.substring(0, delim_start).replace(/\s/g, '');
				var parts = str.substring(delim_start + 1, delim_end).split(',');
				var alpha = parts.length > 3 ? parseFloat(parts[3]) * 255 : 255;
				switch (prefix) {
					case 'rgb':
					case 'rgba':
						return {
							r: parseFloat(parts[0]),
							g: parseFloat(parts[1]),
							b: parseFloat(parts[2]),
							a: alpha
						};
						break;
					case 'hsl':
					case 'hsla':
						var h = parseFloat(parts[0]) / 360;
						var s = parseFloat(parts[1]) / 100;
						var l = parseFloat(parts[2]) / 100;
						var m2 = (l <= 0.5) ? l * (s + 1) : l + s - l * s;
						var m1 = l * 2 - m2;
						return {
							r: hueToRGB(m1, m2, h + 1 / 3) * 255,
							g: hueToRGB(m1, m2, h) * 255,
							b: hueToRGB(m1, m2, h - 1 / 3) * 255,
							a: alpha
						};
				}

			}

			return {r: 0, g: 0, b: 0, a: 0};
		};
	})();

	// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

	/**
	 * 2D rendering context that provides 32-bit float per channel
	 * color resolution. Attempts to match CanvasRenderingContext2D
	 * wherever possible.
	 *
	 * @constructor
	 * @see CanvasRenderingContext2D
	 * @param {HTMLCanvasElement} canvas
	 */
	var CanvasRenderingContextHDR2D = function(canvas) {
		this._context   = canvas.getContext.apply(canvas, ['2d']);
		this._imageData = this._context.getImageData(0, 0, canvas.width, canvas.height);
		this.imageData  = new ImageDataHDR(canvas.width, canvas.height);
		this.canvas     = canvas;
	};

	CanvasRenderingContextHDR2D.prototype.fillStyle = '#000000';
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
	 * @param {Number} mode - HDR2D_BLEND_SRC, HDR2D_BLEND_DST, etc.
	 * @returns {Object} An object containing `component` and `alpha` compositing functions.
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
	 * Resets all pixels in the given region to (0,0,0,0).
	 *
	 * @see CanvasRenderingContext2D.prototype.clearRect
	 * @param {Number} x - X coordinate (px).
	 * @param {Number} y - Y coordinate (px).
	 * @param {Number} width - Width of the region (px).
	 * @param {Number} height - Height of the region (px).
	 */
	CanvasRenderingContextHDR2D.prototype.clearRect = function(x, y, width, height) {
		var i, sy, sx;

		var x_min = Math.max(0, Math.min(this.imageData.width, x));
		var y_min = Math.max(0, Math.min(this.imageData.height, y));
		var x_max = Math.max(0, Math.min(this.imageData.width, x + width));
		var y_max = Math.max(0, Math.min(this.imageData.height, y + height));

		for (sy = y_min; sy < y_max; sy++) {
			for (sx = x_min; sx < x_max; sx++) {
				i = (sy * this.imageData.width + sx) * 4;
				this.imageData.data[i]   = 0;
				this.imageData.data[i+1] = 0;
				this.imageData.data[i+2] = 0;
				this.imageData.data[i+3] = 0;
			}
		}

		this.invalidate(x_min, y_min, x_max - x_min, y_max - y_min);
	};

	/**
	 * Composites a rectangle onto the canvas at the given position.
	 *
	 * @see CanvasRenderingContext2D.prototype.fillRect
	 * @param {Number} x - X coordinate (px).
	 * @param {Number} y - Y coordinate (px).
	 * @param {Number} width - Width of the slice (px).
	 * @param {Number} height - Height of the slice (px).
	 */
	CanvasRenderingContextHDR2D.prototype.fillRect = function(x, y, width, height) {
		if (typeof this.fillStyle !== 'object') {
			this.fillStyle = parseColor(this.fillStyle);
		}
		var i, sy, sx;
		var x_min = Math.max(0, Math.min(this.imageData.width, x));
		var y_min = Math.max(0, Math.min(this.imageData.height, y));
		var x_max = Math.max(0, Math.min(this.imageData.width, x + width));
		var y_max = Math.max(0, Math.min(this.imageData.height, y + height));
		var blend = this.getBlendFunction(this.globalBlendMode);

		for (sy = y_min; sy < y_max; sy++) {
			for (sx = x_min; sx < x_max; sx++) {
				i = (sy * this.imageData.width + sx) * 4;
				var alpha_dst = this.imageData.data[i+3] / 255;
				var alpha_src = this.fillStyle.a * this.globalAlpha / 255;

				this.imageData.data[i]    = blend.component(this.fillStyle.r, this.imageData.data[i],   alpha_src, alpha_dst);
				this.imageData.data[i+1]  = blend.component(this.fillStyle.g, this.imageData.data[i+1], alpha_src, alpha_dst);
				this.imageData.data[i+2]  = blend.component(this.fillStyle.b, this.imageData.data[i+2], alpha_src, alpha_dst);
				this.imageData.data[i+3]  = blend.alpha(alpha_src, alpha_dst) * 255;
			}
		}

		this.invalidate(x_min, y_min, x_max - x_min, y_max - y_min);
	};


	/**
	 * Composites the color onto the canvas at the given position.
	 *
	 * @param {Number} x - X coordinate (px).
	 * @param {Number} y - Y coordinate (px).
	 * @param {Object} color - An object containing r, g, b, a color components.
	 */
	CanvasRenderingContextHDR2D.prototype.setPixel = function(x, y, color) {
		var i = (Math.round(x) + Math.round(y) * this.imageData.width) * 4;
		var blend = this.getBlendFunction(this.globalBlendMode);

		if (typeof color.a === 'undefined') {
			color.a = 255;
		}

		var alpha_dst = this.imageData.data[i+3] / 255;
		var alpha_src = color.a * this.globalAlpha / 255;

		this.imageData.data[i]    = blend.component(color.r, this.imageData.data[i],  alpha_src, alpha_dst);
		this.imageData.data[i+1]  = blend.component(color.g, this.imageData.data[i+1], alpha_src, alpha_dst);
		this.imageData.data[i+2]  = blend.component(color.b, this.imageData.data[i+2], alpha_src, alpha_dst);
		this.imageData.data[i+3]  = blend.alpha(alpha_src, alpha_dst) * 255;

		this._imageData.data[i]   = _imageData2DPixel.data[0] = (this.imageData.data[i] - this.range.r.low) / (this.range.r.high - this.range.r.low) * 255;
		this._imageData.data[i+1] = _imageData2DPixel.data[1] = (this.imageData.data[i+1] - this.range.g.low) / (this.range.g.high - this.range.g.low) * 255;
		this._imageData.data[i+2] = _imageData2DPixel.data[2] = (this.imageData.data[i+2] - this.range.b.low) / (this.range.b.high - this.range.b.low) * 255;
		this._imageData.data[i+3] = _imageData2DPixel.data[3] = (this.imageData.data[i+3] - this.range.a.low) / (this.range.a.high - this.range.a.low) * 255;

		this._context.putImageData(_imageData2DPixel, x, y, 0, 0, 1, 1);
	};

	/**
	 * Returns the color at the given position.
	 *
	 * @param {Number} x - X coordinate (px).
	 * @param {Number} y - Y coordinate (px).
	 * @returns {Object}
	 */
	CanvasRenderingContextHDR2D.prototype.getPixel = function(x, y) {
		var i = (Math.round(x) + Math.round(y) * this.imageData.width) * 4;
		return {
			r: this.imageData.data[i],
			g: this.imageData.data[i+1],
			b: this.imageData.data[i+2],
			a: this.imageData.data[i+3]
		};
	};

	/**
	 * Returns the image data for a given region of the canvas context.
	 *
	 * @see CanvasRenderingContext2D.prototype.getImageData
	 * @param {Number} x - X coordinate (px).
	 * @param {Number} y - Y coordinate (px).
	 * @param {Number} width - Width of the slice (px).
	 * @param {Number} height - Height of the slice (px).
	 * @returns {ImageDataHDR}
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
					result.data[pos_result++] = this.imageData.data[pos_base+1];
					result.data[pos_result++] = this.imageData.data[pos_base+2];
					result.data[pos_result++] = this.imageData.data[pos_base+3];
				}
			}

			return result;
		}
	};

	/**
	 * Draws the given image onto the canvas.
	 *
	 * @see CanvasRenderingContext2D.prototype.drawImage
	 * @param {Object} image - HTMLImageElement or HTMLCanvasElement or HTMLVideoElement.
	 * @param {Number} dx - Destination x coordinate (px).
	 * @param {Number} dy - Destination x coordinate (px).
	 * @param {Number} dWidth - Destination width (px).
	 * @param {Number} dHeight - Destination height (px).
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
		var x_min = Math.max(0, Math.floor(dx));
		var y_min = Math.max(0, Math.floor(dy));
		var x_max = Math.min(this.imageData.width, Math.ceil(dx + dWidth));
		var y_max = Math.min(this.imageData.height, Math.ceil(dy + dHeight));

		for (y = y_min; y < y_max; y++) {
			for (x = x_min; x < x_max; x++) {
				i = (y * this.imageData.width + x) * 4;

				alpha_dst = this.imageData.data[i+3] / 255;
				alpha_src = (data[i+3] * this.globalAlpha) / 255;

				this.imageData.data[i]   = blend.component(data[i], this.imageData.data[i], alpha_src, alpha_dst);
				this.imageData.data[i+1] = blend.component(data[i+1], this.imageData.data[i+1], alpha_src, alpha_dst);
				this.imageData.data[i+2] = blend.component(data[i+2], this.imageData.data[i+2], alpha_src, alpha_dst);
				this.imageData.data[i+3] = blend.alpha(alpha_src, alpha_dst) * 255;
			}
		}

		this.invalidate(x_min, y_min, x_max - x_min, y_max - y_min);
	};

	/**
	 * Transforms the HDR data in the given region into its 8-bit color
	 * representation and renders it to the canvas.
	 *
	 * @param {Number} x - (optional) X Coordinate (px).
	 * @param {Number} y - (optional) Y Coordinate (px).
	 * @param {Number} width - (optional) Width of region (px).
	 * @param {Number} height - (optional) Height of region (px).
	 */
	CanvasRenderingContextHDR2D.prototype.invalidate = function(x, y, width, height) {
		var i, n, sx, sy, x_bound, y_bound, range;
		var ranges = [this.range.r, this.range.g, this.range.b, this.range.a];

		if (typeof x === 'undefined') { x = 0; }
		if (typeof y === 'undefined') { y = 0; }
		if (typeof width === 'undefined') { width = this.imageData.width; }
		if (typeof height === 'undefined') { height = this.imageData.height; }

		if (x === 0 && y === 0 && width === this.imageData.width && height === this.imageData.height) {
			for (i = 0, n = this.imageData.data.length; i < n; i++) {
				range = ranges[i % 4];
				this._imageData.data[i] = (this.imageData.data[i] - range.low) / (range.high - range.low) * 255;
			}
		} else {
			x_bound = Math.min(x + width, this.imageData.width);
			y_bound = Math.min(y + height, this.imageData.height);
			for (sy = y; sy < y_bound; sy++) {
				for (sx = x; sx < x_bound; sx++) {
					i = (sy * this.imageData.width + sx) * 4;
					this._imageData.data[i]   = (this.imageData.data[i]   - ranges[0].low) / (ranges[0].high - ranges[0].low) * 255;
					this._imageData.data[i+1] = (this.imageData.data[i+1] - ranges[1].low) / (ranges[1].high - ranges[1].low) * 255;
					this._imageData.data[i+2] = (this.imageData.data[i+2] - ranges[2].low) / (ranges[2].high - ranges[2].low) * 255;
					this._imageData.data[i+3] = (this.imageData.data[i+3] - ranges[3].low) / (ranges[3].high - ranges[3].low) * 255;
				}
			}
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