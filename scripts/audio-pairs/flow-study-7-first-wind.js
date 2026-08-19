// Flow Study VII — "First Wind" (for sine waves)
// Kestrel, August 14, 2026
//
// CROSS-MODAL PAIR: Audio counterpart to visual Study I "First Wind" (seed 2026).
// The visual piece: 200 trails following four layered sinusoids with different
// frequencies and phases. Sweeping organic flow with a central river of density.
// Rated 8.5/10 — the original proof of concept, gallery-quality.
//
// TRANSLATION PRINCIPLE:
// Visual → Audio mapping:
//   trail position (x,y) → note pitch + pan
//   field magnitude → amplitude
//   four sinusoid layers → four voice registers
//   trail length → phrase length
//
// The visual First Wind has a central river of density — trails converge
// into a spine and fan outward. The audio equivalent: four voice layers
// at different registers, all following the same sinusoidal field,
// creating a central consonant "spine" with harmonic spread at the edges.
//
// KEY DESIGN DECISION: The visual piece uses FOUR sinusoids with different
// frequencies and phases. In audio, four overlapping sine layers at different
// registers create natural beating patterns — the "sweeping" quality of the
// visual translates to slow phasing in the audio. The interference IS the music.
//
// Dittytoy API: https://dittytoy.net/syntax

ditty.bpm = 54;

// --- THE FIELD ---
// Four layered sinusoids with different frequencies and phases.
// Same formula as visual Study I "First Wind" (seed 2026).

function firstWindField(x, y) {
    // Four sinusoids — each contributes angle and magnitude
    const f1 = Math.sin(x * 0.040 + 0.0) * Math.cos(y * 0.030);
    const f2 = Math.sin(x * 0.025 + 1.2) * Math.cos(y * 0.045 + 0.5);
    const f3 = Math.sin(x * 0.060 + 2.4) * Math.cos(y * 0.020 + 1.0);
    const f4 = Math.sin(x * 0.015 + 0.8) * Math.cos(y * 0.055 + 1.5);

    // Combined gradient → angle
    const fx = f1 + f2 * 0.7 + f3 * 0.5 + f4 * 0.3;
    const fy = f1 * 0.6 + f2 + f3 * 0.4 + f4 * 0.8;

    return {
        angle: Math.atan2(fy, fx),
        magnitude: Math.sqrt(fx * fx + fy * fy)
    };
}

// --- SCALE ---
// A minor pentatonic across 3.5 octaves.
// A minor because the visual First Wind feels autumnal —
// warm but with an edge, like October wind.
// Four registers map to the four sinusoid layers.

const sopranoNotes = scale(a3, scales['minor_pentatonic'], 2);   // A3–A5, 10 notes
const altoNotes    = scale(a2, scales['minor_pentatonic'], 2);   // A2–A4, 10 notes
const tenorNotes   = scale(a1, scales['minor_pentatonic'], 2);   // A1–A3, 10 notes
const bassNotes    = scale(a0 + 12, scales['minor_pentatonic'], 1); // ~A1 low octave, 5 notes

// --- MAPPING ---

function yToNote(y, noteArray) {
    const normalized = (y + 100) / 200;  // 0..1
    const idx = Math.floor(normalized * noteArray.length);
    return noteArray[Math.max(0, Math.min(noteArray.length - 1, idx))];
}

function xToPan(x) {
    return Math.max(-1, Math.min(1, x / 100));
}

function magnitudeToAmp(mag, base, range) {
    const scaled = Math.min(1, mag * 3.0);
    return base + range * scaled;
}

// --- VOICE 1: SOPRANO WIND (sinusoid layer 1 — highest frequency) ---
// Fast particles, short notes, upper register.
// Like the fine outer trails — wispy, directional, high.

loop(() => {
    let x = -80 + Math.random() * 160;
    let y =  40 + Math.random() * 50;      // start upper
    const stepSize = 2.8;

    for (let i = 0; i < 28; i++) {
        const f = firstWindField(x, y);
        x += Math.cos(f.angle) * stepSize;
        y += Math.sin(f.angle) * stepSize;

        if (Math.abs(x) > 95 || Math.abs(y) > 95) {
            x = -80 + Math.random() * 160;
            y =  40 + Math.random() * 50;
        }

        sine.play(yToNote(y, sopranoNotes), {
            attack: 0.4,
            release: 1.5,
            duration: 0.6,
            pan: xToPan(x),
            amp: magnitudeToAmp(f.magnitude, 0.08, 0.10)
        });

        sleep(0.6);
    }
}, { name: 'soprano-wind' });

// --- VOICE 2: ALTO FLOW (sinusoid layer 2 — medium frequency) ---
// Medium speed, medium register. The "central river" voice.
// This is where the density spine lives in the visual.

loop(() => {
    let x = -50 + Math.random() * 100;
    let y = -20 + Math.random() * 40;      // start mid
    const stepSize = 2.0;

    for (let i = 0; i < 24; i++) {
        const f = firstWindField(x, y);
        x += Math.cos(f.angle) * stepSize;
        y += Math.sin(f.angle) * stepSize;

        if (Math.abs(x) > 95 || Math.abs(y) > 95) {
            x = -50 + Math.random() * 100;
            y = -20 + Math.random() * 40;
        }

        sine.play(yToNote(y, altoNotes), {
            attack: 0.8,
            release: 2.2,
            duration: 1.0,
            pan: xToPan(x),
            amp: magnitudeToAmp(f.magnitude, 0.10, 0.12)
        });

        sleep(1.0);
    }
}, { name: 'alto-flow' });

// --- VOICE 3: TENOR DRIFT (sinusoid layer 3 — lower frequency) ---
// Slower, longer notes, lower register.
// Like the broad sweeping arcs in the visual.

loop(() => {
    let x = -40 + Math.random() * 80;
    let y = -60 + Math.random() * 40;      // start lower
    const stepSize = 1.5;

    for (let i = 0; i < 18; i++) {
        const f = firstWindField(x, y);
        x += Math.cos(f.angle) * stepSize;
        y += Math.sin(f.angle) * stepSize;

        if (Math.abs(x) > 95 || Math.abs(y) > 95) {
            x = -40 + Math.random() * 80;
            y = -60 + Math.random() * 40;
        }

        sine.play(yToNote(y, tenorNotes), {
            attack: 1.5,
            release: 3.0,
            duration: 1.8,
            pan: xToPan(x),
            amp: magnitudeToAmp(f.magnitude, 0.09, 0.10)
        });

        sleep(1.8);
    }
}, { name: 'tenor-drift' });

// --- VOICE 4: BASS GROUND (sinusoid layer 4 — lowest frequency) ---
// Very slow, very long notes, lowest register.
// The deep underlying current. In the visual, this is the substrate
// that all the lighter trails ride on.

loop(() => {
    let x = -30 + Math.random() * 60;
    let y = -80 + Math.random() * 30;      // start bottom
    const stepSize = 1.0;

    for (let i = 0; i < 12; i++) {
        const f = firstWindField(x, y);
        x += Math.cos(f.angle) * stepSize;
        y += Math.sin(f.angle) * stepSize;

        if (Math.abs(x) > 95 || Math.abs(y) > 95) {
            x = -30 + Math.random() * 60;
            y = -80 + Math.random() * 30;
        }

        sine.play(yToNote(y, bassNotes), {
            attack: 2.5,
            release: 5.0,
            duration: 4.0,
            pan: xToPan(x),
            amp: 0.08
        });

        sleep(4.0);
    }
}, { name: 'bass-ground' });