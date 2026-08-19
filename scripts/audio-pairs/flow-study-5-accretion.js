// Study V — "Accretion" (for sine waves)
// Kestrel, August 13, 2026
//
// DISSOLUTION BY OVERSATURATION
// A drone tone accumulates harmonic partials, then microtonal variants.
// The convergence point (the drone) never changes.
// The dissolution comes from too much convergence —
// partials pile up until the pure tone is buried in spectral noise.
//
// This inverts the usual dissolution pattern:
// not material decaying away, but material accumulating until it overloads.
// The crystal forms in supersaturated solution — first clear, then cloudy, then opaque.
//
// Beat frequencies are precisely engineered:
// Phase 1: harmonic partials (0 Hz beating — pure consonance)
// Phase 2: 0.3-0.8 Hz beating (sub-shimmer, barely perceptible)
// Phase 3: 1-3 Hz beating (tremolo, gentle tension)
// Phase 4: 3-8 Hz beating (roughness, clear dissonance)
//
// Listener experience:
// 0:00 — pure drone, silence otherwise
// 0:20 — octave enters, drone gains depth
// 0:40 — fifth enters, major triad forms
// 1:00 — double octave, full harmonic spectrum
// 1:20 — first microtonal variant, almost imperceptible shimmer
//        (the first crack in the consonance)
// 2:00 — more microtonal variants, beating becomes audible
// 3:00 — roughness range, drone struggling to be heard
// 3:40 — spectral cloud, drone occluded by its own harmonic saturation
// 4:00 — cut. Reverberant tails of 12+ partials slowly dying.
//
// Related to kestrel-sounds Study 21 "Noise Floor" (ground dissolution via obscuration).
// But where that study buried the motif under external noise,
// this study buries the drone under its own harmonics.
// The destroyer grows from within.

ditty.bpm = 60;

// --- FREQUENCY TABLE ---
// Precise frequencies for microtonal beating control.
// Based on A4=440, equal temperament.

const f = {
    c2: 65.41,        // drone — the convergence point
    c3: 130.81,       // octave
    g3: 196.00,       // fifth
    c4: 261.63,       // double octave
    // microtonal variants — each labeled with its beat frequency vs nearest harmonic
    c3_4:  131.11,    // C3 + 4¢  → beats at 0.30 Hz (sub-shimmer)
    g3_6:  196.68,    // G3 + 6¢  → beats at 0.68 Hz (sub-shimmer)
    c3_15: 131.95,    // C3 + 15¢ → beats at 1.14 Hz (gentle tremolo)
    c4_5:  262.39,    // C4 + 5¢  → beats at 0.76 Hz (shimmer)
    g3_20: 198.27,    // G3 + 20¢ → beats at 2.27 Hz (tremolo)
    c4_18: 264.35,    // C4 + 18¢ → beats at 2.72 Hz (roughness)
    c3_45: 134.21,    // C3 + 45¢ → beats at 3.40 Hz (strong roughness)
    c4_55: 269.92,    // C4 + 55¢ → beats at 8.29 Hz (harsh beating)
};

// --- AMPLITUDE ARCHITECTURE ---
// With 12 overlapping voices at climax, individual amplitudes must be conservative.
// Drone dominates, then harmonics, then microtonal voices (quieter — they're the disruptors).

const amp = {
    drone:  0.15,
    harm:   0.07,
    micro:  0.045,
};

// --- ENVELOPE DESIGN ---
// Very long attacks (10-15 seconds) so entries are imperceptible.
// Long releases (20 seconds) so the decay after cutoff is gradual.
// Each voice sustains from its entry to the end of the piece.

const TOTAL = 240;  // 4 minutes in ticks

// --- THE PIECE ---
// A single loop that schedules all events along the timeline.
// Each voice enters imperceptibly and sustains to the end.

loop(() => {
    // PHASE 0: THE DRONE (0:00)
    // The convergence point. Everything will orbit this.
    sine.play(f.c2, {
        attack: 8,
        release: 20,
        duration: TOTAL,
        pan: 0,
        amp: amp.drone
    });

    sleep(20);  // — 0:20 —

    // PHASE 1: HARMONIC PARTIALS (consonant convergence)
    // Each adds depth without tension. The drone becomes a chord.

    // Octave
    sine.play(f.c3, {
        attack: 12,
        release: 20,
        duration: TOTAL - 20,
        pan: -0.15,
        amp: amp.harm
    });

    sleep(20);  // — 0:40 —

    // Fifth — now a major triad
    sine.play(f.g3, {
        attack: 12,
        release: 20,
        duration: TOTAL - 40,
        pan: 0.2,
        amp: amp.harm
    });

    sleep(20);  // — 1:00 —

    // Double octave — full harmonic spectrum complete
    sine.play(f.c4, {
        attack: 12,
        release: 20,
        duration: TOTAL - 60,
        pan: -0.25,
        amp: amp.harm * 0.8
    });

    sleep(20);  // — 1:20 —

    // PHASE 2: SUB-SHIMMER (0.3-0.8 Hz beating)
    // The first cracks in the consonance.
    // So slow you might think you're imagining it.

    sine.play(f.c3_4, {
        attack: 15,
        release: 20,
        duration: TOTAL - 80,
        pan: 0.35,
        amp: amp.micro
    });

    sleep(20);  // — 1:40 —

    sine.play(f.g3_6, {
        attack: 15,
        release: 20,
        duration: TOTAL - 100,
        pan: -0.4,
        amp: amp.micro
    });

    sleep(20);  // — 2:00 —

    // PHASE 3: TREMOLO RANGE (1-3 Hz beating)
    // Beating becomes clearly audible. Tension enters.

    sine.play(f.c3_15, {
        attack: 12,
        release: 20,
        duration: TOTAL - 120,
        pan: 0.45,
        amp: amp.micro
    });

    sleep(20);  // — 2:20 —

    sine.play(f.c4_5, {
        attack: 12,
        release: 20,
        duration: TOTAL - 140,
        pan: -0.3,
        amp: amp.micro
    });

    sleep(20);  // — 2:40 —

    sine.play(f.g3_20, {
        attack: 12,
        release: 20,
        duration: TOTAL - 160,
        pan: 0.15,
        amp: amp.micro
    });

    sleep(20);  // — 3:00 —

    // PHASE 4: ROUGHNESS RANGE (3-8 Hz beating)
    // The drone is now struggling to be heard through its own harmonics.

    sine.play(f.c4_18, {
        attack: 10,
        release: 20,
        duration: TOTAL - 180,
        pan: -0.5,
        amp: amp.micro
    });

    sleep(20);  // — 3:20 —

    sine.play(f.c3_45, {
        attack: 10,
        release: 20,
        duration: TOTAL - 200,
        pan: 0.5,
        amp: amp.micro
    });

    sleep(20);  // — 3:40 —

    // Final entry — harshest beating
    sine.play(f.c4_55, {
        attack: 8,
        release: 20,
        duration: TOTAL - 220,
        pan: 0,
        amp: amp.micro
    });

    // 3:40-4:00: all 12 voices sustaining.
    // The drone is present but occluded — a still center in a rough spectral cloud.
    // At 4:00 (tick 240), all voices begin their 20-second release.
    // The cloud dissipates slowly, the drone emerging briefly in the final decay
    // before everything fades to silence.

    sleep(TOTAL - 220);

}, { name: 'accretion' });
