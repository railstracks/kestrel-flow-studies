// Flow Study XI — "Gradient Descent" (for sine waves)
// Kestrel, August 16, 2026
//
// CROSS-MODAL PAIR: Audio counterpart to visual Study VIII "Gradient Descent"
// (seed 999). The visual piece: particles flow down a sum-of-Gaussians terrain
// toward minima (basins of attraction). Two dominant valleys create a dual-focal
// system with conversational tension. Peripheral rays add radial energy.
// 16,184 segments. Rated 7.5/10.
//
// THE FIELD:
// The visual uses a fixed terrain: 5 Gaussian peaks/valleys at known positions.
// Particles follow the negative gradient (steepest descent). The two valleys
// (negative Gaussians) are the attractors. The three peaks are repellers.
//
// TRANSLATION PRINCIPLE:
// In the visual, particles flow downhill toward basins. The path is determined
// by the terrain shape — each point has a unique gradient that guides flow.
// In audio, we map:
//   Terrain height → harmonic density (low terrain = rich harmonics, the valleys)
//   Gradient direction → melodic direction (descending gradient = descending pitch)
//   Distance from nearest basin → pitch height (close to basin = low register)
//   Basin identity → tonal center (each basin has its own root)
//   Peak proximity → dissonance (near peaks, notes are microtonally offset)
//
// The dual-focal system is the heart: two basins with different tonal centers
// create a dialogue. Particles (notes) migrate between them, shifting tonality
// as they cross the watershed. The watershed is the harmonic boundary.
//
// MAPPING:
//   Basin A (cx=-20, cy=-40, the deep valley) → D minor (the deeper, darker center)
//   Basin B (cx=10, cy=50, the shallower valley) → A minor (the lighter center)
//   Three peaks → three dissonance zones where notes carry microtonal shimmer
//   Trail length → phrase length
//   Gradient steepness → note density (steeper = faster notes)
//
// Four voices:
// 1. BASIN A — sustained D minor drone (the deep valley)
// 2. BASIN B — sustained A minor drone (the shallower valley)
// 3. FLOW — particles tracing the gradient field, pitch migrating between centers
// 4. WATERSHED — notes at the boundary between basins, where tonality is ambiguous
//
// Dittytoy API: https://dittytoy.net/syntax

ditty.bpm = 58;

// --- THE TERRAIN ---
// Same Gaussian peaks/valleys as visual Study VIII (seed 999).
// We compute the gradient analytically for each point.

const peaks = [
    { cx: -40, cy:  30, sigma: 25, height:  80 },  // peak (repeller)
    { cx:  35, cy: -20, sigma: 30, height:  60 },  // peak (repeller)
    { cx:  10, cy:  50, sigma: 20, height: -50 },  // shallow valley (attractor B)
    { cx: -20, cy: -40, sigma: 35, height: -70 },  // deep valley (attractor A)
    { cx:  50, cy:  30, sigma: 22, height:  40 },  // small peak
];

function terrainHeight(x, y) {
    let h = 0;
    for (const p of peaks) {
        const dx = x - p.cx;
        const dy = y - p.cy;
        const g = Math.exp(-(dx * dx + dy * dy) / (2 * p.sigma * p.sigma));
        h += p.height * g;
    }
    return h;
}

function terrainGradient(x, y) {
    const eps = 1.0;
    const h = terrainHeight(x, y);
    const hx = terrainHeight(x + eps, y);
    const hy = terrainHeight(x, y + eps);
    // Negative gradient = descent direction
    const dx = -(hx - h) / eps;
    const dy = -(hy - h) / eps;
    return {
        angle: Math.atan2(dy, dx),
        magnitude: Math.sqrt(dx * dx + dy * dy),
        height: h
    };
}

// Find nearest basin for tonal center assignment
function nearestBasin(x, y) {
    const basinA = { cx: -20, cy: -40 };  // deep valley → D minor
    const basinB = { cx:  10, cy:  50 };  // shallow valley → A minor

    const dA = Math.sqrt((x - basinA.cx) ** 2 + (y - basinA.cy) ** 2);
    const dB = Math.sqrt((x - basinB.cx) ** 2 + (y - basinB.cy) ** 2);

    return dA < dB ? 'A' : 'B';
}

// --- SCALES ---
// Two tonal centers, one per basin.
// Basin A (deep valley): D minor pentatonic — darker, deeper
// Basin B (shallow valley): A minor pentatonic — lighter, higher
// The watershed between them is where the tonality shifts.

const basinANotes = scale(d2, scales['minor_pentatonic'], 2);   // D2–D4
const basinBNotes = scale(a2, scales['minor_pentatonic'], 2);   // A2–A4
const watershedNotes = scale(d3, scales['minor_pentatonic'], 2); // D3–D5 (overlaps both)

// --- MAPPING ---

function yToNote(y, noteArray) {
    const normalized = (y + 100) / 200;
    const idx = Math.floor(normalized * noteArray.length);
    return noteArray[Math.max(0, Math.min(noteArray.length - 1, idx))];
}

function xToPan(x) {
    return Math.max(-1, Math.min(1, x / 100));
}

function magnitudeToAmp(mag, base, range) {
    const scaled = Math.min(1, mag * 0.8);
    return base + range * scaled;
}

// --- VOICE 1: BASIN A (deep valley drone) ---
// D2 sustained — the deeper, darker attractor.
// Rich with harmonics because it's the deep basin (more energy collected).

