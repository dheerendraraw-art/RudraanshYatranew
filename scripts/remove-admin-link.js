/**
 * scripts/remove-admin-link.js
 * Removes the "| <a href="/admin"...>Admin Panel</a>" link from
 * all public-facing HTML file footers.
 * Run: node scripts/remove-admin-link.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const FILES = [
    'index.html',
    'adi-kailash.html',
    'blog.html',
    'blogs.html',
    'gallery.html',
    'payment.html',
    'darma-valley.html',
    'whats-included.html',
    'mt-kailash.html',
    'panchachuli.html',
    'khaliya-top.html',
    'blog/best-time-to-visit-adi-kailash-om-parvat-weather-season-guide.html',
    'blog/adi-kailash-yatra-2026-latest-status-monsoon-suspensions-reopening-updates.html',
    'blog/adi-kailash-yatra-cost-package-price-breakdown-budget-guide.html',
    'blog/adi-kailash-ilp-date-revised-to-september-20-2026-updated-from-sept-15.html',
    'blog/how-to-reach-adi-kailash-from-delhi-kathgodam-pithoragarh-route-map.html',
    'blog/kailash-mansarovar-yatra-2026-tilak-mala-welcome-44-yatris-tanakpur.html',
    'blog/when-does-adi-kailash-yatra-2026-close-for-winter.html',
];

// Patterns to strip: " | <a href="/admin"...>Admin Panel</a>" and standalone variants
const PATTERNS = [
    /\s*\|\s*<a\s+href="\/admin[^"]*"\s*(?:style="[^"]*")?\s*>Admin Panel<\/a>/g,
    /<a\s+href="\/admin[^"]*"\s*(?:style="[^"]*")?\s*>Admin Panel<\/a>/g,
];

let totalFixed = 0;
let totalClean = 0;

FILES.forEach(function(relPath) {
    const absPath = path.join(ROOT, relPath);

    if (!fs.existsSync(absPath)) {
        console.log('[SKIP] File not found: ' + relPath);
        return;
    }

    let content = fs.readFileSync(absPath, 'utf8');
    let changed = false;

    PATTERNS.forEach(function(pattern) {
        const replaced = content.replace(pattern, '');
        if (replaced !== content) {
            content = replaced;
            changed = true;
        }
    });

    if (changed) {
        fs.writeFileSync(absPath, content, 'utf8');
        console.log('[FIXED] ' + relPath);
        totalFixed++;
    } else {
        if (content.includes('Admin Panel')) {
            console.log('[WARN ] Still contains Admin Panel text (different format): ' + relPath);
        } else {
            console.log('[CLEAN] Not present: ' + relPath);
        }
        totalClean++;
    }
});

// Full-repo scan to catch any remaining files
console.log('\n--- Full repo scan for remaining /admin links ---');
let remaining = 0;
function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.forEach(function(entry) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'tmp') return;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            scanDir(full);
        } else if (entry.name.endsWith('.html') && entry.name !== 'admin.html' && entry.name !== 'lead-details.html') {
            const c = fs.readFileSync(full, 'utf8');
            if (c.indexOf('href="/admin"') !== -1 || c.indexOf("href='/admin'") !== -1) {
                console.log('[REMAINING] ' + path.relative(ROOT, full));
                remaining++;
            }
        }
    });
}
scanDir(ROOT);

if (remaining === 0) {
    console.log('[OK] No remaining Admin Panel links in public HTML files.');
}
console.log('\nDone. Fixed: ' + totalFixed + ' | Clean/skipped: ' + totalClean + ' | Remaining: ' + remaining);
