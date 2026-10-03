# TODO — build order (most significant first; shippable after every item)

Rules: `CLAUDE.md`. One item per session. Tick when done, note deviations in one line.
Time budget: ~5 h total. Items 1–4 are the demo. 5–9 are stretch, in priority order.
If time or tokens run out, stop after any item: the video can be cut from whatever exists.

## Core (must ship)

- [x] **1. Scaffold + globe + fly-in + 3D buildings + UI shell** (~60 min)
  - Note: hand-written Vite files (no `npm create`); MapLibre v6 has no default export, use `import * as maplibregl`. Demo button replays the intro.
  - `npm create vite@latest` vanilla JS at repo root (`index.html`, `src/main.js`, `src/style.css`). Add `maplibre-gl`.
  - Map: OpenFreeMap `liberty` style (has `building-3d` fill-extrusion layer), recolour to dark canvas
    (`#0b1220` background, water, land; buildings `#2a3447`). Globe: `map.on('style.load', () => map.setProjection({type:'globe'}))`.
  - Intro: globe centred on Oceania, slow auto-rotate, then `flyTo` Parramatta (-33.815, 151.003) pitch 60, bearing -20, zoom 16 on
    "Explore" click (and auto after 4 s). Smooth: `flyTo` with `curve`/`speed` tuned, `easeTo` pitch after.
  - UI shell from `docs/design-reference.png`: top nav, floating search box (static), layer dropdown, Layers button,
    2D/3D toggle (pitch 0 ↔ 60), legend bottom-left, right side panel (static placeholder text). Inter font, tokens from CLAUDE.md.
  - Done when: `npm run dev` shows spinning globe → fly-in → extruded Parramatta buildings inside the light UI shell, no console errors.
  - Needs: `docs/API-NOTES.md` §1–2.

- [x] **2. Surface heat layer, live data, per-building heat** (~45 min)
  - Note: Node fetch can't reach Overpass on this machine; script accepts a curl-saved response as arg. Heat = percentile mix of footprint, distance to green, low-rise, noise. Headline delta is live vs coastal Sydney CBD (not a fixed reference). Tile buildings left visible; ours draw on top.
  - Fetch Parramatta buildings once via Overpass (bbox ~2 km around centre), convert ways → GeoJSON polygons with
    `height` (or `building:levels`×3.2, default 8), save to `data/buildings-parramatta.geojson` (commit it; no runtime Overpass).
    Script: `scripts/fetch-buildings.mjs` (node, no deps).
  - Compute per-building `heat` 0..1 at load: f(footprint area, height, lat/lon noise, distance to nearest park/water if cheap).
    Store via `setFeatureState`; `fill-extrusion-color` interpolates buildings `#2a3447` → amber → red → `#fecdd3`.
    Hide the tile `building-3d` layer inside the bbox (or just render ours on top with `fill-extrusion-opacity` 1).
  - NASA GIBS `MODIS_Terra_L3_Land_Surface_Temp_Daily_Day` raster source (latest date that returns tiles; try today-1, -2, -3),
    opacity 0.55, under buildings. Toggle with "Surface heat" layer dropdown.
  - Open-Meteo current `temperature_2m`, `apparent_temperature` for the city → side panel headline (e.g. "41.2°C"), with
    "+X°C above reference" vs a fixed built-up reference, and timestamp "Open-Meteo · live".
  - Legend: LST colour bar 30–45 °C + "No data" hatch, as in design.
  - Done when: buildings glow by heat, satellite LST drapes under them, panel shows a live temperature with timestamp.
  - Needs: `docs/API-NOTES.md` §3–5.

