#!/usr/bin/env python3
"""Prepara assets/foto.jpg para el sitio: color natural, sin filtros ni metadatos, en WebP y varios tamaños.

Deja en assets/img/:
  foto-384.webp, foto-768.webp            retrato 4:5 (portada, «Sobre mí» e imagen para compartir)
  foto-cara-160.webp, foto-cara-320.webp  recorte cuadrado de la cara («Trabaja directamente conmigo»)

Si cambias la foto, ajusta RETRATO y CARA para que la cara quede centrada y completa. Para revisar el
resultado sin abrir el sitio:  python3 tools/optimizar_foto.py --muestra  (deja una hoja de control en /tmp).

Uso:  python3 tools/optimizar_foto.py        (necesita Pillow: pip install pillow)
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps

WEB = Path(__file__).resolve().parent.parent
ORIGEN = WEB / "assets" / "foto.jpg"
DESTINO = WEB / "assets" / "img"

if not ORIGEN.exists():
    sys.exit(f"No encuentro {ORIGEN}. Guarda ahí tu foto y vuelve a correr este programa.")

# Ajustado para la foto de noviembre de 2026 (1277 × 832, camisa azul oscuro): la cabeza va de y≈112
# (pelo) a y≈285 (barbilla) y su centro está en x≈603. Todo en fracciones de la foto original.
# Retrato 4:5: un recorte más cerrado que la foto completa, para que la cara no quede pequeña;
# va de un poco arriba del pelo hasta justo encima de las manos.
RETRATO = {"centro_x": 603 / 1277, "arriba": 50 / 832, "alto": 660 / 832}
# Cara: recorte cuadrado, en fracciones del retrato 4:5 ya recortado (cabeza completa y hombros).
CARA = {"centro_x": 0.5, "arriba": 0.06, "lado": 0.6}

foto = ImageOps.exif_transpose(Image.open(ORIGEN)).convert("RGB")   # sin EXIF ni GPS en la salida
W, H = foto.size
alto = round(H * RETRATO["alto"])
ancho = round(alto * 4 / 5)
x0 = round(W * RETRATO["centro_x"] - ancho / 2)
y0 = round(H * RETRATO["arriba"])
x0 = max(0, min(W - ancho, x0))
y0 = max(0, min(H - alto, y0))
retrato = foto.crop((x0, y0, x0 + ancho, y0 + alto)).resize((768, 960), Image.LANCZOS)

DESTINO.mkdir(parents=True, exist_ok=True)
for ancho_px in (384, 768):
    salida = DESTINO / f"foto-{ancho_px}.webp"
    retrato.resize((ancho_px, ancho_px * 5 // 4), Image.LANCZOS).save(salida, "WEBP", quality=86, method=6)
    print(f"{salida.relative_to(WEB)}  {salida.stat().st_size / 1024:.0f} KB")

lado = int(768 * CARA["lado"])
cx0 = int(768 * CARA["centro_x"] - lado / 2)
cy0 = int(960 * CARA["arriba"])
cara = retrato.crop((cx0, cy0, cx0 + lado, cy0 + lado))
for ancho_px in (160, 320):
    salida = DESTINO / f"foto-cara-{ancho_px}.webp"
    cara.resize((ancho_px, ancho_px), Image.LANCZOS).save(salida, "WEBP", quality=86, method=6)
    print(f"{salida.relative_to(WEB)}  {salida.stat().st_size / 1024:.0f} KB")

if "--muestra" in sys.argv:
    # Hoja de control: la foto con los recortes marcados, el retrato y la cara.
    hoja = Image.new("RGB", (W + 40 + 384 + 40 + 320, max(H, 480)), "white")
    marcada = foto.copy()
    d = ImageDraw.Draw(marcada)
    d.rectangle((x0, y0, x0 + ancho, y0 + alto), outline=(47, 224, 138), width=4)
    esc = ancho / 768
    d.rectangle((x0 + cx0 * esc, y0 + cy0 * esc, x0 + (cx0 + lado) * esc, y0 + (cy0 + lado) * esc), outline=(142, 197, 255), width=4)
    hoja.paste(marcada, (0, 0))
    hoja.paste(retrato.resize((384, 480)), (W + 40, 0))
    hoja.paste(cara.resize((320, 320)), (W + 40 + 384 + 40, 0))
    hoja.save("/tmp/foto-control.png")
    print("Hoja de control: /tmp/foto-control.png")
print("Listo. Recarga la página.")
