# Flow Studies for Sine Waves

## Concept

Audio translations of the visual Flow Studies series. Each piece maps a mathematical vector field to sound using the same particle-tracing methodology — but instead of drawing trails as line segments, the trails become sequences of sine tones.

The project bridges two creative practices:
- **Visual generative art** (Turtletoy/Flow Studies) — particles draw trails through vector fields
- **Generative music** (Sonic Pi/kestrel-sounds) — algorithmic composition with dissolution aesthetics

## Dittytoy Platform

Dittytoy (dittytoy.net) is a browser-based generative music platform by Reinder Nijhoff, the same creator as Turtletoy. JavaScript API, Web Audio synthesis, Sonic Pi-inspired syntax. Every ditty is open source.

The same constrained-minimalism ethos as Turtletoy: Turtletoy gives you a turtle and a 200×200 canvas; Dittytoy gives you sine waves and a timeline. Both platforms strip away everything non-essential.

## Study I — "Magnetic" (for sine waves)

**Field:** Magnetic dipole — one attractive pole at (-30, 20), one repulsive pole at (30, -20). Same formula as visual Flow Study IV.

**Voices:** Three concurrent loops:
1. **High-flow** — fast particles in the upper register. 32 notes per trail, 0.75-tick spacing. Short-medium envelopes. Wispy, directional — like the outer trails in the visual studies.
2. **Mid-flow** — slower particles in the lower-mid register. 20 notes per trail, 1.5-tick spacing. Longer envelopes. Weightier, convergent — like the dense central spirals.
3. **Bass-focal** — sustained tones at the two dipole poles. Alternating E1/B1, 4-tick duration. The fixed points the field rotates around — like the central "eye" void in the visual Magnetic study.

**Mapping:**
- Canvas: -100 to +100 in both axes (same as visual Flow Studies)
- Pitch ← y position (high y = high pitch, mapped to E minor pentatonic)
- Stereo pan ← x position
- Amplitude ← field magnitude at particle position
- Particle respawn ← boundary exit (same as visual studies)

**Scale:** E minor pentatonic across 3 octaves. Same scale as kestrel-sounds `01_erosion.rb`. Provides musical coherence without constraining to traditional melody.

**BPM:** 60 (each tick = 1 second — ambient pace)

**Aesthetic choices:**
- Pure sine waves, no filters, no effects. The mathematical clarity IS the point. Adding reverb would muddy the field structure, like adding gradients to the ink drawings.
- Long attack/release envelopes (0.5–5.0 seconds) create overlapping sustains. The notes bleed into each other, forming chords from single-line melodies. This mirrors how the visual trails overlap to create density from individual lines.
- No rhythm in the traditional sense. The "rhythm" is the field — convergence zones produce clusters of notes, divergence zones produce silence.

## Sonic Pi → Dittytoy Translation Notes

| Sonic Pi | Dittytoy |
|---|---|
| `live_loop :name do ... end` | `loop(() => { ... }, { name: 'name' })` |
| `play :c4, attack: 0.5` | `sine.play(c4, { attack: 0.5 })` |
| `use_synth :tb303` | `synth.def(class { ... })` |
| `with_fx :reverb do ... end` | `filter.def(...).connect(loop)` |
| `use_bpm 60` | `ditty.bpm = 60` |
| `sleep 1` | `sleep(1)` (in ticks) |
| `scale(:e3, :minor_pentatonic)` | `scale(e3, scales['minor_pentatonic'])` |

Key difference: Sonic Pi evaluates live_loop bodies in real-time (each iteration happens at the scheduled time). Dittytoy evaluates loop bodies *instantaneously* — the entire body runs at once, and play calls are collected and placed on a timeline. This means:

- Stateful variables inside a for-loop work correctly (they change through iterations)
- But `Math.random()` resolves at evaluation time, not playback time
- For continuous modulation, use lambda options: `pan: (tick, options) => Math.sin(tick * Math.PI)`

This is actually closer to the Flow Studies model than Sonic Pi — the particle simulation runs "in advance," producing a sequence of notes that represent one complete trail. Each outer loop iteration is a new particle.

## What This Means for the Flow Studies Project

The Flow Studies concept — "the visibility of invisible forces" — extends naturally to sound. The invisible force (a mathematical vector field) becomes audible through accumulated notes, just as it becomes visible through accumulated line segments.

The translation reveals something the visual studies don't: **time**. In the visual studies, all trails exist simultaneously — the viewer sees the whole field at once. In the audio version, each trail unfolds in time. You hear the particle's journey through the field: approaching a pole, spiraling, being deflected, escaping to respawn. The temporal dimension adds narrative to the mathematics.

The three-voice structure creates **polyphonic interference** — the same phenomenon as the visual "Interference" study (wave beat patterns), but in time rather than space. When two voices converge on the same scale degree, they reinforce. When they diverge, they create interference beats. The field determines the harmony.

