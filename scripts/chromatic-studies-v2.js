// Flow Studies Series V — Chromatic Studies (Full Set)
// Studies XXI–XXV: structural-to-chromatic mappings with identity palettes
//
// Study XXI "Journey" — Lorenz attractor + Fog & Whiskey (position along trail → color)
// Study XXII "Field" — Dual convergence + Patina (field magnitude → color)
// Study XXIV "Wildling" — Dendritic recursion + Inkwell (recursion depth → color, seed 2)
// Study XXV "Bramble" — Same family, seed 34 — the tension twin
//
// Released pair surfaced by the second seed-curation sweep (60 seeds, Growth
// family): scripts/chromatic-sweep/. The explored incumbent (seed 31415) fell
// to third in the eye rounds — "specimen vs art" — and is kept below as
// exploration lineage. (No Study XXIII here: that number belongs to Triple
// Collision, released from the first sweep.)
//
// Design doc: SERIES-V-COLOR-DESIGN.md
// First color experiment validated: Study XX "Reveal" (9/10 on dark background)

const fs = require('fs');

// ═══════════════════════════════════════════════════════════════
// Core Infrastructure
// ═══════════════════════════════════════════════════════════════

function mulberry32(seed) {
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// IQ Cosine Palette: color(t) = a + b · cos[2π(c·t + d)]
function cosine(t, a, b, c, d) {
    const r = a[0] + b[0] * Math.cos(2 * Math.PI * (c[0] * t + d[0]));
    const g = a[1] + b[1] * Math.cos(2 * Math.PI * (c[1] * t + d[1]));
    const bl = a[2] + b[2] * Math.cos(2 * Math.PI * (c[2] * t + d[2]));
    return [
        Math.round(Math.max(0, Math.min(1, r)) * 255),
        Math.round(Math.max(0, Math.min(1, g)) * 255),
        Math.round(Math.max(0, Math.min(1, bl)) * 255)
    ];
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

// ═══════════════════════════════════════════════════════════════
// Identity Palettes
// ═══════════════════════════════════════════════════════════════

// Fog & Whiskey — warm gold → smoky grey (half-cycle, no return)
// Increased amplitude for visible gradient
const fogWhiskey = {
    a: [0.55, 0.46, 0.30],   // midpoint
    b: [0.25, 0.17, 0.05],   // larger amplitude for clear gold→grey shift
    c: [0.5,  0.5,  0.5],    // half-cycle
    d: [0.0,  0.0,  0.0]     // starts gold, ends grey
};

// Patina — soft sage → vivid verdigris (half-cycle)
// Fixed: t=0 is sage green (G>R>B), t=1 is vivid verdigris
const patina = {
    a: [0.34, 0.685, 0.535],  // midpoint
    b: [0.17, 0.095, 0.065],  // R has largest swing (decreases), G&B increase
    c: [0.5,  0.5,   0.5],
    d: [0.0,  0.5,   0.5]     // R starts high, G&B start low
};

// Inkwell — deep indigo → silver-blue (half-cycle)
// Brightened silver-blue endpoint for visibility against dark background
const inkwell = {
    a: [0.45,  0.455, 0.575], // midpoint
    b: [0.26,  0.305, 0.325], // large amplitude for clear dark→bright swing
    c: [0.5,   0.5,   0.5],
    d: [0.5,   0.5,   0.5]    // starts dark, ends bright
};

// ═══════════════════════════════════════════════════════════════
// Field Formulas
// ═══════════════════════════════════════════════════════════════

// Lorenz attractor — butterfly fold dynamics
function fieldLorenz(x, y) {
    const sigma = 10.0, rho = 28.0, beta = 8.0 / 3.0;
    const lx = x * 0.05, ly = y * 0.05;
    const lz = 20.0 + Math.sin(x * 0.01 + y * 0.008) * 10.0;
    const dx = sigma * (ly - lx);
    const dy = lx * (rho - lz) - ly;
    return Math.atan2(dy, dx) * 180 / Math.PI;
}

// Dual convergence — two foci with ASYMMETRIC strength and off-center positions
function fieldDualConvergence(x, y) {
    const foci = [
        { x: -35, y: 20, strength: 55 },  // stronger, upper-left
        { x: 25,  y: -20, strength: 35 }   // weaker, lower-right
    ];
    let fx = 0, fy = 0;
    for (const f of foci) {
        const dx = f.x - x, dy = f.y - y;
        const r = Math.sqrt(dx*dx + dy*dy) + 2;
        // Radial pull
        fx += (dx / r) * f.strength / r;
        fy += (dy / r) * f.strength / r;
        // Tangential (swirl)
        fx += (-dy / r) * f.strength / (r * 2.5);
        fy += (dx / r) * f.strength / (r * 2.5);
    }
    return Math.atan2(fy, fx) * 180 / Math.PI;
}

// Field magnitude for dual convergence (for Study XXII color mapping)
function fieldMagnitude(x, y) {
    const foci = [
        { x: -35, y: 20, strength: 55 },
        { x: 25,  y: -20, strength: 35 }
    ];
    let mag = 0;
    for (const f of foci) {
        const dx = f.x - x, dy = f.y - y;
        const r = Math.sqrt(dx*dx + dy*dy) + 2;
        mag += f.strength / r;
    }
    return mag;
}

// ═══════════════════════════════════════════════════════════════
// Trail Simulation
// ═══════════════════════════════════════════════════════════════

function simulateTrails(fieldFn, seed, numTrails, trailLen, stepSize) {
    const rand = mulberry32(seed);
    const trails = [];

    for (let i = 0; i < numTrails; i++) {
        const startX = (rand() - 0.5) * 180;
        const startY = (rand() - 0.5) * 180;
        const opacity = 0.30 + rand() * 0.40;

        let x = startX, y = startY;
        const segments = [];

        for (let step = 0; step < trailLen; step++) {
            if (Math.abs(x) > 95 || Math.abs(y) > 95) break;
            const angle = fieldFn(x, y);
            const rad = angle * Math.PI / 180;
            const nx = x + Math.cos(rad) * stepSize;
            const ny = y + Math.sin(rad) * stepSize;
            segments.push({ x1: x, y1: y, x2: nx, y2: ny, step });
            x = nx;
            y = ny;
        }

        if (segments.length > 2) {
            trails.push({ segments, opacity, startStep: 0 });
        }
    }
    return trails;
}

// ═══════════════════════════════════════════════════════════════
// Dendritic Growth (for Study XXIII)
// ═══════════════════════════════════════════════════════════════

class SpatialHash {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.cells = new Map();
    }
    _key(x, y) {
        return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
    }
    add(x, y) {
        const k = this._key(x, y);
        this.cells.set(k, (this.cells.get(k) || 0) + 1);
    }
    densityAt(x, y) {
        return this.cells.get(this._key(x, y)) || 0;
    }
}

function dendriticGrowth(seed, params) {
    const rand = mulberry32(seed);
    const density = new SpatialHash(3);
    const segments = [];

    function grow(x, y, angle, depth) {
        if (depth >= params.maxDepth) return;
        if (Math.abs(x) > 92 || Math.abs(y) > 92) return;

        const segLength = params.segLength;
        const branchLength = params.branchLength * Math.pow(params.lengthDecay, depth);
        const totalSegs = Math.max(3, Math.floor(branchLength / segLength));
        let cx = x, cy = y, cAngle = angle;
        const branchDrift = (rand() - 0.5) * params.curveStrength;

        for (let s = 0; s < totalSegs; s++) {
            cAngle += branchDrift * 0.03;
            const angleDiff = params.preferredAngle - cAngle;
            const nd = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
            cAngle += nd * params.directionalBias * 0.015;
            cAngle += (rand() - 0.5) * params.noise;

            // Density feedback
            if (params.densityAvoidance > 0 && depth < params.maxDepth - 1) {
                const d = density.densityAt(cx, cy);
                if (d > 3) {
                    const la = cAngle - 1.0, ra = cAngle + 1.0;
                    const ahead = density.densityAt(cx + Math.cos(cAngle) * 5, cy + Math.sin(cAngle) * 5);
                    const left = density.densityAt(cx + Math.cos(la) * 5, cy + Math.sin(la) * 5);
                    const right = density.densityAt(cx + Math.cos(ra) * 5, cy + Math.sin(ra) * 5);
                    if (left < ahead && left <= right) cAngle -= params.densityAvoidance * 0.2;
                    else if (right < ahead) cAngle += params.densityAvoidance * 0.2;
                }
            }

            const nx = cx + Math.cos(cAngle) * segLength;
            const ny = cy + Math.sin(cAngle) * segLength;
            if (Math.abs(nx) > 92 || Math.abs(ny) > 92) break;

            segments.push({ x1: cx, y1: cy, x2: nx, y2: ny, depth });
            density.add(nx, ny);
            cx = nx; cy = ny;

            const depthRatio = depth / params.maxDepth;
            const branchChance = params.branchProbBase + depthRatio * params.branchProbDepth;
            if (s >= 2 && rand() < branchChance) {
                const spread = params.branchAngle * (0.7 + rand() * 0.6);
                const jitter = (rand() - 0.5) * 0.3;
                grow(cx, cy, cAngle - spread + jitter, depth + 1);
                grow(cx, cy, cAngle + spread + jitter, depth + 1);
                if (rand() < 0.15) {
                    grow(cx, cy, cAngle + (rand() - 0.5) * 0.4, depth + 1);
                }
                return;
            }
        }
    }

    // Multiple trunks for richer composition
    const numTrunks = 3;
    for (let t = 0; t < numTrunks; t++) {
        const tx = (rand() - 0.5) * 30;
        const ty = (rand() - 0.5) * 30;
        const ta = rand() * Math.PI * 2;
        grow(tx, ty, ta, 0);
    }

    return segments;
}

// Radial dendritic growth — N trunks radiating from center (Neuron topology)
function dendriticGrowthRadial(seed, params, numTrunks) {
    return dendriticGrowthRadialFrom(seed, params, numTrunks, 0, 0);
}

// Radial growth from specific position (for multi-neuron compositions)
function dendriticGrowthRadialFrom(seed, params, numTrunks, originX, originY) {
    const rand = mulberry32(seed);
    const density = new SpatialHash(5);
    const segments = [];

    for (let i = 0; i < numTrunks; i++) {
        const angle = (i / numTrunks) * Math.PI * 2 + 0.1;
        const ox = originX + Math.cos(angle) * 4;
        const oy = originY + Math.sin(angle) * 4;
        growRecursive(ox, oy, angle, 0, params, rand, density, segments);
    }
    return segments;
}

function growRecursive(x, y, angle, depth, params, rand, density, segments) {
    if (depth >= params.maxDepth) return;
    if (Math.abs(x) > 92 || Math.abs(y) > 92) return;

    const segLength = params.segLength;
    const branchLength = params.branchLength * Math.pow(params.lengthDecay, depth);
    const totalSegs = Math.max(4, Math.floor(branchLength / segLength));
    let cx = x, cy = y, cAngle = angle;
    const branchDrift = (rand() - 0.5) * params.curveStrength;

    for (let s = 0; s < totalSegs; s++) {
        cAngle += branchDrift * 0.03;
        cAngle += (rand() - 0.5) * params.noise;

        if (params.densityAvoidance > 0 && depth < params.maxDepth - 1) {
            const d = density.densityAt(cx, cy);
            if (d > 3) {
                const la = cAngle - 1.0, ra = cAngle + 1.0;
                const ahead = density.densityAt(cx + Math.cos(cAngle) * 5, cy + Math.sin(cAngle) * 5);
                const left = density.densityAt(cx + Math.cos(la) * 5, cy + Math.sin(la) * 5);
                const right = density.densityAt(cx + Math.cos(ra) * 5, cy + Math.sin(ra) * 5);
                if (left < ahead && left <= right) cAngle -= params.densityAvoidance * 0.2;
                else if (right < ahead) cAngle += params.densityAvoidance * 0.2;
            }
        }

        const nx = cx + Math.cos(cAngle) * segLength;
        const ny = cy + Math.sin(cAngle) * segLength;
        if (Math.abs(nx) > 92 || Math.abs(ny) > 92) break;

        segments.push({ x1: cx, y1: cy, x2: nx, y2: ny, depth });
        density.add(nx, ny);
        cx = nx; cy = ny;

        const depthRatio = depth / params.maxDepth;
        const branchChance = params.branchProbBase + depthRatio * params.branchProbDepth;
        if (s >= 2 && rand() < branchChance) {
            const spread = params.branchAngle * (0.7 + rand() * 0.6);
            const jitter = (rand() - 0.5) * 0.3;
            growRecursive(cx, cy, cAngle - spread + jitter, depth + 1, params, rand, density, segments);
            growRecursive(cx, cy, cAngle + spread + jitter, depth + 1, params, rand, density, segments);
            if (rand() < 0.15) {
                growRecursive(cx, cy, cAngle + (rand() - 0.5) * 0.4, depth + 1, params, rand, density, segments);
            }
            return;
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// SVG Generators
// ═══════════════════════════════════════════════════════════════

const SVG_SIZE = 1000;
const SCALE = SVG_SIZE / 200;
const toX = (x) => (x + 100) * SCALE;
const toY = (y) => (y + 100) * SCALE;

// Per-segment SVG (each line segment gets its own color + stroke modulated by t)
function generatePerSegmentSVG(segments, colorFn, bgColor, outputPath, options = {}) {
    const strokeMin = options.strokeMin ?? 0.3;
    const strokeMax = options.strokeMax ?? 0.7;
    const opacityBase = options.opacityBase ?? 0.5;
    const title = options.title ?? '';

    let lines = '';
    for (const seg of segments) {
        const t = colorFn(seg);
        const [r, g, b] = t.color;
        const hex = rgbToHex(r, g, b);
        // Stroke thicker where t is HIGH (near focal point / at bright end)
        const sw = strokeMin + t.t * (strokeMax - strokeMin);
        // Brighter segments also more opaque
        const op = opacityBase * (0.4 + t.t * 0.6);

        lines += `  <line x1="${toX(seg.x1).toFixed(1)}" y1="${toY(seg.y1).toFixed(1)}" `;
        lines += `x2="${toX(seg.x2).toFixed(1)}" y2="${toY(seg.y2).toFixed(1)}" `;
        lines += `stroke="${hex}" stroke-width="${sw.toFixed(2)}" `;
        lines += `stroke-linecap="round" opacity="${op.toFixed(2)}"/>\n`;
    }

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_SIZE} ${SVG_SIZE}" width="${SVG_SIZE}" height="${SVG_SIZE}">
  <title>${title}</title>
  <rect width="${SVG_SIZE}" height="${SVG_SIZE}" fill="${bgColor}"/>
${lines}</svg>`;

    fs.writeFileSync(outputPath, svg);
    return { segments: segments.length };
}

// Per-trail SVG (each trail gets one color, rendered as <path>)
function generatePerTrailSVG(trails, colorFn, bgColor, outputPath, options = {}) {
    const strokeMin = options.strokeMin ?? 0.3;
    const strokeMax = options.strokeMax ?? 0.7;

    let paths = '';
    for (const trail of trails) {
        const t = colorFn(trail);
        const [r, g, b] = t.color;
        const hex = rgbToHex(r, g, b);
        const sw = strokeMin + (1 - t.t) * (strokeMax - strokeMin);

        let pd = '';
        for (const seg of trail.segments) {
            pd += `M ${toX(seg.x1).toFixed(1)} ${toY(seg.y1).toFixed(1)} L ${toX(seg.x2).toFixed(1)} ${toY(seg.y2).toFixed(1)} `;
        }
        paths += `  <path d="${pd}" stroke="${hex}" stroke-width="${sw.toFixed(2)}" fill="none" stroke-linecap="round" opacity="${trail.opacity.toFixed(2)}"/>\n`;
    }

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_SIZE} ${SVG_SIZE}" width="${SVG_SIZE}" height="${SVG_SIZE}">
  <rect width="${SVG_SIZE}" height="${SVG_SIZE}" fill="${bgColor}"/>
${paths}</svg>`;

    fs.writeFileSync(outputPath, svg);
    return { trails: trails.length };
}

// ═══════════════════════════════════════════════════════════════
// STUDY XXI — "Journey"
// Lorenz attractor + Fog & Whiskey palette
// Mapping: position along trail → color
// Per-segment coloring: each segment's color encodes how far along its journey it is
// ═══════════════════════════════════════════════════════════════

console.log('━━━ Study XXI "Journey" — Lorenz + Fog & Whiskey ━━━');

{
    const trails = simulateTrails(fieldLorenz, 42, 180, 160, 1.0);
    const totalSegs = trails.reduce((s, t) => s + t.segments.length, 0);
    console.log(`  Simulated ${trails.length} trails, ${totalSegs} segments`);

    // Flatten all segments with per-segment t (position along trail)
    const allSegments = [];
    for (const trail of trails) {
        const segCount = trail.segments.length;
        for (const seg of trail.segments) {
            const t = seg.step / Math.max(1, segCount - 1);
            allSegments.push({
                ...seg,
                t,
                trailOpacity: trail.opacity
            });
        }
    }

    const colorFn = (seg) => {
        const c = cosine(seg.t, fogWhiskey.a, fogWhiskey.b, fogWhiskey.c, fogWhiskey.d);
        return { color: c, t: seg.t };
    };

    // Dark background — warm golds glow against deep charcoal
    const stats = generatePerSegmentSVG(allSegments, colorFn, '#0f0d0a',
        'study-xxi-journey-dark.svg', {
            strokeMin: 0.2,
            strokeMax: 0.55,
            opacityBase: 0.65,
            title: 'Study XXI Journey'
        });
    console.log(`  Generated ${stats.segments} colored segments → study-xxi-journey-dark.svg`);
}

// ═══════════════════════════════════════════════════════════════
// STUDY XXII — "Field"
// Dual convergence + Patina palette
// Mapping: field magnitude → color
// Per-trail coloring: each trail's average field magnitude determines its color
// ═══════════════════════════════════════════════════════════════

console.log('\n━━━ Study XXII "Field" — Dual Convergence + Patina ━━━');

{
    const trails = simulateTrails(fieldDualConvergence, 31415, 160, 150, 1.1);
    const totalSegs = trails.reduce((s, t) => s + t.segments.length, 0);
    console.log(`  Simulated ${trails.length} trails, ${totalSegs} segments`);

    // Per-segment coloring: each segment samples field magnitude at its own position
    // Find max magnitude across all segments for normalization
    const allSegments = [];
    let maxMag = 0;
    for (const trail of trails) {
        for (const seg of trail.segments) {
            const mag = fieldMagnitude(seg.x1, seg.y1);
            if (mag > maxMag) maxMag = mag;
            allSegments.push({ ...seg, mag });
        }
    }

    const colorFn = (seg) => {
        const rawT = Math.min(1, seg.mag / maxMag);
        const t = Math.pow(rawT, 0.5); // gamma correction — push more segments into bright range
        const c = cosine(t, patina.a, patina.b, patina.c, patina.d);
        return { color: c, t };
    };

    // Deep forest-green darkness — asymmetric composition
    const stats = generatePerSegmentSVG(allSegments, colorFn, '#080b09',
        'study-xxii-field-dark.svg', {
            strokeMin: 0.15,
            strokeMax: 0.6,
            opacityBase: 0.65,
            title: 'Study XXII Field'
        });
    console.log(`  Generated ${stats.segments} per-segment colored → study-xxii-field-dark.svg`);
}

// ═══════════════════════════════════════════════════════════════
// STUDY XXIV "Wildling" & STUDY XXV "Bramble"
// Dendritic recursive growth + Inkwell palette
// Mapping: recursion depth → color
// Per-segment coloring: trunk is deep indigo, twigs are silver-blue
// Released as an adjacent pair: Wildling breathes (negative space
// penetrates the form), Bramble grips (mass pulls inward, knotted).
// ═══════════════════════════════════════════════════════════════

console.log('\n━━━ Studies XXIV "Wildling" + XXV "Bramble" — Dendritic + Inkwell ━━━');

{
    const params = {
        segLength: 0.7,
        branchLength: 26,
        lengthDecay: 0.76,
        maxDepth: 10,
        branchAngle: 0.55,
        branchProbBase: 0.05,
        branchProbDepth: 0.11,
        noise: 0.09,
        curveStrength: 1.0,
        preferredAngle: 0,
        directionalBias: 0.0,  // isotropic — radiates in all directions
        densityAvoidance: 0.6,
    };

    // Normalize depth to t (0 = trunk, 1 = terminal twig)
    const maxDepth = params.maxDepth;
    const colorFn = (seg) => {
        const t = seg.depth / maxDepth;
        const c = cosine(t, inkwell.a, inkwell.b, inkwell.c, inkwell.d);
        return { color: c, t };
    };

    // Released pair (second seed-curation sweep, Aug 2026)
    for (const [seed, name, num] of [[2, 'Wildling', 'xxiv'], [34, 'Bramble', 'xxv']]) {
        const segs = dendriticGrowthRadial(seed, params, 12);
        console.log(`  ${name}: grew ${segs.length} segments (seed ${seed})`);
        generatePerSegmentSVG(segs, colorFn, '#10121c',
            `study-${num}-${name.toLowerCase()}.svg`, {
                strokeMin: 0.12,
                strokeMax: 0.6,
                opacityBase: 0.75,
                title: `Study ${num.toUpperCase()} ${name}`
            });
        console.log(`    → study-${num}-${name.toLowerCase()}.svg`);
    }

    // Exploration lineage: the manual incumbent (fell 3rd in eye rounds)
    {
        const segments = dendriticGrowthRadial(31415, params, 12);
        const stats = generatePerSegmentSVG(segments, colorFn, '#10121c',
            'growth-exploration-31415-incumbent.svg', {
                strokeMin: 0.12,
                strokeMax: 0.6,
                opacityBase: 0.75,
                title: 'Growth exploration — incumbent 31415'
            });
        console.log(`  Exploration: ${stats.segments} segments (31415) → growth-exploration-31415-incumbent.svg`);
    }

    // --- Neural Grove: multiple overlapping neurons filling the canvas ---
    console.log('\n  Generating Neural Grove (multi-neuron)...');
    const groveSegments = [];
    const grovePositions = [
        { x: -35, y: -30, numTrunks: 8 },
        { x: 40, y: 25, numTrunks: 8 },
        { x: -10, y: 45, numTrunks: 6 },
    ];
    let groveMaxDepth = 0;
    for (const pos of grovePositions) {
        const segs = dendriticGrowthRadialFrom(31415 + pos.x + pos.y, params, pos.numTrunks, pos.x, pos.y);
        for (const s of segs) {
            groveSegments.push(s);
            if (s.depth > groveMaxDepth) groveMaxDepth = s.depth;
        }
    }
    console.log(`    Grove: ${groveSegments.length} segments, max depth ${groveMaxDepth}`);

    const groveColorFn = (seg) => {
        const t = seg.depth / params.maxDepth;
        const c = cosine(t, inkwell.a, inkwell.b, inkwell.c, inkwell.d);
        return { color: c, t };
    };
    generatePerSegmentSVG(groveSegments, groveColorFn, '#10121c',
        'growth-exploration-neural-grove.svg', {
            strokeMin: 0.1,
            strokeMax: 0.55,
            opacityBase: 0.6,
            title: 'Growth exploration — neural grove'
        });
    console.log(`    → growth-exploration-neural-grove.svg`);

    // Exploration seed variants (manual five, pre-sweep)
    console.log('\n  Generating seed variants...');
    const seeds = [999, 42, 818, 16180];
    for (const seed of seeds) {
        const segs = dendriticGrowthRadial(seed, params, 12);
        generatePerSegmentSVG(segs, colorFn, '#10121c',
            `growth-exploration-seed-${seed}.svg`, {
                strokeMin: 0.15,
                strokeMax: 0.65,
                opacityBase: 0.7
            });
        console.log(`    seed ${seed}: ${segs.length} segments`);
    }
}

// ═══════════════════════════════════════════════════════════════
// Palette Swatches (for reference)
// ═══════════════════════════════════════════════════════════════

function generateSwatch(name, palette, filename) {
    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 80" width="1000" height="80">
  <rect width="1000" height="80" fill="#0a0a0a"/>
`;
    for (let i = 0; i < 100; i++) {
        const t = i / 99;
        const [r, g, b] = cosine(t, palette.a, palette.b, palette.c, palette.d);
        const hex = rgbToHex(r, g, b);
        svg += `  <rect x="${i * 10}" y="0" width="10" height="80" fill="${hex}"/>\n`;
    }
    svg += `  <text x="10" y="70" fill="white" font-family="monospace" font-size="14">${name}</text>\n`;
    svg += `</svg>`;
    fs.writeFileSync(filename, svg);
}

generateSwatch('Fog & Whiskey', fogWhiskey, 'swatch-fog-whiskey.svg');
generateSwatch('Patina', patina, 'swatch-patina.svg');
generateSwatch('Inkwell', inkwell, 'swatch-inkwell.svg');

// ═══════════════════════════════════════════════════════════════
// Debug: Print palette samples
// ═══════════════════════════════════════════════════════════════

console.log('\n━━━ Palette Samples ━━━');
const palettes = { 'Fog & Whiskey': fogWhiskey, 'Patina': patina, 'Inkwell': inkwell };
for (const [name, p] of Object.entries(palettes)) {
    console.log(`\n  ${name}:`);
    for (const t of [0, 0.25, 0.5, 0.75, 1.0]) {
        const [r, g, b] = cosine(t, p.a, p.b, p.c, p.d);
        const hex = rgbToHex(r, g, b);
        console.log(`    t=${t.toFixed(2)} → rgb(${r}, ${g}, ${b}) ${hex}`);
    }
}

console.log('\n✓ Series V Studies XXI–XXIII generation complete.');
