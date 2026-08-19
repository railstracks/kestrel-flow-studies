// ============================================================
// STUDY XII — "Magnetic Dendrite" (for sine waves)
// Cross-modal pair: audio counterpart to visual Study XIII
// "Magnetic Dendrite" (seed 31415, 8/10)
//
// A neuron whose dendrites follow magnetic dipole field lines.
// Combines recursive dendritic branching (Study VIII Neuron)
// with dipole field navigation (Study I Magnetic).
//
// The translation: dendrites become cascading note sequences,
// the magnetic field bends their pitch trajectories,
// the soma is a sustained drone at the center.
//
// Field: Magnetic dipole — attractive pole at (-35, 0),
//        repulsive pole at (+35, 0). Dendrites curve along
//        field lines toward the attractive pole.
//
// Key innovation: field-bent recursive branching.
// Each note spawns two children at perfect-fifth ratios
// (as in Study VIII), but their pitch trajectories curve
// toward the attractive pole's tonal center. The branching
// is not free — it follows the field. This is the structural
// difference between a neuron and a magnetic dendrite.
//
// Scale: B minor pentatonic — "the key of attraction.
//        Dark enough for the pull, bright enough for the branching."
// ============================================================

import { sine, scales, scale, ditty } from 'dittytoy'

ditty.bpm = 60

// === Scale ===
const BminPent = scale(b0, scales['minor_pentatonic'])
const FSharpMinPent = scale(fSharp0, scales['minor_pentatonic']) // relative major

// === Field parameters ===
const poleX = -35, poleY = 0
const poleX2 = 35, poleY2 = 0
const fieldStrength = 600

// === Magnetic dipole field ===
function magneticDipole(x, y) {
    const dx1 = x - poleX, dy1 = y - poleY
    const r1sq = dx1 * dx1 + dy1 * dy1 + 1
    const r1 = Math.sqrt(r1sq)

    const dx2 = x - poleX2, dy2 = y - poleY2
    const r2sq = dx2 * dx2 + dy2 * dy2 + 1
    const r2 = Math.sqrt(r2sq)

    // Attractive pole: pull toward it
    const f1x = -fieldStrength * dx1 / (r1sq * r1)
    const f1y = -fieldStrength * dy1 / (r1sq * r1)

    // Repulsive pole: push away (0.7x strength)
    const f2x = fieldStrength * 0.7 * dx2 / (r2sq * r2)
    const f2y = fieldStrength * 0.7 * dy2 / (r2sq * r2)

    return { fx: f1x + f2x, fy: f1y + f2y }
}

// === Map spatial position to pitch ===
// Y position → pitch in B minor pentatonic
// Near attractive pole (left) → lower register (the pull downward)
// Near repulsive pole (right) → higher register (the push upward)
function posToNote(x, y, octaveRange = 3) {
    // Distance from attractive pole determines tonal gravity
    const dx = x - poleX, dy = y - poleY
    const distFromAttract = Math.sqrt(dx * dx + dy * dy)

    // Y maps to scale degree
    const normY = (y + 100) / 200 // 0 to 1
    const noteIdx = Math.floor(normY * BminPent.length * octaveRange)
    const note = BminPent[noteIdx % BminPent.length]

    // X distance from attractive pole bends pitch toward B (the drone)
    // Near the pole: notes gravitate toward B0/B1
    // Far from pole: notes stay at their Y-mapped pitch
    const gravity = Math.max(0, 1 - distFromAttract / 80)
    const bendFactor = gravity * 0.6 // 60% bend at max proximity

    // Bend toward B by mixing in the drone frequency
    return {
        freq: note * (1 - bendFactor) + b0 * Math.pow(2, Math.floor(noteIdx / BminPent.length)) * bendFactor,
        gravity: gravity
    }
}

// === Harmonic timbre (near soma = rich, far = pure) ===
function harmonicAmp(grav, baseAmp) {
    return {
        fundamental: baseAmp,
        octave: baseAmp * 0.22 * (0.3 + grav * 0.7),
        fifth: baseAmp * 0.10 * (0.2 + grav * 0.8),
    }
}

