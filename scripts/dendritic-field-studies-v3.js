// Series IV Final Iteration — Multi-foci convergence exploration
// Triple convergence scored 9/10. Can we push it further?

const fs = require('fs');

function mulberry32(seed) {
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

class DensityField {
    constructor(cellSize = 5) { this.cellSize = cellSize; this.cells = new Map(); }
    add(x, y) { const cx = Math.floor(x / this.cellSize), cy = Math.floor(y / this.cellSize); this.cells.set(`${cx},${cy}`, (this.cells.get(`${cx},${cy}`) || 0) + 1); }
    densityAt(x, y) {
        const cx = Math.floor(x / this.cellSize), cy = Math.floor(y / this.cellSize);
        let t = 0; for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) t += this.cells.get(`${cx+dx},${cy+dy}`) || 0; return t;
    }
}

function convergenceField(x, y, focusX, focusY, pull, swirl) {
    const dx = focusX - x, dy = focusY - y;
    const r = Math.sqrt(dx * dx + dy * dy + 1);
    return { fx: (dx / r) * pull + (-dy / r) * swirl, fy: (dy / r) * pull + (dx / r) * swirl };
}

function multiFociField(x, y, params) {
    const { foci, pull, swirl } = params;
    let fx = 0, fy = 0;
    for (let i = 0; i < foci.length; i++) {
        const s = swirl * (i % 2 === 0 ? 1 : -1);
        const f = convergenceField(x, y, foci[i].x, foci[i].y, pull, s);
        fx += f.fx; fy += f.fy;
    }
    return { fx: fx / foci.length, fy: fy / foci.length };
}

function growField(x, y, angle, params, fieldFn, fieldParams, depth, rand, density, segments) {
    if (depth >= params.maxDepth) return;
    if (Math.abs(x) > 98 || Math.abs(y) > 98) return;
    const segLength = params.segLength;
    const branchLength = params.branchLength * Math.pow(params.lengthDecay, depth);
    const totalSegs = Math.max(4, Math.floor(branchLength / segLength));
    let cx = x, cy = y, cAngle = angle;
    const branchDrift = (rand() - 0.5) * params.curveStrength;
    for (let s = 0; s < totalSegs; s++) {
        cAngle += branchDrift * 0.03;
        if (params.fieldStrength > 0) {
            const { fx, fy } = fieldFn(cx, cy, fieldParams);
            const mag = Math.sqrt(fx * fx + fy * fy);
            if (mag > 0.001) {
                const fa = Math.atan2(fy, fx);
                const diff = Math.atan2(Math.sin(fa - cAngle), Math.cos(fa - cAngle));
                cAngle += diff * params.fieldStrength * 0.15;
            }
        }
        cAngle += (rand() - 0.5) * params.noise;
        if (params.densityAvoidance > 0 && depth < params.maxDepth - 1) {
            const d = density.densityAt(cx, cy);
            if (d > 3) {
                const la = 5;
                const ahead = density.densityAt(cx + Math.cos(cAngle) * la, cy + Math.sin(cAngle) * la);
                const left = density.densityAt(cx + Math.cos(cAngle - 1) * la, cy + Math.sin(cAngle - 1) * la);
                const right = density.densityAt(cx + Math.cos(cAngle + 1) * la, cy + Math.sin(cAngle + 1) * la);
                if (left < ahead && left <= right) cAngle -= params.densityAvoidance * 0.2;
                else if (right < ahead) cAngle += params.densityAvoidance * 0.2;
            }
        }
        const nx = cx + Math.cos(cAngle) * segLength;
        const ny = cy + Math.sin(cAngle) * segLength;
        if (Math.abs(nx) > 98 || Math.abs(ny) > 98) break;
        const dr = depth / params.maxDepth;
        const op = params.baseOpacity * Math.pow(1 - dr, params.depthFadeExp);
        const w = params.baseWidth * Math.pow(params.widthDecayBase, depth);
        segments.push({ x1: cx, y1: cy, x2: nx, y2: ny, opacity: Math.max(0.06, op), width: Math.max(0.1, w), depth });
        density.add(nx, ny);
        cx = nx; cy = ny;
        const bc = params.branchProbBase + dr * params.branchProbDepth;
        if (s >= 2 && rand() < bc) {
            const spread = params.branchAngle * (0.7 + rand() * 0.6);
            const jit = (rand() - 0.5) * 0.3;
            growField(cx, cy, cAngle - spread + jit, params, fieldFn, fieldParams, depth + 1, rand, density, segments);
            growField(cx, cy, cAngle + spread + jit, params, fieldFn, fieldParams, depth + 1, rand, density, segments);
            if (rand() < 0.15) growField(cx, cy, cAngle + (rand() - 0.5) * 0.4, params, fieldFn, fieldParams, depth + 1, rand, density, segments);
            return;
        }
    }
}

function scatteredOrigins(rand, count, xRange = 70, yRange = 70) {
    const o = [];
    for (let i = 0; i < count; i++) o.push({ x: (rand() - 0.5) * 2 * xRange, y: (rand() - 0.5) * 2 * yRange, angle: rand() * Math.PI * 2 });
    return o;
}

