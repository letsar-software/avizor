from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3516"

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1146, "height": 900})
    page.goto(BASE, wait_until="networkidle")
    page.locator("footer").wait_for(state="visible")

    nav = page.get_by_role("navigation", name="Navegación principal")
    for label in ("Inicio", "Metodología", "Sobre Avizor", "Contacto"):
        link = nav.get_by_role("link", name=label, exact=True)
        assert link.is_visible(), label
        weight = int(link.evaluate("el => getComputedStyle(el).fontWeight"))
        assert weight >= 700, (label, weight)

    assert page.get_by_role("heading", name="¿Cómo funciona Avizor?").is_visible()
    arrows = page.locator("section").filter(has_text="¿Cómo funciona Avizor?").locator("svg")
    assert arrows.count() >= 3

    assert page.get_by_role("heading", name="Tecnología + conocimiento agronómico").is_visible()
    footer_logo = page.locator("footer img[src*='logo-avizor-footer.svg']").first
    assert footer_logo.is_visible()
    assert footer_logo.evaluate("el => getComputedStyle(el).objectFit") == "contain"
    assert page.locator("footer").get_by_text("Recursos", exact=True).is_visible()
    assert page.locator("header").get_by_text("Recursos", exact=True).is_hidden()
    assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
    page.screenshot(path="docs/screenshots/home-desktop-aligned.png", full_page=True)

    page.goto(f"{BASE}/consultar", wait_until="networkidle")
    page.get_by_role("button", name="Quiero mejorar la precisión").wait_for(state="visible")
    page.get_by_role("button", name="Quiero mejorar la precisión").click()
    date_input = page.locator("#planting-date")
    date_input.wait_for(state="visible")
    assert date_input.get_attribute("type") == "date"
    assert "modern-date-input" in (date_input.get_attribute("class") or "")
    assert page.locator("#planting-date + span svg").is_visible()
    page.screenshot(path="docs/screenshots/consult-calendar-modern.png", full_page=True)
    browser.close()

print("home desktop alignment: ok")
