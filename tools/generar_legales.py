#!/usr/bin/env python3
"""Genera aviso-legal.html y politica-de-datos.html con el mismo logo, ruta y pie de index.html.

Si cambias el pie o el logo de index.html, corre esto para que las páginas legales queden iguales.
Los textos legales viven aquí (AVISO y POLITICA); son un borrador, no reemplazan asesoría jurídica.

Uso:  python3 tools/generar_legales.py
"""
import re
from pathlib import Path

WEB = Path(__file__).resolve().parent.parent
indice = (WEB / "index.html").read_text(encoding="utf-8")

# Logo y pie, copiados de index.html; los enlaces internos vuelven a index.html
logo = re.search(r'<svg class="logo__svg".*?</svg>', indice, re.S).group(0)
pie = indice[indice.index('<footer class="pie">'):indice.index("</footer>") + len("</footer>")]
pie = re.sub(r'href="#([a-z0-9-]+)"', r'href="index.html#\1"', pie)
pie = re.sub(r'\s*<p class="pie__fuentes" data-solo-con-datos>.*?</p>', "", pie, flags=re.S)

AVISO = """      <p class="pildora">Aviso legal</p>
      <h1>Aviso legal y términos de uso</h1>
      <p class="legal__responsable"><b>Responsable del sitio:</b> Santiago Tupaz Ramírez, persona natural, Envigado, Antioquia, Colombia. Correo: <a data-correo href="mailto:tupaz.analytics@gmail.com">tupaz.analytics@gmail.com</a>.</p>
      <ol>
        <li><b>Precios orientativos.</b> Los valores publicados son rangos de referencia y no constituyen una oferta vinculante. El precio, el alcance y los plazos de cada servicio se definen en una cotización formal escrita.</li>
        <li><b>Información y análisis.</b> Los análisis, tableros y proyecciones de este sitio tienen fines informativos y de demostración. No constituyen asesoría financiera, de inversión, legal ni tributaria. Las proyecciones son estimaciones con márgenes de error y pueden no cumplirse.</li>
        <li><b>Fuentes de datos.</b> Los datos públicos provienen de sus fuentes oficiales (DANE, Banco de la República y otras), citadas en cada gráfico. Los cálculos derivados son propios.</li>
        <li><b>Propiedad intelectual.</b> Los textos, diseños, gráficos y código de este sitio pertenecen a Santiago Tupaz Ramírez, salvo los datos públicos y las marcas de terceros. Las universidades y organizaciones se mencionan solo como referencia académica y no patrocinan este sitio.</li>
        <li><b>Enlaces externos.</b> Este sitio no se hace responsable del contenido de los sitios enlazados.</li>
      </ol>
      <p class="nota">Vea también la <a href="politica-de-datos.html">Política de tratamiento de datos personales</a>.</p>"""

# La frase sobre la herramienta de analítica sin cookies se quitó: el sitio no tiene ninguna instalada.
# Si se instala una, se vuelve a agregar al punto 1.
POLITICA = """      <p class="pildora">Ley 1581 de 2012 y Decreto 1377 de 2013</p>
      <h1>Política de tratamiento de datos personales</h1>
      <p class="legal__responsable"><b>Responsable:</b> Santiago Tupaz Ramírez · Envigado, Antioquia · <a data-correo href="mailto:tupaz.analytics@gmail.com">tupaz.analytics@gmail.com</a>.</p>
      <ol>
        <li><b>Qué datos recojo:</b> los que usted me entrega voluntariamente al escribirme por WhatsApp, correo o LinkedIn (nombre, empresa o entidad, cargo, teléfono, correo y la información de su consulta).</li>
        <li><b>Para qué:</b> responder su consulta, preparar cotizaciones y propuestas, prestar los servicios contratados, enviar información relacionada con ellos y mejorar este sitio. No vendo ni cedo sus datos a terceros.</li>
        <li><b>Sus derechos:</b> conocer, actualizar, rectificar y suprimir sus datos, solicitar prueba de la autorización y revocarla, y presentar quejas ante la Superintendencia de Industria y Comercio.</li>
        <li><b>Cómo ejercerlos:</b> escriba a <a data-correo href="mailto:tupaz.analytics@gmail.com">tupaz.analytics@gmail.com</a>. Las consultas se responden en máximo 10 días hábiles y los reclamos en máximo 15 días hábiles.</li>
        <li><b>Datos de clientes en proyectos:</b> la información que un cliente comparte para un proyecto se trata con confidencialidad y solo para ese proyecto, según lo pactado en el contrato.</li>
        <li><b>Vigencia:</b> esta política rige desde el 13 de noviembre de 2026. Los cambios se publicarán en esta página.</li>
      </ol>
      <p class="nota">Vea también el <a href="aviso-legal.html">Aviso legal y términos de uso</a>.</p>"""


