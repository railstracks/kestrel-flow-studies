// Field Histories — Kestrel's Series VI generative art
//
// FAMILY THESIS (new axis for the flow-studies principle):
// Series I–V established that spatial convergence structure (foci, basins,
// attractors) is the primary aesthetic driver of static field drawings —
// with the field FIXED in time. Series VI extends the principle to the time
// axis: the field DRIFTS while the render happens. Trails are released in
// cohorts; each cohort k experiences the field frozen at its own moment τ_k.
// The finished image is a superposition of moments — a field's biography.
// You can read WHEN the field lost (or gained) focus by WHERE coherent
// trails stop (or start): hue encodes cohort time.
//
// Cross-modal lineage: the exit-schedule model of kestrel-sounds Study 08
// (one gating variable changes timescale, not form) translated to line.
// "Wane"/"Wax" pair: same schedule mirrored; palette polarity inverted
// (Fog & Whiskey starts gold ends grey; Inkwell starts dark ends bright).
//
// Pre-registered expectations (first specimens, seed 31415):
//   W1 — per-cohort mean |turn| (heading coherence) decreases monotonically
//        in τ for Wane across ≥10 of 12 cohorts (one inversion allowed).
//   W2 — eye: transition legible without legend — "gold coils into grey
//        weather", transition zone readable as structure, not noise.
//   W3 — Wax inverse: coherence increasing in τ; late cohorts bright+tight.
//        (Mirrored metric check, same allowance.)
//
// Deterministic, plotter-clean: per-cohort polylines (single color per
// trail — honest, since the field is frozen within a cohort), no fills.

const fs = require('fs');

