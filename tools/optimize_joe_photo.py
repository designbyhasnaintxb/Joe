"""Crop + encode Joe's portrait for the site.

Usage:  python3 tools/optimize_joe_photo.py path/to/joe-photo.jpg

Writes joe/assets/img/joe-borzello-{480,960}.{avif,webp,jpg} (4:5, 480x600 and 960x1200),
which index.html already references (hero inset, credential card, inquiry ticket).

The crop keeps head and shoulders and stops ABOVE the cartoon print on the hoodie (licensed
characters) and trims most of the sponsor banners behind him. Fractions were set against the
1334x1179 original; check the 960 JPG by eye if a different photo is used.
"""
import os, sys
from PIL import Image, ImageOps

CROP = (0.19, 0.0, 0.814, 0.88)   # left, top, right, bottom as fractions of width / height
OUT = os.path.join(os.path.dirname(__file__), '..', 'joe', 'assets', 'img')

im = ImageOps.exif_transpose(Image.open(sys.argv[1])).convert('RGB')
W, H = im.size
l, t, r, b = (round(CROP[0] * W), round(CROP[1] * H), round(CROP[2] * W), round(CROP[3] * H))
# force 4:5 by trimming height from the bottom (keeps the face where it is)
h = min(b - t, round((r - l) * 5 / 4)); w = round(h * 4 / 5)
l = l + ((r - l) - w) // 2
im = im.crop((l, t, l + w, t + h))
for width in (480, 960):
    out = im.resize((width, width * 5 // 4), Image.LANCZOS)
    base = os.path.join(OUT, f'joe-borzello-{width}')
    out.save(base + '.avif', quality=55, speed=4)
    out.save(base + '.webp', quality=78, method=6)
    out.save(base + '.jpg', quality=82, optimize=True, progressive=True)
print('crop', (l, t, l + w, t + h), 'from', (W, H))
