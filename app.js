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

    // Close Modal
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            if (modal) modal.classList.remove('active');
        });
    }

    // Close on overlay click
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }

    // Submit Custom Itinerary Builders
    const customForm = document.getElementById('custom-itinerary-form');
    const submitWaBtn = document.getElementById('submit-wa-btn');
    const submitEmailBtn = document.getElementById('submit-email-btn');

    if (customForm) {
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

        // Submit via WhatsApp
        if (submitWaBtn) {
            submitWaBtn.addEventListener('click', (e) => {
                if (!validateForm()) {
                    customForm.reportValidity();
                    return;
                }
                const data = getFormData();
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
                modal.classList.remove('active');
                customForm.reset();
            });
        }

        // Submit via Email (mailto:)
        if (submitEmailBtn) {
            submitEmailBtn.addEventListener('click', (e) => {
                if (!validateForm()) {
                    customForm.reportValidity();
                    return;
                }
                const data = getFormData();
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
                modal.classList.remove('active');
                customForm.reset();
            });
        }
    }
});
