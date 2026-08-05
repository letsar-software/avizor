from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3000"
OUT = Path("screenshots")
OUT.mkdir(exist_ok=True)

def run(viewport, suffix):
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport=viewport)
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
        page.goto(f"{BASE}/consultar", wait_until="domcontentloaded", timeout=60000)
        page.wait_for_load_state("networkidle")
        page.locator("#place").fill("Tandil, Buenos Aires")
        page.get_by_role("button", name="Consultar", exact=True).click()
        try:
            page.wait_for_url("**/resultado", timeout=30000)
        except Exception:
            print(page.locator("body").inner_text())
            page.screenshot(path=str(OUT / f"backend-v2-failure-{suffix}.png"), full_page=True)
            raise
        page.wait_for_load_state("networkidle")
        page.locator("h1").first.wait_for(timeout=15000)
        body = page.locator("body").inner_text()
        assert "20/06/2026" not in body
        assert "Última actualización" in body
        assert "Open-Meteo" in body
        assert "Variables clave" in body
        page.screenshot(path=str(OUT / f"backend-v2-result-{suffix}.png"), full_page=True)
        page.get_by_role("link", name="Enfermedades foliares").first.click()
        page.wait_for_url("**/resultado/enfermedades_foliares")
        page.get_by_role("heading", name="Enfermedades foliares").first.wait_for()
        detail = page.locator("body").inner_text()
        assert "20/06/2026" not in detail
        assert "Comparación con la regla" in detail
        page.screenshot(path=str(OUT / f"backend-v2-detail-{suffix}.png"), full_page=True)
        assert not errors, f"Console errors: {errors}"
        browser.close()

run({"width": 1440, "height": 1000}, "desktop")
run({"width": 390, "height": 844}, "mobile")
print("backend_v2_ui_e2e: ok")
