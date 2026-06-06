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
        const previewContainer = document.getElementById('itinerary-preview-container');
        const subtitle = document.querySelector('.modal-subtitle');
        if (customForm) customForm.style.display = 'block';
        if (authContainer) authContainer.style.display = 'none';
        if (previewContainer) previewContainer.style.display = 'none';
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

        // Dynamically Inject Itinerary Preview HTML
        const previewDiv = document.createElement('div');
        previewDiv.id = 'itinerary-preview-container';
        previewDiv.style.display = 'none';
        previewDiv.innerHTML = `
            <div class="auth-header" style="text-align: center; margin-bottom: 15px;">
                <h4 style="color: var(--color-gold); font-size: 1.2rem; margin-bottom: 6px; font-family: var(--font-primary);">Your Tailored Itinerary</h4>
                <p style="font-size: 0.82rem; color: var(--color-text-secondary);">Here is a custom day-wise outline based on your interests.</p>
            </div>
            
            <div id="itinerary-days-list" style="margin: 15px 0; max-height: 240px; overflow-y: auto; padding-right: 8px; border: 1px solid var(--glass-border); border-radius: var(--border-radius-sm); padding: 12px; background: rgba(255,255,255,0.02);">
                <!-- Day-wise details go here -->
            </div>
            
            <div class="modal-btn-grid" style="margin-top: 15px;">
                <button type="button" class="btn btn-secondary" onclick="resetModalView()"><i class="fa-solid fa-arrow-left"></i> Customize</button>
                <button type="button" id="btn-final-share" class="btn btn-primary" style="background-color: #25D366; color: white;"><i class="fa-brands fa-whatsapp"></i> Finalize on WhatsApp</button>
            </div>
        `;
        authDiv.parentNode.insertBefore(previewDiv, authDiv.nextSibling);

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
            
            // Generate the dynamic day-wise itinerary list
            const daysList = document.getElementById('itinerary-days-list');
            if (daysList) {
                const daysData = generateItineraryText(data.destination, data.days, data.requests);
                let daysHTML = '';
                daysData.forEach(item => {
                    daysHTML += `
                        <div class="itinerary-day-item" style="margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.04); padding-bottom: 8px;">
                            <h5 style="color: var(--color-gold); font-size: 13px; margin-bottom: 4px; font-weight: 700; font-family: var(--font-primary);">Day ${item.day}: ${item.title}</h5>
                            <p style="font-size: 12px; color: var(--color-text-secondary); line-height: 1.5; margin: 0;">${item.desc}</p>
                        </div>
                    `;
                });
                daysList.innerHTML = daysHTML;
                
                // Add scrollbar style rules locally
                const scrollbarStyle = document.getElementById('custom-scrollbar-preview-style') || document.createElement('style');
                scrollbarStyle.id = 'custom-scrollbar-preview-style';
                scrollbarStyle.innerHTML = `
                    #itinerary-days-list::-webkit-scrollbar { width: 4px; }
                    #itinerary-days-list::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.01); }
                    #itinerary-days-list::-webkit-scrollbar-thumb { background: var(--color-gold); border-radius: 2px; }
                `;
                if (!scrollbarStyle.parentNode) document.head.appendChild(scrollbarStyle);
            }
            
            // Configure the final action button
            const finalBtn = document.getElementById('btn-final-share');
            if (finalBtn) {
                if (type === 'whatsapp') {
                    finalBtn.innerHTML = `<i class="fa-brands fa-whatsapp"></i> Finalize on WhatsApp`;
                    finalBtn.style.backgroundColor = '#25D366';
                    finalBtn.onclick = () => {
                        openWhatsAppShare(data);
                        const modal = document.getElementById('custom-trip-modal');
                        if (modal) modal.classList.remove('active');
                        resetModalView();
                        const form = document.getElementById('custom-itinerary-form');
                        if (form) form.reset();
                    };
                } else {
                    finalBtn.innerHTML = `<i class="fa-solid fa-envelope"></i> Send via Email`;
                    finalBtn.style.backgroundColor = 'var(--color-gold)';
                    finalBtn.onclick = () => {
                        openEmailShare(data);
                        const modal = document.getElementById('custom-trip-modal');
                        if (modal) modal.classList.remove('active');
                        resetModalView();
                        const form = document.getElementById('custom-itinerary-form');
                        if (form) form.reset();
                    };
                }
            }
            
            // Hide other views, show preview
            const customForm = document.getElementById('custom-itinerary-form');
            if (customForm) customForm.style.display = 'none';
            document.getElementById('phone-auth-container').style.display = 'none';
            document.getElementById('itinerary-preview-container').style.display = 'block';
            
            const subtitle = document.querySelector('.modal-subtitle');
            if (subtitle) subtitle.innerText = 'Here is your custom travel plan based on your chosen circuit and special interests.';
        }
    } catch (e) {
        showToast('Failed to submit request.', 'error');
        console.error(e);
    }
}

