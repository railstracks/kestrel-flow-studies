// Flow Study III — "Triple Convergence" (for sine waves)
// Kestrel, August 2026
//
// Translates the triple-convergence dendritic field into sound.
// Three focal points on a triangle, each with its own tonal center.
// Particles drift through the field, gravitating toward the nearest focus.
// The result is a network of melodic lines that weave between three harmonic poles.
//
// Visual counterpart: Study XIV "Triple Convergence" — three foci in triangle
// arrangement, seed 818, scored 9/10. The visual piece shows network topology
// with neutral zones between attractors. This study makes that topology audible.
//
// Mapping:
//   Each focus has a tonal center (root + scale).
//   Particle pitch is drawn from the scale of the NEAREST focus.
//   Amplitude increases near foci (convergence = intensity).
//   Pan follows x position, but weighted toward nearest focus.
//
// The three centers form a major triad: E, G#, B — but each uses a different
// scale mode, creating distinct harmonic colors that blur at the boundaries.
//
// Dittytoy API: https://dittytoy.net/syntax

ditty.bpm = 60;

// --- THE FIELD ---
// Three convergence foci in triangle arrangement.
// Same formula as the visual dendritic field studies (Series IV).

const foci = [
    { x: -45, y:  35 },  // top-left
    { x:  45, y:  35 },  // top-right
    { x:   0, y: -45 },  // bottom-center
];

const pull = 1.2;
const swirl = 0.4;

function convergenceField(x, y) {
    let fx = 0, fy = 0;
    for (let i = 0; i < foci.length; i++) {
        const dx = foci[i].x - x;
        const dy = foci[i].y - y;
        const r = Math.sqrt(dx * dx + dy * dy + 1);
        const s = swirl * (i % 2 === 0 ? 1 : -1);
        fx += (dx / r) * pull + (-dy / r) * s;
        fy += (dy / r) * pull + (dx / r) * s;
    }
    fx /= foci.length;
    fy /= foci.length;
    return {
        angle: Math.atan2(fy, fx),
        magnitude: Math.sqrt(fx * fx + fy * fy)
    };
}

// Find nearest focus index
function nearestFocus(x, y) {
    let minDist = Infinity, idx = 0;
    for (let i = 0; i < foci.length; i++) {
        const d = (foci[i].x - x) ** 2 + (foci[i].y - y) ** 2;
        if (d < minDist) { minDist = d; idx = i; }
    }
    return idx;
}

// Distance to nearest focus (normalized 0..1, where 0 = at focus)
function focusProximity(x, y) {
    let minDist = Infinity;
    for (let i = 0; i < foci.length; i++) {
        const d = Math.sqrt((foci[i].x - x) ** 2 + (foci[i].y - y) ** 2);
        if (d < minDist) minDist = d;
    }
    return Math.max(0, 1 - minDist / 60);  // 60 units = edge of influence
}

// --- TONAL CENTERS ---
// Three foci → three roots of a major triad, each with a distinct mode:
// Focus 0 (E):  E minor pentatonic — dark, grounded, "earth"
// Focus 1 (G#): G# major pentatonic — bright, open, "air"
// Focus 2 (B):  B minor pentatonic — tense, restless, "water"
//
// The modes aren't arbitrary: E minor and B minor share a key signature,
// G# major is the "outsider" — creating harmonic tension at the boundary
// between focus 0/2 territory and focus 1 territory.

const focusScales = [
    scale(e2, scales['minor_pentatonic'], 2),   // E2–E4
    scale(gs2, scales['major_pentatonic'], 2),   // G#2–G#4
    scale(b2, scales['minor_pentatonic'], 2),    // B2–B4
];

const focusBassNotes = [e1, gs1, b1];

// --- MAPPING HELPERS ---

function yToNote(y, noteArray) {
    const normalized = (y + 100) / 200;
    const idx = Math.floor(normalized * noteArray.length);
    return noteArray[Math.max(0, Math.min(noteArray.length - 1, idx))];
}

function xToPan(x) {
    return Math.max(-1, Math.min(1, x / 100));
}

