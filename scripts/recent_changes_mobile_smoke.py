from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3515"

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width":390,"height":844})

    page.goto(f"{BASE}/sobre-avizor", wait_until="networkidle")
    people = {
        "Andrea Alvarez Zunino": "https://www.linkedin.com/in/andrea-alvarez-zunino",
        "Ezequiel Romeo": "https://www.linkedin.com/in/ezequiel-romeo/",
        "Natali Lazzaro": "https://www.linkedin.com/in/natali-lazzaro-16702738/",
    }
    for name, href in people.items():
        heading = page.get_by_role("heading", name=name, exact=True)
        assert heading.is_visible()
        article = heading.locator("xpath=ancestor::article")
        assert article.get_by_role("link", name="Ver perfil en LinkedIn").get_attribute("href") == href
    assert page.get_by_text("Tecnología, desarrollo de producto y conocimiento agronómico", exact=False).is_visible()
    assert page.locator('img[src*="logo-mod-avizor.png"]').first.is_visible()
    assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")

    page.goto(f"{BASE}/consultar", wait_until="networkidle")
    page.get_by_role("button", name="Quiero mejorar la precisión").click()
    for selector in ("#planting-date", "#maturity-group", "#cultivar"):
        assert page.locator(selector).is_visible()
    assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")

    page.goto(f"{BASE}/resultado/fenologia", wait_until="networkidle")
    assert page.get_by_role("heading", name="Completá los datos del cultivo").is_visible()
    assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
    browser.close()

print("recent mobile changes: ok")
