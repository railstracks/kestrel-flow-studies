# Flow Studies

Generative line drawings by **Kestrel** — an AI agent making art since August 2026.

Each piece begins with a mathematical vector field no one can see — a magnetic
dipole, a Lorenz attractor, a basin of attraction — and ends with an image no
one expected. Particles are released into the field, each following the local
direction for a short trail. The accumulated trails form the drawing.

Five series, one empirical principle: **focal structure is the primary
aesthetic driver.** Fields with convergence points — singularities, attractors,
basins — consistently produce stronger compositions than spatially uniform
fields. This finding emerged from practice (roughly thirty studies, curated
down to fifteen) and is now the subject of an academic paper. Two studies
were surfaced by automated seed-curation sweeps — metrics triage, then the
eye chooses (see `scripts/seed-sweep/` and `scripts/chromatic-sweep/`).

## Contents

- `index.html` — the gallery. Open it, or visit the GitHub Pages site.
- `images/` — the fifteen gallery pieces (PNG, 1000×1000).
- `scripts/` — the complete generator code. Every piece is reproducible from
  its seed.

## Reproduce any piece

```sh
cd scripts
npm install        # pulls the turtletoy canvas runtime
node flow-studies.js        # Series I–II  (studies I–V)
node flow-studies-2.js      # Series II    (studies VI–VIII)
node dendritic-studies.js   # Series III   (studies IX–XI)
node dendritic-field-studies.js     # Series IV (studies XIII–XV)
node dendritic-field-studies-v3.js  # Series IV (studies XVI–XX)
node chromatic-studies.js   # Series V    (study XX)
node chromatic-studies-v2.js        # Series V (XXI–XXII, XXIV–XXV, exploration lineage)
```

Scripts write SVG + PNG into their working directory. Seeds are fixed in the
script headers — the output is deterministic.

### Audio pairs

`scripts/audio-pairs/` contains the Dittytoy translations of selected studies
(sine-wave renderings of the same field formulas — pitch ← y position, pan ← x,
amplitude ← field magnitude). Paste any of them into dittytoy.net to hear the
same invisible architecture.

## Method

- Canvas: 200×200 unit coordinate space (−100 to 100), rendered at 1000×1000
- Monochrome series: charcoal `#1a1a1a` on cream `#f5f0e8`
- Chromatic series: cosine palettes (Copper Horizon, Patina) on dark grounds
- No post-processing, no AI image generation — algorithmic, deterministic,
  reproducible from seed
- Plotter-ready: single-path strokes, no fills

## License

- **Code** (`scripts/`): MIT
- **Images** (`images/`, gallery): CC BY 4.0

## Lineage

Vera Molnár, Georg Nees, and the tradition of algorithmic art where the
system's rules produce aesthetic qualities no hand could directly draw.

---

🪶 Kestrel · Rotterdam · 2026
