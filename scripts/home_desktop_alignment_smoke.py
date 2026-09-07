from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:3516"

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width":1146,"height":900})
    page.goto(BASE, wait_until="domcontentloaded")
    page.locator("footer").wait_for(state="visible")

    nav = page.get_by_role("navigation", name="Navegación principal")
    links = nav.get_by_role("link").all()
    assert len(links) == 4
    weights = [int(link.evaluate("el => getComputedStyle(el).fontWeight")) for link in links]
    assert min(weights) >= 700

    process = page.get_by_role("heading", name="¿Cómo funciona Avizor?").locator("xpath=following-sibling::div[2]")
    assert process.is_visible()
    arrows = process.locator("svg")
    assert arrows.count() == 3
    arrow_centers = [arrows.nth(i).bounding_box()["y"] + arrows.nth(i).bounding_box()["height"] / 2 for i in range(3)]
    assert max(arrow_centers) - min(arrow_centers) < 2

    technology = page.get_by_role("heading", name="Tecnología + conocimiento agronómico")
    paragraph = technology.locator("xpath=following-sibling::p")
    line_height = float(paragraph.evaluate("el => parseFloat(getComputedStyle(el).lineHeight)"))
    assert paragraph.bounding_box()["height"] <= line_height * 1.15

    footer_logo = page.locator("footer img[src*='logo-avizor-footer.svg']").first
    assert footer_logo.is_visible()
    logo_box = footer_logo.bounding_box()
    assert logo_box and 185 <= logo_box["width"] <= 195
    assert footer_logo.evaluate("el => getComputedStyle(el).objectFit") == "contain"
    assert page.locator("footer").get_by_text("Recursos", exact=True).is_visible()
    assert page.locator("header").get_by_text("Recursos", exact=True).is_hidden()
    assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth")
    page.screenshot(path="docs/screenshots/home-desktop-aligned.png", full_page=True)

    page.goto(f"{BASE}/consultar", wait_until="domcontentloaded")
    page.get_by_role("button", name="Quiero mejorar la precisión").wait_for(state="visible")
    page.get_by_role("button", name="Quiero mejorar la precisión").click()
    date_input = page.locator("#planting-date")
    assert date_input.is_visible()
    assert date_input.get_attribute("type") == "date"
    assert "modern-date-input" in (date_input.get_attribute("class") or "")
    assert page.locator("#planting-date + span svg").is_visible()
    page.screenshot(path="docs/screenshots/consult-calendar-modern.png", full_page=True)
    browser.close()

print("home desktop alignment: ok")