- [x] **2b. Visual pass on item 2 (verify in a VISIBLE Chrome tab; hidden tabs throttle and show half-drawn frames)** (~20 min)
  - Fixed 2026-10-03: MapLibre worker never loaded under Vite (no basemap/vector tiles at all) → `setWorkerUrl`. Daily LST → 8-day composite (fewer cloud gaps). LST fades out by z12.5 (1 km pixels are a flat wash at street level).
  - Fixed 2026-10-03 (verified in Chrome): 100 m Landsat 8 surface temp (9 Jan 2026, keyless via Planetary Computer, baked to `data/lst-landsat*.png`) at city zoom; building colour = Landsat temp at footprint (replaced the heuristic; stops overlapping-part stripes); tile 3D buildings hidden from z14 (they z-fought ours → coloured sides, grey roofs); building parts + multipolygons added, outlines containing parts dropped. Legend now inferno 35–50 °C matching Landsat.
  - Left: legend doesn't match MODIS's own palette at globe zoom; Landsat image edge visible around z11–12 (widen bbox if it shows in the video); panel could show the real 9 Jan surface temp (45.8 °C median) in item 3.

- [x] **2c. Heat readability + hide the "Parramatta-only" edges** (~30 min, owner-raised 2026-10-03, verify in Chrome)
  - Every building looks amber/yellow: 9 Jan 2026 roofs really were 42–47 °C (median 45.8), and the 42–48 °C stretch puts the median mid-ramp, so nothing reads as "cool". Switch buildings to a diverging ramp centred on the scene median (teal/cyan = cooler than local average, red/pink = hotter), legend "°C vs Parramatta average". Keep absolute °C for the panel.
  - Towers read cool because their colour is the 100 m Landsat pixel under them (tower shadows + river-side pixels pull it down), not the tower's own surface. Either accept and explain in "Data & methods", or blend in a small roof-area/height term so towers sit near average.
  - 2D/zoomed-out shows a hard Landsat square around Parramatta. Fix: re-bake `scripts/fetch-landsat.sh` over Greater Sydney (e.g. 150.70,-34.10,151.35,-33.55 at ~3000 px; check the scene covers it or mosaic two rows) and feather the image edges to transparent (bake an alpha falloff, or a canvas vignette at load) so it fades into MODIS instead of ending in a square.
  - Same problem in 3D: tile buildings are hidden from z14, so outside our 4.4 km OSM box there are NO buildings at street zoom. Either widen the OSM box, or keep tile buildings visible outside it.
  - Done 2026-10-03: buildings on a ±1.5 °C thermal ramp (slate blue → yellow → red, owner-picked) around the building median (45.8 °C); deviation damped by min(1, 20 m / height) so towers sit nearer average (CBD still reads cool: it is, by the river). Landsat re-baked over Greater Sydney (2 scenes mosaicked, 12% edge feather) by `scripts/fetch-landsat.py`. OSM box widened to ~8×7 km (8,078 buildings); MapLibre `within` ignores polygon features so tile buildings could not be masked by area.

- [x] **3. Precinct selection + side panel + POI pins** (~40 min)
  - Note: owner trimmed the panel 2026-10-03: no subtext, no Sources tab, no observation period, no data-date toast; 2×2 tiles (tree, 65+, schools, aged care), fits without scrolling.
  - `data/precincts.geojson`: 3–4 hand-drawn polygons in Parramatta (e.g. CBD, Harris Park, Westmead, North Parramatta)
    with props: name, tree_cover_pct, age65_pct, schools, aged_care (illustrative, plausible).
  - Click a precinct → teal outline + label pill (design), camera eases to it, side panel fills: name, headline temp
    (city live temp + precinct offset), tree cover, age 65+, observation period, "Sources & assumptions" link.
  - POI pins: custom HTML markers (school, aged care) from `data/pois.geojson`, styled as in design (white pill, icon, teal stem).
  - Done when: clicking precincts updates the panel and pins render.

- [x] **4. Scenario simulator: "Test canopy scenario"** (~40 min)
  - Note: card replaces the stat tiles (panel still fits); KPIs given are at 50% coverage, scale linearly; CTA with nothing selected picks Parramatta CBD. Owner change: no Apply button, simulates on open, Export brief is the CTA, Reset small in card header.
  - CTA opens scenario card: toggles Cool roofs / Tree canopy / Rooftop solar (checkboxes, default all on), slider "Coverage %".
  - Apply: buildings in the selected precinct animate heat → cool (cyan/green) over ~1.5 s (requestAnimationFrame lerp on
    feature-state); KPI counters count up: −4.2 °C surface, −18 % peak AC demand, +320 MWh/yr solar, $48k/yr saved
    (scale by coverage %). Reset button reverses.
  - "Export council brief (PDF)" button = `window.print()` of the panel (good enough for video).
  - Done when: the magic moment records cleanly in one take.

