// One-off: Overpass → data/buildings-<city>.geojson. Run: node scripts/fetch-buildings.mjs <city> [saved-overpass.json]
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

// [S, W, N, E] per city; each box covers that city's precincts in data/precincts.geojson.
const BOXES = {
  parramatta: [-33.850, 150.955, -33.785, 151.045], // ~8 x 7 km: CBD, Westmead, Harris Park, North Parramatta
  melbourne: [-37.833, 144.930, -37.791, 144.977],
  london: [51.500, -0.131, 51.530, -0.069],
  sydney: [-33.893, 151.196, -33.852, 151.220],
  suva: [-18.158, 178.417, -18.124, 178.455],
};
const city = process.argv[2] || 'parramatta', [S, W, N, E] = BOXES[city];
const q = `[out:json][timeout:90];
(way["building"](${S},${W},${N},${E});
 way["building:part"](${S},${W},${N},${E});
 rel["building"](${S},${W},${N},${E});
 way["leisure"~"park|garden|nature_reserve"](${S},${W},${N},${E});
 way["natural"~"water|wood"](${S},${W},${N},${E});
 way["landuse"~"grass|forest"](${S},${W},${N},${E}););
out geom tags;`;

// Optional arg: a saved Overpass JSON response. Otherwise curl (Node fetch can't reach Overpass on the dev machine).
function load() {
  if (process.argv[3]) return JSON.parse(readFileSync(process.argv[3], 'utf8'));
  return JSON.parse(execFileSync('curl', ['-s', '-A', 'TerraGrid3D-hackathon/0.1', '--data-urlencode', `data=${q}`, 'https://overpass-api.de/api/interpreter'], { encoding: 'utf8', maxBuffer: 1 << 30 }));
}
const { elements } = load();

// Local planar metres around the bbox centre.
const lat0 = (S + N) / 2, mx = 111320 * Math.cos(lat0 * Math.PI / 180), my = 110540;
const xy = (p) => [p.lon * mx, p.lat * my];

function areaCentroid(g) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < g.length - 1; i++) {
    const [x1, y1] = xy(g[i]), [x2, y2] = xy(g[i + 1]), f = x1 * y2 - x2 * y1;
    a += f; cx += (x1 + x2) * f; cy += (y1 + y2) * f;
  }
  a /= 2;
  return a ? { area: Math.abs(a), c: [cx / (6 * a), cy / (6 * a)] } : { area: 0, c: xy(g[0]) };
}

const closed = (el) => { const g = el.geometry; return g?.length > 3 && g[0].lat === g.at(-1).lat && g[0].lon === g.at(-1).lon; };
const green = [], blds = [];
for (const el of elements) {
  // Multipolygon buildings: each closed outer ring becomes its own footprint with the relation's tags.
  if (el.type === 'relation') {
    for (const m of el.members || []) if (m.role === 'outer' && closed(m)) blds.push({ id: el.id * 1000 + blds.length % 1000, tags: el.tags, geometry: m.geometry });
    continue;
  }
  if (el.type !== 'way' || !closed(el)) continue;
  (el.tags.building || el.tags['building:part'] ? blds : green).push(el);
}
// Sample green/water edges every few vertices so big parks count by their boundary, not just centroid.
const greenPts = green.flatMap((el) => el.geometry.filter((_, i) => i % 3 === 0).map(xy));

// OSM keeps both a building's outline and its building:part pieces; drawing both z-fights. Drop outlines that contain a part.
const inside = ([x, y], g) => {
  let c = false;
  for (let i = 0, j = g.length - 1; i < g.length; j = i++) {
    const [xi, yi] = xy(g[i]), [xj, yj] = xy(g[j]);
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const partCs = blds.filter((b) => b.tags['building:part']).map((b) => areaCentroid(b.geometry).c);
for (let i = blds.length - 1; i >= 0; i--)
  if (!blds[i].tags['building:part'] && partCs.some((c) => inside(c, blds[i].geometry))) blds.splice(i, 1);

// First number only: tags like "12;15" or "40 m" otherwise parse as 1215 / garbage.
const num = (v) => parseFloat(String(v).match(/\d+(\.\d+)?/)?.[0]);
const features = blds.map((el) => {
  const t = el.tags, { area, c } = areaCentroid(el.geometry);
  let height = num(t.height);
  if (!(height > 0)) height = t['building:levels'] ? num(t['building:levels']) * 3.2 : 8;
  height = Math.min(height || 8, 340); // nothing in these boxes is taller than the Shard
  let d = Infinity;
  for (const [x, y] of greenPts) d = Math.min(d, Math.hypot(x - c[0], y - c[1]));
  return {
    type: 'Feature',
    id: el.id,
    properties: {
      height: +height.toFixed(1),
      min_height: num(t.min_height) || 0,
      area: Math.round(area),
      dist_green: Math.round(Math.min(d, 2000)),
      type: t.building && t.building !== 'yes' ? t.building : t.amenity || t.shop && 'retail' || t.office && 'office' || t.building || 'yes',
      levels: num(t['building:levels']) || undefined,
    },
    geometry: { type: 'Polygon', coordinates: [el.geometry.map((p) => [+p.lon.toFixed(6), +p.lat.toFixed(6)])] },
  };
});

mkdirSync('data', { recursive: true });
writeFileSync(`data/buildings-${city}.geojson`, JSON.stringify({ type: 'FeatureCollection', features }));
console.log(`${city}: ${features.length} buildings, ${green.length} green/water areas`);
