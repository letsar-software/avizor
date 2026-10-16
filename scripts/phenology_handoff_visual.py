import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3514"
HITOS = [
    {"codigo": "E", "nombre": "Emergencia", "fecha_estimada": "2026-08-20"},
    {"codigo": "R1", "nombre": "Inicio de floración", "fecha_estimada": "2026-10-09"},
    {"codigo": "R3", "nombre": "Inicio de formación de vainas", "fecha_estimada": "2026-10-30"},
    {"codigo": "R5", "nombre": "Inicio de llenado de granos", "fecha_estimada": "2026-11-24"},
    {"codigo": "R7", "nombre": "Inicio de madurez fisiológica", "fecha_estimada": "2027-01-03"},
]


def payload(stage):
    return {"fenologia": {
        "estadio_actual_estimado": stage, "nombre_estadio": stage,
        "fecha_estimada": "2026-10-09", "fecha_inicio_estimada": "2026-10-05",
        "fecha_fin_estimada": "2026-10-13", "margen_dias": 4, "confianza": "baja",
        "metodo": "modelo_calendario_grupo_madurez", "version": "v1.0",
        "fecha_siembra": "2026-08-21", "grupo_madurez": "IV corto", "hitos": HITOS,
    }}


Path("screenshots").mkdir(exist_ok=True)
with sync_playwright() as p:
    browser = p.chromium.launch()
    for width, height, stage in ((390, 900, "R3"), (1440, 1000, "R3")):
        page = browser.new_page(viewport={"width": width, "height": height})
        page.goto(BASE, wait_until="networkidle")
        page.evaluate("value => sessionStorage.setItem('avizor_resultado', value)", json.dumps(payload(stage), ensure_ascii=False))
        page.goto(f"{BASE}/resultado/fenologia", wait_until="networkidle")
        page.get_by_role("heading", name="Fenología estimada del cultivo").wait_for()
        assert page.locator("[data-stage-marker]").count() == len(HITOS) or page.locator("[data-desktop-stage]").count() == len(HITOS)
        assert page.get_by_text("IV corto", exact=True).is_visible()
        assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth"), width
        if width < 1024:
            active = page.locator("article").filter(has=page.locator(f'[data-stage-marker="{stage}"]'))
            active.locator("button").click()
            assert active.locator("[data-mobile-expanded-panel]").is_visible()
            page.screenshot(path="screenshots/fenologia-responsive-mobile.png", full_page=True)
        else:
            assert page.locator("[data-desktop-track]").is_visible()
            assert page.locator(f'[data-desktop-stage="{stage}"]').is_visible()
            page.screenshot(path="screenshots/fenologia-responsive-desktop-r3.png", full_page=True)
        page.close()
    browser.close()
print("phenology responsive matrix (mobile + desktop): ok")
