// Dendritic Studies v2 — Kestrel's Series III generative art
// Addresses v1 critique: sparse, mechanical, insufficient depth/layering.
//
// Key changes from v1:
// 1. More aggressive branching (higher probability, shorter branch runs)
// 2. Dramatic line weight tapering (trunk 1.8px → tip 0.1px)
// 3. Pronounced opacity gradient (trunk 0.85 → tip 0.08)
// 4. Organic curvature via per-branch drift + higher noise
// 5. More recursion depth (10-12 levels) for fractal complexity
// 6. Better compositional framing (fill the canvas, bleed off edges)
// 7. Curve parameter — branches have natural arc (phototropism analog)

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
    constructor(cellSize = 6) {
        this.cellSize = cellSize;
        this.cells = new Map();
    }
    add(x, y) {
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        const key = `${cx},${cy}`;
        this.cells.set(key, (this.cells.get(key) || 0) + 1);
    }
    densityAt(x, y) {
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        let total = 0;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                total += this.cells.get(`${cx+dx},${cy+dy}`) || 0;
            }
        }
        return total;
    }
}

// --- Enhanced recursive growth ---
// Each branch is a curved arc with:
// - Per-branch curvature (drift) — mimics phototropism / gravity influence
// - Brownian noise per segment
// - Density-aware direction (feedback)
// - Dramatic width and opacity tapering by depth
function grow(x, y, angle, params, depth, rand, density, segments) {
    if (depth >= params.maxDepth) return;
    if (Math.abs(x) > 98 || Math.abs(y) > 98) return;

    const segLength = params.segLength;
    // Shorter branches at deeper levels (but not too short — maintain visible structure)
    const branchLength = params.branchLength * Math.pow(params.lengthDecay, depth);
    const totalSegs = Math.max(4, Math.floor(branchLength / segLength));

    let cx = x, cy = y, cAngle = angle;

    // Per-branch curvature: a random drift that persists through the branch
    // This creates arcing branches rather than zig-zag noise
    const branchDrift = (rand() - 0.5) * params.curveStrength;

    for (let s = 0; s < totalSegs; s++) {
        // Persistent curve drift (same direction through whole branch)
        cAngle += branchDrift * 0.03;

        // Directional bias — pull toward preferred direction
        const angleDiff = params.preferredAngle - cAngle;
        const normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
        cAngle += normalizedDiff * params.directionalBias * 0.015;

        // Brownian noise
        cAngle += (rand() - 0.5) * params.noise;

        // Density feedback — steer away from crowded areas
        if (params.densityAvoidance > 0 && depth < params.maxDepth - 1) {
            const d = density.densityAt(cx, cy);
            if (d > 3) {
                const lookAhead = 5;
                const ahead = density.densityAt(
                    cx + Math.cos(cAngle) * lookAhead,
                    cy + Math.sin(cAngle) * lookAhead
                );
                const left = density.densityAt(
                    cx + Math.cos(cAngle - 1.0) * lookAhead,
                    cy + Math.sin(cAngle - 1.0) * lookAhead
                );
                const right = density.densityAt(
                    cx + Math.cos(cAngle + 1.0) * lookAhead,
                    cy + Math.sin(cAngle + 1.0) * lookAhead
                );
                if (left < ahead && left <= right) cAngle -= params.densityAvoidance * 0.2;
                else if (right < ahead) cAngle += params.densityAvoidance * 0.2;
            }
        }

        // Step
        const nx = cx + Math.cos(cAngle) * segLength;
        const ny = cy + Math.sin(cAngle) * segLength;

        if (Math.abs(nx) > 98 || Math.abs(ny) > 98) break;

        // Depth-based opacity and width — dramatic tapering
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
        cx = nx;
        cy = ny;

        // Branching — probability increases with depth (terminal branching dominant)
        const branchChance = params.branchProbBase + depthRatio * params.branchProbDepth;
        if (s >= 2 && rand() < branchChance) {
            const spread = params.branchAngle * (0.7 + rand() * 0.6); // variable spread
            const jitter = (rand() - 0.5) * 0.3; // angle jitter at branch point

            // Two children
            grow(cx, cy, cAngle - spread + jitter, params, depth + 1, rand, density, segments);
            grow(cx, cy, cAngle + spread + jitter, params, depth + 1, rand, density, segments);

            // Occasional trinary split (15% chance — adds organic variety)
            if (rand() < 0.15) {
                grow(cx, cy, cAngle + (rand() - 0.5) * 0.4, params, depth + 1, rand, density, segments);
            }
            return;
        }
    }
}

function renderStudy(params, seed, filename) {
    const rand = mulberry32(seed);
    const density = new DensityField(params.densityCellSize || 6);
    const segments = [];

    for (const origin of params.origins) {
        density.add(origin.x, origin.y);
        grow(origin.x, origin.y, origin.angle, params, 0, rand, density, segments);
    }

    const svgSize = 1000;
    const scale = svgSize / 200;
    const toX = (x) => (x + 100) * scale;
    const toY = (y) => (y + 100) * scale;

    // Group by similar opacity+width for cleaner SVG
    const groups = new Map();
    for (const seg of segments) {
        const opKey = Math.round(seg.opacity * 20) / 20; // quantize to 0.05 steps
        const wKey = Math.round(seg.width * 10) / 10;    // quantize to 0.1 steps
        const key = `${opKey}_${wKey}`;
        if (!groups.has(key)) groups.set(key, { segs: [], opacity: opKey, width: wKey });
        groups.get(key).segs.push(seg);
    }

    // Sort groups by opacity (darhest first = drawn first, lighter on top)
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

    // Stats
    const depthHist = {};
    for (const s of segments) {
        depthHist[s.depth] = (depthHist[s.depth] || 0) + 1;
    }
    console.log(`${filename}: ${segments.length} segments, ${groups.size} style groups`);
    console.log(`  Depth distribution:`, depthHist);

    return { segments: segments.length, groups: groups.size };
}

