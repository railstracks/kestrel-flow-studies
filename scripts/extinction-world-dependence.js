// Study XXVIII v3 — "World-Dependence" (Block 156)
// Pre-reg: gallivanting/visual-studies/2026-09-03-world-dependence-prereg.md
// The discriminator: factorial separation of own-depth vs competition vs
// position-in-weather for death time. Metric block: 24 cohorts, 200 trails.
// Two witness SVGs only (isolate + giant-neighbor crush).

const fs = require('fs');

function mulberry32(seed) {
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

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

function field(x, y, tau, foci, w) {
    const f = focusSumVec(x, y, tau, foci);
    const a = ambientVec(x, y);
    const fm = Math.hypot(f.x, f.y);
    const am = Math.hypot(a.x, a.y) || 1;
    if (fm < 1e-6) return { x: a.x / am, y: a.y / am };
    return {
        x: (f.x / fm) * w + (a.x / am) * (1 - w) * 0.6,
        y: (f.y / fm) * w + (a.y / am) * (1 - w) * 0.6
    };
}

const COHORTS = 24, TPC = 200, TRAILLEN = 70, STEP = 1.6, CAPR = 22;

// Returns { capture: {probe: [...], anchor: [...], ...}, trails? }
function simulate(foci, baseSeed, wantTrails) {
    const capture = foci.map(() => []);
    const allTrails = [];
    for (let k = 0; k < COHORTS; k++) {
        const tau = (k + 0.5) / COHORTS;
        const rand = mulberry32(baseSeed + k * 7919);
        const caps = foci.map(() => 0);
        let n = 0;
        for (let i = 0; i < TPC; i++) {
            let x = (rand() - 0.5) * 180, y = (rand() - 0.5) * 180;
            const opacity = (0.35 + rand() * 0.40) * (1.0 - 0.25 * tau);
            const pts = [[x, y]];
            for (let s = 0; s < TRAILLEN; s++) {
                if (Math.abs(x) > 95 || Math.abs(y) > 95) break;
                const v = field(x, y, tau, foci, 0.75);
                const len = Math.hypot(v.x, v.y) || 1;
                x += (v.x / len) * STEP; y += (v.y / len) * STEP;
                pts.push([x, y]);
            }
            if (pts.length > 3) {
                n++;
                foci.forEach((f, fi) => { if (Math.hypot(f.x - x, f.y - y) < CAPR) caps[fi]++; });
                if (wantTrails) allTrails.push({ pts, opacity, tau });
            }
        }
        foci.forEach((f, fi) => { capture[fi][k] = n ? caps[fi] / n : 0; });
    }
    return { capture, trails: allTrails };
}

function deathTau(series) {
    const base = series[0];
    if (base <= 0.02) return { base, death: null };
    for (let k = 0; k < series.length; k++) {
        if (series[k] < 0.5 * base) return { base, death: k, tauStar: (k + 0.5) / COHORTS };
    }
    return { base, death: null };
}

function flatness(series) {
    let m = 0;
    for (let k = 1; k < series.length; k++) m = Math.max(m, Math.abs(series[k] - series[0]));
    return m;
}

function ols(xs, ys) {
    const n = xs.length;
    const mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
    let sxy = 0, sxx = 0;
    for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
    const slope = sxy / sxx, icept = my - slope * mx;
    let ssr = 0, sst = 0;
    for (let i = 0; i < n; i++) { ssr += (ys[i] - (icept + slope * xs[i])) ** 2; sst += (ys[i] - my) ** 2; }
    return { slope, icept, r2: sst ? 1 - ssr / sst : null };
}

// --- canonical probe + anchor (prereg) ---
const PROBE = { x: 42, y: -40, g: 38, k: 5.01, label: 'probe' };
const ANCHOR = { x: -52, y: 38, g: 60, k: 1.00, label: 'anchor' };
const results = { meta: { cohorts: COHORTS, tpc: TPC, capR: CAPR, seed: 31415, date: '2026-09-03' }, arms: {} };

// Arm A — isolate (K=1)
{
    const { capture } = simulate([PROBE], 31415);
    const flat = flatness(capture[0]);
    const d = deathTau(capture[0]);
    results.arms.isolate = { capture: capture[0], flatness: flat, deathCohort: d.death, base: d.base };
    console.log('A ISOLATE  K=1: base=' + d.base.toFixed(3) + '  flatness(max|c-c0|)=' + flat.toFixed(4) +
        '  death=' + (d.death ?? 'none') + '   [H1 gate: flatness<0.03]');
}

// Arm B — competition ladder (anchor g_c varies)
{
    const gcs = [24, 30, 38, 48, 60, 75, 90];
    const rows = [];
    for (const gc of gcs) {
        const foci = [{ ...PROBE }, { ...ANCHOR, g: gc }];
        const { capture } = simulate(foci, 31415);
        const d = deathTau(capture[0]);
        rows.push({ gc, base: d.base, deathCohort: d.death, tauStar: d.tauStar });
        console.log('B COMPET  g_c=' + String(gc).padStart(3) + '  base=' + d.base.toFixed(3) +
            '  death=' + (d.death ?? 'none') + '  tau*=' + (d.tauStar ?? 'n/a'));
    }
    const fit = rows.filter(r => r.tauStar != null);
    const reg = fit.length >= 3 ? ols(fit.map(r => Math.log(r.gc)), fit.map(r => r.tauStar)) : null;
    results.arms.competition = { rows, slope: reg?.slope, r2: reg?.r2 };
    console.log('  slope(tau* vs ln g_c) = ' + (reg ? reg.slope.toFixed(4) + '  r2=' + reg.r2.toFixed(3) + '  [H2: -0.35..-0.15]' : 'insufficient'));
}

// Arm C — own-g ladder (probe g varies, g_c=60)
{
    const gps = [24, 30, 38, 48, 60, 75];
    const rows = [];
    for (const gp of gps) {
        const foci = [{ ...PROBE, g: gp }, { ...ANCHOR }];
        const { capture } = simulate(foci, 31415);
        const d = deathTau(capture[0]);
        rows.push({ gp, base: d.base, deathCohort: d.death, tauStar: d.tauStar });
        console.log('C OWNG    g_p=' + String(gp).padStart(3) + '  base=' + d.base.toFixed(3) +
            '  death=' + (d.death ?? 'none') + '  tau*=' + (d.tauStar ?? 'n/a'));
    }
    const fit = rows.filter(r => r.tauStar != null);
    const reg = fit.length >= 3 ? ols(fit.map(r => Math.log(r.gp)), fit.map(r => r.tauStar)) : null;
    results.arms.ownG = { rows, slope: reg?.slope, r2: reg?.r2 };
    console.log('  slope(tau* vs ln g_p) = ' + (reg ? reg.slope.toFixed(4) + '  r2=' + reg.r2.toFixed(3) + '  [H2: +0.15..+0.35]' : 'insufficient'));
}

// Arm D — position rotation (probe slot varies, g_c=60 at anchor slot)
{
    const slots = [
        { x: 42, y: -40, tag: 'canonical' }, { x: 48, y: 32, tag: 'mid' },
        { x: -38, y: -46, tag: 'midweak' }, { x: 8, y: 8, tag: 'center' },
        { x: 70, y: 0, tag: 'east-edge' }, { x: 0, y: -70, tag: 'south-edge' }
    ];
    const rows = [];
    for (const slot of slots) {
        const foci = [{ ...PROBE, x: slot.x, y: slot.y }, { ...ANCHOR }];
        const { capture } = simulate(foci, 31415);
        const d = deathTau(capture[0]);
        rows.push({ tag: slot.tag, base: d.base, deathCohort: d.death, tauStar: d.tauStar });
        console.log('D POS     ' + slot.tag.padEnd(10) + '  base=' + d.base.toFixed(3) +
            '  death=' + (d.death ?? 'none') + '  tau*=' + (d.tauStar ?? 'n/a'));
    }
    const taus = rows.filter(r => r.tauStar != null).map(r => r.tauStar);
    results.arms.position = { rows, spread: taus.length ? Math.max(...taus) - Math.min(...taus) : null };
    console.log('  spread(max-min tau*) = ' + (results.arms.position.spread?.toFixed(4) ?? 'n/a') + '  [H3: classify vs B/C spreads]');
}

// Arm E — K-ladder (add fast-dying competitors, k=9.03)
{
    const extras = [
        [{ x: 48, y: 32, g: 48, k: 9.03, label: 'fast1' }],
        [{ x: 48, y: 32, g: 48, k: 9.03, label: 'fast1' }, { x: -38, y: -46, g: 38, k: 9.03, label: 'fast2' }]
    ];
    const rows = [];
    extras.forEach((ex, i) => {
        const foci = [{ ...PROBE }, { ...ANCHOR }, ...ex];
        const { capture } = simulate(foci, 31415);
        const d = deathTau(capture[0]);
        rows.push({ K: 3 + i, deathCohort: d.death, tauStar: d.tauStar, base: d.base });
        console.log('E K-LAD   K=' + (3 + i) + '  base=' + d.base.toFixed(3) + '  death=' + (d.death ?? 'none') + '  tau*=' + (d.tauStar ?? 'n/a'));
    });
    results.arms.kLadder = rows;
}

// Arm F — weather-off (w=1.0) — needs custom simulate
{
    const foci = [{ ...PROBE }, { ...ANCHOR }];
    const capture = [];
    for (let k = 0; k < COHORTS; k++) {
        const tau = (k + 0.5) / COHORTS;
        const rand = mulberry32(31415 + k * 7919);
        let caps = 0, n = 0;
        for (let i = 0; i < TPC; i++) {
            let x = (rand() - 0.5) * 180, y = (rand() - 0.5) * 180;
            for (let s = 0; s < TRAILLEN; s++) {
                if (Math.abs(x) > 95 || Math.abs(y) > 95) break;
                const f = focusSumVec(x, y, tau, foci);
                const len = Math.hypot(f.x, f.y) || 1;
                x += (f.x / len) * STEP; y += (f.y / len) * STEP;
            }
            n++;
            if (Math.hypot(PROBE.x - x, PROBE.y - y) < CAPR) caps++;
        }
        capture[k] = caps / n;
    }
    const d = deathTau(capture);
    results.arms.weatherOff = { capture, base: d.base, deathCohort: d.death, tauStar: d.tauStar };
    console.log('F WX-OFF  base=' + d.base.toFixed(3) + '  death=' + (d.death ?? 'none') + '  tau*=' + (d.tauStar ?? 'n/a') + '  [H5: within ±1.5 cohorts of canonical]');
}

// Arm G — k-ladder (probe k varies at canonical masses)
{
    const rows = [];
    for (const kp of [3.19, 5.01, 7.00]) {
        const foci = [{ ...PROBE, k: kp }, { ...ANCHOR }];
        const { capture } = simulate(foci, 31415);
        const d = deathTau(capture[0]);
        rows.push({ kp, dK: kp - 1.00, deathCohort: d.death, tauStar: d.tauStar, tauX_dk: d.tauStar != null ? d.tauStar * (kp - 1.00) : null });
        console.log('G K-LAD   k=' + kp.toFixed(2) + '  death=' + (d.death ?? 'none') + '  tau*=' + (d.tauStar ?? 'n/a') +
            '  tau*·Δk=' + (d.tauStar != null ? (d.tauStar * (kp - 1.0)).toFixed(4) : 'n/a'));
    }
    results.arms.probeKLadder = rows;
}

// Canonical cell capture profile (for reference + H4/H5 comparisons)
{
    const foci = [{ ...PROBE }, { ...ANCHOR }];
    const { capture } = simulate(foci, 31415);
    const d = deathTau(capture[0]);
    results.arms.canonical = { capture: capture[0], base: d.base, deathCohort: d.death, tauStar: d.tauStar };
    console.log('CANONICAL base=' + d.base.toFixed(3) + '  death=' + d.death + '  tau*=' + d.tauStar.toFixed(4));
}

fs.writeFileSync('/home/claw/.openclaw/workspace/kestrels-projects/gallivanting/visual-studies/2026-09-03-world-dependence-results.json', JSON.stringify(results, null, 1));
console.log('\nresults JSON written');
