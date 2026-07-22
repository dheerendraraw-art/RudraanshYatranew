const fs = require('fs');

// Page config: canonical URL, OG title, OG description, OG image
const pages = [
  {
    file: 'index.html',
    canonical: 'https://rudraanshyatra.com/',
    ogType: 'website',
    ogTitle: 'Rudraansh Yatra - Adi Kailash, Om Parvat & Kumaon Eco-Treks',
    ogDesc: 'Explore Adi Kailash, Om Parvat, and Darma Valley with Rudraansh Yatra — a hyper-local ground operator in Pithoragarh. Direct execution, local homestays, zero middlemen.',
    ogImage: 'https://rudraanshyatra.com/assets/images/adi-kailash-hero.webp',
    twitterTitle: 'Rudraansh Yatra - Sacred Himalayan Yatras & Treks',
    twitterDesc: 'Book Adi Kailash, Om Parvat, Darma Valley & Khaliya Top with Pithoragarh\'s local ground operators. Direct bookings, local homestays.',
  },
  {
    file: 'adi-kailash.html',
    canonical: 'https://rudraanshyatra.com/adi-kailash',
    ogType: 'website',
    ogTitle: 'Adi Kailash & Om Parvat Yatra - Rudraansh Yatra | Pithoragarh Ground Operator',
    ogDesc: 'Embark on the sacred Adi Kailash & Om Parvat Yatra from Pithoragarh. 6-day itinerary, Inner Line Permits handled. Direct local execution with 4x4 Bolero and community homestays.',
    ogImage: 'https://rudraanshyatra.com/assets/images/adi-kailash-parvat.webp',
    twitterTitle: 'Adi Kailash & Om Parvat Yatra | Pithoragarh Operator',
    twitterDesc: 'Sacred pilgrimage to Adi Kailash & Om Parvat in Vyas Valley. Permits handled, 4x4 transport, local homestays from Pithoragarh.',
  },
  {
    file: 'khaliya-top.html',
    canonical: 'https://rudraanshyatra.com/khaliya-top',
    ogType: 'website',
    ogTitle: 'Khaliya Top Trek - Munsiyari Alpine Meadow Trek | Rudraansh Yatra',
    ogDesc: 'Trek to Khaliya Top (3,500m) in Munsiyari for panoramic views of Panchachuli peaks. 4-day alpine meadow trek with local guides, rhododendron forests, and border village homestays.',
    ogImage: 'https://rudraanshyatra.com/assets/images/khaliya-top.webp',
    twitterTitle: 'Khaliya Top Trek - Munsiyari | Rudraansh Yatra',
    twitterDesc: 'Trek through rhododendron forests to Khaliya Top in Munsiyari. Stunning Panchachuli panorama. 4 days from Pithoragarh.',
  },
  {
    file: 'mt-kailash.html',
    canonical: 'https://rudraanshyatra.com/mt-kailash',
    ogType: 'website',
    ogTitle: 'Mt. Kailash Yatra via Lipulekh Pass - Rudraansh Yatra | Tibet Pilgrimage',
    ogDesc: 'Ultimate spiritual pilgrimage to Mt. Kailash & Lake Manasarovar via Lipulekh Pass. 13-day cross-border yatra organized directly by local Pithoragarh ground operators. Price on request.',
    ogImage: 'https://rudraanshyatra.com/assets/images/Kailash.webp',
    twitterTitle: 'Mt. Kailash Yatra via Lipulekh | Rudraansh Yatra',
    twitterDesc: 'Sacred 13-day pilgrimage to Mt. Kailash & Lake Manasarovar via Lipulekh Pass. Organized by local experts in Pithoragarh.',
  },
  {
    file: 'darma-valley.html',
    canonical: 'https://rudraanshyatra.com/darma-valley',
    ogType: 'website',
    ogTitle: 'Darma Valley Exploration - Rung Tribal Culture Trek | Rudraansh Yatra',
    ogDesc: 'Explore Kumaon\'s most isolated Darma Valley. Trek through Rung tribal villages, glacial meadows, and Panchachuli viewpoints. 6-day offbeat expedition from Dharchula with local homestays.',
    ogImage: 'https://rudraanshyatra.com/assets/images/Panchacholi.webp',
    twitterTitle: 'Darma Valley Exploration | Offbeat Kumaon Trek',
    twitterDesc: 'Journey into Darma Valley — Kumaon\'s most isolated frontier. Rung villages, glacial trails, Panchachuli views. 6 days from Pithoragarh.',
  },
  {
    file: 'about.html',
    canonical: 'https://rudraanshyatra.com/about',
    ogType: 'website',
    ogTitle: 'About Rudraansh Yatra - Native Ground Operator in Pithoragarh, Uttarakhand',
    ogDesc: 'Rudraansh Yatra is a MSME-registered, NIDHI-certified local ground operator based in Pithoragarh. We run Adi Kailash, Darma Valley, and Khaliya Top tours directly — no middlemen, zero commissions.',
    ogImage: 'https://rudraanshyatra.com/assets/images/adi-kailash-hero.webp',
    twitterTitle: 'About Rudraansh Yatra | Local Pithoragarh Operator',
    twitterDesc: 'MSME-registered ground operator in Pithoragarh. Direct tours to Adi Kailash, Darma Valley, Khaliya Top. Zero middlemen.',
  },
  {
    file: 'gallery.html',
    canonical: 'https://rudraanshyatra.com/gallery',
    ogType: 'website',
    ogTitle: 'Himalayan Photo Gallery - Rudraansh Yatra | Kumaon Travel Diaries',
    ogDesc: 'Browse breathtaking photos from Adi Kailash, Om Parvat, Darma Valley, and Khaliya Top expeditions. Stunning Himalayan landscapes captured by Rudraansh Yatra\'s local ground team.',
    ogImage: 'https://rudraanshyatra.com/assets/images/gallery-hero.webp',
    twitterTitle: 'Himalayan Photo Gallery | Rudraansh Yatra',
    twitterDesc: 'Stunning photos from Adi Kailash, Om Parvat, Darma Valley and Khaliya Top expeditions in Kumaon Himalayas.',
  },
  {
    file: 'blogs.html',
    canonical: 'https://rudraanshyatra.com/blogs',
    ogType: 'website',
    ogTitle: 'Himalayan Travel Blog - Rudraansh Yatra | Kumaon & Uttarakhand Guides',
    ogDesc: 'Read in-depth travel guides, permit checklists, and local insights about Adi Kailash, Darma Valley, Khaliya Top, and Mt. Kailash from Rudraansh Yatra\'s native ground experts.',
    ogImage: 'https://rudraanshyatra.com/assets/images/adi-kailash-hero.webp',
    twitterTitle: 'Himalayan Travel Blog | Rudraansh Yatra',
    twitterDesc: 'Expert guides on Adi Kailash permits, Darma Valley routes, and Kumaon trekking from local Pithoragarh operators.',
  },
  {
    file: 'whats-included.html',
    canonical: 'https://rudraanshyatra.com/whats-included',
    ogType: 'website',
    ogTitle: "What's Included in Our Yatra Packages - Rudraansh Yatra | Transparent Pricing",
    ogDesc: 'Full breakdown of what\'s included in Rudraansh Yatra packages: 4x4 Bolero transport, Inner Line Permits, community homestays, Kumaoni meals, oxygen support. Zero hidden charges.',
    ogImage: 'https://rudraanshyatra.com/assets/images/adi-kailash-hero.webp',
    twitterTitle: "What's Included in Rudraansh Yatra Packages",
    twitterDesc: 'Complete package inclusions: 4x4 Bolero, Inner Line Permits, homestays, meals, oxygen support. Transparent pricing from Pithoragarh.',
  },
];

