$f = 'blog/adi-kailash-permits-open-first-batch-completes-yatra-september-2026.html'
$c = [System.IO.File]::ReadAllText($f)

# Fix 1: author-bio-img CSS - add !important to width and height so global img rules don't override
$oldCss = '.author-bio-img {
            width: 85px;
            height: 85px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid var(--color-gold);
            flex-shrink: 0;
        }'
$newCss = '.author-bio-img {
            width: 85px !important;
            height: 85px !important;
            min-width: 85px !important;
            min-height: 85px !important;
            max-width: 85px !important;
            max-height: 85px !important;
            border-radius: 50% !important;
            object-fit: cover !important;
            border: 2px solid var(--color-gold) !important;
            flex-shrink: 0 !important;
        }'
$c = $c.Replace($oldCss, $newCss)

# Fix 2: author bio img HTML - add explicit width/height attributes
$oldImg = '<img src="/assets/images/dheerendra-rautela.webp" alt="Dheerendra Rautela - Lead Expedition Guide" class="author-bio-img" loading="lazy">'
$newImg = '<img src="/assets/images/dheerendra-rautela.webp" alt="Dheerendra Rautela - Lead Expedition Guide, Rudraansh Yatra" class="author-bio-img" width="85" height="85" loading="lazy" decoding="async" style="width:85px!important;height:85px!important;min-width:85px!important;max-width:85px!important;object-fit:cover!important;border-radius:50%!important;">'
$c = $c.Replace($oldImg, $newImg)

# Fix 3: Move GA4 to bottom (defer) - remove from head
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
$newGA4 = '    <!-- GA4 deferred - loaded at bottom for performance -->'
$c = $c.Replace($oldGA4, $newGA4)

# Fix 4: defer google translate script
$c = $c.Replace('<script type="text/javascript" src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>', '<script type="text/javascript" src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" defer></script>')

# Fix 5: Add deferred GA4 + Meta Pixel before </body>
$oldClose = '    <!-- ===== End Google Translate Init ===== -->
</body>'
$newClose = '    <!-- ===== End Google Translate Init ===== -->

    <!-- ===== Google Analytics 4 (deferred) ===== -->
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
$c = $c.Replace($oldClose, $newClose)

[System.IO.File]::WriteAllText($f, $c)
Write-Host "All fixes applied."
