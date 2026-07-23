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

  // 1. Footer address item replacement: wrap whole li content in link to Google Maps
  const footerRegex = /<li>\s*<i class="fa-solid fa-location-dot"><\/i>\s*<span>1st Floor Above Punetha Bookstore,<br>Simailgair Bazaar, Pithoragarh,<br>Uttarakhand - 262501<br><a href="https:\/\/maps\.google\.com\/\?q=H6P7%2B62\+Pithoragarh,\+Uttarakhand"[\s\S]*?<\/span>\s*<\/li>/gi;

  const newFooterItem = `<li>
                        <a href="https://maps.google.com/?q=H6P7%2B62+Pithoragarh,+Uttarakhand" target="_blank" rel="noopener noreferrer" style="display: flex; gap: 12px; color: inherit; text-decoration: none;" title="Open Office Location in Google Maps">
                            <i class="fa-solid fa-location-dot" style="margin-top: 4px; color: var(--color-gold);"></i>
                            <span>1st Floor Above Punetha Bookstore,<br>Simailgair Bazaar, Pithoragarh,<br>Uttarakhand - 262501<br><span style="color: var(--color-gold); font-size: 12.5px; font-weight: 600; text-decoration: underline; display: inline-block; margin-top: 4px;"><i class="fa-solid fa-location-crosshairs" style="font-size: 11px; margin-right: 4px;"></i> H6P7+62 Pithoragarh, Uttarakhand</span></span>
                        </a>
                    </li>`;

  if (footerRegex.test(html)) {
    html = html.replace(footerRegex, newFooterItem);
  }

  // 2. Top-bar address replacement: wrap address text in link to Google Maps
  const topBarOld = `<span><i class="fa-solid fa-location-dot"></i> 1st Floor Above Punetha Bookstore, Simailgair Bazaar, Pithoragarh (H6P7+62)</span>`;
  const topBarNew = `<span><i class="fa-solid fa-location-dot"></i> <a href="https://maps.google.com/?q=H6P7%2B62+Pithoragarh,+Uttarakhand" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;" title="Open Office Location in Google Maps">1st Floor Above Punetha Bookstore, Simailgair Bazaar, Pithoragarh (H6P7+62)</a></span>`;

  if (html.includes(topBarOld)) {
    html = html.replace(topBarOld, topBarNew);
  }

  fs.writeFileSync(f, html, 'utf8');
  console.log(`UPDATED: ${f}`);
});

console.log('\nAll addresses are now fully clickable and open Google Maps!');
