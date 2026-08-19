// Flow Field — Kestrel's first turtle (refined)
// Short trails following a layered pseudo-noise vector field.
// Natural density variation where the field converges/diverges.
// Named "First Wind" — the first piece in a potential generative art practice.

const { Canvas, Turtle, turtleDraw } = require('turtletoy');
const fs = require('fs');

function mulberry32(seed) {
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

const rand = mulberry32(2026);
const segments = [];

// Layered pseudo-noise vector field
function fieldAngle(x, y) {
    const s1 = Math.sin(x * 0.022 + y * 0.011);
    const s2 = Math.cos(y * 0.018 - x * 0.007);
    const s3 = Math.sin((x + y) * 0.013 + 1.5);
    const s4 = Math.cos(x * 0.005 - y * 0.009 + 3.0);
    return s1 * 100 + s2 * 70 + s3 * 50 + s4 * 40;
}

turtleDraw(() => {
    const numTrails = 200;
    const trailLen = 100;
    const stepSize = 1.3;

    let turtle = new Turtle();
    turtle.penup();

    return (i) => {
        const trailIdx = Math.floor(i / trailLen);
        const stepIdx = i % trailLen;

        if (stepIdx === 0) {
            // Start new trail at scattered position
            const sx = (rand() - 0.5) * 180;
            const sy = (rand() - 0.5) * 180;
            turtle.penup();
            turtle.goto(sx, sy);
            turtle.pendown();
            // Vary opacity per trail for depth
            Canvas.setpenopacity(0.3 + rand() * 0.4);
        }

        const [x, y] = turtle.position();

        // Stop drawing if off-canvas, but keep counting
        if (Math.abs(x) > 95 || Math.abs(y) > 95) {
            turtle.penup();
            return trailIdx < numTrails;
        }

        const angle = fieldAngle(x, y);
        turtle.setheading(angle);
        turtle.forward(stepSize);

        return trailIdx < numTrails;
    };
}, {
    maxSteps: 22000,
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

fs.writeFileSync('flow-field.svg', svg);
console.log(`Generated flow-field.svg with ${segments.length} segments`);