pages.forEach(function(page) {
  if (!fs.existsSync(page.file)) { console.log('SKIP: ' + page.file); return; }
  let html = fs.readFileSync(page.file, 'utf8');
  
  // Skip if already has canonical
  if (/rel="canonical"/i.test(html)) { console.log('ALREADY HAS CANONICAL: ' + page.file); return; }

  // Build the tags to inject
  const tags = [
    '    <!-- Canonical URL -->',
    '    <link rel="canonical" href="' + page.canonical + '">',
    '',
    '    <!-- Open Graph / Facebook / WhatsApp -->',
    '    <meta property="og:type" content="' + page.ogType + '">',
    '    <meta property="og:url" content="' + page.canonical + '">',
    '    <meta property="og:title" content="' + page.ogTitle + '">',
    '    <meta property="og:description" content="' + page.ogDesc + '">',
    '    <meta property="og:image" content="' + page.ogImage + '">',
    '    <meta property="og:image:width" content="1200">',
    '    <meta property="og:image:height" content="630">',
    '    <meta property="og:locale" content="en_IN">',
    '',
    '    <!-- Twitter Card -->',
    '    <meta name="twitter:card" content="summary_large_image">',
    '    <meta name="twitter:site" content="@RudraanshYatra">',
    '    <meta name="twitter:title" content="' + page.twitterTitle + '">',
    '    <meta name="twitter:description" content="' + page.twitterDesc + '">',
    '    <meta name="twitter:image" content="' + page.ogImage + '">',
    '',
    '    <!-- Robots / Indexing -->',
    '    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">',
  ].join('\n');

  // Insert right before </head> but also after og:site_name line
  // Find insertion point: after the og:site_name meta tag or after the last known meta tag before fonts
  html = html.replace(
    /(<link rel="icon"[^>]+>)/i,
    '$1\n' + tags
  );
  
  fs.writeFileSync(page.file, html, 'utf8');
  console.log('UPDATED: ' + page.file);
});

// Also add noindex to admin.html
if (fs.existsSync('admin.html')) {
  let html = fs.readFileSync('admin.html', 'utf8');
  if (!/name="robots"/i.test(html)) {
    html = html.replace(/<\/head>/i, '    <meta name="robots" content="noindex, nofollow">\n</head>');
    fs.writeFileSync('admin.html', html, 'utf8');
    console.log('UPDATED: admin.html (noindex)');
  }
}

console.log('\nDone!');
