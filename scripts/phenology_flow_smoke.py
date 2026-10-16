import json
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3514"
fenologia = {
    "estadio_actual_estimado": "R3",
    "nombre_estadio": "Inicio de formación de vainas",
    "fecha_estimada": "2026-01-18",
    "margen_dias": 4,
    "confianza": "media",
    "metodo": "modelo_calendario_grupo_madurez",
    "version": "v1.0",
    "fecha_siembra": "2025-11-10",
    "grupo_madurez": "IV corto",
    "cultivar_id": "DM 40R16",
    "hitos": [
        {"codigo": "E", "nombre": "Emergencia", "fecha_estimada": "2025-11-18"},
        {"codigo": "R1", "nombre": "Inicio de floración", "fecha_estimada": "2026-01-07"},
        {"codigo": "R3", "nombre": "Inicio de formación de vainas", "fecha_estimada": "2026-01-18"},
        {"codigo": "R5", "nombre": "Inicio de llenado de granos", "fecha_estimada": "2026-02-22"},
        {"codigo": "R7", "nombre": "Inicio de madurez fisiológica", "fecha_estimada": "2026-04-03"},
    ],
}
dates = [f"2026-01-{day:02d}" for day in range(5, 19)]
series = [{
    "fecha": date, "temperaturaMedia": 22.0, "temperaturaMinima": 14.0,
    "temperaturaMaxima": 28.0, "humedadRelativa": 78.0, "precipitacion": 1.0,
    "vientoMedio": 8.0, "puntoRocio": 12.0, "deficitPresionVapor": 0.5,
    "evapotranspiracion": 1.0, "et0": 1.0, "humedadSuelo": {}, "temperaturaSuelo": {},
    "radiacionSolar": 18.0,
} for date in dates]
result = {
    "id": "phenology-smoke",
    "request_id": "phenology-smoke",
    "share_token": "phenology-smoke",
    "estado_general": "Atención recomendada",
    "explicacion": "Se detectaron condiciones ambientales que merecen atención y monitoreo.",
    "resumen_consulta": {
        "descripcion": "Las condiciones ambientales analizadas indican que conviene prestar atención al cultivo.",
        "destaque": "Principal condición a observar: enfermedades foliares",
    },
    "localidad": {"nombre": "Tandil", "provincia": "Buenos Aires", "pais": "Argentina", "latitud": -37.3, "longitud": -59.1},
    "cultivo": "soja",
    "fecha_ref": dates[-1],
    "generado_en": "2026-01-18T16:15:59Z",
    "proveedor_climatico": "Open-Meteo",
    "reglas": [{
        "riesgo": "roya_asiatica",
        "regla": {"clave": "roya_asiatica", "version": "v1", "estado": "activa", "categoria": "foliar", "nombre": "Roya asiática de la soja"},
        "estado": "moderadas",
        "etiqueta": "Condiciones parcialmente favorables",
        "explicacion": "La humedad relativa coincidió parcialmente con la regla.",
        "recomendacion": "Monitorear el lote.",
        "fuente_tecnica": "INTA",
        "limitaciones_declaradas": "Evaluación parcial.",
        "ventana": {"desde": dates[0], "hasta": dates[-1], "dias": 14},
        "observado": [],
        "calidad_dato": {"cobertura_min": 1, "dias_faltantes": 0, "distancia_punto_km": None},
        "evaluado_en": "2026-01-18T16:15:59Z",
    }],
    "plagas": {"disponibilidad": "disponible", "evaluaciones": []},
    "contexto_fenologico": {
        "disponible": True,
        "estadio_estimado": "R3",
        "descripcion": "Inicio de formación de vainas",
        "incertidumbre": {"nota": "Estimación calculada con la fecha de siembra y el grupo de madurez informados."},
        "detalle": fenologia,
        "modifica_reglas": False,
    },
    "fenologia": fenologia,
    "duracion_ms": 100,
    "clima": {
        "serie": series,
        "rango_temporal": {"desde": dates[0], "hasta": dates[-1]},
        "cobertura": 1,
        "variables_disponibles": ["precipitacion"],
        "variables_faltantes": [],
        "adapter_version": "v1",
    },
}

with sync_playwright() as p:
    browser = p.chromium.launch()
    for viewport in ({"width": 390, "height": 844}, {"width": 1440, "height": 900}):
        page = browser.new_page(viewport=viewport)
        sent = {}

        def api(route, request):
            sent.update(request.post_data_json or {})
            route.fulfill(status=201, content_type="application/json", body=json.dumps({"data": result}))

        page.route("**/api/public/consultas", api)
        page.goto(f"{BASE}/consultar", wait_until="networkidle")
        page.locator("#place").fill("Tandil, Buenos Aires")
        page.get_by_role("button", name="Quiero mejorar la precisión").click()
        page.locator("#planting-date").wait_for(state="visible")
        page.locator("#planting-date").fill("2025-11-10")
        page.locator("#maturity-group").select_option(label="IV corto")
        page.locator("#cultivar").fill("DM 40R16")
        page.get_by_role("button", name="Consultar", exact=True).click()
        page.wait_for_url("**/resultado")
        page.get_by_role("heading", name="Contexto fenológico estimado").wait_for()
        assert sent["fechaSiembra"] == "2025-11-10"
        assert sent["grupoMadurez"] == "IV corto"
        assert sent["cultivar"] == "DM 40R16"
        assert page.get_by_text("Inicio de formación de vainas").first.is_visible()
        assert page.get_by_role("heading", name="Resumen por categoría").is_visible()
        assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
        page.get_by_role("link", name="Ver fenología completa").click()
        page.wait_for_url("**/resultado/fenologia")
        page.get_by_role("heading", name="Fenología estimada del cultivo").wait_for(state="visible")
        assert page.get_by_text("IV corto", exact=True).is_visible()
        assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
        page.close()
    browser.close()

print("phenology flow desktop/mobile: ok")
