$f = 'blog/adi-kailash-ilp-date-revised-to-september-20-2026-updated-from-sept-15.html'
$c = [System.IO.File]::ReadAllText($f)

# 1. Add keywords and robots meta after description
$oldDesc = '<meta name="description" content="Breaking Update: Online ILP for Adi Kailash &amp; Om Parvat is revised to Sept 20, 2026 from Sept 15 due to rains. Check Dharchula permit status &amp; route advisory.">'
$newDesc = $oldDesc + "`r`n    " + '<meta name="keywords" content="Adi Kailash ILP date 2026, inner line permit Dharchula, SDM Dharchula September 20, Om Parvat permit update, Adi Kailash route status">' + "`r`n    " + '<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">' + "`r`n    " + '<meta name="author" content="Dheerendra Rautela">'
$c = $c.Replace($oldDesc, $newDesc)

# 2. Deduplicate preconnect tags - remove the duplicates in original
$oldPreconnect = "    <!-- Google Fonts Preconnect &amp; Fonts -->
    <link rel=""preconnect"" href=""https://fonts.googleapis.com"">
    <link rel=""preconnect"" href=""https://fonts.gstatic.com"" crossorigin>
        <!-- Google Fonts: Preconnect + Async Non-blocking Load -->
    <link rel=""preconnect"" href=""https://fonts.googleapis.com"">
    <link rel=""preconnect"" href=""https://fonts.gstatic.com"" crossorigin>"
$newPreconnect = "    <!-- Google Fonts Preconnect (deduplicated) -->
    <link rel=""preconnect"" href=""https://fonts.googleapis.com"">
    <link rel=""preconnect"" href=""https://fonts.gstatic.com"" crossorigin>"
$c = $c.Replace($oldPreconnect, $newPreconnect)

# 3. Update dateModified in schema
$c = $c.Replace('"dateModified": "2026-09-14T16:30:00+05:30"', '"dateModified": "2026-09-20T09:00:00+05:30"')

[System.IO.File]::WriteAllText($f, $c)
Write-Host "All optimizations applied."
