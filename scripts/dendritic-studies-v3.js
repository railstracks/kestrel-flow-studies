// Dendritic Studies v3 — Seed exploration + Synapse study
// Neuron scored 9/10 in v2. Exploring seed variations for optimal composition.
// Also: "Synapse" — two neuronal trees whose dendrites interlace, testing
// the density-feedback at a compositional level.

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

function grow(x, y, angle, params, depth, rand, density, segments) {
    if (depth >= params.maxDepth) return;
    if (Math.abs(x) > 98 || Math.abs(y) > 98) return;

    const segLength = params.segLength;
    const branchLength = params.branchLength * Math.pow(params.lengthDecay, depth);
    const totalSegs = Math.max(4, Math.floor(branchLength / segLength));

    let cx = x, cy = y, cAngle = angle;
    const branchDrift = (rand() - 0.5) * params.curveStrength;

    for (let s = 0; s < totalSegs; s++) {
        cAngle += branchDrift * 0.03;

        const angleDiff = params.preferredAngle - cAngle;
        const normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
        cAngle += normalizedDiff * params.directionalBias * 0.015;

        cAngle += (rand() - 0.5) * params.noise;

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

        const branchChance = params.branchProbBase + depthRatio * params.branchProbDepth;
        if (s >= 2 && rand() < branchChance) {
            const spread = params.branchAngle * (0.7 + rand() * 0.6);
            const jitter = (rand() - 0.5) * 0.3;
            grow(cx, cy, cAngle - spread + jitter, params, depth + 1, rand, density, segments);
            grow(cx, cy, cAngle + spread + jitter, params, depth + 1, rand, density, segments);
            if (rand() < 0.15)
                grow(cx, cy, cAngle + (rand() - 0.5) * 0.4, params, depth + 1, rand, density, segments);
            return;
        }
    }
}

function renderStudy(params, seed, filename) {
    const rand = mulberry32(seed);
    const density = new DensityField(params.densityCellSize || 5);
    const segments = [];

    for (const origin of params.origins) {
        density.add(origin.x, origin.y);
        grow(origin.x, origin.y, origin.angle, params, 0, rand, density, segments);
    }

    const svgSize = 1000;
    const scale = svgSize / 200;
    const toX = (x) => (x + 100) * scale;
    const toY = (y) => (y + 100) * scale;

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

// --- Neuron parameters (proven from v2) ---
function makeNeuronOrigins(centerX = 0, centerY = 0, count = 12, radius = 4, angleOffset = 0.1) {
    const origins = [];
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + angleOffset;
        origins.push({
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
            angle: angle + (Math.random() - 0.5) * 0.15
        });
    }
    return origins;
}

const neuronParams = {
    maxDepth: 10,
    segLength: 0.7,
    branchLength: 26,
    branchProbBase: 0.05,
    branchProbDepth: 0.11,
    branchAngle: 0.55,
    curveStrength: 1.0,
    noise: 0.09,
    directionalBias: 0.0,
    preferredAngle: 0,
    densityAvoidance: 0.6,
    densityCellSize: 5,
    baseOpacity: 0.80,
    depthFadeExp: 1.5,
    baseWidth: 1.4,
    widthDecayBase: 0.74,
    lengthDecay: 0.76,
    origins: makeNeuronOrigins(0, 0, 12, 4, 0.1)
};

// --- Seed exploration ---
console.log('=== Neuron Seed Exploration ===\n');
const seeds = [271, 1024, 1337, 7777, 31415];
for (const seed of seeds) {
    neuronParams.origins = makeNeuronOrigins(0, 0, 12, 4, seed * 0.001);
    renderStudy(neuronParams, seed, `study-xi-neuron-${seed}.svg`);
}

// --- Synapse: Two neurons reaching toward each other ---
// Two somas at left and right, their dendrites interlace in the middle.
// Tests density feedback at compositional scale.
console.log('\n=== Synapse Study ===\n');

const synapseParams = {
    maxDepth: 10,
    segLength: 0.7,
    branchLength: 24,
    branchProbBase: 0.05,
    branchProbDepth: 0.11,
    branchAngle: 0.55,
    curveStrength: 1.0,
    noise: 0.09,
    directionalBias: 0.15,       // slight pull toward center
    densityAvoidance: 0.7,       // stronger avoidance — they should sense each other
    densityCellSize: 5,
    baseOpacity: 0.80,
    depthFadeExp: 1.5,
    baseWidth: 1.3,
    widthDecayBase: 0.74,
    lengthDecay: 0.76,
    origins: [
        // Left neuron (8 dendrites, biased rightward toward partner)
        ...(() => {
            const origins = [];
            for (let i = 0; i < 10; i++) {
                const angle = (i / 10) * Math.PI * 2;
                origins.push({
                    x: -38 + Math.cos(angle) * 3,
                    y: 0 + Math.sin(angle) * 3,
                    angle: angle
                });
            }
            return origins;
        })(),
        // Right neuron (8 dendrites, biased leftward toward partner)
        ...(() => {
            const origins = [];
            for (let i = 0; i < 10; i++) {
                const angle = (i / 10) * Math.PI * 2;
                origins.push({
                    x: 38 + Math.cos(angle) * 3,
                    y: 0 + Math.sin(angle) * 3,
                    angle: angle
                });
            }
            return origins;
        })(),
    ]
};
// Override directional bias to pull each neuron toward center
// We need to pass different preferred angles for each neuron — but our current
// architecture uses global params. Let's use a workaround: set preferredAngle to 0
// for both, and place them symmetrically. The slight directional bias will pull
// left neuron rightward (toward angle 0 from angle PI) and right neuron leftward.
// Actually, let's just set directionalBias to 0 (pure isotropic) and let the
// density feedback handle the interlacing naturally.
synapseParams.directionalBias = 0.0;

renderStudy(synapseParams, 818, 'study-xii-synapse.svg');

// --- Synapse v2: with directional attraction ---
console.log('\n=== Synapse v2: Directional Attraction ===\n');
// This version uses two separate render passes merged into one SVG.
// Each neuron has its own preferred angle (toward the other).
const fs2 = require('fs');

function renderMultiOrigins(originsList, paramsList, seed, filename) {
    const rand = mulberry32(seed);
    const density = new DensityField(paramsList[0].densityCellSize || 5);
    const segments = [];

    for (let oi = 0; oi < originsList.length; oi++) {
        const params = paramsList[oi];
        for (const origin of originsList[oi]) {
            density.add(origin.x, origin.y);
            grow(origin.x, origin.y, origin.angle, params, 0, rand, density, segments);
        }
    }

    const svgSize = 1000;
    const scale = svgSize / 200;
    const toX = (x) => (x + 100) * scale;
    const toY = (y) => (y + 100) * scale;

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

    fs2.writeFileSync(filename, svg);
    console.log(`${filename}: ${segments.length} segments`);
}

const neuronLeft = { ...neuronParams, preferredAngle: 0, directionalBias: 0.2 };  // pull rightward
const neuronRight = { ...neuronParams, preferredAngle: Math.PI, directionalBias: 0.2 }; // pull leftward

renderMultiOrigins(
    [
        makeNeuronOrigins(-35, 0, 10, 3),
        makeNeuronOrigins(35, 0, 10, 3),
    ],
    [neuronLeft, neuronRight],
    818,
    'study-xii-synapse-v2.svg'
);

console.log('\nAll renders complete.');
