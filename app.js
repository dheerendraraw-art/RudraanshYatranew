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

    // 5. Sidebar Booking Form Submit (Direct Tour page to WhatsApp)
    const inquiryForms = document.querySelectorAll('.inquiry-form');
    
    inquiryForms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const packageName = form.getAttribute('data-package') || 'General Inquiry';
            const name = form.querySelector('[name="name"]').value.trim();
            const phone = form.querySelector('[name="phone"]').value.trim();
            const date = form.querySelector('[name="date"]').value;
            const travelers = form.querySelector('[name="travelers"]').value;
            const message = form.querySelector('[name="message"]').value.trim();
            
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

    // 7. Custom Itinerary Builder Modal Logic
    const modal = document.getElementById('custom-trip-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const customTripBtns = [
        document.getElementById('custom-trip-btn'),
        document.getElementById('banner-custom-trip-btn')
    ];

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
        const authContainer = document.getElementById('phone-auth-container');
        const subtitle = document.querySelector('.modal-subtitle');
        if (customForm) customForm.style.display = 'block';
        if (authContainer) authContainer.style.display = 'none';
        if (subtitle) subtitle.innerText = 'Design your personalized Kumaon adventure. We will curate it directly from Pithoragarh.';
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

    // Submit Custom Itinerary Builders
    const customForm = document.getElementById('custom-itinerary-form');
    const submitWaBtn = document.getElementById('submit-wa-btn');
    const submitEmailBtn = document.getElementById('submit-email-btn');

    if (customForm) {
        // Dynamically Inject Phone Auth HTML
        const authDiv = document.createElement('div');
        authDiv.id = 'phone-auth-container';
        authDiv.style.display = 'none';
        authDiv.innerHTML = `
            <div class="auth-header" style="text-align: center; margin-bottom: 20px;">
                <h4 style="color: var(--color-gold); font-size: 1.2rem; margin-bottom: 8px; font-family: var(--font-primary);">Yatri Verification</h4>
                <p style="font-size: 0.85rem; color: var(--color-text-secondary);">Please verify your mobile number to complete the request.</p>
            </div>
            
            <!-- STEP 1: ENTER PHONE -->
            <div id="auth-step-phone">
                <div class="form-group" style="margin-bottom: 20px;">
                    <label for="auth-phone" style="display: block; margin-bottom: 8px; font-size: 0.72rem; letter-spacing: 1.5px; text-transform: uppercase;">Mobile Number *</label>
                    <div style="display: flex; gap: 8px;">
                        <span style="background: var(--color-bg-card); border: 1.5px solid var(--glass-border); border-radius: var(--border-radius-sm); padding: 12px 14px; color: var(--color-text-light); font-size: 14.5px; display: flex; align-items: center;">+91</span>
                        <input type="tel" id="auth-phone" class="form-control" placeholder="9876543210" required pattern="[0-9]{10}" style="flex: 1;" />
                    </div>
                </div>
                <button type="button" id="btn-send-otp" class="btn btn-primary" style="width: 100%; margin-top: 10px;" onclick="sendOTPCode()">Send Verification OTP</button>
                <p style="font-size: 0.72rem; margin-top: 15px; color: var(--color-text-secondary); text-align: center;">Note: For testing, you can configure test phone numbers in your Supabase Auth settings.</p>
            </div>

            <!-- STEP 2: ENTER OTP -->
            <div id="auth-step-otp" style="display: none;">
                <div class="form-group" style="margin-bottom: 20px;">
                    <label for="auth-otp" style="display: block; margin-bottom: 8px; font-size: 0.72rem; letter-spacing: 1.5px; text-transform: uppercase;">Enter 6-Digit OTP *</label>
                    <input type="text" id="auth-otp" class="form-control" placeholder="123456" required pattern="[0-9]{6}" maxlength="6" style="text-align: center; letter-spacing: 6px; font-size: 1.2rem;" />
                </div>
                <button type="button" id="btn-verify-otp" class="btn btn-primary" style="width: 100%; margin-top: 10px;" onclick="verifyOTPCode()">Verify &amp; Submit</button>
                <button type="button" class="btn btn-secondary" style="width: 100%; margin-top: 12px; padding: 10px 0;" onclick="backToPhone()">Change Phone Number</button>
            </div>
        `;
        customForm.parentNode.insertBefore(authDiv, customForm.nextSibling);

        const indicator = document.createElement('div');
        indicator.id = 'auth-status-indicator';
        indicator.style.fontSize = '12px';
        indicator.style.color = 'var(--color-text-secondary)';
        indicator.style.marginTop = '15px';
        indicator.style.textAlign = 'center';
        customForm.appendChild(indicator);

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

        const handleItinerarySubmit = (type) => {
            if (!validateForm()) {
                customForm.reportValidity();
                return;
            }
            const data = getFormData();
            if (!currentUser) {
                window.pendingItineraryData = data;
                window.pendingItineraryType = type;
                
                customForm.style.display = 'none';
                document.getElementById('phone-auth-container').style.display = 'block';
                const subtitle = document.querySelector('.modal-subtitle');
                if (subtitle) subtitle.innerText = 'Please verify your mobile number to submit the request.';
                showToast('Please verify your mobile number to complete the request.', 'info');
            } else {
                submitItineraryRequest(data, type);
            }
        };

        // Submit via WhatsApp
        if (submitWaBtn) {
            submitWaBtn.addEventListener('click', (e) => {
                handleItinerarySubmit('whatsapp');
            });
        }

        // Submit via Email (mailto:)
        if (submitEmailBtn) {
            submitEmailBtn.addEventListener('click', (e) => {
                handleItinerarySubmit('email');
            });
        }
    }
});

