from playwright.sync_api import sync_playwright

CATEGORIES = ["heladas", "enfermedades_foliares", "estres_hidrico", "exceso_hidrico"]
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    for route in CATEGORIES:
        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.goto(f"http://localhost:3510/resultado/{route}", wait_until="networkidle")
        assert page.get_by_role("heading", name="Necesitamos una consulta actualizada").is_visible()
        assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
        page.close()
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.goto("http://localhost:3510/explicacion-resultado", wait_until="networkidle")
    assert page.locator("h1").get_by_text("¿Qué significa este resultado?").is_visible()
    assert page.get_by_text("Variables evaluadas (5 días)").is_visible()
    assert page.get_by_text("Análisis de la regla").is_visible()
    page.close()
    browser.close()
    print("result screens mobile smoke: OK")