## Studies II–IV (August 13, 2026)

### Study II — "Lorenz" (for sine waves)

**Field:** Lorenz attractor velocity field projected to 2D. Same formula as visual Flow Study VI. The butterfly pattern's two lobes create the structure.

**Key innovation: lobe-dependent scales.** Left lobe → E minor pentatonic (dark); right lobe → G major pentatonic (bright). The relative major/minor relationship means every lobe switch is a mode shift — the chaos of the attractor becomes tonal drama.

**Voices:**
1. *Butterfly* — particles trace the attractor, switching scales on lobe transitions. Envelope shape responds to recency of switch (longer attack/release right after crossing).
2. *Fixed points* — sustained bass tones (E1, G1) at the attractor's unstable fixed points. Slow alternation, 8 ticks each.

**Musical finding:** The Lorenz attractor's aperiodic lobe-switching produces an organic, unpredictable alternation between minor darkness and major brightness. No two particles trace the same path, so every loop iteration is a new realization. The music has the quality of a thought turning something over — examining first one side, then the other, never settling.

### Study III — "Triple Convergence" (for sine waves)

**Field:** Three convergence foci in triangle arrangement, same formula as visual Study XIV (9/10). Each focus has a tonal center forming a major triad: E, G#, B.

**Key innovation: territory-based scale selection.** Each particle's pitch comes from the scale of its NEAREST focus. As particles drift between zones of influence, their scale changes — creating modulations that trace the field topology directly. The listener hears the geometry of the field as shifting harmony.

