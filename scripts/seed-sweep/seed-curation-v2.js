// v2 metrics — gradient coherence, derived from the eye-check failure analysis:
// 1. depthFocusCorr  Pearson corr(depth, distNearestFocus): late-tree strokes closer
//                    to foci = deceleration legible = journey reads (negative corr expected
//                    and stronger = better; sign as-is so LOWER = better journey).
// 2. cellClusters    connected components (4-conn) of occupied 5-unit cells per
//                    occupied cell: fragmentation ("islands") — LOWER = better.
// 3. monoViolations  per focus, radial density profile in 6 annuli (r 0..60);
//                    a nearer annulus with <0.5x density of a farther one = dead
//                    zone on the journey — LOWER = better.
// Composite v2: rank-sum of the three (all lower=better) + focalContrast (up)
// as a weak guard against rewarding pure diffusion.
const fs = require('fs');
const records = JSON.parse(fs.readFileSync('sweep-metrics.json', 'utf8'));
const segmentsOut = JSON.parse(fs.readFileSync('sweep-segments.json', 'utf8'));
const FOCI = [{ x: -25, y: -15 }, { x: 25, y: -15 }, { x: 0, y: 25 }];

function pearson(xs, ys) {
    const n = xs.length, mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) { const a = xs[i] - mx, b = ys[i] - my; sxy += a * b; sxx += a * a; syy += b * b; }
    return sxy / Math.sqrt(sxx * syy || 1);
}

function nearestFocusDist(x, y) {
    let bd = Infinity;
    for (const f of FOCI) { const dx = f.x - x, dy = f.y - y; const d = dx * dx + dy * dy; if (d < bd) bd = d; }
    return Math.sqrt(bd);
}

for (const r of records) {
    const segs = segmentsOut[String(r.seed)];
    const depths = [], dists = [], mids = [];
    for (const s of segs) {
        const mx = (s.x1 + s.x2) / 2, my = (s.y1 + s.y2) / 2;
        depths.push(s.depth); dists.push(nearestFocusDist(mx, my)); mids.push([mx, my]);
    }
    r.depthFocusCorr = +pearson(depths, dists).toFixed(4);

    // occupied-cell clusters (5-unit cells, 4-connectivity, BFS)
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
    r.cellClusters = +(clusters / occ.size).toFixed(4);

    // radial monotonicity violations per focus
    let violSum = 0;
    for (const f of FOCI) {
        const annuli = new Array(6).fill(0), areas = [Math.PI * 100, Math.PI * 300, Math.PI * 500, Math.PI * 700, Math.PI * 900, Math.PI * 1100];
        for (const [mx, my] of mids) {
            const d = Math.hypot(f.x - mx, f.y - my);
            const ai = Math.min(5, Math.floor(d / 10));
            annuli[ai]++;
        }
        const dens = annuli.map((c, i) => c / areas[i]);
        let v = 0;
        for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) if (dens[i] < 0.5 * dens[j]) v++;
        violSum += v;
    }
    r.monoViolations = +(violSum / 3).toFixed(2);

    r.comp2_raw = null; // filled after ranking
}

const spec2 = [
    ['depthFocusCorr', 1],   // lower (more negative) = better
    ['cellClusters', 1],     // lower = better
    ['monoViolations', 1],   // lower = better
    ['focalContrast', -1],   // higher = better (guard vs diffusion)
];
for (const [name, dir] of spec2) {
    const sorted = [...records].sort((a, b) => dir * (a[name] - b[name]));
    sorted.forEach((r, i) => { r[`rk2_${name}`] = i + 1; });
}
for (const r of records) r.comp2 = spec2.reduce((a, [n]) => a + r[`rk2_${n}`], 0);
records.sort((a, b) => a.comp2 - b.comp2);

fs.writeFileSync('sweep-metrics-v2.json', JSON.stringify(records, null, 1));
const fmt = r => `seed ${String(r.seed).padStart(5)} ${r.gallery ? '★' : ' '} comp2 ${String(r.comp2).padStart(3)} | corr=${r.depthFocusCorr} clus=${r.cellClusters} mono=${r.monoViolations} fc=${r.focalContrast} fm25=${r.focalMass25} N=${r.N}`;
console.log('=== TOP 10 (v2 composite) ===');
records.slice(0, 10).forEach((r, i) => console.log(`${i + 1}. ${fmt(r)}`));
console.log('=== BOTTOM 5 ===');
records.slice(-5).reverse().forEach((r, i) => console.log(`${records.length - i}. ${fmt(r)}`));
console.log('=== KEY SEEDS ===');
for (const gs of [31415, 16180, 818, 271, 1337, 9, 16, 20, 36]) {
    const idx = records.findIndex(r => r.seed === gs);
    console.log(`seed ${gs}: v2-rank ${idx + 1}/${records.length}`);
}
