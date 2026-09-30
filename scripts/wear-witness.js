// Witness: wear-worlds.js simulation reproduces the committed eraflat anchor's geometry.
// Parses d-strings from study-xxviii-giant-neighbor-eraflat.svg; re-serializes the trail polylines
// from wear-worlds.js's simulate() in the SAME SVG-coordinate format; hashes both; diffs.
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

// pull simulate() out of wear-worlds.js without triggering its run block: require is not isolated,
// so instead re-read the file and eval only up to the run marker.
const src = fs.readFileSync(path.join(__dirname, 'wear-worlds.js'), 'utf-8');
const cut = src.indexOf('// ── run ──');
if (cut < 0) throw new Error('run marker missing');
eval(src.slice(0, cut)); // defines mulberry32..replayDeposit, GRID, cellOf, FOCI constants live below

const FOCI_GIANT_NEIGHBOR = [{ x: 42, y: -40, g: 38, k: 5.01 }, { x: -52, y: 38, g: 90, k: 1.00 }];
const trails = simulate(FOCI_GIANT_NEIGHBOR);

// canonical serialization: SVG coords, per point "sx.toFixed(1) sy.toFixed(1)", one line per trail
const mine = trails.map(t => t.pts.map((p, i) => {
    const sx = (p[0] + 100) * 5, sy = (100 - p[1]) * 5;
    return (i === 0 ? 'M' : 'L') + sx.toFixed(1) + ' ' + sy.toFixed(1);
}).join(' ')).join('\n');

const svg = fs.readFileSync(path.join(__dirname, '..', 'study-xxviii-giant-neighbor-eraflat.svg'), 'utf-8');
const dRe = /d="([^"]+)"/g;
const ds = []; let m;
while ((m = dRe.exec(svg))) ds.push(m[1]);
const theirs = ds.join('\n');

const h = s => crypto.createHash('sha256').update(s).digest('hex');
console.log('eraflat paths:', ds.length, '| simulate trails:', trails.length);
console.log('eraflat d-hash :', h(theirs));
console.log('simulate d-hash:', h(mine));
console.log('MATCH:', h(theirs) === h(mine));
if (h(theirs) !== h(mine)) {
    // locate first divergence
    const a = theirs.split('\n'), b = mine.split('\n');
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        if (a[i] !== b[i]) { console.log('first diff at path', i); console.log(' theirs:', a[i].slice(0, 80)); console.log(' mine  :', b[i].slice(0, 80)); break; }
    }
}
