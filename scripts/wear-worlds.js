// Wear Worlds — Study XXIX, arm 1 (passive wear). Bones: gallivanting/visual-studies/2026-09-30-wear-worlds-bones.md
// Block 229 implementation pass, Sept 30 2026. ZERO instrument reads this file's session.
//
// DESIGN (pre-registered in bones, §1):
//   - Simulation code VERBATIM from extinction-witnesses-eraflat.js (same RNG consumption; any drift breaks
//     the geometry witness). World = giant-neighbor (the committed anchor's world).
//   - UNWORN anchor = the COMMITTED study-xxviii-giant-neighbor-eraflat.svg, bit-for-bit reuse (its opacity
//     formula is already the tau-stripped one; provenance recorded at bottom).
//   - Replay deposition: trails drawn in simulation order (k, i); each segment deposits Δ=1 at its midpoint
//     cell BEFORE styling reads it (render-time semantics, "including its own deposit"). Order-dependent BY
//     DESIGN (bones §1; pre-registered as intended).
//   - Styling: w_cell -> w~ = min(1, w/W_SAT); bin = min(7, floor(w~*8)); drawn value = (bin+0.5)/8;
//     hue lerp gold[212,162,78] -> smoke[138,148,160]; width 1.2 - 0.4*w~draw; opacity = trail's own
//     (0.35 + rand*0.40) — identical to the committed eraflat per-path opacity.
//   - Consecutive same-bin segments group into one <path> per run.
//   - SHUFFLED control: final wear field spatially permuted (Fisher-Yates, mulberry32(SHUFFLE_SEED));
//     styling reads the PERMUTED field; no re-deposition. Histogram identical, corridors destroyed.
//   - Witnesses: sha256 of canonical per-trail polyline serialization (geometry; must equal the same hash of
//     the eraflat arm's trails) + sha256 of the quantized final field (worn) and of the permuted field
//     (shuffled; binds the permutation). WITNESS CODE LIVES HERE (B200 lesson).
const fs = require('fs');
const crypto = require('crypto');

const DRY_RUN = process.argv.includes('--dry-run'); // stats only, no SVG write
const W_SAT_ARG = process.argv.find(a => a.startsWith('--wsat='));
const SHUFFLE_SEED = 26099301; // fixed, declared, hashed into provenance

