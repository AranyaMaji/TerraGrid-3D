# Verified endpoints (checked 2026-10-03, all keyless)

## 1. MapLibre GL JS
- npm `maplibre-gl` latest **6.11.2** (ESM only; no UMD in v6, use Vite import).
- CSS: `import 'maplibre-gl/dist/maplibre-gl.css'`.
- Globe: `map.on('style.load', () => map.setProjection({ type: 'globe' }))`. Globe hands over to
  mercator at ~zoom 12, so fly-ins look continuous. `fill-extrusion` works on globe.
- Example: https://maplibre.org/maplibre-gl-js/docs/examples/display-a-globe-with-a-fill-extrusion-layer/

## 2. OpenFreeMap tiles (no key, no limits)
- Styles: `https://tiles.openfreemap.org/styles/{positron|bright|liberty|dark|fiord|3d}`
- `liberty` has layer id `building-3d` (fill-extrusion), source `planet` = `https://tiles.openfreemap.org/planet`,
  `source-layer: "building"`, height `["get","render_height"]`, base `["get","render_min_height"]`.
- Styles have no `projection` field; set globe in code. Recolour layers after load with `setPaintProperty`,
  or fetch the style JSON and patch colours before `new Map({style})`.

## 3. Open-Meteo (CORS ok, non-commercial free, attribute "Weather data by Open-Meteo.com")
- Current temp:
  `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,apparent_temperature&timezone=auto`
- Air quality (CAMS global/Europe, i.e. Copernicus):
  `https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&current=pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,aerosol_optical_depth`
  (`current=` with these vars is expected to work; if not, use `hourly=` and take the last index.)

## 4. NASA GIBS WMTS rasters (EPSG:3857, daily, no key)
Template for a MapLibre raster source (`tileSize: 256`):
`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{LAYER}/default/{YYYY-MM-DD}/{MATRIX}/{z}/{y}/{x}.png`

| Purpose | LAYER | MATRIX (max zoom) |
|---|---|---|
| Land surface temp, day | `MODIS_Terra_L3_Land_Surface_Temp_Daily_Day` | `GoogleMapsCompatible_Level7` |
| NDVI 8-day | `MODIS_Terra_NDVI_8Day` | `GoogleMapsCompatible_Level9` |
| Aerosol optical depth | `MODIS_Combined_Value_Added_AOD` | `GoogleMapsCompatible_Level6` |

Latest date may lag 1–3 days; try today-1 … today-4 until a tile returns 200. Tiles are coarse (1 km),
so render at opacity ~0.5 under buildings; the per-building heat is our own derived score (label "illustrative").

## 4b. Landsat surface temperature (100 m, keyless) — Microsoft Planetary Computer
- STAC search: `POST https://planetarycomputer.microsoft.com/api/stac/v1/search` with `collections:["landsat-c2-l2"]`, point, datetime, `eo:cloud_cover < 10`.
- Rendered crop (works; per-tile endpoint 504'd): `.../api/data/v1/item/bbox/{w},{s},{e},{n}/{W}x{H}.png?collection=landsat-c2-l2&item={id}&assets=lwir11&rescale={lo},{hi}&colormap_name=inferno&nodata=0`.
- DN → °C: `DN*0.00341802 + 149 - 273.15`. Used by `scripts/fetch-landsat.py`.

## 5. Overpass (one-off fetch, commit the GeoJSON; do not call at runtime)
- `POST https://overpass-api.de/api/interpreter`, body:
  ```
  [out:json][timeout:60];
  way["building"]({south},{west},{north},{east});
  out geom tags;
  ```
- Each way has `geometry: [{lat,lon}...]` and `tags.height` / `tags["building:levels"]` / `tags.min_height`.
  Closed ways → Polygon. Skip relations. Parramatta bbox ≈ `-33.828,150.990,-33.802,151.018`.

## 6. Web Serial (Chrome/Edge desktop; localhost counts as secure)
```js
const port = await navigator.serial.requestPort();   // needs a click
await port.open({ baudRate: 9600 });
const reader = port.readable.pipeThrough(new TextDecoderStream()).getReader();
for (;;) { const { value, done } = await reader.read(); if (done) break; /* value: text chunk, split on \n */ }
```

## 7. Gemini (key in `GEMINI_API_KEY` env, server-side only via Vite middleware)
- Unverified this session: check the current REST endpoint and model id in the official docs
  (ai.google.dev) before implementing TODO item 7.
