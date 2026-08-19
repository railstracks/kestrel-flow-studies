// Flow Study IV — "Convergence+Swirl" (for harmonic sine waves)
// Kestrel, August 2026
//
// First study with layered harmonics — moving beyond pure sine.
// Each note is a fundamental + two harmonics (octave and perfect fifth).
// The harmonics are very quiet — they add warmth like overtones in a bell,
// not like a rich synth pad. The minimalism holds; the timbre deepens.
//
// Visual counterpart: Study V "Reveal" — convergence+swirl field with
// Copper Horizon palette. The color study showed that reinforcing convergence
// through multiple channels (density + color + stroke) deepens the effect.
// This study tests the audio equivalent: reinforcing field position through
// fundamental + harmonic density.
//
// Field: single convergence focus with strong swirl — a spiral galaxy.
// The spiral creates the most dramatic convergence-to-orbit ratio:
// particles are pulled inward but deflected, creating long spiral paths.
//
// Dittytoy API: https://dittytoy.net/syntax

ditty.bpm = 52;

// --- THE FIELD ---
// Single focus at origin, strong pull + strong swirl = spiral galaxy.

const focus = { x: 0, y: 0 };
const pull = 1.5;
const swirl = 0.9;

function spiralField(x, y) {
    const dx = focus.x - x;
    const dy = focus.y - y;
    const r = Math.sqrt(dx * dx + dy * dy + 1);
    return {
        angle: Math.atan2(
            (dy / r) * pull + (dx / r) * swirl,
            (dx / r) * pull + (-dy / r) * swirl
        ),
        magnitude: Math.sqrt(
            ((dx / r) * pull + (-dy / r) * swirl) ** 2 +
            ((dy / r) * pull + (dx / r) * swirl) ** 2
        ),
        radius: r
    };
}

// --- SCALE ---
// D minor pentatonic across 3 octaves.
// D minor because it's the "spiral key" — every note in D minor pentatonic
// is also in F major pentatonic (relative major). The ambiguity between
// minor and major mirrors the spiral's ambiguity between convergence and orbit.

const melodicNotes = scale(d2, scales['minor_pentatonic'], 3);  // D2–D5, 15 notes
const bassNote = d1;

// --- HARMONIC PLAYBACK ---
// Play a note with two quiet harmonics.
// Fundamental at full amplitude, octave at 0.25, fifth at 0.12.
// This creates a bell-like timbre — pure but with a halo of overtones.

function playHarmonic(note, options) {
    const octave = note * 2;    // one octave up
    const fifth  = note * 1.5;  // perfect fifth above

    sine.play(note, {
        attack: options.attack,
        release: options.release,
        duration: options.duration,
        pan: options.pan,
        amp: options.amp
    });

    sine.play(octave, {
        attack: options.attack * 0.7,
        release: options.release * 0.7,
        duration: options.duration,
        pan: options.pan,
        amp: options.amp * 0.22
    });

    sine.play(fifth, {
        attack: options.attack * 0.5,
        release: options.release * 0.5,
        duration: options.duration,
        pan: options.pan,
        amp: options.amp * 0.10
    });
}

// --- MAPPING ---

function radiusToNote(r, noteArray) {
    // Near focus (small r) = low notes. Far from focus (large r) = high notes.
    // This is the INVERSE of Studies I-III, where y position determined pitch.
    // Here, distance from the focal point IS the musical axis.
    // The spiral journey becomes a descent: particles start high,
    // spiral inward, and sink into the bass register as they approach the eye.
    const normalized = Math.min(1, r / 100);
    const idx = Math.floor((1 - normalized) * noteArray.length);
    return noteArray[Math.max(0, Math.min(noteArray.length - 1, idx))];
}

function xToPan(x) {
    return Math.max(-1, Math.min(1, x / 100));
}

// --- VOICE 1: SPIRAL TRAILS ---
// Particles trace the spiral field. Their pitch descends as they spiral inward —
// the convergence is experienced as a musical descent.
// The harmonic timbre makes the descent feel weighted, organic — like
// falling water or a stone sinking through clear water.

loop(() => {
    // Start at edge of canvas
    const angle0 = Math.random() * Math.PI * 2;
    let x = Math.cos(angle0) * 80;
    let y = Math.sin(angle0) * 80;
    const stepSize = 1.5;

    for (let i = 0; i < 48; i++) {
        const f = spiralField(x, y);
        x += Math.cos(f.angle) * stepSize;
        y += Math.sin(f.angle) * stepSize;

        // Don't respawn — let particles converge to center and stay
        // (the spiral naturally brings them to the eye)
        if (f.radius < 5) break;  // arrived at the eye

        const note = radiusToNote(f.radius, melodicNotes);
        const amp = 0.06 + (1 - Math.min(1, f.radius / 100)) * 0.14;

        // Envelope: longer as particles approach the center
        // (the "arrival" is slow and sustained)
        const convergence = 1 - Math.min(1, f.radius / 80);
        const attack = 0.3 + convergence * 1.5;
        const release = 1.0 + convergence * 3.0;

        playHarmonic(note, {
            attack: attack,
            release: release,
            duration: 1.0,
            pan: xToPan(x),
            amp: amp
        });

        sleep(1.0);
    }
}, { name: 'spiral-trails' });

// --- VOICE 2: THE EYE ---
// The focal point sustained as a deep, slow pedal tone.
// Unlike Studies I-III where the focal voice alternated between poles,
// here there is only one focus. The eye is a single, unwavering D1
// that everything else spirals toward.
//
// The harmonic layering makes this voice feel like a didgeridoo or
// a Tibetan singing bowl — a fundamental so deep it's more felt than heard.

loop(() => {
    for (let i = 0; i < 20; i++) {
        playHarmonic(bassNote, {
            attack: 5.0,
            release: 8.0,
            duration: 10.0,
            pan: 0,
            amp: 0.09
        });

        sleep(10.0);
    }
}, { name: 'the-eye' });
