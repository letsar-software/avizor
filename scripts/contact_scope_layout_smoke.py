from pathlib import Path

from playwright.sync_api import sync_playwright


BASE_URL = "http://127.0.0.1:3518"


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    for width, height, suffix in ((1200, 850, "desktop"), (390, 844, "mobile")):
        page = browser.new_page(viewport={"width": width, "height": height})
        page.goto(f"{BASE_URL}/contacto", wait_until="networkidle")
        assert page.get_by_text("Respondemos en 24 a 48 horas hábiles.", exact=True).count() == 0
        assert page.get_by_text("Horario de respuesta", exact=True).count() == 1
        privacy = page.get_by_text(
            "Tu información está segura. No compartimos tus datos con terceros.", exact=True
        )
        assert privacy.count() == 1
        assert privacy.locator("xpath=..").locator("svg").count() == 1
        assert page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth") <= 1
        Path("screenshots").mkdir(exist_ok=True)
        page.screenshot(path=f"docs/screenshots/contact-{suffix}-centered.png", full_page=True)
        page.close()

    page = browser.new_page(viewport={"width": 1000, "height": 800})
    page.goto(f"{BASE_URL}/alcance-limitaciones", wait_until="networkidle")
    notice = page.locator("main > p.flex.items-center").first
    align_items = notice.evaluate("element => getComputedStyle(element).alignItems")
    justify_content = notice.evaluate("element => getComputedStyle(element).justifyContent")
    assert align_items == "center", align_items
    assert justify_content == "center", justify_content
    page.screenshot(path="docs/screenshots/scope-notice-centered.png", full_page=True)
    browser.close()

print("Contact and scope layout checks passed")
