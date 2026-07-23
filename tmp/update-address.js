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

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let html = fs.readFileSync(f, 'utf8');

  // 1. Update Footer Contact Address
  const oldFooterAddress = `<span>1st Floor Above Punetha Bookstore,<br>Simailgair Bazaar, Pithoragarh, Uttarakhand - 262501</span>`;
  const newFooterAddress = `<span>1st Floor Above Punetha Bookstore,<br>Simailgair Bazaar, Pithoragarh,<br>Uttarakhand - 262501<br><a href="https://maps.google.com/?q=H6P7%2B62+Pithoragarh,+Uttarakhand" target="_blank" rel="noopener noreferrer" style="color: var(--color-gold); font-size: 12.5px; font-weight: 600; text-decoration: underline; display: inline-block; margin-top: 4px;"><i class="fa-solid fa-location-crosshairs" style="font-size: 11px; margin-right: 4px;"></i> H6P7+62 Pithoragarh, Uttarakhand</a></span>`;

  if (html.includes(oldFooterAddress)) {
    html = html.replace(oldFooterAddress, newFooterAddress);
  }

  // 2. Update Schema JSON-LD streetAddress
  const oldSchemaAddress = `"streetAddress": "1st Floor Above Punetha Bookstore, Simailgair Bazaar",`;
  const newSchemaAddress = `"streetAddress": "1st Floor Above Punetha Bookstore, Simailgair Bazaar (Plus Code: H6P7+62)",\n          "hasMap": "https://maps.google.com/?q=H6P7%2B62+Pithoragarh,+Uttarakhand",`;

  if (html.includes(oldSchemaAddress)) {
    html = html.replace(oldSchemaAddress, newSchemaAddress);
  }

  // 3. Update top-bar address span
  const oldTopBarAddress = `<span><i class="fa-solid fa-location-dot"></i> 1st Floor Above Punetha Bookstore, Simailgair Bazaar, Pithoragarh</span>`;
  const newTopBarAddress = `<span><i class="fa-solid fa-location-dot"></i> 1st Floor Above Punetha Bookstore, Simailgair Bazaar, Pithoragarh (H6P7+62)</span>`;

  if (html.includes(oldTopBarAddress)) {
    html = html.replace(oldTopBarAddress, newTopBarAddress);
  }

  fs.writeFileSync(f, html, 'utf8');
  console.log(`UPDATED: ${f}`);
});

// Update server.js PDF generation text
if (fs.existsSync('server.js')) {
  let serverCode = fs.readFileSync('server.js', 'utf8');
  const oldPdfAddress = `.text('Uttarakhand - 262501', 320, 62, { align: 'right', width: 225 })`;
  const newPdfAddress = `.text('Uttarakhand - 262501 (H6P7+62)', 320, 62, { align: 'right', width: 225 })`;
  if (serverCode.includes(oldPdfAddress)) {
    serverCode = serverCode.replace(oldPdfAddress, newPdfAddress);
    fs.writeFileSync('server.js', serverCode, 'utf8');
    console.log('UPDATED: server.js');
  }
}

console.log('\nAddress update completed successfully!');
