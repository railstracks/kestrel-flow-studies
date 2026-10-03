// Wear Worlds — Study XXIX arm-1 DISCRIMINATORS (Block 236, Oct 3 2026). ZERO instrument reads this session.
//
// PURPOSE (Finding 19 caveat): CELL-SHUFFLED (Block 229/230) confounded three factors —
//   (a) applied-wear AMOUNT collapsed (segments sample mostly-zero cells of the permuted field),
//   (b) local COHERENCE destroyed (salt-and-pepper along strokes),
//   (c) GEOGRAPHY destroyed (wear decoupled from traffic).
// These arms separate them. WORN (committed, Block 229) is the common anchor:
//   SEG-SHUFFLED  — per-SEGMENT bin permutation, fixed seed. Per-segment bin multiset == WORN's EXACTLY
//                   (every step is 1.6 world units, so length-weighted color area matches too).
//                   Amount matched; coherence killed; geography killed. THE correlation-gate discriminator.
//   BLOCK-SHUFFLED — 10x10-block permutation of the final field (20x20 blocks), fixed seed.
//                   Coherence preserved (<=10-cell runs consistent); geography destroyed; applied marginal
//                   shifted low (DECLARED property, inherent to any geography-destroying permutation).
//   FRAG-GOLD     — WORN's exact segmentation (bins computed as usual, drives run structure), ALL runs styled
//                   bin-0 gold/width-1.2. Fragmentation/path-count matched; zero wear vocabulary.
//
// PROVENANCE-FIDELITY NOTE (discovered on re-read, Oct 3, disclosed): bones §1 declared PASSAGE-TIME styling
// ("a segment's styling sees the wear field at its moment of passage ... NOT the final map") but the committed
// implementation styles by the FINAL cumulative field (replayDeposit completes before renderWorn reads). The
// committed WORN artifact + Finding 19 are final-map semantics. Witnesses bind the artifact as committed;
// arm-2 must pick its semantics EXPLICITLY. Recorded in the results doc.
//
// Simulation VERBATIM from wear-worlds.js (itself verbatim from extinction-witnesses-eraflat.js) — same RNG
// consumption; geometry witness must reproduce arm-1's d-hash (prefix 810fe0bf).
const fs = require('fs');
const crypto = require('crypto');

const W_SAT = 4;         // FIXED in Block 229 prereg from dry-run histogram (median rule). Never re-derived.
const BIN_N = 8;
const SEG_SEED = 23100301;   // segment-bin permutation seed — declared, hashed below
const BLOCK_SEED = 23100302; // block permutation seed — declared, hashed below
const BLOCK = 10;            // block side in cells (200x200 field -> 20x20 blocks)

