from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3514"

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    page.goto(f"{BASE}/consultar", wait_until="networkidle")
    page.get_by_role("button", name="Quiero mejorar la precisión").click()
    page.locator("#planting-date").fill("2026-08-21")
    page.locator("#maturity-group").select_option(label="IV corto")
    page.get_by_role("button", name="Consultar", exact=True).click()
    page.wait_for_url("**/resultado", timeout=60000)
    image = page.get_by_alt_text("Ilustración del estadio E")
    image.scroll_into_view_if_needed()
    image.wait_for(state="visible")
    assert image.evaluate("el => el.complete && el.naturalWidth > 0")
    assert page.get_by_role("link", name="Ver fenología completa").is_visible()
    page.screenshot(path="screenshots/phenology-context-image.png", full_page=True)
    browser.close()

print("phenology context image: ok")
