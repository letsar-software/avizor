import json
import sys
from playwright.sync_api import sync_playwright

base = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3000"
dates = [f"2026-08-{day:02d}" for day in range(18, 32)]
series = [{
    "fecha": date, "temperaturaMedia": 8.4, "temperaturaMinima": 0.2,
    "temperaturaMaxima": 15.0, "humedadRelativa": 64.1,
    "precipitacion": 2.0 if index in (8, 9) else 0.0, "vientoMedio": 8.0,
    "puntoRocio": 3.0, "deficitPresionVapor": 0.5, "evapotranspiracion": 1.0,
    "et0": 1.0, "humedadSuelo": {}, "temperaturaSuelo": {}, "radiacionSolar": 12.0,
} for index, date in enumerate(dates)]

def rule(risk, state, label, recommendation):
    metadata = {"clave": risk, "version": "v1", "estado": "activa"}
    if risk == "roya_asiatica":
        metadata.update({"categoria": "foliar", "nombre": "Roya asiática de la soja", "modo": "estable"})
    return {"riesgo": risk, "regla": metadata,
            "estado": state, "etiqueta": label, "explicacion": label,
            "recomendacion": recommendation, "fuente_tecnica": "INTA",
            "limitaciones_declaradas": "Evaluación parcial: no se dispone de humedad de suelo.",
            "ventana": {"desde": dates[0], "hasta": dates[-1], "dias": 14}, "observado": [],
            "calidad_dato": {"cobertura_min": 1, "dias_faltantes": 0, "distancia_punto_km": None},
            "evaluado_en": "2026-08-31T16:15:59Z"}

result = {
    "id": "ux-smoke", "request_id": "ux-smoke", "share_token": "ux-smoke",
    "estado_general": "Atención recomendada",
    "explicacion": "Se detectaron condiciones ambientales que merecen atención y monitoreo.",
    "resumen_consulta": {"descripcion": "Las condiciones ambientales analizadas indican que conviene prestar atención al cultivo.",
                         "destaque": "Principal condición a observar: disponibilidad hídrica"},
    "localidad": {"nombre": "Tandil", "provincia": "Buenos Aires", "pais": "Argentina", "latitud": -37.3, "longitud": -59.1},
    "cultivo": "soja", "fecha_ref": dates[-1], "generado_en": "2026-08-31T16:15:59Z",
    "proveedor_climatico": "Open-Meteo",
    "reglas": [rule("temperatura_bajo_umbral", "sin_condiciones", "Desfavorable", "Mantener el monitoreo habitual."),
               rule("roya_asiatica", "indeterminado", "No evaluada", "Revisar el lote."),
               rule("baja_precipitacion", "condiciones_detectadas", "Favorable - Favorable", "Monitorear disponibilidad hídrica."),
               rule("precipitacion_elevada", "sin_condiciones", "Desfavorable", "Mantener el monitoreo habitual.")],
    "plagas": {"disponibilidad": "disponible", "evaluaciones": []},
    "contexto_fenologico": {"disponible": True, "estadio_estimado": "E", "descripcion": "Emergencia",
        "incertidumbre": {"nota": "Fase temprana del cultivo. Continuá el seguimiento para anticipar cambios de fase."},
        "detalle": {"confianza": "alta", "margen_dias": 4}, "modifica_reglas": False},
    "duracion_ms": 100, "clima": {"serie": series, "rango_temporal": {"desde": dates[0], "hasta": dates[-1]},
        "cobertura": 1, "variables_disponibles": ["precipitacion"], "variables_faltantes": [], "adapter_version": "v1"}
}
result["reglas"][1]["limitaciones_declaradas"] = "No observa mojado foliar."
result["reglas"][2]["limitaciones_declaradas"] = "Regla experimental en validación."
result["reglas"][3]["limitaciones_declaradas"] = "Limitación técnica sin clasificación explícita."

with sync_playwright() as p:
    browser = p.chromium.launch()
    for name, width, height in (("desktop", 1440, 1000), ("mobile", 390, 844)):
        page = browser.new_page(viewport={"width": width, "height": height})
        page.goto(base)
        page.evaluate("value => sessionStorage.setItem('avizor_resultado', value)", json.dumps(result))
        page.goto(f"{base}/resultado", wait_until="networkidle")
        for text in ("Estado general", "Resumen por", "Evidencia clim", "Contexto fenol", "Limitaciones"):
            assert page.get_by_text(text, exact=False).first.is_visible(), f"{name}: {text}"
        assert not page.get_by_text("Favorable - Favorable", exact=True).count(), f"{name}: duplicated label"
        for accordion_id in ("result-observe", "result-limitations", "result-sources", "result-quality"):
            assert page.locator(f"button[aria-controls='{accordion_id}-panel']").get_attribute("aria-expanded") == "false", f"{name}: {accordion_id} should start closed"
        assert page.get_by_text("1 fuente utilizada", exact=True).is_visible(), f"{name}: source count"
        page.locator("button[aria-controls='result-limitations-panel']").click()
        assert page.get_by_text("Evaluación parcial", exact=True).is_visible(), f"{name}: limitation groups"
        assert page.get_by_text("1 observación", exact=True).count() == 4, f"{name}: dynamic group counts"
        original = "Evaluación parcial: no se dispone de humedad de suelo."
        assert not page.get_by_text(original, exact=True).is_visible(), f"{name}: details should start closed"
        page.locator("#result-limitations-panel details summary").first.click()
        assert page.get_by_text(original, exact=True).is_visible(), f"{name}: literal limitation detail"
        assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth"), f"{name}: horizontal overflow"
        page.screenshot(path=f"docs/screenshots/results-ux-{name}.png", full_page=True)
        page.close()
    empty = json.loads(json.dumps(result))
    for item in empty["reglas"]:
        item["recomendacion"] = ""
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.goto(base)
    page.evaluate("value => sessionStorage.setItem('avizor_resultado', value)", json.dumps(empty))
    page.goto(f"{base}/resultado", wait_until="networkidle")
    assert page.locator("button[aria-controls='result-observe-panel']").count() == 0, "empty recommendations should not render"
    page.close()
    browser.close()

print("results UX desktop/mobile smoke: ok")
