/* Gráficos de línea en SVG, sin librerías: livianos para el celular.
   Colores y tipografías salen de las variables CSS, así el modo oscuro no necesita redibujar. */
(function () {
  'use strict';

  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  function idx(f) { return (+f.slice(0, 4)) * 12 + (+f.slice(5, 7)) - 1; }
  function num(v, d) { return v.toFixed(d).replace('.', ','); }
  function rotMes(i) { return MESES[i % 12] + ' ' + Math.floor(i / 12); }
  // En la GEIH la fecha es el último mes del trimestre móvil.
  function rotTrim(i) { return MESES[(i + 10) % 12] + '–' + MESES[i % 12] + ' ' + Math.floor(i / 12); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  function escalaY(min, max, n) {
    var bruto = (max - min) / n, mag = Math.pow(10, Math.floor(Math.log10(bruto))), r = bruto / mag;
    var paso = (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag;
    var lo = Math.floor(min / paso) * paso, hi = Math.ceil(max / paso) * paso, t = [];
    for (var v = lo; v <= hi + paso / 2; v += paso) t.push(+v.toFixed(6));
    return { lo: lo, hi: hi, marcas: t, dec: paso < 1 ? 1 : 0 };
  }

  function marcasX(x0, x1, movil) {
    var meses = x1 - x0, t = [], i;
    if (meses > 30) {
      var anios = meses / 12, paso = Math.max(1, Math.ceil(anios / (movil ? 5 : 10)));
      if (paso > 2 && paso < 5) paso = 5;
      for (i = Math.ceil(x0 / 12) * 12; i <= x1; i += 12) {
        if (Math.floor(i / 12) % paso === 0) t.push({ i: i, t: String(Math.floor(i / 12)) });
      }
    } else {
      for (i = Math.ceil(x0 / 6) * 6; i <= x1; i += 6) {
        t.push({ i: i, t: i % 12 === 0 ? String(Math.floor(i / 12)) : MESES[i % 12] });
      }
    }
    return t;
  }

  function dibujar(el, cfg, animar) {
    var W = el.clientWidth;
    if (!W) return false;
    var movil = W < 520;
    var H = movil ? (cfg.altoMovil || 240) : (cfg.alto || 340);
    var dec = cfg.dec == null ? 1 : cfg.dec, unidad = cfg.unidad || '';
    var rot = cfg.rotulo === 'trim' ? rotTrim : rotMes;
    var marcas = cfg.marcas || [];
    var hayArriba = marcas.some(function (m) { return m.pos === 'arriba'; });
    var hayDer = marcas.some(function (m) { return m.pos === 'derecha'; });
    var mg = { t: hayArriba ? 46 : 24, r: hayDer ? (movil ? 54 : 96) : 14, b: 28, l: 34 };

    // Dominios
    var xs = [], ys = [];
    cfg.series.forEach(function (s) {
      s._i = s.f.map(idx);
      xs.push(s._i[0], s._i[s._i.length - 1]);
      ys = ys.concat(s.v);
    });
    if (cfg.banda) { ys = ys.concat(cfg.banda.li, cfg.banda.ls); cfg.banda._i = cfg.banda.f.map(idx); }
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
    var ey = escalaY(Math.min.apply(null, ys), Math.max.apply(null, ys), movil ? 4 : 5);
    var pw = W - mg.l - mg.r, ph = H - mg.t - mg.b;
    function X(i) { return mg.l + (i - x0) / (x1 - x0) * pw; }
    function Y(v) { return mg.t + (1 - (v - ey.lo) / (ey.hi - ey.lo)) * ph; }
    function f1(n) { return n.toFixed(1); }

    var o = [];
    o.push('<svg class="tg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true">');

    // Rejilla y eje vertical
    ey.marcas.forEach(function (v, k) {
      var y = f1(Y(v)), ultimo = k === ey.marcas.length - 1;
      o.push('<line class="' + (k === 0 ? 'base' : 'rejilla') + '" x1="' + mg.l + '" x2="' + (W - mg.r) + '" y1="' + y + '" y2="' + y + '"/>');
      o.push('<text x="' + (mg.l - 7) + '" y="' + (+y + 4) + '" text-anchor="end">' + num(v, ey.dec) + (ultimo && unidad ? '' : '') + '</text>');
    });
    if (unidad) o.push('<text x="0" y="' + (mg.t - 12) + '">' + esc(unidad) + '</text>');

    // Eje horizontal
    marcasX(x0, x1, movil).forEach(function (m) {
      var x = f1(X(m.i));
      o.push('<line class="base" x1="' + x + '" x2="' + x + '" y1="' + (H - mg.b) + '" y2="' + (H - mg.b + 4) + '"/>');
      o.push('<text x="' + x + '" y="' + (H - 8) + '" text-anchor="middle">' + m.t + '</text>');
    });

    // Banda del margen de error
    if (cfg.banda) {
      var b = cfg.banda, arriba = [], abajo = [];
      b._i.forEach(function (i, k) { arriba.push(f1(X(i)) + ',' + f1(Y(b.ls[k]))); abajo.unshift(f1(X(i)) + ',' + f1(Y(b.li[k]))); });
      o.push('<polygon class="banda" points="' + arriba.concat(abajo).join(' ') + '"/>');
    }

    // Divisor «hasta aquí hay datos»
    if (cfg.divisor) {
      var xd = f1(X(idx(cfg.divisor.f)));
      o.push('<line class="divisor" x1="' + xd + '" x2="' + xd + '" y1="' + (mg.t - 6) + '" y2="' + (H - mg.b) + '"/>');
      o.push('<text x="' + (+xd + 6) + '" y="' + (mg.t - 10) + '">' + esc(cfg.divisor.texto) + ' →</text>');
    }

    // Series
    cfg.series.forEach(function (s) {
      var d = s._i.map(function (i, k) { return (k ? 'L' : 'M') + f1(X(i)) + ' ' + f1(Y(s.v[k])); }).join('');
      var cls = 'l l-' + s.color + (s.clase ? ' ' + s.clase : ''), extra = '';
      if (animar && s.dibuja) { cls += ' dibuja'; extra = ' pathLength="1" style="--dur:' + s.dibuja.dur + 's;--ret:' + s.dibuja.ret + 's"'; }
      o.push('<path class="' + cls + '" d="' + d + '"' + extra + '/>');
      if (s.puntos) {
        s._i.forEach(function (i, k) {
          o.push('<circle class="pt pt-' + s.color + '" r="4" cx="' + f1(X(i)) + '" cy="' + f1(Y(s.v[k])) + '"/>');
        });
      }
    });

    // Marcas: solo los puntos que importan
    marcas.forEach(function (m) {
      var s = cfg.series[m.serie], k = m.k < 0 ? s.v.length + m.k : m.k;
      var px = X(s._i[k]), py = Y(s.v[k]);
      var estilo = animar && m.ret != null ? ' class="aparece" style="--ret:' + m.ret + 's"' : '';
      o.push('<g' + estilo + '>');
      if (m.pos === 'arriba') {
        var tx = Math.max(mg.l + 60, Math.min(W - mg.r - 60, px));
        // Si hay línea de «Pronóstico», la etiqueta no la cruza: se corre a su izquierda.
        if (cfg.divisor && px < X(idx(cfg.divisor.f))) {
          var media = Math.max(String(m.valor).length * 4.8, String(m.sub || '').length * 3.4) + 4;
          tx = Math.max(mg.l + media, Math.min(tx, X(idx(cfg.divisor.f)) - 6 - media));
        }
        o.push('<line class="guia" x1="' + f1(px) + '" x2="' + f1(px) + '" y1="' + f1(py - 7) + '" y2="' + f1(py - 12) + '"/>');
        o.push('<text class="m-valor" text-anchor="middle" x="' + f1(tx) + '" y="' + f1(py - 31) + '">' + esc(m.valor) + '</text>');
        if (m.sub) o.push('<text class="m-sub" text-anchor="middle" x="' + f1(tx) + '" y="' + f1(py - 17) + '">' + esc(m.sub) + '</text>');
      } else {
        o.push('<text class="m-valor" x="' + f1(px + 9) + '" y="' + f1(py + (m.sub && !movil ? -1 : 4.5)) + '">' + esc(m.valor) + '</text>');
        if (m.sub && !movil) o.push('<text class="m-sub" x="' + f1(px + 9) + '" y="' + f1(py + 13) + '">' + esc(m.sub) + '</text>');
      }
      o.push('<circle class="pt pt-' + s.color + '" r="5" cx="' + f1(px) + '" cy="' + f1(py) + '"/>');
      o.push('</g>');
    });

    // Capa del cursor
    o.push('<g class="cursor" visibility="hidden"><line class="cruz" y1="' + mg.t + '" y2="' + (H - mg.b) + '"/>');
    cfg.series.forEach(function (s) { o.push('<circle class="pt pt-' + s.color + '" r="5"/>'); });
    o.push('</g></svg><div class="tg-tip" hidden></div>');
    el.innerHTML = o.join('');

    // ── Cursor y recuadro de valores ──
    var svg = el.firstChild, cursor = svg.querySelector('.cursor'), cruz = cursor.firstChild;
    var puntos = cursor.querySelectorAll('circle'), tip = el.lastChild;
    var mapas = cfg.series.map(function (s) {
      var m = {};
      s._i.forEach(function (i, k) { if (k >= (s.omitir || 0)) m[i] = s.v[k]; });
      return m;
    });
    var mapaBanda = {};
    if (cfg.banda) cfg.banda._i.forEach(function (i, k) { if (k > 0) mapaBanda[i] = [cfg.banda.li[k], cfg.banda.ls[k]]; });
    var actual = null;

    function mostrar(i) {
      i = Math.max(x0, Math.min(x1, i));
      actual = i;
      var px = X(i), filas = '<b>' + rot(i) + '</b>', hay = false;
      cruz.setAttribute('x1', px); cruz.setAttribute('x2', px);
      cfg.series.forEach(function (s, k) {
        var v = mapas[k][i];
        if (v == null) { puntos[k].setAttribute('visibility', 'hidden'); return; }
        hay = true;
        puntos[k].setAttribute('visibility', 'inherit');
        puntos[k].setAttribute('cx', px); puntos[k].setAttribute('cy', Y(v));
        filas += '<span><i class="i-' + s.color + '"></i>' + esc(s.nombre) + '<em>' + num(v, dec) + (unidad ? ' ' + unidad : '') + '</em></span>';
      });
      if (mapaBanda[i]) filas += '<span>Margen de error<em>' + num(mapaBanda[i][0], dec) + ' a ' + num(mapaBanda[i][1], dec) + '</em></span>';
      if (!hay) return ocultar();
      cursor.setAttribute('visibility', 'visible');
      tip.innerHTML = filas; tip.hidden = false;
      var tw = tip.offsetWidth, izq = px + 14;
      if (izq + tw > W - 4) izq = px - 14 - tw;
      tip.style.left = Math.max(4, izq) + 'px';
    }
    function ocultar() { cursor.setAttribute('visibility', 'hidden'); tip.hidden = true; actual = null; }
    function desdeEvento(e) {
      var r = svg.getBoundingClientRect();
      mostrar(Math.round(x0 + (e.clientX - r.left - mg.l) / pw * (x1 - x0)));
    }
    svg.addEventListener('pointermove', desdeEvento);
    svg.addEventListener('pointerdown', desdeEvento);
    svg.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') ocultar(); });
    el.onkeydown = function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      mostrar((actual == null ? x1 : actual) + (e.key === 'ArrowLeft' ? -1 : 1));
    };
    el.onfocus = function () { if (el.matches(':focus-visible')) mostrar(x1); };
    el.onblur = ocultar;
    return true;
  }

  /* Dibuja y vuelve a dibujar si cambia el ancho (giro del celular, cambio de pestaña). */
  function linea(el, cfg) {
    if (el._obs) el._obs.disconnect();
    var ancho = 0, animado = false;
    el.tabIndex = 0;
    el.setAttribute('role', 'group');
    if (cfg.descripcion) el.setAttribute('aria-label', cfg.descripcion + ' Use las flechas izquierda y derecha para recorrer los valores.');
    function pintar() {
      var w = el.clientWidth;
      if (!w || w === ancho) return;
      ancho = w;
      var animar = !!cfg.animar && !animado;
      if (dibujar(el, cfg, animar)) animado = true;
    }
    if ('ResizeObserver' in window) { el._obs = new ResizeObserver(pintar); el._obs.observe(el); }
    else window.addEventListener('resize', pintar);
    pintar();
  }

  /* Línea diminuta para la cinta de indicadores. */
  function mini(v) {
    var lo = Math.min.apply(null, v), hi = Math.max.apply(null, v), n = v.length - 1, r = hi - lo || 1;
    var p = v.map(function (x, k) { return (k / n * 50 + 1).toFixed(1) + ',' + (16 - (x - lo) / r * 14).toFixed(1); }).join(' ');
    return '<svg class="mini" viewBox="0 0 52 18" aria-hidden="true"><polyline points="' + p + '"/></svg>';
  }

  /* Separador: la tendencia del desempleo de Medellín, de lado a lado. */
  function trazo(el, t) {
    var lo = Math.min.apply(null, t), hi = Math.max.apply(null, t), n = t.length - 1;
    var d = t.map(function (x, k) { return (k ? 'L' : 'M') + (k / n * 1000).toFixed(1) + ' ' + (92 - (x - lo) / (hi - lo) * 84).toFixed(1); }).join('');
    el.innerHTML = '<svg viewBox="0 0 1000 100" preserveAspectRatio="none"><path class="t-ten" d="' + d + '"/></svg>';
  }

  window.TupazGraficos = { linea: linea, mini: mini, trazo: trazo, num: num, rotMes: rotMes, rotTrim: rotTrim, idx: idx };
})();
