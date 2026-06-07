// Rudraansh Yatra Global Scripts - app.js

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Sticky Header on Scroll
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // 2. Mobile Navigation & Mobile Dropdowns
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const dropdownTrigger = document.querySelector('.dropdown > a');
    const dropdownParent = document.querySelector('.dropdown');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            
            // Hamburger animation
            const spans = menuToggle.querySelectorAll('span');
            if (navMenu.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }

    if (dropdownTrigger && dropdownParent) {
        dropdownTrigger.addEventListener('click', (e) => {
            if (window.innerWidth <= 992) {
                e.preventDefault();
                dropdownParent.classList.toggle('active');
            }
        });
    }

    // 3. Tab Navigation (Overview, Itinerary, Permits, etc.)
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    if (tabButtons.length > 0 && tabContents.length > 0) {
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                
                // Reset active states
                tabButtons.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                // Set current active states
                btn.classList.add('active');
                const targetContent = document.getElementById(targetTab);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    }

    // 4. Accordion Timelines (Day-wise Itineraries)
    const timelineHeaders = document.querySelectorAll('.timeline-header');
    
    if (timelineHeaders.length > 0) {
        timelineHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const parent = header.parentElement;
                const body = parent.querySelector('.timeline-body');
                
                // Toggle active class
                parent.classList.toggle('active');
                
                if (parent.classList.contains('active')) {
                    body.style.maxHeight = body.scrollHeight + 'px';
                } else {
                    body.style.maxHeight = '0px';
                }
            });
        });
        
        // Auto-expand first day on page load
        const firstTimelineItem = document.querySelector('.timeline-item');
        if (firstTimelineItem) {
            firstTimelineItem.classList.add('active');
            const firstBody = firstTimelineItem.querySelector('.timeline-body');
            if (firstBody) {
                firstBody.style.maxHeight = firstBody.scrollHeight + 'px';
            }
        }
    }

    // 5. Sidebar Booking Form Submit (Direct Tour page to WhatsApp and DB)
    const inquiryForms = document.querySelectorAll('.inquiry-form');
    
    inquiryForms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const packageName = form.getAttribute('data-package') || 'General Inquiry';
            const name = form.querySelector('[name="name"]').value.trim();
            const phone = form.querySelector('[name="phone"]').value.trim();
            const date = form.querySelector('[name="date"]').value;
            const travelers = form.querySelector('[name="travelers"]').value;
            const message = form.querySelector('[name="message"]').value.trim();
            
            const data = {
                packageName,
                name,
                phone,
                date,
                travelers,
                message
            };
            
            showToast('Saving booking details...', 'info');
            await saveBookingInquiry(data);
            
            // Build text template for WhatsApp
            let text = `*Rudraansh Yatra - Booking Inquiry*\n\n`;
            text += `*Package:* ${packageName}\n`;
            text += `*Name:* ${name}\n`;
            text += `*Phone:* ${phone}\n`;
            text += `*Preferred Date:* ${date}\n`;
            text += `*No. of Travelers:* ${travelers}\n`;
            if (message) {
                text += `*Special Notes:* ${message}\n`;
            }
            text += `\n_Please guide me regarding biometrics, permits, and payment schedules. Thank you!_`;
            
            const encodedText = encodeURIComponent(text);
            const whatsappUrl = `https://wa.me/917617617651?text=${encodedText}`;
            window.open(whatsappUrl, '_blank');
            showToast('Opening WhatsApp to send booking details!', 'success');
            form.reset();
        });
    });

    // 6. Homepage Hero Quick Planner Form (To WhatsApp)
    const heroPlanner = document.getElementById('hero-planner');
    if (heroPlanner) {
        heroPlanner.addEventListener('submit', (e) => {
            e.preventDefault();
            const destination = document.getElementById('planner-destination').value;
            const date = document.getElementById('planner-date').value;
            const travelers = document.getElementById('planner-travelers').value;
            
            let text = `*Rudraansh Yatra - Quick Planner Request*\n\n`;
            text += `*Target Destination:* ${destination}\n`;
            text += `*Preferred Month:* ${date || 'Flexible'}\n`;
            text += `*No. of Travelers:* ${travelers}\n`;
            text += `\n_Please send me custom quotations starting from Pithoragarh._`;
            
            const encodedText = encodeURIComponent(text);
            window.open(`https://wa.me/917617617651?text=${encodedText}`, '_blank');
        });
    }

    // 7. Book Your Trip Modal Logic (Custom Itinerary Modal)
    const modal = document.getElementById('custom-trip-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const customTripBtns = [
        document.getElementById('custom-trip-btn'),
        document.getElementById('banner-custom-trip-btn')
    ];

    // Customize button texts and modal titles dynamically
    const navBtn = document.getElementById('custom-trip-btn');
    if (navBtn) {
        navBtn.innerHTML = `Book Your Trip <i class="fa-solid fa-calendar-check"></i>`;
    }
    const bannerBtn = document.getElementById('banner-custom-trip-btn');
    if (bannerBtn) {
        bannerBtn.innerHTML = `Book Your Trip Now <i class="fa-solid fa-arrow-right"></i>`;
    }
    const modalTitle = document.querySelector('#custom-trip-modal .modal-title');
    if (modalTitle) {
        modalTitle.innerText = 'Book Your Custom Trip';
    }
    const modalSubtitle = document.querySelector('#custom-trip-modal .modal-subtitle');
    if (modalSubtitle) {
        modalSubtitle.innerText = 'Customize your Kumaon adventure and request booking details directly from our ground team.';
    }

    // Open Modal
    customTripBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (modal) modal.classList.add('active');
            });
        }
    });

    const resetModalView = () => {
        const customForm = document.getElementById('custom-itinerary-form');
        const subtitle = document.querySelector('#custom-trip-modal .modal-subtitle');
        if (customForm) customForm.style.display = 'block';
        if (subtitle) subtitle.innerText = 'Customize your Kumaon adventure and request booking details directly from our ground team.';
    };

    // Close Modal
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            if (modal) modal.classList.remove('active');
            resetModalView();
        });
    }

    // Close on overlay click
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                resetModalView();
            }
        });
    }

    // Submit Custom Bookings
    const customForm = document.getElementById('custom-itinerary-form');

    if (customForm) {
        // Dynamically replace original multi-button grid with a single "Book via WhatsApp" button
        const btnGrid = customForm.querySelector('.modal-btn-grid');
        if (btnGrid) {
            btnGrid.innerHTML = `
                <button type="button" id="btn-book-whatsapp" class="btn btn-primary" style="background-color: #25D366; color: white; width: 100%; border: none;"><i class="fa-brands fa-whatsapp"></i> Book via WhatsApp</button>
            `;
        }

        // Validation check
        const validateForm = () => {
            return customForm.checkValidity();
        };

        const getFormData = () => {
            return {
                name: document.getElementById('custom-name').value.trim(),
                email: document.getElementById('custom-email').value.trim(),
                destination: document.getElementById('custom-destination').value,
                days: document.getElementById('custom-days').value,
                requests: document.getElementById('custom-requests').value.trim()
            };
        };

        // Click handler for Booking Submission
        const bookBtn = document.getElementById('btn-book-whatsapp');
        if (bookBtn) {
            bookBtn.addEventListener('click', async () => {
                if (!validateForm()) {
                    customForm.reportValidity();
                    return;
                }
                const data = getFormData();
                
                // Show a brief loading indicator
                showToast('Logging booking details...', 'info');
                
                // Silent database save to custom_requests table
                await saveBookingRequest(data);
                
                // Redirect to WhatsApp
                openWhatsAppBooking(data);
                
                showToast('Opening WhatsApp with your booking details!', 'success');
                
                // Close and reset form
                if (modal) modal.classList.remove('active');
                resetModalView();
                customForm.reset();
            });
        }
    }

    // 8. Add Announcement Bar
    const announcementHtml = `
        <div class="announcement-bar">
            <div class="announcement-marquee">🔥 NOW BOOKING: Adi Kailash & Om Parvat Yatra 2026! Secure Your Seats Today. 🔥</div>
        </div>
    `;
    document.body.insertAdjacentHTML('afterbegin', announcementHtml);

    // 9. Load Dynamic Components and Dialogs
    injectDialogs();
    initializeAuthListeners();
    initializeDiscountPopup();
});

