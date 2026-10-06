// Wear arm-2 discriminator (Study XXXI) — AMOUNT PROBE (Block 255 design support).
// Purpose: measure segment-level applied-bin censuses for PASSIVE vs HABIT-R16, and derive
// monotone threshold maps g(raw wear -> effective wear) that transport one census toward the
// other, subject to: tie-consistency (equal raw wear -> equal bin, always), monotonicity,
// g(0)=0 (never un-zero), and vocabulary constraint (only bins {0,2,4,6,7} ever emitted).
// ZERO stimuli rendered or viewed. Stats only. Not a study artifact — a design input.
//
// Grounding: wear-worlds-active.js verbatim functions (ambient/focusSumVec/simulate/cellOf/
// geometryHash/fieldHash/replayDeposit/simulateActive) — copied from the committed file at
// repo 8fdd514. Hash assertions pin the replay to Block 249's recorded values:
//   PASSIVE geo (polyline) prefix ca8dd7cd, field prefix f3684fd4
//   HABIT-R16 geo prefix 5b4ff6e3, field prefix d2e65971
const fs = require('fs');
const crypto = require('crypto');

// ── verbatim simulation core (from scripts/wear-worlds-active.js) ──
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
function fieldHash(arr) {
    return crypto.createHash('sha256').update(Buffer.from(arr)).digest('hex');
}
function replayDeposit(trails) {
    const w = new Uint16Array(GRID * GRID);
    for (const t of trails) for (let j = 1; j < t.pts.length; j++) {
        const mx = (t.pts[j-1][0] + t.pts[j][0]) / 2, my = (t.pts[j-1][1] + t.pts[j][1]) / 2;
        w[cellOf(mx, my)] += 1;
    }
    return w;
}
// sense/simulateActive: verbatim (R, beta, focusW, order)
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
            const myCells = new Set();
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
                myCells.add(mid);
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

// segment census exactly as renderWorn classifies (midpoint cell wear -> bin), plus raw-wear values
function segmentCensus(trails, wField) {
    const bins = {};               // bin -> segment count
    const rawWears = [];           // per-segment midpoint raw wear (for threshold search)
    let segs = 0;
    for (const t of trails) {
        for (let j = 1; j < t.pts.length; j++) {
            const mx = (t.pts[j-1][0] + t.pts[j][0]) / 2, my = (t.pts[j-1][1] + t.pts[j][1]) / 2;
            const wv = wField[cellOf(mx, my)];
            const b = binOfWear(wv);
            bins[b] = (bins[b] || 0) + 1;
            rawWears.push(wv);
            segs++;
        }
    }
    rawWears.sort((a, b) => a - b);
    return { bins, rawWears, segs };
}
// monotone threshold map: e(w)=0 if w<=a; 1 if a<w<=b; 2 if b<w<=c; 3 if c<w<=d; 4 if w>d
function applyMap(rawWears, a, b, c, d) {
    const out = { 0: 0, 2: 0, 4: 0, 6: 0, 7: 0 };
    for (const w of rawWears) {
        const e = w <= a ? 0 : w <= b ? 1 : w <= c ? 2 : w <= d ? 3 : 4;
        out[{0:0,1:2,2:4,3:6,4:7}[e]]++;
    }
    return out;
}
function tvDist(m1, m2, total) {
    let tv = 0;
    for (const k of [0, 2, 4, 6, 7]) tv += Math.abs((m1[k] || 0) - (m2[k] || 0));
    return tv / (2 * total);
}
// efficient search: cumulative counts + boundary-local candidate sets (source has NO bin-0 segments —
// every segment midpoint carries its own trail's deposit (w>=1); a pinned 0, bin-0 stays empty).
function cumTable(rawWears) {
    const distinct = [...new Set(rawWears)].sort((x, y) => x - y);
    const cum = [];                 // cum[i] = #segments with wear <= distinct[i]
    let ci = 0;
    for (let i = 0; i < distinct.length; i++) {
        while (ci < rawWears.length && rawWears[ci] <= distinct[i]) ci++;
        cum.push(ci);
    }
    return { distinct, cum, total: rawWears.length };
}
const cumAt = (tbl, w) => {           // #segments with wear <= w
    let lo = 0, hi = tbl.distinct.length - 1, ans = 0;
    while (lo <= hi) { const m = (lo + hi) >> 1; if (tbl.distinct[m] <= w) { ans = tbl.cum[m]; lo = m + 1; } else hi = m - 1; }
    return ans;
};
function searchBest(rawWears, target) {
    const tbl = cumTable(rawWears);
    const t1 = target.bins[2] || 0;                 // cum boundary after bin-2 class
    const t2 = t1 + (target.bins[4] || 0);
    const t3 = t2 + (target.bins[6] || 0);
    const SLACK = 3000;
    const candsNear = t => {                          // distinct wear values whose cum brackets t (+/- SLACK)
        const out = [];
        for (let i = 0; i < tbl.distinct.length; i++) {
            if (tbl.cum[i] >= t - SLACK && tbl.cum[i] <= t + SLACK) out.push(tbl.distinct[i]);
        }
        if (!out.length) {                           // fall back: nearest single value
            let best = tbl.distinct[0];
            for (const w of tbl.distinct) if (Math.abs(cumAt(tbl, w) - t) < Math.abs(cumAt(tbl, best) - t)) best = w;
            out.push(best);
        }
        return out;
    };
    const B = candsNear(t1), C = candsNear(t2), D = candsNear(t3);
    let best = null;
    for (const b of B) for (const c of C) for (const d of D) {
        if (b > c || c > d) continue;
        const n2 = cumAt(tbl, b), n4 = cumAt(tbl, c) - n2, n6 = cumAt(tbl, d) - cumAt(tbl, c), n7 = tbl.total - cumAt(tbl, d);
        const m = { 2: n2, 4: n4, 6: n6, 7: n7 };
        const tv = tvDist(m, target.bins, tbl.total);
        if (!best || tv < best.tv - 1e-12) best = { b, c, d, tv, map: m };
    }
    return best;
}

