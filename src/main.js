import * as maplibregl from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

// Vite's dep pre-bundling breaks MapLibre's own worker lookup; without the worker no vector tiles render.
maplibregl.setWorkerUrl(workerUrl);

// Everything location-specific lives here; panel stats are illustrative.
const CITY = {
  name: 'Parramatta', center: [151.003, -33.815], ref: [151.205, -33.8607], refName: 'coastal Sydney',
  ghi: 1790, plume: { at: [151.026, -33.817], name: 'Camellia industrial' },
  tree_cover_pct: 12, age65_pct: 18, schools: 11, aged_care: 14, offset: 0,
};
const OCEANIA = [150, -25];

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://tiles.openfreemap.org/styles/liberty',
  center: OCEANIA,
  zoom: 1.6,
  attributionControl: { compact: true },
});
map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

// Recolour liberty to the dark canvas.
const greens = []; // park/wood fill layers, brightened by the canopy layer
const C = { bg: '#0b1220', land: '#111a2b', green: '#10241f', water: '#0d2238', road: '#1c2840', bld: '#2a3447' };

function recolour() {
  for (const l of map.getStyle().layers) {
    const id = l.id, set = (k, v) => map.setPaintProperty(id, k, v);
    if (/poi|shield|one_way|road_area_pattern|park_outline/.test(id)) map.setLayoutProperty(id, 'visibility', 'none');
    else if (l.type === 'background') set('background-color', C.bg);
    else if (l.type === 'raster') { set('raster-brightness-max', 0.35); set('raster-saturation', -0.6); }
    else if (id === 'water') set('fill-color', C.water);
    else if (id === 'building') set('fill-color', '#1a2335');
    else if (id === 'building-3d') {
      set('fill-extrusion-color', C.bld);
      set('fill-extrusion-opacity', ['interpolate', ['linear'], ['zoom'], 13.5, 0.95, 14, 0]);
      set('fill-extrusion-vertical-gradient', true);
    }
    else if (l.type === 'fill') set('fill-color', /park|wood|grass|wetland/.test(id) ? (greens.push(id), C.green) : C.land);
    else if (l.type === 'line') set('line-color', /waterway/.test(id) ? C.water : /casing/.test(id) ? C.bg : /boundary/.test(id) ? '#334155' : C.road);
    else if (l.type === 'symbol') { set('text-color', '#94a3b8'); set('text-halo-color', C.bg); }
  }
}

window.map = map; // console debugging

map.on('style.load', () => {
  map.setProjection({ type: 'globe' });
  map.setSky({
    'sky-color': '#0b1220',
    'horizon-color': '#1e3a5f',
    'fog-color': '#0b1220',
    'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 10, 1, 12, 0],
  });
  recolour();
  addHeatLayers();
  addOverlays();
});

// Intro: slow spin over Oceania, then fly in.
let spinning = true, flown = false;
function spin() {
  if (!spinning) return;
  const c = map.getCenter();
  map.setCenter([c.lng - 0.04, c.lat]);
  requestAnimationFrame(spin);
}
map.on('load', () => {
  // Compact attribution starts expanded and only collapses on the first drag; collapse it now.
  document.querySelector('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show');
  spin();
  setTimeout(() => !flown && flyIn(), 4000);
});
map.on('mousedown', () => (spinning = false));

function flyIn() {
  flown = true;
  spinning = false;
  setMode3d(true, false);
  map.flyTo({ center: CITY.center, zoom: 15.4, pitch: 45, bearing: 0, speed: 0.55, curve: 1.6, essential: true });
  map.once('moveend', () => map.easeTo({ zoom: 16, pitch: 60, bearing: -20, duration: 2500 }));
}

function restartIntro() {
  flown = true; // demo replays manually, no auto timer
  map.stop();
  select(null);
  setLayers(['heat']);
  map.jumpTo({ center: OCEANIA, zoom: 1.6, pitch: 0, bearing: 0 });
  spinning = true;
  spin();
  setTimeout(flyIn, 4000);
}

document.getElementById('explore').onclick = flyIn;
document.getElementById('demo').onclick = restartIntro;