def pagina(titulo: str, descripcion: str, ruta: str, cuerpo: str) -> str:
    return f"""<!doctype html>
<html lang="es-CO">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<!-- Sitio en prueba: no aparece en buscadores. Quitar esta línea al lanzar. -->
<meta name="robots" content="noindex">
<title>{titulo} · Tupaz Analytics · Economía y Datos</title>
<meta name="description" content="{descripcion}">
<meta name="theme-color" content="#071A4A">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<script>
  (function () {{
    var t = null;
    try {{ t = localStorage.getItem('tema'); }} catch (e) {{}}
    if (t === 'claro') document.documentElement.setAttribute('data-tema', 'claro');
  }})();
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/estilos.css">
</head>
<body>
<a class="saltar" href="#contenido">Saltar al contenido</a>

<header class="cab">
  <div class="ancho cab__fila">
    <a class="logo" href="index.html" aria-label="Tupaz Analytics, Economía y Datos: ir al inicio">{logo}</a>
    <a class="firma firma--chica cab__accion" href="index.html#hablemos"><span class="firma__t">Hablemos</span><span class="firma__f" aria-hidden="true"></span></a>
  </div>
</header>

<nav class="ruta" aria-label="Usted está aquí">
  <div class="ancho ruta__fila">
    <ol class="ruta__lista">
      <li><a href="index.html">Inicio</a></li>
      <li aria-current="page">{ruta}</li>
    </ol>
  </div>
</nav>

<main id="contenido">
  <div class="ancho">
    <article class="legal">
{cuerpo}
      <p><a class="flecha" href="index.html"><span aria-hidden="true">←</span> Volver al inicio</a></p>
    </article>
  </div>
</main>

{pie}

<div class="fijo" id="fijo">
  <a class="firma" data-wa href="index.html#hablemos"><span class="firma__t">Escríbame por WhatsApp</span><span class="firma__f" aria-hidden="true"></span></a>
</div>

<script src="assets/js/contacto.js"></script>
<script>
  // El correo del texto legal sale de contacto.js, igual que en el resto del sitio.
  (function () {{
    var c = (window.TUPAZ_CONTACTO || {{}}).correo;
    if (!c) return;
    Array.prototype.forEach.call(document.querySelectorAll('[data-correo]'), function (a) {{ a.textContent = c; a.href = 'mailto:' + c; }});
  }})();
</script>
<script src="assets/js/app.js"></script>
</body>
</html>
"""


(WEB / "aviso-legal.html").write_text(pagina("Aviso legal", "Aviso legal y términos de uso del sitio de Tupaz Analytics · Economía y Datos.", "Aviso legal", AVISO), encoding="utf-8")
(WEB / "politica-de-datos.html").write_text(pagina("Política de datos", "Política de tratamiento de datos personales de Tupaz Analytics · Economía y Datos (Ley 1581 de 2012).", "Política de datos", POLITICA), encoding="utf-8")
print("Listo: aviso-legal.html y politica-de-datos.html")
