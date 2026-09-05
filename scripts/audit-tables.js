const fs = require('fs');
const path = require('path');

const blogDir = path.join(__dirname, '..', 'blog');
const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.html'));

files.forEach(f => {
    const content = fs.readFileSync(path.join(blogDir, f), 'utf8');
    const tables = (content.match(/<table[\s\S]*?<\/table>/gi) || []);
    const hasBlogBody = content.includes('class="blog-body"');
    const hasBlogDetailBody = content.includes('class="blog-detail-body"');
    
    // Check if tables are wrapped in a responsive wrapper
    let unwrapped = 0;
    tables.forEach(tbl => {
        const idx = content.indexOf(tbl);
        const before = content.substring(Math.max(0, idx - 100), idx);
        if (!before.includes('ry-table-responsive-wrap') && !before.includes('overflow-x') && !before.includes('table-wrap')) {
            unwrapped++;
        }
    });

    console.log(`${f}:`);
    console.log(`  Tables: ${tables.length} (Unwrapped: ${unwrapped})`);
    console.log(`  Structure: blog-body=${hasBlogBody}, blog-detail-body=${hasBlogDetailBody}`);
});