function openWhatsAppShare(data) {
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
}

function openEmailShare(data) {
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

function generateItineraryText(destination, days, requests) {
    let daysArray = [];
    const lowerRequests = (requests || '').toLowerCase();
    
    let extraNotes = [];
    if (lowerRequests.includes('senior') || lowerRequests.includes('old') || lowerRequests.includes('parent')) {
        extraNotes.push("Senior-citizen friendly pacing with regular acclimatization stops.");
    }
    if (lowerRequests.includes('helicopter') || lowerRequests.includes('heli')) {
        extraNotes.push("Helicopter shuttle assistance requested for high-altitude sections.");
    }
    if (lowerRequests.includes('veg') || lowerRequests.includes('food') || lowerRequests.includes('diet')) {
        extraNotes.push("Strictly vegetarian organic Kumaoni meals arranged at all homestays.");
    }
    if (lowerRequests.includes('oxygen') || lowerRequests.includes('medical') || lowerRequests.includes('asthma')) {
        extraNotes.push("Dedicated oxygen cylinder and medical oximeter kept in vehicle.");
    }
    if (lowerRequests.includes('child') || lowerRequests.includes('kid') || lowerRequests.includes('family')) {
        extraNotes.push("Family-friendly homestays with hot water facility.");
    }

    const noteText = extraNotes.length > 0 ? ` Note: ${extraNotes.join(" ")}` : "";

    for (let i = 1; i <= days; i++) {
        let title = '';
        let desc = '';
        
        if (destination.includes('Adi Kailash')) {
            if (i === 1) {
                title = "Arrival & Drive to Dharchula";
                desc = "Drive from Pithoragarh to Dharchula (90 km, 4 hrs) in private 4x4. Briefing on permits." + noteText;
            } else if (i === days) {
                title = "Return to Pithoragarh";
                desc = "Drive from Dharchula back to Pithoragarh. Departure with Prasad and blessings.";
            } else if (i === 2) {
                title = "Dharchula to Gunji / Nabi Village";
                desc = "Pass through tight border checkpoints and drive along the Kali River to Gunji (3,200m). Acclimatization walk.";
            } else if (i === 3) {
                title = "Expedition to Jolingkong (Adi Kailash Base)";
                desc = "Behold the sacred Adi Kailash peak (6,191m) and bathe/pray at Parvati Kund. Visit Gauri Kund.";
            } else if (i === 4) {
                title = "Om Parvat Darshan at Nabhidhang";
                desc = "Witness the holy natural 'ॐ' symbol formed of snow on the face of Om Parvat at Nabhidhang. Return to Gunji.";
            } else if (i === days - 1) {
                title = "Gunji to Dharchula Return";
                desc = "Return drive down the valleys to Dharchula. Evening free to shop for local border goods.";
            } else {
                title = "Exploration of Kuti Village";
                desc = "Explore the legendary village of Kuti, named after Kunti (mother of Pandavas). Explore local stone architecture and meet Rung tribes.";
            }
        } else if (destination.includes('Khaliya')) {
            if (i === 1) {
                title = "Pithoragarh to Munsiyari";
                desc = "Scenic drive from Pithoragarh to Munsiyari. Witness the majestic Panchachuli range." + noteText;
            } else if (i === days) {
                title = "Munsiyari to Pithoragarh Return";
                desc = "Morning check-out and return drive back to Pithoragarh.";
            } else if (i === 2) {
                title = "Trek to Khaliya Top Meadow";
                desc = "Trek 6 km through dense oak and rhododendron forests to the alpine bugyal of Khaliya Top (3,500m). Overnight camping under the stars.";
            } else if (i === 3) {
                title = "Sunrise at Peak & Descent";
                desc = "Wake up for a breathtaking 360-degree Himalayan sunrise. Descent back to Munsiyari. Stay in cozy homestay.";
            } else {
                title = "Balati Farm Exploration";
                desc = "Visit Balati Potato Farm and organic nurseries around Munsiyari. Taste local Kumaoni cuisine.";
            }
        } else if (destination.includes('Kailash Yatra')) {
            if (i === 1) {
                title = "Acclimatization at Pithoragarh";
                desc = "Medical checkups and permit documentation review at our ground control center." + noteText;
            } else if (i === days) {
                title = "Departure from Pithoragarh";
                desc = "Yatra concludes. Transfer to Kathgodam railway station or local airport.";
            } else if (i === 2) {
                title = "Drive to Dharchula";
                desc = "Drive along the border valley. Security clearance and biometric checks.";
            } else if (i === 3) {
                title = "Dharchula to Gunji";
                desc = "Fascinating drive past rushing waterfalls. Homestay lodging in Vyas Valley.";
            } else if (i === 4) {
                title = "Vyas Valley Acclimatization";
                desc = "Hike to Nabi temple. Resting to ensure zero AMS risks.";
            } else if (i === 5) {
                title = "Gunji to Lipulekh Pass & Tibet Entry";
                desc = "Cross the Lipulekh Pass border checkpoint. Meet Tibet local operators and drive to Taklakot.";
            } else if (i === 6) {
                title = "Drive to Lake Manasarovar";
                desc = "First holy darshan of Mount Kailash. Holy bath at the banks of Lake Manasarovar (4,590m).";
            } else if (i === 7) {
                title = "Kailash Parikrama Day 1 (Trek to Dirapuk)";
                desc = "Trek 13 km from Darchen to Dirapuk. Feast your eyes on the majestic North Face of Mt. Kailash.";
            } else if (i === 8) {
                title = "Parikrama Day 2 (Dirapuk to Zuthulpuk via Dolma La)";
                desc = "Cross the challenging Dolma La Pass (5,630m). Pray at Gauri Kund. Descent to Zuthulpuk (22 km trek).";
            } else if (i === 9) {
                title = "Parikrama Day 3 & Return to Taklakot";
                desc = "Complete the final 3-hour trek of the Parikrama. Drive back to Taklakot.";
            } else if (i === days - 2) {
                title = "Re-enter India via Lipulekh";
                desc = "Cross back into Uttarakhand. Drive to Gunji or Dharchula.";
            } else if (i === days - 1) {
                title = "Dharchula to Pithoragarh";
                desc = "Scenic return drive. Celebration dinner with the local Rudraansh Yatra team.";
            } else {
                title = "Rest and Reflection Day";
                desc = "Optional rest day at Taklakot or Darchen for spiritual meditation.";
            }
        } else if (destination.includes('Panchachuli')) {
            if (i === 1) {
                title = "Pithoragarh to Dharchula";
                desc = "Drive along border roads. Permit collection." + noteText;
            } else if (i === days) {
                title = "Dharchula to Pithoragarh Return";
                desc = "Morning drive back to Pithoragarh.";
            } else if (i === 2) {
                title = "Dharchula to Urthing / Sobla";
                desc = "Drive to Sobla, start of Darma Valley. Trek/drive to Urthing village. Homestay lodging.";
            } else if (i === 3) {
                title = "Trek to Panchachuli Base Camp";
                desc = "Trek through wild meadows to the snout of Meola Glacier, directly under the five peaks. Night camp.";
            } else if (i === 4) {
                title = "Explore Glacier & Descent";
                desc = "Explore nearby icefalls and return trek back to Urthing village.";
            } else {
                title = "Vyas Valley Border Views";
                desc = "Explore nearby Rung tribal villages and stone carvings.";
            }
        } else {
            if (i === 1) {
                title = "Pithoragarh to Dharchula";
                desc = "Start of exploration. Safety check and local orientation." + noteText;
            } else if (i === days) {
                title = "Dharchula to Pithoragarh Return";
                desc = "Transfer back to Pithoragarh town.";
            } else if (i === 2) {
                title = "Dharchula to Sela Village";
                desc = "Drive along the Dhauliganga River to Sela. Stone-and-wood house tours.";
            } else if (i === 3) {
                title = "Sela to Baaling Village";
                desc = "Explore high pine forest paths and local grasslands of Baaling.";
            } else if (i === 4) {
                title = "Baaling to Daktu / Tidang";
                desc = "Reach Upper Darma. Close view of East Face of Panchachuli peaks.";
            } else if (i === days - 1) {
                title = "Upper Darma to Dharchula";
                desc = "Return drive down to Dharchula. Local market shopping.";
            } else {
                title = "Trek to Nagling Glacier";
                desc = "Trek to the edge of Nagling Glacier viewpoint. Pristine high altitude experience.";
            }
        }
        
        daysArray.push({ day: i, title: title, desc: desc });
    }
    return daysArray;
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
window.resetModalView = resetModalView;
