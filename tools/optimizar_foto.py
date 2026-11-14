#!/usr/bin/env python3
"""Prepara assets/foto.jpg para el sitio: color natural, sin filtros, en WebP y varios tamaños.

Deja en assets/img/:
  foto-384.webp, foto-768.webp          retrato 4:5 (portada y «Sobre mí»)
  foto-cara-160.webp, foto-cara-320.webp  recorte cuadrado de la cara (bloque «Trabaja directamente conmigo»)

Si cambias la foto, ajusta CENTRO y CARA para que el recorte caiga bien.

Uso:  python3 tools/optimizar_foto.py        (necesita Pillow: pip install pillow)
"""
import sys
from pathlib import Path

from PIL import Image, ImageOps

WEB = Path(__file__).resolve().parent.parent
ORIGEN = WEB / "assets" / "foto.jpg"
DESTINO = WEB / "assets" / "img"

if not ORIGEN.exists():
    sys.exit(f"No encuentro {ORIGEN}. Guarda ahí tu foto y vuelve a correr este programa.")

CENTRO = (0.5, 0.35)                                       # hacia dónde se centra el recorte 4:5
CARA = {"centro_x": 0.455, "arriba": 0.045, "lado": 0.56}  # recorte cuadrado, como fracción del retrato

foto = ImageOps.exif_transpose(Image.open(ORIGEN)).convert("RGB")
retrato = ImageOps.fit(foto, (768, 960), Image.LANCZOS, centering=CENTRO)

DESTINO.mkdir(parents=True, exist_ok=True)
for ancho in (384, 768):
    salida = DESTINO / f"foto-{ancho}.webp"
    retrato.resize((ancho, ancho * 5 // 4), Image.LANCZOS).save(salida, "WEBP", quality=86, method=6)
    print(f"{salida.relative_to(WEB)}  {salida.stat().st_size / 1024:.0f} KB")

lado = int(768 * CARA["lado"])
x0 = int(768 * CARA["centro_x"] - lado / 2)
y0 = int(960 * CARA["arriba"])
cara = retrato.crop((x0, y0, x0 + lado, y0 + lado))
for ancho in (160, 320):
    salida = DESTINO / f"foto-cara-{ancho}.webp"
    cara.resize((ancho, ancho), Image.LANCZOS).save(salida, "WEBP", quality=86, method=6)
    print(f"{salida.relative_to(WEB)}  {salida.stat().st_size / 1024:.0f} KB")
print("Listo. Recarga la página.")
