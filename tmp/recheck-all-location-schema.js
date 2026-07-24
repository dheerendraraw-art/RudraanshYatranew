const fs = require('fs');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
const mapsUrl = 'https://www.google.com/maps/place/?q=place_id:ChIJUaOjOEsloTkRjOLS3RK_S_A';

files.forEach(f => {
  let html = fs.readFileSync(f, 'utf8');
  let modified = false;

  // 1. Ensure GeoCoordinates are exact
  if (html.includes('"GeoCoordinates"')) {
    if (!html.includes('"latitude": 29.5855307')) {
      html = html.replace(/"latitude":\s*[\d\.]+/g, '"latitude": 29.5855307');
      modified = true;
    }
    if (!html.includes('"longitude": 80.212559')) {
      html = html.replace(/"longitude":\s*[\d\.]+/g, '"longitude": 80.212559');
      modified = true;
    }
    if (!html.includes('"hasMap"')) {
      html = html.replace(
        `"longitude": 80.212559\n          }`,
        `"longitude": 80.212559\n          },\n          "hasMap": "${mapsUrl}"`
      );
      modified = true;
    }
  }

  // 2. Ensure address street address is updated
  if (html.includes('"streetAddress"')) {
    html = html.replace(
      /"streetAddress": "[^"]*"/g,
      `"streetAddress": "1st Floor Above Maniram Punetha & Sons, Simalgair Bazaar"`
    );
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(f, html, 'utf8');
    console.log(`RECHECK & UPDATED: ${f}`);
  } else {
    console.log(`VERIFIED CLEAN: ${f}`);
  }
});
