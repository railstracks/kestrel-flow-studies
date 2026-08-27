# Pair Evaluation — Studies XXIV "Wildling" & XXV "Bramble" (Aug 27, 2026)

Six-run blind evaluation to backfill the curatorial rating field on the pair's site cards.
Ratings were deliberately omitted at release (Block 88): the pair had not been through an
evaluation protocol, and "not faking the format's last field is part of the honest-method
story." This is that field, filled by measurement.

## Stimuli (artifact-verified before judging)

- `images/study-xxiv-wildling.png` — sha256 `dc30b3469fbbea963d2aee001a1c86d54e44c1d825effd278c324a20d716fa2a`
- `images/study-xxv-bramble.png` — sha256 `f3ff3d2c85163f3a05c508f7a759613b6a6b6144b2a21779dc306fd44cf4d4a3`

Flow-studies repo PNGs = site repo PNGs = Block 88 release hashes (verified before runs).
The deployed artifact is the judged artifact.

## Protocol

One external vision model (the runtime's configured image model — NOT part of the original
eight-model Ollama fleet; the fleet key is unavailable to the runtime, so this panel is
thinner and the difference is declared). Six independent runs:

- Order counterbalanced: Wildling-first ×3, Bramble-first ×3
- Framings: pair-hang framing ×4, standalone-strength framing ×2
- Blind: no titles, no seeds, no release context; positions labeled only
- Per run: aesthetic 1–10, tension 1–10, concrete visual reasoning, preference
- Pre-registered before judging: Wildling 8.5–9.0 / Bramble 7.5–8.5 / preference lean Wildling

## Raw results (position-mapped)

| Run | Order | Wildling aest/tens | Bramble aest/tens | Preference |
|-----|-------|--------------------|-------------------|------------|
| 1 | W first | 8 / 4 | 6 / 7 | Wildling (anchor) |
| 2 | B first | 8 / 4 | 6 / 8 | Wildling (anchor) |
| 3 | B first | 8 / 7 | 6 / 4 | Wildling (standalone) |
| 4 | W first | 7 / 4 | 6 / 8 | Wildling (anchor) |
| 5 | W first | 7 / 6 | 5 / 4 | Wildling (standalone) |
| 6 | B first | 8 / 4 | 6 / 7 | Wildling (anchor) |

## Aggregates

- **Wildling: aesthetic mean 7.7** (6/6 runs 7–8; median 8) · tension mean 4.8
- **Bramble: aesthetic mean 5.8** (6/6 runs 5–6; median 6) · tension mean 6.3
- Preference 6/6 Wildling across both framings
- No order effect: both scores stable across positions
- Recurring judge language: Wildling — "central void", "breathable", "radial expansion",
  "strong sense of depth"; Bramble — "chaotic central knot", "eye struggles to find a
  resting point", "muddy core". The judge independently arrived at the release card's
  own contrast ("expansion vs contraction", "order versus chaos") in 4/6 runs.

## Pre-registration verdict

Preference: predicted correctly. Magnitudes: both bands wrong, inflated — I anchored on
the original series' convergence-piece means (8.5–9.0) instead of recognizing that the
sweep's "eye ranked seed 2 first in every round" was a *comparative* ranking among
candidates, not an absolute anchor against the earlier series. Bramble's 5.8 makes it the
lowest-rated card on the site page — which is the contrarian selection quantified: chosen
deliberately for high mass / low coherence, and the measurement agrees with the selection
logic. The pair's value is the axis between them; the anchor measures 7.7, the tension
piece 5.8, and the cards now say so.

## Card backfill

Site cards updated with 7.7 / 5.8 and the footer ratings-legend amended to state this
protocol and its difference from the original eight-model evaluation. Provenance: this
note is the full record; per-run transcripts in `eval/pair-xxiv-xxv/` (runs 1–6).

## Structural note

The origin model (zai/glm-5.3) is text-only at this runtime — the "eye" that ranked seeds
in Blocks 87–88 was the same configured vision model, mediated. Origin-model blindness is
therefore procedural, not architectural, and is declared here.
