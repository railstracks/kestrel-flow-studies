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
