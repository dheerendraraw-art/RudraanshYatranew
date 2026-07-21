require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const PDFDocument = require('pdfkit');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const app = express();
app.use(express.json());
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
        'due-to-china-denying-clearance-for-the-lipulekh-crossing-28-indian-businessmen-were-forced-to-return': 'china-denies-lipulekh-clearance-indian-traders-return'
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
                        <img class="sidebar-link-img" src="${abImg}" alt="${ab.title}" onerror="this.src='/assets/images/adi-kailash-hero.webp'">
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
        const paragraphsHtml = blog.content
            .split('\n')
            .filter(p => p.trim() !== '')
            .map(p => {
                const trimmed = p.trim();
                // Check if it starts with a number followed by a dot and space (e.g. "1. Understand the Age Suitability")
                if (/^\d+\.\s/.test(trimmed)) {
                    return `<h3 class="blog-heading">${trimmed}</h3>`;
                }
                // Check if it starts with a bullet marker like * or - (e.g. "* Clothing:")
                if (/^[*+-]\s/.test(trimmed)) {
                    return `<p class="blog-bullet">${trimmed.substring(2)}</p>`;
                }
                // Bypass paragraph wrapping for HTML tags, script tags, or JSON structure lines
                if (/^<[a-zA-Z0-9]+/.test(trimmed) || trimmed.endsWith('</script>') || trimmed.startsWith('{') || trimmed.startsWith('}') || trimmed.startsWith('"') || trimmed.startsWith(']')) {
                    return trimmed;
                }
                return `<p class="blog-text">${trimmed}</p>`;
            })
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

        const metaDescriptionVal = blog.meta_description || `${blog.content.substring(0, 150)}...`;

        const resolvedMainImg = blog.image_url ? (blog.image_url.startsWith('http') || blog.image_url.startsWith('/') ? blog.image_url : '/' + blog.image_url) : '/assets/images/adi-kailash-hero.webp';

        blogHtml = blogHtml
            .replace(/{{META_TITLE}}/g, `${blog.title} - Rudraansh Yatra Diaries`)
            .replace(/{{META_DESC}}/g, metaDescriptionVal.replace(/"/g, '&quot;'))
            .replace(/{{TITLE}}/g, blog.title)
            .replace(/{{AUTHOR}}/g, blog.author)
            .replace(/{{DATE}}/g, dateStr)
            .replace(/{{IMAGE}}/g, resolvedMainImg)
            .replace(/{{IMAGE_ALT}}/g, imageAlt)
            .replace(/{{CONTENT}}/g, paragraphsHtml)
            .replace(/{{ADJACENT_BLOGS}}/g, adjacentBlogsHtml)
            .replace(/{{SLUG}}/g, `/blog/${blog.slug}`)
            .replace(/{{CREATED_AT}}/g, blog.created_at);

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
    <priority>0.6</priority>
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
    res.json({ version: '1.0.7', status: 'Running', timestamp: '2026-07-07T06:01:00Z' });
});

// ==========================================
// BILLING & PAYMENT TRACKING API ENDPOINTS
// ==========================================

