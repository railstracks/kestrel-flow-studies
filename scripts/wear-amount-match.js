// Wear arm-2 discriminator — Study XXXI "Census Match" implementation (Block 255).
// Bones: gallivanting/visual-studies/2026-10-06-wear-census-match-bones.md (this block, zero stimuli).
// Mechanism: replay PASSIVE + HABIT-R16 verbatim (hash-asserted vs Block 249 records), then re-bin a
// seeded uniform random subset of segments (minimal-flow solution from the probe) and render:
//   THINNED  = habit-r16 field/trails, census moved to PASSIVE's exactly (478 w=1: b2->b4;
//              232 w=3: b6->b4; 1801 w=4: b7->b6) — structure at matched amount.
//   SPECKLED = passive field/trails, same move multiset on passive's own classes (478/232/1801) —
//              artifact gate + amount-on-passive-structure arm.
// renderWorn is MODIFIED only by a per-(trail,seg) bin override map — grouping/geometry verbatim.
// ZERO stimuli viewed. SVGs written unviewed; read block is a separate session.
const fs = require('fs');
const crypto = require('crypto');

// ── verbatim simulation core (wear-worlds-active.js @ 8fdd514; identical copy in wear-amount-probe.js) ──
function mulberry32(seed) {
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
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
            const opacity = 0.35 + rand() * 0.40;
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
const GRID = 200;
const cellIndex = (col, row) => row * GRID + col;
const cellOf = (x, y) => {
    let cx = Math.min(GRID - 1, Math.max(0, Math.round(x) + 100));
    let cy = Math.min(GRID - 1, Math.max(0, Math.round(y) + 100));
    return cy * GRID + cx;
};
function geometryHash(trails) {
    const h = crypto.createHash('sha256');
    for (const t of trails) h.update(t.pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(';') + '\n');
    return h.digest('hex');
}
function fieldHash(arr) { return crypto.createHash('sha256').update(Buffer.from(arr)).digest('hex'); }
function replayDeposit(trails) {
    const w = new Uint16Array(GRID * GRID);
    for (const t of trails) for (let j = 1; j < t.pts.length; j++) {
        const mx = (t.pts[j-1][0] + t.pts[j][0]) / 2, my = (t.pts[j-1][1] + t.pts[j][1]) / 2;
        w[cellOf(mx, my)] += 1;
    }
    return w;
}
function sense(w, x, y, R) {
    const col0 = Math.round(x) + 100, row0 = Math.round(y) + 100;
    const R2 = R * R;
    let best = 0, bcol = 0, brow = 0;
    for (let row = row0 - R; row <= row0 + R; row++) {
        if (row < 0 || row >= GRID) continue;
        const dy = (row - 100) - y;
        for (let col = col0 - R; col <= col0 + R; col++) {
            if (col < 0 || col >= GRID) continue;
            const dx = (col - 100) - x;
            if (dx*dx + dy*dy > R2) continue;
            const v = w[cellIndex(col, row)];
            if (v > best) { best = v; bcol = col; brow = row; }
        }
    }
    return { best, bcol, brow };
}
function simulateActive(foci, opts) {
    const R = opts.R, beta = opts.beta, sign = opts.sign || 1, focusW = opts.focusW;
    const w = new Uint16Array(GRID * GRID);
    const order = [];
    for (let k = 0; k < COHORTS; k++) order.push(k);
    if (opts.order === 'rev') order.reverse();
    const trails = [];
    for (const k of order) {
        const tau = (k + 0.5) / COHORTS;
        const rand = mulberry32(31415 + k * 7919);
        for (let i = 0; i < TPC; i++) {
            let x = (rand() - 0.5) * 180, y = (rand() - 0.5) * 180;
            const opacity = 0.35 + rand() * 0.40;
            const pts = [[x, y]];
            for (let s = 0; s < TRAILLEN; s++) {
                if (Math.abs(x) > 95 || Math.abs(y) > 95) break;
                const f = focusSumVec(x, y, tau, foci);
                const a = ambient(x, y);
                const fm = Math.hypot(f.x, f.y), am = Math.hypot(a.x, a.y) || 1;
                let vx = (f.x / fm) * focusW + (a.x / am) * 0.25 * 0.6;
                let vy = (f.y / fm) * focusW + (a.y / am) * 0.25 * 0.6;
                const sn = sense(w, x, y, R);
                if (sn.best > 0 && beta > 0) {
                    const wtilde = Math.min(1, sn.best / 4);
                    let dxr = (sn.bcol - 100) - x, dyr = (sn.brow - 100) - y;
                    const dl = Math.hypot(dxr, dyr);
                    if (dl > 1e-9) {
                        vx += (dxr / dl) * (beta * wtilde) * sign;
                        vy += (dyr / dl) * (beta * wtilde) * sign;
                    }
                }
                const len = Math.hypot(vx, vy) || 1;
                const nx = x + (vx / len) * STEP, ny = y + (vy / len) * STEP;
                const mid = cellOf((x + nx) / 2, (y + ny) / 2);
                w[mid] += 1;
                x = nx; y = ny;
                pts.push([x, y]);
            }
            if (pts.length > 3) trails.push({ pts, opacity, tau, cohort: k });
        }
    }
    return { trails, wear: w };
}
// ── end verbatim core ──

const FOCI = [{ x: 42, y: -40, g: 38, k: 5.01 }, { x: -52, y: 38, g: 90, k: 1.00 }];
const W_SAT = 4, BIN_N = 8;
const binOfWear = w => Math.min(BIN_N - 1, Math.floor(Math.min(1, w / W_SAT) * BIN_N));
const BIN_OF_E = { 1: 2, 2: 4, 3: 6, 4: 7 };   // effective-wear class -> vocabulary bin
const MOVES = [                                  // (raw wear class, fromBin, toBin, count)
    { w: 1, from: 2, to: 4, n: 478 },
    { w: 3, from: 6, to: 4, n: 232 },
    { w: 4, from: 7, to: 6, n: 1801 },
];
const SEED_BASE = 20261006;                      // declared; +1 thinned, +2 speckled

// enumerate class members in canonical order: (trailIdx, segIdx j>=1) with midpoint raw wear == w
function classMembers(trails, wField, wTarget) {
    const out = [];
    for (let ti = 0; ti < trails.length; ti++) {
        const pts = trails[ti].pts;
        for (let j = 1; j < pts.length; j++) {
            const mx = (pts[j-1][0] + pts[j][0]) / 2, my = (pts[j-1][1] + pts[j][1]) / 2;
            if (wField[cellOf(mx, my)] === wTarget) out.push({ ti, j });
        }
    }
    return out;
}
function selectMoves(trails, wField, seed) {
    const rand = mulberry32(seed);
    const manifest = [];
    for (const mv of MOVES) {
        const members = classMembers(trails, wField, mv.w);
        if (members.length < mv.n) throw new Error(`class w=${mv.w} has ${members.length} < ${mv.n}`);
        // seeded Fisher-Yates over member indices, take first n
        const idx = members.map((_, i) => i);
        for (let i = idx.length - 1; i > 0; i--) {
            const j = Math.floor(rand() * (i + 1));
            [idx[i], idx[j]] = [idx[j], idx[i]];
        }
        for (let k = 0; k < mv.n; k++) {
            const m = members[idx[k]];
            manifest.push({ trail: m.ti, seg: m.j, wear: mv.w, fromBin: mv.from, toBin: mv.to });
        }
    }
    const override = new Map(manifest.map(m => [`${m.trail}:${m.seg}`, m.toBin]));
    return { override, manifest };
}

// renderWorn verbatim EXCEPT: bin override map consulted per segment (grouping follows overridden bins)
function renderWornMoved(trails, wField, override, outputPath) {
    const lerp = (a, b, t) => a + (b - a) * t;
    const A = [212, 162, 78], B = [138, 148, 160];
    const hex = c => '#' + [0,1,2].map(i => Math.round(lerp(A[i], B[i], c)).toString(16).padStart(2,'0')).join('');
    const wtildeDraw = bin => (bin + 0.5) / BIN_N;
    const lines = [];
    let paths = 0;
    for (let tIdx = 0; tIdx < trails.length; tIdx++) {
        const t = trails[tIdx];
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
            let b = binOfWear(wField[cellOf(mx, my)]);
            const ob = override.get(`${tIdx}:${j}`);
            if (ob !== undefined) b = ob;
            if (b !== runBin) { flush(j - 1); runBin = b; runStart = j; }
        }
        flush(t.pts.length - 1);
    }
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">\n  <rect width="1000" height="1000" fill="#101014"/>\n${lines.join('\n')}\n</svg>`;
    fs.writeFileSync(outputPath, svg);
    return { paths, bytes: svg.length };
}