function mulberry32(seed) {
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
// ── simulation: VERBATIM from extinction-witnesses-eraflat.js ──
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

const GRID = 200; // world ±100 at resolution 1.0
const cellOf = (x, y) => {
    let cx = Math.min(GRID - 1, Math.max(0, Math.round(x) + 100));
    let cy = Math.min(GRID - 1, Math.max(0, Math.round(y) + 100));
    return cy * GRID + cx;
};

// Geometry witness: canonical per-trail polyline serialization, hashed. Same function used for BOTH arms.
function geometryHash(trails) {
    const h = crypto.createHash('sha256');
    for (const t of trails) h.update(t.pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(';') + '\n');
    return h.digest('hex');
}
function fieldHash(arr) {
    const h = crypto.createHash('sha256');
    h.update(Buffer.from(arr)); // Uint16 wear counts
    return h.digest('hex');
}

function replayDeposit(trails) {
    const w = new Uint16Array(GRID * GRID);
    for (const t of trails) for (let j = 1; j < t.pts.length; j++) {
        const mx = (t.pts[j-1][0] + t.pts[j][0]) / 2, my = (t.pts[j-1][1] + t.pts[j][1]) / 2;
        w[cellOf(mx, my)] += 1; // deposit BEFORE styling reads (render-time semantics)
    }
    return w;
}

const BIN_N = 8;
const binOf = wtilde => Math.min(BIN_N - 1, Math.floor(wtilde * BIN_N));
const wtildeDraw = bin => (bin + 0.5) / BIN_N;

function renderWorn(trails, wField, W_SAT, outputPath) {
    const lerp = (a, b, t) => a + (b - a) * t;
    const A = [212, 162, 78], B = [138, 148, 160];
    const hex = c => '#' + [0,1,2].map(i => Math.round(lerp(A[i], B[i], c)).toString(16).padStart(2,'0')).join('');
    const lines = [];
    let paths = 0;
    for (const t of trails) {
        // group consecutive segments by wear bin
        let runStart = 1, runBin = null;
        const flush = (endIdx) => {
            if (runBin === null) return;
            const wtilde = wtildeDraw(runBin);
            const col = hex(wtilde), width = (1.2 - 0.4 * wtilde).toFixed(2);
            const d = t.pts.slice(runStart - 1, endIdx + 1).map((p, i) => {
                const sx = (p[0] + 100) * 5, sy = (100 - p[1]) * 5;
                return (i === 0 ? 'M' : 'L') + sx.toFixed(1) + ' ' + sy.toFixed(1);
            }).join(' ');
            lines.push(`  <path d="${d}" stroke="${col}" stroke-width="${width}" fill="none" opacity="${t.opacity.toFixed(2)}" stroke-linecap="round"/>`);
            paths++;
        };
        for (let j = 1; j < t.pts.length; j++) {
            const mx = (t.pts[j-1][0] + t.pts[j][0]) / 2, my = (t.pts[j-1][1] + t.pts[j][1]) / 2;
            const wt = Math.min(1, wField[cellOf(mx, my)] / W_SAT);
            const b = binOf(wt);
            if (b !== runBin) { flush(j - 1); runBin = b; runStart = j; }
        }
        flush(t.pts.length - 1);
    }
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">\n  <rect width="1000" height="1000" fill="#101014"/>\n${lines.join('\n')}\n</svg>`;
    fs.writeFileSync(outputPath, svg);
    return { paths, bytes: svg.length };
}

function shuffledCopy(wField) {
    const idx = new Uint32Array(GRID * GRID);
    for (let i = 0; i < idx.length; i++) idx[i] = i;
    const rand = mulberry32(SHUFFLE_SEED);
    for (let i = idx.length - 1; i > 0; i--) { // Fisher-Yates
        const j = Math.floor(rand() * (i + 1));
        const t = idx[i]; idx[i] = idx[j]; idx[j] = t;
    }
    const out = new Uint16Array(GRID * GRID);
    for (let i = 0; i < idx.length; i++) out[idx[i]] = wField[i]; // histogram preserved, geography destroyed
    return out;
}

function stats(wField) {
    const nz = []; for (const v of wField) if (v > 0) nz.push(v);
    nz.sort((a,b) => a-b);
    const med = nz.length ? nz[Math.floor(nz.length/2)] : 0;
    const max = nz.length ? nz[nz.length-1] : 0;
    const total = nz.reduce((s,v) => s+v, 0);
    return { cellsNonZero: nz.length, cellsTotal: GRID*GRID, medianNonZero: med, p90: nz[Math.floor(nz.length*0.9)] || 0, max, total, coverage: +(nz.length/(GRID*GRID)).toFixed(4) };
}

// ── run ──
const FOCI_GIANT_NEIGHBOR = [{ x: 42, y: -40, g: 38, k: 5.01 }, { x: -52, y: 38, g: 90, k: 1.00 }];
const trails = simulate(FOCI_GIANT_NEIGHBOR);
const geoHash = geometryHash(trails);
const wear = replayDeposit(trails);
const st = stats(wear);
const W_SAT = W_SAT_ARG ? parseFloat(W_SAT_ARG.slice(6)) : 2 * st.medianNonZero; // median worn cell -> w~=0.5

console.log('=== Study XXIX wear — dry-run stats (giant-neighbor world) ===');
console.log('trails:', trails.length, 'geometry sha256:', geoHash);
console.log('wear field:', JSON.stringify(st));
console.log('W_SAT =', W_SAT, W_SAT_ARG ? '(arg)' : '(2 x median non-zero)');
console.log('wear-field sha256 (worn):', fieldHash(wear));

if (!DRY_RUN) {
    const worn = renderWorn(trails, wear, W_SAT, 'study-xxix-wear-worn.svg');
    console.log('WORN svg:', JSON.stringify(worn));
    const sh = shuffledCopy(wear);
    console.log('shuffled-field sha256:', fieldHash(sh), '(permutation seed', SHUFFLE_SEED + ')');
    const shuffled = renderWorn(trails, sh, W_SAT, 'study-xxix-wear-shuffled.svg');
    console.log('SHUFFLED svg:', JSON.stringify(shuffled));
}
// PROVENANCE: UNWORN anchor = committed scripts/study-xxviii-giant-neighbor-eraflat.svg (Block 165,
// extinction-witnesses-eraflat.js, FLAT_ERA_STYLE=true) — same world/seed/RNG pattern; its per-path opacity
// IS the tau-stripped formula this arm uses. Bit-for-bit reuse; no re-render.
