from playwright.sync_api import sync_playwright

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    for route in ["/", "/privacidad"]:
        page = browser.new_page(viewport={"width": 390, "height": 844})
        page.goto(f"http://localhost:3508{route}", wait_until="domcontentloaded")
        page.locator("footer").wait_for(state="visible")
        footer = page.locator("footer")
        assert footer.get_by_text("hola@avizor.com.ar").last.is_visible()
        assert footer.get_by_text("Seguinos en LinkedIn").is_visible()
        assert footer.get_by_text("Avizor identifica condiciones ambientales").is_visible()
        assert page.get_by_role("navigation", name="Navegación inferior").count() == 0
        layout_main = page.locator("body > main")
        assert layout_main.evaluate("el => getComputedStyle(el).paddingBottom") == "0px"

        page.get_by_role("button", name="Abrir menú").click()
        mobile_menu = page.get_by_role("navigation", name="Menú móvil")
        assert mobile_menu.is_visible()
        resources = mobile_menu.get_by_role("button", name="Recursos")
        assert resources.get_attribute("aria-expanded") == "false"
        resources.click()
        assert resources.get_attribute("aria-expanded") == "true"
        resource_links = ["Bibliografía", "Privacidad", "Alcance y limitaciones", "Estado del sistema"]
        for label in resource_links:
            assert mobile_menu.get_by_role("link", name=label).is_visible()
        resources.click()
        assert resources.get_attribute("aria-expanded") == "false"
        assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
        page.close()

    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.goto("http://localhost:3508/", wait_until="domcontentloaded")
    page.get_by_role("button", name="Abrir menú").wait_for(state="visible")
    page.get_by_role("button", name="Abrir menú").click()
    page.get_by_role("button", name="Recursos").click()
    page.get_by_role("navigation", name="Menú móvil").get_by_role("link", name="Bibliografía").click()
    page.wait_for_url("**/bibliografia")
    assert page.get_by_role("navigation", name="Menú móvil").is_hidden()
    page.close()

    for width, height in [(320, 568), (768, 900)]:
        page = browser.new_page(viewport={"width": width, "height": height})
        page.goto("http://localhost:3508/", wait_until="domcontentloaded")
        page.get_by_role("button", name="Abrir menú").wait_for(state="visible")
        assert page.get_by_role("navigation", name="Navegación inferior").count() == 0
        assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
        page.get_by_role("button", name="Abrir menú").click()
        mobile_menu = page.get_by_role("navigation", name="Menú móvil")
        mobile_menu.wait_for(state="visible")
        mobile_menu.get_by_role("button", name="Recursos").click()
        assert mobile_menu.get_by_role("link", name="Estado del sistema").is_visible()
        assert mobile_menu.evaluate("el => getComputedStyle(el).overflowY") == "auto"
        page.keyboard.press("Escape")
        assert mobile_menu.is_hidden()
        page.close()
    browser.close()
    print("global mobile footer smoke: OK")
