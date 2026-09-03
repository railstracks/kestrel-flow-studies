// Witness renders for v3 (prereg: exactly two — isolate "no one can die" + g_c=90 crush)
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
// v2 render convention: 12 cohorts × 140 trails, v3 floors
const COHORTS = 12, TPC = 140, TRAILLEN = 70, STEP = 1.6;
function render(foci, outputPath) {
    const trails = [];
    for (let k = 0; k < COHORTS; k++) {
        const tau = (k + 0.5) / COHORTS;
        const rand = mulberry32(31415 + k * 7919);
        for (let i = 0; i < TPC; i++) {
            let x = (rand() - 0.5) * 180, y = (rand() - 0.5) * 180;
            const opacity = (0.35 + rand() * 0.40) * (1.0 - 0.25 * tau);
            const pts = [[x, y]];
            for (let s = 0; s < TRAILLEN; s++) {
                if (Math.abs(x) > 95 || Math.abs(y) > 95) break;
                const f = focusSumVec(x, y, tau, foci);
                const a = ambientVec(x, y);
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
    const lines = [];
    const lerp = (a, b, t) => a + (b - a) * t;
    const A = [212, 162, 78], B = [138, 148, 160];
    for (const t of trails) {
        const col = '#' + [0, 1, 2].map(c => Math.round(lerp(A[c], B[c], t.tau)).toString(16).padStart(2, '0')).join('');
        const width = 1.2 - 0.4 * t.tau;
        const d = t.pts.map((p, i) => {
            const sx = (p[0] + 100) * 5, sy = (100 - p[1]) * 5;
            return (i === 0 ? 'M' : 'L') + sx.toFixed(1) + ' ' + sy.toFixed(1);
        }).join(' ');
        lines.push(`  <path d="${d}" stroke="${col}" stroke-width="${width.toFixed(2)}" fill="none" opacity="${t.opacity.toFixed(2)}" stroke-linecap="round"/>`);
    }
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">\n  <rect width="1000" height="1000" fill="#101014"/>\n${lines.join('\n')}\n</svg>`;
    fs.writeFileSync(outputPath, svg);
    console.log(outputPath, 'trails:', trails.length, 'bytes:', svg.length);
}
// Witness 1: the isolate — a world where nobody can die (K=1, death schedule present but unrenderable)
render([{ x: 42, y: -40, g: 38, k: 5.01 }], 'study-xxviii-isolate-no-one-dies.svg');
// Witness 2: giant neighbor — g_c=90 anchor crushes the probe (death floored at cohort 4/12-render-grid)
render([{ x: 42, y: -40, g: 38, k: 5.01 }, { x: -52, y: 38, g: 90, k: 1.00 }], 'study-xxviii-giant-neighbor.svg');
