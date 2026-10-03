# Changelog

One line per shipped TODO item. Newest first.

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
