// INK_V_ONLY pass (Block 184, Sep 9 2026)
// Pre-reg: gallivanting/visual-studies/2026-09-09-inkv-prereg.md
// One arm, draw-time styling only (RNG call structure identical to
// extinction-witnesses.js in ALL modes -> trail geometry bit-identical):
//   INK_V_ONLY : constant gold [212,162,78] uniformly scaled x(1 - 0.60*tau)
//                [terminal 85,65,31 = dark gold/bronze]. Width frozen 1.2,
//                opacity = t.opacity (exactly ERA_FLAT's non-color treatment).
//   Uniform RGB scaling preserves hue+saturation exactly (HSV S scale-invariant):
//   hue and saturation are BIT-CONSTANT across the ramp; the only moving variable
//   is ink luminance. vs the committed ERA_FLAT anchor, the sole difference.
// Adjudicates the arc's final cell: does ink-luminance loss ALONE carry the
// aging-read? (F15 predicts yes; silent => register needs chroma co-variance.)
// Verify: d-string hash == committed styled baselines (geometry witness).
const fs = require('fs');
function mulberry32(seed) {
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
// (ambientVec/focusSumVec exactly as extinction-witnesses.js — any drift breaks the geometry witness)
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
function render(foci, outputPath, arm) {
    const trails = [];
    for (let k = 0; k < COHORTS; k++) {
        const tau = (k + 0.5) / COHORTS;
        const rand = mulberry32(31415 + k * 7919);
        for (let i = 0; i < TPC; i++) {
            let x = (rand() - 0.5) * 180, y = (rand() - 0.5) * 180;
            const opacity = 0.35 + rand() * 0.40; // SAME rand() consumption as original; no tau fade in this arm family
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
    const lines = [];
    const A = [212, 162, 78];
    for (const t of trails) {
        let col, width, op;
        if (arm === 'INK_V_ONLY') {
            const v = A.map(c => c * (1.0 - 0.60 * t.tau));
            col = '#' + v.map(c => Math.round(c).toString(16).padStart(2, '0')).join('');
            width = 1.2;
            op = t.opacity;
        } else throw new Error('arm? ' + arm);
        const d = t.pts.map((p, i) => {
            const sx = (p[0] + 100) * 5, sy = (100 - p[1]) * 5;
            return (i === 0 ? 'M' : 'L') + sx.toFixed(1) + ' ' + sy.toFixed(1);
        }).join(' ');
        lines.push(`  <path d="${d}" stroke="${col}" stroke-width="${width.toFixed(2)}" fill="none" opacity="${op.toFixed(2)}" stroke-linecap="round"/>`);
    }
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">\n  <rect width="1000" height="1000" fill="#101014"/>\n${lines.join('\n')}\n</svg>`;
    fs.writeFileSync(outputPath, svg);
    console.log(outputPath, 'trails:', trails.length, 'arm:', arm);
}
const W1 = [{ x: 42, y: -40, g: 38, k: 5.01 }];
const W2 = [{ x: 42, y: -40, g: 38, k: 5.01 }, { x: -52, y: 38, g: 90, k: 1.00 }];
render(W1, 'study-xxviii-isolate-inkv.svg', 'INK_V_ONLY');
render(W2, 'study-xxviii-giant-neighbor-inkv.svg', 'INK_V_ONLY');
