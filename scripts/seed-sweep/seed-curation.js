// Seed-curation sweep — Study XVIII (triple convergence) family
// Purpose: automated curation across 60+ seeds of ONE field family.
// Core (mulberry32 … baseParams) copied VERBATIM from dendritic-field-studies-v3.js
// so segment streams stay byte-identical to the shipped generator.
// Determism gate: seeds [818,271,1337,31415,16180] must reproduce the original
// script's segment counts exactly (7227/5028/6273/7537/6125).
//
// Metrics (per seed; all length-weighted == count-weighted since segLength is constant):
//   N            segment count (composition mass)
//   focalMass15/25  fraction of stroke midpoints within r of nearest focus
//   focalContrast   stroke density near foci (r<=15) / density elsewhere
//   coverage20      fraction of 10-unit bins (20x20 grid) touched by a midpoint
//   negativeFine    fraction of 5-unit bins (40x40 grid) with zero strokes
//   edgeLoad        fraction of midpoints within 4 units of the canvas boundary
//   depthEntropy    Shannon entropy (bits) of length share across depth 0..8
//   symmetryFocus   1 - CV of per-focus nearest-assignment counts (three foci)
//   axisBalance     min over (L/R, T/B) of min-half/max-half count ratio

const fs = require('fs');

// ---------- VERBATIM CORE (do not touch) ----------
function mulberry32(seed) {
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

class DensityField {
    constructor(cellSize = 5) { this.cellSize = cellSize; this.cells = new Map(); }
    add(x, y) { const cx = Math.floor(x / this.cellSize), cy = Math.floor(y / this.cellSize); this.cells.set(`${cx},${cy}`, (this.cells.get(`${cx},${cy}`) || 0) + 1); }
    densityAt(x, y) {
        const cx = Math.floor(x / this.cellSize), cy = Math.floor(y / this.cellSize);
        let t = 0; for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) t += this.cells.get(`${cx+dx},${cy+dy}`) || 0; return t;
    }
}

function convergenceField(x, y, focusX, focusY, pull, swirl) {
    const dx = focusX - x, dy = focusY - y;
    const r = Math.sqrt(dx * dx + dy * dy + 1);
    return { fx: (dx / r) * pull + (-dy / r) * swirl, fy: (dy / r) * pull + (dx / r) * swirl };
}

function multiFociField(x, y, params) {
    const { foci, pull, swirl } = params;
    let fx = 0, fy = 0;
    for (let i = 0; i < foci.length; i++) {
        const s = swirl * (i % 2 === 0 ? 1 : -1);
        const f = convergenceField(x, y, foci[i].x, foci[i].y, pull, s);
        fx += f.fx; fy += f.fy;
    }
    return { fx: fx / foci.length, fy: fy / foci.length };
}

function growField(x, y, angle, params, fieldFn, fieldParams, depth, rand, density, segments) {
    if (depth >= params.maxDepth) return;
    if (Math.abs(x) > 98 || Math.abs(y) > 98) return;
    const segLength = params.segLength;
    const branchLength = params.branchLength * Math.pow(params.lengthDecay, depth);
    const totalSegs = Math.max(4, Math.floor(branchLength / segLength));
    let cx = x, cy = y, cAngle = angle;
    const branchDrift = (rand() - 0.5) * params.curveStrength;
    for (let s = 0; s < totalSegs; s++) {
        cAngle += branchDrift * 0.03;
        if (params.fieldStrength > 0) {
            const { fx, fy } = fieldFn(cx, cy, fieldParams);
            const mag = Math.sqrt(fx * fx + fy * fy);
            if (mag > 0.001) {
                const fa = Math.atan2(fy, fx);
                const diff = Math.atan2(Math.sin(fa - cAngle), Math.cos(fa - cAngle));
                cAngle += diff * params.fieldStrength * 0.15;
            }
        }
        cAngle += (rand() - 0.5) * params.noise;
        if (params.densityAvoidance > 0 && depth < params.maxDepth - 1) {
            const d = density.densityAt(cx, cy);
            if (d > 3) {
                const la = 5;
                const ahead = density.densityAt(cx + Math.cos(cAngle) * la, cy + Math.sin(cAngle) * la);
                const left = density.densityAt(cx + Math.cos(cAngle - 1) * la, cy + Math.sin(cAngle - 1) * la);
                const right = density.densityAt(cx + Math.cos(cAngle + 1) * la, cy + Math.sin(cAngle + 1) * la);
                if (left < ahead && left <= right) cAngle -= params.densityAvoidance * 0.2;
                else if (right < ahead) cAngle += params.densityAvoidance * 0.2;
            }
        }
        const nx = cx + Math.cos(cAngle) * segLength;
        const ny = cy + Math.sin(cAngle) * segLength;
        if (Math.abs(nx) > 98 || Math.abs(ny) > 98) break;
        const dr = depth / params.maxDepth;
        const op = params.baseOpacity * Math.pow(1 - dr, params.depthFadeExp);
        const w = params.baseWidth * Math.pow(params.widthDecayBase, depth);
        segments.push({ x1: cx, y1: cy, x2: nx, y2: ny, opacity: Math.max(0.06, op), width: Math.max(0.1, w), depth });
        density.add(nx, ny);
        cx = nx; cy = ny;
        const bc = params.branchProbBase + dr * params.branchProbDepth;
        if (s >= 2 && rand() < bc) {
            const spread = params.branchAngle * (0.7 + rand() * 0.6);
            const jit = (rand() - 0.5) * 0.3;
            growField(cx, cy, cAngle - spread + jit, params, fieldFn, fieldParams, depth + 1, rand, density, segments);
            growField(cx, cy, cAngle + spread + jit, params, fieldFn, fieldParams, depth + 1, rand, density, segments);
            if (rand() < 0.15) growField(cx, cy, cAngle + (rand() - 0.5) * 0.4, params, fieldFn, fieldParams, depth + 1, rand, density, segments);
            return;
        }
    }
}

