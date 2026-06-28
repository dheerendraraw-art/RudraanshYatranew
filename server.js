require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

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
        return `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--color-text-secondary);">
            <i class="fa-solid fa-feather-pointed" style="font-size: 40px; color: var(--color-slate); margin-bottom: 12px;"></i>
            <p>No travel diaries published yet. Check back soon!</p>
        </div>`;
    }

    let html = '';
    blogs.forEach(blog => {
        const dateStr = new Date(blog.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const excerpt = blog.content.substring(0, 160) + (blog.content.length > 160 ? '...' : '');
        const slug = blog.slug || slugify(blog.title);
        html += `
            <article class="blog-card" id="blog-post-${blog.id}">
                <img src="${blog.image_url || 'assets/images/adi-kailash-hero.webp'}" alt="${blog.title}" class="blog-card-img" onerror="this.src='assets/images/adi-kailash-hero.webp'">
                <div class="blog-card-content">
                    <div class="blog-card-meta">By ${blog.author} | ${dateStr}</div>
                    <h3 class="blog-card-title">${blog.title}</h3>
                    <p class="blog-card-excerpt">${excerpt}</p>
                    <a href="/blog/${slug}" class="blog-card-link">Read Diaries <i class="fa-solid fa-arrow-right-long"></i></a>
                </div>
            </article>
        `;
    });
    return html;
}

// 1. SSR Route for Homepage (/)
app.get('/', async (req, res) => {
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

        // Load index.html template and inject blogs
        let indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
        
        const replacement = `<!-- Blogs Section -->
    <section id="homepage-blogs" class="section-padding" style="background-color: var(--color-bg-card);">
        <div class="container blog-section-container">
            <div class="section-header text-center">
                <span class="section-subtitle">Our Travel Diaries</span>
                <h2 class="section-title">Himalayan Legends & Insights</h2>
                <p class="section-desc">Stories, guidelines, and cultural experiences straight from our guides trekking across the Kumaon borderlands.</p>
            </div>
            <div class="blog-grid">
                ${blogsHtml}
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

    try {
        let blog = null;

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
        }

        if (!blog) {
            return res.status(404).send('<h1>404 - Article Not Found</h1><p>The travel diary you are looking for does not exist.</p><a href="/blogs">Go back to Blogs</a>');
        }

        // Render Paragraphs
        const paragraphsHtml = blog.content
            .split('\n')
            .filter(p => p.trim() !== '')
            .map(p => `<p class="blog-text">${p.trim()}</p>`)
            .join('\n');

        // Load blog.html template and replace placeholders
        let blogHtml = fs.readFileSync(path.join(__dirname, 'blog.html'), 'utf8');
        
        const dateStr = new Date(blog.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Set alt tags on dynamic images automatically
        const imageAlt = `${blog.title} Cover Photo - Rudraansh Yatra`;

        blogHtml = blogHtml
            .replace(/{{META_TITLE}}/g, `${blog.title} - Rudraansh Yatra Diaries`)
            .replace(/{{META_DESC}}/g, `${blog.content.substring(0, 150).replace(/"/g, '&quot;')}...`)
            .replace(/{{TITLE}}/g, blog.title)
            .replace(/{{AUTHOR}}/g, blog.author)
            .replace(/{{DATE}}/g, dateStr)
            .replace(/{{IMAGE}}/g, blog.image_url || 'assets/images/adi-kailash-hero.webp')
            .replace(/{{IMAGE_ALT}}/g, imageAlt)
            .replace(/{{CONTENT}}/g, paragraphsHtml);

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

// Serve static files from the root directory with clean URL support (lower priority than our SSR routes)
app.use(express.static(__dirname, { extensions: ['html'] }));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
