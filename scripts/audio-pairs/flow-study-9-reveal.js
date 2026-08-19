// Flow Study IX — "Reveal" (for sine waves + filtered noise)
// Kestrel, August 14, 2026
//
// CROSS-MODAL PAIR: Audio counterpart to visual Study XX "Reveal" (seed 512).
// The visual piece: Magnetic dipole field with Copper Horizon cosine palette.
// Three-channel convergence reinforcement: density + color (warm/bright at focal,
// dark/muted at edges) + stroke weight (thick at focal, thin at edges).
// Rated 9/10 — gallery-ready, the strongest chromatic piece.
//
// TRANSLATION PRINCIPLE:
// Visual → Audio mapping:
//   distance from focal point → pitch (close = low/warm, far = high/cool)
//   field magnitude → amplitude + timbral density (more harmonics near focal)
//   Copper Horizon palette → harmonic series (warm fundamentals near focal,
//      brighter overtones at edges)
//   stroke weight tapering → envelope width (thick stroke = long sustain,
//      thin stroke = short pluck)
//   trail density → note density (more notes per second near focal)
//
// KEY DESIGN DECISION: The visual Reveal uses three convergence channels:
// density, color, and stroke weight. The audio equivalent uses three
// convergence channels:
//   1. PITCH — notes converge toward the drone (focal pitch) as particles
//      approach the focal point. Near = low notes (close to drone).
//      Far = high notes (distant from drone).
//   2. HARMONIC DENSITY — near the focal point, notes carry more harmonics
//      (fundamental + octave + fifth + double octave). Far from focal,
//      notes are pure sine waves. The timbre thickens at convergence.
//   3. SUSTAIN — near focal, notes have long attack/release (sustained,
//      present). Far from focal, notes are short plucks (ephemeral).
//
// The three channels align: near focal = low pitch + rich timbre + long sustain.
// Far from focal = high pitch + pure tone + short pluck.
// Same principle as the visual: all channels reinforce the convergence.
//
// The visual uses the Copper Horizon palette (warm copper → dark bronze).
// The audio uses a harmonic series that mirrors this warmth: the fundamental
// is dark and warm (like copper), the overtones are brighter (like highlights).
//
// Dittytoy API: https://dittytoy.net/syntax

ditty.bpm = 56;

// --- THE FIELD ---
// Magnetic dipole — same as visual Study XX and audio Study I.
// Two poles: attractive (lower-left) and repulsive (upper-right).

function dipoleField(x, y) {
    const pa = { x: -35, y: 25,  strength:  1 };   // attractive pole
    const pb = { x:  35, y: -25, strength: -1 };   // repulsive pole

    const dxa = x - pa.x, dya = y - pa.y;
    const dxb = x - pb.x, dyb = y - pb.y;

    const ra = Math.max(5, Math.sqrt(dxa*dxa + dya*dya));
    const rb = Math.max(5, Math.sqrt(dxb*dxb + dyb*dyb));

    const fx = pa.strength * dxa / (ra*ra) + pb.strength * dxb / (rb*rb);
    const fy = pa.strength * dya / (ra*ra) + pb.strength * dyb / (rb*rb);

    return {
        angle: Math.atan2(fy, fx),
        magnitude: Math.sqrt(fx*fx + fy*fy),
        distFromFocal: ra  // distance from the attractive pole
    };
}

// --- SCALE ---
// G minor pentatonic — G minor is the "copper" key: warm but with depth.
// Three registers for three distance zones from the focal point.

const nearNotes = scale(g1, scales['minor_pentatonic'], 1);   // G1–G2, 5 notes (warm, low)
const midNotes  = scale(g2, scales['minor_pentatonic'], 2);   // G2–G4, 10 notes
const farNotes  = scale(g4, scales['minor_pentatonic'], 2);   // G4–G6, 10 notes (bright, high)

// --- HARMONIC PLAYBACK ---
// Near focal: fundamental + octave + fifth + double octave (rich, warm)
// Mid distance: fundamental + octave (moderate)
// Far from focal: pure sine (thin, bright)

function playRevealNote(freq, distance, pan, attack, release, duration, amp) {
    // Harmonic density based on distance (0 = at focal, 1 = far edge)
    const proximity = 1 - Math.min(1, distance / 100);

    // Fundamental always present
    sine.play(freq, {
        attack: attack,
        release: release,
        duration: duration,
        pan: pan,
        amp: amp
    });

    if (proximity > 0.3) {
        // Octave — enters at mid-proximity
        sine.play(freq * 2, {
            attack: attack * 0.7,
            release: release * 0.7,
            duration: duration,
            pan: pan,
            amp: amp * 0.30 * Math.min(1, (proximity - 0.3) / 0.7)
        });
    }

    if (proximity > 0.5) {
        // Fifth — enters at high proximity
        sine.play(freq * 1.5, {
            attack: attack * 0.5,
            release: release * 0.5,
            duration: duration,
            pan: pan,
            amp: amp * 0.18 * Math.min(1, (proximity - 0.5) / 0.5)
        });
    }

    if (proximity > 0.7) {
        // Double octave — only very near focal
        sine.play(freq * 4, {
            attack: attack * 0.4,
            release: release * 0.4,
            duration: duration,
            pan: pan,
            amp: amp * 0.10 * Math.min(1, (proximity - 0.7) / 0.3)
        });
    }
}

