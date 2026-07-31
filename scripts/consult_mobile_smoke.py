from playwright.sync_api import sync_playwright

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.goto("http://localhost:3509/consultar", wait_until="networkidle")
    assert page.get_by_role("heading", name="Realizá una consulta").is_visible()
    illustration = page.get_by_label("Variables climáticas analizadas")
    form = page.locator("form")
    assert illustration.bounding_box()["y"] < form.bounding_box()["y"]
    assert page.get_by_label("Cultivo").input_value() == "soja"
    assert page.get_by_label("Localidad").input_value() == "Tandil, Buenos Aires"
    assert page.get_by_role("button", name="Consultar").is_visible()
    assert page.get_by_text("Sin cuenta, sin complicaciones").is_visible()
    assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
    browser.close()
    print("consultation mobile smoke: OK")