// --- VOICE 1: CONVERGENCE TRAILS ---
// Particles trace the three-foci field. Each particle's pitch comes from
// its nearest focus's scale. As particles drift between zones of influence,
// their scale changes — creating modulations that trace the field topology.
//
// The musical experience: you hear a melody in E minor, then it shifts
// to G# major as the particle crosses into another focus's territory,
// then to B minor. The shifts aren't random — they follow the field geometry.

loop(() => {
    let x = -50 + Math.random() * 100;
    let y = -50 + Math.random() * 100;
    const stepSize = 2.2;

    for (let i = 0; i < 36; i++) {
        const f = convergenceField(x, y);
        x += Math.cos(f.angle) * stepSize;
        y += Math.sin(f.angle) * stepSize;

        // Respawn if out of bounds
        if (Math.abs(x) > 95 || Math.abs(y) > 95) {
            x = -50 + Math.random() * 100;
            y = -50 + Math.random() * 100;
        }

        // Which focus's territory are we in?
        const fi = nearestFocus(x, y);
        const notes = focusScales[fi];
        const prox = focusProximity(x, y);

        // Amplitude: stronger near foci (convergence = intensity)
        const amp = 0.08 + prox * 0.15;

        // Envelope: longer near foci (the "pull" sustains notes)
        // Shorter in neutral zones (the "between" is restless)
        const attack = 0.3 + prox * 1.5;
        const release = 1.2 + prox * 2.8;

        sine.play(yToNote(y, notes), {
            attack: attack,
            release: release,
            duration: 0.8,
            pan: xToPan(x),
            amp: amp
        });

        sleep(0.8);
    }
}, { name: 'convergence-trails' });

// --- VOICE 2: FOCAL DRONE ---
// Each focus sustained as a quiet bass tone. The three tones form a
// major triad (E, G#, B) — but because they're widely spaced in pan
// and very quiet, they create a "room tone" rather than a chord.
//
// The focal drone is what the convergence trails orbit around.
// It's the sonic equivalent of the three dark convergence points
// in the visual Triple Convergence study.

loop(() => {
    for (let i = 0; i < 18; i++) {
        const note = focusBassNotes[i % 3];
        // Pan each focus to its spatial position
        const focalPan = i % 3 === 0 ? -0.5 : (i % 3 === 1 ? 0.5 : 0);

        sine.play(note, {
            attack: 4.0,
            release: 7.0,
            duration: 6.0,
            pan: focalPan,
            amp: 0.07
        });

        sleep(6.0);
    }
}, { name: 'focal-drone' });

// --- VOICE 3: INTERSTITIAL ---
// In the visual study, the neutral zones between foci have sparse, thin lines.
// This voice represents them: very high, very quiet, very short notes
// that only sound when particles are far from any focus.
// The "between" becomes audible as rare, delicate sparks.

loop(() => {
    let x = -50 + Math.random() * 100;
    let y = -50 + Math.random() * 100;
    const stepSize = 3.0;

    for (let i = 0; i < 30; i++) {
        const f = convergenceField(x, y);
        x += Math.cos(f.angle) * stepSize;
        y += Math.sin(f.angle) * stepSize;

        if (Math.abs(x) > 95 || Math.abs(y) > 95) {
            x = -50 + Math.random() * 100;
            y = -50 + Math.random() * 100;
        }

        const prox = focusProximity(x, y);

        // Only sound in the "between" — far from any focus
        if (prox < 0.3) {
            // Use a high, neutral note — not tied to any focus's scale
            const highNotes = scale(e5, scales['minor_pentatonic'], 1);
            const noteIdx = Math.floor(((x + 100) / 200) * highNotes.length);
            const note = highNotes[Math.max(0, Math.min(highNotes.length - 1, noteIdx))];

            sine.play(note, {
                attack: 0.05,
                release: 0.3,
                duration: 0.3,
                pan: xToPan(x),
                amp: 0.04 + (0.3 - prox) * 0.06
            });
        }

        sleep(1.2);  // slow — these are rare sparks, not a continuous line
    }
}, { name: 'interstitial' });
