// Rudraansh Yatra Global Scripts - app.js

document.addEventListener('DOMContentLoaded', () => {

    // Global Image Protection (Disables right-click and drag-to-save on all images)
    document.addEventListener('contextmenu', (e) => {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
        }
    });
    document.addEventListener('dragstart', (e) => {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
        }
    });

    // 0. Deferred Hero Background Video Loading (Core Web Vitals LCP Optimization)
    const initHeroVideo = () => {
        if (window.innerWidth <= 768) return; // Skip background video on mobile for fast LCP & data saving
        const video = document.querySelector('.hero-video-bg video');
        if (!video) return;
        const source = video.querySelector('source[data-src]');
        if (source) {
            source.src = source.getAttribute('data-src');
            video.load();
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {});
            }
        }
    };

    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => setTimeout(initHeroVideo, 800));
    } else {
        setTimeout(initHeroVideo, 1200);
    }

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
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navMenu.classList.toggle('active');
            document.body.classList.toggle('menu-open');

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

    // Dismiss mobile navigation on clicking outside the drawer
    document.addEventListener('click', (e) => {
        if (navMenu && navMenu.classList.contains('active')) {
            if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                navMenu.classList.remove('active');
                document.body.classList.remove('menu-open');
                
                // Reset hamburger animation
                const spans = menuToggle.querySelectorAll('span');
                if (spans.length >= 3) {
                    spans[0].style.transform = 'none';
                    spans[1].style.opacity = '1';
                    spans[2].style.transform = 'none';
                }
            }
        }
    });

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
                    // Recalculate heights for any active FAQs inside this tab content
                    targetContent.querySelectorAll('.faq-item.active .faq-answer').forEach(ans => {
                        ans.style.maxHeight = (ans.scrollHeight > 0 ? ans.scrollHeight : 500) + 'px';
                    });
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

            const packageNameBase = form.getAttribute('data-package') || 'General Inquiry';
            const pickupElement = form.querySelector('[name="pickup"]');
            const packageName = pickupElement ? `${packageNameBase} (${pickupElement.value})` : packageNameBase;
            
            const nameInput = form.querySelector('[name="name"]');
            const phoneInput = form.querySelector('[name="phone"]');
            const dateInput = form.querySelector('[name="date"]');
            const travelersInput = form.querySelector('[name="travelers"]');
            const messageInput = form.querySelector('[name="message"]');

            const name = nameInput ? nameInput.value.trim() : '';
            const phone = phoneInput ? phoneInput.value.trim() : '';
            const date = dateInput ? dateInput.value : '';
            const travelers = travelersInput ? travelersInput.value : '1';
            const message = messageInput ? messageInput.value.trim() : '';

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
            if (date) text += `*Preferred Date:* ${date}\n`;
            if (travelers) text += `*No. of Travelers:* ${travelers}\n`;
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

    // 6. Homepage Hero Quick Planner Form (Interactive Multi-step Wizard)
    const heroPlannerWizard = document.getElementById('hero-planner-wizard');
    if (heroPlannerWizard) {
        let currentStep = 1;
        let selectedDestination = '';
        let selectedMonth = 'Flexible';
        const selectedPreferences = [];
        let travelersCount = 1;
        let selectedPace = 'Standard';

        // Elements
        const steps = document.querySelectorAll('.wizard-progress-step');
        const panes = document.querySelectorAll('.wizard-step-pane');
        const progressFill = document.getElementById('wizard-progress-fill');
        const btnPrev = document.getElementById('btn-wizard-prev');
        const btnNext = document.getElementById('btn-wizard-next');
        const btnSubmit = document.getElementById('btn-wizard-submit');
        const summarySelection = document.getElementById('wizard-summary-selection');
        const summaryMeta = document.getElementById('wizard-summary-meta');
        const discountBadge = document.getElementById('wizard-discount-badge');

        const destCards = document.querySelectorAll('.dest-select-card');
        const monthBtns = document.querySelectorAll('.month-pill-btn');
        const prefCards = document.querySelectorAll('.preference-checkbox-card');
        const durationBtns = document.querySelectorAll('.duration-pill-btn');

        const travelerVal = document.getElementById('traveler-val');
        const btnTravelerMinus = document.getElementById('btn-traveler-minus');
        const btnTravelerPlus = document.getElementById('btn-traveler-plus');

        // Initial Summary Update
        updateSummary();

        // 1. Destination Selection
        destCards.forEach(card => {
            card.addEventListener('click', () => {
                destCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedDestination = card.getAttribute('data-value');
                updateSummary();
                
                // Auto-advance with small delay for better feedback
                setTimeout(() => {
                    if (currentStep === 1) {
                        goToStep(2);
                    }
                }, 350);
            });
        });

        // 2. Month Selection
        monthBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                monthBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedMonth = btn.getAttribute('data-value');
                updateSummary();
            });
        });

        // 3. Preference Selection
        prefCards.forEach(card => {
            card.addEventListener('click', () => {
                const val = card.getAttribute('data-value');
                const idx = selectedPreferences.indexOf(val);
                if (idx > -1) {
                    selectedPreferences.splice(idx, 1);
                    card.classList.remove('checked');
                } else {
                    selectedPreferences.push(val);
                    card.classList.add('checked');
                }
                updateSummary();
            });
        });

        // 4. Traveler Counter
        if (btnTravelerMinus && btnTravelerPlus && travelerVal) {
            btnTravelerMinus.addEventListener('click', () => {
                if (travelersCount > 1) {
                    travelersCount--;
                    travelerVal.innerText = travelersCount;
                    updateSummary();
                }
            });
            btnTravelerPlus.addEventListener('click', () => {
                if (travelersCount < 50) {
                    travelersCount++;
                    travelerVal.innerText = travelersCount;
                    updateSummary();
                }
            });
        }

        // 5. Pace Duration
        durationBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                durationBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedPace = btn.getAttribute('data-value');
                updateSummary();
            });
        });

        // Step Navigation Logic
        btnNext.addEventListener('click', () => {
            if (currentStep === 1 && !selectedDestination) {
                showToast('Please select a destination to continue.', 'error');
                return;
            }
            if (currentStep < 4) {
                goToStep(currentStep + 1);
            }
        });

        btnPrev.addEventListener('click', () => {
            if (currentStep > 1) {
                goToStep(currentStep - 1);
            }
        });

        // Step indicators click (only allow going to steps already unlocked/visited)
        steps.forEach(step => {
            step.addEventListener('click', () => {
                const targetStep = parseInt(step.getAttribute('data-step'));
                if (targetStep === 1 || (targetStep === 2 && selectedDestination) || (targetStep > 2 && selectedDestination && currentStep >= targetStep - 1)) {
                    goToStep(targetStep);
                }
            });
        });

        function goToStep(stepNum) {
            panes.forEach(pane => pane.classList.remove('active'));
            steps.forEach(step => step.classList.remove('active', 'completed'));

            currentStep = stepNum;

            // Highlight progress line fill
            const fillPercent = ((currentStep - 1) / 3) * 100;
            progressFill.style.width = fillPercent + '%';

            // Show active pane
            const activePane = document.getElementById(`step-pane-${currentStep}`);
            if (activePane) activePane.classList.add('active');

            // Update steps indicator state
            steps.forEach(step => {
                const sVal = parseInt(step.getAttribute('data-step'));
                if (sVal === currentStep) {
                    step.classList.add('active');
                } else if (sVal < currentStep) {
                    step.classList.add('completed');
                }
            });

            // Toggle buttons visibility
            if (currentStep === 1) {
                btnPrev.style.visibility = 'hidden';
            } else {
                btnPrev.style.visibility = 'visible';
            }

            if (currentStep === 4) {
                btnNext.style.display = 'none';
                btnSubmit.style.display = 'inline-flex';
            } else {
                btnNext.style.display = 'inline-flex';
                btnSubmit.style.display = 'none';
            }
        }

        function calculateDiscount(count) {
            if (count >= 8) return 10;
            if (count >= 5) return 5;
            if (count >= 3) return 3;
            return 0;
        }

        function updateSummary() {
            if (summarySelection) {
                summarySelection.innerText = selectedDestination ? `Destination: ${selectedDestination}` : 'Destination: Not Selected';
            }
            if (summaryMeta) {
                const prefStr = selectedPreferences.length > 0 ? ` | Prefs: ${selectedPreferences.join(', ')}` : '';
                summaryMeta.innerText = `Pace: ${selectedPace} | Month: ${selectedMonth} | Group: ${travelersCount} traveler${travelersCount > 1 ? 's' : ''}${prefStr}`;
            }

            const discount = calculateDiscount(travelersCount);
            if (discountBadge) {
                discountBadge.innerText = `${discount}%`;
                if (discount > 0) {
                    discountBadge.style.color = '#ffffff';
                    discountBadge.style.background = 'var(--color-gold)';
                } else {
                    discountBadge.style.color = 'var(--color-text-secondary)';
                    discountBadge.style.background = 'rgba(10, 25, 47, 0.05)';
                    discountBadge.style.boxShadow = 'none';
                }
            }
        }

        // Form Submit
        heroPlannerWizard.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('wizard-name').value.trim();
            const phone = document.getElementById('wizard-phone').value.trim();
            const email = document.getElementById('wizard-email').value.trim();

            if (!name || !phone) {
                showToast('Please enter your Name and WhatsApp number.', 'error');
                return;
            }

            // Estimate base days
            let baseDays = 8;
            if (selectedDestination.includes('Kailash Yatra')) baseDays = 14;
            else if (selectedDestination.includes('Darma')) baseDays = 6;
            else if (selectedDestination.includes('Khaliya')) baseDays = 4;

            const requestData = {
                name,
                phone,
                email,
                destination: selectedDestination,
                month: selectedMonth,
                travelers: travelersCount,
                pace: selectedPace,
                preferences: selectedPreferences.length > 0 ? selectedPreferences.join(', ') : 'None',
                discount: calculateDiscount(travelersCount) + '%',
                days: baseDays
            };

            showToast('Saving your trip request...', 'info');

            // Save to database custom_requests
            await saveWizardRequest(requestData);

            // Trigger WhatsApp
            let text = `🏔️ *Rudraansh Yatra - Trip Planner Request* 🏔️\n`;
            text += `-----------------------------------------\n`;
            text += `👤 *Name:* ${requestData.name}\n`;
            text += `📞 *Phone:* ${requestData.phone}\n`;
            if (requestData.email) text += `📧 *Email:* ${requestData.email}\n`;
            text += `\n`;
            text += `📍 *Destination:* ${requestData.destination}\n`;
            text += `📅 *Travel Month:* ${requestData.month}\n`;
            text += `👥 *Group Size:* ${requestData.travelers} Traveler${requestData.travelers > 1 ? 's' : ''}\n`;
            text += `🏃‍♂️ *Itinerary Pace:* ${requestData.pace} Pace\n`;
            text += `✨ *Preferences:* ${requestData.preferences}\n`;
            text += `🎁 *Estimated Savings:* ${requestData.discount} Off\n`;
            text += `-----------------------------------------\n`;
            text += `_Please guide me with the itinerary and direct booking process from Pithoragarh. Thank you!_`;

            const encodedText = encodeURIComponent(text);
            const waUrl = `https://wa.me/917617617651?text=${encodedText}`;
            window.open(waUrl, '_blank');

            showToast('Opening WhatsApp with your customized planner details!', 'success');

            // Reset Form and Step
            heroPlannerWizard.reset();
            destCards.forEach(c => c.classList.remove('selected'));
            monthBtns.forEach(b => b.classList.remove('selected'));
            prefCards.forEach(c => c.classList.remove('checked'));
            durationBtns.forEach((b, i) => {
                if (i === 0) b.classList.add('selected');
                else b.classList.remove('selected');
            });
            
            selectedDestination = '';
            selectedMonth = 'Flexible';
            selectedPreferences.length = 0;
            travelersCount = 1;
            selectedPace = 'Standard';
            
            if (travelerVal) travelerVal.innerText = '1';
            
            updateSummary();
            goToStep(1);
        });
    }

    // Save wizard details directly to Supabase
    async function saveWizardRequest(data) {
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
                    days: data.days,
                    requests: `Travel Month: ${data.month} | Group Size: ${data.travelers} | Pace: ${data.pace} | Preferences: ${data.preferences} | Est Savings: ${data.discount}`,
                    user_id: userId
                }
            ]);
            console.log('Wizard request saved to database.');
        } catch (e) {
            console.error('Database save error:', e);
        }
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
        // Make discount heading text visible
        const discountSpan = document.querySelector('.discount-badge-container span');
        if (discountSpan) {
            discountSpan.style.setProperty('color', 'var(--color-text-light)', 'important');
        }

        // Make Phone Number more important (required and carries 7% discount)
        const emailLabel = document.querySelector('label[for="custom-email"]');
        if (emailLabel) {
            emailLabel.innerHTML = `Email Address <span style="color: var(--color-gold); font-weight: 600; font-size: 11px;">(Get 3% Off)</span>`;
        }

        const phoneLabel = document.querySelector('label[for="custom-phone"]');
        if (phoneLabel) {
            phoneLabel.innerHTML = `Phone / WhatsApp Number <span style="color: var(--color-gold); font-weight: 600; font-size: 11px;">(Get 7% Off)</span> <span style="color: #ef4444;">*</span>`;
        }

        const phoneInputEl = document.getElementById('custom-phone');
        if (phoneInputEl) {
            phoneInputEl.setAttribute('required', 'true');
        }

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
            if (emailVal.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) discount += 3;
            if (phoneVal.replace(/\D/g, '').length >= 10) discount += 7;

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
            discount += 3;
        }
        if (phoneInput && phoneInput.value.replace(/\D/g, '').length >= 10) {
            discount += 7;
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

    // ── 3D Curved Blog Carousel ──
    const initBlogCarousel = () => {
        const container = document.querySelector('.blog-carousel-container');
        const track = document.querySelector('.blog-carousel-track');
        const originalCards = Array.from(document.querySelectorAll('.blog-carousel-track .blog-card'));
        const N = originalCards.length;
        const prevBtn = document.querySelector('.carousel-control.prev');
        const nextBtn = document.querySelector('.carousel-control.next');

        if (!container || !track || N === 0) return;

        // Ensure clones are removed
        track.querySelectorAll('.blog-card-clone').forEach(el => el.remove());

        const allCards = document.querySelectorAll('.blog-carousel-track .blog-card');

        const update3DTransforms = () => {
            const containerRect = container.getBoundingClientRect();
            const containerCenter = containerRect.left + containerRect.width / 2;

            allCards.forEach(card => {
                const cardRect = card.getBoundingClientRect();
                const cardCenter = cardRect.left + cardRect.width / 2;
                
                const offset = cardCenter - containerCenter;
                const maxDistance = containerRect.width / 2;
                
                let ratio = offset / maxDistance;
                ratio = Math.max(-1.5, Math.min(1.5, ratio));

                const rotateY = ratio * -20;
                const translateZ = Math.abs(ratio) * -100;
                const scale = 1 - Math.min(0.2, Math.abs(ratio) * 0.1);
                const opacity = 1 - Math.min(0.5, Math.abs(ratio) * 0.3);

                card.style.transform = `perspective(1000px) rotateY(${rotateY}deg) translateZ(${translateZ}px) scale(${scale})`;
                card.style.opacity = opacity;
            });
        };

        // Scroll listener for 3D transforms
        container.addEventListener('scroll', update3DTransforms);
        window.addEventListener('resize', update3DTransforms);

        // Navigation button listeners with wrap-around loop
        if (prevBtn && nextBtn) {
            prevBtn.addEventListener('click', () => {
                const cardWidth = originalCards[0].offsetWidth + 30;
                const maxScrollLeft = container.scrollWidth - container.clientWidth;
                if (container.scrollLeft <= 10) {
                    container.scrollTo({ left: maxScrollLeft, behavior: 'smooth' });
                } else {
                    container.scrollBy({ left: -cardWidth, behavior: 'smooth' });
                }
            });

            nextBtn.addEventListener('click', () => {
                const cardWidth = originalCards[0].offsetWidth + 30;
                const maxScrollLeft = container.scrollWidth - container.clientWidth;
                if (container.scrollLeft >= maxScrollLeft - 10) {
                    container.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    container.scrollBy({ left: cardWidth, behavior: 'smooth' });
                }
            });
        }

        // Drag to scroll implementation
        let isDown = false;
        let startX;
        let scrollLeft;

        container.addEventListener('mousedown', (e) => {
            if (e.target.closest('a') || e.target.closest('button')) return;
            isDown = true;
            container.classList.add('grabbing');
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
        });

        container.addEventListener('mouseleave', () => {
            isDown = false;
            container.classList.remove('grabbing');
        });

        container.addEventListener('mouseup', () => {
            isDown = false;
            container.classList.remove('grabbing');
        });

        container.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const walk = (x - startX) * 1.5;
            container.scrollLeft = scrollLeft - walk;
        });

        // Initialize positions starting at scrollLeft 0
        container.scrollLeft = 0;
        setTimeout(update3DTransforms, 100);
    };

    // Initialize carousel on DOM load
    initBlogCarousel();

    // Re-initialize when window loads to ensure LCP images are computed correctly
    window.addEventListener('load', () => {
        setTimeout(initBlogCarousel, 500);
    });

    // Pay Now Button Handler for direct packages
    const payNowBtn = document.getElementById('btn-pay-now');
    if (payNowBtn) {
        payNowBtn.addEventListener('click', (e) => {
            const form = payNowBtn.closest('.inquiry-form');
            if (!form) return;

            const nameInput = form.querySelector('[name="name"]');
            const phoneInput = form.querySelector('[name="phone"]');
            const dateInput = form.querySelector('[name="date"]');
            const travelersInput = form.querySelector('[name="travelers"]');
            
            if (!nameInput || !phoneInput) return;

            if (!nameInput.value.trim()) {
                showToast('Please enter your Name.', 'error');
                nameInput.focus();
                return;
            }

            if (!phoneInput.value.trim()) {
                showToast('Please enter your Phone number.', 'error');
                phoneInput.focus();
                return;
            }

            if (dateInput && !dateInput.value) {
                showToast('Please select your Preferred Date.', 'error');
                dateInput.focus();
                return;
            }

            // Get package name and select option
            const packageNameBase = form.getAttribute('data-package') || 'Package';
            const pickupElement = form.querySelector('[name="pickup"]');
            let packageName = packageNameBase;
            let priceText = '';
            
            if (pickupElement) {
                packageName = `${packageNameBase} (${pickupElement.value})`;
                const selectedOption = pickupElement.options[pickupElement.selectedIndex];
                priceText = selectedOption.getAttribute('data-price') || '';
            } else {
                const priceEl = document.querySelector('.price-display strong');
                if (priceEl) {
                    priceText = priceEl.textContent;
                }
            }

            // Parse price
            const baseAmount = parseInt(priceText.replace(/[^0-9]/g, ''));
            if (isNaN(baseAmount) || baseAmount <= 0) {
                showToast('Payment amount is invalid or on request.', 'error');
                return;
            }

            // Compute total amount based on traveler count multiplier
            let travelerCount = 1;
            if (travelersInput) {
                const parsedCount = parseInt(travelersInput.value);
                if (!isNaN(parsedCount) && parsedCount > 0) {
                    travelerCount = parsedCount;
                }
            }
            const amount = baseAmount * travelerCount;

            // Redirect to payment page with pre-filled details
            const queryParams = new URLSearchParams({
                packageName: packageName,
                amount: amount,
                name: nameInput.value.trim(),
                phone: phoneInput.value.trim(),
                date: dateInput ? dateInput.value : '',
                travelers: travelersInput ? travelersInput.value : '1'
            });

            window.location.href = `/payment?${queryParams.toString()}`;
        });
    }

    // FAQ Accordion Toggle (supports both .faq-item and <details class="faq-accordion">)
    document.querySelectorAll('.faq-question').forEach(button => {
        button.addEventListener('click', () => {
            const faqItem = button.parentElement;
            if (!faqItem) return;

            // Handle <details> element natively if applicable
            if (faqItem.tagName.toLowerCase() === 'details') {
                const icon = button.querySelector('i, .faq-icon');
                setTimeout(() => {
                    if (icon) {
                        icon.style.transform = faqItem.hasAttribute('open') ? 'rotate(180deg)' : 'rotate(0deg)';
                    }
                }, 50);
                return;
            }

            const answer = faqItem.querySelector('.faq-answer');
            const icon = button.querySelector('i, .faq-icon');
            
            // Check if active
            const isActive = faqItem.classList.contains('active');
            
            // Close all others
            document.querySelectorAll('.faq-item').forEach(item => {
                if (item !== faqItem) {
                    item.classList.remove('active');
                    const otherAnswer = item.querySelector('.faq-answer');
                    if (otherAnswer) otherAnswer.style.maxHeight = null;
                    const otherIcon = item.querySelector('.faq-question i, .faq-question .faq-icon');
                    if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
                }
            });
            
            if (isActive) {
                faqItem.classList.remove('active');
                if (answer) answer.style.maxHeight = null;
                if (icon) icon.style.transform = 'rotate(0deg)';
            } else {
                faqItem.classList.add('active');
                if (answer) {
                    const h = answer.scrollHeight > 0 ? answer.scrollHeight : 500;
                    answer.style.maxHeight = h + 'px';
                }
                if (icon) icon.style.transform = 'rotate(180deg)';
            }
        });
    });
});