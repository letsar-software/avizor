from playwright.sync_api import sync_playwright

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.goto("http://localhost:3505/sobre-avizor", wait_until="networkidle")
    assert page.get_by_role("heading", name="Tecnología y conocimiento al servicio del productor").is_visible()
    assert page.get_by_role("heading", name="Detrás de Avizor").is_visible()
    assert page.get_by_role("heading", name="Natali").is_visible()
    assert page.get_by_role("heading", name="El proyecto").is_visible()
    assert page.get_by_text("+150", exact=True).is_visible()
    footer = page.locator("footer")
    assert footer.get_by_role("link", name="Bibliografía").is_visible()
    assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
    browser.close()
    print("about mobile smoke: OK")
