// generate_invoice_sha754.js
// Generates invoice PDF for RY-2026-SHA-754 using PDFKit
// Run: node tmp/generate_invoice_sha754.js

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ─── Billing Data (corrected) ─────────────────────────────────────────────
const billing = {
    booking_id:           'RY-2026-SHA-754',
    customer_name:        'Shashi Datta',
    customer_phone:       '+91 9910997329',
    customer_email:       'skdatta54@gmail.com',
    group_size:           1,
    tour_start_date:      '2026-10-12',
    package_name:         'Adi Kailash & Om Parvat',
    pickup_point:         'Delhi to Delhi (5 Days / 4 Nights)',
    total_package_amount: 30000,
    discount:             5000,
    balance_remaining:    23000,
    payment_status:       'Partially Paid',
    payments_received: [
        {
            date:        '2026-09-28',
            receiptId:   'REC-17905769777916',
            amountPaid:  2000,
            paymentMode: 'UPI',
            paymentType: 'Token Advance'
        }
    ]
};

// ─── Computed ─────────────────────────────────────────────────────────────
const netAmount   = billing.total_package_amount - billing.discount;  // 25000
const totalPaid   = billing.payments_received.reduce((s, p) => s + (parseFloat(p.amountPaid) || 0), 0); // 2000
const balanceDue  = netAmount - totalPaid;  // 23000

// ─── Output path ──────────────────────────────────────────────────────────
const outDir  = path.join(__dirname, '..', 'invoices');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `Invoice-${billing.booking_id}.pdf`);

// ─── PDF Generation ───────────────────────────────────────────────────────
const doc = new PDFDocument({ margin: 50, size: 'A4' });
const stream = fs.createWriteStream(outPath);
doc.pipe(stream);

const GOLD   = '#b8860b';
const DARK   = '#1a1a2e';
const SLATE  = '#475569';
const GREEN  = '#16a34a';
const RED    = '#dc2626';
const AMBER  = '#d97706';
const WHITE  = '#ffffff';
const LGRAY  = '#f1f5f9';

// ── Header band ────────────────────────────────────────────────────────────
doc.rect(0, 0, doc.page.width, 100).fill(DARK);
doc.fontSize(22).fillColor(GOLD).font('Helvetica-Bold')
   .text('RUDRAANSH YATRA', 50, 28, { align: 'left' });
doc.fontSize(10).fillColor('#94a3b8').font('Helvetica')
   .text('Pithoragarh, Uttarakhand | rudraanshyatra.in', 50, 55);
doc.fontSize(10).fillColor(GOLD).font('Helvetica-Bold')
   .text('BOOKING INVOICE', 50, 72);

// Invoice meta (right side)
doc.fontSize(10).fillColor(WHITE).font('Helvetica-Bold')
   .text(`Invoice #: ${billing.booking_id}`, 350, 28, { align: 'right', width: 200 });
