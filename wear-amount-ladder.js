// Wear arm-2 — Study XXXIII "Amount Ladder" implementation (Block 267).
// Bones: gallivanting/visual-studies/2026-10-09-wear-amount-ladder-bones.md (zero stimuli viewed).
// J3's declared arm (Finding 24): dose-response on the census delta once texture is silenced.
// Rungs f ∈ {0.25, 0.50, 0.75, 1.00} of the XXXI/XXXII move multiset, each carried by XXXII's
// delta-0 boundary migration VERBATIM. Each rung migrates INDEPENDENTLY from pristine habit
// bins. f100 MUST reproduce the committed SEAMLESS SVG bit-identically (W-ANCHOR witness).
// Read pairs (read block): P-L25/L50/L75 = HABIT(f0) vs rung, + P3′ (P-L100) reused from XXXII.
// Core + renderer verbatim from wear-seam-freeze.js @ 7c22a1a. ZERO stimuli viewed.
const fs = require('fs');
const crypto = require('crypto');

// ── verbatim simulation core (wear-worlds-active.js @ 8fdd514) ──
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
const HABIT_RUNS = 21203;                        // Block 249/255/260 record (W-PATHS ceiling)
const HABIT_CENSUS = { 2: 7242, 4: 8678, 6: 7797, 7: 93883 };
const PASSIVE_CENSUS = { 2: 6764, 4: 9388, 6: 9366, 7: 92082 };
const BASE_MOVES = [                             // Study XXXI/XXXII multiset (class order fixed)
    { w: 1, from: 2, to: 4, n: 478 },
    { w: 3, from: 6, to: 4, n: 232 },
    { w: 4, from: 7, to: 6, n: 1801 },
];
const RUNGS = [
    { name: 'f25',  f: 0.25, seed: 20261011 },
    { name: 'f50',  f: 0.50, seed: 20261012 },
    { name: 'f75',  f: 0.75, seed: 20261013 },
    { name: 'f100', f: 1.00, seed: 20261010 },   // XXXII's seed → W-ANCHOR reproduction
];

function appliedBins(trails, wField) {
    return trails.map(t => {
        const b = new Uint8Array(t.pts.length);
        for (let j = 1; j < t.pts.length; j++) {
            const mx = (t.pts[j-1][0] + t.pts[j][0]) / 2, my = (t.pts[j-1][1] + t.pts[j][1]) / 2;
            b[j] = binOfWear(wField[cellOf(mx, my)]);
        }
        return b;
    });
}
function countRuns(bins) {
    let runs = 0;
    for (const b of bins) {
        if (b.length < 2) continue;
        for (let j = 1; j < b.length; j++) if (b[j] !== b[j-1] || j === 1) runs++;
    }
    return runs;
}
// delta-0 strict boundary migration — verbatim logic from wear-seam-freeze.js @ 7c22a1a,
// parameterized by the rung's move list (class order preserved).
function migrate(trails, bins, moves, seed) {
    const rand = mulberry32(seed);
    const manifest = [];
    const context = [];
    const deltaHist = {};
    let widened = 0;
    for (const mv of moves) {
        for (let n = 0; n < mv.n; n++) {
            const elig = [];
            for (let ti = 0; ti < bins.length; ti++) {
                const b = bins[ti], m = b.length;
                for (let j = 1; j < m; j++) {
                    if (b[j] !== mv.from) continue;
                    const hasT = (j > 1 && b[j-1] === mv.to) || (j < m-1 && b[j+1] === mv.to);
                    if (!hasT) continue;
                    const db = (j>1 && b[j-1] !== mv.to ? 1:0) + (j<m-1 && b[j+1] !== mv.to ? 1:0)
                             - (j>1 && b[j-1] !== mv.from ? 1:0) - (j<m-1 && b[j+1] !== mv.from ? 1:0);
                    if (db === 0) elig.push({ ti, j, side: (j>1 && b[j-1]===mv.to) ? 'L' : 'R' });
                }
            }
            if (elig.length === 0) throw new Error(`starved (delta-0 pool empty): move ${mv.from}->${mv.to} at ${n}/${mv.n}`);
            const e = elig[Math.floor(rand() * elig.length)];
            bins[e.ti][e.j] = mv.to;
            manifest.push({ trail: e.ti, seg: e.j, wear: mv.w, fromBin: mv.from, toBin: mv.to });
            context.push({ trail: e.ti, seg: e.j, side: e.side });
            deltaHist[0] = (deltaHist[0] || 0) + 1;
        }
    }
    return { override: new Map(manifest.map(m => [`${m.trail}:${m.seg}`, m.toBin])), manifest, context, deltaHist, widened };
}
// depth histogram: contiguous same-trail same-move incursions (Block 261 decode definition)
function depthHistogram(manifest) {
    const byTrail = new Map();
    for (const m of manifest) {
        if (!byTrail.has(m.trail)) byTrail.set(m.trail, []);
        byTrail.get(m.trail).push(m);
    }
    const hist = {}; let events = 0, total = 0;
    for (const list of byTrail.values()) {
        list.sort((a, b) => a.seg - b.seg);
        let depth = 0, key = null;
        const flush = () => { if (depth > 0) { hist[depth] = (hist[depth] || 0) + 1; events++; total += depth; } };
        for (const m of list) {
            const k = `${m.fromBin}->${m.toBin}`;
            if (depth > 0 && k === key && m.seg === lastSeg + 1) { depth++; }
            else { flush(); depth = 1; key = k; }
            lastSeg = m.seg;
        }
        flush();
        var lastSeg; // hoisted per-trail
    }
    return { events, hist, maxDepth: Math.max(0, ...Object.keys(hist).map(Number)), meanDepth: events ? +(total / events).toFixed(3) : 0 };
}
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
const md5 = p => crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex');

