#!/usr/bin/env python3
"""
tasko – App-Screens freistellen (Hintergrund um den Handyrahmen transparent)

Einmalig einrichten:
    python3 -m pip install pillow numpy

Aufruf (Originale als JPG, Ergebnis als PNG + WebP mit Transparenz):
    python3 scripts/cutout.py assets/img _vorlage/original-bilder/app1.jpg

Vorgehen:
- Flood-Fill von allen Bildrändern mit enger Toleranz (TOL) zur Hintergrundfarbe,
  die aus den vier Ecken bestimmt wird.
- Als Handy gilt die zusammenhängende Fläche um die Bildmitte. Alles andere wird
  transparent (auch einzelne JPEG-Krümel).
- Auf den äußeren BAND Pixeln des Rahmens wird die Deckkraft aus der Mischung
  Rahmen/Hintergrund zurückgerechnet und die Farbe vom Hintergrundanteil befreit.
  So bleibt kein grauer Saum. Das Innere des Handys bleibt unverändert.
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image

TOL = 10.0      # max. Farbabstand zum Hintergrund für den Flood-Fill
BAND = 3        # Breite der weichen Kante in px (außerhalb der Fläche, innen an der Kante)

def dilate(m):
    o = m.copy()
    o[1:] |= m[:-1]; o[:-1] |= m[1:]; o[:, 1:] |= m[:, :-1]; o[:, :-1] |= m[:, 1:]
    return o

def grow(seed, allowed):
    reg = seed & allowed
    while True:
        nxt = dilate(reg) & allowed
        if (nxt == reg).all():
            return reg
        reg = nxt

def process(src, out_dir):
    img = np.asarray(Image.open(src).convert('RGB')).astype(np.float64)
    h, w, _ = img.shape
    corners = np.array([img[0, 0], img[0, -1], img[-1, 0], img[-1, -1]])
    bg = np.median(corners, axis=0)
    dist = np.sqrt(((img - bg) ** 2).sum(-1))

    # 1. Flood-Fill von allen Randpixeln aus
    seed = np.zeros((h, w), bool)
    seed[0, :] = seed[-1, :] = seed[:, 0] = seed[:, -1] = True
    outside = grow(seed, dist < TOL)

    # 2. Handy = größte Fläche, die nicht außen liegt (gefüllt vom Bildzentrum aus)
    cseed = np.zeros((h, w), bool); cseed[h // 2, w // 2] = True
    phone = grow(cseed, ~outside)
    outside = ~phone

    # 3. Weiche Kante: Pixel des Handys bis BAND px an der Außenfläche
    near = outside.copy()
    for _ in range(BAND):
        near = dilate(near)
    band = near & phone

    # Rahmenfarbe: Median der Handypixel direkt hinter dem Band
    ring = dilate(dilate(band)) & phone & ~band
    frame = np.median(img[ring], axis=0)
    span = np.sqrt(((frame - bg) ** 2).sum())

    alpha = np.ones((h, w))
    alpha[outside] = 0.0
    a_band = np.clip(dist[band] / span, 0.0, 1.0)
    alpha[band] = a_band

    # Farbe im Band vom Hintergrundanteil befreien
    out = img.copy()
    ab = np.maximum(a_band, 1e-3)[:, None]
    out[band] = np.clip(bg + (img[band] - bg) / ab, 0, 255)
    out[outside] = 0

    rgba = np.dstack([out, alpha * 255]).round().astype(np.uint8)
    im = Image.fromarray(rgba)
    name = Path(src).stem
    im.save(out_dir / f'{name}.png', optimize=True)
    im.save(out_dir / f'{name}.webp', quality=82, alpha_quality=100, method=6)
    changed_inside = int((band.sum()))
    print(f'{name}: bg={bg.round()} frame={frame.round()} band_px={changed_inside} transparent={int(outside.sum())}')

if __name__ == '__main__':
    out_dir = Path(sys.argv[1])
    for src in sys.argv[2:]:
        process(src, out_dir)