// 2D / 3D toggle
const b2 = document.getElementById('btn-2d'), b3 = document.getElementById('btn-3d');
function setMode3d(on, animate = true) {
  b3.classList.toggle('on', on);
  b2.classList.toggle('on', !on);
  if (animate) map.easeTo({ pitch: on ? 60 : 0, bearing: on ? -20 : 0, duration: 1000 });
}
b2.onclick = () => setMode3d(false);
b3.onclick = () => setMode3d(true);

// ---- Surface heat: GIBS LST drape + per-building Landsat heat ----
// Thermal-camera ramp: -1 = 1.5 °C cooler than the local median (slate blue), 0 = average (yellow), +1 = hotter (red).
// Scenario: feature-state `cool` 0..1 blends toward cyan (was hottest) / green (was coolest).
const HEAT = ['coalesce', ['feature-state', 'heat'], 0];
const HEAT_COLOR = ['interpolate', ['linear'], ['coalesce', ['feature-state', 'cool'], 0],
  0, ['interpolate', ['linear'], HEAT, -1, '#2b3a67', 0, '#f5c542', 1, '#e5484d'],
  1, ['interpolate', ['linear'], HEAT, -1, '#34d399', 1, '#22d3ee']];
const day = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const gibsUrl = (layer, z, d) =>
  `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${d}/GoogleMapsCompatible_Level${z}/{z}/{y}/{x}.png`;

// Tile [z, y, x] under the city centre.
function tileAt(z, [lon, lat] = CITY.center) {
  const n = 2 ** z, r = (lat * Math.PI) / 180;
  return [z, Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n), Math.floor(((lon + 180) / 360) * n)];
}

// GIBS 404s until a period is processed; probe back from yesterday at the city's tile.
async function latestGibs(layer, z) {
  const [tz, ty, tx] = tileAt(z);
  for (let n = 1; n <= 24; n++) {
    const url = gibsUrl(layer, z, day(n)).replace('{z}', tz).replace('{y}', ty).replace('{x}', tx);
    const ok = await new Promise((r) => { const i = new Image(); i.onload = () => r(true); i.onerror = () => r(false); i.src = url; });
    if (ok) return day(n);
  }
  return day(16);
}

// Landsat mosaic bounds and pixel size (scripts/fetch-landsat.py, fetch-ndvi.py); grey LST encodes 35..50 °C as 0..255.
const LANDSAT = { w: 150.70, e: 151.35, n: -33.55, s: -34.10, t0: 35, t1: 50, px: [2400, 2031] };
const CORNERS = [[LANDSAT.w, LANDSAT.n], [LANDSAT.e, LANDSAT.n], [LANDSAT.e, LANDSAT.s], [LANDSAT.w, LANDSAT.s]];

// Greyscale PNG over the Landsat bounds → (lon, lat) → 0..1 (null outside the scene / no data).
async function sampler(url) {
  const img = new Image();
  img.src = url;
  await img.decode();
  const cv = Object.assign(document.createElement('canvas'), { width: img.width, height: img.height });
  const cx = cv.getContext('2d', { willReadFrequently: true });
  cx.drawImage(img, 0, 0);
  const px = cx.getImageData(0, 0, img.width, img.height).data, L = LANDSAT;
  return (lon, lat) => {
    const x = Math.floor(((lon - L.w) / (L.e - L.w)) * img.width), y = Math.floor(((L.n - lat) / (L.n - L.s)) * img.height);
    if (x < 0 || y < 0 || x >= img.width || y >= img.height) return null;
    const i = (y * img.width + x) * 4;
    return px[i + 3] ? px[i] / 255 : null;
  };
}

