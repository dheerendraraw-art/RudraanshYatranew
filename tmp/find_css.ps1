$c = [System.IO.File]::ReadAllText('index.html')
$lines = $c -split "`r?`n"
for ($i = 0; $i -lt $lines.Count; $i++) {
    $l = $lines[$i]
    if ($l -match 'hero-section|card-desc|section-padding|wizard-summary-bar|blog-carousel-track|gallery-link|nav-link.*gallery') {
        $short = if ($l.Trim().Length -gt 120) { $l.Trim().Substring(0, 120) } else { $l.Trim() }
        Write-Host "$($i+1): $short"
    }
}
