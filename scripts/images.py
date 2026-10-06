#!/usr/bin/env python3
"""
tasko – Bildvarianten erzeugen (4:5, 960w + 640w, WebP + JPG)

Einmalig einrichten:
    python3 -m pip install pillow

Aufruf:
    python3 scripts/images.py assets/img/team/dion.jpg
    python3 scripts/images.py assets/img/team/dana.jpg --focus 0.3

Ergebnis (im Ordner des Originals, Name = Dateiname ohne Endung):
    dion.jpg  dion.webp          960 × 1200
    dion-640.jpg  dion-640.webp  640 × 800

Hinweise:
- Zugeschnitten wird mittig auf 4:5. --focus legt fest, wo vertikal
  geschnitten wird: 0 = oben, 0.5 = Mitte (Standard 0.35, gut für Porträts).
- Liegt das Original genau unter dem Ziel-Namen (z. B. dion.jpg), wird es
  vorher nach scripts/_originals/ kopiert und erst dann überschrieben.
- EXIF-Drehung wird angewendet, alle Metadaten (z. B. GPS) werden entfernt.
- Das HTML erwartet genau diese Dateinamen und width/height 960 × 1200.
"""

import argparse
import shutil
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow fehlt. Installieren mit: python3 -m pip install pillow")

RATIO = 4 / 5
WIDTHS = (960, 640)
JPG_QUALITY = 80
WEBP_QUALITY = 78
ROOT = Path(__file__).resolve().parent.parent
ORIGINALS = ROOT / "scripts" / "_originals"


def show(path):
    try:
        return path.relative_to(ROOT)
    except ValueError:
        return path


def crop_to_ratio(img, focus):
    w, h = img.size
    if w / h > RATIO:
        # zu breit → links/rechts mittig beschneiden
        new_w = round(h * RATIO)
        left = (w - new_w) // 2
        return img.crop((left, 0, left + new_w, h))
    # zu hoch → oben/unten nach --focus beschneiden
    new_h = round(w / RATIO)
    top = round((h - new_h) * focus)
    return img.crop((0, top, w, top + new_h))


def main():
    parser = argparse.ArgumentParser(description="4:5-Bildvarianten für tasko erzeugen")
    parser.add_argument("source", type=Path, help="Pfad zum Originalfoto")
    parser.add_argument("--focus", type=float, default=0.35,
                        help="vertikaler Schnittpunkt 0–1 (Standard 0.35)")
    args = parser.parse_args()

    src = args.source.resolve()
    if not src.is_file():
        sys.exit(f"Datei nicht gefunden: {args.source}")
    if not 0 <= args.focus <= 1:
        sys.exit("--focus muss zwischen 0 und 1 liegen")

    with Image.open(src) as opened:
        img = ImageOps.exif_transpose(opened).convert("RGB")
    img = crop_to_ratio(img, args.focus)

    if img.width < WIDTHS[0]:
        print(f"Warnung: Original ist nur {img.width}px breit, "
              f"960w wird hochskaliert. Besser ein größeres Foto verwenden.")

    base = src.with_suffix("")
    targets = []
    for width in WIDTHS:
        suffix = "" if width == WIDTHS[0] else f"-{width}"
        targets += [Path(f"{base}{suffix}.jpg"), Path(f"{base}{suffix}.webp")]

    # Original sichern, falls es überschrieben würde
    if src in targets:
        ORIGINALS.mkdir(parents=True, exist_ok=True)
        backup = ORIGINALS / src.name
        shutil.copy2(src, backup)
        print(f"Original gesichert: {show(backup)}")

    for width in WIDTHS:
        height = round(width / RATIO)
        resized = img.resize((width, height), Image.LANCZOS)
        suffix = "" if width == WIDTHS[0] else f"-{width}"
        jpg = Path(f"{base}{suffix}.jpg")
        webp = Path(f"{base}{suffix}.webp")
        resized.save(jpg, "JPEG", quality=JPG_QUALITY, optimize=True, progressive=True)
        resized.save(webp, "WEBP", quality=WEBP_QUALITY, method=6)
        for out in (jpg, webp):
            print(f"{show(out)}  {width}×{height}  {out.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