async function addHeatLayers() {
  // 8-day composite (daily has big cloud/swath gaps).
  const lstLayer = 'MODIS_Terra_L3_Land_Surface_Temp_8Day_Day';
  map.addSource('lst', { type: 'raster', tiles: [gibsUrl(lstLayer, 7, await latestGibs(lstLayer, 7))], tileSize: 256, maxzoom: 7, attribution: 'NASA GIBS · MODIS Terra LST 8-day · Landsat: USGS via Microsoft Planetary Computer' });
  map.addLayer({ id: 'lst', type: 'raster', source: 'lst', layout: vis('lst'), paint: { 'raster-opacity': ['interpolate', ['linear'], ['zoom'], 8, 0.6, 10, 0.5, 11, 0] , 'raster-resampling': 'linear' } }, 'building-3d');
  // 100 m Landsat scene takes over from 1 km MODIS at city zoom.
  map.addSource('landsat', { type: 'image', url: '/data/lst-landsat.png', coordinates: CORNERS });
  map.addLayer({ id: 'landsat', type: 'raster', source: 'landsat', layout: vis('landsat'), paint: { 'raster-opacity': ['interpolate', ['linear'], ['zoom'], 9.5, 0, 11, 0.75, 15, 0.45], 'raster-fade-duration': 0 } }, 'building-3d');

  const [gj, raw] = await Promise.all([fetch('/data/buildings-parramatta.geojson').then((r) => r.json()), sampler('/data/lst-landsat-gray.png')]);
  const sample = (lon, lat) => { const v = raw(lon, lat); return v == null ? null : LANDSAT.t0 + v * (LANDSAT.t1 - LANDSAT.t0); };
  // Building colour = Landsat surface temp at its footprint (vertex mean) vs the scene's building median.
  const lst = gj.features.map((f) => (f.properties.lst = sample(...mid(f.geometry.coordinates[0]))));
  const sorted = lst.filter((t) => t != null).sort((a, b) => a - b), med = sorted[sorted.length >> 1];
  // A 100 m pixel under a tower is mostly its shadow and the street, not its roof: damp tall buildings toward average.
  const heat = lst.map((t, i) => t == null ? 0 :
    Math.max(-1, Math.min(1, ((t - med) / 1.5) * Math.min(1, 20 / (gj.features[i].properties.height || 8)))));

  map.addSource('bld', { type: 'geojson', data: gj, attribution: '© OpenStreetMap contributors' });
  map.addLayer({
    id: 'bld-heat', type: 'fill-extrusion', source: 'bld',
    paint: {
      'fill-extrusion-color': wallColor(),
      'fill-extrusion-height': ['get', 'height'],
      'fill-extrusion-base': ['get', 'min_height'],
      'fill-extrusion-opacity': 1,
      'fill-extrusion-vertical-gradient': true,
    },
  });
  // Solar paints a thin cap on each roof only, so it mixes with the heat-coloured walls.
  map.addLayer({
    id: 'roofs', type: 'fill-extrusion', source: 'bld', layout: vis('roofs'),
    paint: {
      'fill-extrusion-color': SOLAR_COLOR,
      'fill-extrusion-base': ['get', 'height'],
      'fill-extrusion-height': ['+', ['get', 'height'], 0.8],
      'fill-extrusion-opacity': 1,
    },
  });
  // Colour by rank of rooftop yield so the ramp spreads evenly.
  const mwh = gj.features.map(roofMWh), rank = [];
  mwh.map((_, i) => i).sort((a, b) => mwh[a] - mwh[b]).forEach((i, r) => (rank[i] = r / (mwh.length - 1)));
  gj.features.forEach((f, i) => {
    f.properties.mwh = mwh[i];
    map.setFeatureState({ source: 'bld', id: f.id }, { heat: heat[i], solar: rank[i] });
  });
  buildings = gj.features;
  lstAt = sample; lstMed = med;
  if (on.has('canopy')) addTrees();
  renderLegend();
  renderPanel();
  addPrecincts();
}

const mid = (ring) => [ring.reduce((a, p) => a + p[0], 0) / ring.length, ring.reduce((a, p) => a + p[1], 0) / ring.length];

// Rooftop yield: roof m² × 60% usable × 20% panel efficiency × 80% performance ratio × annual irradiance.
// Every building part has its own roof, so towers made of parts count too.
function roofMWh(f) {
  const ring = f.geometry.coordinates[0], k = Math.cos((ring[0][1] * Math.PI) / 180) * 111320 * 110540;
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += (ring[j][0] - ring[i][0]) * (ring[j][1] + ring[i][1]);
  return (Math.abs(a / 2) * k * 0.6 * 0.2 * 0.8 * CITY.ghi) / 1000;
}

