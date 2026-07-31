from playwright.sync_api import sync_playwright

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.goto("http://localhost:3503/", wait_until="networkidle")
    assert page.get_by_role("heading", name="La señal antes del problema.").is_visible()
    assert page.get_by_role("button", name="Abrir menú").is_visible()
    assert page.get_by_role("navigation", name="Navegación principal móvil").count() == 0
    assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
    page.get_by_role("button", name="Abrir menú").click()
    menu = page.get_by_role("navigation", name="Menú móvil")
    assert menu.is_visible()
    assert menu.get_by_role("link", name="Inicio").is_visible()
    assert menu.get_by_role("link", name="Metodología").is_visible()
    assert menu.get_by_role("link", name="Sobre Avizor").is_visible()
    assert menu.get_by_role("link", name="Contacto").is_visible()
    assert menu.get_by_role("link", name="Realizar consulta").is_visible()
    page.get_by_role("button", name="Cerrar menú").click()
    assert not menu.is_visible()
    browser.close()
    print("home mobile closed/open menu smoke: OK")
