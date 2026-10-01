$f = 'index.html'
$c = [System.IO.File]::ReadAllText($f)

Write-Host "Original length: $($c.Length)"

# =============================================================
# FIX 1: Grammar — "Feedbacks" → "What Our Yatris Say"
# =============================================================
$c = $c.Replace(
    '<h2 class="reviews-section-title">We Appreciate Our Customers Feedbacks!</h2>',
    '<h2 class="reviews-section-title">What Our Yatris Say</h2>'
)
Write-Host "Fix 1 (reviews heading): done"

# =============================================================
# FIX 2: Khaliya Top card — add pricing rows (before card-footer)
# =============================================================
$oldKhaliya = '<p class="card-desc" itemprop="description">Walk through rhododendron forests to the grand alpine Bugyals of Munsiyari.
                            Enjoy a 360-degree panorama of the Panchachuli peaks.</p>
                        <div class="card-footer" itemprop="offers" itemscope itemtype="https://schema.org/Product">'

$newKhaliya = '<p class="card-desc" itemprop="description">Walk through rhododendron forests to the grand alpine Bugyals of Munsiyari. Enjoy a 360-degree panorama of the Panchachuli peaks.</p>
                        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px;">
                            <a href="khaliya-top" style="display:flex;justify-content:space-between;align-items:center;padding:7px 10px;border-radius:6px;border:1px solid rgba(10,25,47,.08);text-decoration:none;color:var(--color-primary);font-size:12.5px;font-weight:600;background:#f8f9fc;">
                                <span><i class="fa-solid fa-location-dot" style="color:var(--color-gold);margin-right:5px;"></i>From Pithoragarh</span>
                                <span style="color:var(--color-gold);font-weight:700;">&#8377;9,500 &middot; 4D &rarr;</span>
                            </a>
                            <a href="khaliya-top" style="display:flex;justify-content:space-between;align-items:center;padding:7px 10px;border-radius:6px;border:1px solid rgba(10,25,47,.08);text-decoration:none;color:var(--color-primary);font-size:12.5px;font-weight:600;background:#f8f9fc;">
                                <span><i class="fa-solid fa-train" style="color:var(--color-gold);margin-right:5px;"></i>From Kathgodam</span>
                                <span style="color:var(--color-gold);font-weight:700;">&#8377;18,000 &middot; 5D &rarr;</span>
                            </a>
                            <a href="khaliya-top" style="display:flex;justify-content:space-between;align-items:center;padding:7px 10px;border-radius:6px;border:1px solid rgba(10,25,47,.08);text-decoration:none;color:var(--color-primary);font-size:12.5px;font-weight:600;background:#f8f9fc;">
                                <span><i class="fa-solid fa-city" style="color:var(--color-gold);margin-right:5px;"></i>From Delhi NCR</span>
                                <span style="color:var(--color-gold);font-weight:700;">&#8377;22,000 &middot; 5D &rarr;</span>
                            </a>
                        </div>
                        <div class="card-footer" itemprop="offers" itemscope itemtype="https://schema.org/Product">'

$c = $c.Replace($oldKhaliya, $newKhaliya)
Write-Host "Fix 2 (Khaliya Top pricing rows): done"

# =============================================================
# FIX 3: article:modified_time — update to today
# =============================================================
$c = $c.Replace(
    'content="2026-08-25T14:00:00+05:30"',
    'content="2026-09-26T14:00:00+05:30"'
)
Write-Host "Fix 3 (modified_time): done"

# =============================================================
# FIX 4: GA4 deferred — move from head to bottom of body
# =============================================================
$oldGA4 = '    <!-- ===== Google Analytics 4 ===== -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-3CGY0WCBBJ"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag(''js'', new Date());
        gtag(''config'', ''G-3CGY0WCBBJ'', {
            ''send_page_view'': true,
            ''cookie_flags'': ''SameSite=None;Secure''
        });
    </script>
    <!-- ===== End Google Analytics 4 ===== -->'
$c = $c.Replace($oldGA4, '    <!-- GA4 deferred to window.onload — see bottom of body -->')
Write-Host "Fix 4a (GA4 removed from head): done"

# Add deferred GA4 before </body>
$c = $c.Replace(
    '</body>',
    '    <!-- ===== Google Analytics 4 (deferred) ===== -->
    <script>
        window.addEventListener(''load'', function() {
            var s = document.createElement(''script'');
            s.async = true;
            s.src = ''https://www.googletagmanager.com/gtag/js?id=G-3CGY0WCBBJ'';
            document.head.appendChild(s);
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag(''js'', new Date());
            gtag(''config'', ''G-3CGY0WCBBJ'', { ''send_page_view'': true, ''cookie_flags'': ''SameSite=None;Secure'' });
        });
    </script>
    <!-- ===== End GA4 ===== -->
</body>'
)
Write-Host "Fix 4b (GA4 deferred to body): done"

