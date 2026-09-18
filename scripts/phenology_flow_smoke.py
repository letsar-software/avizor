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
        {"codigo":"E","nombre":"Emergencia","fecha_estimada":"2025-11-18"},
        {"codigo":"R1","nombre":"Inicio de floración","fecha_estimada":"2026-01-07"},
        {"codigo":"R3","nombre":"Inicio de formación de vainas","fecha_estimada":"2026-01-18"},
        {"codigo":"R5","nombre":"Inicio de llenado de granos","fecha_estimada":"2026-02-22"},
        {"codigo":"R7","nombre":"Inicio de madurez fisiológica","fecha_estimada":"2026-04-03"},
    ],
}
result = {
    "estado_general":"Atención recomendada","confianza":"Alta","dias_datos":14,"share_token":"test",
    "explicacion":"Condiciones actuales para monitorear.","generado_en":"2026-01-01T00:00:00Z","fecha_ref":"2026-01-01",
    "localidad":{"nombre":"Tandil","provincia":"Buenos Aires"},"cultivo":"soja","reglas":[],
    "clima":{"serie":[],"cobertura":{"dias_disponibles":14,"dias_esperados":14}},"prevision":[],
    "categorias":[
        {"nombre":"heladas","condicion":"desfavorable","causas":[],"recomendacion":"","regla_version":"v1"},
        {"nombre":"enfermedades_foliares","condicion":"moderada","causas":[],"recomendacion":"Monitorear el lote.","regla_version":"v1"},
        {"nombre":"estres_hidrico","condicion":"desfavorable","causas":[],"recomendacion":"","regla_version":"v1"},
        {"nombre":"exceso_hidrico","condicion":"favorable","causas":[],"recomendacion":"","regla_version":"v1"},
    ],
    "clima_resumen":{"dias_datos":14,"humedad_media_14d":88.1,"lluvia_5d_mm":20,"lluvia_7d_mm":30,"lluvia_14d_mm":39.9,"temp_media_14d":9.2,"viento_medio_14d_kmh":18,"dias_lluvia_14d":4,"temp_min_14d":6.2},
    "contexto_fenologico":{"disponible":True,"estadio_estimado":"R3","descripcion":"R3 — Inicio de formación de vainas","fecha_estimada":"2026-01-18","confianza":"media"},
    "fenologia":fenologia,
}

with sync_playwright() as p:
    browser = p.chromium.launch()
    for viewport in ({"width":390,"height":844},{"width":1440,"height":900}):
        context = browser.new_context(
            viewport=viewport,
            extra_http_headers={"x-real-ip": "127.0.0.10"},
        )
        page = context.new_page()
        sent = {}
        def api(route, request):
            sent.update(request.post_data_json)
            route.fulfill(status=200, content_type="application/json", body=__import__("json").dumps({"data": result}))
        page.route("**/api/public/consultas*", api)
        page.goto(f"{BASE}/consultar", wait_until="networkidle")
        precision_button = page.get_by_role("button", name="Quiero mejorar la precisión")
        page.wait_for_function("el => Object.keys(el).some(k => k.startsWith('__reactProps'))", arg=precision_button.element_handle())
        precision_button.click()
        page.locator("#planting-date").wait_for(state="visible")
        page.locator("#planting-date").fill("2025-11-10")
        page.locator("#maturity-group").select_option(label="IV corto")
        page.locator("#cultivar").fill("DM 40R16")
        page.get_by_role("button", name="Consultar", exact=True).click()
        page.wait_for_url("**/resultado")
        assert sent["fechaSiembra"] == "2025-11-10"
        assert sent["grupoMadurez"] == "IV corto"
        assert sent["cultivar"] == "DM 40R16"
        page.close()
        context.close()
    browser.close()

print("phenology flow desktop/mobile: ok")
