// ============================================================
// STUDY XIII — "Synaptic Field" (for sine waves)
// Cross-modal pair: audio counterpart to visual Study XVI
// "Synaptic Field" (seed 818, 9/10) — gallery-ready
//
// Two focal points pulling dendrites toward each other.
// The Synapse concept as a field problem: not one neuron
// reaching toward another, but a shared field that both
// orbit. The relationship IS the structure.
//
// Field: Dual convergence — two foci at (-28, 0) and (+28, 0),
//        each with pull=0.4 and opposite swirl (±0.15).
//        Dendrites scattered across the canvas, each following
//        the combined field. The zone between the foci is
//        where the fields interact — the synapse.
//
// Key innovation: the synapse as a shared tonal space.
// Focus A → D minor (dark, deep). Focus B → A minor (bright, shallow).
// Between them: a zone where both scales overlap, where tonality
// is ambiguous — neither D nor A, both D and A. The synapse is
// not a location but a harmonic state of uncertainty.
//
// This extends Study XI (Gradient Descent) which found the
// watershed as a musical event. Here, the "watershed" is not
// between two basins but between two living systems — the
// space where two neural fields reach toward each other.
//
// Scale: D minor pentatonic (focus A) + A minor pentatonic (focus B)
//        The overlap notes (D, E, A) form the synaptic scale.
// ============================================================

import { sine, scales, scale, ditty } from 'dittytoy'

ditty.bpm = 60

// === Scales ===
const DminPent = scale(d0, scales['minor_pentatonic'])
const AminPent = scale(a0, scales['minor_pentatonic'])

// Synaptic scale: notes shared between D min pent and A min pent
// D minor pent: D, F, G, A, C
// A minor pent: A, C, D, E, G
// Shared: D, G, A, C — the synaptic notes
const synapticNotes = [d0, g0, a0, c1]

// === Field parameters ===
const f1x = -28, f1y = 0
const f2x = 28, f2y = 0
const pull = 0.4
const swirl = 0.15

// === Dual convergence field ===
function convergenceField(x, y, focusX, focusY, p, s) {
    const dx = focusX - x, dy = focusY - y
    const r = Math.sqrt(dx * dx + dy * dy + 1)
    return {
        fx: (dx / r) * p + (-dy / r) * s,
        fy: (dy / r) * p + (dx / r) * s
    }
}

function dualConvergence(x, y) {
    const f1 = convergenceField(x, y, f1x, f1y, pull, swirl)
    const f2 = convergenceField(x, y, f2x, f2y, pull, -swirl)
    return { fx: (f1.fx + f2.fx) * 0.5, fy: (f1.fy + f2.fy) * 0.5 }
}

// === Distance to each focus ===
function distToFoci(x, y) {
    const d1 = Math.sqrt((x - f1x) ** 2 + (y - f1y) ** 2)
    const d2 = Math.sqrt((x - f2x) ** 2 + (y - f2y) ** 2)
    return { d1, d2, total: d1 + d2 }
}

// === Which focus dominates? ===
function dominantFocus(x, y) {
    const { d1, d2 } = distToFoci(x, y)
    if (d1 < d2 * 0.7) return 'A'      // Clearly in focus A's basin
    if (d2 < d1 * 0.7) return 'B'      // Clearly in focus B's basin
    return 'synapse'                    // In the synaptic zone
}