// effective census (overrides applied) — same classification path as the renderer
function effectiveCensus(trails, wField, override) {
    const bins = {};
    for (let ti = 0; ti < trails.length; ti++) {
        const pts = trails[ti].pts;
        for (let j = 1; j < pts.length; j++) {
            const mx = (pts[j-1][0] + pts[j][0]) / 2, my = (pts[j-1][1] + pts[j][1]) / 2;
            let b = binOfWear(wField[cellOf(mx, my)]);
            const ob = override.get(`${ti}:${j}`);
            if (ob !== undefined) b = ob;
            bins[b] = (bins[b] || 0) + 1;
        }
    }
    return bins;
}

console.log('=== Study XXXI census-match implementation (zero stimuli viewed) ===');
// replay + W-GEO
const P = simulate(FOCI);
const Pw = replayDeposit(P);
const pg = geometryHash(P), pf = fieldHash(Pw);
console.log('[W-GEO passive]', pg.slice(0, 8), pg.startsWith('ca8dd7cd') ? 'OK' : 'FAIL', pf.slice(0, 8), pf.startsWith('f3684fd4') ? 'OK' : 'FAIL');
const H = simulateActive(FOCI, { R: 16, beta: 0.30, focusW: 0.60, order: 'fwd' });
const hg = geometryHash(H.trails), hf = fieldHash(H.wear);
console.log('[W-GEO habit-r16]', hg.slice(0, 8), hg.startsWith('5b4ff6e3') ? 'OK' : 'FAIL', hf.slice(0, 8), hf.startsWith('d2e65971') ? 'OK' : 'FAIL');

