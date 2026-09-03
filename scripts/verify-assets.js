/**
 * Rudraansh Yatra Asset & Schema Integrity Verification
 * Run with: npm test
 */

const fs = require('fs');
const path = require('path');

let errors = 0;

function pass(msg) {
    console.log(`\x1b[32m✔ PASS:\x1b[0m ${msg}`);
}

function fail(msg) {
    console.error(`\x1b[31m✖ FAIL:\x1b[0m ${msg}`);
    errors++;
}

console.log('\n--- 1. Verifying style.css Integrity ---');
const cssPath = path.join(__dirname, '..', 'style.css');
if (!fs.existsSync(cssPath)) {
    fail('style.css does not exist!');
} else {
    const cssStats = fs.statSync(cssPath);
    if (cssStats.size < 200000) {
        fail(`style.css is dangerously small (${cssStats.size} bytes). Expected > 200KB. Accidental truncation detected!`);
    } else {
        pass(`style.css file size is healthy (${(cssStats.size / 1024).toFixed(1)} KB)`);
    }

    const cssContent = fs.readFileSync(cssPath, 'utf8');
    if (cssContent.startsWith('root--color-')) {
        fail('style.css starts with corrupted unparsed token root--color-!');
    } else {
        pass('style.css root tokens are well-formed');
    }

    let openBraces = 0;
    let braceErrors = 0;
    for (let i = 0; i < cssContent.length; i++) {
        if (cssContent[i] === '{') openBraces++;
        else if (cssContent[i] === '}') {
            openBraces--;
            if (openBraces < 0) {
                braceErrors++;
                openBraces = 0;
            }
        }
    }
    if (openBraces !== 0 || braceErrors !== 0) {
        fail(`style.css has mismatched curly braces! Unclosed: ${openBraces}, Excess closing: ${braceErrors}`);
    } else {
        pass('style.css curly braces are 100% balanced');
    }
}

console.log('\n--- 2. Verifying Schema.org JSON-LD in HTML Pages ---');
const rootDir = path.join(__dirname, '..');
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

htmlFiles.forEach(file => {
    const filePath = path.join(rootDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = content.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
    let count = 0;
    for (const match of matches) {
        count++;
        try {
            const parsed = JSON.parse(match[1]);
            if (!parsed['@context']) {
                fail(`${file} JSON-LD block #${count} is missing @context!`);
            }
        } catch (e) {
            fail(`${file} JSON-LD block #${count} failed to parse: ${e.message}`);
        }
    }
    if (count > 0) {
        pass(`${file} (${count} JSON-LD block${count > 1 ? 's' : ''} valid)`);
    }
});

console.log('\n--- 3. Verifying llms.txt Discovery ---');
const llmsPath = path.join(rootDir, 'llms.txt');
if (!fs.existsSync(llmsPath)) {
    fail('llms.txt file is missing from root!');
} else {
    const stats = fs.statSync(llmsPath);
    if (stats.size > 500) {
        pass(`llms.txt is present and indexed (${stats.size} bytes)`);
    } else {
        fail('llms.txt is unusually small');
    }
}

console.log('\n----------------------------------------');
if (errors === 0) {
    console.log('\x1b[32m✔ ALL INTEGRITY CHECKS PASSED SUCCESSFULLY!\x1b[0m\n');
    process.exit(0);
} else {
    console.error(`\x1b[31m✖ FOUND ${errors} INTEGRITY ISSUE(S). PLEASE FIX BEFORE DEPLOYING!\x1b[0m\n`);
    process.exit(1);
}