// === Map position to pitch ===
function posToNote(x, y) {
    const domain = dominantFocus(x, y)
    const { d1, d2, total } = distToFoci(x, y)

    // How close to the nearest focus (0 = at focus, 1 = far away)
    const proximity = 1 - Math.min(d1, d2) / 60

    if (domain === 'A') {
        // Focus A: D minor pentatonic, pitch from Y position
        const normY = (y + 100) / 200
        const idx = Math.floor(normY * DminPent.length * 3)
        return {
            freq: DminPent[idx % DminPent.length] * Math.pow(2, Math.floor(idx / DminPent.length)),
            domain: 'A',
            proximity: proximity,
            timbre: 0.3 + proximity * 0.7 // rich near focus
        }
    } else if (domain === 'B') {
        // Focus B: A minor pentatonic, pitch from Y position
        const normY = (y + 100) / 200
        const idx = Math.floor(normY * AminPent.length * 3)
        return {
            freq: AminPent[idx % AminPent.length] * Math.pow(2, Math.floor(idx / AminPent.length)),
            domain: 'B',
            proximity: proximity,
            timbre: 0.2 + proximity * 0.5 // thinner than A (brighter, shallower)
        }
    } else {
        // Synapse: use shared notes, microtonal uncertainty
        const normY = (y + 100) / 200
        const idx = Math.floor(normY * synapticNotes.length * 2)
        const baseFreq = synapticNotes[idx % synapticNotes.length] * Math.pow(2, Math.floor(idx / synapticNotes.length))

        // Add microtonal wobble — the uncertainty of the synapse
        const wobble = 0.02 * Math.sin(x * 0.1) // ±2% frequency variation
        return {
            freq: baseFreq * (1 + wobble),
            domain: 'synapse',
            proximity: proximity,
            timbre: 0.1 + proximity * 0.3 // thinnest — the synapse is delicate
        }
    }
}

// === Dendritic voice — scattered origins following dual convergence ===
function dendriticFieldVoice(name, numOrigins, maxDepth, startSpread) {
    const notes = []

    function branch(x, y, depth, angle, amp) {
        if (depth >= maxDepth || amp < 0.015) return

        for (let step = 0; step < 18; step++) {
            const field = dualConvergence(x, y)
            const fmag = Math.sqrt(field.fx * field.fx + field.fy * field.fy) + 0.001
            const fieldDir = Math.atan2(field.fy, field.fx)

            // 50% field influence — stronger than Magnetic Dendrite (40%)
            // The synapse is a field problem, not just guidance
            angle = angle * 0.5 + fieldDir * 0.5

            x += Math.cos(angle) * 1.1
            y += Math.sin(angle) * 1.1

            if (Math.abs(x) > 95 || Math.abs(y) > 95) return

            if (step % 3 === 0) {
                const noteInfo = posToNote(x, y)
                const tick = depth * 6 + step * 0.4
                const harm = noteInfo.timbre

                // Fundamental
                notes.push({
                    freq: noteInfo.freq,
                    tick: tick,
                    duration: 1.2 + noteInfo.proximity * 2.5,
                    amp: amp,
                    pan: Math.max(-1, Math.min(1, x / 80)),
                    attack: 0.2 + (1 - noteInfo.proximity) * 0.4,
                    release: 0.8 + noteInfo.proximity * 1.5
                })

                // Harmonic layers (timbre richness based on proximity)
                if (harm > 0.4) {
                    notes.push({
                        freq: noteInfo.freq * 2,
                        tick: tick + 0.1,
                        duration: 0.8 + noteInfo.proximity * 1.5,
                        amp: amp * 0.22,
                        pan: Math.max(-1, Math.min(1, x / 80)),
                        attack: 0.3,
                        release: 0.5 + noteInfo.proximity
                    })
                }
                if (harm > 0.6) {
                    notes.push({
                        freq: noteInfo.freq * 1.5,
                        tick: tick + 0.15,
                        duration: 0.6 + noteInfo.proximity,
                        amp: amp * 0.10,
                        pan: Math.max(-1, Math.min(1, x / 80)),
                        attack: 0.4,
                        release: 0.4 + noteInfo.proximity * 0.8
                    })
                }
            }
        }

        // Recursive branching
        const childAmp = amp * 0.66
        branch(x, y, depth + 1, angle + 0.55, childAmp)
        branch(x, y, depth + 1, angle - 0.55, childAmp)
    }

    // Scattered origins across the canvas
    for (let i = 0; i < numOrigins; i++) {
        const angle = (i / numOrigins) * Math.PI * 2 + (i * 0.7) // scattered, not radial
        const radius = 40 + (i % 3) * 20 // varying distances
        const ox = Math.cos(angle) * radius * startSpread
        const oy = Math.sin(angle) * radius * startSpread
        const startDir = Math.atan2(-oy, -ox) + (Math.random() - 0.5) * 0.5
        branch(ox, oy, 0, startDir, 0.12)
    }

    notes.sort((a, b) => a.tick - b.tick)

    for (const n of notes) {
        sine.play(n.freq, {
            tick: n.tick,
            duration: n.duration,
            amp: n.amp,
            pan: n.pan,
            attack: n.attack,
            release: n.release
        })
    }

    console.log(`${name}: ${notes.length} notes`)
}