// ── SUPABASE AUTH & ITINERARY LOGIC ──
let supabaseClient = null;
let currentUser = null;
let pendingPhone = '';

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
    
    checkUserSession();
    
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (session) {
            currentUser = session.user;
        } else {
            currentUser = null;
        }
        updateAuthUI();
    });
}

async function checkUserSession() {
    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (session) {
            currentUser = session.user;
        } else {
            currentUser = null;
        }
    } catch (e) {
        console.error(e);
    }
    updateAuthUI();
}

function updateAuthUI() {
    const authStatus = document.getElementById('auth-status-indicator');
    if (currentUser) {
        if (authStatus) {
            authStatus.innerHTML = `Verified: <strong>${currentUser.phone}</strong> | <span style="color: var(--color-gold); cursor: pointer;" onclick="handleSignOut()">Sign Out</span>`;
        }
    } else {
        if (authStatus) {
            authStatus.innerHTML = `Not verified.`;
        }
    }
}

async function handleSignOut() {
    if (supabaseClient) {
        await supabaseClient.auth.signOut();
        showToast('Signed out successfully.', 'success');
    }
}

async function sendOTPCode() {
    const phoneInput = document.getElementById('auth-phone').value.trim();
    if (!phoneInput || phoneInput.length !== 10 || isNaN(phoneInput)) {
        showToast('Please enter a valid 10-digit mobile number.', 'error');
        return;
    }
    
    const fullPhone = '+91' + phoneInput;
    pendingPhone = fullPhone;
    
    const sendBtn = document.getElementById('btn-send-otp');
    sendBtn.innerText = 'Sending OTP...';
    sendBtn.disabled = true;
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithOtp({
            phone: fullPhone
        });
        
        if (error) {
            showToast(error.message, 'error');
        } else {
            showToast('OTP sent successfully to ' + fullPhone, 'success');
            document.getElementById('auth-step-phone').style.display = 'none';
            document.getElementById('auth-step-otp').style.display = 'block';
            document.getElementById('auth-otp').focus();
        }
    } catch (e) {
        showToast('Failed to send OTP.', 'error');
        console.error(e);
    } finally {
        sendBtn.innerText = 'Send Verification OTP';
        sendBtn.disabled = false;
    }
}

async function verifyOTPCode() {
    const otpInput = document.getElementById('auth-otp').value.trim();
    if (!otpInput || otpInput.length !== 6 || isNaN(otpInput)) {
        showToast('Please enter a 6-digit OTP.', 'error');
        return;
    }
    
    const verifyBtn = document.getElementById('btn-verify-otp');
    verifyBtn.innerText = 'Verifying...';
    verifyBtn.disabled = true;
    
    try {
        const { data: { session }, error } = await supabaseClient.auth.verifyOtp({
            phone: pendingPhone,
            token: otpInput,
            type: 'sms'
        });
        
        if (error) {
            showToast(error.message, 'error');
        } else {
            showToast('Verification successful!', 'success');
            currentUser = session.user;
            updateAuthUI();
            
            // Hide verification view, show form
            document.getElementById('phone-auth-container').style.display = 'none';
            document.getElementById('custom-itinerary-form').style.display = 'block';
            const subtitle = document.querySelector('.modal-subtitle');
            if (subtitle) subtitle.innerText = 'Design your personalized Kumaon adventure. We will curate it directly from Pithoragarh.';
            
            // Auto submit the pending itinerary
            if (window.pendingItineraryData) {
                submitItineraryRequest(window.pendingItineraryData, window.pendingItineraryType);
            }
        }
    } catch (e) {
        showToast('Verification failed.', 'error');
        console.error(e);
    } finally {
        verifyBtn.innerText = 'Verify & Submit';
        verifyBtn.disabled = false;
    }
}