function mulberry32(seed) {
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
// ── simulation: VERBATIM from wear-worlds.js ──
function ambient(x, y) {
    const p = (px, py) =>
        Math.sin(px * 0.015) * Math.cos(py * 0.012) * 80
      + Math.sin(px * 0.008 + py * 0.006) * 40
      + Math.cos(px * 0.004 - py * 0.010 + 2.0) * 25;
    const eps = 0.5;
    const dy = (p(x, y + eps) - p(x, y - eps)) / (2 * eps);
    const dx = -(p(x + eps, y) - p(x - eps, y)) / (2 * eps);
    return { x: dx, y: dy };
}
function focusSumVec(x, y, tau, foci) {
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
const COHORTS = 12, TPC = 140, TRAILLEN = 70, STEP = 1.6;
function simulate(foci) {
    const trails = [];
    for (let k = 0; k < COHORTS; k++) {
        const tau = (k + 0.5) / COHORTS;
        const rand = mulberry32(31415 + k * 7919);
        for (let i = 0; i < TPC; i++) {
            let x = (rand() - 0.5) * 180, y = (rand() - 0.5) * 180;
            const opacity = 0.35 + rand() * 0.40; // SAME rand() consumption as committed arms
            const pts = [[x, y]];
            for (let s = 0; s < TRAILLEN; s++) {
                if (Math.abs(x) > 95 || Math.abs(y) > 95) break;
                const f = focusSumVec(x, y, tau, foci);
                const a = ambient(x, y);
                const fm = Math.hypot(f.x, f.y), am = Math.hypot(a.x, a.y) || 1;
                const vx = (f.x / fm) * 0.75 + (a.x / am) * 0.25 * 0.6;
                const vy = (f.y / fm) * 0.75 + (a.y / am) * 0.25 * 0.6;
                const len = Math.hypot(vx, vy) || 1;
                x += (vx / len) * STEP; y += (vy / len) * STEP;
                pts.push([x, y]);
            }
            if (pts.length > 3) trails.push({ pts, opacity, tau });
        }
    }
    return trails;
}
// ── end verbatim block ──

const GRID = 200;
const cellOf = (x, y) => {
    let cx = Math.min(GRID - 1, Math.max(0, Math.round(x) + 100));
    let cy = Math.min(GRID - 1, Math.max(0, Math.round(y) + 100));
    return cy * GRID + cx;
};
// Geometry witness: SAME serialization as wear-witness.js (SVG d-strings, per-trail "M x y L x y", joined by
// newlines) — directly comparable to the arm-1 hash of record 810fe0bf0a4c0fed75e69d0fd00dee7913ba6a62...
function geometryHash(trails) {
    const h = crypto.createHash('sha256');
    h.update(trails.map(t => t.pts.map((p, i) => {
        const sx = (p[0] + 100) * 5, sy = (100 - p[1]) * 5;
        return (i === 0 ? 'M' : 'L') + sx.toFixed(1) + ' ' + sy.toFixed(1);
    }).join(' ')).join('\n'));
    return h.digest('hex');
}
function fieldHash(arr) {
    const h = crypto.createHash('sha256');
    h.update(Buffer.from(arr));
    return h.digest('hex');
}
function replayDeposit(trails) {
    const w = new Uint16Array(GRID * GRID);
    for (const t of trails) for (let j = 1; j < t.pts.length; j++) {
        const mx = (t.pts[j-1][0] + t.pts[j][0]) / 2, my = (t.pts[j-1][1] + t.pts[j][1]) / 2;
        w[cellOf(mx, my)] += 1;
    }
    return w;
}
const binOf = wtilde => Math.min(BIN_N - 1, Math.floor(wtilde * BIN_N));
const wtildeDraw = bin => (bin + 0.5) / BIN_N;

// Per-segment bin sequence of the WORN arm (final-field semantics, as committed).
function wornSegmentBins(trails, wField) {
    const bins = [];
    for (const t of trails) for (let j = 1; j < t.pts.length; j++) {
        const mx = (t.pts[j-1][0] + t.pts[j][0]) / 2, my = (t.pts[j-1][1] + t.pts[j][1]) / 2;
        const wt = Math.min(1, wField[cellOf(mx, my)] / W_SAT);
        bins.push(binOf(wt));
    }
    return bins;
}
function multisetHash(arr) {
    const h = crypto.createHash('sha256');
    h.update(Buffer.from(Array.from(arr).sort((a, b) => a - b)));
    return h.digest('hex');
}
function histogram(arr) {
    const h = new Array(BIN_N).fill(0);
    for (const v of arr) h[v]++;
    return h;
}

// Fisher-Yates on an index array with declared seed (same construction as arm-1's shuffledCopy).
function permuteIndices(n, seed) {
    const idx = new Uint32Array(n);
    for (let i = 0; i < n; i++) idx[i] = i;
    const rand = mulberry32(seed);
    for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        const t = idx[i]; idx[i] = idx[j]; idx[j] = t;
    }
    return idx;
}

// Block permutation of the field: 20x20 blocks of 10x10 cells, Fisher-Yates over block positions.
function blockShuffledCopy(wField) {
    const NB = GRID / BLOCK; // 20
    const nBlocks = NB * NB;
    const perm = permuteIndices(nBlocks, BLOCK_SEED);
    const out = new Uint16Array(GRID * GRID);
    for (let bp = 0; bp < nBlocks; bp++) {
        const src = perm[bp]; // block at position bp receives block src's contents
        const bx = bp % NB, by = Math.floor(bp / NB);
        const sx = src % NB, sy = Math.floor(src / NB);
        for (let yy = 0; yy < BLOCK; yy++) for (let xx = 0; xx < BLOCK; xx++) {
            out[(by * BLOCK + yy) * GRID + (bx * BLOCK + xx)] =
                wField[(sy * BLOCK + yy) * GRID + (sx * BLOCK + xx)];
        }
    }
    return out;
}

// Render from an explicit per-segment bin sequence (shared by ALL arms here — WORN itself re-renders through
// this path as a bit-identity check against the committed SVG where applicable).
// forceGold: segmentation follows bins, but every run styled bin-0 (FRAG-GOLD).
function renderFromBins(trails, segBins, outputPath, forceGold = false) {
    const lerp = (a, b, t) => a + (b - a) * t;
    const A = [212, 162, 78], B = [138, 148, 160];
    const hex = c => '#' + [0,1,2].map(i => Math.round(lerp(A[i], B[i], c)).toString(16).padStart(2,'0')).join('');
    const lines = [];
    let paths = 0, si = 0;
    for (const t of trails) {
        let runStart = 1, runBin = null;
        const flush = (endIdx) => {
            if (runBin === null) return;
            const styleBin = forceGold ? 0 : runBin;
            const wtilde = wtildeDraw(styleBin);
            const col = hex(wtilde), width = (1.2 - 0.4 * wtilde).toFixed(2);
            const d = t.pts.slice(runStart - 1, endIdx + 1).map((p, i) => {
                const sx = (p[0] + 100) * 5, sy = (100 - p[1]) * 5;
                return (i === 0 ? 'M' : 'L') + sx.toFixed(1) + ' ' + sy.toFixed(1);
            }).join(' ');
            lines.push(`  <path d="${d}" stroke="${col}" stroke-width="${width}" fill="none" opacity="${t.opacity.toFixed(2)}" stroke-linecap="round"/>`);
            paths++;
        };
        for (let j = 1; j < t.pts.length; j++) {
            const b = segBins[si++];
            if (b !== runBin) { flush(j - 1); runBin = b; runStart = j; }
        }
        flush(t.pts.length - 1);
    }
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">\n  <rect width="1000" height="1000" fill="#101014"/>\n${lines.join('\n')}\n</svg>`;
    fs.writeFileSync(outputPath, svg);
    return { paths, bytes: svg.length };
}

// ── run ──
const DRY = process.argv.includes('--dry-run');
const RENDER = process.argv.includes('--render');
const FOCI_GIANT_NEIGHBOR = [{ x: 42, y: -40, g: 38, k: 5.01 }, { x: -52, y: 38, g: 90, k: 1.00 }];
const trails = simulate(FOCI_GIANT_NEIGHBOR);
const geoHash = geometryHash(trails);
const wear = replayDeposit(trails);
const wornBins = wornSegmentBins(trails, wear);

// SEG-SHUFFLED: permute the per-segment bin values among segments (multiset preserved exactly).
const segPerm = permuteIndices(wornBins.length, SEG_SEED);
const segBins = new Uint8Array(wornBins.length);
for (let i = 0; i < wornBins.length; i++) segBins[i] = wornBins[segPerm[i]];

// BLOCK-SHUFFLED: style by block-permuted field (same wornSegmentBins path).
const blockField = blockShuffledCopy(wear);
const blockBins = wornSegmentBins(trails, blockField);

// Witnesses + stats
const mWorn = multisetHash(wornBins), mSeg = multisetHash(segBins);
console.log('=== Study XXIX wear discriminators — stats (giant-neighbor world, W_SAT=4 fixed) ===');
console.log('trails:', trails.length, 'segments:', wornBins.length);
const ARM1_GEO = '810fe0bf0a4c0fed75e69d0fd00dee7913ba6a62036e6c3c151046f40304e0cb';
console.log('geometry sha256:', geoHash, geoHash === ARM1_GEO ? '== ARM1_HASH_OF_RECORD (assert PASS)' : 'MISMATCH (assert FAIL)');
if (geoHash !== ARM1_GEO) { console.error('FATAL: geometry witness mismatch vs arm-1'); process.exit(1); }
console.log('wear field sha256 (worn):', fieldHash(wear));
console.log('block-shuffled field sha256:', fieldHash(blockField), '(seed', BLOCK_SEED + ', block', BLOCK + 'x' + BLOCK + ')');
console.log('seg-shuffle seed:', SEG_SEED, '— seeds hashed here:', crypto.createHash('sha256').update(SEG_SEED + ':' + BLOCK_SEED).digest('hex').slice(0, 16));
console.log('applied-bin histogram WORN :', JSON.stringify(histogram(wornBins)));
console.log('applied-bin histogram SEG   :', JSON.stringify(histogram(segBins)));
console.log('applied-bin histogram BLOCK :', JSON.stringify(histogram(blockBins)));
console.log('multiset sha256 wornBins:', mWorn);
console.log('multiset sha256 segBins :', mSeg, mWorn === mSeg ? 'EQUAL (assert PASS)' : 'MISMATCH (assert FAIL)');
if (mWorn !== mSeg) { console.error('FATAL: segment multiset not preserved'); process.exit(1); }

if (RENDER) {
    // WORN re-render through the shared path — bit-identity witness vs committed SVG (assert).
    const wornR = renderFromBins(trails, wornBins, 'study-xxix-wear-worn-recheck.svg');
    const committed = fs.readFileSync('study-xxix-wear-worn.svg');
    const recheck = fs.readFileSync('study-xxix-wear-worn-recheck.svg');
    console.log('WORN re-render:', JSON.stringify(wornR), '— bit-identical to committed:', Buffer.compare(committed, recheck) === 0 ? 'PASS' : 'FAIL');
    if (Buffer.compare(committed, recheck) !== 0) { console.error('FATAL: WORN re-render diverged'); process.exit(1); }
    fs.unlinkSync('study-xxix-wear-worn-recheck.svg');

    const seg = renderFromBins(trails, segBins, 'study-xxix-wear-segshuffled.svg');
    console.log('SEG-SHUFFLED svg:', JSON.stringify(seg));
    const blk = renderFromBins(trails, blockBins, 'study-xxix-wear-blockshuffled.svg');
    console.log('BLOCK-SHUFFLED svg:', JSON.stringify(blk));
    const fg = renderFromBins(trails, wornBins, 'study-xxix-wear-fraggold.svg', true);
    console.log('FRAG-GOLD svg:', JSON.stringify(fg), '— path count must equal WORN:', fg.paths === wornR.paths ? 'PASS' : 'FAIL');
    if (fg.paths !== wornR.paths) { console.error('FATAL: FRAG-GOLD path count mismatch'); process.exit(1); }
} else if (!DRY) {
    console.log('(dry stats only — pass --render to write SVGs)');
}