- [x] **3b. POI pins show real name + details** (low priority, owner-raised 2026-10-03)
  - Done: 10 real OSM facilities in data/pois.geojson (hand-picked, no tutoring centres or overlapping pairs); pins read School / Aged care, hover shows name, type, street, Landsat surface temp vs avg.
  - Pins currently say just "School" / "Aged care". Show the facility name and a detail or two (e.g. on hover/click).

## Stretch (priority order)

- [x] **5. More layers: smoke/aerosol, tree canopy, solar potential** (~45 min)
  - Note: panel headline (big number) follows the layer instead of adding rows. Plume aims from `CITY.plume.at` at the city centre (not live wind) so it always crosses the CBD. Daily AOD has a cloud gap over Sydney some days; plume carries street zoom. All location data lives in `CITY` (centre, reference point, irradiance, plume source); GIBS dates are probed at the city's tile. For item 6, tile buildings get a per-layer `tile` colour (solar uses `render_height` as a proxy since tiles have no footprint list).
  - Smoke: GIBS `MODIS_Combined_Value_Added_AOD` raster + Open-Meteo air quality (pm2_5, co, aod) in panel + an animated
    particle plume (canvas overlay or `symbol` layer with drifting points) from an industrial POI across the precinct.
  - Tree canopy: GIBS `MODIS_Terra_NDVI_8Day` raster, green ramp; buildings desaturate.
  - Solar: buildings coloured gold by roof area × irradiance constant; panel shows MWh/yr.
  - Layer dropdown switches all three + heat; legend updates.

- [x] **5b. Mixable layers + layer polish** (owner-raised 2026-10-03, verify in Chrome)
  - [x] Toolbar: replace the native dropdown and the dead "Layers" button with always-visible toggle chips
    (Surface heat / Smoke / Tree canopy / Solar), any combination on. Legend stacks one row per active layer;
    panel headline follows the last layer switched on.
  - [x] Mixing rules: overlays stack; building walls = heat (or neutral if heat off); solar paints a thin roof cap
    only (so heat + solar combine); canopy adds trees; smoke adds haze + plume.
  - [x] Solar on rooftops only, counting building parts too (the Parramatta Square tower was dark: its parts were skipped).
  - [x] PM2.5 per precinct: CAMS is a ~40 km grid so every precinct got the same 11.7. Add the plume's
    contribution at each precinct centre on top of the live city value.
  - [x] Canopy oomph: bake 30 m Landsat NDVI (same 9 Jan scene, Planetary Computer) to replace 250 m MODIS
    at city zoom, and grow 3D trees on vegetated pixels inside the building box.
  - Done 2026-10-03: `scripts/fetch-ndvi.py` bakes NDVI (bare ground transparent); ~1 crown per vegetated 30 m pixel,
    trees load on first Canopy toggle. PM2.5 per precinct = live CAMS + plume model at the precinct centre (CBD 25.0, Harris Park 11.7).

- [x] **5c. Panel shows every layer's metric at once** (owner-raised 2026-10-03)
  - Big number is always air temperature; below it one row per layer (roof surface °C, PM2.5, canopy %, solar GWh/yr)
    for the selected precinct, always visible; rows always coloured, not clickable (owner).
  - Tree cover tile (duplicated the canopy row) replaced by Residents (precinct `population`, ~2021 census suburb counts; owner picked it over days >35°C).

- [x] **5d. Realistic trees and flora** (later, owner-raised 2026-10-03)
  - Done 2026-10-04 without three.js (owner choice): each tree = trunk + 2–3 stacked crown tiers, species by weight (gum 55%, poplar 20%, fig 25%), per-tree colour; shrub tufts on NDVI 0.25–0.4. Still extrusions, blocky up close.
  - Replace the octagon crowns with real 3D tree models (e.g. a few low-poly glTF species instanced via a
    MapLibre custom layer + three.js, or a model layer if MapLibre gains one). Vary species/size by NDVI; add shrubs/grass
    tufts on low-NDVI green. Needs a new dependency (three.js): ask first.

