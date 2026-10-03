# One-off: Landsat 8 NDVI (30 m) over Greater Sydney -> data/ndvi-landsat*.png. Same 9 Jan 2026 pass, bbox
# and size as fetch-landsat.py (BBOX must match LANDSAT in src/main.js). Rendered by Planetary Computer from
# surface reflectance (SR = DN*0.0000275 - 0.2, so the -0.4 offset cancels in nir-red but not in nir+red).
# Run: python scripts/fetch-ndvi.py   (needs Pillow)
import io, urllib.parse, urllib.request
from PIL import Image

BBOX, SIZE = '150.70,-34.10,151.35,-33.55', (2400, 2031)
ITEMS = ['LC08_L2SP_089083_20260109_02_T1', 'LC08_L2SP_089084_20260109_02_T1']
EXPR = urllib.parse.quote('(nir08-red)/(nir08+red-14545.45)')

out = None
for item in ITEMS:
    url = (f'https://planetarycomputer.microsoft.com/api/data/v1/item/bbox/{BBOX}/{SIZE[0]}x{SIZE[1]}.png'
           f'?collection=landsat-c2-l2&item={item}&expression={EXPR}&asset_as_band=true&rescale=0,0.8&nodata=0')
    im = Image.open(io.BytesIO(urllib.request.urlopen(url, timeout=300).read())).convert('LA')
    if out is None: out = im
    else: out.paste(im, (0, 0), im.getchannel('A'))  # later scene only fills gaps

# Greyscale (0..255 = NDVI 0..0.8): trees are grown from this in src/main.js.
out.save('data/ndvi-landsat-gray.png', optimize=True)

# Colour drape: bare ground transparent, vegetation fades in from NDVI 0.2 and deepens to dark green.
LO, HI = 0.2 / 0.8 * 255, 0.65 / 0.8 * 255
STOPS = [(0, (0x84, 0xcc, 0x16)), (0.5, (0x22, 0xc5, 0x5e)), (1, (0x06, 0x5f, 0x46))]


def ramp(v):
    f = max(0, min(1, (v - LO) / (HI - LO)))
    (x0, c0), (x1, c1) = (STOPS[0], STOPS[1]) if f <= 0.5 else (STOPS[1], STOPS[2])
    g = (f - x0) / (x1 - x0)
    return [round(a + (b - a) * g) for a, b in zip(c0, c1)] + [0 if v < LO else round(90 + 165 * f)]


lut = [ramp(v) for v in range(256)]
L, A = out.getchannel('L'), out.getchannel('A')
bands = [L.point([c[i] for c in lut]) for i in range(4)]
bands[3] = Image.composite(bands[3], Image.new('L', out.size, 0), A)
Image.merge('RGBA', bands).quantize(64, method=Image.Quantize.FASTOCTREE).save('data/ndvi-landsat.png', optimize=True)