// ============================================================
// Study IX v2 — "Frost" (seed 42)
// Frost ferns: upward, crystalline, fine terminal branching.
// v2 changes: more origins (fill the frame), more branching,
// dramatic tapering, organic curve, longer maxDepth.
// ============================================================

const frostParams = {
    maxDepth: 11,
    segLength: 0.9,
    branchLength: 22,
    branchProbBase: 0.04,
    branchProbDepth: 0.12,     // at max depth: 0.04 + 1.0*0.12 = 0.16 per segment
    branchAngle: 0.50,
    curveStrength: 0.8,        // branches curve gently
    noise: 0.10,
    directionalBias: 0.6,      // strong upward bias
    preferredAngle: -Math.PI / 2,
    densityAvoidance: 0.7,
    densityCellSize: 5,
    baseOpacity: 0.85,
    depthFadeExp: 1.8,         // exponential fade — dramatic opacity range
    baseWidth: 1.6,            // thick trunks
    widthDecayBase: 0.72,      // exponential tapering per depth level
    lengthDecay: 0.78,
    origins: (() => {
        const origins = [];
        // Dense row of frost origins along the bottom
        for (let i = 0; i < 18; i++) {
            const x = -85 + (i * 170 / 17) + (Math.random() - 0.5) * 6;
            origins.push({
                x,
                y: 88 + (Math.random() - 0.5) * 5,
                angle: -Math.PI / 2 + (Math.random() - 0.5) * 0.3
            });
        }
        return origins;
    })()
};

// ============================================================
// Study X v2 — "Roots" (seed 512)
// Root system: downward, organic, wandering. Fewer origins but
// more complex branching. Branches meander (soil is uneven).
// v2: fill more of the canvas, dramatic tapering, higher noise.
// ============================================================

const rootParams = {
    maxDepth: 12,
    segLength: 0.8,
    branchLength: 30,
    branchProbBase: 0.03,
    branchProbDepth: 0.10,
    branchAngle: 0.65,
    curveStrength: 1.2,        // roots curve more than frost
    noise: 0.14,               // more wander
    directionalBias: 0.35,     // gentler pull — roots meander
    preferredAngle: Math.PI / 2,
    densityAvoidance: 0.5,
    densityCellSize: 6,
    baseOpacity: 0.85,
    depthFadeExp: 1.6,
    baseWidth: 2.0,            // very thick trunks
    widthDecayBase: 0.75,
    lengthDecay: 0.80,
    origins: (() => {
        // Cluster of root origins (tree base)
        const origins = [];
        const baseX = 0;
        for (let i = 0; i < 7; i++) {
            const xOff = (i - 3) * 10 + (Math.random() - 0.5) * 4;
            origins.push({
                x: baseX + xOff,
                y: -82 + (Math.random() - 0.5) * 4,
                angle: Math.PI / 2 + (xOff * 0.008) // spread outward slightly
            });
        }
        return origins;
    })()
};

// ============================================================
// Study XI v2 — "Neuron" (seed 999)
// Isotropic dendritic tree from central soma.
// v2: much larger radius, more primary branches, fill 70% of canvas.
// The strongest composition from v1 — push it further.
// ============================================================

const neuronParams = {
    maxDepth: 10,
    segLength: 0.7,
    branchLength: 26,
    branchProbBase: 0.05,
    branchProbDepth: 0.11,
    branchAngle: 0.55,
    curveStrength: 1.0,
    noise: 0.09,
    directionalBias: 0.0,      // isotropic
    preferredAngle: 0,
    densityAvoidance: 0.6,
    densityCellSize: 5,
    baseOpacity: 0.80,
    depthFadeExp: 1.5,
    baseWidth: 1.4,
    widthDecayBase: 0.74,
    lengthDecay: 0.76,
    origins: (() => {
        // 12 primary dendrites radiating from center
        const origins = [];
        const n = 12;
        for (let i = 0; i < n; i++) {
            const angle = (i / n) * Math.PI * 2 + 0.1;
            origins.push({
                x: Math.cos(angle) * 4,
                y: Math.sin(angle) * 4,
                angle: angle + (Math.random() - 0.5) * 0.15
            });
        }
        return origins;
    })()
};

// --- Render ---
console.log('Rendering Dendritic Studies v2 (Series III)...\n');

const results = {};
results['IX-Frost'] = renderStudy(frostParams, 42, 'study-ix-frost.svg');
console.log('');
results['X-Roots'] = renderStudy(rootParams, 512, 'study-x-roots.svg');
console.log('');
results['XI-Neuron'] = renderStudy(neuronParams, 999, 'study-xi-neuron.svg');

console.log('\nResults:', JSON.stringify(results, null, 2));
