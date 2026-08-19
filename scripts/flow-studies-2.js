// Flow Studies II — Kestrel's generative art series expansion
// Three new field formulas testing the physical-analogy principle:
// - Lorenz attractor projection (chaotic dynamics)
// - Coriolis (rotating reference frame)
// - Gradient descent on random terrain (optimization landscape)
//
// Hypothesis from Flow Studies I: physical analogy fields outperform pure noise
// because they have inherent asymmetry and focal structure.
// These three test whether that holds for more complex physical systems.

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

// Study VI: "Lorenz" — projected velocity field of the Lorenz attractor
// The Lorenz system: dx/dt = σ(y-x), dy/dt = x(ρ-z) - y, dz/dt = xy - βz
// We project the 3D velocity onto 2D by using (dx/dt, dy/dt) as the field direction.
// The z-component influences dy/dt, creating the characteristic butterfly pattern.
function fieldLorenz(x, y) {
    // Map canvas coordinates to Lorenz state space (scaled)
    const sigma = 10.0;
    const rho = 28.0;
    const beta = 8.0 / 3.0;
    // x,y on canvas → Lorenz state (scaled down)
    const lx = x * 0.05;
    const ly = y * 0.05;
    const lz = 20.0 + Math.sin(x * 0.01 + y * 0.008) * 10.0; // estimate z from position
    // Velocity
    const dx = sigma * (ly - lx);
    const dy = lx * (rho - lz) - ly;
    // Direction angle
    return Math.atan2(dy, dx) * 180 / Math.PI;
}

// Study VII: "Coriolis" — rotating reference frame creates large-scale spirals
// In a rotating frame, the Coriolis force deflects moving particles perpendicular
// to their velocity. The deflection angle depends on position (latitude analog).
function fieldCoriolis(x, y) {
    // Angular velocity varies with "latitude" (y position)
    const omega = 0.8 + y * 0.003;
    // Base flow direction (eastward) deflected by Coriolis
    const baseAngle = 0; // eastward
    // Coriolis deflection: proportional to velocity × omega
    // The effective field angle is the base flow rotated by the Coriolis effect
    const deflection = omega * 90; // can exceed 90°, creating reversal
    // Modulate by position to create eddies
    const mod = Math.sin(x * 0.006 + y * 0.004) * 30;
    return baseAngle + deflection + mod;
}

// Study VIII: "Gradient Descent" — flow on a random Gaussian terrain
// Particles follow the negative gradient of a sum-of-Gaussians landscape.
// This creates flowing paths toward minima, with ridges and valleys.
// Uses a fixed set of Gaussian bumps (deterministic, not per-trail random).
function fieldGradientDescent(x, y) {
    // Fixed terrain: sum of Gaussians with known positions
    const peaks = [
        { cx: -40, cy: 30, sigma: 25, height: 80 },
        { cx: 35, cy: -20, sigma: 30, height: 60 },
        { cx: 10, cy: 50, sigma: 20, height: -50 }, // valley (negative height = basin)
        { cx: -20, cy: -40, sigma: 35, height: -70 }, // deep valley
        { cx: 50, cy: 30, sigma: 22, height: 40 },
    ];
    // Compute gradient (negative = descent direction)
    const eps = 0.5;
    let heightAtX = 0, heightAtXPlus = 0, heightAtYPlus = 0;
    for (const p of peaks) {
        const dx2 = (x - p.cx) ** 2;
        const dy2 = (y - p.cy) ** 2;
        const g = Math.exp(-(dx2 + dy2) / (2 * p.sigma * p.sigma));
        heightAtX += p.height * g;
        const dx2p = (x + eps - p.cx) ** 2;
        heightAtXPlus += p.height * Math.exp(-(dx2p + dy2) / (2 * p.sigma * p.sigma));
        const dy2p = (y + eps - p.cy) ** 2;
        heightAtYPlus += p.height * Math.exp(-(dx2 + dy2p) / (2 * p.sigma * p.sigma));
    }
    const gradX = (heightAtXPlus - heightAtX) / eps;
    const gradY = (heightAtYPlus - heightAtX) / eps;
    // Descent direction: negative gradient
    return Math.atan2(-gradY, -gradX) * 180 / Math.PI;
}

// --- Rendering Engine ---

const studies = [
    { name: 'study-vi-lorenz',          field: fieldLorenz,          seed: 42,   trails: 200, trailLen: 120, stepSize: 1.1 },
    { name: 'study-vii-coriolis',       field: fieldCoriolis,        seed: 1337, trails: 180, trailLen: 140, stepSize: 1.2 },
    { name: 'study-viii-gradient',      field: fieldGradientDescent, seed: 999,  trails: 220, trailLen: 100, stepSize: 1.0 },
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