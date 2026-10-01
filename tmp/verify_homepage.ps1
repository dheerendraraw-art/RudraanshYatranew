$f = 'index.html'
$c = [System.IO.File]::ReadAllText($f)

$checks = @(
    @{ name = 'Reviews heading fixed';         pattern = 'What Our Yatris Say' },
    @{ name = 'Khaliya pricing rows added';    pattern = 'From Pithoragarh.*9,500' },
    @{ name = 'modified_time updated';         pattern = '2026-09-26T14:00' },
    @{ name = 'GA4 removed from head';         pattern = 'GA4 deferred to window' },
    @{ name = 'GA4 deferred to body';          pattern = 'addEventListener.*load.*gtag' },
    @{ name = 'Summary bar hidden';            pattern = 'wizard-summary-bar.*opacity:0' },
    @{ name = 'CSS overrides injected';        pattern = 'HOMEPAGE FIX OVERRIDES' },
    @{ name = 'card-desc left align';          pattern = 'card-desc.*text-align: left' },
    @{ name = 'About section padding fix';     pattern = 'about-operator.*padding-bottom: 48px' },
    @{ name = 'Blog section gap fix';          pattern = 'homepage-blogs.*section-header.*margin-bottom' },
    @{ name = 'Gallery nav override';          pattern = 'nav-link\[href="gallery"\]' },
    @{ name = 'showSummaryBar JS';             pattern = 'showSummaryBar' }
)

foreach ($check in $checks) {
    if ($c -match $check.pattern) {
        Write-Host "✅ $($check.name)"
    } else {
        Write-Host "❌ $($check.name) - NOT FOUND"
    }
}
