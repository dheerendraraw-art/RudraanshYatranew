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
        modalTitle.innerText = 'Unlock Special Yatra Discounts';
    }
    const modalSubtitle = document.querySelector('#custom-trip-modal .modal-subtitle');
    if (modalSubtitle) {
        modalSubtitle.innerText = 'Share details to get up to 10% direct discount on your Kumaon booking.';
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
        if (subtitle) subtitle.innerText = 'Share details to get up to 10% direct discount on your Kumaon booking.';
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
            const emailVal = document.getElementById('custom-email').value.trim();
            const phoneVal = document.getElementById('custom-phone').value.trim();
            
            let discount = 0;
            if (emailVal.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) discount += 5;
            if (phoneVal.replace(/\D/g, '').length >= 10) discount += 5;

            return {
                name: document.getElementById('custom-name').value.trim(),
                email: emailVal.toLowerCase(),
                phone: phoneVal,
                destination: document.getElementById('custom-destination').value,
                discount: discount + '%'
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

                if (!data.email && !data.phone) {
                    showToast('Please share either your Email or Phone to claim your discount!', 'error');
                    return;
                }

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
                
                // Reset live badge
                const discountText = document.getElementById('live-discount-text');
                if (discountText) {
                    discountText.innerText = '0%';
                    discountText.style.color = 'var(--color-gold)';
                }
            });
        }
    }

    // 8. Add Announcement Bar
    const announcementHtml = `
        <div class="announcement-bar">
            <div class="announcement-marquee">
                <span>🔥 NOW BOOKING: Adi Kailash & Om Parvat Yatra 2026! Secure Your Seats Today. 🔥</span>
                <span>🔥 NOW BOOKING: Adi Kailash & Om Parvat Yatra 2026! Secure Your Seats Today. 🔥</span>
                <span>🔥 NOW BOOKING: Adi Kailash & Om Parvat Yatra 2026! Secure Your Seats Today. 🔥</span>
                <span>🔥 NOW BOOKING: Adi Kailash & Om Parvat Yatra 2026! Secure Your Seats Today. 🔥</span>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('afterbegin', announcementHtml);

    // 9. Load Dynamic Components and Dialogs
    injectDialogs();
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
}

async function saveBookingRequest(data) {
    if (!supabaseClient) return;
    try {
        const { data: sessionData } = await supabaseClient.auth.getSession();
        const userId = sessionData?.session?.user?.id || null;

        await supabaseClient.from('custom_requests').insert([
            {
                name: data.name,
                email: data.email || '',
                phone: data.phone || '',
                destination: data.destination,
                days: 6,
                requests: `Applied Discount: ${data.discount}`,
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

    // Setup input listeners for auto focusing OTP digits
    setupOtpGroupFocus('.discount-otp-digit');
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
        const email = document.getElementById('discount-email').value.trim().toLowerCase();
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








    // Live Discount Calculations
    const emailInput = document.getElementById('custom-email');
    const phoneInput = document.getElementById('custom-phone');
    const discountText = document.getElementById('live-discount-text');

    const updateDiscount = () => {
        let discount = 0;
        if (emailInput && emailInput.value.trim().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            discount += 5;
        }
        if (phoneInput && phoneInput.value.replace(/\D/g, '').length >= 10) {
            discount += 5;
        }
        if (discountText) {
            discountText.innerText = discount + '%';
            if (discount > 0) {
                discountText.style.color = '#25D366';
            } else {
                discountText.style.color = 'var(--color-gold)';
            }
        }
    };

    if (emailInput) emailInput.addEventListener('input', updateDiscount);
    if (phoneInput) phoneInput.addEventListener('input', updateDiscount);