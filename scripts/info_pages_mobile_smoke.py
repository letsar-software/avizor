from playwright.sync_api import sync_playwright

ROUTES = ["/bibliografia", "/privacidad", "/alcance-limitaciones", "/estado-sistema"]
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    for route in ROUTES:
        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.goto(f"http://localhost:3507{route}", wait_until="networkidle")
        assert page.locator("h1").count() == 1
        assert page.get_by_role("navigation", name="Navegación principal móvil").count() == 0
        assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth"), route
        if route == "/privacidad":
            first = page.get_by_role("button", name="1. Qué datos recopilamos")
            assert first.get_attribute("aria-expanded") == "true"
            second = page.get_by_role("button", name="2. Qué NO recopilamos")
            second.click()
            assert second.get_attribute("aria-expanded") == "true"
        page.close()
    browser.close()
    print("mobile information pages smoke: OK")
