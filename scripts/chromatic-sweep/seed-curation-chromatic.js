// Chromatic seed-curation sweep — Study "Growth" family (Series V, radial dendritic + Inkwell)
// Second validation of the seed-sweep methodology (first: seed-sweep/ Study XVIII family, Block 68).
// Purpose: does "metrics triage, taste chooses" transfer to a different generator family
// (radial dendritic growth, single origin, fixed 12 trunk angles) and a chromatic mapping?
//
// Core (mulberry32, SpatialHash, dendriticGrowthRadialFrom, growRecursive) copied VERBATIM
// from chromatic-studies-v2.js so segment streams are identical to the shipped generator.
// Determinism gate: seeds [31415, 999, 42, 818, 16180] must reproduce exact counts
// (5812 / 6310 / 4163 / 6175 / 6817 — captured from the shipped script's own output).
//
// Metric adaptations for single-origin radial topology (documented, minimal):
//   - FOCI := [{0,0}] (the growth origin); focalMass/Contrast/monoViolations measured from it.
//   - depthRadiusCorr REPLACES depthFocusCorr with a SIGN FLIP: in the convergence family,
//     legible journey = late strokes NEARER foci (negative corr better). Radial growth
//     journeys OUTWARD: legible growth = depth increasing with radius (POSITIVE corr better).
//   - sectorSymmetry: 12 angular sectors (trunk angles are fixed; only branch outcomes vary).
//   - depthEntropy over depth 0..10 (maxDepth 10).
// Everything else (coverage, negative space, edge load, cluster fragmentation, axis balance)
// is the same code as the first sweep.
//
// Composite v2 (per Block 68 lesson): rank-sum of [depthRadiusCorr ↑, cellClusters ↓,
// monoViolations ↓, focalContrast ↑] with an N mass floor applied at shortlist time
// (the seed-49 lesson: coherence metrics over-reward sparse isolated tufts at low mass).

const fs = require('fs');

// ---------- VERBATIM CORE (from chromatic-studies-v2.js — do not touch) ----------
function mulberry32(seed) {
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

class SpatialHash {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.cells = new Map();
    }
    _key(x, y) {
        return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
    }
    add(x, y) {
        const k = this._key(x, y);
        this.cells.set(k, (this.cells.get(k) || 0) + 1);
    }
    densityAt(x, y) {
        return this.cells.get(this._key(x, y)) || 0;
    }
}

function growRecursive(x, y, angle, depth, params, rand, density, segments) {
    if (depth >= params.maxDepth) return;
    if (Math.abs(x) > 92 || Math.abs(y) > 92) return;

    const segLength = params.segLength;
    const branchLength = params.branchLength * Math.pow(params.lengthDecay, depth);
    const totalSegs = Math.max(4, Math.floor(branchLength / segLength));
    let cx = x, cy = y, cAngle = angle;
    const branchDrift = (rand() - 0.5) * params.curveStrength;

    for (let s = 0; s < totalSegs; s++) {
        cAngle += branchDrift * 0.03;
        cAngle += (rand() - 0.5) * params.noise;

        if (params.densityAvoidance > 0 && depth < params.maxDepth - 1) {
            const d = density.densityAt(cx, cy);
            if (d > 3) {
                const la = cAngle - 1.0, ra = cAngle + 1.0;
                const ahead = density.densityAt(cx + Math.cos(cAngle) * 5, cy + Math.sin(cAngle) * 5);
                const left = density.densityAt(cx + Math.cos(la) * 5, cy + Math.sin(la) * 5);
                const right = density.densityAt(cx + Math.cos(ra) * 5, cy + Math.sin(ra) * 5);
                if (left < ahead && left <= right) cAngle -= params.densityAvoidance * 0.2;
                else if (right < ahead) cAngle += params.densityAvoidance * 0.2;
            }
        }

        const nx = cx + Math.cos(cAngle) * segLength;
        const ny = cy + Math.sin(cAngle) * segLength;
        if (Math.abs(nx) > 92 || Math.abs(ny) > 92) break;

        segments.push({ x1: cx, y1: cy, x2: nx, y2: ny, depth });
        density.add(nx, ny);
        cx = nx; cy = ny;

        const depthRatio = depth / params.maxDepth;
        const branchChance = params.branchProbBase + depthRatio * params.branchProbDepth;
        if (s >= 2 && rand() < branchChance) {
            const spread = params.branchAngle * (0.7 + rand() * 0.6);
            const jitter = (rand() - 0.5) * 0.3;
            growRecursive(cx, cy, cAngle - spread + jitter, depth + 1, params, rand, density, segments);
            growRecursive(cx, cy, cAngle + spread + jitter, depth + 1, params, rand, density, segments);
            if (rand() < 0.15) {
                growRecursive(cx, cy, cAngle + (rand() - 0.5) * 0.4, depth + 1, params, rand, density, segments);
            }
            return;
        }
    }
}

