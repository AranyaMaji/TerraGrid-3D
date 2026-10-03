import * as maplibregl from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

// Vite's dep pre-bundling breaks MapLibre's own worker lookup; without the worker no vector tiles render.
maplibregl.setWorkerUrl(workerUrl);

const PARRAMATTA = [151.003, -33.815];
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
      set('fill-extrusion-opacity', 0.95);
      set('fill-extrusion-vertical-gradient', true);
    }
    else if (l.type === 'fill') set('fill-color', /park|wood|grass|wetland/.test(id) ? C.green : C.land);
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
  spin();
  setTimeout(() => !flown && flyIn(), 4000);
});
map.on('mousedown', () => (spinning = false));

function flyIn() {
  flown = true;
  spinning = false;
  setMode3d(true, false);
  map.flyTo({ center: PARRAMATTA, zoom: 15.4, pitch: 45, bearing: 0, speed: 0.55, curve: 1.6, essential: true });
  map.once('moveend', () => map.easeTo({ zoom: 16, pitch: 60, bearing: -20, duration: 2500 }));
}

function restartIntro() {
  flown = true; // demo replays manually, no auto timer
  map.stop();
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

// ---- Surface heat: GIBS LST drape + per-building derived heat (illustrative) ----
const HEAT_COLOR = ['interpolate', ['linear'], ['coalesce', ['feature-state', 'heat'], 0],
  0, C.bld, 0.35, '#7a5a2e', 0.55, '#f59e0b', 0.8, '#e5484d', 1, '#fecdd3'];
const day = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
const lstUrl = (d, z = '{z}', y = '{y}', x = '{x}') =>
  `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_L3_Land_Surface_Temp_8Day_Day/default/${d}/GoogleMapsCompatible_Level7/${z}/${y}/${x}.png`;

// 8-day composite (daily has big cloud/swath gaps). GIBS 404s until a period is processed; probe back.
async function latestLstDate() {
  for (let n = 1; n <= 24; n++) {
    const ok = await new Promise((r) => { const i = new Image(); i.onload = () => r(true); i.onerror = () => r(false); i.src = lstUrl(day(n), 7, 76, 117); });
    if (ok) return day(n);
  }
  return day(16);
}

// Percentile rank so the ramp spreads evenly whatever the raw units.
function ranks(vals) {
  const idx = vals.map((v, i) => i).sort((a, b) => vals[a] - vals[b]), r = new Array(vals.length);
  idx.forEach((i, k) => (r[i] = k / (vals.length - 1)));
  return r;
}

async function addHeatLayers() {
  const date = await latestLstDate();
  map.addSource('lst', { type: 'raster', tiles: [lstUrl(date)], tileSize: 256, maxzoom: 7, attribution: 'NASA GIBS · MODIS Terra LST 8-day' });
  map.addLayer({ id: 'lst', type: 'raster', source: 'lst', paint: { 'raster-opacity': ['interpolate', ['linear'], ['zoom'], 8, 0.6, 11, 0.3, 12.5, 0], 'raster-resampling': 'linear' } }, 'building-3d');

  const gj = await (await fetch('/data/buildings-parramatta.geojson')).json();
  const P = gj.features.map((f) => f.properties);
  const hash = (f) => { const [x, y] = f.geometry.coordinates[0][0]; const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return s - Math.floor(s); };
  const rA = ranks(P.map((p) => p.area)), rG = ranks(P.map((p) => p.dist_green)), rH = ranks(P.map((p) => p.height));
  // ponytail: heuristic heat score (big roofs, far from green, low-rise = hotter), not a physical model.
  const heat = ranks(gj.features.map((f, i) => 0.35 * rA[i] + 0.3 * rG[i] + 0.15 * (1 - rH[i]) + 0.2 * hash(f)));

  map.addSource('bld', { type: 'geojson', data: gj, attribution: '© OpenStreetMap contributors' });
  map.addLayer({
    id: 'bld-heat', type: 'fill-extrusion', source: 'bld',
    paint: {
      'fill-extrusion-color': HEAT_COLOR,
      'fill-extrusion-height': ['get', 'height'],
      'fill-extrusion-base': ['get', 'min_height'],
      'fill-extrusion-opacity': 1,
      'fill-extrusion-vertical-gradient': true,
    },
  });
  gj.features.forEach((f, i) => map.setFeatureState({ source: 'bld', id: f.id }, { heat: heat[i] }));
  document.getElementById('lst-date').textContent = `MODIS Terra 8-day · from ${date}`;
}

document.getElementById('layer').onchange = (e) => {
  const on = e.target.value === 'Surface heat';
  if (map.getLayer('lst')) map.setLayoutProperty('lst', 'visibility', on ? 'visible' : 'none');
  if (map.getLayer('bld-heat')) map.setPaintProperty('bld-heat', 'fill-extrusion-color', on ? HEAT_COLOR : C.bld);
  document.querySelector('.legend').style.visibility = on ? 'visible' : 'hidden';
};

// ---- Live air temperature: Parramatta vs coastal Sydney CBD (Open-Meteo, one call) ----
async function liveTemp() {
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=-33.815,-33.8607&longitude=151.003,151.2050&current=temperature_2m,apparent_temperature&timezone=auto';
  try {
    const [par, cbd] = await (await fetch(url)).json();
    const t = par.current.temperature_2m, ref = cbd.current.temperature_2m, d = t - ref;
    const $ = (id) => document.getElementById(id);
    $('temp').textContent = `${t.toFixed(1)}°C`;
    $('delta').textContent = `${d >= 0 ? '+' : '−'}${Math.abs(d).toFixed(1)}°C ${d >= 0 ? 'above' : 'below'} coastal reference`;
    $('delta').classList.toggle('cool', d < 0);
    $('ref').textContent = `Feels like ${par.current.apparent_temperature.toFixed(1)}°C · Sydney CBD (coast) ${ref.toFixed(1)}°C`;
    $('stamp').textContent = `Open-Meteo · live · ${par.current.time.slice(11)} local`;
  } catch {
    document.getElementById('stamp').textContent = 'Open-Meteo unavailable';
  }
}
liveTemp();
setInterval(liveTemp, 10 * 60e3);