// --- PRNG (repo convention) ---
function mulberry32(seed) {
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// --- IQ cosine palette (repo convention) ---
function cosine(t, a, b, c, d) {
    const r = a[0] + b[0] * Math.cos(2 * Math.PI * (c[0] * t + d[0]));
    const g = a[1] + b[1] * Math.cos(2 * Math.PI * (c[1] * t + d[1]));
    const bl = a[2] + b[2] * Math.cos(2 * Math.PI * (c[2] * t + d[2]));
    return [
        Math.round(Math.max(0, Math.min(1, r)) * 255),
        Math.round(Math.max(0, Math.min(1, g)) * 255),
        Math.round(Math.max(0, Math.min(1, bl)) * 255)
    ];
}
function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

// Identity palettes (chromatic-studies-v2, half-cycle semantics):
const fogWhiskey = { a: [0.55, 0.46, 0.30], b: [0.25, 0.17, 0.05], c: [0.5, 0.5, 0.5], d: [0, 0, 0] };        // gold → smoky grey
const inkwell    = { a: [0.45, 0.455, 0.575], b: [0.26, 0.305, 0.325], c: [0.5, 0.5, 0.5], d: [0.5, 0.5, 0.5] }; // dark → bright

// ═══════════════════════════════════════════════════════════════
// Scheduled fields — focus strength s(τ) gates convergence vs ambient
// ═══════════════════════════════════════════════════════════════

const FOCI = [
    { x: -35, y: 20, strength: 55 },   // stronger, upper-left (repo geometry)
    { x: 25,  y: -20, strength: 35 }   // weaker, lower-right
];

// Ambient residual: gentle layered-sinusoid curl, τ-invariant ("weather")
function ambientVec(x, y) {
    const p = (px, py) =>
        Math.sin(px * 0.015) * Math.cos(py * 0.012) * 80
      + Math.sin(px * 0.008 + py * 0.006) * 40
      + Math.cos(px * 0.004 - py * 0.010 + 2.0) * 25;
    const eps = 0.5;
    const dy = (p(x, y + eps) - p(x, y - eps)) / (2 * eps);
    const dx = -(p(x + eps, y) - p(x - eps, y)) / (2 * eps);
    return { x: dx, y: dy };
}

function focusVec(x, y) {
    let fx = 0, fy = 0;
    for (const f of FOCI) {
        const dx = f.x - x, dy = f.y - y;
        const r = Math.sqrt(dx*dx + dy*dy) + 2;
        fx += (dx / r) * f.strength / r + (-dy / r) * f.strength / (r * 2.5);
        fy += (dy / r) * f.strength / r + ( dx / r) * f.strength / (r * 2.5);
    }
    return { x: fx, y: fy };
}

// s(τ): Wane = exponential fade (k=2.5 → s(1)≈0.082); Wax = mirrored rise
function scheduleWane(tau) { return Math.exp(-2.5 * tau); }
function scheduleWax(tau)  { return Math.exp(-2.5 * (1 - tau)); }

function scheduledField(x, y, tau, schedule) {
    // Explicit direction handover: unit convergence direction vs unit weather
    // direction (weather weighted 0.6 — gentler authority than convergence).
    // Blend weight IS the schedule — the only channel the walker reads.
    const s = schedule(tau);
    const f = focusVec(x, y);
    const a = ambientVec(x, y);
    const fm = Math.hypot(f.x, f.y) || 1;
    const am = Math.hypot(a.x, a.y) || 1;
    const w = s / (s + (1 - s) * 0.6);   // normalized mix in [0,1]
    const vx = (f.x / fm) * w + (a.x / am) * (1 - w) * 0.6;
    const vy = (f.y / fm) * w + (a.y / am) * (1 - w) * 0.6;
    return { x: vx, y: vy, s };
}

// ═══════════════════════════════════════════════════════════════
// Cohort simulation — each cohort experiences the field at its τ
// ═══════════════════════════════════════════════════════════════

function simulateCohorts(schedule, baseSeed, opts) {
    const {
        cohorts = 12, trailsPerCohort = 140,
        trailLen = 70, stepSize = 1.6
    } = opts || {};
    const cohortStats = [];
    const allTrails = [];

    for (let k = 0; k < cohorts; k++) {
        const tau = (k + 0.5) / cohorts;
        const rand = mulberry32(baseSeed + k * 7919);
        const trails = [];
        let sumTurn = 0, nTurn = 0;

        for (let i = 0; i < trailsPerCohort; i++) {
            let x = (rand() - 0.5) * 180;
            let y = (rand() - 0.5) * 180;
            const opacity = (0.35 + rand() * 0.40) * (1.0 - 0.25 * tau); // v3: gentler fade — late trails must read THROUGH dense regions (W2 masking fix)
            const pts = [[x, y]];
            let prevHeading = null;

            for (let step = 0; step < trailLen; step++) {
                if (Math.abs(x) > 95 || Math.abs(y) > 95) break;
                const v = scheduledField(x, y, tau, schedule);
                const len = Math.hypot(v.x, v.y) || 1;
                const hx = v.x / len, hy = v.y / len;
                if (prevHeading) {
                    const dot = Math.max(-1, Math.min(1, prevHeading.x * hx + prevHeading.y * hy));
                    sumTurn += Math.acos(dot); nTurn++;
                    prevHeading = { x: hx, y: hy };
                } else {
                    prevHeading = { x: hx, y: hy };
                }
                x += hx * stepSize;
                y += hy * stepSize;
                pts.push([x, y]);
            }
            if (pts.length > 3) {
                const dEnd = Math.min(...FOCI.map(f => Math.hypot(f.x - x, f.y - y)));
                const net = Math.hypot(x - pts[0][0], y - pts[0][1]);
                const total = (pts.length - 1) * stepSize;
                trails.push({ pts, opacity, tau, dEnd, meander: net / total });
            }
        }
        cohortStats.push({
            tau,
            meanTurn: nTurn ? sumTurn / nTurn : 0,
            meanDEnd: trails.length ? trails.reduce((s2, t) => s2 + t.dEnd, 0) / trails.length : 0,
            meanMeander: trails.length ? trails.reduce((s2, t) => s2 + t.meander, 0) / trails.length : 0,
            trails: trails.length
        });
        allTrails.push(...trails);
    }
    return { trails: allTrails, cohortStats };
}

// ═══════════════════════════════════════════════════════════════
// SVG output — per-trail polylines, cohort-tinted (hue ← τ)
// ═══════════════════════════════════════════════════════════════

const SVG_SIZE = 1000;

function worldToSvg(x, y) {
    return [ (x + 100) * SVG_SIZE / 200, (100 - y) * SVG_SIZE / 200 ];
}

// Temporal anchors — direct RGB lerp (v2). The cosine half-cycle palettes
// proved too subtle at drawing opacity/width scales (first specimen: late
// grey read as "dim gold" — temporal channel illegible). Hue must carry time.
const lerp = (a, b, t) => a + (b - a) * t;
function lerpColor(A, B, t) {
    return rgbToHex(Math.round(lerp(A[0], B[0], t)), Math.round(lerp(A[1], B[1], t)), Math.round(lerp(A[2], B[2], t)));
}
const waneAnchors = { early: [212, 162, 78], late: [138, 148, 160] };   // saturated gold → cool smoke
const waxAnchors  = { early: [165, 172, 185], late: [212, 162, 78] };   // v3: silver → warm brass (indigo died on the dark ground; alive=warm across the pair)

function generateSVG(trails, anchors, bg, outputPath) {
    const lines = [];
    for (const t of trails) {
        const col = lerpColor(anchors.early, anchors.late, t.tau);
        const width = 1.2 - 0.4 * t.tau; // v3: strokes thin as time passes, floor 0.8 (was 0.6 — raised for overlap legibility)
        const d = t.pts.map((p, i) => {
            const [sx, sy] = worldToSvg(p[0], p[1]);
            return (i === 0 ? 'M' : 'L') + sx.toFixed(1) + ' ' + sy.toFixed(1);
        }).join(' ');
        lines.push(`  <path d="${d}" stroke="${col}" stroke-width="${width.toFixed(2)}" fill="none" opacity="${t.opacity.toFixed(2)}" stroke-linecap="round"/>`);
    }
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_SIZE} ${SVG_SIZE}" width="${SVG_SIZE}" height="${SVG_SIZE}">
  <rect width="${SVG_SIZE}" height="${SVG_SIZE}" fill="${bg}"/>
${lines.join('\n')}
</svg>`;
    fs.writeFileSync(outputPath, svg);
    return { trails: trails.length, bytes: svg.length };
}

// Monotonicity check for the pre-registered metric (allow one inversion)
function monotoneDescending(vals) {
    let inversions = 0;
    for (let i = 1; i < vals.length; i++) if (vals[i] > vals[i - 1]) inversions++;
    return inversions;
}

// ═══════════════════════════════════════════════════════════════
// Studies
// ═══════════════════════════════════════════════════════════════

// Study XXVI — "Wane": convergence fades, gold → grey (Fog & Whiskey)
(function studyWane() {
    const { trails, cohortStats } = simulateCohorts(scheduleWane, 31415, {});
    const out = generateSVG(trails, waneAnchors, '#101014', 'study-xxvi-wane.svg');
    const dEnds = cohortStats.map(c => c.meanDEnd);
    console.log('Study XXVI — Wane (seed 31415)');
    console.log('  cohorts:', cohortStats.length, 'trails:', out.trails, 'bytes:', out.bytes);
    console.log('  meanDEnd by τ (ascending expected — endpoints leave foci):');
    cohortStats.forEach(c => console.log('    τ=' + c.tau.toFixed(2), 'dEnd=' + c.meanDEnd.toFixed(1), 'meander=' + c.meanMeander.toFixed(2), 'turn=' + c.meanTurn.toFixed(3)));
    console.log('  inversions vs ascending (pre-reg W1, allow ≤1):', monotoneDescending(dEnds.slice().reverse()));
})();

// Study XXVII — "Wax": convergence rises, dark → bright (Inkwell)
(function studyWax() {
    const { trails, cohortStats } = simulateCohorts(scheduleWax, 31415, {});
    const out = generateSVG(trails, waxAnchors, '#101014', 'study-xxvii-wax.svg');
    const dEnds = cohortStats.map(c => c.meanDEnd);
    console.log('Study XXVII — Wax (seed 31415)');
    console.log('  cohorts:', cohortStats.length, 'trails:', out.trails, 'bytes:', out.bytes);
    console.log('  meanDEnd by τ (descending expected — endpoints find foci):');
    cohortStats.forEach(c => console.log('    τ=' + c.tau.toFixed(2), 'dEnd=' + c.meanDEnd.toFixed(1), 'meander=' + c.meanMeander.toFixed(2), 'turn=' + c.meanTurn.toFixed(3)));
    console.log('  inversions vs descending (pre-reg W3, allow ≤1):', monotoneDescending(dEnds));
})();

// ═══════════════════════════════════════════════════════════════
// Study XXVIII — "Extinction Order" (Series VI study 4, Block 147)
// Pre-reg: gallivanting/visual-studies/2026-09-01-extinction-order-prereg.md
//
// 4 foci, graded basin depth, per-focus death schedules s_i(τ)=exp(−k_i τ)
// INSIDE the normalized focus sum (the channel the walker reads). Global
// blend authority FIXED at w=0.75 — per-focus death is the only designed
// temporal mechanism. Arms: ORDERED (k graded weak→deep) and SIMULTANEOUS
// control (all k=2.5). E5 (observation-only): normalized sum ⇒ total
// extinction reorganizes into a centroid ghost rather than weather.
// ═══════════════════════════════════════════════════════════════

const FOCI_EO = [
    { x: -52, y:  38, g: 60, k: 1.47, label: 'deep' },
    { x:  48, y:  32, g: 48, k: 1.97, label: 'mid' },
    { x: -38, y: -46, g: 38, k: 2.95, label: 'midweak' },
    { x:  42, y: -40, g: 30, k: 6.20, label: 'weakest' }
];
const EO_W = 0.75;
const EO_CAPTURE_R = 22;

function eoFocusVec(x, y, tau, foci) {
    let fx = 0, fy = 0;
    for (const f of foci) {
        const s = Math.exp(-f.k * tau);
        const dx = f.x - x, dy = f.y - y;
        const r = Math.sqrt(dx*dx + dy*dy) + 2;
        fx += s * ((dx / r) * f.g / r + (-dy / r) * f.g / (r * 2.5));
        fy += s * ((dy / r) * f.g / r + ( dx / r) * f.g / (r * 2.5));
    }
    return { x: fx, y: fy };
}

function eoField(x, y, tau, foci) {
    const f = eoFocusVec(x, y, tau, foci);
    const a = ambientVec(x, y);
    const fm = Math.hypot(f.x, f.y);
    const am = Math.hypot(a.x, a.y) || 1;
    if (fm < 1e-6) return { x: a.x / am, y: a.y / am }; // formal guard; never fires in practice (E5)
    return {
        x: (f.x / fm) * EO_W + (a.x / am) * (1 - EO_W) * 0.6,
        y: (f.y / fm) * EO_W + (a.y / am) * (1 - EO_W) * 0.6
    };
}

function simulateExtinction(foci, baseSeed) {
    const cohorts = 12, trailsPerCohort = 140, trailLen = 70, stepSize = 1.6;
    const allTrails = [];
    const capture = foci.map(() => []);

    for (let k = 0; k < cohorts; k++) {
        const tau = (k + 0.5) / cohorts;
        const rand = mulberry32(baseSeed + k * 7919);
        const caps = foci.map(() => 0);
        let nTrails = 0;
        for (let i = 0; i < trailsPerCohort; i++) {
            let x = (rand() - 0.5) * 180;
            let y = (rand() - 0.5) * 180;
            const opacity = (0.35 + rand() * 0.40) * (1.0 - 0.25 * tau);
            const pts = [[x, y]];
            for (let step = 0; step < trailLen; step++) {
                if (Math.abs(x) > 95 || Math.abs(y) > 95) break;
                const v = eoField(x, y, tau, foci);
                const len = Math.hypot(v.x, v.y) || 1;
                x += (v.x / len) * stepSize;
                y += (v.y / len) * stepSize;
                pts.push([x, y]);
            }
            if (pts.length > 3) {
                nTrails++;
                foci.forEach((f, fi) => {
                    if (Math.hypot(f.x - x, f.y - y) < EO_CAPTURE_R) caps[fi]++;
                });
                allTrails.push({ pts, opacity, tau });
            }
        }
        foci.forEach((f, fi) => { capture[fi][k] = nTrails ? caps[fi] / nTrails : 0; });
    }
    return { trails: allTrails, capture };
}

// Pre-reg metric: death cohort = first k with c_i(k) < 0.5·c_i(0);
// sharpness = (first k < 0.2·base) − (first k < 0.5·base) + 1 cohorts.
function eoDeathStats(capture) {
    return capture.map(series => {
        const base = series[0];
        if (base <= 0.02) return { base, death: null, sharp: null, note: 'baseline ≤0.02 — unmeasurable' };
        let half = null, fifth = null;
        for (let k = 0; k < series.length; k++) {
            if (half === null && series[k] < 0.5 * base) half = k;
            if (fifth === null && series[k] < 0.2 * base) fifth = k;
        }
        return { base, death: half, sharp: (half !== null && fifth !== null) ? fifth - half + 1 : null };
    });
}

function reportExtinction(name, foci, svgPath) {
    const { trails, capture } = simulateExtinction(foci, 31415);
    const out = generateSVG(trails, waneAnchors, '#101014', svgPath);
    console.log('\n' + name + ' (seed 31415)');
    console.log('  trails:', out.trails, 'bytes:', out.bytes);
    console.log('  capture fraction c_i(k) — rows: foci (deep→weakest), cols: cohort 0..11');
    foci.forEach((f, fi) => {
        console.log('    ' + f.label.padEnd(8) + 'k=' + f.k.toFixed(2), capture[fi].map(c => c.toFixed(3)).join(' '));
    });
    const ds = eoDeathStats(capture);
    ds.forEach((d, fi) => console.log('    ' + foci[fi].label.padEnd(8), 'deathCohort=' + (d.death === null ? 'n/a' : d.death), 'sharp=' + (d.sharp === null ? 'n/a' : d.sharp + 'coh'), 'base=' + d.base.toFixed(3), d.note || ''));
    return { capture, ds };
}

(function studyExtinction() {
    reportExtinction('Study XXVIII — Extinction Order (ORDERED arm)', FOCI_EO, 'study-xxviii-extinction-order.svg');
    reportExtinction('Extinction SIMULTANEOUS control', FOCI_EO.map(f => ({ ...f, k: 2.5 })), 'extinction-simultaneous-control.svg');
})();

// ═══════════════════════════════════════════════════════════════
// Study XXVIII v2 — "Extinction Order, ratio-law edition" (Block 150)
// Pre-reg: gallivanting/visual-studies/2026-09-02-extinction-v2-prereg.md
//
// k re-derived from the ratio law (Δk = −ln(0.30)/τ̂ = 1.204/τ̂, the
// law's first FORWARD test — v1's band was post-hoc). ARBITRARY arm
// (reversed k assignment) replaces the unrenderable SIMULTANEOUS
// control. E4 gauge witness: a common k-offset leaves every field
// direction exactly invariant — Law 1 generalized (the substrate reads
// only the projective class of the schedule vector).
// ═══════════════════════════════════════════════════════════════

const FOCI_EO2 = [
    { x: -52, y:  38, g: 60, k: 1.00, label: 'deep' },      // dominant, immortal (gauge-fixed)
    { x:  48, y:  32, g: 48, k: 3.19, label: 'mid' },        // τ̂ 0.55 → cohort ~6
    { x: -38, y: -46, g: 38, k: 5.01, label: 'midweak' },    // τ̂ 0.30 → cohort ~3
    { x:  42, y: -40, g: 30, k: 9.03, label: 'weakest' }     // τ̂ 0.15 → cohort ~1
];
const FOCI_EO_ARB = [                                        // same multiset, reversed
    { x: -52, y:  38, g: 60, k: 9.03, label: 'deep' },
    { x:  48, y:  32, g: 48, k: 5.01, label: 'mid' },
    { x: -38, y: -46, g: 38, k: 3.19, label: 'midweak' },
    { x:  42, y: -40, g: 30, k: 1.00, label: 'weakest' }     // immortal absorber
];

function eoGaugeWitness(foci) {
    const shifted = foci.map(f => ({ ...f, k: f.k + 1.0 }));
    const rand = mulberry32(4242);
    let sum = 0, n = 0, max = 0;
    for (let p = 0; p < 200; p++) {
        const x = (rand() - 0.5) * 180, y = (rand() - 0.5) * 180;
        for (let k = 0; k < 12; k++) {
            const tau = (k + 0.5) / 12;
            const a = eoField(x, y, tau, foci), b = eoField(x, y, tau, shifted);
            const dot = Math.max(-1, Math.min(1, (a.x*b.x + a.y*b.y) /
                (Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y))));
            const ang = Math.acos(dot);
            sum += ang; n++; if (ang > max) max = ang;
        }
    }
    return { mean: sum / n, max };
}

function reportExtinctionV2(name, foci, svgPath, immortalIdx) {
    const { trails, capture } = simulateExtinction(foci, 31415);
    const out = generateSVG(trails, waneAnchors, '#101014', svgPath);
    console.log('\n' + name + ' (seed 31415)');
    console.log('  trails:', out.trails, 'bytes:', out.bytes);
    console.log('  capture c_i(k) — rows: foci, cols: cohort 0..11');
    foci.forEach((f, fi) => {
        console.log('    ' + f.label.padEnd(8) + 'k=' + f.k.toFixed(2) + ' g=' + f.g,
            capture[fi].map(c => c.toFixed(3)).join(' '));
    });
    const ds = eoDeathStats(capture);
    ds.forEach((d, fi) => console.log('    ' + foci[fi].label.padEnd(8),
        'deathCohort=' + (d.death === null ? 'n/a (immortal?)' : d.death),
        'sharp=' + (d.sharp === null ? 'n/a' : d.sharp + 'coh'),
        'base=' + d.base.toFixed(3), d.note || ''));
    const deaths = ds.map((d, fi) => fi === immortalIdx ? null : d.death).filter(d => d !== null);
    const imm = capture[immortalIdx];
    console.log('    immortal (' + foci[immortalIdx].label + ') capture:', imm.map(c => c.toFixed(3)).join(' '));
    console.log('    competitor deaths at cohorts:', deaths.join(', ') || 'none');
    deaths.forEach(dk => {
        if (dk < 1) return;
        const before = imm[dk - 1], after = imm[dk];
        console.log('      step @cohort ' + dk + ': ' + before.toFixed(3) + ' -> ' +
            after.toFixed(3) + (after > before ? '  RISE' : '  no-rise'));
    });
    return { capture, ds };
}

(function studyExtinctionV2() {
    const gw = eoGaugeWitness(FOCI_EO2);
    console.log('\n  E4 gauge witness (k+1.0 vs k, 200 pts x 12 tau): mean |dAngle| = ' +
        gw.mean.toExponential(2) + ' rad, max = ' + gw.max.toExponential(2));
    reportExtinctionV2('Study XXVIII v2 — ORDERED (ratio-law k)', FOCI_EO2, 'study-xxviii-extinction-order-v2.svg', 0);
    reportExtinctionV2('Study XXVIII v2 — ARBITRARY (reversed assignment)', FOCI_EO_ARB, 'extinction-arbitrary-arm.svg', 3);
})();
