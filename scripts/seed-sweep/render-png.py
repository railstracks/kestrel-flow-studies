#!/usr/bin/env python3
"""Render seed-sweep segments to PNG, replicating the shipped SVG compositing:
groups keyed by (opacity rounded to 0.05, width rounded to 0.1), painted
opacity-descending onto cream #f5f0e8. Within-group overlaps do not compound
(single paint op per group); between-group compounding via alpha_composite.
Scale/coords identical to render() in dendritic-field-studies-v3.js."""
import json, sys
from PIL import Image, ImageDraw

SEGS = json.load(open('sweep-segments.json'))
SCALE = 1000 / 200
STROKE = (26, 26, 26)

def render(seed, out):
    segs = SEGS[str(seed)]
    base = Image.new('RGB', (1000, 1000), (245, 240, 232))
    # group exactly like the shipped script
    groups = {}
    for s in segs:
        k = (round(s['opacity'] * 20) / 20, round(s['width'] * 10) / 10)
        groups.setdefault(k, []).append(s)
    ordered = sorted(groups.items(), key=lambda kv: -kv[0][0])  # opacity desc
    for (op, w), members in ordered:
        layer = Image.new('RGBA', (1000, 1000), (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        px_w = max(1, round(w * SCALE * 0.4))
        fill = (*STROKE, int(round(op * 255)))
        for s in members:
            x1 = (s['x1'] + 100) * SCALE; y1 = (s['y1'] + 100) * SCALE
            x2 = (s['x2'] + 100) * SCALE; y2 = (s['y2'] + 100) * SCALE
            d.line([x1, y1, x2, y2], fill=fill, width=px_w)
        base = Image.alpha_composite(base.convert('RGBA'), layer).convert('RGB')
    base.save(out)
    print(f'{out}: {len(segs)} segments, {len(ordered)} groups')

if __name__ == '__main__':
    for seed in sys.argv[1:]:
        tag = 'gallery' if seed == '31415' else f'seed{seed}'
        render(int(seed), f'eye-{seed}-{tag}.png')
