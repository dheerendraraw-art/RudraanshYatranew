require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const PDFDocument = require('pdfkit');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');

const JWT_SECRET = process.env.JWT_SECRET || 'rudraansh_yatra_secure_jwt_secret_key_2026_xyz';
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// HTTP Security Headers
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token required' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
}

function requireAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Administrator role required' });
    }
}

const PORT = process.env.PORT || 3000;

// Initialize Razorpay Client (gracefully falls back if keys are not set in .env)
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_dummykeyid123';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'dummysecret123';
const razorpay = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret
});


// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
let supabase = null;

if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
}

// Helper to pre-render blogs HTML
// Helper to convert titles to URL-safe slugs
function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start
        .replace(/-+$/, '');            // Trim - from end
}

// Helper to pre-render blogs HTML
function renderBlogsHtml(blogs) {
    if (!blogs || blogs.length === 0) {
        return `<div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--color-text-secondary);">
            <i class="fa-solid fa-feather-pointed" style="font-size: 48px; color: var(--color-gold); margin-bottom: 16px;"></i>
            <h3 style="font-family: var(--font-serif); font-size: 22px; color: var(--color-primary); margin-bottom: 8px;">No Travel Diaries Found</h3>
            <p style="font-size: 14px;">Check back soon for new expedition guides and Himalayan stories.</p>
        </div>`;
    }

    let html = '';
    blogs.forEach(blog => {
        const dateStr = new Date(blog.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        // Strip HTML tags for clean text excerpt
        let rawContent = (blog.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        
        // Remove duplicate title heading from start of excerpt if present
        const titleClean = (blog.title || '').replace(/[^\w\s]/gi, '').toLowerCase();
        if (rawContent.toLowerCase().startsWith(titleClean)) {
            rawContent = rawContent.substring(titleClean.length).trim();
        }

        const excerpt = rawContent.substring(0, 150) + (rawContent.length > 150 ? '...' : '');

        // Estimate read time (approx 200 words per minute)
        const wordCount = rawContent.split(/\s+/).length;
        const readTime = Math.max(1, Math.ceil(wordCount / 200)) + ' min read';

        // Auto-assign category badge
        let category = 'Expedition Guide';
        const titleLower = (blog.title || '').toLowerCase();
        const contentLower = rawContent.toLowerCase();

        if (titleLower.includes('permit') || titleLower.includes('ilp') || contentLower.includes('inner line permit')) {
            category = 'Permits & Guidelines';
        } else if (titleLower.includes('status') || titleLower.includes('suspended') || titleLower.includes('reopening') || titleLower.includes('closure')) {
            category = 'Yatra Updates';
        } else if (titleLower.includes('senior') || titleLower.includes('safe') || titleLower.includes('checklist') || titleLower.includes('5 things')) {
            category = 'Senior Safety & Tips';
        } else if (titleLower.includes('china') || titleLower.includes('lipulekh') || titleLower.includes('traders')) {
            category = 'Border News';
        }

        const slug = blog.slug || slugify(blog.title);
        const imageUrl = blog.image_url || 'assets/images/adi-kailash-hero.webp';

        html += `
            <article class="blog-card" id="blog-post-${blog.id}" data-category="${category}" data-title="${(blog.title || '').toLowerCase()}" data-excerpt="${rawContent.toLowerCase()}">
                <div class="blog-card-img-wrap">
                    <img src="${imageUrl}" alt="${blog.title} - Sacred Himalayan Travel Diary & Expedition in Kumaon Uttarakhand" class="blog-card-img" loading="lazy" onerror="this.src='assets/images/adi-kailash-hero.webp'">
                    <span class="blog-card-badge">${category}</span>
                </div>
                <div class="blog-card-content">
                    <div class="blog-card-meta">
                        <span><i class="fa-solid fa-user" style="color: var(--color-gold);"></i> ${blog.author || 'Dheerendra Rautela'}</span>
                        <span>•</span>
                        <span><i class="fa-solid fa-calendar-days" style="color: var(--color-gold);"></i> ${dateStr}</span>
                        <span>•</span>
                        <span><i class="fa-solid fa-clock" style="color: var(--color-gold);"></i> ${readTime}</span>
                    </div>
                    <h3 class="blog-card-title"><a href="/blog/${slug}">${blog.title}</a></h3>
                    <p class="blog-card-excerpt">${excerpt}</p>
                    <div class="blog-card-footer">
                        <a href="/blog/${slug}" class="blog-card-link">Read Full Story <i class="fa-solid fa-arrow-right"></i></a>
                    </div>
                </div>
            </article>
        `;
    });
    return html;
}

// 1. SSR Route for Homepage (/)
app.get('/', async (req, res) => {
    try {
        // Set Vercel Edge CDN Revalidation Header (revalidate: 60 seconds)
        res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=59');

        let dbBlogs = [];
        if (supabase) {
            const { data } = await supabase
                .from('blogs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);
            if (data) dbBlogs = data;
        }

        const blogsHtml = renderBlogsHtml(dbBlogs);

        // Load index.html template and inject blogs
        let indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
        
        const replacement = `<!-- Blogs Section -->
    <section id="homepage-blogs" class="section-padding" style="background-color: var(--color-bg-card); overflow: hidden;">
        <div class="container blog-section-container">
            <div class="section-header text-center">
                <span class="section-subtitle">Our Travel Diaries</span>
                <h2 class="section-title">Himalayan Legends & Insights</h2>
                <p class="section-desc">Stories, guidelines, and cultural experiences straight from our guides trekking across the Kumaon borderlands.</p>
            </div>
            
            <div class="blog-carousel-wrapper">
                <button class="carousel-control prev" aria-label="Previous Slide"><i class="fa-solid fa-chevron-left"></i></button>
                <div class="blog-carousel-container">
                    <div class="blog-carousel-track">
                        ${blogsHtml}
                    </div>
                </div>
                <button class="carousel-control next" aria-label="Next Slide"><i class="fa-solid fa-chevron-right"></i></button>
            </div>
        </div>`;

        // Replace with regex to handle different OS line endings (\n or \r\n) safely
        indexHtml = indexHtml.replace(/<!-- Blogs Section -->\s*<section id="homepage-blogs"[^>]*>\s*<!-- Dynamic Blogs will load here -->/i, replacement);
        
        res.send(indexHtml);
    } catch (err) {
        console.error('SSR Homepage Error:', err);
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

// 2. SSR Route for Blogs List (/blogs)
app.get('/blogs', async (req, res) => {
    try {
        let dbBlogs = [];
        if (supabase) {
            const { data } = await supabase
                .from('blogs')
                .select('*')
                .order('created_at', { ascending: false });
            if (data) dbBlogs = data;
        }

        const blogsHtml = renderBlogsHtml(dbBlogs);

        // Load blogs.html template and inject blogs grid
        let blogsTemplateHtml = fs.readFileSync(path.join(__dirname, 'blogs.html'), 'utf8');
        blogsTemplateHtml = blogsTemplateHtml.replace('{{BLOGS_GRID}}', blogsHtml);

        res.send(blogsTemplateHtml);
    } catch (err) {
        console.error('SSR Blogs List Page Error:', err);
        res.sendFile(path.join(__dirname, 'blogs.html'));
    }
});

// 3. SSR Route for individual Blog Articles (/blog/:slug)
app.get('/blog/:slug', async (req, res) => {
    const slug = req.params.slug;

    // Redirect legacy long slug to clean optimized slug
    const legacySlugs = {
        'due-to-china-denying-clearance-for-the-lipulekh-crossing-28-indian-businessmen-were-forced-to-return': 'china-denies-lipulekh-clearance-indian-traders-return',
        // Task 1.1: Fix typo slug for Lipulekh trade resumption article ('ndia-' → 'india-')
        'ndia-tibet-border-trade-through-lipulekh-pass-finally-resumes-on-august-1-2026-after-a-seven-year-pause-heres-what-changed-since-traders-were-turned-back-in-july': 'india-tibet-border-trade-lipulekh-pass-resumes-august-2026'
    };
    if (legacySlugs[slug]) {
        return res.redirect(301, `/blog/${legacySlugs[slug]}`);
    }

    try {
        let blog = null;
        let adjacentBlogsHtml = '';

        if (supabase) {
            // Fetch from database by slug
            const { data, error } = await supabase
                .from('blogs')
                .select('*')
                .eq('slug', slug)
                .single();
            if (data && !error) {
                blog = data;
            }

            if (blog) {
                // Fetch all blogs to calculate adjacency
                const { data: allBlogs } = await supabase
                    .from('blogs')
                    .select('id, title, slug, image_url, author, created_at')
                    .order('created_at', { ascending: false });

                if (allBlogs && allBlogs.length > 1) {
                    const currentIndex = allBlogs.findIndex(b => b.slug === slug);
                    const N = allBlogs.length;
                    const adjacentBlogs = [];

                    // Get next article (wrap around if at the end)
                    const nextIndex = (currentIndex + 1) % N;
                    if (nextIndex !== currentIndex) {
                        adjacentBlogs.push(allBlogs[nextIndex]);
                    }

                    // Get previous article (wrap around if at the beginning)
                    const prevIndex = (currentIndex - 1 + N) % N;
                    if (prevIndex !== currentIndex && !adjacentBlogs.includes(allBlogs[prevIndex])) {
                        adjacentBlogs.push(allBlogs[prevIndex]);
                    }

                    // Get next-next article if we have enough and want 3
                    const nextNextIndex = (currentIndex + 2) % N;
                    if (nextNextIndex !== currentIndex && nextNextIndex !== prevIndex && nextNextIndex !== nextIndex && !adjacentBlogs.includes(allBlogs[nextNextIndex])) {
                        adjacentBlogs.push(allBlogs[nextNextIndex]);
                    }

                    // Render adjacent blogs HTML matching the sidebar link format
                    adjacentBlogsHtml = adjacentBlogs.map(ab => {
                        const abImg = ab.image_url ? (ab.image_url.startsWith('http') || ab.image_url.startsWith('/') ? ab.image_url : '/' + ab.image_url) : '/assets/images/adi-kailash-hero.webp';
                        return `
                    <li class="sidebar-link-item">
                        <img class="sidebar-link-img" src="${abImg}" alt="${ab.title} - Kumaon Himalayan Travel Diary" width="60" height="45" loading="lazy" decoding="async" onerror="this.src='/assets/images/adi-kailash-hero.webp'">
                        <div class="sidebar-link-text">
                            <a href="/blog/${ab.slug}" class="sidebar-link-name">${ab.title}</a>
                            <span class="sidebar-link-price">By ${ab.author}</span>
                        </div>
                    </li>`;
                    }).join('\n');
                }
            }
        }

        if (!blog) {
            return res.status(404).send('<h1>404 - Article Not Found</h1><p>The travel diary you are looking for does not exist.</p><a href="/blogs">Go back to Blogs</a>');
        }

        // Render Paragraphs
        // Task 1.2: Detect FAQ JSON blocks & wrap as valid <script> JSON-LD (fixes broken schema)
        // Task 1.3: Use <h2> (not <h3>) for numbered section headings
        const paragraphsHtml = (function renderContent(rawContent) {
            const lines = rawContent.split('\n');
            const output = [];
            let jsonBuffer = [];
            let inJsonBlock = false;
            let braceDepth = 0;

            for (let i = 0; i < lines.length; i++) {
                const trimmed = lines[i].trim();
                if (!trimmed) continue;

                // --- Task 1.2: Detect start of embedded FAQ/schema JSON block ---
                if (!inJsonBlock && trimmed.startsWith('{') &&
                    (trimmed.includes('@type') || trimmed.includes('mainEntity') || trimmed.includes('FAQPage') || trimmed.includes('faqpage'))) {
                    inJsonBlock = true;
                    jsonBuffer = [];
                    braceDepth = 0;
                }

                if (inJsonBlock) {
                    // Count brace depth to detect end of JSON object
                    for (const ch of trimmed) {
                        if (ch === '{') braceDepth++;
                        else if (ch === '}') braceDepth--;
                    }
                    // Unescape any double-escaped quotes from DB storage
                    jsonBuffer.push(trimmed.replace(/\\"/g, '"').replace(/\\n/g, '\n'));
                    if (braceDepth <= 0) {
                        // JSON block complete — emit as valid <script> JSON-LD
                        const schemaJson = jsonBuffer.join('\n');
                        try {
                            JSON.parse(schemaJson); // validate before emitting
                            output.push(`<script type="application/ld+json">\n${schemaJson}\n</script>`);
                        } catch(e) {
                            // If invalid JSON, skip silently (don't show raw text to user)
                            console.warn('Blog FAQ schema JSON parse error, skipping:', e.message);
                        }
                        inJsonBlock = false;
                        jsonBuffer = [];
                    }
                    continue;
                }

                // --- Task 1.3: Numbered headings → <h2> (not <h3>) ---
                if (/^\d+\.\s/.test(trimmed)) {
                    output.push(`<h2 class="blog-heading">${trimmed}</h2>`);
                    continue;
                }

                // Bullet points
                if (/^[*+\-]\s/.test(trimmed)) {
                    output.push(`<p class="blog-bullet">${trimmed.substring(2)}</p>`);
                    continue;
                }

                // Pass-through raw HTML tags
                if (/^<[a-zA-Z0-9/]+/.test(trimmed) || trimmed.endsWith('</script>')) {
                    output.push(trimmed);
                    continue;
                }

                // Skip stray JSON fragment lines (escaped quotes, lone braces, brackets)
                if (trimmed.startsWith('}') || trimmed.startsWith(']') ||
                    (trimmed.startsWith('"') && trimmed.endsWith(',')) ||
                    (trimmed.startsWith('"') && trimmed.includes('@'))) {
                    continue;
                }

                output.push(`<p class="blog-text">${trimmed}</p>`);
            }
            return output.join('\n');
        })(blog.content);


        // Load blog.html template and replace placeholders
        let blogHtml = fs.readFileSync(path.join(__dirname, 'blog.html'), 'utf8');
        
        const dateStr = new Date(blog.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Set alt tags on dynamic images automatically
        const imageAlt = `${blog.title} Cover Photo - Rudraansh Yatra`;

        const plainTextContent = (blog.content || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        const metaDescriptionVal = blog.meta_description || `${plainTextContent.substring(0, 155)}...`;

        const resolvedMainImg = blog.image_url ? (blog.image_url.startsWith('http') || blog.image_url.startsWith('/') ? blog.image_url : '/' + blog.image_url) : '/assets/images/adi-kailash-hero.webp';
        
        const ogImageUrl = resolvedMainImg.startsWith('http') ? resolvedMainImg : `https://rudraanshyatra.com${resolvedMainImg.startsWith('/') ? '' : '/'}${resolvedMainImg}`;

        const canonicalOverrides = {
            'adi-kailash-yatra-2026-suspended-due-to-weather-official-reopening-date':
                'adi-kailash-yatra-2026-latest-status-monsoon-suspensions-reopening-updates'
        };
        const canonicalUrl = canonicalOverrides[slug]
            ? `https://rudraanshyatra.com/blog/${canonicalOverrides[slug]}`
            : `https://rudraanshyatra.com/blog/${slug}`;

        blogHtml = blogHtml
            .replace(/{{META_TITLE}}/g, `${blog.title} - Rudraansh Yatra Diaries`)
            .replace(/{{META_DESC}}/g, metaDescriptionVal.replace(/"/g, '&quot;'))
            .replace(/{{CANONICAL_URL}}/g, canonicalUrl)
            .replace(/{{OG_IMAGE}}/g, ogImageUrl)
            .replace(/{{TITLE}}/g, blog.title)
            .replace(/{{AUTHOR}}/g, blog.author)
            .replace(/{{DATE}}/g, dateStr)
            .replace(/{{IMAGE}}/g, resolvedMainImg)
            .replace(/{{IMAGE_ALT}}/g, imageAlt)
            .replace(/{{CONTENT}}/g, paragraphsHtml)
            .replace(/{{ADJACENT_BLOGS}}/g, adjacentBlogsHtml)
            .replace(/{{SLUG}}/g, `/blog/${blog.slug}`)
            .replace(/{{CREATED_AT}}/g, blog.created_at)
            .replace(/{{UPDATED_AT}}/g, blog.updated_at || blog.created_at);

        // Enable HTTP Edge Cache Control for fast TTFB & instant response
        res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
        res.send(blogHtml);
    } catch (err) {
        console.error('SSR Blog Error:', err);
        res.redirect('/blogs');
    }
});

// 4. Backward Compatibility Redirect for Legacy Links (/blog?id=XYZ)
app.get('/blog', async (req, res) => {
    const blogId = req.query.id;
    if (!blogId) return res.redirect('/blogs');

    try {
        if (supabase) {
            const { data, error } = await supabase
                .from('blogs')
                .select('title, slug')
                .eq('id', blogId)
                .single();
            
            if (data && !error) {
                // Perform a 301 permanent redirect to the new SEO-friendly URL slug
                const slug = data.slug || slugify(data.title);
                return res.redirect(301, `/blog/${slug}`);
            }
        }
        res.redirect('/blogs');
    } catch (err) {
        console.error('Redirect Error:', err);
        res.redirect('/blogs');
    }
});

// 5. Dynamic XML Sitemap Route (/sitemap.xml)
app.get('/sitemap.xml', async (req, res) => {
    try {
        const baseUrl = 'https://rudraanshyatra.com';
        
        // Core pages of the website
        const staticPages = [
            '',
            '/about',
            '/gallery',
            '/whats-included',
            '/blogs',
            '/adi-kailash',
            '/khaliya-top',
            '/mt-kailash',
            '/darma-valley',
            '/panchachuli'
        ];
        
        let urls = staticPages.map(page => {
            return `  <url>
    <loc>${baseUrl}${page}</loc>
    <changefreq>weekly</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`;
        });

        // Dynamic blog posts from Supabase
        if (supabase) {
            const { data: blogs } = await supabase
                .from('blogs')
                .select('slug, updated_at, created_at')
                .order('created_at', { ascending: false });
            
            if (blogs && blogs.length > 0) {
                blogs.forEach(blog => {
                    const slug = blog.slug || slugify(blog.title);
                    if (slug) {
                        const lastMod = blog.updated_at || blog.created_at;
                        const dateStr = lastMod ? new Date(lastMod).toISOString().split('T')[0] : '';
                        const lastModTag = dateStr ? `\n    <lastmod>${dateStr}</lastmod>` : '';
                        urls.push(`  <url>
    <loc>${baseUrl}/blog/${slug}</loc>${lastModTag}
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
                    }
                });
            }
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

        res.header('Content-Type', 'application/xml');
        res.status(200).send(xml);
    } catch (err) {
        console.error('Sitemap Generator Error:', err);
        res.status(500).send('Error generating sitemap');
    }
});

// GET application version for testing
app.get('/api/version', (req, res) => {
    const { exec } = require('child_process');
    exec('git log -n 1 --oneline && git status --porcelain', (err, stdout, stderr) => {
        const gitInfo = err ? `Error: ${err.message}` : stdout;
        
        const fs = require('fs');
        const path = require('path');
        const filesToCheck = ['admin.html', 'server.js', '.env', 'app.js'];
        const fileDetails = {};
        filesToCheck.forEach(file => {
            try {
                const stats = fs.statSync(path.join(__dirname, file));
                fileDetails[file] = {
                    size: stats.size,
                    mtime: stats.mtime.toISOString()
                };
            } catch (e) {
                fileDetails[file] = `Error: ${e.message}`;
            }
        });

        res.json({
            version: '1.0.9-diagnostics',
            status: 'Running',
            timestamp: new Date().toISOString(),
            supabase_initialized: !!supabase,
            supabase_url_exists: !!process.env.SUPABASE_URL,
            supabase_key_exists: !!process.env.SUPABASE_KEY,
            git: gitInfo.trim().split('\n'),
            files: fileDetails,
            dirname: __dirname
        });
    });
});

// ==========================================
// SECURITY & AUTHENTICATION API ENDPOINTS
// ==========================================

// Login Route
app.post('/api/admin/login', async (req, res) => {
    const { username, passcode } = req.body;
    if (!username || !passcode) {
        return res.status(400).json({ error: 'Username and passcode are required' });
    }

    const cleanUsername = (username || '').toString().trim().toLowerCase();
    const cleanPasscode = (passcode || '').toString().trim();

    const fallbackCredentials = {
        'admin': { id: '8de78fbd-2bfe-48c8-a83b-0d971d68cb92', username: 'admin', passcode: 'VandanaDheerendra@2023', role: 'admin', uuid_mapping: 'c380f706-58c2-4f0d-a74e-cd3691b62dd5' },
        'geetika': { id: '1e06f20b-51e9-4d5c-8c65-565393a13f7e', username: 'geetika', passcode: 'Geetika@Rudra26', role: 'staff', uuid_mapping: '00000000-0000-0000-0000-000000000002' },
        'mansi': { id: '4bdd728f-cab9-4e14-88ac-8705eb6d8f90', username: 'mansi', passcode: 'Mansi@Rudra26', role: 'staff', uuid_mapping: '00000000-0000-0000-0000-000000000005' },
        'sneha': { id: '4edec443-bafe-430f-bdd7-0526585d4c76', username: 'sneha', passcode: 'Sneha@Rudra26', role: 'staff', uuid_mapping: '00000000-0000-0000-0000-000000000003' },
        'seema': { id: 'a4a9bac7-3ba2-48b5-81c3-b362c6275647', username: 'seema', passcode: 'Seema@Rudra26', role: 'staff', uuid_mapping: '00000000-0000-0000-0000-000000000001' },
        'simran': { id: 'e22366e8-7e52-434a-b4c0-98caba13f187', username: 'simran', passcode: 'Simran@Rudra26', role: 'staff', uuid_mapping: '00000000-0000-0000-0000-000000000004' }
    };

    try {
        let userRecord = null;

        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from('staff_credentials')
                    .select('*')
                    .ilike('username', cleanUsername)
                    .maybeSingle();

                if (!error && data) {
                    userRecord = data;
                }
            } catch (dbErr) {
                console.warn('Supabase credentials fetch failed, falling back to static map:', dbErr.message);
            }
        }

        if (!userRecord) {
            userRecord = fallbackCredentials[cleanUsername];
        }

        if (!userRecord) {
            return res.status(400).json({ error: 'Invalid Username or Passcode.' });
        }

        let isMatch = false;

        if (userRecord.passcode.startsWith('$2a$') || userRecord.passcode.startsWith('$2b$')) {
            isMatch = await bcrypt.compare(cleanPasscode, userRecord.passcode);
        } else {
            isMatch = (cleanPasscode === userRecord.passcode) || (cleanPasscode === userRecord.passcode.trim());
        }

        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid Username or Passcode.' });
        }

        const userPayload = {
            id: userRecord.id,
            username: userRecord.username,
            role: userRecord.role,
            uuid_mapping: userRecord.uuid_mapping || ''
        };
        const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '12h' });

        res.json({
            token,
            user: userPayload
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error during login' });
    }
});

// Logout Route
app.post('/api/admin/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
});

// ==========================================
// PUBLIC INQUIRY API ENDPOINTS
// ==========================================

// ─── Sequential Booking ID Generator ─────────────────────────────────────────
// Format: RY-YYYY-NNNN  e.g. RY-2026-0001, RY-2026-0002, ...
// Queries the DB for the highest existing serial in the current year and
// returns the next one. Thread-safe enough for the traffic volume of this app.
async function getNextBookingId() {
    const year = new Date().getFullYear();
    const prefix = `RY-${year}-`;

    // Fetch all booking_ids that match the current year's sequential format
    const { data, error } = await supabase
        .from('bookings')
        .select('booking_id')
        .like('booking_id', `${prefix}%`);

    let maxSeq = 0;
    if (data && data.length > 0) {
        data.forEach(row => {
            // Match only the clean sequential format RY-YYYY-NNNN (4+ digits, no extra dashes)
            const match = (row.booking_id || '').match(/^RY-\d{4}-(\d+)$/);
            if (match) {
                const seq = parseInt(match[1], 10);
                if (seq > maxSeq) maxSeq = seq;
            }
        });
    }

    const nextSeq = maxSeq + 1;
    // Zero-pad to 4 digits (grows automatically beyond 9999: 10000, 10001, ...)
    const paddedSeq = String(nextSeq).padStart(4, '0');
    return `${prefix}${paddedSeq}`;
}

// GET /api/bookings/next-id  — Admin panel calls this to get the next ID before saving
app.get('/api/bookings/next-id', authenticateToken, async (req, res) => {
    try {
        if (!supabase) return res.status(500).json({ error: 'Supabase not initialized' });
        const nextId = await getNextBookingId();
        res.json({ booking_id: nextId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Booking Inquiry from Public page
app.post('/api/bookings', async (req, res) => {
    const { packageName, name, phone, date, travelers, message } = req.body;
    if (!name || !phone) {
        return res.status(400).json({ error: 'Name and Phone are required' });
    }
    try {
        if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized' });

        const autoBookingId = await getNextBookingId();

        const bookingData = {
            booking_id: autoBookingId,
            package_name: packageName || 'General Inquiry',
            name,
            phone,
            email: req.body.email || '',
            travel_date: date || null,
            travelers: travelers ? travelers.toString() : '1',
            message: message || '',
            created_at: new Date().toISOString()
        };

        const { error } = await supabase.from('bookings').insert([bookingData]);
        if (error) throw error;
        res.status(201).json({ success: true, booking_id: autoBookingId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Custom Requests from Wizard
app.post('/api/custom-requests', async (req, res) => {
    try {
        if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized' });
        const { error } = await supabase
            .from('custom_requests')
            .insert(Array.isArray(req.body) ? req.body : [req.body]);
        if (error) throw error;
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Discount Registrations
app.post('/api/discount-registrations', async (req, res) => {
    try {
        if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized' });
        const { error } = await supabase
            .from('discount_registrations')
            .insert(Array.isArray(req.body) ? req.body : [req.body]);
        if (error) throw error;
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Public Gallery
app.get('/api/gallery', async (req, res) => {
    try {
        if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized' });
        const { data, error } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// PROTECTED SECURED ADMIN/STAFF ENDPOINTS
// ==========================================

// Bookings CRUD
app.get('/api/admin/bookings', authenticateToken, async (req, res) => {
    try {
        let query = supabase.from('bookings').select('*');
        if (req.user.role === 'staff') {
            const agentUuid = req.user.uuid_mapping;
            if (agentUuid) {
                query = query.or(`assigned_to.eq.${agentUuid},user_id.eq.${agentUuid}`);
            }
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/bookings', authenticateToken, async (req, res) => {
    try {
        const { error } = await supabase
            .from('bookings')
            .insert(Array.isArray(req.body) ? req.body : [req.body]);
        if (error) throw error;
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/bookings/:id', authenticateToken, async (req, res) => {
    try {
        const { error } = await supabase.from('bookings').update(req.body).eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/bookings/:id', authenticateToken, async (req, res) => {
    try {
        const { error } = await supabase.from('bookings').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lead History Log Endpoints
app.get('/api/admin/leads-history', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('lead_history')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/leads-history', authenticateToken, async (req, res) => {
    try {
        const { error } = await supabase
            .from('lead_history')
            .insert(Array.isArray(req.body) ? req.body : [req.body]);
        if (error) throw error;
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Leads CRUD
app.get('/api/admin/leads', authenticateToken, async (req, res) => {
    try {
        let query = supabase.from('leads').select('*');
        if (req.user.role === 'staff') {
            const agentUuid = req.user.uuid_mapping;
            if (agentUuid) {
                query = query.eq('assigned_to', agentUuid);
            }
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/leads/:id', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase.from('leads').select('*').eq('id', req.params.id).single();
        if (error) throw error;
        if (req.user.role === 'staff' && data.assigned_to !== req.user.uuid_mapping) {
            return res.status(403).json({ error: 'Permission denied' });
        }
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/leads', authenticateToken, async (req, res) => {
    try {
        const { error } = await supabase.from('leads').insert(Array.isArray(req.body) ? req.body : [req.body]);
        if (error) throw error;
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/leads/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role === 'staff') {
            const { data: lead } = await supabase.from('leads').select('assigned_to').eq('id', req.params.id).single();
            if (lead && lead.assigned_to !== req.user.uuid_mapping) {
                return res.status(403).json({ error: 'Permission denied' });
            }
        }
        const { error } = await supabase.from('leads').update(req.body).eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/leads/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { error } = await supabase.from('leads').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// REMINDERS API ENDPOINTS
// ==========================================
const REMINDERS_FILE = path.join(__dirname, 'reminders.json');

function getLocalReminders() {
    try {
        if (fs.existsSync(REMINDERS_FILE)) {
            return JSON.parse(fs.readFileSync(REMINDERS_FILE, 'utf8'));
        }
    } catch (e) {
        console.error('Error reading local reminders:', e);
    }
    return [];
}

function saveLocalReminders(list) {
    try {
        fs.writeFileSync(REMINDERS_FILE, JSON.stringify(list, null, 2), 'utf8');
    } catch (e) {
        console.error('Error writing local reminders:', e);
    }
}

app.get('/api/admin/reminders', authenticateToken, async (req, res) => {
    try {
        if (supabase) {
            let query = supabase.from('reminders').select('*');
            if (req.user.role === 'staff') {
                const agentUuid = req.user.uuid_mapping;
                if (agentUuid) {
                    query = query.or(`assigned_to.eq.${agentUuid},created_by.eq.${req.user.username}`);
                }
            }
            const { data, error } = await query.order('due_date', { ascending: true });
            if (!error && data) {
                return res.json(data);
            }
        }
        
        // Fallback local store if Supabase table does not exist
        let list = getLocalReminders();
        if (req.user.role === 'staff' && req.user.uuid_mapping) {
            list = list.filter(r => r.assigned_to === req.user.uuid_mapping || r.created_by === req.user.username);
        }
        res.json(list);
    } catch (err) {
        console.error('GET Reminders Error:', err);
        res.json(getLocalReminders());
    }
});

app.post('/api/admin/reminders', authenticateToken, async (req, res) => {
    try {
        const item = Array.isArray(req.body) ? req.body[0] : req.body;
        const newItem = {
            id: item.id || `rem_${Date.now()}_${Math.floor(Math.random()*1000)}`,
            lead_id: item.lead_id || null,
            lead_name: item.lead_name || 'General',
            lead_phone: item.lead_phone || '',
            note: item.note || '',
            due_date: item.due_date || new Date().toISOString().split('T')[0],
            due_time: item.due_time || '10:00',
            priority: item.priority || 'Medium',
            assigned_to: item.assigned_to || null,
            status: item.status || 'Pending',
            created_by: req.user.username || 'staff',
            created_at: new Date().toISOString()
        };

        if (supabase) {
            try {
                await supabase.from('reminders').insert([newItem]);
            } catch (e) {
                console.warn('Supabase reminders insert failed, saving locally:', e.message);
            }
        }

        const list = getLocalReminders();
        list.unshift(newItem);
        saveLocalReminders(list);

        // Also log history entry for lead if lead_id exists
        if (newItem.lead_id && supabase) {
            try {
                await supabase.from('lead_history').insert([{
                    lead_id: newItem.lead_id,
                    action: `⏰ Follow-up Reminder set for ${newItem.due_date} ${newItem.due_time}: "${newItem.note}" by ${req.user.username}`
                }]);
            } catch (e) {
                console.warn('History log for reminder failed:', e.message);
            }
        }

        res.status(201).json(newItem);
    } catch (err) {
        console.error('POST Reminder Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/reminders/:id', authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        const updates = req.body;

        if (supabase) {
            try {
                await supabase.from('reminders').update(updates).eq('id', id);
            } catch (e) {}
        }

        const list = getLocalReminders();
        const index = list.findIndex(r => r.id === id || r.id == id);
        if (index !== -1) {
            list[index] = { ...list[index], ...updates };
            saveLocalReminders(list);

            if (updates.status === 'Completed' && list[index].lead_id && supabase) {
                try {
                    await supabase.from('lead_history').insert([{
                        lead_id: list[index].lead_id,
                        action: `✅ Follow-up Reminder completed: "${list[index].note}" by ${req.user.username}`
                    }]);
                } catch (e) {}
            }
        }

        res.json({ success: true });
    } catch (err) {
        console.error('PUT Reminder Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/reminders/:id', authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        if (supabase) {
            try {
                await supabase.from('reminders').delete().eq('id', id);
            } catch (e) {}
        }

        let list = getLocalReminders();
        list = list.filter(r => r.id !== id && r.id != id);
        saveLocalReminders(list);

        res.json({ success: true });
    } catch (err) {
        console.error('DELETE Reminder Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Users/Assignees Mapping
app.get('/api/admin/users', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase.from('users_view').select('*');
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Custom Requests CRUD
app.get('/api/admin/custom-requests', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase.from('custom_requests').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/custom-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { error } = await supabase.from('custom_requests').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Discount Registrations CRUD
app.get('/api/admin/discount-registrations', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase.from('discount_registrations').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/discount-registrations/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { error } = await supabase.from('discount_registrations').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Blogs CRUD
app.get('/api/admin/blogs', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase.from('blogs').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/blogs', authenticateToken, async (req, res) => {
    try {
        const { error } = await supabase
            .from('blogs')
            .insert(Array.isArray(req.body) ? req.body : [req.body]);
        if (error) throw error;
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/blogs/:id', authenticateToken, async (req, res) => {
    try {
        const { error } = await supabase.from('blogs').update(req.body).eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/blogs/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { error } = await supabase.from('blogs').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Gallery CRUD
app.get('/api/admin/gallery', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/gallery', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { error } = await supabase
            .from('gallery')
            .insert(Array.isArray(req.body) ? req.body : [req.body]);
        if (error) throw error;
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/gallery/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { error } = await supabase.from('gallery').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get currently logged-in user profile (accessible by all authenticated staff/admins)
app.get('/api/admin/profile', authenticateToken, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase client not initialized' });
        }
        const { data, error } = await supabase
            .from('staff_credentials')
            .select('*')
            .eq('id', req.user.id)
            .maybeSingle();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Profile not found' });

        // Mask passcode hash for safety
        const profile = { ...data, passcode: '********' };
        res.json(profile);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Staff/User mapping endpoint (safe for all authenticated staff/admins to map names)
app.get('/api/admin/staff-mapping', authenticateToken, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase client not initialized' });
        }
        const { data, error } = await supabase
            .from('staff_credentials')
            .select('id, username, uuid_mapping, designation, photo, name')
            .order('username', { ascending: true });

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Credentials CRUD
app.get('/api/admin/credentials', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabase.from('staff_credentials').select('*').order('username', { ascending: true });
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/credentials', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const credentialData = { ...req.body };
        if (credentialData.passcode) {
            credentialData.passcode = await bcrypt.hash(credentialData.passcode, 10);
        }
        const { error } = await supabase.from('staff_credentials').insert([credentialData]);
        if (error) throw error;
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/credentials/:id', authenticateToken, async (req, res) => {
    try {
        const isSelf = req.user.id === req.params.id;
        const isAdmin = req.user.role === 'admin';
        if (!isSelf && !isAdmin) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        const updates = { ...req.body };
        if (!isAdmin) {
            delete updates.role;
            delete updates.uuid_mapping;
            delete updates.username;
        }

        if (updates.passcode === '********' || !updates.passcode) {
            delete updates.passcode;
        } else {
            const isAlreadyHashed = updates.passcode.startsWith('$2a$') || updates.passcode.startsWith('$2b$');
            if (!isAlreadyHashed) {
                updates.passcode = await bcrypt.hash(updates.passcode, 10);
            }
        }

        const { error } = await supabase.from('staff_credentials').update(updates).eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/credentials/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { error } = await supabase.from('staff_credentials').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Secure image upload streaming endpoint
app.post('/api/admin/upload', authenticateToken, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
    }
    
    const bucket = req.body.bucket || 'blog-images';
    const folder = req.body.folder ? req.body.folder + '/' : '';
    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `${folder}file_${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;

    try {
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase client not initialized' });
        }

        const { error } = await supabase.storage
            .from(bucket)
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                cacheControl: '3600',
                upsert: true
            });

        if (error) throw error;

        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

        res.json({ publicUrl: urlData.publicUrl });
    } catch (err) {
        console.error('File upload error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// BILLING & PAYMENT TRACKING API ENDPOINTS
// ==========================================

// 1. Fetch all billing records with optional search & status filter
app.get('/api/billing', authenticateToken, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase client not initialized' });
        }
        const { search, status } = req.query;
        let query = supabase.from('booking_bills').select('*');

        if (status && status !== 'All') {
            query = query.eq('payment_status', status);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        let result = data || [];
        if (search) {
            const term = search.toLowerCase().trim();
            result = result.filter(bill => 
                bill.customer_name.toLowerCase().includes(term) || 
                bill.booking_id.toLowerCase().includes(term)
            );
        }

        res.json(result);
    } catch (err) {
        console.error('API GET Billing Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 2. Create a new billing record
app.post('/api/billing', authenticateToken, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase client not initialized' });
        }

        // Support direct table insert format (e.g. from mock client)
        let directBills = null;
        if (Array.isArray(req.body)) {
            directBills = req.body;
        } else if (req.body && req.body.booking_id) {
            directBills = [req.body];
        }

        if (directBills && directBills.length > 0) {
            const { data, error } = await supabase
                .from('booking_bills')
                .insert(directBills)
                .select();
            if (error) throw error;
            return res.status(201).json(data);
        }

        const { 
            bookingId, 
            customerDetails, 
            packageName, 
            totalPackageAmount,
            initialPayment
        } = req.body;

        if (!bookingId || !customerDetails || !packageName || !totalPackageAmount) {
            return res.status(400).json({ error: 'Missing required billing fields' });
        }

        const amount = parseFloat(totalPackageAmount);
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Invalid total package amount' });
        }

        let payments = [];
        if (initialPayment && parseFloat(initialPayment.amountPaid) > 0) {
            const initialAmount = parseFloat(initialPayment.amountPaid);
            const receiptId = 'REC-' + Date.now() + Math.floor(Math.random() * 10);
            payments.push({
                receiptId,
                amountPaid: initialAmount,
                date: new Date().toISOString().split('T')[0],
                paymentMode: initialPayment.paymentMode || 'UPI',
                paymentType: initialPayment.paymentType || 'Token Advance'
            });
        }

        const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
        const balanceRemaining = amount - totalPaid;

        let paymentStatus = 'Pending';
        if (totalPaid > 0) {
            paymentStatus = totalPaid >= amount ? 'Fully Paid' : 'Partially Paid';
        }

        const newBill = {
            booking_id: bookingId,
            customer_name: customerDetails.name,
            customer_phone: customerDetails.phone,
            customer_email: customerDetails.email || '',
            group_size: parseInt(customerDetails.groupSize) || 1,
            tour_start_date: customerDetails.tourStartDate,
            package_name: packageName,
            total_package_amount: amount,
            payments_received: payments,
            balance_remaining: balanceRemaining,
            payment_status: paymentStatus
        };

        const { data, error } = await supabase
            .from('booking_bills')
            .insert([newBill])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        console.error('API POST Billing Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 3. Log a new payment transaction on an existing bill
app.post('/api/billing/:id/payment', authenticateToken, async (req, res) => {
    try {
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase client not initialized' });
        }

        const billId = req.params.id;
        const { amountPaid, paymentMode, paymentType } = req.body;

        const additionalPaid = parseFloat(amountPaid);
        if (isNaN(additionalPaid) || additionalPaid <= 0) {
            return res.status(400).json({ error: 'Invalid payment amount' });
        }

        const { data: bill, error: fetchErr } = await supabase
            .from('booking_bills')
            .select('*')
            .eq('id', billId)
            .single();

        if (fetchErr || !bill) {
            return res.status(404).json({ error: 'Billing record not found' });
        }

        const receiptId = 'REC-' + Date.now() + Math.floor(Math.random() * 10);
        const newPayment = {
            receiptId,
            amountPaid: additionalPaid,
            date: new Date().toISOString().split('T')[0],
            paymentMode: paymentMode || 'UPI',
            paymentType: paymentType || 'Second Installment'
        };

        const discount = parseFloat(bill.discount || 0);
        const netAmount = parseFloat(bill.total_package_amount) - discount;
        const updatedPayments = [...(bill.payments_received || []), newPayment];
        const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amountPaid, 0);
        const newBalance = Math.max(0, netAmount - totalPaid);

        let newStatus = 'Pending';
        if (totalPaid > 0) {
            newStatus = totalPaid >= netAmount ? 'Fully Paid' : 'Partially Paid';
        }

        const { data: updatedBill, error: updateErr } = await supabase
            .from('booking_bills')
            .update({
                payments_received: updatedPayments,
                balance_remaining: newBalance,
                payment_status: newStatus
            })
            .eq('id', billId)
            .select()
            .single();

        if (updateErr) throw updateErr;
        res.json(updatedBill);
    } catch (err) {
        console.error('API Add Payment Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 4. Generate non-GST Bill of Supply PDF using PDFKit
app.get('/api/billing/:id/pdf', async (req, res) => {
    try {
        if (!supabase) {
            return res.status(500).send('Supabase client not initialized');
        }

        const billId = req.params.id;
        const { data: bill, error } = await supabase
            .from('booking_bills')
            .select('*')
            .eq('id', billId)
            .single();

        if (error || !bill) {
            return res.status(404).send('Invoice not found');
        }

        const doc = new PDFDocument({ margin: 0, size: 'A4' });
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(chunks);
            res.setHeader('Content-Disposition', `attachment; filename="Invoice_${bill.booking_id}.pdf"`);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Length', pdfBuffer.length);
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.send(pdfBuffer);
        });

        // ─── DESIGN TOKENS ───────────────────────────────────────────────────
        const navy      = '#0B1F3A';   // Deep navy – header bg, headings
        const gold      = '#C9A84C';   // Rich gold – accents & highlights
        const goldLight = '#F5E9C8';   // Pale gold – balance-due box bg
        const white     = '#FFFFFF';
        const ink       = '#1A2742';   // Dark body text
        const slate     = '#5A6A7E';   // Muted body text / labels
        const silver    = '#E8EDF4';   // Light rule / row separator
        const rowAlt    = '#F7F9FC';   // Alternating table row bg
        const redAccent = '#C0392B';   // Discount / negative amount
        const greenText = '#1A6B3A';   // Paid amounts

        const pageW = 595.28;
        const pageH = 841.89;
        const gutter = 40;
        const contentW = pageW - gutter * 2;

        // ─── HELPER FUNCTIONS ─────────────────────────────────────────────────
        const drawRoundRect = (x, y, w, h, r, fillColor, strokeColor, lineW = 0.75) => {
            doc.save();
            if (fillColor) doc.fillColor(fillColor);
            if (strokeColor) doc.strokeColor(strokeColor).lineWidth(lineW);
            doc.roundedRect(x, y, w, h, r);
            if (fillColor && strokeColor) doc.fillAndStroke();
            else if (fillColor) doc.fill();
            else if (strokeColor) doc.stroke();
            doc.restore();
        };

        const drawRect = (x, y, w, h, fillColor, strokeColor, lineW = 0.75) => {
            doc.save();
            if (fillColor) doc.fillColor(fillColor);
            if (strokeColor) doc.strokeColor(strokeColor).lineWidth(lineW);
            doc.rect(x, y, w, h);
            if (fillColor && strokeColor) doc.fillAndStroke();
            else if (fillColor) doc.fill();
            else if (strokeColor) doc.stroke();
            doc.restore();
        };

        const hrLine = (y, color = silver, lw = 0.75) => {
            doc.moveTo(gutter, y).lineTo(pageW - gutter, y)
               .strokeColor(color).lineWidth(lw).stroke();
        };

        const fmt = (num, decimals = 2) =>
            parseFloat(num || 0).toLocaleString('en-IN', { minimumFractionDigits: decimals });

        // ─── 1. HEADER BAND ───────────────────────────────────────────────────
        const headerH = 115;
        drawRect(0, 0, pageW, headerH, navy, null);

        // Gold accent stripe at very top
        drawRect(0, 0, pageW, 4, gold, null);

        // Logo
        const logoPath = path.join(__dirname, 'assets/images/logo.png');
        try {
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, gutter, 18, { width: 60, height: 60 });
            }
        } catch (e) { /* skip */ }

        // Brand name
        doc.fillColor(white)
           .font('Helvetica-Bold')
           .fontSize(22)
           .text('RUDRAANSH YATRA', gutter + 72, 22);

        doc.fillColor(gold)
           .font('Helvetica-Oblique')
           .fontSize(10)
           .text('Connecting Souls to the Divine', gutter + 72, 47);

        // Tagline separator line
        doc.moveTo(gutter + 72, 62).lineTo(gutter + 72 + 170, 62)
           .strokeColor(gold).lineWidth(0.5).stroke();

        // Contact block on right
        doc.fillColor('#A8BBCF')
           .font('Helvetica')
           .fontSize(7.5)
           .text('1st Floor Above Maniram Punetha & Sons,', pageW - gutter - 220, 20, { align: 'right', width: 220 })
           .text('Simalgair Bazaar, Pithoragarh, Uttarakhand – 262501', pageW - gutter - 220, 31, { align: 'right', width: 220 });

        doc.fillColor(gold)
           .font('Helvetica-Bold')
           .fontSize(8)
           .text('+91 7617617651', pageW - gutter - 220, 46, { align: 'right', width: 220 })
           .fillColor('#A8BBCF')
           .font('Helvetica')
           .fontSize(7.5)
           .text('info@rudraanshyatra.com', pageW - gutter - 220, 57, { align: 'right', width: 220 })
           .text('www.rudraanshyatra.com', pageW - gutter - 220, 68, { align: 'right', width: 220 });

        // Invoice type badge bottom of header
        doc.save();
        doc.roundedRect(gutter, 82, 175, 20, 4).fillColor('#1D3557').fill();
        doc.restore();
        doc.fillColor(gold)
           .font('Helvetica-Bold')
           .fontSize(8)
           .text('BILL OF SUPPLY  ·  NON-GST INVOICE', gutter + 8, 87.5);

        // Invoice number & date on right side of header bar
        doc.fillColor('#A8BBCF')
           .font('Helvetica')
           .fontSize(7.5)
           .text(`Invoice No: BILL-${bill.booking_id}`, pageW - gutter - 220, 82, { align: 'right', width: 220 })
           .text(`Date: ${new Date(bill.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageW - gutter - 220, 93, { align: 'right', width: 220 });

        // ─── 2. BOOKING ID RIBBON ─────────────────────────────────────────────
        const ribbonY = headerH;
        drawRect(0, ribbonY, pageW, 26, '#F0F4FA', null);
        doc.moveTo(0, ribbonY).lineTo(pageW, ribbonY).strokeColor(silver).lineWidth(1).stroke();
        doc.moveTo(0, ribbonY + 26).lineTo(pageW, ribbonY + 26).strokeColor(silver).lineWidth(1).stroke();

        doc.fillColor(slate)
           .font('Helvetica')
           .fontSize(8)
           .text('BOOKING REFERENCE:', gutter, ribbonY + 8);

        doc.fillColor(navy)
           .font('Helvetica-Bold')
           .fontSize(9)
           .text(bill.booking_id, gutter + 115, ribbonY + 7);

        // Dot separator
        doc.fillColor(silver)
           .circle(gutter + 285, ribbonY + 13, 2).fill();

        doc.fillColor(slate)
           .font('Helvetica')
           .fontSize(8)
           .text('PAYMENT STATUS:', gutter + 298, ribbonY + 8);

        const statusLabel = bill.payment_status || 'Pending';
        const statusColor = statusLabel === 'Fully Paid' ? '#1A6B3A' : statusLabel === 'Partially Paid' ? '#92400E' : '#7C3AED';
        const statusBg    = statusLabel === 'Fully Paid' ? '#D1FAE5' : statusLabel === 'Partially Paid' ? '#FEF3C7' : '#EDE9FE';
        const statusW     = doc.widthOfString(statusLabel, { fontSize: 8 }) + 16;

        drawRoundRect(gutter + 385, ribbonY + 5, statusW, 16, 3, statusBg, null);
        doc.fillColor(statusColor)
           .font('Helvetica-Bold')
           .fontSize(7.5)
           .text(statusLabel, gutter + 393, ribbonY + 9);

        // ─── 3. CLIENT + TOUR CARDS ───────────────────────────────────────────
        const cardsY = ribbonY + 26 + 16;
        const halfW  = (contentW - 14) / 2;

        // Left card – Billed To
        drawRoundRect(gutter, cardsY, halfW, 90, 6, white, silver, 0.75);

        // Gold left border accent
        drawRect(gutter, cardsY, 3, 90, gold, null);

        doc.fillColor(slate)
           .font('Helvetica-Bold')
           .fontSize(7)
           .text('BILLED TO', gutter + 14, cardsY + 12);

        doc.fillColor(navy)
           .font('Helvetica-Bold')
           .fontSize(13)
           .text(bill.customer_name || 'Guest', gutter + 14, cardsY + 24, { width: halfW - 20 });

        const afterNameY = doc.y + 4;
        doc.fillColor(slate)
           .font('Helvetica')
           .fontSize(8)
           .text(`📞  ${bill.customer_phone || 'N/A'}`, gutter + 14, afterNameY, { width: halfW - 20 });
        doc.text(`✉  ${bill.customer_email || 'N/A'}`, gutter + 14, doc.y + 2, { width: halfW - 20 });

        // Right card – Tour Details
        const rightCardX = gutter + halfW + 14;
        drawRoundRect(rightCardX, cardsY, halfW, 90, 6, white, silver, 0.75);
        drawRect(rightCardX, cardsY, 3, 90, gold, null);

        doc.fillColor(slate)
           .font('Helvetica-Bold')
           .fontSize(7)
           .text('YATRA & TOUR DETAILS', rightCardX + 14, cardsY + 12);

        doc.fillColor(navy)
           .font('Helvetica-Bold')
           .fontSize(12)
           .text(bill.package_name || 'Yatra Package', rightCardX + 14, cardsY + 24, { width: halfW - 20 });

        const afterPkgY = doc.y + 6;
        const startDateStr = new Date(bill.tour_start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        doc.fillColor(slate)
           .font('Helvetica')
           .fontSize(8)
           .text(`Group Size:`, rightCardX + 14, afterPkgY, { continued: true, width: halfW - 20 })
           .fillColor(ink).font('Helvetica-Bold')
           .text(`  ${bill.group_size || 1} Pax`);

        doc.fillColor(slate).font('Helvetica').fontSize(8)
           .text(`Reporting Date:`, rightCardX + 14, doc.y + 2, { continued: true, width: halfW - 20 })
           .fillColor(ink).font('Helvetica-Bold')
           .text(`  ${startDateStr}`);

        if (bill.pickup_point) {
            doc.fillColor(slate).font('Helvetica').fontSize(8)
               .text(`Pickup:`, rightCardX + 14, doc.y + 2, { continued: true, width: halfW - 20 })
               .fillColor(ink).font('Helvetica-Bold')
               .text(`  ${bill.pickup_point}`);
        }

        // ─── 4. BOOKING CHARGES TABLE ─────────────────────────────────────────
        const tblY = cardsY + 90 + 20;

        // Section heading with gold rule
        doc.fillColor(navy).font('Helvetica-Bold').fontSize(10)
           .text('BOOKING CHARGES', gutter, tblY);
        doc.moveTo(gutter + 118, tblY + 7).lineTo(pageW - gutter, tblY + 7)
           .strokeColor(gold).lineWidth(1).stroke();

        // Table header
        const thY = tblY + 16;
        drawRect(gutter, thY, contentW, 22, navy, null);

        doc.fillColor(white).font('Helvetica-Bold').fontSize(8.5)
           .text('Package Description', gutter + 12, thY + 7)
           .text('Rate (INR)', pageW - gutter - 12, thY + 7, { align: 'right', width: 100 });

        // Table row
        const trY = thY + 22;
        drawRect(gutter, trY, contentW, 28, rowAlt, silver, 0.5);

        doc.fillColor(ink).font('Helvetica').fontSize(9)
           .text(`Expedition Package: ${bill.package_name} (Group of ${bill.group_size} Pax)`, gutter + 12, trY + 9, { width: contentW - 130 });
        doc.fillColor(navy).font('Helvetica-Bold').fontSize(9)
           .text(`₹ ${fmt(bill.total_package_amount)}`, pageW - gutter - 12, trY + 9, { align: 'right', width: 100 });

        hrLine(trY + 28, silver, 0.5);

        // ─── 5. PAYMENT HISTORY TABLE ─────────────────────────────────────────
        const paySecY = trY + 28 + 18;

        doc.fillColor(navy).font('Helvetica-Bold').fontSize(10)
           .text('PAYMENT HISTORY', gutter, paySecY);
        doc.moveTo(gutter + 108, paySecY + 7).lineTo(pageW - gutter, paySecY + 7)
           .strokeColor(gold).lineWidth(1).stroke();

        const phY = paySecY + 16;
        drawRect(gutter, phY, contentW, 22, navy, null);

        const phCols = [
            { label: 'Receipt ID',      x: gutter + 12,  w: 130 },
            { label: 'Date',            x: gutter + 150,  w: 75  },
            { label: 'Type',            x: gutter + 228,  w: 110 },
            { label: 'Method',          x: gutter + 340,  w: 70  },
            { label: 'Amount (INR)',     x: pageW - gutter - 12, w: 100, align: 'right' }
        ];

        phCols.forEach(col => {
            doc.fillColor(white).font('Helvetica-Bold').fontSize(8)
               .text(col.label, col.x, phY + 7, { width: col.w, align: col.align || 'left' });
        });

        const payments = bill.payments_received || [];
        let curY = phY + 22;

        if (payments.length === 0) {
            drawRect(gutter, curY, contentW, 24, rowAlt, silver, 0.5);
            doc.fillColor(slate).font('Helvetica-Oblique').fontSize(8.5)
               .text('No payment transactions logged yet.', gutter + 12, curY + 7);
            curY += 24;
        } else {
            payments.forEach((pay, idx) => {
                const rowBg = idx % 2 === 0 ? white : rowAlt;
                drawRect(gutter, curY, contentW, 22, rowBg, silver, 0.3);

                const payDate = pay.date
                    ? new Date(pay.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : '—';

                doc.fillColor(ink).font('Helvetica').fontSize(7.8)
                   .text(pay.receiptId || '—',           gutter + 12,  curY + 7, { width: 130 })
                   .text(payDate,                         gutter + 150, curY + 7, { width: 75  })
                   .text(pay.paymentType || 'Advance',    gutter + 228, curY + 7, { width: 110 })
                   .text(pay.paymentMode  || 'UPI',       gutter + 340, curY + 7, { width: 70  });

                doc.fillColor(greenText).font('Helvetica-Bold').fontSize(8)
                   .text(`₹ ${fmt(pay.amountPaid)}`, pageW - gutter - 12, curY + 7, { align: 'right', width: 100 });

                curY += 22;
            });
        }
        hrLine(curY, silver, 0.5);

        // ─── 6. SUMMARY + TERMS (TWO COLUMNS) ────────────────────────────────
        const summaryY = curY + 18;
        const termColW = 230;
        const summColW = contentW - termColW - 14;
        const summColX = gutter + termColW + 14;

        // --- Terms column ---
        doc.fillColor(navy).font('Helvetica-Bold').fontSize(9)
           .text('TERMS & CONDITIONS', gutter, summaryY);
        doc.moveTo(gutter + 133, summaryY + 6).lineTo(gutter + termColW, summaryY + 6)
           .strokeColor(gold).lineWidth(0.75).stroke();

        const terms = [
            { t: 'Conduct',      d: 'Safety rules violators can be removed without refund.' },
            { t: 'Damage',       d: 'Any loss/damage to hotels or homestays is chargeable.' },
            { t: 'Belongings',   d: 'We are not responsible for loss or theft of items.' },
            { t: 'Delays',       d: 'Not liable for delays due to weather or landslides.' },
            { t: 'Amenities',    d: 'Facilities availability varies by location.' },
            { t: 'Itinerary',    d: 'Plans subject to change due to weather or safety.' },
            { t: 'Booking',      d: 'Confirmed bookings are non-refundable/non-cancellable.' },
            { t: 'Cleanliness',  d: 'Maintain cleanliness and cooperate with team members.' },
            { t: 'Spirit',       d: 'Travel responsibly, respect others, enjoy the journey.' }
        ];

        const termBoxH = terms.length * 14 + 14;
        drawRoundRect(gutter, summaryY + 12, termColW, termBoxH, 5, '#F7F9FC', silver, 0.5);

        let termItemY = summaryY + 20;
        terms.forEach(term => {
            doc.fillColor(navy).font('Helvetica-Bold').fontSize(6.5)
               .text(`${term.t}:`, gutter + 8, termItemY, { continued: true, width: termColW - 16 })
               .fillColor(slate).font('Helvetica').fontSize(6.5)
               .text(` ${term.d}`, { width: termColW - 16 });
            termItemY += 14;
        });

        // --- Summary column ---
        const totalPackage = parseFloat(bill.total_package_amount || 0);
        const discount     = parseFloat(bill.discount || 0);
        const netAmount    = totalPackage - discount;
        const totalPaid    = payments.reduce((s, p) => s + parseFloat(p.amountPaid || 0), 0);
        const balance      = Math.max(0, netAmount - totalPaid);

        const summLineH = 22;
        let sY = summaryY;

        const drawSummaryRow = (label, value, labelCol, valCol, isBold = false) => {
            doc.fillColor(slate).font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5)
               .text(label, summColX, sY, { width: summColW * 0.58 });
            doc.fillColor(isBold ? navy : ink).font('Helvetica-Bold').fontSize(8.5)
               .text(value, summColX + summColW * 0.58, sY, { align: 'right', width: summColW * 0.42 });
            sY += summLineH;
        };

        drawSummaryRow('Package Price:', `₹ ${fmt(totalPackage)}`);
        hrLine(sY - 6, silver, 0.4);

        if (discount > 0) {
            doc.fillColor(slate).font('Helvetica').fontSize(8.5)
               .text('Discount:', summColX, sY, { width: summColW * 0.58 });
            doc.fillColor(redAccent).font('Helvetica-Bold').fontSize(8.5)
               .text(`– ₹ ${fmt(discount)}`, summColX + summColW * 0.58, sY, { align: 'right', width: summColW * 0.42 });
            sY += summLineH;
            hrLine(sY - 6, silver, 0.4);

            doc.fillColor(slate).font('Helvetica').fontSize(8.5)
               .text('Net Package Price:', summColX, sY, { width: summColW * 0.58 });
            doc.fillColor(ink).font('Helvetica-Bold').fontSize(8.5)
               .text(`₹ ${fmt(netAmount)}`, summColX + summColW * 0.58, sY, { align: 'right', width: summColW * 0.42 });
            sY += summLineH;
            hrLine(sY - 6, silver, 0.4);
        }

        doc.fillColor(slate).font('Helvetica').fontSize(8.5)
           .text('Total Amount Paid:', summColX, sY, { width: summColW * 0.58 });
        doc.fillColor(greenText).font('Helvetica-Bold').fontSize(8.5)
           .text(`₹ ${fmt(totalPaid)}`, summColX + summColW * 0.58, sY, { align: 'right', width: summColW * 0.42 });
        sY += summLineH + 6;

        // Balance Due box – premium design
        const balBoxH = 40;
        // Outer shadow layer
        drawRoundRect(summColX + 2, sY + 2, summColW, balBoxH, 6, '#D4B86A22', null);
        // Main box
        drawRoundRect(summColX, sY, summColW, balBoxH, 6, goldLight, gold, 1.5);

        doc.fillColor('#7A5C00').font('Helvetica').fontSize(8)
           .text('BALANCE DUE', summColX + 12, sY + 8);
        doc.fillColor('#4A3500').font('Helvetica-Bold').fontSize(16)
           .text(`₹ ${fmt(balance)}`, summColX + 12, sY + 18, { width: summColW - 24, align: 'right' });

        // ─── 7. DECORATIVE MOUNTAIN DIVIDER ──────────────────────────────────
        const footDivY = 760;
        // Full-width thin gold line
        doc.moveTo(0, footDivY).lineTo(pageW, footDivY)
           .strokeColor(gold).lineWidth(0.75).stroke();

        // Mountain silhouette (simple polygon)
        doc.save()
           .fillColor(navy)
           .opacity(0.06)
           .moveTo(gutter, footDivY)
           .lineTo(gutter + 40, footDivY - 18)
           .lineTo(gutter + 70, footDivY - 8)
           .lineTo(gutter + 100, footDivY - 28)
           .lineTo(gutter + 145, footDivY - 12)
           .lineTo(gutter + 170, footDivY)
           .fill()
           .restore();

        // ─── 8. FOOTER ────────────────────────────────────────────────────────
        doc.fillColor(slate)
           .font('Helvetica-Oblique')
           .fontSize(7)
           .text('This is a computer generated invoice and requires no physical signature.', 0, footDivY + 8, { align: 'center', width: pageW });

        doc.fillColor(navy)
           .font('Helvetica-Bold')
           .fontSize(6.5)
           .text('This is a non-GST Bill of Supply issued by a non-registered supplier operating within the statutory threshold exemption limits.', 0, footDivY + 20, { align: 'center', width: pageW });

        // Page number badge
        drawRoundRect(pageW / 2 - 24, footDivY + 33, 48, 14, 3, navy, null);
        doc.fillColor(gold).font('Helvetica-Bold').fontSize(7)
           .text('Page 1 of 1', pageW / 2 - 22, footDivY + 37);

        doc.end();
    } catch (err) {
        console.error('API Generate PDF Error:', err);
        res.status(500).send('Failed to generate bill PDF: ' + err.message);
    }
});

// ==========================================
// ONLINE PAYMENT GATEWAY ROUTES (RAZORPAY)
// ==========================================

// 1. Lookup Booking Bill Details for Payment
app.get('/api/payment/lookup/:bookingId', async (req, res) => {
    try {
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase client not initialized' });
        }
        const bookingId = req.params.bookingId.toUpperCase().trim();
        const { data: bill, error } = await supabase
            .from('booking_bills')
            .select('*')
            .eq('booking_id', bookingId)
            .maybeSingle();

        if (error) throw error;
        if (!bill) {
            return res.status(404).json({ error: 'Booking ID not found' });
        }

        res.json({
            id: bill.id,
            booking_id: bill.booking_id,
            customer_name: bill.customer_name,
            customer_phone: bill.customer_phone,
            customer_email: bill.customer_email,
            group_size: bill.group_size,
            tour_start_date: bill.tour_start_date,
            package_name: bill.package_name,
            total_package_amount: parseFloat(bill.total_package_amount),
            balance_remaining: parseFloat(bill.balance_remaining),
            payment_status: bill.payment_status,
            total_paid: parseFloat(bill.total_package_amount) - parseFloat(bill.balance_remaining)
        });
    } catch (err) {
        console.error('API Payment Lookup Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 2. Create Razorpay Order
app.post('/api/create-order', async (req, res) => {
    try {
        const { bookingId, amount } = req.body;
        if (!bookingId || !amount) {
            return res.status(400).json({ error: 'Missing bookingId or amount' });
        }

        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || (numericAmount * 100) < 100) {
            return res.status(400).json({ error: 'Amount must be at least 100 paise (₹1)' });
        }

        let actualBookingId = bookingId;

        if (bookingId === 'PENDING') {
            if (!supabase) {
                return res.status(500).json({ error: 'Supabase client not initialized' });
            }
            // Generate a clean unique Booking ID for this instant online booking
            actualBookingId = 'RY-ONL-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 10);
            
            const packagePrice = req.body.totalPackageAmount ? parseFloat(req.body.totalPackageAmount) : numericAmount;
            
            const newBill = {
                booking_id: actualBookingId,
                customer_name: req.body.customerName || 'Instant Customer',
                customer_phone: req.body.customerPhone || '',
                customer_email: req.body.customerEmail || '',
                group_size: parseInt(req.body.groupSize) || 1,
                tour_start_date: req.body.tourStartDate || new Date().toISOString().split('T')[0],
                package_name: req.body.packageName || 'Online Package',
                total_package_amount: packagePrice,
                payments_received: [],
                balance_remaining: packagePrice,
                payment_status: 'Pending'
            };

            const { error: dbError } = await supabase
                .from('booking_bills')
                .insert([newBill]);

            if (dbError) throw dbError;
        }

        const isDummy = razorpayKeyId === 'rzp_test_dummykeyid123';
        let order;

        if (isDummy) {
            // Mock Razorpay order for local sandbox testing
            order = {
                id: 'order_mock_' + Date.now() + Math.floor(Math.random() * 100),
                amount: Math.round(numericAmount * 100),
                currency: 'INR'
            };
        } else {
            // Create actual Razorpay Order
            const options = {
                amount: Math.round(numericAmount * 100), // amount in paise
                currency: 'INR',
                receipt: 'rcpt_' + actualBookingId.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20) + '_' + Date.now().toString().slice(-4),
            };
            try {
                order = await razorpay.orders.create(options);
            } catch (err) {
                console.error('Razorpay SDK Order Error:', err);
                if (err.statusCode === 401 || (err.error && err.error.code === 'BAD_REQUEST_ERROR' && err.message.includes('auth'))) {
                    return res.status(401).json({ error: 'Razorpay authentication failed' });
                }
                return res.status(500).json({ error: err.message || 'Razorpay API error' });
            }
        }

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: isDummy ? 'rzp_test_dummykeyid123' : razorpayKeyId,
            bookingId: actualBookingId
        });
    } catch (err) {
        console.error('API Create Order Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 3. Verify Razorpay Payment Signature
app.post('/api/verify-payment', async (req, res) => {
    try {
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase client not initialized' });
        }

        const {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            bookingId,
            amountPaid
        } = req.body;

        if (!bookingId || !amountPaid) {
            return res.status(400).json({ error: 'Missing bookingId or amountPaid' });
        }

        const additionalPaid = parseFloat(amountPaid);
        if (isNaN(additionalPaid) || additionalPaid <= 0) {
            return res.status(400).json({ error: 'Invalid payment amount' });
        }

        const isDummy = razorpayKeyId === 'rzp_test_dummykeyid123';

        // Cryptographic Signature Verification
        if (!isDummy) {
            if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
                return res.status(400).json({ error: 'Missing Razorpay details for verification' });
            }
            const body = razorpay_order_id + '|' + razorpay_payment_id;
            const expectedSignature = crypto
                .createHmac('sha256', razorpayKeySecret)
                .update(body.toString())
                .digest('hex');

            if (expectedSignature !== razorpay_signature) {
                return res.status(400).json({ error: 'Invalid payment signature. Verification failed.' });
            }
        }

        // Signature is verified or bypassed in dummy mode. Update Supabase billing record:
        // 1. Fetch current bill
        const { data: bill, error: fetchErr } = await supabase
            .from('booking_bills')
            .select('*')
            .eq('booking_id', bookingId)
            .maybeSingle();

        if (fetchErr || !bill) {
            return res.status(404).json({ error: 'Billing record not found for Booking ID ' + bookingId });
        }

        // 2. Add receipt to payments_received history
        const paymentMode = isDummy ? 'Online (Mock Razorpay)' : 'Online (Razorpay)';
        const receiptId = razorpay_payment_id || 'PAY-MOCK-' + Date.now() + Math.floor(Math.random() * 10);
        const newPayment = {
            receiptId,
            amountPaid: additionalPaid,
            date: new Date().toISOString().split('T')[0],
            paymentMode,
            paymentType: bill.payments_received && bill.payments_received.length === 0 ? 'Online Advance' : 'Online Installment'
        };

        const updatedPayments = [...(bill.payments_received || []), newPayment];
        const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amountPaid, 0);
        const newBalance = Math.max(0, parseFloat(bill.total_package_amount) - totalPaid);

        let newStatus = 'Pending';
        if (totalPaid > 0) {
            newStatus = totalPaid >= parseFloat(bill.total_package_amount) ? 'Fully Paid' : 'Partially Paid';
        }

        const { data: updatedBill, error: updateErr } = await supabase
            .from('booking_bills')
            .update({
                payments_received: updatedPayments,
                balance_remaining: newBalance,
                payment_status: newStatus
            })
            .eq('id', bill.id)
            .select()
            .single();

        if (updateErr) throw updateErr;

        res.json({
            success: true,
            receiptId,
            bill: updatedBill
        });
    } catch (err) {
        console.error('API Payment Verification Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Serve payment.html with clean URL support
app.get(['/payment', '/payment.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'payment.html'));
});

// Serve admin.html with explicit cache-busting headers
app.get(['/admin', '/admin.html'], (req, res) => {

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Serve lead-details.html with explicit cache-busting headers
app.get(['/lead-details', '/lead-details.html'], (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(__dirname, 'lead-details.html'));
});


// Simple in-memory cache for Google Reviews
let googleReviewsCache = {
    data: null,
    timestamp: 0
};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

app.get('/api/google-reviews', async (req, res) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const placeId = process.env.GOOGLE_PLACE_ID || 'ChIJUaOjOEsloTkRjOLS3RK_S_A';
    const now = Date.now();

    if (googleReviewsCache.data && (now - googleReviewsCache.timestamp < CACHE_DURATION)) {
        return res.json(googleReviewsCache.data);
    }

    const fallbackReviews = {
        rating: 4.7,
        user_ratings_total: 711,
        reviews: [
            {
                author_name: "Ajit Garg",
                profile_photo_url: "",
                rating: 5,
                text: "I have gone to Kailash Mansarovar Yatra with other three female family members in a conducted tour by Rudraansh Yatra from 22 Aug to 1st September. It was really an amazing trip, Lord shiv...",
                relative_time_description: "Meerut",
                photos: [
                    "assets/images/om-parvat-group.webp",
                    "assets/images/adi-kailash-senior-citizens.webp"
                ]
            },
            {
                author_name: "Mr. Ankit Kedia",
                profile_photo_url: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=80&auto=format&fit=crop&q=60",
                rating: 5,
                text: "It was a dream come true moment for me to travel such a divine and holy place kailash mansarovar yatra. Such a difficult yatra has been made so easy and simple by our travel agency Rudraansh Yatra. I heartily thanks to all...",
                relative_time_description: "Ranchi",
                photos: [
                    "assets/images/Kailash.webp",
                    "assets/images/adi-kailash-panchachuli.webp"
                ]
            },
            {
                author_name: "Balakrishna Siddheshwar",
                profile_photo_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&auto=format&fit=crop&q=60",
                rating: 5,
                text: "We are very much Thanks to you, & your team supported team, each one is helping nature. The yatra is very beautiful and without any trouble. we have enjoyed lot on every day, by god grace & guidance from...",
                relative_time_description: "Bangalore",
                photos: [
                    "assets/images/Panchacholi.webp",
                    "assets/images/khaliya-top.webp"
                ]
            }
        ]
    };

    if (!apiKey) {
        googleReviewsCache = { data: fallbackReviews, timestamp: now };
        return res.json(fallbackReviews);
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${apiKey}`;
        const response = await fetch(url);
        const json = await response.json();

        if (json.status === 'OK' && json.result) {
            const resultData = {
                rating: json.result.rating || 4.7,
                user_ratings_total: json.result.user_ratings_total || 711,
                reviews: (json.result.reviews || []).map(r => ({
                    author_name: r.author_name,
                    profile_photo_url: r.profile_photo_url || "",
                    rating: r.rating || 5,
                    text: r.text,
                    relative_time_description: r.relative_time_description || "Verified Customer",
                    photos: (r.photos && r.photos.length > 0)
                        ? r.photos.map(p => `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${p.photo_reference}&key=${apiKey}`)
                        : []
                }))
            };
            googleReviewsCache = { data: resultData, timestamp: now };
            return res.json(resultData);
        } else {
            console.error("Google Places API error:", json.error_message || json.status);
            return res.json(fallbackReviews);
        }
    } catch (err) {
        console.error("Failed to fetch Google Reviews:", err);
        return res.json(fallbackReviews);
    }
});


// Meta Leads Webhook Verification (GET)
app.get('/api/webhooks/meta-leads', (req, res) => {
    const hubMode = req.query['hub.mode'];
    const hubVerifyToken = req.query['hub.verify_token'];
    const hubChallenge = req.query['hub.challenge'];

    const localVerifyToken = process.env.META_VERIFY_TOKEN || 'meta_leads_webhook_token_2026';

    if (hubMode === 'subscribe' && hubVerifyToken === localVerifyToken) {
        console.log('Meta Leads Webhook Verified successfully.');
        res.status(200).send(hubChallenge);
    } else {
        console.warn('Meta Leads Webhook Verification failed. Token mismatch.');
        res.sendStatus(403);
    }
});

// Meta Leads Webhook Event Handler (POST)
app.post('/api/webhooks/meta-leads', async (req, res) => {
    try {
        const body = req.body;
        console.log('Meta Leads Webhook payload received:', JSON.stringify(body, null, 2));

        if (body.object !== 'page') {
            return res.sendStatus(404);
        }

        // Send 200 OK immediately as required by Meta to prevent timeout retries
        res.status(200).send('EVENT_RECEIVED');

        const entries = body.entry || [];
        for (const entry of entries) {
            const changes = entry.changes || [];
            for (const change of changes) {
                if (change.field === 'leadgen') {
                    const leadgenId = change.value.leadgen_id;
                    const formId = change.value.form_id;
                    const adId = change.value.ad_id;
                    
                    if (leadgenId) {
                        // Process leadgen event in the background (async)
                        processMetaLead(leadgenId, formId, adId).catch(err => {
                            console.error('Error processing Meta Lead in background:', err);
                        });
                    }
                }
            }
        }
    } catch (err) {
        console.error('Error handling Meta Leads webhook:', err);
    }
});

// Helper to fetch details from Meta Graph API and insert into Supabase CRM
async function processMetaLead(leadgenId, formId, adId) {
    try {
        const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN;
        
        let name = 'Meta Lead';
        let phone = '';
        let email = '';
        let source = 'Meta Leads';
        let remarks = `Form ID: ${formId || 'N/A'}, Ad ID: ${adId || 'N/A'}, Leadgen ID: ${leadgenId}`;

        if (pageAccessToken) {
            const graphUrl = `https://graph.facebook.com/v19.0/${leadgenId}?fields=field_data,created_time&access_token=${pageAccessToken}`;
            
            console.log(`Querying Meta Graph API for lead ID ${leadgenId}...`);
            const response = await fetch(graphUrl);
            const data = await response.json();
            
            if (response.ok && data.field_data) {
                data.field_data.forEach(field => {
                    const fieldName = (field.name || '').toLowerCase();
                    const fieldVal = field.values ? field.values[0] : '';
                    
                    if (fieldName.includes('full_name') || fieldName.includes('first_name') || fieldName === 'name') {
                        name = fieldVal;
                    } else if (fieldName.includes('phone') || fieldName.includes('contact')) {
                        phone = fieldVal;
                    } else if (fieldName.includes('email')) {
                        email = fieldVal;
                    } else {
                        remarks += `\n${field.name}: ${fieldVal}`;
                    }
                });
                source = `Meta Leads: ${formId || 'Ad Form'}`;
            } else {
                console.error('Failed to fetch lead info from Graph API:', data.error || 'Unknown Graph API Error');
                remarks += `\n(Could not retrieve lead details: Access token or permissions issue)`;
            }
        } else {
            console.log('META_PAGE_ACCESS_TOKEN is missing. Inserting placeholder lead.');
            name = `Meta Lead #${leadgenId.slice(-4)}`;
            remarks += `\n(Details pending: Add META_PAGE_ACCESS_TOKEN to environment variables)`;
        }

        // Insert lead into Supabase leads table
        if (supabase) {
            const { error } = await supabase.from('leads').insert([{
                name,
                phone: phone || 'Pending',
                email: email || 'Pending',
                source,
                status: 'New',
                remarks,
                created_at: new Date()
            }]);
            
            if (error) {
                console.error('Error inserting Meta Lead into Supabase:', error.message);
            } else {
                console.log(`Successfully integrated Meta Lead: ${name}`);
            }
        } else {
            console.error('Supabase client is not initialized. Cannot save lead.');
        }
    } catch (err) {
        console.error('Error processing Meta lead:', err);
    }
}


// Global Cache-Busting Middleware: Disable caching for all static assets, HTML pages, and routes
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// Serve static files from the root directory with clean URL support (lower priority than our SSR routes)
app.use(express.static(__dirname, { extensions: ['html'] }));

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File is too large. Maximum size allowed is 10MB.' });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
    }
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});


function syncStaticFiles() {
    const fs = require('fs');
    const path = require('path');
    
    // Resolve public_html directory (from hidden .builds/versions/... path to parent domain root)
    const publicHtmlDir = path.resolve(__dirname, '../../../../public_html');
    if (!fs.existsSync(publicHtmlDir)) {
        console.log(`[Static Sync] Public directory not found at: ${publicHtmlDir}`);
        return;
    }
    
    console.log(`[Static Sync] Syncing static files from ${__dirname} to ${publicHtmlDir}...`);
    
    const filesToSync = [
        'admin.html',
        'app.js',
        'style.css',
        'about.html',
        'adi-kailash.html',
        'blog.html',
        'blogs.html',
        'darma-valley.html',
        'gallery.html',
        'index.html',
        'khaliya-top.html',
        'lead-details.html',
        'mt-kailash.html',
        'panchachuli.html',
        'payment.html',
        'whats-included.html',
        'sitemap.xml',
        'robots.txt',
        '.htaccess'
    ];
    
    filesToSync.forEach(file => {
        try {
            const srcPath = path.join(__dirname, file);
            const destPath = path.join(publicHtmlDir, file);
            if (fs.existsSync(srcPath)) {
                fs.copyFileSync(srcPath, destPath);
                console.log(`[Static Sync] Synced ${file}`);
            }
        } catch (e) {
            console.error(`[Static Sync] Failed to sync ${file}: ${e.message}`);
        }
    });
}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    try {
        syncStaticFiles();
    } catch (e) {
        console.error('Error during static files sync:', e);
    }
});
