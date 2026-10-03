import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

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

map.on('style.load', () => {
  map.setProjection({ type: 'globe' });
  map.setSky({
    'sky-color': '#0b1220',
    'horizon-color': '#1e3a5f',
    'fog-color': '#0b1220',
    'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 10, 1, 12, 0],
  });
  recolour();
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
