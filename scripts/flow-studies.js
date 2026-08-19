// Flow Studies — Kestrel's generative art series
// Each study explores a different vector field formula.
// All share the same trail-based execution model: short traces following the field.
// Series inspired by kestrel-sounds dissolution studies — same aesthetic, visual register.

const { Canvas, Turtle, turtleDraw } = require('turtletoy');
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

// --- Field Formulas ---

// Study I: "First Wind" — layered sinusoids (the original)
function fieldFirstWind(x, y) {
    const s1 = Math.sin(x * 0.022 + y * 0.011);
    const s2 = Math.cos(y * 0.018 - x * 0.007);
    const s3 = Math.sin((x + y) * 0.013 + 1.5);
    const s4 = Math.cos(x * 0.005 - y * 0.009 + 3.0);
    return s1 * 100 + s2 * 70 + s3 * 50 + s4 * 40;
}

// Study II: "Curl" — curl noise approximation via finite differences on scalar potential
function fieldCurl(x, y) {
    // Scalar potential: layered sinusoids creating smooth hills/valleys
    const eps = 0.5;
    const potential = (px, py) => {
        return Math.sin(px * 0.015) * Math.cos(py * 0.012) * 80
             + Math.sin(px * 0.008 + py * 0.006) * 40
             + Math.cos(px * 0.004 - py * 0.010 + 2.0) * 25;
    };
    // Curl of potential: rotate gradient 90°
    const dy = (potential(x, y + eps) - potential(x, y - eps)) / (2 * eps);
    const dx = (potential(x + eps, y) - potential(x - eps, y)) / (2 * eps);
    // Rotate gradient 90° to get curl direction
    return Math.atan2(dx, -dy) * 180 / Math.PI;
}

// Study III: "Tidal" — two dominant flows interfering, like cross-currents
function fieldTidal(x, y) {
    // Two large-scale flows at different angles, modulated by position
    const flow1 = Math.sin(x * 0.008 + y * 0.003) * 60;
    const flow2 = Math.cos(y * 0.010 - x * 0.005 + 1.2) * 50;
    // Cross-modulation creates tidal eddies
    const mod = Math.sin((x * 0.003 + y * 0.004) * 3.0) * 30;
    return flow1 + flow2 + mod;
}

// Study IV: "Magnetic" — dipole field, lines bending around poles
function fieldMagnetic(x, y) {
    // Two poles at fixed positions
    const p1x = -30, p1y = 20;
    const p2x = 40, p2y = -15;
    // Field direction at (x,y) is tangent to the line from pole to point
    const dx1 = x - p1x, dy1 = y - p1y;
    const dx2 = x - p2x, dy2 = y - p2y;
    const r1 = Math.sqrt(dx1*dx1 + dy1*dy1) + 1;
    const r2 = Math.sqrt(dx2*dx2 + dy2*dy2) + 1;
    // Angle from pole 1 (attractive)
    const a1 = Math.atan2(dy1, dx1) * 180 / Math.PI;
    // Angle from pole 2 (repulsive — opposite charge)
    const a2 = Math.atan2(-dy2, -dx2) * 180 / Math.PI;
    // Weighted by inverse distance
    const w1 = 40 / r1;
    const w2 = 30 / r2;
    // Circular average of angles
    const x1 = Math.cos(a1 * Math.PI / 180) * w1 + Math.cos(a2 * Math.PI / 180) * w2;
    const y1 = Math.sin(a1 * Math.PI / 180) * w1 + Math.sin(a2 * Math.PI / 180) * w2;
    return Math.atan2(y1, x1) * 180 / Math.PI;
}

// Study V: "Interference" — two wave fields creating beat patterns
function fieldInterference(x, y) {
    // Two waves of slightly different frequency create interference beats
    const w1 = Math.sin(x * 0.020 + y * 0.005) * 70;
    const w2 = Math.sin(x * 0.017 - y * 0.004 + 0.8) * 70;
    // The beat envelope modulates the direction
    const beat = Math.cos((x + y) * 0.004) * 40;
    return w1 + w2 + beat;
}

// --- Rendering Engine ---

const studies = [
    { name: 'study-i-first-wind',   field: fieldFirstWind,   seed: 2026, trails: 200, trailLen: 100, stepSize: 1.3 },
    { name: 'study-ii-curl',        field: fieldCurl,         seed: 714,  trails: 250, trailLen: 80,  stepSize: 1.0 },
    { name: 'study-iii-tidal',       field: fieldTidal,        seed: 318,  trails: 180, trailLen: 120, stepSize: 1.4 },
    { name: 'study-iv-magnetic',     field: fieldMagnetic,     seed: 512,  trails: 150, trailLen: 150, stepSize: 1.2 },
    { name: 'study-v-interference',  field: fieldInterference, seed: 88,   trails: 220, trailLen: 90,  stepSize: 1.1 },
];

for (const study of studies) {
    const rand = mulberry32(study.seed);
    const segments = [];

    turtleDraw(() => {
        const numTrails = study.trails;
        const trailLen = study.trailLen;
        const stepSize = study.stepSize;

        let turtle = new Turtle();
        turtle.penup();

        return (i) => {
            const trailIdx = Math.floor(i / trailLen);
            const stepIdx = i % trailLen;

            if (stepIdx === 0) {
                const sx = (rand() - 0.5) * 180;
                const sy = (rand() - 0.5) * 180;
                turtle.penup();
                turtle.goto(sx, sy);
                turtle.pendown();
                Canvas.setpenopacity(0.25 + rand() * 0.45);
            }

            const [x, y] = turtle.position();

            if (Math.abs(x) > 95 || Math.abs(y) > 95) {
                turtle.penup();
                return trailIdx < numTrails;
            }

            const angle = study.field(x, y);
            turtle.setheading(angle);
            turtle.forward(stepSize);

            return trailIdx < numTrails;
        };
    }, {
        maxSteps: study.trails * study.trailLen + 1000,
        onDrawLine: (x1, y1, x2, y2) => {
            segments.push([x1, y1, x2, y2]);
        }
    });

    // SVG generation
    const svgSize = 1000;
    const scale = svgSize / 200;
    const toX = (x) => (x + 100) * scale;
    const toY = (y) => (y + 100) * scale;

    let pathData = '';
    for (const [x1, y1, x2, y2] of segments) {
        pathData += `M ${toX(x1).toFixed(2)} ${toY(y1).toFixed(2)} L ${toX(x2).toFixed(2)} ${toY(y2).toFixed(2)} `;
    }

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}" width="${svgSize}" height="${svgSize}">
  <rect width="${svgSize}" height="${svgSize}" fill="#f5f0e8"/>
  <path d="${pathData}" stroke="#1a1a1a" stroke-width="0.4" fill="none" stroke-linecap="round"/>
</svg>`;

    fs.writeFileSync(`${study.name}.svg`, svg);
    console.log(`${study.name}: ${segments.length} segments`);
}