doc.fontSize(9).fillColor('#94a3b8').font('Helvetica')
   .text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, 350, 46, { align: 'right', width: 200 })
   .text(`Tour Date: ${new Date(billing.tour_start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, 350, 62, { align: 'right', width: 200 });

// Payment status badge
const statusColor = billing.payment_status === 'Fully Paid' ? GREEN : billing.payment_status === 'Partially Paid' ? AMBER : RED;
doc.rect(350, 76, 200, 18).fill(statusColor);
doc.fontSize(9).fillColor(WHITE).font('Helvetica-Bold')
   .text(billing.payment_status.toUpperCase(), 350, 80, { align: 'right', width: 200 });

doc.y = 118;

// ── Customer & Package Info ────────────────────────────────────────────────
const colL = 50, colR = 310, rowH = 18;

doc.rect(50, doc.y, doc.page.width - 100, 22).fill(LGRAY);
doc.fontSize(11).fillColor(DARK).font('Helvetica-Bold')
   .text('CUSTOMER DETAILS', 58, doc.y + 5);
doc.y += 28;

const infoRows = [
    ['Name',    billing.customer_name],
    ['Phone',   billing.customer_phone],
    ['Email',   billing.customer_email],
    ['Package', billing.package_name],
    ['Pickup',  billing.pickup_point],
    ['Pax',     `${billing.group_size} person(s)`],
];
infoRows.forEach(([label, value]) => {
    doc.fontSize(9).fillColor(SLATE).font('Helvetica-Bold').text(label + ':', colL, doc.y, { width: 90 });
    doc.fontSize(9).fillColor(DARK).font('Helvetica').text(value, colL + 95, doc.y - 9, { width: 400 });
    doc.y += rowH;
});

doc.y += 12;

// ── Package Cost Breakdown ─────────────────────────────────────────────────
doc.rect(50, doc.y, doc.page.width - 100, 22).fill(DARK);
doc.fontSize(11).fillColor(GOLD).font('Helvetica-Bold')
   .text('PACKAGE COST BREAKDOWN', 58, doc.y + 5);
doc.y += 30;

// Table header
const col1=50, col2=300, col3=430;
doc.rect(50, doc.y - 3, doc.page.width - 100, 20).fill('#e2e8f0');
doc.fontSize(9).fillColor(DARK).font('Helvetica-Bold')
   .text('Description',     col1+4, doc.y)
   .text('Amount',          col2,   doc.y)
   .text('Net',             col3,   doc.y);
doc.y += 20;

const packageRows = [
    ['Total Package Cost',                           `₹${billing.total_package_amount.toLocaleString('en-IN')}`, ''],
    [`Discount Applied`,                             `-₹${billing.discount.toLocaleString('en-IN')}`,            ''],
    ['Net Payable Amount',                           '',                                                          `₹${netAmount.toLocaleString('en-IN')}`],
];
packageRows.forEach(([desc, amt, net], i) => {
    if (i % 2 === 0) doc.rect(50, doc.y - 2, doc.page.width - 100, 18).fill('#f8fafc');
    doc.fontSize(9).fillColor(DARK).font('Helvetica')
       .text(desc, col1+4, doc.y)
       .text(amt,  col2,   doc.y)
       .text(net,  col3,   doc.y);
    doc.y += 18;
});

// Net total row
doc.rect(50, doc.y - 2, doc.page.width - 100, 22).fill(DARK);
doc.fontSize(10).fillColor(GOLD).font('Helvetica-Bold')
   .text('NET AMOUNT PAYABLE', col1+4, doc.y + 4)
   .text(`₹${netAmount.toLocaleString('en-IN')}`, col3, doc.y + 4);
doc.y += 28;

doc.y += 10;

// ── Payment History ────────────────────────────────────────────────────────
doc.rect(50, doc.y, doc.page.width - 100, 22).fill(LGRAY);
doc.fontSize(11).fillColor(DARK).font('Helvetica-Bold')
   .text('PAYMENT HISTORY', 58, doc.y + 5);
doc.y += 28;

// Payment table header
doc.rect(50, doc.y - 3, doc.page.width - 100, 20).fill('#e2e8f0');
doc.fontSize(9).fillColor(DARK).font('Helvetica-Bold')
   .text('Date',        col1+4, doc.y)
   .text('Receipt ID',  col1+90, doc.y)
   .text('Mode',        col1+230, doc.y)
   .text('Type',        col1+290, doc.y)
   .text('Amount Paid', col3,    doc.y);
doc.y += 20;

billing.payments_received.forEach((p, i) => {
    if (i % 2 === 0) doc.rect(50, doc.y - 2, doc.page.width - 100, 18).fill('#f8fafc');
    doc.fontSize(9).fillColor(DARK).font('Helvetica')
       .text(new Date(p.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }), col1+4, doc.y)
       .text(p.receiptId,   col1+90,  doc.y)
       .text(p.paymentMode, col1+230, doc.y)
       .text(p.paymentType, col1+290, doc.y)
       .text(`₹${parseFloat(p.amountPaid).toLocaleString('en-IN')}`, col3, doc.y);
    doc.y += 18;
});

doc.y += 6;

// ── Payment Summary ────────────────────────────────────────────────────────
const summaryRows = [
    ['Total Package Amount', `₹${billing.total_package_amount.toLocaleString('en-IN')}`, DARK],
    ['Discount',             `-₹${billing.discount.toLocaleString('en-IN')}`,             RED],
    ['Net Payable',          `₹${netAmount.toLocaleString('en-IN')}`,                     DARK],
    ['Amount Paid',          `₹${totalPaid.toLocaleString('en-IN')}`,                     GREEN],
    ['Balance Due',          `₹${balanceDue.toLocaleString('en-IN')}`,                    RED],
];

summaryRows.forEach(([label, value, color], i) => {
    const isLast = i === summaryRows.length - 1;
    if (isLast) {
        doc.rect(50, doc.y - 2, doc.page.width - 100, 24).fill(DARK);
        doc.fontSize(11).fillColor(GOLD).font('Helvetica-Bold')
           .text(label, col1+4, doc.y + 4)
           .text(value, col3,   doc.y + 4);
        doc.y += 28;
    } else {
        doc.fontSize(9).fillColor(color).font('Helvetica-Bold')
           .text(label, col1+4, doc.y)
           .text(value, col3,   doc.y);
        doc.y += rowH;
    }
});

doc.y += 16;

// ── Terms & Footer ─────────────────────────────────────────────────────────
doc.rect(50, doc.y, doc.page.width - 100, 1).fill('#e2e8f0');
doc.y += 8;

doc.fontSize(8).fillColor(SLATE).font('Helvetica-Bold').text('TERMS & CONDITIONS:', 50, doc.y);
doc.y += 12;
const terms = [
    '• Full payment must be received at least 15 days prior to the tour departure date.',
    '• Cancellation charges: 25% if cancelled 30+ days before tour | 50% if 15–29 days | 100% if <15 days.',
    '• Rudraansh Yatra is not responsible for delays due to weather, road closures, or force majeure events.',
    '• This invoice is computer-generated and is valid without a physical signature.',
];
terms.forEach(t => {
    doc.fontSize(7.5).fillColor(SLATE).font('Helvetica').text(t, 50, doc.y, { width: doc.page.width - 100 });
    doc.y += 11;
});

doc.y += 10;

// Footer
doc.rect(0, doc.page.height - 45, doc.page.width, 45).fill(DARK);
doc.fontSize(8).fillColor('#94a3b8').font('Helvetica')
   .text('Rudraansh Yatra • Pithoragarh, Uttarakhand 262501 • +91 9456665095 • info@rudraanshyatra.in', 50, doc.page.height - 30, { align: 'center', width: doc.page.width - 100 });

doc.end();

stream.on('finish', () => {
    console.log(`\n✅ Invoice generated successfully!`);
    console.log(`📄 File: ${outPath}`);
    console.log(`\n📊 Summary:`);
    console.log(`   Booking ID    : ${billing.booking_id}`);
    console.log(`   Customer      : ${billing.customer_name}`);
    console.log(`   Package       : ${billing.package_name}`);
    console.log(`   Tour Date     : ${billing.tour_start_date}`);
    console.log(`   Total Amount  : ₹${billing.total_package_amount.toLocaleString('en-IN')}`);
    console.log(`   Discount      : ₹${billing.discount.toLocaleString('en-IN')}`);
    console.log(`   Net Payable   : ₹${netAmount.toLocaleString('en-IN')}`);
    console.log(`   Amount Paid   : ₹${totalPaid.toLocaleString('en-IN')}`);
    console.log(`   Balance Due   : ₹${balanceDue.toLocaleString('en-IN')}`);
    console.log(`   Status        : ${billing.payment_status}`);
});
stream.on('error', err => {
    console.error('❌ Error generating invoice:', err.message);
});