function dendriticGrowthRadialFrom(seed, params, numTrunks, originX, originY) {
    const rand = mulberry32(seed);
    const density = new SpatialHash(5);
    const segments = [];

    for (let i = 0; i < numTrunks; i++) {
        const angle = (i / numTrunks) * Math.PI * 2 + 0.1;
        const ox = originX + Math.cos(angle) * 4;
        const oy = originY + Math.sin(angle) * 4;
        growRecursive(ox, oy, angle, 0, params, rand, density, segments);
    }
    return segments;
}
// ---------- END VERBATIM CORE ----------

// ---------- family config (Growth, shipped params) ----------
const growthParams = {
    segLength: 0.7,
    branchLength: 26,
    lengthDecay: 0.76,
    maxDepth: 10,
    branchAngle: 0.55,
    branchProbBase: 0.05,
    branchProbDepth: 0.11,
    noise: 0.09,
    curveStrength: 1.0,
    preferredAngle: 0,
    directionalBias: 0.0,
    densityAvoidance: 0.6,
};
const ORIGIN = { x: 0, y: 0 };
const MANUAL_SEEDS = [31415, 999, 42, 818, 16180];   // 31415 = shipped primary; rest = script's own variants
const REFERENCE_COUNTS = { 31415: 5812, 999: 6310, 42: 4163, 818: 6175, 16180: 6817 };

function generate(seed) {
    return dendriticGrowthRadialFrom(seed, growthParams, 12, ORIGIN.x, ORIGIN.y);
}

function pearson(xs, ys) {
    const n = xs.length, mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) { const a = xs[i] - mx, b = ys[i] - my; sxy += a * b; sxx += a * a; syy += b * b; }
    return sxy / Math.sqrt(sxx * syy || 1);
}

function metrics(segments) {
    const N = segments.length;
    const segLen = 0.7;
    const areaNear = Math.PI * 15 * 15;
    const canvasArea = 200 * 200;
    let near15 = 0, near25 = 0, edge = 0, left = 0, top = 0;
    const bins20 = new Set(), bins40 = new Set();
    const depthCounts = new Array(11).fill(0);
    const sectorCounts = new Array(12).fill(0);
    const depths = [], radii = [], mids = [];
    for (const s of segments) {
        const mx = (s.x1 + s.x2) / 2, my = (s.y1 + s.y2) / 2;
        const d = Math.hypot(ORIGIN.x - mx, ORIGIN.y - my);
        if (d <= 15) near15++;
        if (d <= 25) near25++;
        if (Math.abs(mx) > 94 || Math.abs(my) > 94) edge++;
        if (mx < 0) left++;
        if (my < 0) top++;
        bins20.add(`${Math.floor((mx + 100) / 10)},${Math.floor((my + 100) / 10)}`);
        bins40.add(`${Math.floor((mx + 100) / 5)},${Math.floor((my + 100) / 5)}`);
        depthCounts[s.depth]++;
        let ang = Math.atan2(my, mx);
        if (ang < 0) ang += Math.PI * 2;
        sectorCounts[Math.min(11, Math.floor(ang / (Math.PI / 6)))]++;
        depths.push(s.depth); radii.push(d); mids.push([mx, my]);
    }
    let H = 0;
    for (const c of depthCounts) { if (c > 0) { const p = c / N; H -= p * Math.log2(p); } }
    const mean = N / 12;
    const varr = sectorCounts.reduce((a, c) => a + (c - mean) * (c - mean), 0) / 12;
    const cv = Math.sqrt(varr) / mean;
    const lr = Math.min(left, N - left) / Math.max(left, N - left);
    const tb = Math.min(top, N - top) / Math.max(top, N - top);
    const densNear = (near15 * segLen) / areaNear;
    const densElse = ((N - near15) * segLen) / (canvasArea - areaNear);

    // v2 metrics
    const depthRadiusCorr = +pearson(depths, radii).toFixed(4);
    // occupied-cell clusters (5-unit, 4-conn)
    const cell = 5, occ = new Set();
    for (const [mx, my] of mids) occ.add(`${Math.floor((mx + 100) / cell)},${Math.floor((my + 100) / cell)}`);
    let clusters = 0; const seen = new Set();
    for (const key of occ) {
        if (seen.has(key)) continue;
        clusters++; const stack = [key]; seen.add(key);
        while (stack.length) {
            const [cx, cy] = stack.pop().split(',').map(Number);
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const nk = `${cx + dx},${cy + dy}`;
                if (occ.has(nk) && !seen.has(nk)) { seen.add(nk); stack.push(nk); }
            }
        }
    }
    const cellClusters = +(clusters / occ.size).toFixed(4);
    // radial monotonicity violations from ORIGIN (dead zones: inner annulus < 0.5× outer density)
    const annuli = new Array(6).fill(0), areas = [Math.PI * 100, Math.PI * 300, Math.PI * 500, Math.PI * 700, Math.PI * 900, Math.PI * 1100];
    for (const [mx, my] of mids) {
        const d = Math.hypot(ORIGIN.x - mx, ORIGIN.y - my);
        annuli[Math.min(5, Math.floor(d / 10))]++;
    }
    const dens = annuli.map((c, i) => c / areas[i]);
    let monoV = 0;
    for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) if (dens[i] < 0.5 * dens[j]) monoV++;

    return {
        N,
        focalMass15: +(near15 / N).toFixed(4),
        focalMass25: +(near25 / N).toFixed(4),
        focalContrast: +(densNear / densElse).toFixed(3),
        coverage20: +(bins20.size / 400).toFixed(4),
        negativeFine: +(1 - bins40.size / 1600).toFixed(4),
        edgeLoad: +(edge / N).toFixed(4),
        depthEntropy: +H.toFixed(3),
        sectorSymmetry: +Math.max(0, 1 - cv).toFixed(3),
        axisBalance: +Math.min(lr, tb).toFixed(3),
        depthRadiusCorr,
        cellClusters,
        monoViolations: +monoV.toFixed(2),
    };
}

