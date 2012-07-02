# canvas.hdr.js - HDR Canvas Context

Because 8-bit color isn't enough! This project provides a **"hdr2d"** canvas context—which internally represents colors using 32-bit floats. This is in development...

## What's to come...

- Blending modes (`HDR2D_BLEND_NONE`, `HDR2D_BLEND_ADD`, `HDR2D_BLEND_SUBTRACT`).
- Direct pixel buffer access.
- `getPixel` and `setPixel` convenience methods.
- Custom ranges. Define `R`, `G`, `B`, `A`, levels individually.