// 1. Fetch all billing records with optional search & status filter
app.get('/api/billing', async (req, res) => {
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
app.post('/api/billing', async (req, res) => {
    try {
        if (!supabase) {
            return res.status(500).json({ error: 'Supabase client not initialized' });
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
app.post('/api/billing/:id/payment', async (req, res) => {
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

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
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

        const primaryColor = '#072654';
        const accentColor = '#d4af37';
        const darkTextColor = '#1f2937';
        const lightTextColor = '#4b5563';
        const tableHeaderBg = '#072654';
        const lightBg = '#f8fafc';
        const borderCol = '#e2e8f0';

        // 1. Header with Logo & Brand details
        const logoPath = path.join(__dirname, 'assets/images/logo.png');
        try {
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, 50, 40, { width: 50 });
            }
        } catch (imgErr) {
            console.error('Failed to embed logo in PDF:', imgErr);
        }

        // Title and tagline next to logo
        doc.fillColor(primaryColor)
           .font('Helvetica-Bold')
           .fontSize(20)
           .text('RUDRAANSH YATRA', 110, 45);
        
        doc.fillColor(accentColor)
           .font('Helvetica-Oblique')
           .fontSize(10)
           .text('Connecting Souls to the Divine', 110, 68);

        // Address & Contacts (Right-aligned)
        doc.fillColor(darkTextColor)
           .font('Helvetica')
           .fontSize(8.5)
           .text('1st Floor Above Punetha Bookstore,', 320, 40, { align: 'right', width: 225 })
           .text('Simailgair Bazaar, Pithoragarh,', 320, 51, { align: 'right', width: 225 })
           .text('Uttarakhand - 262501', 320, 62, { align: 'right', width: 225 })
           .fillColor(primaryColor)
           .font('Helvetica-Bold')
           .text('Phone: +91 7617617651 | info@rudraanshyatra.com', 320, 73, { align: 'right', width: 225 });

        // Divider
        doc.moveTo(50, 98).lineTo(545, 98).strokeColor(borderCol).lineWidth(1.5).stroke();

        // 2. Invoice Meta Info
        doc.fillColor(primaryColor)
           .font('Helvetica-Bold')
           .fontSize(13)
           .text('BILL OF SUPPLY (NON-GST)', 50, 110);

        doc.fillColor(darkTextColor)
           .font('Helvetica')
           .fontSize(8.5)
           .text(`Invoice No:  BILL-${bill.booking_id}`, 50, 128)
           .text(`Date:            ${new Date(bill.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, 139)
           .text(`Booking ID:   ${bill.booking_id}`, 50, 150);

        // 3. Billing Info Side-by-Side Cards
        const cardY = 175;
        const cardHeight = 70;
        
        // Left Card (Billed To)
        doc.save()
           .fillColor(lightBg)
           .rect(50, cardY, 235, cardHeight)
           .fill()
           .strokeColor(borderCol)
           .lineWidth(1)
           .rect(50, cardY, 235, cardHeight)
           .stroke()
           .restore();

        doc.fillColor(primaryColor)
           .font('Helvetica-Bold')
           .fontSize(9.5)
           .text('BILLED TO', 62, cardY + 10);

        doc.fillColor(darkTextColor)
           .font('Helvetica-Bold')
           .fontSize(10)
           .text(bill.customer_name, 62, cardY + 24, { width: 210, ellipsis: true })
           .font('Helvetica')
           .fontSize(8.5)
           .fillColor(lightTextColor)
           .text(`Phone: ${bill.customer_phone}`, 62, cardY + 38)
           .text(`Email: ${bill.customer_email || 'N/A'}`, 62, cardY + 49);

        // Right Card (Yatra Details)
        doc.save()
           .fillColor(lightBg)
           .rect(300, cardY, 245, cardHeight)
           .fill()
           .strokeColor(borderCol)
           .lineWidth(1)
           .rect(300, cardY, 245, cardHeight)
           .stroke()
           .restore();

        doc.fillColor(primaryColor)
           .font('Helvetica-Bold')
           .fontSize(9.5)
           .text('YATRA & TOUR DETAILS', 312, cardY + 10);

        const startDateStr = new Date(bill.tour_start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        doc.fillColor(darkTextColor)
           .font('Helvetica-Bold')
           .fontSize(10)
           .text(bill.package_name, 312, cardY + 24, { width: 220, ellipsis: true })
           .font('Helvetica')
           .fontSize(8.5)
           .fillColor(lightTextColor)
           .text(`Group Size: ${bill.group_size} Pax`, 312, cardY + 38)
           .text(`Reporting Date: ${startDateStr}`, 312, cardY + 49);

        // 4. Booking Charges Table
        const tableY = 265;
        doc.fillColor(primaryColor)
           .font('Helvetica-Bold')
           .fontSize(10.5)
           .text('BOOKING CHARGES', 50, tableY);

        // Header Row
        doc.save()
           .fillColor(primaryColor)
           .rect(50, tableY + 15, 495, 20)
           .fill()
           .restore();
        
        doc.fillColor('#FFFFFF')
           .fontSize(8.5)
           .font('Helvetica-Bold')
           .text('Package Description', 62, tableY + 21)
           .text('Total Rate (INR)', 425, tableY + 21, { align: 'right', width: 110 });

        // Item Row
        doc.fillColor(darkTextColor)
           .font('Helvetica')
           .fontSize(9)
           .text(`Expedition Package: ${bill.package_name} (Group of ${bill.group_size} Pax)`, 62, tableY + 44, { width: 350 })
           .font('Helvetica-Bold')
           .text(`INR ${parseFloat(bill.total_package_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 425, tableY + 44, { align: 'right', width: 110 });

        // Border below row
        doc.moveTo(50, tableY + 62).lineTo(545, tableY + 62).strokeColor(borderCol).lineWidth(1).stroke();

        // 5. Payments Received History Table
        const payY = tableY + 80;
        doc.fillColor(primaryColor)
           .font('Helvetica-Bold')
           .fontSize(10.5)
           .text('PAYMENTS RECEIVED HISTORY', 50, payY);

        // Header Row
        doc.save()
           .fillColor(primaryColor)
           .rect(50, payY + 15, 495, 20)
           .fill()
           .restore();

        doc.fillColor('#FFFFFF')
           .fontSize(8.5)
           .font('Helvetica-Bold')
           .text('Receipt ID', 62, payY + 21)
           .text('Payment Date', 180, payY + 21)
           .text('Payment Type', 270, payY + 21)
           .text('Method', 370, payY + 21)
           .text('Amount Received', 425, payY + 21, { align: 'right', width: 110 });

        let currentY = payY + 44;
        const payments = bill.payments_received || [];
        doc.font('Helvetica').fontSize(8.5);

        if (payments.length === 0) {
            doc.fillColor(lightTextColor)
               .text('No payment transactions logged yet.', 62, currentY);
            currentY += 18;
        } else {
            payments.forEach((payment) => {
                const dateVal = new Date(payment.date).toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' });
                doc.fillColor(darkTextColor)
                   .text(payment.receiptId, 62, currentY)
                   .text(dateVal, 180, currentY)
                   .text(payment.paymentType || 'Token Advance', 270, currentY)
                   .text(payment.paymentMode || 'UPI', 370, currentY)
                   .font('Helvetica-Bold')
                   .text(`INR ${parseFloat(payment.amountPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 425, currentY, { align: 'right', width: 110 })
                   .font('Helvetica');
                
                currentY += 18;
            });
        }

        // Border below payments
        doc.moveTo(50, currentY - 5).lineTo(545, currentY - 5).strokeColor(borderCol).lineWidth(1).stroke();

        // 6. Side-by-Side Totals & Terms Section
        currentY += 15;

        // Left Column: Terms & Conditions
        doc.fillColor(primaryColor)
           .font('Helvetica-Bold')
           .fontSize(8.5)
           .text('TERMS & CONDITIONS', 50, currentY);

        const boxY = currentY + 12;
        const boxHeight = 125;
        const boxWidth = 250;
        doc.save()
           .fillColor(lightBg)
           .rect(50, boxY, boxWidth, boxHeight)
           .fill()
           .strokeColor(borderCol)
           .lineWidth(1)
           .rect(50, boxY, boxWidth, boxHeight)
           .stroke()
           .restore();

        const shortTerms = [
            { title: 'Conduct', desc: 'Safety rules violators can be removed without refund.' },
            { title: 'Damage', desc: 'Any loss/damage to hotels or homestays is chargeable.' },
            { title: 'Belongings', desc: 'Rudraansh Yatra is not responsible for loss/theft of items.' },
            { title: 'Delays', desc: 'Not liable for delays/changes due to weather/landslides.' },
            { title: 'Amenities', desc: 'Hot water & other facilities availability varies by location.' },
            { title: 'Itinerary', desc: 'Plans subject to change due to weather or safety.' },
            { title: 'Booking', desc: 'All confirmed bookings are non-refundable/non-cancellable.' },
            { title: 'Cleanliness', desc: 'Maintain cleanliness and cooperate with team members.' },
            { title: 'Spirit', desc: 'Travel responsibly, respect others, and enjoy your journey.' }
        ];

        let termItemY = boxY + 6;
        doc.fontSize(5.5).lineGap(0.6);
        shortTerms.forEach(term => {
            doc.fillColor(primaryColor)
               .font('Helvetica-Bold')
               .text(`${term.title}: `, 58, termItemY, { continued: true, width: boxWidth - 16 })
               .fillColor(darkTextColor)
               .font('Helvetica')
               .text(term.desc, { width: boxWidth - 16 });

            termItemY += doc.heightOfString(`${term.title}: ${term.desc}`, { width: boxWidth - 16, lineGap: 0.6 }) + 2.5;
        });

        // Right Column: Totals & Balance due Box
        let rightY = currentY + 15;
        const totalPaidSoFar = payments.reduce((sum, p) => sum + parseFloat(p.amountPaid || 0), 0);
        const calculatedBalance = Math.max(0, parseFloat(bill.total_package_amount) - totalPaidSoFar);

        doc.fillColor(darkTextColor)
           .fontSize(9)
           .font('Helvetica')
           .text('Total Package Price:', 320, rightY)
           .font('Helvetica-Bold')
           .text(`INR ${parseFloat(bill.total_package_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 425, rightY, { align: 'right', width: 110 });

        rightY += 16;
        doc.font('Helvetica')
           .text('Total Amount Paid:', 320, rightY)
           .font('Helvetica-Bold')
           .text(`INR ${totalPaidSoFar.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 425, rightY, { align: 'right', width: 110 });

        rightY += 20;
        // Balance box
        doc.save()
           .fillColor(accentColor)
           .opacity(0.12)
           .rect(310, rightY - 6, 235, 26)
           .fill()
           .restore();

        doc.save()
           .strokeColor(accentColor)
           .lineWidth(1)
           .rect(310, rightY - 6, 235, 26)
           .stroke()
           .restore();
        
        doc.fillColor('#b2890f')
           .fontSize(9.5)
           .font('Helvetica-Bold')
           .text('BALANCE DUE:', 320, rightY)
           .text(`INR ${calculatedBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 425, rightY, { align: 'right', width: 110 });

        // 7. Footer disclaimers at the bottom of Page 1
        doc.fillColor(lightTextColor)
           .font('Helvetica-Oblique')
           .fontSize(7.5)
           .text('This is a computer generated invoice and requires no physical signature.', 50, 712, { align: 'center', width: 495 });

        doc.fillColor(primaryColor)
           .font('Helvetica-Bold')
           .fontSize(7)
           .text('This is a non-GST Bill of Supply issued by a non-registered supplier operating within the statutory threshold exemption limits.', 50, 723, { align: 'center', width: 495 });

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

// Global Cache-Busting Middleware: Disable caching for all static assets, HTML pages, and routes
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// Serve static files from the root directory with clean URL support (lower priority than our SSR routes)
app.use(express.static(__dirname, { extensions: ['html'] }));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
