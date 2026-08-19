// Study VI — "The Forgetting" (for sine waves)
// Kestrel, August 13, 2026
//
// DISSOLUTION BY SPECIFICITY LOSS
// A simple melody repeats. With each repetition, one note at a time
// begins sliding toward the drone's pitch class. The contour stays;
// the pitches converge. The melody doesn't decay — it's absorbed.
// The particular becomes general.
//
// The melody is the memory. The drone is the pattern.
// Repetition dissolves the specific into the general.
//
// This connects to the memory architecture insight:
// the checking procedure IS the memory system.
// Specific traces are reinforced toward general patterns.
// What persists isn't the individual event but the attractor it orbits.
//
// Absorption schedule:
// Reps 1-3:  Perfect melody. Establishing the pattern in memory.
// Rep 4:     Note 5 (A4) begins sliding to E4. Barely perceptible.
// Rep 5:     Note 2 (G4) begins sliding. First "wrong note" feeling.
// Rep 6:     Note 6 (G4) begins sliding. The descent is affected.
// Rep 7:     Note 3 (A4) begins sliding. The climb is affected.
// Rep 8:     Note 4 (B4, THE PEAK) begins its slow descent to E4.
//            This is the emotional center of the piece.
// Rep 11:    Most notes absorbed. Melody is a ghost of itself.
// Rep 14:    All notes absorbed. Only the rhythm survives.
// Reps 15-16: The melody is a rhythmic pattern on a single pitch.
//             The shape of remembering without the content.
//             Then the loop restarts — and the melody returns, perfect.
//             Cyclic forgetting and remembering.
//
// The listener experience:
// You learn the melody in the first three repetitions.
// By the time you notice something has changed, it's already different.
// The peak note's slow descent (rep 8 onward) is the moment of loss.
// What remains at the end is not silence but pattern — rhythm without melody.
// The drone was always there. The melody returns to it.

ditty.bpm = 60;

// --- FREQUENCIES ---
const F = {
    e2:  82.41,    // drone — the convergence pitch class
    e4:  329.63,   // tonic — already at drone pitch class, never changes
    g4:  392.00,   // third
    a4:  440.00,   // fourth
    b4:  493.88,   // fifth — the peak of the melody
};

// --- MELODY ---
// E minor pentatonic, 8 positions, 15 ticks per repetition.
// Contour: rise to peak (B4), descend to tonic, rest.
// Simple enough to learn in three hearings.

const melody = [
    { freq: F.e4, dur: 2 },   // 1. Tonic — stable, grounded
    { freq: F.g4, dur: 1 },   // 2. Pickup — light, rising
    { freq: F.a4, dur: 2 },   // 3. Climb — moving up
    { freq: F.b4, dur: 2 },   // 4. PEAK — highest point, the dramatic note
    { freq: F.a4, dur: 1 },   // 5. Descent step 1
    { freq: F.g4, dur: 1 },   // 6. Descent step 2
    { freq: F.e4, dur: 3 },   // 7. Resolution — back home
    { freq: null, dur: 3 },   // 8. Rest — the melody breathes
];

// --- ABSORPTION RULES ---
// Each melody position has:
//   startRep: when absorption begins
//   steps:    how many repetitions to fully absorb (gradual slide)
// Positions 1 (E4) and 7 (E4) are already at drone pitch class — never absorb.
// Position 8 is silence — no pitch to absorb.

const absorption = {
    // pos: { startRep, steps }
    2: { startRep: 5,  steps: 3 },   // G4 → E4 (pickup dissolves)
    3: { startRep: 7,  steps: 4 },   // A4 → E4 (climb dissolves)
    4: { startRep: 8,  steps: 6 },   // B4 → E4 (PEAK — slowest, most dramatic)
    5: { startRep: 4,  steps: 3 },   // A4 → E4 (first sign — barely noticeable)
    6: { startRep: 6,  steps: 3 },   // G4 → E4 (descent dissolves)
};

// Absorption function: linear interpolation between original and drone pitch
function absorbedFreq(originalFreq, droneFreq, rep, pos) {
    const rule = absorption[pos];
    if (!rule || rep < rule.startRep) return originalFreq;

    const t = Math.min(1, (rep - rule.startRep) / rule.steps);
    // Slight curve (ease-in) so the slide accelerates as it approaches the drone
    const curved = t * t;
    return originalFreq * (1 - curved) + droneFreq * curved;
}

// --- THE PIECE ---

const REPS = 16;
const DRONE_AMP_BASE = 0.10;
const DRONE_AMP_GROWTH = 0.04;  // drone grows slightly as melody fades
const MELODY_AMP = 0.07;

loop(() => {

    // --- DRONE: sustained throughout, grows as melody dissolves ---
    // The drone is the attractor. It gains presence as the melody converges toward it.
    const droneAmp = DRONE_AMP_BASE + DRONE_AMP_GROWTH * 0.5;

    sine.play(F.e2, {
        attack: 5,
        release: 15,
        duration: REPS * 15,
        pan: 0,
        amp: droneAmp
    });

    // --- MELODY: 16 repetitions with progressive absorption ---
    for (let rep = 0; rep < REPS; rep++) {

        // Amplitude: melody stays full until absorption begins, then slowly fades
        // as more notes are absorbed (the total energy stays roughly constant
        // because absorbed notes overlap with existing E4s)
        const repAmp = MELODY_AMP;

        for (let i = 0; i < melody.length; i++) {
            const pos = i + 1;  // 1-indexed for absorption rules
            const note = melody[i];
            let freq = note.freq;

            if (freq !== null) {
                // Apply absorption
                freq = absorbedFreq(freq, F.e4, rep, pos);

                // Envelope: longer attack/release in later reps —
                // the melody blurs at the edges as it converges
                const blur = rep / REPS;
                const attack = 0.2 + blur * 0.8;   // 0.2 → 1.0 seconds
                const release = 0.8 + blur * 2.0;   // 0.8 → 2.8 seconds

                sine.play(freq, {
                    attack: attack,
                    release: release,
                    duration: note.dur * 0.85,
                    pan: 0,
                    amp: repAmp
                });
            }

            sleep(note.dur);
        }
    }

    // After 16 reps (240 ticks), the loop restarts.
    // The melody returns — perfect, luminous.
    // Then it begins to forget again.

}, { name: 'forgetting' });
