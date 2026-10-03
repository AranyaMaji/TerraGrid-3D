# Changelog

One line per shipped TODO item. Newest first.

- 2026-10-03 — Fix: buildings use a thermal-camera ramp (slate blue → yellow → red); legend reduced to one minimal Cooler/Hotter bar.
- 2026-10-03 — Item 2c: buildings use a cool/hot diverging ramp vs the Parramatta average (towers damped); Landsat drape now covers Greater Sydney with feathered edges; OSM buildings widened to ~8×7 km.
- 2026-10-03 — Item 2b: 100 m Landsat surface temperature at city zoom; buildings coloured by real Landsat temp at their footprint; fixed grey roofs (tile/our building z-fight) and missing towers (OSM building parts).
- 2026-10-03 — Fix: MapLibre worker now loads under Vite (basemap and vector tiles were not rendering); LST switched to 8-day composite and faded out at street zoom; session rule to verify visually in Claude in Chrome.
- 2026-10-03 — Item 2: committed Parramatta OSM buildings (3,462) with derived per-building heat via feature-state, NASA GIBS MODIS LST drape (latest available date), live Open-Meteo temperature vs coastal Sydney in the panel.
- 2026-10-03 — Item 1: Vite + MapLibre scaffold, dark-recoloured liberty style on a spinning globe, auto fly-in to Parramatta 3D buildings, static light UI shell (nav, search, layer select, 2D/3D, legend, side panel).
- 2026-10-03 — Planning: session rules (CLAUDE.md/AGENTS.md), TODO build order, verified API notes, research docs moved to docs/hackathon, design reference saved.
