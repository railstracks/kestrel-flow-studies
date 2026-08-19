// Flow Studies Series V — Chromatic Prototype
// Study XX "Reveal" — Magnetic dipole field with Copper Horizon distance-from-focal coloring
//
// First experiment with color in Flow Studies.
// Each trail receives a color based on its average distance from the dipole focal point.
// Near the singularity → deep copper. Far from singularity → muted cream.
// Color reinforces convergence: density and warmth align.

const fs = require('fs');

// --- PRNG ---
function mulberry32(seed) {
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// --- IQ Cosine Palette ---
// color(t) = a + b · cos[2π(c·t + d)]
// Returns [r, g, b] in 0-255 range
function cosinePalette(t, a, b, c, d) {
    const r = a[0] + b[0] * Math.cos(2 * Math.PI * (c[0] * t + d[0]));
    const g = a[1] + b[1] * Math.cos(2 * Math.PI * (c[1] * t + d[1]));
    const bl = a[2] + b[2] * Math.cos(2 * Math.PI * (c[2] * t + d[2]));
    return [
        Math.round(Math.max(0, Math.min(1, r)) * 255),
        Math.round(Math.max(0, Math.min(1, g)) * 255),
        Math.round(Math.max(0, Math.min(1, bl)) * 255)
    ];
}

// --- Copper Horizon Palette ---
// Deep copper → warm amber → muted cream
// Designed for dark background. Warm tones glow against charcoal.
const copperHorizon = {
    a: [0.7, 0.45, 0.28],   // warm copper baseline
    b: [0.3, 0.35, 0.25],   // moderate oscillation  
    c: [0.8, 0.6, 0.4],     // less than one full cycle — smooth gradient
    d: [0.0, 0.05, 0.1]     // slight phase offset for warmth
};

// --- Fog & Whiskey Palette ---
// Muted gold → smoky grey (for later)
const fogWhiskey = {
    a: [0.55, 0.50, 0.42],
    b: [0.25, 0.20, 0.15],
    c: [1.0, 0.5, 0.3],
    d: [0.1, 0.2, 0.3]
};

// --- Inkwell Palette ---
// Deep indigo → silver-blue (for later)
const inkwell = {
    a: [0.30, 0.30, 0.40],
    b: [0.30, 0.30, 0.35],
    c: [1.0, 1.0, 1.0],
    d: [0.0, 0.1, 0.2]
};

// --- Patina Palette ---
// Verdigris → sage (for later)
const patina = {
    a: [0.38, 0.48, 0.40],
    b: [0.28, 0.32, 0.22],
    c: [1.0, 0.7, 0.5],
    d: [0.2, 0.3, 0.4]
};

// --- Magnetic Dipole Field ---
function fieldMagnetic(x, y) {
    const p1x = -30, p1y = 20;
    const p2x = 40, p2y = -15;
    const dx1 = x - p1x, dy1 = y - p1y;
    const dx2 = x - p2x, dy2 = y - p2y;
    const r1 = Math.sqrt(dx1*dx1 + dy1*dy1) + 1;
    const r2 = Math.sqrt(dx2*dx2 + dy2*dy2) + 1;
    const a1 = Math.atan2(dy1, dx1) * 180 / Math.PI;
    const a2 = Math.atan2(-dy2, -dx2) * 180 / Math.PI;
    const w1 = 40 / r1;
    const w2 = 30 / r2;
    const cx = Math.cos(a1 * Math.PI / 180) * w1 + Math.cos(a2 * Math.PI / 180) * w2;
    const cy = Math.sin(a1 * Math.PI / 180) * w1 + Math.sin(a2 * Math.PI / 180) * w2;
    return Math.atan2(cy, cx) * 180 / Math.PI;
}

// --- Focal point distance ---
// The magnetic dipole has two poles. The "focal center" is the midpoint.
const focalX = 5;    // midpoint of (-30, 20) and (40, -15)
const focalY = 2.5;
function distanceFromFocal(x, y) {
    return Math.sqrt((x - focalX)**2 + (y - focalY)**2);
}

// --- Trail simulation ---
function simulateTrails(seed, numTrails, trailLen, stepSize) {
    const rand = mulberry32(seed);
    const trails = [];

    for (let i = 0; i < numTrails; i++) {
        const startX = (rand() - 0.5) * 180;
        const startY = (rand() - 0.5) * 180;
        const opacity = 0.25 + rand() * 0.45;

        let x = startX, y = startY;
        const segments = [];
        let totalDist = 0;
        let count = 0;

        for (let step = 0; step < trailLen; step++) {
            if (Math.abs(x) > 95 || Math.abs(y) > 95) break;

            const angle = fieldMagnetic(x, y);
            const rad = angle * Math.PI / 180;
            const nx = x + Math.cos(rad) * stepSize;
            const ny = y + Math.sin(rad) * stepSize;

            segments.push([x, y, nx, ny]);
            totalDist += distanceFromFocal(x, y);
            count++;

            x = nx;
            y = ny;
        }

        if (segments.length > 0) {
            const avgDist = totalDist / count;
            trails.push({ segments, avgDist, opacity });
        }
    }

    return trails;
}

// --- Normalization ---
// Find max distance to normalize t across all trails
function normalizeDistance(trails) {
    let maxDist = 0;
    for (const trail of trails) {
        if (trail.avgDist > maxDist) maxDist = trail.avgDist;
    }
    return maxDist;
}

// --- SVG Generation ---
function generateColoredSVG(trails, palette, bgColor, outputPath) {
    const svgSize = 1000;
    const scale = svgSize / 200;
    const toX = (x) => (x + 100) * scale;
    const toY = (y) => (y + 100) * scale;

    const maxDist = normalizeDistance(trails);

    // Group trails by color (rounded) to reduce SVG element count
    const colorGroups = new Map();

    for (const trail of trails) {
        const t = Math.min(1, trail.avgDist / maxDist);
        const [r, g, b] = cosinePalette(t, palette.a, palette.b, palette.c, palette.d);
        const colorKey = `rgb(${r},${g},${b})`;
        
        if (!colorGroups.has(colorKey)) {
            colorGroups.set(colorKey, []);
        }
        
        let pathData = '';
        for (const [x1, y1, x2, y2] of trail.segments) {
            pathData += `M ${toX(x1).toFixed(2)} ${toY(y1).toFixed(2)} L ${toX(x2).toFixed(2)} ${toY(y2).toFixed(2)} `;
        }
        colorGroups.get(colorKey).push({ pathData, opacity: trail.opacity });
    }

    // Build SVG
    let paths = '';
    for (const [color, trailData] of colorGroups) {
        for (const { pathData, opacity } of trailData) {
            paths += `  <path d="${pathData}" stroke="${color}" stroke-width="0.5" fill="none" stroke-linecap="round" opacity="${opacity.toFixed(2)}"/>\n`;
        }
    }

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}" width="${svgSize}" height="${svgSize}">
  <rect width="${svgSize}" height="${svgSize}" fill="${bgColor}"/>
${paths}</svg>`;

    fs.writeFileSync(outputPath, svg);
    return { trails: trails.length, colorGroups: colorGroups.size, segments: trails.reduce((s, t) => s + t.segments.length, 0) };
}

// --- Monochrome reference (original, for A/B comparison) ---
function generateMonochromeSVG(trails, bgColor, strokeColor, outputPath) {
    const svgSize = 1000;
    const scale = svgSize / 200;
    const toX = (x) => (x + 100) * scale;
    const toY = (y) => (y + 100) * scale;

    let pathData = '';
    for (const trail of trails) {
        for (const [x1, y1, x2, y2] of trail.segments) {
            pathData += `M ${toX(x1).toFixed(2)} ${toY(y1).toFixed(2)} L ${toX(x2).toFixed(2)} ${toY(y2).toFixed(2)} `;
        }
    }

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}" width="${svgSize}" height="${svgSize}">
  <rect width="${svgSize}" height="${svgSize}" fill="${bgColor}"/>
  <path d="${pathData}" stroke="${strokeColor}" stroke-width="0.4" fill="none" stroke-linecap="round"/>
</svg>`;

    fs.writeFileSync(outputPath, svg);
}

