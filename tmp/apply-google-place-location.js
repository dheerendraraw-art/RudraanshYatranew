const fs = require('fs');

const files = [
  'about.html',
  'adi-kailash.html',
  'blog.html',
  'blogs.html',
  'darma-valley.html',
  'gallery.html',
  'index.html',
  'khaliya-top.html',
  'mt-kailash.html',
  'panchachuli.html',
  'payment.html',
  'whats-included.html'
];

const mapsUrl = 'https://www.google.com/maps/place/?q=place_id:ChIJUaOjOEsloTkRjOLS3RK_S_A';

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let html = fs.readFileSync(f, 'utf8');

  // 1. Update Footer Contact Item
  const footerAddressOld = /<li>\s*<i class="fa-solid fa-location-dot"><\/i>\s*<span>1st Floor Above Punetha Bookstore,<br>Simailgair Bazaar, Pithoragarh, Uttarakhand - 262501<\/span>\s*<\/li>/gi;
  const footerAddressNew = `<li>
                        <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" style="display: flex; gap: 12px; color: inherit; text-decoration: none;" title="Open Rudraansh Yatra Office in Google Maps">
                            <i class="fa-solid fa-location-dot" style="margin-top: 4px; color: var(--color-gold);"></i>
                            <span>1st Floor Above Maniram Punetha & Sons,<br>Simalgair Bazaar, Pithoragarh,<br>Uttarakhand - 262501</span>
                        </a>
                    </li>`;

  if (footerAddressOld.test(html)) {
    html = html.replace(footerAddressOld, footerAddressNew);
  }

  // 2. Update Top Bar Address
  const topBarOld = `<span><i class="fa-solid fa-location-dot"></i> 1st Floor Above Punetha Bookstore, Simailgair Bazaar, Pithoragarh</span>`;
  const topBarNew = `<span><i class="fa-solid fa-location-dot"></i> <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;" title="Open Office Location in Google Maps">1st Floor Above Maniram Punetha & Sons, Simalgair Bazaar, Pithoragarh</a></span>`;

  if (html.includes(topBarOld)) {
    html = html.replace(topBarOld, topBarNew);
  }

  // 3. Update Geo Coordinates & address in Schema JSON-LD
  if (html.includes('"addressLocality": "Pithoragarh"')) {
    html = html.replace(
      /"streetAddress": "[^"]*"/g,
      `"streetAddress": "1st Floor Above Maniram Punetha & Sons, Simalgair Bazaar"`
    );

    // Update lat/lng
    html = html.replace(
      /"latitude":\s*29\.\d+/g,
      `"latitude": 29.5855307`
    );
    html = html.replace(
      /"longitude":\s*80\.\d+/g,
      `"longitude": 80.212559`
    );

    // Add hasMap if not present
    if (!html.includes('"hasMap"')) {
      html = html.replace(
        `"addressCountry": "IN"\n      },`,
        `"addressCountry": "IN"\n      },\n      "hasMap": "${mapsUrl}",`
      );
    }
  }

  fs.writeFileSync(f, html, 'utf8');
  console.log(`UPDATED: ${f}`);
});

// Update server.js PDF generation address
if (fs.existsSync('server.js')) {
  let serverCode = fs.readFileSync('server.js', 'utf8');
  serverCode = serverCode
    .replace('1st Floor Above Punetha Bookstore,', '1st Floor Above Maniram Punetha & Sons,')
    .replace('Simailgair Bazaar, Pithoragarh,', 'Simalgair Bazaar, Pithoragarh,');
  fs.writeFileSync('server.js', serverCode, 'utf8');
  console.log('UPDATED: server.js PDF address');
}

console.log('\nAll files updated with official Google Place ID & coordinates!');
