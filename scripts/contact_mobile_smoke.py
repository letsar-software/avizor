from playwright.sync_api import sync_playwright

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.goto("http://localhost:3506/contacto", wait_until="networkidle")
    assert page.locator("h1").get_by_text("Contacto", exact=True).is_visible()
    assert page.get_by_role("heading", name="Escribinos").is_visible()
    assert page.get_by_role("link", name="Seguinos en LinkedIn").is_visible()
    assert page.get_by_label("Nombre (opcional)").is_visible()
    assert page.get_by_label("Email", exact=True).is_visible()
    assert page.get_by_label("Asunto").is_visible()
    assert page.get_by_label("Mensaje").is_visible()
    assert page.get_by_role("button", name="Enviar mensaje").is_visible()
    assert page.get_by_text("Tu información está segura.").is_visible()
    assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
    browser.close()
    print("contact mobile smoke: OK")
