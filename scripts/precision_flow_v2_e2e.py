from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3000"
OUT = Path("screenshots")
OUT.mkdir(exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1100})
    page.goto(f"{BASE}/consultar", wait_until="networkidle", timeout=60000)
    page.locator("#place").fill("Tandil, Buenos Aires")
    page.get_by_role("button", name="Consultar", exact=True).click()
    page.wait_for_url("**/resultado", timeout=30000)
    page.wait_for_load_state("networkidle")
    page.get_by_text("¿Querés mejorar la precisión del análisis?").wait_for()
    page.get_by_role("button", name="Completar datos del cultivo").click()
    page.locator('input[type="date"]').fill("2026-05-01")
    page.get_by_label("Grupo de madurez").select_option("IV corto")
    page.get_by_label("Cultivar").fill("DM 40R16")
    page.get_by_role("button", name="Recalcular análisis").click()
    page.get_by_role("heading", name="R3 · Inicio de formación de vainas").wait_for(timeout=30000)
    page.screenshot(path=str(OUT / "precision-result-desktop.png"), full_page=True)
    page.get_by_role("link", name="Ver fenología").click()
    page.wait_for_url("**/resultado/fenologia")
    page.get_by_text("R3", exact=True).first.wait_for()
    assert "DM 40R16" in page.locator("body").inner_text()
    page.screenshot(path=str(OUT / "precision-detail-desktop.png"), full_page=True)
    browser.close()

print("precision_flow_v2_e2e: ok")