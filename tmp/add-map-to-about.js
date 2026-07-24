const fs = require('fs');

let html = fs.readFileSync('about.html', 'utf8');

const mapSection = `
    <!-- Physical Office Location & Interactive Google Map Section -->
    <section class="office-location-section" style="background-color: var(--color-bg-card); padding: 60px 0; border-top: 1px solid var(--glass-border);">
        <div class="container">
            <div style="text-align: center; max-width: 700px; margin: 0 auto 35px;">
                <span class="hero-badge" style="margin-bottom: 12px; display: inline-block;"><span></span> Native Ground Office</span>
                <h2 style="font-family: var(--font-serif); font-size: clamp(26px, 4vw, 36px); color: var(--color-primary); margin-bottom: 12px;">Visit Our Pithoragarh Headquarters</h2>
                <p style="color: var(--color-text-secondary); font-size: 15px; line-height: 1.6;">Located at Simalgair Bazaar, Pithoragarh — your local ground team for Inner Line Permits, high-altitude gear checks, and direct yatra coordination.</p>
            </div>
            
            <div class="office-map-grid" style="display: grid; grid-template-columns: 1fr 1.8fr; gap: 24px; align-items: stretch;">
                <div style="background-color: var(--color-primary); color: #ffffff; padding: 28px; border-radius: 16px; border: 1px solid var(--color-gold); display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <h3 style="font-family: var(--font-serif); font-size: 24px; color: var(--color-gold); margin-bottom: 18px; display: flex; align-items: center; gap: 8px;"><i class="fa-solid fa-building-user"></i> Contact Office</h3>
                        <p style="font-size: 14.5px; line-height: 1.7; color: rgba(255,255,255,0.9); margin-bottom: 20px;">
                            <strong style="color: #ffffff; font-size: 16px;">Rudraansh Yatra Headquarters</strong><br>
                            1st Floor Above Maniram Punetha & Sons,<br>
                            Simalgair Bazaar, Pithoragarh,<br>
                            Uttarakhand - 262501, India
                        </p>
                        <p style="font-size: 14px; margin-bottom: 12px;"><i class="fa-solid fa-phone" style="color: var(--color-gold); margin-right: 8px;"></i> <a href="tel:+917617617651" style="color: #ffffff; text-decoration: underline;">+91 7617617651</a></p>
                        <p style="font-size: 14px;"><i class="fa-solid fa-envelope" style="color: var(--color-gold); margin-right: 8px;"></i> <a href="mailto:info@rudraanshyatra.com" style="color: #ffffff; text-decoration: underline;">info@rudraanshyatra.com</a></p>
                    </div>
                    <a href="https://www.google.com/maps/place/?q=place_id:ChIJUaOjOEsloTkRjOLS3RK_S_A" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="margin-top: 24px; text-align: center; justify-content: center; background-color: var(--color-gold); color: #0f172a; font-weight: 700;">
                        <i class="fa-solid fa-map-location-dot"></i> Open in Google Maps
                    </a>
                </div>
                <div style="border-radius: 16px; overflow: hidden; border: 1px solid var(--glass-border); min-height: 320px; box-shadow: var(--shadow-md);">
                    <iframe title="Rudraansh Yatra Office Map" src="https://maps.google.com/maps?q=29.5855307,80.212559&z=17&output=embed" width="100%" height="100%" style="border:0; min-height: 320px;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                </div>
            </div>
        </div>
    </section>

`;

if (!html.includes('office-location-section')) {
  html = html.replace('<section class="payment-methods-section">', mapSection + '    <section class="payment-methods-section">');
  fs.writeFileSync('about.html', html, 'utf8');
  console.log('Map section successfully added to about.html!');
} else {
  console.log('Map section already present in about.html.');
}