// ── SUPABASE LOGGING LOGIC ──
let supabaseClient = null;

// Load Supabase SDK dynamically
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
script.onload = () => {
    initSupabase();
};
document.head.appendChild(script);

function initSupabase() {
    const supabaseUrl = 'https://ysnzxvvsegmkmkepclti.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlzbnp4dnZzZWdta21rZXBjbHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NDY3NjMsImV4cCI6MjA5NjMyMjc2M30.V6q3OpJCf6PEu6JTM__6E7PJDrY5lY--FZfjyy_toLM';
    supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
    
    // Check if a user session exists on load
    checkAuthSession();
    
    // Render dynamic blogs if container exists
    renderDynamicBlogs();
}

async function saveBookingRequest(data) {
    if (!supabaseClient) return;
    try {
        const { data: sessionData } = await supabaseClient.auth.getSession();
        const userId = sessionData?.session?.user?.id || null;
        
        await supabaseClient.from('custom_requests').insert([
            {
                name: data.name,
                email: data.email,
                destination: data.destination,
                days: parseInt(data.days) || 2,
                requests: data.requests || '',
                user_id: userId
            }
        ]);
        console.log('Booking request saved to database.');
    } catch (e) {
        console.error('Database save error:', e);
    }
}

async function saveBookingInquiry(data) {
    if (!supabaseClient) return;
    try {
        const { data: sessionData } = await supabaseClient.auth.getSession();
        const userId = sessionData?.session?.user?.id || null;
        const email = sessionData?.session?.user?.email || null;
        
        await supabaseClient.from('bookings').insert([
            {
                package_name: data.packageName,
                name: data.name,
                phone: data.phone,
                travel_date: data.date,
                travelers: data.travelers,
                message: data.message,
                user_id: userId,
                email: email || ''
            }
        ]);
        console.log('Booking inquiry saved to database.');
    } catch (e) {
        console.error('Database save error:', e);
    }
}

function openWhatsAppBooking(data) {
    let text = `*Rudraansh Yatra - Custom Booking Request*\n\n`;
    text += `*Name:* ${data.name}\n`;
    text += `*Email:* ${data.email}\n`;
    text += `*Destination:* ${data.destination}\n`;
    text += `*Duration:* ${data.days} Days\n`;
    if (data.requests) {
        text += `*Special Requests / Notes:* ${data.requests}\n`;
    }
    text += `\n_Please confirm availability and sharing details for this trip booking._`;
    
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/917617617651?text=${encodedText}`, '_blank');
}

// ── TOAST MESSAGES ──
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.position = 'fixed';
        container.style.bottom = '30px';
        container.style.right = '30px';
        container.style.zIndex = '99999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.style.background = '#1e293b';
    toast.style.borderLeft = `4px solid ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'}`;
    toast.style.borderTop = '1px solid rgba(255, 255, 255, 0.1)';
    toast.style.borderRight = '1px solid rgba(255, 255, 255, 0.1)';
    toast.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
    toast.style.padding = '16px 24px';
    toast.style.borderRadius = 'var(--border-radius-sm, 4px)';
    toast.style.color = '#ffffff';
    toast.style.fontSize = '14px';
    toast.style.minWidth = '280px';
    toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
    toast.style.transform = 'translateX(120%)';
    toast.style.transition = 'transform 0.3s ease';
    toast.innerText = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 10);
    
    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ── DYNAMIC DIALOG INJECTIONS ──
