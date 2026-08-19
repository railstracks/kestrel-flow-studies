// Flow Study VIII — "Neuron" (for sine waves + filtered noise)
// Kestrel, August 14, 2026
//
// CROSS-MODAL PAIR: Audio counterpart to visual Study XI "Neuron" (seed 31415).
// The visual piece: 12 primary dendrites growing isotropically from a central
// soma, recursive branching to depth 10, 6310 segments. Radial symmetry with
// organic variation. Opacity gradient creates 3D "spherical" depth.
// Rated 9/10 — tied for highest across all series.
//
// TRANSLATION PRINCIPLE:
// Visual → Audio mapping:
//   dendrite angle (12 radial origins) → 12 pitch centers around a drone
//   recursion depth → envelope evolution (attack/release lengthen with depth)
//   branch length → note duration
//   opacity tapering → amplitude tapering per depth
//   radial symmetry → centripetal tonal symmetry around the drone
//   the soma → the drone (the convergence point)
//
// KEY DESIGN DECISION: The visual Neuron has 12 primary dendrites at 30° intervals.
// In audio, 12 pitch classes map perfectly to 12-tone equal temperament.
// Each dendrite starts at a different semitone and converges toward the drone
// (the soma). The branching is recursive: each note spawns two notes at
// slightly different pitches, creating a dendritic cascade of microtonal
// beating. The beating IS the sound of branching — same as the visual
// dendrites creating density through bifurcation.
//
// The visual uses opacity tapering (exponential fade with depth).
// The audio uses amplitude tapering: trunk notes are loud and sustained,
// terminal twigs are quiet and brief. The "spherical depth" of the visual
// becomes a temporal depth in audio — near notes are loud/present,
// far notes are quiet/ephemeral.
//
// Dittytoy API: https://dittytoy.net/syntax

ditty.bpm = 50;

// --- THE SOMA (drone) ---
// C2 — the center. All dendrites grow from and return to this pitch.
// The drone is quiet but omnipresent, like the soma in the visual.

const SOMA = c2;
const SOMA_HARMONIC = c3;  // octave for warmth

// --- 12 DENDRITES ---
// Each starts at a semitone offset from the soma and converges toward it.
// In the visual, the 12 dendrites are at 30° intervals (360/12).
// In audio, the 12 semitones are the chromatic scale.
// The convergence: each dendrite's pitch slides toward the soma's pitch class
// over its lifetime, like the visual dendrites physically growing toward center.

const dendriteStarts = [
    65.41,   // C2  (unison — one dendrite starts AT the soma)
    69.30,   // C#2 (semitone above)
    73.42,   // D2
    77.78,   // D#2
    82.41,   // E2
    87.31,   // F2
    92.50,   // F#2
    98.00,   // G2
    103.83,  // G#2
    110.00,  // A2
    116.54,  // A#2
    123.47,  // B2
];

// --- RECURSIVE BRANCHING ---
// Each dendrite spawns notes at decreasing amplitude and increasing
// microtonal offset (the branches diverge from the trunk pitch).
// Depth 0 = trunk (loud, sustained, near soma pitch)
// Depth 3 = terminal twigs (quiet, brief, microtonally offset)

const MAX_DEPTH = 4;
const TRAIL_LENGTH = 6;  // notes per branch segment

function playBranch(freq, depth, pan, startTime) {
    if (depth > MAX_DEPTH) return;
    if (startTime < 0 || startTime > 600) return;  // schedule guard

    // Amplitude tapering: exponential fade (like visual opacity)
    const amp = 0.12 * Math.pow(0.55, depth);

    // Envelope evolution: deeper branches have longer attack/release
    // (like the visual where fine tips are diffuse/ghostly)
    const attack = 0.3 + depth * 0.6;
    const release = 1.0 + depth * 1.2;
    const duration = 2.0 - depth * 0.3;

    // Microtonal offset increases with depth (the branching divergence)
    const microOffset = depth * 0.3;  // cents
    const actualFreq = freq * Math.pow(2, microOffset / 1200);

    sine.play(actualFreq, {
        attack: attack,
        release: release,
        duration: Math.max(0.3, duration),
        pan: pan,
        amp: amp,
        start: startTime
    });

    // Spawn two children at microtonal offsets (bifurcation)
    if (depth < MAX_DEPTH) {
        const childTime = startTime + duration * 0.6;
        const childPanOffset = 0.15 * Math.pow(0.7, depth);
        const childFreqRatio = 1.5 + depth * 0.02;  // perfect fifth + slight drift

        playBranch(actualFreq * childFreqRatio, depth + 1, pan + childPanOffset, childTime);
        playBranch(actualFreq / childFreqRatio * 1.0, depth + 1, pan - childPanOffset, childTime);
    }
}

// --- CONVERGENCE FUNCTION ---
// Each dendrite's pitch converges toward the soma pitch class over time.
// Linear interpolation with ease-in (like the visual growth bias toward center).

function convergePitch(startFreq, somaFreq, progress) {
    // progress 0..1, ease-in curve
    const t = progress * progress * (3 - 2 * progress);  // smoothstep
    return startFreq * (1 - t) + somaFreq * t;
}

// --- THE PIECE ---
// 12 dendrites, each starting at a different semitone, growing toward the soma.
// Each dendrite plays a chain of notes with recursive branching.
// The piece unfolds over ~5 minutes.

loop(() => {

    // The soma: sustained drone throughout the entire piece
    sine.play(SOMA, {
        attack: 8,
        release: 30,
        duration: 360,
        pan: 0,
        amp: 0.10
    });

    // Soma harmonic (octave) — quieter, adds warmth
    sine.play(SOMA_HARMONIC, {
        attack: 10,
        release: 25,
        duration: 340,
        pan: 0,
        amp: 0.04
    });

    // 12 dendrites launched in sequence, each from a different starting pitch
    for (let d = 0; d < 12; d++) {
        const startFreq = dendriteStarts[d];
        const pan = ((d / 12) - 0.5) * 1.6;  // spread across stereo field
        const launchTime = d * 8;  // stagger launches: one dendrite per 8 ticks

        // Each dendrite: 6 notes converging toward soma, then recursive branches
        for (let step = 0; step < TRAIL_LENGTH; step++) {
            const progress = step / (TRAIL_LENGTH - 1);
            const freq = convergePitch(startFreq, SOMA, progress);

            const stepTime = launchTime + step * 3;
            if (stepTime > 340) break;

            // Amplitude decreases along the trail (dendrite tapers)
            const stepAmp = 0.10 * (1 - progress * 0.4);

            const attack = 0.5 + progress * 1.0;
            const release = 1.5 + progress * 2.0;

            sine.play(freq, {
                attack: attack,
                release: release,
                duration: 2.5,
                pan: pan,
                amp: stepAmp,
                start: stepTime
            });

            // Recursive branch at each step (deeper into the dendrite)
            if (step >= 2 && step % 2 === 0) {
                const branchFreq = freq * (1.5 + (step * 0.01));
                playBranch(branchFreq, 1, pan, stepTime + 1.5);
                playBranch(freq * (1.0 / 1.5), 1, pan, stepTime + 1.5);
            }
        }
    }

    // After all dendrites have grown (12 * 8 + 6 * 3 = ~114 ticks),
    // there's sustained resonance. The soma drone continues.
    // Dendrites' tail releases overlap, creating a fading harmonic cloud
    // that gradually settles back to the pure drone.
    // Total: ~360 ticks = ~6.5 minutes at 50 BPM.

    sleep(360);

}, { name: 'neuron' });