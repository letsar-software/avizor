from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3514"

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    page.goto(f"{BASE}/consultar", wait_until="networkidle")
    page.locator("#place").fill("Tandil, Buenos Aires")
    page.get_by_role("button", name="Consultar", exact=True).click()
    page.wait_for_url("**/resultado", timeout=60000)
    page.get_by_text("¿Querés mejorar la precisión del análisis?").wait_for()
    page.get_by_role("button", name="Completar datos del cultivo").click()
    page.locator('input[type="date"]').fill("2026-08-21")
    page.get_by_label("Grupo de madurez").select_option("IV corto")
    page.get_by_role("button", name="Recalcular análisis").click()
    page.get_by_role("heading", name="Contexto fenológico estimado").wait_for(timeout=30000)
    image = page.locator('img[alt^="Ilustración del estadio"]')
    image.scroll_into_view_if_needed()
    image.wait_for(state="visible")
    assert image.evaluate("el => el.complete && el.naturalWidth > 0")
    assert page.get_by_role("link", name="Ver fenología completa").is_visible()
    page.screenshot(path="screenshots/phenology-context-image.png", full_page=True)
    browser.close()

print("phenology context image: ok")