// --- Brightness modulation for distance ---
// Far trails are darker (less luminous). Near trails glow.
function cosinePaletteWithFalloff(t, palette, falloff) {
    // Standard cosine palette
    const r = palette.a[0] + palette.b[0] * Math.cos(2 * Math.PI * (palette.c[0] * t + palette.d[0]));
    const g = palette.a[1] + palette.b[1] * Math.cos(2 * Math.PI * (palette.c[1] * t + palette.d[1]));
    const bl = palette.a[2] + palette.b[2] * Math.cos(2 * Math.PI * (palette.c[2] * t + palette.d[2]));
    // Apply brightness falloff: t=0 full brightness, t=1 reduced
    const brightness = 1.0 - t * falloff;
    return [
        Math.round(Math.max(0, Math.min(1, r * brightness)) * 255),
        Math.round(Math.max(0, Math.min(1, g * brightness)) * 255),
        Math.round(Math.max(0, Math.min(1, bl * brightness)) * 255)
    ];
}

// --- Main: Generate Study XX "Reveal" v2 ---
console.log('Generating Study XX "Reveal" v2 — improved contrast + stroke modulation');

const trails = simulateTrails(512, 150, 150, 1.2);
console.log(`  Simulated ${trails.length} trails, ${trails.reduce((s, t) => s + t.segments.length, 0)} total segments`);

