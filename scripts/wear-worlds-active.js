// Wear Worlds — Study XXX, arm 2 ("Desire Paths", active wear).
// Bones: gallivanting/visual-studies/2026-10-05-wear-worlds-arm2-bones.md (Block 248, zero stimuli).
// Block 249 implementation pass, Oct 5 2026. ZERO instrument reads, ZERO stimuli viewed this session.
//
// DESIGN (pre-registered in bones §2; deviations NONE):
//   - Arm-1 code VERBATIM below (ambient/focusSumVec/simulate/cellOf/geometryHash/fieldHash/
//     replayDeposit/renderWorn/stats untouched). PASSIVE lane re-runs that exact path and md5-asserts
//     == committed study-xxix-wear-worn.svg (styling-drift tripwire = bones defect #3).
//   - simulateActive(): ONE added step term. sense(x,y) = max wear over cells whose CENTER lies within
//     radius R (inclusive <=, integer R); wtilde_s = min(1, sense/W_SAT); response = d * (beta * wtilde_s),
//     d = unit vector toward the argmax cell (deterministic tie-break: first in row-asc/col-asc scan).
//     habit: v = (f/fhat)*0.60 + (a/ahat)*0.25*0.6 + d*(beta*wtilde_s)  [sign=+1]
//     erosion (reserve, unrun): same with sign=-1 (+ depletion stop rule, NOT implemented here).
//     Step: normalize v, advance STEP. Focus 0.75->0.60 declared (bones defect #4).
//   - NO new rand() anywhere: per-cohort RNG call count asserted === 420 === arm-1 (defect #2).
//   - Incremental deposition at generation time (segment midpoint cell, BEFORE later steps sense it);
//     trails discarded by arm-1's filter (pts.length <= 3) are rolled back (they deposit nothing in
//     arm-1's replay). Faithfulness proven by W-REFACTOR: beta=0 @ focus 0.75 must reproduce arm-1's
//     geometry hash AND final field hash exactly.
//   - beta=0 @ focus 0.60 = "rescaled passive" stats lane (defect #4 quantification; stats only).
//   - Encounter log (mechanical ground truth, written before any read): raw activation = step with
//     wtilde_s > 0 (the bones' response-rate denominator); episode-defining activation = wtilde_s >= 0.5
//     ("meaningful-wear encounter" — raw activation saturates at 99.98% for R=16 in a 57%-covered
//     field, which would collapse every R16 trail into one giant episode; threshold declared here,
//     pre-read). Episode = maximal run of consecutive thresholded activation steps. Classes (DECLARED):
//       miss      : max single-step deflection < 2 deg
//       merge     : episode reaches the trail's final step AND lasted >= 20 steps AND net heading
//                   change across the episode >= 15 deg (funneled in and pulled around)
//       bend      : otherwise (survive + deflect; includes short ends-in-encounter episodes)
//       dead-end  : walker halts at encounter — structurally impossible in habit arms (erosion only);
//                   its absence is data
//     Self vs cross: argmax cell's LAST depositor (surviving trails only; own trail counted as self).
//   - Reversal rider: cohorts executed k=11..0 (per-cohort seed/tau unchanged), stats + per-cohort
//     hashes only — the (seed, order) non-commutativity datum. Declared on R16 (the high-response arm).
//
// Usage: node scripts/wear-worlds-active.js --agenda=calibrate|witnesses|study
//   calibrate : beta ladder x R, stats only (no SVGs)
//   witnesses : PASSIVE md5 anchor + W-REFACTOR + RNG counts + rescaled-passive stats
//   study     : final habit runs (R4, R16 at calibrated beta), witnesses, renders, encounter log, reversal
const fs = require('fs');
const crypto = require('crypto');

