const fs = require('fs');
const files = [
  'mostamanu-temple-pithoragarh.html',
  'manokamna-temple.html',
  'kamakhya-devi-temple-pithoragarh.html',
  'kali-mata-temple-kalapani.html',
  'kainchi-dham.html',
  'jageshwar-dham.html',
  'chitai-golu-devta.html'
];

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  const before = c;
  // Add LocalBusiness to TouristAttraction+HinduTemple schema types
  c = c.replace(
    '"@type":["TouristAttraction","HinduTemple"]',
    '"@type":["LocalBusiness","TouristAttraction","HinduTemple"]'
  );
  // Add LocalBusiness to TouristAttraction+LandmarksOrHistoricalBuildings schema types
  c = c.replace(
    '"@type":["TouristAttraction","LandmarksOrHistoricalBuildings"]',
    '"@type":["LocalBusiness","TouristAttraction","LandmarksOrHistoricalBuildings"]'
  );
  fs.writeFileSync(f, c, 'utf8');
  const changed = c !== before ? 'CHANGED' : 'no change';
  console.log(f + ': ' + changed);
});
