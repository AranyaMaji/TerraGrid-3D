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
  - Fix 2026-10-04: Sydney CBD's NDVI is cloud-noisy (trees in the harbour), other cities had none. Non-Parramatta trees now come from OSM (`node scripts/fetch-green.mjs <city>`): mapped trees + scatter in parks/woods/grass. Suva is thin (170 mapped trees, 31 areas).
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
  - Done 2026-10-03: `gemini-3.5-flash-lite` (cheapest; 2.5 was retired for new keys 2026-10-04; `GEMINI_MODEL` env overrides). Export runs Optimize if needed, then the brief replaces the optimizer results + layer rows; second click prints. Benefit model in the facts: $3.2/m²/yr energy, 10 W/m² peak, $180/yr health per protected resident. Canned fallback verified; live Gemini path needs the key in the dev-server env.
  - Vite `configureServer` middleware `POST /api/brief` → Gemini (`GEMINI_API_KEY` env; check current model id first).
    Input: city, precinct, live temp/PM2.5, 65+ %, schools/aged care, budget, optimizer metrics, top targets.
    Output 3 sections: hazard, funded intervention plan, ROI (payback, peak grid demand, health/equity). COP31 framing OK.
  - Renders in the panel and in the "Export council brief" print view. Canned fallback if no key / offline.
  - Done when: the brief generates, shows in the panel and prints cleanly. Video ends on this printed artifact.

- [x] **7c. Cool roof program: Public | Council views, offer letters, owner enrolment** (raised 2026-10-04)
  - Done 2026-10-04: nav toggle (Council default, so the existing demo is unchanged). Council: after Optimize, "Send offer letters" gives each funded roof a one-time code (CP-1234) and opens a printable letter (Nominatim address, Landsat roof °C, cost, $/yr saved, nearest school/aged care). Map caps by stage (Offered → Applied → Enrolled → Coated (white) → Verified) + pipeline counts card; building popup advances the stage. Public: popup shows $/yr a cool roof saves + "Apply" form; letter code enrols at once, rates number = Applied until council confirms ownership. Owners only see buildings they applied for. Status kept in localStorage (demo); no email stored.
  - Verification step is simulated (stated in the popup and letter). Production: staff login, rates-system addresses, installer invoice + next Landsat pass before payment.
  - Demo: Council → Optimize → Send letters → note a code → Public → click that building → Apply with the code → Council shows Enrolled.
  - Blast radius for round 2: letters read `last.chosen` from `optimize()` (`c.f`, `c.ex`, `c.cost`, `c.near`, `c.d`). If item 12 rewrites the optimizer, keep those fields.

## Round 2: retrofit priority (teammate feedback 2026-10-04, ordered by judge impact; do before 8/9)

Pitch: a screening and prioritisation tool that tells a government which buildings to fix first, with what, for how much.
Data stance: real where cheap (Landsat roof °C, OSM footprints/storeys/type, Open-Meteo climate); everything else is
derived from published benchmarks and shown as if real. UI never says sample/dummy/illustrative.

Shared foundation: ONE per-building energy model in main.js, computed in `loadCity` next to `mwh`, stored on
`f.properties` (`floor`, `type`, `kwh`, `cool_kwh`, `extra_kwh`, `conf`). Every item below reads it; nothing recomputes it.
Constants (EUI by type, cooling share, % cooling per °C, $/kWh per city, measure costs/savings/life) live in one
`ENERGY` table + one `MEASURES` table at the top of main.js. Sanity-check the numbers against published sources
before baking (NABERS/CBECS-style EUI, AU/UK tariffs, cool-roof and HVAC retrofit costs): ask the owner before
dispatching a researcher.

Shared blast radius (check all of these on every item):
`loadCity` (model build) · `renderPanel` + `layerRow` (panel must still fit at 1080p, already ~170 px over at 911 px) ·
`target`/`draw`/`animateTo` (scenario KPIs) · `optimize` (ranking) · `buildingPopup` · `makeBrief` facts + canned text ·
`vite.config.js` prompt · print CSS · all 5 cities (proxy-heat cities have no Landsat: confidence differs).

- [x] **10. Energy model + "extra cooling cost from local heat" headline** (~45 min)
  - Done 2026-10-04: OSM type/levels re-baked (Overpass up; ~70% of tags are `yes`, inferred via POI/height/area, `conf` = osm|inferred). Reference = city's coolest 10% of roofs; 7% cooling per °C. Per-city `kwh$`, `cur`, `cool` in CITIES. Parramatta CBD $557,600, Harris Park $1.22M, Southbank $3.37M, Central London £11.2M.
  - Type: OSM `building` tag. Building files don't keep it: add `type` (and `levels`) to `scripts/fetch-buildings.mjs`
    output and re-bake via curl-saved Overpass. If Overpass is down: infer (POI school/aged care inside footprint →
    that type; height > 30 m → office in CBD precincts, apartment elsewhere; else house/retail by area).
  - Floor area = footprint × storeys (`levels` or height / 3.2). Baseline kWh = floor × EUI[type]; cooling kWh = × cooling share.
  - Extra from local heat = cooling kWh × k%/°C × max(0, roof °C − city reference). Cost = × $/kWh[city].
  - Panel: new line under the delta, heat red: "$547,800 / yr extra cooling from local heat" for the precinct (or city).
    Fits in the space of one lrow; do not add a tile.
  - Done when: number changes per precinct and per city, looks plausible (Parramatta CBD in the $100k–$1M range), panel fits.

