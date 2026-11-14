/* Tupaz Analytics: menú, ruta, páginas con dirección propia, títulos que se escriben solos,
   indicadores de Antioquia, gráficos, recorrido del tablero y contacto. */
(function () {
  'use strict';

  var D = window.TUPAZ_DATOS || null;
  var C = window.TUPAZ_CONTACTO || {};
  var G = window.TupazGraficos;
  var raiz = document.documentElement;
  var QUIETO = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PUNTERO = window.matchMedia('(hover: hover) and (pointer: fine)');

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  var NOMBRES = { 'inicio': 'Inicio', 'mi-trabajo': 'Mi trabajo', 'tablero': 'Tablero en vivo', 'servicios': 'Servicios y precios', 'sobre-mi': 'Sobre mí', 'hablemos': 'Hablemos' };
  function firma(texto, attrs, clase) {
    return '<a class="firma' + (clase ? ' ' + clase : '') + '" ' + attrs + '><span class="firma__t">' + texto +
      '</span><span class="firma__f" aria-hidden="true"></span></a>';
  }

  /* ───────── Modo claro (el sitio es oscuro; el botón está en el pie) ───────── */
  (function () {
    var boton = $('#tema');
    function claro() { return raiz.getAttribute('data-tema') === 'claro'; }
    function rotular() {
      if (boton) {
        boton.textContent = claro() ? 'Modo oscuro' : 'Modo claro';
        boton.setAttribute('aria-pressed', String(claro()));
      }
      var m = $('meta[name="theme-color"]');
      if (m) m.setAttribute('content', claro() ? '#FFFFFF' : '#071A4A');
    }
    if (boton) boton.addEventListener('click', function () {
      if (claro()) raiz.removeAttribute('data-tema'); else raiz.setAttribute('data-tema', 'claro');
      try { localStorage.setItem('tema', claro() ? 'claro' : 'oscuro'); } catch (e) {}
      rotular();
    });
    rotular();
  })();

  /* ───────── Contacto: un solo lugar para editar (contacto.js) ───────── */
  var urlWa = null;
  (function () {
    // Muestra «ramírez» en vez de «ram%C3%ADrez»; el enlace conserva la dirección original.
    function legible(u) { try { return decodeURI(u); } catch (e) { return u; } }
    function poner(campo, html) {
      $$('[data-contacto="' + campo + '"]').forEach(function (el) { el.classList.remove('pendiente'); el.innerHTML = html; });
    }
    var wa = String(C.whatsapp || '').replace(/\D/g, '');
    if (wa) {
      urlWa = 'https://wa.me/' + wa + (C.mensaje ? '?text=' + encodeURIComponent(C.mensaje) : '');
      $$('[data-wa]').forEach(function (a) { a.href = urlWa; a.target = '_blank'; a.rel = 'noopener'; });
      var visible = '+' + wa.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3 $4');
      poner('whatsapp', '<a href="' + urlWa + '" target="_blank" rel="noopener">' + esc(visible) + '</a>');
    }
    if (C.correo) poner('correo', '<a href="mailto:' + esc(C.correo) + '">' + esc(C.correo) + '</a>');
    if (C.linkedin) {
      poner('linkedin', '<a href="' + esc(C.linkedin) + '" target="_blank" rel="noopener">' +
        esc(legible(C.linkedin).replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')) + '</a>');
      $$('[data-red="linkedin"]').forEach(function (a) { a.href = C.linkedin; });
    }
    if (C.github) {
      poner('github', '<a href="' + esc(C.github) + '" target="_blank" rel="noopener">' + esc(C.github.replace(/^https?:\/\/(www\.)?/, '')) + '</a>');
      $$('[data-fila-contacto="github"]').forEach(function (el) { el.hidden = false; });
      $$('[data-red="github"]').forEach(function (a) { a.href = C.github; });
    }
  })();

  /* ───────── Menú: desplegables grandes en escritorio, hamburguesa en el celular ───────── */
  var menu = (function () {
    var cab = $('#cab'), botones = $$('.menu__item--mas'), hamb = $('#hamb'), movil = $('#movil');
    var abiertoEn = 0;
    function panel(b) { return document.getElementById(b.getAttribute('aria-controls')); }
    function abrir(b) {
      botones.forEach(function (o) { if (o !== b) cerrarUno(o); });
      if (b.getAttribute('aria-expanded') === 'true') return;
      b.setAttribute('aria-expanded', 'true');
      panel(b).hidden = false;
      abiertoEn = Date.now();
    }
    function cerrarUno(b) { b.setAttribute('aria-expanded', 'false'); panel(b).hidden = true; }
    function cerrarMegas() { botones.forEach(cerrarUno); }
    function movilAbierto(si) {
      if (!hamb || !movil) return;
      hamb.setAttribute('aria-expanded', String(si));
      hamb.setAttribute('aria-label', si ? 'Cerrar el menú' : 'Abrir el menú');
      movil.hidden = !si;
      document.body.style.overflow = si ? 'hidden' : '';
    }
    botones.forEach(function (b) {
      b.addEventListener('click', function () {
        var abierto = b.getAttribute('aria-expanded') === 'true';
        if (abierto && Date.now() - abiertoEn > 400) cerrarUno(b); else abrir(b);
      });
      b.addEventListener('mouseenter', function () { if (PUNTERO.matches) abrir(b); });
    });
    $$('.menu__item:not(.menu__item--mas)').forEach(function (a) {
      a.addEventListener('mouseenter', function () { if (PUNTERO.matches) cerrarMegas(); });
    });
    if (cab) cab.addEventListener('mouseleave', function () { if (PUNTERO.matches) cerrarMegas(); });
    document.addEventListener('click', function (e) { if (!e.target.closest('.cab')) cerrarMegas(); });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var b = botones.filter(function (o) { return o.getAttribute('aria-expanded') === 'true'; })[0];
      cerrarMegas();
      if (b) b.focus();
      if (hamb && hamb.getAttribute('aria-expanded') === 'true') { movilAbierto(false); hamb.focus(); }
    });
    if (hamb) hamb.addEventListener('click', function () { movilAbierto(hamb.getAttribute('aria-expanded') !== 'true'); });
    return { cerrar: function () { cerrarMegas(); movilAbierto(false); } };
  })();

  /* ───────── Ruta: «Inicio › Mi trabajo › Caso NAIRU» ───────── */
  var ruta = (function () {
    var lista = $('#ruta-lista'), nav = $('#ruta');
    var api = { paso: null, pintar: function () {} };
    if (!lista || !nav) return api;
    var ultimo = '', pendiente = false;
    api.pintar = function () {
      var hoja = $('.hoja.activa');
      if (!hoja) return;
      var id = hoja.id, sub = null;
      if (id === 'tablero') sub = api.paso;
      else {
        var limite = nav.getBoundingClientRect().bottom + 160;
        $$('[data-ruta]', hoja).forEach(function (el) { if (el.getBoundingClientRect().top < limite) sub = el.getAttribute('data-ruta'); });
      }
      var clave = id + '|' + sub;
      if (clave === ultimo) return;
      ultimo = clave;
      var partes = [];
      if (id === 'inicio') partes.push(sub ? '<li><a href="#inicio">Inicio</a></li>' : '<li aria-current="page">Inicio</li>');
      else {
        partes.push('<li><a href="#inicio">Inicio</a></li>');
        partes.push(sub ? '<li><a href="#' + id + '">' + esc(NOMBRES[id] || '') + '</a></li>' : '<li aria-current="page">' + esc(NOMBRES[id] || '') + '</li>');
      }
      if (sub) partes.push('<li aria-current="location">' + esc(sub) + '</li>');
      lista.innerHTML = partes.join('');
    };
    function alMover() {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(function () { pendiente = false; api.pintar(); });
    }
    window.addEventListener('scroll', alMover, { passive: true });
    window.addEventListener('resize', alMover);
    // Tocar la página en la que ya se está lleva a su comienzo.
    lista.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (a && a.getAttribute('href') === (location.hash || '#inicio')) { e.preventDefault(); window.scrollTo({ top: 0, behavior: QUIETO ? 'auto' : 'smooth' }); }
    });
    return api;
  })();

  /* ───────── Botón fijo de WhatsApp: en escritorio se retira mientras haya otro a la vista ───────── */
  (function () {
    var fijo = $('#fijo');
    if (!fijo || !('IntersectionObserver' in window)) return;
    var escritorio = window.matchMedia('(min-width: 1101px)');
    var aLaVista = [], tapa = false, pendiente = false;
    function decidir() { fijo.classList.toggle('fijo--cede', escritorio.matches && (aLaVista.length > 0 || tapa)); }
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        var k = aLaVista.indexOf(e.target);
        if (e.isIntersecting && k < 0) aLaVista.push(e.target);
        if (!e.isIntersecting && k >= 0) aLaVista.splice(k, 1);
      });
      decidir();
    }, { threshold: 0.5 });
    $$('main [data-wa]').forEach(function (a) { obs.observe(a); });
    // Tampoco se queda encima de otro botón o enlace (por ejemplo, «Siguiente» del recorrido).
    function revisar() {
      pendiente = false;
      if (!escritorio.matches) { tapa = false; return decidir(); }
      var r = fijo.getBoundingClientRect(), y = r.top + r.height / 2;
      tapa = [r.left + 4, r.left + r.width / 2, r.right - 4].some(function (x) {
        return document.elementsFromPoint(x, y).some(function (el) {
          return !fijo.contains(el) && el.closest('main a, main button, .pie a, .pie button');
        });
      });
      decidir();
    }
    function programar() { if (!pendiente) { pendiente = true; requestAnimationFrame(revisar); } }
    window.addEventListener('scroll', programar, { passive: true });
    window.addEventListener('resize', programar);
    document.addEventListener('click', function () { setTimeout(programar, 60); });
    programar();
  })();

  /* ───────── Sellos: credenciales que rotan despacio y se pueden pausar ───────── */
  (function () {
    var caja = $('#sellos'), riel = $('#sellos-riel'), pausa = $('#sellos-pausa');
    if (!caja || !riel || !pausa || QUIETO) return;   // con «reducir movimiento» quedan como lista fija
    $$('li', riel).forEach(function (li) {
      var copia = li.cloneNode(true);
      copia.setAttribute('aria-hidden', 'true');
      riel.appendChild(copia);
    });
    caja.classList.add('rota');
    pausa.hidden = false;
    pausa.addEventListener('click', function () {
      var p = caja.classList.toggle('pausada');
      pausa.textContent = p ? 'Seguir' : 'Pausar';
      pausa.setAttribute('aria-pressed', String(p));
    });
  })();

  /* ───────── Cifras sueltas que salen de los datos ───────── */
  if (D) {
    var sueltos = {
      'corte': D.corte,
      'portada-rango': D.portada.desde + '–' + D.portada.hasta,
      'mae': D.prueba.mae_h1,
      'mae-simple': D.prueba.mae_simple_h1,
      'n-pruebas': D.prueba.n,
      'n-series': D.n_series
    };
    $$('[data-dato]').forEach(function (el) {
      var v = sueltos[el.getAttribute('data-dato')];
      if (v != null) el.textContent = v;
    });
  } else {
    $$('[data-solo-con-datos], .portada-grafico').forEach(function (el) { el.hidden = true; });
  }

  /* ───────── Antioquia hoy: seis indicadores reales (antes, la cinta del encabezado) ───────── */
  (function () {
    var caja = $('#hoy'), lista = $('#hoy-lista');
    if (!D || !D.cinta || !D.cinta.length || !caja) return;
    lista.innerHTML = D.cinta.map(function (c) {
      var flecha = c.dir === 'sube' ? '▲' : c.dir === 'baja' ? '▼' : '■';
      return '<li class="hoy__dato" title="' + esc(c.titulo + '. Fuente: ' + c.fuente) + '">' +
        '<span>' + esc(c.nombre) + '</span><b>' + esc(c.valor) + '</b>' + G.mini(c.mini) +
        '<em>' + flecha + ' ' + esc(c.variacion) + '</em><small>' + esc(c.periodo) + '</small></li>';
    }).join('');
    caja.hidden = false;
  })();

  /* ───────── Títulos que se escriben letra por letra, con cursor (una sola vez) ───────── */
  (function () {
    var titulos = $$('[data-escribir]');
    if (!titulos.length || QUIETO || !('IntersectionObserver' in window)) return;
    titulos.forEach(function (el) {
      var letras = [];
      el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
      var envoltura = document.createElement('span');
      envoltura.setAttribute('aria-hidden', 'true');
      while (el.firstChild) envoltura.appendChild(el.firstChild);
      el.appendChild(envoltura);
      (function partir(nodo) {
        Array.prototype.slice.call(nodo.childNodes).forEach(function (n) {
          if (n.nodeType === 1) return partir(n);
          if (n.nodeType !== 3) return;
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (parte) {
            if (!parte) return;
            if (/^\s+$/.test(parte)) { frag.appendChild(document.createTextNode(parte)); return; }
            var palabra = document.createElement('span');
            palabra.className = 'palabra';
            Array.prototype.forEach.call(parte, function (ch) {
              var s = document.createElement('span');
              s.className = 'car';
              s.textContent = ch;
              palabra.appendChild(s);
              letras.push(s);
            });
            frag.appendChild(palabra);
          });
          nodo.replaceChild(frag, n);
        });
      })(envoltura);
      el._letras = letras;
    });
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        obs.unobserve(e.target);
        escribir(e.target);
      });
    }, { threshold: 0.5 });
    titulos.forEach(function (el) { obs.observe(el); });

    function escribir(el) {
      var letras = el._letras, i = 0;
      var cursor = document.createElement('span');
      cursor.className = 'cursor';
      var paso = Math.max(28, Math.min(55, 1700 / letras.length));
      (function siguiente() {
        if (i >= letras.length) { setTimeout(function () { cursor.remove(); }, 2600); return; }
        letras[i].classList.add('ya');
        letras[i].parentNode.insertBefore(cursor, letras[i].nextSibling);
        i++;
        setTimeout(siguiente, paso);
      })();
    }
  })();

  /* ───────── Fondo del hero: la tendencia real del desempleo, muy tenue y quieta ───────── */
  (function () {
    var caja = $('#hero-fondo');
    if (!D || !caja) return;
    var p = D.portada, n = p.v.length - 1;
    var lo = Math.min.apply(null, p.v), hi = Math.max.apply(null, p.v);
    function ruta(v) {
      return v.map(function (x, k) { return (k ? 'L' : 'M') + (k / n * 1000).toFixed(1) + ' ' + (190 - (x - lo) / (hi - lo) * 175).toFixed(1); }).join('');
    }
    caja.innerHTML = '<svg viewBox="0 0 1000 200" preserveAspectRatio="none">' +
      '<path class="hero__dato-linea" d="' + ruta(p.v) + '"/><path class="hero__tendencia" d="' + ruta(p.t) + '"/></svg>';
  })();

  /* ───────── Gráficos de la portada: se dibujan cuando aparecen en pantalla ───────── */
  function alVerse(el, hacer) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) return hacer();
    var obs = new IntersectionObserver(function (entradas) {
      if (entradas.some(function (e) { return e.isIntersecting; })) { obs.disconnect(); hacer(); }
    }, { threshold: 0.25 });
    obs.observe(el);
  }
  (function () {
    var el = $('#grafico-portada');
    if (!D || !el) return;
    var p = D.portada;
    alVerse(el, function () {
      G.linea(el, {
        alto: +el.dataset.alto, altoMovil: +el.dataset.altoMovil, dec: 1, unidad: '%', rotulo: 'trim', animar: true,
        descripcion: 'Tasa de desempleo de Medellín y su área metropolitana de ' + p.desde + ' a ' + p.hasta +
          '. Máximo de ' + p.maximo.valor + ' % en ' + p.maximo.periodo + '; último dato, ' + p.ultimo.valor + ' % en ' + p.ultimo.periodo + '.',
        series: [
          { nombre: 'Dato del trimestre', f: p.f, v: p.v, color: 'azul', clase: 'l-fina', dibuja: { dur: 1.8, ret: 0.1 } },
          { nombre: 'Tendencia', f: p.f, v: p.t, color: 'verde', clase: 'l-gruesa', dibuja: { dur: 1.4, ret: 1.7 } }
        ],
        marcas: [
          { serie: 0, k: p.maximo.i, pos: 'arriba', valor: p.maximo.valor + ' %', sub: 'Pandemia · ' + p.maximo.periodo, ret: 1.4 },
          { serie: 0, k: -1, pos: 'derecha', valor: p.ultimo.valor + ' %', sub: p.ultimo.periodo, ret: 2.9 }
        ]
      });
    });
  })();
  (function () {
    var el = $('#grafico-tarjeta');
    if (!D || !el) return;
    var q = D.tablero.desempleo.pasos[1].pronostico, uf = q.f[q.f.length - 1], uv = q.v[q.v.length - 1];
    var obsF = q.f.slice(-30), obsV = q.v.slice(-30);
    // El pronóstico termina en un trimestre (p. ej. ene–mar 2027): se marca ese mismo trimestre del año anterior,
    // para que se vea que la subida es de temporada y no un salto.
    var ultimoPron = q.pf[q.pf.length - 1];
    var mismoTrim = (+ultimoPron.slice(0, 4) - 1) + ultimoPron.slice(4);
    var kAnt = obsF.indexOf(mismoTrim);
    var marcas = [{ serie: 1, k: -1, pos: 'derecha', valor: D.tablero.desempleo.pasos[1].cifra }];
    if (kAnt >= 0) marcas.unshift({ serie: 0, k: kAnt, pos: 'arriba', valor: G.num(obsV[kAnt], 1) + ' %', sub: G.rotTrim(G.idx(mismoTrim)) });
    // Si con datos nuevos el pronóstico deja de ser enero–marzo o supera al año anterior, la frase se ajusta sola.
    var nota = $('#nota-tarjeta'), pron = q.p[q.p.length - 1];
    if (nota && kAnt >= 0) {
      var menos = pron < obsV[kAnt], anioAnt = mismoTrim.slice(0, 4);
      if (ultimoPron.slice(5, 7) === '03' && menos) {
        nota.textContent = 'Cada enero–marzo el desempleo sube por temporada; frente al mismo trimestre de ' + anioAnt + ', el modelo espera menos.';
      } else {
        nota.textContent = 'Frente al mismo trimestre de ' + anioAnt + ' (' + G.num(obsV[kAnt], 1) + ' %), el modelo espera ' + (menos ? 'menos' : 'más') + '.';
      }
    }
    alVerse(el, function () {
      G.linea(el, {
        alto: +el.dataset.alto, altoMovil: +el.dataset.altoMovil, dec: 1, unidad: '%', rotulo: 'trim',
        descripcion: 'Desempleo de Medellín: lo observado y lo que espera el modelo. El pronóstico para ' + G.rotTrim(G.idx(ultimoPron)) + ' es ' +
          D.tablero.desempleo.pasos[1].cifra + (kAnt >= 0 ? '; el mismo trimestre del año anterior fue ' + G.num(obsV[kAnt], 1) + ' %.' : '.'),
        series: [
          { nombre: 'Lo observado', f: obsF, v: obsV, color: 'azul' },
          { nombre: 'Lo que espera el modelo', f: [uf].concat(q.pf), v: [uv].concat(q.p), color: 'verde', clase: 'l-punteada', omitir: 1 }
        ],
        banda: { f: [uf].concat(q.pf), li: [uv].concat(q.li), ls: [uv].concat(q.ls) },
        divisor: { f: uf, texto: 'Pronóstico' },
        marcas: marcas
      });
    });
  })();

  /* ───────── Recorrido guiado del tablero ───────── */
  (function () {
    var caja = $('#recorrido'), panel = $('#paso');
    if (!D || !caja) return;
    caja.hidden = false;
    var estado = { ind: 'desempleo', paso: 0, h: '1' };
    // Enlace directo a un paso: …/?indicador=inflacion&paso=2#tablero
    try {
      var q = new URLSearchParams(location.search), pq = parseInt(q.get('paso'), 10);
      if (D.tablero[q.get('indicador')]) estado.ind = q.get('indicador');
      if (pq >= 1 && pq <= 4) estado.paso = pq - 1;
    } catch (e) {}
    var TITULOS = ['Qué está pasando', 'Hacia dónde va', 'Qué tan preciso es el pronóstico', 'Y con sus datos'];
    var atras = $('#paso-atras'), sigue = $('#paso-sigue');

    function leyenda(items) {
      return '<ul class="leyenda" aria-hidden="true">' + items.map(function (i) {
        return '<li><i class="muestra muestra--' + i[0] + '"></i>' + esc(i[1]) + '</li>';
      }).join('') + '</ul>';
    }
    function negocio(lista) {
      return '<div class="paso__negocio"><h3>¿Qué significa esto para su negocio?</h3><ul>' +
        lista.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>';
    }
    function tabla(cab, filas) {
      return '<details class="tabla-datos"><summary>Ver estos datos en una tabla</summary><div class="tabla-datos__caja"><table><thead><tr>' +
        cab.map(function (c) { return '<th scope="col">' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        filas.map(function (f) { return '<tr>' + f.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') +
        '</tbody></table></div></details>';
    }
    function aciertos(ac, unidad) {
      if (!ac || !ac.casos || !ac.casos.length) return '';
      var u = unidad ? ' ' + unidad : '';
      var filas = ac.casos.map(function (c) {
        var err = c.error.replace('−', ''), dijoMas = c.error.charAt(0) !== '−';
        return '<tr><th scope="row" data-rotulo="Periodo">' + esc(c.periodo) + '<small>con datos hasta ' + esc(c.con_datos_hasta) + '</small></th>' +
          '<td data-rotulo="Lo que dijo el modelo">' + esc(c.dijo) + u + '</td>' +
          '<td data-rotulo="Margen de error (80 %)">' + esc(c.desde) + ' a ' + esc(c.hasta) + u + '</td>' +
          '<td data-rotulo="Lo que pasó">' + esc(c.paso) + u + '</td>' +
          '<td data-rotulo="Se equivocó por">' + esc(err) + ' puntos (dijo ' + (dijoMas ? 'más' : 'menos') + ')' +
          '<small class="' + (c.dentro ? 'dentro' : 'fuera') + '">' + (c.dentro ? 'Dentro del margen' : 'Fuera del margen') + '</small></td></tr>';
      }).join('');
      return '<section class="aciertos" aria-labelledby="t-aciertos">' +
        '<h3 id="t-aciertos">Así le fue a mi pronóstico. Se lo muestro porque sé cuánto se equivoca.</h3>' +
        '<p class="aciertos__intro">Lo que dijo el modelo con ' + ac.h + ' meses de anticipación, y lo que pasó.</p>' +
        '<div class="aciertos__tabla"><table><thead><tr><th scope="col">Periodo</th><th scope="col">Lo que dijo el modelo</th>' +
        '<th scope="col">Margen de error (80 %)</th><th scope="col">Lo que pasó</th><th scope="col">Se equivocó por</th></tr></thead><tbody>' + filas + '</tbody></table></div>' +
        '<div class="aciertos__cifras">' +
        '<div><p class="cifra">' + esc(ac.mae_h) + '<small>puntos</small></p><p>de error promedio con ' + ac.h + ' meses de anticipación.</p></div>' +
        '<div><p class="cifra">' + esc(ac.cob80) + ' %</p><p>de las veces el dato real cayó dentro del margen del 80 % (se esperaba 80 %), en los pronósticos de 1 a ' + ac.h_pub + ' meses.</p></div>' +
        '</div><p class="nota">Fuente: prueba retrospectiva (backtesting) del tablero, con ' + ac.n + ' pronósticos hechos solo con los datos disponibles en su momento.</p></section>';
    }
    function figura(p, extra, ley, tab) {
      return '<figure class="paso__grafico">' + (extra || '') +
        '<figcaption class="figura__titulo">' + esc(p.titulo) + '</figcaption>' +
        '<div class="lienzo" id="lienzo-paso"></div>' + ley +
        '<p class="figura__fuente">' + esc(p.nota) + '</p>' + tab + '</figure>';
    }

    function pintar(mover) {
      var ind = D.tablero[estado.ind], n = estado.paso;
      var trim = estado.ind === 'desempleo', rot = trim ? G.rotTrim : G.rotMes, dec = ind.decimales;
      function v(x) { return G.num(x, dec); }
      var html, cfg = null;

      if (n === 0) {
        var p0 = ind.pasos[0], a = p0.principal, b = p0.comparacion;
        html = '<p class="paso__frase">' + esc(p0.frase) + '</p>' +
          '<div class="paso__cifra"><p class="cifra">' + esc(p0.cifra) + '</p><p class="paso__rotulo">' + esc(p0.rotulo) + '</p><p class="nota">Fuente: ' + esc(p0.fuente) + '</p></div>' +
          '<p class="paso__detalle">' + esc(p0.detalle) + '</p>' + negocio(p0.negocio) +
          figura(p0, '', leyenda([['azul', a.nombre], ['', b.nombre]]),
            tabla(['Periodo', a.nombre, b.nombre], a.f.map(function (f, k) { return [rot(G.idx(f)), v(a.v[k]), v(b.v[k])]; }).reverse()));
        cfg = {
          dec: dec, unidad: ind.unidad, rotulo: trim ? 'trim' : 'mes', descripcion: p0.titulo + '. ' + p0.frase,
          series: [
            { nombre: b.nombre, f: b.f, v: b.v, color: 'ctx' },
            { nombre: a.nombre, f: a.f, v: a.v, color: 'azul' }
          ],
          marcas: [{ serie: 1, k: -1, pos: 'derecha', valor: p0.cifra }]
        };
      } else if (n === 1) {
        var p1 = ind.pasos[1], q = p1.pronostico, uf = q.f[q.f.length - 1], uv = q.v[q.v.length - 1];
        html = '<p class="paso__frase">' + esc(p1.frase) + '</p>' +
          '<div class="paso__cifra"><p class="cifra">' + esc(p1.cifra) + '</p><p class="paso__rotulo">' + esc(p1.rotulo) + '</p><p class="nota">Fuente: ' + esc(p1.fuente) + '</p></div>' +
          '<p class="paso__detalle">' + esc(p1.detalle) + '</p>' + negocio(p1.negocio) +
          figura(p1, '', leyenda([['azul', 'Lo observado'], ['verde', 'Lo que espera el modelo'], ['banda', 'Margen de error']]),
            tabla(['Periodo', 'Pronóstico', 'Desde', 'Hasta'], q.pf.map(function (f, k) { return [rot(G.idx(f)), v(q.p[k]), v(q.li[k]), v(q.ls[k])]; })));
        cfg = {
          dec: dec, unidad: ind.unidad, rotulo: trim ? 'trim' : 'mes', descripcion: p1.titulo + '. ' + p1.frase,
          series: [
            { nombre: 'Lo observado', f: q.f, v: q.v, color: 'azul' },
            { nombre: 'Lo que espera el modelo', f: [uf].concat(q.pf), v: [uv].concat(q.p), color: 'verde', clase: 'l-punteada', omitir: 1 }
          ],
          banda: { f: [uf].concat(q.pf), li: [uv].concat(q.li), ls: [uv].concat(q.ls) },
          divisor: { f: uf, texto: 'Pronóstico' },
          marcas: [{ serie: 1, k: -1, pos: 'derecha', valor: p1.cifra }]
        };
      } else if (n === 2) {
        var p2 = ind.pasos[2], hs = Object.keys(p2.precision.horizontes);
        if (hs.indexOf(estado.h) < 0) estado.h = hs[0];
        var z = p2.precision.horizontes[estado.h], plazo = estado.h === '1' ? '1 mes' : estado.h + ' meses';
        var botones = '<div class="selector selector--chico paso__controles" role="group" aria-label="Anticipación del pronóstico">' +
          '<span class="selector__rotulo">Con cuánta anticipación</span>' +
          hs.map(function (h) {
            return '<button class="selector__boton" type="button" data-h="' + h + '" aria-pressed="' + (h === estado.h) + '">' + (h === '1' ? '1 mes' : h + ' meses') + '</button>';
          }).join('') + '</div>';
        html = '<p class="paso__frase">Puesto a prueba con meses que ya pasaron, el pronóstico a ' + (estado.h === '1' ? 'un mes' : plazo) +
          ' se equivocó en promedio ' + z.mae + ' puntos.</p>' +
          '<div class="comparacion">' +
          '<div><p class="cifra">' + z.mae + '</p><p class="paso__rotulo">puntos se equivocó el modelo, a ' + plazo + '</p></div>' +
          '<div><p class="cifra">' + z.mae_simple + '</p><p class="paso__rotulo">puntos se equivoca la regla simple ' + esc(p2.regla) + '</p></div>' +
          '</div>' +
          '<p class="paso__detalle">' + (z.gana ? '' : '<b>A ' + plazo + ', con la medida más exigente (la que castiga los errores grandes), el modelo no supera a la regla simple.</b> ') + esc(p2.detalle) + '</p>' +
          negocio(p2.negocio) + aciertos(p2.aciertos, ind.unidad) +
          figura(p2, botones, leyenda([['azul', 'Lo que pasó'], ['verde muestra--punto', 'Lo que dijo el modelo']]),
            tabla(['Periodo', 'Pasó', 'Dijo el modelo', 'Diferencia'], z.f.map(function (f, k) {
              return [rot(G.idx(f)), v(z.o[k]), v(z.p[k]), G.num(z.p[k] - z.o[k], 2).replace('-', '−')];
            }).reverse()));
        cfg = {
          dec: dec, unidad: ind.unidad, rotulo: trim ? 'trim' : 'mes',
          descripcion: p2.titulo + '. Error promedio del modelo a ' + plazo + ': ' + z.mae + ' puntos; regla simple: ' + z.mae_simple + ' puntos.',
          series: [
            { nombre: 'Lo que pasó', f: z.f, v: z.o, color: 'azul' },
            { nombre: 'Lo que dijo el modelo', f: z.f, v: z.p, color: 'verde', clase: 'l-fina', puntos: true }
          ]
        };
      } else {
        html = '<p class="paso__frase">Lo que acaba de ver, con sus cifras en lugar de las del DANE.</p>' +
          '<p class="paso__detalle">El método es el mismo: qué está pasando, hacia dónde va y qué tanto se le puede creer al pronóstico. Lo que cambia son los datos.</p>' +
          '<dl class="paso__lista">' +
          '<div><dt>Si tiene una pyme</dt><dd>Sus ventas al día, una proyección para planear compras e inventario, y el contexto del mercado al lado.</dd></div>' +
          '<div><dt>Si administra propiedad horizontal</dt><dd>Cartera por antigüedad, recaudo del mes, ejecución del presupuesto y una proyección del flujo de caja.</dd></div>' +
          '<div><dt>Si trabaja en una entidad pública</dt><dd>Recaudo y ejecución presupuestal consolidados, con proyección de ingresos por escenarios.</dd></div>' +
          '<div><dt>Si dirige una consultora</dt><dd>El análisis económico y los tableros que piden sus clientes, por proyecto.</dd></div>' +
          '</dl>' +
          '<div class="paso__accion"><h3>El siguiente paso son 20 minutos.</h3>' +
          '<p>Usted me cuenta cómo maneja hoy su información y yo le digo qué se puede automatizar, cuánto se demora y cuánto vale. Sin costo.</p>' +
          firma('Escríbame por WhatsApp', 'data-wa href="' + esc(urlWa || '#hablemos') + '"' + (urlWa ? ' target="_blank" rel="noopener"' : '')) +
          '<a class="flecha" href="#servicios">Ver servicios y precios <span aria-hidden="true">→</span></a></div>';
      }

      panel.className = 'paso' + (n === 3 ? ' paso--final' : '');
      panel.innerHTML = html;
      void panel.offsetWidth;
      panel.classList.add('entra');
      if (cfg) G.linea($('#lienzo-paso'), cfg);

      // Estado de los controles
      $$('.pasos__boton', caja).forEach(function (b) {
        var k = +b.dataset.paso, li = b.parentNode;
        if (k === n) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
        li.classList.toggle('activo', k === n);
        li.classList.toggle('hecho', k < n);
      });
      $$('[data-indicador]', caja).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.indicador === estado.ind)); });
      $('.recorrido__barra', caja).style.visibility = n === 3 ? 'hidden' : '';
      atras.disabled = n === 0;
      $('.firma__t', sigue).textContent = n < 3 ? 'Siguiente: ' + TITULOS[n + 1].replace(/^./, function (c) { return c.toLowerCase(); })
        : 'Ver servicios y precios';
      ruta.paso = 'Paso ' + (n + 1) + ': ' + ['Qué pasa', 'Hacia dónde va', 'Precisión', 'Sus datos'][n];
      ruta.pintar();
      if (mover) {
        var y = $('#pasos').getBoundingClientRect().top, libre = $('#ruta').getBoundingClientRect().bottom + 16;
        if (y < libre || y > window.innerHeight * 0.5) window.scrollBy({ top: y - libre, behavior: QUIETO ? 'auto' : 'smooth' });
      }
    }

    caja.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.indicador) { estado.ind = b.dataset.indicador; pintar(false); }
      else if (b.dataset.paso) { estado.paso = +b.dataset.paso; pintar(false); }
      else if (b.dataset.h) { estado.h = b.dataset.h; pintar(false); var nuevo = $('[data-h="' + estado.h + '"]', caja); if (nuevo) nuevo.focus(); }
      else if (b === atras && estado.paso > 0) { estado.paso--; pintar(true); }
      else if (b === sigue) {
        if (estado.paso < 3) { estado.paso++; pintar(true); } else location.hash = '#servicios';
      }
    });
    pintar(false);
  })();

  /* ───────── Páginas con dirección propia (#mi-trabajo, #servicios…) y anclas internas (#caso-nairu) ───────── */
  (function () {
    var hojas = $$('[data-hoja]');
    if (!hojas.length) return;
    var ids = hojas.map(function (h) { return h.id; });
    var actual = null;

    function destino() {
      var id = '';
      try { id = decodeURIComponent(location.hash.slice(1)); } catch (e) {}
      if (!id || ids.indexOf(id) >= 0) return { hoja: id || ids[0] };
      var el = document.getElementById(id), h = el && el.closest('[data-hoja]');
      return h ? { hoja: h.id, el: el } : { hoja: ids[0] };
    }
    // Lleva el elemento justo debajo del encabezado y la ruta fijos, usando su scroll-margin-top (estilos.css).
    function irA(el, suave) {
      var margen = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
      var y = el.getBoundingClientRect().top + window.pageYOffset - margen;
      window.scrollTo({ top: Math.max(0, Math.round(y)), behavior: suave && !QUIETO ? 'smooth' : 'auto' });
    }
    function mostrar(alCargar, suave) {
      var d = destino(), cambia = actual !== d.hoja;
      hojas.forEach(function (h) { h.classList.toggle('activa', h.id === d.hoja); });
      $$('[data-pestana]').forEach(function (a) {
        if (a.getAttribute('data-pestana') === d.hoja) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      });
      document.title = (d.hoja === ids[0] ? '' : NOMBRES[d.hoja] + ' · ') + 'Tupaz Analytics · Economía y Datos';
      menu.cerrar();
      if (d.el) {
        // Dentro de la misma página, desplazamiento suave; al cambiar de página, salto directo.
        irA(d.el, suave && !cambia);
        if (cambia || alCargar) {
          // Si las fuentes o las imágenes cambian la altura después, se corrige una vez (sin pelear con el usuario).
          var y0 = window.pageYOffset, objetivo = d.el;
          var reajustar = function () { if (destino().el === objetivo && Math.abs(window.pageYOffset - y0) < 4) { irA(objetivo, false); y0 = window.pageYOffset; } };
          requestAnimationFrame(reajustar);
          if (document.fonts && document.fonts.ready) document.fonts.ready.then(reajustar);
          if (alCargar) window.addEventListener('load', reajustar, { once: true });
        }
      } else if (!alCargar || cambia) {
        window.scrollTo(0, 0);
      }
      actual = d.hoja;
      ruta.pintar();
    }
    // Los enlaces internos los mueve el sitio (no el navegador), para que el título nunca quede tapado.
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var h = a.getAttribute('href'), id = '';
      try { id = decodeURIComponent(h.slice(1)); } catch (err) { return; }
      if (!id || (ids.indexOf(id) < 0 && !document.getElementById(id))) return;
      e.preventDefault();
      if (location.hash !== h) {
        try { history.pushState(null, '', h); } catch (err) { location.hash = h; return; }
      }
      mostrar(false, true);
    });
    window.addEventListener('popstate', function () { mostrar(false, false); });
    window.addEventListener('hashchange', function () { mostrar(false, false); });
    mostrar(true);
  })();
})();