const PASSIVE_CENSUS = { 2: 6764, 4: 9388, 6: 9366, 7: 92082 };
const SPECKLED_CENSUS = { 2: 6286, 4: 10098, 6: 10935, 7: 90281 };

function buildArm(name, trails, wField, seedOff, targetCensus, outPath) {
    const { override, manifest } = selectMoves(trails, wField, SEED_BASE + seedOff);
    const r = renderWornMoved(trails, wField, override, outPath);
    const cens = effectiveCensus(trails, wField, override);
    const okC = JSON.stringify(cens) === JSON.stringify(targetCensus);
    const okB = Object.keys(cens).every(k => [0, 2, 4, 6, 7].includes(Number(k)));
    console.log(`[${name}] seed ${SEED_BASE + seedOff} moves ${manifest.length} (W-MANIFEST ${manifest.length === 2511 ? 'OK' : 'FAIL'})`);
    console.log(`[${name}] census ${JSON.stringify(cens)} ${okC ? '== target OK (W-CENSUS)' : '!= target ' + JSON.stringify(targetCensus) + ' FAIL'}`);
    console.log(`[${name}] W-BINS ${okB ? 'OK vocabulary-only' : 'FAIL non-vocabulary bin emitted'}`);
    console.log(`[${name}] svg paths ${r.paths} bytes ${r.bytes} -> ${outPath} (W-PATHS; seam-delta vs source run-grouping declared)`);
    fs.writeFileSync(`.study-xxxi-manifest-${name}.json`, JSON.stringify(manifest, null, 0));
    return { name, census: cens, paths: r.paths, bytes: r.bytes, moves: manifest.length };
}

const t1 = buildArm('thinned', H.trails, H.wear, 1, PASSIVE_CENSUS, 'study-xxxi-wear-thinned.svg');
const t2 = buildArm('speckled', P, Pw, 2, SPECKLED_CENSUS, 'study-xxxi-wear-speckled.svg');
fs.writeFileSync('.study-xxxi-match-runs.json', JSON.stringify({ seedBase: SEED_BASE, passive: { geo: pg, field: pf }, habit: { geo: hg, field: hf }, arms: [t1, t2] }, null, 1));
console.log('[written] study-xxxi-wear-thinned.svg, study-xxxi-wear-speckled.svg, manifests, .study-xxxi-match-runs.json — ALL UNVIEWED');
