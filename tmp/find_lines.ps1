$f = 'index.html'
$c = [System.IO.File]::ReadAllText($f)

# Find line numbers for key patterns
$lines = $c -split "`r?`n"
for ($i = 0; $i -lt $lines.Count; $i++) {
    $l = $lines[$i]
    if ($l -match 'feedbacks|Feedbacks|Starting From|modified_time|GALLERY|trip-planner|blog-cards-grid|hero-overlay|hero__overlay|certif-section|diaries-section|about-section|why-us-section|nav-link.*gallery') {
        Write-Host "$($i+1): $($l.Trim())"
    }
}