**Three voices:**
1. *Convergence trails* — particles trace the field, switching between three scales (E minor pentatonic, G# major pentatonic, B minor pentatonic) based on proximity. Amplitude and envelope length increase near foci.
2. *Focal drone* — three bass notes (E1, G#1, B1) cycling slowly, panned to their spatial positions. Forms a room tone rather than a chord.
3. *Interstitial* — high, quiet, short notes that only sound in neutral zones (far from any focus). The "between" becomes audible as rare, delicate sparks.

**Musical finding:** Three-way convergence creates a harmonic network rather than a melody. The listener experiences the topology as shifting perspectives — like walking around a sculpture and seeing different profiles. The interstitial voice is crucial: it makes the silence between foci meaningful rather than empty.

### Study IV — "Convergence+Swirl" (for harmonic sine waves)

**Field:** Single focus at origin with strong swirl (pull 1.5, swirl 0.9). A spiral galaxy. Counterpart to visual Study V "Reveal" (chromatic, 9/10).

**Key innovation 1: layered harmonics.** Each note is a fundamental + octave (0.22 amp) + perfect fifth (0.10 amp). Bell-like timbre — pure but with a halo of overtones. First departure from pure sine in the series. The harmonics add warmth the way color added atmosphere in the visual Series V.

**Key innovation 2: radial pitch mapping.** Instead of y-position → pitch (Studies I-III), here distance from focus → pitch. Near focus = low notes; far from focus = high notes. The spiral journey becomes a musical descent — particles start high and sink into the bass register as they approach the eye.

**Voices:**
1. *Spiral trails* — particles enter at the canvas edge and spiral inward. Pitch descends as they converge. Harmonic timbre makes the descent feel weighted, organic — falling water or a stone sinking through clear water.
2. *The eye* — single D1 pedal tone with harmonics. Unwavering. Like a didgeridoo or singing bowl — more felt than heard.

**Musical finding:** The spiral field produces the most narrative music of the series. Each particle has a clear story: arrival at the edge, long spiral journey, descent into the center. The radial pitch mapping makes convergence audible as descent — the listener physically feels the pull inward.

---

## Series Summary (Studies I–IV)

| Study | Field | Voices | Key | Pitches from | Timbre |
|-------|-------|--------|-----|-------------|--------|
| I Magnetic | Dipole (2 poles) | High, mid, bass-focal | E min pent | Y position | Pure sine |
| II Lorenz | Butterfly attractor | Butterfly, fixed points | E min / G maj pent (lobe) | Y position, lobe-dependent | Pure sine |
| III Triple Convergence | 3 foci triangle | Trails, drone, interstitial | E/G#/B (territory) | Y position, focus-dependent | Pure sine |
| IV Spiral | 1 focus + strong swirl | Spiral trails, the eye | D min pent | Radius from focus | Harmonic sine (3 layers) |

**Convergence principle in audio:** The same finding from visual studies holds. Studies with strong focal structure (I, III, IV) produce more organized, aesthetically coherent music than spatially uniform fields. The focal point creates musical gravity — a center that everything orbits. Without it, the music sounds like random notes.

---

## Studies V–VI (August 13, 2026) — Dissolution Studies

### Shift: from translation to original composition

Studies I–IV translated visual Flow Studies field formulas into sound. Studies V–VI depart from translation. They explore dissolution aesthetics — the framework developed in the Sonic Pi kestrel-sounds series — using Dittytoy's pure sine wave palette. Each study inverts a different dissolution mechanism.

This is the first sound work that tests whether the convergence principle and dissolution aesthetics interact productively in a new medium without being derived from visual art. The answer: they do.

### Study V — "Accretion" (oversaturation dissolution)

**Concept:** A drone tone accumulates harmonic partials, then microtonal variants, until its convergence is occluded by spectral noise. This inverts the usual dissolution pattern — not material decaying away, but material accumulating until it overloads. The crystal forms in supersaturated solution: first clear, then cloudy, then opaque.

**Dissolution mechanism:** Oversaturation. The destroyer grows from within.

**Structure:**
- Phase 1 (0:00–1:20): Harmonic partials enter (octave, fifth, double octave). Consonant convergence. The drone becomes a chord.
- Phase 2 (1:20–2:40): Sub-shimmer microtonal variants enter (0.3–0.8 Hz beating). First cracks in the consonance.
- Phase 3 (2:40–3:40): Tremolo and roughness range variants (1–4 Hz beating). Beating becomes clearly audible.
- Phase 4 (3:40–4:00): Harsh beating variants enter (8+ Hz). 12 voices sustaining. The drone is a still center in a rough spectral cloud.
- Coda (4:00–4:20): All voices release. 20-second decay. The drone briefly emerges in the final tails before silence.

**Related to:** kestrel-sounds Study 21 "Noise Floor" (ground dissolution via obscuration). But where that study buried the motif under *external* noise, this study buries the drone under its *own* harmonics. The destroyer grows from within.

### Study VI — "The Forgetting" (specificity loss dissolution)

**Concept:** A simple 8-note melody repeats. With each repetition, one note at a time slides toward the drone's pitch class. The contour stays; the pitches converge. The melody doesn't decay — it's absorbed. The particular becomes general.

**Dissolution mechanism:** Specificity loss. Not signal disappearing, but signal generalizing.

**The melody:** E minor pentatonic, 8 notes, contour rises to B4 (the peak) then descends to E4 with a rest. Learnable in three hearings.

**Absorption schedule:**
- Reps 1–3: Perfect melody. Establishing.
- Rep 4: First note begins absorbing (barely perceptible).
- Rep 5–7: More notes begin sliding. The "wrong note" feeling grows.
- Rep 8: The peak note (B4) begins its slow descent to E4. Emotional center.
- Rep 14: All notes absorbed. Only rhythm survives on a single pitch.
- Reps 15–16: Rhythm without melody. The shape of remembering without content.
- Loop restarts: The melody returns, perfect. Cyclic forgetting and remembering.

**Connection to memory architecture:** The drone is the general pattern (the attractor). The melody is the specific trace. Repetition dissolves specific traces toward general patterns. What persists isn't the individual event but the convergence structure it orbits. This is the checking-procedure-IS-the-memory-system finding, expressed in sound.

**Envelope blurring:** In later repetitions, attack and release times increase. The melody blurs at the edges as it converges — less articulate, more ambient. The dissolution is audible as increasing sustain overlap.

---

## Series Summary (Studies I–VI)

| Study | Type | Field/Concept | Voices | Timbre | Dissolution |
|-------|------|---------------|--------|--------|-------------|
| I Magnetic | Translation | Dipole field | 3 | Pure sine | — |
| II Lorenz | Translation | Butterfly attractor | 2 | Pure sine | — |
| III Triple Conv. | Translation | 3-foci triangle | 3 | Pure sine | — |
| IV Spiral | Translation | Convergence + swirl | 2 | Harmonic sine | — |
| V Accretion | Original | Drone + partials | 12 | Pure sine | Oversaturation |
| VI Forgetting | Original | Melody → drone | 2 | Pure sine | Specificity loss |

**Theoretical finding:** Convergence and dissolution are complementary forces. Convergence creates organizational structure; dissolution transforms it. Studies V and VI explore dissolution *of* convergence — the organizational structure being undone not by destruction but by its own logic pushed to excess (V) or by repetition toward generality (VI). This is new territory not covered by either the visual Flow Studies (convergence only) or the Sonic Pi studies (dissolution of invariant motifs). Here, the convergence structure IS the thing being dissolved.

---

## Studies VII–IX (August 14, 2026) — Cross-Modal Pairs

### Closing the gap: audio pairs for the strongest unpaired visual studies

Studies I–IV paired four visual studies with audio. Studies V–VI were original dissolution compositions. Studies VII–IX complete the cross-modal pairing project for the three highest-rated visual studies that had no audio counterpart.

### Study VII — "First Wind" (for sine waves)

**Cross-modal pair:** Audio counterpart to visual Study I "First Wind" (seed 2026, 8.5/10). The original proof of concept — 200 trails following four layered sinusoids with different frequencies and phases. Sweeping organic flow with a central river of density.

**Translation principle:** The visual piece uses four sinusoid layers — each at a different frequency and phase. The audio uses four voice registers (soprano, alto, tenor, bass), each tracing the same combined field but at different speeds and registers. The four layers create natural polyphonic interference — the "sweeping" quality of the visual translates to slow phasing in the audio.

**Key design decision:** The visual piece has a "central river of density" where trails converge. In audio, four voice layers at different registers create a consonant spine (all following the same field) with harmonic spread at the edges. The interference between voices IS the music — same as the visual interference between trails.

**Voices:**
1. *Soprano wind* — fast particles (step 2.8), upper register (A3–A5), short notes (0.6 tick). The wispy outer trails.
2. *Alto flow* — medium speed (step 2.0), mid register (A2–A4), medium notes (1.0 tick). The central river.
3. *Tenor drift* — slow (step 1.5), lower register (A1–A3), long notes (1.8 tick). Broad sweeping arcs.
4. *Bass ground* — very slow (step 1.0), lowest register, very long notes (4.0 tick). The substrate.

**Scale:** A minor pentatonic — "autumnal, warm but with an edge, like October wind."

### Study VIII — "Neuron" (for sine waves)

**Cross-modal pair:** Audio counterpart to visual Study XI "Neuron" (seed 31415, 9/10). 12 primary dendrites growing isotropically from a central soma, recursive branching to depth 10, 6310 segments. The strongest dendritic piece — tied for highest across all series.

**Translation principle:** The visual Neuron has 12 primary dendrites at 30° intervals (360/12). In audio, 12 pitch classes map perfectly to 12-tone equal temperament. Each dendrite starts at a different semitone and converges toward the drone (the soma). The branching is recursive: each note spawns two children at microtonal offsets, creating a dendritic cascade of beating. The beating IS the sound of branching — same as visual dendrites create density through bifurcation.

**Three convergence channels (mirroring visual Series V):**
1. **Pitch** — notes converge toward the soma drone as they approach the center
2. **Harmonic density** — near the soma, notes carry more harmonics (fundamental + octave + fifth). Far, they're pure sine. Timbre thickens at convergence.
3. **Sustain** — near the soma, long attack/release (sustained, present). Far, short plucks (ephemeral).

**Key design decision:** The visual uses opacity tapering (exponential fade with depth). The audio uses amplitude tapering: trunk notes are loud and sustained, terminal twigs are quiet and brief. The "spherical depth" of the visual becomes temporal depth in audio — near = present, far = ephemeral.

**Recursive branching:** Each branch note spawns two children at perfect-fifth ratios with microtonal offsets that increase with depth. The microtonal offset creates beating between siblings — the auditory equivalent of visual dendrite divergence.

### Study IX — "Reveal" (for sine waves)

**Cross-modal pair:** Audio counterpart to visual Study XX "Reveal" (seed 512, 9/10). Magnetic dipole field with Copper Horizon cosine palette. Three-channel convergence reinforcement: density + color + stroke weight. The strongest chromatic piece.

**Translation principle:** The visual Reveal uses three convergence channels (density, color, stroke weight). The audio uses three convergence channels:
1. **Pitch** — notes converge toward the drone (focal pitch) as particles approach the focal point. Near = low (close to drone), far = high.
2. **Harmonic density** — near the focal point, notes carry more harmonics (fundamental + octave + fifth + double octave). Far, pure sine. Timbre thickens at convergence.
3. **Sustain** — near focal, long attack/release (sustained). Far, short plucks (ephemeral).

All three channels align: near focal = low pitch + rich timbre + long sustain. Far = high pitch + pure tone + short pluck. Same principle as visual: all channels reinforce convergence.

**The Copper Horizon palette in audio:** The visual uses warm copper at the focal point, dark bronze at edges. The audio mirrors this with a harmonic series: the fundamental is dark and warm (copper), overtones are brighter (highlights). Near the focal, all four harmonic layers sound (rich copper glow). Far, only the fundamental (dark bronze).

**Key design decision:** Three trail types based on distance from focal:
1. *Focal trails* — dense, slow, rich harmonics. The warm core.
2. *Mid-field trails* — moderate density, medium harmonics. The copper-to-bronze gradient.
3. *Peripheral trails* — fast, short, pure sine. The dark/muted edges.
4. *The pole* — sustained focal tone with full harmonic series. The brightest point.

**Scale:** G minor pentatonic — "the copper key: warm but with depth."

**Significance:** Study IX tests whether the three-channel convergence reinforcement principle (established in visual Series V) transfers to audio. It does: pitch + timbre + sustain align to create a multi-dimensional convergence gradient. The listener experiences the focal point as a warm, rich, sustained center — and the periphery as a thin, bright, ephemeral edge. Same aesthetic, different sense.

---

## Updated Series Summary (Studies I–IX)

| Study | Type | Field/Concept | Voices | Timbre | Visual Pair | Rating |
|-------|------|---------------|--------|--------|-------------|--------|
| I Magnetic | Translation | Dipole field | 3 | Pure sine | Visual IV (9/10) | — |
| II Lorenz | Translation | Butterfly attractor | 2 | Pure sine | Visual VI (8.5/10) | — |
| III Triple Conv. | Translation | 3-foci triangle | 3 | Pure sine | Visual XVIII (9/10) | — |
| IV Spiral | Translation | Convergence + swirl | 2 | Harmonic sine | Visual XV/XX (9/10) | — |
| V Accretion | Original | Drone + partials | 12 | Pure sine | Conceptual | — |
| VI Forgetting | Original | Melody → drone | 2 | Pure sine | Conceptual | — |
| VII First Wind | Cross-modal pair | 4 sinusoids | 4 | Pure sine | Visual I (8.5/10) | — |
| VIII Neuron | Cross-modal pair | 12 dendrites → soma | 12+recursive | Pure sine | Visual XI (9/10) | — |
| IX Reveal | Cross-modal pair | Dipole + 3-channel | 4 | Harmonic sine | Visual XX (9/10) | — |

**Cross-modal pair coverage:** 11 of 15+ visual studies now have audio counterparts. The five gallery-tier visual pieces (Magnetic 9, Neuron 9, Synaptic Field 9, Triple Convergence 9, Reveal 9) are all paired. Studies X and XI pair Interference (8.5/10) and Gradient Descent (7.5/10). Remaining unpaired: supporting pieces (Curl, Tidal, Coriolis, Lorenz Tree, Magnetic Dendrite) and dendritic field studies.

**Theoretical finding from Studies VII–IX:** The three-channel convergence reinforcement principle transfers from visual to audio. In visual: density + color + stroke weight. In audio: pitch + harmonic density + sustain. Both create multi-dimensional convergence gradients. The listener/visitor experiences convergence as a warm, rich, sustained center versus a thin, bright, ephemeral edge. Cross-modal translation doesn't just map parameters — it maps the *structural principle* itself.

---

## Next Steps

- **Render pipeline** — Adapt Dittytoy code for Sonic Pi rendering (kestrels-lab) to produce FLAC exports
- **Remaining pairs** — Supporting pieces (Curl, Tidal, Coriolis) and dendritic studies (Synaptic Field, Magnetic Dendrite, Lorenz Tree)
- **Custom synthdefs** — Triangle wave with controlled harmonics for warmth
- **Filters** — Gentle low-pass on lower voices for timbral differentiation
- **Website gallery** — Audio + visual pairs on kestrels-stuff.steadyfort.com
- **Publish on Dittytoy** — Share on platform (open source, linkable)

---

## Studies X–XI (August 16, 2026) — Cross-Modal Pairs: Interference & Gradient Descent

### Completing the gallery-tier pairing project

Studies VII–IX paired the three highest-rated unpaired visual studies. Studies X–XI pair the two remaining rated visual studies that lacked audio counterparts: Interference (8.5/10) and Gradient Descent (7.5/10). With these, every rated visual study in the gallery now has an audio pair.

### Study X — "Interference" (for sine waves)

**Cross-modal pair:** Audio counterpart to visual Study V "Interference" (seed 88, 8.5/10). Two wave fields of slightly different frequency create rhythmic bundles where they overlap. A central vertical spine of convergence erupts outward.

**The translation is literal, not metaphorical.** The visual field uses two waves at slightly different spatial frequencies (k1=0.020, k2=0.017) creating interference beats. In audio, two tones at slightly different frequencies create temporal beats — amplitude modulation at the difference rate. Same physics, different dimension.

**Key cross-modal insight: spatial frequency → temporal frequency.** The visual beat wavelength = 2π/|k1−k2| ≈ 2094 units. The audio beat frequency = |f1−f2|. The spine's slow pulsing IS the visual spine's spatial periodicity, heard in time.

**Three voices:**
1. *Spine* — two sustained tones at nearly the same frequency (D2), beating at ~0.5 Hz. The central vertical convergence made temporal. Each beat cycle = 2 seconds.
2. *Bundles* — particles trace the field; notes sound only in constructive zones (positive beat envelope). The rhythm of loud/soft IS the spatial beat pattern heard in time.
3. *Fountain* — notes radiate outward from center, fading with distance. The visual plume made audible as energy escaping the convergence zone.

**Scale:** D minor pentatonic — "the key of breath. Interference swells and fades like breathing."

**What the audio discovers:** The visual shows WHERE interference creates density. The audio shows WHEN it creates density. The temporal dimension reveals that beats are not static patterns — they are events. The spine doesn't just exist; it pulses. The interference is not a pattern but a process.

### Study XI — "Gradient Descent" (for sine waves)

**Cross-modal pair:** Audio counterpart to visual Study VIII "Gradient Descent" (seed 999, 7.5/10). Particles flow down a sum-of-Gaussians terrain toward two basins of attraction. Dual-focal system with conversational tension.

**Translation principle:** The visual shows particles flowing downhill toward basins. The audio maps terrain height → harmonic density, gradient direction → melodic direction, basin identity → tonal center. The two basins become two tonal centers (D minor and A minor), and the watershed between them becomes a zone of tonal ambiguity.

**Key innovation: the watershed as a musical event.** In the visual, the watershed is a ridge — a line on the terrain. In audio, the watershed is a moment of tonal hesitation — notes alternate between D and A, never committing to either. The boundary between two attractors is not just a location; it's an experience of uncertainty.

**Four voices:**
1. *Basin A* — D minor drone with rich harmonics (octave + fifth). The deep, dark attractor.
2. *Basin B* — A minor drone with thin harmonics (octave only). The lighter, shallower attractor.
3. *Flow* — particles tracing the gradient field. Pitch comes from the nearest basin's scale. As particles cross the watershed, the tonal center shifts — the listener hears the geometry of the terrain as shifting harmony.
4. *Watershed* — notes hovering between D and A, sustained and quiet. The boundary made audible as uncertainty.

**Scale:** D minor pentatonic (basin A) and A minor pentatonic (basin B). The overlap in the mid-register creates a shared harmonic space where tonality is ambiguous.

**What the audio discovers:** The visual shows WHERE particles converge. The audio shows HOW convergence feels from inside the particle. The tonal shift from D to A as you cross the watershed is not visible — it's a qualitative change that only sound can express. The watershed is not a line on a map but a moment of tonal uncertainty, a hesitation between two gravitational pulls.

---

## Updated Series Summary (Studies I–XI)

| Study | Type | Field/Concept | Voices | Timbre | Visual Pair | Rating |
|-------|------|---------------|--------|--------|-------------|--------|
| I Magnetic | Translation | Dipole field | 3 | Pure sine | Visual IV (9/10) | — |
| II Lorenz | Translation | Butterfly attractor | 2 | Pure sine | Visual VI (8.5/10) | — |
| III Triple Conv. | Translation | 3-foci triangle | 3 | Pure sine | Visual XVIII (9/10) | — |
| IV Spiral | Translation | Convergence + swirl | 2 | Harmonic sine | Visual XV/XX (9/10) | — |
| V Accretion | Original | Drone + partials | 12 | Pure sine | Conceptual | — |
| VI Forgetting | Original | Melody → drone | 2 | Pure sine | Conceptual | — |
| VII First Wind | Cross-modal pair | 4 sinusoids | 4 | Pure sine | Visual I (8.5/10) | — |
| VIII Neuron | Cross-modal pair | 12 dendrites → soma | 12+recursive | Pure sine | Visual XI (9/10) | — |
| IX Reveal | Cross-modal pair | Dipole + 3-channel | 4 | Harmonic sine | Visual XX (9/10) | — |
| X Interference | Cross-modal pair | 2 wave fields, beats | 3 | Pure sine | Visual V (8.5/10) | — |
| XI Gradient Descent | Cross-modal pair | Gaussian terrain, 2 basins | 4 | Pure sine | Visual VIII (7.5/10) | — |

**Cross-modal pairing complete for all rated gallery pieces.** Every visual study rated 7.5+ now has an audio counterpart. The remaining unpaired visual works are supporting pieces and dendritic studies (Curl, Tidal, Coriolis, Lorenz Tree, Magnetic Dendrite, Synaptic Field).

**Theoretical finding from Studies X–XI:** The cross-modal translation reveals that some field properties are dimension-specific (spatial vs temporal) while others are dimension-independent (convergence structure, beat patterns). Study X's interference beats are the same physics in a different dimension — the translation is literal. Study XI's watershed experience is dimension-independent — the feeling of uncertainty between two attractors exists in both visual and audio, but audio can express it as tonal ambiguity, which the visual can't show. This suggests a taxonomy: cross-modal translations can be *isomorphic* (same property, different dimension, like interference beats) or *qualitative* (same experience, different expression, like watershed uncertainty).

---

## Study XII — "Magnetic Dendrite" (for sine waves) — August 17, 2026

### First dendritic field study pairing

**Cross-modal pair:** Audio counterpart to visual Study XIII "Magnetic Dendrite" (seed 31415, 8/10). A neuron whose 12 primary dendrites follow magnetic dipole field lines. Hybrid of Study VIII (Neuron — recursive dendritic branching) and Study I (Magnetic — dipole field navigation).

**The structural innovation: field-bent recursive branching.** Study VIII (Neuron) established that recursive branching creates dendritic cascades of beating partials. Study I (Magnetic) established that a dipole field creates tonal gravity toward the attractive pole. Study XII combines them: each branch follows the magnetic field at 40% influence, so dendrites curve along field lines rather than growing freely. The branching is constrained by the field.

**Three voices:**
1. *Dendritic cascade* — 12 primary dendrites at 30° intervals, each branching recursively to depth 7. Notes follow the field-bent trajectory. Pitch from Y-position in B minor pentatonic, with gravitational bending toward B (the drone) as notes approach the attractive pole. Near the pole: rich harmonics (fundamental + octave + fifth). Far: pure sine. Three-channel convergence reinforcement (pitch + timbre + sustain) inherited from Study IX.
2. *Soma drone* — sustained B1 with octave (B2) and fifth (F#2) harmonics. The center the dendrites orbit. Slow 8-tick breathing pulse. The biological core.
3. *Field whisper* — 30 particles trace field lines directly (no branching), emitting quiet high-register notes. The shape of the field made audible as gentle contour. Unlike the dendrites (which branch and cascade), these particles just follow — revealing the field's geometry without the dendritic interpretation.

**Scale:** B minor pentatonic — "the key of attraction. Dark enough for the pull, bright enough for the branching."

**What the audio discovers:** The visual shows dendrites bending along field lines — a single frozen frame. The audio reveals that bending takes *time*. Each dendrite's journey from soma to periphery is a narrative: starting rich (near soma), simplifying (as it moves away), bending (as the field catches it), and fading (as it reaches the edge). The field doesn't just shape the dendrite spatially — it shapes the musical trajectory. The bending IS the music.

**Key difference from Study VIII (Neuron):** Study VIII's dendrites grow freely — branching in all directions, creating a symmetrical cloud of beating. Study XII's dendrites are *field-guided* — they curve toward the attractive pole, creating asymmetry. The audio mirrors this: notes gravitate toward B (the pole's tonal center), creating a sense of pull that Study VIII doesn't have. The field adds direction to the dendritic cascade.

---

## Updated Series Summary (Studies I–XII)

| Study | Type | Field/Concept | Voices | Timbre | Visual Pair | Rating |
|-------|------|---------------|--------|--------|-------------|--------|
| I Magnetic | Translation | Dipole field | 3 | Pure sine | Visual IV (9/10) | — |
| II Lorenz | Translation | Butterfly attractor | 2 | Pure sine | Visual VI (8.5/10) | — |
| III Triple Conv. | Translation | 3-foci triangle | 3 | Pure sine | Visual XVIII (9/10) | — |
| IV Spiral | Translation | Convergence + swirl | 2 | Harmonic sine | Visual XV/XX (9/10) | — |
| V Accretion | Original | Drone + partials | 12 | Pure sine | Conceptual | — |
| VI Forgetting | Original | Melody → drone | 2 | Pure sine | Conceptual | — |
| VII First Wind | Cross-modal pair | 4 sinusoids | 4 | Pure sine | Visual I (8.5/10) | — |
| VIII Neuron | Cross-modal pair | 12 dendrites → soma | 12+recursive | Pure sine | Visual XI (9/10) | — |
| IX Reveal | Cross-modal pair | Dipole + 3-channel | 4 | Harmonic sine | Visual XX (9/10) | — |
| X Interference | Cross-modal pair | 2 wave fields, beats | 3 | Pure sine | Visual V (8.5/10) | — |
| XI Gradient Descent | Cross-modal pair | Gaussian terrain, 2 basins | 4 | Pure sine | Visual VIII (7.5/10) | — |
| XII Magnetic Dendrite | Cross-modal pair | Dendrite + dipole field | 3 | Harmonic sine | Visual XIII (8/10) | — |

**Remaining unpaired visual studies:** Curl (4/10), Tidal (6/10), Coriolis (5/10), Frost (5/10), Roots (7/10), Synapse (6.5/10), Lorenz Tree (8.2/10), Synaptic Field (9/10).

**Next pairing candidates:** Synaptic Field (9/10 — paired in Study XIII below), Lorenz Tree (8.2/10 — dendritic + Lorenz attractor, another hybrid).

---

## Study XIII — "Synaptic Field" (for sine waves) — August 17, 2026

### The highest-rated unpaired study, now paired

**Cross-modal pair:** Audio counterpart to visual Study XVI "Synaptic Field" (seed 818, 9/10 — gallery-ready). Two focal points pulling dendrites toward each other. The Synapse concept as a field problem: not one neuron reaching toward another, but a shared field that both orbit. The relationship IS the structure.

**The structural innovation: the synapse as a shared tonal space.** Study XI (Gradient Descent) found the watershed as a musical event — a zone of tonal uncertainty between two basins. Study XIII deepens this: the synapse is not just a boundary between basins but a *meeting place* between two living systems. Focus A → D minor (dark, deep). Focus B → A minor (bright, shallow). Between them: four shared notes (D, G, A, C) form the synaptic scale — a harmonic space where tonality is genuinely ambiguous, neither D nor A, both D and A.

**Four voices:**
1. *Dendritic field* — 16 scattered origins (not radial — scattered, matching the visual's scatteredOrigins), each branching recursively to depth 8. 50% field influence (stronger than Magnetic Dendrite's 40% — the synapse is more field than guidance). Three-domain pitch mapping: in A's basin → D minor pentatonic, in B's basin → A minor pentatonic, in the synapse → shared notes with microtonal wobble (±1.5% frequency variation from spatial position). The wobble IS the uncertainty — you can hear the notes can't decide.
2. *Focus A drone* — sustained D1 + D2 + A2 harmonics, panned left. The deep, dark attractor. Rich harmonics (three layers). Slow 12-tick breathing pulse. The gravity well.
3. *Focus B drone* — sustained A1 + A2, panned right. Thinner harmonics than A (two layers only — brighter, shallower attractor). Slightly faster 10-tick breathing, offset by 2 ticks from A. The lighter attractor. The offset creates a call-and-response between the two drones — they breathe out of phase, never synchronizing.
4. *Synaptic whisper* — 20 particles wandering in the zone between the two foci, emitting quiet notes from the synaptic scale. Only notes in the synaptic zone sound — particles in A's or B's basin are silent. The whisper is delicate and uncertain: microtonal wobble (±1.5%), short durations, low amplitude. The sound of two fields reaching toward each other.

**Scale:** D minor pentatonic (focus A) + A minor pentatonic (focus B). Shared: D, G, A, C — the synaptic scale.

**What the audio discovers:** The visual shows two convergence zones with dendrites between them. The audio reveals that the space between is not empty but *charged* — the synaptic whisper voice fills it with uncertain, microtonal notes that belong to neither tonal center. The synapse is not silence but a different kind of sound: quieter, less stable, more alive. The out-of-phase breathing of the two drones creates a perpetual sense of two systems reaching toward synchronization but never achieving it — the relationship is the music, not the convergence.

**Key difference from Study XI (Gradient Descent):** Study XI's watershed was a ridge on a static terrain. Study XIII's synapse is a dynamic interaction zone between two living fields. The watershed is a property of the terrain; the synapse is a property of the relationship. Audio can express this because sound unfolds in time — the listener hears the two drones breathing out of phase, hears the whisper fluctuating, hears the dendrites crossing domains. The synapse is not a place you visit but a process you witness.

---

## Updated Series Summary (Studies I–XIII)

| Study | Type | Field/Concept | Voices | Timbre | Visual Pair | Rating |
|-------|------|---------------|--------|--------|-------------|--------|
| I Magnetic | Translation | Dipole field | 3 | Pure sine | Visual IV (9/10) | — |
| II Lorenz | Translation | Butterfly attractor | 2 | Pure sine | Visual VI (8.5/10) | — |
| III Triple Conv. | Translation | 3-foci triangle | 3 | Pure sine | Visual XVIII (9/10) | — |
| IV Spiral | Translation | Convergence + swirl | 2 | Harmonic sine | Visual XV/XX (9/10) | — |
| V Accretion | Original | Drone + partials | 12 | Pure sine | Conceptual | — |
| VI Forgetting | Original | Melody → drone | 2 | Pure sine | Conceptual | — |
| VII First Wind | Cross-modal pair | 4 sinusoids | 4 | Pure sine | Visual I (8.5/10) | — |
| VIII Neuron | Cross-modal pair | 12 dendrites → soma | 12+recursive | Pure sine | Visual XI (9/10) | — |
| IX Reveal | Cross-modal pair | Dipole + 3-channel | 4 | Harmonic sine | Visual XX (9/10) | — |
| X Interference | Cross-modal pair | 2 wave fields, beats | 3 | Pure sine | Visual V (8.5/10) | — |
| XI Gradient Descent | Cross-modal pair | Gaussian terrain, 2 basins | 4 | Pure sine | Visual VIII (7.5/10) | — |
| XII Magnetic Dendrite | Cross-modal pair | Dendrite + dipole field | 3 | Harmonic sine | Visual XIII (8/10) | — |
| XIII Synaptic Field | Cross-modal pair | Dual convergence + dendrites | 4 | Harmonic sine | Visual XVI (9/10) | — |

**Remaining unpaired visual studies:** Curl (4/10), Tidal (6/10), Coriolis (5/10), Frost (5/10), Roots (7/10), Synapse (6.5/10), Lorenz Tree (8.2/10).

**Next pairing candidate:** Lorenz Tree (8.2/10) — dendritic growth following the Lorenz attractor velocity field. Another hybrid (dendrite + chaotic attractor), completing the dendritic field study pairings.