function render(params, fieldFn, fieldParams, seed, filename, origins) {
    const rand = mulberry32(seed);
    const density = new DensityField(params.densityCellSize || 5);
    const segments = [];
    for (const o of origins) { density.add(o.x, o.y); growField(o.x, o.y, o.angle, params, fieldFn, fieldParams, 0, rand, density, segments); }
    const svgSize = 1000, scale = svgSize / 200;
    const toX = x => (x + 100) * scale, toY = y => (y + 100) * scale;
    const groups = new Map();
    for (const seg of segments) {
        const k = `${Math.round(seg.opacity * 20) / 20}_${Math.round(seg.width * 10) / 10}`;
        if (!groups.has(k)) groups.set(k, { segs: [], opacity: Math.round(seg.opacity * 20) / 20, width: Math.round(seg.width * 10) / 10 });
        groups.get(k).segs.push(seg);
    }
    const sg = [...groups.values()].sort((a, b) => b.opacity - a.opacity);
    let body = '';
    for (const g of sg) {
        let pd = '';
        for (const s of g.segs) pd += `M ${toX(s.x1).toFixed(2)} ${toY(s.y1).toFixed(2)} L ${toX(s.x2).toFixed(2)} ${toY(s.y2).toFixed(2)} `;
        body += `<path d="${pd}" stroke="#1a1a1a" stroke-width="${(g.width * scale * 0.4).toFixed(2)}" opacity="${g.opacity}" fill="none" stroke-linecap="round"/>\n`;
    }
    fs.writeFileSync(filename, `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}" width="${svgSize}" height="${svgSize}">\n  <rect width="${svgSize}" height="${svgSize}" fill="#f5f0e8"/>\n${body}</svg>`);
    console.log(`${filename}: ${segments.length} segments`);
}

const baseParams = {
    maxDepth: 9, segLength: 0.7, branchLength: 24,
    branchProbBase: 0.05, branchProbDepth: 0.10, branchAngle: 0.55,
    curveStrength: 0.8, noise: 0.08,
    densityAvoidance: 0.5, densityCellSize: 5,
    baseOpacity: 0.80, depthFadeExp: 1.5,
    baseWidth: 1.4, widthDecayBase: 0.74, lengthDecay: 0.76,
    fieldStrength: 0.5
};

// ============================================================
// TRIPLE CONVERGENCE — Seed exploration
// ============================================================
console.log('=== Triple Convergence Seed Exploration ===\n');

const triangleFoci = [
    { x: -25, y: -15 }, { x: 25, y: -15 }, { x: 0, y: 25 }
];

for (const seed of [818, 271, 1337, 31415, 16180]) {
    render(
        { ...baseParams, fieldStrength: 0.6, maxDepth: 9 },
        multiFociField,
        { foci: triangleFoci, pull: 0.3, swirl: 0.2 },
        seed,
        `study-xviii-triple-conv-seed-${seed}.svg`,
        scatteredOrigins(mulberry32(seed), 18, 70, 70)
    );
}

// ============================================================
// TRIPLE CONVERGENCE — Configurations
// ============================================================
console.log('\n=== Triple Convergence Configurations ===\n');

// Inverted triangle
render(
    { ...baseParams, fieldStrength: 0.6 },
    multiFociField,
    { foci: [{ x: -25, y: 15 }, { x: 25, y: 15 }, { x: 0, y: -25 }], pull: 0.3, swirl: 0.2 },
    818,
    'study-xviii-triple-conv-inverted.svg',
    scatteredOrigins(mulberry32(818), 18, 70, 70)
);

// Equilateral triangle, larger
render(
    { ...baseParams, fieldStrength: 0.55 },
    multiFociField,
    { foci: [{ x: -30, y: -17 }, { x: 30, y: -17 }, { x: 0, y: 30 }], pull: 0.28, swirl: 0.22 },
    31415,
    'study-xviii-triple-conv-large.svg',
    scatteredOrigins(mulberry32(31415), 20, 75, 75)
);

// ============================================================
// QUADRUPLE CONVERGENCE — four focal points (square)
// ============================================================
console.log('\n=== Quadruple Convergence ===\n');

render(
    { ...baseParams, fieldStrength: 0.55, maxDepth: 9 },
    multiFociField,
    { foci: [{ x: -22, y: -22 }, { x: 22, y: -22 }, { x: 22, y: 22 }, { x: -22, y: 22 }], pull: 0.25, swirl: 0.18 },
    818,
    'study-xix-quad-convergence-a.svg',
    scatteredOrigins(mulberry32(818), 20, 75, 75)
);

render(
    { ...baseParams, fieldStrength: 0.55, maxDepth: 9 },
    multiFociField,
    { foci: [{ x: -22, y: -22 }, { x: 22, y: -22 }, { x: 22, y: 22 }, { x: -22, y: 22 }], pull: 0.25, swirl: 0.18 },
    31415,
    'study-xix-quad-convergence-b.svg',
    scatteredOrigins(mulberry32(31415), 20, 75, 75)
);

// ============================================================
// PENTAGON FIVE FOCCI
// ============================================================
console.log('\n=== Pentagon Convergence ===\n');

const pentagonFoci = [];
for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    pentagonFoci.push({ x: Math.cos(a) * 25, y: Math.sin(a) * 25 });
}

render(
    { ...baseParams, fieldStrength: 0.5, maxDepth: 9 },
    multiFociField,
    { foci: pentagonFoci, pull: 0.22, swirl: 0.15 },
    31415,
    'study-xx-pentagon-convergence.svg',
    scatteredOrigins(mulberry32(31415), 22, 75, 75)
);

console.log('\n=== All multi-foci renders complete ===');
