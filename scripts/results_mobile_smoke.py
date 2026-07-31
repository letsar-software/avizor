from playwright.sync_api import sync_playwright

CATEGORIES = {
    "heladas": "Heladas",
    "enfermedades_foliares": "Enfermedades foliares",
    "estres_hidrico": "Estrés hídrico",
    "exceso_hidrico": "Exceso hídrico",
}
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    for route, title in CATEGORIES.items():
        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.goto(f"http://localhost:3510/resultado/{route}", wait_until="networkidle")
        assert page.locator("h1").get_by_text(title, exact=True).is_visible()
        assert page.locator("p").filter(has_text="Período analizado").first.is_visible()
        assert page.get_by_role("navigation", name="Categorías evaluadas").is_visible()
        assert page.get_by_text("Fuente y evidencia").count() == 1
        assert not page.get_by_text("Fuente y evidencia").is_visible()
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
