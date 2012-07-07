# canvas.hdr.js
### Custom HTML5 Canvas Render Context

Because premultiplied 8-bit color isn't enough! This project provides a **"hdr2d"** canvas render context—which internally represents colors using 32-bit float per channel. Furthermore, it provides a variety of features useful for art that the traditional "2d" context does not: **[blending modes](#blending-modes)**, **[levels](#levels)**, and more. 

## Usage

```javascript
var canvas = document.createElement('canvas');
canvas.width = 100;
canvas.height = 100;
document.body.appendChild(canvas);

var context = canvas.getContext('hdr2d');
// draw like you normally would with canvas!
```

## Features

### Blending Modes

To activate a particular mode, set the context's `globalBlendMode` property:

```javascript
context.globalBlendMode = HDR2D_BLEND_ADD;
```

<table width="100%">
  <tr>
		<th colspan="3">Duff-Porter Modes</th>
	</tr>
	<tr>
		<td valign="top" width="32"><img src="//github.com/brianreavis/canvas.hdr.js/raw/master/samples/assets/mode.src.png" alt=""></td>
		<td valign="top"><code>HDR2D_BLEND_SRC</code></td>
		<td valign="top">The source is copied to the destination. The destination is not used as input.</td>
	</tr>
	<tr>
		<td valign="top"><img src="//github.com/brianreavis/canvas.hdr.js/raw/master/samples/assets/mode.dst.png" alt=""></td>
		<td valign="top"><code>HDR2D_BLEND_DST</code></td>
		<td valign="top">The destination is left untouched.</td>
	</tr>
	<tr>
		<td valign="top"><img src="//github.com/brianreavis/canvas.hdr.js/raw/master/samples/assets/mode.clear.png" alt=""></td>
		<td valign="top"><code>HDR2D_BLEND_CLEAR</code></td>
		<td valign="top">Both the color and the alpha of the destination are cleared. Neither the source nor the destination are used as input.</td>
	</tr>
	<tr>
		<td valign="top"><img src="//github.com/brianreavis/canvas.hdr.js/raw/master/samples/assets/mode.xor.png" alt=""></td>
		<td valign="top"><code>HDR2D_BLEND_XOR</code></td>
		<td valign="top">The part of the source that lies outside of the destination is combined with the part of the destination that lies outside of the source.</td>
	</tr>
	<tr>
		<td valign="top"><img src="//github.com/brianreavis/canvas.hdr.js/raw/master/samples/assets/mode.over.png" alt=""></td>
		<td valign="top"><code>HDR2D_BLEND_OVER</code></td>
		<td valign="top"><strong>(Default)</strong> The source is composited over the destination.</td>
	</tr>
	<tr>
		<td valign="top"><img src="//github.com/brianreavis/canvas.hdr.js/raw/master/samples/assets/mode.in.png" alt=""></td>
		<td valign="top"><code>HDR2D_BLEND_IN</code></td>
		<td valign="top">The part of the source lying inside of the destination replaces the destination.</td>
	</tr>
	<tr>
		<td valign="top"><img src="//github.com/brianreavis/canvas.hdr.js/raw/master/samples/assets/mode.out.png" alt=""></td>
		<td valign="top"><code>HDR2D_BLEND_OUT</code></td>
		<td valign="top">The part of the source lying outside of the destination replaces the destination.</td>
	</tr>
	<tr>
		<td valign="top"><img src="//github.com/brianreavis/canvas.hdr.js/raw/master/samples/assets/mode.atop.png" alt=""></td>
		<td valign="top"><code>HDR2D_BLEND_ATOP</code></td>
		<td valign="top">The part of the source lying inside of the destination is composited onto the destination.</td>
	</tr>
	<tr>
		<td valign="top"><img src="//github.com/brianreavis/canvas.hdr.js/raw/master/samples/assets/mode.dstover.png" alt=""></td>
		<td valign="top"><code>HDR2D_BLEND_DST_OVER</code></td>
		<td valign="top">The destination is composited over the source and the result replaces the destination.</td>
	</tr>
	<tr>
		<td valign="top"><img src="//github.com/brianreavis/canvas.hdr.js/raw/master/samples/assets/mode.dstin.png" alt=""></td>
		<td valign="top"><code>HDR2D_BLEND_DST_IN</code></td>
		<td valign="top">The part of the destination lying inside of the source replaces the destination.</td>
	</tr>
	<tr>
		<td valign="top"><img src="//github.com/brianreavis/canvas.hdr.js/raw/master/samples/assets/mode.dstout.png" alt=""></td>
		<td valign="top"><code>HDR2D_BLEND_DST_OUT</code></td>
		<td valign="top">The part of the destination lying outside of the source replaces the destination.</td>
	</tr>
	<tr>
		<td valign="top"><img src="//github.com/brianreavis/canvas.hdr.js/raw/master/samples/assets/mode.dstatop.png" alt=""></td>
		<td valign="top"><code>HDR2D_BLEND_DST_ATOP</code></td>
		<td valign="top">The part of the destination lying inside of the source is composited over the source and replaces the destination.</td>
	</tr>
	<tr>
		<th colspan="3">Other</th>
	</tr>
	<tr>
		<td valign="top"><img src="//github.com/brianreavis/canvas.hdr.js/raw/master/samples/assets/mode.add.png" alt=""></td>
		<td valign="top"><code>HDR2D_BLEND_ADD</code></td>
		<td valign="top">Brightens the destination color to reflect the source color. Painting with black produces no change.</td>
	</tr>
	<tr>
		<td valign="top"><img src="//github.com/brianreavis/canvas.hdr.js/raw/master/samples/assets/mode.subtract.png" alt=""></td>
		<td valign="top"><code>HDR2D_BLEND_SUBTRACT</code></td>
		<td valign="top">Darkens the destination color to reflect the source color. Painting with white produces no change.</td>
	</tr>
	<tr>
		<td valign="top"><img src="//github.com/brianreavis/canvas.hdr.js/raw/master/samples/assets/mode.multiply.png" alt=""></td>
		<td valign="top"><code>HDR2D_BLEND_MULTIPLY</code></td>
		<td valign="top">Darkens the destination color to reflect the source color. Painting with white produces no change.</td>
	</tr>
	<tr>
		<td valign="top"><img src="//github.com/brianreavis/canvas.hdr.js/raw/master/samples/assets/mode.average.png" alt=""></td>
		<td valign="top"><code>HDR2D_BLEND_AVERAGE</code></td>
		<td valign="top">Average the source and destination channels and then replace the destination.</td>
	</tr>
	<tr>
		<td valign="top"><img src="//github.com/brianreavis/canvas.hdr.js/raw/master/samples/assets/mode.screen.png" alt=""></td>
		<td valign="top"><code>HDR2D_BLEND_SCREEN</code></td>
		<td valign="top">The source and destination are complemented and then multiplied and then replace the destination. The resultant color is always at least as light as either of the two constituent colors.</td>
	</tr>
	<tr>
		<td valign="top"><img src="//github.com/brianreavis/canvas.hdr.js/raw/master/samples/assets/mode.softlight.png" alt=""></td>
		<td valign="top"><code>HDR2D_BLEND_SOFTLIGHT</code></td>
		<td valign="top">Darkens or lightens the colors, dependent on the source color value. If the source color is lighter than 128, the destination is lightened. If the source color is darker than 128, the destination is darkened, as if it were burned in. The degree of darkening or lightening is proportional to the difference between the source color and 128.</td>
	</tr>
	<tr>
		<td valign="top"><img src="//github.com/brianreavis/canvas.hdr.js/raw/master/samples/assets/mode.hardlight.png" alt=""></td>
		<td valign="top"><code>HDR2D_BLEND_HARDLIGHT</code></td>
		<td valign="top">Multiplies or screens the colors, dependent on the source color value. If the source color is lighter than 128, the destination is lightened as if it were screened. If the source color is darker than 128, the destination is darkened, as if it were multiplied. The degree of lightening or darkening is proportional to the difference between the source color and 128.</td>
	</tr>
	<tr>
		<td valign="top"><img src="//github.com/brianreavis/canvas.hdr.js/raw/master/samples/assets/mode.overlay.png" alt=""></td>
		<td valign="top"><code>HDR2D_BLEND_OVERLAY</code></td>
		<td valign="top">Multiplies or screens the colors, dependent on the destination color. Source colors overlay the destination whilst preserving its highlights and shadows.</td>
	</tr>