- [x] **11. Retrofit measures in the scenario: energy saved, cost, payback, buildings reached** (~45 min)
  - Done 2026-10-04: `MEASURES` + `retrofit()` in main.js; roof measures and trees only reach the top two floors (else towers paid back in months). Without Optimize the budget funds best saving-per-$ buildings first. 6 KPIs: saved/yr, payback, capex, MWh/yr, t CO₂/yr (per-city `co2` grid factor, replaced the always-~0% "precinct energy"), buildings reached. Parramatta CBD, $2M, all on: $580k/yr, 3.4 yrs, 13 buildings. Panel ~90 px over at 855 px tall, fits at 1080p.
  - `MEASURES`: cool roofs, tree canopy, rooftop solar, insulation, efficient HVAC, smart controls. Each: applies-to types,
    cost basis ($/m² roof | $/m² floor | $/tree), % saving of cooling or total kWh, useful life.
  - Levers: replace the 3 checkboxes with 6 compact toggle chips (same style as the layer chips, saves height).
  - Replace the hardcoded `target()` KPIs (4.2 °C / 18% / 320 MWh / $48k) with sums over the precinct's buildings:
    MWh/yr saved, $/yr saved, capex, payback yrs, buildings reached. Keep the count-up animation and cooling colour.
  - Budget slider still caps spend; optimizer cost = chosen measure's cost, not flat $45/m².
  - Done when: toggling a measure visibly changes every KPI and payback, Optimize still pulses roofs.

- [x] **12. Retrofit priority map with adjustable weights + confidence** (~50 min, the core government feature)
  - Done 2026-10-04: inputs are percentile ranks; heat has a fixed 0.5 weight, sliders 0–2. Priority recolours walls (replaces heat walls while on, heat drape stays); ramp stretched over score quantiles. Moving a weight auto-runs Optimize. List names from Nominatim reverse (cached, 1/s). Best fix = biggest demand-side saving that pays back within its life (solar excluded), per-building condition factor 0.55–1.45 so paybacks vary; sliders show % share; any slider (weights, budget) re-optimizes instantly, button kept for show; a site's buildings merge into one list row; brief gets weights + list rows. Left: optimized panel ~207 px over at 855 px tall.
  - New layer chip "Priority": buildings coloured by score (teal ramp), on top of heat. Score per building =
    w1·savings $/yr + w2·(1/payback) + w3·public/vulnerable (school, aged care, hospital, public building, 65+ share)
    + heat exposure, each normalised 0–1. Best measure per building = highest saving per $ among those it applies to.
  - 3 weight sliders (Savings / Payback / Vulnerable people) in the scenario card; dragging recolours live.
    `optimize()` greedy fill uses this score (replaces roof °C × area / distance), keep "× per $ vs uniform".
  - Top-targets list: name/address, type, best measure, $/yr saved, payback. Click → fly + popup (exists).
  - Confidence per input: measured (Landsat roof °C, OSM footprint), estimated (floor area, energy, proxy roof °C),
    missing (metered energy). Small dot badges in the popup and list; score shows a ± band when inputs are estimated.
  - Done when: moving a weight reorders the list and recolours the map; popup shows type, best measure, payback, badges.