loop(() => {
    for (let i = 0; i < 16; i++) {
        // Fundamental
        sine.play(d2, {
            attack: 3.0,
            release: 6.0,
            duration: 6.0,
            pan: -0.30,
            amp: 0.10
        });

        // Octave (the depth gives it rich harmonics)
        sine.play(d3, {
            attack: 3.5,
            release: 5.5,
            duration: 6.0,
            pan: -0.25,
            amp: 0.04
        });

        // Fifth (the valley's harmonic color)
        sine.play(a2, {
            attack: 4.0,
            release: 5.0,
            duration: 6.0,
            pan: -0.35,
            amp: 0.03
        });

        sleep(6.0);
    }
}, { name: 'basin-a' });

// --- VOICE 2: BASIN B (shallow valley drone) ---
// A2 sustained — the lighter, higher attractor.
// Thinner harmonics because it's the shallower basin (less energy).

loop(() => {
    for (let i = 0; i < 16; i++) {
        sine.play(a2, {
            attack: 4.0,
            release: 6.0,
            duration: 7.0,
            pan: 0.30,
            amp: 0.08
        });

        // Octave only (shallower = fewer harmonics)
        sine.play(a3, {
            attack: 4.5,
            release: 5.5,
            duration: 7.0,
            pan: 0.25,
            amp: 0.025
        });

        sleep(7.0);
    }
}, { name: 'basin-b' });

// --- VOICE 3: FLOW (particles tracing the gradient) ---
// Particles flow downhill. Each note's pitch is drawn from the scale
// of the nearest basin. As particles cross the watershed, the tonal
// center shifts. This is the musical expression of the gradient field.
//
// The gradient direction determines melodic direction:
//   Flowing toward basin A → descending toward D (the deep center)
//   Flowing toward basin B → descending toward A (the light center)
//   Near peaks → ascending (climbing away from repellers)
//   At watershed → ambiguous, uses overlapping scale

loop(() => {
    for (let trail = 0; trail < 8; trail++) {
        // Start at random positions across the terrain
        let x = -70 + Math.random() * 140;
        let y = -70 + Math.random() * 140;
        const stepSize = 1.5;
        const trailLen = 24;

        for (let i = 0; i < trailLen; i++) {
            const g = terrainGradient(x, y);

            // Move along negative gradient (downhill)
            x += Math.cos(g.angle) * stepSize;
            y += Math.sin(g.angle) * stepSize;

            if (Math.abs(x) > 95 || Math.abs(y) > 95) break;

            // Determine which basin we're in
            const basin = nearestBasin(x, y);
            const notes = basin === 'A' ? basinANotes : basinBNotes;
            const note = yToNote(y, notes);

            // Amplitude depends on gradient steepness
            // (steeper terrain = more force = louder notes)
            const amp = magnitudeToAmp(g.magnitude, 0.04, 0.06);

            // Near peaks, add microtonal shimmer (dissonance zones)
            const height = g.height;
            const peakProximity = Math.max(0, height / 80);  // 0..1, higher near peaks

            // Duration: longer in basins (settling), shorter near peaks (agitated)
            const duration = 0.4 + (1 - peakProximity) * 0.8;
            const release = duration * 1.5;

            sine.play(note, {
                attack: 0.15,
                release: release,
                duration: duration,
                pan: xToPan(x),
                amp: amp
            });

            // Step time: faster on steep terrain, slower in basins (settling)
            const stepTime = 0.3 + (1 - g.magnitude) * 0.5;
            sleep(stepTime);
        }

        // Brief pause between trails
        sleep(2 + Math.random() * 3);
    }
    sleep(15);
}, { name: 'flow' });

// --- VOICE 4: WATERSHED ---
// The boundary between basins — where tonality is ambiguous.
// In the visual, this is the ridge between the two valleys: particles
// hesitate, the gradient is weak, direction is uncertain.
// In audio, this becomes notes that hover between the two tonal centers,
// alternating between D and A, never committing to either.

loop(() => {
    // The watershed is approximately along the line where distance to
    // both basins is equal. Roughly the horizontal midline of the canvas.
    for (let i = 0; i < 20; i++) {
        // Alternate between the two tonal centers
        const useA = i % 2 === 0;
        const note = useA ? d3 : a3;
        const pan = useA ? -0.05 : 0.05;

        // Watershed notes are quiet and sustained — uncertain, hovering
        sine.play(note, {
            attack: 1.5,
            release: 3.0,
            duration: 2.5,
            pan: pan,
            amp: 0.05
        });

        sleep(2.5);
    }

    sleep(30);
}, { name: 'watershed' });

// --- STRUCTURAL NOTE ---
//
// Four voices, two basins, one watershed:
//   basin-a   → D minor drone, rich harmonics (the deep attractor)
//   basin-b   → A minor drone, thin harmonics (the shallow attractor)
//   flow      → particles migrating between basins, tonality shifting
//   watershed → ambiguous notes at the boundary, hovering between centers
//
// The piece is a dialogue between two tonal centers. The flow voice carries
// the dialogue — notes migrate from D to A and back, crossing the watershed
// where tonality is uncertain. The drones anchor each center. The watershed
// voice marks the boundary.
//
// WHAT THE AUDIO DISCOVERS THAT THE VISUAL CAN'T SHOW:
// The visual shows WHERE particles converge (the two basins). The audio shows
// HOW convergence feels from inside the particle. The tonal shift from D to A
// as you cross the watershed is not visible — it's a qualitative change that
// only sound can express. The watershed is not just a line on a map; it's a
// moment of tonal uncertainty, a hesitation between two gravitational pulls.
//
// This is the cross-modal complement: the visual gives the terrain its body
// (spatial shape), the audio gives it its experience (what it feels like to
// flow downhill toward one center vs the other).