function scatteredOrigins(rand, count, xRange = 70, yRange = 70) {
    const o = [];
    for (let i = 0; i < count; i++) o.push({ x: (rand() - 0.5) * 2 * xRange, y: (rand() - 0.5) * 2 * yRange, angle: rand() * Math.PI * 2 });
    return o;
}

const baseParams = {
    maxDepth: 9, segLength: 0.7, branchLength: 24,
    branchProbBase: 0.05, branchProbDepth: 0.10, branchAngle: 0.55,
    curveStrength: 0.8, noise: 0.08,
    densityAvoidance: 0.5, densityCellSize: 5,
    baseOpacity: 0.80, depthFadeExp: 1.5,
    baseWidth: 1.4, widthDecayBase: 0.74, lengthDecay: 0.76,
    fieldStrength: 0.5
};
// ---------- END VERBATIM CORE ----------

// ---------- family config (Study XVIII triple convergence, shipped params) ----------
const triangleFoci = [
    { x: -25, y: -15 }, { x: 25, y: -15 }, { x: 0, y: 25 }
];
const familyParams = { ...baseParams, fieldStrength: 0.6, maxDepth: 9 };
const familyFieldParams = { foci: triangleFoci, pull: 0.3, swirl: 0.2 };
const GALLERY_SEEDS = [818, 271, 1337, 31415, 16180];
const REFERENCE_COUNTS = { 818: 7227, 271: 5028, 1337: 6273, 31415: 7537, 16180: 6125 };

function generate(seed) {
    // Replicates render()'s RNG discipline exactly:
    // origins consume one mulberry32(seed) instance; growth rand is a FRESH mulberry32(seed).
    const origins = scatteredOrigins(mulberry32(seed), 18, 70, 70);
    const rand = mulberry32(seed);
    const density = new DensityField(familyParams.densityCellSize || 5);
    const segments = [];
    for (const o of origins) { density.add(o.x, o.y); growField(o.x, o.y, o.angle, familyParams, multiFociField, familyFieldParams, 0, rand, density, segments); }
    return segments;
}

function metrics(segments) {
    const N = segments.length;
    const segLen = 0.7; // constant by construction (verified: all segments span segLength)
    const areaNear = 3 * Math.PI * 15 * 15; // three non-overlapping r=15 discs (foci ~50 apart)
    const canvasArea = 200 * 200;
    let near15 = 0, near25 = 0, edge = 0, left = 0, top = 0;
    const bins20 = new Set(), bins40 = new Set(), focusCounts = [0, 0, 0];
    const depthCounts = new Array(9).fill(0);
    for (const s of segments) {
        const mx = (s.x1 + s.x2) / 2, my = (s.y1 + s.y2) / 2;
        // nearest focus
        let best = 0, bd = Infinity;
        for (let i = 0; i < 3; i++) {
            const dx = triangleFoci[i].x - mx, dy = triangleFoci[i].y - my;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < bd) { bd = d; best = i; }
        }
        if (bd <= 15) near15++;
        if (bd <= 25) near25++;
        focusCounts[best]++;
        if (Math.abs(mx) > 94 || Math.abs(my) > 94) edge++;
        if (mx < 0) left++;
        if (my < 0) top++;
        bins20.add(`${Math.floor((mx + 100) / 10)},${Math.floor((my + 100) / 10)}`);
        bins40.add(`${Math.floor((mx + 100) / 5)},${Math.floor((my + 100) / 5)}`);
        depthCounts[s.depth]++;
    }
    // depth entropy
    let H = 0;
    for (const c of depthCounts) { if (c > 0) { const p = c / N; H -= p * Math.log2(p); } }
    // focus symmetry: 1 - coefficient of variation
    const mean = N / 3;
    const varr = focusCounts.reduce((a, c) => a + (c - mean) * (c - mean), 0) / 3;
    const cv = Math.sqrt(varr) / mean;
    // axis balance
    const lr = Math.min(left, N - left) / Math.max(left, N - left);
    const tb = Math.min(top, N - top) / Math.max(top, N - top);
    // focal contrast (length density ratio)
    const densNear = (near15 * segLen) / areaNear;
    const densElse = ((N - near15) * segLen) / (canvasArea - areaNear);
    return {
        N,
        focalMass15: +(near15 / N).toFixed(4),
        focalMass25: +(near25 / N).toFixed(4),
        focalContrast: +(densNear / densElse).toFixed(3),
        coverage20: +(bins20.size / 400).toFixed(4),
        negativeFine: +(1 - bins40.size / 1600).toFixed(4),
        edgeLoad: +(edge / N).toFixed(4),
        depthEntropy: +H.toFixed(3),
        symmetryFocus: +Math.max(0, 1 - cv).toFixed(3),
        axisBalance: +Math.min(lr, tb).toFixed(3),
    };
}

