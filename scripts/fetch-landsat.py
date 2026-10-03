# One-off: Landsat 8 surface temperature (band lwir11, 100 m) over Greater Sydney -> data/lst-landsat*.png.
# Rendered server-side by Microsoft Planetary Computer (keyless). 9 Jan 2026, path 089 rows 083+084 (same pass,
# mosaicked). rescale = 35..50 °C in raw DN (K = DN*0.00341802 + 149). BBOX must match LANDSAT in src/main.js.
# Run: python scripts/fetch-landsat.py   (needs Pillow)
import io, urllib.request
from PIL import Image, ImageChops

BBOX, SIZE = '150.70,-34.10,151.35,-33.55', (2400, 2031)
ITEMS = ['LC08_L2SP_089083_20260109_02_T1', 'LC08_L2SP_089084_20260109_02_T1']
FEATHER = 0.12  # fraction of each side faded to transparent so the image blends into MODIS


def mosaic(extra):
    out = None
    for item in ITEMS:
        url = (f'https://planetarycomputer.microsoft.com/api/data/v1/item/bbox/{BBOX}/{SIZE[0]}x{SIZE[1]}.png'
               f'?collection=landsat-c2-l2&item={item}&assets=lwir11&rescale=46563,50951&nodata=0{extra}')
        im = Image.open(io.BytesIO(urllib.request.urlopen(url, timeout=300).read()))
        if out is None: out = im
        else: out.paste(im, (0, 0), im.getchannel('A'))  # later scene only fills gaps
    return out


# Greyscale (0..255 = 35..50 °C): read per building in src/main.js. No feather, values must stay exact.
gray = mosaic('')
gray.save('data/lst-landsat-gray.png', optimize=True)

# Colour drape = same thermal ramp as the buildings (slate blue -> yellow -> red, HEAT_COLOR in src/main.js),
# but over MID ± SPREAD °C since the ground (water, parks, roads) varies far more than roofs do.
MID, SPREAD = 45.8, 5
STOPS = [(-1, (0x2b, 0x3a, 0x67)), (0, (0xf5, 0xc5, 0x42)), (1, (0xe5, 0x48, 0x4d))]


def ramp(v):
    x = max(-1, min(1, ((35 + v / 255 * 15) - MID) / SPREAD))
    (x0, c0), (x1, c1) = (STOPS[0], STOPS[1]) if x <= 0 else (STOPS[1], STOPS[2])
    f = (x - x0) / (x1 - x0)
    return [round(a + (b - a) * f) for a, b in zip(c0, c1)]


lut = [ramp(v) for v in range(256)]
L, A = gray.getchannel('L'), gray.getchannel('A')
col = Image.merge('RGBA', [L.point([c[i] for c in lut]) for i in range(3)] + [A])
w, h = col.size
fx = [min(1, x / (w * FEATHER), (w - 1 - x) / (w * FEATHER)) for x in range(w)]
fy = [min(1, y / (h * FEATHER), (h - 1 - y) / (h * FEATHER)) for y in range(h)]
fade = Image.new('L', (w, h))
fade.putdata([int(255 * (a * b) ** 0.5) for b in fy for a in fx])
col.putalpha(ImageChops.multiply(A, fade))
col.save('data/lst-landsat.png', optimize=True)
