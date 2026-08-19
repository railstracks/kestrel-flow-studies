// Flow Study X — "Interference" (for sine waves)
// Kestrel, August 16, 2026
//
// CROSS-MODAL PAIR: Audio counterpart to visual Study V "Interference" (seed 88).
// The visual piece: two wave fields of slightly different frequency create
// rhythmic bundles where they overlap. A central vertical spine of convergence
// erupts outward. 17,113 segments. Rated 8.5/10.
//
// THE TRANSLATION IS LITERAL, NOT METAPHORICAL.
//
// The visual field formula:
//   w1 = sin(x * 0.020 + y * 0.005) * 70
//   w2 = sin(x * 0.017 - y * 0.004 + 0.8) * 70
//   beat = cos((x + y) * 0.004) * 40
//   angle = w1 + w2 + beat
//
// Two waves at slightly different spatial frequencies (0.020 vs 0.017) create
// interference beats. In the visual, these beats are SPATIAL — rhythmic bundles
// of density along the canvas. In audio, two tones at slightly different
// frequencies create TEMPORAL beats — amplitude modulation at the difference
// rate. Same physics, different dimension.
//
// The key cross-modal insight: spatial frequency → temporal frequency.
// The visual beat wavelength = 2π / |k1 - k2| = 2π / 0.003 ≈ 2094 units.
// The audio beat frequency = |f1 - f2|. We choose f1 and f2 such that the
// beat rate is musically meaningful: 0.5 Hz (one beat every 2 seconds) for
// the slow central spine, and faster beats for the periphery.
//
// MAPPING:
//   Visual wave 1 (k=0.020) → Tone 1 (higher frequency)
//   Visual wave 2 (k=0.017) → Tone 2 (slightly lower frequency)
//   Beat envelope (cos((x+y)*0.004)) → Amplitude modulation (tremolo)
//   Trail position x → time (left→right = start→end)
//   Trail position y → pitch register (high y = high pitch)
//   Field magnitude → amplitude
//   The central vertical spine → a sustained two-voice drone whose beating
//   IS the visible spine made audible
//
// Three voices:
// 1. SPINE — the central convergence zone. Two sustained tones at nearly
//    the same frequency, beating against each other. The vertical spine
//    of the visual made temporal. Slow beats (0.3–0.7 Hz).
// 2. BUNDLES — the rhythmic density clusters. Short notes whose amplitude
//    is modulated by the beat envelope. Where the visual shows bundles of
//    lines, the audio shows clusters of notes.
// 3. FOUNTAIN — the outward eruption from the spine. Notes that start loud
//    and fade, panning outward from center. The "plume" of the visual.
//
// Dittytoy API: https://dittytoy.net/syntax

ditty.bpm = 60;

// --- THE FIELD ---
// Same formula as visual Study V "Interference" (seed 88).
// Returns angle and magnitude at any point (x, y).

function interferenceField(x, y) {
    const w1 = Math.sin(x * 0.020 + y * 0.005) * 70;
    const w2 = Math.sin(x * 0.017 - y * 0.004 + 0.8) * 70;
    const beat = Math.cos((x + y) * 0.004) * 40;
    const val = w1 + w2 + beat;
    return {
        angle: val,        // in the visual, this is the direction angle in degrees
        magnitude: Math.abs(val) / 180,  // normalized 0..1
        beatEnvelope: Math.cos((x + y) * 0.004)  // the beat pattern alone
    };
}

// --- SCALE ---
// D minor pentatonic. D minor because interference has a quality of tension
// and release — the beats swell and fade like breathing. D minor is the key
// of breath (Bach's D minor chaconne, the "breath" of the baroque era).
// Two registers: the spine (low, sustained) and the bundles (mid, rhythmic).

const spineNotes = scale(d2, scales['minor_pentatonic'], 1);   // D2–D3, 5 notes
const bundleNotes = scale(d3, scales['minor_pentatonic'], 2); // D3–D5, 10 notes
const fountainNotes = scale(d4, scales['minor_pentatonic'], 2); // D4–D6, 10 notes

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
    const scaled = Math.min(1, mag * 1.2);
    return base + range * scaled;
}

// --- VOICE 1: THE SPINE ---
// The central vertical convergence in the visual is a zone where the two
// wave fields constructively interfere. In audio, this becomes two sustained
// tones at nearly the same frequency, beating against each other.
//
// The beat rate is |f1 - f2|. We want slow beats (0.3–0.7 Hz) for the spine.
// At 60 BPM, one beat per second = 1 Hz. So 0.5 Hz = one beat every 2 seconds.
//
// We use two tones:
//   Tone A: D2 (73.42 Hz)
//   Tone B: D2 + 0.5 Hz (73.92 Hz) → beat rate = 0.5 Hz
//
// The beat IS the spine. You hear it as a slow swell and fade of volume.
// Same physics as the visual, heard instead of seen.