- [x] **12b. Integrate teammate PR #1 (item 7c, cool roof program) onto items 10–12** (~45 min, do FIRST: every later item touches optimize/popup, so conflicts only grow)
  - Done 2026-10-04: merged locally (5cf1f44, teammate commits kept), then one fix commit. Letters and the public popup name the building's best fix and its capex/saving (falls back to the chosen measures' plan when no single fix pays back). `ex` restored in `optimize()`. Program renamed Retrofit program, stage label Installed (key stays `coated` so saved status survives). Prototype notes moved to README "Production path". Public hides priority and confidence dots. Not pushed: PR #1 stays open until the owner says push.
  - PR: `tiasella1802-alt:teammate-changes`, 2 commits (1a3a97c, f0d185d), branched from e6d82a7. Fetched locally as `pr-1`.
    Adds Public | Council nav toggle, offer letters with CP-#### codes, owner apply form, stage caps
    (Offered → Applied → Enrolled → Coated → Verified), pipeline card `#prog`, status in localStorage `tg-program`.
  - How: `git merge --no-ff pr-1` locally (keeps the teammate's commits and authorship), resolve, then one `fix:` commit
    for the semantic breaks below. Do not merge on GitHub; pushing closes the PR, and that needs the owner's go.
  - Textual conflicts (trial `git merge-tree`): CHANGELOG.md (keep both lines); main.js ×5:
    - `loadCity` tail: keep master's `applyLayers()` AND the PR's `renderProgram()`.
    - `buildingPopup`: take master's popup (type, best fix, payback, priority, confidence dots, `placeName`), append
      `progHtml(f)` + `wireProg(el, f)`. Drop the PR's own Nominatim fetch; save `r.addr` from `placeName`'s result (cached, 1 req/s).
    - Scenario constants: master's `ZERO`/`plan()`/`lev` win; drop the PR's `SAVE`.
    - `makeBrief` energy: master's `target().usd`.
    - `.scn` oninput: keep master's `showWeights()` handler, then the PR's program block after it.
  - Semantic breaks (merge cleanly, then fail at runtime):
    - `showLetter` reads `c.ex`, which master's optimizer no longer sets → crash on Send letters. Add `ex` back in
      `optimize()` (roof °C over the precinct median), as the PR's note asked.
    - `c.cost` is now the capex of ALL chosen measures, not a cool-roof coating. The letter says "reflective coating ...
      $Xk", so it's wrong when the best fix is HVAC or insulation. Letter should name `MEASURES[q.best].name`, `q.best_cap`, `q.best_usd`.
    - `saving(f)` = area × $3.2 contradicts the energy model. Use `q.best_usd` (letter + public popup).
    - Program is cool-roof-only but optimizer funds any measure. Rename to "Retrofit program", stage "Coated" → "Installed"
      (owner approved 2026-10-04). Keep white cap for Installed.
    - Owner rule: UI has no "simulated"/"prototype" text. Strip the `bp-note` verified line and the letter's `l-foot`
      (move both to README "Production path").
    - Public view: hide the scenario (PR does) and the priority score/± band in the popup (owners shouldn't see a ranking).
      Hide the confidence dots in Public too (owner approved 2026-10-04).
    - Layering: program cap and picks cap share base height+0.8. PR's `fresh` filter keeps them apart; check it survived
      the merge. Priority wall colours + program caps + solar caps: check no z-fight at z17.
  - Nav room: Public | Council now sits in nav-right; item 15's Now/2030/2050 toggle goes over the map (near 2D/3D), not the nav.
  - Done when: in Chrome, Council → Optimize → Send letters (letters show best fix + correct $) → Public → click that
    building → Apply with the code → Council shows Enrolled; slider drags still re-optimize; no console errors; all 5 cities load.

- [x] **13. AI picks the measures per suburb (Gemini)** (~30 min)
  - Done 2026-10-04: `/api/rank` shares the `/api/brief` handler (one `gemini` plugin, prompt per route). Totals per measure are summed over the precinct without the 60% cap or budget. Block sits above the lever chips, hidden once optimized; result cached per city+precinct. Brief lists measures in the AI order (`measure_order`). Fallback verified in Chrome (CBD: Smart controls › Tree canopy › Insulation; Westmead puts Tree canopy first); live Gemini path needs the key in the dev-server env.
  - New `POST /api/rank` beside `/api/brief` in `vite.config.js` (same key handling, same tunnel guard). Input: precinct
    facts + per-measure computed totals (saved $/yr, capex, payback, buildings reached, residents near). Output JSON:
    ordered top 3 measures, one-line reason each. AI orders and explains; it never invents numbers (same rule as brief).
  - Scenario card: "AI recommends" block (Gemini spark icon), clicking it switches the lever chips to that mix.
  - Feed the ranking into the brief as the plan's order. Canned fallback = sort by saving per $.
  - Done when: different suburbs get different orders with sensible reasons, fallback works with no key.

- [ ] **14. Suburb ranking ("Compare areas" tab, currently dead)** (~25 min)
  - Tab opens a ranked list in the panel: every precinct in the city by extra cooling $/yr, with roof °C, vulnerable
    residents and best measure. Sort toggle (cost / heat / vulnerable). Row click → `select()`. Optional: tint precinct
    fills by rank. 4–5 precincts per city, so no paging.
  - Done when: ranking reads at a glance and clicking a row lands on that precinct.

- [ ] **15. Future projection: Now / 2030 / 2050** (~30 min)
  - Segmented toggle near 2D/3D. Warming per city from Open-Meteo Climate API (CMIP6, keyless; verify endpoint and
    models first) baked as a ΔT per year into `CITIES`, fallback fixed ΔT per city if the API is awkward.
  - Shifts: building heat colour (add ΔT before the ramp), extra cooling cost headline, scenario savings and payback
    (hotter = faster payback, the punchline). Suburb ranking reads the same year.
  - Done when: flipping to 2050 visibly reddens the city and the $ headline jumps, then the scenario shows a shorter payback.

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