// ---- Layers: any mix can be on. Rasters stack; walls show heat (neutral if off); solar paints roof caps only. ----
const SOLAR_COLOR = ['interpolate', ['linear'], ['coalesce', ['feature-state', 'solar'], 0], 0, '#3b2a12', 0.5, '#b45309', 0.85, '#f59e0b', 1, '#fde68a'];
const LAYERS = {
  heat: { ids: ['lst', 'landsat'],
    legend: ['Building surface heat', '#2b3a67, #f5c542 50%, #e5484d', 'Cooler', 'Hotter', () => `avg <b>${lstMed ? lstMed.toFixed(1) : '--'}°C</b> · Landsat`] },
  smoke: { ids: ['smoke', 'plume'],
    legend: ['Aerosol optical depth', '#fef3c7, #f59e0b 50%, #7c2d12', 'Clear', 'Smoky', () => 'NASA MODIS · CAMS'] },
  canopy: { ids: ['canopy', 'ndvi', 'trees'],
    legend: ['Vegetation (NDVI)', '#84cc16, #22c55e 50%, #065f46', 'Sparse', 'Dense', () => 'Landsat 30 m'] },
  solar: { ids: ['roofs'],
    legend: ['Rooftop solar potential', '#3b2a12, #b45309 50%, #f59e0b 85%, #fde68a', 'Low', 'High', () => `${CITY.ghi.toLocaleString()} kWh/m²/yr`] },
};
const OVERLAYS = Object.values(LAYERS).flatMap((l) => l.ids);
const on = new Set(['heat']);
let last = 'heat'; // panel headline follows the last layer switched on
const vis = (id) => ({ visibility: [...on].some((k) => LAYERS[k].ids.includes(id)) ? 'visible' : 'none' });
const wallColor = () => (on.has('heat') ? HEAT_COLOR : C.bld);

function renderLegend() {
  $('legend').innerHTML = Object.keys(LAYERS).filter((k) => on.has(k)).map((k) => {
    const [title, ramp, lo, hi, src] = LAYERS[k].legend;
    return `<div class="leg"><div class="legend-title">${title}</div><div class="ramp" style="background:linear-gradient(90deg, ${ramp})"></div>` +
      `<div class="ticks"><span>${lo}</span><span>${hi}</span></div><div class="legend-src">${src()}</div></div>`;
  }).join('');
  $('legend').hidden = !on.size;
}

function toggleLayer(k, state = !on.has(k)) {
  if (state) { on.add(k); last = k; } else { on.delete(k); if (last === k) last = [...on].at(-1); }
  applyLayers();
}

function setLayers(keys) {
  on.clear();
  keys.forEach((k) => on.add(k));
  last = keys.at(-1);
  applyLayers();
}

function applyLayers() {
  if (on.has('canopy')) addTrees();
  for (const id of OVERLAYS) if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', vis(id).visibility);
  if (map.getLayer('bld-heat')) map.setPaintProperty('bld-heat', 'fill-extrusion-color', wallColor());
  for (const id of greens) map.setPaintProperty(id, 'fill-color', on.has('canopy') ? '#1f6f3f' : C.green);
  if (plumeMarker) plumeMarker.getElement().style.display = on.has('smoke') ? '' : 'none';
  cancelAnimationFrame(plumeAnim);
  if (on.has('smoke')) plumeAnim = requestAnimationFrame(plumeFrame);
  for (const b of document.querySelectorAll('#layers button')) b.classList.toggle('on', on.has(b.dataset.k));
  renderLegend();
  renderPanel();
}
document.querySelectorAll('#layers button').forEach((b) => (b.onclick = () => toggleLayer(b.dataset.k)));

