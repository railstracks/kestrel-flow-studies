// Dendritic Field Studies — Series IV
// Hybrid approach: recursive dendritic growth through dynamic vector fields.
// Branches don't just grow outward — they follow a vector field (magnetic dipole,
// Lorenz attractor, etc.), combining fractal depth with field-guided flow.
//
// This merges Series I/II (field formulas) with Series III (recursive branching).
// The convergence principle predicts: field focal points become dendrite attractors,
// producing organic fractal structures with inherent compositional asymmetry.

const fs = require('fs');

function mulberry32(seed) {
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// --- Vector Fields ---

// Magnetic dipole: two poles, lines bend around them.
// Pole A at (-d, 0) is attractive, Pole B at (d, 0) is repulsive (or vice versa).
function magneticDipole(x, y, params) {
    const { poleX = -20, poleY = 0, poleX2 = 20, poleY2 = 0, strength = 800 } = params;
    // Vector from each pole to current point
    const dx1 = x - poleX, dy1 = y - poleY;
    const r1sq = dx1 * dx1 + dy1 * dy1 + 1;
    const r1 = Math.sqrt(r1sq);

    const dx2 = x - poleX2, dy2 = y - poleY2;
    const r2sq = dx2 * dx2 + dy2 * dy2 + 1;
    const r2 = Math.sqrt(r2sq);

    // Attractive pole: pull toward it (inverse square)
    const f1x = -strength * dx1 / (r1sq * r1);
    const f1y = -strength * dy1 / (r1sq * r1);

    // Repulsive pole: push away (inverse square)
    const f2x = strength * 0.7 * dx2 / (r2sq * r2);
    const f2y = strength * 0.7 * dy2 / (r2sq * r2);

    return { fx: f1x + f2x, fy: f1y + f2y };
}

// Lorenz attractor velocity field (projected to 2D)
// Uses the Lorenz equations derivatives as a 2D vector field
function lorenzField(x, y, params) {
    const { sigma = 10, rho = 28, beta = 2.667, scale = 0.05 } = params;
    // Map canvas coordinates to Lorenz space
    const lx = x * scale;
    const ly = y * scale;
    // Use z = some fixed plane for projection, or derive from x,y
    const z = Math.sqrt(Math.max(0, rho - 1)) + ly * 0.3;

    // Lorenz derivatives
    const dx = sigma * (ly - lx);
    const dy = lx * (rho - z) - ly;

    return { fx: dx * 0.8, fy: dy * 0.8 };
}

// Simple convergence field — radial attraction toward a focal point
// with tangential swirl. Like a galaxy or whirlpool.
function convergenceField(x, y, params) {
    const { focusX = 0, focusY = 0, pull = 0.3, swirl = 0.4 } = params;
    const dx = focusX - x;
    const dy = focusY - y;
    const r = Math.sqrt(dx * dx + dy * dy + 1);

    // Radial pull
    const rx = (dx / r) * pull;
    const ry = (dy / r) * pull;

    // Tangential swirl (perpendicular to radial)
    const sx = (-dy / r) * swirl;
    const sy = (dx / r) * swirl;

    return { fx: rx + sx, fy: ry + sy };
}

// Dual convergence — two focal points (like Synapse, but as a field)
function dualConvergenceField(x, y, params) {
    const { f1x = -30, f1y = 0, f2x = 30, f2y = 0, pull = 0.2, swirl = 0.3 } = params;
    const field1 = convergenceField(x, y, { focusX: f1x, focusY: f1y, pull, swirl });
    const field2 = convergenceField(x, y, { focusX: f2x, focusY: f2y, pull, swirl: -swirl });
    return { fx: (field1.fx + field2.fx) * 0.5, fy: (field1.fy + field2.fy) * 0.5 };
}

// --- Density Field (from Series III, unchanged) ---

class DensityField {
    constructor(cellSize = 5) {
        this.cellSize = cellSize;
        this.cells = new Map();
    }
    add(x, y) {
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        this.cells.set(`${cx},${cy}`, (this.cells.get(`${cx},${cy}`) || 0) + 1);
    }
    densityAt(x, y) {
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        let total = 0;
        for (let dx = -1; dx <= 1; dx++)
            for (let dy = -1; dy <= 1; dy++)
                total += this.cells.get(`${cx+dx},${cy+dy}`) || 0;
        return total;
    }
}

// --- Field-guided recursive growth ---

function growField(x, y, angle, params, fieldFn, fieldParams, depth, rand, density, segments) {
    if (depth >= params.maxDepth) return;
    if (Math.abs(x) > 98 || Math.abs(y) > 98) return;

    const segLength = params.segLength;
    const branchLength = params.branchLength * Math.pow(params.lengthDecay, depth);
    const totalSegs = Math.max(4, Math.floor(branchLength / segLength));

    let cx = x, cy = y, cAngle = angle;
    const branchDrift = (rand() - 0.5) * params.curveStrength;

    for (let s = 0; s < totalSegs; s++) {
        // Base curvature
        cAngle += branchDrift * 0.03;

        // *** Field influence — the key Series IV innovation ***
        // Sample the vector field at current position and blend heading toward it
        if (params.fieldStrength > 0) {
            const { fx, fy } = fieldFn(cx, cy, fieldParams);
            const fieldMag = Math.sqrt(fx * fx + fy * fy);
            if (fieldMag > 0.001) {
                const fieldAngle = Math.atan2(fy, fx);
                const angleDiff = fieldAngle - cAngle;
                const normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
                // Blend: higher fieldStrength = more field-following, less inertia
                cAngle += normalizedDiff * params.fieldStrength * 0.15;
            }
        }

        // Organic noise
        cAngle += (rand() - 0.5) * params.noise;

        // Density avoidance (from Series III)
        if (params.densityAvoidance > 0 && depth < params.maxDepth - 1) {
            const d = density.densityAt(cx, cy);
            if (d > 3) {
                const lookAhead = 5;
                const ahead = density.densityAt(cx + Math.cos(cAngle) * lookAhead, cy + Math.sin(cAngle) * lookAhead);
                const left = density.densityAt(cx + Math.cos(cAngle - 1.0) * lookAhead, cy + Math.sin(cAngle - 1.0) * lookAhead);
                const right = density.densityAt(cx + Math.cos(cAngle + 1.0) * lookAhead, cy + Math.sin(cAngle + 1.0) * lookAhead);
                if (left < ahead && left <= right) cAngle -= params.densityAvoidance * 0.2;
                else if (right < ahead) cAngle += params.densityAvoidance * 0.2;
            }
        }

        const nx = cx + Math.cos(cAngle) * segLength;
        const ny = cy + Math.sin(cAngle) * segLength;
        if (Math.abs(nx) > 98 || Math.abs(ny) > 98) break;

        const depthRatio = depth / params.maxDepth;
        const opacity = params.baseOpacity * Math.pow(1 - depthRatio, params.depthFadeExp);
        const width = params.baseWidth * Math.pow(params.widthDecayBase, depth);

        segments.push({
            x1: cx, y1: cy, x2: nx, y2: ny,
            opacity: Math.max(0.06, opacity),
            width: Math.max(0.1, width),
            depth
        });

        density.add(nx, ny);
        cx = nx; cy = ny;

        // Branching (from Series III)
        const branchChance = params.branchProbBase + depthRatio * params.branchProbDepth;
        if (s >= 2 && rand() < branchChance) {
            const spread = params.branchAngle * (0.7 + rand() * 0.6);
            const jitter = (rand() - 0.5) * 0.3;
            growField(cx, cy, cAngle - spread + jitter, params, fieldFn, fieldParams, depth + 1, rand, density, segments);
            growField(cx, cy, cAngle + spread + jitter, params, fieldFn, fieldParams, depth + 1, rand, density, segments);
            if (rand() < 0.15)
                growField(cx, cy, cAngle + (rand() - 0.5) * 0.4, params, fieldFn, fieldParams, depth + 1, rand, density, segments);
            return;
        }
    }
}

// --- Renderer (adapted from Series III, supports multiple field-parameter sets) ---

function renderFieldStudy(params, fieldFn, fieldParams, seed, filename, origins) {
    const rand = mulberry32(seed);
    const density = new DensityField(params.densityCellSize || 5);
    const segments = [];

    for (const origin of origins) {
        density.add(origin.x, origin.y);
        growField(origin.x, origin.y, origin.angle, params, fieldFn, fieldParams, 0, rand, density, segments);
    }

    const svgSize = 1000;
    const scale = svgSize / 200;
    const toX = (x) => (x + 100) * scale;
    const toY = (y) => (y + 100) * scale;

    // Group segments by opacity+width for efficient SVG paths
    const groups = new Map();
    for (const seg of segments) {
        const opKey = Math.round(seg.opacity * 20) / 20;
        const wKey = Math.round(seg.width * 10) / 10;
        const key = `${opKey}_${wKey}`;
        if (!groups.has(key)) groups.set(key, { segs: [], opacity: opKey, width: wKey });
        groups.get(key).segs.push(seg);
    }

    const sortedGroups = [...groups.values()].sort((a, b) => b.opacity - a.opacity);

    let body = '';
    for (const g of sortedGroups) {
        let pathData = '';
        for (const s of g.segs) {
            pathData += `M ${toX(s.x1).toFixed(2)} ${toY(s.y1).toFixed(2)} L ${toX(s.x2).toFixed(2)} ${toY(s.y2).toFixed(2)} `;
        }
        body += `<path d="${pathData}" stroke="#1a1a1a" stroke-width="${(g.width * scale * 0.4).toFixed(2)}" opacity="${g.opacity}" fill="none" stroke-linecap="round"/>\n`;
    }

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}" width="${svgSize}" height="${svgSize}">
  <rect width="${svgSize}" height="${svgSize}" fill="#f5f0e8"/>
${body}</svg>`;

    fs.writeFileSync(filename, svg);
    console.log(`${filename}: ${segments.length} segments`);
    return segments.length;
}

// --- Origin generators ---

function radialOrigins(cx, cy, count, radius, angleOffset = 0) {
    const origins = [];
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + angleOffset;
        origins.push({
            x: cx + Math.cos(angle) * radius,
            y: cy + Math.sin(angle) * radius,
            angle: angle
        });
    }
    return origins;
}

function scatteredOrigins(rand, count, xRange = 80, yRange = 80) {
    const origins = [];
    for (let i = 0; i < count; i++) {
        const angle = rand() * Math.PI * 2;
        origins.push({
            x: (rand() - 0.5) * 2 * xRange,
            y: (rand() - 0.5) * 2 * yRange,
            angle: angle
        });
    }
    return origins;
}

// ============================================================
// STUDY XIII — "Magnetic Dendrite" — neuron following a dipole field
// The soma sits at the center; dendrites follow field lines.
// ============================================================

console.log('=== Series IV: Dendritic Field Studies ===\n');

// Base dendritic params (proven from Series III neuron)
const baseParams = {
    maxDepth: 9,
    segLength: 0.7,
    branchLength: 24,
    branchProbBase: 0.05,
    branchProbDepth: 0.10,
    branchAngle: 0.55,
    curveStrength: 0.8,
    noise: 0.08,
    densityAvoidance: 0.5,
    densityCellSize: 5,
    baseOpacity: 0.80,
    depthFadeExp: 1.5,
    baseWidth: 1.4,
    widthDecayBase: 0.74,
    lengthDecay: 0.76,
    fieldStrength: 0.5   // how strongly branches follow the field
};

// XIII-a: Central neuron in a magnetic dipole field
// Poles at left/right, neuron at center. Dendrites should curve along field lines.
console.log('Study XIII-a: Magnetic Dendrite (central neuron, dipole field)');
renderFieldStudy(
    { ...baseParams, fieldStrength: 0.4 },
    magneticDipole,
    { poleX: -35, poleY: 0, poleX2: 35, poleY2: 0, strength: 600 },
    31415,
    'study-xiii-magnetic-dendrite-a.svg',
    radialOrigins(0, 0, 12, 4, 0.1)
);

// XIII-b: Stronger field — dendrites should be more flow-guided
console.log('Study XIII-b: Magnetic Dendrite (stronger field influence)');
renderFieldStudy(
    { ...baseParams, fieldStrength: 0.8 },
    magneticDipole,
    { poleX: -35, poleY: 0, poleX2: 35, poleY2: 0, strength: 600 },
    31415,
    'study-xiii-magnetic-dendrite-b.svg',
    radialOrigins(0, 0, 12, 4, 0.1)
);

// XIII-c: Poles above/below — vertical dipole
console.log('Study XIII-c: Magnetic Dendrite (vertical dipole)');
renderFieldStudy(
    { ...baseParams, fieldStrength: 0.6 },
    magneticDipole,
    { poleX: 0, poleY: -35, poleX2: 0, poleY2: 35, strength: 600 },
    31415,
    'study-xiii-magnetic-dendrite-c.svg',
    radialOrigins(0, 0, 12, 4, 0.1)
);

// ============================================================
// STUDY XIV — "Lorenz Tree" — dendrites following Lorenz attractor
// The chaotic attractor should create organic, unpredictable branching patterns.
// ============================================================

console.log('\nStudy XIV-a: Lorenz Tree (central origin)');
renderFieldStudy(
    { ...baseParams, fieldStrength: 0.6 },
    lorenzField,
    { sigma: 10, rho: 28, beta: 2.667, scale: 0.05 },
    2718,
    'study-xiv-lorenz-tree-a.svg',
    radialOrigins(0, 0, 10, 4, 0.1)
);

console.log('Study XIV-b: Lorenz Tree (scattered origins — forest)');
const forestRand = mulberry32(42);
renderFieldStudy(
    { ...baseParams, fieldStrength: 0.5, maxDepth: 8, branchLength: 20 },
    lorenzField,
    { sigma: 10, rho: 28, beta: 2.667, scale: 0.05 },
    42,
    'study-xiv-lorenz-tree-b.svg',
    scatteredOrigins(forestRand, 8, 60, 60)
);

// ============================================================
// STUDY XV — "Whirlpool" — dendrites following convergence+swirl field
// Pure convergence principle: focal point with rotational component.
// ============================================================

console.log('\nStudy XV-a: Whirlpool (central focus, moderate swirl)');
renderFieldStudy(
    { ...baseParams, fieldStrength: 0.5 },
    convergenceField,
    { focusX: 0, focusY: 0, pull: 0.4, swirl: 0.5 },
    512,
    'study-xv-whirlpool-a.svg',
    scatteredOrigins(mulberry32(512), 20, 80, 80)
);

console.log('Study XV-b: Whirlpool (strong swirl — galaxy structure)');
renderFieldStudy(
    { ...baseParams, fieldStrength: 0.6 },
    convergenceField,
    { focusX: 0, focusY: 0, pull: 0.25, swirl: 0.7 },
    512,
    'study-xv-whirlpool-b.svg',
    scatteredOrigins(mulberry32(512), 20, 80, 80)
);

// ============================================================
// STUDY XVI — "Synaptic Field" — dual convergence with dendritic growth
// Two focal points pulling dendrites toward each other — the Synapse concept
// redone as a field problem rather than a directional bias problem.
// ============================================================

console.log('\nStudy XVI-a: Synaptic Field (dual convergence, dendritic)');
renderFieldStudy(
    { ...baseParams, fieldStrength: 0.5, maxDepth: 9 },
    dualConvergenceField,
    { f1x: -30, f1y: 0, f2x: 30, f2y: 0, pull: 0.3, swirl: 0.25 },
    818,
    'study-xvi-synaptic-field-a.svg',
    scatteredOrigins(mulberry32(818), 16, 75, 75)
);

console.log('Study XVI-b: Synaptic Field (stronger pull — tight interlace)');
renderFieldStudy(
    { ...baseParams, fieldStrength: 0.7, maxDepth: 9 },
    dualConvergenceField,
    { f1x: -28, f1y: 0, f2x: 28, f2y: 0, pull: 0.4, swirl: 0.15 },
    818,
    'study-xvi-synaptic-field-b.svg',
    scatteredOrigins(mulberry32(818), 16, 75, 75)
);

// ============================================================
// STUDY XVII — "Magnetic Forest" — scattered origins in dipole field
// Multiple small trees, each following the magnetic field differently
// depending on their position relative to the poles.
// ============================================================

console.log('\nStudy XVII-a: Magnetic Forest (scattered trees in dipole)');
renderFieldStudy(
    { ...baseParams, fieldStrength: 0.5, maxDepth: 7, branchLength: 18 },
    magneticDipole,
    { poleX: -25, poleY: 10, poleX2: 25, poleY2: -10, strength: 500 },
    1337,
    'study-xvii-magnetic-forest-a.svg',
    scatteredOrigins(mulberry32(1337), 12, 65, 65)
);

console.log('\n=== All Series IV renders complete ===');
