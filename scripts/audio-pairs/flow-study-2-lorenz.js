// Flow Study II — "Lorenz" (for sine waves)
// Kestrel, August 2026
//
// Translates the Lorenz attractor field into sound.
// The Lorenz system's butterfly pattern — two lobes with chaotic switching —
// becomes a structure where melodic lines alternate between two tonal centers.
// The chaos is musical: unpredictable switches, but always grounded.
//
// Visual counterpart: Flow Study VI "Lorenz" — diagonal thrust field.
// Same formula: dx/dt = σ(y-x), dy/dt = x(ρ-z) - y, projected to 2D.
//
// The piece is in two voices:
// 1. "Butterfly" — particles trace the attractor. Each lobe has its own scale.
//    Switches between lobes produce dramatic tonal shifts.
// 2. "Fixed point" — sustained tones at the attractor's unstable fixed points.
//    These are the "center of the butterfly" — the stillness the chaos orbits.
//
// Dittytoy API: https://dittytoy.net/syntax

ditty.bpm = 56;

// --- THE FIELD ---
// Lorenz attractor velocity field, projected to 2D.
// The z-component is estimated from position, creating the butterfly topology.

function lorenzField(x, y) {
    const sigma = 10.0;
    const rho = 28.0;
    const beta = 8.0 / 3.0;
    const lx = x * 0.05;
    const ly = y * 0.05;
    const lz = 20.0 + Math.sin(x * 0.01 + y * 0.008) * 10.0;
    const dx = sigma * (ly - lx);
    const dy = lx * (rho - lz) - ly;
    return {
        angle: Math.atan2(dy, dx),
        magnitude: Math.sqrt(dx * dx + dy * dy),
        lobe: lx > 0 ? 1 : -1  // which butterfly lobe?
    };
}

// --- LOBE-DEPENDENT SCALES ---
// Left lobe: E minor pentatonic (dark, grounded)
// Right lobe: G major pentatonic (bright, open)
// The relative major/minor relationship creates tonal tension across lobe switches.

const leftLobeNotes  = scale(e2, scales['minor_pentatonic'], 2);  // E2–E4, dark
const rightLobeNotes = scale(g2, scales['major_pentatonic'], 2);  // G2–G4, bright
const bassNotes      = [e1, g1];  // Fixed point tones: E1 (left), G1 (right)

function yToNote(y, noteArray) {
    const normalized = (y + 100) / 200;
    const idx = Math.floor(normalized * noteArray.length);
    return noteArray[Math.max(0, Math.min(noteArray.length - 1, idx))];
}

function xToPan(x) {
    return Math.max(-1, Math.min(1, x / 100));
}

function magnitudeToAmp(mag, base, range) {
    const scaled = Math.min(1, mag * 200);
    return base + range * scaled;
}

// --- VOICE 1: BUTTERFLY ---
// Particles trace the Lorenz attractor. Their pitch comes from the lobe they're in.
// Lobe switches produce sudden tonal shifts — the musical signature of chaos.
// The trajectory is deterministic but aperiodic: the same patterns recur
// but never exactly. Each particle is a new realization of the attractor.

loop(() => {
    let x = -40 + Math.random() * 80;
    let y = -30 + Math.random() * 60;
    const stepSize = 2.0;
    let prevLobe = lorenzField(x, y).lobe;
    let stepsSinceSwitch = 99;  // start high = no recent switch

    for (let i = 0; i < 40; i++) {
        const f = lorenzField(x, y);
        x += Math.cos(f.angle) * stepSize;
        y += Math.sin(f.angle) * stepSize;

        // Respawn if out of bounds
        if (Math.abs(x) > 95 || Math.abs(y) > 95) {
            x = -40 + Math.random() * 80;
            y = -30 + Math.random() * 60;
        }

        // Detect lobe switch — the moment of tonal drama
        if (f.lobe !== prevLobe) {
            stepsSinceSwitch = 0;
            prevLobe = f.lobe;
        } else {
            stepsSinceSwitch++;
        }

        // Choose scale based on current lobe
        const notes = f.lobe < 0 ? leftLobeNotes : rightLobeNotes;

        // Envelope: longer on first notes after a lobe switch (the "arrival")
        // Shorter during sustained lobe traversal (the "orbit")
        const recentSwitch = stepsSinceSwitch <= 2;
        const switchIntensity = recentSwitch ? 1.0 - stepsSinceSwitch * 0.4 : 0;
        const attack = 0.4 + switchIntensity * 1.6;
        const release = 1.5 + switchIntensity * 2.5;

        sine.play(yToNote(y, notes), {
            attack: attack,
            release: release,
            duration: 0.9,
            pan: xToPan(x),
            amp: magnitudeToAmp(f.magnitude, 0.10, 0.15)
        });

        sleep(0.9);
    }
}, { name: 'butterfly' });

// --- VOICE 2: FIXED POINTS ---
// The Lorenz attractor has unstable fixed points at the center of each lobe.
// These tones don't change — they ARE the centers the chaos orbits around.
// Like the bass-focal voice in Study I, but here representing the mathematical
// fixed points rather than physical poles.
//
// The fixed points alternate slowly, creating a pedal-point structure.
// Each lasts 8 ticks (~8.5 seconds at 56 BPM).

loop(() => {
    for (let i = 0; i < 12; i++) {
        const note = bassNotes[i % 2];
        const pan = i % 2 === 0 ? -0.4 : 0.4;

        sine.play(note, {
            attack: 3.0,
            release: 6.0,
            duration: 8.0,
            pan: pan,
            amp: 0.10
        });

        sleep(8.0);
    }
}, { name: 'fixed-points' });
