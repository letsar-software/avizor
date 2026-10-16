import json
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3514"
result = {
    "id": "phenology-image",
    "request_id": "phenology-image",
    "share_token": "phenology-image",
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
    "contexto_fenologico": {
        "disponible": True, "estadio_estimado": "R3", "descripcion": "Inicio de formación de vainas",
        "incertidumbre": {"nota": "Estimación calculada con la fecha de siembra y el grupo de madurez informados."},
        "detalle": {"estadio_actual_estimado": "R3", "grupo_madurez": "IV corto", "hitos": []},
        "modifica_reglas": False,
    },
    "duracion_ms": 100,
    "clima": {
        "serie": [{"fecha": "2026-01-18", "temperaturaMedia": 22.0, "temperaturaMinima": 14.0, "temperaturaMaxima": 28.0, "humedadRelativa": 78.0, "precipitacion": 1.0, "vientoMedio": 8.0, "puntoRocio": 12.0, "deficitPresionVapor": 0.5, "evapotranspiracion": 1.0, "et0": 1.0, "humedadSuelo": {}, "temperaturaSuelo": {}, "radiacionSolar": 18.0}],
        "rango_temporal": {"desde": "2026-01-05", "hasta": "2026-01-18"},
        "cobertura": 1, "variables_disponibles": ["precipitacion"], "variables_faltantes": [], "adapter_version": "v1",
    },
}

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    page.goto(BASE, wait_until="networkidle")
    page.evaluate("value => sessionStorage.setItem('avizor_resultado', value)", json.dumps(result))
    page.goto(f"{BASE}/resultado", wait_until="networkidle")
    page.get_by_role("heading", name="Contexto fenológico estimado").wait_for()
    image = page.locator('img[alt^="Ilustración del estadio"]')
    image.scroll_into_view_if_needed()
    image.wait_for(state="visible")
    assert image.evaluate("el => el.complete && el.naturalWidth > 0")
    assert page.get_by_role("link", name="Ver fenología completa").is_visible()
    page.screenshot(path="screenshots/phenology-context-image.png", full_page=True)
    browser.close()

print("phenology context image: ok")