// Satellite overlays (global GIBS rasters, Landsat NDVI drape) + smoke plume source.
async function addOverlays() {
  const aod = 'MODIS_Combined_Value_Added_AOD', ndvi = 'MODIS_Terra_NDVI_8Day';
  map.addSource('plume', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  // At z16 a pixel is ~2 m, so 40..200 px ≈ 80..400 m puffs; size doubles per zoom level.
  const R = ['+', 40, ['*', 160, ['get', 'a']]];
  map.addLayer({ id: 'plume', type: 'circle', source: 'plume', layout: vis('plume'), paint: {
    'circle-radius': ['interpolate', ['exponential', 2], ['zoom'], 10, ['/', R, 64], 18, ['*', R, 4]],
    'circle-blur': 1,
    'circle-color': ['interpolate', ['linear'], ['get', 'a'], 0, '#f2e3bd', 1, '#a39b8a'],
    'circle-opacity': ['*', 0.6, ['-', 1, ['get', 'a']], ['min', 1, ['*', 8, ['get', 'a']]]],
    'circle-pitch-alignment': 'map', 'circle-pitch-scale': 'map',
  } });
  // 30 m Landsat NDVI (bare ground transparent) takes over from 250 m MODIS at city zoom.
  map.addSource('ndvi', { type: 'image', url: '/data/ndvi-landsat.png', coordinates: CORNERS });
  map.addLayer({ id: 'ndvi', type: 'raster', source: 'ndvi', layout: vis('ndvi'),
    paint: { 'raster-opacity': ['interpolate', ['linear'], ['zoom'], 9.5, 0, 11, 0.85, 16, 0.6], 'raster-fade-duration': 0 } }, 'building-3d');
  const [dAod, dNdvi] = await Promise.all([latestGibs(aod, 6), latestGibs(ndvi, 9)]);
  map.addSource('smoke', { type: 'raster', tiles: [gibsUrl(aod, 6, dAod)], tileSize: 256, maxzoom: 6 });
  map.addLayer({ id: 'smoke', type: 'raster', source: 'smoke', layout: vis('smoke'),
    paint: { 'raster-opacity': ['interpolate', ['linear'], ['zoom'], 4, 0.7, 12, 0.45, 16, 0.3], 'raster-resampling': 'linear' } }, 'building-3d');
  map.addSource('canopy', { type: 'raster', tiles: [gibsUrl(ndvi, 9, dNdvi)], tileSize: 256, maxzoom: 9 });
  map.addLayer({ id: 'canopy', type: 'raster', source: 'canopy', layout: vis('canopy'),
    paint: { 'raster-opacity': ['interpolate', ['linear'], ['zoom'], 6, 0.8, 10, 0.6, 11, 0], 'raster-resampling': 'linear' } }, 'ndvi');
}

// 3D trees grown from the 30 m NDVI inside the building box: at most one crown per pixel, likelier and taller where greener.
let treesP = null;
function addTrees() {
  if (treesP || !buildings.length) return;
  treesP = sampler('/data/ndvi-landsat-gray.png').then((ndvi) => {
    let [w, s, e, n] = [180, 90, -180, -90];
    for (const f of buildings) for (const [x, y] of f.geometry.coordinates[0]) { w = Math.min(w, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y); }
    const L = LANDSAT, sx = (L.e - L.w) / L.px[0], sy = (L.n - L.s) / L.px[1];
    const ky = 1 / 110540, kx = 1 / (111320 * Math.cos((s * Math.PI) / 180)), features = [];
    for (let x = w; x < e; x += sx) for (let y = s; y < n; y += sy) {
      const v = (ndvi(x, y) ?? 0) * 0.8; // NDVI
      if (v < 0.4 || Math.random() > (v - 0.3) / 0.3) continue;
      const g = Math.min(1, (v - 0.4) / 0.25), r = 3 + 3 * Math.random() + 2 * g, h = 7 + 3 * Math.random() + 10 * g * Math.random();
      const cx = x + Math.random() * sx, cy = y + Math.random() * sy;
      const ring = Array.from({ length: 9 }, (_, i) => [cx + Math.cos((i * Math.PI) / 4) * r * kx, cy + Math.sin((i * Math.PI) / 4) * r * ky]);
      features.push({ type: 'Feature', properties: { h, b: h * 0.35, g }, geometry: { type: 'Polygon', coordinates: [ring] } });
    }
    map.addSource('trees', { type: 'geojson', data: { type: 'FeatureCollection', features } });
    map.addLayer({ id: 'trees', type: 'fill-extrusion', source: 'trees', minzoom: 12.5, layout: vis('trees'), paint: {
      'fill-extrusion-color': ['interpolate', ['linear'], ['get', 'g'], 0, '#84cc16', 1, '#15803d'],
      'fill-extrusion-height': ['get', 'h'], 'fill-extrusion-base': ['get', 'b'],
      'fill-extrusion-vertical-gradient': true,
    } });
  });
}

// Plume axis from the source toward and past the city centre; offsets in lat-degree units (east scaled by k).
function plumeAxis() {
  const [x0, y0] = CITY.plume.at, [x1, y1] = CITY.center, k = Math.cos((y0 * Math.PI) / 180);
  const ex = (x1 - x0) * k, ny = y1 - y0, len = Math.hypot(ex, ny), L = len * 1.8;
  return { x0, y0, k, dx: ex / len, dy: ny / len, L, W: L * 0.18 };
}

// Plume's PM2.5 contribution (µg/m³) at a point: strongest near the source, thinning downwind and off-axis.
function plumeAt([lon, lat]) {
  const { x0, y0, k, dx, dy, L, W } = plumeAxis();
  const ex = (lon - x0) * k, ny = lat - y0, a = (ex * dx + ny * dy) / L, w = -ex * dy + ny * dx;
  return a <= 0 || a >= 1 ? 0 : 30 * (1 - a) * Math.exp(-((w / (a * W)) ** 2));
}

// Stateless particles: each loops along the axis, widening as it ages.
const PLUME = Array.from({ length: 260 }, () => [Math.random() * 2 - 1, Math.random()]);
let plumeAnim = 0, plumeMarker = null;
function plumeFrame(now) {
  const { x0, y0, k, dx, dy, L, W } = plumeAxis();
  const features = PLUME.map(([r, ph], i) => {
    const a = (now / 14000 + ph) % 1, s = a * L, w = (r + 0.25 * Math.sin(a * 9 + i)) * a * W;
    return { type: 'Feature', properties: { a }, geometry: { type: 'Point', coordinates: [x0 + (dx * s - dy * w) / k, y0 + dy * s + dx * w] } };
  });
  map.getSource('plume')?.setData({ type: 'FeatureCollection', features });
  plumeAnim = requestAnimationFrame(plumeFrame);
}

// ---- Precincts + POI pins (stats in data/ are illustrative) ----
function $(id) { return document.getElementById(id); }
const ICON = {
  factory: '<svg viewBox="0 0 24 24"><path d="M2 20V10l6 4v-4l6 4V4h4l2 16Z"/></svg>',
  school: '<svg viewBox="0 0 24 24"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg>',
  aged: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="4"/><path d="M2 21v-1a6 6 0 0 1 12 0v1"/><circle cx="17" cy="8" r="3"/><path d="M16 15a5 5 0 0 1 6 5v1"/></svg>',
};
let precincts = [], selected = null, label = null, live = null, aq = null, buildings = [], lstAt = () => null, lstMed = 0;

function pin(cls, text, icon = '', more = '') {
  const el = document.createElement('div');
  el.className = `pin ${cls}`;
  el.innerHTML = `<div class="pin-body">${icon}<span><span class="pin-short">${text}</span>${more && `<span class="pin-more">${more}</span>`}</span></div><div class="pin-stem"></div>`;
  return el;
}

// Hover detail: facility type + street, and the Landsat surface temp at the site vs the local building average.
function poiMore({ name, kind, street }, [lon, lat]) {
  const t = lstAt(lon, lat), d = t - lstMed;
  const heat = t == null ? '' : `<b class="${d > 0 ? 'hot' : 'cool'}">${t.toFixed(1)}°C surface · ${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(1)}°C vs avg</b>`;
  return `<span class="pin-name">${name}</span>${kind} · ${street}${heat}`;
}

async function addPrecincts() {
  const [pre, pois] = await Promise.all(['precincts', 'pois'].map((n) => fetch(`/data/${n}.geojson`).then((r) => r.json())));
  precincts = pre.features;
  const sel = ['boolean', ['feature-state', 'sel'], false];
  map.addSource('precincts', { type: 'geojson', data: pre, promoteId: 'name' });
  map.addLayer({ id: 'precinct-fill', type: 'fill', source: 'precincts', paint: { 'fill-color': '#0f8b85', 'fill-opacity': ['case', sel, 0.3, 0.06] } }, 'bld-heat');
  // Outline drawn over the buildings so it reads in 3D, like the design.
  map.addLayer({ id: 'precinct-line', type: 'line', source: 'precincts', layout: { 'line-join': 'round' },
    paint: { 'line-color': ['case', sel, '#0f8b85', '#94a3b8'], 'line-width': ['case', sel, 4, 1.2], 'line-opacity': ['case', sel, 1, 0.6] } });
  map.on('click', 'precinct-fill', (e) => select(e.features[0].properties.name));
  map.on('mouseenter', 'precinct-fill', () => (map.getCanvas().style.cursor = 'pointer'));
  map.on('mouseleave', 'precinct-fill', () => (map.getCanvas().style.cursor = ''));
  for (const f of pois.features)
    new maplibregl.Marker({ element: pin('poi', f.properties.type === 'school' ? 'School' : 'Aged care', ICON[f.properties.type], poiMore(f.properties, f.geometry.coordinates)), anchor: 'bottom' }).setLngLat(f.geometry.coordinates).addTo(map);
  plumeMarker = new maplibregl.Marker({ element: pin('poi', 'Industrial', ICON.factory, `<span class="pin-name">${CITY.plume.name}</span>Emission source · plume toward ${CITY.name}`), anchor: 'bottom' })
    .setLngLat(CITY.plume.at).addTo(map);
  plumeMarker.getElement().style.display = on.has('smoke') ? '' : 'none';
}

function select(name) {
  if (name === selected?.name) return;
  closeScenario();
  if (selected) map.setFeatureState({ source: 'precincts', id: selected.name }, { sel: false });
  label?.remove();
  const f = precincts.find((p) => p.properties.name === name);
  selected = f?.properties ?? null;
  if (f) {
    map.setFeatureState({ source: 'precincts', id: name }, { sel: true });
    const ring = f.geometry.coordinates[0], xs = ring.map((p) => p[0]), ys = ring.map((p) => p[1]);
    const b = [[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]];
    label = new maplibregl.Marker({ element: pin('area', name), anchor: 'bottom' })
      .setLngLat([(b[0][0] + b[1][0]) / 2, (b[0][1] + b[1][1]) / 2]).addTo(map);
    map.fitBounds(b, { padding: 140, pitch: 55, bearing: -20, maxZoom: 16.5, duration: 1600 });
  }
  renderPanel();
}
$('p-close').onclick = () => select(null);
map.on('zoom', () => document.body.classList.toggle('far', map.getZoom() < 13.5));
document.body.classList.add('far');

function renderPanel() {
  const p = selected ?? CITY;
  $('p-name').textContent = p.name;
  $('p-schools').textContent = p.schools;
  $('p-aged').textContent = p.aged_care;
  $('p-tree').textContent = `${p.tree_cover_pct}%`;
  $('p-age').textContent = `${p.age65_pct}%`;
  const h = headline(p);
  $('eyebrow').classList.toggle('live', !last || last === 'heat' || last === 'smoke');
  if (!h) return;
  [$('eyebrow').textContent, $('temp').textContent, $('delta').textContent] = h;
  $('delta').classList.toggle('cool', h[3]);
}

// Big panel metric follows the active layer: [eyebrow, value, sub-line, reads as good?]
function headline(p) {
  if (last === 'smoke') {
    if (!aq) return null;
    // CAMS is a ~40 km grid, so precincts differ only by what the plume adds on top.
    const extra = selected ? plumeAt(mid(ringOf(selected.name))) : 0;
    return ['Fine particles (PM2.5) now', `${(aq.pm2_5 + extra).toFixed(1)} µg/m³`,
      extra >= 0.1 ? `+${extra.toFixed(1)} from industry plume · AQI ${aq.us_aqi}` : `AQI ${aq.us_aqi} · AOD ${aq.aerosol_optical_depth.toFixed(2)}`, aq.us_aqi <= 50 && extra < 5];
  }
  if (last === 'canopy') {
    const d = p.tree_cover_pct - 40;
    return ['Tree canopy cover', `${p.tree_cover_pct}%`, `${Math.abs(d)} pts ${d < 0 ? 'below' : 'above'} the 40% target`, d >= 0];
  }
  if (last === 'solar') {
    if (!buildings.length) return null;
    const m = (selected ? within(ringOf(selected.name)) : buildings).reduce((a, f) => a + f.properties.mwh, 0);
    return ['Rooftop solar potential', m >= 1e4 ? `${Math.round(m / 1e3)} GWh/yr` : `${Math.round(m).toLocaleString()} MWh/yr`,
      `≈ ${Math.round(m / 6).toLocaleString()} homes powered`, true];
  }
  if (!live) return null;
  const t = live.t + p.offset, d = t - live.ref;
  return ['Air temperature now', `${t.toFixed(1)}°C`, `${d >= 0 ? '+' : '−'}${Math.abs(d).toFixed(1)}°C ${d >= 0 ? 'above' : 'below'} ${CITY.refName}`, d < 0];
}

// ---- Scenario simulator: levers cool the selected precinct's buildings; KPIs count up ----
// Headline numbers are for 50% coverage with all levers on; scale linearly with coverage.
const ZERO = { cool: 0, t: 0, ac: 0, mwh: 0, usd: 0 };
let cur = { ...ZERO }, ids = [], anim = 0;

function inside([x, y], ring) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

const ringOf = (name) => precincts.find((p) => p.properties.name === name).geometry.coordinates[0];
// Any corner inside: big footprints on the edge (Westfield) otherwise stay hot mid-precinct.
const within = (ring) => buildings.filter((f) => f.geometry.coordinates[0].some((p) => inside(p, ring)));

function target() {
  const k = $('s-cov').value / 50, roofs = +$('s-roofs').checked, trees = +$('s-trees').checked, solar = +$('s-solar').checked;
  const ac = 18 * k * (roofs + trees) / 2, mwh = 320 * k * solar;
  return {
    cool: Math.min(1, k) * (0.45 * roofs + 0.45 * trees + 0.1 * solar),
    t: 4.2 * k * (0.45 * roofs + 0.55 * trees), ac, mwh,
    usd: 48000 * (0.6 * ac / 18 + 0.4 * mwh / 320),
  };
}

function draw(s) {
  cur = s;
  for (const id of ids) map.setFeatureState({ source: 'bld', id }, { cool: s.cool });
  $('k-t').textContent = `−${s.t.toFixed(1)}°C`;
  $('k-ac').textContent = `−${Math.round(s.ac)}%`;
  $('k-mwh').textContent = `+${Math.round(s.mwh)}`;
  $('k-usd').textContent = `$${Math.round(s.usd / 1000)}k`;
}

function animateTo(to, ms = 1500) {
  cancelAnimationFrame(anim);
  const from = cur, t0 = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - t0) / ms), e = 1 - (1 - p) ** 3;
    draw(Object.fromEntries(Object.keys(to).map((k) => [k, from[k] + (to[k] - from[k]) * e])));
    if (p < 1) anim = requestAnimationFrame(step);
  };
  anim = requestAnimationFrame(step);
}

