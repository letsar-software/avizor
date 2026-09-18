from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3511"

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.goto(f"{BASE}/resultado", wait_until="networkidle")
    assert page.get_by_role("heading", name="No encontramos un resultado actualizado").is_visible()
    assert page.get_by_role("link", name="Realizar consulta").is_visible()
    overflow = page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")
    assert not overflow, "La pantalla tiene desborde horizontal"
    page.screenshot(path="docs/screenshots/result-summary-mobile.png", full_page=True)
    browser.close()

print("result summary mobile smoke: ok")
