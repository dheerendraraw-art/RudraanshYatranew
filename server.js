require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const PDFDocument = require('pdfkit');

const app = express();
app.use(express.json());
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

        const metaDescriptionVal = blog.meta_description || `${blog.content.substring(0, 150)}...`;

        blogHtml = blogHtml
            .replace(/{{META_TITLE}}/g, `${blog.title} - Rudraansh Yatra Diaries`)
            .replace(/{{META_DESC}}/g, metaDescriptionVal.replace(/"/g, '&quot;'))
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
        const newBalance = parseFloat(bill.total_package_amount) - totalPaid;

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
            res.send(pdfBuffer);
        });

        const primaryColor = '#072654';
        const accentColor = '#d4af37';
        const darkTextColor = '#1f2937';
        const lightTextColor = '#6b7280';
        const tableHeaderBg = '#f3f4f6';

        doc.fillColor(primaryColor)
           .font('Helvetica-Bold')
           .fontSize(22)
           .text('RUDRAANSH YATRA', 50, 50);
        
        doc.fillColor(lightTextColor)
           .font('Helvetica')
           .fontSize(9)
           .text('PREMIUM TREK & PILGRIMAGE OPERATOR', 50, 75);

        doc.fillColor(darkTextColor)
           .fontSize(9)
           .text('1st Floor Above Punetha Bookstore,', 320, 50, { align: 'right', width: 220 })
           .text('Simailgair Bazaar, Pithoragarh,', 320, 62, { align: 'right', width: 220 })
           .text('Uttarakhand - 262501', 320, 74, { align: 'right', width: 220 })
           .fillColor(primaryColor)
           .text('Phone: +91 7617617651 | info@rudraanshyatra.com', 320, 86, { align: 'right', width: 220 });

        doc.moveTo(50, 105).lineTo(545, 105).strokeColor('#e5e7eb').lineWidth(1.5).stroke();

        doc.fillColor(primaryColor)
           .font('Helvetica-Bold')
           .fontSize(14)
           .text('BILL OF SUPPLY (NON-GST)', 50, 120);

        doc.fillColor(darkTextColor)
           .font('Helvetica')
           .fontSize(9)
           .text(`Invoice No: BILL-${bill.booking_id}`, 50, 138)
           .text(`Date: ${new Date(bill.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, 150)
           .text(`Booking ID: ${bill.booking_id}`, 50, 162);

        doc.fillColor(primaryColor)
           .font('Helvetica-Bold')
           .fontSize(11)
           .text('BILLED TO', 50, 185)
           .text('YATRA & TOUR DETAILS', 300, 185);

        doc.fillColor(darkTextColor)
           .font('Helvetica')
           .fontSize(9.5)
           .text(bill.customer_name, 50, 202, { width: 220 })
           .fillColor(lightTextColor)
           .text(`Phone: ${bill.customer_phone}`, 50, 216)
           .text(`Email: ${bill.customer_email || 'N/A'}`, 50, 228);

        const startDateStr = new Date(bill.tour_start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        doc.fillColor(darkTextColor)
           .font('Helvetica')
           .fontSize(9.5)
           .text(bill.package_name, 300, 202, { width: 245 })
           .fillColor(lightTextColor)
           .text(`Group Size: ${bill.group_size} Pax`, 300, 216)
           .text(`Reporting Date: ${startDateStr}`, 300, 228);

        doc.moveTo(50, 255).lineTo(545, 255).strokeColor('#e5e7eb').lineWidth(1).stroke();

        doc.fillColor(primaryColor)
           .font('Helvetica-Bold')
           .fontSize(11)
           .text('BOOKING CHARGES', 50, 270);

        doc.rect(50, 285, 495, 20).fill(tableHeaderBg);
        doc.fillColor(darkTextColor)
           .fontSize(9)
           .font('Helvetica-Bold')
           .text('Package Description', 60, 291)
           .text('Total Rate (INR)', 450, 291, { align: 'right', width: 85 });

        doc.font('Helvetica')
           .fontSize(9.5)
           .text(`Expedition Package: ${bill.package_name} (Group of ${bill.group_size} Pax)`, 60, 314, { width: 370 })
           .text(`INR ${parseFloat(bill.total_package_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, 314, { align: 'right', width: 85 });

        doc.moveTo(50, 340).lineTo(545, 340).strokeColor('#e5e7eb').lineWidth(1).stroke();

        doc.fillColor(primaryColor)
           .font('Helvetica-Bold')
           .fontSize(11)
           .text('PAYMENTS RECEIVED HISTORY', 50, 360);

        doc.rect(50, 375, 495, 20).fill(tableHeaderBg);
        doc.fillColor(darkTextColor)
           .fontSize(8.5)
           .font('Helvetica-Bold')
           .text('Receipt ID', 60, 381)
           .text('Payment Date', 180, 381)
           .text('Payment Type', 270, 381)
           .text('Method', 390, 381)
           .text('Amount Received', 450, 381, { align: 'right', width: 85 });

        let currentY = 403;
        const payments = bill.payments_received || [];

        doc.font('Helvetica').fontSize(9);

        if (payments.length === 0) {
            doc.fillColor(lightTextColor)
               .text('No payment transactions logged yet.', 60, currentY);
            currentY += 18;
        } else {
            payments.forEach((payment) => {
                const dateVal = new Date(payment.date).toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' });
                doc.fillColor(darkTextColor)
                   .text(payment.receiptId, 60, currentY)
                   .text(dateVal, 180, currentY)
                   .text(payment.paymentType || 'Token Advance', 270, currentY)
                   .text(payment.paymentMode || 'UPI', 390, currentY)
                   .text(`INR ${parseFloat(payment.amountPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, currentY, { align: 'right', width: 85 });
                
                currentY += 18;
            });
        }

        doc.moveTo(50, currentY - 5).lineTo(545, currentY - 5).strokeColor('#e5e7eb').lineWidth(1).stroke();

        currentY += 15;
        const summaryBoxX = 330;
        const totalPaidSoFar = payments.reduce((sum, p) => sum + p.amountPaid, 0);

        doc.fillColor(darkTextColor)
           .fontSize(9.5)
           .font('Helvetica')
           .text('Total Package Price:', summaryBoxX, currentY)
           .text(`INR ${parseFloat(bill.total_package_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, currentY, { align: 'right', width: 85 });

        currentY += 16;
        doc.text('Total Amount Paid:', summaryBoxX, currentY)
           .text(`INR ${totalPaidSoFar.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, currentY, { align: 'right', width: 85 });

        currentY += 20;
        doc.save()
           .fillColor('#d4af37')
           .opacity(0.15)
           .rect(summaryBoxX - 10, currentY - 6, 225, 26)
           .fill()
           .restore();
        
        doc.fillColor('#b2890f')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text('BALANCE DUE ON ARRIVAL:', summaryBoxX, currentY)
           .text(`INR ${parseFloat(bill.balance_remaining).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, currentY, { align: 'right', width: 85 });

        doc.fillColor(lightTextColor)
           .font('Helvetica-Oblique')
           .fontSize(8.5)
           .text('This is a computer generated invoice and requires no physical signature.', 50, 715, { align: 'center', width: 495 });

        doc.fillColor(primaryColor)
           .font('Helvetica-Bold')
           .fontSize(8)
           .text('This is a non-GST Bill of Supply issued by a non-registered supplier operating within the statutory threshold exemption limits.', 50, 730, { align: 'center', width: 495 });

        doc.end();
    } catch (err) {
        console.error('API Generate PDF Error:', err);
        res.status(500).send('Failed to generate bill PDF: ' + err.message);
    }
});

// Serve static files from the root directory with clean URL support (lower priority than our SSR routes)
app.use(express.static(__dirname, { extensions: ['html'] }));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
