# Changelog

One line per shipped TODO item. Newest first.

- 2026-10-04 — Item 5d: trees get trunks and tiered crowns in three species shapes (round gum, tall narrow, wide spreading) with varied greens, plus shrub tufts on lightly vegetated pixels. No new dependency.
- 2026-10-04 — Docs: documented comprehensive Discord server learnings (submission fields, 30/30/20/20 rubric, video specs, AI disclosure, and mentor tips) in docs/hackathon/discord-learnings.md.
- 2026-10-04 — Preview tunnel (`preview.amsham.net`) runs only with the dev server; `/api/brief` refuses tunnelled requests so the Gemini key stays local-only.
- 2026-10-03 — Item 7b: "Export council brief" drafts a hazard / funded plan / ROI brief via Gemini (`POST /api/brief` Vite middleware, key from `GEMINI_API_KEY`), canned fallback offline; shows in the panel and prints as a clean one-pager.

- 2026-10-03 — Item 7a: budget optimizer in the scenario card ($0.5–5M slider + Optimize): greedy cool-roof fill by heat × area × school/aged-care proximity, funded roofs pulse teal, panel shows cooling-per-$ vs uniform rollout, vulnerable residents protected, top 5 targets (click to fly). Headline delta now vs each city's airport station.

- 2026-10-03 — Repo polish & docs: comprehensive README.md with architecture diagram and data attribution table, MIT License added, .gitignore updated for editor configs, ready for GitHub push.
- 2026-10-03 — Item 6d: roof row shows % of roofs running hot, solar row the roof count, both from the mapped buildings.

- 2026-10-03 — Item 6b: real OSM schools + aged care baked for every city; panel counts them per precinct/city, pins spread out (or all inside a selected precinct). Second real emission source per city sharing the wind.
- 2026-10-03 — Item 6c: address search (Photon suggestions); an address in a modelled city switches to it, selects its precinct and drops an address pin.
- 2026-10-03 — Click any building: popup with its name or street address, suburb, roof °C vs average, height, solar MWh/yr and coordinates.

- 2026-10-03 — City switch pulls back to the globe, loads there, then dives in flat and tilts on landing: worst frame 950 → 158 ms; TODO gains 6b–6d (POIs everywhere, address search, map-aware sidebar, building popup).

- 2026-10-03 — Multi-city: Melbourne CBD, Central London, Sydney CBD and Suva (Fiji) alongside Parramatta, each with baked OSM buildings, heat/solar/scenario, 4–5 precincts and live Open-Meteo; search box switches city with a globe fly; fixed OSM height parsing ("12;15" no longer becomes 1215 m).

- 2026-10-03 — Stat tile shows Residents per precinct instead of Days over 35°C; Sources & assumptions link removed; panel spacing grows with spare height (auto margins) and never overflows (fits down to ~760 px panel height).

- 2026-10-03 — Panel layer rows always coloured and static; Tree cover tile swapped for Days over 35°C per year; panel spacing tightened to fit 855 px-tall windows.

- 2026-10-03 — Item 5c: side panel keeps air temperature as the headline and always lists all four layer metrics for the selected area (active layers coloured, others greyed, click to toggle); panel trimmed to fit without scrolling.

- 2026-10-03 — Item 5b: layers are toggle chips (Heat / Smoke / Canopy / Solar) and mix freely; legend stacks per layer; solar is a roof cap only and counts building parts (Parramatta Square tower now coloured); PM2.5 differs per precinct via the plume model; canopy uses a 30 m Landsat NDVI drape plus 3D trees grown from it.

- 2026-10-03 — Item 5: layer dropdown switches Surface heat / Smoke & aerosol (GIBS AOD + live CAMS PM2.5/AQI + animated plume from Camellia) / Tree canopy (GIBS NDVI, parks brightened) / Solar potential (roof area × irradiance per building); legend and panel headline follow the layer. Location bits moved into one `CITY` config.

- 2026-10-03 — Map credits start collapsed to the (i) icon instead of an open bar.
- 2026-10-03 — POI pins show just School / Aged care; name and details appear on hover.
- 2026-10-03 — Item 3b: POI pins are 10 real OSM schools and aged-care homes (Overpass, curl); pins show the name, hover adds type, street and Landsat surface temp vs the local average.
- 2026-10-03 — Scenario card simulates on open (no Apply button); levers and slider update live; Export brief is the main button, Reset is a small button in the card header.
- 2026-10-03 — Item 4: scenario simulator. CTA swaps the stat tiles for a card (cool roofs / canopy / solar, coverage slider); Apply eases the precinct's buildings to cyan/green over 1.5 s while KPIs count up; slider updates live; Reset reverses; Export brief = window.print() of the panel.
- 2026-10-03 — Feat: clickable precincts (teal outline, name pill, camera ease, panel stats), school/aged-care pins, decluttered no-scroll side panel.
- 2026-10-03 — Fix: Landsat ground drape recoloured to the same thermal ramp as buildings (over ±5 °C), baked locally from the greyscale mosaic.
- 2026-10-03 — Fix: buildings use a thermal-camera ramp (slate blue → yellow → red); legend reduced to one minimal Cooler/Hotter bar.
- 2026-10-03 — Item 2c: buildings use a cool/hot diverging ramp vs the Parramatta average (towers damped); Landsat drape now covers Greater Sydney with feathered edges; OSM buildings widened to ~8×7 km.
- 2026-10-03 — Item 2b: 100 m Landsat surface temperature at city zoom; buildings coloured by real Landsat temp at their footprint; fixed grey roofs (tile/our building z-fight) and missing towers (OSM building parts).
- 2026-10-03 — Fix: MapLibre worker now loads under Vite (basemap and vector tiles were not rendering); LST switched to 8-day composite and faded out at street zoom; session rule to verify visually in Claude in Chrome.
- 2026-10-03 — Item 2: committed Parramatta OSM buildings (3,462) with derived per-building heat via feature-state, NASA GIBS MODIS LST drape (latest available date), live Open-Meteo temperature vs coastal Sydney in the panel.
- 2026-10-03 — Item 1: Vite + MapLibre scaffold, dark-recoloured liberty style on a spinning globe, auto fly-in to Parramatta 3D buildings, static light UI shell (nav, search, layer select, 2D/3D, legend, side panel).
- 2026-10-03 — Planning: session rules (CLAUDE.md/AGENTS.md), TODO build order, verified API notes, research docs moved to docs/hackathon, design reference saved.