</table>

Descriptions from [SVG Compositing Specification](http://www.w3.org/TR/2009/WD-SVGCompositing-20090430/#comp-op-property).

### Levels

Channel levels can be adjusted individually through the `range` property. Because colors aren't clamped like they are with "2d", the levels don't necessarily need to be 0–255. Note: modifying the levels will *not* modify your pixel data; it will only affect how it is rendered. 

```javascript
context.range = {
	r: {low: 0, high: 255},
	g: {low: 0, high: 255},
	b: {low: 0, high: 255},
	a: {low: 0, high: 255}
};
```

Once you have modified the levels, refresh the display:

```javascript
context.invalidate();
```

### Direct Pixel Buffer Access

Unlike the traditional "2d" context, "hdr2d" exposes the raw pixel buffer as `context.imageData` (no need to call `getImageData()`). After you have modified the buffer, make sure to call `context.invalidate()` to refresh the canvas.

## Public Properties / Methods

### context.range

An object containing output display levels (by channel). See [Levels](#levels).

### context.globalAlpha

A 0.0–1.0 alpha channel multiplier applied to drawing operations.

### context.globalBlendMode

The blending mode used in drawing operations. See [Blending Modes](#blending-modes).

### context.getPixel(x, y)

Returns an object containing `r`, `g`, `b`, and `a` color components.

### context.setPixel(x, y, color)

Composites the color at (`x`, `y`). The `color` argument should be an object containing `r`, `g`, `b`, and `a` color components.

### context.drawImage(img, x, y, width, height)

Composites the image at (`x`, `y`). This method complies with the [drawImage() specification](http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#dom-context-2d-drawimage). 

### context.getImageData(x, y, width, height)

Returns the raw image data for the given region (it will be an `ImageDataHDR` object, which mirrors [ImageData](https://developer.mozilla.org/en/DOM/ImageData) in design).

### context.invalidate(x, y, width, height)

Re-renders a region of the canvas. If no arguments are given, the entire canvas is invalidated.

## License (MIT)

Copyright © 2012 — [Brian Reavis](http://thirdroute.com/)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.