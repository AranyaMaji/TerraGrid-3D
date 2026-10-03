// One-off: Overpass → data/green-<city>.geojson (mapped trees as points, parks/woods/grass as polygons).
// Run: node scripts/fetch-green.mjs <city>. Parramatta uses Landsat NDVI instead (Sydney CBD's scene is cloudy).
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

// [S, W, N, E], same boxes as fetch-buildings.mjs.
const BOXES = {
  melbourne: [-37.833, 144.930, -37.791, 144.977],
  london: [51.500, -0.131, 51.530, -0.069],
  sydney: [-33.893, 151.196, -33.852, 151.220],
  suva: [-18.158, 178.417, -18.124, 178.455],
};
const city = process.argv[2], b = BOXES[city].join(',');
const q = `[out:json][timeout:120];
(node["natural"="tree"](${b});
 way["leisure"~"^(park|garden|nature_reserve)$"](${b});
 way["natural"~"^(wood|scrub)$"](${b});
 way["landuse"~"^(forest|grass|recreation_ground|village_green)$"](${b});
 rel["leisure"~"^(park|garden|nature_reserve)$"](${b});
 rel["natural"="wood"](${b}););
out geom tags;`;
const { elements } = JSON.parse(execFileSync('curl', ['-s', '-A', 'TerraGrid3D-hackathon/0.1', '--data-urlencode', `data=${q}`,
  'https://overpass-api.de/api/interpreter'], { encoding: 'utf8', maxBuffer: 1 << 30 }));

const kind = (t) => (t.natural === 'wood' || t.landuse === 'forest' ? 'wood' : t.natural === 'scrub' ? 'scrub'
  : /grass|village_green/.test(t.landuse) ? 'grass' : 'park');
const ring = (g) => g.map((p) => [+p.lon.toFixed(6), +p.lat.toFixed(6)]);
const closed = (g) => g?.length > 3 && g[0].lat === g.at(-1).lat && g[0].lon === g.at(-1).lon;
const features = [];
for (const el of elements) {
  if (el.type === 'node') features.push({ type: 'Feature', properties: { k: 'tree' }, geometry: { type: 'Point', coordinates: [+el.lon.toFixed(6), +el.lat.toFixed(6)] } });
  else if (el.type === 'way' && closed(el.geometry)) features.push({ type: 'Feature', properties: { k: kind(el.tags) }, geometry: { type: 'Polygon', coordinates: [ring(el.geometry)] } });
  else if (el.type === 'relation') for (const m of el.members || [])
    if (m.role === 'outer' && closed(m.geometry)) features.push({ type: 'Feature', properties: { k: kind(el.tags) }, geometry: { type: 'Polygon', coordinates: [ring(m.geometry)] } });
}
writeFileSync(`data/green-${city}.geojson`, JSON.stringify({ type: 'FeatureCollection', features }));
const n = (k) => features.filter((f) => f.properties.k === k).length;
console.log(`${city}: ${n('tree')} trees, ${features.length - n('tree')} areas`);