function openScenario() {
  if (!buildings.length || !precincts.length) return;
  if (!selected) return select(precincts[0].properties.name), openScenario();
  if (!on.has('heat')) toggleLayer('heat', true);
  ids = within(ringOf(selected.name)).map((f) => f.id);
  $('s-where').textContent = selected.name;
  document.body.classList.add('scenario');
  draw({ ...ZERO });
  animateTo(target());
}

function closeScenario() {
  cancelAnimationFrame(anim);
  draw({ ...ZERO });
  ids = [];
  document.body.classList.remove('scenario');
}

document.querySelector('.panel > .cta').onclick = openScenario;
$('s-back').onclick = closeScenario;
$('s-reset').onclick = () => animateTo({ ...ZERO });
$('s-export').onclick = () => window.print();
document.querySelector('.scn').oninput = () => {
  $('s-cov-v').textContent = `${$('s-cov').value}%`;
  animateTo(target(), 300);
};

// ---- Live air temperature (city vs reference point) + air quality (Open-Meteo / CAMS) ----
async function liveTemp() {
  const [[lon, lat], [rlon, rlat]] = [CITY.center, CITY.ref];
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat},${rlat}&longitude=${lon},${rlon}&current=temperature_2m,apparent_temperature&timezone=auto`;
  fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5,carbon_monoxide,aerosol_optical_depth,us_aqi&timezone=auto`)
    .then((r) => r.json()).then((j) => { aq = j.current; renderPanel(); }).catch(() => {});
  try {
    const [par, cbd] = await (await fetch(url)).json();
    live = { t: par.current.temperature_2m, feels: par.current.apparent_temperature, ref: cbd.current.temperature_2m, time: par.current.time.slice(11) };
    renderPanel();
  } catch {
    $('delta').textContent = 'Live data unavailable';
  }
}
liveTemp();
setInterval(liveTemp, 10 * 60e3);
