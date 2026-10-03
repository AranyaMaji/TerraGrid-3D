# Resume notes

- **2026-10-03 — Composable map layers.** Single-choice layer dropdown let viewers see one dataset at a time and forced a full recolour on every switch. Redesigned as freely mixable toggles: heat colours building walls, solar potential paints only rooftop caps, canopy adds 3D trees, smoke adds an animated plume, so any combination renders together on one 3D city.
- **2026-10-03 — Street-level air quality.** Every precinct showed the same PM2.5 because the global CAMS model has a ~40 km grid. Added a plume dispersion term on top of the live reading so exposure varies by neighbourhood (25.0 vs 11.7 µg/m³ across Parramatta) and matches the plume shown on the map.
- **2026-10-03 — 64× sharper vegetation data.** Tree canopy was a flat 250 m MODIS wash. Switched to 30 m Landsat NDVI and grew ~1 3D tree per vegetated pixel, turning a texture into a volumetric urban forest.