// ---------- main ----------
const sweepSeeds = [];
for (let s = 1; s <= 56; s++) sweepSeeds.push(s);
for (const s of GALLERY_SEEDS) if (!sweepSeeds.includes(s)) sweepSeeds.push(s);

const records = [];
const segmentsOut = {};
let gateFail = 0;
for (const seed of sweepSeeds) {
    const segs = generate(seed);
    const m = metrics(segs);
    if (REFERENCE_COUNTS[seed] !== undefined) {
        if (segs.length !== REFERENCE_COUNTS[seed]) {
            console.error(`DETERMINISM GATE FAIL: seed ${seed} -> ${segs.length}, expected ${REFERENCE_COUNTS[seed]}`);
            gateFail++;
        } else {
            console.error(`gate ok: seed ${seed} -> ${segs.length}`);
        }
    }
    records.push({ seed, gallery: GALLERY_SEEDS.includes(seed), ...m });
    segmentsOut[seed] = segs;
}
if (gateFail > 0) { console.error('ABORTING: harness is not byte-equivalent to the shipped generator'); process.exit(1); }

// composite: rank-sum over monotone metrics
const compositeSpec = [
    ['focalMass25', 1], ['focalContrast', 1], ['depthEntropy', 1],
    ['symmetryFocus', 1], ['axisBalance', 1], ['edgeLoad', -1],
];
const rankKey = (m, dir) => (dir > 0 ? m : -m);
for (const [name] of compositeSpec) {
    const sorted = [...records].sort((a, b) => rankKey(b[name], 1) - rankKey(a[name], 1));
    sorted.forEach((r, i) => { r[`rk_${name}`] = i + 1; });
}
for (const r of records) {
    r.composite = compositeSpec.reduce((a, [n]) => a + r[`rk_${n}`], 0);
}
records.sort((a, b) => a.composite - b.composite);

fs.writeFileSync('sweep-metrics.json', JSON.stringify(records, null, 1));
fs.writeFileSync('sweep-segments.json', JSON.stringify(segmentsOut));

const fmt = r => `seed ${String(r.seed).padStart(5)} ${r.gallery ? '★' : ' '} comp ${String(r.composite).padStart(3)} | N=${r.N} fm25=${r.focalMass25} fc=${r.focalContrast} cov=${r.coverage20} neg=${r.negativeFine} edge=${r.edgeLoad} depH=${r.depthEntropy} sym=${r.symmetryFocus} bal=${r.axisBalance}`;
console.log('=== TOP 10 (composite rank-sum, lower=better) ===');
records.slice(0, 10).forEach((r, i) => console.log(`${i + 1}. ${fmt(r)}`));
console.log('=== BOTTOM 5 ===');
records.slice(-5).reverse().forEach((r, i) => console.log(`${records.length - i}. ${fmt(r)}`));
console.log('=== GALLERY SEEDS in rank order ===');
for (const gs of GALLERY_SEEDS) {
    const idx = records.findIndex(r => r.seed === gs);
    console.log(`seed ${gs}: rank ${idx + 1}/${records.length} ${fmt(records[idx])}`);
}
const g31415 = records.find(r => r.seed === 31415);
const pct = records.filter(r => r.composite < g31415.composite).length / records.length;
console.log(`gallery pick 31415 sits at composite percentile ${(pct * 100).toFixed(0)} (lower = stronger)`);