const AGENDA = (process.argv.find(a => a.startsWith('--agenda=')) || '--agenda=calibrate').slice(9);
const W_SAT = 4;                    // frozen from arm-1 dry-run (bones: do not restyle)
const PASSIVE_SVG = 'study-xxix-wear-worn.svg';           // committed anchor, repo root
const PASSIVE_MD5 = '41ff3c326454034937342c11d117eec5';   // recorded Oct 5 from the committed file
const ARM1_DHASH_PREFIX = '810fe0bf'; // Block 229/236 recorded d-string hash (wear-witness.js method)
const ARM1_POLYLINE_PREFIX = 'ca8dd7cd'; // polyline-serialization hash derived Oct 5 under a
                                         // bit-identical (md5-checked) passive render — recorded ref
const EP_WT_THRESHOLD = 0.5;        // episode-defining sensed-wear threshold (declared above)

function mulberry32(seed) {
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
// ── simulation: VERBATIM from wear-worlds.js (arm 1) ──
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
function cohortHashes(trails) { // per-cohort hashes IN EXECUTION ORDER (bones §5 witness)
    const byC = new Map();
    for (const t of trails) { if (!byC.has(t.cohort)) byC.set(t.cohort, []); byC.get(t.cohort).push(t); }
    return [...byC.keys()].sort((a, b) => a - b).map(k => {
        const h = crypto.createHash('sha256');
        for (const t of byC.get(k)) h.update(t.pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(';') + '\n');
        return { cohort: k, hash: h.digest('hex') };
    });
}
// d-string serialization: wear-witness.js's method (SVG coords, 'M'/'L' per point, per trail) —
// this is the serialization the Block 229/236 '810fe0bf' record refers to.
function dStringHash(trails) {
    const s = trails.map(t => t.pts.map((p, i) => {
        const sx = (p[0] + 100) * 5, sy = (100 - p[1]) * 5;
        return (i === 0 ? 'M' : 'L') + sx.toFixed(1) + ' ' + sy.toFixed(1);
    }).join(' ')).join('\n');
    return crypto.createHash('sha256').update(s).digest('hex');
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

function stats(wField) {
    const nz = []; for (const v of wField) if (v > 0) nz.push(v);
    nz.sort((a,b) => a-b);
    const med = nz.length ? nz[Math.floor(nz.length/2)] : 0;
    const max = nz.length ? nz[nz.length-1] : 0;
    const total = nz.reduce((s,v) => s+v, 0);
    return { cellsNonZero: nz.length, cellsTotal: GRID*GRID, medianNonZero: med, p90: nz[Math.floor(nz.length*0.9)] || 0, max, total, coverage: +(nz.length/(GRID*GRID)).toFixed(4) };
}
function stats2(wField) { // stats + corridor-monopoly share (top 1% of nonzero cells by wear)
    const s = stats(wField);
    const nz = []; for (const v of wField) if (v > 0) nz.push(v);
    nz.sort((a,b) => b-a);
    const topN = Math.max(1, Math.ceil(0.01 * nz.length));
    let topSum = 0; for (let i = 0; i < topN && i < nz.length; i++) topSum += nz[i];
    s.top1pctShare = s.total ? +(topSum / s.total).toFixed(3) : 0;
    return s;
}

// ── ACTIVE LANE ──
// sense: max wear over cells whose CENTER is within radius R of (x, y). Deterministic tie-break:
// first argmax in row-ascending, col-ascending scan. Returns {best, bcol, brow} (best=0 if none).
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
const ANG = 180 / Math.PI;
// simulateActive: incremental deposition + wear response. opts: {R, beta, sign, focusW, order ('fwd'|'rev'), collectEncounters}
function simulateActive(foci, opts) {
    const R = opts.R, beta = opts.beta, sign = opts.sign || 1, focusW = opts.focusW;
    const w = new Uint16Array(GRID * GRID);
    const lastTrail = new Int32Array(GRID * GRID).fill(-1); // last SURVIVING depositor (trail seq)
    const order = [];
    for (let k = 0; k < COHORTS; k++) order.push(k);
    if (opts.order === 'rev') order.reverse();
    const trails = [];
    const rngCounts = {};               // cohort -> rand() call count (assert === 420)
    const encounters = [];              // per-trail episode records (mechanical)
    let stepsTotal = 0, stepsActivated = 0;
    let seq = 0;
    for (const k of order) {
        const tau = (k + 0.5) / COHORTS;
        let count = 0;
        const randRaw = mulberry32(31415 + k * 7919);
        const rand = () => { count++; return randRaw(); };
        for (let i = 0; i < TPC; i++) {
            let x = (rand() - 0.5) * 180, y = (rand() - 0.5) * 180;
            const opacity = 0.35 + rand() * 0.40; // SAME rand() consumption as arm 1
            const pts = [[x, y]];
            const myDeposits = [];       // [cellIdx] in deposition order (for rollback / self-flush)
            const myCells = new Set();   // for self-vs-cross classification during own walk
            const activations = [];      // {j, x, y, wtilde, self, deflDeg}
            for (let s = 0; s < TRAILLEN; s++) {
                if (Math.abs(x) > 95 || Math.abs(y) > 95) break;
                const f = focusSumVec(x, y, tau, foci);
                const a = ambient(x, y);
                const fm = Math.hypot(f.x, f.y), am = Math.hypot(a.x, a.y) || 1;
                let vx = (f.x / fm) * focusW + (a.x / am) * 0.25 * 0.6;
                let vy = (f.y / fm) * focusW + (a.y / am) * 0.25 * 0.6;
                const sn = sense(w, x, y, R);
                if (sn.best > 0) {
                    const wtilde = Math.min(1, sn.best / W_SAT);
                    let dxr = (sn.bcol - 100) - x, dyr = (sn.brow - 100) - y;
                    const dl = Math.hypot(dxr, dyr);
                    const isSelf = lastTrail[cellIndex(sn.bcol, sn.brow)] === seq || myCells.has(cellIndex(sn.bcol, sn.brow));
                    let deflDeg = null;
                    if (dl > 1e-9 && beta > 0) {
                        dxr /= dl; dyr /= dl;
                        const rx = dxr * (beta * wtilde) * sign, ry = dyr * (beta * wtilde) * sign;
                        const nwx = vx / (Math.hypot(vx, vy) || 1), nwy = vy / (Math.hypot(vx, vy) || 1);
                        vx += rx; vy += ry;
                        const nvx = vx / (Math.hypot(vx, vy) || 1), nvy = vy / (Math.hypot(vx, vy) || 1);
                        const dot = Math.max(-1, Math.min(1, nwx * nvx + nwy * nvy));
                        deflDeg = +(Math.acos(dot) * ANG).toFixed(2);
                    } else if (dl <= 1e-9) {
                        // walker stands on the argmax center: direction undefined, term contributes 0
                    }
                    activations.push({ j: s + 1, x: +x.toFixed(2), y: +y.toFixed(2), wtilde: +wtilde.toFixed(3), self: isSelf, deflDeg, ep: wtilde >= EP_WT_THRESHOLD });
                    stepsActivated++;
                }
                const len = Math.hypot(vx, vy) || 1;
                const nx = x + (vx / len) * STEP, ny = y + (vy / len) * STEP;
                const mid = cellOf((x + nx) / 2, (y + ny) / 2);
                if (w[mid] > 65000) throw new Error('wear overflow guard fired (cell > 65000) — collapse beyond design');
                w[mid] += 1;                          // deposit at generation time
                myDeposits.push(mid); myCells.add(mid);
                x = nx; y = ny;
                pts.push([x, y]);
                stepsTotal++;
            }
            if (pts.length > 3) {
                trails.push({ pts, opacity, tau, cohort: k });
                for (const c of myDeposits) lastTrail[c] = seq; // flush AFTER survival (sequential gen: no interleaving)
                if (activations.length) encounters.push({ trail: seq, cohort: k, activations, pts, ptsLen: pts.length });
                seq++;
            } else {
                for (const c of myDeposits) w[c] -= 1;  // rollback: discarded trails deposit nothing (arm-1 parity)
            }
        }
        rngCounts[k] = count;
    }
    // episode grouping + mechanical class assignment (declared in header + prereg)
    const episodes = [];
    for (const enc of encounters) {
        const acts = enc.activations;
        const epActs = acts.filter(a => a.ep);
        const hdg = idx => {
            if (idx >= enc.pts.length - 1) idx = enc.pts.length - 2;
            if (idx < 0) idx = 0;
            return Math.atan2(enc.pts[idx + 1][1] - enc.pts[idx][1], enc.pts[idx + 1][0] - enc.pts[idx][0]) * ANG;
        };
        const wrapDeg = d => ((d + 180) % 360 + 360) % 360 - 180;
        let i = 0;
        while (i < epActs.length) {
            let j = i;
            while (j + 1 < epActs.length && epActs[j + 1].j === epActs[j].j + 1) j++;
            const ep = epActs.slice(i, j + 1);
            const maxDefl = Math.max(...ep.map(a => (a.deflDeg === null ? 0 : a.deflDeg)));
            const endsAtTrailEnd = ep[ep.length - 1].j >= enc.ptsLen - 1;
            const lenSteps = ep.length;
            const netHeading = Math.abs(wrapDeg(hdg(ep[ep.length - 1].j) - hdg(ep[0].j - 2)));
            let cls;
            if (maxDefl < 2) cls = 'miss';
            else if (endsAtTrailEnd && lenSteps >= 20 && netHeading >= 15) cls = 'merge';
            else cls = 'bend';
            episodes.push({ trail: enc.trail, cohort: enc.cohort, startStep: ep[0].j, lenSteps, maxDeflDeg: +maxDefl.toFixed(1), netHeadingDeg: +netHeading.toFixed(1), crossTrail: ep.some(a => !a.self), cls });
            i = j + 1;
        }
    }
    const clsTally = {};
    for (const e of episodes) clsTally[e.cls] = (clsTally[e.cls] || 0) + 1;
    const crossTally = {};
    for (const e of episodes) if (e.crossTrail) crossTally[e.cls] = (crossTally[e.cls] || 0) + 1;
    return {
        trails, wear: w, rngCounts,
        perCohort: cohortHashes(trails),
        responseRate: +(stepsActivated / stepsTotal).toFixed(4),
        episodes: { total: episodes.length, byClass: clsTally, crossTrailByClass: crossTally, detail: episodes },
    };
}

// ── agendas ──
const FOCI_GIANT_NEIGHBOR = [{ x: 42, y: -40, g: 38, k: 5.01 }, { x: -52, y: 38, g: 90, k: 1.00 }];
const md5 = p => crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex');

function passiveLane() { // arm-1 exact path
    const trails = simulate(FOCI_GIANT_NEIGHBOR);
    return { trails, geo: geometryHash(trails), wear: replayDeposit(trails) };
}
function assertRng(run, label) {
    const bad = Object.entries(run.rngCounts).filter(([, c]) => c !== 420);
    if (bad.length) throw new Error(`RNG DRIFT in ${label}: cohorts ${JSON.stringify(bad)} (defect #2)`);
    return Object.values(run.rngCounts).every(c => c === 420);
}

if (AGENDA === 'witnesses') {
    console.log('=== Study XXX arm-2 WITNESSES ===');
    const P = passiveLane();
    console.log('[W-PASSIVE-GEO-polyline]', P.geo, P.geo.startsWith(ARM1_POLYLINE_PREFIX) ? 'OK == ca8dd7cd… (recorded Oct 5 under md5-identical render)' : 'FAIL — geometry drifted');
    const dh = dStringHash(P.trails);
    console.log('[W-PASSIVE-GEO-dstring]', dh, dh.startsWith(ARM1_DHASH_PREFIX) ? 'OK == 810fe0bf… (Block 229/236 record, wear-witness.js method)' : 'FAIL — d-string drifted vs Block 229/236 record');
    console.log('[W-PASSIVE-FIELD]', fieldHash(P.wear));
    const tmp = '.tmp-passive-check.svg';
    renderWorn(P.trails, P.wear, W_SAT, tmp);
    const got = md5(tmp);
    console.log('[W-PASSIVE-SVG]', got, got === PASSIVE_MD5 ? 'OK md5 == committed study-xxix-wear-worn.svg' : 'FAIL md5 mismatch vs committed anchor');
    fs.unlinkSync(tmp);
    const st = stats2(P.wear);
    console.log('[W-PASSIVE-STATS]', JSON.stringify(st));
    // W-REFACTOR: active machinery with beta=0 @ focus 0.75 must reproduce arm-1 exactly
    const R0 = simulateActive(FOCI_GIANT_NEIGHBOR, { R: 16, beta: 0, focusW: 0.75, order: 'fwd' });
    assertRng(R0, 'refactor');
    console.log('[W-REFACTOR-GEO]', geometryHash(R0.trails), geometryHash(R0.trails) === P.geo ? 'OK == passive geometry (machinery trajectory-neutral at beta=0)' : 'FAIL — active machinery drifted trajectories');
    console.log('[W-REFACTOR-FIELD]', fieldHash(R0.wear), fieldHash(R0.wear) === fieldHash(P.wear) ? 'OK == replay field (incremental deposition + rollback faithful)' : 'FAIL — deposition mismatch');
    // rescaled passive (defect #4): beta=0 @ focus 0.60 — stats only
    const RS = simulateActive(FOCI_GIANT_NEIGHBOR, { R: 16, beta: 0, focusW: 0.60, order: 'fwd' });
    assertRng(RS, 'rescaled');
    console.log('[W-RESCALED(b=0,f=0.60)@R16]', JSON.stringify(stats2(RS.wear)), 'responseRate', RS.responseRate);
    console.log('[W-RESCALED-GEO]', geometryHash(RS.trails), '(differs from passive by design: focus-weight confound lane)');
    console.log('[W-RNG] all lanes 420/cohort: OK');
}

if (AGENDA === 'calibrate') {
    console.log('=== Study XXX arm-2 beta CALIBRATION (stats only, no renders) ===');
    // Deepening is measured vs the RESCALED passive (beta=0 @ focus 0.60), not vs passive @ 0.75:
    // the focus-weight change alone lifts median 2->3 (witnesses datum), and the beta rule must
    // reward what the RESPONSE adds, not the confound (bones defect #4 discipline).
    // RULE (declared): smallest ladder beta such that (a) median > rescaled median, (b) p90 >= rescaled p90,
    // (c) cellsNonZero >= 0.7 x passive cellsNonZero (no crater), (d) top1pctShare <= 0.5 (no monopoly).
    // If (a) never fires: fall back to smallest beta with mean|deflection| >= 1 deg; document.
    const P = passiveLane();
    const ps = stats2(P.wear);
    const RS = simulateActive(FOCI_GIANT_NEIGHBOR, { R: 16, beta: 0, focusW: 0.60, order: 'fwd' });
    const rs = stats2(RS.wear);
    console.log('passive@0.75 :', JSON.stringify(ps));
    console.log('rescaled@0.60:', JSON.stringify(rs), '(deepening baseline)');
    const BETA_LADDER = [0.05, 0.10, 0.15, 0.20, 0.30];
    for (const R of [4, 16]) {
        for (const beta of BETA_LADDER) {
            const run = simulateActive(FOCI_GIANT_NEIGHBOR, { R, beta, focusW: 0.60, order: 'fwd' });
            assertRng(run, `cal R${R} b${beta}`);
            const s = stats2(run.wear);
            const defls = run.episodes.detail.map(e => e.maxDeflDeg);
            const meanDefl = defls.length ? +(defls.reduce((x, y) => x + y, 0) / defls.length).toFixed(2) : 0;
            const okA = s.medianNonZero > rs.medianNonZero, okB = s.p90 >= rs.p90;
            const crater = s.cellsNonZero < 0.7 * ps.cellsNonZero, monopoly = s.top1pctShare > 0.5;
            console.log(`R${R} beta ${beta.toFixed(2)}: resp ${run.responseRate} med ${s.medianNonZero} p90 ${s.p90} max ${s.max} cov ${s.coverage} top1% ${s.top1pctShare} meanDefl ${meanDefl} | ${(okA && okB) ? 'DEEPENS' : 'no-deepen'} ${crater ? 'CRATER' : ''} ${monopoly ? 'MONOPOLY' : ''}`);
        }
    }
}

if (AGENDA === 'study') {
    const BETA_R4 = parseFloat((process.argv.find(a => a.startsWith('--beta4=')) || '').slice(8) || 'NaN');
    const BETA_R16 = parseFloat((process.argv.find(a => a.startsWith('--beta16=')) || '').slice(9) || 'NaN');
    if (!(BETA_R4 > 0) || !(BETA_R16 > 0)) throw new Error('study agenda needs --beta4= and --beta16= from the calibration rule');
    console.log('=== Study XXX arm-2 STUDY RUNS (beta from calibration rule; smallest off collapse boundary) ===');
    console.log('chosen: beta_R4 =', BETA_R4, ' beta_R16 =', BETA_R16);
    const P = passiveLane();
    console.log('[passive geo]', geometryHash(P.trails), '[passive field]', fieldHash(P.wear));
    const out = {};
    for (const [name, R, beta] of [['habit-r4', 4, BETA_R4], ['habit-r16', 16, BETA_R16]]) {
        const run = simulateActive(FOCI_GIANT_NEIGHBOR, { R, beta, focusW: 0.60, order: 'fwd' });
        assertRng(run, name);
        const geo = geometryHash(run.trails);
        const fh = fieldHash(run.wear);
        const st = stats2(run.wear);
        const r = renderWorn(run.trails, run.wear, W_SAT, `study-xxx-wear-${name}.svg`);
        console.log(`[${name}] geo ${geo} field ${fh}`);
        console.log(`[${name}] stats ${JSON.stringify(st)} responseRate ${run.responseRate}`);
        console.log(`[${name}] svg ${JSON.stringify(r)} -> study-xxx-wear-${name}.svg`);
        console.log(`[${name}] episodes ${JSON.stringify({ total: run.episodes.total, byClass: run.episodes.byClass, crossTrailByClass: run.episodes.crossTrailByClass })}`);
        out[name] = {
            R, beta, geo, field: fh, stats: st, responseRate: run.responseRate,
            perCohort: run.perCohort, episodes: { total: run.episodes.total, byClass: run.episodes.byClass, crossTrailByClass: run.episodes.crossTrailByClass },
            svgPaths: r.paths,
        };
        fs.writeFileSync(`.encounter-${name}.json`, JSON.stringify(run.episodes.detail, null, 1));
    }
    // reversal rider on R16 (declared): cohorts executed 11..0, same per-cohort seed/tau
    const fwd = out['habit-r16'];
    const rev = simulateActive(FOCI_GIANT_NEIGHBOR, { R: 16, beta: BETA_R16, focusW: 0.60, order: 'rev' });
    assertRng(rev, 'reversal');
    const revGeo = geometryHash(rev.trails), revField = fieldHash(rev.wear);
    const perCohortFwd = Object.fromEntries(fwd.perCohort.map(c => [c.cohort, c.hash]));
    const perCohortRev = Object.fromEntries(rev.perCohort.map(c => [c.cohort, c.hash]));
    const differing = Object.keys(perCohortFwd).filter(k => perCohortFwd[k] !== perCohortRev[k]).map(Number);
    console.log('[reversal-r16] geo', revGeo, revGeo === fwd.geo ? 'SAME as forward (commutative!)' : `DIFFERS (non-commutative; differing cohort hashes: ${differing.join(',')})`);
    console.log('[reversal-r16] field', revField, revField === fwd.field ? 'SAME' : 'DIFFERS');
    console.log('[reversal-r16] stats', JSON.stringify(stats2(rev.wear)), 'responseRate', rev.responseRate);
    out['reversal-r16'] = { geo: revGeo, field: revField, stats: stats2(rev.wear), responseRate: rev.responseRate, differingCohorts: differing };
    fs.writeFileSync('.study-xxx-runs.json', JSON.stringify(out, null, 1));
    console.log('[written] .study-xxx-runs.json, .encounter-habit-r4.json, .encounter-habit-r16.json');
}
