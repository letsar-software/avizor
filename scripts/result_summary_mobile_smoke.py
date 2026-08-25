import json
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3511"

result = {
    "estado_general": "Atención recomendada",
    "confianza": "Alta",
    "dias_datos": 14,
    "categorias": [
        {"nombre": "heladas", "condicion": "desfavorable", "causas": [], "recomendacion": "", "regla_version": "v1"},
        {"nombre": "enfermedades_foliares", "condicion": "desfavorable", "causas": [], "recomendacion": "", "regla_version": "v1"},
        {"nombre": "estres_hidrico", "condicion": "moderada", "causas": [], "recomendacion": "", "regla_version": "v1"},
        {"nombre": "exceso_hidrico", "condicion": "favorable", "causas": [], "recomendacion": "", "regla_version": "v1"},
    ],
    "share_token": "mobile-test",
    "clima_resumen": {
        "lluvia_14d_mm": 15.5,
        "dias_lluvia_14d": 6,
        "humedad_media_14d": 86.1,
        "temp_media_14d": 9.3,
        "temp_min_14d": 6.2,
    },
}
query = {"localidad": "Tandil, Buenos Aires", "cultivo": "soja", "createdAt": "2026-06-20T09:30:00"}

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.goto(BASE)
    page.evaluate("([r,q]) => { sessionStorage.setItem('avizor_resultado', r); sessionStorage.setItem('avizor_consulta', q); }", [json.dumps(result), json.dumps(query)])
    page.goto(f"{BASE}/resultado", wait_until="networkidle")
    expected = [
        "Atención recomendada",
        "Resumen por categoría",
        "Variables clave (14 días)",
        "Evolución de precipitación acumulada",
        "Comparación con las reglas",
        "¿Cómo evaluó Avizor esta regla?",
        "Fuente y evidencia",
        "Qué observar",
        "Limitaciones de esta evaluación",
        "Calidad de los datos",
    ]
    for text in expected:
        assert page.get_by_text(text, exact=True).first.is_visible(), text
    overflow = page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")
    assert not overflow, "La pantalla tiene desborde horizontal"
    page.screenshot(path="docs/screenshots/result-summary-mobile.png", full_page=True)
    browser.close()

print("result summary mobile smoke: ok")