- [x] **6. Multi-city: Melbourne, London, Sydney CBD, Suva (Fiji)** (~15 min each)
  - Done 2026-10-03: baked OSM buildings per city (`node scripts/fetch-buildings.mjs <city>`, curl) instead of tile buildings, so per-building heat, solar, scenario and precinct stats all work everywhere. `CITIES` table in main.js; precincts/POIs tagged `city` (real suburb outlines from Nominatim where they exist). Sydney CBD reuses the Landsat scene + trees; others get proxy roof heat (footprint, low rise, distance to green, ~600 m patches) around a summer `surf` °C. Switch by typing a city in search (datalist) or `?city=london`. No POIs outside Parramatta.
  - City switcher in nav/search. Globe fly between cities. Reuse tile `building-3d` (no Overpass) with precinct-level
    heat tint only; Open-Meteo per city. Skip if time is short.

- [x] **6a. Smooth city-to-city flight** (owner-raised 2026-10-03, verify fps in Chrome)
  - Flight is choppy: it keeps pitch 60 the whole way (loads masses of horizon tiles) and parses/uploads the next
    city's 7 MB of buildings mid-flight. Fly flat with the old city cleared, load + tilt up on landing.
  - Done (owner's idea): pull back to the globe, load there (building layers minzoom 12, so no render cost), dive in flat, tilt on landing. Worst frame 950 → 158 ms, p95 25 → 8.5 ms.

- [x] **6b. Real POIs in every city, sidebar counts from them** (owner-raised 2026-10-03)
  - Done 2026-10-03: Overpass was down, so `scripts/fetch-pois.mjs` bakes from Nominatim's [tag] search (160 POIs). OSM aged-care tagging is sparse (London/Suva 0). Rerun via Overpass later if counts look thin. Added one real secondary emission site per city (not Suva), same wind, short plume.
  - Pins only exist in Parramatta. Bake all named schools + aged care per city box from Overpass
    (`scripts/fetch-pois.mjs`, curl). Panel Schools / Aged care = real count inside the selected precinct (or box).
    Pins: a spread-out subset when nothing is selected, every pin inside the precinct when one is.

- [x] **6c. Search any real address, anywhere** (owner-raised 2026-10-03)
  - Done 2026-10-03: Photon suggestions (debounced, cities + precincts listed first); address in a city box switches city, selects its precinct, drops a red address pin (visible at all zooms). Outside the boxes it only flies + pins; live mode split out to 6e (owner: not for the demo).
  - Geocode from the browser (Photon/Nominatim, debounced suggestions list styled like the design) → globe fly to it.
  - Inside a baked city box: switch to that city and select the precinct containing the point, drop an address pin.
  - Anywhere else ("live mode"): harvest the vector-tile buildings in view (`querySourceFeatures`, dedupe by id) into
    the `bld` source with proxy heat, so heat/solar/scenario still work; panel name = place name, live Open-Meteo
    temp + AQ at the point, ref = nearest coast/rural point (or a fixed offset); a ~1 km circle as the one "precinct";
    runtime Overpass for POIs. Blast radius: CITY assumptions in renderPanel/layerRow/plume/crumbs/legend.

- [ ] **6e. Live mode for addresses outside the baked cities** (split from 6c; only if the owner asks)
  - The "Anywhere else" bullet of 6c above.

- [x] **6d. Sidebar follows the map** (owner-raised 2026-10-03: "sidebar is dumb about what's on the map")
  - Done 2026-10-03: row highlight/dim tried and reverted (owner: keep rows as they were). Roof row adds "% roofs hot" (>1 °C over median), solar row adds roof count, both from the buildings in view. Canopy stays a precinct prop (NDVI only exists for Sydney).
  - Active layers' rows highlighted/expanded, inactive ones dimmed; legend and rows agree.
  - [x] Click a building → small aesthetic popup: name, else address (bake OSM `name` / `addr:*` into the building
    files; fall back to Nominatim reverse on click), coords, plus height, roof °C vs avg, solar MWh. (owner-raised)
    Done: Nominatim reverse at click time (no re-bake); name kept only for buildings/venues, else street address.
  - Precinct stats derived from the map where possible (buildings count, hottest roofs share, solar) instead of static props.

- [x] **7a. Budget optimizer: "which roofs get the money"** (~30 min, owner-approved 2026-10-03, replaces "Ask the twin" chatbot)
  - Done 2026-10-03: budget slider replaces Coverage (coverage = roof area the budget buys at $45/m²). "Hot" = over the precinct median (city median left the cool CBD with almost nothing to fund, so budget >$2M changed nothing). Results replace the KPI grid + levers while optimized; Reset brings them back. Ref points moved to airport stations (SYD, MEL, LHR, NAN). Residents = 450/school + 80/aged care within 200 m of a funded roof + 65+ share of nearby buildings.
  - Left: scenario panel overflows ~170 px at a 911 px-tall window (base scenario already did); fine at 1080p+. Popup "vs avg" is city median, list "+°C" is precinct median.
  - Pitch chain (one beat per competitor): hazard (FortyGuard) → which roofs (Satellite Vu) → budgeted what-if with
    equity (UrbanFootprint) → bankable brief (ClimateView, item 7b). User = council officer with $2M to justify.
  - Headline delta reworded as "vs airport station" (hyperlocal-vs-airport framing).
  - Scenario card: budget slider $0.5M–$5M + "Optimize" button. Plain JS, call it an optimizer (not ML).
    Score = roof °C over median × roof area × 1/(d + 100 m) to nearest school/aged care; greedy fill by fixed $/m² cool roof.
  - Chosen roofs pulse teal. Panel: "N× more cooling per $ vs uniform rollout" (computed vs even spread, same budget),
    "N vulnerable residents protected", top 5 targets (click → fly to building).
  - Done when: moving the budget + Optimize visibly picks/pulses roofs and the metrics + list update, verified in Chrome.

- [x] **7b. Gemini business case** (~25 min)
  - Done 2026-10-03: `gemini-2.5-flash-lite` (cheapest; `GEMINI_MODEL` env overrides). Export runs Optimize if needed, then the brief replaces the optimizer results + layer rows; second click prints. Benefit model in the facts: $3.2/m²/yr energy, 10 W/m² peak, $180/yr health per protected resident. Canned fallback verified; live Gemini path needs the key in the dev-server env.
  - Vite `configureServer` middleware `POST /api/brief` → Gemini (`GEMINI_API_KEY` env; check current model id first).
    Input: city, precinct, live temp/PM2.5, 65+ %, schools/aged care, budget, optimizer metrics, top targets.
    Output 3 sections: hazard, funded intervention plan, ROI (payback, peak grid demand, health/equity). COP31 framing OK.
  - Renders in the panel and in the "Export council brief" print view. Canned fallback if no key / offline.
  - Done when: the brief generates, shows in the panel and prints cleanly. Video ends on this printed artifact.

- [ ] **8. Arduino DS18B20 ground sensor** (~20 min)
  - `arduino/sensor.ino`: Uno R3 + DS18B20 (OneWire + DallasTemperature libs), prints `°C` as one number per line at 9600.
  - Web Serial button "Connect sensor" → live reading on a pulsing pin "Ground sensor · live", panel shows satellite vs ground
    delta ("calibration"). Simulated fallback if no port.

- [ ] **9. Capture mode + repo polish** (~25 min)
  - Key `c` hides chrome and runs a cinematic path: globe spin → fly-in → orbit precinct → scenario apply. For recording.
  - [x] New root `README.md`: project pitch, architecture diagram (mermaid), data sources & attribution table, run instructions, licence (MIT).
  - Video shot list in `docs/VIDEO.md`.


## Not doing

Login, backend database, real Copernicus CDS downloads (swap in later if an account appears), tests, deployment, mobile.