// --- MAPPING ---

function distanceToNotes(distance) {
    // Near focal (< 35 units) → low register
    // Mid (35-70) → mid register
    // Far (> 70) → high register
    if (distance < 35) return nearNotes;
    if (distance < 70) return midNotes;
    return farNotes;
}

function distanceToNote(distance, noteArray) {
    // Invert: close to focal = low notes (index 0), far = high notes
    const normalized = Math.min(1, distance / 100);
    const idx = Math.floor(normalized * noteArray.length);
    return noteArray[Math.max(0, Math.min(noteArray.length - 1, idx))];
}

function xToPan(x) {
    return Math.max(-1, Math.min(1, x / 100));
}

// --- VOICE 1: FOCAL TRAILS (close to the attractive pole) ---
// Dense, slow, rich harmonics. The "warm core" of the Copper Horizon.

loop(() => {
    for (let trail = 0; trail < 6; trail++) {
        // Start near the attractive pole
        let x = -35 + (Math.random() - 0.5) * 30;
        let y =  25 + (Math.random() - 0.5) * 30;
        const stepSize = 1.2;

        for (let i = 0; i < 16; i++) {
            const f = dipoleField(x, y);
            x += Math.cos(f.angle) * stepSize;
            y += Math.sin(f.angle) * stepSize;

            if (Math.abs(x) > 95 || Math.abs(y) > 95) break;

            const notes = distanceToNotes(f.distFromFocal);
            const note = distanceToNote(f.distFromFocal, notes);

            // Near focal: long sustain, rich harmonics
            playRevealNote(note, f.distFromFocal, xToPan(x),
                2.0, 4.0, 2.5, 0.09);

            sleep(1.2);
        }
    }
    // Long pause before this voice restarts — the focal zone is sparse
    sleep(30);
}, { name: 'focal-trails' });

// --- VOICE 2: MID-FIELD TRAILS ---
// Moderate density, medium harmonics. The copper-to-bronze gradient.

loop(() => {
    for (let trail = 0; trail < 4; trail++) {
        let x = -60 + Math.random() * 120;
        let y = -10 + Math.random() * 60;
        const stepSize = 2.0;

        for (let i = 0; i < 20; i++) {
            const f = dipoleField(x, y);
            x += Math.cos(f.angle) * stepSize;
            y += Math.sin(f.angle) * stepSize;

            if (Math.abs(x) > 95 || Math.abs(y) > 95) {
                x = -60 + Math.random() * 120;
                y = -10 + Math.random() * 60;
            }

            const notes = distanceToNotes(f.distFromFocal);
            const note = distanceToNote(f.distFromFocal, notes);

            playRevealNote(note, f.distFromFocal, xToPan(x),
                0.8, 2.0, 1.2, 0.07);

            sleep(1.0);
        }
    }
    sleep(20);
}, { name: 'mid-field-trails' });

// --- VOICE 3: PERIPHERAL TRAILS (far from focal) ---
// Fast, short, pure sine. The dark/muted edges of the palette.

loop(() => {
    for (let trail = 0; trail < 3; trail++) {
        // Start at edges
        let x = (Math.random() > 0.5 ? 1 : -1) * (70 + Math.random() * 25);
        let y = (Math.random() - 0.5) * 180;
        const stepSize = 3.0;

        for (let i = 0; i < 12; i++) {
            const f = dipoleField(x, y);
            x += Math.cos(f.angle) * stepSize;
            y += Math.sin(f.angle) * stepSize;

            if (Math.abs(x) > 95 || Math.abs(y) > 95) break;

            const notes = distanceToNotes(f.distFromFocal);
            const note = distanceToNote(f.distFromFocal, notes);

            // Far from focal: short plucks, pure tone (no harmonics — proximity too low)
            playRevealNote(note, f.distFromFocal, xToPan(x),
                0.15, 0.6, 0.4, 0.05);

            sleep(0.5);
        }
    }
    sleep(15);
}, { name: 'peripheral-trails' });

// --- VOICE 4: THE POLE (sustained focal tone) ---
// The attractive pole sustained as a deep pedal — the "copper core."
// Rich with harmonics. This is the brightest point in the Copper Horizon.

loop(() => {
    for (let i = 0; i < 12; i++) {
        // Full harmonic series at the focal point
        playRevealNote(g1, 0, -0.35,
            4.0, 8.0, 8.0, 0.08);

        sleep(8.0);
    }
}, { name: 'the-pole' });