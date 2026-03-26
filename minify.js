const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');
const { minify } = require('terser');

async function run() {
    // Minify CSS
    const cssFiles = ['style.css'];
    for (const file of cssFiles) {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            const input = fs.readFileSync(filePath, 'utf-8');
            const output = new CleanCSS({ level: 2 }).minify(input);
            if (output.styles) {
                fs.writeFileSync(filePath, output.styles);
                const saved = ((1 - output.styles.length / input.length) * 100).toFixed(1);
                console.log(`CSS: ${file} minified (${saved}% smaller)`);
            }
        }
    }

    // Minify JS
    const jsFiles = ['script.js', 'translations.js', 'auth.js', 'tracker.js'];
    for (const file of jsFiles) {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            const input = fs.readFileSync(filePath, 'utf-8');
            try {
                const result = await minify(input, {
                    compress: { drop_console: false, passes: 2 },
                    mangle: true
                });
                if (result.code) {
                    fs.writeFileSync(filePath, result.code);
                    const saved = ((1 - result.code.length / input.length) * 100).toFixed(1);
                    console.log(`JS: ${file} minified (${saved}% smaller)`);
                }
            } catch (e) {
                console.warn(`JS: ${file} minify failed, skipping:`, e.message);
            }
        }
    }

    console.log('Build complete!');
}

run().catch(err => {
    console.error('Build error:', err);
    process.exit(1);
});