# =============================================================
# FIX 5: Trip Planner summary bar — hide by default with opacity
# =============================================================
$c = $c.Replace(
    '<div class="wizard-summary-bar">',
    '<div class="wizard-summary-bar" style="opacity:0;transition:opacity 0.4s ease;" id="wizard-summary-bar-el">'
)
Write-Host "Fix 5 (trip planner summary bar hidden): done"

# =============================================================
# FIX 6: About section — reduce excessive bottom padding
# =============================================================
$c = $c.Replace(
    '<section id="about-operator" aria-label="About Rudraansh Yatra - Expertise and Experience" class="section-padding" style=',
    '<section id="about-operator" aria-label="About Rudraansh Yatra - Expertise and Experience" class="section-padding" data-compact-bottom="true" style='
)
Write-Host "Fix 6 (about section marker): done"

# =============================================================
# FIX 7: Gallery nav item — remove any active/current styling
# The gallery link has class="nav-link" same as others, 
# check if CSS is adding gold color to it specifically
# =============================================================
# (Gallery nav highlight likely comes from CSS .nav-link[href="gallery"] or JS — 
# we'll add a specific override in the <style> block at end of head)

# =============================================================
# FIX 8: Reviews heading done in Fix 1
# FIX 9: Starting From redundant label — keep it (it's used by schema)
# =============================================================

# =============================================================
# FIX 10: Add comprehensive CSS overrides inline before </head>
# =============================================================
$cssOverrides = '    <style>
        /* ===== HOMEPAGE FIX OVERRIDES (Sep 26 2026) ===== */

        /* FIX: card-desc text should be left-aligned, not justify */
        .card-desc { text-align: left !important; }

        /* FIX: Why Choose Us cards — equal heights */
        .features-grid .feature-box,
        .grid-3 .feature-box {
            display: flex !important;
            flex-direction: column !important;
            min-height: 260px !important;
        }

        /* FIX: About section — reduce dead space below buttons */
        #about-operator { padding-bottom: 48px !important; }

        /* FIX: Blog section — reduce gap between header and cards */
        #homepage-blogs .section-header { margin-bottom: 24px !important; }
        #homepage-blogs .blog-carousel-wrapper { margin-top: 0 !important; }

        /* FIX: Hero on mobile — lighten overlay so mountain shows through */
        @media (max-width: 768px) {
            .hero::before {
                opacity: 0.42 !important;
            }
            /* Compact mobile hero badge pills */
            .hero-desc > span span {
                font-size: 11px !important;
                padding: 3px 8px !important;
            }
        }

        /* FIX: Certifications section — reduce excessive padding */
        section[aria-label*="Certifications"] {
            padding-top: 56px !important;
            padding-bottom: 56px !important;
        }

        /* FIX: Gallery nav should not appear active/gold on homepage */
        header nav .nav-link[href="gallery"] {
            color: var(--color-primary) !important;
            border-bottom: none !important;
        }
        header nav .nav-link[href="gallery"]:hover {
            color: var(--color-gold) !important;
        }

        /* FIX: Wizard summary bar — show only when has content */
        .wizard-summary-bar {
            transition: opacity 0.4s ease;
        }

        /* FIX: Khaliya Top card description — ensure no stray newlines cause layout break */
        .card-desc {
            -webkit-hyphens: none !important;
            hyphens: none !important;
        }

        /* FIX: Reviews section heading alignment */
        .reviews-section-title {
            font-size: clamp(1.6rem, 3vw, 2.2rem) !important;
        }

        /* FIX: Section padding bottom for about */
        #about-operator.section-padding {
            padding-bottom: 48px !important;
        }
    </style>
</head>'

$c = $c.Replace('</head>', $cssOverrides)
Write-Host "Fix 10 (CSS overrides injected): done"

# =============================================================
# FIX 11: Trip planner JS — show summary bar when destination is selected
# =============================================================
# Find the wizard JS to inject the show logic
$wizardShowJs = '
        // Show summary bar when user starts interacting
        function showSummaryBar() {
            var bar = document.getElementById(''wizard-summary-bar-el'');
            if (bar) bar.style.opacity = ''1'';
        }
        document.addEventListener(''DOMContentLoaded'', function() {
            var destCards = document.querySelectorAll(''.dest-select-card'');
            destCards.forEach(function(c) { c.addEventListener(''click'', showSummaryBar); });
        });'

# Inject right before the closing wizard JS section
$c = $c.Replace('// Show summary bar when user starts interacting', '// already injected')
# Only inject if not already present
if ($c -notlike '*showSummaryBar*') {
    $c = $c.Replace('</body>', "    <script>$wizardShowJs</script>`n</body>")
    Write-Host "Fix 11 (wizard show summary bar JS): done"
} else {
    Write-Host "Fix 11 (wizard show summary bar JS): already present, skipped"
}

[System.IO.File]::WriteAllText($f, $c, [System.Text.Encoding]::UTF8)
Write-Host "All fixes written. New length: $($c.Length)"