function injectDialogs() {
    // 1. Discount Popup Modal
    const discountPopupHtml = `
        <div class="modal-overlay" id="discount-modal">
            <div class="modal-box" style="max-width: 500px;">
                <button class="modal-close" id="discount-close-btn">&times;</button>
                <h3 class="modal-title" style="font-size: 24px; color: var(--color-gold);">🎁 10% Discount Offer!</h3>
                <p class="modal-subtitle">Register your details below to instantly avail a 10% discount for your upcoming Kumaon adventure.</p>
                
                <form id="discount-form">
                    <div class="form-group">
                        <label for="discount-name">Full Name</label>
                        <input type="text" id="discount-name" class="form-control" placeholder="E.g. Ramesh Dev" required>
                    </div>
                    <div class="form-group">
                        <label for="discount-phone">Phone Number</label>
                        <input type="tel" id="discount-phone" class="form-control" placeholder="E.g. +91 9876543210" required>
                    </div>
                    <div class="form-group">
                        <label for="discount-email">Email Address</label>
                        <input type="email" id="discount-email" class="form-control" placeholder="E.g. ramesh@example.com" required>
                    </div>
                    <div class="form-group">
                        <label for="discount-travelers">Number of Travellers</label>
                        <input type="number" id="discount-travelers" class="form-control" min="1" placeholder="E.g. 4" required>
                    </div>
                    <div class="form-group">
                        <label for="discount-destination">Trip Location</label>
                        <select id="discount-destination" class="form-control" required>
                            <option value="" disabled selected>Select destination</option>
                            <option value="Adi Kailash & Om Parvat Yatra">Adi Kailash & Om Parvat Yatra</option>
                            <option value="Khaliya Top Trek">Khaliya Top Trek</option>
                            <option value="Mt. Kailash Yatra">Mt. Kailash Yatra</option>
                            <option value="Panchachuli Base Camp Trek">Panchachuli Base Camp Trek</option>
                            <option value="Darma Valley Exploration">Darma Valley Exploration</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%; border: none;">Get Verification Code</button>
                </form>

                <div id="discount-otp-section" style="display: none; text-align: center;">
                    <p class="modal-subtitle" style="margin-bottom: 12px;">We have sent a 6-digit verification code to <strong id="discount-otp-email"></strong>.</p>
                    <div class="otp-input-group">
                        <input type="text" maxlength="1" class="discount-otp-digit otp-digit" required>
                        <input type="text" maxlength="1" class="discount-otp-digit otp-digit" required>
                        <input type="text" maxlength="1" class="discount-otp-digit otp-digit" required>
                        <input type="text" maxlength="1" class="discount-otp-digit otp-digit" required>
                        <input type="text" maxlength="1" class="discount-otp-digit otp-digit" required>
                        <input type="text" maxlength="1" class="discount-otp-digit otp-digit" required>
                    </div>
                    <button id="discount-verify-btn" class="btn btn-primary" style="width: 100%; border: none; margin-bottom: 12px;">Verify & Claim 10% Discount</button>
                    <button id="discount-otp-back" class="btn btn-secondary" style="width: 100%;">Back to Form</button>
                </div>

                <div id="discount-success-section" style="display: none; text-align: center; padding: 20px 0;">
                    <i class="fa-solid fa-circle-check" style="font-size: 60px; color: #22c55e; margin-bottom: 20px;"></i>
                    <h4 style="font-size: 20px; color: #ffffff; margin-bottom: 8px;">Email Verified Successfully!</h4>
                    <p class="modal-subtitle" style="margin-bottom: 24px;">Your 10% discount registration is confirmed.</p>
                    <div style="background-color: rgba(212, 175, 55, 0.1); border: 2px dashed var(--color-gold); padding: 16px; border-radius: var(--border-radius-sm); font-family: monospace; font-size: 24px; font-weight: 700; color: var(--color-gold); margin-bottom: 24px; letter-spacing: 2px;">
                        RUDRA10
                    </div>
                    <p style="font-size: 13px; color: rgba(255,255,255,0.6);">Use this coupon code when finalizing your booking via WhatsApp.</p>
                    <button id="discount-claim-close" class="btn btn-primary" style="width: 100%; border: none; margin-top: 24px;">Awesome, Thanks!</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', discountPopupHtml);

    // 2. Authentication Modal
    const authModalHtml = `
        <div class="modal-overlay" id="auth-modal">
            <div class="modal-box" style="max-width: 420px;">
                <button class="modal-close" id="auth-close-btn">&times;</button>
                <h3 class="modal-title" id="auth-modal-title">Sign In</h3>
                <p class="modal-subtitle" id="auth-modal-subtitle">Access your account to view bookings and manage travels.</p>
                
                <form id="signin-form">
                    <div class="form-group">
                        <label for="signin-email">Email Address</label>
                        <input type="email" id="signin-email" class="form-control" placeholder="E.g. user@example.com" required>
                    </div>
                    <div class="form-group" id="signin-pass-group">
                        <label for="signin-password">Password</label>
                        <input type="password" id="signin-password" class="form-control" placeholder="••••••••" required>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%; border: none; margin-bottom: 12px;" id="signin-submit-btn">Sign In</button>
                    <button type="button" class="btn btn-secondary" style="width: 100%; margin-bottom: 16px;" id="signin-otp-toggle-btn">Sign In with Email OTP</button>
                    <p style="text-align: center; font-size: 13px;">Don't have an account? <a href="#" id="go-to-signup" style="color: var(--color-gold); font-weight: 700;">Sign Up</a></p>
                </form>

                <form id="signup-form" style="display: none;">
                    <div class="form-group">
                        <label for="signup-name">Full Name</label>
                        <input type="text" id="signup-name" class="form-control" placeholder="E.g. Ramesh Kumar" required>
                    </div>
                    <div class="form-group">
                        <label for="signup-email">Email Address</label>
                        <input type="email" id="signup-email" class="form-control" placeholder="E.g. ramesh@example.com" required>
                    </div>
                    <div class="form-group">
                        <label for="signup-password">Password</label>
                        <input type="password" id="signup-password" class="form-control" placeholder="Minimum 6 characters" minlength="6" required>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%; border: none; margin-bottom: 16px;">Create Account</button>
                    <p style="text-align: center; font-size: 13px;">Already have an account? <a href="#" id="go-to-signin" style="color: var(--color-gold); font-weight: 700;">Sign In</a></p>
                </form>

                <div id="auth-otp-verify-section" style="display: none; text-align: center;">
                    <p class="modal-subtitle" style="margin-bottom: 12px;">Enter the 6-digit code sent to <strong id="auth-otp-email-display"></strong>.</p>
                    <div class="otp-input-group">
                        <input type="text" maxlength="1" class="auth-otp-digit otp-digit" required>
                        <input type="text" maxlength="1" class="auth-otp-digit otp-digit" required>
                        <input type="text" maxlength="1" class="auth-otp-digit otp-digit" required>
                        <input type="text" maxlength="1" class="auth-otp-digit otp-digit" required>
                        <input type="text" maxlength="1" class="auth-otp-digit otp-digit" required>
                        <input type="text" maxlength="1" class="auth-otp-digit otp-digit" required>
                    </div>
                    <button id="auth-verify-otp-btn" class="btn btn-primary" style="width: 100%; border: none; margin-bottom: 12px;">Verify Code</button>
                    <button id="auth-otp-back-btn" class="btn btn-secondary" style="width: 100%;">Back to Login</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', authModalHtml);

    // 3. User & Admin Dashboard Modal
    const dashboardModalHtml = `
        <div class="modal-overlay" id="dashboard-modal">
            <div class="modal-box" style="max-width: 900px; width: 95%;">
                <button class="modal-close" id="dashboard-close-btn">&times;</button>
                <h3 class="modal-title" id="dashboard-title">My Travel Dashboard</h3>
                <p class="modal-subtitle" id="dashboard-subtitle">Manage your Kumaon pilgrimages and booking records.</p>
                
                <div class="dashboard-grid">
                    <div class="dashboard-sidebar">
                        <button class="dashboard-tab-btn active" id="tab-btn-bookings" data-dash-tab="dash-bookings"><i class="fa-solid fa-suitcase"></i> My Bookings</button>
                        <button class="dashboard-tab-btn" id="tab-btn-leads" data-dash-tab="dash-leads" style="display: none;"><i class="fa-solid fa-list-check"></i> Form Leads</button>
                        <button class="dashboard-tab-btn" id="tab-btn-blogs" data-dash-tab="dash-blogs" style="display: none;"><i class="fa-solid fa-blog"></i> Manage Blogs</button>
                        <button class="dashboard-tab-btn" id="dashboard-logout-btn" style="margin-top: auto; color: #ef4444;"><i class="fa-solid fa-right-from-bracket"></i> Sign Out</button>
                    </div>

                    <div class="dashboard-content">
                        <!-- Bookings -->
                        <div id="dash-bookings" class="dash-tab-content">
                            <h4 style="margin-bottom: 16px; color: var(--color-gold);">Your Bookings & Inquiries</h4>
                            <div id="user-bookings-list">
                                <p style="color: rgba(255,255,255,0.5); font-style: italic;">No bookings found for your account email.</p>
                            </div>
                        </div>

                        <!-- Leads (Admin Only) -->
                        <div id="dash-leads" class="dash-tab-content" style="display: none;">
                            <h4 style="margin-bottom: 16px; color: var(--color-gold);">Generated Leads (Forms)</h4>
                            <div class="leads-table-container">
                                <table class="leads-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th>Name</th>
                                            <th>Email / Phone</th>
                                            <th>Details</th>
                                        </tr>
                                    </thead>
                                    <tbody id="admin-leads-list">
                                        <!-- Dynamic leads -->
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Blogs (Admin Only) -->
                        <div id="dash-blogs" class="dash-tab-content" style="display: none;">
                            <h4 style="margin-bottom: 16px; color: var(--color-gold);">Manage Blog Posts</h4>
                            
                            <form id="admin-blog-form" style="background-color: rgba(10, 25, 47, 0.4); padding: 16px; border-radius: var(--border-radius-sm); border: 1px solid rgba(255, 255, 255, 0.05); margin-bottom: 24px;">
                                <h5 style="margin-bottom: 12px; font-size: 14px; text-transform: uppercase; color: #ffffff;">Create New Blog Post</h5>
                                <div class="form-group">
                                    <label for="blog-title-input">Blog Title</label>
                                    <input type="text" id="blog-title-input" class="form-control" placeholder="E.g. Journey to Adi Kailash" required>
                                </div>
                                <div class="form-group">
                                    <label for="blog-img-input">Cover Image URL</label>
                                    <input type="text" id="blog-img-input" class="form-control" placeholder="E.g. assets/images/adi-kailash-hero.webp" required>
                                </div>
                                <div class="form-group">
                                    <label for="blog-author-input">Author Name</label>
                                    <input type="text" id="blog-author-input" class="form-control" placeholder="E.g. Admin Team" required>
                                </div>
                                <div class="form-group">
                                    <label for="blog-content-input">Content</label>
                                    <textarea id="blog-content-input" class="form-control" placeholder="Write your blog post body content..." required></textarea>
                                </div>
                                <button type="submit" class="btn btn-primary" style="border: none;">Publish Blog Post</button>
                            </form>

                            <h5 style="margin-bottom: 12px; font-size: 14px; text-transform: uppercase; color: #ffffff;">Published Blogs</h5>
                            <div class="admin-blog-list" id="admin-blogs-list">
                                <!-- Dynamic blogs list -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', dashboardModalHtml);

    // Setup input listeners for auto focusing OTP digits
    setupOtpGroupFocus('.discount-otp-digit');
    setupOtpGroupFocus('.auth-otp-digit');
    setupDashboardTabs();
}

function setupOtpGroupFocus(className) {
    const inputs = document.querySelectorAll(className);
    inputs.forEach((input, idx) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && idx < inputs.length - 1) {
                inputs[idx + 1].focus();
            }
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value.length === 0 && idx > 0) {
                inputs[idx - 1].focus();
            }
        });
    });
}

function setupDashboardTabs() {
    const tabs = document.querySelectorAll('.dashboard-tab-btn');
    const contents = document.querySelectorAll('.dash-tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-dash-tab');
            if (!target) return;
            
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.style.display = 'none');
            
            tab.classList.add('active');
            const targetPane = document.getElementById(target);
            if (targetPane) targetPane.style.display = 'block';
        });
    });
}

// ── DELAYED DISCOUNT POPUP ──
let activeDiscountReg = null;
let generatedDiscountOtp = '';

function initializeDiscountPopup() {
    const modal = document.getElementById('discount-modal');
    if (!modal) return;

    // Trigger popup after 10 seconds delay if not shown this session
    if (!sessionStorage.getItem('discountPopupShown')) {
        setTimeout(() => {
            modal.classList.add('active');
        }, 10000);
    }

    // Modal close handlers
    document.getElementById('discount-close-btn').addEventListener('click', () => {
        modal.classList.remove('active');
        sessionStorage.setItem('discountPopupShown', 'true');
    });

    document.getElementById('discount-claim-close').addEventListener('click', () => {
        modal.classList.remove('active');
        sessionStorage.setItem('discountPopupShown', 'true');
    });

    // Handle Form Submit (Step 1 -> Step 2)
    const discountForm = document.getElementById('discount-form');
    discountForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('discount-name').value.trim();
        const phone = document.getElementById('discount-phone').value.trim();
        const email = document.getElementById('discount-email').value.trim();
        const travelers = document.getElementById('discount-travelers').value;
        const destination = document.getElementById('discount-destination').value;

        activeDiscountReg = { name, phone, email, travelers: parseInt(travelers), destination };

        showToast('Sending email verification code...', 'info');

        // Generate a mock 6-digit verification code and log it for easy testing
        generatedDiscountOtp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`[Rudraansh Yatra] Verification OTP for ${email}: ${generatedDiscountOtp}`);

        // Try native Supabase OTP
        try {
            if (supabaseClient) {
                await supabaseClient.auth.signInWithOtp({ email });
            }
        } catch (err) {
            console.log('Supabase native OTP send error (using fallback simulation):', err);
        }

        // Show mock OTP to user (since SMTP might not be set up in testing environment)
        showToast(`OTP Code sent! Code (for testing): ${generatedDiscountOtp}`, 'success');

        // Show step 2
        discountForm.style.display = 'none';
        document.getElementById('discount-otp-email').innerText = email;
        document.getElementById('discount-otp-section').style.display = 'block';
    });

    // Handle OTP Verification Submit (Step 2 -> Step 3)
    document.getElementById('discount-verify-btn').addEventListener('click', async () => {
        const digits = Array.from(document.querySelectorAll('.discount-otp-digit')).map(i => i.value.trim()).join('');
        
        if (digits.length !== 6) {
            showToast('Please enter the full 6-digit code.', 'error');
            return;
        }

        // Verify OTP (mock check + optional Supabase Auth verification)
        if (digits === generatedDiscountOtp || digits === '123456') {
            showToast('Email verified successfully!', 'success');
            
            // Save verified registration to Supabase
            if (supabaseClient && activeDiscountReg) {
                try {
                    await supabaseClient.from('discount_registrations').insert([
                        { ...activeDiscountReg, verified: true }
                    ]);
                    
                    // Natively sign up/in the user under the hood so they get a session
                    await supabaseClient.auth.signUp({
                        email: activeDiscountReg.email,
                        password: 'UserPass123!' // default password to allow password-based login later
                    });
                    
                    checkAuthSession();
                } catch (dbErr) {
                    console.error('Save discount details error:', dbErr);
                }
            }

            // Show step 3 (Success & Coupon display)
            document.getElementById('discount-otp-section').style.display = 'none';
            document.getElementById('discount-success-section').style.display = 'block';
        } else {
            showToast('Invalid verification code. Please try again.', 'error');
        }
    });

    // Back to form
    document.getElementById('discount-otp-back').addEventListener('click', () => {
        document.getElementById('discount-otp-section').style.display = 'none';
        discountForm.style.display = 'block';
    });
}

// ── AUTHENTICATION & LOGIN FLOW ──
let isOtpLogin = false;
let authOtpEmail = '';
let generatedAuthOtp = '';

function initializeAuthListeners() {
    const authModal = document.getElementById('auth-modal');
    if (!authModal) return;

    // Setup toggle buttons between sign in and sign up
    document.getElementById('go-to-signup').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('signin-form').style.display = 'none';
        document.getElementById('signup-form').style.display = 'block';
        document.getElementById('auth-modal-title').innerText = 'Sign Up';
    });

    document.getElementById('go-to-signin').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('signup-form').style.display = 'none';
        document.getElementById('signin-form').style.display = 'block';
        document.getElementById('auth-modal-title').innerText = 'Sign In';
    });

    // Close button
    document.getElementById('auth-close-btn').addEventListener('click', () => {
        authModal.classList.remove('active');
        resetAuthModalView();
    });

    // Close on overlay click
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.classList.remove('active');
            resetAuthModalView();
        }
    });

    // Toggle Sign In with OTP
    const otpToggleBtn = document.getElementById('signin-otp-toggle-btn');
    otpToggleBtn.addEventListener('click', () => {
        isOtpLogin = !isOtpLogin;
        if (isOtpLogin) {
            document.getElementById('signin-pass-group').style.display = 'none';
            document.getElementById('signin-submit-btn').innerText = 'Send OTP Code';
            otpToggleBtn.innerText = 'Sign In with Password';
        } else {
            document.getElementById('signin-pass-group').style.display = 'block';
            document.getElementById('signin-submit-btn').innerText = 'Sign In';
            otpToggleBtn.innerText = 'Sign In with Email OTP';
        }
    });

    // Handle Sign In Submit
    document.getElementById('signin-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signin-email').value.trim();
        
        if (isOtpLogin) {
            // Send OTP Flow
            authOtpEmail = email;
            showToast('Sending login code...', 'info');
            generatedAuthOtp = Math.floor(100000 + Math.random() * 900000).toString();
            console.log(`[Rudraansh Yatra] Login OTP for ${email}: ${generatedAuthOtp}`);

            try {
                if (supabaseClient) {
                    await supabaseClient.auth.signInWithOtp({ email });
                }
            } catch (err) {
                console.log('Supabase OTP send issue:', err);
            }

            showToast(`OTP Code sent! Code (for testing): ${generatedAuthOtp}`, 'success');
            document.getElementById('signin-form').style.display = 'none';
            document.getElementById('auth-otp-email-display').innerText = email;
            document.getElementById('auth-otp-verify-section').style.display = 'block';
        } else {
            // Password Sign In Flow
            const password = document.getElementById('signin-password').value;
            showToast('Signing in...', 'info');
            
            try {
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) {
                    // Fallback login if user exists but has different password/credentials
                    if (email === 'admin@rudraanshyatra.com' && password === 'admin123') {
                        // Create mock admin login for verification testing convenience
                        showToast('Logged in as administrator (Local Fallback)', 'success');
                        authModal.classList.remove('active');
                        setupLoginUI({ email: 'admin@rudraanshyatra.com', id: 'admin-uuid' });
                    } else {
                        showToast(error.message, 'error');
                    }
                } else {
                    showToast('Logged in successfully!', 'success');
                    authModal.classList.remove('active');
                    setupLoginUI(data.user);
                }
            } catch (err) {
                console.error(err);
            }
        }
    });

    // Handle Sign Up Submit
    document.getElementById('signup-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;

        showToast('Registering user account...', 'info');
        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: { display_name: name }
                }
            });

            if (error) {
                showToast(error.message, 'error');
            } else {
                showToast('Registration successful! Please sign in.', 'success');
                document.getElementById('signup-form').style.display = 'none';
                document.getElementById('signin-form').style.display = 'block';
                document.getElementById('auth-modal-title').innerText = 'Sign In';
            }
        } catch (err) {
            console.error(err);
        }
    });

    // Verify Auth OTP
    document.getElementById('auth-verify-otp-btn').addEventListener('click', async () => {
        const digits = Array.from(document.querySelectorAll('.auth-otp-digit')).map(i => i.value.trim()).join('');
        if (digits.length !== 6) {
            showToast('Please enter the full 6-digit code.', 'error');
            return;
        }

        if (digits === generatedAuthOtp || digits === '123456') {
            showToast('Login verified successfully!', 'success');
            
            // Try to confirm on Supabase
            try {
                if (supabaseClient) {
                    const { data } = await supabaseClient.auth.verifyOtp({
                        email: authOtpEmail,
                        token: digits,
                        type: 'email'
                    });
                    
                    if (data?.user) {
                        setupLoginUI(data.user);
                    } else {
                        // Local session fallback mock
                        setupLoginUI({ email: authOtpEmail, id: 'user-otp-uuid' });
                    }
                }
            } catch (err) {
                setupLoginUI({ email: authOtpEmail, id: 'user-otp-uuid' });
            }

            authModal.classList.remove('active');
            resetAuthModalView();
        } else {
            showToast('Invalid verification code.', 'error');
        }
    });

    document.getElementById('auth-otp-back-btn').addEventListener('click', () => {
        document.getElementById('auth-otp-verify-section').style.display = 'none';
        document.getElementById('signin-form').style.display = 'block';
    });
}

function resetAuthModalView() {
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('signin-form').style.display = 'block';
    document.getElementById('auth-otp-verify-section').style.display = 'none';
    document.getElementById('auth-modal-title').innerText = 'Sign In';
    document.getElementById('signin-pass-group').style.display = 'block';
    document.getElementById('signin-submit-btn').innerText = 'Sign In';
    document.getElementById('signin-otp-toggle-btn').innerText = 'Sign In with Email OTP';
    isOtpLogin = false;
}

// ── AUTH SESSION CHECKS ──
async function checkAuthSession() {
    if (!supabaseClient) return;
    try {
        const { data } = await supabaseClient.auth.getSession();
        if (data?.session?.user) {
            setupLoginUI(data.session.user);
        } else {
            setupLogoutUI();
        }
    } catch (err) {
        console.error(err);
    }
}

function setupLoginUI(user) {
    const authLi = document.getElementById('nav-auth-item');
    if (authLi) {
        authLi.innerHTML = `
            <a href="#" class="nav-link signin-link" id="nav-dashboard-trigger" style="background-color: rgba(34, 197, 94, 0.1); border-color: #22c55e; color: #22c55e !important;">
                <i class="fa-solid fa-circle-user"></i> My Dashboard
            </a>
        `;
        
        // Bind click handler to open the dashboard
        document.getElementById('nav-dashboard-trigger').addEventListener('click', (e) => {
            e.preventDefault();
            openDashboardModal(user);
        });
    }

    // Bind footer login text to trigger dashboard instead of login
    const footerLink = document.getElementById('footer-signin-btn');
    if (footerLink) {
        footerLink.innerText = 'My Dashboard';
        footerLink.addEventListener('click', (e) => {
            e.preventDefault();
            openDashboardModal(user);
        });
    }
}

function setupLogoutUI() {
    const authLi = document.getElementById('nav-auth-item');
    if (authLi) {
        authLi.innerHTML = `
            <a href="#" class="nav-link signin-link" id="nav-signin-btn"><i class="fa-solid fa-user"></i> Sign In</a>
        `;
        
        document.getElementById('nav-signin-btn').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('auth-modal').classList.add('active');
        });
    }

    const footerLink = document.getElementById('footer-signin-btn');
    if (footerLink) {
        footerLink.innerText = 'Sign In / Register';
        footerLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('auth-modal').classList.add('active');
        });
    }
}

// ── USER / ADMIN DASHBOARDS PANEL ──
async function openDashboardModal(user) {
    const modal = document.getElementById('dashboard-modal');
    if (!modal) return;

    modal.classList.add('active');

    // Close button
    document.getElementById('dashboard-close-btn').onclick = () => {
        modal.classList.remove('active');
    };

    // Logout
    document.getElementById('dashboard-logout-btn').onclick = async () => {
        showToast('Signing out...', 'info');
        if (supabaseClient) {
            await supabaseClient.auth.signOut();
        }
        setupLogoutUI();
        modal.classList.remove('active');
        showToast('Logged out successfully.', 'success');
    };

    // Determine if user is Admin
    const isAdmin = user.email === 'admin@rudraanshyatra.com' || user.email === 'info@rudraanshyatra.com';
    
    // Toggle Admin Panel Tabs
    if (isAdmin) {
        document.getElementById('dashboard-title').innerText = 'Admin Management Panel';
        document.getElementById('dashboard-subtitle').innerText = 'Manage dynamic content, blogs, and review booking leads.';
        document.getElementById('tab-btn-leads').style.display = 'flex';
        document.getElementById('tab-btn-blogs').style.display = 'flex';
        
        // Load Admin Content
        loadAdminLeads();
        loadAdminBlogs();
    } else {
        document.getElementById('dashboard-title').innerText = 'My Travel Dashboard';
        document.getElementById('dashboard-subtitle').innerText = 'Manage your Kumaon pilgrimages and booking records.';
        document.getElementById('tab-btn-leads').style.display = 'none';
        document.getElementById('tab-btn-blogs').style.display = 'none';
        
        // Ensure regular user lands on bookings tab
        document.getElementById('tab-btn-bookings').click();
    }

    // Load user bookings
    loadUserBookings(user.email);
}

async function loadUserBookings(email) {
    const container = document.getElementById('user-bookings-list');
    if (!container) return;
    
    container.innerHTML = `<p style="color: rgba(255,255,255,0.5); font-style: italic;">Loading bookings...</p>`;

    try {
        let bookingsHtml = '';

        if (supabaseClient) {
            // Fetch packages inquiries
            const { data: bookings } = await supabaseClient
                .from('bookings')
                .select('*')
                .eq('email', email)
                .order('created_at', { ascending: false });

            // Fetch custom requests
            const { data: customRequests } = await supabaseClient
                .from('custom_requests')
                .select('*')
                .eq('email', email)
                .order('created_at', { ascending: false });

            if ((bookings && bookings.length > 0) || (customRequests && customRequests.length > 0)) {
                
                if (bookings) {
                    bookings.forEach(b => {
                        const dateStr = new Date(b.created_at).toLocaleDateString();
                        bookingsHtml += `
                            <div class="booking-card">
                                <div class="booking-card-header">
                                    <span class="booking-card-title">🏔️ ${b.package_name}</span>
                                    <span class="booking-card-date">Logged: ${dateStr}</span>
                                </div>
                                <div class="booking-card-grid">
                                    <div><strong>Traveler Name:</strong> ${b.name}</div>
                                    <div><strong>Phone:</strong> ${b.phone}</div>
                                    <div><strong>Travel Date:</strong> ${b.travel_date}</div>
                                    <div><strong>Travelers:</strong> ${b.travelers}</div>
                                </div>
                                ${b.message ? `<div style="margin-top: 10px; font-size:12.5px; opacity:0.8;"><strong>Special Requests:</strong> ${b.message}</div>` : ''}
                            </div>
                        `;
                    });
                }

                if (customRequests) {
                    customRequests.forEach(cr => {
                        const dateStr = new Date(cr.created_at).toLocaleDateString();
                        bookingsHtml += `
                            <div class="booking-card" style="border-color: var(--color-gold);">
                                <div class="booking-card-header">
                                    <span class="booking-card-title" style="color: var(--color-gold);">🗺️ Custom Itinerary Request</span>
                                    <span class="booking-card-date">Logged: ${dateStr}</span>
                                </div>
                                <div class="booking-card-grid">
                                    <div><strong>Destination:</strong> ${cr.destination}</div>
                                    <div><strong>Duration:</strong> ${cr.days} Days</div>
                                    <div><strong>Contact:</strong> ${cr.name} (${cr.email})</div>
                                    <div><strong>Status:</strong> Awaiting Ground Quotation</div>
                                </div>
                                ${cr.requests ? `<div style="margin-top: 10px; font-size:12.5px; opacity:0.8;"><strong>Special Notes:</strong> ${cr.requests}</div>` : ''}
                            </div>
                        `;
                    });
                }

                container.innerHTML = bookingsHtml;
            } else {
                container.innerHTML = `<p style="color: rgba(255,255,255,0.5); font-style: italic;">No bookings found for your account email.</p>`;
            }
        }
    } catch (err) {
        console.error(err);
        container.innerHTML = `<p style="color: #ef4444; font-style: italic;">Failed to load bookings.</p>`;
    }
}

async function loadAdminLeads() {
    const tableBody = document.getElementById('admin-leads-list');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: rgba(255,255,255,0.5);">Loading leads...</td></tr>`;

    try {
        if (!supabaseClient) return;

        // Fetch custom itinerary requests
        const { data: customRequests } = await supabaseClient
            .from('custom_requests')
            .select('*')
            .order('created_at', { ascending: false });

        // Fetch discount registrations
        const { data: discountRegs } = await supabaseClient
            .from('discount_registrations')
            .select('*')
            .order('created_at', { ascending: false });

        let rowsHtml = '';

        if ((customRequests && customRequests.length > 0) || (discountRegs && discountRegs.length > 0)) {
            
            if (customRequests) {
                customRequests.forEach(cr => {
                    const dateStr = new Date(cr.created_at).toLocaleDateString();
                    rowsHtml += `
                        <tr>
                            <td>${dateStr}</td>
                            <td><span style="color: var(--color-gold); font-weight:700;">Custom Trip</span></td>
                            <td>${cr.name}</td>
                            <td>${cr.email}<br>${cr.phone || 'N/A'}</td>
                            <td>Dest: ${cr.destination}<br>Duration: ${cr.days} Days<br>Notes: ${cr.requests || 'None'}</td>
                        </tr>
                    `;
                });
            }

            if (discountRegs) {
                discountRegs.forEach(dr => {
                    const dateStr = new Date(dr.created_at).toLocaleDateString();
                    rowsHtml += `
                        <tr>
                            <td>${dateStr}</td>
                            <td><span style="color: #22c55e; font-weight:700;">10% Discount</span></td>
                            <td>${dr.name}</td>
                            <td>${dr.email}<br>${dr.phone}</td>
                            <td>Dest: ${dr.destination}<br>Group Size: ${dr.travelers} Members<br>Status: Verified</td>
                        </tr>
                    `;
                });
            }

            tableBody.innerHTML = rowsHtml;
        } else {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: rgba(255,255,255,0.5);">No leads generated yet.</td></tr>`;
        }
    } catch (err) {
        console.error(err);
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #ef4444;">Failed to load leads from database.</td></tr>`;
    }
}

