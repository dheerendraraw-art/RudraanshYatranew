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

    // 7. Book Your Trip Modal Logic
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
        await supabaseClient.from('custom_requests').insert([
            {
                name: data.name,
                email: data.email,
                destination: data.destination,
                days: parseInt(data.days) || 2,
                requests: data.requests || ''
            }
        ]);
        console.log('Booking request saved to database.');
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

// Bind to window for inline onclick handlers
window.resetModalView = resetModalView;