// === Recursive dendritic voice ===
// Each "dendrite" is a cascade of notes from soma outward,
// following the magnetic field. Branching creates polyphony.
function dendriteVoice(branchAngle, speedFactor, register, name) {
    const notes = []
    const maxDepth = 7
    const branchLength = 20

    function branch(x, y, depth, angle, amp) {
        if (depth >= maxDepth || amp < 0.02) return

        // Follow the field for a few steps
        for (let step = 0; step < branchLength; step++) {
            const field = magneticDipole(x, y)
            const fmag = Math.sqrt(field.fx * field.fx + field.fy * field.fy) + 0.001

            // Field bends the growth direction
            const fieldDir = Math.atan2(field.fy, field.fx)
            angle = angle * (1 - 0.4) + fieldDir * 0.4 // 40% field influence

            x += Math.cos(angle) * speedFactor * 1.2
            y += Math.sin(angle) * speedFactor * 1.2

            // Out of bounds
            if (Math.abs(x) > 95 || Math.abs(y) > 95) return

            // Emit a note every 3 steps (sparse, dendritic)
            if (step % 3 === 0) {
                const noteInfo = posToNote(x, y, register)
                const harm = harmonicAmp(noteInfo.gravity, amp)
                const tick = depth * 8 + step * 0.5

                // Fundamental
                notes.push({
                    freq: noteInfo.freq,
                    tick: tick,
                    duration: 1.5 + noteInfo.gravity * 3,
                    amp: harm.fundamental,
                    pan: Math.max(-1, Math.min(1, x / 100)),
                    attack: 0.3 + (1 - noteInfo.gravity) * 0.5,
                    release: 1.0 + noteInfo.gravity * 2.0
                })

                // Octave (only near soma — convergence = rich timbre)
                if (noteInfo.gravity > 0.3) {
                    notes.push({
                        freq: noteInfo.freq * 2,
                        tick: tick + 0.1,
                        duration: 1.0 + noteInfo.gravity * 2,
                        amp: harm.octave,
                        pan: Math.max(-1, Math.min(1, x / 100)),
                        attack: 0.4,
                        release: 0.8 + noteInfo.gravity * 1.5
                    })
                }

                // Fifth (only very near soma — the core glow)
                if (noteInfo.gravity > 0.5) {
                    notes.push({
                        freq: noteInfo.freq * 1.5,
                        tick: tick + 0.2,
                        duration: 0.8 + noteInfo.gravity * 1.5,
                        amp: harm.fifth,
                        pan: Math.max(-1, Math.min(1, x / 100)),
                        attack: 0.5,
                        release: 0.6 + noteInfo.gravity
                    })
                }
            }
        }

        // Branch into two children
        const childAmp = amp * 0.68
        branch(x, y, depth + 1, angle + branchAngle, childAmp)
        branch(x, y, depth + 1, angle - branchAngle, childAmp)
    }

    // Start from soma (origin) with 12 primary dendrites at 30° intervals
    for (let i = 0; i < 12; i++) {
        const startAngle = (i / 12) * Math.PI * 2
        branch(0, 0, 0, startAngle, 0.15)
    }

    // Sort by tick for timeline
    notes.sort((a, b) => a.tick - b.tick)

    // Play the notes
    const synth = sine

    for (const n of notes) {
        synth.play(n.freq, {
            tick: n.tick,
            duration: n.duration,
            amp: n.amp,
            pan: n.pan,
            attack: n.attack,
            release: n.release
        })
    }

    console.log(`${name}: ${notes.length} notes generated`)
}

// === Voice 1: Dendritic cascade (slow, lower register) ===
loop(() => {
    dendriteVoice(0.55, 1.0, 3, 'dendrite-cascade')
}, { name: 'dendrite-cascade', duration: 120 })

// === Voice 2: The soma drone (sustained B with harmonics) ===
loop(() => {
    // The soma: a sustained B1 with rich harmonics
    // This is the center the dendrites orbit
    sine.play(b1, { tick: 0, duration: 120, amp: 0.12, attack: 3, release: 8, pan: 0 })
    sine.play(b2, { tick: 0, duration: 120, amp: 0.06, attack: 4, release: 8, pan: 0 })
    sine.play(fSharp2, { tick: 0, duration: 120, amp: 0.03, attack: 5, release: 10, pan: 0 })

    // Slow pulse — the soma "breathes"
    for (let t = 0; t < 120; t += 8) {
        const pulse = 0.08 + 0.04 * Math.sin(t * Math.PI / 16)
        sine.play(b1, { tick: t, duration: 6, amp: pulse, attack: 2, release: 3, pan: 0 })
    }
}, { name: 'soma-drone', duration: 120 })

// === Voice 3: Field whisper (high, quiet, field-shaped) ===
loop(() => {
    // Particles tracing the field lines directly — not branching,
    // just following. The field made audible as shape.
    for (let i = 0; i < 30; i++) {
        // Start from random positions near the repulsive pole
        const startX = 30 + (Math.random() - 0.5) * 40
        const startY = (Math.random() - 0.5) * 120

        let x = startX, y = startY
        let tick = i * 4 + Math.random() * 2

        for (let step = 0; step < 40; step++) {
            const field = magneticDipole(x, y)
            const fmag = Math.sqrt(field.fx * field.fx + field.fy * field.fy) + 0.001

            x += field.fx / fmag * 2.5
            y += field.fy / fmag * 2.5

            if (Math.abs(x) > 95 || Math.abs(y) > 95) break

            // Emit a quiet high note tracing the field line
            if (step % 4 === 0) {
                const normY = (y + 100) / 200
                const noteIdx = Math.floor(normY * BminPent.length * 4)
                const freq = BminPent[noteIdx % BminPent.length] * 2 // high register

                sine.play(freq, {
                    tick: tick + step * 0.3,
                    duration: 0.4,
                    amp: 0.02 + 0.03 * (1 - step / 40),
                    pan: Math.max(-1, Math.min(1, x / 100)),
                    attack: 0.1,
                    release: 0.3
                })
            }
        }
    }
}, { name: 'field-whisper', duration: 120 })