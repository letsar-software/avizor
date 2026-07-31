from playwright.sync_api import sync_playwright

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    for route in ["/", "/privacidad"]:
        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.goto(f"http://localhost:3508{route}", wait_until="networkidle")
        footer = page.locator("footer")
        assert footer.get_by_text("hola@avizor.com.ar").last.is_visible()
        info = footer.get_by_role("button", name="Información")
        assert info.get_attribute("aria-expanded") == "false"
        info.click()
        assert info.get_attribute("aria-expanded") == "true"
        assert footer.get_by_role("link", name="Bibliografía").is_visible()
        bottom = footer.get_by_role("navigation", name="Navegación inferior")
        assert bottom.get_by_role("link").count() == 4
        assert page.locator('nav[aria-label="Navegación principal móvil"]').count() == 0
        assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
        page.close()
    browser.close()
    print("global mobile footer smoke: OK")
