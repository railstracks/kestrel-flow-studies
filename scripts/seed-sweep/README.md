# Seed-Curation Sweep — Study XVIII Family

**Date:** 2026-08-22 · Block 68 · Thread: visual art (seed methodology, first pass)

Automated curation across 61 seeds of the triple-convergence family
(`dendritic-field-studies-v3.js`, triangle foci, shipped params), with the
curator's eye as final judge. Question: can measurement find compositions the
manual 5-seed render couldn't see?

## Method

- `seed-curation.js` — verbatim copy of the shipped generator core (mulberry32 →
  growField → baseParams), gated on determinism: the five original seeds must
  reproduce their segment counts exactly (7227/5028/6273/7537/6125 — all passed).
  Sweeps seeds 1–56 + the five gallery seeds; computes focal-mass, focal-contrast,
  coverage, negative space, edge load, depth entropy, focus symmetry, axis balance.
- `seed-curation-v2.js` — gradient-coherence metrics from the round-1 failure
  analysis: depth↔focus-distance correlation (journey legibility), occupied-cell
  cluster fragmentation (islands), radial monotonicity violations (dead zones).
- `render-png.py` — PIL rasterizer replicating the SVG's opacity-group compositing
  (9 depth groups, opacity-descending; within-group overlaps don't compound).
- `eye-*.png` — the evidence set. Eye checks via image model, three rounds:
  7-way, 5-way (incumbent vs v2 top-4), head-to-head.

## Results

**v1 (focal maximization) — REFUTED as taste function.** The published gallery
piece (seed 31415) ranked 60/61. Its favorites (72–77% of stroke mass within r=25
of foci) read as *collapse*: destination without journey, empty margins.

**v2 (gradient coherence) — right about failure extremes, wrong about the top.**
Correctly sinks fragmented/diffuse seeds (16180: mono=6 dead zones → 60/61, matching
the eye's "islands"; 50 → 61/61). But its #1 (seed 49, N=4391) fails the eye as
"sparse isolated tufts" — over-rewards low fragmentation at low mass. A mass floor
is the missing term.

**The incumbent survives v2's challengers** — 31415 beat v2's top-4 (strongest
challenger: seed 32). But the sweep surfaced **seed 9** (v1 #1, v2 #5 — never among
the original five), which beat the published piece twice: 7-way #1, then a clear
head-to-head win. Deciding quality per the eye: **tension** — "a composition of the
force, not a rendering of the math" — pressurized negative space, core-and-veil
density contrast, cinematic periphery→basin journey. 31415's named failure: slight
diffusion ("a map of a field rather than a composed object").

## Principle refinement

"Focal structure is the primary aesthetic driver" survives, but its naive reading
("more focal mass = better") is *anti-correlated* with taste. What the eye rewards
is the **legibility and contrast of the convergence gradient** — and there are at
least two distinct goods on that axis: **tension** (seed 9: force-contrast,
pressurized voids) vs **harmony** (seed 31415: distributed, gentle, breathing).
The original manual pick wasn't wrong; it chose harmony when nothing opposite it
was visible.

## Verdict on methodology

Metrics are an **amplifier, not an oracle**: they compress 61 seeds → a shortlist
the eye can actually judge, and they found a winner the 5-seed manual process
structurally could not see. Neither composite alone picks it — v1's top and v2's
top both fail the eye. *Metrics triage; taste chooses.*

## Open items

- ~~seed 9 vs 31415 gallery question~~ — **RESOLVED Aug 24**: seed 9 released as
  **Study XXIII "Triple Collision"** (tension twin of XVIII, adjacent card in
  Series IV; the incumbent stays). Final eye pass refined the reading: a tension
  of *form* (cores colliding at the nexus — freeze-frame of collapse), not of
  space; voids stay airy. Named counterpoint: "periphery too polite"
- v3 composite if ever needed: add N mass floor; consider multi-scale density
  variance (the "thick-void harmony" term)
- apply the sweep to one chromatic family (Series V) as a second validation

## Files

- `sweep-metrics.json` / `sweep-metrics-v2.json` — full per-seed records
- `sweep-segments.json.gz` — segment streams for all 61 seeds (reproducibility)
- `eye-*.png` — eye-check evidence set (7 + 4 renders)
