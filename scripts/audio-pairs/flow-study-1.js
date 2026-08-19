// Flow Study I (for sine waves)
// Kestrel, August 2026
//
// Translates the visual Flow Studies aesthetic into sound.
// Particles trace a magnetic dipole field; each position becomes a note.
// y-position → pitch, x-position → stereo pan, field magnitude → amplitude.
// Three voice-loops at different registers, pure sine waves, no effects.
//
// The visual Flow Studies used charcoal lines on cream paper.
// This uses sine tones on silence. Same minimalism, different sense.
//
// Inspired by Vera Molnár, Reinder Nijhoff's Dittytoy, and the kestrel-sounds series.
// Dittytoy API: https://dittytoy.net/syntax

ditty.bpm = 60;

// --- THE FIELD ---
// Magnetic dipole: one attractive pole, one repulsive pole.
// Same formula as Flow Study IV "Magnetic" (the highest-rated visual piece).
// Returns angle and magnitude at any point (x, y) on the canvas.

function dipoleField(x, y) {
    const pa = { x: -30, y: 20,  strength:  1 };  // attractive
    const pb = { x:  30, y: -20, strength: -1 };  // repulsive

    const dxa = x - pa.x, dya = y - pa.y;
    const dxb = x - pb.x, dyb = y - pb.y;

    const ra = Math.max(5, Math.sqrt(dxa*dxa + dya*dya));
    const rb = Math.max(5, Math.sqrt(dxb*dxb + dyb*dyb));

    const fx = pa.strength * dxa / (ra*ra) + pb.strength * dxb / (rb*rb);
    const fy = pa.strength * dya / (ra*ra) + pb.strength * dyb / (rb*rb);

    return {
        angle: Math.atan2(fy, fx),
        magnitude: Math.sqrt(fx*fx + fy*fy)
    };
}

// --- MAPPING ---
// Canvas is -100 to +100 in both axes (same as visual Flow Studies).
// Pitch: map y (-100..100) to scale degree. High y = high pitch.
// Pan: map x (-100..100) to stereo (-1..1).
// Amplitude: field magnitude determines note velocity.

const highNotes = scale(e3, scales['minor_pentatonic'], 2);  // 10 notes, E3–E5
const midNotes  = scale(e2, scales['minor_pentatonic'], 2);  // 10 notes, E2–E4
const bassNotes = scale(e1, scales['minor_pentatonic'], 1);  // 5 notes, E1–E2

// Helper: map a canvas coordinate to a note from a scale array
function yToNote(y, noteArray) {
    const normalized = (y + 100) / 200;                    // 0..1
    const idx = Math.floor(normalized * noteArray.length);
    return noteArray[Math.max(0, Math.min(noteArray.length - 1, idx))];
}

// Helper: map x to stereo pan
function xToPan(x) {
    return Math.max(-1, Math.min(1, x / 100));
}

// Helper: map field magnitude to amplitude
// The field magnitude is typically 0.001–0.05 in the canvas range.
// Scale it up and clamp to a usable range.
function magnitudeToAmp(mag, base, range) {
    const scaled = Math.min(1, mag * 800);
    return base + range * scaled;
}

// --- VOICE 1: HIGH FLOW ---
// Fast particles, short-to-medium notes. Traces the field in the upper register.
// Like the fine outer trails in the visual studies — wispy, directional.

loop(() => {
    let x = -60 + Math.random() * 120;
    let y =  20 + Math.random() * 60;      // start in upper portion
    const stepSize = 2.5;

    for (let i = 0; i < 32; i++) {
        const f = dipoleField(x, y);
        x += Math.cos(f.angle) * stepSize;
        y += Math.sin(f.angle) * stepSize;

        // Respawn if out of bounds (like trail boundary in visual studies)
        if (Math.abs(x) > 95 || Math.abs(y) > 95) {
            x = -60 + Math.random() * 120;
            y =  20 + Math.random() * 60;
        }

        sine.play(yToNote(y, highNotes), {
            attack: 0.5,
            release: 2.0,
            duration: 0.75,
            pan: xToPan(x),
            amp: magnitudeToAmp(f.magnitude, 0.12, 0.18)
        });

        sleep(0.75);
    }
}, { name: 'high-flow' });

// --- VOICE 2: MID FLOW ---
// Slower particles, longer notes. Lower register, more sustained.
// Like the dense central spirals in the visual studies — weightier, convergent.

loop(() => {
    let x = -30 + Math.random() * 60;
    let y = -40 + Math.random() * 40;      // start in lower-mid portion
    const stepSize = 1.8;

    for (let i = 0; i < 20; i++) {
        const f = dipoleField(x, y);
        x += Math.cos(f.angle) * stepSize;
        y += Math.sin(f.angle) * stepSize;

        if (Math.abs(x) > 95 || Math.abs(y) > 95) {
            x = -30 + Math.random() * 60;
            y = -40 + Math.random() * 40;
        }

        sine.play(yToNote(y, midNotes), {
            attack: 1.2,
            release: 3.5,
            duration: 1.5,
            pan: xToPan(x),
            amp: magnitudeToAmp(f.magnitude, 0.10, 0.15)
        });

        sleep(1.5);
    }
}, { name: 'mid-flow' });

// --- VOICE 3: BASS FOCAL ---
// Sustained tones at the two dipole poles. These are the "focal anchors" —
// the fixed points the field rotates around. Like the central "eye" void
// in the visual Magnetic study.

loop(() => {
    // The two poles, alternating. E1 for the attractive pole,
    // E2 for the repulsive pole. Long, quiet, grounding tones.
    const focalNotes = [e1, b1];

    for (let i = 0; i < 8; i++) {
        const note = focalNotes[i % 2];
        const pan = i % 2 === 0 ? -0.35 : 0.35;   // left for attractive, right for repulsive

        sine.play(note, {
            attack: 2.5,
            release: 5.0,
            duration: 4.0,
            pan: pan,
            amp: 0.12
        });

        sleep(4.0);
    }
}, { name: 'bass-focal' });
