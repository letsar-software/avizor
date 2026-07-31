from playwright.sync_api import sync_playwright

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.goto("http://localhost:3504/metodologia", wait_until="networkidle")
    assert page.get_by_role("heading", name="Nuestra metodología").is_visible()
    assert page.get_by_role("heading", name="¿Cómo generamos las señales?").is_visible()
    assert page.get_by_role("heading", name="Qué es Avizor").is_visible()
    assert page.get_by_role("heading", name="Qué NO es Avizor").is_visible()
    accordions = page.locator('button[aria-expanded]')
    assert accordions.count() >= 4
    first = page.get_by_role("button", name="Estado general")
    assert first.get_attribute("aria-expanded") == "false"
    first.click()
    assert first.get_attribute("aria-expanded") == "true"
    assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
    browser.close()
    print("methodology mobile smoke: OK")