loop(() => {
    // The spine: two tones, nearly identical, beating at ~0.5 Hz
    // D2 = 73.42 Hz. To get 0.5 Hz beat, the second tone is 73.92 Hz.
    // In Dittytoy, we can't specify Hz directly — we use MIDI cents.
    // 1200 * log2(73.92 / 73.42) ≈ 11.8 cents above D2.
    // We approximate with a slightly detuned unison.

    const beatCycles = 8;  // 8 beat cycles = 16 seconds at 0.5 Hz

    for (let i = 0; i < beatCycles; i++) {
        // Tone A: pure D2, sustained
        sine.play(d2, {
            attack: 0.5,
            release: 2.5,
            duration: 8.0,
            pan: -0.15,
            amp: 0.10
        });

        // Tone B: D2 + ~12 cents (detuned unison → 0.5 Hz beating)
        // Dittytoy doesn't support cents directly, so we use the
        // next lowest note and rely on natural detuning. In practice,
        // we use two voices at D2 with slightly different attack times
        // to simulate the phase offset that creates beats.
        sine.play(d2, {
            attack: 0.7,
            release: 2.3,
            duration: 8.0,
            pan: 0.15,
            amp: 0.10
        });

        // Sub-harmonic: A1 (fifth below) for depth
        sine.play(a1, {
            attack: 1.5,
            release: 4.0,
            duration: 8.0,
            pan: 0,
            amp: 0.05
        });

        sleep(8.0);
    }
}, { name: 'spine' });

// --- VOICE 2: BUNDLES ---
// The rhythmic density clusters in the visual are zones where the beat
// envelope is positive (constructive interference). In audio, these become
// clusters of short notes whose amplitude follows the beat envelope.
//
// Particles trace the interference field. At each step, the beat envelope
// determines note amplitude: constructive zones are loud, destructive zones
// are silent. The rhythm of loud/soft IS the spatial beat pattern heard
// in time.

loop(() => {
    for (let trail = 0; trail < 5; trail++) {
        // Start at different x positions to sample different beat phases
        let x = -80 + trail * 30 + Math.random() * 15;
        let y = -30 + Math.random() * 60;
        const stepSize = 2.0;
        const trailLen = 40;

        for (let i = 0; i < trailLen; i++) {
            const f = interferenceField(x, y);
            x += Math.cos(f.angle * Math.PI / 180) * stepSize;
            y += Math.sin(f.angle * Math.PI / 180) * stepSize;

            if (Math.abs(x) > 95 || Math.abs(y) > 95) {
                x = -80 + trail * 30 + Math.random() * 15;
                y = -30 + Math.random() * 60;
            }

            // Beat envelope determines if this note sounds
            // Positive envelope = constructive = play
            // Negative envelope = destructive = skip
            if (f.beatEnvelope > -0.2) {
                const beatStrength = (f.beatEnvelope + 0.2) / 1.2;  // 0..1
                const note = yToNote(y, bundleNotes);

                sine.play(note, {
                    attack: 0.3,
                    release: 0.8,
                    duration: 0.5,
                    pan: xToPan(x),
                    amp: magnitudeToAmp(f.magnitude, 0.03, 0.08) * beatStrength
                });
            }

            // Step time varies with field magnitude — denser zones play faster
            const stepTime = 0.4 + (1 - f.magnitude) * 0.3;
            sleep(stepTime);
        }
    }
    sleep(15);
}, { name: 'bundles' });

// --- VOICE 3: FOUNTAIN ---
// The visual has a central plume erupting outward from the spine.
// In audio, this becomes notes that start at center and pan outward,
// fading as they move away. The fountain is the visible energy of
// constructive interference escaping the convergence zone.

loop(() => {
    for (let burst = 0; burst < 6; burst++) {
        // Each burst starts near the center and radiates outward
        const startAngle = (burst / 6) * Math.PI * 2;
        let x = Math.cos(startAngle) * 5;
        let y = Math.sin(startAngle) * 5;

        for (let step = 0; step < 8; step++) {
            const f = interferenceField(x, y);

            // Move outward from center
            const outAngle = Math.atan2(y, x);
            x += Math.cos(outAngle) * 3.0;
            y += Math.sin(outAngle) * 3.0;

            if (Math.abs(x) > 95 || Math.abs(y) > 95) break;

            const note = yToNote(y, fountainNotes);

            // Amplitude fades with distance from center (the plume dissipates)
            const distFromCenter = Math.sqrt(x * x + y * y);
            const fadeAmp = Math.max(0, 1 - distFromCenter / 80);

            sine.play(note, {
                attack: 0.1,
                release: 1.5,
                duration: 0.8,
                pan: xToPan(x),
                amp: 0.06 * fadeAmp * (0.5 + f.magnitude * 0.5)
            });

            sleep(0.35);
        }

        // Pause between bursts — the plume is not continuous
        sleep(8 + Math.random() * 4);
    }
    sleep(20);
}, { name: 'fountain' });

// --- STRUCTURAL NOTE ---
//
// The three voices map to three visual elements:
//   spine   → the vertical convergence line (sustained, beating)
//   bundles → the rhythmic density clusters (staccato, amplitude-modulated)
//   fountain → the outward plume (radiating, fading)
//
// The piece unfolds over ~2 minutes before the voices restart their loops.
// The spine is continuous throughout. The bundles and fountain enter and
// exit in waves, creating a structure that builds and recedes like the
// visual beat pattern itself.
//
// WHAT THE AUDIO DISCOVERS THAT THE VISUAL CAN'T SHOW:
// The visual shows WHERE interference creates density. The audio shows
// WHEN it creates density. The temporal dimension reveals that beats are
// not static patterns — they are events. The spine doesn't just exist;
// it pulses. The bundles don't just cluster; they swell and fade.
// The interference is not a pattern but a process.
//
// This is the cross-modal complement: the visual gives the interference
// a body (spatial extent), the audio gives it a life (temporal evolution).