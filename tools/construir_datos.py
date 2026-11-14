#!/usr/bin/env python3
"""Arma assets/js/datos.js a partir de la demo «Coyuntura Antioquia».

Lee ../06_Demo/data/processed/ (series, cifras, pronósticos y backtesting) y deja
un solo archivo con todo lo que la página necesita: la cinta de indicadores, la
serie de desempleo con su tendencia (filtro Hodrick-Prescott) y el recorrido guiado
del tablero. Ninguna cifra se escribe a mano: todas salen de esos archivos.

Uso:  python3 tools/construir_datos.py
"""
from __future__ import annotations

import csv
import json
import sys
from collections import defaultdict
from pathlib import Path

import numpy as np

WEB = Path(__file__).resolve().parent.parent
DEMO = WEB.parent / "06_Demo" / "data" / "processed"
SALIDA = WEB / "assets" / "js" / "datos.js"

MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
MESES_LARGO = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
               "septiembre", "octubre", "noviembre", "diciembre"]
LAMBDA_HP = 129600  # mensual (Ravn y Uhlig, 2002)


# ---------- utilidades ----------
def num(x: float, d: int = 1) -> str:
    """Número con coma decimal y punto de miles, como se escribe en Colombia."""
    s = f"{x:,.{d}f}"
    return s.replace(",", "§").replace(".", ",").replace("§", ".")


def am(fecha: str) -> tuple[int, int]:
    return int(fecha[:4]), int(fecha[5:7])


def trimestre(fecha: str, largo: bool = False) -> str:
    """La fecha de la GEIH es el último mes del trimestre móvil: 2026-09 -> jul–sep 2026."""
    a, m = am(fecha)
    ini = (m - 3) % 12
    nombres = MESES_LARGO if largo else MESES
    return f"{nombres[ini]}–{nombres[m - 1]} {'de ' if largo else ''}{a}"


def mes(fecha: str, largo: bool = True) -> str:
    a, m = am(fecha)
    return f"{MESES_LARGO[m - 1]} de {a}" if largo else f"{MESES[m - 1]} {a}"


def dia(fecha: str) -> str:
    a, m = am(fecha)
    return f"{int(fecha[8:10])} de {MESES_LARGO[m - 1]} de {a}"


def lista(xs: list[str]) -> str:
    xs = [str(x) for x in xs]
    return xs[0] if len(xs) == 1 else ", ".join(xs[:-1]) + " y " + xs[-1]


def hp(y: np.ndarray, lam: float = LAMBDA_HP) -> np.ndarray:
    """Tendencia de Hodrick-Prescott: resuelve (I + lam·K'K) t = y."""
    n = len(y)
    k = np.zeros((n - 2, n))
    for i in range(n - 2):
        k[i, i], k[i, i + 1], k[i, i + 2] = 1.0, -2.0, 1.0
    return np.linalg.solve(np.eye(n) + lam * k.T @ k, y)


