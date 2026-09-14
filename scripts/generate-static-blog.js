const fs = require('fs');
const path = require('path');
const { getBlogEnhancement } = require('../blog-enhancers');

function generateStaticBlog() {
    const slug = 'adi-kailash-ilp-date-revised-to-september-20-2026-updated-from-sept-15';
    const templatePath = path.join(__dirname, '..', 'blog.html');
    let template = fs.readFileSync(templatePath, 'utf8');

    const enh = getBlogEnhancement(slug, '');
    if (!enh) {
        console.error('Enhancer not found!');
        process.exit(1);
    }

    const canonicalUrl = `https://rudraanshyatra.com/blog/${slug}`;
    const ogImageUrl = 'https://ysnzxvvsegmkmkepclti.supabase.co/storage/v1/object/public/blog-images/file_1789381296324_429.jpeg';
    const author = 'Dheerendra Rautela';
    const createdAt = '2026-09-14T10:21:37.422916+00:00';
    const dateModified = enh.meta.dateModified || '2026-09-14T16:30:00+05:30';
    const dateStr = 'September 14, 2026';
    const imageAlt = `${enh.meta.title} — Rudraansh Yatra, Pithoragarh`;

    const adjacentBlogsHtml = `
        <li class="sidebar-link-item">
            <img class="sidebar-link-img" src="/assets/images/adi-kailash-hero.webp" alt="Inner Line Permit Guide" width="60" height="45" loading="lazy">
            <div class="sidebar-link-text">
                <a href="/blog/inner-line-permit-adi-kailash-2026-guide" class="sidebar-link-name">Inner Line Permit (ILP) for Adi Kailash 2026: Step-by-Step Guide</a>
                <span class="sidebar-link-price">By Dheerendra Rautela</span>
            </div>
        </li>
        <li class="sidebar-link-item">
            <img class="sidebar-link-img" src="/assets/images/om-parvat.webp" alt="2026 Monsoon Status" width="60" height="45" loading="lazy">
            <div class="sidebar-link-text">
                <a href="/blog/adi-kailash-yatra-2026-latest-status-monsoon-suspensions-reopening-updates" class="sidebar-link-name">Adi Kailash Yatra 2026 Latest Status & Reopening Updates</a>
                <span class="sidebar-link-price">By Dheerendra Rautela</span>
            </div>
        </li>
        <li class="sidebar-link-item">
            <img class="sidebar-link-img" src="/assets/images/adi-kailash-group.webp" alt="Best Time to Visit" width="60" height="45" loading="lazy">
            <div class="sidebar-link-text">
                <a href="/blog/best-time-to-visit-adi-kailash-om-parvat-weather-season-guide" class="sidebar-link-name">Best Time to Visit Adi Kailash & Om Parvat: Weather & Season Guide</a>
                <span class="sidebar-link-price">By Dheerendra Rautela</span>
            </div>
        </li>
    `;

    let blogHtml = template
        .replace(/{{META_TITLE}}/g, enh.meta.title)
        .replace(/{{OG_TITLE}}/g, enh.meta.title.replace(/"/g, '&quot;'))
        .replace(/{{META_DESC}}/g, enh.meta.desc.replace(/"/g, '&quot;'))
        .replace(/{{CANONICAL_URL}}/g, canonicalUrl)
        .replace(/{{OG_IMAGE}}/g, ogImageUrl)
        .replace(/{{OG_IMAGE_ALT}}/g, imageAlt.replace(/"/g, '&quot;'))
        .replace(/{{DATE_MODIFIED}}/g, dateModified)
        .replace(/{{ARTICLE_SECTION}}/g, 'Permits & Route Updates')
        .replace(/{{ARTICLE_TAG}}/g, 'Adi Kailash Yatra')
        .replace(/{{TITLE}}/g, enh.meta.title)
        .replace(/{{AUTHOR}}/g, author)
        .replace(/{{DATE}}/g, dateStr)
        .replace(/{{IMAGE}}/g, ogImageUrl)
        .replace(/{{IMAGE_ALT}}/g, imageAlt)
        .replace(/{{CONTENT}}/g, enh.contentHtml + enh.schemas)
        .replace(/{{ADJACENT_BLOGS}}/g, adjacentBlogsHtml)
        .replace(/{{SLUG}}/g, `/blog/${slug}`)
        .replace(/{{CREATED_AT}}/g, createdAt);

    // Overrides
    blogHtml = blogHtml
        .replace(/<title>[^<]*<\/title>/, `<title>${enh.meta.title}</title>`)
        .replace(/(<h1 class="blog-detail-title">)[^<]*(<\/h1>)/, `$1${enh.meta.title}$2`);

    const destPath = path.join(__dirname, '..', 'blog', `${slug}.html`);
    fs.writeFileSync(destPath, blogHtml, 'utf8');
    console.log('✅ Generated static fallback HTML:', destPath);
    console.log('   File size:', (fs.statSync(destPath).size / 1024).toFixed(2), 'KB');
}

generateStaticBlog();
