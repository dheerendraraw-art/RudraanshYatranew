$f = 'blog/adi-kailash-permits-open-first-batch-completes-yatra-september-2026.html'
$c = [System.IO.File]::ReadAllText($f)
if ($c -like '*width:85px!important*') { Write-Host 'INLINE STYLE FIX: OK' } else { Write-Host 'INLINE STYLE FIX: NOT FOUND' }
if ($c -like '*width: 85px !important*') { Write-Host 'CSS FIX: OK' } else { Write-Host 'CSS FIX: NOT FOUND' }
if ($c -like '*GA4 deferred*') { Write-Host 'GA4 DEFER: OK' } else { Write-Host 'GA4 DEFER: NOT FOUND' }
if ($c -like '*google-analytics*') { Write-Host 'WARNING: GA4 still in head' }
