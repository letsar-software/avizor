import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3514"
STAGES = ["E", "R1", "R3", "R5", "R7"]
HITOS = [
    {"codigo": "E", "nombre": "Emergencia", "fecha_estimada": "2026-08-20"},
    {"codigo": "R1", "nombre": "Inicio de floración", "fecha_estimada": "2026-10-09"},
    {"codigo": "R3", "nombre": "Inicio de formación de vainas", "fecha_estimada": "2026-10-30"},
    {"codigo": "R5", "nombre": "Inicio de llenado de granos", "fecha_estimada": "2026-11-24"},
    {"codigo": "R7", "nombre": "Inicio de madurez fisiológica", "fecha_estimada": "2027-01-03"},
]

def payload(stage):
    return {"fenologia": {"estadio_actual_estimado": stage, "nombre_estadio": stage,
        "fecha_estimada": "2026-10-09", "fecha_inicio_estimada": "2026-10-05", "fecha_fin_estimada": "2026-10-13",
        "margen_dias": 4, "confianza": "baja", "metodo": "modelo_calendario_grupo_madurez", "version": "v1.0",
        "fecha_siembra": "2026-08-21", "grupo_madurez": "IV corto", "hitos": HITOS}}

Path("screenshots").mkdir(exist_ok=True)
with sync_playwright() as p:
    browser = p.chromium.launch()
    for width in [320, 360, 375, 390, 430]:
        for stage_index, stage in enumerate(STAGES):
            page = browser.new_page(viewport={"width": width, "height": 900})
            value = json.dumps(payload(stage), ensure_ascii=False)
            page.goto(BASE, wait_until="networkidle")
            page.evaluate("value => sessionStorage.setItem('avizor_resultado', value)", value)
            page.goto(f"{BASE}/resultado/fenologia", wait_until="networkidle")
            page.locator("h1").wait_for()
            page.locator("[data-stage-marker]").first.wait_for()
            assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
            complete = page.locator('[data-mobile-track="complete"]').count()
            future = page.locator('[data-mobile-track="future"]').count()
            assert complete == stage_index + 1, (width, stage, complete, future)
            assert future == len(STAGES) - stage_index - 1, (width, stage, complete, future)
            for marker in page.locator("[data-stage-marker]").all():
                line = marker.locator("xpath=ancestor::article/*[@data-mobile-track]").bounding_box()
                dot = marker.bounding_box()
                delta = abs((line["x"] + line["width"] / 2) - (dot["x"] + dot["width"] / 2)) if line and dot else 999
                assert line and dot and delta < 1, (width, stage, marker.get_attribute("data-stage-marker"), line, dot, delta)
            actions = [item.bounding_box() for item in page.locator("[data-stage-actions]").all()]
            assert all(item and item["width"] == actions[0]["width"] for item in actions)
            active_article = page.locator("article").filter(has=page.locator(f'[data-stage-marker="{stage}"]'))
            active_article.locator("button").click()
            panel = active_article.locator("[data-mobile-expanded-panel]").bounding_box()
            expanded_line = active_article.locator("[data-mobile-expanded-track]").bounding_box()
            marker = active_article.locator(f'[data-stage-marker="{stage}"]').bounding_box()
            badge_font = float(page.locator("[data-current-badge]").evaluate("element => getComputedStyle(element).fontSize.replace('px', '')"))
            assert panel and panel["height"] <= 190
            expanded_delta = abs((expanded_line["x"] + expanded_line["width"] / 2) - (marker["x"] + marker["width"] / 2)) if expanded_line and marker else 999
            assert expanded_line and marker and expanded_delta < 1, (width, stage, expanded_line, marker, expanded_delta)
            assert active_article.locator("[data-mobile-expanded-track]").get_attribute("data-mobile-expanded-track") == "complete"
            assert badge_font >= 12
            assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
            if width == 390 and stage == "R3":
                page.screenshot(path="screenshots/fenologia-responsive-mobile.png", full_page=True)
            page.close()
    for stage_index, stage in enumerate(STAGES):
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        value = json.dumps(payload(stage), ensure_ascii=False)
        page.goto(BASE, wait_until="networkidle")
        page.evaluate("value => sessionStorage.setItem('avizor_resultado', value)", value)
        page.goto(f"{BASE}/resultado/fenologia", wait_until="networkidle")
        expected = stage_index / (len(STAGES) - 1)
        track, progress = page.locator("[data-desktop-track]").bounding_box(), page.locator("[data-desktop-progress]").bounding_box()
        critical = page.locator("[data-critical-period]").bounding_box()
        critical_label = page.locator("[data-critical-label]").bounding_box()
        r1, r7 = page.locator('[data-desktop-stage="R1"]').bounding_box(), page.locator('[data-desktop-stage="R7"]').bounding_box()
        active_card = page.locator(f'[data-desktop-stage="{stage}"]').bounding_box()
        active_margin = page.locator("[data-active-margin]").bounding_box()
        dates = [item.bounding_box() for item in page.locator("[data-stage-date]").all()]
        assert track and progress and critical and critical_label and r1 and r7 and active_card and active_margin
        assert abs(progress["width"] - track["width"] * expected) < 1
        assert critical["x"] >= r1["x"] + r1["width"] - 1
        assert critical["x"] + critical["width"] <= r7["x"] + 1
        assert critical["y"] + critical["height"] - (track["y"] + track["height"]) >= 18
        assert abs((critical_label["x"] + critical_label["width"] / 2) - (critical["x"] + critical["width"] / 2)) < 1
        assert active_card["y"] + active_card["height"] - (active_margin["y"] + active_margin["height"]) >= 14
        assert all(item and item["y"] > critical["y"] + critical["height"] for item in dates)
        assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
        if stage in ("R1", "R3"):
            page.screenshot(path=f"screenshots/fenologia-responsive-desktop-{stage.lower()}.png", full_page=True)
        page.close()
    browser.close()
print("phenology responsive matrix (5 stages, 5 mobile widths, desktop): ok")
