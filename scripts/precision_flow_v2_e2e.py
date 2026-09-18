import json
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3000"
OUT = Path("screenshots")
OUT.mkdir(exist_ok=True)

fenologia = {
    "estadio_actual_estimado": "R3",
    "nombre_estadio": "Inicio de formación de vainas",
    "fecha_estimada": "2026-01-18",
    "margen_dias": 4,
    "confianza": "media",
    "metodo": "modelo_calendario_grupo_madurez",
    "version": "v1.0",
    "fecha_siembra": "2026-05-01",
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
base_result = {
    "id": "precision-smoke",
    "request_id": "precision-smoke",
    "share_token": "precision-smoke",
    "estado_general": "Atención recomendada",
    "explicacion": "Se detectaron condiciones ambientales que merecen atención y monitoreo.",
    "resumen_consulta": {"descripcion": "Las condiciones ambientales analizadas indican que conviene prestar atención al cultivo.", "destaque": "Principal condición a observar: enfermedades foliares"},
    "localidad": {"nombre": "Tandil", "provincia": "Buenos Aires", "pais": "Argentina", "latitud": -37.3, "longitud": -59.1},
    "cultivo": "soja",
    "fecha_ref": "2026-01-18",
    "generado_en": "2026-01-18T16:15:59Z",
    "proveedor_climatico": "Open-Meteo",
    "reglas": [{
        "riesgo": "roya_asiatica",
        "regla": {"clave": "roya_asiatica", "version": "v1", "estado": "activa", "categoria": "foliar", "nombre": "Roya asiática de la soja"},
        "estado": "moderadas", "etiqueta": "Condiciones parcialmente favorables",
        "explicacion": "La humedad relativa coincidió parcialmente con la regla.",
        "recomendacion": "Monitorear el lote.", "fuente_tecnica": "INTA",
        "limitaciones_declaradas": "Evaluación parcial.",
        "ventana": {"desde": "2026-01-05", "hasta": "2026-01-18", "dias": 14},
        "observado": [], "calidad_dato": {"cobertura_min": 1, "dias_faltantes": 0, "distancia_punto_km": None},
        "evaluado_en": "2026-01-18T16:15:59Z",
    }],
    "plagas": {"disponibilidad": "disponible", "evaluaciones": []},
    "duracion_ms": 100,
    "clima": {
        "serie": [{"fecha": "2026-01-18", "temperaturaMedia": 22.0, "temperaturaMinima": 14.0, "temperaturaMaxima": 28.0, "humedadRelativa": 78.0, "precipitacion": 1.0, "vientoMedio": 8.0, "puntoRocio": 12.0, "deficitPresionVapor": 0.5, "evapotranspiracion": 1.0, "et0": 1.0, "humedadSuelo": {}, "temperaturaSuelo": {}, "radiacionSolar": 18.0}],
        "rango_temporal": {"desde": "2026-01-05", "hasta": "2026-01-18"},
        "cobertura": 1, "variables_disponibles": ["precipitacion"], "variables_faltantes": [], "adapter_version": "v1",
    },
}

calls = []

def result_for(body):
    payload = json.loads(json.dumps(base_result))
    if body.get("fechaSiembra"):
        payload["contexto_fenologico"] = {
            "disponible": True, "estadio_estimado": "R3", "descripcion": "Inicio de formación de vainas",
            "incertidumbre": {"nota": "Estimación calculada con la fecha de siembra y el grupo de madurez informados."},
            "detalle": fenologia, "modifica_reglas": False,
        }
        payload["fenologia"] = fenologia
    else:
        payload["contexto_fenologico"] = {"disponible": False, "modifica_reglas": False}
    return payload

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1100})

    def api(route, request):
        body = request.post_data_json or {}
        calls.append(body)
        route.fulfill(status=201, content_type="application/json", body=json.dumps({"data": result_for(body)}))

    page.route("**/api/public/consultas", api)
    page.goto(f"{BASE}/consultar", wait_until="networkidle", timeout=60000)
    page.locator("#place").fill("Tandil, Buenos Aires")
    page.get_by_role("button", name="Consultar", exact=True).click()
    page.wait_for_url("**/resultado", timeout=30000)
    page.get_by_text("¿Querés mejorar la precisión del análisis?").wait_for()
    page.get_by_role("button", name="Completar datos del cultivo").click()
    page.locator('input[type="date"]').fill("2026-05-01")
    page.get_by_label("Grupo de madurez").select_option("IV corto")
    page.get_by_label("Cultivar").fill("DM 40R16")
    page.get_by_role("button", name="Recalcular análisis").click()
    page.get_by_role("heading", name="Contexto fenológico estimado").wait_for(timeout=30000)
    page.screenshot(path=str(OUT / "precision-result-desktop.png"), full_page=True)
    page.get_by_role("link", name="Ver fenología completa").click()
    page.wait_for_url("**/resultado/fenologia")
    page.get_by_role("heading", name="Fenología estimada del cultivo").wait_for()
    assert page.get_by_text("IV corto", exact=True).is_visible()
    assert calls[-1]["fechaSiembra"] == "2026-05-01"
    page.screenshot(path=str(OUT / "precision-detail-desktop.png"), full_page=True)
    browser.close()

print("precision_flow_v2_e2e: ok")
