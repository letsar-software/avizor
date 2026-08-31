from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3514"
LINKEDIN = "https://www.linkedin.com/in/lauraalvarezzunino/"

with sync_playwright() as p:
    browser = p.chromium.launch()
    for viewport in ({"width": 390, "height": 844}, {"width": 1440, "height": 1000}):
        page = browser.new_page(viewport=viewport)
        page.goto(f"{BASE}/sobre-avizor", wait_until="networkidle")
        card = page.get_by_role("heading", name="Laura Alvarez Zunino").locator("xpath=../..")
        assert card.get_by_text("Diseñadora UX/UI", exact=True).is_visible()
        assert card.get_by_role("link", name="Ver perfil en LinkedIn").get_attribute("href") == LINKEDIN
        image = card.get_by_alt_text("Ilustración de Laura Alvarez Zunino")
        assert image.is_visible()
        assert image.evaluate("el => el.complete && el.naturalWidth > 0")
        assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
        page.close()
    browser.close()

print("Laura about card desktop/mobile: ok")