function backToPhone() {
    document.getElementById('auth-step-phone').style.display = 'block';
    document.getElementById('auth-step-otp').style.display = 'none';
    document.getElementById('auth-otp').value = '';
}

async function submitItineraryRequest(data, type) {
    showToast('Saving request...', 'info');
    
    try {
        const { data: responseData, error } = await supabaseClient.from('custom_requests').insert([
            {
                name: data.name,
                email: data.email,
                destination: data.destination,
                days: parseInt(data.days) || 2,
                requests: data.requests || '',
                phone: currentUser.phone,
                user_id: currentUser.id
            }
        ]);
        
        if (error) {
            showToast(error.message, 'error');
        } else {
            showToast('Custom itinerary request saved successfully!', 'success');
            
            // Execute the original sharing action
            if (type === 'whatsapp') {
                let text = `*Rudraansh Yatra - Personalized Trip Request*\n\n`;
                text += `*Name:* ${data.name}\n`;
                text += `*Email:* ${data.email}\n`;
                text += `*Destination:* ${data.destination}\n`;
                text += `*Duration:* ${data.days} Days\n`;
                if (data.requests) {
                    text += `*Requests:* ${data.requests}\n`;
                }
                text += `\n_Please send me a custom-tailored itinerary and group quotation._`;
                
                const encodedText = encodeURIComponent(text);
                window.open(`https://wa.me/917617617651?text=${encodedText}`, '_blank');
            } else if (type === 'email') {
                const subject = encodeURIComponent(`Custom Trip Request - ${data.name}`);
                let body = `Namaste Rudraansh Yatra Team,\n\n`;
                body += `I would like to request a custom itinerary with the following details:\n\n`;
                body += `Name: ${data.name}\n`;
                body += `Email: ${data.email}\n`;
                body += `Destination: ${data.destination}\n`;
                body += `Preferred Duration: ${data.days} Days\n`;
                if (data.requests) {
                    body += `Special Requests / Medical Notes:\n${data.requests}\n`;
                }
                body += `\nPlease send me availability details and pricing options.\n\n`;
                body += `Best regards,\n${data.name}`;
                
                const encodedBody = encodeURIComponent(body);
                window.open(`mailto:info@rudraanshyatra.com?subject=${subject}&body=${encodedBody}`, '_self');
            }
            
            // Close modal and reset form
            const modal = document.getElementById('custom-trip-modal');
            if (modal) modal.classList.remove('active');
            const form = document.getElementById('custom-itinerary-form');
            if (form) form.reset();
            
            // Clean up pending data
            window.pendingItineraryData = null;
            window.pendingItineraryType = null;
            
            // Reset view state
            const authContainer = document.getElementById('phone-auth-container');
            const subtitle = document.querySelector('.modal-subtitle');
            if (form) form.style.display = 'block';
            if (authContainer) authContainer.style.display = 'none';
            if (subtitle) subtitle.innerText = 'Design your personalized Kumaon adventure. We will curate it directly from Pithoragarh.';
        }
    } catch (e) {
        showToast('Failed to submit request.', 'error');
        console.error(e);
    }
}

function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.position = 'fixed';
        container.style.bottom = '30px';
        container.style.right = '30px';
        container.style.zIndex = '9999';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.style.background = 'var(--color-bg-card, #251502)';
    toast.style.borderLeft = `4px solid ${type === 'success' ? 'var(--color-gold, #C9A84C)' : type === 'error' ? '#d93838' : 'var(--color-gold, #C9A84C)'}`;
    toast.style.borderTop = '1px solid var(--glass-border, rgba(201,168,76,0.2))';
    toast.style.borderRight = '1px solid var(--glass-border, rgba(201,168,76,0.2))';
    toast.style.borderBottom = '1px solid var(--glass-border, rgba(201,168,76,0.2))';
    toast.style.padding = '16px 24px';
    toast.style.borderRadius = 'var(--border-radius-sm, 4px)';
    toast.style.color = 'var(--color-text-light, #FFF8EC)';
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

// Bind to window for inline onclick handlers
window.handleSignOut = handleSignOut;
window.sendOTPCode = sendOTPCode;
window.verifyOTPCode = verifyOTPCode;
window.backToPhone = backToPhone;