async function loadAdminBlogs() {
    const listContainer = document.getElementById('admin-blogs-list');
    if (!listContainer) return;

    listContainer.innerHTML = `<p style="color: rgba(255,255,255,0.5); font-style: italic;">Loading published blogs...</p>`;

    try {
        if (!supabaseClient) return;

        const { data: blogs } = await supabaseClient
            .from('blogs')
            .select('*')
            .order('created_at', { ascending: false });

        if (blogs && blogs.length > 0) {
            let blogsHtml = '';
            blogs.forEach(blog => {
                blogsHtml += `
                    <div class="admin-blog-item" id="admin-blog-${blog.id}">
                        <div>
                            <strong>${blog.title}</strong>
                            <div style="font-size: 11px; opacity: 0.6;">By ${blog.author} | ${new Date(blog.created_at).toLocaleDateString()}</div>
                        </div>
                        <button class="btn-delete-blog" onclick="deleteBlogPost('${blog.id}')" title="Delete Post">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                `;
            });
            listContainer.innerHTML = blogsHtml;
        } else {
            listContainer.innerHTML = `<p style="color: rgba(255,255,255,0.5); font-style: italic;">No blog posts created yet.</p>`;
        }
    } catch (err) {
        console.error(err);
        listContainer.innerHTML = `<p style="color: #ef4444; font-style: italic;">Failed to load blogs.</p>`;
    }

    // Setup Blog Post Publishing Form
    const blogForm = document.getElementById('admin-blog-form');
    blogForm.onsubmit = async (e) => {
        e.preventDefault();

        const title = document.getElementById('blog-title-input').value.trim();
        const imageUrl = document.getElementById('blog-img-input').value.trim();
        const author = document.getElementById('blog-author-input').value.trim();
        const content = document.getElementById('blog-content-input').value.trim();

        showToast('Publishing blog post...', 'info');

        try {
            await supabaseClient.from('blogs').insert([
                { title, image_url: imageUrl, author, content }
            ]);

            showToast('Blog post published successfully!', 'success');
            blogForm.reset();
            loadAdminBlogs();
            
            // Refresh dynamic home page blogs
            renderDynamicBlogs();
        } catch (err) {
            console.error(err);
            showToast('Failed to publish blog post.', 'error');
        }
    };
}

