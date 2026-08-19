// Validate flow-study-1.js compiles without errors
const { Dittytoy } = require('dittytoy');
const fs = require('fs');

const code = fs.readFileSync('./flow-study-1.js', 'utf8');
const dt = new Dittytoy();

dt.compile(code).then(() => {
    console.log('✓ Compilation successful — ditty is valid');
    process.exit(0);
}).catch((err) => {
    console.error('✗ Compilation error:', err.message || err);
    process.exit(1);
});