// ---------- main ----------
const sweepSeeds = [];
for (let s = 1; s <= 56; s++) sweepSeeds.push(s);
for (const s of MANUAL_SEEDS) if (!sweepSeeds.includes(s)) sweepSeeds.push(s);

const records = [];
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
    records.push({ seed, manual: MANUAL_SEEDS.includes(seed), ...m });
}
if (gateFail > 0) { console.error('ABORTING: harness not equivalent to shipped generator'); process.exit(1); }

// N distribution (for the mass floor decision)
const Ns = records.map(r => r.N).sort((a, b) => a - b);
console.log(`N distribution: min ${Ns[0]} p25 ${Ns[Math.floor(Ns.length * 0.25)]} median ${Ns[Math.floor(Ns.length / 2)]} p75 ${Ns[Math.floor(Ns.length * 0.75)]} max ${Ns[Ns.length - 1]}`);

const spec2 = [
    ['depthRadiusCorr', -1],  // higher = better (outward journey legible) — sign flipped vs convergence family
    ['cellClusters', 1],      // lower = better
    ['monoViolations', 1],    // lower = better
    ['focalContrast', -1],    // higher = better (guard vs diffusion)
];
for (const [name, dir] of spec2) {
    const sorted = [...records].sort((a, b) => dir * (a[name] - b[name]));
    sorted.forEach((r, i) => { r[`rk2_${name}`] = i + 1; });
}
for (const r of records) r.comp2 = spec2.reduce((a, [n]) => a + r[`rk2_${n}`], 0);
records.sort((a, b) => a.comp2 - b.comp2);

fs.writeFileSync('sweep-metrics-chromatic.json', JSON.stringify(records, null, 1));

const fmt = r => `seed ${String(r.seed).padStart(5)} ${r.manual ? '★' : ' '} comp2 ${String(r.comp2).padStart(3)} | corr=${r.depthRadiusCorr} clus=${r.cellClusters} mono=${r.monoViolations} fc=${r.focalContrast} N=${r.N} neg=${r.negativeFine} cov=${r.coverage20} sym=${r.sectorSymmetry}`;
console.log('=== TOP 12 (v2 composite, lower=better) ===');
records.slice(0, 12).forEach((r, i) => console.log(`${i + 1}. ${fmt(r)}`));
console.log('=== BOTTOM 5 ===');
records.slice(-5).reverse().forEach((r, i) => console.log(`${records.length - i}. ${fmt(r)}`));
console.log('=== MANUAL SEEDS in rank order ===');
for (const gs of MANUAL_SEEDS) {
    const idx = records.findIndex(r => r.seed === gs);
    console.log(`seed ${gs}: v2-rank ${idx + 1}/${records.length}`);
}
// export shortlist draw-ops for rendering (top 8 + all manual seeds)
const shortlist = [...new Set([...records.slice(0, 8).map(r => r.seed), ...MANUAL_SEEDS, 20, 34])];
const drawOps = {};
for (const seed of shortlist) drawOps[seed] = generate(seed);
fs.writeFileSync('shortlist-segments.json', JSON.stringify(drawOps));
fs.writeFileSync('shortlist.txt', shortlist.join('\n') + '\n');
console.log('shortlist:', shortlist.join(', '));