// v2: Dark background with brightness falloff and stroke width modulation
function generateColoredSVGv2(trails, palette, bgColor, outputPath, options = {}) {
    const falloff = options.falloff ?? 0.4;
    const strokeMin = options.strokeMin ?? 0.3;
    const strokeMax = options.strokeMax ?? 0.7;
    
    const svgSize = 1000;
    const scale = svgSize / 200;
    const toX = (x) => (x + 100) * scale;
    const toY = (y) => (y + 100) * scale;

    const maxDist = normalizeDistance(trails);

    let paths = '';
    for (const trail of trails) {
        const t = Math.min(1, trail.avgDist / maxDist);
        const [r, g, b] = cosinePaletteWithFalloff(t, palette, falloff);
        const color = `rgb(${r},${g},${b})`;
        // Stroke width: thicker near focal point, thinner far away
        const strokeW = strokeMax - t * (strokeMax - strokeMin);
        
        let pathData = '';
        for (const [x1, y1, x2, y2] of trail.segments) {
            pathData += `M ${toX(x1).toFixed(2)} ${toY(y1).toFixed(2)} L ${toX(x2).toFixed(2)} ${toY(y2).toFixed(2)} `;
        }
        paths += `  <path d="${pathData}" stroke="${color}" stroke-width="${strokeW.toFixed(2)}" fill="none" stroke-linecap="round" opacity="${trail.opacity.toFixed(2)}"/>\n`;
    }

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}" width="${svgSize}" height="${svgSize}">
  <rect width="${svgSize}" height="${svgSize}" fill="${bgColor}"/>
${paths}</svg>`;

    fs.writeFileSync(outputPath, svg);
    return { trails: trails.length, segments: trails.reduce((s, t) => s + t.segments.length, 0) };
}

// v2: improved contrast + stroke modulation on dark background
const stats1 = generateColoredSVGv2(trails, copperHorizon, '#14100c', 'study-xx-reveal-v2-dark.svg', {
    falloff: 0.5,      // 50% brightness reduction at far edges
    strokeMin: 0.25,
    strokeMax: 0.65
});
console.log(`  v2 dark (improved): ${stats1.segments} segments → study-xx-reveal-v2-dark.svg`);

// Also generate v1 dark for direct comparison
generateColoredSVGv2(trails, copperHorizon, '#14100c', 'study-xx-reveal-v1-dark.svg', {
    falloff: 0,
    strokeMin: 0.5,
    strokeMax: 0.5
});
console.log(`  v1 dark (flat stroke, no falloff) → study-xx-reveal-v1-dark.svg`);

// --- Palette swatch for reference ---
let swatchSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" width="1000" height="100">
  <rect width="1000" height="100" fill="#1a1410"/>
`;

for (let i = 0; i < 100; i++) {
    const t = i / 99;
    const [r, g, b] = cosinePalette(t, copperHorizon.a, copperHorizon.b, copperHorizon.c, copperHorizon.d);
    swatchSvg += `  <rect x="${i * 10}" y="0" width="10" height="100" fill="rgb(${r},${g},${b})"/>\n`;
}
swatchSvg += `</svg>`;
fs.writeFileSync('copper-horizon-swatch.svg', swatchSvg);
console.log(`  Palette swatch → copper-horizon-swatch.svg`);

// --- Debug: print some sample colors ---
console.log('\n  Palette samples (t → color):');
for (const t of [0, 0.2, 0.4, 0.6, 0.8, 1.0]) {
    const [r, g, b] = cosinePalette(t, copperHorizon.a, copperHorizon.b, copperHorizon.c, copperHorizon.d);
    const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
    console.log(`    t=${t.toFixed(1)} → rgb(${r}, ${g}, ${b}) ${hex}`);
}