// === Voice 1: Dendritic field (scattered origins, depth 8) ===
loop(() => {
    dendriticFieldVoice('dendritic-field', 16, 8, 0.8)
}, { name: 'dendritic-field', duration: 120 })

// === Voice 2: Focus A drone (D minor — the deep attractor) ===
loop(() => {
    sine.play(d1, { tick: 0, duration: 120, amp: 0.10, attack: 4, release: 10, pan: -0.5 })
    sine.play(d2, { tick: 0, duration: 120, amp: 0.05, attack: 5, release: 12, pan: -0.5 })
    sine.play(a2, { tick: 0, duration: 120, amp: 0.025, attack: 6, release: 14, pan: -0.5 })

    // Slow breathing — D pulsing every 12 ticks
    for (let t = 0; t < 120; t += 12) {
        const pulse = 0.06 + 0.03 * Math.sin(t * Math.PI / 24)
        sine.play(d1, { tick: t, duration: 8, amp: pulse, attack: 2, release: 4, pan: -0.5 })
    }
}, { name: 'focus-a-drone', duration: 120 })

// === Voice 3: Focus B drone (A minor — the bright attractor) ===
loop(() => {
    sine.play(a1, { tick: 0, duration: 120, amp: 0.08, attack: 4, release: 10, pan: 0.5 })
    sine.play(a2, { tick: 0, duration: 120, amp: 0.03, attack: 5, release: 12, pan: 0.5 })
    // Thinner harmonics than A (brighter, shallower attractor)

    for (let t = 0; t < 120; t += 10) {
        const pulse = 0.05 + 0.025 * Math.sin(t * Math.PI / 20)
        sine.play(a1, { tick: t + 2, duration: 6, amp: pulse, attack: 1.5, release: 3, pan: 0.5 })
    }
}, { name: 'focus-b-drone', duration: 120 })

// === Voice 4: Synaptic whisper (the zone between) ===
loop(() => {
    // Particles wandering in the synaptic zone (between the two foci)
    // They emit notes from the shared scale, with microtonal uncertainty
    for (let i = 0; i < 20; i++) {
        // Start near the center line between the two foci
        const startX = (Math.random() - 0.5) * 30 // ±15 around center
        const startY = (Math.random() - 0.5) * 80

        let x = startX, y = startY
        let tick = i * 6 + Math.random() * 3

        for (let step = 0; step < 30; step++) {
            const field = dualConvergence(x, y)
            const fmag = Math.sqrt(field.fx * field.fx + field.fy * field.fy) + 0.001

            // Follow the field — but weakly, wandering
            x += field.fx / fmag * 1.5 + (Math.random() - 0.5) * 0.8
            y += field.fy / fmag * 1.5 + (Math.random() - 0.5) * 0.8

            if (Math.abs(x) > 60 || Math.abs(y) > 95) break

            if (step % 3 === 0) {
                const domain = dominantFocus(x, y)
                if (domain === 'synapse') {
                    // Only emit in the synaptic zone
                    const normY = (y + 100) / 200
                    const idx = Math.floor(normY * synapticNotes.length * 3)
                    const baseFreq = synapticNotes[idx % synapticNotes.length] * Math.pow(2, Math.floor(idx / synapticNotes.length))
                    const wobble = 0.015 * Math.sin(x * 0.15 + step * 0.1)

                    sine.play(baseFreq * (1 + wobble), {
                        tick: tick + step * 0.4,
                        duration: 0.6 + Math.random() * 0.8,
                        amp: 0.015 + 0.02 * (1 - step / 30),
                        pan: Math.max(-1, Math.min(1, x / 50)),
                        attack: 0.15,
                        release: 0.4 + Math.random() * 0.3
                    })
                }
            }
        }
    }
}, { name: 'synaptic-whisper', duration: 120 })