console.log('=== Study XXXI amount probe (design input; zero stimuli) ===');
const P = simulate(FOCI);          // returns the trails ARRAY
const Pw = replayDeposit(P);
const pg = geometryHash(P), pf = fieldHash(Pw);
console.log('[passive] geo', pg.slice(0, 8), pg.startsWith('ca8dd7cd') ? 'OK' : 'FAIL', 'field', pf.slice(0, 8), pf.startsWith('f3684fd4') ? 'OK' : 'FAIL');
const H = simulateActive(FOCI, { R: 16, beta: 0.30, focusW: 0.60, order: 'fwd' });
const hg = geometryHash(H.trails), hf = fieldHash(H.wear);
console.log('[habit-r16] geo', hg.slice(0, 8), hg.startsWith('5b4ff6e3') ? 'OK' : 'FAIL', 'field', hf.slice(0, 8), hf.startsWith('d2e65971') ? 'OK' : 'FAIL');

const pc = segmentCensus(P, Pw);
const hc = segmentCensus(H.trails, H.wear);
console.log('[passive] segs', pc.segs, 'bins', JSON.stringify(pc.bins));
console.log('[habit-r16] segs', hc.segs, 'bins', JSON.stringify(hc.bins));
// raw wear distribution summary (segment midpoint cells)
const q = (arr, p) => arr[Math.floor(arr.length * p)];
console.log('[passive] seg-wear quantiles p50/p75/p90/p95/p99/max:', q(pc.rawWears, .5), q(pc.rawWears, .75), q(pc.rawWears, .9), q(pc.rawWears, .95), q(pc.rawWears, .99), pc.rawWears[pc.rawWears.length - 1]);
console.log('[habit-r16] seg-wear quantiles p50/p75/p90/p95/p99/max:', q(hc.rawWears, .5), q(hc.rawWears, .75), q(hc.rawWears, .9), q(hc.rawWears, .95), q(hc.rawWears, .99), hc.rawWears[hc.rawWears.length - 1]);

// search executed by the cumulative-count searchBest defined above (the original brute-force
// version was removed — it rescanned 117,600 segments per combo and shadowed the new definition).
const deg = searchBest(hc.rawWears, pc);   // DEGRADED: habit structure, passive amounts
const enh = searchBest(pc.rawWears, hc);   // ENHANCED: passive structure, habit amounts
console.log('[DEGRADED map] b,c,d =', deg.b, deg.c, deg.d, 'TV', deg.tv.toFixed(6));
console.log('[DEGRADED achieved bins]', JSON.stringify(deg.map), 'vs passive target', JSON.stringify(pc.bins));
console.log('[ENHANCED map] b,c,d =', enh.b, enh.c, enh.d, 'TV', enh.tv.toFixed(6));
console.log('[ENHANCED achieved bins]', JSON.stringify(enh.map), 'vs habit target', JSON.stringify(hc.bins));
// zero-class is structurally empty at the segment layer (own-deposit floor) — print anyway as witness
console.log('[zero-class] passive bin0 segs:', pc.bins[0] || 0, '| habit bin0 segs:', hc.bins[0] || 0, '(own-deposit floor: segments cannot be unworn)');
// identity check: identity map (b=1,c=2,d=3) reproduces source census exactly
const idP = applyMap(pc.rawWears, 0, 1, 2, 3);
const idCmp = { 2: idP[2], 4: idP[4], 6: idP[6], 7: idP[7] };
const tgtCmp = { 2: pc.bins[2] || 0, 4: pc.bins[4] || 0, 6: pc.bins[6] || 0, 7: pc.bins[7] || 0 };
console.log('[identity-check passive]', JSON.stringify(idCmp) === JSON.stringify(tgtCmp) ? 'OK identity reproduces source census' : 'FAIL ' + JSON.stringify(idCmp));
// where does the top-class split land? within-top-class low-end wear histogram (context for d)
for (const [nm, cens] of [['passive', pc], ['habit-r16', hc]]) {
    const hi = {};
    for (const w of cens.rawWears) if (w >= 4 && w <= 40) hi[w] = (hi[w] || 0) + 1;
    console.log(`[${nm}] segs by wear 4..40:`, JSON.stringify(hi));
}
fs.writeFileSync('.study-xxxi-probe.json', JSON.stringify({
    passive: { segs: pc.segs, bins: pc.bins, quantiles: { p50: q(pc.rawWears, .5), p90: q(pc.rawWears, .9), p99: q(pc.rawWears, .99) } },
    habit: { segs: hc.segs, bins: hc.bins, quantiles: { p50: q(hc.rawWears, .5), p90: q(hc.rawWears, .9), p99: q(hc.rawWears, .99) } },
    degraded: { b: deg.b, c: deg.c, d: deg.d, tv: deg.tv, bins: deg.map },
    enhanced: { b: enh.b, c: enh.c, d: enh.d, tv: enh.tv, bins: enh.map },
}, null, 1));
console.log('[written] .study-xxxi-probe.json');
