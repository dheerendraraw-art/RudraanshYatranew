require('dotenv').config();
const HOSTINGER_PORT = process.env.PORT;

// Catch uncaught exceptions and unhandled promise rejections to prevent process crash (503 Service Unavailable)
process.on('uncaughtException', (err) => {
    console.error('[CRITICAL] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

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
const compression = require('compression');
const { getBlogEnhancement } = require('./blog-enhancers');

const JWT_SECRET = process.env.JWT_SECRET || 'rudraansh_yatra_secure_jwt_secret_key_2026_xyz';
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

const app = express();
app.use(compression({ level: 6 }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// HTTP Security & Static Cache Headers
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Serve static files with aggressive 1-year immutable cache headers for images, fonts, css, and js
app.use('/assets', express.static(path.join(__dirname, 'assets'), {
    maxAge: '1y',
    immutable: true
}));

// Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token required' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(401).json({ error: 'Invalid or expired token' });
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

const PORT = HOSTINGER_PORT || process.env.PORT || 3000;

// Initialize Razorpay Client (gracefully falls back if keys are not set in .env)
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_dummykeyid123';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'dummysecret123';
const razorpay = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret
});


// Initialize Supabase Client
const DEFAULT_SUPABASE_URL = 'https://ysnzxvvsegmkmkepclti.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzbnp4dnZzZWdta21rZXBjbHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NDY3NjMsImV4cCI6MjA5NjMyMjc2M30.V6q3OpJCf6PEu6JTM__6E7PJDrY5lY--FZfjyy_toLM';

const supabaseUrl = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || DEFAULT_SUPABASE_KEY;
let supabase = null;

try {
    if (supabaseUrl && supabaseKey) {
        supabase = createClient(supabaseUrl, supabaseKey);
    }
} catch (err) {
    console.error('Error initializing Supabase client:', err);
}

function getSupabase() {
    if (!supabase) {
        try {
            const url = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
            const key = process.env.SUPABASE_KEY || DEFAULT_SUPABASE_KEY;
            supabase = createClient(url, key);
        } catch (e) {
            console.error('Failed to get Supabase client:', e);
        }
    }
    return supabase;
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
    let rawSlug = req.params.slug || '';
    const cleanSlug = rawSlug.replace(/\.html$/i, '');

    // Redirect legacy long slug or file names to clean optimized slug
    const legacySlugs = {
        'due-to-china-denying-clearance-for-the-lipulekh-crossing-28-indian-businessmen-were-forced-to-return': 'china-denies-lipulekh-clearance-indian-traders-return',
        'ndia-tibet-border-trade-through-lipulekh-pass-finally-resumes-on-august-1-2026-after-a-seven-year-pause-heres-what-changed-since-traders-were-turned-back-in-july': 'india-tibet-border-trade-lipulekh-pass-resumes-august-2026',
        'inner-line-permit-adi-kailash-2026-step-by-step': 'inner-line-permit-adi-kailash-2026-guide'
    };

    const targetSlug = legacySlugs[cleanSlug] || cleanSlug;
    const slug = targetSlug;
    if (legacySlugs[cleanSlug]) {
        return res.redirect(301, `/blog/${legacySlugs[cleanSlug]}`);
    }

    try {
        let blog = null;
        let adjacentBlogsHtml = '';

        if (supabase) {
            // Fetch from database by targetSlug
            const { data, error } = await supabase
                .from('blogs')
                .select('*')
                .eq('slug', targetSlug)
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
                    const currentIndex = allBlogs.findIndex(b => b.slug === targetSlug);
                    const N = allBlogs.length;
                    const adjacentBlogs = [];

                    // Get next article (wrap around if at the end)
                    const nextIndex = (currentIndex + 1) % N;
                    if (nextIndex !== currentIndex && nextIndex >= 0) {
                        adjacentBlogs.push(allBlogs[nextIndex]);
                    }

                    // Get previous article (wrap around if at the beginning)
                    const prevIndex = (currentIndex - 1 + N) % N;
                    if (prevIndex !== currentIndex && prevIndex >= 0 && !adjacentBlogs.includes(allBlogs[prevIndex])) {
                        adjacentBlogs.push(allBlogs[prevIndex]);
                    }

                    // Get next-next article if we have enough and want 3
                    const nextNextIndex = (currentIndex + 2) % N;
                    if (nextNextIndex !== currentIndex && nextNextIndex !== prevIndex && nextNextIndex !== nextIndex && nextNextIndex >= 0 && !adjacentBlogs.includes(allBlogs[nextNextIndex])) {
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
            // Fallback: Check if static blog HTML file exists on disk in ./blog/
            const staticFilePath = path.join(__dirname, 'blog', `${cleanSlug}.html`);
            if (fs.existsSync(staticFilePath)) {
                return res.sendFile(staticFilePath);
            }
            const directStaticPath = path.join(__dirname, 'blog', rawSlug);
            if (fs.existsSync(directStaticPath)) {
                return res.sendFile(directStaticPath);
            }
            return res.status(404).send('<h1>404 - Article Not Found</h1><p>The travel diary you are looking for does not exist.</p><a href="/blogs">Go back to Blogs</a>');
        }

        // Render Paragraphs
        // Task 1.2: Detect FAQ JSON blocks & wrap as valid <script> JSON-LD (fixes broken schema)
        const paragraphsHtml = (function renderContent(rawContent) {
            const lines = rawContent.split('\n');
            const output = [];
            let inScriptBlock = false;
            let scriptBuffer = [];

            for (let i = 0; i < lines.length; i++) {
                const trimmed = lines[i].trim();
                if (!trimmed) continue;

                // Handle <script> blocks (like JSON-LD schemas) cleanly
                if (!inScriptBlock && trimmed.includes('<script')) {
                    inScriptBlock = true;
                    scriptBuffer = [trimmed];
                    if (trimmed.includes('</script>')) {
                        output.push(scriptBuffer.join('\n'));
                        inScriptBlock = false;
                        scriptBuffer = [];
                    }
                    continue;
                }

                if (inScriptBlock) {
                    scriptBuffer.push(trimmed);
                    if (trimmed.includes('</script>')) {
                        output.push(scriptBuffer.join('\n'));
                        inScriptBlock = false;
                        scriptBuffer = [];
                    }
                    continue;
                }

                // --- Numbered headings → <h2> ---
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
                if (/^<[a-zA-Z0-9/]+/.test(trimmed) || trimmed.endsWith('/>')) {
                    output.push(trimmed);
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

        // Each blog self-canonicalizes to its own URL for independent ranking
        const canonicalUrl = `https://rudraanshyatra.com/blog/${targetSlug}`;

        // Specific schema & CTA banner enhancements for high-performing blog posts
        let extraSchemas = '';
        let contentHtml = paragraphsHtml;
        let parikramaMetaOverride = null;

        // Apply modular SEO/AEO/GEO enhancement if configured for this slug
        const modularEnhancement = getBlogEnhancement(targetSlug, paragraphsHtml);
        if (modularEnhancement) {
            parikramaMetaOverride = modularEnhancement.meta;
            extraSchemas = modularEnhancement.schemas;
            contentHtml = modularEnhancement.contentHtml;
        }

        // ── SEO for Kailash Mansarovar final batch blog ──
        if (slug === 'kailash-mansarovar-yatra-2026-tilak-mala-welcome-44-yatris-tanakpur') {
            parikramaMetaOverride = {
                title: 'Kailash Mansarovar Yatra 2026: Final Batch via Lipulekh Pass Welcomed at Tanakpur',
                desc: 'The 10th and final batch of 44 pilgrims for the Kailash Mansarovar Yatra 2026 via Lipulekh Pass received a traditional Kumaoni welcome at Tanakpur TRC.',
                dateModified: '2026-08-13T12:00:00+05:30'
            };

            extraSchemas = `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Which was the final batch for Kailash Mansarovar Yatra 2026 via Lipulekh Pass?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The 10th batch comprising 44 pilgrims (28 male, 16 female) from 12 Indian states was the final batch of the 2026 season via Lipulekh Pass."
          }
        },
        {
          "@type": "Question",
          "name": "How many total pilgrims completed the Kailash Mansarovar Yatra via Lipulekh in 2026?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "A total of 468 pilgrims across 10 batches completed the pilgrimage via Tanakpur-Pithoragarh-Lipulekh Pass in 2026, doubling from 237 pilgrims in 2025."
          }
        },
        {
          "@type": "Question",
          "name": "What is the altitude and location of Lipulekh Pass?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Lipulekh Pass is a high-altitude Himalayan mountain pass situated at an elevation of approximately 17,060 feet (5,200m) in Pithoragarh district, Uttarakhand, connecting India with Tibet Autonomous Region (China)."
          }
        },
        {
          "@type": "Question",
          "name": "How do I get an Inner Line Permit (ILP) for Adi Kailash and border yatras?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Inner Line Permits (ILP) are issued by the SDM Office in Dharchula/Pithoragarh. Registered local ground operators like Rudraansh Yatra facilitate all documentation, medical clearance, and police verification required for permit issuance."
          }
        }
      ]
    }
    </script>`;
        }

        // ── SEO for senior citizens blog is now handled by blog-enhancers.js ──
        if (false && slug === 'is-adi-kailash-yatra-safe-for-senior-citizens-guide') {
            parikramaMetaOverride = {
                title: 'Is Adi Kailash Yatra Safe for Senior Citizens? | 2026 Guide',
                desc: 'Can senior citizens do the Adi Kailash Yatra? Age limit, medical fitness certificate, AMS risks, best months (Sep–Oct), pony support & how we\'ve guided 70+ year olds to Jyolingkong at 4,750m.',
                dateModified: '2026-08-09T00:00:00+05:30'
            };

            extraSchemas = `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is the age limit for the Adi Kailash Yatra for senior citizens?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The general recommended age range is 10 to 65 years. However, senior citizens up to 70–75 years can safely join the Adi Kailash Yatra if they are in good health, have normal medical test reports (BP, ECG, blood sugar), and receive a high-altitude fitness clearance certificate from a government doctor. A medical fitness certificate is mandatory for the Inner Line Permit."
          }
        },
        {
          "@type": "Question",
          "name": "Is there walking or trekking required for senior citizens on the Adi Kailash Yatra?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No strenuous trekking is required. BRO roads now reach directly to the viewpoints, so senior citizens travel in 4x4 vehicles (Mahindra Boleros) all the way to Jyolingkong for Adi Kailash and Nabhidhang for Om Parvat. Only short walks of 100–300 metres on flat terrain are needed to reach the temples. Local ponies are also available at both viewpoints for additional support."
          }
        },
        {
          "@type": "Question",
          "name": "Can senior citizens with diabetes or high blood pressure do the Adi Kailash Yatra?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, senior citizens with well-managed diabetes or high blood pressure can successfully complete the Adi Kailash Yatra. They must carry regular medicines, monitor blood pressure throughout the journey, stay well-hydrated, and avoid sudden physical exertion. A medical fitness certificate is required from a government doctor before the Inner Line Permit is issued."
          }
        },
        {
          "@type": "Question",
          "name": "Which is the best month for senior citizens to do the Adi Kailash Yatra?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "May to June and September to October are the best months for senior citizens. The weather is pleasant during the day, skies are clear, and road conditions in the Byas Valley are stable. July and August must be completely avoided due to monsoon rains, which cause landslides and road blockages along the Dharchula-Gunji route."
          }
        },
        {
          "@type": "Question",
          "name": "What happens if an elderly pilgrim suffers breathing difficulties or AMS on the Adi Kailash route?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "In case of low oxygen or AMS (Acute Mountain Sickness), Rudraansh Yatra immediately administers portable oxygen, checks oxygen saturation with an oximeter, and evacuates the pilgrim to the nearest ITBP military medical camp or to a lower altitude like Dharchula. All our 4x4 vehicles carry portable oxygen cylinders and first aid kits. Our guides are native Vyas Valley residents trained in altitude emergency management."
          }
        }
      ]
    }
    </script>`;

            const seniorCTABanner = `
<style>
.ry-snr-banner { background: linear-gradient(135deg, #0c1a0c 0%, #1a2e1a 100%); border: 2px solid #22c55e; border-radius: 14px; padding: 22px 24px; margin: 0 0 24px 0; color: #ffffff; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
.ry-snr-banner-head { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }
.ry-snr-banner-title { color: #86efac; font-size: 18px; font-weight: 700; line-height: 1.3; }
.ry-snr-banner-desc { font-size: 14.5px; line-height: 1.65; color: #dcfce7; margin-bottom: 14px; }
.ry-snr-badge { background: rgba(34,197,94,0.1); border-left: 3px solid #22c55e; padding: 10px 14px; border-radius: 4px; margin-bottom: 16px; font-size: 13.5px; color: #bbf7d0; }
.ry-snr-btn-row { display: flex; gap: 10px; flex-wrap: wrap; }
.ry-snr-btn { padding: 11px 20px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 13.5px; display: inline-flex; align-items: center; gap: 8px; }
.ry-snr-btn.wa { background: #22c55e; color: #fff; box-shadow: 0 4px 14px rgba(34,197,94,0.35); }
.ry-snr-btn.pk { background: #d4af37; color: #0f172a; box-shadow: 0 4px 14px rgba(212,175,55,0.35); }
.ry-snr-nav { background: rgba(15,23,42,0.5); border: 1px solid rgba(212,175,55,0.25); border-radius: 10px; padding: 14px 16px; margin-bottom: 28px; font-size: 13.5px; color: #cbd5e1; }
.ry-snr-nav strong { color: #fbbf24; display: block; margin-bottom: 8px; }
.ry-snr-nav-pills { display: flex; flex-wrap: wrap; gap: 7px; }
.ry-snr-nav-pill { color: #93c5fd; text-decoration: none; background: rgba(147,197,253,0.1); padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(147,197,253,0.2); white-space: nowrap; }
.ry-snr-bottom { background: #0f172a; border: 2px dashed rgba(212,175,55,0.5); border-radius: 12px; padding: 20px 22px; margin: 32px 0 8px 0; color: #ffffff; }
.ry-snr-bottom-title { font-size: 15px; font-weight: 700; color: #fbbf24; margin-bottom: 8px; }
.ry-snr-bottom-desc { font-size: 14px; color: #e2e8f0; line-height: 1.6; margin-bottom: 14px; }
.ry-snr-bottom-btn-row { display: flex; gap: 10px; flex-wrap: wrap; font-size: 13.5px; }
.ry-snr-bottom-btn { padding: 9px 18px; border-radius: 6px; text-decoration: none; font-weight: 700; display: inline-flex; align-items: center; gap: 7px; }
.ry-snr-bottom-btn.wa { background: #22c55e; color: #fff; }
.ry-snr-bottom-btn.call { background: transparent; border: 1.5px solid #d4af37; color: #d4af37; }
.ry-snr-also { margin-top: 14px; font-size: 13px; color: #94a3b8; }
.ry-snr-also a { color: #93c5fd; }
@media (max-width: 680px) {
  .ry-snr-banner { padding: 16px 14px; border-radius: 10px; margin-bottom: 20px; }
  .ry-snr-banner-title { font-size: 15px; }
  .ry-snr-banner-desc { font-size: 13.5px; margin-bottom: 12px; }
  .ry-snr-badge { padding: 8px 10px; font-size: 12px; margin-bottom: 12px; }
  .ry-snr-btn { font-size: 13px; padding: 10px 14px; width: 100%; justify-content: center; box-sizing: border-box; }
  .ry-snr-btn-row { flex-direction: column; gap: 8px; }
  .ry-snr-nav { padding: 12px 12px; }
  .ry-snr-nav-pill { font-size: 12px; padding: 3px 8px; }
  .ry-snr-bottom { padding: 16px 14px; border-radius: 10px; }
  .ry-snr-bottom-title { font-size: 14px; }
  .ry-snr-bottom-desc { font-size: 13px; margin-bottom: 10px; }
  .ry-snr-bottom-btn { font-size: 13px; padding: 10px 14px; width: 100%; justify-content: center; box-sizing: border-box; }
  .ry-snr-bottom-btn-row { flex-direction: column; gap: 8px; }
}
@media (max-width: 380px) {
  .ry-snr-banner { padding: 12px 10px; }
  .ry-snr-banner-title { font-size: 14px; }
  .ry-snr-btn { font-size: 12px; padding: 9px 10px; }
  .ry-snr-bottom-btn { font-size: 12px; padding: 9px 10px; }
}
</style>
<div class="ry-snr-banner">
    <div class="ry-snr-banner-head">
        <span style="font-size: 26px;">🙏</span>
        <strong class="ry-snr-banner-title">Planning Adi Kailash Yatra for an Elderly Family Member?</strong>
    </div>
    <p class="ry-snr-banner-desc">
        Rudraansh Yatra is a <strong>NIDHI-certified ground operator from Pithoragarh</strong> that has safely guided senior citizens aged 70+ to Jyolingkong at 4,750m. We carry <strong>portable oxygen cylinders</strong>, arrange pony support, and handle the <strong>Inner Line Permit & medical fitness certificate</strong> process for all yatris.
    </p>
    <div class="ry-snr-badge">
        🗓️ <strong>Best months for senior citizens:</strong> September 15 – October 31, 2026 (post-monsoon, stable roads, clear skies)
    </div>
    <div class="ry-snr-btn-row">
        <a href="https://wa.me/917617617651?text=Namaste!%20I%20want%20to%20plan%20the%20Adi%20Kailash%20Yatra%20for%20a%20senior%20citizen%20in%20my%20family.%20Please%20share%20details%20on%20safety%2C%20departure%20dates%20and%20ILP%20process." target="_blank" rel="noopener" class="ry-snr-btn wa">
            <i class="fa-brands fa-whatsapp" style="font-size: 17px;"></i> WhatsApp for Senior Citizen Yatra
        </a>
        <a href="/adi-kailash" class="ry-snr-btn pk">
            <i class="fa-solid fa-mountain" style="font-size: 14px;"></i> View Full Yatra Package
        </a>
    </div>
</div>

<div class="ry-snr-nav">
    <strong>📚 Essential Guides Before You Book</strong>
    <div class="ry-snr-nav-pills">
        <a href="/blog/inner-line-permit-adi-kailash-2026-guide" class="ry-snr-nav-pill">📋 ILP Permit Guide</a>
        <a href="/blog/adi-kailash-packing-list-essential-guide-for-yatris" class="ry-snr-nav-pill">🎒 Packing List</a>
        <a href="/blog/adi-kailash-yatra-difficulty-level-can-beginners-do-it" class="ry-snr-nav-pill">⛰️ Difficulty Level Guide</a>
        <a href="/blog/5-things-you-need-to-do-before-planning-a-trip-to-adi-kailash" class="ry-snr-nav-pill">✅ Pre-Trip Checklist</a>
        <a href="/blog/adi-kailash-yatra-2026-latest-status-monsoon-suspensions-reopening-updates" class="ry-snr-nav-pill">📅 2026 Yatra Status</a>
    </div>
</div>`;

            const seniorCtaBottom = `
<div class="ry-snr-bottom">
    <p class="ry-snr-bottom-title">💬 Have More Questions About Senior Citizen Safety?</p>
    <p class="ry-snr-bottom-desc">
        Our team at Rudraansh Yatra is based in <strong>Pithoragarh</strong> and has handled the complete yatra for elderly pilgrims — including medical fitness paperwork, oxygen support, and pony arrangements. Call us before you decide and we'll walk you through every step.
    </p>
    <div class="ry-snr-bottom-btn-row">
        <a href="https://wa.me/917617617651?text=Namaste!%20I%20have%20questions%20about%20the%20Adi%20Kailash%20Yatra%20for%20a%20senior%20citizen.%20Please%20advise%20on%20safety%2C%20medical%20fitness%20and%20ILP%20process." target="_blank" rel="noopener" class="ry-snr-bottom-btn wa">
            <i class="fa-brands fa-whatsapp"></i> Chat on WhatsApp
        </a>
        <a href="tel:+917617617651" class="ry-snr-bottom-btn call">
            <i class="fa-solid fa-phone"></i> Call +91 76176 17651
        </a>
    </div>
    <p class="ry-snr-also">Also read: <a href="/blog/adi-kailash-yatra-for-solo-female-travellers-safety-guide">Solo Female Travellers Safety Guide</a> · <a href="/blog/adi-kailash-yatra-difficulty-level-can-beginners-do-it">Difficulty Level: Can Beginners Do It?</a></p>
</div>`;

            const enrichedContent = paragraphsHtml
                .replace(/<!--EndFragment-->/g, '')
                .replace(/ class="font-claude-response-body[^"]*"/g, '')
                .replace(/ class="text-text-100[^"]*"/g, '')
                .replace(/ dir="ltr"/g, '')
                // Inline interlink: packing list (mention of medicines/packing)
                .replace(
                    /carry their regular medicines/,
                    'carry their regular medicines (see our <a href="/blog/adi-kailash-packing-list-essential-guide-for-yatris" style="color: #7c3aed; text-decoration: underline;">complete Adi Kailash packing list</a>)'
                )
                // Inline interlink: best months (Jul/Aug monsoon mention)
                .replace(
                    /July and August should be completely avoided/,
                    'July and August should be completely avoided (see <a href="/blog/adi-kailash-yatra-2026-latest-status-monsoon-suspensions-reopening-updates" style="color: #7c3aed; text-decoration: underline;">2026 monsoon closure & reopening update</a>)'
                )
                // Inline interlink: inner line permit (where NOT already linked)
                .replace(
                    /Inner Line Permit \(ILP\)\s*\(ILP\)/,
                    '<a href="/blog/inner-line-permit-adi-kailash-2026-guide" style="color: #7c3aed; text-decoration: underline;">Inner Line Permit (ILP)</a>'
                );

            contentHtml = seniorCTABanner + enrichedContent + seniorCtaBottom;
        }

        // ── SEO for "Is Adi Kailash Yatra Closed" blog ──
        if (slug === 'is-adi-kailash-yatra-closed-right-now-reopening-date-why-travellers-get-stuck-at-dharchula') {
            parikramaMetaOverride = {
                title: 'Is Adi Kailash Yatra Closed Right Now? Reopening Date 2026 & ILP Status',
                desc: 'Is the Adi Kailash Yatra open in 2026? Route reopened September 15 after monsoon closure. ILP permits from Dharchula SDM now being issued. Check current yatra status & avoid getting stuck at Dharchula.',
                dateModified: '2026-08-09T00:00:00+05:30'
            };

            extraSchemas = `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Is the Adi Kailash Yatra open right now in 2026?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The Adi Kailash Yatra 2026 was suspended during the monsoon season and officially reopened around September 15, 2026. Always confirm current route status with a local ground operator or the SDM Office in Dharchula before travelling, as exact dates can shift year to year based on weather and road conditions."
          }
        },
        {
          "@type": "Question",
          "name": "Why does the Adi Kailash Yatra close temporarily every year?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The Adi Kailash route passes through high-altitude border terrain in the Byas Valley near the Indo-Tibet border. Annual closures are related to monsoon conditions (typically June to mid-September), road maintenance along the Dharchula-Gunji route, and administrative review of the restricted border area by authorities."
          }
        },
        {
          "@type": "Question",
          "name": "Can I get an Inner Line Permit (ILP) when the Adi Kailash Yatra is closed?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. The SDM Office in Dharchula does not issue Inner Line Permits (ILP) for the Adi Kailash route during the closed season. This is why many travellers arrive at the SDM office and are turned away — always confirm yatra status before travelling to Dharchula."
          }
        },
        {
          "@type": "Question",
          "name": "What is the Adi Kailash Yatra reopening date for 2026?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The Adi Kailash Yatra 2026 is expected to reopen around September 15, 2026. However, this date can shift based on ground conditions in the Byas Valley. Rudraansh Yatra tracks reopening announcements in real time from Pithoragarh and will confirm the exact date before finalising any bookings."
          }
        },
        {
          "@type": "Question",
          "name": "What should I do if I have already booked travel and the Adi Kailash Yatra is still closed?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Contact a local ground operator in Pithoragarh immediately. They can help you adjust your itinerary, advise on the confirmed reopening date, or reschedule your permits and transport. A locally-based operator like Rudraansh Yatra tracks daily ground updates and can often find solutions that Delhi-based agents cannot."
          }
        }
      ]
    }
    </script>`;

            const closedYatraCTA = `
<style>
.ry-cld-banner { background: linear-gradient(135deg, #1a0505 0%, #2d0a0a 100%); border: 2px solid #ef4444; border-radius: 14px; padding: 20px 24px; margin: 0 0 24px 0; color: #ffffff; }
.ry-cld-banner-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
.ry-cld-banner-title { color: #fca5a5; font-size: 17px; font-weight: 700; }
.ry-cld-banner-desc { font-size: 14px; color: #fecaca; line-height: 1.6; margin-bottom: 14px; }
.ry-cld-btn-row { display: flex; gap: 10px; flex-wrap: wrap; }
.ry-cld-btn { padding: 10px 18px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 13.5px; display: inline-flex; align-items: center; gap: 8px; }
.ry-cld-btn.wa { background: #22c55e; color: #fff; }
.ry-cld-btn.info { background: rgba(251,191,36,0.15); border: 1.5px solid #fbbf24; color: #fbbf24; }
.ry-cld-nav { background: rgba(15,23,42,0.5); border: 1px solid rgba(212,175,55,0.25); border-radius: 10px; padding: 14px 16px; margin-bottom: 28px; font-size: 13.5px; color: #cbd5e1; }
.ry-cld-nav strong { color: #fbbf24; display: block; margin-bottom: 8px; }
.ry-cld-nav-pills { display: flex; flex-wrap: wrap; gap: 7px; }
.ry-cld-nav-pill { color: #93c5fd; text-decoration: none; background: rgba(147,197,253,0.1); padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(147,197,253,0.2); white-space: nowrap; }
.ry-cld-bottom { background: #0f172a; border: 2px dashed rgba(212,175,55,0.5); border-radius: 12px; padding: 20px 22px; margin: 32px 0 8px 0; color: #ffffff; }
.ry-cld-bottom-title { font-size: 15px; font-weight: 700; color: #fbbf24; margin-bottom: 8px; }
.ry-cld-bottom-desc { font-size: 14px; color: #e2e8f0; line-height: 1.6; margin-bottom: 14px; }
.ry-cld-bottom-btn-row { display: flex; gap: 10px; flex-wrap: wrap; font-size: 13.5px; }
.ry-cld-bottom-btn { padding: 9px 18px; border-radius: 6px; text-decoration: none; font-weight: 700; display: inline-flex; align-items: center; gap: 7px; }
.ry-cld-bottom-btn.wa { background: #22c55e; color: #fff; }
.ry-cld-bottom-btn.call { background: transparent; border: 1.5px solid #d4af37; color: #d4af37; }
.ry-cld-also { margin-top: 14px; font-size: 13px; color: #94a3b8; }
.ry-cld-also a { color: #93c5fd; }
@media (max-width: 680px) {
  .ry-cld-banner { padding: 16px 14px; border-radius: 10px; margin-bottom: 20px; }
  .ry-cld-banner-title { font-size: 15px; }
  .ry-cld-banner-desc { font-size: 13px; margin-bottom: 12px; }
  .ry-cld-btn { font-size: 13px; padding: 10px 14px; width: 100%; justify-content: center; box-sizing: border-box; }
  .ry-cld-btn-row { flex-direction: column; gap: 8px; }
  .ry-cld-nav { padding: 12px 12px; }
  .ry-cld-nav-pill { font-size: 12px; padding: 3px 8px; }
  .ry-cld-bottom { padding: 16px 14px; border-radius: 10px; }
  .ry-cld-bottom-title { font-size: 14px; }
  .ry-cld-bottom-desc { font-size: 13px; margin-bottom: 10px; }
  .ry-cld-bottom-btn { font-size: 13px; padding: 10px 14px; width: 100%; justify-content: center; box-sizing: border-box; }
  .ry-cld-bottom-btn-row { flex-direction: column; gap: 8px; }
}
@media (max-width: 380px) {
  .ry-cld-banner { padding: 12px 10px; }
  .ry-cld-banner-title { font-size: 14px; }
  .ry-cld-btn { font-size: 12px; padding: 9px 10px; }
  .ry-cld-bottom-btn { font-size: 12px; padding: 9px 10px; }
}
</style>
<div class="ry-cld-banner">
    <div class="ry-cld-banner-head">
        <span style="font-size: 22px;">⚠️</span>
        <strong class="ry-cld-banner-title">Adi Kailash Yatra 2026 — Current Status</strong>
    </div>
    <p class="ry-cld-banner-desc">
        The route was <strong style="color: #f87171;">suspended during monsoon season</strong> and is expected to reopen around <strong style="color: #fbbf24;">September 15, 2026</strong>. ILP permits from the Dharchula SDM Office will resume from that date. Always confirm with a local operator before setting out.
    </p>
    <div class="ry-cld-btn-row">
        <a href="https://wa.me/917617617651?text=Namaste!%20I%20want%20to%20confirm%20current%20Adi%20Kailash%20Yatra%20status%20and%20ILP%20issuance.%20Please%20share%20the%20latest%20update." target="_blank" rel="noopener" class="ry-cld-btn wa">
            <i class="fa-brands fa-whatsapp"></i> Check Live Status on WhatsApp
        </a>
        <a href="/blog/adi-kailash-yatra-2026-latest-status-monsoon-suspensions-reopening-updates" class="ry-cld-btn info">
            <i class="fa-solid fa-circle-info"></i> Full 2026 Status Update
        </a>
    </div>
</div>

<div class="ry-cld-nav">
    <strong>📚 Related Guides</strong>
    <div class="ry-cld-nav-pills">
        <a href="/blog/inner-line-permit-adi-kailash-2026-guide" class="ry-cld-nav-pill">📋 ILP Permit Step-by-Step Guide</a>
        <a href="/blog/5-things-you-need-to-do-before-planning-a-trip-to-adi-kailash" class="ry-cld-nav-pill">✅ Pre-Trip Checklist</a>
        <a href="/blog/adi-kailash-packing-list-essential-guide-for-yatris" class="ry-cld-nav-pill">🎒 Packing List Guide</a>
        <a href="/blog/adi-kailash-yatra-difficulty-level-can-beginners-do-it" class="ry-cld-nav-pill">⛰️ Difficulty Level</a>
        <a href="/adi-kailash" class="ry-cld-nav-pill">🏔️ View Tour Packages</a>
    </div>
</div>`;

            const closedYatraCtaBottom = `
<div class="ry-cld-bottom">
    <p class="ry-cld-bottom-title">📞 Confirm Yatra Status Before You Travel</p>
    <p class="ry-cld-bottom-desc">
        Rudraansh Yatra is based in <strong>Pithoragarh</strong> — we track Adi Kailash route status, SDM office ILP issuance dates, and Byas Valley road conditions daily. Call or WhatsApp before booking transport or taking leave — we'll tell you the ground reality, not what you want to hear.
    </p>
    <div class="ry-cld-bottom-btn-row">
        <a href="https://wa.me/917617617651?text=Namaste!%20Is%20the%20Adi%20Kailash%20Yatra%20open%20right%20now%3F%20Can%20I%20get%20an%20ILP%20from%20Dharchula%20SDM%20Office%20today%3F" target="_blank" rel="noopener" class="ry-cld-bottom-btn wa">
            <i class="fa-brands fa-whatsapp"></i> WhatsApp for Live Status
        </a>
        <a href="tel:+917617617651" class="ry-cld-bottom-btn call">
            <i class="fa-solid fa-phone"></i> Call +91 76176 17651
        </a>
    </div>
    <p class="ry-cld-also">Also read: <a href="/blog/adi-kailash-yatra-2026-suspended-due-to-weather-official-reopening-date">Official Suspension & Sep 15 Reopening Notice</a> · <a href="/blog/adi-kailash-yatra-for-solo-female-travellers-safety-guide">Solo Female Travellers Safety Guide</a></p>
</div>`;

            const cleanedContent = paragraphsHtml
                .replace(/<p class="blog-text"><!--StartFragment--><h1[^>]*>.*?<\/h1><\/p>/gs, '')
                .replace(/<!--EndFragment-->/g, '')
                .replace(/ class="font-claude-response-body[^"]*"/g, '')
                .replace(/ class="text-text-100[^"]*"/g, '')
                .replace(/ dir="ltr"/g, '')
                .replace(/<h1[^>]*>.*?<\/h1>/gs, '')
                // Inline interlinks
                .replace(
                    /Inner Line Permit(?! \(ILP\) is mandatory)/,
                    '<a href="/blog/inner-line-permit-adi-kailash-2026-guide" style="color: #7c3aed; text-decoration: underline;">Inner Line Permit</a>'
                )
                .replace(
                    /permits and packing lists/,
                    '<a href="/blog/5-things-you-need-to-do-before-planning-a-trip-to-adi-kailash" style="color: #7c3aed; text-decoration: underline;">permits</a> and <a href="/blog/adi-kailash-packing-list-essential-guide-for-yatris" style="color: #7c3aed; text-decoration: underline;">packing lists</a>'
                )
                .replace(
                    /reach out to Rudraansh Yatra to confirm current route status/,
                    'reach out to Rudraansh Yatra to confirm current route status (see also: <a href="/blog/adi-kailash-yatra-2026-latest-status-monsoon-suspensions-reopening-updates" style="color: #7c3aed; text-decoration: underline;">full 2026 status update</a>)'
                );

            contentHtml = closedYatraCTA + cleanedContent + closedYatraCtaBottom;
        }

        // ── SEO for solo female travellers blog ──
        if (slug === 'adi-kailash-yatra-for-solo-female-travellers-safety-guide') {
            parikramaMetaOverride = {
                title: 'Adi Kailash Yatra for Solo Female Travellers | Safety Guide 2026',
                desc: 'Is Adi Kailash Yatra safe for women travelling alone? Honest safety guide: ITBP checkpoints, solo-friendly group departures, ILP permits, packing tips & accommodation for solo female travellers in Uttarakhand.',
                dateModified: '2026-08-08T00:00:00+05:30'
            };

            extraSchemas = `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Is the Adi Kailash Yatra safe for women travelling alone?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, generally. The route runs through a monitored border security zone with ITBP checkpoints at multiple points between Dharchula and Gunji, which adds accountability. Every traveller's permit is checked and movement is logged. The main challenges are logistical — limited mobile network coverage beyond Dharchula and basic shared accommodation — rather than personal safety in the conventional sense."
          }
        },
        {
          "@type": "Question",
          "name": "Should solo female travellers join a group departure for Adi Kailash Yatra?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "It is strongly recommended. Group departures give solo travellers companionship and shared logistics (transport, meals, guide support) while still allowing them to travel independently of family or friends. Rudraansh Yatra offers group departures from Pithoragarh throughout the season."
          }
        },
        {
          "@type": "Question",
          "name": "Is mobile network available for solo women on the Adi Kailash route?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. Network becomes patchy or unavailable beyond Dharchula in several stretches of the Adi Kailash route. It is important to share your day-by-day itinerary and guide's contact number with a family member or friend before losing signal at Dharchula."
          }
        },
        {
          "@type": "Question",
          "name": "What kind of accommodation should solo women expect on the Adi Kailash Yatra?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Basic guesthouses with shared bathroom facilities in Gunji and Jyolingkong, most days. Comfort levels drop as you move deeper into Byas Valley. Rudraansh Yatra arranges female-only bathing facilities on select group departures — currently 30 September, 12 October, and 15 October 2026."
          }
        },
        {
          "@type": "Question",
          "name": "Does the Adi Kailash Yatra require an Inner Line Permit (ILP) for solo female travellers?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, an Inner Line Permit (ILP) is mandatory for all travellers — male or female — heading to Gunji and beyond. It is issued by the SDM Office in Dharchula. Documents required include a valid government photo ID (Aadhaar/Passport) and a medical fitness certificate. Rudraansh Yatra assists with ILP documentation for all their bookings."
          }
        },
        {
          "@type": "Question",
          "name": "How do I choose a trustworthy operator for a solo Adi Kailash trip as a woman?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Look for a locally based, registered operator — MSME or NIDHI certification is a good indicator. Ask specific questions about guide experience with solo female travellers, confirm sleeping arrangements before booking, and ask whether there will be other women on your departure. A Pithoragarh-based operator who knows the guesthouse owners personally is far more reliable than a Delhi-based reseller."
          }
        }
      ]
    }
    </script>`;

            const soloCTABanner = `
<style>
.ry-slo-banner { background: linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 100%); border: 2px solid #d4af37; border-radius: 14px; padding: 22px 24px; margin: 0 0 32px 0; color: #ffffff; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
.ry-slo-banner-head { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }
.ry-slo-banner-title { color: #fbbf24; font-size: 18px; font-weight: 700; line-height: 1.3; }
.ry-slo-banner-desc { font-size: 14.5px; line-height: 1.65; color: #e2e8f0; margin-bottom: 14px; }
.ry-slo-badge { background: rgba(212,175,55,0.1); border-left: 3px solid #d4af37; padding: 10px 14px; border-radius: 4px; margin-bottom: 16px; font-size: 13.5px; color: #fde68a; }
.ry-slo-btn-row { display: flex; gap: 10px; flex-wrap: wrap; }
.ry-slo-btn { padding: 11px 20px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 13.5px; display: inline-flex; align-items: center; gap: 8px; }
.ry-slo-btn.wa { background: #22c55e; color: #ffffff; box-shadow: 0 4px 14px rgba(34,197,94,0.35); }
.ry-slo-btn.pk { background: #d4af37; color: #0f172a; box-shadow: 0 4px 14px rgba(212,175,55,0.35); }
.ry-slo-nav { background: rgba(15,23,42,0.5); border: 1px solid rgba(212,175,55,0.25); border-radius: 10px; padding: 14px 16px; margin-bottom: 28px; font-size: 13.5px; color: #cbd5e1; }
.ry-slo-nav strong { color: #fbbf24; display: block; margin-bottom: 8px; }
.ry-slo-nav-pills { display: flex; flex-wrap: wrap; gap: 7px; }
.ry-slo-nav-pill { color: #93c5fd; text-decoration: none; background: rgba(147,197,253,0.1); padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(147,197,253,0.2); white-space: nowrap; }
.ry-slo-bottom { background: #0f172a; border: 2px dashed rgba(212,175,55,0.5); border-radius: 12px; padding: 20px 22px; margin: 32px 0 8px 0; color: #ffffff; }
.ry-slo-bottom-title { font-size: 15px; font-weight: 700; color: #fbbf24; margin-bottom: 8px; }
.ry-slo-bottom-desc { font-size: 14px; color: #e2e8f0; line-height: 1.6; margin-bottom: 14px; }
.ry-slo-bottom-btn-row { display: flex; gap: 10px; flex-wrap: wrap; font-size: 13.5px; }
.ry-slo-bottom-btn { padding: 9px 18px; border-radius: 6px; text-decoration: none; font-weight: 700; display: inline-flex; align-items: center; gap: 7px; }
.ry-slo-bottom-btn.wa { background: #22c55e; color: #fff; }
.ry-slo-bottom-btn.call { background: transparent; border: 1.5px solid #d4af37; color: #d4af37; }
.ry-slo-also { margin-top: 14px; font-size: 13px; color: #94a3b8; }
.ry-slo-also a { color: #93c5fd; }
@media (max-width: 680px) {
  .ry-slo-banner { padding: 16px 14px; border-radius: 10px; margin-bottom: 20px; }
  .ry-slo-banner-title { font-size: 15px; }
  .ry-slo-banner-desc { font-size: 13.5px; margin-bottom: 12px; }
  .ry-slo-badge { padding: 8px 10px; font-size: 12px; margin-bottom: 12px; }
  .ry-slo-btn { font-size: 13px; padding: 10px 14px; width: 100%; justify-content: center; box-sizing: border-box; }
  .ry-slo-btn-row { flex-direction: column; gap: 8px; }
  .ry-slo-nav { padding: 12px 12px; }
  .ry-slo-nav-pill { font-size: 12px; padding: 3px 8px; }
  .ry-slo-bottom { padding: 16px 14px; border-radius: 10px; }
  .ry-slo-bottom-title { font-size: 14px; }
  .ry-slo-bottom-desc { font-size: 13px; margin-bottom: 10px; }
  .ry-slo-bottom-btn { font-size: 13px; padding: 10px 14px; width: 100%; justify-content: center; box-sizing: border-box; }
  .ry-slo-bottom-btn-row { flex-direction: column; gap: 8px; }
}
@media (max-width: 380px) {
  .ry-slo-banner { padding: 12px 10px; }
  .ry-slo-banner-title { font-size: 14px; }
  .ry-slo-btn { font-size: 12px; padding: 9px 10px; }
  .ry-slo-bottom-btn { font-size: 12px; padding: 9px 10px; }
}
</style>
<div class="ry-slo-banner">
    <div class="ry-slo-banner-head">
        <span style="font-size: 26px;">🏔️</span>
        <strong class="ry-slo-banner-title">Planning the Adi Kailash Yatra as a Solo Woman?</strong>
    </div>
    <p class="ry-slo-banner-desc">
        Rudraansh Yatra is a <strong>NIDHI-certified, Pithoragarh-based ground operator</strong> that has personally guided <strong>solo women travellers</strong> through the Adi Kailash route. We handle <strong>ILP permits</strong>, group departures with women-friendly facilities, and <strong>4×4 transfers from Dharchula to Gunji</strong>.
    </p>
    <div class="ry-slo-badge">
        🗓️ <strong>Female-friendly group departures with separate bathing facilities:</strong> 30 Sep · 12 Oct · 15 Oct 2026
    </div>
    <div class="ry-slo-btn-row">
        <a href="https://wa.me/917617617651?text=Namaste!%20I%20am%20a%20solo%20female%20traveller%20interested%20in%20the%20Adi%20Kailash%20Yatra.%20Can%20you%20share%20group%20departure%20dates%20and%20details%3F" target="_blank" rel="noopener" class="ry-slo-btn wa">
            <i class="fa-brands fa-whatsapp" style="font-size: 17px;"></i> WhatsApp for Group Dates
        </a>
        <a href="/adi-kailash" class="ry-slo-btn pk">
            <i class="fa-solid fa-mountain" style="font-size: 14px;"></i> View Full Yatra Package
        </a>
    </div>
</div>

<div class="ry-slo-nav">
    <strong>📚 Quick Navigation</strong>
    <div class="ry-slo-nav-pills">
        <a href="/blog/inner-line-permit-adi-kailash-2026-guide" class="ry-slo-nav-pill">📋 ILP Permit Guide</a>
        <a href="/blog/adi-kailash-packing-list-essential-guide-for-yatris" class="ry-slo-nav-pill">🎒 Packing List</a>
        <a href="/blog/adi-kailash-yatra-difficulty-level-can-beginners-do-it" class="ry-slo-nav-pill">⛰️ Difficulty Level</a>
        <a href="/blog/adi-kailash-yatra-2026-latest-status-monsoon-suspensions-reopening-updates" class="ry-slo-nav-pill">📅 2026 Yatra Status</a>
        <a href="/blog/5-things-you-need-to-do-before-planning-a-trip-to-adi-kailash" class="ry-slo-nav-pill">✅ Pre-Trip Checklist</a>
    </div>
</div>`;

            // Build enriched content with interlinking inside the article body
            const interlinkedContent = paragraphsHtml
                // Clean raw editor artifacts
                .replace(/<p class="blog-text"><!--StartFragment--><h1[^>]*>.*?<\/h1><\/p>/gs, '')
                .replace(/<!--EndFragment-->/g, '')
                .replace(/ class="font-claude-response-body[^"]*"/g, '')
                .replace(/ class="text-text-100[^"]*"/g, '')
                .replace(/ dir="ltr"/g, '')
                .replace(/<h1[^>]*>.*?<\/h1>/gs, '')
                // Inline interlinking: ILP
                .replace(
                    /Inner Line Permit(?!.*<a )/,
                    '<a href="/blog/inner-line-permit-adi-kailash-2026-guide" style="color: #7c3aed; text-decoration: underline;">Inner Line Permit</a>'
                )
                // Inline interlinking: packing
                .replace(
                    /carry a small door latch/,
                    'carry a small door latch (see our <a href="/blog/adi-kailash-packing-list-essential-guide-for-yatris" style="color: #7c3aed; text-decoration: underline;">complete Adi Kailash packing list</a>)'
                )
                // Inline interlinking: difficulty / beginners
                .replace(
                    /altitude symptoms just to keep pace/,
                    'altitude symptoms just to keep pace (read our <a href="/blog/adi-kailash-yatra-difficulty-level-can-beginners-do-it" style="color: #7c3aed; text-decoration: underline;">difficulty level guide</a>)'
                );

            const soloCtaBottom = `
<div class="ry-slo-bottom">
    <p class="ry-slo-bottom-title">💬 Still Have Questions?</p>
    <p class="ry-slo-bottom-desc">
        Call or WhatsApp <strong>Dheerendra Rautela</strong> at Rudraansh Yatra directly — we're based in Pithoragarh and answer every question honestly, including the ones you might feel awkward asking a city-based agent.
    </p>
    <div class="ry-slo-bottom-btn-row">
        <a href="https://wa.me/917617617651?text=Namaste!%20I%20am%20a%20solo%20female%20traveller%20planning%20Adi%20Kailash%20Yatra.%20Please%20guide%20me%20on%20group%20departures%20and%20ILP%20process." target="_blank" rel="noopener" class="ry-slo-bottom-btn wa">
            <i class="fa-brands fa-whatsapp"></i> Chat on WhatsApp
        </a>
        <a href="tel:+917617617651" class="ry-slo-bottom-btn call">
            <i class="fa-solid fa-phone"></i> Call +91 76176 17651
        </a>
    </div>
    <p class="ry-slo-also">Also read: <a href="/blog/is-adi-kailash-yatra-safe-for-senior-citizens-guide">Is Adi Kailash Yatra Safe for Senior Citizens?</a> · <a href="/blog/adi-kailash-yatra-2026-latest-status-monsoon-suspensions-reopening-updates">2026 Yatra Status & Reopening</a></p>
</div>`;

            contentHtml = soloCTABanner + interlinkedContent + soloCtaBottom;
        }


        // Generic template variable replacements
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
            .replace(/{{CONTENT}}/g, contentHtml + extraSchemas)
            .replace(/{{ADJACENT_BLOGS}}/g, adjacentBlogsHtml)
            .replace(/{{SLUG}}/g, `/blog/${blog.slug}`)
            .replace(/{{CREATED_AT}}/g, blog.created_at)
            .replace(/{{UPDATED_AT}}/g, blog.updated_at || blog.created_at);

        // ── Apply parikrama-specific meta & H1 overrides AFTER generic replacements ──
        if (parikramaMetaOverride) {
            blogHtml = blogHtml
                .replace(/<title>[^<]*<\/title>/, `<title>${parikramaMetaOverride.title}</title>`)
                .replace(/(<h1 class="blog-detail-title">)[^<]*(<\/h1>)/, `$1${parikramaMetaOverride.title}$2`)
                .replace(/(<meta name="description" content=")[^"]*(")/, `$1${parikramaMetaOverride.desc.replace(/"/g, '&quot;')}$2`)
                .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${parikramaMetaOverride.title.replace(/"/g, '&quot;')}$2`)
                .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${parikramaMetaOverride.title.replace(/"/g, '&quot;')}$2`)
                .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${parikramaMetaOverride.desc.replace(/"/g, '&quot;')}$2`)
                .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${parikramaMetaOverride.desc.replace(/"/g, '&quot;')}$2`)
                .replace(/(<meta property="article:modified_time" content=")[^"]*(")/, `$1${parikramaMetaOverride.dateModified}$2`);
        }

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

// Health & Status check endpoints
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Rudraansh Yatra API Server is live and healthy', timestamp: new Date().toISOString() });
});

app.get('/api/status', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
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
    const { username, passcode } = req.body || {};
    if (!username || !passcode) {
        return res.status(400).json({ error: 'Username and passcode are required' });
    }

    const cleanUsername = (username || '').toString().trim().toLowerCase();
    const cleanPasscode = (passcode || '').toString().trim();
    const rawPasscode = (passcode || '').toString();

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
        const storedPass = (userRecord.passcode || '').toString();

        if (storedPass.startsWith('$2a$') || storedPass.startsWith('$2b$')) {
            isMatch = (await bcrypt.compare(cleanPasscode, storedPass)) || (await bcrypt.compare(rawPasscode, storedPass));
        } else {
            isMatch = (cleanPasscode === storedPass) ||
                      (cleanPasscode === storedPass.trim()) ||
                      (cleanPasscode.toLowerCase() === storedPass.toLowerCase()) ||
                      (cleanPasscode.toLowerCase() === storedPass.trim().toLowerCase()) ||
                      (rawPasscode === storedPass) ||
                      (rawPasscode === storedPass.trim());
        }

        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid Username or Passcode.' });
        }

        const userPayload = {
            id: userRecord.id,
            username: userRecord.username,
            role: userRecord.role || 'staff',
            uuid_mapping: userRecord.uuid_mapping || ''
        };
        const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });

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

// Create Website Inquiry Lead from Public page (saves directly to LEADS table)
app.post('/api/bookings', async (req, res) => {
    const { packageName, name, phone, date, travelers, message } = req.body;
    if (!name || !phone) {
        return res.status(400).json({ error: 'Name and Phone are required' });
    }
    try {
        if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized' });

        const cleanName = name.trim();
        const cleanPhone = phone.trim();
        const cleanEmail = (req.body.email || '').trim();
        const cleanDate = date || null;
        const cleanTravelers = travelers ? (parseInt(travelers) || 1) : 1;

        let remarksContent = '';
        if (packageName) {
            remarksContent += `Package: ${packageName}`;
        }
        if (message && message.trim()) {
            if (remarksContent) remarksContent += ' | ';
            remarksContent += `Special Notes: ${message.trim()}`;
        }

        // Permanent deduplication: suppress if a lead with the same phone already exists
        if (cleanPhone) {
            const normalizePhone = (p) => (p || '').replace(/\D/g, '').replace(/^0+/, '').slice(-10);
            const normPhone = normalizePhone(cleanPhone);
            if (normPhone.length >= 7) {
                const { data: existing } = await supabase
                    .from('leads')
                    .select('id, phone')
                    .limit(5000);
                const isDup = (existing || []).some(l => normalizePhone(l.phone) === normPhone);
                if (isDup) {
                    const match = (existing || []).find(l => normalizePhone(l.phone) === normPhone);
                    console.log('Duplicate website lead suppressed (existing phone):', match ? match.id : '?');
                    return res.status(200).json({ success: true, lead_id: match ? match.id : null, duplicate: true });
                }
            }
        }

        const leadData = {
            name: cleanName,
            phone: cleanPhone,
            email: cleanEmail,
            source: 'Website Inquiry',
            status: 'NEW',
            assigned_to: null,
            remarks: remarksContent,
            travel_date: cleanDate,
            travelers: cleanTravelers,
            created_at: new Date().toISOString()
        };

        const { data: newLead, error } = await supabase.from('leads').insert([leadData]).select('id').single();
        if (error) throw error;
        res.status(201).json({ success: true, lead_id: newLead ? newLead.id : null });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Custom Requests from Wizard
app.post('/api/custom-requests', async (req, res) => {
    try {
        if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized' });
        const requestData = Array.isArray(req.body) ? req.body : [req.body];
        const { error } = await supabase
            .from('custom_requests')
            .insert(requestData);
        if (error) throw error;

        // Also insert into leads table so it appears in Leads Manager (with dedup)
        const normPhoneFn = (p) => (p || '').replace(/\D/g, '').replace(/^0+/, '').slice(-10);
        let existingPhonesForWizard = new Set();
        try {
            const { data: allLeads } = await supabase.from('leads').select('phone').limit(5000);
            (allLeads || []).forEach(l => { const n = normPhoneFn(l.phone); if (n.length >= 7) existingPhonesForWizard.add(n); });
        } catch(e) {}
        for (const item of requestData) {
            if (item.name || item.phone) {
                const normPhone = normPhoneFn(item.phone || '');
                if (normPhone.length >= 7 && existingPhonesForWizard.has(normPhone)) {
                    console.log('Custom request lead deduped (existing phone):', normPhone);
                    continue;
                }
                const remarksStr = `Destination: ${item.destination || 'Custom'} | Duration: ${item.days || 6} days | Notes: ${item.requests || ''}`;
                await supabase.from('leads').insert([{
                    name: (item.name || 'Website Visitor').trim(),
                    phone: (item.phone || '').trim(),
                    email: (item.email || '').trim(),
                    source: 'Website Custom Trip Wizard',
                    status: 'NEW',
                    remarks: remarksStr,
                    created_at: new Date().toISOString()
                }]);
                if (normPhone.length >= 7) existingPhonesForWizard.add(normPhone);
            }
        }

        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Discount Registrations
app.post('/api/discount-registrations', async (req, res) => {
    try {
        if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized' });
        const regData = Array.isArray(req.body) ? req.body : [req.body];
        const { error } = await supabase
            .from('discount_registrations')
            .insert(regData);
        if (error) throw error;

        // Also insert into leads table so it appears in Leads Manager (with dedup)
        const normDiscountFn = (p) => (p || '').replace(/\D/g, '').replace(/^0+/, '').slice(-10);
        let existingPhonesForDiscount = new Set();
        try {
            const { data: allLeads2 } = await supabase.from('leads').select('phone').limit(5000);
            (allLeads2 || []).forEach(l => { const n = normDiscountFn(l.phone); if (n.length >= 7) existingPhonesForDiscount.add(n); });
        } catch(e) {}
        for (const item of regData) {
            if (item.name || item.phone) {
                const normPhone = normDiscountFn(item.phone || '');
                if (normPhone.length >= 7 && existingPhonesForDiscount.has(normPhone)) {
                    console.log('Discount reg lead deduped (existing phone):', normPhone);
                    continue;
                }
                await supabase.from('leads').insert([{
                    name: (item.name || 'Website Visitor').trim(),
                    phone: (item.phone || '').trim(),
                    email: (item.email || '').trim(),
                    source: 'Website Discount Popup',
                    status: 'NEW',
                    remarks: `Discount Code: ${item.discount_code || ''}`,
                    created_at: new Date().toISOString()
                }]);
                if (normPhone.length >= 7) existingPhonesForDiscount.add(normPhone);
            }
        }

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
        let query = supabase
            .from('lead_history')
            .select('*')
            .order('created_at', { ascending: false });

        if (req.query.lead_id) {
            query = query.eq('lead_id', req.query.lead_id);
        } else {
            query = query.limit(1000);
        }

        const { data, error } = await query;
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
        let allLeads = [];
        let page = 0;
        const PG_SIZE = 1000;
        const MAX_PAGES = 5; // Cap at 5000 leads to guarantee fast sub-second execution & prevent 504 timeouts
        while (page < MAX_PAGES) {
            let query = supabase.from('leads').select('*');
            if (req.user.role === 'staff') {
                const agentUuid = req.user.uuid_mapping;
                if (agentUuid) {
                    query = query.eq('assigned_to', agentUuid);
                }
            }
            const { data, error } = await query
                .order('created_at', { ascending: false })
                .range(page * PG_SIZE, (page + 1) * PG_SIZE - 1);
            if (error) throw error;
            if (!data || data.length === 0) break;
            allLeads = allLeads.concat(data);
            if (data.length < PG_SIZE) break;
            page++;
        }
        res.json(allLeads || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/leads/:id', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabase.from('leads').select('*').eq('id', req.params.id).single();
        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Lead not found' });
        if (req.user.role === 'staff' && data.assigned_to && req.user.uuid_mapping && data.assigned_to !== req.user.uuid_mapping) {
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
            if (lead && lead.assigned_to && req.user.uuid_mapping && lead.assigned_to !== req.user.uuid_mapping) {
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
                const { error: insErr } = await supabase.from('reminders').insert([newItem]);
                if (insErr) console.warn('Supabase reminders insert failed, saving locally:', insErr.message);
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
                const { error: hErr } = await supabase.from('lead_history').insert([{
                    lead_id: newItem.lead_id,
                    action: `⏰ Follow-up Reminder set for ${newItem.due_date} ${newItem.due_time}: "${newItem.note}" by ${req.user.username}`
                }]);
                if (hErr) console.warn('History log for reminder failed:', hErr.message);
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
                const { error: updErr } = await supabase.from('reminders').update(updates).eq('id', id);
                if (updErr) console.warn('Supabase reminders update failed:', updErr.message);
            } catch (e) {}
        }

        const list = getLocalReminders();
        const index = list.findIndex(r => r.id === id || r.id == id);
        if (index !== -1) {
            list[index] = { ...list[index], ...updates };
            saveLocalReminders(list);

            if (updates.status === 'Completed' && list[index].lead_id && supabase) {
                try {
                    const { error: hErr } = await supabase.from('lead_history').insert([{
                        lead_id: list[index].lead_id,
                        action: `✅ Follow-up Reminder completed: "${list[index].note}" by ${req.user.username}`
                    }]);
                    if (hErr) console.warn('History log for reminder completion failed:', hErr.message);
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
                const { error: delErr } = await supabase.from('reminders').delete().eq('id', id);
                if (delErr) console.warn('Supabase reminders delete failed:', delErr.message);
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
        if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized' });
        const { data, error } = await supabase.from('blogs').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/blogs', authenticateToken, async (req, res) => {
    try {
        if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized' });
        const blogsToInsert = Array.isArray(req.body) ? req.body : [req.body];
        const { data, error } = await supabase.from('blogs').insert(blogsToInsert).select();
        if (error) throw error;
        res.status(201).json(data || { success: true });
        // Ping Bing/ChatGPT IndexNow for instant indexing of newly published blog(s)
        if (data && data.length > 0) {
            const urls = data
                .filter(b => b.slug)
                .map(b => `https://rudraanshyatra.com/blog/${b.slug}`);
            if (urls.length > 0) {
                urls.push('https://rudraanshyatra.com/blog.html');
                urls.push('https://rudraanshyatra.com/blogs.html');
                pingIndexNow(urls).catch(() => {});
            }
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/blogs/:id', authenticateToken, async (req, res) => {
    try {
        if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized' });
        const { data, error } = await supabase.from('blogs').update(req.body).eq('id', req.params.id).select();
        if (error) throw error;
        res.json(data || { success: true });
        // Ping Bing/ChatGPT IndexNow for instant re-indexing of updated blog
        if (data && data.length > 0 && data[0].slug) {
            pingIndexNow([
                `https://rudraanshyatra.com/blog/${data[0].slug}`,
                'https://rudraanshyatra.com/blog.html',
                'https://rudraanshyatra.com/blogs.html'
            ]).catch(() => {});
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/blogs/:id', authenticateToken, async (req, res) => {
    try {
        if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized' });
        const { error } = await supabase.from('blogs').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Gallery CRUD
app.get('/api/admin/gallery', authenticateToken, async (req, res) => {
    try {
        if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized' });
        const { data, error } = await supabase.from('gallery').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/admin/gallery', authenticateToken, async (req, res) => {
    try {
        if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized' });
        const itemsToInsert = Array.isArray(req.body) ? req.body : [req.body];
        const { data, error } = await supabase.from('gallery').insert(itemsToInsert).select();
        if (error) throw error;
        res.status(201).json(data || { success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/gallery/:id', authenticateToken, async (req, res) => {
    try {
        if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized' });
        const { data, error } = await supabase.from('gallery').update(req.body).eq('id', req.params.id).select();
        if (error) throw error;
        res.json(data || { success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/gallery/:id', authenticateToken, async (req, res) => {
    try {
        if (!supabase) return res.status(500).json({ error: 'Supabase client not initialized' });
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
app.get('/api/admin/credentials', authenticateToken, async (req, res) => {
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
        const db = getSupabase();
        if (!db) {
            return res.status(500).send('Supabase client not initialized');
        }

        const billId = req.params.id;
        const { data: bill, error } = await db
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
           .text(`Phone: ${bill.customer_phone || 'N/A'}`, gutter + 14, afterNameY, { width: halfW - 20 });
        doc.text(`Email: ${bill.customer_email || 'N/A'}`, gutter + 14, doc.y + 2, { width: halfW - 20 });

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

        const discount = parseFloat(bill.discount || 0);
        const gross = parseFloat(bill.total_package_amount || 0);
        const netAmount = Math.max(0, gross - discount);
        const payments = bill.payments_received || [];
        const totalPaid = payments.length > 0 
            ? payments.reduce((sum, p) => sum + (parseFloat(p.amountPaid) || 0), 0)
            : Math.max(0, netAmount - parseFloat(bill.balance_remaining || 0));

        res.json({
            id: bill.id,
            booking_id: bill.booking_id,
            customer_name: bill.customer_name,
            customer_phone: bill.customer_phone,
            customer_email: bill.customer_email,
            group_size: bill.group_size,
            tour_start_date: bill.tour_start_date,
            package_name: bill.package_name,
            total_package_amount: gross,
            discount: discount,
            net_package_amount: netAmount,
            balance_remaining: parseFloat(bill.balance_remaining),
            payment_status: bill.payment_status,
            total_paid: totalPaid
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
        const discount = parseFloat(bill.discount || 0);
        const netAmount = Math.max(0, parseFloat(bill.total_package_amount || 0) - discount);
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
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours — auto-refreshes live rating/count

app.get('/api/google-reviews', async (req, res) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const placeId = process.env.GOOGLE_PLACE_ID || 'ChIJUaOjOEsloTkRjOLS3RK_S_A';
    const now = Date.now();

    const forceRefresh = req.query.refresh === 'true' || req.query.refresh === '1';

    if (!forceRefresh && googleReviewsCache.data && (now - googleReviewsCache.timestamp < CACHE_DURATION)) {
        return res.json(googleReviewsCache.data);
    }

    const fallbackReviews = {
        rating: 5.0,
        user_ratings_total: 34,
        reviews: [
            {
                author_name: "Ajit Garg",
                profile_photo_url: "",
                rating: 5,
                text: "I have gone to Kailash Mansarovar Yatra with other three female family members in a conducted tour by Rudraansh Yatra from 22 Aug to 1st September. It was really an amazing trip, Lord shiv...",
                relative_time_description: "Meerut",
                photos: [
                    "assets/images/om-parvat-group.webp?v=2",
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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        const json = await response.json();

        if (json.status === 'OK' && json.result) {
            const resultData = {
                rating: json.result.rating || 5.0,
                user_ratings_total: json.result.user_ratings_total || 34,
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

// Force-refresh Google Reviews cache
// Call GET or POST /api/google-reviews/refresh to bust the cache and fetch fresh data
app.all('/api/google-reviews/refresh', (req, res) => {
    googleReviewsCache = { data: null, timestamp: 0 };
    console.log('[Google Reviews] Cache cleared — next request will fetch live data from Google Places API');
    res.json({ success: true, message: 'Cache cleared. Homepage will now fetch fresh live Google rating and reviews.' });
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

// ── Google Sheets Meta Leads Automated Sync ─────────────────────────────────────
const GOOGLE_SHEET_LEADS_URL = process.env.GOOGLE_SHEET_LEADS_URL || 'https://docs.google.com/spreadsheets/d/199vP8Q-QYvbzVUTV-L_RexABWoOSWB6QzFMD8ez0iD0/export?format=csv';

async function syncGoogleSheetLeads() {
    try {
        if (!supabase) {
            console.error('[Google Sheet Sync] Supabase client not initialized.');
            return { success: false, message: 'Supabase client not initialized' };
        }

        console.log('[Google Sheet Sync] Fetching Google Sheet CSV...');
        const sheetController = new AbortController();
        const sheetTimeout = setTimeout(() => sheetController.abort(), 10000); // 10s timeout
        const response = await fetch(GOOGLE_SHEET_LEADS_URL, { signal: sheetController.signal });
        clearTimeout(sheetTimeout);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const text = await response.text();

        const parseCSV = (csvText) => {
            const lines = csvText.split(/\r?\n/);
            if (lines.length < 2) return [];
            
            const parseLine = (line) => {
                const cols = [];
                let inside = false;
                let cur = '';
                for (let i = 0; i < line.length; i++) {
                    const c = line[i];
                    if (c === '"') inside = !inside;
                    else if (c === ',' && !inside) {
                        cols.push(cur.trim().replace(/^"|"$/g, ''));
                        cur = '';
                    } else cur += c;
                }
                cols.push(cur.trim().replace(/^"|"$/g, ''));
                return cols;
            };
            
            const headers = parseLine(lines[0]).map(h => h.toLowerCase());
            const rows = [];
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const cols = parseLine(lines[i]);
                const obj = {};
                headers.forEach((h, idx) => { obj[h] = cols[idx] || ''; });
                rows.push(obj);
            }
            return rows;
        };

        const rows = parseCSV(text);
        if (rows.length === 0) {
            return { success: true, newLeadsCount: 0, totalSheetRows: 0, duplicateCount: 0 };
        }

        const normalizePhone = (p) => (p || '').replace(/\D/g, '').replace(/^0+/, '').slice(-10);

        // ── PAGINATED fetch of ALL existing leads for comprehensive deduplication ──
        const existingPhones = new Set();
        const existingEmails = new Set();
        const existingNameKeys = new Set();

        let page = 0;
        const PAGE_SIZE = 1000;
        while (true) {
            const { data: leadPage, error: fetchErr } = await supabase
                .from('leads')
                .select('name, phone, email')
                .order('id', { ascending: true })
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
            if (fetchErr) throw fetchErr;
            if (!leadPage || leadPage.length === 0) break;
            leadPage.forEach(l => {
                const norm = normalizePhone(l.phone);
                if (norm.length >= 7) existingPhones.add(norm);
                
                const em = (l.email || '').trim().toLowerCase();
                if (em && !em.includes('test@') && !em.includes('dummy')) existingEmails.add(em);

                const nm = (l.name || '').trim().toLowerCase();
                if (nm) {
                    if (em) existingNameKeys.add(`${nm}:::${em}`);
                    if (norm.length >= 7) existingNameKeys.add(`${nm}:::${norm}`);
                    existingNameKeys.add(`name:::${nm}`);
                }
            });
            if (leadPage.length < PAGE_SIZE) break; // last page
            page++;
        }
        console.log(`[Google Sheet Sync] Loaded ${existingPhones.size} phones, ${existingEmails.size} emails, and ${existingNameKeys.size} keys from existing leads.`);

        const toInsert = [];
        const seenPhonesInSheet = new Set();
        const seenEmailsInSheet = new Set();
        const seenNameKeysInSheet = new Set();
        let duplicateCount = 0;

        for (const r of rows) {
            const name = (r.full_name || r.name || '').trim();
            if (!name) continue;

            // Skip Meta test / placeholder rows
            const emailVal = (r.email || '').toLowerCase().trim();
            if (
                name.toLowerCase().includes('test lead') ||
                name.toLowerCase().includes('dummy data') ||
                name.startsWith('<test') ||
                emailVal === 'test@meta.com' ||
                emailVal.includes('dummy')
            ) continue;

            const rawPhone = (r.phone_number || r.phone || '').replace(/^p:/i, '').trim();
            const norm = normalizePhone(rawPhone);
            const nm = name.toLowerCase();
            const nameEmailKey = emailVal ? `${nm}:::${emailVal}` : '';
            const namePhoneKey = norm.length >= 7 ? `${nm}:::${norm}` : '';
            const nameOnlyKey = `name:::${nm}`;

            let isDuplicate = false;

            // 1. Check by valid phone number (>= 7 digits)
            if (norm.length >= 7) {
                if (existingPhones.has(norm) || seenPhonesInSheet.has(norm)) {
                    isDuplicate = true;
                }
            }

            // 2. Check by valid email (if not already matched)
            if (!isDuplicate && emailVal && !emailVal.includes('test@') && !emailVal.includes('dummy')) {
                if (existingEmails.has(emailVal) || seenEmailsInSheet.has(emailVal)) {
                    isDuplicate = true;
                }
            }

            // 3. Check by Name + Email or Name + Phone or Name alone (for short/invalid phones)
            if (!isDuplicate) {
                if (nameEmailKey && (existingNameKeys.has(nameEmailKey) || seenNameKeysInSheet.has(nameEmailKey))) {
                    isDuplicate = true;
                } else if (namePhoneKey && (existingNameKeys.has(namePhoneKey) || seenNameKeysInSheet.has(namePhoneKey))) {
                    isDuplicate = true;
                } else if (norm.length < 7 && !emailVal && (existingNameKeys.has(nameOnlyKey) || seenNameKeysInSheet.has(nameOnlyKey))) {
                    isDuplicate = true;
                }
            }

            if (isDuplicate) {
                duplicateCount++;
                continue;
            }

            // Mark this sheet lead as seen
            if (norm.length >= 7) seenPhonesInSheet.add(norm);
            if (emailVal) seenEmailsInSheet.add(emailVal);
            if (nameEmailKey) seenNameKeysInSheet.add(nameEmailKey);
            if (namePhoneKey) seenNameKeysInSheet.add(namePhoneKey);
            if (nameOnlyKey) seenNameKeysInSheet.add(nameOnlyKey);

            const whenYatra = r['when_are_you_planning_your_yatra?'] || r.when_are_you_planning_your_yatra || '';
            const peopleInfo = r['how_many_people_are_planning_to_travel?'] || r.how_many_people_are_planning_to_travel || '';

            let travelersNum = 1;
            const parsedInt = parseInt(peopleInfo, 10);
            if (!isNaN(parsedInt) && parsedInt > 0) {
                travelersNum = parsedInt;
            }

            const remarksArr = [];
            if (whenYatra) remarksArr.push(`Planning: ${whenYatra}`);
            if (peopleInfo) remarksArr.push(`Travelers Info: ${peopleInfo}`);
            if (r.campaign_name) remarksArr.push(`Campaign: ${r.campaign_name}`);
            const remarks = remarksArr.join(' | ');

            toInsert.push({
                name: name,
                phone: rawPhone || 'N/A',
                email: (r.email || '').trim(),
                destination: (r.form_name || r.destination || '').trim(),
                source: 'Meta Sheet Sync',
                status: 'New',
                travelers: travelersNum,
                remarks: remarks,
                created_at: r.created_time ? new Date(r.created_time).toISOString() : new Date().toISOString()
            });
        }

        if (toInsert.length > 0) {
            const { error: insErr } = await supabase.from('leads').insert(toInsert);
            if (insErr) throw insErr;
            console.log(`[Google Sheet Sync] Successfully imported ${toInsert.length} new leads (${duplicateCount} duplicates skipped).`);
        } else {
            console.log(`[Google Sheet Sync] Check complete. No new leads to import (${duplicateCount} duplicates skipped).`);
        }

        return {
            success: true,
            newLeadsCount: toInsert.length,
            totalSheetRows: rows.length,
            duplicateCount: duplicateCount
        };
    } catch (err) {
        console.error('[Google Sheet Sync] Error syncing Google Sheet leads:', err);
        return { success: false, error: err.message };
    }
}

// Admin API Route to manually trigger Google Sheet Sync
app.post('/api/admin/sync-google-sheet-leads', authenticateToken, async (req, res) => {
    const result = await syncGoogleSheetLeads();
    if (result.success) {
        res.json(result);
    } else {
        res.status(500).json(result);
    }
});

// Generic Webhook Endpoint for Google Apps Script or Zapier push
app.post('/api/webhooks/google-sheets-lead', async (req, res) => {
    try {
        const body = req.body || {};
        console.log('[Google Sheets Webhook] Received lead payload:', body);

        const name = (body.full_name || body.name || '').trim();
        const rawPhone = (body.phone_number || body.phone || '').replace(/^p:/i, '').trim();
        const email = (body.email || '').trim().toLowerCase();
        const destination = (body.form_name || body.destination || '').trim();
        const whenYatra = body.when_are_you_planning_your_yatra || body['when_are_you_planning_your_yatra?'] || '';
        const peopleInfo = body.how_many_people_are_planning_to_travel || body['how_many_people_are_planning_to_travel?'] || '';

        if (!name && !rawPhone) {
            return res.status(400).json({ error: 'Name or phone is required' });
        }

        const normalizePhone = (p) => (p || '').replace(/\D/g, '').replace(/^0+/, '').slice(-10);
        const norm = normalizePhone(rawPhone);

        if (supabase) {
            // Paginated fetch to handle all existing leads for thorough dedup
            let allExisting = [];
            let pgOffset = 0;
            const PG_SIZE = 1000;
            while (true) {
                const { data: page } = await supabase.from('leads').select('name, phone, email').range(pgOffset, pgOffset + PG_SIZE - 1);
                if (!page || page.length === 0) break;
                allExisting = allExisting.concat(page);
                if (page.length < PG_SIZE) break;
                pgOffset += PG_SIZE;
            }

            const isDup = allExisting.some(l => {
                const existingNorm = normalizePhone(l.phone);
                if (norm.length >= 7 && existingNorm.length >= 7 && norm === existingNorm) return true;
                const existingEmail = (l.email || '').trim().toLowerCase();
                if (email && existingEmail && email === existingEmail) return true;
                const existingName = (l.name || '').trim().toLowerCase();
                if (name && existingName && name.toLowerCase() === existingName && (email === existingEmail || norm === existingNorm)) return true;
                return false;
            });

            if (isDup) {
                console.log(`[Google Sheets Webhook] Suppressed duplicate lead: ${name} (${rawPhone})`);
                return res.status(200).json({ success: true, duplicate: true, message: 'Duplicate lead suppressed' });
            }
        }

        let travelersNum = 1;
        const parsedInt = parseInt(peopleInfo, 10);
        if (!isNaN(parsedInt) && parsedInt > 0) travelersNum = parsedInt;

        const remarksArr = [];
        if (whenYatra) remarksArr.push(`Planning: ${whenYatra}`);
        if (peopleInfo) remarksArr.push(`Travelers Info: ${peopleInfo}`);
        const remarks = remarksArr.join(' | ');

        if (supabase) {
            const { data: newLead, error } = await supabase.from('leads').insert([{
                name: name || 'Meta Sheet Lead',
                phone: rawPhone || 'N/A',
                email: email || '',
                destination: destination || '',
                source: 'Meta Sheet Webhook',
                status: 'New',
                travelers: travelersNum,
                remarks: remarks,
                created_at: new Date().toISOString()
            }]).select('id').single();

            if (error) throw error;
            return res.status(201).json({ success: true, lead_id: newLead ? newLead.id : null });
        }

        res.status(200).json({ success: true });
    } catch (err) {
        console.error('[Google Sheets Webhook] Error:', err);
        res.status(500).json({ error: err.message });
    }
});


// Start background periodic Google Sheet sync every 5 minutes
// A simple lock flag prevents overlapping sync runs
let _sheetSyncRunning = false;
async function safeSync() {
    if (_sheetSyncRunning) {
        console.log('[Google Sheet Sync] Skipped — previous sync still running.');
        return;
    }
    _sheetSyncRunning = true;
    try {
        await syncGoogleSheetLeads();
    } catch (err) {
        console.error('[Google Sheet Sync Failed]:', err);
    } finally {
        _sheetSyncRunning = false;
    }
}
setTimeout(safeSync, 10000);
setInterval(safeSync, 5 * 60 * 1000);



// ── Static Asset Caching ─────────────────────────────────────────────────────
// Serve images, videos, fonts and versioned CSS/JS with 1-year immutable cache.
// These files use cache-busting query strings (e.g. style.css?v=7.1) so it is
// safe to cache them for a very long time.
app.use('/assets', (req, res, next) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Vary', 'Accept-Encoding');
    next();
}, express.static(path.join(__dirname, 'assets')));

// Serve versioned CSS and JS with long-lived caching
app.use((req, res, next) => {
    const url = req.url.split('?')[0];
    if (/\.(css|js|webp|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|mp4|webm)$/.test(url)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.setHeader('Vary', 'Accept-Encoding');
    }
    next();
});

// Global Cache-Busting Middleware: Disable caching ONLY for HTML pages and API routes
app.use((req, res, next) => {
    const url = req.url.split('?')[0];
    // Skip caching headers for static file types already handled above
    if (/\.(css|js|webp|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|mp4|webm)$/.test(url)) {
        return next();
    }
    // HTML pages: allow short CDN caching with stale-while-revalidate
    if (!url.startsWith('/api/') && !url.startsWith('/admin')) {
        res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
    } else {
        // API and admin routes: no caching
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    next();
});

// ── IndexNow Key File (Bing / ChatGPT SearchGPT instant indexing) ────────────
// Key file must be publicly accessible so Bing can verify site ownership.
app.get('/rudraanshyatra2026indexnowkey9f3a7b1c.txt', (req, res) => {
    res.type('text/plain').send('rudraanshyatra2026indexnowkey9f3a7b1c');
});

// IndexNow auto-ping function — call this after publishing/updating any page
// to push updates instantly to Bing (and therefore ChatGPT Search / SearchGPT / Yandex)
async function pingIndexNow(urls) {
    const key = process.env.INDEXNOW_KEY || 'rudraanshyatra2026indexnowkey9f3a7b1c';
    const host = 'rudraanshyatra.com';
    let urlList = Array.isArray(urls) ? urls : [urls];

    // Normalize URLs to absolute HTTPS format
    urlList = urlList.map(u => {
        if (!u) return null;
        if (typeof u !== 'string') return null;
        if (u.startsWith('http://') || u.startsWith('https://')) return u;
        return `https://${host}${u.startsWith('/') ? '' : '/'}${u}`;
    }).filter(Boolean);

    if (urlList.length === 0) return { success: false, error: 'No valid URLs provided' };

    const body = JSON.stringify({
        host,
        key,
        keyLocation: `https://${host}/${key}.txt`,
        urlList: urlList
    });

    try {
        const https = require('https');
        const options = {
            hostname: 'api.indexnow.org',
            path: '/indexnow',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Length': Buffer.byteLength(body)
            }
        };

        return await new Promise((resolve) => {
            const req = https.request(options, (res) => {
                let responseData = '';
                res.on('data', chunk => { responseData += chunk; });
                res.on('end', () => {
                    console.log(`[IndexNow] Submitted ${urlList.length} URL(s) to Bing IndexNow — Status: HTTP ${res.statusCode}`);
                    resolve({
                        success: res.statusCode === 200 || res.statusCode === 202,
                        status: res.statusCode,
                        urls: urlList,
                        response: responseData
                    });
                });
            });
            req.on('error', (e) => {
                console.error('[IndexNow] Ping failed:', e.message);
                resolve({ success: false, error: e.message, urls: urlList });
            });
            req.write(body);
            req.end();
        });
    } catch (e) {
        console.error('[IndexNow] Error during ping:', e.message);
        return { success: false, error: e.message, urls: urlList };
    }
}

// Dedicated API endpoint for instant indexing triggers
app.post('/api/indexnow', async (req, res) => {
    try {
        const { urls, slug, url } = req.body || {};
        let targets = [];
        if (Array.isArray(urls)) {
            targets.push(...urls);
        } else if (url) {
            targets.push(url);
        } else if (slug) {
            targets.push(`https://rudraanshyatra.com/blog/${slug}`);
            targets.push('https://rudraanshyatra.com/blog.html');
            targets.push('https://rudraanshyatra.com/blogs.html');
            targets.push('https://rudraanshyatra.com/sitemap.xml');
        }

        if (targets.length === 0) {
            return res.status(400).json({ error: 'Please provide urls, url, or slug to index.' });
        }

        const result = await pingIndexNow(targets);
        return res.json({ success: true, result });
    } catch (err) {
        console.error('[IndexNow API Error]', err);
        return res.status(500).json({ error: err.message });
    }
});

// Export for use in blog create/update routes
module.exports && (module.exports.pingIndexNow = pingIndexNow);

// Serve remaining static files from the root directory with clean URL support
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
        'privacy-policy.html',
        'terms-and-conditions.html',
        'refund-policy.html',
        'adi-kailash-from-pithoragarh.html',
        'adi-kailash-from-kathgodam.html',
        'adi-kailash-from-delhi.html',
        'sitemap.xml',
        'robots.txt'
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

// Support Phusion Passenger (Hostinger Node.js runner), Local Node.js, and Vercel
if (typeof(PhusionPassenger) !== 'undefined') {
    PhusionPassenger.configure({ autoInstall: false });
    app.listen('passenger', () => {
        console.log('Server is running under Phusion Passenger');
        try {
            syncStaticFiles();
        } catch (e) {
            console.error('Error during static files sync:', e);
        }
    });
} else if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        try {
            syncStaticFiles();
        } catch (e) {
            console.error('Error during static files sync:', e);
        }
    });
}

// Required for Vercel serverless — must export the app
module.exports = app;