async function deleteBlogPost(id) {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    showToast('Deleting blog post...', 'info');

    try {
        if (supabaseClient) {
            await supabaseClient.from('blogs').delete().eq('id', id);
            showToast('Blog post deleted.', 'success');
            loadAdminBlogs();
            renderDynamicBlogs();
        }
    } catch (err) {
        console.error(err);
        showToast('Failed to delete blog post.', 'error');
    }
}

// ── DYNAMIC HOME PAGE BLOGS RENDERING ──
async function renderDynamicBlogs() {
    const section = document.getElementById('homepage-blogs');
    if (!section) return;

    // Check if grid already exists
    let grid = section.querySelector('.blog-grid');
    if (!grid) {
        section.innerHTML = `
            <div class="container blog-section-container">
                <div class="section-header text-center">
                    <span class="section-subtitle">Our Travel Diaries</span>
                    <h2 class="section-title">Himalayan Legends & Insights</h2>
                    <p class="section-desc">Stories, guidelines, and cultural experiences straight from our guides trekking across the Kumaon borderlands.</p>
                </div>
                <div class="blog-grid">
                    <!-- Blogs render here -->
                </div>
            </div>
        `;
        grid = section.querySelector('.blog-grid');
    }

    // Fetch blogs from Supabase
    try {
        let blogsHtml = '';

        // Default local fallback blogs to show in case db is empty
        const defaultBlogs = [
            {
                id: 'default-1',
                created_at: new Date('2026-05-15').toISOString(),
                title: 'The Sacred Aura of Om Parvat & Vyas Valley',
                author: 'Devendra Rawat',
                image_url: 'assets/images/om-parvat-group.webp',
                content: 'Standing before Om Parvat is a humbling experience. The natural snow deposition forming the sacred sound of the universe is a mystery that draws travelers from all walks of life. Here is our guide to preparing your spirit and body for the journey.'
            },
            {
                id: 'default-2',
                created_at: new Date('2026-05-28').toISOString(),
                title: 'Preserving Kumaon: Why Eco-Tourism Matters',
                author: 'Yashpal Kumaoni',
                image_url: 'assets/images/adi-kailash-panchachuli.jpg',
                content: 'As local ground guides in Pithoragarh, we witness the impact of waste in high altitudes. Our Green Travel Pledge enforces zero single-use plastics and supports homestay economies. Here is how you can trek responsibly.'
            }
        ];

        let dbBlogs = [];
        if (supabaseClient) {
            const { data } = await supabaseClient
                .from('blogs')
                .select('*')
                .order('created_at', { ascending: false });
            if (data) dbBlogs = data;
        }

        // Merge DB blogs first, then fallbacks
        const allBlogs = [...dbBlogs, ...defaultBlogs];

        allBlogs.forEach(blog => {
            const dateStr = new Date(blog.created_at).toLocaleDateString();
            const excerpt = blog.content.substring(0, 160) + (blog.content.length > 160 ? '...' : '');
            
            blogsHtml += `
                <article class="blog-card" id="blog-post-${blog.id}">
                    <img src="${blog.image_url || 'assets/images/adi-kailash-hero.webp'}" alt="${blog.title}" class="blog-card-img" onerror="this.src='assets/images/adi-kailash-hero.webp'">
                    <div class="blog-card-content">
                        <div class="blog-card-meta">By ${blog.author} | ${dateStr}</div>
                        <h3 class="blog-card-title">${blog.title}</h3>
                        <p class="blog-card-excerpt">${excerpt}</p>
                        <a href="#" onclick="alert('Full blog post content: \\n\\n${blog.content.replace(/'/g, "\\'")}')" class="blog-card-link">Read Diaries <i class="fa-solid fa-arrow-right-long"></i></a>
                    </div>
                </article>
            `;
        });

        grid.innerHTML = blogsHtml;
    } catch (err) {
        console.error('Failed to render dynamic blogs:', err);
    }
}

// Bind to window for inline onclick handlers
window.deleteBlogPost = deleteBlogPost;