def leer_csv(ruta: Path) -> list[dict]:
    with open(ruta, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


# ---------- lectura ----------
if not DEMO.exists():
    sys.exit(f"No encuentro los datos de la demo en {DEMO}. Corre primero la demo (python run.py).")

series: dict[str, list[tuple[str, float]]] = defaultdict(list)
fuentes: dict[str, str] = {}
for r in leer_csv(DEMO / "series.csv"):
    series[r["serie"]].append((r["fecha"], float(r["valor"])))
    fuentes[r["serie"]] = r["fuente"]
for s in series.values():
    s.sort()

cifras = {k: v["valor"] for k, v in json.loads((DEMO / "cifras.json").read_text("utf-8")).items()}
textos = json.loads((DEMO / "textos.json").read_text("utf-8"))
meta = json.loads((DEMO / "meta.json").read_text("utf-8"))
metricas = leer_csv(DEMO / "backtesting.csv")
corte = max(v["hasta"] for v in meta["cortes"].values())


def serie(nombre: str, desde: str | None = None, ultimos: int | None = None, d: int = 2):
    datos = series[nombre]
    if desde:
        datos = [p for p in datos if p[0] >= desde]
    if ultimos:
        datos = datos[-ultimos:]
    return {"f": [p[0][:7] for p in datos], "v": [round(p[1], d) for p in datos]}


# ---------- cinta de indicadores ----------
def acumulado12(nombre: str) -> list[float]:
    v = [p[1] for p in series[nombre]]
    return [sum(v[i - 11:i + 1]) for i in range(11, len(v))]


tarjetas = {t["titulo"]: t for t in textos["tarjetas"]}
CINTA = [
    ("Desempleo · Medellín A.M.", "Desempleo Medellín", "td_medellin", None),
    ("Inflación anual · Medellín", "Inflación Medellín", "ipc_var_anual_medellin", None),
    ("Tasa de política monetaria", "Tasa Banco República", "tpm_fin_mes", None),
    ("TRM (pesos por dólar)", "Dólar (TRM)", "trm_promedio_mensual", None),
    ("Exportaciones sin petróleo · Antioquia", "Exportaciones Antioquia", "expo_antioquia_sin_petroleo", None),
    ("Área licenciada · Valle de Aburrá", "Área licenciada V. de Aburrá", "elic_area_total_va", "acum12"),
]
cinta = []
for titulo, corto, nombre, modo in CINTA:
    t = tarjetas.get(titulo)
    if not t or nombre not in series:
        continue
    mini = acumulado12(nombre)[-24:] if modo == "acum12" else [p[1] for p in series[nombre][-24:]]
    cinta.append({
        "nombre": corto, "titulo": t["titulo"], "valor": t["valor"], "dir": t["dir"],
        "variacion": t["variacion"], "periodo": t["periodo"], "fuente": fuentes[nombre],
        "mini": [round(x, 3) for x in mini],
    })

# ---------- serie de portada: desempleo y su tendencia ----------
td = series["td_medellin"]
tendencia = hp(np.array([p[1] for p in td]))
i_max = int(np.argmax([p[1] for p in td]))
portada = {
    "f": [p[0][:7] for p in td],
    "v": [round(p[1], 2) for p in td],
    "t": [round(float(x), 2) for x in tendencia],
    "ultimo": {"valor": num(td[-1][1]), "periodo": trimestre(td[-1][0])},
    "maximo": {"i": i_max, "valor": num(td[i_max][1]), "periodo": trimestre(td[i_max][0])},
    "desde": am(td[0][0])[0], "hasta": am(td[-1][0])[0],
    "fuente": "DANE, Gran Encuesta Integrada de Hogares (GEIH). Tendencia: filtro de Hodrick-Prescott, cálculos propios.",
}


# ---------- recorrido guiado ----------
def modelo_publicado(objetivo: str) -> tuple[str, list[dict]]:
    filas = [r for r in leer_csv(DEMO / "pronosticos.csv")
             if r["objetivo"] == objetivo and r["publicado"] == "True"]
    filas.sort(key=lambda r: int(r["horizonte"]))
    return filas[0]["modelo"], filas


def precision(objetivo: str, modelo: str, horizontes: list[int]) -> dict:
    m = {(r["modelo"], int(r["horizonte"])): r for r in metricas if r["objetivo"] == objetivo}
    detalle = leer_csv(DEMO / "modelos" / objetivo / "backtesting_detalle.csv")
    por_h = {}
    for h in horizontes:
        filas = sorted((r for r in detalle if r["modelo"] == modelo and int(r["horizonte"]) == h),
                       key=lambda r: r["fecha"])
        por_h[str(h)] = {
            "f": [r["fecha"][:7] for r in filas],
            "p": [round(float(r["pronostico"]), 2) for r in filas],
            "o": [round(float(r["observado"]), 2) for r in filas],
            "mae": num(float(m[(modelo, h)]["mae"]), 2),
            "mae_simple": num(float(m[("ingenuo_estacional", h)]["mae"]), 2),
            "gana": m[(modelo, h)]["gana_al_ingenuo"] == "True",
            "n": int(m[(modelo, h)]["n"]),
        }
    evaluados = [h for h in (1, 3, 6, 12) if (modelo, h) in m]
    gana = [h for h in evaluados if m[(modelo, h)]["gana_al_ingenuo"] == "True"]
    pierde = [h for h in evaluados if h not in gana]
    return {"horizontes": por_h, "gana": gana, "pierde": pierde}


def aciertos(objetivo: str, modelo: str, mes_objetivo: str, h: int, h_pub: int, trim: bool) -> dict:
    """Lo que dijo el modelo con h meses de anticipación vs. lo que pasó, en los dos últimos años
    disponibles del mes objetivo; más el error medio a h meses y la cobertura real del intervalo del 80 %."""
    detalle = leer_csv(DEMO / "modelos" / objetivo / "backtesting_detalle.csv")
    filas = sorted((r for r in detalle if r["modelo"] == modelo and int(r["horizonte"]) == h
                    and r["fecha"][5:7] == mes_objetivo), key=lambda r: r["fecha"])[-2:]
    etiqueta = (lambda f: trimestre(f)) if trim else (lambda f: mes(f, False))
    casos = []
    for r in filas:
        p, o, li, ls = (float(r[k]) for k in ("pronostico", "observado", "li80", "ls80"))
        casos.append({
            "periodo": etiqueta(r["fecha"]), "con_datos_hasta": etiqueta(r["origen"]),
            "dijo": num(p, 1 if trim else 2), "desde": num(li, 1 if trim else 2), "hasta": num(ls, 1 if trim else 2),
            "paso": num(o, 1 if trim else 2), "error": num(p - o, 1 if trim else 2).replace("-", "−"),
            "dentro": li <= o <= ls,
        })
    m = {(r["modelo"], int(r["horizonte"])): r for r in metricas if r["objetivo"] == objetivo}
    rango = [r for r in detalle if r["modelo"] == modelo and 1 <= int(r["horizonte"]) <= h_pub]
    cob = 100 * sum(float(r["li80"]) <= float(r["observado"]) <= float(r["ls80"]) for r in rango) / len(rango)
    return {"h": h, "h_pub": h_pub, "casos": casos, "mae_h": num(float(m[(modelo, h)]["mae"]), 2),
            "cob80": num(cob, 0), "n": len(rango)}


def pronostico(filas: list[dict], historia: list[tuple[str, float]], meses_atras: int = 48) -> dict:
    h = historia[-meses_atras:]
    return {
        "f": [p[0][:7] for p in h], "v": [round(p[1], 2) for p in h],
        "pf": [r["fecha"][:7] for r in filas],
        "p": [round(float(r["pronostico"]), 2) for r in filas],
        "li": [round(float(r["li80"]), 2) for r in filas],
        "ls": [round(float(r["ls80"]), 2) for r in filas],
    }


def frase_gana(p: dict, h_pub: int) -> str:
    if not p["pierde"]:
        return f"Le gana a la regla simple en todos los plazos probados ({lista(p['gana'])} meses)."
    if not p["gana"]:
        return "En esta serie el modelo no le gana a la regla simple, y así se dice."
    txt = (f"Medido con la vara más exigente, le gana a la regla simple a {lista(p['gana'])} "
           f"{'mes' if p['gana'] == [1] else 'meses'}; a {lista(p['pierde'])} "
           f"{'mes' if p['pierde'] == [1] else 'meses'}, no.")
    if 12 in p["pierde"] and h_pub < 12:
        txt += f" Por eso solo se publican {h_pub} meses de pronóstico."
    return txt


def frase_cobertura(cob: float) -> str:
    base = f"El margen de error contuvo el dato real el {num(cob, 0)} % de las veces (se esperaba 80 %)"
    if cob < 77:
        return base + ": se queda un poco corto, y es mejor saberlo."
    if cob > 85:
        return base + ": es más ancho de lo necesario."
    return base + "."


# --- desempleo ---
c = cifras
mod_d, pron_d = modelo_publicado("desempleo_medellin")
prec_d = precision("desempleo_medellin", mod_d, [1, 3, 6])
sube = c["lab_td_dif"] > 0
f_td, f_pd = td[-1][0], pron_d[-1]["fecha"]
detalle1 = (f"Es el dato de {trimestre(f_td, True)}. Hace un año eran {num(c['lab_td_ant'])}: "
            f"{'subió' if sube else 'bajó'} {num(abs(c['lab_td_dif']))} puntos.")
if sube and c["lab_ocup_dif"] > 0:
    detalle1 += (f" No es que haya menos empleo: hay {num(c['lab_ocup_dif'])} mil ocupados más que hace un año, "
                 "pero salió todavía más gente a buscar trabajo.")
elif sube:
    detalle1 += f" Hay {num(abs(c['lab_ocup_dif']))} mil ocupados menos que hace un año."
elif c["lab_ocup_dif"] > 0:
    detalle1 += f" Hay {num(c['lab_ocup_dif'])} mil ocupados más que hace un año."
detalle2 = (f"La franja sombreada es el margen de error: lo más probable es que quede entre "
            f"{num(c['pd_fin_li80'])} % y {num(c['pd_fin_ls80'])} %.")
if c["pd_cambio"] > 0 and c.get("pd_estacional_3a", 0) > 0:
    a_td, a_pd = trimestre(f_td).split(" ")[0], trimestre(f_pd).split(" ")[0]
    detalle2 += (f" Ojo: buena parte de esa subida es de calendario. En los últimos tres años, el desempleo de "
                 f"{a_pd} fue en promedio {num(c['pd_estacional_3a'])} puntos más alto que el de {a_td}.")

desempleo = {
    "boton": "Desempleo",
    "unidad": "%", "decimales": 1,
    "pasos": [
        {
            "frase": f"En Medellín y su área metropolitana, {num(c['lab_td'])} de cada 100 personas que quieren trabajar no consiguen empleo.",
            "detalle": detalle1,
            "cifra": f"{num(c['lab_td'])} %", "rotulo": f"Tasa de desempleo · {trimestre(f_td)}",
            "fuente": "DANE, Gran Encuesta Integrada de Hogares",
            "negocio": ([
                "Si le vende al consumidor final: cuando el desempleo sube, los hogares suelen cuidar más el gasto. Vale la pena mirar sus ventas mes a mes y no solo al cierre del año.",
                "Si va a contratar: hay más personas buscando trabajo que hace un año.",
            ] if sube else [
                "Si le vende al consumidor final: con más gente empleada, suele haber más hogares con ingreso para gastar.",
                "Si va a contratar: hay menos personas buscando trabajo que hace un año; conseguir personal puede tomar más tiempo.",
            ]) + ["Con sus propios datos al lado, se ve si sus ventas se mueven con el empleo de la ciudad o por su cuenta."],
            "titulo": "Tasa de desempleo, Medellín y área metropolitana (%)",
            "principal": {"nombre": "Medellín A.M.", **serie("td_medellin", desde="2015-01-01")},
            "comparacion": {"nombre": "13 ciudades", **serie("td_13ciudades", desde="2015-01-01")},
            "nota": "Trimestres móviles. Fuente: DANE, GEIH.",
        },
        {
            "frase": f"El modelo espera que el desempleo esté cerca de {num(c['pd_fin_pronostico'])} % en {trimestre(f_pd, True)}.",
            "detalle": detalle2,
            "cifra": f"{num(c['pd_fin_pronostico'])} %", "rotulo": f"Pronóstico · {trimestre(f_pd)}",
            "fuente": "Cálculos propios con datos del DANE",
            "negocio": [
                "Con sus datos, esta gráfica sería la proyección de sus ventas, su recaudo o su cartera.",
                "Usted recibe un número esperado y un rango, con escenario pesimista, base y optimista, para planear compras, inventario o flujo de caja.",
                "Un pronóstico no es una promesa: por eso el rango importa tanto como el número.",
            ],
            "titulo": "Desempleo de Medellín: lo observado y lo que espera el modelo (%)",
            "pronostico": pronostico(pron_d, td),
            "nota": f"Franja: intervalo del 80 %. Modelo de series de tiempo (SARIMA) con datos hasta {trimestre(f_td)}. Fuente: DANE, GEIH; cálculos propios.",
        },
        {
            "detalle": (f"Repetí el pronóstico {prec_d['horizontes']['1']['n']} veces, escondiéndole al modelo lo que pasó después, "
                        "y lo comparé con una regla simple: «será igual que hace un año». "
                        + frase_gana(prec_d, int(c["pd_h_pub"])) + " " + frase_cobertura(c["pd_cob80"])),
            "regla": "«será igual que hace un año»",
            "fuente": "Prueba retrospectiva (backtesting) de los últimos 24 meses",
            "negocio": [
                "Antes de decidir con un pronóstico, usted sabe cuánto se ha equivocado.",
                "Si con sus datos un modelo no le gana a una regla simple, se lo digo.",
                "Así no paga por una cifra que suena precisa y no lo es.",
            ],
            "titulo": "Lo que dijo el modelo y lo que pasó (%)",
            "precision": prec_d,
            "aciertos": aciertos("desempleo_medellin", mod_d, "03", 6, int(c["pd_h_pub"]), True),
            "nota": "Cada punto es un pronóstico hecho solo con los datos disponibles en su momento. Fuente: DANE, GEIH; cálculos propios.",
        },
    ],
}

# --- inflación ---
mod_i, pron_i = modelo_publicado("inflacion_medellin")
h_i = [h for h in (1, 3, 6, 12) if h <= int(c["pi_h_pub"])]
prec_i = precision("inflacion_medellin", mod_i, h_i)
ipc = series["ipc_var_anual_medellin"]
f_ipc, f_pi = ipc[-1][0], pron_i[-1]["fecha"]
det_i1 = f"Es el dato de {mes(f_ipc)}. Hace un año la inflación de la ciudad era de {num(c['inf_med_ant'], 2)} %."
if c["inf_med"] > c["inf_nal"]:
    det_i1 += (f" En el país es de {num(c['inf_nal'], 2)} %: Medellín lleva {int(c['inf_meses_racha'])} "
               "meses seguidos por encima.")
else:
    det_i1 += f" En el país es de {num(c['inf_nal'], 2)} %."
baja = c["pi_fin_pronostico"] < c["inf_med"]
det_i2 = (f"A un año el margen de error es amplio: entre {num(c['pi_fin_li80'], 2)} % y {num(c['pi_fin_ls80'], 2)} %. "
          "Cuanto más lejos se mira, menos preciso es el pronóstico.")
dic = next((r for r in pron_i if r["fecha"][5:7] == "12"), None)
if dic:
    det_i2 += (f" Para {mes(dic['fecha'])} espera {num(float(dic['pronostico']), 2)} % "
               f"(entre {num(float(dic['li80']), 2)} % y {num(float(dic['ls80']), 2)} %).")

inflacion = {
    "boton": "Inflación",
    "unidad": "%", "decimales": 2,
    "pasos": [
        {
            "frase": f"En Medellín, los precios están {num(c['inf_med'], 2)} % más altos que hace un año.",
            "detalle": det_i1,
            "cifra": f"{num(c['inf_med'], 2)} %", "rotulo": f"Inflación anual · {mes(f_ipc, False)}",
            "fuente": "DANE, Índice de Precios al Consumidor",
            "negocio": [
                "Sus costos (arriendo, insumos, servicios, nómina) tienden a subir a ese ritmo.",
                "Si sus precios o sus cuotas de administración suben menos que la inflación, su margen o su presupuesto se aprietan.",
                "Con sus propios datos se ve cuáles costos le están subiendo más que el promedio.",
            ],
            "titulo": "Inflación anual, Medellín y Colombia (%)",
            "principal": {"nombre": "Medellín", **serie("ipc_var_anual_medellin")},
            "comparacion": {"nombre": "Colombia", **serie("ipc_var_anual_nacional", desde=ipc[0][0])},
            "nota": "Variación del IPC frente al mismo mes del año anterior. Fuente: DANE, IPC.",
        },
        {
            "frase": f"El modelo espera que la inflación de Medellín {'baje' if baja else 'suba'} hacia {num(c['pi_fin_pronostico'], 2)} % en {mes(f_pi)}.",
            "detalle": det_i2,
            "cifra": f"{num(c['pi_fin_pronostico'], 2)} %", "rotulo": f"Pronóstico · {mes(f_pi, False)}",
            "fuente": "Cálculos propios con datos del DANE",
            "negocio": [
                "Sirve para armar el presupuesto del próximo año con un supuesto de inflación explícito, no «a ojo».",
                "El rango ancho también informa: conviene tener un plan para el escenario alto y otro para el bajo.",
                "Con sus datos, lo mismo se hace con sus costos, sus cuotas o su recaudo.",
            ],
            "titulo": "Inflación de Medellín: lo observado y lo que espera el modelo (%)",
            "pronostico": pronostico(pron_i, ipc),
            "nota": f"Franja: intervalo del 80 %. Modelo de series de tiempo que usa la inflación nacional como apoyo, con datos hasta {mes(f_ipc, False)}. Fuente: DANE, IPC; cálculos propios.",
        },
        {
            "detalle": (f"Repetí el pronóstico {prec_i['horizontes']['1']['n']} veces, escondiéndole al modelo lo que pasó después, "
                        "y lo comparé con una regla simple: «la inflación se queda donde está». "
                        "En inflación esa regla es difícil de superar y la ventaja del modelo es pequeña. "
                        + frase_gana(prec_i, int(c["pi_h_pub"])) + " " + frase_cobertura(c["pi_cob80"])),
            "regla": "«la inflación se queda donde está»",
            "fuente": "Prueba retrospectiva (backtesting) de los últimos 24 meses",
            "negocio": [
                "No todos los pronósticos son igual de buenos, y usted merece saber cuál es cuál.",
                "Cuando la ventaja de un modelo es pequeña, se lo digo: a veces la regla simple basta.",
                "Así decide cuánto peso darle a cada cifra antes de comprometer plata.",
            ],
            "titulo": "Lo que dijo el modelo y lo que pasó (%)",
            "precision": prec_i,
            "aciertos": aciertos("inflacion_medellin", mod_i, "12", 6, int(c["pi_h_pub"]), False),
            "nota": "Cada punto es un pronóstico hecho solo con los datos disponibles en su momento. Fuente: DANE, IPC; cálculos propios.",
        },
    ],
}

datos = {
    "corte": dia(corte),
    "corte_iso": corte,
    "n_series": len(series),
    "cinta": cinta,
    "portada": portada,
    "prueba": {
        "mae_h1": prec_d["horizontes"]["1"]["mae"],
        "mae_simple_h1": prec_d["horizontes"]["1"]["mae_simple"],
        "n": prec_d["horizontes"]["1"]["n"],
    },
    "tablero": {"desempleo": desempleo, "inflacion": inflacion},
}

SALIDA.parent.mkdir(parents=True, exist_ok=True)
SALIDA.write_text(
    "/* Generado por tools/construir_datos.py a partir de ../06_Demo/data/processed. No editar a mano. */\n"
    "window.TUPAZ_DATOS = " + json.dumps(datos, ensure_ascii=False, separators=(",", ":")).replace(" %", "\u00a0%") + ";\n",
    encoding="utf-8",
)
print(f"Listo: {SALIDA.relative_to(WEB)} ({SALIDA.stat().st_size / 1024:.0f} KB) · corte {datos['corte']} · "
      f"{len(cinta)} indicadores en la cinta · {datos['n_series']} series en la demo")
