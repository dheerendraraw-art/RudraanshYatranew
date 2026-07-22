const fs = require('fs');
const pages = ['index.html','adi-kailash.html','khaliya-top.html','mt-kailash.html','darma-valley.html','about.html','gallery.html','blogs.html','whats-included.html'];
pages.forEach(p => {
  if (!fs.existsSync(p)) { console.log(p + ': NOT FOUND'); return; }
  const html = fs.readFileSync(p, 'utf8');
  const checks = {
    title: /<title>/i.test(html),
    metaDesc: /name="description"/i.test(html),
    canonical: /rel="canonical"/i.test(html),
    ogTitle: /property="og:title"/i.test(html),
    ogDesc: /property="og:description"/i.test(html),
    ogImage: /property="og:image"/i.test(html),
    ogUrl: /property="og:url"/i.test(html),
    twitterCard: /name="twitter:card"/i.test(html),
    schemaJSON: /application\/ld\+json/i.test(html),
    h1Tag: (html.match(/<h1/gi) || []).length === 1,
  };
  console.log('\n' + p);
  Object.entries(checks).forEach(function(e) {
    var k = e[0]; var v = e[1];
    console.log('  ' + (v ? 'PASS' : 'FAIL') + ' | ' + k);
  });
});
