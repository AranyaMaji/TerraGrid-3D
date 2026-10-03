// One-off: OSM → data/pois.geojson (named schools + aged care inside every city box). Run: node scripts/fetch-pois.mjs
// Uses Nominatim's [key=value] search (Overpass was down when this was baked); 2x2 tiles per box beat its 50-result cap.
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

// [W, S, E, N], same boxes as CITIES in main.js.
const BOXES = {
  parramatta: [150.955, -33.850, 151.045, -33.785],
  melbourne: [144.930, -37.833, 144.977, -37.791],
  london: [-0.131, 51.500, -0.069, 51.530],
  sydney: [151.196, -33.893, 151.220, -33.852],
  suva: [178.417, -18.158, 178.455, -18.124],
};
const TAGS = { 'amenity=school': 'school', 'amenity=nursing_home': 'Residential aged care',
  'social_facility=nursing_home': 'Residential aged care', 'social_facility=assisted_living': 'Assisted living',
  // Most aged care is only tagged amenity=social_facility (shared with shelters, food banks), so these are name-filtered.
  'amenity=social_facility': 'Residential aged care', 'aged care': 'Residential aged care' };
const AGED = /aged|nursing|lodge|care home|senior|retire|veteran|manor|uniting|bupa|anglicare|opal|regis|bolton|arcare|whiddon|hammond|baptistcare|estia|mercy|northcourt/i;
// amenity=school also tags tutoring, driving, dance and preschools.
const IS_SCHOOL = /school|college|academy|grammar|primary|high\b|lyc[eé]e/i;
const NOT_SCHOOL = /tutor|coach|kumon|matrix|edu-kingdom|driving|dance|music|swim|ballet|english|language|ielts|business|training|preschool|kindergarten|child ?care|early learning|university|tafe/i;

const get = (u) => { execFileSync('node', ['-e', 'setTimeout(()=>{},1100)']); // Nominatim policy: 1 req/s
  return JSON.parse(execFileSync('curl', ['-s', '-A', 'TerraGrid3D-hackathon/0.1', u], { encoding: 'utf8' })); };

const features = [];
for (const [city, [W, S, E, N]] of Object.entries(BOXES)) {
  const seen = new Set(), mx = (W + E) / 2, my = (S + N) / 2;
  for (const [tag, kind0] of Object.entries(TAGS))
    for (const [w, s, e, n] of [[W, S, mx, my], [mx, S, E, my], [W, my, mx, N], [mx, my, E, N]])
      for (const r of get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(tag.includes('=') ? `[${tag}]` : tag)}&viewbox=${w},${n},${e},${s}&bounded=1&limit=50&format=jsonv2&addressdetails=1`)) {
        const name = r.name, x = +r.lon, y = +r.lat, school = kind0 === 'school';
        if (!name || seen.has(name) || x < W || x > E || y < S || y > N) continue;
        if (school && (!IS_SCHOOL.test(name) || NOT_SCHOOL.test(name))) continue;
        if (!school && (!AGED.test(name) || /in.home|provider/i.test(name))) continue;
        // Same site under two names/elements (e.g. "Northcourt" and "Northcourt Aged Care"): keep the first within ~60 m.
        if (features.some(({ geometry: { coordinates: [u, v] } }) => Math.hypot(u - x, v - y) < 0.0006)) continue;
        seen.add(name);
        const kind = !school ? kind0 : /primary|public school|infant|junior|elementary/i.test(name) ? 'Primary school'
          : /high|secondary|college|grammar/i.test(name) ? 'Secondary school' : 'School';
        features.push({ type: 'Feature', properties: { city, type: school ? 'school' : 'aged', name, kind, street: r.address?.road || '' },
          geometry: { type: 'Point', coordinates: [+x.toFixed(5), +y.toFixed(5)] } });
      }
  console.log(city, features.filter((f) => f.properties.city === city).length);
}
writeFileSync('data/pois.geojson', `{"type":"FeatureCollection","features":[\n${features.map((f) => JSON.stringify(f)).join(',\n')}\n]}\n`);