// ── run ──
console.log('=== Study XXXIII amount ladder implementation (zero stimuli viewed) ===');
const P = simulate(FOCI);
const Pw = replayDeposit(P);
const pg = geometryHash(P), pf = fieldHash(Pw);
console.log('[W-GEO passive]', pg.slice(0, 8), pg.startsWith('ca8dd7cd') ? 'OK' : 'FAIL', pf.slice(0, 8), pf.startsWith('f3684fd4') ? 'OK' : 'FAIL');
const H = simulateActive(FOCI, { R: 16, beta: 0.30, focusW: 0.60, order: 'fwd' });
const hg = geometryHash(H.trails), hf = fieldHash(H.wear);
console.log('[W-GEO habit-r16]', hg.slice(0, 8), hg.startsWith('5b4ff6e3') ? 'OK' : 'FAIL', hf.slice(0, 8), hf.startsWith('d2e65971') ? 'OK' : 'FAIL');
const HC = JSON.stringify(effectiveCensus(H.trails, H.wear, new Map()));
console.log('[habit census]', HC, HC === JSON.stringify(HABIT_CENSUS) ? '== record OK' : 'FAIL');

const runsRec = { passive: { geo: pg, field: pf }, habit: { geo: hg, field: hf }, rungs: [] };
for (const rung of RUNGS) {
    const moves = BASE_MOVES.map(m => ({ ...m, n: Math.round(m.n * rung.f) }));
    const n24 = moves[0].n, n64 = moves[1].n, n76 = moves[2].n;
    const target = { 2: 7242 - n24, 4: 8678 + n24 + n64, 6: 7797 - n64 + n76, 7: 93883 - n76 };
    const bins0 = appliedBins(H.trails, H.wear);            // pristine per rung (D3)
    const runs0 = countRuns(bins0);
    if (runs0 !== HABIT_RUNS) throw new Error(`rung ${rung.name}: pristine runs ${runs0} != ${HABIT_RUNS}`);
    const { override, manifest, context, deltaHist, widened } = migrate(H.trails, bins0, moves, rung.seed);
    const runs1 = countRuns(bins0);
    const okRuns = runs1 === runs0;
    console.log(`\n--- rung ${rung.name} (f=${rung.f}, seed ${rung.seed}, moves ${n24}/${n64}/${n76} = ${manifest.length}) ---`);
    console.log('[W-RUNS-FROZEN]', runs1, '== habit verbatim', runs0, okRuns ? 'OK EXACT' : 'FAIL');
    console.log('[W-NEUTRAL]', JSON.stringify(deltaHist), '| widened', widened,
        (Object.keys(deltaHist).every(d => Number(d) <= 0) && widened === 0) ? 'OK zero-create zero-delete' : 'FAIL');
    const perClass = moves.map(m => manifest.filter(x => x.fromBin === m.from && x.toBin === m.to).length);
    console.log('[W-MANIFEST]', manifest.length, 'flips | per-class', perClass.join('/'),
        perClass.every((c, i) => c === moves[i].n) ? 'OK' : 'FAIL');
    const outPath = rung.name === 'f100' ? '.tmp-anchor-f100.svg' : `study-xxxiii-wear-ladder-${rung.name}.svg`;
    const r = renderWornMoved(H.trails, H.wear, override, outPath);
    const cens = effectiveCensus(H.trails, H.wear, override);
    const okC = JSON.stringify(cens) === JSON.stringify(target);
    console.log('[W-CENSUS]', JSON.stringify(cens), okC ? '== derived target OK' : 'FAIL vs ' + JSON.stringify(target));
    const okB = Object.keys(cens).every(k => [0, 2, 4, 6, 7].includes(Number(k)));
    console.log('[W-BINS]', okB ? 'OK vocabulary-only' : 'FAIL non-vocabulary bin');
    console.log('[W-PATHS]', r.paths, r.paths === runs1 ? '== counted runs OK' : `MISMATCH counted ${runs1}`);
    const dh = depthHistogram(manifest);
    console.log('[depth]', JSON.stringify(dh));
    const sides = context.reduce((a, c) => { a[c.side] = (a[c.side] || 0) + 1; return a; }, {});
    console.log('[migration context]', JSON.stringify(sides));
    if (rung.name === 'f100') {
        const anchorMd5 = md5('.tmp-anchor-f100.svg'), committedMd5 = md5('study-xxxii-wear-seamless.svg');
        console.log('[W-ANCHOR] render md5', anchorMd5.slice(0, 8), 'vs committed seamless', committedMd5.slice(0, 8),
            anchorMd5 === committedMd5 ? 'OK BIT-IDENTICAL REPRODUCTION' : 'FAIL');
        fs.unlinkSync('.tmp-anchor-f100.svg');
        rung.anchor = { renderMd5: anchorMd5, committedMd5, reproduced: anchorMd5 === committedMd5 };
    } else {
        fs.writeFileSync(`.study-xxxiii-manifest-${rung.name}.json`, JSON.stringify(manifest, null, 0));
    }
    rung.result = { census: cens, target, paths: r.paths, runsFinal: runs1, flips: manifest.length,
        perClass, deltaHist, depth: dh, sideMix: sides, seed: rung.seed, f: rung.f };
    runsRec.rungs.push({ name: rung.name, f: rung.f, seed: rung.seed, moves: perClass,
        census: cens, paths: r.paths, runsFinal: runs1, depth: dh, sideMix: sides,
        ...(rung.anchor ? { anchor: rung.anchor } : {}) });
}
fs.writeFileSync('.study-xxxiii-ladder-runs.json', JSON.stringify(runsRec, null, 1));
console.log('\n[written] 3 ladder SVGs + manifests + runs — ALL UNVIEWED');
