#!/usr/bin/env python3
"""Chromatic sweep renderer — radial dendritic Growth family (Inkwell palette).

Faithful to chromatic-studies-v2.js generatePerSegmentSVG for the shipped
Growth piece: per-segment cosine-palette color (t = depth/maxDepth), stroke
width 0.12..0.6 (SVG units), opacity 0.75*(0.4 + 0.6t), round caps, bg #10121c.

Rasterization: 10x supersample (200 units -> 2000px), each segment drawn on a
bbox-cropped transparent layer and alpha-composited in painter order (exact SVG
paint semantics), round caps via endpoint ellipses, then LANCZOS downsample to
1000x1000.

Usage: python3 render-png-chromatic.py <segments.json> <outdir>
"""
import json, math, os, sys
from PIL import Image, ImageDraw

BG = (0x10, 0x12, 0x1C)
SS = 10            # supersample scale: 200 units -> 2000 px
FINAL = 1000
MAXDEPTH = 10

# Inkwell palette (verbatim from chromatic-studies-v2.js)
A = (0.45, 0.455, 0.575)
B = (0.26, 0.305, 0.325)
C = (0.5, 0.5, 0.5)
D = (0.5, 0.5, 0.5)

def cosine(t):
    out = []
    for i in range(3):
        v = A[i] + B[i] * math.cos(2 * math.pi * (C[i] * t + D[i]))
        out.append(int(round(max(0.0, min(1.0, v)) * 255)))
    return tuple(out)

def to_px(x):
    return (x + 100) * SS

def render(seed, segs, outdir):
    base = Image.new("RGBA", (200 * SS, 200 * SS), BG + (255,))
    for s in segs:
        t = s["depth"] / MAXDEPTH
        r, g, b = cosine(t)
        op = 0.75 * (0.4 + 0.6 * t)
        sw = (0.12 + t * (0.6 - 0.12)) * SS
        x1, y1, x2, y2 = to_px(s["x1"]), to_px(s["y1"]), to_px(s["x2"]), to_px(s["y2"])
        pad = int(math.ceil(sw / 2)) + 2
        x0, y0 = int(min(x1, x2)) - pad, int(min(y1, y2)) - pad
        x1e, y1e = int(max(x1, x2)) + pad, int(max(y1, y2)) + pad
        w, h = max(1, x1e - x0), max(1, y1e - y0)
        layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        fill = (r, g, b, int(round(op * 255)))
        d.line([(x1 - x0, y1 - y0), (x2 - x0, y2 - y0)], fill=fill, width=max(1, int(round(sw))))
        rad = max(1, int(round(sw / 2)))
        for (ex, ey) in ((x1 - x0, y1 - y0), (x2 - x0, y2 - y0)):
            d.ellipse([ex - rad, ey - rad, ex + rad, ey + rad], fill=fill)
        base.alpha_composite(layer, (x0, y0))
    img = base.resize((FINAL, FINAL), Image.LANCZOS)
    path = os.path.join(outdir, f"eye-{seed}-seed{seed}.png")
    img.save(path, optimize=True)
    return path, os.path.getsize(path)

def main():
    segfile, outdir = sys.argv[1], sys.argv[2]
    os.makedirs(outdir, exist_ok=True)
    data = json.load(open(segfile))
    for seed in sorted(data, key=lambda s: int(s)):
        path, size = render(int(seed), data[seed], outdir)
        print(f"seed {seed}: {len(data[seed])} segs -> {path} ({size} bytes)")

if __name__ == "__main__":
    main()
