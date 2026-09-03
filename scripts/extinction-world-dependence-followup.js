// Post-hoc follow-ups (explicitly marked — prereg allows these as labeled)
// 1. Isolate at 2000 trails (H1 flatness vs proper noise floor: binomial sd at 200 trails ≈0.027 > 0.03 gate — instrument error, retest)
// 2. Gap-law discriminator: mass-at-fixed-mean-k pair + mean-k-shift control
// 3. Ladder extensions (g_c 12/15, g_p 90)
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
const COHORTS = 24, TRAILLEN = 70, STEP = 1.6, CAPR = 22;
function captureSeries(foci, tpc, probeIdx = 0) {
    const out = [];
    for (let k = 0; k < COHORTS; k++) {
        const tau = (k + 0.5) / COHORTS;
        const rand = mulberry32(31415 + k * 7919);
        let caps = 0, n = 0;
        for (let i = 0; i < tpc; i++) {
            let x = (rand() - 0.5) * 180, y = (rand() - 0.5) * 180;
            for (let s = 0; s < TRAILLEN; s++) {
                if (Math.abs(x) > 95 || Math.abs(y) > 95) break;
                const f = focusSumVec(x, y, tau, foci);
                const a = ambientVec(x, y);
                const fm = Math.hypot(f.x, f.y), am = Math.hypot(a.x, a.y) || 1;
                const vx = (f.x / fm) * 0.75 + (a.x / am) * 0.25 * 0.6;
                const vy = (f.y / fm) * 0.75 + (a.y / am) * 0.25 * 0.6;
                const len = Math.hypot(vx, vy) || 1;
                x += (vx / len) * STEP; y += (vy / len) * STEP;
            }
            n++;
            const p = foci[probeIdx];
            if (Math.hypot(p.x - x, p.y - y) < CAPR) caps++;
        }
        out.push(caps / n);
    }
    return out;
}
function deathTau(series) {
    const base = series[0];
    if (base <= 0.02) return { base, death: null };
    for (let k = 0; k < series.length; k++)
        if (series[k] < 0.5 * base) return { base, death: k, tauStar: (k + 0.5) / COHORTS };
    return { base, death: null };
}
const PROBE = { x: 42, y: -40, g: 38, k: 5.01 };
const ANCHOR = { x: -52, y: 38, g: 60, k: 1.00 };
const meanK = foci => foci.reduce((s, f) => s + f.g * f.k, 0) / foci.reduce((s, f) => s + f.g, 0);

// 1. isolate @2000 trails
{
    const c = captureSeries([PROBE], 2000);
    let flat = 0; for (let k = 1; k < c.length; k++) flat = Math.max(flat, Math.abs(c[k] - c[0]));
    console.log('ISO-2000  base=' + c[0].toFixed(4) + '  flatness=' + flat.toFixed(4) + '  [2-sigma binomial noise ~0.017]');
}
// 2. gap-law discriminator: X1 g38/k9.03; X2 g76/k7.58 (same k̄); X3 g38/k6.0 (same mass as X1, k̄ shifted down)
{
    const cells = [
        { tag: 'X1 g38 k9.03', f: { x: 48, y: 32, g: 38, k: 9.03 } },
        { tag: 'X2 g76 k7.58', f: { x: 48, y: 32, g: 76, k: 7.58 } },
        { tag: 'X3 g38 k6.00', f: { x: 48, y: 32, g: 38, k: 6.00 } }
    ];
    for (const cell of cells) {
        const foci = [{ ...PROBE }, { ...ANCHOR }, cell.f];
        const mk = meanK(foci);
        const c = captureSeries(foci, 200);
        const d = deathTau(c);
        console.log('GAP-DISC  ' + cell.tag + '  k̄=' + mk.toFixed(3) + '  gap=' + (PROBE.k - mk).toFixed(3) +
            '  death=' + d.death + '  tau*=' + (d.tauStar ?? 'n/a') + '  base=' + d.base.toFixed(3));
    }
}
// 3. ladder extensions
{
    for (const gc of [12, 15]) {
        const c = captureSeries([{ ...PROBE }, { ...ANCHOR, g: gc }], 200);
        const d = deathTau(c);
        console.log('B-EXT     g_c=' + gc + '  k̄=' + meanK([{ ...PROBE }, { ...ANCHOR, g: gc }]).toFixed(3) +
            '  death=' + d.death + '  tau*=' + (d.tauStar ?? 'n/a') + '  base=' + d.base.toFixed(3));
    }
    const c90 = captureSeries([{ ...PROBE, g: 90 }, { ...ANCHOR }], 200);
    const d90 = deathTau(c90);
    console.log('C-EXT     g_p=90  k̄=' + meanK([{ ...PROBE, g: 90 }, { ...ANCHOR }]).toFixed(3) +
        '  death=' + d90.death + '  tau*=' + (d90.tauStar ?? 'n/a') + '  base=' + d90.base.toFixed(3));
}
// 4. canonical capture curve (cliff/floor shape for the doc)
{
    const c = captureSeries([{ ...PROBE }, { ...ANCHOR }], 200);
    console.log('CANON curve:', c.map(v => v.toFixed(3)).join(' '));
}
// X2' — matched-mean cell: g76 k6.70 → k̄=4.364 (identical to X1's mean, different mass)
{
    const foci = [{ ...PROBE }, { ...ANCHOR }, { x: 48, y: 32, g: 76, k: 6.70 }];
    const mk = meanK(foci);
    const c = captureSeries(foci, 400);
    const d = deathTau(c);
    console.log("GAP-DISC  X2' g76 k6.70  k̄=" + mk.toFixed(3) + "  gap=" + (PROBE.k - mk).toFixed(3) +
        "  death=" + d.death + "  tau*=" + (d.tauStar ?? 'n/a') + "  base=" + d.base.toFixed(3) + "  [X1: gap 0.646 death 9]");
}
