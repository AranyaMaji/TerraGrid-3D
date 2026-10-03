#!/bin/sh
# One-off: Landsat 8 surface temperature (band lwir11, 100 m) for Parramatta → data/lst-landsat.png.
# Rendered server-side by Microsoft Planetary Computer (keyless). Scene: 9 Jan 2026, 0.02% cloud.
# rescale = 35..50 °C in raw DN (K = DN*0.00341802 + 149). Must match LANDSAT in src/main.js.
ITEM=LC08_L2SP_089083_20260109_02_T1
BBOX=150.90,-33.90,151.10,-33.73
curl -s -m 180 -o data/lst-landsat.png \
  "https://planetarycomputer.microsoft.com/api/data/v1/item/bbox/$BBOX/2048x1782.png?collection=landsat-c2-l2&item=$ITEM&assets=lwir11&rescale=46563,50951&colormap_name=inferno&nodata=0"
# Same scene as greyscale (0..255 = 35..50 °C): read per building in src/main.js.
curl -s -m 180 -o data/lst-landsat-gray.png \
  "https://planetarycomputer.microsoft.com/api/data/v1/item/bbox/$BBOX/2048x1782.png?collection=landsat-c2-l2&item=$ITEM&assets=lwir11&rescale=46563,50951&nodata=0"
