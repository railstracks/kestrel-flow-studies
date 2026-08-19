// Lissajous Decay — Kestrel's first turtle
// A Lissajous figure (x=A·sin(at+δ), y=B·sin(bt)) traced repeatedly
// with growing stochastic noise. Clean harmonics at start,
// dissolution into texture at the edges of the figure.
// The figure is naturally bounded — no centering hack needed.

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

const rand = mulberry32(73);
const segments = [];
const N = 6000;

turtleDraw(() => {
    Canvas.setpenopacity(0.8);

    const turtle = new Turtle();
    turtle.penup();

    // Lissajous parameters
    const amp = 75;        // amplitude (stays well within -100..100)
    const a = 3;           // x frequency
    const b = 4;           // y frequency (a/b = 3/4 → closed figure)
    const delta = Math.PI / 2; // phase offset

    // Slowly morph the frequency ratio over the run for interference
    const morphRate = 0.0003;

    let firstPoint = true;

    return (i) => {
        const t = (i / N) * Math.PI * 2 * 8; // 8 full cycles of the figure
        const progress = i / N;

        // Slowly morphing frequency ratio
        const aMorph = a + progress * 0.3;
        const bMorph = b + progress * 0.15;

        // Noise: barely visible early, grows cubically
        const noiseAmp = Math.pow(progress, 2.5) * 8;
        const nx = (rand() - 0.5) * 2 * noiseAmp;
        const ny = (rand() - 0.5) * 2 * noiseAmp;

        const x = amp * Math.sin(aMorph * t * 0.125 + delta) + nx;
        const y = amp * Math.sin(bMorph * t * 0.125) + ny;

        if (firstPoint) {
            turtle.goto(x, y);
            turtle.pendown();
            firstPoint = false;
        } else {
            turtle.goto(x, y);
        }

        // Fade opacity slightly with progress
        Canvas.setpenopacity(Math.max(0.25, 0.8 - progress * 0.4));

        return i < N;
    };
}, {
    maxSteps: 6500,
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
  <path d="${pathData}" stroke="#1a1a1a" stroke-width="0.45" fill="none" stroke-linecap="round"/>
</svg>`;

fs.writeFileSync('spiral-decay.svg', svg);
console.log(`Generated spiral-decay.svg with ${segments.length} segments`);
