import json
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3514"
data = {
    "estadio_actual_estimado": "R1", "nombre_estadio": "Inicio de floración",
    "fecha_estimada": "2026-10-09", "fecha_inicio_estimada": "2026-10-05", "fecha_fin_estimada": "2026-10-13",
    "margen_dias": 4, "confianza": "baja", "metodo": "modelo_calendario_grupo_madurez", "version": "v1.0",
    "fecha_siembra": "2026-08-21", "grupo_madurez": "IV corto",
    "hitos": [
        {"codigo": "E", "nombre": "Emergencia", "fecha_estimada": "2026-08-20"},
        {"codigo": "R1", "nombre": "Inicio de floración", "fecha_estimada": "2026-10-09"},
        {"codigo": "R3", "nombre": "Inicio de formación de vainas", "fecha_estimada": "2026-10-30"},
        {"codigo": "R5", "nombre": "Inicio de llenado de granos", "fecha_estimada": "2026-11-24"},
        {"codigo": "R7", "nombre": "Inicio de madurez fisiológica", "fecha_estimada": "2027-01-03"},
    ],
}

Path("screenshots").mkdir(exist_ok=True)
with sync_playwright() as p:
    browser = p.chromium.launch()
    for width, height, name in [(390, 844, "mobile"), (1440, 1000, "desktop")]:
        page = browser.new_page(viewport={"width": width, "height": height})
        payload = json.dumps({"fenologia": data})
        page.add_init_script(f"sessionStorage.setItem('avizor_resultado', JSON.stringify({payload}))")
        page.goto(f"{BASE}/resultado/fenologia", wait_until="networkidle")
        page.get_by_role("heading", name="Fenología estimada del cultivo").wait_for()
        assert page.locator("img[src*='/phenology/']").count() >= 5
        assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
        if name == "mobile":
            stage_button = page.get_by_role("button", name="R3 Inicio de formación de vainas")
            stage_button.click()
            assert stage_button.get_attribute("aria-expanded") == "true"
            page.get_by_role("button", name="Abrir menú").click()
            assert page.get_by_role("button", name="Información").is_visible()
        page.screenshot(path=f"screenshots/fenologia-handoff-{name}.png", full_page=True)
        page.close()
    browser.close()
print("phenology handoff visual desktop/mobile: ok")
