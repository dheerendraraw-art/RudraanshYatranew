$f = 'index.html'
$c = [System.IO.File]::ReadAllText($f)

# Diagnose what's in the Khaliya section and GA4 section
$lines = $c -split "`r?`n"

Write-Host "=== Khaliya section (lines 1177-1200) ==="
for ($i = 1176; $i -lt 1200; $i++) {
    Write-Host "$($i+1): $($lines[$i])"
}

Write-Host ""
Write-Host "=== GA4 head section (lines 4-18) ==="
for ($i = 3; $i -lt 18; $i++) {
    Write-Host "$($i+1): $($lines[$i])"
}
