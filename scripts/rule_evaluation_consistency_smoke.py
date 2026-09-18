from playwright.sync_api import sync_playwright


BASE_URL = "http://127.0.0.1:3521"


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    page.goto(f"{BASE_URL}/resultado", wait_until="networkidle")
    assert page.get_by_role("heading", name="No encontramos un resultado actualizado").is_visible()
    assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")

    detail = browser.new_page(viewport={"width": 1440, "height": 1000})
    detail.goto(f"{BASE_URL}/resultado/enfermedades_foliares", wait_until="networkidle")
    assert detail.get_by_role("heading", name="Necesitamos una consulta actualizada").is_visible()
    assert detail.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
    browser.close()

print("Rule evaluation empty-state routes render without overflow")
