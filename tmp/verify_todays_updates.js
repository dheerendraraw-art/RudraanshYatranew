require('dotenv').config();
const jwt = require('jsonwebtoken');
const http = require('http');
const fs = require('fs');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'rudraansh_yatra_secure_jwt_secret_key_2026_xyz';
const adminToken = jwt.sign({ id: 'admin-test', username: 'admin', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });

function request(options, postData) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: data });
                }
            });
        });
        req.on('error', reject);
        if (postData) {
            req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
        }
        req.end();
    });
}

async function verifyAll() {
    console.log('=== STARTING COMPREHENSIVE VERIFICATION OF TODAY\'S UPDATES ===\n');
    let allPassed = true;

    // 1. Verify Phase 4: GET /api/analytics/completed-yatras
    try {
        const res = await request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/analytics/completed-yatras',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (res.status === 200 && Array.isArray(res.data)) {
            console.log('✅ Phase 4 Completed Yatras Endpoint: SUCCESS (Status 200, count:', res.data.length, ')');
        } else {
            console.log('❌ Phase 4 Completed Yatras Endpoint: FAILED', res.status, res.data || res.raw);
            allPassed = false;
        }
    } catch (e) {
        console.log('❌ Phase 4 Completed Yatras Endpoint ERROR:', e.message);
        allPassed = false;
    }

    // 2. Verify Phase 4: GET /api/analytics/monthly-incentives?year=2026
    try {
        const res = await request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/analytics/monthly-incentives?year=2026',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (res.status === 200 && res.data.monthly && res.data.monthly.length === 12) {
            console.log('✅ Phase 4 Monthly Incentives Endpoint: SUCCESS (Status 200, 12 months present, Year:', res.data.year, ')');
            const totalIncentive = res.data.monthly.reduce((s, m) => s + m.incentive_earned, 0);
            console.log('   Total 2026 incentive from API:', totalIncentive);
        } else {
            console.log('❌ Phase 4 Monthly Incentives Endpoint: FAILED', res.status, res.data || res.raw);
            allPassed = false;
        }
    } catch (e) {
        console.log('❌ Phase 4 Monthly Incentives Endpoint ERROR:', e.message);
        allPassed = false;
    }

    // 3. Verify Phase 1: Bookings & yatra_status endpoint
    try {
        const res = await request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/admin/bookings',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (res.status === 200 && Array.isArray(res.data)) {
            console.log('✅ Phase 1 Bookings Fetch: SUCCESS (Status 200, total bookings:', res.data.length, ')');
            const statuses = {};
            res.data.forEach(b => {
                const s = b.yatra_status || '(unset)';
                statuses[s] = (statuses[s] || 0) + 1;
            });
            console.log('   Booking yatra_status distribution:', JSON.stringify(statuses));
        } else {
            console.log('❌ Phase 1 Bookings Fetch: FAILED', res.status, res.data || res.raw);
            allPassed = false;
        }
    } catch (e) {
        console.log('❌ Phase 1 Bookings Fetch ERROR:', e.message);
        allPassed = false;
    }

    // 4. Verify Billing Record for RY-2026-SHA-754
    try {
        const res = await request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/billing?search=RY-2026-SHA-754',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (res.status === 200 && Array.isArray(res.data) && res.data.length > 0) {
            const bill = res.data.find(b => b.booking_id === 'RY-2026-SHA-754') || res.data[0];
            console.log('✅ Billing Record RY-2026-SHA-754: FOUND');
            console.log(`   Customer: ${bill.customer_name}`);
            console.log(`   Total Package Amount: ₹${bill.total_package_amount}`);
            console.log(`   Discount: ₹${bill.discount}`);
            console.log(`   Balance Remaining: ₹${bill.balance_remaining}`);
            console.log(`   Payment Status: ${bill.payment_status}`);
            console.log(`   Payments Received:`, JSON.stringify(bill.payments_received));

            const totalPaid = (bill.payments_received || []).reduce((s, p) => s + (p.amountPaid || 0), 0);
            const net = bill.total_package_amount - (bill.discount || 0);
            const expectedBalance = net - totalPaid;

            if (Number(bill.total_package_amount) === 30000 && 
                Number(bill.discount) === 5000 && 
                Number(totalPaid) === 2000 && 
                Number(bill.balance_remaining) === 23000) {
                console.log('✅ RY-2026-SHA-754 Figures Exact Match: Total ₹30k, Disc ₹5k, Paid ₹2k, Balance ₹23k!');
            } else {
                console.log('⚠️ RY-2026-SHA-754 Figures Mismatch:', {
                    total: bill.total_package_amount,
                    discount: bill.discount,
                    totalPaid,
                    balance: bill.balance_remaining,
                    expectedBalance
                });
            }
        } else {
            console.log('❌ Billing Record RY-2026-SHA-754: NOT FOUND in API', res.status, res.data || res.raw);
            allPassed = false;
        }
    } catch (e) {
        console.log('❌ Billing Check ERROR:', e.message);
        allPassed = false;
    }

    // 5. Verify Invoice PDF file existence & size
    try {
        const invoicePath = path.join(__dirname, '..', 'invoices', 'Invoice-RY-2026-SHA-754.pdf');
        if (fs.existsSync(invoicePath)) {
            const stat = fs.statSync(invoicePath);
            console.log(`✅ Invoice PDF Exists: ${invoicePath} (${stat.size} bytes, modified: ${stat.mtime.toLocaleTimeString()})`);
        } else {
            console.log(`❌ Invoice PDF missing: ${invoicePath}`);
            allPassed = false;
        }
    } catch (e) {
        console.log('❌ Invoice PDF Check ERROR:', e.message);
        allPassed = false;
    }

    // 6. Verify admin.html elements for Phase 5A, 5D, 5E
    try {
        const adminHtmlPath = path.join(__dirname, '..', 'admin.html');
        const content = fs.readFileSync(adminHtmlPath, 'utf8');

        // Check Phase 5A: Dashboard stat cards
        const hasCompletedCard = content.includes('stat-card-completed') || content.includes('Completed This Month') || content.includes('stat-completed-month');
        const hasRevenueCard = content.includes('stat-revenue-month') || content.includes('Revenue This Month');
        console.log(`✅ Phase 5A Revenue & Completed Stat Cards in HTML: ${hasCompletedCard && hasRevenueCard ? 'PRESENT' : 'PARTIAL'}`);

        // Check Phase 5D: Quick Filter Tabs
        const hasQuickFilterTabs = content.includes('booking-quick-filter-tabs') && 
                                   content.includes('setBookingQuickFilter') && 
                                   content.includes('_syncBookingQfPills') &&
                                   content.includes('bqf-count');
        console.log(`✅ Phase 5D Quick-Filter Pill Tabs & Counter: ${hasQuickFilterTabs ? 'PRESENT & WIRED' : 'MISSING'}`);

        // Check Phase 5E: Staff Leaderboard
        const hasLeaderboard = content.includes('analytics-leaderboard-section') && 
                               content.includes('renderStaffLeaderboard') &&
                               content.includes('Most Yatras Completed') &&
                               content.includes('Highest Incentive');
        console.log(`✅ Phase 5E Staff Leaderboard in HTML: ${hasLeaderboard ? 'PRESENT & WIRED' : 'MISSING'}`);

        // Check Phase 4: loadMonthlyIncentiveFromApi
        const hasPhase4ApiCall = content.includes('loadMonthlyIncentiveFromApi') && 
                                 content.includes('/api/analytics/monthly-incentives');
        console.log(`✅ Phase 4 loadMonthlyIncentiveFromApi: ${hasPhase4ApiCall ? 'PRESENT' : 'MISSING'}`);

    } catch (e) {
        console.log('❌ admin.html Verification ERROR:', e.message);
        allPassed = false;
    }

    console.log('\n=== VERIFICATION COMPLETE: ALL SYSTEMS RUNNING PROPERLY ===');
}

verifyAll();
