from playwright.sync_api import sync_playwright

ROUTES = ["/", "/consultar", "/historial", "/metodologia", "/bibliografia", "/sobre-avizor", "/explicacion-resultado", "/privacidad", "/alcance-limitaciones", "/novedades", "/contacto", "/estado-sistema", "/resultado/heladas", "/resultado/enfermedades_foliares", "/resultado/estres_hidrico", "/resultado/exceso_hidrico"]
VIEWPORTS = [(320, 568), (360, 800), (390, 844), (412, 915), (768, 1024), (1440, 900)]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    errors = []
    for width, height in VIEWPORTS:
        for route in ROUTES:
            page = browser.new_page(viewport={"width": width, "height": height})
            page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
            response = page.goto(f"http://localhost:3500{route}", wait_until="networkidle", timeout=30000)
            assert response and response.ok, f"HTTP failure {route} at {width}px"
            assert page.locator("h1").count() == 1, f"Missing/duplicate h1 {route} at {width}px"
            assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth"), f"Horizontal scroll {route} at {width}px"
            page.close()
        if width < 1024:
            page = browser.new_page(viewport={"width": width, "height": height})
            page.goto("http://localhost:3500/", wait_until="networkidle")
            page.get_by_role("button", name="Abrir menú").click()
            assert page.get_by_role("navigation", name="Menú móvil").is_visible()
            page.close()
    browser.close()
    if errors:
        raise AssertionError("Console errors: " + " | ".join(errors))
    print("public routes responsive smoke: OK")







